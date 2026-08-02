/**
 * Vệ sinh văn bản không tin cậy — Phase 12, mô hình đe dọa mục 3.
 *
 * ── Đe dọa thật, không phải đe dọa trên giấy ──
 *
 * React đã escape mọi thứ nó render, nên XSS cổ điển không phải cửa vào ở đây.
 * Ba thứ dưới đây thì React KHÔNG chặn, và cả ba đều đi được từ một file preset
 * hay một phản hồi model tới thẳng mắt người chơi:
 *
 *   1. **Ký tự điều khiển hai chiều** (U+202E RLO và họ hàng). Một dòng lời kể
 *      có RLO đảo ngược thứ tự hiển thị của mọi thứ SAU nó — kể cả phần giao
 *      diện nằm cạnh. Đây là kỹ thuật "Trojan Source", và nó không cần script.
 *   2. **Ký tự vô hình** (zero-width, soft hyphen). Chúng làm hai chuỗi trông
 *      giống hệt nhau mà không bằng nhau — nghĩa là một `id` nhìn đúng nhưng
 *      không khớp, và một mục Bảng nhìn trùng nhưng đếm thành hai.
 *   3. **Chuỗi dài vô hạn.** Một entry lorebook 40 MB không phải lỗ hổng bảo
 *      mật, nó chỉ làm trình duyệt đứng — và với người dùng thì hai thứ đó là
 *      một.
 *
 * ── Vì sao KHÔNG xóa thẻ HTML ──
 *
 * Vì lời kể có thể chứa dấu `<` một cách hợp lệ ("<Vô Danh>" là một cách gọi tên
 * trong nhiều thần thoại), và vì React không diễn giải nó. Xóa `<...>` ở đây sẽ
 * ăn mất văn của người chơi để đổi lấy một mối nguy không tồn tại. Chỗ THẬT SỰ
 * cần cẩn thận là `dangerouslySetInnerHTML`, và cả repo không có chỗ nào dùng nó
 * — có cổng ở `phase12.test.ts` giữ điều đó.
 *
 * ── Vì sao `new RegExp` với chuỗi escape, không dùng regex literal ──
 *
 * Một literal chứa ký tự điều khiển sẽ nằm trong file dưới dạng byte thật, kể cả
 * byte NUL. Một file nguồn có NUL bên trong làm hỏng đủ thứ công cụ đọc nó, bắt
 * đầu từ `git diff`. Chuỗi escape thì đọc được bằng mắt và an toàn với mọi công
 * cụ. Đây KHÔNG phải regex dựng từ dữ liệu người dùng — ba hằng số dưới đây cố
 * định trong mã nguồn.
 *
 * [BB] `core/` thuần: không DOM, không mạng, không đồng hồ máy.
 */

/**
 * Ký tự điều khiển hai chiều — U+061C, U+200E–U+200F, U+202A–U+202E,
 * U+2066–U+2069. Xóa hẳn: không có trường hợp dùng hợp lệ nào trong văn bản
 * tiếng Việt hay dữ liệu game, và giữ lại một cái là giữ cả kỹ thuật.
 */
const DIEU_KHIEN_HAI_CHIEU = new RegExp('[\\u061C\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]', 'g');

/**
 * Ký tự vô hình: soft hyphen, khoảng trắng Mongolia, zero-width
 * space/non-joiner/joiner, word joiner và BOM.
 */
const VO_HINH = new RegExp('[\\u00AD\\u180E\\u200B-\\u200D\\u2060\\uFEFF]', 'g');

/**
 * Ký tự điều khiển C0/C1, trừ `\t`, `\n`, `\r` — ba cái ấy là nội dung thật.
 *
 * Chúng lọt vào Bảng và vào prompt thì làm hỏng cả hai theo cách không ai đọc
 * ra được từ một ảnh chụp màn hình.
 */
// eslint-disable-next-line no-control-regex -- đây CHÍNH LÀ thứ cần khớp
const DIEU_KHIEN = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]', 'g');

/** Trần mặc định cho một đoạn văn bản hiển thị. */
export const TRAN_HIEN_THI = 20_000;

export type VetVeSinh = {
  readonly soBiDoiChieu: number;
  readonly soVoHinh: number;
  readonly soDieuKhien: number;
  /** Có bị cắt vì vượt trần không. */
  readonly daCat: boolean;
};

export type KetQuaVeSinh = {
  readonly text: string;
  readonly vet: VetVeSinh;
};

/**
 * Vệ sinh một đoạn văn bản, và NÓI ra đã đụng vào cái gì.
 *
 * Trả cả vết chứ không chỉ chuỗi sạch: một bộ lọc âm thầm là một bộ lọc không
 * ai kiểm được, và bảng Tự Chẩn Đoán cần đếm được số lần nó phải ra tay. Đây là
 * cùng nguyên tắc với `bocTach()` — thứ bị từ chối phải đi đâu đó, không được
 * biến mất.
 */
export function veSinh(tho: unknown, tran = TRAN_HIEN_THI): KetQuaVeSinh {
  const s = typeof tho === 'string' ? tho : String(tho ?? '');

  const soBiDoiChieu = (s.match(DIEU_KHIEN_HAI_CHIEU) ?? []).length;
  const soVoHinh = (s.match(VO_HINH) ?? []).length;
  const soDieuKhien = (s.match(DIEU_KHIEN) ?? []).length;

  let ra = s.replace(DIEU_KHIEN_HAI_CHIEU, '').replace(VO_HINH, '').replace(DIEU_KHIEN, '');

  // Chuẩn hóa xuống dòng: `\r\n` và `\r` lọt vào từ file Windows và từ vài proxy.
  ra = ra.replace(/\r\n?/g, '\n');

  const daCat = ra.length > tran;
  if (daCat) ra = `${ra.slice(0, tran)}\n[đã cắt vì vượt ${tran} ký tự]`;

  return { text: ra, vet: { soBiDoiChieu, soVoHinh, soDieuKhien, daCat } };
}

/** Bản rút gọn cho nơi gọi chỉ cần chuỗi sạch. */
export function veSinhNhanh(tho: unknown, tran = TRAN_HIEN_THI): string {
  return veSinh(tho, tran).text;
}

/** Có gì đáng nói không — bảng Tự Chẩn Đoán dùng để quyết có hiện dòng hay không. */
export function coVet(v: VetVeSinh): boolean {
  return v.soBiDoiChieu > 0 || v.soVoHinh > 0 || v.soDieuKhien > 0 || v.daCat;
}

/**
 * Một dòng tiếng Việt mô tả vết — [BB] 58.13: không id thô trên giao diện.
 */
export function moTaVet(v: VetVeSinh): string {
  const phan: string[] = [];
  if (v.soBiDoiChieu > 0) phan.push(`${v.soBiDoiChieu} ký tự đảo chiều văn bản`);
  if (v.soVoHinh > 0) phan.push(`${v.soVoHinh} ký tự vô hình`);
  if (v.soDieuKhien > 0) phan.push(`${v.soDieuKhien} ký tự điều khiển`);
  if (v.daCat) phan.push('đoạn quá dài đã bị cắt');
  return phan.length === 0 ? '' : `Đã lọc khỏi văn bản: ${phan.join(', ')}.`;
}
