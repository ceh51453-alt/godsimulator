/**
 * Kiểu nền dùng chung giữa registry manifest và gameplay.
 * Nguồn: Đặc tả Phần 61.2 [BB].
 *
 * [BB] Không kiểu nào ở đây được chứa hàm, closure hay Zod object.
 * Manifest phải JSON round-trip được.
 */
import { z } from 'zod';
export declare const ID_PATTERN: RegExp;
export declare const EntityRefSchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const StatePathSchema: z.ZodObject<{
    table: z.ZodString;
    path: z.ZodString;
}, z.core.$strict>;
/** AST biểu thức giới hạn. Không eval, không new Function — Phần 61.2. */
export type ExprNode = {
    op: 'literal';
    value?: unknown;
    path?: string;
    args: ExprNode[];
} | {
    op: 'read';
    value?: unknown;
    path?: string;
    args: ExprNode[];
} | {
    op: 'not' | 'and' | 'or' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
    value?: unknown;
    path?: string;
    args: ExprNode[];
};
export declare const EXPR_OPS: readonly ["literal", "read", "not", "and", "or", "eq", "neq", "gt", "gte", "lt", "lte", "in"];
export type ExprOp = (typeof EXPR_OPS)[number];
export declare const ExprNodeSchema: z.ZodType<ExprNode>;
export declare const PATCH_OPS: readonly ["set", "add", "mul", "push", "remove", "flag", "link", "unlink"];
export type PatchOpKind = (typeof PATCH_OPS)[number];
export declare const PatchTemplateSchema: z.ZodObject<{
    op: z.ZodEnum<{
        set: "set";
        push: "push";
        link: "link";
        add: "add";
        mul: "mul";
        remove: "remove";
        flag: "flag";
        unlink: "unlink";
    }>;
    table: z.ZodString;
    idExpr: z.ZodType<ExprNode, unknown, z.core.$ZodTypeInternals<ExprNode, unknown>>;
    path: z.ZodPrefault<z.ZodString>;
    valueExpr: z.ZodOptional<z.ZodType<ExprNode, unknown, z.core.$ZodTypeInternals<ExprNode, unknown>>>;
}, z.core.$strict>;
export declare const ImportIssueSchema: z.ZodObject<{
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
}, z.core.$strict>;
/**
 * [BB] Phần 17.2 — lý do từ chối phải cụ thể, trỏ được về luật đang cấm.
 * Không bao giờ trả "không hiểu" chung chung.
 */
export declare const BlockReasonSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    lawId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    missingRefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    recoverable: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export declare const ConditionRecordSchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodString;
    severity: z.ZodNumber;
    startedAtTick: z.ZodNumber;
    causeEventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    treatmentProjectId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    status: z.ZodPrefault<z.ZodEnum<{
        active: "active";
        recovering: "recovering";
        resolved: "resolved";
        chronic: "chronic";
    }>>;
}, z.core.$strict>;
export declare const ClaimSchema: z.ZodObject<{
    id: z.ZodString;
    targetId: z.ZodString;
    kind: z.ZodString;
    share: z.ZodPrefault<z.ZodNumber>;
    basis: z.ZodString;
    status: z.ZodPrefault<z.ZodEnum<{
        asserted: "asserted";
        recognized: "recognized";
        disputed: "disputed";
        lost: "lost";
    }>>;
}, z.core.$strict>;
export declare const DebtSchema: z.ZodObject<{
    id: z.ZodString;
    creditorId: z.ZodString;
    debtorId: z.ZodString;
    commodityId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    amount: z.ZodNumber;
    dueTick: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    terms: z.ZodPrefault<z.ZodString>;
    status: z.ZodPrefault<z.ZodEnum<{
        disputed: "disputed";
        open: "open";
        paid: "paid";
        defaulted: "defaulted";
        forgiven: "forgiven";
    }>>;
}, z.core.$strict>;
export declare const ObligationSchema: z.ZodObject<{
    id: z.ZodString;
    toId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    description: z.ZodString;
    cadence: z.ZodPrefault<z.ZodString>;
    priority: z.ZodPrefault<z.ZodNumber>;
    status: z.ZodPrefault<z.ZodEnum<{
        active: "active";
        fulfilled: "fulfilled";
        broken: "broken";
        released: "released";
    }>>;
}, z.core.$strict>;
export declare const ScheduleBlockSchema: z.ZodObject<{
    startOffset: z.ZodNumber;
    duration: z.ZodNumber;
    activity: z.ZodString;
    locationId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    flexible: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export declare const FlowRefSchema: z.ZodObject<{
    sourceId: z.ZodString;
    targetId: z.ZodString;
    commodityId: z.ZodString;
    amountPerUnit: z.ZodNumber;
    unit: z.ZodString;
}, z.core.$strict>;
export type EntityRef = z.infer<typeof EntityRefSchema>;
export type StatePath = z.infer<typeof StatePathSchema>;
export type PatchTemplate = z.infer<typeof PatchTemplateSchema>;
export type ImportIssue = z.infer<typeof ImportIssueSchema>;
export type BlockReason = z.infer<typeof BlockReasonSchema>;
export type ConditionRecord = z.infer<typeof ConditionRecordSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type Debt = z.infer<typeof DebtSchema>;
export type Obligation = z.infer<typeof ObligationSchema>;
export type ScheduleBlock = z.infer<typeof ScheduleBlockSchema>;
export type FlowRef = z.infer<typeof FlowRefSchema>;
/** Ba chế độ chơi — ba phép chiếu trên cùng một save (Phần 18 [BB]). */
export declare const VIEW_MODES: readonly ["sang_the", "than", "pham_nhan"];
export type ViewMode = (typeof VIEW_MODES)[number];
export declare const ViewModeSchema: z.ZodEnum<{
    sang_the: "sang_the";
    than: "than";
    pham_nhan: "pham_nhan";
}>;
/** scopeKey = mode + ':' + (chuTheId ?? 'root') — Phần 61.5. */
export declare function scopeKeyOf(mode: ViewMode, chuTheId: string | null): string;
