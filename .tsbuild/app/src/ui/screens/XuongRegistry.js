import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Xưởng Registry — Phần 5.4, 62. Màn thứ ba trong ba màn còn nợ.
 *
 * ── Câu quyết định toàn bộ màn này ──
 *
 * [BB] 62.2 — **manifest là JSON thuần; runtime handler nằm trong code.** Một
 * world pack không mang theo mã chạy được, và `quetDauVetCode()` là chỗ ép điều
 * đó: bất kỳ chuỗi nào trông giống hàm, `eval`, hay `require` đều làm cả pack bị
 * từ chối trước khi nó chạm vào `R`.
 *
 * ── Ba trạng thái, và cái ở giữa mới là cái đáng nói ──
 *
 *   hoat_dong     — `handlerId` tra được trong `HandlerCatalog`
 *   can_adapter   — manifest hợp lệ nhưng chưa có handler nào biết chạy nó.
 *                   **Không phải lỗi.** Nó là một lời mời viết adapter, và pack
 *                   vẫn nhập được với mục ấy nằm im.
 *   cach_ly       — có dấu vết code, hoặc schema không qua
 *
 * Gộp `can_adapter` vào `cach_ly` sẽ làm mọi pack của người ngoài trông như mã
 * độc, và đó là cách nhanh nhất để không ai chia sẻ pack nữa.
 *
 * Nhập ở đây **không** ghi vào `R` ngay: `nhapWorldPack()` trả kết quả, người
 * dùng duyệt, rồi mới đăng ký. Đăng ký là một hành động riêng.
 */
import { useMemo, useRef, useState } from 'react';
import { R, REGISTRY_IDS, moiManifest, quetDauVetCode } from '../../core/registry/index.js';
import { nhapWorldPack } from '../../core/registry/packDsl.js';
import { coHandler, coSchemaRef } from '../../core/registry/index.js';
import { nut, nhanNho, the } from '../design/kieu.js';
const NHAN_REGISTRY = Object.freeze({
    aspect: 'Aspect — mặt của thực thể',
    kind: 'Kind — loại thực thể',
    verb: 'Verb — động từ sáng thế',
    relation: 'Relation — quan hệ',
    gap: 'Gap — loại lỗ hổng',
    action: 'Action — hành động',
    ending: 'Ending — kết cục',
    metric: 'Metric — chỉ số',
    profile: 'Profile — hồ sơ tuning',
    storyKind: 'StoryKind — loại mạch truyện',
    mechanism: 'Mechanism — cơ chế phái sinh',
    worldProcess: 'WorldProcess — tiến trình nền',
});
const NHAN_TRANG_THAI = Object.freeze({
    hoat_dong: 'hoạt động',
    can_adapter: 'cần adapter',
    cach_ly: 'bị cách ly',
    tat: 'đang tắt',
});
export function XuongRegistry() {
    const [dangMo, setDangMo] = useState(null);
    const [kq, setKq] = useState(null);
    const [tin, setTin] = useState('');
    const oFile = useRef(null);
    const manifest = useMemo(() => moiManifest(), []);
    /**
     * Thống kê theo registry, đọc từ chính `R` chứ không từ một bảng đếm riêng.
     *
     * Một con số đếm sẵn sẽ lệch ngay lần đầu có ai đó `napPack()`, và bảng này
     * tồn tại chính là để nhìn thấy điều đó.
     */
    const thongKe = useMemo(() => REGISTRY_IDS.map((id) => {
        const ms = manifest.filter((m) => m.registry === id);
        return {
            id,
            tong: R[id].danhSachId().length,
            coHandler: ms.filter((m) => m.handlerId !== '' && coHandler(m.handlerId)).length,
            thieuHandler: ms.filter((m) => m.handlerId !== '' && !coHandler(m.handlerId)).length,
            coSchema: ms.filter((m) => m.schemaRef !== '' && coSchemaRef(m.schemaRef)).length,
            canhBao: R[id].canhBao().length,
        };
    }), [manifest]);
    const tongCanhBao = thongKe.reduce((a, b) => a + b.canhBao, 0);
    const tongThieuHandler = thongKe.reduce((a, b) => a + b.thieuHandler, 0);
    return (_jsxs("main", { style: { maxWidth: 900, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 26 }, children: [_jsxs("header", { children: [_jsx("p", { style: nhanNho, children: "PH\u1EA6N 5 \u00B7 PH\u1EA6N 62" }), _jsx("h1", { style: { fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }, children: "X\u01B0\u1EDFng Registry" }), _jsxs("p", { style: { color: 'var(--tro)', margin: 0, fontSize: 14 }, children: ["M\u01B0\u1EDDi hai registry d\u1EF1ng n\u00EAn t\u1EEB v\u1EF1ng c\u1EE7a th\u1EBF gi\u1EDBi: lo\u1EA1i th\u1EF1c th\u1EC3, \u0111\u1ED9ng t\u1EEB, quan h\u1EC7, ti\u1EBFn tr\u00ECnh n\u1EC1n. Manifest l\u00E0 ", _jsx("b", { children: "JSON thu\u1EA7n" }), " \u2014 kh\u00F4ng world pack n\u00E0o mang theo m\u00E3 ch\u1EA1y \u0111\u01B0\u1EE3c."] })] }), _jsxs("section", { style: { ...the, display: 'flex', gap: 22, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: REGISTRY_IDS.length }), " registry"] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: manifest.length }), " manifest"] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)', color: tongThieuHandler > 0 ? 'var(--dong)' : undefined }, children: tongThieuHandler }), ' ', "m\u1EE5c c\u1EA7n adapter"] }), _jsxs("span", { children: [_jsx("b", { style: { fontFamily: 'var(--chu-so)', color: tongCanhBao > 0 ? 'var(--hoi)' : undefined }, children: tongCanhBao }), ' ', "c\u1EA3nh b\u00E1o"] })] }), _jsxs("section", { style: { display: 'grid', gap: 10 }, children: [_jsx("h2", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }, children: "M\u01B0\u1EDDi hai registry" }), _jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }, children: thongKe.map((t) => {
                            const mo = dangMo === t.id;
                            const ms = manifest.filter((m) => m.registry === t.id);
                            return (_jsxs("li", { style: { ...the, display: 'grid', gap: 8 }, children: [_jsxs("button", { type: "button", "aria-expanded": mo, onClick: () => setDangMo(mo ? null : t.id), style: {
                                            background: 'transparent',
                                            border: 'none',
                                            padding: 0,
                                            font: 'inherit',
                                            color: 'inherit',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            display: 'flex',
                                            gap: 12,
                                            alignItems: 'baseline',
                                            flexWrap: 'wrap',
                                        }, children: [_jsx("strong", { style: { fontFamily: 'var(--chu-hien)', fontSize: 17 }, children: NHAN_REGISTRY[t.id] }), _jsx("span", { style: { flex: 1 } }), _jsx("span", { style: { fontSize: 13, color: 'var(--tro)', fontFamily: 'var(--chu-so)' }, children: t.tong }), _jsx("span", { style: nhanNho, children: mo ? 'THU LẠI' : 'XEM' })] }), _jsxs("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--mo)' }, children: [_jsxs("span", { children: [t.coHandler, " c\u00F3 handler"] }), _jsxs("span", { children: [t.thieuHandler, " c\u1EA7n adapter"] }), _jsxs("span", { children: [t.coSchema, " c\u00F3 schema"] }), t.canhBao > 0 && _jsxs("span", { style: { color: 'var(--hoi)' }, children: [t.canhBao, " c\u1EA3nh b\u00E1o"] })] }), mo && (_jsx("ul", { style: {
                                            listStyle: 'none',
                                            padding: 0,
                                            margin: 0,
                                            display: 'grid',
                                            gap: 3,
                                            maxHeight: 320,
                                            overflowY: 'auto',
                                            fontSize: 12,
                                        }, children: ms.map((m) => (_jsxs("li", { style: { display: 'flex', gap: 10, color: 'var(--tro)' }, children: [_jsx("span", { style: { minWidth: 200 }, children: m.ten }), _jsx("span", { style: { color: 'var(--mo)', fontFamily: 'var(--chu-so)' }, children: m.handlerId === ''
                                                        ? 'không cần handler'
                                                        : coHandler(m.handlerId)
                                                            ? m.handlerId
                                                            : `${m.handlerId} — chưa có adapter` })] }, m.id))) }))] }, t.id));
                        }) })] }), _jsxs("section", { style: { display: 'grid', gap: 10 }, children: [_jsx("h2", { style: { margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }, children: "Nh\u1EADp world pack" }), _jsxs("p", { style: { margin: 0, color: 'var(--mo)', fontSize: 13 }, children: ["Nh\u1EADp \u1EDF \u0111\u00E2y ch\u1EC9 ", _jsx("b", { children: "\u0111\u1ECDc v\u00E0 b\u00E1o c\u00E1o" }), ". Kh\u00F4ng m\u1EE5c n\u00E0o v\u00E0o registry cho t\u1EDBi khi b\u1EA1n duy\u1EC7t \u2014 v\u00E0 m\u1EE5c c\u00F3 d\u1EA5u v\u1EBFt code th\u00EC kh\u00F4ng bao gi\u1EDD v\u00E0o."] }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", style: nut(true), onClick: () => oFile.current?.click(), children: "Ch\u1ECDn file pack (.json)" }), _jsx("input", { ref: oFile, type: "file", accept: "application/json,.json", style: { display: 'none' }, onChange: (e) => {
                                    const f = e.target.files?.[0];
                                    e.target.value = '';
                                    if (!f)
                                        return;
                                    void (async () => {
                                        let goc;
                                        try {
                                            goc = JSON.parse(await f.text());
                                        }
                                        catch {
                                            setKq(null);
                                            setTin(`"${f.name}" không phải JSON đọc được.`);
                                            return;
                                        }
                                        const vet = quetDauVetCode(goc);
                                        const r = nhapWorldPack(goc);
                                        setKq(r);
                                        setTin(vet.length > 0
                                            ? `"${f.name}": tìm thấy ${vet.length} dấu vết code — pack này không nhập được.`
                                            : `"${f.name}": đọc xong.`);
                                    })();
                                } }), tin !== '' && _jsx("span", { style: { fontSize: 13, color: 'var(--tro)' }, children: tin })] }), kq !== null && (_jsxs("div", { style: { ...the, display: 'grid', gap: 10 }, children: [_jsxs("div", { style: { display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }, children: [_jsxs("span", { children: ["t\u1ED5ng ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: kq.thongKe.tong })] }), _jsxs("span", { children: ["ho\u1EA1t \u0111\u1ED9ng ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: kq.thongKe.hoatDong })] }), _jsxs("span", { children: ["c\u1EA7n adapter ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: kq.thongKe.canAdapter })] }), _jsxs("span", { children: ["b\u1ECB c\u00E1ch ly ", _jsx("b", { style: { fontFamily: 'var(--chu-so)' }, children: kq.thongKe.cachLy })] })] }), kq.issues.length > 0 && (_jsxs("div", { children: [_jsxs("span", { style: nhanNho, children: [kq.issues.length, " V\u1EA4N \u0110\u1EC0"] }), _jsx("ul", { style: { margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--tro)' }, children: kq.issues.slice(0, 12).map((i, n) => (_jsxs("li", { children: [_jsx("span", { style: { fontFamily: 'var(--chu-so)' }, children: i.code }), " \u2014 ", i.message] }, `${i.code}-${n}`))) })] })), kq.muc.length > 0 && (_jsx("ul", { style: {
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    display: 'grid',
                                    gap: 3,
                                    maxHeight: 300,
                                    overflowY: 'auto',
                                    fontSize: 12,
                                }, children: kq.muc.map((m) => (_jsxs("li", { style: { display: 'flex', gap: 10 }, children: [_jsx("span", { style: { minWidth: 190, color: 'var(--sang)' }, children: m.manifest.ten }), _jsx("span", { style: { minWidth: 110, color: 'var(--tro)' }, children: NHAN_TRANG_THAI[m.trangThai] ?? m.trangThai }), _jsx("span", { style: { color: 'var(--mo)' }, children: m.lyDo })] }, `${m.manifest.registry}.${m.manifest.id}`))) })), _jsxs("p", { style: { margin: 0, fontSize: 12, color: 'var(--mo)' }, children: ["Duy\u1EC7t v\u00E0 \u0111\u0103ng k\u00FD v\u00E0o registry \u0111ang ch\u1EA1y l\u00E0 b\u01B0\u1EDBc ti\u1EBFp theo v\u00E0 n\u00F3 ch\u01B0a c\u00F3 \u1EDF b\u1EA3n n\u00E0y \u2014 xem s\u1ED5 n\u1EE3 \u1EDF", ' ', _jsx("code", { style: { fontFamily: 'var(--chu-so)' }, children: "docs/IMPLEMENTATION_STATUS.md" }), "."] })] }))] })] }));
}
