/**
 * Client AI — chỗ duy nhất trong dự án gọi `fetch`.
 *
 * [BB] luật bất biến #3: `src/core` không được chạm mạng. Nên toàn bộ phần "nhấc
 * điện thoại lên" gói trong file này, và nó nhận vào **prompt đã biên soạn** chứ
 * không nhận `WorldState`. Nhờ vậy đường rò rỉ ba tầng không đi qua đây được:
 * file này không biết thế giới trông thế nào.
 *
 * Bơm `fetch` vào qua tham số để test chạy được mà không cần mạng thật, và để
 * chứng minh đường ống đúng trước khi tiêu một đồng nào — cổng Phase 8 gọi đó là
 * "mock pass trước network".
 */
import type { AiEndpoint } from '../core/ai/cauHinh.js';
import type { PromptGoi } from '../core/ai/bienSoan.js';
import type { ModelInfo } from '../core/ai/cauHinh.js';
export type KetQuaGoi = {
    readonly ok: true;
    readonly vanBan: string;
    readonly soKyTu: number;
    /**
     * Số token prompt THẬT mà model đếm được — [BB] 34.3.
     * `null` khi proxy không khai; lúc ấy tự hiệu chỉnh bỏ qua lượt này thay vì
     * chỉnh theo một con số đoán.
     */
    readonly promptTokens: number | null;
    /** `length` nghĩa là bị cắt cụt. Đã chuẩn hóa từ bốn phương ngữ. */
    readonly finishReason: string | null;
} | {
    readonly ok: false;
    readonly ma: string;
    readonly thongDiep: string;
};
export type TuyChonGoi = {
    /** Bơm vào để test; mặc định là `fetch` của môi trường. */
    readonly fetchImpl?: typeof fetch;
    /** Mili giây. Model treo lâu hơn ngần này thì coi như đứt. */
    readonly hanCho?: number;
    readonly signal?: AbortSignal;
};
/** Gọi Tường Thuật cho một lượt kể. */
export declare function goiKe(ep: AiEndpoint, prompt: PromptGoi, t?: TuyChonGoi): Promise<KetQuaGoi>;
/**
 * Gọi Cập Nhật Biến — điểm cuối riêng của 46.1.
 *
 * Nhận hai chuỗi thay vì `PromptGoi` vì Updater không có sáu tầng: nó không kể
 * chuyện, nên nó không có ngân sách tầng để chia (33.1 chỉ nói về prompt kể).
 */
export declare function goiCapNhat(ep: AiEndpoint, prompt: {
    heThong: string;
    nguoiDung: string;
}, t?: TuyChonGoi): Promise<KetQuaGoi>;
/**
 * Gọi một tác vụ Diễn Hóa — 50.2.
 *
 * Khác hai hàm trên ở chỗ nó nhận **một mảng message có vai trò**, không nhận
 * cặp hệ-thống/người-dùng. [BB] 50.2: *"`nhomPrompt` là MẢNG CÓ TÊN VÀ VAI TRÒ,
 * không phải một chuỗi lớn — người dùng cần bật tắt từng nhóm để gỡ lỗi."* Gộp
 * chúng lại thành hai chuỗi ở đây sẽ vứt đi đúng thứ làm workflow gỡ được.
 *
 * Bốn phương ngữ hiện chỉ nhận hai vai qua `dacTaGoi`, nên các nhóm cùng vai
 * được nối lại theo đúng thứ tự khai báo — và thứ tự ấy là thứ tự người dùng sắp
 * trong Xưởng Workflow, không phải thứ tự chữ cái.
 */
export declare function goiTacVuWorkflow(ep: AiEndpoint, messages: readonly {
    readonly role: 'system' | 'user' | 'assistant';
    readonly content: string;
}[], t?: TuyChonGoi): Promise<KetQuaGoi>;
export type KetQuaThuDuong = {
    readonly thong: boolean;
    readonly maLoi: string;
    readonly thongDiep: string;
    readonly modelDaTraLoi: string;
    readonly soKyTuTraVe: number;
    readonly xuatCoCauTruc: boolean;
};
/**
 * Thử đường — Phần 31.5.
 *
 * Không chỉ hỏi "có sống không": bắt model trả về đúng một từ. Một endpoint trả
 * 200 kèm trang đăng nhập cũng "sống", và người chơi sẽ tin là đã nối xong cho
 * tới khi vào game và thấy AI kể chuyện đăng nhập.
 */
export declare function thuDuong(ep: AiEndpoint, t?: TuyChonGoi): Promise<KetQuaThuDuong>;
export type KetQuaQuet = {
    readonly ok: true;
    readonly models: readonly ModelInfo[];
} | {
    readonly ok: false;
    readonly ma: string;
    readonly thongDiep: string;
};
/** Quét danh sách model mà proxy khai — nút "Quét danh sách" ở màn Cổng AI. */
export declare function quetModel(ep: AiEndpoint, t?: TuyChonGoi): Promise<KetQuaQuet>;
