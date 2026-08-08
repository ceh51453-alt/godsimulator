/**
 * Lorebook dựng sẵn — Thần thoại Hy Lạp.
 *
 * Thiên Diễn mở ván bằng một thế giới TRỐNG. Sách này là lực hút kéo cái trống
 * ấy thành Olympus, và toàn bộ giá trị của nó nằm ở chỗ kéo CHẬM. Vì vậy ngoài
 * các bảo đảm chung (bật không đẻ thực thể, tắt là sạch), nó phải giữ hai lời
 * hứa riêng:
 *
 *   — thang kết tinh TĂNG theo tick và trần của nó là `lucHapDan` chứ không
 *     phải 100: sách lực hút 68 thì thế giới không bao giờ trùng khít nguyên
 *     tác, và phần còn thiếu là phần của người chơi;
 *   — bảy entry về Hera là bảy MẶT của Hera, tức MỘT nguồn truy hồi, không phải
 *     bảy nguồn cùng tranh chỗ trong một cảnh.
 */
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
import type { Lorebook } from '../core/lore/schema.js';
import type { WorldState } from '../core/engine/state.js';
import { moDuBangChungLore } from './lorebook-evidence.js';

function docSach(): unknown {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'public/lorebooks/than-thoai-hy-lap.json'), 'utf8'),
  ) as unknown;
}

function theGioi(): WorldState {
  const cauHinh = KhoiTaoWorldSchema.parse({
    cua: 'day_du',
    seed: 'greek-lorebook',
    worldId: 'w.greek',
    branchId: 'br_goc',
  });
  const { world, events } = moThuGioi(cauHinh);
  const state = taoState(world);
  const result = apDungChuoi(state, events, taoEventLog());
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '));
  moDuBangChungLore(state);
  return state;
}

function nhap(branchId: string): Lorebook {
  const kq = nhapLorebook({
    goc: docSach(),
    id: 'lore.greek',
    ten: 'Thần thoại Hy Lạp',
    nguon: 'nguoi_dung',
    branchId,
  });
  expect(kq.ok, JSON.stringify(kq.issues.filter((i) => i.severity === 'error'))).toBe(true);
  return kq.lorebook as Lorebook;
}

function batSach(state: WorldState): Lorebook {
  const book = { ...nhap(state.world.branchId), bat: true, tickBat: state.world.tick };
  state.lorebooks.set(book.id, book);
  return book;
}

const chunkLore = (s: WorldState, q = ''): readonly { id: string; noiDung: string; nguonId: string }[] =>
  dungChiMuc(s, q).filter((c) => c.id.startsWith('ck_lore_'));

describe('Lorebook dựng sẵn — Thần thoại Hy Lạp', () => {
  it('nhập sạch, EJS hợp lệ, và mang cấu hình diễn hóa chậm', () => {
    const kq = nhapLorebook({
      goc: docSach(),
      id: 'lore.greek',
      ten: 'Thần thoại Hy Lạp',
      nguon: 'nguoi_dung',
      branchId: 'br_goc',
    });
    expect(kq.issues.filter((i) => i.code === 'EJS_HONG')).toHaveLength(0);
    expect(kq.issues.filter((i) => i.code === 'CU_PHAP_USER_SAI')).toHaveLength(0);
    expect(kq.lorebook?.entries).toHaveLength(154);
    expect(kq.lorebook).toMatchObject({
      ten: 'Thần thoại Hy Lạp',
      lucHapDan: 68,
      nhipMoGiaiDoan: 10,
      soDiemHutMoiLuot: 2,
      bat: false,
    });
    // Bật sách không được đẻ ra 153 thực thể, nên mọi entry phải trì hoãn hiện thực.
    expect(kq.lorebook?.entries.every((e) => e.triHoanHienThuc)).toBe(true);
    // Chỉ bốn entry điều phối được luôn-bật; mười ba entry `constant` của card gốc bị hạ xuống.
    expect(kq.lorebook?.entries.filter((e) => e.lop === 'loi')).toHaveLength(4);
    // Entry lớp `sau` không có keyword thì không bao giờ bắn — đó là entry chết.
    expect(kq.lorebook?.entries.filter((e) => e.lop === 'sau' && e.keys.length === 0)).toHaveLength(0);
  });

  it('render EJS bằng ngữ cảnh engine nhưng không chạy câu lệnh JavaScript', () => {
    const state = theGioi();
    const book = batSach(state);
    const entry = book.entries.find((e) => e.id === 'greek.director');
    expect(entry).toBeDefined();
    const context = taoNguCanhEjsLore(state, book, entry!);
    const rendered = renderEjsLore(`${entry!.noiDung}\n<% globalThis.hacked = true %>`, context);

    expect(rendered.text).toContain('ĐẠO DIỄN');
    expect(rendered.text).not.toContain('<%');
    expect(rendered.text).not.toContain('globalThis');
    expect(rendered.errors).toHaveLength(1);
    expect((globalThis as { hacked?: boolean }).hacked).toBeUndefined();
  });

  it('thang kết tinh tăng theo tick và trần của nó là lực hấp dẫn, không phải 100', () => {
    const state = theGioi();
    const book = batSach(state);
    const entry = book.entries[0]!;
    const doc = (): { tang: number; tyLe: number; nhan: string } =>
      taoNguCanhEjsLore(state, book, entry).dien;

    const dau = doc();
    expect(dau.tang).toBe(0);
    expect(dau.nhan).toBe('tiếng vọng');

    const thay: number[] = [dau.tyLe];
    for (let i = 1; i <= 4; i++) {
      state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan };
      const d = doc();
      expect(d.tang).toBe(i);
      thay.push(d.tyLe);
    }
    // Tăng đơn điệu, và tầng cuối KHÔNG vượt lực hấp dẫn: chỗ còn thiếu so với
    // 100 chính là chỗ nguyên tác không được phép lấp — nó thuộc về người chơi.
    expect(thay).toEqual([...thay].sort((a, b) => a - b));
    expect(thay[4]).toBe(book.lucHapDan);
    expect(thay[4]).toBeLessThan(100);
    expect(doc().nhan).toBe('sử thi');

    // Vượt tầng cuối thì đứng lại, không tràn ra ngoài thang.
    const tranCuoi = doc().tyLe;
    state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan * 5 };
    expect(doc().tang).toBe(4);
    expect(doc().tyLe).toBe(tranCuoi);
  });

  it('mở theo giai đoạn, và người chơi gọi đích danh thì thắng cổng giai đoạn', () => {
    const state = theGioi();
    const book = batSach(state);

    const phase0 = chunkLore(state);
    expect(phase0.some((c) => c.noiDung.includes('ĐẠO DIỄN'))).toBe(true);
    // Sử thi cấp thế giới mở ở giai đoạn 4 — không được tự dội vào lượt đầu.
    expect(phase0.some((c) => c.noiDung.includes('Chiến tranh thành Troy'))).toBe(false);

    const goiTen = chunkLore(state, 'Kể ta nghe về Chiến tranh thành Troy');
    expect(goiTen.some((c) => c.noiDung.includes('Chiến tranh thành Troy'))).toBe(true);

    state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan * 2 };
    const phase2 = chunkLore(state);
    expect(phase2.length).toBeGreaterThan(phase0.length);
  });

  it('bảy entry về Hera là MỘT nguồn truy hồi, không phải bảy nguồn tranh chỗ', () => {
    const state = theGioi();
    const book = batSach(state);
    state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan * 4 };

    const hera = book.entries.filter((e) => e.nhomKichHoat === 'nv_hera');
    expect(hera.length).toBeGreaterThanOrEqual(7);

    const daBan = chunkLore(state, 'Hera đứng trong thần điện của mình').filter((c) =>
      hera.some((e) => c.id.endsWith(e.id)),
    );
    expect(daBan.length).toBeGreaterThan(1);
    // MMR coi hai chunk cùng `nguonId` là trùng MẠNH, nên cả bảy mặt cạnh tranh
    // nhau cho một chỗ thay vì cùng tràn vào một cảnh.
    expect(new Set(daBan.map((c) => c.nguonId)).size).toBe(1);

    // Và mỗi nhóm phải là một chủ đề: không nhóm nào ôm hai nhân vật khác nhau.
    const nhom = new Map<string, number>();
    for (const e of book.entries) nhom.set(e.nhomKichHoat, (nhom.get(e.nhomKichHoat) ?? 0) + 1);
    expect(nhom.get('')).toBeUndefined();
    expect(nhom.size).toBeGreaterThan(40);
  });

  /**
   * Chỗ của người chơi phải có mặt TỪ LƯỢT ĐẦU.
   *
   * Nó là câu trả lời cho "kẻ này là ai", và câu hỏi ấy được hỏi ngay lần đầu có
   * NPC nhìn vào người chơi. Nếu entry này bị đẩy sang giai đoạn sau, model phải
   * tự bịa câu trả lời trong khoảng trống — và nó bịa theo hướng dễ nhất, là cho
   * người chơi một xuất thân sang trọng mà sách chưa bao giờ cho phép.
   */
  it('Biến Số là entry nội dung, mở từ giai đoạn 0, và không trao sẵn gì cho người chơi', () => {
    const state = theGioi();
    const book = batSach(state);
    const entry = book.entries.find((e) => e.id === 'greek.bienso');
    expect(entry).toBeDefined();
    expect(entry).toMatchObject({ nhomKichHoat: 'nguoi_choi', giaiDoanMo: 0, lop: 'sau' });

    // Bắn được ở giai đoạn 0 khi cảnh nhìn vào người chơi.
    const daBan = chunkLore(state, 'Người lạ ấy không có gia phả, không ai biết xuất thân');
    expect(daBan.some((c) => c.id.endsWith('greek.bienso'))).toBe(true);

    const kq = renderEjsLore(entry!.noiDung, taoNguCanhEjsLore(state, book, entry!));
    expect(kq.errors).toEqual([]);
    expect(kq.text).toContain('Người Chơi');
    // Ba cơ chế Hy Lạp riêng của entry này, không phải ba lời từ chối suông.
    expect(kq.text).toContain('Moirai');
    expect(kq.text).toContain('LỜI SẤM CÂM');
    expect(kq.text).toContain('CHƯA CÓ MỨC HUBRIS');
    // Và nó vẫn KHÔNG được tạo thực thể cho người chơi khi bật sách.
    expect(entry!.triHoanHienThuc).toBe(true);
  });

  it('bật không tạo thực thể và không treo kỳ vọng; tắt là sạch hoàn toàn', () => {
    const state = theGioi();
    const book = batSach(state);

    expect(vatChatHoaLorebook(book, state, 'ev.greek-on')).toHaveLength(0);
    expect(trichKyVong(book, state.world.branchId)).toHaveLength(4);

    state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan * 4 };
    expect(chunkLore(state).length).toBeGreaterThan(0);

    state.lorebooks.set(book.id, { ...book, bat: false, tickBat: null });
    expect(chunkLore(state)).toHaveLength(0);
    expect(chunkLore(state, 'Hera, Zeus, Olympus, Meru, nghiệp báo')).toHaveLength(0);
  });

  it('mọi entry render ra chữ, không entry nào câm và không thẻ EJS nào sót', () => {
    const state = theGioi();
    const book = batSach(state);
    const rong: string[] = [];
    const loiEjs: string[] = [];

    for (const entry of book.entries) {
      const kq = renderEjsLore(entry.noiDung, taoNguCanhEjsLore(state, book, entry));
      if (kq.errors.length > 0) loiEjs.push(`${entry.id}: ${kq.errors[0]}`);
      if (kq.text.trim() === '') rong.push(entry.id);
      if (kq.text.includes('<%') || kq.text.includes('%>')) loiEjs.push(`${entry.id}: thẻ EJS sót lại`);
    }

    expect(loiEjs).toEqual([]);
    expect(rong).toEqual([]);

    // Khối kết tinh phải phủ mọi entry nội dung — bốn entry điều phối có khối
    // riêng của chúng nên không tính vào đây.
    const nghiepVu = book.entries.filter((e) => e.lop !== 'loi');
    expect(nghiepVu.every((e) => e.noiDung.includes('[KẾT TINH'))).toBe(true);
    expect(nghiepVu.every((e) => e.noiDung.includes('- Đường vào:'))).toBe(true);
    expect(nghiepVu.every((e) => e.noiDung.includes('- Chỗ dị bản:'))).toBe(true);
  });

  it('người chơi nằm TRONG thần thoại: ba trục chính đều nội suy tên người chơi', () => {
    const state = theGioi();
    const book = batSach(state);
    const dieuPhoi = book.entries.filter((e) => e.lop === 'loi');
    expect(dieuPhoi).toHaveLength(4);

    // Đạo diễn, bốn luật nền và bản đồ thiêng là ba chỗ quyết định thế giới trở
    // thành cái gì — cả ba phải gọi tên người chơi. `chongxungdot` cố ý không:
    // nó nói về cách xếp entry, và nhét tên người chơi vào đó là nhiễu.
    for (const id of ['greek.director', 'greek.bonluat', 'greek.diadanh']) {
      const entry = book.entries.find((e) => e.id === id);
      expect(entry, id).toBeDefined();
      const kq = renderEjsLore(entry!.noiDung, taoNguCanhEjsLore(state, book, entry!));
      expect(kq.errors, id).toEqual([]);
      expect(kq.text, id).toContain('Người Chơi');
    }

    // Và các entry nội dung có `<%= user.name %>` phải render ra tên thật, không
    // để lại macro — đây là chỗ `<user>` của SillyTavern hay lọt ra nguyên văn.
    const coTen = book.entries.filter((e) => e.noiDung.includes('user.name'));
    expect(coTen.length).toBeGreaterThan(4);
    for (const entry of coTen) {
      const kq = renderEjsLore(entry.noiDung, taoNguCanhEjsLore(state, book, entry));
      expect(kq.text, entry.id).toContain('Người Chơi');
      expect(kq.text, entry.id).not.toContain('user.name');
    }
  });
});
