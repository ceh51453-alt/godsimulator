/**
 * Tương thích khối cập nhật kiểu MVU — Phần 31.7, 50.6, 66.6 [BB].
 *
 * ── Vì sao file này tồn tại ──
 *
 * Dòng thẻ bài MVU của SillyTavern chơi bằng một vòng lặp rất cụ thể: thẻ bài
 * khai một bộ biến trạng thái, model xuất một khối `<UpdateVariable>` mỗi lượt,
 * extension áp khối ấy rồi vẽ lại bảng trạng thái. Người chơi quen lối ấy mong
 * đợi đúng ba thứ: **một khối cập nhật mỗi lượt**, **một bảng đọc được ngay**,
 * và **con số thay đổi có lý do**.
 *
 * Thiên Diễn đã có cả ba, chỉ khác tên: khối `<CapNhat>` của 31.7, Bảng Thiên
 * Diễn của Phần 55, và Event/Patch làm lý do. Cái thiếu là **cú pháp**: một thẻ
 * bài MVU viết `<UpdateVariable>` chứ không viết `<CapNhat>`, và viết
 * `_.set('đường.dẫn', cũ, mới)` chứ không viết một mảng `patches`.
 *
 * ── Ranh giới KHÔNG được nhòe ──
 *
 * Nhận cú pháp của họ **không** phải là nhận thẩm quyền của họ.
 *
 * Mọi thứ file này dựng ra vẫn đi qua đúng ba lớp của `bocTach()`: schema, bảng
 * trắng, đường dẫn cấm. Cú pháp MVU không mở thêm một cánh cửa nào.
 *
 * Và quan trọng hơn: trong MVU, biến của thẻ bài **là** trạng thái trò chơi. Ở
 * đây thì không — [BB] 66.6 xếp "Macro biến" về namespace `preset.<packId>`, và
 * [BB] luật bất biến #5 nói preset không ghi thẳng World. Nên đường dẫn nào
 * không trỏ tới một thực thể có thật sẽ thành **biến của pack**: nó hiện lên
 * bảng, nó sống qua save, nó vào được prompt lượt sau — và nó không đổi một
 * dòng nào trong `WorldState`.
 *
 * Đó là lý do một thẻ bài MVU chạy được ở đây mà vẫn không tự viết lại thế giới.
 */
/** Thẻ nào được coi là khối cập nhật — 31.7 dùng tên thứ hai. */
export declare const THE_KHOI_CAP_NHAT: readonly ["CapNhat", "UpdateVariable"];
export type BienPackDoi = Readonly<{
    duong: string;
    giaTri: unknown;
    /** Toán tử: `set` là mặc định, `add` cộng dồn — op quan trọng nhất của 50.6. */
    phep: 'set' | 'add' | 'push';
    /** Ghi chú model viết sau `//`. Vào chẩn đoán, không vào World. */
    lyDo: string;
}>;
export type KetQuaDocKhoi = Readonly<{
    /** Ứng viên patch, dạng thô — người gọi vẫn phải cho qua schema và bảng trắng. */
    tho: readonly unknown[];
    /** Thay đổi thuộc về namespace pack, KHÔNG thuộc về World. */
    bienPack: readonly BienPackDoi[];
    /** Cú pháp nhận ra được nhưng không dùng được, kèm lý do đọc được. */
    boQua: readonly {
        readonly nguyenVan: string;
        readonly vi: string;
    }[];
}>;
/** Bắt cả hai thẻ, cả dạng chưa đóng — model bị cắt cụt để lại một thẻ mở. */
export declare function bieuThucKhoi(): RegExp;
export declare function bieuThucCatKhoi(): RegExp;
/**
 * Tách một đường dẫn thành đích ghi của engine.
 *
 * Trả `null` nghĩa là đường dẫn KHÔNG trỏ tới thứ gì trong thế giới — và đó là
 * trường hợp thường gặp nhất với thẻ bài MVU, vì `stat_data.主角.好感度` là biến
 * của thẻ bài chứ không phải một thực thể.
 *
 * Khớp id theo tiền tố DÀI NHẤT: id trong Thiên Diễn có thể chứa dấu chấm
 * (`e.chu_the`), nên cắt ở dấu chấm đầu tiên sẽ hỏng. Thử từ dài xuống ngắn cho
 * kết quả đúng ở cả hai kiểu id mà không cần một quy ước đặt tên nào.
 */
export declare function phanGiaiDuongDan(duong: string, idHopLe: ReadonlySet<string>): {
    table: string;
    id: string;
    path: string;
} | null;
/**
 * Đọc thân khối cập nhật ở cả ba dạng.
 *
 * ```text
 * 1. {"patches":[ … ]}                     native
 * 2. {"e.than.soul.x": {"_op":"add",…}}    bản đồ đường dẫn của 31.7
 * 3. _.set('path', cũ, mới); // lý do      câu lệnh kiểu MVU
 * ```
 *
 * Dạng 3 được đọc bằng biểu thức chính quy trên VĂN BẢN. Không `eval`, không
 * `new Function`, không dựng hàm — đó là luật bất biến #10, và một thẻ bài là
 * dữ liệu không tin cậy dù nó trông giống JavaScript đến đâu.
 */
export declare function docKhoiCapNhat(than: string, idHopLe: ReadonlySet<string>): KetQuaDocKhoi | null;
