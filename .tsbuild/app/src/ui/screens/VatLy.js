import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Vật Lý Thế Giới — Phần 43, 44. Màn thứ nhất trong ba màn còn nợ.
 *
 * ── Điều màn này phải nói cho được ──
 *
 * [BB] 43.2 — thế giới **luôn** vận hành theo một cấu hình nào đó. Bảy trục nền
 * có giá trị ngay từ nhịp 0. Nhưng:
 *
 * > "Trước khi được đặt tên, thời gian vẫn trôi một chiều — nhưng không ai lợi
 * > dụng được điều đó, vì lợi dụng đòi hỏi phải biết luật."
 *
 * Nên `vo_danh` **không phải** "chưa cấu hình" và cũng không phải một ô trống chờ
 * điền. Nó là một trạng thái có thật của thế giới, và bảng dưới đây phải hiện
 * tham số của một trục vô danh y như trục có tên — chỉ khác ở chỗ trục vô danh
 * không có kẽ hở nào, vì kẽ hở là thứ chỉ tồn tại khi có người biết luật.
 *
 * Đó cũng là lý do cột "Kẽ hở" trống ở trục vô danh không được hiển thị như một
 * thiếu sót.
 */
import { useMemo, useState } from 'react';
import { useGame } from '../../store/game.js';
import { TRUC_NEN, PHU_THUOC_TRUC, KHAI_NIEM_NEN_CUA_TRUC } from '../../core/vatly/schema.js';
import { NHAN_TRUC_NEN, daCoTen } from '../../core/vatly/luatNen.js';
import { CO_CHE } from '../../core/vatly/coChe.js';
import { nut, nhanNho, the, oNhap } from '../design/kieu.js';
function Khoi({ ten, phu, children }) {
    return (_jsxs("section", { style: { display: 'grid', gap: 10 }, children: [_jsxs("header", { children: [_jsx("h2", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }, children: ten }), phu !== undefined && _jsx("p", { style: { margin: '2px 0 0', color: 'var(--mo)', fontSize: 13 }, children: phu })] }), children] }));
}
function TrucNenDong({ truc }) {
    const state = useGame((s) => s.state);
    const datTen = useGame((s) => s.datTenTrucNen);
    const [moForm, setMoForm] = useState(false);
    const [khaiNiem, setKhaiNiem] = useState('');
    const [chan, setChan] = useState([]);
    const ds = useMemo(() => (state === null ? [] : [...state.substrateLaws.values()]), [state]);
    const ln = ds.find((x) => x.truc === truc);
    const coTen = ln?.trangThai === 'co_ten';
    /**
     * Khái niệm đủ điều kiện làm nền cho trục này.
     *
     * Lọc ngay ở đây thay vì để `datTenTruc()` từ chối sau: 43.3 đòi khái niệm nền
     * ít nhất `thanh_hinh`, và đưa người chơi một danh sách rồi từ chối mọi lựa
     * chọn trong đó là cách chắc chắn nhất để họ nghĩ tính năng bị hỏng.
     */
    const ungVien = useMemo(() => {
        if (state === null)
            return [];
        const hopLe = KHAI_NIEM_NEN_CUA_TRUC[truc];
        return [...state.entities.values()].filter((e) => {
            if (e.kind !== 'concept')
                return false;
            const c = e.aspects['conceptual'];
            if (c?.giaiDoan === 'hu_danh' || c?.giaiDoan === 'manh_nha')
                return false;
            return hopLe.some((h) => e.id.includes(h) || e.tags.includes(h));
        });
    }, [state, truc]);
    const phuThuoc = PHU_THUOC_TRUC[truc];
    const thieuPhuThuoc = phuThuoc.filter((t) => !daCoTen(ds, t));
    return (_jsxs("li", { style: { ...the, display: 'grid', gap: 8 }, children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }, children: [_jsx("strong", { style: { fontFamily: 'var(--chu-hien)', fontSize: 18 }, children: NHAN_TRUC_NEN[truc] }), _jsx("span", { style: { ...nhanNho, color: coTen ? 'var(--ngoc)' : 'var(--mo)' }, children: coTen ? 'ĐÃ ĐẶT TÊN' : 'CÒN VÔ DANH' }), _jsx("span", { style: { flex: 1 } }), coTen && ln?.tickDatTen !== null && ln !== undefined && (_jsxs("span", { style: { ...nhanNho, textTransform: 'none' }, children: ["\u0111\u1EB7t t\u00EAn \u1EDF nh\u1ECBp ", ln.tickDatTen] }))] }), ln !== undefined && Object.keys(ln.thamSo).length > 0 && (_jsx("dl", { style: { margin: 0, display: 'grid', gap: 3, fontSize: 13 }, children: Object.entries(ln.thamSo).map(([k, v]) => (_jsxs("div", { style: { display: 'flex', gap: 10 }, children: [_jsx("dt", { style: { color: 'var(--mo)', minWidth: 160 }, children: k }), _jsx("dd", { style: { margin: 0, color: 'var(--tro)', fontFamily: 'var(--chu-so)' }, children: String(v) })] }, k))) })), coTen ? (ln !== undefined && ln.keHo.length > 0 ? (_jsxs("div", { children: [_jsx("span", { style: nhanNho, children: "K\u1EBC H\u1EDE \u0110\u00C3 M\u1EDE RA" }), _jsx("ul", { style: { margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--tro)' }, children: ln.keHo.map((k, i) => (_jsxs("li", { children: [k.moTa, k.daBiKhaiThac ? ' — đã có người khai thác' : ''] }, i))) })] })) : null) : (_jsx("p", { style: { margin: 0, fontSize: 13, color: 'var(--mo)' }, children: "Tr\u1EE5c n\u00E0y v\u1EABn \u0111ang v\u1EADn h\u00E0nh theo tham s\u1ED1 tr\u00EAn. Ch\u01B0a ai g\u1ECDi t\u00EAn n\u00F3, n\u00EAn ch\u01B0a ai l\u1EE3i d\u1EE5ng \u0111\u01B0\u1EE3c n\u00F3 \u2014 l\u1EE3i d\u1EE5ng \u0111\u00F2i h\u1ECFi ph\u1EA3i bi\u1EBFt lu\u1EADt." })), !coTen && (_jsx("div", { style: { display: 'grid', gap: 8 }, children: thieuPhuThuoc.length > 0 ? (_jsxs("p", { style: { margin: 0, fontSize: 13, color: 'var(--tro)' }, children: ["Ch\u01B0a \u0111\u1EB7t t\u00EAn \u0111\u01B0\u1EE3c: ", thieuPhuThuoc.map((t) => NHAN_TRUC_NEN[t]).join(' và '), " c\u00F2n v\u00F4 danh. Th\u1EE9 t\u1EF1 ph\u1EE5 thu\u1ED9c kh\u00F4ng ph\u1EA3i quy \u01B0\u1EDBc \u2014 n\u00F3 l\u00E0 \u0111i\u1EC1u ki\u1EC7n \u0111\u1EC3 c\u00E2u \u1EA5y c\u00F3 ngh\u0129a."] })) : moForm ? (_jsxs(_Fragment, { children: [_jsxs("label", { style: { display: 'grid', gap: 5 }, children: [_jsx("span", { style: nhanNho, children: "KH\u00C1I NI\u1EC6M N\u1EC0N" }), ungVien.length === 0 ? (_jsxs("span", { style: { fontSize: 13, color: 'var(--tro)' }, children: ["Th\u1EBF gi\u1EDBi ch\u01B0a c\u00F3 kh\u00E1i ni\u1EC7m n\u00E0o \u0111\u1EE7 th\u00E0nh h\u00ECnh \u0111\u1EC3 l\u00E0m n\u1EC1n cho tr\u1EE5c n\u00E0y. C\u1EA7n m\u1ED9t trong:", ' ', KHAI_NIEM_NEN_CUA_TRUC[truc].join(', '), "."] })) : (_jsxs("select", { style: oNhap, value: khaiNiem, onChange: (e) => setKhaiNiem(e.target.value), children: [_jsx("option", { value: "", children: "\u2014 ch\u1ECDn \u2014" }), ungVien.map((e) => (_jsx("option", { value: e.id, children: e.ten }, e.id)))] }))] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "button", style: nut(true, khaiNiem === ''), disabled: khaiNiem === '', onClick: () => {
                                        const l = datTen(truc, khaiNiem);
                                        setChan(l);
                                        if (l.length === 0)
                                            setMoForm(false);
                                    }, children: "\u0110\u1EB7t t\u00EAn tr\u1EE5c n\u00E0y" }), _jsx("button", { type: "button", style: nut(), onClick: () => setMoForm(false), children: "Th\u00F4i" })] }), chan.length > 0 && (_jsx("ul", { style: { margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--hoi)' }, children: chan.map((c, i) => (_jsx("li", { children: c }, i))) }))] })) : (_jsx("button", { type: "button", style: { ...nut(), justifySelf: 'start' }, onClick: () => setMoForm(true), children: "\u0110\u1EB7t t\u00EAn tr\u1EE5c n\u00E0y" })) }))] }));
}
export function VatLy() {
    const state = useGame((s) => s.state);
    const quet = useGame((s) => s.quetCoCheNgay);
    const [congBo, setCongBo] = useState([]);
    const [daQuet, setDaQuet] = useState(false);
    const coCheRows = useMemo(() => (state === null ? [] : [...state.coChe.values()]), [state]);
    const soCoTen = useMemo(() => state === null ? 0 : [...state.substrateLaws.values()].filter((x) => x.trangThai === 'co_ten').length, [state]);
    if (state === null) {
        return (_jsxs("main", { style: { maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px' }, children: [_jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 30, margin: 0 }, children: "V\u1EADt L\u00FD Th\u1EBF Gi\u1EDBi" }), _jsx("p", { style: { color: 'var(--tro)' }, children: "Lu\u1EADt N\u1EC1n thu\u1ED9c v\u1EC1 m\u1ED9t th\u1EBF gi\u1EDBi c\u1EE5 th\u1EC3 v\u00E0 fork theo nh\u00E1nh. H\u00E3y m\u1EDF m\u1ED9t v\u00E1n tr\u01B0\u1EDBc." })] }));
    }
    return (_jsxs("main", { style: { maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 28 }, children: [_jsxs("header", { children: [_jsx("p", { style: nhanNho, children: "KH\u1ED0I L \u00B7 PH\u1EA6N 43 \u2013 44" }), _jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }, children: "V\u1EADt L\u00FD Th\u1EBF Gi\u1EDBi" }), _jsxs("p", { style: { color: 'var(--tro)', margin: 0, fontSize: 14 }, children: ["B\u1EA3y tr\u1EE5c n\u1EC1n, ", _jsx("b", { children: soCoTen }), " \u0111\u00E3 \u0111\u01B0\u1EE3c \u0111\u1EB7t t\u00EAn. Hi\u1EC3u bi\u1EBFt t\u1EA1o ra v\u1EADt l\u00FD, v\u00E0 v\u1EADt l\u00FD t\u1EA1o ra k\u1EBD h\u1EDF \u2014 \u0111\u1EB7t t\u00EAn m\u1ED9t tr\u1EE5c l\u00E0 m\u1EDF ra c\u1EA3 hai."] })] }), _jsx(Khoi, { ten: "B\u1EA3y tr\u1EE5c Lu\u1EADt N\u1EC1n", phu: "S\u1EEDa m\u1ED9t tr\u1EE5c \u0111\u00E3 \u0111\u1EB7t t\u00EAn LU\u00D4N b\u1EAFt t\u00E1ch nh\u00E1nh m\u1EDBi (43.6) \u2014 kh\u00F4ng c\u00F3 \u0111\u01B0\u1EDDng vi\u1EBFt \u0111\u00E8 l\u00EAn d\u00F2ng th\u1EDDi gian n\u00E0y.", children: _jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }, children: TRUC_NEN.map((t) => (_jsx(TrucNenDong, { truc: t }, t))) }) }), _jsxs(Khoi, { ten: "C\u01A1 ch\u1EBF ph\u00E1i sinh", phu: "Kh\u00F4ng b\u1EADt b\u1EB1ng c\u00F4ng t\u1EAFc. Ch\u00FAng xu\u1EA5t hi\u1EC7n khi Lu\u1EADt N\u1EC1n \u0111\u1EE7 \u0111i\u1EC1u ki\u1EC7n, v\u00E0 bi\u1EBFn m\u1EA5t khi \u0111i\u1EC1u ki\u1EC7n v\u1EE1.", children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nut(true), onClick: () => {
                                    setCongBo(quet());
                                    setDaQuet(true);
                                }, children: "Qu\u00E9t l\u1EA1i \u0111i\u1EC1u ki\u1EC7n" }), _jsx("span", { style: { ...nhanNho, textTransform: 'none' }, children: daQuet
                                    ? congBo.length === 0
                                        ? 'Không cơ chế nào đổi trạng thái.'
                                        : `${congBo.length} cơ chế vừa đổi — xem khung kể.`
                                    : 'Engine tự quét ở mốc cuối kỷ nguyên; nút này để xem ngay.' })] }), _jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }, children: Object.keys(CO_CHE).sort().map((id) => {
                            const dn = CO_CHE[id];
                            const row = coCheRows.find((r) => r.id === id);
                            const bat = row?.bat === true;
                            return (_jsxs("li", { style: { ...the, display: 'grid', gap: 6 }, children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }, children: [_jsx("strong", { style: { fontFamily: 'var(--chu-hien)', fontSize: 18 }, children: dn.ten }), _jsx("span", { style: { ...nhanNho, color: bat ? 'var(--ngoc)' : 'var(--mo)' }, children: bat ? 'ĐANG CÓ MẶT' : 'CHƯA TỒN TẠI' })] }), _jsx("p", { style: { margin: 0, fontSize: 13, color: 'var(--tro)' }, children: bat ? dn.moTaKhiCo : dn.moTaKhiKhong }), !bat && row !== undefined && row.conThieu.length > 0 && (_jsxs("div", { children: [_jsx("span", { style: nhanNho, children: "C\u00D2N THI\u1EBEU" }), _jsx("ul", { style: { margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--tro)' }, children: row.conThieu.map((c, i) => (_jsx("li", { children: c }, i))) })] })), row === undefined && (_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--mo)' }, children: "Ch\u01B0a qu\u00E9t l\u1EA7n n\u00E0o tr\u00EAn nh\u00E1nh n\u00E0y." }))] }, id));
                        }) })] })] }));
}
