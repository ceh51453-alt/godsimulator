/**
 * Trình thông dịch ExprNode — ADR-0003.
 *
 * [BB] Thay thế cho `eval`. Mười hai op, không hơn. Không gọi hàm, không truy cập
 * prototype, không vòng lặp vô hạn, không hiệu ứng phụ.
 *
 * Đây là toàn bộ khả năng tính toán mà một pack/preset ngoài có được.
 */
import type { ExprNode } from '../contracts/primitives.js';
import type { KetQua } from '../contracts/errors.js';
/** Độ sâu tối đa của cây biểu thức — chặn stack overflow từ dữ liệu độc hại. */
export declare const DO_SAU_TOI_DA = 32;
export type NguonDoc = Readonly<Record<string, unknown>>;
/**
 * Đọc theo đường dẫn chấm. Chặn `__proto__`, `constructor`, `prototype`.
 * Trả `undefined` nếu đường dẫn không tới đâu — KHÔNG throw.
 */
export declare function docDuongDan(goc: unknown, duongDan: string): unknown;
/**
 * Tính một ExprNode. Không throw — mọi lỗi trả về dạng có cấu trúc.
 * `nguon` là gốc để `read` đi theo đường dẫn.
 */
export declare function tinhExpr(node: ExprNode, nguon: NguonDoc, doSau?: number): KetQua<unknown>;
/** Rút gọn: tính rồi ép về boolean. Lỗi hoặc không phải boolean → false. */
export declare function dieuKienDung(node: ExprNode, nguon: NguonDoc): boolean;
