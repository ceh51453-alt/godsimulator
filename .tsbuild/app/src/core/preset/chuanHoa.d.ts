import type { ActivationState, GenerationCandidate, ImportEnvelope, ModuleLane, NormalizedPresetPack, QuarantinedScript, ScriptAdapterDef, ThamSoDaChuan, TransformDef } from './schema.js';
import type { ModelProfile } from '../schema/ai.js';
import type { NormalizedGenParams } from '../schema/ai.js';
export declare const MARKER_SANG_LANE: Readonly<Record<string, ModuleLane>>;
/** Nguồn native lắp vào từng slot sau `chieu()` — 63.4 cột ba. */
export declare const NGUON_NATIVE_CUA_SLOT: Readonly<Record<string, string>>;
export type KetQuaChuanHoa = {
    readonly pack: NormalizedPresetPack;
    readonly transformDefs: readonly TransformDef[];
    readonly quarantined: readonly QuarantinedScript[];
    readonly scriptAdapters: readonly ScriptAdapterDef[];
    readonly thongKe: ThongKeChuanHoa;
};
export type ThongKeChuanHoa = {
    readonly soPrompt: number;
    readonly soOrderEntry: number;
    /** Số order entry có `enabled === true` — nguồn chân lý về bật/tắt. */
    readonly soHieuLucBat: number;
    /** Số mục mà `prompts[].enabled` mâu thuẫn với `order[].enabled`. */
    readonly soMismatch: number;
    readonly soNgoaiOrder: number;
    readonly soOrderMoCoi: number;
    readonly soMarker: number;
    readonly soRegex: number;
    readonly soRegexBatONguon: number;
    readonly soHelper: number;
    readonly soHelperBatONguon: number;
    readonly theoTrangThai: Readonly<Record<ActivationState, number>>;
};
/**
 * Chuẩn hóa một preset SillyTavern đã parse thành `NormalizedPresetPack`.
 *
 * Không đọc file, không gọi mạng, không chạy gì trong `extensions`. Cùng đầu vào
 * luôn cho cùng đầu ra, kể cả thứ tự issue.
 */
export declare function chuanHoaSillyTavern(input: {
    readonly goc: Record<string, unknown>;
    readonly envelope: ImportEnvelope;
    readonly packId: string;
    readonly version: number;
}): KetQuaChuanHoa;
/** Regex nguồn có chạy được bằng `RegExp` của trình duyệt không — chỉ KIỂM, không chạy. */
export declare function kiemPatternHopLe(pattern: string): boolean;
/** Đọc tham số sinh từ file nguồn, GIỮ NGUYÊN giá trị — 62.4. */
export declare function docThamSoNguon(goc: Record<string, unknown>): GenerationCandidate;
/**
 * Áp `ModelProfile` lên tham số raw — 62.4.
 *
 * Trả về CẢ hai: giá trị dùng được và bảng diff. Bảng diff là thứ người dùng cần
 * thấy ở màn 6; "đã tự động điều chỉnh" mà không nói chỉnh gì là cách nhanh nhất
 * để một preset chạy sai suốt ván mà không ai biết.
 */
export declare function chuanHoaThamSo(gen: GenerationCandidate | undefined, profile: ModelProfile): {
    params: NormalizedGenParams;
    bang: ThamSoDaChuan[];
};
