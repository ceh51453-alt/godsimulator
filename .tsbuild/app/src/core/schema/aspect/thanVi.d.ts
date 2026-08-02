/**
 * Bản ngã thần và vòng đời domain — Phần 69.1, 69.4 [BB].
 *
 * ── Vì sao phải tách bốn lớp ──
 *
 * Phần 12.2 nói Dị Hóa kéo `soul.banTinh` về phía `venerable.banTinhTinDoTin`.
 * Nếu cài đúng chữ đó thì tick sẽ **âm thầm ghi đè tính cách lõi**, và người chơi
 * mở save ra thấy mình đã thành người khác mà không có một dòng nào giải thích.
 *
 * 69.1 sửa lại: Dị Hóa tạo **áp lực và tình huống**, không tạo phép gán.
 *
 *   coreSelf             điều vị thần TỰ NHẬN là mình — chỉ đổi qua Event
 *   followerImage        điều tín đồ TIN — tick đổi được thoải mái
 *   officialDoctrine     điều thể chế NÓI — bị dịch, bị sửa, bị lợi dụng
 *   currentManifestation điều thế giới THẤY — hợp của ba lớp trên
 *   pressure             khoảng cách giữa lõi và hình ảnh, cùng những nét
 *                        đang bị đòi hỏi hoặc bị đè xuống
 *
 * [BB] "Không tick nào tự sửa tính cách lõi mà không có Event giải thích."
 * Bất biến `coreself_khong_bi_sua_am_tham` cưỡng chế điều này.
 */
import { z } from 'zod';
/** Bốn cách một vị thần đáp lại áp lực Dị Hóa — 69.1. */
export declare const CACH_DAP_DI_HOA: readonly ["chap_nhan", "chong_lai", "mac_ca", "phan_than"];
export type CachDapDiHoa = (typeof CACH_DAP_DI_HOA)[number];
export declare const DivineIdentitySchema: z.ZodPrefault<z.ZodObject<{
    coreSelf: z.ZodPrefault<z.ZodObject<{
        tuBi_tanNhan: z.ZodPrefault<z.ZodNumber>;
        kieuNgao_khiemNhuong: z.ZodPrefault<z.ZodNumber>;
        trungThanh_phanTrac: z.ZodPrefault<z.ZodNumber>;
        ducVong_tietChe: z.ZodPrefault<z.ZodNumber>;
        tratTu_phongTung: z.ZodPrefault<z.ZodNumber>;
        canDam_khiepNhuoc: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    followerImage: z.ZodPrefault<z.ZodObject<{
        tuBi_tanNhan: z.ZodPrefault<z.ZodNumber>;
        kieuNgao_khiemNhuong: z.ZodPrefault<z.ZodNumber>;
        trungThanh_phanTrac: z.ZodPrefault<z.ZodNumber>;
        ducVong_tietChe: z.ZodPrefault<z.ZodNumber>;
        tratTu_phongTung: z.ZodPrefault<z.ZodNumber>;
        canDam_khiepNhuoc: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    officialDoctrine: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    currentManifestation: z.ZodPrefault<z.ZodObject<{
        tuBi_tanNhan: z.ZodPrefault<z.ZodNumber>;
        kieuNgao_khiemNhuong: z.ZodPrefault<z.ZodNumber>;
        trungThanh_phanTrac: z.ZodPrefault<z.ZodNumber>;
        ducVong_tietChe: z.ZodPrefault<z.ZodNumber>;
        tratTu_phongTung: z.ZodPrefault<z.ZodNumber>;
        canDam_khiepNhuoc: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    pressure: z.ZodPrefault<z.ZodObject<{
        distortion: z.ZodPrefault<z.ZodNumber>;
        suppressedTraits: z.ZodPrefault<z.ZodArray<z.ZodEnum<{
            tuBi_tanNhan: "tuBi_tanNhan";
            kieuNgao_khiemNhuong: "kieuNgao_khiemNhuong";
            trungThanh_phanTrac: "trungThanh_phanTrac";
            ducVong_tietChe: "ducVong_tietChe";
            tratTu_phongTung: "tratTu_phongTung";
            canDam_khiepNhuoc: "canDam_khiepNhuoc";
        }>>>;
        demandedTraits: z.ZodPrefault<z.ZodArray<z.ZodEnum<{
            tuBi_tanNhan: "tuBi_tanNhan";
            kieuNgao_khiemNhuong: "kieuNgao_khiemNhuong";
            trungThanh_phanTrac: "trungThanh_phanTrac";
            ducVong_tietChe: "ducVong_tietChe";
            tratTu_phongTung: "tratTu_phongTung";
            canDam_khiepNhuoc: "canDam_khiepNhuoc";
        }>>>;
        tinhHuongMo: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            truc: z.ZodEnum<{
                tuBi_tanNhan: "tuBi_tanNhan";
                kieuNgao_khiemNhuong: "kieuNgao_khiemNhuong";
                trungThanh_phanTrac: "trungThanh_phanTrac";
                ducVong_tietChe: "ducVong_tietChe";
                tratTu_phongTung: "tratTu_phongTung";
                canDam_khiepNhuoc: "canDam_khiepNhuoc";
            }>;
            moTa: z.ZodString;
            tickSinh: z.ZodNumber;
            daChon: z.ZodPrefault<z.ZodNullable<z.ZodEnum<{
                chap_nhan: "chap_nhan";
                chong_lai: "chong_lai";
                mac_ca: "mac_ca";
                phan_than: "phan_than";
            }>>>;
        }, z.core.$strict>>>;
    }, z.core.$strip>>;
    lichSuLoi: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        tick: z.ZodNumber;
        truc: z.ZodEnum<{
            tuBi_tanNhan: "tuBi_tanNhan";
            kieuNgao_khiemNhuong: "kieuNgao_khiemNhuong";
            trungThanh_phanTrac: "trungThanh_phanTrac";
            ducVong_tietChe: "ducVong_tietChe";
            tratTu_phongTung: "tratTu_phongTung";
            canDam_khiepNhuoc: "canDam_khiepNhuoc";
        }>;
        tu: z.ZodNumber;
        den: z.ZodNumber;
        eventId: z.ZodString;
        lyDo: z.ZodString;
    }, z.core.$strict>>>;
}, z.core.$strip>>;
/**
 * [BB] Chỉ Event thuộc những loại này mới được chạm `coreSelf`.
 *
 * Cả bốn đều là **lựa chọn của một chủ thể**, không phải kết quả của một phép
 * nhân trong tick. Đó là toàn bộ khác biệt giữa "bạn trở thành thứ người ta
 * tưởng bạn là" (bi kịch) và "engine sửa nhân vật của bạn" (bug).
 */
export declare const EVENT_DUOC_SUA_CORESELF: readonly ["than_chap_nhan_di_hoa", "than_chong_lai_di_hoa", "than_mac_ca_giao_ly", "than_phan_than", "than_tu_dinh_nghia"];
export declare const TRANG_THAI_DOMAIN: readonly ["held", "contested", "dormant", "fragmented", "transformed", "merged", "lost", "reclaimable"];
export type TrangThaiDomain = (typeof TRANG_THAI_DOMAIN)[number];
/** Nhãn tiếng Việt cho UI — [BB] 36.7 không dùng thuật ngữ Anh trong giao diện. */
export declare const NHAN_TRANG_THAI_DOMAIN: Readonly<Record<TrangThaiDomain, string>>;
/**
 * Neo tái chiếm — thứ giữ cho một domain đã tắt vẫn còn đường quay lại.
 *
 * [BB] 69.4: "Mất vĩnh viễn chỉ khi mọi vật mang, ký ức, link và luật tiếp địa
 * đều đứt." Nên `lost` không phải hệ quả của `suc = 0`; nó là hệ quả của việc
 * danh sách này rỗng.
 */
export declare const NeoTaiChiemSchema: z.ZodObject<{
    loai: z.ZodEnum<{
        link: "link";
        di_san: "di_san";
        vat_mang: "vat_mang";
        ky_uc: "ky_uc";
        luat_tiep_dia: "luat_tiep_dia";
        nghi_thuc: "nghi_thuc";
    }>;
    refId: z.ZodString;
    moTa: z.ZodPrefault<z.ZodString>;
}, z.core.$strict>;
export declare const DomainStateSchema: z.ZodObject<{
    ten: z.ZodString;
    suc: z.ZodPrefault<z.ZodNumber>;
    trangThai: z.ZodPrefault<z.ZodEnum<{
        lost: "lost";
        dormant: "dormant";
        held: "held";
        contested: "contested";
        fragmented: "fragmented";
        transformed: "transformed";
        merged: "merged";
        reclaimable: "reclaimable";
    }>>;
    neoTaiChiem: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        loai: z.ZodEnum<{
            link: "link";
            di_san: "di_san";
            vat_mang: "vat_mang";
            ky_uc: "ky_uc";
            luat_tiep_dia: "luat_tiep_dia";
            nghi_thuc: "nghi_thuc";
        }>;
        refId: z.ZodString;
        moTa: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>>>;
    doiThuIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    goc: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    tickDoiTrangThai: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
export type DivineIdentity = z.infer<typeof DivineIdentitySchema>;
export type NeoTaiChiem = z.infer<typeof NeoTaiChiemSchema>;
export type DomainState = z.infer<typeof DomainStateSchema>;
/**
 * Khoảng cách hai vector bản tính, chuẩn hóa về 0–100.
 *
 * Đo bằng **trục lệch nhiều nhất**, không bằng cạnh huyền sáu chiều.
 *
 * Lý do là chuyện ngữ nghĩa chứ không phải toán: bị tin là tàn nhẫn trong khi
 * mình từ bi là một sự xuyên tạc TOÀN PHẦN, dù năm trục còn lại khớp hoàn hảo.
 * Chuẩn hóa theo cạnh huyền sáu chiều chia con số ấy cho √6 và biến một sự
 * đánh tráo danh tính thành "lệch 16" — dưới mọi ngưỡng, nên Dị Hóa không bao
 * giờ kích hoạt. Đo được điều đó khi chạy thật, không khi đọc lại công thức.
 */
export declare function khoangCachBanTinh(a: Readonly<Record<string, number>>, b: Readonly<Record<string, number>>): number;
/**
 * Hình hiện tại của vị thần trong mắt thế giới.
 *
 * Không phải trung bình cộng: giáo lý chính thức **khuếch đại** hình ảnh tín đồ,
 * vì thể chế nói to hơn từng người. Vị thần càng ít hiển thánh thì thế giới càng
 * chỉ thấy phần tín đồ dựng nên.
 */
export declare function hinhHienTai(coreSelf: Readonly<Record<string, number>>, followerImage: Readonly<Record<string, number>>, hienThanh: number): Record<string, number>;
/**
 * Trạng thái domain suy từ dữ liệu, không phải do ai đặt tay.
 * [BB] `suc = 0` KHÔNG tự động là `lost` — xem 69.4.
 */
export declare function trangThaiSuyRa(d: DomainState): TrangThaiDomain;
