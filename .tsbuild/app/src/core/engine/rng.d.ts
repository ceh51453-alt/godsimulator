/**
 * RNG seeded — Phần 3.2 `core/engine/rng.ts`; luật bất biến #7 [BB].
 *
 * [BB] Không `Math.random()`, không thời gian máy. Cùng seed + cùng chuỗi gọi
 * phải cho cùng kết quả trên mọi máy, mọi trình duyệt, mọi lần chạy.
 *
 * Dùng SplitMix64 rút gọn về 32-bit (xmur3 để băm seed + sfc32 để sinh số).
 * Cả hai là số học 32-bit thuần, không phụ thuộc IEEE-754 làm tròn.
 */
export type TrangThaiRng = readonly [number, number, number, number];
export type Rng = {
    /** [0, 1) */
    ke(): number;
    /** Số nguyên trong [0, n). n <= 0 trả 0. */
    nguyen(n: number): number;
    /** Số nguyên trong [a, b] — cả hai đầu đều lấy. */
    khoang(a: number, b: number): number;
    /** 1–100, dùng cho kiểm tra tỷ lệ phần trăm. */
    d100(): number;
    /** true với xác suất p (0–1). */
    co(p: number): boolean;
    /** Chọn một phần tử. Mảng rỗng trả undefined. */
    chon<T>(ds: readonly T[]): T | undefined;
    /** Trộn — trả mảng MỚI, không sửa tại chỗ. Fisher–Yates. */
    tron<T>(ds: readonly T[]): T[];
    /**
     * Chọn theo softmax của điểm số, nhiệt độ lấy từ tuning.
     * Nhiệt độ càng thấp càng bám điểm cao nhất.
     */
    softmax(diem: readonly number[], nhietDo: number): number;
    /** Nhánh RNG độc lập theo nhãn — cùng nhãn cho cùng nhánh. */
    nhanh(nhan: string): Rng;
    /** Trạng thái hiện tại, để snapshot và replay. */
    trangThai(): TrangThaiRng;
    /** Số lần đã rút — dùng để chứng minh replay đi đúng số bước. */
    soLanRut(): number;
};
/** Tạo RNG từ một seed chuỗi. Cùng seed → cùng chuỗi số. */
export declare function taoRng(seed: string): Rng;
/** Khôi phục RNG từ trạng thái đã snapshot. */
export declare function tuTrangThai(tt: TrangThaiRng, soLanRut?: number): Rng;
/**
 * RNG cho một (seed, tick, kênh) cụ thể.
 * Cho phép mỗi hệ con rút số độc lập mà tổng thể vẫn deterministic, kể cả khi
 * thứ tự chạy giữa các hệ thay đổi.
 */
export declare function rngCuaTick(seed: string, tick: number, kenh: string): Rng;
