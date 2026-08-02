/**
 * Phân thân — Phần 12.3, 69.1.
 *
 * ── Điều còn thiếu sau Phase 6 ──
 *
 * `dapDiHoa(..., 'phan_than')` đã ghi `divisible.doPhanKy` và kể một câu rất hay
 * về việc "tách làm hai". Nhưng không có ai tách cả: thế giới vẫn đúng một entity.
 * Nghĩa là lựa chọn tốn kém nhất trong bốn cách đáp Dị Hóa lại là lựa chọn không
 * để lại dấu vết nào — và người chơi phát hiện ra điều đó ngay lần thứ hai.
 *
 * File này làm cho nó thật:
 *
 *   bản thể gốc   giữ `coreSelf` — con người thật, và cái giá là mất tín đồ
 *   bản thể mới   nhận `followerImage` làm lõi của chính nó — được thờ, và
 *                 không bao giờ hết là một bản sao của điều người ta tưởng
 *
 * [BB] Bản thể mới là một entity `deity` đầy đủ. Nó có bản ngã riêng, nên nó
 * **trôi tiếp** theo hướng riêng của nó: hai trăm năm sau, hai bản thể có thể
 * không còn nhận ra nhau. `doPhanKy` đo đúng khoảng cách ấy.
 */
import type { WorldState } from '../engine/state.js';
import type { PatchOp } from '../contracts/core.js';
import type { KetQua } from '../contracts/errors.js';
export type KetQuaPhanThan = {
    readonly patches: readonly PatchOp[];
    readonly phanThanId: string;
    readonly loiKe: string;
};
/**
 * Tách một vị thần làm hai.
 *
 * Tín đồ đi theo **hình ảnh**, không theo sự thật — nên phần lớn tín đồ và toàn
 * bộ mật độ đền chuyển sang bản thể mới. Đó là cái giá thật của việc giữ lấy
 * chính mình, và nó phải đau thì lựa chọn mới có nghĩa.
 */
export declare function tachPhanThan(state: WorldState, thanId: string, nc: {
    eventId: string;
    tick: number;
    tenPhanThan?: string;
}): KetQua<KetQuaPhanThan>;
/**
 * Phân kỳ — bước 9 của tick (24.1).
 *
 * Hai bản thể sống hai đời khác nhau thì lõi trôi xa nhau. `doPhanKy` là khoảng
 * cách đo được, không phải một bộ đếm tăng theo thời gian: hai bản thể sống giống
 * nhau thì không phân kỳ, dù đã tách từ nghìn năm trước.
 */
export declare function doPhanKy(state: WorldState, thanId: string, evId: string): PatchOp[];
/** Hai bản thể còn gần nhau đủ để hợp lại không — 12.3. */
export declare function hopNhatDuoc(state: WorldState, gocId: string, ptId: string): boolean;
