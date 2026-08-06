/**
 * Chọn hồ sơ model — Phần 31.2.
 *
 * Bài ở đây không kiểm "hàm trả về đúng object": chúng kiểm **hậu quả** của việc
 * chọn sai, vì đó là thứ người chơi thấy. Hồ sơ quyết định tham số nào của preset
 * được gửi đi và ngân sách token của lượt kể, nên một model rơi nhầm về hồ sơ dự
 * phòng là một preset bị cắt bớt mà không ai báo.
 */
import { describe, expect, it } from 'vitest';
import { hoSoChoModel, khopHoSoTheoTen, tranContextDaQuet } from './hoSo.js';
import type { MucHoSo } from './hoSo.js';
import { ModelProfileSchema } from '../schema/ai.js';
import { R, napDungSan } from '../registry/index.js';

function dsRegistry(): MucHoSo[] {
  napDungSan();
  return R.profile.tatCa().map((d) => ({ id: d.id, profile: d.profile }));
}

function duPhong() {
  const p = R.profile.lay('khong_ro')?.profile;
  if (p === undefined) throw new Error('registry thiếu hồ sơ dự phòng');
  return p;
}

describe('khớp hồ sơ theo tên model', () => {
  it('mảnh dài nhất thắng, không phải mảnh đăng ký trước', () => {
    const ds: MucHoSo[] = [
      {
        id: 'chung',
        profile: ModelProfileSchema.parse({ id: 'chung', ten: 'chung', khop: { chua: ['gemini'] } }),
      },
      {
        id: 'rieng',
        profile: ModelProfileSchema.parse({ id: 'rieng', ten: 'riêng', khop: { chua: ['gemini-3.1-pro'] } }),
      },
    ];
    expect(khopHoSoTheoTen('gemini-3.1-pro-preview', ds)?.id).toBe('rieng');
    // Đảo thứ tự vẫn ra cùng kết quả — thứ tự đăng ký không được quyết định gì.
    expect(khopHoSoTheoTen('gemini-3.1-pro-preview', [...ds].reverse())?.id).toBe('rieng');
    expect(khopHoSoTheoTen('gemini-1.5-flash', ds)?.id).toBe('chung');
  });

  it('bắt được tên có tiền tố nhà cung cấp mà proxy gắn thêm', () => {
    const ds = dsRegistry();
    expect(khopHoSoTheoTen('anthropic/claude-sonnet-4.5', ds)?.id).toBe('claude');
    expect(khopHoSoTheoTen('google/gemini-2.5-pro', ds)?.id).toBe('gemini-pro');
    expect(khopHoSoTheoTen('moonshotai/kimi-k2-instruct', ds)?.id).toBe('openweight');
  });

  it('tên rỗng không khớp bừa vào hồ sơ nào', () => {
    expect(khopHoSoTheoTen('', dsRegistry())).toBeNull();
    expect(khopHoSoTheoTen('   ', dsRegistry())).toBeNull();
  });
});

describe('hồ sơ cho một endpoint', () => {
  it('người dùng chọn tay thì lựa chọn ấy thắng cả khớp tên', () => {
    const ds = dsRegistry();
    const kq = hoSoChoModel({ modelId: 'claude-opus-4', profileId: 'gpt' }, ds, duPhong());
    expect(kq.id).toBe('gpt');
  });

  it('profileId trỏ vào hồ sơ không tồn tại thì rơi về khớp tên, không rơi về dự phòng', () => {
    const ds = dsRegistry();
    const kq = hoSoChoModel({ modelId: 'claude-opus-4', profileId: 'khong-co-that' }, ds, duPhong());
    expect(kq.id).toBe('claude');
  });

  it('model lạ mượn trần context mà lần quét endpoint vừa khai', () => {
    const ds = dsRegistry();
    const kq = hoSoChoModel({ modelId: 'mo-hinh-nha-lam', contextMaxDaQuet: 1_000_000 }, ds, duPhong());
    expect(kq.gioiHan.contextMax).toBe(1_000_000);
    // Biết dài bao nhiêu KHÔNG có nghĩa là biết nó nhận min_p — cờ hỗ trợ không đổi.
    expect(kq.hoTro.minP).toBe(duPhong().hoTro.minP);
    expect(kq.hoTro.seed).toBe(duPhong().hoTro.seed);
  });

  it('con số quét vô lý bị bỏ qua, trần dự phòng giữ nguyên', () => {
    const ds = dsRegistry();
    const goc = duPhong().gioiHan.contextMax;
    for (const xau of [0, -5, null, 4_096]) {
      expect(
        hoSoChoModel({ modelId: 'la', contextMaxDaQuet: xau }, ds, duPhong()).gioiHan.contextMax,
        String(xau),
      ).toBe(goc);
    }
    expect(tranContextDaQuet(9e18)).toBe(4_000_000);
  });

  /*
   * Chiều nguy hiểm. Trần dự phòng rộng là điều kiện để preset không bị cắt, và
   * cái giá của nó là một model 32K thật sẽ nhận prompt quá dài rồi hỏng ở tầng
   * HTTP — nơi thông báo lỗi không nói gì về nguyên nhân. Con số của lần quét là
   * thứ duy nhất biết sự thật, nên nó được quyền hạ trần xuống.
   */
  it('proxy khai model ngắn hơn dự phòng thì HẠ trần xuống theo con số thật', () => {
    const ds = dsRegistry();
    const kq = hoSoChoModel({ modelId: 'mo-hinh-nho', contextMaxDaQuet: 32_768 }, ds, duPhong());
    expect(kq.gioiHan.contextMax).toBe(32_768);
    expect(kq.gioiHan.contextMax).toBeLessThan(duPhong().gioiHan.contextMax);
  });

  /*
   * Cổng thật của thay đổi này. Trước đây registry chỉ có một model cụ thể, nên
   * mọi model khác — kể cả những model phổ biến nhất — rơi về `khong_ro` với trần
   * 32K/4K và toàn bộ `hoTro` tắt. Đó là nguyên nhân gốc của "preset nhập vào mà
   * thông số không được áp dụng".
   */
  it('mọi họ model đang lưu hành đều có hồ sơ riêng, không rơi về dự phòng', () => {
    const ds = dsRegistry();
    const ten = [
      'gemini-3.1-pro',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'claude-opus-4-20250514',
      'gpt-5',
      'deepseek-chat',
      'grok-4',
      'qwen3-max',
      'glm-4.6',
      'kimi-k2',
    ];
    for (const t of ten) {
      const p = hoSoChoModel({ modelId: t }, ds, duPhong());
      expect(p.id, `${t} rơi về hồ sơ dự phòng`).not.toBe('khong_ro');
      // Không hồ sơ nào được hẹp hơn ngữ cảnh mà preset thật cần cho tầng 4.
      expect(p.gioiHan.contextMax, t).toBeGreaterThanOrEqual(128_000);
      expect(p.gioiHan.outputMax, t).toBeGreaterThanOrEqual(16_384);
    }
  });

  it('hồ sơ dự phòng cũng đủ rộng để không tự cắt preset', () => {
    expect(duPhong().gioiHan.contextMax).toBeGreaterThanOrEqual(128_000);
    expect(duPhong().gioiHan.outputMax).toBeGreaterThanOrEqual(16_384);
  });
});
