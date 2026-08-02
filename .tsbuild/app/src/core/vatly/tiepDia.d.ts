/**
 * Nguyên tắc Tiếp Địa — Phần 42 [BB]. Nguyên tắc thứ tám, ngang hàng bảy nguyên
 * tắc của Phần 2.
 *
 * > **Khái niệm là từ vựng của thực tại. Định luật là câu viết bằng từ vựng đó.**
 * > **Không thể viết một câu bằng những từ chưa tồn tại.**
 *
 * ── Chỗ dễ làm sai nhất trong toàn khối ──
 *
 * [BB] 42.4: dùng **min**, không dùng trung bình. "Một câu có một từ vô nghĩa thì
 * cả câu vô nghĩa." Trung bình sẽ cho một luật ba khái niệm mạnh + một khái niệm
 * chưa tồn tại ra 75% hiệu lực — tức là thế giới cảm thấy một điều luật nói bằng
 * một từ chưa ai hiểu. Đó không phải làm tròn số; đó là sai mô hình.
 *
 * Bốn hệ quả rơi ra miễn phí, và cả bốn đều là cơ chế chơi thật:
 * luật đầu tiên gần như trơ · luật mạnh dần khi thế giới sống ·
 * luật cổ mạnh hơn luật mới · làm suy yếu một luật mà không cần bãi bỏ nó (42.5).
 */
import type { Entity } from '../schema/entity.js';
import type { WorldState } from '../engine/state.js';
import type { Lawful } from '../schema/aspect/lawful.js';
import type { Tuning } from '../tuning/schema.js';
export type VaiTroTiepDia = Lawful['tiepDia'][number]['vaiTro'];
export type ManhNoiTiepDia = {
    readonly khaiNiemId: string;
    readonly ten: string;
    readonly vaiTro: VaiTroTiepDia;
    readonly batBuoc: boolean;
    readonly trongSo: number;
    readonly nguongKetTinh: number;
    readonly giaiDoan: string;
    /** 0–1 sau khi nhân hệ số vai trò. */
    readonly diem: number;
    readonly tonTai: boolean;
};
export type KetQuaHieuLuc = {
    readonly hieuLuc: number;
    readonly matXichYeuNhat: ManhNoiTiepDia | null;
    readonly manhNoi: readonly ManhNoiTiepDia[];
    /** Câu giải thích cho panel diff — 42.7 [BB] "Dòng cuối phải có". */
    readonly loiGiaiThich: string;
};
/**
 * Hiệu Lực — sức mạnh của luật là **độ thật của khái niệm nền** (42.4).
 *
 * Trả về cả bảng mắt xích chứ không chỉ con số: panel diff của 42.7 phải hiện
 * từng khái niệm với trọng số và giai đoạn, vì đó là thứ dạy người chơi toàn bộ
 * cơ chế mà không cần đọc hướng dẫn.
 */
export declare function tinhHieuLuc(luat: Entity, s: WorldState, tuning: Tuning): KetQuaHieuLuc;
export type KetQuaKiemTiepDia = {
    /** `true` nghĩa là luật được nhận. Hai chế độ mềm KHÔNG BAO GIỜ trượt (42.6). */
    readonly dat: boolean;
    readonly thieu: readonly string[];
    readonly canTao: readonly string[];
    readonly canhBao: readonly string[];
    readonly loi: readonly string[];
};
/**
 * Kiểm tra thứ tám `TIEP_DIA` — 42.6.
 *
 * [BB] "Ở hai chế độ còn lại, kiểm tra 8 **không bao giờ trượt** — nó chỉ tạo
 * khái niệm thiếu và trả về cảnh báo mức `luu_y`. Đúng nguyên tắc 5: không dựng
 * tường trước mặt người chơi."
 */
export declare function kiemTiepDia(luat: Entity, s: WorldState): KetQuaKiemTiepDia;
/**
 * Khái niệm cần tạo ở `hu_danh`, trọng số 0 — 42.3 chế độ `tu_tiep_dia`.
 *
 * Trả về **dữ liệu entity**, không trả về patch: chỗ gọi quyết định gói nó vào
 * Event nào, và mọi thay đổi thế giới vẫn đi qua đúng một đường (transaction).
 */
export declare function khaiNiemHuDanh(khaiNiemId: string, branchId: string, tick: number, nguong: number): Entity;
/**
 * Chế độ `tu_suy` — tìm khái niệm SẴN CÓ trước, chỉ tạo mới khi thật sự không có.
 *
 * Khớp theo tên đã chuẩn hóa và theo alias. Một thế giới đã có "Ô Uế" thì luật về
 * tẩy uế nên bám vào nó chứ không nên đẻ ra một khái niệm song song — hai khái
 * niệm cùng nghĩa chia đôi trọng số, và cả hai cùng yếu.
 */
export declare function suyKhaiNiemSanCo(canId: string, s: WorldState): string | null;
export type AnhHuongKhaiNiem = {
    readonly luatId: string;
    readonly ten: string;
    readonly hieuLucTruoc: number;
    readonly hieuLucSau: number;
};
/**
 * Luật nào tụt hiệu lực nếu một khái niệm chết hoặc bị chia đôi — 42.5.
 *
 * "Đây là cách các tôn giáo cổ thật sự chết: không ai bãi bỏ chúng cả — người ta
 * chỉ ngừng hiểu chúng nói gì."
 *
 * Hàm thuần: nó KHÔNG sửa `s`. Nó mô phỏng trọng số mới rồi tính lại, để panel
 * hiện hậu quả trước khi người chơi bấm.
 */
export declare function anhHuongKhiKhaiNiemYeuDi(s: WorldState, khaiNiemId: string, trongSoMoi: number, tuning: Tuning): AnhHuongKhaiNiem[];
/**
 * Luật đã chết có sống lại được không — 42.5 [BB] đường ngược lại.
 *
 * Một tà giáo phục dựng nghi lễ cổ làm sống lại một định luật bị lãng quên hàng
 * nghìn năm. Đây là tiền đề của mạch truyện loại `phuc_hung`.
 */
export declare function coTheHoiSinh(luat: Entity, s: WorldState, tuning: Tuning): boolean;
/** Bảng Tiếp Địa cho panel diff — 42.7. */
export declare function bangTiepDia(kq: KetQuaHieuLuc): string;
