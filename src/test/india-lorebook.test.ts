import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { taoEventLog, taoState } from '../core/engine/state.js';
import { apDungChuoi } from '../core/engine/transaction.js';
import { KhoiTaoWorldSchema, moThuGioi } from '../core/world/khoiTao.js';
import { nhapLorebook } from '../core/lore/nhap.js';
import { renderEjsLore, taoNguCanhEjsLore } from '../core/lore/ejs.js';
import { vatChatHoaLorebook } from '../core/lore/hienThuc.js';
import { trichKyVong } from '../core/lore/kyVong.js';
import { dungChiMuc } from '../core/retrieval/chiMuc.js';
import { moDuBangChungLore } from './lorebook-evidence.js';

function docSach() {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'public/lorebooks/than-thoai-an-do.json'), 'utf8'),
  ) as unknown;
}

function theGioi() {
  const cauHinh = KhoiTaoWorldSchema.parse({
    cua: 'day_du',
    seed: 'india-lorebook',
    worldId: 'w.india',
    branchId: 'br_goc',
  });
  const { world, events } = moThuGioi(cauHinh);
  const state = taoState(world);
  const result = apDungChuoi(state, events, taoEventLog());
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '));
  moDuBangChungLore(state);
  return state;
}

describe('Lorebook dựng sẵn — Thần thoại Ấn Độ', () => {
  it('nhập đủ 100 entry, EJS hợp lệ và mang cấu hình diễn hóa chậm', () => {
    const result = nhapLorebook({
      goc: docSach(),
      id: 'lore.india',
      ten: 'Thần thoại Ấn Độ',
      nguon: 'nguoi_dung',
      branchId: 'br_goc',
    });
    expect(result.ok, JSON.stringify(result.issues.filter((i) => i.severity === 'error'))).toBe(true);
    expect(result.lorebook?.entries).toHaveLength(100);
    expect(result.lorebook).toMatchObject({
      ten: 'Thần thoại Ấn Độ',
      lucHapDan: 72,
      nhipMoGiaiDoan: 8,
      soDiemHutMoiLuot: 2,
      bat: false,
    });
    expect(result.lorebook?.entries.every((e) => e.triHoanHienThuc)).toBe(true);
    expect(result.issues.filter((i) => i.code === 'EJS_HONG')).toHaveLength(0);
    // Chỉ bốn entry điều phối được luôn-bật.
    expect(result.lorebook?.entries.filter((e) => e.lop === 'loi')).toHaveLength(4);
    // Entry lớp `sau` không có keyword thì không bao giờ bắn — đó là entry chết.
    expect(result.lorebook?.entries.filter((e) => e.lop === 'sau' && e.keys.length === 0)).toHaveLength(0);
  });

  /**
   * Ba mươi lăm vị thần KHÔNG được nằm chung một nhóm.
   *
   * Nhóm là `nguonId` lúc truy hồi, và MMR coi hai chunk cùng `nguonId` là trùng
   * mạnh dù chữ khác hẳn. Bản đầu của sách này nhét cả 35 vị vào
   * `nhan_vat_than_thoai`, nghĩa là một cảnh có cả Shiva lẫn Kali sẽ mất một
   * trong hai — không phải vì hết ngân sách mà vì engine tưởng chúng trùng nhau.
   *
   * Ngược lại, mười bốn cõi Loka thì ĐÚNG là nên chung một nhóm: chúng thay thế
   * được cho nhau trong một cảnh, và bày cả thang ra một lượt là hỏng nhịp.
   */
  it('mỗi vị thần là một nguồn riêng, còn thang cõi thì chung một nguồn', () => {
    const book = nhapLorebook({
      goc: docSach(),
      id: 'lore.india',
      ten: 'Thần thoại Ấn Độ',
      nguon: 'nguoi_dung',
      branchId: 'br_goc',
    }).lorebook!;

    const nhanVat = book.entries.filter((e) => e.nhomKichHoat.startsWith('nv_'));
    expect(nhanVat.length).toBeGreaterThanOrEqual(30);
    expect(new Set(nhanVat.map((e) => e.nhomKichHoat)).size).toBe(nhanVat.length);

    const coiGioi = book.entries.filter((e) => e.nhomKichHoat === 'coi_gioi');
    expect(coiGioi.length).toBeGreaterThan(10);

    expect(book.entries.filter((e) => e.nhomKichHoat === '')).toHaveLength(0);
  });

  it('render EJS bằng ngữ cảnh engine nhưng không chạy câu lệnh JavaScript', () => {
    const state = theGioi();
    const imported = nhapLorebook({
      goc: docSach(),
      id: 'lore.india',
      ten: 'Thần thoại Ấn Độ',
      nguon: 'nguoi_dung',
      branchId: state.world.branchId,
    }).lorebook!;
    const book = { ...imported, bat: true, tickBat: state.world.tick };
    const entry = book.entries.find((e) => e.id === 'india.director')!;
    const context = taoNguCanhEjsLore(state, book, entry);
    const rendered = renderEjsLore(`${entry.noiDung}\n<% globalThis.hacked = true %>`, context);

    expect(rendered.text).toContain('ĐẠO DIỄN');
    expect(rendered.text).toContain('Người chơi: Người Chơi');
    expect(rendered.text).not.toContain('<%');
    expect(rendered.text).not.toContain('globalThis');
    expect(rendered.errors).toHaveLength(1);
    expect((globalThis as { hacked?: boolean }).hacked).toBeUndefined();
  });

  it('mở theo giai đoạn, cho gọi đích danh sớm và không dồn nhiều entry cùng nhóm', () => {
    const state = theGioi();
    const imported = nhapLorebook({
      goc: docSach(),
      id: 'lore.india',
      ten: 'Thần thoại Ấn Độ',
      nguon: 'nguoi_dung',
      branchId: state.world.branchId,
    }).lorebook!;
    const book = { ...imported, bat: true, tickBat: state.world.tick };
    state.lorebooks.set(book.id, book);

    const phase0 = dungChiMuc(state).filter((c) => c.id.startsWith('ck_lore_'));
    expect(phase0.some((c) => c.noiDung.includes('Núi Kailash'))).toBe(false);
    expect(phase0.some((c) => c.noiDung.includes('ĐẠO DIỄN'))).toBe(true);

    const called = dungChiMuc(state, 'Ta muốn hành hương tới Kailash').filter((c) =>
      c.id.startsWith('ck_lore_'),
    );
    expect(called.some((c) => c.noiDung.includes('Núi Kailash'))).toBe(true);

    state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan * 2 };
    const phase2 = dungChiMuc(state).filter((c) => c.id.startsWith('ck_lore_'));
    expect(phase2.length).toBeGreaterThan(phase0.length);

    // Mỗi vị thần một `nguonId`: Shiva và Kali không được cạnh tranh nhau một chỗ.
    const nhanVat = phase2.filter((c) => String(c.meta['nhomKichHoat']).startsWith('nv_'));
    expect(nhanVat.length).toBeGreaterThan(3);
    expect(new Set(nhanVat.map((c) => c.nguonId)).size).toBe(nhanVat.length);

    // Thang cõi thì ngược lại: cả mười bốn tầng gom về một nguồn, nên một cảnh
    // lấy được một tầng chứ không bày cả thang.
    const coiGioi = phase2.filter((c) => c.meta['nhomKichHoat'] === 'coi_gioi');
    expect(coiGioi.length).toBeGreaterThan(3);
    expect(new Set(coiGioi.map((c) => c.nguonId)).size).toBe(1);
  });

  it('thang kết tinh tăng theo tick, trần là lực hấp dẫn và người chơi có mặt trong luật', () => {
    const state = theGioi();
    const imported = nhapLorebook({
      goc: docSach(),
      id: 'lore.india',
      ten: 'Thần thoại Ấn Độ',
      nguon: 'nguoi_dung',
      branchId: state.world.branchId,
    }).lorebook!;
    const book = { ...imported, bat: true, tickBat: state.world.tick };
    const entry = book.entries[0]!;
    const doc = (): { tang: number; tyLe: number; nhan: string } =>
      taoNguCanhEjsLore(state, book, entry).dien;

    expect(doc()).toMatchObject({ tang: 0, nhan: 'tiếng vọng' });
    const thay = [doc().tyLe];
    for (let i = 1; i <= 4; i++) {
      state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan };
      expect(doc().tang).toBe(i);
      thay.push(doc().tyLe);
    }
    expect(thay).toEqual([...thay].sort((a, b) => a - b));
    expect(thay[4]).toBe(book.lucHapDan);
    expect(thay[4]).toBeLessThan(100);

    // Ba trục quyết định thế giới trở thành cái gì đều phải gọi tên người chơi.
    for (const id of ['india.director', 'india.bonluat', 'india.diadanh']) {
      const e = book.entries.find((x) => x.id === id);
      expect(e, id).toBeDefined();
      const kq = renderEjsLore(e!.noiDung, taoNguCanhEjsLore(state, book, e!));
      expect(kq.errors, id).toEqual([]);
      expect(kq.text, id).toContain('Người Chơi');
    }
  });

  it('mọi entry nội dung mang khối kết tinh và render sạch, không thẻ EJS nào sót', () => {
    const state = theGioi();
    const imported = nhapLorebook({
      goc: docSach(),
      id: 'lore.india',
      ten: 'Thần thoại Ấn Độ',
      nguon: 'nguoi_dung',
      branchId: state.world.branchId,
    }).lorebook!;
    const book = { ...imported, bat: true, tickBat: state.world.tick };

    const loi: string[] = [];
    for (const entry of book.entries) {
      const kq = renderEjsLore(entry.noiDung, taoNguCanhEjsLore(state, book, entry));
      if (kq.errors.length > 0) loi.push(`${entry.id}: ${kq.errors[0]}`);
      if (kq.text.trim() === '') loi.push(`${entry.id}: rỗng`);
      if (kq.text.includes('<%') || kq.text.includes('%>')) loi.push(`${entry.id}: thẻ EJS sót`);
    }
    expect(loi).toEqual([]);

    const nghiepVu = book.entries.filter((e) => e.lop !== 'loi');
    expect(nghiepVu.every((e) => e.noiDung.includes('[KẾT TINH'))).toBe(true);
    expect(nghiepVu.every((e) => e.noiDung.includes('- Đường vào:'))).toBe(true);
    expect(nghiepVu.every((e) => e.noiDung.includes('- Chỗ dị bản:'))).toBe(true);
    // Khối EJS của bản dựng cũ phải bị gỡ sạch, không chồng hai lớp vỏ.
    expect(book.entries.filter((e) => e.noiDung.includes('[QUY TẮC HÒA NHẬP]'))).toHaveLength(0);
  });

  it('bật không tạo hàng loạt entity; tắt loại sạch ảnh hưởng khỏi truy hồi và kỳ vọng', () => {
    const state = theGioi();
    const imported = nhapLorebook({
      goc: docSach(),
      id: 'lore.india',
      ten: 'Thần thoại Ấn Độ',
      nguon: 'nguoi_dung',
      branchId: state.world.branchId,
    }).lorebook!;
    const book = { ...imported, bat: true, tickBat: state.world.tick };

    expect(vatChatHoaLorebook(book, state, 'ev.india-on')).toHaveLength(0);
    expect(trichKyVong(book, state.world.branchId)).toHaveLength(3);

    state.lorebooks.set(book.id, { ...book, bat: false, tickBat: null });
    expect(dungChiMuc(state).filter((c) => c.id.startsWith('ck_lore_'))).toHaveLength(0);
  });
});
