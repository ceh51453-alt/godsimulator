/**
 * Lập kế hoạch, validate và giải quyết ý định — Phần 67.4, 67.5, 68 [BB].
 *
 * [BB] 67.5 — `failure` KHÔNG được là "hệ thống không hiểu". Nó phải nêu nguyên nhân
 * TRONG THẾ GIỚI: thiếu thời gian, không biết đường, luật cấm, người kia không đồng ý,
 * vật liệu không có, cơ thể không chịu nổi.
 *
 * [BB] "Nếu còn một con đường hợp lý, resolver trả `partial`, `alternative` hoặc
 * `project_started`, KHÔNG dựng tường."
 *
 * [BB] 67.3 — resolver lập kế hoạch trên WorldView + Knowledge của chủ thể,
 * KHÔNG bao giờ trên World thật.
 */
import type { WorldView } from '../contracts/view.js';
import type { Event } from '../contracts/core.js';
import type { Intent, ActionPlan, ActionOutcome, Project, KnowledgeRecord } from './schema.js';
import type { Tuning } from '../tuning/schema.js';
export type NgocCanhGiai = {
    view: WorldView;
    intent: Intent;
    /** Tri thức của chủ thể. [BB] Kế hoạch chỉ được dựa trên đây, không dựa World. */
    triThuc: readonly KnowledgeRecord[];
    tuning: Tuning;
    seed: string;
    tick: number;
};
/**
 * Lập ActionPlan từ Intent.
 * [BB] 67.4 — validator kiểm luật, vật lý, tri thức, quyền truy cập, thời gian, invariant.
 */
export declare function lapKeHoach(nc: NgocCanhGiai): ActionPlan;
/** Việc dài hơn một cảnh thì thành Project — Phần 68. */
export declare function nenThanhProject(intent: Intent): boolean;
/**
 * Dựng Project từ Intent. Milestone và requirement được suy ra từ ẩn số của kế hoạch,
 * KHÔNG bịa ra từ không khí.
 */
export declare function taoProject(nc: NgocCanhGiai, plan: ActionPlan): Project;
export type KetQuaGiai = {
    plan: ActionPlan;
    outcome: ActionOutcome;
    /** Event chưa áp — người gọi đưa qua `apDungEvent`. */
    events: readonly Event[];
    project: Project | null;
};
/**
 * Giải quyết một Intent thành Outcome + Event.
 *
 * [BB] Hàm này KHÔNG sửa state. Nó sinh Event; transaction mới là nơi state đổi.
 */
export declare function giaiQuyet(nc: NgocCanhGiai): KetQuaGiai;
