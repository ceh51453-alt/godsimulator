/**
 * Hội đồng thần — Phần 69.3.
 *
 * Ba việc, và chỉ ba: **kết nạp**, **bỏ phiếu**, **kế vị**. Tất cả là hàm thuần
 * trả về `PatchOp`; không hàm nào tự áp gì cả, vì cửa duy nhất đổi thế giới vẫn
 * là Event (luật bất biến #5).
 *
 * ── Vì sao trọng số phiếu suy từ thế giới, không phải một trường ──
 *
 * Nếu hội đồng có trường `anhHuong` riêng thì nó trôi khỏi mọi thứ khác: một vị
 * thần mất sạch tín đồ vẫn giữ nguyên tiếng nói. Ở đây phiếu nặng bao nhiêu suy
 * ra từ đền, tín đồ và sức domain — nghĩa là muốn có tiếng nói trong thần điện
 * thì phải có chỗ đứng ngoài đời, và mất chỗ đứng thì mất luôn tiếng nói.
 */
import type { WorldState } from '../engine/state.js';
import type { PatchOp } from '../contracts/core.js';
import type { Entity } from '../schema/entity.js';
import type { HoiDong, NghiQuyet, LoaiNghiQuyet } from '../schema/aspect/hoiDong.js';
import type { KetQua } from '../contracts/errors.js';
/** Thần hệ nào có hội đồng — sắp xếp deterministic. */
export declare function moiHoiDong(state: WorldState): {
    id: string;
    e: Entity;
    hd: HoiDong;
}[];
/**
 * Trọng số tiếng nói của một vị thần trong hội đồng.
 *
 * Không chuẩn hóa về 0–1: con số thô so được giữa các vị thần, và đó là tất cả
 * những gì `demPhieu` cần. Chuẩn hóa ở đây chỉ giấu đi khoảng cách thật.
 */
export declare function tiengNoiCua(state: WorldState, thanId: string): number;
export declare function ketNap(state: WorldState, thanHeId: string, thanId: string, nc: {
    eventId: string;
    tick: number;
}): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
export declare function trucXuat(state: WorldState, thanHeId: string, thanId: string, lyDo: string, nc: {
    eventId: string;
    tick: number;
}): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
export declare function moNghiQuyet(state: WorldState, thanHeId: string, nq: {
    id: string;
    loai: LoaiNghiQuyet;
    noiDung: string;
    veThanIds: readonly string[];
}, nc: {
    eventId: string;
    tick: number;
}): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
export declare function boPhieu(state: WorldState, thanHeId: string, nghiQuyetId: string, thanId: string, phieu: 'thuan' | 'chong' | 'trang', nc: {
    eventId: string;
    tick: number;
}): KetQua<{
    patches: readonly PatchOp[];
    ketQua: NghiQuyet['ketQua'];
    loiKe: string;
}>;
export type UngVienKeVi = {
    readonly thanId: string;
    readonly ten: string;
    readonly diem: number;
    readonly vi: string;
};
/**
 * Ai có cửa ngồi ghế đầu, theo luật kế vị của chính thần hệ ấy.
 *
 * Trả về danh sách chứ không trả về một người: kế vị là một tình huống, và tình
 * huống chỉ có nghĩa khi có nhiều hơn một câu trả lời hợp lý.
 */
export declare function ungVienKeVi(state: WorldState, thanHeId: string): readonly UngVienKeVi[];
/**
 * Ghế đầu bỏ trống — mở tình huống kế vị.
 *
 * Gọi khi vị ngồi ghế đầu chết, bị đuổi, hoặc tự rút. KHÔNG tự chọn người mới:
 * ghế trống là nội dung, và lấp nó ngay trong cùng một tick là bỏ phí toàn bộ
 * cái hay của việc một vị thần chết đi.
 */
export declare function boTrongGheDau(state: WorldState, thanHeId: string, nc: {
    eventId: string;
    tick: number;
    lyDo: string;
}): KetQua<{
    patches: readonly PatchOp[];
    ungVien: readonly UngVienKeVi[];
    loiKe: string;
}>;
/** Trao ghế đầu. Chỉ gọi sau khi nghị quyết `cong_nhan_ke_vi` đã thông qua. */
export declare function traoGheDau(state: WorldState, thanHeId: string, thanId: string, nc: {
    eventId: string;
    tick: number;
}): KetQua<{
    patches: readonly PatchOp[];
    loiKe: string;
}>;
