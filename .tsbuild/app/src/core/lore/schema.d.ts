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
export declare const NGUON_LOREBOOK: readonly ["nguoi_dung", "tu_sinh", "di_san"];
export type NguonLorebook = (typeof NGUON_LOREBOOK)[number];
/**
 * Dải `order` — 51.5 [BB].
 *
 * Giải kiểu xung đột C dứt điểm bằng cách chia dải, không cho đụng nhau. Trình
 * soạn chỉ cho người dùng đánh số trong dải của họ; nhập lorebook có `order`
 * ngoài dải thì **dồn về dải người dùng, giữ nguyên thứ tự tương đối**.
 */
export declare const DAI_ORDER: Readonly<{
    nguoi_dung: Readonly<{
        tu: 0;
        den: 9999;
    }>;
    tu_sinh: Readonly<{
        tu: 10000;
        den: 19999;
    }>;
    di_san: Readonly<{
        tu: 20000;
        den: 29999;
    }>;
    workflow: Readonly<{
        tu: 30000;
        den: 39999;
    }>;
    he_thong: Readonly<{
        tu: 90000;
        den: 999999;
    }>;
}>;
export type TenDai = keyof typeof DAI_ORDER;
export declare function daiCuaNguon(nguon: NguonLorebook): TenDai;
export declare const LorebookEntrySchema: z.ZodObject<{
    id: z.ZodString;
    ten: z.ZodString;
    keys: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    secondaryKeys: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    logic: z.ZodPrefault<z.ZodEnum<{
        and_any: "and_any";
        and_all: "and_all";
        not_any: "not_any";
        not_all: "not_all";
    }>>;
    noiDung: z.ZodPrefault<z.ZodString>;
    lop: z.ZodPrefault<z.ZodEnum<{
        loi: "loi";
        sau: "sau";
    }>>;
    order: z.ZodNumber;
    doSau: z.ZodPrefault<z.ZodNumber>;
    xacSuat: z.ZodPrefault<z.ZodNumber>;
    dinhKem: z.ZodPrefault<z.ZodBoolean>;
    deQuy: z.ZodPrefault<z.ZodBoolean>;
    uocLuongToken: z.ZodPrefault<z.ZodNumber>;
    kyVong: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    nhomKichHoat: z.ZodPrefault<z.ZodString>;
    giaiDoanMo: z.ZodPrefault<z.ZodNumber>;
    triHoanHienThuc: z.ZodPrefault<z.ZodBoolean>;
    trangThai: z.ZodPrefault<z.ZodEnum<{
        hoat_dong: "hoat_dong";
        bi_che: "bi_che";
        da_xoa: "da_xoa";
    }>>;
    biCheBoiId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    lyDoChe: z.ZodPrefault<z.ZodString>;
    tickChe: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    khoaCanon: z.ZodPrefault<z.ZodBoolean>;
    chuDe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    doTinCay: z.ZodPrefault<z.ZodNumber>;
    suKienChongLung: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    tickXoa: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    lyDoXoa: z.ZodPrefault<z.ZodString>;
    lichSu: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        tick: z.ZodNumber;
        boiAi: z.ZodEnum<{
            workflow: "workflow";
            nguoi_choi: "nguoi_choi";
            ai: "ai";
            doi_soat: "doi_soat";
        }>;
        op: z.ZodString;
        truoc: z.ZodString;
        sau: z.ZodString;
        lyDo: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type LorebookEntry = z.infer<typeof LorebookEntrySchema>;
export declare const CONFLICT_POLICY: readonly ["dung_hop", "song_song", "tranh_doat"];
export type ConflictPolicy = (typeof CONFLICT_POLICY)[number];
export declare const LorebookSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodPrefault<z.ZodString>;
    ten: z.ZodString;
    thanHe: z.ZodPrefault<z.ZodString>;
    moTa: z.ZodPrefault<z.ZodString>;
    bat: z.ZodPrefault<z.ZodBoolean>;
    uuTien: z.ZodPrefault<z.ZodNumber>;
    lucHapDan: z.ZodPrefault<z.ZodNumber>;
    version: z.ZodPrefault<z.ZodString>;
    nguon: z.ZodPrefault<z.ZodEnum<{
        nguoi_dung: "nguoi_dung";
        tu_sinh: "tu_sinh";
        di_san: "di_san";
    }>>;
    conflictPolicy: z.ZodPrefault<z.ZodEnum<{
        dung_hop: "dung_hop";
        song_song: "song_song";
        tranh_doat: "tranh_doat";
    }>>;
    nhipMoGiaiDoan: z.ZodPrefault<z.ZodNumber>;
    soDiemHutMoiLuot: z.ZodPrefault<z.ZodNumber>;
    tickBat: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    entries: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        ten: z.ZodString;
        keys: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        secondaryKeys: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        logic: z.ZodPrefault<z.ZodEnum<{
            and_any: "and_any";
            and_all: "and_all";
            not_any: "not_any";
            not_all: "not_all";
        }>>;
        noiDung: z.ZodPrefault<z.ZodString>;
        lop: z.ZodPrefault<z.ZodEnum<{
            loi: "loi";
            sau: "sau";
        }>>;
        order: z.ZodNumber;
        doSau: z.ZodPrefault<z.ZodNumber>;
        xacSuat: z.ZodPrefault<z.ZodNumber>;
        dinhKem: z.ZodPrefault<z.ZodBoolean>;
        deQuy: z.ZodPrefault<z.ZodBoolean>;
        uocLuongToken: z.ZodPrefault<z.ZodNumber>;
        kyVong: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        nhomKichHoat: z.ZodPrefault<z.ZodString>;
        giaiDoanMo: z.ZodPrefault<z.ZodNumber>;
        triHoanHienThuc: z.ZodPrefault<z.ZodBoolean>;
        trangThai: z.ZodPrefault<z.ZodEnum<{
            hoat_dong: "hoat_dong";
            bi_che: "bi_che";
            da_xoa: "da_xoa";
        }>>;
        biCheBoiId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        lyDoChe: z.ZodPrefault<z.ZodString>;
        tickChe: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        khoaCanon: z.ZodPrefault<z.ZodBoolean>;
        chuDe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        doTinCay: z.ZodPrefault<z.ZodNumber>;
        suKienChongLung: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        tickXoa: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        lyDoXoa: z.ZodPrefault<z.ZodString>;
        lichSu: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            tick: z.ZodNumber;
            boiAi: z.ZodEnum<{
                workflow: "workflow";
                nguoi_choi: "nguoi_choi";
                ai: "ai";
                doi_soat: "doi_soat";
            }>;
            op: z.ZodString;
            truoc: z.ZodString;
            sau: z.ZodString;
            lyDo: z.ZodPrefault<z.ZodString>;
        }, z.core.$strict>>>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type Lorebook = z.infer<typeof LorebookSchema>;
export declare const LOAI_KY_VONG: readonly ["ton_tai", "quan_he", "su_kien", "quy_luat", "ket_cuc", "tinh_cach"];
export type LoaiKyVong = (typeof LOAI_KY_VONG)[number];
export declare const TRANG_THAI_KY_VONG: readonly ["cho", "da_thoa", "da_lech", "bat_kha"];
export type TrangThaiKyVong = (typeof TRANG_THAI_KY_VONG)[number];
/**
 * 35.4 — lorebook là LỰC HẤP DẪN, không phải kịch bản.
 *
 * `dieuKienThoaMan` là `ExprNode` chứ không phải chuỗi eval: cùng lý do với
 * `lawful.dieuKien` (ADR-0003) — dữ liệu người dùng nhập không được trở thành mã
 * chạy được. Bản mô tả người đọc nằm ở `moTa`.
 */
export declare const LoreExpectationSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    lorebookId: z.ZodString;
    entryId: z.ZodString;
    loai: z.ZodEnum<{
        ton_tai: "ton_tai";
        quan_he: "quan_he";
        su_kien: "su_kien";
        quy_luat: "quy_luat";
        ket_cuc: "ket_cuc";
        tinh_cach: "tinh_cach";
    }>;
    moTa: z.ZodString;
    dieuKien: z.ZodObject<{
        kieu: z.ZodEnum<{
            ton_tai_kind: "ton_tai_kind";
            ton_tai_ten: "ton_tai_ten";
            ton_tai_tag: "ton_tai_tag";
            ton_tai_link: "ton_tai_link";
            luat_co_the_tag: "luat_co_the_tag";
            khai_niem_ket_tinh: "khai_niem_ket_tinh";
        }>;
        kind: z.ZodPrefault<z.ZodString>;
        ten: z.ZodPrefault<z.ZodString>;
        tag: z.ZodPrefault<z.ZodString>;
        quanHe: z.ZodPrefault<z.ZodString>;
        nguong: z.ZodPrefault<z.ZodNumber>;
        duongDan: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>;
    trangThai: z.ZodPrefault<z.ZodEnum<{
        cho: "cho";
        da_thoa: "da_thoa";
        da_lech: "da_lech";
        bat_kha: "bat_kha";
    }>>;
    doUuTien: z.ZodPrefault<z.ZodNumber>;
    lyDoLech: z.ZodPrefault<z.ZodString>;
    tickLech: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    thoaBoiId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export type LoreExpectation = z.infer<typeof LoreExpectationSchema>;
/**
 * Dị Bản — 35.5 [BB].
 *
 * "Đây không phải bảng lỗi. Nó là hồ sơ về việc thế giới của người chơi đã trở
 * thành cái gì." Bốn trường bắt buộc của 35.5 nằm ở đây, và `nguyenNhan` phải
 * truy được về hành động cụ thể của ai, tick nào.
 */
export declare const DiBanSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    kyVongId: z.ZodString;
    kyVongGoc: z.ZodString;
    thucTe: z.ZodString;
    nguyenNhan: z.ZodObject<{
        tick: z.ZodNumber;
        chuTheId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        eventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        moTa: z.ZodString;
    }, z.core.$strict>;
    gapId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    dongBienNien: z.ZodString;
    tickGhi: z.ZodNumber;
}, z.core.$strict>;
export type DiBan = z.infer<typeof DiBanSchema>;
/** [MR] 53.3 — trần token một entry và số chủ đề tối đa. */
export declare const TRAN_TOKEN_ENTRY = 400;
export declare const SO_CHU_DE_TOI_DA = 2;
/** 53.4 — dưới ngưỡng này thì entry LƯU nhưng KHÔNG nạp. */
export declare const NGUONG_TIN_CAY_NAP = 20;
