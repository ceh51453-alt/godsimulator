/**
 * Transaction — Phase 1 [BB].
 *
 * [BB] Đây là CỬA DUY NHẤT để state đổi. Không module nào được sửa `WorldState`
 * trực tiếp; mọi thay đổi phải đi qua `apDungEvent`.
 *
 * Trình tự:
 *   1. kiểm hợp lệ Event (schema, nhân quả, tick);
 *   2. snapshot state;
 *   3. áp patch theo kiểu tất-cả-hoặc-không;
 *   4. chạy invariant;
 *   5. vi phạm nặng → ROLLBACK về snapshot, Event KHÔNG vào log;
 *   6. sạch → commit và append Event.
 */
import { EventSchema } from '../contracts/core.js';
import type { Event, PatchOp } from '../contracts/core.js';
import type { WorldState, EventLog } from './state.js';
import { hashState } from './state.js';
import { apPatch, hoanTacPatch } from './patch.js';
import { chayInvariant } from './invariant.js';
import { hashCua } from './hash.js';
import { loi } from '../contracts/errors.js';
import type { KetQua, StructuredError } from '../contracts/errors.js';
import { dat, hong } from '../contracts/errors.js';

/**
 * Hash chính tắc của một Event, tính TRỪ chính trường `hash`.
 * Nhờ vậy `hash` xác thực được và không tự tham chiếu.
 */
export function hashEvent(e: Omit<Event, 'hash'> & { hash?: string }): string {
  const { hash: _bo, ...con } = e;
  void _bo;
  return hashCua(con);
}

/** Dựng Event đã có hash đúng. Không dùng thời gian máy — tick là đồng hồ duy nhất. */
export function taoEvent(tho: Omit<Event, 'hash'>): Event {
  const hash = hashEvent(tho);
  return EventSchema.parse({ ...tho, hash });
}

export type KetQuaApDung = {
  event: Event;
  /** Chỉ tính khi `tuyChon.tinhHash === true` — nếu không thì chuỗi rỗng. */
  hashTruoc: string;
  hashSau: string;
  soBanGhiDoi: number;
  canhBao: readonly StructuredError[];
};

export type TuyChonApDung = {
  /**
   * Tính hash state trước/sau mỗi Event.
   * Mặc định **tắt**: hash toàn state là O(kích thước thế giới), bật nó cho mỗi
   * Event sẽ biến replay thành O(n²). Replay chỉ cần hash ở cuối.
   */
  tinhHash?: boolean;
};

/** Kiểm nhân quả — Phần 61.3 và cổng Phase 1 "Event cause không có cycle/tương lai". */
export function kiemNhanQua(e: Event, log: EventLog): StructuredError[] {
  const errs: StructuredError[] = [];

  for (const causeId of e.causeEventIds) {
    if (causeId === e.id) {
      errs.push(loi('event', 'CAUSE_TU_THAM_CHIEU', `Event '${e.id}' tự nhận mình là nguyên nhân.`));
      continue;
    }
    const cause = log.theoId(causeId);
    if (!cause) {
      errs.push(
        loi(
          'event',
          'CAUSE_KHONG_TON_TAI',
          `Event '${e.id}' trỏ nguyên nhân '${causeId}' không có trong log.`,
        ),
      );
      continue;
    }
    if (cause.tick > e.tick) {
      // [BB] Nguyên nhân không được đến từ tương lai.
      errs.push(
        loi(
          'event',
          'CAUSE_TU_TUONG_LAI',
          `Event '${e.id}' ở tick ${e.tick} nhận nguyên nhân '${causeId}' ở tick ${cause.tick}.`,
        ),
      );
    }
  }

  if (log.theoId(e.id)) {
    errs.push(loi('event', 'EVENT_TRUNG_ID', `Event '${e.id}' đã có trong log — log là append-only.`));
  }

  return errs;
}

/**
 * Áp một Event vào state trong một transaction.
 *
 * `state` bị sửa TẠI CHỖ khi thành công; khi thất bại nó được khôi phục nguyên
 * vẹn từ snapshot, nên gọi hàm này an toàn kể cả với patch độc hại.
 */
export function apDungEvent(
  state: WorldState,
  event: Event,
  log: EventLog,
  tuyChon: TuyChonApDung = {},
): KetQua<KetQuaApDung> {
  const tinhHash = tuyChon.tinhHash === true;
  const hashTruoc = tinhHash ? hashState(state) : '';

  // ── 1. hợp lệ về schema và hash ──
  const parsed = EventSchema.safeParse(event);
  if (!parsed.success) {
    return hong([
      loi('event', 'EVENT_KHONG_HOP_LE', 'Event không đúng schema.', {
        details: { issues: parsed.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`) },
      }),
    ]);
  }
  const e = parsed.data;

  const hashDung = hashEvent(e);
  if (e.hash !== hashDung) {
    return hong([
      loi('event', 'EVENT_HASH_SAI', `Event '${e.id}' có hash không khớp nội dung.`, {
        details: { mongDoi: hashDung, nhanDuoc: e.hash },
        recoverable: false,
      }),
    ]);
  }

  if (e.branchId !== state.world.branchId) {
    return hong([
      loi(
        'event',
        'EVENT_SAI_NHANH',
        `Event '${e.id}' thuộc nhánh '${e.branchId}', state đang ở '${state.world.branchId}'.`,
      ),
    ]);
  }

  if (e.tick < state.world.tick) {
    return hong([
      loi(
        'event',
        'EVENT_LUI_TICK',
        `Event '${e.id}' ở tick ${e.tick} nhưng world đã ở tick ${state.world.tick}.`,
      ),
    ]);
  }

  const loiNhanQua = kiemNhanQua(e, log);
  if (loiNhanQua.length > 0) return hong(loiNhanQua);

  // Mọi patch phải khai đúng Event sinh ra nó.
  const patchLacChu = e.patches.filter((p: PatchOp) => p.sourceEventId !== e.id);
  if (patchLacChu.length > 0) {
    return hong([
      loi(
        'patch',
        'PATCH_SAI_NGUON',
        `${patchLacChu.length} patch trong Event '${e.id}' khai sourceEventId khác.`,
      ),
    ]);
  }

  // ── 2 + 3. áp patch (đã là tất-cả-hoặc-không, và trả thông tin hoàn tác chính xác) ──
  const rPatch = apPatch(state, e.patches);
  if (!rPatch.ok) {
    // `apPatch` không ghi gì khi thất bại, nên state vẫn nguyên vẹn.
    return hong(rPatch.errors, rPatch.warnings);
  }

  // Tick của world tiến theo Event, không theo đồng hồ máy.
  // Nếu chính lô patch đã chạm bảng `worlds`, thông tin hoàn tác đã giữ bản gốc
  // của cả world — lúc đó không được khôi phục tick/version thủ công nữa.
  const worldDaTrongHoanTac = rPatch.value.hoanTac.truoc.has('worlds|worlds');
  const tickCu = state.world.tick;
  const versionCu = state.world.version;
  if (e.tick > state.world.tick) state.world.tick = e.tick;
  state.world.version += 1;

  // ── 4. invariant, chỉ trên phạm vi đã bị chạm ──
  const phamVi = {
    ...rPatch.value.phamVi,
    chamWorld: true, // tick và version vừa đổi
  };
  const rInv = chayInvariant(state, phamVi);
  if (!rInv.dat) {
    // ── 5. rollback chính xác: Event KHÔNG vào log ──
    hoanTacPatch(state, rPatch.value.hoanTac);
    if (!worldDaTrongHoanTac) {
      state.world.tick = tickCu;
      state.world.version = versionCu;
    }
    return hong([...rInv.viPhamNang], [...rPatch.warnings, ...rInv.canhBao]);
  }

  // ── 6. commit ──
  log.them(e);

  return dat(
    {
      event: e,
      hashTruoc,
      hashSau: tinhHash ? hashState(state) : '',
      soBanGhiDoi: rPatch.value.soBanGhiDoi,
      canhBao: [...rPatch.warnings, ...rInv.canhBao],
    },
    [...rPatch.warnings, ...rInv.canhBao],
  );
}

/** Áp một chuỗi Event. Dừng ở Event đầu tiên hỏng, các Event trước vẫn giữ. */
export function apDungChuoi(
  state: WorldState,
  events: readonly Event[],
  log: EventLog,
): KetQua<{ daApDung: number; hashCuoi: string }> {
  for (let i = 0; i < events.length; i++) {
    const r = apDungEvent(state, events[i] as Event, log);
    if (!r.ok) {
      return hong(
        [
          loi('transaction', 'CHUOI_DUT', `Chuỗi dừng ở Event thứ ${i + 1}/${events.length}.`, {
            details: { eventId: events[i]?.id ?? '' },
          }),
          ...r.errors,
        ],
        r.warnings,
      );
    }
  }
  return dat({ daApDung: events.length, hashCuoi: hashState(state) });
}
