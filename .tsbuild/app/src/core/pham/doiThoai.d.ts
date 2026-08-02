/**
 * Đối thoại — Phần 70.4 [BB]: "Đối thoại cũng là hành động".
 *
 * ── Câu quyết định của cả file ──
 *
 * > "Narrator không được tạo cuộc đối thoại không sinh Event khi lời nói là lời
 * > hứa, đe dọa, thú nhận, giao kèo, tin mới hoặc mệnh lệnh có hậu quả."
 *
 * Nghĩa là đối thoại **không thể** chỉ là văn. Sáu loại phát ngôn ở trên phải để
 * lại dấu trong thế giới, và dấu ấy là `Event` + `KnowledgeRecord` + quan hệ đổi.
 * Nếu không, người chơi hứa xong rồi quên, NPC nghe xong rồi không nhớ, và mọi
 * cuộc nói chuyện đều miễn phí.
 *
 * ── Sáu trường của một phát ngôn ──
 *
 * 70.4 liệt kê tám thứ. Bốn cái quan trọng nhất và dễ bỏ sót nhất:
 *
 *   dieuNguoiNoiTin     điều người nói TIN là thật
 *   dieuMuonNguoiNgheTin điều họ muốn người kia tin
 *   → hai cái này khác nhau chính là **nói dối**, và nói dối phải là dữ liệu
 *     chứ không phải một cái cờ `laNoiDoi: true`.
 *   mucHieu             người nghe hiểu tới đâu (ngôn ngữ, chuyên môn, tuổi)
 *   coTheBiNgheLen      ai đứng gần — bí mật rò ra ở đây, không do Narrator quyết
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { KetQua } from '../contracts/errors.js';
import type { Rng } from '../engine/rng.js';
/**
 * Sáu loại phát ngôn CÓ HẬU QUẢ của 70.4. Danh sách này đóng: mở rộng nó là mở
 * rộng thứ engine phải ghi sổ, và điều đó cần một quyết định, không cần một dòng.
 */
export declare const LOAI_PHAT_NGON: readonly ["loi_hua", "de_doa", "thu_nhan", "giao_keo", "tin_moi", "menh_lenh"];
export type LoaiPhatNgon = (typeof LOAI_PHAT_NGON)[number];
export declare const NHAN_PHAT_NGON: Readonly<Record<LoaiPhatNgon, string>>;
export type PhatNgon = {
    readonly nguoiNoiId: string;
    readonly nguoiNgheId: string;
    readonly loai: LoaiPhatNgon;
    readonly noiDung: string;
    /** Điều người nói tin là thật. */
    readonly dieuNguoiNoiTin: string;
    /** Điều họ muốn người nghe tin. Khác dòng trên nghĩa là đang nói dối. */
    readonly dieuMuonNguoiNgheTin: string;
    /** Nơi nói — quyết định ai nghe lỏm được. */
    readonly noiId: string | null;
};
export type NgocCanhDoiThoai = {
    readonly eventId: string;
    readonly tick: number;
    readonly rng: Rng;
};
/**
 * Người nghe hiểu tới đâu.
 *
 * Ba nguồn: cùng vùng (cùng tiếng nói), tuổi (trẻ con không hiểu giao kèo), và
 * chuyên môn (`kyNang` của nghề liên quan). Không có "mức hiểu" mặc định 100% —
 * đó là cách hiểu lầm biến mất khỏi trò chơi.
 */
export declare function mucHieu(state: WorldState, phatNgon: PhatNgon): number;
/**
 * Ai nghe lỏm được — [BB] 70.4 "rủi ro bị nghe lén".
 *
 * Suy từ **ai đang ở cùng chỗ**, không từ một tung xúc xắc "bị lộ hay không".
 * Nói bí mật giữa chợ thì lộ, và người chơi biết trước điều đó vì họ chọn chỗ.
 */
export declare function nguoiNgheLon(state: WorldState, phatNgon: PhatNgon): readonly string[];
export type KetQuaNoi = {
    readonly patches: readonly PatchOp[];
    readonly factId: string;
    readonly mucHieu: number;
    readonly nguoiNgheLon: readonly string[];
    readonly laNoiDoi: boolean;
    readonly loiKe: string;
};
/**
 * Nói một câu có hậu quả.
 *
 * Ba thứ sinh ra, mỗi thứ đúng một lần:
 *
 *   1. `KnowledgeRow` cho người nghe — với `hops = 1` và nguồn là người nói,
 *      nên bất biến "không tri thức teleport" (71.4) truy được ngược.
 *   2. Quan hệ đổi, ghi bằng `anTuong` (câu chữ) chứ không chỉ bằng bốn trục —
 *      đó là thứ Sổ Tay đọc ra (56.2 quy tắc 4).
 *   3. Với `loi_hua` và `giao_keo`: một `Obligation` trên người hứa. Hứa xong
 *      quên là chuyện của người, không phải chuyện của engine.
 */
export declare function noi(state: WorldState, pn: PhatNgon, nc: NgocCanhDoiThoai): KetQua<KetQuaNoi>;
/**
 * Giữ hay phá một lời hứa.
 *
 * Phá lời hứa KHÔNG xóa nghĩa vụ — nó đổi `status` thành `broken` và để lại đó.
 * Đây là cùng một lẽ với "link không xóa cứng, để lại sẹo" (6.3 quy tắc 4): thứ
 * người ta nhớ về bạn là những lời bạn đã không giữ.
 */
export declare function xuLyLoiHua(state: WorldState, nguoiHuaId: string, boiVuId: string, giu: boolean, nc: NgocCanhDoiThoai): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
