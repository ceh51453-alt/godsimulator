import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Icon } from '../design/Icon.js';
import { NHAN_TRANG_THAI_DOMAIN } from '../../core/schema/aspect/thanVi.js';
import { BAN_TINH_TRUC } from '../../core/schema/aspect/soul.js';
import { NHAN_TRUC } from '../../core/than/diHoa.js';
const nhan = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
const so = { fontFamily: 'var(--chu-so)', fontVariantNumeric: 'tabular-nums' };
const MAU_TRANG_THAI = {
    held: 'var(--ngoc)',
    contested: 'var(--dong)',
    dormant: 'var(--mo)',
    fragmented: 'var(--van)',
    transformed: 'var(--van)',
    merged: 'var(--lam)',
    lost: 'var(--hoi)',
    reclaimable: 'var(--lam)',
};
/**
 * Ba tính từ mô tả một vector bản tính.
 *
 * [BB] 56.4 in ra CHỮ, không in ra số: "nghiêm khắc, công bằng, xa cách".
 * Người chơi phải so được hai dòng bằng mắt mà không phải trừ hai con số.
 */
function batTinhTu(v) {
    const manh = BAN_TINH_TRUC.map((truc) => ({ truc, giaTri: v[truc] ?? 0 }))
        .filter((x) => Math.abs(x.giaTri) >= 12)
        .sort((a, b) => Math.abs(b.giaTri) - Math.abs(a.giaTri))
        .slice(0, 3)
        .map((x) => (x.giaTri >= 0 ? NHAN_TRUC[x.truc][1] : NHAN_TRUC[x.truc][0]));
    return manh.length > 0 ? manh.join(', ') : 'chưa rõ hình';
}
/** Trục mà hai dòng lệch nhau nhiều nhất — chỗ đáng nhìn nhất. */
function trucLechNhat(a, b) {
    let ten = null;
    let max = 12;
    for (const truc of BAN_TINH_TRUC) {
        const d = Math.abs((a[truc] ?? 0) - (b[truc] ?? 0));
        if (d > max) {
            max = d;
            ten = truc;
        }
    }
    return ten;
}
export function BangLanhDia({ du }) {
    const lech = trucLechNhat(du.coreSelf, du.followerImage);
    const nang = du.doLech >= 40;
    return (_jsxs("section", { className: "kinh hien-panel", style: { padding: 16, display: 'grid', gap: 14 }, children: [_jsxs("header", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Icon, { ten: "vuong_mien", co: 16, style: { color: 'var(--dong)' } }), _jsx("h2", { style: { ...nhan, margin: 0, textTransform: 'uppercase' }, children: "B\u1EA3ng L\u00E3nh \u0110\u1ECBa" })] }), _jsxs("div", { style: { display: 'grid', gap: 6 }, children: [du.domains.length === 0 && (_jsx("p", { style: { margin: 0, color: 'var(--mo)', fontSize: 13 }, children: "Ch\u01B0a ai quy cho ng\u01B0\u01A1i \u0111i\u1EC1u g\u00EC. L\u00E3nh \u0111\u1ECBa c\u00F2n tr\u1ED1ng." })), du.domains.map((d) => (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 10 }, children: [_jsx("span", { className: "ten-rieng", style: { fontSize: 14 }, children: d.ten }), _jsx("span", { style: { ...so, fontSize: 14, color: 'var(--sang)' }, children: Math.round(d.suc) }), _jsx("span", { style: { fontSize: 11, color: MAU_TRANG_THAI[d.trangThai] }, children: NHAN_TRANG_THAI_DOMAIN[d.trangThai] })] }, d.ten)))] }), _jsx("hr", { style: { border: 0, borderTop: '1px solid var(--kinh-vien)', margin: 0 } }), _jsx("div", { style: { display: 'grid', gap: 4, fontSize: 13 }, children: [
                    ['Tín đồ', `~${du.soTinDo.toLocaleString('vi-VN')}`],
                    ['Đền', String(du.soDen)],
                    ['Hiển thánh', String(Math.round(du.hienThanh))],
                ].map(([k, v]) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx("span", { style: { color: 'var(--tro)' }, children: k }), _jsx("span", { style: so, children: v })] }, k))) }), _jsxs("div", { className: "kinh--cap2", style: {
                    padding: 12,
                    display: 'grid',
                    gap: 8,
                    borderLeft: `2px solid ${nang ? 'var(--hoi)' : 'var(--kinh-vien)'}`,
                }, children: [_jsxs("div", { style: { display: 'grid', gap: 2 }, children: [_jsx("span", { style: nhan, children: "T\u00CDN \u0110\u1ED2 TIN TA" }), _jsx("span", { style: { fontFamily: 'var(--chu-hien)', fontSize: 17 }, children: batTinhTu(du.followerImage) })] }), _jsxs("div", { style: { display: 'grid', gap: 2 }, children: [_jsx("span", { style: nhan, children: "TA TH\u1EACT S\u1EF0 L\u00C0" }), _jsx("span", { style: {
                                    fontFamily: 'var(--chu-hien)',
                                    fontSize: 17,
                                    color: nang ? 'var(--hoi)' : 'var(--sang)',
                                }, children: batTinhTu(du.coreSelf) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("span", { style: { ...nhan, display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx(Icon, { ten: "di_hoa", co: 13 }), "l\u1EC7ch"] }), _jsx("span", { style: { ...so, fontSize: 14, color: nang ? 'var(--hoi)' : 'var(--tro)' }, children: Math.round(du.doLech) })] }), nang && (_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--tro)', lineHeight: 1.5 }, children: lech
                            ? `Người ta đang kể về một vị thần ${(du.followerImage[lech] ?? 0) >= 0
                                ? NHAN_TRUC[lech][1]
                                : NHAN_TRUC[lech][0]} hơn ngươi.`
                            : 'Hình ngươi trong miệng người khác đang rời khỏi ngươi.' }))] }), _jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx("span", { style: nhan, children: "NGO\u00C0I L\u00C3NH \u0110\u1ECAA \u2014 NGHE K\u1EC2 L\u1EA0I" }), du.ngoaiLanhDia.length === 0 && (_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--mo)' }, children: "Ch\u01B0a c\u00F3 tin n\u00E0o t\u1EEB xa t\u1EDBi." })), du.ngoaiLanhDia.map((t, i) => (_jsxs("div", { style: { fontSize: 12, color: 'var(--tro)', lineHeight: 1.5 }, children: [t.noiDung, _jsxs("div", { style: { color: 'var(--mo)', fontSize: 11 }, children: [t.soNguon === 1 ? '— chỉ một nguồn' : `— ${t.soNguon} nguồn, số liệu vênh nhau`, t.daXacNhan ? '' : ', chưa xác nhận'] })] }, i)))] })] }));
}
