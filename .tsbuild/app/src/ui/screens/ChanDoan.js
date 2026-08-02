import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGame } from '../../store/game.js';
import { useAi } from '../../store/ai.js';
import { usePreset } from '../../store/preset.js';
import { NHAN_TRANG_THAI_CONG } from '../../core/ai/cong.js';
const nhan = {
    color: 'var(--mo)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};
const so = { fontSize: 13, color: 'var(--tro)' };
const phu = { fontSize: 11, color: 'var(--mo)' };
function Bang({ tieuDe, muc }) {
    return (_jsxs("section", { className: "kinh", style: { padding: 18, marginBottom: 16 }, children: [_jsx("h2", { style: { ...nhan, margin: '0 0 12px' }, children: tieuDe }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: muc.map((m) => (_jsxs("div", { style: { display: 'grid', gap: 2 }, children: [_jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }, children: [_jsx("span", { style: { ...so, flex: 1, minWidth: 180 }, children: m.ten }), _jsx("span", { className: "chu-so", style: { ...so, color: m.hong ? 'var(--hoi)' : 'var(--tro)' }, children: m.gia }), _jsx("span", { style: { ...phu, color: m.hong ? 'var(--hoi)' : 'var(--ngoc)' }, children: m.hong ? 'cần sửa' : 'ổn' })] }), m.hong && _jsx("div", { style: { ...phu, color: 'var(--dong)' }, children: m.lam })] }, m.ten))) })] }));
}
export function ChanDoan() {
    const state = useGame((s) => s.state);
    const view = useGame((s) => s.view);
    const stateHash = useGame((s) => s.stateHash);
    const patchBiTuChoi = useGame((s) => s.patchBiTuChoi);
    const truyHoiCuoi = useGame((s) => s.truyHoiCuoi);
    const vetCatToken = useGame((s) => s.vetCatToken);
    const presetTrace = useGame((s) => s.presetTrace);
    const vetVeSinh = useGame((s) => s.vetVeSinh);
    const cong = useAi((s) => s.cong());
    const tyLeHong = useAi((s) => s.tyLeHong());
    const thongKe = useAi((s) => s.thongKeTruyHoi);
    const machRerank = useAi((s) => s.machRerank);
    const canhBaoNganSach = useAi((s) => s.canhBaoNganSach);
    const dangBat = usePreset((s) => s.dangBat);
    const soPatchTruot = patchBiTuChoi.length;
    const tyLeTruot = soPatchTruot === 0 ? 0 : 1;
    const mucAi = [
        {
            ten: 'Cổng AI',
            gia: NHAN_TRANG_THAI_CONG[cong.trangThai],
            hong: !cong.choPhepChoi,
            lam: 'Mở Cài Đặt AI, điền proxy và model, rồi bấm "Thử đường".',
        },
        {
            ten: 'Tỉ lệ gọi hỏng',
            gia: `${Math.round(tyLeHong * 100)}%`,
            hong: tyLeHong > 0.15,
            lam: 'Đường mạng hoặc proxy đang chập chờn. Thử đường lại, hoặc đổi endpoint dự phòng.',
        },
        {
            // Mục 27 của bảng 46.2 — hỏng khi vượt 15%.
            ten: 'Patch AI bị từ chối ở lượt gần nhất',
            gia: String(soPatchTruot),
            hong: tyLeTruot > 0.15,
            lam: 'Bật "Cập Nhật Biến" thành một điểm cuối riêng: model viết văn và xuất JSON cùng lúc thì JSON hay ẩu.',
        },
        {
            ten: 'Cảnh báo ngân sách token',
            gia: String(canhBaoNganSach.length),
            hong: canhBaoNganSach.length > 0,
            lam: canhBaoNganSach[0] ?? '',
        },
        {
            /*
             * Phase 12 — bộ vệ sinh văn bản.
             *
             * Khác 0 KHÔNG phải là "đã bị tấn công": ký tự vô hình lọt vào từ những
             * file copy-paste hoàn toàn vô hại. Nhưng nó cũng không phải chuyện im
             * lặng được, vì ký tự đảo chiều văn bản thì luôn là cố ý.
             */
            ten: 'Lần bộ vệ sinh phải lọc văn bản',
            gia: String(vetVeSinh.length),
            hong: vetVeSinh.length > 0,
            lam: vetVeSinh[vetVeSinh.length - 1] ?? '',
        },
    ];
    const mucTruyHoi = [
        {
            // [BB] 77.10 — con số này phải LUÔN bằng 0. Khác 0 là rò rỉ, không phải là chậm.
            ten: 'Chunk cấm lọt vào kết quả truy hồi',
            gia: String(thongKe.tongForbidden),
            hong: thongKe.tongForbidden > 0,
            lam: 'Đây là rò rỉ tầm nhìn. Dừng chơi nhánh này và báo lỗi kèm ảnh chụp tab Truy hồi.',
        },
        {
            ten: 'Lần rơi về heuristic',
            gia: `${thongKe.soFallback}/${thongKe.soLan}`,
            hong: thongKe.soLan > 0 && thongKe.soFallback / thongKe.soLan > 0.5,
            lam: 'Reranker ngữ nghĩa đang hỏng hoặc quá chậm. Tắt nó đi — heuristic vẫn chơi được.',
        },
        {
            ten: 'Ngắt mạch reranker',
            gia: machRerank.moMach ? 'đang mở' : 'đóng',
            hong: machRerank.moMach,
            lam: 'Mở Cài Đặt AI và thử lại endpoint rerank, hoặc để nguyên: gameplay không phụ thuộc nó.',
        },
        {
            ten: 'Chunk đã chọn cho lượt gần nhất',
            gia: String(truyHoiCuoi?.daChon.length ?? 0),
            hong: false,
            lam: '',
        },
    ];
    const mucPreset = [
        {
            ten: 'Pack đang bật',
            gia: String(Object.keys(dangBat).length),
            hong: false,
            lam: '',
        },
        {
            ten: 'Macro chưa có ánh xạ ở lượt gần nhất',
            gia: String(presetTrace.macroChuaGiai.length),
            hong: presetTrace.macroChuaGiai.length > 0,
            lam: 'Những macro này giữ nguyên văn trong prompt. Tắt module chứa chúng, hoặc viết adapter.',
        },
        {
            ten: 'Module bị cắt khỏi prompt',
            gia: String(presetTrace.moduleBiBo.length),
            hong: false,
            lam: '',
        },
        {
            ten: 'Tầng prompt bị cắt vì ngân sách',
            gia: String(vetCatToken.length),
            hong: vetCatToken.length > 2,
            lam: 'Ngân sách đang quá chật. Tăng context của model, hoặc tắt bớt module preset.',
        },
    ];
    return (_jsxs("main", { style: { padding: '22px 24px 60px', maxWidth: 900, margin: '0 auto' }, children: [_jsx("h1", { className: "chu-hien", style: { margin: '0 0 4px', fontSize: 26 }, children: "T\u1EF1 Ch\u1EA9n \u0110o\u00E1n" }), _jsx("p", { style: { ...phu, margin: '0 0 22px' }, children: "M\u1ED7i m\u1EE5c h\u1ECFng \u0111i k\u00E8m vi\u1EC7c c\u1EA7n l\u00E0m. Kh\u00F4ng c\u00F3 m\u1EE5c n\u00E0o ch\u1EC9 \u0111\u1EC3 nh\u00ECn." }), _jsx(Bang, { tieuDe: "\u0110\u01B0\u1EDDng AI", muc: mucAi }), _jsx(Bang, { tieuDe: "Truy h\u1ED3i v\u00E0 x\u1EBFp h\u1EA1ng", muc: mucTruyHoi }), _jsx(Bang, { tieuDe: "Preset", muc: mucPreset }), _jsxs("section", { className: "kinh", style: { padding: 18 }, children: [_jsx("h2", { style: { ...nhan, margin: '0 0 12px' }, children: "Tr\u1EA1ng th\u00E1i engine" }), _jsx("pre", { className: "chu-so", style: { margin: 0, ...phu, whiteSpace: 'pre-wrap' }, children: `state hash   ${stateHash}
visibility   ${view?.visibilityHash ?? '—'}
nhánh        ${state?.world.branchId ?? '—'}
seed         ${state?.world.seed ?? '—'}
nhịp         ${state?.world.tick ?? 0}
entity       ${state?.entities.size ?? 0} · thấy ${view?.entities.size ?? 0}
tri thức     ${state?.knowledge.size ?? 0}
mạch truyện  ${state?.storylines.size ?? 0}
phục bút     ${state?.foreshadows.size ?? 0}` }), patchBiTuChoi.length > 0 && (_jsxs("div", { style: { marginTop: 12 }, children: [_jsxs("div", { style: { ...nhan, color: 'var(--hoi)' }, children: [patchBiTuChoi.length, " thay \u0111\u1ED5i AI \u0111\u1EC1 ngh\u1ECB \u0111\u00E3 b\u1ECB engine t\u1EEB ch\u1ED1i"] }), patchBiTuChoi.map((p, i) => (_jsxs("div", { style: { ...phu, color: 'var(--hoi)' }, children: [p.ma, " \u2014 ", p.thongDiep] }, i)))] }))] })] }));
}
