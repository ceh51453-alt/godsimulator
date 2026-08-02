/**
 * Kho preset và trạng thái giao diện — Phase 11.
 *
 * Tầng này chỉ đọc/ghi. Mọi quyết định (nhập được không, bật được không, xung
 * đột giải thế nào) nằm ở `core/preset/`, và đó là ranh giới cũ của cả repo:
 * `core/` không biết Dexie tồn tại, `db/` không biết luật.
 *
 * [BB] 66.6 — biến pack khóa theo `[packId+branchId]`. Hàm dưới đây không có
 * biến thể nào đọc theo mình `packId`, nên không có đường nào để biến của nhánh
 * này chảy sang nhánh khác.
 */
import type { ThienDienDb } from './schema.js';
import type { HangUiState } from './schema.js';
import type { PresetPackRow, RawSourceRow, PresetActivation } from '../core/preset/schema.js';
export declare function ghiPack(db: ThienDienDb, row: PresetPackRow, raw: RawSourceRow): Promise<void>;
export declare function docThuVien(db: ThienDienDb): Promise<PresetPackRow[]>;
export declare function docBanMoiNhat(db: ThienDienDb, packId: string): Promise<PresetPackRow | undefined>;
/**
 * Xóa một pack khỏi thư viện.
 *
 * KHÔNG xóa `presetRaw`: blob nguồn khóa theo hash, và một hash có thể được nhiều
 * version trỏ tới. Xóa nó ở đây sẽ làm bản version khác mất đường round-trip —
 * đúng thứ 62.2 dựng vỏ nhập bất biến để tránh.
 */
export declare function xoaPack(db: ThienDienDb, packId: string): Promise<void>;
export declare function ghiKichHoat(db: ThienDienDb, act: PresetActivation): Promise<void>;
/**
 * Activation đang có hiệu lực trên một nhánh.
 *
 * Mỗi pack chỉ giữ bản mới nhất: 65.4 nói hoàn tác là "đổi con trỏ về
 * `previousActivationId`", nên lịch sử vẫn còn nguyên trong bảng, chỉ có bản
 * đứng đầu chuỗi là đang chạy.
 */
export declare function docKichHoatDangChay(db: ThienDienDb, branchId: string): Promise<PresetActivation[]>;
export declare function goKichHoat(db: ThienDienDb, packId: string, branchId: string): Promise<void>;
export declare function docBienPack(db: ThienDienDb, packId: string, branchId: string): Promise<Record<string, unknown>>;
export declare function ghiBienPack(db: ThienDienDb, packId: string, branchId: string, bien: Record<string, unknown>, tickGhi: number): Promise<void>;
export declare function docUiState(db: ThienDienDb, saveId: string, branchId: string): Promise<HangUiState | undefined>;
export declare function ghiUiState(db: ThienDienDb, hang: HangUiState): Promise<void>;
