/**
 * Biên soạn prompt — Phần 33.1 (sáu tầng), 29.2 (bảy quy tắc Narrator) [BB].
 *
 * ── Một ràng buộc quyết định toàn bộ file này ──
 *
 * [BB] 33.3: **Assembler nhận `WorldView`, không nhận `World`.** Hàm ở đây không
 * có tham số `WorldState`, không import `state.js`, và không có cách nào chạm tới
 * thế giới thô. Chống rò rỉ ba tầng ở đây là chuyện KIỂU DỮ LIỆU, không phải
 * chuyện cẩn thận: `chieu()` đã xóa trường bị che khỏi đối tượng, nên thứ không
 * được thấy đơn giản là không tồn tại trong thứ file này đọc được.
 *
 * ── Thứ tự sáu tầng ──
 *
 * Ổn định lên đầu để ăn prefix cache, biến động xuống cuối. Sổ Nhân Quả và lời
 * cầu đang treo nằm CUỐI CÙNG — chú ý của model ở giữa prompt suy giảm rõ rệt,
 * nên thứ đang treo phải nằm chỗ nhìn rõ nhất.
 */
import type { WorldView, ProjectedStoryline } from '../contracts/view.js';
import type { BanTin } from '../world/banTin.js';
import type { Prayer } from '../schema/than.js';
import type { VetCat } from './nganSach.js';
/** Bảy quy tắc của 29.2 — [BB] tầng lõi bất biến, người dùng KHÔNG xóa được. */
export declare const BAY_QUY_TAC_NARRATOR: readonly string[];
/**
 * [BB] 71.5 — LLM không giữ sổ.
 *
 * Đây là luật khó giữ nhất khi AI trở thành bắt buộc, vì một model đang viết văn
 * rất muốn nói "ba trăm người chết". Nên nó được viết thành mệnh lệnh riêng, đứng
 * ngay sau bảy quy tắc, và `bocTach()` từ chối mọi patch không thuộc bảng trắng.
 */
export declare const LUAT_KHONG_GIU_SO: readonly string[];
export type TangPrompt = {
    readonly so: number;
    readonly ten: string;
    readonly onDinh: boolean;
    readonly noiDung: string;
};
export type PromptGoi = {
    /** Tầng 1–3: ổn định, ăn được prefix cache. */
    readonly heThong: string;
    /** Tầng 4–6: đổi mỗi lượt. */
    readonly nguoiDung: string;
    readonly tang: readonly TangPrompt[];
    readonly soKyTu: number;
    /** Ước lượng token theo `tyLeToken` của profile — 34.2. */
    readonly uocToken: number;
    /**
     * [BB] Cổng Phase 8 — "token budget có trace block bị cắt."
     * Rỗng nghĩa là không tầng nào vượt trần, không phải "chưa đo".
     */
    readonly vetCat: readonly VetCat[];
    /** Chunk truy hồi đã bị bộ đóng gói bỏ lại — nối tiếp trace của 77.7. */
    readonly chunkBiCat: readonly {
        chunkId: string;
        vi: string;
        uocToken: number;
    }[];
    /**
     * Mồi câu trả lời — tầng 6 của 63.6, chỉ có khi một preset đang bật.
     *
     * Prompt native KHÔNG bao giờ đặt trường này: engine không cần mồi model, và
     * mồi sẵn một câu mở đầu là cách nhanh nhất để mọi cảnh bắt đầu giống nhau.
     */
    readonly moiTraLoi?: string;
};
export type NguLieuKe = {
    readonly view: WorldView;
    readonly banTin: BanTin | null;
    /** Lời cầu đang treo — [BB] 33.1 bắt chúng nằm cuối prompt. */
    readonly loiCau: readonly Prayer[];
    /** Vài dòng cảnh gần nhất, cũ trước mới sau. */
    readonly canhGanDay: readonly {
        loai: string;
        noiDung: string;
    }[];
    /**
     * Tóm tắt diễn biến phiên chơi gần đây — dựng từ scene history dài hơn
     * `canhGanDay`. Khi không có mạch truyện đang chiếu, đây là nguồn duy nhất
     * giúp model nối mạch tự sự giữa các lượt.
     */
    readonly tomTatPhien?: string;
    /** Câu người chơi vừa gõ; rỗng khi đây là lượt thời gian trôi. */
    readonly cauNguoiChoi: string;
    /**
     * Điều engine ĐÃ quyết cho lượt này. Narrator kể lại nó, không phán lại nó.
     * Rỗng nghĩa là chưa có gì xảy ra ngoài thời gian.
     */
    readonly ketQuaEngine: readonly string[];
    /** Tên hiển thị của người chơi — persona đã chiếu, không phải hồ sơ riêng. */
    readonly tenNguoiChoi: string;
    readonly tyLeToken: number;
    /** Mạch đang chiếu. `null` = ống kính ở chỗ người chơi hoặc chưa có mạch nào. */
    readonly machDangChieu?: ProjectedStoryline | null;
    /**
     * [BB] 29.2 quy tắc 5 — ống kính không ở chỗ người chơi thì KHÔNG nhắc tới họ,
     * kể cả gián tiếp. Mặc định `true` để lời gọi cũ giữ nguyên hành vi.
     */
    readonly ongKinhOChoNguoiChoi?: boolean;
    /**
     * Phục bút chưa trả. [BB] 33.1 bắt chúng nằm CUỐI prompt cùng Sổ Nhân Quả —
     * chú ý của model ở giữa prompt suy giảm rõ rệt.
     */
    readonly phucButChuaTra?: readonly {
        noiDung: string;
        quaHan: boolean;
    }[];
    /** Chunk đã qua visibility → RRF → rerank → MMR → token budget (54.9). */
    readonly chunkTruyHoi?: readonly {
        nguon: string;
        text: string;
        daBopMeo: boolean;
    }[];
    readonly chunkBiCat?: readonly {
        chunkId: string;
        vi: string;
        uocToken: number;
    }[];
    /** Ngân sách token cho cả prompt. Bỏ trống thì không cắt theo trần.  */
    readonly nganSachToken?: number;
};
/**
 * Dựng prompt cho một lượt kể.
 *
 * [BB] Tham số là `WorldView` — không có đường nào từ đây tới `World` thô.
 */
export declare function bienSoanPromptKe(ng: NguLieuKe): PromptGoi;
/**
 * Prompt thử đường — cố tình rẻ và cố tình có một yêu cầu cấu trúc nhỏ.
 *
 * Nếu chỉ hỏi "chào", một endpoint trả về HTML lỗi 200 cũng đếm là thông. Bắt nó
 * trả về đúng một từ cho ta biết cả ba thứ: đường đi, model tồn tại, và model có
 * nghe lệnh không.
 */
export declare const PROMPT_THU_DUONG: Readonly<{
    heThong: "Bạn đang được kiểm tra kết nối. Trả lời đúng một từ, không dấu câu, không giải thích.";
    nguoiDung: "Trả lời đúng chữ: THONG";
    tuKhoa: "THONG";
}>;
export declare function thuDuongDatKhong(traVe: string): boolean;
