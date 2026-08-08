/**
 * Bus sự kiện tương thích SillyTavern / Tavern Helper.
 *
 * Script preset không tự đi tìm dữ liệu — chúng **chờ sự kiện**. Một script dọn
 * chuỗi suy luận gắn vào `MESSAGE_RECEIVED`, một script chuyển cảnh gắn vào cùng
 * chỗ ấy rồi đọc tin nhắn cuối, một script giao diện gắn vào
 * `CHARACTER_MESSAGE_RENDERED`. Không có bus thì mọi script chỉ chạy đúng một lần
 * lúc nạp rồi nằm im — đó là lý do bản trước "chạy script" cũng vẫn vô dụng.
 *
 * Tên sự kiện lấy đúng chuỗi của SillyTavern (`event_types`) để script viết cho ST
 * không phải sửa một chữ nào.
 */

/** `tavern_events` — hằng số script đọc trực tiếp. */
export const TAVERN_EVENTS = Object.freeze({
  APP_READY: 'app_ready',
  EXTRAS_CONNECTED: 'extras_connected',
  MESSAGE_SWIPED: 'message_swiped',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_UPDATED: 'message_updated',
  MESSAGE_FILE_EMBEDDED: 'message_file_embedded',
  MORE_MESSAGES_LOADED: 'more_messages_loaded',
  IMPERSONATE_READY: 'impersonate_ready',
  CHAT_CHANGED: 'chat_id_changed',
  GENERATION_AFTER_COMMANDS: 'generation_after_commands',
  GENERATION_STARTED: 'generation_started',
  GENERATION_STOPPED: 'generation_stopped',
  GENERATION_ENDED: 'generation_ended',
  GENERATE_BEFORE_COMBINE_PROMPTS: 'generate_before_combine_prompts',
  GENERATE_AFTER_COMBINE_PROMPTS: 'generate_after_combine_prompts',
  GENERATE_AFTER_DATA: 'generate_after_data',
  CHAT_COMPLETION_PROMPT_READY: 'chat_completion_prompt_ready',
  CHAT_COMPLETION_SETTINGS_READY: 'chat_completion_settings_ready',
  STREAM_TOKEN_RECEIVED: 'stream_token_received',
  CHARACTER_MESSAGE_RENDERED: 'character_message_rendered',
  USER_MESSAGE_RENDERED: 'user_message_rendered',
  CHARACTER_EDITED: 'character_edited',
  CHARACTER_PAGE_LOADED: 'character_page_loaded',
  CHARACTER_DELETED: 'characterDeleted',
  CHARACTER_DUPLICATED: 'character_duplicated',
  SETTINGS_LOADED_AFTER: 'settings_loaded_after',
  WORLDINFO_SETTINGS_UPDATED: 'worldinfo_settings_updated',
  WORLDINFO_UPDATED: 'worldinfo_updated',
  WORLDINFO_FORCE_ACTIVATE: 'worldinfo_force_activate',
  CHATCOMPLETION_SOURCE_CHANGED: 'chatcompletion_source_changed',
  CHATCOMPLETION_MODEL_CHANGED: 'chatcompletion_model_changed',
  OAI_PRESET_CHANGED_BEFORE: 'oai_preset_changed_before',
  OAI_PRESET_CHANGED_AFTER: 'oai_preset_changed_after',
  OAI_PRESET_EXPORT_READY: 'oai_preset_export_ready',
  OAI_PRESET_IMPORT_READY: 'oai_preset_import_ready',
  GROUP_UPDATED: 'group_updated',
  GROUP_MEMBER_DRAFTED: 'group_member_drafted',
  CHAT_DELETED: 'chat_deleted',
  GROUP_CHAT_DELETED: 'group_chat_deleted',
});

/** Sự kiện riêng của Tavern Helper — `iframe_events`. */
export const IFRAME_EVENTS = Object.freeze({
  MESSAGE_IFRAME_RENDER_STARTED: 'message_iframe_render_started',
  MESSAGE_IFRAME_RENDER_ENDED: 'message_iframe_render_ended',
  VARIABLES_UPDATED: 'variables_updated',
  GENERATION_STARTED: 'js_generation_started',
  STREAM_TOKEN_RECEIVED_FULLY: 'js_stream_token_received_fully',
  STREAM_TOKEN_RECEIVED_INCREMENTALLY: 'js_stream_token_received_incrementally',
  GENERATION_ENDED: 'js_generation_ended',
});

export type XuLySuKien = (...tham: unknown[]) => unknown;

type Muc = {
  readonly fn: XuLySuKien;
  readonly chuSo: string;
  readonly motLan: boolean;
  /** -1 chạy trước, 0 bình thường, 1 chạy sau — `eventMakeFirst`/`eventMakeLast`. */
  uuTien: number;
  /** Thứ tự đăng ký, để hai handler cùng ưu tiên vẫn chạy ổn định. */
  readonly thuTu: number;
};

/**
 * Bus phát tuần tự và **chờ** handler bất đồng bộ.
 *
 * Chờ là điều bắt buộc: một script chuyển cảnh gọi `updatePresetWith()` bên trong
 * `MESSAGE_RECEIVED`, và nếu lượt kể tiếp theo bắt đầu trước khi nó xong thì
 * module bị bật/tắt sai nhịp — triệu chứng là "phải mất một lượt mới đổi cảnh".
 */
export class BusSuKien {
  private readonly bang = new Map<string, Muc[]>();
  private dem = 0;

  on(ten: string, fn: XuLySuKien, chuSo: string, motLan = false): void {
    const ds = this.bang.get(ten) ?? [];
    ds.push({ fn, chuSo, motLan, uuTien: 0, thuTu: this.dem++ });
    this.bang.set(ten, ds);
  }

  off(ten: string, fn: XuLySuKien): void {
    const ds = this.bang.get(ten);
    if (ds === undefined) return;
    this.bang.set(
      ten,
      ds.filter((m) => m.fn !== fn),
    );
  }

  /** Gỡ mọi handler của một script — gọi khi người dùng tắt script. */
  goTheoChuSo(chuSo: string): void {
    for (const [ten, ds] of this.bang) {
      this.bang.set(
        ten,
        ds.filter((m) => m.chuSo !== chuSo),
      );
    }
  }

  xoaSuKien(ten: string, fn?: XuLySuKien): void {
    if (fn === undefined) this.bang.delete(ten);
    else this.off(ten, fn);
  }

  datUuTien(ten: string, fn: XuLySuKien, uuTien: number): void {
    for (const m of this.bang.get(ten) ?? []) {
      if (m.fn === fn) m.uuTien = uuTien;
    }
  }

  soHandler(ten: string): number {
    return (this.bang.get(ten) ?? []).length;
  }

  async phat(ten: string, ...tham: unknown[]): Promise<void> {
    const ds = [...(this.bang.get(ten) ?? [])].sort((a, b) => a.uuTien - b.uuTien || a.thuTu - b.thuTu);
    if (ds.length === 0) return;
    for (const m of ds) {
      if (m.motLan) this.off(ten, m.fn);
      try {
        await m.fn(...tham);
      } catch (e) {
        /*
         * Một handler hỏng không được kéo theo cả lượt kể. Lỗi đi ra ngoài qua
         * `onLoi` để Xưởng Preset in được nó cạnh đúng script gây ra.
         */
        this.onLoi?.(m.chuSo, e instanceof Error ? e : new Error(String(e)), ten);
      }
    }
  }

  /** Người dùng bus cài chỗ nhận lỗi; mặc định là im lặng. */
  onLoi: ((chuSo: string, loi: Error, ten: string) => void) | null = null;
}
