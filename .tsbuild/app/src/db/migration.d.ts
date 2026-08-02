/**
 * Migration tăng dần có checkpoint — Phần 61.5, 79.1; cổng Phase 2.
 *
 * [BB] Quy tắc của 61.5:
 *   1. Chạy trong transaction.
 *   2. Ghi checkpoint và có thể tiếp tục sau crash.
 *   3. Không xóa v1 trước khi v2 kiểm hash và đếm record.
 *   4. Save export ghi `schemaVersion`.
 *   5. Import save mới hơn app → từ chối có giải thích, không thử đoán.
 *
 * Dexie tự lo phần đổi index. Việc còn lại — và là việc khó — là DI CHUYỂN DỮ LIỆU
 * từ khóa `id` trần của v1 sang khóa `[branchId+id]` của v2, và làm việc đó theo
 * lô có checkpoint để crash giữa chừng vẫn tiếp tục được.
 */
import type { ThienDienDb, MigrationCheckpoint } from './schema.js';
import type { KetQua, StructuredError } from '../core/contracts/errors.js';
/** Số bản ghi mỗi lô. Checkpoint được ghi sau mỗi lô. */
export declare const CO_LO = 500;
export type KetQuaMigration = {
    buocDaChay: readonly string[];
    soBanGhiDiChuyen: number;
    daBoQua: boolean;
    canhBao: readonly StructuredError[];
};
/**
 * v1 → v2: gán `branchId` cho mọi bản ghi thiếu, rồi kiểm đếm và hash trước khi
 * đánh dấu hoàn tất.
 *
 * Idempotent: chạy lại sau crash sẽ bỏ qua phần đã xong nhờ checkpoint.
 */
export declare function chayMigrationV1V2(db: ThienDienDb, branchMacDinh: string, tick: number): Promise<KetQua<KetQuaMigration>>;
/**
 * v2 → v3: thêm bảng Khối U và migrate PlayerState của save cũ.
 *
 * [BB] Phần 78.10 — save v3.0 trở xuống mở ra phải có:
 *   playerProfileId = null, creatorIdentityId = null,
 *   setupVersion = 0, setupCompleted = TRUE
 * Người chơi KHÔNG bị wizard chặn.
 */
export declare function chayMigrationV2V3(db: ThienDienDb, tick: number): Promise<KetQua<KetQuaMigration>>;
/**
 * v3 → v4: Thế Giới Sống.
 *
 * Hai bảng mới (`knowledge`, `debts`) sinh ra RỖNG — Dexie đã tạo index, không có
 * dữ liệu cũ nào phải di chuyển. Việc thật sự phải làm là **gieo state nền** cho
 * `place` của save cũ, vì mười hai tiến trình của 71.2 đọc những aspect đó và
 * một vùng thiếu `dan_cu` sẽ bị chúng bỏ qua lặng lẽ — thế giới đứng hình mà
 * không báo lỗi.
 *
 * [BB] Quy tắc 3 của 61.5 vẫn áp dụng: kiểm đếm trước khi tuyên bố hoàn tất.
 */
export declare function chayMigrationV3V4(db: ThienDienDb, tick: number): Promise<KetQua<KetQuaMigration>>;
/** Tháp tuổi tiền công nghiệp, làm tròn sao cho tổng bằng đúng `danSo`. */
export declare function chiaCohort(danSo: number): {
    child: number;
    youth: number;
    adult: number;
    elder: number;
};
/** Trữ lượng đủ nuôi vùng ở mức hiện tại, không hơn — không tặng thế giới của cải. */
export declare function sinhThaiTheoDan(danSo: number): Record<string, unknown>;
/** Chạy toàn bộ chuỗi migration theo thứ tự. Idempotent. */
export declare function chayMoiMigration(db: ThienDienDb, branchMacDinh: string, tick: number): Promise<KetQua<KetQuaMigration>>;
/**
 * [BB] Quy tắc 5 — save mới hơn app bị từ chối TỬ TẾ, có giải thích, không đoán.
 */
export declare function kiemPhienBanSave(schemaVersion: number): KetQua<number>;
/** Trạng thái migration cho bảng Chẩn Đoán (Phần 39). */
export declare function trangThaiMigration(db: ThienDienDb): Promise<readonly MigrationCheckpoint[]>;
