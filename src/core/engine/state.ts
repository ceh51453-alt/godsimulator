/**
 * WorldState trong bộ nhớ + repository interface — Phase 1.
 *
 * [BB] Đây là TOÀN BỘ state của một nhánh. Không có state ẩn ở nơi khác.
 * Dexie (Phase 2) cài đúng interface này; test chạy được mà không cần trình duyệt.
 */
import type { Entity, Link, Gap, WorldMetrics } from '../schema/entity.js';
import { WorldMetricsSchema } from '../schema/entity.js';
import type { KnowledgeRow, DebtRow } from '../schema/soSach.js';
import type { Prayer } from '../schema/than.js';
import type { Storyline, Foreshadow } from '../schema/truyen.js';
import type { SubstrateLaw, CoCheRow } from '../vatly/schema.js';
import type { Lorebook, LoreExpectation, DiBan } from '../lore/schema.js';
import type { Event, World } from '../contracts/core.js';
import { hashCua, hashTap, hashGop } from './hash.js';

/**
 * Tên bảng được phép xuất hiện trong `PatchOp.target.table`.
 * `knowledge` và `debts` vào từ Phase 5 (Phần 71.4) — xem ADR-0020.
 * `storylines` và `foreshadows` vào từ Phase 8 (Phần 28, 30.2) — xem ADR-0036.
 */
export const BANG = [
  'worlds',
  'entities',
  'links',
  'gaps',
  'metrics',
  'knowledge',
  'debts',
  'prayers',
  'storylines',
  'foreshadows',
  // ── Phase 10 ──
  'substrateLaws',
  'coChe',
  'lorebooks',
  'loreExpectations',
  'diBan',
] as const;
export type TenBang = (typeof BANG)[number];

export function laTenBang(s: string): s is TenBang {
  return (BANG as readonly string[]).includes(s);
}

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

  // ── Phase 10 ──

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

export function taoState(world: World): WorldState {
  return {
    world,
    entities: new Map(),
    links: new Map(),
    gaps: new Map(),
    metrics: WorldMetricsSchema.parse(undefined),
    knowledge: new Map(),
    debts: new Map(),
    prayers: new Map(),
    storylines: new Map(),
    foreshadows: new Map(),
    substrateLaws: new Map(),
    coChe: new Map(),
    lorebooks: new Map(),
    loreExpectations: new Map(),
    diBan: new Map(),
  };
}

/** Bản sao sâu đủ để rollback. Chỉ chứa dữ liệu JSON thuần nên an toàn. */
export function saoChepState(s: WorldState): WorldState {
  return {
    world: structuredClone(s.world),
    entities: new Map([...s.entities].map(([k, v]) => [k, structuredClone(v)])),
    links: new Map([...s.links].map(([k, v]) => [k, structuredClone(v)])),
    gaps: new Map([...s.gaps].map(([k, v]) => [k, structuredClone(v)])),
    metrics: structuredClone(s.metrics),
    knowledge: new Map([...s.knowledge].map(([k, v]) => [k, structuredClone(v)])),
    debts: new Map([...s.debts].map(([k, v]) => [k, structuredClone(v)])),
    prayers: new Map([...s.prayers].map(([k, v]) => [k, structuredClone(v)])),
    storylines: new Map([...s.storylines].map(([k, v]) => [k, structuredClone(v)])),
    foreshadows: new Map([...s.foreshadows].map(([k, v]) => [k, structuredClone(v)])),
    substrateLaws: new Map([...s.substrateLaws].map(([k, v]) => [k, structuredClone(v)])),
    coChe: new Map([...s.coChe].map(([k, v]) => [k, structuredClone(v)])),
    lorebooks: new Map([...s.lorebooks].map(([k, v]) => [k, structuredClone(v)])),
    loreExpectations: new Map([...s.loreExpectations].map(([k, v]) => [k, structuredClone(v)])),
    diBan: new Map([...s.diBan].map(([k, v]) => [k, structuredClone(v)])),
  };
}

/**
 * Hash chính tắc của toàn bộ state.
 *
 * [BB] Cổng Phase 1: cùng seed + state đầu + event log → cùng hash.
 * Trường cache `_hash` và `_degree` bị LOẠI khỏi phép băm: chúng là dữ liệu
 * dẫn xuất, không phải sự thật, và tính lại được.
 */
export function hashState(s: WorldState): string {
  const entityKhongCache = [...s.entities.values()].map((e) => {
    const { _hash: _bo1, _degree: _bo2, ...con } = e;
    void _bo1;
    void _bo2;
    return con;
  });
  return hashGop({
    world: hashCua(s.world),
    entities: hashTap(entityKhongCache),
    links: hashTap([...s.links.values()]),
    gaps: hashTap([...s.gaps.values()]),
    metrics: hashCua(s.metrics),
    knowledge: hashTap([...s.knowledge.values()]),
    debts: hashTap([...s.debts.values()]),
    prayers: hashTap([...s.prayers.values()]),
    storylines: hashTap([...s.storylines.values()]),
    foreshadows: hashTap([...s.foreshadows.values()]),
    substrateLaws: hashTap([...s.substrateLaws.values()]),
    coChe: hashTap([...s.coChe.values()]),
    lorebooks: hashTap([...s.lorebooks.values()]),
    loreExpectations: hashTap([...s.loreExpectations.values()]),
    diBan: hashTap([...s.diBan.values()]),
  });
}

/** Nhật ký Event append-only. */
export type EventLog = {
  them(e: Event): void;
  tatCa(): readonly Event[];
  theoId(id: string): Event | undefined;
  soLuong(): number;
  hash(): string;
};

export function taoEventLog(banDau: readonly Event[] = []): EventLog {
  const ds: Event[] = [...banDau];
  const theoId = new Map<string, Event>(ds.map((e) => [e.id, e]));

  return {
    them(e) {
      // [BB] Append-only. Không sửa, không xóa, không chèn giữa.
      ds.push(e);
      theoId.set(e.id, e);
    },
    tatCa() {
      return ds;
    },
    theoId(id) {
      return theoId.get(id);
    },
    soLuong() {
      return ds.length;
    },
    hash() {
      // Thứ tự CÓ nghĩa với event log, nên băm theo chuỗi chứ không băm theo tập.
      return hashCua(ds.map((e) => e.hash));
    },
  };
}

/** Repository interface — Dexie (Phase 2) cài đúng hình dạng này. */
export type KhoState = {
  docState(branchId: string): Promise<WorldState | undefined>;
  ghiState(s: WorldState): Promise<void>;
  docEvents(branchId: string): Promise<readonly Event[]>;
  themEvent(e: Event): Promise<void>;
};

/** Kho trong bộ nhớ — dùng cho test và cho replay. */
export function taoKhoBoNho(): KhoState {
  const states = new Map<string, WorldState>();
  const events = new Map<string, Event[]>();

  return {
    async docState(branchId) {
      const s = states.get(branchId);
      return s ? saoChepState(s) : undefined;
    },
    async ghiState(s) {
      states.set(s.world.branchId, saoChepState(s));
    },
    async docEvents(branchId) {
      return [...(events.get(branchId) ?? [])];
    },
    async themEvent(e) {
      const ds = events.get(e.branchId) ?? [];
      ds.push(e);
      events.set(e.branchId, ds);
    },
  };
}
