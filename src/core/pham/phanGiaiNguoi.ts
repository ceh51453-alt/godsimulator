/**
 * Thăng và giáng hạng NPC — Phần 70.3 [BB].
 *
 * ── Câu mà 70.3 bắt phải bỏ đi ──
 *
 * Phần 25 cũ nói *"NPC tầng thấp không cần có tâm hồn"*. 70.3 thay nó bằng:
 *
 * > "NPC ngoài sân khấu không cần được mô phỏng ở cùng độ phân giải, nhưng lịch
 * > sử của họ phải đủ để khi bước vào ánh sáng, họ đã sống từ trước."
 *
 * Khác biệt giữa hai câu ấy là toàn bộ file này. Giáng hạng **giảm độ phân giải
 * xử lý**, không xóa đời sống:
 *
 *   giữ nguyên   mục tiêu, lịch, thân thể, hộ, ba quan hệ mạnh nhất
 *   nén          quan hệ yếu → gộp theo nhóm, **khôi phục được nguồn**
 *   không đụng   ký ức, thương tích, di chứng, nghĩa vụ, tiếng tăm
 *
 * [BB] Điểm khó nhất là chữ "khôi phục được nguồn": nén không được là mất. Nên
 * bản nén giữ **danh sách id** của những quan hệ đã gộp, chứ không chỉ giữ một
 * con số đếm.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Soul, QuanHeMotChieu } from '../schema/aspect/soul.js';
import { QuanHeMotChieuSchema } from '../schema/aspect/soul.js';
import { nguoiTaQuen } from './quanHe.js';
import { dat, hong, loi } from '../contracts/errors.js';
import type { KetQua } from '../contracts/errors.js';

function hon(e: Entity | undefined): Soul | undefined {
  const a = e?.aspects['soul'];
  return a && typeof a === 'object' ? (a as Soul) : undefined;
}

const set = (id: string, path: string, value: unknown, evId: string): PatchOp => ({
  op: 'set',
  target: { table: 'entities', id, path },
  value,
  sourceEventId: evId,
});

export type NgocCanhHang = { readonly eventId: string; readonly tick: number };

/** Ba quan hệ mạnh nhất được giữ nguyên vẹn — 70.3. */
export const SO_QUAN_HE_GIU = 3;

/** Khóa của bản ghi nén. Dùng chung ở mọi nơi để nén và mở nén khớp nhau. */
export const KHOA_NEN = '__nen__';

/**
 * Giáng hạng: t2/t3 → t1.
 *
 * Quan hệ yếu bị gộp vào một bản ghi duy nhất dưới khóa `__nen__`, mang theo
 * `kyUcChungIds` là **danh sách id** của những người đã bị gộp. Đó là đường
 * khôi phục: thăng hạng lại thì mở đúng danh sách ấy ra.
 */
export function giangHang(
  state: WorldState,
  nguoiId: string,
  nc: NgocCanhHang,
): KetQua<{ patches: readonly PatchOp[]; soNen: number; loiKe: string }> {
  const e = state.entities.get(nguoiId);
  const s = hon(e);
  if (!e || !s) return hong([loi('intent', 'KHONG_CO_HON', 'Thực thể này không có hồn để giáng hạng.')]);
  if (s.tang === 't1' || s.tang === 't0') {
    return hong([loi('intent', 'DA_O_HANG_THAP', 'Đã ở hạng thấp nhất rồi.', { recoverable: true })]);
  }

  const ds = nguoiTaQuen(state, nguoiId);
  const giu = ds.slice(0, SO_QUAN_HE_GIU);
  const nen = ds.slice(SO_QUAN_HE_GIU).filter((x) => x.id !== KHOA_NEN);

  const quanHeMoi: Record<string, QuanHeMotChieu> = {};
  for (const g of giu) quanHeMoi[g.id] = g.qh;

  if (nen.length > 0) {
    // Trung bình bốn trục, và GIỮ DANH SÁCH ID. Con số "còn 12 người quen" là
    // thứ không mở lại được; danh sách thì mở được.
    const tb = (lay: (q: QuanHeMotChieu) => number): number =>
      Math.round(nen.reduce((t, x) => t + lay(x.qh), 0) / nen.length);
    quanHeMoi[KHOA_NEN] = QuanHeMotChieuSchema.parse({
      thanSo: tb((q) => q.thanSo),
      yeuGhet: tb((q) => q.yeuGhet),
      tinNgo: tb((q) => q.tinNgo),
      noOn: tb((q) => q.noOn),
      anTuong: `Còn ${nen.length} người nữa mà ta có quen.`,
      kyUcChungIds: [],
      laHuyenThoai: false,
      xungHo: nen.map((x) => x.id).join(','),
    });
  }

  return dat({
    patches: [
      set(nguoiId, 'aspects.soul.tang', 't1', nc.eventId),
      set(nguoiId, 'aspects.soul.quanHe', quanHeMoi, nc.eventId),
      // Ký ức KHÔNG bị cắt. Giáng hạng là bớt xử lý, không phải bớt đời.
    ],
    soNen: nen.length,
    loiKe: `${e.ten} lùi khỏi ánh sáng.`,
  });
}

/**
 * Thăng hạng: t1 → t2.
 *
 * Mở lại danh sách đã nén. Quan hệ khôi phục về mức trung bình đã lưu chứ không
 * về giá trị gốc — nén là **mất chi tiết có kiểm soát**, và điều đó trung thực
 * hơn là giả vờ khôi phục nguyên vẹn.
 */
export function thangHang(
  state: WorldState,
  nguoiId: string,
  nc: NgocCanhHang,
): KetQua<{ patches: readonly PatchOp[]; soMoLai: number; loiKe: string }> {
  const e = state.entities.get(nguoiId);
  const s = hon(e);
  if (!e || !s) return hong([loi('intent', 'KHONG_CO_HON', 'Thực thể này không có hồn để thăng hạng.')]);

  const quanHeMoi: Record<string, QuanHeMotChieu> = {};
  for (const [id, q] of Object.entries(s.quanHe ?? {})) {
    if (id !== KHOA_NEN) quanHeMoi[id] = QuanHeMotChieuSchema.parse(q);
  }

  const ban = s.quanHe?.[KHOA_NEN];
  let soMoLai = 0;
  if (ban) {
    const ids = (ban.xungHo ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x !== '' && state.entities.has(x));
    for (const id of ids) {
      if (quanHeMoi[id]) continue;
      quanHeMoi[id] = QuanHeMotChieuSchema.parse({
        thanSo: ban.thanSo,
        yeuGhet: ban.yeuGhet,
        tinNgo: ban.tinNgo,
        noOn: ban.noOn,
        anTuong: 'Ta có quen người này, nhưng không nhớ rõ vì chuyện gì.',
      });
      soMoLai++;
    }
  }

  return dat({
    patches: [
      set(nguoiId, 'aspects.soul.tang', 't2', nc.eventId),
      set(nguoiId, 'aspects.soul.quanHe', quanHeMoi, nc.eventId),
    ],
    soMoLai,
    loiKe: `${e.ten} bước vào ánh sáng — và họ đã sống từ trước.`,
  });
}

/**
 * Nên ở hạng nào, theo khoảng cách tới ống kính.
 *
 * Hàm thuần để scheduler gọi mà không phải tự nghĩ ra chính sách. `soChang` là
 * số chặng đường tới chỗ người chơi; `null` là không có đường tới.
 */
export function hangNenO(soChang: number | null, laChuThe: boolean, banKinhGan: number): 't1' | 't2' | 't3' {
  if (laChuThe) return 't3';
  if (soChang === null) return 't1';
  if (soChang === 0) return 't2';
  return soChang <= banKinhGan ? 't2' : 't1';
}
