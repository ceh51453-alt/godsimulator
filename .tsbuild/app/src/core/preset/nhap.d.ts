/**
 * Pipeline nhập mười hai bước — Phần 63.1 [BB].
 *
 * ```text
 *  1. Đọc bytes trong Worker
 *  2. Kiểm kích thước, UTF-8 và JSON depth
 *  3. Tính SHA-256; phát hiện file đã nhập
 *  4. Dò format bằng shape, không bằng tên file
 *  5. Parse bằng schema giới hạn và chặn key nguy hiểm
 *  6. Lưu raw source bất biến
 *  7. Chuẩn hóa prompt, order, marker, macro, tham số
 *  8. Quét script, URL, secret, jailbreak, reasoning request và nội dung nhạy cảm
 *  9. Dựng đồ thị dependency + conflict group
 * 10. Compile thử cho từng pipeline/mode với WorldView giả
 * 11. Hiện diff, token budget, mục bị clamp/cách ly/cần adapter
 * 12. Nhập vào Thư viện — CHƯA kích hoạt
 * ```
 *
 * [BB] Không bước nào trong 1–12 được: gọi model · chạy regex nguồn · chạy script ·
 * tải URL · sửa save · đổi endpoint · ghi vào lorebook · bật function calling.
 *
 * Cách file này bảo đảm điều đó không phải bằng kỷ luật mà bằng **danh sách
 * import**: nó không import `src/ai/*`, không import `src/db/*`, không import
 * `sandbox.apTransform`, và không có tham số nào nhận endpoint. Thứ không được
 * import thì không có cách nào gọi.
 *
 * Bước 1 nằm ngoài `core/` (đọc file là việc của UI/Worker). Hàm ở đây nhận
 * **văn bản đã đọc xong** — đó là biên đúng giữa hai tầng.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { WorldView } from '../contracts/view.js';
import type { Scene } from '../contracts/core.js';
import type { Tuning } from '../tuning/schema.js';
import type { ModelProfile } from '../schema/ai.js';
import type { KetQuaDo } from './doDinhDang.js';
import type { KetQuaQuet } from './anToan.js';
import type { ThongKeChuanHoa } from './chuanHoa.js';
import type { DoThiPhuThuoc, NhomXungDot } from './xungDot.js';
import type { CompiledPrompt, ImportEnvelope, PresetPackRow, RawSourceRow, TargetPipeline, ThamSoDaChuan } from './schema.js';
export declare const SCHEMA_VERSION_PRESET = 1;
export type DauVaoNhap = {
    readonly tenNguon: string;
    /** Văn bản UTF-8 nguyên vẹn. Bước 1 (đọc bytes) đã xong ở tầng trên. */
    readonly noiDung: string;
    /** Nhịp thế giới lúc nhập — [BB] `core/` không đọc đồng hồ máy. */
    readonly tick: number;
    readonly tuning: Tuning;
    /** Hash các file đã có trong thư viện — bước 3. */
    readonly daNhap?: ReadonlyMap<string, {
        packId: string;
        version: number;
    }>;
    readonly profile: ModelProfile;
    /** WorldView giả cho bước 10. */
    readonly viewGia: WorldView;
    readonly sceneGia: Scene;
};
export type KetQuaNhap = {
    /** `false` nghĩa là pipeline dừng — `dungOBuoc` cho biết dừng ở đâu và vì sao. */
    readonly ok: boolean;
    readonly dungOBuoc: number;
    readonly envelope: ImportEnvelope | null;
    readonly rawSource: RawSourceRow | null;
    readonly row: PresetPackRow | null;
    readonly thongKe: ThongKeChuanHoa | null;
    readonly quet: KetQuaQuet | null;
    readonly doThi: DoThiPhuThuoc | null;
    readonly nhom: readonly NhomXungDot[];
    readonly thamSo: readonly ThamSoDaChuan[];
    /** Bước 10 — biên dịch thử cho từng pipeline. */
    readonly thuBienDich: Readonly<Record<TargetPipeline, CompiledPrompt | null>>;
    readonly issues: readonly ImportIssue[];
    /** Cùng `sourceHash` → không tạo bản trùng (65.5). */
    readonly daCoSan: {
        readonly packId: string;
        readonly version: number;
    } | null;
    readonly doDinhDang: KetQuaDo | null;
};
/** Độ sâu tối đa của cây JSON. Sâu hơn là dấu hiệu file dựng để làm tràn stack. */
export declare const MAX_DO_SAU_JSON = 64;
/**
 * Chạy toàn bộ pipeline nhập.
 *
 * Trả về `KetQuaNhap` cho MỌI đường đi, kể cả đường hỏng — không throw. Người gọi
 * (wizard) đọc `dungOBuoc` để biết dừng ở màn nào và `issues` để biết nói gì.
 */
export declare function nhapPreset(dv: DauVaoNhap): KetQuaNhap;
/**
 * Id pack suy từ tên file + hash.
 *
 * Giữ chữ và số của tên gốc để người dùng nhận ra nó trong thư viện, nhưng luôn
 * kèm tám ký tự hash: hai file cùng tên "preset.json" là chuyện thường, và hai
 * pack cùng id là chuyện không được xảy ra.
 */
export declare function tenPackTuNguon(ten: string, hash: string): string;
