/**
 * WorldState trong bộ nhớ + repository interface — Phase 1.
 *
 * [BB] Đây là TOÀN BỘ state của một nhánh. Không có state ẩn ở nơi khác.
 * Dexie (Phase 2) cài đúng interface này; test chạy được mà không cần trình duyệt.
 */
import type { Entity, Link, Gap, WorldMetrics } from '../schema/entity.js';
import type { KnowledgeRow, DebtRow } from '../schema/soSach.js';
import type { Prayer } from '../schema/than.js';
import type { Storyline, Foreshadow } from '../schema/truyen.js';
import type { SubstrateLaw, CoCheRow } from '../vatly/schema.js';
import type { Lorebook, LoreExpectation, DiBan } from '../lore/schema.js';
import type { Event, World } from '../contracts/core.js';
/**
 * Tên bảng được phép xuất hiện trong `PatchOp.target.table`.
 * `knowledge` và `debts` vào từ Phase 5 (Phần 71.4) — xem ADR-0020.
 * `storylines` và `foreshadows` vào từ Phase 8 (Phần 28, 30.2) — xem ADR-0036.
 */
export declare const BANG: readonly ["worlds", "entities", "links", "gaps", "metrics", "knowledge", "debts", "prayers", "storylines", "foreshadows", "substrateLaws", "coChe", "lorebooks", "loreExpectations", "diBan"];
export type TenBang = (typeof BANG)[number];
export declare function laTenBang(s: string): s is TenBang;
export type WorldState = {
    world: World;
    entities: Map<string, Entity>;
    links: Map<string, Link>;
    gaps: Map<string, Gap>;
    metrics: WorldMetrics;
    /** Ai biết gì, biết từ đâu, qua mấy chặng — Phần 67.3, 71.4. */
    knowledge: Map<string, KnowledgeRow>;
    /** Nợ hai đầu — Phần 71.2 `exchange_debt`. */
    debts: Map<string, DebtRow>;
    /** Lời cầu — Phần 22. Mỗi dòng truy được về một bế tắc thật. */
    prayers: Map<string, Prayer>;
    /** Mạch truyện — Phần 28. Cốt truyện là DỮ LIỆU, chạy tiếp khi không ai nhìn. */
    storylines: Map<string, Storyline>;
    /** Sổ Phục Bút — Phần 30.2. Thứ đã gieo không bao giờ tự biến mất. */
    foreshadows: Map<string, Foreshadow>;
    /**
     * Bảy trục Luật Nền — Phần 43.
     *
     * Nằm trong state (chứ không nằm trong config) vì [BB] 43.6 bắt sửa luật nền
     * phải PHÂN NHÁNH: hai nhánh cùng gốc có thể chạy hai bộ vật lý khác nhau, và
     * điều đó chỉ đúng nếu luật nền là dữ liệu theo nhánh.
     */
    substrateLaws: Map<string, SubstrateLaw>;
    /** Cơ Chế Phái Sinh đang bật/tắt — Phần 44.4. */
    coChe: Map<string, CoCheRow>;
    /**
     * Lorebook theo nhánh — Phần 35.
     *
     * [BB] 50.10 — workflow chỉ được ghi vào lorebook `nguon = 'tu_sinh'`. Trường
     * `nguon` nằm ngay trên bản ghi nên mọi đường ghi đều kiểm được cùng một chỗ.
     */
    lorebooks: Map<string, Lorebook>;
    /** Kỳ vọng trích từ lorebook đang bật — Phần 35.4. */
    loreExpectations: Map<string, LoreExpectation>;
    /** Dị Bản — Phần 35.5. Hồ sơ về việc thế giới đã trở thành cái gì. */
    diBan: Map<string, DiBan>;
};
export declare function taoState(world: World): WorldState;
/** Bản sao sâu đủ để rollback. Chỉ chứa dữ liệu JSON thuần nên an toàn. */
export declare function saoChepState(s: WorldState): WorldState;
/**
 * Hash chính tắc của toàn bộ state.
 *
 * [BB] Cổng Phase 1: cùng seed + state đầu + event log → cùng hash.
 * Trường cache `_hash` và `_degree` bị LOẠI khỏi phép băm: chúng là dữ liệu
 * dẫn xuất, không phải sự thật, và tính lại được.
 */
export declare function hashState(s: WorldState): string;
/** Nhật ký Event append-only. */
export type EventLog = {
    them(e: Event): void;
    tatCa(): readonly Event[];
    theoId(id: string): Event | undefined;
    soLuong(): number;
    hash(): string;
};
export declare function taoEventLog(banDau?: readonly Event[]): EventLog;
/** Repository interface — Dexie (Phase 2) cài đúng hình dạng này. */
export type KhoState = {
    docState(branchId: string): Promise<WorldState | undefined>;
    ghiState(s: WorldState): Promise<void>;
    docEvents(branchId: string): Promise<readonly Event[]>;
    themEvent(e: Event): Promise<void>;
};
/** Kho trong bộ nhớ — dùng cho test và cho replay. */
export declare function taoKhoBoNho(): KhoState;
