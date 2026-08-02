import { rngCuaTick } from '../../engine/rng.js';
import { EntitySchema, LinkSchema } from '../../schema/entity.js';
import { MortalSchema } from '../../schema/aspect/living.js';
import { SoulSchema } from '../../schema/aspect/soul.js';
import { nguonGoc } from '../../schema/aspect/provenance.js';
import { KnowledgeRowSchema, khoaTriThuc } from '../../schema/soSach.js';
import { docAspect, kep, lam, tongCohort } from './tienIch.js';
/**
 * Độ phân giải theo khoảng cách tới ống kính.
 *
 * `nearbyResolutionRadius` của tuning là bán kính "gần ống kính" tính bằng số
 * chặng đường, không phải bằng khoảng cách hình học: một vùng cách hai ngọn núi
 * nhưng không có đường tới thì xa, dù trên bản đồ nó nằm sát bên.
 */
export function phanGiaiTheoOngKinh(soChang, banKinhGan) {
    if (soChang === null)
        return 'macro';
    if (soChang === 0)
        return 'micro';
    return soChang <= banKinhGan ? 'meso' : 'macro';
}
const BAND = ['child', 'youth', 'adult', 'elder'];
/** Rút `n` người khỏi tháp tuổi theo đúng tỷ trọng, không lệch về nhóm nào. */
function rutTheoThapTuoi(c, n, band) {
    const ra = { child: 0, youth: 0, adult: 0, elder: 0 };
    if (band) {
        ra[band] = Math.min(n, Math.floor(c[band]));
        return ra;
    }
    const tong = tongCohort(c);
    if (tong <= 0)
        return ra;
    let daChia = 0;
    for (const b of BAND) {
        ra[b] = Math.min(Math.floor((n * c[b]) / tong), Math.floor(c[b]));
        daChia += ra[b];
    }
    // Phần dư về nhóm đông nhất còn chỗ — deterministic, không random.
    for (const b of BAND) {
        if (daChia >= n)
            break;
        const them = Math.min(n - daChia, Math.floor(c[b]) - ra[b]);
        ra[b] += them;
        daChia += them;
    }
    return ra;
}
const AM_TIET = ['Ma', 'Lư', 'Đàn', 'Sa', 'Hoè', 'Tí', 'Vân', 'Bạch', 'Khoa', 'Trù'];
function tenNguoi(rng) {
    const a = AM_TIET[rng.nguyen(AM_TIET.length)];
    const b = AM_TIET[rng.nguyen(AM_TIET.length)];
    return `${a} ${b}`;
}
const NGHE = ['nghe_dan_luoi', 'nghe_lam_ruong', 'nghe_gom', 'nghe_moc', 'nghe_san'];
/**
 * Rút `soNguoi` người thật khỏi cohort của một vùng.
 *
 * [BB] Tổng dân số KHÔNG đổi: cohort giảm đúng bằng số entity được tạo, và
 * `spatial.danSo` giữ nguyên vì người được đặt tên vẫn là người của vùng đó.
 *
 * Tài sản và sức khỏe của họ **lấy từ vùng**, không phát sinh:
 *   - kỹ năng theo `kinh_te.kyThuat` của vùng;
 *   - có bệnh hay không theo `y_te.tyLeMac`;
 *   - thể lực theo `kinh_te.thieuHut`;
 *   - điều họ biết là **đúng tập tri thức mà vùng đang giữ**, không hơn một điều.
 */
export function vatChatHoa(state, yc) {
    const e = state.entities.get(yc.noiId);
    const dc = docAspect(e, 'dan_cu');
    if (!e || !dc) {
        return { patches: [], entityIds: [], lyDoTuChoi: `'${yc.noiId}' không phải nơi chốn có dân cư.` };
    }
    const con = tongCohort(dc.cohort);
    const muon = Math.max(0, Math.floor(yc.soNguoi));
    if (muon === 0)
        return { patches: [], entityIds: [], lyDoTuChoi: null };
    if (muon > con) {
        // [BB] Không bịa người. Vùng có bao nhiêu thì rút được bấy nhiêu.
        return {
            patches: [],
            entityIds: [],
            lyDoTuChoi: `'${yc.noiId}' chỉ còn ${con} người, không thể vật chất hóa ${muon}.`,
        };
    }
    const kt = docAspect(e, 'kinh_te');
    const yt = docAspect(e, 'y_te');
    const thieuHut = kep(kt?.thieuHut ?? 0, 0, 1);
    const tyLeMac = kep(yt?.tyLeMac ?? 0, 0, 1);
    const kyThuat = kep(kt?.kyThuat ?? 0, 0, 100);
    const rut = rutTheoThapTuoi(dc.cohort, muon, yc.band);
    const thatSu = BAND.reduce((t, b) => t + rut[b], 0);
    if (thatSu === 0) {
        return { patches: [], entityIds: [], lyDoTuChoi: `'${yc.noiId}' không còn ai thuộc nhóm tuổi yêu cầu.` };
    }
    const rng = rngCuaTick(state.world.seed, state.world.tick, `vat_chat_hoa:${yc.noiId}:${yc.eventId}`);
    const patches = [];
    const entityIds = [];
    const tienTo = yc.tienTo ?? 'nguoi';
    // Tri thức của vùng, sắp xếp deterministic — người mới biết đúng phần này.
    const triThucVung = [...state.knowledge.values()]
        .filter((r) => r.knowerId === yc.noiId)
        .sort((a, b) => (a.id < b.id ? -1 : 1));
    let chiSo = 0;
    for (const band of BAND) {
        for (let i = 0; i < rut[band]; i++) {
            const id = `${tienTo}_${yc.noiId}_${state.world.tick}_${chiSo}`;
            chiSo++;
            // Sức khỏe rút từ tình trạng THẬT của vùng.
            const om = rng.co(tyLeMac);
            const theLuc = lam(kep(100 - thieuHut * 45 - (om ? 25 : 0) - (band === 'elder' ? 20 : 0), 5, 100));
            const sinhLuc = lam(kep(100 - (om ? 30 : 0) - thieuHut * 20, 10, 100));
            // Kỹ năng không vượt trình độ vùng — không có thợ rèn bậc thầy ở làng chài.
            const mucNghe = Math.round(kep(kyThuat * 0.8 + rng.khoang(-8, 12), 0, 100));
            const nguoi = EntitySchema.parse({
                id,
                branchId: state.world.branchId,
                kind: 'mortal',
                ten: tenNguoi(rng),
                moTa: `Một người của ${e.ten}, vừa bước ra khỏi đám đông.`,
                tickSinh: state.world.tick,
                tags: ['vat_chat_hoa'],
                aspects: {
                    // [BB] 59.1 — người này bước ra khỏi đám đông vì thế giới cần họ, không
                    // vì ai gọi tên họ. `parentIds` giữ lại cái đám đông ấy.
                    provenance: nguonGoc('the_gioi_tu_sinh', state.world.tick, { parentIds: [e.id] }),
                    soul: SoulSchema.parse({
                        tang: 't1',
                        banTinh: {
                            canDam_khiepNhuoc: rng.khoang(-40, 40),
                            tratTu_phongTung: rng.khoang(-40, 40),
                        },
                    }),
                    mortal: MortalSchema.parse({
                        ageBand: band,
                        tuoiTho: rng.khoang(52, 76),
                        tickSinh: state.world.tick,
                        ngheId: NGHE[rng.nguyen(NGHE.length)],
                        kyNang: { nghe_chinh: mucNghe },
                        thanThe: { sinhLuc, theLuc, doDoi: 0, conditions: [] },
                        // [BB] Không tặng tài sản. Nếu vùng đói, người này cũng đói.
                        soHuu: [],
                    }),
                },
            });
            patches.push({
                op: 'link',
                target: { table: 'entities', id, path: '' },
                value: nguoi,
                sourceEventId: yc.eventId,
            });
            for (const [lid, tuId, denId, qh] of [
                [`lk_${id}_o`, id, yc.noiId, 'cu_tru_tai'],
                [`lk_${id}_co`, yc.noiId, id, 'la_noi_cu_tru_cua'],
            ]) {
                patches.push({
                    op: 'link',
                    target: { table: 'links', id: lid, path: '' },
                    value: LinkSchema.parse({
                        id: lid,
                        branchId: state.world.branchId,
                        tuId,
                        denId,
                        quanHe: qh,
                        trongSo: 90,
                        tickTao: state.world.tick,
                    }),
                    sourceEventId: yc.eventId,
                });
            }
            // ── lịch sử đã biết: chép từ vùng, giữ nguyên nguồn và số chặng ──
            for (const r of triThucVung.slice(0, 6)) {
                const khoa = khoaTriThuc(id, r.factId);
                patches.push({
                    op: 'link',
                    target: { table: 'knowledge', id: khoa, path: '' },
                    value: KnowledgeRowSchema.parse({
                        ...r,
                        id: khoa,
                        knowerId: id,
                        // Người này ở trong vùng khi tin tới, nên với họ nó không thêm chặng.
                        source: { ...r.source },
                        learnedAtTick: r.learnedAtTick,
                    }),
                    sourceEventId: yc.eventId,
                });
            }
            entityIds.push(id);
        }
        if (rut[band] > 0) {
            // Cohort giảm đúng bằng số người vừa có tên. Dân số tổng KHÔNG đổi.
            patches.push({
                op: 'add',
                target: { table: 'entities', id: yc.noiId, path: `aspects.dan_cu.cohort.${band}` },
                value: -rut[band],
                sourceEventId: yc.eventId,
            });
        }
    }
    // `spatial.danSo` cũng giảm, vì người đã có tên không còn nằm trong cohort.
    patches.push({
        op: 'add',
        target: { table: 'entities', id: yc.noiId, path: 'aspects.spatial.danSo' },
        value: -thatSu,
        sourceEventId: yc.eventId,
    });
    patches.push({
        op: 'add',
        target: { table: 'entities', id: yc.noiId, path: 'aspects.dan_cu.soCai.vatChatHoa' },
        value: thatSu,
        sourceEventId: yc.eventId,
    });
    return { patches, entityIds, lyDoTuChoi: null };
}
