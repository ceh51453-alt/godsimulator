/**
 * Mười kênh can thiệp của thần — Phần 69.2.
 *
 * > "Kênh là registry/affordance, không phải menu đóng."
 *
 * Cột **giá tự nhiên** của bảng 69.2 là điều làm cho tầng Thần không thành một
 * bảng nút bấm. Mỗi kênh có một cái giá **nằm trong thế giới**, không phải một
 * thanh mana bị trừ:
 *
 *   - dấu hiệu thì rẻ, nhưng người ta hiểu sai;
 *   - hiển thánh thì hiệu quả, nhưng lộ ý định và bị phản công;
 *   - giao ước thì bền, nhưng **thần cũng bị trói**.
 *
 * [BB] Phần 1.3 — KHÔNG có tài nguyên meta. Không mana, không cooldown, không
 * "điểm thần lực". Cái ngăn người chơi lạm dụng là hậu quả, không phải bộ đếm.
 * Bất biến `khong_tai_nguyen_meta` canh điều này ở mức schema.
 */
import { z } from 'zod';
export declare const KENH_IDS: readonly ["dau_hieu", "su_gia", "giao_uoc", "ban_phat", "hien_thanh", "than_khi", "giao_ly", "coi", "mac_khai", "ngoai_giao_than"];
export type KenhId = (typeof KENH_IDS)[number];
/**
 * Một cái giá phải trả. Đây là **hậu quả trong thế giới**, không phải chi phí
 * trừ vào một bộ đếm.
 */
export declare const GiaTuNhienSchema: z.ZodObject<{
    deHieuSai: z.ZodPrefault<z.ZodNumber>;
    loDienThan: z.ZodPrefault<z.ZodNumber>;
    tangPhuThuoc: z.ZodPrefault<z.ZodNumber>;
    tuRangBuoc: z.ZodPrefault<z.ZodBoolean>;
    trungGianCoYChi: z.ZodPrefault<z.ZodBoolean>;
    canLuatNen: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type GiaTuNhien = z.infer<typeof GiaTuNhienSchema>;
export type KenhCanThiep = {
    readonly id: KenhId;
    readonly ten: string;
    readonly moTa: string;
    /** Ví dụ trong bảng 69.2 — dùng làm gợi ý cho người chơi, không phải allowlist. */
    readonly viDu: readonly string[];
    readonly gia: GiaTuNhien;
    /** Câu engine kể khi kênh này được dùng mà chưa có Narrator. */
    readonly loiKeMau: string;
};
/**
 * Mười kênh dựng sẵn. [MR] — người dùng thêm kênh mới bằng dữ liệu, và thần
 * "được khám phá kênh mới từ aspect, luật và cơ chế của thế giới" (69.2).
 */
export declare const KENH_DUNG_SAN: readonly KenhCanThiep[];
export declare function kenhTheoId(id: string): KenhCanThiep | undefined;
/**
 * Kênh dùng được với một vị thần trong một hoàn cảnh.
 *
 * [BB] 67.7 — đây là **gợi ý**, không phải biên giới. Người chơi vẫn gõ tự do và
 * Intent parser vẫn phải hiểu; danh sách này chỉ để màn hình có gì đó để mời.
 * Vì vậy hàm lọc theo *điều kiện thế giới*, không theo "cấp độ mở khóa".
 */
export declare function kenhKhaDung(dieuKien: {
    coTinDo: boolean;
    coDen: boolean;
    coTheChe: boolean;
    coThanKhac: boolean;
    luatNenCoSan: readonly string[];
}): readonly KenhCanThiep[];
