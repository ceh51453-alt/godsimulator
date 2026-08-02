import { R, napDungSan } from '../registry/index.js';
/** Hệ số truyền bá của một quan hệ. Quan hệ lạ (pack ngoài) coi như 0.5. */
function heSoTruyenBa(quanHe) {
    napDungSan();
    const r = R.relation.lay(quanHe);
    return r?.heSoTruyenBa ?? 0.5;
}
/**
 * Mở rộng từ một tập gốc.
 *
 * Duyệt theo lớp (BFS) chứ không theo điểm: hai hop từ tiêu điểm là hai hop, và
 * một cạnh nặng ở hop 2 không được phép nhảy lên trước một cạnh nhẹ ở hop 1.
 * Nếu ưu tiên theo điểm, một quan hệ `hien_than_cua` (0.95) ở xa sẽ đè bẹp toàn
 * bộ hàng xóm trực tiếp, và tiêu điểm mất nghĩa.
 */
export function moRong(gocIds, opts) {
    const soHop = opts.soHop ?? 2;
    const suyGiam = opts.suyGiamMoiHop ?? 0.55;
    const nguong = opts.nguongTrongSo ?? 15;
    const toiDa = opts.toiDa ?? 200;
    const loc = opts.loaiQuanHe ? new Set(opts.loaiQuanHe) : null;
    const view = opts.view;
    // Kề, dựng một lần. Cạnh đã đứt vẫn đi được nhưng bị dìm — vết sẹo là dữ liệu.
    const ke = new Map();
    for (const lk of view.links) {
        if (loc && !loc.has(lk.quanHe))
            continue;
        const w = lk.daDut ? Math.min(lk.trongSo, nguong) : lk.trongSo;
        if (w < nguong)
            continue;
        const a = ke.get(lk.tuId) ?? [];
        a.push({ den: lk.denId, quanHe: lk.quanHe, trongSo: w });
        ke.set(lk.tuId, a);
        // Đồ thị đi được từ cả hai đầu: 6.1 lưu một chiều, 6.3 nói nó là mạng.
        const b = ke.get(lk.denId) ?? [];
        b.push({ den: lk.tuId, quanHe: lk.quanHe, trongSo: w });
        ke.set(lk.denId, b);
    }
    const tot = new Map();
    const goc = [...new Set(gocIds)].filter((id) => view.entities.has(id)).sort();
    let bien = goc.map((id) => ({
        id,
        diem: 1,
        duong: [id],
    }));
    const daQua = new Set(goc);
    for (let hop = 1; hop <= soHop; hop++) {
        const tiep = [];
        // Sắp theo id để cùng đầu vào cho cùng thứ tự (luật bất biến #7).
        bien.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        for (const n of bien) {
            const canh = (ke.get(n.id) ?? []).slice().sort((a, b) => (a.den < b.den ? -1 : a.den > b.den ? 1 : 0));
            for (const c of canh) {
                const pe = view.entities.get(c.den);
                if (!pe)
                    continue; // [BB] chủ thể không được biết → không tồn tại ở đây
                const diem = n.diem * (c.trongSo / 100) * Math.pow(suyGiam, hop) * heSoTruyenBa(c.quanHe);
                if (diem <= 0)
                    continue;
                const cu = tot.get(c.den);
                if (!cu || diem > cu.diem) {
                    tot.set(c.den, {
                        id: c.den,
                        kind: pe.kind,
                        diem,
                        duongDi: Object.freeze([...n.duong, c.den]),
                    });
                }
                if (!daQua.has(c.den)) {
                    daQua.add(c.den);
                    tiep.push({ id: c.den, diem, duong: [...n.duong, c.den] });
                }
            }
        }
        bien = tiep;
        if (bien.length === 0)
            break;
    }
    for (const id of goc)
        tot.delete(id);
    return Object.freeze([...tot.values()]
        .sort((a, b) => b.diem - a.diem || (a.id < b.id ? -1 : 1))
        .slice(0, toiDa)
        .map((n) => Object.freeze(n)));
}
/** Khoảng cách đồ thị (số hop) từ tiêu điểm — đầu vào `graphDistance` của 77.3. */
export function khoangCachDoThi(mr) {
    const m = new Map();
    for (const n of mr)
        m.set(n.id, Math.max(0, n.duongDi.length - 1));
    return m;
}
