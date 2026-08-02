/**
 * Thân thể — Phần 70.5 [BB].
 *
 * > "Sức khỏe không phải thanh máu."
 *
 * ── Cái khác biệt nằm ở đâu ──
 *
 * Một thanh máu trả lời đúng một câu hỏi: *còn sống không*. Thân thể thật trả
 * lời câu khác: *hôm nay làm được gì*. Đó là lý do hàm quan trọng nhất ở đây
 * không phải `troiThuongTich()` mà là `viecKhongLamDuoc()` — nó trả về **tên
 * việc**, và bộ thu affordance đọc thẳng danh sách ấy.
 *
 * Hệ quả trong lúc chơi: gãy chân không làm người chơi mất 30 máu, nó làm biến
 * mất lựa chọn "đi tới làng bên" khỏi màn hình — và đó là điều một người gãy
 * chân thật sự trải qua.
 *
 * [BB] 70.5 — chết tới từ **chuỗi** nguyên nhân. Không có `nguyenNhanChet: string`.
 */
import type { PatchOp } from '../contracts/core.js';
import type { Entity } from '../schema/entity.js';
import type { Mortal } from '../schema/aspect/living.js';
import type { ThuongTich, ViTriThanThe } from '../schema/aspect/pham.js';
import type { Rng } from '../engine/rng.js';
export type NgocCanhThanThe = {
    readonly eventId: string;
    readonly tick: number;
    readonly rng: Rng;
};
/** Đọc `mortal` cho gọn; trả `undefined` nếu entity không phải người. */
export declare function phamThan(e: Entity | undefined): Mortal | undefined;
export type YeuCauThuongTich = {
    readonly loai: ThuongTich['loai'];
    readonly viTri: ViTriThanThe;
    readonly nang: number;
    readonly nguyenNhanEventIds: readonly string[];
};
/**
 * Gây một thương tích. Trả patch; không hàm nào ở đây sửa state.
 *
 * Id thương tích mang cả tick lẫn vị trí, nên hai vết ở hai chỗ trong cùng một
 * nhịp không đè nhau — cùng loại lỗi đã sửa ở phân thân Phase 6b.
 */
export declare function gayThuongTich(e: Entity, yc: YeuCauThuongTich, nc: NgocCanhThanThe): {
    patches: readonly PatchOp[];
    thuongTich: ThuongTich;
    loiKe: string;
};
/**
 * Nhận chăm sóc — [BB] 70.5 "Chăm sóc là hành động xã hội".
 *
 * Người chăm phải có mặt, có thời gian và có hiểu biết. Ở đây ta chỉ ghi **ai**;
 * việc họ có đủ ba thứ kia là chuyện của validator gọi tới hàm này, vì nó cần
 * `WorldView` và thứ này thì không.
 */
export declare function nhanChamSoc(e: Entity, ttId: string, nguoiChamId: string, nc: NgocCanhThanThe): PatchOp[];
/**
 * Một nhịp trôi qua trên một thân thể.
 *
 * Bốn chuyện xảy ra, theo đúng thứ tự của đời thật:
 *
 *   1. vết thương lành — nhanh hơn hẳn nếu có người chăm;
 *   2. vết không ai chăm và đủ nặng thì **biến chứng**;
 *   3. lành xong có thể để lại **di chứng** — và di chứng thì ở lại;
 *   4. đau tính lại từ những vết còn mở, không phải một bộ đếm riêng.
 *
 * `soBuocGop` để catch-up (71.6) không phải gọi hàm này một triệu lần.
 */
export declare function troiThanThe(e: Entity, nc: NgocCanhThanThe, soBuocGop?: number): {
    patches: readonly PatchOp[];
    suKien: readonly {
        loai: string;
        moTa: string;
    }[];
};
/**
 * Việc thân thể này KHÔNG làm được lúc này — [BB] 70.5.
 *
 * Gộp cả ba nguồn: thương tích, đói và mệt. Trả tên việc, không trả số, vì chỗ
 * dùng nó là bộ thu affordance và câu hỏi ở đó là "hiện lựa chọn này không".
 */
export declare function viecKhongLamDuoc(m: Mortal | undefined): readonly string[];
/**
 * Câu nhân vật TỰ NÓI về thân thể mình — nguyên liệu cho Sổ Tay (56.1).
 * [BB] 56.2 quy tắc 1: không con số hệ thống. "Chân trái đau khi trở trời."
 */
export declare function thanTheKeLai(m: Mortal | undefined): readonly string[];
/**
 * Người này chết chưa, và vì cái gì.
 *
 * [BB] Chuỗi nguyên nhân, không phải một chuỗi ký tự: chết vì đói thì gồm cả cái
 * đói **và** cái vết thương làm không đi làm được **và** cái mùa mất mùa. Sổ Nhân
 * Quả đọc được chuỗi ấy; một chữ "chết đói" thì không.
 */
export declare function daChet(m: Mortal | undefined): {
    chet: boolean;
    chuoiNguyenNhan: readonly string[];
};
