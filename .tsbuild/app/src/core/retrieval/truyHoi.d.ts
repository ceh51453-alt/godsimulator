/**
 * Đường ống truy hồi — Phần 54.9 + 77.1 [BB]. Một chỗ, một thứ tự, không có lối tắt.
 *
 * ```text
 * WorldView + visibility filter      ← [BB] TRƯỚC mọi bước chấm điểm
 *   → metadata prefilter
 *   → BM25 + embedding + graph
 *   → RRF lấy top candidateK
 *   → heuristic rerank
 *   → semantic rerank tùy chọn
 *   → fusion theo thứ hạng
 *   → MMR chống trùng
 *   → đóng gói top-K theo token budget
 *   → Assembler
 * ```
 *
 * ── Vì sao lọc tầm nhìn nằm ở dòng đầu tiên của hàm ──
 *
 * 54.3 và 77.1 nói cùng một điều bằng hai giọng: lọc sau khi xếp hạng thì top-K
 * đã bị chunk cấm chiếm chỗ, và semantic reranker đã NHÌN THẤY thứ nó không được
 * nhìn. Ở đây điều đó được cưỡng chế hai lớp: (a) lọc là câu lệnh đầu tiên;
 * (b) sau khi lọc, kiểu dữ liệu đổi từ `Chunk` sang `ChunkDaChieu`, và
 * `ChunkDaChieu` không có trường `noiDung` — nên không có gì để rò kể cả khi ai
 * đó viết sai ở bước sau.
 *
 * [BB] 77.9 — reranker chết KHÔNG được làm mất context, mất lượt hoặc ngừng
 * Narrator. Ngắt mạch ở đây đếm LẦN, không đếm giây (luật bất biến #7).
 */
import type { WorldView } from '../contracts/view.js';
import type { Tuning } from '../tuning/schema.js';
import type { RerankCandidate, RerankConfig, RerankQuery, RerankResult, RetrievalRun, RerankTask, LyDoChon } from '../schema/rerank.js';
import type { Chunk, ChunkDaChieu } from './chunk.js';
import type { BoNhung } from './kenh.js';
import type { AdapterSemantic } from './rerank.js';
export type MachRerank = {
    readonly hongLienTiep: number;
    readonly moMach: boolean;
    /** Số request retrieval còn phải bỏ qua trước khi thử lại. */
    readonly conBoQua: number;
    readonly lyDoCuoi: string;
};
export declare const MACH_RERANK_MOI: MachRerank;
/** [BB] 77.9 — ba lỗi liên tiếp → mở mạch trong 20 request retrieval. */
export declare const NGUONG_MO_MACH_RERANK = 3;
export declare const SO_REQUEST_BO_QUA = 20;
export declare function machSauHong(m: MachRerank, lyDo: string): MachRerank;
export declare function machSauThanhCong(): MachRerank;
/** Một request đi qua trong lúc mạch mở. Về 0 thì probe một batch nhỏ. */
export declare function machSauBoQua(m: MachRerank): MachRerank;
export type BaTruyVan = {
    /** Q1 — tiêu điểm: entity trên sân khấu + mục tiêu ống kính. */
    readonly focusText: string;
    /** Q2 — ý định: chính lời người chơi, hoặc mô tả nhịp mạch nếu tự động. */
    readonly intentText: string;
    /**
     * Q3 — tiền lệ: "chuyện tương tự đã từng xảy ra chưa".
     *
     * 54.6 gọi nó là truy vấn ĐÁNG GIÁ NHẤT và hay bị bỏ quên. Nó là thứ làm một
     * vụ ám sát kéo về ba vụ ám sát trước đó trong lịch sử thế giới này.
     */
    readonly precedentText: string;
};
/** Dựng ba truy vấn từ view — [BB] 54.6: "đừng nhúng thẳng tin nhắn người chơi". */
export declare function dungBaTruyVan(view: WorldView, nc: {
    tieuDiemIds: readonly string[];
    loiNguoiChoi: string;
    machDangChieuId: string | null;
}): BaTruyVan;
export type NgocCanhLoc = {
    readonly view: WorldView;
    readonly vungIds: ReadonlySet<string>;
    readonly domainIds: ReadonlySet<string>;
    readonly seed: string;
    readonly triThuc: number;
};
/**
 * Bước đầu tiên, và nó đổi KIỂU DỮ LIỆU.
 *
 * [BB] 54.3 — chunk `laTinDon = true` phải đi qua `bopMeo()` (19.1) trước khi
 * vào ngữ cảnh, KỂ CẢ khi nó được truy hồi đúng.
 */
export declare function locTamNhin(ds: readonly Chunk[], nc: NgocCanhLoc): readonly ChunkDaChieu[];
export type DauVaoTruyHoi = {
    readonly view: WorldView;
    readonly chunks: readonly Chunk[];
    readonly task: RerankTask;
    readonly truyVan: BaTruyVan;
    readonly tieuDiemIds: readonly string[];
    readonly machDangChieuId: string | null;
    readonly config: RerankConfig;
    readonly tuning: Tuning;
    readonly nganSachToken: number;
    readonly tyLeToken: number;
    readonly seed: string;
    readonly triThuc: number;
    readonly vungIds: ReadonlySet<string>;
    readonly domainIds: ReadonlySet<string>;
    readonly boNhung?: BoNhung | null;
    readonly adapter?: AdapterSemantic | null;
    readonly mach?: MachRerank;
    /**
     * Cache — [BB] 77.8. Bất đồng bộ vì `candidateSetHash` chỉ có SAU khi ba kênh
     * đã chạy, nên không có cách nào đọc cache trước rồi truyền vào; và kho thật
     * (Dexie) thì bất đồng bộ.
     */
    readonly cacheDoc?: (khoa: KhoaTruyHoi) => Promise<RerankResult | undefined>;
    readonly cacheGhi?: (khoa: KhoaTruyHoi, kq: RerankResult) => Promise<void>;
    /** Đồng hồ bơm vào — `core/` không được đọc đồng hồ máy (luật bất biến #7). */
    readonly dongHo?: () => number;
};
export type KhoaTruyHoi = {
    readonly branchId: string;
    readonly scopeKey: string;
    readonly queryHash: string;
    readonly candidateSetHash: string;
    readonly visibilityHash: string;
    readonly modelKey: string;
    readonly configHash: string;
};
export type KetQuaTruyHoi = {
    readonly query: RerankQuery;
    readonly candidates: readonly RerankCandidate[];
    readonly ketQua: RerankResult;
    readonly daChon: readonly ChunkDaChieu[];
    /**
     * [BB] 77.7 — "Kết quả ghi lý do chọn". 77.11 đưa nó lên tab Truy hồi.
     *
     * Không có trường này thì tab Truy hồi chỉ là một cái đồng hồ đo, và người
     * chơi không bao giờ biết vì sao Narrator nhắc tới đúng chuyện cũ ấy.
     */
    readonly lyDo: ReadonlyMap<string, readonly LyDoChon[]>;
    readonly biCat: readonly {
        chunkId: string;
        vi: string;
        uocToken: number;
    }[];
    readonly tongToken: number;
    readonly run: RetrievalRun;
    readonly machMoi: MachRerank;
    readonly canhBao: readonly string[];
    /** [BB] Phải LUÔN rỗng. Không rỗng là bug nghiêm trọng nhất của hệ retrieval. */
    readonly chunkCamLotVao: readonly string[];
};
export declare function scopeKeyCua(view: WorldView): string;
/**
 * Chạy toàn bộ đường ống.
 *
 * `chunkCam` chỉ dùng để KIỂM, không dùng để lọc: lọc thật đã xảy ra ở
 * `locTamNhin()`. Nếu một id trong `chunkCam` xuất hiện ở kết quả thì đó là bằng
 * chứng lọc hỏng, và bài test phải đỏ — chứ không phải được vá bằng một phép lọc
 * thứ hai ở cuối.
 */
export declare function truyHoi(dv: DauVaoTruyHoi, chunkCam?: ReadonlySet<string>): Promise<KetQuaTruyHoi>;
