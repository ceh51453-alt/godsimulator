/**
 * Ý định tự do — Phần 67, 68 [BB].
 *
 * "Sáu động từ là phép toán bản thể của Sáng Thế Thần, KHÔNG phải toàn bộ từ vựng
 *  hành động của game. `R.action` là tập mồi dựng sẵn, KHÔNG phải allowlist."
 *
 * [BB] 67.5 — `failure` không được là "hệ thống không hiểu". Nó phải nêu nguyên
 * nhân TRONG THẾ GIỚI.
 */
import { z } from 'zod';
import {
  EntityRefSchema,
  BlockReasonSchema,
  ExprNodeSchema,
  PatchTemplateSchema,
  ViewModeSchema,
} from '../contracts/primitives.js';

export const HORIZON = ['immediate', 'scene', 'day', 'season', 'year', 'era'] as const;
export type Horizon = (typeof HORIZON)[number];

export const IntentSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    sceneId: z.string().nullable(),
    actorId: z.string(),
    mode: ViewModeSchema,
    /** [BB] Bất biến. Parser được phép hiểu sai; câu gốc thì không được đổi. */
    rawText: z.string(),
    goal: z.string(),
    targetRefs: z.array(EntityRefSchema).prefault([]),
    method: z.string().prefault(''),
    constraints: z.array(z.string()).prefault([]),
    horizon: z.enum(HORIZON).prefault('scene'),
    stance: z
      .object({
        secrecy: z.enum(['open', 'discreet', 'secret']).prefault('open'),
        risk: z.enum(['avoid', 'accept', 'embrace']).prefault('accept'),
        harm: z.enum(['avoid', 'minimize', 'allow']).prefault('minimize'),
      })
      .prefault({}),
    parsedBy: z.enum(['rule', 'model', 'user_corrected']),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export const NGUON_TRI_THUC = [
  'witness',
  'told',
  'rumor',
  'text',
  'ritual',
  'oracle',
  'divine_sense',
  'inference',
  'memory',
  'unknown',
] as const;

/**
 * [BB] 67.3 — "Không resolver nào được dùng World thật để lập kế hoạch cho chủ thể."
 * Thần cũng có KnowledgeRecord. Domain cho cảm nhận tốt hơn, KHÔNG cho toàn tri.
 */
export const KnowledgeRecordSchema = z
  .object({
    factId: z.string(),
    knowerId: z.string(),
    proposition: z.string(),
    objectRefs: z.array(EntityRefSchema).prefault([]),
    source: z
      .object({
        type: z.enum(NGUON_TRI_THUC),
        sourceId: z.string().nullable(),
        hops: z.number().int().min(0).prefault(0),
      })
      .strict(),
    confidence: z.number().min(0).max(1),
    distortion: z.record(z.string(), z.unknown()).prefault({}),
    learnedAtTick: z.number().int(),
    lastConfirmedAtTick: z.number().int().nullable(),
    contradictedBy: z.array(z.string()).prefault([]),
  })
  .strict();

export const ActionPlanSchema = z
  .object({
    id: z.string(),
    intentId: z.string(),
    actorId: z.string(),
    steps: z
      .array(
        z
          .object({
            id: z.string(),
            actionRef: z.string(),
            targetRefs: z.array(EntityRefSchema).prefault([]),
            preconditions: z.array(ExprNodeSchema).prefault([]),
            expectedEffects: z.array(PatchTemplateSchema).prefault([]),
            duration: z.number().min(0),
            interruptible: z.boolean().prefault(true),
          })
          .strict(),
      )
      .max(20)
      .prefault([]),
    /** Điều chủ thể KHÔNG biết — nguồn của `partial` và của Project. */
    unknowns: z.array(z.string()).prefault([]),
    blockedBy: z.array(BlockReasonSchema).prefault([]),
    alternatives: z.array(z.string()).prefault([]),
    /** [BB] Hành động không thể hoàn tác phải hỏi trước. */
    requiresConfirmation: z.boolean().prefault(false),
  })
  .strict();

export const KET_QUA_HANH_DONG = [
  'success',
  'partial',
  'failure',
  'interrupted',
  'misunderstood',
  'unintended_consequence',
  'project_started',
] as const;
export type KetQuaHanhDong = (typeof KET_QUA_HANH_DONG)[number];

export const ActionOutcomeSchema = z
  .object({
    intentId: z.string(),
    planId: z.string(),
    result: z.enum(KET_QUA_HANH_DONG),
    achieved: z.array(z.string()).prefault([]),
    notAchieved: z.array(z.string()).prefault([]),
    eventIds: z.array(z.string()).prefault([]),
    costsInWorld: z.array(z.string()).prefault([]),
    revealedFacts: z.array(z.string()).prefault([]),
    newAffordances: z.array(z.string()).prefault([]),
    /** Câu tiếng Việt engine đưa cho người chơi khi chưa có Narrator. */
    loiKe: z.string().prefault(''),
    projectId: z.string().nullable().prefault(null),
  })
  .strict();

export const PHAM_VI_PROJECT = ['personal', 'household', 'local', 'regional', 'divine', 'cosmic'] as const;

export const ProjectSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    ownerIds: z.array(z.string()),
    goal: z.string(),
    scope: z.enum(PHAM_VI_PROJECT),
    status: z.enum(['planning', 'active', 'blocked', 'dormant', 'completed', 'failed', 'abandoned']),
    locationIds: z.array(z.string()).prefault([]),
    stakeholderIds: z.array(z.string()).prefault([]),
    milestones: z
      .array(
        z
          .object({
            id: z.string(),
            description: z.string(),
            conditions: z.array(ExprNodeSchema).prefault([]),
            /** [BB] 68.3 — LLM được mô tả milestone, KHÔNG tự đặt progress = 1. */
            progress: z.number().min(0).max(1),
            completedAtTick: z.number().int().nullable(),
          })
          .strict(),
      )
      .prefault([]),
    requirements: z
      .array(
        z
          .object({
            kind: z.enum([
              'material',
              'labor',
              'knowledge',
              'permission',
              'relationship',
              'ritual',
              'law',
              'time',
              'location',
              'unknown',
            ]),
            description: z.string(),
            satisfied: z.boolean(),
            sourceRefs: z.array(EntityRefSchema).prefault([]),
          })
          .strict(),
      )
      .prefault([]),
    risks: z.array(z.string()).prefault([]),
    nextTick: z.number().int(),
    eventIds: z.array(z.string()).prefault([]),
  })
  .strict();

/**
 * Cấp kết tinh — [BB] 67.6: "Không nhảy thẳng từ thao tác cá nhân sang định luật."
 * "Pha trà một nghìn lần không sửa vật lý vũ trụ."
 */
export const CAP_KET_TINH = ['personal', 'household', 'institution', 'culture', 'concept', 'law'] as const;
export type CapKetTinh = (typeof CAP_KET_TINH)[number];

export const CrystallizationCandidateSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    /** Mẫu lặp lại được quan sát. */
    mau: z.string(),
    cap: z.enum(CAP_KET_TINH),
    soLanLap: z.number().int().min(0),
    /** Bao nhiêu chủ thể khác nhau đã lặp mẫu này. */
    soChuThe: z.number().int().min(0),
    /** Bao nhiêu vùng khác nhau. */
    soVung: z.number().int().min(0),
    tickDau: z.number().int(),
    tickCuoi: z.number().int(),
  })
  .strict();

/** Affordance — thứ chủ thể CÓ THỂ làm, thu từ WorldView chứ không từ World. */
export const AffordanceSchema = z
  .object({
    id: z.string(),
    /** `R.action` id, `R.verb` id, hoặc affordance suy ra từ quan hệ/vật/nơi. */
    nguon: z.enum(['action', 'verb', 'relation', 'possession', 'location', 'law', 'project']),
    ref: z.string(),
    nhan: z.string(),
    moTa: z.string().prefault(''),
    targetRefs: z.array(EntityRefSchema).prefault([]),
  })
  .strict();

export type Intent = z.infer<typeof IntentSchema>;
export type KnowledgeRecord = z.infer<typeof KnowledgeRecordSchema>;
export type ActionPlan = z.infer<typeof ActionPlanSchema>;
export type ActionOutcome = z.infer<typeof ActionOutcomeSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CrystallizationCandidate = z.infer<typeof CrystallizationCandidateSchema>;
export type Affordance = z.infer<typeof AffordanceSchema>;
