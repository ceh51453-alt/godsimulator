import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Xưởng Workflow và Diễn Hóa — Phần 50.8, 50.10, 50.12, 47.
 *
 * ── Một trong bốn màn còn nợ từ Phase 11 ──
 *
 * Hai thứ nằm chung một màn vì chúng là hai đầu của cùng một câu hỏi: *thế giới
 * tự chạy tiếp thế nào khi người chơi không gõ gì.* Workflow quyết **việc gì**
 * được làm; Diễn Hóa quyết **chạy bao xa rồi dừng ở đâu**.
 *
 * ── [BB] 50.10 — lằn ranh không phải một lời dặn ──
 *
 * `kiemLanRanh()` chạy TRƯỚC khi một preset được coi là dùng được, và kết quả
 * của nó hiện thẳng ở đây. Sáu bảng trong `DUONG_DAN_CAM_WORKFLOW` không tác vụ
 * nào chạm được, kể cả tác vụ cuối chuỗi: Luật Nền, tuning, nhánh, cấu hình AI
 * và hồ sơ người chơi.
 *
 * ── [BB] 47.5 — có ảnh chụp trước khi tua ──
 *
 * Diễn Hóa ghi `anhChup` (hash state) vào `EvolutionLog` trước khi chạy. Không
 * có nút lùi thì một tính năng tua trăm năm đáng sợ hơn đáng dùng.
 */
import { useMemo, useState } from 'react';
import { useGame } from '../../store/game.js';
import { useAi } from '../../store/ai.js';
import { PRESET_WORKFLOW, DUONG_DAN_CAM_WORKFLOW, kiemLanRanh } from '../../core/workflow/dungSan.js';
import { NHIP_DIEN_HOA, DIEU_KIEN_DUNG_DIEN_HOA, BANG_CAM_DIEN_HOA } from '../../core/world/dienHoa.js';
import { nut, nhanNho, the, oNhap } from '../design/kieu.js';
const NHAN_NHIP = Object.freeze({
    nien: 'Niên — mỗi lượt một năm',
    the_dai: 'Thế đại — mỗi lượt ba mươi năm',
    vinh_kiep: 'Vĩnh kiếp — mỗi lượt một thế kỷ',
});
/**
 * Mười một điều kiện dừng của 47.3, viết lại thành câu người đọc được.
 *
 * Bảng đầy đủ chứ không có nhánh `?? dk`: một id lọt lên giao diện là đúng thứ
 * cổng "không raw id/enum" của Phase 11 bắt được, và `Record` đầy đủ làm
 * TypeScript bắt hộ ngay lúc ai đó thêm điều kiện thứ mười hai.
 */
const NHAN_DUNG = Object.freeze({
    het_luot: 'Hết số lượt đã đặt',
    can_ngan_sach: 'Cạn ngân sách call hoặc token',
    reality_tut_qua_20: 'Thực tại tụt quá 20 điểm',
    mach_dat_cao_trao: 'Một mạch truyện lên cao trào',
    nhan_vat_nguoi_choi_lam_nguy: 'Nhân vật của bạn lâm nguy',
    ke_thu_troi_day: 'Một kẻ thù trỗi dậy',
    ky_vong_lorebook_bi_lech: 'Một kỳ vọng lorebook bị lệch',
    co_che_moi_xuat_hien: 'Một cơ chế mới xuất hiện',
    luat_nen_duoc_dat_ten: 'Một trục Luật Nền được đặt tên',
    than_mat_domain: 'Một vị thần mất domain',
    phuc_but_qua_han: 'Một phục bút đã quá hạn',
});
function Khoi({ ten, phu, children }) {
    return (_jsxs("section", { style: { display: 'grid', gap: 10 }, children: [_jsxs("header", { children: [_jsx("h2", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }, children: ten }), phu !== undefined && _jsx("p", { style: { margin: '2px 0 0', color: 'var(--mo)', fontSize: 13 }, children: phu })] }), children] }));
}
export function XuongWorkflow() {
    const state = useGame((s) => s.state);
    const chay = useGame((s) => s.chayDienHoa);
    const dangChay = useGame((s) => s.dangDienHoa);
    const baoCao = useGame((s) => s.baoCaoDienHoa);
    const vet = useGame((s) => s.vetDuongOng);
    const cong = useAi((s) => s.cong());
    /**
     * Điểm cuối Diễn Hóa có bật riêng và có đủ địa chỉ + model không.
     *
     * Kiểm ở đây để nói TRƯỚC, không để người chơi bấm "Chạy Diễn Hóa" rồi tự hỏi
     * vì sao bảy tác vụ không chạy cái nào — [BB] 44.5 cùng tinh thần: phải nói rõ
     * còn thiếu gì.
     */
    const workflowBat = useAi((s) => s.cfg.workflow.batRieng &&
        s.cfg.workflow.proxyUrl.trim() !== '' &&
        s.cfg.workflow.modelId.trim() !== '');
    const [presetId, setPresetId] = useState('engine_hau_truong');
    const [nhip, setNhip] = useState('nien');
    const [soLuot, setSoLuot] = useState(20);
    const [dieuKien, setDieuKien] = useState([...DIEU_KIEN_DUNG_DIEN_HOA]);
    const preset = PRESET_WORKFLOW[presetId] ?? PRESET_WORKFLOW['trong'];
    const lanRanh = useMemo(() => (preset ? kiemLanRanh(preset) : null), [preset]);
    const batDieuKien = (dk, bat) => {
        setDieuKien(bat ? [...dieuKien, dk] : dieuKien.filter((x) => x !== dk));
    };
    return (_jsxs("main", { style: { maxWidth: 880, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 28 }, children: [_jsxs("header", { children: [_jsx("p", { style: nhanNho, children: "KH\u1ED0I N \u00B7 PH\u1EA6N 50 \u00B7 PH\u1EA6N 47" }), _jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }, children: "X\u01B0\u1EDFng Workflow" }), _jsx("p", { style: { color: 'var(--tro)', margin: 0, fontSize: 14 }, children: "\u0110\u00E2y l\u00E0 th\u1EE9 ch\u1EA1y khi b\u1EA1n kh\u00F4ng g\u00F5 g\u00EC. Workflow quy\u1EBFt vi\u1EC7c g\u00EC \u0111\u01B0\u1EE3c l\u00E0m; Di\u1EC5n H\u00F3a quy\u1EBFt ch\u1EA1y bao xa r\u1ED3i d\u1EEBng \u1EDF \u0111\u00E2u." })] }), _jsxs(Khoi, { ten: "\u0110\u01B0\u1EDDng \u1ED1ng t\u00E1c v\u1EE5", phu: "M\u1ED7i t\u00E1c v\u1EE5 c\u00F3 model, nh\u1ECBp v\u00E0 ng\u1EEF c\u1EA3nh ri\u00EAng \u2014 g\u1ED9p h\u1EBFt v\u00E0o m\u1ED9t call l\u00E0 ch\u1ECDn model t\u1EC7 nh\u1EA5t cho vi\u1EC7c kh\u00F3 nh\u1EA5t.", children: [_jsxs("label", { style: { display: 'grid', gap: 5, maxWidth: 360 }, children: [_jsx("span", { style: nhanNho, children: "PRESET" }), _jsx("select", { style: oNhap, value: presetId, onChange: (e) => setPresetId(e.target.value), children: Object.entries(PRESET_WORKFLOW).map(([id, p]) => (_jsxs("option", { value: id, children: [p.ten, " \u2014 ", p.moTa] }, id))) })] }), preset && (_jsx("div", { style: { ...the, display: 'grid', gap: 8 }, children: preset.tasks.length === 0 ? (_jsx("p", { style: { margin: 0, color: 'var(--mo)', fontSize: 13 }, children: "Preset r\u1ED7ng. Th\u1EBF gi\u1EDBi v\u1EABn ch\u1EA1y b\u1EB1ng m\u01B0\u1EDDi hai ti\u1EBFn tr\u00ECnh n\u1EC1n c\u1EE7a engine \u2014 workflow ch\u1EC9 th\u00EAm ph\u1EA7n c\u1EA7n model." })) : (_jsx("ol", { style: { margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 13 }, children: preset.tasks.map((t) => (_jsxs("li", { style: { color: 'var(--tro)' }, children: [_jsx("b", { style: { color: 'var(--sang)' }, children: t.ten }), ' ', _jsxs("span", { style: { color: 'var(--mo)' }, children: ["\u00B7 giai \u0111o\u1EA1n ", t.giaiDoan, " \u00B7 ", t.nhomPrompt.length, " nh\u00F3m prompt \u00B7 th\u1EED l\u1EA1i ", t.soLanThuLai, ' ', "l\u1EA7n \u00B7 ", t.dichGhi.length, " \u0111\u00EDch ghi ", t.bat ? '· đang bật' : '· đang tắt'] })] }, t.id))) })) })), _jsxs("div", { style: { ...the, display: 'grid', gap: 6 }, children: [_jsx("span", { style: nhanNho, children: "L\u1EB0N RANH C\u1EE8NG \u00B7 50.10" }), _jsx("p", { style: { margin: 0, fontSize: 13, color: 'var(--tro)' }, children: lanRanh === null || lanRanh.dat
                                    ? 'Preset này không chạm bảng cấm nào.'
                                    : `Preset này vi phạm ${lanRanh.loi.length} lằn ranh và sẽ không được nạp.` }), lanRanh !== null && !lanRanh.dat && (_jsx("ul", { style: { margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--tro)' }, children: lanRanh.loi.slice(0, 8).map((l, i) => (_jsxs("li", { children: [_jsx("span", { style: { fontFamily: 'var(--chu-so)' }, children: l.code }), " \u2014 ", l.message] }, `${l.code}-${i}`))) })), _jsxs("p", { style: { margin: 0, fontSize: 12, color: 'var(--mo)' }, children: ["Kh\u00F4ng t\u00E1c v\u1EE5 n\u00E0o ghi \u0111\u01B0\u1EE3c v\u00E0o: ", DUONG_DAN_CAM_WORKFLOW.join(' · '), "."] })] })] }), _jsx(Khoi, { ten: "Di\u1EC5n H\u00F3a", phu: "Tua th\u1EBF gi\u1EDBi nhi\u1EC1u nh\u1ECBp li\u1EC1n, v\u00E0 d\u1EEBng khi c\u00F3 chuy\u1EC7n \u0111\u00E1ng xem ch\u1EE9 kh\u00F4ng khi h\u1EBFt l\u01B0\u1EE3t.", children: state === null ? (_jsx("p", { style: { color: 'var(--mo)', fontSize: 13, margin: 0 }, children: "Ch\u01B0a m\u1EDF v\u00E1n n\u00E0o. Di\u1EC5n H\u00F3a ch\u1EA1y tr\u00EAn m\u1ED9t th\u1EBF gi\u1EDBi c\u1EE5 th\u1EC3." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }, children: [_jsxs("label", { style: { display: 'grid', gap: 5 }, children: [_jsx("span", { style: nhanNho, children: "NH\u1ECAP M\u1ED6I L\u01AF\u1EE2T" }), _jsx("select", { style: oNhap, value: nhip, onChange: (e) => setNhip(e.target.value), children: NHIP_DIEN_HOA.map((n) => (_jsx("option", { value: n, children: NHAN_NHIP[n] }, n))) })] }), _jsxs("label", { style: { display: 'grid', gap: 5 }, children: [_jsx("span", { style: nhanNho, children: "S\u1ED0 L\u01AF\u1EE2T T\u1ED0I \u0110A" }), _jsx("input", { style: oNhap, type: "number", min: 1, max: 500, value: soLuot, onChange: (e) => setSoLuot(Math.max(1, Math.min(500, Number(e.target.value) || 1))) })] })] }), _jsxs("fieldset", { style: { ...the, border: '1px solid var(--kinh-vien)', display: 'grid', gap: 6 }, children: [_jsx("legend", { style: nhanNho, children: "D\u1EEANG KHI" }), DIEU_KIEN_DUNG_DIEN_HOA.map((dk) => (_jsxs("label", { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }, children: [_jsx("input", { type: "checkbox", checked: dieuKien.includes(dk), onChange: (e) => batDieuKien(dk, e.target.checked) }), _jsx("span", { style: { color: 'var(--tro)' }, children: NHAN_DUNG[dk] })] }, dk)))] }), _jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nut(true, dangChay || !cong.choPhepChoi), disabled: dangChay || !cong.choPhepChoi, onClick: () => void chay({ soLuot, nhipMoiLuot: nhip, dieuKienDung: [...dieuKien], presetId }), children: dangChay ? 'Đang diễn hóa…' : 'Chạy Diễn Hóa' }), _jsx("span", { style: { ...nhanNho, textTransform: 'none' }, children: !cong.choPhepChoi
                                        ? 'Cổng AI chưa mở — Diễn Hóa cũng cần người kể.'
                                        : !workflowBat
                                            ? `Từ nhịp ${state.world.tick}. Điểm cuối Diễn Hóa chưa bật, nên lượt tua chỉ có engine chạy.`
                                            : `Từ nhịp ${state.world.tick}, chạy đường ống "${preset?.ten ?? ''}" sau mỗi lượt.` })] }), vet.length > 0 && (_jsxs("div", { style: { ...the, display: 'grid', gap: 6 }, children: [_jsx("span", { style: nhanNho, children: "\u0110\u01AF\u1EDCNG \u1ED0NG \u1EDE L\u1EA6N CH\u1EA0Y G\u1EA6N NH\u1EA4T" }), _jsxs("table", { style: { borderCollapse: 'collapse', width: '100%', fontSize: 12 }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', color: 'var(--mo)' }, children: [_jsx("th", { style: { padding: '3px 8px 3px 0', fontWeight: 400 }, children: "Giai \u0111o\u1EA1n" }), _jsx("th", { style: { padding: '3px 8px 3px 0', fontWeight: 400 }, children: "T\u00E1c v\u1EE5" }), _jsx("th", { style: { padding: '3px 8px 3px 0', fontWeight: 400 }, children: "Tr\u1EA1ng th\u00E1i" }), _jsx("th", { style: { padding: '3px 8px 3px 0', fontWeight: 400 }, children: "Call" }), _jsx("th", { style: { padding: '3px 0', fontWeight: 400 }, children: "K\u00FD t\u1EF1 ra" })] }) }), _jsx("tbody", { children: vet.slice(-30).map((v, i) => (_jsxs("tr", { style: { borderTop: '1px solid var(--kinh-vien)' }, children: [_jsx("td", { style: { padding: '4px 8px 4px 0', fontFamily: 'var(--chu-so)' }, children: v.giaiDoan }), _jsx("td", { style: { padding: '4px 8px 4px 0', color: 'var(--sang)' }, children: v.taskId }), _jsx("td", { style: { padding: '4px 8px 4px 0', color: 'var(--tro)' }, children: v.chay
                                                            ? v.thatBai > 0
                                                                ? `chạy, ${v.thatBai} call hỏng`
                                                                : 'chạy xong'
                                                            : `bỏ lượt — ${v.lyDo}` }), _jsx("td", { style: { padding: '4px 8px 4px 0', fontFamily: 'var(--chu-so)' }, children: v.soCall }), _jsx("td", { style: { padding: '4px 0', fontFamily: 'var(--chu-so)' }, children: v.soKyTuRa })] }, `${v.taskId}-${i}`))) })] })] })), _jsxs("p", { style: { margin: 0, fontSize: 12, color: 'var(--mo)' }, children: ["Di\u1EC5n H\u00F3a kh\u00F4ng bao gi\u1EDD ghi v\u00E0o: ", BANG_CAM_DIEN_HOA.join(' · '), "."] })] })) }), baoCao !== null && (_jsx(Khoi, { ten: "B\u00E1o C\u00E1o Di\u1EC5n H\u00F3a", phu: "Vi\u1EBFt b\u1EB1ng gi\u1ECDng bi\u00EAn ni\u00EAn s\u1EED, kh\u00F4ng ph\u1EA3i gi\u1ECDng log.", children: _jsx("pre", { style: {
                        ...the,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'var(--chu-so)',
                        fontSize: 12,
                        color: 'var(--tro)',
                        overflowX: 'auto',
                    }, children: baoCao.dong.join('\n') }) }))] }));
}
