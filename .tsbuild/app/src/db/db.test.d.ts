/**
 * Cổng Phase 2 — persistence, migration và nhánh.
 *
 * Cổng (Phần 75 Phase 2 + Prompt IDE):
 *   - fork rồi sửa cùng entity ở hai nhánh KHÔNG đè nhau;
 *   - crash giữa migration phục hồi được;
 *   - save round-trip giữ hash;
 *   - export không chứa secret hoặc hồ sơ riêng mặc định;
 *   - save cũ mở thẳng vào game, không bị ép onboarding lại;
 *   - cache không bao giờ được đọc chéo nhánh/chủ thể;
 *   - save mới hơn app bị từ chối tử tế.
 */
import 'fake-indexeddb/auto';
