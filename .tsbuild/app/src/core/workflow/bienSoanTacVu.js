const MAU_MACRO = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
/**
 * Thay macro `{{ten}}` bằng giá trị tra bảng.
 *
 * Không đệ quy: giá trị thay vào KHÔNG được quét lại. Một giá trị chứa
 * `{{...}}` mà được quét lại là một vòng lặp mà dữ liệu người ngoài điều khiển
 * được độ sâu — cùng loại rủi ro với `deQuy` của lorebook (51.5), và ở đó nó
 * cũng bị chặn.
 */
export function thayMacro(vanBan, bang) {
    const chuaGiai = new Set();
    const text = vanBan.replace(MAU_MACRO, (nguyenVan, ten) => {
        const v = bang[ten];
        if (v === undefined) {
            chuaGiai.add(ten);
            return nguyenVan;
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
export function bienSoanTacVu(input) {
    const { task, nguCanhTruoc, mucId } = input;
    const bang = mucId === null ? input.bang : { ...input.bang, [task.hoBanSao.bienThayThe]: mucId };
    const messages = [];
    const chuaGiai = new Set();
    let soNhomBiTat = 0;
    for (const nhom of task.nhomPrompt) {
        if (!nhom.bat) {
            soNhomBiTat++;
            continue;
        }
        const r = thayMacro(nhom.noiDung, bang);
        for (const m of r.chuaGiai)
            chuaGiai.add(m);
        if (r.text.trim() === '')
            continue;
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
