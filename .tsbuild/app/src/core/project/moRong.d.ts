/**
 * Mở rộng đồ thị — Phần 6.4 [BB].
 *
 * `diem = (trongSo/100) × suyGiamMoiHop^hop × heSoTruyenBa(quanHe)`
 *
 * ── Vì sao chữ ký chỉ nhận `WorldView` ──
 *
 * 6.4 nói `view` là "BẮT BUỘC khi dùng cho assembler", và 33.2 nhắc lại bằng chữ
 * in: `moRong(tiêu điểm, { soHop: 2, view })  ← BẮT BUỘC truyền view`. Một tham
 * số bắt buộc-theo-tài-liệu là một tham số sẽ bị quên. Ở đây nó là tham số DUY
 * NHẤT có thể truyền: hàm không nhận `WorldState`, nên không có phiên bản "quên
 * truyền view" để mà gọi nhầm.
 *
 * `view.links` đã chỉ chứa cạnh có cả hai đầu nhìn thấy được (xem `chieu()`),
 * nên chống rò rỉ ở đây là hệ quả của kiểu dữ liệu, không phải của sự cẩn thận.
 */
import type { WorldView } from '../contracts/view.js';
export type TuyChonMoRong = {
    readonly soHop?: number;
    readonly suyGiamMoiHop?: number;
    readonly loaiQuanHe?: readonly string[];
    readonly nguongTrongSo?: number;
    readonly toiDa?: number;
    /** [BB] 6.4 — bắt buộc. Không có bản nào chạy trên World thô. */
    readonly view: WorldView;
};
export type NotMoRong = {
    readonly id: string;
    readonly kind: string;
    readonly diem: number;
    readonly duongDi: readonly string[];
};
/**
 * Mở rộng từ một tập gốc.
 *
 * Duyệt theo lớp (BFS) chứ không theo điểm: hai hop từ tiêu điểm là hai hop, và
 * một cạnh nặng ở hop 2 không được phép nhảy lên trước một cạnh nhẹ ở hop 1.
 * Nếu ưu tiên theo điểm, một quan hệ `hien_than_cua` (0.95) ở xa sẽ đè bẹp toàn
 * bộ hàng xóm trực tiếp, và tiêu điểm mất nghĩa.
 */
export declare function moRong(gocIds: readonly string[], opts: TuyChonMoRong): readonly NotMoRong[];
/** Khoảng cách đồ thị (số hop) từ tiêu điểm — đầu vào `graphDistance` của 77.3. */
export declare function khoangCachDoThi(mr: readonly NotMoRong[]): ReadonlyMap<string, number>;
