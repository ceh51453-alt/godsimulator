/**
 * Luật Nền — Phần 43 [BB].
 *
 * ── Hai tầng luật ──
 *
 * | Tầng            | Chi phối             | Cấu trúc                          |
 * |-----------------|----------------------|-----------------------------------|
 * | Luật Nội Tại    | sự kiện trong thế giới | bảy trường + tiếp địa (9, 42)   |
 * | **Luật Nền**    | chính bộ máy mô phỏng | KHÔNG có `hieuUng`; có tham số  |
 *
 * 43.1 nói rõ vì sao tách: "Thời Gian không tác động lên field nào — nó quy định
 * **cách bản thân engine chạy**. Nhét chung một schema là sai kiến trúc."
 *
 * ── Vô danh và có tên ──
 *
 * [BB] 43.2 — một trục `vo_danh` vẫn được engine dùng, nhưng **không ai trong thế
 * giới biết**, nên **không khai thác được** và **không có kẽ hở**. Khoảnh khắc
 * một kẻ trong thế giới khái niệm hóa được nó phải sinh một sự kiện lớn và một
 * mạch truyện loại `dat_ten`.
 *
 * > "Hiểu biết tạo ra vật lý, và vật lý tạo ra kẽ hở."
 */
import type { WorldState } from '../engine/state.js';
import type { SubstrateLaw, TrucNen } from './schema.js';
/** Bộ bảy trục mặc định PHÀM TỤC cho một nhánh mới — 43.7. */
export declare function luatNenMacDinh(branchId: string): SubstrateLaw[];
/** Tham số đang có hiệu lực của một trục — vô danh thì dùng bộ mặc định. */
export declare function thamSoCua(ds: readonly SubstrateLaw[], truc: TrucNen): Readonly<Record<string, unknown>>;
export declare function daCoTen(ds: readonly SubstrateLaw[], truc: TrucNen): boolean;
export type KetQuaDatTen = {
    readonly ok: true;
    readonly luatNen: SubstrateLaw;
    readonly keHo: readonly string[];
    /** Câu ghi vào biên niên sử — 44.4 [BB] giọng biên niên. */
    readonly dongBienNien: string;
} | {
    readonly ok: false;
    readonly loi: readonly string[];
};
/**
 * Đặt tên cho một trục — 43.2, 43.3, 43.5.
 *
 * Ba điều kiện, và cả ba đều chặn:
 * 1. Trục chưa `co_ten` (đặt tên hai lần là vô nghĩa).
 * 2. `khaiNiemNenId` trỏ tới một khái niệm **có thật, đã ít nhất `thanh_hinh`**,
 *    và khớp danh sách khái niệm nền của trục ([BB] 43.3 — luật nền cũng phải
 *    tiếp địa: không thể đặt tên cho Thời Gian nếu khái niệm Trước-Sau chưa thành hình).
 * 3. Mọi trục phụ thuộc đã `co_ten` ([BB] 43.5).
 */
export declare function datTenTruc(input: {
    readonly ds: readonly SubstrateLaw[];
    readonly truc: TrucNen;
    readonly khaiNiemNenId: string;
    readonly nguoiDatTenId: string | null;
    readonly tick: number;
    readonly state: WorldState;
}): KetQuaDatTen;
/**
 * Kẽ hở của một trục — chỉ có khi trục đã `co_ten`.
 *
 * Nội dung kẽ hở suy từ **chính tham số**: một thế giới có `quaKhu = 'sua_duoc'`
 * mở ra loại khai thác mà `co_dinh` không có. Đây là chỗ câu "hiểu biết tạo ra
 * vật lý, và vật lý tạo ra kẽ hở" trở thành dữ liệu.
 */
export declare function keHoCuaTruc(truc: TrucNen, thamSo: Readonly<Record<string, unknown>>): string[];
export type UngVienTuKetTinh = {
    readonly truc: TrucNen;
    readonly khaiNiemId: string;
    readonly ten: string;
};
/**
 * Luật nền TỰ kết tinh — 43.7 [BB].
 *
 * "Thế giới tự phát hiện ra vật lý của chính nó. Đây là ứng dụng đẹp nhất của cơ
 * chế kết tinh, và nó không cần thêm code — chỉ cần một bảng ánh xạ
 * `khái niệm → trục nền` trong Registry."
 *
 * Bảng ấy là `KHAI_NIEM_NEN_CUA_TRUC`. Hàm này quét khái niệm đã `ket_tinh`, so
 * với bảng, và trả về ứng viên. Tham số thì **khóa đúng theo hành vi thế giới vốn
 * đã có** — tức là giữ nguyên `thamSo` hiện hành, không đặt lại.
 */
export declare function quetTuKetTinh(s: WorldState, ds: readonly SubstrateLaw[]): UngVienTuKetTinh[];
export type YeuCauSuaLuatNen = {
    readonly truc: TrucNen;
    readonly thamSoMoi: Readonly<Record<string, unknown>>;
    readonly boiAi: 'khong_ai' | 'sang_the_than' | 'than_toi_cao';
};
export type KetQuaSuaLuatNen = {
    readonly ok: true;
    readonly batBuocPhanNhanh: true;
    readonly luatNenSau: SubstrateLaw;
} | {
    readonly ok: false;
    readonly loi: readonly string[];
};
/**
 * Sửa Luật Nền — 43.6 [BB].
 *
 * > Đổi "máu đã đổ thì không rửa được" là đổi chính sách.
 * > Đổi "thời gian chảy một chiều" là **tai họa vũ trụ viết lại toàn bộ lịch sử**.
 *
 * Hàm này KHÔNG sửa tại chỗ và KHÔNG trả về một state mới. Nó trả về bản ghi sẽ
 * nằm trong **nhánh mới**, kèm cờ `batBuocPhanNhanh: true` — người gọi bắt buộc
 * fork trước khi ghi. Không có đường nào ở đây cho phép sửa nhánh đang chạy.
 */
export declare function suaLuatNen(ds: readonly SubstrateLaw[], yc: YeuCauSuaLuatNen): KetQuaSuaLuatNen;
/**
 * [BB] 43.4 — tham số có ảnh hưởng kỹ thuật sâu nhất trong cả spec.
 *
 * `khoangCach = 'y_nghia'` **đổi định nghĩa lân cận của `moRong()`**, tức đổi cả
 * cách assembler chọn ngữ cảnh: hai ngôi đền thờ cùng một vị thần là liền kề, bất
 * kể cách nhau bao xa. Địa lý thần thoại thật vận hành theo ý nghĩa chứ không
 * theo mét — âm phủ ở "dưới" nhưng tới được bằng một con sông.
 */
export declare function laKhoangCachYNghia(ds: readonly SubstrateLaw[]): boolean;
/**
 * Cạnh "liền kề theo ý nghĩa" — dùng để nối thêm vào đồ thị của `moRong()`.
 *
 * Chỉ chạy khi trục Không Gian ở `y_nghia`. Trả về cặp id, đã sắp, không trùng.
 */
export declare function canhLienKeYNghia(s: WorldState, ds: readonly SubstrateLaw[]): [string, string][];
/**
 * Tên đọc được của bảy trục — [BB] 58.13 "không hiện raw id, key schema hay tên
 * enum cho người chơi". Chỗ nào in tên trục ra màn hình cũng đọc bảng này, nên
 * không có đường nào để `van_menh` lọt lên UI.
 */
export declare const NHAN_TRUC_NEN: Readonly<Record<TrucNen, string>>;
/** Ba dòng trạng thái cho Panel Vật Lý Thế Giới — 44.5. */
export declare function bangLuatNen(ds: readonly SubstrateLaw[], s: WorldState): string;
