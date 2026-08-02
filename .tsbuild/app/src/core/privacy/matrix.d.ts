/**
 * Ma trận riêng tư — Phần 78.2, 78.11 [BB]; Prompt IDE "Cổng kỹ thuật Phase 0".
 *
 * "Lập ma trận dữ liệu private profile → projected persona → world-facing identity;
 *  trường riêng tư phải có test chứng minh không lọt qua từng biên."
 *
 * Đây là NGUỒN CHÂN LÝ cho test rò rỉ. Thêm trường vào PlayerProfile hoặc
 * CreatorIdentity mà quên khai ở đây → `privacy.test.ts` fail.
 */
/** Sáu biên mà dữ liệu có thể đi qua. */
export declare const BIEN: readonly ["world", "lorebook", "rag", "prompt", "preset", "export_mac_dinh", "log"];
export type Bien = (typeof BIEN)[number];
export declare const PHAN_LOAI: readonly ["rieng_tu", "ung_dung", "chieu_duoc", "canon_neu_cong_bo"];
export type PhanLoai = (typeof PHAN_LOAI)[number];
export type MucMaTran = {
    /** Đường dẫn trong schema, ví dụ 'profile.privateNotes'. */
    readonly duongDan: string;
    readonly phanLoai: PhanLoai;
    /** Biên được phép đi qua. Rỗng = không biên nào. */
    readonly choPhep: readonly Bien[];
    readonly lyDo: string;
};
/** PlayerProfile — Phần 78.2. */
export declare const MA_TRAN_PROFILE: readonly MucMaTran[];
/** CreatorIdentity — Phần 78.3. Canon hóa CHỈ khi worldDisclosure bật. */
export declare const MA_TRAN_CREATOR: readonly MucMaTran[];
export declare const MA_TRAN: readonly MucMaTran[];
export declare function mucMaTran(duongDan: string): MucMaTran | undefined;
export declare function duocPhep(duongDan: string, bien: Bien): boolean;
/** Trường tuyệt đối riêng tư — dùng cho test rò rỉ và cho secret stripping khi export. */
export declare const TRUONG_RIENG_TU: readonly string[];
/** Tên khóa (không phải đường dẫn) bị cấm xuất hiện trong payload gửi ra biên ngoài. */
export declare const KHOA_CAM_RA_NGOAI: readonly string[];
export type ViPhamRoRi = {
    khoa: string;
    duongDan: string;
};
/**
 * Quét một payload sắp đi qua `bien` tìm khóa riêng tư.
 * Trả danh sách vi phạm; rỗng nghĩa là sạch.
 */
export declare function quetRoRi(payload: unknown, bien: Bien): ViPhamRoRi[];
