/**
 * Quản lý ván chơi đã lưu — Phần 26.1, 38; món nợ mở từ Phase 3.
 *
 * ── Vì sao file này ra đời muộn thế ──
 *
 * Phase 2 dựng đủ hạ tầng: copy-on-write theo nhánh, bia mộ, snapshot, export có
 * `schemaVersion`. Nhưng chưa có màn nào gọi tới nó, nên trong suốt mười phase
 * người chơi đóng tab là mất ván. Đây là chỗ nối hạ tầng ấy vào một danh sách mà
 * con người đọc được.
 *
 * ── Một ván = một NHÁNH ──
 *
 * Không có bảng `saves` riêng, và đó là chủ ý. Nhánh vốn đã là đơn vị của mọi
 * thứ có trạng thái (`entities`, `links`, `uiState`, `presetVars`…); thêm một
 * lớp "save" bọc ngoài nhánh sẽ tạo ra hai định danh cho cùng một thứ, và sớm
 * muộn hai định danh ấy sẽ lệch nhau. Bản Đồ Nhánh (26.2) đọc đúng danh sách này.
 */
import type { ThienDienDb } from './schema.js';
import type { KhoDexie } from './repo.js';
import type { WorldState } from '../core/engine/state.js';
import type { Event } from '../core/contracts/core.js';
import type { ViewMode } from '../core/contracts/primitives.js';
import type { KetQua } from '../core/contracts/errors.js';
/** Một dòng trong danh sách "Tiếp tục". */
export type MucSave = {
    readonly branchId: string;
    readonly worldId: string;
    readonly ten: string;
    readonly tick: number;
    readonly nam: number;
    readonly mode: ViewMode;
    readonly soEntity: number;
    readonly soSuKien: number;
    readonly stateHash: string;
    /** `null` = nhánh gốc, tức ván bắt đầu từ đầu chứ không tách ra từ ván khác. */
    readonly gocId: string | null;
    readonly lyDoTach: string;
};
/**
 * Nhãn mặc định cho một ván chưa được đặt tên.
 *
 * Không dùng đồng hồ máy: nhịp thế giới là thứ duy nhất người chơi nhận ra được
 * ván nào là ván nào, và nó cũng là thứ duy nhất replay lại đúng.
 */
export declare function nhanMacDinh(tick: number, mode: ViewMode): string;
/**
 * Liệt kê mọi ván đã lưu, mới nhất (nhịp cao nhất) lên trước.
 *
 * Sắp xếp deterministic tuyệt đối: theo nhịp giảm dần rồi theo id codepoint. Sắp
 * theo giờ máy sẽ đảo thứ tự giữa hai lần mở trên hai múi giờ khác nhau, và luật
 * bất biến #7 cấm đọc đồng hồ trong mọi thứ ảnh hưởng tới mô phỏng — danh sách
 * này thì không, nhưng giữ cùng một quy tắc rẻ hơn là nhớ hai quy tắc.
 */
export declare function danhSachSave(db: ThienDienDb): Promise<readonly MucSave[]>;
/**
 * Ghi toàn bộ ván xuống đĩa: bản ghi nhánh, state, event log, và một snapshot.
 *
 * Event `put` theo khóa kép `[branchId+id]` nên ghi lại cả log mỗi lần là **idempotent**
 * chứ không nhân đôi. Đắt hơn ghi tăng dần, nhưng nó đúng kể cả sau khi người
 * chơi hoàn tác, đổi nhánh hay nạp lại từ file — và một save sai thì không có
 * cách nào biết trước lúc mở lại.
 */
export declare function ghiVan(db: ThienDienDb, kho: KhoDexie, state: WorldState, events: readonly Event[], ten: string): Promise<void>;
/**
 * Ghi NHẸ: chỉ bản ghi nhánh và world, không đụng entity.
 *
 * Dùng ngay sau khi fork. `danhSachSave()` liệt kê từ bảng `worlds`, nên một
 * nhánh chưa có hàng world là một nhánh **không hiện ra ở đâu cả** — người chơi
 * tách nhánh xong, thấy thông báo thành công, rồi không tìm lại được nó.
 *
 * Cố ý không gọi `ghiState()`: [BB] copy-on-write — fork KHÔNG sao chép dữ liệu.
 * Entity của nhánh con vẫn lần lên nhánh cha cho tới khi có ghi thật, và ghi
 * thật là việc của lượt chơi đầu tiên trên nhánh ấy.
 */
export declare function ghiVanNhe(db: ThienDienDb, state: WorldState, ten: string): Promise<void>;
/** Đổi tên một ván. Tên rỗng đưa nó về nhãn mặc định ở lần liệt kê sau. */
export declare function doiTenVan(db: ThienDienDb, branchId: string, ten: string): Promise<void>;
/**
 * Xóa hẳn một ván.
 *
 * [BB] Không xóa nhánh đang có con: xóa cha sẽ làm phép đọc lần lên của mọi nhánh
 * con rơi vào hư không, và Dexie không có ràng buộc khóa ngoại để bắt điều đó.
 * Trả lỗi có cấu trúc thay vì im lặng làm hỏng dữ liệu của người khác.
 */
export declare function xoaVan(db: ThienDienDb, branchId: string): Promise<KetQua<number>>;
/** Ván gần nhất — thứ nút "Tiếp tục" mở ra khi người chơi không chọn gì. */
export declare function vanGanNhat(db: ThienDienDb): Promise<MucSave | null>;
/** Hash state hiện tại — dùng cho dòng "đã lưu" trên màn chính. */
export declare function hashVan(state: WorldState): string;
