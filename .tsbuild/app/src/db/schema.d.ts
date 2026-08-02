/**
 * Dexie — Phần 38, 61.5, 79.1.
 *
 * [BB] Migration TĂNG DẦN. `db.version(1)` giữ nguyên để save cũ còn đường đọc;
 * không bao giờ sửa v1 rồi tuyên bố "đã nâng cấp".
 *
 * [BB] `scopeKey = mode + ':' + (chuTheId ?? 'root')` — không dùng `null`
 * bên trong compound primary key.
 */
import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Entity, Link, Gap } from '../core/schema/entity.js';
import type { Event, World } from '../core/contracts/core.js';
import type { Branch, Tombstone } from '../core/contracts/branch.js';
import type { PlayerProfile, CreatorIdentity } from '../core/schema/player.js';
import type { RerankCacheEntry, RetrievalRun, RetrievalEvalCase } from '../core/schema/rerank.js';
import type { KnowledgeRow, DebtRow } from '../core/schema/soSach.js';
import type { Prayer } from '../core/schema/than.js';
import type { Storyline, Foreshadow } from '../core/schema/truyen.js';
import type { Chunk } from '../core/retrieval/chunk.js';
import type { AiConfig } from '../core/ai/cauHinh.js';
import type { SubstrateLaw, CoCheRow } from '../core/vatly/schema.js';
import type { Lorebook, LoreExpectation, DiBan } from '../core/lore/schema.js';
import type { PresetPackRow, RawSourceRow, PresetActivation } from '../core/preset/schema.js';
import type { DongLichSuBenchmark } from '../core/retrieval/benchmark.js';
export type BanGhiMetrics = {
    branchId: string;
    metrics: unknown;
};
export type BanGhiSetting = {
    key: string;
    value: unknown;
};
/**
 * Biến của một pack trên một nhánh — [BB] 66.6.
 *
 * Khóa kép là hàng rào: không có truy vấn nào lấy được biến mà không nêu cả
 * `packId` lẫn `branchId`, nên "biến toàn cục xuyên save" không phải chuyện bị
 * cấm bằng lời — nó là chuyện không viết ra được.
 */
export type HangBienPack = {
    packId: string;
    branchId: string;
    bien: Record<string, unknown>;
    /** Nhịp thế giới lúc ghi — không dùng đồng hồ máy. */
    tickGhi: number;
};
/** Trạng thái giao diện theo save và nhánh — 59.2. */
export type HangUiState = {
    saveId: string;
    branchId: string;
    /** `BangSnapshot` đã serialize; đọc lại qua `BangSnapshotSchema`. */
    anhBang: unknown;
    tabThongTin: string;
    theoDoiMachIds: string[];
    ghimTongQuan: string[];
};
/**
 * Cấu hình AI của MÁY này. Một hàng duy nhất, `id = 'may_nay'`.
 * Không mang theo save vì proxy của người này không chạy trên máy người kia.
 */
export type BanGhiAiConfig = {
    id: string;
    cauHinh: AiConfig;
};
/** Checkpoint migration — cho phép tiếp tục sau khi crash giữa chừng. */
export type MigrationCheckpoint = {
    /** `v1_v2` hoặc `v2_v3`. */
    id: string;
    buoc: string;
    soBanGhiDaXong: number;
    hoanTat: boolean;
    /** Tick lúc ghi checkpoint — không dùng thời gian máy. */
    tickGhi: number;
};
export type SnapshotRow = {
    branchId: string;
    scopeKey: string;
    tick: number;
    stateHash: string;
    /** Ảnh chụp đã tuần tự hóa. */
    duLieu: unknown;
};
export declare class ThienDienDb extends Dexie {
    worlds: Table<World, string>;
    branches: Table<Branch, string>;
    entities: Table<Entity, [string, string]>;
    links: Table<Link, [string, string]>;
    gaps: Table<Gap, [string, string]>;
    metrics: Table<BanGhiMetrics, string>;
    events: Table<Event, [string, string]>;
    tombstones: Table<Tombstone, [string, string, string]>;
    snapshots: Table<SnapshotRow, [string, string, number]>;
    settings: Table<BanGhiSetting, string>;
    migrationCheckpoints: Table<MigrationCheckpoint, string>;
    playerProfiles: Table<PlayerProfile, string>;
    playerIdentities: Table<CreatorIdentity & {
        saveId: string;
    }, [string, string]>;
    rerankCache: Table<RerankCacheEntry, string[]>;
    retrievalRuns: Table<RetrievalRun, number>;
    retrievalEval: Table<RetrievalEvalCase, string>;
    knowledge: Table<KnowledgeRow, [string, string]>;
    debts: Table<DebtRow, [string, string]>;
    prayers: Table<Prayer, [string, string]>;
    aiConfigs: Table<BanGhiAiConfig, string>;
    storylines: Table<Storyline, [string, string]>;
    foreshadows: Table<Foreshadow, [string, string]>;
    chunks: Table<Chunk, [string, string]>;
    /** Năm bảng theo NHÁNH, copy-on-write như `entities`. */
    substrateLaws: Table<SubstrateLaw, [string, string]>;
    coChe: Table<CoCheRow, [string, string]>;
    lorebooks: Table<Lorebook, [string, string]>;
    loreExpectations: Table<LoreExpectation, [string, string]>;
    diBan: Table<DiBan, [string, string]>;
    /**
     * Ba bảng THƯ VIỆN — thuộc về máy, không thuộc về nhánh.
     *
     * Cùng lý do với `aiConfigs`: một pack đã nhập trên máy này không tự có mặt
     * trên máy khác, và đổi nhánh không được làm mất thư viện preset.
     */
    presetPacks: Table<PresetPackRow, [string, number]>;
    presetRaw: Table<RawSourceRow, string>;
    presetActivations: Table<PresetActivation, string>;
    /** Lịch sử chỉ số benchmark — món nợ ghi ở cuối Phase 8. */
    benchmarkRuns: Table<DongLichSuBenchmark, string>;
    /** Biến của pack, theo nhánh — [BB] 66.6, không bao giờ là biến toàn cục. */
    presetVars: Table<HangBienPack, [string, string]>;
    /** Trạng thái giao diện theo save — 59.2. Ngoài `WorldState`, ngoài hash. */
    uiState: Table<HangUiState, [string, string]>;
    constructor(ten?: string);
}
/** Phiên bản Dexie mà app hiện tại mong đợi. */
export declare const DEXIE_VERSION_HIEN_TAI = 9;
