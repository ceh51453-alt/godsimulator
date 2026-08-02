/**
 * Benchmark rerank SAU baseline heuristic — Phần 77.10, cổng Phase 10.
 *
 * ── Vì sao benchmark phải chạy sau baseline, không phải cùng lúc ──
 *
 * Cổng Phase 10 nói: *"rerank tăng hoặc giữ nDCG mục tiêu đã ghi trong
 * `DECISIONS.md`, không đánh đổi `forbidden recall = 0`."*
 *
 * Câu ấy chỉ kiểm được nếu có một con số baseline **đo trên cùng bộ đề, cùng
 * chỉ mục, cùng truy vấn**. Đo semantic trước rồi heuristic sau, hoặc đo hai
 * lần trên hai bộ đề khác nhau, cho ra một phép so sánh vô nghĩa nhưng trông
 * rất thuyết phục. Nên `chayBenchmark()` **luôn** đo heuristic trước, trong
 * cùng một lời gọi, và trả về cả hai.
 *
 * ── Và vì sao `forbiddenRecall` là cổng CHẶN, không phải một chỉ số ──
 *
 * [BB] 77.1 — reranker không được THẤY chunk cấm, kể cả để trả điểm rồi loại
 * sau. Một bản rerank tăng nDCG 30% mà `forbiddenRecall > 0` không phải "tốt hơn
 * nhưng có rủi ro"; nó là một bản hỏng. `ketLuan()` dưới đây trả `khong_dung_duoc`
 * cho trường hợp ấy, không trả về một điểm số kèm cảnh báo.
 */
import { z } from 'zod';
import type { RetrievalEvalCase } from '../schema/rerank.js';
import type { CongEval, KetQuaMotCase, TongKetEval } from './danhGia.js';
export declare const CHE_DO_BENCHMARK: readonly ["heuristic", "semantic", "fusion"];
export type CheDoBenchmark = (typeof CHE_DO_BENCHMARK)[number];
/** Một lần chạy bộ đề với một mode. Người gọi tiêm hàm chạy thật. */
export type BoChayCase = (ca: RetrievalEvalCase, mode: CheDoBenchmark) => Promise<{
    readonly kq: KetQuaMotCase;
    readonly latencyMs: number;
}>;
export type KetQuaMode = {
    readonly mode: CheDoBenchmark;
    readonly tongKet: TongKetEval;
    readonly cong: readonly CongEval[];
};
export type KetQuaBenchmark = {
    readonly baseline: KetQuaMode;
    readonly doiChung: readonly KetQuaMode[];
    readonly ketLuan: KetLuanBenchmark;
    /** Nhịp thế giới lúc đo — [BB] `core/` không đọc đồng hồ máy. */
    readonly tickDo: number;
};
export declare const KET_LUAN: readonly ["tot_hon", "ngang_bang", "te_hon", "khong_dung_duoc"];
export type KetLuan = (typeof KET_LUAN)[number];
export type KetLuanBenchmark = {
    readonly mode: CheDoBenchmark;
    readonly ket: KetLuan;
    readonly deltaNdcg: number;
    readonly deltaRecall: number;
    readonly thongDiep: string;
};
/**
 * Chạy benchmark: heuristic trước, rồi từng mode đối chứng.
 *
 * Deterministic theo `BoChayCase`: hàm này không tự sinh số ngẫu nhiên và không
 * đọc đồng hồ. Latency do người gọi cung cấp, nên test đo được cả đường "semantic
 * chậm hơn" mà không phải chờ thật.
 */
export declare function chayBenchmark(input: {
    readonly boDe: readonly RetrievalEvalCase[];
    readonly chay: BoChayCase;
    readonly doiChung?: readonly CheDoBenchmark[];
    readonly tickDo: number;
    /** Mục tiêu nDCG đã ghi trong `DECISIONS.md`. Dưới mức này là không đạt. */
    readonly ndcgMucTieu?: number;
}): Promise<KetQuaBenchmark>;
/**
 * Kết luận của một lần đo.
 *
 * [BB] Thứ tự kiểm quyết định ngữ nghĩa: `forbiddenRecall` xét TRƯỚC mọi so sánh
 * chất lượng. Một bản tốt hơn về nDCG mà rò chunk cấm vẫn là `khong_dung_duoc`.
 */
export declare function ketLuan(baseline: KetQuaMode, moi: KetQuaMode, ndcgMucTieu: number): KetLuanBenchmark;
/**
 * Một dòng lịch sử benchmark — món nợ ghi ở cuối Phase 8.
 *
 * "Bộ đánh giá chưa lưu lịch sử chỉ số. Mỗi lần bấm là một lần đo mới… so giữa
 * hai phiên thì chưa." Bảng này đóng món nợ đó: mỗi lần chạy ghi một hàng, và
 * `soSanhPhien()` vẽ được đường hồi quy giữa hai phiên bất kỳ.
 */
export declare const DongLichSuBenchmarkSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    tickDo: z.ZodNumber;
    mode: z.ZodEnum<{
        heuristic: "heuristic";
        semantic: "semantic";
        fusion: "fusion";
    }>;
    soCase: z.ZodNumber;
    ndcgAt10: z.ZodNumber;
    recallAt20: z.ZodNumber;
    mrr: z.ZodNumber;
    diversity: z.ZodNumber;
    forbiddenRecall: z.ZodNumber;
    p95LatencyMs: z.ZodNumber;
    fallbackRate: z.ZodNumber;
    configHash: z.ZodString;
}, z.core.$strict>;
export type DongLichSuBenchmark = z.infer<typeof DongLichSuBenchmarkSchema>;
export declare function dongLichSu(input: {
    readonly branchId: string;
    readonly configHash: string;
    readonly kq: KetQuaMode;
    readonly tickDo: number;
}): DongLichSuBenchmark;
export type SoSanhPhien = {
    readonly dat: boolean;
    readonly deltaNdcg: number;
    readonly thongDiep: string;
};
/**
 * So hai phiên đo.
 *
 * Từ chối so khi `configHash` khác nhau: hai lần đo với hai cấu hình rerank khác
 * nhau không phải một đường hồi quy, và vẽ chúng chung một đồ thị là tự lừa mình.
 */
export declare function soSanhPhien(cu: DongLichSuBenchmark, moi: DongLichSuBenchmark): SoSanhPhien;
