/**
 * Error contract — Phần 61.3 [BB] "Engine, DB và UI import cùng một kiểu".
 *
 * Nguyên tắc 4 (Phần 2): mọi mâu thuẫn biến thành nội dung, không ném lỗi
 * vào mặt người chơi. Vì vậy lỗi là **giá trị có cấu trúc**, không phải throw.
 */
import { z } from 'zod';

export const ERROR_DOMAINS = [
  'schema',
  'registry',
  'tuning',
  'patch',
  'event',
  'transaction',
  'invariant',
  'persistence',
  'migration',
  'visibility',
  'privacy',
  'retrieval',
  'rerank',
  'preset',
  'ai',
  'intent',
] as const;

export type ErrorDomain = (typeof ERROR_DOMAINS)[number];

export const ERROR_SEVERITIES = ['info', 'warning', 'error', 'fatal'] as const;
export type ErrorSeverity = (typeof ERROR_SEVERITIES)[number];

export const StructuredErrorSchema = z
  .object({
    domain: z.enum(ERROR_DOMAINS),
    code: z.string(),
    severity: z.enum(ERROR_SEVERITIES).prefault('error'),
    /** Thông điệp tiếng Việt hiển thị được cho người dùng. */
    message: z.string(),
    /** Đường dẫn tới chỗ hỏng: 'entities.abc.aspects.soul.agency'. */
    path: z.string().prefault(''),
    /** Dữ liệu phụ; [BB] không được chứa secret hoặc trường hồ sơ riêng tư. */
    details: z.record(z.string(), z.unknown()).prefault({}),
    /** Có thể phục hồi bằng fallback deterministic hay không. */
    recoverable: z.boolean().prefault(true),
  })
  .strict();

export type StructuredError = z.infer<typeof StructuredErrorSchema>;

export function loi(
  domain: ErrorDomain,
  code: string,
  message: string,
  extra: Partial<Omit<StructuredError, 'domain' | 'code' | 'message'>> = {},
): StructuredError {
  return StructuredErrorSchema.parse({ domain, code, message, ...extra });
}

/** Kết quả có thể hỏng, không dùng throw. */
export type KetQua<T> =
  | { ok: true; value: T; warnings: StructuredError[] }
  | { ok: false; errors: StructuredError[]; warnings: StructuredError[] };

export function dat<T>(value: T, warnings: StructuredError[] = []): KetQua<T> {
  return { ok: true, value, warnings };
}

export function hong<T = never>(errors: StructuredError[], warnings: StructuredError[] = []): KetQua<T> {
  return { ok: false, errors, warnings };
}

/** Hợp đồng validate của RuntimeRegistryDef — Phần 61.2. */
export type ValidationResult =
  { ok: true; warnings: string[] } | { ok: false; errors: string[]; warnings: string[] };

/** Chuyển ZodError thành StructuredError[] — dùng ở mọi biên nhập dữ liệu. */
export function tuZodError(domain: ErrorDomain, code: string, err: z.ZodError): StructuredError[] {
  return err.issues.map((issue) =>
    loi(domain, code, issue.message, {
      path: issue.path.map((p) => String(p)).join('.'),
      details: { zodCode: issue.code },
    }),
  );
}

/**
 * Parse an toàn: không throw, trả KetQua có cấu trúc.
 * Dùng cho mọi dữ liệu không tin cậy (preset, pack, save import, config).
 */
export function parseAnToan<S extends z.ZodType>(
  schema: S,
  input: unknown,
  domain: ErrorDomain,
  code: string,
): KetQua<z.infer<S>> {
  const r = schema.safeParse(input);
  if (r.success) return dat(r.data as z.infer<S>);
  return hong(tuZodError(domain, code, r.error));
}
