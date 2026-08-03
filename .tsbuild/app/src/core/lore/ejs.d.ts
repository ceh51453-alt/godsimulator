/**
 * EJS Lorebook an toàn.
 *
 * Lorebook là dữ liệu không tin cậy nên không được đưa vào `eval`/`Function` hay renderer EJS
 * đầy đủ. Tầng này hỗ trợ phần hữu ích cho prompt động: `<%= duong.dan %>`, `<%- duong.dan %>`,
 * comment `<%# ... %>` và macro `{{user}}`. Mọi câu lệnh JavaScript khác bị loại bỏ và báo lỗi.
 */
import type { WorldState } from '../engine/state.js';
import type { Lorebook, LorebookEntry } from './schema.js';
export type NguCanhEjsLore = Readonly<{
    world: Readonly<{
        tick: number;
        year: number;
        phase: number;
        phaseLabel: string;
    }>;
    user: Readonly<{
        id: string;
        name: string;
        mode: string;
    }>;
    lore: Readonly<{
        bookName: string;
        activeEntryCount: number;
        realizedNames: string;
        gravity: number;
    }>;
    entry: Readonly<{
        id: string;
        name: string;
        keys: string;
        group: string;
        phase: number;
    }>;
}>;
export type KetQuaEjsLore = Readonly<{
    text: string;
    errors: readonly string[];
}>;
export declare function giaiDoanLore(lorebook: Lorebook, tick: number): number;
export declare function taoNguCanhEjsLore(s: WorldState, lorebook: Lorebook, entry: LorebookEntry): NguCanhEjsLore;
export declare function renderEjsLore(template: string, context: NguCanhEjsLore): KetQuaEjsLore;
