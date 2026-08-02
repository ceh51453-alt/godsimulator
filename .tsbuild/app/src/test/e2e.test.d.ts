/**
 * E2E ba tầng — cổng Phase 11 mở ra và Phase 12 để lại, nay trả.
 *
 * ── Vì sao bài này chạy qua STORE chứ không qua `core/` ──
 *
 * Mọi cổng trước đều đo `core/`, và `core/` đã sạch từ Phase 1. Thứ chưa ai đo
 * tự động là **đường người chơi thật sự đi**: `useGame` gọi `doiCong()`, gọi
 * Narrator, bóc tách patch, gieo nền, chiếu ba tầng, ghi xuống đĩa, mở lại. Sáu
 * bước ấy nối với nhau ở store, và một chỗ đứt trong đó thì mọi test `core/` vẫn
 * xanh.
 *
 * ── Narrator giả, không phải Narrator tắt ──
 *
 * [BB] ADR-0028 — không có AI thì không chơi, và bài test này KHÔNG được phép
 * lách luật ấy. Nó thay `ke()` bằng một hàm trả về văn bản đã dựng sẵn, tức là
 * đóng vai một model **đang chạy**. Cổng vẫn phải mở, `doiCong()` vẫn phải cho
 * qua, và nếu ai đó gỡ cổng đi thì bài "cổng đóng thì không chơi được" ở cuối
 * file sẽ đỏ.
 */
import 'fake-indexeddb/auto';
