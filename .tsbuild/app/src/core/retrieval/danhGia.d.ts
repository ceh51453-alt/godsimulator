/**
 * Bộ đánh giá retrieval — Phần 77.10 [BB].
 *
 * ── Vì sao bộ này phải có TRƯỚC khi bật semantic ──
 *
 * 79.5 Phase 8: "Xây heuristic rerank + eval TRƯỚC semantic adapter." Không có
 * baseline thì câu "semantic tốt hơn" không kiểm được, và một reranker đắt tiền
 * làm kết quả tệ đi sẽ không ai phát hiện — vì nó tệ đi một cách êm ái.
 *
 * ── Chỉ số bắt buộc ──
 *
 * Recall@20 · MRR · nDCG@10 · diversity theo source · tỷ lệ trùng `nguonId`
 * · **forbidden recall (BẮT BUỘC 0)** · p50/p95 latency · fallback rate
 * · token dùng sau rerank.
 *
 * [BB] `forbiddenRecall != 0` ở BẤT KỲ mode nào là hỏng nặng, không phải hồi
 * quy chất lượng. Nó nghĩa là lọc tầm nhìn thủng.
 */
import type { RetrievalEvalCase, RetrievalEvalMetrics, RerankResult } from '../schema/rerank.js';
export type KetQuaMotCase = {
    readonly caseId: string;
    /** Thứ tự chunk trả về, tốt nhất trước. */
    readonly orderedChunkIds: readonly string[];
    /** `nguonId` của từng chunk trả về, cùng thứ tự. */
    readonly nguonIds: readonly string[];
    readonly latencyMs: number;
    readonly daFallback: boolean;
    readonly tokenSauRerank: number;
    readonly modeUsed: RerankResult['modeUsed'];
};
/** Chấm một case. `forbiddenRecall` phải ra 0; khác 0 là bằng chứng lọc thủng. */
export declare function chamMotCase(kq: KetQuaMotCase, ca: RetrievalEvalCase): RetrievalEvalMetrics;
export type TongKetEval = {
    readonly soCase: number;
    readonly recallAt20: number;
    readonly mrr: number;
    readonly ndcgAt10: number;
    readonly diversity: number;
    readonly tyLeTrungNguon: number;
    /** [BB] Bắt buộc 0. */
    readonly forbiddenRecall: number;
    readonly p50LatencyMs: number;
    readonly p95LatencyMs: number;
    readonly fallbackRate: number;
    readonly tokenTrungBinh: number;
    readonly chiTiet: readonly RetrievalEvalMetrics[];
};
export declare function tongKet(ds: readonly RetrievalEvalMetrics[], latency: readonly number[]): TongKetEval;
export type CongEval = {
    readonly ten: string;
    readonly dat: boolean;
    readonly chiTiet: string;
};
/**
 * Gate đề nghị của 77.10, cài thành hàm kiểm được.
 *
 * `baseline` là kết quả của mode heuristic. Truyền `null` khi đang đo chính
 * baseline — lúc ấy chỉ ba cổng tuyệt đối được kiểm.
 */
export declare function congEval(hienTai: TongKetEval, baseline: TongKetEval | null): readonly CongEval[];
