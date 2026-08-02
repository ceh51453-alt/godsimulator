import type { KetQuaTienTrinh, NgocCanhTienTrinh } from './types.js';
/** Trần an toàn: một tiến trình lấy tối đa ngần này của một nhóm mỗi lần chạy. */
export declare const TRAN_LAY_MOT_LAN = 0.5;
/** Một người ăn ngần này lương thực mỗi mùa. */
export declare const KHAU_PHAN = 0.55;
export declare function chayDanSo(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
export declare function chaySucKhoe(nc: NgocCanhTienTrinh): KetQuaTienTrinh;
