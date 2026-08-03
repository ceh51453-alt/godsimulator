import { bam } from '../engine/hash.js';
import { PresetActivationSchema } from './schema.js';
import { dungDoThi, nhomXungDot } from './xungDot.js';
/** Tám bậc quyền ưu tiên — 65.3, cao xuống thấp. */
export const BAC_QUYEN = Object.freeze([
    'Product safety',
    'WorldView visibility',
    'Engine invariants',
    'Pipeline output contract',
    'Native task instruction',
    'User override trong Thiên Diễn',
    'Imported prompt pack',
    'Styling/transform',
]);
export const BAC_CUA_PACK_NGOAI = 6;
/**
 * Toàn bộ lint/test tĩnh chạy trước khi bật — 65.4 bước 2.
 *
 * Cycle chưa gỡ và module cách ly là điều kiện chặn. Nhóm tác động trùng bên
 * trong cùng preset được giữ theo `prompt_order` và báo cảnh báo để không phá
 * thiết kế phối hợp có chủ ý của tác giả.
 */
export function lintTruocKhiBat(row, chon) {
    const issues = [];
    const theoId = new Map(row.pack.modules.map((m) => [m.id, m]));
    const daChon = new Set(chon.selectedModuleIds);
    for (const id of chon.selectedModuleIds) {
        const m = theoId.get(id);
        if (m === undefined) {
            issues.push({
                code: 'MODULE_KHONG_TON_TAI',
                severity: 'error',
                path: id,
                message: `Lựa chọn trỏ tới module "${id}" không có trong pack bản ${row.version}.`,
                details: {},
            });
            continue;
        }
        if (m.activation === 'quarantined') {
            issues.push({
                code: 'CHON_MODULE_CACH_LY',
                severity: 'error',
                path: id,
                message: `Module "${m.name}" đang bị cách ly (64.5) và không bật được từ đây.`,
                details: { activation: m.activation },
            });
        }
        if (m.activation === 'needs_adapter') {
            issues.push({
                code: 'CHON_MODULE_CAN_ADAPTER',
                severity: 'error',
                path: id,
                message: `Module "${m.name}" dùng macro chưa có ánh xạ. Cần adapter trước khi bật.`,
                details: { macro: m.sourceMeta['macroCanAdapter'] },
            });
        }
    }
    const dangBat = row.pack.modules.map((m) => ({ ...m, enabled: daChon.has(m.id) }));
    const doThi = dungDoThi(dangBat.filter((m) => m.enabled));
    if (doThi.cycles.length > 0) {
        // [BB] 65.2 — "Pack chưa resolve cycle không kích hoạt."
        issues.push(...doThi.issues.filter((i) => i.code === 'DEPENDENCY_CYCLE'));
    }
    for (const n of nhomXungDot(dangBat)) {
        if (!n.canNguoiChon)
            continue;
        if (!Object.hasOwn(chon.conflictResolutions, n.khoa)) {
            issues.push({
                code: 'XUNG_DOT_CHUA_GIAI',
                severity: 'warning',
                path: n.khoa,
                message: `Nhóm "${n.khoa}" có ${n.moduleIds.length} module cùng tác động. ` +
                    'Giữ nguyên cả nhóm theo thứ tự prompt_order của tác giả preset.',
                details: { moduleIds: n.moduleIds, chienLuoc: n.chienLuoc },
            });
        }
    }
    return { dat: !issues.some((i) => i.severity === 'error'), issues };
}
/**
 * Một giao dịch kích hoạt — 65.4.
 *
 * 1. Compile lại bằng version đã chọn (người gọi truyền `row` của version ấy).
 * 2. Chạy toàn bộ lint/test tĩnh.
 * 3. Lưu activation mới.
 * 4. Đổi con trỏ active atomically (người gọi ghi một hàng, không sửa hàng cũ).
 * 5. [BB] Không viết lại lịch sử, lorebook hay world state.
 */
export function kichHoat(dv) {
    const lint = lintTruocKhiBat(dv.row, dv);
    if (!lint.dat)
        return { ok: false, issues: lint.issues };
    const activation = PresetActivationSchema.parse({
        id: `act.${bam(`${dv.row.packId}|${dv.row.version}|${dv.branchId}|${dv.activatedAt}`)}`,
        packId: dv.row.packId,
        packVersion: dv.row.version,
        saveId: dv.saveId,
        branchId: dv.branchId,
        targets: [...dv.targets],
        selectedModuleIds: [...dv.selectedModuleIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
        normalizedParams: undefined,
        conflictResolutions: { ...dv.conflictResolutions },
        previousActivationId: dv.previousActivationId,
        activatedAt: dv.activatedAt,
    });
    return { ok: true, activation, issues: lint.issues };
}
/**
 * Hoàn tác — 65.4.
 *
 * Trả về id activation trước đó, hoặc `null` nghĩa là "về prompt native". Không
 * có nhánh nào ở đây đụng tới pack, raw source hay lịch sử: hoàn tác một lần và
 * hoàn tác một trăm lần đều chỉ là đọc một trường.
 */
export function hoanTac(hienTai) {
    if (hienTai === null)
        return { veActivationId: null, veNative: true };
    return {
        veActivationId: hienTai.previousActivationId,
        veNative: hienTai.previousActivationId === null,
    };
}
/**
 * Áp một activation lên pack: trả bản pack chỉ còn module đã chọn.
 *
 * Bản gốc không bị sửa. Đây là hàm mà compiler nên nhận đầu vào — nhờ vậy "tắt
 * pack" chỉ là **không gọi hàm này**, và prompt native quay lại nguyên vẹn.
 */
export function apActivation(row, act) {
    if (act === null || act.packId !== row.packId) {
        return { ...row.pack, modules: row.pack.modules.map((m) => ({ ...m, enabled: false })) };
    }
    const chon = new Set(act.selectedModuleIds);
    return { ...row.pack, modules: row.pack.modules.map((m) => ({ ...m, enabled: chon.has(m.id) })) };
}
/**
 * Diff giữa hai version của cùng pack — 65.5.
 *
 * Sáu chiều đặc tả nêu: module id, order, enabled, content hash, macro, parameter,
 * extension. Diff theo **id** chứ không theo vị trí: một module chèn vào giữa
 * không được làm mọi module sau nó hiện là "đã đổi".
 */
export function diffPack(cu, moi) {
    const a = new Map(cu.pack.modules.map((m) => [m.sourceIdentifier, m]));
    const b = new Map(moi.pack.modules.map((m) => [m.sourceIdentifier, m]));
    const moduleDiff = [];
    for (const [src, m] of b) {
        const truoc = a.get(src);
        if (truoc === undefined) {
            moduleDiff.push({ moduleId: m.id, loai: 'them', truoc: '', sau: m.name });
            continue;
        }
        if (truoc.order !== m.order) {
            moduleDiff.push({
                moduleId: m.id,
                loai: 'doi_order',
                truoc: String(truoc.order),
                sau: String(m.order),
            });
        }
        if (truoc.enabled !== m.enabled) {
            moduleDiff.push({
                moduleId: m.id,
                loai: 'doi_enabled',
                truoc: String(truoc.enabled),
                sau: String(m.enabled),
            });
        }
        const ha = bam(truoc.content);
        const hb = bam(m.content);
        if (ha !== hb)
            moduleDiff.push({ moduleId: m.id, loai: 'doi_noi_dung', truoc: ha, sau: hb });
        const ma = truoc.macroRefs.join(',');
        const mb = m.macroRefs.join(',');
        if (ma !== mb)
            moduleDiff.push({ moduleId: m.id, loai: 'doi_macro', truoc: ma, sau: mb });
    }
    for (const [src, m] of a) {
        if (!b.has(src))
            moduleDiff.push({ moduleId: m.id, loai: 'bo', truoc: m.name, sau: '' });
    }
    const thamSoDoi = [];
    const ta = new Map(cu.thamSo.map((t) => [t.truong, t.raw]));
    const tb = new Map(moi.thamSo.map((t) => [t.truong, t.raw]));
    for (const [k, v] of tb) {
        const truoc = ta.get(k);
        if (JSON.stringify(truoc) !== JSON.stringify(v))
            thamSoDoi.push({ truong: k, truoc, sau: v });
    }
    for (const [k, v] of ta)
        if (!tb.has(k))
            thamSoDoi.push({ truong: k, truoc: v, sau: undefined });
    const ea = new Set(cu.quarantined.map((q) => q.hash));
    const eb = new Set(moi.quarantined.map((q) => q.hash));
    const extensionDoi = [
        ...moi.quarantined.filter((q) => !ea.has(q.hash)).map((q) => `+ ${q.ten}`),
        ...cu.quarantined.filter((q) => !eb.has(q.hash)).map((q) => `- ${q.ten}`),
    ].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    moduleDiff.sort((x, y) => x.moduleId !== y.moduleId ? (x.moduleId < y.moduleId ? -1 : 1) : x.loai < y.loai ? -1 : 1);
    return { moduleDiff, thamSoDoi, extensionDoi };
}
/**
 * Số version cho một lần nhập mới của cùng pack — 65.5.
 *
 * Cùng hash → không tạo bản trùng (bắt ở bước 3 của pipeline). Khác hash → version
 * mới, và [BB] **không ghi đè version cũ**: activation cũ tiếp tục trỏ bản cũ tới
 * khi người dùng chủ động nâng.
 */
export function versionKeTiep(daCo) {
    return daCo.reduce((max, r) => Math.max(max, r.version), 0) + 1;
}
