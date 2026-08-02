/**
 * Ảnh chụp Bảng Thiên Diễn — Phần 55.8 [BB].
 *
 * ── Vì sao có một schema riêng cho một bảng trạng thái ──
 *
 * [BB] 55.8: "Đếm toàn bộ entity qua Dexie mỗi lần render là không chấp nhận
 * được. Dựng snapshot vật chất hoá, cập nhật ở **ranh giới tick**, không cập nhật
 * theo từng thay đổi."
 *
 * Nên ảnh chụp này là một bản ghi thật, có nơi lưu và có version, chứ không phải
 * một biến `useMemo`. Nó cũng là nơi duy nhất giữ được hai thứ mà một hàm thuần
 * trên `WorldView` không thể tự biết:
 *
 *   1. **Chuỗi bảy kỷ nguyên** của từng chỉ số — nguồn của sparkline (55.6 quy tắc 4).
 *   2. **Thế giới trông thế nào lần cuối người chơi mở Bảng** — nguồn của vùng
 *      "Từ lần trước" (55.4), và [BB] 55.4 nói rõ mốc so sánh là *lần cuối mở
 *      Bảng*, không phải đầu kỷ nguyên.
 *
 * [BB] 55.8 — ảnh chụp lưu theo `mode`. Đổi tầng chơi thì tính lại, KHÔNG tái
 * dùng ảnh của tầng khác. Đó là con đường rò rỉ: số của Sáng Thế Thần hiện lại
 * trên màn hình một phàm nhân là rò rỉ, dù chỉ rò một con số.
 */
import { z } from 'zod';
/** Bảy điểm, bảy kỷ nguyên gần nhất — 55.6 quy tắc 4. */
export declare const SO_DIEM_SPARKLINE = 7;
/**
 * Trần số tên giữ lại trong ảnh chụp.
 *
 * Vùng "Từ lần trước" so hai tập TÊN chứ không so hai con số, vì "184 khái niệm"
 * đổi thành "185 khái niệm" không nói được cái gì vừa sinh ra. Nhưng giữ tên của
 * năm mươi nghìn entity thì ảnh chụp nặng hơn cả save — nên chỉ giữ những loại
 * có tên đáng nhớ, và cắt ở trần này.
 */
export declare const TRAN_TEN_NHO = 2000;
export declare const BangSnapshotSchema: z.ZodObject<{
    branchId: z.ZodString;
    tickTinh: z.ZodNumber;
    mode: z.ZodEnum<{
        sang_the: "sang_the";
        than: "than";
        pham_nhan: "pham_nhan";
    }>;
    dem: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    chuoiChiSo: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodNumber>>>;
    tickXemCuoi: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    lucXem: z.ZodPrefault<z.ZodObject<{
        luat: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        khaiNiem: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        than: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        machGiaiDoan: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        dem: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    }, z.core.$strip>>;
    ghim: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    thuGon: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type BangSnapshot = z.infer<typeof BangSnapshotSchema>;
export declare function anhChupMoi(branchId: string, mode: BangSnapshot['mode']): BangSnapshot;
