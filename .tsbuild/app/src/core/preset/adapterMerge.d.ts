export type InPromptRegexResult = {
    readonly text: string;
    readonly applied: number;
    readonly errors: readonly string[];
};
export declare function apInPromptRegex(text: string, tuyChon?: {
    maxRegexMs?: number;
    dongHo?: () => number;
}): InPromptRegexResult;
export type PromptMessageLike = Readonly<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    moduleId: string;
    lane: string;
}>;
/**
 * Chạy regex nội tuyến chỉ trên module nhập. Message `td:*` là hợp đồng lõi và
 * không bao giờ được đưa vào biểu thức chính quy của preset.
 */
export declare function apInPromptRegexMessages(messages: readonly PromptMessageLike[], tuyChon?: {
    maxRegexMs?: number;
    dongHo?: () => number;
}): {
    messages: readonly PromptMessageLike[];
    applied: number;
    errors: readonly string[];
};
export type CaptureRule = {
    readonly enabled: boolean;
    readonly regex: string;
    readonly tag: string;
    readonly updateMode: 'accumulate' | 'replace';
};
export type CapturedData = Record<string, string[]>;
/**
 * Bắt dữ liệu từ output AI theo danh sách capture rules.
 *
 * Trả về bản sao `existing` với dữ liệu mới được merge vào.
 */
export declare function captureFromOutput(output: string, rules: readonly CaptureRule[], existing: CapturedData): {
    data: CapturedData;
    changed: boolean;
};
/**
 * Thay thế tag bằng dữ liệu đã capture trong prompt.
 *
 * Nếu prompt chứa `<tag_name>` và `capturedData` có key `<tag_name>` với dữ liệu,
 * thì tag được thay bằng dữ liệu đó (nối bằng `\n`).
 */
export declare function replaceTagsInPrompt(prompt: string, captured: CapturedData): string;
