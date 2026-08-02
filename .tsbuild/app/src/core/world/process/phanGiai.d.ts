/**
 * Ba độ phân giải và phép vật chất hóa macro → micro — Phần 71.3 [BB].
 *
 * | Vị trí | Cách chạy |
 * |---|---|
 * | Trên sân khấu | micro: entity và vật cụ thể |
 * | Gần ống kính | meso: household, nơi chốn, nhóm |
 * | Xa ống kính | macro: cohort và flow bảo toàn |
 *
 * [BB] Chuyển macro → micro phải bảo toàn: dân số, vật chất chính, quyền sở hữu,
 * event lớn, phân bố nghề/tuổi/sức khỏe, lịch sử đã biết.
 *
 * > "Không materialize một gia đình giàu trong vùng đói mà không có nguồn."
 *
 * Đây là điều khiến người chơi tin vào NPC vừa bước vào cảnh: người đó không
 * được sinh ra lúc bạn nhìn, mà được **rút ra** từ một quần thể đã sống sẵn —
 * kèm theo đúng cái nghèo, đúng cái bệnh và đúng những điều mà vùng đó biết.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { WorldState } from '../../engine/state.js';
import type { PhanGiaiChay } from './types.js';
import type { Cohort } from './tienIch.js';
/**
 * Độ phân giải theo khoảng cách tới ống kính.
 *
 * `nearbyResolutionRadius` của tuning là bán kính "gần ống kính" tính bằng số
 * chặng đường, không phải bằng khoảng cách hình học: một vùng cách hai ngọn núi
 * nhưng không có đường tới thì xa, dù trên bản đồ nó nằm sát bên.
 */
export declare function phanGiaiTheoOngKinh(soChang: number | null, banKinhGan: number): PhanGiaiChay;
export type YeuCauVatChatHoa = {
    readonly noiId: string;
    readonly soNguoi: number;
    readonly eventId: string;
    /** Nhóm tuổi muốn lấy; bỏ trống thì rút theo đúng tháp tuổi của vùng. */
    readonly band?: keyof Cohort;
    readonly tienTo?: string;
};
export type KetQuaVatChatHoa = {
    readonly patches: readonly PatchOp[];
    readonly entityIds: readonly string[];
    readonly lyDoTuChoi: string | null;
};
/**
 * Rút `soNguoi` người thật khỏi cohort của một vùng.
 *
 * [BB] Tổng dân số KHÔNG đổi: cohort giảm đúng bằng số entity được tạo, và
 * `spatial.danSo` giữ nguyên vì người được đặt tên vẫn là người của vùng đó.
 *
 * Tài sản và sức khỏe của họ **lấy từ vùng**, không phát sinh:
 *   - kỹ năng theo `kinh_te.kyThuat` của vùng;
 *   - có bệnh hay không theo `y_te.tyLeMac`;
 *   - thể lực theo `kinh_te.thieuHut`;
 *   - điều họ biết là **đúng tập tri thức mà vùng đang giữ**, không hơn một điều.
 */
export declare function vatChatHoa(state: WorldState, yc: YeuCauVatChatHoa): KetQuaVatChatHoa;
