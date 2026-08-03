/**
 * Macro compatibility — Phần 63.5 [BB].
 *
 * ── Vì sao là AST chứ không phải `String.replace` ──
 *
 * Đặc tả nói thẳng: "Macro được parse thành AST, không dùng replace chuỗi tùy
 * tiện." Lý do rất cụ thể. `{{setvar::x::{{getvar::y}}}}` có macro lồng trong đối
 * số; một chuỗi `replace` chạy từ trái sang phải sẽ cắt sai dấu `::` bên trong và
 * đặt biến `x` bằng một chuỗi rác — âm thầm, không báo lỗi, và sai suốt ván chơi.
 *
 * ── Ba luật của file này ──
 *
 * 1. Macro không biết thì **giữ nguyên raw** và ghi cảnh báo. Không làm tắt cả module.
 * 2. Biến nằm trong namespace `preset.<packId>` — [BB] không chạm World.
 * 3. `{{random::…}}` seeded theo `sceneId + moduleId + turn`, không `Math.random`.
 */
import { taoRng } from '../engine/rng.js';
/** Macro có ánh xạ native — 63.5. Mọi thứ ngoài danh sách này là `needs_adapter`. */
export const MACRO_BIET = [
    'char',
    'user',
    'persona',
    'description',
    'lastusermessage',
    'trim',
    'newline',
    'random',
    'pick',
    'setvar',
    'getvar',
    'addvar',
    'incvar',
    'setglobalvar',
    'getglobalvar',
    'addglobalvar',
    'noop',
    'roll',
    'macro',
];
const BIET = new Set(MACRO_BIET);
/** Macro global bị chuyển vào namespace pack — 63.5, kèm cảnh báo đổi semantics. */
const GLOBAL_SANG_PACK = Object.freeze({
    setglobalvar: 'setvar',
    getglobalvar: 'getvar',
    addglobalvar: 'addvar',
});
/**
 * Tách một chuỗi thành cây macro.
 *
 * Bộ quét đếm ngoặc thật sự thay vì tìm `}}` gần nhất, nên `{{a::{{b}}}}` cho ra
 * một macro `a` với một đối số là macro `b`, chứ không phải hai mảnh vỡ.
 */
export function docMacro(text) {
    const ra = [];
    let i = 0;
    let dem = '';
    const xaVan = () => {
        if (dem !== '') {
            ra.push({ loai: 'van', text: dem });
            dem = '';
        }
    };
    while (i < text.length) {
        if (text.startsWith('{{', i)) {
            const ket = timDongNgoac(text, i);
            if (ket < 0) {
                // Ngoặc không đóng — đây là văn bản, không phải macro hỏng.
                dem += text.slice(i);
                break;
            }
            const raw = text.slice(i, ket + 2);
            const than = text.slice(i + 2, ket);
            xaVan();
            ra.push(dungNutMacro(than, raw));
            i = ket + 2;
            continue;
        }
        dem += text[i];
        i++;
    }
    xaVan();
    return ra;
}
/** Trả về chỉ số của `}}` khớp với `{{` ở `batDau`, hoặc -1. */
function timDongNgoac(text, batDau) {
    let sau = 0;
    let i = batDau;
    while (i < text.length - 1) {
        if (text.startsWith('{{', i)) {
            sau++;
            i += 2;
            continue;
        }
        if (text.startsWith('}}', i)) {
            sau--;
            if (sau === 0)
                return i;
            i += 2;
            continue;
        }
        i++;
    }
    return -1;
}
function dungNutMacro(than, raw) {
    // Comment `{{//...}}` — 63.5: bỏ khi compile, giữ trong raw source.
    if (than.startsWith('//')) {
        return { loai: 'macro', ten: 'noop', doiSo: [], raw };
    }
    const phan = tachTheoHaiHaiCham(than);
    let ten = (phan[0] ?? '').trim().toLowerCase();
    // SillyTavern chấp nhận cả {{roll:d100}} và {{roll 1d9}}.
    const roll = /^roll(?:\s+|:)(.+)$/i.exec(ten);
    if (roll !== null) {
        ten = 'roll';
        phan.splice(1, 0, roll[1] ?? '');
    }
    const doiSo = phan.slice(1).map((p) => docMacro(p));
    return { loai: 'macro', ten, doiSo, raw };
}
/** Tách theo `::` ở mức ngoài cùng — không cắt vào `::` nằm trong macro lồng. */
function tachTheoHaiHaiCham(s) {
    const ra = [];
    let sau = 0;
    let dem = '';
    let i = 0;
    while (i < s.length) {
        if (s.startsWith('{{', i)) {
            sau++;
            dem += '{{';
            i += 2;
            continue;
        }
        if (s.startsWith('}}', i)) {
            sau = Math.max(0, sau - 1);
            dem += '}}';
            i += 2;
            continue;
        }
        if (sau === 0 && s.startsWith('::', i)) {
            ra.push(dem);
            dem = '';
            i += 2;
            continue;
        }
        dem += s[i];
        i++;
    }
    ra.push(dem);
    return ra;
}
/** Tên mọi macro xuất hiện trong một chuỗi, kể cả lồng nhau. Đã khử trùng, đã sắp. */
export function macroTrongChuoi(text) {
    const ra = new Set();
    const di = (ds) => {
        for (const n of ds) {
            if (n.loai !== 'macro')
                continue;
            ra.add(n.ten);
            for (const d of n.doiSo)
                di(d);
        }
    };
    di(docMacro(text));
    return [...ra].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
/** Macro nào trong chuỗi chưa có ánh xạ native. */
export function macroChuaHoTro(text) {
    return macroTrongChuoi(text).filter((m) => !BIET.has(m));
}
/** Namespace biến của một pack — 63.5 [BB]. */
export function khoaBienPack(packId, ten) {
    return `preset.${packId}.${ten}`;
}
/**
 * Giải macro trên một chuỗi.
 *
 * `maxDepth` đến từ `tuning.preset.maxMacroDepth`. Vượt giới hạn không throw —
 * nó trả về raw kèm một issue, đúng nguyên tắc 4 (mâu thuẫn thành nội dung).
 */
export function giaiMacro(text, ctx) {
    const chuaGiai = new Set();
    const issues = [];
    const bien = { ...ctx.bien };
    let canTrim = false;
    let demRandom = 0;
    const giaiDs = (ds, sau, dangGiai) => {
        let ra = '';
        for (const n of ds) {
            ra += n.loai === 'van' ? n.text : giaiMot(n, sau, dangGiai);
        }
        return ra;
    };
    const doiSoThanhChuoi = (n, vi, sau, dangGiai) => giaiDs(n.doiSo[vi] ?? [], sau, dangGiai);
    const giaiMot = (n, sau, dangGiai) => {
        if (sau > ctx.maxDepth) {
            issues.push({
                code: 'MACRO_QUA_SAU',
                severity: 'warning',
                path: n.raw,
                message: `Macro lồng quá ${ctx.maxDepth} tầng (tuning.preset.maxMacroDepth). Giữ nguyên văn bản gốc.`,
                details: { ten: n.ten, sau },
            });
            return n.raw;
        }
        const ten = GLOBAL_SANG_PACK[n.ten] ?? n.ten;
        if (ten !== n.ten) {
            issues.push({
                code: 'GLOBAL_VAR_DOI_PHAM_VI',
                severity: 'warning',
                path: n.raw,
                message: `"${n.ten}" là biến toàn cục ở hệ nguồn. Nó đã được chuyển vào namespace của pack — ` +
                    'ngữ nghĩa đã đổi: biến này không còn xuyên save.',
                details: { tuMacro: n.ten, thanhMacro: ten },
            });
        }
        switch (ten) {
            case 'noop':
                return '';
            case 'char':
                return ctx.char;
            case 'user':
            case 'persona':
                return ctx.user === '' ? ctx.persona : ctx.user;
            case 'description':
                return ctx.description;
            case 'lastusermessage':
                return ctx.lastUserMessage;
            case 'trim':
                canTrim = true;
                return '';
            case 'newline':
                return '\n';
            case 'random':
            case 'pick': {
                let lua = n.doiSo.map((_, i) => doiSoThanhChuoi(n, i, sau + 1, dangGiai));
                if (lua.length === 1 && lua[0]?.includes(','))
                    lua = lua[0].split(',').map((s) => s.trim());
                if (lua.length === 0)
                    return '';
                // [BB] Seeded theo scene + module + turn + số thứ tự lần rút trong module.
                const rng = taoRng(`${ctx.sceneId}#${ctx.moduleId}#${ctx.turn}#${demRandom++}`);
                return lua[rng.nguyen(lua.length)] ?? '';
            }
            case 'roll': {
                const raw = doiSoThanhChuoi(n, 0, sau + 1, dangGiai)
                    .trim()
                    .toLowerCase();
                const xucXac = /^(?:(\d+)d)?(\d+)(?:\s*([+-])\s*(\d+))?$/.exec(raw.replace(/^d/, '1d'));
                if (xucXac === null)
                    return n.raw;
                const soVien = Math.max(1, Math.min(100, Number(xucXac[1] ?? 1)));
                const soMat = Math.max(1, Math.min(1_000_000, Number(xucXac[2] ?? 1)));
                const bu = Number(xucXac[4] ?? 0) * (xucXac[3] === '-' ? -1 : 1);
                const rng = taoRng(`${ctx.sceneId}#${ctx.moduleId}#${ctx.turn}#roll#${demRandom++}`);
                let tong = bu;
                for (let i = 0; i < soVien; i++)
                    tong += rng.nguyen(soMat) + 1;
                return String(tong);
            }
            case 'macro': {
                // {{macro::summon_writer::Tên}} là macro mở rộng dùng trong Ako. Runtime
                // không triệu hồi agent/script; nội dung phong cách vẫn được giữ trong prompt.
                const loai = doiSoThanhChuoi(n, 0, sau + 1, dangGiai)
                    .trim()
                    .toLowerCase();
                if (loai === 'summon_writer')
                    return doiSoThanhChuoi(n, 1, sau + 1, dangGiai);
                return n.raw;
            }
            case 'setvar': {
                const khoa = doiSoThanhChuoi(n, 0, sau + 1, dangGiai).trim();
                const gt = doiSoThanhChuoi(n, 1, sau + 1, dangGiai);
                if (khoa !== '')
                    bien[khoa] = gt;
                return '';
            }
            case 'addvar':
            case 'incvar': {
                const khoa = doiSoThanhChuoi(n, 0, sau + 1, dangGiai).trim();
                const them = Number(doiSoThanhChuoi(n, 1, sau + 1, dangGiai) || '1');
                const cu = Number(bien[khoa] ?? 0);
                bien[khoa] = (Number.isFinite(cu) ? cu : 0) + (Number.isFinite(them) ? them : 0);
                return '';
            }
            case 'getvar': {
                const khoa = doiSoThanhChuoi(n, 0, sau + 1, dangGiai).trim();
                if (dangGiai.includes(khoa)) {
                    // [BB] 63.5 — cycle biến thì compile fail CÓ ĐƯỜNG DẪN cycle.
                    issues.push({
                        code: 'MACRO_CYCLE',
                        severity: 'error',
                        path: n.raw,
                        message: `Biến preset tạo vòng lặp: ${[...dangGiai, khoa].join(' → ')}. Pack chưa gỡ vòng thì chưa biên dịch được.`,
                        details: { cycle: [...dangGiai, khoa] },
                    });
                    return '';
                }
                const gt = bien[khoa];
                if (gt === undefined)
                    return '';
                const s = typeof gt === 'string' ? gt : JSON.stringify(gt);
                // Giá trị biến có thể chứa macro — giải tiếp, có chống vòng.
                return s.includes('{{') ? giaiDs(docMacro(s), sau + 1, [...dangGiai, khoa]) : s;
            }
            default:
                // Comment macro — {{//text}} → xóa âm thầm, không lãng phí token.
                // Preset SillyTavern dùng {{//...}} như chú thích cho người viết preset.
                if (n.ten.startsWith('//'))
                    return '';
                chuaGiai.add(n.ten);
                issues.push({
                    code: 'MACRO_CAN_ADAPTER',
                    severity: 'warning',
                    path: n.raw,
                    message: `Macro "${n.ten}" chưa có ánh xạ native. Giữ nguyên văn bản gốc; không đoán bằng regex (63.5).`,
                    details: { ten: n.ten },
                });
                return n.raw;
        }
    };
    const out = giaiDs(docMacro(text), 0, []);
    return {
        text: canTrim ? out.trim() : out,
        chuaGiai: [...chuaGiai].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
        bienSau: bien,
        issues,
        canTrim,
    };
}
