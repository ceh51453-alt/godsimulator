/**
 * Sinh kế — Phần 70.2 [BB]: "học, dạy, làm nghề, thất nghiệp, đổi nghề".
 *
 * ── Một quy tắc chi phối cả file ──
 *
 * **Kỹ năng lên từ việc đã làm, không từ một nút bấm.** `soNhipDaLam` là thứ duy
 * nhất sinh ra tiến bộ, và nó chỉ tăng khi có nơi làm, có thân thể làm được, và
 * vùng có việc để làm. Bỏ quy tắc này thì "học nghề" thành một thanh tiến độ, và
 * cổng Phase 7 ("mở một Project nghề nghiệp") thành một cái nút.
 *
 * Hệ quả cố ý: một người gãy tay **không tiến bộ nghề mộc** trong lúc tay chưa
 * lành. Không phải bị phạt — chỉ là không có buổi làm nào để mà giỏi lên.
 *
 * ── Bậc nghề khác kỹ năng ──
 *
 * `kyNang` là mình giỏi tới đâu. `bac` là người ta công nhận tới đâu. Hai cái
 * lệch nhau là chuyện thường, và khoảng lệch ấy chính là động cơ của nửa số
 * mâu thuẫn trong một phường nghề.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { SinhKe } from '../schema/aspect/pham.js';
import type { KetQua } from '../contracts/errors.js';
import type { Rng } from '../engine/rng.js';
export declare function sinhKeCua(e: Entity | undefined): SinhKe | undefined;
export type NgocCanhSinhKe = {
    readonly eventId: string;
    readonly tick: number;
    readonly rng: Rng;
};
/**
 * Kỹ năng của ĐÚNG nghề đang làm, và khóa để ghi lại vào.
 *
 * `mortal.kyNang` là một record tự do, và thế giới đang có hai quy ước: fixture
 * đặt tên theo nghề (`dan_luoi: 62`), còn `vatChatHoa()` của Phase 5 đặt
 * `nghe_chinh`. Đọc cứng một khóa thì một nửa dân số có tay nghề bằng 0 trong
 * khi bậc của họ là "thợ cả" — và không ai thấy, vì cả hai con số đều tồn tại.
 *
 * Nên: đọc theo tên nghề trước, rồi `nghe_chinh`, rồi lấy kỹ năng cao nhất đang
 * có. Ghi thì luôn ghi vào khóa đã đọc, để không sinh thêm một quy ước thứ ba.
 */
export declare function kyNangCuaNghe(m: {
    kyNang: Record<string, number>;
} | undefined, ngheId: string | null): {
    khoa: string;
    giaTri: number;
};
/**
 * Hôm nay có làm được nghề này không, và nếu không thì vì sao.
 *
 * Trả câu tiếng Việt chứ không trả boolean: chỗ gọi nó là Sổ Tay và bộ thu
 * affordance, cả hai đều cần **lý do**, không cần một chữ `false`.
 */
export declare function canTroLamNghe(e: Entity, ngheId: string): string | null;
export type KetQuaLamViec = {
    readonly patches: readonly PatchOp[];
    /** Sản lượng thật của nhịp này — vào kho hộ, không vào một cái ví vô hình. */
    readonly sanLuong: number;
    readonly lyDoNghi: string | null;
    readonly lenBac: string | null;
};
/**
 * Làm một nhịp. Trả patch cho người làm; kho hộ do `ho.ts` cộng vào.
 *
 * Sản lượng phụ thuộc **kỹ năng của người** và **kỹ thuật của vùng**, không phụ
 * thuộc một hằng số. Một thợ giỏi ở vùng lạc hậu vẫn làm ra ít hơn thợ trung
 * bình ở vùng có nghề — đó là điều đúng, và nó làm việc di cư có nghĩa.
 */
export declare function lamMotNhip(state: WorldState, e: Entity, nc: NgocCanhSinhKe, soBuocGop?: number): KetQuaLamViec;
/**
 * Xin học một người.
 *
 * [BB] Học nghề là một QUAN HỆ hai chiều: thầy phải nhận, và thầy có lý do để
 * từ chối. Một hàm `hocNghe(id)` luôn thành công sẽ biến phường nghề thành một
 * cái menu.
 */
export declare function xinHoc(state: WorldState, troId: string, thayId: string, nc: NgocCanhSinhKe): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
/**
 * Đổi nghề. Kỹ năng cũ KHÔNG mất, nhưng nó không dùng được cho nghề mới.
 *
 * Đây là lý do `ngheDaTung` tồn tại: quay lại nghề cũ sau mười năm phải nhanh hơn
 * học từ đầu, và người ta phải nhớ rằng bạn từng làm nghề ấy.
 */
export declare function doiNghe(state: WorldState, nguoiId: string, ngheMoi: string, noiLamId: string | null, nc: NgocCanhSinhKe): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
/**
 * Truyền nghề — [BB] 70.2, và là một trong hai cách rõ nhất để "một đời bình
 * thường vẫn để lại di sản" (cổng Phase 7).
 *
 * Không phải phép cộng kỹ năng: nó **kết thúc** quan hệ thầy trò và ghi vào
 * tiếng tăm của cả hai. Học trò tự đi tiếp bằng `soNhipDaLam` của chính mình.
 */
export declare function truyenNghe(state: WorldState, thayId: string, troId: string, nc: NgocCanhSinhKe): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
