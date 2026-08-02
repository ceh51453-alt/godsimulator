import { apDungEvent, taoEvent } from '../../engine/transaction.js';
import { loi } from '../../contracts/errors.js';
import { dat, hong } from '../../contracts/errors.js';
import { chayTienTrinhNen } from './scheduler.js';
import { TICK_MOI_NAM } from '../../schema/aspect/substrate.js';
/**
 * Bao nhiêu tick truyện gộp vào một bước engine, theo nhịp của 24.2.
 *
 * `nhat` không gộp: nhịp ngày là nhịp của cảnh, và cảnh thì phải chạy từng bước.
 */
export const TICK_MOI_BUOC = Object.freeze({
    nhat: 1,
    nien: 1,
    the_dai: TICK_MOI_NAM * 10,
    vinh_kiep: TICK_MOI_NAM * 100,
});
/** Điều kiện dừng engine tự tính được — tập con của bảng 47.3. */
export const DIEU_KIEN_DUNG = [
    'su_kien_trong_dai',
    'dan_so_sup_do',
    'chien_su_bung_no',
    'dich_lan_rong',
    'reality_tut_qua_20',
    'the_gioi_trong_rong',
];
function chonMocDung(suKien, tick, bat) {
    const co = (d) => bat.includes(d);
    for (const sk of suKien) {
        if (sk.loai === 'sup_do_dan_so' && co('dan_so_sup_do')) {
            return { dieuKien: 'dan_so_sup_do', tick, moTa: sk.moTa, suKien: sk };
        }
        if (sk.loai === 'xung_dot_bung_no' && co('chien_su_bung_no')) {
            return { dieuKien: 'chien_su_bung_no', tick, moTa: sk.moTa, suKien: sk };
        }
        if (sk.loai === 'dich_lan_rong' && co('dich_lan_rong')) {
            return { dieuKien: 'dich_lan_rong', tick, moTa: sk.moTa, suKien: sk };
        }
        if (sk.mucDo === 'trong_dai' && co('su_kien_trong_dai')) {
            return { dieuKien: 'su_kien_trong_dai', tick, moTa: sk.moTa, suKien: sk };
        }
    }
    return null;
}
/**
 * Tua thời gian.
 *
 * `state` bị sửa TẠI CHỖ qua `apDungEvent` — tức là vẫn đi đúng cửa duy nhất của
 * luật bất biến #4. Không có đường tắt nào ở đây.
 */
export function tuaThoiGian(state, log, tc) {
    const tickDau = state.world.tick;
    const buocGop = Math.max(1, TICK_MOI_BUOC[tc.nhip]);
    const smart = tc.smartStop !== false;
    const bat = tc.dieuKien ?? DIEU_KIEN_DUNG;
    const tienTo = tc.tienToEvent ?? 'ev_tua';
    const soBuocMuon = Math.ceil(Math.max(0, tc.soTick) / buocGop);
    const tran = tc.tuning.worldProcess.maxCatchUpSteps;
    if (soBuocMuon > tran) {
        // [BB] 71.6 — thà từ chối tử tế còn hơn treo trình duyệt. Người chơi đổi
        // nhịp thô hơn là chạy được ngay.
        return hong([
            loi('invariant', 'TUA_VUOT_NGAN_SACH', `Tua ${tc.soTick} tick ở nhịp '${tc.nhip}' cần ${soBuocMuon} bước engine, ` +
                `vượt trần ${tran}. Hãy chọn nhịp thô hơn (the_dai / vinh_kiep) hoặc tua ngắn lại.`, { details: { soBuocMuon, tran, nhip: tc.nhip }, recoverable: true }),
        ]);
    }
    const events = [];
    const suKienTatCa = [];
    const chanDoan = [];
    const canhBao = [];
    const realityDau = state.metrics.realityIntegrity;
    let soBuocEngine = 0;
    let dung = null;
    for (let i = 0; i < soBuocMuon; i++) {
        const tickMoi = state.world.tick + buocGop;
        const eventId = `${tienTo}_${state.world.branchId}_${tickMoi}`;
        const kq = chayTienTrinhNen(state, {
            tick: tickMoi,
            eventId,
            tuning: tc.tuning,
            soBuocGop: buocGop,
            // Xa ống kính thì chạy macro — đây là chỗ 71.3 gặp 71.6.
            phanGiai: buocGop > 1 ? 'macro' : undefined,
        });
        soBuocEngine++;
        chanDoan.push(...kq.chanDoan);
        suKienTatCa.push(...kq.suKien);
        const ev = taoEvent({
            id: eventId,
            branchId: state.world.branchId,
            tick: tickMoi,
            loai: 'tua_thoi_gian',
            actorIds: [],
            targetIds: [],
            causeEventIds: [],
            locationId: null,
            patches: [...kq.patches],
            visibility: 'engine',
            source: 'engine',
            payload: {
                nhip: tc.nhip,
                soBuocGop: buocGop,
                soPatch: kq.patches.length,
                soTienTrinh: kq.daChay.length,
            },
        });
        const r = apDungEvent(state, ev, log);
        if (!r.ok) {
            return hong([loi('transaction', 'TUA_DUT', `Tua dừng ở tick ${tickMoi}: Event không áp được.`), ...r.errors], canhBao);
        }
        canhBao.push(...r.warnings);
        events.push(ev);
        if (!smart)
            continue;
        dung = chonMocDung(kq.suKien, tickMoi, bat);
        if (!dung && bat.includes('reality_tut_qua_20') && realityDau - state.metrics.realityIntegrity > 20) {
            dung = {
                dieuKien: 'reality_tut_qua_20',
                tick: tickMoi,
                moTa: `Toàn Vẹn Thực Tại tụt từ ${realityDau} xuống ${state.metrics.realityIntegrity}.`,
                suKien: null,
            };
        }
        if (!dung && bat.includes('the_gioi_trong_rong') && khongConAi(state)) {
            dung = {
                dieuKien: 'the_gioi_trong_rong',
                tick: tickMoi,
                moTa: 'Không còn một người nào trong thế giới. Tua tiếp cũng không còn gì để xem.',
                suKien: null,
            };
        }
        if (dung)
            break;
    }
    return dat({
        tickDau,
        tickCuoi: state.world.tick,
        soBuocEngine,
        events,
        suKien: suKienTatCa,
        chanDoan,
        dung,
        canhBao,
    });
}
function khongConAi(state) {
    let coNoi = false;
    for (const e of state.entities.values()) {
        const dc = e.aspects['dan_cu'];
        if (!dc?.cohort)
            continue;
        coNoi = true;
        const t = (dc.cohort['child'] ?? 0) +
            (dc.cohort['youth'] ?? 0) +
            (dc.cohort['adult'] ?? 0) +
            (dc.cohort['elder'] ?? 0);
        if (t > 0)
            return false;
    }
    return coNoi;
}
