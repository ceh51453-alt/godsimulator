/**
 * Mock semantic reranker — cổng Phase 8: "mock pass TRƯỚC network".
 *
 * ── Vì sao mock nằm trong `core/` chứ không nằm trong thư mục test ──
 *
 * Nó không chỉ để test. Nó là bản cài tham chiếu của hợp đồng `AdapterSemantic`:
 * mọi adapter thật phải hành xử giống nó ở phần quan sát được (chỉ trả id thuộc
 * candidate set, tôn trọng timeout, hỏng thì ném lỗi). Một hợp đồng chỉ có bản
 * cài gọi mạng là một hợp đồng không ai kiểm được trước khi tiêu tiền.
 *
 * Mock này DETERMINISTIC: cùng đầu vào cho cùng thứ tự, không đồng hồ, không
 * ngẫu nhiên. Nhờ vậy bài test "semantic mode cho kết quả ổn định" có nghĩa.
 */
import type { AdapterSemantic } from './rerank.js';
export type TuyChonMock = {
    /** Giả hỏng — dùng cho test circuit breaker (77.9). */
    readonly luonHong?: boolean;
    /** Giả trả id lạ — dùng cho test "output sai → fallback heuristic" (77.5). */
    readonly traIdLa?: boolean;
    /** Độ trễ giả, mili giây. Chỉ để ghi vào `latencyMs`, không thật sự chờ. */
    readonly latencyGia?: number;
    /** Đảo ngược thứ hạng — dùng để chứng minh semantic THẬT SỰ đổi thứ tự. */
    readonly daoNguoc?: boolean;
};
/**
 * Xếp hạng bằng độ phủ từ khóa có trọng số theo vị trí truy vấn.
 *
 * Cố ý KHÁC BM25 của kênh từ vựng: nếu mock chấm giống hệt kênh đã có thì bài
 * test "semantic đổi thứ tự" sẽ xanh vì lý do sai. Ở đây từ trong `intentText`
 * nặng gấp đôi từ trong `focusText`, và trùng nhiều từ liên tiếp được thưởng —
 * đó là thứ một cross-encoder thật hay bắt được mà BM25 thì không.
 */
export declare function mockReranker(opt?: TuyChonMock): AdapterSemantic;
/**
 * Bộ nhúng giả — cho kênh ngữ nghĩa chạy được trong test mà không cần endpoint.
 *
 * Vector là biểu đồ tần suất âm tiết băm xuống `soChieu` chiều. Thô, nhưng nó
 * có đúng tính chất cần cho test: hai câu gần nghĩa (chung nhiều âm tiết) cho
 * cosine cao, hai câu khác hẳn cho cosine thấp — đúng phép thăm dò thứ bảy mà
 * 54.4 đòi cho model nhúng tiếng Việt.
 */
export declare function mockBoNhung(soChieu?: number): {
    nhung: (text: string) => Float32Array | null;
};
