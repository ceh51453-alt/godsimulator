/**
 * Diễn Hóa tự động — Phần 47 [BB].
 *
 * > Người chơi bấm một nút, thế giới tự chạy nhiều lượt, rồi báo cáo lại.
 *
 * ── Chỗ quyết định tính năng này hữu ích hay vô dụng ──
 *
 * [BB] 47.3: "Diễn Hóa không nên dừng khi hết số lượt. Nó nên dừng khi **có
 * chuyện đáng xem**." Và:
 *
 * > Bạn không xem một trăm năm, bạn xem đúng ba khoảnh khắc đáng xem trong một
 * > trăm năm đó.
 *
 * Vì vậy `kiemDieuKienDung()` là hàm dài nhất file này, và mỗi điều kiện trả về
 * một `moTa` đủ để báo cáo **mở thẳng vào chỗ đó**.
 *
 * ── Lằn ranh cứng ──
 *
 * [BB] 47.4 — Diễn Hóa KHÔNG BAO GIỜ được, bất kể cấu hình: sửa Luật Nền · dùng
 * Vũ Khí Khái Niệm · kích hoạt kết cục · hợp nhánh hoặc tạo nhánh · sửa `tuning`,
 * `R.*` hay cấu hình · xóa cứng entity · trả lời lời cầu thay người chơi.
 *
 * `locPatchTheoLanRanh()` cưỡng chế danh sách ấy trên TỪNG patch, và nó chạy
 * trước khi patch chạm transaction.
 */
import { z } from 'zod';
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { StructuredError } from '../contracts/errors.js';
export declare const NHIP_DIEN_HOA: readonly ["nien", "the_dai", "vinh_kiep"];
export type NhipDienHoa = (typeof NHIP_DIEN_HOA)[number];
export declare const DIEU_KIEN_DUNG_DIEN_HOA: readonly ["het_luot", "can_ngan_sach", "reality_tut_qua_20", "mach_dat_cao_trao", "nhan_vat_nguoi_choi_lam_nguy", "ke_thu_troi_day", "ky_vong_lorebook_bi_lech", "co_che_moi_xuat_hien", "luat_nen_duoc_dat_ten", "than_mat_domain", "phuc_but_qua_han"];
export type DieuKienDungDienHoa = (typeof DIEU_KIEN_DUNG_DIEN_HOA)[number];
export declare const CauHinhDienHoaSchema: z.ZodPrefault<z.ZodObject<{
    soLuot: z.ZodPrefault<z.ZodNumber>;
    nhipMoiLuot: z.ZodPrefault<z.ZodEnum<{
        nien: "nien";
        the_dai: "the_dai";
        vinh_kiep: "vinh_kiep";
    }>>;
    chayNen: z.ZodPrefault<z.ZodBoolean>;
    nganSach: z.ZodPrefault<z.ZodObject<{
        callToiDa: z.ZodPrefault<z.ZodNumber>;
        tokenToiDa: z.ZodPrefault<z.ZodNumber>;
        dungKhiCan: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    phamViChoPhep: z.ZodPrefault<z.ZodObject<{
        dongTu: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        duocGiaiLoHong: z.ZodPrefault<z.ZodBoolean>;
        duocKetTinhLuat: z.ZodPrefault<z.ZodBoolean>;
        duocSinhMachTruyen: z.ZodPrefault<z.ZodBoolean>;
        duocSinhThanMoi: z.ZodPrefault<z.ZodBoolean>;
        duocGietNhanVatT2: z.ZodPrefault<z.ZodBoolean>;
        duocGietNhanVatNguoiChoi: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    dieuKienDung: z.ZodPrefault<z.ZodArray<z.ZodEnum<{
        phuc_but_qua_han: "phuc_but_qua_han";
        mach_dat_cao_trao: "mach_dat_cao_trao";
        ke_thu_troi_day: "ke_thu_troi_day";
        ky_vong_lorebook_bi_lech: "ky_vong_lorebook_bi_lech";
        co_che_moi_xuat_hien: "co_che_moi_xuat_hien";
        luat_nen_duoc_dat_ten: "luat_nen_duoc_dat_ten";
        reality_tut_qua_20: "reality_tut_qua_20";
        than_mat_domain: "than_mat_domain";
        het_luot: "het_luot";
        can_ngan_sach: "can_ngan_sach";
        nhan_vat_nguoi_choi_lam_nguy: "nhan_vat_nguoi_choi_lam_nguy";
    }>>>;
    bacBaoCao: z.ZodPrefault<z.ZodEnum<{
        day_du: "day_du";
        bien_nien: "bien_nien";
        tom_tat: "tom_tat";
    }>>;
}, z.core.$strip>>;
export type CauHinhDienHoa = z.infer<typeof CauHinhDienHoaSchema>;
export declare const EvolutionLogSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    tickBatDau: z.ZodNumber;
    tickKetThuc: z.ZodNumber;
    soLuotChay: z.ZodNumber;
    soCall: z.ZodNumber;
    tokenDaDung: z.ZodNumber;
    lyDoDung: z.ZodString;
    suKienLon: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        tick: z.ZodNumber;
        moTa: z.ZodString;
        loai: z.ZodString;
        entityIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        daXemChiTiet: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
    anhChup: z.ZodString;
}, z.core.$strict>;
export type EvolutionLog = z.infer<typeof EvolutionLogSchema>;
/** Bảng mà Diễn Hóa KHÔNG BAO GIỜ được ghi — 47.4. */
export declare const BANG_CAM_DIEN_HOA: readonly string[];
/** Đường dẫn cấm ngay cả trên bảng được phép. */
export declare const DUONG_DAN_CAM_DIEN_HOA: readonly string[];
export type KetQuaLocPatch = {
    readonly giu: readonly PatchOp[];
    readonly bo: readonly {
        readonly patch: PatchOp;
        readonly lyDo: string;
    }[];
    readonly loi: readonly StructuredError[];
};
/**
 * Lọc patch theo lằn ranh cứng — 47.4.
 *
 * Bỏ TỪNG patch vi phạm chứ không hủy cả lô: cùng chính sách với 31.7, và vì
 * Diễn Hóa chạy hàng trăm lượt nên hủy cả lô vì một patch xấu là mất cả một thế kỷ.
 */
export declare function locPatchTheoLanRanh(patches: readonly PatchOp[], cauHinh: CauHinhDienHoa, state: WorldState): KetQuaLocPatch;
export type SuKienDangXem = {
    readonly loai: DieuKienDungDienHoa;
    readonly moTa: string;
    readonly entityIds: readonly string[];
};
export type NgocCanhDung = {
    readonly state: WorldState;
    readonly cauHinh: CauHinhDienHoa;
    readonly luotDaChay: number;
    readonly soCall: number;
    readonly tokenDaDung: number;
    /** Cơ chế vừa bật ở lượt này — từ `quetCoChe()`. */
    readonly coCheVuaBat?: readonly string[];
    /** Trục luật nền vừa được đặt tên. */
    readonly trucVuaDatTen?: readonly string[];
    /** Kỳ vọng lorebook vừa lệch — từ `capNhatKyVong()`. */
    readonly kyVongVuaLech?: readonly string[];
    readonly realityTruoc: number;
};
/**
 * Kiểm mọi điều kiện dừng — 47.3.
 *
 * Trả về điều kiện ĐẦU TIÊN khớp theo thứ tự ưu tiên "đáng xem" chứ không theo
 * thứ tự khai báo: hết lượt và cạn ngân sách xếp cuối, vì dừng vì hết chỉ tiêu
 * là kết cục nhàm nhất trong danh sách.
 */
export declare function kiemDieuKienDung(nc: NgocCanhDung): SuKienDangXem | null;
export type BaoCaoDienHoa = {
    readonly tieuDe: string;
    readonly lyDoDung: string;
    readonly muc: readonly {
        readonly tick: number;
        readonly moTa: string;
        readonly xemDuoc: boolean;
    }[];
    readonly chiSo: readonly string[];
    readonly dong: readonly string[];
};
/** Báo Cáo Diễn Hóa — 47.6, viết bằng GIỌNG BIÊN NIÊN SỬ, không phải giọng log. */
export declare function baoCaoDienHoa(log: EvolutionLog, truoc: {
    reality: number;
    songDong: number;
}, sau: {
    reality: number;
    songDong: number;
}): BaoCaoDienHoa;
