/**
 * Hợp đồng Preset Bridge — Phần 62 [BB].
 *
 * ── Câu đứng trên toàn bộ thư mục này ──
 *
 * **Nhập không phải kích hoạt. Lưu được toàn bộ không có nghĩa là được phép chạy
 * toàn bộ.** Mọi kiểu ở đây được dựng quanh câu đó: `ImportEnvelope` giữ bytes gốc
 * để không mất dữ liệu, `PromptModule.activation` giữ SÁU trạng thái thay vì một
 * cờ boolean, và `PresetActivation` là một bản ghi riêng — nhập một file không
 * chạm tới nó.
 *
 * [BB] 62.3 — prompt ngoài mặc định chỉ nhắm `narrator`. Không module nhập nào
 * vào `updater`, `evolution` hay task ghi state cho tới khi có adapter native
 * khai output schema và có test patch.
 */
import { z } from 'zod';
export declare const PRESET_FORMATS: readonly ["thien_dien_bundle_v1", "sillytavern_openai_preset", "sillytavern_world_info", "unknown_json"];
export type PresetFormat = (typeof PRESET_FORMATS)[number];
export declare const PRESET_PARTS: readonly ["generation", "prompt", "workflow", "lorebook", "registry", "extension"];
export type PresetPart = (typeof PRESET_PARTS)[number];
/**
 * [BB] 62.2 — vỏ nhập BẤT BIẾN.
 *
 * `rawSourceRef` trỏ tới blob nội bộ giữ nguyên bytes. Bốn lý do giữ nó nằm ở
 * đặc tả; lý do thứ tư là lý do thật: **không cần giả vờ phần bị cách ly đã biến
 * mất.** Một importer xóa thứ nó không hiểu là một importer nói dối.
 */
export declare const ImportEnvelopeSchema: z.ZodObject<{
    id: z.ZodString;
    schemaVersion: z.ZodNumber;
    format: z.ZodEnum<{
        thien_dien_bundle_v1: "thien_dien_bundle_v1";
        sillytavern_openai_preset: "sillytavern_openai_preset";
        sillytavern_world_info: "sillytavern_world_info";
        unknown_json: "unknown_json";
    }>;
    sourceName: z.ZodString;
    sourceHash: z.ZodString;
    sourceBytes: z.ZodNumber;
    importedAt: z.ZodNumber;
    namespace: z.ZodString;
    trust: z.ZodPrefault<z.ZodEnum<{
        untrusted: "untrusted";
        reviewed: "reviewed";
        local_trusted: "local_trusted";
    }>>;
    rawSourceRef: z.ZodString;
    detectedParts: z.ZodPrefault<z.ZodArray<z.ZodEnum<{
        workflow: "workflow";
        registry: "registry";
        lorebook: "lorebook";
        generation: "generation";
        prompt: "prompt";
        extension: "extension";
    }>>>;
    warnings: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        severity: z.ZodEnum<{
            error: "error";
            info: "info";
            warning: "warning";
            quarantine: "quarantine";
        }>;
        path: z.ZodPrefault<z.ZodString>;
        message: z.ZodString;
        details: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type ImportEnvelope = z.infer<typeof ImportEnvelopeSchema>;
export declare const MODULE_KINDS: readonly ["slot", "instruction", "style", "character", "world", "memory", "output_contract", "assistant_prefill", "transform_hint", "reasoning_request", "jailbreak_like", "unknown"];
export type ModuleKind = (typeof MODULE_KINDS)[number];
/**
 * Mười hai lane — 62.3.
 *
 * Thứ tự khai báo ở đây LÀ thứ tự lắp ráp: `LANE_ORDER` đọc thẳng từ mảng này,
 * nên không có cách nào để hai chỗ nói hai thứ tự khác nhau.
 */
export declare const MODULE_LANES: readonly ["external_header", "world_before", "character", "scenario", "world_after", "task_instruction", "style", "history_before", "history", "history_after", "output_contract", "prefill"];
export type ModuleLane = (typeof MODULE_LANES)[number];
/** Vị trí của một lane trong prompt đã biên dịch. */
export declare const LANE_ORDER: Readonly<Record<ModuleLane, number>>;
/** Sáu trạng thái tương thích — 64.1 [BB]. */
export declare const ACTIVATION_STATES: readonly ["native", "adapted", "sandboxed", "needs_adapter", "quarantined", "disabled"];
export type ActivationState = (typeof ACTIVATION_STATES)[number];
export declare const TARGET_PIPELINES: readonly ["narrator", "updater", "evolution", "workflow_task"];
export type TargetPipeline = (typeof TARGET_PIPELINES)[number];
export declare const PromptModuleSchema: z.ZodObject<{
    id: z.ZodString;
    packId: z.ZodString;
    sourceIdentifier: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<{
        user: "user";
        system: "system";
        assistant: "assistant";
    }>;
    kind: z.ZodEnum<{
        unknown: "unknown";
        memory: "memory";
        world: "world";
        slot: "slot";
        instruction: "instruction";
        style: "style";
        character: "character";
        output_contract: "output_contract";
        assistant_prefill: "assistant_prefill";
        transform_hint: "transform_hint";
        reasoning_request: "reasoning_request";
        jailbreak_like: "jailbreak_like";
    }>;
    enabled: z.ZodBoolean;
    lane: z.ZodEnum<{
        style: "style";
        character: "character";
        output_contract: "output_contract";
        external_header: "external_header";
        world_before: "world_before";
        scenario: "scenario";
        world_after: "world_after";
        task_instruction: "task_instruction";
        history_before: "history_before";
        history: "history";
        history_after: "history_after";
        prefill: "prefill";
    }>;
    order: z.ZodNumber;
    depth: z.ZodNumber;
    content: z.ZodString;
    macroRefs: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    provides: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    requires: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    conflictKeys: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    activation: z.ZodEnum<{
        native: "native";
        adapted: "adapted";
        sandboxed: "sandboxed";
        needs_adapter: "needs_adapter";
        quarantined: "quarantined";
        disabled: "disabled";
    }>;
    targetPipelines: z.ZodPrefault<z.ZodArray<z.ZodEnum<{
        narrator: "narrator";
        updater: "updater";
        evolution: "evolution";
        workflow_task: "workflow_task";
    }>>>;
    sourceMeta: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type PromptModule = z.infer<typeof PromptModuleSchema>;
/**
 * 62.4 — giữ RAW, chỉ gửi phần model hỗ trợ.
 *
 * [BB] Không hardcode `topK <= 64` ở đây. Fixture A khai `top_k = 500`; nếu schema
 * nhập từ chối nó thì con số thật của người dùng biến mất và không ai biết đã mất
 * gì. Giữ nguyên rồi clamp theo `ModelProfile` là cách duy nhất hiện được diff.
 */
export declare const GenerationCandidateSchema: z.ZodObject<{
    temperature: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    topK: z.ZodOptional<z.ZodNumber>;
    topA: z.ZodOptional<z.ZodNumber>;
    minP: z.ZodOptional<z.ZodNumber>;
    repetitionPenalty: z.ZodOptional<z.ZodNumber>;
    presencePenalty: z.ZodOptional<z.ZodNumber>;
    frequencyPenalty: z.ZodOptional<z.ZodNumber>;
    maxContext: z.ZodOptional<z.ZodNumber>;
    maxOutputTokens: z.ZodOptional<z.ZodNumber>;
    reasoningEffort: z.ZodOptional<z.ZodString>;
    verbosity: z.ZodOptional<z.ZodString>;
    seed: z.ZodOptional<z.ZodNumber>;
    continuePrefill: z.ZodOptional<z.ZodBoolean>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString>>;
    unknown: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$loose>;
export type GenerationCandidate = z.infer<typeof GenerationCandidateSchema>;
/** Một trường tham số đã đi qua profile — nguồn của bảng diff ở màn 6. */
export declare const ThamSoDaChuanSchema: z.ZodObject<{
    truong: z.ZodString;
    raw: z.ZodUnknown;
    dung: z.ZodUnknown;
    trangThai: z.ZodEnum<{
        giu_nguyen: "giu_nguyen";
        bi_gioi_han: "bi_gioi_han";
        khong_ho_tro: "khong_ho_tro";
    }>;
    lyDo: z.ZodPrefault<z.ZodString>;
}, z.core.$strict>;
export type ThamSoDaChuan = z.infer<typeof ThamSoDaChuanSchema>;
export declare const NormalizedPresetPackSchema: z.ZodObject<{
    envelope: z.ZodObject<{
        id: z.ZodString;
        schemaVersion: z.ZodNumber;
        format: z.ZodEnum<{
            thien_dien_bundle_v1: "thien_dien_bundle_v1";
            sillytavern_openai_preset: "sillytavern_openai_preset";
            sillytavern_world_info: "sillytavern_world_info";
            unknown_json: "unknown_json";
        }>;
        sourceName: z.ZodString;
        sourceHash: z.ZodString;
        sourceBytes: z.ZodNumber;
        importedAt: z.ZodNumber;
        namespace: z.ZodString;
        trust: z.ZodPrefault<z.ZodEnum<{
            untrusted: "untrusted";
            reviewed: "reviewed";
            local_trusted: "local_trusted";
        }>>;
        rawSourceRef: z.ZodString;
        detectedParts: z.ZodPrefault<z.ZodArray<z.ZodEnum<{
            workflow: "workflow";
            registry: "registry";
            lorebook: "lorebook";
            generation: "generation";
            prompt: "prompt";
            extension: "extension";
        }>>>;
        warnings: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            severity: z.ZodEnum<{
                error: "error";
                info: "info";
                warning: "warning";
                quarantine: "quarantine";
            }>;
            path: z.ZodPrefault<z.ZodString>;
            message: z.ZodString;
            details: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
    version: z.ZodNumber;
    modules: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        packId: z.ZodString;
        sourceIdentifier: z.ZodString;
        name: z.ZodString;
        role: z.ZodEnum<{
            user: "user";
            system: "system";
            assistant: "assistant";
        }>;
        kind: z.ZodEnum<{
            unknown: "unknown";
            memory: "memory";
            world: "world";
            slot: "slot";
            instruction: "instruction";
            style: "style";
            character: "character";
            output_contract: "output_contract";
            assistant_prefill: "assistant_prefill";
            transform_hint: "transform_hint";
            reasoning_request: "reasoning_request";
            jailbreak_like: "jailbreak_like";
        }>;
        enabled: z.ZodBoolean;
        lane: z.ZodEnum<{
            style: "style";
            character: "character";
            output_contract: "output_contract";
            external_header: "external_header";
            world_before: "world_before";
            scenario: "scenario";
            world_after: "world_after";
            task_instruction: "task_instruction";
            history_before: "history_before";
            history: "history";
            history_after: "history_after";
            prefill: "prefill";
        }>;
        order: z.ZodNumber;
        depth: z.ZodNumber;
        content: z.ZodString;
        macroRefs: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        provides: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        requires: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        conflictKeys: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        activation: z.ZodEnum<{
            native: "native";
            adapted: "adapted";
            sandboxed: "sandboxed";
            needs_adapter: "needs_adapter";
            quarantined: "quarantined";
            disabled: "disabled";
        }>;
        targetPipelines: z.ZodPrefault<z.ZodArray<z.ZodEnum<{
            narrator: "narrator";
            updater: "updater";
            evolution: "evolution";
            workflow_task: "workflow_task";
        }>>>;
        sourceMeta: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strict>>>;
    generation: z.ZodOptional<z.ZodObject<{
        temperature: z.ZodOptional<z.ZodNumber>;
        topP: z.ZodOptional<z.ZodNumber>;
        topK: z.ZodOptional<z.ZodNumber>;
        topA: z.ZodOptional<z.ZodNumber>;
        minP: z.ZodOptional<z.ZodNumber>;
        repetitionPenalty: z.ZodOptional<z.ZodNumber>;
        presencePenalty: z.ZodOptional<z.ZodNumber>;
        frequencyPenalty: z.ZodOptional<z.ZodNumber>;
        maxContext: z.ZodOptional<z.ZodNumber>;
        maxOutputTokens: z.ZodOptional<z.ZodNumber>;
        reasoningEffort: z.ZodOptional<z.ZodString>;
        verbosity: z.ZodOptional<z.ZodString>;
        seed: z.ZodOptional<z.ZodNumber>;
        continuePrefill: z.ZodOptional<z.ZodBoolean>;
        stopSequences: z.ZodOptional<z.ZodArray<z.ZodString>>;
        unknown: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$loose>>;
    variables: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    transforms: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    extensionRefs: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    issues: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        severity: z.ZodEnum<{
            error: "error";
            info: "info";
            warning: "warning";
            quarantine: "quarantine";
        }>;
        path: z.ZodPrefault<z.ZodString>;
        message: z.ZodString;
        details: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type NormalizedPresetPack = z.infer<typeof NormalizedPresetPackSchema>;
export declare const TokenBudgetSchema: z.ZodObject<{
    total: z.ZodNumber;
    used: z.ZodNumber;
    remaining: z.ZodNumber;
}, z.core.$strict>;
export type TokenBudget = z.infer<typeof TokenBudgetSchema>;
export declare const CompiledPromptSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            system: "system";
            assistant: "assistant";
        }>;
        content: z.ZodString;
        moduleId: z.ZodString;
        lane: z.ZodString;
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
    budget: z.ZodObject<{
        total: z.ZodNumber;
        used: z.ZodNumber;
        remaining: z.ZodNumber;
    }, z.core.$strict>;
    omittedModuleIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    unresolvedMacros: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    issues: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        severity: z.ZodEnum<{
            error: "error";
            info: "info";
            warning: "warning";
            quarantine: "quarantine";
        }>;
        path: z.ZodPrefault<z.ZodString>;
        message: z.ZodString;
        details: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strict>>>;
    hash: z.ZodString;
}, z.core.$strict>;
export type CompiledPrompt = z.infer<typeof CompiledPromptSchema>;
/**
 * Regex nguồn sau khi chuẩn hóa. [BB] 64.3 — nó KHÔNG chạy lúc nhập, và khi chạy
 * thì chỉ chạy trên **bản sao output hiển thị**.
 */
export declare const TransformDefSchema: z.ZodObject<{
    id: z.ZodString;
    packId: z.ZodString;
    ten: z.ZodString;
    pattern: z.ZodString;
    co: z.ZodPrefault<z.ZodString>;
    thayThe: z.ZodPrefault<z.ZodString>;
    placement: z.ZodPrefault<z.ZodArray<z.ZodNumber>>;
    runOnEdit: z.ZodPrefault<z.ZodBoolean>;
    trimStrings: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    substituteRegex: z.ZodPrefault<z.ZodNumber>;
    minDepth: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    maxDepth: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    markdownOnlyNguon: z.ZodPrefault<z.ZodBoolean>;
    promptOnlyNguon: z.ZodPrefault<z.ZodBoolean>;
    batONguon: z.ZodPrefault<z.ZodBoolean>;
    thuTuNguon: z.ZodPrefault<z.ZodNumber>;
    activation: z.ZodEnum<{
        native: "native";
        adapted: "adapted";
        sandboxed: "sandboxed";
        needs_adapter: "needs_adapter";
        quarantined: "quarantined";
        disabled: "disabled";
    }>;
    lyDo: z.ZodPrefault<z.ZodString>;
}, z.core.$strict>;
export type TransformDef = z.infer<typeof TransformDefSchema>;
/** 64.2 — script Tavern Helper luôn vào ở `quarantined`. */
export declare const QuarantinedScriptSchema: z.ZodObject<{
    id: z.ZodString;
    packId: z.ZodString;
    ten: z.ZodString;
    hash: z.ZodString;
    soKyTu: z.ZodNumber;
    batONguon: z.ZodPrefault<z.ZodBoolean>;
    lyDo: z.ZodString;
}, z.core.$strict>;
export type QuarantinedScript = z.infer<typeof QuarantinedScriptSchema>;
export declare const SCRIPT_ADAPTER_KINDS: readonly ["cot_cleanup", "prompt_merge", "scene_switch", "choice_ui"];
export type ScriptAdapterKind = (typeof SCRIPT_ADAPTER_KINDS)[number];
/**
 * Bản port khai báo của Tavern Helper script.
 *
 * Không chứa và không chạy JavaScript nguồn. Importer chỉ nhận diện một tập tính
 * năng hữu hạn rồi đưa cấu hình dữ liệu qua runtime native có schema.
 */
export declare const ScriptAdapterDefSchema: z.ZodObject<{
    id: z.ZodString;
    packId: z.ZodString;
    sourceScriptId: z.ZodString;
    ten: z.ZodString;
    kind: z.ZodEnum<{
        cot_cleanup: "cot_cleanup";
        prompt_merge: "prompt_merge";
        scene_switch: "scene_switch";
        choice_ui: "choice_ui";
    }>;
    batONguon: z.ZodPrefault<z.ZodBoolean>;
    config: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    lyDo: z.ZodPrefault<z.ZodString>;
}, z.core.$strict>;
export type ScriptAdapterDef = z.infer<typeof ScriptAdapterDefSchema>;
export declare const ADAPTER_CAPABILITIES: readonly ["read_compiled_output", "render_isolated_panel", "write_preset_variable", "request_user_action"];
export type AdapterCapability = (typeof ADAPTER_CAPABILITIES)[number];
/** 64.2 — muốn hỗ trợ một script thì phải viết adapter, không phải bật nó lên. */
export declare const ExtensionAdapterManifestSchema: z.ZodObject<{
    sourceScriptHash: z.ZodString;
    adapterId: z.ZodString;
    capabilities: z.ZodArray<z.ZodEnum<{
        read_compiled_output: "read_compiled_output";
        render_isolated_panel: "render_isolated_panel";
        write_preset_variable: "write_preset_variable";
        request_user_action: "request_user_action";
    }>>;
    inputSchemaRef: z.ZodString;
    outputSchemaRef: z.ZodString;
    testFixtureIds: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export type ExtensionAdapterManifest = z.infer<typeof ExtensionAdapterManifestSchema>;
export declare const PresetActivationSchema: z.ZodObject<{
    id: z.ZodString;
    packId: z.ZodString;
    packVersion: z.ZodNumber;
    saveId: z.ZodString;
    branchId: z.ZodString;
    targets: z.ZodArray<z.ZodString>;
    selectedModuleIds: z.ZodArray<z.ZodString>;
    normalizedParams: z.ZodOptional<z.ZodPrefault<z.ZodObject<{
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
    }, z.core.$strip>>>;
    conflictResolutions: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    previousActivationId: z.ZodNullable<z.ZodString>;
    activatedAt: z.ZodNumber;
}, z.core.$strict>;
export type PresetActivation = z.infer<typeof PresetActivationSchema>;
/**
 * Bản ghi thư viện: pack đã chuẩn hóa + mọi thứ đi kèm nó.
 *
 * Một hàng ở đây nghĩa là "đã nhập". Chưa có `PresetActivation` nào trỏ tới nó
 * thì nó chưa ảnh hưởng một lượt chơi nào.
 */
export declare const PresetPackRowSchema: z.ZodObject<{
    packId: z.ZodString;
    version: z.ZodNumber;
    pack: z.ZodObject<{
        envelope: z.ZodObject<{
            id: z.ZodString;
            schemaVersion: z.ZodNumber;
            format: z.ZodEnum<{
                thien_dien_bundle_v1: "thien_dien_bundle_v1";
                sillytavern_openai_preset: "sillytavern_openai_preset";
                sillytavern_world_info: "sillytavern_world_info";
                unknown_json: "unknown_json";
            }>;
            sourceName: z.ZodString;
            sourceHash: z.ZodString;
            sourceBytes: z.ZodNumber;
            importedAt: z.ZodNumber;
            namespace: z.ZodString;
            trust: z.ZodPrefault<z.ZodEnum<{
                untrusted: "untrusted";
                reviewed: "reviewed";
                local_trusted: "local_trusted";
            }>>;
            rawSourceRef: z.ZodString;
            detectedParts: z.ZodPrefault<z.ZodArray<z.ZodEnum<{
                workflow: "workflow";
                registry: "registry";
                lorebook: "lorebook";
                generation: "generation";
                prompt: "prompt";
                extension: "extension";
            }>>>;
            warnings: z.ZodPrefault<z.ZodArray<z.ZodObject<{
                code: z.ZodString;
                severity: z.ZodEnum<{
                    error: "error";
                    info: "info";
                    warning: "warning";
                    quarantine: "quarantine";
                }>;
                path: z.ZodPrefault<z.ZodString>;
                message: z.ZodString;
                details: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>;
        version: z.ZodNumber;
        modules: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            packId: z.ZodString;
            sourceIdentifier: z.ZodString;
            name: z.ZodString;
            role: z.ZodEnum<{
                user: "user";
                system: "system";
                assistant: "assistant";
            }>;
            kind: z.ZodEnum<{
                unknown: "unknown";
                memory: "memory";
                world: "world";
                slot: "slot";
                instruction: "instruction";
                style: "style";
                character: "character";
                output_contract: "output_contract";
                assistant_prefill: "assistant_prefill";
                transform_hint: "transform_hint";
                reasoning_request: "reasoning_request";
                jailbreak_like: "jailbreak_like";
            }>;
            enabled: z.ZodBoolean;
            lane: z.ZodEnum<{
                style: "style";
                character: "character";
                output_contract: "output_contract";
                external_header: "external_header";
                world_before: "world_before";
                scenario: "scenario";
                world_after: "world_after";
                task_instruction: "task_instruction";
                history_before: "history_before";
                history: "history";
                history_after: "history_after";
                prefill: "prefill";
            }>;
            order: z.ZodNumber;
            depth: z.ZodNumber;
            content: z.ZodString;
            macroRefs: z.ZodPrefault<z.ZodArray<z.ZodString>>;
            provides: z.ZodPrefault<z.ZodArray<z.ZodString>>;
            requires: z.ZodPrefault<z.ZodArray<z.ZodString>>;
            conflictKeys: z.ZodPrefault<z.ZodArray<z.ZodString>>;
            activation: z.ZodEnum<{
                native: "native";
                adapted: "adapted";
                sandboxed: "sandboxed";
                needs_adapter: "needs_adapter";
                quarantined: "quarantined";
                disabled: "disabled";
            }>;
            targetPipelines: z.ZodPrefault<z.ZodArray<z.ZodEnum<{
                narrator: "narrator";
                updater: "updater";
                evolution: "evolution";
                workflow_task: "workflow_task";
            }>>>;
            sourceMeta: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$strict>>>;
        generation: z.ZodOptional<z.ZodObject<{
            temperature: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            topK: z.ZodOptional<z.ZodNumber>;
            topA: z.ZodOptional<z.ZodNumber>;
            minP: z.ZodOptional<z.ZodNumber>;
            repetitionPenalty: z.ZodOptional<z.ZodNumber>;
            presencePenalty: z.ZodOptional<z.ZodNumber>;
            frequencyPenalty: z.ZodOptional<z.ZodNumber>;
            maxContext: z.ZodOptional<z.ZodNumber>;
            maxOutputTokens: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodString>;
            verbosity: z.ZodOptional<z.ZodString>;
            seed: z.ZodOptional<z.ZodNumber>;
            continuePrefill: z.ZodOptional<z.ZodBoolean>;
            stopSequences: z.ZodOptional<z.ZodArray<z.ZodString>>;
            unknown: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$loose>>;
        variables: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        transforms: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        extensionRefs: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        issues: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            severity: z.ZodEnum<{
                error: "error";
                info: "info";
                warning: "warning";
                quarantine: "quarantine";
            }>;
            path: z.ZodPrefault<z.ZodString>;
            message: z.ZodString;
            details: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
    transformDefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        packId: z.ZodString;
        ten: z.ZodString;
        pattern: z.ZodString;
        co: z.ZodPrefault<z.ZodString>;
        thayThe: z.ZodPrefault<z.ZodString>;
        placement: z.ZodPrefault<z.ZodArray<z.ZodNumber>>;
        runOnEdit: z.ZodPrefault<z.ZodBoolean>;
        trimStrings: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        substituteRegex: z.ZodPrefault<z.ZodNumber>;
        minDepth: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        maxDepth: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        markdownOnlyNguon: z.ZodPrefault<z.ZodBoolean>;
        promptOnlyNguon: z.ZodPrefault<z.ZodBoolean>;
        batONguon: z.ZodPrefault<z.ZodBoolean>;
        thuTuNguon: z.ZodPrefault<z.ZodNumber>;
        activation: z.ZodEnum<{
            native: "native";
            adapted: "adapted";
            sandboxed: "sandboxed";
            needs_adapter: "needs_adapter";
            quarantined: "quarantined";
            disabled: "disabled";
        }>;
        lyDo: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>>>;
    quarantined: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        packId: z.ZodString;
        ten: z.ZodString;
        hash: z.ZodString;
        soKyTu: z.ZodNumber;
        batONguon: z.ZodPrefault<z.ZodBoolean>;
        lyDo: z.ZodString;
    }, z.core.$strict>>>;
    scriptAdapters: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        packId: z.ZodString;
        sourceScriptId: z.ZodString;
        ten: z.ZodString;
        kind: z.ZodEnum<{
            cot_cleanup: "cot_cleanup";
            prompt_merge: "prompt_merge";
            scene_switch: "scene_switch";
            choice_ui: "choice_ui";
        }>;
        batONguon: z.ZodPrefault<z.ZodBoolean>;
        config: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        lyDo: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>>>;
    thamSo: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        truong: z.ZodString;
        raw: z.ZodUnknown;
        dung: z.ZodUnknown;
        trangThai: z.ZodEnum<{
            giu_nguyen: "giu_nguyen";
            bi_gioi_han: "bi_gioi_han";
            khong_ho_tro: "khong_ho_tro";
        }>;
        lyDo: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type PresetPackRow = z.infer<typeof PresetPackRowSchema>;
/** Blob nguồn bất biến, khóa theo hash. */
export type RawSourceRow = {
    /** `sha256:<HEX>` — cũng chính là `envelope.rawSourceRef`. */
    ref: string;
    sourceName: string;
    bytes: number;
    /** Văn bản gốc, KHÔNG chuẩn hóa, KHÔNG cắt. */
    noiDung: string;
};
