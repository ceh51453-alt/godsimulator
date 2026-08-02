/**
 * Cổng Phase 8 — phần truy hồi và rerank (Phần 54, 77).
 *
 * ── Bài test quan trọng nhất của cả phase ──
 *
 * `forbidden recall = 0`. 54.3 gọi rò rỉ RAG là "hỏng nặng", và 77.10 bắt chỉ số
 * ấy phải bằng 0 Ở MỌI MODE. Vì vậy nó được kiểm ba lần bằng ba đường khác nhau:
 *
 *   1. sau `locTamNhin()`     — chunk cấm không có trong tập đã chiếu
 *   2. sau cả đường ống       — không lọt vào `daChon`, `candidates`, trace
 *   3. qua bộ đánh giá        — `forbiddenRecall === 0` ở heuristic VÀ semantic
 *
 * Ba đường vì một đường có thể xanh nhờ may: nếu chunk cấm tình cờ xếp hạng 47
 * thì "không có trong top-20" là đúng mà vô nghĩa. 77.1 nói reranker không được
 * THẤY nó, chứ không nói không được xếp nó cao.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog } from '../engine/state.js';
import type { WorldState, EventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent } from '../engine/transaction.js';
import { datLaiInvariant } from '../engine/invariant.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { napBatBienTangThan } from '../world/batBienThan.js';
import { napBatBienTangPham } from '../world/batBienPham.js';
import { napBatBienTangTruyen } from '../world/batBienTruyen.js';
import { chieu } from '../project/chieu.js';
import { moRong, khoangCachDoThi } from '../project/moRong.js';
import { TUNING_MAC_DINH } from '../tuning/schema.js';
import { RerankCandidateSchema, RerankConfigSchema, doCauHinhRerank } from '../schema/rerank.js';
import type { RerankCandidate, RetrievalEvalCase } from '../schema/rerank.js';
import { StorylineSchema } from '../schema/truyen.js';

import { ChunkSchema, chunkDuocThay, cuaSoTruot, luongTuHoa, giaiLuongTu, cosine } from './chunk.js';
import type { Chunk } from './chunk.js';
import { dungChiMuc } from './chiMuc.js';
import { kenhTuVung, kenhNguNghia, kenhDoThi, rrf, tachTu, K_RRF } from './kenh.js';
import {
  diemHeuristic,
  xepHangHeuristic,
  fusion,
  mmr,
  dongGoiTheoToken,
  locOutputAdapter,
  catChoAdapter,
} from './rerank.js';
import type { ThongTinChunk } from './rerank.js';
import {
  truyHoi,
  locTamNhin,
  dungBaTruyVan,
  scopeKeyCua,
  MACH_RERANK_MOI,
  machSauHong,
  machSauBoQua,
  NGUONG_MO_MACH_RERANK,
  SO_REQUEST_BO_QUA,
} from './truyHoi.js';
import { mockReranker, mockBoNhung } from './mockAdapter.js';
import { chamMotCase, tongKet, congEval } from './danhGia.js';
import { boDeTuTheGioi, chayBoDanhGia } from './boDanhGia.js';

const TUNING = TUNING_MAC_DINH;
const CFG = RerankConfigSchema.parse({});

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
  napBatBienTangThan();
  napBatBienTangPham();
  napBatBienTangTruyen();
});

function theGioi(seed = 'retrieval'): { state: WorldState; log: EventLog } {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'day_du', seed, worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  const r = apDungChuoi(state, events, log);
  if (!r.ok) throw new Error(r.errors.map((e) => e.message).join('; '));
  const nen = eventGieoNen(state);
  if (nen) apDungEvent(state, nen, log);
  return { state, log };
}

const ck = (id: string, ghiDe: Partial<Chunk> = {}): Chunk =>
  ChunkSchema.parse({
    id,
    branchId: 'br_goc',
    nguon: 'lorebook',
    nguonId: `nguon_${id}`,
    noiDung: `Nội dung của ${id}`,
    tick: 10,
    ...ghiDe,
  });

const cand = (id: string, ghiDe: Partial<RerankCandidate> = {}): RerankCandidate =>
  RerankCandidateSchema.parse({
    chunkId: id,
    sourceType: 'lorebook',
    projectedText: `Nội dung của ${id}`,
    initialRank: 1,
    initialRrf: 0.1,
    graphDistance: null,
    trust: 0.8,
    tick: 10,
    storylineId: null,
    visibilityHash: 'vh',
    nguonId: `nguon_${id}`,
    ...ghiDe,
  });

// ─────────────────────────────────────────── chunk và nhãn tầm nhìn

describe('[BB] 54.3 — nhãn tầm nhìn gán lúc index', () => {
  it('chunk KHÔNG khai nhãn thì mặc định pham_nhan, và nhãn cao chặn tầng dưới', () => {
    const mo = ck('c1');
    expect(mo.tamNhin.tangToiThieu).toBe('pham_nhan');

    const cam = ck('c2', {
      tamNhin: { tangToiThieu: 'sang_the', vungHanChe: [], domainHanChe: [], laTinDon: false },
    });
    const nc = { vungIds: new Set<string>(), domainIds: new Set<string>() };
    expect(chunkDuocThay(cam, { mucChieu: 'pham_nhan', ...nc })).toBe(false);
    expect(chunkDuocThay(cam, { mucChieu: 'than', ...nc })).toBe(false);
    expect(chunkDuocThay(cam, { mucChieu: 'sang_the', ...nc })).toBe(true);
  });

  it('[BB] 54.2 — diễn giải của vùng A không trả về khi đang kể ở vùng B', () => {
    const dgA = ck('dg_a', {
      tamNhin: { tangToiThieu: 'pham_nhan', vungHanChe: ['place_a'], domainHanChe: [], laTinDon: false },
    });
    expect(
      chunkDuocThay(dgA, { mucChieu: 'pham_nhan', vungIds: new Set(['place_a']), domainIds: new Set() }),
    ).toBe(true);
    expect(
      chunkDuocThay(dgA, { mucChieu: 'pham_nhan', vungIds: new Set(['place_b']), domainIds: new Set() }),
    ).toBe(false);
  });

  it('domain hạn chế: thần chỉ thấy phần trong domain mình giữ', () => {
    const c = ck('dm', {
      tamNhin: { tangToiThieu: 'than', vungHanChe: [], domainHanChe: ['Thanh Sạch'], laTinDon: false },
    });
    expect(
      chunkDuocThay(c, { mucChieu: 'than', vungIds: new Set(), domainIds: new Set(['Thanh Sạch']) }),
    ).toBe(true);
    expect(chunkDuocThay(c, { mucChieu: 'than', vungIds: new Set(), domainIds: new Set(['Ô Uế']) })).toBe(
      false,
    );
  });

  it('[BB] 54.2 — chỉ cảnh đã kể mới dùng cửa sổ trượt; đơn vị tự nhiên giữ nguyên', () => {
    const ngan = cuaSoTruot('Một câu ngắn.');
    expect(ngan).toHaveLength(1);

    const dai = cuaSoTruot('x'.repeat(5_000));
    expect(dai.length).toBeGreaterThan(1);
    // Chồng lấn 15% nghĩa là tổng độ dài các lát LỚN HƠN độ dài gốc.
    expect(dai.reduce((t, x) => t + x.length, 0)).toBeGreaterThan(5_000);
  });

  it('[BB] 54.4 — int8 giảm bốn lần dung lượng mà cosine không đổi đáng kể', () => {
    const v = Array.from({ length: 64 }, (_, i) => Math.sin(i) * 0.9);
    const q = luongTuHoa(v);
    expect(q.byteLength).toBe(64);
    const lai = giaiLuongTu(q);
    expect(cosine(Float32Array.from(v), lai)).toBeGreaterThan(0.999);
  });
});

// ─────────────────────────────────────────── bộ chỉ mục

describe('bộ chỉ mục — Phần 54.2', () => {
  it('văn bản luật gốc được gán tầng `than`, kẽ hở chưa khai thác gán `sang_the`', () => {
    const { state } = theGioi();
    const ds = dungChiMuc(state);
    const luat = ds.find((c) => c.nguon === 'dinh_luat' && c.id.startsWith('ck_luat_'));
    expect(luat?.tamNhin.tangToiThieu).toBe('than');

    const keHo = ds.find((c) => c.id.startsWith('ck_keho_'));
    expect(keHo?.tamNhin.tangToiThieu).toBe('sang_the');
  });

  it('MỖI DIỄN GIẢI một chunk riêng, gắn vungId của chính nó', () => {
    const { state } = theGioi();
    const ds = dungChiMuc(state).filter((c) => c.nguon === 'dien_giai_luat');
    expect(ds.length).toBeGreaterThan(0);
    for (const c of ds) {
      expect(c.tamNhin.vungHanChe.length).toBeLessThanOrEqual(1);
      expect(c.nguonId).not.toBe('');
    }
    // Hai vùng hiểu khác nhau → hai `nguonId` khác nhau, tức MMR coi là hai nguồn.
    expect(new Set(ds.map((c) => c.nguonId)).size).toBeGreaterThan(1);
  });

  it('bản tính THẬT của thần là chunk `sang_the`; bản tín đồ tin thì `pham_nhan`', () => {
    const { state } = theGioi();
    const than = state.entities.get('deity_1');
    if (than) {
      // Nét phải đủ mạnh mới thành lời đồn; một vị thần "hơi nghiêm khắc" thì
      // dân không kể gì về ngài cả, và chunk ấy đúng là KHÔNG nên tồn tại.
      state.entities.set('deity_1', {
        ...than,
        aspects: {
          ...than.aspects,
          venerable: { ...(than.aspects['venerable'] as object), banTinhTinDoTin: { tuBi_tanNhan: -80 } },
        },
      });
    }
    const ds = dungChiMuc(state);
    expect(ds.find((c) => c.id.startsWith('ck_bt_that_'))?.tamNhin.tangToiThieu).toBe('sang_the');
    const tin = ds.find((c) => c.id.startsWith('ck_bt_tin_'));
    expect(tin?.tamNhin.tangToiThieu).toBe('pham_nhan');
    expect(tin?.noiDung).toContain('tàn nhẫn');
    expect(tin?.noiDung).not.toContain('tuBi_tanNhan');
  });

  it('nét bản tính chưa đủ mạnh thì KHÔNG sinh chunk — dân không kể chuyện nhạt', () => {
    const { state } = theGioi();
    const than = state.entities.get('deity_1');
    if (than) {
      state.entities.set('deity_1', {
        ...than,
        aspects: {
          ...than.aspects,
          venerable: { ...(than.aspects['venerable'] as object), banTinhTinDoTin: { tuBi_tanNhan: 5 } },
        },
      });
    }
    expect(dungChiMuc(state).find((c) => c.id.startsWith('ck_bt_tin_'))).toBeUndefined();
  });

  it('[BB] 56.2 — KHÔNG chunk nào tới được tầng phàm nhân mà mang khóa engine hay con số trục', () => {
    const { state } = theGioi();
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    const daChieu = locTamNhin(dungChiMuc(state), {
      view,
      vungIds: new Set(['place_a']),
      domainIds: new Set(),
      seed: 's',
      triThuc: 50,
    });
    const ca = daChieu.map((c) => c.projectedText).join('\n');

    // Sáu trục bản tính là thang đo của engine. Dân làng không nói bằng thang đo.
    for (const khoa of [
      'tuBi_tanNhan',
      'kieuNgao_khiemNhuong',
      'trungThanh_phanTrac',
      'ducVong_tietChe',
      'tratTu_phongTung',
      'canDam_khiepNhuoc',
      'thieuHut',
      'cohort',
      'domainStrength',
    ]) {
      expect(ca, `rò khóa engine "${khoa}" xuống tầng phàm nhân`).not.toContain(khoa);
    }
    // Và không có cặp `khóa=số` nào sót lại.
    expect(ca).not.toMatch(/[A-Za-z_]+=\s*-?\d/);
  });

  it('chỉ mục là hàm THUẦN — cùng state cho cùng danh sách, cùng thứ tự', () => {
    const { state } = theGioi();
    expect(dungChiMuc(state).map((c) => c.id)).toEqual(dungChiMuc(state).map((c) => c.id));
  });

  it('mạch người chơi chưa biết KHÔNG sinh chunk truy hồi được ở tầng dưới', () => {
    const { state } = theGioi();
    state.storylines.set(
      'ml_an',
      StorylineSchema.parse({
        id: 'ml_an',
        branchId: 'br_goc',
        ten: 'Mạch giấu',
        loai: 'bao_thu',
        kyUcMach: 'Một chuyện ở rất xa.',
        nguoiChoiBiet: false,
        tickSinh: 0,
      }),
    );
    const c = dungChiMuc(state).find((x) => x.storylineId === 'ml_an');
    expect(c?.tamNhin.tangToiThieu).toBe('sang_the');
  });
});

// ─────────────────────────────────────────── ba kênh + RRF

describe('ba kênh và RRF — Phần 54.1', () => {
  const ds = [
    {
      id: 'a',
      nguon: 'lorebook',
      nguonId: 'n1',
      projectedText: 'Đấng Tẩy Uế trừng phạt kẻ mang dấu máu',
      entityIds: ['deity_1'],
      storylineId: null,
      trust: 0.9,
      tick: 10,
      daBopMeo: false,
      vector: null,
    },
    {
      id: 'b',
      nguon: 'bien_nien',
      nguonId: 'n2',
      projectedText: 'Lễ hội thuyền hoa bên sông kéo dài chín ngày',
      entityIds: ['place_a'],
      storylineId: null,
      trust: 0.9,
      tick: 10,
      daBopMeo: false,
      vector: null,
    },
    {
      id: 'c',
      nguon: 'lorebook',
      nguonId: 'n3',
      projectedText: 'Dấu máu làm ô uế người đứng gần',
      entityIds: ['law_thuong'],
      storylineId: null,
      trust: 0.6,
      tick: 10,
      daBopMeo: false,
      vector: null,
    },
  ] as const;

  it('BM25 kéo đúng chunk chứa thuật ngữ, không kéo chunk cùng chủ đề chung chung', () => {
    const kq = kenhTuVung([...ds], 'dấu máu ô uế');
    expect(kq.xepHang[0]).toBe('c');
    expect(kq.xepHang).not.toContain('b');
  });

  it('[BB] 54.4 — tắt kênh ngữ nghĩa thì RAG VẪN CHẠY bằng hai kênh còn lại', () => {
    const tat = kenhNguNghia([...ds], 'dấu máu', null);
    expect(tat.songKhoe).toBe(false);

    const hn = rrf([
      { ten: 'tu_vung', kq: kenhTuVung([...ds], 'dấu máu'), trongSo: 1 },
      { ten: 'ngu_nghia', kq: tat, trongSo: 1 },
      { ten: 'do_thi', kq: kenhDoThi([...ds], new Map([['law_thuong', 1]]), null), trongSo: 1.2 },
    ]);
    expect(hn.length).toBeGreaterThan(0);
    expect(hn[0]?.kenh).not.toContain('ngu_nghia');
  });

  it('chunk chưa nhúng (`vector = null`) vẫn là chunk dùng được', () => {
    const bo = mockBoNhung();
    const kq = kenhNguNghia([...ds], 'dấu máu', bo);
    // Không chunk nào có vector → kênh chạy nhưng không chấm được ai.
    expect(kq.diem.size).toBe(0);
    // Và điều đó KHÔNG làm hỏng RRF.
    expect(rrf([{ ten: 'tu_vung', kq: kenhTuVung([...ds], 'dấu máu'), trongSo: 1 }]).length).toBeGreaterThan(
      0,
    );
  });

  it('RRF chỉ dùng THỨ HẠNG — kênh trả điểm ở thang khác không làm lệch kết quả', () => {
    const thangNho: { xepHang: readonly string[]; diem: ReadonlyMap<string, number>; songKhoe: boolean } = {
      xepHang: ['a', 'b'],
      diem: new Map([
        ['a', 0.0001],
        ['b', 0.00005],
      ]),
      songKhoe: true,
    };
    const thangTo = {
      xepHang: ['a', 'b'],
      diem: new Map([
        ['a', 9_000],
        ['b', 4_000],
      ]),
      songKhoe: true,
    };
    const r1 = rrf([{ ten: 'x', kq: thangNho, trongSo: 1 }]);
    const r2 = rrf([{ ten: 'x', kq: thangTo, trongSo: 1 }]);
    expect(r1.map((x) => x.chunkId)).toEqual(r2.map((x) => x.chunkId));
    expect(r1[0]?.diem).toBeCloseTo(r2[0]?.diem ?? 0, 12);
  });

  it('công thức RRF đúng: w/(k + hạng)', () => {
    const kq = rrf([
      { ten: 'x', kq: { xepHang: ['a'], diem: new Map([['a', 1]]), songKhoe: true }, trongSo: 1 },
    ]);
    expect(kq[0]?.diem).toBeCloseTo(1 / (K_RRF + 1), 10);
  });

  it('tách từ theo âm tiết: truy vấn ngắn khớp được chunk có tên dài', () => {
    expect(tachTu('Thung Lũng Tro')).toEqual(['thung', 'lũng', 'tro']);
  });
});

// ─────────────────────────────────────────── mở rộng đồ thị

describe('mở rộng đồ thị — Phần 6.4', () => {
  it('[BB] chỉ đi qua entity chủ thể ĐƯỢC BIẾT — không có đường rò qua đồ thị', () => {
    const { state } = theGioi();
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    const mr = moRong(['mortal_1'], { soHop: 3, view });
    for (const n of mr) expect(view.entities.has(n.id)).toBe(true);
    // Không nốt nào nằm trong danh sách `mu`.
    for (const n of mr) expect(view.suongMu.mu).not.toContain(n.id);
  });

  it('điểm giảm theo hop, và khoảng cách đồ thị đọc lại được từ đường đi', () => {
    const { state } = theGioi();
    const view = chieu(state, 'sang_the', null);
    const mr = moRong(['mortal_1'], { soHop: 2, view });
    expect(mr.length).toBeGreaterThan(0);
    const hop = khoangCachDoThi(mr);
    const mot = mr.filter((n) => hop.get(n.id) === 1);
    const hai = mr.filter((n) => hop.get(n.id) === 2);
    if (mot.length > 0 && hai.length > 0) {
      expect(Math.max(...mot.map((n) => n.diem))).toBeGreaterThan(Math.min(...hai.map((n) => n.diem)));
    }
  });

  it('kết quả deterministic — cùng view cho cùng thứ tự', () => {
    const { state } = theGioi();
    const view = chieu(state, 'sang_the', null);
    expect(moRong(['law_thuong'], { soHop: 2, view }).map((n) => n.id)).toEqual(
      moRong(['law_thuong'], { soHop: 2, view }).map((n) => n.id),
    );
  });

  it('view chỉ chứa cạnh có CẢ HAI đầu nhìn thấy được', () => {
    const { state } = theGioi();
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    for (const lk of view.links) {
      expect(view.entities.has(lk.tuId)).toBe(true);
      expect(view.entities.has(lk.denId)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────── heuristic rerank

describe('[BB] 77.4 — heuristic luôn tồn tại và luôn deterministic', () => {
  const nc = {
    tick: 100,
    nhip: 'nien' as const,
    tuning: TUNING,
    task: 'narrate_scene',
    storylineDangChieuId: null,
  };

  it('cùng input cho CÙNG thứ hạng, mọi lần', () => {
    const ds = [cand('a', { initialRank: 3 }), cand('b', { initialRank: 1 }), cand('c', { initialRank: 2 })];
    const l1 = xepHangHeuristic(ds, nc).map((x) => x.chunkId);
    const l2 = xepHangHeuristic([...ds].reverse(), nc).map((x) => x.chunkId);
    expect(l1).toEqual(l2);
  });

  it('tie-break bằng chunkId, KHÔNG bằng thứ tự đầu vào', () => {
    const ds = [cand('zz'), cand('aa')];
    expect(xepHangHeuristic(ds, nc).map((x) => x.chunkId)).toEqual(['aa', 'zz']);
  });

  it('[BB] `trust = 0` KHÔNG đồng nghĩa xóa — tin đồn vẫn có cơ hội', () => {
    const d = diemHeuristic(cand('x', { trust: 0 }), nc);
    expect(d).toBeGreaterThan(0);
  });

  it('chunk cùng mạch đang chiếu được nâng, đúng hệ số của tuning', () => {
    const thuong = diemHeuristic(cand('x'), nc);
    const trongMach = diemHeuristic(cand('x', { storylineId: 'ml_1' }), {
      ...nc,
      storylineDangChieuId: 'ml_1',
    });
    expect(trongMach / thuong).toBeCloseTo(TUNING.rerank.storylineBoost, 5);
  });

  it('suy giảm thời gian theo NHỊP — một nhịp Vĩnh Kiếp quên chậm hơn nhiều', () => {
    const cu = cand('x', { tick: 0 });
    const nhat = diemHeuristic(cu, { ...nc, nhip: 'nhat' });
    const vinh = diemHeuristic(cu, { ...nc, nhip: 'vinh_kiep' });
    expect(vinh).toBeGreaterThan(nhat);
  });

  it('mỗi task dùng hồ sơ trọng số riêng từ tuning', () => {
    expect(TUNING.rerank.hoSoTask['answer_prayer']?.graph).toBeGreaterThan(
      TUNING.rerank.hoSoTask['world_report']?.graph ?? 0,
    );
  });
});

// ─────────────────────────────────────────── fusion + MMR

describe('[BB] 77.6 — fusion theo thứ hạng, MMR phạt cả trùng nguồn', () => {
  const ds = [cand('a', { initialRank: 1 }), cand('b', { initialRank: 2 }), cand('c', { initialRank: 3 })];

  it('semantic vắng mặt thì trọng số còn lại được CHUẨN HÓA, không tụt thang', () => {
    const chung = {
      candidates: ds,
      hangHeuristic: new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
      hangDoThi: new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
      config: CFG,
      tuning: TUNING,
      task: 'narrate_scene',
      tick: 100,
      nhip: 'nien' as const,
    };
    const co = fusion({
      ...chung,
      hangSemantic: new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
    });
    const khong = fusion({ ...chung, hangSemantic: null });
    // Thang điểm giữ nguyên độ lớn; chỉ nguồn thông tin là ít đi.
    expect(khong[0]?.diem ?? 0).toBeGreaterThan((co[0]?.diem ?? 0) * 0.7);
    expect(khong.map((x) => x.chunkId)).toEqual(['a', 'b', 'c']);
  });

  it('[BB] hai chunk CÙNG nguonId là trùng MẠNH dù chữ khác hẳn', () => {
    // `x2` xếp trên `y1` trước khi có MMR. Sau MMR nó bị đẩy xuống vì cùng nguồn
    // với `x1` — dù hai câu không chung một chữ nào đáng kể.
    const xh = [
      { chunkId: 'x1', diem: 1.0, lyDo: [] as never[] },
      { chunkId: 'x2', diem: 0.9, lyDo: [] as never[] },
      { chunkId: 'y1', diem: 0.75, lyDo: [] as never[] },
    ];
    const tra = new Map([
      ['x1', { projectedText: 'Người già kể rằng dấu máu làm ô uế', nguonId: 'cung_nguon' }],
      ['x2', { projectedText: 'Ở đây ai chạm kẻ có dấu cũng thành ô uế', nguonId: 'cung_nguon' }],
      ['y1', { projectedText: 'Mùa cá bạc đã hết từ lâu', nguonId: 'khac' }],
    ]);
    const chon = mmr(xh, tra, 0.72, 2).map((x) => x.chunkId);
    expect(chon).toEqual(['x1', 'y1']);
  });

  it('MMR gắn lý do `diversity` cho chunk được chọn nhờ khác nguồn', () => {
    const xh = [
      { chunkId: 'a', diem: 1, lyDo: [] as never[] },
      { chunkId: 'b', diem: 0.9, lyDo: [] as never[] },
    ];
    const tra = new Map([
      ['a', { projectedText: 'alpha', nguonId: 'n1' }],
      ['b', { projectedText: 'beta', nguonId: 'n2' }],
    ]);
    const kq = mmr(xh, tra, 0.72, 2);
    expect(kq[1]?.lyDo).toContain('diversity');
  });
});

// ─────────────────────────────────────────── token budget

describe('[BB] 77.7 — đóng gói theo token, và budget CÓ TRACE', () => {
  const tt = (nguon: string, nguonId: string, dai: number, hop: number | null = null): ThongTinChunk => ({
    projectedText: 'x'.repeat(dai),
    nguonId,
    nguon,
    graphDistance: hop,
    laTienLe: false,
  });

  it('hết ngân sách thì DỪNG, và chunk bị bỏ có lý do ghi lại', () => {
    const xh = ['a', 'b', 'c'].map((id, i) => ({ chunkId: id, diem: 1 - i * 0.1, lyDo: [] as never[] }));
    const tra = new Map([
      ['a', tt('lorebook', 'n1', 320)],
      ['b', tt('bien_nien', 'n2', 320)],
      ['c', tt('ky_uc_mach', 'n3', 320)],
    ]);
    const goi = dongGoiTheoToken(xh, tra, {
      nganSachToken: 200,
      outputK: 10,
      tyLeToken: 3.2,
      tranTyLeMotNguon: 0.5,
    });
    expect(goi.chon.length).toBeLessThan(3);
    expect(goi.biCat.some((b) => b.vi === 'hết ngân sách token')).toBe(true);
    expect(goi.canhBao.length).toBeGreaterThan(0);
  });

  it('quy tắc 3 — một nguồn không chiếm quá 50% top-K', () => {
    const xh = Array.from({ length: 8 }, (_, i) => ({
      chunkId: `s${i}`,
      diem: 1 - i * 0.01,
      lyDo: [] as never[],
    }));
    const tra = new Map(xh.map((x) => [x.chunkId, tt('lorebook', 'mot_nguon', 20)]));
    const goi = dongGoiTheoToken(xh, tra, {
      nganSachToken: 10_000,
      outputK: 6,
      tyLeToken: 3.2,
      tranTyLeMotNguon: 0.5,
    });
    expect(goi.chon.length).toBeLessThanOrEqual(3);
    expect(goi.biCat.some((b) => b.vi.includes('không được quá'))).toBe(true);
  });

  it('quy tắc 1 + 2 — mỗi nguồn giữ một chỗ, và nhân quả trực tiếp vào trước', () => {
    const xh = [
      { chunkId: 'thap_ma_gan', diem: 0.1, lyDo: [] as never[] },
      { chunkId: 'cao_ma_xa', diem: 0.9, lyDo: [] as never[] },
      { chunkId: 'nguon_khac', diem: 0.5, lyDo: [] as never[] },
    ];
    const tra = new Map([
      ['thap_ma_gan', tt('lorebook', 'n1', 20, 1)],
      ['cao_ma_xa', tt('lorebook', 'n2', 20, null)],
      ['nguon_khac', tt('bien_nien', 'n3', 20, null)],
    ]);
    const goi = dongGoiTheoToken(xh, tra, {
      nganSachToken: 10_000,
      outputK: 3,
      tyLeToken: 3.2,
      tranTyLeMotNguon: 1,
    });
    // Chunk có quan hệ nhân quả trực tiếp vào trước dù điểm thấp nhất.
    expect(goi.chon[0]?.chunkId).toBe('thap_ma_gan');
    expect(new Set(goi.chon.map((c) => tra.get(c.chunkId)?.nguon)).size).toBe(2);
  });
});

// ─────────────────────────────────────────── adapter semantic

describe('[BB] 77.5 — adapter và ngắt mạch', () => {
  it('output chứa id ngoài candidate set → BỎ TOÀN BỘ, không sửa tạm', () => {
    expect(locOutputAdapter(['a', 'la'], new Set(['a', 'b']))).toBeNull();
    expect(locOutputAdapter(['b', 'a'], new Set(['a', 'b']))).toEqual(['b', 'a']);
    // Trùng id thì bỏ bản sau, không coi là hỏng.
    expect(locOutputAdapter(['a', 'a', 'b'], new Set(['a', 'b']))).toEqual(['a', 'b']);
  });

  it('cắt chunk theo maxChunkTokens, ưu tiên câu đầu và câu chứa từ khớp', () => {
    const text = 'Câu đầu nói về Đấng Tẩy Uế. Một câu giữa hoàn toàn lạc đề. Câu cuối lại nhắc Đấng Tẩy Uế.';
    const cat = catChoAdapter(text, ['đấng', 'tẩy', 'uế'], 20, 3.2);
    expect(cat.length).toBeLessThan(text.length);
    expect(cat).toContain('Câu đầu');
  });

  it('mock reranker deterministic — cùng đầu vào cho cùng thứ tự', async () => {
    const ad = mockReranker();
    const q = { focusText: 'dấu máu', intentText: 'ô uế', precedentText: '' };
    const ds = [
      { chunkId: 'a', projectedText: 'chuyện mùa màng' },
      { chunkId: 'b', projectedText: 'dấu máu làm ô uế người đứng gần' },
    ];
    const r1 = await ad.xepHang(q, ds);
    const r2 = await ad.xepHang(q, [...ds].reverse());
    expect(r1.orderedChunkIds).toEqual(r2.orderedChunkIds);
    expect(r1.orderedChunkIds[0]).toBe('b');
  });

  it('[BB] 77.9 — ba lỗi liên tiếp mở mạch trong hai mươi request', () => {
    let m = MACH_RERANK_MOI;
    for (let i = 0; i < NGUONG_MO_MACH_RERANK; i++) m = machSauHong(m, 'timeout');
    expect(m.moMach).toBe(true);
    expect(m.conBoQua).toBe(SO_REQUEST_BO_QUA);

    for (let i = 0; i < SO_REQUEST_BO_QUA - 1; i++) m = machSauBoQua(m);
    expect(m.moMach).toBe(true);
    // Hết hạn bỏ qua → tự đóng mạch để probe một batch nhỏ.
    m = machSauBoQua(m);
    expect(m.moMach).toBe(false);
    expect(m.hongLienTiep).toBe(0);
  });

  it('cấu hình rerank hỏng KHÔNG throw — nó rơi về heuristic an toàn', () => {
    const r = doCauHinhRerank({ candidateK: -5 });
    expect(r.daRoiVeHeuristic).toBe(true);
    expect(r.config.endpoint.mode).toBe('heuristic');
    expect(r.canhBao.length).toBeGreaterThan(0);
  });

  it('mode proxy thiếu proxyUrl cũng rơi về heuristic, có câu giải thích', () => {
    const r = doCauHinhRerank({ endpoint: { mode: 'proxy_cross_encoder', proxyUrl: '' } });
    expect(r.config.endpoint.mode).toBe('heuristic');
    expect(r.canhBao[0]).toContain('proxyUrl');
  });
});

// ─────────────────────────────────────────── đường ống đầy đủ

describe('[BB] cổng Phase 8 — đường ống truy hồi không rò ba tầng', () => {
  /** Ba chunk cấm, đúng ba loại rò của 18.2 và 54.3. */
  const CAM = ['ck_cam_luat_goc', 'ck_cam_ban_tinh', 'ck_cam_ke_ho'];

  function boChunk(): readonly Chunk[] {
    return [
      ck('ck_dg_thung_lung', {
        nguonId: 'nguon_dien_giai',
        noiDung: 'Người già dạy rằng kẻ mang dấu máu làm ô uế người đứng gần.',
        entityIds: ['law_thuong'],
        trust: 0.55,
      }),
      ck('ck_dg_thung_lung_2', {
        nguonId: 'nguon_dien_giai',
        noiDung: 'Ai chạm phải kẻ có dấu thì cũng thành ô uế theo.',
        entityIds: ['law_thuong'],
        trust: 0.52,
      }),
      ck('ck_dg_bo_song', {
        nguonId: 'nguon_bo_song',
        noiDung: 'Bên bờ sông, người ta tin nước rằm rửa được dấu máu.',
        entityIds: ['law_thuong'],
        trust: 0.5,
      }),
      ck('ck_nhieu_le_hoi', {
        nguon: 'bien_nien',
        nguonId: 'nguon_bien_nien',
        noiDung: 'Lễ hội thuyền hoa bên sông kéo dài chín ngày.',
        entityIds: ['place_a'],
      }),
      ck('ck_cam_luat_goc', {
        nguon: 'dinh_luat',
        nguonId: 'nguon_luat_goc',
        noiDung: 'Văn bản luật: "Máu đã đổ thì không rửa được." Kích hoạt: gay_chay_mau.',
        entityIds: ['law_thuong'],
        trust: 1,
        tamNhin: { tangToiThieu: 'sang_the', vungHanChe: [], domainHanChe: [], laTinDon: false },
      }),
      ck('ck_cam_ban_tinh', {
        nguonId: 'nguon_hon_pho',
        noiDung: 'Bản tính thật của Đấng Tẩy Uế: từ bi, chưa từng đòi trừng phạt.',
        entityIds: ['deity_1'],
        trust: 1,
        tamNhin: { tangToiThieu: 'sang_the', vungHanChe: [], domainHanChe: [], laTinDon: false },
      }),
      ck('ck_cam_ke_ho', {
        nguonId: 'nguon_ke_ho',
        noiDung: 'Kẽ hở: bóp cổ không gây chảy máu nên không kích hoạt luật.',
        entityIds: ['law_thuong'],
        trust: 1,
        tamNhin: { tangToiThieu: 'sang_the', vungHanChe: [], domainHanChe: [], laTinDon: false },
      }),
      ck('ck_tin_don', {
        nguon: 'bien_nien',
        nguonId: 'nguon_tin_don',
        noiDung: 'Nghe nói vị thần đã giết ba trăm người ở bờ bắc.',
        entityIds: ['deity_1'],
        tamNhin: { tangToiThieu: 'pham_nhan', vungHanChe: [], domainHanChe: [], laTinDon: true },
        meta: { chang: 3 },
      }),
    ];
  }

  function dauVao(state: WorldState, mode: 'pham_nhan' | 'than' | 'sang_the', chuTheId: string | null) {
    const view = chieu(state, mode, chuTheId);
    return {
      view,
      chunks: boChunk(),
      task: 'narrate_scene' as const,
      truyVan: dungBaTruyVan(view, {
        tieuDiemIds: ['law_thuong'],
        loiNguoiChoi: 'Luật của thế giới này là gì?',
        machDangChieuId: null,
      }),
      tieuDiemIds: ['law_thuong'],
      machDangChieuId: null,
      config: CFG,
      tuning: TUNING,
      nganSachToken: 4_000,
      tyLeToken: 3.2,
      seed: state.world.seed,
      triThuc: 40,
      vungIds: new Set<string>(['place_a']),
      domainIds: new Set<string>(),
    };
  }

  it('[BB] lọc tầm nhìn chạy TRƯỚC — chunk cấm không tồn tại trong tập đã chiếu', () => {
    const { state } = theGioi();
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    const daChieu = locTamNhin(boChunk(), {
      view,
      vungIds: new Set(['place_a']),
      domainIds: new Set(),
      seed: 'x',
      triThuc: 40,
    });
    for (const id of CAM) expect(daChieu.map((c) => c.id)).not.toContain(id);
    // Và kiểu dữ liệu đã đổi: không còn trường `noiDung` gốc để mà rò.
    expect(Object.keys(daChieu[0] ?? {})).not.toContain('noiDung');
  });

  it('[BB] 54.3 — chunk tin đồn ĐÃ đi qua bopMeo trước khi vào ngữ cảnh', () => {
    const { state } = theGioi();
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    const daChieu = locTamNhin(boChunk(), {
      view,
      vungIds: new Set(['place_a']),
      domainIds: new Set(),
      seed: 'x',
      triThuc: 30,
    });
    const td = daChieu.find((c) => c.id === 'ck_tin_don');
    expect(td?.daBopMeo).toBe(true);
    expect(td?.projectedText).not.toBe('Nghe nói vị thần đã giết ba trăm người ở bờ bắc.');
  });

  it('forbidden recall = 0 ở CẢ BA tầng, chạy heuristic', async () => {
    const { state } = theGioi();
    for (const [mode, chuThe] of [
      ['pham_nhan', 'mortal_1'],
      ['than', 'deity_1'],
      ['sang_the', null],
    ] as const) {
      const kq = await truyHoi(dauVao(state, mode, chuThe), new Set(mode === 'sang_the' ? [] : CAM));
      expect(kq.chunkCamLotVao, `rò ở tầng ${mode}`).toEqual([]);
      expect(kq.run.forbiddenCount).toBe(0);
      // Chunk cấm cũng không có trong candidate — nó chưa từng được chấm điểm.
      for (const id of mode === 'sang_the' ? [] : CAM) {
        expect(kq.candidates.map((c) => c.chunkId)).not.toContain(id);
      }
    }
  });

  it('forbidden recall = 0 khi BẬT semantic — reranker không thấy chunk cấm', async () => {
    const { state } = theGioi();
    const kq = await truyHoi(
      {
        ...dauVao(state, 'pham_nhan', 'mortal_1'),
        config: RerankConfigSchema.parse({ endpoint: { mode: 'proxy_cross_encoder', proxyUrl: 'x' } }),
        adapter: mockReranker(),
        boNhung: mockBoNhung(),
      },
      new Set(CAM),
    );
    expect(kq.chunkCamLotVao).toEqual([]);
    expect(kq.run.modeUsed).toBe('proxy_cross_encoder');
  });

  it('[BB] 77.9 — adapter hỏng trả kết quả HEURISTIC và KHÔNG chặn lượt chơi', async () => {
    const { state } = theGioi();
    const dv = dauVao(state, 'pham_nhan', 'mortal_1');
    const hong = await truyHoi({
      ...dv,
      config: RerankConfigSchema.parse({ endpoint: { mode: 'proxy_cross_encoder', proxyUrl: 'x' } }),
      adapter: mockReranker({ luonHong: true }),
    });
    const chuan = await truyHoi(dv);

    expect(hong.ketQua.fallbackReason).not.toBe('');
    expect(hong.ketQua.modeUsed).toBe('heuristic');
    expect(hong.machMoi.hongLienTiep).toBe(1);
    // Kết quả GIỐNG baseline heuristic — đúng gate "lỗi endpoint cho kết quả heuristic".
    expect(hong.ketQua.orderedChunkIds).toEqual(chuan.ketQua.orderedChunkIds);
    expect(hong.daChon.length).toBeGreaterThan(0);
  });

  it('adapter trả id lạ → bỏ toàn bộ, rơi về heuristic, có cảnh báo', async () => {
    const { state } = theGioi();
    const kq = await truyHoi({
      ...dauVao(state, 'pham_nhan', 'mortal_1'),
      config: RerankConfigSchema.parse({ endpoint: { mode: 'proxy_cross_encoder', proxyUrl: 'x' } }),
      adapter: mockReranker({ traIdLa: true }),
    });
    expect(kq.ketQua.modeUsed).toBe('heuristic');
    expect(kq.canhBao.some((c) => c.includes('id lạ'))).toBe(true);
  });

  it('mạch đang mở thì KHÔNG gọi endpoint, đi thẳng heuristic', async () => {
    const { state } = theGioi();
    let daGoi = 0;
    const kq = await truyHoi({
      ...dauVao(state, 'pham_nhan', 'mortal_1'),
      config: RerankConfigSchema.parse({ endpoint: { mode: 'proxy_cross_encoder', proxyUrl: 'x' } }),
      adapter: {
        ten: 'dem',
        xepHang: () => {
          daGoi++;
          return Promise.resolve({ orderedChunkIds: [], latencyMs: 0 });
        },
      },
      mach: { hongLienTiep: 3, moMach: true, conBoQua: 20, lyDoCuoi: 'timeout' },
    });
    expect(daGoi).toBe(0);
    expect(kq.ketQua.modeUsed).toBe('heuristic');
    expect(kq.ketQua.fallbackReason).toContain('ngắt mạch');
  });

  it('[BB] 77.7 quy tắc 3 — không nguồn nào chiếm quá nửa top-K', async () => {
    const { state } = theGioi();
    const kq = await truyHoi(dauVao(state, 'pham_nhan', 'mortal_1'));
    const dem = new Map<string, number>();
    for (const c of kq.daChon) dem.set(c.nguonId, (dem.get(c.nguonId) ?? 0) + 1);
    const tran = Math.max(1, Math.floor(CFG.outputK * TUNING.rerank.tranTyLeMotNguon));
    for (const [nguon, n] of dem) expect(n, `nguồn ${nguon} chiếm ${n} chỗ`).toBeLessThanOrEqual(tran);
  });

  it('chunk cùng nguồn bị đẩy xuống dưới chunk khác nguồn có điểm thấp hơn', async () => {
    const { state } = theGioi();
    const kq = await truyHoi(dauVao(state, 'pham_nhan', 'mortal_1'));
    const ids = kq.daChon.map((c) => c.id);
    const hai = ids.indexOf('ck_dg_thung_lung_2');
    const khac = ids.indexOf('ck_dg_bo_song');
    // Bản thứ hai của cùng nguồn không được đứng trên một nguồn khác.
    if (hai >= 0 && khac >= 0) expect(khac).toBeLessThan(hai);
  });

  it('cache: cùng khóa thì tái dùng; đổi scopeKey thì KHÔNG', async () => {
    const { state } = theGioi();
    const kho = new Map<string, unknown>();
    const khoaCua = (k: Record<string, string>): string => Object.values(k).join('|');

    const cacheDoc = (k: Record<string, string>): Promise<never | undefined> =>
      Promise.resolve(kho.get(khoaCua(k)) as never | undefined);
    const cacheGhi = (k: Record<string, string>, v: unknown): Promise<void> => {
      kho.set(khoaCua(k), v);
      return Promise.resolve();
    };

    const dv = { ...dauVao(state, 'pham_nhan', 'mortal_1'), cacheDoc, cacheGhi } as never;
    const a = await truyHoi(dv);
    expect(a.run.cacheHit).toBe(false);
    const b = await truyHoi(dv);
    expect(b.run.cacheHit).toBe(true);

    // Đổi chủ thể là đổi `scopeKey` — [BB] 77.8 cấm dùng chéo.
    const c = await truyHoi({ ...dauVao(state, 'than', 'deity_1'), cacheDoc, cacheGhi } as never);
    expect(c.run.cacheHit).toBe(false);
  });

  it('scopeKey mã hóa đúng (mode, chủ thể)', () => {
    const { state } = theGioi();
    expect(scopeKeyCua(chieu(state, 'pham_nhan', 'mortal_1'))).toBe('pham_nhan:mortal_1');
    expect(scopeKeyCua(chieu(state, 'sang_the', null))).toBe('sang_the:root');
  });

  it('ba truy vấn được dựng riêng, và Q3 hỏi về TIỀN LỆ', () => {
    const { state } = theGioi();
    const view = chieu(state, 'sang_the', null);
    const tv = dungBaTruyVan(view, {
      tieuDiemIds: ['law_thuong'],
      loiNguoiChoi: 'ta ban một luật mới',
      machDangChieuId: null,
    });
    expect(tv.intentText).toBe('ta ban một luật mới');
    expect(tv.precedentText).toContain('đã từng xảy ra');
    expect(tv.focusText).not.toBe('');
  });
});

// ─────────────────────────────────────────── bộ đánh giá

describe('[BB] 77.10 — bộ đánh giá retrieval có baseline', () => {
  const ca: RetrievalEvalCase = {
    id: 'eval_1',
    mode: 'pham_nhan',
    chuTheId: 'mortal_1',
    task: 'narrate_scene',
    query: 'Luật của thế giới này là gì?',
    relevantChunkIds: ['dung_1', 'dung_2'],
    forbiddenChunkIds: ['cam_1'],
    diversityGroups: {},
  };

  it('chấm đúng Recall@20, MRR, nDCG@10 và forbidden recall', () => {
    const m = chamMotCase(
      {
        caseId: ca.id,
        orderedChunkIds: ['dung_1', 'nhieu', 'dung_2'],
        nguonIds: ['n1', 'n2', 'n3'],
        latencyMs: 12,
        daFallback: false,
        tokenSauRerank: 300,
        modeUsed: 'heuristic',
      },
      ca,
    );
    expect(m.recallAt20).toBe(1);
    expect(m.mrr).toBe(1);
    expect(m.forbiddenRecall).toBe(0);
    expect(m.diversity).toBe(1);
  });

  it('[BB] chunk cấm lọt ra ở BẤT KỲ hạng nào cũng làm forbidden recall khác 0', () => {
    const m = chamMotCase(
      {
        caseId: ca.id,
        // Hạng 47 — ngoài mọi top-K, nhưng nó ĐÃ được reranker nhìn thấy.
        orderedChunkIds: [...Array.from({ length: 46 }, (_, i) => `x${i}`), 'cam_1'],
        nguonIds: [],
        latencyMs: 1,
        daFallback: false,
        tokenSauRerank: 0,
        modeUsed: 'heuristic',
      },
      ca,
    );
    expect(m.forbiddenRecall).toBe(1);
    expect(congEval(tongKet([m], [1]), null)[0]?.dat).toBe(false);
  });

  it('cổng tuyệt đối: forbidden = 0, đa dạng nguồn, fallback dưới 30%', () => {
    const m = chamMotCase(
      {
        caseId: ca.id,
        orderedChunkIds: ['dung_1', 'dung_2'],
        nguonIds: ['n1', 'n2'],
        latencyMs: 5,
        daFallback: false,
        tokenSauRerank: 100,
        modeUsed: 'heuristic',
      },
      ca,
    );
    const cong = congEval(tongKet([m], [5]), null);
    expect(cong.every((c) => c.dat)).toBe(true);
  });

  it('so với baseline: nDCG tụt thì cổng ĐỎ, không im lặng', () => {
    const tot = tongKet(
      [
        chamMotCase(
          {
            caseId: 'a',
            orderedChunkIds: ['dung_1', 'dung_2'],
            nguonIds: ['n1', 'n2'],
            latencyMs: 5,
            daFallback: false,
            tokenSauRerank: 100,
            modeUsed: 'heuristic',
          },
          ca,
        ),
      ],
      [5],
    );
    const te = tongKet(
      [
        chamMotCase(
          {
            caseId: 'a',
            orderedChunkIds: ['nhieu', 'nhieu2', 'dung_1', 'dung_2'],
            nguonIds: ['n1', 'n2', 'n3', 'n4'],
            latencyMs: 5,
            daFallback: false,
            tokenSauRerank: 100,
            modeUsed: 'proxy_cross_encoder',
          },
          ca,
        ),
      ],
      [5],
    );
    const cong = congEval(te, tot);
    expect(cong.find((c) => c.ten.includes('nDCG@10 không thấp hơn baseline'))?.dat).toBe(false);
  });

  it('bộ đánh giá chạy được trên đường ống thật ở cả hai mode, và cả hai đều sạch', async () => {
    const { state } = theGioi();
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    const CAM = ['ck_cam'];
    const chunks: Chunk[] = [
      ck('ck_dung', { noiDung: 'kẻ mang dấu máu làm ô uế người đứng gần', entityIds: ['law_thuong'] }),
      ck('ck_nhieu', { nguonId: 'n2', noiDung: 'lễ hội thuyền hoa chín ngày', entityIds: ['place_a'] }),
      ck('ck_cam', {
        nguonId: 'n3',
        noiDung: 'văn bản luật gốc',
        entityIds: ['law_thuong'],
        tamNhin: { tangToiThieu: 'sang_the', vungHanChe: [], domainHanChe: [], laTinDon: false },
      }),
    ];
    const chung = {
      view,
      chunks,
      task: 'narrate_scene' as const,
      truyVan: { focusText: 'luật', intentText: 'dấu máu ô uế', precedentText: '' },
      tieuDiemIds: ['law_thuong'],
      machDangChieuId: null,
      tuning: TUNING,
      nganSachToken: 2_000,
      tyLeToken: 3.2,
      seed: 's',
      triThuc: 50,
      vungIds: new Set<string>(),
      domainIds: new Set<string>(),
    };

    const base = await truyHoi({ ...chung, config: CFG }, new Set(CAM));
    const sem = await truyHoi(
      {
        ...chung,
        config: RerankConfigSchema.parse({ endpoint: { mode: 'proxy_cross_encoder', proxyUrl: 'x' } }),
        adapter: mockReranker(),
      },
      new Set(CAM),
    );

    const caTest: RetrievalEvalCase = {
      id: 'pipeline',
      mode: 'pham_nhan',
      chuTheId: 'mortal_1',
      task: 'narrate_scene',
      query: 'dấu máu',
      relevantChunkIds: ['ck_dung'],
      forbiddenChunkIds: CAM,
      diversityGroups: {},
    };

    for (const kq of [base, sem]) {
      const m = chamMotCase(
        {
          caseId: caTest.id,
          orderedChunkIds: kq.ketQua.orderedChunkIds,
          nguonIds: kq.daChon.map((c) => c.nguonId),
          latencyMs: kq.run.latencyMs,
          daFallback: kq.run.fallbackReason !== '',
          tokenSauRerank: kq.tongToken,
          modeUsed: kq.run.modeUsed,
        },
        caTest,
      );
      // [BB] Cổng cứng, cả hai mode.
      expect(m.forbiddenRecall).toBe(0);
      expect(m.recallAt20).toBe(1);
    }
  });
});

// ─────────────────────────────────────────── bộ đánh giá dựng từ thế giới

describe('[BB] 77.10 — bộ đề tự nhãn từ sự thật engine', () => {
  it('dựng được bài thi từ chính luật chống rò rỉ của 18.2', () => {
    const { state } = theGioi();
    const de = boDeTuTheGioi(state);
    expect(de.length).toBeGreaterThan(0);

    // Mỗi bài phải có CẢ hai vế; một bài chỉ có vế đúng thì không đo được gì.
    for (const bt of de) {
      expect(bt.ca.relevantChunkIds.length).toBeGreaterThan(0);
      expect(bt.ca.forbiddenChunkIds.length).toBeGreaterThan(0);
      // Và hai vế KHÔNG được giao nhau — nếu giao thì nhãn tự mâu thuẫn.
      const dung = new Set(bt.ca.relevantChunkIds);
      for (const cam of bt.ca.forbiddenChunkIds) expect(dung.has(cam)).toBe(false);
    }
  });

  it('bài thi về luật: diễn giải là đúng, văn bản gốc và kẽ hở là cấm', () => {
    const { state } = theGioi();
    const bt = boDeTuTheGioi(state).find((x) => x.ca.id.startsWith('tg_luat_'));
    expect(bt).toBeDefined();
    expect(bt?.ca.relevantChunkIds.every((id) => id.startsWith('ck_dg_'))).toBe(true);
    expect(bt?.ca.forbiddenChunkIds.some((id) => id.startsWith('ck_luat_'))).toBe(true);
  });

  it('chạy trên ĐÚNG đường ống của lượt chơi, và cổng cứng đều đạt', async () => {
    const { state } = theGioi();
    const kq = await chayBoDanhGia(state, {
      config: CFG,
      tuning: TUNING,
      nganSachToken: 4_000,
      tyLeToken: 3.2,
    });
    expect(kq.soBai).toBeGreaterThan(0);
    // [BB] Cổng cứng nhất của cả Phase 8.
    expect(kq.tongKet.forbiddenRecall).toBe(0);
    expect(kq.cong.find((c) => c.ten.includes('forbidden recall'))?.dat).toBe(true);
    // Thông điệp nói RÕ cổng nào trượt — một `false` trần không giúp ai sửa được gì.
    expect(
      kq.dat,
      kq.cong
        .filter((c) => !c.dat)
        .map((c) => `${c.ten}: ${c.chiTiet}`)
        .join(' | '),
    ).toBe(true);
  });

  it('bật semantic vẫn giữ forbidden recall bằng 0, và có baseline để so', async () => {
    const { state } = theGioi();
    const base = await chayBoDanhGia(state, {
      config: CFG,
      tuning: TUNING,
      nganSachToken: 4_000,
      tyLeToken: 3.2,
    });
    const sem = await chayBoDanhGia(state, {
      config: RerankConfigSchema.parse({ endpoint: { mode: 'proxy_cross_encoder', proxyUrl: 'x' } }),
      tuning: TUNING,
      nganSachToken: 4_000,
      tyLeToken: 3.2,
      adapter: mockReranker(),
      baseline: base.tongKet,
    });
    expect(sem.tongKet.forbiddenRecall).toBe(0);
    // Có baseline thì bảng cổng dài hơn: ba cổng tuyệt đối cộng ba cổng so sánh.
    expect(sem.cong.length).toBeGreaterThan(base.cong.length);
  });

  it('thế giới chưa có gì để đo thì NÓI THẾ, không bịa một bài thi luôn đạt', async () => {
    const trong = taoState(
      (() => {
        const ct = KhoiTaoWorldSchema.parse({
          cua: 'hu_vo',
          seed: 'trong',
          worldId: 'w',
          branchId: 'br_goc',
        });
        return moThuGioi(ct).world;
      })(),
    );
    const kq = await chayBoDanhGia(trong, {
      config: CFG,
      tuning: TUNING,
      nganSachToken: 1_000,
      tyLeToken: 3.2,
    });
    expect(kq.soBai).toBe(0);
    expect(kq.dat).toBe(false);
    expect(kq.moTa).toContain('Chưa đo được gì');
  });
});
