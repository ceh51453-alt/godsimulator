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

/** Sáu nguyên mẫu khởi nguyên — dữ liệu tiền đề, không tự sinh sẵn thực thể. */
export const NGUYEN_MAU_SANG_THE = [
  'phan_tach_hon_don',
  'vu_tru_noan',
  'hien_te_nguyen_thuy',
  'ngon_tu',
  'tho_lan_dat',
  'giao_phoi_troi_dat',
] as const;
export type NguyenMauSangThe = (typeof NGUYEN_MAU_SANG_THE)[number];

/**
 * Tiến trình vũ trụ có thể kiểm chứng.
 *
 * Năm bậc giữa lấy từ chính bằng chứng của WorldState; `tan_the` và `tai_tao`
 * là hai bậc chu kỳ, không phải một con số trang trí trong registry kết cục.
 */
export const GIAI_DOAN_SANG_THE = [
  'hu_vo',
  'dau_hieu',
  'danh_xung',
  'luat_thanh',
  'coi_gioi',
  'su_thi',
  'tan_the',
  'tai_tao',
] as const;
export type GiaiDoanSangThe = (typeof GIAI_DOAN_SANG_THE)[number];

export const SangTheStateSchema = z
  .object({
    nguyenMau: z.enum(NGUYEN_MAU_SANG_THE).prefault('phan_tach_hon_don'),
    giaiDoan: z.enum(GIAI_DOAN_SANG_THE).prefault('hu_vo'),
    /** Id entity/link/storyline đang làm bằng chứng cho bậc hiện tại. */
    bangChungIds: z.array(z.string()).max(24).prefault([]),
    chuKy: z.number().int().min(1).prefault(1),
    tickBatDauChuKy: z.number().int().min(0).prefault(0),
    ketCucHienTai: z.string().nullable().prefault(null),
    tickKetCuc: z.number().int().nullable().prefault(null),
    /** Mỗi chu kỳ cũ co lại thành một câu, không bị xóa khỏi lịch sử. */
    diSanChuKy: z.array(z.string().max(500)).max(12).prefault([]),
  })
  .prefault({});

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
    /**
     * Kho Từ của nhánh — vốn từ thế giới tự tích lũy, xem `world/tuVung.ts`.
     *
     * Ở đây chứ không ở một bảng riêng, và lý do là **phạm vi**: nó là một danh
     * sách đơn nhất theo nhánh, đúng như `eraId` và `indicesVersion`. Một bảng
     * riêng sẽ đòi khóa `[branchId+id]`, một lượt migration Dexie và một chỗ
     * trong sáu đường xuất/nhập — trả giá ấy cho một mảng chuỗi là sai.
     *
     * `prefault([])` nên ván lưu trước bản này mở lại vẫn chạy: kho rỗng, và
     * lượt Bồi Đắp đầu tiên gieo lại vốn gốc.
     *
     * Hình dạng để `unknown[]` ở tầng contract: `contracts/` không được biết tới
     * `world/`, và `TuVungSchema` mới là chỗ kiểm hình dạng thật.
     */
    tuVung: z.array(z.unknown()).prefault([]),
    /**
     * Sổ Hậu Trường của nhánh — xem `world/hauTruong.ts`.
     *
     * Cùng chỗ và cùng lý do với `tuVung`: một danh sách đơn nhất theo nhánh,
     * vào `stateHash`, xuống đĩa cùng ván. Nó giữ những gì đường ống Workflow đã
     * mô phỏng nhưng chính văn CHƯA kể, nên nó phải sống qua save — một hàng đợi
     * chỉ nằm trong bộ nhớ sẽ mất đúng lúc người chơi đóng tab đi ngủ.
     *
     * `unknown[]` ở tầng contract vì `contracts/` không được biết tới `world/`;
     * `GhiChuHauTruongSchema` mới là chỗ kiểm hình dạng thật.
     */
    hauTruong: z.array(z.unknown()).prefault([]),
    /** Sáng thế và vòng tận thế–tái tạo của chính nhánh này. */
    sangThe: SangTheStateSchema,
    version: z.number().int().min(0),
  })
  .strict();

export type PatchOp = z.infer<typeof PatchOpSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type PlayerState = z.infer<typeof PlayerStateSchema>;
export type World = z.infer<typeof WorldSchema>;
export type SangTheState = z.infer<typeof SangTheStateSchema>;
