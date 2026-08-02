import type { DonViThoiGian, WorkflowTask } from './schema.js';
/**
 * Số tick của một đơn vị thời gian truyện.
 *
 * Neo vào `TICK_MOI_NAM = 4` (một tick là một mùa). Giờ và ngày nhỏ hơn một tick
 * nên quy về 1: engine không có độ phân giải dưới mùa, và giả vờ có là nói dối.
 */
export declare const TICK_MOI_DON_VI: Readonly<Record<DonViThoiGian, number>>;
export type TrangThaiLich = {
    /** Lượt chat gần nhất mà tác vụ này đã chạy. */
    readonly luotChayCuoi: number;
    /** Tick engine gần nhất mà tác vụ này đã chạy. */
    readonly tickChayCuoi: number;
    /** Số lần `khiParseLoi` kích hoạt liên tiếp — chẩn đoán 50.12 mục 33. */
    readonly soLanParseLoiLienTiep: number;
};
export declare function trangThaiLichMoi(): TrangThaiLich;
export type NgocCanhLich = {
    readonly luot: number;
    readonly tick: number;
    /** Sự kiện vừa xảy ra ở lượt này — cho chế độ `theo_su_kien`. */
    readonly suKien: readonly string[];
    /**
     * Văn bản lượt trước, dùng khi `nguonThoiGian.loai = 'the_trong_van_ban'`.
     * Bỏ trống nghĩa là không có gì để parse — và điều đó KHÔNG giống "parse ra 0".
     */
    readonly vanBan?: string;
};
export type QuyetDinhLich = {
    readonly chay: boolean;
    /** Chạy bao nhiêu LẦN. Tua một thế kỷ trong một lượt thì con số này lớn. */
    readonly soLan: number;
    readonly lyDo: string;
    readonly trangThaiSau: TrangThaiLich;
};
/**
 * Tác vụ có chạy lượt này không, và chạy mấy lần.
 *
 * `lich = null` nghĩa là **mỗi lượt** — đúng như 50.2 khai. Hàm thuần: cùng đầu
 * vào cho cùng quyết định, không đọc đồng hồ máy.
 */
export declare function quyetDinhChay(task: WorkflowTask, tt: TrangThaiLich, nc: NgocCanhLich, nguongParseLoiLienTiep: number): QuyetDinhLich;
/**
 * Đọc tick từ thẻ trong văn bản — chỉ dùng khi nhập workflow từ hệ khác (50.4).
 *
 * Trả `null` khi không đọc được, và `null` **khác** 0: đó là toàn bộ lý do
 * `khiParseLoi` tồn tại. Một hàm trả 0 khi thất bại sẽ làm tác vụ chạy mỗi lượt
 * mà không ai biết vì sao.
 */
export declare function docTickTuVanBan(vanBan: string, tenThe: readonly string[]): number | null;
/** Chín điều kiện dừng của 47.3 dùng chung cho chế độ `theo_su_kien`. */
export declare const SU_KIEN_KICH_HOAT: readonly ["het_ky_nguyen", "mach_dat_cao_trao", "ke_thu_troi_day", "ky_vong_lorebook_bi_lech", "co_che_moi_xuat_hien", "luat_nen_duoc_dat_ten", "reality_tut_qua_20", "than_mat_domain", "phuc_but_qua_han"];
export type SuKienKichHoat = (typeof SU_KIEN_KICH_HOAT)[number];
