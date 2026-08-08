/**
 * Lorebook — Phần 35.2, 51.3, 51.6, 52.3, 52.5, 53.3.
 *
 * ── Ba câu định hình toàn bộ khối này ──
 *
 * [BB] 51.2 — **Sử thắng Nguồn.** Lorebook người dùng nhập là NGUỒN (điều thế
 * giới lẽ ra phải trở thành); lorebook tự sinh là SỬ (điều thế giới đã thực sự
 * trở thành). Mâu thuẫn thì SỬ thắng. Không phải vì sử đúng hơn, mà vì **không
 * được nói dối về chuyện đã rồi**.
 *
 * [BB] 51.6 — **Văn bản không bao giờ tự chứng minh được chính nó.** `doTinCay`
 * chỉ tăng do sự kiện engine, không bao giờ tăng do được nhắc lại trong văn AI.
 *
 * [BB] 52.2 — AI **không bao giờ** sửa hay xóa entry người dùng. Nó chỉ được
 * *che*, và mọi lần che đều hiện lên bảng đối soát.
 */
import { z } from 'zod';

export const NGUON_LOREBOOK = ['nguoi_dung', 'tu_sinh', 'di_san'] as const;
export type NguonLorebook = (typeof NGUON_LOREBOOK)[number];

/**
 * Dải `order` — 51.5 [BB].
 *
 * Giải kiểu xung đột C dứt điểm bằng cách chia dải, không cho đụng nhau. Trình
 * soạn chỉ cho người dùng đánh số trong dải của họ; nhập lorebook có `order`
 * ngoài dải thì **dồn về dải người dùng, giữ nguyên thứ tự tương đối**.
 */
export const DAI_ORDER = Object.freeze({
  nguoi_dung: Object.freeze({ tu: 0, den: 9_999 }),
  tu_sinh: Object.freeze({ tu: 10_000, den: 19_999 }),
  di_san: Object.freeze({ tu: 20_000, den: 29_999 }),
  workflow: Object.freeze({ tu: 30_000, den: 39_999 }),
  he_thong: Object.freeze({ tu: 90_000, den: 999_999 }),
});
export type TenDai = keyof typeof DAI_ORDER;

export function daiCuaNguon(nguon: NguonLorebook): TenDai {
  return nguon === 'nguoi_dung' ? 'nguoi_dung' : nguon === 'di_san' ? 'di_san' : 'tu_sinh';
}

export const LOAI_KY_VONG = ['ton_tai', 'quan_he', 'su_kien', 'quy_luat', 'ket_cuc', 'tinh_cach'] as const;
export type LoaiKyVong = (typeof LOAI_KY_VONG)[number];

export const LoreExpectationConditionSchema = z
  .object({
    kieu: z.enum([
      'ton_tai_kind',
      'ton_tai_ten',
      'ton_tai_tag',
      'ton_tai_link',
      'luat_co_the_tag',
      'khai_niem_ket_tinh',
    ]),
    kind: z.string().prefault(''),
    ten: z.string().prefault(''),
    tag: z.string().prefault(''),
    quanHe: z.string().prefault(''),
    nguong: z.number().prefault(0),
    duongDan: z.string().prefault(''),
  })
  .strict();

/** Neo khai báo đi cùng entry; khác regex ở chỗ tác giả nói rõ engine phải theo dõi gì. */
export const LoreExpectationDeclarationSchema = z
  .object({
    id: z.string(),
    loai: z.enum(LOAI_KY_VONG),
    moTa: z.string().min(1).max(500),
    dieuKien: LoreExpectationConditionSchema,
    doUuTien: z.number().min(0).max(100).prefault(50),
  })
  .strict();

export const LorebookEntrySchema = z
  .object({
    id: z.string(),
    ten: z.string(),
    keys: z.array(z.string()).prefault([]),
    secondaryKeys: z.array(z.string()).prefault([]),
    logic: z.enum(['and_any', 'and_all', 'not_any', 'not_all']).prefault('and_any'),
    /** CHỨA EJS. Render bằng tầng EJS của Phần 32, không bằng nối chuỗi. */
    noiDung: z.string().prefault(''),
    /** `loi` = luôn bật (constant); `sau` = bắn theo keyword. */
    lop: z.enum(['loi', 'sau']).prefault('sau'),
    order: z.number(),
    doSau: z.number().prefault(4),
    xacSuat: z.number().min(0).max(100).prefault(100),
    dinhKem: z.boolean().prefault(false),
    deQuy: z.boolean().prefault(false),
    uocLuongToken: z.number().prefault(0),
    kyVong: z.array(z.string()).prefault([]),
    /** Các entry cùng nhóm cạnh tranh ngân sách truy hồi thay vì cùng tràn vào một cảnh. */
    nhomKichHoat: z.string().prefault(''),
    /** Giai đoạn mở tự nhiên; người chơi vẫn có thể gọi đích danh entry ở giai đoạn muộn. */
    giaiDoanMo: z.number().int().min(0).max(9).prefault(0),
    /** Không tạo entity ngay lúc bật sách; Narrator chỉ hiện thực hóa khi entry đi vào truy hồi. */
    triHoanHienThuc: z.boolean().prefault(false),
    /** Neo engine có cấu trúc; được theo dõi ngay cả khi entity còn trì hoãn. */
    kyVongKhaiBao: z.array(LoreExpectationDeclarationSchema).max(12).prefault([]),

    // ── 51.3: che không phải xóa ──
    trangThai: z.enum(['hoat_dong', 'bi_che', 'da_xoa']).prefault('hoat_dong'),
    biCheBoiId: z.string().nullable().prefault(null),
    lyDoChe: z.string().prefault(''),
    tickChe: z.number().nullable().prefault(null),
    /** [BB] 51.4 — entry khóa canon KHÔNG BAO GIỜ bị che, và điều đó có giá. */
    khoaCanon: z.boolean().prefault(false),
    /** Entity id entry này nói về — nguồn để đối soát theo chủ đề (53.4). */
    chuDe: z.array(z.string()).prefault([]),

    // ── 51.6: tiếp địa cho lorebook ──
    doTinCay: z.number().min(0).max(100).prefault(0),
    suKienChongLung: z.array(z.string()).prefault([]),

    // ── 52.3: xóa mềm ──
    tickXoa: z.number().nullable().prefault(null),
    lyDoXoa: z.string().prefault(''),

    // ── 52.5: lịch sử phiên bản ──
    lichSu: z
      .array(
        z
          .object({
            tick: z.number(),
            boiAi: z.enum(['nguoi_choi', 'ai', 'workflow', 'doi_soat']),
            op: z.string(),
            truoc: z.string(),
            sau: z.string(),
            lyDo: z.string().prefault(''),
          })
          .strict(),
      )
      .max(20)
      .prefault([]),
  })
  .strict();

export type LorebookEntry = z.infer<typeof LorebookEntrySchema>;

export const CONFLICT_POLICY = ['dung_hop', 'song_song', 'tranh_doat'] as const;
export type ConflictPolicy = (typeof CONFLICT_POLICY)[number];

export const LorebookSchema = z
  .object({
    id: z.string(),
    /**
     * Lorebook là bảng THEO NHÁNH (ADR-0046), nên nó mang `branchId` như mọi bản
     * ghi theo nhánh khác. 35.2 không khai trường này vì phần ấy viết trước khi
     * có hệ nhánh; `.prefault('')` để một file nhập vào không phải biết nhánh nào
     * sẽ nhận nó — `ghiState()` ép đúng nhánh lúc ghi.
     */
    branchId: z.string().prefault(''),
    ten: z.string(),
    thanHe: z.string().prefault(''),
    moTa: z.string().prefault(''),
    bat: z.boolean().prefault(false),
    uuTien: z.number().prefault(100),
    /** 0 = chỉ làm ngữ cảnh; 100 = thế giới cố hết sức trở thành thần thoại đó (35.4). */
    lucHapDan: z.number().min(0).max(100).prefault(60),
    version: z.string().prefault('1.0'),
    nguon: z.enum(NGUON_LOREBOOK).prefault('nguoi_dung'),
    conflictPolicy: z.enum(CONFLICT_POLICY).prefault('song_song'),
    /** Số tick để mở thêm một lớp thần thoại. */
    nhipMoGiaiDoan: z.number().int().min(1).max(10_000).prefault(8),
    /** Số điểm hút được chủ động gợi mỗi lượt; entry được gọi đích danh không chịu trần này. */
    soDiemHutMoiLuot: z.number().int().min(1).max(8).prefault(3),
    /** Tick bắt đầu lần bật hiện tại; null khi sách đang tắt. */
    tickBat: z.number().int().nullable().prefault(null),
    entries: z.array(LorebookEntrySchema).prefault([]),
  })
  .strict();

export type Lorebook = z.infer<typeof LorebookSchema>;

// ─────────────────────────────────────────── kỳ vọng và dị bản

export const TRANG_THAI_KY_VONG = ['cho', 'da_thoa', 'da_lech', 'bat_kha'] as const;
export type TrangThaiKyVong = (typeof TRANG_THAI_KY_VONG)[number];

/**
 * 35.4 — lorebook là LỰC HẤP DẪN, không phải kịch bản.
 *
 * `dieuKienThoaMan` là `ExprNode` chứ không phải chuỗi eval: cùng lý do với
 * `lawful.dieuKien` (ADR-0003) — dữ liệu người dùng nhập không được trở thành mã
 * chạy được. Bản mô tả người đọc nằm ở `moTa`.
 */
export const LoreExpectationSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    lorebookId: z.string(),
    entryId: z.string(),
    loai: z.enum(LOAI_KY_VONG),
    moTa: z.string(),
    /** Vị từ khai báo được engine kiểm; xem `kyVong.ts`. */
    dieuKien: LoreExpectationConditionSchema,
    trangThai: z.enum(TRANG_THAI_KY_VONG).prefault('cho'),
    doUuTien: z.number().min(0).max(100).prefault(50),
    lyDoLech: z.string().prefault(''),
    tickLech: z.number().nullable().prefault(null),
    /** Entity/link gần nhất đã thỏa; lưu trong state để phát hiện khi nó biến mất. */
    thoaBoiId: z.string().nullable().prefault(null),
  })
  .strict();

export type LoreExpectation = z.infer<typeof LoreExpectationSchema>;

/**
 * Dị Bản — 35.5 [BB].
 *
 * "Đây không phải bảng lỗi. Nó là hồ sơ về việc thế giới của người chơi đã trở
 * thành cái gì." Bốn trường bắt buộc của 35.5 nằm ở đây, và `nguyenNhan` phải
 * truy được về hành động cụ thể của ai, tick nào.
 */
export const DiBanSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    kyVongId: z.string(),
    kyVongGoc: z.string(),
    thucTe: z.string(),
    nguyenNhan: z
      .object({
        tick: z.number().int(),
        chuTheId: z.string().nullable().prefault(null),
        eventIds: z.array(z.string()).prefault([]),
        moTa: z.string(),
      })
      .strict(),
    /** Gap engine sinh ra để thế giới tự lấp chỗ trống theo hướng mới. */
    gapId: z.string().nullable().prefault(null),
    /** Câu ghi vào biên niên sử, giọng kể chuyện — 35.5 mục 3. */
    dongBienNien: z.string(),
    tickGhi: z.number().int(),
  })
  .strict();

export type DiBan = z.infer<typeof DiBanSchema>;

// ─────────────────────────────────────────── hằng số 53.3

/** [MR] 53.3 — trần token một entry và số chủ đề tối đa. */
export const TRAN_TOKEN_ENTRY = 400;
export const SO_CHU_DE_TOI_DA = 2;
/** 53.4 — dưới ngưỡng này thì entry LƯU nhưng KHÔNG nạp. */
export const NGUONG_TIN_CAY_NAP = 20;
