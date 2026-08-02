import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const nhanNho = {
    color: 'var(--mo)',
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
};
const dong = { fontSize: 14, lineHeight: 1.7, color: 'var(--tro)', margin: 0 };
function Muc({ nhan, children }) {
    return (_jsxs("section", { style: { display: 'grid', gap: 6 }, children: [_jsx("h3", { style: { ...nhanNho, margin: 0 }, children: nhan }), children] }));
}
export function SoTayPanel({ so }) {
    return (_jsxs("article", { className: "kinh", "aria-label": "S\u1ED5 tay c\u1EE7a nh\u00E2n v\u1EADt", style: {
            padding: '20px 22px',
            display: 'grid',
            gap: 18,
            // Giấy, không phải bảng điều khiển: một cột, chữ liền, không có ô số nào.
            maxWidth: 620,
            fontFamily: 'var(--chu-ke)',
        }, children: [_jsxs("header", { style: { display: 'grid', gap: 4 }, children: [_jsx("span", { style: nhanNho, children: "S\u1ED5 Tay" }), so.moDau.map((c) => (_jsx("p", { style: { ...dong, color: 'var(--sang)', fontSize: 16 }, children: c }, c))), so.dangLam !== '' && (_jsxs("p", { style: { ...dong, color: 'var(--mo)', fontStyle: 'italic' }, children: ["L\u00FAc n\u00E0y ta \u0111ang ", so.dangLam, "."] }))] }), so.than.length > 0 && (_jsx(Muc, { nhan: "Th\u00E2n ta", children: so.than.map((c) => (_jsx("p", { style: dong, children: c }, c))) })), so.quen.length > 0 && (_jsx(Muc, { nhan: "Ng\u01B0\u1EDDi ta quen", children: _jsx("div", { style: { display: 'grid', gap: 7 }, children: so.quen.map((q) => (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '9rem 1fr', gap: 10 }, children: [_jsxs("span", { className: "ten-rieng", style: { fontSize: 14, color: 'var(--dong)' }, children: [q.ten, q.xungHo !== '' && _jsx("span", { style: { ...nhanNho, display: 'block' }, children: q.xungHo })] }), _jsxs("span", { style: { ...dong, fontSize: 13 }, children: [q.anTuong || '—', q.laHuyenThoai && (_jsx("span", { style: { ...nhanNho, display: 'block' }, children: "ta ch\u1EC9 nghe k\u1EC3 v\u1EC1 ng\u01B0\u1EDDi n\u00E0y" }))] })] }, q.ten))) }) })), so.tin.length > 0 && (_jsx(Muc, { nhan: "\u0110i\u1EC1u ta tin", children: so.tin.map((c) => (_jsx("p", { style: dong, children: c }, c))) })), so.nghe.length > 0 && (_jsx(Muc, { nhan: "\u0110i\u1EC1u ta nghe \u0111\u01B0\u1EE3c", children: _jsx("div", { style: { display: 'grid', gap: 5 }, children: so.nghe.map((t, i) => (_jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'baseline' }, children: [_jsx("span", { style: { ...dong, flex: 1, fontSize: 13 }, children: t.noiDung }), _jsxs("span", { style: { ...nhanNho, whiteSpace: 'nowrap' }, children: ["(", t.doTin, ")"] })] }, `${t.noiDung}-${i}`))) }) })), so.muon.length > 0 && (_jsx(Muc, { nhan: "\u0110i\u1EC1u ta mu\u1ED1n", children: _jsx("div", { style: { display: 'grid', gap: 5 }, children: so.muon.map((m) => (_jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'baseline' }, children: [_jsx("span", { style: { ...dong, flex: 1, fontSize: 13 }, children: m.noiDung }), _jsx("span", { style: { ...nhanNho, whiteSpace: 'nowrap' }, children: m.xong ? 'xong' : 'chưa xong' })] }, m.noiDung))) }) }))] }));
}
