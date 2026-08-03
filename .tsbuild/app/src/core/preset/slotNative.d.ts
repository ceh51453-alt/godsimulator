/**
 * Lắp nội dung NATIVE vào marker của preset — Phần 63.4 cột ba [BB].
 *
 * ── Vấn đề file này giải ──
 *
 * Một preset SillyTavern không chứa bối cảnh. Nó chứa **hình dạng** của bối cảnh:
 * `worldInfoBefore`, `charDescription`, `scenario`, `chatHistory`,
 * `personaDescription` là những ô trống, và SillyTavern đổ nội dung của nó vào.
 * Nhập một preset rồi để nguyên các ô ấy nghĩa là gửi cho model một bộ khung
 * rỗng — prompt trông đúng, và cảnh kể ra thì trống rỗng.
 *
 * [BB] 63.4 quy định đổ **nội dung native ĐÃ CHIẾU** vào từng marker. Đó là điều
 * duy nhất làm cho "preset dùng được hết trong app" có nghĩa gì đó thật: cấu
 * trúc của preset được giữ, còn sự thật thì vẫn do engine cấp.
 *
 * ── Điều tuyệt đối không được xảy ra ──
 *
 * Preset không có marker nào đó thì nội dung native của marker ấy **không được
 * biến mất**. `bienDichPromptPreset()` gom phần chưa ai nhận rồi gắn vào tầng 3,
 * nên bật một pack thiếu `chatHistory` sẽ mất bố cục, chứ không mất trí nhớ.
 *
 * [BB] 78.11 — `personaDescription` chỉ nhận `ProjectedPlayerPersona`. Không có
 * đường nào từ file này tới `PlayerProfile`, và đó là chuyện kiểu dữ liệu: hàm
 * dưới đây không nhận hồ sơ riêng làm tham số.
 */
import type { PromptGoi } from '../ai/bienSoan.js';
/**
 * Sáu tầng của 33.1 đã dựng, chia lại theo vai trò mà 63.6 cần.
 *
 * `loiCoreHeThong` là thứ KHÔNG preset nào thay được: lõi bất biến và chân lý
 * thế giới. `loiLuotNay` là tầng 5 của 63.6 — lượt hiện tại. Phần còn lại là
 * nguyên liệu cho các slot.
 */
export type LoiNative = Readonly<{
    loiCoreHeThong: string;
    loiLuotNay: string;
    /** Khóa viết thường, khớp `sourceIdentifier` của marker (63.4). */
    slot: Readonly<Record<string, string>>;
}>;
export type NguLieuSlot = Readonly<{
    /** Vài dòng cảnh gần nhất, cũ trước mới sau. */
    canhGanDay?: readonly {
        loai: string;
        noiDung: string;
    }[];
    /** [BB] 78.11 — persona ĐÃ CHIẾU, không bao giờ là hồ sơ riêng. */
    moTaPersona?: string;
    tenPersona?: string;
    /** Lịch sử đã được regex/adapter preset xử lý theo từng vai trò và depth. */
    lichSuDaDinhDang?: string;
}>;
/**
 * Chia prompt native thành lõi + slot.
 *
 * Ánh xạ dưới đây không tùy tiện: nó theo đúng ý nghĩa của từng marker trong
 * SillyTavern, chỉ khác ở chỗ nguồn là `WorldView` chứ không phải một character
 * card. `charPersonality` và `dialogueExamples` cố ý để trống — engine không có
 * "personality sheet" và không có ví dụ hội thoại duyệt sẵn, nên nội dung của
 * module gốc trong preset được giữ nguyên ở hai chỗ ấy (63.4: slot rỗng thì
 * dùng nội dung module).
 */
export declare function dungLoiNative(prompt: PromptGoi, ng?: NguLieuSlot): LoiNative;
