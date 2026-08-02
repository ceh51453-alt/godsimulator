/**
 * Sổ Phục Bút — Phần 30.2 [BB]. "AI không nhớ; engine ép nó nhớ."
 *
 * ── Cơ chế, đọc từ dưới lên ──
 *
 * Vấn đề thật: một ván chơi năm trăm lượt sẽ quên thứ đã gieo ở lượt thứ mười.
 * Câu trả lời KHÔNG phải là context lớn hơn (30.4 nói thẳng điều đó). Câu trả
 * lời là: engine giữ một danh sách những thứ đã gieo mà chưa trả, và engine ĐẨY
 * chúng lên đầu prompt khi quá hạn.
 *
 * [BB] Phục bút không bao giờ tự biến mất. Hai đường ra, và chỉ hai:
 *   - được trả  → `daTra = true`, `cachTra` ghi lại cách trả;
 *   - quá hạn   → thành `gap` loại `nhan_qua`, tức MỘT BÍ ẨN CỦA THẾ GIỚI.
 *
 * Đường thứ hai là chỗ nguyên tắc 4 hiện ra: thế giới không phạt ai vì gieo mà
 * không trả, nó biến chỗ chưa trả thành nội dung.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Foreshadow } from '../schema/truyen.js';
export type GieoPhucBut = {
    readonly noiDung: string;
    readonly loai: string;
    readonly machId: string | null;
    readonly hanTraToiDa: number | null;
    readonly doNang: number;
};
/**
 * Id phục bút: hàm thuần của (mạch, nội dung).
 *
 * Gieo hai lần cùng một điều trong cùng một mạch là MỘT phục bút, không phải
 * hai. Nếu không, Narrator nhắc lại một lời tiên tri ở lượt sau sẽ nhân đôi sổ
 * và ngân sách tầng 6 bị chính cái sổ ấy ăn hết.
 */
export declare function idPhucBut(branchId: string, machId: string | null, noiDung: string): string;
/** Gieo một phục bút. Trùng nội dung trong cùng mạch thì KHÔNG gieo lại. */
export declare function gieoPhucBut(s: WorldState, g: GieoPhucBut, nc: {
    tick: number;
    eventId: string;
}): {
    patches: readonly PatchOp[];
    id: string;
    daCo: boolean;
};
/** Trả một phục bút. Không xóa dòng — trả là một sự kiện, không phải phép xóa. */
export declare function traPhucBut(s: WorldState, id: string, cachTra: string, nc: {
    eventId: string;
}): readonly PatchOp[];
export type KetQuaRaSoat = {
    readonly patches: readonly PatchOp[];
    /** Phục bút quá hạn, nặng nhất trước — 30.2 đẩy chúng lên ĐẦU context. */
    readonly chuaTraQuaHan: readonly Foreshadow[];
    /** Mạch nào được cộng ưu tiên ống kính vì đang treo phục bút quá hạn. */
    readonly machUuTien: readonly string[];
    readonly soThanhBiAn: number;
};
/**
 * Engine kiểm mỗi tick.
 *
 * [BB] 30.2 — quá hạn chưa trả thì: (a) đẩy lên đầu context kèm ghi chú "chưa
 * trả", (b) cộng ưu tiên cho ống kính chĩa vào mạch đó, (c) nếu đã quá hạn gấp
 * đôi thì nó thôi là một lời hứa và trở thành một `gap` loại `nhan_qua`.
 */
export declare function raSoatPhucBut(s: WorldState, nc: {
    tick: number;
    eventId: string;
}): KetQuaRaSoat;
/** Phục bút đang treo của một mạch — nuôi tầng 6 của prompt (33.1). */
export declare function phucButDangTreo(s: WorldState, machId: string | null): readonly Foreshadow[];
