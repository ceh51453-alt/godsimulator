/**
 * Bảng Thiên Diễn — Phần 55 [BB].
 *
 * ── Một câu quyết định cả file ──
 *
 * [BB] 55.5: *"Bảng phải đi qua `chieu()`. Nó là đường rò rỉ dễ quên nhất trong
 * toàn app — dễ hơn cả assembler, vì lập trình viên hay đọc thẳng từ store cho
 * tiện."*
 *
 * Nên `tinhBangThienDien()` nhận đúng một tham số thế giới: `WorldView`. File này
 * không import `state.js`, không import Dexie, không import store. Thứ tầng hiện
 * tại không được biết thì **không tồn tại** trong đối tượng nó đọc — `chieu()` đã
 * xóa hẳn, nên ở đây không còn phép lọc nào phải nhớ.
 *
 * ── Vì sao tách khỏi `chieu()` ──
 *
 * `chieu()` trả lời *cái gì được nhìn thấy*. File này trả lời *cái gì đáng nói*.
 * Trộn hai câu hỏi lại thì mỗi lần đổi cách trình bày bảng lại phải sờ vào ranh
 * giới quyền nhìn, và đó là cách một bảng trạng thái trở thành một lỗ rò.
 *
 * ── Ba luật trình bày được cưỡng chế bằng KIỂU, không bằng lời dặn ──
 *
 * 1. Vùng nào tầng này không có thì trả `null`, không trả mảng rỗng. Component
 *    không có gì để vô tình render, và test phân biệt được "không được thấy" với
 *    "chưa có gì".
 * 2. Mọi con số đi kèm `nhan` bằng chữ — [BB] 55.6 quy tắc 5 và luật bất biến #9,
 *    không thao tác nào chỉ dựa vào màu.
 * 3. Mọi mục "Cần chú ý" mang theo `dich` — [BB] 55.4: *"Mỗi mục là một liên kết
 *    mở thẳng tới chỗ xử lý. Không có mục nào chỉ để đọc."*
 */
import type { WorldView } from '../contracts/view.js';
import type { ViewMode } from '../contracts/primitives.js';
import type { BangSnapshot } from './schema.js';
/**
 * Tám vùng, thứ tự CỐ ĐỊNH — [BB] 55.3.
 *
 * "Người dùng thu gọn từng vùng nhưng không đổi thứ tự — thứ tự này là thứ tự
 * câu hỏi tự nhiên." Mảng này là nguồn chân lý của thứ tự ấy, nên không có chỗ
 * nào khác được phép sắp lại.
 */
export declare const VUNG_BANG: readonly ["khi_nao", "the_gioi_la_gi", "co_gi_ton_tai", "dang_the_nao", "da_lech", "dang_xay_ra", "ai_dang_chu_y", "tu_lan_truoc"];
export type VungBang = (typeof VUNG_BANG)[number];
export declare const NHAN_VUNG: Readonly<Record<VungBang, string>>;
/** Nơi một mục "Cần chú ý" mở tới — 55.4 [BB]. */
export declare const DICH_XU_LY: readonly ["phuc_but", "loi_cau", "lo_hong", "mach_truyen", "doi_soat", "chi_so", "luat_nen"];
export type DichXuLy = (typeof DICH_XU_LY)[number];
export type DongDem = Readonly<{
    /** Nhãn hiển thị lấy từ `KindDef.ten` — [BB] 58.13 không hiện raw id/enum. */
    nhan: string;
    kindId: string;
    so: number;
    /** Dòng phụ, ví dụ "kết tinh 22 · lưỡng lự 3". Rỗng thì không in. */
    phu: string;
}>;
export type DongChiSo = Readonly<{
    khoa: string;
    nhan: string;
    gia: number;
    /** `null` khi chưa có mốc trước để so — KHÔNG hiện 0 giả. */
    delta: number | null;
    /** Tăng có phải chuyện tốt không. Quyết định màu của delta — 55.6 quy tắc 5. */
    tangLaTot: boolean;
    /** Tối đa bảy điểm, cũ trước mới sau — 55.6 quy tắc 4. */
    chuoi: readonly number[];
}>;
export type DongMach = Readonly<{
    id: string;
    ten: string;
    loai: string;
    giaiDoan: string;
    cangThang: number;
    soNutChuaGo: number;
    /** Người chơi đã biết mạch này chưa — 55.3 phân biệt `●` và `○` bằng CHỮ. */
    daBiet: boolean;
}>;
export type DongNguoi = Readonly<{
    id: string;
    ten: string;
    /** Một cụm chữ nói vì sao họ đáng chú ý. Không bao giờ rỗng. */
    vi: string;
}>;
export type MucCanChuY = Readonly<{
    id: string;
    nhan: string;
    /** Vì sao nó cần chú ý, bằng câu chữ. */
    vi: string;
    dich: DichXuLy;
    /** Id đối tượng cụ thể để màn đích cuộn thẳng tới, nếu có. */
    doiTuongId: string | null;
}>;
export type BangThienDien = Readonly<{
    mode: ViewMode;
    branchId: string;
    khiNao: Readonly<{
        moTaThoiDiem: string;
        tenKyNguyen: string;
        nhip: string;
        /** [BB] 58.4 — không bao giờ `NaN`, `∞` hay ô trống. */
        chuyenKy: string;
    }>;
    /** `null` ở tầng Phàm Nhân — [BB] 55.5 "Không có vùng này". */
    theGioiLaGi: Readonly<{
        luatNen: readonly Readonly<{
            ten: string;
            trangThai: string;
            ghiChu: string;
        }>[];
        coChe: readonly Readonly<{
            ten: string;
            trangThai: string;
            ghiChu: string;
        }>[];
    }> | null;
    /** `null` ở tầng Phàm Nhân — [BB] 55.5 "Không có con số nào". */
    coGiTonTai: readonly DongDem[] | null;
    /** `null` ở tầng Phàm Nhân. Ở tầng Thần chỉ có domain của chính mình. */
    dangTheNao: readonly DongChiSo[] | null;
    /** Rỗng ngoài tầng Sáng Thế Thần. */
    daLech: readonly Readonly<{
        nguon: string;
        tomTat: string;
    }>[];
    dangXayRa: readonly DongMach[];
    aiDangChuY: readonly DongNguoi[];
    /** Diff kể từ lần cuối MỞ BẢNG — [BB] 55.4, không phải từ đầu kỷ nguyên. */
    tuLanTruoc: readonly string[];
    canChuY: readonly MucCanChuY[];
}>;
/**
 * Giai đoạn mạch, viết bằng chữ — [BB] 58.13, cùng lẽ với `NHAN_PHAM_VI`.
 *
 * Xuất từ đây để Bảng Thông Tin dùng chung: hai bảng gọi cùng một giai đoạn bằng
 * hai cái tên khác nhau là một cách rất rẻ để làm người chơi tưởng có hai thứ.
 */
export declare const NHAN_GIAI_DOAN: Readonly<Record<string, string>>;
export declare function nhanGiaiDoan(gd: string): string;
/**
 * [BB] 55.5 — chữ ký này là hợp đồng. Tham số thế giới duy nhất là `WorldView`.
 *
 * `anh` chỉ mang thứ một hàm thuần trên view không tự biết: chuỗi bảy kỷ nguyên
 * và ảnh của lần mở bảng trước. Nó KHÔNG mang dữ liệu thế giới nào chưa qua chiếu
 * — `chupBang()` bên dưới cũng chỉ đọc `view`, nên không có cửa sau nào ở đây.
 */
export declare function tinhBangThienDien(view: WorldView, anh?: BangSnapshot | null): BangThienDien;
/**
 * Vật chất hoá ảnh chụp ở RANH GIỚI TICK — [BB] 55.8.
 *
 * Gọi hàm này mỗi tick, không gọi mỗi lần render. Nó cũng là chỗ chuỗi bảy kỷ
 * nguyên dài ra, nên gọi thiếu thì sparkline cụt chứ không sai.
 *
 * [BB] 55.8 — ảnh lưu theo `mode`. Đưa vào một ảnh của tầng khác thì hàm này
 * VỨT nó và dựng ảnh mới, chứ không trộn hai tầng vào một chuỗi.
 */
export declare function chupBang(view: WorldView, cu: BangSnapshot | null): BangSnapshot;
/**
 * Ghi mốc "đã xem" — nguồn của vùng "Từ lần trước" ở lần mở SAU.
 *
 * [BB] 55.4 — mốc là *lần cuối người chơi mở Bảng*. Nên hàm này được gọi khi
 * bảng ĐÓNG, không phải khi nó mở: gọi lúc mở thì diff tự xoá chính nó trước khi
 * người chơi kịp đọc.
 */
export declare function danhDauDaXem(anh: BangSnapshot, view: WorldView): BangSnapshot;
export type CumThienTuong = Readonly<{
    id: string;
    nhan: string;
    gia: string;
    /** `null` khi không có mốc trước để so. */
    delta: number | null;
    tangLaTot: boolean;
}>;
/**
 * Thanh Thiên Tượng — 55.2.
 *
 * Bốn cụm mặc định của đặc tả, và [MR] cho phép người chơi ghim thêm. Ghim đọc
 * từ ảnh chụp nên nó sống qua lần đóng tab, đúng "trạng thái lưu theo save" (58.2).
 */
export declare function thanhThienTuong(bang: BangThienDien, ghim?: readonly string[]): readonly CumThienTuong[];
