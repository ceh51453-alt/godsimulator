/**
 * Lorebook như LỰC HẤP DẪN, và Dị Bản — Phần 35.4, 35.5 [BB].
 *
 * ── Câu trung tâm ──
 *
 * [BB] 35.4 mục 3: "Kỳ vọng **không phải kịch bản**. Nó là **điểm hút**. Thế giới
 * hướng về đó, không bị ép tới đó."
 *
 * Vì vậy `kyVongThanhGap()` chỉ sinh một `gap` với `uuTien` nhân theo `lucHapDan`
 * — và gap thì đi qua bộ giải ràng buộc (15.2), nơi nó **vẫn phải tuân mọi ràng
 * buộc khác đang đúng**. Không có hàm nào ở đây ghi thẳng một entity vào thế giới.
 *
 * ── Và câu quan trọng hơn ──
 *
 * [BB] 35.5: khi hành động của người chơi làm một kỳ vọng không còn khả thi,
 * engine **không** ép nó xảy ra và **không** im lặng bỏ qua. Nó ghi lại thành
 * **Dị Bản** — bốn thứ bắt buộc: kỳ vọng gốc, thực tế, nguyên nhân truy được, và
 * một dòng biên niên bằng giọng kể chuyện.
 */
import type { WorldState } from '../engine/state.js';
import type { Gap } from '../schema/entity.js';
import type { DiBan, Lorebook, LoreExpectation, LorebookEntry, TrangThaiKyVong } from './schema.js';
/**
 * Trích kỳ vọng từ một lorebook khi nó được BẬT — 35.4.
 *
 * `doUuTien` nhân theo `lucHapDan`: thanh trượt 0 nghĩa là lorebook chỉ làm ngữ
 * cảnh, và ở đó hàm này trả về kỳ vọng có ưu tiên 0 — tồn tại để hiện trên Bản Đồ
 * Dị Biệt, nhưng không kéo thế giới đi đâu cả.
 */
export declare function trichKyVong(lorebook: Lorebook, branchId: string): LoreExpectation[];
export type SoTheoDoi = {
    /** Entity từng thỏa kỳ vọng — cần để phân biệt `da_lech` với `bat_kha`. */
    readonly thoaBoi: ReadonlyMap<string, string>;
};
export type KetQuaDanhGia = {
    readonly kyVong: readonly LoreExpectation[];
    readonly diBanMoi: readonly DiBan[];
    readonly gapMoi: readonly Gap[];
    readonly thoaBoi: ReadonlyMap<string, string>;
};
/** Entity nào đang thỏa điều kiện; `null` nghĩa là chưa ai. */
export declare function aiThoa(dk: LoreExpectation['dieuKien'], s: WorldState): string | null;
/**
 * Cập nhật trạng thái mọi kỳ vọng và sinh Dị Bản cho những cái vừa thành bất khả.
 *
 * Ba chuyển trạng thái, và chỉ ba:
 * - `cho`/`da_lech` → `da_thoa` khi có kẻ thỏa;
 * - `da_thoa` → `da_lech` khi không còn ai thỏa nhưng kẻ cũ vẫn còn sống;
 * - bất kỳ → `bat_kha` khi kẻ từng thỏa đã **chết hoặc bị thu hồi**.
 *
 * Phân biệt hai cái cuối là toàn bộ giá trị của 35.5: "đã lệch" là thế giới đi
 * chệch và còn quay lại được; "bất khả" là cánh cửa đã đóng, và engine phải sinh
 * một gap để ai đó khác lấp chỗ trống.
 */
export declare function capNhatKyVong(input: {
    readonly kyVong: readonly LoreExpectation[];
    readonly state: WorldState;
    readonly theoDoi: SoTheoDoi;
    readonly tick: number;
    readonly lucHapDan: number;
    /** Ai vừa làm gì — để `nguyenNhan` của Dị Bản truy được. */
    readonly nguyenNhan?: {
        readonly chuTheId: string | null;
        readonly eventIds: readonly string[];
        readonly moTa: string;
    };
}): KetQuaDanhGia;
export type DongBanDo = {
    readonly kyVong: string;
    readonly theGioiCuaBan: string;
    readonly trangThai: TrangThaiKyVong;
};
export type BanDoDiBiet = {
    readonly dong: readonly DongBanDo[];
    readonly daThoa: number;
    readonly dangCho: number;
    readonly daLech: number;
    readonly batKha: number;
};
/**
 * [BB] 35.6 — "Đây không phải bảng lỗi. Nó là hồ sơ về việc thế giới của người
 * chơi đã trở thành cái gì." Nên không có cột nào tên là `loi`, và giọng của
 * `theGioiCuaBan` là giọng thuật lại, không phải giọng báo hỏng.
 */
export declare function banDoDiBiet(kyVong: readonly LoreExpectation[], diBan: readonly DiBan[], state: WorldState): BanDoDiBiet;
/**
 * Kiểu F của 51.1 — kỳ vọng đã chết mà văn bản gốc vẫn được nạp.
 *
 * Khi một kỳ vọng chuyển `bat_kha`, entry sinh ra nó phải bị che **cùng lúc**.
 * Không làm điều này thì Ra vẫn được nhắc như đương kim chủ tể suốt bốn trăm năm
 * sau khi bị thu hồi.
 */
export declare function entryCanChe(kyVong: readonly LoreExpectation[], entries: readonly LorebookEntry[]): {
    readonly entryId: string;
    readonly kyVongId: string;
    readonly lyDo: string;
}[];
