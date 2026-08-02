/**
 * Ba kênh truy hồi và RRF — Phần 54.1, 54.6 [BB].
 *
 * | Kênh | Mạnh ở |
 * |---|---|
 * | Từ vựng (BM25) | tên riêng, thuật ngữ, trích dẫn chính xác |
 * | Ngữ nghĩa      | diễn đạt khác, "chuyện tương tự đã từng xảy ra chưa" |
 * | Đồ thị         | liên quan nhân quả, quan hệ, cùng mạch truyện |
 *
 * ── Vì sao RRF chứ không phải cộng điểm có chuẩn hóa ──
 *
 * 54.1 giải thích và lý do đó là lý do kỹ thuật: RRF chỉ cần THỨ HẠNG, không cần
 * điểm số so sánh được giữa các kênh. BM25 trả điểm không chặn trên, cosine trả
 * [-1,1], điểm đồ thị trả (0,1]. Chuẩn hóa ba thang ấy về một thang đòi ba hằng
 * số phải tinh chỉnh lại mỗi khi một kênh đổi; RRF không đòi hằng số nào và
 * không hỏng khi một kênh chết.
 *
 * [BB] Trọng số mặc định: từ vựng 1.0 · ngữ nghĩa 1.0 · đồ thị 1.2. Đồ thị nhỉnh
 * hơn vì trong game này liên hệ nhân quả quan trọng hơn liên hệ ngữ nghĩa.
 */
import type { ChunkDaChieu } from './chunk.js';
export declare const K_RRF = 60;
export declare const TRONG_SO_KENH: Readonly<{
    tuVung: 1;
    nguNghia: 1;
    doThi: 1.2;
}>;
export type KetQuaKenh = {
    /** Đã sắp theo hạng, phần tử đầu là hạng 1. */
    readonly xepHang: readonly string[];
    readonly diem: ReadonlyMap<string, number>;
    /** Kênh có chạy được không — ngữ nghĩa tắt thì `false`, và RAG vẫn chạy (54.4). */
    readonly songKhoe: boolean;
};
/**
 * Tách từ tiếng Việt ở mức âm tiết.
 *
 * Không dùng bộ tách từ ghép: tiếng Việt viết rời âm tiết, và với truy hồi thì
 * âm tiết đã đủ — "Thung Lũng Tro" khớp được cả khi truy vấn viết "thung lũng".
 * Ghép từ sẽ làm ngược lại: "thung lũng" không khớp "thung lũng tro".
 */
export declare function tachTu(s: string): readonly string[];
type ThongKeBM25 = {
    readonly df: ReadonlyMap<string, number>;
    readonly doDaiTb: number;
    readonly tf: ReadonlyMap<string, ReadonlyMap<string, number>>;
    readonly doDai: ReadonlyMap<string, number>;
    readonly N: number;
};
export declare function thongKeBM25(ds: readonly ChunkDaChieu[]): ThongKeBM25;
/** BM25 chuẩn, k1 = 1.2, b = 0.75. */
export declare function kenhTuVung(ds: readonly ChunkDaChieu[], truyVan: string): KetQuaKenh;
export type BoNhung = {
    /** Trả `null` khi endpoint chết hoặc chưa bật — [BB] 54.4 suy giảm ÊM. */
    readonly nhung: (text: string) => Float32Array | null;
};
/**
 * [BB] 54.4 — nếu `bat = false` hoặc endpoint nhúng chết, RAG VẪN PHẢI CHẠY với
 * hai kênh còn lại. Ứng dụng không bao giờ được hỏng vì thiếu embedding.
 *
 * Vì thế hàm này trả `songKhoe: false` chứ không throw, và người gọi coi kênh
 * vắng mặt là chuyện bình thường (`rrf()` tự chuẩn hóa lại trọng số).
 */
export declare function kenhNguNghia(ds: readonly ChunkDaChieu[], truyVan: string, bo: BoNhung | null): KetQuaKenh;
/**
 * Kênh đồ thị: điểm của một chunk = điểm cao nhất trong số entity nó nói tới.
 *
 * `diemTheoEntity` đến từ `moRong()` đã chạy trên `WorldView`, nên chunk nói về
 * một entity chủ thể không được biết sẽ có điểm 0 ở kênh này — thêm một lớp
 * ngoài lớp lọc tầm nhìn, và hai lớp là cố ý.
 */
export declare function kenhDoThi(ds: readonly ChunkDaChieu[], diemTheoEntity: ReadonlyMap<string, number>, machDangChieuId: string | null): KetQuaKenh;
export type MucRRF = {
    readonly chunkId: string;
    readonly diem: number;
    readonly hang: number;
    /** Kênh nào đã bầu cho chunk này — vào trace của tab Truy hồi (77.11). */
    readonly kenh: readonly string[];
};
/**
 * `diemRRF(chunk) = Σ_kênh w_kênh / (k + hạng_trong_kênh)`, k = 60.
 *
 * Kênh chết bị bỏ khỏi tổng và trọng số còn lại được chuẩn hóa — cùng nguyên tắc
 * mà 77.6 áp cho `rankSemantic`. Không chuẩn hóa thì tắt embedding sẽ làm điểm
 * tổng của MỌI chunk tụt đều, và ngưỡng cắt theo điểm tuyệt đối (nếu có) sẽ sai.
 */
export declare function rrf(kenh: readonly {
    ten: string;
    kq: KetQuaKenh;
    trongSo: number;
}[], k?: number): readonly MucRRF[];
export {};
