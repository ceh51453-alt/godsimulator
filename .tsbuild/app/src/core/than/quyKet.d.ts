/**
 * Tranh đoạt domain bằng quy kết — Phần 19.2 [BB].
 *
 * > "Hệ chiến đấu của tầng Thần. Không HP, không sát thương."
 *
 * Một sự kiện lớn xảy ra. Vài vị thần cùng tuyên là mình làm. Rồi **phàm nhân
 * quyết định tin ai** — và niềm tin đó mới là thứ đổi `suc`.
 *
 * [BB] Dòng thứ ba của công thức là chỗ Dị Hóa nối vào: xác suất quy kết phụ
 * thuộc `banTinhTinDoTin` — tức **danh tiếng**, không phải bản chất. Vị thần bị
 * tin là tàn nhẫn sẽ dễ giành domain bạo lực và khó giữ domain hiền lành. Đây là
 * vòng phản hồi quan trọng nhất của tầng Thần: bạn thắng được đúng những thứ
 * hợp với hình ảnh mà bạn đang bị nhốt vào.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Rng } from '../engine/rng.js';
import type { Tuning } from '../tuning/schema.js';
/** Một sự kiện đủ lớn để có người muốn nhận công. */
export type SuKienLon = {
    readonly id: string;
    readonly moTa: string;
    readonly locationId: string | null;
    /** Nhãn domain mà sự kiện chạm tới: `['bao','bien','chien_tranh']`. */
    readonly domainTags: readonly string[];
    /**
     * Sắc thái của sự kiện trên các trục bản tính.
     * Một trận bão nhấn chìm hạm đội có `tuBi_tanNhan` dương cao.
     */
    readonly sacThai: Readonly<Record<string, number>>;
};
/** Một lời tuyên. `cuongDo` là mức vị thần chịu để dấu ấn mình hiện rõ. */
export type LoiTuyen = {
    readonly thanId: string;
    readonly domainTen: string;
    readonly cuongDo: number;
};
export type KetQuaQuyKet = {
    readonly patches: readonly PatchOp[];
    readonly thangId: string | null;
    readonly diem: readonly {
        thanId: string;
        xacSuat: number;
    }[];
    readonly loiKe: string;
    /** Domain vừa đổi trạng thái, để bản tin kể lại. */
    readonly doiTrangThai: readonly {
        thanId: string;
        domain: string;
        tu: string;
        den: string;
    }[];
};
/**
 * Độ khớp giữa sắc thái sự kiện và bản tính mà TÍN ĐỒ TIN.
 * Trả 0–1. Đây là chỗ danh tiếng quyết định bạn thắng được cái gì.
 */
export declare function doKhopTinhCach(sacThai: Readonly<Record<string, number>>, banTinhTinDoTin: Readonly<Record<string, number>>): number;
/**
 * Giải một lượt tranh quy kết.
 *
 * Bốn hệ số lấy từ `tuning.than` — [BB] Phần 7.1, không hằng số nào nằm trong code.
 */
export declare function giaiQuyKet(state: WorldState, suKien: SuKienLon, tuyen: readonly LoiTuyen[], ctx: {
    eventId: string;
    tick: number;
    tuning: Tuning;
    rng: Rng;
}): KetQuaQuyKet;
/**
 * Rà lại vòng đời domain của một vị thần.
 *
 * [BB] 69.4 — `suc = 0` KHÔNG còn đồng nghĩa mất vĩnh viễn. Chỉ khi mọi neo
 * (vật mang, ký ức, link, luật tiếp địa, nghi thức, di sản) đều đứt thì domain
 * mới `lost`. Còn một neo thì nó là `reclaimable`, và lấy lại phải là một
 * Project có điều kiện chứ không phải một nút cộng điểm.
 */
export declare function raSoatDomain(state: WorldState, thanId: string, ctx: {
    eventId: string;
    tick: number;
}): {
    patches: PatchOp[];
    doi: {
        domain: string;
        tu: string;
        den: string;
    }[];
};
