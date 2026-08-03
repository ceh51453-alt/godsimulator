import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * `<LuaChon>` — Render danh sách lựa chọn từ `<choice>` block.
 *
 * Preset SillyTavern ("Tide Choice") tạo `<choice>` block trong output AI.
 * Component này parse chúng thành buttons tương tác. Click → gửi ngay hoặc
 * điền vào ô input.
 *
 * [BB] 36.1 — không emoji trong nút. Sử dụng số thứ tự thay thế.
 * [BB] luật bất biến #9 — không dấu hiệu nào chỉ bằng màu.
 */
import { useState, useCallback } from 'react';
const CONTAINER = {
    background: 'var(--kinh-nen)',
    border: '1px solid var(--kinh-vien)',
    borderRadius: 'var(--r-md)',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
};
const HEADER = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottom: '1px solid var(--kinh-vien)',
    marginBottom: 4,
};
const HEADER_TITLE = {
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--mo)',
    flex: 1,
};
const TOGGLE_LABEL = {
    fontSize: 11,
    color: 'var(--mo)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
};
function nutChon(tat) {
    return {
        background: 'transparent',
        color: tat ? 'var(--mo)' : 'var(--tro)',
        border: '1px solid var(--kinh-vien)',
        borderRadius: 'var(--r-sm)',
        padding: '10px 14px',
        font: 'inherit',
        fontSize: 13,
        cursor: tat ? 'not-allowed' : 'pointer',
        opacity: tat ? 0.5 : 1,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        transition: 'border-color 0.15s, color 0.15s',
    };
}
const INDEX_BADGE = {
    fontSize: 11,
    background: 'var(--kinh-nen-2)',
    padding: '2px 8px',
    borderRadius: 'var(--r-sm)',
    minWidth: 28,
    textAlign: 'center',
    color: 'var(--mo)',
    fontFamily: 'monospace',
};
export default function LuaChon({ luaChon, onChon, dangKe }) {
    const [guiTrucTiep, setGuiTrucTiep] = useState(true);
    const xuLyChon = useCallback((text) => {
        if (dangKe)
            return;
        onChon(text);
    }, [dangKe, onChon]);
    if (luaChon.length === 0)
        return null;
    return (_jsxs("div", { style: CONTAINER, children: [_jsxs("div", { style: HEADER, children: [_jsx("span", { style: HEADER_TITLE, children: "Lua chon hanh dong" }), _jsxs("label", { style: TOGGLE_LABEL, children: [_jsx("input", { type: "checkbox", checked: guiTrucTiep, onChange: (e) => setGuiTrucTiep(e.target.checked) }), "Gui truc tiep"] })] }), luaChon.map((lc, i) => (_jsxs("button", { style: nutChon(dangKe), disabled: dangKe, onClick: () => xuLyChon(lc), type: "button", children: [_jsx("span", { style: INDEX_BADGE, children: String(i + 1).padStart(2, '0') }), _jsx("span", { children: lc })] }, i)))] }));
}
