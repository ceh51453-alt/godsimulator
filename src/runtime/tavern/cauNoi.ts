/**
 * Hợp đồng giữa script preset và trò chơi.
 *
 * Script Tavern Helper gọi khoảng ba mươi hàm toàn cục. Đưa thẳng store vào
 * `api.ts` sẽ tạo vòng import (store → runtime → store) và làm runtime không test
 * được nếu không dựng cả Zustand. Nên runtime chỉ biết **một interface**, còn
 * store là nơi duy nhất cài nó.
 *
 * Mỗi phương thức ở đây là một quyền script thật sự có. Danh sách này ngắn có
 * chủ đích — không phải để chặn script, mà để câu hỏi "script làm được gì trong
 * ván chơi này" có một chỗ trả lời được bằng cách đọc, thay vì phải chạy thử.
 */

export type PhamViBien = {
  /** `script` = kho riêng của script, `chat`/`global` = biến pack, `message` = theo tin nhắn. */
  readonly type?: 'script' | 'chat' | 'global' | 'message' | 'character' | 'preset';
  readonly script_id?: string;
  readonly message_id?: number | string;
};

/** Một dòng trong khung kể, dạng mà script SillyTavern mong đợi. */
export type TinNhanTavern = {
  message_id: number;
  name: string;
  role: 'user' | 'assistant' | 'system';
  is_user: boolean;
  is_system: boolean;
  message: string;
  data: Record<string, unknown>;
  extra: Record<string, unknown>;
};

/** Prompt của preset ở dạng Tavern Helper — script bật/tắt bằng `enabled`. */
export type PromptTho = {
  id: string;
  name: string;
  enabled: boolean;
  role: 'system' | 'user' | 'assistant';
  content: string;
  /** `marker` của SillyTavern — script không nên sửa nội dung của nó. */
  marker?: boolean;
};

export type PresetTho = {
  settings: Record<string, unknown>;
  prompts: PromptTho[];
};

export type RegexTho = {
  id: string;
  script_name: string;
  enabled: boolean;
  find_regex: string;
  replace_string: string;
  source: { user_input: boolean; ai_output: boolean; slash_command: boolean; world_info: boolean };
  destination: { display: boolean; prompt: boolean };
  min_depth: number | null;
  max_depth: number | null;
};

export type MucNhatKy = 'log' | 'info' | 'warn' | 'error';

export type CauNoiTavern = {
  // ── biến ──
  docBien(pham: PhamViBien): Record<string, unknown>;
  ghiBien(pham: PhamViBien, bien: Record<string, unknown>): void;

  // ── khung kể ──
  docTinNhan(): readonly TinNhanTavern[];
  /** Sửa nội dung HIỂN THỊ của một dòng. Không đụng Event hay WorldState. */
  ghiTinNhan(messageId: number, noiDung: string): void;

  // ── preset ──
  tenPresetDangDung(): string;
  danhSachPreset(): readonly string[];
  docPreset(ten: string): PresetTho | null;
  ghiPreset(ten: string, preset: PresetTho): void;

  // ── văn bản ──
  thayMacro(text: string): string;
  /** Chạy regex của preset lên một chuỗi, theo đúng `source`/`destination` của ST. */
  chayRegex(
    text: string,
    tuyChon: { source?: 'user_input' | 'ai_output'; destination?: 'display' | 'prompt'; depth?: number },
  ): string;
  danhSachRegex(): readonly RegexTho[];
  batTatRegex(id: string, bat: boolean): void;

  // ── hành động ──
  /** `generate()` / `/send` — đẩy một lượt của người chơi vào ván. */
  guiLuot(text: string): Promise<string>;
  /** Toast. Trò chơi tự quyết hiện ở đâu. */
  bao(muc: 'info' | 'success' | 'warning' | 'error', text: string, tieuDe?: string): void;
  /** Nhật ký theo từng script, hiện trong Xưởng Preset. */
  ghiNhatKy(scriptId: string, muc: MucNhatKy, dong: string): void;
  /** `SillyTavern.getContext()` — ảnh chụp bối cảnh hiện tại. */
  boiCanh(): Record<string, unknown>;
};

/** Cầu nối rỗng — dùng khi chạy test hoặc khi chưa có ván nào mở. */
export function cauNoiRong(): CauNoiTavern {
  return {
    docBien: () => ({}),
    ghiBien: () => undefined,
    docTinNhan: () => [],
    ghiTinNhan: () => undefined,
    tenPresetDangDung: () => '',
    danhSachPreset: () => [],
    docPreset: () => null,
    ghiPreset: () => undefined,
    thayMacro: (t) => t,
    chayRegex: (t) => t,
    danhSachRegex: () => [],
    batTatRegex: () => undefined,
    guiLuot: async () => '',
    bao: () => undefined,
    ghiNhatKy: () => undefined,
    boiCanh: () => ({}),
  };
}
