/**
 * Luật Nền và Cơ Chế Phái Sinh — Phần 43.3, 44.2, 44.3.
 *
 * ── Điểm tinh tế nhất của Khối L ──
 *
 * [BB] 43.2 — thế giới **luôn** vận hành theo một cấu hình nào đó; engine cần giá
 * trị để chạy. Nhưng cấu hình ấy có hai trạng thái rất khác nhau:
 *
 * > "Trước khi được đặt tên, thời gian vẫn trôi một chiều — nhưng không ai lợi
 * > dụng được điều đó, vì lợi dụng đòi hỏi phải biết luật."
 *
 * Vì vậy `trangThai` không phải cờ hiển thị. Nó quyết định **có kẽ hở hay không**,
 * **sinh mạch truyện hay không**, và **khai thác được hay không**.
 */
import { z } from 'zod';

/** Bảy trục — 43.4. Thứ tự khai báo LÀ thứ tự phụ thuộc của 43.5. */
export const TRUC_NEN = [
  'khong_gian',
  'thoi_gian',
  'nhan_qua',
  'danh_tinh',
  'sinh_tu',
  'nhan_thuc',
  'van_menh',
] as const;
export type TrucNen = (typeof TRUC_NEN)[number];

/**
 * Thứ tự phụ thuộc — 43.5 [BB].
 *
 * "Đặt tên sai thứ tự → validator trả về mâu thuẫn. Ví dụ không thể khai
 * `van_menh.tuongLai` mà `thoi_gian` còn `vo_danh`."
 */
export const PHU_THUOC_TRUC: Readonly<Record<TrucNen, readonly TrucNen[]>> = Object.freeze({
  khong_gian: Object.freeze([]),
  thoi_gian: Object.freeze([]),
  nhan_qua: Object.freeze(['khong_gian', 'thoi_gian'] as const),
  danh_tinh: Object.freeze([]),
  sinh_tu: Object.freeze(['danh_tinh'] as const),
  nhan_thuc: Object.freeze(['danh_tinh'] as const),
  van_menh: Object.freeze(['thoi_gian', 'nhan_qua'] as const),
});

/** Tham số mặc định PHÀM TỤC của từng trục — dùng khi trục còn `vo_danh` (43.7). */
export const THAM_SO_MAC_DINH: Readonly<Record<TrucNen, Readonly<Record<string, unknown>>>> = Object.freeze({
  khong_gian: Object.freeze({
    toPo: 'mat_phang',
    khoangCach: 'do_luong',
    coTheGap: false,
    ghiDeCucBo: false,
  }),
  thoi_gian: Object.freeze({
    huong: 'mot_chieu',
    toDo: 'dong_nhat',
    quaKhu: 'co_dinh',
    tuongLai: 'chua_ton_tai',
  }),
  nhan_qua: Object.freeze({ thuTu: 'nghiem_ngat', baoToan: true, chamTruuTuong: false }),
  danh_tinh: Object.freeze({ banChat: 'tong_hop', lienTuc: 'theo_ky_uc', saoChep: 'cung_mot_nguoi' }),
  sinh_tu: Object.freeze({ ranhGioi: 'dut_khoat', sauKhiChet: 'mot_coi', hoiSinh: 'khong_the' }),
  nhan_thuc: Object.freeze({
    hieuBietLamSuyYeu: false,
    quanSatLamDinhHinh: false,
    tenGoiCoQuyenNang: false,
  }),
  van_menh: Object.freeze({
    tonTai: false,
    cuongDo: 'goi_y',
    aiDocDuoc: 'khong_ai',
    phanKhang: 'chong_duoc',
    nguonViet: 'khong_ai_no_tu_co',
  }),
});

/** Khái niệm nền của từng trục — 43.3 `khaiNiemNenId` phải khớp một trong số này. */
export const KHAI_NIEM_NEN_CUA_TRUC: Readonly<Record<TrucNen, readonly string[]>> = Object.freeze({
  khong_gian: Object.freeze(['noi_chon', 'khoang_cach'] as const),
  thoi_gian: Object.freeze(['truoc_sau', 'bien_doi'] as const),
  nhan_qua: Object.freeze(['nguyen_nhan', 'hau_qua'] as const),
  danh_tinh: Object.freeze(['ban_nga', 'cung_mot'] as const),
  sinh_tu: Object.freeze(['cai_chet'] as const),
  nhan_thuc: Object.freeze(['biet', 'bi_an'] as const),
  van_menh: Object.freeze(['tat_yeu'] as const),
});

export const SubstrateLawSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    truc: z.enum(TRUC_NEN),

    trangThai: z.enum(['vo_danh', 'co_ten']).prefault('vo_danh'),
    /** [BB] 43.3 — bắt buộc để chuyển sang `co_ten`. Luật nền cũng phải tiếp địa. */
    khaiNiemNenId: z.string().nullable().prefault(null),
    nguoiDatTenId: z.string().nullable().prefault(null),
    tickDatTen: z.number().nullable().prefault(null),

    thamSo: z.record(z.string(), z.unknown()).prefault({}),

    /** Chỉ sinh khi `co_ten` — hiểu biết tạo ra vật lý, và vật lý tạo ra kẽ hở. */
    keHo: z
      .array(z.object({ moTa: z.string(), daBiKhaiThac: z.boolean().prefault(false) }).strict())
      .prefault([]),

    khaNghich: z
      .object({
        duocKhong: z.boolean().prefault(false),
        boiAi: z.enum(['khong_ai', 'sang_the_than', 'than_toi_cao']).prefault('sang_the_than'),
        /** [BB] 43.6 — sửa luật nền LUÔN fork nhánh mới. Mặc định `true` cả bảy trục. */
        batBuocPhanNhanh: z.boolean().prefault(true),
      })
      .prefault({}),
  })
  .strict();

export type SubstrateLaw = z.infer<typeof SubstrateLawSchema>;

// ─────────────────────────────────────────── cơ chế phái sinh

export const CO_CHE_DUNG_SAN = ['than_bi', 'nguyen_diem', 'co_huu_ket_gioi', 'vu_khi_khai_niem'] as const;
export type CoCheId = (typeof CO_CHE_DUNG_SAN)[number];

/**
 * Trạng thái một cơ chế trong một nhánh — 44.4.
 *
 * `moTaKhiKhong` **bắt buộc không rỗng** (44.2 [BB]): nó ép người thiết kế trả
 * lời "thế giới không có thứ này thì khác gì?". Không trả lời được thì cơ chế đó
 * không đáng tồn tại.
 */
export const CoCheRowSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    bat: z.boolean().prefault(false),
    tickBat: z.number().nullable().prefault(null),
    tickTat: z.number().nullable().prefault(null),
    /** Điều kiện còn thiếu, viết cho người đọc — 44.5 "phải nói rõ còn thiếu gì". */
    conThieu: z.array(z.string()).prefault([]),
  })
  .strict();

export type CoCheRow = z.infer<typeof CoCheRowSchema>;

/** 44.3 — Cố Hữu Kết Giới. Chỉ tồn tại khi cơ chế `co_huu_ket_gioi` đang bật. */
export const RealityMarbleSchema = z
  .object({
    id: z.string(),
    chuTheId: z.string(),
    khaiNiemGocId: z.string(),
    luatGhiDe: z.array(z.string()).prefault([]),
    banKinh: z.number(),
    tickConLai: z.number(),
    /** [BB] Trừ vào `realityIntegrity` CỤC BỘ của vùng, không phải toàn cầu. */
    giaThucTai: z.number().prefault(3),
    vungId: z.string().nullable().prefault(null),
  })
  .strict();

export type RealityMarble = z.infer<typeof RealityMarbleSchema>;
