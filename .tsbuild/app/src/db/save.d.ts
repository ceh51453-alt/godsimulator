/**
 * Export / import save, autosave và snapshot — Phần 38; cổng Phase 2.
 *
 * [BB] Phần 38: `proxyPassword` KHÔNG BAO GIỜ ghi vào file xuất.
 * [BB] Phần 78.2: hồ sơ riêng tư chỉ có mặt khi người dùng CHỦ ĐỘNG chọn
 *      "Kèm hồ sơ riêng tư".
 * [BB] Cổng: save round-trip phải giữ nguyên state hash.
 */
import type { ThienDienDb, SnapshotRow } from './schema.js';
import type { KhoDexie } from './repo.js';
import type { SaveExport } from '../core/contracts/branch.js';
import type { WorldState } from '../core/engine/state.js';
import type { Event } from '../core/contracts/core.js';
import type { KetQua, StructuredError } from '../core/contracts/errors.js';
export type TuyChonXuat = {
    /**
     * [BB] Mặc định FALSE. Hồ sơ riêng tư chỉ đi ra khi người chơi chủ động bật.
     * Đây là mặc định an toàn, không phải tùy chọn tiện lợi.
     */
    kemHoSoRiengTu?: boolean;
    appVersion?: string;
};
/** Dựng gói export từ một `WorldState` đã nạp. */
export declare function xuatSave(db: ThienDienDb, state: WorldState, events: readonly Event[], tuyChon?: TuyChonXuat): Promise<KetQua<SaveExport>>;
export type KetQuaNhap = {
    state: WorldState;
    events: readonly Event[];
    /** true nếu hash trong file khớp hash dựng lại được. */
    hashKhop: boolean;
    canhBao: readonly StructuredError[];
};
/**
 * Nhập một gói save. Dữ liệu không tin cậy → parse an toàn từng phần,
 * không throw, không đoán khi phiên bản lạ.
 */
export declare function nhapSave(tho: unknown): KetQua<KetQuaNhap>;
/** Số bản autosave giữ lại mỗi nhánh — Phần 38: "giữ 5 bản gần nhất mỗi nhánh". */
export declare const SO_AUTOSAVE_GIU = 5;
export declare function luuSnapshot(db: ThienDienDb, state: WorldState, scopeKey: string): Promise<SnapshotRow>;
export declare function phucHoiTuSnapshot(row: SnapshotRow): KetQua<WorldState>;
/** Ghi state hiện tại xuống DB rồi tạo snapshot — dùng cho autosave sau mỗi tick. */
export declare function autosave(db: ThienDienDb, kho: KhoDexie, state: WorldState, scopeKey: string): Promise<void>;
