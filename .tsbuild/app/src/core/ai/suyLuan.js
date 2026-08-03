/**
 * Cắt phần suy luận nội bộ khỏi văn bản model trước khi lưu hoặc hiển thị.
 *
 * Phải xử lý cả thẻ chưa đóng: khi model hết thời gian/token giữa một khối
 * `<thinking>`, phần còn lại tới cuối chuỗi đều là nội dung dở dang và không
 * được phép lọt vào khung truyện.
 */
const THE_SUY_LUAN = 'thinking|think|reasoning|analysis';
export function catSuyLuanNoiBo(vanBan) {
    return vanBan
        .replace(new RegExp(`<\\s*(${THE_SUY_LUAN})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`, 'gi'), '')
        .replace(new RegExp(`<\\s*(?:${THE_SUY_LUAN})\\b[^>]*>[\\s\\S]*$`, 'gi'), '')
        .replace(new RegExp(`<\\s*\\/\\s*(?:${THE_SUY_LUAN})\\s*>`, 'gi'), '')
        .trim();
}
