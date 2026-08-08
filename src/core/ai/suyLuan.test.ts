import { describe, expect, it } from 'vitest';
import { catSuyLuanNoiBo } from './suyLuan.js';

describe('lọc suy luận nội bộ của model', () => {
  it('xóa khối có đủ thẻ và giữ nguyên lời kể bên ngoài', () => {
    expect(catSuyLuanNoiBo('<thinking>bí mật</thinking>Nàng bước vào.')).toBe('Nàng bước vào.');
  });

  it('xóa tới cuối khi model bị ngắt trước thẻ đóng', () => {
    expect(catSuyLuanNoiBo('Lời kể an toàn.\n<Thinking data-x="1">đang nghĩ dở')).toBe('Lời kể an toàn.');
  });

  it('nhận các tên thẻ suy luận thường gặp và thẻ đóng mồ côi', () => {
    expect(catSuyLuanNoiBo('<analysis>nháp</analysis>Đáp án.</reasoning>')).toBe('Đáp án.');
  });

  it('xóa phần prefill bị API giấu thẻ mở nhưng vẫn trả thẻ đóng', () => {
    expect(
      catSuyLuanNoiBo('[CHẶNG 0 — ĐỌC SỔ]\nBằng chứng và lập luận nội bộ.\n</thinking>\nNàng bước qua cửa.'),
    ).toBe('Nàng bước qua cửa.');
  });
});
