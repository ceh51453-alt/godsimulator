/**
 * Entity gốc + Link — Phần 4.1, 6.1 [BB].
 *
 * [BB] `kind` là CHUỖI, không phải enum. Enum khóa chết khả năng mở rộng.
 * Tính hợp lệ kiểm bằng `R.kind.lay(kind) !== undefined`.
 */
import { z } from 'zod';

export const EntitySchema = z
  .object({
    id: z.string(),
    branchId: z.string(),

    kind: z.string(),
    ten: z.string(),
    aliases: z.array(z.string()).prefault([]),
    moTa: z.string().prefault(''),

    tickSinh: z.number(),
    tickDiet: z.number().nullable().prefault(null),

    /** key = aspect id. [BB] Truy cập qua co()/lay()/themAspect(), không đọc trực tiếp. */
    aspects: z.record(z.string(), z.unknown()).prefault({}),
    tags: z.array(z.string()).prefault([]),

    /** engine-only, cache bậc đồ thị. */
    _degree: z.number().prefault(0),
    _hash: z.string().prefault(''),
    /** optimistic concurrency cho PatchOp.expectedVersion. */
    _version: z.number().int().min(0).prefault(0),
  })
  .strict();

export const NGUON_LINK = ['nguoi_choi', 'engine', 'thu_hoach', 'giai_lo_hong', 'thanh_tra'] as const;

export const LinkSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    tuId: z.string(),
    denId: z.string(),
    /** tra R.relation */
    quanHe: z.string(),
    trongSo: z.number().min(0).max(100).prefault(50),
    tickTao: z.number(),
    /** [BB] Link không bị xóa cứng. Đứt → trongSo = 0 + ghi tickDut. Đó là "vết sẹo". */
    tickDut: z.number().nullable().prefault(null),
    nguon: z.enum(NGUON_LINK).prefault('engine'),
  })
  .strict();

/** Chỉ số thế giới — Phần 13.1 [BB]. */
export const WorldMetricsSchema = z
  .object({
    realityIntegrity: z.number().min(0).max(100).prefault(100),
    doSongDong: z.number().min(0).max(100).prefault(50),
    agencyTrungBinh: z.number().min(0).max(100).prefault(100),
    doPhuThuocTB: z.number().min(0).max(100).prefault(0),
    tuSinhSuKien: z.number().min(0).max(100).prefault(100),
    matDoLienKet: z.number().prefault(0),
    daDangKhaiNiem: z.number().prefault(0),
    tickTinh: z.number().prefault(0),
  })
  .prefault({});

/** Lỗ hổng — thực thể mồ côi và mọi chỗ thế giới chưa mạch lạc. Phần 6.3 quy tắc 3. */
export const GapSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    loai: z.string(),
    chuTheId: z.string().nullable().prefault(null),
    moTa: z.string().prefault(''),
    uuTien: z.number().min(0).max(100).prefault(50),
    lanThu: z.number().int().min(0).prefault(0),
    trangThai: z.enum(['mo', 'dang_giai', 'da_giai', 'thanh_bi_an']).prefault('mo'),
    tickPhatHien: z.number().int(),
  })
  .strict();

export type Entity = z.infer<typeof EntitySchema>;
export type Link = z.infer<typeof LinkSchema>;
export type WorldMetrics = z.infer<typeof WorldMetricsSchema>;
export type Gap = z.infer<typeof GapSchema>;
