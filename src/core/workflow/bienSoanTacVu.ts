/**
 * Biên soạn prompt cho một tác vụ Diễn Hóa — Phần 50.2, 50.5.
 *
 * ── Vì sao không render EJS ở đây ──
 *
 * `nhomPrompt[].noiDung` được đặc tả là "CHỨA EJS", và ở SillyTavern nó đúng là
 * EJS. Nhưng EJS là **một trình thông dịch JavaScript**: `<% %>` chạy mã. Chạy
 * mã đến từ một file preset của người lạ là đúng thứ luật bất biến #10 cấm, và
 * là đúng thứ `quetAnToan()` tồn tại để chặn.
 *
 * Nên chỗ này thay thế macro bằng **tra bảng**, không bằng thông dịch. Cùng
 * quyết định với ADR-0003 (`lawful.dieuKien` là `ExprNode`, không phải chuỗi
 * eval) và với `mvu.ts` (`_.set(...)` đọc bằng regex trên văn bản). Macro không
 * có trong bảng thì **giữ nguyên văn** và được khai ra — không im lặng thay bằng
 * chuỗi rỗng, vì một prompt thiếu một mảnh mà không ai biết là một prompt sai mà
 * không ai gỡ được.
 *
 * [BB] 50.2 — `nhomPrompt` là MẢNG CÓ TÊN VÀ VAI TRÒ. Nhóm tắt thì bị bỏ, và
 * thứ tự khai báo được giữ nguyên: đó là thứ tự người dùng sắp trong Xưởng
 * Workflow, và nó là công cụ gỡ lỗi chính của họ.
 *
 * [BB] `core/` thuần: không mạng, không DOM, không đồng hồ máy.
 */
import type { WorkflowTask } from './schema.js';

export type Message = { readonly role: 'system' | 'user' | 'assistant'; readonly content: string };

/**
 * Bảng macro mà engine cấp cho một tác vụ.
 *
 * Cố ý hẹp. Mọi khóa ở đây đều là thứ engine giữ sổ và biết chắc; không có khóa
 * nào cho phép tác vụ hỏi những thứ nó không được thấy (54.3 lọc tầm nhìn chạy
 * trước, và nó chạy ở nơi gọi chứ không ở đây).
 */
export type BangMacro = Readonly<Record<string, string>>;

export type KetQuaBienSoanTacVu = {
  readonly messages: readonly Message[];
  /** Macro xuất hiện trong prompt mà bảng không có — vào bảng Tự Chẩn Đoán. */
  readonly macroChuaGiai: readonly string[];
  readonly soNhomBiTat: number;
};

const MAU_MACRO = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/**
 * Thay macro `{{ten}}` bằng giá trị tra bảng.
 *
 * Không đệ quy: giá trị thay vào KHÔNG được quét lại. Một giá trị chứa
 * `{{...}}` mà được quét lại là một vòng lặp mà dữ liệu người ngoài điều khiển
 * được độ sâu — cùng loại rủi ro với `deQuy` của lorebook (51.5), và ở đó nó
 * cũng bị chặn.
 */
export function thayMacro(vanBan: string, bang: BangMacro): { text: string; chuaGiai: string[] } {
  const chuaGiai = new Set<string>();
  const text = vanBan.replace(MAU_MACRO, (nguyenVan, ten: string) => {
    const v = bang[ten];
    if (v === undefined) {
      chuaGiai.add(ten);
      return nguyenVan as string;
    }
    return v;
  });
  return { text, chuaGiai: [...chuaGiai].sort() };
}

/**
 * Dựng danh sách message cho một tác vụ.
 *
 * `nguCanhTruoc` là output đã gộp của các giai đoạn trước — [BB] 50.3: *"Output
 * giai đoạn trước có mặt trong ngữ cảnh của giai đoạn sau."* Nó vào cuối vai
 * `user`, không vào `system`: nó đổi mỗi lượt, và nhét thứ đổi mỗi lượt vào
 * `system` là ném đi prefix cache của cả đường ống.
 */
export function bienSoanTacVu(input: {
  readonly task: WorkflowTask;
  readonly bang: BangMacro;
  readonly nguCanhTruoc: string;
  /** Bản sao nào trong họ; đưa vào bảng dưới tên `task.hoBanSao.bienThayThe`. */
  readonly mucId: string | null;
}): KetQuaBienSoanTacVu {
  const { task, nguCanhTruoc, mucId } = input;
  const bang: BangMacro = mucId === null ? input.bang : { ...input.bang, [task.hoBanSao.bienThayThe]: mucId };

  const messages: Message[] = [];
  const chuaGiai = new Set<string>();
  let soNhomBiTat = 0;

  for (const nhom of task.nhomPrompt) {
    if (!nhom.bat) {
      soNhomBiTat++;
      continue;
    }
    const r = thayMacro(nhom.noiDung, bang);
    for (const m of r.chuaGiai) chuaGiai.add(m);
    if (r.text.trim() === '') continue;
    messages.push({ role: nhom.vaiTro, content: r.text });
  }

  if (nguCanhTruoc.trim() !== '') {
    messages.push({
      role: 'user',
      content: `KẾT QUẢ CÁC GIAI ĐOẠN TRƯỚC (đọc, đừng lặp lại nguyên văn):\n${nguCanhTruoc}`,
    });
  }

  /*
   * Tác vụ không có nhóm prompt nào bật vẫn phải gửi được một câu.
   *
   * Nếu không, `goiTacVuWorkflow()` gửi một body rỗng và proxy trả lỗi khó hiểu
   * — trong khi nguyên nhân thật là người dùng vừa tắt hết nhóm để gỡ lỗi.
   */
  if (messages.length === 0) {
    messages.push({
      role: 'user',
      content: `Tác vụ "${task.ten}" chưa có nhóm prompt nào đang bật.`,
    });
  }

  return { messages, macroChuaGiai: [...chuaGiai].sort(), soNhomBiTat };
}
