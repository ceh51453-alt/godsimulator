/**
 * Tiến trình nền `storyline_beat` — Phần 28, 30.2.
 *
 * Nó là chỗ ba thứ của Khối G gặp nhau trong một tick:
 *
 *   1. `quetMachTruyen()`  — thế giới đủ điều kiện thì câu chuyện tự thành hình
 *   2. `nhipMachTruyen()`  — mạch đã có thì tự đi tiếp, kể cả khi không ai nhìn
 *   3. `raSoatPhucBut()`   — thứ đã gieo mà quá hạn thì thành bí ẩn, không mất
 *
 * [BB] 34.1 — nhịp mạch truyện nằm trong danh sách "engine thuần, không LLM".
 * Đây là lý do tiến trình này chạy mỗi tick mà không tốn một đồng nào.
 *
 * [BB] 28.2 — mạch mới luôn `nguoiChoiBiet = false`. Người chơi biết một mạch
 * qua đúng hai đường: bản tin (72.2, tin phải ĐI tới họ) hoặc ống kính chiếu
 * tới. Không có đường thứ ba, và đó là toàn bộ ý nghĩa của "thế giới đầy những
 * câu chuyện người chơi chưa từng nghe".
 */
import type { KetQuaTienTrinh, NgocCanhTienTrinh } from './types.js';
export declare function chayMachTruyen(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
