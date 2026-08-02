/**
 * Lời cầu và giao ước — Phần 22, 69.2.
 *
 * Hai thứ này là lý do tầng Thần có việc để làm mà không cần một cái quest log.
 *
 *   - **Lời cầu** là thế giới tự tìm đến người chơi. [BB] 22.2 — nó KHÔNG được
 *     AI bịa; mỗi lời cầu phải truy được về một bế tắc thật trong mô phỏng.
 *   - **Giao ước** là thứ duy nhất trong game ràng buộc CẢ vị thần. Một lời hứa
 *     mà chỉ bên dưới phải giữ thì không phải giao ước, nó là mệnh lệnh.
 */
import { z } from 'zod';

// ─────────────────────────────────────────── lời cầu (Phần 22.1)

export const LOAI_CAU = ['xin_cuu', 'ta_on', 'nguyen_rua', 'hoi_dap', 'dang_hien', 'thach_thuc'] as const;
export type LoaiCau = (typeof LOAI_CAU)[number];

/**
 * [BB] 22.3 — bốn cách, cả bốn đều có hậu quả.
 * `lam_ngo` là lựa chọn **hạng nhất**, không phải "bỏ qua": nó có UI ngang hàng
 * ba cách kia và ghi vào Sổ Nhân Quả như mọi hành động khác.
 */
export const CACH_TRA_LOI = ['chua', 'ban_phuoc', 'lam_ngo', 'trung_phat', 'dau_hieu', 'tra_gia'] as const;
export type CachTraLoi = (typeof CACH_TRA_LOI)[number];

export const PrayerSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    nguoiCauId: z.string(),
    /** null = cầu chung, chưa gọi tên ai. Thần nào cũng nghe được. */
    thanNhanId: z.string().nullable().prefault(null),
    loai: z.enum(LOAI_CAU),
    noiDung: z.string().max(400),
    cuongDo: z.number().min(0).max(100).prefault(50),

    /**
     * [BB] 22.2 — gốc của lời cầu, sinh từ utility AI chứ không bịa.
     * `ducVongThieu` là dục vọng NPC muốn mà `khaThi()` không cho, `canTroId` là
     * thứ chặn họ. Không có hai trường này thì lời cầu là đồ trang trí.
     */
    goc: z
      .object({
        ducVongThieu: z.string(),
        canTroId: z.string().nullable().prefault(null),
        /** Điểm utility mà NPC không với tới được — bằng chứng bế tắc là thật. */
        diemMongMuon: z.number().prefault(0),
        khaThi: z.number().min(0).max(1).prefault(0),
      })
      .strict(),

    tickCau: z.number().int(),
    hanChot: z.number().int().nullable().prefault(null),
    daTraLoi: z.boolean().prefault(false),
    cachTraLoi: z.enum(CACH_TRA_LOI).prefault('chua'),
    tickTraLoi: z.number().int().nullable().prefault(null),
    /** Event ghi lại việc trả lời — kể cả khi cách trả lời là làm ngơ. */
    eventTraLoiId: z.string().nullable().prefault(null),

    /**
     * Nhịp Vĩnh Kiếp gộp lời cầu thành làn sóng (22.4).
     * `soNguoi > 1` nghĩa là dòng này đại diện cho ngần ấy người cầu cùng một điều.
     */
    soNguoi: z.number().int().min(1).prefault(1),
  })
  .strict();

export type Prayer = z.infer<typeof PrayerSchema>;

/** Hậu quả dài hạn của từng cách trả lời — bảng 22.3, dưới dạng dữ liệu. */
export const HAU_QUA_TRA_LOI: Readonly<
  Record<
    Exclude<CachTraLoi, 'chua'>,
    { nhan: string; phuThuoc: number; thatVong: number; soHai: number; yeuGhet: number; tinNguong: number }
  >
> = Object.freeze({
  ban_phuoc: { nhan: 'Ban phước', phuThuoc: 6, thatVong: -12, soHai: 0, yeuGhet: 8, tinNguong: 6 },
  // [BB] Làm ngơ KHÔNG phải "không có gì xảy ra". Thất vọng tích lại và có ngưỡng.
  lam_ngo: { nhan: 'Làm ngơ', phuThuoc: -2, thatVong: 14, soHai: 0, yeuGhet: -6, tinNguong: -4 },
  trung_phat: { nhan: 'Trừng phạt', phuThuoc: 2, thatVong: 6, soHai: 18, yeuGhet: -20, tinNguong: 10 },
  // Rẻ nhất, thú vị nhất: không giải quyết gì, nhưng người ta TỰ diễn giải.
  dau_hieu: { nhan: 'Cho một dấu hiệu', phuThuoc: 1, thatVong: -4, soHai: 2, yeuGhet: 3, tinNguong: 5 },
  tra_gia: { nhan: 'Đổi lấy một giá', phuThuoc: 3, thatVong: -8, soHai: 4, yeuGhet: 2, tinNguong: 7 },
});

// ─────────────────────────────────────────── giao ước (Phần 69.2)

export const LOAI_RANG_BUOC = [
  'bao_ho',
  'cam_ky',
  'cong_nap',
  'phuc_vu',
  'khong_can_thiep',
  'tra_on',
  'hon_uoc',
] as const;

/**
 * Một điều khoản. `benGiu` là bên PHẢI làm — và nó trỏ được về vị thần.
 * Đó là điểm khác biệt giữa giao ước và điều răn.
 */
export const DieuKhoanSchema = z
  .object({
    id: z.string(),
    benGiu: z.string(),
    loai: z.enum(LOAI_RANG_BUOC),
    noiDung: z.string().max(300),
    /** Bỏ trống nghĩa là vĩnh viễn — và vĩnh viễn là một lời hứa rất nặng. */
    tickHetHan: z.number().int().nullable().prefault(null),
    daViPham: z.boolean().prefault(false),
    tickViPham: z.number().int().nullable().prefault(null),
  })
  .strict();

export const GiaoUocSchema = z
  .object({
    /** [BB] Hai bên, không phải một bên ra lệnh. Cả hai đều có điều khoản. */
    benAId: z.string(),
    benBId: z.string(),
    tickKy: z.number().int(),
    tickTan: z.number().int().nullable().prefault(null),
    dieuKhoan: z.array(DieuKhoanSchema).min(1),
    /** Chứng nhân làm giao ước khó chối. Thiếu chứng nhân thì dễ phủi. */
    chungNhanIds: z.array(z.string()).prefault([]),
    /** Nghi thức đã lập ước — không có nghi thức thì đây chỉ là lời nói suông. */
    nghiThucId: z.string().nullable().prefault(null),
    trangThai: z.enum(['hieu_luc', 'da_pha', 'het_han', 'huy_thuan']).prefault('hieu_luc'),
    /** Uy tín mất khi phá — áp cho BÊN PHÁ, kể cả khi đó là thần. */
    giaPha: z.number().min(0).max(100).prefault(30),
  })
  .prefault({
    benAId: '',
    benBId: '',
    tickKy: 0,
    dieuKhoan: [{ id: 'dk_0', benGiu: '', loai: 'bao_ho', noiDung: '' }],
  });

export type DieuKhoan = z.infer<typeof DieuKhoanSchema>;
export type GiaoUoc = z.infer<typeof GiaoUocSchema>;

/**
 * Giao ước hợp lệ khi mỗi bên có ÍT NHẤT một điều khoản mình phải giữ.
 *
 * [BB] 69.2 — "thần cũng bị ràng buộc". Một văn bản chỉ ràng bên dưới thì không
 * phải giao ước; bất biến `giao_uoc_rang_buoc_hai_ben` từ chối nó.
 */
export function giaoUocCanBang(g: GiaoUoc): boolean {
  const coA = g.dieuKhoan.some((d) => d.benGiu === g.benAId);
  const coB = g.dieuKhoan.some((d) => d.benGiu === g.benBId);
  return coA && coB;
}
