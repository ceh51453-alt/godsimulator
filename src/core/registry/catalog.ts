/**
 * HandlerCatalog + SchemaCatalog — Phần 61.2 [BB].
 *
 * "Hai catalog sau CHỈ nằm trong code."
 *
 * Pack JSON chỉ được tham chiếu `handlerId` và `schemaRef` đã đăng ký ở đây.
 * Id lạ → mục được nhập ở trạng thái `can_adapter`, KHÔNG kích hoạt.
 * Đây là ranh giới duy nhất giữa dữ liệu không tin cậy và code chạy được.
 */
import { z } from 'zod';
import type { RuntimeHandler } from './manifest.js';

import { EntitySchema, LinkSchema, WorldMetricsSchema, GapSchema } from '../schema/entity.js';
import { RelationStateSchema, QuanHeMotChieuSchema } from '../schema/aspect/soul.js';
import { AvatarSchema } from '../schema/aspect/divine.js';
import { KnowledgeRowSchema, DebtRowSchema } from '../schema/soSach.js';
import { DomainStateSchema } from '../schema/aspect/thanVi.js';
import { PrayerSchema, DieuKhoanSchema } from '../schema/than.js';
import { KnowledgeRecordSchema } from '../intent/schema.js';
import { ModelProfileSchema, GenParamsSchema } from '../schema/ai.js';
import { AiConfigSchema, AiEndpointSchema, ProbeResultSchema } from '../ai/cauHinh.js';
import { GheSchema, NghiQuyetSchema } from '../schema/aspect/hoiDong.js';
import { ThuongTichSchema } from '../schema/aspect/pham.js';
import { MUC_SCHEMA_ASPECT } from '../schema/aspect/bangSchema.js';
import {
  PatchOpSchema,
  EventSchema,
  SceneSchema,
  WorldSchema,
  PlayerStateSchema,
} from '../contracts/core.js';
import {
  EntityRefSchema,
  ClaimSchema,
  DebtSchema,
  ObligationSchema,
  ScheduleBlockSchema,
  FlowRefSchema,
  ConditionRecordSchema,
  BlockReasonSchema,
} from '../contracts/primitives.js';

/**
 * Mọi schema mà một manifest được phép trỏ tới bằng `schemaRef`.
 * [BB] Phần 61.6 — không schema nào được dùng trong spec mà thiếu type, nơi lưu và test parse.
 */
const schemaEntries: readonly (readonly [string, z.ZodType])[] = [
  ['entity', EntitySchema],
  ['link', LinkSchema],
  ['gap', GapSchema],
  ['worldMetrics', WorldMetricsSchema],
  ['world', WorldSchema],
  ['playerState', PlayerStateSchema],
  ['event', EventSchema],
  ['scene', SceneSchema],
  ['patchOp', PatchOpSchema],
  ['entityRef', EntityRefSchema],
  ['blockReason', BlockReasonSchema],
  ['claim', ClaimSchema],
  ['debt', DebtSchema],
  ['obligation', ObligationSchema],
  ['scheduleBlock', ScheduleBlockSchema],
  ['flowRef', FlowRefSchema],
  ['conditionRecord', ConditionRecordSchema],
  /*
   * Mọi `aspect.*` đến từ MỘT bảng duy nhất — `schema/aspect/bangSchema.ts`.
   *
   * Trước đây danh sách này chép tay, và `engine/patch.ts` không với tới được nó
   * nên pha 2 của `apPatch()` chỉ parse `EntitySchema` — tức không kiểm một chữ
   * nào bên trong `aspects`. Gộp về một nguồn để hai cửa vào World (op `link` và
   * op `set`) không bao giờ lệch tiêu chuẩn lần nữa.
   */
  ...MUC_SCHEMA_ASPECT,
  // bảng Phase 5
  ['knowledgeRecord', KnowledgeRecordSchema],
  ['knowledgeRow', KnowledgeRowSchema],
  ['debtRow', DebtRowSchema],
  // tầng Thần — Phase 6
  ['domainState', DomainStateSchema],
  ['prayer', PrayerSchema],
  ['dieuKhoan', DieuKhoanSchema],
  ['avatar', AvatarSchema],
  ['relationState', RelationStateSchema],
  // hội đồng thần — 69.3
  ['ghe', GheSchema],
  ['nghiQuyet', NghiQuyetSchema],
  // tầng Phàm Nhân — Phase 7
  ['thuongTich', ThuongTichSchema],
  ['quanHeMotChieu', QuanHeMotChieuSchema],
  // ai
  ['modelProfile', ModelProfileSchema],
  ['genParams', GenParamsSchema],
  ['aiEndpoint', AiEndpointSchema],
  ['aiConfig', AiConfigSchema],
  ['probeResult', ProbeResultSchema],
  // tham số động từ / hành động
  ['params.empty', z.object({}).strict()],
  ['params.targets', z.object({ mucTieuIds: z.array(z.string()).min(1) }).strict()],
  ['params.name', z.object({ ten: z.string().min(1), moTa: z.string().prefault('') }).strict()],
];

export const SchemaCatalog: ReadonlyMap<string, z.ZodType> = new Map(schemaEntries);

/**
 * Handler runtime dựng sẵn.
 * Phase 0 khai hợp đồng và catalog rỗng có kiểu; handler thật được nạp ở Phase 1+
 * qua `dangKyHandler`. Manifest trỏ tới handlerId chưa có → trạng thái `can_adapter`.
 */
const handlers = new Map<string, RuntimeHandler>();

export function dangKyHandler(id: string, fn: RuntimeHandler): void {
  handlers.set(id, fn);
}

export const HandlerCatalog: ReadonlyMap<string, RuntimeHandler> = handlers;

export function coHandler(id: string): boolean {
  return id === '' || handlers.has(id);
}

export function coSchemaRef(ref: string): boolean {
  return ref === '' || SchemaCatalog.has(ref);
}

export function danhSachSchemaRef(): readonly string[] {
  return [...SchemaCatalog.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
