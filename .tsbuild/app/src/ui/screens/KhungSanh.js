import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Icon } from '../design/Icon.js';
const nhanNho = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
function nutRail(bat) {
    return {
        width: 40,
        height: 40,
        display: 'grid',
        placeItems: 'center',
        background: bat ? 'var(--kinh-nen-2)' : 'transparent',
        color: bat ? 'var(--dong)' : 'var(--mo)',
        border: `1px solid ${bat ? 'var(--kinh-vien)' : 'transparent'}`,
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
        padding: 0,
        transition: `color var(--thoi-luong) var(--duong-cong)`,
    };
}
export function KhungSanh({ tieuDe, phuDe, rail, dauTrang, thanhTren, giua, phai, lopPhu, }) {
    return (_jsxs("div", { style: { height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [_jsxs("header", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 22px',
                    borderBottom: '1px solid var(--kinh-vien)',
                    flexWrap: 'wrap',
                }, children: [_jsx(Icon, { ten: "tinh_do", co: 22, style: { color: 'var(--dong)', flex: '0 0 auto' } }), _jsxs("div", { style: { minWidth: 0 }, children: [_jsx("h1", { className: "chu-hien", style: { margin: 0, fontSize: 24, lineHeight: 1.2, whiteSpace: 'nowrap' }, children: tieuDe }), _jsx("p", { style: { ...nhanNho, margin: 0 }, children: phuDe })] }), _jsx("div", { style: {
                            marginLeft: 'auto',
                            display: 'flex',
                            gap: 10,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }, children: dauTrang })] }), thanhTren, _jsxs("div", { className: "khung-sanh", children: [_jsx("nav", { "aria-label": "Khu v\u1EF1c", className: "khung-sanh__rail", children: rail.map((m) => (_jsx("button", { type: "button", "aria-label": m.nhan, "aria-pressed": m.bat === true, title: m.nhan, style: nutRail(m.bat === true), onClick: m.onChon, children: _jsx(Icon, { ten: m.icon, co: 19 }) }, m.id))) }), _jsxs("main", { style: {
                            flex: '1 1 auto',
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                        }, children: [giua, lopPhu] }), _jsx("aside", { "aria-label": "Tr\u1EA1ng th\u00E1i", className: "khung-sanh__phai", children: phai })] })] }));
}
/** Chip hành động gợi ý — [BB] 67.7: gợi ý, KHÔNG phải biên giới. */
export function ChipHanhDong({ nhan, icon, onChon, }) {
    return (_jsxs("button", { type: "button", onClick: onChon, style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'transparent',
            color: 'var(--tro)',
            border: '1px solid var(--kinh-vien)',
            borderRadius: 999,
            padding: '7px 14px',
            font: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
        }, children: [_jsx(Icon, { ten: icon, co: 14 }), nhan] }));
}
