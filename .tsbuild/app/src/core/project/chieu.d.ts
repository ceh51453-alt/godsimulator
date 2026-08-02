/**
 * chieu() — hàm chiếu ba tầng. Phần 18 [BB].
 *
 * "Ba tầng chơi là ba HÀM CHIẾU trên cùng một database. Không phải ba game."
 * "Không viết ba bộ logic. Viết MỘT engine, BA hàm chiếu."
 *
 * [BB] Ba quy tắc cứng của 18.2, đứng TRÊN mọi khai báo `KindDef.phanChieu`:
 *   1. `lawful.vanBan`   — phàm nhân KHÔNG BAO GIỜ; thần chỉ trong domain.
 *   2. `soul.banTinh` của thần — phàm nhân KHÔNG BAO GIỜ; chỉ `banTinhTinDoTin`.
 *   3. `conceptual.trongSo` — phàm nhân KHÔNG; chỉ biết khái niệm đã có TÊN
 *      trong văn hóa vùng mình.
 *
 * [BB] Trường bị che bị XÓA KHỎI ĐỐI TƯỢNG, không ẩn bằng CSS (luật bất biến #9).
 */
import type { WorldState } from '../engine/state.js';
import type { ViewMode } from '../contracts/primitives.js';
import type { WorldView } from '../contracts/view.js';
export declare function chieu(state: WorldState, mode: ViewMode, chuTheId: string | null): WorldView;
