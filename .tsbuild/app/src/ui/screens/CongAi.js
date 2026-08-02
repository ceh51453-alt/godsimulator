import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Cổng AI — màn đứng trước Khởi Nguyên (ADR-0028).
 *
 * ── Vì sao đây là màn ĐẦU TIÊN, không phải một mục trong Cài Đặt ──
 *
 * Thiên Diễn chạy bằng AI. Đặt cấu hình AI vào Cài Đặt nghĩa là để người chơi đi
 * qua Khởi Nguyên, tạo một thế giới, gõ câu đầu tiên, rồi mới gặp một hộp lỗi.
 * Cái giá của thứ tự ấy là toàn bộ ấn tượng đầu tiên. Nên nó đứng ở đây, và nó
 * nói thẳng lý do ngay dòng đầu.
 *
 * Ba cột của 46.3 giữ nguyên. Cột **Tường Thuật** là cột duy nhất bắt buộc; hai
 * cột kia tắt được, và tắt rồi thì xám lại chứ không mất dữ liệu đã nhập.
 *
 * [BB] 36.1 — không emoji. [BB] luật bất biến #9 — không dấu hiệu nào chỉ bằng màu.
 */
import { useEffect, useState } from 'react';
import { useAi, NHAN_ENDPOINT } from '../../store/ai.js';
import { doCauHinhRerank } from '../../core/schema/rerank.js';
import { DIALECTS } from '../../core/schema/ai.js';
import { thieuGiOEndpoint } from '../../core/ai/cauHinh.js';
import { Icon } from '../design/Icon.js';
const NHAN_DIALECT = {
    tu_do: 'Tự do (dạng OpenAI)',
    openai: 'OpenAI',
    gemini: 'Gemini',
    anthropic: 'Anthropic',
};
const nhanNho = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
const oNhap = {
    background: 'var(--kinh-nen-2)',
    color: 'var(--sang)',
    border: '1px solid var(--kinh-vien)',
    borderRadius: 'var(--r-sm)',
    padding: '9px 12px',
    font: 'inherit',
    fontSize: 13,
    width: '100%',
};
function nut(chinh = false, tat = false) {
    return {
        background: 'transparent',
        color: tat ? 'var(--mo)' : chinh ? 'var(--dong)' : 'var(--tro)',
        border: `1px solid ${chinh && !tat ? 'var(--dong)' : 'var(--kinh-vien)'}`,
        borderRadius: 'var(--r-sm)',
        padding: '8px 14px',
        font: 'inherit',
        fontSize: 13,
        cursor: tat ? 'not-allowed' : 'pointer',
        opacity: tat ? 0.5 : 1,
    };
}
function Truong({ nhan, children }) {
    return (_jsxs("label", { style: { display: 'grid', gap: 5 }, children: [_jsx("span", { style: nhanNho, children: nhan.toUpperCase() }), children] }));
}
function CotEndpoint({ ten, batBuoc }) {
    const cfg = useAi((s) => s.cfg);
    const dangDo = useAi((s) => s.dangDo);
    const sua = useAi((s) => s.suaEndpoint);
    const quet = useAi((s) => s.quet);
    const thu = useAi((s) => s.thu);
    const ep = cfg[ten];
    const batRieng = ten === 'narrator' ? true : cfg[ten].batRieng;
    const tat = !batRieng;
    const thieu = thieuGiOEndpoint(ep);
    return (_jsxs("section", { className: "kinh", style: { padding: 16, display: 'grid', gap: 12, alignContent: 'start', opacity: tat ? 0.55 : 1 }, children: [_jsxs("header", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("h2", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 20 }, children: NHAN_ENDPOINT[ten] }), _jsx("span", { style: { flex: 1 } }), batBuoc ? (_jsx("span", { style: { ...nhanNho, color: 'var(--dong)' }, children: "B\u1EAET BU\u1ED8C" })) : (_jsxs("label", { style: { ...nhanNho, display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: batRieng, onChange: (e) => sua(ten, { batRieng: e.target.checked }) }), "B\u1EACT RI\u00CANG"] }))] }), _jsx(Truong, { nhan: "\u0110\u1ECBa ch\u1EC9 proxy", children: _jsx("input", { style: oNhap, disabled: tat, value: ep.proxyUrl, placeholder: "https://proxy-cua-ban.example/v1", onChange: (e) => sua(ten, { proxyUrl: e.target.value }) }) }), _jsx(Truong, { nhan: "M\u1EADt kh\u1EA9u / kh\u00F3a", children: _jsx("input", { style: oNhap, type: "password", disabled: tat, value: ep.proxyPassword, placeholder: "\u0111\u1EC3 tr\u1ED1ng n\u1EBFu proxy kh\u00F4ng c\u1EA7n", onChange: (e) => sua(ten, { proxyPassword: e.target.value }) }) }), _jsx(Truong, { nhan: "Ph\u01B0\u01A1ng ng\u1EEF", children: _jsx("select", { style: oNhap, disabled: tat, value: ep.dialect, onChange: (e) => sua(ten, { dialect: e.target.value }), children: DIALECTS.map((d) => (_jsx("option", { value: d, children: NHAN_DIALECT[d] }, d))) }) }), _jsx(Truong, { nhan: "Model", children: ep.availableModels.length > 0 ? (_jsxs("select", { style: oNhap, disabled: tat, value: ep.modelId, onChange: (e) => sua(ten, { modelId: e.target.value }), children: [_jsx("option", { value: "", children: "\u2014 ch\u1ECDn m\u1ED9t model \u2014" }), ep.availableModels.map((m) => (_jsx("option", { value: m.id, children: m.ten || m.id }, m.id)))] })) : (_jsx("input", { style: oNhap, disabled: tat, value: ep.modelId, placeholder: "g\u00F5 tay ho\u1EB7c b\u1EA5m Qu\u00E9t danh s\u00E1ch", onChange: (e) => sua(ten, { modelId: e.target.value }) })) }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx("button", { style: nut(false, tat || dangDo), disabled: tat || dangDo, onClick: () => void quet(ten), children: "Qu\u00E9t danh s\u00E1ch" }), _jsx("button", { style: nut(true, tat || dangDo), disabled: tat || dangDo, onClick: () => void thu(ten), children: "Th\u1EED \u0111\u01B0\u1EDDng" })] }), _jsxs("div", { style: { ...nhanNho, display: 'grid', gap: 3 }, children: [ep.probe.daDo ? (ep.probe.thong ? (_jsxs("span", { style: { color: 'var(--ngoc)' }, children: ["\u2713 th\u00F4ng \u00B7 ", ep.probe.modelDaTraLoi, " tr\u1EA3 v\u1EC1 ", ep.probe.soKyTuTraVe, " k\u00FD t\u1EF1"] })) : (_jsxs("span", { style: { color: 'var(--hoi)' }, children: ["\u2715 ", ep.probe.maLoi, ": ", ep.probe.thongDiep] }))) : (_jsx("span", { children: "ch\u01B0a th\u1EED \u0111\u01B0\u1EDDng" })), !tat &&
                        thieu.map((t) => (_jsxs("span", { style: { color: 'var(--hoi)' }, children: ["\u00B7 ", t.thongDiep] }, t.truong)))] })] }));
}
/**
 * Tab Truy hồi — Phần 77.11.
 *
 * ── Vì sao nó nằm ở đây chứ không nằm trong Chẩn Đoán ──
 *
 * Rerank là một ĐIỂM CUỐI: nó có địa chỉ, có model, có mật khẩu, và nó tốn tiền.
 * Đặt nó cạnh ba điểm cuối kia là nói đúng bản chất của nó. Chẩn Đoán chỉ nên
 * hiện hậu quả (độ trễ, tỉ lệ fallback), không phải chỗ để gõ địa chỉ vào.
 *
 * [BB] 77.2 — `llm_listwise` CHỈ chạy khi người dùng tự chọn: nó dùng chính model
 * kể chuyện để xếp hạng, tức nhân đôi số call mà người chơi không hề biết.
 */
function TabTruyHoi() {
    const rr = useAi((s) => s.cfg.rerank);
    const suaRerank = useAi((s) => s.suaRerank);
    const tk = useAi((s) => s.thongKeTruyHoi);
    const machRerank = useAi((s) => s.machRerank);
    const kq = doCauHinhRerank(rr);
    const tyLeFallback = tk.soLan === 0 ? 0 : tk.soFallback / tk.soLan;
    const doTre = tk.soLan === 0 ? 0 : tk.tongLatencyMs / tk.soLan;
    return (_jsxs("section", { className: "kinh hien-panel", style: { padding: 18, marginTop: 22, display: 'grid', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }, children: [_jsx("h2", { style: { ...nhanNho, margin: 0, textTransform: 'uppercase' }, children: "Truy h\u1ED3i" }), _jsx("span", { style: { color: 'var(--mo)', fontSize: 12 }, children: "X\u1EBFp l\u1EA1i th\u1EE9 t\u1EF1 \u0111i\u1EC1u ch\u1EE7 th\u1EC3 \u0110\u01AF\u1EE2C PH\u00C9P bi\u1EBFt. T\u1EAFt n\u00F3 th\u00EC l\u01B0\u1EE3t ch\u01A1i v\u1EABn ch\u1EA1y b\u1EB1ng heuristic." })] }), _jsxs("div", { style: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }, children: [_jsxs("label", { style: { display: 'grid', gap: 4 }, children: [_jsx("span", { style: nhanNho, children: "CH\u1EBE \u0110\u1ED8" }), _jsxs("select", { style: { ...oNhap, width: 'auto' }, value: rr.endpoint.mode, onChange: (e) => suaRerank({ endpoint: { ...rr.endpoint, mode: e.target.value } }), children: [_jsx("option", { value: "heuristic", children: "Heuristic (kh\u00F4ng m\u1EA1ng)" }), _jsx("option", { value: "auto", children: "T\u1EF1 ch\u1ECDn" }), _jsx("option", { value: "proxy_cross_encoder", children: "Proxy rerank chuy\u00EAn d\u1EE5ng" }), _jsx("option", { value: "llm_listwise", children: "Nh\u1EDD model x\u1EBFp h\u1EA1ng (\u0111\u1EAFt)" }), _jsx("option", { value: "local_cross_encoder", children: "C\u1EE5c b\u1ED9 (ch\u01B0a c\u00F3 b\u1EA3n c\u00E0i)" })] })] }), _jsxs("label", { style: { display: 'grid', gap: 4, flex: 1, minWidth: 220 }, children: [_jsx("span", { style: nhanNho, children: "\u0110\u1ECAA CH\u1EC8 PROXY RERANK" }), _jsx("input", { style: oNhap, placeholder: "\u0111\u1EC3 tr\u1ED1ng n\u1EBFu d\u00F9ng heuristic", value: rr.endpoint.proxyUrl, onChange: (e) => suaRerank({ endpoint: { ...rr.endpoint, proxyUrl: e.target.value } }) })] }), _jsxs("label", { style: { display: 'grid', gap: 4 }, children: [_jsx("span", { style: nhanNho, children: "MODEL" }), _jsx("input", { style: { ...oNhap, width: 160 }, value: rr.endpoint.modelId, onChange: (e) => suaRerank({ endpoint: { ...rr.endpoint, modelId: e.target.value } }) })] }), _jsxs("label", { style: { display: 'grid', gap: 4 }, children: [_jsx("span", { style: nhanNho, children: "\u1EE8NG VI\u00CAN / GI\u1EEE L\u1EA0I" }), _jsxs("div", { style: { display: 'flex', gap: 6 }, children: [_jsx("input", { style: { ...oNhap, width: 70 }, type: "number", value: rr.candidateK, onChange: (e) => suaRerank({ candidateK: Number(e.target.value) }) }), _jsx("input", { style: { ...oNhap, width: 70 }, type: "number", value: rr.outputK, onChange: (e) => suaRerank({ outputK: Number(e.target.value) }) })] })] })] }), kq.canhBao.map((c) => (_jsx("p", { style: { color: 'var(--van)', fontSize: 12, margin: 0 }, children: c }, c))), machRerank.moMach && (_jsxs("p", { style: { color: 'var(--van)', fontSize: 12, margin: 0 }, children: ["\u0110\u00E3 ng\u1EAFt m\u1EA1ch reranker sau ", machRerank.hongLienTiep, " l\u1EA7n h\u1ECFng (", machRerank.lyDoCuoi, "). C\u00F2n", ' ', machRerank.conBoQua, " l\u01B0\u1EE3t truy h\u1ED3i n\u1EEFa m\u1EDBi th\u1EED l\u1EA1i. L\u01B0\u1EE3t ch\u01A1i kh\u00F4ng b\u1ECB ch\u1EB7n."] })), _jsx("div", { style: { ...nhanNho, color: 'var(--tro)' }, children: tk.soLan === 0
                    ? 'Chưa có lượt truy hồi nào trong phiên này.'
                    : `${tk.soLan} lượt · độ trễ trung bình ${Math.round(doTre)} ms · ` +
                        `rơi về heuristic ${Math.round(tyLeFallback * 100)}% · ` +
                        `dùng lại cache ${Math.round((tk.soCacheHit / tk.soLan) * 100)}% · ` +
                        `dữ liệu vượt quyền lọt ra: ${tk.tongForbidden}` })] }));
}
export function CongAi() {
    const napTuDia = useAi((s) => s.napTuDia);
    const daNap = useAi((s) => s.daNap);
    const cong = useAi((s) => s.cong());
    const tinNhan = useAi((s) => s.tinNhan);
    const sao = useAi((s) => s.sao);
    const datLai = useAi((s) => s.datLai);
    const moLaiMach = useAi((s) => s.moLaiMach);
    const [nguon, setNguon] = useState('narrator');
    const [dich, setDich] = useState('updater');
    useEffect(() => {
        void napTuDia();
    }, [napTuDia]);
    if (!daNap) {
        return (_jsx("main", { style: { maxWidth: 1180, margin: '0 auto', padding: '56px 20px' }, children: _jsx("p", { style: { color: 'var(--mo)' }, children: "\u0110ang \u0111\u1ECDc c\u1EA5u h\u00ECnh \u0111\u00E3 l\u01B0u\u2026" }) }));
    }
    return (_jsxs("main", { style: { maxWidth: 1180, margin: '0 auto', padding: '48px 20px 80px' }, children: [_jsx("p", { style: { ...nhanNho, margin: 0 }, children: "THI\u00CAN DI\u1EC4N" }), _jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 34, margin: '6px 0 10px', fontWeight: 500 }, children: "C\u1ED5ng AI" }), _jsxs("p", { style: { color: 'var(--tro)', marginTop: 0, maxWidth: 720, lineHeight: 1.6 }, children: ["Thi\u00EAn Di\u1EC5n kh\u00F4ng ph\u1EA3i m\u1ED9t m\u00F4 ph\u1ECFng c\u00F3 th\u00EAm ph\u1EA7n k\u1EC3 chuy\u1EC7n. Engine gi\u1EEF s\u1ED5 \u2014 d\u00E2n s\u1ED1, m\u00F9a m\u00E0ng, l\u1EDDi c\u1EA7u, quy k\u1EBFt domain \u2014 nh\u01B0ng ", _jsx("strong", { children: "m\u1ECDi th\u1EE9 b\u1EA1n nh\u00ECn th\u1EA5y \u0111\u1EC1u do m\u1ED9t model vi\u1EBFt ra" }), ", t\u1EEB c\u00E2u \u0111\u1EA7u ti\u00EAn c\u1EE7a th\u1EBF gi\u1EDBi cho t\u1EDBi c\u00E1ch m\u1ED9t v\u1ECB th\u1EA7n \u0111\u00E1p l\u1EA1i. Ch\u01B0a n\u1ED1i \u0111\u01B0\u1EE3c model th\u00EC ch\u01B0a c\u00F3 g\u00EC \u0111\u1EC3 ch\u01A1i, n\u00EAn m\u00E0n n\u00E0y \u0111\u1EE9ng tr\u01B0\u1EDBc Kh\u1EDFi Nguy\u00EAn ch\u1EE9 kh\u00F4ng n\u1EB1m trong C\u00E0i \u0110\u1EB7t."] }), cong.trangThai === 'dut_duong' && (_jsxs("div", { role: "alert", className: "kinh", style: { padding: 14, margin: '18px 0', borderLeft: '2px solid var(--hoi)' }, children: [_jsxs("div", { style: { display: 'flex', gap: 9, alignItems: 'flex-start' }, children: [_jsx(Icon, { ten: "canh_bao", co: 16, style: { color: 'var(--hoi)', marginTop: 2 } }), _jsx("div", { style: { color: 'var(--hoi)', fontSize: 13, display: 'grid', gap: 4 }, children: cong.lyDo.map((l) => (_jsx("div", { children: l }, l))) })] }), _jsx("button", { style: { ...nut(true), marginTop: 10 }, onClick: moLaiMach, children: "Th\u1EED l\u1EA1i \u0111\u01B0\u1EDDng" })] })), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                    gap: 14,
                    marginTop: 22,
                }, children: [_jsx(CotEndpoint, { ten: "narrator", batBuoc: true }), _jsx(CotEndpoint, { ten: "updater", batBuoc: false }), _jsx(CotEndpoint, { ten: "workflow", batBuoc: false })] }), _jsx(TabTruyHoi, {}), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }, children: [_jsx("span", { style: nhanNho, children: "SAO C\u1EA4U H\u00CCNH" }), _jsx("select", { style: { ...oNhap, width: 'auto' }, value: nguon, onChange: (e) => setNguon(e.target.value), children: ['narrator', 'updater', 'workflow'].map((t) => (_jsx("option", { value: t, children: NHAN_ENDPOINT[t] }, t))) }), _jsx("span", { style: { color: 'var(--mo)' }, children: "\u2192" }), _jsx("select", { style: { ...oNhap, width: 'auto' }, value: dich, onChange: (e) => setDich(e.target.value), children: ['narrator', 'updater', 'workflow'].map((t) => (_jsx("option", { value: t, children: NHAN_ENDPOINT[t] }, t))) }), _jsx("button", { style: nut(), disabled: nguon === dich, onClick: () => sao(nguon, dich), children: "Sao" }), _jsx("span", { style: { flex: 1 } }), _jsx("button", { style: nut(), onClick: datLai, children: "Kh\u00F4i ph\u1EE5c m\u1EB7c \u0111\u1ECBnh" })] }), tinNhan !== '' && (_jsx("p", { style: { color: 'var(--tro)', fontSize: 13, marginTop: 12 }, role: "status", children: tinNhan })), _jsxs("footer", { style: { marginTop: 26, borderTop: '1px solid var(--kinh-vien)', paddingTop: 18 }, children: [cong.choPhepChoi ? (_jsx("p", { style: { color: 'var(--ngoc)', fontSize: 14, margin: 0 }, children: "\u0110\u01B0\u1EDDng \u0111\u00E3 th\u00F4ng. B\u1EA5m ti\u1EBFp \u0111\u1EC3 v\u00E0o Kh\u1EDFi Nguy\u00EAn." })) : (_jsx("ul", { style: { margin: 0, paddingLeft: 18, color: 'var(--tro)', fontSize: 13 }, children: cong.viecCanLam.map((t) => (_jsx("li", { children: t.thongDiep }, `${t.truong}:${t.thongDiep}`))) })), _jsx("p", { style: { ...nhanNho, marginTop: 14 }, children: "M\u1EADt kh\u1EA9u proxy ch\u1EC9 n\u1EB1m tr\u00EAn m\u00E1y n\u00E0y. N\u00F3 kh\u00F4ng \u0111i v\u00E0o file save, kh\u00F4ng \u0111i v\u00E0o b\u1EA3n xu\u1EA5t, v\u00E0 kh\u00F4ng \u0111\u01B0\u1EE3c g\u1EEDi t\u1EDBi \u0111\u00E2u ngo\u00E0i ch\u00EDnh \u0111\u1ECBa ch\u1EC9 b\u1EA1n v\u1EEBa nh\u1EADp." })] })] }));
}
