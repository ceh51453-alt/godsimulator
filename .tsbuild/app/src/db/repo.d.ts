/**
 * Repository copy-on-write theo nhánh — Phần 26.1, 61.5 (ADR-0014).
 *
 * [BB] Đọc: nhánh hiện tại → lần lên `gocId` → tới gốc; bản ghi ở nhánh GẦN NHẤT thắng.
 * [BB] Ghi: LUÔN vào nhánh hiện tại. Không bao giờ sửa bản ghi của nhánh cha.
 * [BB] Xóa: ghi bia mộ ở nhánh hiện tại, không xóa bản ghi của cha.
 *
 * Nhờ vậy fork là thao tác O(1) — chỉ thêm một bản ghi `Branch` — và hai nhánh
 * sửa cùng một entity sẽ KHÔNG đè lên nhau.
 */
import type { ThienDienDb } from './schema.js';
import type { Entity, Link, Gap } from '../core/schema/entity.js';
import type { KnowledgeRow, DebtRow } from '../core/schema/soSach.js';
import type { Prayer } from '../core/schema/than.js';
import type { Storyline, Foreshadow } from '../core/schema/truyen.js';
import type { SubstrateLaw, CoCheRow } from '../core/vatly/schema.js';
import type { Lorebook, LoreExpectation, DiBan } from '../core/lore/schema.js';
import type { Branch } from '../core/contracts/branch.js';
import type { Event, World } from '../core/contracts/core.js';
import type { WorldState, KhoState } from '../core/engine/state.js';
import type { KetQua } from '../core/contracts/errors.js';
/**
 * Bảng có áp dụng copy-on-write. `knowledge` và `debts` vào từ v4 (Phase 5);
 * `storylines` và `foreshadows` vào từ v7 (Phase 8, ADR-0036).
 */
export declare const BANG_COW: readonly ["entities", "links", "gaps", "knowledge", "debts", "prayers", "storylines", "foreshadows", "substrateLaws", "coChe", "lorebooks", "loreExpectations", "diBan"];
export type BangCow = (typeof BANG_COW)[number];
export type BanGhiCoId = {
    id: string;
    branchId: string;
};
/** Ánh xạ tên bảng → kiểu bản ghi, để `doc`/`ghi`/`docTatCa` suy kiểu đúng. */
export type KieuBang = {
    entities: Entity;
    links: Link;
    gaps: Gap;
    knowledge: KnowledgeRow;
    debts: DebtRow;
    prayers: Prayer;
    storylines: Storyline;
    foreshadows: Foreshadow;
    substrateLaws: SubstrateLaw;
    coChe: CoCheRow;
    lorebooks: Lorebook;
    loreExpectations: LoreExpectation;
    diBan: DiBan;
};
export declare class KhoNhanh {
    private readonly db;
    constructor(db: ThienDienDb);
    /** Chuỗi nhánh từ hiện tại lên tới gốc. Phần tử đầu là nhánh hiện tại. */
    chuoiToTien(branchId: string): Promise<string[]>;
    taoNhanh(b: Branch): Promise<void>;
    /**
     * Fork: tạo nhánh con trỏ về `gocId`. KHÔNG sao chép dữ liệu —
     * bản sao chỉ sinh ra khi có ghi thật (copy-on-write).
     */
    fork(nhanhMoi: Branch): Promise<void>;
    private bang;
    /** Đọc một bản ghi theo quy tắc copy-on-write. */
    doc<K extends BangCow>(ten: K, branchId: string, id: string): Promise<KieuBang[K] | undefined>;
    /** Ghi vào NHÁNH HIỆN TẠI. `branchId` của bản ghi bị ép về nhánh đang ghi. */
    ghi<K extends BangCow>(ten: K, branchId: string, banGhi: KieuBang[K]): Promise<void>;
    /** Xóa ở nhánh hiện tại: đặt bia mộ, không đụng bản ghi của cha. */
    xoa(ten: BangCow, branchId: string, id: string, tick: number): Promise<void>;
    /**
     * Đọc toàn bộ bảng cho một nhánh, đã hợp nhất theo copy-on-write.
     * Duyệt từ GỐC xuống nhánh hiện tại để nhánh gần hơn ghi đè nhánh xa hơn.
     */
    docTatCa<K extends BangCow>(ten: K, branchId: string): Promise<Map<string, KieuBang[K]>>;
    /** World của một nhánh, lần lên cha nếu nhánh con chưa từng ghi world riêng. */
    docWorld(branchId: string): Promise<World | undefined>;
    docMetrics(branchId: string): Promise<unknown>;
}
/** Cài `KhoState` của core bằng Dexie. Core chỉ thấy interface, không thấy Dexie. */
export declare class KhoDexie implements KhoState {
    private readonly db;
    private readonly nhanh;
    constructor(db: ThienDienDb);
    get kho(): KhoNhanh;
    docState(branchId: string): Promise<WorldState | undefined>;
    ghiState(s: WorldState): Promise<void>;
    docEvents(branchId: string): Promise<readonly Event[]>;
    themEvent(e: Event): Promise<void>;
}
/** Nạp state của một nhánh, có kiểm tra lỗi có cấu trúc thay vì throw. */
export declare function napState(kho: KhoDexie, branchId: string): Promise<KetQua<WorldState>>;
