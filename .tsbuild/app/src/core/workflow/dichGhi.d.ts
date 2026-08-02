/**
 * Ba đích ghi và output có cấu trúc — Phần 50.6, 50.7, 50.10 [BB].
 *
 * ── Lằn ranh mới của Khối N ──
 *
 * [BB] 50.10: "**không tác vụ nào được ghi vào lorebook do người dùng nhập tay.**
 * Chỉ được ghi vào lorebook `nguon = 'tu_sinh'`. Người chơi soạn lorebook của
 * mình và không bao giờ phải lo bị workflow viết đè lên."
 *
 * Chẩn đoán 36 của 50.12 gọi vi phạm này là **hỏng nặng** — nên `ghiLorebook()`
 * trả về `severity: 'fatal'` chứ không phải một cảnh báo, và nó chặn TRƯỚC khi
 * dựng entry, không phải sau.
 *
 * ── Chống đệ quy ──
 *
 * [BB] 50.7: `chongDeQuy = true` bắt buộc cho mọi entry do workflow ghi. "Không
 * có nó, entry tự sinh sẽ kích hoạt keyword của chính nó và vòng lặp sẽ nổ."
 */
import type { StructuredError } from '../contracts/errors.js';
import type { LorebookEntry, NguonLorebook } from '../lore/schema.js';
import type { JsonPatchEntry, WriteTarget } from './schema.js';
export type KetQuaDocPatch = {
    readonly muc: readonly JsonPatchEntry[];
    readonly boQua: readonly StructuredError[];
};
/**
 * Đọc một khối JSON Patch mở rộng từ output model.
 *
 * [BB] 50.6 — prompt phải nói rõ "chỉ xuất một JSON hợp lệ, không rào markdown".
 * Nhưng model vẫn sẽ rào, nên hàm này gỡ rào trước rồi mới parse. Mục sai bị bỏ
 * riêng lẻ; cùng chính sách với patch ở 31.7.
 */
export declare function docJsonPatch(raw: string): KetQuaDocPatch;
/**
 * Ánh xạ `delta` sang phép `add` của 31.7 — 50.6 [BB].
 *
 * Đây là chỗ op quan trọng nhất của khối trở thành thứ engine hiểu. Bốn op còn
 * lại ánh xạ thẳng; `delta` là op duy nhất cần dịch.
 */
export declare function opEngineCua(op: JsonPatchEntry['op']): 'set' | 'add' | 'push' | 'remove';
/** Cộng dồn nhiều `delta` trên cùng đường dẫn — trọng số khái niệm đi qua nhiều tác vụ. */
export declare function gopDelta(muc: readonly JsonPatchEntry[]): Map<string, number>;
export type KetQuaGhiLorebook = {
    readonly ok: true;
    readonly entry: LorebookEntry;
    readonly lorebookId: string;
} | {
    readonly ok: false;
    readonly loi: readonly StructuredError[];
};
export type NgocCanhGhi = {
    readonly target: WriteTarget;
    readonly noiDung: string;
    readonly tick: number;
    /** Nguồn của lorebook đích. [BB] Phải là `tu_sinh`. */
    readonly nguonDich: NguonLorebook;
    readonly lorebookId: string;
    readonly taskId: string;
    readonly suKienChongLung?: readonly string[];
};
/**
 * Đích `ghi_lorebook` — "thế giới tự viết lorebook cho chính nó", chạy liên tục
 * thay vì mỗi kỷ nguyên một lần (50.7).
 */
export declare function ghiLorebook(nc: NgocCanhGhi): KetQuaGhiLorebook;
/**
 * Entry do workflow ghi có tự kích hoạt chính nó không — chẩn đoán 35 của 50.12.
 *
 * Kiểm bằng cách quét NỘI DUNG của entry tìm chính keyword của nó. Đây là dạng
 * đệ quy phổ biến nhất và cũng là dạng khó thấy nhất khi đọc bằng mắt.
 */
export declare function tuKichHoatChinhNo(entry: LorebookEntry): boolean;
export type MucChen = {
    readonly mau: string;
    readonly noiDung: string;
};
/** Đích `chen_vao_canh` — trả về mục cần chèn, KHÔNG tự chèn. */
export declare function chenVaoCanh(target: WriteTarget, noiDung: string): MucChen;
/**
 * Đích `bien_theo_luot` — biến sống một lượt, nằm trong namespace tác vụ.
 *
 * Cùng nguyên tắc với biến macro preset (63.5): không chạm World. Một workflow
 * ghi thẳng vào state qua đường này là mở một cửa hậu bên cạnh `apPatch`.
 */
export declare function bienTheoLuot(taskId: string, ten: string): string;
