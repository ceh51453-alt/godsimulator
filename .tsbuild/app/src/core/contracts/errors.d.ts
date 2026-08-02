/**
 * Error contract — Phần 61.3 [BB] "Engine, DB và UI import cùng một kiểu".
 *
 * Nguyên tắc 4 (Phần 2): mọi mâu thuẫn biến thành nội dung, không ném lỗi
 * vào mặt người chơi. Vì vậy lỗi là **giá trị có cấu trúc**, không phải throw.
 */
import { z } from 'zod';
export declare const ERROR_DOMAINS: readonly ["schema", "registry", "tuning", "patch", "event", "transaction", "invariant", "persistence", "migration", "visibility", "privacy", "retrieval", "rerank", "preset", "ai", "intent"];
export type ErrorDomain = (typeof ERROR_DOMAINS)[number];
export declare const ERROR_SEVERITIES: readonly ["info", "warning", "error", "fatal"];
export type ErrorSeverity = (typeof ERROR_SEVERITIES)[number];
export declare const StructuredErrorSchema: z.ZodObject<{
    domain: z.ZodEnum<{
        ai: "ai";
        migration: "migration";
        visibility: "visibility";
        intent: "intent";
        preset: "preset";
        rerank: "rerank";
        schema: "schema";
        registry: "registry";
        tuning: "tuning";
        patch: "patch";
        event: "event";
        transaction: "transaction";
        invariant: "invariant";
        persistence: "persistence";
        privacy: "privacy";
        retrieval: "retrieval";
    }>;
    code: z.ZodString;
    severity: z.ZodPrefault<z.ZodEnum<{
        error: "error";
        info: "info";
        warning: "warning";
        fatal: "fatal";
    }>>;
    message: z.ZodString;
    path: z.ZodPrefault<z.ZodString>;
    details: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    recoverable: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export type StructuredError = z.infer<typeof StructuredErrorSchema>;
export declare function loi(domain: ErrorDomain, code: string, message: string, extra?: Partial<Omit<StructuredError, 'domain' | 'code' | 'message'>>): StructuredError;
/** Kết quả có thể hỏng, không dùng throw. */
export type KetQua<T> = {
    ok: true;
    value: T;
    warnings: StructuredError[];
} | {
    ok: false;
    errors: StructuredError[];
    warnings: StructuredError[];
};
export declare function dat<T>(value: T, warnings?: StructuredError[]): KetQua<T>;
export declare function hong<T = never>(errors: StructuredError[], warnings?: StructuredError[]): KetQua<T>;
/** Hợp đồng validate của RuntimeRegistryDef — Phần 61.2. */
export type ValidationResult = {
    ok: true;
    warnings: string[];
} | {
    ok: false;
    errors: string[];
    warnings: string[];
};
/** Chuyển ZodError thành StructuredError[] — dùng ở mọi biên nhập dữ liệu. */
export declare function tuZodError(domain: ErrorDomain, code: string, err: z.ZodError): StructuredError[];
/**
 * Parse an toàn: không throw, trả KetQua có cấu trúc.
 * Dùng cho mọi dữ liệu không tin cậy (preset, pack, save import, config).
 */
export declare function parseAnToan<S extends z.ZodType>(schema: S, input: unknown, domain: ErrorDomain, code: string): KetQua<z.infer<S>>;
