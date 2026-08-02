import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useUi, TEN_MAN_HINH } from '../../store/ui.js';
import { Icon } from '../design/Icon.js';
export function ManPhu({ children }) {
    const man = useUi((s) => s.man);
    const doiMan = useUi((s) => s.doiMan);
    // `Esc` quay về Sảnh — cùng phím với đóng lớp phủ, cùng nghĩa "về chỗ cũ".
    useEffect(() => {
        const nghe = (e) => {
            if (e.key === 'Escape')
                doiMan('sanh');
        };
        window.addEventListener('keydown', nghe);
        return () => window.removeEventListener('keydown', nghe);
    }, [doiMan]);
    return (_jsxs("div", { style: { height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [_jsxs("header", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 22px',
                    borderBottom: '1px solid var(--kinh-vien)',
                }, children: [_jsxs("button", { type: "button", onClick: () => doiMan('sanh'), style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                            background: 'transparent',
                            color: 'var(--tro)',
                            border: '1px solid var(--kinh-vien)',
                            borderRadius: 'var(--r-sm)',
                            padding: '6px 13px',
                            font: 'inherit',
                            fontSize: 13,
                            cursor: 'pointer',
                        }, children: [_jsx(Icon, { ten: "tinh_do", co: 14 }), "V\u1EC1 S\u1EA3nh"] }), _jsxs("span", { style: { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }, children: [TEN_MAN_HINH[man], " \u00B7 Esc \u0111\u1EC3 quay l\u1EA1i"] })] }), _jsx("div", { style: { flex: 1, minHeight: 0, overflowY: 'auto' }, children: children })] }));
}
