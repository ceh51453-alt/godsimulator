import type { ImportIssue } from '../contracts/primitives.js';
export type NutMacro = {
    readonly loai: 'van';
    readonly text: string;
} | {
    readonly loai: 'macro';
    readonly ten: string;
    /** Mỗi đối số lại là một cây con — macro lồng nhau là chuyện thường. */
    readonly doiSo: readonly (readonly NutMacro[])[];
    readonly raw: string;
};
/** Macro có ánh xạ native — 63.5. Mọi thứ ngoài danh sách này là `needs_adapter`. */
export declare const MACRO_BIET: readonly ["char", "user", "persona", "description", "lastusermessage", "trim", "newline", "random", "pick", "setvar", "getvar", "addvar", "incvar", "setglobalvar", "getglobalvar", "addglobalvar", "noop", "roll", "macro"];
/**
 * Tách một chuỗi thành cây macro.
 *
 * Bộ quét đếm ngoặc thật sự thay vì tìm `}}` gần nhất, nên `{{a::{{b}}}}` cho ra
 * một macro `a` với một đối số là macro `b`, chứ không phải hai mảnh vỡ.
 */
export declare function docMacro(text: string): NutMacro[];
/** Tên mọi macro xuất hiện trong một chuỗi, kể cả lồng nhau. Đã khử trùng, đã sắp. */
export declare function macroTrongChuoi(text: string): string[];
/** Macro nào trong chuỗi chưa có ánh xạ native. */
export declare function macroChuaHoTro(text: string): string[];
export type NguCanhMacro = {
    /** Tên chủ thể đang được kể — lấy từ `WorldView` đã chiếu, không từ World thô. */
    readonly char: string;
    /**
     * [BB] Phần 78.11 — `{{user}}` chỉ nhận `ProjectedPlayerPersona`.
     * Không có đường nào từ đây tới `PlayerProfile`.
     */
    readonly user: string;
    readonly persona: string;
    readonly description: string;
    readonly lastUserMessage: string;
    readonly sceneId: string;
    readonly moduleId: string;
    readonly turn: number;
    readonly maxDepth: number;
    /** Biến của pack. Khóa KHÔNG mang tiền tố; namespace nằm ở tầng lưu. */
    readonly bien: Readonly<Record<string, unknown>>;
};
export type KetQuaGiai = {
    readonly text: string;
    /** Macro không biết, giữ nguyên raw trong `text`. */
    readonly chuaGiai: readonly string[];
    readonly bienSau: Readonly<Record<string, unknown>>;
    readonly issues: readonly ImportIssue[];
    /** Directive `{{trim}}` đã gặp — compiler dùng để cắt whitespace hai đầu. */
    readonly canTrim: boolean;
};
/** Namespace biến của một pack — 63.5 [BB]. */
export declare function khoaBienPack(packId: string, ten: string): string;
/**
 * Giải macro trên một chuỗi.
 *
 * `maxDepth` đến từ `tuning.preset.maxMacroDepth`. Vượt giới hạn không throw —
 * nó trả về raw kèm một issue, đúng nguyên tắc 4 (mâu thuẫn thành nội dung).
 */
export declare function giaiMacro(text: string, ctx: NguCanhMacro): KetQuaGiai;
