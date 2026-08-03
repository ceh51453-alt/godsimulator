/**
 * Adapter merge — Triển khai native cho hai tính năng của kemini_noass.
 *
 * Script kemini_noass bị cách ly (64.2), nhưng hai tính năng cốt lõi của nó
 * được triển khai natively:
 *
 * 1. **In-prompt `<regex>`**: Parse `<regex order=N>"/pat/flags" : "repl"</regex>`
 *    và chạy chúng theo 3 orders. Đây là cơ chế mà preset dùng để biến đổi nội
 *    dung prompt từ bên trong chính prompt.
 *
 * 2. **Capture + tag replace**: Bắt dữ liệu từ output AI theo regex rules, lưu
 *    trữ, và thay thế tag tương ứng trong prompt lần sau.
 *
 * [BB] Adapter KHÔNG có quyền: chạm WorldState, sửa Event, gọi model, hay chạy
 * code tùy ý. Nó chỉ biến đổi CHUỖI VĂN BẢN trong pipeline prompt/output.
 */
import { bienRegex, MAX_KY_TU } from './sandbox.js';

// ─────────────────────────────────────────── in-prompt regex

/**
 * Parse và chạy `<regex>` blocks bên trong nội dung prompt.
 *
 * kemini_noass chạy 3 orders:
 *   order 1: chạy TRƯỚC xử lý role prefix
 *   order 2: chạy SAU merge
 *   order 3: chạy SAU order 2
 *
 * Ở đây ta chạy cả 3 orders trên chuỗi đã phẳng hóa — không cần phân biệt vì
 * prompt của game đã qua pipeline riêng.
 */
const REGEX_BLOCK_RE =
  /<regex(?:\s+order\s*=\s*(\d))?\s*>\s*"\/((?:\\.|[^"/\r\n])*)\/([gimsuy]*)"\s*:\s*"((?:\\.|[^"\r\n])*)"\s*<\/regex>/gm;
const REGEX_CLEAN_RE = /<regex(?: +order *= *\d)?>[^]*?<\/regex>/gm;

export type InPromptRegexResult = {
  readonly text: string;
  readonly applied: number;
  readonly errors: readonly string[];
};

type RegexBlock = { order: number; pattern: string; flags: string; replacement: string };

function docBlocks(text: string): RegexBlock[] {
  const blocks: RegexBlock[] = [];
  for (const m of text.matchAll(REGEX_BLOCK_RE)) {
    blocks.push({
      order: parseInt(m[1] ?? '2', 10),
      pattern: m[2] ?? '',
      flags: m[3] ?? '',
      replacement: m[4] ?? '',
    });
  }
  return blocks;
}

function docReplacement(raw: string): string {
  try {
    return JSON.parse(`"${raw.replace(/\\?"/g, '\\"')}"`) as string;
  } catch {
    return raw;
  }
}

export function apInPromptRegex(
  text: string,
  tuyChon: { maxRegexMs?: number; dongHo?: () => number } = {},
): InPromptRegexResult {
  const errors: string[] = [];
  let applied = 0;
  const blocks = docBlocks(text);

  if (blocks.length === 0) return { text, applied: 0, errors: [] };
  if (text.length > MAX_KY_TU) {
    return { text, applied: 0, errors: [`Prompt vượt trần regex ${MAX_KY_TU} ký tự; giữ nguyên.`] };
  }

  // Remove all regex blocks from text first
  let result = text.replace(REGEX_CLEAN_RE, '');
  const dongHo = tuyChon.dongHo ?? (() => 0);
  const tran = tuyChon.maxRegexMs ?? Number.POSITIVE_INFINITY;

  // Apply by order: 1, 2, 3
  for (const ord of [1, 2, 3]) {
    for (const b of blocks) {
      if (b.order !== ord) continue;
      try {
        const daBien = bienRegex(`/${b.pattern}/${b.flags}`);
        if (daBien === null) {
          errors.push(`Regex order=${b.order} bị từ chối vì cú pháp hoặc hình dạng quay lui nguy hiểm.`);
          continue;
        }
        const truoc = result;
        const batDau = dongHo();
        const sau = result.replace(daBien.re, docReplacement(b.replacement));
        const ms = dongHo() - batDau;
        if (ms > tran) {
          result = truoc;
          errors.push(`Regex order=${b.order} chạy ${ms} ms, vượt trần ${tran} ms; giữ bản gốc.`);
          continue;
        }
        result = sau;
        applied++;
      } catch (e) {
        errors.push(`Regex order=${b.order} lỗi: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return { text: result, applied, errors };
}

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
export function apInPromptRegexMessages(
  messages: readonly PromptMessageLike[],
  tuyChon: { maxRegexMs?: number; dongHo?: () => number } = {},
): { messages: readonly PromptMessageLike[]; applied: number; errors: readonly string[] } {
  const mutable = (m: PromptMessageLike): boolean => !m.moduleId.startsWith('td:');
  const blocks = messages.flatMap((m) => (mutable(m) ? docBlocks(m.content) : []));
  if (blocks.length === 0) return { messages, applied: 0, errors: [] };

  const errors: string[] = [];
  let applied = 0;
  let ra = messages.map((m) => (mutable(m) ? { ...m, content: m.content.replace(REGEX_CLEAN_RE, '') } : m));
  if (ra.reduce((n, m) => n + m.content.length, 0) > MAX_KY_TU) {
    return { messages, applied: 0, errors: [`Prompt vượt trần regex ${MAX_KY_TU} ký tự; giữ nguyên.`] };
  }

  const dongHo = tuyChon.dongHo ?? (() => 0);
  const tran = tuyChon.maxRegexMs ?? Number.POSITIVE_INFINITY;
  for (const ord of [1, 2, 3]) {
    for (const b of blocks) {
      if (b.order !== ord) continue;
      const daBien = bienRegex(`/${b.pattern}/${b.flags}`);
      if (daBien === null) {
        errors.push(`Regex order=${b.order} bị từ chối vì cú pháp hoặc hình dạng quay lui nguy hiểm.`);
        continue;
      }
      const truoc = ra;
      const batDau = dongHo();
      try {
        const repl = docReplacement(b.replacement);
        const sau = ra.map((m) => (mutable(m) ? { ...m, content: m.content.replace(daBien.re, repl) } : m));
        const ms = dongHo() - batDau;
        if (ms > tran) {
          errors.push(`Regex order=${b.order} chạy ${ms} ms, vượt trần ${tran} ms; giữ bản gốc.`);
          ra = truoc;
          continue;
        }
        ra = sau;
        applied++;
      } catch (e) {
        ra = truoc;
        errors.push(`Regex order=${b.order} lỗi: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  return { messages: ra, applied, errors };
}

// ─────────────────────────────────────────── capture + tag replace

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
export function captureFromOutput(
  output: string,
  rules: readonly CaptureRule[],
  existing: CapturedData,
): { data: CapturedData; changed: boolean } {
  const data: CapturedData = { ...existing };
  let changed = false;

  for (const rule of rules) {
    if (!rule.enabled) continue;

    try {
      // Parse regex pattern
      const regexMatch = rule.regex.match(/^\/(.+)\/([gimsu]*)$/);
      if (!regexMatch) continue;

      const pattern = regexMatch[1]!;
      const flags = regexMatch[2]!;
      const re = new RegExp(pattern, flags);

      // Collect matches
      const matches: string[] = [];
      if (flags.includes('g')) {
        let m: RegExpExecArray | null;
        while ((m = re.exec(output)) !== null) {
          matches.push(m[0]);
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      } else {
        const m = re.exec(output);
        if (m) matches.push(m[0]);
      }

      if (matches.length === 0) continue;

      if (rule.updateMode === 'replace') {
        data[rule.tag] = [...matches];
        changed = true;
      } else {
        // accumulate — add new, skip duplicates
        const arr = data[rule.tag] ? [...data[rule.tag]!] : [];
        for (const match of matches) {
          if (!arr.includes(match)) {
            arr.push(match);
            changed = true;
          }
        }
        data[rule.tag] = arr;
      }
    } catch {
      // Skip invalid rules silently — don't crash the game
    }
  }

  return { data, changed };
}

/**
 * Thay thế tag bằng dữ liệu đã capture trong prompt.
 *
 * Nếu prompt chứa `<tag_name>` và `capturedData` có key `<tag_name>` với dữ liệu,
 * thì tag được thay bằng dữ liệu đó (nối bằng `\n`).
 */
export function replaceTagsInPrompt(prompt: string, captured: CapturedData): string {
  let result = prompt;
  for (const [tag, values] of Object.entries(captured)) {
    if (values.length === 0) continue;
    if (!result.includes(tag)) continue;
    const replacement = values.join('\n');
    result = result.split(tag).join(replacement);
  }
  return result;
}
