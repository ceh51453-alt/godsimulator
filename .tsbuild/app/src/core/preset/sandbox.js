export const MAX_KY_TU = 200_000;
/**
 * Hình dạng gây quay lui theo hàm mũ. Chặn trước, không thử chạy.
 *
 * Ba mẫu này cố ý HẸP. Một bộ dò rộng sẽ ném `(foo|bar)*` — một pattern hoàn toàn
 * lành — vào `needs_adapter`, và fixture B có 21 regex thật đang chờ chạy. Đắt hơn
 * nhiều so với việc bỏ sót một pattern chậm, vì pattern chậm còn có lớp 3 đỡ.
 */
const MAU_NGUY_HIEM = [
    /\([^)]*[+*]\)\s*[+*]/, // (a+)+ · (a*)*
    /\{\d{4,},?\d*\}/, // {5000,} — lặp khổng lồ
];
/** Nhóm luân phiên có hai nhánh TRÙNG NHAU rồi bị lặp: `(x|x)*`. */
const NHOM_LAP = /\(([^()]*\|[^()]*)\)\s*[+*]/g;
function coNhanhTrungBiLap(s) {
    for (const g of s.matchAll(NHOM_LAP)) {
        const nhanh = (g[1] ?? '').split('|').map((x) => x.trim());
        if (new Set(nhanh).size !== nhanh.length)
            return true;
    }
    return false;
}
/**
 * Biên một pattern nguồn thành `RegExp`.
 *
 * Trả `null` khi không dùng được — người gọi chuyển transform sang `needs_adapter`.
 * Không throw: dữ liệu preset là dữ liệu không tin cậy, và một throw ở đây sẽ nổ
 * giữa đường render.
 */
export function bienRegex(pattern) {
    const s = pattern.trim();
    if (s === '')
        return null;
    for (const nguy of MAU_NGUY_HIEM) {
        if (nguy.test(s))
            return null;
    }
    if (coNhanhTrungBiLap(s))
        return null;
    const than = /^\/(.*)\/([gimsuy]*)$/s.exec(s);
    try {
        if (than) {
            const co = than[2] ?? '';
            return { re: new RegExp(than[1], co), toanBo: co.includes('g') };
        }
        return { re: new RegExp(s, 'g'), toanBo: true };
    }
    catch {
        return null;
    }
}
// ─────────────────────────────────────────── sanitizer
const THE_CAM = /<\s*\/?\s*(script|iframe|object|embed|form|link|meta|base|style)\b[^>]*>/gi;
const HANDLER = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const URL_CAM = /\b(?:href|src|action|formaction|xlink:href)\s*=\s*(?:"|')?\s*(?:javascript|data|vbscript):[^"'\s>]*/gi;
const STYLE_REMOTE = /\bstyle\s*=\s*(?:"[^"]*url\s*\([^)]*\)[^"]*"|'[^']*url\s*\([^)]*\)[^']*')/gi;
const BLOCK_CAM = /<\s*(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const THE_NGOAI = /<\s*\/?\s*(link|meta|base)\b[^>]*>/gi;
const URL_MANG = /\b(?:href|src|action|formaction|xlink:href)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const CSS_MANG = /@import\b[^;]*;?|url\s*\([^)]*\)/gi;
/**
 * Làm sạch HTML thay thế trước khi render — 64.3.
 *
 * Danh sách xóa lấy thẳng từ đặc tả: `<script>`, event handler, iframe, form,
 * remote stylesheet, URL không cho phép. Không dùng `innerHTML` ở đâu trong repo
 * này; chuỗi trả về vẫn phải đi qua renderer cô lập của Phase 11.
 */
export function lamSachHtml(html) {
    const daBo = [];
    let ra = html;
    const bo = (re, nhan) => {
        const truoc = ra;
        ra = ra.replace(re, '');
        if (ra !== truoc)
            daBo.push(nhan);
    };
    bo(THE_CAM, 'thẻ nguy hiểm (script/iframe/form/style/link/meta/base)');
    bo(HANDLER, 'thuộc tính bắt sự kiện (on*)');
    bo(URL_CAM, 'URL javascript:/data:/vbscript:');
    bo(STYLE_REMOTE, 'style có url() ngoài');
    return { html: ra, daBo };
}
/**
 * Dựng tài liệu HTML cho iframe không có quyền script/same-origin.
 *
 * Khác `lamSachHtml`, hàm này giữ CSS nội tuyến và thẻ `<style>` vì các preset
 * Tawa/Ako dùng chúng để dựng bảng, nhưng loại mọi URL mạng, import và handler.
 */
export function taiLieuHtmlCachLy(html) {
    const daBo = [];
    let ra = html;
    const bo = (re, nhan) => {
        const truoc = ra;
        ra = ra.replace(re, '');
        if (ra !== truoc)
            daBo.push(nhan);
    };
    bo(BLOCK_CAM, 'khối có khả năng thực thi/gửi dữ liệu');
    bo(THE_NGOAI, 'thẻ tải tài nguyên hoặc đổi base URL');
    bo(/<\s*\/?\s*(script|iframe|object|embed|form)\b[^>]*>/gi, 'thẻ nguy hiểm');
    bo(HANDLER, 'thuộc tính bắt sự kiện (on*)');
    bo(URL_CAM, 'URL có scheme thực thi');
    bo(URL_MANG, 'thuộc tính URL');
    bo(CSS_MANG, 'CSS tải tài nguyên ngoài');
    const csp = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src 'none'; form-action 'none'; base-uri 'none'";
    const doc = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>html,body{margin:0;background:transparent;color:#d8d3c5;font:14px/1.6 system-ui,sans-serif}*{box-sizing:border-box}details{margin:.4rem 0}button,input,textarea,select{pointer-events:none}</style></head><body>${ra}</body></html>`;
    return { html: doc, daBo };
}
/**
 * Áp một chuỗi transform lên **bản sao output hiển thị**.
 *
 * `dongHo` được tiêm vào thay vì gọi `performance.now()` trực tiếp: `core/` không
 * được đọc đồng hồ máy (luật bất biến #7), và test cần đo được đường "quá chậm"
 * mà không phải chờ thật.
 */
export function apTransform(input) {
    const { text, transforms, maxRegexMs } = input;
    const daTat = input.daTat ?? new Set();
    const dongHo = input.dongHo ?? (() => 0);
    const placement = input.placement ?? 2;
    const destination = input.destination ?? 'display';
    const depth = input.depth ?? 0;
    const daApDung = [];
    const daBoQua = [];
    const issues = [];
    const quaCham = [];
    let ra = text;
    if (text.length > MAX_KY_TU) {
        return {
            text,
            daApDung: [],
            daBoQua: transforms.map((t) => ({ id: t.id, lyDo: 'văn bản dài quá trần sandbox' })),
            issues: [
                {
                    code: 'TRANSFORM_BO_QUA_DAI',
                    severity: 'warning',
                    path: '',
                    message: `Output dài ${text.length} ký tự, vượt trần ${MAX_KY_TU} của sandbox. Giữ nguyên văn bản gốc.`,
                    details: { soKyTu: text.length },
                },
            ],
            quaCham: [],
        };
    }
    for (const t of transforms) {
        if (!t.batONguon) {
            daBoQua.push({ id: t.id, lyDo: 'đã tắt trong preset nguồn' });
            continue;
        }
        if (daTat.has(t.id)) {
            daBoQua.push({ id: t.id, lyDo: 'đã bị tắt sau một lần chạy quá chậm' });
            continue;
        }
        if (t.activation !== 'sandboxed') {
            daBoQua.push({ id: t.id, lyDo: `trạng thái ${t.activation}` });
            continue;
        }
        if (!t.placement.includes(placement)) {
            daBoQua.push({ id: t.id, lyDo: `không áp ở placement ${placement}` });
            continue;
        }
        if (t.minDepth !== null && depth < t.minDepth) {
            daBoQua.push({ id: t.id, lyDo: `depth ${depth} nhỏ hơn minDepth ${t.minDepth}` });
            continue;
        }
        if (t.maxDepth !== null && depth > t.maxDepth) {
            daBoQua.push({ id: t.id, lyDo: `depth ${depth} lớn hơn maxDepth ${t.maxDepth}` });
            continue;
        }
        if (destination === 'display' && t.promptOnlyNguon && !t.markdownOnlyNguon) {
            daBoQua.push({ id: t.id, lyDo: 'chỉ áp vào prompt' });
            continue;
        }
        if (destination === 'prompt' && t.markdownOnlyNguon && !t.promptOnlyNguon) {
            daBoQua.push({ id: t.id, lyDo: 'chỉ áp khi hiển thị' });
            continue;
        }
        const bien = bienRegex(t.pattern);
        if (bien === null) {
            daBoQua.push({ id: t.id, lyDo: 'pattern không biên được hoặc có hình dạng quay lui nguy hiểm' });
            issues.push({
                code: 'REGEX_TU_CHOI',
                severity: 'warning',
                path: t.id,
                message: `Regex "${t.ten}" bị từ chối: cú pháp không hỗ trợ hoặc có lượng từ lồng nhau. Giữ nguyên văn bản.`,
                details: { pattern: t.pattern.slice(0, 120) },
            });
            continue;
        }
        const batDau = dongHo();
        let sau;
        try {
            sau = ra.replace(bien.re, (...args) => {
                const mauThay = t.thayThe.replace(/{{match}}/gi, '$0');
                const daChenNhom = mauThay.replace(/\$(\d+)|\$<([^>]+)>/g, (_raw, so, tenNhom) => {
                    const nhom = args.at(-1);
                    const match = so
                        ? args[Number(so)]
                        : nhom !== null && typeof nhom === 'object'
                            ? nhom[tenNhom]
                            : undefined;
                    if (typeof match !== 'string' || match === '')
                        return '';
                    let loc = match;
                    for (const trim of t.trimStrings)
                        loc = loc.split(trim).join('');
                    return loc;
                });
                return input.thayMacro?.(daChenNhom, t) ?? daChenNhom;
            });
        }
        catch {
            daBoQua.push({ id: t.id, lyDo: 'lỗi khi thay thế' });
            continue;
        }
        const troi = dongHo() - batDau;
        if (troi > maxRegexMs) {
            // [BB] 64.3 — bỏ transform, GIỮ text gốc, ghi chẩn đoán, không làm mất lượt.
            quaCham.push(t.id);
            daBoQua.push({ id: t.id, lyDo: `chạy ${troi} ms, vượt trần ${maxRegexMs} ms` });
            issues.push({
                code: 'REGEX_QUA_CHAM',
                severity: 'warning',
                path: t.id,
                message: `Regex "${t.ten}" chạy ${troi} ms, vượt tuning.preset.maxRegexMs = ${maxRegexMs} ms. ` +
                    'Kết quả bị bỏ, văn bản gốc được giữ, và transform này tắt cho các lượt sau.',
                details: { ms: troi, tran: maxRegexMs },
            });
            continue;
        }
        ra = sau;
        daApDung.push(t.id);
    }
    return { text: ra, daApDung, daBoQua, issues, quaCham };
}
/**
 * Áp regex `promptOnly` lên **chuỗi prompt** trước khi gửi AI.
 *
 * Cùng bộ bảo vệ sandbox (timeout, chặn pattern, max ký tự) nhưng target là
 * prompt thay vì output hiển thị. Chỉ chạy transform có `promptOnlyNguon: true`.
 *
 * [BB] Ranh giới vẫn giữ: transform chỉ chạy trên chuỗi văn bản đã phẳng hóa,
 * KHÔNG chạy trên WorldView, PatchOp hay cấu trúc dữ liệu engine.
 */
export function apPromptTransform(input) {
    const dungChoPrompt = input.transforms;
    if (dungChoPrompt.length === 0) {
        return { text: input.text, daApDung: [], daBoQua: [], issues: [], quaCham: [] };
    }
    return apTransform({ ...input, transforms: dungChoPrompt, destination: 'prompt' });
}
