/**
 * Parser `<choice>` — Trích xuất lựa chọn từ output AI.
 *
 * Preset SillyTavern dùng `<choice>1. Lựa chọn A\n2. Lựa chọn B</choice>` để
 * cung cấp danh sách hành động cho người chơi. File này parse block đó thành
 * cấu trúc mà UI có thể render thành buttons.
 *
 * Luật:
 * - Nhận cả `<choice>` và `<choices>`.
 * - Block xuất hiện bất kỳ đâu trong output (đầu, giữa, cuối).
 * - Dòng trong block có thể bắt đầu bằng `1.`, `2)`, `3、` hoặc không có số.
 * - Dòng trống bị bỏ qua.
 */
export type KetQuaChoice = {
    /** Lời kể đã xóa block `<choice>`. */
    readonly loiKe: string;
    /** Danh sách lựa chọn, rỗng nếu không có block nào. */
    readonly luaChon: readonly string[];
};
/**
 * Parse `<choice>` block từ output AI.
 *
 * Trả `loiKe` đã xóa block, và mảng `luaChon[]` chứa text mỗi lựa chọn.
 * Nếu không có block → trả nguyên văn bản, mảng rỗng.
 */
export declare function parseChoice(text: string): KetQuaChoice;
