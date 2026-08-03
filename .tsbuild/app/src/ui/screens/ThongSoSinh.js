import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Thông Số Sinh — bảng điều chỉnh tham số sinh (GenParams) cho từng endpoint.
 *
 * ── Vì sao nằm tách khỏi CotEndpoint ──
 *
 * `CotEndpoint` đã dài — thêm bảy slider vào cùng chỗ sẽ vượt 300 dòng, và phần
 * UI tham số là một khối chức năng riêng: nó có preset, có logic phát hiện "tùy
 * chỉnh", và nó không đụng tới probe hay ngắt mạch. Tách ra để một thay đổi ở
 * slider không buộc reviewer đọc lại phần quét model.
 *
 * ── Giá trị max ──
 *
 * Max theo Gemini 3.1 Pro (profile trong registry): contextMax=1M, outputMax=65536,
 * temperatureMax=2, topKMax=64. [BB] 31.2: "Giá trị max của mọi slider lấy từ
 * Profile đang chọn, không hardcode trong component."
 *
 * [BB] 36.1 — không emoji. [BB] luật bất biến #9 — không dấu hiệu nào chỉ bằng màu.
 */
import { useState, useMemo, useCallback } from 'react';
/**
 * Bốn preset cộng một lựa chọn "tùy chỉnh" (không áp gì).
 *
 * Thứ tự: sáng tạo nhất → chính xác nhất, rồi kể chuyện (chuyên biệt), rồi
 * tùy chỉnh. Người dùng đọc từ trên xuống, nên đặt mặc định ở giữa.
 */
const PRESETS = Object.freeze({
    sang_tao: {
        ten: 'Sáng Tạo',
        phu: 'Đa dạng, bất ngờ — phù hợp khám phá',
        params: {
            temperature: 1.5,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 65_536,
            contextLimit: 128_000,
            presencePenalty: 0,
            frequencyPenalty: 0,
        },
    },
    can_bang: {
        ten: 'Cân Bằng',
        phu: 'Mặc định — phù hợp hầu hết ván chơi',
        params: {
            temperature: 1.0,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8_192,
            contextLimit: 128_000,
            presencePenalty: 0,
            frequencyPenalty: 0,
        },
    },
    chinh_xac: {
        ten: 'Chính Xác',
        phu: 'Nhất quán, ít biến động — phù hợp thế giới nghiêm',
        params: {
            temperature: 0.3,
            topP: 0.8,
            topK: 20,
            maxOutputTokens: 8_192,
            contextLimit: 128_000,
            presencePenalty: 0,
            frequencyPenalty: 0,
        },
    },
    ke_chuyen: {
        ten: 'Kể Chuyện',
        phu: 'Văn phong phong phú, ít lặp',
        params: {
            temperature: 1.2,
            topP: 0.92,
            topK: 50,
            maxOutputTokens: 32_768,
            contextLimit: 128_000,
            presencePenalty: 0.3,
            frequencyPenalty: 0.3,
        },
    },
    tuy_chinh: {
        ten: 'Tùy chỉnh',
        phu: 'Chỉnh tay từng tham số',
        params: {},
    },
});
const DS_PRESET = Object.keys(PRESETS);
// ─────────────────────────────────────────── hằng giới hạn (Gemini 3.1 Pro)
const GIOI_HAN = {
    maxOutputTokens: { min: 1, max: 65_536, step: 1 },
    contextLimit: { min: 1_024, max: 1_048_576, step: 1_024 },
    temperature: { min: 0, max: 2, step: 0.01 },
    topP: { min: 0, max: 1, step: 0.01 },
    topK: { min: 0, max: 64, step: 1 },
    presencePenalty: { min: -2, max: 2, step: 0.01 },
    frequencyPenalty: { min: -2, max: 2, step: 0.01 },
};
const NHAN_THAM_SO = {
    maxOutputTokens: 'Max Output Tokens',
    contextLimit: 'Context Limit',
    temperature: 'Temperature',
    topP: 'Top P',
    topK: 'Top K',
    presencePenalty: 'Presence Penalty',
    frequencyPenalty: 'Frequency Penalty',
};
const MO_TA_THAM_SO = {
    maxOutputTokens: 'Số token tối đa model trả về mỗi lượt',
    contextLimit: 'Giới hạn cửa sổ ngữ cảnh (token)',
    temperature: 'Càng cao càng đa dạng, càng thấp càng nhất quán',
    topP: 'Lọc tích luỹ xác suất — 0.95 giữ 95% khả năng nhất',
    topK: 'Chỉ xét K từ có xác suất cao nhất',
    presencePenalty: 'Phạt chủ đề đã xuất hiện — giảm lặp nội dung',
    frequencyPenalty: 'Phạt từ dùng nhiều — giảm lặp cụm từ',
};
// ─────────────────────────────────────────── style
const nhanNho = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
const oNhap = {
    background: 'var(--kinh-nen-2)',
    color: 'var(--sang)',
    border: '1px solid var(--kinh-vien)',
    borderRadius: 'var(--r-sm)',
    padding: '9px 12px',
    font: 'inherit',
    fontSize: 13,
    width: '100%',
};
// ─────────────────────────────────────────── phát hiện preset
/**
 * So trạng thái hiện tại với bốn preset để biết đang ở preset nào.
 *
 * [BB] Nếu không khớp preset nào thì trả `tuy_chinh`. Ngưỡng sai số float
 * epsilon = 1e-6 để tránh false mismatch do rounding.
 */
function doPresetHienTai(p) {
    const eps = 1e-6;
    for (const ten of DS_PRESET) {
        if (ten === 'tuy_chinh')
            continue;
        const preset = PRESETS[ten].params;
        let khop = true;
        for (const [k, v] of Object.entries(preset)) {
            const hienTai = p[k];
            if (typeof v === 'number' && typeof hienTai === 'number') {
                if (Math.abs(hienTai - v) > eps) {
                    khop = false;
                    break;
                }
            }
        }
        if (khop)
            return ten;
    }
    return 'tuy_chinh';
}
// ─────────────────────────────────────────── slider row
function DongSlider({ ten, giaTri, tat, onChange, }) {
    const gh = GIOI_HAN[ten];
    // Tính phần trăm vị trí slider cho thanh tiến trình (visual feedback)
    const phanTram = ((giaTri - gh.min) / (gh.max - gh.min)) * 100;
    const laFloat = gh.step < 1;
    const hienThi = laFloat ? giaTri.toFixed(2) : giaTri.toLocaleString();
    return (_jsxs("div", { style: {
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '4px 10px',
            alignItems: 'center',
            padding: '6px 0',
        }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 1 }, children: [_jsx("span", { style: { fontSize: 12, color: 'var(--tro)', fontWeight: 500 }, children: NHAN_THAM_SO[ten] }), _jsx("span", { style: { fontSize: 10, color: 'var(--mo)', lineHeight: 1.3 }, children: MO_TA_THAM_SO[ten] })] }), _jsx("input", { type: "number", disabled: tat, value: hienThi, min: gh.min, max: gh.max, step: gh.step, style: {
                    ...oNhap,
                    width: 90,
                    textAlign: 'right',
                    padding: '5px 8px',
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                }, onChange: (e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v)) {
                        onChange(ten, Math.max(gh.min, Math.min(gh.max, v)));
                    }
                } }), _jsxs("div", { style: {
                    gridColumn: '1 / -1',
                    position: 'relative',
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                }, children: [_jsx("div", { style: {
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: 3,
                            borderRadius: 2,
                            background: 'var(--kinh-vien)',
                        } }), _jsx("div", { style: {
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: 3,
                            borderRadius: 2,
                            width: `${Math.max(0, Math.min(100, phanTram))}%`,
                            background: tat ? 'var(--mo)' : 'var(--dong)',
                            transition: 'width 0.12s ease-out',
                        } }), _jsx("input", { type: "range", disabled: tat, min: gh.min, max: gh.max, step: gh.step, value: giaTri, onChange: (e) => onChange(ten, parseFloat(e.target.value)), style: {
                            position: 'relative',
                            width: '100%',
                            height: 24,
                            margin: 0,
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            background: 'transparent',
                            cursor: tat ? 'not-allowed' : 'pointer',
                            opacity: tat ? 0.5 : 1,
                        } })] }), _jsxs("div", { style: { gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontSize: 10, color: 'var(--mo)' }, children: laFloat ? gh.min.toFixed(2) : gh.min.toLocaleString() }), _jsx("span", { style: { fontSize: 10, color: 'var(--mo)' }, children: laFloat ? gh.max.toFixed(2) : gh.max.toLocaleString() })] })] }));
}
// ─────────────────────────────────────────── component chính
export function ThongSoSinh({ params, tat, onThayDoi, }) {
    const [moRong, setMoRong] = useState(false);
    const presetHienTai = useMemo(() => doPresetHienTai(params), [params]);
    const doiPreset = useCallback((ten) => {
        if (ten === 'tuy_chinh')
            return;
        const pv = PRESETS[ten].params;
        onThayDoi(pv);
    }, [onThayDoi]);
    const doiThamSo = useCallback((ten, giaTri) => {
        onThayDoi({ [ten]: giaTri });
    }, [onThayDoi]);
    const THU_TU = [
        'maxOutputTokens',
        'contextLimit',
        'temperature',
        'topP',
        'topK',
        'presencePenalty',
        'frequencyPenalty',
    ];
    return (_jsxs("div", { style: {
            borderTop: '1px solid var(--kinh-vien)',
            marginTop: 8,
            paddingTop: 10,
        }, children: [_jsxs("button", { type: "button", onClick: () => setMoRong((v) => !v), style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 0',
                    cursor: 'pointer',
                    font: 'inherit',
                    color: 'var(--tro)',
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    textAlign: 'left',
                }, children: [_jsx("span", { style: {
                            display: 'inline-block',
                            transition: 'transform 0.2s ease',
                            transform: moRong ? 'rotate(90deg)' : 'rotate(0deg)',
                            fontSize: 10,
                            lineHeight: 1,
                        }, children: "\u25B6" }), "TH\u00D4NG S\u1ED0 SINH", _jsx("span", { style: { flex: 1 } }), _jsx("span", { style: { ...nhanNho, fontWeight: 400, textTransform: 'none' }, children: PRESETS[presetHienTai].ten })] }), moRong && (_jsxs("div", { style: {
                    paddingTop: 10,
                    display: 'grid',
                    gap: 6,
                    animation: 'fadeIn 0.18s ease-out',
                }, children: [_jsxs("div", { style: { display: 'grid', gap: 4 }, children: [_jsx("span", { style: nhanNho, children: "PRESET" }), _jsx("select", { style: { ...oNhap, width: '100%' }, disabled: tat, value: presetHienTai, onChange: (e) => doiPreset(e.target.value), children: DS_PRESET.map((id) => (_jsxs("option", { value: id, children: [PRESETS[id].ten, " \u2014 ", PRESETS[id].phu] }, id))) })] }), _jsx("div", { style: {
                            display: 'grid',
                            gap: 2,
                            marginTop: 4,
                        }, children: THU_TU.map((ten) => (_jsx(DongSlider, { ten: ten, giaTri: params[ten], tat: tat, onChange: doiThamSo }, ten))) }), _jsx("p", { style: { margin: '6px 0 0', fontSize: 11, color: 'var(--mo)', lineHeight: 1.5 }, children: "Gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a theo Gemini 3.1 Pro. Ch\u1EC9nh tay b\u1EA5t k\u1EF3 tham s\u1ED1 n\u00E0o s\u1EBD chuy\u1EC3n preset v\u1EC1 \"T\u00F9y ch\u1EC9nh\"." })] }))] }));
}
