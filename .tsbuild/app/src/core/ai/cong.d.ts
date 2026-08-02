/**
 * Cổng AI — máy trạng thái thuần quyết định trò chơi có mở hay không.
 *
 * ADR-0028 [BB]: **không có AI thì không chơi.** Đây là chỗ điều đó được cưỡng
 * chế, và nó là hàm thuần để test được mà không cần mạng, không cần trình duyệt,
 * không cần đồng hồ.
 *
 * ── Vì sao là máy trạng thái chứ không phải một biến boolean ──
 *
 * "Có AI" không phải một trạng thái, nó là bốn:
 *
 *   chua_cau_hinh   người chơi chưa điền gì — cần một cái form, không phải báo lỗi
 *   dang_do         đang thử đường — cần chờ, không được vừa chờ vừa cho gõ
 *   san_sang        đường thông, model đã trả lời thật — cửa mở
 *   dut_duong       từng thông rồi đứt — cần nút thử lại, và phải giữ lại thế giới
 *
 * Gộp bốn thứ này thành `if (!ai) return` cho ra đúng cái màn hình trắng mà không
 * ai biết phải làm gì tiếp.
 */
import type { AiConfig, ThieuSot } from './cauHinh.js';
export declare const TRANG_THAI_CONG: readonly ["chua_cau_hinh", "dang_do", "san_sang", "dut_duong"];
export type TrangThaiCong = (typeof TRANG_THAI_CONG)[number];
export declare const NHAN_TRANG_THAI_CONG: Readonly<Record<TrangThaiCong, string>>;
/**
 * Ngắt mạch — Phần 46, cổng Phase 8.
 *
 * Đếm **lần**, không đếm giây: `core/` không được đọc đồng hồ máy (luật bất biến
 * #7). Mạch mở rồi thì chỉ người chơi bấm "thử lại" mới đóng — không tự đóng theo
 * thời gian. Điều đó cố ý: một proxy hết hạn mức không tự lành sau ba mươi giây,
 * và tự thử lại ngầm chỉ đốt thêm tiền của người chơi.
 */
export type TrangThaiMach = {
    readonly hongLienTiep: number;
    readonly moMach: boolean;
    readonly maLoiCuoi: string;
    readonly thongDiepCuoi: string;
    /** Tổng số lượt gọi và số lượt hỏng — nuôi bảng Tự Chẩn Đoán (Phần 39). */
    readonly tongGoi: number;
    readonly tongHong: number;
};
export declare const MACH_MOI: TrangThaiMach;
/** Ba lần hỏng liên tiếp là hỏng thật, không phải xui. */
export declare const NGUONG_MO_MACH = 3;
export declare function machSauKhiThanhCong(m: TrangThaiMach): TrangThaiMach;
export declare function machSauKhiHong(m: TrangThaiMach, maLoi: string, thongDiep: string): TrangThaiMach;
export declare function dongMach(m: TrangThaiMach): TrangThaiMach;
/** Tỉ lệ hỏng — mục 27 của bảng Tự Chẩn Đoán (46.2). */
export declare function tyLeHong(m: TrangThaiMach): number;
export type HoSoCong = {
    readonly trangThai: TrangThaiCong;
    /**
     * [BB] Cửa duy nhất. Mọi hành động chơi — nhập câu, tick, trả lời cầu, đáp Dị
     * Hóa — phải hỏi trường này trước.
     */
    readonly choPhepChoi: boolean;
    /** Vì sao đóng. Rỗng khi mở. Câu tiếng Việt, dùng thẳng được trong UI. */
    readonly lyDo: readonly string[];
    /** Việc người chơi làm được ngay bây giờ để mở cổng. */
    readonly viecCanLam: readonly ThieuSot[];
};
export type DauVaoCong = {
    readonly cfg: AiConfig;
    /** Đang có một lượt thử đường chạy dở. */
    readonly dangDo: boolean;
    readonly mach: TrangThaiMach;
};
/**
 * Quyết định cổng. Hàm thuần, không đọc đồng hồ, không chạm mạng.
 *
 * Thứ tự kiểm quan trọng: **thiếu cấu hình** phải được báo trước **đứt đường**,
 * vì người chưa điền gì mà thấy "mất kết nối" sẽ đi kiểm tra wifi.
 */
export declare function danhGiaCong(v: DauVaoCong): HoSoCong;
