/**
 * Hội đồng thần và kế vị — Phần 69.3 [BB].
 *
 * ── Vì sao thần điện cần một cái ghế ──
 *
 * Phase 6 đóng lại khi tầng Thần đã có bản ngã, lời cầu, giao ước và domain —
 * nhưng thần điện vẫn chỉ là một tập hợp: các vị thần cùng tồn tại và không có
 * quan hệ thể chế nào. Nghĩa là "kết giao, tranh kế vị, lập liên minh" của 69.3
 * không có chỗ để xảy ra, và một vị thần chết đi không để lại lỗ trống nào.
 *
 * Aspect này gắn vào entity `pantheon`. Nó cố tình mỏng: **ghế, phiếu, nghị
 * quyết, và một chỗ trống khi ghế đầu bỏ không.** Chính trị thật nảy ra từ việc
 * bốn thứ đó va vào nhau, không từ việc thêm trường.
 *
 * [BB] Không có "điểm ảnh hưởng" tự sinh. Trọng số phiếu suy từ thứ vị thần ấy
 * thật sự có — tín đồ, đền, domain — nên không ai mua được ghế bằng một con số.
 */
import { z } from 'zod';
/** Ghế trong hội đồng. `chuTich` là ghế đầu; bỏ trống thì bắt đầu tranh kế vị. */
export declare const VAI_HOI_DONG: readonly ["chu_tich", "thanh_vien", "khach", "bi_truc_xuat"];
export type VaiHoiDong = (typeof VAI_HOI_DONG)[number];
export declare const NHAN_VAI_HOI_DONG: Readonly<Record<VaiHoiDong, string>>;
export declare const GheSchema: z.ZodObject<{
    thanId: z.ZodString;
    vai: z.ZodPrefault<z.ZodEnum<{
        chu_tich: "chu_tich";
        thanh_vien: "thanh_vien";
        khach: "khach";
        bi_truc_xuat: "bi_truc_xuat";
    }>>;
    tickNhanGhe: z.ZodPrefault<z.ZodNumber>;
    uyTin: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
/** Việc hội đồng quyết được. Danh sách này ĐÓNG — thêm loại là thêm luật chơi. */
export declare const LOAI_NGHI_QUYET: readonly ["phan_xu_tranh_domain", "ket_nap", "truc_xuat", "cong_nhan_ke_vi", "tuyen_chien", "lap_giao_uoc_chung"];
export type LoaiNghiQuyet = (typeof LOAI_NGHI_QUYET)[number];
export declare const NghiQuyetSchema: z.ZodObject<{
    id: z.ZodString;
    loai: z.ZodEnum<{
        phan_xu_tranh_domain: "phan_xu_tranh_domain";
        ket_nap: "ket_nap";
        truc_xuat: "truc_xuat";
        cong_nhan_ke_vi: "cong_nhan_ke_vi";
        tuyen_chien: "tuyen_chien";
        lap_giao_uoc_chung: "lap_giao_uoc_chung";
    }>;
    noiDung: z.ZodString;
    veThanIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    tickMo: z.ZodNumber;
    tickDong: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    phieu: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodEnum<{
        thuan: "thuan";
        chong: "chong";
        trang: "trang";
    }>>>;
    ketQua: z.ZodPrefault<z.ZodEnum<{
        dang_ban: "dang_ban";
        thong_qua: "thong_qua";
        bac_bo: "bac_bo";
        khong_du_phieu: "khong_du_phieu";
    }>>;
}, z.core.$strict>;
/**
 * Luật kế vị. Đây là chỗ một cái chết thành một cuộc khủng hoảng.
 *
 * `manh_nhat` không phải "sức mạnh" theo nghĩa đánh nhau — engine đọc quy kết
 * domain, tức là ai đang được thế giới coi là có thẩm quyền.
 */
export declare const LUAT_KE_VI: readonly ["bau_phieu", "huyet_thong", "manh_nhat", "chi_dinh", "khong_co"];
export type LuatKeVi = (typeof LUAT_KE_VI)[number];
export declare const HoiDongSchema: z.ZodPrefault<z.ZodObject<{
    ten: z.ZodPrefault<z.ZodString>;
    ghe: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        thanId: z.ZodString;
        vai: z.ZodPrefault<z.ZodEnum<{
            chu_tich: "chu_tich";
            thanh_vien: "thanh_vien";
            khach: "khach";
            bi_truc_xuat: "bi_truc_xuat";
        }>>;
        tickNhanGhe: z.ZodPrefault<z.ZodNumber>;
        uyTin: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>>;
    nghiQuyet: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        loai: z.ZodEnum<{
            phan_xu_tranh_domain: "phan_xu_tranh_domain";
            ket_nap: "ket_nap";
            truc_xuat: "truc_xuat";
            cong_nhan_ke_vi: "cong_nhan_ke_vi";
            tuyen_chien: "tuyen_chien";
            lap_giao_uoc_chung: "lap_giao_uoc_chung";
        }>;
        noiDung: z.ZodString;
        veThanIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        tickMo: z.ZodNumber;
        tickDong: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        phieu: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodEnum<{
            thuan: "thuan";
            chong: "chong";
            trang: "trang";
        }>>>;
        ketQua: z.ZodPrefault<z.ZodEnum<{
            dang_ban: "dang_ban";
            thong_qua: "thong_qua";
            bac_bo: "bac_bo";
            khong_du_phieu: "khong_du_phieu";
        }>>;
    }, z.core.$strict>>>;
    luatKeVi: z.ZodPrefault<z.ZodEnum<{
        huyet_thong: "huyet_thong";
        chi_dinh: "chi_dinh";
        khong_co: "khong_co";
        bau_phieu: "bau_phieu";
        manh_nhat: "manh_nhat";
    }>>;
    keThuaChiDinhId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    tickGheDauTrong: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    nguongThongQua: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
export type Ghe = z.infer<typeof GheSchema>;
export type NghiQuyet = z.infer<typeof NghiQuyetSchema>;
export type HoiDong = z.infer<typeof HoiDongSchema>;
/** Ai đang có phiếu. Khách và kẻ bị trục xuất thì không. */
export declare function coPhieu(g: Ghe): boolean;
/**
 * Đếm phiếu. Trả `khong_du_phieu` khi quá nửa số ghế không tới — vắng mặt tập
 * thể là một câu trả lời chính trị, và gộp nó vào "bác bỏ" sẽ làm mất câu ấy.
 */
export declare function demPhieu(hd: HoiDong, nq: NghiQuyet): NghiQuyet['ketQua'];
