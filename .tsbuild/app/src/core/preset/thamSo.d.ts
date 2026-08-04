/**
 * Hợp nhất thông số sinh của preset với cấu hình Tường Thuật do người dùng đặt.
 *
 * Cấu hình AI là lớp nền thuộc về máy. Preset là lớp phủ theo ván/nhánh, vì vậy
 * không được ghi ngược lớp phủ ấy vào cấu hình máy. Hàm thuần này được gọi ngay
 * trước lúc biên soạn và gửi một lượt kể, nhờ đó đổi nhánh hoặc tắt preset có
 * hiệu lực ngay mà không để lại thông số của ván trước.
 */
import type { ModelProfile, NormalizedGenParams } from '../schema/ai.js';
import type { PackDangBat } from './hopNhat.js';
export declare const KHOA_GHI_DE_THAM_SO = "generationOverrides";
/**
 * Thứ tự quyền: cấu hình tay -> preset cũ -> preset mới -> chỉnh tay của preset.
 * Chỉ giá trị đã được profile xác nhận mới đi vào kết quả gửi model.
 */
export declare function gopThamSoSinhPreset(nen: NormalizedGenParams, packs: readonly PackDangBat[], profile: ModelProfile): NormalizedGenParams;
