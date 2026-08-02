import { BAN_TINH_TRUC } from '../schema/aspect/soul.js';
import { trangThaiSuyRa } from '../schema/aspect/thanVi.js';
function doc(e, ten) {
    const a = e?.aspects[ten];
    return a === undefined || a === null || typeof a !== 'object' ? undefined : a;
}
/**
 * Độ khớp giữa sắc thái sự kiện và bản tính mà TÍN ĐỒ TIN.
 * Trả 0–1. Đây là chỗ danh tiếng quyết định bạn thắng được cái gì.
 */
export function doKhopTinhCach(sacThai, banTinhTinDoTin) {
    let tong = 0;
    let dem = 0;
    for (const truc of BAN_TINH_TRUC) {
        const s = sacThai[truc];
        if (typeof s !== 'number')
            continue;
        const b = banTinhTinDoTin[truc] ?? 0;
        // Lệch 200 là trái ngược hoàn toàn; lệch 0 là khớp hoàn hảo.
        tong += 1 - Math.min(1, Math.abs(s - b) / 200);
        dem++;
    }
    return dem === 0 ? 0.5 : tong / dem;
}
/**
 * Giải một lượt tranh quy kết.
 *
 * Bốn hệ số lấy từ `tuning.than` — [BB] Phần 7.1, không hằng số nào nằm trong code.
 */
export function giaiQuyKet(state, suKien, tuyen, ctx) {
    const t = ctx.tuning.than;
    const hopLe = [...tuyen]
        .filter((x) => state.entities.has(x.thanId))
        .sort((a, b) => (a.thanId < b.thanId ? -1 : 1));
    if (hopLe.length === 0) {
        return { patches: [], thangId: null, diem: [], loiKe: '', doiTrangThai: [] };
    }
    const diem = [];
    for (const lt of hopLe) {
        const e = state.entities.get(lt.thanId);
        const ven = doc(e, 'venerable');
        const dom = doc(e, 'domain');
        const matDo = suKien.locationId ? (ven?.matDoDen[suKien.locationId] ?? 0) : 0;
        const d = dom?.domains.find((x) => x.ten === lt.domainTen);
        const suc = (d?.suc ?? 0) / 100;
        const khop = doKhopTinhCach(suKien.sacThai, ven?.banTinhTinDoTin ?? {});
        const cuong = Math.max(0, Math.min(100, lt.cuongDo)) / 100;
        const xacSuat = t.quyKetMatDoDen * Math.min(1, matDo) +
            t.quyKetDomainStrength * suc +
            t.quyKetDoKhopTinhCach * khop +
            t.quyKetCuongDoTuyen * cuong;
        diem.push({ thanId: lt.thanId, xacSuat: Math.round(xacSuat * 10000) / 10000 });
    }
    // [BB] 23.2 quy tắc 2 — softmax, không lấy max. Phàm nhân đôi khi tin nhầm,
    // và chuyện tin nhầm mới là chỗ lịch sử tôn giáo sinh ra.
    const i = ctx.rng.softmax(diem.map((x) => x.xacSuat * 100), ctx.tuning.npc.nhietDoSoftmax * 100);
    const thang = diem[i] ?? diem[0];
    if (!thang)
        return { patches: [], thangId: null, diem, loiKe: '', doiTrangThai: [] };
    const patches = [];
    const doiTrangThai = [];
    for (const lt of hopLe) {
        const e = state.entities.get(lt.thanId);
        const dom = doc(e, 'domain');
        if (!dom)
            continue;
        const idx = dom.domains.findIndex((x) => x.ten === lt.domainTen);
        if (idx < 0)
            continue;
        const d = dom.domains[idx];
        const laThang = lt.thanId === thang.thanId;
        const doiThu = hopLe.filter((x) => x.thanId !== lt.thanId).map((x) => x.thanId);
        // Thắng thì lên, thua thì xuống. Không ai bị trừ máu — chỉ bị quên dần.
        const sucMoi = Math.max(0, Math.min(100, d.suc + (laThang ? 6 : -4)));
        const moi = {
            ...d,
            suc: sucMoi,
            doiThuIds: doiThu,
            tickDoiTrangThai: ctx.tick,
        };
        const trangThaiMoi = trangThaiSuyRa(moi);
        if (trangThaiMoi !== d.trangThai) {
            doiTrangThai.push({ thanId: lt.thanId, domain: d.ten, tu: d.trangThai, den: trangThaiMoi });
        }
        patches.push({
            op: 'set',
            target: { table: 'entities', id: lt.thanId, path: `aspects.domain.domains.${idx}` },
            value: { ...moi, trangThai: trangThaiMoi },
            sourceEventId: ctx.eventId,
        });
    }
    // Link quy kết: sự kiện thuộc về vị thần thắng, và cái link đó ở lại mãi.
    const lkId = `lk_qk_${suKien.id}_${thang.thanId}`;
    if (!state.links.has(lkId)) {
        patches.push({
            op: 'link',
            target: { table: 'links', id: lkId, path: '' },
            value: {
                id: lkId,
                branchId: state.world.branchId,
                tuId: suKien.locationId ?? thang.thanId,
                denId: thang.thanId,
                quanHe: 'quy_ket_cho',
                trongSo: Math.round(thang.xacSuat * 100),
                tickTao: ctx.tick,
                tickDut: null,
                nguon: 'engine',
            },
            sourceEventId: ctx.eventId,
        });
    }
    const tenThang = state.entities.get(thang.thanId)?.ten ?? thang.thanId;
    const loiKe = hopLe.length > 1
        ? `${hopLe.length} vị thần cùng nhận ${suKien.moTa}. Người ta tin ${tenThang}.`
        : `Người ta bảo ${suKien.moTa} là do ${tenThang}.`;
    return { patches, thangId: thang.thanId, diem, loiKe, doiTrangThai };
}
/**
 * Rà lại vòng đời domain của một vị thần.
 *
 * [BB] 69.4 — `suc = 0` KHÔNG còn đồng nghĩa mất vĩnh viễn. Chỉ khi mọi neo
 * (vật mang, ký ức, link, luật tiếp địa, nghi thức, di sản) đều đứt thì domain
 * mới `lost`. Còn một neo thì nó là `reclaimable`, và lấy lại phải là một
 * Project có điều kiện chứ không phải một nút cộng điểm.
 */
export function raSoatDomain(state, thanId, ctx) {
    const e = state.entities.get(thanId);
    const dom = doc(e, 'domain');
    const patches = [];
    const doi = [];
    if (!dom)
        return { patches, doi };
    dom.domains.forEach((d, idx) => {
        // Neo còn sống là neo trỏ tới thứ còn tồn tại trong thế giới.
        const neoSong = d.neoTaiChiem.filter((n) => state.entities.has(n.refId) || state.links.has(n.refId) || n.loai === 'ky_uc');
        const moi = { ...d, neoTaiChiem: neoSong };
        const den = trangThaiSuyRa(moi);
        if (den === d.trangThai && neoSong.length === d.neoTaiChiem.length)
            return;
        doi.push({ domain: d.ten, tu: d.trangThai, den });
        patches.push({
            op: 'set',
            target: { table: 'entities', id: thanId, path: `aspects.domain.domains.${idx}` },
            value: { ...moi, trangThai: den, tickDoiTrangThai: ctx.tick },
            sourceEventId: ctx.eventId,
        });
    });
    return { patches, doi };
}
