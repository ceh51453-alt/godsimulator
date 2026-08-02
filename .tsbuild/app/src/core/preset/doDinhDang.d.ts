/**
 * Bước 4 của pipeline nhập — dò định dạng BẰNG HÌNH DẠNG, không bằng tên file.
 * Nguồn: Phần 63.2, 62.1, 35.3.
 *
 * ── Vì sao không dò bằng tên hay bằng một khóa duy nhất ──
 *
 * Người ta đổi tên file. Người ta xuất preset từ một fork có thêm khóa lạ. Một
 * `if (ten.endsWith('.preset.json'))` sẽ đúng cho tới đúng lần đầu tiên nó sai,
 * và lúc ấy nó nhập nhầm loại — mà [BB] 62.1 nói năm loại preset KHÔNG được trộn.
 *
 * Nên phép dò ở đây đếm **dấu hiệu**, trả về điểm, và dưới ngưỡng thì trả
 * `unknown_json` kèm lý do cụ thể. Đoán bừa một loại tệ hơn nhiều so với nói
 * "không nhận ra, đây là những gì tôi thấy".
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { PresetFormat, PresetPart } from './schema.js';
export type KetQuaDo = {
    readonly format: PresetFormat;
    /** 0–1. Dưới `NGUONG_NHAN` thì `format` là `unknown_json`. */
    readonly diem: number;
    readonly dauHieu: readonly string[];
    readonly parts: readonly PresetPart[];
    readonly ghiChu: readonly ImportIssue[];
};
export declare const NGUONG_NHAN = 0.5;
/**
 * Dò định dạng của một cây JSON đã parse.
 *
 * [BB] Hàm này thuần: không đọc file, không gọi mạng, không nhớ gì giữa hai lần
 * gọi. Cùng cây JSON luôn cho cùng kết quả.
 */
export declare function doDinhDang(goc: unknown, tenNguon?: string): KetQuaDo;
