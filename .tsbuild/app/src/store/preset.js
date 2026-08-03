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
import { apTransform, apPromptTransform, bienRegex } from '../core/preset/sandbox.js';
import { apInPromptRegex, apInPromptRegexMessages, captureFromOutput, replaceTagsInPrompt, } from '../core/preset/adapterMerge.js';
import { docChiThiScene } from '../core/preset/scriptAdapter.js';
import { giaiMacro } from '../core/preset/macro.js';
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
function rowsDangBat(thuVien, dangBat, thuTuBat) {
    const viTri = new Map(thuTuBat.map((id, i) => [id, i]));
    return thuVien
        .filter((row) => dangBat[row.packId]?.packVersion === row.version)
        .sort((a, b) => {
        const va = viTri.get(a.packId) ?? Number.MAX_SAFE_INTEGER;
        const vb = viTri.get(b.packId) ?? Number.MAX_SAFE_INTEGER;
        if (va !== vb)
            return va - vb;
        const aa = dangBat[a.packId];
        const ab = dangBat[b.packId];
        return (aa?.activatedAt ?? 0) - (ab?.activatedAt ?? 0) || a.packId.localeCompare(b.packId);
    });
}
const TRUONG_GEN = [
    'temperature',
    'topP',
    'topK',
    'topA',
    'minP',
    'repetitionPenalty',
    'presencePenalty',
    'frequencyPenalty',
    'maxOutputTokens',
    'stopSequences',
    'seed',
    'continuePrefill',
    'reasoningEffort',
    'verbosity',
];
function apThongSoPack(thuVien, dangBat, thuTuBat, nen) {
    const gop = { ...nen };
    for (const row of rowsDangBat(thuVien, dangBat, thuTuBat)) {
        const gen = row.pack.generation;
        if (!gen)
            continue;
        for (const k of TRUONG_GEN) {
            const v = gen[k];
            if (v !== undefined)
                gop[k] = v;
        }
        if (gen.maxContext !== undefined)
            gop['contextLimit'] = gen.maxContext;
    }
    useAi.getState().suaEndpoint('narrator', { params: gop });
}
function paramsNenCua(dangBat, thuTuBat) {
    for (const id of thuTuBat) {
        const p = dangBat[id]?.normalizedParams;
        if (p !== undefined)
            return { ...p };
    }
    const p = Object.values(dangBat)
        .sort((a, b) => a.activatedAt - b.activatedAt || a.id.localeCompare(b.id))
        .find((a) => a.normalizedParams !== undefined)?.normalizedParams;
    return { ...(p ?? useAi.getState().cfg.narrator.params) };
}
export const usePreset = create((set, get) => ({
    thuVien: [],
    dangBat: {},
    thuTuBat: [],
    bien: {},
    xungDot: {},
    wizard: wizardMoi(),
    baoCao: null,
    loiBat: [],
    capturedData: {},
    regexDaTat: [],
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
            const thuTuBat = [...acts]
                .sort((a, b) => a.activatedAt - b.activatedAt || a.id.localeCompare(b.id))
                .map((a) => a.packId);
            set({ thuVien, dangBat, thuTuBat, bien, branchId, daNap: true, regexDaTat: [] });
            if (acts.length > 0)
                apThongSoPack(thuVien, dangBat, thuTuBat, paramsNenCua(dangBat, thuTuBat));
        }
        catch {
            // Đĩa hỏng không được giết app: chơi bằng prompt native vẫn là đường hợp lệ.
            set({ thuVien: [], dangBat: {}, thuTuBat: [], bien: {}, branchId, daNap: true, regexDaTat: [] });
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
        const thuTuBat = [...get().thuTuBat.filter((id) => id !== packId), packId];
        const nen = paramsNenCua(get().dangBat, get().thuTuBat);
        const activation = { ...kq.activation, normalizedParams: nen };
        if (coIndexedDb()) {
            try {
                await ghiKichHoat(layDb(), activation);
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
            dangBat: { ...get().dangBat, [packId]: activation },
            thuTuBat,
            bien: {
                ...get().bien,
                [packId]: get().bien[packId] ?? { ...row.pack.variables },
            },
            capturedData: row.pack.variables['stored_data'] !== null &&
                typeof row.pack.variables['stored_data'] === 'object' &&
                !Array.isArray(row.pack.variables['stored_data'])
                ? { ...get().capturedData, ...row.pack.variables['stored_data'] }
                : get().capturedData,
            loiBat: [],
        });
        const dangBatMoi = { ...get().dangBat, [packId]: activation };
        // Mọi lớp (module, transform, adapter, generation) dùng cùng một thứ tự.
        set({ dangBat: dangBatMoi, thuTuBat });
        apThongSoPack(get().thuVien, dangBatMoi, thuTuBat, nen);
        return true;
    },
    async tat(packId) {
        const nen = paramsNenCua(get().dangBat, get().thuTuBat);
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
        const thuTuBat = get().thuTuBat.filter((id) => id !== packId);
        // [BB] 65.4 — tắt pack trả về prompt native. Biến KHÔNG bị xóa: bật lại thì
        // trạng thái cũ còn đó, và mất nó là mất tiến trình chơi của người dùng.
        set({ dangBat: con, thuTuBat, loiBat: [] });
        apThongSoPack(get().thuVien, con, thuTuBat, nen);
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
            const dangBat = { ...get().dangBat, [packId]: truoc };
            const thuTuBat = [...get().thuTuBat.filter((id) => id !== packId), packId];
            set({ dangBat, thuTuBat });
            apThongSoPack(get().thuVien, dangBat, thuTuBat, paramsNenCua(dangBat, thuTuBat));
        }
        catch {
            /* bỏ qua */
        }
    },
    async xoaKhoiThuVien(packId) {
        const nen = paramsNenCua(get().dangBat, get().thuTuBat);
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
        const thuVien = get().thuVien.filter((r) => r.packId !== packId);
        const thuTuBat = get().thuTuBat.filter((id) => id !== packId);
        set({ thuVien, dangBat: con, thuTuBat, bien: b });
        apThongSoPack(thuVien, con, thuTuBat, nen);
    },
    packChoLuot() {
        const dangBat = get().dangBat;
        const ra = [];
        for (const row of rowsDangBat(get().thuVien, dangBat, get().thuTuBat)) {
            const act = dangBat[row.packId];
            if (act === undefined || act.packVersion !== row.version)
                continue;
            // Biến của nhánh ghi đè biến khai trong file: file cấp giá trị KHỞI ĐẦU,
            // ván chơi cấp giá trị HIỆN TẠI.
            const bien = { ...row.pack.variables, ...(get().bien[row.packId] ?? {}) };
            const override = bien['__module_enabled'];
            let activation = act;
            if (override !== null && typeof override === 'object' && !Array.isArray(override)) {
                const chon = new Set(act.selectedModuleIds);
                for (const m of row.pack.modules) {
                    const v = override[m.sourceIdentifier];
                    if (v === true)
                        chon.add(m.id);
                    else if (v === false)
                        chon.delete(m.id);
                }
                activation = { ...act, selectedModuleIds: [...chon] };
            }
            ra.push({ row: { ...row, pack: { ...row.pack, variables: bien } }, activation });
        }
        return ra;
    },
    transformDangBat() {
        const ra = [];
        for (const row of rowsDangBat(get().thuVien, get().dangBat, get().thuTuBat)) {
            for (const t of row.transformDefs) {
                // [BB] 64.1 — chỉ transform đã được đưa về `sandboxed` mới chạy được.
                if (t.activation === 'sandboxed')
                    ra.push(t);
            }
        }
        return ra;
    },
    hienThi(vanBan, ctx = {}) {
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
            daTat: new Set(get().regexDaTat),
            placement: 2,
            destination: 'display',
            depth: 0,
            thayMacro: (text, t) => giaiMacro(text, {
                char: '',
                user: ctx.user ?? '',
                persona: ctx.user ?? '',
                description: '',
                lastUserMessage: '',
                sceneId: ctx.sceneId ?? 'display',
                moduleId: t.id,
                turn: ctx.turn ?? 0,
                maxDepth: TUNING_MAC_DINH.preset.maxMacroDepth,
                bien: {},
            }).text,
        });
        if (kq.quaCham.length > 0 || kq.issues.length > 0) {
            set({
                regexDaTat: [...new Set([...get().regexDaTat, ...kq.quaCham])],
                loiBat: [...get().loiBat, ...kq.issues].slice(-80),
            });
        }
        return kq.text;
    },
    transformPrompt(vanBan, placement = 1, depth = 0) {
        const ds = get().transformDangBat();
        if (ds.length === 0)
            return vanBan;
        const kq = apPromptTransform({
            text: vanBan,
            transforms: ds,
            maxRegexMs: TUNING_MAC_DINH.preset.maxRegexMs,
            dongHo: () => performance.now(),
            daTat: new Set(get().regexDaTat),
            placement,
            depth,
        });
        if (kq.quaCham.length > 0 || kq.issues.length > 0) {
            set({
                regexDaTat: [...new Set([...get().regexDaTat, ...kq.quaCham])],
                loiBat: [...get().loiBat, ...kq.issues].slice(-80),
            });
        }
        return kq.text;
    },
    lichSuChoPrompt(canh) {
        const adapters = rowsDangBat(get().thuVien, get().dangBat, get().thuTuBat).flatMap((row) => (row.scriptAdapters ?? []).filter((a) => a.batONguon && a.kind === 'prompt_merge'));
        const cfg = adapters.at(-1)?.config ?? {};
        const h = cfg['chat_history'];
        const hc = h !== null && typeof h === 'object' && !Array.isArray(h) ? h : {};
        const userLabel = typeof cfg['user'] === 'string' ? cfg['user'] : 'Người chơi';
        const assistantLabel = typeof cfg['assistant'] === 'string' ? cfg['assistant'] : 'Trợ lý';
        const systemLabel = typeof cfg['system'] === 'string' ? cfg['system'] : 'Hệ thống';
        const userPrefix = typeof hc['user_prefix'] === 'string' ? hc['user_prefix'] : `${userLabel}: `;
        const userSuffix = typeof hc['user_suffix'] === 'string' ? hc['user_suffix'] : '';
        const assistantPrefix = typeof hc['assistant_prefix'] === 'string' ? hc['assistant_prefix'] : `${assistantLabel}: `;
        const assistantSuffix = typeof hc['assistant_suffix'] === 'string' ? hc['assistant_suffix'] : '';
        const systemPrefix = typeof hc['system_prefix'] === 'string' ? hc['system_prefix'] : `${systemLabel}: `;
        const systemSuffix = typeof hc['system_suffix'] === 'string' ? hc['system_suffix'] : '';
        const delimiterCfg = cfg['delimiter'];
        const delimiter = typeof hc['message_separator'] === 'string'
            ? hc['message_separator']
            : delimiterCfg !== null &&
                typeof delimiterCfg === 'object' &&
                !Array.isArray(delimiterCfg) &&
                typeof delimiterCfg['value'] === 'string'
                ? delimiterCfg['value']
                : '\n\n';
        return canh
            .slice(-20)
            .map((d, i, all) => {
            const depth = all.length - 1 - i;
            const placement = d.loai === 'nguoi_choi' ? 1 : 2;
            const text = get().transformPrompt(d.noiDung, placement, depth);
            if (d.loai === 'he_thong')
                return `${systemPrefix}${text}${systemSuffix}`;
            return placement === 1
                ? `${userPrefix}${text}${userSuffix}`
                : `${assistantPrefix}${text}${assistantSuffix}`;
        })
            .join(delimiter);
    },
    xuLyOutput(vanBan) {
        const adapters = rowsDangBat(get().thuVien, get().dangBat, get().thuTuBat).flatMap((row) => (row.scriptAdapters ?? []).filter((a) => a.batONguon));
        let out = vanBan;
        if (adapters.some((a) => a.kind === 'cot_cleanup')) {
            out = out.replace(/<(thinking|think|reasoning)>[\s\S]*?<\/\1>/gi, '').trim();
        }
        for (const a of adapters.filter((x) => x.kind === 'prompt_merge')) {
            const stop = a.config['stop_string'];
            if (typeof stop !== 'string' || stop.trim() === '')
                continue;
            const rx = bienRegex(stop);
            if (rx === null)
                continue;
            rx.re.lastIndex = 0;
            const m = rx.re.exec(out);
            if (m !== null)
                out = out.slice(0, m.index);
        }
        return out.trim();
    },
    apAdapter(vanBan) {
        // 1. Tag replace — thêm dữ liệu đã capture vào prompt
        let kq = replaceTagsInPrompt(vanBan, get().capturedData);
        // 2. In-prompt regex — parse và chạy `<regex>` blocks bên trong prompt
        const regex = apInPromptRegex(kq, {
            maxRegexMs: TUNING_MAC_DINH.preset.maxRegexMs,
            dongHo: () => performance.now(),
        });
        kq = regex.text;
        if (regex.errors.length > 0) {
            set({
                loiBat: [
                    ...get().loiBat,
                    ...regex.errors.map((message) => ({
                        code: 'IN_PROMPT_REGEX_LOI',
                        severity: 'warning',
                        path: 'adapter_merge',
                        message,
                        details: {},
                    })),
                ].slice(-80),
            });
        }
        return kq;
    },
    apAdapterMessages(messages) {
        const captured = get().capturedData;
        const daThayTag = messages.map((m) => m.moduleId.startsWith('td:') ? m : { ...m, content: replaceTagsInPrompt(m.content, captured) });
        const regex = apInPromptRegexMessages(daThayTag, {
            maxRegexMs: TUNING_MAC_DINH.preset.maxRegexMs,
            dongHo: () => performance.now(),
        });
        if (regex.errors.length > 0) {
            set({
                loiBat: [
                    ...get().loiBat,
                    ...regex.errors.map((message) => ({
                        code: 'IN_PROMPT_REGEX_LOI',
                        severity: 'warning',
                        path: 'adapter_merge',
                        message,
                        details: {},
                    })),
                ].slice(-80),
            });
        }
        return regex.messages;
    },
    captureOutput(output, tick = 0) {
        // Lấy capture rules từ biến pack
        const bien = get().bien;
        const packBat = rowsDangBat(get().thuVien, get().dangBat, get().thuTuBat).map((row) => row.packId);
        const rules = [];
        for (const packId of packBat) {
            const packBien = bien[packId] ?? {};
            const captureRules = packBien['capture_rules'];
            if (Array.isArray(captureRules)) {
                for (const r of captureRules) {
                    if (r && typeof r === 'object' && 'regex' in r && 'tag' in r) {
                        rules.push(r);
                    }
                }
            }
        }
        if (rules.length > 0) {
            // Kiểm tra công tắc toàn cục
            let globalEnabled = true;
            for (const packId of packBat) {
                const packBien = bien[packId] ?? {};
                if (packBien['capture_enabled'] === false) {
                    globalEnabled = false;
                    break;
                }
            }
            if (globalEnabled) {
                const { data, changed } = captureFromOutput(output, rules, get().capturedData);
                if (changed)
                    set({ capturedData: data });
            }
        }
        const chiThi = docChiThiScene(output);
        if (Object.keys(chiThi).length === 0)
            return;
        const bienMoi = { ...get().bien };
        let daDoi = false;
        for (const row of rowsDangBat(get().thuVien, get().dangBat, get().thuTuBat)) {
            const adapters = (row.scriptAdapters ?? []).filter((a) => a.batONguon && a.kind === 'scene_switch');
            if (adapters.length === 0)
                continue;
            const override = {
                ...(bienMoi[row.packId]?.['__module_enabled'] ?? {}),
            };
            let rowDaDoi = false;
            for (const a of adapters) {
                const map = a.config['sceneMap'];
                if (map === null || typeof map !== 'object' || Array.isArray(map))
                    continue;
                for (const [key, enabled] of Object.entries(chiThi)) {
                    const sourceId = map[key];
                    if (typeof sourceId === 'string') {
                        override[sourceId] = enabled;
                        rowDaDoi = true;
                        daDoi = true;
                    }
                }
            }
            if (rowDaDoi)
                bienMoi[row.packId] = { ...(bienMoi[row.packId] ?? {}), __module_enabled: override };
        }
        if (!daDoi)
            return;
        set({ bien: bienMoi });
        if (coIndexedDb()) {
            for (const [packId, vars] of Object.entries(bienMoi)) {
                if (get().dangBat[packId] !== undefined)
                    void ghiBienPack(layDb(), packId, get().branchId, vars, tick).catch(() => {
                        // Biến trong phiên vẫn đúng; lỗi đĩa không được làm hỏng lượt kể.
                    });
            }
        }
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
