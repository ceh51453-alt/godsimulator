/**
 * Ống Kính — Phần 29 [BB].
 *
 * ── Câu quyết định cả file ──
 *
 * 29.1: "Cột tường thuật ở giữa màn hình KHÔNG PHẢI cuộc chat của bạn. Nó là
 * biên niên sử đang được kể, và ống kính có thể chĩa vào bất kỳ mạch truyện nào."
 *
 * Hệ quả kỹ thuật, và nó không nhỏ: chọn chỗ chiếu là một hàm THUẦN của thế giới
 * và của seed, không phải một hàm của việc người chơi vừa gõ gì. Nếu nó phụ
 * thuộc người chơi thì 28.6 không bao giờ đạt, và toàn bộ Phần 29 thành trang trí.
 *
 * [BB] 29.1 — chuyển ống kính KHÔNG tốn lượt, KHÔNG tốn thời gian trong game.
 * Vì vậy hàm ở đây không sinh Event và không đụng `world.tick`.
 *
 * [BB] 29.3 — nhân vật người chơi có `vaiTro` trong `Storyline` GIỐNG MỌI ENTITY
 * KHÁC. Không có trường đặc biệt, không có trọng số ưu ái. Ở đây điều đó được
 * cưỡng chế bằng việc `chonMucTieu()` không hề nhận `nguoiChoiId`.
 */
import type { WorldState } from '../engine/state.js';
import type { Rng } from '../engine/rng.js';
import type { Lens, MucTieuOngKinh } from '../schema/truyen.js';
export type TrangThaiOngKinh = {
    readonly lens: Lens;
    /** Tick mà mục tiêu hiện tại được chọn — dùng cho `giuToiThieuTick`. */
    readonly tickDoiCuoi: number;
    /** Mục tiêu đang thật sự chiếu, sau khi `tu_dong` đã được giải. */
    readonly dangChieu: MucTieuOngKinh;
};
export declare function ongKinhMoi(tick?: number): TrangThaiOngKinh;
export type ChonOngKinh = {
    readonly mucTieu: MucTieuOngKinh;
    readonly machId: string | null;
    readonly vi: string;
    readonly daDoi: boolean;
};
/**
 * Chế độ `tu_dong`: engine chọn mạch có `cangThang` cao nhất TRONG SỐ MẠCH NGƯỜI
 * CHƠI BIẾT, trộn ngẫu nhiên seeded để không đơn điệu (29.1).
 *
 * `uuTienMachId` đến từ hai nguồn và cả hai đều là cơ chế cứng:
 *   - phục bút quá hạn (30.2) — mạch đang treo nợ tự sự được cộng ưu tiên;
 *   - hạn ngạch vắng mặt trượt (28.6) — kỷ nguyên sau phải ưu tiên mạch xa.
 */
export declare function chonMucTieu(s: WorldState, tt: TrangThaiOngKinh, nc: {
    tick: number;
    rng: Rng;
    uuTienMachId?: readonly string[];
    /** 28.6 trượt → ưu tiên mạch KHÔNG có mặt entity này. */
    tranhEntityId?: string | null;
}): ChonOngKinh;
/** Áp một lựa chọn vào trạng thái ống kính. Không sinh Event — 29.1. */
export declare function apOngKinh(tt: TrangThaiOngKinh, chon: ChonOngKinh, tick: number): TrangThaiOngKinh;
/** Người chơi đặt tay ống kính. Cũng không tốn lượt. */
export declare function datOngKinh(tt: TrangThaiOngKinh, mucTieu: MucTieuOngKinh, tick: number): TrangThaiOngKinh;
/**
 * Entity đang ở trong tiêu điểm của ống kính — đầu vào cho `moRong()` và cho
 * truy vấn Q1 của 54.6.
 */
export declare function tieuDiem(s: WorldState, mucTieu: MucTieuOngKinh, chuTheId: string | null): readonly string[];
/**
 * [BB] 29.2 quy tắc 5 — khi ống kính KHÔNG ở chỗ người chơi thì prompt không
 * được nhắc tới người chơi, kể cả gián tiếp.
 *
 * Hàm này là chỗ duy nhất quyết định điều đó, để `bienSoan` không phải đoán.
 */
export declare function ongKinhOChoNguoiChoi(s: WorldState, mucTieu: MucTieuOngKinh, chuTheId: string | null): boolean;
