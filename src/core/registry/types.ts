/**
 * Kiểu định nghĩa cho mười hai registry — Phần 5, 61.2 [BB].
 *
 * Mỗi Def có hai nửa:
 *   - `manifest`: dữ liệu thuần, JSON round-trip được, xuất/nhập được;
 *   - phần runtime (hàm, Zod schema): CHỈ nằm trong code, không bao giờ đến từ JSON.
 *
 * Built-in được phép dùng handler TypeScript mạnh hơn; export ra JSON chỉ xuất manifest.
 */
import type { z } from 'zod';
import type { RegistryManifest } from './manifest.js';
import type { RuntimeCtx } from '../contracts/view.js';
import type { PatchOp } from '../contracts/core.js';
import type { BlockReason, StatePath } from '../contracts/primitives.js';
import type { KetQua } from '../contracts/errors.js';
import type { ModelProfile } from '../schema/ai.js';

export type BaseDef = {
  readonly id: string;
  readonly ten: string;
  readonly moTa?: string;
  /** Manifest tương ứng — nguồn chân lý khi xuất pack. */
  readonly manifest: RegistryManifest;
};

// ─────────────────────────────────────────── aspect

export type AspectDef = BaseDef & {
  readonly schema: z.ZodType;
  /** Aspect bắt buộc phải có kèm. */
  readonly phuThuoc?: readonly string[];
  readonly khiThem?: (entityId: string, ctx: RuntimeCtx) => PatchOp[];
  /** [BB] Được engine gọi tự động ở bước tương ứng của vòng lặp tick. */
  readonly moiTick?: (entityId: string, ctx: RuntimeCtx, tick: number) => PatchOp[];
  /** Bước nào của 14 bước tick thì moiTick chạy. */
  readonly buocTick?: number;
};

// ─────────────────────────────────────────── kind

export const MAU_KIND = ['dong', 'ngoc', 'van', 'hoi', 'lam', 'tro'] as const;
export type MauKind = (typeof MAU_KIND)[number];

export type MucChieu = 'day_du' | 'trong_domain' | 'tin_don' | 'mu' | 'qua_van_hoa';

/** Quy tắc chiếu lấy từ KindDef.phanChieu — Phần 18.2 [MR]. Không hardcode. */
export type PhanChieu = {
  readonly sangThe: 'day_du';
  readonly than: 'day_du' | 'trong_domain' | 'tin_don' | 'mu';
  readonly phamNhan: 'day_du' | 'qua_van_hoa' | 'tin_don' | 'mu';
};

export type KindDef = BaseDef & {
  readonly aspects: readonly string[];
  /** Tên component SVG vẽ tay — [BB] không dùng thư viện icon. */
  readonly icon: string;
  readonly mau: MauKind;
  readonly tangMacDinh?: 't0' | 't1' | 't2' | 't3';
  readonly phanChieu: PhanChieu;
};

// ─────────────────────────────────────────── verb

export type VerbCtx = RuntimeCtx & {
  readonly mucTieuIds: readonly string[];
  readonly thamSo: unknown;
};

export type VerbDef = BaseDef & {
  /** Aspect hoặc kind mà động từ áp được. */
  readonly coChatHopLe: readonly string[];
  readonly thamSo: z.ZodType;
  /**
   * [BB] Phần 5.3 — phải trả về ID LUẬT đang cấm, không được trả chuỗi chung chung.
   * Đây là chỗ Phần 17.2 lấy lý do từ chối cụ thể.
   */
  readonly kiemTraTruoc?: (ctx: VerbCtx) => KetQua<null> | { ok: false; chan: BlockReason };
  /** Bỏ trống → engine tra `manifest.handlerId` trong HandlerCatalog. */
  readonly thucThi?: (ctx: VerbCtx) => PatchOp[];
  readonly heQua?: (ctx: VerbCtx) => PatchOp[];
  /** EJS, đưa vào context cho AI. */
  readonly moTaChoAi: string;
  readonly capDoi: string | null;
};

// ─────────────────────────────────────────── relation

export type RelationDef = BaseDef & {
  /** true → tự tạo cạnh ngược. */
  readonly doiXung: boolean;
  /** id quan hệ ngược, nếu bất đối xứng. */
  readonly nghichDao?: string;
  /** 0–1, dùng khi mở rộng đồ thị. */
  readonly heSoTruyenBa: number;
  readonly tuKind?: readonly string[];
  readonly denKind?: readonly string[];
};

// ─────────────────────────────────────────── gap

export type GapDef = BaseDef & {
  readonly uuTienMacDinh: number;
  readonly phatHien?: (ctx: RuntimeCtx) => readonly string[];
  /** Lỗ hổng không lấp được trở thành bí ẩn — nguyên tắc 4. */
  readonly choPhepThanhBiAn: boolean;
};

// ─────────────────────────────────────────── action

export type ActionDef = BaseDef & {
  readonly tangApDung: readonly ('t0' | 't1' | 't2' | 't3')[];
  readonly thamSo: z.ZodType;
  /** Utility AI chấm điểm hành động này cho một chủ thể. */
  readonly chamDiem?: (ctx: RuntimeCtx, actorId: string) => number;
  readonly thucThi?: (ctx: VerbCtx) => PatchOp[];
};

// ─────────────────────────────────────────── ending

export type EndingDef = BaseDef & {
  readonly dieuKien?: (ctx: RuntimeCtx) => boolean;
  readonly vanBan: string;
};

// ─────────────────────────────────────────── metric

export type MetricDef = BaseDef & {
  /**
   * ADR-0004: id registry theo regex an toàn của manifest (61.2), nên dùng snake_case.
   * `truongWorldMetrics` trỏ về tên trường camelCase trong WorldMetricsSchema.
   */
  readonly truongWorldMetrics: string;
  readonly min: number;
  readonly max: number;
  readonly macDinh: number;
  /** [BB] Chỉ hiển thị cuối kỷ nguyên nếu true (Phần 13.4). */
  readonly chiHienCuoiKyNguyen: boolean;
  readonly tinh?: (ctx: RuntimeCtx) => number;
};

// ─────────────────────────────────────────── profile

export type ProfileDef = BaseDef & {
  readonly profile: ModelProfile;
};

// ─────────────────────────────────────────── storyKind

export type StoryKindDef = BaseDef & {
  readonly nhipMacDinh: number;
  readonly vaiTro: readonly string[];
  /** Chống thiên vị người chơi — mạch truyện không cần người chơi vẫn chạy. */
  readonly canNguoiChoi: boolean;
};

// ─────────────────────────────────────────── mechanism

export type MechanismDef = BaseDef & {
  /** Cơ chế phái sinh từ luật nào — Phần 44. */
  readonly luatNenIds: readonly string[];
  readonly thamSo: z.ZodType;
  readonly apDung?: (ctx: RuntimeCtx) => PatchOp[];
};

// ─────────────────────────────────────────── worldProcess

/** Phần 71.1 — phạm vi một tiến trình chạm tới. */
export const PHAM_VI_TIEN_TRINH = ['entity', 'household', 'place', 'region', 'world'] as const;
export type PhamViTienTrinh = (typeof PHAM_VI_TIEN_TRINH)[number];

export const DON_VI_NHIP = ['tick', 'day', 'week', 'season', 'year', 'era', 'event'] as const;
export type DonViNhip = (typeof DON_VI_NHIP)[number];

/** Phần 71.3 — ba độ phân giải, cộng `adaptive` để engine tự chọn theo ống kính. */
export const DO_PHAN_GIAI = ['micro', 'meso', 'macro', 'adaptive'] as const;
export type DoPhanGiai = (typeof DO_PHAN_GIAI)[number];

/**
 * Khai báo bảo toàn — [BB] Phần 71.4 "tổng thay đổi có giải thích".
 *
 * Nghĩa: trong MỘT lần chạy của tiến trình này, tổng mọi `add` lên **nhóm**
 * `paths` (cộng qua mọi bản ghi của `table`) phải bằng `tong`.
 *
 *   - Trao đổi khai một path, `tong = 0`: hàng rời kho bên này đúng bằng lượng
 *     vào kho bên kia.
 *   - Sản xuất khai hai path, `tong = 0`: gỗ rời rừng đúng bằng gỗ vào kho.
 *     Đây là cách "vật chất không tự sinh" được cưỡng chế ở mức cơ chế, không
 *     phải ở mức lời hứa trong comment.
 *
 * Scheduler kiểm TRƯỚC khi áp patch, nên handler có bug cũng không teleport
 * được vật chất — lô patch của nó bị bỏ và ghi chẩn đoán.
 */
export type KhaiBaoBaoToan = {
  readonly table: string;
  readonly paths: readonly string[];
  readonly tong: number;
  /** Sai số cho phép, để phép cộng dấu phẩy động không báo nhầm. */
  readonly saiSo?: number;
};

/**
 * Tiến trình nền — Phần 71.1 [BB].
 *
 * Handler deterministic nhận state + RNG seeded, trả Event candidate và Patch
 * candidate. **Không viết DB trực tiếp.** Chữ ký runtime nằm ở
 * `core/world/process/types.ts` để registry vẫn là dữ liệu thuần.
 */
export type WorldProcessDef = BaseDef & {
  readonly phamVi: PhamViTienTrinh;
  readonly nhip: {
    readonly unit: DonViNhip;
    readonly every: number;
    /** Với `unit: 'event'` — loại Event nào đánh thức tiến trình. */
    readonly eventTypes: readonly string[];
  };
  readonly doc: readonly StatePath[];
  readonly ghi: readonly StatePath[];
  /** Bất biến phải giữ sau mỗi lần chạy — id tra trong `danhSachInvariant()`. */
  readonly batBien: readonly string[];
  readonly phanGiai: DoPhanGiai;
  /** `set` đụng `set` cùng path: ưu tiên cao thắng (71.4 quy tắc 2). */
  readonly uuTien: number;
  readonly baoToan: readonly KhaiBaoBaoToan[];
  /** Bước nào trong mười bốn bước của 24.1. */
  readonly buocTick: number;
};
