/**
 * Bốn phương ngữ API — Phần 31.1, 62.4.
 *
 * ── Vì sao là bảng dữ liệu chứ không phải bốn hàm rải rác ──
 *
 * [BB] 31.2: "Không hardcode tham số của bất kỳ model nào trong code." Khác biệt
 * giữa bốn nhà cung cấp gói gọn trong bốn thứ: **đường dẫn**, **header xác thực**,
 * **hình dạng body** và **chỗ chứa câu trả lời**. Viết chúng thành một bảng thì
 * thêm nhà thứ năm là thêm một dòng, không phải sửa bốn nhánh `if`.
 *
 * [BB] 62.4 — giữ raw, chỉ gửi phần model hỗ trợ: hàm dựng body dưới đây bỏ qua
 * mọi tham số phương ngữ ấy không hiểu, thay vì gửi đi rồi nhận 400.
 */
import type { Dialect, GenParams } from '../core/schema/ai.js';
export type YeuCauGoi = {
    readonly heThong: string;
    readonly nguoiDung: string;
    readonly modelId: string;
    readonly params: GenParams;
    /**
     * Mồi câu trả lời — tầng 6 của 63.6.
     *
     * Preset SillyTavern gọi nó là assistant prefill và dùng nó để ép định dạng
     * đầu ra. Nó chỉ được gửi khi profile khai model nhận prefill; model không
     * nhận thì `bienDichPromptPreset()` đã bỏ module ấy kèm issue, và trường này
     * tới đây rỗng. Rỗng thì không có message nào được thêm — không gửi một lượt
     * assistant trống, vì vài proxy coi đó là lỗi.
     */
    readonly moiTraLoi?: string;
};
export type DacTaGoi = {
    readonly url: string;
    readonly header: Readonly<Record<string, string>>;
    readonly body: unknown;
};
/**
 * Ghép đường dẫn mà không nhân đôi đoạn đã có.
 *
 * Người chơi dán proxy theo đủ kiểu: `https://x.y`, `https://x.y/v1`,
 * `https://x.y/v1/chat/completions`. Cả ba đều là ý muốn hợp lệ, và bắt họ nhớ
 * đúng hậu tố là bắt họ đọc tài liệu của ta thay vì chơi.
 */
export declare function ghepDuong(goc: string, duoi: string): string;
/** Dựng đúng một lời gọi cho phương ngữ đang chọn. */
export declare function dacTaGoi(dialect: Dialect, proxyUrl: string, matKhau: string, yc: YeuCauGoi): DacTaGoi;
/** Rút văn bản ra khỏi phản hồi. Trả rỗng nghĩa là model im lặng — tức là hỏng. */
export declare function rutVanBan(dialect: Dialect, json: unknown): string;
/** Đường liệt kê model — dùng cho nút "Quét danh sách". */
export declare function dacTaQuetModel(dialect: Dialect, proxyUrl: string, matKhau: string): {
    url: string;
    header: Record<string, string>;
};
/** Chuẩn hóa danh sách model của bốn phương ngữ về một hình dạng. */
export declare function rutDanhSachModel(dialect: Dialect, json: unknown): {
    id: string;
    ten: string;
    nhomNhaCungCap: string;
    contextMax: number | null;
}[];
/**
 * Số token thật và lý do dừng — [BB] 34.3.
 *
 * Bốn phương ngữ khai ba kiểu khác nhau, và sai lệch giữa chúng không nhỏ:
 * OpenAI nói `usage.prompt_tokens`, Anthropic nói `usage.input_tokens`, Gemini
 * nói `usageMetadata.promptTokenCount`. Đọc nhầm một cái là tự hiệu chỉnh chỉnh
 * theo một con số không tồn tại, và `tyLeToken` trôi đi mà không ai biết.
 *
 * `finishReason === 'length'` là tín hiệu quan trọng nhất trong hàm này: nó nghĩa
 * là prompt vừa bị cắt cụt, và 33.1 đặt Sổ Nhân Quả với Sổ Phục Bút ở CUỐI —
 * tức đúng chỗ bị cắt đầu tiên.
 */
export declare function rutSoDung(dialect: Dialect, json: unknown): {
    promptTokens: number | null;
    finishReason: string | null;
};
