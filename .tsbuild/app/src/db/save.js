import { SaveExportSchema, PHIEN_BAN_SCHEMA, stripSecret } from '../core/contracts/branch.js';
import { kiemPhienBanSave } from './migration.js';
import { hashState, taoState } from '../core/engine/state.js';
import { EntitySchema, LinkSchema, GapSchema, WorldMetricsSchema } from '../core/schema/entity.js';
import { KnowledgeRowSchema, DebtRowSchema } from '../core/schema/soSach.js';
import { PrayerSchema } from '../core/schema/than.js';
import { StorylineSchema, ForeshadowSchema } from '../core/schema/truyen.js';
import { SubstrateLawSchema, CoCheRowSchema } from '../core/vatly/schema.js';
import { LorebookSchema, LoreExpectationSchema, DiBanSchema } from '../core/lore/schema.js';
import { WorldSchema, EventSchema } from '../core/contracts/core.js';
import { BranchSchema } from '../core/contracts/branch.js';
import { chayInvariantToanBo } from '../core/engine/invariant.js';
import { loi } from '../core/contracts/errors.js';
import { dat, hong } from '../core/contracts/errors.js';
import { quetRoRi } from '../core/privacy/matrix.js';
/** Dựng gói export từ một `WorldState` đã nạp. */
export async function xuatSave(db, state, events, tuyChon = {}) {
    const branchId = state.world.branchId;
    const branches = await db.branches.toArray();
    const goi = {
        dinhDang: 'thien-dien-save',
        schemaVersion: PHIEN_BAN_SCHEMA,
        appVersion: tuyChon.appVersion ?? '',
        tickXuat: state.world.tick,
        world: state.world,
        branches,
        entities: [...state.entities.values()],
        links: [...state.links.values()],
        gaps: [...state.gaps.values()],
        metrics: state.metrics,
        events: [...events],
        /*
         * Mười bảng của Phase 5 – 10 — v7, xem ghi chú ở `SaveExportSchema`.
         *
         * Trước Phase 12 chúng vắng mặt, và xuất-rồi-nhập làm mất Luật Nền, lorebook,
         * mạch truyện, phục bút, tri thức, nợ và lời cầu mà không báo gì.
         */
        knowledge: [...state.knowledge.values()],
        debts: [...state.debts.values()],
        prayers: [...state.prayers.values()],
        storylines: [...state.storylines.values()],
        foreshadows: [...state.foreshadows.values()],
        substrateLaws: [...state.substrateLaws.values()],
        coChe: [...state.coChe.values()],
        lorebooks: [...state.lorebooks.values()],
        loreExpectations: [...state.loreExpectations.values()],
        diBan: [...state.diBan.values()],
        stateHash: hashState(state),
    };
    // [BB] Hồ sơ riêng tư: chỉ kèm khi được yêu cầu tường minh.
    let hoSo;
    let danhTinh;
    if (tuyChon.kemHoSoRiengTu === true) {
        const pid = state.world.playerState.playerProfileId;
        if (pid)
            hoSo = await db.playerProfiles.get(pid);
        const cid = state.world.playerState.creatorIdentityId;
        if (cid)
            danhTinh = await db.playerIdentities.where('id').equals(cid).first();
    }
    // [BB] Secret stripping chạy trên TOÀN BỘ gói, kể cả nhánh và world.
    const sach = stripSecret({
        ...goi,
        ...(hoSo === undefined ? {} : { hoSoRiengTu: hoSo }),
        ...(danhTinh === undefined ? {} : { danhTinhSangThe: danhTinh }),
    });
    const r = SaveExportSchema.safeParse(sach);
    if (!r.success) {
        return hong([
            loi('persistence', 'XUAT_KHONG_HOP_LE', 'Gói export không đúng schema.', {
                details: { issues: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`) },
            }),
        ]);
    }
    // Kiểm rò rỉ hồ sơ riêng khi KHÔNG opt-in — hàng rào cuối trước khi ra file.
    if (tuyChon.kemHoSoRiengTu !== true) {
        const viPham = quetRoRi(r.data, 'export_mac_dinh');
        if (viPham.length > 0) {
            return hong([
                loi('privacy', 'EXPORT_RO_HO_SO_RIENG', `Export mặc định chứa ${viPham.length} trường riêng tư.`, {
                    details: { truong: viPham.map((v) => v.duongDan) },
                    recoverable: false,
                }),
            ]);
        }
    }
    void branchId;
    return dat(r.data);
}
/**
 * Nhập một gói save. Dữ liệu không tin cậy → parse an toàn từng phần,
 * không throw, không đoán khi phiên bản lạ.
 */
export function nhapSave(tho) {
    const canhBao = [];
    const r = SaveExportSchema.safeParse(tho);
    if (!r.success) {
        return hong([
            loi('persistence', 'SAVE_HONG', 'File save không đúng định dạng Thiên Diễn.', {
                details: { issues: r.error.issues.slice(0, 8).map((x) => `${x.path.join('.')}: ${x.message}`) },
                recoverable: false,
            }),
        ]);
    }
    const goi = r.data;
    const v = kiemPhienBanSave(goi.schemaVersion);
    if (!v.ok)
        return hong(v.errors);
    const w = WorldSchema.safeParse(goi.world);
    if (!w.success) {
        return hong([
            loi('persistence', 'SAVE_WORLD_HONG', 'World trong save không hợp lệ.', { recoverable: false }),
        ]);
    }
    const state = taoState(w.data);
    const nap = (ds, schema, ten, dich) => {
        for (const tho2 of ds) {
            const p = schema.safeParse(tho2);
            if (!p.success) {
                canhBao.push(loi('persistence', 'SAVE_BAN_GHI_HONG', `Bỏ qua một bản ghi '${ten}' không hợp lệ.`, {
                    severity: 'warning',
                }));
                continue;
            }
            const val = p.data;
            dich.set(val.id, val);
        }
    };
    nap(goi.entities, EntitySchema, 'entities', state.entities);
    nap(goi.links, LinkSchema, 'links', state.links);
    nap(goi.gaps, GapSchema, 'gaps', state.gaps);
    // v7 — mười bảng của Phase 5 – 10. File v6 có mười mảng rỗng, và đó là đúng
    // trạng thái nó vốn mô tả.
    nap(goi.knowledge, KnowledgeRowSchema, 'knowledge', state.knowledge);
    nap(goi.debts, DebtRowSchema, 'debts', state.debts);
    nap(goi.prayers, PrayerSchema, 'prayers', state.prayers);
    nap(goi.storylines, StorylineSchema, 'storylines', state.storylines);
    nap(goi.foreshadows, ForeshadowSchema, 'foreshadows', state.foreshadows);
    nap(goi.substrateLaws, SubstrateLawSchema, 'substrateLaws', state.substrateLaws);
    nap(goi.coChe, CoCheRowSchema, 'coChe', state.coChe);
    nap(goi.lorebooks, LorebookSchema, 'lorebooks', state.lorebooks);
    nap(goi.loreExpectations, LoreExpectationSchema, 'loreExpectations', state.loreExpectations);
    nap(goi.diBan, DiBanSchema, 'diBan', state.diBan);
    state.metrics = WorldMetricsSchema.parse(goi.metrics ?? undefined);
    const events = [];
    for (const e of goi.events) {
        const p = EventSchema.safeParse(e);
        if (p.success)
            events.push(p.data);
        else
            canhBao.push(loi('persistence', 'SAVE_EVENT_HONG', 'Bỏ qua một Event không hợp lệ.', { severity: 'warning' }));
    }
    for (const b of goi.branches) {
        if (!BranchSchema.safeParse(b).success) {
            canhBao.push(loi('persistence', 'SAVE_BRANCH_HONG', 'Bỏ qua một bản ghi nhánh không hợp lệ.', {
                severity: 'warning',
            }));
        }
    }
    const hashDungLai = hashState(state);
    const hashKhop = hashDungLai === goi.stateHash;
    if (!hashKhop) {
        canhBao.push(loi('persistence', 'SAVE_HASH_LECH', 'Hash trong save không khớp state dựng lại được.', {
            severity: 'warning',
            details: { trongFile: goi.stateHash, dungLai: hashDungLai },
        }));
    }
    // Nạp save là ranh giới — quét bất biến TOÀN BỘ ở đây (ADR-0012).
    const inv = chayInvariantToanBo(state);
    canhBao.push(...inv.canhBao);
    if (!inv.dat) {
        return hong([loi('persistence', 'SAVE_VI_PHAM_BAT_BIEN', 'Save vi phạm bất biến, không nạp được.')].concat(inv.viPhamNang), canhBao);
    }
    return dat({ state, events, hashKhop, canhBao }, canhBao);
}
// ─────────────────────────────────────────── autosave / snapshot
/** Số bản autosave giữ lại mỗi nhánh — Phần 38: "giữ 5 bản gần nhất mỗi nhánh". */
export const SO_AUTOSAVE_GIU = 5;
export async function luuSnapshot(db, state, scopeKey) {
    const row = {
        branchId: state.world.branchId,
        scopeKey,
        tick: state.world.tick,
        stateHash: hashState(state),
        duLieu: {
            world: state.world,
            entities: [...state.entities.values()],
            links: [...state.links.values()],
            gaps: [...state.gaps.values()],
            metrics: state.metrics,
        },
    };
    await db.snapshots.put(row);
    // Dọn bản cũ, giữ SO_AUTOSAVE_GIU bản gần nhất theo TICK (không theo giờ máy).
    const cung = await db.snapshots.where('branchId').equals(state.world.branchId).toArray();
    const cungScope = cung.filter((s) => s.scopeKey === scopeKey).sort((a, b) => b.tick - a.tick);
    for (const cu of cungScope.slice(SO_AUTOSAVE_GIU)) {
        await db.snapshots.delete([cu.branchId, cu.scopeKey, cu.tick]);
    }
    return row;
}
export function phucHoiTuSnapshot(row) {
    const d = row.duLieu;
    const w = WorldSchema.safeParse(d.world);
    if (!w.success) {
        return hong([loi('persistence', 'SNAPSHOT_HONG', 'Snapshot không đọc được.', { recoverable: false })]);
    }
    const s = taoState(w.data);
    for (const e of d.entities ?? []) {
        const p = EntitySchema.safeParse(e);
        if (p.success)
            s.entities.set(p.data.id, p.data);
    }
    for (const l of d.links ?? []) {
        const p = LinkSchema.safeParse(l);
        if (p.success)
            s.links.set(p.data.id, p.data);
    }
    for (const g of d.gaps ?? []) {
        const p = GapSchema.safeParse(g);
        if (p.success)
            s.gaps.set(p.data.id, p.data);
    }
    s.metrics = WorldMetricsSchema.parse(d.metrics ?? undefined);
    if (hashState(s) !== row.stateHash) {
        return hong([
            loi('persistence', 'SNAPSHOT_HASH_LECH', 'Snapshot bị hỏng: hash không khớp.', { recoverable: false }),
        ]);
    }
    return dat(s);
}
/** Ghi state hiện tại xuống DB rồi tạo snapshot — dùng cho autosave sau mỗi tick. */
export async function autosave(db, kho, state, scopeKey) {
    await kho.ghiState(state);
    await luuSnapshot(db, state, scopeKey);
}
