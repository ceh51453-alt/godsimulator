/**
 * Aspect `provenance` — nguồn gốc bất biến. Phần 59.1 [BB].
 *
 * ── Vì sao không suy từ `tickSinh` ──
 *
 * [BB] 59.1 mở đầu bằng đúng câu đó: *"Bảng không thể trả lời 'ai đã tạo thứ
 * này?' bằng suy đoán từ `tickSinh`."* Hai thực thể sinh cùng một nhịp có thể
 * đến từ hai nguồn hoàn toàn khác nhau — một do người chơi ban, một do thế giới
 * tự sinh — và cột "Nguồn sinh" của Bảng Tạo Vật (58.7) sẽ nói dối ở đúng chỗ
 * người chơi tin nó nhất.
 *
 * ── Hai luật của aspect này ──
 *
 * 1. **Chỉ ghi nguồn sinh ĐẦU TIÊN.** Không sửa khi entity đổi phe, đổi tên hay
 *    chuyển cõi. Nguồn gốc là lịch sử, và lịch sử không được viết lại.
 * 2. **Chuyển hóa không ghi đè nguồn cũ.** Entity mới mang `nguon = 'chuyen_hoa'`
 *    và `parentIds` trỏ về thứ nó từng là. Nhờ vậy Bảng lần được "thần khí này
 *    từng là xương của thần nào" thay vì mất dấu ở mỗi lần biến hình.
 *
 * Save cũ thiếu aspect thì `docNguonGoc()` trả `nhap_du_lieu` và KHÔNG bịa
 * `actorId` — 59.1 nói rõ điều đó. Một `actorId` đoán ra còn tệ hơn một ô trống,
 * vì nó trông y như một sự thật.
 */
import { z } from 'zod';
export const NGUON_SINH = [
    'nguoi_choi',
    'than',
    'pham_nhan',
    'the_gioi_tu_sinh',
    'ket_tinh',
    'chuyen_hoa',
    'lorebook',
    'workflow',
    'nhap_du_lieu',
];
/** Nhãn đọc được — [BB] 58.13, không hiện tên enum cho người chơi. */
export const NHAN_NGUON_SINH = Object.freeze({
    nguoi_choi: 'do ta trực tiếp tạo',
    than: 'do một vị thần tạo',
    pham_nhan: 'do người phàm tạo',
    the_gioi_tu_sinh: 'thế giới tự sinh',
    ket_tinh: 'kết tinh từ khái niệm',
    chuyen_hoa: 'chuyển hóa từ thứ khác',
    lorebook: 'đến từ thần thoại nguồn',
    workflow: 'do một tác vụ nền tạo',
    nhap_du_lieu: 'không còn dấu vết nguồn',
});
/** Bốn bộ lọc nguồn luôn có ở tab Tạo vật — 58.7. */
export const NHOM_NGUON = Object.freeze({
    do_ta: Object.freeze(['nguoi_choi']),
    do_nguoi_khac: Object.freeze(['than', 'pham_nhan']),
    tu_sinh: Object.freeze(['the_gioi_tu_sinh', 'workflow']),
    ket_tinh: Object.freeze(['ket_tinh', 'chuyen_hoa']),
});
export const ProvenanceSchema = z
    .object({
    nguon: z.enum(NGUON_SINH),
    actorId: z.string().nullable().prefault(null),
    eventId: z.string().nullable().prefault(null),
    /** Thứ entity này từng là, khi `nguon = 'chuyen_hoa'` hoặc `'ket_tinh'`. */
    parentIds: z.array(z.string()).prefault([]),
    tick: z.number(),
})
    .prefault({ nguon: 'the_gioi_tu_sinh', tick: 0 });
/**
 * Đọc nguồn gốc của một entity đã chiếu.
 *
 * Nhận `Record<string, unknown>` vì nó chạy trên `ProjectedEntity.aspects` — tức
 * là trên aspect ĐÃ BỊ LỌC. Thiếu thì trả mốc `nhap_du_lieu` đúng luật migration
 * của 59.1, không throw: một entity cũ vẫn phải hiện được trên Bảng.
 */
export function docNguonGoc(aspects) {
    const raw = aspects['provenance'];
    if (raw === undefined || raw === null) {
        return ProvenanceSchema.parse({ nguon: 'nhap_du_lieu', tick: 0 });
    }
    const kq = ProvenanceSchema.safeParse(raw);
    return kq.success ? kq.data : ProvenanceSchema.parse({ nguon: 'nhap_du_lieu', tick: 0 });
}
/** Dựng nguồn gốc cho một entity mới. Dùng ở mọi chỗ sinh entity. */
export function nguonGoc(nguon, tick, them = {}) {
    return ProvenanceSchema.parse({
        nguon,
        tick,
        actorId: them.actorId ?? null,
        eventId: them.eventId ?? null,
        parentIds: [...(them.parentIds ?? [])],
    });
}
