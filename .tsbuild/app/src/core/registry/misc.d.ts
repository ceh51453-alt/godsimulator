import type { GapDef, ActionDef, EndingDef, MetricDef, ProfileDef, StoryKindDef, MechanismDef, WorldProcessDef } from './types.js';
export declare const GAPS_DUNG_SAN: readonly GapDef[];
export declare const ACTIONS_DUNG_SAN: readonly ActionDef[];
export declare const ENDINGS_DUNG_SAN: readonly EndingDef[];
export declare const METRICS_DUNG_SAN: readonly MetricDef[];
export declare const PROFILES_DUNG_SAN: readonly ProfileDef[];
export declare const STORY_KINDS_DUNG_SAN: readonly StoryKindDef[];
export declare const MECHANISMS_DUNG_SAN: readonly MechanismDef[];
export declare const WORLD_PROCESSES_DUNG_SAN: readonly WorldProcessDef[];
/** Mọi tiến trình dựng sẵn, đúng thứ tự khai báo. */
export declare const WORLD_PROCESS_IDS: string[];
/**
 * Đúng mười hai tiến trình của bảng 71.2. Danh sách này ĐÓNG — phase sau thêm
 * tiến trình thì thêm vào danh sách riêng, không nhét vào đây (cùng lẽ với
 * ADR-0021 cho aspect).
 */
export declare const WORLD_PROCESS_IDS_712: readonly ["environment_cycle", "ecology", "population_household", "health_disease", "production_consumption", "exchange_debt", "settlement_infrastructure", "travel_communication", "institution_governance", "knowledge_technology", "culture_language_religion", "conflict_security"];
/** Tiến trình tầng Thần — Phase 6 (Phần 69, 22). */
export declare const WORLD_PROCESS_IDS_THAN: readonly ["divine_alienation", "prayer_flow", "divine_agency"];
/** Tiến trình tầng Phàm Nhân — Phase 7 (Phần 70). */
export declare const WORLD_PROCESS_IDS_PHAM: readonly ["mortal_daily", "household_lifecycle"];
/** Tiến trình tự sự — Phase 8 (Phần 28, 30). */
export declare const WORLD_PROCESS_IDS_TRUYEN: readonly ["storyline_beat"];
