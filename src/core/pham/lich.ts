/**
 * Lịch một ngày — Phần 50.4, 70.3 [BB].
 *
 * ── Cổng Phase 7 đòi một câu rất cụ thể ──
 *
 * > "NPC ngoài cảnh giữ lịch và vị trí."
 *
 * Cách sai là mô phỏng từng NPC từng giờ. Cách đúng là: **lịch là một hàm thuần
 * của hoàn cảnh**, nên không cần mô phỏng gì cả — hỏi lúc nào cũng ra đúng câu
 * trả lời, và câu trả lời đổi khi hoàn cảnh đổi.
 *
 * Nhờ vậy một NPC ở làng bên, không ai nhìn suốt bốn mươi năm, vẫn "đang ở ngoài
 * ruộng lúc này" — và khi người chơi đi tới, họ ở ngoài ruộng thật.
 *
 * [BB] Không `Date.now`. `startOffset` là phần của một nhịp, không phải giờ đồng hồ.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { ScheduleBlock } from '../contracts/primitives.js';
import { ScheduleBlockSchema } from '../contracts/primitives.js';
import type { SinhKe } from '../schema/aspect/pham.js';
import { phamThan, viecKhongLamDuoc } from './thanThe.js';
import { nhanNghe } from '../schema/aspect/pham.js';

function docAspect<T>(e: Entity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a && typeof a === 'object' ? (a as T) : undefined;
}

/** Vùng cư trú theo link `cu_tru_tai` còn hiệu lực. */
export function noiOCua(state: WorldState, id: string): string | null {
  for (const lk of state.links.values()) {
    if (lk.tickDut !== null || lk.quanHe !== 'cu_tru_tai' || lk.tuId !== id) continue;
    return lk.denId;
  }
  return null;
}

/**
 * Lịch một nhịp của một người, suy từ hoàn cảnh.
 *
 * Bốn khối, theo đúng thứ tự một ngày: ngủ, làm, ăn với nhà, và phần còn lại.
 * Người ốm thì khối làm biến thành khối nằm; trẻ con thì thành khối học; người
 * già không có khối làm. Không ai phải viết một cái state machine cho việc này.
 */
export function lichCua(state: WorldState, nguoiId: string): readonly ScheduleBlock[] {
  const e = state.entities.get(nguoiId);
  const m = phamThan(e);
  if (!e || !m || e.tickDiet !== null) return [];

  const sk = docAspect<SinhKe>(e, 'sinh_ke');
  const nha = m.hoId ?? null;
  const o = noiOCua(state, nguoiId);
  const cam = new Set(viecKhongLamDuoc(m));

  const kh = (
    startOffset: number,
    duration: number,
    activity: string,
    locationId: string | null,
    flexible = true,
  ): ScheduleBlock => ScheduleBlockSchema.parse({ startOffset, duration, activity, locationId, flexible });

  const ra: ScheduleBlock[] = [kh(0, 0.3, 'ngu', nha ?? o, false)];

  const omNang = m.thanThe.thuongTich.some((t) => t.trangThai !== 'da_lanh' && t.nang >= 0.6);
  if (omNang) {
    ra.push(kh(0.3, 0.5, 'nam_benh', nha ?? o, false));
  } else if (m.ageBand === 'child') {
    ra.push(kh(0.3, 0.35, cam.has('hoc') ? 'choi' : 'hoc', o));
  } else if (m.ageBand === 'elder') {
    ra.push(kh(0.3, 0.3, 'trong_nha', nha ?? o));
  } else if (sk?.ngheId && !cam.has('lam_viec_nang')) {
    ra.push(kh(0.3, 0.45, `lam_${sk.ngheId}`, sk.noiLamId ?? o, false));
  } else {
    // Thất nghiệp không phải "rảnh": nó là đi tìm việc, và nó có vị trí thật.
    ra.push(kh(0.3, 0.35, 'tim_viec', o));
  }

  if (nha) ra.push(kh(0.8, 0.12, 'an_voi_nha', nha, false));
  ra.push(kh(0.92, 0.08, 'quanh_quan', o));
  return Object.freeze(ra);
}

/**
 * Người này đang ở đâu và làm gì vào lúc `phanNhip` của nhịp hiện tại.
 *
 * `phanNhip` là 0…1 trong một nhịp. Mặc định 0.5 — giữa buổi, tức là lúc người
 * ta đang làm việc; đó là câu trả lời đúng cho câu hỏi "giờ này họ ở đâu".
 */
export function dangODau(
  state: WorldState,
  nguoiId: string,
  phanNhip = 0.5,
): { noiId: string | null; viec: string } {
  const ds = lichCua(state, nguoiId);
  const p = Math.max(0, Math.min(0.999, phanNhip));
  for (const b of ds) {
    if (p >= b.startOffset && p < b.startOffset + b.duration) {
      return { noiId: b.locationId, viec: b.activity };
    }
  }
  const cuoi = ds[ds.length - 1];
  return { noiId: cuoi?.locationId ?? noiOCua(state, nguoiId), viec: cuoi?.activity ?? 'quanh_quan' };
}

/** Nhãn tiếng Việt cho việc trong lịch — [BB] 36.7, UI không hiện chuỗi máy. */
export const NHAN_VIEC: Readonly<Record<string, string>> = Object.freeze({
  ngu: 'ngủ',
  nam_benh: 'nằm bệnh',
  hoc: 'học',
  choi: 'chơi',
  trong_nha: 'ở trong nhà',
  tim_viec: 'đi tìm việc',
  an_voi_nha: 'ăn với nhà',
  quanh_quan: 'quanh quẩn',
});

export function nhanViec(viec: string): string {
  if (viec.startsWith('lam_nghe_')) return `làm nghề ${nhanNghe(viec.slice('lam_'.length))}`;
  return NHAN_VIEC[viec] ?? viec.replace(/_/g, ' ');
}

/**
 * Ai đang có mặt ở một nơi vào lúc này.
 *
 * Đây là hàm mà đối thoại và nghe lỏm cần: "ai đứng đủ gần để nghe" phải suy từ
 * lịch, không phải từ danh sách cư dân. Người đang ngoài ruộng thì không nghe
 * được chuyện nói trong nhà, dù cùng làng.
 */
export function aiDangO(
  state: WorldState,
  noiId: string,
  phanNhip = 0.5,
): readonly { id: string; viec: string }[] {
  const ra: { id: string; viec: string }[] = [];
  for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const e = state.entities.get(id);
    if (!e || e.kind !== 'mortal' || e.tickDiet !== null) continue;
    const o = dangODau(state, id, phanNhip);
    if (o.noiId === noiId) ra.push({ id, viec: o.viec });
  }
  return Object.freeze(ra);
}
