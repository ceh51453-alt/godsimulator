/**
 * Phép chiếu hồ sơ riêng tư → persona công khai — Phần 78.11 [BB].
 *
 * Đây là CỬA DUY NHẤT giữa PlayerProfile/CreatorIdentity và mọi thứ hướng ra ngoài:
 * prompt, preset macro `{{user}}`, personaDescription.
 *
 * [BB] Hàm này KHÔNG được nhận cả object rồi lọc bằng delete — nó dựng đối tượng mới
 * từ danh sách trắng, nên trường mới thêm vào Profile sẽ KHÔNG tự lọt ra.
 */
import type { ViewMode } from '../contracts/primitives.js';
import type { CreatorIdentity, PlayerProfile, ProjectedPlayerPersona } from '../schema/player.js';
export type NguonChieu = {
    profile: PlayerProfile | null;
    creator: CreatorIdentity | null;
    mode: ViewMode;
    currentEntityId: string | null;
    /** Tên hiển thị của entity đang nhập, nếu có — đã qua WorldView. */
    entityLabel?: string | null;
};
/**
 * [BB] Danh sách trắng. Không spread, không delete.
 * Trường không có tên ở đây thì không có đường ra.
 */
export declare function chieuPersona(nguon: NguonChieu): ProjectedPlayerPersona;
/**
 * Phần CreatorIdentity được phép thành canon.
 * Dùng khi sinh Event công bố danh tính — [BB] phải có diff + xác nhận trước.
 */
export type DanhTinhCongBo = {
    title: string | null;
    aliases: readonly string[];
    manifestation: string | null;
    values: readonly string[];
    knownRegionIds: readonly string[];
};
export declare function phanCongBo(creator: CreatorIdentity | null): DanhTinhCongBo;
/**
 * Diff riêng tư / canon cho bước xác nhận cuối của Khởi Nguyên (78.5).
 * Trả ba danh sách để UI hiện: "chỉ mình bạn thấy | gửi Narrator | thành canon".
 */
export type DiffCongBo = {
    riengTu: readonly string[];
    guiNarrator: readonly string[];
    thanhCanon: readonly string[];
};
export declare function diffCongBo(nguon: NguonChieu): DiffCongBo;
