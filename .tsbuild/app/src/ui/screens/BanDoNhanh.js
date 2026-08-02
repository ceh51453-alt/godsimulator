import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Bản Đồ Nhánh — Phần 26.2. Màn thứ hai trong ba màn còn nợ.
 *
 * ── Vì sao nó dựng từ cùng một danh sách với "File save" ──
 *
 * ADR-0054: một ván **là** một nhánh. Nếu màn này đọc một danh sách khác với
 * danh sách của Sảnh Vào thì sớm muộn hai danh sách sẽ lệch nhau, và người chơi
 * sẽ thấy một nhánh ở chỗ này mà không thấy ở chỗ kia. Cùng `danhSachVan`, chỉ
 * khác cách xếp: ở đây nó thành cây theo `gocId`.
 *
 * ── Vì sao tách nhánh không phải một nút "sao lưu" ──
 *
 * [BB] 43.6 — sửa Luật Nền **luôn** bắt tách nhánh. Nhánh không phải bản sao dự
 * phòng; nó là một dòng thời gian song song, và cả hai đều thật. Vì thế nút ở
 * đây hỏi **lý do tách**, và lý do ấy được lưu: sáu tháng sau, "nhánh 3" không
 * nói lên điều gì, còn "thử để Thời Gian hai chiều" thì có.
 */
import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../store/game.js';
import { nut, nhanNho, the, oNhap } from '../design/kieu.js';
const NHAN_TANG = Object.freeze({
    sang_the: 'Sáng Thế',
    than: 'Thần',
    pham_nhan: 'Phàm Nhân',
});
/**
 * Dựng cây từ danh sách phẳng.
 *
 * Nhánh có `gocId` trỏ tới một nhánh KHÔNG còn trong danh sách vẫn phải hiện —
 * nó thành nút gốc. Bỏ nó đi sẽ làm một ván biến mất khỏi giao diện chỉ vì cha
 * nó đã bị xóa, và đó là cách tệ nhất để mất dữ liệu: mất mà không báo.
 */
function dungCay(ds) {
    const theoId = new Map(ds.map((m) => [m.branchId, m]));
    const nut = new Map(ds.map((m) => [m.branchId, { muc: m, con: [] }]));
    const goc = [];
    for (const m of ds) {
        const n = nut.get(m.branchId);
        const cha = m.gocId !== null ? nut.get(m.gocId) : undefined;
        if (cha !== undefined && theoId.has(m.gocId))
            cha.con.push(n);
        else
            goc.push(n);
    }
    const sapXep = (ns) => {
        ns.sort((a, b) => a.muc.tick !== b.muc.tick ? a.muc.tick - b.muc.tick : a.muc.branchId < b.muc.branchId ? -1 : 1);
        for (const n of ns)
            sapXep(n.con);
    };
    sapXep(goc);
    return goc;
}
function DongNhanh({ nut: n, sau, dangMo, dangBan, onMo, }) {
    const m = n.muc;
    return (_jsxs(_Fragment, { children: [_jsxs("li", { style: {
                    ...the,
                    marginLeft: sau * 22,
                    display: 'grid',
                    gap: 6,
                    borderLeft: sau > 0 ? '2px solid var(--kinh-sang)' : undefined,
                }, children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }, children: [_jsx("strong", { style: { fontFamily: 'var(--chu-hien)', fontSize: 17 }, children: m.ten }), _jsx("span", { style: nhanNho, children: dangMo ? 'ĐANG CHƠI' : m.gocId === null ? 'GỐC' : `TÁCH Ở NHỊP ${m.tick}` })] }), m.lyDoTach.trim() !== '' && (_jsxs("p", { style: { margin: 0, fontSize: 13, color: 'var(--tro)' }, children: ["T\u00E1ch v\u00EC: ", m.lyDoTach] })), _jsxs("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: ["nh\u1ECBp ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: m.tick })] }), _jsxs("span", { children: ["n\u0103m ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: m.nam })] }), _jsxs("span", { children: ["t\u1EA7ng ", NHAN_TANG[m.mode] ?? m.mode] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: m.soEntity }), " th\u1EF1c th\u1EC3"] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: m.soSuKien }), " s\u1EF1 ki\u1EC7n"] })] }), !dangMo && (_jsx("button", { type: "button", style: { ...nut(false, dangBan), justifySelf: 'start' }, disabled: dangBan, onClick: onMo, children: "Nh\u1EA3y sang nh\u00E1nh n\u00E0y" }))] }), n.con.map((c) => (_jsx(DongNhanhCon, { nut: c, sau: sau + 1, dangBan: dangBan }, c.muc.branchId)))] }));
}
/** Nhánh con — tách ra để `dangMo` được tính lại ở mỗi tầng mà không truyền tay. */
function DongNhanhCon({ nut: n, sau, dangBan }) {
    const hienTai = useGame((s) => s.state?.world.branchId ?? '');
    const tiepTuc = useGame((s) => s.tiepTucVan);
    return (_jsx(DongNhanh, { nut: n, sau: sau, dangMo: n.muc.branchId === hienTai, dangBan: dangBan, onMo: () => void tiepTuc(n.muc.branchId) }));
}
export function BanDoNhanh() {
    const ds = useGame((s) => s.danhSachVan);
    const napDs = useGame((s) => s.napDanhSachVan);
    const hienTai = useGame((s) => s.state?.world.branchId ?? '');
    const tickHienTai = useGame((s) => s.state?.world.tick ?? 0);
    const tiepTuc = useGame((s) => s.tiepTucVan);
    const tach = useGame((s) => s.tachNhanh);
    const [ten, setTen] = useState('');
    const [lyDo, setLyDo] = useState('');
    const [dangBan, setDangBan] = useState(false);
    const [tin, setTin] = useState('');
    useEffect(() => {
        void napDs();
    }, [napDs]);
    const cay = useMemo(() => dungCay(ds), [ds]);
    return (_jsxs("main", { style: { maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 26 }, children: [_jsxs("header", { children: [_jsx("p", { style: nhanNho, children: "PH\u1EA6N 26 \u00B7 COPY-ON-WRITE" }), _jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }, children: "B\u1EA3n \u0110\u1ED3 Nh\u00E1nh" }), _jsx("p", { style: { color: 'var(--tro)', margin: 0, fontSize: 14 }, children: "Nh\u00E1nh kh\u00F4ng ph\u1EA3i b\u1EA3n sao d\u1EF1 ph\u00F2ng. N\u00F3 l\u00E0 m\u1ED9t d\u00F2ng th\u1EDDi gian song song, v\u00E0 c\u1EA3 hai \u0111\u1EC1u th\u1EADt. T\u00E1ch nh\u00E1nh kh\u00F4ng sao ch\u00E9p d\u1EEF li\u1EC7u \u2014 b\u1EA3n sao ch\u1EC9 sinh ra \u1EDF ch\u1ED7 hai nh\u00E1nh th\u1EADt s\u1EF1 kh\u00E1c nhau." })] }), hienTai !== '' && (_jsxs("section", { style: { ...the, display: 'grid', gap: 10 }, children: [_jsxs("h2", { style: { ...nhanNho, margin: 0 }, children: ["T\u00C1CH NH\u00C1NH T\u1EEA NH\u1ECAP ", tickHienTai] }), _jsxs("div", { style: { display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }, children: [_jsxs("label", { style: { display: 'grid', gap: 5 }, children: [_jsx("span", { style: nhanNho, children: "T\u00CAN NH\u00C1NH" }), _jsx("input", { style: oNhap, value: ten, maxLength: 80, placeholder: "D\u00F2ng th\u1EDDi gian th\u1EE9 hai", onChange: (e) => setTen(e.target.value) })] }), _jsxs("label", { style: { display: 'grid', gap: 5 }, children: [_jsx("span", { style: nhanNho, children: "L\u00DD DO T\u00C1CH" }), _jsx("input", { style: oNhap, value: lyDo, maxLength: 200, placeholder: "th\u1EED \u0111\u1EC3 Th\u1EDDi Gian hai chi\u1EC1u", onChange: (e) => setLyDo(e.target.value) })] })] }), _jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nut(true, dangBan), disabled: dangBan, onClick: () => {
                                    setDangBan(true);
                                    void tach(ten, lyDo)
                                        .then((ok) => {
                                        setTin(ok ? 'Đã tách và nhảy sang nhánh mới.' : 'Không tách được — xem Tự Chẩn Đoán.');
                                        if (ok) {
                                            setTen('');
                                            setLyDo('');
                                        }
                                    })
                                        .finally(() => setDangBan(false));
                                }, children: dangBan ? 'Đang tách…' : 'Tách nhánh và nhảy sang' }), _jsx("span", { style: { ...nhanNho, textTransform: 'none' }, children: "Nh\u00E1nh cha gi\u1EEF nguy\u00EAn. B\u1EA1n quay l\u1EA1i n\u00F3 b\u1EA5t c\u1EE9 l\u00FAc n\u00E0o t\u1EEB c\u00E2y b\u00EAn d\u01B0\u1EDBi." })] }), tin !== '' && _jsx("p", { style: { margin: 0, fontSize: 13, color: 'var(--tro)' }, children: tin })] })), _jsxs("section", { style: { display: 'grid', gap: 10 }, children: [_jsx("h2", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }, children: "C\u00E2y nh\u00E1nh" }), cay.length === 0 ? (_jsx("p", { style: { color: 'var(--mo)', fontSize: 13, margin: 0 }, children: "Ch\u01B0a c\u00F3 v\u00E1n n\u00E0o tr\u00EAn m\u00E1y n\u00E0y. Nh\u00E1nh \u0111\u1EA7u ti\u00EAn sinh ra c\u00F9ng v\u00E1n \u0111\u1EA7u ti\u00EAn." })) : (_jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }, children: cay.map((n) => (_jsx(DongNhanh, { nut: n, sau: 0, dangMo: n.muc.branchId === hienTai, dangBan: dangBan, onMo: () => void tiepTuc(n.muc.branchId) }, n.muc.branchId))) }))] })] }));
}
