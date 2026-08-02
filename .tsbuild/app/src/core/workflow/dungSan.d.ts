/**
 * Bảy tác vụ dựng sẵn và năm preset — Phần 50.8, 50.9, 50.10, 50.12 [BB].
 *
 * ── Ba ràng buộc của 50.9 ──
 *
 * - Stage 2 **bắt buộc bật họ bản sao**. "Nhồi 30 nhân vật vào một prompt là cách
 *   chắc chắn nhất để có 30 hành động na ná nhau — model sẽ tự động làm chúng
 *   đồng nhất."
 * - Stage 4 dùng **lịch thời gian truyện**, không dùng lịch theo lượt. Đây là
 *   khác biệt then chốt với Phần 47.
 * - Stage 7 dùng **model tốt nhất, chạy hiếm nhất**. Nó là tác vụ duy nhất được
 *   phép kết tinh luật mới, và luật mới ảnh hưởng vĩnh viễn.
 *
 * Cả ba đều có test cổng, và `kiemLanRanh()` dưới đây từ chối một preset vi phạm
 * chúng ngay khi nạp — không đợi tới lúc chạy.
 */
import type { StructuredError } from '../contracts/errors.js';
import type { WorkflowPreset, WorkflowTask } from './schema.js';
export declare const TAC_VU_DUNG_SAN: readonly WorkflowTask[];
/** Năm preset dựng sẵn — 50.8. */
export declare const PRESET_WORKFLOW: Readonly<Record<string, WorkflowPreset>>;
/**
 * Lằn ranh cứng áp cho TỪNG tác vụ — 50.10 [BB].
 *
 * Mọi lằn ranh của 47.4 áp cho từng tác vụ, không chỉ cho vòng lặp tổng. Không
 * tác vụ nào — kể cả stage 7 — được sửa Luật Nền, dùng Vũ Khí Khái Niệm, kích
 * hoạt kết cục, tạo nhánh, hay sửa cấu hình.
 */
export declare const DUONG_DAN_CAM_WORKFLOW: readonly string[];
export type KetQuaKiemLanRanh = {
    readonly dat: boolean;
    readonly loi: readonly StructuredError[];
};
/** Kiểm một preset workflow trước khi nạp — chặn sớm thay vì chặn lúc chạy. */
export declare function kiemLanRanh(preset: WorkflowPreset): KetQuaKiemLanRanh;
export type MucChanDoan = {
    readonly so: number;
    readonly ma: string;
    readonly muc: 'canh_bao' | 'loi' | 'hong_nang';
    readonly thongDiep: string;
};
export type SoLieuChanDoan = {
    readonly taskId: string;
    /** Số lượt liên tiếp mà tác vụ dùng hết `soLanThuLai`. */
    readonly soLuotTruotLienTiep: number;
    readonly tyLeLoiPresetChinh: number;
    readonly soLanParseLoiLienTiep: number;
    readonly tyLeLechHoBanSao: number;
    readonly coEntryTuKichHoat: boolean;
    readonly daGhiLorebookNguoiDung: boolean;
};
/** Sáu kiểm của bảng 50.12 — số 31 tới 36. */
export declare function chanDoanWorkflow(sl: SoLieuChanDoan, nguong: {
    readonly loiPresetChinh: number;
    readonly parseLoiLienTiep: number;
    readonly lechHoBanSao: number;
}): MucChanDoan[];
/** [BB] 50.8 — xuất/nhập preset dưới dạng MỘT file JSON duy nhất. */
export declare function xuatPreset(p: WorkflowPreset): string;
export declare function nhapPresetWorkflow(text: string): {
    ok: true;
    preset: WorkflowPreset;
} | {
    ok: false;
    loi: string;
};
