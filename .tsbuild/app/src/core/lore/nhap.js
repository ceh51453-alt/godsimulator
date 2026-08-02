import { uocLuong } from '../ai/nganSach.js';
import { DAI_ORDER, daiCuaNguon, LorebookEntrySchema, LorebookSchema } from './schema.js';
export const DINH_DANG_LORE = ['sillytavern_v2', 'sillytavern_v3', 'thien_dien_lore', 'khong_ro'];
const laObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
/** Dò định dạng bằng hình dạng — cùng nguyên tắc với 63.2. */
export function doDinhDangLore(goc) {
    if (!laObj(goc))
        return 'khong_ro';
    if (goc['_format'] === 'thien_dien_lore')
        return 'thien_dien_lore';
    if (goc['spec'] === 'lorebook_v3')
        return 'sillytavern_v3';
    const e = goc['entries'];
    if (Array.isArray(e))
        return 'sillytavern_v3';
    if (laObj(e)) {
        const keys = Object.keys(e);
        if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k)))
            return 'sillytavern_v2';
    }
    return 'khong_ro';
}
const chuoi = (v, macDinh = '') => (typeof v === 'string' ? v : macDinh);
const mangChuoi = (v) => Array.isArray(v)
    ? v.filter((x) => typeof x === 'string')
    : typeof v === 'string' && v !== ''
        ? v.split(',').map((s) => s.trim())
        : [];
const so = (v, macDinh) => typeof v === 'number' && Number.isFinite(v) ? v : macDinh;
/**
 * Nhập một lorebook từ JSON đã parse.
 *
 * Không throw, không đọc file, không gọi mạng. `nguon` do người gọi khai: một
 * file người dùng kéo vào luôn là `nguoi_dung` — [BB] 50.10 cấm workflow ghi vào
 * lorebook người dùng, và phân biệt ấy bắt đầu từ đây.
 */
export function nhapLorebook(input) {
    const issues = [];
    const dinhDang = doDinhDangLore(input.goc);
    const tyLeToken = input.tyLeToken ?? 3.2;
    if (dinhDang === 'khong_ro' || !laObj(input.goc)) {
        issues.push({
            code: 'LORE_KHONG_NHAN_RA',
            severity: 'error',
            path: '',
            message: 'Không nhận ra định dạng lorebook. Hỗ trợ: SillyTavern V2 (entries là bản đồ khóa số), ' +
                'SillyTavern V3 (spec hoặc mảng entries) và Thiên Diễn (_format).',
            details: { khoa: laObj(input.goc) ? Object.keys(input.goc).slice(0, 10) : [] },
        });
        return { ok: false, dinhDang, lorebook: null, issues, canDanhSoLai: false, nghiTrungChuDe: [] };
    }
    const tho = (() => {
        const e = input.goc['entries'];
        if (Array.isArray(e))
            return e.filter(laObj);
        if (laObj(e)) {
            return Object.keys(e)
                .sort((a, b) => Number(a) - Number(b))
                .map((k) => e[k])
                .filter(laObj);
        }
        return [];
    })();
    const orderGoc = tho.map((t, i) => so(t['insertion_order'] ?? t['order'], i));
    const trung = orderGoc.length !== new Set(orderGoc).size;
    const lienTuc = orderGoc.every((v, i) => i === 0 || v >= orderGoc[i - 1]);
    const canDanhSoLai = trung || !lienTuc;
    if (canDanhSoLai) {
        issues.push({
            code: 'ORDER_TRUNG_HOAC_LOAN',
            severity: 'warning',
            path: 'entries',
            message: 'Thứ tự `order` bị trùng hoặc không liên tục. Đã dồn về dải của nguồn này, giữ nguyên thứ tự tương đối. ' +
                'Có thể đánh số lại cho gọn.',
            details: { trung, lienTuc },
        });
    }
    const dai = DAI_ORDER[daiCuaNguon(input.nguon)];
    const entries = [];
    tho.forEach((t, i) => {
        const id = chuoi(t['uid'] ?? t['id'], `${input.id}.e${i}`);
        const noiDung = chuoi(t['content'] ?? t['noiDung']);
        const ten = chuoi(t['comment'] ?? t['ten'] ?? t['name'], `entry ${i + 1}`);
        // [BB] 35.3 — `<user>` là LỖI, kèm đề xuất sửa hàng loạt.
        if (/<\s*user\s*>/i.test(noiDung)) {
            issues.push({
                code: 'CU_PHAP_USER_SAI',
                severity: 'error',
                path: id,
                message: `Entry "${ten}" dùng \`<user>\`. Thiên Diễn dùng \`{{user}}\`; \`<user>\` sẽ bị kể ra nguyên văn. ` +
                    'Sửa hàng loạt được ở bước tiếp theo.',
                details: { deXuat: noiDung.replace(/<\s*user\s*>/gi, '{{user}}').slice(0, 200) },
            });
        }
        const loiEjs = kiemEjs(noiDung);
        if (loiEjs !== null) {
            issues.push({
                code: 'EJS_HONG',
                severity: 'error',
                path: id,
                message: `Entry "${ten}": ${loiEjs.thongDiep} (dòng ${loiEjs.dong}).`,
                details: { dong: loiEjs.dong },
            });
        }
        // 51.5 — dồn về dải, giữ thứ tự tương đối.
        const orderMoi = Math.min(dai.den, dai.tu + i);
        if (so(t['insertion_order'] ?? t['order'], -1) >= 0) {
            const cu = so(t['insertion_order'] ?? t['order'], 0);
            if (cu < dai.tu || cu > dai.den) {
                issues.push({
                    code: 'ORDER_NGOAI_DAI',
                    severity: 'info',
                    path: id,
                    message: `order ${cu} nằm ngoài dải ${dai.tu}–${dai.den} của nguồn "${input.nguon}". Đã dồn về ${orderMoi}.`,
                    details: { cu, moi: orderMoi },
                });
            }
        }
        const r = LorebookEntrySchema.safeParse({
            id,
            ten,
            keys: mangChuoi(t['key'] ?? t['keys']),
            secondaryKeys: mangChuoi(t['keysecondary'] ?? t['secondaryKeys']),
            logic: doiLogic(t['selectiveLogic'] ?? t['logic']),
            noiDung,
            lop: t['constant'] === true || t['lop'] === 'loi' ? 'loi' : 'sau',
            order: orderMoi,
            doSau: so(t['depth'] ?? t['doSau'], 4),
            xacSuat: so(t['probability'] ?? t['xacSuat'], 100),
            dinhKem: t['addMemo'] === true || t['dinhKem'] === true,
            deQuy: t['excludeRecursion'] === true ? false : t['deQuy'] === true,
            // Đếm token THẬT bằng tyLeToken đã hiệu chỉnh — 35.3.
            uocLuongToken: uocLuong(noiDung, tyLeToken),
            chuDe: mangChuoi(t['chuDe']),
            doTinCay: input.nguon === 'nguoi_dung' ? 100 : so(t['doTinCay'], 0),
            suKienChongLung: mangChuoi(t['suKienChongLung']),
            khoaCanon: t['khoaCanon'] === true,
        });
        if (!r.success) {
            issues.push({
                code: 'ENTRY_KHONG_HOP_LE',
                severity: 'error',
                path: id,
                message: `Entry "${ten}" không hợp lệ: ${r.error.issues.map((x) => x.message).join('; ')}.`,
                details: {},
            });
            return;
        }
        entries.push(r.data);
    });
    // Trùng chủ đề — cảnh báo, KHÔNG chặn (35.3).
    const nghiTrung = [];
    for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
            const a = entries[i];
            const b = entries[j];
            if (giaoKeys(a, b).length >= 2)
                nghiTrung.push([a.id, b.id]);
        }
    }
    if (nghiTrung.length > 0) {
        issues.push({
            code: 'NGHI_TRUNG_CHU_DE',
            severity: 'warning',
            path: '',
            message: `${nghiTrung.length} cặp entry dùng chung từ hai keyword trở lên. Không chặn; đối soát sẽ xử lý.`,
            details: { cap: nghiTrung.slice(0, 20) },
        });
    }
    const lorebook = LorebookSchema.parse({
        id: input.id,
        branchId: input.branchId ?? '',
        ten: input.ten === '' ? chuoi(input.goc['name'], input.id) : input.ten,
        thanHe: chuoi(input.goc['thanHe']),
        moTa: chuoi(input.goc['description'] ?? input.goc['moTa']),
        bat: false,
        nguon: input.nguon,
        entries,
    });
    return {
        ok: !issues.some((i) => i.severity === 'error'),
        dinhDang,
        lorebook,
        issues,
        canDanhSoLai,
        nghiTrungChuDe: nghiTrung,
    };
}
function doiLogic(v) {
    // SillyTavern: 0 = AND ANY, 1 = NOT ALL, 2 = NOT ANY, 3 = AND ALL.
    if (typeof v === 'number')
        return ['and_any', 'not_all', 'not_any', 'and_all'][v] ?? 'and_any';
    const s = chuoi(v);
    return s === 'and_all' || s === 'not_any' || s === 'not_all' ? s : 'and_any';
}
export function giaoKeys(a, b) {
    const chuan = (s) => s.trim().toLowerCase();
    const tapA = new Set([...a.keys, ...a.secondaryKeys].map(chuan).filter((s) => s !== ''));
    return [...new Set([...b.keys, ...b.secondaryKeys].map(chuan))].filter((k) => k !== '' && tapA.has(k));
}
/**
 * Kiểm cú pháp EJS ở mức cân bằng thẻ — 35.3 "EJS parse được → lỗi thì chỉ rõ
 * entry và dòng".
 *
 * Không biên dịch template ở đây: biên dịch nghĩa là chạy, và nội dung lorebook
 * là dữ liệu không tin cậy. Kiểm cân bằng bắt được đúng lỗi thường gặp (quên
 * `%>`), và phần còn lại do renderer EJS thật báo khi render trong sandbox.
 */
export function kiemEjs(s) {
    let i = 0;
    let dong = 1;
    while (i < s.length) {
        if (s[i] === '\n')
            dong++;
        if (s.startsWith('<%', i)) {
            const ket = s.indexOf('%>', i + 2);
            if (ket < 0)
                return { dong, thongDiep: 'thẻ EJS `<%` không có `%>` đóng' };
            for (let j = i; j < ket; j++)
                if (s[j] === '\n')
                    dong++;
            i = ket + 2;
            continue;
        }
        if (s.startsWith('%>', i))
            return { dong, thongDiep: 'có `%>` mà không có `<%` mở' };
        i++;
    }
    return null;
}
