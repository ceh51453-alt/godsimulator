/**
 * Cổng Phase 7 — Tầng Phàm Nhân.
 *
 * Năm dòng cổng của Phần 75, dịch sang thứ kiểm được:
 *
 *   1. "Playtest 30 phút không cần thần can thiệp" → chơi trọn một vòng đời
 *      bằng đúng API mà UI gọi, không chạm tầng Thần lần nào.
 *   2. "Mở một Project nghề nghiệp và một quan hệ" → hai loại Project có thật,
 *      tiến độ đo TỪ THẾ GIỚI.
 *   3. "NPC ngoài cảnh giữ lịch và vị trí" → hỏi lúc nào cũng ra đúng chỗ.
 *   4. "Materialize T0 không bịa nguồn lực" → bảo toàn khi lập/tách/giải thể hộ.
 *   5. "Một đời bình thường có di sản" → chết để lại claim, quan hệ và tiếng tăm.
 *
 * Cộng mười dòng của 73.3.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog, hashState } from '../engine/state.js';
import type { WorldState, EventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { chayInvariantToanBo, datLaiInvariant } from '../engine/invariant.js';
import { motTick } from '../engine/tick.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { napBatBienTangThan } from '../world/batBienThan.js';
import { napBatBienTangPham } from '../world/batBienPham.js';
import { chayTienTrinhNen } from '../world/process/scheduler.js';
import { TUNING_MAC_DINH } from '../tuning/schema.js';
import { chieu } from '../project/chieu.js';
import { vatChatHoa } from '../world/process/phanGiai.js';
import type { Event, PatchOp } from '../contracts/core.js';
import type { Mortal } from '../schema/aspect/living.js';
import type { CanCuoc } from '../schema/aspect/pham.js';
import { ASPECT_IDS_PHAM } from '../registry/aspects.js';
import { WORLD_PROCESS_IDS_PHAM } from '../registry/misc.js';
import { tienTrinhThieuHandler } from '../world/process/index.js';

import { gayThuongTich, troiThanThe, viecKhongLamDuoc, thanTheKeLai, daChet, phamThan } from './thanThe.js';
import {
  canTroLamNghe,
  doiNghe,
  kyNangCuaNghe,
  lamMotNhip,
  sinhKeCua,
  truyenNghe,
  xinHoc,
} from './sinhKe.js';
import {
  lapHo,
  nhapHo,
  nuoiHo,
  tachHo,
  giaiTheHo,
  hoCua,
  hoCuaNguoi,
  nguoiThuaKe,
  chuyenThuaKe,
} from './ho.js';
import { noi, mucHieu, nguoiNgheLon, xuLyLoiHua } from './doiThoai.js';
import { datQuanHe, quanHeCua, nguoiTaQuen } from './quanHe.js';
import { chet, duongDiTiep, anhLinhHoaThan, huyenThoaiHoa, NGUONG_ANH_LINH } from './caiChet.js';
import { lichCua, dangODau, aiDangO, noiOCua } from './lich.js';
import { giangHang, thangHang, hangNenO, KHOA_NEN } from './phanGiaiNguoi.js';
import { dungSoTay, quetSoRo, doTinTheoChang, KHOA_ENGINE_CAM } from './soTay.js';
import { loaiCuaDuAn, moDuAnNguoi, raSoatDuAnNguoi, ungVienDuAnNguoi } from './duAnNguoi.js';
import { rngCuaTick } from '../engine/rng.js';

const TUNING = TUNING_MAC_DINH;
const NGUOI = 'mortal_1';

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
  napBatBienTangThan();
  napBatBienTangPham();
});

function theGioi(seed = 'phase7'): { state: WorldState; log: EventLog } {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  expect(apDungChuoi(state, events, log).ok).toBe(true);
  const ev = eventGieoNen(state);
  expect(apDungEvent(state, ev as Event, log).ok).toBe(true);
  return { state, log };
}

/**
 * Áp một lô patch qua đúng cửa Event.
 *
 * Đóng lại `sourceEventId` theo id của Event vừa dựng: engine đòi mọi patch
 * trong một Event khai cùng nguồn (`PATCH_SAI_NGUON`), còn ở đây ta gọi các hàm
 * lõi với ngữ cảnh riêng của chúng. Đường chạy thật trong `store/game.ts` truyền
 * cùng một `eventId` xuống nên không cần bước này.
 */
function ap(
  state: WorldState,
  log: EventLog,
  id: string,
  patchesTho: readonly PatchOp[],
  loai = 'test',
): void {
  if (patchesTho.length === 0) return;
  const patches = patchesTho.map((p) => ({ ...p, sourceEventId: id }));
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

function chay(state: WorldState, log: EventLog, soTick: number): void {
  for (let i = 0; i < soTick; i++) {
    const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
    for (const ev of r.events) {
      const ok = apDungEvent(state, ev, log);
      expect(ok.ok, ok.ok ? '' : JSON.stringify(ok.errors)).toBe(true);
    }
  }
}

const nc = (state: WorldState, hau = 'x') => ({
  eventId: `ev_${hau}_${state.world.tick}`,
  tick: state.world.tick,
  rng: rngCuaTick(state.world.seed, state.world.tick, hau),
});

/** Rút vài người thật khỏi cohort để có dân số có tên mà thử. */
function themNguoi(state: WorldState, log: EventLog, soNguoi: number, noiId?: string): string[] {
  const noi = noiId ?? [...state.entities.values()].find((e) => e.kind === 'place')?.id;
  expect(noi).toBeDefined();
  const evId = `ev_vch_${state.world.tick}_${soNguoi}`;
  const r = vatChatHoa(state, { noiId: noi as string, soNguoi, eventId: evId, band: 'adult' });
  expect(r.lyDoTuChoi).toBeNull();
  ap(state, log, evId, r.patches, 'vat_chat_hoa');
  // Gieo lại để người mới có `sinh_ke` và `can_cuoc`.
  const ev = eventGieoNen(state, `_sau_vch_${soNguoi}`);
  if (ev) expect(apDungEvent(state, ev, log).ok).toBe(true);
  return [...r.entityIds];
}

// ─────────────────────────────────────────── đăng ký

describe('Phase 7 khai đủ và nối đủ', () => {
  it('ba aspect tầng Phàm Nhân có mặt', () => {
    expect(ASPECT_IDS_PHAM).toEqual(['sinh_ke', 'ho', 'can_cuoc']);
  });

  it('hai tiến trình mới đều có handler — không mục nào `can_adapter`', () => {
    expect(WORLD_PROCESS_IDS_PHAM).toEqual(['mortal_daily', 'household_lifecycle']);
    expect(tienTrinhThieuHandler()).toEqual([]);
  });

  it('gieo nền cấp sinh kế và căn cước cho người có sẵn, không cấp hộ', () => {
    const { state } = theGioi();
    const e = state.entities.get(NGUOI);
    expect(e).toBeDefined();
    expect(sinhKeCua(e)).toBeDefined();
    expect(e?.aspects['can_cuoc']).toBeDefined();
    // Hộ là quyết định của người, không phải dữ liệu gieo sẵn.
    expect(hoCuaNguoi(state, NGUOI)).toBeNull();
  });
});

// ─────────────────────────────────────────── 1. thân thể (70.5)

describe('[BB] 70.5 — sức khỏe không phải thanh máu', () => {
  it('thương tích có vị trí, nguyên nhân và chặn ĐÚNG việc', () => {
    const { state, log } = theGioi();
    const e = state.entities.get(NGUOI);
    expect(e).toBeDefined();

    const r = gayThuongTich(
      e as never,
      { loai: 'gay', viTri: 'chan_trai', nang: 0.7, nguyenNhanEventIds: ['ev_nga_gian_giao'] },
      nc(state, 'tt'),
    );
    ap(state, log, nc(state, 'tt').eventId, r.patches, 'thuong_tich');

    const m = phamThan(state.entities.get(NGUOI));
    const cam = viecKhongLamDuoc(m);
    // Gãy chân chặn ĐI XA và CHẠY, không chặn chế tác.
    expect(cam).toContain('di_xa');
    expect(cam).toContain('chay');
    expect(cam).not.toContain('che_tac');
    // Nguyên nhân là CHUỖI event, không phải một chuỗi ký tự.
    expect(m?.thanThe.thuongTich[0]?.nguyenNhanEventIds).toEqual(['ev_nga_gian_giao']);
    expect(m?.thanThe.thuongTich[0]?.viTri).toBe('chan_trai');
  });

  it('có người chăm thì lành nhanh hơn hẳn', () => {
    const { state, log } = theGioi();
    const e = state.entities.get(NGUOI);
    const r = gayThuongTich(
      e as never,
      { loai: 'rach', viTri: 'tay_phai', nang: 0.6, nguyenNhanEventIds: [] },
      nc(state, 'a'),
    );
    ap(state, log, nc(state, 'a').eventId, r.patches, 'thuong_tich');

    const nangSau = (soBuoc: number, coCham: boolean): number => {
      const ban = JSON.parse(JSON.stringify(state.entities.get(NGUOI))) as never;
      const m = phamThan(ban) as Mortal;
      if (coCham && m.thanThe.thuongTich[0]) m.thanThe.thuongTich[0].nguoiChamId = 'ai_do';
      const kq = troiThanThe(ban, nc(state, 'b'), soBuoc);
      const p = kq.patches.find((x) => x.target.path === 'aspects.mortal.thanThe.thuongTich');
      const ds = (p?.value ?? []) as { nang: number }[];
      return ds[0]?.nang ?? 1;
    };

    expect(nangSau(4, true)).toBeLessThan(nangSau(4, false));
  });

  it('vết không ai chăm có thể biến chứng; vết đã lành thì hết nặng', () => {
    const { state, log } = theGioi();
    const e = state.entities.get(NGUOI);
    const r = gayThuongTich(
      e as never,
      { loai: 'gay', viTri: 'than', nang: 0.9, nguyenNhanEventIds: [] },
      nc(state, 'c'),
    );
    ap(state, log, nc(state, 'c').eventId, r.patches, 'thuong_tich');

    for (let i = 0; i < 40; i++) {
      const cur = state.entities.get(NGUOI);
      const kq = troiThanThe(cur as never, nc(state, `d${i}`), 1);
      ap(state, log, `ev_troi_${i}`, kq.patches, 'troi_than_the');
    }
    const m = phamThan(state.entities.get(NGUOI));
    const t = m?.thanThe.thuongTich[0];
    expect(t).toBeDefined();
    expect(['dang_lanh', 'da_lanh', 'di_chung', 'bien_chung']).toContain(t?.trangThai);
    if (t?.trangThai === 'da_lanh') expect(t.nang).toBe(0);
  });

  it('đói và mệt chặn việc, không chỉ trừ điểm', () => {
    const { state, log } = theGioi();
    ap(
      state,
      log,
      'ev_doi',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.mortal.thanThe.doDoi' },
          value: 90,
          sourceEventId: 'ev_doi',
        },
      ],
      'test_doi',
    );
    const cam = viecKhongLamDuoc(phamThan(state.entities.get(NGUOI)));
    expect(cam).toContain('lam_viec_nang');
    expect(cam).toContain('di_xa');
  });

  it('chết đến từ CHUỖI nguyên nhân, không từ một chuỗi ký tự', () => {
    const { state, log } = theGioi();
    ap(
      state,
      log,
      'ev_kiet',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.mortal.thanThe.doDoi' },
          value: 100,
          sourceEventId: 'ev_kiet',
        },
      ],
      'test_kiet',
    );
    const d = daChet(phamThan(state.entities.get(NGUOI)));
    expect(d.chet).toBe(true);
    expect(Array.isArray(d.chuoiNguyenNhan)).toBe(true);
    expect(d.chuoiNguyenNhan).toContain('doi_qua_lau');

    const r = chet(state, NGUOI, { eventId: 'ev_chet', tick: state.world.tick });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_chet', r.value.patches, 'nguoi_chet');
    const m = phamThan(state.entities.get(NGUOI));
    expect(m?.nguyenNhanChet.length).toBeGreaterThan(0);
    expect(state.entities.get(NGUOI)?.tickDiet).not.toBeNull();
  });

  it('thân thể kể lại bằng câu, không bằng số — 56.2 quy tắc 1', () => {
    const { state, log } = theGioi();
    const e = state.entities.get(NGUOI);
    const r = gayThuongTich(
      e as never,
      { loai: 'gay', viTri: 'chan_trai', nang: 0.8, nguyenNhanEventIds: [] },
      nc(state, 'e'),
    );
    ap(state, log, nc(state, 'e').eventId, r.patches, 'thuong_tich');
    const cau = thanTheKeLai(phamThan(state.entities.get(NGUOI)));
    expect(cau.length).toBeGreaterThan(0);
    for (const c of cau) expect(c).not.toMatch(/\d/);
  });
});

// ─────────────────────────────────────────── 2. sinh kế (70.2)

describe('[BB] 70.2 — sống bằng nghề, học nghề, đổi nghề, truyền nghề', () => {
  it('kỹ năng lên từ việc ĐÃ LÀM, không từ nút bấm', () => {
    const { state, log } = theGioi();
    const kn = () => {
      const m = phamThan(state.entities.get(NGUOI));
      return kyNangCuaNghe(m, sinhKeCua(state.entities.get(NGUOI))?.ngheId ?? null).giaTri;
    };
    const truoc = kn();

    for (let i = 0; i < 6; i++) {
      const e = state.entities.get(NGUOI);
      const r = lamMotNhip(state, e as never, nc(state, `lam${i}`), 1);
      expect(r.lyDoNghi).toBeNull();
      ap(state, log, `ev_lam_${i}`, r.patches, 'lam_viec');
    }
    const sau = kn();
    expect(sau).toBeGreaterThan(truoc);
    expect(sinhKeCua(state.entities.get(NGUOI))?.soNhipDaLam).toBe(6);
  });

  it('gãy tay thì KHÔNG tiến bộ nghề mộc — không phải bị phạt, mà là không có buổi làm', () => {
    const { state, log } = theGioi();
    ap(
      state,
      log,
      'ev_moc',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.sinh_ke.ngheId' },
          value: 'nghe_moc',
          sourceEventId: 'ev_moc',
        },
      ],
      'test_nghe',
    );
    const e0 = state.entities.get(NGUOI);
    expect(canTroLamNghe(e0 as never, 'nghe_moc')).toBeNull();

    const r = gayThuongTich(
      e0 as never,
      { loai: 'gay', viTri: 'tay_phai', nang: 0.8, nguyenNhanEventIds: [] },
      nc(state, 'f'),
    );
    ap(state, log, nc(state, 'f').eventId, r.patches, 'thuong_tich');

    const e1 = state.entities.get(NGUOI);
    expect(canTroLamNghe(e1 as never, 'nghe_moc')).toBe('Tay chưa làm được việc tinh.');
    const lam = lamMotNhip(state, e1 as never, nc(state, 'g'), 1);
    expect(lam.patches).toEqual([]);
    expect(lam.sanLuong).toBe(0);
  });

  it('thợ chưa đủ bậc thì không ai học của họ', () => {
    const { state, log } = theGioi();
    const [tro] = themNguoi(state, log, 1);
    expect(tro).toBeDefined();
    // Hạ bậc thầy xuống thợ bạn — dưới ngưỡng `tho_ca` mà `xinHoc` đòi.
    ap(
      state,
      log,
      'ev_ha_bac',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.sinh_ke.bac' },
          value: 'tho_ban',
          sourceEventId: 'ev_ha_bac',
        },
      ],
      'test_ha_bac',
    );
    const r = xinHoc(state, tro as string, NGUOI, nc(state, 'h'));
    expect(r.ok).toBe(false);
  });

  it('đủ bậc thì nhận trò, và truyền nghề để lại tiếng tăm cho CẢ HAI', () => {
    const { state, log } = theGioi();
    const [tro] = themNguoi(state, log, 1);
    expect(tro).toBeDefined();

    // Cho thầy đủ tay nghề — qua Event, không sửa state tay.
    ap(
      state,
      log,
      'ev_gioi',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.mortal.kyNang.nghe_chinh' },
          value: 70,
          sourceEventId: 'ev_gioi',
        },
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.sinh_ke.bac' },
          value: 'tho_ca',
          sourceEventId: 'ev_gioi',
        },
      ],
      'test_bac',
    );

    const xh = xinHoc(state, tro as string, NGUOI, nc(state, 'i'));
    expect(xh.ok, xh.ok ? '' : JSON.stringify(xh.errors)).toBe(true);
    if (!xh.ok) return;
    ap(state, log, 'ev_xin_hoc', xh.value.patches, 'nhan_hoc_tro');
    expect(sinhKeCua(state.entities.get(tro as string))?.thayId).toBe(NGUOI);

    // Trò chưa đủ tay nghề thì chưa ra nghề được.
    expect(truyenNghe(state, NGUOI, tro as string, nc(state, 'j')).ok).toBe(false);

    ap(
      state,
      log,
      'ev_tro_gioi',
      [
        {
          op: 'set',
          target: { table: 'entities', id: tro as string, path: 'aspects.mortal.kyNang.nghe_chinh' },
          value: 40,
          sourceEventId: 'ev_tro_gioi',
        },
      ],
      'test_tro',
    );
    const tn = truyenNghe(state, NGUOI, tro as string, nc(state, 'k'));
    expect(tn.ok, tn.ok ? '' : JSON.stringify(tn.errors)).toBe(true);
    if (!tn.ok) return;
    ap(state, log, 'ev_truyen', tn.value.patches, 'truyen_nghe');

    const ccThay = state.entities.get(NGUOI)?.aspects['can_cuoc'] as CanCuoc;
    expect(ccThay.tiengTam.some((t) => t.startsWith('Đã truyền nghề'))).toBe(true);
    expect(ccThay.duocNhoBoi).toBeGreaterThan(0);
    expect(sinhKeCua(state.entities.get(tro as string))?.thayId).toBeNull();
  });

  it('đổi nghề mất tay nghề; quay lại nghề cũ thì còn nhớ ít nhiều', () => {
    const { state, log } = theGioi();
    ap(
      state,
      log,
      'ev_set',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.mortal.kyNang.nghe_chinh' },
          value: 60,
          sourceEventId: 'ev_set',
        },
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.sinh_ke.ngheId' },
          value: 'nghe_gom',
          sourceEventId: 'ev_set',
        },
      ],
      'test_set',
    );

    const d1 = doiNghe(state, NGUOI, 'nghe_moc', null, nc(state, 'l'));
    expect(d1.ok).toBe(true);
    if (!d1.ok) return;
    ap(state, log, 'ev_doi_1', d1.value.patches, 'doi_nghe');
    expect(phamThan(state.entities.get(NGUOI))?.kyNang['nghe_chinh']).toBe(5);

    ap(
      state,
      log,
      'ev_set2',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.mortal.kyNang.nghe_chinh' },
          value: 50,
          sourceEventId: 'ev_set2',
        },
      ],
      'test_set2',
    );
    const d2 = doiNghe(state, NGUOI, 'nghe_gom', null, nc(state, 'm'));
    expect(d2.ok).toBe(true);
    if (!d2.ok) return;
    ap(state, log, 'ev_doi_2', d2.value.patches, 'doi_nghe');
    // Quay lại nghề cũ giữ một phần, không về 5.
    expect(phamThan(state.entities.get(NGUOI))?.kyNang['nghe_chinh']).toBeGreaterThan(5);
  });
});

// ─────────────────────────────────────────── 3. hộ (70.2)

describe('[BB] 70.2 — hộ: ăn chung nghĩa là đói chung', () => {
  function lap(state: WorldState, log: EventLog, chuId: string, them: string[] = []): string {
    const noiO = noiOCua(state, chuId);
    expect(noiO).not.toBeNull();
    const r = lapHo(
      state,
      { chuHoId: chuId, thanhVien: them.map((id) => ({ id, vai: 'con' as const })), noiOId: noiO as string },
      { eventId: `ev_lap_${chuId}`, tick: state.world.tick },
    );
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
    if (!r.ok) throw new Error('không lập được hộ');
    ap(state, log, `ev_lap_${chuId}`, r.value.patches, 'lap_ho');
    return r.value.hoId;
  }

  it('hộ mới có kho RỖNG — không materialize của cải từ hư không', () => {
    const { state, log } = theGioi();
    const hoId = lap(state, log, NGUOI);
    expect(hoCua(state.entities.get(hoId))?.kho.luongThuc).toBe(0);
    expect(hoCua(state.entities.get(hoId))?.kho.vatLieu).toBe(0);
  });

  it('kho hộ hết thì CẢ NHÀ đói, không riêng ai', () => {
    const { state, log } = theGioi();
    const them = themNguoi(state, log, 2);
    const hoId = lap(state, log, NGUOI, them);

    const r = nuoiHo(state, hoId, { eventId: 'ev_nuoi', tick: state.world.tick }, 1);
    ap(state, log, 'ev_nuoi', r.patches, 'nuoi_ho');
    expect(r.thieu).toBeGreaterThan(0);

    for (const id of [NGUOI, ...them]) {
      expect(phamThan(state.entities.get(id))?.thanThe.doDoi ?? 0).toBeGreaterThan(0);
    }
  });

  it('tách hộ CHIA của cải, không nhân đôi', () => {
    const { state, log } = theGioi();
    const them = themNguoi(state, log, 1);
    const con = them[0] as string;
    const hoId = lap(state, log, NGUOI, [con]);

    ap(
      state,
      log,
      'ev_kho',
      [
        {
          op: 'set',
          target: { table: 'entities', id: hoId, path: 'aspects.ho.kho.luongThuc' },
          value: 100,
          sourceEventId: 'ev_kho',
        },
      ],
      'test_kho',
    );

    const r = tachHo(state, hoId, con, { eventId: 'ev_tach', tick: state.world.tick });
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_tach', r.value.patches, 'tach_ho');

    const goc = hoCua(state.entities.get(hoId))?.kho.luongThuc ?? 0;
    const moi = hoCua(state.entities.get(r.value.hoMoiId))?.kho.luongThuc ?? 0;
    expect(Math.round(goc + moi)).toBe(100);
    expect(moi).toBeGreaterThan(0);
  });

  it('hộ tan thì kho về VÙNG, không bốc hơi', () => {
    const { state, log } = theGioi();
    const hoId = lap(state, log, NGUOI);
    const noiO = hoCua(state.entities.get(hoId))?.noiOId as string;

    ap(
      state,
      log,
      'ev_kho2',
      [
        {
          op: 'set',
          target: { table: 'entities', id: hoId, path: 'aspects.ho.kho.luongThuc' },
          value: 40,
          sourceEventId: 'ev_kho2',
        },
      ],
      'test_kho',
    );
    const truoc = (state.entities.get(noiO)?.aspects['kinh_te'] as { kho: { luongThuc: number } }).kho
      .luongThuc;

    // Người duy nhất trong nhà chết → nhà tan.
    ap(
      state,
      log,
      'ev_chet_het',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'tickDiet' },
          value: 1,
          sourceEventId: 'ev_chet_het',
        },
      ],
      'test_chet',
    );
    const tan = giaiTheHo(state, hoId, { eventId: 'ev_tan', tick: state.world.tick });
    ap(state, log, 'ev_tan', tan, 'ho_tan');

    const sau = (state.entities.get(noiO)?.aspects['kinh_te'] as { kho: { luongThuc: number } }).kho
      .luongThuc;
    expect(Math.round(sau - truoc)).toBe(40);
    expect(hoCua(state.entities.get(hoId))?.tickTan).not.toBeNull();
  });

  it('nhập hộ thì rời hộ cũ — không ai ở hai nhà cùng lúc', () => {
    const { state, log } = theGioi();
    const them = themNguoi(state, log, 1);
    const ai = them[0] as string;
    const hoA = lap(state, log, NGUOI);
    const hoB = lap(state, log, ai);

    const r = nhapHo(state, ai, hoA, 'ban_doi', { eventId: 'ev_nhap', tick: state.world.tick });
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_nhap', r.value.patches, 'nhap_ho');

    expect(hoCuaNguoi(state, ai)?.id).toBe(hoA);
    expect(hoCua(state.entities.get(hoB))?.thanhVien.some((t) => t.id === ai)).toBe(false);
  });
});

// ─────────────────────────────────────────── 4. đối thoại (70.4)

describe('[BB] 70.4 — đối thoại cũng là hành động', () => {
  it('nói một điều CÓ HẬU QUẢ sinh tri thức, quan hệ và nghĩa vụ', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    expect(b).toBeDefined();

    const r = noi(
      state,
      {
        nguoiNoiId: NGUOI,
        nguoiNgheId: b as string,
        loai: 'loi_hua',
        noiDung: 'Ta sẽ trả cho ngươi ba đấu lúa trước mùa gặt.',
        dieuNguoiNoiTin: 'Ta sẽ trả.',
        dieuMuonNguoiNgheTin: 'Ta sẽ trả.',
        noiId: noiOCua(state, NGUOI),
      },
      nc(state, 'n'),
    );
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
    if (!r.ok) return;
    ap(state, log, nc(state, 'n').eventId, r.value.patches, 'doi_thoai');

    // 1. tri thức có nguồn và số chặng — bất biến "không teleport" truy được.
    const dong = [...state.knowledge.values()].find((k) => k.knowerId === b && k.factId === r.value.factId);
    expect(dong).toBeDefined();
    expect(dong?.source.type).toBe('told');
    expect(dong?.source.sourceId).toBe(NGUOI);
    expect(dong?.source.hops).toBe(1);

    // 2. quan hệ đổi, và nó là CÂU chứ không phải bốn trục.
    const qh = quanHeCua(state, b as string, NGUOI);
    expect(qh.anTuong).not.toBe('');

    // 3. lời hứa để lại nghĩa vụ.
    const bv = phamThan(state.entities.get(NGUOI))?.boiVu ?? [];
    expect(bv.length).toBe(1);
    expect(bv[0]?.toId).toBe(b);
    expect(bv[0]?.status).toBe('active');
  });

  it('nói dối là DỮ LIỆU: người nghe nhận điều người nói muốn họ tin', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    const r = noi(
      state,
      {
        nguoiNoiId: NGUOI,
        nguoiNgheId: b as string,
        loai: 'tin_moi',
        noiDung: '…',
        dieuNguoiNoiTin: 'Kho nhà ta còn đầy.',
        dieuMuonNguoiNgheTin: 'Kho nhà ta đã cạn.',
        noiId: noiOCua(state, NGUOI),
      },
      nc(state, 'o'),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.laNoiDoi).toBe(true);
    ap(state, log, nc(state, 'o').eventId, r.value.patches, 'doi_thoai');

    const dong = [...state.knowledge.values()].find((k) => k.knowerId === b);
    expect(dong?.proposition).toBe('Kho nhà ta đã cạn.');
  });

  it('trẻ con hiểu ít hơn người lớn — mức hiểu không mặc định 100%', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    const pn = {
      nguoiNoiId: NGUOI,
      nguoiNgheId: b as string,
      loai: 'giao_keo' as const,
      noiDung: '…',
      dieuNguoiNoiTin: 'x',
      dieuMuonNguoiNgheTin: 'x',
      noiId: noiOCua(state, NGUOI),
    };
    const nguoiLon = mucHieu(state, pn);
    ap(
      state,
      log,
      'ev_tre',
      [
        {
          op: 'set',
          target: { table: 'entities', id: b as string, path: 'aspects.mortal.ageBand' },
          value: 'child',
          sourceEventId: 'ev_tre',
        },
      ],
      'test_tre',
    );
    expect(mucHieu(state, pn)).toBeLessThan(nguoiLon);
  });

  it('nghe lỏm suy từ AI ĐANG Ở ĐÓ, không từ một tung xúc xắc', () => {
    const { state, log } = theGioi();
    const them = themNguoi(state, log, 3);
    const noiId = noiOCua(state, NGUOI);
    const ds = nguoiNgheLon(state, {
      nguoiNoiId: NGUOI,
      nguoiNgheId: them[0] as string,
      loai: 'thu_nhan',
      noiDung: '',
      dieuNguoiNoiTin: '',
      dieuMuonNguoiNgheTin: '',
      noiId,
    });
    // Hai người còn lại ở cùng vùng đều nghe được; người nói và người nghe không tính.
    expect(ds).not.toContain(NGUOI);
    expect(ds).not.toContain(them[0]);
    expect(ds.length).toBeGreaterThanOrEqual(2);
  });

  it('phá lời hứa KHÔNG xóa nghĩa vụ — nó để lại sẹo', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    const r = noi(
      state,
      {
        nguoiNoiId: NGUOI,
        nguoiNgheId: b as string,
        loai: 'loi_hua',
        noiDung: 'Ta sẽ về trước mùa mưa.',
        dieuNguoiNoiTin: 'x',
        dieuMuonNguoiNgheTin: 'x',
        noiId: noiOCua(state, NGUOI),
      },
      nc(state, 'p'),
    );
    if (!r.ok) return;
    ap(state, log, nc(state, 'p').eventId, r.value.patches, 'doi_thoai');

    const bvId = (phamThan(state.entities.get(NGUOI))?.boiVu ?? [])[0]?.id as string;
    const pha = xuLyLoiHua(state, NGUOI, bvId, false, nc(state, 'q'));
    expect(pha.ok).toBe(true);
    if (!pha.ok) return;
    ap(state, log, 'ev_pha', pha.value.patches, 'pha_loi_hua');

    const bv = phamThan(state.entities.get(NGUOI))?.boiVu ?? [];
    expect(bv.length).toBe(1);
    expect(bv[0]?.status).toBe('broken');
    expect(quanHeCua(state, b as string, NGUOI).anTuong).toContain('không làm');
    const cc = state.entities.get(NGUOI)?.aspects['can_cuoc'] as CanCuoc;
    expect(cc.tiengTam.some((t) => t.includes('phá một lời hứa'))).toBe(true);
  });

  it('[BB] 11.2 — quan hệ bất đối xứng, không ai đồng bộ hai chiều', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    ap(
      state,
      log,
      'ev_qh',
      datQuanHe(state, NGUOI, b as string, { cong: { yeuGhet: 40 }, anTuong: 'Ta quý người này.' }, 'ev_qh'),
      'quan_he',
    );
    expect(quanHeCua(state, NGUOI, b as string).yeuGhet).toBe(40);
    // Chiều ngược lại KHÔNG bị đụng tới.
    expect(quanHeCua(state, b as string, NGUOI).yeuGhet).toBe(0);
    expect(nguoiTaQuen(state, NGUOI).map((x) => x.id)).toContain(b);
  });
});

// ─────────────────────────────────────────── 5. lịch (cổng: NPC ngoài cảnh)

describe('cổng Phase 7 — NPC ngoài cảnh giữ lịch và vị trí', () => {
  it('lịch là HÀM THUẦN: hỏi bao nhiêu lần cũng ra cùng một câu trả lời', () => {
    const { state, log } = theGioi();
    themNguoi(state, log, 2);
    const a = lichCua(state, NGUOI);
    const b = lichCua(state, NGUOI);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.length).toBeGreaterThan(0);
  });

  it('NPC không ai nhìn suốt bốn mươi nhịp vẫn ở đúng chỗ và đang làm việc', () => {
    const { state, log } = theGioi();
    const them = themNguoi(state, log, 2);
    const ai = them[0] as string;
    const noiTruoc = dangODau(state, ai, 0.5);
    expect(noiTruoc.noiId).not.toBeNull();

    chay(state, log, 40);

    const con = state.entities.get(ai);
    if (!con || con.tickDiet !== null) return; // chết thì không còn lịch, và đó là đúng
    const noiSau = dangODau(state, ai, 0.5);
    expect(noiSau.noiId).toBe(noiTruoc.noiId);
    expect(noiSau.viec).not.toBe('');
  });

  it('người ốm nặng thì lịch đổi thành nằm, không còn khối làm', () => {
    const { state, log } = theGioi();
    const e = state.entities.get(NGUOI);
    const r = gayThuongTich(
      e as never,
      { loai: 'benh', viTri: 'trong', nang: 0.8, nguyenNhanEventIds: [] },
      nc(state, 'r'),
    );
    ap(state, log, nc(state, 'r').eventId, r.patches, 'thuong_tich');
    const viec = lichCua(state, NGUOI).map((b) => b.activity);
    expect(viec).toContain('nam_benh');
    expect(viec.some((v) => v.startsWith('lam_'))).toBe(false);
  });

  it('ai đang ở một nơi suy từ lịch, không từ danh sách cư dân', () => {
    const { state, log } = theGioi();
    themNguoi(state, log, 2);
    const noiId = noiOCua(state, NGUOI) as string;
    // Lúc nửa đêm mọi người ở nhà/vùng; giữa buổi thì ở nơi làm.
    const dem = aiDangO(state, noiId, 0.1).length;
    const trua = aiDangO(state, noiId, 0.5).length;
    expect(dem + trua).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────── 6. phân giải (70.3)

describe('[BB] 70.3 — giáng hạng giảm độ phân giải, KHÔNG xóa đời sống', () => {
  it('giáng hạng giữ ba quan hệ mạnh nhất và NÉN phần còn lại có đường khôi phục', () => {
    const { state, log } = theGioi();
    const them = themNguoi(state, log, 5);
    const patches: PatchOp[] = [
      {
        op: 'set',
        target: { table: 'entities', id: NGUOI, path: 'aspects.soul.tang' },
        value: 't2',
        sourceEventId: 'ev_qh_nhieu',
      },
    ];
    them.forEach((id, i) => {
      patches.push(
        ...datQuanHe(
          state,
          NGUOI,
          id,
          { cong: { thanSo: 90 - i * 15 }, anTuong: `quen ${i}` },
          'ev_qh_nhieu',
        ),
      );
    });
    ap(state, log, 'ev_qh_nhieu', patches, 'quan_he');

    const g = giangHang(state, NGUOI, { eventId: 'ev_giang', tick: state.world.tick });
    expect(g.ok, g.ok ? '' : JSON.stringify(g.errors)).toBe(true);
    if (!g.ok) return;
    ap(state, log, 'ev_giang', g.value.patches, 'giang_hang');
    expect(g.value.soNen).toBeGreaterThan(0);

    const soul = state.entities.get(NGUOI)?.aspects['soul'] as {
      tang: string;
      quanHe: Record<string, unknown>;
    };
    expect(soul.tang).toBe('t1');
    const giu = Object.keys(soul.quanHe).filter((k) => k !== KHOA_NEN);
    expect(giu.length).toBe(3);
    expect(soul.quanHe[KHOA_NEN]).toBeDefined();

    // Thăng lại: mở đúng danh sách đã nén — nén là mất CHI TIẾT, không mất người.
    const t = thangHang(state, NGUOI, { eventId: 'ev_thang', tick: state.world.tick });
    expect(t.ok).toBe(true);
    if (!t.ok) return;
    ap(state, log, 'ev_thang', t.value.patches, 'thang_hang');
    expect(t.value.soMoLai).toBe(g.value.soNen);

    const sau = state.entities.get(NGUOI)?.aspects['soul'] as { quanHe: Record<string, unknown> };
    for (const id of them) expect(sau.quanHe[id]).toBeDefined();
  });

  it('chính sách hạng suy từ khoảng cách tới ống kính', () => {
    expect(hangNenO(null, true, 2)).toBe('t3');
    expect(hangNenO(0, false, 2)).toBe('t2');
    expect(hangNenO(2, false, 2)).toBe('t2');
    expect(hangNenO(5, false, 2)).toBe('t1');
    expect(hangNenO(null, false, 2)).toBe('t1');
  });

  it('materialize không bịa nguồn lực — người mới nghèo đúng như vùng', () => {
    const { state, log } = theGioi();
    const ids = themNguoi(state, log, 3);
    for (const id of ids) {
      const m = phamThan(state.entities.get(id));
      expect(m?.soHuu ?? []).toEqual([]);
      expect(m?.kyNang['nghe_chinh'] ?? 0).toBeLessThanOrEqual(100);
    }
  });
});

// ─────────────────────────────────────────── 7. chết và ba đường (20.3)

describe('[BB] 20.3 — chết không Game Over', () => {
  it('thừa kế chia claim đúng, không nhân đôi', () => {
    const { state, log } = theGioi();
    const con = themNguoi(state, log, 2);
    ap(
      state,
      log,
      'ev_gia_dinh',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.genealogical.conIds' },
          value: con,
          sourceEventId: 'ev_gia_dinh',
        },
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.mortal.soHuu' },
          value: [
            {
              id: 'cl_nha',
              targetId: 'vat_nha',
              kind: 'nha',
              share: 1,
              basis: 'tự dựng',
              status: 'recognized',
            },
          ],
          sourceEventId: 'ev_gia_dinh',
        },
      ],
      'test_gd',
    );

    expect(
      nguoiThuaKe(state, NGUOI)
        .map((x) => x.nguoiId)
        .sort(),
    ).toEqual([...con].sort());

    const r = chuyenThuaKe(state, NGUOI, { eventId: 'ev_tk', tick: state.world.tick });
    ap(state, log, 'ev_tk', r.patches, 'thua_ke');

    let tong = 0;
    for (const id of con) {
      const ds = phamThan(state.entities.get(id))?.soHuu ?? [];
      expect(ds.length).toBe(1);
      // Chia đôi thì mỗi người nửa cái nhà, không phải mỗi người một cái nhà.
      expect(ds[0]?.status).toBe('disputed');
      tong += ds[0]?.share ?? 0;
    }
    expect(Math.round(tong * 100) / 100).toBe(1);
    expect(phamThan(state.entities.get(NGUOI))?.soHuu ?? []).toEqual([]);
    expect(chayInvariantToanBo(state).dat).toBe(true);
  });

  it('luôn có ít nhất đường CHỨNG KIẾN khi thế giới còn người', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    ap(
      state,
      log,
      'ev_quen',
      datQuanHe(state, NGUOI, b as string, { anTuong: 'bạn cũ', cong: { thanSo: 40 } }, 'ev_quen'),
      'quan_he',
    );

    const r = chet(state, NGUOI, { eventId: 'ev_chet', tick: state.world.tick });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_chet', r.value.patches, 'nguoi_chet');

    const ds = duongDiTiep(state, NGUOI);
    expect(ds.length).toBeGreaterThan(0);
    expect(ds.some((x) => x.duong === 'chung_kien')).toBe(true);
  });

  it('anh linh hóa thần THÊM aspect, giữ nguyên hồn và quan hệ', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    ap(
      state,
      log,
      'ev_nho',
      [
        ...datQuanHe(state, NGUOI, b as string, { anTuong: 'bạn cũ' }, 'ev_nho'),
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.can_cuoc.duocNhoBoi' },
          value: NGUONG_ANH_LINH + 10,
          sourceEventId: 'ev_nho',
        },
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.can_cuoc.tiengTam' },
          value: ['Người giữ nước cho cả làng qua mùa khô'],
          sourceEventId: 'ev_nho',
        },
      ],
      'test_nho',
    );

    const soulTruoc = JSON.stringify(state.entities.get(NGUOI)?.aspects['soul']);
    expect(duongDiTiep(state, NGUOI).some((x) => x.duong === 'anh_linh')).toBe(false); // chưa chết

    const c = chet(state, NGUOI, { eventId: 'ev_chet', tick: state.world.tick });
    if (!c.ok) return;
    ap(state, log, 'ev_chet', c.value.patches, 'nguoi_chet');
    expect(duongDiTiep(state, NGUOI).some((x) => x.duong === 'anh_linh')).toBe(true);

    const r = anhLinhHoaThan(state, NGUOI, { eventId: 'ev_anh_linh', tick: state.world.tick });
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
    if (!r.ok) return;
    ap(state, log, 'ev_anh_linh', r.value.patches, 'anh_linh_hoa_than');

    const e = state.entities.get(NGUOI);
    expect(e?.kind).toBe('deity');
    expect(e?.tickDiet).toBeNull();
    expect(e?.aspects['domain']).toBeDefined();
    expect(e?.aspects['venerable']).toBeDefined();
    // [BB] Hồn và quan hệ KHÔNG bị đụng tới.
    expect(JSON.stringify(e?.aspects['soul'])).toBe(soulTruoc);
    expect(quanHeCua(state, NGUOI, b as string).anTuong).toBe('bạn cũ');
  });

  it('người sinh sau khi ta mất chỉ biết ta như huyền thoại', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    ap(state, log, 'ev_q', datQuanHe(state, b as string, NGUOI, { anTuong: 'x' }, 'ev_q'), 'quan_he');

    const c = chet(state, NGUOI, { eventId: 'ev_chet', tick: state.world.tick });
    if (!c.ok) return;
    ap(state, log, 'ev_chet', c.value.patches, 'nguoi_chet');

    // `b` sinh ở tick hiện tại (vừa materialize), tức KHÔNG sinh trước khi NGUOI mất.
    const p = huyenThoaiHoa(state, NGUOI, { eventId: 'ev_ht', tick: state.world.tick });
    ap(state, log, 'ev_ht', p, 'huyen_thoai_hoa');
    expect(quanHeCua(state, b as string, NGUOI).laHuyenThoai).toBe(true);
  });

  it('một đời BÌNH THƯỜNG vẫn để lại event, quan hệ và di sản', () => {
    const { state, log } = theGioi();
    const [tro] = themNguoi(state, log, 1);
    const soEventDau = log.soLuong();

    // Không làm gì phi thường: làm nghề, nhận một học trò, rồi chết.
    ap(
      state,
      log,
      'ev_gioi',
      [
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.mortal.kyNang.nghe_chinh' },
          value: 70,
          sourceEventId: 'ev_gioi',
        },
        {
          op: 'set',
          target: { table: 'entities', id: NGUOI, path: 'aspects.sinh_ke.bac' },
          value: 'tho_ca',
          sourceEventId: 'ev_gioi',
        },
      ],
      'test_bac',
    );
    const xh = xinHoc(state, tro as string, NGUOI, nc(state, 's'));
    if (xh.ok) ap(state, log, 'ev_hoc', xh.value.patches, 'nhan_hoc_tro');
    chay(state, log, 10);
    const c = chet(state, NGUOI, { eventId: 'ev_chet_cuoi', tick: state.world.tick });
    if (c.ok) ap(state, log, 'ev_chet_cuoi', c.value.patches, 'nguoi_chet');

    // Di sản: có event, có người còn nhớ, và có một học trò mang nghề đi tiếp.
    expect(log.soLuong()).toBeGreaterThan(soEventDau);
    expect(sinhKeCua(state.entities.get(tro as string))?.ngheId).not.toBeNull();
    expect(duongDiTiep(state, NGUOI).length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────── 8. Project (cổng: nghề + quan hệ)

describe('cổng Phase 7 — mở một Project nghề nghiệp và một quan hệ', () => {
  it('có cả hai loại ứng viên, mỗi cái có chặng đo được', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    ap(
      state,
      log,
      'ev_cai_nhau',
      datQuanHe(state, NGUOI, b as string, { cong: { tinNgo: -40, yeuGhet: -20 } }, 'ev_cai_nhau'),
      'quan_he',
    );

    // `mortal_1` của fixture đã là thợ cả, nên "ra nghề" không còn là việc của
    // họ. Người vừa bước ra khỏi đám đông thì có — và đó mới là trường hợp thật.
    const dsMoi = ungVienDuAnNguoi(state, b as string);
    expect(dsMoi.some((u) => u.loai === 'ra_nghe')).toBe(true);

    const ds = ungVienDuAnNguoi(state, NGUOI);
    expect(ds.some((u) => u.loai === 'gan_lai')).toBe(true);
    for (const u of [...ds, ...dsMoi]) expect(u.milestones.length).toBe(2);
  });

  it('loại Project đọc được kể cả khi id chứa nhiều gạch dưới', () => {
    // Đây là chỗ bản Phase 6b đọc sai và im lặng cho tiến độ bằng 0 mãi mãi.
    expect(loaiCuaDuAn('pj_nguoi_nguoi_place_a_0_1_ra_nghe_4')).toBe('ra_nghe');
    expect(loaiCuaDuAn('pj_nguoi_mortal_1_gan_lai_9')).toBe('gan_lai');
    expect(loaiCuaDuAn('pj_nguoi_x_khong_co_loai_1')).toBeNull();
  });

  it('[BB] 68.3 — tiến độ nghề đo TỪ THẾ GIỚI, không ai khai được', () => {
    const { state, log } = theGioi();
    const [ai] = themNguoi(state, log, 1);
    expect(ai).toBeDefined();
    const ung = ungVienDuAnNguoi(state, ai as string).find((u) => u.loai === 'ra_nghe');
    expect(ung, 'người có nghề mà chưa lên thợ cả thì phải có việc này').toBeDefined();
    if (!ung) return;

    const pj = moDuAnNguoi(state, ai as string, ung, state.world.tick);
    expect(pj.scope).toBe('personal');
    expect(pj.milestones.every((m) => m.progress === 0)).toBe(true);

    // Không làm gì thì rà bao nhiêu lần cũng không tiến.
    expect(raSoatDuAnNguoi(state, pj, state.world.tick + 2).milestones[0]?.progress).toBe(0);

    // Làm mười nhịp thì chặng đầu xong — không ai ghi `progress = 1`.
    for (let i = 0; i < 10; i++) {
      const e = state.entities.get(ai as string);
      const r = lamMotNhip(state, e as never, nc(state, `w${i}`), 1);
      expect(r.lyDoNghi).toBeNull();
      ap(state, log, `ev_lam2_${i}`, r.patches, 'lam_viec');
    }
    expect(raSoatDuAnNguoi(state, pj, state.world.tick + 4).milestones[0]?.progress).toBe(1);
  });

  it('Project quan hệ tiến khi bên kia tin lại', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    ap(
      state,
      log,
      'ev_xau',
      datQuanHe(state, NGUOI, b as string, { cong: { tinNgo: -40 } }, 'ev_xau'),
      'quan_he',
    );
    const ung = ungVienDuAnNguoi(state, NGUOI).find((u) => u.loai === 'gan_lai');
    expect(ung).toBeDefined();
    if (!ung) return;

    const pj = moDuAnNguoi(state, NGUOI, ung, state.world.tick);
    const truoc = raSoatDuAnNguoi(state, pj, state.world.tick + 2).milestones[1]?.progress ?? 0;

    ap(
      state,
      log,
      'ev_tin_lai',
      datQuanHe(
        state,
        b as string,
        NGUOI,
        { cong: { tinNgo: 30 }, anTuong: 'người ấy quay lại' },
        'ev_tin_lai',
      ),
      'quan_he',
    );
    const sau = raSoatDuAnNguoi(state, pj, state.world.tick + 4).milestones[1]?.progress ?? 0;
    expect(sau).toBeGreaterThan(truoc);
  });

  it('NPC tự mở việc dài hơi khi người chơi vắng', () => {
    const { state, log } = theGioi();
    themNguoi(state, log, 2);
    chay(state, log, 8);
    const du = state.entities.get(NGUOI)?.aspects['du_an'] as { danhSach?: unknown[] } | undefined;
    expect((du?.danhSach ?? []).length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────── 9. Sổ Tay (56.1, 56.2)

describe('[BB] 56.1 — Sổ Tay không lộ số engine', () => {
  function soTayCua(state: WorldState, id: string) {
    const view = chieu(state, 'pham_nhan', id);
    return dungSoTay({
      view,
      triThuc: [...state.knowledge.values()].filter((k) => k.knowerId === id),
      viecDangLam: dangODau(state, id).viec,
      nghiThucVoIch: [{ ten: 'Lễ Tẩy Tro', soLan: 9 }],
    });
  }

  it('không khóa engine nào lọt vào trang giấy', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    ap(
      state,
      log,
      'ev_qh_st',
      datQuanHe(
        state,
        NGUOI,
        b as string,
        { anTuong: 'nàng nghĩ ta giấu chuyện gì đó', xungHo: 'vợ' },
        'ev_qh_st',
      ),
      'quan_he',
    );
    const r = gayThuongTich(
      state.entities.get(NGUOI) as never,
      { loai: 'gay', viTri: 'chan_trai', nang: 0.5, nguyenNhanEventIds: [] },
      nc(state, 't'),
    );
    ap(state, log, nc(state, 't').eventId, r.patches, 'thuong_tich');

    const so = soTayCua(state, NGUOI);
    expect(quetSoRo(so)).toEqual([]);
    expect(KHOA_ENGINE_CAM.length).toBeGreaterThan(10);
  });

  it('quan hệ ghi bằng `anTuong`, không bằng bốn trục — quy tắc 4', () => {
    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    ap(
      state,
      log,
      'ev_qh_st2',
      datQuanHe(
        state,
        NGUOI,
        b as string,
        { anTuong: 'ta nợ hắn một mạng', cong: { noOn: 80 } },
        'ev_qh_st2',
      ),
      'quan_he',
    );
    const so = soTayCua(state, NGUOI);
    expect(so.quen.some((q) => q.anTuong === 'ta nợ hắn một mạng')).toBe(true);
    expect(JSON.stringify(so.quen)).not.toContain('80');
  });

  it('nghi thức vô ích hiện đúng câu của 56.1 — quy tắc 2', () => {
    const { state } = theGioi();
    const so = soTayCua(state, NGUOI);
    expect(so.tin.some((c) => c.includes('Lễ Tẩy Tro') && c.includes('Chưa lần nào thấy khác đi'))).toBe(
      true,
    );
  });

  it('tin đồn kèm độ tin lấy từ số chặng — quy tắc 3', () => {
    expect(doTinTheoChang(0, '')).toBe('ta thấy tận mắt');
    expect(doTinTheoChang(3, '')).toBe('nghe qua ba miệng');
    expect(doTinTheoChang(9, '')).toBe('không rõ từ đâu');

    const { state, log } = theGioi();
    const [b] = themNguoi(state, log, 1);
    const r = noi(
      state,
      {
        nguoiNoiId: b as string,
        nguoiNgheId: NGUOI,
        loai: 'tin_moi',
        noiDung: '',
        dieuNguoiNoiTin: 'Có thứ trắng sống dưới nước đen.',
        dieuMuonNguoiNgheTin: 'Có thứ trắng sống dưới nước đen.',
        noiId: noiOCua(state, NGUOI),
      },
      nc(state, 'u'),
    );
    if (!r.ok) return;
    ap(state, log, nc(state, 'u').eventId, r.value.patches, 'doi_thoai');

    const so = soTayCua(state, NGUOI);
    const dong = so.nghe.find((x) => x.noiDung.includes('nước đen'));
    expect(dong).toBeDefined();
    expect(dong?.doTin).toContain('kể lại');
  });

  it('Sổ Tay rỗng khi chưa nhập ai — không crash, không bịa', () => {
    const { state } = theGioi();
    const view = chieu(state, 'pham_nhan', null);
    const so = dungSoTay({ view, triThuc: [], viecDangLam: '', nghiThucVoIch: [] });
    expect(so.quen).toEqual([]);
    expect(quetSoRo(so)).toEqual([]);
  });
});

// ─────────────────────────────────────────── 10. cổng tổng

describe('cổng Phase 7 — thế giới vẫn đúng', () => {
  it('một trăm nhịp có đủ hai tiến trình mới: invariant sạch', () => {
    const { state, log } = theGioi();
    themNguoi(state, log, 4);
    chay(state, log, 100);
    expect(chayInvariantToanBo(state).dat).toBe(true);
  });

  it('determinism không vỡ — cùng seed cho cùng hash', () => {
    const a = theGioi('det-pham');
    const b = theGioi('det-pham');
    themNguoi(a.state, a.log, 3);
    themNguoi(b.state, b.log, 3);
    chay(a.state, a.log, 60);
    chay(b.state, b.log, 60);
    expect(hashState(a.state)).toBe(hashState(b.state));
  });

  it('chơi trọn một vòng phàm nhân KHÔNG chạm tầng Thần lần nào', () => {
    const { state, log } = theGioi();
    // Bám chặt tầng phàm nhân suốt bài.
    ap(
      state,
      log,
      'ev_vao_pham',
      [
        {
          op: 'set',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
          value: 'pham_nhan',
          sourceEventId: 'ev_vao_pham',
        },
        {
          op: 'set',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
          value: NGUOI,
          sourceEventId: 'ev_vao_pham',
        },
      ],
      'chuyen_tang',
    );

    const [ban] = themNguoi(state, log, 1);
    // nói chuyện → lập nhà → làm nghề → thời gian trôi
    const r = noi(
      state,
      {
        nguoiNoiId: NGUOI,
        nguoiNgheId: ban as string,
        loai: 'giao_keo',
        noiDung: 'Ta đổi cá lấy gốm của ngươi mỗi mùa.',
        dieuNguoiNoiTin: 'x',
        dieuMuonNguoiNgheTin: 'x',
        noiId: noiOCua(state, NGUOI),
      },
      nc(state, 'v'),
    );
    if (r.ok) ap(state, log, nc(state, 'v').eventId, r.value.patches, 'doi_thoai');

    const lh = lapHo(
      state,
      {
        chuHoId: NGUOI,
        thanhVien: [{ id: ban as string, vai: 'ban_doi' }],
        noiOId: noiOCua(state, NGUOI) as string,
      },
      { eventId: 'ev_nha', tick: state.world.tick },
    );
    expect(lh.ok, lh.ok ? '' : JSON.stringify(lh.errors)).toBe(true);
    if (lh.ok) ap(state, log, 'ev_nha', lh.value.patches, 'lap_ho');

    chay(state, log, 30);

    expect(state.world.playerState.mode).toBe('pham_nhan');
    const inv = chayInvariantToanBo(state);
    expect(inv.dat, JSON.stringify([...inv.viPhamNang, ...inv.canhBao].map((x) => x.message))).toBe(true);
    // Không vị thần nào phải can thiệp để đoạn trên chạy được.
    const so = chieu(state, 'pham_nhan', NGUOI);
    expect(so.mucChieu).toBe('pham_nhan');
  });
});
