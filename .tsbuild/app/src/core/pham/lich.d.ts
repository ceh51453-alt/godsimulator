/**
 * Lịch một ngày — Phần 50.4, 70.3 [BB].
 *
 * ── Cổng Phase 7 đòi một câu rất cụ thể ──
 *
 * > "NPC ngoài cảnh giữ lịch và vị trí."
 *
 * Cách sai là mô phỏng từng NPC từng giờ. Cách đúng là: **lịch là một hàm thuần
 * của hoàn cảnh**, nên không cần mô phỏng gì cả — hỏi lúc nào cũng ra đúng câu
 * trả lời, và câu trả lời đổi khi hoàn cảnh đổi.
 *
 * Nhờ vậy một NPC ở làng bên, không ai nhìn suốt bốn mươi năm, vẫn "đang ở ngoài
 * ruộng lúc này" — và khi người chơi đi tới, họ ở ngoài ruộng thật.
 *
 * [BB] Không `Date.now`. `startOffset` là phần của một nhịp, không phải giờ đồng hồ.
 */
import type { WorldState } from '../engine/state.js';
import type { ScheduleBlock } from '../contracts/primitives.js';
/** Vùng cư trú theo link `cu_tru_tai` còn hiệu lực. */
export declare function noiOCua(state: WorldState, id: string): string | null;
/**
 * Lịch một nhịp của một người, suy từ hoàn cảnh.
 *
 * Bốn khối, theo đúng thứ tự một ngày: ngủ, làm, ăn với nhà, và phần còn lại.
 * Người ốm thì khối làm biến thành khối nằm; trẻ con thì thành khối học; người
 * già không có khối làm. Không ai phải viết một cái state machine cho việc này.
 */
export declare function lichCua(state: WorldState, nguoiId: string): readonly ScheduleBlock[];
/**
 * Người này đang ở đâu và làm gì vào lúc `phanNhip` của nhịp hiện tại.
 *
 * `phanNhip` là 0…1 trong một nhịp. Mặc định 0.5 — giữa buổi, tức là lúc người
 * ta đang làm việc; đó là câu trả lời đúng cho câu hỏi "giờ này họ ở đâu".
 */
export declare function dangODau(state: WorldState, nguoiId: string, phanNhip?: number): {
    noiId: string | null;
    viec: string;
};
/** Nhãn tiếng Việt cho việc trong lịch — [BB] 36.7, UI không hiện chuỗi máy. */
export declare const NHAN_VIEC: Readonly<Record<string, string>>;
export declare function nhanViec(viec: string): string;
/**
 * Ai đang có mặt ở một nơi vào lúc này.
 *
 * Đây là hàm mà đối thoại và nghe lỏm cần: "ai đứng đủ gần để nghe" phải suy từ
 * lịch, không phải từ danh sách cư dân. Người đang ngoài ruộng thì không nghe
 * được chuyện nói trong nhà, dù cùng làng.
 */
export declare function aiDangO(state: WorldState, noiId: string, phanNhip?: number): readonly {
    id: string;
    viec: string;
}[];
