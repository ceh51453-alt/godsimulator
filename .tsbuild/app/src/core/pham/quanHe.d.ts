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
import type { QuanHeMotChieu } from '../schema/aspect/soul.js';
/** Điều `tuId` đang nghĩ về `denId`. Chưa quen ai thì trả bản mặc định. */
export declare function quanHeCua(state: WorldState, tuId: string, denId: string): QuanHeMotChieu;
export type ThayDoiQuanHe = Partial<Omit<QuanHeMotChieu, 'kyUcChungIds'>> & {
    /** Cộng dồn vào bốn trục thay vì gán đè. */
    readonly cong?: Partial<Pick<QuanHeMotChieu, 'thanSo' | 'yeuGhet' | 'tinNgo' | 'noOn'>>;
    readonly themKyUcId?: string;
};
/**
 * Một patch duy nhất đổi điều `tuId` nghĩ về `denId`.
 *
 * Trả mảng để chỗ gọi cứ `push(...)` mà không phải nghĩ; mảng rỗng nghĩa là
 * không có gì đổi.
 */
export declare function datQuanHe(state: WorldState, tuId: string, denId: string, thayDoi: ThayDoiQuanHe, evId: string): PatchOp[];
/** Những người mà chủ thể này có quan hệ, sắp xếp theo mức đáng nhớ. */
export declare function nguoiTaQuen(state: WorldState, chuTheId: string): readonly {
    id: string;
    qh: QuanHeMotChieu;
}[];
