/**
 * Độ chính xác của entry — Phần 51.6, 53.1–53.4 [BB].
 *
 * ── Luật quan trọng nhất của cả Khối O ──
 *
 * [BB] 51.6: **văn bản không bao giờ tự chứng minh được chính nó.** Chỉ sự kiện
 * engine mới làm một khẳng định trở nên thật. Vì vậy `tinhDoTinCay()` dưới đây
 * nhận `Event[]` chứ không nhận văn bản, và không có tham số nào cho phép "số lần
 * được nhắc tới" đi vào công thức. Vòng tự khẳng định (kiểu E của 51.1) chết ở
 * chữ ký hàm, không phải ở kỷ luật người viết.
 *
 * ── Bốn bệnh, bốn liều ──
 *
 * | Bệnh                              | Chữa                                   |
 * |-----------------------------------|----------------------------------------|
 * | Quá dài, ôm nhiều chủ đề          | trần token + một entry một chủ đề      |
 * | Keyword sai hoặc quá chung        | rút từ thu hoạch danh từ, không tự nghĩ|
 * | Trùng chủ đề với entry đã có      | đối soát bắt buộc trước khi ghi        |
 * | Khẳng định không có gì chống lưng | bắt buộc `suKienChongLung`             |
 */
import type { Event } from '../contracts/core.js';
import type { LorebookEntry } from './schema.js';
/**
 * 53.4 — "Một entry chỉ thật đến mức các sự kiện chống lưng cho nó là thật."
 *
 * Ba yếu tố, đúng như đặc tả nêu: **số sự kiện**, **độ lớn**, và **có được nhiều
 * nguồn độc lập xác nhận không**. Không có sự kiện nào → 0, và 0 nghĩa là không nạp.
 */
export declare function tinhDoTinCay(entry: LorebookEntry, events: ReadonlyMap<string, Event>): number;
/** 53.4 — dưới ngưỡng thì entry LƯU nhưng KHÔNG nạp vào ngữ cảnh. */
export declare function duocNap(entry: LorebookEntry): boolean;
/** [MR] 53.2 — danh sách đen mặc định. */
export declare const DANH_SACH_DEN: ReadonlySet<string>;
export type UngVienKey = {
    readonly tu: string;
    readonly soLanXuatHien: number;
    /** Tỷ lệ cảnh có chứa từ này — trên 30% thì quá chung (53.2). */
    readonly tyLeCanh: number;
    readonly biChiem: boolean;
    readonly lyDoLoai: string;
};
/**
 * Rút ứng viên keyword từ VĂN BẢN THẬT đã kể — 53.2 [BB].
 *
 * "Keyword hay không phải keyword nghe hợp lý — mà là keyword thật sự xuất hiện
 * trong văn bản sẽ được quét." Nên hàm này không nhận mô tả entity hay tên canon:
 * nó nhận **những cảnh đã kể**, và đó là toàn bộ khác biệt giữa một lorebook bắn
 * đúng lúc và một lorebook không bao giờ bắn.
 */
export declare function thuHoachDanhTu(input: {
    readonly canhDaKe: readonly string[];
    /** Cụm từ ưu tiên: tên và alias của entity thuộc chủ đề. */
    readonly cumUuTien?: readonly string[];
    readonly daBiChiem?: ReadonlySet<string>;
    readonly danhSachDen?: ReadonlySet<string>;
}): UngVienKey[];
/** Ứng viên dùng được — đã loại đen, quá chung và từ bị chiếm. */
export declare function goiYKeys(ungVien: readonly UngVienKey[], toiDa?: number): UngVienKey[];
export type LoiEntry = {
    readonly ma: string;
    readonly thongDiep: string;
};
/**
 * 53.3 [BB] — vượt trần thì **tách**, không cắt cụt.
 *
 * Hàm này chỉ phán; việc tách là op `tach` ở 52.1. Cắt cụt một entry làm hỏng
 * nghĩa và làm AI hiểu sai — cùng lý do với template EJS ở 32.4.
 */
export declare function kiemEntry(entry: LorebookEntry, tuyChon?: {
    readonly tyLeToken?: number;
    readonly tranToken?: number;
    readonly soChuDeToiDa?: number;
}): LoiEntry[];
/** Brief sinh entry — 53.5. Không câu hỏi mở nào. */
export declare function briefSinhEntry(input: {
    readonly chuDe: readonly string[];
    readonly daCo: readonly {
        readonly id: string;
        readonly ten: string;
        readonly ghiChu: string;
    }[];
    readonly ungVien: readonly UngVienKey[];
    readonly suKien: readonly {
        readonly id: string;
        readonly moTa: string;
    }[];
    readonly lop: 'loi' | 'sau';
    readonly tranToken?: number;
}): string;
