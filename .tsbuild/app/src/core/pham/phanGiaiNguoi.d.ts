/**
 * Thăng và giáng hạng NPC — Phần 70.3 [BB].
 *
 * ── Câu mà 70.3 bắt phải bỏ đi ──
 *
 * Phần 25 cũ nói *"NPC tầng thấp không cần có tâm hồn"*. 70.3 thay nó bằng:
 *
 * > "NPC ngoài sân khấu không cần được mô phỏng ở cùng độ phân giải, nhưng lịch
 * > sử của họ phải đủ để khi bước vào ánh sáng, họ đã sống từ trước."
 *
 * Khác biệt giữa hai câu ấy là toàn bộ file này. Giáng hạng **giảm độ phân giải
 * xử lý**, không xóa đời sống:
 *
 *   giữ nguyên   mục tiêu, lịch, thân thể, hộ, ba quan hệ mạnh nhất
 *   nén          quan hệ yếu → gộp theo nhóm, **khôi phục được nguồn**
 *   không đụng   ký ức, thương tích, di chứng, nghĩa vụ, tiếng tăm
 *
 * [BB] Điểm khó nhất là chữ "khôi phục được nguồn": nén không được là mất. Nên
 * bản nén giữ **danh sách id** của những quan hệ đã gộp, chứ không chỉ giữ một
 * con số đếm.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { KetQua } from '../contracts/errors.js';
export type NgocCanhHang = {
    readonly eventId: string;
    readonly tick: number;
};
/** Ba quan hệ mạnh nhất được giữ nguyên vẹn — 70.3. */
export declare const SO_QUAN_HE_GIU = 3;
/** Khóa của bản ghi nén. Dùng chung ở mọi nơi để nén và mở nén khớp nhau. */
export declare const KHOA_NEN = "__nen__";
/**
 * Giáng hạng: t2/t3 → t1.
 *
 * Quan hệ yếu bị gộp vào một bản ghi duy nhất dưới khóa `__nen__`, mang theo
 * `kyUcChungIds` là **danh sách id** của những người đã bị gộp. Đó là đường
 * khôi phục: thăng hạng lại thì mở đúng danh sách ấy ra.
 */
export declare function giangHang(state: WorldState, nguoiId: string, nc: NgocCanhHang): KetQua<{
    patches: readonly PatchOp[];
    soNen: number;
    loiKe: string;
}>;
/**
 * Thăng hạng: t1 → t2.
 *
 * Mở lại danh sách đã nén. Quan hệ khôi phục về mức trung bình đã lưu chứ không
 * về giá trị gốc — nén là **mất chi tiết có kiểm soát**, và điều đó trung thực
 * hơn là giả vờ khôi phục nguyên vẹn.
 */
export declare function thangHang(state: WorldState, nguoiId: string, nc: NgocCanhHang): KetQua<{
    patches: readonly PatchOp[];
    soMoLai: number;
    loiKe: string;
}>;
/**
 * Nên ở hạng nào, theo khoảng cách tới ống kính.
 *
 * Hàm thuần để scheduler gọi mà không phải tự nghĩ ra chính sách. `soChang` là
 * số chặng đường tới chỗ người chơi; `null` là không có đường tới.
 */
export declare function hangNenO(soChang: number | null, laChuThe: boolean, banKinhGan: number): 't1' | 't2' | 't3';
