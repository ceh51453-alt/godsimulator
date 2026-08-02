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
export declare const NGUON_SINH: readonly ["nguoi_choi", "than", "pham_nhan", "the_gioi_tu_sinh", "ket_tinh", "chuyen_hoa", "lorebook", "workflow", "nhap_du_lieu"];
export type NguonSinh = (typeof NGUON_SINH)[number];
/** Nhãn đọc được — [BB] 58.13, không hiện tên enum cho người chơi. */
export declare const NHAN_NGUON_SINH: Readonly<Record<NguonSinh, string>>;
/** Bốn bộ lọc nguồn luôn có ở tab Tạo vật — 58.7. */
export declare const NHOM_NGUON: Readonly<Record<string, readonly NguonSinh[]>>;
export declare const ProvenanceSchema: z.ZodPrefault<z.ZodObject<{
    nguon: z.ZodEnum<{
        nguoi_choi: "nguoi_choi";
        than: "than";
        pham_nhan: "pham_nhan";
        workflow: "workflow";
        lorebook: "lorebook";
        ket_tinh: "ket_tinh";
        the_gioi_tu_sinh: "the_gioi_tu_sinh";
        chuyen_hoa: "chuyen_hoa";
        nhap_du_lieu: "nhap_du_lieu";
    }>;
    actorId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    eventId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    parentIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    tick: z.ZodNumber;
}, z.core.$strip>>;
export type Provenance = z.infer<typeof ProvenanceSchema>;
/**
 * Đọc nguồn gốc của một entity đã chiếu.
 *
 * Nhận `Record<string, unknown>` vì nó chạy trên `ProjectedEntity.aspects` — tức
 * là trên aspect ĐÃ BỊ LỌC. Thiếu thì trả mốc `nhap_du_lieu` đúng luật migration
 * của 59.1, không throw: một entity cũ vẫn phải hiện được trên Bảng.
 */
export declare function docNguonGoc(aspects: Readonly<Record<string, unknown>>): Provenance;
/** Dựng nguồn gốc cho một entity mới. Dùng ở mọi chỗ sinh entity. */
export declare function nguonGoc(nguon: NguonSinh, tick: number, them?: {
    actorId?: string | null;
    eventId?: string | null;
    parentIds?: readonly string[];
}): Provenance;
