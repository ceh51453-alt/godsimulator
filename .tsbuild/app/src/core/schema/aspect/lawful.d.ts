/**
 * Aspect `lawful` — Định Luật. Phần 9.1.
 *
 * [BB] Phần 18.2: `lawful.vanBan` KHÔNG BAO GIỜ đến được tầng phàm nhân.
 * Phàm nhân chỉ thấy `dienGiai` của vùng mình — tức bản đã sai.
 */
import { z } from 'zod';
export declare const PHAM_VI_LUAT: readonly ["vu_tru", "coi", "vung", "chung_loai", "huyet_mach", "ca_the"];
export declare const LawfulSchema: z.ZodPrefault<z.ZodObject<{
    vanBan: z.ZodPrefault<z.ZodString>;
    phamVi: z.ZodPrefault<z.ZodObject<{
        loai: z.ZodPrefault<z.ZodEnum<{
            vung: "vung";
            vu_tru: "vu_tru";
            coi: "coi";
            chung_loai: "chung_loai";
            huyet_mach: "huyet_mach";
            ca_the: "ca_the";
        }>>;
        mucTieu: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    kichHoat: z.ZodPrefault<z.ZodObject<{
        suKien: z.ZodPrefault<z.ZodString>;
        dieuKien: z.ZodPrefault<z.ZodType<import("../../contracts/primitives.js").ExprNode, unknown, z.core.$ZodTypeInternals<import("../../contracts/primitives.js").ExprNode, unknown>>>;
    }, z.core.$strip>>;
    hieuUng: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        duongDan: z.ZodString;
        phep: z.ZodEnum<{
            set: "set";
            push: "push";
            add: "add";
            mul: "mul";
            remove: "remove";
            flag: "flag";
        }>;
        giaTri: z.ZodUnknown;
    }, z.core.$strict>>>;
    ngoaiLe: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        dieuKien: z.ZodType<import("../../contracts/primitives.js").ExprNode, unknown, z.core.$ZodTypeInternals<import("../../contracts/primitives.js").ExprNode, unknown>>;
        moTa: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>>>;
    bien: z.ZodPrefault<z.ZodString>;
    uuTien: z.ZodPrefault<z.ZodNumber>;
    xungDot: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        luatId: z.ZodString;
        cachGiai: z.ZodPrefault<z.ZodEnum<{
            uu_tien_cao_thang: "uu_tien_cao_thang";
            pham_vi_hep_thang: "pham_vi_hep_thang";
            sinh_nghich_ly: "sinh_nghich_ly";
        }>>;
    }, z.core.$strict>>>;
    khaNghich: z.ZodPrefault<z.ZodObject<{
        duocKhong: z.ZodPrefault<z.ZodBoolean>;
        boiAi: z.ZodPrefault<z.ZodEnum<{
            khong_ai: "khong_ai";
            sang_the_than: "sang_the_than";
            than_cung_domain: "than_cung_domain";
            pham_nhan_dac_biet: "pham_nhan_dac_biet";
        }>>;
        gia: z.ZodPrefault<z.ZodString>;
    }, z.core.$strip>>;
    tiepDia: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        khaiNiemId: z.ZodString;
        vaiTro: z.ZodEnum<{
            chu_the: "chu_the";
            doi_tuong: "doi_tuong";
            tac_dong: "tac_dong";
            trang_thai: "trang_thai";
            pham_tru: "pham_tru";
        }>;
        batBuoc: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
    hieuLuc: z.ZodPrefault<z.ZodNumber>;
    cheDoTiepDia: z.ZodPrefault<z.ZodEnum<{
        chat_che: "chat_che";
        tu_tiep_dia: "tu_tiep_dia";
        tu_suy: "tu_suy";
    }>>;
    theTag: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    chiThiAi: z.ZodPrefault<z.ZodString>;
    dienGiai: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        theHe: z.ZodNumber;
        vungId: z.ZodPrefault<z.ZodString>;
        noiDung: z.ZodString;
        doLech: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>>;
    keHo: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        moTa: z.ZodString;
        daBiKhaiThac: z.ZodPrefault<z.ZodBoolean>;
        boiAi: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>>>;
    truongDaXacNhan: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    lichSuSua: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        tick: z.ZodNumber;
        cheDo: z.ZodEnum<{
            tiem_tien: "tiem_tien";
            hoi_to: "hoi_to";
            phan_nhanh: "phan_nhanh";
        }>;
        truoc: z.ZodString;
        sau: z.ZodString;
    }, z.core.$strict>>>;
    trangThai: z.ZodPrefault<z.ZodEnum<{
        hieu_luc: "hieu_luc";
        nhap: "nhap";
        treo: "treo";
        da_huy: "da_huy";
    }>>;
}, z.core.$strip>>;
export type Lawful = z.infer<typeof LawfulSchema>;
