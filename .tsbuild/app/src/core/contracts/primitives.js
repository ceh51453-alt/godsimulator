/**
 * Kiểu nền dùng chung giữa registry manifest và gameplay.
 * Nguồn: Đặc tả Phần 61.2 [BB].
 *
 * [BB] Không kiểu nào ở đây được chứa hàm, closure hay Zod object.
 * Manifest phải JSON round-trip được.
 */
import { z } from 'zod';
export const ID_PATTERN = /^[a-z0-9][a-z0-9_.-]*$/;
export const EntityRefSchema = z
    .object({
    id: z.string(),
    kind: z.string().optional(),
    label: z.string().optional(),
})
    .strict();
export const StatePathSchema = z
    .object({
    table: z.string(),
    path: z.string(),
})
    .strict();
export const EXPR_OPS = [
    'literal',
    'read',
    'not',
    'and',
    'or',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
];
export const ExprNodeSchema = z.lazy(() => z
    .object({
    op: z.enum(EXPR_OPS),
    value: z.unknown().optional(),
    path: z.string().optional(),
    args: z.array(ExprNodeSchema).prefault([]),
})
    .strict());
export const PATCH_OPS = ['set', 'add', 'mul', 'push', 'remove', 'flag', 'link', 'unlink'];
export const PatchTemplateSchema = z
    .object({
    op: z.enum(PATCH_OPS),
    table: z.string(),
    idExpr: ExprNodeSchema,
    path: z.string().prefault(''),
    valueExpr: ExprNodeSchema.optional(),
})
    .strict();
export const ImportIssueSchema = z
    .object({
    code: z.string(),
    severity: z.enum(['info', 'warning', 'error', 'quarantine']),
    path: z.string().prefault(''),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).prefault({}),
})
    .strict();
/**
 * [BB] Phần 17.2 — lý do từ chối phải cụ thể, trỏ được về luật đang cấm.
 * Không bao giờ trả "không hiểu" chung chung.
 */
export const BlockReasonSchema = z
    .object({
    code: z.string(),
    message: z.string(),
    lawId: z.string().nullable().prefault(null),
    missingRefs: z.array(EntityRefSchema).prefault([]),
    recoverable: z.boolean().prefault(true),
})
    .strict();
export const ConditionRecordSchema = z
    .object({
    id: z.string(),
    kind: z.string(),
    severity: z.number().min(0).max(1),
    startedAtTick: z.number().int(),
    causeEventIds: z.array(z.string()).prefault([]),
    treatmentProjectId: z.string().nullable().prefault(null),
    status: z.enum(['active', 'recovering', 'resolved', 'chronic']).prefault('active'),
})
    .strict();
export const ClaimSchema = z
    .object({
    id: z.string(),
    targetId: z.string(),
    kind: z.string(),
    share: z.number().min(0).max(1).prefault(1),
    basis: z.string(),
    status: z.enum(['asserted', 'recognized', 'disputed', 'lost']).prefault('asserted'),
})
    .strict();
export const DebtSchema = z
    .object({
    id: z.string(),
    creditorId: z.string(),
    debtorId: z.string(),
    commodityId: z.string().nullable().prefault(null),
    amount: z.number().min(0),
    dueTick: z.number().int().nullable().prefault(null),
    terms: z.string().prefault(''),
    status: z.enum(['open', 'paid', 'defaulted', 'forgiven', 'disputed']).prefault('open'),
})
    .strict();
export const ObligationSchema = z
    .object({
    id: z.string(),
    toId: z.string().nullable().prefault(null),
    description: z.string(),
    cadence: z.string().prefault(''),
    priority: z.number().prefault(0),
    status: z.enum(['active', 'fulfilled', 'broken', 'released']).prefault('active'),
})
    .strict();
export const ScheduleBlockSchema = z
    .object({
    startOffset: z.number().min(0),
    duration: z.number().min(0),
    activity: z.string(),
    locationId: z.string().nullable().prefault(null),
    flexible: z.boolean().prefault(true),
})
    .strict();
export const FlowRefSchema = z
    .object({
    sourceId: z.string(),
    targetId: z.string(),
    commodityId: z.string(),
    amountPerUnit: z.number(),
    unit: z.string(),
})
    .strict();
/** Ba chế độ chơi — ba phép chiếu trên cùng một save (Phần 18 [BB]). */
export const VIEW_MODES = ['sang_the', 'than', 'pham_nhan'];
export const ViewModeSchema = z.enum(VIEW_MODES);
/** scopeKey = mode + ':' + (chuTheId ?? 'root') — Phần 61.5. */
export function scopeKeyOf(mode, chuTheId) {
    return `${mode}:${chuTheId ?? 'root'}`;
}
