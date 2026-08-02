/**
 * Replay — cổng Phase 1 [BB].
 *
 * "Cùng seed + state đầu + accepted event log phải cho cùng state hash."
 *
 * Replay là bài kiểm tra sự thật của toàn bộ kiến trúc: nếu nó lệch, nghĩa là
 * có đường ghi state không đi qua Event/Patch.
 */
import type { Event, World } from '../contracts/core.js';
import type { WorldState } from './state.js';
import type { KetQua, StructuredError } from '../contracts/errors.js';
export type KetQuaReplay = {
    state: WorldState;
    hashCuoi: string;
    soEventDaApDung: number;
    soEventBiTuChoi: number;
    canhBao: readonly StructuredError[];
};
/**
 * Dựng lại state từ world khởi đầu + nhật ký Event.
 *
 * `nghiemNgat = true` (mặc định): một Event hỏng làm replay thất bại. Đây là chế
 * độ dùng cho test và cho kiểm tra toàn vẹn save.
 *
 * `nghiemNgat = false`: bỏ qua Event hỏng và ghi lại — dùng khi phục hồi một save
 * đã hư, nơi mất vài Event vẫn hơn mất cả thế giới.
 */
export declare function replay(worldBanDau: World, events: readonly Event[], nghiemNgat?: boolean): KetQua<KetQuaReplay>;
/**
 * Kiểm chứng determinism: replay hai lần độc lập, so hash.
 * Trả về hash nếu khớp; lỗi có cấu trúc nếu lệch.
 */
export declare function kiemDeterminism(worldBanDau: World, events: readonly Event[]): KetQua<string>;
