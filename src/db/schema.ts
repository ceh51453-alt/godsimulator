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

export type BanGhiMetrics = { branchId: string; metrics: unknown };
export type BanGhiSetting = { key: string; value: unknown };

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
  /**
   * Lịch sử chat/lời kể — lưu để mở lại ván không mất đoạn đang chơi.
   *
   * Optional vì hàng cũ (trước bản sửa) không có trường này, và Dexie cho
   * phép thêm field không index mà không cần migration.
   */
  scene?: unknown[];
};

/**
 * Cấu hình AI của MÁY này. Một hàng duy nhất, `id = 'may_nay'`.
 * Không mang theo save vì proxy của người này không chạy trên máy người kia.
 */
export type BanGhiAiConfig = { id: string; cauHinh: AiConfig };

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

export class ThienDienDb extends Dexie {
  worlds!: Table<World, string>;
  branches!: Table<Branch, string>;
  entities!: Table<Entity, [string, string]>;
  links!: Table<Link, [string, string]>;
  gaps!: Table<Gap, [string, string]>;
  metrics!: Table<BanGhiMetrics, string>;
  events!: Table<Event, [string, string]>;
  tombstones!: Table<Tombstone, [string, string, string]>;
  snapshots!: Table<SnapshotRow, [string, string, number]>;
  settings!: Table<BanGhiSetting, string>;
  migrationCheckpoints!: Table<MigrationCheckpoint, string>;

  // ── v3 (Khối U) ──
  playerProfiles!: Table<PlayerProfile, string>;
  playerIdentities!: Table<CreatorIdentity & { saveId: string }, [string, string]>;
  rerankCache!: Table<RerankCacheEntry, string[]>;
  retrievalRuns!: Table<RetrievalRun, number>;
  retrievalEval!: Table<RetrievalEvalCase, string>;

  // ── v4 (Phase 5 — Thế Giới Sống) ──
  knowledge!: Table<KnowledgeRow, [string, string]>;
  debts!: Table<DebtRow, [string, string]>;

  // ── v5 (Phase 6 — Tầng Thần) ──
  prayers!: Table<Prayer, [string, string]>;

  // ── v6 (Cổng AI — ADR-0028) ──
  aiConfigs!: Table<BanGhiAiConfig, string>;

  // ── v7 (Phase 8 — Mạch Truyện, Sổ Phục Bút, chỉ mục truy hồi) ──
  storylines!: Table<Storyline, [string, string]>;
  foreshadows!: Table<Foreshadow, [string, string]>;
  chunks!: Table<Chunk, [string, string]>;

  // ── v8 (Phase 9 + 10) ──

  /** Năm bảng theo NHÁNH, copy-on-write như `entities`. */
  substrateLaws!: Table<SubstrateLaw, [string, string]>;
  coChe!: Table<CoCheRow, [string, string]>;
  lorebooks!: Table<Lorebook, [string, string]>;
  loreExpectations!: Table<LoreExpectation, [string, string]>;
  diBan!: Table<DiBan, [string, string]>;

  /**
   * Ba bảng THƯ VIỆN — thuộc về máy, không thuộc về nhánh.
   *
   * Cùng lý do với `aiConfigs`: một pack đã nhập trên máy này không tự có mặt
   * trên máy khác, và đổi nhánh không được làm mất thư viện preset.
   */
  presetPacks!: Table<PresetPackRow, [string, number]>;
  presetRaw!: Table<RawSourceRow, string>;
  presetActivations!: Table<PresetActivation, string>;

  /** Lịch sử chỉ số benchmark — món nợ ghi ở cuối Phase 8. */
  benchmarkRuns!: Table<DongLichSuBenchmark, string>;

  // ── v9 (Phase 11) ──

  /** Biến của pack, theo nhánh — [BB] 66.6, không bao giờ là biến toàn cục. */
  presetVars!: Table<HangBienPack, [string, string]>;
  /** Trạng thái giao diện theo save — 59.2. Ngoài `WorldState`, ngoài hash. */
  uiState!: Table<HangUiState, [string, string]>;

  constructor(ten = 'thien-dien') {
    super(ten);

    /**
     * v1 — hình dạng cũ. GIỮ NGUYÊN.
     * Primary key là `id` trần, nên hai nhánh KHÔNG thể chứa hai bản khác nhau
     * của cùng entity. Đó chính là lỗi mà v2 sửa (Phần 61.1 #6).
     */
    this.version(1).stores({
      worlds: 'id, ten, capNhatLuc',
      branches: 'id, worldId, gocId, tickTao',
      entities: 'id, branchId, kind, [branchId+kind], _degree',
      links: 'id, branchId, tuId, denId, quanHe, [tuId+quanHe], [denId+quanHe]',
      events: '++seq, branchId, tick, loai',
      settings: 'key',
    });

    /**
     * v2 — compound key theo nhánh. Đây là copy-on-write THẬT (ADR-0014).
     */
    this.version(2).stores({
      worlds: 'branchId, id, ten',
      branches: 'id, worldId, gocId, tickTao',
      entities: '[branchId+id], branchId, id, kind, [branchId+kind], _degree',
      links: '[branchId+id], branchId, id, tuId, denId, quanHe',
      gaps: '[branchId+id], branchId, id, loai, trangThai',
      metrics: 'branchId',
      events: '[branchId+id], branchId, tick, loai, *actorIds, *targetIds',
      tombstones: '[branchId+bang+id], branchId, bang',
      snapshots: '[branchId+scopeKey+tick], branchId, tick',
      settings: 'key',
      migrationCheckpoints: 'id',
    });

    /**
     * v3 — Khối U. Thêm bảng, KHÔNG đụng bảng cũ (Phần 79.1).
     */
    this.version(3).stores({
      playerProfiles: 'id, updatedAt',
      playerIdentities: '[saveId+id], saveId, id',
      rerankCache:
        '[branchId+scopeKey+queryHash+candidateSetHash+visibilityHash+modelKey+configHash], branchId, scopeKey, visibilityHash, createdAtTick',
      retrievalEval: 'id, mode, task',
      retrievalRuns: '++seq, branchId, scopeKey, queryHash, modeUsed, createdAtTick',
    });

    /**
     * v4 — Thế Giới Sống. Hai bảng mới, copy-on-write giống `entities`
     * (compound key `[branchId+id]`). KHÔNG đụng bảng cũ.
     *
     * `knowerId` có index riêng vì bất biến "không tri thức teleport" (71.4)
     * truy vấn theo chủ thể biết, không theo id dòng.
     */
    this.version(4).stores({
      knowledge: '[branchId+id], branchId, id, knowerId, factId, [branchId+knowerId], learnedAtTick',
      debts: '[branchId+id], branchId, id, creditorId, debtorId, status, dueTick',
    });

    /**
     * v5 — Tầng Thần. Lời cầu là bảng vì nó có HAI đầu như nợ: người cầu và vị
     * thần được gọi tên. Truy vấn thật của tầng Thần là "ai đang cầu ta" và
     * "lời cầu nào chưa trả lời quá hạn" — cả hai đều cần index riêng.
     */
    this.version(5).stores({
      prayers:
        '[branchId+id], branchId, id, nguoiCauId, thanNhanId, [branchId+thanNhanId], daTraLoi, tickCau, hanChot',
    });

    /**
     * v6 — Cổng AI (ADR-0028).
     *
     * Cấu hình AI thuộc về **máy**, không thuộc về nhánh: đổi nhánh không làm mất
     * proxy, và mang save sang máy khác thì phải nhập proxy của máy đó. Vì vậy
     * bảng này khóa theo `id` trần và KHÔNG có `branchId`.
     *
     * [BB] `proxyPassword` nằm trong `KHOA_SECRET`, nên `stripSecret()` cắt nó
     * khỏi mọi thứ đi ra ngoài. Bảng này cũng không nằm trong đường export save.
     */
    this.version(6).stores({
      aiConfigs: 'id',
    });

    /**
     * v7 — Phase 8. Ba bảng mới, copy-on-write theo `[branchId+id]` như `entities`.
     *
     * `chunks` là chỉ mục truy hồi (54.2). Nó có index theo `tangToiThieu` vì
     * [BB] 54.3 bắt LỌC TẦM NHÌN CHẠY TRƯỚC khi xếp hạng — tiền lọc bằng chỉ mục
     * là cách duy nhất làm điều đó mà không phải nạp cả trăm nghìn chunk lên RAM.
     *
     * `vector` lưu int8 (54.4). `vector = null` là trạng thái HỢP LỆ ở mọi nơi:
     * chunk chưa nhúng vẫn tìm được bằng kênh từ vựng và kênh đồ thị.
     */
    this.version(7).stores({
      storylines: '[branchId+id], branchId, id, loai, giaiDoan, nguoiChoiBiet, cangThang, tickSinh',
      foreshadows: '[branchId+id], branchId, id, machId, daTra, tickGieo',
      chunks: '[branchId+id], branchId, id, nguon, nguonId, tangToiThieu, tick, *entityIds',
    });

    /**
     * v8 — Phase 9 (Preset Bridge) và Phase 10 (Khối I, L, N, O).
     *
     * Năm bảng đầu theo nhánh; bốn bảng sau theo máy. Ranh giới ấy không phải
     * tùy tiện: luật nền và lorebook là **thứ thế giới này có** nên chúng fork
     * theo nhánh (43.6); pack preset là **thứ máy này đã nhập** nên chúng ở lại
     * khi người chơi đổi nhánh hay mở save khác.
     *
     * `presetRaw` khóa theo `ref = sha256:<HEX>`, nên nhập lại đúng file cũ ghi
     * đè chính nó thay vì nhân đôi blob — cùng bảo đảm với 65.5.
     *
     * [BB] KHÔNG đụng bảng cũ. Save v7 mở ở v8 thấy năm Map rỗng, và đó là
     * trạng thái HỢP LỆ: `tinhHieuLuc()` trả 0, `quetCoChe()` báo "chưa quét".
     */
    this.version(8).stores({
      substrateLaws: '[branchId+id], branchId, id, truc, trangThai',
      coChe: '[branchId+id], branchId, id, bat',
      lorebooks: '[branchId+id], branchId, id, nguon, bat',
      loreExpectations: '[branchId+id], branchId, id, lorebookId, entryId, trangThai, loai',
      diBan: '[branchId+id], branchId, id, kyVongId, tickGhi',
      presetPacks: '[packId+version], packId, version',
      presetRaw: 'ref, sourceName',
      presetActivations: 'id, packId, branchId, saveId, activatedAt',
      benchmarkRuns: 'id, branchId, mode, tickDo, configHash',
    });

    /**
     * v9 — Phase 11.
     *
     * Hai bảng, hai lý do khác hẳn nhau:
     *
     * `presetVars` giữ biến của pack theo NHÁNH. [BB] 66.6 xếp macro biến vào
     * namespace `preset.<packId>` và cấm biến toàn cục xuyên save; khóa kép
     * `[packId+branchId]` là cách cưỡng chế điều đó bằng hình dạng khóa chứ
     * không bằng lời dặn — không có cách nào đọc biến của nhánh khác kể cả khi
     * ai đó cố tình.
     *
     * `uiState` giữ trạng thái giao diện theo save (59.2): tab đang mở, mục
     * ghim, vùng thu gọn, ảnh chụp Bảng. Nó KHÔNG vào `WorldState` vì nó không
     * phải sự thật của thế giới — nhét nó vào state sẽ làm `stateHash` đổi theo
     * việc người chơi thu gọn một vùng, và thế là hỏng determinism.
     *
     * [BB] Không đụng bảng cũ. Save v8 mở ở v9 thấy hai bảng rỗng, và đó là
     * trạng thái hợp lệ: chưa pack nào có biến, chưa ai mở Bảng lần nào.
     */
    this.version(9).stores({
      presetVars: '[packId+branchId], packId, branchId',
      uiState: '[saveId+branchId], saveId, branchId',
    });
  }
}

/** Phiên bản Dexie mà app hiện tại mong đợi. */
export const DEXIE_VERSION_HIEN_TAI = 9;
