import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Lorebook, Bảng Đối Soát và Bản Đồ Dị Biệt — Phần 51.7, 35.6.
 *
 * ── Một trong bốn màn còn nợ từ Phase 11 ──
 *
 * Phase 10 dựng đủ máy móc: `nhapLorebook()` đọc ba định dạng, `doiSoatEntry()`
 * phân loại bốn quan hệ, `banDoDiBiet()` dựng hồ sơ lệch. Không màn nào gọi tới
 * chúng, nên trong hai phase liền một lorebook nhập vào là một file nằm im.
 *
 * ── Ba khối, và thứ tự của chúng có nghĩa ──
 *
 *   Sách        — cái gì đang bật, và bật thì nó ảnh hưởng ra sao
 *   Đối soát    — [BB] 51.2 Sử thắng Nguồn: chỗ hai bên nói khác nhau
 *   Dị biệt     — [BB] 35.6 "không phải bảng lỗi", mà là hồ sơ thế giới đã
 *                 trở thành cái gì
 *
 * Đọc từ dưới lên cũng được, nhưng đọc từ trên xuống mới thấy được vì sao một
 * kỳ vọng lệch: vì một entry bị che, vì một sách bị tắt, hoặc vì thế giới đã đi
 * lối khác. Ba khối ngược lại thì mất mạch ấy.
 */
import { useMemo, useRef, useState } from 'react';
import { useGame } from '../../store/game.js';
import { bangDoiSoat, doiSoatEntry } from '../../core/lore/doiSoat.js';
import { banDoDiBiet } from '../../core/lore/kyVong.js';
import { duocNap } from '../../core/lore/tinCay.js';
import { nut, nhanNho, the } from '../design/kieu.js';
const NHAN_NGUON = Object.freeze({
    nguoi_dung: 'Nguồn — bạn nhập',
    tu_sinh: 'Sử — thế giới tự ghi',
    di_san: 'Di sản — mang từ ván trước',
});
const NHAN_KY_VONG = Object.freeze({
    cho: 'đang chờ',
    da_thoa: 'đã thành',
    da_lech: 'đã lệch',
    bat_kha: 'không còn khả thi',
});
function Khoi({ ten, phu, children }) {
    return (_jsxs("section", { style: { display: 'grid', gap: 10 }, children: [_jsxs("header", { children: [_jsx("h2", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }, children: ten }), phu !== undefined && _jsx("p", { style: { margin: '2px 0 0', color: 'var(--mo)', fontSize: 13 }, children: phu })] }), children] }));
}
export function Lorebook() {
    const state = useGame((s) => s.state);
    const nhap = useGame((s) => s.nhapLorebookTuChuoi);
    const bat = useGame((s) => s.batLorebook);
    const oFile = useRef(null);
    const [tin, setTin] = useState('');
    const sach = useMemo(() => (state === null ? [] : [...state.lorebooks.values()]), [state]);
    /**
     * Đối soát chạy trên entry của sách ĐANG BẬT.
     *
     * Sách tắt không tham gia: nó không vào prompt, nên nó không mâu thuẫn được
     * với ai cả. Đối soát một sách đã tắt sẽ dựng một bảng đầy mâu thuẫn mà người
     * chơi không có cách nào xử lý — đúng loại báo động giả 51.7 muốn tránh.
     */
    const bang = useMemo(() => {
        const coNguon = [];
        for (const lb of sach) {
            if (!lb.bat)
                continue;
            for (const e of lb.entries) {
                if (e.trangThai === 'da_xoa')
                    continue;
                coNguon.push({ entry: e, lorebookId: lb.id, nguon: lb.nguon });
            }
        }
        const ds = coNguon.flatMap((m) => doiSoatEntry(m, coNguon));
        // Mỗi cặp bị duyệt hai lần (A với B, rồi B với A) — gộp theo cặp không thứ tự.
        const daThay = new Set();
        const mot = ds.filter((d) => {
            const k = d.moiId < d.cuId ? `${d.moiId}|${d.cuId}` : `${d.cuId}|${d.moiId}`;
            if (daThay.has(k))
                return false;
            daThay.add(k);
            return true;
        });
        return bangDoiSoat(mot, state?.world.year ?? 0, coNguon.length);
    }, [sach, state]);
    const banDo = useMemo(() => {
        if (state === null)
            return null;
        return banDoDiBiet([...state.loreExpectations.values()], [...state.diBan.values()], state);
    }, [state]);
    if (state === null) {
        return (_jsxs("main", { style: { maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px' }, children: [_jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 30, margin: 0 }, children: "Lorebook" }), _jsx("p", { style: { color: 'var(--tro)' }, children: "Lorebook thu\u1ED9c v\u1EC1 m\u1ED9t th\u1EBF gi\u1EDBi c\u1EE5 th\u1EC3 \u2014 n\u00F3 fork theo nh\u00E1nh nh\u01B0 m\u1ECDi th\u1EE9 kh\u00E1c c\u00F3 tr\u1EA1ng th\u00E1i. H\u00E3y m\u1EDF m\u1ED9t v\u00E1n tr\u01B0\u1EDBc, r\u1ED3i quay l\u1EA1i \u0111\u00E2y." })] }));
    }
    return (_jsxs("main", { style: { maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 28 }, children: [_jsxs("header", { children: [_jsx("p", { style: nhanNho, children: "KH\u1ED0I L \u00B7 PH\u1EA6N 51 \u2013 53" }), _jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }, children: "Lorebook v\u00E0 \u0110\u1ED1i So\u00E1t" }), _jsxs("p", { style: { color: 'var(--tro)', margin: 0, fontSize: 14 }, children: ["S\u00E1ch b\u1EA1n nh\u1EADp l\u00E0 ", _jsx("b", { children: "Ngu\u1ED3n" }), ": \u0111i\u1EC1u th\u1EBF gi\u1EDBi l\u1EBD ra ph\u1EA3i tr\u1EDF th\u00E0nh. S\u00E1ch th\u1EBF gi\u1EDBi t\u1EF1 ghi l\u00E0 ", _jsx("b", { children: "S\u1EED" }), ": \u0111i\u1EC1u n\u00F3 \u0111\u00E3 th\u1EF1c s\u1EF1 tr\u1EDF th\u00E0nh. M\u00E2u thu\u1EABn th\u00EC S\u1EED th\u1EAFng \u2014 kh\u00F4ng ph\u1EA3i v\u00EC S\u1EED \u0111\u00FAng h\u01A1n, m\u00E0 v\u00EC kh\u00F4ng \u0111\u01B0\u1EE3c n\u00F3i d\u1ED1i v\u1EC1 chuy\u1EC7n \u0111\u00E3 r\u1ED3i."] })] }), _jsxs(Khoi, { ten: "S\u00E1ch", phu: `${sach.length} sách trên nhánh này · ${sach.filter((s) => s.bat).length} đang bật`, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nut(true), onClick: () => oFile.current?.click(), children: "Nh\u1EADp lorebook (.json)" }), _jsx("input", { ref: oFile, type: "file", accept: "application/json,.json", style: { display: 'none' }, onChange: (e) => {
                                    const f = e.target.files?.[0];
                                    e.target.value = '';
                                    if (!f)
                                        return;
                                    void (async () => {
                                        const ok = await nhap(await f.text(), f.name.replace(/\.json$/i, ''));
                                        setTin(ok ? `Đã nhập "${f.name}".` : `Không nhập được "${f.name}" — xem lỗi ở Tự Chẩn Đoán.`);
                                    })();
                                } }), _jsx("span", { style: { ...nhanNho, textTransform: 'none' }, children: "H\u1ED7 tr\u1EE3 SillyTavern V2, V3 v\u00E0 \u0111\u1ECBnh d\u1EA1ng Thi\u00EAn Di\u1EC5n." })] }), tin !== '' && _jsx("p", { style: { color: 'var(--tro)', fontSize: 13, margin: 0 }, children: tin }), sach.length === 0 ? (_jsx("p", { style: { color: 'var(--mo)', fontSize: 13, margin: 0 }, children: "Ch\u01B0a c\u00F3 s\u00E1ch n\u00E0o. Th\u1EBF gi\u1EDBi v\u1EABn ch\u1EA1y \u0111\u01B0\u1EE3c \u2014 lorebook l\u00E0 l\u1EF1c h\u1EA5p d\u1EABn, kh\u00F4ng ph\u1EA3i k\u1ECBch b\u1EA3n." })) : (_jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }, children: sach.map((lb) => {
                            const soNap = lb.entries.filter((e) => duocNap(e)).length;
                            const soChe = lb.entries.filter((e) => e.trangThai === 'bi_che').length;
                            return (_jsxs("li", { style: { ...the, display: 'grid', gap: 8 }, children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("strong", { style: { fontFamily: 'var(--chu-hien)', fontSize: 18 }, children: lb.ten }), _jsx("span", { style: nhanNho, children: NHAN_NGUON[lb.nguon] }), _jsx("span", { style: { flex: 1 } }), _jsxs("label", { style: { display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }, children: [_jsx("input", { type: "checkbox", checked: lb.bat, onChange: (e) => bat(lb.id, e.target.checked) }), lb.bat ? 'đang bật' : 'đang tắt'] })] }), lb.moTa.trim() !== '' && (_jsx("p", { style: { margin: 0, color: 'var(--tro)', fontSize: 13 }, children: lb.moTa })), _jsxs("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: lb.entries.length }), " entry"] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: soNap }), " \u0111\u1EE7 tin c\u1EADy \u0111\u1EC3 n\u1EA1p"] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: soChe }), " b\u1ECB che"] }), _jsxs("span", { children: ["l\u1EF1c h\u1EA5p d\u1EABn ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: lb.lucHapDan })] })] })] }, lb.id));
                        }) }))] }), _jsx(Khoi, { ten: "B\u1EA3ng \u0110\u1ED1i So\u00E1t", phu: "Ch\u1ED7 hai entry n\u00F3i v\u1EC1 c\u00F9ng m\u1ED9t th\u1EE9. Che kh\u00F4ng ph\u1EA3i x\u00F3a \u2014 b\u1EA3n g\u1ED1c c\u00F2n nguy\u00EAn.", children: _jsxs("div", { style: { ...the, display: 'grid', gap: 8 }, children: [_jsxs("div", { style: { display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: ["m\u00E2u thu\u1EABn ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: bang.mauThuan.length })] }), _jsxs("span", { children: ["tr\u00F9ng l\u1EB7p ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: bang.trungLap.length })] }), _jsxs("span", { children: ["b\u1ED5 sung ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: bang.boSung.length })] }), _jsxs("span", { children: ["l\u00E0m r\u00F5 ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: bang.lamRo.length })] })] }), bang.mauThuan.length === 0 && bang.trungLap.length === 0 ? (_jsx("p", { style: { margin: 0, color: 'var(--mo)', fontSize: 13 }, children: "Ch\u01B0a c\u00F3 ch\u1ED7 n\u00E0o hai s\u00E1ch n\u00F3i kh\u00E1c nhau." })) : (_jsx("ul", { style: {
                                margin: 0,
                                paddingLeft: 18,
                                color: 'var(--tro)',
                                fontSize: 13,
                                display: 'grid',
                                gap: 4,
                            }, children: [...bang.mauThuan, ...bang.trungLap].slice(0, 20).map((d) => (_jsxs("li", { children: [_jsx("b", { children: d.quanHe === 'mau_thuan' ? 'Mâu thuẫn' : 'Trùng lặp' }), " \u2014 ", d.lyDo, ' ', _jsxs("span", { style: { color: 'var(--mo)' }, children: ["(x\u1EED l\u00FD: ", d.xuLy === 'che' ? `che "${d.cheId}"` : d.xuLy.replace(/_/g, ' '), ")"] })] }, `${d.moiId}|${d.cuId}`))) }))] }) }), _jsx(Khoi, { ten: "B\u1EA3n \u0110\u1ED3 D\u1ECB Bi\u1EC7t", phu: "\u0110\u00E2y kh\u00F4ng ph\u1EA3i b\u1EA3ng l\u1ED7i. N\u00F3 l\u00E0 h\u1ED3 s\u01A1 v\u1EC1 vi\u1EC7c th\u1EBF gi\u1EDBi c\u1EE7a b\u1EA1n \u0111\u00E3 tr\u1EDF th\u00E0nh c\u00E1i g\u00EC.", children: _jsx("div", { style: { ...the, display: 'grid', gap: 8 }, children: banDo === null || banDo.dong.length === 0 ? (_jsx("p", { style: { margin: 0, color: 'var(--mo)', fontSize: 13 }, children: "Ch\u01B0a c\u00F3 k\u1EF3 v\u1ECDng n\u00E0o \u0111\u1EC3 \u0111o. K\u1EF3 v\u1ECDng sinh ra khi b\u1EA1n nh\u1EADp m\u1ED9t lorebook c\u00F3 m\u00F4 t\u1EA3 \u0111i\u1EC1u g\u00EC \u0111\u00F3 ph\u1EA3i t\u1ED3n t\u1EA1i." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: ["\u0111\u00E3 th\u00E0nh ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: banDo.daThoa })] }), _jsxs("span", { children: ["\u0111ang ch\u1EDD ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: banDo.dangCho })] }), _jsxs("span", { children: ["\u0111\u00E3 l\u1EC7ch ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: banDo.daLech })] }), _jsxs("span", { children: ["kh\u00F4ng c\u00F2n kh\u1EA3 thi ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: banDo.batKha })] })] }), _jsxs("table", { style: { borderCollapse: 'collapse', width: '100%', fontSize: 13 }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', color: 'var(--mo)' }, children: [_jsx("th", { style: { padding: '4px 8px 4px 0', fontWeight: 400 }, children: "K\u1EF3 v\u1ECDng" }), _jsx("th", { style: { padding: '4px 8px 4px 0', fontWeight: 400 }, children: "Th\u1EBF gi\u1EDBi c\u1EE7a b\u1EA1n" }), _jsx("th", { style: { padding: '4px 0', fontWeight: 400 }, children: "Tr\u1EA1ng th\u00E1i" })] }) }), _jsx("tbody", { children: banDo.dong.slice(0, 40).map((d, i) => (_jsxs("tr", { style: { borderTop: '1px solid var(--kinh-vien)' }, children: [_jsx("td", { style: { padding: '6px 8px 6px 0', color: 'var(--tro)' }, children: d.kyVong }), _jsx("td", { style: { padding: '6px 8px 6px 0', color: 'var(--sang)' }, children: d.theGioiCuaBan }), _jsx("td", { style: { padding: '6px 0', color: 'var(--tro)' }, children: NHAN_KY_VONG[d.trangThai] })] }, `${d.kyVong}-${i}`))) })] })] })) }) })] }));
}
