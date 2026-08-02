/** Aspect `domain`, `venerable`, `divisible` — Phần 12.1; vòng đời domain 69.4. */
import { z } from 'zod';
import { BanTinhSchema } from './soul.js';
import { DomainStateSchema } from './thanVi.js';
export const DomainSchema = z
    .object({
    /**
     * Từ Phase 6, mỗi domain mang đủ vòng đời của 69.4 chứ không chỉ `suc`.
     * Trường mới đều có prefault nên fixture và save cũ vẫn parse nguyên vẹn.
     */
    domains: z.array(DomainStateSchema).prefault([]),
    khaiNiemGocId: z.string().nullable().prefault(null),
    laKhoiNguyen: z.boolean().prefault(false),
    thanHeId: z.string().nullable().prefault(null),
})
    .prefault({});
export const VenerableSchema = z
    .object({
    tinDoIds: z.array(z.string()).prefault([]),
    soTinDoUocLuong: z.number().prefault(0),
    /** vungId → mật độ đền. */
    matDoDen: z.record(z.string(), z.number()).prefault({}),
    hienThanh: z.number().min(0).max(100).prefault(20),
    /** Cái phàm nhân tin — KHÁC với soul.banTinh thật. Đây là thứ tầng phàm được thấy. */
    banTinhTinDoTin: BanTinhSchema,
    doLechDiHoa: z.number().min(0).max(100).prefault(0),
})
    .prefault({});
export const DivisibleSchema = z
    .object({
    banTheGocId: z.string().nullable().prefault(null),
    phanThanIds: z.array(z.string()).prefault([]),
    doPhanKy: z.number().min(0).max(100).prefault(0),
    nguongHopNhat: z.number().prefault(60),
    thamQuyenDuocChia: z.array(z.string()).prefault([]),
})
    .prefault({});
/** Hóa thân — Phần 19.4. Khi hóa thân, chieu() của thần tụt xuống mức phàm nhân. */
export const AvatarSchema = z
    .object({
    thanId: z.string(),
    thanTheId: z.string(),
    mucQuen: z.number().min(0).max(100).prefault(80),
    dieuKienThucTinh: z.string().prefault(''),
    daThucTinh: z.boolean().prefault(false),
    quyenNangConLai: z.number().min(0).max(100).prefault(5),
    neuChet: z.enum(['ve_than', 'mat_vinh_vien', 'tai_sinh']).prefault('ve_than'),
    tickHaPham: z.number(),
})
    .strict();
