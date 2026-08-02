/**
 * Tiện ích dùng chung cho mười hai handler nền.
 *
 * Ba việc lặp đi lặp lại ở mọi tiến trình, gom lại đây để mười hai file kia chỉ
 * còn phần *quy luật của thế giới*, không lẫn phần lắp ráp patch:
 *
 *   1. đọc aspect có kiểu và có mặc định — thiếu aspect thì bỏ qua vùng, không crash;
 *   2. dựng `PatchOp` đúng `sourceEventId`;
 *   3. làm tròn — số dấu phẩy động chạy 400 tick sẽ đẻ ra đuôi thập phân vô tận,
 *      và state hash thì băm nguyên văn.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { WorldState } from '../../engine/state.js';
import type { Entity } from '../../schema/entity.js';
import type { NgocCanhTienTrinh } from './types.js';
import type { Duong } from '../../schema/aspect/substrate.js';

/**
 * Phần kho mà mỗi tiến trình được rút trong MỘT lần chạy.
 *
 * Vì sao phải khai chung một chỗ: `production_consumption`, `exchange_debt` và
 * `institution_governance` nằm cùng một cụm phụ thuộc vòng (xem `chiaGiaiDoan`),
 * nên cả ba tính phần mình từ **cùng một ảnh chụp**. Mỗi bên tưởng kho còn đầy.
 * Nếu tổng ba phần vượt 1 thì kho âm — và bất biến sẽ bắt, nhưng bắt xong thì
 * một tiến trình bị bỏ và thế giới mất một mùa vô cớ.
 *
 * Trần này cũng đúng về mặt thế giới: phần kho không ai được đụng tới chính là
 * **thóc giống**. Xã hội nông nghiệp nào cũng có nó, và ăn vào nó là dấu hiệu
 * của nạn đói thật sự chứ không phải của một mùa kém.
 *
 * `phanKhoHopLe()` canh bất biến này; có test riêng.
 */
export const PHAN_KHO = Object.freeze({
  /** Ăn: phần lớn nhất, nhưng không tới thóc giống. */
  an: 0.75,
  /** Thương đoàn chở đi. */
  traoDoi: 0.1,
  /** Thuế. */
  thue: 0.1,
});

/** Tổng ba phần phải nhỏ hơn 1, nếu không kho có thể âm ngay cả khi không ai sai. */
export function phanKhoHopLe(): boolean {
  return PHAN_KHO.an + PHAN_KHO.traoDoi + PHAN_KHO.thue < 1;
}

/** Bốn chữ số sau dấu phẩy là đủ cho mọi đại lượng của thế giới này. */
export const SO_LE = 4;

export function lam(x: number, le = SO_LE): number {
  if (!Number.isFinite(x)) return 0;
  const he = 10 ** le;
  return Math.round(x * he) / he;
}

/** Kẹp vào khoảng. Dùng ở mọi chỗ ghi một trường có `min`/`max` trong schema. */
export function kep(x: number, lo: number, hi: number): number {
  if (!Number.isFinite(x)) return lo;
  return x < lo ? lo : x > hi ? hi : x;
}

/** Id entity theo thứ tự codepoint — [BB] luật bất biến #7, không dùng locale sort. */
export function idSapXep(state: WorldState): string[] {
  return [...state.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function docAspect<T>(e: Entity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a === undefined || a === null || typeof a !== 'object' ? undefined : (a as T);
}

/** Mọi nơi chốn còn sống, kèm bộ aspect nền. Vùng thiếu `dan_cu` bị bỏ qua. */
export type NoiChon = {
  id: string;
  e: Entity;
};

export function moiNoiChon(state: WorldState): NoiChon[] {
  const ra: NoiChon[] = [];
  for (const id of idSapXep(state)) {
    const e = state.entities.get(id);
    if (!e || e.kind !== 'place' || e.tickDiet !== null) continue;
    if (e.aspects['dan_cu'] === undefined) continue;
    ra.push({ id, e });
  }
  return ra;
}

/** Mọi tuyến đường thông suốt, đã sắp xếp. */
export function moiTuyenDuong(state: WorldState): { id: string; d: Duong }[] {
  const ra: { id: string; d: Duong }[] = [];
  for (const id of idSapXep(state)) {
    const e = state.entities.get(id);
    if (!e || e.kind !== 'route' || e.tickDiet !== null) continue;
    const d = docAspect<Duong>(e, 'duong');
    if (!d) continue;
    ra.push({ id, d });
  }
  return ra;
}

/** Các vùng nối trực tiếp với `noiId`, kèm tuyến và độ trễ thật. */
export type LangGieng = { noiId: string; duongId: string; doTre: number };

export function langGieng(state: WorldState, noiId: string): LangGieng[] {
  const ra: LangGieng[] = [];
  for (const { id, d } of moiTuyenDuong(state)) {
    if (!d.thongSuot) continue;
    const kia = d.tuId === noiId ? d.denId : d.denId === noiId ? d.tuId : null;
    if (kia === null) continue;
    // Đường tốt đi nhanh hơn, nhưng không bao giờ nhanh hơn một tick.
    const heSo = 1 + (100 - kep(d.chatLuong, 0, 100)) / 100;
    ra.push({ noiId: kia, duongId: id, doTre: Math.max(1, Math.ceil(d.doDai * heSo)) });
  }
  return ra.sort((a, b) => (a.noiId < b.noiId ? -1 : a.noiId > b.noiId ? 1 : 0));
}

// ─────────────────────────────────────────── dựng patch

export function dat(nc: NgocCanhTienTrinh, id: string, path: string, value: unknown): PatchOp {
  return { op: 'set', target: { table: 'entities', id, path }, value, sourceEventId: nc.eventId };
}

export function cong(nc: NgocCanhTienTrinh, id: string, path: string, value: number): PatchOp {
  return { op: 'add', target: { table: 'entities', id, path }, value: lam(value), sourceEventId: nc.eventId };
}

export function datBang(
  nc: NgocCanhTienTrinh,
  table: string,
  id: string,
  path: string,
  value: unknown,
): PatchOp {
  return { op: 'set', target: { table, id, path }, value, sourceEventId: nc.eventId };
}

export function taoBanGhi(nc: NgocCanhTienTrinh, table: string, id: string, banGhi: unknown): PatchOp {
  return { op: 'link', target: { table, id, path: '' }, value: banGhi, sourceEventId: nc.eventId };
}

// ─────────────────────────────────────────── dân số

export type Cohort = { child: number; youth: number; adult: number; elder: number };

export function tongCohort(c: Cohort | undefined): number {
  if (!c) return 0;
  return c.child + c.youth + c.adult + c.elder;
}

/** Lao động thật: người lớn tính đủ, thanh niên nửa, trẻ và già không tính. */
export function laoDong(c: Cohort | undefined): number {
  if (!c) return 0;
  return c.adult + c.youth * 0.5;
}

/**
 * Rút `n` đơn vị khỏi một chuỗi bể, theo thứ tự cho trước.
 * Trả về lượng rút được thật — KHÔNG BAO GIỜ rút quá số đang có.
 * Đây là chỗ ngăn "vật chất từ trên trời rơi xuống" ngay tại nguồn.
 */
export function rutDan(be: number[], n: number): { lay: number[]; tong: number } {
  const lay = be.map(() => 0);
  let con = Math.max(0, n);
  for (let i = 0; i < be.length && con > 0; i++) {
    const co = Math.max(0, be[i] as number);
    const l = Math.min(co, con);
    lay[i] = l;
    con -= l;
  }
  return { lay, tong: lay.reduce((t, x) => t + x, 0) };
}
