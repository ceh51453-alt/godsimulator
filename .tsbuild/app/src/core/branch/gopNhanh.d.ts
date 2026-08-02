/**
 * Hợp nhánh — Phần 26.3.
 *
 * ── Đây là đồ chơi cuối game, không phải tính năng tiện ích ──
 *
 * Đặc tả nói đúng câu ấy, và cái giá được liệt kê tường minh:
 *
 * ```text
 * realityIntegrity += tuning.thucTai.hopNhanh   (−35)
 * entity tồn tại ở cả hai nhánh với trạng thái khác nhau → vùng Nghịch Lý
 * NPC nhớ hai phiên bản quá khứ
 * thanh tra mạch lạc sinh hàng loạt tranh chấp sử liệu
 * ```
 *
 * Vì vậy hàm ở đây **không** hợp nhất im lặng. Nó trả về `BaoCaoGopNhanh` với
 * từng tranh chấp, và người gọi phải quyết định từng cái trước khi có patch nào
 * được sinh ra. Một `merge()` tự chọn bên thắng là một `merge()` xóa mất một nửa
 * lịch sử mà không ai biết.
 */
import type { WorldState } from '../engine/state.js';
import type { Tuning } from '../tuning/schema.js';
import type { PatchOp } from '../contracts/core.js';
export declare const BEN: readonly ["a", "b", "ca_hai"];
export type Ben = (typeof BEN)[number];
export type TranhChap = {
    readonly bang: 'entities' | 'links';
    readonly id: string;
    readonly ten: string;
    /** Đường dẫn khác nhau giữa hai bản — rỗng nghĩa là chỉ một bên có. */
    readonly truongKhac: readonly string[];
    readonly chiCoO: Ben | null;
    /** Người chơi phải chọn; engine KHÔNG tự chọn. */
    readonly deXuat: Ben;
    readonly lyDo: string;
};
export type BaoCaoGopNhanh = {
    readonly nhanhA: string;
    readonly nhanhB: string;
    readonly chungId: readonly string[];
    readonly tranhChap: readonly TranhChap[];
    readonly chiCoA: readonly string[];
    readonly chiCoB: readonly string[];
    /** Vùng sẽ thành Nghịch Lý nếu hợp — 26.3. */
    readonly vungNghichLy: readonly string[];
    /** realityIntegrity sẽ tụt bao nhiêu. */
    readonly giaThucTai: number;
    readonly tomTat: string;
};
/**
 * So hai nhánh và dựng báo cáo tranh chấp — 26.2 "diff ba cột".
 *
 * Không sửa gì. Hàm thuần trên hai `WorldState` đã nạp.
 */
export declare function soSanhNhanh(a: WorldState, b: WorldState, tuning: Tuning): BaoCaoGopNhanh;
export type QuyetDinhGop = Readonly<Record<string, Ben>>;
export type KetQuaGopNhanh = {
    readonly ok: true;
    readonly patches: readonly PatchOp[];
    readonly kyUcHaiBan: readonly KyUcHaiBan[];
} | {
    readonly ok: false;
    readonly chuaQuyetDinh: readonly string[];
};
/** NPC nhớ hai phiên bản quá khứ — 26.3. */
export type KyUcHaiBan = {
    readonly entityId: string;
    readonly banA: string;
    readonly banB: string;
};
/**
 * Sinh patch hợp nhánh sau khi người chơi đã quyết định từng tranh chấp.
 *
 * [BB] Mọi tranh chấp THẬT phải có quyết định. Thiếu một cái là dừng — trả về
 * danh sách còn thiếu chứ không dùng `deXuat` thay người chơi.
 */
export declare function gopNhanh(input: {
    readonly a: WorldState;
    readonly b: WorldState;
    readonly baoCao: BaoCaoGopNhanh;
    readonly quyetDinh: QuyetDinhGop;
    readonly nhanhDich: string;
    readonly eventId: string;
    readonly tuning: Tuning;
}): KetQuaGopNhanh;
