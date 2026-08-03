import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Xưởng Preset — Phần 66.1 (wizard bảy màn) và 66.2 (báo cáo sau nhập).
 *
 * ── Màn này phải trả lời một câu rất cụ thể ──
 *
 * *"Preset của tôi có đang thật sự chạy không, và phần nào của nó không chạy?"*
 *
 * Trước Phase 11 câu ấy không trả lời được: pack nhập vào rồi biến mất khỏi tầm
 * mắt. Nên màn này có bốn khối, và ba trong số đó tồn tại chỉ để trả lời câu ấy:
 *
 *   Thư viện          pack nào đã nhập, bản nào đang bật
 *   Báo cáo sáu dòng  [BB] 66.2 — KHÔNG dùng một dấu check xanh cho cả file
 *   Đã dùng lượt qua  module nào tới được model, module nào bị cắt
 *   Bị cách ly        script không chạy, VÀ app đã làm thay việc đó bằng gì
 *
 * [BB] 64.2 — khối cuối không có nút bật. Script ngoài không chạy, chấm hết. Thứ
 * nó có là cột "đích native" của 66.6: người dùng cần biết app làm thay việc gì,
 * nếu không họ sẽ đi tìm cách bật script bằng được.
 */
import { useRef, useState, useCallback } from 'react';
import { usePreset } from '../../store/preset.js';
import { useGame } from '../../store/game.js';
import { TEN_MAN, issueCuaMan } from '../../core/preset/wizard.js';
import { nhomXungDot } from '../../core/preset/xungDot.js';
import { DUONG_PORT_TINH_NANG } from '../../core/preset/hopNhat.js';
import { Icon } from '../design/Icon.js';
const nhan = {
    color: 'var(--mo)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};
const so = { fontSize: 13, color: 'var(--tro)' };
const phu = { fontSize: 11, color: 'var(--mo)' };
function nut(chinh = false) {
    return {
        background: 'transparent',
        color: chinh ? 'var(--dong)' : 'var(--tro)',
        border: `1px solid ${chinh ? 'var(--dong)' : 'var(--kinh-vien)'}`,
        borderRadius: 'var(--r-sm)',
        padding: '6px 13px',
        font: 'inherit',
        fontSize: 13,
        cursor: 'pointer',
    };
}
export function XuongPreset() {
    const thuVien = usePreset((s) => s.thuVien);
    const dangBat = usePreset((s) => s.dangBat);
    const bien = usePreset((s) => s.bien);
    const xungDot = usePreset((s) => s.xungDot);
    const wizard = usePreset((s) => s.wizard);
    const baoCao = usePreset((s) => s.baoCao);
    const loiBat = usePreset((s) => s.loiBat);
    const doThu = usePreset((s) => s.doThu);
    const nhapVaoThuVien = usePreset((s) => s.nhapVaoThuVien);
    const dongWizard = usePreset((s) => s.dongWizard);
    const giaiXungDot = usePreset((s) => s.giaiXungDot);
    const bat = usePreset((s) => s.bat);
    const tat = usePreset((s) => s.tat);
    const xoaKhoiThuVien = usePreset((s) => s.xoaKhoiThuVien);
    const state = useGame((s) => s.state);
    const presetTrace = useGame((s) => s.presetTrace);
    const tick = state?.world.tick ?? 0;
    const saveId = state?.world.id ?? 'save';
    const oFile = useRef(null);
    const [dangDoc, setDangDoc] = useState(false);
    const [moRong, setMoRong] = useState(new Set());
    const toggleChiTiet = useCallback((key) => {
        setMoRong((prev) => {
            const next = new Set(prev);
            if (next.has(key))
                next.delete(key);
            else
                next.add(key);
            return next;
        });
    }, []);
    const chonFile = async (f) => {
        if (f === undefined)
            return;
        setDangDoc(true);
        try {
            // [BB] Luật bất biến #10 — không fetch URL, không chạy helper. Chỉ đọc bytes.
            const noiDung = await f.text();
            doThu(f.name, noiDung, tick);
        }
        finally {
            setDangDoc(false);
        }
    };
    const kq = wizard.ketQua;
    /*
     * Nhóm xung đột tính từ THƯ VIỆN, không từ wizard.
     *
     * Wizard là một phiên; thư viện thì sống qua lần đóng tab. Đọc từ wizard sẽ
     * làm một pack đã nhập vĩnh viễn không bật được sau khi mở lại app — vì lint
     * vẫn đòi lựa chọn, mà không còn màn nào để chọn.
     */
    const canChon = thuVien
        .filter((r) => dangBat[r.packId] === undefined)
        .flatMap((r) => nhomXungDot(r.pack.modules.filter((m) => m.enabled))
        .filter((n) => n.canNguoiChon)
        .map((n) => ({ row: r, nhom: n })));
    return (_jsxs("main", { style: { padding: '22px 24px 60px', maxWidth: 1080, margin: '0 auto' }, children: [_jsx("h1", { className: "chu-hien", style: { margin: '0 0 4px', fontSize: 26 }, children: "X\u01B0\u1EDFng Preset" }), _jsx("p", { style: { ...phu, margin: '0 0 22px', maxWidth: 620 }, children: "Nh\u1EADp kh\u00F4ng ph\u1EA3i l\u00E0 k\u00EDch ho\u1EA1t. L\u01B0u \u0111\u01B0\u1EE3c to\u00E0n b\u1ED9 kh\u00F4ng c\u00F3 ngh\u0129a l\u00E0 \u0111\u01B0\u1EE3c ph\u00E9p ch\u1EA1y to\u00E0n b\u1ED9." }), _jsxs("section", { className: "kinh", style: { padding: 18, marginBottom: 18 }, children: [_jsx("h2", { style: { ...nhan, margin: '0 0 12px' }, children: "Nh\u1EADp m\u1ED9t file" }), _jsx("input", { ref: oFile, type: "file", accept: ".json,application/json", style: { position: 'absolute', left: -9999 }, id: "fileP", onChange: (e) => void chonFile(e.target.files?.[0]) }), _jsxs("div", { style: { display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }, children: [_jsx("button", { type: "button", style: nut(true), onClick: () => oFile.current?.click(), children: dangDoc ? 'Đang đọc…' : 'Chọn file preset' }), kq !== null && (_jsxs(_Fragment, { children: [_jsxs("span", { style: phu, children: ["Wizard \u0111ang \u1EDF m\u00E0n ", _jsx("strong", { style: { color: 'var(--tro)' }, children: TEN_MAN[wizard.man] })] }), _jsx("button", { type: "button", style: nut(), onClick: dongWizard, children: "B\u1ECF b\u1EA3n nh\u00E1p" })] }))] }), kq !== null && baoCao !== null && (_jsxs("div", { style: { marginTop: 16 }, children: [_jsx("div", { style: { display: 'grid', gap: 5, maxWidth: 560 }, children: baoCao.dong.map(([ten, gia]) => (_jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'baseline' }, children: [_jsx("span", { style: { ...nhan, minWidth: 104 }, children: ten }), _jsx("span", { style: so, children: gia })] }, ten))) }), issueCuaMan(kq, wizard.man).length > 0 && (_jsx("ul", { style: { margin: '14px 0 0', paddingLeft: 18, ...phu }, children: issueCuaMan(kq, wizard.man)
                                    .slice(0, 8)
                                    .map((i, n) => (_jsx("li", { style: { color: i.severity === 'error' ? 'var(--hoi)' : 'var(--mo)' }, children: i.message }, n))) })), kq.ok && !wizard.daNhapThuVien && (_jsx("button", { type: "button", style: { ...nut(true), marginTop: 14 }, onClick: () => void nhapVaoThuVien(), children: "Nh\u1EADp v\u00E0o th\u01B0 vi\u1EC7n" })), wizard.daNhapThuVien && (_jsxs("p", { style: { ...phu, marginTop: 14 }, children: ["\u0110\u00E3 v\u00E0o th\u01B0 vi\u1EC7n. N\u00F3 v\u1EABn ", _jsx("strong", { style: { color: 'var(--tro)' }, children: "ch\u01B0a ch\u1EA1y" }), " \u2014 b\u1EADt \u1EDF d\u01B0\u1EDBi."] }))] }))] }), canChon.length > 0 && (_jsxs("section", { className: "kinh", style: { padding: 18, marginBottom: 18 }, children: [_jsx("h2", { style: { ...nhan, margin: '0 0 6px' }, children: "Xung \u0111\u1ED9t c\u1EA7n ng\u01B0\u1EDDi ch\u1ECDn" }), _jsx("p", { style: { ...phu, margin: '0 0 14px', maxWidth: 620 }, children: "Engine gi\u1EA3i \u0111\u01B0\u1EE3c ph\u1EA7n l\u1EDBn xung \u0111\u1ED9t. Nh\u1EEFng nh\u00F3m d\u01B0\u1EDBi \u0111\u00E2y th\u00EC kh\u00F4ng: ch\u00FAng lo\u1EA1i tr\u1EEB nhau, v\u00E0 ch\u1ECDn h\u1ED9 b\u1EA1n l\u00E0 ch\u1ECDn thay \u00FD \u0111\u1ED3 c\u1EE7a ng\u01B0\u1EDDi vi\u1EBFt preset." }), _jsx("div", { style: { display: 'grid', gap: 14 }, children: canChon.map(({ row, nhom }) => (_jsxs("div", { className: "kinh--cap2", style: { padding: 12 }, children: [_jsx("div", { style: so, children: nhom.khoa }), _jsx("div", { style: { ...phu, marginBottom: 8 }, children: nhom.moTa }), _jsx("div", { style: { display: 'grid', gap: 6 }, children: nhom.moduleIds.map((id) => {
                                        const m = row.pack.modules.find((x) => x.id === id);
                                        const dangChon = xungDot[row.packId]?.[nhom.khoa] === id;
                                        const chiTietKey = `${row.packId}:${nhom.khoa}:${id}`;
                                        const dangMo = moRong.has(chiTietKey);
                                        return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', gap: 7, alignItems: 'center' }, children: [_jsx("button", { type: "button", style: nut(dangChon), "aria-pressed": dangChon, onClick: () => giaiXungDot(row.packId, nhom.khoa, id), children: m?.name ?? id }), _jsx("button", { type: "button", style: {
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: dangMo ? 'var(--dong)' : 'var(--mo)',
                                                                font: 'inherit',
                                                                fontSize: 11,
                                                                cursor: 'pointer',
                                                                padding: '4px 6px',
                                                                textDecoration: 'underline',
                                                                textUnderlineOffset: '2px',
                                                            }, onClick: () => toggleChiTiet(chiTietKey), "aria-expanded": dangMo, children: dangMo ? 'ẩn' : 'xem chi tiết' })] }), dangMo && m !== undefined && (_jsxs("div", { style: {
                                                        marginTop: 6,
                                                        marginLeft: 8,
                                                        padding: '8px 10px',
                                                        borderLeft: '2px solid var(--kinh-vien)',
                                                        background: 'rgba(0,0,0,0.15)',
                                                        borderRadius: 'var(--r-sm)',
                                                    }, children: [_jsxs("div", { style: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }, children: [_jsxs("span", { style: phu, children: ["Lo\u1EA1i: ", _jsx("strong", { style: { color: 'var(--tro)' }, children: m.kind })] }), _jsxs("span", { style: phu, children: ["Lane: ", _jsx("strong", { style: { color: 'var(--tro)' }, children: m.lane })] }), _jsxs("span", { style: phu, children: ["Role: ", _jsx("strong", { style: { color: 'var(--tro)' }, children: m.role })] })] }), _jsx("pre", { className: "chu-so", style: {
                                                                margin: 0,
                                                                ...phu,
                                                                color: 'var(--tro)',
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                                maxHeight: 240,
                                                                overflow: 'auto',
                                                                fontSize: 12,
                                                                lineHeight: 1.45,
                                                            }, children: m.content.length > 2000
                                                                ? m.content.slice(0, 2000) +
                                                                    '\n…(cắt bớt, còn ' +
                                                                    (m.content.length - 2000) +
                                                                    ' ký tự)'
                                                                : m.content })] }))] }, id));
                                    }) })] }, `${row.packId}:${nhom.khoa}`))) })] })), _jsxs("section", { className: "kinh", style: { padding: 18, marginBottom: 18 }, children: [_jsx("h2", { style: { ...nhan, margin: '0 0 12px' }, children: "Th\u01B0 vi\u1EC7n" }), thuVien.length === 0 ? (_jsx("p", { style: phu, children: "Ch\u01B0a c\u00F3 pack n\u00E0o. Th\u1EBF gi\u1EDBi \u0111ang ch\u1EA1y b\u1EB1ng prompt native c\u1EE7a engine." })) : (_jsx("div", { style: { display: 'grid', gap: 10 }, children: thuVien.map((r) => {
                            const act = dangBat[r.packId];
                            const daBat = act !== undefined && act.packVersion === r.version;
                            return (_jsxs("div", { className: "kinh--cap2", style: { padding: 12, display: 'grid', gap: 6 }, children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }, children: [_jsx("span", { className: "ten-rieng", style: { ...so, flex: 1, minWidth: 160 }, children: r.pack.envelope.sourceName }), _jsxs("span", { style: phu, children: ["b\u1EA3n ", r.version] }), _jsxs("span", { style: phu, children: [r.pack.modules.length, " module"] }), _jsx("span", { style: { ...phu, color: daBat ? 'var(--ngoc)' : 'var(--mo)' }, children: daBat ? 'đang bật' : 'chưa bật' })] }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [daBat ? (_jsx("button", { type: "button", style: nut(), onClick: () => void tat(r.packId), children: "T\u1EAFt \u2014 tr\u1EA3 v\u1EC1 prompt native" })) : (_jsx("button", { type: "button", style: nut(true), onClick: () => void bat(r.packId, saveId, tick), children: "B\u1EADt cho nh\u00E1nh n\u00E0y" })), _jsx("button", { type: "button", style: nut(), onClick: () => void xoaKhoiThuVien(r.packId), children: "X\u00F3a kh\u1ECFi th\u01B0 vi\u1EC7n" })] }), Object.keys(bien[r.packId] ?? {}).length > 0 && (_jsxs("div", { style: { marginTop: 4 }, children: [_jsx("div", { style: nhan, children: "Bi\u1EBFn c\u1EE7a pack tr\u00EAn nh\u00E1nh n\u00E0y" }), _jsx("pre", { className: "chu-so", style: {
                                                    margin: '4px 0 0',
                                                    ...phu,
                                                    whiteSpace: 'pre-wrap',
                                                    maxHeight: 160,
                                                    overflow: 'auto',
                                                }, children: JSON.stringify(bien[r.packId], null, 2) })] })), r.quarantined.length > 0 && (_jsxs("div", { style: { marginTop: 4 }, children: [_jsxs("div", { style: { ...nhan, color: 'var(--hoi)' }, children: [r.quarantined.length, " script b\u1ECB c\u00E1ch ly \u2014 kh\u00F4ng ch\u1EA1y"] }), r.quarantined.map((q) => (_jsxs("div", { style: phu, children: [q.ten, " \u00B7 ", q.soKyTu, " k\u00FD t\u1EF1", q.batONguon ? ' · nguồn khai là đang bật' : ''] }, q.hash)))] })), r.pack.generation !== undefined && (_jsxs("div", { style: { marginTop: 4 }, children: [_jsx("div", { style: nhan, children: "Th\u00F4ng s\u1ED1 sinh trong preset" }), _jsx("div", { style: {
                                                    display: 'flex',
                                                    gap: '6px 16px',
                                                    flexWrap: 'wrap',
                                                    marginTop: 4,
                                                }, children: [
                                                    ['Temperature', r.pack.generation.temperature],
                                                    ['Top P', r.pack.generation.topP],
                                                    ['Top K', r.pack.generation.topK],
                                                    ['Max Output', r.pack.generation.maxOutputTokens],
                                                    ['Context', r.pack.generation.maxContext],
                                                    ['Presence', r.pack.generation.presencePenalty],
                                                    ['Frequency', r.pack.generation.frequencyPenalty],
                                                ]
                                                    .filter(([, v]) => v !== undefined)
                                                    .map(([ten, v]) => (_jsxs("span", { style: phu, children: [ten, ":", ' ', _jsx("strong", { style: { color: 'var(--tro)' }, children: typeof v === 'number'
                                                                ? Number.isInteger(v)
                                                                    ? v.toLocaleString()
                                                                    : v.toFixed(2)
                                                                : String(v) })] }, ten))) }), daBat && (_jsx("div", { style: { ...phu, marginTop: 4, color: 'var(--ngoc)' }, children: "\u0110\u00E3 \u00E1p th\u00F4ng s\u1ED1 n\u00E0y v\u00E0o endpoint T\u01B0\u1EDDng Thu\u1EADt." }))] }))] }, `${r.packId}:${r.version}`));
                        }) })), loiBat.length > 0 && (_jsx("div", { role: "alert", style: { marginTop: 12 }, children: loiBat.map((i, n) => (_jsx("div", { style: { ...phu, color: 'var(--hoi)' }, children: i.message }, n))) }))] }), _jsxs("section", { className: "kinh", style: { padding: 18, marginBottom: 18 }, children: [_jsx("h2", { style: { ...nhan, margin: '0 0 12px' }, children: "L\u01B0\u1EE3t k\u1EC3 g\u1EA7n nh\u1EA5t \u0111\u00E3 d\u00F9ng g\u00EC" }), presetTrace.packDaDung.length === 0 ? (_jsx("p", { style: phu, children: "L\u01B0\u1EE3t g\u1EA7n nh\u1EA5t ch\u1EA1y b\u1EB1ng prompt native. Kh\u00F4ng module ngo\u00E0i n\u00E0o c\u00F3 m\u1EB7t trong n\u00F3." })) : (_jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsxs("div", { style: so, children: ["Pack g\u00F3p m\u1EB7t: ", presetTrace.packDaDung.join(', ')] }), presetTrace.moduleBiBo.length > 0 && (_jsxs("div", { style: phu, children: [presetTrace.moduleBiBo.length, " module kh\u00F4ng v\u00E0o prompt:", ' ', presetTrace.moduleBiBo.slice(0, 12).join(', ')] })), presetTrace.macroChuaGiai.length > 0 && (_jsxs("div", { style: { ...phu, color: 'var(--hoi)' }, children: ["Macro ch\u01B0a c\u00F3 \u00E1nh x\u1EA1: ", presetTrace.macroChuaGiai.join(', ')] })), presetTrace.issues.map((i, n) => (_jsx("div", { style: phu, children: i }, n)))] }))] }), _jsxs("section", { className: "kinh", style: { padding: 18 }, children: [_jsx("h2", { style: { ...nhan, margin: '0 0 6px' }, children: "\u00DD \u0111\u1ED3 preset v\u00E0 \u0111\u00EDch native t\u01B0\u01A1ng \u1EE9ng" }), _jsxs("p", { style: { ...phu, margin: '0 0 12px', maxWidth: 620 }, children: [_jsx(Icon, { ten: "canh_bao", co: 12, style: { color: 'var(--dong)', verticalAlign: '-1px' } }), " Script v\u00E0 extension kh\u00F4ng ch\u1EA1y. B\u1EA3ng n\u00E0y n\u00F3i app \u0111\u00E3 l\u00E0m thay t\u1EEBng vi\u1EC7c b\u1EB1ng g\u00EC."] }), _jsx("div", { className: "cuon-ngang", children: _jsxs("table", { style: { borderCollapse: 'collapse', width: '100%', minWidth: 560 }, children: [_jsx("thead", { children: _jsx("tr", { children: ['Ý đồ trong preset', 'Đích native', 'Không được làm'].map((c) => (_jsx("th", { style: { ...nhan, textAlign: 'left', padding: '6px 14px 6px 0', fontWeight: 400 }, children: c }, c))) }) }), _jsx("tbody", { children: DUONG_PORT_TINH_NANG.map((d) => (_jsxs("tr", { style: { borderTop: '1px solid var(--kinh-vien)' }, children: [_jsx("td", { style: { ...so, padding: '6px 14px 6px 0' }, children: d.yDo }), _jsx("td", { style: { ...so, padding: '6px 14px 6px 0', color: 'var(--ngoc)' }, children: d.dichNative }), _jsx("td", { style: { ...phu, padding: '6px 14px 6px 0' }, children: d.khongDuocLam })] }, d.yDo))) })] }) })] })] }));
}
