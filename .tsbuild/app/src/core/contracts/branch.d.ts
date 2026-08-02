/**
 * Nhánh và save — Phần 26.1, 38, 61.5, 79.1.
 *
 * [BB] Chuyển tầng KHÔNG đổi branchId. Nhánh là thứ khác hẳn: nó là một dòng
 * thời gian song song, tạo ra bởi `phan_nhanh` khi sửa luật hoặc bởi người chơi.
 *
 * [BB] Copy-on-write (ADR-0014):
 *   Đọc  — nhánh hiện tại → lần lên `gocId` → tới gốc.
 *   Ghi  — LUÔN vào nhánh hiện tại; tạo bản sao nếu bản ghi thuộc nhánh cha.
 */
import { z } from 'zod';
export declare const BranchSchema: z.ZodObject<{
    id: z.ZodString;
    worldId: z.ZodString;
    gocId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    tickTao: z.ZodNumber;
    ten: z.ZodPrefault<z.ZodString>;
    lyDoTach: z.ZodPrefault<z.ZodString>;
    dangChay: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export type Branch = z.infer<typeof BranchSchema>;
/**
 * Bia mộ — đánh dấu bản ghi bị xóa Ở NHÁNH NÀY dù nhánh cha vẫn còn.
 * Thiếu nó thì phép đọc lần lên cha sẽ "hồi sinh" thứ đã xóa.
 */
export declare const TombstoneSchema: z.ZodObject<{
    branchId: z.ZodString;
    bang: z.ZodString;
    id: z.ZodString;
    tickXoa: z.ZodNumber;
}, z.core.$strict>;
export type Tombstone = z.infer<typeof TombstoneSchema>;
/**
 * Phiên bản schema của ứng dụng hiện tại. Save mới hơn con số này bị từ chối.
 * v4 = Thế Giới Sống (Phase 5): thêm bảng `knowledge` và `debts`.
 * v5 = Tầng Thần (Phase 6): thêm bảng `prayers`.
 * v6 = Mạch Truyện (Phase 8): thêm `storylines`, `foreshadows`, `chunks`.
 *
 * Ba bảng của v6 sinh ra RỖNG nên không có migration dữ liệu: save cũ mở ra với
 * ba Map rỗng và chơi tiếp bình thường — mạch truyện sẽ được `quetMachTruyen()`
 * sinh lại từ chính trạng thái thế giới ở nhịp kế tiếp. Đó là điểm mạnh của việc
 * tiền đề mạch truyện được DÒ từ world state chứ không được lưu sẵn (28.3).
 *
 * v7 = Phase 12: gói export nhận thêm **mười bảng** mà Phase 5–10 đã thêm vào
 * `WorldState` nhưng chưa bao giờ được ghi ra file. Xem ghi chú ở
 * `SaveExportSchema`.
 */
export declare const PHIEN_BAN_SCHEMA = 7;
/**
 * Gói export. [BB] Phần 38 — `proxyPassword` KHÔNG BAO GIỜ ghi vào file xuất.
 * [BB] Phần 78.2 — hồ sơ riêng tư chỉ có mặt khi người dùng CHỦ ĐỘNG chọn.
 *
 * ── Mười bảng bị bỏ quên (sửa ở Phase 12) ──
 *
 * Định dạng này viết ở Phase 2, khi `WorldState` mới có bốn Map. Phase 5 thêm
 * `knowledge` và `debts`, Phase 6 thêm `prayers`, Phase 8 thêm `storylines` và
 * `foreshadows`, Phase 9–10 thêm năm bảng nữa — và **không phase nào mở rộng
 * gói export**. Test round-trip vẫn xanh suốt bốn phase vì fixture của chúng để
 * mười bảng ấy rỗng.
 *
 * Hậu quả với người chơi: xuất một ván ra file rồi nhập lại làm mất Luật Nền,
 * lorebook, mạch truyện, sổ phục bút, tri thức, nợ và lời cầu — im lặng, và chỉ
 * lộ ra khi thế giới bắt đầu cư xử khác. E2E ba tầng bắt được nó ở lần chạy đầu
 * tiên.
 *
 * Save v6 vẫn nhập được: mười trường mới đều `.prefault([])`, nên một file cũ
 * mở ra với mười Map rỗng — đúng trạng thái nó vốn mô tả.
 */
export declare const SaveExportSchema: z.ZodObject<{
    dinhDang: z.ZodLiteral<"thien-dien-save">;
    schemaVersion: z.ZodNumber;
    appVersion: z.ZodPrefault<z.ZodString>;
    tickXuat: z.ZodNumber;
    world: z.ZodUnknown;
    branches: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    entities: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    links: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    gaps: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    metrics: z.ZodUnknown;
    events: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    knowledge: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    debts: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    prayers: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    storylines: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    foreshadows: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    substrateLaws: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    coChe: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    lorebooks: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    loreExpectations: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    diBan: z.ZodPrefault<z.ZodArray<z.ZodUnknown>>;
    hoSoRiengTu: z.ZodOptional<z.ZodUnknown>;
    danhTinhSangThe: z.ZodOptional<z.ZodUnknown>;
    stateHash: z.ZodString;
}, z.core.$strict>;
export type SaveExport = z.infer<typeof SaveExportSchema>;
/**
 * Khóa mà secret stripping phải xóa khỏi MỌI thứ đi ra ngoài.
 * [BB] Danh sách này là nguồn chân lý; `stripSecret()` và test dùng chung.
 */
export declare const KHOA_SECRET: readonly string[];
/**
 * Xóa mọi trường secret khỏi một cấu trúc dữ liệu, trả bản sao mới.
 * Không sửa đầu vào. Khớp tên khóa không phân biệt hoa thường.
 */
export declare function stripSecret<T>(v: T): T;
