/**
 * Cổng thợ Bồi Đắp thứ bảy — người duy nhất trong xưởng có gọi model.
 *
 * Bốn điều phải đúng, và ba trong bốn nói về chuyện KHÔNG tin model:
 *
 *   1. câu hỏi chỉ được dựng khi thật sự còn chỗ trống, và nó dựng deterministic;
 *   2. câu trả lời đi qua đúng ba luật kết nạp — model không có đặc quyền nào so
 *      với `hoc_tu_moi`;
 *   3. model không ghi đè được thứ đã có tên, và không chạm được id nó không
 *      được hỏi;
 *   4. patch nó sinh ra vẫn nằm gọn trong lằn ranh 47.4 và vẫn qua được mọi bất
 *      biến của transaction.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog } from '../engine/state.js';
import type { WorldState, EventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { chayInvariantToanBo, datLaiInvariant } from '../engine/invariant.js';
import { napBatBienTheGioiSong } from './batBien.js';
import { moThuGioi, KhoiTaoWorldSchema } from './khoiTao.js';
import { eventGieoNen } from './gieoNen.js';
import type { PatchOp } from '../contracts/core.js';
import { CauHinhDienHoaSchema, locPatchTheoLanRanh } from './dienHoa.js';
import { docKho } from './tuVung.js';
import { choTrongCuaTheGioi, docBoiDapAi, dungPromptBoiDap } from './boiDapAi.js';

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
});

function theGioi(seed = 'bdai'): { state: WorldState; log: EventLog } {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  expect(apDungChuoi(state, events, log).ok).toBe(true);
  const evNen = eventGieoNen(state);
  if (evNen) expect(apDungEvent(state, evNen, log).ok).toBe(true);
  return { state, log };
}

function themVung(state: WorldState, log: EventLog, id: string, dan: number, x = 0): void {
  const evId = `ev_them_${id}`;
  const ev = taoEvent({
    id: evId,
    branchId: state.world.branchId,
    tick: state.world.tick,
    loai: 'boi_dap',
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches: [
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
    ],
    visibility: 'engine',
    source: 'engine',
    payload: {},
  });
  expect(apDungEvent(state, ev, log).ok).toBe(true);
  const evNen = eventGieoNen(state, `:${id}`);
  if (evNen) expect(apDungEvent(state, evNen, log).ok).toBe(true);
}

/** Áp một lô patch của thợ AI qua đúng cửa duy nhất — luật bất biến #4. */
function ap(state: WorldState, log: EventLog, patches: readonly PatchOp[], evId: string): boolean {
  return apDungEvent(
    state,
    taoEvent({
      id: evId,
      branchId: state.world.branchId,
      tick: state.world.tick,
      loai: 'boi_dap_ai',
      actorIds: [],
      targetIds: [],
      causeEventIds: [],
      locationId: null,
      patches: [...patches],
      visibility: 'engine',
      source: 'ai_validated',
      payload: {},
    }),
    log,
  ).ok;
}

// ═══════════════════════════════════════════ câu hỏi

describe('dungPromptBoiDap — chỉ hỏi khi còn chỗ trống, và hỏi giống nhau mọi lần', () => {
  it('thế giới rỗng vẫn hỏi được, vì Kho Từ luôn còn chỗ để học chữ', () => {
    const { state } = theGioi('p1');
    const p = dungPromptBoiDap({ state });
    expect(p).not.toBeNull();
    expect(p?.soTuXin).toBeGreaterThan(0);
    // Chưa có nơi chốn nào thì không có id nào được phép chạm.
    expect(p?.idChoPhep).toEqual([]);
  });

  it('không xin chữ nào nữa khi Kho Từ đã đầy, và im lặng khi cũng hết chỗ trống', () => {
    const { state } = theGioi('p2');
    expect(dungPromptBoiDap({ state, soTu: 0, soNoi: 0 })).toBeNull();
  });

  it('liệt kê đúng những nơi còn thiếu tên hoặc thiếu mô tả, theo id đã sắp xếp', () => {
    const { state, log } = theGioi('p3');
    themVung(state, log, 'noi_b', 400, 0);
    themVung(state, log, 'noi_a', 400, 8);

    const cho = choTrongCuaTheGioi(state, 10);
    expect(cho.map((c) => c.id)).toEqual(['noi_a', 'noi_b']);
    expect(cho.every((c) => c.thieuTen && c.thieuMoTa)).toBe(true);

    // Số liệu đưa cho model là số liệu THẬT của engine, không phải chỗ trống.
    expect(cho[0]?.soLieu).toMatch(/\d+ người/);

    // Cùng state ⇒ cùng câu hỏi, từng ký tự (luật bất biến #7).
    const a = dungPromptBoiDap({ state });
    const b = dungPromptBoiDap({ state });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ═══════════════════════════════════════════ câu trả lời

describe('docBoiDapAi — model đề nghị, engine duyệt', () => {
  it('không throw với rác, và nói ra là đã không đọc được gì', () => {
    const { state } = theGioi('d1');
    for (const rac of ['', 'xin chào', '{', '{"tuMoi": 5}', '[]', '```json\n{}\n```']) {
      const kq = docBoiDapAi(rac, { state, eventId: 'ev', tick: 0, idChoPhep: [] });
      expect(kq.patches).toEqual([]);
    }
  });

  it('chữ mới đi qua ĐÚNG ba luật kết nạp — trùng và gần giống đều bị từ chối', () => {
    const { state } = theGioi('d2');
    const kho = docKho(state.world.tuVung);
    expect(kho.some((x) => x.tu === 'Ngưỡng')).toBe(true);

    const kq = docBoiDapAi(
      JSON.stringify({
        tuMoi: [
          { tu: 'Ngưỡng', vai: 'dau_dia' }, // đã có
          { tu: 'Hỗn Mmang', vai: 'duoi_dia' }, // gần giống "Hỗn Mang"
          { tu: 'Trầm Uyên', vai: 'duoi_dia' }, // mới
          { tu: 'Lạc Hà', vai: 'khong_co_vai_nay' }, // vai bịa
          { tu: 'x!!!', vai: 'ho_nguoi' }, // ký tự lạ
        ],
      }),
      { state, eventId: 'ev_d2', tick: 3, idChoPhep: [] },
    );

    expect(kq.tuMoi.map((x) => x.tu)).toEqual(['Trầm Uyên']);
    expect(kq.tuMoi[0]?.nguon).toBe('the_gioi');
    expect(kq.tuMoi[0]?.tickThem).toBe(3);
    expect(kq.biBo.length).toBeGreaterThanOrEqual(3);
    // Đúng một patch, và nó ghi vào Kho Từ chứ không vào đâu khác.
    expect(kq.patches).toHaveLength(1);
    expect(kq.patches[0]?.target).toMatchObject({ table: 'worlds', path: 'tuVung' });
  });

  it('từ chối id không nằm trong tập vừa hỏi', () => {
    const { state, log } = theGioi('d3');
    themVung(state, log, 'noi_a', 400);
    themVung(state, log, 'noi_b', 400, 9);

    const kq = docBoiDapAi(JSON.stringify({ datTen: [{ id: 'noi_b', ten: 'Vực Trầm', moTa: 'Một nơi.' }] }), {
      state,
      eventId: 'ev_d3',
      tick: 1,
      idChoPhep: ['noi_a'],
    });
    expect(kq.patches.filter((p) => p.target.table === 'entities')).toEqual([]);
    expect(kq.biBo.join(' ')).toContain('noi_b');
  });

  it('[BB] không ghi đè thứ đã có tên — model lấp chỗ trống, không viết lại thế giới', () => {
    const { state, log } = theGioi('d4');
    themVung(state, log, 'noi_a', 400);

    const dat = docBoiDapAi(
      JSON.stringify({ datTen: [{ id: 'noi_a', ten: 'Vực Trầm', moTa: 'Một nơi.' }] }),
      {
        state,
        eventId: 'ev_d4a',
        tick: 1,
        idChoPhep: ['noi_a'],
      },
    );
    expect(ap(state, log, dat.patches, 'ev_d4a')).toBe(true);
    expect(state.entities.get('noi_a')?.ten).toBe('Vực Trầm');

    // Lần thứ hai: cả tên lẫn mô tả đã có, nên không patch nào được sinh ra.
    const lai = docBoiDapAi(
      JSON.stringify({ datTen: [{ id: 'noi_a', ten: 'Tên Khác', moTa: 'Mô tả khác.' }] }),
      { state, eventId: 'ev_d4b', tick: 2, idChoPhep: ['noi_a'] },
    );
    expect(lai.patches).toEqual([]);
    expect(state.entities.get('noi_a')?.ten).toBe('Vực Trầm');
  });

  it('từ chối tên trùng với một tên đang dùng', () => {
    const { state, log } = theGioi('d5');
    themVung(state, log, 'noi_a', 400);
    themVung(state, log, 'noi_b', 400, 9);

    const dau = docBoiDapAi(JSON.stringify({ datTen: [{ id: 'noi_a', ten: 'Vực Trầm' }] }), {
      state,
      eventId: 'ev_d5a',
      tick: 1,
      idChoPhep: ['noi_a'],
    });
    expect(ap(state, log, dau.patches, 'ev_d5a')).toBe(true);

    const sau = docBoiDapAi(JSON.stringify({ datTen: [{ id: 'noi_b', ten: 'vực trầm' }] }), {
      state,
      eventId: 'ev_d5b',
      tick: 2,
      idChoPhep: ['noi_b'],
    });
    expect(sau.patches.some((p) => p.target.path === 'ten')).toBe(false);
    expect(sau.biBo.join(' ')).toContain('đã có ai đó mang tên ấy');
  });
});

// ═══════════════════════════════════════════ lằn ranh và bất biến

describe('thợ AI — vẫn nằm gọn trong 47.4 và trong transaction', () => {
  it('patch của nó không chạm bảng cấm nào, và áp được với invariant sạch', () => {
    const { state, log } = theGioi('r1');
    themVung(state, log, 'noi_a', 600);
    const p = dungPromptBoiDap({ state });
    expect(p).not.toBeNull();

    const kq = docBoiDapAi(
      JSON.stringify({
        tuMoi: [
          { tu: 'Trầm Uyên', vai: 'duoi_dia' },
          { tu: 'Lạc Hà', vai: 'dau_dia' },
        ],
        datTen: [{ id: 'noi_a', ten: 'Lạc Hà Trầm Uyên', moTa: 'Một vùng có người ở.' }],
      }),
      { state, eventId: 'ev_r1', tick: state.world.tick, idChoPhep: p?.idChoPhep ?? [] },
    );
    expect(kq.patches.length).toBeGreaterThan(0);

    const loc = locPatchTheoLanRanh(kq.patches, CauHinhDienHoaSchema.parse({}), state);
    expect(loc.bo).toEqual([]);
    expect(loc.giu).toHaveLength(kq.patches.length);

    expect(ap(state, log, loc.giu, 'ev_r1')).toBe(true);
    expect(chayInvariantToanBo(state).viPhamNang).toEqual([]);

    // Và Kho Từ thật sự dày lên — đây là điều sáu thợ engine không làm được.
    const tuHoc = docKho(state.world.tuVung).filter((x) => x.nguon !== 'goc');
    expect(tuHoc.map((x) => x.tu).sort()).toEqual(['Lạc Hà', 'Trầm Uyên']);
  });
});
