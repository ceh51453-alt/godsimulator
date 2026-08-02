/**
 * Bộ chọn chủ thể — Phần 21.3, 79.4.
 *
 * ── Vì sao file này tồn tại ──
 *
 * Phase 6 đóng lại với một giới hạn được ghi thẳng vào tài liệu: bấm "Thần" trong
 * trình duyệt có lần vào tầng Thần, có lần rơi xuống Phàm Nhân. Nguyên nhân không
 * phải ở React. `doiHienDien()` của Phase 3 chọn "entity `deity` **đầu tiên trong
 * view**", và `view` là kết quả của `chieu()` — tập entity thấy được **đổi theo
 * tầng đang đứng**. Đứng ở Phàm Nhân thì phần lớn thần chỉ còn ở mức tin đồn hoặc
 * bị lọc mất, nên "đầu tiên" hôm nay và "đầu tiên" hôm qua là hai người khác nhau,
 * và có lúc là không ai cả — lúc ấy `chuTheId = null` và tầng tụt về mặc định.
 *
 * Sửa đúng là chọn trên **thế giới thật** với một luật xếp hạng ổn định, rồi để
 * UI hỏi người chơi khi có nhiều hơn một ứng viên. Chọn hộ người chơi một danh
 * tính là việc chỉ nên làm khi không còn gì để hỏi.
 *
 * File này thuần: nó đọc `WorldState` và trả về danh sách. Nó không sinh Event —
 * `eventChuyenTang` vẫn là cửa duy nhất đổi `playerState`.
 */
import type { WorldState } from '../engine/state.js';
import type { ViewMode } from '../contracts/primitives.js';
export type UngVienChuThe = {
    readonly id: string;
    readonly ten: string;
    readonly moTa: string;
    /** Câu giải thích vì sao người này đáng chọn — UI hiện thẳng, không cần dịch. */
    readonly vi: string;
    /** Đã từng nhập vào người này chưa. */
    readonly daTungNhap: boolean;
    /** Điểm xếp hạng; chỉ dùng để sắp xếp, không hiện ra. */
    readonly diem: number;
};
/**
 * Ứng viên chủ thể cho một tầng, đã xếp hạng.
 *
 * Thứ tự: chủ thể đang nhập trước nhất (quay lại đúng chỗ mình vừa rời), rồi tới
 * nhân vật do người chơi tạo, rồi tới người có chỗ đứng trong thế giới, rồi tới
 * phần còn lại theo id để kết quả ổn định giữa hai lần chạy.
 */
export declare function chonChuThe(state: WorldState, mode: ViewMode): readonly UngVienChuThe[];
/**
 * Chủ thể mặc định khi người chơi không chọn.
 *
 * Trả `null` là một câu trả lời hợp lệ và quan trọng: nó có nghĩa "tầng này chưa
 * có ai để nhập". Gọi hàm này rồi bỏ qua `null` chính là cách lỗi cũ xảy ra.
 */
export declare function chuTheMacDinhCho(state: WorldState, mode: ViewMode): string | null;
/** Tầng nào đang có người để nhập — UI dùng để làm mờ nút thay vì báo lỗi sau khi bấm. */
export declare function tangKhaDung(state: WorldState): Readonly<Record<ViewMode, boolean>>;
