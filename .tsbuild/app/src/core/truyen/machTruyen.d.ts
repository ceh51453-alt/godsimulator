/**
 * Máy sinh và máy chạy mạch truyện — Phần 28.4, 28.5, 28.6 [BB].
 *
 * ── Ba việc, và chúng phải tách nhau ──
 *
 *   quetMachTruyen()   dò tiền đề → sinh mạch mới      (bước 11 của tick)
 *   nhipMachTruyen()   đếm đồng hồ → chạy nhịp tới hạn
 *   hanNgachVangMat()  đo tỉ lệ vắng mặt người chơi    (28.6, bảng Chẩn Đoán)
 *
 * [BB] 28.5 — cả ba là ENGINE THUẦN. Không một lời gọi LLM nào ở file này. Đó là
 * điều làm cho hai mươi tư mạch chạy song song mà chi phí bằng 0; khi ống kính
 * chiếu tới thì Narrator mới viết cảnh, và nó viết trên nhịp đã có sẵn.
 *
 * [BB] 28.2 — `nguoiChoiBiet = false` phải là ĐA SỐ. Mạch mới sinh ra luôn để
 * `false`; chỉ có `banTin` (72.2) hoặc ống kính mới lật nó lên.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Rng } from '../engine/rng.js';
import type { Tuning } from '../tuning/schema.js';
import type { GiaiDoanMach, Storyline } from '../schema/truyen.js';
import type { Beat } from './loaiMach.js';
/**
 * Id mạch: hàm thuần của (loại, bộ nhân vật chính).
 *
 * Cố ý KHÔNG có tick trong id. Nhờ vậy phép chống trùng ở bước 2 của 28.4 chỉ là
 * một phép tra Map, và một mạch đã kết thúc không bị sinh lại dưới id khác chỉ
 * vì thời gian đã trôi. Đây đúng là bài học của lỗi #2 Phase 6b, đọc ngược lại:
 * ở đó id cần thêm số thứ tự vì hai lần tách là hai việc khác nhau; ở đây hai
 * lần dò ra cùng một mối thù là CÙNG một câu chuyện.
 */
export declare function idMach(branchId: string, loai: string, nhanVatIds: readonly string[]): string;
export type KetQuaQuetMach = {
    readonly patches: readonly PatchOp[];
    readonly machMoi: readonly Storyline[];
    /** Ứng viên bị bỏ vì đụng trần `machToiDa` — vào bảng Chẩn Đoán. */
    readonly soBiTran: number;
};
export type NgocCanhTruyen = {
    readonly tick: number;
    readonly eventId: string;
    readonly tuning: Tuning;
    readonly rng: Rng;
    /** Entity người chơi đang nhập, nếu có. Dùng cho hạn ngạch vắng mặt. */
    readonly nguoiChoiId: string | null;
};
/**
 * Bước 11 của tick — quét mạch truyện, ngay trước quét lỗ hổng.
 *
 * Bốn việc của 28.4, đúng thứ tự:
 *   1. mỗi `tienDe(w)` trả danh sách ứng viên;
 *   2. lọc trùng theo (loại, bộ nhân vật chính) với mạch ĐANG hoạt động;
 *   3. giới hạn tổng mạch đang chạy = `tuning.truyen.machToiDa`;
 *   4. ưu tiên mạch có nhân vật spotlight cao, nhưng KHÔNG loại bỏ hoàn toàn
 *      mạch ở vùng xa — giữ hạn ngạch tối thiểu (28.6).
 */
export declare function quetMachTruyen(s: WorldState, nc: NgocCanhTruyen): KetQuaQuetMach;
export type NhipDaChay = {
    readonly machId: string;
    readonly beat: Beat;
    readonly giaiDoan: GiaiDoanMach;
    readonly nguoiChoiCoMat: boolean;
};
export type KetQuaNhipMach = {
    readonly patches: readonly PatchOp[];
    readonly daChay: readonly NhipDaChay[];
};
/**
 * Mỗi tick: `dongHo -= 1`. Chạm 0 → mạch tiến một nhịp.
 *
 * [BB] 28.5 — "mạch không được chăm sóc quá lâu ở `phat_trien` sẽ rơi vào
 * `chet_yeu`, và ĐÓ CŨNG LÀ MỘT KẾT CỤC HỢP LỆ, được ghi vào biên niên sử."
 * Vì vậy `chet_yeu` đi qua đúng đường như mọi kết cục khác: nó ghi `ketCuc`,
 * ghi `tickKet`, và không xóa gì.
 */
export declare function nhipMachTruyen(s: WorldState, nc: NgocCanhTruyen): KetQuaNhipMach;
export type DoVangMat = {
    readonly soCanh: number;
    readonly soCanhVangNguoiChoi: number;
    readonly tyLe: number;
    /** Dưới ngưỡng → ống kính kỷ nguyên sau phải ưu tiên mạch không có người chơi. */
    readonly dat: boolean;
    readonly thongDiep: string;
};
/**
 * [BB] 28.6 — đo theo SỐ CẢNH, không theo token.
 *
 * Một cảnh dài về người chơi không được phép mua chuộc chỉ số bằng độ dài; đó
 * chính là lý do `doTren` của bảng là `so_canh`.
 */
export declare function hanNgachVangMat(canh: readonly {
    coNguoiChoi: boolean;
}[]): DoVangMat;
/** Mạch mà chủ thể ĐƯỢC BIẾT tới — dùng cho ống kính và cho assembler. */
export declare function machNguoiChoiBiet(s: WorldState): readonly Storyline[];
