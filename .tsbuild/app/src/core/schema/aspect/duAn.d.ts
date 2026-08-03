/**
 * Aspect `du_an` — việc dài hơi mà một chủ thể đang theo đuổi (Phần 68.3, 69.3).
 *
 * Để Project ngay trên entity chứ không dựng một bảng riêng, vì một Project luôn
 * thuộc về ai đó và không có truy vấn nào cần đọc Project mà không cần đọc chủ
 * của nó. Bảng riêng sẽ phải trả giá bằng một migration Dexie và một khóa kép,
 * đổi lấy đúng con số không.
 *
 * Trần sáu: một vị thần theo đuổi mười việc cùng lúc là một vị thần không theo
 * đuổi gì cả.
 */
import { z } from 'zod';
export declare const DuAnSchema: z.ZodPrefault<z.ZodObject<{
    danhSach: z.ZodPrefault<z.ZodArray<z.ZodObject<{
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
            conditions: z.ZodPrefault<z.ZodArray<z.ZodType<import("../../contracts/primitives.js").ExprNode, unknown, z.core.$ZodTypeInternals<import("../../contracts/primitives.js").ExprNode, unknown>>>>;
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
    }, z.core.$strict>>>;
}, z.core.$strip>>;
export type DuAnAspect = z.infer<typeof DuAnSchema>;
