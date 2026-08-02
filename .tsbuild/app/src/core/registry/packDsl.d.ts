/**
 * Nhập Registry / World Pack — Phần 5.2 tầng 2, 62.1 loại 5, cổng Phase 10.
 *
 * ── Một cổng, một câu ──
 *
 * Cổng Phase 10: *"imported registry không chứa code."*
 *
 * Câu ấy đã được chuẩn bị từ Phase 0: `RegistryManifestSchema` là JSON thuần,
 * `ExprNodeSchema` là AST 12 op, `PatchTemplateSchema` là 8 op, và
 * `quetDauVetCode()` quét cả cây. File này chỉ ráp bốn hàng rào ấy thành một
 * đường nhập, và thêm một hàng rào nữa mà Phase 0 chưa cần:
 *
 * **`handlerId` lạ KHÔNG bị từ chối, nhưng cũng KHÔNG được chạy.** Nó vào ở
 * `can_adapter` (ADR-0006). Từ chối cả pack vì một handler chưa viết là mất
 * mười một mục hợp lệ vì một mục chưa tới; chạy nó là mở đúng cái cửa mà cổng
 * này tồn tại để đóng.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { Tuning } from '../tuning/schema.js';
import type { RegistryManifest, RegistryPack, TrangThaiMuc } from './manifest.js';
export type MucDaNhap = {
    readonly manifest: RegistryManifest;
    readonly trangThai: TrangThaiMuc;
    readonly lyDo: string;
};
export type KetQuaNhapPack = {
    readonly ok: boolean;
    readonly pack: RegistryPack | null;
    readonly muc: readonly MucDaNhap[];
    /** Bản vá tuning kèm theo pack, đã qua schema — 62.1 "manifest … tuning". */
    readonly tuning: Tuning | null;
    readonly issues: readonly ImportIssue[];
    readonly thongKe: {
        readonly tong: number;
        readonly hoatDong: number;
        readonly canAdapter: number;
        readonly cachLy: number;
    };
};
/**
 * Nhập một world pack đã parse.
 *
 * Không throw, không gọi mạng, không đăng ký gì vào `R` — trả về **kết quả** để
 * người gọi quyết định. Đăng ký là một hành động riêng, sau khi người dùng duyệt.
 */
export declare function nhapWorldPack(goc: unknown): KetQuaNhapPack;
/** Xuất một pack thành đúng một file JSON — đối xứng với `nhapWorldPack`. */
export declare function xuatWorldPack(pack: RegistryPack, tuning?: Tuning): string;
