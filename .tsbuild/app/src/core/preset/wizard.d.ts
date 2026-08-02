/**
 * Xưởng Preset — máy trạng thái bảy màn và báo cáo sau nhập. Phần 66.1, 66.2.
 *
 * ── Vì sao máy trạng thái nằm ở `core/` chứ không ở component ──
 *
 * [BB] 66.1: "Mỗi màn quay lại được mà không parse lại raw source." Một wizard
 * viết bằng `useState` sẽ parse lại mỗi lần render, và với file 700 kB thì người
 * dùng bấm "Quay lại" là màn hình đứng hình nửa giây. Nên toàn bộ kết quả nhập
 * được tính **một lần** và giữ trong một giá trị bất biến; bảy màn chỉ là bảy
 * cách đọc giá trị ấy.
 *
 * [BB] 66.1: màn 1 **không có nút "Nhập và bật"**. Nhập và kích hoạt là hai việc,
 * cách nhau đúng bảy màn, và kiểu dữ liệu ở đây phản ánh điều đó: `TrangThaiWizard`
 * không có trường nào tên là `activation`.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { KetQuaNhap } from './nhap.js';
export declare const MAN_WIZARD: readonly ["chon_file", "nhan_dien", "an_toan", "anh_xa", "xung_dot", "xem_truoc", "nhap_thu_vien"];
export type ManWizard = (typeof MAN_WIZARD)[number];
export declare const TEN_MAN: Readonly<Record<ManWizard, string>>;
export type TrangThaiWizard = {
    readonly man: ManWizard;
    /** `null` ở màn 1. Từ màn 2 trở đi luôn có, và KHÔNG bao giờ được tính lại. */
    readonly ketQua: KetQuaNhap | null;
    /** Module người dùng chọn bật. Rỗng nghĩa là chưa chọn gì — không phải "chọn tất". */
    readonly chonModuleIds: readonly string[];
    readonly giaiXungDot: Readonly<Record<string, unknown>>;
    /** Đã bấm "Nhập thư viện" chưa. Kích hoạt là bước SAU, không thuộc wizard. */
    readonly daNhapThuVien: boolean;
};
export declare function wizardMoi(): TrangThaiWizard;
/**
 * Nạp kết quả pipeline vào wizard và nhảy tới màn phù hợp.
 *
 * Pipeline dừng sớm thì wizard dừng ở màn tương ứng: hỏng ở bước 2–4 thì dừng ở
 * "Nhận diện", hỏng ở bước 5–8 thì dừng ở "An toàn". Người dùng thấy đúng chỗ
 * hỏng thay vì bị đẩy tới màn cuối rồi báo lỗi chung chung.
 */
export declare function napKetQua(tt: TrangThaiWizard, kq: KetQuaNhap): TrangThaiWizard;
/** Màn nào đi được từ màn hiện tại — dùng để vẽ nút và để test đường đi. */
export declare function manKeTiep(tt: TrangThaiWizard): ManWizard | null;
export declare function manTruocDo(tt: TrangThaiWizard): ManWizard | null;
/** Đi tới một màn. [BB] Không đụng `ketQua` — quay lại KHÔNG parse lại raw source. */
export declare function diToi(tt: TrangThaiWizard, man: ManWizard): TrangThaiWizard;
export declare function datChon(tt: TrangThaiWizard, ids: readonly string[]): TrangThaiWizard;
export declare function giaiMotXungDot(tt: TrangThaiWizard, khoa: string, chon: unknown): TrangThaiWizard;
export type BaoCaoNhap = {
    readonly daDoc: string;
    readonly hoatDong: string;
    readonly canChon: string;
    readonly canAdapter: string;
    readonly cachLy: string;
    readonly thamSo: string;
    readonly kichHoat: string;
    /** Mọi dòng, theo đúng thứ tự 66.2 — dùng cho UI và cho test. */
    readonly dong: readonly (readonly [string, string])[];
};
/**
 * Báo cáo sau nhập — 66.2.
 *
 * [BB] "Không dùng một dấu check xanh duy nhất cho cả file." Nên báo cáo là **sáu
 * dòng số**, mỗi dòng nói về một chuyện khác nhau, và dòng cuối luôn là
 * "Kích hoạt: Chưa" cho tới khi có `PresetActivation` thật.
 */
export declare function baoCaoNhap(kq: KetQuaNhap, daKichHoat?: boolean): BaoCaoNhap;
/** Issue của một màn — wizard hiện đúng thứ liên quan tới màn đang mở. */
export declare function issueCuaMan(kq: KetQuaNhap, man: ManWizard): ImportIssue[];
