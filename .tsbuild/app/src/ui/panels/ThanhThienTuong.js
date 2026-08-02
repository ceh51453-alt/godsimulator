import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Thanh Thiên Tượng — Phần 55.2, 58.11.
 *
 * Một dòng, luôn hiện, đỉnh Sảnh. Nó trả lời đúng ba câu mà người chơi hỏi liên
 * tục: *đang là lúc nào, thế giới có ổn không, đang xem chuyện gì.*
 *
 * ── Vì sao thanh này KHÔNG còn là một cái nút lớn ──
 *
 * Trước Phase 12 cả thanh là một `<button>`, và `thanhThienTuong()` đọc `anh.ghim`
 * đúng — nhưng **không có đường nào để thêm một mục ghim**. Nguyên nhân là chính
 * cái nút ấy: nút không lồng trong nút được, nên không có chỗ đặt điều khiển
 * ghim. Nay thanh là một `<div>`, phần cụm là một nút, và ghim có nút riêng.
 *
 * [BB] 58.11 — vượt trần thì **yêu cầu bỏ một mục**, không tự bỏ mục cũ nhất.
 * Câu yêu cầu ấy do store dựng (`loiGhim`) và hiện ngay trong bảng chọn.
 *
 * [BB] 55.6 quy tắc 1 — số dùng `--chu-so` cỡ 13 màu `--tro`; nhãn cỡ 11 màu
 * `--mo`, giãn chữ 0.08em.
 * [BB] 55.6 quy tắc 5 — delta hiện bằng DẤU và SỐ, không bằng mũi tên tô đặc.
 * [BB] Luật bất biến #9 — không cụm nào chỉ dựa vào màu; mỗi cụm đều có chữ.
 */
import { useState } from 'react';
const nhan = {
    color: 'var(--mo)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};
const gia = { fontSize: 13, color: 'var(--tro)' };
/** Cụm luôn có mặt theo 55.2 — không ghim và không bỏ ghim được. */
const CUM_CO_DINH = new Set(['khi_nao', 'thucTai', 'songDong', 'mach', 'can_chu_y']);
/**
 * Delta.
 *
 * `tangLaTot` quyết định màu, không phải dấu: phụ thuộc tăng là chuyện xấu, và
 * tô nó màu xác nhận sẽ nói ngược điều thế giới đang nói. Dấu và số luôn hiện,
 * nên đọc được cả khi không phân biệt được màu.
 */
function Delta({ delta, tangLaTot }) {
    if (delta === 0)
        return null;
    const tot = delta > 0 === tangLaTot;
    return (_jsxs("span", { className: "chu-so", style: { fontSize: 12, color: tot ? 'var(--ngoc)' : 'var(--hoi)' }, title: tot ? 'đang đi theo hướng tốt' : 'đang đi theo hướng xấu', children: [delta > 0 ? '+' : '−', Math.abs(delta)] }));
}
export function ThanhThienTuong({ cum, ghimDuoc = [], dangGhim = [], loiGhim = '', onMoBang, onGhim, onBoGhim, }) {
    const [moChon, setMoChon] = useState(false);
    const coGhim = onGhim !== undefined && onBoGhim !== undefined && ghimDuoc.length > 0;
    return (_jsxs("div", { style: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 22px',
            borderBottom: '1px solid var(--kinh-vien)',
        }, children: [_jsx("button", { type: "button", onClick: onMoBang, "aria-label": "M\u1EDF B\u1EA3ng Thi\u00EAn Di\u1EC5n", title: "M\u1EDF B\u1EA3ng Thi\u00EAn Di\u1EC5n (ph\u00EDm Tab)", style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 22,
                    flexWrap: 'wrap',
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    font: 'inherit',
                    cursor: 'pointer',
                }, children: cum.map((c) => (_jsxs("span", { style: { display: 'inline-flex', alignItems: 'baseline', gap: 7, minWidth: 0 }, 
                    /*
                     * Chuột phải để bỏ ghim ngay tại chỗ — nhanh hơn mở bảng chọn.
                     *
                     * Nó là lối TẮT, không phải lối duy nhất: mọi thứ làm được ở đây đều
                     * làm được bằng bàn phím qua nút "Ghim" bên phải. Một tính năng chỉ
                     * có ở chuột phải là một tính năng người dùng bàn phím không có.
                     */
                    onContextMenu: coGhim && !CUM_CO_DINH.has(c.id)
                        ? (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onBoGhim(c.id);
                        }
                        : undefined, title: coGhim && !CUM_CO_DINH.has(c.id) ? `${c.nhan} — chuột phải để bỏ ghim` : c.nhan, children: [_jsx("span", { style: nhan, children: c.nhan }), _jsx("span", { className: "chu-so", style: gia, children: c.gia }), c.delta === null ? null : _jsx(Delta, { delta: c.delta, tangLaTot: c.tangLaTot })] }, c.id))) }), coGhim && (_jsxs("button", { type: "button", "aria-expanded": moChon, "aria-label": "Ch\u1ECDn ch\u1EC9 s\u1ED1 ghim l\u00EAn thanh", onClick: () => setMoChon(!moChon), style: {
                    ...nhan,
                    background: moChon ? 'var(--kinh-nen-2)' : 'transparent',
                    border: '1px solid var(--kinh-vien)',
                    borderRadius: 'var(--r-sm)',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    flex: '0 0 auto',
                }, children: ["Ghim ", dangGhim.length > 0 ? `(${dangGhim.length})` : ''] })), _jsx("span", { style: { ...nhan, flex: '0 0 auto' }, children: "Tab \u0111\u1EC3 m\u1EDF b\u1EA3ng" }), moChon && coGhim && (_jsxs("div", { role: "dialog", "aria-label": "Ch\u1EC9 s\u1ED1 ghim", style: {
                    position: 'absolute',
                    top: '100%',
                    right: 22,
                    zIndex: 5,
                    minWidth: 260,
                    maxHeight: 320,
                    overflowY: 'auto',
                    background: 'var(--nen-1)',
                    border: '1px solid var(--kinh-sang)',
                    borderRadius: 'var(--r-md)',
                    padding: 12,
                    display: 'grid',
                    gap: 6,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
                }, children: [_jsx("span", { style: nhan, children: "Ghim l\u00EAn thanh" }), ghimDuoc.map((m) => {
                        const daGhim = dangGhim.includes(m.khoa);
                        const coDinh = CUM_CO_DINH.has(m.khoa);
                        return (_jsxs("label", { style: {
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                fontSize: 13,
                                color: coDinh ? 'var(--mo)' : 'var(--tro)',
                                cursor: coDinh ? 'default' : 'pointer',
                            }, children: [_jsx("input", { type: "checkbox", checked: daGhim || coDinh, disabled: coDinh, onChange: (e) => (e.target.checked ? onGhim(m.khoa) : onBoGhim(m.khoa)) }), _jsxs("span", { children: [m.nhan, coDinh ? ' — luôn hiện' : ''] })] }, m.khoa));
                    }), loiGhim !== '' && (_jsx("p", { role: "alert", style: { margin: '4px 0 0', fontSize: 12, color: 'var(--hoi)' }, children: loiGhim })), _jsx("button", { type: "button", onClick: () => setMoChon(false), style: {
                            ...nhan,
                            justifySelf: 'start',
                            marginTop: 4,
                            background: 'transparent',
                            border: '1px solid var(--kinh-vien)',
                            borderRadius: 'var(--r-sm)',
                            padding: '4px 10px',
                            cursor: 'pointer',
                        }, children: "Xong" })] }))] }));
}
