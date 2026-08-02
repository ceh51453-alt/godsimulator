/**
 * Registry manifest — Phần 61.2 [BB].
 *
 * [BB] Không file JSON nào được chứa hàm, source code, Zod object hay callback.
 * Mọi registry chia làm hai nửa:
 *   - manifest thuần dữ liệu (file này, JSON round-trip được);
 *   - runtime handler trong code (catalog.ts, không bao giờ đến từ JSON).
 */
import { z } from 'zod';
import type { PatchOp } from '../contracts/core.js';
import type { RuntimeCtx } from '../contracts/view.js';
import type { ValidationResult } from '../contracts/errors.js';
/** Mười hai registry — Phần 5.1 [BB]. */
export declare const REGISTRY_IDS: readonly ["aspect", "kind", "verb", "relation", "gap", "action", "ending", "metric", "profile", "storyKind", "mechanism", "worldProcess"];
export type RegistryId = (typeof REGISTRY_IDS)[number];
export declare const RegistryManifestSchema: z.ZodObject<{
    registry: z.ZodEnum<{
        kind: "kind";
        action: "action";
        verb: "verb";
        relation: "relation";
        worldProcess: "worldProcess";
        aspect: "aspect";
        gap: "gap";
        ending: "ending";
        metric: "metric";
        profile: "profile";
        storyKind: "storyKind";
        mechanism: "mechanism";
    }>;
    id: z.ZodString;
    version: z.ZodNumber;
    ten: z.ZodString;
    moTa: z.ZodPrefault<z.ZodString>;
    handlerId: z.ZodPrefault<z.ZodString>;
    schemaRef: z.ZodPrefault<z.ZodString>;
    config: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    conditions: z.ZodPrefault<z.ZodArray<z.ZodType<import("../contracts/primitives.js").ExprNode, unknown, z.core.$ZodTypeInternals<import("../contracts/primitives.js").ExprNode, unknown>>>>;
    effects: z.ZodPrefault<z.ZodArray<z.ZodObject<{
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
    tags: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type RegistryManifest = z.infer<typeof RegistryManifestSchema>;
export type RuntimeHandler = (ctx: RuntimeCtx, config: unknown) => PatchOp[];
/** Phần 61.2 — hai nửa của một registry entry. */
export type RuntimeRegistryDef = {
    manifest: RegistryManifest;
    validate(input: unknown): ValidationResult;
    execute?(ctx: RuntimeCtx): PatchOp[];
};
/** Trạng thái nhập của một mục pack. */
export declare const TRANG_THAI_MUC: readonly ["hoat_dong", "can_adapter", "cach_ly", "tat"];
export type TrangThaiMuc = (typeof TRANG_THAI_MUC)[number];
/** Một pack người dùng nhập — Phần 5.2 tầng 2. */
export declare const RegistryPackSchema: z.ZodObject<{
    id: z.ZodString;
    ten: z.ZodString;
    version: z.ZodNumber;
    moTa: z.ZodPrefault<z.ZodString>;
    tacGia: z.ZodPrefault<z.ZodString>;
    entries: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        registry: z.ZodEnum<{
            kind: "kind";
            action: "action";
            verb: "verb";
            relation: "relation";
            worldProcess: "worldProcess";
            aspect: "aspect";
            gap: "gap";
            ending: "ending";
            metric: "metric";
            profile: "profile";
            storyKind: "storyKind";
            mechanism: "mechanism";
        }>;
        id: z.ZodString;
        version: z.ZodNumber;
        ten: z.ZodString;
        moTa: z.ZodPrefault<z.ZodString>;
        handlerId: z.ZodPrefault<z.ZodString>;
        schemaRef: z.ZodPrefault<z.ZodString>;
        config: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        conditions: z.ZodPrefault<z.ZodArray<z.ZodType<import("../contracts/primitives.js").ExprNode, unknown, z.core.$ZodTypeInternals<import("../contracts/primitives.js").ExprNode, unknown>>>>;
        effects: z.ZodPrefault<z.ZodArray<z.ZodObject<{
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
        tags: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RegistryPack = z.infer<typeof RegistryPackSchema>;
export type CodeSniffHit = {
    code: string;
    path: string;
};
/**
 * Quét đệ quy một giá trị JSON tìm dấu vết code.
 * Trả về danh sách hit; rỗng nghĩa là sạch.
 */
export declare function quetDauVetCode(value: unknown, path?: string): CodeSniffHit[];
/** Manifest phải JSON round-trip không mất nghĩa — cổng Phase 0. */
export declare function roundTripManifest(m: RegistryManifest): RegistryManifest;
