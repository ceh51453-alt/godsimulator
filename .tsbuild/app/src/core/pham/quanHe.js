import { QuanHeMotChieuSchema } from '../schema/aspect/soul.js';
function hon(e) {
    const a = e?.aspects['soul'];
    return a && typeof a === 'object' ? a : undefined;
}
/** Điều `tuId` đang nghĩ về `denId`. Chưa quen ai thì trả bản mặc định. */
export function quanHeCua(state, tuId, denId) {
    const s = hon(state.entities.get(tuId));
    const co = s?.quanHe?.[denId];
    return co ? QuanHeMotChieuSchema.parse(co) : QuanHeMotChieuSchema.parse({});
}
const kep = (x) => Math.max(-100, Math.min(100, Math.round(x)));
/**
 * Một patch duy nhất đổi điều `tuId` nghĩ về `denId`.
 *
 * Trả mảng để chỗ gọi cứ `push(...)` mà không phải nghĩ; mảng rỗng nghĩa là
 * không có gì đổi.
 */
export function datQuanHe(state, tuId, denId, thayDoi, evId) {
    if (tuId === denId || !state.entities.has(tuId))
        return [];
    const cu = quanHeCua(state, tuId, denId);
    const c = thayDoi.cong ?? {};
    const moi = QuanHeMotChieuSchema.parse({
        thanSo: kep((thayDoi.thanSo ?? cu.thanSo) + (c.thanSo ?? 0)),
        yeuGhet: kep((thayDoi.yeuGhet ?? cu.yeuGhet) + (c.yeuGhet ?? 0)),
        tinNgo: kep((thayDoi.tinNgo ?? cu.tinNgo) + (c.tinNgo ?? 0)),
        noOn: kep((thayDoi.noOn ?? cu.noOn) + (c.noOn ?? 0)),
        anTuong: thayDoi.anTuong ?? cu.anTuong,
        // Giữ ba ký ức chung gần nhất — 11.2 khai `max(3)`, và ba là đủ để nhớ nhau.
        kyUcChungIds: thayDoi.themKyUcId
            ? [...cu.kyUcChungIds.filter((x) => x !== thayDoi.themKyUcId), thayDoi.themKyUcId].slice(-3)
            : [...cu.kyUcChungIds],
        laHuyenThoai: thayDoi.laHuyenThoai ?? cu.laHuyenThoai,
        xungHo: thayDoi.xungHo ?? cu.xungHo,
    });
    return [
        {
            op: 'set',
            target: { table: 'entities', id: tuId, path: `aspects.soul.quanHe.${denId}` },
            value: moi,
            sourceEventId: evId,
        },
    ];
}
/** Những người mà chủ thể này có quan hệ, sắp xếp theo mức đáng nhớ. */
export function nguoiTaQuen(state, chuTheId) {
    const s = hon(state.entities.get(chuTheId));
    const ra = [];
    for (const id of Object.keys(s?.quanHe ?? {}).sort()) {
        const qh = s?.quanHe?.[id];
        if (qh)
            ra.push({ id, qh: QuanHeMotChieuSchema.parse(qh) });
    }
    // Đậm trước nhạt sau: |thân sơ| + |yêu ghét| + |nợ ơn|.
    ra.sort((a, b) => {
        const d = (x) => Math.abs(x.thanSo) + Math.abs(x.yeuGhet) + Math.abs(x.noOn);
        const c = d(b.qh) - d(a.qh);
        return c !== 0 ? c : a.id < b.id ? -1 : 1;
    });
    return Object.freeze(ra);
}
