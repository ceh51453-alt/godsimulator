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
export declare const HORIZON: readonly ["immediate", "scene", "day", "season", "year", "era"];
export type Horizon = (typeof HORIZON)[number];
export declare const IntentSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    sceneId: z.ZodNullable<z.ZodString>;
    actorId: z.ZodString;
    mode: z.ZodEnum<{
        sang_the: "sang_the";
        than: "than";
        pham_nhan: "pham_nhan";
    }>;
    rawText: z.ZodString;
    goal: z.ZodString;
    targetRefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    method: z.ZodPrefault<z.ZodString>;
    constraints: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    horizon: z.ZodPrefault<z.ZodEnum<{
        year: "year";
        day: "day";
        immediate: "immediate";
        scene: "scene";
        season: "season";
        era: "era";
    }>>;
    stance: z.ZodPrefault<z.ZodObject<{
        secrecy: z.ZodPrefault<z.ZodEnum<{
            open: "open";
            secret: "secret";
            discreet: "discreet";
        }>>;
        risk: z.ZodPrefault<z.ZodEnum<{
            avoid: "avoid";
            accept: "accept";
            embrace: "embrace";
        }>>;
        harm: z.ZodPrefault<z.ZodEnum<{
            avoid: "avoid";
            minimize: "minimize";
            allow: "allow";
        }>>;
    }, z.core.$strip>>;
    parsedBy: z.ZodEnum<{
        rule: "rule";
        model: "model";
        user_corrected: "user_corrected";
    }>;
    confidence: z.ZodNumber;
}, z.core.$strict>;
export declare const NGUON_TRI_THUC: readonly ["witness", "told", "rumor", "text", "ritual", "oracle", "divine_sense", "inference", "memory", "unknown"];
/**
 * [BB] 67.3 — "Không resolver nào được dùng World thật để lập kế hoạch cho chủ thể."
 * Thần cũng có KnowledgeRecord. Domain cho cảm nhận tốt hơn, KHÔNG cho toàn tri.
 */
export declare const KnowledgeRecordSchema: z.ZodObject<{
    factId: z.ZodString;
    knowerId: z.ZodString;
    proposition: z.ZodString;
    objectRefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    source: z.ZodObject<{
        type: z.ZodEnum<{
            unknown: "unknown";
            witness: "witness";
            told: "told";
            rumor: "rumor";
            text: "text";
            ritual: "ritual";
            oracle: "oracle";
            divine_sense: "divine_sense";
            inference: "inference";
            memory: "memory";
        }>;
        sourceId: z.ZodNullable<z.ZodString>;
        hops: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>;
    confidence: z.ZodNumber;
    distortion: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    learnedAtTick: z.ZodNumber;
    lastConfirmedAtTick: z.ZodNullable<z.ZodNumber>;
    contradictedBy: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export declare const ActionPlanSchema: z.ZodObject<{
    id: z.ZodString;
    intentId: z.ZodString;
    actorId: z.ZodString;
    steps: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        actionRef: z.ZodString;
        targetRefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            kind: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
        preconditions: z.ZodPrefault<z.ZodArray<z.ZodType<import("../contracts/primitives.js").ExprNode, unknown, z.core.$ZodTypeInternals<import("../contracts/primitives.js").ExprNode, unknown>>>>;
        expectedEffects: z.ZodPrefault<z.ZodArray<z.ZodObject<{
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
            idExpr: z.ZodType<import("../contracts/primitives.js").ExprNode, unknown, z.core.$ZodTypeInternals<import("../contracts/primitives.js").ExprNode, unknown>>;
            path: z.ZodPrefault<z.ZodString>;
            valueExpr: z.ZodOptional<z.ZodType<import("../contracts/primitives.js").ExprNode, unknown, z.core.$ZodTypeInternals<import("../contracts/primitives.js").ExprNode, unknown>>>;
        }, z.core.$strict>>>;
        duration: z.ZodNumber;
        interruptible: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
    unknowns: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    blockedBy: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        lawId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        missingRefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            kind: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
        recoverable: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
    alternatives: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    requiresConfirmation: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export declare const KET_QUA_HANH_DONG: readonly ["success", "partial", "failure", "interrupted", "misunderstood", "unintended_consequence", "project_started"];
export type KetQuaHanhDong = (typeof KET_QUA_HANH_DONG)[number];
export declare const ActionOutcomeSchema: z.ZodObject<{
    intentId: z.ZodString;
    planId: z.ZodString;
    result: z.ZodEnum<{
        success: "success";
        partial: "partial";
        failure: "failure";
        interrupted: "interrupted";
        misunderstood: "misunderstood";
        unintended_consequence: "unintended_consequence";
        project_started: "project_started";
    }>;
    achieved: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    notAchieved: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    eventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    costsInWorld: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    revealedFacts: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    newAffordances: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    loiKe: z.ZodPrefault<z.ZodString>;
    projectId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export declare const PHAM_VI_PROJECT: readonly ["personal", "household", "local", "regional", "divine", "cosmic"];
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    ownerIds: z.ZodArray<z.ZodString>;
    goal: z.ZodString;
    scope: z.ZodEnum<{
        personal: "personal";
        household: "household";
        local: "local";
        regional: "regional";
        divine: "divine";
        cosmic: "cosmic";
    }>;
    status: z.ZodEnum<{
        active: "active";
        planning: "planning";
        blocked: "blocked";
        dormant: "dormant";
        completed: "completed";
        failed: "failed";
        abandoned: "abandoned";
    }>;
    locationIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    stakeholderIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    milestones: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        conditions: z.ZodPrefault<z.ZodArray<z.ZodType<import("../contracts/primitives.js").ExprNode, unknown, z.core.$ZodTypeInternals<import("../contracts/primitives.js").ExprNode, unknown>>>>;
        progress: z.ZodNumber;
        completedAtTick: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>>>;
    requirements: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<{
            unknown: "unknown";
            knowledge: "knowledge";
            ritual: "ritual";
            material: "material";
            labor: "labor";
            permission: "permission";
            relationship: "relationship";
            law: "law";
            time: "time";
            location: "location";
        }>;
        description: z.ZodString;
        satisfied: z.ZodBoolean;
        sourceRefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            kind: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
    }, z.core.$strict>>>;
    risks: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    nextTick: z.ZodNumber;
    eventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
/**
 * Cấp kết tinh — [BB] 67.6: "Không nhảy thẳng từ thao tác cá nhân sang định luật."
 * "Pha trà một nghìn lần không sửa vật lý vũ trụ."
 */
export declare const CAP_KET_TINH: readonly ["personal", "household", "institution", "culture", "concept", "law"];
export type CapKetTinh = (typeof CAP_KET_TINH)[number];
export declare const CrystallizationCandidateSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    mau: z.ZodString;
    cap: z.ZodEnum<{
        personal: "personal";
        household: "household";
        law: "law";
        institution: "institution";
        culture: "culture";
        concept: "concept";
    }>;
    soLanLap: z.ZodNumber;
    soChuThe: z.ZodNumber;
    soVung: z.ZodNumber;
    tickDau: z.ZodNumber;
    tickCuoi: z.ZodNumber;
}, z.core.$strict>;
/** Affordance — thứ chủ thể CÓ THỂ làm, thu từ WorldView chứ không từ World. */
export declare const AffordanceSchema: z.ZodObject<{
    id: z.ZodString;
    nguon: z.ZodEnum<{
        law: "law";
        location: "location";
        action: "action";
        verb: "verb";
        relation: "relation";
        possession: "possession";
        project: "project";
    }>;
    ref: z.ZodString;
    nhan: z.ZodString;
    moTa: z.ZodPrefault<z.ZodString>;
    targetRefs: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type Intent = z.infer<typeof IntentSchema>;
export type KnowledgeRecord = z.infer<typeof KnowledgeRecordSchema>;
export type ActionPlan = z.infer<typeof ActionPlanSchema>;
export type ActionOutcome = z.infer<typeof ActionOutcomeSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CrystallizationCandidate = z.infer<typeof CrystallizationCandidateSchema>;
export type Affordance = z.infer<typeof AffordanceSchema>;
