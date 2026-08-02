/**
 * Bộ đánh giá dựng TỪ CHÍNH THẾ GIỚI — Phần 77.10.
 *
 * ── Vấn đề của một gold set viết tay ──
 *
 * 77.10 đòi `relevantChunkIds` và `forbiddenChunkIds`, tức đòi nhãn. Nhãn viết
 * tay thì mục nào cũng đúng cho đúng một thế giới, và mọi ván chơi khác đều
 * không đo được. Fixture `src/test/fixtures/retrievalEval.ts` là gold set như
 * thế: nó tốt cho test, vô dụng khi người chơi bấm "Chạy bộ đánh giá".
 *
 * ── Cách ra khỏi vấn đề ──
 *
 * Thế giới đã tự khai nhãn rồi, chỉ là ở chỗ khác. [BB] 18.2 nói ba điều tuyệt
 * đối, và cả ba đều dịch thẳng thành một cặp (đúng, cấm):
 *
 *   văn bản luật gốc     cấm với phàm nhân · diễn giải của vùng họ thì đúng
 *   bản tính thật của thần cấm với phàm nhân · `banTinhTinDoTin` thì đúng
 *   kẽ hở chưa ai khai thác cấm với mọi tầng dưới Sáng Thế
 *
 * Nên bộ đánh giá không cần ai gán nhãn: nó đọc luật chống rò rỉ và biến mỗi
 * luật thành một bài thi. Thế giới nào cũng đo được, kể cả thế giới người chơi
 * vừa tạo ra năm phút trước.
 */
import type { WorldState } from '../engine/state.js';
import type { RetrievalEvalCase, RerankConfig } from '../schema/rerank.js';
import type { Tuning } from '../tuning/schema.js';
import type { ViewMode } from '../contracts/primitives.js';
import type { AdapterSemantic } from './rerank.js';
import type { TongKetEval, CongEval } from './danhGia.js';
/** Một bài thi kèm chủ thể sẽ chạy nó. */
export type BaiThi = {
    readonly ca: RetrievalEvalCase;
    readonly mode: ViewMode;
    readonly chuTheId: string | null;
};
/**
 * Dựng bộ đề từ thế giới.
 *
 * Trả rỗng khi thế giới chưa có luật nào có diễn giải và chưa có thần nào —
 * lúc ấy không có gì để đo, và nói "không có gì để đo" đúng hơn là bịa ra một
 * bài thi mà mọi kết quả đều đạt.
 */
export declare function boDeTuTheGioi(s: WorldState): readonly BaiThi[];
export type KetQuaBoDanhGia = {
    readonly soBai: number;
    readonly tongKet: TongKetEval;
    readonly cong: readonly CongEval[];
    /** Đạt khi MỌI cổng đạt. `forbiddenRecall != 0` là hỏng nặng, không phải hồi quy. */
    readonly dat: boolean;
    readonly moTa: string;
};
/**
 * Chạy bộ đề qua ĐÚNG đường ống của lượt chơi thật.
 *
 * Không có đường tắt: cùng `truyHoi()`, cùng lọc tầm nhìn, cùng rerank, cùng
 * packer. Một bộ đánh giá chạy trên đường ống riêng chỉ đo được chính nó.
 */
export declare function chayBoDanhGia(s: WorldState, nc: {
    config: RerankConfig;
    tuning: Tuning;
    nganSachToken: number;
    tyLeToken: number;
    adapter?: AdapterSemantic | null;
    baseline?: TongKetEval | null;
    dongHo?: () => number;
}): Promise<KetQuaBoDanhGia>;
