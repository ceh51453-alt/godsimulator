import { EntitySchema, LinkSchema } from '../schema/entity.js';
import { SoulSchema } from '../schema/aspect/soul.js';
import { DomainSchema, VenerableSchema } from '../schema/aspect/divine.js';
import { MortalSchema } from '../schema/aspect/living.js';
import { nguonGoc } from '../schema/aspect/provenance.js';
import { taoEvent } from '../engine/transaction.js';
import { taoRng } from '../engine/rng.js';
import { BlockReasonSchema } from '../contracts/primitives.js';
import { loi } from '../contracts/errors.js';
import { dat, hong } from '../contracts/errors.js';
const patchTao = (bang, id, banGhi, evId) => ({
    op: 'link',
    target: { table: bang, id, path: '' },
    value: banGhi,
    sourceEventId: evId,
});
const chan = (code, message, extra = {}) => BlockReasonSchema.parse({ code, message, ...extra });
/**
 * Validator cho bản nháp hiện diện — [BB] 78.4 bước 1, 78.7, 78.8.
 * Chạy trên WorldView (thứ người chơi được biết), không trên World thô.
 */
export function kiemNhapHienDien(draft, view, state) {
    const chanLai = [];
    if (draft.mode === 'sang_the')
        return chanLai;
    // ── nhập một entity có sẵn ──
    if (draft.useExistingEntityId !== null) {
        const e = view.entities.get(draft.useExistingEntityId);
        if (!e) {
            chanLai.push(chan('KHONG_THAY_ENTITY', 'Không tìm thấy nhân vật đó trong thế giới bạn đang thấy.', {
                missingRefs: [{ id: draft.useExistingEntityId }],
            }));
            return chanLai;
        }
        const dungLoai = (draft.mode === 'than' && e.kind === 'deity') || (draft.mode === 'pham_nhan' && e.kind === 'mortal');
        if (!dungLoai) {
            chanLai.push(chan('SAI_LOAI_ENTITY', `"${e.ten}" không phải loại nhân vật hợp với tầng bạn chọn.`));
        }
        return chanLai;
    }
    // ── tạo thần mới ──
    if (draft.mode === 'than') {
        // [BB] 78.7 — domain phải được TIẾP ĐỊA hoặc ghi rõ đang ở `hu_danh`.
        for (const kid of draft.deity.domainConceptIds) {
            const kn = view.entities.get(kid);
            if (!kn) {
                chanLai.push(chan('DOMAIN_KHAI_NIEM_LA', `Khái niệm "${kid}" chưa tồn tại trong thế giới này.`, {
                    missingRefs: [{ id: kid }],
                }));
                continue;
            }
            if (kn.kind !== 'concept') {
                chanLai.push(chan('DOMAIN_KHONG_PHAI_KHAI_NIEM', `"${kn.ten}" không phải một Khái Niệm.`));
            }
        }
        // [BB] `primordial = true` không hợp nếu world ĐÃ CÓ LỊCH SỬ.
        if (draft.deity.primordial && state.world.tick > 0) {
            chanLai.push(chan('KHOI_NGUYEN_SAU_LICH_SU', 'Thế giới này đã có lịch sử, nên không thể sinh ra một Thần Khởi Nguyên nữa. Hãy tách nhánh nếu bạn muốn viết lại buổi đầu.', { recoverable: true }));
        }
        if (draft.deity.pantheonId !== null && !view.entities.has(draft.deity.pantheonId)) {
            chanLai.push(chan('THAN_HE_LA', 'Thần hệ bạn muốn gia nhập chưa tồn tại.', {
                missingRefs: [{ id: draft.deity.pantheonId }],
            }));
        }
        return chanLai;
    }
    // ── tạo phàm nhân mới ──
    // [BB] 78.8 — world phải có region/culture/nghề hợp lệ trước đã.
    const coNoi = [...view.entities.values()].some((e) => e.kind === 'place' || e.kind === 'realm');
    if (!coNoi) {
        chanLai.push(chan('CHUA_CO_NOI_O', 'Thế giới chưa có nơi nào để một con người sinh ra. Hãy tạo thế giới trước.'));
    }
    if (draft.mortal.regionId !== null && !view.entities.has(draft.mortal.regionId)) {
        chanLai.push(chan('VUNG_LA', 'Vùng bạn chọn chưa tồn tại.', { missingRefs: [{ id: draft.mortal.regionId }] }));
    }
    for (const it of draft.mortal.itemIds) {
        if (!view.entities.has(it)) {
            chanLai.push(chan('VAT_CHUA_TON_TAI', `"${it}" chưa tồn tại trong thế giới. Nó sẽ thành một mục tiêu để bạn đi tìm, không phải thứ có sẵn trong tay.`, { missingRefs: [{ id: it }], recoverable: true }));
        }
    }
    return chanLai;
}
/** Vùng đầu tiên thấy được — nơi mặc định cho một phàm nhân mới. */
function vungMacDinh(view) {
    const ds = [...view.entities.values()]
        .filter((e) => e.kind === 'place')
        .sort((a, b) => (a.id < b.id ? -1 : 1));
    return ds[0]?.id ?? null;
}
/**
 * Biến bản nháp thành Event. [BB] Chỉ gọi sau khi validator sạch và người chơi
 * đã xác nhận `CanonDiff`.
 */
export function eventHienDien(draft, view, state) {
    const chanLai = kiemNhapHienDien(draft, view, state);
    const nghiemTrong = chanLai.filter((c) => !c.recoverable);
    if (nghiemTrong.length > 0) {
        return hong(nghiemTrong.map((c) => loi('intent', c.code, c.message, { details: { lawId: c.lawId }, recoverable: false })));
    }
    const b = state.world.branchId;
    const tick = state.world.tick;
    const evId = `ev_hien_dien_${draft.mode}`;
    const rng = taoRng(`${state.world.seed}#hiendien#${draft.mode}#${draft.name}`);
    const patches = [];
    const seTao = [];
    const seNoi = [];
    const engineQuyet = [];
    const khongCapThang = [];
    // ── Sáng Thế: không cần entity nhập vai (78.4) ──
    if (draft.mode === 'sang_the') {
        const ev = taoEvent({
            id: evId,
            branchId: b,
            tick,
            loai: 'hien_dien_sang_the',
            actorIds: [],
            targetIds: [],
            causeEventIds: [],
            locationId: null,
            patches: [
                {
                    op: 'set',
                    target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
                    value: 'sang_the',
                    sourceEventId: evId,
                },
                {
                    op: 'set',
                    target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
                    value: null,
                    sourceEventId: evId,
                },
                {
                    op: 'set',
                    target: { table: 'worlds', id: 'worlds', path: 'playerState.setupCompleted' },
                    value: true,
                    sourceEventId: evId,
                },
            ],
            visibility: 'engine',
            source: 'player',
            payload: { mode: 'sang_the' },
        });
        return dat({
            events: [ev],
            chuTheId: null,
            diff: {
                seTao: [],
                seNoi: [],
                engineQuyet: ['Bạn hiện diện như Sáng Thế Thần: không thân xác, không vị trí.'],
                khongCapThang: [],
            },
        });
    }
    // ── nhập một entity CÓ SẴN: giữ nguyên lịch sử và id (79.4) ──
    if (draft.useExistingEntityId !== null) {
        const e = view.entities.get(draft.useExistingEntityId);
        const ev = taoEvent({
            id: evId,
            branchId: b,
            tick,
            loai: 'hien_dien_nhap_vai',
            actorIds: [draft.useExistingEntityId],
            targetIds: [],
            causeEventIds: [],
            locationId: null,
            patches: [
                {
                    op: 'set',
                    target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
                    value: draft.mode,
                    sourceEventId: evId,
                },
                {
                    op: 'set',
                    target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
                    value: draft.useExistingEntityId,
                    sourceEventId: evId,
                },
                {
                    op: 'set',
                    target: { table: 'worlds', id: 'worlds', path: 'playerState.setupCompleted' },
                    value: true,
                    sourceEventId: evId,
                },
            ],
            visibility: 'engine',
            source: 'player',
            payload: { mode: draft.mode, nhapVao: draft.useExistingEntityId },
        });
        return dat({
            events: [ev],
            chuTheId: draft.useExistingEntityId,
            diff: {
                seTao: [],
                seNoi: [],
                engineQuyet: [
                    `Bạn nhập vào "${e?.ten ?? draft.useExistingEntityId}"; lịch sử và quan hệ của họ giữ nguyên.`,
                ],
                khongCapThang: [],
            },
        });
    }
    // ── tạo THẦN mới ──
    if (draft.mode === 'than') {
        const id = `deity_pc_${tick}`;
        const ten = draft.name.trim() === '' ? 'Vị Thần Không Tên' : draft.name.trim();
        // [BB] 78.7 — `suc` do ENGINE tính từ trạng thái khái niệm, KHÔNG từ input.
        const domains = draft.deity.domainConceptIds.map((kid) => {
            const kn = view.entities.get(kid);
            const c = kn?.aspects['conceptual'];
            // Khái niệm càng được tiếp địa thì thần mới càng có chỗ đứng — nhưng luôn khiêm tốn.
            const theoGiaiDoan = c?.giaiDoan === 'ket_tinh'
                ? 22
                : c?.giaiDoan === 'thanh_hinh'
                    ? 14
                    : c?.giaiDoan === 'manh_nha'
                        ? 8
                        : 3;
            return { ten: kid, suc: theoGiaiDoan + rng.khoang(0, 4) };
        });
        engineQuyet.push(domains.length > 0
            ? `Sức của domain do thế giới quyết, không do bạn khai: ${domains.map((d) => `${d.ten} = ${d.suc}`).join(', ')}.`
            : 'Bạn bắt đầu không có domain nào; thế giới chưa gán cho bạn thẩm quyền gì.');
        khongCapThang.push('Không có "sức mạnh khởi đầu" nào được cấp. Vị thế phải giành lấy.');
        const than = EntitySchema.parse({
            id,
            branchId: b,
            kind: 'deity',
            ten,
            moTa: draft.appearance || draft.origin || '',
            tickSinh: tick,
            aspects: {
                // [BB] 59.1 — thân phận này do NGƯỜI CHƠI dựng, và Bảng phải nói được vậy.
                provenance: nguonGoc('nguoi_choi', tick, { actorId: id }),
                // [BB] coreSelf từ thông tin người chơi; chỉ số còn lại do engine dựng.
                soul: SoulSchema.parse({
                    tang: 't3',
                    kyUcSuyGiam: false,
                    banTinh: {},
                }),
                domain: DomainSchema.parse({
                    domains,
                    khaiNiemGocId: draft.deity.domainConceptIds[0] ?? null,
                    laKhoiNguyen: draft.deity.primordial && state.world.tick === 0,
                    thanHeId: draft.deity.pantheonId,
                }),
                venerable: VenerableSchema.parse({
                    // Thần mới chưa ai thờ. Đó là điểm xuất phát, không phải hình phạt.
                    soTinDoUocLuong: 0,
                    hienThanh: 5,
                }),
            },
        });
        patches.push(patchTao('entities', id, than, evId));
        seTao.push({ id, kind: 'deity', ten, moTa: than.moTa });
        for (const kid of draft.deity.domainConceptIds) {
            const lkId = `lk_${id}_${kid}`;
            patches.push(patchTao('links', lkId, LinkSchema.parse({
                id: lkId,
                branchId: b,
                tuId: id,
                denId: kid,
                quanHe: 'ket_tinh_tu',
                trongSo: 40,
                tickTao: tick,
            }), evId));
            seNoi.push(`${ten} — kết tinh từ → ${view.entities.get(kid)?.ten ?? kid}`);
        }
        if (draft.deity.pantheonId !== null) {
            const lkId = `lk_${id}_pantheon`;
            patches.push(patchTao('links', lkId, LinkSchema.parse({
                id: lkId,
                branchId: b,
                tuId: id,
                denId: draft.deity.pantheonId,
                quanHe: 'thuoc_than_he',
                trongSo: 50,
                tickTao: tick,
            }), evId));
            seNoi.push(`${ten} — thuộc thần hệ → ${draft.deity.pantheonId}`);
        }
        // [BB] 6.3 — không thực thể mồ côi: thần chưa nối gì thì nối vào một nơi.
        if (seNoi.length === 0) {
            const noi = vungMacDinh(view);
            if (noi) {
                const lkId = `lk_${id}_noi`;
                patches.push(patchTao('links', lkId, LinkSchema.parse({
                    id: lkId,
                    branchId: b,
                    tuId: id,
                    denId: noi,
                    quanHe: 'cu_tru_tai',
                    trongSo: 30,
                    tickTao: tick,
                }), evId));
                patches.push(patchTao('links', `${lkId}_r`, LinkSchema.parse({
                    id: `${lkId}_r`,
                    branchId: b,
                    tuId: noi,
                    denId: id,
                    quanHe: 'la_noi_cu_tru_cua',
                    trongSo: 30,
                    tickTao: tick,
                }), evId));
                seNoi.push(`${ten} — cư trú tại → ${view.entities.get(noi)?.ten ?? noi}`);
            }
        }
        patches.push({
            op: 'set',
            target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
            value: 'than',
            sourceEventId: evId,
        }, {
            op: 'set',
            target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
            value: id,
            sourceEventId: evId,
        }, {
            op: 'set',
            target: { table: 'worlds', id: 'worlds', path: 'playerState.setupCompleted' },
            value: true,
            sourceEventId: evId,
        });
        const ev = taoEvent({
            id: evId,
            branchId: b,
            tick,
            loai: 'hien_dien_than',
            actorIds: [id],
            targetIds: draft.deity.domainConceptIds,
            causeEventIds: [],
            locationId: null,
            patches,
            visibility: 'cong_khai',
            source: 'player',
            payload: { mode: 'than', ten },
        });
        return dat({ events: [ev], chuTheId: id, diff: { seTao, seNoi, engineQuyet, khongCapThang } });
    }
    // ── tạo PHÀM NHÂN mới ──
    const id = `mortal_pc_${tick}`;
    const ten = draft.name.trim() === '' ? 'Người Không Tên' : draft.name.trim();
    const vung = draft.mortal.regionId ?? vungMacDinh(view);
    // [BB] 78.8 — kỹ năng nằm trong NGÂN SÁCH hợp lý của hoàn cảnh, không vô hạn.
    const NGAN_SACH_KY_NANG = 3;
    const kyNangNhan = draft.mortal.skillIds.slice(0, NGAN_SACH_KY_NANG);
    const kyNangBoQua = draft.mortal.skillIds.slice(NGAN_SACH_KY_NANG);
    const kyNang = {};
    for (const k of kyNangNhan)
        kyNang[k] = rng.khoang(15, 35);
    engineQuyet.push(kyNangNhan.length > 0
        ? `Kỹ năng khởi đầu ở mức người mới: ${kyNangNhan.map((k) => `${k} ≈ ${kyNang[k]}`).join(', ')}.`
        : 'Bạn bắt đầu không có kỹ năng đặc biệt nào.');
    if (kyNangBoQua.length > 0) {
        khongCapThang.push(`${kyNangBoQua.length} kỹ năng vượt ngân sách xuất thân sẽ thành mục tiêu để học, không được cấp sẵn: ${kyNangBoQua.join(', ')}.`);
    }
    if (draft.mortal.itemIds.length > 0) {
        khongCapThang.push(`Vật bạn nhắc tới không vào tay ngay; chúng thành thứ phải đi tìm hoặc đòi lại: ${draft.mortal.itemIds.join(', ')}.`);
    }
    const nguoi = EntitySchema.parse({
        id,
        branchId: b,
        kind: 'mortal',
        ten,
        moTa: draft.appearance || draft.origin || '',
        tickSinh: tick,
        aspects: {
            // [BB] 59.1 — cùng lẽ với thân phận thần ở trên.
            provenance: nguonGoc('nguoi_choi', tick, { actorId: id }),
            soul: SoulSchema.parse({ tang: 't3' }),
            mortal: MortalSchema.parse({
                ageBand: draft.mortal.ageBand === 'world_defined' ? 'adult' : draft.mortal.ageBand,
                ngheId: draft.mortal.occupationId,
                hoId: draft.mortal.householdId,
                kyNang,
                mucTieuDoiNguoi: draft.goals.slice(0, 3),
            }),
        },
    });
    patches.push(patchTao('entities', id, nguoi, evId));
    seTao.push({ id, kind: 'mortal', ten, moTa: nguoi.moTa });
    if (vung) {
        const lkId = `lk_${id}_cu_tru`;
        patches.push(patchTao('links', lkId, LinkSchema.parse({
            id: lkId,
            branchId: b,
            tuId: id,
            denId: vung,
            quanHe: 'cu_tru_tai',
            trongSo: 90,
            tickTao: tick,
        }), evId), patchTao('links', `${lkId}_r`, LinkSchema.parse({
            id: `${lkId}_r`,
            branchId: b,
            tuId: vung,
            denId: id,
            quanHe: 'la_noi_cu_tru_cua',
            trongSo: 90,
            tickTao: tick,
        }), evId));
        seNoi.push(`${ten} — cư trú tại → ${view.entities.get(vung)?.ten ?? vung}`);
    }
    patches.push({
        op: 'set',
        target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
        value: 'pham_nhan',
        sourceEventId: evId,
    }, {
        op: 'set',
        target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
        value: id,
        sourceEventId: evId,
    }, {
        op: 'set',
        target: { table: 'worlds', id: 'worlds', path: 'playerState.setupCompleted' },
        value: true,
        sourceEventId: evId,
    });
    const ev = taoEvent({
        id: evId,
        branchId: b,
        tick,
        loai: 'hien_dien_pham_nhan',
        actorIds: [id],
        targetIds: vung ? [vung] : [],
        causeEventIds: [],
        locationId: vung,
        patches,
        visibility: 'cong_khai',
        source: 'player',
        payload: { mode: 'pham_nhan', ten },
    });
    return dat({ events: [ev], chuTheId: id, diff: { seTao, seNoi, engineQuyet, khongCapThang } });
}
/** Chuyển tầng — Phần 21.3. Chỉ đổi mode + chuTheId, KHÔNG tạo save mới. */
export function eventChuyenTang(state, denMode, chuTheId, lyDo) {
    const evId = `ev_chuyen_tang_${state.world.tick}_${denMode}`;
    const tu = state.world.playerState.mode;
    return taoEvent({
        id: evId,
        branchId: state.world.branchId,
        tick: state.world.tick,
        loai: 'chuyen_tang',
        actorIds: chuTheId ? [chuTheId] : [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches: [
            {
                op: 'set',
                target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
                value: denMode,
                sourceEventId: evId,
            },
            {
                op: 'set',
                target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
                value: chuTheId,
                sourceEventId: evId,
            },
            {
                op: 'push',
                target: { table: 'worlds', id: 'worlds', path: 'playerState.lichSuChuyenTang' },
                value: { tick: state.world.tick, tu, den: denMode, lyDo },
                sourceEventId: evId,
            },
        ],
        visibility: 'engine',
        source: 'player',
        payload: { tu, den: denMode, lyDo },
    });
}
