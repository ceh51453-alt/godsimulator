/**
 * Kích hoạt, hoàn tác và phiên bản pack — Phần 65.3, 65.4, 65.5 [BB].
 *
 * ── Vì sao hoàn tác chỉ là đổi con trỏ ──
 *
 * [BB] 65.4: "Hoàn tác chỉ đổi con trỏ về `previousActivationId`. Không cần nhập
 * lại file." Điều đó chỉ đúng nếu kích hoạt **không bao giờ** viết vào lịch sử,
 * lorebook hay world state — và đó chính là lý do `kichHoat()` dưới đây không
 * nhận `WorldState`. Nó không thể làm bẩn thứ nó không nhìn thấy.
 *
 * ── Quyền ưu tiên ──
 *
 * ```text
 * Product safety > WorldView visibility > Engine invariants
 *   > Pipeline output contract > Native task instruction
 *   > User override trong Thiên Diễn > Imported prompt pack > Styling/transform
 * ```
 *
 * Bậc "Imported prompt pack" nằm áp chót, và [BB] 65.3 nói rõ: role `system` là
 * role gửi API, **không** phải quyền sửa engine.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { NormalizedPresetPack, PresetActivation, PresetPackRow } from './schema.js';
/** Tám bậc quyền ưu tiên — 65.3, cao xuống thấp. */
export declare const BAC_QUYEN: readonly string[];
export declare const BAC_CUA_PACK_NGOAI = 6;
export type KetQuaLint = {
    readonly dat: boolean;
    readonly issues: readonly ImportIssue[];
};
/**
 * Toàn bộ lint/test tĩnh chạy trước khi bật — 65.4 bước 2.
 *
 * Ba nhóm kiểm, và cả ba đều là điều kiện CHẶN chứ không phải cảnh báo:
 * cycle chưa gỡ, nhóm xung đột cần người chọn mà chưa chọn, và module cách ly bị
 * chọn để bật.
 */
export declare function lintTruocKhiBat(row: PresetPackRow, chon: {
    readonly selectedModuleIds: readonly string[];
    readonly conflictResolutions: Readonly<Record<string, unknown>>;
}): KetQuaLint;
export type DauVaoKichHoat = {
    readonly row: PresetPackRow;
    readonly saveId: string;
    readonly branchId: string;
    readonly targets: readonly string[];
    readonly selectedModuleIds: readonly string[];
    readonly conflictResolutions: Readonly<Record<string, unknown>>;
    readonly activatedAt: number;
    readonly previousActivationId: string | null;
};
export type KetQuaKichHoat = {
    readonly ok: true;
    readonly activation: PresetActivation;
    readonly issues: readonly ImportIssue[];
} | {
    readonly ok: false;
    readonly issues: readonly ImportIssue[];
};
/**
 * Một giao dịch kích hoạt — 65.4.
 *
 * 1. Compile lại bằng version đã chọn (người gọi truyền `row` của version ấy).
 * 2. Chạy toàn bộ lint/test tĩnh.
 * 3. Lưu activation mới.
 * 4. Đổi con trỏ active atomically (người gọi ghi một hàng, không sửa hàng cũ).
 * 5. [BB] Không viết lại lịch sử, lorebook hay world state.
 */
export declare function kichHoat(dv: DauVaoKichHoat): KetQuaKichHoat;
/**
 * Hoàn tác — 65.4.
 *
 * Trả về id activation trước đó, hoặc `null` nghĩa là "về prompt native". Không
 * có nhánh nào ở đây đụng tới pack, raw source hay lịch sử: hoàn tác một lần và
 * hoàn tác một trăm lần đều chỉ là đọc một trường.
 */
export declare function hoanTac(hienTai: PresetActivation | null): {
    readonly veActivationId: string | null;
    readonly veNative: boolean;
};
/**
 * Áp một activation lên pack: trả bản pack chỉ còn module đã chọn.
 *
 * Bản gốc không bị sửa. Đây là hàm mà compiler nên nhận đầu vào — nhờ vậy "tắt
 * pack" chỉ là **không gọi hàm này**, và prompt native quay lại nguyên vẹn.
 */
export declare function apActivation(row: PresetPackRow, act: PresetActivation | null): NormalizedPresetPack;
export type MucDiff = {
    readonly moduleId: string;
    readonly loai: 'them' | 'bo' | 'doi_order' | 'doi_enabled' | 'doi_noi_dung' | 'doi_macro';
    readonly truoc: string;
    readonly sau: string;
};
export type DiffPack = {
    readonly moduleDiff: readonly MucDiff[];
    readonly thamSoDoi: readonly {
        readonly truong: string;
        readonly truoc: unknown;
        readonly sau: unknown;
    }[];
    readonly extensionDoi: readonly string[];
};
/**
 * Diff giữa hai version của cùng pack — 65.5.
 *
 * Sáu chiều đặc tả nêu: module id, order, enabled, content hash, macro, parameter,
 * extension. Diff theo **id** chứ không theo vị trí: một module chèn vào giữa
 * không được làm mọi module sau nó hiện là "đã đổi".
 */
export declare function diffPack(cu: PresetPackRow, moi: PresetPackRow): DiffPack;
/**
 * Số version cho một lần nhập mới của cùng pack — 65.5.
 *
 * Cùng hash → không tạo bản trùng (bắt ở bước 3 của pipeline). Khác hash → version
 * mới, và [BB] **không ghi đè version cũ**: activation cũ tiếp tục trỏ bản cũ tới
 * khi người dùng chủ động nâng.
 */
export declare function versionKeTiep(daCo: readonly PresetPackRow[]): number;
