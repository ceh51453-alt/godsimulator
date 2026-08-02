import type { Event } from '../contracts/core.js';
import type { WorldState, EventLog } from './state.js';
import type { KetQua, StructuredError } from '../contracts/errors.js';
/**
 * Hash chính tắc của một Event, tính TRỪ chính trường `hash`.
 * Nhờ vậy `hash` xác thực được và không tự tham chiếu.
 */
export declare function hashEvent(e: Omit<Event, 'hash'> & {
    hash?: string;
}): string;
/** Dựng Event đã có hash đúng. Không dùng thời gian máy — tick là đồng hồ duy nhất. */
export declare function taoEvent(tho: Omit<Event, 'hash'>): Event;
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
export declare function kiemNhanQua(e: Event, log: EventLog): StructuredError[];
/**
 * Áp một Event vào state trong một transaction.
 *
 * `state` bị sửa TẠI CHỖ khi thành công; khi thất bại nó được khôi phục nguyên
 * vẹn từ snapshot, nên gọi hàm này an toàn kể cả với patch độc hại.
 */
export declare function apDungEvent(state: WorldState, event: Event, log: EventLog, tuyChon?: TuyChonApDung): KetQua<KetQuaApDung>;
/** Áp một chuỗi Event. Dừng ở Event đầu tiên hỏng, các Event trước vẫn giữ. */
export declare function apDungChuoi(state: WorldState, events: readonly Event[], log: EventLog): KetQua<{
    daApDung: number;
    hashCuoi: string;
}>;
