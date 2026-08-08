/**
 * Aspect `mortal`, `genealogical`, `spatial`, `carrier` — Khối C + Khối S.
 * Thế giới có vật chất thật; chỉ meta-currency của NGƯỜI CHƠI bị cấm (Phần 61.1 #7).
 */
import { z } from 'zod';
import {
  ConditionRecordSchema,
  ScheduleBlockSchema,
  ClaimSchema,
  ObligationSchema,
} from '../../contracts/primitives.js';
import { ThuongTichSchema } from './pham.js';

export const MortalSchema = z
  .object({
    tuoiTho: z.number().min(0).prefault(70),
    tickSinh: z.number().int().prefault(0),
    tickTu: z.number().int().nullable().prefault(null),
    ageBand: z.enum(['child', 'youth', 'adult', 'elder']).prefault('adult'),
    mucTieuDoiNguoi: z.array(z.string().max(300)).max(8).prefault([]),
    /**
     * Thân thể thật, không phải thanh HP.
     *
     * Phase 7 nới rộng khối này thay vì dựng một aspect `than_the` song song.
     * Lý do là bài học của `coreSelf` (69.1): cùng một sự thật ghi ở hai chỗ thì
     * sẽ có đúng một đường ghi chỉ chạm một bên, và nó lệch âm thầm. Trường mới
     * đều có prefault nên save Phase 5–6 parse nguyên vẹn.
     */
    thanThe: z
      .object({
        sinhLuc: z.number().min(0).max(100).prefault(100),
        theLuc: z.number().min(0).max(100).prefault(100),
        doDoi: z.number().min(0).max(100).prefault(0),
        /** Đau tích lại từ thương tích chưa lành. Nó chặn việc, không trừ điểm. */
        dau: z.number().min(0).max(100).prefault(0),
        /** Đã mắc và khỏi bệnh gì — miễn dịch là lịch sử, không phải một cờ. */
        daMac: z.array(z.string()).max(16).prefault([]),
        conditions: z.array(ConditionRecordSchema).prefault([]),
        /** [BB] 70.5 — thương tích có vị trí, nguyên nhân, người chăm và di chứng. */
        thuongTich: z.array(ThuongTichSchema).max(12).prefault([]),
      })
      .prefault({}),
    /**
     * [BB] 70.5 — "Chết có thể tới từ chuỗi nguyên nhân; `nguyenNhanChet` lưu
     * chuỗi event, không chỉ một string."
     */
    nguyenNhanChet: z.array(z.string()).max(8).prefault([]),
    lich: z.array(ScheduleBlockSchema).prefault([]),
    ngheId: z.string().nullable().prefault(null),
    hoId: z.string().nullable().prefault(null),
    kyNang: z.record(z.string(), z.number().min(0).max(100)).prefault({}),
    soHuu: z.array(ClaimSchema).prefault([]),
    boiVu: z.array(ObligationSchema).prefault([]),
  })
  .prefault({});

export const GenealogicalSchema = z
  .object({
    chaMeIds: z.array(z.string()).prefault([]),
    conIds: z.array(z.string()).prefault([]),
    theHe: z.number().int().prefault(0),
    huyetMachId: z.string().nullable().prefault(null),
  })
  .prefault({});

export const SpatialSchema = z
  .object({
    chaId: z.string().nullable().prefault(null),
    toaDo: z.object({ x: z.number().prefault(0), y: z.number().prefault(0) }).prefault({}),
    banKinh: z.number().min(0).prefault(1),
    /** Luật cục bộ đè luật vũ trụ trong ranh giới này. */
    luatCucBoIds: z.array(z.string()).prefault([]),
    vanHoaId: z.string().nullable().prefault(null),
    danSo: z.number().min(0).prefault(0),
    doPhuThuoc: z.number().min(0).max(100).prefault(0),
    /** Địa lý linh thiêng phải có cường độ, nguồn và lịch sử hành hương thật. */
    thieng: z
      .object({
        mucDo: z.number().min(0).max(100).prefault(0),
        loai: z.enum(['thuong', 'thanh_dia', 'truc_the_gioi', 'cua_coi', 'mo_coi']).prefault('thuong'),
        thanIds: z.array(z.string()).max(12).prefault([]),
        nguonThiengIds: z.array(z.string()).max(12).prefault([]),
        luotHanhHuong: z.number().int().min(0).prefault(0),
      })
      .prefault({}),
  })
  .prefault({});

export const CarrierSchema = z
  .object({
    khaiNiemMangIds: z.array(z.string()).prefault([]),
    chuSoHuuId: z.string().nullable().prefault(null),
    lichSuDiQua: z
      .array(
        z
          .object({
            tick: z.number().int(),
            chuId: z.string(),
            suKienId: z.string().nullable().prefault(null),
          })
          .strict(),
      )
      .prefault([]),
    nhiemBanChat: z.string().prefault(''),
  })
  .prefault({});

/** Kẻ Thù Vĩnh Cửu — Phần 12.5. Bước 6 của vòng lặp tick. */
export const AdversarialSchema = z
  .object({
    phuDinh: z
      .object({
        loai: z.enum(['mot_luat', 'trat_tu', 'mot_than', 'ton_tai']).prefault('trat_tu'),
        mucTieuId: z.string().nullable().prefault(null),
      })
      .prefault({}),
    dieuKhoanBatTu: z
      .object({
        loai: z
          .enum(['tai_sinh_tu_thu_no_chong', 'song_lai_khi_bi_quen', 'moi_chu_ky_mot_lan', 'khong_the_giet'])
          .prefault('tai_sinh_tu_thu_no_chong'),
        moTa: z.string().prefault(''),
      })
      .prefault({}),
    nhip: z.enum(['hang_dem', 'theo_mua', 'moi_ky_nguyen', 'chi_o_tan_the']).prefault('moi_ky_nguyen'),
    lanCuoiTroiDay: z.number().prefault(0),
    soLanBiDayLui: z.number().prefault(0),
  })
  .prefault({});

/**
 * Thiết chế. Bốn trường cuối vào từ Phase 5 (`institution_governance`, Phần 71.2):
 * thiết chế phải THU được thuế, GIỮ được kho và KẾ VỊ được, nếu không nó chỉ là
 * một cái nhãn dán lên bản đồ.
 */
export const InstitutionalSchema = z
  .object({
    moHinhCaiTri: z
      .enum(['hoi_dong', 'quan_chu', 'than_quyen', 'bo_lac', 'vo_chinh_phu', 'quan_lieu'])
      .prefault('hoi_dong'),
    keVi: z.enum(['huyet_thong', 'bau_cu', 'chi_dinh', 'thu_thach', 'khong_co']).prefault('khong_co'),
    thanhVienIds: z.array(z.string()).prefault([]),
    giaoLyIds: z.array(z.string()).prefault([]),
    thanhLapTick: z.number().int().prefault(0),

    /** Vùng thật sự chịu cai trị. Không có vùng thì không thu được gì. */
    vungCaiTriIds: z.array(z.string()).prefault([]),
    /** Phần lương thực thu mỗi kỳ. Thu quá tay thì `onDinh` tụt. */
    thueSuat: z.number().min(0).max(0.6).prefault(0.05),
    khoCong: z
      .object({ luongThuc: z.number().min(0).prefault(0), vatLieu: z.number().min(0).prefault(0) })
      .strict()
      .prefault({}),
    chucVu: z
      .array(
        z
          .object({
            id: z.string(),
            ten: z.string(),
            nguoiGiuId: z.string().nullable().prefault(null),
            tickNhamChuc: z.number().int().prefault(0),
            tickHetNhiemKy: z.number().int().nullable().prefault(null),
          })
          .strict(),
      )
      .prefault([]),
    onDinh: z.number().min(0).max(100).prefault(60),
  })
  .prefault({});

export type Mortal = z.infer<typeof MortalSchema>;
export type Genealogical = z.infer<typeof GenealogicalSchema>;
export type Spatial = z.infer<typeof SpatialSchema>;
export type Carrier = z.infer<typeof CarrierSchema>;
export type Adversarial = z.infer<typeof AdversarialSchema>;
export type Institutional = z.infer<typeof InstitutionalSchema>;
