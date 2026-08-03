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
  return state;
}

describe('Lorebook dựng sẵn — Thần thoại Ấn Độ', () => {
  it('nhập đủ 97 entry, EJS hợp lệ và mang cấu hình diễn hóa chậm', () => {
    const result = nhapLorebook({
      goc: docSach(),
      id: 'lore.india',
      ten: 'Thần thoại Ấn Độ',
      nguon: 'nguoi_dung',
      branchId: 'br_goc',
    });
    expect(result.ok, JSON.stringify(result.issues.filter((i) => i.severity === 'error'))).toBe(true);
    expect(result.lorebook?.entries).toHaveLength(97);
    expect(result.lorebook).toMatchObject({
      ten: 'Thần thoại Ấn Độ',
      lucHapDan: 72,
      nhipMoGiaiDoan: 8,
      soDiemHutMoiLuot: 2,
      bat: false,
    });
    expect(result.lorebook?.entries.every((e) => e.triHoanHienThuc)).toBe(true);
    expect(result.issues.filter((i) => i.code === 'EJS_HONG')).toHaveLength(0);
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

    expect(rendered.text).toContain('Người chơi là');
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
    expect(phase0.some((c) => c.noiDung.includes('ĐẠO DIỄN THẦN THOẠI ẤN ĐỘ'))).toBe(true);

    const called = dungChiMuc(state, 'Ta muốn hành hương tới Kailash').filter((c) =>
      c.id.startsWith('ck_lore_'),
    );
    expect(called.some((c) => c.noiDung.includes('Núi Kailash'))).toBe(true);

    state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan * 2 };
    const phase2 = dungChiMuc(state).filter((c) => c.id.startsWith('ck_lore_'));
    const characters = phase2.filter((c) => c.meta['nhomKichHoat'] === 'nhan_vat_than_thoai');
    expect(characters.length).toBeGreaterThan(3);
    expect(new Set(characters.map((c) => c.nguonId)).size).toBe(1);
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
    expect(trichKyVong(book, state.world.branchId)).toHaveLength(0);

    state.lorebooks.set(book.id, { ...book, bat: false, tickBat: null });
    expect(dungChiMuc(state).filter((c) => c.id.startsWith('ck_lore_'))).toHaveLength(0);
  });
});
