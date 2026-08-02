/**
 * Dị Hóa — Phần 12.2 và 69.1 [BB].
 *
 * ── Vì sao file này không làm đúng chữ của 12.2 ──
 *
 * 12.2 viết công thức kéo `soul.banTinh` về phía `venerable.banTinhTinDoTin`.
 * Cài đúng như thế thì mỗi kỷ nguyên tick sẽ lặng lẽ sửa tính cách nhân vật của
 * người chơi. 69.1 sửa lại và nói thẳng: **"Không tick nào tự sửa tính cách lõi
 * mà không có Event giải thích."**
 *
 * Nên ở đây:
 *
 *   tick  →  đo khoảng cách, đẩy `followerImage`, MỞ MỘT TÌNH HUỐNG
 *   người chơi (hoặc utility AI của thần NPC)  →  chọn một trong bốn cách đáp
 *   lựa chọn  →  Event  →  chỉ khi đó `coreSelf` mới đổi
 *
 * Bi kịch của 12.2 vẫn còn nguyên — bạn vẫn trở thành thứ người ta tưởng bạn là.
 * Khác ở chỗ bạn phải **đồng ý từng bước một**, và mỗi bước có tên trong sổ.
 */
import type { PatchOp } from '../contracts/core.js';
import type { Entity } from '../schema/entity.js';
import type { Rng } from '../engine/rng.js';
import type { Tuning } from '../tuning/schema.js';
import { BAN_TINH_TRUC } from '../schema/aspect/soul.js';
import type { BanTinh } from '../schema/aspect/soul.js';
import { EVENT_DUOC_SUA_CORESELF } from '../schema/aspect/thanVi.js';
import type { DivineIdentity, CachDapDiHoa } from '../schema/aspect/thanVi.js';
import type { Venerable } from '../schema/aspect/divine.js';
export type TrucBanTinh = (typeof BAN_TINH_TRUC)[number];
/** Nhãn tiếng Việt của từng trục, dùng cho mô tả tình huống và cho UI. */
export declare const NHAN_TRUC: Readonly<Record<TrucBanTinh, [string, string]>>;
/** Tên của một cực trên trục, theo dấu của giá trị. */
export declare function tenCuc(truc: TrucBanTinh, giaTri: number): string;
/** Dựng bản ngã ban đầu từ `soul` và `venerable` đã có — dùng khi gieo và khi migrate. */
export declare function banNgaTu(banTinh: BanTinh, ven: Venerable | undefined): DivineIdentity;
export type ApLucDiHoa = {
    readonly distortion: number;
    readonly suppressedTraits: readonly TrucBanTinh[];
    readonly demandedTraits: readonly TrucBanTinh[];
    /** Trục lệch nặng nhất — chỗ tình huống mới sẽ mở ra. */
    readonly trucNang: TrucBanTinh | null;
    readonly lech: number;
};
/**
 * Đo khoảng cách giữa lõi và hình ảnh tín đồ.
 *
 * `suppressed` là nét vị thần CÓ mà tín đồ không cho phép; `demanded` là nét tín
 * đồ ĐÒI mà vị thần không có. Hai danh sách này là thứ UI hiện ra ở hai dòng
 * cuối của Bảng Lãnh Địa (56.4), và là thứ làm người chơi thấy mình đang bị nặn.
 */
export declare function doApLuc(bn: DivineIdentity, nguong?: number): ApLucDiHoa;
/**
 * Hình ảnh tín đồ trôi theo những gì họ ĐƯỢC QUY KẾT là do vị thần làm.
 *
 * Không trôi theo hành động thật của vị thần — trôi theo hành động mà người ta
 * *tin* là của vị thần. Đó là lý do một vị thần không làm gì cả vẫn có thể bị
 * biến thành thần chiến tranh.
 */
export declare function troiHinhAnh(anhHienTai: BanTinh, sacThaiSuKien: Readonly<Record<string, number>>, toc: number): BanTinh;
/** Mô tả một tình huống Dị Hóa bằng tiếng Việt kể được. */
export declare function moTaTinhHuong(tenThan: string, truc: TrucBanTinh, lech: number): string;
export type KetQuaDap = {
    readonly patches: readonly PatchOp[];
    readonly loaiEvent: (typeof EVENT_DUOC_SUA_CORESELF)[number];
    readonly loiKe: string;
    /** Hệ quả trong thế giới, để tick sau xử lý tiếp. */
    readonly heQua: {
        readonly lyGiao: boolean;
        readonly matQuyKet: number;
        readonly sinhPhanThan: boolean;
    };
};
/**
 * Áp một cách đáp lên vị thần.
 *
 * [BB] Đây là hàm DUY NHẤT trong toàn bộ Phase 6 được phép sinh patch chạm
 * `ban_nga.coreSelf`, và nó luôn ghi kèm một dòng vào `lichSuLoi` có `eventId`.
 * Bất biến `coreself_co_giai_thich` kiểm rằng hai thứ đó luôn đi cùng nhau.
 */
export declare function dapDiHoa(than: Entity, bn: DivineIdentity, truc: TrucBanTinh, cach: CachDapDiHoa, ctx: {
    eventId: string;
    tick: number;
    tuning: Tuning;
    rng: Rng;
}): KetQuaDap;
/**
 * Utility AI của thần NPC chọn cách đáp.
 *
 * [BB] 23.2 quy tắc 2 — không chọn điểm cao nhất, mà softmax. Thần luôn tối ưu
 * là thần chết. Thần thỉnh thoảng làm điều dại là thần sống.
 */
export declare function chonCachDap(bn: DivineIdentity, rng: Rng, nhietDo: number): CachDapDiHoa;
