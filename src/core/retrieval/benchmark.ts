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
import type { RetrievalEvalCase, RetrievalEvalMetrics } from '../schema/rerank.js';
import { chamMotCase, congEval, tongKet } from './danhGia.js';
import type { CongEval, KetQuaMotCase, TongKetEval } from './danhGia.js';

export const CHE_DO_BENCHMARK = ['heuristic', 'semantic', 'fusion'] as const;
export type CheDoBenchmark = (typeof CHE_DO_BENCHMARK)[number];

/** Một lần chạy bộ đề với một mode. Người gọi tiêm hàm chạy thật. */
export type BoChayCase = (
  ca: RetrievalEvalCase,
  mode: CheDoBenchmark,
) => Promise<{ readonly kq: KetQuaMotCase; readonly latencyMs: number }>;

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

export const KET_LUAN = ['tot_hon', 'ngang_bang', 'te_hon', 'khong_dung_duoc'] as const;
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
export async function chayBenchmark(input: {
  readonly boDe: readonly RetrievalEvalCase[];
  readonly chay: BoChayCase;
  readonly doiChung?: readonly CheDoBenchmark[];
  readonly tickDo: number;
  /** Mục tiêu nDCG đã ghi trong `DECISIONS.md`. Dưới mức này là không đạt. */
  readonly ndcgMucTieu?: number;
}): Promise<KetQuaBenchmark> {
  const doMode = async (mode: CheDoBenchmark): Promise<{ tk: TongKetEval }> => {
    const ds: RetrievalEvalMetrics[] = [];
    const lat: number[] = [];
    // Chạy tuần tự và theo thứ tự id: kết quả phải lặp lại được giữa hai lần đo.
    for (const ca of [...input.boDe].sort((a, b) => (a.id < b.id ? -1 : 1))) {
      const r = await input.chay(ca, mode);
      ds.push(chamMotCase(r.kq, ca));
      lat.push(r.latencyMs);
    }
    return { tk: tongKet(ds, lat) };
  };

  const base = await doMode('heuristic');
  const baseline: KetQuaMode = {
    mode: 'heuristic',
    tongKet: base.tk,
    cong: congEval(base.tk, null),
  };

  const doiChung: KetQuaMode[] = [];
  for (const m of input.doiChung ?? ['semantic']) {
    if (m === 'heuristic') continue;
    const r = await doMode(m);
    doiChung.push({ mode: m, tongKet: r.tk, cong: congEval(r.tk, base.tk) });
  }

  const tot = doiChung[0] ?? baseline;
  return {
    baseline,
    doiChung,
    ketLuan: ketLuan(baseline, tot, input.ndcgMucTieu ?? 0),
    tickDo: input.tickDo,
  };
}

/**
 * Kết luận của một lần đo.
 *
 * [BB] Thứ tự kiểm quyết định ngữ nghĩa: `forbiddenRecall` xét TRƯỚC mọi so sánh
 * chất lượng. Một bản tốt hơn về nDCG mà rò chunk cấm vẫn là `khong_dung_duoc`.
 */
export function ketLuan(baseline: KetQuaMode, moi: KetQuaMode, ndcgMucTieu: number): KetLuanBenchmark {
  const dNdcg = moi.tongKet.ndcgAt10 - baseline.tongKet.ndcgAt10;
  const dRecall = moi.tongKet.recallAt20 - baseline.tongKet.recallAt20;

  if (moi.tongKet.forbiddenRecall > 0) {
    return {
      mode: moi.mode,
      ket: 'khong_dung_duoc',
      deltaNdcg: dNdcg,
      deltaRecall: dRecall,
      thongDiep:
        `Mode "${moi.mode}" để lọt chunk cấm (forbiddenRecall = ${moi.tongKet.forbiddenRecall}). ` +
        'Không đánh đổi điều này lấy nDCG, dù nDCG có tăng bao nhiêu.',
    };
  }
  if (moi.tongKet.ndcgAt10 < ndcgMucTieu) {
    return {
      mode: moi.mode,
      ket: 'te_hon',
      deltaNdcg: dNdcg,
      deltaRecall: dRecall,
      thongDiep: `nDCG@10 = ${moi.tongKet.ndcgAt10.toFixed(4)}, dưới mục tiêu ${ndcgMucTieu} đã ghi trong DECISIONS.md.`,
    };
  }
  if (dNdcg < -1e-9) {
    return {
      mode: moi.mode,
      ket: 'te_hon',
      deltaNdcg: dNdcg,
      deltaRecall: dRecall,
      thongDiep: `nDCG@10 thấp hơn baseline heuristic ${Math.abs(dNdcg).toFixed(4)}. Giữ heuristic.`,
    };
  }
  if (dNdcg < 1e-4) {
    return {
      mode: moi.mode,
      ket: 'ngang_bang',
      deltaNdcg: dNdcg,
      deltaRecall: dRecall,
      thongDiep:
        `nDCG@10 ngang baseline. Semantic không sai, nhưng cũng chưa đáng tiền: ` +
        `p95 latency ${Math.round(moi.tongKet.p95LatencyMs)} ms so với ${Math.round(baseline.tongKet.p95LatencyMs)} ms.`,
    };
  }
  return {
    mode: moi.mode,
    ket: 'tot_hon',
    deltaNdcg: dNdcg,
    deltaRecall: dRecall,
    thongDiep: `nDCG@10 tăng ${dNdcg.toFixed(4)}, Recall@20 ${dRecall >= 0 ? 'tăng' : 'giảm'} ${Math.abs(dRecall).toFixed(4)}.`,
  };
}

// ─────────────────────────────────────────── lịch sử chỉ số

/**
 * Một dòng lịch sử benchmark — món nợ ghi ở cuối Phase 8.
 *
 * "Bộ đánh giá chưa lưu lịch sử chỉ số. Mỗi lần bấm là một lần đo mới… so giữa
 * hai phiên thì chưa." Bảng này đóng món nợ đó: mỗi lần chạy ghi một hàng, và
 * `soSanhPhien()` vẽ được đường hồi quy giữa hai phiên bất kỳ.
 */
export const DongLichSuBenchmarkSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    tickDo: z.number().int(),
    mode: z.enum(CHE_DO_BENCHMARK),
    soCase: z.number().int(),
    ndcgAt10: z.number(),
    recallAt20: z.number(),
    mrr: z.number(),
    diversity: z.number(),
    forbiddenRecall: z.number(),
    p95LatencyMs: z.number(),
    fallbackRate: z.number(),
    /** Hash cấu hình rerank lúc đo — hai dòng khác hash thì không so được. */
    configHash: z.string(),
  })
  .strict();

export type DongLichSuBenchmark = z.infer<typeof DongLichSuBenchmarkSchema>;

export function dongLichSu(input: {
  readonly branchId: string;
  readonly configHash: string;
  readonly kq: KetQuaMode;
  readonly tickDo: number;
}): DongLichSuBenchmark {
  const t = input.kq.tongKet;
  return DongLichSuBenchmarkSchema.parse({
    id: `bm.${input.branchId}.${input.tickDo}.${input.kq.mode}`,
    branchId: input.branchId,
    tickDo: input.tickDo,
    mode: input.kq.mode,
    soCase: t.soCase,
    ndcgAt10: t.ndcgAt10,
    recallAt20: t.recallAt20,
    mrr: t.mrr,
    diversity: t.diversity,
    forbiddenRecall: t.forbiddenRecall,
    p95LatencyMs: t.p95LatencyMs,
    fallbackRate: t.fallbackRate,
    configHash: input.configHash,
  });
}

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
export function soSanhPhien(cu: DongLichSuBenchmark, moi: DongLichSuBenchmark): SoSanhPhien {
  if (cu.configHash !== moi.configHash) {
    return {
      dat: false,
      deltaNdcg: 0,
      thongDiep: 'Hai phiên dùng cấu hình rerank khác nhau — không so được. Đo lại với cùng cấu hình.',
    };
  }
  if (cu.mode !== moi.mode) {
    return { dat: false, deltaNdcg: 0, thongDiep: `Khác mode (${cu.mode} vs ${moi.mode}).` };
  }
  const d = moi.ndcgAt10 - cu.ndcgAt10;
  if (moi.forbiddenRecall > 0) {
    return { dat: false, deltaNdcg: d, thongDiep: 'Phiên mới để lọt chunk cấm. Hồi quy nghiêm trọng.' };
  }
  return {
    dat: d >= -1e-9,
    deltaNdcg: d,
    thongDiep:
      d >= 1e-4
        ? `nDCG@10 tăng ${d.toFixed(4)} so với nhịp ${cu.tickDo}.`
        : d <= -1e-4
          ? `nDCG@10 GIẢM ${Math.abs(d).toFixed(4)} so với nhịp ${cu.tickDo}.`
          : 'nDCG@10 không đổi đáng kể.',
  };
}
