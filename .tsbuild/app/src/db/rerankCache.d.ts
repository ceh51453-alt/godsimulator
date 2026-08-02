/**
 * Cache rerank — Phần 77.8 [BB]; cổng Phase 2 "cache không bao giờ được đọc chéo
 * nhánh/chủ thể".
 *
 * Khóa bảy phần:
 *   branchId + scopeKey + queryHash + candidateSetHash
 *           + visibilityHash + rerankerModelVersion + configHash
 *
 * [BB] Đổi mode/chủ thể → không tái dùng.
 * [BB] Chunk đổi tầm nhìn → invalidate.
 * [BB] Model/config đổi → version cache mới.
 * [BB] Không cache password hoặc full request body; cache chỉ chứa id/rank/score.
 * [BB] Hạn tính theo TICK, không dùng thời gian máy cho logic game.
 */
import type { ThienDienDb } from './schema.js';
import type { RerankResult, RetrievalRun } from '../core/schema/rerank.js';
export type KhoaCache = {
    branchId: string;
    scopeKey: string;
    queryHash: string;
    candidateSetHash: string;
    visibilityHash: string;
    modelKey: string;
    configHash: string;
};
/** Bảy thành phần khóa, đúng thứ tự của compound index. */
export declare function mangKhoa(k: KhoaCache): string[];
/** Hash tập candidate — thứ tự đầu vào không được ảnh hưởng khóa. */
export declare function hashTapCandidate(chunkIds: readonly string[]): string;
/**
 * Hash cấu hình rerank. [BB] Loại mọi trường secret TRƯỚC khi băm — nếu không,
 * đổi mật khẩu sẽ vô hiệu hóa cache một cách vô nghĩa, và tệ hơn là mật khẩu
 * góp mặt vào một giá trị được lưu xuống đĩa.
 */
export declare function hashConfig(config: unknown): string;
export declare class KhoRerankCache {
    private readonly db;
    constructor(db: ThienDienDb);
    /**
     * Đọc cache. Trả `undefined` nếu không có HOẶC đã hết hạn theo tick.
     * Khóa khớp toàn phần hoặc không khớp — không có "khớp gần đúng".
     */
    doc(k: KhoaCache, tickHienTai: number): Promise<RerankResult | undefined>;
    /** Ghi cache. Chỉ id/rank/score được lưu — schema `.strict()` chặn phần còn lại. */
    ghi(k: KhoaCache, ketQua: RerankResult, tickHienTai: number, ttlTicks: number): Promise<void>;
    /** [BB] Chunk đổi tầm nhìn → mọi mục có `visibilityHash` cũ phải biến mất. */
    voHieuTheoVisibility(branchId: string, visibilityHashCu: string): Promise<number>;
    /** Xóa toàn bộ cache của một nhánh — dùng khi fork hoặc khi đổi model. */
    voHieuTheoNhanh(branchId: string): Promise<number>;
    /** [BB] 79.1 — xóa cache rerank KHÔNG được ảnh hưởng save hay replay. */
    xoaHet(): Promise<void>;
    ghiRun(run: RetrievalRun): Promise<void>;
    /** Thống kê cho tab Truy hồi (Phần 77.11). */
    thongKe(branchId: string): Promise<{
        soRun: number;
        tyLeCacheHit: number;
        tyLeFallback: number;
        tongForbidden: number;
    }>;
}
