/**
 * Rerank ngữ cảnh — Phần 77 [BB].
 *
 * [BB] 77.1 — Visibility filter LUÔN chạy trước mọi bước chấm điểm.
 * Semantic reranker không được thấy một chunk mà chủ thể không được biết,
 * kể cả để trả điểm rồi loại sau.
 *
 * [BB] Rerank KHÔNG áp lên: product safety, luật chống rò rỉ, output schema,
 * prompt module và thứ tự người dùng đã chọn, Patch/Event, Luật thật của World.
 */
import { z } from 'zod';
import { EntityRefSchema } from '../contracts/primitives.js';

export const RERANK_MODES = [
  'heuristic',
  'local_cross_encoder',
  'proxy_cross_encoder',
  'llm_listwise',
  'auto',
] as const;
export type RerankMode = (typeof RERANK_MODES)[number];

const RerankEndpointObject = z
  .object({
    label: z.string().prefault(''),
    mode: z.enum(RERANK_MODES).prefault('auto'),
    proxyUrl: z.string().prefault(''),
    /** [BB] 79.1 — ở secure settings, KHÔNG bao giờ trong export hay cache. */
    proxyPassword: z.string().prefault(''),
    modelId: z.string().prefault(''),
    dialect: z.enum(['tu_do', 'openai', 'gemini', 'anthropic']).prefault('tu_do'),
  })
  .strict();

export const RerankEndpointSchema = RerankEndpointObject.prefault({});

export const RerankConfigSchema = z
  .object({
    bat: z.boolean().prefault(true),
    endpoint: RerankEndpointSchema,
    candidateK: z.number().int().min(10).max(500).prefault(120),
    outputK: z.number().int().min(1).max(100).prefault(20),
    maxChunkTokens: z.number().int().min(64).max(2048).prefault(512),
    batchSize: z.number().int().min(1).max(128).prefault(32),
    timeoutMs: z.number().int().min(100).max(30_000).prefault(3_000),
    blend: z
      .object({
        initialRank: z.number().min(0).prefault(1),
        semanticRank: z.number().min(0).prefault(1.5),
        graph: z.number().min(0).prefault(0.4),
        trust: z.number().min(0).prefault(0.3),
        recency: z.number().min(0).prefault(0.2),
      })
      .prefault({}),
    mmrLambda: z.number().min(0).max(1).prefault(0.72),
    /** Tính theo TICK, không theo thời gian máy (77.8). */
    cacheTtlTicks: z.number().int().min(0).prefault(100),
    degradeToHeuristic: z.boolean().prefault(true),
  })
  .prefault({});

export const RERANK_TASKS = [
  'narrate_scene',
  'resolve_intent',
  'storyline_beat',
  'world_report',
  'lorebook_write',
  'answer_prayer',
  'custom_workflow',
] as const;
export type RerankTask = (typeof RERANK_TASKS)[number];

export const RerankQuerySchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    /** mode:chuTheId|root */
    scopeKey: z.string(),
    task: z.enum(RERANK_TASKS),
    focusText: z.string(),
    intentText: z.string().prefault(''),
    precedentText: z.string().prefault(''),
    entityRefs: z.array(EntityRefSchema).prefault([]),
    storylineId: z.string().nullable().prefault(null),
    tick: z.number().int(),
    queryHash: z.string(),
  })
  .strict();

export const RerankCandidateSchema = z
  .object({
    chunkId: z.string(),
    sourceType: z.string(),
    /**
     * [BB] 77.3 — đã đi qua chieu() và bopMeo() nếu là tin đồn.
     * KHÔNG truyền Chunk.noiDung gốc rồi yêu cầu reranker "đừng dùng".
     */
    projectedText: z.string(),
    initialRank: z.number().int().min(1),
    initialRrf: z.number().min(0),
    graphDistance: z.number().min(0).nullable(),
    trust: z.number().min(0).max(1),
    tick: z.number().int(),
    storylineId: z.string().nullable(),
    entityRefs: z.array(EntityRefSchema).prefault([]),
    visibilityHash: z.string(),
    /** MMR phạt trùng nguồn: hai chunk khác chữ nhưng cùng nguonId vẫn là trùng mạnh. */
    nguonId: z.string().prefault(''),
  })
  .strict();

export const RerankResultSchema = z
  .object({
    queryHash: z.string(),
    modelKey: z.string(),
    orderedChunkIds: z.array(z.string()),
    scores: z.record(z.string(), z.number()).prefault({}),
    modeUsed: RerankEndpointObject.shape.mode,
    latencyMs: z.number().min(0),
    fallbackReason: z.string().prefault(''),
    createdAtTick: z.number().int(),
  })
  .strict();

/** Lý do một chunk được chọn — 77.7. */
export const LY_DO_CHON = ['semantic', 'graph', 'precedent', 'trust', 'recency', 'diversity'] as const;
export type LyDoChon = (typeof LY_DO_CHON)[number];

export const RerankCacheEntrySchema = z
  .object({
    branchId: z.string(),
    scopeKey: z.string(),
    queryHash: z.string(),
    candidateSetHash: z.string(),
    visibilityHash: z.string(),
    modelKey: z.string(),
    configHash: z.string(),
    result: RerankResultSchema,
    createdAtTick: z.number().int(),
    expiresAtTick: z.number().int(),
  })
  .strict();

export const RetrievalRunSchema = z
  .object({
    seq: z.number().int().positive().optional(),
    branchId: z.string(),
    scopeKey: z.string(),
    queryHash: z.string(),
    task: RerankQuerySchema.shape.task,
    candidateCount: z.number().int().min(0),
    selectedCount: z.number().int().min(0),
    modeUsed: RerankEndpointObject.shape.mode,
    latencyMs: z.number().min(0),
    cacheHit: z.boolean(),
    fallbackReason: z.string().prefault(''),
    /** [BB] Phải LUÔN bằng 0. Khác 0 là bug nghiêm trọng nhất của hệ retrieval. */
    forbiddenCount: z.number().int().min(0).prefault(0),
    createdAtTick: z.number().int(),
  })
  .strict();

export const RetrievalEvalCaseSchema = z
  .object({
    id: z.string(),
    mode: z.enum(['sang_the', 'than', 'pham_nhan']),
    chuTheId: z.string().nullable(),
    task: RerankQuerySchema.shape.task,
    query: z.string(),
    relevantChunkIds: z.array(z.string()),
    /** Chunk chủ thể KHÔNG được biết. forbidden recall bắt buộc = 0. */
    forbiddenChunkIds: z.array(z.string()).prefault([]),
    diversityGroups: z.record(z.string(), z.array(z.string())).prefault({}),
  })
  .strict();

/** Chỉ số bộ đánh giá — 77.10. */
export const RetrievalEvalMetricsSchema = z
  .object({
    caseId: z.string(),
    recallAt20: z.number().min(0).max(1),
    mrr: z.number().min(0).max(1),
    ndcgAt10: z.number().min(0).max(1),
    diversity: z.number().min(0).max(1),
    tyLeTrungNguon: z.number().min(0).max(1),
    /** [BB] Bắt buộc 0 ở mọi mode. */
    forbiddenRecall: z.number().min(0).max(1),
    p50LatencyMs: z.number().min(0),
    p95LatencyMs: z.number().min(0),
    fallbackRate: z.number().min(0).max(1),
    tokenSauRerank: z.number().int().min(0),
    modeUsed: RerankEndpointObject.shape.mode,
  })
  .strict();

export type RerankEndpoint = z.infer<typeof RerankEndpointSchema>;
export type RerankConfig = z.infer<typeof RerankConfigSchema>;
export type RerankQuery = z.infer<typeof RerankQuerySchema>;
export type RerankCandidate = z.infer<typeof RerankCandidateSchema>;
export type RerankResult = z.infer<typeof RerankResultSchema>;
export type RerankCacheEntry = z.infer<typeof RerankCacheEntrySchema>;
export type RetrievalRun = z.infer<typeof RetrievalRunSchema>;
export type RetrievalEvalCase = z.infer<typeof RetrievalEvalCaseSchema>;
export type RetrievalEvalMetrics = z.infer<typeof RetrievalEvalMetricsSchema>;

/** Cấu hình heuristic thuần — đích rơi về khi mọi thứ khác hỏng. */
export const CAU_HINH_HEURISTIC: RerankConfig = RerankConfigSchema.parse({
  bat: true,
  endpoint: { mode: 'heuristic' },
  degradeToHeuristic: true,
});

/**
 * [BB] Cổng Phase 0: "config rerank sai vẫn parse về cấu hình heuristic an toàn
 * hoặc báo lỗi có cấu trúc".
 *
 * Không bao giờ throw, không bao giờ để gameplay phụ thuộc cấu hình hỏng.
 */
export function doCauHinhRerank(input: unknown): {
  config: RerankConfig;
  daRoiVeHeuristic: boolean;
  canhBao: readonly string[];
} {
  const r = RerankConfigSchema.safeParse(input);
  if (r.success) {
    // Endpoint semantic thiếu thông tin bắt buộc → vẫn chơi được bằng heuristic.
    const ep = r.data.endpoint;
    const canProxy = ep.mode === 'proxy_cross_encoder' || ep.mode === 'llm_listwise';
    if (canProxy && ep.proxyUrl.trim() === '') {
      return {
        config: { ...r.data, endpoint: { ...ep, mode: 'heuristic' } },
        daRoiVeHeuristic: true,
        canhBao: [`Chế độ '${ep.mode}' cần proxyUrl; đã tạm dùng heuristic.`],
      };
    }
    return { config: r.data, daRoiVeHeuristic: false, canhBao: [] };
  }
  return {
    config: CAU_HINH_HEURISTIC,
    daRoiVeHeuristic: true,
    canhBao: r.error.issues.map((i) => `${i.path.join('.') || '(gốc)'}: ${i.message}`),
  };
}
