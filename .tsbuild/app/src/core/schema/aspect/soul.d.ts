/** Aspect `soul` — dùng chung thần và phàm. Phần 11.1 [BB]. */
import { z } from 'zod';
export declare const TANG_NPC: readonly ["t0", "t1", "t2", "t3"];
export type TangNpc = (typeof TANG_NPC)[number];
export declare const BanTinhSchema: z.ZodPrefault<z.ZodObject<{
    tuBi_tanNhan: z.ZodPrefault<z.ZodNumber>;
    kieuNgao_khiemNhuong: z.ZodPrefault<z.ZodNumber>;
    trungThanh_phanTrac: z.ZodPrefault<z.ZodNumber>;
    ducVong_tietChe: z.ZodPrefault<z.ZodNumber>;
    tratTu_phongTung: z.ZodPrefault<z.ZodNumber>;
    canDam_khiepNhuoc: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
export declare const BAN_TINH_TRUC: readonly ["tuBi_tanNhan", "kieuNgao_khiemNhuong", "trungThanh_phanTrac", "ducVong_tietChe", "tratTu_phongTung", "canDam_khiepNhuoc"];
export declare const LOAI_CAM_XUC: readonly ["phan_no", "so_hai", "yeu_thuong", "ghen_ti", "buon_ba", "han_hoan", "xau_ho", "khinh_bi", "hy_vong", "tuyet_vong"];
/**
 * Quan hệ MỘT CHIỀU — Phần 11.2 [BB].
 *
 * Khác `RelationStateSchema` ở đúng một chỗ: không có `tuId`/`denId`, vì nó nằm
 * **trong** hồn của chủ thể và được khóa bằng id người kia. Nhờ vậy mọi trường
 * đều có prefault, và một patch chỉ chạm `anTuong` vẫn cho ra bản ghi hợp lệ —
 * điều kiện bắt buộc để pha 2 của `apDungPatch` không từ chối cả lô.
 */
export declare const QuanHeMotChieuSchema: z.ZodPrefault<z.ZodObject<{
    thanSo: z.ZodPrefault<z.ZodNumber>;
    yeuGhet: z.ZodPrefault<z.ZodNumber>;
    tinNgo: z.ZodPrefault<z.ZodNumber>;
    noOn: z.ZodPrefault<z.ZodNumber>;
    anTuong: z.ZodPrefault<z.ZodString>;
    kyUcChungIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    laHuyenThoai: z.ZodPrefault<z.ZodBoolean>;
    xungHo: z.ZodPrefault<z.ZodString>;
}, z.core.$strip>>;
export declare const SoulSchema: z.ZodPrefault<z.ZodObject<{
    tang: z.ZodPrefault<z.ZodEnum<{
        t0: "t0";
        t1: "t1";
        t2: "t2";
        t3: "t3";
    }>>;
    banTinh: z.ZodPrefault<z.ZodObject<{
        tuBi_tanNhan: z.ZodPrefault<z.ZodNumber>;
        kieuNgao_khiemNhuong: z.ZodPrefault<z.ZodNumber>;
        trungThanh_phanTrac: z.ZodPrefault<z.ZodNumber>;
        ducVong_tietChe: z.ZodPrefault<z.ZodNumber>;
        tratTu_phongTung: z.ZodPrefault<z.ZodNumber>;
        canDam_khiepNhuoc: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    ducVong: z.ZodPrefault<z.ZodObject<{
        quyenLuc: z.ZodPrefault<z.ZodNumber>;
        triThuc: z.ZodPrefault<z.ZodNumber>;
        tinhAi: z.ZodPrefault<z.ZodNumber>;
        baoThu: z.ZodPrefault<z.ZodNumber>;
        anToan: z.ZodPrefault<z.ZodNumber>;
        danhTieng: z.ZodPrefault<z.ZodNumber>;
        tinNguong: z.ZodPrefault<z.ZodNumber>;
        tuDo: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    tamTrang: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        loai: z.ZodEnum<{
            phan_no: "phan_no";
            so_hai: "so_hai";
            yeu_thuong: "yeu_thuong";
            ghen_ti: "ghen_ti";
            buon_ba: "buon_ba";
            han_hoan: "han_hoan";
            xau_ho: "xau_ho";
            khinh_bi: "khinh_bi";
            hy_vong: "hy_vong";
            tuyet_vong: "tuyet_vong";
        }>;
        doiTuongId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        cuongDo: z.ZodPrefault<z.ZodNumber>;
        suyGiam: z.ZodPrefault<z.ZodNumber>;
        nguonGocKyUcId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>>>;
    kyUc: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        tomTat: z.ZodString;
        tick: z.ZodNumber;
        dienTich: z.ZodPrefault<z.ZodNumber>;
        lienQuan: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>>;
    kyUcSuyGiam: z.ZodPrefault<z.ZodBoolean>;
    agency: z.ZodPrefault<z.ZodNumber>;
    quanHe: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodPrefault<z.ZodObject<{
        thanSo: z.ZodPrefault<z.ZodNumber>;
        yeuGhet: z.ZodPrefault<z.ZodNumber>;
        tinNgo: z.ZodPrefault<z.ZodNumber>;
        noOn: z.ZodPrefault<z.ZodNumber>;
        anTuong: z.ZodPrefault<z.ZodString>;
        kyUcChungIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        laHuyenThoai: z.ZodPrefault<z.ZodBoolean>;
        xungHo: z.ZodPrefault<z.ZodString>;
    }, z.core.$strip>>>>;
}, z.core.$strip>>;
/** Phần 61.2: `SoulCoreSchema = SoulSchema`. */
export declare const SoulCoreSchema: z.ZodPrefault<z.ZodObject<{
    tang: z.ZodPrefault<z.ZodEnum<{
        t0: "t0";
        t1: "t1";
        t2: "t2";
        t3: "t3";
    }>>;
    banTinh: z.ZodPrefault<z.ZodObject<{
        tuBi_tanNhan: z.ZodPrefault<z.ZodNumber>;
        kieuNgao_khiemNhuong: z.ZodPrefault<z.ZodNumber>;
        trungThanh_phanTrac: z.ZodPrefault<z.ZodNumber>;
        ducVong_tietChe: z.ZodPrefault<z.ZodNumber>;
        tratTu_phongTung: z.ZodPrefault<z.ZodNumber>;
        canDam_khiepNhuoc: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    ducVong: z.ZodPrefault<z.ZodObject<{
        quyenLuc: z.ZodPrefault<z.ZodNumber>;
        triThuc: z.ZodPrefault<z.ZodNumber>;
        tinhAi: z.ZodPrefault<z.ZodNumber>;
        baoThu: z.ZodPrefault<z.ZodNumber>;
        anToan: z.ZodPrefault<z.ZodNumber>;
        danhTieng: z.ZodPrefault<z.ZodNumber>;
        tinNguong: z.ZodPrefault<z.ZodNumber>;
        tuDo: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    tamTrang: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        loai: z.ZodEnum<{
            phan_no: "phan_no";
            so_hai: "so_hai";
            yeu_thuong: "yeu_thuong";
            ghen_ti: "ghen_ti";
            buon_ba: "buon_ba";
            han_hoan: "han_hoan";
            xau_ho: "xau_ho";
            khinh_bi: "khinh_bi";
            hy_vong: "hy_vong";
            tuyet_vong: "tuyet_vong";
        }>;
        doiTuongId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        cuongDo: z.ZodPrefault<z.ZodNumber>;
        suyGiam: z.ZodPrefault<z.ZodNumber>;
        nguonGocKyUcId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>>>;
    kyUc: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        tomTat: z.ZodString;
        tick: z.ZodNumber;
        dienTich: z.ZodPrefault<z.ZodNumber>;
        lienQuan: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>>;
    kyUcSuyGiam: z.ZodPrefault<z.ZodBoolean>;
    agency: z.ZodPrefault<z.ZodNumber>;
    quanHe: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodPrefault<z.ZodObject<{
        thanSo: z.ZodPrefault<z.ZodNumber>;
        yeuGhet: z.ZodPrefault<z.ZodNumber>;
        tinNgo: z.ZodPrefault<z.ZodNumber>;
        noOn: z.ZodPrefault<z.ZodNumber>;
        anTuong: z.ZodPrefault<z.ZodString>;
        kyUcChungIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        laHuyenThoai: z.ZodPrefault<z.ZodBoolean>;
        xungHo: z.ZodPrefault<z.ZodString>;
    }, z.core.$strip>>>>;
}, z.core.$strip>>;
/** Quan hệ — bốn trục, bất đối xứng. Phần 11.2 [BB]: hai record riêng, không đồng bộ. */
export declare const RelationStateSchema: z.ZodObject<{
    tuId: z.ZodString;
    denId: z.ZodString;
    thanSo: z.ZodPrefault<z.ZodNumber>;
    yeuGhet: z.ZodPrefault<z.ZodNumber>;
    tinNgo: z.ZodPrefault<z.ZodNumber>;
    noOn: z.ZodPrefault<z.ZodNumber>;
    anTuong: z.ZodPrefault<z.ZodString>;
    kyUcChungIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    laHuyenThoai: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export type LoaiCamXuc = (typeof LOAI_CAM_XUC)[number];
export type BanTinh = z.infer<typeof BanTinhSchema>;
export type Soul = z.infer<typeof SoulSchema>;
export type RelationState = z.infer<typeof RelationStateSchema>;
export type QuanHeMotChieu = z.infer<typeof QuanHeMotChieuSchema>;
