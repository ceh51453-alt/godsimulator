import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Màn chính — cửa vào sau Cổng AI.
 *
 * ── Vì sao nó ra đời ở Phase 12 chứ không ở Phase 3 ──
 *
 * Suốt mười một phase, mở app là rơi thẳng vào Khởi Nguyên, và Khởi Nguyên chỉ
 * biết TẠO. Không có đường nào quay lại ván hôm qua, vì không có gì được ghi
 * xuống đĩa để mà quay lại. Nút "Tiếp tục" ở đây không phải một nút — nó là
 * phần cuối của một đường dài: `luuVan()` sau mỗi lượt kể, `quanLySave.ts` liệt
 * kê, `napState()` dựng lại, invariant chạy ở ranh giới nạp.
 *
 * Ba lối, đúng theo thứ tự người ta thật sự dùng:
 *
 *   Tiếp tục   — lối MẶC ĐỊNH khi đã có ván. Đứng đầu vì nó là việc hay làm nhất.
 *   Bắt đầu    — mở một thế giới hư vô mới (ADR-0055).
 *   File save  — nhập/xuất `.json`, đổi tên, xóa.
 *
 * [BB] 36.1 không emoji; [BB] luật bất biến #9 không dấu hiệu nào chỉ bằng màu —
 * mọi trạng thái ở đây đều có chữ.
 */
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../store/game.js';
import { useUi } from '../../store/ui.js';
import { Icon } from '../design/Icon.js';
import { nut, oNhap, nhanNho, the } from '../design/kieu.js';
const NHAN_TANG = Object.freeze({
    sang_the: 'Sáng Thế',
    than: 'Thần',
    pham_nhan: 'Phàm Nhân',
});
const nutLon = (chinh, tat) => ({
    ...nut(chinh, tat),
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    fontSize: 15,
    textAlign: 'left',
    width: '100%',
});
/** Tải một chuỗi xuống máy dưới dạng file. Không gửi đi đâu cả. */
function taiVeFile(ten, noiDung) {
    const blob = new Blob([noiDung], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ten;
    a.click();
    URL.revokeObjectURL(url);
}
function DongVan({ muc, dangBan, onMo, onXoa, onXuat, onDoiTen, }) {
    const [suaTen, setSuaTen] = useState(false);
    const [ten, setTen] = useState(muc.ten);
    return (_jsxs("li", { style: { ...the, display: 'grid', gap: 10 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, children: [suaTen ? (_jsx("input", { style: { ...oNhap, maxWidth: 260 }, value: ten, maxLength: 80, autoFocus: true, onChange: (e) => setTen(e.target.value), onKeyDown: (e) => {
                            if (e.key === 'Enter') {
                                onDoiTen(ten);
                                setSuaTen(false);
                            }
                            if (e.key === 'Escape')
                                setSuaTen(false);
                        } })) : (_jsx("strong", { style: { fontFamily: 'var(--chu-hien)', fontSize: 18 }, children: muc.ten })), _jsx("span", { style: { flex: 1 } }), _jsx("span", { style: nhanNho, children: muc.gocId === null ? 'NHÁNH GỐC' : 'NHÁNH TÁCH RA' })] }), _jsxs("div", { style: { display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: ["Nh\u1ECBp ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: muc.tick })] }), _jsxs("span", { children: ["N\u0103m ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: muc.nam })] }), _jsxs("span", { children: ["T\u1EA7ng ", NHAN_TANG[muc.mode] ?? muc.mode] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: muc.soEntity }), " th\u1EF1c th\u1EC3"] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: muc.soSuKien }), " s\u1EF1 ki\u1EC7n"] })] }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nut(true, dangBan), disabled: dangBan, onClick: onMo, children: "M\u1EDF v\u00E1n n\u00E0y" }), _jsx("button", { type: "button", style: nut(false, dangBan), disabled: dangBan, onClick: onXuat, children: "Xu\u1EA5t ra file" }), _jsx("button", { type: "button", style: nut(false, dangBan), disabled: dangBan, onClick: () => {
                            if (suaTen)
                                onDoiTen(ten);
                            setSuaTen(!suaTen);
                        }, children: suaTen ? 'Lưu tên' : 'Đổi tên' }), _jsx("button", { type: "button", style: nut(false, dangBan), disabled: dangBan, onClick: onXoa, children: "X\u00F3a" })] })] }));
}
export function ManChinh({ onBatDau }) {
    const ds = useGame((s) => s.danhSachVan);
    const napDs = useGame((s) => s.napDanhSachVan);
    const tiepTuc = useGame((s) => s.tiepTucVan);
    const xoa = useGame((s) => s.xoaVanTheoId);
    const doiTen = useGame((s) => s.doiTenVanTheoId);
    const xuatTheoId = useGame((s) => s.xuatVanTheoIdRaChuoi);
    const nhap = useGame((s) => s.nhapVanTuChuoi);
    const loi = useGame((s) => s.loi);
    const doiMan = useUi((s) => s.doiMan);
    const [hienFile, setHienFile] = useState(false);
    const [dangBan, setDangBan] = useState(false);
    const [tin, setTin] = useState('');
    const oFile = useRef(null);
    useEffect(() => {
        void napDs();
    }, [napDs]);
    const ganNhat = ds[0] ?? null;
    const chay = async (viec) => {
        setDangBan(true);
        try {
            await viec();
        }
        finally {
            setDangBan(false);
        }
    };
    return (_jsxs("main", { style: { maxWidth: 780, margin: '0 auto', padding: '56px 20px 96px' }, children: [_jsx("p", { style: nhanNho, children: "THI\u00CAN DI\u1EC4N" }), _jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 40, margin: '4px 0 6px', fontWeight: 500 }, children: "S\u1EA3nh V\u00E0o" }), _jsx("p", { style: { color: 'var(--tro)', marginTop: 0, fontSize: 14 }, children: "M\u1ECDi th\u1EE9 trong th\u1EBF gi\u1EDBi n\u00E0y \u2014 lu\u1EADt, kh\u00E1i ni\u1EC7m, th\u1EA7n, ng\u01B0\u1EDDi \u2014 ch\u1EC9 t\u1ED3n t\u1EA1i sau khi \u0111\u01B0\u1EE3c k\u1EC3 ra trong l\u00FAc ch\u01A1i. V\u00E1n m\u1EDBi b\u1EAFt \u0111\u1EA7u t\u1EEB h\u01B0 v\u00F4." }), _jsxs("div", { style: { display: 'grid', gap: 10, marginTop: 30 }, children: [_jsxs("button", { type: "button", style: nutLon(ganNhat !== null, ganNhat === null || dangBan), disabled: ganNhat === null || dangBan, onClick: () => {
                            if (ganNhat)
                                void chay(async () => void (await tiepTuc(ganNhat.branchId)));
                        }, children: [_jsx(Icon, { ten: "nhip", co: 20 }), _jsxs("span", { children: [_jsx("span", { style: { display: 'block', fontWeight: 600 }, children: "Ti\u1EBFp t\u1EE5c" }), _jsx("span", { style: { display: 'block', color: 'var(--mo)', fontSize: 13 }, children: ganNhat === null
                                            ? 'Chưa có ván nào trên máy này.'
                                            : `${ganNhat.ten} — nhịp ${ganNhat.tick}, ${ganNhat.soEntity} thực thể.` })] })] }), _jsxs("button", { type: "button", style: nutLon(ganNhat === null, dangBan), disabled: dangBan, onClick: onBatDau, children: [_jsx(Icon, { ten: "than", co: 20 }), _jsxs("span", { children: [_jsx("span", { style: { display: 'block', fontWeight: 600 }, children: "B\u1EAFt \u0111\u1EA7u" }), _jsx("span", { style: { display: 'block', color: 'var(--mo)', fontSize: 13 }, children: "M\u1EDF m\u1ED9t th\u1EBF gi\u1EDBi h\u01B0 v\u00F4 m\u1EDBi. Kh\u00F4ng \u0111\u1EA5t, kh\u00F4ng lu\u1EADt, kh\u00F4ng t\u00EAn g\u1ECDi n\u00E0o c\u00F3 s\u1EB5n." })] })] }), _jsxs("button", { type: "button", style: nutLon(false, dangBan), disabled: dangBan, "aria-expanded": hienFile, onClick: () => setHienFile(!hienFile), children: [_jsx(Icon, { ten: "so_sach", co: 20 }), _jsxs("span", { children: [_jsx("span", { style: { display: 'block', fontWeight: 600 }, children: "File save" }), _jsx("span", { style: { display: 'block', color: 'var(--mo)', fontSize: 13 }, children: ds.length === 0
                                            ? 'Nhập một file .json từ máy khác.'
                                            : `${ds.length} ván trên máy này · nhập và xuất .json` })] })] }), _jsxs("button", { type: "button", style: nutLon(false, false), onClick: () => doiMan('cai_dat'), children: [_jsx(Icon, { ten: "coi", co: 20 }), _jsxs("span", { children: [_jsx("span", { style: { display: 'block', fontWeight: 600 }, children: "C\u00E0i \u0111\u1EB7t" }), _jsx("span", { style: { display: 'block', color: 'var(--mo)', fontSize: 13 }, children: "Preset \u00B7 Lorebook \u00B7 Workflow \u00B7 Proxy AI" })] })] })] }), hienFile && (_jsxs("section", { "aria-label": "File save", style: { marginTop: 26, display: 'grid', gap: 14 }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nut(true, dangBan), disabled: dangBan, onClick: () => oFile.current?.click(), children: "Nh\u1EADp t\u1EEB file .json" }), _jsx("input", { ref: oFile, type: "file", accept: "application/json,.json", style: { display: 'none' }, onChange: (e) => {
                                    const f = e.target.files?.[0];
                                    e.target.value = '';
                                    if (!f)
                                        return;
                                    void chay(async () => {
                                        const txt = await f.text();
                                        const ok = await nhap(txt);
                                        setTin(ok ? `Đã nhập "${f.name}" và mở ván.` : `Không nhập được "${f.name}".`);
                                    });
                                } }), _jsx("span", { style: { ...nhanNho, textTransform: 'none' }, children: "File save kh\u00F4ng bao gi\u1EDD ch\u1EE9a m\u1EADt kh\u1EA9u proxy, v\u00E0 m\u1EB7c \u0111\u1ECBnh kh\u00F4ng ch\u1EE9a h\u1ED3 s\u01A1 ri\u00EAng t\u01B0." })] }), tin !== '' && _jsx("p", { style: { color: 'var(--tro)', fontSize: 13, margin: 0 }, children: tin }), ds.length === 0 ? (_jsx("p", { style: { color: 'var(--mo)', fontSize: 13, margin: 0 }, children: "Ch\u01B0a c\u00F3 v\u00E1n n\u00E0o \u0111\u01B0\u1EE3c l\u01B0u. V\u00E1n t\u1EF1 l\u01B0u sau m\u1ED7i nh\u1ECBp \u0111\u01B0\u1EE3c k\u1EC3." })) : (_jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }, children: ds.map((m) => (_jsx(DongVan, { muc: m, dangBan: dangBan, onMo: () => void chay(async () => void (await tiepTuc(m.branchId))), onXoa: () => void chay(() => xoa(m.branchId)), onDoiTen: (t) => void chay(() => doiTen(m.branchId, t)), onXuat: () => void chay(async () => {
                                const txt = await xuatTheoId(m.branchId, false);
                                if (txt === null) {
                                    setTin('Không xuất được ván này — xem lý do ở danh sách lỗi bên dưới.');
                                    return;
                                }
                                taiVeFile(`thien-dien-${m.branchId}-nhip${m.tick}.json`, txt);
                                setTin(`Đã xuất "${m.ten}".`);
                            }) }, m.branchId))) }))] })), loi.length > 0 && (_jsxs("section", { "aria-label": "L\u1ED7i", style: { marginTop: 24 }, children: [_jsx("h2", { style: { ...nhanNho, margin: '0 0 6px' }, children: "C\u00D3 V\u1EA4N \u0110\u1EC0" }), _jsx("ul", { style: { margin: 0, paddingLeft: 18, color: 'var(--tro)', fontSize: 13 }, children: loi.slice(-5).map((l, i) => (_jsxs("li", { children: [_jsx("span", { style: { fontFamily: 'var(--chu-so)' }, children: l.code }), " \u2014 ", l.message] }, `${l.code}-${i}`))) })] }))] }));
}
