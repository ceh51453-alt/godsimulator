/**
 * Ba cửa vào và khởi tạo thế giới — Phần 17.4, 78.4, 78.5.
 *
 * [BB] Luật bất biến #19: việc chọn bắt đầu là Sáng Thế, Thần hay Phàm phải đi qua
 * Intent → validator → Event/Patch. Wizard KHÔNG ghi World trực tiếp.
 *
 * Module này chỉ SINH RA Event; nó không chạm `WorldState`. Người gọi phải đưa
 * Event qua `apDungEvent` để chúng thành sự thật.
 *
 * ── ADR-0055: đường chơi mở ra HƯ VÔ, không mở ra một thế giới dựng sẵn ──
 *
 * Trước Phase 12, `moThuGioi()` phát tám entity ngay ở nhịp 0: hai Luật, một Khái
 * Niệm và phản nghĩa của nó, một Thần, một Phàm Nhân, hai vùng đất. Người chơi
 * chưa gõ chữ nào đã có sẵn một thần thoại của người khác — và tệ hơn, "Máu Không
 * Rửa Được" xuất hiện ở mọi ván, nên nó thôi là luật của thế giới này và thành đồ
 * trang trí của phần mềm.
 *
 * Vì vậy hai đường tách hẳn nhau:
 *
 *   `moTheGioiTrong()`  — ĐƯỜNG CHƠI. Không entity nào. Luật, khái niệm, thần và
 *                         người chỉ có mặt khi một Event trong lúc chơi tạo ra
 *                         chúng, và Event ấy luôn truy được về một lượt cụ thể.
 *   `moThuGioi()`       — FIXTURE cho test và benchmark. Nó cần một thế giới có
 *                         sẵn hình dạng để đo phép chiếu, ba tầng và một trăm năm
 *                         mô phỏng; nó KHÔNG được đứng trong `src/store` hay
 *                         `src/ui` (có cổng ở `source-guards.test.ts`).
 */
import { z } from 'zod';
import type { Event, World } from '../contracts/core.js';
export declare const CUA_VAO: readonly ["hu_vo", "mot_cau", "day_du"];
export type CuaVao = (typeof CUA_VAO)[number];
export declare const NguyenMauSangThe: readonly ["phan_tach_hon_don", "vu_tru_noan", "hien_te_nguyen_thuy", "ngon_tu", "tho_lan_dat", "giao_phoi_troi_dat"];
export declare const KhoiTaoWorldSchema: z.ZodObject<{
    cua: z.ZodPrefault<z.ZodEnum<{
        day_du: "day_du";
        hu_vo: "hu_vo";
        mot_cau: "mot_cau";
    }>>;
    seed: z.ZodString;
    worldId: z.ZodString;
    branchId: z.ZodString;
    motCau: z.ZodPrefault<z.ZodString>;
    nguyenMau: z.ZodPrefault<z.ZodEnum<{
        phan_tach_hon_don: "phan_tach_hon_don";
        vu_tru_noan: "vu_tru_noan";
        hien_te_nguyen_thuy: "hien_te_nguyen_thuy";
        ngon_tu: "ngon_tu";
        tho_lan_dat: "tho_lan_dat";
        giao_phoi_troi_dat: "giao_phoi_troi_dat";
    }>>;
    tuningProfileId: z.ZodPrefault<z.ZodString>;
}, z.core.$strict>;
export type KhoiTaoWorld = z.infer<typeof KhoiTaoWorldSchema>;
/** World rỗng — chưa có gì trong đó, tick 0. */
export declare function worldRong(ct: KhoiTaoWorld): World;
/**
 * Hạt giống tối thiểu của Phase 3: một Luật Nền, một luật thường, một khái niệm
 * (kèm phản nghĩa tự sinh), một thần, một phàm nhân, hai nơi.
 *
 * [BB] Phần 8.3 — mỗi Khái Niệm mới tự động sinh phản nghĩa ở `hu_danh`.
 * [BB] Phần 6.3 — không thực thể mồ côi: mọi entity đều có ít nhất một link.
 */
export declare function eventGieoTheGioi(ct: KhoiTaoWorld): Event;
/**
 * FIXTURE. Cửa `hu_vo` và `mot_cau` cùng dùng một hạt giống; khác nhau ở chỗ
 * `mot_cau` ghi lại câu người chơi viết vào payload.
 *
 * [BB] ADR-0055 — hàm này KHÔNG còn nằm trên đường chơi. Nó tồn tại để test có
 * một thế giới đủ hình dạng mà đo; đường chơi dùng `moTheGioiTrong()`.
 */
export declare function moThuGioi(ct: KhoiTaoWorld): {
    world: World;
    events: readonly Event[];
};
/**
 * Event khai thiên của một thế giới RỖNG — [BB] ADR-0055.
 *
 * Không patch nào, và đó là toàn bộ ý nghĩa của nó: nó ghi vào log rằng thế giới
 * đã mở ra, cửa nào đã dùng, và người chơi đã nói câu gì — nhưng nó không đặt một
 * hòn đá nào. Nhịp 0 của một ván mới có đúng 0 entity, 0 luật, 0 khái niệm.
 *
 * Event vẫn tồn tại chứ không bị bỏ hẳn, vì `motCau` là thứ tầng 6 của prompt đọc
 * ở lượt đầu tiên, và một câu không có Event nào giữ là một câu sẽ mất khi replay.
 */
export declare function eventKhaiThienHuVo(ct: KhoiTaoWorld): Event;
/**
 * Mở một thế giới cho ĐƯỜNG CHƠI: hư vô, và chỉ hư vô.
 *
 * Ba cửa của 17.4 vẫn khác nhau, nhưng chúng khác nhau ở chỗ người chơi NÓI gì
 * chứ không ở chỗ engine phát sẵn bao nhiêu đồ:
 *
 *   `hu_vo`    — không nói gì; lượt kể đầu tiên diễn ra trong cái chưa có tên
 *   `mot_cau`  — một câu, và câu ấy là toàn bộ tiền đề
 *   `day_du`   — thêm nguyên mẫu sáng thế, vẫn chỉ là tiền đề
 */
export declare function moTheGioiTrong(ct: KhoiTaoWorld): {
    world: World;
    events: readonly Event[];
};
