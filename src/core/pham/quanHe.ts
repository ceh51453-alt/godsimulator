/**
 * Quan hệ một chiều — Phần 11.2 [BB].
 *
 * ── Vì sao cần một file riêng cho hai hàm nhỏ ──
 *
 * Vì cách sai thì rất tự nhiên. Viết `add` lên `aspects.soul.quanHe.<id>.tinNgo`
 * trông hoàn toàn hợp lý, và nó hỏng theo hai kiểu cùng lúc:
 *
 *   1. bản ghi chưa tồn tại → `add` không có số để cộng vào;
 *   2. tạo bản ghi bằng một patch chạm một trường → pha 2 của `apDungPatch`
 *      parse lại cả entity và **cả lô bị từ chối**.
 *
 * Nên mọi thay đổi quan hệ đi qua đây: đọc bản cũ, gộp, phát **một** `set` với
 * một object đã `parse` đầy đủ.
 *
 * [BB] Không có hàm nào đồng bộ hai chiều. Việc A quý B không nói gì về việc B
 * nghĩ gì về A, và đó là điểm của 11.2.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { QuanHeMotChieu, Soul } from '../schema/aspect/soul.js';
import { QuanHeMotChieuSchema } from '../schema/aspect/soul.js';

function hon(e: Entity | undefined): Soul | undefined {
  const a = e?.aspects['soul'];
  return a && typeof a === 'object' ? (a as Soul) : undefined;
}

/** Điều `tuId` đang nghĩ về `denId`. Chưa quen ai thì trả bản mặc định. */
export function quanHeCua(state: WorldState, tuId: string, denId: string): QuanHeMotChieu {
  const s = hon(state.entities.get(tuId));
  const co = s?.quanHe?.[denId];
  return co ? QuanHeMotChieuSchema.parse(co) : QuanHeMotChieuSchema.parse({});
}

export type ThayDoiQuanHe = Partial<Omit<QuanHeMotChieu, 'kyUcChungIds'>> & {
  /** Cộng dồn vào bốn trục thay vì gán đè. */
  readonly cong?: Partial<Pick<QuanHeMotChieu, 'thanSo' | 'yeuGhet' | 'tinNgo' | 'noOn'>>;
  readonly themKyUcId?: string;
};

const kep = (x: number): number => Math.max(-100, Math.min(100, Math.round(x)));

/**
 * Một patch duy nhất đổi điều `tuId` nghĩ về `denId`.
 *
 * Trả mảng để chỗ gọi cứ `push(...)` mà không phải nghĩ; mảng rỗng nghĩa là
 * không có gì đổi.
 */
export function datQuanHe(
  state: WorldState,
  tuId: string,
  denId: string,
  thayDoi: ThayDoiQuanHe,
  evId: string,
): PatchOp[] {
  if (tuId === denId || !state.entities.has(tuId)) return [];

  const cu = quanHeCua(state, tuId, denId);
  const c = thayDoi.cong ?? {};
  const moi = QuanHeMotChieuSchema.parse({
    thanSo: kep((thayDoi.thanSo ?? cu.thanSo) + (c.thanSo ?? 0)),
    yeuGhet: kep((thayDoi.yeuGhet ?? cu.yeuGhet) + (c.yeuGhet ?? 0)),
    tinNgo: kep((thayDoi.tinNgo ?? cu.tinNgo) + (c.tinNgo ?? 0)),
    noOn: kep((thayDoi.noOn ?? cu.noOn) + (c.noOn ?? 0)),
    anTuong: thayDoi.anTuong ?? cu.anTuong,
    // Giữ ba ký ức chung gần nhất — 11.2 khai `max(3)`, và ba là đủ để nhớ nhau.
    kyUcChungIds: thayDoi.themKyUcId
      ? [...cu.kyUcChungIds.filter((x) => x !== thayDoi.themKyUcId), thayDoi.themKyUcId].slice(-3)
      : [...cu.kyUcChungIds],
    laHuyenThoai: thayDoi.laHuyenThoai ?? cu.laHuyenThoai,
    xungHo: thayDoi.xungHo ?? cu.xungHo,
  });

  return [
    {
      op: 'set',
      target: { table: 'entities', id: tuId, path: `aspects.soul.quanHe.${denId}` },
      value: moi,
      sourceEventId: evId,
    },
  ];
}

/** Những người mà chủ thể này có quan hệ, sắp xếp theo mức đáng nhớ. */
export function nguoiTaQuen(
  state: WorldState,
  chuTheId: string,
): readonly { id: string; qh: QuanHeMotChieu }[] {
  const s = hon(state.entities.get(chuTheId));
  const ra: { id: string; qh: QuanHeMotChieu }[] = [];
  for (const id of Object.keys(s?.quanHe ?? {}).sort()) {
    const qh = s?.quanHe?.[id];
    if (qh) ra.push({ id, qh: QuanHeMotChieuSchema.parse(qh) });
  }
  // Đậm trước nhạt sau: |thân sơ| + |yêu ghét| + |nợ ơn|.
  ra.sort((a, b) => {
    const d = (x: QuanHeMotChieu): number => Math.abs(x.thanSo) + Math.abs(x.yeuGhet) + Math.abs(x.noOn);
    const c = d(b.qh) - d(a.qh);
    return c !== 0 ? c : a.id < b.id ? -1 : 1;
  });
  return Object.freeze(ra);
}
