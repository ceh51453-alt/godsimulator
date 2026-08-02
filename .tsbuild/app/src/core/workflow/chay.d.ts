/**
 * Bộ chạy đường ống tác vụ — Phần 50.3 [BB].
 *
 * ── Ba mươi nhân vật thì ba mươi call ──
 *
 * [BB] 50.3: "Đây là cách đúng để xử lý 30 nhân vật T2: **không** nhồi cả 30 vào
 * một prompt. Chia 30 call nhỏ, chạy 4–5 cái một lúc, mỗi call chỉ chứa ngữ cảnh
 * của một nhân vật. Rẻ hơn, chính xác hơn, và một cái hỏng không kéo sập 29 cái kia."
 *
 * Câu cuối là ràng buộc thiết kế thật: `chayHoBanSao()` dưới đây bắt lỗi TỪNG
 * bản sao và ghi vào `that Bai`, không để một lỗi ném ra khỏi vòng lặp.
 *
 * ── Vì sao bộ gọi model được TIÊM vào ──
 *
 * `core/` không gọi mạng (luật bất biến #3). Chữ ký `BoGoiModel` là toàn bộ thứ
 * file này biết về AI; test chạy nó bằng một hàm thuần, và đường chơi thật cắm
 * `src/ai/client.ts` vào cùng chỗ.
 */
import type { StructuredError } from '../contracts/errors.js';
import type { Tuning } from '../tuning/schema.js';
import type { WorkflowPreset, WorkflowTask } from './schema.js';
import type { NgocCanhLich, TrangThaiLich } from './lich.js';
export type YeuCauGoi = {
    readonly taskId: string;
    /** Preset API đang dùng; rỗng = preset mặc định của Diễn Hóa. */
    readonly apiPreset: string;
    readonly messages: readonly {
        readonly role: 'system' | 'user' | 'assistant';
        readonly content: string;
    }[];
    /** Bản sao nào trong họ; `null` khi tác vụ không bật họ bản sao. */
    readonly mucId: string | null;
    readonly lanThu: number;
};
export type PhanHoiGoi = {
    readonly ok: true;
    readonly text: string;
} | {
    readonly ok: false;
    readonly maLoi: string;
    readonly thongDiep: string;
};
export type BoGoiModel = (yc: YeuCauGoi) => Promise<PhanHoiGoi>;
/** Nguồn liệt kê cho họ bản sao — [BB] tra BẢNG, không `eval` chuỗi biểu thức. */
export type BoLietKe = (nguonLietKe: string, gioiHan: number) => readonly string[];
export type KetQuaTacVu = {
    readonly taskId: string;
    readonly chay: boolean;
    readonly lyDoKhongChay: string;
    /** Output đã gộp theo `cachGop`. */
    readonly output: string;
    readonly soCall: number;
    readonly soThuLai: number;
    readonly thatBai: readonly {
        readonly mucId: string | null;
        readonly maLoi: string;
        readonly thongDiep: string;
    }[];
    /** Bậc dự phòng đã dùng: 0 = preset chính. */
    readonly bacDuPhong: number;
    readonly trangThaiLich: TrangThaiLich;
    readonly canhBao: readonly StructuredError[];
};
export type KetQuaGiaiDoan = {
    readonly giaiDoan: number;
    readonly ketQua: readonly KetQuaTacVu[];
};
export type NgocCanhChay = {
    readonly preset: WorkflowPreset;
    readonly goi: BoGoiModel;
    readonly lietKe: BoLietKe;
    readonly lich: NgocCanhLich;
    readonly trangThaiLich: ReadonlyMap<string, TrangThaiLich>;
    readonly tuning: Tuning;
    /** Prompt đã dựng cho từng tác vụ. Assembler nằm ngoài file này. */
    readonly dungPrompt: (task: WorkflowTask, mucId: string | null, nguCanhTruoc: string) => YeuCauGoi['messages'];
    /** Chỉ dựng prompt và trả về, KHÔNG gọi model — nút "Chạy thử tác vụ này" (50.11). */
    readonly chayThu?: boolean;
};
/**
 * Chạy toàn bộ đường ống: giai đoạn tăng dần, trong mỗi giai đoạn chạy song song.
 *
 * [BB] 50.3 — "Output giai đoạn trước có mặt trong ngữ cảnh của giai đoạn sau."
 * Vì vậy `nguCanhTruoc` được nối dồn và truyền xuống, và một tác vụ giai đoạn 2
 * không bao giờ chạy trước khi giai đoạn 1 xong.
 */
export declare function chayDuongOng(nc: NgocCanhChay): Promise<KetQuaGiaiDoan[]>;
/** Chạy một tác vụ, gồm cả họ bản sao và chuỗi dự phòng. */
export declare function chayMotTacVu(task: WorkflowTask, nc: NgocCanhChay, nguCanhTruoc: string): Promise<KetQuaTacVu>;
/** Gộp kết quả theo `cachGop` — 50.2. */
export declare function gop(ds: readonly string[], cach: WorkflowTask['cachGop']): string;
