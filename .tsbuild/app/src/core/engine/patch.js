import { laTenBang } from './state.js';
import { loi } from '../contracts/errors.js';
import { dat, hong } from '../contracts/errors.js';
import { EntitySchema, LinkSchema, GapSchema, WorldMetricsSchema } from '../schema/entity.js';
import { KnowledgeRowSchema, DebtRowSchema } from '../schema/soSach.js';
import { PrayerSchema } from '../schema/than.js';
import { StorylineSchema, ForeshadowSchema } from '../schema/truyen.js';
import { SubstrateLawSchema, CoCheRowSchema } from '../vatly/schema.js';
import { LorebookSchema, LoreExpectationSchema, DiBanSchema } from '../lore/schema.js';
import { WorldSchema } from '../contracts/core.js';
const KHOA_CAM = new Set(['__proto__', 'constructor', 'prototype']);
function layBang(s, bang) {
    switch (bang) {
        case 'entities':
            return s.entities;
        case 'links':
            return s.links;
        case 'gaps':
            return s.gaps;
        case 'knowledge':
            return s.knowledge;
        case 'debts':
            return s.debts;
        case 'prayers':
            return s.prayers;
        case 'storylines':
            return s.storylines;
        case 'foreshadows':
            return s.foreshadows;
        case 'substrateLaws':
            return s.substrateLaws;
        case 'coChe':
            return s.coChe;
        case 'lorebooks':
            return s.lorebooks;
        case 'loreExpectations':
            return s.loreExpectations;
        case 'diBan':
            return s.diBan;
        // 'worlds' và 'metrics' là bản ghi đơn, xử lý riêng.
        default:
            return null;
    }
}
function layBanGhiDon(s, bang) {
    if (bang === 'worlds')
        return s.world;
    if (bang === 'metrics')
        return s.metrics;
    return null;
}
/** Đi tới object cha của `path`, tạo thêm tầng nếu cần. Trả null nếu đường dẫn xấu. */
function toiCha(goc, duongDan, taoThieu) {
    const phan = duongDan.split('.');
    const cuoi = phan.pop();
    if (cuoi === undefined || cuoi === '' || KHOA_CAM.has(cuoi))
        return null;
    let hienTai = goc;
    for (const p of phan) {
        if (p === '' || KHOA_CAM.has(p))
            return null;
        let ke = hienTai[p];
        if (ke === undefined || ke === null) {
            if (!taoThieu)
                return null;
            ke = {};
            hienTai[p] = ke;
        }
        if (typeof ke !== 'object')
            return null;
        hienTai = ke;
    }
    return { cha: hienTai, khoa: cuoi };
}
function docTai(goc, duongDan) {
    if (duongDan === '')
        return goc;
    const t = toiCha(goc, duongDan, false);
    if (!t)
        return undefined;
    return t.cha[t.khoa];
}
/** Schema xác thực lại bản ghi sau khi sửa — bắt patch làm hỏng hình dạng. */
function schemaCua(bang) {
    switch (bang) {
        case 'entities':
            return EntitySchema;
        case 'links':
            return LinkSchema;
        case 'gaps':
            return GapSchema;
        case 'knowledge':
            return KnowledgeRowSchema;
        case 'debts':
            return DebtRowSchema;
        case 'prayers':
            return PrayerSchema;
        case 'storylines':
            return StorylineSchema;
        case 'foreshadows':
            return ForeshadowSchema;
        case 'substrateLaws':
            return SubstrateLawSchema;
        case 'coChe':
            return CoCheRowSchema;
        case 'lorebooks':
            return LorebookSchema;
        case 'loreExpectations':
            return LoreExpectationSchema;
        case 'diBan':
            return DiBanSchema;
        case 'worlds':
            return WorldSchema;
        case 'metrics':
            return WorldMetricsSchema;
    }
}
/**
 * Phạm vi rỗng, kèm phần ghi đè.
 *
 * Dựng object này bằng tay ở nơi gọi nghĩa là mỗi lần thêm một bảng thì mọi chỗ
 * gọi đều vỡ — đã xảy ra hai lần (Phase 5 thêm `knowledge`/`debts`, Phase 6 thêm
 * `prayers`). Helper này giữ hình dạng ở đúng một chỗ.
 */
export function phamVi(ghiDe = {}) {
    return {
        entities: new Set(),
        links: new Set(),
        gaps: new Set(),
        knowledge: new Set(),
        debts: new Set(),
        prayers: new Set(),
        storylines: new Set(),
        foreshadows: new Set(),
        chamWorld: false,
        chamMetrics: false,
        ...ghiDe,
    };
}
/** Hoàn tác chính xác một lô patch đã áp. */
export function hoanTacPatch(s, ht) {
    for (const [khoa, banGhi] of ht.truoc) {
        const [bang, id] = khoa.split('|');
        if (bang === 'worlds') {
            if (banGhi)
                s.world = banGhi;
            continue;
        }
        if (bang === 'metrics') {
            if (banGhi)
                s.metrics = banGhi;
            continue;
        }
        const bangMap = layBang(s, bang);
        if (!bangMap)
            continue;
        if (banGhi === null)
            bangMap.delete(id);
        else
            bangMap.set(id, banGhi);
    }
}
/**
 * Áp một lô patch theo kiểu tất-cả-hoặc-không.
 *
 * Pha 1 — dựng bản nháp của từng bản ghi bị chạm và áp lên nháp;
 * Pha 2 — validate lại từng bản nháp bằng schema;
 * Pha 3 — chỉ khi mọi thứ sạch mới ghi đè vào state thật.
 *
 * Nhờ vậy patch thứ năm hỏng thì bốn patch trước KHÔNG lưu lại dấu vết.
 */
export function apPatch(s, ops) {
    const errs = [];
    const canhBao = [];
    // khóa nháp: `${bang}|${id}`
    const nhap = new Map();
    const xoa = new Set();
    const layNhap = (bang, id) => {
        const khoa = `${bang}|${id}`;
        const daCo = nhap.get(khoa);
        if (daCo)
            return daCo.banGhi;
        const don = layBanGhiDon(s, bang);
        if (don) {
            const ban = structuredClone(don);
            nhap.set(khoa, { bang, id, banGhi: ban, laDon: true });
            return ban;
        }
        const bangMap = layBang(s, bang);
        if (!bangMap)
            return null;
        const goc = bangMap.get(id);
        if (!goc)
            return null;
        const ban = structuredClone(goc);
        nhap.set(khoa, { bang, id, banGhi: ban, laDon: false });
        return ban;
    };
    for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        const viTri = `patch[${i}]`;
        if (!laTenBang(op.target.table)) {
            errs.push(loi('patch', 'BANG_LA', `Bảng không hợp lệ: '${op.target.table}'.`, {
                path: viTri,
                recoverable: false,
            }));
            continue;
        }
        const bang = op.target.table;
        const laDon = bang === 'worlds' || bang === 'metrics';
        const id = laDon ? bang : op.target.id;
        const khoaNhap = `${bang}|${id}`;
        // ── 'link' và 'unlink' tạo/gỡ bản ghi, không sửa trường ──
        if (op.op === 'link') {
            const bangMap = layBang(s, bang);
            if (!bangMap) {
                errs.push(loi('patch', 'LINK_BANG_DON', `Không thể 'link' vào bảng đơn '${bang}'.`, { path: viTri }));
                continue;
            }
            if (bangMap.has(id) || nhap.has(khoaNhap)) {
                errs.push(loi('patch', 'LINK_TRUNG', `Bản ghi '${bang}/${id}' đã tồn tại.`, { path: viTri }));
                continue;
            }
            const r = schemaCua(bang).safeParse(op.value);
            if (!r.success) {
                errs.push(loi('patch', 'LINK_KHONG_HOP_LE', `Bản ghi mới '${bang}/${id}' không hợp lệ.`, {
                    path: viTri,
                    details: { issues: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`) },
                }));
                continue;
            }
            nhap.set(khoaNhap, { bang, id, banGhi: r.data, laDon: false });
            xoa.delete(khoaNhap);
            continue;
        }
        if (op.op === 'unlink') {
            const bangMap = layBang(s, bang);
            if (!bangMap) {
                errs.push(loi('patch', 'UNLINK_BANG_DON', `Không thể 'unlink' bảng đơn '${bang}'.`, { path: viTri }));
                continue;
            }
            if (!bangMap.has(id) && !nhap.has(khoaNhap)) {
                errs.push(loi('patch', 'UNLINK_THIEU', `Không có bản ghi '${bang}/${id}' để gỡ.`, { path: viTri }));
                continue;
            }
            nhap.delete(khoaNhap);
            xoa.add(khoaNhap);
            continue;
        }
        // ── các op còn lại sửa trường của một bản ghi đang có ──
        if (xoa.has(khoaNhap)) {
            errs.push(loi('patch', 'SUA_BAN_GHI_DA_GO', `Bản ghi '${bang}/${id}' đã bị gỡ trong lô này.`, { path: viTri }));
            continue;
        }
        const banGhi = layNhap(bang, id);
        if (!banGhi) {
            errs.push(loi('patch', 'BAN_GHI_THIEU', `Không tìm thấy '${bang}/${id}'.`, { path: viTri }));
            continue;
        }
        // Optimistic concurrency — Phần 61.3.
        if (op.expectedVersion !== undefined) {
            const hienTai = typeof banGhi['_version'] === 'number' ? banGhi['_version'] : 0;
            if (hienTai !== op.expectedVersion) {
                errs.push(loi('transaction', 'VERSION_LECH', `'${bang}/${id}' đang ở version ${hienTai}, patch mong đợi ${op.expectedVersion}.`, { path: viTri }));
                continue;
            }
        }
        if (op.target.path === '') {
            errs.push(loi('patch', 'PATH_RONG', `Op '${op.op}' cần đường dẫn trường.`, { path: viTri }));
            continue;
        }
        const t = toiCha(banGhi, op.target.path, op.op === 'set' || op.op === 'flag' || op.op === 'push');
        if (!t) {
            errs.push(loi('patch', 'PATH_XAU', `Đường dẫn không tới đâu hoặc bị cấm: '${op.target.path}'.`, {
                path: viTri,
            }));
            continue;
        }
        const truoc = t.cha[t.khoa];
        switch (op.op) {
            case 'set':
                t.cha[t.khoa] = op.value;
                break;
            case 'flag':
                t.cha[t.khoa] = op.value === undefined ? true : op.value === true;
                break;
            case 'add':
            case 'mul': {
                if (typeof op.value !== 'number' || !Number.isFinite(op.value)) {
                    errs.push(loi('patch', 'GIA_TRI_KHONG_PHAI_SO', `Op '${op.op}' cần giá trị số hữu hạn.`, { path: viTri }));
                    continue;
                }
                if (typeof truoc !== 'number') {
                    // Phần 9.2 kiểm tra 3: `mul` lên string là trượt.
                    errs.push(loi('patch', 'KIEU_KHONG_HOP', `Không thể '${op.op}' lên '${op.target.path}' (không phải số).`, {
                        path: viTri,
                    }));
                    continue;
                }
                t.cha[t.khoa] = op.op === 'add' ? truoc + op.value : truoc * op.value;
                break;
            }
            case 'push': {
                if (truoc === undefined) {
                    t.cha[t.khoa] = [op.value];
                    break;
                }
                if (!Array.isArray(truoc)) {
                    errs.push(loi('patch', 'KIEU_KHONG_HOP', `Không thể 'push' vào '${op.target.path}' (không phải mảng).`, {
                        path: viTri,
                    }));
                    continue;
                }
                t.cha[t.khoa] = [...truoc, op.value];
                break;
            }
            case 'remove': {
                if (Array.isArray(truoc)) {
                    t.cha[t.khoa] = truoc.filter((x) => x !== op.value);
                    break;
                }
                if (truoc === undefined) {
                    canhBao.push(loi('patch', 'REMOVE_KHONG_CO_GI', `'${op.target.path}' vốn đã trống.`, {
                        path: viTri,
                        severity: 'warning',
                    }));
                    break;
                }
                delete t.cha[t.khoa];
                break;
            }
        }
        // Tăng version cho bản ghi có theo dõi version.
        if (typeof banGhi['_version'] === 'number' && op.target.path !== '_version') {
            banGhi['_version'] = banGhi['_version'] + 1;
        }
    }
    if (errs.length > 0)
        return hong(errs, canhBao);
    // ── Pha 2: validate lại mọi bản nháp ──
    for (const { bang, id, banGhi } of nhap.values()) {
        const r = schemaCua(bang).safeParse(banGhi);
        if (!r.success) {
            errs.push(loi('patch', 'BAN_GHI_HONG_SAU_PATCH', `'${bang}/${id}' không còn hợp lệ sau khi áp patch.`, {
                path: `${bang}/${id}`,
                details: { issues: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`) },
            }));
        }
    }
    if (errs.length > 0)
        return hong(errs, canhBao);
    // ── Pha 3: ghi thật, đồng thời ghi lại thông tin hoàn tác ──
    const truoc = new Map();
    const entities = new Set();
    const links = new Set();
    const gaps = new Set();
    const knowledge = new Set();
    const debts = new Set();
    const prayers = new Set();
    const storylines = new Set();
    const foreshadows = new Set();
    let chamWorld = false;
    let chamMetrics = false;
    const ghiPhamVi = (bang, id) => {
        if (bang === 'entities')
            entities.add(id);
        else if (bang === 'links')
            links.add(id);
        else if (bang === 'gaps')
            gaps.add(id);
        else if (bang === 'knowledge')
            knowledge.add(id);
        else if (bang === 'debts')
            debts.add(id);
        else if (bang === 'prayers')
            prayers.add(id);
        else if (bang === 'storylines')
            storylines.add(id);
        else if (bang === 'foreshadows')
            foreshadows.add(id);
        else if (bang === 'worlds')
            chamWorld = true;
        else
            chamMetrics = true;
    };
    for (const khoa of xoa) {
        const [bang, id] = khoa.split('|');
        const bangMap = layBang(s, bang);
        const cu = bangMap?.get(id);
        truoc.set(khoa, cu ?? null);
        ghiPhamVi(bang, id);
        bangMap?.delete(id);
    }
    for (const [khoa, { bang, id, banGhi, laDon }] of nhap) {
        ghiPhamVi(bang, id);
        if (laDon) {
            if (bang === 'worlds') {
                truoc.set(khoa, s.world);
                s.world = banGhi;
            }
            else {
                truoc.set(khoa, s.metrics);
                s.metrics = banGhi;
            }
            continue;
        }
        const bangMap = layBang(s, bang);
        truoc.set(khoa, bangMap?.get(id) ?? null);
        bangMap?.set(id, banGhi);
    }
    return dat({
        soBanGhiDoi: nhap.size + xoa.size,
        hoanTac: { truoc },
        phamVi: {
            entities,
            links,
            gaps,
            knowledge,
            debts,
            prayers,
            storylines,
            foreshadows,
            chamWorld,
            chamMetrics,
        },
        canhBao,
    }, canhBao);
}
/** Đọc một giá trị theo `PatchOp.target` — dùng cho invariant và test. */
export function docTheoTarget(s, bang, id, duongDan) {
    const don = layBanGhiDon(s, bang);
    if (don)
        return docTai(don, duongDan);
    const banGhi = layBang(s, bang)?.get(id);
    if (!banGhi)
        return undefined;
    return docTai(banGhi, duongDan);
}
