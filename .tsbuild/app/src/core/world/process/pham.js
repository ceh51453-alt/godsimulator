import { docAspect, dat } from './tienIch.js';
import { phamThan, troiThanThe, daChet } from '../../pham/thanThe.js';
import { lamMotNhip } from '../../pham/sinhKe.js';
import { hoCua, moiHo, nuoiHo, giaiTheHo, tachHo } from '../../pham/ho.js';
import { chet } from '../../pham/caiChet.js';
import { moDuAnNguoi, raSoatDuAnNguoi, ungVienDuAnNguoi } from '../../pham/duAnNguoi.js';
/** Mọi người còn sống, sắp xếp deterministic. */
function moiNguoi(nc) {
    const ra = [];
    for (const id of [...nc.state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const e = nc.state.entities.get(id);
        if (!e || e.kind !== 'mortal' || e.tickDiet !== null)
            continue;
        const m = phamThan(e);
        if (m)
            ra.push({ id, e, m });
    }
    return ra;
}
/**
 * Trần số người xử lý mỗi nhịp.
 *
 * Đây không phải tối ưu sớm: `vatChatHoa()` của Phase 5 có thể rút hàng trăm
 * người có tên ra khỏi cohort, và một trăm năm × hàng trăm người là chỗ benchmark
 * "một trăm năm dưới mười giây" của cổng Phase 5 vỡ. Trần giữ chi phí tuyến tính
 * theo ngân sách chứ không theo dân số.
 */
function tran(nc) {
    return Math.max(8, Math.floor(nc.tuning.worldProcess.maxEventsPerTick / 10));
}
// ─────────────────────────────────────────── mortal_daily
/**
 * Một nhịp của những người có tên.
 *
 * Bốn việc, đúng thứ tự của một ngày: làm → mệt/lành → đói → chết.
 * Thứ tự này quan trọng: đảo "đói" lên trước "làm" thì một người đói sẽ không
 * bao giờ làm ra được cái ăn, và cả làng chết trong ba mùa.
 */
export function chayDoiNguoi(nc) {
    const patches = [];
    const suKien = [];
    const n = nc.soBuocGop;
    let dem = 0;
    for (const { id, e, m } of moiNguoi(nc)) {
        if (dem >= tran(nc))
            break;
        dem++;
        // ── 1. làm nghề ──
        const sk = docAspect(e, 'sinh_ke');
        if (sk?.ngheId) {
            const r = lamMotNhip(nc.state, e, { eventId: nc.eventId, tick: nc.tick, rng: nc.rng }, n);
            patches.push(...r.patches);
            // Sản lượng vào KHO HỘ, không vào một cái ví vô hình. Không có hộ thì
            // nó vào kho vùng — của cải không bốc hơi (71.4 bảo toàn vật chất).
            if (r.sanLuong > 0) {
                const dich = m.hoId ?? sk.noiLamId;
                if (dich && nc.state.entities.has(dich)) {
                    const duong = nc.state.entities.get(dich)?.kind === 'household' ? 'aspects.ho.kho' : 'aspects.kinh_te.kho';
                    patches.push({
                        op: 'add',
                        target: { table: 'entities', id: dich, path: `${duong}.luongThuc` },
                        value: r.sanLuong,
                        sourceEventId: nc.eventId,
                    });
                }
            }
            if (r.lenBac) {
                suKien.push({
                    loai: 'len_bac_nghe',
                    mucDo: 'thuong',
                    moTa: r.lenBac,
                    tienTrinhId: 'mortal_daily',
                    chuTheIds: [id],
                    locationId: sk.noiLamId,
                    payload: { nguoiId: id },
                });
            }
        }
        // ── 2. thân thể ──
        const tt = troiThanThe(e, { eventId: nc.eventId, tick: nc.tick, rng: nc.rng.nhanh(`than:${id}`) }, n);
        patches.push(...tt.patches);
        for (const s of tt.suKien) {
            suKien.push({
                loai: s.loai,
                mucDo: 'thuong',
                moTa: s.moTa,
                tienTrinhId: 'mortal_daily',
                chuTheIds: [id],
                locationId: m.hoId,
                payload: { nguoiId: id },
            });
        }
        // Nghỉ ngơi hồi thể lực — nhưng chỉ khi không đói. Đói thì nằm cũng không lại sức.
        if (m.thanThe.doDoi < 50) {
            patches.push({
                op: 'set',
                target: { table: 'entities', id, path: 'aspects.mortal.thanThe.theLuc' },
                value: Math.min(100, Math.round(m.thanThe.theLuc + 6 * n)),
                sourceEventId: nc.eventId,
            });
        }
        // ── 3. việc dài hơi ──
        // Cùng cơ chế người chơi dùng (68.3), cùng lẽ với thần NPC ở Phase 6b.
        patches.push(...duAnCuaNguoi(nc, id, e, suKien));
        // ── 4. chết ──
        // [BB] 70.5 — chuỗi nguyên nhân. `chet()` tự dựng nó từ trạng thái thân thể.
        if (daChet(m).chet) {
            const r = chet(nc.state, id, { eventId: nc.eventId, tick: nc.tick });
            if (r.ok) {
                patches.push(...r.value.patches);
                suKien.push({
                    loai: 'nguoi_chet',
                    mucDo: r.value.nguoiThuaKe.length > 0 ? 'lon' : 'thuong',
                    moTa: r.value.loiKe,
                    tienTrinhId: 'mortal_daily',
                    chuTheIds: [id, ...r.value.nguoiThuaKe],
                    locationId: m.hoId,
                    payload: { nguoiId: id, nguyenNhan: [...r.value.chuoiNguyenNhan] },
                });
            }
        }
    }
    return { patches, suKien };
}
// ─────────────────────────────────────────── household_lifecycle
/**
 * Vòng đời hộ.
 *
 * Ba việc: ăn, tách, tan. Không có "cưới" ở đây — cưới là một hành động của
 * người, đi qua Intent, không phải một sự kiện dân số học. Engine chỉ lo phần
 * mà không ai quyết định: cái đói, con cái lớn lên, và cái nhà không còn ai.
 */
export function chayVongDoiHo(nc) {
    const patches = [];
    const suKien = [];
    const n = nc.soBuocGop;
    let dem = 0;
    for (const { id, e, ho } of moiHo(nc.state)) {
        if (dem >= tran(nc))
            break;
        dem++;
        // ── 1. ăn ──
        const an = nuoiHo(nc.state, id, { eventId: nc.eventId, tick: nc.tick }, n);
        patches.push(...an.patches);
        for (const s of an.suKien) {
            suKien.push({
                loai: s.loai,
                mucDo: s.mucDo,
                moTa: s.moTa,
                tienTrinhId: 'household_lifecycle',
                chuTheIds: [id],
                locationId: ho.noiOId,
                payload: { hoId: id },
            });
        }
        // ── 2. tách hộ ──
        // Con đã trưởng thành, có nghề, và nhà đang chật thì ra riêng. Ba điều kiện
        // đều đọc từ thế giới; không có bộ đếm "tới lúc tách hộ".
        if (ho.thanhVien.length >= 4) {
            const ungVien = ho.thanhVien
                .filter((t) => t.vai === 'con')
                .map((t) => nc.state.entities.get(t.id))
                .filter((x) => x !== undefined && x.tickDiet === null)
                .filter((x) => {
                const mm = phamThan(x);
                const kk = docAspect(x, 'sinh_ke');
                return mm?.ageBand === 'adult' && kk?.ngheId != null && kk.soNhipDaLam >= 12;
            })
                .sort((a, b) => (a.id < b.id ? -1 : 1));
            const ai = ungVien[0];
            if (ai && nc.rng.co(0.25 * n)) {
                const r = tachHo(nc.state, id, ai.id, { eventId: nc.eventId, tick: nc.tick });
                if (r.ok) {
                    patches.push(...r.value.patches);
                    suKien.push({
                        loai: 'tach_ho',
                        mucDo: 'thuong',
                        moTa: r.value.loiKe,
                        tienTrinhId: 'household_lifecycle',
                        chuTheIds: [ai.id, id],
                        locationId: ho.noiOId,
                        payload: { hoGocId: id, hoMoiId: r.value.hoMoiId },
                    });
                }
            }
        }
        // ── 3. tan ──
        const tan = giaiTheHo(nc.state, id, { eventId: nc.eventId, tick: nc.tick });
        if (tan.length > 0) {
            patches.push(...tan);
            suKien.push({
                loai: 'ho_tan',
                mucDo: 'lon',
                moTa: `${e.ten} không còn ai. Cửa đóng lại.`,
                tienTrinhId: 'household_lifecycle',
                chuTheIds: [id],
                locationId: ho.noiOId,
                payload: { hoId: id },
            });
        }
    }
    return { patches, suKien };
}
/**
 * Mở, rà và đóng việc dài hơi của một người.
 *
 * Một việc cùng lúc, không hai như thần: một người có một ngày để sống, và hai
 * việc dài hơi song song là thứ chỉ người có quyền lực mới làm được.
 */
function duAnCuaNguoi(nc, id, e, suKien) {
    const patches = [];
    const hienCo = docAspect(e, 'du_an')?.danhSach ?? [];
    let daDoi = false;
    const sau = hienCo.map((p) => {
        if (p.nextTick > nc.tick || (p.status !== 'active' && p.status !== 'blocked'))
            return p;
        const moi = raSoatDuAnNguoi(nc.state, p, nc.tick);
        if (moi.status !== p.status || moi.nextTick !== p.nextTick)
            daDoi = true;
        if (moi.status === 'completed') {
            suKien.push({
                loai: 'nguoi_xong_viec',
                // [BB] Cổng Phase 7: "một đời bình thường vẫn để lại di sản". Đây là chỗ
                // di sản trở thành một dòng trong bản tin chứ không phải một suy luận.
                mucDo: 'lon',
                moTa: `${e.ten} làm xong điều đã theo đuổi: ${p.goal.toLowerCase()}.`,
                tienTrinhId: 'mortal_daily',
                chuTheIds: [id, ...p.stakeholderIds],
                locationId: p.locationIds[0] ?? null,
                payload: { nguoiId: id, projectId: p.id },
            });
        }
        return moi;
    });
    const dangChay = sau.filter((p) => p.status === 'active' || p.status === 'blocked');
    if (dangChay.length === 0) {
        const ung = ungVienDuAnNguoi(nc.state, id).filter((u) => !sau.some((p) => p.status !== 'completed' && p.goal === u.goal));
        if (ung.length > 0) {
            const rng = nc.rng.nhanh(`duan_nguoi:${id}:${nc.tick}`);
            const chon = ung[rng.softmax(ung.map((u) => u.diem), nc.tuning.npc.nhietDoSoftmax * 100)];
            if (chon) {
                sau.push(moDuAnNguoi(nc.state, id, chon, nc.tick));
                daDoi = true;
            }
        }
    }
    if (daDoi || sau.length !== hienCo.length) {
        patches.push(dat(nc, id, 'aspects.du_an.danhSach', sau.slice(-4)));
    }
    return patches;
}
/** Chỉ để test đọc được cùng một trần với tiến trình. */
export function tranXuLy(nc) {
    return tran(nc);
}
/** Hộ của một người, đọc nhanh — dùng ở `soTay` và UI. */
export function khoCuaHo(nc, hoId) {
    return hoCua(nc.state.entities.get(hoId))?.kho.luongThuc ?? 0;
}
