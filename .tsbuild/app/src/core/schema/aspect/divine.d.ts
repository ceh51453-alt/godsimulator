/** Aspect `domain`, `venerable`, `divisible` — Phần 12.1; vòng đời domain 69.4. */
import { z } from 'zod';
export declare const DomainSchema: z.ZodPrefault<z.ZodObject<{
    domains: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        ten: z.ZodString;
        suc: z.ZodPrefault<z.ZodNumber>;
        trangThai: z.ZodPrefault<z.ZodEnum<{
            lost: "lost";
            dormant: "dormant";
            held: "held";
            contested: "contested";
            fragmented: "fragmented";
            transformed: "transformed";
            merged: "merged";
            reclaimable: "reclaimable";
        }>>;
        neoTaiChiem: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            loai: z.ZodEnum<{
                link: "link";
                di_san: "di_san";
                vat_mang: "vat_mang";
                ky_uc: "ky_uc";
                luat_tiep_dia: "luat_tiep_dia";
                nghi_thuc: "nghi_thuc";
            }>;
            refId: z.ZodString;
            moTa: z.ZodPrefault<z.ZodString>;
        }, z.core.$strict>>>;
        doiThuIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        goc: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        tickDoiTrangThai: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>>;
    khaiNiemGocId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    laKhoiNguyen: z.ZodPrefault<z.ZodBoolean>;
    thanHeId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>>;
export declare const VenerableSchema: z.ZodPrefault<z.ZodObject<{
    tinDoIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    soTinDoUocLuong: z.ZodPrefault<z.ZodNumber>;
    matDoDen: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    hienThanh: z.ZodPrefault<z.ZodNumber>;
    banTinhTinDoTin: z.ZodPrefault<z.ZodObject<{
        tuBi_tanNhan: z.ZodPrefault<z.ZodNumber>;
        kieuNgao_khiemNhuong: z.ZodPrefault<z.ZodNumber>;
        trungThanh_phanTrac: z.ZodPrefault<z.ZodNumber>;
        ducVong_tietChe: z.ZodPrefault<z.ZodNumber>;
        tratTu_phongTung: z.ZodPrefault<z.ZodNumber>;
        canDam_khiepNhuoc: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    doLechDiHoa: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
export declare const DivisibleSchema: z.ZodPrefault<z.ZodObject<{
    banTheGocId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    phanThanIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    doPhanKy: z.ZodPrefault<z.ZodNumber>;
    nguongHopNhat: z.ZodPrefault<z.ZodNumber>;
    thamQuyenDuocChia: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
/** Hóa thân — Phần 19.4. Khi hóa thân, chieu() của thần tụt xuống mức phàm nhân. */
export declare const AvatarSchema: z.ZodObject<{
    thanId: z.ZodString;
    thanTheId: z.ZodString;
    mucQuen: z.ZodPrefault<z.ZodNumber>;
    dieuKienThucTinh: z.ZodPrefault<z.ZodString>;
    daThucTinh: z.ZodPrefault<z.ZodBoolean>;
    quyenNangConLai: z.ZodPrefault<z.ZodNumber>;
    neuChet: z.ZodPrefault<z.ZodEnum<{
        ve_than: "ve_than";
        mat_vinh_vien: "mat_vinh_vien";
        tai_sinh: "tai_sinh";
    }>>;
    tickHaPham: z.ZodNumber;
}, z.core.$strict>;
export type Domain = z.infer<typeof DomainSchema>;
export type Venerable = z.infer<typeof VenerableSchema>;
export type Divisible = z.infer<typeof DivisibleSchema>;
export type Avatar = z.infer<typeof AvatarSchema>;
