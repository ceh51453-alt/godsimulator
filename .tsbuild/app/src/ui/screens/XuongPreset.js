import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Quản lý Preset.
 *
 * File được nhập thẳng vào thư viện, xung đột nội bộ tự giữ theo prompt_order.
 * Mỗi pack có một bảng cấu hình thống nhất cho prompt, regex, adapter script,
 * thông số sinh và biến — không còn wizard hay một khu script tách rời.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePreset, tinhNangPresetDangBat } from '../../store/preset.js';
import { useGame } from '../../store/game.js';
import { useAi } from '../../store/ai.js';
import { ThongSoSinh } from './ThongSoSinh.js';
const nhan = {
    color: 'var(--mo)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};
const so = { fontSize: 13, color: 'var(--tro)' };
const phu = { fontSize: 12, color: 'var(--mo)' };
function nut(chinh = false, tat = false) {
    return {
        background: 'transparent',
        color: tat ? 'var(--mo)' : chinh ? 'var(--dong)' : 'var(--tro)',
        border: `1px solid ${chinh && !tat ? 'var(--dong)' : 'var(--kinh-vien)'}`,
        borderRadius: 'var(--r-sm)',
        padding: '7px 13px',
        font: 'inherit',
        fontSize: 13,
        cursor: tat ? 'not-allowed' : 'pointer',
        opacity: tat ? 0.55 : 1,
    };
}
function Khoi({ ten, phuDe, children }) {
    return (_jsxs("section", { style: { display: 'grid', gap: 9 }, children: [_jsxs("header", { children: [_jsx("h3", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 17, fontWeight: 500 }, children: ten }), phuDe !== undefined && _jsx("p", { style: { ...phu, margin: '2px 0 0' }, children: phuDe })] }), children] }));
}
function CongTac({ checked, disabled = false, nhanChu, onChange, }) {
    return (_jsxs("label", { style: { display: 'inline-flex', gap: 7, alignItems: 'center', fontSize: 12, color: 'var(--tro)' }, children: [_jsx("input", { type: "checkbox", checked: checked, disabled: disabled, onChange: (e) => onChange(e.currentTarget.checked) }), nhanChu] }));
}
const KHONG_CHAY_DUOC = new Set(['quarantined', 'needs_adapter', 'disabled']);
function moduleMacDinh(m) {
    return m.enabled && !KHONG_CHAY_DUOC.has(m.activation);
}
function nhanAdapter(kind) {
    if (kind === 'cot_cleanup')
        return 'Dọn nội dung suy luận';
    if (kind === 'prompt_merge')
        return 'Ghép prompt và lịch sử';
    if (kind === 'scene_switch')
        return 'Điều khiển cảnh/module';
    return 'Giao diện lựa chọn';
}
function giaTri(v) {
    if (typeof v === 'number')
        return Number.isInteger(v) ? v.toLocaleString('vi-VN') : v.toFixed(2);
    if (Array.isArray(v))
        return v.join(' · ');
    return String(v);
}
export function XuongPreset() {
    const thuVien = usePreset((s) => s.thuVien);
    const dangBat = usePreset((s) => s.dangBat);
    const bien = usePreset((s) => s.bien);
    const chonChoVanMoi = usePreset((s) => s.chonChoVanMoi);
    const daNap = usePreset((s) => s.daNap);
    const wizard = usePreset((s) => s.wizard);
    const loiBat = usePreset((s) => s.loiBat);
    const napTuDia = usePreset((s) => s.napTuDia);
    const doThu = usePreset((s) => s.doThu);
    const nhapVaoThuVien = usePreset((s) => s.nhapVaoThuVien);
    const bat = usePreset((s) => s.bat);
    const tat = usePreset((s) => s.tat);
    const xoaKhoiThuVien = usePreset((s) => s.xoaKhoiThuVien);
    const datChonChoVanMoi = usePreset((s) => s.datChonChoVanMoi);
    const datTinhNang = usePreset((s) => s.datTinhNang);
    const thamSoHieuLuc = usePreset((s) => s.thamSoHieuLuc);
    const datThamSoHieuLuc = usePreset((s) => s.datThamSoHieuLuc);
    const paramsNen = useAi((s) => s.cfg.narrator.params);
    const state = useGame((s) => s.state);
    const presetTrace = useGame((s) => s.presetTrace);
    const branchId = state?.world.branchId ?? '';
    const tick = state?.world.tick ?? 0;
    const saveId = state?.world.id ?? '';
    const oFile = useRef(null);
    const [dangDoc, setDangDoc] = useState(false);
    const [tin, setTin] = useState('');
    const [moRong, setMoRong] = useState(new Set());
    useEffect(() => {
        if (!daNap)
            void napTuDia(branchId);
    }, [branchId, daNap, napTuDia]);
    const packs = useMemo(() => {
        const daCo = new Set();
        return thuVien.filter((row) => {
            if (daCo.has(row.packId))
                return false;
            daCo.add(row.packId);
            return true;
        });
    }, [thuVien]);
    const chonFile = async (file) => {
        if (file === undefined)
            return;
        setDangDoc(true);
        setTin('');
        try {
            const noiDung = await file.text();
            doThu(file.name, noiDung, tick);
            const kq = usePreset.getState().wizard.ketQua;
            if (!kq?.ok || kq.row === null) {
                setTin(`Không nhập được “${file.name}”. Mở phần lỗi bên dưới để xem chi tiết.`);
                return;
            }
            await nhapVaoThuVien();
            setTin(`Đã nhập “${file.name}”: ${kq.row.pack.modules.length} module, ` +
                `${kq.row.transformDefs.length} regex, ${kq.row.scriptAdapters.length} chức năng script đã tích hợp.`);
        }
        finally {
            setDangDoc(false);
        }
    };
    const doiMoRong = (packId) => {
        setMoRong((cu) => {
            const moi = new Set(cu);
            if (moi.has(packId))
                moi.delete(packId);
            else
                moi.add(packId);
            return moi;
        });
    };
    const loiNhap = wizard.ketQua?.issues.filter((i) => i.severity === 'error') ?? [];
    const paramsHieuLuc = thamSoHieuLuc(paramsNen);
    const tenPresetDangBat = packs
        .filter((row) => dangBat[row.packId]?.packVersion === row.version)
        .map((row) => row.pack.envelope.sourceName);
    return (_jsxs("main", { style: { padding: '22px 24px 60px', maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 18 }, children: [_jsxs("header", { children: [_jsx("p", { style: { ...nhan, margin: 0 }, children: "C\u1EA5u h\u00ECnh \u00B7 Preset" }), _jsx("h1", { className: "chu-hien", style: { margin: '4px 0 5px', fontSize: 28, fontWeight: 500 }, children: "Qu\u1EA3n l\u00FD Preset" }), _jsx("p", { style: { ...phu, margin: 0, maxWidth: 720 }, children: "Preset \u0111\u01B0\u1EE3c nh\u1EADp th\u1EB3ng v\u00E0o th\u01B0 vi\u1EC7n. C\u00E1c ph\u1EA7n c\u00F9ng t\u00E1c \u0111\u1ED9ng \u0111\u01B0\u1EE3c gh\u00E9p theo th\u1EE9 t\u1EF1 c\u1EE7a ch\u00EDnh file; b\u1EA1n kh\u00F4ng c\u00F2n ph\u1EA3i ch\u1ECDn th\u1EE7 c\u00F4ng m\u1ED9t b\u00EAn xung \u0111\u1ED9t." })] }), _jsxs("section", { className: "kinh", style: { padding: 18, display: 'grid', gap: 10 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nut(true, dangDoc), disabled: dangDoc, onClick: () => oFile.current?.click(), children: dangDoc ? 'Đang nhập…' : 'Nhập preset (.json)' }), _jsx("input", { ref: oFile, type: "file", accept: ".json,application/json", style: { position: 'absolute', left: -9999 }, onChange: (e) => {
                                    const file = e.currentTarget.files?.[0];
                                    e.currentTarget.value = '';
                                    void chonFile(file);
                                } }), _jsx("span", { style: phu, children: "H\u1ED7 tr\u1EE3 preset SillyTavern v\u00E0 \u0111\u1ECBnh d\u1EA1ng Thi\u00EAn Di\u1EC5n." })] }), tin !== '' && (_jsx("p", { role: "status", style: { ...so, margin: 0 }, children: tin })), loiNhap.length > 0 && (_jsx("div", { role: "alert", style: { display: 'grid', gap: 3 }, children: loiNhap.slice(0, 8).map((i, n) => (_jsx("span", { style: { ...phu, color: 'var(--hoi)' }, children: i.message }, `${i.code}:${n}`))) }))] }), _jsxs("section", { className: "kinh", style: { padding: 18, display: 'grid', gap: 8 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 21 }, children: "Th\u00F4ng s\u1ED1 sinh \u0111ang d\u00F9ng" }), _jsx("p", { style: { ...phu, margin: '5px 0 0', lineHeight: 1.5 }, children: tenPresetDangBat.length > 0
                                    ? `Đã áp thông số từ ${tenPresetDangBat.join(', ')}. Chỉnh tại đây sẽ được lưu cho preset đang ưu tiên trên nhánh này.`
                                    : 'Chưa có preset đang bật. Thay đổi tại đây dùng chung với Tường Thuật và được lưu trên máy.' })] }), _jsx(ThongSoSinh, { params: paramsHieuLuc, tat: false, moMacDinh: true, onThayDoi: (thayDoi) => void datThamSoHieuLuc(thayDoi) })] }), _jsxs("section", { style: { display: 'grid', gap: 10 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }, children: [_jsx("h2", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 21 }, children: "Preset \u0111\u00E3 nh\u1EADp" }), _jsxs("span", { style: phu, children: [packs.length, " preset tr\u00EAn m\u00E1y"] })] }), !daNap ? (_jsx("p", { style: phu, children: "\u0110ang \u0111\u1ECDc th\u01B0 vi\u1EC7n preset\u2026" })) : packs.length === 0 ? (_jsx("div", { className: "kinh", style: { padding: 18 }, children: _jsx("p", { style: { ...phu, margin: 0 }, children: "Ch\u01B0a c\u00F3 preset. Tr\u00F2 ch\u01A1i \u0111ang d\u00F9ng c\u1EA5u h\u00ECnh v\u00E0 prompt m\u1EB7c \u0111\u1ECBnh." }) })) : (packs.map((row) => {
                        const act = dangBat[row.packId];
                        const daBat = act?.packVersion === row.version;
                        const dangMo = moRong.has(row.packId);
                        const bienPack = bien[row.packId] ?? {};
                        const daChonChoVanMoi = chonChoVanMoi.includes(row.packId);
                        const soBan = thuVien.filter((x) => x.packId === row.packId).length;
                        return (_jsxs("article", { className: "kinh", style: { padding: 16, display: 'grid', gap: 12 }, children: [_jsxs("header", { style: { display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }, children: [_jsxs("div", { style: { flex: 1, minWidth: 210 }, children: [_jsx("h2", { className: "ten-rieng", style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 19 }, children: row.pack.envelope.sourceName }), _jsxs("div", { style: { ...phu, marginTop: 3 }, children: ["b\u1EA3n ", row.version, soBan > 1 ? ` · ${soBan} phiên bản` : '', " \u00B7 ", row.pack.modules.length, " module \u00B7", ' ', row.transformDefs.length, " regex \u00B7 ", row.quarantined.length, " script ngu\u1ED3n"] })] }), _jsx("span", { style: {
                                                ...so,
                                                color: daBat || (state === null && daChonChoVanMoi) ? 'var(--ngoc)' : 'var(--mo)',
                                            }, children: state === null
                                                ? daChonChoVanMoi
                                                    ? 'Sẽ bật trong ván mới'
                                                    : 'Chưa chọn cho ván mới'
                                                : daBat
                                                    ? 'Đang dùng trong ván'
                                                    : act
                                                        ? `Đang dùng bản ${act.packVersion}`
                                                        : 'Đang tắt' })] }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [state === null ? (_jsx("button", { type: "button", style: nut(!daChonChoVanMoi), onClick: () => void datChonChoVanMoi(row.packId, !daChonChoVanMoi), children: daChonChoVanMoi ? 'Bỏ khỏi ván mới' : 'Bật sẵn cho ván mới' })) : daBat ? (_jsx("button", { type: "button", style: nut(), onClick: () => void tat(row.packId), children: "T\u1EAFt preset" })) : (_jsx("button", { type: "button", style: nut(true), onClick: () => void bat(row.packId, saveId, tick), children: act ? 'Dùng bản mới nhất' : 'Bật cho ván này' })), _jsx("button", { type: "button", style: nut(), onClick: () => doiMoRong(row.packId), "aria-expanded": dangMo, children: dangMo ? 'Thu gọn cấu hình' : 'Mở cấu hình' }), _jsx("button", { type: "button", style: { ...nut(), color: 'var(--hoi)' }, onClick: () => {
                                                if (window.confirm(`Xóa “${row.pack.envelope.sourceName}” và mọi phiên bản khỏi thư viện?`)) {
                                                    void xoaKhoiThuVien(row.packId);
                                                }
                                            }, children: "X\u00F3a" })] }), state === null && (_jsx("p", { style: { ...phu, margin: 0 }, children: "Preset \u0111\u00E3 ch\u1ECDn s\u1EBD t\u1EF1 b\u1EADt tr\u01B0\u1EDBc l\u1EDDi k\u1EC3 \u0111\u1EA7u ti\u00EAn. C\u00F4ng t\u1EAFc module, regex v\u00E0 script v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF ri\u00EAng cho t\u1EEBng v\u00E1n." })), dangMo && (_jsxs("div", { style: {
                                        borderTop: '1px solid var(--kinh-vien)',
                                        paddingTop: 14,
                                        display: 'grid',
                                        gap: 20,
                                    }, children: [_jsx(ThongSo, { row: row }), _jsx(Khoi, { ten: "Prompt v\u00E0 module", phuDe: "B\u1EADt/t\u1EAFt t\u1EEBng ph\u1EA7n; th\u1EE9 t\u1EF1 trong file lu\u00F4n \u0111\u01B0\u1EE3c gi\u1EEF nguy\u00EAn.", children: _jsx("div", { style: { display: 'grid', gap: 6, maxHeight: 360, overflow: 'auto', paddingRight: 4 }, children: row.pack.modules.map((m) => {
                                                    const duocChay = !KHONG_CHAY_DUOC.has(m.activation);
                                                    const checked = tinhNangPresetDangBat(bienPack, 'module', m.sourceIdentifier, moduleMacDinh(m));
                                                    return (_jsxs("div", { className: "kinh--cap2", style: {
                                                            padding: '9px 11px',
                                                            display: 'flex',
                                                            gap: 10,
                                                            alignItems: 'center',
                                                            flexWrap: 'wrap',
                                                        }, children: [_jsx(CongTac, { checked: checked && duocChay, disabled: state === null || !duocChay, nhanChu: m.name, onChange: (v) => void datTinhNang(row.packId, 'module', m.sourceIdentifier, v, tick) }), _jsxs("span", { style: { ...phu, marginLeft: 'auto' }, children: [m.role, " \u00B7 ", m.lane, " \u00B7 #", m.order] }), !duocChay && (_jsxs("span", { style: { ...phu, color: 'var(--hoi)' }, children: ["kh\u00F4ng t\u01B0\u01A1ng th\u00EDch: ", m.activation] }))] }, m.id));
                                                }) }) }), _jsx(Khoi, { ten: "Regex v\u00E0 script", phuDe: "\u0110\u01B0\u1EE3c qu\u1EA3n l\u00FD c\u00F9ng preset v\u00E0 ch\u1EA1y qua b\u1ED9 t\u01B0\u01A1ng th\u00EDch c\u1EE7a \u1EE9ng d\u1EE5ng.", children: _jsxs("div", { style: { display: 'grid', gap: 8 }, children: [row.transformDefs.map((t) => (_jsx(RegexDong, { row: row, transform: t, bienPack: bienPack, coVan: state !== null, tick: tick, datTinhNang: datTinhNang }, t.id))), row.scriptAdapters.map((a) => {
                                                        const checked = tinhNangPresetDangBat(bienPack, 'script', a.id, a.batONguon);
                                                        return (_jsxs("div", { className: "kinh--cap2", style: {
                                                                padding: '9px 11px',
                                                                display: 'flex',
                                                                gap: 10,
                                                                alignItems: 'center',
                                                                flexWrap: 'wrap',
                                                            }, children: [_jsx(CongTac, { checked: checked, disabled: state === null, nhanChu: a.ten, onChange: (v) => void datTinhNang(row.packId, 'script', a.id, v, tick) }), _jsxs("span", { style: { ...phu, marginLeft: 'auto', color: 'var(--ngoc)' }, children: [nhanAdapter(a.kind), " \u00B7 \u0111\u00E3 t\u00EDch h\u1EE3p"] })] }, a.id));
                                                    }), row.transformDefs.length === 0 && row.scriptAdapters.length === 0 && (_jsx("p", { style: { ...phu, margin: 0 }, children: "Preset n\u00E0y kh\u00F4ng khai regex ho\u1EB7c ch\u1EE9c n\u0103ng script t\u01B0\u01A1ng th\u00EDch." })), row.quarantined.length > row.scriptAdapters.length && (_jsxs("p", { style: { ...phu, margin: 0 }, children: ["\u0110\u00E3 gi\u1EEF nguy\u00EAn ", row.quarantined.length, " script ngu\u1ED3n; ", row.scriptAdapters.length, ' ', "ch\u1EE9c n\u0103ng \u0111\u00E3 nh\u1EADn di\u1EC7n v\u00E0 n\u1ED1i v\u00E0o \u1EE9ng d\u1EE5ng."] }))] }) }), Object.keys(bienPack).filter((k) => !k.startsWith('__')).length > 0 && (_jsx(Khoi, { ten: "Bi\u1EBFn preset", phuDe: "D\u1EEF li\u1EC7u ri\u00EAng c\u1EE7a preset tr\u00EAn nh\u00E1nh hi\u1EC7n t\u1EA1i.", children: _jsx("pre", { className: "chu-so", style: {
                                                    ...phu,
                                                    margin: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    maxHeight: 220,
                                                    overflow: 'auto',
                                                }, children: JSON.stringify(Object.fromEntries(Object.entries(bienPack).filter(([k]) => !k.startsWith('__'))), null, 2) }) }))] }))] }, row.packId));
                    }))] }), loiBat.length > 0 && (_jsxs("section", { className: "kinh", role: "alert", style: { padding: 16, display: 'grid', gap: 4 }, children: [_jsx("h2", { style: { ...nhan, margin: 0, color: 'var(--hoi)' }, children: "C\u1EA7n ch\u00FA \u00FD" }), loiBat.slice(-12).map((i, n) => (_jsx("span", { style: { ...phu, color: i.severity === 'error' ? 'var(--hoi)' : 'var(--tro)' }, children: i.message }, `${i.code}:${n}`)))] })), _jsxs("section", { className: "kinh", style: { padding: 16, display: 'grid', gap: 7 }, children: [_jsx("h2", { style: { ...nhan, margin: 0 }, children: "L\u01B0\u1EE3t k\u1EC3 g\u1EA7n nh\u1EA5t" }), presetTrace.packDaDung.length === 0 ? (_jsx("span", { style: phu, children: "\u0110ang d\u00F9ng prompt m\u1EB7c \u0111\u1ECBnh; ch\u01B0a c\u00F3 preset g\u00F3p m\u1EB7t." })) : (_jsxs(_Fragment, { children: [_jsxs("span", { style: so, children: ["Preset \u0111\u00E3 d\u00F9ng: ", presetTrace.packDaDung.join(', ')] }), presetTrace.moduleBiBo.length > 0 && (_jsxs("span", { style: phu, children: [presetTrace.moduleBiBo.length, " module b\u1ECB b\u1ECF v\u00EC ng\u00E2n s\u00E1ch ho\u1EB7c kh\u00F4ng t\u01B0\u01A1ng th\u00EDch."] })), presetTrace.macroChuaGiai.length > 0 && (_jsxs("span", { style: { ...phu, color: 'var(--hoi)' }, children: ["Macro ch\u01B0a \u00E1nh x\u1EA1: ", presetTrace.macroChuaGiai.join(', ')] }))] }))] })] }));
}
function ThongSo({ row }) {
    const gen = row.pack.generation;
    const tatCa = gen === undefined
        ? []
        : [
            ['Temperature', gen.temperature],
            ['Top P', gen.topP],
            ['Top K', gen.topK],
            ['Min P', gen.minP],
            ['Max Output', gen.maxOutputTokens],
            ['Context', gen.maxContext],
            ['Presence', gen.presencePenalty],
            ['Frequency', gen.frequencyPenalty],
            ['Stop', gen.stopSequences],
        ];
    const ds = tatCa.filter(([, v]) => v !== undefined);
    return (_jsx(Khoi, { ten: "Th\u00F4ng s\u1ED1 sinh", phuDe: "C\u00E1c gi\u00E1 tr\u1ECB \u0111\u01B0\u1EE3c \u00E1p v\u00E0o model T\u01B0\u1EDDng Thu\u1EADt khi preset \u0111ang b\u1EADt.", children: ds.length === 0 ? (_jsx("p", { style: { ...phu, margin: 0 }, children: "Preset kh\u00F4ng ghi \u0111\u00E8 th\u00F4ng s\u1ED1 sinh." })) : (_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 7 }, children: ds.map(([ten, v]) => (_jsxs("div", { className: "kinh--cap2", style: { padding: '8px 10px' }, children: [_jsx("div", { style: nhan, children: ten }), _jsx("div", { className: "chu-so", style: so, children: giaTri(v) })] }, ten))) })) }));
}
function RegexDong({ row, transform, bienPack, coVan, tick, datTinhNang, }) {
    const tuongThich = transform.activation === 'sandboxed' || transform.activation === 'disabled';
    const checked = tinhNangPresetDangBat(bienPack, 'regex', transform.id, transform.batONguon);
    return (_jsxs("div", { className: "kinh--cap2", style: { padding: '9px 11px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx(CongTac, { checked: checked && tuongThich, disabled: !coVan || !tuongThich, nhanChu: transform.ten, onChange: (v) => void datTinhNang(row.packId, 'regex', transform.id, v, tick) }), _jsxs("span", { style: { ...phu, marginLeft: 'auto' }, children: [transform.promptOnlyNguon
                        ? 'prompt'
                        : transform.markdownOnlyNguon
                            ? 'hiển thị markdown'
                            : 'prompt/hiển thị', ' ', "\u00B7 v\u1ECB tr\u00ED ", transform.placement.join(', ')] }), !tuongThich && _jsx("span", { style: { ...phu, color: 'var(--hoi)' }, children: "c\u00FA ph\u00E1p regex ch\u01B0a t\u01B0\u01A1ng th\u00EDch" })] }));
}
