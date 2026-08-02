/**
 * Affordance collector — Phần 67.4, 67.7.
 *
 * "Thu hoạch affordance từ aspect, quan hệ, vật sở hữu, địa điểm, luật và R.action."
 *
 * [BB] 67.7 — gợi ý lấy từ `WorldView`, KHÔNG lộ target mù. Gợi ý không làm những
 * hành động khác bất khả thi; ô nhập tự do luôn hiện.
 */
import type { WorldView } from '../contracts/view.js';
import type { Affordance } from './schema.js';
/**
 * Thu hoạch affordance cho một chủ thể.
 *
 * [BB] Chỉ duyệt `view.entities` — thứ đã qua quyền nhìn. Entity trong `suongMu.mu`
 * không bao giờ xuất hiện ở đây, kể cả để bị loại sau.
 */
export declare function thuHoachAffordance(view: WorldView, chuTheId: string | null): readonly Affordance[];
/**
 * Chọn 3–5 gợi ý cho UI — Phần 67.7.
 * [BB] Đây là GỢI Ý. Người chơi được kết hợp, sửa, hoặc bỏ hoàn toàn.
 */
export declare function goiYChoCanh(view: WorldView, chuTheId: string | null, toiDa?: number): readonly Affordance[];
