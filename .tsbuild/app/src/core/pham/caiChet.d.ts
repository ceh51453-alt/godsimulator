/**
 * Cái chết và ba đường sau nó — Phần 20.3 [BB].
 *
 * > "Chết không Game Over."
 *
 * | Đường | Điều kiện | Kết quả |
 * |---|---|---|
 * | Kế thừa | có con cháu hoặc đệ tử | chơi tiếp bằng người đó |
 * | Chứng kiến | luôn có | chuyển sang một NPC từng biết người chết |
 * | Anh Linh Hóa Thần | `duocNhoBoi` vượt ngưỡng | **lên tầng Thần** |
 *
 * ── Vì sao đường thứ ba là lý do kiến trúc Entity–Aspect tồn tại ──
 *
 * Hóa thần KHÔNG tạo entity mới. Nó **thêm** aspect `domain` và `venerable` vào
 * đúng cái entity đã sống cả đời làm người, giữ nguyên `soul`, `genealogical`,
 * mọi quan hệ và mọi ký ức. Người bạn thân năm xưa vẫn là người bạn thân năm
 * xưa — chỉ có điều ba đời sau, con cháu họ thờ một huyền thoại mang tên bạn.
 *
 * Nếu kiến trúc là "class Mortal / class Deity" thì đoạn trên là một cuộc di
 * trú dữ liệu. Ở đây nó là hai patch.
 *
 * [BB] `laHuyenThoai` được bật dần theo thế hệ, không bật ngay: người còn sống
 * từng biết bạn thì vẫn nhớ bạn là người.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { KetQua } from '../contracts/errors.js';
export type NgocCanhChet = {
    readonly eventId: string;
    readonly tick: number;
};
/** Ngưỡng `duocNhoBoi` để cửa Anh Linh mở ra. Cao có chủ ý: nó là phần thưởng. */
export declare const NGUONG_ANH_LINH = 60;
export type KetQuaChet = {
    readonly patches: readonly PatchOp[];
    readonly chuoiNguyenNhan: readonly string[];
    readonly nguoiThuaKe: readonly string[];
    readonly loiKe: string;
};
/**
 * Một người chết.
 *
 * Bốn việc, và không việc nào được bỏ:
 *   1. đánh dấu `tickDiet` và ghi **chuỗi** nguyên nhân (70.5);
 *   2. chuyển thừa kế qua `Claim` (20.3);
 *   3. rời hộ, và giải thể hộ nếu không còn ai;
 *   4. ghi vào ký ức của những người từng quen — đây là chỗ "một đời bình
 *      thường vẫn để lại dấu vết" trở thành dữ liệu chứ không phải một câu.
 */
export declare function chet(state: WorldState, nguoiId: string, nc: NgocCanhChet, themNguyenNhan?: readonly string[]): KetQua<KetQuaChet>;
export declare const DUONG_SAU_CHET: readonly ["ke_thua", "chung_kien", "anh_linh"];
export type DuongSauChet = (typeof DUONG_SAU_CHET)[number];
export type LuaChonTiepTuc = {
    readonly duong: DuongSauChet;
    readonly chuTheMoiId: string;
    readonly ten: string;
    /** Câu giải thích, hiện thẳng lên UI. */
    readonly vi: string;
};
/**
 * Ba đường mở ra sau khi người chơi chết.
 *
 * Luôn trả ít nhất một lựa chọn nếu thế giới còn người: **chứng kiến** không có
 * điều kiện. Trả rỗng chỉ khi thế giới thật sự không còn ai — và lúc ấy đó không
 * phải Game Over, đó là kết cục.
 */
export declare function duongDiTiep(state: WorldState, nguoiChetId: string): readonly LuaChonTiepTuc[];
/**
 * Anh Linh Hóa Thần — [BB] 20.3.
 *
 * **Thêm** aspect vào entity đang có. Không tạo entity mới, không copy gì cả.
 * `tickDiet` được gỡ bỏ: vị thần này không sống lại, nhưng cũng không còn nằm
 * trong danh sách người chết — họ đã đổi hạng tồn tại.
 */
export declare function anhLinhHoaThan(state: WorldState, nguoiId: string, nc: NgocCanhChet): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
/**
 * Một thế hệ trôi qua trên ký ức về người đã khuất — [BB] 20.3.
 *
 * Ai còn sống mà từng quen thì vẫn nhớ đúng người. Ai sinh sau thì chỉ có huyền
 * thoại. Hàm này bật `laHuyenThoai` cho những người **không** từng gặp, nên nó
 * phải chạy theo nhịp thế hệ chứ không mỗi tick.
 */
export declare function huyenThoaiHoa(state: WorldState, nguoiChetId: string, nc: NgocCanhChet): readonly PatchOp[];
