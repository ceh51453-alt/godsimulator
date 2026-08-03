/**
 * Hiện thực hóa các "neo" có hình dạng thực thể trong Lorebook.
 *
 * Lorebook vẫn là nguồn định hướng, không phải toàn bộ lịch sử được đóng dấu sẵn.
 * Vì vậy chỉ entry tự khai rõ mình là nhân vật/thần/nơi chốn/khái niệm mới được
 * tạo thành entity khi bật sách. Những entry còn lại đi qua retrieval và được
 * Narrator đưa vào thế giới dần dần.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Lorebook, LorebookEntry } from './schema.js';
export type NeoLore = Readonly<{
    ten: string;
    kind: 'mortal' | 'deity' | 'place' | 'concept';
    aliases: readonly string[];
}>;
/** Đọc một neo rõ ràng; không đoán mọi entry thành nhân vật. */
export declare function docNeoLore(entry: LorebookEntry): NeoLore | null;
/**
 * Tạo entity cho các neo chưa tồn tại. Cùng state + lorebook cho cùng id/thứ tự.
 * Entity đã thành Sử không bị xóa khi tắt sách.
 */
export declare function vatChatHoaLorebook(lorebook: Lorebook, state: WorldState, eventId: string): readonly Entity[];
