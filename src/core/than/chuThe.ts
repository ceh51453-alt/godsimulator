/**
 * Bộ chọn chủ thể — Phần 21.3, 79.4.
 *
 * ── Vì sao file này tồn tại ──
 *
 * Phase 6 đóng lại với một giới hạn được ghi thẳng vào tài liệu: bấm "Thần" trong
 * trình duyệt có lần vào tầng Thần, có lần rơi xuống Phàm Nhân. Nguyên nhân không
 * phải ở React. `doiHienDien()` của Phase 3 chọn "entity `deity` **đầu tiên trong
 * view**", và `view` là kết quả của `chieu()` — tập entity thấy được **đổi theo
 * tầng đang đứng**. Đứng ở Phàm Nhân thì phần lớn thần chỉ còn ở mức tin đồn hoặc
 * bị lọc mất, nên "đầu tiên" hôm nay và "đầu tiên" hôm qua là hai người khác nhau,
 * và có lúc là không ai cả — lúc ấy `chuTheId = null` và tầng tụt về mặc định.
 *
 * Sửa đúng là chọn trên **thế giới thật** với một luật xếp hạng ổn định, rồi để
 * UI hỏi người chơi khi có nhiều hơn một ứng viên. Chọn hộ người chơi một danh
 * tính là việc chỉ nên làm khi không còn gì để hỏi.
 *
 * File này thuần: nó đọc `WorldState` và trả về danh sách. Nó không sinh Event —
 * `eventChuyenTang` vẫn là cửa duy nhất đổi `playerState`.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { ViewMode } from '../contracts/primitives.js';
import type { Venerable } from '../schema/aspect/divine.js';
import type { Avatar } from '../schema/aspect/divine.js';

export type UngVienChuThe = {
  readonly id: string;
  readonly ten: string;
  readonly moTa: string;
  /** Câu giải thích vì sao người này đáng chọn — UI hiện thẳng, không cần dịch. */
  readonly vi: string;
  /** Đã từng nhập vào người này chưa. */
  readonly daTungNhap: boolean;
  /** Điểm xếp hạng; chỉ dùng để sắp xếp, không hiện ra. */
  readonly diem: number;
};

function docAspect<T>(e: Entity, ten: string): T | undefined {
  const a = e.aspects[ten];
  return a === undefined || a === null ? undefined : (a as T);
}

/** Kind hợp lệ cho từng tầng — 21.3. */
const KIND_CUA_TANG: Readonly<Record<Exclude<ViewMode, 'sang_the'>, string>> = Object.freeze({
  than: 'deity',
  pham_nhan: 'mortal',
});

/** Những chủ thể người chơi đã từng nhập, theo lịch sử chuyển tầng. */
function daTungNhapVao(state: WorldState): ReadonlySet<string> {
  const ra = new Set<string>();
  const ct = state.world.playerState.chuTheId;
  if (ct !== null) ra.add(ct);
  return ra;
}

/**
 * Ứng viên chủ thể cho một tầng, đã xếp hạng.
 *
 * Thứ tự: chủ thể đang nhập trước nhất (quay lại đúng chỗ mình vừa rời), rồi tới
 * nhân vật do người chơi tạo, rồi tới người có chỗ đứng trong thế giới, rồi tới
 * phần còn lại theo id để kết quả ổn định giữa hai lần chạy.
 */
export function chonChuThe(state: WorldState, mode: ViewMode): readonly UngVienChuThe[] {
  if (mode === 'sang_the') return [];
  const kind = KIND_CUA_TANG[mode];
  const daNhap = daTungNhapVao(state);

  const ra: UngVienChuThe[] = [];
  for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const e = state.entities.get(id);
    if (!e || e.kind !== kind || e.tickDiet !== null) continue;

    let diem = 0;
    const vi: string[] = [];

    if (daNhap.has(id)) {
      diem += 1000;
      vi.push('bạn đang là người này');
    }
    // Nhân vật do người chơi dựng ở màn Khởi Nguyên mang tiền tố `_pc_`.
    if (id.includes('_pc_')) {
      diem += 500;
      vi.push('do bạn tạo');
    }

    if (mode === 'than') {
      const ven = docAspect<Venerable>(e, 'venerable');
      const tinDo = ven?.soTinDoUocLuong ?? 0;
      const den = Object.values(ven?.matDoDen ?? {}).filter((m) => m > 0).length;
      diem += Math.min(200, tinDo) + den * 25;
      if (den > 0) vi.push(`có đền ở ${den} vùng`);
      if (tinDo > 0) vi.push(`khoảng ${tinDo} người thờ`);
      if (den === 0 && tinDo === 0) vi.push('chưa ai thờ');

      // [BB] 19.4 — thần đang hóa thân KHÔNG nhập thẳng vào được ở tầng Thần:
      // phần thần của họ đang ngủ trong một thân xác phàm.
      const ht = docAspect<Avatar>(e, 'avatar');
      if (ht && !ht.daThucTinh) {
        diem -= 800;
        vi.push('đang hóa thân, phần thần đang ngủ');
      }
    } else {
      const m = docAspect<{ ngheId?: string | null; kyNang?: Record<string, number> }>(e, 'mortal');
      const kn = Object.values(m?.kyNang ?? {});
      diem += kn.length * 10;
      if (m?.ngheId) vi.push(`làm nghề ${m.ngheId}`);
      if (kn.length > 0) vi.push(`${kn.length} kỹ năng`);
    }

    ra.push({
      id,
      ten: e.ten,
      moTa: e.moTa,
      vi: vi.length > 0 ? vi.join(' · ') : 'chưa có gì nổi bật',
      daTungNhap: daNhap.has(id),
      diem,
    });
  }

  ra.sort((a, b) => (b.diem !== a.diem ? b.diem - a.diem : a.id < b.id ? -1 : 1));
  return Object.freeze(ra);
}

/**
 * Chủ thể mặc định khi người chơi không chọn.
 *
 * Trả `null` là một câu trả lời hợp lệ và quan trọng: nó có nghĩa "tầng này chưa
 * có ai để nhập". Gọi hàm này rồi bỏ qua `null` chính là cách lỗi cũ xảy ra.
 */
export function chuTheMacDinhCho(state: WorldState, mode: ViewMode): string | null {
  if (mode === 'sang_the') return null;
  return chonChuThe(state, mode)[0]?.id ?? null;
}

/** Tầng nào đang có người để nhập — UI dùng để làm mờ nút thay vì báo lỗi sau khi bấm. */
export function tangKhaDung(state: WorldState): Readonly<Record<ViewMode, boolean>> {
  return Object.freeze({
    sang_the: true,
    than: chonChuThe(state, 'than').length > 0,
    pham_nhan: chonChuThe(state, 'pham_nhan').length > 0,
  });
}
