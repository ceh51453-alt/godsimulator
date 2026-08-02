/**
 * Invariant runner — Phase 1.
 *
 * Bất biến là điều PHẢI đúng sau mỗi transaction. Vi phạm không được lặng lẽ
 * trôi qua: transaction bị rollback và lỗi hiện ở bảng tự chẩn đoán (Phần 39).
 *
 * Hiệu năng: mỗi transaction chỉ kiểm những bản ghi **đã bị chạm**, nhờ `PhamViThayDoi`
 * do `apPatch` trả về. Kiểm toàn bộ thế giới là việc của `chayInvariantToanBo()` —
 * chạy khi nạp save, khi kết thúc replay và trong bảng chẩn đoán.
 */
import type { WorldState } from './state.js';
import type { PhamViThayDoi } from './patch.js';
import type { StructuredError } from '../contracts/errors.js';
/** Phạm vi kiểm: một tập bản ghi cụ thể, hoặc toàn bộ thế giới. */
export type PhamViKiem = PhamViThayDoi | 'tat_ca';
export declare const TOAN_BO: PhamViKiem;
export type Invariant = {
    readonly id: string;
    readonly ten: string;
    /** Trả danh sách vi phạm; rỗng là đạt. */
    readonly kiem: (s: WorldState, phamVi: PhamViKiem) => readonly string[];
    /** `fatal` thì rollback; `warning` thì cho qua nhưng ghi lại. */
    readonly mucDo: 'fatal' | 'warning';
    /**
     * true nếu bất biến chỉ có nghĩa khi nhìn toàn cục (ví dụ: đếm bậc đồ thị).
     * Những bất biến này bị bỏ qua khi kiểm theo phạm vi hẹp.
     */
    readonly canToanCuc?: boolean;
};
export declare function dangKyInvariant(inv: Invariant): void;
/** Đăng ký một bộ nạp bất biến của tầng trên và chạy nó ngay. Idempotent-safe. */
export declare function dangKyBoNapInvariant(fn: () => void): void;
export declare function danhSachInvariant(): readonly Invariant[];
export declare function datLaiInvariant(): void;
export type KetQuaInvariant = {
    dat: boolean;
    viPhamNang: readonly StructuredError[];
    canhBao: readonly StructuredError[];
};
export declare function chayInvariant(s: WorldState, phamVi?: PhamViKiem): KetQuaInvariant;
/** Kiểm toàn bộ thế giới — dùng khi nạp save, cuối replay, và ở bảng chẩn đoán. */
export declare function chayInvariantToanBo(s: WorldState): KetQuaInvariant;
