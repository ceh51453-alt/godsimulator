/**
 * Bản tin thế giới — "chuyện gì đã xảy ra trong lúc ta đang nói chuyện".
 *
 * Đây là chỗ mười hai tiến trình nền **trả về giá trị cho vòng chat**. Không có
 * file này, Phase 5 chỉ là một bảng tính chạy nền: đúng nhưng vô hình.
 *
 * Ba ràng buộc:
 *
 *   1. [BB] 71.5 — LLM không giữ sổ. Bản tin CHỈ chứa thứ tiến trình đã sinh ra;
 *      nó không được thêm một con số nào. Narrator chọn và kể, không bịa.
 *   2. [BB] 72.2 — "Event xa chỉ chen vào scene nếu tin/ảnh hưởng có đường tới nơi."
 *      Vì vậy `banTinCho()` lọc theo **điều chủ thể thật sự biết**, không theo
 *      điều đã xảy ra.
 *   3. [BB] 56.2 — tầng phàm nhân không thấy số. Mọi mục có `loiKe` bằng tiếng
 *      Việt, dùng được nguyên văn.
 */
import type { WorldState } from '../engine/state.js';
import type { ViewMode } from '../contracts/primitives.js';
import type { UngVienSuKien } from './process/types.js';
import { docAspect } from './process/tienIch.js';
import type { Duong } from '../schema/aspect/substrate.js';

export type MucBanTin = {
  readonly loai: string;
  readonly mucDo: 'thuong' | 'lon' | 'trong_dai';
  readonly loiKe: string;
  readonly locationId: string | null;
  readonly chuTheIds: readonly string[];
  /** Chủ thể biết chuyện này qua đâu: tự thấy, nghe kể, hay chưa biết. */
  readonly duong: 'chung_kien' | 'nghe_ke' | 'chua_toi';
};

export type BanTin = {
  readonly tickTu: number;
  readonly tickDen: number;
  readonly muc: readonly MucBanTin[];
  /** Câu mở đầu gợi ý cho Narrator; rỗng khi không có gì đáng nói. */
  readonly tomTat: string;
};

/**
 * Khoảng cách theo số chặng đường từ `tuId`, giới hạn `toiDa` chặng.
 * BFS trên đồ thị tuyến đường thông suốt — cùng đồ thị mà tin tức phải đi.
 */
export function soChangToi(state: WorldState, tuId: string, toiDa = 4): Map<string, number> {
  const ke = new Map<string, string[]>();
  for (const e of state.entities.values()) {
    if (e.kind !== 'route' || e.tickDiet !== null) continue;
    const d = docAspect<Duong>(e, 'duong');
    if (!d || !d.thongSuot) continue;
    for (const [a, b] of [
      [d.tuId, d.denId],
      [d.denId, d.tuId],
    ] as const) {
      const ds = ke.get(a) ?? [];
      ds.push(b);
      ke.set(a, ds);
    }
  }

  const xa = new Map<string, number>([[tuId, 0]]);
  let bien = [tuId];
  for (let b = 1; b <= toiDa && bien.length > 0; b++) {
    const sau: string[] = [];
    for (const n of bien) {
      for (const m of (ke.get(n) ?? []).sort((x, y) => (x < y ? -1 : 1))) {
        if (xa.has(m)) continue;
        xa.set(m, b);
        sau.push(m);
      }
    }
    bien = sau;
  }
  return xa;
}

/** Vùng mà một chủ thể đang ở, theo link `cu_tru_tai`. */
function vungCua(state: WorldState, chuTheId: string | null): string | null {
  if (chuTheId === null) return null;
  for (const lk of [...state.links.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (lk.tickDut !== null) continue;
    if (lk.tuId === chuTheId && lk.quanHe === 'cu_tru_tai') return lk.denId;
  }
  const e = state.entities.get(chuTheId);
  const sp = docAspect<{ chaId?: string | null }>(e, 'spatial');
  return sp?.chaId ?? null;
}

const THU_TU_MUC: Readonly<Record<MucBanTin['mucDo'], number>> = { trong_dai: 3, lon: 2, thuong: 1 };

/**
 * Dựng bản tin cho một chủ thể ở một tầng.
 *
 * Sáng Thế thấy tất cả — đó là định nghĩa của tầng ấy. Thần và phàm nhân chỉ
 * thấy thứ có đường tới chỗ mình; thứ ở xa hơn `banKinh` chặng thì **không lọt
 * vào bản tin**, kể cả khi nó vừa xảy ra.
 */
export function banTinCho(
  state: WorldState,
  suKien: readonly UngVienSuKien[],
  mode: ViewMode,
  chuTheId: string | null,
  tickTu: number,
  tickDen: number,
  banKinh = 3,
): BanTin {
  const noiToi = vungCua(state, chuTheId) ?? chuTheId;
  const xa = mode === 'sang_the' || noiToi === null ? null : soChangToi(state, noiToi, banKinh);

  const muc: MucBanTin[] = [];
  for (const sk of suKien) {
    let duong: MucBanTin['duong'] = 'chung_kien';

    if (xa !== null) {
      const noi = sk.locationId;
      const chang = noi === null ? 0 : (xa.get(noi) ?? Number.POSITIVE_INFINITY);
      if (chang === Number.POSITIVE_INFINITY) duong = 'chua_toi';
      else if (chang > 0) duong = 'nghe_ke';
      // Chuyện nhỏ ở làng bên không đi xa được — chỉ chuyện lớn mới thành tin đồn.
      if (duong === 'nghe_ke' && sk.mucDo === 'thuong') duong = 'chua_toi';
    }

    if (duong === 'chua_toi') continue;

    muc.push({
      loai: sk.loai,
      mucDo: sk.mucDo,
      // Nghe kể thì lời kể phải MANG dấu của việc nghe kể, không nói chắc như thấy.
      // Dùng dấu hai chấm chứ không ghép câu: phần lớn mô tả mở đầu bằng TÊN RIÊNG,
      // và hạ chữ đầu để ghép cho thuận sẽ biến "Trách Trách" thành "trách Trách".
      loiKe: duong === 'nghe_ke' ? `Người ta kể lại: ${sk.moTa}` : sk.moTa,
      locationId: sk.locationId,
      chuTheIds: sk.chuTheIds,
      duong,
    });
  }

  muc.sort((a, b) => THU_TU_MUC[b.mucDo] - THU_TU_MUC[a.mucDo]);

  const trongDai = muc.filter((m) => m.mucDo === 'trong_dai');
  const tomTat =
    muc.length === 0
      ? ''
      : trongDai.length > 0
        ? (trongDai[0] as MucBanTin).loiKe
        : (muc[0] as MucBanTin).loiKe;

  return { tickTu, tickDen, muc, tomTat };
}
