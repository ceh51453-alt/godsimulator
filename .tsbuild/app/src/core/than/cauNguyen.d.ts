/**
 * Cầu nguyện — Phần 22 [BB].
 *
 * > "Game thần thánh luôn vấp câu hỏi 'giờ tôi làm gì'.
 * >  Câu trả lời: để thế giới tự tìm đến người chơi."
 *
 * [BB] 22.2 — lời cầu **không được bịa**. Nó chỉ sinh ra khi có một bế tắc thật:
 * một chủ thể muốn điều gì đó (điểm utility cao) mà `khaThi()` không cho. Nhờ
 * vậy mọi lời cầu đều truy được về một chỗ kẹt trong mô phỏng, và trả lời nó
 * thật sự thay đổi một thứ gì đó.
 *
 * Ở Phase 5, phần lớn dân là cohort T0 chưa có tên. Nên bế tắc được đo ở mức
 * **vùng**: thiếu ăn, dịch bệnh, chiến sự, đường đứt. Khi Phase 7 cho phàm nhân
 * có tên và có lịch, cùng hàm này chạy trên từng người mà không phải sửa gì.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Rng } from '../engine/rng.js';
import type { Prayer, CachTraLoi, LoaiCau } from '../schema/than.js';
/** Một bế tắc thật, đo từ state — không phải từ trí tưởng tượng của model. */
export type BeTac = {
    readonly noiId: string;
    readonly ducVongThieu: string;
    readonly canTroId: string | null;
    /** Điểm utility mà chủ thể mong muốn nhưng không với tới. */
    readonly diemMongMuon: number;
    /** 0–1. Càng thấp càng bế tắc. */
    readonly khaThi: number;
    readonly loai: LoaiCau;
    readonly noiDung: string;
    readonly soNguoi: number;
};
/**
 * Quét bế tắc của một vùng.
 *
 * Mỗi mục dưới đây là một dục vọng của `soul.ducVong` bị chặn bởi một con số
 * THẬT trong `kinh_te` / `y_te` / `an_ninh`. Không có mục nào là văn vẻ.
 */
export declare function quetBeTac(state: WorldState, noiId: string): readonly BeTac[];
/**
 * Chọn vị thần được gọi tên.
 *
 * Cầu cho ai nghe? Ai có đền ở đây. Không có đền nào thì lời cầu là **cầu
 * chung** (`thanNhanId = null`) — nó vẫn tồn tại, vẫn được kể, chỉ là chưa có
 * địa chỉ. Đây là cách một vị thần mới có thể "nhặt" tín đồ của kẻ khác.
 */
export declare function thanDuocGoi(state: WorldState, noiId: string, rng: Rng): string | null;
/** [BB] 22.2 — chỉ sinh khi `khaThi` dưới ngưỡng. Trên ngưỡng thì họ tự làm được. */
export declare const NGUONG_KHA_THI = 0.45;
export declare function sinhLoiCau(state: WorldState, bt: BeTac, ctx: {
    tick: number;
    eventId: string;
    rng: Rng;
}): {
    prayer: Prayer;
    patch: PatchOp;
} | null;
export type KetQuaTraLoi = {
    readonly patches: readonly PatchOp[];
    readonly loiKe: string;
};
/**
 * Trả lời một lời cầu. Bốn cách, cả bốn đều để lại dấu.
 *
 * [BB] 22.3 — `lam_ngo` KHÔNG phải "không có gì xảy ra". Nó tích `doThatVong`,
 * và vượt ngưỡng thì tín đồ đổi thần hoặc sinh tà giáo. Nó có Event riêng và
 * vào Sổ Nhân Quả như ba cách kia.
 */
export declare function traLoiCau(state: WorldState, prayer: Prayer, cach: Exclude<CachTraLoi, 'chua'>, ctx: {
    tick: number;
    eventId: string;
}): KetQuaTraLoi;
/** Lời cầu quá hạn mà không ai trả lời — im lặng tính như làm ngơ. */
export declare function loiCauQuaHan(state: WorldState, tick: number): readonly Prayer[];
/** Lời cầu đang chờ một vị thần cụ thể, sắp theo 22.4. */
export declare function loiCauCho(state: WorldState, thanId: string | null, tick: number): readonly Prayer[];
