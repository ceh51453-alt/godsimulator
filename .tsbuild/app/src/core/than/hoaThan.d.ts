/**
 * Hóa thân — Phần 19.4 [BB].
 *
 * ── Điều khiến hóa thân đáng giá ──
 *
 * Một vị thần đi lại giữa loài người mà vẫn thấy hết, biết hết, làm được hết thì
 * không phải hóa thân — đó là du lịch. Cái giá thật là **quên**: `mucQuen` cao
 * nghĩa là phần thần ngủ sâu, và trong lúc đó `chieu()` hạ xuống mức phàm nhân
 * (xem `project/chieu.ts`). Vị thần ấy không đọc được luật, không thấy lãnh địa,
 * và phải sống bằng đúng thứ người trong thân xác ấy biết.
 *
 * Đó cũng là lý do `dieuKienThucTinh` là một CHUỖI chứ không phải một cờ: nó là
 * một điều kiện của thế giới — "khi thấy máu trên bậc đền" — và ai đó phải làm
 * cho nó xảy ra.
 */
import type { WorldState } from '../engine/state.js';
import type { PatchOp } from '../contracts/core.js';
import type { Avatar } from '../schema/aspect/divine.js';
import type { BlockReason } from '../contracts/primitives.js';
import type { KetQua } from '../contracts/errors.js';
export type YeuCauHoaThan = {
    readonly thanId: string;
    /** Thân xác có sẵn để nhập; `null` thì engine dựng một người mới ở `vungId`. */
    readonly thanTheId: string | null;
    readonly vungId: string | null;
    readonly ten: string;
    /** 0 = nhớ hết (nguy hiểm cho thế giới), 100 = quên sạch (nguy hiểm cho mình). */
    readonly mucQuen: number;
    readonly dieuKienThucTinh: string;
    readonly neuChet: Avatar['neuChet'];
};
export type KetQuaHoaThan = {
    readonly patches: readonly PatchOp[];
    readonly thanTheId: string;
    readonly loiKe: string;
};
/**
 * Vì sao chưa hạ phàm được.
 *
 * [BB] 19.4 — quyền năng còn lại phải NHỎ. Một vị thần giữ 90% sức mạnh trong
 * thân xác người không phải là hóa thân, đó là một con quái vật đội lốt, và nó
 * làm hỏng mọi tình huống mà cơ chế này sinh ra để tạo.
 */
export declare function kiemHoaThan(state: WorldState, yc: YeuCauHoaThan): BlockReason[];
export declare function hoaThan(state: WorldState, yc: YeuCauHoaThan, nc: {
    eventId: string;
    tick: number;
}): KetQua<KetQuaHoaThan>;
/**
 * Thức tỉnh — điều kiện đã xảy ra, phần thần mở mắt.
 *
 * Đây là chỗ tầm nhìn quay lại: `daThucTinh = true` làm `chieu()` thôi hạ xuống
 * mức phàm nhân. Trạng thái ở giữa (đang trong thân xác nhưng đã nhớ ra) là trạng
 * thái thú vị nhất của cả cơ chế, nên nó có thật chứ không phải một bước chuyển tiếp.
 */
export declare function thucTinh(state: WorldState, thanId: string, nc: {
    eventId: string;
    tick: number;
    lyDo: string;
}): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
/** Về trời: bỏ hóa thân, giữ lại thân xác như một con người bình thường. */
export declare function veThan(state: WorldState, thanId: string, nc: {
    eventId: string;
    tick: number;
}): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
