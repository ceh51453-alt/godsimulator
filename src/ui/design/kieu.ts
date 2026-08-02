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

export const nhanNho: CSSProperties = Object.freeze({
  color: 'var(--mo)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

export const oNhap: CSSProperties = Object.freeze({
  background: 'var(--kinh-nen-2)',
  color: 'var(--sang)',
  border: '1px solid var(--kinh-vien)',
  borderRadius: 'var(--r-sm)',
  padding: '9px 12px',
  font: 'inherit',
  fontSize: 13,
  width: '100%',
});

export function nut(chinh = false, tat = false): CSSProperties {
  return {
    background: 'transparent',
    color: tat ? 'var(--mo)' : chinh ? 'var(--dong)' : 'var(--tro)',
    border: `1px solid ${chinh && !tat ? 'var(--dong)' : 'var(--kinh-vien)'}`,
    borderRadius: 'var(--r-sm)',
    padding: '8px 14px',
    font: 'inherit',
    fontSize: 13,
    cursor: tat ? 'not-allowed' : 'pointer',
    opacity: tat ? 0.5 : 1,
  };
}

export const the: CSSProperties = Object.freeze({
  background: 'var(--kinh-nen)',
  border: '1px solid var(--kinh-vien)',
  borderRadius: 'var(--r-md)',
  padding: 16,
});

/** Một dòng nhãn — giá trị, dùng cho mọi bảng số nhỏ. */
export const dongSo: CSSProperties = Object.freeze({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  fontSize: 13,
  color: 'var(--tro)',
});
