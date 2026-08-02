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
import { WorldMetricsSchema } from '../core/schema/entity.js';
import type { WorldState, KhoState } from '../core/engine/state.js';
import { taoState } from '../core/engine/state.js';
import { loi } from '../core/contracts/errors.js';
import type { KetQua } from '../core/contracts/errors.js';
import { dat, hong } from '../core/contracts/errors.js';

/**
 * Bảng có áp dụng copy-on-write. `knowledge` và `debts` vào từ v4 (Phase 5);
 * `storylines` và `foreshadows` vào từ v7 (Phase 8, ADR-0036).
 */
export const BANG_COW = [
  'entities',
  'links',
  'gaps',
  'knowledge',
  'debts',
  'prayers',
  'storylines',
  'foreshadows',
  // ── v8 (Phase 9 + 10) ──
  'substrateLaws',
  'coChe',
  'lorebooks',
  'loreExpectations',
  'diBan',
] as const;
export type BangCow = (typeof BANG_COW)[number];

export type BanGhiCoId = { id: string; branchId: string };

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

export class KhoNhanh {
  constructor(private readonly db: ThienDienDb) {}

  /** Chuỗi nhánh từ hiện tại lên tới gốc. Phần tử đầu là nhánh hiện tại. */
  async chuoiToTien(branchId: string): Promise<string[]> {
    const chuoi: string[] = [];
    const daThay = new Set<string>();
    let hienTai: string | null = branchId;
    while (hienTai !== null) {
      if (daThay.has(hienTai)) break; // chống chu trình dữ liệu hỏng
      daThay.add(hienTai);
      chuoi.push(hienTai);
      const b: Branch | undefined = await this.db.branches.get(hienTai);
      hienTai = b?.gocId ?? null;
    }
    return chuoi;
  }

  async taoNhanh(b: Branch): Promise<void> {
    await this.db.branches.put(b);
  }

  /**
   * Fork: tạo nhánh con trỏ về `gocId`. KHÔNG sao chép dữ liệu —
   * bản sao chỉ sinh ra khi có ghi thật (copy-on-write).
   */
  async fork(nhanhMoi: Branch): Promise<void> {
    if (nhanhMoi.gocId === null) {
      throw new Error('fork() cần gocId; nhánh gốc dùng taoNhanh().');
    }
    await this.db.branches.put(nhanhMoi);
  }

  private bang(ten: BangCow) {
    if (ten === 'entities') return this.db.entities;
    if (ten === 'links') return this.db.links;
    if (ten === 'knowledge') return this.db.knowledge;
    if (ten === 'debts') return this.db.debts;
    if (ten === 'prayers') return this.db.prayers;
    if (ten === 'storylines') return this.db.storylines;
    if (ten === 'foreshadows') return this.db.foreshadows;
    if (ten === 'substrateLaws') return this.db.substrateLaws;
    if (ten === 'coChe') return this.db.coChe;
    if (ten === 'lorebooks') return this.db.lorebooks;
    if (ten === 'loreExpectations') return this.db.loreExpectations;
    if (ten === 'diBan') return this.db.diBan;
    return this.db.gaps;
  }

  /** Đọc một bản ghi theo quy tắc copy-on-write. */
  async doc<K extends BangCow>(ten: K, branchId: string, id: string): Promise<KieuBang[K] | undefined> {
    for (const b of await this.chuoiToTien(branchId)) {
      // Bia mộ ở nhánh gần hơn thắng bản ghi ở nhánh xa hơn.
      const mo = await this.db.tombstones.get([b, ten, id]);
      if (mo) return undefined;
      const banGhi = await this.bang(ten).get([b, id]);
      if (banGhi) return banGhi as unknown as KieuBang[K];
    }
    return undefined;
  }

  /** Ghi vào NHÁNH HIỆN TẠI. `branchId` của bản ghi bị ép về nhánh đang ghi. */
  async ghi<K extends BangCow>(ten: K, branchId: string, banGhi: KieuBang[K]): Promise<void> {
    await this.bang(ten).put({ ...banGhi, branchId } as never);
    // Ghi lại thì bia mộ ở nhánh này không còn ý nghĩa.
    await this.db.tombstones.delete([branchId, ten, banGhi.id]);
  }

  /** Xóa ở nhánh hiện tại: đặt bia mộ, không đụng bản ghi của cha. */
  async xoa(ten: BangCow, branchId: string, id: string, tick: number): Promise<void> {
    await this.bang(ten).delete([branchId, id]);
    await this.db.tombstones.put({ branchId, bang: ten, id, tickXoa: tick });
  }

  /**
   * Đọc toàn bộ bảng cho một nhánh, đã hợp nhất theo copy-on-write.
   * Duyệt từ GỐC xuống nhánh hiện tại để nhánh gần hơn ghi đè nhánh xa hơn.
   */
  async docTatCa<K extends BangCow>(ten: K, branchId: string): Promise<Map<string, KieuBang[K]>> {
    const chuoi = await this.chuoiToTien(branchId);
    const ra = new Map<string, KieuBang[K]>();

    for (const b of [...chuoi].reverse()) {
      const rows = (await this.bang(ten).where('branchId').equals(b).toArray()) as unknown as KieuBang[K][];
      for (const r of rows) ra.set(r.id, r);
      const mo = await this.db.tombstones.where('branchId').equals(b).toArray();
      for (const m of mo) if (m.bang === ten) ra.delete(m.id);
    }
    return ra;
  }

  /** World của một nhánh, lần lên cha nếu nhánh con chưa từng ghi world riêng. */
  async docWorld(branchId: string): Promise<World | undefined> {
    for (const b of await this.chuoiToTien(branchId)) {
      const w = await this.db.worlds.get(b);
      if (w) return w;
    }
    return undefined;
  }

  async docMetrics(branchId: string): Promise<unknown> {
    for (const b of await this.chuoiToTien(branchId)) {
      const m = await this.db.metrics.get(b);
      if (m) return m.metrics;
    }
    return undefined;
  }
}

/** Cài `KhoState` của core bằng Dexie. Core chỉ thấy interface, không thấy Dexie. */
export class KhoDexie implements KhoState {
  private readonly nhanh: KhoNhanh;

  constructor(private readonly db: ThienDienDb) {
    this.nhanh = new KhoNhanh(db);
  }

  get kho(): KhoNhanh {
    return this.nhanh;
  }

  async docState(branchId: string): Promise<WorldState | undefined> {
    const world = await this.nhanh.docWorld(branchId);
    if (!world) return undefined;

    // World của nhánh cha mang branchId của cha; state đang nạp là của nhánh CON.
    const s = taoState({ ...world, branchId });
    s.entities = await this.nhanh.docTatCa('entities', branchId);
    s.links = await this.nhanh.docTatCa('links', branchId);
    s.gaps = await this.nhanh.docTatCa('gaps', branchId);
    s.knowledge = await this.nhanh.docTatCa('knowledge', branchId);
    s.debts = await this.nhanh.docTatCa('debts', branchId);
    s.prayers = await this.nhanh.docTatCa('prayers', branchId);
    s.storylines = await this.nhanh.docTatCa('storylines', branchId);
    s.foreshadows = await this.nhanh.docTatCa('foreshadows', branchId);
    s.substrateLaws = await this.nhanh.docTatCa('substrateLaws', branchId);
    s.coChe = await this.nhanh.docTatCa('coChe', branchId);
    s.lorebooks = await this.nhanh.docTatCa('lorebooks', branchId);
    s.loreExpectations = await this.nhanh.docTatCa('loreExpectations', branchId);
    s.diBan = await this.nhanh.docTatCa('diBan', branchId);

    // Entity kế thừa từ nhánh cha phải mang branchId của nhánh đang đọc,
    // nếu không invariant `entity_dung_nhanh` sẽ báo sai.
    for (const [id, e] of s.entities) if (e.branchId !== branchId) s.entities.set(id, { ...e, branchId });
    for (const [id, l] of s.links) if (l.branchId !== branchId) s.links.set(id, { ...l, branchId });
    for (const [id, g] of s.gaps) if (g.branchId !== branchId) s.gaps.set(id, { ...g, branchId });
    for (const [id, k] of s.knowledge) if (k.branchId !== branchId) s.knowledge.set(id, { ...k, branchId });
    for (const [id, d] of s.debts) if (d.branchId !== branchId) s.debts.set(id, { ...d, branchId });
    for (const [id, p] of s.prayers) if (p.branchId !== branchId) s.prayers.set(id, { ...p, branchId });
    for (const [id, m] of s.storylines) if (m.branchId !== branchId) s.storylines.set(id, { ...m, branchId });
    for (const [id, f] of s.foreshadows)
      if (f.branchId !== branchId) s.foreshadows.set(id, { ...f, branchId });
    for (const [id, x] of s.substrateLaws)
      if (x.branchId !== branchId) s.substrateLaws.set(id, { ...x, branchId });
    for (const [id, x] of s.coChe) if (x.branchId !== branchId) s.coChe.set(id, { ...x, branchId });
    for (const [id, x] of s.lorebooks) if (x.branchId !== branchId) s.lorebooks.set(id, { ...x, branchId });
    for (const [id, x] of s.loreExpectations)
      if (x.branchId !== branchId) s.loreExpectations.set(id, { ...x, branchId });
    for (const [id, x] of s.diBan) if (x.branchId !== branchId) s.diBan.set(id, { ...x, branchId });

    const m = await this.nhanh.docMetrics(branchId);
    s.metrics = WorldMetricsSchema.parse(m ?? undefined);
    return s;
  }

  async ghiState(s: WorldState): Promise<void> {
    const branchId = s.world.branchId;
    await this.db.transaction(
      'rw',
      [
        this.db.worlds,
        this.db.entities,
        this.db.links,
        this.db.gaps,
        this.db.metrics,
        this.db.knowledge,
        this.db.debts,
        this.db.prayers,
        this.db.storylines,
        this.db.foreshadows,
        this.db.substrateLaws,
        this.db.coChe,
        this.db.lorebooks,
        this.db.loreExpectations,
        this.db.diBan,
      ],
      async () => {
        await this.db.worlds.put({ ...s.world, branchId });
        for (const e of s.entities.values()) await this.db.entities.put({ ...e, branchId });
        for (const l of s.links.values()) await this.db.links.put({ ...l, branchId });
        for (const g of s.gaps.values()) await this.db.gaps.put({ ...g, branchId });
        for (const k of s.knowledge.values()) await this.db.knowledge.put({ ...k, branchId });
        for (const d of s.debts.values()) await this.db.debts.put({ ...d, branchId });
        for (const p of s.prayers.values()) await this.db.prayers.put({ ...p, branchId });
        for (const m of s.storylines.values()) await this.db.storylines.put({ ...m, branchId });
        for (const f of s.foreshadows.values()) await this.db.foreshadows.put({ ...f, branchId });
        for (const x of s.substrateLaws.values()) await this.db.substrateLaws.put({ ...x, branchId });
        for (const x of s.coChe.values()) await this.db.coChe.put({ ...x, branchId });
        for (const x of s.lorebooks.values()) await this.db.lorebooks.put({ ...x, branchId });
        for (const x of s.loreExpectations.values()) await this.db.loreExpectations.put({ ...x, branchId });
        for (const x of s.diBan.values()) await this.db.diBan.put({ ...x, branchId });
        await this.db.metrics.put({ branchId, metrics: s.metrics });
      },
    );
  }

  async docEvents(branchId: string): Promise<readonly Event[]> {
    // Event là append-only và thuộc về nhánh sinh ra nó; nhánh con kế thừa
    // toàn bộ lịch sử của cha tính tới điểm tách.
    const chuoi = await this.nhanh.chuoiToTien(branchId);
    const ra: Event[] = [];
    for (const b of [...chuoi].reverse()) {
      const rows = await this.db.events.where('branchId').equals(b).toArray();
      ra.push(...rows);
    }
    // Sắp xếp deterministic: theo tick, rồi theo id (codepoint) để phá hòa.
    ra.sort((x, y) => (x.tick !== y.tick ? x.tick - y.tick : x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
    return ra;
  }

  async themEvent(e: Event): Promise<void> {
    await this.db.events.put(e);
  }
}

/** Nạp state của một nhánh, có kiểm tra lỗi có cấu trúc thay vì throw. */
export async function napState(kho: KhoDexie, branchId: string): Promise<KetQua<WorldState>> {
  const s = await kho.docState(branchId);
  if (!s) {
    return hong([
      loi('persistence', 'KHONG_CO_NHANH', `Không tìm thấy dữ liệu cho nhánh '${branchId}'.`, {
        recoverable: false,
      }),
    ]);
  }
  return dat(s);
}
