/**
 * `environment_cycle` và `ecology` — hai tiến trình đứng dưới cùng của Phần 71.2.
 *
 * Mọi thứ khác trong thế giới này rút vật chất từ đây. Nếu hai hàm dưới sai,
 * cả nền kinh tế phía trên thành số ma.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { KetQuaTienTrinh, NgocCanhTienTrinh } from './types.js';
import type { SinhThai } from '../../schema/aspect/substrate.js';
declare const LOAI_TAI_NGUYEN: readonly ["rung", "thu", "ca", "dat"];
type LoaiTaiNguyen = (typeof LOAI_TAI_NGUYEN)[number];
/**
 * Gộp một tỷ lệ theo `n` bước.
 *
 * [BB] Phần 71.6 — "gộp bước ổn định bằng công thức macro", không lặp vòng.
 * Với đại lượng phân rã/tiệm cận, `1 - (1-r)^n` là **đúng chính xác**; với
 * logistic nó là cận trên có kẹp trần, nên tua nhanh không bao giờ vượt sức chứa.
 */
export declare function gopTyLe(r: number, n: number): number;
/**
 * Mùa, năm và thiên tai.
 *
 * Đây là đồng hồ: `world.year` được suy từ tick chứ không đếm riêng, nên không
 * có cách nào để lịch và tick lệch nhau (bất biến `nam_khop_tick`).
 */
export declare function chayMoiTruong(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
/**
 * Phục hồi logistic có trần.
 *
 * [BB] Trữ lượng bằng 0 thì KHÔNG mọc lại. Săn cạn một loài là tuyệt chủng, không
 * phải là "chờ hồi". Đây là điều làm cho quyết định khai thác có sức nặng thật.
 */
export declare function chaySinhThai(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
/** Dùng chung: rút tài nguyên và trả về lượng rút thật (không bao giờ quá số có). */
export declare function rutTaiNguyen(nc: NgocCanhTienTrinh, noiId: string, st: SinhThai, loai: LoaiTaiNguyen, muon: number): {
    patch: PatchOp | null;
    lay: number;
};
export {};
