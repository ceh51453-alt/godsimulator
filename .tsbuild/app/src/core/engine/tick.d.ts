/**
 * Tick engine — Phần 24 [BB].
 *
 * Mười bốn bước, thứ tự DUY NHẤT. Phase 3 cài các bước engine thuần cần thiết cho
 * lát dọc offline; các bước còn lại đã có chỗ đứng và sẽ được nối ở Phase 5–8.
 *
 * [BB] 24.1 — bước 1–11 và 14 là engine thuần, deterministic theo seed.
 * Chỉ bước 8, 12, 13 gọi LLM. Chạy 1000 tick không LLM phải cho kết quả GIỐNG HỆT
 * nhau với cùng seed.
 */
import type { Event, PatchOp } from '../contracts/core.js';
import type { WorldState } from './state.js';
import type { Tuning } from '../tuning/schema.js';
export type BuocTick = {
    readonly so: number;
    readonly id: string;
    readonly ten: string;
    /** true nếu bước cần LLM — Phase 3 bỏ qua chúng hoàn toàn. */
    readonly canLlm: boolean;
};
/** Mười bốn bước của Phần 24.1, đúng thứ tự. */
export declare const MUOI_BON_BUOC: readonly BuocTick[];
export type TuyChonTick = {
    /** [BB] Phase 3 luôn `false`: lát dọc phải chơi được không AI. */
    choPhepLlm?: boolean;
    tuning: Tuning;
    /**
     * Bộ chạy tiến trình nền của Phase 5.
     *
     * Tiêm vào thay vì import thẳng, vì `engine/` không được phụ thuộc `world/`
     * (3.2). Bỏ trống thì tick chạy đúng như Phase 3 — hữu ích cho test lõi.
     */
    tienTrinhNen?: BoChayTienTrinh;
    soBuocGop?: number;
};
/** Chữ ký tối thiểu mà tick cần từ scheduler của `world/process`. */
export type BoChayTienTrinh = (state: WorldState, tuyChon: {
    tick: number;
    eventId: string;
    tuning: Tuning;
    soBuocGop?: number;
}) => {
    patches: readonly PatchOp[];
    suKien: readonly {
        loai: string;
        mucDo: 'thuong' | 'lon' | 'trong_dai';
        moTa: string;
        tienTrinhId: string;
        chuTheIds: readonly string[];
        locationId: string | null;
        payload: Readonly<Record<string, unknown>>;
    }[];
    chanDoan: readonly {
        ma: string;
        muc: string;
        tienTrinhIds: readonly string[];
        thongDiep: string;
    }[];
    daChay: readonly string[];
};
export type KetQuaTick = {
    /** Event của tick này; rỗng nếu tick không sinh thay đổi nào. */
    events: readonly Event[];
    /** Bước nào bị bỏ vì cần LLM mà LLM đang tắt. */
    buocBoQua: readonly string[];
    /**
     * Chuyện đáng kể mà tiến trình nền vừa sinh ra.
     *
     * Đây là thứ vòng chat thật sự cần: nó trả lời "trong lúc ta nói chuyện thì
     * ngoài kia có gì". `world/banTin.ts` lọc nó theo điều chủ thể biết được.
     */
    suKien: readonly UngVienSuKienTick[];
    /** Chẩn đoán của scheduler (71.4 quy tắc 5) — vào bảng Tự Chẩn Đoán. */
    chanDoan: readonly ChanDoanTick[];
    /** Tiến trình nền đã chạy trong tick này. */
    tienTrinhDaChay: readonly string[];
};
export type UngVienSuKienTick = {
    loai: string;
    mucDo: 'thuong' | 'lon' | 'trong_dai';
    moTa: string;
    tienTrinhId: string;
    chuTheIds: readonly string[];
    locationId: string | null;
    payload: Readonly<Record<string, unknown>>;
};
export type ChanDoanTick = {
    ma: string;
    muc: string;
    tienTrinhIds: readonly string[];
    thongDiep: string;
};
/**
 * Chạy MỘT tick. Trả về Event chưa áp — người gọi đưa qua `apDungEvent`.
 *
 * [BB] Hàm này KHÔNG sửa `state`. Nó chỉ đọc và sinh Event.
 */
export declare function motTick(state: WorldState, tuyChon: TuyChonTick): KetQuaTick;
