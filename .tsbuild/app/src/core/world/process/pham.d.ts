import type { KetQuaTienTrinh, NgocCanhTienTrinh } from './types.js';
/**
 * Một nhịp của những người có tên.
 *
 * Bốn việc, đúng thứ tự của một ngày: làm → mệt/lành → đói → chết.
 * Thứ tự này quan trọng: đảo "đói" lên trước "làm" thì một người đói sẽ không
 * bao giờ làm ra được cái ăn, và cả làng chết trong ba mùa.
 */
export declare function chayDoiNguoi(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
/**
 * Vòng đời hộ.
 *
 * Ba việc: ăn, tách, tan. Không có "cưới" ở đây — cưới là một hành động của
 * người, đi qua Intent, không phải một sự kiện dân số học. Engine chỉ lo phần
 * mà không ai quyết định: cái đói, con cái lớn lên, và cái nhà không còn ai.
 */
export declare function chayVongDoiHo(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
/** Chỉ để test đọc được cùng một trần với tiến trình. */
export declare function tranXuLy(nc: NgocCanhTienTrinh): number;
/** Hộ của một người, đọc nhanh — dùng ở `soTay` và UI. */
export declare function khoCuaHo(nc: NgocCanhTienTrinh, hoId: string): number;
