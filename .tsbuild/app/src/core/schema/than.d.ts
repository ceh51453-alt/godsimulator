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
export declare const LOAI_CAU: readonly ["xin_cuu", "ta_on", "nguyen_rua", "hoi_dap", "dang_hien", "thach_thuc"];
export type LoaiCau = (typeof LOAI_CAU)[number];
/**
 * [BB] 22.3 — bốn cách, cả bốn đều có hậu quả.
 * `lam_ngo` là lựa chọn **hạng nhất**, không phải "bỏ qua": nó có UI ngang hàng
 * ba cách kia và ghi vào Sổ Nhân Quả như mọi hành động khác.
 */
export declare const CACH_TRA_LOI: readonly ["chua", "ban_phuoc", "lam_ngo", "trung_phat", "dau_hieu", "tra_gia"];
export type CachTraLoi = (typeof CACH_TRA_LOI)[number];
export declare const PrayerSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    nguoiCauId: z.ZodString;
    thanNhanId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    loai: z.ZodEnum<{
        xin_cuu: "xin_cuu";
        ta_on: "ta_on";
        nguyen_rua: "nguyen_rua";
        hoi_dap: "hoi_dap";
        dang_hien: "dang_hien";
        thach_thuc: "thach_thuc";
    }>;
    noiDung: z.ZodString;
    cuongDo: z.ZodPrefault<z.ZodNumber>;
    goc: z.ZodObject<{
        ducVongThieu: z.ZodString;
        canTroId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        diemMongMuon: z.ZodPrefault<z.ZodNumber>;
        khaThi: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>;
    tickCau: z.ZodNumber;
    hanChot: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    daTraLoi: z.ZodPrefault<z.ZodBoolean>;
    cachTraLoi: z.ZodPrefault<z.ZodEnum<{
        chua: "chua";
        ban_phuoc: "ban_phuoc";
        lam_ngo: "lam_ngo";
        trung_phat: "trung_phat";
        dau_hieu: "dau_hieu";
        tra_gia: "tra_gia";
    }>>;
    tickTraLoi: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    eventTraLoiId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    soNguoi: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
export type Prayer = z.infer<typeof PrayerSchema>;
/** Hậu quả dài hạn của từng cách trả lời — bảng 22.3, dưới dạng dữ liệu. */
export declare const HAU_QUA_TRA_LOI: Readonly<Record<Exclude<CachTraLoi, 'chua'>, {
    nhan: string;
    phuThuoc: number;
    thatVong: number;
    soHai: number;
    yeuGhet: number;
    tinNguong: number;
}>>;
export declare const LOAI_RANG_BUOC: readonly ["bao_ho", "cam_ky", "cong_nap", "phuc_vu", "khong_can_thiep", "tra_on", "hon_uoc"];
/**
 * Một điều khoản. `benGiu` là bên PHẢI làm — và nó trỏ được về vị thần.
 * Đó là điểm khác biệt giữa giao ước và điều răn.
 */
export declare const DieuKhoanSchema: z.ZodObject<{
    id: z.ZodString;
    benGiu: z.ZodString;
    loai: z.ZodEnum<{
        bao_ho: "bao_ho";
        cam_ky: "cam_ky";
        cong_nap: "cong_nap";
        phuc_vu: "phuc_vu";
        khong_can_thiep: "khong_can_thiep";
        tra_on: "tra_on";
        hon_uoc: "hon_uoc";
    }>;
    noiDung: z.ZodString;
    tickHetHan: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    daViPham: z.ZodPrefault<z.ZodBoolean>;
    tickViPham: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strict>;
export declare const GiaoUocSchema: z.ZodPrefault<z.ZodObject<{
    benAId: z.ZodString;
    benBId: z.ZodString;
    tickKy: z.ZodNumber;
    tickTan: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    dieuKhoan: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        benGiu: z.ZodString;
        loai: z.ZodEnum<{
            bao_ho: "bao_ho";
            cam_ky: "cam_ky";
            cong_nap: "cong_nap";
            phuc_vu: "phuc_vu";
            khong_can_thiep: "khong_can_thiep";
            tra_on: "tra_on";
            hon_uoc: "hon_uoc";
        }>;
        noiDung: z.ZodString;
        tickHetHan: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        daViPham: z.ZodPrefault<z.ZodBoolean>;
        tickViPham: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>;
    chungNhanIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    nghiThucId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    trangThai: z.ZodPrefault<z.ZodEnum<{
        hieu_luc: "hieu_luc";
        da_pha: "da_pha";
        het_han: "het_han";
        huy_thuan: "huy_thuan";
    }>>;
    giaPha: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
export type DieuKhoan = z.infer<typeof DieuKhoanSchema>;
export type GiaoUoc = z.infer<typeof GiaoUocSchema>;
/**
 * Giao ước hợp lệ khi mỗi bên có ÍT NHẤT một điều khoản mình phải giữ.
 *
 * [BB] 69.2 — "thần cũng bị ràng buộc". Một văn bản chỉ ràng bên dưới thì không
 * phải giao ước; bất biến `giao_uoc_rang_buoc_hai_ben` từ chối nó.
 */
export declare function giaoUocCanBang(g: GiaoUoc): boolean;
