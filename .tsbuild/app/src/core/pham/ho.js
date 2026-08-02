import { EntitySchema, LinkSchema } from '../schema/entity.js';
import { HoSchema } from '../schema/aspect/pham.js';
import { ClaimSchema } from '../contracts/primitives.js';
import { phamThan } from './thanThe.js';
import { dat, hong, loi } from '../contracts/errors.js';
export function hoCua(e) {
    const a = e?.aspects['ho'];
    return a && typeof a === 'object' ? a : undefined;
}
function docAspect(e, ten) {
    const a = e?.aspects[ten];
    return a && typeof a === 'object' ? a : undefined;
}
const set = (id, path, value, evId) => ({
    op: 'set',
    target: { table: 'entities', id, path },
    value,
    sourceEventId: evId,
});
/** Hộ mà người này đang ở, nếu có. */
export function hoCuaNguoi(state, nguoiId) {
    const m = phamThan(state.entities.get(nguoiId));
    if (m?.hoId) {
        const h = hoCua(state.entities.get(m.hoId));
        if (h && h.tickTan === null)
            return { id: m.hoId, ho: h };
    }
    return null;
}
/** Mọi hộ còn sống, sắp xếp deterministic. */
export function moiHo(state) {
    const ra = [];
    for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const e = state.entities.get(id);
        if (!e || e.kind !== 'household' || e.tickDiet !== null)
            continue;
        const h = hoCua(e);
        if (h && h.tickTan === null)
            ra.push({ id, e, ho: h });
    }
    return ra;
}
/**
 * Lập một hộ mới.
 *
 * Kho khởi đầu **rỗng**. Đây là cùng một luật với `vatChatHoa()` của Phase 5:
 * không materialize của cải từ hư không. Hộ mới sống bằng cái nó tự làm ra, hoặc
 * bằng cái hộ gốc chia cho — và phần chia ấy phải là một patch trừ đi ở hộ gốc.
 */
export function lapHo(state, yc, nc) {
    const chu = state.entities.get(yc.chuHoId);
    if (!chu || chu.kind !== 'mortal' || chu.tickDiet !== null) {
        return hong([loi('intent', 'CHU_HO_KHONG_HOP_LE', 'Chủ hộ phải là một người còn sống.')]);
    }
    if (!state.entities.has(yc.noiOId)) {
        return hong([loi('intent', 'KHONG_CO_NOI_O', 'Nơi ở đó không tồn tại.')]);
    }
    if (yc.dangTachTuHo !== true && hoCuaNguoi(state, yc.chuHoId) !== null) {
        return hong([
            loi('intent', 'DA_CO_HO', `${chu.ten} đã ở trong một hộ. Phải tách hộ trước.`, { recoverable: true }),
        ]);
    }
    const hoId = `ho_${yc.chuHoId}_${nc.tick}`;
    const thanhVien = [
        { id: yc.chuHoId, vai: 'chu_ho' },
        ...yc.thanhVien.filter((t) => t.id !== yc.chuHoId && state.entities.has(t.id)),
    ];
    const ho = HoSchema.parse({
        chuHoId: yc.chuHoId,
        thanhVien,
        kho: { luongThuc: 0, vatLieu: 0 },
        noiOId: yc.noiOId,
        tickLap: nc.tick,
        tickTan: null,
        hoGocId: yc.hoGocId ?? null,
        nghiaVu: [],
        thuTuThuaKe: [],
    });
    const b = state.world.branchId;
    const patches = [
        {
            op: 'link',
            target: { table: 'entities', id: hoId, path: '' },
            value: EntitySchema.parse({
                id: hoId,
                branchId: b,
                kind: 'household',
                ten: yc.ten?.trim() || `Nhà ${chu.ten}`,
                moTa: '',
                tickSinh: nc.tick,
                aspects: { ho },
            }),
            sourceEventId: nc.eventId,
        },
    ];
    // Hộ ở đâu thì nối vào đó — [BB] 6.3, không thực thể mồ côi.
    for (const [id, tuId, denId, qh] of [
        [`lk_${hoId}_o`, hoId, yc.noiOId, 'cu_tru_tai'],
        [`lk_${hoId}_co`, yc.noiOId, hoId, 'la_noi_cu_tru_cua'],
    ]) {
        patches.push({
            op: 'link',
            target: { table: 'links', id, path: '' },
            value: LinkSchema.parse({
                id,
                branchId: b,
                tuId,
                denId,
                quanHe: qh,
                trongSo: 80,
                tickTao: nc.tick,
            }),
            sourceEventId: nc.eventId,
        });
    }
    for (const t of thanhVien) {
        patches.push(set(t.id, 'aspects.mortal.hoId', hoId, nc.eventId));
        const lk = `lk_${t.id}_thuoc_${hoId}`;
        patches.push({
            op: 'link',
            target: { table: 'links', id: lk, path: '' },
            value: LinkSchema.parse({
                id: lk,
                branchId: b,
                tuId: t.id,
                denId: hoId,
                quanHe: 'thuoc_ho',
                trongSo: 90,
                tickTao: nc.tick,
            }),
            sourceEventId: nc.eventId,
        });
    }
    return dat({
        patches,
        hoId,
        loiKe: `${chu.ten} lập nhà riêng${thanhVien.length > 1 ? `, ${thanhVien.length - 1} người ở cùng` : ' một mình'}.`,
    });
}
/** Nhập vào một hộ đã có — cưới, về ở rể, nhận con nuôi, hoặc chỉ là trọ. */
export function nhapHo(state, nguoiId, hoId, vai, nc) {
    const nguoi = state.entities.get(nguoiId);
    const eHo = state.entities.get(hoId);
    const ho = hoCua(eHo);
    if (!nguoi || !eHo || !ho)
        return hong([loi('intent', 'KHONG_CO_HO', 'Không tìm thấy nhà đó.')]);
    if (ho.tickTan !== null)
        return hong([loi('intent', 'HO_DA_TAN', 'Nhà đó không còn nữa.')]);
    if (ho.thanhVien.some((t) => t.id === nguoiId)) {
        return hong([loi('intent', 'DA_TRONG_HO', 'Đã ở trong nhà này rồi.', { recoverable: true })]);
    }
    if (ho.thanhVien.length >= 24) {
        return hong([loi('intent', 'HO_QUA_DONG', 'Nhà không chứa thêm được nữa.', { recoverable: true })]);
    }
    const cu = hoCuaNguoi(state, nguoiId);
    const patches = [];
    if (cu)
        patches.push(...roiHo(state, nguoiId, cu.id, nc));
    patches.push({
        op: 'push',
        target: { table: 'entities', id: hoId, path: 'aspects.ho.thanhVien' },
        value: { id: nguoiId, vai },
        sourceEventId: nc.eventId,
    }, set(nguoiId, 'aspects.mortal.hoId', hoId, nc.eventId));
    const lk = `lk_${nguoiId}_thuoc_${hoId}`;
    patches.push({
        op: 'link',
        target: { table: 'links', id: lk, path: '' },
        value: LinkSchema.parse({
            id: lk,
            branchId: state.world.branchId,
            tuId: nguoiId,
            denId: hoId,
            quanHe: 'thuoc_ho',
            trongSo: 90,
            tickTao: nc.tick,
        }),
        sourceEventId: nc.eventId,
    });
    return dat({ patches, loiKe: `${nguoi.ten} về ở ${eHo.ten}.` });
}
/** Rời hộ — không xóa link, chỉ cắt nó. [BB] 6.3 quy tắc 4: để lại sẹo. */
export function roiHo(state, nguoiId, hoId, nc) {
    const ho = hoCua(state.entities.get(hoId));
    if (!ho)
        return [];
    return [
        set(hoId, 'aspects.ho.thanhVien', ho.thanhVien.filter((t) => t.id !== nguoiId), nc.eventId),
        set(nguoiId, 'aspects.mortal.hoId', null, nc.eventId),
        {
            op: 'set',
            target: { table: 'links', id: `lk_${nguoiId}_thuoc_${hoId}`, path: 'tickDut' },
            value: nc.tick,
            sourceEventId: nc.eventId,
        },
    ];
}
/**
 * Một nhịp ăn uống của cả nhà.
 *
 * [BB] Kho chung nghĩa là **đói chung**, và người già cùng trẻ con ăn ít hơn
 * nhưng cũng không làm ra gì. Một nhà bốn người trong đó ba người không lao
 * động được là một nhà sắp có chuyện — engine cho ra điều đó, không ai phải
 * kịch bản hóa nó.
 */
export function nuoiHo(state, hoId, nc, soBuocGop = 1) {
    const eHo = state.entities.get(hoId);
    const ho = hoCua(eHo);
    if (!eHo || !ho || ho.tickTan !== null)
        return { patches: [], thieu: 0, suKien: [] };
    let can = 0;
    const song = [];
    for (const t of ho.thanhVien) {
        const e = state.entities.get(t.id);
        if (!e || e.tickDiet !== null)
            continue;
        const m = phamThan(e);
        if (!m)
            continue;
        song.push({ id: t.id, e });
        can += (m.ageBand === 'child' || m.ageBand === 'elder' ? 0.6 : 1) * soBuocGop;
    }
    if (song.length === 0)
        return { patches: [], thieu: 0, suKien: [] };
    const co = ho.kho.luongThuc;
    const an = Math.min(co, can);
    const thieu = can - an;
    const patches = [
        set(hoId, 'aspects.ho.kho.luongThuc', Math.round((co - an) * 100) / 100, nc.eventId),
    ];
    const suKien = [];
    // Đói chia đều: không ai trong nhà được ăn no trong khi người khác nhịn.
    const doiThem = can > 0 ? Math.round((thieu / can) * 22 * soBuocGop) : 0;
    for (const { id, e } of song) {
        const m = phamThan(e);
        if (!m)
            continue;
        const doiMoi = Math.max(0, Math.min(100, m.thanThe.doDoi + doiThem - (doiThem === 0 ? 12 * soBuocGop : 0)));
        patches.push(set(id, 'aspects.mortal.thanThe.doDoi', doiMoi, nc.eventId));
    }
    if (thieu > 0 && co <= 0) {
        suKien.push({
            loai: 'ho_het_luong',
            moTa: `${eHo.ten} hết lương thực.`,
            mucDo: song.length >= 4 ? 'lon' : 'thuong',
        });
    }
    return { patches, thieu, suKien };
}
// ─────────────────────────────────────────── tách hộ và thừa kế
/**
 * Tách hộ — con cái lớn ra ở riêng.
 *
 * Phần chia là một phép **trừ ở hộ gốc và cộng ở hộ mới**, không phải một phép
 * nhân đôi. Đây là chỗ bảo toàn vật chất của Phase 5 áp vào đời sống hộ.
 */
export function tachHo(state, hoGocId, nguoiId, nc) {
    const eGoc = state.entities.get(hoGocId);
    const goc = hoCua(eGoc);
    if (!eGoc || !goc)
        return hong([loi('intent', 'KHONG_CO_HO', 'Không tìm thấy nhà gốc.')]);
    if (!goc.thanhVien.some((t) => t.id === nguoiId)) {
        return hong([loi('intent', 'KHONG_TRONG_HO', 'Người này không ở trong nhà đó.')]);
    }
    if (goc.thanhVien.length <= 1) {
        return hong([loi('intent', 'HO_CHI_CON_MOT', 'Nhà chỉ còn một người, tách nữa thì không còn nhà.')]);
    }
    if (goc.noiOId === null)
        return hong([loi('intent', 'HO_KHONG_CO_NOI', 'Nhà gốc không có nơi ở.')]);
    const r = lapHo(state, { chuHoId: nguoiId, thanhVien: [], noiOId: goc.noiOId, hoGocId, dangTachTuHo: true }, nc);
    if (!r.ok)
        return r;
    // Chia một phần kho: đủ để sống qua buổi đầu, không đủ để thành nhà giàu.
    const phan = Math.round(goc.kho.luongThuc * 0.25 * 100) / 100;
    const phanVL = Math.round(goc.kho.vatLieu * 0.25 * 100) / 100;
    const patches = [
        ...r.value.patches,
        ...roiHo(state, nguoiId, hoGocId, nc),
        set(hoGocId, 'aspects.ho.kho.luongThuc', Math.round((goc.kho.luongThuc - phan) * 100) / 100, nc.eventId),
        set(hoGocId, 'aspects.ho.kho.vatLieu', Math.round((goc.kho.vatLieu - phanVL) * 100) / 100, nc.eventId),
        set(r.value.hoId, 'aspects.ho.kho.luongThuc', phan, nc.eventId),
        set(r.value.hoId, 'aspects.ho.kho.vatLieu', phanVL, nc.eventId),
    ];
    const ten = state.entities.get(nguoiId)?.ten ?? nguoiId;
    return dat({
        patches,
        hoMoiId: r.value.hoId,
        loiKe: `${ten} ra ở riêng, mang theo một phần của cải nhà cũ.`,
    });
}
/**
 * Ai được thừa kế và bao nhiêu — [BB] 20.3 "kế thừa giữ claim/quan hệ đúng".
 *
 * Thứ tự: hộ tự khai trước, rồi tới con, rồi tới bạn đời, rồi tới học trò. Không
 * ai thì tài sản về hộ, và hộ không còn ai thì nó tan — của cải quay lại vùng
 * chứ **không biến mất** (bảo toàn vật chất, 71.4).
 */
export function nguoiThuaKe(state, nguoiChetId) {
    const e = state.entities.get(nguoiChetId);
    if (!e)
        return [];
    const conSong = (id) => {
        const x = state.entities.get(id);
        return x !== undefined && x.tickDiet === null && x.kind === 'mortal';
    };
    const ho = hoCuaNguoi(state, nguoiChetId);
    const khai = (ho?.ho.thuTuThuaKe ?? []).filter(conSong);
    if (khai.length > 0)
        return khai.map((id) => ({ nguoiId: id, phan: 1 / khai.length }));
    const gen = docAspect(e, 'genealogical');
    const con = [...(gen?.conIds ?? [])].sort().filter(conSong);
    if (con.length > 0)
        return con.map((id) => ({ nguoiId: id, phan: 1 / con.length }));
    const banDoi = ho?.ho.thanhVien.find((t) => t.vai === 'ban_doi' && conSong(t.id));
    if (banDoi)
        return [{ nguoiId: banDoi.id, phan: 1 }];
    const sk = state.entities.get(nguoiChetId)?.aspects['sinh_ke'];
    const tro = [...(sk?.hocTroIds ?? [])].sort().filter(conSong);
    if (tro.length > 0)
        return tro.map((id) => ({ nguoiId: id, phan: 1 / tro.length }));
    return [];
}
/**
 * Chuyển quyền sở hữu khi một người chết.
 *
 * `soHuu` là `Claim[]`, nên chia cho ba người con là ba claim `share = 1/3` trỏ
 * cùng một `targetId`. Không có phép cộng số dư nào ở đây, và đó là chủ ý: một
 * cái nhà chia ba không phải ba cái nhà.
 */
export function chuyenThuaKe(state, nguoiChetId, nc) {
    const e = state.entities.get(nguoiChetId);
    const m = phamThan(e);
    const nhan = nguoiThuaKe(state, nguoiChetId);
    if (!e || !m || m.soHuu.length === 0 || nhan.length === 0) {
        return {
            patches: [],
            nguoiNhan: nhan,
            loiKe: nhan.length === 0 ? `${e?.ten ?? nguoiChetId} không để lại ai để nhận.` : '',
        };
    }
    const patches = [];
    for (const { nguoiId, phan } of nhan) {
        for (const c of m.soHuu) {
            patches.push({
                op: 'push',
                target: { table: 'entities', id: nguoiId, path: 'aspects.mortal.soHuu' },
                value: ClaimSchema.parse({
                    id: `cl_${nguoiId}_${c.targetId}_${nc.tick}`,
                    targetId: c.targetId,
                    kind: c.kind,
                    share: Math.round(c.share * phan * 1000) / 1000,
                    basis: `thừa kế của ${e.ten}`,
                    // Chia cho nhiều người là mầm tranh chấp — engine nói thẳng điều đó.
                    status: nhan.length > 1 ? 'disputed' : 'recognized',
                }),
                sourceEventId: nc.eventId,
            });
        }
    }
    patches.push(set(nguoiChetId, 'aspects.mortal.soHuu', [], nc.eventId));
    const ten = nhan
        .map((x) => state.entities.get(x.nguoiId)?.ten ?? x.nguoiId)
        .slice(0, 3)
        .join(', ');
    return {
        patches,
        nguoiNhan: nhan,
        loiKe: nhan.length === 1
            ? `Của cải của ${e.ten} về tay ${ten}.`
            : `Của cải của ${e.ten} chia cho ${ten}. Chưa ai đồng ý với ai.`,
    };
}
/** Hộ không còn ai sống thì tan; của cải còn lại trả về kho của vùng. */
export function giaiTheHo(state, hoId, nc) {
    const eHo = state.entities.get(hoId);
    const ho = hoCua(eHo);
    if (!eHo || !ho || ho.tickTan !== null)
        return [];
    const conAi = ho.thanhVien.some((t) => {
        const x = state.entities.get(t.id);
        return x !== undefined && x.tickDiet === null;
    });
    if (conAi)
        return [];
    const patches = [
        set(hoId, 'aspects.ho.tickTan', nc.tick, nc.eventId),
        set(hoId, 'aspects.ho.chuHoId', null, nc.eventId),
    ];
    // [BB] 71.4 bảo toàn vật chất — kho không bốc hơi, nó về vùng.
    if (ho.noiOId && state.entities.has(ho.noiOId)) {
        if (ho.kho.luongThuc > 0) {
            patches.push({
                op: 'add',
                target: { table: 'entities', id: ho.noiOId, path: 'aspects.kinh_te.kho.luongThuc' },
                value: ho.kho.luongThuc,
                sourceEventId: nc.eventId,
            });
        }
        if (ho.kho.vatLieu > 0) {
            patches.push({
                op: 'add',
                target: { table: 'entities', id: ho.noiOId, path: 'aspects.kinh_te.kho.vatLieu' },
                value: ho.kho.vatLieu,
                sourceEventId: nc.eventId,
            });
        }
    }
    patches.push(set(hoId, 'aspects.ho.kho', { luongThuc: 0, vatLieu: 0 }, nc.eventId));
    return patches;
}
