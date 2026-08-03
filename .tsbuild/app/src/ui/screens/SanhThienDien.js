import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Sảnh Thiên Diễn — Phần 37.3, bố cục ba cột của `KhungSanh`.
 *
 * Phase 6 nâng màn này từ "UI thô để chứng minh engine chạy" lên **mặt chơi của
 * tầng Thần**: Bảng Lãnh Địa (56.4), thẻ lời cầu (22.4), tình huống Dị Hóa (69.1)
 * và mười kênh can thiệp (69.2) đều thao tác được từ đây.
 *
 * [BB] 36.1 — không emoji, không thư viện icon. Mọi ký hiệu là SVG vẽ tay.
 * [BB] Luật bất biến #9 — không thao tác nào chỉ dựa vào màu: mỗi dấu hiệu màu
 * đều đi kèm chữ.
 * [BB] Luật bất biến #5 — màn này không ghi World; nó chỉ gọi action của store.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../store/game.js';
import { StartingPresenceDraftSchema } from '../../core/schema/player.js';
import { KhungSanh, ChipHanhDong } from './KhungSanh.js';
import { useAi } from '../../store/ai.js';
import { NHAN_TRANG_THAI_CONG } from '../../core/ai/cong.js';
import { Icon } from '../design/Icon.js';
import { BangLanhDia } from '../panels/BangLanhDia.js';
import { SoTayPanel } from '../panels/SoTay.js';
import { KhungCauNguyen } from '../panels/TheCauNguyen.js';
import { PanelOngKinh } from '../panels/OngKinh.js';
import { KENH_DUNG_SAN } from '../../core/than/kenh.js';
import { useUi } from '../../store/ui.js';
import { tinhBangThienDien, thanhThienTuong } from '../../core/bang/thienDien.js';
import { tinhBangThongTin } from '../../core/bang/thongTin.js';
import { ThanhThienTuong } from '../panels/ThanhThienTuong.js';
import { BangThienDien } from './BangThienDien.js';
import { BangThongTin } from './BangThongTin.js';
import { CACH_DAP_DI_HOA } from '../../core/schema/aspect/thanVi.js';
import LuaChon from '../components/LuaChon.js';
import { NoiDungPreset } from '../components/NoiDungPreset.js';
const TEN_TANG = {
    sang_the: 'Sáng Thế Thần',
    than: 'Thần',
    pham_nhan: 'Phàm Nhân',
};
const NHAN_CACH_DAP = {
    chap_nhan: 'Chấp nhận',
    chong_lai: 'Chống lại',
    mac_ca: 'Mặc cả',
    phan_than: 'Phân thân',
};
const MAU_MUC_RO = {
    ro: 'var(--ngoc)',
    mo: 'var(--lam)',
    tin_don: 'var(--van)',
};
const NHAN_MUC_RO = { ro: 'rõ', mo: 'mờ', tin_don: 'tin đồn' };
const nhanNho = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
function nut(chinh = false) {
    return {
        background: 'transparent',
        color: chinh ? 'var(--dong)' : 'var(--tro)',
        border: `1px solid ${chinh ? 'var(--dong)' : 'var(--kinh-vien)'}`,
        borderRadius: 'var(--r-sm)',
        padding: '7px 13px',
        font: 'inherit',
        fontSize: 13,
        cursor: 'pointer',
    };
}
/** Chấm mức rõ — SVG, không dùng ký tự hình học (36.5). */
function ChamMucRo({ muc }) {
    const mau = MAU_MUC_RO[muc] ?? 'var(--mo)';
    return (_jsx("svg", { width: 9, height: 9, viewBox: "0 0 10 10", "aria-hidden": "true", style: { flex: '0 0 auto' }, children: muc === 'ro' ? (_jsx("circle", { cx: "5", cy: "5", r: "3.2", fill: mau })) : (_jsx("circle", { cx: "5", cy: "5", r: "3.2", fill: "none", stroke: mau, strokeWidth: "1.2" })) }));
}
export function SanhThienDien() {
    const { state, view, scene, goiY, projects, loi, choXacNhan, stateHash, dangKe, patchBiTuChoi } = useGame();
    // Phase 8 — ống kính, hạn ngạch vắng mặt và trace truy hồi.
    const viChieu = useGame((s) => s.viChieu);
    const vangMat = useGame((s) => s.vangMat);
    const truyHoiCuoi = useGame((s) => s.truyHoiCuoi);
    const vetCatToken = useGame((s) => s.vetCatToken);
    const ongKinh = useGame((s) => s.ongKinh);
    const chiaOngKinh = useGame((s) => s.chiaOngKinh);
    const danhGiaTruyHoi = useGame((s) => s.danhGiaTruyHoi);
    const dangDanhGia = useGame((s) => s.dangDanhGia);
    const chayDanhGiaTruyHoi = useGame((s) => s.chayDanhGiaTruyHoi);
    const gui = useGame((s) => s.gui);
    const tick = useGame((s) => s.tick);
    const chuyenTang = useGame((s) => s.chuyenTang);
    const chonHienDien = useGame((s) => s.chonHienDien);
    const xacNhan = useGame((s) => s.xacNhan);
    const traLoi = useGame((s) => s.traLoi);
    const dapApLuc = useGame((s) => s.dapApLuc);
    const loiCauDangCho = useGame((s) => s.loiCauDangCho);
    const ungVienChuThe = useGame((s) => s.ungVienChuThe);
    const soTay = useGame((s) => s.soTay);
    const duongTiepTuc = useGame((s) => s.duongTiepTuc);
    const diTiep = useGame((s) => s.diTiep);
    // Phase 12 — ván chơi và lượt chưa được kể.
    const roiVan = useGame((s) => s.roiVan);
    const luotChuaKe = useGame((s) => s.luotChuaKe);
    const keLai = useGame((s) => s.keLai);
    const luaChon = useGame((s) => s.luaChon);
    const machDangChieu = useMemo(() => {
        if (ongKinh.dangChieu.loai !== 'mach')
            return null;
        const id = ongKinh.dangChieu.machId;
        return view?.machTruyen.find((m) => m.id === id) ?? null;
    }, [ongKinh.dangChieu, view]);
    /**
     * Chĩa được vào ai và vào đâu — hai loại mục tiêu còn lại của 29.1.
     * Chỉ lấy thứ chủ thể thấy RÕ: chĩa ống kính vào một tin đồn thì không có gì
     * để chiếu, và danh sách sẽ tự tố cáo những cái tên chưa nên biết.
     */
    const nhanVatChieuDuoc = useMemo(() => [...(view?.entities.values() ?? [])]
        // "Nhân vật" nghĩa là người và thần. Một khái niệm hay một điều luật không
        // đứng ở đâu để mà chiếu vào, nên chĩa ống kính theo nó là vô nghĩa.
        .filter((e) => e.mucRo === 'ro' && (e.kind === 'mortal' || e.kind === 'deity') && e.id !== view?.chuTheId)
        .slice(0, 4)
        .map((e) => ({ id: e.id, ten: e.ten })), [view]);
    const vungChieuDuoc = useMemo(() => [...(view?.entities.values() ?? [])]
        .filter((e) => e.kind === 'place' && e.mucRo === 'ro')
        .slice(0, 3)
        .map((e) => ({ id: e.id, ten: e.ten })), [view]);
    const cong = useAi((s) => s.cong());
    const tyLeHongAi = useAi((s) => s.tyLeHong());
    // ── Phase 11: hai bảng và router ──
    const lopPhu = useUi((s) => s.lopPhu);
    const tab = useUi((s) => s.tab);
    const timBang = useUi((s) => s.tim);
    const theoDoiMachIds = useUi((s) => s.theoDoiMachIds);
    const anhBang = useUi((s) => s.anhBang);
    const batBangThienDien = useUi((s) => s.batBangThienDien);
    const batThongTin = useUi((s) => s.batThongTin);
    const dongLopPhu = useUi((s) => s.dongLopPhu);
    const doiTabBang = useUi((s) => s.doiTab);
    const datTimBang = useUi((s) => s.datTim);
    const ghimMach = useUi((s) => s.ghimMach);
    const loiGhim = useUi((s) => s.loiGhim);
    const ghimThienTuong = useUi((s) => s.ghimThienTuong);
    const boGhimThienTuong = useUi((s) => s.boGhimThienTuong);
    const chupTheoTick = useUi((s) => s.chupTheoTick);
    const doiMan = useUi((s) => s.doiMan);
    const [cau, setCau] = useState('');
    const [debug, setDebug] = useState(false);
    const [khoi, setKhoi] = useState('canh');
    const [diff, setDiff] = useState(null);
    /** Tầng đang chờ người chơi chọn chủ thể; `null` nghĩa là không có hộp chọn. */
    const [chonTang, setChonTang] = useState(null);
    const cuoiScene = useRef(null);
    // [BB] ADR-0028 — không có AI thì không gõ được. Khóa ô nhập là cách trung
    // thực nhất để nói điều đó; để người chơi gõ rồi nuốt câu của họ thì không.
    // [BB] ADR-0056 — một nhịp chưa được kể cũng khóa, vì đi tiếp sẽ chôn nó.
    const khoaNhap = dangKe || !cong.choPhepChoi || luotChuaKe !== null;
    useEffect(() => {
        cuoiScene.current?.scrollIntoView({ block: 'end' });
    }, [scene.length]);
    /**
     * [BB] 55.8 — ảnh chụp vật chất hoá ở RANH GIỚI TICK.
     *
     * Phụ thuộc là `view`, và `view` chỉ đổi khi thế giới đổi. Chụp theo từng thay
     * đổi nhỏ sẽ đếm lại năm mươi nghìn entity mỗi lần người chơi gõ một chữ.
     */
    useEffect(() => {
        if (view !== null)
            chupTheoTick(view);
    }, [view, chupTheoTick]);
    /**
     * Phím `Tab` và `I` — 58.1.
     *
     * [BB] "Không được mở hai lớp phủ chồng nhau." Store giữ MỘT giá trị `lopPhu`
     * nên điều đó không thể sai; ở đây chỉ cần đừng cướp phím khi người chơi đang
     * gõ, vì `Tab` trong một ô nhập là phím chuyển ô, không phải phím mở bảng.
     */
    useEffect(() => {
        const nghe = (e) => {
            const dich = e.target;
            const dangGo = dich !== null && (dich.tagName === 'INPUT' || dich.tagName === 'TEXTAREA' || dich.isContentEditable);
            if (e.key === 'Escape') {
                dongLopPhu(view);
                return;
            }
            if (dangGo)
                return;
            if (e.key === 'Tab') {
                e.preventDefault();
                batBangThienDien(view);
                return;
            }
            if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                batThongTin(view);
            }
        };
        window.addEventListener('keydown', nghe);
        return () => window.removeEventListener('keydown', nghe);
    }, [view, batBangThienDien, batThongTin, dongLopPhu]);
    const bang = useMemo(() => (view === null ? null : tinhBangThienDien(view, anhBang)), [view, anhBang]);
    const bangThongTin = useMemo(() => view === null
        ? null
        : tinhBangThongTin(view, {
            theoDoiMachIds,
            machDangChieuId: ongKinh.dangChieu.loai === 'mach' ? ongKinh.dangChieu.machId : null,
            tenNhanh: view.branchId,
        }), [view, theoDoiMachIds, ongKinh.dangChieu]);
    const mode = state?.world.playerState.mode ?? 'sang_the';
    const chuTheId = state?.world.playerState.chuTheId ?? null;
    /** Dữ liệu Bảng Lãnh Địa — chỉ có nghĩa khi đang nhập một vị thần. */
    const lanhDia = useMemo(() => {
        if (!state || mode !== 'than' || !chuTheId)
            return null;
        const e = state.entities.get(chuTheId);
        if (!e)
            return null;
        const bn = e.aspects['ban_nga'];
        const ven = e.aspects['venerable'];
        const dom = e.aspects['domain'];
        if (!bn)
            return null;
        // [BB] 56.4 — thứ ngoài lãnh địa tới bằng TIN ĐỒN, không bằng số.
        const ngoai = [...state.entities.values()]
            .filter((x) => x.kind === 'deity' && x.id !== chuTheId && x.tickDiet === null)
            .slice(0, 3)
            .map((x) => ({
            noiDung: `Nghe nói ${x.ten} đang được nhắc tới nhiều hơn trước.`,
            soNguon: 1,
            daXacNhan: false,
        }));
        return {
            tenThan: e.ten,
            domains: dom?.domains ?? [],
            soTinDo: Math.round(ven?.soTinDoUocLuong ?? 0),
            soDen: Object.values(ven?.matDoDen ?? {}).filter((m) => m > 0).length,
            hienThanh: ven?.hienThanh ?? 0,
            doLech: bn.pressure.distortion,
            coreSelf: bn.coreSelf,
            followerImage: bn.followerImage,
            ngoaiLanhDia: ngoai,
        };
    }, [state, mode, chuTheId]);
    const tinhHuong = useMemo(() => {
        if (!state || !chuTheId)
            return null;
        const bn = state.entities.get(chuTheId)?.aspects['ban_nga'];
        return bn?.pressure.tinhHuongMo.find((t) => t.daChon === null) ?? null;
    }, [state, chuTheId]);
    const dsCau = useMemo(() => (mode === 'than' ? loiCauDangCho() : []), [mode, loiCauDangCho, state]);
    /**
     * [BB] 56.1 — ở tầng phàm nhân, Bảng Thiên Diễn bị THAY HẲN bằng Sổ Tay.
     * Không phải bản rút gọn: một màn hình khác về bản chất.
     */
    const so = useMemo(() => (mode === 'pham_nhan' ? soTay() : null), [mode, soTay, state]);
    const dsDiTiep = useMemo(() => duongTiepTuc(), [duongTiepTuc, state]);
    if (!state || !view)
        return null;
    const guiCau = () => {
        if (cau.trim() === '' || khoaNhap)
            return;
        void gui(cau);
        setCau('');
    };
    /**
     * Đổi tầng — Phần 21.3.
     *
     * Bản Phase 6 chọn "entity `deity` đầu tiên trong `view`", và `view` đổi theo
     * tầng đang đứng, nên bấm "Thần" có lần vào tầng Thần, có lần rơi xuống Phàm
     * Nhân. Giờ danh sách do `ungVienChuThe()` dựng trên thế giới THẬT, và khi có
     * nhiều hơn một người thì hỏi thay vì đoán.
     */
    const doiHienDien = (m) => {
        if (m === 'sang_the') {
            void chuyenTang('sang_the', null);
            setChonTang(null);
            return;
        }
        const ds = ungVienChuThe(m);
        if (ds.length === 0) {
            void chuyenTang(m, null); // store báo lỗi tử tế thay vì im lặng không làm gì
            return;
        }
        if (ds.length === 1) {
            void chuyenTang(m, ds[0]?.id ?? null);
            setChonTang(null);
            return;
        }
        setChonTang(m);
    };
    const rail = [
        { id: 'canh', icon: 'gui', nhan: 'Cảnh đang diễn', bat: khoi === 'canh', onChon: () => setKhoi('canh') },
        {
            id: 'lanh_dia',
            icon: 'den',
            nhan: 'Lãnh địa',
            bat: khoi === 'lanh_dia',
            onChon: () => setKhoi('lanh_dia'),
        },
        { id: 'kenh', icon: 'than', nhan: 'Kênh can thiệp', bat: khoi === 'kenh', onChon: () => setKhoi('kenh') },
        // ── Phase 11: cửa vào các màn toàn trang. Món nợ từ Phase 8 đã trả. ──
        {
            id: 'thong_tin',
            icon: 'thu_tich',
            nhan: 'Bảng Thông Tin Thiên Địa (phím I)',
            bat: lopPhu === 'thong_tin',
            onChon: () => batThongTin(view),
        },
        // Một cửa cho bốn thứ (Phase 12): proxy AI, preset, lorebook, workflow.
        // Trước đó Xưởng Preset và Cài Đặt AI là hai nút rời, còn Lorebook và
        // Workflow không có nút nào — bấm vào chỉ hiện lại Sảnh.
        {
            id: 'cai_dat',
            icon: 'coi',
            nhan: 'Cài Đặt (preset · lorebook · workflow · proxy)',
            onChon: () => doiMan('cai_dat'),
        },
        // Ba màn cuối cùng của sổ nợ Phase 11 — nay có đường bấm thật.
        {
            id: 'vat_ly',
            icon: 'dinh_luat',
            nhan: 'Vật Lý Thế Giới — bảy trục Luật Nền',
            onChon: () => doiMan('vat_ly'),
        },
        { id: 'ban_do_nhanh', icon: 'ban_do', nhan: 'Bản Đồ Nhánh', onChon: () => doiMan('ban_do_nhanh') },
        { id: 'registry', icon: 'thu_tich', nhan: 'Xưởng Registry', onChon: () => doiMan('xuong_registry') },
        { id: 'chan_doan', icon: 'so_sach', nhan: 'Tự Chẩn Đoán', onChon: () => doiMan('chan_doan') },
        {
            id: 'debug',
            icon: 'khai_niem',
            nhan: 'Bảng gỡ lỗi tại chỗ',
            bat: debug,
            onChon: () => setDebug((d) => !d),
        },
    ];
    const tenCua = (id) => view.entities.get(id)?.ten ?? state.entities.get(id)?.ten ?? id;
    // ── cột giữa ──
    const giua = (_jsxs(_Fragment, { children: [_jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '18px 22px', minHeight: 0 }, children: [loi.length > 0 && (_jsxs("div", { role: "alert", className: "kinh", style: { padding: 12, marginBottom: 14, display: 'flex', gap: 9, alignItems: 'flex-start' }, children: [_jsx(Icon, { ten: "canh_bao", co: 16, style: { color: 'var(--hoi)', marginTop: 2 } }), _jsx("div", { style: { color: 'var(--hoi)', fontSize: 13 }, children: loi.map((e, i) => (_jsx("div", { children: e.message }, i))) })] })), dsDiTiep.length > 0 && (_jsxs("div", { role: "alertdialog", "aria-label": "\u0110\u1EDDi n\u00E0y \u0111\u00E3 h\u1EBFt", className: "kinh", style: { padding: 16, marginBottom: 14, borderLeft: '2px solid var(--dong)' }, children: [_jsx("strong", { style: { fontSize: 15 }, children: "\u0110\u1EDDi n\u00E0y \u0111\u00E3 h\u1EBFt. Th\u1EBF gi\u1EDBi th\u00EC ch\u01B0a." }), _jsx("div", { style: { display: 'grid', gap: 7, margin: '12px 0 0' }, children: dsDiTiep.map((d) => (_jsxs("button", { style: { ...nut(d.duong === 'anh_linh'), textAlign: 'left', display: 'grid', gap: 2 }, onClick: () => void diTiep(d), children: [_jsx("span", { className: "ten-rieng", children: d.duong === 'ke_thua'
                                                ? `Kế thừa — ${d.ten}`
                                                : d.duong === 'chung_kien'
                                                    ? `Chứng kiến — ${d.ten}`
                                                    : `Anh Linh Hóa Thần — ${d.ten}` }), _jsx("span", { style: nhanNho, children: d.vi })] }, `${d.duong}:${d.chuTheMoiId}`))) })] })), chonTang && (_jsxs("div", { className: "kinh", style: { padding: 14, marginBottom: 14 }, children: [_jsxs("strong", { style: { fontSize: 14 }, children: ["Ng\u01B0\u01A1i b\u01B0\u1EDBc v\u00E0o t\u1EA7ng ", TEN_TANG[chonTang], " b\u1EB1ng th\u00E2n ph\u1EADn n\u00E0o?"] }), _jsx("div", { style: { display: 'grid', gap: 7, margin: '10px 0 0' }, children: ungVienChuThe(chonTang).map((u) => (_jsxs("button", { style: { ...nut(u.daTungNhap), textAlign: 'left', display: 'grid', gap: 2 }, onClick: () => {
                                        void chuyenTang(chonTang, u.id);
                                        setChonTang(null);
                                    }, children: [_jsx("span", { className: "ten-rieng", children: u.ten }), _jsx("span", { style: nhanNho, children: u.vi })] }, u.id))) }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }, children: [_jsx("button", { style: nut(), onClick: () => {
                                            const m = chonTang;
                                            setChonTang(null);
                                            void chonHienDien(StartingPresenceDraftSchema.parse({ mode: m, name: '', useExistingEntityId: null })).then(setDiff);
                                        }, children: "D\u1EF1ng m\u1ED9t th\u00E2n ph\u1EADn m\u1EDBi" }), _jsx("button", { style: nut(), onClick: () => setChonTang(null), children: "Th\u00F4i, \u1EDF l\u1EA1i \u0111\u00E2y" })] })] })), diff && (_jsxs("div", { className: "kinh", style: { padding: 14, marginBottom: 14 }, children: [_jsx("strong", { style: { fontSize: 14 }, children: "Th\u1EBF gi\u1EDBi v\u1EEBa ghi nh\u1EADn:" }), _jsx("ul", { style: { margin: '8px 0 0', paddingLeft: 18, color: 'var(--tro)', fontSize: 13 }, children: [...diff.engineQuyet, ...diff.khongCapThang].map((x) => (_jsx("li", { children: x }, x))) }), _jsx("button", { style: { ...nut(), marginTop: 10 }, onClick: () => setDiff(null), children: "\u0110\u00E3 r\u00F5" })] })), tinhHuong && (_jsxs("div", { className: "kinh", style: { padding: 14, marginBottom: 14, borderLeft: '2px solid var(--hoi)' }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }, children: [_jsx(Icon, { ten: "di_hoa", co: 15, style: { color: 'var(--hoi)' } }), _jsx("span", { style: nhanNho, children: "\u00C1P L\u1EF0C D\u1ECA H\u00D3A" })] }), _jsx("p", { style: { margin: '0 0 12px', fontFamily: 'var(--chu-hien)', fontSize: 18, lineHeight: 1.45 }, children: tinhHuong.moTa }), _jsx("div", { style: { display: 'flex', gap: 7, flexWrap: 'wrap' }, children: CACH_DAP_DI_HOA.map((c) => (_jsx("button", { style: nut(), onClick: () => void dapApLuc(tinhHuong.id, c), children: NHAN_CACH_DAP[c] }, c))) })] })), khoi === 'canh' &&
                        scene.map((d) => (_jsx("div", { style: {
                                margin: '0 0 12px',
                                fontSize: d.loai === 'nguoi_choi' ? 15 : 14,
                                lineHeight: 1.65,
                                color: d.loai === 'nguoi_choi'
                                    ? 'var(--sang)'
                                    : d.loai === 'he_thong'
                                        ? 'var(--mo)'
                                        : 'var(--tro)',
                                fontStyle: d.loai === 'he_thong' ? 'italic' : 'normal',
                                borderLeft: d.loai === 'nguoi_choi' ? '2px solid var(--kinh-vien)' : 'none',
                                paddingLeft: d.loai === 'nguoi_choi' ? 12 : 0,
                            }, children: d.dinhDang === 'html' ? _jsx(NoiDungPreset, { html: d.noiDung }) : d.noiDung }, d.id))), khoi === 'lanh_dia' &&
                        (lanhDia ? (_jsx("div", { style: { maxWidth: 460 }, children: _jsx(BangLanhDia, { du: lanhDia }) })) : (_jsx("p", { style: { color: 'var(--mo)', fontSize: 14 }, children: "L\u00E3nh \u0111\u1ECBa ch\u1EC9 c\u00F3 ngh\u0129a khi ng\u01B0\u01A1i \u0111ang l\u00E0 m\u1ED9t v\u1ECB th\u1EA7n. H\u00E3y chuy\u1EC3n sang t\u1EA7ng Th\u1EA7n." }))), khoi === 'kenh' && (_jsx("div", { style: { display: 'grid', gap: 10, maxWidth: 560 }, children: KENH_DUNG_SAN.map((k) => (_jsxs("button", { className: "kinh--cap2", onClick: () => setCau(`${k.ten}: `), style: {
                                textAlign: 'left',
                                padding: 12,
                                border: '1px solid var(--kinh-vien)',
                                background: 'transparent',
                                color: 'inherit',
                                font: 'inherit',
                                cursor: 'pointer',
                                display: 'grid',
                                gap: 4,
                            }, children: [_jsx("span", { className: "ten-rieng", style: { fontSize: 14, color: 'var(--dong)' }, children: k.ten }), _jsx("span", { style: { fontSize: 13, color: 'var(--tro)' }, children: k.moTa }), _jsx("span", { style: { ...nhanNho, color: 'var(--mo)' }, children: [
                                        k.gia.deHieuSai >= 0.5 ? 'dễ bị hiểu sai' : null,
                                        k.gia.loDienThan >= 50 ? 'lộ mình rất rõ' : null,
                                        k.gia.tuRangBuoc ? 'trói cả ngươi' : null,
                                        k.gia.trungGianCoYChi ? 'trung gian có ý riêng' : null,
                                        k.gia.tangPhuThuoc >= 15 ? 'tạo lệ thuộc' : null,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ') || 'giá thấp' })] }, k.id))) })), _jsx("div", { ref: cuoiScene })] }), _jsxs("div", { style: { padding: '12px 22px 18px', borderTop: '1px solid var(--kinh-vien)' }, children: [luotChuaKe !== null && (_jsxs("div", { role: "alert", className: "kinh--cap2", style: {
                            border: '1px solid var(--kinh-vien)',
                            borderRadius: 'var(--r-sm)',
                            padding: '10px 14px',
                            marginBottom: 10,
                        }, children: [_jsxs("p", { style: { margin: '0 0 8px', fontSize: 13, color: 'var(--tro)' }, children: [_jsx("strong", { style: { color: 'var(--hoi)' }, children: "L\u01B0\u1EE3t n\u00E0y ch\u01B0a ai k\u1EC3." }), " Th\u1EBF gi\u1EDBi \u0111\u00E3 \u0111i ti\u1EBFp, nh\u01B0ng b\u1EA1n ch\u01B0a \u0111\u01B0\u1EE3c \u0111\u1ECDc n\u00F3. N\u1ED1i l\u1EA1i \u0111\u01B0\u1EDDng t\u1EDBi model r\u1ED3i k\u1EC3 l\u1EA1i \u2014 tr\u00F2 ch\u01A1i d\u1EEBng \u1EDF \u0111\u00E2y t\u1EDBi l\u00FAc \u0111\u00F3."] }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx("button", { style: nut(true), disabled: dangKe, onClick: () => void keLai(), children: dangKe ? 'Đang kể lại…' : 'Kể lại lượt này' }), _jsx("button", { style: nut(), onClick: () => doiMan('cai_dat'), children: "M\u1EDF C\u00E0i \u0110\u1EB7t \u00B7 Proxy AI" })] })] })), choXacNhan ? (_jsxs("div", { role: "alertdialog", "aria-label": "X\u00E1c nh\u1EADn h\u00E0nh \u0111\u1ED9ng kh\u00F4ng th\u1EC3 ho\u00E0n t\u00E1c", children: [_jsxs("p", { style: { margin: '0 0 10px', fontSize: 14 }, children: [_jsx("strong", { children: "Kh\u00F4ng th\u1EC3 ho\u00E0n t\u00E1c." }), " \u201C", choXacNhan.cau, "\u201D"] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { style: nut(true), onClick: () => void xacNhan(true), children: "Ta ch\u1EA5p nh\u1EADn h\u1EADu qu\u1EA3" }), _jsx("button", { style: nut(), onClick: () => void xacNhan(false), children: "D\u1EEBng l\u1EA1i" })] })] })) : (_jsxs(_Fragment, { children: [goiY.length > 0 && (_jsx("div", { style: { display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }, children: goiY.slice(0, 4).map((a) => (_jsx(ChipHanhDong, { nhan: a.nhan, icon: "quy_ket", onChon: () => setCau(a.nhan) }, a.id))) })), luaChon.length > 0 && (_jsx("div", { style: { marginBottom: 10 }, children: _jsx(LuaChon, { luaChon: luaChon, dangKe: dangKe, onChon: (text) => {
                                        setCau(text);
                                        void gui(text);
                                    } }) })), _jsxs("div", { style: { display: 'flex', gap: 7, marginBottom: 10 }, children: [_jsxs("button", { style: { ...nut(), display: 'flex', alignItems: 'center', gap: 6 }, onClick: () => void tick(1), children: [_jsx(Icon, { ten: "nhip", co: 14 }), " Tr\u00F4i 1 nh\u1ECBp"] }), _jsxs("button", { style: { ...nut(), display: 'flex', alignItems: 'center', gap: 6 }, onClick: () => void tick(30), children: [_jsx(Icon, { ten: "ban_do", co: 14 }), " Tr\u00F4i 30 nh\u1ECBp"] })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("label", { htmlFor: "oNhap", style: { position: 'absolute', left: -9999 }, children: "H\u00E0nh \u0111\u1ED9ng c\u1EE7a ng\u01B0\u01A1i" }), _jsx("input", { id: "oNhap", value: cau, disabled: khoaNhap, onChange: (e) => setCau(e.target.value), onKeyDown: (e) => {
                                            if (e.key === 'Enter')
                                                guiCau();
                                        }, placeholder: dangKe
                                            ? 'Đang có người kể…'
                                            : cong.choPhepChoi
                                                ? 'Hành động của ngươi...'
                                                : 'Chưa nối được AI — không ai kể được lượt này.', className: "kinh--cap2", style: {
                                            flex: 1,
                                            color: khoaNhap ? 'var(--mo)' : 'var(--sang)',
                                            border: '1px solid var(--kinh-vien)',
                                            padding: '11px 14px',
                                            font: 'inherit',
                                            fontSize: 14,
                                            background: 'var(--kinh-nen-2)',
                                            cursor: khoaNhap ? 'not-allowed' : 'text',
                                        } }), _jsxs("button", { style: {
                                            ...nut(true),
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 7,
                                            opacity: khoaNhap ? 0.45 : 1,
                                            cursor: khoaNhap ? 'not-allowed' : 'pointer',
                                        }, disabled: khoaNhap, onClick: guiCau, children: [_jsx(Icon, { ten: "gui", co: 15 }), dangKe ? 'Đang kể' : 'Gửi'] })] })] }))] })] }));
    // ── cột phải ──
    const phai = (_jsxs(_Fragment, { children: [so ? _jsx(SoTayPanel, { so: so }) : lanhDia && khoi !== 'lanh_dia' && _jsx(BangLanhDia, { du: lanhDia }), _jsx(PanelOngKinh, { viChieu: viChieu, machDangChieu: machDangChieu, vangMat: vangMat, truyHoi: truyHoiCuoi, vetCatToken: vetCatToken, machKhac: view.machTruyen, onChia: (machId) => chiaOngKinh({ loai: 'mach', machId }), onTuDong: () => chiaOngKinh({ loai: 'tu_dong' }), nhanVatGan: nhanVatChieuDuoc, vungGan: vungChieuDuoc, onChiaNhanVat: (entityId) => chiaOngKinh({ loai: 'nhan_vat', entityId }), onChiaVung: (vungId) => chiaOngKinh({ loai: 'vung', vungId }), danhGia: danhGiaTruyHoi, dangDanhGia: dangDanhGia, onDanhGia: () => void chayDanhGiaTruyHoi() }), mode === 'than' && (_jsx(KhungCauNguyen, { ds: dsCau, tenCua: tenCua, tick: state.world.tick, onTraLoi: (c, cach) => void traLoi(c, cach) })), mode !== 'pham_nhan' && (_jsxs("section", { className: "kinh hien-panel", style: { padding: 16, display: 'grid', gap: 10 }, children: [_jsxs("header", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Icon, { ten: "khai_niem", co: 16, style: { color: 'var(--van)' } }), _jsx("h2", { style: { ...nhanNho, margin: 0, textTransform: 'uppercase' }, children: "Ng\u01B0\u01A1i th\u1EA5y" })] }), _jsx("div", { style: { display: 'grid', gap: 6 }, children: [...view.entities.values()].slice(0, 12).map((e) => (_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }, children: [_jsx(ChamMucRo, { muc: e.mucRo }), _jsx("span", { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }, children: e.ten }), _jsxs("span", { style: { ...nhanNho, whiteSpace: 'nowrap' }, children: [NHAN_MUC_RO[e.mucRo], e.daBopMeo ? ' · nghe kể' : ''] })] }, e.id))) }), _jsxs("p", { style: { ...nhanNho, margin: 0 }, children: [view.suongMu.ro.length, " r\u00F5 \u00B7 ", view.suongMu.mo.length, " m\u1EDD \u00B7 ", view.suongMu.tinDon.length, " tin \u0111\u1ED3n \u00B7", ' ', view.suongMu.mu.length, " ch\u01B0a bi\u1EBFt t\u1EDBi"] })] })), projects.length > 0 && (_jsxs("section", { className: "kinh hien-panel", style: { padding: 16, display: 'grid', gap: 8 }, children: [_jsxs("header", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Icon, { ten: "thu_tich", co: 16, style: { color: 'var(--ngoc)' } }), _jsx("h2", { style: { ...nhanNho, margin: 0, textTransform: 'uppercase' }, children: "Vi\u1EC7c \u0111ang l\u00E0m" })] }), projects.map((p) => (_jsxs("div", { style: { fontSize: 13 }, children: [p.goal, _jsxs("span", { style: { ...nhanNho, display: 'block' }, children: [p.status === 'blocked' ? 'đang vướng' : 'đang chạy', " \u00B7 ", p.milestones.length, " ch\u1EB7ng"] })] }, p.id)))] })), debug && (_jsxs("section", { className: "kinh hien-panel", style: { padding: 16 }, children: [_jsx("h2", { style: { ...nhanNho, margin: '0 0 8px', textTransform: 'uppercase' }, children: "Ch\u1EA9n \u0111o\u00E1n" }), _jsx("pre", { className: "chu-so", style: { margin: 0, fontSize: 11, color: 'var(--tro)', whiteSpace: 'pre-wrap' }, children: `state hash   ${stateHash}
visibility   ${view.visibilityHash}
mức chiếu    ${view.mucChieu}${view.dangHoaThan ? ' (đang hóa thân)' : ''}
nhánh        ${state.world.branchId}
seed         ${state.world.seed}
entity       ${state.entities.size} · thấy ${view.entities.size}
tri thức     ${state.knowledge.size}
lời cầu      ${state.prayers.size}
chủ thể      ${state.world.playerState.chuTheId ?? '(không)'}
cổng AI      ${cong.trangThai}
tỉ lệ hỏng   ${Math.round(tyLeHongAi * 100)}%` }), patchBiTuChoi.length > 0 && (_jsxs("div", { style: { marginTop: 10 }, children: [_jsxs("div", { style: { ...nhanNho, marginBottom: 6 }, children: [patchBiTuChoi.length, " THAY \u0110\u1ED4I AI \u0110\u1EC0 NGH\u1ECA B\u1ECA T\u1EEA CH\u1ED0I"] }), patchBiTuChoi.map((p, i) => (_jsxs("div", { style: { fontSize: 11, color: 'var(--hoi)', marginBottom: 4 }, children: [p.ma, " \u2014 ", p.thongDiep] }, i)))] }))] }))] }));
    /**
     * Mục "Cần chú ý" mở thẳng tới chỗ xử lý — [BB] 55.4.
     *
     * Đích nào chưa có màn riêng thì đưa về nơi gần nhất xử lý được, chứ không im
     * lặng: một nút bấm không làm gì còn tệ hơn một nút không có.
     */
    const xuLyCanChuY = (dich) => {
        if (dich === 'doi_soat') {
            doiMan('lorebook');
            return;
        }
        if (dich === 'chi_so' || dich === 'lo_hong') {
            doiMan('chan_doan');
            return;
        }
        if (dich === 'luat_nen') {
            doiMan('vat_ly');
            return;
        }
        // Phục bút, lời cầu và mạch truyện đều xử lý ngay trong Sảnh.
        dongLopPhu(view);
        if (dich === 'loi_cau')
            setKhoi('canh');
    };
    return (_jsx(KhungSanh, { tieuDe: "Thi\u00EAn Di\u1EC5n", phuDe: `Đang nhìn bằng mắt của ${TEN_TANG[mode]}`, rail: rail, thanhTren: bang === null ? undefined : (_jsx(ThanhThienTuong, { cum: thanhThienTuong(bang, anhBang?.ghim ?? []), 
            /*
             * Nguồn ghim là vùng "Đang thế nào" của chính Bảng — không phải một
             * danh sách khai tay. Thêm một chỉ số mới vào Bảng là nó tự có mặt ở
             * đây, và không ai phải nhớ cập nhật chỗ thứ hai.
             */
            ghimDuoc: (bang.dangTheNao ?? []).map((c) => ({ khoa: c.khoa, nhan: c.nhan })), dangGhim: anhBang?.ghim ?? [], loiGhim: loiGhim, onMoBang: () => batBangThienDien(view), onGhim: ghimThienTuong, onBoGhim: boGhimThienTuong })), lopPhu: lopPhu === 'bang_thien_dien' && bang !== null ? (_jsx(BangThienDien, { bang: bang, onDong: () => dongLopPhu(view), onXuLy: (m) => xuLyCanChuY(m.dich) })) : lopPhu === 'thong_tin' && bangThongTin !== null ? (_jsx(BangThongTin, { du: bangThongTin, tab: tab, tim: timBang, theoDoiMachIds: theoDoiMachIds, onDoiTab: doiTabBang, onTim: datTimBang, onGhimMach: ghimMach, onDong: () => dongLopPhu(view) })) : undefined, dauTrang: _jsxs(_Fragment, { children: [_jsx("span", { className: "chu-so", style: { ...nhanNho, color: 'var(--tro)' }, children: state.world.tick === 0
                        ? 'Tích Tắc Đầu Tiên'
                        : mode === 'pham_nhan'
                            ? `năm ${state.world.year}`
                            : `nhịp ${state.world.tick} · năm ${state.world.year}` }), _jsxs("span", { title: cong.lyDo.join(' '), style: {
                        ...nhanNho,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: cong.choPhepChoi ? 'var(--ngoc)' : 'var(--hoi)',
                    }, children: [_jsx(ChamMucRo, { muc: cong.choPhepChoi ? 'ro' : 'tin_don' }), "AI: ", dangKe ? 'đang kể' : NHAN_TRANG_THAI_CONG[cong.trangThai]] }), ['sang_the', 'than', 'pham_nhan'].map((m) => (_jsx("button", { style: nut(m === mode), "aria-current": m === mode ? 'true' : undefined, onClick: () => doiHienDien(m), children: TEN_TANG[m] }, m))), _jsx("button", { style: nut(false), title: "L\u01B0u r\u1ED3i v\u1EC1 S\u1EA3nh V\u00E0o", onClick: () => void roiVan(), children: "R\u1EDDi v\u00E1n" })] }), giua: giua, phai: phai }));
}
