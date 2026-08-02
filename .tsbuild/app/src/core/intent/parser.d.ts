import type { Intent } from './schema.js';
import type { WorldView } from '../contracts/view.js';
import type { ViewMode, EntityRef } from '../contracts/primitives.js';
/** Bỏ dấu tiếng Việt để khớp từ khóa mà không phụ thuộc cách gõ. */
export declare function boDau(s: string): string;
/**
 * Tìm entity được nhắc tới trong câu.
 * [BB] Chỉ khớp trên `view.entities` — thứ chủ thể ĐƯỢC PHÉP BIẾT.
 * Không bao giờ khớp trên World thật, nếu không đây thành đường rò rỉ.
 */
export declare function timMucTieu(cau: string, view: WorldView): EntityRef[];
export type ThamSoParse = {
    id: string;
    branchId: string;
    sceneId: string | null;
    actorId: string;
    mode: ViewMode;
    view: WorldView;
};
/**
 * Parse một câu tự do thành Intent.
 *
 * [BB] LUÔN trả về một Intent. `confidence` thấp là tín hiệu để UI hỏi lại,
 * KHÔNG phải lý do từ chối.
 */
export declare function parseIntent(rawText: string, ts: ThamSoParse): Intent;
/** Người chơi sửa lại Intent trong UI — đánh dấu `user_corrected`. */
export declare function suaIntent(goc: Intent, sua: Partial<Pick<Intent, 'goal' | 'targetRefs' | 'method' | 'horizon'>>): Intent;
/** Động từ/hành động parser đoán được, để affordance collector dùng lại. */
export declare function refDoanDuoc(rawText: string): {
    ref: string;
    nguon: 'action' | 'verb' | '';
};
export declare function laDauHieuProject(rawText: string): boolean;
