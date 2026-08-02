import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Vỏ ứng dụng.
 *
 * [BB] ADR-0028 — **Cổng AI đứng trước mọi thứ.** Không có model thì không có
 * người kể, và không có người kể thì không có trò chơi. Thứ tự này là hợp đồng
 * của cả dự án chứ không phải một lựa chọn giao diện: đặt Cổng AI sau Khởi Nguyên
 * nghĩa là để người chơi dựng xong một thế giới rồi mới nói với họ rằng chưa chơi
 * được.
 *
 *   Cổng AI  →  Sảnh Vào  →  (Khởi Nguyên | Tiếp tục | Nhập file)  →  Sảnh
 *
 * Đường đứt giữa chừng thì rơi thẳng về Cổng AI, và `WorldState` vẫn còn nguyên
 * trong bộ nhớ — nối lại được là chơi tiếp từ đúng chỗ đang dở.
 *
 * ── Sảnh Vào chen vào giữa ở Phase 12 ──
 *
 * Trước đó, qua được Cổng AI là rơi thẳng vào Khởi Nguyên, và Khởi Nguyên chỉ
 * biết TẠO. Không có "tiếp tục", vì chưa có gì được ghi xuống đĩa để mà tiếp
 * tục. `ManChinh` là chỗ ba lối gặp nhau: ván cũ, ván mới, và file từ máy khác.
 */
import { Suspense, lazy, useEffect, useState } from 'react';
import { useGame } from './store/game.js';
import { useAi } from './store/ai.js';
import { useUi } from './store/ui.js';
import { usePreset } from './store/preset.js';
import { KhoiNguyen } from './ui/screens/KhoiNguyen.js';
import { ManChinh } from './ui/screens/ManChinh.js';
import { SanhThienDien } from './ui/screens/SanhThienDien.js';
import { CongAi } from './ui/screens/CongAi.js';
import { ManPhu } from './ui/screens/ManPhu.js';
import { napDungSan } from './core/registry/index.js';
import { khoiDongDb } from './db/instance.js';
napDungSan();
/*
 * Code-split theo màn — món nợ ghi ở cuối Phase 11 và Phase 12.
 *
 * Bốn màn phụ dưới đây kéo theo phần lớn khối lượng: Xưởng Preset mang cả
 * pipeline nhập tám bước, Lorebook mang bộ đối soát, Xưởng Registry mang 128
 * manifest, Vật Lý mang bảng cơ chế. Không màn nào trong số đó cần thiết để đọc
 * dòng đầu tiên của một ván.
 *
 * `CongAi`, `ManChinh`, `KhoiNguyen` và `SanhThienDien` **cố ý** không lazy: cả
 * bốn nằm trên đường đi bắt buộc của mọi phiên, nên tách chúng ra chỉ thêm một
 * vòng chờ mạng vào đúng lúc người chơi chưa thấy gì.
 */
const CaiDat = lazy(() => import('./ui/screens/CaiDat.js').then((m) => ({ default: m.CaiDat })));
const ChanDoan = lazy(() => import('./ui/screens/ChanDoan.js').then((m) => ({ default: m.ChanDoan })));
const XuongRegistry = lazy(() => import('./ui/screens/XuongRegistry.js').then((m) => ({ default: m.XuongRegistry })));
const BanDoNhanh = lazy(() => import('./ui/screens/BanDoNhanh.js').then((m) => ({ default: m.BanDoNhanh })));
const VatLy = lazy(() => import('./ui/screens/VatLy.js').then((m) => ({ default: m.VatLy })));
/**
 * Chỗ chờ khi một màn phụ đang tải.
 *
 * Có chữ, không có spinner quay tròn: [BB] luật bất biến #9 cấm dấu hiệu chỉ
 * bằng hình, và một khối trống nhấp nháy nửa giây trông giống hệt một cú bấm
 * hỏng.
 */
function DangTaiMan() {
    return (_jsx("p", { style: { padding: '32px 24px', color: 'var(--mo)', fontSize: 13 }, role: "status", children: "\u0110ang m\u1EDF m\u00E0n\u2026" }));
}
export function App() {
    const daVao = useGame((s) => s.state !== null);
    const branchId = useGame((s) => s.state?.world.branchId ?? '');
    const saveId = useGame((s) => s.state?.world.id ?? '');
    const daNap = useAi((s) => s.daNap);
    const choPhepChoi = useAi((s) => s.cong().choPhepChoi);
    const napAi = useAi((s) => s.napTuDia);
    const man = useUi((s) => s.man);
    const doiMan = useUi((s) => s.doiMan);
    const napUi = useUi((s) => s.napTuDia);
    const napPreset = usePreset((s) => s.napTuDia);
    /**
     * Sảnh Vào có hai trạng thái, và nó là state CỤC BỘ có chủ ý.
     *
     * "Đang ở màn tạo thế giới hay đang ở danh sách ván" không phải thứ đáng ghi
     * xuống đĩa theo save (59.2) — nó không thuộc về ván nào cả, vì lúc ấy chưa có
     * ván nào được mở.
     */
    const [dangTao, setDangTao] = useState(false);
    const [loiKhoiDong, setLoiKhoiDong] = useState([]);
    /**
     * Migration dữ liệu chạy TRƯỚC mọi thứ khác — món nợ Phase 12 phát hiện ra.
     *
     * `migration.ts` có đủ ba bước từ Phase 2 và không có ai gọi chúng suốt mười
     * một phase. `khoiDongDb()` tự bảo đảm chỉ chạy một lần cho cả phiên.
     */
    useEffect(() => {
        void khoiDongDb().then((ds) => {
            if (ds.length > 0)
                setLoiKhoiDong(ds.map((e) => `${e.code}: ${e.message}`));
        });
    }, []);
    useEffect(() => {
        if (!daNap)
            void napAi();
    }, [daNap, napAi]);
    /**
     * Nạp trạng thái theo NHÁNH khi vào thế giới, và nạp lại khi đổi nhánh.
     *
     * Activation preset, biến pack và trạng thái giao diện đều theo nhánh (58.2,
     * 66.6). Giữ nguyên chúng khi người chơi nhảy nhánh là để trạng thái của nhánh
     * này chảy sang nhánh khác — đúng loại rò rỉ mà khóa kép ở Dexie dựng ra để chặn.
     */
    useEffect(() => {
        if (branchId === '')
            return;
        void napPreset(branchId);
        void napUi(saveId, branchId);
    }, [branchId, saveId, napPreset, napUi]);
    // Vào được ván rồi thì Sảnh Vào phải quên trạng thái "đang tạo", nếu không
    // thoát ván sẽ rơi thẳng lại vào màn tạo thay vì về danh sách.
    useEffect(() => {
        if (daVao)
            setDangTao(false);
    }, [daVao]);
    /*
     * Migration hỏng là chuyện phải nói TO và nói TRƯỚC.
     *
     * Không chặn đường vào — người dùng vẫn phải mở được Cài Đặt để xuất dữ liệu
     * ra khỏi một máy đang hỏng. Nhưng cũng không được im: một save đọc ra rỗng vì
     * migration trượt trông y hệt một save bị mất.
     */
    const bangLoiKhoiDong = loiKhoiDong.length === 0 ? null : (_jsxs("div", { role: "alert", style: {
            padding: '10px 20px',
            borderBottom: '1px solid var(--kinh-vien)',
            color: 'var(--hoi)',
            fontSize: 13,
        }, children: [_jsx("strong", { children: "N\u00E2ng c\u1EA5p d\u1EEF li\u1EC7u ch\u01B0a xong." }), " \u0110\u1EEBng t\u1EA1o v\u00E1n m\u1EDBi tr\u01B0\u1EDBc khi xu\u1EA5t b\u1EA3n sao:", ' ', loiKhoiDong.join(' · ')] }));
    if (!choPhepChoi) {
        return (_jsxs(_Fragment, { children: [bangLoiKhoiDong, _jsx(CongAi, {})] }));
    }
    /*
     * Cài Đặt mở được TRƯỚC khi vào ván.
     *
     * Nếu không, người chơi muốn nhập một preset hay đổi proxy phải tạo một thế
     * giới trước — và thế giới ấy sẽ nằm lại trong danh sách như một ván rác.
     */
    if (!daVao) {
        if (man !== 'sanh') {
            return (_jsx(ManPhu, { children: _jsx(Suspense, { fallback: _jsx(DangTaiMan, {}), children: _jsx(ManCaiDatTheoId, { man: man, onVeSanh: () => doiMan('sanh') }) }) }));
        }
        return (_jsxs(_Fragment, { children: [bangLoiKhoiDong, dangTao ? (_jsx(KhoiNguyen, { onQuayLai: () => setDangTao(false) })) : (_jsx(ManChinh, { onBatDau: () => setDangTao(true) }))] }));
    }
    /*
     * Router màn toàn trang.
     *
     * `sanh` là nhà, và mọi màn khác đều có đường về — `ManPhu` giữ thanh quay lại,
     * nên không màn nào trở thành ngõ cụt. Trước Phase 11 không có router nào, và
     * đó là lý do "không có cửa vào Cài Đặt AI khi đang chơi" nằm trong sổ nợ suốt
     * từ Phase 8.
     */
    if (man !== 'sanh') {
        return (_jsx(ManPhu, { children: _jsx(Suspense, { fallback: _jsx(DangTaiMan, {}), children: _jsx(ManCaiDatTheoId, { man: man, onVeSanh: () => doiMan('sanh') }) }) }));
    }
    return _jsx(SanhThienDien, {});
}
/**
 * Một id màn → một component.
 *
 * Bốn id của Cài Đặt cùng dựng `CaiDat` với tab mở sẵn khác nhau: mục "Cần chú
 * ý" của Bảng Thiên Diễn trỏ tới từng cái một (58.9), và đưa người chơi tới
 * trang mục lục rồi bắt họ tự tìm tiếp là đúng thứ 58.9 cấm.
 */
function ManCaiDatTheoId({ man, onVeSanh }) {
    switch (man) {
        case 'cai_dat':
            return _jsx(CaiDat, {});
        case 'cai_dat_ai':
            return _jsx(CaiDat, { tabDau: "proxy" });
        case 'xuong_preset':
            return _jsx(CaiDat, { tabDau: "preset" });
        case 'lorebook':
            return _jsx(CaiDat, { tabDau: "lorebook" });
        case 'xuong_workflow':
            return _jsx(CaiDat, { tabDau: "workflow" });
        case 'chan_doan':
            return _jsx(ChanDoan, {});
        case 'xuong_registry':
            return _jsx(XuongRegistry, {});
        case 'ban_do_nhanh':
            return _jsx(BanDoNhanh, {});
        case 'vat_ly':
            return _jsx(VatLy, {});
        default:
            // Mọi id trong `MAN_HINH` nay đều có màn thật. Nhánh này chỉ còn để bắt
            // một id lạ lọt vào từ `uiState` của bản cũ — và nó đưa người dùng về Sảnh
            // thay vì để họ nhìn màn trắng.
            return _jsx(ManLa, { ten: man, onVeSanh: onVeSanh });
    }
}
function ManLa({ ten, onVeSanh }) {
    return (_jsxs("main", { style: { maxWidth: 620, margin: '0 auto', padding: '48px 22px' }, children: [_jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 28, margin: 0 }, children: "Kh\u00F4ng c\u00F3 m\u00E0n n\u00E0o t\u00EAn v\u1EADy" }), _jsxs("p", { style: { color: 'var(--tro)', fontSize: 14 }, children: ["Tr\u1EA1ng th\u00E1i giao di\u1EC7n \u0111ang tr\u1ECF t\u1EDBi ", _jsx("code", { style: { fontFamily: 'var(--chu-so)' }, children: ten }), ", m\u1ED9t m\u00E0n kh\u00F4ng c\u00F2n t\u1ED3n t\u1EA1i. Th\u01B0\u1EDDng l\u00E0 v\u00EC save n\u00E0y \u0111\u01B0\u1EE3c ghi b\u1EDFi m\u1ED9t b\u1EA3n c\u0169 h\u01A1n. Quay v\u1EC1 S\u1EA3nh l\u00E0 an to\u00E0n \u2014 kh\u00F4ng c\u00F3 d\u1EEF li\u1EC7u n\u00E0o c\u1EE7a v\u00E1n b\u1ECB \u1EA3nh h\u01B0\u1EDFng."] }), onVeSanh !== undefined && (_jsx("button", { type: "button", onClick: onVeSanh, style: {
                    background: 'transparent',
                    color: 'var(--tro)',
                    border: '1px solid var(--kinh-vien)',
                    borderRadius: 'var(--r-sm)',
                    padding: '8px 14px',
                    font: 'inherit',
                    fontSize: 13,
                    cursor: 'pointer',
                }, children: "V\u1EC1 S\u1EA3nh" }))] }));
}
