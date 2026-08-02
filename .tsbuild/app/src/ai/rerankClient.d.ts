/**
 * Adapter semantic thật — Phần 77.5 [BB].
 *
 * Chỗ thứ hai (và cuối cùng) trong dự án gọi `fetch`. Cùng lý do với
 * `client.ts`: `src/core` không chạm mạng, nên phần "nhấc điện thoại" gói ở đây,
 * và nó nhận vào **text đã chiếu** chứ không nhận `WorldView`.
 *
 * ── Adapter phải làm gì, theo đúng 77.5 ──
 *
 *   nhận tối đa `candidateK`                    ← người gọi cắt trước
 *   cắt mỗi chunk theo `maxChunkTokens`         ← `catChoAdapter()` ở `rerank.ts`
 *   KHÔNG nhận raw secret / endpoint config     ← chữ ký chỉ có query + text
 *   chỉ trả id thuộc candidate set              ← `locOutputAdapter()` kiểm
 *   không gọi tool, không trả Patch             ← schema output chỉ có mảng id
 *   timeout và hủy được                         ← `AbortController` dưới đây
 *   output sai → fallback heuristic             ← ném lỗi, `truyHoi()` bắt
 *
 * [BB] Với `llm_listwise`, chunk phải nằm trong vùng dữ liệu CÓ DELIMITER và
 * instruction nói rõ nội dung chunk KHÔNG PHẢI chỉ dẫn. Không có câu đó thì một
 * chunk lorebook người dùng nhập có thể viết "bỏ qua hướng dẫn trên" và reranker
 * sẽ nghe theo — preset ngoài là dữ liệu không tin cậy (luật bất biến #10).
 */
import type { AdapterSemantic } from '../core/retrieval/rerank.js';
import type { RerankEndpoint } from '../core/schema/rerank.js';
export type TuyChonRerank = {
    readonly fetchImpl?: typeof fetch;
    readonly timeoutMs?: number;
    readonly signal?: AbortSignal;
    /** Đồng hồ bơm vào để test đo được latency mà không phụ thuộc máy. */
    readonly dongHo?: () => number;
};
/**
 * `llm_listwise` — [BB] 77.2: chỉ dùng khi NGƯỜI DÙNG chọn.
 *
 * "Không tự dùng Narrator làm reranker nếu người dùng chưa chọn `llm_listwise`."
 * Câu đó là một quyết định về tiền, không về kỹ thuật: một lượt kể có thể tốn
 * hai call thay vì một mà người chơi không hề biết.
 */
export declare function adapterListwise(ep: RerankEndpoint, t?: TuyChonRerank): AdapterSemantic;
/**
 * `proxy_cross_encoder` — model rerank chuyên dụng.
 *
 * Giao thức của nhóm này đã hội tụ khá rõ: POST `{query, documents}` → trả
 * `{results:[{index, relevance_score}]}` (Cohere/Jina/TEI đều gần như vậy).
 * Ta gửi `documents` là text đã chiếu và ĐỌC LẠI THEO INDEX, không đọc theo id
 * model trả — model rerank không nhìn thấy id, nên nó không thể bịa ra id sai.
 */
export declare function adapterCrossEncoder(ep: RerankEndpoint, t?: TuyChonRerank): AdapterSemantic;
/**
 * Chọn adapter theo cấu hình — `auto` của 77.2.
 *
 * Thứ tự: local cross-encoder (chưa có bản cài) → proxy reranker → heuristic.
 * Trả `null` nghĩa là dùng heuristic, và đó là kết quả HỢP LỆ, không phải lỗi.
 */
export declare function chonAdapter(ep: RerankEndpoint, t?: TuyChonRerank): AdapterSemantic | null;
