import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Màn Khởi Nguyên — Phần 78.5, bốn chế độ.
 *
 * ── Vì sao bốn chứ không phải một form dài có nút "bỏ qua" ──
 *
 * 78.5 đòi đúng bốn: `Nhanh | Gợi ý | Đầy đủ | Bỏ qua`. Một form dài kèm nút bỏ
 * qua nhìn thì giống, nhưng nó bắt người chơi **nhìn thấy** mọi ô họ đang không
 * điền — và cảm giác "mình đang bỏ dở cái gì đó" là đúng thứ khiến người ta điền
 * bừa. Bốn chế độ nói rõ: chế độ này chỉ có ngần này ô, và ngần ấy là đủ.
 *
 * ── Bảng riêng tư ──
 *
 * [BB] 78.11 + cổng Phase 11 "không ép dữ liệu thật". `diffCongBo()` chia mọi thứ
 * người chơi vừa gõ thành ba cột: **chỉ mình bạn thấy · gửi Narrator · thành
 * canon**. Nó cập nhật ngay khi gõ, không đợi bấm nút, vì một bảng privacy chỉ
 * hiện lúc cuối là một bảng người ta bấm qua.
 *
 * [BB] `Bỏ qua` phải vào game được ngay, không màn hình chặn nào.
 * [BB] Không hỏi email, tuổi, giới tính hay ngày sinh — schema không có chỗ chứa.
 * [BB] Dùng được hoàn toàn bằng bàn phím.
 */
import { useMemo, useState } from 'react';
import { useGame } from '../../store/game.js';
import { PlayerProfileSchema, CreatorIdentitySchema, hoSoToiThieu } from '../../core/schema/player.js';
import { diffCongBo } from '../../core/privacy/project.js';
import { nut as nutChung } from '../design/kieu.js';
const o = {
    background: 'var(--nen-2)',
    color: 'var(--chu-1)',
    border: '1px solid var(--vien)',
    borderRadius: 8,
    padding: '9px 12px',
    font: 'inherit',
    width: '100%',
};
const nut = (chinh) => ({
    background: chinh ? 'var(--mau-ngoc)' : 'transparent',
    color: chinh ? '#0d0c0f' : 'var(--chu-1)',
    border: `1px solid ${chinh ? 'var(--mau-ngoc)' : 'var(--vien)'}`,
    borderRadius: 8,
    padding: '10px 18px',
    font: 'inherit',
    fontWeight: chinh ? 600 : 400,
    cursor: 'pointer',
});
const nhanMuc = {
    fontSize: 13,
    letterSpacing: '0.1em',
    color: 'var(--chu-3)',
    textTransform: 'uppercase',
};
/**
 * Bốn chế độ — [BB] 78.5.
 *
 * `Gợi ý` khác `Nhanh` ở chỗ nó ĐỀ XUẤT sẵn giá trị chứ không thêm ô trống: đây
 * là chế độ cho người chưa biết mình muốn gì, và đưa họ thêm ô trống thì không
 * giúp được gì.
 */
const CHE_DO = [
    { id: 'bo_qua', ten: 'Bỏ qua', moTa: 'Vào thẳng. Hồ sơ trống, hoàn thiện lúc nào cũng được.' },
    { id: 'nhanh', ten: 'Nhanh', moTa: 'Một cái tên và một cửa vào. Ba mươi giây.' },
    { id: 'goi_y', ten: 'Gợi ý', moTa: 'Thêm đại từ và cách kể — đã điền sẵn, bạn chỉ sửa chỗ không vừa.' },
    { id: 'day_du', ten: 'Đầy đủ', moTa: 'Thêm danh tính Sáng Thế và phần bạn chọn công bố cho thế giới.' },
];
const CUA = [
    { id: 'hu_vo', ten: 'Hư Vô', moTa: 'Không nói gì. Nhịp đầu tiên diễn ra trong cái chưa có tên.' },
    { id: 'mot_cau', ten: 'Một Câu', moTa: 'Viết một câu. Nó là toàn bộ tiền đề, và thế giới lớn lên từ đó.' },
    {
        id: 'day_du',
        ten: 'Đầy Đủ',
        moTa: 'Thêm nguyên mẫu sáng thế — vẫn chỉ là tiền đề, không phải nội dung.',
    },
];
function Muc({ id, ten, children }) {
    return (_jsxs("section", { "aria-labelledby": id, style: { marginTop: 28 }, children: [_jsx("h2", { id: id, style: nhanMuc, children: ten }), children] }));
}
function O({ nhan, giaTri, onDoi, goiY, dai, }) {
    return (_jsxs("label", { style: { display: 'grid', gap: 5, marginTop: 10 }, children: [_jsx("span", { style: { color: 'var(--chu-2)', fontSize: 14 }, children: nhan }), _jsx("input", { style: o, value: giaTri, maxLength: dai ?? 200, placeholder: goiY, onChange: (e) => onDoi(e.target.value) })] }));
}
function Chon({ nhan, giaTri, ds, onDoi, }) {
    return (_jsxs("label", { style: { display: 'grid', gap: 5, marginTop: 10 }, children: [_jsx("span", { style: { color: 'var(--chu-2)', fontSize: 14 }, children: nhan }), _jsx("select", { style: o, value: giaTri, onChange: (e) => onDoi(e.target.value), children: ds.map((x) => (_jsx("option", { value: x.id, children: x.ten }, x.id))) })] }));
}
export function KhoiNguyen({ onQuayLai } = {}) {
    const batDau = useGame((s) => s.batDau);
    const batDauBoQua = useGame((s) => s.batDauBoQua);
    const [cheDo, setCheDo] = useState('nhanh');
    const [cua, setCua] = useState('hu_vo');
    const [motCau, setMotCau] = useState('');
    // ── hồ sơ ──
    const [ten, setTen] = useState('');
    const [xungHo, setXungHo] = useState('bạn');
    const [tuXung, setTuXung] = useState('ta');
    const [pov, setPov] = useState('tu_dong');
    const [doDay, setDoDay] = useState('vua');
    const [thoai, setThoai] = useState('vua');
    const [giamChuyenDong, setGiamChuyenDong] = useState(false);
    const [chuDeAn, setChuDeAn] = useState('');
    const [ghiChuRieng, setGhiChuRieng] = useState('');
    // ── danh tính Sáng Thế ──
    const [danhXung, setDanhXung] = useState('');
    const [hienThan, setHienThan] = useState('');
    const [gtri, setGtri] = useState('');
    const [loDanhXung, setLoDanhXung] = useState(false);
    const [loHinhDang, setLoHinhDang] = useState(false);
    const [loGiaTri, setLoGiaTri] = useState(false);
    const hoSo = useMemo(() => {
        const nen = hoSoToiThieu('pf_local', 0);
        if (cheDo === 'bo_qua')
            return nen;
        return PlayerProfileSchema.parse({
            ...nen,
            displayName: ten.trim() || 'Người Chơi',
            ...(cheDo === 'nhanh'
                ? {}
                : {
                    pronouns: {
                        self: tuXung.trim() || 'ta',
                        subject: xungHo.trim() || 'bạn',
                        object: xungHo.trim() || 'bạn',
                    },
                    narrativePreferences: { pov, proseDensity: doDay, dialogueAmount: thoai, showSuggestions: true },
                }),
            ...(cheDo === 'day_du'
                ? {
                    accessibility: { ...nen.accessibility, reducedMotion: giamChuyenDong },
                    contentPreferences: {
                        ...nen.contentPreferences,
                        sensitiveTopicsHidden: chuDeAn
                            .split(',')
                            .map((s) => s.trim())
                            .filter((s) => s !== ''),
                    },
                    privateNotes: ghiChuRieng.slice(0, 4_000),
                }
                : {}),
        });
    }, [cheDo, ten, tuXung, xungHo, pov, doDay, thoai, giamChuyenDong, chuDeAn, ghiChuRieng]);
    const danhTinh = useMemo(() => {
        if (cheDo !== 'day_du')
            return null;
        if (danhXung.trim() === '' && hienThan.trim() === '' && gtri.trim() === '')
            return null;
        return CreatorIdentitySchema.parse({
            id: 'ci_local',
            saveId: 'w1',
            title: danhXung.trim() || 'Kẻ Không Tên',
            manifestationDescription: hienThan.trim(),
            values: gtri
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s !== '')
                .slice(0, 12),
            worldDisclosure: { revealTitle: loDanhXung, revealForm: loHinhDang, revealValues: loGiaTri },
        });
    }, [cheDo, danhXung, hienThan, gtri, loDanhXung, loHinhDang, loGiaTri]);
    /**
     * Bảng riêng tư, tính lại mỗi lần gõ.
     *
     * `diffCongBo()` là hàm của `core/privacy`, cùng hàm mà cổng Phase 0 đã kiểm
     * bằng 29 test rò rỉ. Màn này không tự phân loại lấy — tự phân loại nghĩa là
     * có hai nguồn chân lý, và cái ở giao diện sẽ là cái sai.
     */
    const diff = useMemo(() => diffCongBo({ profile: hoSo, creator: danhTinh, mode: 'sang_the', currentEntityId: null }), [hoSo, danhTinh]);
    const chay = () => {
        if (cheDo === 'bo_qua') {
            void batDauBoQua();
            return;
        }
        void batDau({ hoSo, danhTinh, cua, motCau });
    };
    return (_jsxs("main", { style: { maxWidth: 720, margin: '0 auto', padding: '56px 20px 80px' }, children: [onQuayLai !== undefined && (_jsx("button", { style: { ...nutChung(false), marginBottom: 18 }, onClick: onQuayLai, children: "Quay l\u1EA1i S\u1EA3nh V\u00E0o" })), _jsx("p", { style: { color: 'var(--chu-3)', margin: 0, letterSpacing: '0.12em', fontSize: 12 }, children: "THI\u00CAN DI\u1EC4N" }), _jsx("h1", { style: { fontSize: 32, margin: '6px 0 8px', fontWeight: 600 }, children: "Kh\u1EDFi Nguy\u00EAn" }), _jsx("p", { style: { color: 'var(--chu-2)', marginTop: 0 }, children: "Th\u1EBF gi\u1EDBi m\u1EDF ra r\u1ED7ng: kh\u00F4ng \u0111\u1EA5t, kh\u00F4ng lu\u1EADt, kh\u00F4ng th\u1EA7n, kh\u00F4ng ng\u01B0\u1EDDi. M\u1ECDi th\u1EE9 ch\u1EC9 t\u1ED3n t\u1EA1i sau khi \u0111\u01B0\u1EE3c k\u1EC3 ra trong l\u00FAc ch\u01A1i." }), _jsx(Muc, { id: "h-chedo", ten: "B\u1EA1n mu\u1ED1n thi\u1EBFt l\u1EADp bao nhi\u00EAu", children: _jsx("div", { role: "radiogroup", "aria-labelledby": "h-chedo", style: { display: 'grid', gap: 8 }, children: CHE_DO.map((c) => (_jsxs("label", { style: {
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                            border: `1px solid ${cheDo === c.id ? 'var(--mau-ngoc)' : 'var(--vien)'}`,
                            borderRadius: 8,
                            padding: '10px 12px',
                            cursor: 'pointer',
                            background: 'var(--nen-1)',
                        }, children: [_jsx("input", { type: "radio", name: "chedo", checked: cheDo === c.id, onChange: () => setCheDo(c.id), style: { marginTop: 4 } }), _jsxs("span", { children: [_jsx("span", { style: { fontWeight: 600 }, children: c.ten }), _jsx("span", { style: { display: 'block', color: 'var(--chu-2)', fontSize: 14 }, children: c.moTa })] })] }, c.id))) }) }), cheDo !== 'bo_qua' && (_jsxs(_Fragment, { children: [_jsxs(Muc, { id: "h-hoso", ten: "H\u1ED3 s\u01A1 c\u1EE7a b\u1EA1n", children: [_jsx(O, { nhan: "T\u00EAn hi\u1EC3n th\u1ECB (t\u00F9y ch\u1ECDn)", giaTri: ten, onDoi: setTen, goiY: "Ng\u01B0\u1EDDi Ch\u01A1i", dai: 80 }), _jsxs("p", { style: { color: 'var(--chu-3)', fontSize: 13, marginTop: 8 }, children: ["T\u00EAn n\u00E0y ch\u1EC9 \u0111\u1EC3 giao di\u1EC7n g\u1ECDi b\u1EA1n. N\u00F3 ", _jsx("strong", { children: "kh\u00F4ng" }), " t\u1EF1 tr\u1EDF th\u00E0nh danh x\u01B0ng c\u1EE7a S\u00E1ng Th\u1EBF Th\u1EA7n, v\u00E0 th\u1EBF gi\u1EDBi s\u1EBD kh\u00F4ng bi\u1EBFt t\u1EDBi n\u00F3 cho t\u1EDBi khi b\u1EA1n c\u00F4ng b\u1ED1."] }), cheDo !== 'nhanh' && (_jsxs(_Fragment, { children: [_jsx(O, { nhan: "Th\u1EBF gi\u1EDBi g\u1ECDi b\u1EA1n l\u00E0", giaTri: xungHo, onDoi: setXungHo, goiY: "b\u1EA1n", dai: 40 }), _jsx(O, { nhan: "B\u1EA1n t\u1EF1 x\u01B0ng l\u00E0", giaTri: tuXung, onDoi: setTuXung, goiY: "ta", dai: 40 }), _jsx(Chon, { nhan: "Ng\u00F4i k\u1EC3", giaTri: pov, onDoi: setPov, ds: [
                                            { id: 'tu_dong', ten: 'Tự động — theo tầng đang chơi' },
                                            { id: 'thu_nhat', ten: 'Thứ nhất' },
                                            { id: 'thu_ba', ten: 'Thứ ba' },
                                            { id: 'toan_canh', ten: 'Toàn cảnh' },
                                        ] }), _jsx(Chon, { nhan: "\u0110\u1ED9 d\u00E0y v\u0103n", giaTri: doDay, onDoi: setDoDay, ds: [
                                            { id: 'gon', ten: 'Gọn' },
                                            { id: 'vua', ten: 'Vừa' },
                                            { id: 'day', ten: 'Dày' },
                                        ] }), _jsx(Chon, { nhan: "L\u01B0\u1EE3ng \u0111\u1ED1i tho\u1EA1i", giaTri: thoai, onDoi: setThoai, ds: [
                                            { id: 'it', ten: 'Ít' },
                                            { id: 'vua', ten: 'Vừa' },
                                            { id: 'nhieu', ten: 'Nhiều' },
                                        ] })] })), cheDo === 'day_du' && (_jsxs(_Fragment, { children: [_jsxs("label", { style: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 14 }, children: [_jsx("input", { type: "checkbox", checked: giamChuyenDong, onChange: (e) => setGiamChuyenDong(e.target.checked) }), _jsx("span", { style: { color: 'var(--chu-2)' }, children: "Gi\u1EA3m chuy\u1EC3n \u0111\u1ED9ng trong giao di\u1EC7n" })] }), _jsx(O, { nhan: "Ch\u1EE7 \u0111\u1EC1 mu\u1ED1n \u1EA9n (c\u00E1ch nhau b\u1EB1ng d\u1EA5u ph\u1EA9y)", giaTri: chuDeAn, onDoi: setChuDeAn, goiY: "b\u1EA1o l\u1EF1c v\u1EDBi tr\u1EBB em, tra t\u1EA5n", dai: 400 }), _jsx(O, { nhan: "Ghi ch\u00FA ri\u00EAng \u2014 kh\u00F4ng bao gi\u1EDD r\u1EDDi kh\u1ECFi m\u00E1y n\u00E0y", giaTri: ghiChuRieng, onDoi: setGhiChuRieng, goiY: "ch\u1EC9 m\u00ECnh b\u1EA1n \u0111\u1ECDc", dai: 600 })] }))] }), cheDo === 'day_du' && (_jsxs(Muc, { id: "h-danhtinh", ten: "Danh t\u00EDnh S\u00E1ng Th\u1EBF", children: [_jsxs("p", { style: { color: 'var(--chu-3)', fontSize: 13, margin: 0 }, children: ["\u0110\u00E2y l\u00E0 l\u1EDBp kh\u00E1c h\u1EB3n h\u1ED3 s\u01A1. Th\u1EBF gi\u1EDBi ch\u1EC9 bi\u1EBFt nh\u1EEFng g\u00EC b\u1EA1n ", _jsx("strong", { children: "ch\u1EE7 \u0111\u1ED9ng c\u00F4ng b\u1ED1" }), " \u2014 ph\u1EA7n c\u00F2n l\u1EA1i l\u00E0 chuy\u1EC7n ri\u00EAng gi\u1EEFa b\u1EA1n v\u00E0 m\u00E0n h\u00ECnh."] }), _jsx(O, { nhan: "Danh x\u01B0ng", giaTri: danhXung, onDoi: setDanhXung, goiY: "K\u1EBB Kh\u00F4ng T\u00EAn", dai: 120 }), _jsxs("label", { style: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, fontSize: 14 }, children: [_jsx("input", { type: "checkbox", checked: loDanhXung, onChange: (e) => setLoDanhXung(e.target.checked) }), _jsx("span", { style: { color: 'var(--chu-2)' }, children: "C\u00F4ng b\u1ED1 danh x\u01B0ng cho th\u1EBF gi\u1EDBi" })] }), _jsx(O, { nhan: "B\u1EA1n hi\u1EC7n ra th\u1EBF n\u00E0o", giaTri: hienThan, onDoi: setHienThan, goiY: "m\u1ED9t v\u1EC7t s\u00E1ng kh\u00F4ng c\u00F3 h\u00ECnh", dai: 400 }), _jsxs("label", { style: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, fontSize: 14 }, children: [_jsx("input", { type: "checkbox", checked: loHinhDang, onChange: (e) => setLoHinhDang(e.target.checked) }), _jsx("span", { style: { color: 'var(--chu-2)' }, children: "C\u00F4ng b\u1ED1 h\u00ECnh d\u1EA1ng" })] }), _jsx(O, { nhan: "\u0110i\u1EC1u b\u1EA1n coi tr\u1ECDng (c\u00E1ch nhau b\u1EB1ng d\u1EA5u ph\u1EA9y)", giaTri: gtri, onDoi: setGtri, goiY: "c\u00E2n b\u1EB1ng, kh\u00F4ng can thi\u1EC7p", dai: 400 }), _jsxs("label", { style: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, fontSize: 14 }, children: [_jsx("input", { type: "checkbox", checked: loGiaTri, onChange: (e) => setLoGiaTri(e.target.checked) }), _jsx("span", { style: { color: 'var(--chu-2)' }, children: "C\u00F4ng b\u1ED1 nh\u1EEFng \u0111i\u1EC1u \u1EA5y" })] }), _jsxs("p", { style: { color: 'var(--chu-3)', fontSize: 13, marginTop: 10 }, children: ["C\u00F4ng b\u1ED1 m\u1ED9t l\u1EDDi th\u1EC1 ", _jsx("strong", { children: "kh\u00F4ng" }), " l\u00E0m n\u00F3 r\u00E0ng bu\u1ED9c engine. Ch\u1EC9 l\u1EDDi th\u1EC1 \u0111\u00E3 \u0111\u01B0\u1EE3c ban th\u00E0nh Lu\u1EADt m\u1EDBi r\u00E0ng bu\u1ED9c \u2014 v\u00E0 ban lu\u1EADt l\u00E0 vi\u1EC7c b\u1EA1n l\u00E0m trong l\u00FAc ch\u01A1i."] })] })), _jsxs(Muc, { id: "h-cua", ten: "Ba c\u00E1ch kh\u1EDFi \u0111\u1EA7u", children: [_jsx("div", { role: "radiogroup", "aria-labelledby": "h-cua", style: { display: 'grid', gap: 8 }, children: CUA.map((c) => (_jsxs("label", { style: {
                                        display: 'flex',
                                        gap: 10,
                                        alignItems: 'flex-start',
                                        border: `1px solid ${cua === c.id ? 'var(--mau-ngoc)' : 'var(--vien)'}`,
                                        borderRadius: 8,
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        background: 'var(--nen-1)',
                                    }, children: [_jsx("input", { type: "radio", name: "cua", checked: cua === c.id, onChange: () => setCua(c.id), style: { marginTop: 4 } }), _jsxs("span", { children: [_jsx("span", { style: { fontWeight: 600 }, children: c.ten }), _jsx("span", { style: { display: 'block', color: 'var(--chu-2)', fontSize: 14 }, children: c.moTa })] })] }, c.id))) }), cua === 'mot_cau' && (_jsx(O, { nhan: "M\u1ED9t c\u00E2u v\u1EC1 th\u1EBF gi\u1EDBi c\u1EE7a b\u1EA1n", giaTri: motCau, onDoi: setMotCau, goiY: "M\u1ED9t th\u1EBF gi\u1EDBi n\u01A1i m\u00E1u \u0111\u00E3 \u0111\u1ED5 th\u00EC kh\u00F4ng r\u1EEDa \u0111\u01B0\u1EE3c.", dai: 2_000 }))] }), _jsx(Muc, { id: "h-riengtu", ten: "D\u1EEF li\u1EC7u \u0111i \u0111\u00E2u", children: _jsx("div", { style: {
                                display: 'grid',
                                gap: 12,
                                gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                                marginTop: 10,
                            }, children: [
                                [
                                    'Chỉ mình bạn thấy',
                                    diff.riengTu,
                                    'Không rời khỏi máy này. Không vào prompt, không vào file xuất mặc định.',
                                ],
                                ['Gửi cho Narrator', diff.guiNarrator, 'Đi vào prompt để model kể đúng giọng bạn muốn.'],
                                ['Thành canon', diff.thanhCanon, 'Trở thành sự thật của thế giới. Thế giới nhớ nó.'],
                            ].map(([tieuDe, ds, giaiThich]) => (_jsxs("div", { style: {
                                    border: '1px solid var(--vien)',
                                    borderRadius: 8,
                                    padding: '10px 12px',
                                    background: 'var(--nen-1)',
                                }, children: [_jsx("div", { style: { ...nhanMuc, fontSize: 11 }, children: tieuDe }), ds.length === 0 ? (_jsx("p", { style: { margin: '6px 0 0', color: 'var(--chu-3)', fontSize: 13 }, children: "\u2014 kh\u00F4ng c\u00F3 g\u00EC \u2014" })) : (_jsx("ul", { style: { margin: '6px 0 0', paddingLeft: 16, color: 'var(--chu-2)', fontSize: 13 }, children: ds.map((x, i) => (_jsx("li", { children: x }, i))) })), _jsx("p", { style: { margin: '8px 0 0', color: 'var(--chu-3)', fontSize: 12 }, children: giaiThich })] }, tieuDe))) }) })] })), _jsxs("div", { style: { display: 'flex', gap: 10, marginTop: 32, flexWrap: 'wrap' }, children: [_jsx("button", { style: nut(true), onClick: chay, children: cheDo === 'bo_qua' ? 'Vào thẳng' : 'Bắt đầu' }), cheDo !== 'bo_qua' && (_jsx("button", { style: nut(false), onClick: () => setCheDo('bo_qua'), children: "B\u1ECF qua t\u1EA5t c\u1EA3" }))] }), _jsx("p", { style: { color: 'var(--chu-3)', fontSize: 13, marginTop: 14 }, children: "M\u1ECDi th\u1EE9 \u1EDF \u0111\u00E2y s\u1EEDa l\u1EA1i \u0111\u01B0\u1EE3c sau khi b\u1EAFt \u0111\u1EA7u, v\u00E0 s\u1EEDa n\u00F3 kh\u00F4ng l\u00E0m th\u1EBF gi\u1EDBi \u0111\u1ED5i." })] }));
}
