/**
 * WorldView — Phần 18.1 [BB].
 *
 * Ba tầng chơi là ba HÀM CHIẾU trên cùng một database. Không phải ba game.
 * [BB] Assembler, moRong(), retrieval và rerank chạy trên WorldView, KHÔNG chạy trên World.
 * Đây là cách duy nhất đảm bảo AI không kể ra thứ nhân vật không được biết.
 *
 * ADR-0003: `dongTuKhaDung` giữ VerbHandle (manifest thuần dữ liệu) thay vì VerbDef
 * (chứa closure), để WorldView serialize và hash được. Runtime tra `R.verb` khi thực thi.
 */
import type { ViewMode } from './primitives.js';
/** Bốn mức sương mù — Phần 19.1. */
export declare const MUC_RO: readonly ["ro", "mo", "tin_don", "mu"];
export type MucRo = (typeof MUC_RO)[number];
/** Thứ đã lọt vào view thì không thể là 'mu'. */
export type MucRoThayDuoc = Exclude<MucRo, 'mu'>;
export type ProjectedEntity = Readonly<{
    id: string;
    kind: string;
    ten: string;
    aliases: readonly string[];
    moTa: string;
    tags: readonly string[];
    mucRo: MucRoThayDuoc;
    /** Aspect ĐÃ LỌC theo quyền nhìn. Trường bị che bị XÓA KHỎI ĐỐI TƯỢNG, không ẩn bằng CSS. */
    aspects: Readonly<Record<string, unknown>>;
    /** true nếu nội dung đã đi qua bopMeo() — sai có cấu trúc, không phải mơ hồ. */
    daBopMeo: boolean;
}>;
export type ProjectedLaw = Readonly<{
    id: string;
    ten: string;
    /**
     * [BB] Phần 18.2: null ở tầng phàm nhân, LUÔN LUÔN.
     * Thần chỉ thấy văn bản luật trong domain của mình.
     */
    vanBan: string | null;
    /** Bản diễn giải của vùng chủ thể — tức bản đã sai. */
    dienGiai: string;
    doLech: number;
    phamVi: string;
    mucRo: MucRoThayDuoc;
}>;
export type ProjectedConcept = Readonly<{
    id: string;
    /** Tên trong văn hóa của chủ thể; có thể khác tên canon. */
    ten: string;
    /** [BB] null với phàm nhân — họ chỉ biết khái niệm đã có TÊN trong văn hóa vùng mình. */
    trongSo: number | null;
    giaiDoan: string | null;
    sacThai: Readonly<Record<string, number>> | null;
    mucRo: MucRoThayDuoc;
}>;
/**
 * Cạnh đồ thị đã chiếu — Phần 6.4, thêm ở Phase 8.
 *
 * [BB] 6.4: "Khi truyền `view`, `moRong()` phải lọc bỏ mọi entity mà `view`
 * không cho phép chủ thể biết. Mở rộng đồ thị KHÔNG được trở thành đường rò rỉ."
 *
 * Cách rẻ nhất để chắc điều đó là không đưa cạnh cấm vào view ngay từ đầu:
 * `chieu()` chỉ giữ cạnh có CẢ HAI đầu nằm trong `entities`. Nhờ vậy kênh đồ thị
 * của retrieval (54.1) không có gì để lọc lại, nên cũng không có gì để quên lọc.
 */
export type ProjectedLink = Readonly<{
    id: string;
    tuId: string;
    denId: string;
    quanHe: string;
    trongSo: number;
    /** Quan hệ đã đứt vẫn là dữ liệu — "vết sẹo" của 6.3 quy tắc 4. */
    daDut: boolean;
}>;
/** Động từ khả dụng, dạng dữ liệu thuần — không chứa handler. */
export type VerbHandle = Readonly<{
    id: string;
    ten: string;
    moTa: string;
    coChatHopLe: readonly string[];
}>;
export type SuongMu = Readonly<{
    ro: readonly string[];
    mo: readonly string[];
    /** Nghe kể lại — ĐÃ BỊ BÓP MÉO. */
    tinDon: readonly string[];
    /** Không biết tồn tại. Id ở đây KHÔNG được xuất hiện ở bất kỳ chỗ nào khác trong view. */
    mu: readonly string[];
}>;
/**
 * Mạch truyện đã chiếu — Phần 28.2 + 30.1 tầng bốn.
 *
 * `kyUcMach` là sợi chỉ tự sự đã nén (30.3), `nutThatChuaGo` và `phucButChuaTra`
 * là hai danh sách BẤT KHẢ XÂM PHẠM của phép nén. Chúng đi thẳng vào tầng 4 và
 * tầng 6 của prompt, và chúng là lý do một ván năm trăm lượt không quên thứ đã
 * gieo ở lượt thứ mười.
 */
export type ProjectedStoryline = Readonly<{
    id: string;
    ten: string;
    loai: string;
    giaiDoan: string;
    cangThang: number;
    /** Vai của từng nhân vật — [BB] 29.3: người chơi cũng chỉ là một dòng ở đây. */
    nhanVat: readonly Readonly<{
        entityId: string;
        ten: string;
        vaiTro: string;
    }>[];
    kyUcMach: string;
    nutThatChuaGo: readonly string[];
    phucButChuaTra: readonly string[];
    nguoiChoiBiet: boolean;
}>;
export declare const NHIP_THOI_GIAN: readonly ["nhat", "nien", "the_dai", "vinh_kiep"];
export type NhipThoiGian = (typeof NHIP_THOI_GIAN)[number];
/**
 * ── Khối chiếu cho hai bảng của Phần 55 và 58 ──
 *
 * [BB] 55.5 và 58.12 nói cùng một câu, hai lần, vì nó là đường rò rỉ dễ quên
 * nhất trong toàn app: **bảng chỉ nhận `WorldView`**. Không `World`, không Dexie,
 * không store gốc. Điều đó chỉ khả thi nếu thứ bảng cần đi qua được `chieu()` —
 * nên năm khối dưới đây là một phần của phép chiếu, không phải một lối tắt.
 *
 * Nguyên tắc chung: **cắt ở chiếu, không cắt ở render.** Thứ tầng này không được
 * biết thì không tồn tại trong đối tượng, chứ không phải bị ẩn đi bằng CSS.
 */
/** Vùng "Khi nào" — 55.3, dải định vị 58.4. */
export type ProjectedThoiCuoc = Readonly<{
    eraId: string;
    /** Tên kỷ nguyên nếu thế giới đã đặt; rỗng nghĩa là chưa ai đặt tên cho nó. */
    tenKyNguyen: string;
    /** [BB] 55.5 — phàm nhân KHÔNG thấy tick. `null` nghĩa là tầng này không được thấy. */
    tick: number | null;
    /** [BB] 55.5 — phàm nhân không đếm năm theo lịch vũ trụ. */
    year: number | null;
    /** Cách tầng này gọi thời điểm hiện tại. Luôn có chữ, không bao giờ rỗng. */
    moTaThoiDiem: string;
    nhip: NhipThoiGian;
}>;
/** Vùng "Đang thế nào" — 13.1. [BB] 55.5: chỉ Sáng Thế Thần thấy năm con số này. */
export type ProjectedChiSo = Readonly<{
    thucTai: number;
    songDong: number;
    tuQuyet: number;
    tuSinh: number;
    phuThuoc: number;
}>;
/** Một trục Luật Nền đã chiếu — 43.4, vùng "Thế giới là gì". */
export type ProjectedTrucNen = Readonly<{
    truc: string;
    ten: string;
    trangThai: 'vo_danh' | 'co_ten';
    /** Tên khái niệm nền đã tiếp địa; rỗng khi trục còn vô danh. */
    tenKhaiNiemNen: string;
    soKeHo: number;
    soKeHoDaKhaiThac: number;
    khaNghich: boolean;
}>;
/** Cơ Chế Phái Sinh đã chiếu — 44.4. */
export type ProjectedCoChe = Readonly<{
    id: string;
    ten: string;
    bat: boolean;
    /** [BB] 44.5 — mục chưa có phải nói rõ CÒN THIẾU GÌ. */
    conThieu: readonly string[];
}>;
/** Vùng "Đã lệch bao xa" — 35.6. [BB] 55.5: chỉ Sáng Thế Thần. */
export type ProjectedDiBiet = Readonly<{
    nguon: string;
    thoa: number;
    cho: number;
    lech: number;
    batKha: number;
}>;
/**
 * ── Ba khối "việc đang chờ" ──
 *
 * Vùng "Cần chú ý" của 55.4 dựng từ chúng. Chúng nằm ở đây chứ không nằm trong
 * `bang/` vì ranh giới rất rõ: **`chieu()` quyết định cái gì được nhìn thấy,
 * `bang/` quyết định cái gì đáng nói.** Trộn hai việc lại là cách một bảng trạng
 * thái trở thành đường rò rỉ.
 */
/** Phục bút đã gieo mà chưa trả — 30.2. */
export type ProjectedPhucBut = Readonly<{
    id: string;
    noiDung: string;
    machId: string | null;
    loai: string;
    doNang: number;
    quaHan: boolean;
}>;
/** Lời cầu đang treo — 22.1. Rỗng ở tầng Phàm Nhân: họ cầu, họ không nhận. */
export type ProjectedLoiCau = Readonly<{
    id: string;
    noiDung: string;
    soNguoi: number;
    cuongDo: number;
    /** Còn dưới 20% thời gian tới hạn — ngưỡng của 55.4. */
    sapHetHan: boolean;
}>;
/** Lỗ hổng ưu tiên cao — 15.1. [BB] chỉ Sáng Thế Thần; đây là sổ của engine. */
export type ProjectedLoHong = Readonly<{
    id: string;
    moTa: string;
    loai: string;
    uuTien: number;
    /** Số nhịp đã tồn — 55.4 hỏi "tồn quá 2 kỷ nguyên". */
    tonBaoLau: number;
}>;
export type WorldView = Readonly<{
    /** Tầng người chơi ĐANG ĐỨNG. Đây là thứ UI dùng để tự xưng. */
    mode: ViewMode;
    /**
     * Tầng thật sự dùng để lọc — Phần 19.4 [BB].
     *
     * Bằng `mode` trong mọi trường hợp trừ một: vị thần **đang hóa thân** và chưa
     * thức tỉnh. Lúc ấy `mode = 'than'` (họ vẫn là thần, và UI vẫn nói vậy) nhưng
     * `mucChieu = 'pham_nhan'` — vì thứ họ NHÌN THẤY là thứ cái thân xác ấy thấy.
     * Đó là toàn bộ ý nghĩa của việc hạ phàm: mất tầm nhìn, không mất danh tính.
     */
    mucChieu: ViewMode;
    /** Có đang mượn một thân xác phàm không. */
    dangHoaThan: boolean;
    chuTheId: string | null;
    branchId: string;
    tick: number;
    entities: ReadonlyMap<string, ProjectedEntity>;
    /** Chỉ cạnh có CẢ HAI đầu trong `entities`. Xem `ProjectedLink`. */
    links: readonly ProjectedLink[];
    laws: readonly ProjectedLaw[];
    concepts: readonly ProjectedConcept[];
    suongMu: SuongMu;
    dongTuKhaDung: readonly VerbHandle[];
    nhipThoiGian: NhipThoiGian;
    /**
     * Mạch truyện chủ thể được biết — Phần 28, tầng 4 của prompt (33.1).
     *
     * `chieu()` chỉ đưa vào những mạch có `nguoiChoiBiet = true` hoặc có mặt một
     * entity chủ thể thấy rõ. Assembler đọc trường này chứ không đọc `storylines`
     * thô, nên [BB] 33.3 vẫn đúng nguyên: không có đường nào từ prompt tới World.
     */
    machTruyen: readonly ProjectedStoryline[];
    /**
     * ── Năm khối cho Bảng Thiên Diễn và Bảng Thông Tin ──
     *
     * [BB] 55.5 / 58.12 — bảng chỉ nhận `WorldView`. Chúng ở đây để câu ấy khả thi.
     */
    thoiCuoc: ProjectedThoiCuoc;
    /** `null` ở tầng Thần và Phàm Nhân — [BB] 55.5 hàng "Đang thế nào". */
    chiSo: ProjectedChiSo | null;
    /** Rỗng ở tầng Phàm Nhân; ở tầng Thần chỉ còn trục đã `co_ten` và thấy được. */
    luatNen: readonly ProjectedTrucNen[];
    /** Rỗng ngoài tầng Sáng Thế — cơ chế là vật lý của thế giới, không phải tri thức phàm. */
    coChe: readonly ProjectedCoChe[];
    /** Rỗng ngoài tầng Sáng Thế — [BB] 55.5 hàng "Đã lệch bao xa". */
    diBiet: readonly ProjectedDiBiet[];
    /** Chỉ phục bút thuộc mạch chủ thể biết. */
    phucBut: readonly ProjectedPhucBut[];
    /** Rỗng ở tầng Phàm Nhân; ở tầng Thần chỉ lời cầu gửi tới chính mình hoặc cầu chung. */
    loiCau: readonly ProjectedLoiCau[];
    /** Rỗng ngoài tầng Sáng Thế. */
    loHong: readonly ProjectedLoHong[];
    /**
     * Vân tay của tập quyền nhìn hiện tại.
     * [BB] Phần 77.8 — cache rerank phải chứa nó; đổi tầm nhìn thì cache cũ vô hiệu.
     */
    visibilityHash: string;
}>;
/** Ctx chỉ đọc cho runtime handler — Phần 61.2. Handler chỉ thấy view đã chiếu. */
export type RuntimeCtx = Readonly<{
    view: WorldView;
    actorId: string | null;
    eventId: string;
    seed: string;
}>;
