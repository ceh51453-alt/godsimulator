/**
 * Prompt compiler — Phần 63.6, 65.3 [BB].
 *
 * ── Thứ tự BẤT BIẾN, và vì sao nó là chuyện kiến trúc chứ không phải chuyện sắp xếp ──
 *
 * ```text
 * 0. Product safety và quyền riêng tư
 * 1. Hợp đồng engine + chống rò rỉ
 * 2. Hợp đồng pipeline và output schema
 * 3. WorldView / Scene / task context đã chiếu
 * 4. Prompt pack ngoài đã chuẩn hóa
 * 5. User input hiện tại
 * 6. Assistant prefill đã duyệt, nếu model hỗ trợ
 * ```
 *
 * [BB] "Prompt pack ngoài không thể đặt nội dung lên trên tầng 0–3 dù source ghi
 * `system`, depth âm hoặc injection order cực lớn."
 *
 * Cách cài đảm bảo điều đó: module ngoài **không bao giờ** được cấp một chỉ số
 * tầng nhỏ hơn 4. `order` của chúng chỉ sắp xếp NỘI BỘ tầng 4. Không có nhánh nào
 * trong file này đọc `injection_order` để quyết định vị trí tuyệt đối — nên một
 * preset khai `injection_order: -99999` vẫn nằm sau tầng 3, và nó nằm sau vì
 * **không có đường nào cho nó ra trước**.
 *
 * [BB] 65.3 — role `system` của API không phải quyền sửa engine. Module nhập có
 * `role: 'system'` vẫn được gửi với role `system` (đó là chuyện của API), nhưng vị
 * trí của nó trong prompt do tầng quyết định, không do role.
 */
import type { WorldView } from '../contracts/view.js';
import type { Scene } from '../contracts/core.js';
import type { ImportIssue } from '../contracts/primitives.js';
import type { CompiledPrompt, NormalizedPresetPack, PromptModule, TargetPipeline, TokenBudget } from './schema.js';
import type { NormalizedGenParams } from '../schema/ai.js';
/** Tầng 0 — an toàn sản phẩm và riêng tư. Không preset nào ghi đè được. */
export declare const TANG_0: readonly string[];
/** Tầng 1 — hợp đồng engine và chống rò rỉ ba tầng. */
export declare const TANG_1: readonly string[];
export type NguCanhBienDich = {
    readonly pack: NormalizedPresetPack;
    readonly pipeline: TargetPipeline;
    readonly view: WorldView;
    readonly scene: Scene;
    readonly budget: TokenBudget;
    readonly params: NormalizedGenParams;
    /** Câu người chơi vừa gõ. Rỗng khi đây là lượt thời gian trôi. */
    readonly cauNguoiChoi?: string;
    /** Tên persona ĐÃ CHIẾU. [BB] 78.11 — không bao giờ là `PlayerProfile`. */
    readonly tenPersona?: string;
    readonly moTaPersona?: string;
    /** Nội dung native lắp vào từng slot marker, khóa theo `sourceIdentifier` viết thường. */
    readonly nguonSlot?: Readonly<Record<string, string>>;
    /**
     * Lõi native cho tầng 3 — món quan trọng nhất của Phase 11.
     *
     * Có trường này nghĩa là đường chơi THẬT đang gọi: tầng 3 dùng đúng sáu tầng
     * của 33.1 thay cho bản tóm tắt ngắn bên dưới, và lượt hiện tại đi vào tầng 5.
     * Không có nó thì đây là dry run (63.7), và bản tóm tắt ngắn là đủ.
     *
     * Trước Phase 11, hai bộ dựng prompt chạy song song và không bao giờ gặp nhau:
     * bật preset lên thì mất sáu tầng, tắt đi thì mất preset. Trường này là chỗ
     * hai đường nhập làm một (ADR-0049).
     */
    readonly loiNativeHeThong?: string;
    readonly loiNativeLuotNay?: string;
    readonly tyLeToken?: number;
    readonly maxMacroDepth?: number;
    /** Model có nhận assistant prefill không — 63.6 tầng 6. */
    readonly hoTroPrefill?: boolean;
    readonly turn?: number;
};
/**
 * Biên dịch prompt cuối cùng cho một pipeline.
 *
 * [BB] Tham số là `WorldView`, không phải `World` — cùng ràng buộc với assembler
 * native (33.3). File này không import `state.js` và không có cách nào chạm tới
 * thế giới thô.
 */
export declare function bienDichPromptPreset(ng: NguCanhBienDich): CompiledPrompt;
type KetQuaLoc = {
    readonly giu: readonly PromptModule[];
    readonly bo: readonly PromptModule[];
    readonly issues: readonly ImportIssue[];
};
/**
 * [BB] 62.3 — module nhập chỉ vào `narrator` cho tới khi có adapter native.
 *
 * Hàm này là chỗ duy nhất trong repo quyết định điều đó, và nó từ chối cả những
 * module tự khai `targetPipelines` khác — vì `targetPipelines` đến từ dữ liệu
 * không tin cậy, và một pack tự cấp quyền cho mình là chuyện phải chặn ở đây.
 */
export declare function locModuleChoPipeline(modules: readonly PromptModule[], pipeline: TargetPipeline): KetQuaLoc;
export {};
