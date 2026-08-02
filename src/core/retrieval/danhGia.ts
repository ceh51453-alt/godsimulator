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
import { RetrievalEvalMetricsSchema } from '../schema/rerank.js';

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

function recallAtK(ra: readonly string[], dung: readonly string[], k: number): number {
  if (dung.length === 0) return 1;
  const top = new Set(ra.slice(0, k));
  return dung.filter((id) => top.has(id)).length / dung.length;
}

/** MRR — nghịch đảo hạng của kết quả ĐÚNG ĐẦU TIÊN. */
function mrr(ra: readonly string[], dung: readonly string[]): number {
  const tap = new Set(dung);
  for (const [i, id] of ra.entries()) if (tap.has(id)) return 1 / (i + 1);
  return 0;
}

/** nDCG@k với gain nhị phân — đủ vì gold set ở đây là "đúng / không đúng". */
function ndcgAtK(ra: readonly string[], dung: readonly string[], k: number): number {
  const tap = new Set(dung);
  let dcg = 0;
  for (let i = 0; i < Math.min(k, ra.length); i++) {
    if (tap.has(ra[i] as string)) dcg += 1 / Math.log2(i + 2);
  }
  let idcg = 0;
  for (let i = 0; i < Math.min(k, dung.length); i++) idcg += 1 / Math.log2(i + 2);
  return idcg === 0 ? 1 : dcg / idcg;
}

/** Đa dạng nguồn = số `nguonId` khác nhau / số chunk trả về. */
function diversity(nguonIds: readonly string[]): number {
  if (nguonIds.length === 0) return 1;
  return new Set(nguonIds).size / nguonIds.length;
}

/**
 * Tỷ lệ trùng nguồn — 54.11 mục 40: hỏng khi **top-10 có hơn 6 chunk cùng nguồn**.
 *
 * Mẫu số là 10, KHÔNG phải số chunk thật sự trả về. Chia cho số trả về là một
 * lỗi tinh vi: một truy vấn hẹp trả đúng 3 chunk, trong đó 2 cùng nguồn, sẽ ra
 * 67% và đỏ cổng — trong khi 54.11 nói hai chunk cùng nguồn hoàn toàn bình
 * thường. Đơn vị của quy tắc là CHỖ TRONG TOP-10, nên mẫu số phải là top-10.
 */
const CUA_SO_DA_DANG = 10;

function tyLeTrungNguon(nguonIds: readonly string[]): number {
  const top = nguonIds.slice(0, CUA_SO_DA_DANG);
  if (top.length === 0) return 0;
  const dem = new Map<string, number>();
  for (const n of top) dem.set(n, (dem.get(n) ?? 0) + 1);
  return Math.max(...dem.values()) / CUA_SO_DA_DANG;
}

function phanVi(ds: readonly number[], p: number): number {
  if (ds.length === 0) return 0;
  const sap = [...ds].sort((a, b) => a - b);
  const i = Math.min(sap.length - 1, Math.max(0, Math.ceil((p / 100) * sap.length) - 1));
  return sap[i] as number;
}

/** Chấm một case. `forbiddenRecall` phải ra 0; khác 0 là bằng chứng lọc thủng. */
export function chamMotCase(kq: KetQuaMotCase, ca: RetrievalEvalCase): RetrievalEvalMetrics {
  return RetrievalEvalMetricsSchema.parse({
    caseId: ca.id,
    recallAt20: recallAtK(kq.orderedChunkIds, ca.relevantChunkIds, 20),
    mrr: mrr(kq.orderedChunkIds, ca.relevantChunkIds),
    ndcgAt10: ndcgAtK(kq.orderedChunkIds, ca.relevantChunkIds, 10),
    diversity: diversity(kq.nguonIds),
    tyLeTrungNguon: tyLeTrungNguon(kq.nguonIds),
    forbiddenRecall: recallAtKCam(kq.orderedChunkIds, ca.forbiddenChunkIds),
    p50LatencyMs: kq.latencyMs,
    p95LatencyMs: kq.latencyMs,
    fallbackRate: kq.daFallback ? 1 : 0,
    tokenSauRerank: kq.tokenSauRerank,
    modeUsed: kq.modeUsed,
  });
}

/**
 * Forbidden recall tính trên TOÀN BỘ kết quả, không chỉ top-20.
 *
 * Cố ý khác `recallAt20`: một chunk cấm ở hạng 47 vẫn là một chunk cấm đã lọt
 * qua bộ lọc. "Nó nằm ngoài top-K nên không sao" là đúng về hiệu ứng và sai về
 * bản chất — 77.1 nói reranker không được THẤY nó, chứ không nói không được
 * xếp nó cao.
 */
function recallAtKCam(ra: readonly string[], cam: readonly string[]): number {
  if (cam.length === 0) return 0;
  const tap = new Set(ra);
  return cam.filter((id) => tap.has(id)).length / cam.length;
}

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

export function tongKet(ds: readonly RetrievalEvalMetrics[], latency: readonly number[]): TongKetEval {
  const n = Math.max(1, ds.length);
  const tb = (f: (m: RetrievalEvalMetrics) => number): number => ds.reduce((t, m) => t + f(m), 0) / n;
  return {
    soCase: ds.length,
    recallAt20: tb((m) => m.recallAt20),
    mrr: tb((m) => m.mrr),
    ndcgAt10: tb((m) => m.ndcgAt10),
    diversity: tb((m) => m.diversity),
    tyLeTrungNguon: tb((m) => m.tyLeTrungNguon),
    forbiddenRecall: tb((m) => m.forbiddenRecall),
    p50LatencyMs: phanVi(latency, 50),
    p95LatencyMs: phanVi(latency, 95),
    fallbackRate: tb((m) => m.fallbackRate),
    tokenTrungBinh: tb((m) => m.tokenSauRerank),
    chiTiet: ds,
  };
}

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
export function congEval(hienTai: TongKetEval, baseline: TongKetEval | null): readonly CongEval[] {
  const ra: CongEval[] = [
    {
      ten: 'forbidden recall = 0 ở mọi mode',
      dat: hienTai.forbiddenRecall === 0,
      chiTiet: `forbiddenRecall = ${hienTai.forbiddenRecall}`,
    },
    {
      ten: 'top-10 không quá 6 chunk cùng nguonId',
      dat: hienTai.tyLeTrungNguon <= 0.6 + 1e-9,
      chiTiet:
        `nguồn dày nhất chiếm ${Math.round(hienTai.tyLeTrungNguon * CUA_SO_DA_DANG)}/` +
        `${CUA_SO_DA_DANG} chỗ của top-10`,
    },
    {
      ten: 'fallback rate không quá 30%',
      dat: hienTai.fallbackRate <= 0.3,
      chiTiet: `fallbackRate = ${(hienTai.fallbackRate * 100).toFixed(0)}%`,
    },
  ];

  if (baseline) {
    ra.push(
      {
        ten: 'nDCG@10 không thấp hơn baseline heuristic',
        dat: hienTai.ndcgAt10 >= baseline.ndcgAt10 - 1e-9,
        chiTiet: `${hienTai.ndcgAt10.toFixed(4)} so với baseline ${baseline.ndcgAt10.toFixed(4)}`,
      },
      {
        ten: 'Recall@20 không giảm quá 2%',
        dat: hienTai.recallAt20 >= baseline.recallAt20 * 0.98 - 1e-9,
        chiTiet: `${hienTai.recallAt20.toFixed(4)} so với baseline ${baseline.recallAt20.toFixed(4)}`,
      },
      {
        ten: 'semantic đáng bật mặc định (nDCG hoặc MRR +5% tương đối)',
        dat: hienTai.ndcgAt10 >= baseline.ndcgAt10 * 1.05 || hienTai.mrr >= baseline.mrr * 1.05,
        chiTiet:
          `nDCG ${((hienTai.ndcgAt10 / Math.max(1e-9, baseline.ndcgAt10) - 1) * 100).toFixed(1)}% · ` +
          `MRR ${((hienTai.mrr / Math.max(1e-9, baseline.mrr) - 1) * 100).toFixed(1)}%`,
      },
    );
  }

  return ra;
}
