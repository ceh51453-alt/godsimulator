/**
 * Sổ Tay — Phần 56.1, 56.2 [BB].
 *
 * > "Ở `pham_nhan`, Bảng Thiên Diễn **không phải là bản rút gọn**. Nó bị thay
 * > bằng một màn hình khác về bản chất: trang giấy của chính nhân vật."
 *
 * ── Bốn quy tắc, và chỗ mỗi quy tắc được cưỡng chế ──
 *
 * 1. **Không con số hệ thống.** Tuổi, số nợ, số lần làm lễ thì được — một người
 *    thật đếm được chúng. `trongSo`, `yeuGhet` bằng số, `dienTich` ký ức thì
 *    không. Cưỡng chế: file này **chỉ nhận `WorldView`**, và `chieu()` đã xóa
 *    những trường ấy khỏi đối tượng. Cộng thêm `quetSoRo()` để test soi lại.
 * 2. **Luật hiện dưới dạng `dienGiai` của vùng mình, kèm chỗ nó sai.**
 * 3. **Tin đồn ghi kèm độ tin** — lấy thẳng từ số chặng của `bopMeo()`.
 * 4. **Quan hệ ghi bằng `anTuong`**, không bằng bốn trục.
 *
 * ── Vì sao đây là màn hình quan trọng nhất của cả trò chơi ──
 *
 * Cùng một database, cùng một tick: ở tầng Sáng Thế "Ô Uế" là một định luật có
 * hiệu lực 94%; ở đây nó là *"đao phủ phải ở ngoài thành, và ta đã làm lễ ấy chín
 * lần, chưa lần nào thấy khác đi"*. Toàn bộ luận điểm của trò chơi nằm gọn trên
 * một trang giấy.
 */
import type { WorldView } from '../contracts/view.js';
import type { KnowledgeRow } from '../schema/soSach.js';
export type DongQuen = {
    readonly ten: string;
    readonly xungHo: string;
    /** [BB] 56.2 quy tắc 4 — câu chữ, không phải bốn trục. */
    readonly anTuong: string;
    readonly laHuyenThoai: boolean;
};
export type DongTin = {
    readonly noiDung: string;
    /** "nghe qua ba miệng", "không rõ từ đâu" — quy tắc 3. */
    readonly doTin: string;
};
export type DongMuon = {
    readonly noiDung: string;
    readonly xong: boolean;
};
export type SoTay = {
    /** "Ta là Ankhtu, con thứ của thợ nhuộm Sanu, ở Thebes." */
    readonly moDau: readonly string[];
    readonly than: readonly string[];
    readonly quen: readonly DongQuen[];
    readonly tin: readonly string[];
    readonly nghe: readonly DongTin[];
    readonly muon: readonly DongMuon[];
    /** Việc đang làm lúc này — từ lịch, không từ một trường trạng thái. */
    readonly dangLam: string;
};
/** Số chặng → câu người ta thật sự nói. Quy tắc 3 của 56.2. */
export declare function doTinTheoChang(hops: number, nguon: string): string;
export type NguLieuSoTay = {
    readonly view: WorldView;
    /** Đã lọc sẵn về đúng `knowerId === view.chuTheId`. */
    readonly triThuc: readonly KnowledgeRow[];
    /** Việc đang làm lúc này, lấy từ `lich.dangODau()`. */
    readonly viecDangLam: string;
    /** Số lần đã làm một nghi thức mà không thấy khác đi — 56.2 quy tắc 2. */
    readonly nghiThucVoIch: readonly {
        ten: string;
        soLan: number;
    }[];
};
/**
 * Dựng Sổ Tay.
 *
 * [BB] Tham số là `WorldView`. Không có đường nào từ đây tới `World` thô, nên
 * "không lộ số engine" là chuyện KIỂU DỮ LIỆU, không phải chuyện cẩn thận.
 */
export declare function dungSoTay(ng: NguLieuSoTay): SoTay;
/**
 * Khóa engine mà Sổ Tay KHÔNG được chứa — [BB] 56.2 quy tắc 1.
 *
 * Danh sách này là nguồn chân lý cho cả test lẫn người đọc. Nó cố tình gồm cả
 * những khóa mà `chieu()` đã lọc: nếu một ngày ai đó nới lỏng `chieu()`, cổng
 * này vẫn bắt được trước khi con số lên màn hình.
 */
export declare const KHOA_ENGINE_CAM: readonly string[];
/**
 * Soi một Sổ Tay đã dựng, trả về những khóa engine bị rò.
 *
 * Rỗng nghĩa là sạch. Dùng trong test của cổng Phase 7 ("UI không lộ số engine")
 * và dùng được cả trong bảng Tự Chẩn Đoán.
 */
export declare function quetSoRo(s: SoTay): readonly string[];
