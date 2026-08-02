/**
 * Một thể hiện Dexie duy nhất cho ứng dụng đang chạy.
 *
 * Tạo **lười**: mở IndexedDB là một tác dụng phụ, và test lõi không được phải
 * trả giá cho nó chỉ vì lỡ import nhầm một file. Test của `db/` tự dựng thể hiện
 * riêng với tên riêng (`new ThienDienDb('thien-dien-test-N')`), nên hàm này chỉ
 * phục vụ đường chạy thật trong trình duyệt.
 */
import { ThienDienDb } from './schema.js';
import type { StructuredError } from '../core/contracts/errors.js';
export declare function layDb(): ThienDienDb;
/**
 * Khởi động lớp đĩa: mở Dexie rồi chạy **migration dữ liệu** một lần.
 *
 * ── Lỗ hổng mà việc này bịt lại (Phase 12) ──
 *
 * Dexie tự lo phần đổi INDEX giữa các version. Phần đổi DỮ LIỆU — dời bản ghi
 * sang khóa kép theo nhánh (ADR-0015), đặt `setupCompleted` cho save cũ (78.10),
 * gieo aspect nền cho `place` của save trước Phase 5 — nằm ở `migration.ts` và
 * suốt mười một phase **không có ai gọi nó**. Hạ tầng có, test có, đường chạy
 * thật thì không: một save v1 mở trong bản hôm nay sẽ đọc ra rỗng và người chơi
 * mất ván mà không có thông báo nào.
 *
 * ── Vì sao gọi ở ĐÂY và gọi MỘT LẦN ──
 *
 * Trước khi bất kỳ ván nào được tạo. `chayMigrationV2V3` đặt `setupCompleted =
 * true` cho mọi world nó thấy; chạy nó sau khi người chơi vừa mở một ván mới sẽ
 * làm ván ấy nhảy qua wizard hiện diện. Checkpoint trong `migration.ts` giữ cho
 * lần khởi động thứ hai không làm gì — và bài test `phase12Db.test.ts` khẳng
 * định đúng hai vế đó.
 *
 * Trả về danh sách lỗi thay vì ném: mất IndexedDB không phải lý do để màn hình
 * trắng, và một máy không migration được vẫn phải mở được Cài Đặt để người dùng
 * xuất dữ liệu ra.
 */
export declare function khoiDongDb(): Promise<readonly StructuredError[]>;
/** Có IndexedDB để mà mở không — trình duyệt ở chế độ riêng tư có thể không có. */
export declare function coIndexedDb(): boolean;
