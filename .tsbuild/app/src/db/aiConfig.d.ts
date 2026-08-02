/**
 * Lưu và đọc cấu hình AI — bảng `aiConfigs` (Dexie v6, ADR-0028).
 *
 * Một hàng, khóa cố định. Không có `branchId`: đổi nhánh hay mở save của bạn bè
 * đều không được làm mất proxy của máy này, và cũng không được mang proxy của
 * máy này đi đâu cả.
 */
import type { ThienDienDb } from './schema.js';
import type { AiConfig } from '../core/ai/cauHinh.js';
export declare const KHOA_CAU_HINH_AI = "may_nay";
/**
 * Đọc cấu hình. Bản ghi hỏng KHÔNG được ném lỗi ra ngoài — nó chỉ có nghĩa là
 * người chơi phải điền lại form, và đó là màn hình có sẵn chứ không phải sự cố.
 */
export declare function docCauHinhAi(db: ThienDienDb): Promise<AiConfig>;
export declare function luuCauHinhAi(db: ThienDienDb, cfg: AiConfig): Promise<void>;
export declare function xoaCauHinhAi(db: ThienDienDb): Promise<void>;
