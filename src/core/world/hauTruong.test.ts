/**
 * Cổng Sổ Hậu Trường — chỗ chuyện mô phỏng chờ tới lượt được kể.
 *
 * Bốn điều phải đúng, và cả bốn đều là điều một hàng đợi tin tức dễ làm sai:
 *
 *   1. output của tác vụ — dù là JSON hay văn xuôi — phải ra được câu KỂ ĐƯỢC;
 *   2. một chuyện chưa kể KHÔNG bị đẩy ra khỏi sổ chỉ vì sổ đầy;
 *   3. hàng đợi trả ra cũ trước mới sau, và trả cùng thứ tự ở mọi máy;
 *   4. đã kể rồi thì không quay lại prompt lần nữa.
 */
import { describe, it, expect } from 'vitest';
import {
  bocGhiChu,
  chuaKe,
  danhDauDaKe,
  docSo,
  GhiChuHauTruongSchema,
  loaiCuaTacVu,
  themGhiChu,
  thongKeSo,
  TRAN_SO_HAU_TRUONG,
} from './hauTruong.js';
import type { GhiChuHauTruong } from './hauTruong.js';

function ghi(id: string, tick: number, daKe = false): GhiChuHauTruong {
  return GhiChuHauTruongSchema.parse({
    id,
    tick,
    loai: 'the_gioi',
    noiDung: `Chuyện ${id}`,
    daKe,
  });
}

// ═══════════════════════════════════════════ bóc output

describe('bocGhiChu — rút câu kể được ra khỏi mọi hình dạng output', () => {
  it('mảng JSON của tác vụ hành động NPC', () => {
    const ra = bocGhiChu(
      'hanh_dong_npc',
      JSON.stringify([
        { id: 'nv_1', hanhDong: 'Lư Mệnh rời làng trước khi trời sáng.' },
        { id: 'nv_2', hanhDong: 'Bạch Đạo đắp lại đoạn đê vỡ.' },
      ]),
      12,
    );
    expect(ra.map((g) => g.noiDung)).toEqual([
      'Lư Mệnh rời làng trước khi trời sáng.',
      'Bạch Đạo đắp lại đoạn đê vỡ.',
    ]);
    expect(ra.every((g) => g.loai === 'hanh_dong')).toBe(true);
    expect(ra[0]?.entityIds).toEqual(['nv_1']);
    expect(ra.every((g) => g.tick === 12 && !g.daKe)).toBe(true);
  });

  it('object bọc quanh một mảng, và rào ```json', () => {
    const ra = bocGhiChu(
      'giai_lo_hong',
      '```json\n{"muc":[{"gapId":"g1","noiDung":"Cái tên bỏ trống ở bến nước đã có người nhận."}]}\n```',
      4,
    );
    expect(ra).toHaveLength(1);
    expect(ra[0]?.noiDung).toBe('Cái tên bỏ trống ở bến nước đã có người nhận.');
    expect(ra[0]?.entityIds).toEqual(['g1']);
  });

  /**
   * `cachGop: 'noi'` của họ bản sao — ba mươi object JSON dán liền nhau.
   *
   * Đây là hình dạng THẬT của tác vụ "Hành động NPC", tác vụ duy nhất mà 50.9
   * bắt buộc bật họ bản sao. Không đọc được nó nghĩa là ba mươi call mỗi lượt
   * quét không sinh ra một câu nào.
   */
  it('nhiều object JSON nối bằng dòng trắng — hình dạng của họ bản sao', () => {
    const out = [
      '{"id":"nv_1","hanhDong":"Người thứ nhất bỏ đi trước khi trời sáng."}',
      '{"id":"nv_2","hanhDong":"Người thứ hai ở lại canh lửa."}',
      '{"id":"nv_3","hanhDong":"Người thứ ba không nói gì suốt buổi."}',
    ].join('\n\n');
    const ra = bocGhiChu('hanh_dong_npc', out, 3);
    expect(ra).toHaveLength(3);
    expect(ra[2]?.noiDung).toBe('Người thứ ba không nói gì suốt buổi.');
    expect(ra[1]?.entityIds).toEqual(['nv_2']);
  });

  /**
   * Object có MẢNG bên trong — đúng khuôn mà tác vụ stage 2 khai ở `dungSan.ts`.
   *
   * Bản đầu cắt từ `[` đầu tới `]` cuối trước khi thử `{…}`, nên `"patch":[]`
   * biến cả object thành một mảng rỗng parse được. Không bài nào bắt được nó vì
   * mọi mẫu test đều là object PHẲNG.
   */
  it('object có mảng lồng bên trong không bị đọc nhầm thành mảng rỗng', () => {
    const ra = bocGhiChu(
      'hanh_dong_npc',
      '{"id":"nv_1","hanhDong":"Người ấy đắp lại đoạn đê trước khi nước lên.","patch":[]}',
      2,
    );
    expect(ra).toHaveLength(1);
    expect(ra[0]?.noiDung).toBe('Người ấy đắp lại đoạn đê trước khi nước lên.');
    expect(ra[0]?.entityIds).toEqual(['nv_1']);
  });

  it('mảng JSON in đẹp có dòng trắng bên trong vẫn đọc được', () => {
    const out =
      '[\n  {\n    "noiDung": "Một điều đã xảy ra ở rất xa."\n  },\n\n  {\n    "noiDung": "Và một điều nữa."\n  }\n]';
    expect(bocGhiChu('thoi_cuc_the_gioi', out, 1).map((g) => g.noiDung)).toEqual([
      'Một điều đã xảy ra ở rất xa.',
      'Và một điều nữa.',
    ]);
  });

  it('văn xuôi thuần — tách theo dòng, bỏ dòng quá ngắn', () => {
    const ra = bocGhiChu(
      'thoi_cuc_the_gioi',
      ['Mùa này', '- Giá muối tăng gấp đôi ở vùng ven biển phía bắc.', '', 'Dịch đã lui khỏi ba làng.'].join(
        '\n',
      ),
      8,
    );
    expect(ra.map((g) => g.noiDung)).toEqual([
      'Giá muối tăng gấp đôi ở vùng ven biển phía bắc.',
      'Dịch đã lui khỏi ba làng.',
    ]);
    expect(ra[0]?.loai).toBe('the_gioi');
  });

  it('không throw với rác, và không đẻ ghi chú rỗng', () => {
    for (const rac of ['', '   ', '{', '[]', '```', '{}', 'ok']) {
      expect(() => bocGhiChu('x', rac, 0)).not.toThrow();
      expect(bocGhiChu('x', rac, 0).every((g) => g.noiDung.trim() !== '')).toBe(true);
    }
  });

  it('giữ trần và bỏ câu trùng trong cùng một output', () => {
    const lap = JSON.stringify(Array.from({ length: 20 }, () => ({ noiDung: 'Cùng một câu lặp lại.' })));
    expect(bocGhiChu('hanh_dong_npc', lap, 1, 6)).toHaveLength(1);

    const khac = JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ noiDung: `Câu thứ ${i} của lô.` })));
    expect(bocGhiChu('hanh_dong_npc', khac, 1, 6)).toHaveLength(6);
  });

  it('id tác vụ lạ vẫn ra ghi chú, rơi về loại thế giới', () => {
    expect(loaiCuaTacVu('tac_vu_nguoi_dung_tu_dung')).toBe('the_gioi');
    expect(loaiCuaTacVu('ket_tinh_thanh_tra')).toBe('quy_luat');
  });

  it('deterministic — cùng output cho cùng ghi chú, kể cả id', () => {
    const out = JSON.stringify([{ id: 'a', hanhDong: 'Một việc đã xảy ra ở đâu đó.' }]);
    expect(JSON.stringify(bocGhiChu('hanh_dong_npc', out, 5))).toBe(
      JSON.stringify(bocGhiChu('hanh_dong_npc', out, 5)),
    );
  });
});

// ═══════════════════════════════════════════ hàng đợi

describe('sổ — hàng đợi giữ chuyện chưa kể trước mọi thứ khác', () => {
  it('không nhận hai lần cùng một câu', () => {
    const a = ghi('g1', 1);
    const b = { ...ghi('g2', 1), noiDung: a.noiDung };
    expect(themGhiChu([a], [b])).toHaveLength(1);
  });

  it('[BB] đầy sổ thì bỏ ghi chú ĐÃ KỂ trước, không bỏ ghi chú chưa ai nghe', () => {
    const cu = [
      ...Array.from({ length: 5 }, (_, i) => ghi(`daKe${i}`, i, true)),
      ...Array.from({ length: 5 }, (_, i) => ghi(`chuaKe${i}`, i)),
    ];
    const moi = Array.from({ length: 3 }, (_, i) => ghi(`moi${i}`, 9));

    const ra = themGhiChu(cu, moi, 10);
    expect(ra).toHaveLength(10);
    // Ba cái bị bỏ đều là hàng đã kể; năm cái chưa kể còn nguyên.
    expect(ra.filter((g) => g.id.startsWith('chuaKe'))).toHaveLength(5);
    expect(ra.filter((g) => g.id.startsWith('daKe'))).toHaveLength(2);
    expect(ra.filter((g) => g.id.startsWith('moi'))).toHaveLength(3);
  });

  it('sổ toàn hàng chưa kể thì mới bỏ cái cũ nhất — và lúc ấy nó đúng là tin cũ', () => {
    const cu = Array.from({ length: 4 }, (_, i) => ghi(`c${i}`, i));
    const ra = themGhiChu(cu, [ghi('moi', 9)], 4);
    expect(ra).toHaveLength(4);
    expect(ra.some((g) => g.id === 'c0')).toBe(false);
    expect(ra.some((g) => g.id === 'moi')).toBe(true);
  });

  it('hàng đợi trả cũ trước mới sau, và cùng thứ tự ở mọi lần gọi', () => {
    const so = [ghi('z', 9), ghi('a', 1), ghi('m', 5), ghi('b', 1)];
    expect(chuaKe(so, 3).map((g) => g.id)).toEqual(['a', 'b', 'm']);
    expect(chuaKe(so, 3).map((g) => g.id)).toEqual(chuaKe(so, 3).map((g) => g.id));
  });

  it('đã kể rồi thì không quay lại hàng đợi', () => {
    const so = [ghi('a', 1), ghi('b', 2), ghi('c', 3)];
    const sau = danhDauDaKe(so, ['a', 'b']);
    expect(chuaKe(sau, 5).map((g) => g.id)).toEqual(['c']);
    // Mảng gốc KHÔNG bị sửa — cùng hợp đồng với `ketNapTu()`.
    expect(so.every((g) => !g.daKe)).toBe(true);
  });

  it('đọc sổ bỏ hàng hỏng thay vì làm sập lượt', () => {
    const tho: unknown[] = [ghi('tot', 1), { id: 'thieu_truong' }, null, 'chuỗi lạc', { loai: 'khong_co' }];
    expect(docSo(tho).map((g) => g.id)).toEqual(['tot']);
  });

  it('thống kê đếm đúng phần chưa kể — đây là con số giao diện hiện', () => {
    const so = [ghi('a', 1, true), ghi('b', 2), ghi('c', 3)];
    const tk = thongKeSo(so);
    expect(tk.tong).toBe(3);
    expect(tk.chuaKe).toBe(2);
    expect(tk.tran).toBe(TRAN_SO_HAU_TRUONG);
    expect(tk.theoLoai.the_gioi).toBe(3);
  });
});
