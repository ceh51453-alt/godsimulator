import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { taiLieuHtmlCachLy } from '../../core/preset/sandbox.js';
/** Hiển thị HTML do regex preset tạo trong một iframe không có quyền chạy mã. */
export function NoiDungPreset({ html }) {
    const doc = useMemo(() => taiLieuHtmlCachLy(html).html, [html]);
    return (_jsx("iframe", { title: "N\u1ED9i dung do preset \u0111\u1ECBnh d\u1EA1ng", sandbox: "", referrerPolicy: "no-referrer", srcDoc: doc, style: { width: '100%', minHeight: 360, border: 0, background: 'transparent', display: 'block' } }));
}
