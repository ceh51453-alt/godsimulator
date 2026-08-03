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
export declare const RERANK_MODES: readonly ["heuristic", "local_cross_encoder", "proxy_cross_encoder", "llm_listwise", "auto"];
export type RerankMode = (typeof RERANK_MODES)[number];
export declare const RerankEndpointSchema: z.ZodPrefault<z.ZodObject<{
    label: z.ZodPrefault<z.ZodString>;
    mode: z.ZodPrefault<z.ZodEnum<{
        heuristic: "heuristic";
        local_cross_encoder: "local_cross_encoder";
        proxy_cross_encoder: "proxy_cross_encoder";
        llm_listwise: "llm_listwise";
        auto: "auto";
    }>>;
    proxyUrl: z.ZodPrefault<z.ZodString>;
    proxyPassword: z.ZodPrefault<z.ZodString>;
    modelId: z.ZodPrefault<z.ZodString>;
    dialect: z.ZodPrefault<z.ZodEnum<{
        tu_do: "tu_do";
        openai: "openai";
        gemini: "gemini";
        anthropic: "anthropic";
    }>>;
}, z.core.$strict>>;
export declare const RerankConfigSchema: z.ZodPrefault<z.ZodObject<{
    bat: z.ZodPrefault<z.ZodBoolean>;
    endpoint: z.ZodPrefault<z.ZodObject<{
        label: z.ZodPrefault<z.ZodString>;
        mode: z.ZodPrefault<z.ZodEnum<{
            heuristic: "heuristic";
            local_cross_encoder: "local_cross_encoder";
            proxy_cross_encoder: "proxy_cross_encoder";
            llm_listwise: "llm_listwise";
            auto: "auto";
        }>>;
        proxyUrl: z.ZodPrefault<z.ZodString>;
        proxyPassword: z.ZodPrefault<z.ZodString>;
        modelId: z.ZodPrefault<z.ZodString>;
        dialect: z.ZodPrefault<z.ZodEnum<{
            tu_do: "tu_do";
            openai: "openai";
            gemini: "gemini";
            anthropic: "anthropic";
        }>>;
    }, z.core.$strict>>;
    candidateK: z.ZodPrefault<z.ZodNumber>;
    outputK: z.ZodPrefault<z.ZodNumber>;
    maxChunkTokens: z.ZodPrefault<z.ZodNumber>;
    batchSize: z.ZodPrefault<z.ZodNumber>;
    timeoutMs: z.ZodPrefault<z.ZodNumber>;
    blend: z.ZodPrefault<z.ZodObject<{
        initialRank: z.ZodPrefault<z.ZodNumber>;
        semanticRank: z.ZodPrefault<z.ZodNumber>;
        graph: z.ZodPrefault<z.ZodNumber>;
        trust: z.ZodPrefault<z.ZodNumber>;
        recency: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    mmrLambda: z.ZodPrefault<z.ZodNumber>;
    cacheTtlTicks: z.ZodPrefault<z.ZodNumber>;
    degradeToHeuristic: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strip>>;
export declare const RERANK_TASKS: readonly ["narrate_scene", "resolve_intent", "storyline_beat", "world_report", "lorebook_write", "answer_prayer", "custom_workflow"];
export type RerankTask = (typeof RERANK_TASKS)[number];
export declare const RerankQuerySchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    scopeKey: z.ZodString;
    task: z.ZodEnum<{
        narrate_scene: "narrate_scene";
        resolve_intent: "resolve_intent";
        storyline_beat: "storyline_beat";
        world_report: "world_report";
        lorebook_write: "lorebook_write";
        answer_prayer: "answer_prayer";
        custom_workflow: "custom_workflow";
    }>;
    focusText: z.ZodString;
    intentText: z.ZodPrefault<z.ZodString>;
    precedentText: z.ZodPrefault<z.ZodString>;
    entityRefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    storylineId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    tick: z.ZodNumber;
    queryHash: z.ZodString;
}, z.core.$strict>;
export declare const RerankCandidateSchema: z.ZodObject<{
    chunkId: z.ZodString;
    sourceType: z.ZodString;
    projectedText: z.ZodString;
    initialRank: z.ZodNumber;
    initialRrf: z.ZodNumber;
    graphDistance: z.ZodNullable<z.ZodNumber>;
    trust: z.ZodNumber;
    tick: z.ZodNumber;
    storylineId: z.ZodNullable<z.ZodString>;
    entityRefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    visibilityHash: z.ZodString;
    nguonId: z.ZodPrefault<z.ZodString>;
}, z.core.$strict>;
export declare const RerankResultSchema: z.ZodObject<{
    queryHash: z.ZodString;
    modelKey: z.ZodString;
    orderedChunkIds: z.ZodArray<z.ZodString>;
    scores: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    modeUsed: z.ZodPrefault<z.ZodEnum<{
        heuristic: "heuristic";
        local_cross_encoder: "local_cross_encoder";
        proxy_cross_encoder: "proxy_cross_encoder";
        llm_listwise: "llm_listwise";
        auto: "auto";
    }>>;
    latencyMs: z.ZodNumber;
    fallbackReason: z.ZodPrefault<z.ZodString>;
    createdAtTick: z.ZodNumber;
}, z.core.$strict>;
/** Lý do một chunk được chọn — 77.7. */
export declare const LY_DO_CHON: readonly ["semantic", "graph", "precedent", "trust", "recency", "diversity"];
export type LyDoChon = (typeof LY_DO_CHON)[number];
export declare const RerankCacheEntrySchema: z.ZodObject<{
    branchId: z.ZodString;
    scopeKey: z.ZodString;
    queryHash: z.ZodString;
    candidateSetHash: z.ZodString;
    visibilityHash: z.ZodString;
    modelKey: z.ZodString;
    configHash: z.ZodString;
    result: z.ZodObject<{
        queryHash: z.ZodString;
        modelKey: z.ZodString;
        orderedChunkIds: z.ZodArray<z.ZodString>;
        scores: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        modeUsed: z.ZodPrefault<z.ZodEnum<{
            heuristic: "heuristic";
            local_cross_encoder: "local_cross_encoder";
            proxy_cross_encoder: "proxy_cross_encoder";
            llm_listwise: "llm_listwise";
            auto: "auto";
        }>>;
        latencyMs: z.ZodNumber;
        fallbackReason: z.ZodPrefault<z.ZodString>;
        createdAtTick: z.ZodNumber;
    }, z.core.$strict>;
    createdAtTick: z.ZodNumber;
    expiresAtTick: z.ZodNumber;
}, z.core.$strict>;
export declare const RetrievalRunSchema: z.ZodObject<{
    seq: z.ZodOptional<z.ZodNumber>;
    branchId: z.ZodString;
    scopeKey: z.ZodString;
    queryHash: z.ZodString;
    task: z.ZodEnum<{
        narrate_scene: "narrate_scene";
        resolve_intent: "resolve_intent";
        storyline_beat: "storyline_beat";
        world_report: "world_report";
        lorebook_write: "lorebook_write";
        answer_prayer: "answer_prayer";
        custom_workflow: "custom_workflow";
    }>;
    candidateCount: z.ZodNumber;
    selectedCount: z.ZodNumber;
    modeUsed: z.ZodPrefault<z.ZodEnum<{
        heuristic: "heuristic";
        local_cross_encoder: "local_cross_encoder";
        proxy_cross_encoder: "proxy_cross_encoder";
        llm_listwise: "llm_listwise";
        auto: "auto";
    }>>;
    latencyMs: z.ZodNumber;
    cacheHit: z.ZodBoolean;
    fallbackReason: z.ZodPrefault<z.ZodString>;
    forbiddenCount: z.ZodPrefault<z.ZodNumber>;
    createdAtTick: z.ZodNumber;
}, z.core.$strict>;
export declare const RetrievalEvalCaseSchema: z.ZodObject<{
    id: z.ZodString;
    mode: z.ZodEnum<{
        sang_the: "sang_the";
        than: "than";
        pham_nhan: "pham_nhan";
    }>;
    chuTheId: z.ZodNullable<z.ZodString>;
    task: z.ZodEnum<{
        narrate_scene: "narrate_scene";
        resolve_intent: "resolve_intent";
        storyline_beat: "storyline_beat";
        world_report: "world_report";
        lorebook_write: "lorebook_write";
        answer_prayer: "answer_prayer";
        custom_workflow: "custom_workflow";
    }>;
    query: z.ZodString;
    relevantChunkIds: z.ZodArray<z.ZodString>;
    forbiddenChunkIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    diversityGroups: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
}, z.core.$strict>;
/** Chỉ số bộ đánh giá — 77.10. */
export declare const RetrievalEvalMetricsSchema: z.ZodObject<{
    caseId: z.ZodString;
    recallAt20: z.ZodNumber;
    mrr: z.ZodNumber;
    ndcgAt10: z.ZodNumber;
    diversity: z.ZodNumber;
    tyLeTrungNguon: z.ZodNumber;
    forbiddenRecall: z.ZodNumber;
    p50LatencyMs: z.ZodNumber;
    p95LatencyMs: z.ZodNumber;
    fallbackRate: z.ZodNumber;
    tokenSauRerank: z.ZodNumber;
    modeUsed: z.ZodPrefault<z.ZodEnum<{
        heuristic: "heuristic";
        local_cross_encoder: "local_cross_encoder";
        proxy_cross_encoder: "proxy_cross_encoder";
        llm_listwise: "llm_listwise";
        auto: "auto";
    }>>;
}, z.core.$strict>;
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
export declare const CAU_HINH_HEURISTIC: RerankConfig;
/**
 * [BB] Cổng Phase 0: "config rerank sai vẫn parse về cấu hình heuristic an toàn
 * hoặc báo lỗi có cấu trúc".
 *
 * Không bao giờ throw, không bao giờ để gameplay phụ thuộc cấu hình hỏng.
 */
export declare function doCauHinhRerank(input: unknown): {
    config: RerankConfig;
    daRoiVeHeuristic: boolean;
    canhBao: readonly string[];
};
