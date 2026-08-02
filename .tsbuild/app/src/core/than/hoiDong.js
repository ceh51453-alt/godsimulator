import { GheSchema, NghiQuyetSchema, coPhieu, demPhieu } from '../schema/aspect/hoiDong.js';
import { dat, hong, loi } from '../contracts/errors.js';
function docAspect(e, ten) {
    const a = e.aspects[ten];
    return a === undefined || a === null ? undefined : a;
}
const set = (id, path, value, evId) => ({
    op: 'set',
    target: { table: 'entities', id, path },
    value,
    sourceEventId: evId,
});
/** Thần hệ nào có hội đồng — sắp xếp deterministic. */
export function moiHoiDong(state) {
    const ra = [];
    for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const e = state.entities.get(id);
        if (!e || e.tickDiet !== null)
            continue;
        const hd = docAspect(e, 'hoi_dong');
        if (hd)
            ra.push({ id, e, hd });
    }
    return ra;
}
/**
 * Trọng số tiếng nói của một vị thần trong hội đồng.
 *
 * Không chuẩn hóa về 0–1: con số thô so được giữa các vị thần, và đó là tất cả
 * những gì `demPhieu` cần. Chuẩn hóa ở đây chỉ giấu đi khoảng cách thật.
 */
export function tiengNoiCua(state, thanId) {
    const e = state.entities.get(thanId);
    if (!e || e.tickDiet !== null)
        return 0;
    const ven = docAspect(e, 'venerable');
    const dom = docAspect(e, 'domain');
    const den = Object.values(ven?.matDoDen ?? {}).filter((m) => m > 0).length;
    const sucDomain = (dom?.domains ?? []).reduce((t, d) => t + d.suc, 0);
    return Math.round(Math.min(200, ven?.soTinDoUocLuong ?? 0) * 0.5 + den * 10 + sucDomain * 0.6);
}
// ─────────────────────────────────────────── kết nạp
export function ketNap(state, thanHeId, thanId, nc) {
    const the = state.entities.get(thanHeId);
    const hd = the ? docAspect(the, 'hoi_dong') : undefined;
    const than = state.entities.get(thanId);
    if (!the || !hd)
        return hong([loi('intent', 'KHONG_CO_HOI_DONG', 'Thần hệ này chưa có hội đồng.')]);
    if (!than || than.kind !== 'deity') {
        return hong([loi('intent', 'KHONG_PHAI_THAN', 'Chỉ một vị thần mới vào hội đồng được.')]);
    }
    if (hd.ghe.some((g) => g.thanId === thanId && g.vai !== 'bi_truc_xuat')) {
        return hong([loi('intent', 'DA_CO_GHE', `${than.ten} đã có ghế rồi.`, { recoverable: true })]);
    }
    const ghe = GheSchema.parse({ thanId, vai: 'thanh_vien', tickNhanGhe: nc.tick, uyTin: 50 });
    const con = hd.ghe.filter((g) => g.thanId !== thanId);
    return dat({
        patches: [set(thanHeId, 'aspects.hoi_dong.ghe', [...con, ghe], nc.eventId)],
        loiKe: `${than.ten} được nhận vào hội đồng ${the.ten}. Từ giờ những gì hội đồng quyết cũng là chuyện của họ.`,
    });
}
export function trucXuat(state, thanHeId, thanId, lyDo, nc) {
    const the = state.entities.get(thanHeId);
    const hd = the ? docAspect(the, 'hoi_dong') : undefined;
    if (!the || !hd)
        return hong([loi('intent', 'KHONG_CO_HOI_DONG', 'Thần hệ này chưa có hội đồng.')]);
    const idx = hd.ghe.findIndex((g) => g.thanId === thanId);
    if (idx < 0)
        return hong([loi('intent', 'KHONG_CO_GHE', 'Vị thần này không có ghế nào để mất.')]);
    const patches = [set(thanHeId, `aspects.hoi_dong.ghe.${idx}.vai`, 'bi_truc_xuat', nc.eventId)];
    // Đuổi người ngồi ghế đầu thì ghế đầu trống — và đó là lúc kế vị bắt đầu.
    if (hd.ghe[idx]?.vai === 'chu_tich') {
        patches.push(set(thanHeId, 'aspects.hoi_dong.tickGheDauTrong', nc.tick, nc.eventId));
    }
    const ten = state.entities.get(thanId)?.ten ?? thanId;
    return dat({ patches, loiKe: `Hội đồng ${the.ten} đuổi ${ten}: ${lyDo}` });
}
// ─────────────────────────────────────────── nghị quyết
export function moNghiQuyet(state, thanHeId, nq, nc) {
    const the = state.entities.get(thanHeId);
    const hd = the ? docAspect(the, 'hoi_dong') : undefined;
    if (!the || !hd)
        return hong([loi('intent', 'KHONG_CO_HOI_DONG', 'Thần hệ này chưa có hội đồng.')]);
    const ban = NghiQuyetSchema.parse({
        id: nq.id,
        loai: nq.loai,
        noiDung: nq.noiDung,
        veThanIds: [...nq.veThanIds],
        tickMo: nc.tick,
        phieu: {},
        ketQua: 'dang_ban',
    });
    return dat({
        patches: [
            {
                op: 'push',
                target: { table: 'entities', id: thanHeId, path: 'aspects.hoi_dong.nghiQuyet' },
                value: ban,
                sourceEventId: nc.eventId,
            },
        ],
        loiKe: `Hội đồng ${the.ten} mở một cuộc bàn: ${nq.noiDung}`,
    });
}
export function boPhieu(state, thanHeId, nghiQuyetId, thanId, phieu, nc) {
    const the = state.entities.get(thanHeId);
    const hd = the ? docAspect(the, 'hoi_dong') : undefined;
    if (!the || !hd)
        return hong([loi('intent', 'KHONG_CO_HOI_DONG', 'Thần hệ này chưa có hội đồng.')]);
    const idx = hd.nghiQuyet.findIndex((n) => n.id === nghiQuyetId);
    const nq = idx >= 0 ? hd.nghiQuyet[idx] : undefined;
    if (!nq || idx < 0)
        return hong([loi('intent', 'KHONG_CO_NGHI_QUYET', 'Không có nghị quyết đó.')]);
    if (nq.ketQua !== 'dang_ban') {
        return hong([loi('intent', 'DA_DONG', 'Cuộc bàn này đã khép.', { recoverable: true })]);
    }
    const ghe = hd.ghe.find((g) => g.thanId === thanId);
    if (!ghe || !coPhieu(ghe)) {
        return hong([loi('intent', 'KHONG_CO_PHIEU', 'Vị thần này không có phiếu trong hội đồng.')]);
    }
    const moi = { ...nq, phieu: { ...nq.phieu, [thanId]: phieu } };
    const ketQua = demPhieu(hd, moi);
    const patches = [
        set(thanHeId, `aspects.hoi_dong.nghiQuyet.${idx}.phieu.${thanId}`, phieu, nc.eventId),
    ];
    if (ketQua !== 'dang_ban') {
        patches.push(set(thanHeId, `aspects.hoi_dong.nghiQuyet.${idx}.ketQua`, ketQua, nc.eventId));
        patches.push(set(thanHeId, `aspects.hoi_dong.nghiQuyet.${idx}.tickDong`, nc.tick, nc.eventId));
    }
    const ten = state.entities.get(thanId)?.ten ?? thanId;
    return dat({
        patches,
        ketQua,
        loiKe: ketQua === 'dang_ban'
            ? `${ten} bỏ phiếu ${phieu === 'thuan' ? 'thuận' : phieu === 'chong' ? 'chống' : 'trắng'}.`
            : ketQua === 'thong_qua'
                ? `Hội đồng thông qua: ${nq.noiDung}`
                : ketQua === 'bac_bo'
                    ? `Hội đồng bác bỏ: ${nq.noiDung}`
                    : `Không đủ thần tới bàn. Chuyện "${nq.noiDung}" treo lại.`,
    });
}
/**
 * Ai có cửa ngồi ghế đầu, theo luật kế vị của chính thần hệ ấy.
 *
 * Trả về danh sách chứ không trả về một người: kế vị là một tình huống, và tình
 * huống chỉ có nghĩa khi có nhiều hơn một câu trả lời hợp lý.
 */
export function ungVienKeVi(state, thanHeId) {
    const the = state.entities.get(thanHeId);
    const hd = the ? docAspect(the, 'hoi_dong') : undefined;
    if (!the || !hd || hd.luatKeVi === 'khong_co')
        return [];
    const ra = [];
    for (const g of hd.ghe) {
        if (g.vai === 'bi_truc_xuat' || g.vai === 'khach' || g.vai === 'chu_tich')
            continue;
        const e = state.entities.get(g.thanId);
        if (!e || e.tickDiet !== null)
            continue;
        const tiengNoi = tiengNoiCua(state, g.thanId);
        if (hd.luatKeVi === 'chi_dinh') {
            const duocChon = hd.keThuaChiDinhId === g.thanId;
            ra.push({
                thanId: g.thanId,
                ten: e.ten,
                diem: duocChon ? 1000 : 0,
                vi: duocChon ? 'được người ngồi ghế đầu chỉ định' : 'không được chỉ định',
            });
            continue;
        }
        if (hd.luatKeVi === 'manh_nhat') {
            ra.push({
                thanId: g.thanId,
                ten: e.ten,
                diem: tiengNoi,
                vi: `thế giới quy cho ${tiengNoi} phần thẩm quyền`,
            });
            continue;
        }
        if (hd.luatKeVi === 'huyet_thong') {
            // Huyết thống trong thần điện là quan hệ `sinh_ra_tu` với người ngồi ghế đầu cũ.
            const cha = hd.ghe.find((x) => x.vai === 'chu_tich')?.thanId ?? null;
            const laCon = cha !== null &&
                [...state.links.values()].some((lk) => lk.tickDut === null && lk.tuId === g.thanId && lk.denId === cha && lk.quanHe === 'sinh_ra_tu');
            ra.push({
                thanId: g.thanId,
                ten: e.ten,
                diem: (laCon ? 500 : 0) + g.uyTin,
                vi: laCon ? 'sinh ra từ vị ngồi ghế đầu' : 'không cùng huyết thống',
            });
            continue;
        }
        // bau_phieu: uy tín trong hội đồng cộng tiếng nói ngoài đời.
        ra.push({
            thanId: g.thanId,
            ten: e.ten,
            diem: g.uyTin * 2 + tiengNoi,
            vi: `uy tín ${g.uyTin} trong hội đồng, ${tiengNoi} phần thẩm quyền ngoài đời`,
        });
    }
    ra.sort((a, b) => (b.diem !== a.diem ? b.diem - a.diem : a.thanId < b.thanId ? -1 : 1));
    return Object.freeze(ra);
}
/**
 * Ghế đầu bỏ trống — mở tình huống kế vị.
 *
 * Gọi khi vị ngồi ghế đầu chết, bị đuổi, hoặc tự rút. KHÔNG tự chọn người mới:
 * ghế trống là nội dung, và lấp nó ngay trong cùng một tick là bỏ phí toàn bộ
 * cái hay của việc một vị thần chết đi.
 */
export function boTrongGheDau(state, thanHeId, nc) {
    const the = state.entities.get(thanHeId);
    const hd = the ? docAspect(the, 'hoi_dong') : undefined;
    if (!the || !hd)
        return hong([loi('intent', 'KHONG_CO_HOI_DONG', 'Thần hệ này chưa có hội đồng.')]);
    const idx = hd.ghe.findIndex((g) => g.vai === 'chu_tich');
    const patches = [set(thanHeId, 'aspects.hoi_dong.tickGheDauTrong', nc.tick, nc.eventId)];
    if (idx >= 0)
        patches.push(set(thanHeId, `aspects.hoi_dong.ghe.${idx}.vai`, 'thanh_vien', nc.eventId));
    const ung = ungVienKeVi(state, thanHeId);
    return dat({
        patches,
        ungVien: ung,
        loiKe: `Ghế đầu của ${the.ten} bỏ trống: ${nc.lyDo}. ` +
            (ung.length === 0
                ? 'Không ai đủ tư cách ngồi vào, và thần điện im lặng theo một cách rất mới.'
                : `${ung.length} vị có cửa, và không ai trong số họ chịu nói ra điều đó trước.`),
    });
}
/** Trao ghế đầu. Chỉ gọi sau khi nghị quyết `cong_nhan_ke_vi` đã thông qua. */
export function traoGheDau(state, thanHeId, thanId, nc) {
    const the = state.entities.get(thanHeId);
    const hd = the ? docAspect(the, 'hoi_dong') : undefined;
    if (!the || !hd)
        return hong([loi('intent', 'KHONG_CO_HOI_DONG', 'Thần hệ này chưa có hội đồng.')]);
    const idx = hd.ghe.findIndex((g) => g.thanId === thanId);
    if (idx < 0)
        return hong([loi('intent', 'KHONG_CO_GHE', 'Người này không có ghế trong hội đồng.')]);
    if (hd.ghe[idx]?.vai === 'bi_truc_xuat') {
        return hong([loi('intent', 'DA_BI_DUOI', 'Kẻ bị đuổi không quay lại ngồi ghế đầu được.')]);
    }
    const patches = [
        set(thanHeId, `aspects.hoi_dong.ghe.${idx}.vai`, 'chu_tich', nc.eventId),
        set(thanHeId, `aspects.hoi_dong.ghe.${idx}.tickNhanGhe`, nc.tick, nc.eventId),
        set(thanHeId, 'aspects.hoi_dong.tickGheDauTrong', null, nc.eventId),
    ];
    const ten = state.entities.get(thanId)?.ten ?? thanId;
    return dat({ patches, loiKe: `${ten} ngồi vào ghế đầu của ${the.ten}.` });
}
