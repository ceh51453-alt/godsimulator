import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Icon } from '../design/Icon.js';
import { HAU_QUA_TRA_LOI } from '../../core/schema/than.js';
/** Bốn cách của bảng 22.3, cộng `tra_gia`. Thứ tự cố định để cơ bắp nhớ được. */
const CACH = [
    { id: 'ban_phuoc', nhan: 'Ban phước', goiY: 'Gỡ đúng thứ đang chặn họ. Họ sẽ xin lần nữa.' },
    { id: 'dau_hieu', nhan: 'Cho dấu hiệu', goiY: 'Không giải quyết gì. Họ tự hiểu, và có thể hiểu sai.' },
    { id: 'lam_ngo', nhan: 'Làm ngơ', goiY: 'Im lặng. Thất vọng tích lại và có ngưỡng.' },
    { id: 'trung_phat', nhan: 'Trừng phạt', goiY: 'Họ nhận điều không xin. Từ nay cầu vì sợ.' },
];
const nhan = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
function nutTraLoi(chinh) {
    return {
        flex: '1 1 0',
        minWidth: 0,
        background: 'transparent',
        color: chinh ? 'var(--dong)' : 'var(--tro)',
        border: `1px solid ${chinh ? 'var(--dong)' : 'var(--kinh-vien)'}`,
        borderRadius: 'var(--r-sm)',
        padding: '7px 8px',
        font: 'inherit',
        fontSize: 12,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    };
}
export function TheCauNguyen({ cau, tenNguoiCau, tick, onTraLoi, }) {
    const conLai = cau.hanChot === null ? null : cau.hanChot - tick;
    const gap = conLai !== null && conLai <= 3;
    return (_jsxs("article", { className: "kinh--cap2", style: { padding: 12, display: 'grid', gap: 9 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }, children: [_jsx("span", { className: "ten-rieng", style: { fontSize: 13 }, children: tenNguoiCau }), _jsx("span", { style: { ...nhan, color: gap ? 'var(--hoi)' : 'var(--mo)', whiteSpace: 'nowrap' }, children: conLai === null ? 'không hạn' : conLai <= 0 ? 'đã quá hạn' : `còn ${conLai} nhịp` })] }), _jsx("p", { style: { margin: 0, fontSize: 13, lineHeight: 1.5 }, children: cau.noiDung }), cau.soNguoi > 1 && (_jsxs("span", { style: { ...nhan, color: 'var(--tro)' }, children: [cau.soNguoi.toLocaleString('vi-VN'), " ng\u01B0\u1EDDi c\u00F9ng c\u1EA7u"] })), _jsx("div", { role: "img", "aria-label": `Cường độ ${Math.round(cau.cuongDo)} trên 100`, style: { height: 2, background: 'var(--kinh-vien)', borderRadius: 2 }, children: _jsx("div", { style: {
                        height: '100%',
                        width: `${Math.max(2, Math.min(100, cau.cuongDo))}%`,
                        background: 'var(--dong)',
                        borderRadius: 2,
                    } }) }), _jsx("div", { style: { display: 'flex', gap: 6 }, children: CACH.map((c) => (_jsx("button", { type: "button", style: nutTraLoi(c.id === 'ban_phuoc'), title: `${c.nhan} — ${c.goiY}`, onClick: () => onTraLoi(c.id), children: c.nhan }, c.id))) })] }));
}
export function KhungCauNguyen({ ds, tenCua, tick, onTraLoi, }) {
    return (_jsxs("section", { className: "kinh hien-panel", style: { padding: 16, display: 'grid', gap: 12 }, children: [_jsxs("header", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Icon, { ten: "cau_nguyen", co: 16, style: { color: 'var(--dong)' } }), _jsx("h2", { style: { ...nhan, margin: 0, textTransform: 'uppercase' }, children: "L\u1EDDi c\u1EA7u" }), ds.length > 0 && (_jsx("span", { style: { ...nhan, marginLeft: 'auto', fontFamily: 'var(--chu-so)' }, children: ds.length }))] }), ds.length === 0 ? (
            // [BB] 36.7 — màn hình rỗng là lời mời, không phải thông báo lỗi.
            _jsx("p", { style: { margin: 0, fontSize: 13, color: 'var(--mo)', lineHeight: 1.5 }, children: "Ch\u01B0a ai g\u1ECDi t\u00EAn ng\u01B0\u01A1i. Ng\u01B0\u1EDDi ta v\u1EABn t\u1EF1 xoay x\u1EDF \u0111\u01B0\u1EE3c." })) : (_jsx("div", { style: { display: 'grid', gap: 10 }, children: ds.slice(0, 6).map((c) => (_jsx(TheCauNguyen, { cau: c, tenNguoiCau: tenCua(c.nguoiCauId), tick: tick, onTraLoi: (cach) => onTraLoi(c, cach) }, c.id))) })), ds.length > 0 && (_jsxs("p", { style: { margin: 0, fontSize: 11, color: 'var(--mo)', lineHeight: 1.5 }, children: ["C\u1EA3 b\u1ED1n c\u00E1ch \u0111\u1EC1u \u0111\u1EC3 l\u1EA1i d\u1EA5u. ", HAU_QUA_TRA_LOI.lam_ngo.nhan, " c\u0169ng l\u00E0 m\u1ED9t c\u00E2u tr\u1EA3 l\u1EDDi."] }))] }));
}
