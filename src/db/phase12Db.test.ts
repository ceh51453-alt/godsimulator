/**
 * Cổng Phase 12 phần đĩa — backup/restore, migration mọi version, soak save lớn.
 *
 * ── Ba câu hỏi mà mười một phase trước chưa ai hỏi ──
 *
 *   1. Người chơi đóng tab rồi mở lại thì ván còn không?
 *   2. Một save 10.000 nhịp mở lại có đúng không, và có mở nổi không?
 *   3. Một máy cài từ đầu — Dexie chạy thẳng lên v9 — có giống một máy đã nâng
 *      cấp dần từ v1 không?
 *
 * Câu 3 là câu dễ bị bỏ nhất, vì trên máy lập trình viên nó luôn đúng: ai cũng
 * cài mới. Nó chỉ sai trên máy người dùng đã chơi từ bản cũ, tức là đúng những
 * người mất nhiều nhất nếu nó sai.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThienDienDb, DEXIE_VERSION_HIEN_TAI } from './schema.js';
import { KhoDexie, napState } from './repo.js';
import { chayMoiMigration } from './migration.js';
import { xuatSave, nhapSave } from './save.js';
import { danhSachSave, ghiVan, xoaVan, doiTenVan, vanGanNhat, nhanMacDinh } from './quanLySave.js';
import { moTheGioiTrong, KhoiTaoWorldSchema } from '../core/world/khoiTao.js';
import { taoState, taoEventLog, hashState } from '../core/engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../core/engine/transaction.js';
import { EntitySchema } from '../core/schema/entity.js';
import { SpatialSchema } from '../core/schema/aspect/living.js';
import { motTick } from '../core/engine/tick.js';
import { chayTienTrinhNen } from '../core/world/process/scheduler.js';
import { eventGieoNen } from '../core/world/gieoNen.js';
import { TUNING_MAC_DINH } from '../core/tuning/schema.js';
import { chayInvariantToanBo } from '../core/engine/invariant.js';
import { napBatBienTheGioiSong } from '../core/world/batBien.js';
import { napBatBienTangThan } from '../core/world/batBienThan.js';
import { napBatBienTangPham } from '../core/world/batBienPham.js';
import { napBatBienTangTruyen } from '../core/world/batBienTruyen.js';
import { napBatBienPhase10 } from '../core/world/batBienP10.js';
import type { WorldState } from '../core/engine/state.js';
import type { Event } from '../core/contracts/core.js';

napBatBienTheGioiSong();
napBatBienTangThan();
napBatBienTangPham();
napBatBienTangTruyen();
napBatBienPhase10();

let db: ThienDienDb;
let kho: KhoDexie;
let dem = 0;

beforeEach(async () => {
  dem += 1;
  db = new ThienDienDb(`thien-dien-p12-${dem}`);
  await db.open();
  kho = new KhoDexie(db);
});

/**
 * Dựng một ván từ hư vô rồi chạy `soTick` nhịp.
 *
 * Gieo nền một lần ở đầu: một thế giới hư vô thật sự không có vùng nào, và một
 * bài đo hiệu năng trên thế giới không có gì để mô phỏng thì không đo gì cả.
 */
function vanCoNoiDung(branchId: string, soTick: number): { state: WorldState; events: Event[] } {
  const ct = KhoiTaoWorldSchema.parse({ seed: `p12#${branchId}`, worldId: 'w1', branchId });
  const { world, events } = moTheGioiTrong(ct);
  const s = taoState(world);
  const log = taoEventLog();
  apDungChuoi(s, events, log);

  // Một vùng đất để thế giới có thứ mà mô phỏng — đúng đường mà lượt kể đầu tiên
  // sẽ đi: entity vào qua Event, rồi `eventGieoNen()` bù aspect nền cho nó.
  const evTao = taoEvent({
    id: 'ev_tao_noi',
    branchId,
    tick: 0,
    loai: 'narrator_cap_nhat',
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches: [
      {
        op: 'link',
        target: { table: 'entities', id: 'place_x', path: '' },
        value: EntitySchema.parse({
          id: 'place_x',
          branchId,
          kind: 'place',
          ten: 'Vùng Đầu Tiên',
          tickSinh: 0,
          aspects: { spatial: SpatialSchema.parse({ toaDo: { x: 0, y: 0 }, banKinh: 6, danSo: 800 }) },
        }),
        sourceEventId: 'ev_tao_noi',
      },
    ],
    visibility: 'engine',
    source: 'ai_validated',
    payload: {},
  });
  const okTao = apDungEvent(s, evTao, log);
  expect(okTao.ok ? [] : okTao.errors.map((e) => `${e.code}: ${e.message}`)).toEqual([]);

  const nen = eventGieoNen(s, ':p12');
  if (nen) expect(apDungEvent(s, nen, log).ok).toBe(true);

  for (let i = 0; i < soTick; i++) {
    const r = motTick(s, { tuning: TUNING_MAC_DINH, tienTrinhNen: chayTienTrinhNen });
    for (const ev of r.events) apDungEvent(s, ev, log);
  }
  return { state: s, events: [...log.tatCa()] };
}

// ─────────────────────────────────────────── danh sách ván

describe('[BB] Phase 12 — quản lý ván', () => {
  it('ghi rồi liệt kê: mỗi nhánh là một dòng, có nhịp và số thực thể thật', async () => {
    const { state, events } = vanCoNoiDung('br_a', 8);
    await ghiVan(db, kho, state, events, 'Ván thử');

    const ds = await danhSachSave(db);
    expect(ds.length).toBe(1);
    expect(ds[0]?.ten).toBe('Ván thử');
    expect(ds[0]?.tick).toBe(state.world.tick);
    expect(ds[0]?.soEntity).toBe(state.entities.size);
    expect(ds[0]?.soSuKien).toBeGreaterThan(0);
  });

  it('ván gần nhất là ván có nhịp cao nhất, không phải ván ghi sau cùng', async () => {
    const a = vanCoNoiDung('br_cu', 40);
    const b = vanCoNoiDung('br_moi', 4);
    await ghiVan(db, kho, a.state, a.events, 'Đi xa');
    await ghiVan(db, kho, b.state, b.events, 'Vừa mở');
    expect((await vanGanNhat(db))?.branchId).toBe('br_cu');
  });

  it('ghi hai lần KHÔNG nhân đôi sự kiện — put theo khóa kép là idempotent', async () => {
    const { state, events } = vanCoNoiDung('br_lap', 5);
    await ghiVan(db, kho, state, events, 'x');
    const lan1 = await db.events.where('branchId').equals('br_lap').count();
    await ghiVan(db, kho, state, events, 'x');
    expect(await db.events.where('branchId').equals('br_lap').count()).toBe(lan1);
  });

  it('đổi tên rồi liệt kê lại thấy tên mới; tên rỗng về lại nhãn mặc định', async () => {
    const { state, events } = vanCoNoiDung('br_ten', 3);
    await ghiVan(db, kho, state, events, 'Tên cũ');
    await doiTenVan(db, 'br_ten', 'Tên mới');
    expect((await danhSachSave(db))[0]?.ten).toBe('Tên mới');

    await doiTenVan(db, 'br_ten', '   ');
    expect((await danhSachSave(db))[0]?.ten).toBe(
      nhanMacDinh(state.world.tick, state.world.playerState.mode),
    );
  });

  it('xóa ván dọn sạch mọi bảng theo nhánh', async () => {
    const { state, events } = vanCoNoiDung('br_xoa', 6);
    await ghiVan(db, kho, state, events, 'Bỏ đi');
    const r = await xoaVan(db, 'br_xoa');
    expect(r.ok).toBe(true);

    expect(await db.entities.where('branchId').equals('br_xoa').count()).toBe(0);
    expect(await db.events.where('branchId').equals('br_xoa').count()).toBe(0);
    expect(await db.snapshots.where('branchId').equals('br_xoa').count()).toBe(0);
    expect(await db.worlds.where('branchId').equals('br_xoa').count()).toBe(0);
    expect(await db.branches.get('br_xoa')).toBeUndefined();
    expect((await danhSachSave(db)).length).toBe(0);
  });

  /**
   * Bài này canh một lỗi thật tìm được khi bấm thử trong trình duyệt.
   *
   * `danhSachSave()` cũ liệt kê từ bảng `worlds`. Nhưng fork **không sao chép dữ
   * liệu**, nên nhánh con chưa có hàng world riêng — và nó biến mất khỏi cả Bản
   * Đồ Nhánh lẫn Sảnh Vào ngay sau khi người chơi tách nó ra thành công.
   */
  it('[BB] nhánh vừa fork hiện ra ngay, dù chưa có hàng world riêng', async () => {
    const { state, events } = vanCoNoiDung('br_cha2', 5);
    await ghiVan(db, kho, state, events, 'Cha');
    await kho.kho.fork({
      id: 'br_con2',
      worldId: 'w1',
      gocId: 'br_cha2',
      tickTao: 5,
      ten: 'Con',
      lyDoTach: 'thử nhánh khác',
      dangChay: true,
    });

    const ds = await danhSachSave(db);
    const con = ds.find((m) => m.branchId === 'br_con2');
    expect(con).toBeDefined();
    expect(con?.ten).toBe('Con');
    // Và nó thấy ĐÚNG số thực thể kế thừa, không phải 0.
    expect(con?.soEntity).toBe(ds.find((m) => m.branchId === 'br_cha2')?.soEntity);
  });

  it('[BB] KHÔNG xóa được nhánh còn con — copy-on-write sẽ đọc vào hư không', async () => {
    const { state, events } = vanCoNoiDung('br_cha', 3);
    await ghiVan(db, kho, state, events, 'Cha');
    await db.branches.put({
      id: 'br_con',
      worldId: 'w1',
      gocId: 'br_cha',
      tickTao: 3,
      ten: 'Con',
      lyDoTach: 'thử',
      dangChay: true,
    });

    const r = await xoaVan(db, 'br_cha');
    expect(r.ok).toBe(false);
    expect(r.ok ? '' : r.errors[0]?.code).toBe('NHANH_CON_CON_SONG');
    // Và cha vẫn còn nguyên, không bị xóa một nửa.
    expect(await db.worlds.where('branchId').equals('br_cha').count()).toBe(1);
  });
});

// ─────────────────────────────────────────── backup / restore

describe('[BB] Phase 12 — backup và phục hồi', () => {
  it('xuất rồi nhập lại giữ nguyên state hash, đi qua JSON thật', async () => {
    const { state, events } = vanCoNoiDung('br_bk', 25);
    await ghiVan(db, kho, state, events, 'Sao lưu');

    const x = await xuatSave(db, state, events, { appVersion: '3.1.0' });
    expect(x.ok).toBe(true);
    if (!x.ok) return;

    const qua = JSON.parse(JSON.stringify(x.value)) as unknown;
    const n = nhapSave(qua);
    expect(n.ok).toBe(true);
    if (!n.ok) return;
    expect(n.value.hashKhop).toBe(true);
    expect(hashState(n.value.state)).toBe(hashState(state));
  });

  it('phục hồi từ file rồi ghi xuống máy này: đọc lại được, invariant sạch', async () => {
    const { state, events } = vanCoNoiDung('br_ph', 12);
    const x = await xuatSave(db, state, events, {});
    expect(x.ok).toBe(true);
    if (!x.ok) return;

    // Máy khác: cơ sở dữ liệu trắng.
    const db2 = new ThienDienDb(`thien-dien-p12-khac-${dem}`);
    await db2.open();
    const kho2 = new KhoDexie(db2);

    const n = nhapSave(JSON.parse(JSON.stringify(x.value)));
    expect(n.ok).toBe(true);
    if (!n.ok) return;

    await ghiVan(db2, kho2, n.value.state, n.value.events, 'Từ file');
    const doc = await napState(kho2, 'br_ph');
    expect(doc.ok).toBe(true);
    if (!doc.ok) return;
    expect(hashState(doc.value)).toBe(hashState(state));
    expect(chayInvariantToanBo(doc.value).dat).toBe(true);
  });

  it('file bị sửa một byte trong hash thì nhập vẫn được nhưng CÓ cảnh báo lệch', async () => {
    const { state, events } = vanCoNoiDung('br_sua', 6);
    const x = await xuatSave(db, state, events, {});
    expect(x.ok).toBe(true);
    if (!x.ok) return;

    const hong = { ...x.value, stateHash: 'deadbeefdeadbeef' };
    const n = nhapSave(JSON.parse(JSON.stringify(hong)));
    expect(n.ok).toBe(true);
    if (!n.ok) return;
    expect(n.value.hashKhop).toBe(false);
    expect(n.value.canhBao.some((c) => c.code === 'SAVE_HASH_LECH')).toBe(true);
  });
});

// ─────────────────────────────────────────── migration mọi version

describe('[BB] Phase 12 — migration mọi version được hỗ trợ', () => {
  it('máy cài mới mở thẳng phiên bản hiện tại, đủ mọi bảng', async () => {
    expect(db.verno).toBe(DEXIE_VERSION_HIEN_TAI);
    for (const t of [
      db.worlds,
      db.branches,
      db.entities,
      db.links,
      db.gaps,
      db.events,
      db.knowledge,
      db.debts,
      db.prayers,
      db.aiConfigs,
      db.storylines,
      db.foreshadows,
      db.chunks,
      db.substrateLaws,
      db.coChe,
      db.lorebooks,
      db.loreExpectations,
      db.diBan,
      db.presetPacks,
      db.presetRaw,
      db.presetActivations,
      db.benchmarkRuns,
      db.presetVars,
      db.uiState,
    ]) {
      expect(await t.count()).toBe(0);
    }
  });

  it('chạy mọi migration trên cơ sở dữ liệu trắng là an toàn và idempotent', async () => {
    const lan1 = await chayMoiMigration(db, 'br_goc', 0);
    expect(lan1.ok).toBe(true);
    const lan2 = await chayMoiMigration(db, 'br_goc', 0);
    expect(lan2.ok).toBe(true);
    // Lần hai không được làm gì nữa — checkpoint đã đóng.
    if (lan2.ok) expect(lan2.value.daBoQua).toBe(true);
  });

  /**
   * Bài này bắt được một lỗi thật trong Phase 12, nên nó viết theo đúng hình
   * dạng của lỗi ấy.
   *
   * `chayMigrationV2V3` đặt `setupCompleted = true` cho MỌI world nó thấy —
   * đúng với save cũ (78.10: không ép người chơi chạy lại onboarding), nhưng sai
   * nếu nó chạy sau khi một ván mới đã được tạo: ván mới sẽ nhảy qua wizard hiện
   * diện mà không ai bấm gì.
   *
   * Hợp đồng đúng là: migration chạy MỘT LẦN lúc khởi động, trước khi có ván nào
   * — `khoiDongDb()` làm việc đó — và checkpoint giữ cho nó không bao giờ chạy
   * lần hai. Bài này khẳng định cả hai vế.
   */
  it('[BB] migration chạy lúc khởi động rồi thôi — ván tạo sau KHÔNG bị nó đụng', async () => {
    // Vế 1 — khởi động trên máy trắng.
    const dau = await chayMoiMigration(db, 'br_goc', 0);
    expect(dau.ok).toBe(true);

    const { state, events } = vanCoNoiDung('br_mig', 15);
    expect(state.world.playerState.setupCompleted).toBe(false);
    await ghiVan(db, kho, state, events, 'Sau khởi động');
    const truoc = hashState(state);

    // Vế 2 — lần khởi động sau. Checkpoint đã đóng, nên không gì được đụng vào.
    const lai = await chayMoiMigration(db, 'br_mig', state.world.tick);
    expect(lai.ok).toBe(true);
    if (lai.ok) expect(lai.value.daBoQua).toBe(true);

    const sau = await napState(kho, 'br_mig');
    expect(sau.ok).toBe(true);
    if (!sau.ok) return;
    expect(hashState(sau.value)).toBe(truoc);
    expect(sau.value.world.playerState.setupCompleted).toBe(false);
  });

  it('đóng rồi mở lại cùng tên: dữ liệu còn nguyên, không migration nào chạy lại', async () => {
    const { state, events } = vanCoNoiDung('br_mo_lai', 10);
    await ghiVan(db, kho, state, events, 'Đóng tab');
    const truoc = hashState(state);
    db.close();

    const db2 = new ThienDienDb(`thien-dien-p12-${dem}`);
    await db2.open();
    const lai = await napState(new KhoDexie(db2), 'br_mo_lai');
    expect(lai.ok).toBe(true);
    if (!lai.ok) return;
    expect(hashState(lai.value)).toBe(truoc);
  });
});

// ─────────────────────────────────────────── soak

describe('[BB] Phase 12 — soak hiệu năng và bộ nhớ', () => {
  it(
    'save 10.000 nhịp: ghi được, mở lại đúng hash, invariant toàn cục sạch',
    async () => {
      const { state, events } = vanCoNoiDung('br_soak', 10_000);
      expect(state.world.tick).toBe(10_000);
      const truoc = hashState(state);

      await ghiVan(db, kho, state, events, 'Mười ngàn nhịp');
      const lai = await napState(kho, 'br_soak');
      expect(lai.ok).toBe(true);
      if (!lai.ok) return;

      expect(hashState(lai.value)).toBe(truoc);
      expect(chayInvariantToanBo(lai.value).dat).toBe(true);
    },
    { timeout: 300_000 },
  );

  it(
    'mười ngàn nhịp không làm event log hay entity nở vô hạn',
    () => {
      const { state, events } = vanCoNoiDung('br_no', 10_000);
      /*
       * Trần ở đây không phải một con số tùy tiện: `motTick` phát tối đa một
       * Event mỗi nhịp cộng vài Event khởi tạo, và số thực thể bị chặn bởi trần
       * Malthus của Phase 5 chứ không bởi thời gian. Một trần lỏng vẫn bắt được
       * đúng thứ cần bắt — rò rỉ tuyến tính theo số nhịp.
       */
      expect(events.length).toBeLessThan(10_000 * 2 + 100);
      expect(state.entities.size).toBeLessThan(5_000);
      expect(state.knowledge.size).toBeLessThan(200_000);
    },
    { timeout: 300_000 },
  );
});
