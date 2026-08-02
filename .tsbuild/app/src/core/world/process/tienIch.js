/**
 * Phần kho mà mỗi tiến trình được rút trong MỘT lần chạy.
 *
 * Vì sao phải khai chung một chỗ: `production_consumption`, `exchange_debt` và
 * `institution_governance` nằm cùng một cụm phụ thuộc vòng (xem `chiaGiaiDoan`),
 * nên cả ba tính phần mình từ **cùng một ảnh chụp**. Mỗi bên tưởng kho còn đầy.
 * Nếu tổng ba phần vượt 1 thì kho âm — và bất biến sẽ bắt, nhưng bắt xong thì
 * một tiến trình bị bỏ và thế giới mất một mùa vô cớ.
 *
 * Trần này cũng đúng về mặt thế giới: phần kho không ai được đụng tới chính là
 * **thóc giống**. Xã hội nông nghiệp nào cũng có nó, và ăn vào nó là dấu hiệu
 * của nạn đói thật sự chứ không phải của một mùa kém.
 *
 * `phanKhoHopLe()` canh bất biến này; có test riêng.
 */
export const PHAN_KHO = Object.freeze({
    /** Ăn: phần lớn nhất, nhưng không tới thóc giống. */
    an: 0.75,
    /** Thương đoàn chở đi. */
    traoDoi: 0.1,
    /** Thuế. */
    thue: 0.1,
});
/** Tổng ba phần phải nhỏ hơn 1, nếu không kho có thể âm ngay cả khi không ai sai. */
export function phanKhoHopLe() {
    return PHAN_KHO.an + PHAN_KHO.traoDoi + PHAN_KHO.thue < 1;
}
/** Bốn chữ số sau dấu phẩy là đủ cho mọi đại lượng của thế giới này. */
export const SO_LE = 4;
export function lam(x, le = SO_LE) {
    if (!Number.isFinite(x))
        return 0;
    const he = 10 ** le;
    return Math.round(x * he) / he;
}
/** Kẹp vào khoảng. Dùng ở mọi chỗ ghi một trường có `min`/`max` trong schema. */
export function kep(x, lo, hi) {
    if (!Number.isFinite(x))
        return lo;
    return x < lo ? lo : x > hi ? hi : x;
}
/** Id entity theo thứ tự codepoint — [BB] luật bất biến #7, không dùng locale sort. */
export function idSapXep(state) {
    return [...state.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
export function docAspect(e, ten) {
    const a = e?.aspects[ten];
    return a === undefined || a === null || typeof a !== 'object' ? undefined : a;
}
export function moiNoiChon(state) {
    const ra = [];
    for (const id of idSapXep(state)) {
        const e = state.entities.get(id);
        if (!e || e.kind !== 'place' || e.tickDiet !== null)
            continue;
        if (e.aspects['dan_cu'] === undefined)
            continue;
        ra.push({ id, e });
    }
    return ra;
}
/** Mọi tuyến đường thông suốt, đã sắp xếp. */
export function moiTuyenDuong(state) {
    const ra = [];
    for (const id of idSapXep(state)) {
        const e = state.entities.get(id);
        if (!e || e.kind !== 'route' || e.tickDiet !== null)
            continue;
        const d = docAspect(e, 'duong');
        if (!d)
            continue;
        ra.push({ id, d });
    }
    return ra;
}
export function langGieng(state, noiId) {
    const ra = [];
    for (const { id, d } of moiTuyenDuong(state)) {
        if (!d.thongSuot)
            continue;
        const kia = d.tuId === noiId ? d.denId : d.denId === noiId ? d.tuId : null;
        if (kia === null)
            continue;
        // Đường tốt đi nhanh hơn, nhưng không bao giờ nhanh hơn một tick.
        const heSo = 1 + (100 - kep(d.chatLuong, 0, 100)) / 100;
        ra.push({ noiId: kia, duongId: id, doTre: Math.max(1, Math.ceil(d.doDai * heSo)) });
    }
    return ra.sort((a, b) => (a.noiId < b.noiId ? -1 : a.noiId > b.noiId ? 1 : 0));
}
// ─────────────────────────────────────────── dựng patch
export function dat(nc, id, path, value) {
    return { op: 'set', target: { table: 'entities', id, path }, value, sourceEventId: nc.eventId };
}
export function cong(nc, id, path, value) {
    return { op: 'add', target: { table: 'entities', id, path }, value: lam(value), sourceEventId: nc.eventId };
}
export function datBang(nc, table, id, path, value) {
    return { op: 'set', target: { table, id, path }, value, sourceEventId: nc.eventId };
}
export function taoBanGhi(nc, table, id, banGhi) {
    return { op: 'link', target: { table, id, path: '' }, value: banGhi, sourceEventId: nc.eventId };
}
export function tongCohort(c) {
    if (!c)
        return 0;
    return c.child + c.youth + c.adult + c.elder;
}
/** Lao động thật: người lớn tính đủ, thanh niên nửa, trẻ và già không tính. */
export function laoDong(c) {
    if (!c)
        return 0;
    return c.adult + c.youth * 0.5;
}
/**
 * Rút `n` đơn vị khỏi một chuỗi bể, theo thứ tự cho trước.
 * Trả về lượng rút được thật — KHÔNG BAO GIỜ rút quá số đang có.
 * Đây là chỗ ngăn "vật chất từ trên trời rơi xuống" ngay tại nguồn.
 */
export function rutDan(be, n) {
    const lay = be.map(() => 0);
    let con = Math.max(0, n);
    for (let i = 0; i < be.length && con > 0; i++) {
        const co = Math.max(0, be[i]);
        const l = Math.min(co, con);
        lay[i] = l;
        con -= l;
    }
    return { lay, tong: lay.reduce((t, x) => t + x, 0) };
}
