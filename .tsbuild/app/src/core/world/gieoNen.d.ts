/**
 * Gieo state nền cho một thế giới mới — Phần 71.2, 72.4.
 *
 * Một `place` không có `dan_cu`/`kinh_te`/`sinh_thai` sẽ bị mười hai tiến trình
 * **bỏ qua trong im lặng**: không lỗi, không cảnh báo, chỉ là một vùng đứng hình
 * mãi mãi. Vì vậy gieo nền là một phần của khởi tạo thế giới, không phải tùy chọn.
 *
 * [BB] Nguyên tắc gieo: **không tặng của cải**. Trữ lượng vừa đủ nuôi số dân đang
 * có, kho vừa đủ ăn vài mùa. Muốn giàu thì phải có ai đó làm ra nó trong lịch sử
 * của chính thế giới này.
 */
import type { Event, PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Rng } from '../engine/rng.js';
/** Tháp tuổi tiền công nghiệp; tổng đúng bằng `danSo`, không sai một người. */
export declare function thapTuoi(danSo: number): {
    child: number;
    youth: number;
    adult: number;
    elder: number;
};
/** Bộ aspect nền của một vùng, suy từ dân số đang có. */
export declare function aspectNen(danSo: number, rng: Rng): Record<string, unknown>;
/**
 * Patch gieo nền cho mọi `place` chưa có, cộng một tuyến đường nối chúng.
 *
 * Tuyến đường không phải trang trí: thiếu nó thì tin tức, bệnh, hàng hóa và
 * người đều không đi đâu được, và cả sáu tiến trình vùng đứng yên.
 */
export declare function patchGieoNen(state: WorldState, eventId: string, seed: string): PatchOp[];
/**
 * Event gieo nền. Người gọi đưa nó qua `apDungEvent` như mọi Event khác —
 * [BB] luật bất biến #4: không có cửa nào khác để state đổi.
 *
 * Chạy lại trên một thế giới đã gieo là **không làm gì** (patch rỗng), nên gọi
 * nó sau mỗi lần nạp save là an toàn và là cách đơn giản nhất để vùng mới do
 * người chơi `HIỆN` ra cũng có đủ nền.
 */
export declare function eventGieoNen(state: WorldState, hauTo?: string): Event | null;
