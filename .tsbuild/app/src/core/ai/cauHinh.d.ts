/**
 * Cấu hình AI — Phần 31.1, 31.2, 46.1 [BB].
 *
 * ── Vì sao file này nằm ở `core/` mà không gọi mạng ──
 *
 * `core/` là TypeScript thuần: không `fetch`, không React, không Dexie (luật bất
 * biến #3). Nên hợp đồng cấu hình, phép kiểm hợp lệ và **quyết định cho chơi hay
 * không** nằm ở đây; phần thật sự nhấc điện thoại lên nằm ở `src/ai/`.
 *
 * ── Điều đã đổi so với đặc tả gốc ──
 *
 * Đặc tả v3.1 (46.2, cổng Phase 8) cho phép chơi khi endpoint chết: `chi_engine`
 * là "chế độ chơi hợp lệ". Dự án này chọn khác — **không có AI thì không chơi**
 * (ADR-0028), và Phase 12 đóng nốt lối cuối cùng: `chi_engine` bị **gỡ khỏi
 * schema** (ADR-0056). Cấu hình cũ có chuỗi ấy vẫn đọc được — `.catch()` kéo nó
 * về `gop_vao_narrator` — nhưng không còn cách nào chọn lại nó.
 *
 * Điểm cuối *Tường Thuật* không có chế độ tắt, và `congCoMo()` trả `false` khi
 * nó chưa thông.
 */
import { z } from 'zod';
/** Một model mà proxy khai là dùng được — kết quả của lần quét gần nhất. */
export declare const ModelInfoSchema: z.ZodObject<{
    id: z.ZodString;
    ten: z.ZodPrefault<z.ZodString>;
    nhomNhaCungCap: z.ZodPrefault<z.ZodString>;
    contextMax: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strict>;
/**
 * Kết quả thăm dò một điểm cuối.
 *
 * [BB] Không dùng thời gian máy trong `core/`. `tickDo` là **nhịp thế giới** lúc
 * đo, không phải đồng hồ — nhờ vậy hồ sơ này replay được và không mục theo giờ.
 */
export declare const ProbeResultSchema: z.ZodPrefault<z.ZodObject<{
    daDo: z.ZodPrefault<z.ZodBoolean>;
    thong: z.ZodPrefault<z.ZodBoolean>;
    maLoi: z.ZodPrefault<z.ZodString>;
    thongDiep: z.ZodPrefault<z.ZodString>;
    modelDaTraLoi: z.ZodPrefault<z.ZodString>;
    soKyTuTraVe: z.ZodPrefault<z.ZodNumber>;
    tickDo: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    xuatCoCauTruc: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>>;
export declare const AiEndpointSchema: z.ZodPrefault<z.ZodObject<{
    label: z.ZodPrefault<z.ZodString>;
    proxyUrl: z.ZodPrefault<z.ZodString>;
    proxyPassword: z.ZodPrefault<z.ZodString>;
    dialect: z.ZodPrefault<z.ZodEnum<{
        tu_do: "tu_do";
        openai: "openai";
        gemini: "gemini";
        anthropic: "anthropic";
    }>>;
    modelId: z.ZodPrefault<z.ZodString>;
    profileId: z.ZodPrefault<z.ZodString>;
    availableModels: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        ten: z.ZodPrefault<z.ZodString>;
        nhomNhaCungCap: z.ZodPrefault<z.ZodString>;
        contextMax: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>>;
    lastScanAt: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    probe: z.ZodPrefault<z.ZodObject<{
        daDo: z.ZodPrefault<z.ZodBoolean>;
        thong: z.ZodPrefault<z.ZodBoolean>;
        maLoi: z.ZodPrefault<z.ZodString>;
        thongDiep: z.ZodPrefault<z.ZodString>;
        modelDaTraLoi: z.ZodPrefault<z.ZodString>;
        soKyTuTraVe: z.ZodPrefault<z.ZodNumber>;
        tickDo: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        xuatCoCauTruc: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    params: z.ZodPrefault<z.ZodObject<{
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
}, z.core.$strict>>;
/**
 * 46.2 — Cập Nhật Biến tắt được; Tường Thuật thì không.
 *
 * [BB] ADR-0056 — `cheDoKhiTat` chỉ còn MỘT giá trị. Tắt điểm cuối riêng nghĩa là
 * khối `<CapNhat>` đi kèm lời kể của Narrator, không nghĩa là thế giới tự chạy
 * bằng engine. `.catch()` giữ cấu hình cũ đọc được thay vì làm hỏng cả file.
 */
export declare const UpdaterEndpointSchema: z.ZodPrefault<z.ZodObject<{
    label: z.ZodPrefault<z.ZodString>;
    proxyUrl: z.ZodPrefault<z.ZodString>;
    proxyPassword: z.ZodPrefault<z.ZodString>;
    dialect: z.ZodPrefault<z.ZodEnum<{
        tu_do: "tu_do";
        openai: "openai";
        gemini: "gemini";
        anthropic: "anthropic";
    }>>;
    modelId: z.ZodPrefault<z.ZodString>;
    profileId: z.ZodPrefault<z.ZodString>;
    availableModels: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        ten: z.ZodPrefault<z.ZodString>;
        nhomNhaCungCap: z.ZodPrefault<z.ZodString>;
        contextMax: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>>;
    lastScanAt: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    probe: z.ZodPrefault<z.ZodObject<{
        daDo: z.ZodPrefault<z.ZodBoolean>;
        thong: z.ZodPrefault<z.ZodBoolean>;
        maLoi: z.ZodPrefault<z.ZodString>;
        thongDiep: z.ZodPrefault<z.ZodString>;
        modelDaTraLoi: z.ZodPrefault<z.ZodString>;
        soKyTuTraVe: z.ZodPrefault<z.ZodNumber>;
        tickDo: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        xuatCoCauTruc: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    params: z.ZodPrefault<z.ZodObject<{
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
    batRieng: z.ZodPrefault<z.ZodBoolean>;
    cheDoKhiTat: z.ZodPrefault<z.ZodCatch<z.ZodEnum<{
        gop_vao_narrator: "gop_vao_narrator";
    }>>>;
}, z.core.$strict>>;
/** 46.1 — Diễn Hóa: chạy nhiều lượt tự động cho thế giới tiến hóa. */
export declare const WorkflowEndpointSchema: z.ZodPrefault<z.ZodObject<{
    label: z.ZodPrefault<z.ZodString>;
    proxyUrl: z.ZodPrefault<z.ZodString>;
    proxyPassword: z.ZodPrefault<z.ZodString>;
    dialect: z.ZodPrefault<z.ZodEnum<{
        tu_do: "tu_do";
        openai: "openai";
        gemini: "gemini";
        anthropic: "anthropic";
    }>>;
    modelId: z.ZodPrefault<z.ZodString>;
    profileId: z.ZodPrefault<z.ZodString>;
    availableModels: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        ten: z.ZodPrefault<z.ZodString>;
        nhomNhaCungCap: z.ZodPrefault<z.ZodString>;
        contextMax: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>>;
    lastScanAt: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    probe: z.ZodPrefault<z.ZodObject<{
        daDo: z.ZodPrefault<z.ZodBoolean>;
        thong: z.ZodPrefault<z.ZodBoolean>;
        maLoi: z.ZodPrefault<z.ZodString>;
        thongDiep: z.ZodPrefault<z.ZodString>;
        modelDaTraLoi: z.ZodPrefault<z.ZodString>;
        soKyTuTraVe: z.ZodPrefault<z.ZodNumber>;
        tickDo: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        xuatCoCauTruc: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    params: z.ZodPrefault<z.ZodObject<{
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
    batRieng: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>>;
export declare const AiConfigSchema: z.ZodPrefault<z.ZodObject<{
    narrator: z.ZodPrefault<z.ZodObject<{
        label: z.ZodPrefault<z.ZodString>;
        proxyUrl: z.ZodPrefault<z.ZodString>;
        proxyPassword: z.ZodPrefault<z.ZodString>;
        dialect: z.ZodPrefault<z.ZodEnum<{
            tu_do: "tu_do";
            openai: "openai";
            gemini: "gemini";
            anthropic: "anthropic";
        }>>;
        modelId: z.ZodPrefault<z.ZodString>;
        profileId: z.ZodPrefault<z.ZodString>;
        availableModels: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ten: z.ZodPrefault<z.ZodString>;
            nhomNhaCungCap: z.ZodPrefault<z.ZodString>;
            contextMax: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strict>>>;
        lastScanAt: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        probe: z.ZodPrefault<z.ZodObject<{
            daDo: z.ZodPrefault<z.ZodBoolean>;
            thong: z.ZodPrefault<z.ZodBoolean>;
            maLoi: z.ZodPrefault<z.ZodString>;
            thongDiep: z.ZodPrefault<z.ZodString>;
            modelDaTraLoi: z.ZodPrefault<z.ZodString>;
            soKyTuTraVe: z.ZodPrefault<z.ZodNumber>;
            tickDo: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
            xuatCoCauTruc: z.ZodPrefault<z.ZodBoolean>;
        }, z.core.$strict>>;
        params: z.ZodPrefault<z.ZodObject<{
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
    }, z.core.$strict>>;
    updater: z.ZodPrefault<z.ZodObject<{
        label: z.ZodPrefault<z.ZodString>;
        proxyUrl: z.ZodPrefault<z.ZodString>;
        proxyPassword: z.ZodPrefault<z.ZodString>;
        dialect: z.ZodPrefault<z.ZodEnum<{
            tu_do: "tu_do";
            openai: "openai";
            gemini: "gemini";
            anthropic: "anthropic";
        }>>;
        modelId: z.ZodPrefault<z.ZodString>;
        profileId: z.ZodPrefault<z.ZodString>;
        availableModels: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ten: z.ZodPrefault<z.ZodString>;
            nhomNhaCungCap: z.ZodPrefault<z.ZodString>;
            contextMax: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strict>>>;
        lastScanAt: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        probe: z.ZodPrefault<z.ZodObject<{
            daDo: z.ZodPrefault<z.ZodBoolean>;
            thong: z.ZodPrefault<z.ZodBoolean>;
            maLoi: z.ZodPrefault<z.ZodString>;
            thongDiep: z.ZodPrefault<z.ZodString>;
            modelDaTraLoi: z.ZodPrefault<z.ZodString>;
            soKyTuTraVe: z.ZodPrefault<z.ZodNumber>;
            tickDo: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
            xuatCoCauTruc: z.ZodPrefault<z.ZodBoolean>;
        }, z.core.$strict>>;
        params: z.ZodPrefault<z.ZodObject<{
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
        batRieng: z.ZodPrefault<z.ZodBoolean>;
        cheDoKhiTat: z.ZodPrefault<z.ZodCatch<z.ZodEnum<{
            gop_vao_narrator: "gop_vao_narrator";
        }>>>;
    }, z.core.$strict>>;
    workflow: z.ZodPrefault<z.ZodObject<{
        label: z.ZodPrefault<z.ZodString>;
        proxyUrl: z.ZodPrefault<z.ZodString>;
        proxyPassword: z.ZodPrefault<z.ZodString>;
        dialect: z.ZodPrefault<z.ZodEnum<{
            tu_do: "tu_do";
            openai: "openai";
            gemini: "gemini";
            anthropic: "anthropic";
        }>>;
        modelId: z.ZodPrefault<z.ZodString>;
        profileId: z.ZodPrefault<z.ZodString>;
        availableModels: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ten: z.ZodPrefault<z.ZodString>;
            nhomNhaCungCap: z.ZodPrefault<z.ZodString>;
            contextMax: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strict>>>;
        lastScanAt: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        probe: z.ZodPrefault<z.ZodObject<{
            daDo: z.ZodPrefault<z.ZodBoolean>;
            thong: z.ZodPrefault<z.ZodBoolean>;
            maLoi: z.ZodPrefault<z.ZodString>;
            thongDiep: z.ZodPrefault<z.ZodString>;
            modelDaTraLoi: z.ZodPrefault<z.ZodString>;
            soKyTuTraVe: z.ZodPrefault<z.ZodNumber>;
            tickDo: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
            xuatCoCauTruc: z.ZodPrefault<z.ZodBoolean>;
        }, z.core.$strict>>;
        params: z.ZodPrefault<z.ZodObject<{
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
        batRieng: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    rerank: z.ZodPrefault<z.ZodObject<{
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
}, z.core.$strict>>;
export type ModelInfo = z.infer<typeof ModelInfoSchema>;
export type ProbeResult = z.infer<typeof ProbeResultSchema>;
export type AiEndpoint = z.infer<typeof AiEndpointSchema>;
export type UpdaterEndpoint = z.infer<typeof UpdaterEndpointSchema>;
export type WorkflowEndpoint = z.infer<typeof WorkflowEndpointSchema>;
export type AiConfig = z.infer<typeof AiConfigSchema>;
export declare const CAU_HINH_AI_RONG: AiConfig;
export type ThieuSot = {
    /** Trường nào thiếu — UI dùng để nhảy con trỏ tới đúng ô. */
    readonly truong: 'proxyUrl' | 'modelId' | 'probe' | 'dialect';
    readonly thongDiep: string;
};
/**
 * Điểm cuối này còn thiếu gì trước khi dùng được.
 *
 * Trả về **danh sách**, không phải boolean: người chơi cần biết thiếu cái nào,
 * không cần biết "cấu hình sai". Một thông báo chung chung ở đây là cùng loại
 * lỗi với "không hiểu" ở ô nhập tự do (cổng Phase 4).
 */
export declare function thieuGiOEndpoint(ep: AiEndpoint): ThieuSot[];
/**
 * [BB] ADR-0028 — cửa vào của cả trò chơi.
 *
 * Chỉ điểm cuối **Tường Thuật** quyết định được chơi hay không. Cập Nhật Biến và
 * Diễn Hóa tắt được, vì thiếu chúng thì thế giới vẫn kể được, chỉ là kể xong
 * không tác động ngược.
 */
export declare function thieuGiDeChoi(cfg: AiConfig): ThieuSot[];
export declare function congCoMo(cfg: AiConfig): boolean;
/**
 * Bản cấu hình đã cắt mật khẩu — dùng cho log, chẩn đoán và mọi chỗ hiển thị.
 * Chưa từng có ai cố ý in mật khẩu ra; người ta chỉ in nguyên object.
 */
export declare function cheMatKhau(cfg: AiConfig): AiConfig;
/** Sao cấu hình sang điểm cuối khác — 46.3, giữ nguyên mật khẩu riêng nếu đã có. */
export declare function saoCauHinh(tu: AiEndpoint, den: AiEndpoint): AiEndpoint;
