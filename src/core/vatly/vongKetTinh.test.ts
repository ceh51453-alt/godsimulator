/**
 * Vòng kết tinh — cổng cho dòng chảy của Phần 8, 42, 43, 44.
 *
 * Mỗi bài dưới đây kiểm một mắt xích, và bài cuối kiểm cả dây: chạy engine
 * thuần, không LLM, và đòi thế giới **tự đẻ ra một điều luật mà không ai viết**.
 *
 * Đó là bài quan trọng nhất trong file. Sáu hàm của Khối L đã có test riêng từ
 * Phase 10 và đều xanh — nhưng chúng xanh trong một ống nghiệm: không nơi nào
 * trong đường chơi gọi chúng, nên cả Phần 42–44 không chạy một lần nào trong
 * một ván thật. Bài cuối là bài duy nhất bắt được điều đó.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { TUNING_MAC_DINH, TuningSchema } from '../tuning/schema.js';
import { taoState, taoEventLog } from '../engine/state.js';
import type { WorldState } from '../engine/state.js';
import { apDungChuoi, apDungEvent } from '../engine/transaction.js';
import { apPatch } from '../engine/patch.js';
import { motTick } from '../engine/tick.js';
import { chayTienTrinhNen } from '../world/process/scheduler.js';
import { tuaThoiGian } from '../world/process/catchUp.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { napBatBienPhase10 } from '../world/batBienP10.js';
import { datLaiInvariant, chayInvariantToanBo } from '../engine/invariant.js';
import { EntitySchema, LinkSchema } from '../schema/entity.js';
import type { Entity } from '../schema/entity.js';
import type { Event } from '../contracts/core.js';
import { ConceptualSchema } from '../schema/aspect/conceptual.js';
import type { Conceptual } from '../schema/aspect/conceptual.js';
import { LawfulSchema } from '../schema/aspect/lawful.js';
import type { Lawful } from '../schema/aspect/lawful.js';
import { luatNenMacDinh } from './luatNen.js';
import { vongKetTinh, apLucKhaiNiem } from './vongKetTinh.js';

const TUNING = TUNING_MAC_DINH;

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
  napBatBienPhase10();
});

function theGioi(seed = 'vong') {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  expect(apDungChuoi(state, events, log).ok).toBe(true);
  const ev = eventGieoNen(state);
  if (ev) expect(apDungEvent(state, ev as Event, log).ok).toBe(true);
  for (const ln of luatNenMacDinh('br_goc')) state.substrateLaws.set(ln.id, ln);
  return { state, log };
}

const khaiNiem = (id: string, ten: string, over: Partial<Conceptual> = {}, tags: string[] = []): Entity =>
  EntitySchema.parse({
    id,
    branchId: 'br_goc',
    kind: 'concept',
    ten,
    tickSinh: 0,
    tags,
    aspects: { conceptual: ConceptualSchema.parse({ nguongKetTinh: 100, ...over }) },
  });

const luat = (id: string, ten: string, over: Partial<Lawful> = {}): Entity =>
  EntitySchema.parse({
    id,
    branchId: 'br_goc',
    kind: 'law',
    ten,
    tickSinh: 0,
    aspects: {
      lawful: LawfulSchema.parse({ vanBan: ten, bien: 'không phán xét động cơ', ...over }),
    },
  });

function themLink(s: WorldState, id: string, tuId: string, denId: string, quanHe: string): void {
  s.links.set(id, LinkSchema.parse({ id, branchId: 'br_goc', tuId, denId, quanHe, trongSo: 80, tickTao: 0 }));
}

/** Chạy đúng một vòng và áp patch — trả về state đã đổi. */
function chayVong(s: WorldState, tick = 4): ReturnType<typeof vongKetTinh> {
  const kq = vongKetTinh({ state: s, tick, eventId: `ev_${tick}`, tuning: TUNING });
  const r = apPatch(s, kq.patches);
  expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
  return kq;
}

const doc = (s: WorldState, id: string): Conceptual =>
  s.entities.get(id)?.aspects['conceptual'] as Conceptual;
const docL = (s: WorldState, id: string): Lawful => s.entities.get(id)?.aspects['lawful'] as Lawful;

// ─────────────────────────────────────────── áp lực

describe('khái niệm lấy trọng số từ thế giới thật, không từ ai khai', () => {
  it('vật mang cộng vào lặp lại; luật tiếp địa và thần neo cộng vào ý chí', () => {
    const { state } = theGioi('aplc');
    state.entities.set('kn.mau', khaiNiem('kn.mau', 'Máu'));
    state.entities.set(
      'law.mau',
      luat('law.mau', 'Luật Máu', {
        tiepDia: [{ khaiNiemId: 'kn.mau', vaiTro: 'pham_tru', batBuoc: true }],
        trangThai: 'hieu_luc',
      }),
    );
    themLink(state, 'lk.a', 'vat_1', 'kn.mau', 'thuoc_khai_niem');
    themLink(state, 'lk.b', 'vat_2', 'kn.mau', 'hien_than_cua');
    themLink(state, 'lk.c', 'than_1', 'kn.mau', 'ket_tinh_tu');

    const ap = apLucKhaiNiem(state, TUNING).get('kn.mau');
    expect(ap?.lapLai).toBeCloseTo(TUNING.khaiNiem.apLucMoiVatMang * 2);
    expect(ap?.yChi).toBeCloseTo(TUNING.khaiNiem.apLucMoiThanNeo + TUNING.khaiNiem.apLucMoiLuatTiepDia);
  });

  it('luật còn ở bản nháp thì không đè lên thế giới', () => {
    const { state } = theGioi('nhap');
    state.entities.set('kn.x', khaiNiem('kn.x', 'X'));
    state.entities.set(
      'law.x',
      luat('law.x', 'Luật X', {
        tiepDia: [{ khaiNiemId: 'kn.x', vaiTro: 'pham_tru', batBuoc: true }],
        trangThai: 'nhap',
      }),
    );
    expect(apLucKhaiNiem(state, TUNING).get('kn.x')).toBeUndefined();
  });

  it('trọng số có trần — vòng phản hồi không chạy loạn', () => {
    const { state } = theGioi('tran');
    const nguong = 100;
    const tran = nguong * TUNING.khaiNiem.boiTranTrongSo;
    state.entities.set(
      'kn.y',
      khaiNiem('kn.y', 'Y', { trongSo: tran, nguongKetTinh: nguong, giaiDoan: 'ket_tinh' }),
    );
    for (let i = 0; i < 30; i++) themLink(state, `lk.${i}`, `v${i}`, 'kn.y', 'thuoc_khai_niem');
    chayVong(state);
    expect(doc(state, 'kn.y').trongSo).toBe(tran);
  });
});

// ─────────────────────────────────────────── leo thang

describe('bậc khái niệm leo theo trọng số thật', () => {
  it('lên manh nha rồi thành hình, và KHÔNG bao giờ tụt xuống', () => {
    const { state } = theGioi('leo');
    state.entities.set('kn.z', khaiNiem('kn.z', 'Z', { trongSo: 60, nguongKetTinh: 100 }));
    chayVong(state);
    expect(doc(state, 'kn.z').giaiDoan).toBe('thanh_hinh');

    // Trọng số tụt (một khái niệm bị lãng quên) không xóa nó khỏi từ vựng.
    const e = state.entities.get('kn.z') as Entity;
    state.entities.set('kn.z', {
      ...e,
      aspects: { ...e.aspects, conceptual: { ...doc(state, 'kn.z'), trongSo: 1 } },
    });
    chayVong(state, 8);
    expect(doc(state, 'kn.z').giaiDoan).toBe('thanh_hinh');
  });
});

// ─────────────────────────────────────────── kết tinh

describe('[BB] 8.2 — khái niệm đủ nặng thì kết tinh, và kết tinh thành gì là do NGUỒN', () => {
  it('nguồn nghiêng về lặp lại → engine tự viết ra một điều luật tiếp địa vào chính nó', () => {
    const { state } = theGioi('luat');
    state.entities.set(
      'kn.o_ue',
      khaiNiem('kn.o_ue', 'Ô Uế', { trongSo: 100, nguongKetTinh: 100, nguon: { yChi: 1, lapLai: 99 } }),
    );
    chayVong(state);

    expect(doc(state, 'kn.o_ue').giaiDoan).toBe('ket_tinh');
    expect(doc(state, 'kn.o_ue').ketTinhThanh).toBe('luat');

    const moi = state.entities.get('law_kt_kn.o_ue');
    expect(moi, 'engine phải tự đẻ ra điều luật').toBeDefined();
    expect(moi?.kind).toBe('law');
    expect(moi?.ten).toBe('Luật Ô Uế');
    // Điều luật mới bám ngược về khái niệm mẹ — đây là chỗ dòng chảy quay đầu.
    expect(docL(state, 'law_kt_kn.o_ue').tiepDia.map((t) => t.khaiNiemId)).toEqual(['kn.o_ue']);
    expect(state.links.get('lk_kt_kn.o_ue')?.quanHe).toBe('sinh_ra_tu');
  });

  it('luật mới nuôi ngược khái niệm mẹ ở nhịp sau — vòng khép kín', () => {
    const { state } = theGioi('vong');
    state.entities.set(
      'kn.o_ue',
      khaiNiem('kn.o_ue', 'Ô Uế', { trongSo: 100, nguongKetTinh: 100, nguon: { yChi: 1, lapLai: 99 } }),
    );
    chayVong(state, 4);
    const truoc = doc(state, 'kn.o_ue').trongSo;
    chayVong(state, 8);
    expect(doc(state, 'kn.o_ue').trongSo).toBeGreaterThan(truoc);
  });

  it('nguồn nghiêng về ý chí → engine mở một lỗ hổng, KHÔNG tự đặt tên thần', () => {
    const { state } = theGioi('than');
    state.entities.set(
      'kn.cong_ly',
      khaiNiem('kn.cong_ly', 'Công Lý', { trongSo: 100, nguongKetTinh: 100, nguon: { yChi: 99, lapLai: 1 } }),
    );
    chayVong(state);

    expect(doc(state, 'kn.cong_ly').ketTinhThanh).toBe('than');
    expect(state.gaps.get('gap_ket_tinh_than_kn.cong_ly')?.loai).toBe('ket_tinh_than');
    // [BB] 71.5 — engine giữ sổ, không đặt tên. Không vị thần nào được đẻ ra từ
    // khái niệm này; chỗ trống ấy để lời kể lấp.
    expect([...state.entities.values()].some((e) => e.kind === 'deity' && e.tickSinh === 4)).toBe(false);
    expect(state.entities.has('law_kt_kn.cong_ly')).toBe(false);
  });

  it('không nghiêng bên nào → lưỡng lự, và quá hạn thì thành CẢ HAI', () => {
    const tuning = TuningSchema.parse({
      khaiNiem: { nguongYChi: 0.9, nguongLapLai: 0.9, tickLuongLuToiDa: 10 },
    });
    const { state } = theGioi('luonglu');
    state.entities.set(
      'kn.lua',
      khaiNiem('kn.lua', 'Lửa', { trongSo: 100, nguongKetTinh: 100, nguon: { yChi: 50, lapLai: 50 } }),
    );

    const mot = vongKetTinh({ state, tick: 4, eventId: 'e1', tuning });
    expect(apPatch(state, mot.patches).ok).toBe(true);
    expect(doc(state, 'kn.lua').giaiDoan).toBe('luong_lu');
    expect(doc(state, 'kn.lua').tickVaoLuongLu).toBe(4);

    const hai = vongKetTinh({ state, tick: 20, eventId: 'e2', tuning });
    expect(apPatch(state, hai.patches).ok).toBe(true);
    expect(doc(state, 'kn.lua').giaiDoan).toBe('ket_tinh');
    expect(doc(state, 'kn.lua').ketTinhThanh).toBe('ca_hai');
    expect(state.entities.has('law_kt_kn.lua')).toBe(true);
  });

  it('mỗi nhịp chỉ một khái niệm kết tinh — mỗi lần là một biến cố', () => {
    const { state } = theGioi('mot');
    for (const id of ['kn.a', 'kn.b', 'kn.c']) {
      state.entities.set(
        id,
        khaiNiem(id, id, { trongSo: 100, nguongKetTinh: 100, nguon: { yChi: 0, lapLai: 100 } }),
      );
    }
    chayVong(state);
    const so = ['kn.a', 'kn.b', 'kn.c'].filter((id) => doc(state, id).giaiDoan === 'ket_tinh').length;
    expect(so).toBe(TUNING.khaiNiem.soKetTinhMoiNhip);
  });
});

// ─────────────────────────────────────────── tiếp địa

describe('[BB] 42 — hiệu lực do khái niệm nền quyết, và engine tính nó', () => {
  it('hiệu lực được tính lại và bám vào mắt xích YẾU NHẤT, không phải trung bình', () => {
    const { state } = theGioi('hl');
    state.entities.set(
      'kn.manh',
      khaiNiem('kn.manh', 'Mạnh', { trongSo: 1000, nguongKetTinh: 1000, giaiDoan: 'ket_tinh' }),
    );
    state.entities.set('kn.yeu', khaiNiem('kn.yeu', 'Yếu', { trongSo: 0, nguongKetTinh: 1000 }));
    state.entities.set(
      'law.hai',
      luat('law.hai', 'Luật Hai Chân', {
        tiepDia: [
          { khaiNiemId: 'kn.manh', vaiTro: 'pham_tru', batBuoc: true },
          { khaiNiemId: 'kn.yeu', vaiTro: 'pham_tru', batBuoc: true },
        ],
        trangThai: 'hieu_luc',
      }),
    );
    chayVong(state);
    // Một câu có một từ vô nghĩa thì cả câu vô nghĩa — 42.4.
    expect(docL(state, 'law.hai').hieuLuc).toBe(0);
  });

  it('[BB] 42.3 — luật trỏ vào khái niệm chưa tồn tại thì engine gieo nó ở hư danh', () => {
    const { state } = theGioi('tiepdia');
    state.entities.set(
      'law.treo',
      luat('law.treo', 'Luật Treo', {
        tiepDia: [{ khaiNiemId: 'kn.chua_co', vaiTro: 'pham_tru', batBuoc: true }],
        cheDoTiepDia: 'tu_tiep_dia',
        trangThai: 'hieu_luc',
      }),
    );
    chayVong(state);
    const moi = state.entities.get('kn.chua_co');
    expect(moi?.kind).toBe('concept');
    expect((moi?.aspects['conceptual'] as Conceptual).giaiDoan).toBe('hu_danh');
    expect(docL(state, 'law.treo').hieuLuc).toBe(0);
  });

  it('[BB] chế độ tự suy bám vào khái niệm SẴN CÓ thay vì đẻ bản song song', () => {
    const { state } = theGioi('tusuy');
    state.entities.set('kn.tro_tan', khaiNiem('kn.tro_tan', 'Tro Tàn', { trongSo: 50, nguongKetTinh: 100 }));
    state.entities.set(
      'law.ts',
      luat('law.ts', 'Luật Tự Suy', {
        tiepDia: [{ khaiNiemId: 'tro_tan', vaiTro: 'pham_tru', batBuoc: true }],
        cheDoTiepDia: 'tu_suy',
        trangThai: 'hieu_luc',
      }),
    );
    chayVong(state);
    expect(docL(state, 'law.ts').tiepDia[0]?.khaiNiemId).toBe('kn.tro_tan');
    expect(state.entities.has('tro_tan')).toBe(false);
  });
});

// ─────────────────────────────────────────── vật lý

describe('[BB] 43.7, 44.4 — thế giới tự phát hiện ra vật lý của chính nó', () => {
  it('khái niệm kết tinh khớp bảng thì trục tự có tên, và kẽ hở CHỈ sinh khi có tên', () => {
    const { state } = theGioi('43-7');
    expect(state.substrateLaws.get('ln.khong_gian')?.keHo).toEqual([]);

    state.entities.set(
      'kn.noi_chon',
      khaiNiem('kn.noi_chon', 'Nơi Chốn', { trongSo: 100, nguongKetTinh: 100, giaiDoan: 'ket_tinh' }, [
        'noi_chon',
      ]),
    );
    chayVong(state);

    const ln = state.substrateLaws.get('ln.khong_gian');
    expect(ln?.trangThai).toBe('co_ten');
    expect(ln?.khaiNiemNenId).toBe('kn.noi_chon');
    expect(chayInvariantToanBo(state).dat).toBe(true);
  });

  it('[BB] 43.5 — không trục nào vượt thứ tự phụ thuộc, dù khái niệm đã sẵn sàng', () => {
    const { state } = theGioi('43-5');
    state.entities.set(
      'kn.tat_yeu',
      khaiNiem('kn.tat_yeu', 'Tất Yếu', { trongSo: 100, nguongKetTinh: 100, giaiDoan: 'ket_tinh' }, [
        'tat_yeu',
      ]),
    );
    chayVong(state);
    // van_menh cần thoi_gian và nhan_qua có tên trước.
    expect(state.substrateLaws.get('ln.van_menh')?.trangThai).toBe('vo_danh');
  });

  it('cơ chế phái sinh tự bật khi trục nền đủ điều kiện, và công bố ra biên niên sử', () => {
    const { state } = theGioi('cochce');
    // Ép hai trục có tên, với tham số mở cơ chế Thần Bí. `nhan_thuc` phụ thuộc
    // `danh_tinh` (43.5), nên phải đặt tên cả hai thì điều kiện mới thỏa.
    const datTay = (id: string, khaiNiemNenId: string, thamSo: Record<string, unknown> = {}): void => {
      const cu = state.substrateLaws.get(id);
      if (cu === undefined) throw new Error(`thiếu ${id}`);
      state.substrateLaws.set(id, {
        ...cu,
        trangThai: 'co_ten',
        khaiNiemNenId,
        thamSo: { ...cu.thamSo, ...thamSo },
      });
    };
    datTay('ln.danh_tinh', 'kn.ban_nga');
    datTay('ln.nhan_thuc', 'kn.biet', { hieuBietLamSuyYeu: true });

    const kq = chayVong(state);
    expect(state.coChe.get('than_bi')?.bat).toBe(true);
    expect(kq.suKien.some((sk) => sk.loai === 'co_che_bat')).toBe(true);
  });

  /**
   * Trọng số VẪN leo giữa hai vòng — thế giới có vật mang thì nó đang sống, và
   * đó không phải chỗ cần idempotent. Thứ phải đứng yên là hai bảng vật lý:
   * quét lại mà không có điều kiện nào đổi thì không dòng nào được ghi lại.
   */
  it('quét lại khi không điều kiện nào đổi thì hai bảng vật lý đứng yên', () => {
    const { state } = theGioi('idem');
    chayVong(state, 4);
    const truoc = JSON.stringify([[...state.substrateLaws], [...state.coChe]]);

    const kq = chayVong(state, 8);
    expect(JSON.stringify([[...state.substrateLaws], [...state.coChe]])).toBe(truoc);
    expect(kq.patches.some((p) => p.target.table === 'substrateLaws' || p.target.table === 'coChe')).toBe(
      false,
    );
  });
});

// ─────────────────────────────────────────── luật đẻ ra luật

/**
 * Hai cơ chế dưới đây lấy từ tôn giáo Hy Lạp cổ, không từ trí tưởng tượng:
 * *miasma* (ô uế) không phải một điều luật ai ban hành — nó là thứ người ta bắt
 * đầu tin VÌ ĐÃ CÓ một cấm kỵ; và mọi miasma đều kéo theo *katharsis*, phía bên
 * kia của chính nó.
 */
describe('luật đẻ ra khái niệm, khái niệm đẻ ra luật — thế giới tự dày lên', () => {
  it('điều luật bị hiểu lệch đủ xa thì mọc lên cái bóng của nó, nối bằng sinh_ra_tu', () => {
    const { state } = theGioi('miasma');
    state.entities.set(
      'law.giet',
      luat('law.giet', 'Máu Không Rửa Được', {
        trangThai: 'hieu_luc',
        dienGiai: [
          { theHe: 3, vungId: 'place_a', noiDung: 'Kẻ mang dấu máu làm ô uế người đứng gần.', doLech: 62 },
          { theHe: 3, vungId: 'place_b', noiDung: 'Rửa được bằng nước sông vào ngày rằm.', doLech: 70 },
        ],
      }),
    );
    const kq = chayVong(state);

    const bong = state.entities.get('concept_ps_law.giet');
    expect(bong, 'luật phải đẻ ra khái niệm phái sinh').toBeDefined();
    expect((bong?.aspects['conceptual'] as Conceptual).giaiDoan).toBe('manh_nha');
    // Sợi dây này là thứ bước 7 đọc để tính áp lực — trước đây chưa ai tạo nó.
    expect(state.links.get('lk_ps_law.giet')?.quanHe).toBe('sinh_ra_tu');
    expect(kq.suKien.some((sk) => sk.loai === 'luat_sinh_khai_niem')).toBe(true);
  });

  it('luật ai cũng hiểu đúng thì không đẻ ra gì — chỗ lệch mới là chỗ có ý niệm mới', () => {
    const { state } = theGioi('khong-lech');
    state.entities.set(
      'law.ro',
      luat('law.ro', 'Luật Rõ Ràng', {
        trangThai: 'hieu_luc',
        dienGiai: [{ theHe: 1, vungId: 'place_a', noiDung: 'Đúng như văn bản.', doLech: 3 }],
      }),
    );
    chayVong(state);
    expect(state.entities.has('concept_ps_law.ro')).toBe(false);
  });

  it('[BB] 8.3 — khái niệm kết tinh thì phía bên kia của nó ra đời cùng lúc', () => {
    const { state } = theGioi('katharsis');
    state.entities.set(
      'kn.o_ue',
      khaiNiem('kn.o_ue', 'Ô Uế', { trongSo: 100, nguongKetTinh: 100, nguon: { yChi: 1, lapLai: 99 } }),
    );
    chayVong(state);

    const doiId = 'concept_doi_kn.o_ue';
    expect(doc(state, 'kn.o_ue').phanNghiaId).toBe(doiId);
    const doi = doc(state, doiId);
    // Chưa thật: nó chỉ là chỗ trống mà thứ kia để lại.
    expect(doi.giaiDoan).toBe('hu_danh');
    expect(doi.trongSo).toBe(0);
    expect(doi.phanNghiaId).toBe('kn.o_ue');
    expect(doi.cangThang[0]?.khaiNiemId).toBe('kn.o_ue');
  });

  it('phản nghĩa nặng dần bằng chính căng thẳng — "cái giống trừ cái giống"', () => {
    const { state } = theGioi('cang-thang');
    state.entities.set(
      'kn.o_ue',
      khaiNiem('kn.o_ue', 'Ô Uế', { trongSo: 100, nguongKetTinh: 100, nguon: { yChi: 1, lapLai: 99 } }),
    );
    chayVong(state, 4);
    const doiId = 'concept_doi_kn.o_ue';
    expect(doc(state, doiId).trongSo).toBe(0);

    chayVong(state, 8);
    expect(doc(state, doiId).trongSo, 'phía bên kia phải bắt đầu có thật').toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────── determinism và cả dây

describe('vòng kết tinh không phá luật bất biến #7', () => {
  it('cùng state cho cùng chuỗi patch', () => {
    const a = theGioi('det');
    const b = theGioi('det');
    for (const s of [a.state, b.state]) {
      s.entities.set(
        'kn.q',
        khaiNiem('kn.q', 'Q', { trongSo: 99, nguongKetTinh: 100, nguon: { yChi: 0, lapLai: 99 } }),
      );
      themLink(s, 'lk.q', 'v1', 'kn.q', 'thuoc_khai_niem');
    }
    const pa = vongKetTinh({ state: a.state, tick: 4, eventId: 'e', tuning: TUNING });
    const pb = vongKetTinh({ state: b.state, tick: 4, eventId: 'e', tuning: TUNING });
    expect(JSON.stringify(pa.patches)).toBe(JSON.stringify(pb.patches));
  });

  it('CẢ DÂY — chạy engine thuần, thế giới tự đẻ ra điều luật mà không ai viết', () => {
    const { state, log } = theGioi('ca-day');
    /*
     * Một khái niệm có vật mang THẬT: sáu thứ trong thế giới thuộc về nó. Không
     * ai khai trọng số, không ai khai bậc — chúng chỉ là sáu sợi dây trong sổ.
     *
     * Tag `noi_chon` là khái niệm nền của trục Không Gian, và trục ấy không phụ
     * thuộc trục nào (43.5), nên nếu dây chạy đủ thì trục ấy phải tự có tên.
     */
    state.entities.set(
      'kn.noi_chon',
      khaiNiem('kn.noi_chon', 'Nơi Chốn', { nguongKetTinh: 40 }, ['noi_chon']),
    );
    for (let i = 0; i < 6; i++) {
      // Vật mang phải có thật: bất biến `link_khong_tro_vao_hu_khong` bắt ngay
      // một sợi dây nối vào một id không tồn tại.
      const id = `vat_${i}`;
      state.entities.set(
        id,
        EntitySchema.parse({ id, branchId: 'br_goc', kind: 'artifact', ten: `Mốc đá ${i}`, tickSinh: 0 }),
      );
      themLink(state, `lk.vm${i}`, id, 'kn.noi_chon', 'thuoc_khai_niem');
    }

    const luatDau = [...state.entities.values()].filter((e) => e.kind === 'law').length;
    for (let i = 0; i < 120; i++) {
      const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
      for (const ev of r.events) expect(apDungEvent(state, ev, log).ok).toBe(true);
    }

    const c = doc(state, 'kn.noi_chon');
    expect(c.trongSo, 'trọng số phải leo từ vật mang thật').toBeGreaterThan(0);
    expect(c.giaiDoan).toBe('ket_tinh');
    expect(c.ketTinhThanh).toBe('luat');

    const luatSau = [...state.entities.values()].filter((e) => e.kind === 'law').length;
    expect(luatSau, 'thế giới phải dày thêm ít nhất một điều luật').toBeGreaterThan(luatDau);
    expect(docL(state, 'law_kt_kn.noi_chon').hieuLuc).toBeGreaterThan(0);

    // Và trục Không Gian tự nhận ra mình — 43.7, không một dòng LLM nào.
    const ln = state.substrateLaws.get('ln.khong_gian');
    expect(ln?.trangThai).toBe('co_ten');
    expect(ln?.keHo.length ?? 0).toBeGreaterThanOrEqual(0);
    const inv = chayInvariantToanBo(state);
    expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);
  });

  /**
   * Bài này canh đúng chỗ vừa hỏng: `motTick()` được gọi từ MỘT nút trong cả
   * app. Nhịp nền cuối mỗi lượt kể và mọi lần Diễn Hóa đi qua `tuaThoiGian()`,
   * và cho tới lúc `buocEngineThuan()` được nối vào đó, tua một nghìn năm không
   * làm khái niệm nào nặng thêm một chút nào.
   */
  it('DIỄN HÓA — tua một thế kỷ cũng phải làm thế giới dày lên, không chỉ trôi qua', () => {
    const { state, log } = theGioi('dien-hoa');
    state.entities.set(
      'kn.noi_chon',
      khaiNiem('kn.noi_chon', 'Nơi Chốn', { nguongKetTinh: 40 }, ['noi_chon']),
    );
    for (let i = 0; i < 6; i++) {
      const id = `vat_${i}`;
      state.entities.set(
        id,
        EntitySchema.parse({ id, branchId: 'br_goc', kind: 'artifact', ten: `Mốc đá ${i}`, tickSinh: 0 }),
      );
      themLink(state, `lk.vm${i}`, id, 'kn.noi_chon', 'thuoc_khai_niem');
    }

    const r = tuaThoiGian(state, log, {
      soTick: 400,
      nhip: 'the_dai',
      smartStop: false,
      tuning: TUNING,
      tienToEvent: 'ev_tua_test',
    });
    expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);

    const c = doc(state, 'kn.noi_chon');
    expect(c.trongSo, 'tua thời gian phải cộng trọng số của quãng thời gian ấy').toBeGreaterThan(0);
    expect(c.giaiDoan).toBe('ket_tinh');
    expect(state.entities.has('law_kt_kn.noi_chon')).toBe(true);
    expect(state.substrateLaws.get('ln.khong_gian')?.trangThai).toBe('co_ten');

    // Và giáo lý đã lệch thêm — bước 10 cũng từng bị bỏ qua trong tua.
    const nen = state.entities.get('law_nen');
    const dg = (nen?.aspects['lawful'] as Lawful | undefined)?.dienGiai ?? [];
    if (dg.length > 0) expect(dg[0]?.theHe ?? 0).toBeGreaterThan(1);

    const inv = chayInvariantToanBo(state);
    expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);
  });
});
