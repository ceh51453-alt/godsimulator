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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../store/game.js';
import { useThuVienLorebook } from '../../store/lorebook.js';
import { bangDoiSoat, doiSoatEntry } from '../../core/lore/doiSoat.js';
import { banDoDiBiet } from '../../core/lore/kyVong.js';
import { duocNap } from '../../core/lore/tinCay.js';
import { giaiDoanLore } from '../../core/lore/ejs.js';
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
    const stateHash = useGame((s) => s.stateHash);
    const nhap = useGame((s) => s.nhapLorebookTuChuoi);
    const bat = useGame((s) => s.batLorebook);
    const xoa = useGame((s) => s.xoaLorebook);
    const thuVien = useThuVienLorebook((s) => s.muc);
    const daNapThuVien = useThuVienLorebook((s) => s.daNap);
    const dangXuLyThuVien = useThuVienLorebook((s) => s.dangXuLy);
    const loiThuVien = useThuVienLorebook((s) => s.loi);
    const napThuVien = useThuVienLorebook((s) => s.napTuDia);
    const themThuVien = useThuVienLorebook((s) => s.themTuChuoi);
    const chonChoVanMoi = useThuVienLorebook((s) => s.datChonChoVanMoi);
    const xoaKhoiThuVien = useThuVienLorebook((s) => s.xoaKhoiThuVien);
    const oFile = useRef(null);
    const [tin, setTin] = useState('');
    const [dangThemDungSan, setDangThemDungSan] = useState(false);
    /*
     * `WorldState` chứa Map và Event engine sửa Map tại chỗ. Theo dõi thêm hash
     * nội dung để danh sách không giữ mảng cũ trong một render đã được batch — lỗi
     * ấy khiến sách chỉ hiện sau khi chuyển tab rồi quay lại.
     */
    const sach = useMemo(() => (state === null ? [] : [...state.lorebooks.values()]), [state, stateHash]);
    useEffect(() => {
        if (!daNapThuVien)
            void napThuVien();
    }, [daNapThuVien, napThuVien]);
    const themMucVaoVan = async (noiDung, ten) => {
        if (state === null)
            return false;
        if (sach.some((lb) => lb.ten.trim().toLocaleLowerCase('vi') === ten.trim().toLocaleLowerCase('vi'))) {
            setTin(`“${ten}” đã có trong ván này.`);
            return true;
        }
        const ok = await nhap(noiDung, ten);
        setTin(ok
            ? `Đã thêm “${ten}” vào ván này. Sách đang tắt để bạn tự quyết định lúc bắt đầu ảnh hưởng.`
            : `Không thêm được “${ten}” vào ván.`);
        return ok;
    };
    const themDungSan = async () => {
        setDangThemDungSan(true);
        try {
            const url = `${import.meta.env.BASE_URL}lorebooks/than-thoai-an-do.json`;
            const response = await fetch(url);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const noiDung = await response.text();
            const okThuVien = await themThuVien(noiDung, 'Thần thoại Ấn Độ', {
                dungSan: true,
                chonChoVanMoi: state === null,
            });
            if (!okThuVien)
                return;
            if (state !== null) {
                await themMucVaoVan(noiDung, 'Thần thoại Ấn Độ');
            }
            else {
                setTin('Đã thêm và chọn “Thần thoại Ấn Độ” cho ván mới. Bạn có thể bỏ tick nếu chưa muốn dùng.');
            }
        }
        catch (error) {
            setTin(`Không đọc được Lorebook dựng sẵn: ${error instanceof Error ? error.message : String(error)}.`);
        }
        finally {
            setDangThemDungSan(false);
        }
    };
    const nhapFile = async (file) => {
        const noiDung = await file.text();
        const ten = file.name.replace(/\.json$/i, '');
        const okThuVien = await themThuVien(noiDung, ten, { chonChoVanMoi: state === null });
        if (!okThuVien)
            return;
        if (state !== null) {
            await themMucVaoVan(noiDung, ten);
        }
        else {
            setTin(`Đã nhập và chọn “${ten}” cho ván mới.`);
        }
    };
    const khoiThuVien = (_jsxs(Khoi, { ten: "Lorebook cho v\u00E1n m\u1EDBi", phu: `${thuVien.filter((x) => x.chonChoVanMoi).length}/${thuVien.length} sách sẽ tự nạp và bật khi tạo ván`, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nut(false, dangThemDungSan || dangXuLyThuVien), disabled: dangThemDungSan || dangXuLyThuVien, onClick: () => void themDungSan(), children: dangThemDungSan ? 'Đang thêm…' : 'Thêm Thần thoại Ấn Độ' }), _jsx("button", { type: "button", style: nut(true, dangXuLyThuVien), disabled: dangXuLyThuVien, onClick: () => oFile.current?.click(), children: "Nh\u1EADp lorebook (.json)" }), _jsx("input", { ref: oFile, type: "file", accept: "application/json,.json", style: { display: 'none' }, onChange: (e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f)
                                void nhapFile(f);
                        } }), _jsx("span", { style: { ...nhanNho, textTransform: 'none' }, children: "H\u1ED7 tr\u1EE3 SillyTavern V2, V3 v\u00E0 \u0111\u1ECBnh d\u1EA1ng Thi\u00EAn Di\u1EC5n." })] }), (tin !== '' || loiThuVien !== '') && (_jsx("p", { role: loiThuVien !== '' ? 'alert' : 'status', style: { color: loiThuVien !== '' ? 'var(--hoi)' : 'var(--tro)', fontSize: 13, margin: 0 }, children: loiThuVien || tin })), !daNapThuVien ? (_jsx("p", { style: { color: 'var(--mo)', fontSize: 13, margin: 0 }, children: "\u0110ang \u0111\u1ECDc th\u01B0 vi\u1EC7n Lorebook\u2026" })) : thuVien.length === 0 ? (_jsx("p", { style: { color: 'var(--mo)', fontSize: 13, margin: 0 }, children: "Ch\u01B0a c\u00F3 s\u00E1ch trong th\u01B0 vi\u1EC7n. Nh\u1EADp m\u1ED9t file ho\u1EB7c th\u00EAm s\u00E1ch d\u1EF1ng s\u1EB5n, r\u1ED3i tick s\u00E1ch mu\u1ED1n d\u00F9ng cho v\u00E1n m\u1EDBi." })) : (_jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }, children: thuVien.map((muc) => {
                    const daCoTrongVan = sach.some((lb) => lb.ten.trim().toLocaleLowerCase('vi') === muc.ten.trim().toLocaleLowerCase('vi'));
                    return (_jsxs("li", { style: { ...the, display: 'grid', gap: 8 }, children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("strong", { style: { fontFamily: 'var(--chu-hien)', fontSize: 17 }, children: muc.ten }), _jsxs("span", { style: nhanNho, children: [muc.soEntry, " entry"] }), _jsx("span", { style: { flex: 1 } }), _jsxs("label", { style: { display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }, children: [_jsx("input", { type: "checkbox", checked: muc.chonChoVanMoi, onChange: (e) => void chonChoVanMoi(muc.id, e.currentTarget.checked) }), "d\u00F9ng cho v\u00E1n m\u1EDBi"] })] }), muc.moTa.trim() !== '' && (_jsx("p", { style: { margin: 0, color: 'var(--tro)', fontSize: 13 }, children: muc.moTa })), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [state !== null && (_jsx("button", { type: "button", style: nut(false, daCoTrongVan), disabled: daCoTrongVan, onClick: () => void themMucVaoVan(muc.noiDung, muc.ten), children: daCoTrongVan ? 'Đã có trong ván' : 'Thêm vào ván này' })), _jsx("button", { type: "button", style: { ...nut(false), color: 'var(--hoi)' }, onClick: () => {
                                            if (window.confirm(`Xóa “${muc.ten}” khỏi thư viện? Sách đã nằm trong các ván cũ vẫn được giữ.`)) {
                                                void xoaKhoiThuVien(muc.id);
                                            }
                                        }, children: "X\u00F3a kh\u1ECFi th\u01B0 vi\u1EC7n" })] })] }, muc.id));
                }) }))] }));
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
        const dangBat = new Set([...state.lorebooks.values()].filter((lb) => lb.bat).map((lb) => lb.id));
        return banDoDiBiet([...state.loreExpectations.values()].filter((kv) => dangBat.has(kv.lorebookId)), [...state.diBan.values()], state);
    }, [state]);
    if (state === null) {
        return (_jsxs("main", { style: { maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 28 }, children: [_jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 30, margin: 0 }, children: "Lorebook" }), _jsx("p", { style: { color: 'var(--tro)', margin: 0 }, children: "Chu\u1EA9n b\u1ECB s\u00E1ch tr\u01B0\u1EDBc khi t\u1EA1o th\u1EBF gi\u1EDBi. S\u00E1ch \u0111\u01B0\u1EE3c tick s\u1EBD t\u1EF1 n\u1EA1p v\u00E0 b\u1EADt ngay t\u1EEB l\u1EDDi k\u1EC3 \u0111\u1EA7u ti\u00EAn; b\u1ECF tick kh\u00F4ng x\u00F3a s\u00E1ch v\u00E0 kh\u00F4ng \u1EA3nh h\u01B0\u1EDFng c\u00E1c v\u00E1n \u0111\u00E3 c\u00F3." }), khoiThuVien] }));
    }
    return (_jsxs("main", { style: { maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 28 }, children: [_jsxs("header", { children: [_jsx("p", { style: nhanNho, children: "KH\u1ED0I L \u00B7 PH\u1EA6N 51 \u2013 53" }), _jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }, children: "Lorebook v\u00E0 \u0110\u1ED1i So\u00E1t" }), _jsxs("p", { style: { color: 'var(--tro)', margin: 0, fontSize: 14 }, children: ["S\u00E1ch b\u1EA1n nh\u1EADp l\u00E0 ", _jsx("b", { children: "Ngu\u1ED3n" }), ": \u0111i\u1EC1u th\u1EBF gi\u1EDBi l\u1EBD ra ph\u1EA3i tr\u1EDF th\u00E0nh. S\u00E1ch th\u1EBF gi\u1EDBi t\u1EF1 ghi l\u00E0 ", _jsx("b", { children: "S\u1EED" }), ": \u0111i\u1EC1u n\u00F3 \u0111\u00E3 th\u1EF1c s\u1EF1 tr\u1EDF th\u00E0nh. M\u00E2u thu\u1EABn th\u00EC S\u1EED th\u1EAFng \u2014 kh\u00F4ng ph\u1EA3i v\u00EC S\u1EED \u0111\u00FAng h\u01A1n, m\u00E0 v\u00EC kh\u00F4ng \u0111\u01B0\u1EE3c n\u00F3i d\u1ED1i v\u1EC1 chuy\u1EC7n \u0111\u00E3 r\u1ED3i."] })] }), khoiThuVien, _jsx(Khoi, { ten: "S\u00E1ch trong v\u00E1n n\u00E0y", phu: `${sach.length} sách trên nhánh này · ${sach.filter((s) => s.bat).length} đang bật`, children: sach.length === 0 ? (_jsx("p", { style: { color: 'var(--mo)', fontSize: 13, margin: 0 }, children: "Ch\u01B0a c\u00F3 s\u00E1ch n\u00E0o. Th\u1EBF gi\u1EDBi v\u1EABn ch\u1EA1y \u0111\u01B0\u1EE3c \u2014 lorebook l\u00E0 l\u1EF1c h\u1EA5p d\u1EABn, kh\u00F4ng ph\u1EA3i k\u1ECBch b\u1EA3n." })) : (_jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }, children: sach.map((lb) => {
                        const soNap = lb.entries.filter((e) => duocNap(e)).length;
                        const soChe = lb.entries.filter((e) => e.trangThai === 'bi_che').length;
                        const giaiDoan = giaiDoanLore(lb, state.world.tick);
                        return (_jsxs("li", { style: { ...the, display: 'grid', gap: 8 }, children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("strong", { style: { fontFamily: 'var(--chu-hien)', fontSize: 18 }, children: lb.ten }), _jsx("span", { style: nhanNho, children: NHAN_NGUON[lb.nguon] }), _jsx("span", { style: { flex: 1 } }), _jsxs("label", { style: { display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }, children: [_jsx("input", { type: "checkbox", checked: lb.bat, onChange: (e) => bat(lb.id, e.currentTarget.checked) }), lb.bat ? 'đang bật' : 'đang tắt'] }), _jsx("button", { type: "button", style: { ...nut(false), color: 'var(--hoi)', padding: '5px 10px' }, onClick: () => {
                                                if (window.confirm(`Xóa “${lb.ten}” khỏi ván này? Các nhân vật và địa danh đã xuất hiện sẽ vẫn là lịch sử.`)) {
                                                    void xoa(lb.id);
                                                }
                                            }, children: "X\u00F3a" })] }), lb.moTa.trim() !== '' && (_jsx("p", { style: { margin: 0, color: 'var(--tro)', fontSize: 13 }, children: lb.moTa })), _jsxs("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: lb.entries.length }), " entry"] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: soNap }), " \u0111\u1EE7 tin c\u1EADy \u0111\u1EC3 n\u1EA1p"] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: soChe }), " b\u1ECB che"] }), _jsxs("span", { children: ["l\u1EF1c h\u1EA5p d\u1EABn ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: lb.lucHapDan })] }), lb.bat && (_jsxs("span", { children: ["\u0111ang m\u1EDF l\u1EDBp ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: Math.min(4, giaiDoan) }), "/4"] }))] })] }, lb.id));
                    }) })) }), _jsx(Khoi, { ten: "B\u1EA3ng \u0110\u1ED1i So\u00E1t", phu: "Ch\u1ED7 hai entry n\u00F3i v\u1EC1 c\u00F9ng m\u1ED9t th\u1EE9. Che kh\u00F4ng ph\u1EA3i x\u00F3a \u2014 b\u1EA3n g\u1ED1c c\u00F2n nguy\u00EAn.", children: _jsxs("div", { style: { ...the, display: 'grid', gap: 8 }, children: [_jsxs("div", { style: { display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: ["m\u00E2u thu\u1EABn ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: bang.mauThuan.length })] }), _jsxs("span", { children: ["tr\u00F9ng l\u1EB7p ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: bang.trungLap.length })] }), _jsxs("span", { children: ["b\u1ED5 sung ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: bang.boSung.length })] }), _jsxs("span", { children: ["l\u00E0m r\u00F5 ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: bang.lamRo.length })] })] }), bang.mauThuan.length === 0 && bang.trungLap.length === 0 ? (_jsx("p", { style: { margin: 0, color: 'var(--mo)', fontSize: 13 }, children: "Ch\u01B0a c\u00F3 ch\u1ED7 n\u00E0o hai s\u00E1ch n\u00F3i kh\u00E1c nhau." })) : (_jsx("ul", { style: {
                                margin: 0,
                                paddingLeft: 18,
                                color: 'var(--tro)',
                                fontSize: 13,
                                display: 'grid',
                                gap: 4,
                            }, children: [...bang.mauThuan, ...bang.trungLap].slice(0, 20).map((d) => (_jsxs("li", { children: [_jsx("b", { children: d.quanHe === 'mau_thuan' ? 'Mâu thuẫn' : 'Trùng lặp' }), " \u2014 ", d.lyDo, ' ', _jsxs("span", { style: { color: 'var(--mo)' }, children: ["(x\u1EED l\u00FD: ", d.xuLy === 'che' ? `che "${d.cheId}"` : d.xuLy.replace(/_/g, ' '), ")"] })] }, `${d.moiId}|${d.cuId}`))) }))] }) }), _jsx(Khoi, { ten: "B\u1EA3n \u0110\u1ED3 D\u1ECB Bi\u1EC7t", phu: "\u0110\u00E2y kh\u00F4ng ph\u1EA3i b\u1EA3ng l\u1ED7i. N\u00F3 l\u00E0 h\u1ED3 s\u01A1 v\u1EC1 vi\u1EC7c th\u1EBF gi\u1EDBi c\u1EE7a b\u1EA1n \u0111\u00E3 tr\u1EDF th\u00E0nh c\u00E1i g\u00EC.", children: _jsx("div", { style: { ...the, display: 'grid', gap: 8 }, children: banDo === null || banDo.dong.length === 0 ? (_jsx("p", { style: { margin: 0, color: 'var(--mo)', fontSize: 13 }, children: "Ch\u01B0a c\u00F3 k\u1EF3 v\u1ECDng n\u00E0o \u0111\u1EC3 \u0111o. K\u1EF3 v\u1ECDng sinh ra khi b\u1EA1n nh\u1EADp m\u1ED9t lorebook c\u00F3 m\u00F4 t\u1EA3 \u0111i\u1EC1u g\u00EC \u0111\u00F3 ph\u1EA3i t\u1ED3n t\u1EA1i." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: ["\u0111\u00E3 th\u00E0nh ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: banDo.daThoa })] }), _jsxs("span", { children: ["\u0111ang ch\u1EDD ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: banDo.dangCho })] }), _jsxs("span", { children: ["\u0111\u00E3 l\u1EC7ch ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: banDo.daLech })] }), _jsxs("span", { children: ["kh\u00F4ng c\u00F2n kh\u1EA3 thi ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: banDo.batKha })] })] }), _jsxs("table", { style: { borderCollapse: 'collapse', width: '100%', fontSize: 13 }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', color: 'var(--mo)' }, children: [_jsx("th", { style: { padding: '4px 8px 4px 0', fontWeight: 400 }, children: "K\u1EF3 v\u1ECDng" }), _jsx("th", { style: { padding: '4px 8px 4px 0', fontWeight: 400 }, children: "Th\u1EBF gi\u1EDBi c\u1EE7a b\u1EA1n" }), _jsx("th", { style: { padding: '4px 0', fontWeight: 400 }, children: "Tr\u1EA1ng th\u00E1i" })] }) }), _jsx("tbody", { children: banDo.dong.slice(0, 40).map((d, i) => (_jsxs("tr", { style: { borderTop: '1px solid var(--kinh-vien)' }, children: [_jsx("td", { style: { padding: '6px 8px 6px 0', color: 'var(--tro)' }, children: d.kyVong }), _jsx("td", { style: { padding: '6px 8px 6px 0', color: 'var(--sang)' }, children: d.theGioiCuaBan }), _jsx("td", { style: { padding: '6px 0', color: 'var(--tro)' }, children: NHAN_KY_VONG[d.trangThai] })] }, `${d.kyVong}-${i}`))) })] })] })) }) })] }));
}
