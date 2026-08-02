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
export const SO_DIEM_SPARKLINE = 7;

/**
 * Trần số tên giữ lại trong ảnh chụp.
 *
 * Vùng "Từ lần trước" so hai tập TÊN chứ không so hai con số, vì "184 khái niệm"
 * đổi thành "185 khái niệm" không nói được cái gì vừa sinh ra. Nhưng giữ tên của
 * năm mươi nghìn entity thì ảnh chụp nặng hơn cả save — nên chỉ giữ những loại
 * có tên đáng nhớ, và cắt ở trần này.
 */
export const TRAN_TEN_NHO = 2000;

export const BangSnapshotSchema = z
  .object({
    branchId: z.string(),
    tickTinh: z.number().int(),
    mode: z.enum(['sang_the', 'than', 'pham_nhan']),
    /** Số đếm theo `kind` — khóa là id kind, không phải nhãn hiển thị. */
    dem: z.record(z.string(), z.number()).prefault({}),
    /** Bảy kỷ nguyên gần nhất của từng chỉ số. */
    chuoiChiSo: z.record(z.string(), z.array(z.number())).prefault({}),
    /**
     * `null` nghĩa là CHƯA TỪNG mở Bảng — không phải "mở lúc nhịp 0".
     *
     * Dùng số 0 làm dấu "chưa mở" là một lỗi thật đã bị test bắt: một thế giới
     * vừa khai thiên đang đứng ở nhịp 0, nên người chơi mở Bảng ngay lượt đầu sẽ
     * vĩnh viễn không bao giờ có vùng "Từ lần trước".
     */
    tickXemCuoi: z.number().int().nullable().prefault(null),

    /**
     * Ảnh của thế giới tại lần mở Bảng gần nhất — mốc so của 55.4.
     *
     * Bốn tập tên, không phải bốn con số. `machGiaiDoan` giữ cả giai đoạn vì
     * "Ly Giáo Sông Đen lên cao trào" là một tin, còn "vẫn có 24 mạch" thì không.
     */
    lucXem: z
      .object({
        luat: z.array(z.string()).prefault([]),
        khaiNiem: z.array(z.string()).prefault([]),
        than: z.array(z.string()).prefault([]),
        machGiaiDoan: z.record(z.string(), z.string()).prefault({}),
        dem: z.record(z.string(), z.number()).prefault({}),
      })
      .prefault({}),

    /** Mục người chơi ghim lên Thanh Thiên Tượng — 55.2 [MR]. */
    ghim: z.array(z.string()).prefault([]),
    /** Vùng đang thu gọn — 55.7. Thứ tự vùng KHÔNG đổi được (55.3 [BB]). */
    thuGon: z.array(z.string()).prefault([]),
  })
  .strict();

export type BangSnapshot = z.infer<typeof BangSnapshotSchema>;

export function anhChupMoi(branchId: string, mode: BangSnapshot['mode']): BangSnapshot {
  return BangSnapshotSchema.parse({ branchId, tickTinh: 0, mode });
}
