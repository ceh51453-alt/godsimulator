/**
 * Aspect tầng Phàm Nhân — Phần 70.2, 70.3, 70.5 [BB].
 *
 * ── Ba thứ một đời người cần mà bốn mươi hai aspect cũ không có ──
 *
 * `mortal` của Phase 0 đã có tuổi, thân thể thô, lịch và kỹ năng. Đủ để một NPC
 * tồn tại, không đủ để một NPC **sống**. Ba thứ còn thiếu:
 *
 *   sinh_ke   người ta làm gì cả ngày, học của ai, dạy cho ai
 *   ho        người ta ở với ai, ăn chung kho nào, chịu chung nghĩa vụ gì
 *   can_cuoc  người ta là ai trong mắt thiết chế: phường nào, án gì, quyền gì
 *
 * Ba cái này không phải "thêm trường cho đẹp". Chúng là ba chỗ duy nhất mà một
 * đời bình thường để lại dấu vết: nghề truyền cho ai, nhà chia cho ai, và tên
 * mình còn nằm trong sổ nào.
 *
 * [BB] 56.2 — không cái nào trong đây đi thẳng ra tầng phàm nhân dưới dạng số.
 * `chieu()` dịch chúng thành điều nhân vật *biết*, và `soTay.ts` viết ra thành câu.
 */
import { z } from 'zod';
/**
 * Bậc nghề. Không phải "level": nó là thứ người khác **công nhận**, nên nó đổi
 * chậm hơn kỹ năng thật và có lúc lệch hẳn. Một người giỏi mà chưa ai gọi là
 * thợ cả thì vẫn là thợ bạn.
 */
export declare const BAC_NGHE: readonly ["hoc_viec", "tho_ban", "tho_ca", "bac_thay"];
export type BacNghe = (typeof BAC_NGHE)[number];
export declare const NHAN_BAC_NGHE: Readonly<Record<BacNghe, string>>;
/**
 * Tên nghề bằng tiếng Việt có dấu — [BB] 36.7, giao diện không hiện chuỗi máy.
 *
 * Id nghề là `snake_case` không dấu vì nó là khóa dữ liệu. Đưa thẳng nó lên Sổ
 * Tay cho ra "thợ bạn dan luoi", và đó là thứ phá vỡ ảo giác "trang giấy của
 * chính nhân vật" nhanh hơn bất kỳ con số nào.
 */
export declare const NHAN_NGHE: Readonly<Record<string, string>>;
/** Nghề chưa có nhãn thì bỏ tiền tố và thay gạch dưới — vẫn đọc được. */
export declare function nhanNghe(ngheId: string | null): string;
/** Ngưỡng kỹ năng THẬT cần có để được công nhận lên bậc. */
export declare const NGUONG_BAC: Readonly<Record<BacNghe, number>>;
export declare const SinhKeSchema: z.ZodPrefault<z.ZodObject<{
    ngheId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    bac: z.ZodPrefault<z.ZodEnum<{
        hoc_viec: "hoc_viec";
        tho_ban: "tho_ban";
        tho_ca: "tho_ca";
        bac_thay: "bac_thay";
    }>>;
    noiLamId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    thayId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    hocTroIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    soNhipDaLam: z.ZodPrefault<z.ZodNumber>;
    thuNhapGanNhat: z.ZodPrefault<z.ZodNumber>;
    ngheDaTung: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    biCamBoiId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>>;
export declare const VAI_TRONG_HO: readonly ["chu_ho", "ban_doi", "con", "nguoi_gia", "nguoi_o", "khach_tru"];
export type VaiTrongHo = (typeof VAI_TRONG_HO)[number];
export declare const NHAN_VAI_HO: Readonly<Record<VaiTrongHo, string>>;
export declare const HoSchema: z.ZodPrefault<z.ZodObject<{
    chuHoId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    thanhVien: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        vai: z.ZodPrefault<z.ZodEnum<{
            con: "con";
            chu_ho: "chu_ho";
            ban_doi: "ban_doi";
            nguoi_gia: "nguoi_gia";
            nguoi_o: "nguoi_o";
            khach_tru: "khach_tru";
        }>>;
    }, z.core.$strict>>>;
    kho: z.ZodPrefault<z.ZodObject<{
        luongThuc: z.ZodPrefault<z.ZodNumber>;
        vatLieu: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    noiOId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    tickLap: z.ZodPrefault<z.ZodNumber>;
    tickTan: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    hoGocId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    nghiaVu: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        toId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        description: z.ZodString;
        cadence: z.ZodPrefault<z.ZodString>;
        priority: z.ZodPrefault<z.ZodNumber>;
        status: z.ZodPrefault<z.ZodEnum<{
            active: "active";
            fulfilled: "fulfilled";
            broken: "broken";
            released: "released";
        }>>;
    }, z.core.$strict>>>;
    thuTuThuaKe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
export declare const TRANG_THAI_PHAP_LY: readonly ["tu_do", "le_thuoc", "dang_bi_truy", "dang_chiu_an", "bi_luu_day"];
export type TrangThaiPhapLy = (typeof TRANG_THAI_PHAP_LY)[number];
export declare const CanCuocSchema: z.ZodPrefault<z.ZodObject<{
    hoiIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    phapLy: z.ZodPrefault<z.ZodEnum<{
        tu_do: "tu_do";
        le_thuoc: "le_thuoc";
        dang_bi_truy: "dang_bi_truy";
        dang_chiu_an: "dang_chiu_an";
        bi_luu_day: "bi_luu_day";
    }>>;
    an: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        toi: z.ZodString;
        xuBoiId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        tickXu: z.ZodNumber;
        tickManHan: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>>;
    duocNhoBoi: z.ZodPrefault<z.ZodNumber>;
    tiengTam: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
/**
 * [BB] 70.5 — "Chấn thương có vị trí, nguyên nhân, điều trị, biến chứng và di chứng."
 *
 * `ConditionRecord` của Phần 0 có `kind` và `severity`, đủ cho một bộ đếm. Bốn
 * trường dưới đây là thứ biến một con số thành một câu chuyện: gãy **chân trái**
 * vì **ngã giàn giáo**, ai chữa, và cái đau khi trở trời còn lại mãi.
 */
export declare const VI_TRI_THAN_THE: readonly ["dau", "than", "tay_trai", "tay_phai", "chan_trai", "chan_phai", "trong"];
export type ViTriThanThe = (typeof VI_TRI_THAN_THE)[number];
export declare const NHAN_VI_TRI: Readonly<Record<ViTriThanThe, string>>;
export declare const ThuongTichSchema: z.ZodObject<{
    id: z.ZodString;
    loai: z.ZodEnum<{
        gay: "gay";
        rach: "rach";
        bong: "bong";
        benh: "benh";
        kiet_suc: "kiet_suc";
        nhiem_doc: "nhiem_doc";
        tuoi_gia: "tuoi_gia";
    }>;
    viTri: z.ZodPrefault<z.ZodEnum<{
        than: "than";
        dau: "dau";
        tay_trai: "tay_trai";
        tay_phai: "tay_phai";
        chan_trai: "chan_trai";
        chan_phai: "chan_phai";
        trong: "trong";
    }>>;
    nang: z.ZodPrefault<z.ZodNumber>;
    tickBatDau: z.ZodNumber;
    nguyenNhanEventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    nguoiChamId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    trangThai: z.ZodPrefault<z.ZodEnum<{
        moi: "moi";
        dang_lanh: "dang_lanh";
        da_lanh: "da_lanh";
        bien_chung: "bien_chung";
        di_chung: "di_chung";
    }>>;
    diChung: z.ZodPrefault<z.ZodString>;
}, z.core.$strict>;
export type SinhKe = z.infer<typeof SinhKeSchema>;
export type Ho = z.infer<typeof HoSchema>;
export type CanCuoc = z.infer<typeof CanCuocSchema>;
export type ThuongTich = z.infer<typeof ThuongTichSchema>;
/** Bậc mà kỹ năng này ĐỦ ĐIỀU KIỆN để được công nhận. */
export declare function bacTheoKyNang(kyNang: number): BacNghe;
/**
 * Thương tích này chặn những việc gì.
 *
 * [BB] 70.5 — "Mệt, đói và đau ảnh hưởng affordance, không chỉ trừ một điểm."
 * Trả về **tên việc** chứ không trả về số: chỗ dùng nó là bộ thu affordance, và
 * bộ thu ấy cần biết "không mang vác được", không cần biết "−12 sức".
 */
export declare function viecBiChan(t: ThuongTich): readonly string[];
/** Câu người ta nói về vết thương này — [BB] 56.2, không con số. */
export declare function keVeThuongTich(t: ThuongTich): string;
