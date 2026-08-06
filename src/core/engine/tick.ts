/**
 * Tick engine — Phần 24 [BB].
 *
 * Mười bốn bước, thứ tự DUY NHẤT. Phase 3 cài các bước engine thuần cần thiết cho
 * lát dọc offline; các bước còn lại đã có chỗ đứng và sẽ được nối ở Phase 5–8.
 *
 * [BB] 24.1 — bước 1–11 và 14 là engine thuần, deterministic theo seed.
 * Chỉ bước 8, 12, 13 gọi LLM. Chạy 1000 tick không LLM phải cho kết quả GIỐNG HỆT
 * nhau với cùng seed.
 */
import type { Event, PatchOp } from '../contracts/core.js';
import type { WorldState } from './state.js';
import { rngCuaTick } from './rng.js';
import { taoEvent } from './transaction.js';
import type { Tuning } from '../tuning/schema.js';
import { vongKetTinh } from '../vatly/vongKetTinh.js';
import { apLuat } from '../vatly/apLuat.js';

export type BuocTick = {
  readonly so: number;
  readonly id: string;
  readonly ten: string;
  /** true nếu bước cần LLM — Phase 3 bỏ qua chúng hoàn toàn. */
  readonly canLlm: boolean;
};

/** Mười bốn bước của Phần 24.1, đúng thứ tự. */
export const MUOI_BON_BUOC: readonly BuocTick[] = [
  { so: 1, id: 'thoi_gian_moi_truong', ten: 'Thời gian, mùa, môi trường, dân số, kinh tế', canLlm: false },
  { so: 2, id: 'ap_luat', ten: 'Áp luật — bốn tầng lan truyền', canLlm: false },
  { so: 3, id: 'utility_t1', ten: 'Utility AI T1', canLlm: false },
  { so: 4, id: 'sinh_loi_cau', ten: 'Sinh lời cầu từ T1 bế tắc', canLlm: false },
  { so: 5, id: 'so_nhan_qua', ten: 'Kiểm Sổ Nhân Quả', canLlm: false },
  { so: 6, id: 'ke_thu', ten: 'Kẻ thù vĩnh cửu — kiểm nhịp trỗi dậy', canLlm: false },
  { so: 7, id: 'cap_nhat_khai_niem', ten: 'Cập nhật Khái Niệm', canLlm: false },
  { so: 8, id: 'ket_tinh_luat', ten: 'Kết tinh luật mới', canLlm: true },
  { so: 9, id: 'phan_ky', ten: 'Phân kỳ phân thân', canLlm: false },
  { so: 10, id: 'giao_ly_sai_lech', ten: 'Giáo lý sai lệch — tăng doLech', canLlm: false },
  { so: 11, id: 'quet_lo_hong', ten: 'Quét lỗ hổng', canLlm: false },
  { so: 12, id: 't2_batch', ten: 'T2 batch', canLlm: true },
  { so: 13, id: 'giai_lo_hong', ten: 'Giải lỗ hổng', canLlm: true },
  { so: 14, id: 'event_bus', ten: 'Event bus → tin đồn, điềm báo, hàng cầu nguyện', canLlm: false },
];

export type TuyChonTick = {
  /** [BB] Phase 3 luôn `false`: lát dọc phải chơi được không AI. */
  choPhepLlm?: boolean;
  tuning: Tuning;
  /**
   * Bộ chạy tiến trình nền của Phase 5.
   *
   * Tiêm vào thay vì import thẳng, vì `engine/` không được phụ thuộc `world/`
   * (3.2). Bỏ trống thì tick chạy đúng như Phase 3 — hữu ích cho test lõi.
   */
  tienTrinhNen?: BoChayTienTrinh;
  soBuocGop?: number;
};

/** Chữ ký tối thiểu mà tick cần từ scheduler của `world/process`. */
export type BoChayTienTrinh = (
  state: WorldState,
  tuyChon: { tick: number; eventId: string; tuning: Tuning; soBuocGop?: number },
) => {
  patches: readonly PatchOp[];
  suKien: readonly {
    loai: string;
    mucDo: 'thuong' | 'lon' | 'trong_dai';
    moTa: string;
    tienTrinhId: string;
    chuTheIds: readonly string[];
    locationId: string | null;
    payload: Readonly<Record<string, unknown>>;
  }[];
  chanDoan: readonly { ma: string; muc: string; tienTrinhIds: readonly string[]; thongDiep: string }[];
  daChay: readonly string[];
};

type NgocCanhBuoc = {
  state: WorldState;
  /** Mốc trước bước này. Một bước có thể dài nhiều tick — xem `soChuKyDaQua()`. */
  tickCu: number;
  tickMoi: number;
  eventId: string;
  tuning: Tuning;
  seed: string;
};

/** Đọc một aspect của entity dưới dạng object có thể sửa. */
function aspect(state: WorldState, id: string, ten: string): Record<string, unknown> | undefined {
  const e = state.entities.get(id);
  const a = e?.aspects[ten];
  return a && typeof a === 'object' ? (a as Record<string, unknown>) : undefined;
}

const set = (id: string, path: string, value: unknown, evId: string): PatchOp => ({
  op: 'set',
  target: { table: 'entities', id, path },
  value,
  sourceEventId: evId,
});

/**
 * Bao nhiêu chu kỳ đã trôi qua giữa hai mốc tick.
 *
 * ── Vì sao không dùng `tickMoi % n === 0` ──
 *
 * Vì một bước engine KHÔNG luôn dài một tick. `tuaThoiGian()` gộp tới bốn trăm
 * tick vào một bước ở nhịp `vinh_kiep` (71.6), nên phép chia lấy dư sẽ nhảy qua
 * mọi mốc nằm giữa: một thế kỷ trôi qua mà không thế hệ nào hiểu sai thêm một
 * chữ nào, không lỗ hổng nào được quét, không khái niệm nào lên bậc.
 *
 * Đếm số lần vượt mốc thì đúng ở cả hai nhịp — và ở bước dài một tick nó cho
 * đúng 0 hoặc 1, tức là y hệt phép chia lấy dư cũ.
 */
function soChuKyDaQua(nc: NgocCanhBuoc, chuKy: number): number {
  if (chuKy <= 0) return 0;
  return Math.max(0, Math.floor(nc.tickMoi / chuKy) - Math.floor(nc.tickCu / chuKy));
}

// ─────────────────────────────────────────── các bước đã cài

/**
 * Bước 1 — thời gian trôi.
 *
 * Từ Phase 5, dân số và kinh tế là việc của `world/process` (Phần 71.2), không
 * còn là một bước ngẫu nhiên ở đây. Hàm này chỉ còn lo những vùng CHƯA có aspect
 * nền — thế giới Phase 3 cũ, hoặc vùng do người chơi vừa tạo bằng `HIỆN` mà chưa
 * được gieo. Đụng vào vùng đã có `dan_cu` sẽ làm vỡ `dan_so_khop_cohort`.
 */
function buoc1(nc: NgocCanhBuoc): PatchOp[] {
  const ra: PatchOp[] = [];
  const rng = rngCuaTick(nc.seed, nc.tickMoi, 'thoi_gian');

  for (const id of [...nc.state.entities.keys()].sort()) {
    const e = nc.state.entities.get(id);
    if (e?.aspects['dan_cu'] !== undefined) continue;
    const sp = aspect(nc.state, id, 'spatial');
    if (!sp) continue;
    const danSo = typeof sp['danSo'] === 'number' ? (sp['danSo'] as number) : 0;
    if (danSo <= 0) continue;
    // Biến động dân số nhỏ, deterministic. Không bao giờ xuống dưới 0.
    const delta = rng.khoang(-2, 3);
    const moi = Math.max(0, danSo + delta);
    ra.push(set(id, 'aspects.spatial.danSo', moi, nc.eventId));
  }
  return ra;
}

/**
 * Bước 10 — giáo lý sai lệch. [BB] Phần 10.1: TẦNG 2 BẮT BUỘC SAI.
 * `doLech` tăng `tuning.luat.doLechDienGiaiMoiTheHe` mỗi thế hệ, giảm theo tri thức vùng.
 * Diễn giải đúng 100% là BUG, không phải tính năng.
 */
function buoc10(nc: NgocCanhBuoc): PatchOp[] {
  const ra: PatchOp[] = [];
  const soTheHe = soChuKyDaQua(nc, 30);
  if (soTheHe === 0) return ra;

  for (const id of [...nc.state.entities.keys()].sort()) {
    const l = aspect(nc.state, id, 'lawful');
    if (!l) continue;
    const ds = l['dienGiai'];
    if (!Array.isArray(ds)) continue;

    const moi = ds.map((d) => {
      const o = d as { doLech?: number; theHe?: number };
      const cu = typeof o.doLech === 'number' ? o.doLech : 0;
      const tang = nc.tuning.luat.doLechDienGiaiMoiTheHe * soTheHe;
      return { ...o, doLech: Math.min(100, cu + tang), theHe: (o.theHe ?? 0) + soTheHe };
    });
    ra.push(set(id, 'aspects.lawful.dienGiai', moi, nc.eventId));
  }
  return ra;
}

/**
 * Bước 7 — cập nhật Khái Niệm, và cả dòng chảy rơi ra từ đó.
 *
 * ── Bước này từng chỉ làm một phần mười việc của nó ──
 *
 * Bản cũ cộng trọng số theo đúng MỘT nguồn: diễn giải lệch, đọc qua link
 * `sinh_ra_tu`. Nguồn ấy có nghĩa, nhưng `sinh_ra_tu` chỉ tồn tại ở thế giới mẫu
 * và không tiến trình nào trong `world/process` tạo thêm một sợi nào — nên trong
 * một ván thật, trọng số của mọi khái niệm đứng yên vĩnh viễn.
 *
 * Và trọng số đứng yên thì cả Phần 42–44 đứng theo: không ai lên bậc, không luật
 * nào kết tinh, `hieuLuc` không bao giờ được tính lại, bảy trục Luật Nền vô danh
 * mãi mãi, bốn cơ chế phái sinh không bao giờ đủ điều kiện. Sáu hàm viết cho
 * đúng chuyện đó nằm trong `vatly/` mà không nơi nào gọi.
 *
 * `vongKetTinh()` là mắt xích nối. Nó thuần và deterministic, nên bước này vẫn
 * là `canLlm: false` và replay vẫn cho cùng một hash.
 *
 * ── Vì sao có nhịp quét ──
 *
 * Vòng ấy duyệt mọi entity và mọi link. Chạy mỗi tick trên một ván mười nghìn
 * nhịp là trả tiền cho một phép so gần như luôn cho cùng kết quả. `nhipQuetKetTinh`
 * mặc định 4 — một năm một lần, đúng nhịp mà thế giới này đo mọi thứ khác.
 */
function buoc7(nc: NgocCanhBuoc): { patches: PatchOp[]; suKien: UngVienSuKienTick[] } {
  const soVong = soChuKyDaQua(nc, Math.max(1, Math.floor(nc.tuning.khaiNiem.nhipQuetKetTinh)));
  if (soVong === 0) return { patches: [], suKien: [] };

  const kq = vongKetTinh({
    state: nc.state,
    tick: nc.tickMoi,
    eventId: nc.eventId,
    tuning: nc.tuning,
    // Một bước Diễn Hóa dài trăm năm phải cộng áp lực của trăm năm, không của một
    // vòng. Thiếu hệ số này thì tua nhanh làm thế giới NGỪNG lớn lên thay vì lớn
    // nhanh hơn — đúng ngược điều người chơi bấm nút để có.
    soVong,
  });
  return {
    patches: [...kq.patches],
    suKien: kq.suKien.map((sk) => ({
      loai: sk.loai,
      mucDo: sk.mucDo,
      moTa: sk.moTa,
      // Không thuộc `R.worldProcess`: đây là một bước của chính tick, và bản tin
      // chỉ dùng id này để nhóm nên nó không cần tra registry.
      tienTrinhId: 'vong_ket_tinh',
      chuTheIds: sk.chuTheIds,
      locationId: null,
      payload: sk.payload,
    })),
  };
}

/**
 * Bước 2 — áp luật. Xem `vatly/apLuat.ts` để biết ba hàng rào canh nó.
 *
 * Đây là chỗ câu "thế giới vận hành theo luật của chính nó" thôi là một lời hứa.
 * Trước bước này, `lawful.hieuUng` là dữ liệu không ai đọc.
 */
function buoc2(nc: NgocCanhBuoc): { patches: PatchOp[]; suKien: UngVienSuKienTick[] } {
  if (soChuKyDaQua(nc, Math.max(1, Math.floor(nc.tuning.luat.nhipApLuat))) === 0) {
    return { patches: [], suKien: [] };
  }
  const kq = apLuat(nc.state, { tick: nc.tickMoi, eventId: nc.eventId, tuning: nc.tuning });
  return {
    patches: [...kq.patches],
    suKien: kq.viec.map((v) => ({
      loai: 'ap_luat',
      mucDo: 'thuong' as const,
      moTa: `"${v.ten}" chạm tới ${v.soThucThe} kẻ trong thế giới (hiệu lực ${v.hieuLuc}%).`,
      tienTrinhId: 'ap_luat',
      chuTheIds: [v.luatId],
      locationId: null,
      payload: { luatId: v.luatId, hieuLuc: v.hieuLuc, soThucThe: v.soThucThe },
    })),
  };
}

/**
 * Mọi bước engine thuần của một nhịp — dùng chung cho `motTick()` và `tuaThoiGian()`.
 *
 * ── Vì sao phải tách ra ──
 *
 * `motTick()` là đường duy nhất chạy mười bốn bước, và nó được gọi từ **đúng một
 * chỗ** trong cả app: nút `tick`. Mọi cách khác mà thời gian trôi — nhịp nền cuối
 * mỗi lượt kể, và cả Diễn Hóa tua hàng thế kỷ — đi qua `tuaThoiGian()`, vốn chỉ
 * chạy mười tám tiến trình nền và **bỏ trọn mười bốn bước**.
 *
 * Hệ quả: trong một ván chơi bình thường, giáo lý không bao giờ lệch thêm, lỗ
 * hổng không bao giờ được quét, luật không bao giờ được áp, và không khái niệm
 * nào kết tinh. Người chơi tua một nghìn năm và thế giới quay về đúng chỗ cũ,
 * chỉ khác vài con số dân số.
 *
 * `tickCu` và `tickMoi` là hai mốc, không phải một số: ở `motTick` chúng cách
 * nhau một tick, ở `tuaThoiGian` chúng cách nhau tới bốn trăm. Mọi bước bên
 * trong đếm chu kỳ bằng `soChuKyDaQua()` nên chạy đúng ở cả hai.
 *
 * Bước 1 KHÔNG nằm đây: nó là đường dự phòng Phase 3 cho vùng chưa có `dan_cu`,
 * dùng RNG, và `tuaThoiGian` cố ý để dân số cho `world/process` lo (71.2).
 */
export function buocEngineThuan(nc: NgocCanhBuoc): {
  patches: PatchOp[];
  suKien: UngVienSuKienTick[];
} {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKienTick[] = [];

  for (const r of [buoc2(nc), buoc7(nc)]) {
    patches.push(...r.patches);
    suKien.push(...r.suKien);
  }
  patches.push(...buoc10(nc), ...buoc11(nc), ...buoc14(nc));
  return { patches, suKien };
}

/**
 * Bước 11 — quét lỗ hổng. Phase 3 chỉ cài một loại: thực thể mồ côi (Phần 6.3).
 * [BB] Lỗ hổng KHÔNG chặn gì; nó trở thành nội dung cho engine tự lấp sau.
 */
function buoc11(nc: NgocCanhBuoc): PatchOp[] {
  const ra: PatchOp[] = [];
  if (soChuKyDaQua(nc, 10) === 0) return ra;

  const bac = new Map<string, number>();
  for (const id of nc.state.entities.keys()) bac.set(id, 0);
  for (const lk of nc.state.links.values()) {
    if (lk.tickDut !== null) continue;
    bac.set(lk.tuId, (bac.get(lk.tuId) ?? 0) + 1);
    bac.set(lk.denId, (bac.get(lk.denId) ?? 0) + 1);
  }

  for (const [id, n] of [...bac.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (n > 0) continue;
    const gapId = `gap_mo_coi_${id}`;
    if (nc.state.gaps.has(gapId)) continue;
    ra.push({
      op: 'link',
      target: { table: 'gaps', id: gapId, path: '' },
      value: {
        id: gapId,
        branchId: nc.state.world.branchId,
        loai: 'mo_coi',
        chuTheId: id,
        moTa: `'${id}' chưa nối vào thế giới bằng quan hệ nào.`,
        uuTien: 80,
        lanThu: 0,
        trangThai: 'mo',
        tickPhatHien: nc.tickMoi,
      },
      sourceEventId: nc.eventId,
    });
  }
  return ra;
}

/** Bước 14 — chỉ số thế giới nhích theo trạng thái thật. */
function buoc14(nc: NgocCanhBuoc): PatchOp[] {
  const ra: PatchOp[] = [];
  if (soChuKyDaQua(nc, 20) === 0) return ra;

  // Mật độ liên kết: số cạnh còn hiệu lực trên mỗi entity.
  const soEntity = nc.state.entities.size;
  if (soEntity === 0) return ra;
  let canh = 0;
  for (const lk of nc.state.links.values()) if (lk.tickDut === null) canh++;
  const matDo = canh / soEntity;

  ra.push({
    op: 'set',
    target: { table: 'metrics', id: 'metrics', path: 'matDoLienKet' },
    value: Math.round(matDo * 100) / 100,
    sourceEventId: nc.eventId,
  });
  ra.push({
    op: 'set',
    target: { table: 'metrics', id: 'metrics', path: 'tickTinh' },
    value: nc.tickMoi,
    sourceEventId: nc.eventId,
  });
  return ra;
}

// ─────────────────────────────────────────── vòng lặp

export type KetQuaTick = {
  /** Event của tick này; rỗng nếu tick không sinh thay đổi nào. */
  events: readonly Event[];
  /** Bước nào bị bỏ vì cần LLM mà LLM đang tắt. */
  buocBoQua: readonly string[];
  /**
   * Chuyện đáng kể mà tiến trình nền vừa sinh ra.
   *
   * Đây là thứ vòng chat thật sự cần: nó trả lời "trong lúc ta nói chuyện thì
   * ngoài kia có gì". `world/banTin.ts` lọc nó theo điều chủ thể biết được.
   */
  suKien: readonly UngVienSuKienTick[];
  /** Chẩn đoán của scheduler (71.4 quy tắc 5) — vào bảng Tự Chẩn Đoán. */
  chanDoan: readonly ChanDoanTick[];
  /** Tiến trình nền đã chạy trong tick này. */
  tienTrinhDaChay: readonly string[];
};

export type UngVienSuKienTick = {
  loai: string;
  mucDo: 'thuong' | 'lon' | 'trong_dai';
  moTa: string;
  tienTrinhId: string;
  chuTheIds: readonly string[];
  locationId: string | null;
  payload: Readonly<Record<string, unknown>>;
};

export type ChanDoanTick = {
  ma: string;
  muc: string;
  tienTrinhIds: readonly string[];
  thongDiep: string;
};

/**
 * Chạy MỘT tick. Trả về Event chưa áp — người gọi đưa qua `apDungEvent`.
 *
 * [BB] Hàm này KHÔNG sửa `state`. Nó chỉ đọc và sinh Event.
 */
export function motTick(state: WorldState, tuyChon: TuyChonTick): KetQuaTick {
  const tickMoi = state.world.tick + 1;
  const eventId = `ev_tick_${state.world.branchId}_${tickMoi}`;
  const nc: NgocCanhBuoc = {
    state,
    tickCu: state.world.tick,
    tickMoi,
    eventId,
    tuning: tuyChon.tuning,
    seed: state.world.seed,
  };

  const patches: PatchOp[] = [];
  const boQua: string[] = [];
  const suKienBuoc: UngVienSuKienTick[] = [];

  /**
   * Tiến trình nền chạy TRƯỚC mười bốn bước.
   *
   * Lý do thứ tự: bước 7 (khái niệm) và bước 11 (lỗ hổng) đọc trạng thái thế
   * giới; nếu chúng chạy trước mùa màng và dân số thì chúng đọc thế giới của
   * tick trước. Scheduler đã trả state về nguyên trạng, nên chuỗi patch dưới đây
   * vẫn là một lô duy nhất áp một lần qua `apDungEvent`.
   */
  const nen = tuyChon.tienTrinhNen?.(state, {
    tick: tickMoi,
    eventId,
    tuning: tuyChon.tuning,
    ...(tuyChon.soBuocGop === undefined ? {} : { soBuocGop: tuyChon.soBuocGop }),
  });
  if (nen) patches.push(...nen.patches);

  for (const buoc of MUOI_BON_BUOC) {
    if (buoc.canLlm && tuyChon.choPhepLlm !== true) {
      boQua.push(buoc.id);
      continue;
    }
    switch (buoc.id) {
      case 'thoi_gian_moi_truong':
        patches.push(...buoc1(nc));
        break;
      case 'ap_luat': {
        const r = buoc2(nc);
        patches.push(...r.patches);
        suKienBuoc.push(...r.suKien);
        break;
      }
      case 'cap_nhat_khai_niem': {
        const r = buoc7(nc);
        patches.push(...r.patches);
        suKienBuoc.push(...r.suKien);
        break;
      }
      case 'giao_ly_sai_lech':
        patches.push(...buoc10(nc));
        break;
      case 'quet_lo_hong':
        patches.push(...buoc11(nc));
        break;
      case 'event_bus':
        patches.push(...buoc14(nc));
        break;
      default:
        // Bước đã khai nhưng chưa nối handler — Phase 5–8.
        break;
    }
  }

  const ev = taoEvent({
    id: eventId,
    branchId: state.world.branchId,
    tick: tickMoi,
    loai: 'tick',
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches,
    visibility: 'engine',
    source: 'engine',
    payload: { soPatch: patches.length, soTienTrinh: nen?.daChay.length ?? 0 },
  });

  return {
    events: [ev],
    buocBoQua: boQua,
    // Chuyện do chính mười bốn bước sinh ra đứng SAU chuyện của tiến trình nền:
    // kết tinh là hệ quả của một năm vừa trôi, nên nó được kể sau cái năm ấy.
    suKien: [...(nen ? nen.suKien : []), ...suKienBuoc],
    chanDoan: nen ? [...nen.chanDoan] : [],
    tienTrinhDaChay: nen ? [...nen.daChay] : [],
  };
}
