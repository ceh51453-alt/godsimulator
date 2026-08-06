/**
 * Cổng Bồi Đắp — thế giới tự hoàn thiện dần (Phần 47 nối 71.2 và 15).
 *
 * Bốn điều phải đúng, và không bài nào kiểm bằng cách đọc tài liệu:
 *
 *   1. mọi patch của Bồi Đắp đi qua transaction mà KHÔNG làm vỡ bất biến nào —
 *      đặc biệt `dan_so_khop_cohort` và `di_cu_bao_toan`, hai bất biến mà bất kỳ
 *      phép "thêm người vào thế giới" nào cũng có nguy cơ phá;
 *   2. deterministic: cùng seed + cùng state ⇒ cùng patch (luật bất biến #7);
 *   3. hạn mức là trần CỨNG, không phải gợi ý;
 *   4. `locPatchTheoLanRanh()` vẫn chặn được patch của chính engine — 47.4 không
 *      có ngoại lệ cho người nhà.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog, hashState } from '../engine/state.js';
import type { WorldState, EventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { chayInvariantToanBo, datLaiInvariant } from '../engine/invariant.js';
import { napBatBienTheGioiSong } from './batBien.js';
import { moThuGioi, KhoiTaoWorldSchema } from './khoiTao.js';
import { eventGieoNen } from './gieoNen.js';
import { docAspect, tongCohort } from './process/tienIch.js';
import type { DanCu } from '../schema/aspect/substrate.js';
import type { Event, PatchOp } from '../contracts/core.js';
import { boiDapMotLuot, doDoDang, THO_BOI_DAP, HAN_MUC_MAC_DINH } from './boiDap.js';
import { CauHinhDienHoaSchema, locPatchTheoLanRanh } from './dienHoa.js';

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
});

function theGioi(seed = 'boidap'): { state: WorldState; log: EventLog } {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  expect(apDungChuoi(state, events, log).ok).toBe(true);
  const evNen = eventGieoNen(state);
  if (evNen) expect(apDungEvent(state, evNen, log).ok).toBe(true);
  return { state, log };
}

/** Áp một lô patch Bồi Đắp qua đúng cửa duy nhất — luật bất biến #4. */
function apBoiDap(
  state: WorldState,
  log: EventLog,
  patches: readonly PatchOp[],
  evId: string,
): ReturnType<typeof apDungEvent> {
  const ev: Event = taoEvent({
    id: evId,
    branchId: state.world.branchId,
    tick: state.world.tick,
    loai: 'boi_dap',
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches: [...patches],
    visibility: 'engine',
    source: 'engine',
    payload: {},
  });
  return apDungEvent(state, ev, log);
}

/** Một vùng đủ đông để thợ "lập làng mới" và "gọi tên nhân vật" có việc làm. */
function themVungDong(state: WorldState, log: EventLog, id: string, dan: number, x = 0): void {
  const evId = `ev_them_${id}`;
  const child = Math.floor(dan * 0.32);
  const youth = Math.floor(dan * 0.2);
  const elder = Math.floor(dan * 0.08);
  const patches: PatchOp[] = [
    {
      op: 'link',
      target: { table: 'entities', id, path: '' },
      value: {
        id,
        branchId: state.world.branchId,
        kind: 'place',
        ten: '',
        moTa: '',
        aliases: [],
        tickSinh: state.world.tick,
        tickDiet: null,
        tags: [],
        aspects: { spatial: { chaId: null, toaDo: { x, y: 0 }, banKinh: 1, danSo: dan } },
        _degree: 0,
        _hash: '',
        _version: 0,
      },
      sourceEventId: evId,
    },
  ];
  expect(apBoiDap(state, log, patches, evId).ok).toBe(true);

  // Gieo nền cho vùng vừa thêm, rồi chỉnh cohort về đúng tháp tuổi mong muốn.
  const evNen = eventGieoNen(state, `:${id}`);
  if (evNen) expect(apDungEvent(state, evNen, log).ok).toBe(true);

  const evId2 = `ev_them2_${id}`;
  expect(
    apBoiDap(
      state,
      log,
      (
        [
          ['child', child],
          ['youth', youth],
          ['elder', elder],
          ['adult', dan - child - youth - elder],
        ] as const
      ).map(([b, v]): PatchOp => ({
        op: 'set',
        target: { table: 'entities', id, path: `aspects.dan_cu.cohort.${b}` },
        value: v,
        sourceEventId: evId2,
      })),
      evId2,
    ).ok,
  ).toBe(true);
}

// ═══════════════════════════════════════════ bất biến

describe('Bồi Đắp — patch của engine cũng phải qua được mọi bất biến', () => {
  it('lô patch áp được và invariant toàn cục vẫn sạch', () => {
    const { state, log } = theGioi('bd1');
    themVungDong(state, log, 'noi_dong', 900);

    const kq = boiDapMotLuot({ state, eventId: 'ev_bd', tick: state.world.tick, hanMuc: 10 });
    expect(kq.viec.length).toBeGreaterThan(0);

    const r = apBoiDap(state, log, kq.patches, 'ev_bd');
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);

    const inv = chayInvariantToanBo(state);
    expect(inv.viPhamNang.map((v) => v.message)).toEqual([]);
  });

  it('[BB] không bịa người — lập làng mới giữ nguyên tổng dân số', () => {
    const { state, log } = theGioi('bd2');
    themVungDong(state, log, 'noi_dong', 1200);

    const demDan = (): number =>
      [...state.entities.values()].reduce((t, e) => {
        const dc = docAspect<DanCu>(e, 'dan_cu');
        return t + (dc ? tongCohort(dc.cohort) : 0);
      }, 0);

    const truoc = demDan();
    const kq = boiDapMotLuot({
      state,
      eventId: 'ev_bd2',
      tick: state.world.tick,
      tho: ['lap_lang_moi'],
      hanMuc: 3,
    });
    expect(kq.viec.some((v) => v.tho === 'lap_lang_moi')).toBe(true);
    expect(apBoiDap(state, log, kq.patches, 'ev_bd2').ok).toBe(true);

    // Tổng dân số KHÔNG đổi: làng mới chỉ chia lại người của làng cũ.
    expect(demDan()).toBe(truoc);
    // Và `di_cu_bao_toan` là bất biến `fatal` — nó đã chạy trong transaction trên.
    expect(chayInvariantToanBo(state).viPhamNang).toEqual([]);
  });

  it('[BB] gọi tên nhân vật rút người khỏi cohort, không cộng thêm ai', () => {
    const { state, log } = theGioi('bd3');
    themVungDong(state, log, 'noi_dong', 500);

    const demDam = (): number =>
      [...state.entities.values()].reduce((t, e) => {
        const dc = docAspect<DanCu>(e, 'dan_cu');
        return t + (dc ? tongCohort(dc.cohort) : 0);
      }, 0);
    const demNguoi = (): number => [...state.entities.values()].filter((e) => e.kind === 'mortal').length;

    const truocDam = demDam();
    const truocNguoi = demNguoi();

    const kq = boiDapMotLuot({
      state,
      eventId: 'ev_bd3',
      tick: state.world.tick,
      tho: ['goi_ten_nhan_vat'],
      hanMuc: 2,
    });
    expect(kq.viec.length).toBeGreaterThan(0);
    expect(apBoiDap(state, log, kq.patches, 'ev_bd3').ok).toBe(true);

    // Mỗi người bước ra khỏi đám đông thì đám đông vơi đi đúng một người.
    expect(truocDam - demDam()).toBe(demNguoi() - truocNguoi);
    // Và người mới có tên thật, không phải một cái id.
    for (const e of state.entities.values()) {
      if (e.kind !== 'mortal') continue;
      expect(e.ten.trim()).not.toBe('');
      expect(e.ten).not.toBe(e.id);
    }
  });
});

// ═══════════════════════════════════════════ determinism

describe('Bồi Đắp — deterministic (luật bất biến #7)', () => {
  it('cùng seed + cùng state cho cùng lô patch và cùng hash sau khi áp', () => {
    const a = theGioi('bd-det');
    const b = theGioi('bd-det');
    themVungDong(a.state, a.log, 'noi_dong', 800);
    themVungDong(b.state, b.log, 'noi_dong', 800);
    expect(hashState(a.state)).toBe(hashState(b.state));

    const ka = boiDapMotLuot({ state: a.state, eventId: 'ev_x', tick: a.state.world.tick, hanMuc: 6 });
    const kb = boiDapMotLuot({ state: b.state, eventId: 'ev_x', tick: b.state.world.tick, hanMuc: 6 });
    expect(JSON.stringify(ka.patches)).toBe(JSON.stringify(kb.patches));

    expect(apBoiDap(a.state, a.log, ka.patches, 'ev_x').ok).toBe(true);
    expect(apBoiDap(b.state, b.log, kb.patches, 'ev_x').ok).toBe(true);
    expect(hashState(a.state)).toBe(hashState(b.state));
  });

  it('chạy hai lần liên tiếp không lặp lại cùng một việc', () => {
    const { state, log } = theGioi('bd-lap');
    themVungDong(state, log, 'noi_dong', 700);

    const k1 = boiDapMotLuot({ state, eventId: 'ev_1', tick: state.world.tick, hanMuc: 4 });
    expect(apBoiDap(state, log, k1.patches, 'ev_1').ok).toBe(true);
    const k2 = boiDapMotLuot({ state, eventId: 'ev_2', tick: state.world.tick, hanMuc: 4 });

    // Việc đã làm xong không được đề nghị lại: một vùng đã có tên thì thợ khắc
    // họa phải bỏ qua nó, nếu không thế giới bị đổi tên vô hạn lần.
    const id1 = k1.viec.filter((v) => v.tho === 'khac_hoa_dia_danh').flatMap((v) => [...v.entityIds]);
    const id2 = k2.viec.filter((v) => v.tho === 'khac_hoa_dia_danh').flatMap((v) => [...v.entityIds]);
    expect(id1.filter((x) => id2.includes(x))).toEqual([]);
  });
});

// ═══════════════════════════════════════════ hạn mức và lằn ranh

describe('Bồi Đắp — hạn mức và lằn ranh 47.4', () => {
  it('hạn mức là trần CỨNG cho cả lượt, không phải cho từng thợ', () => {
    const { state, log } = theGioi('bd-han');
    themVungDong(state, log, 'noi_a', 900, 0);
    themVungDong(state, log, 'noi_b', 900, 10);
    themVungDong(state, log, 'noi_c', 900, 20);

    for (const han of [0, 1, 2, HAN_MUC_MAC_DINH]) {
      const kq = boiDapMotLuot({ state, eventId: `ev_h${han}`, tick: state.world.tick, hanMuc: han });
      expect(kq.viec.length).toBeLessThanOrEqual(han);
    }
  });

  it('chọn được từng thợ; thợ không được bật thì không sinh việc nào', () => {
    const { state, log } = theGioi('bd-tho');
    themVungDong(state, log, 'noi_dong', 900);
    for (const tho of THO_BOI_DAP) {
      const kq = boiDapMotLuot({
        state,
        eventId: `ev_${tho}`,
        tick: state.world.tick,
        tho: [tho],
        hanMuc: 5,
      });
      expect(kq.viec.every((v) => v.tho === tho)).toBe(true);
    }
  });

  it('[BB] 47.4 — patch của engine cũng bị lằn ranh soi, không có ngoại lệ cho người nhà', () => {
    const { state, log } = theGioi('bd-ranh');
    themVungDong(state, log, 'noi_dong', 900);
    const cauHinh = CauHinhDienHoaSchema.parse({});
    const kq = boiDapMotLuot({ state, eventId: 'ev_r', tick: state.world.tick, hanMuc: 8 });

    // Bồi Đắp không bao giờ chạm bảng cấm — nên bộ lọc không bỏ patch nào.
    const loc = locPatchTheoLanRanh(kq.patches, cauHinh, state);
    expect(loc.bo).toEqual([]);
    expect(loc.giu).toHaveLength(kq.patches.length);

    // Và nếu có ai đó nhét một patch cấm vào cùng lô, nó bị chặn.
    const xau: PatchOp = {
      op: 'set',
      target: { table: 'substrateLaws', id: 'ln_thoi_gian', path: 'trangThai' },
      value: 'da_dat_ten',
      sourceEventId: 'ev_r',
    };
    expect(locPatchTheoLanRanh([...kq.patches, xau], cauHinh, state).bo).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════ độ dở dang

/** Id mọi nơi chốn còn có ít nhất một tuyến đường SỐNG chạm vào. */
function vungCoDuong(state: WorldState): Set<string> {
  const ra = new Set<string>();
  for (const e of state.entities.values()) {
    if (e.kind !== 'route' || e.tickDiet !== null) continue;
    const d = docAspect<{ tuId: string; denId: string }>(e, 'duong');
    if (!d) continue;
    ra.add(d.tuId);
    ra.add(d.denId);
  }
  return ra;
}

/**
 * Cắt mọi tuyến chạm vào một vùng — dựng lại đúng cảnh "đường mất dấu".
 *
 * Không phải một tình huống bịa cho vừa bài test: `route_decay` đặt `tickDiet`
 * cho tuyến không ai đi, và `gieoNen` chỉ nối chuỗi các vùng MỘT lần lúc chúng
 * sinh ra. Một vùng ở rìa mất tuyến duy nhất của nó là chuyện xảy ra sau vài
 * mùa vắng, và trước bản này thì nó ở lại đó vĩnh viễn.
 */
function catDuongToi(state: WorldState, log: EventLog, noiId: string): void {
  const patches: PatchOp[] = [];
  const evId = `ev_cat_${noiId}`;
  for (const e of state.entities.values()) {
    if (e.kind !== 'route' || e.tickDiet !== null) continue;
    const d = docAspect<{ tuId: string; denId: string }>(e, 'duong');
    if (!d || (d.tuId !== noiId && d.denId !== noiId)) continue;
    patches.push({
      op: 'set',
      target: { table: 'entities', id: e.id, path: 'tickDiet' },
      value: state.world.tick,
      sourceEventId: evId,
    });
  }
  expect(patches.length).toBeGreaterThan(0);
  expect(apBoiDap(state, log, patches, evId).ok).toBe(true);
}

describe('mở đường — vùng cô lập được nối bất kể xa', () => {
  /**
   * Tầm 40 là phát biểu về địa lý, không phải một hàng rào quanh những vùng chưa
   * dính vào đâu. Trước bản này một vùng mất hết tuyến mà lại nằm xa sẽ ở lại đó
   * vĩnh viễn: không tin tức, không hàng hóa, và `doDoDang` đếm nó mãi mãi vì
   * không thợ nào bước tới.
   */
  it('nối được một vùng nằm ngoài tầm mở đường thông thường', () => {
    const { state, log } = theGioi('bd-colap');
    themVungDong(state, log, 'noi_a', 600, 0);
    themVungDong(state, log, 'noi_b', 600, 10);
    themVungDong(state, log, 'noi_xa', 600, 900); // xa hơn TAM_MO_DUONG rất nhiều
    catDuongToi(state, log, 'noi_xa');
    expect(vungCoDuong(state).has('noi_xa')).toBe(false);

    const kq = boiDapMotLuot({
      state,
      eventId: 'ev_cl',
      tick: state.world.tick,
      tho: ['mo_duong'],
      hanMuc: 3,
    });
    expect(apBoiDap(state, log, kq.patches, 'ev_cl').ok).toBe(true);

    expect(vungCoDuong(state).has('noi_xa')).toBe(true);
    expect(chayInvariantToanBo(state).viPhamNang).toEqual([]);
  });
});

describe('doDoDang — thế giới dày lên thì điểm dở dang phải giảm', () => {
  it('đếm riêng tên, mô tả và vùng cô lập — ba chỗ trống khác nhau', () => {
    const { state, log } = theGioi('bd-chieu');
    themVungDong(state, log, 'noi_a', 600, 0);
    themVungDong(state, log, 'noi_xa', 600, 900);
    catDuongToi(state, log, 'noi_xa');

    const d = doDoDang(state);
    const noiThieu = (mau: string): boolean => d.thieu.some((t) => t.includes(mau));
    expect(noiThieu('chưa được gọi tên')).toBe(true);
    expect(noiThieu('chưa có một dòng mô tả')).toBe(true);
    expect(noiThieu('chưa có đường nào dẫn tới')).toBe(true);
    // Mỗi dòng phải là một câu người đọc được, không phải một id hay một enum.
    for (const t of d.thieu) expect(t).not.toMatch(/^[a-z_]+$/);
  });

  it('bồi đắp nhiều lượt làm thế giới bớt dở dang', () => {
    const { state, log } = theGioi('bd-do');
    themVungDong(state, log, 'noi_a', 800, 0);
    themVungDong(state, log, 'noi_b', 800, 12);

    const truoc = doDoDang(state);
    expect(truoc.diem).toBeGreaterThan(0);
    expect(truoc.thieu.length).toBeGreaterThan(0);

    for (let i = 0; i < 6; i++) {
      const kq = boiDapMotLuot({ state, eventId: `ev_d${i}`, tick: state.world.tick, hanMuc: 4 });
      if (kq.patches.length === 0) break;
      expect(apBoiDap(state, log, kq.patches, `ev_d${i}`).ok).toBe(true);
    }

    expect(doDoDang(state).diem).toBeLessThan(truoc.diem);
    expect(chayInvariantToanBo(state).viPhamNang).toEqual([]);
  });
});
