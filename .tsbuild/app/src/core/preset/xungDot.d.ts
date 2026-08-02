/**
 * Bước 9 — đồ thị dependency và nhóm xung đột. Phần 65.1, 65.2, 65.3 [BB].
 *
 * ── Điều dễ làm sai nhất ở đây ──
 *
 * Cám dỗ là tự giải xung đột: hai module cùng đòi ngôi kể thì chọn cái `order`
 * nhỏ hơn rồi đi tiếp. 65.1 cấm đúng điều đó — "kết quả phải hiện cho người dùng
 * duyệt". Nên `nhomXungDot()` trả về **nhóm cần chọn**, không trả về lựa chọn; và
 * `giaiTuDong()` chỉ giải những chiến lược mà đặc tả nói là giải được máy móc
 * (`min`, `native_wins`, `merge_ordered`), để lại `exclusive_one` và `user_choice`
 * cho con người.
 *
 * Tương tự với cycle: [BB] 65.2 — "không tự bẻ bằng id". Một importer tự cắt
 * cạnh theo thứ tự chữ cái sẽ cho ra một pack chạy được mà sai, và không ai biết
 * nó đã cắt gì.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { ModuleKind, ModuleLane, PromptModule } from './schema.js';
/** Mười lăm khóa của 65.1, giữ nguyên thứ tự đặc tả. */
export declare const CONFLICT_KEYS: readonly ["language.output", "length.words", "pov.camera", "dialogue.ratio", "prose.style", "character.autonomy", "character.knowledge", "history.wrapper", "memory.summary", "output.format", "output.status_panel", "reasoning.visibility", "content.maturity", "generation.temperature", "generation.context"];
export type ConflictKey = (typeof CONFLICT_KEYS)[number];
export declare const CHIEN_LUOC: readonly ["exclusive_one", "merge_ordered", "min", "max_with_profile_cap", "native_wins", "user_choice"];
export type ChienLuoc = (typeof CHIEN_LUOC)[number];
/** Chiến lược giải cho từng khóa — 65.1 bảng thứ hai. */
export declare const CHIEN_LUOC_CUA: Readonly<Record<ConflictKey, ChienLuoc>>;
/** Suy ra conflict key từ nội dung + vai trò module. Gợi ý, không phải phán quyết. */
export declare function suyConflictKeys(m: {
    readonly content: string;
    readonly kind: ModuleKind;
    readonly lane: ModuleLane;
}): ConflictKey[];
/**
 * Suy `provides` / `requires` từ nội dung — 65.2.
 *
 * Nguồn suy: biến macro set/get, cặp tag mở/đóng, marker, prefill. Đây là đúng
 * danh sách đặc tả liệt kê; thêm nguồn đoán mò vào đây sẽ tạo cạnh giả và cycle giả.
 */
export declare function suyPhuThuoc(m: {
    readonly content: string;
    readonly kind: ModuleKind;
    readonly lane: ModuleLane;
}): {
    provides: string[];
    requires: string[];
};
export type Canh = {
    readonly tu: string;
    readonly den: string;
    readonly khoa: string;
};
export type DoThiPhuThuoc = {
    readonly thuTu: readonly string[];
    readonly canh: readonly Canh[];
    /** Rỗng nghĩa là không có vòng — không phải "chưa kiểm". */
    readonly cycles: readonly (readonly string[])[];
    /** `requires` không ai `provides`. */
    readonly thieu: readonly {
        readonly moduleId: string;
        readonly khoa: string;
    }[];
    readonly issues: readonly ImportIssue[];
};
/**
 * Topological sort trên đồ thị provides→requires.
 *
 * Ổn định: khi nhiều nút cùng sẵn sàng, chọn theo `order` rồi tới `id`. Nhờ vậy
 * cùng một pack luôn cho cùng một thứ tự, và diff giữa hai lần nhập đọc được.
 */
export declare function dungDoThi(modules: readonly PromptModule[]): DoThiPhuThuoc;
export type NhomXungDot = {
    readonly khoa: ConflictKey;
    readonly chienLuoc: ChienLuoc;
    readonly moduleIds: readonly string[];
    /** `true` khi không có cách nào giải máy móc — người dùng phải chọn. */
    readonly canNguoiChon: boolean;
    readonly moTa: string;
};
/** Gom module theo conflict key. Chỉ tính module đang bật — tắt thì không xung đột với ai. */
export declare function nhomXungDot(modules: readonly PromptModule[]): NhomXungDot[];
/**
 * Giải trước những nhóm mà đặc tả nói giải được máy móc.
 *
 * Trả về bản đồ `khoa → moduleId[]` được giữ. Nhóm cần người chọn **không** nằm
 * trong kết quả: bỏ sót chúng ở đây là cố ý, để bước kích hoạt thấy còn thiếu.
 */
export declare function giaiTuDong(nhom: readonly NhomXungDot[], modules: readonly PromptModule[]): Record<string, string[]>;
