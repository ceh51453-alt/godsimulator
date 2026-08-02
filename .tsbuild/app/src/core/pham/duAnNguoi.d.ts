/**
 * Project của người — Phần 68.3, 70.2; cổng Phase 7.
 *
 * > "Mở một Project nghề nghiệp và một quan hệ."
 *
 * ── Vì sao hai loại này, và vì sao chỉ hai ──
 *
 * Một đời người có vô số việc dài hơi, nhưng chỉ hai loại **đo được từ thế giới
 * mà không cần ai khai**: nghề (kỹ năng, bậc, học trò) và quan hệ (bốn trục,
 * hộ, giao ước). Mọi loại khác — "trả thù", "tìm sự thật về cha" — cần một cột
 * mốc do người kể đặt ra, và [BB] 68.3 cấm `progress` do ai đó khai.
 *
 * Nên hai loại này là **nền**: chúng chạy được không cần AI. Những Project giàu
 * chữ hơn tới ở Phase 8 cùng Storyline, và chúng sẽ dựa lên đúng cơ chế này.
 *
 * Song sinh với `than/duAn.ts` và cố ý giống nó: cùng một `ProjectSchema`, cùng
 * quy tắc "tiến độ đo từ thế giới". Người chơi và NPC dùng chung một cơ chế —
 * đó là điều 29.3 đòi.
 */
import type { WorldState } from '../engine/state.js';
import type { Project } from '../intent/schema.js';
export declare const LOAI_DU_AN_NGUOI: readonly ["ra_nghe", "truyen_nghe", "gan_lai", "lap_nha"];
export type LoaiDuAnNguoi = (typeof LOAI_DU_AN_NGUOI)[number];
export type UngVienDuAnNguoi = {
    readonly loai: LoaiDuAnNguoi;
    readonly goal: string;
    readonly diem: number;
    readonly stakeholderIds: readonly string[];
    readonly locationIds: readonly string[];
    readonly milestones: readonly {
        id: string;
        description: string;
    }[];
};
/**
 * Việc dài hơi mà người này có lý do để bắt đầu.
 *
 * Điểm suy từ hoàn cảnh, không từ một bảng ưu tiên: người học việc muốn ra nghề;
 * bậc thầy không còn ai để học thì muốn truyền; người vừa cãi nhau với ai đó
 * muốn hàn gắn; người trưởng thành có nghề mà chưa có nhà thì muốn lập nhà.
 */
export declare function ungVienDuAnNguoi(state: WorldState, nguoiId: string): readonly UngVienDuAnNguoi[];
/**
 * Loại của một Project, đọc từ id.
 *
 * KHÔNG tách theo vị trí. `pj_nguoi_<chuTheId>_<loai>_<tick>` có `chuTheId` chứa
 * dấu gạch dưới (`mortal_pc_0`, `nguoi_place_1_4_2`), nên đếm phần tử là sai —
 * và sai **im lặng**: không khớp loại nào thì mọi tiến độ đứng ở 0 mãi mãi, và
 * bài test duy nhất phủ nó lại thoát sớm vì không tìm thấy ứng viên.
 *
 * Khớp theo tên loại có ranh giới `_…_` thì id chứa bao nhiêu gạch dưới cũng đúng.
 */
export declare function loaiCuaDuAn(id: string): LoaiDuAnNguoi | null;
export declare function moDuAnNguoi(state: WorldState, nguoiId: string, ung: UngVienDuAnNguoi, tick: number): Project;
/**
 * Rà tiến độ. [BB] 68.3 — đo TỪ THẾ GIỚI, không ai được khai `progress = 1`.
 *
 * Trả `Project` mới; người gọi ghi lại bằng patch. Hàm không sửa state.
 */
export declare function raSoatDuAnNguoi(state: WorldState, pj: Project, tick: number): Project;
