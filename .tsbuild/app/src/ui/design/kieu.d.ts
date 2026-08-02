/**
 * Kiểu dùng chung cho các màn dựng ở Phase 12.
 *
 * Không phải một hệ thiết kế — `tokens.css` mới là chỗ đó. Đây chỉ là ba bốn
 * hình dạng đã bị chép tay ở mọi màn từ Phase 6 (`nut`, `oNhap`, `nhanNho`), gom
 * lại một chỗ để bốn màn mới không thêm bốn bản chép nữa.
 *
 * [BB] 36.1 — không emoji. [BB] luật bất biến #9 — không dấu hiệu nào chỉ bằng
 * màu: mọi hàm dưới đây trả về hình dạng, và nơi gọi luôn phải kèm chữ.
 */
import type { CSSProperties } from 'react';
export declare const nhanNho: CSSProperties;
export declare const oNhap: CSSProperties;
export declare function nut(chinh?: boolean, tat?: boolean): CSSProperties;
export declare const the: CSSProperties;
/** Một dòng nhãn — giá trị, dùng cho mọi bảng số nhỏ. */
export declare const dongSo: CSSProperties;
