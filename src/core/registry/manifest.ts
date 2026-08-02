/**
 * Registry manifest — Phần 61.2 [BB].
 *
 * [BB] Không file JSON nào được chứa hàm, source code, Zod object hay callback.
 * Mọi registry chia làm hai nửa:
 *   - manifest thuần dữ liệu (file này, JSON round-trip được);
 *   - runtime handler trong code (catalog.ts, không bao giờ đến từ JSON).
 */
import { z } from 'zod';
import { ExprNodeSchema, PatchTemplateSchema, ID_PATTERN } from '../contracts/primitives.js';
import type { PatchOp } from '../contracts/core.js';
import type { RuntimeCtx } from '../contracts/view.js';
import type { ValidationResult } from '../contracts/errors.js';

/** Mười hai registry — Phần 5.1 [BB]. */
export const REGISTRY_IDS = [
  'aspect',
  'kind',
  'verb',
  'relation',
  'gap',
  'action',
  'ending',
  'metric',
  'profile',
  'storyKind',
  'mechanism',
  'worldProcess',
] as const;

export type RegistryId = (typeof REGISTRY_IDS)[number];

export const RegistryManifestSchema = z
  .object({
    registry: z.enum(REGISTRY_IDS),
    id: z.string().regex(ID_PATTERN),
    version: z.number().int().min(1),
    ten: z.string(),
    moTa: z.string().prefault(''),
    /** Tra HandlerCatalog dựng sẵn. Id lạ → nhập ở trạng thái `can_adapter`. */
    handlerId: z.string().prefault(''),
    /** Tra SchemaCatalog dựng sẵn. */
    schemaRef: z.string().prefault(''),
    config: z.record(z.string(), z.unknown()).prefault({}),
    conditions: z.array(ExprNodeSchema).prefault([]),
    effects: z.array(PatchTemplateSchema).prefault([]),
    tags: z.array(z.string()).prefault([]),
  })
  .strict();

export type RegistryManifest = z.infer<typeof RegistryManifestSchema>;

export type RuntimeHandler = (ctx: RuntimeCtx, config: unknown) => PatchOp[];

/** Phần 61.2 — hai nửa của một registry entry. */
export type RuntimeRegistryDef = {
  manifest: RegistryManifest;
  validate(input: unknown): ValidationResult;
  execute?(ctx: RuntimeCtx): PatchOp[];
};

/** Trạng thái nhập của một mục pack. */
export const TRANG_THAI_MUC = ['hoat_dong', 'can_adapter', 'cach_ly', 'tat'] as const;
export type TrangThaiMuc = (typeof TRANG_THAI_MUC)[number];

/** Một pack người dùng nhập — Phần 5.2 tầng 2. */
export const RegistryPackSchema = z
  .object({
    id: z.string().regex(ID_PATTERN),
    ten: z.string(),
    version: z.number().int().min(1),
    moTa: z.string().prefault(''),
    tacGia: z.string().prefault(''),
    entries: z.array(RegistryManifestSchema).prefault([]),
  })
  .strict();

export type RegistryPack = z.infer<typeof RegistryPackSchema>;

/**
 * [BB] Chặn mọi thứ trông giống code trong dữ liệu pack.
 * Preset/pack ngoài là dữ liệu KHÔNG TIN CẬY (luật bất biến #10).
 */
const MAU_NGHI_NGO: readonly (readonly [string, RegExp])[] = [
  ['eval', /\beval\s*\(/],
  ['new_function', /\bnew\s+Function\b/],
  ['function_ctor', /\bFunction\s*\(/],
  ['dynamic_import', /\bimport\s*\(/],
  ['require', /\brequire\s*\(/],
  ['script_tag', /<\s*script\b/i],
  ['js_url', /javascript\s*:/i],
  ['event_handler', /\bon(?:error|load|click|mouseover)\s*=/i],
  ['proto_pollution', /__proto__|\bconstructor\s*\[|\bprototype\s*\[/],
];

export type CodeSniffHit = { code: string; path: string };

/**
 * Quét đệ quy một giá trị JSON tìm dấu vết code.
 * Trả về danh sách hit; rỗng nghĩa là sạch.
 */
export function quetDauVetCode(value: unknown, path = ''): CodeSniffHit[] {
  const hits: CodeSniffHit[] = [];
  const seen = new WeakSet<object>();

  const di = (v: unknown, p: string): void => {
    if (typeof v === 'function') {
      hits.push({ code: 'function_value', path: p });
      return;
    }
    if (typeof v === 'string') {
      for (const [code, re] of MAU_NGHI_NGO) {
        if (re.test(v)) hits.push({ code, path: p });
      }
      return;
    }
    if (v === null || typeof v !== 'object') return;
    if (seen.has(v)) {
      hits.push({ code: 'circular', path: p });
      return;
    }
    seen.add(v);
    if (Array.isArray(v)) {
      v.forEach((item, i) => di(item, `${p}[${i}]`));
      return;
    }
    for (const key of Object.keys(v)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        hits.push({ code: 'proto_pollution', path: p ? `${p}.${key}` : key });
        continue;
      }
      di((v as Record<string, unknown>)[key], p ? `${p}.${key}` : key);
    }
  };

  di(value, path);
  return hits;
}

/** Manifest phải JSON round-trip không mất nghĩa — cổng Phase 0. */
export function roundTripManifest(m: RegistryManifest): RegistryManifest {
  return RegistryManifestSchema.parse(JSON.parse(JSON.stringify(m)));
}
