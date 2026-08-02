/**
 * createRegistry — Phần 5 [BB].
 *
 * Ba tầng nạp (5.2):
 *   1. Dựng sẵn  — luôn nạp
 *   2. Mod pack  — người dùng bật/tắt từng pack
 *   3. Ghi đè    — người dùng sửa từng trường
 *
 * [BB] Ghi đè phải validate lại bằng schema của registry đó. Ghi đè hỏng →
 * BỎ ghi đè, giữ giá trị tầng dưới, ghi cảnh báo vào bảng tự chẩn đoán. KHÔNG crash.
 */
import type { StructuredError } from '../contracts/errors.js';
import type { RegistryId } from './manifest.js';
export type TangNap = 'dung_san' | 'pack' | 'ghi_de';
export type MucRegistry<T> = {
    readonly id: string;
    readonly gia_tri: T;
    readonly tang: TangNap;
    readonly packId: string | null;
};
export type Registry<T extends {
    id: string;
}> = {
    readonly ten: RegistryId;
    /** Đăng ký mục dựng sẵn. Gọi lúc khởi động, trong code. */
    dangKy(def: T): void;
    /** Lấy một mục. undefined nếu chưa khai. */
    lay(id: string): T | undefined;
    /** [BB] Kiểm tính hợp lệ của một chuỗi kind/verb/... */
    co(id: string): boolean;
    /** Danh sách id, sắp xếp deterministic (codepoint, không locale). */
    danhSachId(): readonly string[];
    tatCa(): readonly T[];
    /** Nạp từ pack. Trả cảnh báo, không throw. */
    napPack(packId: string, defs: readonly T[]): StructuredError[];
    /** Ghi đè một phần: chỉ trường có mặt mới bị thay. */
    ghiDe(id: string, patch: Partial<T>): StructuredError[];
    /** Khôi phục mặc định một mục. */
    khoiPhuc(id: string): void;
    /** Xóa toàn bộ tầng pack + ghi đè, giữ dựng sẵn. */
    datLai(): void;
    /** Cảnh báo tích lũy cho bảng tự chẩn đoán (Phần 39). */
    canhBao(): readonly StructuredError[];
};
export type KiemTraDef<T> = (def: unknown) => {
    ok: true;
    value: T;
} | {
    ok: false;
    errors: string[];
};
export declare function createRegistry<T extends {
    id: string;
}>(ten: RegistryId, kiemTra?: KiemTraDef<T>): Registry<T>;
