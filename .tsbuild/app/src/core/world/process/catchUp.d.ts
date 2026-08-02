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
import type { Tuning } from '../../tuning/schema.js';
import type { NhipThoiGian } from '../../contracts/view.js';
import type { KetQua, StructuredError } from '../../contracts/errors.js';
import type { ChanDoanTienTrinh } from './scheduler.js';
import type { UngVienSuKien } from './types.js';
/**
 * Bao nhiêu tick truyện gộp vào một bước engine, theo nhịp của 24.2.
 *
 * `nhat` không gộp: nhịp ngày là nhịp của cảnh, và cảnh thì phải chạy từng bước.
 */
export declare const TICK_MOI_BUOC: Readonly<Record<NhipThoiGian, number>>;
/** Điều kiện dừng engine tự tính được — tập con của bảng 47.3. */
export declare const DIEU_KIEN_DUNG: readonly ["su_kien_trong_dai", "dan_so_sup_do", "chien_su_bung_no", "dich_lan_rong", "reality_tut_qua_20", "the_gioi_trong_rong"];
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
/**
 * Tua thời gian.
 *
 * `state` bị sửa TẠI CHỖ qua `apDungEvent` — tức là vẫn đi đúng cửa duy nhất của
 * luật bất biến #4. Không có đường tắt nào ở đây.
 */
export declare function tuaThoiGian(state: WorldState, log: EventLog, tc: TuyChonTua): KetQua<KetQuaTua>;
