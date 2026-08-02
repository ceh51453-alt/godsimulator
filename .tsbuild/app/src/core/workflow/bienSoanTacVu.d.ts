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
export type Message = {
    readonly role: 'system' | 'user' | 'assistant';
    readonly content: string;
};
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
/**
 * Thay macro `{{ten}}` bằng giá trị tra bảng.
 *
 * Không đệ quy: giá trị thay vào KHÔNG được quét lại. Một giá trị chứa
 * `{{...}}` mà được quét lại là một vòng lặp mà dữ liệu người ngoài điều khiển
 * được độ sâu — cùng loại rủi ro với `deQuy` của lorebook (51.5), và ở đó nó
 * cũng bị chặn.
 */
export declare function thayMacro(vanBan: string, bang: BangMacro): {
    text: string;
    chuaGiai: string[];
};
/**
 * Dựng danh sách message cho một tác vụ.
 *
 * `nguCanhTruoc` là output đã gộp của các giai đoạn trước — [BB] 50.3: *"Output
 * giai đoạn trước có mặt trong ngữ cảnh của giai đoạn sau."* Nó vào cuối vai
 * `user`, không vào `system`: nó đổi mỗi lượt, và nhét thứ đổi mỗi lượt vào
 * `system` là ném đi prefix cache của cả đường ống.
 */
export declare function bienSoanTacVu(input: {
    readonly task: WorkflowTask;
    readonly bang: BangMacro;
    readonly nguCanhTruoc: string;
    /** Bản sao nào trong họ; đưa vào bảng dưới tên `task.hoBanSao.bienThayThe`. */
    readonly mucId: string | null;
}): KetQuaBienSoanTacVu;
