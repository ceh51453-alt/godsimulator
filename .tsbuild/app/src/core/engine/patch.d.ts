/**
 * Patch validator và bộ áp patch — Phase 1 [BB].
 *
 * [BB] Luật bất biến #4: mọi thay đổi state đi theo đúng một đường
 *   Command → Intent → ActionPlan/Project → validated Event + Patch
 *          → transaction → WorldState → WorldView → Narrator/UI
 *
 * [BB] Cổng Phase 1: "patch lỗi không để state nửa vời."
 * Vì vậy áp patch LUÔN theo hai pha: validate hết trước, chỉ ghi khi cả lô hợp lệ.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState, TenBang } from './state.js';
import type { KetQua, StructuredError } from '../contracts/errors.js';
/** Bản ghi mà một patch có thể trỏ tới. */
type BanGhi = Record<string, unknown>;
/**
 * Thông tin hoàn tác chính xác cho MỘT lô patch.
 *
 * Giữ bản gốc của đúng những bản ghi bị chạm, thay vì snapshot cả state.
 * Nhờ vậy rollback là O(số bản ghi bị chạm), không phải O(kích thước thế giới) —
 * điều kiện bắt buộc để chạy 10.000 bước replay trong thời gian hợp lý.
 */
export type ThongTinHoanTac = {
    /** `${bang}|${id}` → bản ghi gốc, hoặc `null` nếu trước đó chưa tồn tại. */
    readonly truoc: ReadonlyMap<string, BanGhi | null>;
};
export type PhamViThayDoi = {
    readonly entities: ReadonlySet<string>;
    readonly links: ReadonlySet<string>;
    readonly gaps: ReadonlySet<string>;
    readonly knowledge: ReadonlySet<string>;
    readonly debts: ReadonlySet<string>;
    readonly prayers: ReadonlySet<string>;
    readonly storylines: ReadonlySet<string>;
    readonly foreshadows: ReadonlySet<string>;
    readonly chamWorld: boolean;
    readonly chamMetrics: boolean;
};
/**
 * Phạm vi rỗng, kèm phần ghi đè.
 *
 * Dựng object này bằng tay ở nơi gọi nghĩa là mỗi lần thêm một bảng thì mọi chỗ
 * gọi đều vỡ — đã xảy ra hai lần (Phase 5 thêm `knowledge`/`debts`, Phase 6 thêm
 * `prayers`). Helper này giữ hình dạng ở đúng một chỗ.
 */
export declare function phamVi(ghiDe?: Partial<PhamViThayDoi>): PhamViThayDoi;
export type KetQuaApPatch = {
    /** Số bản ghi bị chạm. */
    soBanGhiDoi: number;
    hoanTac: ThongTinHoanTac;
    phamVi: PhamViThayDoi;
    canhBao: readonly StructuredError[];
};
/** Hoàn tác chính xác một lô patch đã áp. */
export declare function hoanTacPatch(s: WorldState, ht: ThongTinHoanTac): void;
/**
 * Áp một lô patch theo kiểu tất-cả-hoặc-không.
 *
 * Pha 1 — dựng bản nháp của từng bản ghi bị chạm và áp lên nháp;
 * Pha 2 — validate lại từng bản nháp bằng schema;
 * Pha 3 — chỉ khi mọi thứ sạch mới ghi đè vào state thật.
 *
 * Nhờ vậy patch thứ năm hỏng thì bốn patch trước KHÔNG lưu lại dấu vết.
 */
export declare function apPatch(s: WorldState, ops: readonly PatchOp[]): KetQua<KetQuaApPatch>;
/** Đọc một giá trị theo `PatchOp.target` — dùng cho invariant và test. */
export declare function docTheoTarget(s: WorldState, bang: TenBang, id: string, duongDan: string): unknown;
export {};
