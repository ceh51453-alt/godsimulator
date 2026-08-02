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
import { ImportIssueSchema } from '../contracts/primitives.js';
import { NormalizedGenParamsSchema } from '../schema/ai.js';

// ─────────────────────────────────────────── vỏ nhập

export const PRESET_FORMATS = [
  'thien_dien_bundle_v1',
  'sillytavern_openai_preset',
  'sillytavern_world_info',
  'unknown_json',
] as const;
export type PresetFormat = (typeof PRESET_FORMATS)[number];

export const PRESET_PARTS = [
  'generation',
  'prompt',
  'workflow',
  'lorebook',
  'registry',
  'extension',
] as const;
export type PresetPart = (typeof PRESET_PARTS)[number];

/**
 * [BB] 62.2 — vỏ nhập BẤT BIẾN.
 *
 * `rawSourceRef` trỏ tới blob nội bộ giữ nguyên bytes. Bốn lý do giữ nó nằm ở
 * đặc tả; lý do thứ tư là lý do thật: **không cần giả vờ phần bị cách ly đã biến
 * mất.** Một importer xóa thứ nó không hiểu là một importer nói dối.
 */
export const ImportEnvelopeSchema = z
  .object({
    id: z.string(),
    schemaVersion: z.number().int(),
    format: z.enum(PRESET_FORMATS),
    sourceName: z.string(),
    sourceHash: z.string(),
    sourceBytes: z.number().int(),
    /** Nhịp thế giới lúc nhập — [BB] `core/` không đọc đồng hồ máy. */
    importedAt: z.number().int(),
    namespace: z.string(),
    trust: z.enum(['untrusted', 'reviewed', 'local_trusted']).prefault('untrusted'),
    rawSourceRef: z.string(),
    detectedParts: z.array(z.enum(PRESET_PARTS)).prefault([]),
    warnings: z.array(ImportIssueSchema).prefault([]),
  })
  .strict();

export type ImportEnvelope = z.infer<typeof ImportEnvelopeSchema>;

// ─────────────────────────────────────────── prompt module

export const MODULE_KINDS = [
  'slot',
  'instruction',
  'style',
  'character',
  'world',
  'memory',
  'output_contract',
  'assistant_prefill',
  'transform_hint',
  'reasoning_request',
  'jailbreak_like',
  'unknown',
] as const;
export type ModuleKind = (typeof MODULE_KINDS)[number];

/**
 * Mười hai lane — 62.3.
 *
 * Thứ tự khai báo ở đây LÀ thứ tự lắp ráp: `LANE_ORDER` đọc thẳng từ mảng này,
 * nên không có cách nào để hai chỗ nói hai thứ tự khác nhau.
 */
export const MODULE_LANES = [
  'external_header',
  'world_before',
  'character',
  'scenario',
  'world_after',
  'task_instruction',
  'style',
  'history_before',
  'history',
  'history_after',
  'output_contract',
  'prefill',
] as const;
export type ModuleLane = (typeof MODULE_LANES)[number];

/** Vị trí của một lane trong prompt đã biên dịch. */
export const LANE_ORDER: Readonly<Record<ModuleLane, number>> = Object.freeze(
  Object.fromEntries(MODULE_LANES.map((l, i) => [l, i])) as Record<ModuleLane, number>,
);

/** Sáu trạng thái tương thích — 64.1 [BB]. */
export const ACTIVATION_STATES = [
  'native',
  'adapted',
  'sandboxed',
  'needs_adapter',
  'quarantined',
  'disabled',
] as const;
export type ActivationState = (typeof ACTIVATION_STATES)[number];

export const TARGET_PIPELINES = ['narrator', 'updater', 'evolution', 'workflow_task'] as const;
export type TargetPipeline = (typeof TARGET_PIPELINES)[number];

export const PromptModuleSchema = z
  .object({
    id: z.string(),
    packId: z.string(),
    sourceIdentifier: z.string(),
    name: z.string(),
    role: z.enum(['system', 'user', 'assistant']),
    kind: z.enum(MODULE_KINDS),
    enabled: z.boolean(),
    lane: z.enum(MODULE_LANES),
    order: z.number().int(),
    depth: z.number().int().min(0),
    content: z.string(),
    macroRefs: z.array(z.string()).prefault([]),
    provides: z.array(z.string()).prefault([]),
    requires: z.array(z.string()).prefault([]),
    conflictKeys: z.array(z.string()).prefault([]),
    activation: z.enum(ACTIVATION_STATES),
    /** [BB] 62.3 — mặc định CHỈ `narrator`. */
    targetPipelines: z.array(z.enum(TARGET_PIPELINES)).prefault(['narrator']),
    sourceMeta: z.record(z.string(), z.unknown()).prefault({}),
  })
  .strict();

export type PromptModule = z.infer<typeof PromptModuleSchema>;

// ─────────────────────────────────────────── tham số sinh

/**
 * 62.4 — giữ RAW, chỉ gửi phần model hỗ trợ.
 *
 * [BB] Không hardcode `topK <= 64` ở đây. Fixture A khai `top_k = 500`; nếu schema
 * nhập từ chối nó thì con số thật của người dùng biến mất và không ai biết đã mất
 * gì. Giữ nguyên rồi clamp theo `ModelProfile` là cách duy nhất hiện được diff.
 */
export const GenerationCandidateSchema = z.looseObject({
  temperature: z.number().optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
  topA: z.number().optional(),
  minP: z.number().optional(),
  repetitionPenalty: z.number().optional(),
  presencePenalty: z.number().optional(),
  frequencyPenalty: z.number().optional(),
  maxContext: z.number().int().optional(),
  maxOutputTokens: z.number().int().optional(),
  reasoningEffort: z.string().optional(),
  verbosity: z.string().optional(),
  seed: z.number().int().optional(),
  continuePrefill: z.boolean().optional(),
  stopSequences: z.array(z.string()).optional(),
  unknown: z.record(z.string(), z.unknown()).prefault({}),
});

export type GenerationCandidate = z.infer<typeof GenerationCandidateSchema>;

/** Một trường tham số đã đi qua profile — nguồn của bảng diff ở màn 6. */
export const ThamSoDaChuanSchema = z
  .object({
    truong: z.string(),
    raw: z.unknown(),
    dung: z.unknown(),
    trangThai: z.enum(['giu_nguyen', 'bi_gioi_han', 'khong_ho_tro']),
    lyDo: z.string().prefault(''),
  })
  .strict();

export type ThamSoDaChuan = z.infer<typeof ThamSoDaChuanSchema>;

// ─────────────────────────────────────────── pack đã chuẩn hóa

export const NormalizedPresetPackSchema = z
  .object({
    envelope: ImportEnvelopeSchema,
    version: z.number().int().min(1),
    modules: z.array(PromptModuleSchema).prefault([]),
    generation: GenerationCandidateSchema.optional(),
    variables: z.record(z.string(), z.unknown()).prefault({}),
    /** Id transform đã chuẩn hóa — bản thân regex nằm ở `transformDefs`. */
    transforms: z.array(z.string()).prefault([]),
    /** raw / quarantine / adapter refs. */
    extensionRefs: z.array(z.string()).prefault([]),
    issues: z.array(ImportIssueSchema).prefault([]),
  })
  .strict();

export type NormalizedPresetPack = z.infer<typeof NormalizedPresetPackSchema>;

// ─────────────────────────────────────────── biên dịch

export const TokenBudgetSchema = z
  .object({
    total: z.number().int().min(0),
    used: z.number().int().min(0),
    remaining: z.number().int().min(0),
  })
  .strict();

export type TokenBudget = z.infer<typeof TokenBudgetSchema>;

export const CompiledPromptSchema = z
  .object({
    messages: z.array(
      z
        .object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
          moduleId: z.string(),
          lane: z.string(),
        })
        .strict(),
    ),
    params: NormalizedGenParamsSchema,
    budget: TokenBudgetSchema,
    omittedModuleIds: z.array(z.string()).prefault([]),
    unresolvedMacros: z.array(z.string()).prefault([]),
    issues: z.array(ImportIssueSchema).prefault([]),
    hash: z.string(),
  })
  .strict();

export type CompiledPrompt = z.infer<typeof CompiledPromptSchema>;

// ─────────────────────────────────────────── transform và script

/**
 * Regex nguồn sau khi chuẩn hóa. [BB] 64.3 — nó KHÔNG chạy lúc nhập, và khi chạy
 * thì chỉ chạy trên **bản sao output hiển thị**.
 */
export const TransformDefSchema = z
  .object({
    id: z.string(),
    packId: z.string(),
    ten: z.string(),
    /** Chuỗi pattern nguồn, giữ nguyên để round-trip. */
    pattern: z.string(),
    co: z.string().prefault(''),
    thayThe: z.string().prefault(''),
    /** [BB] 64.3 — `promptOnly` KHÔNG được giữ semantics tự động. */
    promptOnlyNguon: z.boolean().prefault(false),
    activation: z.enum(ACTIVATION_STATES),
    lyDo: z.string().prefault(''),
  })
  .strict();

export type TransformDef = z.infer<typeof TransformDefSchema>;

/** 64.2 — script Tavern Helper luôn vào ở `quarantined`. */
export const QuarantinedScriptSchema = z
  .object({
    id: z.string(),
    packId: z.string(),
    ten: z.string(),
    hash: z.string(),
    soKyTu: z.number().int().min(0),
    /** Cờ `enabled` trong FILE NGUỒN — ghi lại, và cố ý không dùng tới. */
    batONguon: z.boolean().prefault(false),
    lyDo: z.string(),
  })
  .strict();

export type QuarantinedScript = z.infer<typeof QuarantinedScriptSchema>;

export const ADAPTER_CAPABILITIES = [
  'read_compiled_output',
  'render_isolated_panel',
  'write_preset_variable',
  'request_user_action',
] as const;
export type AdapterCapability = (typeof ADAPTER_CAPABILITIES)[number];

/** 64.2 — muốn hỗ trợ một script thì phải viết adapter, không phải bật nó lên. */
export const ExtensionAdapterManifestSchema = z
  .object({
    sourceScriptHash: z.string(),
    adapterId: z.string(),
    capabilities: z.array(z.enum(ADAPTER_CAPABILITIES)),
    inputSchemaRef: z.string(),
    outputSchemaRef: z.string(),
    testFixtureIds: z.array(z.string()),
  })
  .strict();

export type ExtensionAdapterManifest = z.infer<typeof ExtensionAdapterManifestSchema>;

// ─────────────────────────────────────────── kích hoạt

export const PresetActivationSchema = z
  .object({
    id: z.string(),
    packId: z.string(),
    packVersion: z.number().int(),
    saveId: z.string(),
    branchId: z.string(),
    targets: z.array(z.string()),
    selectedModuleIds: z.array(z.string()),
    normalizedParams: NormalizedGenParamsSchema.optional(),
    conflictResolutions: z.record(z.string(), z.unknown()),
    previousActivationId: z.string().nullable(),
    activatedAt: z.number().int(),
  })
  .strict();

export type PresetActivation = z.infer<typeof PresetActivationSchema>;

/**
 * Bản ghi thư viện: pack đã chuẩn hóa + mọi thứ đi kèm nó.
 *
 * Một hàng ở đây nghĩa là "đã nhập". Chưa có `PresetActivation` nào trỏ tới nó
 * thì nó chưa ảnh hưởng một lượt chơi nào.
 */
export const PresetPackRowSchema = z
  .object({
    packId: z.string(),
    version: z.number().int().min(1),
    pack: NormalizedPresetPackSchema,
    transformDefs: z.array(TransformDefSchema).prefault([]),
    quarantined: z.array(QuarantinedScriptSchema).prefault([]),
    thamSo: z.array(ThamSoDaChuanSchema).prefault([]),
  })
  .strict();

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
