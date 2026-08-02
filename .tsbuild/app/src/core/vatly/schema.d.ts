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
export declare const TRUC_NEN: readonly ["khong_gian", "thoi_gian", "nhan_qua", "danh_tinh", "sinh_tu", "nhan_thuc", "van_menh"];
export type TrucNen = (typeof TRUC_NEN)[number];
/**
 * Thứ tự phụ thuộc — 43.5 [BB].
 *
 * "Đặt tên sai thứ tự → validator trả về mâu thuẫn. Ví dụ không thể khai
 * `van_menh.tuongLai` mà `thoi_gian` còn `vo_danh`."
 */
export declare const PHU_THUOC_TRUC: Readonly<Record<TrucNen, readonly TrucNen[]>>;
/** Tham số mặc định PHÀM TỤC của từng trục — dùng khi trục còn `vo_danh` (43.7). */
export declare const THAM_SO_MAC_DINH: Readonly<Record<TrucNen, Readonly<Record<string, unknown>>>>;
/** Khái niệm nền của từng trục — 43.3 `khaiNiemNenId` phải khớp một trong số này. */
export declare const KHAI_NIEM_NEN_CUA_TRUC: Readonly<Record<TrucNen, readonly string[]>>;
export declare const SubstrateLawSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    truc: z.ZodEnum<{
        khong_gian: "khong_gian";
        thoi_gian: "thoi_gian";
        nhan_qua: "nhan_qua";
        danh_tinh: "danh_tinh";
        sinh_tu: "sinh_tu";
        nhan_thuc: "nhan_thuc";
        van_menh: "van_menh";
    }>;
    trangThai: z.ZodPrefault<z.ZodEnum<{
        vo_danh: "vo_danh";
        co_ten: "co_ten";
    }>>;
    khaiNiemNenId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    nguoiDatTenId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    tickDatTen: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    thamSo: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    keHo: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        moTa: z.ZodString;
        daBiKhaiThac: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
    khaNghich: z.ZodPrefault<z.ZodObject<{
        duocKhong: z.ZodPrefault<z.ZodBoolean>;
        boiAi: z.ZodPrefault<z.ZodEnum<{
            khong_ai: "khong_ai";
            sang_the_than: "sang_the_than";
            than_toi_cao: "than_toi_cao";
        }>>;
        batBuocPhanNhanh: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strict>;
export type SubstrateLaw = z.infer<typeof SubstrateLawSchema>;
export declare const CO_CHE_DUNG_SAN: readonly ["than_bi", "nguyen_diem", "co_huu_ket_gioi", "vu_khi_khai_niem"];
export type CoCheId = (typeof CO_CHE_DUNG_SAN)[number];
/**
 * Trạng thái một cơ chế trong một nhánh — 44.4.
 *
 * `moTaKhiKhong` **bắt buộc không rỗng** (44.2 [BB]): nó ép người thiết kế trả
 * lời "thế giới không có thứ này thì khác gì?". Không trả lời được thì cơ chế đó
 * không đáng tồn tại.
 */
export declare const CoCheRowSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    bat: z.ZodPrefault<z.ZodBoolean>;
    tickBat: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    tickTat: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    conThieu: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type CoCheRow = z.infer<typeof CoCheRowSchema>;
/** 44.3 — Cố Hữu Kết Giới. Chỉ tồn tại khi cơ chế `co_huu_ket_gioi` đang bật. */
export declare const RealityMarbleSchema: z.ZodObject<{
    id: z.ZodString;
    chuTheId: z.ZodString;
    khaiNiemGocId: z.ZodString;
    luatGhiDe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    banKinh: z.ZodNumber;
    tickConLai: z.ZodNumber;
    giaThucTai: z.ZodPrefault<z.ZodNumber>;
    vungId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export type RealityMarble = z.infer<typeof RealityMarbleSchema>;
