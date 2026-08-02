/**
 * Cổng Phase 12 phần đĩa — backup/restore, migration mọi version, soak save lớn.
 *
 * ── Ba câu hỏi mà mười một phase trước chưa ai hỏi ──
 *
 *   1. Người chơi đóng tab rồi mở lại thì ván còn không?
 *   2. Một save 10.000 nhịp mở lại có đúng không, và có mở nổi không?
 *   3. Một máy cài từ đầu — Dexie chạy thẳng lên v9 — có giống một máy đã nâng
 *      cấp dần từ v1 không?
 *
 * Câu 3 là câu dễ bị bỏ nhất, vì trên máy lập trình viên nó luôn đúng: ai cũng
 * cài mới. Nó chỉ sai trên máy người dùng đã chơi từ bản cũ, tức là đúng những
 * người mất nhiều nhất nếu nó sai.
 */
import 'fake-indexeddb/auto';
