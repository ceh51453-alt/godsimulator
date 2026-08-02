/**
 * Scheduler tiến trình nền — Phần 71.4 [BB].
 *
 * "Một scheduler dựng đồ thị từ reads/writes:
 *   1. Process write cùng path bằng operation giao hoán (add) → gộp.
 *   2. `set` đụng `set` → cần priority manifest hoặc conflict reducer.
 *   3. Cycle process → chia stage hoặc fixed-point có giới hạn.
 *   4. Sau mỗi stage chạy invariant.
 *   5. Vi phạm → rollback stage, ghi diagnostic với process và patch gây lỗi."
 *
 * ── Vì sao scheduler áp patch rồi hoàn tác ──
 *
 * Handler chỉ đọc state, nên tiến trình ở stage 2 phải thấy kết quả của stage 1;
 * không có cách nào biết trước một lô patch có làm vỡ bất biến hay không ngoài
 * việc áp thử. Nhưng [BB] luật bất biến #4 nói state chỉ được đổi qua Event.
 *
 * Lối thoát: áp thử **trên chính state** để đọc đúng, giữ thông tin hoàn tác
 * chính xác của ADR-0011, rồi **hoàn tác toàn bộ theo thứ tự ngược** trước khi
 * trả về. State ra khỏi hàm này y hệt lúc vào; thứ đi ra là *danh sách patch đã
 * được chứng minh là an toàn*. Tick gói chúng vào Event và đi đường chính thức.
 *
 * Rẻ hơn `saoChepState()` mỗi tick rất nhiều: hoàn tác là O(số bản ghi bị chạm).
 */
import type { PatchOp } from '../../contracts/core.js';
import type { WorldState } from '../../engine/state.js';
import type { Tuning } from '../../tuning/schema.js';
import type { WorldProcessDef, KhaiBaoBaoToan } from '../../registry/types.js';
import type { PhanGiaiChay, TienTrinhNen, UngVienSuKien } from './types.js';
export type MucChanDoan = 'thong_tin' | 'canh_bao' | 'loi';
export type ChanDoanTienTrinh = {
    readonly ma: string;
    readonly muc: MucChanDoan;
    readonly tienTrinhIds: readonly string[];
    readonly thongDiep: string;
    /** Patch cụ thể gây lỗi, khi xác định được (71.4 quy tắc 5). */
    readonly patch?: string;
};
export type KetQuaScheduler = {
    /** Patch đã qua bảo toàn, hợp nhất xung đột và invariant. Áp lại là an toàn. */
    readonly patches: readonly PatchOp[];
    readonly suKien: readonly UngVienSuKien[];
    readonly chanDoan: readonly ChanDoanTienTrinh[];
    /** Số stage đã chạy — dùng cho benchmark và cho test đồ thị. */
    readonly soGiaiDoan: number;
    readonly daChay: readonly string[];
};
export type TuyChonScheduler = {
    readonly tick: number;
    readonly eventId: string;
    readonly tuning: Tuning;
    /** Catch-up: một lần chạy gộp bao nhiêu bước nhịp (71.6). */
    readonly soBuocGop?: number;
    /** Ép độ phân giải; bỏ trống thì mỗi tiến trình dùng khai báo của mình. */
    readonly phanGiai?: PhanGiaiChay;
    /** Bỏ trống thì lấy mười hai tiến trình dựng sẵn. */
    readonly tienTrinh?: readonly TienTrinhNen[];
};
/**
 * Chia giai đoạn: rút gọn theo thành phần liên thông mạnh, rồi sắp thứ tự.
 *
 * Quy tắc 3 nói "chia stage HOẶC fixed-point có giới hạn". Ở đây là chia stage:
 * chỉ những tiến trình **thật sự nằm trong một vòng** mới dùng chung ảnh chụp;
 * tiến trình chỉ *đứng sau* một vòng vẫn được chạy ở giai đoạn riêng và đọc kết
 * quả đã cập nhật.
 *
 * Vì sao phải chính xác đến thế: hai tiến trình cùng giai đoạn đều tính delta từ
 * cùng một ảnh chụp. Nếu cả hai cùng rút một cái kho, mỗi bên tưởng mình rút từ
 * kho đầy, và cộng lại thì kho âm. Gộp thừa vào một giai đoạn không phải là
 * "thận trọng" — nó tạo ra đúng cái bug mà quy tắc 4 phải đi dọn.
 *
 * Vòng dân số ↔ lương thực ↔ bệnh là vòng THẬT của thế giới, không phải lỗi khai
 * báo, nên nó chỉ sinh chẩn đoán mức `thong_tin`.
 */
export declare function chiaGiaiDoan(ds: readonly TienTrinhNen[]): {
    giaiDoan: TienTrinhNen[][];
    chuTrinh: string[][];
};
/** Tổng mọi `add` của một lô patch trên nhóm path đã khai. */
export declare function tongTheoKhaiBao(patches: readonly PatchOp[], kb: KhaiBaoBaoToan): number;
/**
 * Quy tắc 1 và 2 của 71.4.
 *
 * `add` cùng path từ nhiều tiến trình → cộng lại thành một (giao hoán, an toàn).
 * `set` cùng path từ nhiều tiến trình → `uuTien` cao thắng, hòa thì id nhỏ thắng;
 * kèm chẩn đoán để không có xung đột nào đi qua trong im lặng.
 */
export declare function honNhatXungDot(lo: readonly {
    def: WorldProcessDef;
    patches: readonly PatchOp[];
}[]): {
    patches: PatchOp[];
    chanDoan: ChanDoanTienTrinh[];
};
/**
 * Chạy các tiến trình đến nhịp cho MỘT bước.
 *
 * [BB] Hàm này trả `state` về đúng trạng thái lúc vào. Nó không commit gì.
 */
export declare function chayTienTrinhNen(state: WorldState, tc: TuyChonScheduler): KetQuaScheduler;
