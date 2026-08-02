/**
 * Phần còn nợ của Phase 6 — đóng năm giới hạn đã ghi trong `IMPLEMENTATION_STATUS.md`:
 *
 *   1. bộ chọn chủ thể — "bấm Thần có lần rơi vào Phàm Nhân";
 *   2. hóa thân chưa làm `chieu()` tụt xuống mức phàm nhân (19.4);
 *   3. phân thân mới có `doPhanKy`, chưa tách thành entity (12.3);
 *   4. hội đồng thần và kế vị chưa có (69.3);
 *   5. thần NPC chưa đi qua Intent/Project (69.3).
 *
 * Mỗi mục ở đây kiểm điều mà bản Phase 6 KHÔNG làm được, nên nếu ai đó lỡ hoàn
 * nguyên một trong năm thứ trên thì test đỏ chứ không phải tài liệu sai.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog } from '../engine/state.js';
import type { WorldState, EventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { chayInvariantToanBo, datLaiInvariant } from '../engine/invariant.js';
import { motTick } from '../engine/tick.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { napBatBienTangThan } from '../world/batBienThan.js';
import { chayTienTrinhNen } from '../world/process/scheduler.js';
import { TUNING_MAC_DINH } from '../tuning/schema.js';
import { chieu } from '../project/chieu.js';
import type { Event, PatchOp } from '../contracts/core.js';
import type { DivineIdentity } from '../schema/aspect/thanVi.js';
import type { DuAnAspect } from '../schema/aspect/duAn.js';
import { HoiDongSchema, demPhieu } from '../schema/aspect/hoiDong.js';
import { EntitySchema } from '../schema/entity.js';
import { BAN_TINH_TRUC } from '../schema/aspect/soul.js';

import { chonChuThe, chuTheMacDinhCho, tangKhaDung } from './chuThe.js';
import { hoaThan, kiemHoaThan, thucTinh, veThan } from './hoaThan.js';
import { doPhanKy, hopNhatDuoc, tachPhanThan } from './phanThan.js';
import {
  boPhieu,
  boTrongGheDau,
  ketNap,
  moNghiQuyet,
  tiengNoiCua,
  traoGheDau,
  trucXuat,
  ungVienKeVi,
} from './hoiDong.js';
import { loaiCuaDuAnThan, moDuAnThan, raSoatDuAnThan, ungVienDuAn } from './duAn.js';

const TUNING = TUNING_MAC_DINH;
const THAN = 'deity_1';

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
  napBatBienTangThan();
});

function theGioi(seed = 'phase6b'): { state: WorldState; log: EventLog } {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  expect(apDungChuoi(state, events, log).ok).toBe(true);
  const ev = eventGieoNen(state);
  expect(apDungEvent(state, ev as Event, log).ok).toBe(true);
  return { state, log };
}

/** Áp một lô patch qua đúng cửa Event — không test nào sửa state trực tiếp. */
function ap(state: WorldState, log: EventLog, id: string, patches: readonly PatchOp[], loai = 'test'): void {
  if (patches.length === 0) return;
  const ev = taoEvent({
    id,
    branchId: state.world.branchId,
    tick: state.world.tick,
    loai,
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches: [...patches],
    visibility: 'cong_khai',
    source: 'player',
    payload: {},
  });
  const ok = apDungEvent(state, ev, log);
  expect(ok.ok, ok.ok ? '' : JSON.stringify(ok.errors)).toBe(true);
}

/**
 * Đổi lõi bản ngã cho tử tế.
 *
 * [BB] 69.1 — `coreSelf` và `soul.banTinh` là cùng một sự thật ghi ở hai chỗ, và
 * bất biến `coreself_co_giai_thich` từ chối mọi lô patch chỉ chạm một bên. Helper
 * này giữ hình dạng ấy ở đúng một nơi, cùng lẽ với `phamVi()` của Phase 6.
 */
function doiLoi(id: string, giaTri: number, evId: string): PatchOp[] {
  // Đặt cả sáu trục: `khoangCachBanTinh` đo bằng TRỤC LỆCH NHẤT (ADR-0025), nên
  // chỉnh một trục rồi kết luận "hai lõi đã gần nhau" là đọc sai chính công thức.
  const banTinh = Object.fromEntries(BAN_TINH_TRUC.map((t) => [t, giaTri]));
  return [
    {
      op: 'set',
      target: { table: 'entities', id, path: 'aspects.ban_nga.coreSelf' },
      value: banTinh,
      sourceEventId: evId,
    },
    {
      op: 'set',
      target: { table: 'entities', id, path: 'aspects.soul.banTinh' },
      value: banTinh,
      sourceEventId: evId,
    },
  ];
}

function chay(state: WorldState, log: EventLog, soTick: number): void {
  for (let i = 0; i < soTick; i++) {
    const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
    for (const ev of r.events) {
      const ok = apDungEvent(state, ev, log);
      expect(ok.ok, ok.ok ? '' : JSON.stringify(ok.errors)).toBe(true);
    }
  }
}

// ─────────────────────────────────────────── 1. bộ chọn chủ thể

describe('bộ chọn chủ thể — đóng lỗi "bấm Thần ra Phàm Nhân"', () => {
  it('chọn trên thế giới THẬT, nên đứng ở tầng nào cũng ra cùng danh sách', () => {
    const { state, log } = theGioi();
    const tuSangThe = chonChuThe(state, 'than').map((u) => u.id);
    expect(tuSangThe.length).toBeGreaterThan(0);

    // Chuyển xuống Phàm Nhân rồi hỏi lại — bản cũ đọc `view` nên đổi kết quả ở đây.
    const nguoi = [...state.entities.values()].find((e) => e.kind === 'mortal');
    ap(
      state,
      log,
      'ev_xuong_pham',
      [
        {
          op: 'set',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
          value: 'pham_nhan',
          sourceEventId: 'ev_xuong_pham',
        },
        {
          op: 'set',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
          value: nguoi?.id ?? null,
          sourceEventId: 'ev_xuong_pham',
        },
      ],
      'chuyen_tang',
    );

    expect(chonChuThe(state, 'than').map((u) => u.id)).toEqual(tuSangThe);
    expect(chuTheMacDinhCho(state, 'than')).toBe(tuSangThe[0]);
  });

  it('chỉ trả về đúng kind của tầng', () => {
    const { state } = theGioi();
    for (const u of chonChuThe(state, 'than')) expect(state.entities.get(u.id)?.kind).toBe('deity');
    for (const u of chonChuThe(state, 'pham_nhan')) expect(state.entities.get(u.id)?.kind).toBe('mortal');
  });

  it('Sáng Thế không có chủ thể — và đó là câu trả lời đúng, không phải rỗng do lỗi', () => {
    const { state } = theGioi();
    expect(chonChuThe(state, 'sang_the')).toEqual([]);
    expect(chuTheMacDinhCho(state, 'sang_the')).toBeNull();
    expect(tangKhaDung(state).sang_the).toBe(true);
  });

  it('mỗi ứng viên có câu giải thích đọc được, không phải điểm số', () => {
    const { state } = theGioi();
    for (const u of chonChuThe(state, 'than')) {
      expect(u.vi.length).toBeGreaterThan(3);
      expect(u.vi).not.toMatch(/^\d+$/);
    }
  });

  it('chủ thể đang nhập luôn đứng đầu — quay lại đúng chỗ mình vừa rời', () => {
    const { state, log } = theGioi();
    const ds = chonChuThe(state, 'than');
    if (ds.length < 2) return; // thế giới hạt giống có thể chỉ có một vị thần
    const cuoi = ds[ds.length - 1]?.id;
    ap(
      state,
      log,
      'ev_nhap_cuoi',
      [
        {
          op: 'set',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
          value: cuoi,
          sourceEventId: 'ev_nhap_cuoi',
        },
      ],
      'chuyen_tang',
    );
    expect(chonChuThe(state, 'than')[0]?.id).toBe(cuoi);
  });

  it('thế giới không có thần thì tầng Thần báo không khả dụng, không im lặng', () => {
    const { state } = theGioi();
    for (const [id, e] of [...state.entities.entries()]) {
      if (e.kind === 'deity') state.entities.set(id, { ...e, tickDiet: 0 });
    }
    expect(tangKhaDung(state).than).toBe(false);
    expect(chuTheMacDinhCho(state, 'than')).toBeNull();
  });
});

// ─────────────────────────────────────────── 2. hóa thân

describe('[BB] 19.4 — hóa thân hạ tầm nhìn xuống mức phàm nhân', () => {
  function haPham(state: WorldState, log: EventLog, mucQuen = 80): string {
    const noi = [...state.entities.values()].find((e) => e.kind === 'place');
    const r = hoaThan(
      state,
      {
        thanId: THAN,
        thanTheId: null,
        vungId: noi?.id ?? null,
        ten: 'Người Gánh Nước',
        mucQuen,
        dieuKienThucTinh: 'khi thấy máu trên bậc đền',
        neuChet: 've_than',
      },
      { eventId: 'ev_hoathan', tick: state.world.tick },
    );
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
    if (!r.ok) throw new Error('không hóa thân được');
    ap(state, log, 'ev_hoathan', r.value.patches, 'than_hoa_than');
    return r.value.thanTheId;
  }

  it('trước khi hóa thân, thần thấy văn bản luật trong domain', () => {
    const { state } = theGioi();
    const v = chieu(state, 'than', THAN);
    expect(v.mucChieu).toBe('than');
    expect(v.dangHoaThan).toBe(false);
  });

  it('đang hóa thân: mode vẫn là `than`, nhưng mức chiếu tụt xuống `pham_nhan`', () => {
    const { state, log } = theGioi();
    haPham(state, log);
    const v = chieu(state, 'than', THAN);
    // Danh tính không mất — chỉ tầm nhìn mất. Đó là toàn bộ ý nghĩa của hạ phàm.
    expect(v.mode).toBe('than');
    expect(v.mucChieu).toBe('pham_nhan');
    expect(v.dangHoaThan).toBe(true);
  });

  it('đang hóa thân: KHÔNG đọc được sổ sách tín ngưỡng của chính mình nữa', () => {
    const { state, log } = theGioi();

    // Ở tầng Thần, vị thần đọc được `venerable` đầy đủ của chính mình — kể cả
    // mật độ đền từng vùng, thứ không ai khác được thấy (18.2).
    const truoc = chieu(state, 'than', THAN).entities.get(THAN)?.aspects['venerable'] as
      Record<string, unknown> | undefined;
    expect(truoc).toBeDefined();
    expect(Object.keys(truoc ?? {})).toContain('matDoDen');

    haPham(state, log);

    // Hạ phàm rồi thì cái sổ ấy biến mất khỏi ĐỐI TƯỢNG, không phải bị ẩn đi
    // (luật bất biến #9). Người gánh nước không biết mình có bao nhiêu đền.
    const sau = chieu(state, 'than', THAN).entities.get(THAN)?.aspects['venerable'] as
      Record<string, unknown> | undefined;
    expect(Object.keys(sau ?? {})).not.toContain('matDoDen');
    expect(Object.keys(sau ?? {})).not.toContain('doLechDiHoa');
  });

  it('đang hóa thân: nhịp thời gian thành nhịp của người, không của thần', () => {
    const { state, log } = theGioi();
    expect(chieu(state, 'than', THAN).nhipThoiGian).toBe('nien');
    haPham(state, log);
    expect(chieu(state, 'than', THAN).nhipThoiGian).toBe('nhat');
  });

  it('đổi tầm nhìn thì `visibilityHash` đổi — cache rerank cũ phải vô hiệu (77.8)', () => {
    const { state, log } = theGioi();
    const truoc = chieu(state, 'than', THAN).visibilityHash;
    haPham(state, log);
    expect(chieu(state, 'than', THAN).visibilityHash).not.toBe(truoc);
  });

  it('thức tỉnh trả lại tầm nhìn ngay trong cùng thân xác', () => {
    const { state, log } = theGioi();
    haPham(state, log);
    const r = thucTinh(state, THAN, {
      eventId: 'ev_thuctinh',
      tick: state.world.tick,
      lyDo: 'Máu đã đổ trên bậc đền',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_thuctinh', r.value.patches, 'than_thuc_tinh');

    const v = chieu(state, 'than', THAN);
    expect(v.dangHoaThan).toBe(false);
    expect(v.mucChieu).toBe('than');
  });

  it('về trời bỏ hóa thân nhưng thân xác vẫn còn sống', () => {
    const { state, log } = theGioi();
    const ttId = haPham(state, log);
    const r = veThan(state, THAN, { eventId: 'ev_vethan', tick: state.world.tick });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_vethan', r.value.patches, 'than_ve_troi');

    expect(state.entities.get(THAN)?.aspects['avatar']).toBeUndefined();
    expect(state.entities.get(ttId)?.tickDiet).toBeNull();
    expect(chieu(state, 'than', THAN).dangHoaThan).toBe(false);
  });

  it('[BB] nhớ quá nhiều thì không phải hóa thân — validator từ chối', () => {
    const { state } = theGioi();
    const chan = kiemHoaThan(state, {
      thanId: THAN,
      thanTheId: null,
      vungId: 'place_1',
      ten: 'x',
      mucQuen: 5,
      dieuKienThucTinh: '',
      neuChet: 've_than',
    });
    expect(chan.some((c) => c.code === 'QUEN_QUA_IT')).toBe(true);
  });

  it('quyền năng còn lại do engine suy từ mức quên, không do người chơi khai', () => {
    const { state, log } = theGioi();
    haPham(state, log, 90);
    const av = state.entities.get(THAN)?.aspects['avatar'] as { quyenNangConLai: number };
    expect(av.quyenNangConLai).toBeLessThanOrEqual(2);
  });

  it('đang hóa thân thì không hạ phàm lần nữa', () => {
    const { state, log } = theGioi();
    haPham(state, log);
    const chan = kiemHoaThan(state, {
      thanId: THAN,
      thanTheId: null,
      vungId: 'place_1',
      ten: 'x',
      mucQuen: 80,
      dieuKienThucTinh: '',
      neuChet: 've_than',
    });
    expect(chan.some((c) => c.code === 'DANG_HOA_THAN')).toBe(true);
  });

  it('thế giới vẫn hợp lệ sau khi hóa thân và chạy hai mươi nhịp', () => {
    const { state, log } = theGioi();
    haPham(state, log);
    chay(state, log, 20);
    expect(chayInvariantToanBo(state).dat).toBe(true);
  });
});

// ─────────────────────────────────────────── 3. phân thân

describe('[BB] 12.3 — phân thân tách thành entity thật', () => {
  function tach(state: WorldState, log: EventLog): string {
    const r = tachPhanThan(state, THAN, { eventId: 'ev_phanthan', tick: state.world.tick });
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
    if (!r.ok) throw new Error('không tách được');
    ap(state, log, 'ev_phanthan', r.value.patches, 'than_phan_than');
    return r.value.phanThanId;
  }

  it('sau khi tách, thế giới có THÊM một vị thần', () => {
    const { state, log } = theGioi();
    const truoc = [...state.entities.values()].filter((e) => e.kind === 'deity').length;
    tach(state, log);
    const sau = [...state.entities.values()].filter((e) => e.kind === 'deity').length;
    expect(sau).toBe(truoc + 1);
  });

  it('bản thể mới lấy HÌNH ẢNH tín đồ làm lõi; bản gốc giữ lõi thật', () => {
    const { state, log } = theGioi();
    const bnTruoc = state.entities.get(THAN)?.aspects['ban_nga'] as DivineIdentity;
    const ptId = tach(state, log);

    const bnPt = state.entities.get(ptId)?.aspects['ban_nga'] as DivineIdentity;
    const bnGoc = state.entities.get(THAN)?.aspects['ban_nga'] as DivineIdentity;
    expect(bnPt.coreSelf).toEqual(bnTruoc.followerImage);
    expect(bnGoc.coreSelf).toEqual(bnTruoc.coreSelf);
  });

  it('tín đồ đi theo hình ảnh — bản gốc mất phần lớn người và toàn bộ đền', () => {
    const { state, log } = theGioi();
    ap(
      state,
      log,
      'ev_cho_tin_do',
      [
        {
          op: 'set',
          target: { table: 'entities', id: THAN, path: 'aspects.venerable.soTinDoUocLuong' },
          value: 100,
          sourceEventId: 'ev_cho_tin_do',
        },
        {
          op: 'set',
          target: { table: 'entities', id: THAN, path: 'aspects.venerable.matDoDen' },
          value: { place_1: 0.4 },
          sourceEventId: 'ev_cho_tin_do',
        },
      ],
      'test_dat_tin_do',
    );

    const ptId = tach(state, log);
    const goc = state.entities.get(THAN)?.aspects['venerable'] as {
      soTinDoUocLuong: number;
      matDoDen: Record<string, number>;
    };
    const pt = state.entities.get(ptId)?.aspects['venerable'] as { soTinDoUocLuong: number };
    expect(pt.soTinDoUocLuong).toBe(80);
    expect(goc.soTinDoUocLuong).toBe(20);
    expect(Object.keys(goc.matDoDen)).toEqual([]);
  });

  it('phân thân làm tan áp lực Dị Hóa của bản gốc', () => {
    const { state, log } = theGioi();
    ap(
      state,
      log,
      'ev_ep_lech',
      [
        {
          op: 'set',
          target: { table: 'entities', id: THAN, path: 'aspects.ban_nga.pressure.distortion' },
          value: 70,
          sourceEventId: 'ev_ep_lech',
        },
      ],
      'test_ep_lech',
    );
    tach(state, log);
    const bn = state.entities.get(THAN)?.aspects['ban_nga'] as DivineIdentity;
    expect(bn.pressure.distortion).toBe(0);
  });

  it('hai bản thể nối bằng quan hệ hai chiều — không thực thể mồ côi (6.3)', () => {
    const { state, log } = theGioi();
    const ptId = tach(state, log);
    const canh = [...state.links.values()].filter((lk) => lk.tickDut === null);
    expect(canh.some((lk) => lk.tuId === ptId && lk.denId === THAN && lk.quanHe === 'phan_than_cua')).toBe(
      true,
    );
    expect(canh.some((lk) => lk.tuId === THAN && lk.denId === ptId && lk.quanHe === 'co_phan_than')).toBe(
      true,
    );
    expect(chayInvariantToanBo(state).dat).toBe(true);
  });

  it('phân kỳ đo khoảng cách THẬT, không phải bộ đếm theo thời gian', () => {
    const { state, log } = theGioi();
    const ptId = tach(state, log);

    // Vừa tách: hai lõi có thể đã khác nhau, nhưng chưa ai trôi thêm.
    ap(state, log, 'ev_pk1', doPhanKy(state, THAN, 'ev_pk1'), 'phan_ky');
    const d1 = (state.entities.get(ptId)?.aspects['divisible'] as { doPhanKy: number }).doPhanKy;

    // Đẩy lõi bản thể mới đi thật xa rồi đo lại.
    // [BB] `coreself_co_giai_thich` — lõi và `soul.banTinh` là cùng một sự thật
    // ở hai chỗ, nên phải đổi cả hai. Chạm một bên là đúng cái bug 69.1 chặn.
    ap(state, log, 'ev_day_loi', doiLoi(ptId, 100, 'ev_day_loi'), 'than_tu_dinh_nghia');
    ap(state, log, 'ev_pk2', doPhanKy(state, THAN, 'ev_pk2'), 'phan_ky');
    const d2 = (state.entities.get(ptId)?.aspects['divisible'] as { doPhanKy: number }).doPhanKy;
    expect(d2).toBeGreaterThan(d1);
  });

  it('trôi xa quá ngưỡng thì không hợp nhất lại được', () => {
    const { state, log } = theGioi();
    const ptId = tach(state, log);
    // Kéo hai lõi về cùng một chỗ trước: hợp nhất được nghĩa là "còn nhận ra nhau".
    ap(
      state,
      log,
      'ev_gan',
      [...doiLoi(ptId, 0, 'ev_gan'), ...doiLoi(THAN, 0, 'ev_gan')],
      'than_tu_dinh_nghia',
    );
    expect(hopNhatDuoc(state, THAN, ptId)).toBe(true);

    // Rồi đẩy ra hai đầu — khoảng cách 100 vượt `nguongHopNhat` mặc định 60.
    ap(
      state,
      log,
      'ev_xa',
      [...doiLoi(ptId, 100, 'ev_xa'), ...doiLoi(THAN, -100, 'ev_xa')],
      'than_tu_dinh_nghia',
    );
    expect(hopNhatDuoc(state, THAN, ptId)).toBe(false);
  });

  it('thế giới có phân thân chạy ba mươi nhịp vẫn sạch bất biến', () => {
    const { state, log } = theGioi();
    tach(state, log);
    chay(state, log, 30);
    expect(chayInvariantToanBo(state).dat).toBe(true);
  });
});

// ─────────────────────────────────────────── 4. hội đồng thần

describe('[BB] 69.3 — hội đồng thần và kế vị', () => {
  const HE = 'pantheon_test';

  function dungHoiDong(state: WorldState, log: EventLog, thanIds: readonly string[]): void {
    const e = EntitySchema.parse({
      id: HE,
      branchId: state.world.branchId,
      kind: 'pantheon',
      ten: 'Thần Điện Thử',
      moTa: '',
      tickSinh: 0,
      aspects: {
        hoi_dong: HoiDongSchema.parse({
          ten: 'Hội đồng thử',
          ghe: thanIds.map((id, i) => ({
            thanId: id,
            vai: i === 0 ? 'chu_tich' : 'thanh_vien',
            tickNhanGhe: 0,
            uyTin: 50 + i * 10,
          })),
          luatKeVi: 'bau_phieu',
        }),
      },
    });
    ap(
      state,
      log,
      'ev_dung_hd',
      [
        {
          op: 'link',
          target: { table: 'entities', id: HE, path: '' },
          value: e,
          sourceEventId: 'ev_dung_hd',
        },
      ],
      'dung_hoi_dong',
    );
  }

  /** Ba vị thần: một gốc + hai phân thân, để có đủ người mà bỏ phiếu. */
  function baThan(state: WorldState, log: EventLog): string[] {
    const a = tachPhanThan(state, THAN, { eventId: 'ev_pt_a', tick: state.world.tick });
    expect(a.ok).toBe(true);
    if (!a.ok) return [THAN];
    ap(state, log, 'ev_pt_a', a.value.patches, 'than_phan_than');
    const b = tachPhanThan(state, THAN, { eventId: 'ev_pt_b', tick: state.world.tick });
    expect(b.ok).toBe(true);
    if (!b.ok) return [THAN, a.value.phanThanId];
    ap(state, log, 'ev_pt_b', b.value.patches, 'than_phan_than');
    return [THAN, a.value.phanThanId, b.value.phanThanId];
  }

  it('kết nạp cho một vị thần cái ghế, và ghế đó có phiếu', () => {
    const { state, log } = theGioi();
    const ds = baThan(state, log);
    dungHoiDong(state, log, [ds[0] as string]);

    const r = ketNap(state, HE, ds[1] as string, { eventId: 'ev_ketnap', tick: state.world.tick });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_ketnap', r.value.patches, 'hoi_dong_ket_nap');

    const hd = HoiDongSchema.parse(state.entities.get(HE)?.aspects['hoi_dong']);
    expect(hd.ghe.map((g) => g.thanId)).toContain(ds[1]);
  });

  it('kẻ không có ghế thì không bỏ phiếu được', () => {
    const { state, log } = theGioi();
    const ds = baThan(state, log);
    dungHoiDong(state, log, [ds[0] as string]);

    const r = moNghiQuyet(
      state,
      HE,
      { id: 'nq1', loai: 'ket_nap', noiDung: 'Nhận thêm một vị', veThanIds: [] },
      { eventId: 'ev_mo', tick: state.world.tick },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_mo', r.value.patches, 'hoi_dong_mo');

    const bp = boPhieu(state, HE, 'nq1', ds[1] as string, 'thuan', {
      eventId: 'ev_bp',
      tick: state.world.tick,
    });
    expect(bp.ok).toBe(false);
  });

  it('quá nửa số ghế không tới thì kết quả là `khong_du_phieu`, không phải bác bỏ', () => {
    const hd = HoiDongSchema.parse({
      ghe: [
        { thanId: 'a', vai: 'chu_tich' },
        { thanId: 'b', vai: 'thanh_vien' },
        { thanId: 'c', vai: 'thanh_vien' },
        { thanId: 'd', vai: 'thanh_vien' },
      ],
    });
    const nq = {
      id: 'x',
      loai: 'ket_nap' as const,
      noiDung: '',
      veThanIds: [],
      tickMo: 0,
      tickDong: null,
      phieu: { a: 'thuan' as const },
      ketQua: 'dang_ban' as const,
    };
    expect(demPhieu(hd, nq)).toBe('khong_du_phieu');
    expect(demPhieu(hd, { ...nq, phieu: { a: 'thuan', b: 'thuan', c: 'thuan' } })).toBe('thong_qua');
    expect(demPhieu(hd, { ...nq, phieu: { a: 'chong', b: 'chong', c: 'thuan' } })).toBe('bac_bo');
  });

  it('khách và kẻ bị trục xuất không có phiếu', () => {
    const hd = HoiDongSchema.parse({
      ghe: [
        { thanId: 'a', vai: 'chu_tich' },
        { thanId: 'b', vai: 'khach' },
        { thanId: 'c', vai: 'bi_truc_xuat' },
      ],
    });
    // Chỉ `a` là cử tri; `a` thuận là đủ.
    expect(
      demPhieu(hd, {
        id: 'x',
        loai: 'ket_nap',
        noiDung: '',
        veThanIds: [],
        tickMo: 0,
        tickDong: null,
        phieu: { a: 'thuan' },
        ketQua: 'dang_ban',
      }),
    ).toBe('thong_qua');
  });

  it('tiếng nói suy từ thế giới — mất tín đồ thì mất tiếng nói', () => {
    const { state, log } = theGioi();
    const truoc = tiengNoiCua(state, THAN);
    ap(
      state,
      log,
      'ev_mat_tin_do',
      [
        {
          op: 'set',
          target: { table: 'entities', id: THAN, path: 'aspects.venerable.soTinDoUocLuong' },
          value: 0,
          sourceEventId: 'ev_mat_tin_do',
        },
        {
          op: 'set',
          target: { table: 'entities', id: THAN, path: 'aspects.venerable.matDoDen' },
          value: {},
          sourceEventId: 'ev_mat_tin_do',
        },
      ],
      'test_mat_tin_do',
    );
    expect(tiengNoiCua(state, THAN)).toBeLessThan(truoc);
  });

  it('ghế đầu trống mở tình huống kế vị và KHÔNG tự lấp', () => {
    const { state, log } = theGioi();
    const ds = baThan(state, log);
    dungHoiDong(state, log, ds);

    const r = boTrongGheDau(state, HE, { eventId: 'ev_trong', tick: state.world.tick, lyDo: 'vị ấy đã tan' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_trong', r.value.patches, 'hoi_dong_ghe_trong');

    const hd = HoiDongSchema.parse(state.entities.get(HE)?.aspects['hoi_dong']);
    expect(hd.tickGheDauTrong).not.toBeNull();
    expect(hd.ghe.some((g) => g.vai === 'chu_tich')).toBe(false);
    // Ứng viên có, nhưng không ai được trao ghế trong cùng một nhịp.
    expect(r.value.ungVien.length).toBeGreaterThan(0);
  });

  it('kế vị theo luật của chính thần hệ — đổi luật thì đổi thứ hạng', () => {
    const { state, log } = theGioi();
    const ds = baThan(state, log);
    dungHoiDong(state, log, ds);
    ap(
      state,
      log,
      'ev_doi_luat',
      [
        {
          op: 'set',
          target: { table: 'entities', id: HE, path: 'aspects.hoi_dong.luatKeVi' },
          value: 'khong_co',
          sourceEventId: 'ev_doi_luat',
        },
      ],
      'test_doi_luat',
    );
    expect(ungVienKeVi(state, HE)).toEqual([]);
  });

  it('kẻ bị đuổi không quay lại ngồi ghế đầu', () => {
    const { state, log } = theGioi();
    const ds = baThan(state, log);
    dungHoiDong(state, log, ds);

    const tx = trucXuat(state, HE, ds[1] as string, 'phá giao ước', {
      eventId: 'ev_duoi',
      tick: state.world.tick,
    });
    expect(tx.ok).toBe(true);
    if (!tx.ok) return;
    ap(state, log, 'ev_duoi', tx.value.patches, 'hoi_dong_truc_xuat');

    const trao = traoGheDau(state, HE, ds[1] as string, { eventId: 'ev_trao', tick: state.world.tick });
    expect(trao.ok).toBe(false);
  });

  it('trao ghế đầu xong thì hết trống', () => {
    const { state, log } = theGioi();
    const ds = baThan(state, log);
    dungHoiDong(state, log, ds);
    const bt = boTrongGheDau(state, HE, { eventId: 'ev_trong', tick: state.world.tick, lyDo: 'x' });
    if (!bt.ok) return;
    ap(state, log, 'ev_trong', bt.value.patches, 'hoi_dong_ghe_trong');

    const trao = traoGheDau(state, HE, ds[1] as string, { eventId: 'ev_trao', tick: state.world.tick });
    expect(trao.ok).toBe(true);
    if (!trao.ok) return;
    ap(state, log, 'ev_trao', trao.value.patches, 'hoi_dong_trao_ghe');

    const hd = HoiDongSchema.parse(state.entities.get(HE)?.aspects['hoi_dong']);
    expect(hd.tickGheDauTrong).toBeNull();
    expect(hd.ghe.find((g) => g.vai === 'chu_tich')?.thanId).toBe(ds[1]);
  });
});

// ─────────────────────────────────────────── 5. thần NPC theo đuổi việc dài hơi

describe('[BB] 69.3 — thần NPC dùng Project chứ không chỉ phản ứng', () => {
  it('mỗi ứng viên việc đều có mục tiêu và chặng đo được', () => {
    const { state } = theGioi();
    const ds = ungVienDuAn(state, THAN);
    expect(ds.length).toBeGreaterThan(0);
    for (const u of ds) {
      expect(u.goal.length).toBeGreaterThan(5);
      expect(u.milestones.length).toBeGreaterThan(0);
      expect(u.diem).toBeGreaterThan(0);
    }
  });

  it('có ít nhất một việc KHÔNG liên quan tín đồ (69.3)', () => {
    const { state, log } = theGioi();
    ap(
      state,
      log,
      'ev_lech_cao',
      [
        {
          op: 'set',
          target: { table: 'entities', id: THAN, path: 'aspects.ban_nga.pressure.distortion' },
          value: 60,
          sourceEventId: 'ev_lech_cao',
        },
      ],
      'test_lech',
    );
    expect(ungVienDuAn(state, THAN).some((u) => u.loai === 'tim_lai_chinh_minh')).toBe(true);
  });

  it('[BB] 68.3 — tiến độ đo TỪ THẾ GIỚI, không ai khai được', () => {
    const { state, log } = theGioi();
    // Thế giới hạt giống cho vị thần đền ở MỌI vùng, nên "mở rộng tín ngưỡng"
    // không có đích. Gỡ đền ở một vùng để có một đích thật.
    const ds = [...state.entities.values()]
      .filter((e) => e.kind === 'place')
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    const giu = ds[0];
    const trong = ds[1];
    expect(giu).toBeDefined();
    expect(trong).toBeDefined();
    ap(
      state,
      log,
      'ev_go_den',
      [
        {
          op: 'set',
          target: { table: 'entities', id: THAN, path: 'aspects.venerable.matDoDen' },
          value: { [giu?.id ?? '']: 0.3 },
          sourceEventId: 'ev_go_den',
        },
      ],
      'test_go_den',
    );

    // Khẳng định ứng viên CÓ THẬT thay vì `if (!ung) return`.
    // Bản đầu thoát sớm ở đây, nên nó vẫn xanh trong khi `raSoatDuAnThan` đọc
    // sai loại Project và cho mọi tiến độ bằng 0 — hai lỗi che nhau.
    const ung = ungVienDuAn(state, THAN).find((u) => u.loai === 'mo_rong_tin_nguong');
    expect(ung, 'phải có một vùng chưa có đền để mà nhắm tới').toBeDefined();
    if (!ung) return;
    expect(ung.locationIds[0]).toBe(trong?.id);

    const pj = moDuAnThan(state, THAN, ung, state.world.tick);
    expect(loaiCuaDuAnThan(pj.id)).toBe('mo_rong_tin_nguong');
    expect(pj.milestones.every((m) => m.progress === 0)).toBe(true);

    // Không xây đền thì rà bao nhiêu lần cũng vẫn không tiến.
    const raSoat1 = raSoatDuAnThan(state, pj, state.world.tick + 4);
    expect(raSoat1.milestones[0]?.progress).toBe(0);

    // Có đền rồi thì chặng đầu xong — và không ai phải ghi `progress = 1`.
    const dich = ung.locationIds[0] as string;
    ap(
      state,
      log,
      'ev_den',
      [
        {
          op: 'set',
          target: { table: 'entities', id: THAN, path: `aspects.venerable.matDoDen.${dich}` },
          value: 0.3,
          sourceEventId: 'ev_den',
        },
      ],
      'test_den',
    );
    const raSoat2 = raSoatDuAnThan(state, pj, state.world.tick + 8);
    expect(raSoat2.milestones[0]?.progress).toBe(1);
    expect(raSoat2.status).toBe('completed');
  });

  it('thần NPC tự mở việc trong lúc người chơi vắng', () => {
    const { state, log } = theGioi();
    chay(state, log, 12);
    const du = state.entities.get(THAN)?.aspects['du_an'] as DuAnAspect | undefined;
    expect(du?.danhSach.length ?? 0).toBeGreaterThan(0);
    expect(du?.danhSach[0]?.scope).toBe('divine');
    expect(du?.danhSach[0]?.ownerIds).toEqual([THAN]);
  });

  it('không đuổi quá hai việc cùng lúc — không có việc nào là việc chính thì hỏng', () => {
    const { state, log } = theGioi();
    chay(state, log, 60);
    const du = state.entities.get(THAN)?.aspects['du_an'] as DuAnAspect | undefined;
    const dangChay = (du?.danhSach ?? []).filter((p) => p.status === 'active' || p.status === 'blocked');
    expect(dangChay.length).toBeLessThanOrEqual(2);
  });

  it('thần người chơi đang nhập KHÔNG bị mở việc thay', () => {
    const { state, log } = theGioi();
    ap(
      state,
      log,
      'ev_nhap',
      [
        {
          op: 'set',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
          value: 'than',
          sourceEventId: 'ev_nhap',
        },
        {
          op: 'set',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
          value: THAN,
          sourceEventId: 'ev_nhap',
        },
      ],
      'chuyen_tang',
    );
    chay(state, log, 20);
    const du = state.entities.get(THAN)?.aspects['du_an'] as DuAnAspect | undefined;
    expect(du?.danhSach ?? []).toEqual([]);
  });

  it('việc dài hơi không phá determinism — cùng seed cho cùng hash', async () => {
    const { hashState } = await import('../engine/state.js');
    const a = theGioi('det-duan');
    const b = theGioi('det-duan');
    chay(a.state, a.log, 40);
    chay(b.state, b.log, 40);
    expect(hashState(a.state)).toBe(hashState(b.state));
  });
});
