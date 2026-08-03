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
const CHOICE_RE = /<choices?>([\s\S]*?)<\/choices?>/i;
const DONG_CO_SO = /^\d+[.)、]\s*(.*)/;
/**
 * Parse `<choice>` block từ output AI.
 *
 * Trả `loiKe` đã xóa block, và mảng `luaChon[]` chứa text mỗi lựa chọn.
 * Nếu không có block → trả nguyên văn bản, mảng rỗng.
 */
export function parseChoice(text) {
    const m = CHOICE_RE.exec(text);
    if (!m)
        return { loiKe: text, luaChon: Object.freeze([]) };
    // Xóa block khỏi lời kể
    const loiKe = text.replace(CHOICE_RE, '').trim();
    // Parse các dòng trong block
    const noiDung = m[1] ?? '';
    const dong = noiDung.split(/\r?\n|\s*\|\s*/);
    const luaChon = [];
    for (const d of dong) {
        const s = d.trim();
        if (s === '')
            continue;
        const soMatch = DONG_CO_SO.exec(s);
        const text2 = soMatch ? (soMatch[1] ?? '').trim() : s;
        if (text2 !== '')
            luaChon.push(text2);
    }
    return { loiKe, luaChon: Object.freeze(luaChon) };
}
