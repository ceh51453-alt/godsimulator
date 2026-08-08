/** Aspect `soul` — dùng chung thần và phàm. Phần 11.1 [BB]. */
import { z } from 'zod';

export const TANG_NPC = ['t0', 't1', 't2', 't3'] as const;
export type TangNpc = (typeof TANG_NPC)[number];

export const BanTinhSchema = z
  .object({
    tuBi_tanNhan: z.number().min(-100).max(100).prefault(0),
    kieuNgao_khiemNhuong: z.number().min(-100).max(100).prefault(0),
    trungThanh_phanTrac: z.number().min(-100).max(100).prefault(0),
    ducVong_tietChe: z.number().min(-100).max(100).prefault(0),
    tratTu_phongTung: z.number().min(-100).max(100).prefault(0),
    canDam_khiepNhuoc: z.number().min(-100).max(100).prefault(0),
  })
  .prefault({});

export const BAN_TINH_TRUC = [
  'tuBi_tanNhan',
  'kieuNgao_khiemNhuong',
  'trungThanh_phanTrac',
  'ducVong_tietChe',
  'tratTu_phongTung',
  'canDam_khiepNhuoc',
] as const;

export const LOAI_CAM_XUC = [
  'phan_no',
  'so_hai',
  'yeu_thuong',
  'ghen_ti',
  'buon_ba',
  'han_hoan',
  'xau_ho',
  'khinh_bi',
  'hy_vong',
  'tuyet_vong',
] as const;

/**
 * Quan hệ MỘT CHIỀU — Phần 11.2 [BB].
 *
 * Khác `RelationStateSchema` ở đúng một chỗ: không có `tuId`/`denId`, vì nó nằm
 * **trong** hồn của chủ thể và được khóa bằng id người kia. Nhờ vậy mọi trường
 * đều có prefault, và một patch chỉ chạm `anTuong` vẫn cho ra bản ghi hợp lệ —
 * điều kiện bắt buộc để pha 2 của `apDungPatch` không từ chối cả lô.
 */
export const QuanHeMotChieuSchema = z
  .object({
    thanSo: z.number().min(-100).max(100).prefault(0),
    yeuGhet: z.number().min(-100).max(100).prefault(0),
    tinNgo: z.number().min(-100).max(100).prefault(0),
    noOn: z.number().min(-100).max(100).prefault(0),
    /** [BB] 56.2 quy tắc 4 — Sổ Tay kể quan hệ bằng câu này, không bằng bốn trục. */
    anTuong: z.string().max(300).prefault(''),
    kyUcChungIds: z.array(z.string()).max(3).prefault([]),
    /** Người này giờ chỉ còn là huyền thoại với chủ thể — 20.3, 29.3. */
    laHuyenThoai: z.boolean().prefault(false),
    /** Cách gọi: cha, vợ, bạn cũ, sư phụ. Câu chữ, do đời sống đặt ra. */
    xungHo: z.string().max(60).prefault(''),
  })
  .prefault({});

export const SoulSchema = z
  .object({
    tang: z.enum(TANG_NPC).prefault('t1'),

    banTinh: BanTinhSchema,

    /** TỔNG = 100. Input của utility AI. */
    ducVong: z
      .object({
        quyenLuc: z.number().prefault(12),
        triThuc: z.number().prefault(12),
        tinhAi: z.number().prefault(12),
        baoThu: z.number().prefault(12),
        anToan: z.number().prefault(16),
        danhTieng: z.number().prefault(12),
        tinNguong: z.number().prefault(12),
        tuDo: z.number().prefault(12),
      })
      .prefault({}),

    /** [BB] Cảm xúc PHẢI có đối tượng và nguyên nhân, nếu không nó vô dụng. */
    tamTrang: z
      .array(
        z
          .object({
            loai: z.enum(LOAI_CAM_XUC),
            doiTuongId: z.string().nullable().prefault(null),
            cuongDo: z.number().min(0).max(100).prefault(0),
            suyGiam: z.number().prefault(0.94),
            nguonGocKyUcId: z.string().nullable().prefault(null),
          })
          .strict(),
      )
      .prefault([]),

    kyUc: z
      .array(
        z
          .object({
            id: z.string(),
            tomTat: z.string(),
            tick: z.number(),
            dienTich: z.number().min(0).max(100).prefault(50),
            lienQuan: z.array(z.string()).prefault([]),
          })
          .strict(),
      )
      .prefault([]),

    /** Điểm phân biệt thần với người: thần nhớ nguyên vẹn mọi xúc phạm. */
    kyUcSuyGiam: z.boolean().prefault(true),
    agency: z.number().min(0).max(100).prefault(100),

    /** Hậu kiếp là trạng thái mô phỏng, không phải một câu kể sau màn hình chết. */
    hauKiep: z
      .object({
        trangThai: z
          .enum([
            'dang_song',
            'luu_lac',
            'o_coi_chet',
            'cho_phan_xet',
            'cho_luan_hoi',
            'to_tien',
            'tan_bien',
            'tai_sinh',
          ])
          .prefault('dang_song'),
        realmId: z.string().nullable().prefault(null),
        tickChet: z.number().int().nullable().prefault(null),
        phanXetBoiId: z.string().nullable().prefault(null),
        soVong: z.number().int().min(0).prefault(0),
        kyUcMangTheoIds: z.array(z.string()).max(8).prefault([]),
      })
      .prefault({}),

    /**
     * Điều CHỦ THỂ NÀY nghĩ về từng người khác. Khóa là id người kia.
     *
     * [BB] 11.2 — "hai record riêng, không đồng bộ". Cất bản ghi của mỗi bên
     * trong chính hồn của bên ấy là cách cưỡng chế điều đó ở mức cấu trúc: không
     * có chỗ nào để viết một quan hệ "chung" cho cả hai, nên không ai vô tình
     * đồng bộ chúng.
     *
     * Thêm ở Phase 7 vì đây là lúc đối thoại bắt đầu sinh ra quan hệ thật.
     */
    quanHe: z.record(z.string(), QuanHeMotChieuSchema).prefault({}),
  })
  .prefault({});

/** Phần 61.2: `SoulCoreSchema = SoulSchema`. */
export const SoulCoreSchema = SoulSchema;

/** Quan hệ — bốn trục, bất đối xứng. Phần 11.2 [BB]: hai record riêng, không đồng bộ. */
export const RelationStateSchema = z
  .object({
    tuId: z.string(),
    denId: z.string(),
    thanSo: z.number().min(-100).max(100).prefault(0),
    yeuGhet: z.number().min(-100).max(100).prefault(0),
    tinNgo: z.number().min(-100).max(100).prefault(0),
    noOn: z.number().min(-100).max(100).prefault(0),
    anTuong: z.string().prefault(''),
    kyUcChungIds: z.array(z.string()).max(3).prefault([]),
    laHuyenThoai: z.boolean().prefault(false),
  })
  .strict();

export type LoaiCamXuc = (typeof LOAI_CAM_XUC)[number];
export type BanTinh = z.infer<typeof BanTinhSchema>;
export type Soul = z.infer<typeof SoulSchema>;
export type RelationState = z.infer<typeof RelationStateSchema>;
export type QuanHeMotChieu = z.infer<typeof QuanHeMotChieuSchema>;
