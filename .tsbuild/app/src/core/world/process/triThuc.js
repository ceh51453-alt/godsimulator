import { cong, dat, docAspect, kep, lam, langGieng, moiNoiChon, taoBanGhi, tongCohort } from './tienIch.js';
import { gopTyLe } from './moiTruong.js';
import { KnowledgeRowSchema, khoaTriThuc } from '../../schema/soSach.js';
/** Trần số điều một vùng nhớ nổi. Vượt thì thứ cũ và mờ nhất rơi ra trước. */
export const TRAN_TRI_THUC_MOI_VUNG = 48;
/** Mỗi chặng truyền làm tin mờ đi ngần này (44.3 `truyen_tin_bop_meo`). */
const SUY_GIAM_MOI_CHANG = 0.15;
function lapChiSo(nc) {
    const theoFact = new Map();
    const theoCap = new Map();
    const demTheoNguoi = new Map();
    for (const id of [...nc.state.knowledge.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const r = nc.state.knowledge.get(id);
        if (!r)
            continue;
        const ds = theoFact.get(r.factId) ?? [];
        ds.push(r);
        theoFact.set(r.factId, ds);
        theoCap.set(`${r.knowerId}|${r.factId}`, r);
        demTheoNguoi.set(r.knowerId, (demTheoNguoi.get(r.knowerId) ?? 0) + 1);
    }
    return { theoFact, theoCap, demTheoNguoi };
}
// ─────────────────────────────────────────── travel_communication
export function chayLienLac(nc) {
    const patches = [];
    const suKien = [];
    const chiSo = lapChiSo(nc);
    const tranMoiTick = nc.tuning.worldProcess.maxEventsPerTick;
    let daTao = 0;
    const luuLuong = new Map();
    for (const { id } of moiNoiChon(nc.state)) {
        const vhA = docAspect(nc.state.entities.get(id), 'van_hoa');
        for (const lg of langGieng(nc.state, id)) {
            if (!nc.state.entities.has(lg.noiId))
                continue;
            const vhB = docAspect(nc.state.entities.get(lg.noiId), 'van_hoa');
            // Hai vùng nói lệch nhau thì tin qua được cũng méo hơn. Không chặn — làm sai.
            const lechTieng = Math.abs((vhA?.doLechNgonNgu ?? 0) - (vhB?.doLechNgonNgu ?? 0));
            let coNguoiDi = false;
            for (const factId of [...chiSo.theoFact.keys()].sort((a, b) => (a < b ? -1 : 1))) {
                if (daTao >= tranMoiTick)
                    break;
                const nguon = chiSo.theoCap.get(`${id}|${factId}`);
                if (!nguon)
                    continue;
                if (chiSo.theoCap.has(`${lg.noiId}|${factId}`))
                    continue;
                // [BB] Độ trễ tuyến là điều kiện CỨNG. Tin chưa đi hết đường thì chưa tới.
                if (nc.tick - nguon.learnedAtTick < lg.doTre)
                    continue;
                const doTin = lam(kep(nguon.confidence * (1 - SUY_GIAM_MOI_CHANG - lechTieng * 0.3), 0, 1));
                if (doTin < 0.05)
                    continue;
                const moiFactId = nguon.factId;
                const khoa = khoaTriThuc(lg.noiId, moiFactId);
                const dong = KnowledgeRowSchema.parse({
                    id: khoa,
                    branchId: nc.state.world.branchId,
                    factId: moiFactId,
                    knowerId: lg.noiId,
                    proposition: nguon.proposition,
                    objectRefs: nguon.objectRefs,
                    source: { type: 'told', sourceId: id, hops: nguon.source.hops + 1 },
                    confidence: doTin,
                    distortion: { ...nguon.distortion, chang: nguon.source.hops + 1, lechTieng: lam(lechTieng) },
                    learnedAtTick: nc.tick,
                    lastConfirmedAtTick: null,
                    contradictedBy: [],
                    duongIds: [...nguon.duongIds, lg.duongId],
                });
                patches.push(taoBanGhi(nc, 'knowledge', khoa, dong));
                chiSo.theoCap.set(`${lg.noiId}|${moiFactId}`, dong);
                chiSo.demTheoNguoi.set(lg.noiId, (chiSo.demTheoNguoi.get(lg.noiId) ?? 0) + 1);
                daTao++;
                coNguoiDi = true;
                if (nguon.source.hops === 0) {
                    suKien.push({
                        loai: 'tin_toi_noi',
                        mucDo: 'thuong',
                        moTa: `Tin "${nguon.proposition}" đã tới ${nc.state.entities.get(lg.noiId)?.ten ?? lg.noiId}.`,
                        tienTrinhId: 'travel_communication',
                        chuTheIds: [id, lg.noiId],
                        locationId: lg.noiId,
                        payload: { factId: moiFactId, chang: nguon.source.hops + 1, doTin },
                    });
                }
            }
            if (coNguoiDi)
                luuLuong.set(lg.duongId, (luuLuong.get(lg.duongId) ?? 0) + 1);
        }
    }
    // [BB] `add`, KHÔNG `set`. Nhiều tiến trình cùng đổ lưu lượng lên một tuyến
    // (người đưa tin ở đây, thương đoàn ở `exchange_debt`); `set` thì cái sau đè
    // cái trước theo `uuTien` và con đường trông như chưa ai đi qua.
    for (const duongId of [...luuLuong.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        patches.push(cong(nc, duongId, 'aspects.duong.luuLuong', luuLuong.get(duongId) ?? 0));
    }
    return { patches, suKien };
}
// ─────────────────────────────────────────── knowledge_technology
export function chayKyThuat(nc) {
    const patches = [];
    const suKien = [];
    const chiSo = lapChiSo(nc);
    const n = nc.soBuocGop;
    for (const { id, e } of moiNoiChon(nc.state)) {
        const dc = docAspect(e, 'dan_cu');
        const kt = docAspect(e, 'kinh_te');
        if (!dc || !kt)
            continue;
        const dan = tongCohort(dc.cohort);
        const soBiet = chiSo.demTheoNguoi.get(id) ?? 0;
        // ── trần kỹ thuật: người và điều đã biết, không phải thời gian ──
        // Một làng ba chục người không giữ nổi nghề luyện kim dù có sống nghìn năm.
        const tran = kep(4 * Math.log2(1 + dan / 50) + soBiet * 0.6, 0, 100);
        const dich = kep(tran, 0, 100);
        const buoc = gopTyLe(0.05, n);
        const moi = kep(kt.kyThuat + (dich - kt.kyThuat) * buoc, 0, 100);
        if (lam(moi) !== lam(kt.kyThuat))
            patches.push(dat(nc, id, 'aspects.kinh_te.kyThuat', lam(moi)));
        if (dan <= 0)
            continue;
        // ── phát kiến: nguồn DUY NHẤT của tri thức mới trong thế giới này ──
        const rng = nc.rng.nhanh(`phat_kien:${id}`);
        const p = kep((dan / 5_000) * (0.3 + kt.kyThuat / 100), 0, 0.05);
        if (rng.co(gopTyLe(p, n)) && soBiet < TRAN_TRI_THUC_MOI_VUNG) {
            const factId = `pk_${nc.tick}_${id}`;
            const chuDe = rng.chon([
                'cách ủ hạt qua đông',
                'lối buộc mái không dột',
                'thứ lá cầm máu',
                'cách nung đất cứng hơn',
            ]) ?? 'một mẹo nhỏ';
            const khoa = khoaTriThuc(id, factId);
            patches.push(taoBanGhi(nc, 'knowledge', khoa, KnowledgeRowSchema.parse({
                id: khoa,
                branchId: nc.state.world.branchId,
                factId,
                knowerId: id,
                proposition: `Ở ${e.ten} có người tìm ra ${chuDe}.`,
                objectRefs: [{ id }],
                // hops = 0: đây là chỗ tin SINH RA, không phải chỗ nghe kể.
                source: { type: 'witness', sourceId: id, hops: 0 },
                confidence: 1,
                distortion: {},
                learnedAtTick: nc.tick,
                lastConfirmedAtTick: nc.tick,
                contradictedBy: [],
                duongIds: [],
            })));
            suKien.push({
                loai: 'phat_kien',
                mucDo: 'lon',
                moTa: `Ở ${e.ten}, có người tìm ra ${chuDe}.`,
                tienTrinhId: 'knowledge_technology',
                chuTheIds: [id],
                locationId: id,
                payload: { factId, chuDe },
            });
        }
        // ── mất tri thức: ít người thì không còn ai truyền nghề ──
        if (dan < 40 && soBiet > 0) {
            const rngQuen = nc.rng.nhanh(`quen:${id}`);
            if (rngQuen.co(gopTyLe(0.06, n))) {
                // Bỏ điều mờ nhất trước; điều tự chứng kiến bám lâu hơn điều nghe kể.
                const cua = [...nc.state.knowledge.values()]
                    .filter((r) => r.knowerId === id)
                    .sort((a, b) => a.confidence !== b.confidence ? a.confidence - b.confidence : a.id < b.id ? -1 : 1);
                const bo = cua[0];
                if (bo) {
                    patches.push({
                        op: 'unlink',
                        target: { table: 'knowledge', id: bo.id, path: '' },
                        sourceEventId: nc.eventId,
                    });
                    suKien.push({
                        loai: 'mat_tri_thuc',
                        mucDo: 'lon',
                        moTa: `${e.ten} không còn ai nhớ: "${bo.proposition}"`,
                        tienTrinhId: 'knowledge_technology',
                        chuTheIds: [id],
                        locationId: id,
                        payload: { factId: bo.factId },
                    });
                }
            }
        }
        // ── trần bộ nhớ của vùng ──
        if (soBiet > TRAN_TRI_THUC_MOI_VUNG) {
            const thua = [...nc.state.knowledge.values()]
                .filter((r) => r.knowerId === id)
                .sort((a, b) => (a.confidence !== b.confidence ? a.confidence - b.confidence : a.id < b.id ? -1 : 1))
                .slice(0, soBiet - TRAN_TRI_THUC_MOI_VUNG);
            for (const r of thua) {
                patches.push({
                    op: 'unlink',
                    target: { table: 'knowledge', id: r.id, path: '' },
                    sourceEventId: nc.eventId,
                });
            }
        }
    }
    return { patches, suKien };
}
