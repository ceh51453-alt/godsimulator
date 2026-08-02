/**
 * ModelProfile + GenParams — Phần 31.2, 31.3.
 * Phase 0 chỉ khóa hợp đồng; client thật đến ở Phase 8.
 *
 * [BB] Giá trị max của mọi slider lấy từ Profile đang chọn, không hardcode trong component.
 */
import { z } from 'zod';
export declare const ModelProfileSchema: z.ZodObject<{
    id: z.ZodString;
    ten: z.ZodString;
    khop: z.ZodPrefault<z.ZodObject<{
        chua: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    gioiHan: z.ZodPrefault<z.ZodObject<{
        contextMax: z.ZodPrefault<z.ZodNumber>;
        outputMax: z.ZodPrefault<z.ZodNumber>;
        outputMacDinhCuaApi: z.ZodPrefault<z.ZodNumber>;
        temperatureMax: z.ZodPrefault<z.ZodNumber>;
        topKMax: z.ZodPrefault<z.ZodNumber>;
        thinkingBudgetMax: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    hoTro: z.ZodPrefault<z.ZodObject<{
        thinkingLevel: z.ZodPrefault<z.ZodBoolean>;
        thinkingBudget: z.ZodPrefault<z.ZodBoolean>;
        mediaResolution: z.ZodPrefault<z.ZodBoolean>;
        structuredOutput: z.ZodPrefault<z.ZodBoolean>;
        promptCache: z.ZodPrefault<z.ZodBoolean>;
        seed: z.ZodPrefault<z.ZodBoolean>;
        topA: z.ZodPrefault<z.ZodBoolean>;
        minP: z.ZodPrefault<z.ZodBoolean>;
        repetitionPenalty: z.ZodPrefault<z.ZodBoolean>;
        reasoningEffort: z.ZodPrefault<z.ZodBoolean>;
        verbosity: z.ZodPrefault<z.ZodBoolean>;
        continuePrefill: z.ZodPrefault<z.ZodBoolean>;
        stopSequences: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    tyLeToken: z.ZodPrefault<z.ZodNumber>;
    nguon: z.ZodPrefault<z.ZodEnum<{
        nguoi_dung: "nguoi_dung";
        dung_san: "dung_san";
        tu_do: "tu_do";
    }>>;
}, z.core.$strict>;
export declare const GenParamsSchema: z.ZodPrefault<z.ZodObject<{
    temperature: z.ZodPrefault<z.ZodNumber>;
    topP: z.ZodPrefault<z.ZodNumber>;
    topK: z.ZodPrefault<z.ZodNumber>;
    topA: z.ZodPrefault<z.ZodNumber>;
    minP: z.ZodPrefault<z.ZodNumber>;
    repetitionPenalty: z.ZodPrefault<z.ZodNumber>;
    maxOutputTokens: z.ZodPrefault<z.ZodNumber>;
    candidateCount: z.ZodPrefault<z.ZodNumber>;
    presencePenalty: z.ZodPrefault<z.ZodNumber>;
    frequencyPenalty: z.ZodPrefault<z.ZodNumber>;
    stopSequences: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    thinkingLevel: z.ZodPrefault<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    thinkingBudget: z.ZodPrefault<z.ZodNumber>;
    reasoningEffort: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        max: "max";
    }>>;
    verbosity: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    continuePrefill: z.ZodPrefault<z.ZodBoolean>;
    mediaResolution: z.ZodPrefault<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    seed: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    contextLimit: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
/** Phần 61.2: `NormalizedGenParamsSchema = GenParamsSchema`. */
export declare const NormalizedGenParamsSchema: z.ZodPrefault<z.ZodObject<{
    temperature: z.ZodPrefault<z.ZodNumber>;
    topP: z.ZodPrefault<z.ZodNumber>;
    topK: z.ZodPrefault<z.ZodNumber>;
    topA: z.ZodPrefault<z.ZodNumber>;
    minP: z.ZodPrefault<z.ZodNumber>;
    repetitionPenalty: z.ZodPrefault<z.ZodNumber>;
    maxOutputTokens: z.ZodPrefault<z.ZodNumber>;
    candidateCount: z.ZodPrefault<z.ZodNumber>;
    presencePenalty: z.ZodPrefault<z.ZodNumber>;
    frequencyPenalty: z.ZodPrefault<z.ZodNumber>;
    stopSequences: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    thinkingLevel: z.ZodPrefault<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    thinkingBudget: z.ZodPrefault<z.ZodNumber>;
    reasoningEffort: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        max: "max";
    }>>;
    verbosity: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    continuePrefill: z.ZodPrefault<z.ZodBoolean>;
    mediaResolution: z.ZodPrefault<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    seed: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    contextLimit: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
export declare const DIALECTS: readonly ["tu_do", "openai", "gemini", "anthropic"];
export type Dialect = (typeof DIALECTS)[number];
export type ModelProfile = z.infer<typeof ModelProfileSchema>;
export type GenParams = z.infer<typeof GenParamsSchema>;
export type NormalizedGenParams = z.infer<typeof NormalizedGenParamsSchema>;
