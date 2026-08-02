/**
 * Hiện diện ban đầu — Phần 78.4, 78.7, 78.8; luật bất biến #19 [BB].
 *
 * "Việc chọn bắt đầu là Sáng Thế, Thần hay Phàm phải đi qua Intent → validator →
 *  Event/Patch; wizard KHÔNG ghi World trực tiếp."
 *
 * [BB] 78.7 — không cho tự khai `domainStrength`; `suc` do ENGINE quyết từ trạng
 * thái khái niệm, không từ input người chơi.
 * [BB] 78.8 — không cho tự gõ tài sản/kỹ năng vô hạn rồi nhận thẳng.
 */
import type { WorldState } from '../engine/state.js';
import type { Event } from '../contracts/core.js';
import type { StartingPresenceDraft } from '../schema/player.js';
import type { WorldView } from '../contracts/view.js';
import type { BlockReason } from '../contracts/primitives.js';
import type { KetQua } from '../contracts/errors.js';
/** Diff canon: "game sẽ tạo gì" — [BB] 78.4 bước 2, hiện TRƯỚC khi commit. */
export type CanonDiff = {
    /** Entity sẽ được tạo. */
    seTao: readonly {
        id: string;
        kind: string;
        ten: string;
        moTa: string;
    }[];
    /** Quan hệ sẽ được nối. */
    seNoi: readonly string[];
    /** Điều engine QUYẾT, không phải người chơi khai. */
    engineQuyet: readonly string[];
    /** Điều người chơi xin nhưng KHÔNG được cấp thẳng. */
    khongCapThang: readonly string[];
};
export type KetQuaHienDien = {
    events: readonly Event[];
    diff: CanonDiff;
    /** Id entity chủ thể sau khi commit; null nếu bắt đầu ở Sáng Thế. */
    chuTheId: string | null;
};
/**
 * Validator cho bản nháp hiện diện — [BB] 78.4 bước 1, 78.7, 78.8.
 * Chạy trên WorldView (thứ người chơi được biết), không trên World thô.
 */
export declare function kiemNhapHienDien(draft: StartingPresenceDraft, view: WorldView, state: WorldState): BlockReason[];
/**
 * Biến bản nháp thành Event. [BB] Chỉ gọi sau khi validator sạch và người chơi
 * đã xác nhận `CanonDiff`.
 */
export declare function eventHienDien(draft: StartingPresenceDraft, view: WorldView, state: WorldState): KetQua<KetQuaHienDien>;
/** Chuyển tầng — Phần 21.3. Chỉ đổi mode + chuTheId, KHÔNG tạo save mới. */
export declare function eventChuyenTang(state: WorldState, denMode: StartingPresenceDraft['mode'], chuTheId: string | null, lyDo: string): Event;
