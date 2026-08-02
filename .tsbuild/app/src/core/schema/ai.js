/**
 * ModelProfile + GenParams — Phần 31.2, 31.3.
 * Phase 0 chỉ khóa hợp đồng; client thật đến ở Phase 8.
 *
 * [BB] Giá trị max của mọi slider lấy từ Profile đang chọn, không hardcode trong component.
 */
import { z } from 'zod';
export const ModelProfileSchema = z
    .object({
    id: z.string(),
    ten: z.string(),
    khop: z
        .object({
        chua: z.array(z.string()).prefault([]),
    })
        .prefault({}),
    gioiHan: z
        .object({
        contextMax: z.number().prefault(128_000),
        outputMax: z.number().prefault(8_192),
        /** [BB] Cảnh báo UI khi outputMax !== outputMacDinhCuaApi. */
        outputMacDinhCuaApi: z.number().prefault(8_192),
        temperatureMax: z.number().prefault(2),
        topKMax: z.number().prefault(64),
        thinkingBudgetMax: z.number().prefault(0),
    })
        .prefault({}),
    hoTro: z
        .object({
        thinkingLevel: z.boolean().prefault(false),
        thinkingBudget: z.boolean().prefault(false),
        mediaResolution: z.boolean().prefault(false),
        structuredOutput: z.boolean().prefault(false),
        promptCache: z.boolean().prefault(false),
        seed: z.boolean().prefault(false),
        topA: z.boolean().prefault(false),
        minP: z.boolean().prefault(false),
        repetitionPenalty: z.boolean().prefault(false),
        reasoningEffort: z.boolean().prefault(false),
        verbosity: z.boolean().prefault(false),
        continuePrefill: z.boolean().prefault(false),
        stopSequences: z.number().prefault(4),
    })
        .prefault({}),
    /** Ký tự tiếng Việt / token — hiệu chỉnh được bằng probe #5. */
    tyLeToken: z.number().prefault(3.2),
    nguon: z.enum(['dung_san', 'tu_do', 'nguoi_dung']).prefault('dung_san'),
})
    .strict();
export const GenParamsSchema = z
    .object({
    temperature: z.number().min(0).max(2).prefault(1.0),
    topP: z.number().min(0).max(1).prefault(0.95),
    topK: z.number().min(0).prefault(40),
    topA: z.number().min(0).max(1).prefault(0),
    minP: z.number().min(0).max(1).prefault(0),
    repetitionPenalty: z.number().min(0).prefault(1),
    maxOutputTokens: z.number().min(1).prefault(8_192),
    candidateCount: z.number().min(1).max(8).prefault(1),
    presencePenalty: z.number().min(-2).max(2).prefault(0),
    frequencyPenalty: z.number().min(-2).max(2).prefault(0),
    stopSequences: z.array(z.string()).prefault([]),
    thinkingLevel: z.enum(['low', 'medium', 'high']).prefault('medium'),
    thinkingBudget: z.number().min(0).prefault(0),
    reasoningEffort: z.enum(['low', 'medium', 'high', 'max']).optional(),
    verbosity: z.enum(['low', 'medium', 'high']).optional(),
    continuePrefill: z.boolean().prefault(false),
    mediaResolution: z.enum(['low', 'medium', 'high']).prefault('medium'),
    seed: z.number().nullable().prefault(null),
    contextLimit: z.number().min(1024).prefault(128_000),
})
    .prefault({});
/** Phần 61.2: `NormalizedGenParamsSchema = GenParamsSchema`. */
export const NormalizedGenParamsSchema = GenParamsSchema;
export const DIALECTS = ['tu_do', 'openai', 'gemini', 'anthropic'];
