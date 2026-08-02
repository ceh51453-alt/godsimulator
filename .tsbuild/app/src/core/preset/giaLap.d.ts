/**
 * WorldView và Scene GIẢ cho bước 10 — Phần 63.1 bước 10, 63.7.
 *
 * ── Vì sao dry run phải dùng thế giới giả ──
 *
 * [BB] 63.7: "Dry run không làm bẩn save." Cách chắc chắn nhất không phải là cẩn
 * thận khi đọc save — mà là **không đưa save vào**. View ở đây có đủ hình dạng để
 * compiler chạy thật, và không một id nào của nó tồn tại trong một nhánh nào.
 *
 * View giả cố ý có `suongMu.mu` KHÔNG rỗng: cổng 66.5 đòi chứng minh "Compile
 * Narrator không thể đọc entity `view.suongMu.mu`". Muốn chứng minh điều đó thì
 * phải có ít nhất một entity nằm trong danh sách mù, và tên của nó phải là một
 * chuỗi đủ lạ để tìm được trong prompt đầu ra.
 */
import type { WorldView } from '../contracts/view.js';
import type { Scene } from '../contracts/core.js';
/** Tên chỉ tồn tại trong entity bị che — nếu nó xuất hiện trong prompt thì đã rò. */
export declare const TEN_BI_CHE = "ZZ_KHONG_DUOC_THAY_ZZ";
/**
 * Một `WorldView` tối thiểu nhưng hợp lệ.
 *
 * Hàm thuần, không đọc DB, không đọc `WorldState`. Cùng tham số cho cùng view,
 * nên hash prompt của dry run so sánh được giữa hai lần chạy.
 */
export declare function viewGia(ghiDe?: Partial<WorldView>): WorldView;
export declare function sceneGia(ghiDe?: Partial<Scene>): Scene;
