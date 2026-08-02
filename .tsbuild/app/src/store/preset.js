/**
 * Store Preset — Xưởng Preset của Phần 66, Phase 11.
 *
 * ── Việc store này làm, và việc nó KHÔNG làm ──
 *
 * Nó giữ thư viện pack, trạng thái wizard, activation đang chạy và biến của
 * pack. Nó **không** quyết định luật: `nhapPreset()`, `lintTruocKhiBat()` và
 * `kichHoat()` ở `core/preset/` mới là nơi ấy, và chúng thuần nên test được mà
 * không cần trình duyệt.
 *
 * ── Ba ranh giới không được nhòe ──
 *
 * 1. [BB] Nhập ≠ kích hoạt. `nhap()` chỉ ghi thư viện. `bat()` là một giao dịch
 *    riêng, và nó chạy lint trước khi ghi bất cứ thứ gì.
 * 2. [BB] 66.6 — biến pack sống trong namespace của pack, theo NHÁNH, và không
 *    có hàm nào ở đây ghi chúng vào `WorldState`.
 * 3. [BB] 64.2 — script bị cách ly không có nút bật. Chúng chỉ hiện ra kèm
 *    đường port native tương ứng, để người dùng biết app đã làm thay việc gì.
 */
import { create } from 'zustand';
import { TUNING_MAC_DINH } from '../core/tuning/schema.js';
import { nhapPreset } from '../core/preset/nhap.js';
import { viewGia, sceneGia } from '../core/preset/giaLap.js';
import { R } from '../core/registry/index.js';
import { useAi } from './ai.js';
import { wizardMoi, napKetQua, diToi, datChon, giaiMotXungDot, baoCaoNhap } from '../core/preset/wizard.js';
import { kichHoat, lintTruocKhiBat, hoanTac, versionKeTiep } from '../core/preset/kichHoat.js';
import { apTransform } from '../core/preset/sandbox.js';
import { coIndexedDb, layDb } from '../db/instance.js';
import { ghiPack, docThuVien, xoaPack, ghiKichHoat, docKichHoatDangChay, goKichHoat, docBienPack, ghiBienPack, } from '../db/preset.js';
/**
 * Profile của model Tường Thuật đang cấu hình.
 *
 * Khớp theo `khop.chua` của registry; không khớp thì rơi về `khong_ro`, và
 * `khong_ro` cố ý có trần thấp — clamp chặt hơn thực tế thì mất vài token, clamp
 * lỏng hơn thực tế thì call hỏng giữa ván chơi.
 */
function profileHienTai() {
    const modelId = useAi.getState().cfg.narrator.modelId.toLowerCase();
    for (const d of R.profile.tatCa()) {
        if (d.profile.khop.chua.some((k) => modelId.includes(k.toLowerCase())))
            return d.profile;
    }
    const macDinh = R.profile.lay('khong_ro');
    if (macDinh !== undefined)
        return macDinh.profile;
    const dau = R.profile.tatCa()[0];
    if (dau === undefined)
        throw new Error('Registry profile rỗng — napDungSan() chưa chạy.');
    return dau.profile;
}
function dat(o, duong, giaTri) {
    const phan = duong.split('.').filter((s) => s !== '');
    if (phan.length === 0)
        return;
    let cur = o;
    for (let i = 0; i < phan.length - 1; i++) {
        const k = phan[i];
        // [BB] Chống prototype pollution — cùng hàng rào với `manifest.ts`.
        if (k === '__proto__' || k === 'constructor' || k === 'prototype')
            return;
        const tiep = cur[k];
        if (tiep === null || typeof tiep !== 'object' || Array.isArray(tiep))
            cur[k] = {};
        cur = cur[k];
    }
    const cuoi = phan[phan.length - 1];
    if (cuoi === '__proto__' || cuoi === 'constructor' || cuoi === 'prototype')
        return;
    cur[cuoi] = giaTri;
}
function doc(o, duong) {
    let cur = o;
    for (const k of duong.split('.').filter((s) => s !== '')) {
        if (cur === null || typeof cur !== 'object')
            return undefined;
        cur = cur[k];
    }
    return cur;
}
export const usePreset = create((set, get) => ({
    thuVien: [],
    dangBat: {},
    bien: {},
    xungDot: {},
    wizard: wizardMoi(),
    baoCao: null,
    loiBat: [],
    branchId: '',
    daNap: false,
    async napTuDia(branchId) {
        if (!coIndexedDb()) {
            set({ daNap: true, branchId });
            return;
        }
        try {
            const db = layDb();
            const thuVien = await docThuVien(db);
            const acts = await docKichHoatDangChay(db, branchId);
            const dangBat = {};
            const bien = {};
            for (const a of acts) {
                dangBat[a.packId] = a;
                bien[a.packId] = await docBienPack(db, a.packId, branchId);
            }
            set({ thuVien, dangBat, bien, branchId, daNap: true });
        }
        catch {
            // Đĩa hỏng không được giết app: chơi bằng prompt native vẫn là đường hợp lệ.
            set({ thuVien: [], dangBat: {}, bien: {}, branchId, daNap: true });
        }
    },
    async doiNhanh(branchId) {
        if (get().branchId === branchId)
            return;
        // Activation và biến đều theo nhánh, nên đổi nhánh là nạp lại từ đầu — KHÔNG
        // mang trạng thái cũ sang, đó là đường rò rỉ giữa hai nhánh.
        await get().napTuDia(branchId);
    },
    doThu(ten, noiDung, tick) {
        const daNhap = new Map();
        for (const r of get().thuVien) {
            daNhap.set(r.pack.envelope.sourceHash, { packId: r.packId, version: r.version });
        }
        const kq = nhapPreset({
            tenNguon: ten,
            noiDung,
            tick,
            tuning: TUNING_MAC_DINH,
            daNhap,
            /*
             * Profile của model ĐANG dùng, không phải một profile mẫu.
             *
             * [BB] 62.4 — tham số của preset được giữ raw rồi clamp theo `ModelProfile`
             * + Probe. Clamp theo một profile khác model thật sẽ cho ra bảng diff sai
             * ở màn 6 của wizard, và người dùng sẽ tin vào con số không đúng với máy họ.
             */
            profile: profileHienTai(),
            viewGia: viewGia(),
            sceneGia: sceneGia(),
        });
        set({
            wizard: napKetQua(get().wizard, kq),
            baoCao: baoCaoNhap(kq, false),
        });
    },
    diManWizard(man) {
        set({ wizard: diToi(get().wizard, man) });
    },
    chonModule(ids) {
        set({ wizard: datChon(get().wizard, ids) });
    },
    giaiXungDot(packId, khoa, chon) {
        set({
            wizard: giaiMotXungDot(get().wizard, khoa, chon),
            xungDot: { ...get().xungDot, [packId]: { ...(get().xungDot[packId] ?? {}), [khoa]: chon } },
        });
    },
    async nhapVaoThuVien() {
        const w = get().wizard;
        const kq = w.ketQua;
        if (kq?.row == null || kq.rawSource == null)
            return;
        // Nhập lại đúng file cũ không tạo bản trùng (65.5); khác hash thì version mới.
        const cungPack = get().thuVien.filter((r) => r.packId === kq.row?.packId);
        const row = { ...kq.row, version: versionKeTiep(cungPack) };
        if (coIndexedDb()) {
            try {
                await ghiPack(layDb(), row, kq.rawSource);
            }
            catch {
                /* thư viện trong bộ nhớ vẫn dùng được cho phiên này */
            }
        }
        set({
            thuVien: [row, ...get().thuVien.filter((r) => !(r.packId === row.packId && r.version === row.version))],
            wizard: { ...w, daNhapThuVien: true },
            baoCao: baoCaoNhap(kq, false),
        });
    },
    dongWizard() {
        set({ wizard: wizardMoi() });
    },
    async bat(packId, saveId, tick) {
        const row = get().thuVien.find((r) => r.packId === packId);
        if (row === undefined)
            return false;
        const w = get().wizard;
        /*
         * Chưa chọn gì thì bật những module mà NGUỒN khai là đang bật, và app chạy được.
         *
         * [BB] 63.3 — nguồn ấy là `order[].enabled`, và `chuanHoa()` đã ghi kết quả
         * vào `module.enabled`. Đọc `prompts[].enabled` ở đây sẽ bật sai 21 module
         * của fixture A, đúng thứ PRESET_COMPAT.md tồn tại để nhắc.
         *
         * [BB] 64.1 — `adapted` là một trạng thái HOẠT ĐỘNG, không phải một dạng bị
         * tắt. Bản đầu của Phase 11 chỉ nhận `native` và bỏ 174 module `adapted` của
         * fixture A — đúng nghĩa "nhập vào rồi không dùng được", tức là lại rơi vào
         * cái hố mà cả phase này sinh ra để lấp. Ba trạng thái bị loại dưới đây là ba
         * trạng thái mà `locModuleChoPipeline()` cũng loại, nên hai chỗ không lệch nhau.
         */
        const BI_LOAI = new Set(['quarantined', 'needs_adapter', 'disabled']);
        const chon = w.ketQua?.row?.packId === packId && w.chonModuleIds.length > 0
            ? w.chonModuleIds
            : row.pack.modules.filter((m) => m.enabled && !BI_LOAI.has(m.activation)).map((m) => m.id);
        // Lựa chọn xung đột lấy theo PACK, nên nó còn nguyên sau khi đóng wizard.
        const giai = get().xungDot[packId] ?? {};
        const lint = lintTruocKhiBat(row, { selectedModuleIds: chon, conflictResolutions: giai });
        if (!lint.dat) {
            set({ loiBat: lint.issues });
            return false;
        }
        const kq = kichHoat({
            row,
            saveId,
            branchId: get().branchId,
            targets: ['narrator'],
            selectedModuleIds: chon,
            conflictResolutions: giai,
            activatedAt: tick,
            previousActivationId: get().dangBat[packId]?.id ?? null,
        });
        if (!kq.ok) {
            set({ loiBat: kq.issues });
            return false;
        }
        if (coIndexedDb()) {
            try {
                await ghiKichHoat(layDb(), kq.activation);
                // Biến khởi tạo của pack chỉ được ghi khi CHƯA có bản của nhánh này —
                // bật lại một pack không được xóa trạng thái người chơi đã tích lũy.
                const daCo = await docBienPack(layDb(), packId, get().branchId);
                if (Object.keys(daCo).length === 0 && Object.keys(row.pack.variables).length > 0) {
                    await ghiBienPack(layDb(), packId, get().branchId, { ...row.pack.variables }, tick);
                }
            }
            catch {
                /* bật trong phiên này vẫn có hiệu lực */
            }
        }
        set({
            dangBat: { ...get().dangBat, [packId]: kq.activation },
            bien: {
                ...get().bien,
                [packId]: get().bien[packId] ?? { ...row.pack.variables },
            },
            loiBat: [],
        });
        return true;
    },
    async tat(packId) {
        if (coIndexedDb()) {
            try {
                await goKichHoat(layDb(), packId, get().branchId);
            }
            catch {
                /* bỏ qua */
            }
        }
        const con = { ...get().dangBat };
        delete con[packId];
        // [BB] 65.4 — tắt pack trả về prompt native. Biến KHÔNG bị xóa: bật lại thì
        // trạng thái cũ còn đó, và mất nó là mất tiến trình chơi của người dùng.
        set({ dangBat: con, loiBat: [] });
    },
    async luiMotBuoc(packId) {
        const act = get().dangBat[packId];
        const ve = hoanTac(act ?? null);
        if (ve.veNative || ve.veActivationId === null) {
            await get().tat(packId);
            return;
        }
        if (!coIndexedDb())
            return;
        try {
            const truoc = await layDb().presetActivations.get(ve.veActivationId);
            if (truoc === undefined) {
                await get().tat(packId);
                return;
            }
            await ghiKichHoat(layDb(), { ...truoc, activatedAt: (act?.activatedAt ?? 0) + 1 });
            set({ dangBat: { ...get().dangBat, [packId]: truoc } });
        }
        catch {
            /* bỏ qua */
        }
    },
    async xoaKhoiThuVien(packId) {
        if (coIndexedDb()) {
            try {
                await xoaPack(layDb(), packId);
            }
            catch {
                /* bỏ qua */
            }
        }
        const con = { ...get().dangBat };
        delete con[packId];
        const b = { ...get().bien };
        delete b[packId];
        set({ thuVien: get().thuVien.filter((r) => r.packId !== packId), dangBat: con, bien: b });
    },
    packChoLuot() {
        const dangBat = get().dangBat;
        const ra = [];
        for (const row of get().thuVien) {
            const act = dangBat[row.packId];
            if (act === undefined || act.packVersion !== row.version)
                continue;
            // Biến của nhánh ghi đè biến khai trong file: file cấp giá trị KHỞI ĐẦU,
            // ván chơi cấp giá trị HIỆN TẠI.
            const bien = { ...row.pack.variables, ...(get().bien[row.packId] ?? {}) };
            ra.push({ row: { ...row, pack: { ...row.pack, variables: bien } }, activation: act });
        }
        return ra;
    },
    transformDangBat() {
        const ra = [];
        for (const row of get().thuVien) {
            if (get().dangBat[row.packId] === undefined)
                continue;
            for (const t of row.transformDefs) {
                // [BB] 64.1 — chỉ transform đã được đưa về `sandboxed` mới chạy được.
                if (t.activation === 'sandboxed')
                    ra.push(t);
            }
        }
        return ra;
    },
    hienThi(vanBan) {
        const ds = get().transformDangBat();
        if (ds.length === 0)
            return vanBan;
        // [BB] 64.3 — chạy trên BẢN SAO hiển thị. Trả về chuỗi mới; không nơi nào
        // trong hàm này chạm tới message, event hay state gốc.
        const kq = apTransform({
            text: vanBan,
            transforms: ds,
            maxRegexMs: TUNING_MAC_DINH.preset.maxRegexMs,
            dongHo: () => performance.now(),
        });
        return kq.text;
    },
    async apBienPack(thayDoi, tick) {
        if (thayDoi.length === 0)
            return;
        const dangBat = Object.keys(get().dangBat);
        if (dangBat.length === 0)
            return;
        /*
         * Không pack nào "sở hữu" một đường dẫn, nên thay đổi áp cho MỌI pack đang
         * bật. Nghe rộng, nhưng đúng: hai pack cùng khai `stat_data.hao_cam` thì cả
         * hai đang nói về cùng một thứ, và giữ hai giá trị khác nhau mới là chỗ sai.
         */
        const bienMoi = { ...get().bien };
        for (const packId of dangBat) {
            const o = { ...(bienMoi[packId] ?? {}) };
            for (const td of thayDoi) {
                if (td.phep === 'add') {
                    const cu = doc(o, td.duong);
                    const so = typeof cu === 'number' ? cu : 0;
                    dat(o, td.duong, typeof td.giaTri === 'number' ? so + td.giaTri : td.giaTri);
                    continue;
                }
                if (td.phep === 'push') {
                    const cu = doc(o, td.duong);
                    dat(o, td.duong, Array.isArray(cu) ? [...cu, td.giaTri] : [td.giaTri]);
                    continue;
                }
                dat(o, td.duong, td.giaTri);
            }
            bienMoi[packId] = o;
        }
        set({ bien: bienMoi });
        if (!coIndexedDb())
            return;
        try {
            for (const packId of dangBat) {
                await ghiBienPack(layDb(), packId, get().branchId, bienMoi[packId] ?? {}, tick);
            }
        }
        catch {
            /* biến trong phiên vẫn đúng */
        }
    },
}));
/** Đọc pack đang bật ngoài React — `useGame` dùng cái này, không dùng hook. */
export function packDangBat() {
    return usePreset.getState().packChoLuot();
}
