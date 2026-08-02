/**
 * Đối soát entry — Phần 51.2, 51.3, 51.4, 51.6 [BB].
 *
 * ── Nguyên tắc Sử Thắng Nguồn ──
 *
 * ```text
 * 1. Sự thật engine (world state)   — tuyệt đối
 * 2. SỬ      (nguon = 'tu_sinh')    — điều đã xảy ra
 * 3. DI SẢN  (nguon = 'di_san')     — điều đã xảy ra ở vòng trước, đã bóp méo
 * 4. NGUỒN   (nguon = 'nguoi_dung') — điều lẽ ra phải xảy ra
 * ```
 *
 * [BB] Đây **không** phải hạ thấp lorebook người dùng. Nguồn vẫn là lực hấp dẫn
 * ở 35.4. Nhưng khi thế giới đã đi hướng khác, không được nói dối về chuyện đã rồi.
 *
 * ── Che không phải xóa ──
 *
 * [BB] 51.3 — entry bị che **không** được nạp vào ngữ cảnh, nhưng **vẫn** hiện
 * trong trình soạn kèm lý do, **vẫn** hiện trên Bản Đồ Dị Biệt, và **có thể** được
 * người chơi bỏ che bất cứ lúc nào. Vì vậy `che()` dưới đây trả về một entry MỚI
 * có `trangThai = 'bi_che'`, không bao giờ trả về `undefined`.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { LorebookEntry, NguonLorebook } from './schema.js';
/** Thứ tự ưu tiên nạp — 51.2. Số nhỏ hơn = thắng. */
export declare const UU_TIEN_NGUON: Readonly<Record<NguonLorebook, number>>;
export declare const QUAN_HE_DOI_SOAT: readonly ["bo_sung", "lam_ro", "trung_lap", "mau_thuan"];
export type QuanHeDoiSoat = (typeof QUAN_HE_DOI_SOAT)[number];
export type DoiSoat = {
    readonly moiId: string;
    readonly cuId: string;
    readonly quanHe: QuanHeDoiSoat;
    readonly lyDo: string;
    /** Việc phải làm — dịch thẳng từ bảng 51.3. */
    readonly xuLy: 'giu_ca_hai' | 'giu_ca_hai_ha_uu_tien' | 'gop' | 'che';
    /** Khi `xuLy = 'che'`: bên nào bị che. Rỗng nghĩa là không che được (khóa canon). */
    readonly cheId: string;
    readonly giuId: string;
};
export type EntryCoNguon = {
    readonly entry: LorebookEntry;
    readonly lorebookId: string;
    readonly nguon: NguonLorebook;
};
/**
 * Phân loại quan hệ giữa hai entry — 51.3 bảng.
 *
 * Deterministic: cùng cặp entry luôn cho cùng quan hệ, không phụ thuộc thứ tự gọi.
 */
export declare function phanLoaiQuanHe(moi: LorebookEntry, cu: LorebookEntry): {
    quanHe: QuanHeDoiSoat;
    lyDo: string;
};
/**
 * Đối soát một entry mới với toàn bộ entry đang có — 51.3.
 *
 * Ứng viên va chạm: giao `keys`/`secondaryKeys`, **hoặc** cùng nói về một entity
 * qua bảng `chuDe` (53.4).
 */
export declare function doiSoatEntry(moi: EntryCoNguon, daCo: readonly EntryCoNguon[]): DoiSoat[];
export type KetQuaChe = {
    readonly entry: LorebookEntry;
    /** Câu ghi vào biên niên sử, giọng kể — 51.3 [BB]. */
    readonly dongBienNien: string;
};
/**
 * Che một entry. [BB] Che KHÔNG phải xóa.
 *
 * Trả về bản sao có `trangThai = 'bi_che'`; entry gốc không bị sửa tại chỗ. Nếu
 * entry khóa canon thì hàm trả về nguyên bản kèm dòng biên niên nói rõ vì sao
 * không che — im lặng bỏ qua là cách nhanh nhất để người chơi tưởng nút hỏng.
 */
export declare function che(entry: LorebookEntry, boiId: string, lyDo: string, tick: number, boiAi?: LorebookEntry['lichSu'][number]['boiAi']): KetQuaChe;
/** Bỏ che — người chơi làm được bất cứ lúc nào (51.3). */
export declare function boChe(entry: LorebookEntry, tick: number): LorebookEntry;
export type NguonSinhSu = {
    readonly eventIds: readonly string[];
    readonly chronicleIds: readonly string[];
    /** Entry lorebook được dùng làm nguồn — [BB] chỗ này PHẢI rỗng. */
    readonly entryIds: readonly string[];
};
/**
 * [BB] 51.6 — sử kỷ nguyên N **chỉ** được sinh từ `events` và `chronicle` của kỷ
 * nguyên N. Sinh từ sử cũ thì sai lệch tự nhân lên theo cấp số.
 *
 * Hàm trả về issue thay vì boolean: người gọi cần biết ID nào phạm để bỏ đúng cái đó.
 */
export declare function kiemNguonSinhSu(nguon: NguonSinhSu): ImportIssue[];
export type BangDoiSoat = {
    readonly mauThuan: readonly DoiSoat[];
    readonly trungLap: readonly DoiSoat[];
    readonly boSung: readonly DoiSoat[];
    readonly lamRo: readonly DoiSoat[];
    readonly tomTat: string;
};
/** Gom kết quả đối soát thành bảng của 51.7. */
export declare function bangDoiSoat(ds: readonly DoiSoat[], kyNguyen: number, soEntryMoi: number): BangDoiSoat;
