import { PrayerSchema, HAU_QUA_TRA_LOI } from '../schema/than.js';
function doc(e, ten) {
    const a = e?.aspects[ten];
    return a === undefined || a === null || typeof a !== 'object' ? undefined : a;
}
/**
 * Quét bế tắc của một vùng.
 *
 * Mỗi mục dưới đây là một dục vọng của `soul.ducVong` bị chặn bởi một con số
 * THẬT trong `kinh_te` / `y_te` / `an_ninh`. Không có mục nào là văn vẻ.
 */
export function quetBeTac(state, noiId) {
    const e = state.entities.get(noiId);
    const dc = doc(e, 'dan_cu');
    if (!e || !dc)
        return [];
    const dan = dc.cohort.child + dc.cohort.youth + dc.cohort.adult + dc.cohort.elder;
    if (dan <= 0)
        return [];
    const kt = doc(e, 'kinh_te');
    const yt = doc(e, 'y_te');
    const an = doc(e, 'an_ninh');
    const ra = [];
    // Ngưỡng "để ý tới" thấp hơn hẳn ngưỡng "phải cầu": khoảng giữa hai con số là
    // vùng người ta tự xoay xở được, và vùng đó phải đủ rộng để có nghĩa.
    const doi = kt?.thieuHut ?? 0;
    if (doi > 0.15) {
        ra.push({
            noiId,
            ducVongThieu: 'anToan',
            canTroId: noiId,
            diemMongMuon: Math.round(doi * 100),
            // `khaThi` là "họ tự xoay xở nổi tới đâu", và nó phải tụt NHANH hơn mức
            // thiếu ăn: đói 40% không có nghĩa còn 60% khả năng tự lo. Dùng `1 - doi`
            // khiến một vùng đói gần nửa khẩu phần vẫn trên ngưỡng và không ai cầu gì —
            // quan sát được ngay khi chạy thật.
            khaThi: Math.max(0, 1 - doi * 2),
            loai: 'xin_cuu',
            noiDung: `Người ở ${e.ten} xin một mùa đủ ăn.`,
            soNguoi: Math.max(1, Math.round(dan * doi * 0.3)),
        });
    }
    const mac = yt?.tyLeMac ?? 0;
    if (mac > 0.06) {
        ra.push({
            noiId,
            ducVongThieu: 'anToan',
            canTroId: yt?.dichId ?? null,
            diemMongMuon: Math.round(mac * 100),
            // Cùng lẽ: một phần năm dân nằm bệnh là vùng đã hết cách, không phải
            // "còn tám phần mười khả năng tự chữa".
            khaThi: Math.max(0, 1 - mac * 3),
            loai: 'xin_cuu',
            noiDung: `Người ở ${e.ten} xin bệnh dừng lại.`,
            soNguoi: Math.max(1, Math.round(dan * mac)),
        });
    }
    const dangDanh = (an?.xungDot ?? []).some((x) => x.tickKetThuc === null);
    if (dangDanh) {
        ra.push({
            noiId,
            ducVongThieu: 'baoThu',
            canTroId: an?.xungDot.find((x) => x.tickKetThuc === null)?.doiThuId ?? null,
            diemMongMuon: 80,
            khaThi: 0.15,
            loai: 'nguyen_rua',
            noiDung: `Người ở ${e.ten} xin kẻ bên kia phải trả giá.`,
            soNguoi: Math.max(1, Math.round(dan * 0.1)),
        });
    }
    if (doi <= 0.02 && (kt?.kho.luongThuc ?? 0) > 0 && mac < 0.01) {
        ra.push({
            noiId,
            ducVongThieu: 'tinNguong',
            canTroId: null,
            diemMongMuon: 30,
            khaThi: 0.9,
            loai: 'ta_on',
            noiDung: `Người ở ${e.ten} tạ ơn vì một mùa yên.`,
            soNguoi: Math.max(1, Math.round(dan * 0.05)),
        });
    }
    return ra;
}
/**
 * Chọn vị thần được gọi tên.
 *
 * Cầu cho ai nghe? Ai có đền ở đây. Không có đền nào thì lời cầu là **cầu
 * chung** (`thanNhanId = null`) — nó vẫn tồn tại, vẫn được kể, chỉ là chưa có
 * địa chỉ. Đây là cách một vị thần mới có thể "nhặt" tín đồ của kẻ khác.
 */
export function thanDuocGoi(state, noiId, rng) {
    const ungVien = [];
    for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const e = state.entities.get(id);
        if (!e || e.kind !== 'deity' || e.tickDiet !== null)
            continue;
        const ven = doc(e, 'venerable');
        const mat = ven?.matDoDen[noiId] ?? 0;
        if (mat > 0)
            ungVien.push({ id, mat });
    }
    if (ungVien.length === 0)
        return null;
    const i = rng.softmax(ungVien.map((x) => x.mat * 100), 35);
    return ungVien[i]?.id ?? ungVien[0].id;
}
/** [BB] 22.2 — chỉ sinh khi `khaThi` dưới ngưỡng. Trên ngưỡng thì họ tự làm được. */
export const NGUONG_KHA_THI = 0.45;
export function sinhLoiCau(state, bt, ctx) {
    if (bt.khaThi >= NGUONG_KHA_THI)
        return null;
    const thanId = thanDuocGoi(state, bt.noiId, ctx.rng);
    const id = `cau_${ctx.tick}_${bt.noiId}_${bt.ducVongThieu}`;
    if (state.prayers.has(id))
        return null;
    const prayer = PrayerSchema.parse({
        id,
        branchId: state.world.branchId,
        nguoiCauId: bt.noiId,
        thanNhanId: thanId,
        loai: bt.loai,
        noiDung: bt.noiDung,
        cuongDo: Math.max(0, Math.min(100, bt.diemMongMuon)),
        goc: {
            ducVongThieu: bt.ducVongThieu,
            canTroId: bt.canTroId,
            diemMongMuon: bt.diemMongMuon,
            khaThi: Math.round(bt.khaThi * 100) / 100,
        },
        tickCau: ctx.tick,
        // Lời cầu có hạn. Quá hạn mà im lặng thì thất vọng tính như đã làm ngơ.
        hanChot: ctx.tick + 12,
        soNguoi: bt.soNguoi,
    });
    return {
        prayer,
        patch: {
            op: 'link',
            target: { table: 'prayers', id, path: '' },
            value: prayer,
            sourceEventId: ctx.eventId,
        },
    };
}
/**
 * Trả lời một lời cầu. Bốn cách, cả bốn đều để lại dấu.
 *
 * [BB] 22.3 — `lam_ngo` KHÔNG phải "không có gì xảy ra". Nó tích `doThatVong`,
 * và vượt ngưỡng thì tín đồ đổi thần hoặc sinh tà giáo. Nó có Event riêng và
 * vào Sổ Nhân Quả như ba cách kia.
 */
export function traLoiCau(state, prayer, cach, ctx) {
    const hq = HAU_QUA_TRA_LOI[cach];
    const noi = state.entities.get(prayer.nguoiCauId);
    const patches = [
        {
            op: 'set',
            target: { table: 'prayers', id: prayer.id, path: 'daTraLoi' },
            value: true,
            sourceEventId: ctx.eventId,
        },
        {
            op: 'set',
            target: { table: 'prayers', id: prayer.id, path: 'cachTraLoi' },
            value: cach,
            sourceEventId: ctx.eventId,
        },
        {
            op: 'set',
            target: { table: 'prayers', id: prayer.id, path: 'tickTraLoi' },
            value: ctx.tick,
            sourceEventId: ctx.eventId,
        },
        {
            op: 'set',
            target: { table: 'prayers', id: prayer.id, path: 'eventTraLoiId' },
            value: ctx.eventId,
            sourceEventId: ctx.eventId,
        },
    ];
    if (noi && hq.phuThuoc !== 0) {
        patches.push({
            op: 'add',
            target: { table: 'entities', id: prayer.nguoiCauId, path: 'aspects.spatial.doPhuThuoc' },
            value: hq.phuThuoc,
            sourceEventId: ctx.eventId,
        });
    }
    // Ban phước GỠ đúng cái cản trở đã sinh ra lời cầu — không phải cộng điểm vu vơ.
    if (cach === 'ban_phuoc' && noi) {
        if (prayer.goc.ducVongThieu === 'anToan' && prayer.loai === 'xin_cuu') {
            patches.push({
                op: 'set',
                target: { table: 'entities', id: prayer.nguoiCauId, path: 'aspects.kinh_te.thieuHut' },
                value: 0,
                sourceEventId: ctx.eventId,
            });
            patches.push({
                op: 'set',
                target: { table: 'entities', id: prayer.nguoiCauId, path: 'aspects.y_te.tyLeMac' },
                value: 0,
                sourceEventId: ctx.eventId,
            });
            patches.push({
                op: 'set',
                target: { table: 'entities', id: prayer.nguoiCauId, path: 'aspects.y_te.dichId' },
                value: null,
                sourceEventId: ctx.eventId,
            });
        }
    }
    if (cach === 'trung_phat' && noi) {
        patches.push({
            op: 'add',
            target: { table: 'entities', id: prayer.nguoiCauId, path: 'aspects.an_ninh.deDoa' },
            value: hq.soHai * 0.5,
            sourceEventId: ctx.eventId,
        });
    }
    const ten = noi?.ten ?? prayer.nguoiCauId;
    const loiKe = {
        ban_phuoc: `${ten} được toại nguyện. Họ sẽ nhớ — và sẽ xin lần nữa.`,
        // Làm ngơ có lời kể riêng. Im lặng cũng là một câu trả lời.
        lam_ngo: `Không có gì xảy ra ở ${ten}. Người ta chờ thêm một mùa, rồi thôi chờ.`,
        trung_phat: `${ten} nhận điều họ không xin. Từ nay họ cầu vì sợ.`,
        dau_hieu: `Một dấu hiệu hiện ra ở ${ten}. Họ sẽ tự giải nghĩa nó, và có thể giải sai.`,
        tra_gia: `${ten} được điều họ xin, và trả điều họ chưa biết là mình đang trả.`,
    };
    return { patches, loiKe: loiKe[cach] };
}
/** Lời cầu quá hạn mà không ai trả lời — im lặng tính như làm ngơ. */
export function loiCauQuaHan(state, tick) {
    const ra = [];
    for (const id of [...state.prayers.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const p = state.prayers.get(id);
        if (!p || p.daTraLoi)
            continue;
        if (p.hanChot !== null && tick > p.hanChot)
            ra.push(p);
    }
    return ra;
}
/** Lời cầu đang chờ một vị thần cụ thể, sắp theo 22.4. */
export function loiCauCho(state, thanId, tick) {
    const ra = [];
    for (const p of state.prayers.values()) {
        if (p.daTraLoi)
            continue;
        if (p.hanChot !== null && tick > p.hanChot)
            continue;
        if (thanId !== null && p.thanNhanId !== null && p.thanNhanId !== thanId)
            continue;
        ra.push(p);
    }
    // 22.4 — sắp theo cường độ; nhiều người cùng cầu thì lời đó nặng hơn.
    return ra.sort((a, b) => {
        const da = a.cuongDo * Math.log2(1 + a.soNguoi);
        const db = b.cuongDo * Math.log2(1 + b.soNguoi);
        return db !== da ? db - da : a.id < b.id ? -1 : 1;
    });
}
