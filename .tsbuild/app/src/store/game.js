/**
 * Store runtime — Zustand. Phần 3.1.
 *
 * [BB] Luật bất biến #5: UI, Narrator và preset KHÔNG ghi thẳng World.
 * Store này chỉ gọi `apDungEvent`; nó không bao giờ sửa `WorldState` trực tiếp.
 *
 * [BB] ADR-0028 — **không có AI thì không chơi.** Mọi hành động chơi đi qua
 * `doiCong()` trước. Đây không phải một lớp kiểm tra cho vui: engine vẫn chạy
 * được không AI (và test vẫn chứng minh điều đó ở tầng `core/`), nhưng *trò chơi*
 * thì không — vì không có ai kể, và một mô phỏng không lời kể là bảng tính.
 *
 * ── Ai nói câu nào ──
 *
 *   engine  quyết điều gì xảy ra, và giữ mọi con số
 *   AI      kể lại điều đã xảy ra, và chỉ được đổi thế giới qua khối <CapNhat>
 *           đã bị `bocTach()` duyệt
 *
 * Nói cách khác: AI là bắt buộc, nhưng AI không cầm sổ (71.5).
 */
import { create } from 'zustand';
import { SceneSchema } from '../core/contracts/core.js';
import { bienSoanLuot } from '../core/preset/hopNhat.js';
import { parseChoice } from '../core/ai/choice.js';
import { NormalizedGenParamsSchema } from '../core/schema/ai.js';
import { packDangBat, usePreset } from './preset.js';
import { taoState, taoEventLog, hashState } from '../core/engine/state.js';
import { apDungChuoi, apDungEvent } from '../core/engine/transaction.js';
import { chieu } from '../core/project/chieu.js';
import { moTheGioiTrong, KhoiTaoWorldSchema } from '../core/world/khoiTao.js';
import { eventHienDien, eventChuyenTang } from '../core/world/hienDien.js';
import { StartingPresenceDraftSchema } from '../core/schema/player.js';
import { hoSoToiThieu } from '../core/schema/player.js';
import { chieuPersona } from '../core/privacy/project.js';
import { motTick } from '../core/engine/tick.js';
import { chayTienTrinhNen } from '../core/world/process/scheduler.js';
import { eventGieoNen } from '../core/world/gieoNen.js';
import { napBatBienTheGioiSong } from '../core/world/batBien.js';
import { napBatBienTangThan } from '../core/world/batBienThan.js';
import { napBatBienTangPham } from '../core/world/batBienPham.js';
import { banTinCho } from '../core/world/banTin.js';
import { TUNING_MAC_DINH } from '../core/tuning/schema.js';
import { parseIntent } from '../core/intent/parser.js';
import { giaiQuyet } from '../core/intent/resolve.js';
import { goiYChoCanh } from '../core/intent/affordance.js';
import { loi } from '../core/contracts/errors.js';
import { taoEvent } from '../core/engine/transaction.js';
import { traLoiCau, loiCauCho } from '../core/than/cauNguyen.js';
import { dapDiHoa } from '../core/than/diHoa.js';
import { rngCuaTick } from '../core/engine/rng.js';
import { chonChuThe, chuTheMacDinhCho } from '../core/than/chuThe.js';
import { dungSoTay } from '../core/pham/soTay.js';
import { dangODau } from '../core/pham/lich.js';
import { noi as noiMotCau } from '../core/pham/doiThoai.js';
import { xinHoc } from '../core/pham/sinhKe.js';
import { lapHo } from '../core/pham/ho.js';
import { anhLinhHoaThan, duongDiTiep } from '../core/pham/caiChet.js';
import { noiOCua } from '../core/pham/lich.js';
import { bocTach } from '../core/ai/bocTach.js';
import { bienSoanPromptCapNhat } from '../core/ai/capNhat.js';
import { nganSachInput, uocLuong } from '../core/ai/nganSach.js';
import { napBatBienTangTruyen } from '../core/world/batBienTruyen.js';
import { napBatBienPhase10 } from '../core/world/batBienP10.js';
import { ongKinhMoi, chonMucTieu, apOngKinh, datOngKinh, tieuDiem, ongKinhOChoNguoiChoi, } from '../core/truyen/ongKinh.js';
import { hanNgachVangMat } from '../core/truyen/machTruyen.js';
import { raSoatPhucBut, phucButDangTreo, gieoPhucBut } from '../core/truyen/phucBut.js';
import { quaHan } from '../core/schema/truyen.js';
import { dungChiMuc } from '../core/retrieval/chiMuc.js';
import { chayBoDanhGia } from '../core/retrieval/boDanhGia.js';
import { CAU_HINH_HEURISTIC } from '../core/schema/rerank.js';
import { truyHoi, dungBaTruyVan } from '../core/retrieval/truyHoi.js';
import { KhoRerankCache } from '../db/rerankCache.js';
import { coIndexedDb, layDb } from '../db/instance.js';
import { KhoDexie, napState } from '../db/repo.js';
import { danhSachSave, ghiVan, ghiVanNhe, xoaVan, doiTenVan, nhanMacDinh } from '../db/quanLySave.js';
import { xuatSave, nhapSave } from '../db/save.js';
import { capNhatUiState, docUiState } from '../db/preset.js';
import { veSinh, coVet, moTaVet } from '../core/anToan/veSinh.js';
import { datTenTruc, luatNenMacDinh } from '../core/vatly/luatNen.js';
import { quetCoChe } from '../core/vatly/coChe.js';
import { BranchSchema } from '../core/contracts/branch.js';
import { chayDuongOng } from '../core/workflow/chay.js';
import { bienSoanTacVu } from '../core/workflow/bienSoanTacVu.js';
import { PRESET_WORKFLOW, kiemLanRanh } from '../core/workflow/dungSan.js';
import { goiTacVuWorkflow } from '../ai/client.js';
import { nhapLorebook } from '../core/lore/nhap.js';
import { capNhatKyVong, trichKyVong } from '../core/lore/kyVong.js';
import { vatChatHoaLorebook } from '../core/lore/hienThuc.js';
import { giaiDoanLore } from '../core/lore/ejs.js';
import { CauHinhDienHoaSchema, EvolutionLogSchema, baoCaoDienHoa, kiemDieuKienDung, } from '../core/world/dienHoa.js';
import { useAi } from './ai.js';
let demIntent = 0;
let demKe = 0;
let demQuetCoChe = 0;
let demLore = 0;
/**
 * Hàng đợi ghi đĩa — mọi lần `luuVan()` nối đuôi nhau, không chồng nhau.
 *
 * Ở tầng module chứ không trong store: nó là một khóa tuần tự cho **tài nguyên
 * đĩa**, không phải một trạng thái của trò chơi. Nhét nó vào store sẽ làm mọi
 * component render lại mỗi lần một lượt ghi bắt đầu hoặc kết thúc.
 */
let hangDoiLuu = Promise.resolve();
/**
 * Ghi scene (lịch sử chat) xuống bảng `uiState`.
 *
 * Scene không phải dữ liệu thế giới nên KHÔNG vào `WorldState`/`stateHash`.
 * Nó nằm cùng bảng với tab, mục ghim, ảnh chụp Bảng: cùng khóa
 * `[saveId+branchId]`, cùng ranh giới "trạng thái giao diện theo save".
 */
async function luuScene(saveId, branchId, scene) {
    if (!coIndexedDb() || saveId === '')
        return;
    await capNhatUiState(layDb(), saveId, branchId, { scene: [...scene] });
}
const SEED_MAC_DINH = 'thien-dien-0001';
/** Chỉ để ghi vào file xuất cho người đọc; không dùng để quyết định gì. */
const PHIEN_BAN_APP = '3.1.0';
/**
 * Số tick engine cho mỗi lượt Diễn Hóa — [BB] ADR-0019: 4 tick một năm.
 *
 * `vinh_kiep` cố tình dừng ở một thế kỷ chứ không ở "vô hạn": một lượt tua mà
 * người chơi không đoán được nó dài bao nhiêu là một lượt tua không ai dám bấm.
 */
const TICK_MOI_NHIP = Object.freeze({
    nien: 4,
    the_dai: 4 * 30,
    vinh_kiep: 4 * 100,
});
/**
 * Ký tự trên một token cho tiếng Việt có dấu — [BB] 34.2.
 *
 * Đây là ước lượng ban đầu; `tuHieuChinh()` chỉnh nó theo `usage.prompt_tokens`
 * thật sau năm lượt lệch quá 12%. Con số 4 của tiếng Anh sai ở đây hàng chục
 * phần trăm, và sai theo hướng nào cũng tệ.
 */
const TY_LE_TOKEN = 3.2;
/**
 * Hạn trả mặc định cho phục bút do Narrator gieo, tính bằng tick.
 *
 * Engine đặt, không phải model. [BB] 30.2 dùng hạn này để quyết khi nào đẩy phục
 * bút lên đầu context và khi nào biến nó thành bí ẩn — cả hai đều là quyết định
 * gameplay, nên chúng không được để model tự khai.
 */
const HAN_TRA_MAC_DINH = 60;
/**
 * Cảnh đã kể trong phiên, chỉ để đo hạn ngạch vắng mặt (28.6).
 *
 * KHÔNG nằm trong `WorldState`: nó đo cách trò chơi được KỂ, không đo thế giới.
 * Nhét nó vào state sẽ làm `stateHash` đổi theo việc người chơi đã xem gì —
 * đúng loại lỗi mà ADR-0028 đã tránh cho trạng thái ngắt mạch.
 */
const canhDaKe = [];
/**
 * Đọc cache rerank. Mất IndexedDB thì coi như trượt cache — không phải lỗi.
 *
 * [BB] 77.8 — cache CHỈ chứa id/rank/score. Nó không giữ text, không giữ mật
 * khẩu, và `configHash` đã cắt secret trước khi băm.
 */
async function docCacheRerank(k, tick) {
    if (!coIndexedDb())
        return undefined;
    try {
        return await new KhoRerankCache(layDb()).doc(k, tick);
    }
    catch {
        return undefined;
    }
}
async function ghiCacheRerank(k, kq, tick, ttlTicks) {
    if (!coIndexedDb())
        return;
    try {
        await new KhoRerankCache(layDb()).ghi(k, kq, tick, ttlTicks);
    }
    catch {
        // Không ghi được cache là chuyện chậm, không phải chuyện sai.
    }
}
/**
 * Ghi một lượt truy hồi xuống `retrievalRuns` — 77.8.
 *
 * Nuốt mọi lỗi có chủ ý: trình duyệt riêng tư không có IndexedDB, và mất một
 * dòng thống kê không đáng để mất một lượt kể.
 */
async function ghiRunXuongDia(run) {
    if (!coIndexedDb())
        return;
    try {
        await new KhoRerankCache(layDb()).ghiRun(run);
    }
    catch {
        // Không ghi được thống kê là chuyện phiền, không phải chuyện chết.
    }
}
/** Vùng chủ thể đang cư trú — đầu vào `vungHanChe` của lọc tầm nhìn (54.3). */
function vungCuaChuThe(s) {
    const id = s.world.playerState.chuTheId;
    if (id === null)
        return [...s.entities.keys()].filter((k) => s.entities.get(k)?.kind === 'place');
    const noi = noiOCua(s, id);
    return noi === null ? [] : [noi];
}
/** Domain thần đang giữ — đầu vào `domainHanChe` của lọc tầm nhìn (54.3). */
function domainCuaChuThe(s) {
    const id = s.world.playerState.chuTheId;
    if (id === null)
        return [];
    const d = s.entities.get(id)?.aspects['domain'];
    return (d?.domains ?? []).map((x) => x.ten);
}
// Bất biến của Thế Giới Sống và tầng Thần phải có mặt TRƯỚC transaction đầu tiên.
napBatBienTheGioiSong();
napBatBienTangThan();
napBatBienTangPham();
napBatBienTangTruyen();
napBatBienPhase10();
export const useGame = create((set, get) => {
    const dongBo = () => {
        const s = get().state;
        if (!s)
            return;
        const view = chieu(s, s.world.playerState.mode, s.world.playerState.chuTheId);
        set({
            view,
            stateHash: hashState(s),
            goiY: goiYChoCanh(view, s.world.playerState.chuTheId, 5),
            persona: chieuPersona({
                profile: get().hoSo,
                creator: get().danhTinh,
                mode: s.world.playerState.mode,
                currentEntityId: s.world.playerState.chuTheId,
                entityLabel: s.world.playerState.chuTheId
                    ? (view.entities.get(s.world.playerState.chuTheId)?.ten ?? null)
                    : null,
            }),
        });
    };
    /**
     * `Scene` tối thiểu cho bộ biên dịch preset.
     *
     * Store giữ cảnh dưới dạng danh sách dòng để hiển thị; `Scene` của 61.3 là một
     * bản ghi khác, và bộ biên dịch cần nó cho macro `{{sceneId}}` và cho danh sách
     * người có mặt. Dựng tại chỗ thay vì giữ song song hai bản: một `Scene` lưu
     * riêng sẽ lệch khỏi thế giới ngay lần chuyển tầng đầu tiên.
     */
    const sceneHienTai = (s) => SceneSchema.parse({
        id: `scene.${s.world.branchId}.${s.world.tick}`,
        branchId: s.world.branchId,
        startedAtTick: s.world.tick,
        currentTick: s.world.tick,
        locationId: '',
        lensId: '',
        participantIds: s.world.playerState.chuTheId === null ? [] : [s.world.playerState.chuTheId],
    });
    /**
     * Cửa DUY NHẤT để một dòng chữ lên khung kể — và vì thế là chỗ vệ sinh.
     *
     * [BB] Phase 12 — mọi thứ đi qua đây đều là văn bản không tin cậy: model viết
     * nó, hoặc một regex của preset vừa biến đổi nó, hoặc chính người chơi vừa dán
     * nó vào. Đặt bộ lọc ở đây thay vì ở từng nơi gọi là cùng lẽ với `bocTach()`:
     * một hàng rào có ba cửa thì sớm muộn sẽ có người đi qua cửa thứ tư.
     *
     * Vết lọc KHÔNG bị nuốt — nó vào `vetVeSinh` để bảng Tự Chẩn Đoán đếm được.
     * Một ký tự đảo chiều văn bản bị xóa lặng lẽ là một cuộc tấn công không ai
     * biết đã xảy ra.
     */
    const themDong = (loai, noiDung, meta = {}) => {
        const sach = veSinh(noiDung, meta.dinhDang === 'html' ? 200_000 : undefined);
        if (sach.text.trim() === '')
            return;
        if (coVet(sach.vet)) {
            set({ vetVeSinh: [...get().vetVeSinh, moTaVet(sach.vet)].slice(-20) });
        }
        const s = get().state;
        const scene = [...get().scene];
        scene.push({ id: `d${scene.length}`, tick: s?.world.tick ?? 0, loai, noiDung: sach.text, ...meta });
        set({ scene: scene.slice(-200) });
    };
    /**
     * Cửa duy nhất vào mọi hành động chơi.
     *
     * Trả `false` nghĩa là cổng đóng — người gọi phải dừng lại, không được "cứ chạy
     * engine rồi tính sau". Chạy engine khi không ai kể được sẽ đẩy thế giới đi mà
     * người chơi không thấy gì, và khi nối lại họ mất trắng đoạn đó.
     */
    const doiCong = () => {
        /*
         * [BB] ADR-0056 — một lượt chưa được kể chặn mọi lượt sau.
         *
         * Không có nó thì "không có AI thì không chơi" chỉ đúng ở cửa vào: người chơi
         * mất mạng giữa ván vẫn bấm tick được, engine vẫn chạy, và khi nối lại họ đã
         * mất mười nhịp mà không ai kể cho nghe. Chặn ở đây biến sự cố thành một chỗ
         * dừng có thể sửa được.
         */
        if (get().luotChuaKe !== null) {
            set({
                loi: [
                    ...get().loi,
                    loi('ai', 'LUOT_CHUA_DUOC_KE', 'Nhịp vừa rồi chưa ai kể. Nối lại đường tới model rồi bấm "Kể lại nhịp này" trước khi đi tiếp.', { recoverable: true }),
                ],
            });
            return false;
        }
        const cong = useAi.getState().cong();
        if (cong.choPhepChoi)
            return true;
        set({
            loi: [
                ...get().loi,
                loi('ai', `CONG_AI_${cong.trangThai.toUpperCase()}`, cong.lyDo.join(' '), { recoverable: true }),
            ],
        });
        return false;
    };
    /**
     * Kể một lượt: dựng prompt từ `WorldView`, gọi Narrator, duyệt patch, ghi Event.
     *
     * `ketQuaEngine` là sự thật engine vừa quyết. Narrator kể lại nó; nó không được
     * phán lại. Nếu Narrator im lặng thì lượt này KHÔNG có lời kể — và cổng tự đóng
     * sau ba lần như vậy, thay vì lặng lẽ đưa ra một câu engine sinh và giả vờ rằng
     * AI vẫn đang chạy.
     */
    /**
     * Chọn chỗ chiếu cho lượt này — Phần 29.1.
     *
     * [BB] Hàm này KHÔNG sinh Event và KHÔNG đụng `world.tick`: chuyển ống kính là
     * hành động xem, không phải hành động chơi. Nó chỉ đọc thế giới và trả về một
     * quyết định.
     */
    const chieuOngKinh = (s) => {
        const ra = raSoatPhucBut(s, { tick: s.world.tick, eventId: 'ok' });
        const chon = chonMucTieu(s, get().ongKinh, {
            tick: s.world.tick,
            rng: rngCuaTick(s.world.seed, s.world.tick, 'ong_kinh'),
            uuTienMachId: ra.machUuTien,
            // [BB] 28.6 — hạn ngạch trượt thì kỷ nguyên sau ưu tiên mạch KHÔNG có người chơi.
            tranhEntityId: get().vangMat.dat ? null : s.world.playerState.chuTheId,
        });
        set({
            ongKinh: apOngKinh(get().ongKinh, chon, s.world.tick),
            viChieu: chon.vi,
        });
        return {
            machId: chon.machId,
            oChoNguoiChoi: ongKinhOChoNguoiChoi(s, chon.mucTieu, s.world.playerState.chuTheId),
        };
    };
    /** Luân phiên một nhóm neo Lorebook vào truy vấn để sách không chỉ bắn khi người chơi gọi đúng từ khóa. */
    const goiYLoreChoTruyHoi = (s) => {
        const muc = [];
        const lorebooks = [...s.lorebooks.values()]
            .filter((lb) => lb.bat)
            .sort((a, b) => b.uuTien - a.uuTien || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        for (const lb of lorebooks) {
            const phase = giaiDoanLore(lb, s.world.tick);
            const entries = [...lb.entries]
                .filter((e) => e.trangThai === 'hoat_dong' && e.doTinCay > 0 && e.lop !== 'loi' && e.giaiDoanMo <= phase)
                .sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
            if (entries.length === 0)
                continue;
            const batDau = s.world.tick % entries.length;
            const xoay = [...entries.slice(batDau), ...entries.slice(0, batDau)].slice(0, lb.soDiemHutMoiLuot);
            muc.push(...xoay.map((e) => [e.ten, ...e.keys.slice(0, 3)].filter(Boolean).join(' · ')));
        }
        if (muc.length === 0)
            return '';
        return `Các điểm hút của thần thoại nguồn đang tới lượt được phát triển: ${muc.join('; ')}.`;
    };
    /**
     * Đánh giá kỳ vọng của mọi sách đang bật và ghi kết quả qua Event.
     * Trả id vừa lệch/bất khả để Smart Stop có dữ liệu thật thay vì một cổng chết.
     */
    const capNhatLoreTrongState = (s, log, nhan) => {
        const dangBat = new Set([...s.lorebooks.values()].filter((lb) => lb.bat).map((lb) => lb.id));
        const hienTai = [...s.loreExpectations.values()].filter((kv) => dangBat.has(kv.lorebookId));
        if (hienTai.length === 0)
            return [];
        const kq = capNhatKyVong({
            kyVong: hienTai,
            state: s,
            theoDoi: { thoaBoi: new Map(hienTai.flatMap((kv) => (kv.thoaBoiId ? [[kv.id, kv.thoaBoiId]] : []))) },
            tick: s.world.tick,
            // `doUuTien` đã mang lực hấp dẫn riêng của sách; không nhân lần thứ hai.
            lucHapDan: 100,
            nguyenNhan: { chuTheId: s.world.playerState.chuTheId, eventIds: [], moTa: nhan },
        });
        const vuaLech = [];
        demLore++;
        const evId = `ev_lore_cap_nhat_${s.world.branchId}_${s.world.tick}_${demLore}`;
        const patches = [];
        for (const moi of kq.kyVong) {
            const cu = s.loreExpectations.get(moi.id);
            if (!cu)
                continue;
            if ((moi.trangThai === 'da_lech' || moi.trangThai === 'bat_kha') && moi.trangThai !== cu.trangThai) {
                vuaLech.push(moi.id);
            }
            const truong = ['trangThai', 'lyDoLech', 'tickLech', 'thoaBoiId'];
            for (const path of truong) {
                if (cu[path] === moi[path])
                    continue;
                patches.push({
                    op: 'set',
                    target: { table: 'loreExpectations', id: moi.id, path },
                    value: moi[path],
                    sourceEventId: evId,
                });
            }
        }
        for (const db of kq.diBanMoi) {
            if (s.diBan.has(db.id))
                continue;
            patches.push({
                op: 'link',
                target: { table: 'diBan', id: db.id, path: '' },
                value: db,
                sourceEventId: evId,
            });
        }
        for (const gap of kq.gapMoi) {
            if (s.gaps.has(gap.id))
                continue;
            patches.push({
                op: 'link',
                target: { table: 'gaps', id: gap.id, path: '' },
                value: gap,
                sourceEventId: evId,
            });
        }
        if (patches.length === 0)
            return vuaLech;
        const ev = taoEvent({
            id: evId,
            branchId: s.world.branchId,
            tick: s.world.tick,
            loai: 'cap_nhat_ky_vong_lorebook',
            actorIds: [],
            targetIds: [],
            causeEventIds: [],
            locationId: null,
            patches,
            visibility: 'engine',
            source: 'engine',
            payload: { soKyVong: kq.kyVong.length, vuaLech },
        });
        const ok = apDungEvent(s, ev, log);
        if (!ok.ok)
            set({ loi: [...get().loi, ...ok.errors] });
        return ok.ok ? vuaLech : [];
    };
    /**
     * Chạy chuỗi 54.9 cho lượt này.
     *
     * Trả `null` khi không có gì để truy hồi — thế giới hạt giống chưa có chunk
     * nào, và đó là trạng thái hợp lệ, không phải lỗi.
     */
    const chayTruyHoi = async (s, view, machId, cauNguoiChoi) => {
        const ai = useAi.getState();
        const td = tieuDiem(s, get().ongKinh.dangChieu, s.world.playerState.chuTheId);
        const tvGoc = dungBaTruyVan(view, {
            tieuDiemIds: td,
            loiNguoiChoi: cauNguoiChoi,
            machDangChieuId: machId,
        });
        const goiYLore = goiYLoreChoTruyHoi(s);
        const tv = goiYLore === '' ? tvGoc : { ...tvGoc, precedentText: `${tvGoc.precedentText} ${goiYLore}` };
        const chunks = dungChiMuc(s, `${cauNguoiChoi} ${tv.focusText} ${tv.intentText} ${tv.precedentText}`);
        if (chunks.length === 0)
            return null;
        const kq = await truyHoi({
            view,
            chunks,
            task: cauNguoiChoi.trim() === '' ? 'narrate_scene' : 'resolve_intent',
            truyVan: tv,
            tieuDiemIds: td,
            machDangChieuId: machId,
            config: ai.cfg.rerank,
            tuning: TUNING_MAC_DINH,
            // Tầng 4–6 dùng chung ngân sách; 33.1 cho chúng khoảng 40% tổng prompt.
            nganSachToken: Math.round(nganSachInput('ke_canh', null) * 0.4),
            tyLeToken: TY_LE_TOKEN,
            seed: s.world.seed,
            triThuc: 50,
            vungIds: new Set(vungCuaChuThe(s)),
            domainIds: new Set(domainCuaChuThe(s)),
            adapter: ai.adapterRerank(),
            mach: ai.machRerank,
            /**
             * [BB] 77.8 — cache khóa bảy phần, không bao giờ đọc chéo nhánh, chéo chủ
             * thể, chéo tầm nhìn hay chéo model. `KhoRerankCache` đã cưỡng chế điều đó
             * bằng chính hình dạng compound key; ở đây chỉ việc truyền khóa xuống.
             */
            cacheDoc: (k) => docCacheRerank(k, s.world.tick),
            cacheGhi: (k, r) => ghiCacheRerank(k, r, s.world.tick, ai.cfg.rerank.cacheTtlTicks),
            /**
             * Đồng hồ bơm từ ngoài — `core/` không được đọc đồng hồ máy (luật bất
             * biến #7), nhưng độ trễ retrieval là số liệu vận hành, không phải dữ liệu
             * game: nó không vào state và không vào hash.
             */
            dongHo: () => performance.now(),
        });
        ai.datMachRerank(kq.machMoi);
        ai.ghiNhanTruyHoi(kq.run);
        set({ truyHoiCuoi: kq });
        /**
         * [BB] Cổng Phase 8 — "metric retrieval-eval ĐƯỢC LƯU, có baseline trước khi
         * tối ưu semantic."
         *
         * Ghi xuống đĩa chứ không chỉ đếm trong bộ nhớ: baseline chỉ có nghĩa khi nó
         * sống qua lần đóng tab. `forbiddenCount` là số đáng lưu nhất trong hàng —
         * nó phải luôn bằng 0, và một lần khác 0 mà không ai ghi lại thì không ai
         * biết nó đã từng xảy ra.
         *
         * Không chặn lượt chơi: đĩa hỏng là chuyện của đĩa, không phải của lượt kể.
         */
        void ghiRunXuongDia(kq.run);
        return kq;
    };
    const keLuot = async (cauNguoiChoi, ketQuaEngine) => {
        const s = get().state;
        const log = get().log;
        const view = get().view;
        if (!s || !log || !view)
            return;
        const ok = chieuOngKinh(s);
        const th = await chayTruyHoi(s, view, ok.machId, cauNguoiChoi);
        const treo = phucButDangTreo(s, null).slice(0, 8);
        // Regex placement=1 chỉ được chạm đúng lời người chơi, không được chạy trên
        // khối hợp đồng `<CapNhat>` sau khi prompt đã phẳng hóa.
        const cauNguoiChoiChoPrompt = usePreset.getState().transformPrompt(cauNguoiChoi, 1, 0);
        /*
         * [BB] ADR-0049 — MỘT đường prompt.
         *
         * `bienSoanLuot()` gọi `bienSoanPromptKe()` bên trong, nên sáu tầng của 33.1
         * vẫn là nguồn duy nhất của nội dung. Preset đang bật chỉ đổi cách sáu tầng
         * ấy được xếp; không pack nào bật thì hàm trả thẳng prompt native.
         *
         * Trước Phase 11 chỗ này gọi `bienSoanPromptKe()` trực tiếp, và đó chính là
         * lý do preset nhập vào rồi nằm im: pipeline nhập chạy đúng, còn kết quả của
         * nó không có đường nào tới model.
         */
        /**
         * Tóm tắt phiên — dựng từ scene history dài hơn `canhGanDay`.
         *
         * Khi không có mạch truyện đang chiếu, đây là nguồn duy nhất giúp model
         * nối mạch tự sự. Nối 20 dòng gần nhất thành một đoạn có nhãn vai trò;
         * `bienSoan` chỉ dùng nó khi tầng 4 không có mạch nào.
         */
        const sceneGanDay = get().scene.slice(-20);
        const tomTatPhien = sceneGanDay.length > 3
            ? sceneGanDay
                .filter((d) => d.loai !== 'he_thong')
                .map((d) => d.loai === 'nguoi_choi' ? `[Ngươi] ${d.noiDung.slice(0, 150)}` : d.noiDung.slice(0, 200))
                .join('\n')
                .slice(0, 1800)
            : undefined;
        const nguLieu = {
            view,
            banTin: get().banTin,
            loiCau: loiCauCho(s, s.world.playerState.chuTheId, s.world.tick),
            canhGanDay: get()
                .scene.slice(-12)
                .map((d) => ({ loai: d.loai, noiDung: d.noiDung })),
            tomTatPhien,
            cauNguoiChoi: cauNguoiChoiChoPrompt,
            ketQuaEngine,
            tenNguoiChoi: get().persona?.displayName ?? 'Người Chơi',
            tyLeToken: TY_LE_TOKEN,
            machDangChieu: ok.machId === null ? null : (view.machTruyen.find((m) => m.id === ok.machId) ?? null),
            ongKinhOChoNguoiChoi: ok.oChoNguoiChoi,
            phucButChuaTra: treo.map((f) => ({ noiDung: f.noiDung, quaHan: quaHan(f, s.world.tick) })),
            chunkTruyHoi: (th?.daChon ?? []).map((c) => ({
                nguon: c.nguon,
                text: c.projectedText,
                daBopMeo: c.daBopMeo,
            })),
            chunkBiCat: th?.biCat ?? [],
        };
        const hopNhat = bienSoanLuot({
            nguLieu,
            scene: sceneHienTai(s),
            packs: packDangBat(),
            params: NormalizedGenParamsSchema.parse({}),
            nganSachToken: nganSachInput('ke_canh', null),
            tenPersona: get().persona?.displayName ?? 'Người Chơi',
            // [BB] 78.11 — persona ĐÃ CHIẾU. `PlayerProfile` không có đường tới đây.
            moTaPersona: get().persona?.publicDescription ?? '',
            hoTroPrefill: useAi.getState().cfg.narrator.probe.xuatCoCauTruc,
            lichSuDaDinhDang: usePreset
                .getState()
                .lichSuChoPrompt(get().scene.map((d) => ({ loai: d.loai, noiDung: d.noiDungGoc ?? d.noiDung }))),
        });
        /*
         * Adapter merge chạy trên cấu trúc message, không chạy trên chuỗi đã phẳng.
         * Module `td:*` là lõi/hợp đồng engine và được giữ byte-for-byte; regex nội
         * tuyến chỉ có quyền sửa module nhập và các slot mà preset sở hữu.
         */
        let prompt = hopNhat.prompt;
        if (hopNhat.compiled !== null) {
            const messages = usePreset.getState().apAdapterMessages(hopNhat.compiled.messages);
            const noi = (role) => messages
                .filter((m) => m.role === role)
                .map((m) => m.content)
                .filter((x) => x.trim() !== '')
                .join(role === 'assistant' ? '\n' : '\n\n')
                .trim();
            const heThong = noi('system');
            const nguoiDung = noi('user');
            prompt = Object.freeze({
                ...hopNhat.prompt,
                heThong,
                nguoiDung,
                moiTraLoi: noi('assistant'),
                soKyTu: heThong.length + nguoiDung.length,
                uocToken: uocLuong(`${heThong}${nguoiDung}`, TY_LE_TOKEN),
            });
        }
        set({
            vetCatToken: prompt.vetCat.map((v) => ({ tang: v.tang, ten: v.ten, vi: v.vi })),
            presetTrace: {
                packDaDung: hopNhat.packDaDung,
                moduleBiBo: hopNhat.moduleBiBo,
                macroChuaGiai: hopNhat.macroChuaGiai,
                issues: hopNhat.issues.map((i) => `${i.code}: ${i.message}`),
            },
        });
        set({ dangKe: true });
        const r = await useAi.getState().ke(prompt);
        set({ dangKe: false });
        if (!r.ok) {
            /*
             * [BB] ADR-0056 — nói đúng chuyện đang xảy ra.
             *
             * Câu cũ ở đây là "thế giới vẫn giữ nguyên chỗ đang dở", và nó SAI: Event
             * của lượt này đã vào log trước khi ta gọi model. Thế giới đã đi tiếp; thứ
             * thiếu là lời kể. Ghi lại nguyên liệu để `keLai()` thử lại đúng nhịp ấy,
             * và khoá đường chơi cho tới lúc đó.
             */
            themDong('he_thong', `Nhịp này chưa ai kể được: ${r.thongDiep} — thế giới đã đi tiếp, nhưng bạn chưa được đọc nó. ` +
                'Nối lại đường tới model rồi kể lại nhịp này.');
            set({
                luotChuaKe: { cau: cauNguoiChoi, ketQuaEngine: [...ketQuaEngine] },
                loi: [...get().loi, loi('ai', r.ma, r.thongDiep, { recoverable: true })],
            });
            return;
        }
        set({ luotChuaKe: null });
        demKe++;
        const evId = `ev_ke_${s.world.branchId}_${s.world.tick}_${demKe}`;
        // Patch phục bút phải khai NGUỒN của chính nó, không mượn `evId`: `evId` có
        // thể không bao giờ tồn tại nếu lượt kể này không đổi gì trong thế giới.
        const evPbId = `${evId}_pb`;
        // Script adapter đọc chỉ thị trên output NGUYÊN BẢN trước khi các marker bị
        // dọn; sau đó bộ xử lý native mới cắt CoT/stop marker để bóc dữ liệu.
        usePreset.getState().captureOutput(r.vanBan, s.world.tick);
        const vanBanPreset = usePreset.getState().xuLyOutput(r.vanBan);
        let kq = bocTach(vanBanPreset, {
            eventId: evId,
            idHopLe: new Set(s.entities.keys()),
            branchId: s.world.branchId,
        });
        /**
         * Điểm cuối Cập Nhật Biến — 46.1, món nợ Phase 6b.
         *
         * Chạy SAU Narrator và trên chính văn Narrator vừa viết. Nó hỏng thì lượt
         * vẫn xong: ta giữ nguyên phần `<CapNhat>` mà Narrator tự khai (chế độ
         * `gop_vao_narrator`), chứ không mất lời kể.
         */
        const capNhat = await useAi.getState().capNhatBien(bienSoanPromptCapNhat({
            view,
            loiKe: kq.loiKe,
            ketQuaEngine,
            idHopLe: [...s.entities.keys()],
            tyLeToken: TY_LE_TOKEN,
        }));
        if (capNhat?.ok) {
            const rieng = bocTach(capNhat.vanBan, {
                eventId: evId,
                idHopLe: new Set(s.entities.keys()),
                branchId: s.world.branchId,
            });
            // Văn của Updater bị bỏ hẳn: nó không phải người kể chuyện (46.2).
            kq = { ...rieng, loiKe: kq.loiKe };
        }
        /*
         * [BB] 64.3 — transform hiển thị chạy trên BẢN SAO.
         *
         * `hienThi()` trả một chuỗi mới; `kq.loiKe` gốc không đổi, và không transform
         * nào chạm được vào Event, Patch hay `WorldState`. Đây là toàn bộ chỗ regex
         * của preset được phép có mặt trong đường chơi.
         */
        /*
         * Parse `<choice>` block trước khi hiển thị.
         *
         * Block `<choice>` bị xóa khỏi lời kể; các lựa chọn đi vào state `luaChon`
         * để UI render thành buttons. Khi user chọn hoặc gõ input mới, `luaChon`
         * được xóa sạch ở `keLuot()` đầu lượt sau.
         */
        const { loiKe: loiKeSach, luaChon: dsLuaChon } = parseChoice(kq.loiKe);
        const loiKeHienThi = usePreset.getState().hienThi(loiKeSach, {
            user: get().persona?.displayName ?? 'Người Chơi',
            sceneId: `scene.${s.world.branchId}.${s.world.tick}`,
            turn: s.world.tick,
        });
        const laHtml = /<(?:style|div|section|article|details|table|h[1-6]|p|span)\b/i.test(loiKeHienThi);
        themDong('ket_qua', loiKeHienThi, {
            noiDungGoc: loiKeSach,
            dinhDang: laHtml ? 'html' : 'text',
        });
        set({ patchBiTuChoi: kq.biTuChoi, luaChon: dsLuaChon });
        /*
         * Biến pack — 66.6, tương thích thẻ bài MVU.
         *
         * Chúng đi vào kho biến của pack, KHÔNG đi vào `apDungEvent`. Một thẻ bài MVU
         * đổi được bảng trạng thái của chính nó và không đổi được một dòng nào trong
         * thế giới, và ranh giới ấy nằm ở đúng hai dòng dưới đây.
         */
        if (kq.bienPack.length > 0) {
            void usePreset.getState().apBienPack(kq.bienPack, s.world.tick);
        }
        // [BB] 28.6 — đếm cảnh để đo hạn ngạch vắng mặt, theo CẢNH chứ không theo token.
        canhDaKe.push({ coNguoiChoi: ok.oChoNguoiChoi });
        set({ vangMat: hanNgachVangMat(canhDaKe.slice(-40)) });
        /**
         * [BB] 30.2 — engine ghi Sổ Phục Bút, model chỉ khai đã gieo cái gì.
         *
         * Hạn trả do engine đặt, không do model: hạn là thứ quyết định khi nào ống
         * kính bị kéo về mạch ấy, tức là một quyết định gameplay chứ không phải một
         * chi tiết văn chương.
         */
        const patchPhucBut = [];
        for (const f of kq.phucBut) {
            const g = gieoPhucBut(s, {
                noiDung: f.noiDung,
                loai: f.loai,
                machId: ok.machId,
                hanTraToiDa: HAN_TRA_MAC_DINH,
                doNang: 55,
            }, { tick: s.world.tick, eventId: evPbId });
            patchPhucBut.push(...g.patches);
        }
        /**
         * [BB] 54.10 — khẳng định quá khứ không đối chiếu được KHÔNG bị xóa.
         * Nó thành `gap` loại `nhan_qua`: một câu hỏi chưa có lời đáp, tức nội dung.
         */
        for (const [i, u] of kq.chuaChungThuc.entries()) {
            const gapId = `gap_nhan_qua_ke_${s.world.tick}_${demKe}_${i}`;
            if (s.gaps.has(gapId))
                continue;
            patchPhucBut.push({
                op: 'link',
                target: { table: 'gaps', id: gapId, path: '' },
                value: {
                    id: gapId,
                    branchId: s.world.branchId,
                    loai: 'nhan_qua',
                    chuTheId: null,
                    moTa: `Chưa đối chiếu được: ${u}`,
                    uuTien: 40,
                    lanThu: 0,
                    trangThai: 'thanh_bi_an',
                    tickPhatHien: s.world.tick,
                },
                sourceEventId: evPbId,
            });
        }
        /**
         * Thứ tự hai Event dưới đây có nghĩa, và làm ngược thì hỏng.
         *
         * Event phục bút khai `causeEventIds = [evId]`, mà `evId` CHỈ vào log khi
         * lượt kể có patch. Áp phục bút trước sẽ trỏ nhân quả tới một Event chưa
         * tồn tại — và transaction bắt đúng điều đó ("trỏ nguyên nhân không có trong
         * log"). Nên: kể trước, phục bút sau, và chỉ khai nhân quả khi có thật.
         */
        let daCoEventKe = false;
        if (kq.patches.length > 0) {
            // [BB] `source = 'ai_validated'` chỉ dùng SAU khi output đã qua schema và
            // bảng trắng thẩm quyền — đó chính là thứ `bocTach()` vừa làm.
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: 'narrator_cap_nhat',
                actorIds: s.world.playerState.chuTheId ? [s.world.playerState.chuTheId] : [],
                targetIds: [],
                causeEventIds: [],
                locationId: null,
                patches: [...kq.patches],
                visibility: 'cong_khai',
                source: 'ai_validated',
                payload: { soPatch: kq.patches.length, soTuChoi: kq.biTuChoi.length },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                // Invariant từ chối là kết quả ĐÚNG, không phải sự cố: lời kể vẫn còn,
                // chỉ thế giới là không đổi. Người chơi thấy văn, engine giữ sổ.
                set({ loi: [...get().loi, ...ok.errors] });
            }
            daCoEventKe = ok.ok;
        }
        if (patchPhucBut.length > 0) {
            const evPb = taoEvent({
                id: evPbId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: 'gieo_phuc_but',
                actorIds: [],
                targetIds: [],
                causeEventIds: daCoEventKe ? [evId] : [],
                locationId: null,
                patches: patchPhucBut,
                visibility: 'engine',
                source: 'ai_validated',
                payload: { soPhucBut: kq.phucBut.length, soChuaChungThuc: kq.chuaChungThuc.length },
            });
            const okPb = apDungEvent(s, evPb, log);
            if (!okPb.ok)
                set({ loi: [...get().loi, ...okPb.errors] });
        }
        /**
         * Gieo nền cho thứ vừa được kể ra đời — [BB] ADR-0055 nối tiếp 71.2.
         *
         * Trên một thế giới hư vô, `place` đầu tiên xuất hiện giữa một lượt kể chứ
         * không ở nhịp 0. Một vùng không có `dan_cu`/`kinh_te`/`sinh_thai` bị mười
         * hai tiến trình **bỏ qua trong im lặng** — không lỗi, không cảnh báo, chỉ là
         * một vùng đứng hình mãi mãi. Nên phép gieo phải chạy lại sau mỗi lượt có
         * patch, chứ không chỉ một lần lúc khởi tạo.
         *
         * `patchGieoNen()` đã idempotent: thế giới đã gieo đủ thì nó trả patch rỗng
         * và `eventGieoNen()` trả `null`, nên gọi mỗi lượt không tốn gì.
         */
        const evNen = eventGieoNen(s, `:ke${demKe}`);
        if (evNen) {
            const okNen = apDungEvent(s, evNen, log);
            if (!okNen.ok)
                set({ loi: [...get().loi, ...okNen.errors] });
        }
        capNhatLoreTrongState(s, log, 'Kỳ vọng được đối chiếu sau lượt kể.');
        dongBo();
        /**
         * Tự lưu sau MỖI lượt được kể trọn vẹn — món nợ mở từ Phase 3.
         *
         * Đặt ở đây chứ không ở từng hành động: mọi đường chơi đều kết thúc bằng một
         * lượt kể, nên một chỗ này phủ hết. Không `await`: người chơi không phải chờ
         * đĩa để đọc câu vừa hiện ra, và `luuVan()` đã tự nuốt lỗi ghi.
         */
        void get().luuVan();
    };
    /**
     * Gieo bảy bản ghi Luật Nền cho một nhánh chưa có — [BB] 43.2.
     *
     * "Thế giới **luôn** vận hành theo một cấu hình nào đó; engine cần giá trị để
     * chạy." Bảy trục sinh ra ở trạng thái `vo_danh` với tham số phàm tục: thời
     * gian vẫn trôi một chiều, nhưng chưa ai lợi dụng được điều đó vì lợi dụng đòi
     * hỏi phải biết luật. Không gieo thì màn Vật Lý không có gì để hiện và
     * `datTenTruc()` từ chối mọi trục vì "chưa có bản ghi".
     *
     * Idempotent: nhánh đã có đủ bảy trục thì trả `null`.
     */
    const eventGieoLuatNen = (s) => {
        if (s.substrateLaws.size >= 7)
            return null;
        const evId = `ev_gieo_luat_nen_${s.world.branchId}_${s.world.tick}`;
        const patches = luatNenMacDinh(s.world.branchId)
            .filter((ln) => !s.substrateLaws.has(ln.id))
            .map((ln) => ({
            op: 'link',
            target: { table: 'substrateLaws', id: ln.id, path: '' },
            value: ln,
            sourceEventId: evId,
        }));
        if (patches.length === 0)
            return null;
        return taoEvent({
            id: evId,
            branchId: s.world.branchId,
            tick: s.world.tick,
            loai: 'gieo_luat_nen',
            actorIds: [],
            targetIds: [],
            causeEventIds: [],
            locationId: null,
            patches,
            visibility: 'engine',
            source: 'engine',
            payload: { soTruc: patches.length },
        });
    };
    /**
     * Dựng bộ chạy đường ống workflow cho một lượt Diễn Hóa — [BB] 50.2 – 50.10.
     *
     * Trả `null` khi không có gì để chạy, và bốn lý do đều hợp lệ:
     * preset trống, preset vi phạm lằn ranh, điểm cuối Diễn Hóa chưa bật, hoặc
     * người chơi không chọn preset nào.
     *
     * ── Cái hàm này KHÔNG làm ──
     *
     * Nó không áp `dichGhi` của tác vụ vào thế giới. Output đi vào ngữ cảnh của
     * giai đoạn sau và vào lượt kể cuối, chấm hết. Lý do: [BB] 50.10 xếp "ghi vào
     * lorebook người dùng" là hỏng NẶNG, và đường ghi an toàn cần một bộ định
     * tuyến riêng qua `dichGhi.ts` với đủ kiểm lằn ranh. Nối một nửa đường ghi thì
     * tệ hơn không nối: nó tạo ra ấn tượng rằng lằn ranh đã được kiểm.
     */
    const chuanBiDuongOng = (presetId) => {
        const preset = PRESET_WORKFLOW[presetId];
        if (preset === undefined || preset.tasks.length === 0)
            return null;
        // [BB] 50.10 — kiểm TRƯỚC khi chạy, không phải lúc đang chạy dở.
        const ranh = kiemLanRanh(preset);
        if (!ranh.dat) {
            set({ loi: [...get().loi, ...ranh.loi] });
            return null;
        }
        const ai = useAi.getState();
        const ep = ai.cfg.workflow;
        if (!ep.batRieng || ep.proxyUrl.trim() === '' || ep.modelId.trim() === '')
            return null;
        const lich = new Map();
        return {
            chay: async (s, luot) => {
                const view = chieu(s, s.world.playerState.mode, s.world.playerState.chuTheId);
                const bang = {
                    nhip: String(s.world.tick),
                    nam: String(s.world.year),
                    kyNguyen: s.world.eraId,
                    soThucThe: String(s.entities.size),
                    soMachTruyen: String(s.storylines.size),
                    tang: view.mode,
                    nguoiChoi: get().persona?.displayName ?? 'Người Chơi',
                };
                const macroChuaGiai = new Set();
                let soCall = 0;
                const kq = await chayDuongOng({
                    preset,
                    tuning: TUNING_MAC_DINH,
                    trangThaiLich: lich,
                    lich: { luot, tick: s.world.tick, suKien: [] },
                    /**
                     * Nguồn liệt kê cho họ bản sao — [BB] 50.3: tra BẢNG, không eval chuỗi.
                     * Id lạ trả mảng rỗng, và tác vụ ấy chạy đúng một lần thay vì nổ.
                     */
                    lietKe: (nguon, gioiHan) => {
                        const ds = nguon === 'nhan_vat_hien_dien'
                            ? [...s.entities.values()].filter((e) => e.kind === 'mortal' || e.kind === 'deity')
                            : nguon === 'noi_chon'
                                ? [...s.entities.values()].filter((e) => e.kind === 'place')
                                : nguon === 'mach_truyen'
                                    ? [...s.storylines.values()]
                                    : [];
                        return ds
                            .map((x) => x.id)
                            .sort()
                            .slice(0, gioiHan);
                    },
                    dungPrompt: (task, mucId, nguCanhTruoc) => {
                        const b = bienSoanTacVu({ task, bang, nguCanhTruoc, mucId });
                        for (const m of b.macroChuaGiai)
                            macroChuaGiai.add(m);
                        return b.messages;
                    },
                    goi: async (yc) => {
                        soCall++;
                        const r = await goiTacVuWorkflow(ep, yc.messages);
                        return r.ok ? { ok: true, text: r.vanBan } : { ok: false, maLoi: r.ma, thongDiep: r.thongDiep };
                    },
                });
                for (const gd of kq) {
                    for (const t of gd.ketQua)
                        lich.set(t.taskId, t.trangThaiLich);
                }
                if (macroChuaGiai.size > 0) {
                    set({
                        presetTrace: {
                            ...get().presetTrace,
                            macroChuaGiai: [...new Set([...get().presetTrace.macroChuaGiai, ...macroChuaGiai])],
                        },
                    });
                }
                return {
                    soCall,
                    vet: kq.flatMap((gd) => gd.ketQua.map((t) => ({
                        giaiDoan: gd.giaiDoan,
                        taskId: t.taskId,
                        chay: t.chay,
                        lyDo: t.lyDoKhongChay,
                        soCall: t.soCall,
                        soKyTuRa: t.output.length,
                        thatBai: t.thatBai.length,
                    }))),
                };
            },
        };
    };
    const khoiTao = async (hoSo, danhTinh, cua, motCau) => {
        if (!doiCong())
            return;
        /*
         * Lưu ván đang chơi TRƯỚC khi ghi đè — sửa lỗi "bắt đầu ván mới = mất ván cũ".
         *
         * `khoiTao()` sắp thay thế `state` và `log` bằng thế giới hư vô mới. Nếu
         * ván hiện tại chưa từng xuống đĩa hoặc có thay đổi từ lần lưu cuối, nó sẽ
         * mất vĩnh viễn. `await` ở đây là cố ý: ván cũ phải xuống đĩa TRƯỚC khi
         * state bị ghi đè — fire-and-forget sẽ tạo race với `set({ state })` bên
         * dưới và người chơi sẽ mất ván y hệt khi `luuVan()` đọc state mới thay
         * vì state cũ.
         */
        if (get().state && coIndexedDb()) {
            await get().luuVan();
        }
        const ct = KhoiTaoWorldSchema.parse({
            cua,
            seed: SEED_MAC_DINH,
            worldId: 'w1',
            branchId: 'br_goc',
            motCau,
        });
        /**
         * [BB] ADR-0055 — mở ra HƯ VÔ.
         *
         * Không luật, không khái niệm, không thần, không người, không nơi. Tất cả
         * những thứ ấy chỉ tồn tại sau khi một lượt chơi tạo ra chúng, và lúc đó
         * chúng truy được về đúng lượt đã sinh ra chúng (`provenance`, 59.1).
         */
        const { world, events } = moTheGioiTrong(ct);
        const state = taoState(world);
        const log = taoEventLog();
        const r = apDungChuoi(state, events, log);
        if (!r.ok) {
            set({ loi: [...r.errors] });
            return;
        }
        const evLuat = eventGieoLuatNen(state);
        if (evLuat)
            apDungEvent(state, evLuat, log);
        set({
            state,
            log,
            hoSo,
            danhTinh,
            scene: [],
            loi: [],
            projects: [],
            choXacNhan: null,
            banTin: null,
            patchBiTuChoi: [],
        });
        dongBo();
        await keLuot(motCau.trim(), motCau.trim() === ''
            ? ['Chưa có gì tồn tại. Không đất, không luật, không tên gọi nào.']
            : [
                'Chưa có gì tồn tại ngoài điều người chơi vừa nói ra.',
                `Tiền đề người chơi đặt: ${motCau.trim()}`,
            ]);
    };
    return {
        state: null,
        log: null,
        view: null,
        hoSo: null,
        danhTinh: null,
        persona: null,
        scene: [],
        goiY: [],
        projects: [],
        loi: [],
        choXacNhan: null,
        stateHash: '',
        banTin: null,
        patchBiTuChoi: [],
        vetVeSinh: [],
        dangKe: false,
        luaChon: [],
        luotChuaKe: null,
        danhSachVan: [],
        dangLuu: false,
        tickDaLuu: null,
        baoCaoDienHoa: null,
        dangDienHoa: false,
        vetDuongOng: [],
        ongKinh: ongKinhMoi(0),
        viChieu: '',
        vangMat: hanNgachVangMat([]),
        truyHoiCuoi: null,
        vetCatToken: [],
        presetTrace: { packDaDung: [], moduleBiBo: [], macroChuaGiai: [], issues: [] },
        danhGiaTruyHoi: null,
        dangDanhGia: false,
        async batDau({ hoSo, danhTinh, cua, motCau }) {
            await khoiTao(hoSo, danhTinh, cua, motCau);
        },
        async batDauNhanh(displayName, cua, motCau) {
            const hs = { ...hoSoToiThieu('pf_local', 0), displayName: displayName.trim() || 'Người Chơi' };
            await khoiTao(hs, null, cua, motCau);
        },
        // [BB] 78.5 — `Bỏ qua` tạo hồ sơ tối thiểu HỢP LỆ và không chặn chơi.
        // Nó vẫn phải qua cổng AI: bỏ qua phần khai báo không bỏ qua được người kể.
        async batDauBoQua() {
            await khoiTao(hoSoToiThieu('pf_local', 0), null, 'hu_vo', '');
        },
        suaHoSo(hoSo, danhTinh) {
            set({ hoSo, danhTinh });
            // Chỉ dựng lại persona chiếu. `dongBo()` không sinh Event và không chạm
            // `stateHash` — đó chính là điều cổng "chỉnh hồ sơ không làm World đổi âm
            // thầm" đang đòi.
            dongBo();
        },
        async chonHienDien(draft) {
            if (!doiCong())
                return null;
            const s = get().state;
            const log = get().log;
            const view = get().view;
            if (!s || !log || !view)
                return null;
            const r = eventHienDien(StartingPresenceDraftSchema.parse(draft), view, s);
            if (!r.ok) {
                set({ loi: [...r.errors] });
                return null;
            }
            for (const ev of r.value.events) {
                const ok = apDungEvent(s, ev, log);
                if (!ok.ok) {
                    set({ loi: [...ok.errors] });
                    return null;
                }
            }
            dongBo();
            await keLuot('', [
                r.value.chuTheId
                    ? 'Người chơi vừa hiện diện trong thế giới với thân phận mới.'
                    : 'Người chơi hiện diện như Sáng Thế Thần: không thân xác, không vị trí.',
                ...r.value.diff.engineQuyet,
            ]);
            return r.value.diff;
        },
        async chuyenTang(mode, chuTheId) {
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            if (!s || !log)
                return;
            // [BB] Giới hạn Phase 6 đã đóng: chủ thể do bộ chọn quyết, không còn là
            // "entity `deity` đầu tiên trong view". Bấm "Thần" mà rơi vào Phàm Nhân là
            // lỗi cũ của chỗ này.
            const chon = chuTheId ?? chuTheMacDinhCho(s, mode);
            if (mode !== 'sang_the' && chon === null) {
                set({
                    loi: [
                        ...get().loi,
                        loi('intent', 'KHONG_CO_CHU_THE', mode === 'than'
                            ? 'Chưa có vị thần nào bạn nhập được. Hãy tạo một vị thần trước khi đổi sang tầng Thần.'
                            : 'Chưa có con người nào bạn nhập được ở tầng Phàm Nhân.', { recoverable: true }),
                    ],
                });
                return;
            }
            const ev = eventChuyenTang(s, mode, chon, 'người chơi đổi góc nhìn');
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...ok.errors] });
                return;
            }
            dongBo();
            const ten = chon ? (get().view?.entities.get(chon)?.ten ?? chon) : null;
            await keLuot('', [
                ten === null
                    ? 'Góc nhìn vừa đổi lên tầng Sáng Thế: cùng một thế giới, khác thứ nhìn thấy được.'
                    : `Góc nhìn vừa đổi sang ${ten}.`,
            ]);
        },
        async gui(cau) {
            if (cau.trim() === '')
                return;
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            const view = get().view;
            if (!s || !log || !view)
                return;
            // Xóa lựa chọn cũ — lượt mới, choices cũ không còn ý nghĩa.
            set({ luaChon: [] });
            themDong('nguoi_choi', cau);
            demIntent++;
            const intent = parseIntent(cau, {
                id: `it_${demIntent}`,
                branchId: s.world.branchId,
                sceneId: null,
                actorId: s.world.playerState.chuTheId ?? 'sang_the',
                mode: s.world.playerState.mode,
                view,
            });
            const r = giaiQuyet({
                view,
                intent,
                triThuc: [],
                tuning: TUNING_MAC_DINH,
                seed: s.world.seed,
                tick: s.world.tick,
            });
            // [BB] Hành động không thể hoàn tác phải hỏi TRƯỚC khi áp Event.
            if (r.plan.requiresConfirmation && r.events.length > 0) {
                set({ choXacNhan: { plan: r.plan, cau } });
                themDong('he_thong', 'Việc này không thể hoàn tác. Bạn chắc chứ?');
                return;
            }
            for (const ev of r.events) {
                const ok = apDungEvent(s, ev, log);
                if (!ok.ok)
                    set({ loi: [...ok.errors] });
            }
            if (r.project)
                set({ projects: [...get().projects, r.project] });
            dongBo();
            await keLuot(cau, [r.outcome.loiKe]);
        },
        async xacNhan(dongY) {
            const cho = get().choXacNhan;
            set({ choXacNhan: null });
            if (!cho)
                return;
            if (!dongY) {
                themDong('he_thong', 'Bạn dừng lại.');
                return;
            }
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            const view = get().view;
            if (!s || !log || !view)
                return;
            demIntent++;
            const intent = parseIntent(cho.cau, {
                id: `it_${demIntent}`,
                branchId: s.world.branchId,
                sceneId: null,
                actorId: s.world.playerState.chuTheId ?? 'sang_the',
                mode: s.world.playerState.mode,
                view,
            });
            const r = giaiQuyet({
                view,
                intent,
                triThuc: [],
                tuning: TUNING_MAC_DINH,
                seed: s.world.seed,
                tick: s.world.tick,
            });
            for (const ev of r.events)
                apDungEvent(s, ev, log);
            if (r.project)
                set({ projects: [...get().projects, r.project] });
            dongBo();
            await keLuot(cho.cau, [r.outcome.loiKe]);
        },
        async tick(soLan = 1) {
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            if (!s || !log)
                return;
            const tickDau = s.world.tick;
            const suKien = [];
            for (let i = 0; i < soLan; i++) {
                // Mười hai tiến trình nền của 71.2 chạy ở đây — đây là lý do NPC không
                // đứng yên giữa hai lượt nói. Chúng KHÔNG gọi LLM: engine giữ sổ (71.5).
                const r = motTick(s, { tuning: TUNING_MAC_DINH, tienTrinhNen: chayTienTrinhNen });
                for (const ev of r.events) {
                    const ok = apDungEvent(s, ev, log);
                    if (!ok.ok) {
                        set({ loi: [...ok.errors] });
                        return;
                    }
                }
                suKien.push(...r.suKien);
            }
            // Bản tin chỉ chứa thứ CHỦ THỂ NÀY biết được — event xa không tự chen vào.
            const bt = banTinCho(s, suKien, s.world.playerState.mode, s.world.playerState.chuTheId, tickDau, s.world.tick);
            set({ banTin: bt });
            dongBo();
            await keLuot('', [
                `Thời gian trôi tới nhịp ${s.world.tick}.`,
                ...bt.muc.slice(0, 6).map((m) => m.loiKe),
            ]);
        },
        lamMoi() {
            dongBo();
        },
        /**
         * Kể lại nhịp đang treo — cửa DUY NHẤT thoát khỏi trạng thái `luotChuaKe`.
         *
         * Không đi qua `doiCong()` vì `doiCong()` chặn chính trạng thái này; nó hỏi
         * thẳng cổng AI. Thất bại thì `luotChuaKe` giữ nguyên và người chơi thử lại
         * lần nữa — engine không chạy thêm nhịp nào trong lúc chờ.
         */
        async keLai() {
            const treo = get().luotChuaKe;
            if (treo === null || get().dangKe)
                return;
            const cong = useAi.getState().cong();
            if (!cong.choPhepChoi) {
                set({
                    loi: [
                        ...get().loi,
                        loi('ai', `CONG_AI_${cong.trangThai.toUpperCase()}`, cong.lyDo.join(' '), { recoverable: true }),
                    ],
                });
                return;
            }
            await keLuot(treo.cau, treo.ketQuaEngine);
        },
        // ── ván chơi ──
        async napDanhSachVan() {
            if (!coIndexedDb()) {
                set({ danhSachVan: [] });
                return;
            }
            try {
                set({ danhSachVan: await danhSachSave(layDb()) });
            }
            catch {
                // Đọc danh sách hỏng thì hiện danh sách rỗng — màn chính vẫn cho "Bắt đầu".
                set({ danhSachVan: [] });
            }
        },
        /**
         * Ghi ván xuống đĩa.
         *
         * Nuốt lỗi có chủ ý: trình duyệt riêng tư không có IndexedDB, và một lần ghi
         * hỏng không được phép giết lượt kể đang chạy. Thứ KHÔNG nuốt là hậu quả —
         * `tickDaLuu` chỉ nhích khi ghi thật sự xong, nên màn chính không bao giờ nói
         * "đã lưu" về một thứ chưa xuống đĩa.
         */
        async luuVan(ten) {
            if (!coIndexedDb())
                return;
            /*
             * XẾP HÀNG, không bỏ lượt — sửa một lỗi race thật tìm được ở E2E.
             *
             * Bản cũ trả về ngay khi `dangLuu === true`, tưởng là "đã có người ghi
             * rồi". Nhưng người ấy ghi ảnh chụp của một nhịp CŨ HƠN, và lần ghi bị bỏ
             * là lần duy nhất biết về nhịp mới. Hậu quả: `roiVan()` await xong, tưởng
             * đã lưu, rồi mở lại ra một thế giới lùi một nhịp — và hash không khớp.
             *
             * Nối vào cuối hàng đợi thì lần ghi cuối cùng luôn là lần ghi mới nhất, và
             * `await luuVan()` thật sự có nghĩa là "đã xuống đĩa".
             */
            hangDoiLuu = hangDoiLuu.then(async () => {
                const s = get().state;
                const log = get().log;
                if (!s || !log)
                    return;
                set({ dangLuu: true });
                try {
                    const db = layDb();
                    await ghiVan(db, new KhoDexie(db), s, [...log.tatCa()], ten ?? nhanMacDinh(s.world.tick, s.world.playerState.mode));
                    // Scene phải hoàn tất trước khi `luuVan()` trả về. Nếu chỉ khởi chạy rồi
                    // bỏ đó, `roiVan()` có thể xóa bộ nhớ và mở lại ván trước khi IndexedDB
                    // kịp ghi lịch sử chat.
                    await luuScene(s.world.id, s.world.branchId, get().scene);
                    set({ tickDaLuu: s.world.tick });
                }
                catch (e) {
                    set({
                        loi: [
                            ...get().loi,
                            loi('persistence', 'LUU_HONG', `Không ghi được ván xuống đĩa: ${String(e)}`, {
                                recoverable: true,
                            }),
                        ],
                    });
                }
                finally {
                    set({ dangLuu: false });
                }
            });
            await hangDoiLuu;
        },
        /**
         * Mở lại một ván đã lưu.
         *
         * [BB] Nạp là một RANH GIỚI, nên `napState()` chạy invariant toàn bộ và
         * `eventGieoNen()` chạy lại để vùng nào thiếu nền được bù. Không kể một lượt
         * ở đây: mở save không phải một sự kiện của thế giới, và bắt model viết một
         * đoạn văn mỗi lần người chơi mở lại ván là cách nhanh nhất để "tiếp tục"
         * thành "bắt đầu lại".
         */
        async tiepTucVan(branchId) {
            if (!coIndexedDb())
                return false;
            /*
             * Lưu ván đang chơi TRƯỚC khi nạp ván khác — cùng lẽ với `khoiTao()`.
             *
             * Kịch bản: đang chơi ván A, mở Bản Đồ Nhánh, bấm "Tiếp tục" ván B.
             * Không lưu ở đây thì mọi thay đổi từ lần autosave cuối bị mất.
             */
            if (get().state)
                await get().luuVan();
            const db = layDb();
            const kho = new KhoDexie(db);
            const r = await napState(kho, branchId);
            if (!r.ok) {
                set({ loi: [...get().loi, ...r.errors] });
                return false;
            }
            const state = r.value;
            const log = taoEventLog([...(await kho.docEvents(branchId))]);
            const evNen = eventGieoNen(state, ':nap');
            if (evNen)
                apDungEvent(state, evNen, log);
            const evLuat = eventGieoLuatNen(state);
            if (evLuat)
                apDungEvent(state, evLuat, log);
            // ── Phục hồi scene (lịch sử chat) từ đĩa ──
            let sceneCu = [];
            try {
                const ui = await docUiState(db, state.world.id, state.world.branchId);
                if (ui?.scene && Array.isArray(ui.scene)) {
                    sceneCu = ui.scene.filter((d) => d && typeof d.noiDung === 'string' && typeof d.loai === 'string');
                }
            }
            catch {
                // Không đọc được scene cũ thì bắt đầu trắng — phiền, không chết.
            }
            set({
                state,
                log,
                hoSo: get().hoSo ?? hoSoToiThieu('pf_local', 0),
                scene: sceneCu,
                loi: [],
                projects: [],
                choXacNhan: null,
                banTin: null,
                patchBiTuChoi: [],
                luotChuaKe: null,
                tickDaLuu: state.world.tick,
            });
            dongBo();
            return true;
        },
        async xoaVanTheoId(branchId) {
            if (!coIndexedDb())
                return;
            const r = await xoaVan(layDb(), branchId);
            if (!r.ok) {
                set({ loi: [...get().loi, ...r.errors] });
                return;
            }
            await get().napDanhSachVan();
        },
        async doiTenVanTheoId(branchId, ten) {
            if (!coIndexedDb())
                return;
            await doiTenVan(layDb(), branchId, ten);
            await get().napDanhSachVan();
        },
        /**
         * Xuất ván ra chuỗi JSON.
         *
         * [BB] 38 — `xuatSave()` cắt secret và chặn hồ sơ riêng tư khi chưa opt-in.
         * Ở đây không có phép kiểm nào thêm, và cũng không được có: thêm một đường
         * xuất thứ hai là thêm một chỗ để quên mất hàng rào ấy.
         */
        async xuatVanRaChuoi(kemHoSoRiengTu) {
            const s = get().state;
            const log = get().log;
            if (!s || !log || !coIndexedDb())
                return null;
            const r = await xuatSave(layDb(), s, [...log.tatCa()], {
                kemHoSoRiengTu,
                appVersion: PHIEN_BAN_APP,
            });
            if (!r.ok) {
                set({ loi: [...get().loi, ...r.errors] });
                return null;
            }
            return JSON.stringify(r.value, null, 2);
        },
        async xuatVanTheoIdRaChuoi(branchId, kemHoSoRiengTu) {
            if (!coIndexedDb())
                return null;
            const db = layDb();
            const kho = new KhoDexie(db);
            const r = await napState(kho, branchId);
            if (!r.ok) {
                set({ loi: [...get().loi, ...r.errors] });
                return null;
            }
            const ev = await kho.docEvents(branchId);
            const x = await xuatSave(db, r.value, ev, { kemHoSoRiengTu, appVersion: PHIEN_BAN_APP });
            if (!x.ok) {
                set({ loi: [...get().loi, ...x.errors] });
                return null;
            }
            return JSON.stringify(x.value, null, 2);
        },
        async nhapVanTuChuoi(noiDung) {
            /*
             * Lưu ván đang chơi TRƯỚC khi nhập file — cùng lẽ với `khoiTao()`.
             *
             * Kịch bản: đang chơi ván A, nhập file save từ máy khác. Không lưu ở
             * đây thì ván A mất thay đổi chưa lưu, và lỗi ấy đặc biệt khó phát hiện
             * vì nhập file không đi qua `roiVan()` — người chơi thấy ván mới hiện ra
             * và không nghĩ rằng ván cũ vừa bị xóa khỏi bộ nhớ.
             */
            if (get().state && coIndexedDb())
                await get().luuVan();
            let tho;
            try {
                tho = JSON.parse(noiDung);
            }
            catch {
                set({
                    loi: [
                        ...get().loi,
                        loi('persistence', 'FILE_KHONG_PHAI_JSON', 'File này không phải JSON đọc được.', {
                            recoverable: false,
                        }),
                    ],
                });
                return false;
            }
            const r = nhapSave(tho);
            if (!r.ok) {
                set({ loi: [...get().loi, ...r.errors] });
                return false;
            }
            const { state, events, canhBao } = r.value;
            const log = taoEventLog([...events]);
            const evNen = eventGieoNen(state, ':nhap');
            if (evNen)
                apDungEvent(state, evNen, log);
            const evLuat = eventGieoLuatNen(state);
            if (evLuat)
                apDungEvent(state, evLuat, log);
            set({
                state,
                log,
                hoSo: get().hoSo ?? hoSoToiThieu('pf_local', 0),
                scene: [],
                loi: [...canhBao],
                projects: [],
                choXacNhan: null,
                banTin: null,
                patchBiTuChoi: [],
                luotChuaKe: null,
                tickDaLuu: null,
            });
            dongBo();
            // Nhập từ file rồi mới ghi xuống đĩa: trước lúc ấy nó chưa phải một ván
            // trên máy này, và nó không được xuất hiện trong danh sách "Tiếp tục".
            await get().luuVan();
            await get().napDanhSachVan();
            return true;
        },
        // ── lorebook ──
        async nhapLorebookTuChuoi(noiDung, ten) {
            const s = get().state;
            const log = get().log;
            if (!s || !log)
                return false;
            let tho;
            try {
                tho = JSON.parse(noiDung);
            }
            catch {
                set({
                    loi: [
                        ...get().loi,
                        loi('preset', 'LORE_KHONG_PHAI_JSON', 'File lorebook không phải JSON đọc được.', {
                            recoverable: false,
                        }),
                    ],
                });
                return false;
            }
            const id = `lore_${s.world.tick}_${s.lorebooks.size + 1}`;
            const kq = nhapLorebook({
                goc: tho,
                id,
                ten: ten.trim() === '' ? id : ten.trim(),
                nguon: 'nguoi_dung',
                branchId: s.world.branchId,
                tyLeToken: TY_LE_TOKEN,
            });
            const nang = kq.issues.filter((i) => i.severity === 'error');
            if (!kq.ok || kq.lorebook === null) {
                set({
                    loi: [...get().loi, ...nang.map((i) => loi('preset', i.code, i.message, { recoverable: false }))],
                });
                return false;
            }
            const evId = `ev_nhap_lore_${id}`;
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: 'nhap_lorebook',
                actorIds: [],
                targetIds: [],
                causeEventIds: [],
                locationId: null,
                patches: [
                    {
                        op: 'link',
                        target: { table: 'lorebooks', id, path: '' },
                        value: { ...kq.lorebook, branchId: s.world.branchId },
                        sourceEventId: evId,
                    },
                    // Sách nhập vào mặc định TẮT. Kỳ vọng chỉ được tạo ở `batLorebook()`;
                    // nếu tạo tại đây thì công tắc tắt chỉ đổi nhãn mà nguồn vẫn tác động.
                ],
                visibility: 'engine',
                source: 'player',
                payload: { id, dinhDang: kq.dinhDang, soEntry: kq.lorebook.entries.length },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...get().loi, ...ok.errors] });
                return false;
            }
            // Cảnh báo mức thấp vẫn phải hiện — nhập được không có nghĩa là nhập sạch.
            set({
                loi: [
                    ...get().loi,
                    ...kq.issues
                        .filter((i) => i.severity !== 'error')
                        .map((i) => loi('preset', i.code, i.message, { severity: 'warning', recoverable: true })),
                ],
            });
            dongBo();
            void get().luuVan();
            return true;
        },
        batLorebook(id, bat) {
            const s = get().state;
            const log = get().log;
            const lb = s?.lorebooks.get(id);
            if (!s || !log || !lb || lb.bat === bat)
                return;
            demLore++;
            const evId = `ev_lore_bat_${id}_${s.world.tick}_${bat ? 1 : 0}_${demLore}`;
            const lbMoi = { ...lb, bat, tickBat: bat ? s.world.tick : null };
            const patches = [
                {
                    op: 'flag',
                    target: { table: 'lorebooks', id, path: 'bat' },
                    value: bat,
                    sourceEventId: evId,
                },
                {
                    op: 'set',
                    target: { table: 'lorebooks', id, path: 'tickBat' },
                    value: lbMoi.tickBat,
                    sourceEventId: evId,
                },
            ];
            if (bat) {
                for (const kv of trichKyVong(lbMoi, s.world.branchId)) {
                    if (s.loreExpectations.has(kv.id))
                        continue;
                    patches.push({
                        op: 'link',
                        target: { table: 'loreExpectations', id: kv.id, path: '' },
                        value: kv,
                        sourceEventId: evId,
                    });
                }
                for (const entity of vatChatHoaLorebook(lbMoi, s, evId)) {
                    if (s.entities.has(entity.id))
                        continue;
                    patches.push({
                        op: 'link',
                        target: { table: 'entities', id: entity.id, path: '' },
                        value: entity,
                        sourceEventId: evId,
                    });
                }
            }
            else {
                // Tắt là ngừng lực hút: bỏ các kỳ vọng đang theo dõi. Entity đã xuất hiện
                // là Sử nên được giữ lại, không xóa ngược lịch sử của thế giới.
                for (const kv of s.loreExpectations.values()) {
                    if (kv.lorebookId !== id)
                        continue;
                    patches.push({
                        op: 'unlink',
                        target: { table: 'loreExpectations', id: kv.id, path: '' },
                        sourceEventId: evId,
                    });
                }
            }
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: bat ? 'bat_lorebook' : 'tat_lorebook',
                actorIds: [],
                targetIds: [],
                causeEventIds: [],
                locationId: null,
                patches,
                visibility: 'engine',
                source: 'player',
                payload: { id, bat },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...get().loi, ...ok.errors] });
                return;
            }
            if (bat)
                capNhatLoreTrongState(s, log, 'Lorebook vừa được bật và các neo đã được hiện thực hóa.');
            dongBo();
            void get().luuVan();
        },
        // ── vật lý thế giới ──
        datTenTrucNen(truc, khaiNiemNenId) {
            const s = get().state;
            const log = get().log;
            if (!s || !log)
                return ['Chưa mở ván nào.'];
            const ds = [...s.substrateLaws.values()];
            const r = datTenTruc({
                ds,
                truc,
                khaiNiemNenId,
                nguoiDatTenId: s.world.playerState.chuTheId,
                tick: s.world.tick,
                state: s,
            });
            if (!r.ok)
                return r.loi;
            const evId = `ev_dat_ten_truc_${truc}_${s.world.tick}`;
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: 'dat_ten_luat_nen',
                actorIds: s.world.playerState.chuTheId ? [s.world.playerState.chuTheId] : [],
                targetIds: [khaiNiemNenId],
                causeEventIds: [],
                locationId: null,
                patches: [
                    {
                        op: 'link',
                        target: { table: 'substrateLaws', id: r.luatNen.id, path: '' },
                        value: r.luatNen,
                        sourceEventId: evId,
                    },
                ],
                visibility: 'engine',
                source: 'player',
                payload: { truc, khaiNiemNenId, soKeHo: r.keHo.length },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...get().loi, ...ok.errors] });
                return ok.errors.map((e) => e.message);
            }
            // [BB] 44.4 — dòng biên niên sử vào khung kể, không vào một cái log riêng.
            themDong('he_thong', r.dongBienNien);
            dongBo();
            void get().luuVan();
            return [];
        },
        quetCoCheNgay() {
            const s = get().state;
            const log = get().log;
            if (!s || !log)
                return [];
            const chuyen = quetCoChe({
                state: s,
                luatNen: [...s.substrateLaws.values()],
                hienTai: [...s.coChe.values()],
                branchId: s.world.branchId,
                tick: s.world.tick,
            });
            const doi = chuyen.filter((c) => c.vuaBat || c.vuaTat);
            demQuetCoChe++;
            const evId = `ev_quet_co_che_${s.world.tick}_${demQuetCoChe}`;
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: 'quet_co_che',
                actorIds: [],
                targetIds: [],
                causeEventIds: [],
                locationId: null,
                patches: chuyen.map((c) => ({
                    op: 'link',
                    target: { table: 'coChe', id: c.row.id, path: '' },
                    value: c.row,
                    sourceEventId: evId,
                })),
                visibility: 'engine',
                source: 'engine',
                payload: { soDoi: doi.length },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...get().loi, ...ok.errors] });
                return [];
            }
            for (const c of doi)
                themDong('he_thong', c.congBo);
            dongBo();
            void get().luuVan();
            return doi.map((c) => c.congBo);
        },
        // ── nhánh ──
        async tachNhanh(ten, lyDo) {
            const s = get().state;
            if (!s || !coIndexedDb())
                return false;
            // Nhánh cha phải xuống đĩa TRƯỚC: nhánh con đọc bằng cách lần lên cha, và
            // lần lên một nhánh chưa tồn tại thì ra thế giới rỗng.
            await get().luuVan();
            const db = layDb();
            const kho = new KhoDexie(db);
            /*
             * Id nhánh dựng từ NHỊP và số nhánh đã có, không từ đồng hồ máy.
             *
             * Cùng lẽ với luật bất biến #7: id đi vào `branchId` của mọi bản ghi, nên
             * một id có giờ trong đó sẽ làm hai lần tách cùng một ván trên hai máy cho
             * hai cây nhánh không so được với nhau.
             */
            const idMoi = `br_${s.world.branchId}_t${s.world.tick}_${(await db.branches.count()) + 1}`;
            try {
                await kho.kho.fork(BranchSchema.parse({
                    id: idMoi,
                    worldId: s.world.id,
                    gocId: s.world.branchId,
                    tickTao: s.world.tick,
                    ten: ten.trim(),
                    lyDoTach: lyDo.trim(),
                    dangChay: true,
                }));
            }
            catch (e) {
                set({
                    loi: [
                        ...get().loi,
                        loi('persistence', 'TACH_NHANH_HONG', `Không tách được nhánh: ${String(e)}`, {
                            recoverable: true,
                        }),
                    ],
                });
                return false;
            }
            const ok = await get().tiepTucVan(idMoi);
            if (!ok)
                return false;
            /*
             * Ghi NHẸ ngay sau khi nhảy sang.
             *
             * `danhSachSave()` liệt kê từ bảng `worlds`; nhánh con chưa có hàng world
             * thì nó tách xong rồi biến mất khỏi cả Bản Đồ Nhánh lẫn Sảnh Vào. Ghi
             * nhẹ chứ không `luuVan()`: fork không được sao chép entity — đó là toàn
             * bộ điểm của copy-on-write.
             */
            const s2 = get().state;
            if (s2)
                await ghiVanNhe(db, s2, ten);
            await get().napDanhSachVan();
            return true;
        },
        // ── Diễn Hóa ──
        async chayDienHoa(thayDoi) {
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            if (!s || !log || get().dangDienHoa)
                return;
            const { presetId, ...phanCauHinh } = thayDoi;
            const cauHinh = CauHinhDienHoaSchema.parse({ ...phanCauHinh });
            const tickDau = s.world.tick;
            const truoc = { reality: s.metrics.realityIntegrity, songDong: s.metrics.doSongDong };
            const anhChup = hashState(s);
            const suKienLon = [];
            /**
             * Đường ống workflow — [BB] 50.9, món nợ Phase 12 ghi ra.
             *
             * `null` nghĩa là lượt tua này chỉ có engine chạy, và đó là trạng thái HỢP
             * LỆ chứ không phải thiếu sót: điểm cuối Diễn Hóa tắt được (46.1), và
             * preset `trong` là một lựa chọn thật.
             */
            const duongOng = chuanBiDuongOng(presetId ?? '');
            const vet = [];
            let soCallWorkflow = 0;
            set({ dangDienHoa: true, vetDuongOng: [] });
            let luot = 0;
            let lyDoDung = 'chạy hết số lượt đã đặt';
            try {
                for (; luot < cauHinh.soLuot; luot++) {
                    let kyVongVuaLech = [];
                    const buoc = TICK_MOI_NHIP[cauHinh.nhipMoiLuot];
                    for (let i = 0; i < buoc; i++) {
                        const r = motTick(s, { tuning: TUNING_MAC_DINH, tienTrinhNen: chayTienTrinhNen });
                        for (const ev of r.events) {
                            const ok = apDungEvent(s, ev, log);
                            if (!ok.ok) {
                                set({ loi: [...get().loi, ...ok.errors] });
                                lyDoDung = 'engine từ chối một thay đổi — xem Tự Chẩn Đoán';
                                luot = cauHinh.soLuot;
                                break;
                            }
                        }
                        for (const sk of r.suKien) {
                            if (sk.mucDo !== 'trong_dai')
                                continue;
                            suKienLon.push({
                                tick: s.world.tick,
                                moTa: sk.moTa,
                                loai: sk.loai,
                                entityIds: [...sk.chuTheIds],
                            });
                        }
                    }
                    kyVongVuaLech = capNhatLoreTrongState(s, log, 'Kỳ vọng được đối chiếu sau một lượt Diễn Hóa.');
                    /*
                     * Đường ống chạy SAU khi engine đã tua xong lượt này.
                     *
                     * Thứ tự ấy là [BB] 71.5 viết thành mã: engine quyết điều gì xảy ra và
                     * giữ mọi con số; workflow đọc kết quả rồi viết thêm phần chỉ model làm
                     * được. Chạy ngược lại sẽ để model quyết trước và engine phải chiều theo.
                     */
                    if (duongOng !== null) {
                        const kq = await duongOng.chay(s, luot + 1);
                        soCallWorkflow += kq.soCall;
                        vet.push(...kq.vet);
                        set({ vetDuongOng: [...vet] });
                    }
                    /**
                     * [BB] 47.3 — Smart Stop. Dừng vì có chuyện đáng xem, không vì hết lượt.
                     *
                     * Kiểm SAU mỗi lượt chứ không sau mỗi tick: một cao trào kéo dài cả
                     * mùa, và dừng ngay tick đầu tiên nó chớm lên sẽ đưa người chơi vào
                     * giữa một cảnh chưa có gì để nhìn.
                     */
                    const dung = kiemDieuKienDung({
                        state: s,
                        cauHinh,
                        luotDaChay: luot + 1,
                        soCall: soCallWorkflow,
                        tokenDaDung: 0,
                        kyVongVuaLech,
                        realityTruoc: truoc.reality,
                    });
                    if (dung !== null) {
                        lyDoDung = dung.moTa;
                        suKienLon.push({
                            tick: s.world.tick,
                            moTa: dung.moTa,
                            loai: dung.loai,
                            entityIds: [...dung.entityIds],
                        });
                        luot++;
                        break;
                    }
                }
            }
            finally {
                set({ dangDienHoa: false });
            }
            const evLog = EvolutionLogSchema.parse({
                id: `dh_${s.world.branchId}_${tickDau}`,
                branchId: s.world.branchId,
                tickBatDau: tickDau,
                tickKetThuc: s.world.tick,
                soLuotChay: luot,
                // Một call cho lượt kể cuối, cộng mọi call của đường ống.
                soCall: 1 + soCallWorkflow,
                tokenDaDung: 0,
                lyDoDung,
                // [BB] 47.6 giữ tối đa số mục đáng xem; báo cáo dài quá thì không ai đọc.
                suKienLon: suKienLon.slice(0, 40),
                anhChup,
            });
            const bc = baoCaoDienHoa(evLog, truoc, {
                reality: s.metrics.realityIntegrity,
                songDong: s.metrics.doSongDong,
            });
            set({ baoCaoDienHoa: bc });
            dongBo();
            await keLuot('', [
                `Thời gian trôi từ nhịp ${tickDau} tới nhịp ${s.world.tick}.`,
                `Diễn Hóa dừng vì: ${lyDoDung}`,
                ...suKienLon.slice(0, 6).map((x) => x.moTa),
            ]);
        },
        async roiVan() {
            await get().luuVan();
            await get().napDanhSachVan();
            set({
                state: null,
                log: null,
                view: null,
                scene: [],
                loi: [],
                projects: [],
                choXacNhan: null,
                banTin: null,
                patchBiTuChoi: [],
                luotChuaKe: null,
            });
        },
        /**
         * [BB] 29.1 — chuyển ống kính KHÔNG tốn lượt và KHÔNG tốn thời gian trong
         * game. Không `apDungEvent`, không `motTick`, không `keLuot`: nó chỉ đổi chỗ
         * ta đang nhìn, và lượt kể sau sẽ dùng chỗ mới.
         */
        /**
         * [BB] 77.10 — "metric được lưu, có baseline TRƯỚC khi tối ưu semantic".
         *
         * Vì vậy nút này luôn chạy HAI lượt khi có adapter: một lượt heuristic thuần
         * để lấy baseline, rồi một lượt ở chế độ đang bật. So một mode với chính nó
         * là cách một reranker tệ đi mà vẫn báo "đạt".
         */
        async chayDanhGiaTruyHoi() {
            const s = get().state;
            if (!s || get().dangDanhGia)
                return;
            set({ dangDanhGia: true });
            try {
                const ai = useAi.getState();
                const chung = {
                    tuning: TUNING_MAC_DINH,
                    nganSachToken: Math.round(nganSachInput('ke_canh', null) * 0.4),
                    tyLeToken: TY_LE_TOKEN,
                    dongHo: () => performance.now(),
                };
                const base = await chayBoDanhGia(s, {
                    ...chung,
                    config: CAU_HINH_HEURISTIC,
                    adapter: null,
                });
                const adapter = ai.adapterRerank();
                const kq = adapter === null
                    ? base
                    : await chayBoDanhGia(s, {
                        ...chung,
                        config: ai.cfg.rerank,
                        adapter,
                        baseline: base.tongKet,
                    });
                set({ danhGiaTruyHoi: kq });
            }
            finally {
                set({ dangDanhGia: false });
            }
        },
        chiaOngKinh(mucTieu) {
            const s = get().state;
            set({
                ongKinh: datOngKinh(get().ongKinh, mucTieu, s?.world.tick ?? 0),
                viChieu: 'Người chơi tự chĩa ống kính.',
            });
        },
        ungVienChuThe(mode) {
            const s = get().state;
            if (!s)
                return [];
            return chonChuThe(s, mode);
        },
        // ── tầng Phàm Nhân ──
        soTay() {
            const s = get().state;
            const view = get().view;
            const chuTheId = s?.world.playerState.chuTheId ?? null;
            if (!s || !view || chuTheId === null)
                return null;
            // [BB] 33.3 / 56.2 — `dungSoTay` chỉ nhận `WorldView`. Tri thức lọc sẵn về
            // đúng người này, nên nó theo định nghĩa là thứ họ biết.
            return dungSoTay({
                view,
                triThuc: [...s.knowledge.values()].filter((r) => r.knowerId === chuTheId),
                viecDangLam: dangODau(s, chuTheId).viec,
                nghiThucVoIch: [],
            });
        },
        async noiVoi(pn) {
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            const toi = s?.world.playerState.chuTheId ?? null;
            if (!s || !log || toi === null)
                return;
            const evId = `ev_noi_${s.world.tick}_${toi}_${pn.nguoiNgheId}`;
            const r = noiMotCau(s, { ...pn, nguoiNoiId: toi }, { eventId: evId, tick: s.world.tick, rng: rngCuaTick(s.world.seed, s.world.tick, `noi:${evId}`) });
            if (!r.ok) {
                set({ loi: [...get().loi, ...r.errors] });
                return;
            }
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: `doi_thoai_${pn.loai}`,
                actorIds: [toi],
                targetIds: [pn.nguoiNgheId],
                causeEventIds: [],
                locationId: pn.noiId,
                patches: [...r.value.patches],
                // Nói dối và nghe lỏm không phải chuyện công khai.
                visibility: r.value.laNoiDoi || r.value.nguoiNgheLon.length > 0 ? 'gioi_han' : 'cong_khai',
                source: 'player',
                payload: { loai: pn.loai, mucHieu: r.value.mucHieu, factId: r.value.factId },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...ok.errors] });
                return;
            }
            dongBo();
            await keLuot(pn.noiDung, [r.value.loiKe]);
        },
        async xinHocNghe(thayId) {
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            const toi = s?.world.playerState.chuTheId ?? null;
            if (!s || !log || toi === null)
                return;
            const evId = `ev_xin_hoc_${s.world.tick}_${toi}`;
            const r = xinHoc(s, toi, thayId, {
                eventId: evId,
                tick: s.world.tick,
                rng: rngCuaTick(s.world.seed, s.world.tick, evId),
            });
            if (!r.ok) {
                set({ loi: [...get().loi, ...r.errors] });
                return;
            }
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: 'nhan_hoc_tro',
                actorIds: [thayId],
                targetIds: [toi],
                causeEventIds: [],
                locationId: null,
                patches: [...r.value.patches],
                visibility: 'cong_khai',
                source: 'player',
                payload: { thayId, troId: toi },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...ok.errors] });
                return;
            }
            dongBo();
            await keLuot('', [r.value.loiKe]);
        },
        async lapNhaMoi(ten) {
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            const toi = s?.world.playerState.chuTheId ?? null;
            if (!s || !log || toi === null)
                return;
            const noiO = noiOCua(s, toi);
            if (noiO === null) {
                set({
                    loi: [
                        ...get().loi,
                        loi('intent', 'KHONG_CO_NOI_O', 'Ngươi chưa ở đâu cả, nên chưa dựng nhà ở đâu được.', {
                            recoverable: true,
                        }),
                    ],
                });
                return;
            }
            const evId = `ev_lap_ho_${s.world.tick}_${toi}`;
            const r = lapHo(s, { chuHoId: toi, thanhVien: [], noiOId: noiO, ten }, { eventId: evId, tick: s.world.tick });
            if (!r.ok) {
                set({ loi: [...get().loi, ...r.errors] });
                return;
            }
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: 'lap_ho',
                actorIds: [toi],
                targetIds: [],
                causeEventIds: [],
                locationId: noiO,
                patches: [...r.value.patches],
                visibility: 'cong_khai',
                source: 'player',
                payload: { hoId: r.value.hoId },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...ok.errors] });
                return;
            }
            dongBo();
            await keLuot('', [r.value.loiKe]);
        },
        duongTiepTuc() {
            const s = get().state;
            const toi = s?.world.playerState.chuTheId ?? null;
            if (!s || toi === null)
                return [];
            const e = s.entities.get(toi);
            // Chưa chết thì không có gì để chọn — và đó là câu trả lời đúng.
            if (!e || e.tickDiet === null)
                return [];
            return duongDiTiep(s, toi);
        },
        async diTiep(chon) {
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            if (!s || !log)
                return;
            const evId = `ev_di_tiep_${s.world.tick}_${chon.duong}`;
            const patches = [];
            let loiKe = '';
            if (chon.duong === 'anh_linh') {
                const r = anhLinhHoaThan(s, chon.chuTheMoiId, { eventId: evId, tick: s.world.tick });
                if (!r.ok) {
                    set({ loi: [...get().loi, ...r.errors] });
                    return;
                }
                patches.push(...r.value.patches);
                loiKe = r.value.loiKe;
            }
            else {
                loiKe =
                    chon.duong === 'ke_thua'
                        ? `Đời tiếp tục bằng ${chon.ten} — ${chon.vi}.`
                        : `Thế giới đi tiếp, và lần này ta nhìn nó qua mắt ${chon.ten}.`;
            }
            // Đổi chủ thể qua đúng cửa của 21.3 — hóa thần thì lên tầng Thần.
            const modeMoi = chon.duong === 'anh_linh' ? 'than' : 'pham_nhan';
            patches.push({
                op: 'set',
                target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
                value: modeMoi,
                sourceEventId: evId,
            }, {
                op: 'set',
                target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
                value: chon.chuTheMoiId,
                sourceEventId: evId,
            }, {
                op: 'push',
                target: { table: 'worlds', id: 'worlds', path: 'playerState.lichSuChuyenTang' },
                value: {
                    tick: s.world.tick,
                    tu: s.world.playerState.mode,
                    den: modeMoi,
                    lyDo: `sau khi chết — đường ${chon.duong}`,
                },
                sourceEventId: evId,
            });
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: `di_tiep_${chon.duong}`,
                actorIds: [chon.chuTheMoiId],
                targetIds: [],
                causeEventIds: [],
                locationId: null,
                patches,
                visibility: 'cong_khai',
                source: 'player',
                payload: { duong: chon.duong },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...ok.errors] });
                return;
            }
            dongBo();
            await keLuot('', [loiKe]);
        },
        loiCauDangCho() {
            const s = get().state;
            if (!s)
                return [];
            return loiCauCho(s, s.world.playerState.chuTheId, s.world.tick);
        },
        async traLoi(cau, cach) {
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            if (!s || !log)
                return;
            const evId = `ev_traloi_${s.world.tick}_${cau.id}`;
            const r = traLoiCau(s, cau, cach, { tick: s.world.tick, eventId: evId });
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: `tra_loi_cau_${cach}`,
                actorIds: s.world.playerState.chuTheId ? [s.world.playerState.chuTheId] : [],
                targetIds: [cau.nguoiCauId],
                causeEventIds: [],
                locationId: cau.nguoiCauId,
                patches: [...r.patches],
                visibility: 'cong_khai',
                source: 'player',
                payload: { prayerId: cau.id, cach },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...ok.errors] });
                return;
            }
            dongBo();
            await keLuot('', [`Lời cầu: "${cau.noiDung}".`, r.loiKe]);
        },
        async dapApLuc(tinhHuongId, cach) {
            if (!doiCong())
                return;
            const s = get().state;
            const log = get().log;
            const thanId = s?.world.playerState.chuTheId ?? null;
            if (!s || !log || !thanId)
                return;
            const than = s.entities.get(thanId);
            const bn = than?.aspects['ban_nga'];
            if (!than || !bn)
                return;
            const th = bn.pressure.tinhHuongMo.find((x) => x.id === tinhHuongId);
            const idx = bn.pressure.tinhHuongMo.findIndex((x) => x.id === tinhHuongId);
            if (!th || idx < 0)
                return;
            const evId = `ev_diHoa_${s.world.tick}_${tinhHuongId}`;
            const r = dapDiHoa(than, bn, th.truc, cach, {
                eventId: evId,
                tick: s.world.tick,
                tuning: TUNING_MAC_DINH,
                rng: rngCuaTick(s.world.seed, s.world.tick, `dap:${tinhHuongId}`),
            });
            const ev = taoEvent({
                id: evId,
                branchId: s.world.branchId,
                tick: s.world.tick,
                loai: r.loaiEvent,
                actorIds: [thanId],
                targetIds: [],
                causeEventIds: [],
                locationId: null,
                patches: [
                    ...r.patches,
                    {
                        op: 'set',
                        target: {
                            table: 'entities',
                            id: thanId,
                            path: `aspects.ban_nga.pressure.tinhHuongMo.${idx}.daChon`,
                        },
                        value: cach,
                        sourceEventId: evId,
                    },
                ],
                visibility: 'cong_khai',
                source: 'player',
                payload: { tinhHuongId, cach, truc: th.truc },
            });
            const ok = apDungEvent(s, ev, log);
            if (!ok.ok) {
                set({ loi: [...ok.errors] });
                return;
            }
            dongBo();
            await keLuot('', [th.moTa, r.loiKe]);
        },
    };
});
