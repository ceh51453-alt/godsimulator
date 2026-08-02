import { loi } from '../contracts/errors.js';
export function createRegistry(ten, kiemTra) {
    const dungSan = new Map();
    const pack = new Map();
    const ghiDeMap = new Map();
    const canhBaoList = [];
    // Cache kết quả hợp nhất; xóa mỗi lần có thay đổi.
    let cache = null;
    const xoaCache = () => {
        cache = null;
    };
    const hopNhat = () => {
        if (cache)
            return cache;
        const out = new Map();
        for (const [id, def] of dungSan)
            out.set(id, def);
        for (const [id, { def }] of pack)
            out.set(id, def);
        for (const [id, patch] of ghiDeMap) {
            const duoi = out.get(id);
            if (!duoi)
                continue;
            out.set(id, { ...duoi, ...patch, id });
        }
        cache = out;
        return out;
    };
    const xacThuc = (def, nguon) => {
        if (!kiemTra)
            return def;
        const r = kiemTra(def);
        if (r.ok)
            return r.value;
        for (const e of r.errors) {
            canhBaoList.push(loi('registry', 'REGISTRY_DEF_INVALID', `Mục registry '${ten}' từ ${nguon} không hợp lệ: ${e}`, {
                severity: 'warning',
                path: `${ten}`,
            }));
        }
        return null;
    };
    return {
        ten,
        dangKy(def) {
            if (dungSan.has(def.id)) {
                canhBaoList.push(loi('registry', 'REGISTRY_DUPLICATE', `Mục dựng sẵn '${def.id}' trong '${ten}' bị khai hai lần.`, {
                    severity: 'warning',
                    path: `${ten}.${def.id}`,
                }));
            }
            dungSan.set(def.id, def);
            xoaCache();
        },
        lay(id) {
            return hopNhat().get(id);
        },
        co(id) {
            return hopNhat().has(id);
        },
        danhSachId() {
            // [BB] Sắp xếp deterministic theo codepoint, KHÔNG dùng localeCompare.
            return [...hopNhat().keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
        },
        tatCa() {
            const m = hopNhat();
            return this.danhSachId().map((id) => m.get(id));
        },
        napPack(packId, defs) {
            const loiPack = [];
            for (const def of defs) {
                const ok = xacThuc(def, `pack '${packId}'`);
                if (!ok) {
                    loiPack.push(loi('registry', 'PACK_ENTRY_REJECTED', `Pack '${packId}' có mục '${def.id}' bị từ chối.`, {
                        severity: 'warning',
                        path: `${ten}.${def.id}`,
                    }));
                    continue;
                }
                pack.set(ok.id, { def: ok, packId });
            }
            xoaCache();
            canhBaoList.push(...loiPack);
            return loiPack;
        },
        ghiDe(id, patch) {
            const duoi = hopNhat().get(id);
            if (!duoi) {
                const e = loi('registry', 'OVERRIDE_TARGET_MISSING', `Không có mục '${id}' trong registry '${ten}' để ghi đè.`, {
                    severity: 'warning',
                    path: `${ten}.${id}`,
                });
                canhBaoList.push(e);
                return [e];
            }
            const gop = { ...duoi, ...patch, id };
            const ok = xacThuc(gop, `ghi đè '${id}'`);
            if (!ok) {
                // [BB] Ghi đè hỏng → bỏ ghi đè, giữ tầng dưới, KHÔNG crash.
                const e = loi('registry', 'OVERRIDE_INVALID', `Ghi đè '${id}' trong '${ten}' không hợp lệ; đã bỏ qua.`, {
                    severity: 'warning',
                    path: `${ten}.${id}`,
                });
                canhBaoList.push(e);
                return [e];
            }
            ghiDeMap.set(id, patch);
            xoaCache();
            return [];
        },
        khoiPhuc(id) {
            ghiDeMap.delete(id);
            xoaCache();
        },
        datLai() {
            pack.clear();
            ghiDeMap.clear();
            canhBaoList.length = 0;
            xoaCache();
        },
        canhBao() {
            return canhBaoList;
        },
    };
}
