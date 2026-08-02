/**
 * Điểm cuối Cập Nhật Biến — Phần 46.1, 46.2 [BB]; món nợ Phase 6b ghi lại.
 *
 * ── Vì sao tách khỏi Narrator ──
 *
 * Phase 6b để Narrator gánh cả hai vai qua khối `<CapNhat>` — tức chế độ
 * `gop_vao_narrator` của 46.2. Nó chạy được, nhưng nó trộn hai việc có yêu cầu
 * ngược nhau: viết văn cần nhiệt độ cao và tự do; rút trạng thái cần nhiệt độ 0
 * và kỷ luật. Một model bị ép làm cả hai sẽ làm tốt một việc và làm hỏng việc kia
 * — và việc bị hỏng thường là việc thứ hai, vì nó nằm cuối output.
 *
 * Tách ra cho phép:
 *   - dùng model rẻ hơn, nhanh hơn cho Updater;
 *   - đặt nhiệt độ 0 cho Updater mà không làm văn Narrator khô đi;
 *   - Updater chết KHÔNG làm mất lời kể (nó chỉ làm mất phần cập nhật).
 *
 * [BB] 71.5 — LLM KHÔNG GIỮ SỔ, và điều đó không nới ra chút nào khi Updater có
 * điểm cuối riêng. Output của nó vẫn đi qua `bocTach()`, vẫn bị bảng trắng bốn
 * bảng và chín đường dẫn cấm chặn. Có điểm cuối riêng không có nghĩa là có
 * thẩm quyền riêng.
 */
import type { WorldView } from '../contracts/view.js';
export type NguLieuCapNhat = {
    readonly view: WorldView;
    /** Văn Narrator vừa viết — thứ Updater phải rút trạng thái từ đó. */
    readonly loiKe: string;
    /** Điều engine ĐÃ quyết ở lượt này. Updater không được mâu thuẫn với nó. */
    readonly ketQuaEngine: readonly string[];
    /** Id entity đang tồn tại — model chỉ được nhắc tới những id này. */
    readonly idHopLe: readonly string[];
    readonly tyLeToken: number;
};
/**
 * Prompt Updater.
 *
 * Cố ý KHÔNG có bảy quy tắc Narrator, không có mạch truyện, không có Sổ Phục
 * Bút — Updater không kể chuyện nên nó không cần chúng, và mỗi khối thừa là
 * token trả tiền cho một việc không xảy ra.
 *
 * Cái nó cần và chỉ cần: văn vừa viết, sự thật engine, và danh sách id hợp lệ.
 */
export declare function bienSoanPromptCapNhat(ng: NguLieuCapNhat): {
    heThong: string;
    nguoiDung: string;
};
/**
 * Updater có được gọi riêng không.
 *
 * `batRieng = false` → khối `<CapNhat>` đi kèm lời kể của Narrator (hành vi Phase
 * 6b). [BB] ADR-0056 — không còn chế độ "chỉ engine": tắt điểm cuối này chỉ đổi
 * AI nào viết khối cập nhật, không bao giờ đổi thành "không cần AI".
 */
export declare function updaterChayRieng(cfg: {
    batRieng: boolean;
    proxyUrl: string;
    modelId: string;
}): boolean;
