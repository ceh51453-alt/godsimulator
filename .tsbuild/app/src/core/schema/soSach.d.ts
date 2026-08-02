/**
 * Hai bảng của Phase 5: `knowledge` và `debts`.
 *
 * Vì sao chúng là BẢNG chứ không phải trường trong aspect:
 *
 *   - Tri thức có **chủ thể biết** và **đường đi**. Bất biến "không tri thức
 *     teleport" (71.4) phải tra được: ai biết trước, biết lúc nào, qua tuyến nào.
 *     Nhét vào aspect thì không tra ngược được.
 *   - Nợ có **hai đầu** (chủ nợ, con nợ) thường ở hai vùng. Cất trong aspect của
 *     một bên là mời gọi hai bản sao lệch nhau.
 *
 * `docs/SCHEMA_DB_MATRIX.md` đã đặt chỗ cho cả hai từ Phase 0.
 */
import { z } from 'zod';
/**
 * Một dòng tri thức = một (người biết, mệnh đề).
 *
 * `knowerId` thường là một `place` ở độ phân giải macro — cả vùng biết chuyện —
 * và là entity cụ thể ở độ phân giải micro.
 */
export declare const KnowledgeRowSchema: z.ZodObject<{
    duongIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
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
    id: z.ZodString;
    branchId: z.ZodString;
}, z.core.$strict>;
export declare const DebtRowSchema: z.ZodObject<{
    tickTao: z.ZodPrefault<z.ZodNumber>;
    nguonEventId: z.ZodPrefault<z.ZodString>;
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
    branchId: z.ZodString;
}, z.core.$strict>;
export type KnowledgeRow = z.infer<typeof KnowledgeRowSchema>;
export type DebtRow = z.infer<typeof DebtRowSchema>;
/** Khóa chuẩn của một dòng tri thức. Dùng ở mọi nơi để tránh lệch quy ước. */
export declare function khoaTriThuc(knowerId: string, factId: string): string;
