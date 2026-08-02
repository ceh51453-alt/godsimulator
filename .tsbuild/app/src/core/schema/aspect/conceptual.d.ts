/** Aspect `conceptual` — Khái Niệm. Phần 8.1. */
import { z } from 'zod';
export declare const GIAI_DOAN_KHAI_NIEM: readonly ["hu_danh", "manh_nha", "thanh_hinh", "ket_tinh"];
export declare const ConceptualSchema: z.ZodPrefault<z.ZodObject<{
    giaiDoan: z.ZodPrefault<z.ZodEnum<{
        hu_danh: "hu_danh";
        manh_nha: "manh_nha";
        thanh_hinh: "thanh_hinh";
        ket_tinh: "ket_tinh";
    }>>;
    trongSo: z.ZodPrefault<z.ZodNumber>;
    nguongKetTinh: z.ZodPrefault<z.ZodNumber>;
    nguon: z.ZodPrefault<z.ZodObject<{
        yChi: z.ZodPrefault<z.ZodNumber>;
        lapLai: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    sacThai: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    phanNghiaId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    cangThang: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        khaiNiemId: z.ZodString;
        doCang: z.ZodNumber;
    }, z.core.$strict>>>;
    ketTinhThanh: z.ZodPrefault<z.ZodEnum<{
        than: "than";
        chua: "chua";
        luat: "luat";
        ca_hai: "ca_hai";
    }>>;
    thucTheIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    tickVaoLuongLu: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>>;
export type Conceptual = z.infer<typeof ConceptualSchema>;
