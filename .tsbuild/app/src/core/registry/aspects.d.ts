/**
 * Aspect dựng sẵn.
 *
 * - `ASPECT_IDS_42` — đúng mười hai aspect của bảng Phần 4.2 [MR]. Danh sách này
 *   ĐÓNG: thêm hay bớt một dòng là lệch đặc tả.
 * - `ASPECT_IDS_NEN` — aspect nền của Thế Giới Sống, thêm ở Phase 5 theo Phần 71.2
 *   và ma trận 72.4 (ADR-0021). Phần 4.2 là danh sách khởi đầu, không phải trần.
 */
import type { AspectDef } from './types.js';
export declare const ASPECTS_DUNG_SAN: readonly AspectDef[];
export declare const ASPECT_IDS: string[];
/** Mười hai aspect của Phần 4.2 — cổng Phase 0 kiểm đúng danh sách này. */
export declare const ASPECT_IDS_42: string[];
/** Aspect nền của Phần 71.2 — cổng Phase 5 kiểm đúng danh sách này. */
export declare const ASPECT_IDS_NEN: string[];
/** Aspect tầng Thần của Phần 69 — cổng Phase 6 kiểm đúng danh sách này. */
export declare const ASPECT_IDS_THAN: string[];
/** Aspect tầng Phàm Nhân của Phần 70 — cổng Phase 7 kiểm đúng danh sách này. */
export declare const ASPECT_IDS_PHAM: string[];
/** Aspect của hai bảng Phase 11 — Phần 59.1. */
export declare const ASPECT_IDS_BANG: string[];
