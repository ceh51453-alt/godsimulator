/**
 * Cổng Phase 5 — Thế Giới Sống.
 *
 * Đặc tả đòi sáu điều (Phần 75, Phase 5) và mười điều ở 73.4. Mỗi `describe`
 * dưới đây là một trong số đó, và không có bài nào kiểm bằng cách đọc tài liệu.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog, hashState } from '../engine/state.js';
import type { WorldState, EventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { replay, kiemDeterminism } from '../engine/replay.js';
import { chayInvariantToanBo, datLaiInvariant } from '../engine/invariant.js';
import { motTick } from '../engine/tick.js';
import { moThuGioi, KhoiTaoWorldSchema } from './khoiTao.js';
import { eventGieoNen } from './gieoNen.js';
import { napBatBienTheGioiSong } from './batBien.js';
import { chayTienTrinhNen, chiaGiaiDoan, honNhatXungDot, tongTheoKhaiBao } from './process/scheduler.js';
import { moiTienTrinh, tienTrinhThieuHandler } from './process/index.js';
import { WORLD_PROCESS_IDS_712 } from '../registry/misc.js';
import { vatChatHoa } from './process/phanGiai.js';
import { tuaThoiGian, TICK_MOI_BUOC, DIEU_KIEN_DUNG } from './process/catchUp.js';
import { banTinCho } from './banTin.js';
import { docAspect, tongCohort, PHAN_KHO, phanKhoHopLe } from './process/tienIch.js';
import { TUNING_MAC_DINH } from '../tuning/schema.js';
import { TICK_MOI_NAM } from '../schema/aspect/substrate.js';
import type { AnNinh, DanCu, KinhTe, SinhThai } from '../schema/aspect/substrate.js';
import type { Event, PatchOp } from '../contracts/core.js';
import type { WorldProcessDef } from '../registry/types.js';
import type { TienTrinhNen } from './process/types.js';

const TUNING = TUNING_MAC_DINH;

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
});

// ─────────────────────────────────────────── dựng thế giới

function theGioi(seed = 'phase5'): { state: WorldState; log: EventLog; events: Event[] } {
  const ct = KhoiTaoWorldSchema.parse({
    cua: 'hu_vo',
    seed,
    worldId: 'w1',
    branchId: 'br_goc',
  });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  const r = apDungChuoi(state, events, log);
  expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);

  const evNen = eventGieoNen(state);
  expect(evNen).not.toBeNull();
  const ok = apDungEvent(state, evNen as Event, log);
  expect(ok.ok, ok.ok ? '' : JSON.stringify(ok.errors)).toBe(true);

  return { state, log, events: [...events, evNen as Event] };
}

/** Chạy `soTick` tick qua đúng đường chính thức. Trả sự kiện và chẩn đoán. */
function chay(
  state: WorldState,
  log: EventLog,
  soTick: number,
): { events: Event[]; suKien: ReturnType<typeof motTick>['suKien'][number][]; chanDoanLoi: string[] } {
  const events: Event[] = [];
  const suKien: ReturnType<typeof motTick>['suKien'][number][] = [];
  const chanDoanLoi: string[] = [];

  for (let i = 0; i < soTick; i++) {
    const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
    for (const ev of r.events) {
      const ok = apDungEvent(state, ev, log);
      expect(ok.ok, `tick ${state.world.tick + 1}: ${ok.ok ? '' : JSON.stringify(ok.errors)}`).toBe(true);
      events.push(ev);
    }
    suKien.push(...r.suKien);
    for (const c of r.chanDoan) if (c.muc === 'loi') chanDoanLoi.push(`${c.ma}: ${c.thongDiep}`);
  }
  return { events, suKien, chanDoanLoi };
}

const noiChonIds = (s: WorldState): string[] =>
  [...s.entities.keys()].filter((id) => s.entities.get(id)?.aspects['dan_cu'] !== undefined).sort();

const danSoTong = (s: WorldState): number => {
  let t = 0;
  for (const id of noiChonIds(s)) {
    t += tongCohort(docAspect<DanCu>(s.entities.get(id), 'dan_cu')?.cohort);
  }
  return t;
};

// ─────────────────────────────────────────── hợp đồng tiến trình

describe('mười hai tiến trình nền — Phần 71.1, 71.2', () => {
  it('mười hai tiến trình của 71.2 đều có mặt và đều nối handler', () => {
    const ds = moiTienTrinh();
    const co = new Set(ds.map((t) => t.def.id));
    // Kiểm bằng DANH SÁCH, không bằng số đếm: phase sau thêm tiến trình là hợp lệ,
    // nhưng bỏ sót một dòng của bảng 71.2 thì không.
    expect(WORLD_PROCESS_IDS_712).toHaveLength(12);
    for (const id of WORLD_PROCESS_IDS_712) expect(co.has(id), `thiếu '${id}'`).toBe(true);
    // ADR-0006 đóng ở đây: không còn `handlerId` nào ở trạng thái `can_adapter`.
    expect(tienTrinhThieuHandler()).toEqual([]);
  });

  it('mỗi tiến trình khai đủ state, cadence, reads/writes, invariant và độ phân giải', () => {
    for (const { def } of moiTienTrinh()) {
      expect(def.nhip.every, def.id).toBeGreaterThanOrEqual(1);
      expect(def.doc.length, `${def.id} không khai reads`).toBeGreaterThan(0);
      expect(def.ghi.length, `${def.id} không khai writes`).toBeGreaterThan(0);
      expect(def.batBien.length, `${def.id} không khai invariant`).toBeGreaterThan(0);
      expect(['micro', 'meso', 'macro', 'adaptive']).toContain(def.phanGiai);
      expect(['entity', 'household', 'place', 'region', 'world']).toContain(def.phamVi);
      for (const p of [...def.doc, ...def.ghi]) expect(typeof p.table).toBe('string');
    }
  });

  it('manifest tiến trình vẫn là dữ liệu thuần, JSON round-trip được', () => {
    for (const { def } of moiTienTrinh()) {
      const lai = JSON.parse(JSON.stringify(def.manifest)) as unknown;
      expect(lai).toEqual(def.manifest);
    }
  });
});

// ─────────────────────────────────────────── scheduler 71.4

describe('scheduler — Phần 71.4', () => {
  function gia(id: string, doc: string[], ghi: string[], uuTien = 50): TienTrinhNen {
    const def = {
      id,
      ten: id,
      manifest: { registry: 'worldProcess' },
      phamVi: 'place',
      nhip: { unit: 'tick', every: 1, eventTypes: [] },
      doc: doc.map((p) => ({ table: 'entities', path: p })),
      ghi: ghi.map((p) => ({ table: 'entities', path: p })),
      batBien: [],
      phanGiai: 'macro',
      uuTien,
      baoToan: [],
      buocTick: 1,
    } as unknown as WorldProcessDef;
    return { def, chay: () => ({ patches: [], suKien: [] }) };
  }

  it('quy tắc 3 — đồ thị không vòng chia đúng thứ tự giai đoạn', () => {
    const { giaiDoan, chuTrinh } = chiaGiaiDoan([
      gia('c', ['b.x'], ['c.x']),
      gia('a', ['a0.x'], ['a.x']),
      gia('b', ['a.x'], ['b.x']),
    ]);
    expect(chuTrinh).toEqual([]);
    expect(giaiDoan.map((g) => g.map((t) => t.def.id))).toEqual([['a'], ['b'], ['c']]);
  });

  it('quy tắc 3 — cụm phụ thuộc vòng được xếp CHUNG một giai đoạn', () => {
    const { giaiDoan, chuTrinh } = chiaGiaiDoan([gia('p', ['q.x'], ['p.x']), gia('q', ['p.x'], ['q.x'])]);
    expect(chuTrinh).toEqual([['p', 'q']]);
    expect(giaiDoan).toHaveLength(1);
    expect(giaiDoan[0]?.map((t) => t.def.id)).toEqual(['p', 'q']);
  });

  it('quy tắc 1 — nhiều `add` cùng path được GỘP thành một', () => {
    const p = (id: string, v: number): PatchOp => ({
      op: 'add',
      target: { table: 'entities', id: 'e1', path: 'aspects.kinh_te.kho.luongThuc' },
      value: v,
      sourceEventId: id,
    });
    const r = honNhatXungDot([
      { def: gia('a', [], []).def, patches: [p('a', 5)] },
      { def: gia('b', [], []).def, patches: [p('b', -2)] },
    ]);
    expect(r.patches).toHaveLength(1);
    expect(r.patches[0]?.value).toBe(3);
    expect(r.chanDoan).toEqual([]);
  });

  it('quy tắc 2 — `set` đụng `set` giải theo uuTien và CÓ chẩn đoán', () => {
    const p = (src: string, v: number): PatchOp => ({
      op: 'set',
      target: { table: 'entities', id: 'e1', path: 'aspects.y_te.tyLeMac' },
      value: v,
      sourceEventId: src,
    });
    const r = honNhatXungDot([
      { def: gia('thap', [], [], 10).def, patches: [p('thap', 0.1)] },
      { def: gia('cao', [], [], 90).def, patches: [p('cao', 0.9)] },
    ]);
    expect(r.patches).toHaveLength(1);
    expect(r.patches[0]?.value).toBe(0.9);
    expect(r.chanDoan.map((c) => c.ma)).toEqual(['SET_DUNG_SET']);
    expect(r.chanDoan[0]?.tienTrinhIds).toEqual(['cao', 'thap']);
  });

  it('quy tắc 5 — tiến trình làm vỡ bất biến bị BỎ RIÊNG, phần lành vẫn qua', () => {
    const { state } = theGioi();
    const noi = noiChonIds(state)[0] as string;

    const xau = gia('xau', [], ['aspects.dan_cu.cohort.adult']);
    const lanh = gia('lanh', [], ['aspects.kinh_te.kyThuat']);
    const tt: TienTrinhNen[] = [
      {
        def: xau.def,
        // Dân số âm — vi phạm `dan_so_khong_am`.
        chay: (nc) => ({
          patches: [
            {
              op: 'set',
              target: { table: 'entities', id: noi, path: 'aspects.dan_cu.cohort.adult' },
              value: -50,
              sourceEventId: nc.eventId,
            },
          ],
          suKien: [],
        }),
      },
      {
        def: lanh.def,
        chay: (nc) => ({
          patches: [
            {
              op: 'set',
              target: { table: 'entities', id: noi, path: 'aspects.kinh_te.kyThuat' },
              value: 42,
              sourceEventId: nc.eventId,
            },
          ],
          suKien: [],
        }),
      },
    ];

    const r = chayTienTrinhNen(state, { tick: 1, eventId: 'ev_x', tuning: TUNING, tienTrinh: tt });
    expect(r.chanDoan.map((c) => c.ma)).toContain('TIEN_TRINH_VI_PHAM_BAT_BIEN');
    const loi = r.chanDoan.find((c) => c.ma === 'TIEN_TRINH_VI_PHAM_BAT_BIEN');
    expect(loi?.tienTrinhIds).toEqual(['xau']);
    // Phần lành sống sót; một tiến trình sai không làm đứng cả thế giới.
    expect(r.patches.some((p) => p.target.path === 'aspects.kinh_te.kyThuat')).toBe(true);
    expect(r.patches.some((p) => p.target.path === 'aspects.dan_cu.cohort.adult')).toBe(false);
  });

  it('scheduler KHÔNG commit — state ra khỏi hàm y hệt lúc vào', () => {
    const { state } = theGioi();
    const truoc = hashState(state);
    const r = chayTienTrinhNen(state, { tick: 1, eventId: 'ev_x', tuning: TUNING });
    expect(r.patches.length).toBeGreaterThan(0);
    expect(hashState(state)).toBe(truoc);
  });

  it('bảo toàn khai sai thì lô patch bị BỎ, không teleport vật chất', () => {
    const { state } = theGioi();
    const noi = noiChonIds(state)[0] as string;
    const def = {
      id: 'gian_lan',
      ten: 'gian lận',
      manifest: {},
      phamVi: 'place',
      nhip: { unit: 'tick', every: 1, eventTypes: [] },
      doc: [{ table: 'entities', path: 'aspects.kinh_te.kho' }],
      ghi: [{ table: 'entities', path: 'aspects.kinh_te.kho.luongThuc' }],
      batBien: [],
      phanGiai: 'macro',
      uuTien: 50,
      baoToan: [{ table: 'entities', paths: ['aspects.kinh_te.kho.luongThuc'], tong: 0 }],
      buocTick: 1,
    } as unknown as WorldProcessDef;

    const r = chayTienTrinhNen(state, {
      tick: 1,
      eventId: 'ev_x',
      tuning: TUNING,
      tienTrinh: [
        {
          def,
          chay: (nc) => ({
            // Cộng thóc từ hư không: tổng ra 999 thay vì 0.
            patches: [
              {
                op: 'add',
                target: { table: 'entities', id: noi, path: 'aspects.kinh_te.kho.luongThuc' },
                value: 999,
                sourceEventId: nc.eventId,
              },
            ],
            suKien: [],
          }),
        },
      ],
    });
    expect(r.patches).toEqual([]);
    expect(r.chanDoan.map((c) => c.ma)).toEqual(['BAO_TOAN_VO']);
  });

  /**
   * Cụm phụ thuộc vòng của thế giới này có mười tiến trình: trong một mùa, dân
   * số, lương thực, bệnh, chiến sự và tri thức quyết định lẫn nhau. Cả cụm đọc
   * chung một ảnh chụp, nên ba tiến trình cùng rút kho phải chia phần trước.
   */
  it('ba phần rút kho cộng lại nhỏ hơn một — kho không thể âm vì tranh nhau', () => {
    expect(phanKhoHopLe()).toBe(true);
    expect(PHAN_KHO.an + PHAN_KHO.traoDoi + PHAN_KHO.thue).toBeLessThan(1);
  });

  it('tiến trình chỉ ĐỨNG SAU một vòng vẫn được giai đoạn riêng', () => {
    // ecology không nằm trong vòng nào; nó phải chạy trước cụm, không bị hút vào.
    const { giaiDoan, chuTrinh } = chiaGiaiDoan(moiTienTrinh());
    const cum = chuTrinh[0] ?? [];
    expect(cum).not.toContain('ecology');
    expect(cum).not.toContain('environment_cycle');
    const viTri = (id: string): number => giaiDoan.findIndex((g) => g.some((t) => t.def.id === id));
    expect(viTri('environment_cycle')).toBeLessThan(viTri('ecology'));
    expect(viTri('ecology')).toBeLessThan(viTri('production_consumption'));
  });

  it('tongTheoKhaiBao cộng đúng theo nhóm path', () => {
    const p = (path: string, v: number): PatchOp => ({
      op: 'add',
      target: { table: 'entities', id: 'e', path },
      value: v,
      sourceEventId: 'x',
    });
    const tong = tongTheoKhaiBao([p('a', 5), p('b', -5), p('c', 100)], {
      table: 'entities',
      paths: ['a', 'b'],
      tong: 0,
    });
    expect(tong).toBe(0);
  });

  it('handler ném lỗi không kéo cả thế giới theo', () => {
    const { state } = theGioi();
    const def = {
      ...(moiTienTrinh()[0] as TienTrinhNen).def,
      id: 'no_tung',
      nhip: { unit: 'tick', every: 1, eventTypes: [] },
    } as WorldProcessDef;
    const r = chayTienTrinhNen(state, {
      tick: 1,
      eventId: 'ev_x',
      tuning: TUNING,
      tienTrinh: [
        {
          def,
          chay: () => {
            throw new Error('vỡ');
          },
        },
      ],
    });
    expect(r.chanDoan.map((c) => c.ma)).toEqual(['HANDLER_NEM_LOI']);
    expect(r.patches).toEqual([]);
  });
});

// ─────────────────────────────────────────── cổng: 100 năm offline

describe('[BB] cổng Phase 5 — 100 năm offline không LLM', () => {
  const SO_TICK = 100 * TICK_MOI_NAM;

  it(`chạy ${SO_TICK} tick (100 năm) không LLM, không crash, invariant sạch`, () => {
    const { state, log } = theGioi('tram-nam');
    const danSoDau = danSoTong(state);
    expect(danSoDau).toBeGreaterThan(0);

    const r = chay(state, log, SO_TICK);

    expect(state.world.tick).toBe(SO_TICK);
    expect(state.world.year).toBe(100);
    expect(r.chanDoanLoi, r.chanDoanLoi.join('\n')).toEqual([]);

    const inv = chayInvariantToanBo(state);
    expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);

    // Thế giới phải SỐNG, không phải chỉ không crash.
    expect(danSoTong(state)).toBeGreaterThan(0);
    expect(r.suKien.length).toBeGreaterThan(20);
  });

  it('mọi tiến trình đều thật sự chạy trong một trăm năm đó', () => {
    const { state, log } = theGioi('tram-nam');
    const daChay = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const kq = chayTienTrinhNen(state, {
        tick: state.world.tick + 1,
        eventId: `ev_probe_${i}`,
        tuning: TUNING,
      });
      for (const id of kq.daChay) daChay.add(id);
      const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
      for (const ev of r.events) apDungEvent(state, ev, log);
    }
    for (const id of WORLD_PROCESS_IDS_712) expect(daChay.has(id), `'${id}' chưa chạy lần nào`).toBe(true);
  });

  it('dân số và vật chất không bao giờ âm suốt trăm năm', () => {
    const { state, log } = theGioi('am-tinh');
    for (let i = 0; i < SO_TICK; i++) {
      const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
      for (const ev of r.events) apDungEvent(state, ev, log);

      if (i % 25 !== 0) continue;
      for (const id of noiChonIds(state)) {
        const e = state.entities.get(id);
        const dc = docAspect<DanCu>(e, 'dan_cu');
        const kt = docAspect<KinhTe>(e, 'kinh_te');
        const st = docAspect<SinhThai>(e, 'sinh_thai');
        for (const b of ['child', 'youth', 'adult', 'elder'] as const) {
          expect(dc?.cohort[b], `${id}.${b} @tick ${state.world.tick}`).toBeGreaterThanOrEqual(0);
        }
        expect(kt?.kho.luongThuc).toBeGreaterThanOrEqual(-1e-6);
        expect(kt?.kho.vatLieu).toBeGreaterThanOrEqual(-1e-6);
        for (const l of ['rung', 'thu', 'ca', 'dat'] as const) {
          expect(st?.taiNguyen[l], `${id}.${l}`).toBeGreaterThanOrEqual(-1e-6);
        }
      }
    }
  });

  it('dân số không bùng nổ vô hạn — trần Malthus có thật', () => {
    const { state, log } = theGioi('malthus');
    const dau = danSoTong(state);
    chay(state, log, SO_TICK);
    const cuoi = danSoTong(state);
    // Đất và rừng chặn tăng trưởng; không có chuyện nhân một vạn lần.
    expect(cuoi).toBeLessThan(dau * 25);
  });
});

// ─────────────────────────────────────────── bảo toàn

describe('[BB] cổng Phase 5 — bảo toàn dân số và vật chất', () => {
  it('danSo luôn khớp tổng cohort, ở mọi tick', () => {
    const { state, log } = theGioi('khop');
    for (let i = 0; i < 120; i++) {
      const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
      for (const ev of r.events) apDungEvent(state, ev, log);
      for (const id of noiChonIds(state)) {
        const e = state.entities.get(id);
        const dc = docAspect<DanCu>(e, 'dan_cu');
        const sp = docAspect<{ danSo: number }>(e, 'spatial');
        expect(sp?.danSo, `${id} @tick ${state.world.tick}`).toBe(tongCohort(dc?.cohort));
      }
    }
  });

  it('di cư chỉ CHUYỂN người: tổng nhập trừ xuất toàn thế giới luôn bằng 0', () => {
    const { state, log } = theGioi('di-cu');
    for (let i = 0; i < 200; i++) {
      const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
      for (const ev of r.events) apDungEvent(state, ev, log);
      let net = 0;
      for (const id of noiChonIds(state)) {
        const dc = docAspect<DanCu>(state.entities.get(id), 'dan_cu');
        net += (dc?.soCai.nhapCu ?? 0) - (dc?.soCai.xuatCu ?? 0);
      }
      expect(net, `@tick ${state.world.tick}`).toBe(0);
    }
  });

  it('trao đổi không tạo và không hủy vật chất — tổng kho chỉ đổi vì sản xuất/tiêu thụ', () => {
    const { state } = theGioi('trao-doi');
    // Chạy RIÊNG tiến trình trao đổi: mọi thay đổi kho của nó phải triệt tiêu.
    const traoDoi = moiTienTrinh().filter((t) => t.def.id === 'exchange_debt');
    const r = chayTienTrinhNen(state, {
      tick: 4,
      eventId: 'ev_td',
      tuning: TUNING,
      tienTrinh: traoDoi,
    });
    for (const hang of ['luongThuc', 'vatLieu']) {
      const tong = r.patches
        .filter((p) => p.op === 'add' && p.target.path === `aspects.kinh_te.kho.${hang}`)
        .reduce((t, p) => t + (typeof p.value === 'number' ? p.value : 0), 0);
      expect(Math.abs(tong), hang).toBeLessThan(1e-6);
    }
  });

  it('gỗ vào kho đúng bằng gỗ rời rừng', () => {
    const { state } = theGioi('go');
    const sx = moiTienTrinh().filter((t) => t.def.id === 'production_consumption');
    const r = chayTienTrinhNen(state, { tick: 1, eventId: 'ev_sx', tuning: TUNING, tienTrinh: sx });
    const vaoKho = r.patches
      .filter((p) => p.op === 'add' && p.target.path === 'aspects.kinh_te.kho.vatLieu')
      .reduce((t, p) => t + (p.value as number), 0);
    const roiRung = r.patches
      .filter((p) => p.op === 'add' && p.target.path === 'aspects.sinh_thai.taiNguyen.rung')
      .reduce((t, p) => t + (p.value as number), 0);
    expect(vaoKho).toBeGreaterThan(0);
    expect(Math.abs(vaoKho + roiRung)).toBeLessThan(1e-6);
  });

  it('tài nguyên không bao giờ vượt sức chứa — không có phục hồi từ hư không', () => {
    const { state, log } = theGioi('suc-chua');
    chay(state, log, 200);
    for (const id of noiChonIds(state)) {
      const st = docAspect<SinhThai>(state.entities.get(id), 'sinh_thai');
      for (const l of ['rung', 'thu', 'ca', 'dat'] as const) {
        expect(st?.taiNguyen[l], `${id}.${l}`).toBeLessThanOrEqual((st?.sucChua[l] ?? 0) + 1e-3);
      }
    }
  });
});

// ─────────────────────────────────────────── tri thức

describe('[BB] cổng Phase 5 — không tri thức teleport', () => {
  it('mọi dòng tri thức nhiều chặng đều truy được về nguồn qua tuyến đường', () => {
    const { state, log } = theGioi('tri-thuc');
    chay(state, log, 240);

    const nhieuChang = [...state.knowledge.values()].filter((r) => r.source.hops > 0);
    expect(nhieuChang.length, 'chưa có tin nào lan được — bài test này vô nghĩa').toBeGreaterThan(0);

    for (const r of nhieuChang) {
      expect(r.source.sourceId).not.toBeNull();
      const nguon = [...state.knowledge.values()].find(
        (x) => x.knowerId === r.source.sourceId && x.factId === r.factId,
      );
      expect(nguon, `dòng '${r.id}' không có nguồn thật`).toBeDefined();
      expect(nguon?.learnedAtTick).toBeLessThanOrEqual(r.learnedAtTick);
      expect(r.duongIds.length).toBeGreaterThan(0);
    }

    const inv = chayInvariantToanBo(state);
    expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);
  });

  it('bất biến BẮT được tri thức nhét vào từ hư không', () => {
    const { state } = theGioi('teleport');
    const noi = noiChonIds(state)[1] as string;
    state.knowledge.set('kn_gia', {
      id: 'kn_gia',
      branchId: state.world.branchId,
      factId: 'fact_ma',
      knowerId: noi,
      proposition: 'Một điều không ai kể cho ai.',
      objectRefs: [],
      source: { type: 'told', sourceId: 'khong_co_that', hops: 3 },
      confidence: 0.9,
      distortion: {},
      learnedAtTick: state.world.tick,
      lastConfirmedAtTick: null,
      contradictedBy: [],
      duongIds: [],
    });
    const inv = chayInvariantToanBo(state);
    expect(inv.dat).toBe(false);
    expect(inv.viPhamNang.some((e) => e.code === 'KHONG_TRI_THUC_TELEPORT')).toBe(true);
  });

  it('tin không tới nơi trước khi đi hết đường', () => {
    const { state, log } = theGioi('do-tre');
    chay(state, log, 200);

    const tuyen = new Map<string, number>();
    for (const e of state.entities.values()) {
      if (e.kind !== 'route') continue;
      const d = docAspect<{ tuId: string; denId: string; doDai: number }>(e, 'duong');
      if (!d) continue;
      tuyen.set(`${d.tuId}|${d.denId}`, d.doDai);
      tuyen.set(`${d.denId}|${d.tuId}`, d.doDai);
    }

    let daKiem = 0;
    for (const r of state.knowledge.values()) {
      if (r.source.hops === 0 || r.source.sourceId === null) continue;
      const nguon = [...state.knowledge.values()].find(
        (x) => x.knowerId === r.source.sourceId && x.factId === r.factId,
      );
      const doDai = tuyen.get(`${r.source.sourceId}|${r.knowerId}`);
      if (!nguon || doDai === undefined) continue;
      expect(r.learnedAtTick - nguon.learnedAtTick).toBeGreaterThanOrEqual(doDai);
      daKiem++;
    }
    expect(daKiem).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────── macro → micro

describe('[BB] cổng Phase 5 — macro → micro bảo toàn state', () => {
  it('vật chất hóa RÚT người khỏi cohort, không sinh thêm người', () => {
    const { state, log } = theGioi('vat-chat-hoa');
    chay(state, log, 20);

    const noi = noiChonIds(state)[0] as string;
    const truoc = tongCohort(docAspect<DanCu>(state.entities.get(noi), 'dan_cu')?.cohort);

    const r = vatChatHoa(state, { noiId: noi, soNguoi: 3, eventId: 'ev_vch' });
    expect(r.lyDoTuChoi).toBeNull();
    expect(r.entityIds).toHaveLength(3);

    const ev = {
      id: 'ev_vch',
      branchId: state.world.branchId,
      tick: state.world.tick,
      loai: 'vat_chat_hoa',
      actorIds: [],
      targetIds: [noi],
      causeEventIds: [],
      locationId: noi,
      patches: [...r.patches],
      visibility: 'engine' as const,
      source: 'engine' as const,
      payload: {},
    };
    const ok = apDungEvent(state, taoEvent(ev), log);
    expect(ok.ok, ok.ok ? '' : JSON.stringify(ok.errors)).toBe(true);

    const sau = tongCohort(docAspect<DanCu>(state.entities.get(noi), 'dan_cu')?.cohort);
    // Ba người rời cohort và có tên; tổng dân của vùng vẫn là `truoc`.
    expect(sau).toBe(truoc - 3);
    for (const id of r.entityIds) expect(state.entities.has(id)).toBe(true);

    const inv = chayInvariantToanBo(state);
    expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);
  });

  it('không materialize được nhiều hơn số người vùng đang có', () => {
    const { state } = theGioi('khong-bia');
    const noi = noiChonIds(state)[0] as string;
    const co = tongCohort(docAspect<DanCu>(state.entities.get(noi), 'dan_cu')?.cohort);
    const r = vatChatHoa(state, { noiId: noi, soNguoi: co + 1, eventId: 'ev_x' });
    expect(r.entityIds).toEqual([]);
    expect(r.lyDoTuChoi).toContain('không thể vật chất hóa');
  });

  it('[BB] không materialize gia đình giàu trong vùng đói — người mới mang đúng cái nghèo của vùng', () => {
    const { state } = theGioi('vung-doi');
    const noi = noiChonIds(state)[0] as string;
    const e = state.entities.get(noi);
    // Ép vùng vào cảnh đói kiệt.
    const kt = docAspect<KinhTe>(e, 'kinh_te');
    if (e && kt) {
      e.aspects['kinh_te'] = { ...kt, thieuHut: 0.9, kho: { luongThuc: 0, vatLieu: 0 }, kyThuat: 2 };
    }

    const r = vatChatHoa(state, { noiId: noi, soNguoi: 2, eventId: 'ev_ngheo' });
    expect(r.lyDoTuChoi).toBeNull();
    for (const p of r.patches) {
      if (p.op !== 'link' || p.target.table !== 'entities') continue;
      const m = (p.value as { aspects: Record<string, unknown> }).aspects['mortal'] as {
        soHuu: unknown[];
        kyNang: Record<string, number>;
        thanThe: { theLuc: number };
      };
      // Không tài sản từ hư không; kỹ năng không vượt trình độ vùng; thể lực kém.
      expect(m.soHuu).toEqual([]);
      expect(m.kyNang['nghe_chinh']).toBeLessThan(20);
      expect(m.thanThe.theLuc).toBeLessThan(70);
    }
  });
});

// ─────────────────────────────────────────── catch-up + Smart Stop

describe('[BB] cổng Phase 5 — catch-up và Smart Stop', () => {
  it('tua một kỷ nguyên KHÔNG chạy một triệu vòng micro', () => {
    const { state, log } = theGioi('tua');
    const r = tuaThoiGian(state, log, {
      soTick: 100 * TICK_MOI_NAM,
      nhip: 'the_dai',
      smartStop: false,
      tuning: TUNING,
    });
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
    if (!r.ok) return;

    // 400 tick truyện gộp vào 10 bước engine — đó là toàn bộ điểm của 71.6.
    expect(r.value.soBuocEngine).toBe(10);
    expect(r.value.tickCuoi - r.value.tickDau).toBe(100 * TICK_MOI_NAM);
    expect(TICK_MOI_BUOC.the_dai).toBe(40);

    const inv = chayInvariantToanBo(state);
    expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);
  });

  it('tua vượt ngân sách bị từ chối TỬ TẾ, có hướng dẫn', () => {
    const r = (() => {
      const { state, log } = theGioi('ngan-sach');
      return tuaThoiGian(state, log, {
        soTick: 10_000_000,
        nhip: 'nien',
        tuning: TUNING,
      });
    })();
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.code).toBe('TUA_VUOT_NGAN_SACH');
    expect(r.errors[0]?.message).toContain('the_dai');
  });

  it('Smart Stop dừng ĐÚNG lúc có chuyện đáng xem, không dừng khi hết lượt', () => {
    // Tua rất dài với Smart Stop bật: nó phải dừng sớm ở một sự kiện trọng đại.
    const { state, log } = theGioi('smart-stop');
    const r = tuaThoiGian(state, log, {
      soTick: 400 * TICK_MOI_NAM,
      nhip: 'the_dai',
      smartStop: true,
      tuning: TUNING,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // Không chấp nhận "nếu có dừng thì…": Smart Stop phải THẬT SỰ chặn được
    // một quãng dài, nếu không thì tính năng này chỉ tồn tại trên giấy.
    expect(r.value.dung, 'Smart Stop không dừng lần nào trong bốn trăm năm').not.toBeNull();
    const dung = r.value.dung as NonNullable<typeof r.value.dung>;
    expect(r.value.tickCuoi).toBeLessThan(400 * TICK_MOI_NAM);
    expect(dung.moTa.length).toBeGreaterThan(0);
    // [BB] 47.3 — báo cáo phải mở thẳng vào chỗ đó.
    expect(dung.tick).toBe(r.value.tickCuoi);
    expect(DIEU_KIEN_DUNG).toContain(dung.dieuKien);

    const inv = chayInvariantToanBo(state);
    expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);
  });

  it('smartStop tắt thì chạy hết số bước đã xin', () => {
    const { state, log } = theGioi('khong-dung');
    const r = tuaThoiGian(state, log, {
      soTick: 40 * TICK_MOI_NAM,
      nhip: 'the_dai',
      smartStop: false,
      tuning: TUNING,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.dung).toBeNull();
    expect(r.value.tickCuoi).toBe(40 * TICK_MOI_NAM);
  });
});

// ─────────────────────────────────────────── determinism

describe('[BB] cổng Phase 5 — deterministic replay', () => {
  it('cùng seed cho cùng hash sau 100 năm', () => {
    const a = theGioi('xac-dinh');
    chay(a.state, a.log, 100 * TICK_MOI_NAM);
    const b = theGioi('xac-dinh');
    chay(b.state, b.log, 100 * TICK_MOI_NAM);
    expect(hashState(a.state)).toBe(hashState(b.state));
  });

  it('seed khác cho hash khác — hash phản ánh nội dung thật', () => {
    const a = theGioi('seed-a');
    chay(a.state, a.log, 80);
    const b = theGioi('seed-b');
    chay(b.state, b.log, 80);
    expect(hashState(a.state)).not.toBe(hashState(b.state));
  });

  it('replay từ event log dựng lại đúng thế giới đó', () => {
    const { state, log, events } = theGioi('replay');
    const them = chay(state, log, 120);
    const tatCa = [...events, ...them.events];

    const banDau = {
      ...state.world,
      tick: 0,
      year: 0,
      version: 0,
      playerState: { ...state.world.playerState },
    };
    const r = replay(banDau, tatCa);
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
    if (!r.ok) return;
    expect(r.value.hashCuoi).toBe(hashState(state));

    const d = kiemDeterminism(banDau, tatCa);
    expect(d.ok).toBe(true);
  });

  it('thứ tự chạy tiến trình không đổi kết quả — mỗi tiến trình có kênh RNG riêng', () => {
    const a = theGioi('kenh-rng');
    const b = theGioi('kenh-rng');
    const thuan = moiTienTrinh();
    const nguoc = [...thuan].reverse();

    const ra = chayTienTrinhNen(a.state, { tick: 1, eventId: 'ev', tuning: TUNING, tienTrinh: thuan });
    const rb = chayTienTrinhNen(b.state, { tick: 1, eventId: 'ev', tuning: TUNING, tienTrinh: nguoc });
    expect(rb.patches).toEqual(ra.patches);
  });
});

// ─────────────────────────────────────────── ngân sách

describe('cổng Phase 5 — benchmark trong ngân sách', () => {
  it('một trăm năm chạy dưới mười giây', () => {
    const { state, log } = theGioi('benchmark');
    // Không dùng đồng hồ máy trong core; ở test thì được — đây là đo, không phải mô phỏng.
    const t0 = Date.now();
    chay(state, log, 100 * TICK_MOI_NAM);
    expect(Date.now() - t0).toBeLessThan(10_000);
  });

  it('số giai đoạn của scheduler có chặn trên — đồ thị không nở theo thời gian', () => {
    const { state, log } = theGioi('giai-doan');
    const r0 = chayTienTrinhNen(state, { tick: 4, eventId: 'e0', tuning: TUNING });
    chay(state, log, 200);
    const r1 = chayTienTrinhNen(state, { tick: 204, eventId: 'e1', tuning: TUNING });
    expect(r1.soGiaiDoan).toBe(r0.soGiaiDoan);
    expect(r0.soGiaiDoan).toBeLessThanOrEqual(12);
  });
});

// ─────────────────────────────────────────── bản tin cho vòng chat

describe('bản tin — thế giới không đứng yên giữa hai lượt nói', () => {
  it('Sáng Thế thấy hết; phàm nhân chỉ thấy thứ có đường tới chỗ mình', () => {
    const { state, log } = theGioi('ban-tin');
    const r = chay(state, log, 160);
    expect(r.suKien.length).toBeGreaterThan(0);

    const tatCa = banTinCho(state, r.suKien, 'sang_the', null, 0, state.world.tick);
    expect(tatCa.muc.length).toBe(r.suKien.length);

    // Một phàm nhân đứng ở một vùng cụ thể.
    const phamNhan = 'mortal_1';
    expect(state.entities.has(phamNhan)).toBe(true);
    const cua = banTinCho(state, r.suKien, 'pham_nhan', phamNhan, 0, state.world.tick);
    expect(cua.muc.length).toBeLessThanOrEqual(tatCa.muc.length);
    for (const m of cua.muc) expect(['chung_kien', 'nghe_ke']).toContain(m.duong);
  });

  it('chuyện nghe kể được kể như tin đồn, không kể như mắt thấy', () => {
    const { state, log } = theGioi('tin-don');
    const r = chay(state, log, 200);
    const cua = banTinCho(state, r.suKien, 'pham_nhan', 'mortal_1', 0, state.world.tick);
    let daKiem = 0;
    for (const m of cua.muc) {
      if (m.duong !== 'nghe_ke') continue;
      expect(m.loiKe.startsWith('Người ta kể lại: ')).toBe(true);
      // Ghép bằng dấu hai chấm nên tên riêng giữ nguyên chữ hoa.
      const goc = m.loiKe.slice('Người ta kể lại: '.length);
      expect(goc.charAt(0)).toBe(goc.charAt(0).toUpperCase());
      daKiem++;
    }
    expect(daKiem, 'không có mục nghe kể nào — bài test này vô nghĩa').toBeGreaterThan(0);
  });

  it('mọi mục bản tin là câu tiếng Việt kể được, không phải số', () => {
    const { state, log } = theGioi('loi-ke');
    const r = chay(state, log, 200);
    const bt = banTinCho(state, r.suKien, 'sang_the', null, 0, state.world.tick);
    for (const m of bt.muc) {
      expect(m.loiKe.length).toBeGreaterThan(10);
      expect(m.loiKe).not.toMatch(/thieuHut|tyLeMac|cohort|=\s*0\./);
    }
  });
});

// ─────────────────────────────────────────── địa lý

describe('tuyến đường — hai làng còn buôn bán thì đường không tự mất', () => {
  /**
   * Hồi quy. Bản đầu để `travel_communication` và `settlement_infrastructure`
   * cùng `set` lên `duong.luuLuong`; cái có `uuTien` cao hơn luôn đặt lại về 0,
   * nên mọi con đường đều trông như chưa ai đi. Sau 60 tick đường tụt về 0 chất
   * lượng, `thongSuot = false`, và hai làng đứt liên lạc **vĩnh viễn** —
   * tin tức, hàng hóa, bệnh và người đều dừng ở đó.
   *
   * Bài test này canh cả hai mặt: đường còn thông, và bản tin còn đường để tới.
   */
  it('đường giữa hai vùng có dân vẫn thông sau một trăm năm', () => {
    const { state, log } = theGioi('duong-song');
    chay(state, log, 100 * TICK_MOI_NAM);

    const duong = [...state.entities.values()].filter((e) => e.kind === 'route');
    expect(duong.length).toBeGreaterThan(0);
    for (const e of duong) {
      const d = docAspect<{ thongSuot: boolean; chatLuong: number; luuLuong: number }>(e, 'duong');
      expect(d?.thongSuot, `${e.id} đã tắc`).toBe(true);
      expect(d?.chatLuong).toBeGreaterThan(0);
    }
  });

  it('lưu lượng cộng dồn từ NHIỀU nguồn, không bị một tiến trình đặt lại về 0', () => {
    const { state, log } = theGioi('luu-luong');
    chay(state, log, 12);
    // `add` từ người đưa tin và thương đoàn, `add` âm từ hao mòn — không `set`.
    const r = chayTienTrinhNen(state, { tick: state.world.tick + 1, eventId: 'ev_ll', tuning: TUNING });
    const setLuuLuong = r.patches.filter((p) => p.target.path === 'aspects.duong.luuLuong' && p.op === 'set');
    expect(setLuuLuong).toEqual([]);
  });
});

// ─────────────────────────────────────────── chiếu

describe('[BB] chiếu aspect nền — phàm nhân không đọc được sổ sách của engine', () => {
  it('tầng phàm nhân KHÔNG thấy con số kho, thiếu hụt hay tỷ lệ mắc', async () => {
    const { chieu } = await import('../project/chieu.js');
    const { state, log } = theGioi('chieu-nen');
    chay(state, log, 40);

    const view = chieu(state, 'pham_nhan', 'mortal_1');
    for (const pe of view.entities.values()) {
      const kt = pe.aspects['kinh_te'] as Record<string, unknown> | undefined;
      if (kt) {
        expect(kt['kho']).toBeUndefined();
        expect(kt['thieuHut']).toBeUndefined();
        expect(typeof kt['doiSong']).toBe('string');
      }
      const yt = pe.aspects['y_te'] as Record<string, unknown> | undefined;
      if (yt) {
        expect(yt['tyLeMac']).toBeUndefined();
        expect(typeof yt['benhTat']).toBe('string');
      }
      const dc = pe.aspects['dan_cu'] as Record<string, unknown> | undefined;
      if (dc) expect(dc['cohort']).toBeUndefined();
    }
  });

  it('Sáng Thế thấy đủ mọi con số — đó là định nghĩa của tầng ấy', async () => {
    const { chieu } = await import('../project/chieu.js');
    const { state, log } = theGioi('chieu-sang-the');
    chay(state, log, 20);
    const view = chieu(state, 'sang_the', null);
    const noi = view.entities.get(noiChonIds(state)[0] as string);
    const kt = noi?.aspects['kinh_te'] as Record<string, unknown> | undefined;
    expect(kt?.['kho']).toBeDefined();
    expect(typeof kt?.['thieuHut']).toBe('number');
  });
});

// ─────────────────────────────────────────── an ninh

describe('xung đột — thương vong trừ thẳng vào dân số', () => {
  it('an ninh không bao giờ để thương vong vượt dân số', () => {
    const { state, log } = theGioi('xung-dot');
    chay(state, log, 300);
    for (const id of noiChonIds(state)) {
      const e = state.entities.get(id);
      const an = docAspect<AnNinh>(e, 'an_ninh');
      const dc = docAspect<DanCu>(e, 'dan_cu');
      expect(an?.thuongVongKy).toBeGreaterThanOrEqual(0);
      expect(tongCohort(dc?.cohort)).toBeGreaterThanOrEqual(0);
    }
  });
});
