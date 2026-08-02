import { TuningSchema } from '../tuning/schema.js';
import { quetDauVetCode, RegistryPackSchema, REGISTRY_IDS } from './manifest.js';
import { coHandler } from './catalog.js';
/**
 * Nhập một world pack đã parse.
 *
 * Không throw, không gọi mạng, không đăng ký gì vào `R` — trả về **kết quả** để
 * người gọi quyết định. Đăng ký là một hành động riêng, sau khi người dùng duyệt.
 */
export function nhapWorldPack(goc) {
    const issues = [];
    const rong = {
        ok: false,
        pack: null,
        muc: [],
        tuning: null,
        issues,
        thongKe: { tong: 0, hoatDong: 0, canAdapter: 0, cachLy: 0 },
    };
    if (goc === null || typeof goc !== 'object' || Array.isArray(goc)) {
        issues.push({
            code: 'PACK_KHONG_PHAI_OBJECT',
            severity: 'error',
            path: '',
            message: 'World pack phải là một object JSON ở mức ngoài cùng.',
            details: {},
        });
        return rong;
    }
    const g = goc;
    if (g._format !== 'thien_dien_world_pack_v1') {
        issues.push({
            code: 'PACK_SAI_FORMAT',
            severity: 'error',
            path: '_format',
            message: 'Thiếu `_format: "thien_dien_world_pack_v1"`. World pack phải khai tường minh — ' +
                'không đoán loại từ hình dạng vì năm loại preset không được trộn (62.1).',
            details: { thay: g._format },
        });
        return rong;
    }
    // ── hàng rào 1: không có gì trông giống code, ở BẤT KỲ đâu trong cây ──
    const vetCode = quetDauVetCode(goc);
    if (vetCode.length > 0) {
        for (const v of vetCode) {
            issues.push({
                code: 'PACK_CO_DAU_VET_CODE',
                severity: 'error',
                path: v.path,
                message: `Phát hiện dấu vết code (${v.code}) tại "${v.path}". World pack là DỮ LIỆU, không phải mã.`,
                details: { loai: v.code },
            });
        }
        return rong;
    }
    // ── hàng rào 2: schema ──
    const r = RegistryPackSchema.safeParse(g.pack);
    if (!r.success) {
        for (const i of r.error.issues) {
            issues.push({
                code: 'PACK_SAI_SCHEMA',
                severity: 'error',
                path: i.path.map(String).join('.'),
                message: i.message,
                details: {},
            });
        }
        return rong;
    }
    const pack = r.data;
    // ── hàng rào 3: registry id phải nằm trong mười hai cái đã khai ──
    const muc = [];
    for (const m of pack.entries) {
        if (!REGISTRY_IDS.includes(m.registry)) {
            muc.push({ manifest: m, trangThai: 'cach_ly', lyDo: `Registry "${m.registry}" không tồn tại.` });
            continue;
        }
        // ── hàng rào 4: handlerId phải tra được trong HandlerCatalog ──
        if (m.handlerId !== '' && !coHandler(m.handlerId)) {
            muc.push({
                manifest: m,
                trangThai: 'can_adapter',
                lyDo: `handlerId "${m.handlerId}" chưa có trong HandlerCatalog. Mục được LƯU nguyên vẹn nhưng ` +
                    'không chạy cho tới khi có adapter native (ADR-0006).',
            });
            continue;
        }
        muc.push({ manifest: m, trangThai: 'hoat_dong', lyDo: '' });
    }
    for (const m of muc.filter((x) => x.trangThai === 'can_adapter')) {
        issues.push({
            code: 'MUC_CAN_ADAPTER',
            severity: 'warning',
            path: m.manifest.id,
            message: m.lyDo,
            details: { handlerId: m.manifest.handlerId },
        });
    }
    for (const m of muc.filter((x) => x.trangThai === 'cach_ly')) {
        issues.push({
            code: 'MUC_CACH_LY',
            severity: 'quarantine',
            path: m.manifest.id,
            message: m.lyDo,
            details: {},
        });
    }
    // ── tuning kèm pack: gộp CÓ SCHEMA (61.4), không Object.assign ──
    let tuning = null;
    if (g.tuning !== undefined) {
        const t = TuningSchema.safeParse(g.tuning);
        if (!t.success) {
            for (const i of t.error.issues) {
                issues.push({
                    code: 'TUNING_PACK_SAI',
                    severity: 'error',
                    path: `tuning.${i.path.map(String).join('.')}`,
                    message: i.message,
                    details: {},
                });
            }
            return { ...rong, pack, muc, issues };
        }
        tuning = t.data;
    }
    const dem = (tt) => muc.filter((m) => m.trangThai === tt).length;
    return {
        ok: !issues.some((i) => i.severity === 'error'),
        pack,
        muc,
        tuning,
        issues,
        thongKe: {
            tong: muc.length,
            hoatDong: dem('hoat_dong'),
            canAdapter: dem('can_adapter'),
            cachLy: dem('cach_ly'),
        },
    };
}
/** Xuất một pack thành đúng một file JSON — đối xứng với `nhapWorldPack`. */
export function xuatWorldPack(pack, tuning) {
    return JSON.stringify(tuning === undefined
        ? { _format: 'thien_dien_world_pack_v1', pack }
        : { _format: 'thien_dien_world_pack_v1', pack, tuning }, null, 2);
}
