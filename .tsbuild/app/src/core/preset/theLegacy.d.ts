/**
 * Thẻ output legacy — Phần 63.8.
 *
 * ── Một câu duy nhất cần nhớ ──
 *
 * [BB] "Không có tag nào tự tạo Event hay Patch." Mọi thứ file này trả về là
 * **ứng viên trình bày**. Kiểu trả về được đặt tên `UngVien…` để chỗ gọi không
 * thể nhầm nó với một quyết định của engine.
 *
 * ── Vì sao native dùng namespace `td:` ──
 *
 * Preset ngoài đầy regex bắt `<content>`, `<time>`, `<recap>`. Nếu thẻ native của
 * game cũng tên như vậy thì một transform legacy sẽ ăn vào output của chính
 * engine. Nên thẻ native là `<td:CapNhat>`, `<td:Foreshadow>`… và bộ parser dưới
 * đây **bỏ qua** mọi thẻ có tiền tố `td:`.
 */
export declare const THE_LEGACY: readonly ["content", "choice", "choices", "time", "recap", "theater", "parallel_world", "thinking"];
export type TheLegacy = (typeof THE_LEGACY)[number];
export type UngVienOutput = {
    /** Văn kể sau khi đã gỡ mọi thẻ legacy. Đây là thứ duy nhất được hiển thị mặc định. */
    readonly vanKe: string;
    /** Gợi ý hành động. [BB] KHÔNG tự chọn, KHÔNG khóa ô nhập tự do. */
    readonly goiYHanhDong: readonly string[];
    /** Đề xuất thời gian. [BB] Phải qua IntentResolver và đồng hồ engine mới có hiệu lực. */
    readonly deXuatThoiGian: readonly string[];
    /** Ứng viên cho tác vụ nén. [BB] KHÔNG ghi đè ký ức. */
    readonly ungVienRecap: readonly string[];
    /** Flavor text tùy chọn. */
    readonly theater: readonly string[];
    /** Ứng viên mạch song song. [BB] KHÔNG tự tạo branch. */
    readonly ungVienMachSongSong: readonly string[];
    /**
     * [BB] Chuỗi suy luận: ĐÃ BỊ BỎ. Trường này chỉ đếm, không giữ nội dung —
     * "bỏ khỏi output hiển thị và không lưu" nghĩa là nó không tồn tại ở đây.
     */
    readonly soKhoiSuyLuanDaBo: number;
    /** Comment `scene type`, `prose`… — metadata không đáng tin, không tự bật/tắt gì. */
    readonly metadataKhongTin: readonly string[];
};
/**
 * Bóc thẻ legacy khỏi một output thô.
 *
 * `raw` KHÔNG bị sửa: người gọi giữ bản gốc trước khi gọi hàm này (63.8 — "parser
 * legacy chạy sau khi giữ bản text gốc và trước renderer").
 */
export declare function bocTheLegacy(raw: string): UngVienOutput;
