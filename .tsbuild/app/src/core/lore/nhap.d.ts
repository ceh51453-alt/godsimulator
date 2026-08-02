/**
 * Nhập lorebook — Phần 35.3 [BB], dải order 51.5 [BB].
 *
 * ── Ba định dạng, TỰ DÒ ──
 *
 * | Định dạng      | Nhận biết                            |
 * |----------------|--------------------------------------|
 * | SillyTavern V2 | `{ entries: { "0": {...} } }`        |
 * | SillyTavern V3 | `spec: 'lorebook_v3'` hoặc mảng      |
 * | Thiên Diễn     | `_format: 'thien_dien_lore'`         |
 *
 * ── Vì sao `<user>` là LỖI chứ không phải cảnh báo ──
 *
 * 35.3 nói: "Macro `{{user}}`; phát hiện `<user>` → **báo lỗi**, đề xuất sửa hàng
 * loạt." Lý do: `<user>` là cú pháp của một hệ khác. Trong Thiên Diễn nó không
 * phải macro — nó là bốn ký tự văn bản mà model sẽ đọc nguyên xi và kể ra. Người
 * dùng sẽ thấy chữ "<user>" trong lời kể và không hiểu vì sao. Một cảnh báo im
 * lặng ở đây tạo ra đúng loại lỗi không ai truy được.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { Lorebook, LorebookEntry, NguonLorebook } from './schema.js';
export declare const DINH_DANG_LORE: readonly ["sillytavern_v2", "sillytavern_v3", "thien_dien_lore", "khong_ro"];
export type DinhDangLore = (typeof DINH_DANG_LORE)[number];
/** Dò định dạng bằng hình dạng — cùng nguyên tắc với 63.2. */
export declare function doDinhDangLore(goc: unknown): DinhDangLore;
export type KetQuaNhapLore = {
    readonly ok: boolean;
    readonly dinhDang: DinhDangLore;
    readonly lorebook: Lorebook | null;
    readonly issues: readonly ImportIssue[];
    /** `order` gốc trùng hoặc không liên tục — UI hỏi có tự đánh số lại không. */
    readonly canDanhSoLai: boolean;
    /** Cặp entry nghi trùng chủ đề — cảnh báo, KHÔNG chặn. */
    readonly nghiTrungChuDe: readonly (readonly [string, string])[];
};
/**
 * Nhập một lorebook từ JSON đã parse.
 *
 * Không throw, không đọc file, không gọi mạng. `nguon` do người gọi khai: một
 * file người dùng kéo vào luôn là `nguoi_dung` — [BB] 50.10 cấm workflow ghi vào
 * lorebook người dùng, và phân biệt ấy bắt đầu từ đây.
 */
export declare function nhapLorebook(input: {
    readonly goc: unknown;
    readonly id: string;
    readonly ten: string;
    readonly nguon: NguonLorebook;
    readonly branchId?: string;
    readonly tyLeToken?: number;
}): KetQuaNhapLore;
export declare function giaoKeys(a: LorebookEntry, b: LorebookEntry): string[];
/**
 * Kiểm cú pháp EJS ở mức cân bằng thẻ — 35.3 "EJS parse được → lỗi thì chỉ rõ
 * entry và dòng".
 *
 * Không biên dịch template ở đây: biên dịch nghĩa là chạy, và nội dung lorebook
 * là dữ liệu không tin cậy. Kiểm cân bằng bắt được đúng lỗi thường gặp (quên
 * `%>`), và phần còn lại do renderer EJS thật báo khi render trong sandbox.
 */
export declare function kiemEjs(s: string): {
    dong: number;
    thongDiep: string;
} | null;
