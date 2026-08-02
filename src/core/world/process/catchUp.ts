/**
 * Tua thời gian và Điểm Dừng Thông Minh — Phần 71.6 và 47.3 [BB].
 *
 * 71.6 đòi bốn điều:
 *   - chạy process theo cadence thời gian truyện;
 *   - gộp bước ổn định bằng công thức macro;
 *   - KHÔNG chạy một triệu vòng micro khi tua một kỷ nguyên;
 *   - cùng seed + state + action log phải replay cùng hash.
 *
 * Cách làm ở đây: một *bước tua* gộp `soBuocGop` tick truyện thành **một** lần
 * gọi handler, nhờ `gopTyLe()` cho các đại lượng tiệm cận. Tua một kỷ nguyên
 * (100 năm = 400 tick) ở nhịp `the_dai` tốn 10 bước, không phải 400.
 *
 * [BB] 47.3 — "Diễn Hóa không nên dừng khi hết số lượt. Nó nên dừng khi CÓ CHUYỆN
 * ĐÁNG XEM." Vì vậy Smart Stop không đếm lượt: nó nghe các Event candidate mức
 * `trong_dai` mà mười hai tiến trình đẻ ra, và dừng ngay tại mốc đó.
 */
import type { Event } from '../../contracts/core.js';
import type { WorldState, EventLog } from '../../engine/state.js';
import { apDungEvent, taoEvent } from '../../engine/transaction.js';
import type { Tuning } from '../../tuning/schema.js';
import type { NhipThoiGian } from '../../contracts/view.js';
import { loi } from '../../contracts/errors.js';
import type { KetQua, StructuredError } from '../../contracts/errors.js';
import { dat, hong } from '../../contracts/errors.js';
import { chayTienTrinhNen } from './scheduler.js';
import type { ChanDoanTienTrinh } from './scheduler.js';
import type { UngVienSuKien } from './types.js';
import { TICK_MOI_NAM } from '../../schema/aspect/substrate.js';

/**
 * Bao nhiêu tick truyện gộp vào một bước engine, theo nhịp của 24.2.
 *
 * `nhat` không gộp: nhịp ngày là nhịp của cảnh, và cảnh thì phải chạy từng bước.
 */
export const TICK_MOI_BUOC: Readonly<Record<NhipThoiGian, number>> = Object.freeze({
  nhat: 1,
  nien: 1,
  the_dai: TICK_MOI_NAM * 10,
  vinh_kiep: TICK_MOI_NAM * 100,
});

/** Điều kiện dừng engine tự tính được — tập con của bảng 47.3. */
export const DIEU_KIEN_DUNG = [
  'su_kien_trong_dai',
  'dan_so_sup_do',
  'chien_su_bung_no',
  'dich_lan_rong',
  'reality_tut_qua_20',
  'the_gioi_trong_rong',
] as const;
export type DieuKienDung = (typeof DIEU_KIEN_DUNG)[number];

export type TuyChonTua = {
  /** Số tick truyện muốn tua. */
  readonly soTick: number;
  readonly nhip: NhipThoiGian;
  /** [BB] 47.3 — mặc định BẬT. Tua mù cả trăm năm là bỏ lỡ toàn bộ giá trị. */
  readonly smartStop?: boolean;
  readonly tuning: Tuning;
  /** Bỏ trống thì nghe mọi điều kiện trong `DIEU_KIEN_DUNG`. */
  readonly dieuKien?: readonly DieuKienDung[];
  /** Tiền tố id Event, để hai lần tua không đụng id nhau. */
  readonly tienToEvent?: string;
};

export type MocDung = {
  readonly dieuKien: DieuKienDung;
  readonly tick: number;
  readonly moTa: string;
  readonly suKien: UngVienSuKien | null;
};

export type KetQuaTua = {
  readonly tickDau: number;
  readonly tickCuoi: number;
  /** Số lần gọi scheduler. So với `tickCuoi - tickDau` để chứng minh có gộp. */
  readonly soBuocEngine: number;
  readonly events: readonly Event[];
  readonly suKien: readonly UngVienSuKien[];
  readonly chanDoan: readonly ChanDoanTienTrinh[];
  readonly dung: MocDung | null;
  readonly canhBao: readonly StructuredError[];
};

function chonMocDung(
  suKien: readonly UngVienSuKien[],
  tick: number,
  bat: readonly DieuKienDung[],
): MocDung | null {
  const co = (d: DieuKienDung): boolean => bat.includes(d);

  for (const sk of suKien) {
    if (sk.loai === 'sup_do_dan_so' && co('dan_so_sup_do')) {
      return { dieuKien: 'dan_so_sup_do', tick, moTa: sk.moTa, suKien: sk };
    }
    if (sk.loai === 'xung_dot_bung_no' && co('chien_su_bung_no')) {
      return { dieuKien: 'chien_su_bung_no', tick, moTa: sk.moTa, suKien: sk };
    }
    if (sk.loai === 'dich_lan_rong' && co('dich_lan_rong')) {
      return { dieuKien: 'dich_lan_rong', tick, moTa: sk.moTa, suKien: sk };
    }
    if (sk.mucDo === 'trong_dai' && co('su_kien_trong_dai')) {
      return { dieuKien: 'su_kien_trong_dai', tick, moTa: sk.moTa, suKien: sk };
    }
  }
  return null;
}

/**
 * Tua thời gian.
 *
 * `state` bị sửa TẠI CHỖ qua `apDungEvent` — tức là vẫn đi đúng cửa duy nhất của
 * luật bất biến #4. Không có đường tắt nào ở đây.
 */
export function tuaThoiGian(state: WorldState, log: EventLog, tc: TuyChonTua): KetQua<KetQuaTua> {
  const tickDau = state.world.tick;
  const buocGop = Math.max(1, TICK_MOI_BUOC[tc.nhip]);
  const smart = tc.smartStop !== false;
  const bat = tc.dieuKien ?? DIEU_KIEN_DUNG;
  const tienTo = tc.tienToEvent ?? 'ev_tua';

  const soBuocMuon = Math.ceil(Math.max(0, tc.soTick) / buocGop);
  const tran = tc.tuning.worldProcess.maxCatchUpSteps;

  if (soBuocMuon > tran) {
    // [BB] 71.6 — thà từ chối tử tế còn hơn treo trình duyệt. Người chơi đổi
    // nhịp thô hơn là chạy được ngay.
    return hong([
      loi(
        'invariant',
        'TUA_VUOT_NGAN_SACH',
        `Tua ${tc.soTick} tick ở nhịp '${tc.nhip}' cần ${soBuocMuon} bước engine, ` +
          `vượt trần ${tran}. Hãy chọn nhịp thô hơn (the_dai / vinh_kiep) hoặc tua ngắn lại.`,
        { details: { soBuocMuon, tran, nhip: tc.nhip }, recoverable: true },
      ),
    ]);
  }

  const events: Event[] = [];
  const suKienTatCa: UngVienSuKien[] = [];
  const chanDoan: ChanDoanTienTrinh[] = [];
  const canhBao: StructuredError[] = [];
  const realityDau = state.metrics.realityIntegrity;

  let soBuocEngine = 0;
  let dung: MocDung | null = null;

  for (let i = 0; i < soBuocMuon; i++) {
    const tickMoi = state.world.tick + buocGop;
    const eventId = `${tienTo}_${state.world.branchId}_${tickMoi}`;

    const kq = chayTienTrinhNen(state, {
      tick: tickMoi,
      eventId,
      tuning: tc.tuning,
      soBuocGop: buocGop,
      // Xa ống kính thì chạy macro — đây là chỗ 71.3 gặp 71.6.
      phanGiai: buocGop > 1 ? 'macro' : undefined,
    });
    soBuocEngine++;
    chanDoan.push(...kq.chanDoan);
    suKienTatCa.push(...kq.suKien);

    const ev = taoEvent({
      id: eventId,
      branchId: state.world.branchId,
      tick: tickMoi,
      loai: 'tua_thoi_gian',
      actorIds: [],
      targetIds: [],
      causeEventIds: [],
      locationId: null,
      patches: [...kq.patches],
      visibility: 'engine',
      source: 'engine',
      payload: {
        nhip: tc.nhip,
        soBuocGop: buocGop,
        soPatch: kq.patches.length,
        soTienTrinh: kq.daChay.length,
      },
    });

    const r = apDungEvent(state, ev, log);
    if (!r.ok) {
      return hong(
        [loi('transaction', 'TUA_DUT', `Tua dừng ở tick ${tickMoi}: Event không áp được.`), ...r.errors],
        canhBao,
      );
    }
    canhBao.push(...r.warnings);
    events.push(ev);

    if (!smart) continue;

    dung = chonMocDung(kq.suKien, tickMoi, bat);
    if (!dung && bat.includes('reality_tut_qua_20') && realityDau - state.metrics.realityIntegrity > 20) {
      dung = {
        dieuKien: 'reality_tut_qua_20',
        tick: tickMoi,
        moTa: `Toàn Vẹn Thực Tại tụt từ ${realityDau} xuống ${state.metrics.realityIntegrity}.`,
        suKien: null,
      };
    }
    if (!dung && bat.includes('the_gioi_trong_rong') && khongConAi(state)) {
      dung = {
        dieuKien: 'the_gioi_trong_rong',
        tick: tickMoi,
        moTa: 'Không còn một người nào trong thế giới. Tua tiếp cũng không còn gì để xem.',
        suKien: null,
      };
    }
    if (dung) break;
  }

  return dat({
    tickDau,
    tickCuoi: state.world.tick,
    soBuocEngine,
    events,
    suKien: suKienTatCa,
    chanDoan,
    dung,
    canhBao,
  });
}

function khongConAi(state: WorldState): boolean {
  let coNoi = false;
  for (const e of state.entities.values()) {
    const dc = e.aspects['dan_cu'] as { cohort?: Record<string, number> } | undefined;
    if (!dc?.cohort) continue;
    coNoi = true;
    const t =
      (dc.cohort['child'] ?? 0) +
      (dc.cohort['youth'] ?? 0) +
      (dc.cohort['adult'] ?? 0) +
      (dc.cohort['elder'] ?? 0);
    if (t > 0) return false;
  }
  return coNoi;
}
