/**
 * Bảng Thông Tin Thiên Địa — Phần 58 [BB].
 *
 * ── Câu mở của cả phần này ──
 *
 * [BB] 58.3: *"Màn mặc định phải chứa **tên thật** của ít nhất một luật, một tạo
 * vật, một thần hệ và một mạch truyện nếu chúng tồn tại. Chỉ hiện '31 luật, 110
 * tạo vật' là không đạt."*
 *
 * Đó là lý do file này trả về các HÀNG có tên riêng chứ không trả về các con số,
 * và là lý do mỗi tab có một câu rỗng riêng (58.13) thay vì "Không có dữ liệu".
 *
 * ── Cùng ràng buộc với Bảng Thiên Diễn ──
 *
 * [BB] 58.12: *"Bảng chỉ nhận `WorldView`. Tìm kiếm, đếm, sắp xếp, tooltip, ảnh
 * chụp và mục ghim đều chạy **sau chiếu**. Không có thao tác UI nào được đọc
 * `World` hay Dexie gốc 'chỉ để lấy thêm tên'."*
 *
 * Nên tìm kiếm ở đây chạy trên `view.entities`, không chạy trên `state.entities`.
 * Một cái tên không lọt qua được `chieu()` thì cũng không gõ ra được — và đó
 * chính là điều làm ô tìm kiếm không trở thành cửa hậu nhìn trộm.
 */
import type { WorldView } from '../contracts/view.js';
import type { ViewMode } from '../contracts/primitives.js';
export declare const TAB_THONG_TIN: readonly ["tong_quan", "quy_luat", "tao_vat", "than_he", "mach_truyen", "ta"];
export type TabThongTin = (typeof TAB_THONG_TIN)[number];
/**
 * Nhãn tab đổi theo tầng — [BB] 58.12 hàng cuối.
 *
 * Tab "Ta" của Sáng Thế Thần là hồ sơ về dấu ấn; ở tầng Thần nó là "Thần Vị Của
 * Ta"; ở tầng Phàm Nhân nó là "Đời Ta". Cùng một tab, ba câu hỏi khác nhau, nên
 * cái tên phải khác nhau — dùng chung một nhãn là hứa sai với người chơi.
 */
export declare function nhanTab(tab: TabThongTin, mode: ViewMode): string;
/** [BB] 58.13 — không dùng "Không có dữ liệu". Mỗi tab có câu rỗng của thế giới. */
export declare const CAU_RONG: Readonly<Record<TabThongTin, string>>;
export type DaiDinhVi = Readonly<{
    theGioi: string;
    thoiDiem: string;
    nhanh: string;
    tangChoi: string;
    ongKinh: string;
}>;
export type HangLuat = Readonly<{
    id: string;
    ten: string;
    /** Dòng đầu của `vanBan`; ở tầng dưới là `dienGiai` — [BB] 18.2. */
    cau: string;
    tang: string;
    trangThai: string;
    hieuLuc: number | null;
    phamVi: string;
    nguon: string;
    soVanDe: number;
    /** Bản diễn giải của vùng đã lệch bao xa so với văn bản gốc. */
    doLech: number;
}>;
export type HangTaoVat = Readonly<{
    id: string;
    ten: string;
    kindId: string;
    loai: string;
    nguonSinh: string;
    nhomNguon: string;
    trangThai: string;
    anhHuong: readonly string[];
    noiHienDien: string;
    lienKetLon: readonly string[];
}>;
export type HangThanHe = Readonly<{
    id: string;
    ten: string;
    moHinh: string;
    ngoiDau: string;
    soThanhVien: number;
    domainTroi: readonly string[];
    phamVi: string;
}>;
export type HangMach = Readonly<{
    id: string;
    ten: string;
    loai: string;
    giaiDoan: string;
    cangThang: number;
    nhanVatChinh: readonly string[];
    soNutChuaGo: number;
    daBiet: boolean;
    /** Người chơi đã ghim mạch này chưa — thao tác UI thuần túy (58.9). */
    dangTheoDoi: boolean;
    /** Ống kính có đang chiếu nó không. */
    dangXem: boolean;
}>;
export type ChuoiHeQua = Readonly<{
    moc: string;
    cacBuoc: readonly string[];
}>;
export type TabTa = Readonly<{
    danhXung: string;
    banThe: string;
    trangThai: string;
    /** Dấu ấn trực tiếp — thứ CHÍNH chủ thể tạo, đọc từ `provenance` (59.1). */
    dauAn: readonly Readonly<{
        ten: string;
        loai: string;
        tick: number;
    }>[];
    /** Thế gian gọi ta là gì — 58.10 câu hỏi 3. */
    theGianGoi: readonly string[];
    /** [BB] 58.10 — chuỗi lấy từ link và event THẬT, không bịa thêm mắt xích. */
    heQua: readonly ChuoiHeQua[];
}>;
export type BangThongTin = Readonly<{
    mode: ViewMode;
    daiDinhVi: DaiDinhVi;
    dem: Readonly<Record<TabThongTin, number>>;
    quyLuat: readonly HangLuat[];
    taoVat: readonly HangTaoVat[];
    thanHe: readonly HangThanHe[];
    machTruyen: readonly HangMach[];
    ta: TabTa;
    /** Chip lọc của tab Tạo vật, dựng từ `R.kind` — [BB] 58.7 không hardcode. */
    chipLoai: readonly Readonly<{
        kindId: string;
        nhan: string;
        so: number;
    }>[];
}>;
export type TuyChonBang = Readonly<{
    /** Mạch người chơi đang ghim — 58.9. */
    theoDoiMachIds?: readonly string[];
    /** Mạch ống kính đang chiếu. */
    machDangChieuId?: string | null;
    tenNhanh?: string;
    tenTheGioi?: string;
}>;
/** [BB] 58.12 — tham số thế giới duy nhất là `WorldView`. */
export declare function tinhBangThongTin(view: WorldView, tc?: TuyChonBang): BangThongTin;
export type KetQuaTim = Readonly<{
    tab: TabThongTin;
    id: string;
    ten: string;
    vi: string;
}>;
/**
 * Ô tìm chung — 58.11.
 *
 * "Nhập 'đêm' có thể trả về luật về đêm, thần giữ domain đêm, thần khí liên quan
 * và mạch đang tranh domain đó." Nên nó tìm trên nhiều trường, và [BB] 58.12 bắt
 * nó chạy **sau chiếu**: nguồn duy nhất là `bang`, thứ đã đi qua `WorldView`.
 */
export declare function timTrongBang(bang: BangThongTin, q: string): readonly KetQuaTim[];
