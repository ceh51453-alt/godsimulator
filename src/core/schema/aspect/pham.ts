/**
 * Aspect tầng Phàm Nhân — Phần 70.2, 70.3, 70.5 [BB].
 *
 * ── Ba thứ một đời người cần mà bốn mươi hai aspect cũ không có ──
 *
 * `mortal` của Phase 0 đã có tuổi, thân thể thô, lịch và kỹ năng. Đủ để một NPC
 * tồn tại, không đủ để một NPC **sống**. Ba thứ còn thiếu:
 *
 *   sinh_ke   người ta làm gì cả ngày, học của ai, dạy cho ai
 *   ho        người ta ở với ai, ăn chung kho nào, chịu chung nghĩa vụ gì
 *   can_cuoc  người ta là ai trong mắt thiết chế: phường nào, án gì, quyền gì
 *
 * Ba cái này không phải "thêm trường cho đẹp". Chúng là ba chỗ duy nhất mà một
 * đời bình thường để lại dấu vết: nghề truyền cho ai, nhà chia cho ai, và tên
 * mình còn nằm trong sổ nào.
 *
 * [BB] 56.2 — không cái nào trong đây đi thẳng ra tầng phàm nhân dưới dạng số.
 * `chieu()` dịch chúng thành điều nhân vật *biết*, và `soTay.ts` viết ra thành câu.
 */
import { z } from 'zod';
import { ObligationSchema } from '../../contracts/primitives.js';

// ─────────────────────────────────────────── sinh kế (70.2)

/**
 * Bậc nghề. Không phải "level": nó là thứ người khác **công nhận**, nên nó đổi
 * chậm hơn kỹ năng thật và có lúc lệch hẳn. Một người giỏi mà chưa ai gọi là
 * thợ cả thì vẫn là thợ bạn.
 */
export const BAC_NGHE = ['hoc_viec', 'tho_ban', 'tho_ca', 'bac_thay'] as const;
export type BacNghe = (typeof BAC_NGHE)[number];

export const NHAN_BAC_NGHE: Readonly<Record<BacNghe, string>> = Object.freeze({
  hoc_viec: 'học việc',
  tho_ban: 'thợ bạn',
  tho_ca: 'thợ cả',
  bac_thay: 'bậc thầy',
});

/**
 * Tên nghề bằng tiếng Việt có dấu — [BB] 36.7, giao diện không hiện chuỗi máy.
 *
 * Id nghề là `snake_case` không dấu vì nó là khóa dữ liệu. Đưa thẳng nó lên Sổ
 * Tay cho ra "thợ bạn dan luoi", và đó là thứ phá vỡ ảo giác "trang giấy của
 * chính nhân vật" nhanh hơn bất kỳ con số nào.
 */
export const NHAN_NGHE: Readonly<Record<string, string>> = Object.freeze({
  nghe_dan_luoi: 'đan lưới',
  nghe_lam_ruong: 'làm ruộng',
  nghe_gom: 'làm gốm',
  nghe_moc: 'mộc',
  nghe_san: 'săn',
  nghe_buon: 'buôn',
  nghe_chua: 'chữa bệnh',
  nghe_det: 'dệt',
  nghe_ren: 'rèn',
});

/** Nghề chưa có nhãn thì bỏ tiền tố và thay gạch dưới — vẫn đọc được. */
export function nhanNghe(ngheId: string | null): string {
  if (ngheId === null || ngheId.trim() === '') return '';
  return NHAN_NGHE[ngheId] ?? ngheId.replace(/^nghe_/, '').replace(/_/g, ' ');
}

/** Ngưỡng kỹ năng THẬT cần có để được công nhận lên bậc. */
export const NGUONG_BAC: Readonly<Record<BacNghe, number>> = Object.freeze({
  hoc_viec: 0,
  tho_ban: 25,
  tho_ca: 55,
  bac_thay: 82,
});

export const SinhKeSchema = z
  .object({
    /** Nghề đang sống bằng. `null` là thất nghiệp, và đó là một trạng thái thật. */
    ngheId: z.string().nullable().prefault(null),
    bac: z.enum(BAC_NGHE).prefault('hoc_viec'),
    /** Nơi làm việc — xưởng, ruộng, bến. Khác nơi ở. */
    noiLamId: z.string().nullable().prefault(null),
    /** Người đang dạy mình. Học nghề là một QUAN HỆ, không phải một bộ đếm. */
    thayId: z.string().nullable().prefault(null),
    hocTroIds: z.array(z.string()).max(6).prefault([]),
    /** Số nhịp đã thật sự làm nghề này. Kỹ năng lên từ đây, không từ nút bấm. */
    soNhipDaLam: z.number().int().min(0).prefault(0),
    /** Sản lượng nhịp gần nhất — thứ nuôi được hộ hay không. */
    thuNhapGanNhat: z.number().min(0).prefault(0),
    /** Nghề từng làm, để "đổi nghề" có nghĩa và "quay lại nghề cũ" cũng vậy. */
    ngheDaTung: z.array(z.string()).max(8).prefault([]),
    /** Đang bị cấm hành nghề bởi thiết chế nào. */
    biCamBoiId: z.string().nullable().prefault(null),
  })
  .prefault({});

// ─────────────────────────────────────────── hộ (70.2)

export const VAI_TRONG_HO = ['chu_ho', 'ban_doi', 'con', 'nguoi_gia', 'nguoi_o', 'khach_tru'] as const;
export type VaiTrongHo = (typeof VAI_TRONG_HO)[number];

export const NHAN_VAI_HO: Readonly<Record<VaiTrongHo, string>> = Object.freeze({
  chu_ho: 'chủ nhà',
  ban_doi: 'bạn đời',
  con: 'con',
  nguoi_gia: 'người già trong nhà',
  nguoi_o: 'người ở',
  khach_tru: 'khách trọ',
});

export const HoSchema = z
  .object({
    chuHoId: z.string().nullable().prefault(null),
    thanhVien: z
      .array(z.object({ id: z.string(), vai: z.enum(VAI_TRONG_HO).prefault('con') }).strict())
      .max(24)
      .prefault([]),
    /** Kho chung. Ăn chung nghĩa là đói chung — đó là toàn bộ điểm của hộ. */
    kho: z
      .object({
        luongThuc: z.number().min(0).prefault(0),
        vatLieu: z.number().min(0).prefault(0),
      })
      .strict()
      .prefault({}),
    noiOId: z.string().nullable().prefault(null),
    tickLap: z.number().int().prefault(0),
    tickTan: z.number().int().nullable().prefault(null),
    /** Hộ này tách ra từ hộ nào — dòng dõi của một cái nhà. */
    hoGocId: z.string().nullable().prefault(null),
    nghiaVu: z.array(ObligationSchema).max(12).prefault([]),
    /** Thứ tự thừa kế do hộ tự khai; rỗng thì engine suy theo huyết thống. */
    thuTuThuaKe: z.array(z.string()).max(12).prefault([]),
  })
  .prefault({});

// ─────────────────────────────────────────── căn cước (70.2)

export const TRANG_THAI_PHAP_LY = [
  'tu_do',
  'le_thuoc',
  'dang_bi_truy',
  'dang_chiu_an',
  'bi_luu_day',
] as const;
export type TrangThaiPhapLy = (typeof TRANG_THAI_PHAP_LY)[number];

export const CanCuocSchema = z
  .object({
    /** Phường nghề, giáo phái, quân đội, triều đình — thứ gì có `institutional`. */
    hoiIds: z.array(z.string()).max(8).prefault([]),
    phapLy: z.enum(TRANG_THAI_PHAP_LY).prefault('tu_do'),
    /**
     * Án đã chịu. Giữ cả án đã xong: một người từng bị xử vẫn là người từng bị
     * xử, và hàng xóm nhớ điều đó lâu hơn thiết chế.
     */
    an: z
      .array(
        z
          .object({
            id: z.string(),
            toi: z.string().max(200),
            xuBoiId: z.string().nullable().prefault(null),
            tickXu: z.number().int(),
            tickManHan: z.number().int().nullable().prefault(null),
          })
          .strict(),
      )
      .max(12)
      .prefault([]),
    /** Người khác nhớ tới mình vì việc gì. Nuôi đường "anh linh hóa thần" (20.3). */
    duocNhoBoi: z.number().min(0).prefault(0),
    /** Việc khiến người ta nhớ. Câu chữ, không phải điểm. */
    tiengTam: z.array(z.string().max(200)).max(8).prefault([]),
  })
  .prefault({});

// ─────────────────────────────────────────── thương tích (70.5)

/**
 * [BB] 70.5 — "Chấn thương có vị trí, nguyên nhân, điều trị, biến chứng và di chứng."
 *
 * `ConditionRecord` của Phần 0 có `kind` và `severity`, đủ cho một bộ đếm. Bốn
 * trường dưới đây là thứ biến một con số thành một câu chuyện: gãy **chân trái**
 * vì **ngã giàn giáo**, ai chữa, và cái đau khi trở trời còn lại mãi.
 */
export const VI_TRI_THAN_THE = [
  'dau',
  'than',
  'tay_trai',
  'tay_phai',
  'chan_trai',
  'chan_phai',
  'trong',
] as const;
export type ViTriThanThe = (typeof VI_TRI_THAN_THE)[number];

export const NHAN_VI_TRI: Readonly<Record<ViTriThanThe, string>> = Object.freeze({
  dau: 'đầu',
  than: 'mình',
  tay_trai: 'tay trái',
  tay_phai: 'tay phải',
  chan_trai: 'chân trái',
  chan_phai: 'chân phải',
  trong: 'bên trong',
});

export const ThuongTichSchema = z
  .object({
    id: z.string(),
    loai: z.enum(['gay', 'rach', 'bong', 'benh', 'kiet_suc', 'nhiem_doc', 'tuoi_gia']),
    viTri: z.enum(VI_TRI_THAN_THE).prefault('than'),
    nang: z.number().min(0).max(1).prefault(0.3),
    tickBatDau: z.number().int(),
    /** Chuỗi Event dẫn tới nó. [BB] 70.5 — nguyên nhân là chuỗi, không phải chuỗi ký tự. */
    nguyenNhanEventIds: z.array(z.string()).max(8).prefault([]),
    /** Ai đang chăm. `null` nghĩa là không ai — và đó thường là lý do nó thành di chứng. */
    nguoiChamId: z.string().nullable().prefault(null),
    trangThai: z.enum(['moi', 'dang_lanh', 'da_lanh', 'bien_chung', 'di_chung']).prefault('moi'),
    /** Câu mô tả di chứng còn lại sau khi lành. Rỗng nghĩa là lành hẳn. */
    diChung: z.string().max(200).prefault(''),
  })
  .strict();

export type SinhKe = z.infer<typeof SinhKeSchema>;
export type Ho = z.infer<typeof HoSchema>;
export type CanCuoc = z.infer<typeof CanCuocSchema>;
export type ThuongTich = z.infer<typeof ThuongTichSchema>;

// ─────────────────────────────────────────── tiện ích thuần

/** Bậc mà kỹ năng này ĐỦ ĐIỀU KIỆN để được công nhận. */
export function bacTheoKyNang(kyNang: number): BacNghe {
  if (kyNang >= NGUONG_BAC.bac_thay) return 'bac_thay';
  if (kyNang >= NGUONG_BAC.tho_ca) return 'tho_ca';
  if (kyNang >= NGUONG_BAC.tho_ban) return 'tho_ban';
  return 'hoc_viec';
}

/**
 * Thương tích này chặn những việc gì.
 *
 * [BB] 70.5 — "Mệt, đói và đau ảnh hưởng affordance, không chỉ trừ một điểm."
 * Trả về **tên việc** chứ không trả về số: chỗ dùng nó là bộ thu affordance, và
 * bộ thu ấy cần biết "không mang vác được", không cần biết "−12 sức".
 */
export function viecBiChan(t: ThuongTich): readonly string[] {
  if (t.trangThai === 'da_lanh') return [];
  const nang = t.trangThai === 'di_chung' ? Math.min(t.nang, 0.4) : t.nang;
  if (nang < 0.2) return [];

  const ra: string[] = [];
  if (t.viTri === 'chan_trai' || t.viTri === 'chan_phai') {
    ra.push('di_xa');
    if (nang >= 0.5) ra.push('chay', 'dung_lau');
  }
  if (t.viTri === 'tay_trai' || t.viTri === 'tay_phai') {
    ra.push('mang_vac');
    if (nang >= 0.5) ra.push('che_tac', 'danh_nhau');
  }
  if (t.viTri === 'dau') {
    ra.push('hoc');
    if (nang >= 0.5) ra.push('thuong_luong');
  }
  if (t.loai === 'benh' || t.loai === 'nhiem_doc') ra.push('gan_nguoi_khac');
  if (t.loai === 'kiet_suc') ra.push('lam_viec_nang');
  return ra;
}

/** Câu người ta nói về vết thương này — [BB] 56.2, không con số. */
export function keVeThuongTich(t: ThuongTich): string {
  const noi = NHAN_VI_TRI[t.viTri];
  if (t.trangThai === 'di_chung') {
    return t.diChung !== '' ? t.diChung : `${noi} không còn như trước.`;
  }
  if (t.trangThai === 'da_lanh') return `${noi} đã lành.`;
  const muc = t.nang >= 0.7 ? 'nặng' : t.nang >= 0.35 ? '' : 'nhẹ';
  const loai =
    t.loai === 'gay'
      ? 'gãy'
      : t.loai === 'rach'
        ? 'rách'
        : t.loai === 'bong'
          ? 'bỏng'
          : t.loai === 'benh'
            ? 'đang ốm'
            : t.loai === 'kiet_suc'
              ? 'kiệt sức'
              : t.loai === 'nhiem_doc'
                ? 'trúng độc'
                : 'tuổi tác';
  const cham = t.nguoiChamId === null ? ', không ai chăm' : '';
  return `${noi} ${loai}${muc === '' ? '' : ` ${muc}`}${cham}.`;
}
