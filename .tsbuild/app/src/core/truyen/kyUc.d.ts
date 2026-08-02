/**
 * Nén có hình dạng truyện — Phần 30.3 [BB].
 *
 * ── Vì sao không dùng phép nén thông thường ──
 *
 * Nén biên niên sử theo cách quen thuộc (giữ N sự kiện gần nhất, bỏ phần cũ) làm
 * mất mạch tự sự: nút thắt gieo ở nhịp thứ mười biến mất trước khi được gỡ ở
 * nhịp thứ hai trăm. Nén THEO MẠCH thì không, vì đơn vị nén là một sợi chỉ tự
 * sự chứ không phải một cửa sổ thời gian.
 *
 * [BB] Danh sách "giữ nguyên" của 30.3 là BẤT KHẢ XÂM PHẠM:
 *   nhân vật chính · nút thắt chưa gỡ · phục bút chưa trả · lời hứa · mối thù.
 * Nén được phép làm mất VĂN, không được phép làm mất NHÂN QUẢ TỰ SỰ.
 *
 * Vì vậy hàm dưới đây không phải một bộ tóm tắt: nó là một bộ ĐÓNG GÓI có
 * trường bắt buộc. Phần "cho phép mất" (chi tiết cảnh, hội thoại phụ, mô tả) là
 * phần duy nhất bị cắt, và nó bị cắt bằng cách đơn giản là không được đưa vào.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Storyline } from '../schema/truyen.js';
export type MucNen = {
    /** Bốn khối bắt buộc giữ. Rỗng là hợp lệ; THIẾU KHỐI thì không. */
    readonly nhanVatChinh: readonly string[];
    readonly nutThatChuaGo: readonly string[];
    readonly phucButChuaTra: readonly string[];
    readonly loiHuaVaMoiThu: readonly string[];
    /** Văn nén — phần được phép mất chi tiết. */
    readonly tomTat: string;
};
/** Trần ký tự của `kyUcMach`. Vượt trần thì cắt VĂN, không cắt bốn khối trên. */
export declare const TRAN_KY_UC_MACH = 900;
/**
 * Nén ký ức của MỘT mạch. Chạy cuối mỗi kỷ nguyên (30.3).
 *
 * `nhipGanDay` là văn của những nhịp vừa qua — thứ duy nhất được phép mất.
 */
export declare function nenKyUcMach(s: WorldState, m: Storyline, nhipGanDay: readonly string[]): MucNen;
/**
 * Kết xuất `MucNen` thành `kyUcMach`.
 *
 * Bốn khối bắt buộc luôn đứng TRƯỚC văn: nếu có gì bị cắt vì trần ký tự thì thứ
 * bị cắt phải là văn, đúng theo 30.3.
 */
export declare function ranMucNen(mn: MucNen): string;
/**
 * Kỷ nguyên thứ mấy, tính từ tick.
 *
 * Hàm thuần của `tick`, không phải một bộ đếm được lưu: một bộ đếm sẽ lệch sau
 * mỗi lần fork nhánh hoặc replay, còn phép chia thì không.
 */
export declare function kyNguyenCua(tick: number, tickMoiKyNguyen: number): number;
/** Tick này có phải mốc chuyển kỷ nguyên không. Tick 0 KHÔNG phải. */
export declare function laMocKyNguyen(tick: number, tickMoiKyNguyen: number): boolean;
/**
 * Nén toàn bộ mạch đang mở — chạy ở mốc kỷ nguyên (30.3).
 *
 * Trả patch: nén cũng đi qua Event như mọi thay đổi khác (luật bất biến #4).
 * Nguyên liệu là `Storyline.nhipGanDay` — bộ đệm mà mỗi nhịp đã đẩy vào; nén
 * xong thì bộ đệm được dọn, vì phần văn đáng giữ đã nằm trong `kyUcMach` còn
 * phần còn lại là thứ 30.3 cho phép mất.
 */
export declare function nenCuoiKyNguyen(s: WorldState, nc: {
    eventId: string;
}): readonly PatchOp[];
/**
 * Cổng của 30.3, dạng hàm kiểm được: nén KHÔNG được làm mất nhân quả tự sự.
 *
 * Trả danh sách thứ bị mất. Rỗng nghĩa là đạt.
 */
export declare function kiemNenKhongMat(truoc: MucNen, sau: string): readonly string[];
