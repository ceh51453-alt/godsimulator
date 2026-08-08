/**
 * Cắt phần suy luận nội bộ khỏi văn bản model trước khi lưu hoặc hiển thị.
 *
 * Phải xử lý cả thẻ chưa đóng: khi model hết thời gian/token giữa một khối
 * `<thinking>`, phần còn lại tới cuối chuỗi đều là nội dung dở dang và không
 * được phép lọt vào khung truyện.
 */
const THE_SUY_LUAN = 'thinking|think|reasoning|analysis';

export function catSuyLuanNoiBo(vanBan: string): string {
  const coTheMo = new RegExp(`<\\s*(?:${THE_SUY_LUAN})\\b[^>]*>`, 'i').test(vanBan);
  let ra = vanBan
    .replace(new RegExp(`<\\s*(${THE_SUY_LUAN})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`, 'gi'), '')
    .replace(new RegExp(`<\\s*(?:${THE_SUY_LUAN})\\b[^>]*>[\\s\\S]*$`, 'gi'), '');

  /*
   * Một số API nhận assistant prefill nhưng chỉ trả phần model viết tiếp. Khi
   * prefill là `<thinking>`, chuỗi nhận về vì thế có nội dung suy luận và
   * `</thinking>` nhưng không có thẻ mở. Chỉ xóa thẻ đóng sẽ làm toàn bộ suy
   * luận lọt ra giao diện; trong trường hợp bản gốc hoàn toàn không có thẻ mở,
   * phần từ đầu đến thẻ đóng chính là khối được prefill mở hộ.
   */
  if (!coTheMo) {
    ra = ra.replace(new RegExp(`^[\\s\\S]*?<\\s*\\/\\s*(?:${THE_SUY_LUAN})\\s*>`, 'i'), '');
  }

  return ra.replace(new RegExp(`<\\s*\\/\\s*(?:${THE_SUY_LUAN})\\s*>`, 'gi'), '').trim();
}
