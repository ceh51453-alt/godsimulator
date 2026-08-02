import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Bảng Thông Tin Thiên Địa — Phần 58, lớp phủ mở bằng `I`.
 *
 * [BB] 58.3 — màn mặc định phải chứa TÊN THẬT của ít nhất một luật, một tạo vật,
 * một thần hệ và một mạch truyện nếu chúng tồn tại. Đó là lý do tab Tổng quan
 * dưới đây không phải một bảng số: nó liệt kê tên.
 *
 * [BB] 58.4 — dải định vị năm trường KHÔNG BAO GIỜ cuộn khỏi màn hình.
 *
 * [BB] 58.13 — không "Không có dữ liệu". Mỗi tab có câu rỗng của thế giới, lấy
 * từ `CAU_RONG` để câu chữ và logic không bao giờ lệch nhau.
 */
import { useMemo } from 'react';
import { TAB_THONG_TIN, nhanTab, CAU_RONG, timTrongBang } from '../../core/bang/thongTin.js';
const nhan = {
    color: 'var(--mo)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};
const so = { fontSize: 13, color: 'var(--tro)' };
const phu = { fontSize: 11, color: 'var(--mo)' };
function nutTab(bat) {
    return {
        background: 'transparent',
        color: bat ? 'var(--dong)' : 'var(--tro)',
        border: `1px solid ${bat ? 'var(--dong)' : 'var(--kinh-vien)'}`,
        borderRadius: 999,
        padding: '5px 13px',
        font: 'inherit',
        fontSize: 13,
        cursor: 'pointer',
    };
}
function Rong({ tab }) {
    return _jsx("p", { style: { ...phu, fontStyle: 'italic', maxWidth: 520 }, children: CAU_RONG[tab] });
}
/** Bảng rộng tự cuộn ngang trong hộp của nó — thân trang không bao giờ cuộn ngang. */
function Bang({ cot, hang }) {
    return (_jsx("div", { className: "cuon-ngang", children: _jsxs("table", { style: { borderCollapse: 'collapse', width: '100%', minWidth: 560 }, children: [_jsx("thead", { children: _jsx("tr", { children: cot.map((c) => (_jsx("th", { style: { ...nhan, textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 400 }, children: c }, c))) }) }), _jsx("tbody", { children: hang.map((h, i) => (_jsx("tr", { style: { borderTop: '1px solid var(--kinh-vien)' }, children: h.map((o, j) => (_jsx("td", { style: { ...so, padding: '7px 12px 7px 0', verticalAlign: 'top' }, children: o }, j))) }, i))) })] }) }));
}
export function BangThongTin({ du, tab, tim, theoDoiMachIds, onDoiTab, onTim, onGhimMach, onDong, }) {
    const ketQuaTim = useMemo(() => timTrongBang(du, tim), [du, tim]);
    return (_jsxs("section", { className: "lop-phu", role: "region", "aria-label": "B\u1EA3ng Th\u00F4ng Tin Thi\u00EAn \u0110\u1ECBa", onKeyDown: (e) => {
            if (e.key === 'Escape')
                onDong();
        }, children: [_jsxs("div", { style: {
                    position: 'sticky',
                    top: -18,
                    zIndex: 1,
                    background: 'rgba(10, 12, 17, 0.94)',
                    margin: '-18px -22px 14px',
                    padding: '16px 22px 12px',
                    borderBottom: '1px solid var(--kinh-vien)',
                }, children: [_jsxs("div", { style: { display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }, children: [_jsx("h2", { className: "chu-hien", style: { margin: 0, fontSize: 20 }, children: du.daiDinhVi.theGioi }), _jsx("span", { style: so, children: du.daiDinhVi.thoiDiem }), _jsxs("span", { style: phu, children: ["nh\u00E1nh ", du.daiDinhVi.nhanh] }), _jsx("span", { style: phu, children: du.daiDinhVi.tangChoi }), _jsxs("span", { style: phu, children: ["\u1ED1ng k\u00EDnh: ", du.daiDinhVi.ongKinh] }), _jsx("button", { type: "button", onClick: onDong, style: { ...nutTab(false), marginLeft: 'auto' }, "aria-label": "\u0110\u00F3ng B\u1EA3ng Th\u00F4ng Tin", children: "\u0110\u00F3ng" })] }), _jsxs("div", { style: { display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }, children: [TAB_THONG_TIN.map((t) => (_jsxs("button", { type: "button", style: nutTab(t === tab), "aria-current": t === tab ? 'true' : undefined, onClick: () => onDoiTab(t), children: [nhanTab(t, du.mode), du.dem[t] > 0 ? ` ${du.dem[t]}` : ''] }, t))), _jsx("label", { htmlFor: "oTim", style: { position: 'absolute', left: -9999 }, children: "T\u00ECm trong b\u1EA3ng" }), _jsx("input", { id: "oTim", value: tim, onChange: (e) => onTim(e.target.value), placeholder: "T\u00ECm t\u00EAn lu\u1EADt, t\u1EA1o v\u1EADt, th\u1EA7n h\u1EC7, m\u1EA1ch\u2026", className: "kinh--cap2", style: {
                                    marginLeft: 'auto',
                                    minWidth: 220,
                                    color: 'var(--sang)',
                                    border: '1px solid var(--kinh-vien)',
                                    borderRadius: 'var(--r-sm)',
                                    padding: '6px 11px',
                                    font: 'inherit',
                                    fontSize: 13,
                                    background: 'var(--kinh-nen-2)',
                                } })] })] }), tim.trim() !== '' && (_jsxs("div", { style: { marginBottom: 18 }, children: [_jsxs("h3", { style: { ...nhan, margin: '0 0 8px' }, children: [ketQuaTim.length, " k\u1EBFt qu\u1EA3"] }), ketQuaTim.length === 0 ? (_jsx("p", { style: phu, children: "Kh\u00F4ng c\u00F3 g\u00EC trong t\u1EA7m nh\u00ECn c\u1EE7a ng\u01B0\u01A1i mang c\u00E1i t\u00EAn \u0111\u00F3." })) : (_jsx("div", { style: { display: 'grid', gap: 4 }, children: ketQuaTim.map((k) => (_jsxs("button", { type: "button", onClick: () => onDoiTab(k.tab), style: {
                                display: 'flex',
                                gap: 10,
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid var(--kinh-vien)',
                                padding: '5px 0',
                                font: 'inherit',
                                color: 'inherit',
                                cursor: 'pointer',
                            }, children: [_jsx("span", { style: { ...phu, minWidth: 92 }, children: nhanTab(k.tab, du.mode) }), _jsx("span", { style: { ...so, flex: 1, minWidth: 0 }, children: k.ten }), _jsx("span", { style: phu, children: k.vi })] }, `${k.tab}:${k.id}`))) }))] })), tab === 'tong_quan' && (_jsxs("div", { className: "luoi-doi", children: [_jsxs("div", { children: [_jsx("h3", { style: { ...nhan, margin: '0 0 10px' }, children: "Quy lu\u1EADt \u0111ang \u0111\u1ECBnh h\u00ECnh th\u1EBF gi\u1EDBi" }), du.quyLuat.length === 0 ? (_jsx(Rong, { tab: "quy_luat" })) : (du.quyLuat.slice(0, 4).map((l) => (_jsxs("div", { style: { marginBottom: 9 }, children: [_jsx("div", { className: "ten-rieng", style: so, children: l.ten }), _jsxs("div", { style: phu, children: [l.trangThai, l.hieuLuc === null ? '' : ` · hiệu lực ${l.hieuLuc}`, " \u00B7 ", l.phamVi, l.soVanDe > 0 ? ` · ${l.soVanDe} vấn đề` : ''] }), l.cau === '' ? null : _jsxs("div", { style: { ...phu, fontStyle: 'italic' }, children: ["\u201C", l.cau, "\u201D"] })] }, l.id)))), _jsx("h3", { style: { ...nhan, margin: '18px 0 10px' }, children: "M\u1EA1ch \u0111ang theo d\u00F5i" }), du.machTruyen.length === 0 ? (_jsx(Rong, { tab: "mach_truyen" })) : (du.machTruyen.slice(0, 4).map((m) => (_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline' }, children: [_jsx("span", { style: { ...so, flex: 1, minWidth: 0 }, children: m.ten }), _jsx("span", { style: phu, children: m.giaiDoan }), m.dangXem ? _jsx("span", { style: { ...phu, color: 'var(--dong)' }, children: "\u0111ang xem" }) : null] }, m.id))))] }), _jsxs("div", { children: [_jsx("h3", { style: { ...nhan, margin: '0 0 10px' }, children: nhanTab('ta', du.mode) }), _jsx("div", { style: so, children: du.ta.danhXung }), _jsxs("div", { style: phu, children: [du.ta.banThe, " \u00B7 ", du.ta.trangThai] }), _jsx("div", { style: { ...phu, marginTop: 6 }, children: du.ta.theGianGoi.join(' · ') }), _jsx("h3", { style: { ...nhan, margin: '18px 0 10px' }, children: "T\u1EA1o v\u1EADt v\u00E0 th\u1EA7n h\u1EC7" }), du.taoVat.length === 0 ? (_jsx(Rong, { tab: "tao_vat" })) : (du.taoVat.slice(0, 5).map((t) => (_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline' }, children: [_jsx("span", { className: "ten-rieng", style: { ...so, flex: 1, minWidth: 0 }, children: t.ten }), _jsxs("span", { style: phu, children: [t.loai, " \u00B7 ", t.nguonSinh] })] }, t.id)))), du.thanHe.length === 0 ? (_jsx("p", { style: { ...phu, fontStyle: 'italic', marginTop: 8 }, children: CAU_RONG.than_he })) : (du.thanHe.slice(0, 3).map((p) => (_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline', marginTop: 6 }, children: [_jsx("span", { className: "ten-rieng", style: { ...so, flex: 1, minWidth: 0 }, children: p.ten }), _jsxs("span", { style: phu, children: [p.soThanhVien, " th\u1EA7n \u00B7 ng\u00F4i \u0111\u1EA7u ", p.ngoiDau] })] }, p.id))))] })] })), tab === 'quy_luat' &&
                (du.quyLuat.length === 0 ? (_jsx(Rong, { tab: "quy_luat" })) : (_jsx(Bang, { cot: ['Quy luật', 'Tầng', 'Trạng thái', 'Hiệu lực', 'Phạm vi', 'Nguồn', 'Vấn đề'], hang: du.quyLuat.map((l) => [
                        l.cau === '' ? l.ten : `${l.ten} — ${l.cau}`,
                        l.tang,
                        l.trangThai,
                        l.hieuLuc === null ? 'chưa tính' : String(l.hieuLuc),
                        l.phamVi,
                        l.nguon,
                        l.soVanDe === 0 ? 'không' : `${l.soVanDe}`,
                    ]) }))), tab === 'tao_vat' && (_jsxs(_Fragment, { children: [_jsx("div", { style: { display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }, children: du.chipLoai.map((c) => (_jsxs("span", { style: {
                                ...phu,
                                border: '1px solid var(--kinh-vien)',
                                borderRadius: 999,
                                padding: '3px 10px',
                            }, children: [c.nhan, " ", c.so] }, c.kindId))) }), du.taoVat.length === 0 ? (_jsx(Rong, { tab: "tao_vat" })) : (_jsx(Bang, { cot: ['Tên', 'Loại', 'Nguồn sinh', 'Trạng thái', 'Ảnh hưởng', 'Nơi hiện diện', 'Liên kết lớn'], hang: du.taoVat
                            .slice(0, 200)
                            .map((t) => [
                            t.ten,
                            t.loai,
                            t.nguonSinh,
                            t.trangThai,
                            t.anhHuong.join(', ') || '—',
                            t.noiHienDien,
                            t.lienKetLon.join('; ') || '—',
                        ]) }))] })), tab === 'than_he' &&
                (du.thanHe.length === 0 ? (_jsx(Rong, { tab: "than_he" })) : (_jsx(Bang, { cot: ['Thần hệ', 'Mô hình', 'Ngôi đầu', 'Thành viên', 'Domain trội', 'Phạm vi'], hang: du.thanHe.map((p) => [
                        p.ten,
                        p.moHinh,
                        p.ngoiDau,
                        String(p.soThanhVien),
                        p.domainTroi.join(', ') || '—',
                        p.phamVi,
                    ]) }))), tab === 'mach_truyen' &&
                (du.machTruyen.length === 0 ? (_jsx(Rong, { tab: "mach_truyen" })) : (_jsx("div", { style: { display: 'grid', gap: 6 }, children: du.machTruyen.map((m) => (_jsxs("div", { style: {
                            display: 'flex',
                            gap: 12,
                            alignItems: 'baseline',
                            borderBottom: '1px solid var(--kinh-vien)',
                            paddingBottom: 6,
                            flexWrap: 'wrap',
                        }, children: [_jsx("button", { type: "button", onClick: () => onGhimMach(m.id), style: { ...nutTab(theoDoiMachIds.includes(m.id)), fontSize: 12, padding: '3px 10px' }, children: theoDoiMachIds.includes(m.id) ? 'Bỏ theo dõi' : 'Theo dõi' }), _jsx("span", { style: { ...so, flex: 1, minWidth: 140 }, children: m.ten }), _jsx("span", { style: phu, children: m.loai }), _jsx("span", { style: phu, children: m.giaiDoan }), _jsxs("span", { className: "chu-so", style: phu, children: ["c\u0103ng th\u1EB3ng ", m.cangThang] }), _jsxs("span", { style: phu, children: [m.soNutChuaGo, " n\u00FAt ch\u01B0a g\u1EE1"] }), _jsx("span", { style: phu, children: m.nhanVatChinh.join(', ') || 'chưa ai vào cuộc' }), m.dangXem ? _jsx("span", { style: { ...phu, color: 'var(--dong)' }, children: "\u0111ang xem" }) : null] }, m.id))) }))), tab === 'ta' && (_jsxs("div", { className: "luoi-doi", children: [_jsxs("div", { children: [_jsx("h3", { style: { ...nhan, margin: '0 0 8px' }, children: "Ta \u0111ang l\u00E0 ai" }), _jsx("div", { style: so, children: du.ta.danhXung }), _jsxs("div", { style: phu, children: [du.ta.banThe, " \u00B7 ", du.ta.trangThai] }), _jsx("h3", { style: { ...nhan, margin: '18px 0 8px' }, children: "Th\u1EBF gi\u1EDBi ngh\u0129 ta l\u00E0 ai" }), du.ta.theGianGoi.map((t) => (_jsx("div", { style: phu, children: t }, t)))] }), _jsxs("div", { children: [_jsx("h3", { style: { ...nhan, margin: '0 0 8px' }, children: "Ta \u0111\u00E3 \u0111\u1EC3 l\u1EA1i g\u00EC" }), du.ta.dauAn.length === 0 ? (_jsx(Rong, { tab: "ta" })) : (du.ta.dauAn.map((d) => (_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'baseline' }, children: [_jsx("span", { className: "ten-rieng", style: { ...so, flex: 1, minWidth: 0 }, children: d.ten }), _jsx("span", { style: phu, children: d.loai })] }, `${d.ten}:${d.tick}`)))), _jsx("h3", { style: { ...nhan, margin: '18px 0 8px' }, children: "H\u00E0nh \u0111\u1ED9ng c\u1EE7a ta \u0111\u00E3 \u0111i t\u1EDBi \u0111\u00E2u" }), du.ta.heQua.length === 0 ? (_jsx("p", { style: phu, children: "Ch\u01B0a c\u00F3 chu\u1ED7i h\u1EC7 qu\u1EA3 n\u00E0o truy \u0111\u01B0\u1EE3c v\u1EC1 m\u1ED9t h\u00E0nh \u0111\u1ED9ng c\u1EE7a ng\u01B0\u01A1i." })) : (du.ta.heQua.map((h) => (_jsxs("div", { style: { marginBottom: 10 }, children: [_jsx("div", { style: so, children: h.moc }), h.cacBuoc.map((b, i) => (_jsxs("div", { style: { ...phu, paddingLeft: 12 * (i + 1) }, children: ["\u2192 ", b] }, i)))] }, h.moc))))] })] }))] }));
}
