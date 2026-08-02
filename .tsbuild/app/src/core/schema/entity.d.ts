/**
 * Entity gốc + Link — Phần 4.1, 6.1 [BB].
 *
 * [BB] `kind` là CHUỖI, không phải enum. Enum khóa chết khả năng mở rộng.
 * Tính hợp lệ kiểm bằng `R.kind.lay(kind) !== undefined`.
 */
import { z } from 'zod';
export declare const EntitySchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    kind: z.ZodString;
    ten: z.ZodString;
    aliases: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    moTa: z.ZodPrefault<z.ZodString>;
    tickSinh: z.ZodNumber;
    tickDiet: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    aspects: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tags: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    _degree: z.ZodPrefault<z.ZodNumber>;
    _hash: z.ZodPrefault<z.ZodString>;
    _version: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
export declare const NGUON_LINK: readonly ["nguoi_choi", "engine", "thu_hoach", "giai_lo_hong", "thanh_tra"];
export declare const LinkSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    tuId: z.ZodString;
    denId: z.ZodString;
    quanHe: z.ZodString;
    trongSo: z.ZodPrefault<z.ZodNumber>;
    tickTao: z.ZodNumber;
    tickDut: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    nguon: z.ZodPrefault<z.ZodEnum<{
        nguoi_choi: "nguoi_choi";
        engine: "engine";
        thu_hoach: "thu_hoach";
        giai_lo_hong: "giai_lo_hong";
        thanh_tra: "thanh_tra";
    }>>;
}, z.core.$strict>;
/** Chỉ số thế giới — Phần 13.1 [BB]. */
export declare const WorldMetricsSchema: z.ZodPrefault<z.ZodObject<{
    realityIntegrity: z.ZodPrefault<z.ZodNumber>;
    doSongDong: z.ZodPrefault<z.ZodNumber>;
    agencyTrungBinh: z.ZodPrefault<z.ZodNumber>;
    doPhuThuocTB: z.ZodPrefault<z.ZodNumber>;
    tuSinhSuKien: z.ZodPrefault<z.ZodNumber>;
    matDoLienKet: z.ZodPrefault<z.ZodNumber>;
    daDangKhaiNiem: z.ZodPrefault<z.ZodNumber>;
    tickTinh: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
/** Lỗ hổng — thực thể mồ côi và mọi chỗ thế giới chưa mạch lạc. Phần 6.3 quy tắc 3. */
export declare const GapSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    loai: z.ZodString;
    chuTheId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    moTa: z.ZodPrefault<z.ZodString>;
    uuTien: z.ZodPrefault<z.ZodNumber>;
    lanThu: z.ZodPrefault<z.ZodNumber>;
    trangThai: z.ZodPrefault<z.ZodEnum<{
        mo: "mo";
        dang_giai: "dang_giai";
        da_giai: "da_giai";
        thanh_bi_an: "thanh_bi_an";
    }>>;
    tickPhatHien: z.ZodNumber;
}, z.core.$strict>;
export type Entity = z.infer<typeof EntitySchema>;
export type Link = z.infer<typeof LinkSchema>;
export type WorldMetrics = z.infer<typeof WorldMetricsSchema>;
export type Gap = z.infer<typeof GapSchema>;
