import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NHAN_VUNG } from '../../core/bang/thienDien.js';
import { Icon } from '../design/Icon.js';
const nhan = {
    color: 'var(--mo)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};
const so = { fontSize: 13, color: 'var(--tro)' };
const phu = { fontSize: 11, color: 'var(--mo)' };
function TieuDeVung({ ten }) {
    return _jsx("h3", { style: { ...nhan, margin: '0 0 10px' }, children: ten });
}
/** [BB] 55.6 quy tắc 4 — một nét mảnh, bảy điểm, không tô, không trục, không nhãn. */
function Sparkline({ diem }) {
    if (diem.length < 2)
        return null;
    const min = Math.min(...diem);
    const max = Math.max(...diem);
    const bien = max - min || 1;
    const w = 54;
    const h = 14;
    const d = diem
        .map((v, i) => {
        const x = (i / (diem.length - 1)) * w;
        const y = h - ((v - min) / bien) * h;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
        .join(' ');
    return (_jsx("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}`, "aria-hidden": "true", style: { flex: '0 0 auto', overflow: 'visible' }, children: _jsx("path", { d: d, fill: "none", stroke: "var(--mo)", strokeWidth: "1", strokeLinejoin: "round" }) }));
}
function Delta({ delta, tangLaTot }) {
    if (delta === null || delta === 0)
        return null;
    const tot = delta > 0 === tangLaTot;
    return (_jsxs("span", { className: "chu-so", style: { fontSize: 12, color: tot ? 'var(--ngoc)' : 'var(--hoi)' }, children: [delta > 0 ? '+' : '−', Math.abs(delta)] }));
}
/** [BB] 55.6 quy tắc 6 — không thanh tô đầy. Khối `█▁` trong font số. */
function Khoi({ tyLe }) {
    const day = Math.max(0, Math.min(5, Math.round(tyLe * 5)));
    return (_jsxs("span", { className: "chu-so", style: { ...phu, letterSpacing: '0.05em' }, "aria-hidden": "true", children: ['█'.repeat(day), '▁'.repeat(5 - day)] }));
}
const NHAN_DICH = Object.freeze({
    phuc_but: 'Sổ Phục Bút',
    loi_cau: 'Hàng lời cầu',
    lo_hong: 'Bảng lỗ hổng',
    mach_truyen: 'Mạch truyện',
    doi_soat: 'Bảng Đối Soát',
    chi_so: 'Chỉ số thế giới',
    luat_nen: 'Luật Nền',
});
export function BangThienDien({ bang, onDong, onXuLy, }) {
    return (_jsxs("section", { className: "lop-phu", role: "region", "aria-label": "B\u1EA3ng Thi\u00EAn Di\u1EC5n", tabIndex: -1, onKeyDown: (e) => {
            if (e.key === 'Escape')
                onDong();
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }, children: [_jsx("h2", { className: "chu-hien", style: { margin: 0, fontSize: 22 }, children: "B\u1EA3ng Thi\u00EAn Di\u1EC5n" }), _jsx("span", { style: phu, children: "Tab ho\u1EB7c Esc \u0111\u1EC3 \u0111\u00F3ng" }), _jsx("button", { type: "button", onClick: onDong, style: {
                            marginLeft: 'auto',
                            background: 'transparent',
                            color: 'var(--tro)',
                            border: '1px solid var(--kinh-vien)',
                            borderRadius: 'var(--r-sm)',
                            padding: '5px 12px',
                            font: 'inherit',
                            fontSize: 13,
                            cursor: 'pointer',
                        }, children: "\u0110\u00F3ng" })] }), _jsxs("div", { className: "vung-bang luoi-doi", children: [_jsxs("div", { children: [_jsx(TieuDeVung, { ten: NHAN_VUNG.khi_nao }), _jsx("div", { style: so, children: bang.khiNao.moTaThoiDiem }), _jsx("div", { style: phu, children: bang.khiNao.nhip }), _jsx("div", { style: phu, children: bang.khiNao.chuyenKy })] }), _jsxs("div", { children: [_jsx(TieuDeVung, { ten: NHAN_VUNG.the_gioi_la_gi }), bang.theGioiLaGi === null ? (_jsx("p", { style: phu, children: "Ng\u01B0\u01A1i s\u1ED1ng b\u00EAn trong th\u1EBF gi\u1EDBi n\u00E0y. C\u1EA5u tr\u00FAc c\u1EE7a n\u00F3 kh\u00F4ng ph\u1EA3i th\u1EE9 nh\u00ECn t\u1EEB trong ra m\u00E0 th\u1EA5y \u0111\u01B0\u1EE3c." })) : (_jsxs("div", { style: { display: 'grid', gap: 4 }, children: [bang.theGioiLaGi.luatNen.map((t) => (_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'baseline' }, children: [_jsx("span", { style: { ...so, minWidth: 96 }, children: t.ten }), _jsx("span", { style: phu, children: t.trangThai }), _jsx("span", { style: { ...phu, flex: 1, minWidth: 0 }, children: t.ghiChu })] }, t.ten))), bang.theGioiLaGi.coChe.map((c) => (_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'baseline' }, children: [_jsx("span", { style: { ...so, minWidth: 96, color: 'var(--van)' }, children: c.ten }), _jsx("span", { style: phu, children: c.trangThai }), _jsx("span", { style: { ...phu, flex: 1, minWidth: 0 }, children: c.ghiChu })] }, c.ten)))] }))] })] }), _jsxs("div", { className: "vung-bang luoi-doi", children: [_jsxs("div", { children: [_jsx(TieuDeVung, { ten: NHAN_VUNG.co_gi_ton_tai }), bang.coGiTonTai === null ? (_jsx("p", { style: phu, children: "Kh\u00F4ng ai \u0111\u1EBFm \u0111\u01B0\u1EE3c th\u1EBF gi\u1EDBi t\u1EEB b\u00EAn trong n\u00F3. Th\u1EE9 ng\u01B0\u01A1i bi\u1EBFt n\u1EB1m trong S\u1ED5 Tay c\u1EE7a ch\u00EDnh ng\u01B0\u01A1i." })) : (_jsx("div", { style: { display: 'grid', gap: 5 }, children: bang.coGiTonTai.map((d) => (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline' }, children: [_jsx("span", { style: { ...so, flex: 1, minWidth: 0 }, children: d.nhan }), _jsx("span", { className: "chu-so", style: so, children: d.so })] }), d.phu === '' ? null : _jsx("div", { style: phu, children: d.phu })] }, d.kindId))) }))] }), _jsxs("div", { children: [_jsx(TieuDeVung, { ten: NHAN_VUNG.dang_the_nao }), bang.dangTheNao === null ? (_jsx("p", { style: phu, children: "Th\u1EBF gi\u1EDBi kh\u00F4ng t\u1EF1 b\u00E1o c\u00E1o s\u1EE9c kh\u1ECFe c\u1EE7a n\u00F3 cho ai \u0111ang s\u1ED1ng trong n\u00F3." })) : (_jsx("div", { style: { display: 'grid', gap: 6 }, children: bang.dangTheNao.map((c) => (_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center' }, children: [_jsx("span", { style: { ...so, flex: 1, minWidth: 0 }, children: c.nhan }), _jsx("span", { className: "chu-so", style: so, children: c.gia }), _jsx(Sparkline, { diem: c.chuoi }), _jsx(Delta, { delta: c.delta, tangLaTot: c.tangLaTot })] }, c.khoa))) }))] })] }), _jsxs("div", { className: "vung-bang luoi-doi", children: [_jsxs("div", { children: [_jsx(TieuDeVung, { ten: NHAN_VUNG.da_lech }), bang.daLech.length === 0 ? (_jsx("p", { style: phu, children: "Ch\u01B0a c\u00F3 th\u1EA7n tho\u1EA1i ngu\u1ED3n n\u00E0o \u0111\u01B0\u1EE3c nh\u1EADp \u0111\u1EC3 m\u00E0 \u0111\u1ED1i chi\u1EBFu." })) : (bang.daLech.map((d) => (_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline' }, children: [_jsx("span", { style: { ...so, minWidth: 110 }, children: d.nguon }), _jsx("span", { style: phu, children: d.tomTat })] }, d.nguon))))] }), _jsxs("div", { children: [_jsx(TieuDeVung, { ten: NHAN_VUNG.dang_xay_ra }), bang.dangXayRa.length === 0 ? (_jsx("p", { style: phu, children: "Th\u1EBF gi\u1EDBi v\u1EABn \u0111ang t\u1EF1 k\u1EC3 \u1EDF ngo\u00E0i t\u1EA7m nh\u00ECn." })) : (_jsx("div", { style: { display: 'grid', gap: 5 }, children: bang.dangXayRa.slice(0, 8).map((m) => (_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline' }, children: [_jsx("span", { style: { ...phu, minWidth: 62 }, children: m.daBiet ? 'đã biết' : 'chưa nghe' }), _jsx("span", { style: { ...so, flex: 1, minWidth: 0 }, children: m.ten }), _jsx("span", { style: phu, children: m.giaiDoan }), _jsx(Khoi, { tyLe: m.cangThang / 100 })] }, m.id))) }))] })] }), _jsxs("div", { className: "vung-bang luoi-doi", children: [_jsxs("div", { children: [_jsx(TieuDeVung, { ten: NHAN_VUNG.ai_dang_chu_y }), bang.aiDangChuY.length === 0 ? (_jsx("p", { style: phu, children: "Ch\u01B0a ai b\u01B0\u1EDBc ra kh\u1ECFi \u0111\u00E1m \u0111\u00F4ng." })) : (bang.aiDangChuY.map((n) => (_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline' }, children: [_jsx("span", { className: "ten-rieng", style: { ...so, flex: 1, minWidth: 0 }, children: n.ten }), _jsx("span", { style: phu, children: n.vi })] }, n.id))))] }), _jsxs("div", { children: [_jsx(TieuDeVung, { ten: NHAN_VUNG.tu_lan_truoc }), bang.tuLanTruoc.length === 0 ? (_jsx("p", { style: phu, children: "Ch\u01B0a c\u00F3 g\u00EC \u0111\u1ED5i k\u1EC3 t\u1EEB l\u1EA7n ng\u01B0\u01A1i m\u1EDF b\u1EA3ng n\u00E0y." })) : (_jsx("ul", { style: { margin: 0, paddingLeft: 16, ...so }, children: bang.tuLanTruoc.slice(0, 8).map((d) => (_jsx("li", { children: d }, d))) })), _jsx("h3", { style: { ...nhan, margin: '16px 0 8px' }, children: "C\u1EA7n ch\u00FA \u00FD" }), bang.canChuY.length === 0 ? (_jsx("p", { style: phu, children: "Kh\u00F4ng c\u00F3 vi\u1EC7c n\u00E0o \u0111ang ch\u1EDD ng\u01B0\u01A1i." })) : (_jsx("div", { style: { display: 'grid', gap: 6 }, children: bang.canChuY.slice(0, 10).map((m) => (_jsxs("button", { type: "button", onClick: () => onXuLy(m), title: `Mở ${NHAN_DICH[m.dich]}`, style: {
                                        display: 'flex',
                                        gap: 9,
                                        alignItems: 'flex-start',
                                        textAlign: 'left',
                                        background: 'transparent',
                                        border: '1px solid var(--kinh-vien)',
                                        borderRadius: 'var(--r-sm)',
                                        padding: '7px 10px',
                                        font: 'inherit',
                                        color: 'inherit',
                                        cursor: 'pointer',
                                    }, children: [_jsx(Icon, { ten: "canh_bao", co: 13, style: { color: 'var(--dong)', marginTop: 3 } }), _jsxs("span", { style: { minWidth: 0 }, children: [_jsx("span", { style: so, children: m.nhan }), _jsx("span", { style: { ...phu, display: 'block' }, children: m.vi }), _jsxs("span", { style: { ...phu, display: 'block', color: 'var(--lam)' }, children: ["m\u1EDF ", NHAN_DICH[m.dich]] })] })] }, m.id))) }))] })] })] }));
}
