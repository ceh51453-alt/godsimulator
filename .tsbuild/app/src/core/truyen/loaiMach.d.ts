/**
 * Mười bốn loại mạch truyện — Phần 28.3 [MR] + tám loại đã khai ở Phase 0.
 *
 * ── Vì sao file này không nằm trong `registry/misc.ts` ──
 *
 * [BB] 61.2: manifest thuần dữ liệu tách khỏi runtime handler. `tienDe`,
 * `duongCangThang` và `sinhNhip` là hàm, nên chúng ở đây và được tra theo
 * `handlerId` — cùng cách `world/process/index.ts` nối mười hai tiến trình nền.
 *
 * ── Vì sao tiền đề được DÒ chứ không được khai ──
 *
 * [BB] 28.4: mỗi `tienDe(w)` quét thế giới thật tìm ứng viên. Không có bảng
 * "kịch bản có sẵn", không có cây nhánh viết tay. Một mạch báo thù tồn tại vì có
 * hai người thật sự ghét nhau tới mức ấy, chứ không vì ai đó viết nó vào file.
 * Hệ quả trực tiếp: save cũ không có bảng `storylines` vẫn sinh lại được toàn bộ
 * mạch truyện của nó ở nhịp kế tiếp.
 *
 * [BB] 28.5: `sinhNhip()` là ENGINE THUẦN. Không LLM. Đó là lý do 24 mạch chạy
 * song song mà chi phí bằng 0.
 */
import type { WorldState } from '../engine/state.js';
import type { Rng } from '../engine/rng.js';
import type { GiaiDoanMach, NhanVatMach, Storyline } from '../schema/truyen.js';
import type { LoaiCamXuc } from '../schema/aspect/soul.js';
/** Một ứng viên mạch truyện mà `tienDe()` dò được từ thế giới thật. */
export type UngVienMach = {
    readonly loai: string;
    /** Nhân vật, đã có vai. Phần tử đầu là vai `chinh`. */
    readonly nhanVat: readonly NhanVatMach[];
    readonly ten: string;
    /** Vì sao engine cho rằng mạch này đang thành hình — vào `kyUcMach` dòng đầu. */
    readonly vi: string;
    /** Căng thẳng khởi điểm 0–100. */
    readonly cangThangDau: number;
};
/**
 * Thay đổi trạng thái mà một nhịp truyện áp vào world — `bienDoiTrangThai` của 28.5.
 *
 * ── Vì sao chỉ có KÝ ỨC và CẢM XÚC ──
 *
 * Mười hai tiến trình nền của 71.2 đã sở hữu vật chất: mùa màng, kho, dân số,
 * thương vong. Cho tầng tự sự ghi vào những chỗ ấy là mở một đường thứ hai để
 * của cải xuất hiện, và [BB] 71.4 quy tắc 1 sẽ phải phân xử `set` đụng `set` mỗi
 * tick. Tệ hơn: một mạch truyện "chiến tranh" sẽ trừ dân số **thêm một lần nữa**
 * bên cạnh `conflict_security`, và không ai thấy vì cả hai đều hợp lệ.
 *
 * Thứ tầng tự sự thật sự sở hữu là thứ không tiến trình nào ghi: **người ta nhớ
 * gì, và người ta cảm thấy gì về ai.** Đó cũng đúng là hai thứ khiến nhân vật
 * hành động khác đi ở nhịp sau — utility AI (23) đọc `ducVong` và `tamTrang`,
 * còn `soul.kyUc` thành chunk `ky_uc_thuc_the` cho truy hồi (54.2).
 *
 * Nói cách khác: mạch truyện không đổi thế giới bằng cách dời của cải. Nó đổi
 * thế giới bằng cách để lại dấu trong người.
 */
export type BienDoiTuSu = {
    readonly loai: 'ky_uc';
    readonly entityId: string;
    readonly tomTat: string;
    readonly dienTich: number;
} | {
    readonly loai: 'cam_xuc';
    readonly entityId: string;
    readonly camXuc: LoaiCamXuc;
    readonly doiTuongId: string | null;
    readonly cuongDo: number;
};
/** Một nhịp truyện. Engine áp `bienDoiTrangThai` vào world và sinh Event. */
export type Beat = {
    readonly moTa: string;
    readonly nhanVatLienQuan: readonly string[];
    readonly cangThangDelta: number;
    readonly giaiDoanMoi?: GiaiDoanMach;
    readonly nutThatMoi?: string;
    /** Phục bút mới gieo: engine ghi vào Sổ Phục Bút — 30.2. */
    readonly phucButMoi?: {
        noiDung: string;
        loai: string;
        hanTraToiDa: number | null;
        doNang: number;
    };
    /** Mạch tự tuyên kết thúc. Đi kèm `giaiDoanMoi = 'du_am' | 'chet_yeu'`. */
    readonly ketCuc?: string;
    /** [BB] 28.5 — engine áp cái này vào world rồi mới sinh Event. */
    readonly bienDoiTrangThai?: readonly BienDoiTuSu[];
};
export type HandlerLoaiMach = {
    readonly tienDe: (s: WorldState) => readonly UngVienMach[];
    readonly duongCangThang: (gd: GiaiDoanMach) => number;
    readonly sinhNhip: (m: Storyline, s: WorldState, rng: Rng) => Beat;
};
/**
 * Bảng handler. Khóa phải khớp id trong `R.storyKind`.
 *
 * `bao_thu` mang tiền đề của `phuc_thu` (28.3) và `troi_day` mang tiền đề của
 * `cuu_the` — ADR-0037. `dat_ten` và `phuc_hung` vào ở Phase 10 (43.2, 42.5).
 */
export declare const HANDLER_LOAI_MACH: Readonly<Record<string, HandlerLoaiMach>>;
/** Loại mạch đã khai trong registry mà chưa có handler — cổng Phase 8 đòi rỗng. */
export declare function loaiMachThieuHandler(ids: readonly string[]): readonly string[];
