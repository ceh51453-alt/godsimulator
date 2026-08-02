/**
 * Canonical state hash — cổng Phase 1 [BB].
 *
 * "Cùng seed + state đầu + accepted event log phải cho cùng state hash."
 *
 * Yêu cầu:
 *   - độc lập thứ tự khóa của object;
 *   - độc lập thứ tự bảng;
 *   - phân biệt được `undefined` với khóa vắng mặt;
 *   - không dùng `JSON.stringify` trần (thứ tự khóa phụ thuộc thứ tự chèn);
 *   - không dùng locale, không dùng thời gian máy;
 *   - chạy được trong Node và trình duyệt, đồng bộ, không cần WebCrypto.
 */
/**
 * Băm một chuỗi thành 16 ký tự hex.
 * Hai FNV-1a độc lập với hai hạt giống khác nhau, ghép lại — xác suất trùng
 * đủ thấp để phát hiện lệch replay, và toàn bộ phép tính là số nguyên 32-bit.
 */
export declare function bam(s: string): string;
/**
 * Tuần tự hóa chính tắc: khóa object luôn sắp xếp theo codepoint, kiểu được
 * gắn thẻ để `1` và `'1'` không băm ra cùng chuỗi.
 */
export declare function chuanHoa(v: unknown): string;
/** Hash chính tắc của một giá trị bất kỳ. */
export declare function hashCua(v: unknown): string;
/**
 * Hash của một tập bản ghi, ĐỘC LẬP thứ tự duyệt.
 * Băm từng bản ghi rồi sắp xếp hash — nên thứ tự lặp của Map/mảng không ảnh hưởng.
 */
export declare function hashTap(banGhi: Iterable<unknown>): string;
/** Gộp nhiều hash con thành một hash tổng, có gắn nhãn để không lẫn bảng. */
export declare function hashGop(phan: Readonly<Record<string, string>>): string;
