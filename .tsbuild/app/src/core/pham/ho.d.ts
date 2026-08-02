/**
 * Hộ — Phần 70.2 [BB]: "lập hộ, chăm người già, nhận con, tách hộ".
 *
 * ── Vì sao hộ phải là một ENTITY, không phải một trường `hoId` ──
 *
 * Phase 5 đã có `dan_cu.soHo` — một con số. Nó đủ để dân số học chạy, và không
 * đủ cho bất cứ câu chuyện nào: một con số không chia được cho ai khi người ta
 * chết, không cãi nhau được, và không nghèo đi được trong khi hàng xóm giàu lên.
 *
 * Hộ ở đây là entity kind `household` mang aspect `ho`. Nó có **kho chung**, và
 * đó là toàn bộ ý nghĩa: ăn chung nghĩa là đói chung. Một người trong nhà gãy
 * chân thì cả nhà ăn ít đi — không phải vì engine trừ điểm, mà vì thiếu một
 * người đi làm.
 *
 * [BB] Thừa kế đi qua `ClaimSchema` đã có sẵn từ Phase 0, không phải một phép
 * gán `tienCua += x`. Một cái nhà chia cho ba người con là ba `claim` với
 * `share` cộng lại bằng 1 — và nếu ai đó tranh, `status` thành `disputed`.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Ho, VaiTrongHo } from '../schema/aspect/pham.js';
import type { KetQua } from '../contracts/errors.js';
export declare function hoCua(e: Entity | undefined): Ho | undefined;
export type NgocCanhHo = {
    readonly eventId: string;
    readonly tick: number;
};
/** Hộ mà người này đang ở, nếu có. */
export declare function hoCuaNguoi(state: WorldState, nguoiId: string): {
    id: string;
    ho: Ho;
} | null;
/** Mọi hộ còn sống, sắp xếp deterministic. */
export declare function moiHo(state: WorldState): {
    id: string;
    e: Entity;
    ho: Ho;
}[];
export type YeuCauLapHo = {
    readonly chuHoId: string;
    readonly thanhVien: readonly {
        id: string;
        vai: VaiTrongHo;
    }[];
    readonly noiOId: string;
    /** Hộ tách ra từ hộ nào; `null` là hộ dựng mới hoàn toàn. */
    readonly hoGocId?: string | null;
    readonly ten?: string;
    /**
     * Bỏ qua phép kiểm "đã ở trong một hộ".
     *
     * Chỉ `tachHo()` dùng: nó dựng hộ mới VÀ rời hộ cũ trong cùng một lô patch,
     * nhưng `lapHo()` đọc state CHƯA áp lô ấy, nên người kia vẫn đang ở nhà cũ.
     * Không có cờ này thì tách hộ luôn tự chặn chính mình.
     */
    readonly dangTachTuHo?: boolean;
};
/**
 * Lập một hộ mới.
 *
 * Kho khởi đầu **rỗng**. Đây là cùng một luật với `vatChatHoa()` của Phase 5:
 * không materialize của cải từ hư không. Hộ mới sống bằng cái nó tự làm ra, hoặc
 * bằng cái hộ gốc chia cho — và phần chia ấy phải là một patch trừ đi ở hộ gốc.
 */
export declare function lapHo(state: WorldState, yc: YeuCauLapHo, nc: NgocCanhHo): KetQua<{
    patches: readonly PatchOp[];
    hoId: string;
    loiKe: string;
}>;
/** Nhập vào một hộ đã có — cưới, về ở rể, nhận con nuôi, hoặc chỉ là trọ. */
export declare function nhapHo(state: WorldState, nguoiId: string, hoId: string, vai: VaiTrongHo, nc: NgocCanhHo): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
/** Rời hộ — không xóa link, chỉ cắt nó. [BB] 6.3 quy tắc 4: để lại sẹo. */
export declare function roiHo(state: WorldState, nguoiId: string, hoId: string, nc: NgocCanhHo): PatchOp[];
export type KetQuaNuoiHo = {
    readonly patches: readonly PatchOp[];
    readonly thieu: number;
    readonly suKien: readonly {
        loai: string;
        moTa: string;
        mucDo: 'thuong' | 'lon';
    }[];
};
/**
 * Một nhịp ăn uống của cả nhà.
 *
 * [BB] Kho chung nghĩa là **đói chung**, và người già cùng trẻ con ăn ít hơn
 * nhưng cũng không làm ra gì. Một nhà bốn người trong đó ba người không lao
 * động được là một nhà sắp có chuyện — engine cho ra điều đó, không ai phải
 * kịch bản hóa nó.
 */
export declare function nuoiHo(state: WorldState, hoId: string, nc: NgocCanhHo, soBuocGop?: number): KetQuaNuoiHo;
/**
 * Tách hộ — con cái lớn ra ở riêng.
 *
 * Phần chia là một phép **trừ ở hộ gốc và cộng ở hộ mới**, không phải một phép
 * nhân đôi. Đây là chỗ bảo toàn vật chất của Phase 5 áp vào đời sống hộ.
 */
export declare function tachHo(state: WorldState, hoGocId: string, nguoiId: string, nc: NgocCanhHo): KetQua<{
    patches: readonly PatchOp[];
    hoMoiId: string;
    loiKe: string;
}>;
export type PhanChia = {
    readonly nguoiId: string;
    readonly phan: number;
};
/**
 * Ai được thừa kế và bao nhiêu — [BB] 20.3 "kế thừa giữ claim/quan hệ đúng".
 *
 * Thứ tự: hộ tự khai trước, rồi tới con, rồi tới bạn đời, rồi tới học trò. Không
 * ai thì tài sản về hộ, và hộ không còn ai thì nó tan — của cải quay lại vùng
 * chứ **không biến mất** (bảo toàn vật chất, 71.4).
 */
export declare function nguoiThuaKe(state: WorldState, nguoiChetId: string): readonly PhanChia[];
/**
 * Chuyển quyền sở hữu khi một người chết.
 *
 * `soHuu` là `Claim[]`, nên chia cho ba người con là ba claim `share = 1/3` trỏ
 * cùng một `targetId`. Không có phép cộng số dư nào ở đây, và đó là chủ ý: một
 * cái nhà chia ba không phải ba cái nhà.
 */
export declare function chuyenThuaKe(state: WorldState, nguoiChetId: string, nc: NgocCanhHo): {
    patches: readonly PatchOp[];
    nguoiNhan: readonly PhanChia[];
    loiKe: string;
};
/** Hộ không còn ai sống thì tan; của cải còn lại trả về kho của vùng. */
export declare function giaiTheHo(state: WorldState, hoId: string, nc: NgocCanhHo): PatchOp[];
