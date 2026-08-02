/**
 * Bộ chỉ mục — Phần 54.2, 54.3, 54.8.
 *
 * ── Nhãn tầm nhìn gán LÚC INDEX, không gán lúc truy vấn ──
 *
 * 54.3: "Mọi chunk mang một nhãn tầm nhìn, gán lúc index." Đây là chi tiết dễ
 * làm ngược nhất và tốn kém nhất khi làm ngược: nếu nhãn được suy ra lúc truy
 * vấn thì mỗi lần thêm một loại nội dung mới, người viết phải nhớ suy nhãn cho
 * nó — và một lần quên là một đường rò vĩnh viễn. Gán lúc index nghĩa là chunk
 * KHÔNG CÓ NHÃN thì mặc định là `sang_the`, tức không ai dưới Sáng Thế thấy nó.
 * Quên đi kèm hậu quả "mất thông tin", không phải "rò thông tin".
 *
 * [BB] 54.2 — mỗi diễn giải của một luật là MỘT CHUNK RIÊNG, gắn `vungId`. Kể
 * chuyện ở vùng A phải nhận diễn giải của vùng A, không nhận của vùng B và
 * không nhận văn bản gốc.
 */
import type { WorldState } from '../engine/state.js';
import type { Chunk } from './chunk.js';
/**
 * Dựng chỉ mục cho một nhánh.
 *
 * Hàm thuần: cùng state cho cùng danh sách chunk, cùng thứ tự. Đó là điều kiện
 * để `candidateSetHash` của cache rerank (77.8) có nghĩa.
 */
export declare function dungChiMuc(s: WorldState): readonly Chunk[];
