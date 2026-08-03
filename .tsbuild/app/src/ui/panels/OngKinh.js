import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Icon } from '../design/Icon.js';
const nhanNho = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
const dong = { display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13 };
const NHAN_GIAI_DOAN = {
    am_i: 'âm ỉ',
    khoi: 'khởi',
    phat_trien: 'phát triển',
    cao_trao: 'cao trào',
    ha_man: 'hạ màn',
    du_am: 'dư âm',
    chet_yeu: 'chết yểu',
};
const NHAN_LY_DO = {
    semantic: 'gần nghĩa',
    graph: 'nhân quả',
    precedent: 'tiền lệ',
    trust: 'đáng tin',
    recency: 'vừa xảy ra',
    diversity: 'khác nguồn',
};
const NHAN_MODE = {
    heuristic: 'heuristic',
    local_cross_encoder: 'cục bộ',
    proxy_cross_encoder: 'proxy',
    llm_listwise: 'listwise',
    auto: 'tự chọn',
};
function nutNho(dang = false) {
    return {
        background: 'transparent',
        color: dang ? 'var(--dong)' : 'var(--tro)',
        border: `1px solid ${dang ? 'var(--dong)' : 'var(--kinh-vien)'}`,
        borderRadius: 'var(--r-sm)',
        padding: '3px 8px',
        fontSize: 12,
        cursor: 'pointer',
    };
}
export function PanelOngKinh(du) {
    const th = du.truyHoi;
    return (_jsxs("section", { className: "kinh hien-panel", style: { padding: 16, display: 'grid', gap: 12 }, children: [_jsxs("header", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Icon, { ten: "khai_niem", co: 16, style: { color: 'var(--van)' } }), _jsx("h2", { style: { ...nhanNho, margin: 0, textTransform: 'uppercase' }, children: "\u1ED0ng k\u00EDnh" })] }), _jsxs("div", { style: { display: 'grid', gap: 4 }, children: [_jsx("div", { style: { fontSize: 14 }, children: du.machDangChieu
                            ? `“${du.machDangChieu.ten}” — ${NHAN_GIAI_DOAN[du.machDangChieu.giaiDoan] ?? du.machDangChieu.giaiDoan}`
                            : 'Đang nhìn theo người chơi' }), du.viChieu !== '' && _jsx("div", { style: { ...nhanNho, lineHeight: 1.5 }, children: du.viChieu }), du.machDangChieu && du.machDangChieu.nutThatChuaGo.length > 0 && (_jsxs("div", { style: { ...nhanNho, color: 'var(--van)' }, children: ["Ch\u01B0a g\u1EE1: ", du.machDangChieu.nutThatChuaGo.join(' · ')] }))] }), du.machKhac.length > 0 && (_jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx("span", { style: nhanNho, children: "CH\u0128A SANG (kh\u00F4ng t\u1ED1n l\u01B0\u1EE3t, kh\u00F4ng t\u1ED1n th\u1EDDi gian trong game)" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 }, children: [_jsx("button", { type: "button", style: nutNho(du.machDangChieu === null), onClick: du.onTuDong, children: "T\u1EF1 \u0111\u1ED9ng" }), du.machKhac.slice(0, 6).map((m) => (_jsx("button", { type: "button", style: nutNho(m.id === du.machDangChieu?.id), onClick: () => du.onChia(m.id), title: m.kyUcMach, children: m.ten }, m.id)))] }), (du.nhanVatGan.length > 0 || du.vungGan.length > 0) && (_jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 }, children: [du.vungGan.slice(0, 3).map((v) => (_jsxs("button", { type: "button", style: nutNho(), onClick: () => du.onChiaVung(v.id), children: ["\u1EDF ", v.ten] }, v.id))), du.nhanVatGan.slice(0, 4).map((n) => (_jsxs("button", { type: "button", style: nutNho(), onClick: () => du.onChiaNhanVat(n.id), children: ["theo ", n.ten] }, n.id)))] }))] })), _jsxs("div", { style: { display: 'grid', gap: 4 }, children: [_jsx("span", { style: nhanNho, children: "TH\u1EBE GI\u1EDAI NGO\u00C0I NG\u01AF\u1EDCI CH\u01A0I" }), _jsxs("div", { style: dong, children: [_jsx("span", { "aria-hidden": true, style: {
                                    width: 8,
                                    height: 8,
                                    borderRadius: 8,
                                    background: du.vangMat.dat ? 'var(--ngoc)' : 'var(--van)',
                                } }), _jsx("span", { style: { flex: 1 }, children: du.vangMat.thongDiep })] })] }), th && (_jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx("span", { style: nhanNho, children: "TRUY H\u1ED2I L\u01AF\u1EE2T V\u1EEAA R\u1ED2I" }), _jsxs("div", { style: { ...nhanNho, color: 'var(--tro)' }, children: [NHAN_MODE[th.run.modeUsed] ?? th.run.modeUsed, " \u00B7 ", th.run.candidateCount, " \u1EE9ng vi\u00EAn \u2192", ' ', th.run.selectedCount, " ch\u1ECDn \u00B7 ", Math.round(th.run.latencyMs), " ms", th.run.cacheHit ? ' · dùng lại cache' : ''] }), th.run.fallbackReason !== '' && (_jsxs("div", { style: { ...nhanNho, color: 'var(--van)' }, children: ["\u0110\u00E3 r\u01A1i v\u1EC1 heuristic: ", th.run.fallbackReason, ". L\u01B0\u1EE3t ch\u01A1i kh\u00F4ng b\u1ECB ch\u1EB7n."] })), _jsx("div", { style: { display: 'grid', gap: 4 }, children: th.daChon.slice(0, 6).map((c, i) => {
                            const ly = (th.lyDo.get(c.id) ?? []).map((x) => NHAN_LY_DO[x] ?? x);
                            return (_jsxs("div", { style: { ...dong, alignItems: 'flex-start' }, children: [_jsx("span", { style: { ...nhanNho, minWidth: 16 }, children: i + 1 }), _jsxs("span", { style: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.5 }, children: [c.projectedText.slice(0, 90), c.projectedText.length > 90 ? '…' : '', c.daBopMeo && _jsx("span", { style: { ...nhanNho, color: 'var(--van)' }, children: " \u00B7 nghe k\u1EC3 l\u1EA1i" }), ly.length > 0 && _jsxs("span", { style: nhanNho, children: [" \u00B7 ", ly.join(', ')] })] })] }, c.id));
                        }) }), (th.biCat.length > 0 || du.vetCatToken.length > 0) && (_jsxs("div", { style: { ...nhanNho, color: 'var(--mo)' }, children: ["\u0110\u00E3 c\u1EAFt v\u00EC ng\u00E2n s\u00E1ch: ", th.biCat.filter((b) => b.vi.includes('ngân sách')).length, " chunk", du.vetCatToken.length > 0 && `, ${du.vetCatToken.map((v) => `tầng ${v.tang}`).join(', ')}`, "."] })), th.chunkCamLotVao.length > 0 && (_jsxs("div", { style: { fontSize: 12, color: 'var(--hoi)' }, children: ["L\u1ED6I NGHI\u00CAM TR\u1ECCNG: ", th.chunkCamLotVao.length, " m\u1EA9u d\u1EEF li\u1EC7u v\u01B0\u1EE3t quy\u1EC1n \u0111\u00E3 l\u1ECDt v\u00E0o ng\u1EEF c\u1EA3nh."] })), th.canhBao.map((c) => (_jsx("div", { style: { ...nhanNho, color: 'var(--van)' }, children: c }, c)))] })), _jsxs("div", { style: { display: 'grid', gap: 6, borderTop: '1px solid var(--kinh-vien)', paddingTop: 10 }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nutNho(), disabled: du.dangDanhGia, onClick: du.onDanhGia, children: du.dangDanhGia ? 'Đang đo…' : 'Chạy bộ đánh giá' }), _jsx("span", { style: nhanNho, children: "\u0111o tr\u00EAn ch\u00EDnh th\u1EBF gi\u1EDBi n\u00E0y, kh\u00F4ng t\u1ED1n l\u01B0\u1EE3t" })] }), du.danhGia && (_jsxs("div", { style: { display: 'grid', gap: 4 }, children: [_jsx("div", { style: { ...nhanNho, color: 'var(--tro)' }, children: du.danhGia.moTa }), du.danhGia.cong.map((c) => (_jsxs("div", { style: { ...dong, fontSize: 12 }, children: [_jsx("span", { "aria-hidden": true, style: {
                                            width: 8,
                                            height: 8,
                                            borderRadius: 8,
                                            background: c.dat ? 'var(--ngoc)' : 'var(--hoi)',
                                        } }), _jsxs("span", { style: { flex: 1 }, children: [c.dat ? 'đạt' : 'HỎNG', " \u00B7 ", c.ten] }), _jsx("span", { style: nhanNho, children: c.chiTiet })] }, c.ten)))] }))] })] }));
}
