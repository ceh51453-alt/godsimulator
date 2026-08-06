/**
 * Bản ngã thần và vòng đời domain — Phần 69.1, 69.4 [BB].
 *
 * ── Vì sao phải tách bốn lớp ──
 *
 * Phần 12.2 nói Dị Hóa kéo `soul.banTinh` về phía `venerable.banTinhTinDoTin`.
 * Nếu cài đúng chữ đó thì tick sẽ **âm thầm ghi đè tính cách lõi**, và người chơi
 * mở save ra thấy mình đã thành người khác mà không có một dòng nào giải thích.
 *
 * 69.1 sửa lại: Dị Hóa tạo **áp lực và tình huống**, không tạo phép gán.
 *
 *   coreSelf             điều vị thần TỰ NHẬN là mình — chỉ đổi qua Event
 *   followerImage        điều tín đồ TIN — tick đổi được thoải mái
 *   officialDoctrine     điều thể chế NÓI — bị dịch, bị sửa, bị lợi dụng
 *   currentManifestation điều thế giới THẤY — hợp của ba lớp trên
 *   pressure             khoảng cách giữa lõi và hình ảnh, cùng những nét
 *                        đang bị đòi hỏi hoặc bị đè xuống
 *
 * [BB] "Không tick nào tự sửa tính cách lõi mà không có Event giải thích."
 * Bất biến `coreself_khong_bi_sua_am_tham` cưỡng chế điều này.
 */
import { z } from 'zod';
import { BanTinhSchema, BAN_TINH_TRUC } from './soul.js';

/** Bốn cách một vị thần đáp lại áp lực Dị Hóa — 69.1. */
export const CACH_DAP_DI_HOA = ['chap_nhan', 'chong_lai', 'mac_ca', 'phan_than'] as const;
export type CachDapDiHoa = (typeof CACH_DAP_DI_HOA)[number];

/**
 * Trần sổ tình huống Dị Hóa đang chờ.
 *
 * Xuất ra để `world/process/than.ts` cắt theo ĐÚNG con số schema đòi. Trước đây
 * con số này chỉ nằm trong `.max(8)` còn tiến trình thì `push` mãi — trần thành
 * một lời hứa suông, và mảng dài tới chín mươi ba phần tử sau bốn trăm nhịp.
 */
export const TRAN_TINH_HUONG_MO = 8;

export const DivineIdentitySchema = z
  .object({
    /**
     * Điều vị thần tự nhận là mình.
     * [BB] Chỉ đổi qua Event có `loai` nằm trong `EVENT_DUOC_SUA_CORESELF`.
     */
    coreSelf: BanTinhSchema,
    /** Điều tín đồ tin. Tick đổi được — đây chính là chỗ Dị Hóa tác động. */
    followerImage: BanTinhSchema,
    /** Điều thể chế nói ra. Chuỗi tự do vì giáo lý là ngôn ngữ, không phải số. */
    officialDoctrine: z.array(z.string().max(300)).max(24).prefault([]),
    /** Điều thế giới thấy — hợp của ba lớp trên, do engine tính. */
    currentManifestation: BanTinhSchema,

    pressure: z
      .object({
        /** Khoảng cách lõi ↔ hình ảnh, chuẩn hóa về 0–100. */
        distortion: z.number().min(0).max(100).prefault(0),
        /** Nét vị thần có thật nhưng tín đồ không cho phép. */
        suppressedTraits: z.array(z.enum(BAN_TINH_TRUC)).prefault([]),
        /** Nét tín đồ đòi hỏi mà vị thần không có. */
        demandedTraits: z.array(z.enum(BAN_TINH_TRUC)).prefault([]),
        /** Tình huống engine đã đặt ra và đang chờ vị thần chọn cách đáp. */
        tinhHuongMo: z
          .array(
            z
              .object({
                id: z.string(),
                truc: z.enum(BAN_TINH_TRUC),
                moTa: z.string(),
                tickSinh: z.number().int(),
                /** Bỏ trống nghĩa là chưa chọn — áp lực tiếp tục tích. */
                daChon: z.enum(CACH_DAP_DI_HOA).nullable().prefault(null),
              })
              .strict(),
          )
          .max(TRAN_TINH_HUONG_MO)
          .prefault([]),
      })
      .prefault({}),

    /** Lịch sử mỗi lần lõi đổi, kèm Event giải thích. Không có Event thì không đổi. */
    lichSuLoi: z
      .array(
        z
          .object({
            tick: z.number().int(),
            truc: z.enum(BAN_TINH_TRUC),
            tu: z.number(),
            den: z.number(),
            eventId: z.string(),
            lyDo: z.string(),
          })
          .strict(),
      )
      .max(64)
      .prefault([]),
  })
  .prefault({});

/**
 * [BB] Chỉ Event thuộc những loại này mới được chạm `coreSelf`.
 *
 * Cả bốn đều là **lựa chọn của một chủ thể**, không phải kết quả của một phép
 * nhân trong tick. Đó là toàn bộ khác biệt giữa "bạn trở thành thứ người ta
 * tưởng bạn là" (bi kịch) và "engine sửa nhân vật của bạn" (bug).
 */
export const EVENT_DUOC_SUA_CORESELF = [
  'than_chap_nhan_di_hoa',
  'than_chong_lai_di_hoa',
  'than_mac_ca_giao_ly',
  'than_phan_than',
  'than_tu_dinh_nghia',
] as const;

// ─────────────────────────────────────────── vòng đời domain (69.4)

export const TRANG_THAI_DOMAIN = [
  'held',
  'contested',
  'dormant',
  'fragmented',
  'transformed',
  'merged',
  'lost',
  'reclaimable',
] as const;
export type TrangThaiDomain = (typeof TRANG_THAI_DOMAIN)[number];

/** Nhãn tiếng Việt cho UI — [BB] 36.7 không dùng thuật ngữ Anh trong giao diện. */
export const NHAN_TRANG_THAI_DOMAIN: Readonly<Record<TrangThaiDomain, string>> = Object.freeze({
  held: 'đang giữ',
  contested: 'đang tranh',
  dormant: 'ngủ yên',
  fragmented: 'đã vỡ',
  transformed: 'đã đổi nghĩa',
  merged: 'đã hợp',
  lost: 'mất rồi',
  reclaimable: 'còn đường lấy lại',
});

/**
 * Neo tái chiếm — thứ giữ cho một domain đã tắt vẫn còn đường quay lại.
 *
 * [BB] 69.4: "Mất vĩnh viễn chỉ khi mọi vật mang, ký ức, link và luật tiếp địa
 * đều đứt." Nên `lost` không phải hệ quả của `suc = 0`; nó là hệ quả của việc
 * danh sách này rỗng.
 */
export const NeoTaiChiemSchema = z
  .object({
    loai: z.enum(['vat_mang', 'ky_uc', 'link', 'luat_tiep_dia', 'nghi_thuc', 'di_san']),
    refId: z.string(),
    moTa: z.string().prefault(''),
  })
  .strict();

export const DomainStateSchema = z
  .object({
    ten: z.string(),
    /** [BB] 78.7 — người chơi KHÔNG tự khai. Chỉ engine đổi qua quy kết (19.2). */
    suc: z.number().min(0).max(100).prefault(50),
    trangThai: z.enum(TRANG_THAI_DOMAIN).prefault('held'),
    /**
     * Neo còn lại. Rỗng + `suc = 0` mới là `lost`.
     * Còn dù chỉ một neo thì trạng thái là `reclaimable`.
     */
    neoTaiChiem: z.array(NeoTaiChiemSchema).prefault([]),
    /** Thần khác đang cùng quy kết. */
    doiThuIds: z.array(z.string()).prefault([]),
    /** Domain này tách ra từ / hợp vào domain nào. */
    goc: z.string().nullable().prefault(null),
    tickDoiTrangThai: z.number().int().prefault(0),
  })
  .strict();

export type DivineIdentity = z.infer<typeof DivineIdentitySchema>;
export type NeoTaiChiem = z.infer<typeof NeoTaiChiemSchema>;
export type DomainState = z.infer<typeof DomainStateSchema>;

// ─────────────────────────────────────────── tiện ích thuần

/**
 * Khoảng cách hai vector bản tính, chuẩn hóa về 0–100.
 *
 * Đo bằng **trục lệch nhiều nhất**, không bằng cạnh huyền sáu chiều.
 *
 * Lý do là chuyện ngữ nghĩa chứ không phải toán: bị tin là tàn nhẫn trong khi
 * mình từ bi là một sự xuyên tạc TOÀN PHẦN, dù năm trục còn lại khớp hoàn hảo.
 * Chuẩn hóa theo cạnh huyền sáu chiều chia con số ấy cho √6 và biến một sự
 * đánh tráo danh tính thành "lệch 16" — dưới mọi ngưỡng, nên Dị Hóa không bao
 * giờ kích hoạt. Đo được điều đó khi chạy thật, không khi đọc lại công thức.
 */
export function khoangCachBanTinh(
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
): number {
  let max = 0;
  for (const truc of BAN_TINH_TRUC) {
    const d = Math.abs((a[truc] ?? 0) - (b[truc] ?? 0));
    if (d > max) max = d;
  }
  // Một trục lệch tối đa 200 (từ -100 tới +100) — đó là 100% xuyên tạc.
  return Math.round((max / 200) * 100 * 100) / 100;
}

/**
 * Hình hiện tại của vị thần trong mắt thế giới.
 *
 * Không phải trung bình cộng: giáo lý chính thức **khuếch đại** hình ảnh tín đồ,
 * vì thể chế nói to hơn từng người. Vị thần càng ít hiển thánh thì thế giới càng
 * chỉ thấy phần tín đồ dựng nên.
 */
export function hinhHienTai(
  coreSelf: Readonly<Record<string, number>>,
  followerImage: Readonly<Record<string, number>>,
  hienThanh: number,
): Record<string, number> {
  const trongSoLoi = Math.max(0, Math.min(100, hienThanh)) / 100;
  const ra: Record<string, number> = {};
  for (const truc of BAN_TINH_TRUC) {
    const loi = coreSelf[truc] ?? 0;
    const anh = followerImage[truc] ?? 0;
    ra[truc] = Math.round(loi * trongSoLoi + anh * (1 - trongSoLoi));
  }
  return ra;
}

/**
 * Trạng thái domain suy từ dữ liệu, không phải do ai đặt tay.
 * [BB] `suc = 0` KHÔNG tự động là `lost` — xem 69.4.
 */
export function trangThaiSuyRa(d: DomainState): TrangThaiDomain {
  if (d.trangThai === 'merged' || d.trangThai === 'transformed' || d.trangThai === 'fragmented') {
    return d.trangThai;
  }
  if (d.suc <= 0) return d.neoTaiChiem.length > 0 ? 'reclaimable' : 'lost';
  if (d.doiThuIds.length > 0) return 'contested';
  if (d.suc < 8) return 'dormant';
  return 'held';
}
