/**
 * Hợp đồng runtime của tiến trình nền — Phần 71.1 [BB].
 *
 * "Handler deterministic nhận state + RNG seeded, trả Event candidate + Patch
 *  candidate. Không viết DB trực tiếp."
 *
 * Vì sao handler nhận `WorldState` chứ không nhận `WorldView` như `RuntimeCtx`:
 * tiến trình nền **là engine**, không phải một chủ thể đang nhìn thế giới. Nó
 * không có sương mù, không có tri thức giới hạn — đó là chuyện của `chieu()`.
 * Cho nó một view đã chiếu thì mùa màng ở vùng người chơi chưa tới sẽ ngừng chạy.
 *
 * [BB] Handler CHỈ ĐỌC `state`. Nó trả patch; scheduler mới là nơi ghi.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { WorldState } from '../../engine/state.js';
import type { Rng } from '../../engine/rng.js';
import type { Tuning } from '../../tuning/schema.js';
import type { WorldProcessDef, DoPhanGiai } from '../../registry/types.js';
import type { Mua } from '../../schema/aspect/substrate.js';

/** Ba độ phân giải thật khi chạy — `adaptive` đã được engine quyết trước đó. */
export type PhanGiaiChay = Exclude<DoPhanGiai, 'adaptive'>;

export type NgocCanhTienTrinh = Readonly<{
  /** [BB] Chỉ đọc. Sửa trực tiếp là phá luật bất biến #4. */
  state: WorldState;
  tick: number;
  nam: number;
  mua: Mua;
  /** Id Event mà mọi patch của lần chạy này phải khai. */
  eventId: string;
  tuning: Tuning;
  /** Đã tách kênh theo (seed, tick, processId) — hai tiến trình không giành số. */
  rng: Rng;
  phanGiai: PhanGiaiChay;
  /**
   * Catch-up (71.6): một lần chạy đang gộp bao nhiêu bước nhịp.
   * Handler PHẢI nhân hiệu ứng theo con số này thay vì được gọi lặp — đó là
   * toàn bộ ý nghĩa của "không chạy một triệu vòng micro khi tua một kỷ nguyên".
   */
  soBuocGop: number;
}>;

/**
 * Event candidate. Tiến trình không tự tạo Event hoàn chỉnh (nó không biết
 * nhân quả toàn cục); nó chỉ đề xuất, tick mới đóng dấu.
 */
export type UngVienSuKien = Readonly<{
  loai: string;
  /** `lon` và `trong_dai` là mốc Smart Stop của 47.3 nhìn thấy. */
  mucDo: 'thuong' | 'lon' | 'trong_dai';
  moTa: string;
  tienTrinhId: string;
  chuTheIds: readonly string[];
  locationId: string | null;
  payload: Readonly<Record<string, unknown>>;
}>;

export type KetQuaTienTrinh = {
  patches: PatchOp[];
  suKien: UngVienSuKien[];
};

export type HandlerTienTrinh = (nc: NgocCanhTienTrinh) => KetQuaTienTrinh;

export type TienTrinhNen = Readonly<{
  def: WorldProcessDef;
  chay: HandlerTienTrinh;
}>;

export const KET_QUA_RONG: () => KetQuaTienTrinh = () => ({ patches: [], suKien: [] });
