import { loi } from '../contracts/errors.js';
import { dat, hong } from '../contracts/errors.js';
/** Độ sâu tối đa của cây biểu thức — chặn stack overflow từ dữ liệu độc hại. */
export const DO_SAU_TOI_DA = 32;
/**
 * Đọc theo đường dẫn chấm. Chặn `__proto__`, `constructor`, `prototype`.
 * Trả `undefined` nếu đường dẫn không tới đâu — KHÔNG throw.
 */
export function docDuongDan(goc, duongDan) {
    if (duongDan === '')
        return goc;
    let hienTai = goc;
    for (const phan of duongDan.split('.')) {
        if (phan === '__proto__' || phan === 'constructor' || phan === 'prototype')
            return undefined;
        if (hienTai === null || hienTai === undefined)
            return undefined;
        if (typeof hienTai !== 'object')
            return undefined;
        if (Array.isArray(hienTai)) {
            const i = Number(phan);
            if (!Number.isInteger(i) || i < 0 || i >= hienTai.length)
                return undefined;
            hienTai = hienTai[i];
            continue;
        }
        if (hienTai instanceof Map) {
            hienTai = hienTai.get(phan);
            continue;
        }
        if (!Object.prototype.hasOwnProperty.call(hienTai, phan))
            return undefined;
        hienTai = hienTai[phan];
    }
    return hienTai;
}
/** So sánh chặt, không ép kiểu ngầm. `NaN` không bằng chính nó. */
function bang(a, b) {
    if (typeof a === 'number' && typeof b === 'number')
        return a === b;
    if (a === null && b === null)
        return true;
    if (typeof a !== typeof b)
        return false;
    return a === b;
}
/** So sánh thứ tự. Chỉ số và chuỗi; chuỗi so theo codepoint, không theo locale. */
function soSanh(a, b) {
    if (typeof a === 'number' && typeof b === 'number') {
        if (Number.isNaN(a) || Number.isNaN(b))
            return null;
        return a < b ? -1 : a > b ? 1 : 0;
    }
    if (typeof a === 'string' && typeof b === 'string') {
        return a < b ? -1 : a > b ? 1 : 0;
    }
    return null;
}
function laThat(v) {
    return v === true;
}
/**
 * Tính một ExprNode. Không throw — mọi lỗi trả về dạng có cấu trúc.
 * `nguon` là gốc để `read` đi theo đường dẫn.
 */
export function tinhExpr(node, nguon, doSau = 0) {
    if (doSau > DO_SAU_TOI_DA) {
        return hong([
            loi('schema', 'EXPR_TOO_DEEP', `Biểu thức sâu quá ${DO_SAU_TOI_DA} tầng.`, { recoverable: false }),
        ]);
    }
    const args = node.args ?? [];
    const tinhCon = (i) => {
        const con = args[i];
        if (!con) {
            return hong([loi('schema', 'EXPR_MISSING_ARG', `Toán tử '${node.op}' thiếu tham số thứ ${i + 1}.`)]);
        }
        return tinhExpr(con, nguon, doSau + 1);
    };
    const tinhHet = () => {
        const ra = [];
        const canhBao = [];
        for (let i = 0; i < args.length; i++) {
            const r = tinhCon(i);
            if (!r.ok)
                return hong(r.errors, [...canhBao, ...r.warnings]);
            canhBao.push(...r.warnings);
            ra.push(r.value);
        }
        return dat(ra, canhBao);
    };
    switch (node.op) {
        case 'literal':
            return dat(node.value);
        case 'read':
            return dat(docDuongDan(nguon, node.path ?? ''));
        case 'not': {
            const r = tinhCon(0);
            if (!r.ok)
                return r;
            return dat(!laThat(r.value));
        }
        case 'and': {
            // Ngắn mạch — vẫn deterministic, chỉ bỏ qua nhánh không cần tính.
            for (let i = 0; i < args.length; i++) {
                const r = tinhCon(i);
                if (!r.ok)
                    return r;
                if (!laThat(r.value))
                    return dat(false);
            }
            return dat(true);
        }
        case 'or': {
            for (let i = 0; i < args.length; i++) {
                const r = tinhCon(i);
                if (!r.ok)
                    return r;
                if (laThat(r.value))
                    return dat(true);
            }
            return dat(false);
        }
        case 'eq':
        case 'neq': {
            const r = tinhHet();
            if (!r.ok)
                return r;
            if (r.value.length < 2) {
                return hong([loi('schema', 'EXPR_MISSING_ARG', `'${node.op}' cần hai tham số.`)]);
            }
            const b = bang(r.value[0], r.value[1]);
            return dat(node.op === 'eq' ? b : !b, r.warnings);
        }
        case 'gt':
        case 'gte':
        case 'lt':
        case 'lte': {
            const r = tinhHet();
            if (!r.ok)
                return r;
            if (r.value.length < 2) {
                return hong([loi('schema', 'EXPR_MISSING_ARG', `'${node.op}' cần hai tham số.`)]);
            }
            const c = soSanh(r.value[0], r.value[1]);
            if (c === null) {
                // So sánh kiểu không so được → false, kèm cảnh báo. Không làm sập lượt chơi.
                return dat(false, [
                    ...r.warnings,
                    loi('schema', 'EXPR_INCOMPARABLE', `Không so sánh được hai giá trị bằng '${node.op}'.`, {
                        severity: 'warning',
                    }),
                ]);
            }
            const ok = node.op === 'gt' ? c > 0 : node.op === 'gte' ? c >= 0 : node.op === 'lt' ? c < 0 : c <= 0;
            return dat(ok, r.warnings);
        }
        case 'in': {
            const r = tinhHet();
            if (!r.ok)
                return r;
            if (r.value.length < 2) {
                return hong([loi('schema', 'EXPR_MISSING_ARG', "'in' cần hai tham số.")]);
            }
            const [kim, dong] = r.value;
            if (Array.isArray(dong))
                return dat(dong.some((x) => bang(x, kim)), r.warnings);
            if (dong instanceof Set) {
                for (const x of dong)
                    if (bang(x, kim))
                        return dat(true, r.warnings);
                return dat(false, r.warnings);
            }
            if (typeof dong === 'string' && typeof kim === 'string')
                return dat(dong.includes(kim), r.warnings);
            return dat(false, [
                ...r.warnings,
                loi('schema', 'EXPR_IN_NOT_COLLECTION', "Tham số thứ hai của 'in' không phải tập hợp.", {
                    severity: 'warning',
                }),
            ]);
        }
        default: {
            // Không thể tới đây nếu schema đã parse, nhưng vẫn phải an toàn.
            const opLa = node.op;
            return hong([
                loi('schema', 'EXPR_UNKNOWN_OP', `Toán tử không hợp lệ: '${opLa}'.`, { recoverable: false }),
            ]);
        }
    }
}
/** Rút gọn: tính rồi ép về boolean. Lỗi hoặc không phải boolean → false. */
export function dieuKienDung(node, nguon) {
    const r = tinhExpr(node, nguon);
    return r.ok && laThat(r.value);
}
