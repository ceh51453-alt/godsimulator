import { ProjectSchema } from '../intent/schema.js';
function docAspect(e, ten) {
    const a = e.aspects[ten];
    return a === undefined || a === null ? undefined : a;
}
/**
 * Sáu loại việc dài hơi mà một vị thần thật sự có lý do để làm.
 *
 * Chọn sáu chứ không sáu mươi: mỗi loại phải đo được bằng dữ liệu đã có trong
 * thế giới, nếu không thì tiến độ sẽ phải do ai đó khai — và đó chính là thứ
 * 68.3 cấm.
 */
export const LOAI_DU_AN_THAN = [
    'mo_rong_tin_nguong',
    'lam_diu_mot_vung',
    'gianh_lai_domain',
    'dung_giao_ly',
    'ket_giao_than_khac',
    'tim_lai_chinh_minh',
];
/** Vùng có đền của vị thần này, đã sắp xếp deterministic. */
function vungCoDen(state, ven) {
    return Object.entries(ven?.matDoDen ?? {})
        .filter(([vung, mat]) => mat > 0 && state.entities.has(vung))
        .map(([vung]) => vung)
        .sort((a, b) => (a < b ? -1 : 1));
}
/**
 * Việc vị thần này có lý do để bắt đầu, kèm điểm mong muốn.
 *
 * Điểm suy từ hoàn cảnh thật: một vị thần không có tín đồ muốn mở rộng tín ngưỡng;
 * một vị thần có vùng đang đói muốn làm dịu nó; một vị thần vừa mất domain muốn
 * giành lại. Không có bảng ưu tiên cố định nào, vì thế thần khác hoàn cảnh sẽ
 * theo đuổi việc khác — và đó là toàn bộ điểm.
 */
export function ungVienDuAn(state, thanId) {
    const e = state.entities.get(thanId);
    if (!e || e.kind !== 'deity' || e.tickDiet !== null)
        return [];
    const ven = docAspect(e, 'venerable');
    const dom = docAspect(e, 'domain');
    const bn = docAspect(e, 'ban_nga');
    const vung = vungCoDen(state, ven);
    const ra = [];
    // ── mở rộng tín ngưỡng ──
    const chuaCoDen = [...state.entities.keys()]
        .sort((a, b) => (a < b ? -1 : 1))
        .filter((id) => {
        const v = state.entities.get(id);
        return v?.kind === 'place' && v.tickDiet === null && !(id in (ven?.matDoDen ?? {}));
    });
    const dich = chuaCoDen[0];
    if (dich) {
        const tenDich = state.entities.get(dich)?.ten ?? dich;
        ra.push({
            loai: 'mo_rong_tin_nguong',
            goal: `Đưa tên mình tới ${tenDich}`,
            // Càng ít tín đồ càng muốn — đây là cái đói của một vị thần.
            diem: 40 - Math.min(35, (ven?.soTinDoUocLuong ?? 0) / 8),
            locationIds: [dich],
            stakeholderIds: [],
            milestones: [
                { id: 'm1', description: `Có người ở ${tenDich} nghe nói tới mình` },
                { id: 'm2', description: `Có một nơi thờ ở ${tenDich}` },
            ],
        });
    }
    // ── làm dịu một vùng ──
    let vungKho = null;
    for (const v of vung) {
        const ent = state.entities.get(v);
        if (!ent)
            continue;
        const kt = docAspect(ent, 'kinh_te');
        const an = docAspect(ent, 'an_ninh');
        const kho = (kt?.thieuHut ?? 0) * 60 + (an?.deDoa ?? 0) * 0.3;
        if (!vungKho || kho > vungKho.kho)
            vungKho = { id: v, kho };
    }
    if (vungKho && vungKho.kho > 8) {
        const ten = state.entities.get(vungKho.id)?.ten ?? vungKho.id;
        ra.push({
            loai: 'lam_diu_mot_vung',
            goal: `Làm cho ${ten} thôi khổ`,
            diem: 20 + vungKho.kho,
            locationIds: [vungKho.id],
            stakeholderIds: [],
            milestones: [
                { id: 'm1', description: `Người ở ${ten} không còn đói` },
                { id: 'm2', description: `${ten} yên trở lại` },
            ],
        });
    }
    // ── giành lại domain đã nguội ──
    const nguoi = (dom?.domains ?? []).find((d) => d.trangThai === 'reclaimable' || d.trangThai === 'dormant');
    if (nguoi) {
        ra.push({
            loai: 'gianh_lai_domain',
            goal: `Giành lại "${nguoi.ten}"`,
            // Còn neo thì còn đường; hết neo thì thôi mong.
            diem: 25 + nguoi.neoTaiChiem.length * 12,
            locationIds: [],
            stakeholderIds: [...nguoi.doiThuIds],
            milestones: [
                { id: 'm1', description: `Có người nhắc lại "${nguoi.ten}" cùng tên mình` },
                { id: 'm2', description: `"${nguoi.ten}" quay về trạng thái đang giữ` },
            ],
        });
    }
    // ── dựng giáo lý ──
    if ((bn?.officialDoctrine.length ?? 0) < 3 && vung.length > 0) {
        ra.push({
            loai: 'dung_giao_ly',
            goal: 'Nói ra điều mình muốn người ta nhớ',
            diem: 18 + (bn?.pressure.distortion ?? 0) * 0.35,
            locationIds: [...vung],
            stakeholderIds: [],
            milestones: [
                { id: 'm1', description: 'Có một câu được lặp lại đúng' },
                { id: 'm2', description: 'Câu ấy sống qua một thế hệ' },
            ],
        });
    }
    // ── kết giao với thần khác ──
    const thanKhac = [...state.entities.keys()]
        .sort((a, b) => (a < b ? -1 : 1))
        .find((id) => {
        const x = state.entities.get(id);
        return x?.kind === 'deity' && x.tickDiet === null && id !== thanId;
    });
    if (thanKhac) {
        const ten = state.entities.get(thanKhac)?.ten ?? thanKhac;
        ra.push({
            loai: 'ket_giao_than_khac',
            goal: `Tìm hiểu ${ten} định làm gì`,
            diem: 15,
            locationIds: [],
            stakeholderIds: [thanKhac],
            milestones: [
                { id: 'm1', description: `Có một lần nói chuyện thật với ${ten}` },
                { id: 'm2', description: `Có một giao ước với ${ten}` },
            ],
        });
    }
    // ── tìm lại chính mình ──
    // [BB] 69.3 — "Project không liên quan tín đồ". Đây là cái duy nhất trong sáu
    // loại không có lợi ích nào đo bằng đền hay người thờ, và nó phải có mặt.
    if ((bn?.pressure.distortion ?? 0) > 25) {
        ra.push({
            loai: 'tim_lai_chinh_minh',
            goal: 'Thôi là điều người ta tưởng mình là',
            diem: 12 + (bn?.pressure.distortion ?? 0) * 0.5,
            locationIds: [],
            stakeholderIds: [],
            milestones: [
                { id: 'm1', description: 'Có một lần làm đúng điều mình muốn, giữa lúc không ai mong' },
                { id: 'm2', description: 'Khoảng cách giữa lõi và hình ảnh thu lại dưới hai mươi' },
            ],
        });
    }
    return Object.freeze(ra);
}
/**
 * Loại của một Project, đọc từ id.
 *
 * Bản đầu tách `pj.id.split('_')[3]`, và nó **sai với mọi thần có gạch dưới
 * trong id**: `pj_than_deity_1_mo_rong_tin_nguong_0` cho ra `'1'`, không khớp
 * loại nào, nên tiến độ đứng ở 0 vĩnh viễn. Không ai thấy vì bài test phủ nó
 * thoát sớm khi không tìm được ứng viên — hai lỗi che nhau.
 *
 * Khớp theo tên loại có ranh giới `_…_` thì id chứa bao nhiêu gạch dưới cũng đúng.
 */
export function loaiCuaDuAnThan(id) {
    return LOAI_DU_AN_THAN.find((l) => id.includes(`_${l}_`)) ?? null;
}
/** Dựng `Project` từ một ứng viên đã được utility AI chọn. */
export function moDuAnThan(state, thanId, ung, tick) {
    return ProjectSchema.parse({
        id: `pj_than_${thanId}_${ung.loai}_${tick}`,
        branchId: state.world.branchId,
        ownerIds: [thanId],
        goal: ung.goal,
        scope: 'divine',
        status: 'active',
        locationIds: [...ung.locationIds],
        stakeholderIds: [...ung.stakeholderIds],
        milestones: ung.milestones.map((m) => ({
            id: m.id,
            description: m.description,
            conditions: [],
            progress: 0,
            completedAtTick: null,
        })),
        requirements: [],
        risks: [],
        // Thần nghĩ theo nhịp `nien` (18), nên đừng rà lại mỗi mùa.
        nextTick: tick + 4,
        eventIds: [],
    });
}
/**
 * Rà một Project của thần: đo tiến độ TỪ THẾ GIỚI, không từ lời khai.
 *
 * Trả về `Project` mới; người gọi ghi nó lại bằng patch. Không hàm nào ở đây sửa
 * state — đó vẫn là việc của Event.
 */
export function raSoatDuAnThan(state, pj, tick) {
    const thanId = pj.ownerIds[0];
    const than = thanId ? state.entities.get(thanId) : undefined;
    if (!than || than.tickDiet !== null)
        return { ...pj, status: 'abandoned', nextTick: tick + 999 };
    const ven = docAspect(than, 'venerable');
    const dom = docAspect(than, 'domain');
    const bn = docAspect(than, 'ban_nga');
    /** Hai chặng: chặng 1 là "đã bắt đầu", chặng 2 là "đã xong". */
    const do2 = (m1, m2) => [
        Math.max(0, Math.min(1, m1)),
        Math.max(0, Math.min(1, m2)),
    ];
    let tien = [0, 0];
    const loai = loaiCuaDuAnThan(pj.id);
    const noi = pj.locationIds[0];
    if (loai === 'mo_rong_tin_nguong' && noi) {
        const mat = ven?.matDoDen[noi] ?? 0;
        tien = do2(mat > 0 ? 1 : 0, mat >= 0.2 ? 1 : mat / 0.2);
    }
    else if (loai === 'lam_diu_mot_vung' && noi) {
        const v = state.entities.get(noi);
        const kt = v ? docAspect(v, 'kinh_te') : undefined;
        const an = v ? docAspect(v, 'an_ninh') : undefined;
        tien = do2(1 - (kt?.thieuHut ?? 1), 1 - (an?.deDoa ?? 100) / 100);
    }
    else if (loai === 'gianh_lai_domain') {
        const ten = pj.goal.replace(/^Giành lại "|"$/g, '');
        const d = (dom?.domains ?? []).find((x) => x.ten === ten);
        tien = do2(d ? d.suc / 8 : 0, d?.trangThai === 'held' ? 1 : 0);
    }
    else if (loai === 'dung_giao_ly') {
        const n = bn?.officialDoctrine.length ?? 0;
        tien = do2(n >= 1 ? 1 : 0, n / 3);
    }
    else if (loai === 'ket_giao_than_khac') {
        const doiId = pj.stakeholderIds[0];
        const coLink = doiId !== undefined &&
            [...state.links.values()].some((lk) => lk.tickDut === null &&
                ((lk.tuId === thanId && lk.denId === doiId) || (lk.tuId === doiId && lk.denId === thanId)));
        const doi = doiId ? state.entities.get(doiId) : undefined;
        const coUoc = doi ? docAspect(doi, 'giao_uoc') !== undefined : false;
        tien = do2(coLink ? 1 : 0, coUoc ? 1 : 0);
    }
    else if (loai === 'tim_lai_chinh_minh') {
        const lech = bn?.pressure.distortion ?? 100;
        tien = do2(bn?.lichSuLoi.length ? 1 : 0, lech < 20 ? 1 : Math.max(0, (60 - lech) / 40));
    }
    const milestones = pj.milestones.map((m, i) => {
        const p = tien[i] ?? 0;
        const xong = p >= 1;
        return {
            ...m,
            progress: p,
            completedAtTick: xong ? (m.completedAtTick ?? tick) : null,
        };
    });
    const xongHet = milestones.length > 0 && milestones.every((m) => m.completedAtTick !== null);
    // Bốn lần rà mà chặng đầu vẫn đứng im thì đây là việc đang vướng, không phải
    // đang chạy. Nói đúng tên trạng thái là điều kiện để `banTin` kể được nó.
    const dungIm = milestones[0] !== undefined && milestones[0].progress <= 0 && tick - pj.nextTick > 16;
    return {
        ...pj,
        milestones,
        status: xongHet ? 'completed' : dungIm ? 'blocked' : 'active',
        nextTick: tick + 4,
    };
}
