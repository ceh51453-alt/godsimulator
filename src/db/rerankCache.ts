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
import { RerankCacheEntrySchema, RerankResultSchema } from '../core/schema/rerank.js';
import type { RerankCacheEntry, RerankResult, RetrievalRun } from '../core/schema/rerank.js';
import { RetrievalRunSchema } from '../core/schema/rerank.js';
import { hashCua } from '../core/engine/hash.js';
import { KHOA_SECRET } from '../core/contracts/branch.js';

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
export function mangKhoa(k: KhoaCache): string[] {
  return [
    k.branchId,
    k.scopeKey,
    k.queryHash,
    k.candidateSetHash,
    k.visibilityHash,
    k.modelKey,
    k.configHash,
  ];
}

/** Hash tập candidate — thứ tự đầu vào không được ảnh hưởng khóa. */
export function hashTapCandidate(chunkIds: readonly string[]): string {
  return hashCua([...chunkIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * Hash cấu hình rerank. [BB] Loại mọi trường secret TRƯỚC khi băm — nếu không,
 * đổi mật khẩu sẽ vô hiệu hóa cache một cách vô nghĩa, và tệ hơn là mật khẩu
 * góp mặt vào một giá trị được lưu xuống đĩa.
 */
export function hashConfig(config: unknown): string {
  const cam = new Set(KHOA_SECRET.map((k) => k.toLowerCase()));
  const loc = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(loc);
    const ra: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>)) {
      if (cam.has(k.toLowerCase())) continue;
      ra[k] = loc((v as Record<string, unknown>)[k]);
    }
    return ra;
  };
  return hashCua(loc(config));
}

export class KhoRerankCache {
  constructor(private readonly db: ThienDienDb) {}

  /**
   * Đọc cache. Trả `undefined` nếu không có HOẶC đã hết hạn theo tick.
   * Khóa khớp toàn phần hoặc không khớp — không có "khớp gần đúng".
   */
  async doc(k: KhoaCache, tickHienTai: number): Promise<RerankResult | undefined> {
    const row = await this.db.rerankCache.get(mangKhoa(k));
    if (!row) return undefined;
    if (row.expiresAtTick <= tickHienTai) {
      await this.db.rerankCache.delete(mangKhoa(k));
      return undefined;
    }
    const r = RerankResultSchema.safeParse(row.result);
    return r.success ? r.data : undefined;
  }

  /** Ghi cache. Chỉ id/rank/score được lưu — schema `.strict()` chặn phần còn lại. */
  async ghi(k: KhoaCache, ketQua: RerankResult, tickHienTai: number, ttlTicks: number): Promise<void> {
    const entry: RerankCacheEntry = RerankCacheEntrySchema.parse({
      ...k,
      result: ketQua,
      createdAtTick: tickHienTai,
      expiresAtTick: tickHienTai + Math.max(0, ttlTicks),
    });
    await this.db.rerankCache.put(entry);
  }

  /** [BB] Chunk đổi tầm nhìn → mọi mục có `visibilityHash` cũ phải biến mất. */
  async voHieuTheoVisibility(branchId: string, visibilityHashCu: string): Promise<number> {
    const ds = await this.db.rerankCache.where('branchId').equals(branchId).toArray();
    const xoa = ds.filter((r) => r.visibilityHash === visibilityHashCu);
    for (const r of xoa) await this.db.rerankCache.delete(mangKhoa(r));
    return xoa.length;
  }

  /** Xóa toàn bộ cache của một nhánh — dùng khi fork hoặc khi đổi model. */
  async voHieuTheoNhanh(branchId: string): Promise<number> {
    const ds = await this.db.rerankCache.where('branchId').equals(branchId).toArray();
    for (const r of ds) await this.db.rerankCache.delete(mangKhoa(r));
    return ds.length;
  }

  /** [BB] 79.1 — xóa cache rerank KHÔNG được ảnh hưởng save hay replay. */
  async xoaHet(): Promise<void> {
    await this.db.rerankCache.clear();
  }

  async ghiRun(run: RetrievalRun): Promise<void> {
    await this.db.retrievalRuns.add(RetrievalRunSchema.parse(run));
  }

  /** Thống kê cho tab Truy hồi (Phần 77.11). */
  async thongKe(branchId: string): Promise<{
    soRun: number;
    tyLeCacheHit: number;
    tyLeFallback: number;
    tongForbidden: number;
  }> {
    const ds = await this.db.retrievalRuns.where('branchId').equals(branchId).toArray();
    if (ds.length === 0) return { soRun: 0, tyLeCacheHit: 0, tyLeFallback: 0, tongForbidden: 0 };
    const hit = ds.filter((r) => r.cacheHit).length;
    const fb = ds.filter((r) => r.fallbackReason !== '').length;
    const forbidden = ds.reduce((t, r) => t + r.forbiddenCount, 0);
    return {
      soRun: ds.length,
      tyLeCacheHit: hit / ds.length,
      tyLeFallback: fb / ds.length,
      tongForbidden: forbidden,
    };
  }
}
