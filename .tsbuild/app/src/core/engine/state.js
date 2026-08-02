import { WorldMetricsSchema } from '../schema/entity.js';
import { hashCua, hashTap, hashGop } from './hash.js';
/**
 * Tên bảng được phép xuất hiện trong `PatchOp.target.table`.
 * `knowledge` và `debts` vào từ Phase 5 (Phần 71.4) — xem ADR-0020.
 * `storylines` và `foreshadows` vào từ Phase 8 (Phần 28, 30.2) — xem ADR-0036.
 */
export const BANG = [
    'worlds',
    'entities',
    'links',
    'gaps',
    'metrics',
    'knowledge',
    'debts',
    'prayers',
    'storylines',
    'foreshadows',
    // ── Phase 10 ──
    'substrateLaws',
    'coChe',
    'lorebooks',
    'loreExpectations',
    'diBan',
];
export function laTenBang(s) {
    return BANG.includes(s);
}
export function taoState(world) {
    return {
        world,
        entities: new Map(),
        links: new Map(),
        gaps: new Map(),
        metrics: WorldMetricsSchema.parse(undefined),
        knowledge: new Map(),
        debts: new Map(),
        prayers: new Map(),
        storylines: new Map(),
        foreshadows: new Map(),
        substrateLaws: new Map(),
        coChe: new Map(),
        lorebooks: new Map(),
        loreExpectations: new Map(),
        diBan: new Map(),
    };
}
/** Bản sao sâu đủ để rollback. Chỉ chứa dữ liệu JSON thuần nên an toàn. */
export function saoChepState(s) {
    return {
        world: structuredClone(s.world),
        entities: new Map([...s.entities].map(([k, v]) => [k, structuredClone(v)])),
        links: new Map([...s.links].map(([k, v]) => [k, structuredClone(v)])),
        gaps: new Map([...s.gaps].map(([k, v]) => [k, structuredClone(v)])),
        metrics: structuredClone(s.metrics),
        knowledge: new Map([...s.knowledge].map(([k, v]) => [k, structuredClone(v)])),
        debts: new Map([...s.debts].map(([k, v]) => [k, structuredClone(v)])),
        prayers: new Map([...s.prayers].map(([k, v]) => [k, structuredClone(v)])),
        storylines: new Map([...s.storylines].map(([k, v]) => [k, structuredClone(v)])),
        foreshadows: new Map([...s.foreshadows].map(([k, v]) => [k, structuredClone(v)])),
        substrateLaws: new Map([...s.substrateLaws].map(([k, v]) => [k, structuredClone(v)])),
        coChe: new Map([...s.coChe].map(([k, v]) => [k, structuredClone(v)])),
        lorebooks: new Map([...s.lorebooks].map(([k, v]) => [k, structuredClone(v)])),
        loreExpectations: new Map([...s.loreExpectations].map(([k, v]) => [k, structuredClone(v)])),
        diBan: new Map([...s.diBan].map(([k, v]) => [k, structuredClone(v)])),
    };
}
/**
 * Hash chính tắc của toàn bộ state.
 *
 * [BB] Cổng Phase 1: cùng seed + state đầu + event log → cùng hash.
 * Trường cache `_hash` và `_degree` bị LOẠI khỏi phép băm: chúng là dữ liệu
 * dẫn xuất, không phải sự thật, và tính lại được.
 */
export function hashState(s) {
    const entityKhongCache = [...s.entities.values()].map((e) => {
        const { _hash: _bo1, _degree: _bo2, ...con } = e;
        void _bo1;
        void _bo2;
        return con;
    });
    return hashGop({
        world: hashCua(s.world),
        entities: hashTap(entityKhongCache),
        links: hashTap([...s.links.values()]),
        gaps: hashTap([...s.gaps.values()]),
        metrics: hashCua(s.metrics),
        knowledge: hashTap([...s.knowledge.values()]),
        debts: hashTap([...s.debts.values()]),
        prayers: hashTap([...s.prayers.values()]),
        storylines: hashTap([...s.storylines.values()]),
        foreshadows: hashTap([...s.foreshadows.values()]),
        substrateLaws: hashTap([...s.substrateLaws.values()]),
        coChe: hashTap([...s.coChe.values()]),
        lorebooks: hashTap([...s.lorebooks.values()]),
        loreExpectations: hashTap([...s.loreExpectations.values()]),
        diBan: hashTap([...s.diBan.values()]),
    });
}
export function taoEventLog(banDau = []) {
    const ds = [...banDau];
    const theoId = new Map(ds.map((e) => [e.id, e]));
    return {
        them(e) {
            // [BB] Append-only. Không sửa, không xóa, không chèn giữa.
            ds.push(e);
            theoId.set(e.id, e);
        },
        tatCa() {
            return ds;
        },
        theoId(id) {
            return theoId.get(id);
        },
        soLuong() {
            return ds.length;
        },
        hash() {
            // Thứ tự CÓ nghĩa với event log, nên băm theo chuỗi chứ không băm theo tập.
            return hashCua(ds.map((e) => e.hash));
        },
    };
}
/** Kho trong bộ nhớ — dùng cho test và cho replay. */
export function taoKhoBoNho() {
    const states = new Map();
    const events = new Map();
    return {
        async docState(branchId) {
            const s = states.get(branchId);
            return s ? saoChepState(s) : undefined;
        },
        async ghiState(s) {
            states.set(s.world.branchId, saoChepState(s));
        },
        async docEvents(branchId) {
            return [...(events.get(branchId) ?? [])];
        },
        async themEvent(e) {
            const ds = events.get(e.branchId) ?? [];
            ds.push(e);
            events.set(e.branchId, ds);
        },
    };
}
