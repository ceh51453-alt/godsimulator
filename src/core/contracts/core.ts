/**
 * Bốn hợp đồng lõi tối thiểu — Phần 61.3 [BB].
 * Cộng PlayerState (Phần 21.3) vì World tham chiếu nó.
 *
 * [BB] Event là append-only. Patch được kiểm tra và áp trong một transaction.
 * Narrator không ghi state. `source = 'ai_validated'` chỉ dùng sau khi output
 * đã qua schema, invariant và visibility check.
 */
import { z } from 'zod';
import { PATCH_OPS, ViewModeSchema } from './primitives.js';

export const PatchOpSchema = z
  .object({
    op: z.enum(PATCH_OPS),
    target: z
      .object({
        table: z.string(),
        id: z.string(),
        path: z.string().prefault(''),
      })
      .strict(),
    value: z.unknown().optional(),
    /** Optimistic concurrency: transaction từ chối nếu version không khớp. */
    expectedVersion: z.number().int().min(0).optional(),
    sourceEventId: z.string(),
  })
  .strict();

export const EVENT_VISIBILITIES = ['cong_khai', 'gioi_han', 'bi_mat', 'engine'] as const;
export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];

export const EVENT_SOURCES = ['engine', 'player', 'ai_validated', 'import', 'migration'] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];

export const EventSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    tick: z.number().int().min(0),
    loai: z.string(),
    actorIds: z.array(z.string()).prefault([]),
    targetIds: z.array(z.string()).prefault([]),
    causeEventIds: z.array(z.string()).prefault([]),
    locationId: z.string().nullable().prefault(null),
    patches: z.array(PatchOpSchema).prefault([]),
    visibility: z.enum(EVENT_VISIBILITIES).prefault('cong_khai'),
    source: z.enum(EVENT_SOURCES),
    payload: z.record(z.string(), z.unknown()).prefault({}),
    hash: z.string(),
  })
  .strict();

export const SceneSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    startedAtTick: z.number().int(),
    currentTick: z.number().int(),
    locationId: z.string().nullable(),
    participantIds: z.array(z.string()),
    lensId: z.string(),
    status: z.enum(['open', 'paused', 'closed']).prefault('open'),
    draftInput: z.string().prefault(''),
    eventIds: z.array(z.string()).prefault([]),
  })
  .strict();

/**
 * Trạng thái người chơi — Phần 21.3.
 * Chuyển tầng KHÔNG tạo save mới, KHÔNG đổi branchId, KHÔNG reset gì.
 * Chỉ đổi `mode` + `chuTheId` rồi gọi lại `chieu()`.
 */
export const PlayerStateSchema = z
  .object({
    /** [BB] Chỉ là con trỏ. Hồ sơ riêng tư KHÔNG nằm trong World. */
    playerProfileId: z.string().nullable().prefault(null),
    creatorIdentityId: z.string().nullable().prefault(null),
    setupVersion: z.number().int().min(0).prefault(0),
    setupCompleted: z.boolean().prefault(false),
    mode: ViewModeSchema.prefault('sang_the'),
    chuTheId: z.string().nullable().prefault(null),
    banTheGocId: z.string().nullable().prefault(null),
    lichSuChuyenTang: z
      .array(
        z
          .object({
            tick: z.number(),
            tu: z.string(),
            den: z.string(),
            lyDo: z.string(),
          })
          .strict(),
      )
      .prefault([]),
  })
  .prefault({});

export const WorldSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    seed: z.string(),
    tick: z.number().int().min(0),
    eraId: z.string(),
    year: z.number().int(),
    tuningProfileId: z.string(),
    playerState: PlayerStateSchema,
    indicesVersion: z.number().int().prefault(1),
    version: z.number().int().min(0),
  })
  .strict();

export type PatchOp = z.infer<typeof PatchOpSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type PlayerState = z.infer<typeof PlayerStateSchema>;
export type World = z.infer<typeof WorldSchema>;
