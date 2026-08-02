/**
 * Bản tin thế giới — "chuyện gì đã xảy ra trong lúc ta đang nói chuyện".
 *
 * Đây là chỗ mười hai tiến trình nền **trả về giá trị cho vòng chat**. Không có
 * file này, Phase 5 chỉ là một bảng tính chạy nền: đúng nhưng vô hình.
 *
 * Ba ràng buộc:
 *
 *   1. [BB] 71.5 — LLM không giữ sổ. Bản tin CHỈ chứa thứ tiến trình đã sinh ra;
 *      nó không được thêm một con số nào. Narrator chọn và kể, không bịa.
 *   2. [BB] 72.2 — "Event xa chỉ chen vào scene nếu tin/ảnh hưởng có đường tới nơi."
 *      Vì vậy `banTinCho()` lọc theo **điều chủ thể thật sự biết**, không theo
 *      điều đã xảy ra.
 *   3. [BB] 56.2 — tầng phàm nhân không thấy số. Mọi mục có `loiKe` bằng tiếng
 *      Việt, dùng được nguyên văn.
 */
import type { WorldState } from '../engine/state.js';
import type { ViewMode } from '../contracts/primitives.js';
import type { UngVienSuKien } from './process/types.js';
export type MucBanTin = {
    readonly loai: string;
    readonly mucDo: 'thuong' | 'lon' | 'trong_dai';
    readonly loiKe: string;
    readonly locationId: string | null;
    readonly chuTheIds: readonly string[];
    /** Chủ thể biết chuyện này qua đâu: tự thấy, nghe kể, hay chưa biết. */
    readonly duong: 'chung_kien' | 'nghe_ke' | 'chua_toi';
};
export type BanTin = {
    readonly tickTu: number;
    readonly tickDen: number;
    readonly muc: readonly MucBanTin[];
    /** Câu mở đầu gợi ý cho Narrator; rỗng khi không có gì đáng nói. */
    readonly tomTat: string;
};
/**
 * Khoảng cách theo số chặng đường từ `tuId`, giới hạn `toiDa` chặng.
 * BFS trên đồ thị tuyến đường thông suốt — cùng đồ thị mà tin tức phải đi.
 */
export declare function soChangToi(state: WorldState, tuId: string, toiDa?: number): Map<string, number>;
/**
 * Dựng bản tin cho một chủ thể ở một tầng.
 *
 * Sáng Thế thấy tất cả — đó là định nghĩa của tầng ấy. Thần và phàm nhân chỉ
 * thấy thứ có đường tới chỗ mình; thứ ở xa hơn `banKinh` chặng thì **không lọt
 * vào bản tin**, kể cả khi nó vừa xảy ra.
 */
export declare function banTinCho(state: WorldState, suKien: readonly UngVienSuKien[], mode: ViewMode, chuTheId: string | null, tickTu: number, tickDen: number, banKinh?: number): BanTin;
