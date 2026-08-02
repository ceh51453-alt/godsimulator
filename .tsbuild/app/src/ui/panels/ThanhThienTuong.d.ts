import type { CumThienTuong } from '../../core/bang/thienDien.js';
export type MucGhimDuoc = {
    readonly khoa: string;
    readonly nhan: string;
};
export declare function ThanhThienTuong({ cum, ghimDuoc, dangGhim, loiGhim, onMoBang, onGhim, onBoGhim, }: {
    cum: readonly CumThienTuong[];
    /** Mọi chỉ số của vùng "Đang thế nào" — nguồn để chọn ghim. */
    ghimDuoc?: readonly MucGhimDuoc[];
    dangGhim?: readonly string[];
    loiGhim?: string;
    onMoBang: () => void;
    onGhim?: (khoa: string) => void;
    onBoGhim?: (khoa: string) => void;
}): JSX.Element;
