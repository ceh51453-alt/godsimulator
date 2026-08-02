/**
 * SHA-256 thuần TypeScript — bước 3 của pipeline nhập (63.1).
 *
 * ── Vì sao không dùng WebCrypto ──
 *
 * `crypto.subtle.digest` là **bất đồng bộ** và không tồn tại trong mọi ngữ cảnh
 * (`file://`, một số WebView, và Node cũ). Bước 3 nằm giữa một chuỗi kiểm tra
 * đồng bộ, và `core/` không được phụ thuộc API trình duyệt (luật bất biến #3).
 * Nên hàm băm ở đây là số học 32-bit thuần: cùng bytes cho cùng hex trên mọi máy,
 * và test đối chiếu được với `node:crypto`.
 *
 * Đây là chỗ duy nhất trong repo cần SHA-256 thật. `bam()` ở `engine/hash.ts` là
 * FNV-1a — nhanh, dùng cho hash trạng thái nội bộ, và **không** dùng để nhận diện
 * file người dùng: đặc tả 66.3/66.4 ghi SHA-256 của hai fixture, và một hàm băm
 * khác sẽ không bao giờ khớp con số ấy.
 */
/** UTF-8 encode không phụ thuộc `TextEncoder` — Node cũ và một số WebView thiếu nó. */
export declare function utf8Bytes(s: string): Uint8Array;
/** Số byte UTF-8 của một chuỗi — dùng cho trần `maxJsonBytes`. */
export declare function soByteUtf8(s: string): number;
/** SHA-256 của một mảng byte. Trả hex CHỮ HOA — khớp cách đặc tả 66.3 ghi hash. */
export declare function sha256Bytes(bytes: Uint8Array): string;
/** SHA-256 của một chuỗi, encode UTF-8 trước. */
export declare function sha256(s: string): string;
