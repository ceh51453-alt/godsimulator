/**
 * Ngân sách token và tự hiệu chỉnh — Phần 34 [BB].
 *
 * ── Vì sao không dùng `length / 4` ──
 *
 * [BB] 34.2 nói thẳng: "Không dùng công thức `length / 4` của tiếng Anh. Tiếng
 * Việt có dấu tokenize tệ hơn nhiều — dùng nhầm sẽ sai ngân sách hàng chục phần
 * trăm." Sai ngân sách theo hướng nào cũng tệ: ước thấp thì prompt bị model cắt
 * cụt giữa Sổ Phục Bút, ước cao thì ta tự vứt nội dung mình có quyền gửi.
 *
 * ── Vì sao tự hiệu chỉnh phải ồn ào ──
 *
 * [BB] 34.3: `finish_reason === 'length'` → giảm ngân sách INPUT của loại call
 * đó 15% và **ghi cảnh báo, KHÔNG IM LẶNG**. Một prompt bị cắt cụt mà không ai
 * biết là cách êm ái nhất để mất Sổ Nhân Quả — vì 33.1 đặt nó ở CUỐI prompt,
 * tức đúng chỗ bị cắt đầu tiên.
 */
import { z } from 'zod';
export declare const LOAI_CALL: readonly ["ke_canh", "tick_t2", "sinh_ky_nguyen", "nen_ky_nguyen", "sinh_lorebook", "giai_lo_hong", "giai_lo_hong_cuoi_ky", "hinh_thuc_hoa_luat", "thanh_tra_mach_lac", "phan_quyet_luat", "ung_bien_hanh_dong", "rerank_listwise"];
export type LoaiCall = (typeof LOAI_CALL)[number];
export type DinhMuc = {
    readonly inputMin: number;
    readonly inputMax: number;
    readonly output: number;
};
/** Bảng 34.1, nguyên văn. Con số là DỮ LIỆU, không phải hằng rải trong code (7.1). */
export declare const NGAN_SACH_MAC_DINH: Readonly<Record<LoaiCall, DinhMuc>>;
export declare const CalibSchema: z.ZodObject<{
    loai: z.ZodEnum<{
        ke_canh: "ke_canh";
        tick_t2: "tick_t2";
        sinh_ky_nguyen: "sinh_ky_nguyen";
        nen_ky_nguyen: "nen_ky_nguyen";
        sinh_lorebook: "sinh_lorebook";
        giai_lo_hong: "giai_lo_hong";
        giai_lo_hong_cuoi_ky: "giai_lo_hong_cuoi_ky";
        hinh_thuc_hoa_luat: "hinh_thuc_hoa_luat";
        thanh_tra_mach_lac: "thanh_tra_mach_lac";
        phan_quyet_luat: "phan_quyet_luat";
        ung_bien_hanh_dong: "ung_bien_hanh_dong";
        rerank_listwise: "rerank_listwise";
    }>;
    tyLeToken: z.ZodPrefault<z.ZodNumber>;
    mau: z.ZodPrefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>>;
    lechLienTiep: z.ZodPrefault<z.ZodNumber>;
    heSoInput: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
export type Calib = z.infer<typeof CalibSchema>;
export declare function calibMoi(loai: LoaiCall, tyLeToken?: number): Calib;
/**
 * [BB] 34.2 — đếm KÝ TỰ chia tỷ lệ đo được, không chia 4.
 *
 * `probe.tyLeTokenDo` (nếu có) thắng `profile.tyLeToken`: một con số đo trên
 * chính model đang dùng luôn đúng hơn một con số khai trong hồ sơ.
 */
export declare function uocLuong(s: string, tyLeToken: number): number;
/** Ngân sách INPUT còn dùng được cho một loại call, sau tự hiệu chỉnh. */
export declare function nganSachInput(loai: LoaiCall, calib: Calib | null): number;
export type KetQuaHieuChinh = {
    readonly calib: Calib;
    /** Câu đi thẳng vào bảng Tự Chẩn Đoán. Rỗng nghĩa là không có gì để nói. */
    readonly canhBao: readonly string[];
};
/**
 * Sau mỗi call: so ước lượng với `usage.prompt_tokens` thật.
 *
 * ```
 * saiSo > 0.12 trong 5 call liên tiếp
 *   → điều chỉnh tyLeToken theo trung bình động 20 mẫu gần nhất
 *   → ghi thông báo vào bảng tự chẩn đoán
 * ```
 */
export declare function tuHieuChinh(calib: Calib, uoc: number, thucTe: number, finishReason: string | null, soKyTu: number): KetQuaHieuChinh;
export type PhanBoTang = {
    readonly so: number;
    readonly ten: string;
    readonly onDinh: boolean;
    readonly tranToken: number;
};
/**
 * Trần token của sáu tầng, theo bảng 33.1.
 *
 * Tỷ lệ, không phải con số cứng: một model 32k và một model 1M cùng dùng bảng
 * này. Điều KHÔNG đổi theo model là THỨ TỰ và tỷ lệ tương đối — ổn định lên đầu
 * để ăn prefix cache, biến động xuống cuối.
 */
export declare function phanBoSauTang(nganSach: number): readonly PhanBoTang[];
export type VetCat = {
    readonly tang: number;
    readonly ten: string;
    readonly uocToken: number;
    readonly tranToken: number;
    readonly vi: string;
};
/**
 * Cắt theo trần từng tầng và GHI LẠI thứ bị cắt.
 *
 * [BB] Cổng Phase 8: "token budget có trace block bị cắt." Cắt im lặng là cách
 * một prompt tự nhiên thiếu mất luật đang chi phối vùng, và không ai biết vì sao
 * Narrator bỗng kể sai.
 */
export declare function catTheoTran(tang: readonly {
    so: number;
    ten: string;
    noiDung: string;
}[], phanBo: readonly PhanBoTang[], tyLeToken: number): {
    tang: readonly {
        so: number;
        ten: string;
        noiDung: string;
    }[];
    vetCat: readonly VetCat[];
};
