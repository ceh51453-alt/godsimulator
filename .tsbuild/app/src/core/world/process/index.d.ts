import type { TienTrinhNen } from './types.js';
/**
 * Mười hai tiến trình đã nối handler, sắp xếp theo id để mọi lần chạy đều
 * duyệt cùng thứ tự (luật bất biến #7).
 */
export declare function moiTienTrinh(): readonly TienTrinhNen[];
/** Chỉ dùng trong test: buộc dựng lại danh sách sau khi đổi registry. */
export declare function datLaiTienTrinh(): void;
/** Id tiến trình chưa có handler — cổng Phase 5 đòi danh sách này rỗng. */
export declare function tienTrinhThieuHandler(): readonly string[];
export * from './types.js';
export { moiNoiChon, langGieng, docAspect, lam, kep, tongCohort, laoDong } from './tienIch.js';
