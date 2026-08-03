/**
 * Port khai báo cho các Tavern Helper script phổ biến trong preset SillyTavern.
 *
 * JavaScript nguồn là dữ liệu không tin cậy và phụ thuộc DOM/API riêng của
 * SillyTavern. Thay vì `eval`, importer nhận diện ý đồ rồi dựng adapter native với
 * cấu hình hữu hạn. Runtime chỉ được đổi chuỗi prompt, dữ liệu pack và lựa chọn UI.
 */
import type { ScriptAdapterDef } from './schema.js';
type ScriptTho = Readonly<Record<string, unknown>>;
export declare function dungScriptAdapters(input: {
    readonly goc: Record<string, unknown>;
    readonly packId: string;
    readonly helperScripts: readonly ScriptTho[];
}): ScriptAdapterDef[];
export declare function docChiThiScene(output: string): Readonly<Record<string, boolean>>;
export {};
