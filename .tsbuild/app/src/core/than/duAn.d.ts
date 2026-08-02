/**
 * Project của thần NPC — Phần 69.3 [BB].
 *
 * ── Điều Phase 6 để lại ──
 *
 * Cổng Phase 6 đòi "thần NPC tiếp tục sống khi vắng", và điều đó đã đạt: `divine_agency`
 * cho họ đáp Dị Hóa, trả lời cầu và giữ domain. Nhưng 69.3 đòi thêm một chữ khác:
 * thần NPC phải **theo đuổi**. Softmax trên năm phương án cố định cho ra một vị
 * thần *phản ứng* rất tốt và không bao giờ *muốn* gì quá một tick.
 *
 * Chênh lệch ấy nhìn thấy được trong lúc chơi: quay lại sau năm mươi năm, vị thần
 * hàng xóm vẫn đúng chỗ ấy, vẫn ngần ấy đền, và không có chuyện gì để kể về họ.
 *
 * File này đóng khoảng cách đó bằng đúng cơ chế người chơi dùng — `Project` của
 * 68.3 — chứ không bằng một hệ thống riêng cho NPC. Một Project của thần có:
 * mục tiêu, chặng, điều kiện đo được từ thế giới, và `nextTick`. Nó tiến khi thế
 * giới hợp tác, và **vướng** khi không.
 *
 * [BB] 68.3 — không ai được tự đặt `progress = 1`. Tiến độ ở đây suy từ trạng
 * thái thế giới mỗi lần rà, nên một Project không thể hoàn thành bằng cách khai.
 */
import type { WorldState } from '../engine/state.js';
import type { Project } from '../intent/schema.js';
/**
 * Sáu loại việc dài hơi mà một vị thần thật sự có lý do để làm.
 *
 * Chọn sáu chứ không sáu mươi: mỗi loại phải đo được bằng dữ liệu đã có trong
 * thế giới, nếu không thì tiến độ sẽ phải do ai đó khai — và đó chính là thứ
 * 68.3 cấm.
 */
export declare const LOAI_DU_AN_THAN: readonly ["mo_rong_tin_nguong", "lam_diu_mot_vung", "gianh_lai_domain", "dung_giao_ly", "ket_giao_than_khac", "tim_lai_chinh_minh"];
export type LoaiDuAnThan = (typeof LOAI_DU_AN_THAN)[number];
export type UngVienDuAn = {
    readonly loai: LoaiDuAnThan;
    readonly goal: string;
    /** Điểm mong muốn — utility AI softmax trên tập này (23.2 quy tắc 2). */
    readonly diem: number;
    readonly locationIds: readonly string[];
    readonly stakeholderIds: readonly string[];
    readonly milestones: readonly {
        id: string;
        description: string;
    }[];
};
/**
 * Việc vị thần này có lý do để bắt đầu, kèm điểm mong muốn.
 *
 * Điểm suy từ hoàn cảnh thật: một vị thần không có tín đồ muốn mở rộng tín ngưỡng;
 * một vị thần có vùng đang đói muốn làm dịu nó; một vị thần vừa mất domain muốn
 * giành lại. Không có bảng ưu tiên cố định nào, vì thế thần khác hoàn cảnh sẽ
 * theo đuổi việc khác — và đó là toàn bộ điểm.
 */
export declare function ungVienDuAn(state: WorldState, thanId: string): readonly UngVienDuAn[];
/**
 * Loại của một Project, đọc từ id.
 *
 * Bản đầu tách `pj.id.split('_')[3]`, và nó **sai với mọi thần có gạch dưới
 * trong id**: `pj_than_deity_1_mo_rong_tin_nguong_0` cho ra `'1'`, không khớp
 * loại nào, nên tiến độ đứng ở 0 vĩnh viễn. Không ai thấy vì bài test phủ nó
 * thoát sớm khi không tìm được ứng viên — hai lỗi che nhau.
 *
 * Khớp theo tên loại có ranh giới `_…_` thì id chứa bao nhiêu gạch dưới cũng đúng.
 */
export declare function loaiCuaDuAnThan(id: string): LoaiDuAnThan | null;
/** Dựng `Project` từ một ứng viên đã được utility AI chọn. */
export declare function moDuAnThan(state: WorldState, thanId: string, ung: UngVienDuAn, tick: number): Project;
/**
 * Rà một Project của thần: đo tiến độ TỪ THẾ GIỚI, không từ lời khai.
 *
 * Trả về `Project` mới; người gọi ghi nó lại bằng patch. Không hàm nào ở đây sửa
 * state — đó vẫn là việc của Event.
 */
export declare function raSoatDuAnThan(state: WorldState, pj: Project, tick: number): Project;
