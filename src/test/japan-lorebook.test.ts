/**
 * Lorebook dựng sẵn — Thần thoại Nhật Bản.
 *
 * Ngoài các bảo đảm chung của một sách dựng sẵn (bật không đẻ thực thể, tắt là
 * sạch, EJS không chạy câu lệnh), sách này phải giữ ba lời hứa riêng — và cả ba
 * đều là lời hứa về CHỖ, không phải về nội dung:
 *
 *   — bốn mươi tám vị thần và anh hùng là bốn mươi tám NGUỒN riêng, còn thang
 *     cõi và ba báu vật thiêng thì mỗi họ đúng MỘT nguồn: hai vị thần khác nhau
 *     không được coi là trùng nhau, còn ba món báu vật thì không được bày ra
 *     cùng một lượt;
 *   — vết cắt giữa thời thần và thời người có hiệu lực: người của thời sau không
 *     tự dội vào lượt đầu, nhưng người chơi gọi đích danh thì vẫn tới ngay;
 *   — chỗ của người chơi có mặt từ giai đoạn 0 và KHÔNG trao sẵn gì — thần thoại
 *     này vốn không chừa chỗ nào cho một kẻ không thị tộc, nên nếu sách không tự
 *     mở ra một chỗ thì model sẽ tự bịa một xuất thân sang trọng vào đó.
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
    readFileSync(join(process.cwd(), 'public/lorebooks/than-thoai-nhat-ban.json'), 'utf8'),
  ) as unknown;
}

function theGioi(): WorldState {
  const cauHinh = KhoiTaoWorldSchema.parse({
    cua: 'day_du',
    seed: 'japan-lorebook',
    worldId: 'w.japan',
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
    id: 'lore.japan',
    ten: 'Thần thoại Nhật Bản',
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

const chunkLore = (
  s: WorldState,
  q = '',
): readonly { id: string; noiDung: string; nguonId: string; meta: Record<string, unknown> }[] =>
  dungChiMuc(s, q).filter((c) => c.id.startsWith('ck_lore_'));

describe('Lorebook dựng sẵn — Thần thoại Nhật Bản', () => {
  it('nhập sạch, EJS hợp lệ, và mang cấu hình diễn hóa chậm', () => {
    const kq = nhapLorebook({
      goc: docSach(),
      id: 'lore.japan',
      ten: 'Thần thoại Nhật Bản',
      nguon: 'nguoi_dung',
      branchId: 'br_goc',
    });
    expect(kq.issues.filter((i) => i.code === 'EJS_HONG')).toHaveLength(0);
    expect(kq.issues.filter((i) => i.code === 'CU_PHAP_USER_SAI')).toHaveLength(0);
    // 101 entry của worldbook gốc + bốn entry điều phối + entry Biến Số.
    expect(kq.lorebook?.entries).toHaveLength(106);
    expect(kq.lorebook).toMatchObject({
      ten: 'Thần thoại Nhật Bản',
      lucHapDan: 66,
      nhipMoGiaiDoan: 9,
      soDiemHutMoiLuot: 2,
      bat: false,
    });
    // Bật sách không được đẻ ra 106 thực thể, nên mọi entry phải trì hoãn hiện thực.
    expect(kq.lorebook?.entries.every((e) => e.triHoanHienThuc)).toBe(true);
    // Chỉ bốn entry điều phối được luôn-bật; hai entry `constant` của card gốc —
    // trong đó có dòng thời gian hơn mười nghìn ký tự — bị hạ xuống.
    expect(kq.lorebook?.entries.filter((e) => e.lop === 'loi')).toHaveLength(4);
    // Entry lớp `sau` không có keyword thì không bao giờ bắn — đó là entry chết.
    expect(kq.lorebook?.entries.filter((e) => e.lop === 'sau' && e.keys.length === 0)).toHaveLength(0);
  });

  it('render EJS bằng ngữ cảnh engine nhưng không chạy câu lệnh JavaScript', () => {
    const state = theGioi();
    const book = batSach(state);
    const entry = book.entries.find((e) => e.id === 'japan.director');
    expect(entry).toBeDefined();
    const context = taoNguCanhEjsLore(state, book, entry!);
    const rendered = renderEjsLore(`${entry!.noiDung}\n<% globalThis.hacked = true %>`, context);

    expect(rendered.text).toContain('ĐẠO DIỄN');
    expect(rendered.text).toContain('Người chơi: Người Chơi');
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

    expect(doc()).toMatchObject({ tang: 0, nhan: 'tiếng vọng' });

    const thay: number[] = [doc().tyLe];
    for (let i = 1; i <= 4; i++) {
      state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan };
      expect(doc().tang).toBe(i);
      thay.push(doc().tyLe);
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

  /**
   * Vết cắt giữa hai thời là thứ sách này có mà hai sách kia không có.
   *
   * Một nửa danh sách nhân vật sống ở thời của người — thầy Âm Dương, tướng diệt
   * quỷ, oán linh. Để họ tự dội vào lượt đầu là cho họ đứng cạnh Izanagi như
   * người cùng thời, và thế giới mất luôn cái làm thần thoại này khác mọi thần
   * thoại khác: rằng thời của thần ĐÃ kết thúc.
   */
  it('người của thời sau không tự dội vào lượt đầu, nhưng gọi đích danh thì tới ngay', () => {
    const state = theGioi();
    const book = batSach(state);

    const phase0 = chunkLore(state);
    expect(phase0.some((c) => c.noiDung.includes('ĐẠO DIỄN'))).toBe(true);
    expect(phase0.some((c) => c.noiDung.includes('Abe no Seimei'))).toBe(false);

    const goiTen = chunkLore(state, 'Ta muốn tìm gặp Abe no Seimei');
    expect(goiTen.some((c) => c.noiDung.includes('Abe no Seimei'))).toBe(true);

    state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan * 3 };
    const phase3 = chunkLore(state);
    expect(phase3.length).toBeGreaterThan(phase0.length);
    expect(phase3.some((c) => c.noiDung.includes('Abe no Seimei'))).toBe(true);
  });

  /**
   * Nhóm là `nguonId` lúc truy hồi, và MMR coi hai chunk cùng `nguonId` là trùng
   * MẠNH dù chữ khác hẳn. Đây là chỗ quyết định "bật nhiều entry mà không xung
   * đột": nhóm phải trùng với câu hỏi "hai entry này có thay thế được cho nhau
   * trong một cảnh không", không trùng với nhãn thư mục của worldbook gốc.
   */
  it('mỗi vị thần là một nguồn riêng; thang cõi và ba báu vật thì mỗi họ một nguồn', () => {
    const state = theGioi();
    const book = batSach(state);
    state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan * 4 };

    const nhanVat = book.entries.filter((e) => e.nhomKichHoat.startsWith('nv_'));
    expect(nhanVat.length).toBeGreaterThanOrEqual(45);
    expect(new Set(nhanVat.map((e) => e.nhomKichHoat)).size).toBe(nhanVat.length);

    const daBan = chunkLore(state, 'Amaterasu và Susanoo đứng đối diện nhau bên bờ sông trời');
    const chunkNhanVat = daBan.filter((c) => String(c.meta['nhomKichHoat']).startsWith('nv_'));
    expect(chunkNhanVat.length).toBeGreaterThan(3);
    expect(new Set(chunkNhanVat.map((c) => c.nguonId)).size).toBe(chunkNhanVat.length);

    // Ba báu vật thiêng đi cùng hai thanh kiếm và ngọn giáo: sức mạnh của chúng
    // nằm ở chỗ gần như không ai từng thấy chúng, nên bày cả họ ra một lượt là
    // tiêu mất thứ đáng giá nhất của chúng.
    const thanKhi = daBan.filter((c) => c.meta['nhomKichHoat'] === 'than_khi');
    expect(thanKhi.length).toBeGreaterThan(3);
    expect(new Set(thanKhi.map((c) => c.nguonId)).size).toBe(1);

    const coiGioi = daBan.filter((c) => c.meta['nhomKichHoat'] === 'coi_gioi');
    expect(coiGioi.length).toBeGreaterThan(3);
    expect(new Set(coiGioi.map((c) => c.nguonId)).size).toBe(1);

    // Và không nhóm nào rỗng: entry không nhóm là entry tự đứng một mình, tức
    // không chịu quy tắc "một trọng tâm mỗi lượt" của bất kỳ ai.
    expect(book.entries.filter((e) => e.nhomKichHoat === '')).toHaveLength(0);
  });

  /**
   * Chỗ của người chơi phải có mặt TỪ LƯỢT ĐẦU.
   *
   * Nó là câu trả lời cho "kẻ này là ai", và câu hỏi ấy được hỏi ngay lần đầu có
   * người trong thế giới nhìn vào người chơi. Worldbook gốc không có entry nào
   * cho người chơi — nó là một cuốn bách khoa — nên nếu sách không tự mở ra một
   * chỗ, model sẽ bịa vào khoảng trống ấy theo hướng dễ nhất, là một xuất thân
   * sang trọng mà sách chưa bao giờ cho phép.
   */
  it('Biến Số là entry nội dung, mở từ giai đoạn 0, và không trao sẵn gì cho người chơi', () => {
    const state = theGioi();
    const book = batSach(state);
    const entry = book.entries.find((e) => e.id === 'japan.bienso');
    expect(entry).toBeDefined();
    expect(entry).toMatchObject({ nhomKichHoat: 'nguoi_choi', giaiDoanMo: 0, lop: 'sau' });

    const daBan = chunkLore(state, 'Kẻ lạ ấy không thuộc thị tộc nào, không đền nào có tên hắn');
    expect(daBan.some((c) => c.id.endsWith('japan.bienso'))).toBe(true);

    const kq = renderEjsLore(entry!.noiDung, taoNguCanhEjsLore(state, book, entry!));
    expect(kq.errors).toEqual([]);
    expect(kq.text).toContain('Người Chơi');
    // Ba cơ chế của riêng thần thoại này, không phải ba lời từ chối suông.
    expect(kq.text).toContain('KHÔNG THỊ TỘC, KHÔNG THẦN BẢO HỘ');
    expect(kq.text).toContain('NGÔN LINH KHÔNG CÓ CHỖ BÁM');
    expect(kq.text).toContain('CỬA NGƯỜI HÓA THẦN ĐỂ MỞ');
    // Và nó vẫn KHÔNG được tạo thực thể cho người chơi khi bật sách.
    expect(entry!.triHoanHienThuc).toBe(true);
  });

  it('người chơi nằm TRONG thần thoại: ba trục chính đều nội suy tên người chơi', () => {
    const state = theGioi();
    const book = batSach(state);
    expect(book.entries.filter((e) => e.lop === 'loi')).toHaveLength(4);

    // Đạo diễn, bốn luật nền và thang cõi là ba chỗ quyết định thế giới trở thành
    // cái gì — cả ba phải gọi tên người chơi. `chongxungdot` cố ý không: nó nói
    // về cách xếp entry, và nhét tên người chơi vào đó là nhiễu.
    for (const id of ['japan.director', 'japan.bonluat', 'japan.diadanh']) {
      const entry = book.entries.find((e) => e.id === id);
      expect(entry, id).toBeDefined();
      const kq = renderEjsLore(entry!.noiDung, taoNguCanhEjsLore(state, book, entry!));
      expect(kq.errors, id).toEqual([]);
      expect(kq.text, id).toContain('Người Chơi');
    }

    // Các entry nội dung có `<%= user.name %>` phải render ra tên thật, không để
    // lại macro — đây là chỗ `<user>` của SillyTavern hay lọt ra nguyên văn.
    const coTen = book.entries.filter((e) => e.noiDung.includes('user.name'));
    expect(coTen.length).toBeGreaterThan(4);
    for (const entry of coTen) {
      const kq = renderEjsLore(entry.noiDung, taoNguCanhEjsLore(state, book, entry));
      expect(kq.text, entry.id).toContain('Người Chơi');
      expect(kq.text, entry.id).not.toContain('user.name');
    }
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
    // Không entry nào chồng hai lớp vỏ EJS của hai lần dựng.
    expect(nghiepVu.every((e) => e.noiDung.indexOf('[KẾT TINH') === e.noiDung.lastIndexOf('[KẾT TINH'))).toBe(
      true,
    );
  });

  it('bật không tạo thực thể và không treo kỳ vọng; tắt là sạch hoàn toàn', () => {
    const state = theGioi();
    const book = batSach(state);

    expect(vatChatHoaLorebook(book, state, 'ev.japan-on')).toHaveLength(0);
    expect(trichKyVong(book, state.world.branchId)).toHaveLength(3);

    state.world = { ...state.world, tick: state.world.tick + book.nhipMoGiaiDoan * 4 };
    expect(chunkLore(state).length).toBeGreaterThan(0);

    state.lorebooks.set(book.id, { ...book, bat: false, tickBat: null });
    expect(chunkLore(state)).toHaveLength(0);
    expect(chunkLore(state, 'Amaterasu, Susanoo, Yomi, Takamagahara, kegare')).toHaveLength(0);
  });
});
