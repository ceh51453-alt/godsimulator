import type { KetQuaTienTrinh, NgocCanhTienTrinh } from './types.js';
/**
 * Dị Hóa — [BB] 69.1.
 *
 * Tiến trình này **KHÔNG** chạm `coreSelf`. Nó chỉ:
 *   1. đẩy `followerImage` theo những gì tín đồ đang trải qua;
 *   2. đo khoảng cách và ghi vào `pressure`;
 *   3. mở một *tình huống* khi khoảng cách vượt `tuning.than.nguongDiHoa`.
 *
 * Ai đó — người chơi hoặc `divine_agency` — phải **chọn** thì lõi mới đổi.
 */
export declare function chayDiHoa(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
/**
 * Lời cầu dâng lên và tắt đi.
 *
 * [BB] 22.2 — mỗi lời cầu sinh từ một bế tắc đo được. [BB] 22.3 — im lặng quá
 * hạn tính đúng như làm ngơ, kèm đủ hậu quả. Không có "lời cầu trang trí".
 */
export declare function chayCauNguyen(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
/**
 * Thần NPC sống khi người chơi vắng — cổng Phase 6.
 *
 * Ba việc, đúng thứ tự ưu tiên của một vị thần thật:
 *   1. đáp lại áp lực Dị Hóa đang treo (đây là chuyện của chính mình);
 *   2. trả lời lời cầu của tín đồ mình (đây là chuyện của người khác);
 *   3. rà lại vòng đời domain (đây là chuyện của cái mình sắp mất).
 *
 * [BB] 23.2 quy tắc 2 — mọi lựa chọn qua softmax, không lấy max.
 */
export declare function chayThanNpc(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
