/**
 * Một đường prompt duy nhất — ADR-0049, Phase 11.
 *
 * ── Chuyện đã sai trước Phase 11 ──
 *
 * Repo có HAI bộ dựng prompt và chúng không bao giờ gặp nhau:
 *
 *   `bienSoanPromptKe()`      sáu tầng của 33.1, đường chơi thật dùng
 *   `bienDichPromptPreset()`  bảy tầng của 63.6, chỉ test dùng
 *
 * Hệ quả là preset nhập vào rồi nằm im: pipeline mười hai bước chạy đúng, hai
 * fixture khớp từng con số, và **không một dòng nào của pack tới được model**.
 * Nhìn từ phía người chơi thì đó là "app đang đi chệch hướng", và họ đúng.
 *
 * ── Cách file này hợp nhất ──
 *
 * ```text
 * bienSoanPromptKe()  →  sáu tầng native
 *   → dungLoiNative() chia chúng thành: lõi hệ thống · slot · lượt này
 *   → bienDichPromptPreset() lắp slot vào marker của pack, xếp module ở tầng 4
 *   → một CompiledPrompt duy nhất
 *   → phẳng hoá về PromptGoi để `goiKe()` gửi đi
 * ```
 *
 * Không pack nào bật thì bước giữa bị bỏ qua và prompt native đi thẳng — [BB]
 * 65.4: *"tắt pack trả prompt native"*, và ở đây điều đó đúng theo nghĩa đen vì
 * đường tắt là **không gọi hàm biên dịch**, không phải là gọi nó với danh sách rỗng.
 *
 * ── Thứ tự quyền vẫn nguyên vẹn ──
 *
 * [BB] 65.3 — tám bậc quyền không đổi. Module ngoài vẫn nằm ở tầng 4, vẫn sau
 * product safety, hợp đồng engine và dữ liệu đã chiếu, và vẫn **trước** khối
 * lượt-này mang hợp đồng `<CapNhat>`. Một pack khai `injection_order: -99999`
 * vẫn không có đường nào ra trước lõi, vì không có nhánh nào ở đây đọc con số ấy.
 */
import type { Scene } from '../contracts/core.js';
import type { ImportIssue } from '../contracts/primitives.js';
import type { PromptGoi } from '../ai/bienSoan.js';
import type { NguLieuKe } from '../ai/bienSoan.js';
import type { CompiledPrompt, PresetActivation, PresetPackRow } from './schema.js';
import type { NormalizedGenParams } from '../schema/ai.js';
/** Một pack đang bật: bản ghi thư viện + activation trỏ tới nó. */
export type PackDangBat = Readonly<{
    row: PresetPackRow;
    activation: PresetActivation | null;
}>;
export type NguCanhHopNhat = Readonly<{
    nguLieu: NguLieuKe;
    scene: Scene;
    /** Rỗng nghĩa là chơi bằng prompt native — đường mặc định, luôn hợp lệ. */
    packs: readonly PackDangBat[];
    params: NormalizedGenParams;
    nganSachToken: number;
    tenPersona?: string;
    /** [BB] 78.11 — mô tả persona ĐÃ CHIẾU, không bao giờ là `PlayerProfile`. */
    moTaPersona?: string;
    hoTroPrefill?: boolean;
    lichSuDaDinhDang?: string;
}>;
export type KetQuaHopNhat = Readonly<{
    prompt: PromptGoi;
    /** `null` khi không pack nào bật — dấu hiệu rõ ràng rằng đây là đường native. */
    compiled: CompiledPrompt | null;
    /** Id pack thật sự đã góp mặt vào prompt này. */
    packDaDung: readonly string[];
    issues: readonly ImportIssue[];
    /** Module bị bỏ và macro chưa giải — vào tab chẩn đoán, không im lặng. */
    moduleBiBo: readonly string[];
    macroChuaGiai: readonly string[];
}>;
/**
 * Dựng prompt cho một lượt kể — cửa DUY NHẤT mà store được gọi.
 *
 * `bienSoanPromptKe()` vẫn là nơi sáu tầng được dựng, nên mọi bất biến của
 * Phase 8 (ngân sách theo tầng, vết cắt, chunk bị bỏ) tiếp tục đúng dù có pack
 * hay không: pack chỉ đổi cách sáu tầng ấy được XẾP, không đổi chúng là gì.
 */
export declare function bienSoanLuot(ng: NguCanhHopNhat): KetQuaHopNhat;
/**
 * Bản đồ "ý đồ preset → đích native" của 66.6.
 *
 * Bảng này là dữ liệu chứ không phải tài liệu, vì Xưởng Preset phải in được nó
 * ra cạnh từng script bị cách ly: người dùng nhập một pack rồi thấy năm script
 * bị tắt cần biết **cái gì trong app đã làm thay việc đó**, nếu không họ sẽ đi
 * tìm cách bật script bằng được.
 */
export declare const DUONG_PORT_TINH_NANG: readonly Readonly<{
    yDo: string;
    dichNative: string;
    khongDuocLam: string;
}>[];
