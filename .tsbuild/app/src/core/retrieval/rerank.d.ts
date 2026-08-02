/**
 * Rerank — Phần 77.4 → 77.7 [BB]. Đây là trái tim của Khối U.
 *
 * ── Thứ tự cố định, không đổi ──
 *
 *   heuristic (deterministic, luôn tồn tại)
 *     → semantic tùy chọn (có timeout, có circuit breaker)
 *     → fusion THEO THỨ HẠNG (không cộng thẳng thang điểm)
 *     → MMR (phạt trùng text VÀ trùng nguồn)
 *     → đóng gói theo token budget
 *
 * ── Ba luật không được vi phạm ──
 *
 * [BB] 77.4 — cùng input cho cùng điểm và cùng thứ tự. Tie-break bằng `chunkId`,
 * KHÔNG bằng thứ tự DB. Một thứ tự phụ thuộc DB làm hỏng cả replay lẫn cache.
 *
 * [BB] 77.5 — adapter chỉ được trả id THUỘC candidate set. Id lạ bị vứt, và một
 * output sai hình dạng làm cả lượt rơi về heuristic thay vì rơi về "gần đúng".
 *
 * [BB] 77.6 — không cộng thẳng cosine, cross-encoder logit và heuristic. Ba thang
 * ấy không so sánh được với nhau; chỉ thứ hạng là so được.
 */
import type { RerankCandidate, RerankConfig, RerankQuery, RerankResult, LyDoChon } from '../schema/rerank.js';
import type { Tuning } from '../tuning/schema.js';
import type { NhipThoiGian } from '../contracts/view.js';
export type NgocCanhHeuristic = {
    readonly tick: number;
    readonly nhip: NhipThoiGian;
    readonly tuning: Tuning;
    readonly task: string;
    readonly storylineDangChieuId: string | null;
    /** `soul.kyUc[].dienTich` gộp theo chunk, 0–100. */
    readonly dienTich?: ReadonlyMap<string, number>;
    /** Spotlight trung bình của nhân vật trong chunk, 0–100. */
    readonly spotlight?: ReadonlyMap<string, number>;
};
/**
 * Điểm heuristic — công thức 54.7 nâng lên làm fallback deterministic của 77.4.
 *
 * ```
 * heuristic = rrfRankScore × decayByTime × (1 + dienTich/200)
 *           × (1 + spotlight/200) × storylineBoost × trust × graphBoost
 * ```
 *
 * [BB] `trust = 0` KHÔNG đồng nghĩa xóa: tin đồn vẫn hữu ích cho tác vụ kể điều
 * chủ thể TIN. Vì vậy `trust` vào công thức dưới dạng `0.15 + 0.85·trust`, tức
 * chunk hoàn toàn không đáng tin vẫn còn một phần sáu cơ hội.
 */
export declare function diemHeuristic(c: RerankCandidate, nc: NgocCanhHeuristic): number;
/** Xếp hạng heuristic. [BB] 77.4 — tie-break bằng `chunkId`. */
export declare function xepHangHeuristic(ds: readonly RerankCandidate[], nc: NgocCanhHeuristic): readonly {
    chunkId: string;
    diem: number;
}[];
export type KetQuaAdapter = {
    /** Chỉ id thuộc candidate set. Id lạ → cả kết quả bị coi là hỏng. */
    readonly orderedChunkIds: readonly string[];
    readonly latencyMs: number;
};
/**
 * Hợp đồng adapter. Ba bản cài (`local_cross_encoder`, `proxy_cross_encoder`,
 * `llm_listwise`) đều đi qua đúng chữ ký này.
 *
 * Adapter KHÔNG nhận secret, KHÔNG nhận config endpoint, KHÔNG nhận chunk mù.
 * Nó nhận đúng thứ nó cần để xếp hạng: truy vấn và text đã chiếu.
 */
export type AdapterSemantic = {
    readonly ten: string;
    readonly xepHang: (query: {
        focusText: string;
        intentText: string;
        precedentText: string;
    }, ds: readonly {
        chunkId: string;
        projectedText: string;
    }[]) => Promise<KetQuaAdapter>;
};
/** Cắt chunk theo `maxChunkTokens`, ưu tiên đầu + câu chứa từ khớp (77.5). */
export declare function catChoAdapter(text: string, tuKhoa: readonly string[], maxTokens: number, tyLeToken?: number): string;
/**
 * Kiểm output adapter — [BB] 77.5: "chỉ trả id thuộc candidate set".
 *
 * Trả `null` nghĩa là output hỏng và người gọi PHẢI rơi về heuristic. Không có
 * đường "sửa tạm" — một adapter trả id lạ là một adapter ta không hiểu, và xếp
 * hạng theo thứ ta không hiểu là cách rò rỉ tinh vi nhất.
 */
export declare function locOutputAdapter(ra: readonly string[], hopLe: ReadonlySet<string>): readonly string[] | null;
export type DauVaoFusion = {
    readonly candidates: readonly RerankCandidate[];
    readonly hangHeuristic: ReadonlyMap<string, number>;
    /** Vắng mặt khi semantic không chạy — trọng số còn lại tự chuẩn hóa. */
    readonly hangSemantic: ReadonlyMap<string, number> | null;
    readonly hangDoThi: ReadonlyMap<string, number>;
    readonly config: RerankConfig;
    readonly tuning: Tuning;
    readonly task: string;
    readonly tick: number;
    readonly nhip: NhipThoiGian;
};
export type MucFusion = {
    readonly chunkId: string;
    readonly diem: number;
    readonly lyDo: readonly LyDoChon[];
};
/**
 * ```
 * fused = wInitial/(60+rankInitial) + wSemantic/(60+rankSemantic)
 *       + wGraph/(60+rankGraph) + trustBoost + recencyBoost
 * ```
 *
 * "Nếu semantic rerank không chạy, `rankSemantic` bỏ khỏi công thức và trọng số
 * còn lại được chuẩn hóa." — 77.6, và đó là điều làm tắt endpoint không đổi
 * THANG điểm, chỉ đổi thứ tự.
 */
export declare function fusion(dv: DauVaoFusion): readonly MucFusion[];
/** Jaccard trên tập âm tiết — rẻ, deterministic, đủ tốt để bắt biến thể câu chữ. */
export declare function tuongTuVanBan(a: string, b: string): number;
/**
 * `mmr = λ·relevance − (1−λ)·maxSimilarity(candidate, alreadySelected)`
 *
 * [BB] 77.6 — MMR phạt trùng text **và** trùng source event. "Hai chunk diễn đạt
 * khác nhưng cùng `nguonId` vẫn bị coi là TRÙNG MẠNH." Không có vế thứ hai thì
 * top-10 sẽ là mười cách kể lại cùng một sự kiện, và 54.11 mục 40 đỏ.
 */
export declare function mmr(xepHang: readonly MucFusion[], tra: ReadonlyMap<string, {
    projectedText: string;
    nguonId: string;
}>, lambda: number, soLay: number): readonly MucFusion[];
export type MucDaChon = {
    readonly chunkId: string;
    readonly diem: number;
    readonly lyDo: readonly LyDoChon[];
    readonly uocToken: number;
};
export type KetQuaDongGoi = {
    readonly chon: readonly MucDaChon[];
    readonly tongToken: number;
    /** Chunk bị cắt vì hết budget — [BB] cổng "token budget có trace". */
    readonly biCat: readonly {
        chunkId: string;
        vi: string;
        uocToken: number;
    }[];
    readonly canhBao: readonly string[];
};
export type ThongTinChunk = {
    readonly projectedText: string;
    readonly nguonId: string;
    readonly nguon: string;
    readonly graphDistance: number | null;
    readonly laTienLe: boolean;
};
/**
 * Sáu quy tắc của 77.7, cài đúng thứ tự:
 *
 *   1. giữ ít nhất một chunk từ MỖI NGUỒN QUAN TRỌNG nếu còn budget;
 *   2. giữ candidate có quan hệ nhân quả trực tiếp dù text không giống query;
 *   3. một lorebook không chiếm quá 50% top-K;
 *   4. dành quota cho tiền lệ Q3;
 *   5. chunk quá dài dùng bản tóm tắt đã có, KHÔNG cắt giữa câu luật;
 *   6. hết budget thì DỪNG — không để assembler cắt ngẫu nhiên sau rerank.
 *
 * Quy tắc 6 là quy tắc quan trọng nhất và là quy tắc hay bị bỏ: nếu rerank trả
 * top-K rồi assembler cắt tiếp theo ngân sách của nó, thì thứ bị cắt là thứ
 * rerank vừa xếp cuối — tức là mọi công của MMR bị vứt đi ở bước cuối cùng.
 */
export declare function dongGoiTheoToken(xepHang: readonly MucFusion[], tra: ReadonlyMap<string, ThongTinChunk>, nc: {
    nganSachToken: number;
    outputK: number;
    tyLeToken: number;
    tranTyLeMotNguon: number;
}): KetQuaDongGoi;
/** Dựng `RerankResult` từ kết quả đóng gói — hình dạng của 77.3. */
export declare function dungKetQua(q: RerankQuery, goi: KetQuaDongGoi, nc: {
    modelKey: string;
    modeUsed: RerankResult['modeUsed'];
    latencyMs: number;
    fallbackReason: string;
}): RerankResult;
