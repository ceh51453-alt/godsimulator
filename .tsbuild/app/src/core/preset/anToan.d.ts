/**
 * Bước 8 của pipeline nhập — quét an toàn. Phần 64.4, 64.5.
 *
 * ── Hai câu quyết định file này ──
 *
 * [BB] 64.5: **classifier chỉ gắn nhãn, không tự xóa.** Một importer tự xóa thứ
 * nó không thích là một importer làm mất dữ liệu của người dùng mà không hỏi.
 * Nên mọi hàm ở đây trả về *nhãn* và *lý do*; quyết định bật/tắt nằm ở bảng quy
 * tắc kích hoạt bên dưới, và quyết định cuối cùng nằm ở người dùng.
 *
 * [BB] 64.4: khóa `__proto__`, `prototype`, `constructor` ở object nhập → **từ
 * chối node đó**. Không phải "làm sạch rồi nhận" — từ chối, và nói đã từ chối cái gì.
 */
import type { ImportIssue } from '../contracts/primitives.js';
export declare const NHAN_RUI_RO: readonly ["jailbreak_like", "reasoning_request", "tool_request", "state_write_claim", "visibility_override", "output_contract_conflict", "sensitive_content"];
export type NhanRuiRo = (typeof NHAN_RUI_RO)[number];
/**
 * Quy tắc kích hoạt theo nhãn — 64.5.
 *
 * Ba nhãn đầu là **vượt quyền**: một prompt ngoài đòi ghi state, đòi gọi tool,
 * hay đòi đổi tầm nhìn thì nó đang đòi thứ mà kể cả role `system` của API cũng
 * không cho (65.3). Cách ly, không thương lượng.
 */
export declare const XU_LY_THEO_NHAN: Readonly<Record<NhanRuiRo, 'quarantine' | 'disable' | 'nhan_thoi'>>;
export type NhanDaGan = {
    readonly nhan: NhanRuiRo;
    readonly lyDo: string;
};
/**
 * Gắn nhãn một khối văn bản. Trả về nhãn duy nhất theo thứ tự xuất hiện.
 *
 * Không dùng cho quyết định cuối cùng: đây là gợi ý cho người duyệt, và 65.1 nói
 * rõ "tên chứa … chỉ là gợi ý classifier. Kết quả phải hiện cho người dùng duyệt".
 */
export declare function phanLoaiNoiDung(text: string): NhanDaGan[];
export type VetSecret = {
    readonly loai: string;
    readonly path: string;
};
/** Che một chuỗi có secret. Giữ 4 ký tự đầu để người dùng còn nhận ra nó là cái gì. */
export declare function cheSecret(s: string): string;
export type VetUrl = {
    readonly url: string;
    readonly host: string;
    readonly path: string;
};
export type KetQuaQuet = {
    readonly issues: readonly ImportIssue[];
    readonly secrets: readonly VetSecret[];
    readonly urls: readonly VetUrl[];
    /** Host duy nhất, đã sắp — dùng cho màn "An toàn" của wizard. */
    readonly hosts: readonly string[];
    /** Đường dẫn các node bị từ chối vì khóa nguy hiểm. */
    readonly nodeBiTuChoi: readonly string[];
};
/**
 * Quét toàn cây JSON nguồn.
 *
 * [BB] Hàm này KHÔNG chạy regex nguồn, KHÔNG chạy script, KHÔNG tải URL. Nó chỉ
 * đọc chuỗi. Đó là toàn bộ những gì bước 8 được phép làm (63.1).
 */
export declare function quetAnToan(goc: unknown): KetQuaQuet;
/**
 * Bản sao đã bỏ mọi node có khóa nguy hiểm — dùng cho MỌI bước sau bước 8.
 *
 * Cây gốc không bị sửa; blob raw vẫn giữ nguyên bytes (62.2). Đây là hai bản
 * khác nhau có chủ đích: một bản để round-trip, một bản để chạy.
 */
export declare function locKhoaNguyHiem<T>(goc: T): T;
