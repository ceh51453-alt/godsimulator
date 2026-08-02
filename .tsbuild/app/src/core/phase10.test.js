/**
 * Cổng Phase 10 — Lorebook, Workflow, RAG và hệ nâng cao.
 *
 * Sáu cổng của Phần 75 Phase 10, cộng các mục [BB] của Khối I, L, N và O.
 * Mỗi `describe` là một cổng; không bài nào kiểm bằng cách đọc tài liệu.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TUNING_MAC_DINH, TuningSchema } from './tuning/schema.js';
import { taoState, taoEventLog, hashState } from './engine/state.js';
import { apDungChuoi, apDungEvent } from './engine/transaction.js';
import { apPatch } from './engine/patch.js';
import { motTick } from './engine/tick.js';
import { chayTienTrinhNen } from './world/process/scheduler.js';
import { moThuGioi, KhoiTaoWorldSchema } from './world/khoiTao.js';
import { eventGieoNen } from './world/gieoNen.js';
import { napBatBienTheGioiSong } from './world/batBien.js';
import { napBatBienPhase10 } from './world/batBienP10.js';
import { datLaiInvariant, chayInvariantToanBo } from './engine/invariant.js';
import { EntitySchema } from './schema/entity.js';
import { LawfulSchema } from './schema/aspect/lawful.js';
import { ConceptualSchema } from './schema/aspect/conceptual.js';
import { R, napDungSan } from './registry/index.js';
import { loaiMachThieuHandler } from './truyen/loaiMach.js';
// ── Khối L ──
import { tinhHieuLuc, kiemTiepDia, khaiNiemHuDanh, suyKhaiNiemSanCo, anhHuongKhiKhaiNiemYeuDi, coTheHoiSinh, bangTiepDia, } from './vatly/tiepDia.js';
import { luatNenMacDinh, datTenTruc, daCoTen, thamSoCua, keHoCuaTruc, quetTuKetTinh, suaLuatNen, laKhoangCachYNghia, canhLienKeYNghia, bangLuatNen, } from './vatly/luatNen.js';
import { CO_CHE, quetCoChe, quetMotCoChe, hauQuaKhiTat, thanBi, keoBanTinh, hauQuaVuKhiKhaiNiem, bangCoChe, } from './vatly/coChe.js';
import { TRUC_NEN, PHU_THUOC_TRUC, THAM_SO_MAC_DINH, SubstrateLawSchema } from './vatly/schema.js';
// ── Khối I + O ──
import { nhapLorebook, doDinhDangLore, kiemEjs } from './lore/nhap.js';
import { LorebookEntrySchema, DAI_ORDER, NGUONG_TIN_CAY_NAP } from './lore/schema.js';
import { doiSoatEntry, phanLoaiQuanHe, che, boChe, kiemNguonSinhSu, bangDoiSoat, UU_TIEN_NGUON, } from './lore/doiSoat.js';
import { apMotOp, apLoOp, duocPhep, QUYEN_OP, conTrongThungRac } from './lore/ops.js';
import { tinhDoTinCay, duocNap, thuHoachDanhTu, goiYKeys, kiemEntry, briefSinhEntry } from './lore/tinCay.js';
import { trichKyVong, capNhatKyVong, aiThoa, banDoDiBiet, entryCanChe } from './lore/kyVong.js';
// ── Khối N ──
import { WorkflowTaskSchema, WorkflowPresetSchema } from './workflow/schema.js';
import { quyetDinhChay, trangThaiLichMoi, docTickTuVanBan, TICK_MOI_DON_VI } from './workflow/lich.js';
import { chayDuongOng, gop } from './workflow/chay.js';
import { ghiLorebook, docJsonPatch, gopDelta, opEngineCua, tuKichHoatChinhNo } from './workflow/dichGhi.js';
import { PRESET_WORKFLOW, TAC_VU_DUNG_SAN, kiemLanRanh, chanDoanWorkflow, xuatPreset, nhapPresetWorkflow, } from './workflow/dungSan.js';
// ── nhánh, diễn hóa, pack, benchmark ──
import { soSanhNhanh, gopNhanh } from './branch/gopNhanh.js';
import { CauHinhDienHoaSchema, locPatchTheoLanRanh, kiemDieuKienDung, baoCaoDienHoa, EvolutionLogSchema, BANG_CAM_DIEN_HOA, } from './world/dienHoa.js';
import { nhapWorldPack, xuatWorldPack } from './registry/packDsl.js';
import { chayBenchmark, ketLuan, dongLichSu, soSanhPhien } from './retrieval/benchmark.js';
import { RetrievalEvalCaseSchema } from './schema/rerank.js';
// ─────────────────────────────────────────── tiện ích
const TUNING = TUNING_MAC_DINH;
function theGioi(seed = 'p10') {
    const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
    const { world, events } = moThuGioi(ct);
    const state = taoState(world);
    const log = taoEventLog();
    expect(apDungChuoi(state, events, log).ok).toBe(true);
    const ev = eventGieoNen(state);
    expect(apDungEvent(state, ev, log).ok).toBe(true);
    return { state, log };
}
function chayTick(s, log, so) {
    for (let i = 0; i < so; i++) {
        const r = motTick(s, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
        for (const ev of r.events)
            expect(apDungEvent(s, ev, log).ok).toBe(true);
    }
}
const khaiNiem = (id, ten, trongSo, giaiDoan, tags = []) => EntitySchema.parse({
    id,
    branchId: 'br_goc',
    kind: 'concept',
    ten,
    tickSinh: 0,
    tags,
    aspects: { conceptual: ConceptualSchema.parse({ trongSo, giaiDoan, nguongKetTinh: 1000 }) },
});
const luat = (id, ten, tiepDia) => EntitySchema.parse({
    id,
    branchId: 'br_goc',
    kind: 'law',
    ten,
    tickSinh: 0,
    aspects: { lawful: LawfulSchema.parse({ vanBan: ten, bien: 'không phán xét động cơ', tiepDia }) },
});
const entry = (over) => LorebookEntrySchema.parse(over);
// ═══════════════════════════════════════════ KHỐI L — TIẾP ĐỊA
describe('42.4 [BB] — Hiệu Lực dùng MIN, không dùng trung bình', () => {
    function theGioiCoLuat() {
        const { state } = theGioi('tiepdia');
        for (const e of [
            khaiNiem('kn.mau', 'Máu', 780, 'thanh_hinh'),
            khaiNiem('kn.bao_luc', 'Bạo Lực', 2140, 'ket_tinh'),
            khaiNiem('kn.tay_ue', 'Tẩy Uế', 0, 'hu_danh'),
            khaiNiem('kn.bat_kha_nghich', 'Bất Khả Nghịch', 260, 'manh_nha'),
        ]) {
            state.entities.set(e.id, e);
        }
        state.entities.set('luat.mau', luat('luat.mau', 'Máu đã đổ thì không rửa được', [
            { khaiNiemId: 'kn.mau', vaiTro: 'doi_tuong' },
            { khaiNiemId: 'kn.bao_luc', vaiTro: 'tac_dong' },
            { khaiNiemId: 'kn.tay_ue', vaiTro: 'tac_dong' },
            { khaiNiemId: 'kn.bat_kha_nghich', vaiTro: 'pham_tru' },
        ]));
        return state;
    }
    it('một khái niệm trọng số 0 kéo cả câu luật về 0 — dù ba cái kia rất mạnh', () => {
        const s = theGioiCoLuat();
        const kq = tinhHieuLuc(s.entities.get('luat.mau'), s, TUNING);
        expect(kq.hieuLuc).toBe(0);
        expect(kq.matXichYeuNhat?.ten).toBe('Tẩy Uế');
        // Trung bình sẽ ra khoảng 60 — con số ấy KHÔNG được xuất hiện.
        const trungBinh = kq.manhNoi.reduce((t, m) => t + m.diem, 0) / kq.manhNoi.length;
        expect(Math.round(trungBinh * 100)).toBeGreaterThan(30);
    });
    it('[BB] 42.7 — panel giải thích vì sao, và dòng cuối dạy cơ chế', () => {
        const s = theGioiCoLuat();
        const kq = tinhHieuLuc(s.entities.get('luat.mau'), s, TUNING);
        expect(kq.loiGiaiThich).toContain('Tẩy Uế');
        const bang = bangTiepDia(kq);
        expect(bang).toContain('TIẾP ĐỊA');
        expect(bang).toContain('HIỆU LỰC: 0%');
        expect(bang).toContain('mắt xích yếu nhất');
    });
    it('nuôi khái niệm yếu nhất lên thì luật mạnh dần — cùng câu chữ, sau vài kỷ nguyên có răng', () => {
        const s = theGioiCoLuat();
        const truoc = tinhHieuLuc(s.entities.get('luat.mau'), s, TUNING).hieuLuc;
        s.entities.set('kn.tay_ue', khaiNiem('kn.tay_ue', 'Tẩy Uế', 900, 'thanh_hinh'));
        const sau = tinhHieuLuc(s.entities.get('luat.mau'), s, TUNING).hieuLuc;
        expect(truoc).toBe(0);
        expect(sau).toBeGreaterThan(0);
        // Giờ mắt xích yếu nhất đổi sang cái khác — đó là dấu hiệu min hoạt động đúng.
        expect(tinhHieuLuc(s.entities.get('luat.mau'), s, TUNING).matXichYeuNhat?.ten).not.toBe('Tẩy Uế');
    });
    it('luật không khai tiếp địa nào thì hiệu lực 0, không phải 100', () => {
        const s = theGioiCoLuat();
        s.entities.set('luat.trong', luat('luat.trong', 'Một câu chưa ai khai nền', []));
        expect(tinhHieuLuc(s.entities.get('luat.trong'), s, TUNING).hieuLuc).toBe(0);
    });
});
describe('42.3, 42.6 — ba chế độ tiếp địa; hai chế độ mềm KHÔNG BAO GIỜ trượt', () => {
    function s0(cheDo) {
        const { state } = theGioi('chedo');
        const l = luat('luat.x', 'Luật X', [{ khaiNiemId: 'kn.chua_co', vaiTro: 'tac_dong' }]);
        const lawful = LawfulSchema.parse({
            ...l.aspects['lawful'],
            cheDoTiepDia: cheDo,
            tiepDia: [{ khaiNiemId: 'kn.chua_co', vaiTro: 'tac_dong', batBuoc: true }],
            bien: 'không làm gì với động cơ',
        });
        state.entities.set('luat.x', { ...l, aspects: { lawful: lawful } });
        return state;
    }
    it('chat_che TỪ CHỐI và nêu rõ khái niệm nào còn thiếu', () => {
        const kq = kiemTiepDia(s0('chat_che').entities.get('luat.x'), s0('chat_che'));
        expect(kq.dat).toBe(false);
        expect(kq.thieu).toEqual(['kn.chua_co']);
        expect(kq.loi[0]).toContain('kn.chua_co');
    });
    it('[BB] tu_tiep_dia NHẬN luật, tạo khái niệm hư danh, và nói rõ nó yếu', () => {
        const s = s0('tu_tiep_dia');
        const kq = kiemTiepDia(s.entities.get('luat.x'), s);
        expect(kq.dat).toBe(true);
        expect(kq.canTao).toEqual(['kn.chua_co']);
        expect(kq.canhBao[0]).toContain('hư danh');
        const kn = khaiNiemHuDanh('kn.chua_co', 'br_goc', 3, 1000);
        expect(kn.aspects['conceptual'].trongSo).toBe(0);
        s.entities.set(kn.id, kn);
        expect(tinhHieuLuc(s.entities.get('luat.x'), s, TUNING).hieuLuc).toBe(0);
    });
    it('tu_suy tìm khái niệm SẴN CÓ trước khi tạo mới — không đẻ khái niệm song song', () => {
        const s = s0('tu_suy');
        s.entities.set('kn.tay_ue', khaiNiem('kn.tay_ue', 'Tẩy Uế', 500, 'thanh_hinh'));
        expect(suyKhaiNiemSanCo('tay_ue', s)).toBe('kn.tay_ue');
        // Khớp cả theo TÊN, không chỉ theo id — "Tẩy Uế" và `tay_ue` là một thứ.
        expect(suyKhaiNiemSanCo('Tẩy Uế', s)).toBe('kn.tay_ue');
        expect(suyKhaiNiemSanCo('khong_he_co', s)).toBeNull();
    });
});
describe('42.5 [BB] — đánh vào khái niệm thay vì đánh vào luật', () => {
    it('làm khái niệm nền yếu đi thì luật tụt hiệu lực mà KHÔNG bị bãi bỏ', () => {
        const { state } = theGioi('danhkhainiem');
        state.entities.set('kn.tay_ue', khaiNiem('kn.tay_ue', 'Tẩy Uế', 900, 'thanh_hinh'));
        state.entities.set('luat.mau', luat('luat.mau', 'Máu không rửa được', [{ khaiNiemId: 'kn.tay_ue', vaiTro: 'tac_dong' }]));
        const anh = anhHuongKhiKhaiNiemYeuDi(state, 'kn.tay_ue', 0, TUNING);
        expect(anh).toHaveLength(1);
        expect(anh[0]?.hieuLucTruoc).toBeGreaterThan(0);
        expect(anh[0]?.hieuLucSau).toBe(0);
        // Luật vẫn còn trong sổ — không có gì bị xóa.
        expect(state.entities.has('luat.mau')).toBe(true);
    });
    it('[BB] hồi sinh được luật đã chết nếu khái niệm nền vẫn còn tồn tại', () => {
        const { state } = theGioi('hoisinh');
        state.entities.set('kn.tay_ue', khaiNiem('kn.tay_ue', 'Tẩy Uế', 0, 'hu_danh'));
        state.entities.set('luat.mau', luat('luat.mau', 'Máu không rửa được', [{ khaiNiemId: 'kn.tay_ue', vaiTro: 'tac_dong' }]));
        expect(coTheHoiSinh(state.entities.get('luat.mau'), state, TUNING)).toBe(true);
        // Khái niệm chết hẳn thì không hồi sinh được nữa.
        state.entities.set('kn.tay_ue', { ...state.entities.get('kn.tay_ue'), tickDiet: 5 });
        expect(coTheHoiSinh(state.entities.get('luat.mau'), state, TUNING)).toBe(false);
    });
    it('mạch truyện `phuc_hung` và `dat_ten` đã có trong registry VÀ có handler', () => {
        napDungSan();
        expect(R.storyKind.co('phuc_hung')).toBe(true);
        expect(R.storyKind.co('dat_ten')).toBe(true);
        expect(loaiMachThieuHandler(R.storyKind.danhSachId())).toEqual([]);
    });
});
// ═══════════════════════════════════════════ KHỐI L — LUẬT NỀN
describe('43 [BB] — bảy trục, vô danh và có tên', () => {
    it('nhánh mới có đủ bảy trục, tất cả VÔ DANH, và engine vẫn có tham số để chạy', () => {
        const ds = luatNenMacDinh('br_goc');
        expect(ds).toHaveLength(7);
        expect(ds.every((x) => x.trangThai === 'vo_danh')).toBe(true);
        for (const truc of TRUC_NEN) {
            expect(thamSoCua(ds, truc)).toEqual(THAM_SO_MAC_DINH[truc]);
        }
    });
    it('[BB] 43.3 — trục vô danh KHÔNG có kẽ hở nào', () => {
        const ds = luatNenMacDinh('br_goc');
        expect(ds.every((x) => x.keHo.length === 0)).toBe(true);
    });
    it('[BB] 43.5 — đặt tên sai thứ tự thì validator BẮT ĐƯỢC', () => {
        const { state } = theGioi('luatnen');
        state.entities.set('kn.tat_yeu', khaiNiem('kn.tat_yeu', 'Tất Yếu', 1200, 'ket_tinh', ['tat_yeu']));
        const ds = luatNenMacDinh('br_goc');
        // van_menh cần thoi_gian và nhan_qua đã có tên.
        const kq = datTenTruc({
            ds,
            truc: 'van_menh',
            khaiNiemNenId: 'kn.tat_yeu',
            nguoiDatTenId: null,
            tick: 10,
            state,
        });
        expect(kq.ok).toBe(false);
        if (kq.ok)
            return;
        expect(kq.loi.join(' ')).toContain('thoi_gian');
        expect(PHU_THUOC_TRUC.van_menh).toEqual(['thoi_gian', 'nhan_qua']);
    });
    it('[BB] 43.3 — khái niệm nền phải CÓ THẬT và ít nhất thành hình', () => {
        const { state } = theGioi('luatnen2');
        state.entities.set('kn.truoc_sau', khaiNiem('kn.truoc_sau', 'Trước Sau', 10, 'manh_nha', ['truoc_sau']));
        const ds = luatNenMacDinh('br_goc');
        const kq = datTenTruc({
            ds,
            truc: 'thoi_gian',
            khaiNiemNenId: 'kn.truoc_sau',
            nguoiDatTenId: null,
            tick: 10,
            state,
        });
        expect(kq.ok).toBe(false);
        if (!kq.ok)
            expect(kq.loi.join(' ')).toContain('manh_nha');
    });
    it('đặt tên thành công thì SINH KẼ HỞ và có dòng biên niên bằng giọng kể', () => {
        const { state } = theGioi('luatnen3');
        const nguoi = EntitySchema.parse({
            id: 'e.senmut',
            branchId: 'br_goc',
            kind: 'mortal',
            ten: 'Senmut',
            tickSinh: 0,
            aspects: {},
        });
        state.entities.set(nguoi.id, nguoi);
        state.entities.set('kn.truoc_sau', khaiNiem('kn.truoc_sau', 'Trước Sau', 1200, 'ket_tinh', ['truoc_sau']));
        let ds = luatNenMacDinh('br_goc');
        // Đổi tham số để trục có kẽ hở thật khi được đặt tên.
        ds = ds.map((x) => x.truc === 'thoi_gian'
            ? SubstrateLawSchema.parse({ ...x, thamSo: { ...x.thamSo, quaKhu: 'sua_duoc' } })
            : x);
        const kq = datTenTruc({
            ds,
            truc: 'thoi_gian',
            khaiNiemNenId: 'kn.truoc_sau',
            nguoiDatTenId: 'e.senmut',
            tick: 4410,
            state,
        });
        expect(kq.ok).toBe(true);
        if (!kq.ok)
            return;
        expect(kq.luatNen.trangThai).toBe('co_ten');
        expect(kq.luatNen.keHo.length).toBeGreaterThan(0);
        expect(kq.keHo.join(' ')).toContain('Sửa một việc đã xảy ra');
        expect(kq.dongBienNien).toContain('Senmut');
        expect(kq.dongBienNien).toContain('không biết mình vừa làm gì');
    });
    it('kẽ hở suy từ CHÍNH THAM SỐ, không phải từ tên trục', () => {
        expect(keHoCuaTruc('nhan_qua', { chamTruuTuong: true }).join(' ')).toContain('khái niệm');
        expect(keHoCuaTruc('nhan_qua', { chamTruuTuong: false })).toEqual([]);
        expect(keHoCuaTruc('nhan_thuc', { tenGoiCoQuyenNang: true }).join(' ')).toContain('tên thật');
    });
    it('[BB] 43.7 — khái niệm kết tinh khớp bảng thì trục TỰ đề cử chuyển sang có tên', () => {
        const { state } = theGioi('tuketinh');
        state.entities.set('kn.noi_chon', khaiNiem('kn.noi_chon', 'Nơi Chốn', 1500, 'ket_tinh', ['noi_chon']));
        const ung = quetTuKetTinh(state, luatNenMacDinh('br_goc'));
        expect(ung.some((u) => u.truc === 'khong_gian' && u.khaiNiemId === 'kn.noi_chon')).toBe(true);
        // van_menh không tự kết tinh được vì thoi_gian/nhan_qua còn vô danh.
        expect(ung.some((u) => u.truc === 'van_menh')).toBe(false);
    });
    it('[BB] 43.6 — sửa luật nền LUÔN bắt buộc phân nhánh, và bất khả nghịch thì từ chối', () => {
        const ds = luatNenMacDinh('br_goc');
        expect(ds.every((x) => x.khaNghich.batBuocPhanNhanh)).toBe(true);
        const tuChoi = suaLuatNen(ds, {
            truc: 'thoi_gian',
            thamSoMoi: { huong: 'vong_lap' },
            boiAi: 'sang_the_than',
        });
        expect(tuChoi.ok).toBe(false);
        const choPhep = ds.map((x) => x.truc === 'thoi_gian'
            ? SubstrateLawSchema.parse({
                ...x,
                khaNghich: { duocKhong: true, boiAi: 'sang_the_than', batBuocPhanNhanh: true },
            })
            : x);
        const kq = suaLuatNen(choPhep, {
            truc: 'thoi_gian',
            thamSoMoi: { huong: 'vong_lap' },
            boiAi: 'sang_the_than',
        });
        expect(kq.ok).toBe(true);
        if (kq.ok)
            expect(kq.batBuocPhanNhanh).toBe(true);
    });
    it('[BB] 43.4 — khoangCach = "y_nghia" làm hai đền cùng thần thành LIỀN KỀ', () => {
        const { state } = theGioi('ynghia');
        for (const id of ['den.a', 'den.b']) {
            state.entities.set(id, EntitySchema.parse({ id, branchId: 'br_goc', kind: 'place', ten: id, tickSinh: 0, aspects: {} }));
        }
        state.entities.set('than.x', EntitySchema.parse({
            id: 'than.x',
            branchId: 'br_goc',
            kind: 'deity',
            ten: 'Thần X',
            tickSinh: 0,
            aspects: {},
        }));
        for (const [i, tu] of ['den.a', 'den.b'].entries()) {
            state.links.set(`l${i}`, {
                id: `l${i}`,
                branchId: 'br_goc',
                tuId: tu,
                denId: 'than.x',
                quanHe: 'tho_phung',
                trongSo: 50,
                tickTao: 0,
                tickDut: null,
                nguon: 'engine',
            });
        }
        const doLuong = luatNenMacDinh('br_goc');
        expect(laKhoangCachYNghia(doLuong)).toBe(false);
        expect(canhLienKeYNghia(state, doLuong)).toEqual([]);
        const yNghia = doLuong.map((x) => x.truc === 'khong_gian'
            ? SubstrateLawSchema.parse({
                ...x,
                trangThai: 'co_ten',
                thamSo: { ...x.thamSo, khoangCach: 'y_nghia' },
            })
            : x);
        expect(laKhoangCachYNghia(yNghia)).toBe(true);
        expect(canhLienKeYNghia(state, yNghia)).toEqual([['den.a', 'den.b']]);
    });
    it('44.5 — panel hiện trục vô danh trong NGOẶC, trục có tên kèm người đặt', () => {
        const { state } = theGioi('panel');
        const bang = bangLuatNen(luatNenMacDinh('br_goc'), state);
        expect(bang).toContain('LUẬT NỀN');
        expect(bang).toContain('vô danh  (');
        expect(daCoTen(luatNenMacDinh('br_goc'), 'thoi_gian')).toBe(false);
    });
});
// ═══════════════════════════════════════════ KHỐI L — CƠ CHẾ
describe('44 [BB] — cơ chế phái sinh là HỆ QUẢ, không phải tính năng', () => {
    it('[BB] 44.2 — mọi cơ chế PHẢI có `moTaKhiKhong` khác rỗng', () => {
        for (const id of Object.keys(CO_CHE)) {
            expect(CO_CHE[id].moTaKhiKhong.trim().length).toBeGreaterThan(20);
            expect(CO_CHE[id].moTaKhiCo.trim().length).toBeGreaterThan(20);
        }
    });
    it('thế giới chưa đặt tên trục Nhận Thức thì Thần Bí KHÔNG có mặt trong vũ trụ này', () => {
        const { state } = theGioi('coche');
        const q = quetMotCoChe(CO_CHE.than_bi, state, luatNenMacDinh('br_goc'));
        expect(q.duDieuKien).toBe(false);
        expect(q.conThieu.join(' ')).toContain('nhan_thuc');
    });
    it('bật hieuBietLamSuyYeu thì Thần Bí TỰ xuất hiện kèm công bố giọng biên niên', () => {
        const { state } = theGioi('coche2');
        const ds = luatNenMacDinh('br_goc').map((x) => x.truc === 'nhan_thuc'
            ? SubstrateLawSchema.parse({
                ...x,
                trangThai: 'co_ten',
                khaiNiemNenId: 'kn.biet',
                thamSo: { ...x.thamSo, hieuBietLamSuyYeu: true },
            })
            : x);
        const kq = quetCoChe({ state, luatNen: ds, hienTai: [], branchId: 'br_goc', tick: 5980 });
        const tb = kq.find((k) => k.row.id === 'than_bi');
        expect(tb?.vuaBat).toBe(true);
        expect(tb?.row.bat).toBe(true);
        expect(tb?.congBo).toContain('5980');
        expect(tb?.sinhMachDatTen).toBe(true);
    });
    it('[BB] 44.4 — cơ chế tắt thì XỬ LÝ TỬ TẾ: link nguyên điểm được GIỮ, chỉ mất hệ số', () => {
        const { state } = theGioi('coche3');
        state.links.set('l.nd', {
            id: 'l.nd',
            branchId: 'br_goc',
            tuId: 'e.ai_do',
            denId: 'kn.gi_do',
            quanHe: 'nguyen_diem',
            trongSo: 90,
            tickTao: 0,
            tickDut: null,
            nguon: 'engine',
        });
        const hq = hauQuaKhiTat('nguyen_diem', state);
        expect(hq.matHeSoNguyenDiem).toEqual(['e.ai_do']);
        expect(hq.ghiChu).toContain('GIỮ');
        // Link vẫn còn nguyên trong state — hàm chỉ báo cáo, không xóa.
        expect(state.links.has('l.nd')).toBe(true);
    });
    it('Thần Bí: càng cổ càng mạnh, càng bị nghiên cứu càng yếu', () => {
        const cu = thanBi({ tuoi: 4000, triThucTrungBinhVung: 0, soLanBiNghienCuu: 0, tuning: TUNING });
        const moi = thanBi({ tuoi: 100, triThucTrungBinhVung: 0, soLanBiNghienCuu: 0, tuning: TUNING });
        expect(cu.goc).toBeGreaterThan(moi.goc);
        const biGiaiThich = thanBi({
            tuoi: 4000,
            triThucTrungBinhVung: 80,
            soLanBiNghienCuu: 30,
            tuning: TUNING,
        });
        expect(biGiaiThich.hien).toBeLessThan(cu.hien);
        expect(biGiaiThich.goc).toBe(cu.goc);
    });
    it('Nguyên Điểm kéo bản tính về một trục, và sụp hết thì đề xuất đổi kind', () => {
        let bt = { tan_bao: 20, khoan_dung: 60, cham_chi: 50 };
        let doi = false;
        for (let i = 0; i < 200 && !doi; i++) {
            const r = keoBanTinh(bt, 'tan_bao', TUNING);
            bt = r.banTinh;
            doi = r.nenDoiKind;
        }
        expect(doi).toBe(true);
        expect(bt['tan_bao']).toBeGreaterThan(bt['khoan_dung']);
    });
    it('[BB] Vũ Khí Khái Niệm CHỈ TÍNH hậu quả, không áp gì — và hậu quả rất nặng', () => {
        const { state } = theGioi('vkkn');
        state.entities.set('kn.rong', khaiNiem('kn.rong', 'Rồng', 3000, 'ket_tinh'));
        state.entities.set('luat.rong', luat('luat.rong', 'Luật về Rồng', [{ khaiNiemId: 'kn.rong', vaiTro: 'doi_tuong' }]));
        state.links.set('l.r', {
            id: 'l.r',
            branchId: 'br_goc',
            tuId: 'e.con_rong',
            denId: 'kn.rong',
            quanHe: 'hien_than_cua',
            trongSo: 90,
            tickTao: 0,
            tickDut: null,
            nguon: 'engine',
        });
        const truoc = hashState(state);
        const hq = hauQuaVuKhiKhaiNiem('kn.rong', state, TUNING);
        expect(hashState(state)).toBe(truoc); // KHÔNG áp gì
        expect(hq.vatMangIds).toEqual(['e.con_rong']);
        expect(hq.luatMatHieuLucIds).toEqual(['luat.rong']);
        expect(hq.phatThucTai).toBeGreaterThan(0);
        expect(hq.moTaSeo).toContain('Rồng');
    });
    it('44.5 — panel nói rõ CÒN THIẾU GÌ, vì đó là gợi ý chơi', () => {
        const { state } = theGioi('panel2');
        const kq = quetCoChe({
            state,
            luatNen: luatNenMacDinh('br_goc'),
            hienTai: [],
            branchId: 'br_goc',
            tick: 0,
        });
        const bang = bangCoChe(kq.map((k) => k.row));
        expect(bang).toContain('CƠ CHẾ ĐANG HOẠT ĐỘNG');
        expect(bang).toContain('vô danh');
    });
});
// ═══════════════════════════════════════════ KHỐI I + O — LOREBOOK
describe('35.3 — nhập lorebook ba định dạng, tự dò', () => {
    it('nhận SillyTavern V2 qua bản đồ khóa số', () => {
        expect(doDinhDangLore({ entries: { '0': {}, '1': {} } })).toBe('sillytavern_v2');
        expect(doDinhDangLore({ spec: 'lorebook_v3', entries: [] })).toBe('sillytavern_v3');
        expect(doDinhDangLore({ _format: 'thien_dien_lore' })).toBe('thien_dien_lore');
        expect(doDinhDangLore({ gi_do: 1 })).toBe('khong_ro');
    });
    it('map đúng key → keys, insertion_order → order, constant → lop "loi"', () => {
        const kq = nhapLorebook({
            goc: {
                entries: {
                    '0': {
                        uid: 'a',
                        comment: 'Ra',
                        key: ['Ra', 'mặt trời'],
                        content: 'Ra cai trị thần điện.',
                        constant: true,
                        insertion_order: 5,
                    },
                },
            },
            id: 'lb.aicap',
            ten: 'Ai Cập',
            nguon: 'nguoi_dung',
        });
        expect(kq.ok).toBe(true);
        const e = kq.lorebook?.entries[0];
        expect(e.keys).toEqual(['Ra', 'mặt trời']);
        expect(e.lop).toBe('loi');
        expect(e.uocLuongToken).toBeGreaterThan(0);
    });
    it('[BB] `<user>` là LỖI, kèm đề xuất sửa hàng loạt', () => {
        const kq = nhapLorebook({
            goc: { entries: [{ uid: 'x', content: 'Chào <user>, ngươi tới muộn.' }] },
            id: 'lb.x',
            ten: 'X',
            nguon: 'nguoi_dung',
        });
        expect(kq.ok).toBe(false);
        const l = kq.issues.find((i) => i.code === 'CU_PHAP_USER_SAI');
        expect(l?.severity).toBe('error');
        expect(String(l?.details['deXuat'])).toContain('{{user}}');
    });
    it('EJS hỏng thì chỉ rõ entry và DÒNG', () => {
        expect(kiemEjs('a\nb <% x')).toEqual({ dong: 2, thongDiep: 'thẻ EJS `<%` không có `%>` đóng' });
        expect(kiemEjs('ổn <% x %> rồi')).toBeNull();
    });
    it('[BB] 51.5 — order ngoài dải bị DỒN về dải của nguồn, giữ thứ tự tương đối', () => {
        const kq = nhapLorebook({
            goc: {
                entries: [
                    { uid: 'a', insertion_order: 55_555 },
                    { uid: 'b', insertion_order: 66_666 },
                ],
            },
            id: 'lb.y',
            ten: 'Y',
            nguon: 'nguoi_dung',
        });
        const ds = kq.lorebook?.entries ?? [];
        expect(ds[0]?.order).toBeGreaterThanOrEqual(DAI_ORDER.nguoi_dung.tu);
        expect(ds[1]?.order).toBeLessThanOrEqual(DAI_ORDER.nguoi_dung.den);
        expect(ds[0]?.order < ds[1]?.order).toBe(true);
        expect(kq.issues.some((i) => i.code === 'ORDER_NGOAI_DAI')).toBe(true);
    });
    it('lorebook tự sinh và di sản nằm ở DẢI KHÁC — không đụng số của người dùng', () => {
        const su = nhapLorebook({ goc: { entries: [{ uid: 'a' }] }, id: 'lb.su', ten: 'Sử', nguon: 'tu_sinh' });
        const ds = nhapLorebook({
            goc: { entries: [{ uid: 'a' }] },
            id: 'lb.ds',
            ten: 'Di sản',
            nguon: 'di_san',
        });
        expect(su.lorebook?.entries[0]?.order).toBeGreaterThanOrEqual(DAI_ORDER.tu_sinh.tu);
        expect(ds.lorebook?.entries[0]?.order).toBeGreaterThanOrEqual(DAI_ORDER.di_san.tu);
    });
    it('trùng chủ đề chỉ CẢNH BÁO, không chặn', () => {
        const kq = nhapLorebook({
            goc: {
                entries: [
                    { uid: 'a', key: ['Kemet', 'thần điện'] },
                    { uid: 'b', key: ['Kemet', 'thần điện'] },
                ],
            },
            id: 'lb.z',
            ten: 'Z',
            nguon: 'nguoi_dung',
        });
        expect(kq.ok).toBe(true);
        expect(kq.nghiTrungChuDe.length).toBe(1);
    });
});
describe('51 [BB] — Sử thắng Nguồn, và che KHÔNG phải xóa', () => {
    const cu = entry({
        id: 'lb.ai_cap_003',
        ten: 'Ra cai trị thần điện',
        order: 5,
        keys: ['Ra', 'thần điện'],
        noiDung: 'Ra cai trị thần điện Kemet từ buổi đầu.',
        chuDe: ['e.ra'],
    });
    const moi = entry({
        id: 'lb.k12',
        ten: 'Khonsu và ngôi đầu',
        order: 10_001,
        keys: ['Khonsu', 'thần điện'],
        noiDung: 'Khonsu cai trị thần điện sau khi Ra bị thu hồi.',
        chuDe: ['e.khonsu'],
        doTinCay: 80,
    });
    it('thứ tự ưu tiên: SỬ > DI SẢN > NGUỒN', () => {
        expect(UU_TIEN_NGUON.tu_sinh).toBeLessThan(UU_TIEN_NGUON.di_san);
        expect(UU_TIEN_NGUON.di_san).toBeLessThan(UU_TIEN_NGUON.nguoi_dung);
    });
    it('hai khẳng định độc quyền cho hai chủ thể khác nhau → MÂU THUẪN, và SỬ che NGUỒN', () => {
        expect(phanLoaiQuanHe(moi, cu).quanHe).toBe('mau_thuan');
        const ds = doiSoatEntry({ entry: moi, lorebookId: 'lb.su', nguon: 'tu_sinh' }, [
            { entry: cu, lorebookId: 'lb.aicap', nguon: 'nguoi_dung' },
        ]);
        expect(ds).toHaveLength(1);
        expect(ds[0]?.xuLy).toBe('che');
        expect(ds[0]?.cheId).toBe(cu.id);
        expect(ds[0]?.giuId).toBe(moi.id);
    });
    it('[BB] 51.4 — entry khóa canon KHÔNG BAO GIỜ bị che', () => {
        const khoa = { ...cu, khoaCanon: true };
        const ds = doiSoatEntry({ entry: moi, lorebookId: 'lb.su', nguon: 'tu_sinh' }, [
            { entry: khoa, lorebookId: 'lb.aicap', nguon: 'nguoi_dung' },
        ]);
        expect(ds[0]?.xuLy).toBe('che');
        expect(ds[0]?.cheId).toBe(''); // không che được
        const kq = che(khoa, moi.id, 'Ra bị thu hồi', 1180);
        expect(kq.entry.trangThai).toBe('hoat_dong');
        expect(kq.dongBienNien).toContain('khóa lại như một chân lý');
    });
    it('[BB] che giữ nguyên entry, có lý do, và bỏ che được bất cứ lúc nào', () => {
        const kq = che(cu, moi.id, 'Ra bị thu hồi năm 1180, chỗ trống 400 năm', 1180);
        expect(kq.entry.trangThai).toBe('bi_che');
        expect(kq.entry.noiDung).toBe(cu.noiDung); // KHÔNG mất nội dung
        expect(kq.entry.lyDoChe).toContain('1180');
        expect(kq.dongBienNien).toContain('người ta chỉ ngừng chép nó');
        const bo = boChe(kq.entry, 1200);
        expect(bo.trangThai).toBe('hoat_dong');
        expect(bo.lichSu.at(-1)?.op).toBe('bo_che');
    });
    it('trùng lặp thì GỘP; bổ sung thì giữ cả hai', () => {
        const a = entry({
            id: 'a',
            ten: 'A',
            order: 1,
            keys: ['x'],
            noiDung: 'Cùng một điều được nói ra ở đây.',
        });
        const b = entry({
            id: 'b',
            ten: 'B',
            order: 2,
            keys: ['x'],
            noiDung: 'Cùng một điều được nói ra ở đây.',
        });
        expect(phanLoaiQuanHe(a, b).quanHe).toBe('trung_lap');
        const c = entry({
            id: 'c',
            ten: 'C',
            order: 3,
            keys: ['x'],
            noiDung: 'Một mặt hoàn toàn khác của chuyện này, nói về cấp bậc.',
        });
        expect(phanLoaiQuanHe(a, c).quanHe).toBe('bo_sung');
    });
    it('[BB] 51.6 kiểu D — sử kỷ nguyên N KHÔNG được sinh từ sử kỷ nguyên trước', () => {
        const sach = kiemNguonSinhSu({ eventIds: ['ev.1', 'ev.2'], chronicleIds: ['c.1'], entryIds: [] });
        expect(sach).toEqual([]);
        const ban = kiemNguonSinhSu({ eventIds: ['ev.1'], chronicleIds: [], entryIds: ['lb.su_kn3'] });
        expect(ban.some((i) => i.code === 'O_NHIEM_NGUON_SU')).toBe(true);
        const rong = kiemNguonSinhSu({ eventIds: [], chronicleIds: [], entryIds: [] });
        expect(rong.some((i) => i.code === 'SU_KHONG_CO_NGUON')).toBe(true);
    });
    it('51.7 — bảng đối soát gom đủ bốn loại', () => {
        const b = bangDoiSoat(doiSoatEntry({ entry: moi, lorebookId: 'lb.su', nguon: 'tu_sinh' }, [
            { entry: cu, lorebookId: 'lb.a', nguon: 'nguoi_dung' },
        ]), 4, 31);
        expect(b.tomTat).toContain('kỷ nguyên 4');
        expect(b.tomTat).toContain('31 entry mới');
        expect(b.mauThuan.length).toBe(1);
    });
});
describe('52 [BB] — bảng quyền: AI không bao giờ sửa entry người dùng', () => {
    it('bảng quyền khớp đúng 52.2', () => {
        for (const op of ['sua', 'gop', 'tach', 'doi_key', 'xoa']) {
            expect(duocPhep(op, 'nguoi_dung')).toBe(false);
            expect(duocPhep(op, 'di_san')).toBe(false);
            expect(duocPhep(op, 'tu_sinh')).toBe(true);
        }
        // `che` là op DUY NHẤT chạm được cả ba nguồn.
        expect(QUYEN_OP.che).toEqual({ tu_sinh: true, nguoi_dung: true, di_san: true });
        expect(duocPhep('them', 'nguoi_dung')).toBe(false);
    });
    function ctx(entries, nguon) {
        return {
            entries: new Map(entries.map((e) => [e.id, e])),
            nguonCua: new Map(Object.entries(nguon)),
            nguonDich: 'tu_sinh',
            entityTonTai: new Set(['e.khonsu']),
            eventTonTai: new Set(['ev.1', 'ev.2']),
            tick: 100,
            boiAi: 'ai',
        };
    }
    it('op `sua` trên entry người dùng bị TỪ CHỐI với lý do cụ thể', () => {
        const e = entry({ id: 'u1', ten: 'Của người dùng', order: 1, noiDung: 'nguyên văn' });
        const kq = apMotOp({ op: 'sua', id: 'u1', truong: 'noiDung', noiDungMoi: 'bị sửa', lyDo: '' }, ctx([e], { u1: 'nguoi_dung' }));
        expect(kq.ok).toBe(false);
        expect(kq.loi[0]?.code).toBe('KHONG_DU_QUYEN');
        expect(kq.loi[0]?.message).toContain('chỉ có thể bị CHE');
    });
    it('op `che` trên entry người dùng ĐƯỢC PHÉP và giữ nguyên nội dung', () => {
        const u = entry({ id: 'u1', ten: 'Ra cai trị', order: 1, noiDung: 'nguyên văn' });
        const s = entry({ id: 's1', ten: 'Khonsu cai trị', order: 10_001, noiDung: 'sử' });
        const kq = apMotOp({ op: 'che', id: 'u1', boiId: 's1', lyDo: 'Ra bị thu hồi' }, ctx([u, s], { u1: 'nguoi_dung', s1: 'tu_sinh' }));
        expect(kq.ok).toBe(true);
        expect(kq.sua[0]?.trangThai).toBe('bi_che');
        expect(kq.sua[0]?.noiDung).toBe('nguyên văn');
    });
    it('op `them` bắt buộc có keys, chuDe có thật và sự kiện chống lưng', () => {
        const c = ctx([], {});
        const thieu = apMotOp({
            op: 'them',
            ten: 'X',
            keys: [],
            noiDung: 'x',
            lop: 'sau',
            chuDe: ['e.khong_co'],
            suKienChongLung: [],
        }, c);
        expect(thieu.ok).toBe(false);
        const ma = thieu.loi.map((l) => l.code);
        expect(ma).toContain('KEYS_RONG');
        expect(ma).toContain('CHU_DE_KHONG_CO_THAT');
        expect(ma).toContain('THIEU_SU_KIEN_CHONG_LUNG');
        const du = apMotOp({
            op: 'them',
            ten: 'Khonsu',
            keys: ['Khonsu'],
            noiDung: 'Khonsu lên ngôi.',
            lop: 'sau',
            chuDe: ['e.khonsu'],
            suKienChongLung: ['ev.1'],
        }, c);
        expect(du.ok).toBe(true);
        expect(du.them[0]?.keys).toEqual(['Khonsu']);
    });
    it('[BB] 52.4 — `tach` không được bịa thêm nội dung', () => {
        const e = entry({ id: 's1', ten: 'Dài', order: 10_001, noiDung: 'a'.repeat(300) });
        const c = ctx([e], { s1: 'tu_sinh' });
        const bia = apMotOp({
            op: 'tach',
            id: 's1',
            thanh: [
                { ten: 'A', keys: ['a'], noiDung: 'b'.repeat(300) },
                { ten: 'B', keys: ['b'], noiDung: 'c'.repeat(300) },
            ],
        }, c);
        expect(bia.ok).toBe(false);
        expect(bia.loi[0]?.code).toBe('TACH_BIA_THEM');
        const dung = apMotOp({
            op: 'tach',
            id: 's1',
            thanh: [
                { ten: 'A', keys: ['a'], noiDung: 'a'.repeat(150) },
                { ten: 'B', keys: ['b'], noiDung: 'a'.repeat(150) },
            ],
        }, c);
        expect(dung.ok).toBe(true);
        expect(dung.them).toHaveLength(2);
    });
    it('[BB] 52.3 — xóa là XÓA MỀM, và thùng rác giữ ba kỷ nguyên', () => {
        const e = entry({ id: 's1', ten: 'X', order: 10_001 });
        const kq = apMotOp({ op: 'xoa', id: 's1', lyDo: 'trùng hoàn toàn' }, ctx([e], { s1: 'tu_sinh' }));
        expect(kq.ok).toBe(true);
        expect(kq.sua[0]?.trangThai).toBe('da_xoa');
        expect(kq.sua[0]?.tickXoa).toBe(100);
        const daXoa = kq.sua[0];
        expect(conTrongThungRac(daXoa, 100 + 200 * 2, 200)).toBe(true);
        expect(conTrongThungRac(daXoa, 100 + 200 * 4, 200)).toBe(false);
    });
    it('[BB] 52.4 — op trượt thì BỎ op đó, giữ các op còn lại', () => {
        const u = entry({ id: 'u1', ten: 'người dùng', order: 1 });
        const s = entry({ id: 's1', ten: 'sử', order: 10_001 });
        const lo = apLoOp([
            { op: 'sua', id: 'u1', truong: 'noiDung', noiDungMoi: 'x', lyDo: '' }, // trượt
            { op: 'doi_key', id: 's1', keys: ['moi'] }, // qua
        ], ctx([u, s], { u1: 'nguoi_dung', s1: 'tu_sinh' }));
        expect(lo.boQua).toHaveLength(1);
        expect(lo.boQua[0]?.op).toBe('sua');
        expect(lo.sua.find((e) => e.id === 's1')?.keys).toEqual(['moi']);
    });
    it('52.5 — lịch sử phiên bản không vượt 20 mục', () => {
        let e = entry({ id: 's1', ten: 'X', order: 10_001 });
        const c = ctx([e], { s1: 'tu_sinh' });
        for (let i = 0; i < 30; i++) {
            const kq = apMotOp({ op: 'doi_key', id: 's1', keys: [`k${i}`] }, { ...c, entries: new Map([[e.id, e]]) });
            e = kq.sua[0];
        }
        expect(e.lichSu.length).toBeLessThanOrEqual(20);
    });
});
describe('51.6 + 53 [BB] — văn bản không bao giờ tự chứng minh được chính nó', () => {
    const ev = (id, actors, patches, vis = 'cong_khai', cause = []) => [
        id,
        {
            id,
            branchId: 'br_goc',
            tick: 10,
            loai: 'x',
            actorIds: actors,
            targetIds: [],
            causeEventIds: cause,
            locationId: null,
            patches: Array.from({ length: patches }, () => ({
                op: 'set',
                target: { table: 'entities', id: 'e', path: 'p' },
                sourceEventId: id,
            })),
            visibility: vis,
            source: 'engine',
            payload: {},
            hash: 'h',
        },
    ];
    it('không có sự kiện chống lưng thì doTinCay = 0 và KHÔNG được nạp', () => {
        const e = entry({ id: 'x', ten: 'X', order: 1, suKienChongLung: [] });
        expect(tinhDoTinCay(e, new Map())).toBe(0);
        expect(duocNap({ ...e, doTinCay: 0 })).toBe(false);
        expect(duocNap({ ...e, doTinCay: NGUONG_TIN_CAY_NAP })).toBe(true);
    });
    it('nhiều sự kiện ĐỘC LẬP cho tin cậy cao hơn cùng một chuỗi nhân quả', () => {
        const evs = new Map([
            ev('a', ['x', 'y'], 2),
            ev('b', ['z', 'w'], 2),
            ev('c', ['q', 'r'], 2, 'cong_khai', ['a']),
        ]);
        const docLap = entry({ id: 'e1', ten: 'A', order: 1, suKienChongLung: ['a', 'b'] });
        const cungChuoi = entry({ id: 'e2', ten: 'B', order: 2, suKienChongLung: ['a', 'c'] });
        expect(tinhDoTinCay(docLap, evs)).toBeGreaterThan(tinhDoTinCay(cungChuoi, evs));
    });
    it('[BB] doTinCay KHÔNG tăng do được nhắc lại — hàm không nhận văn bản', () => {
        const evs = new Map([ev('a', ['x'], 1)]);
        const e = entry({ id: 'e', ten: 'E', order: 1, suKienChongLung: ['a'], noiDung: 'lặp '.repeat(500) });
        const eNgan = { ...e, noiDung: 'ngắn' };
        expect(tinhDoTinCay(e, evs)).toBe(tinhDoTinCay(eNgan, evs));
    });
    it('[BB] 53.2 — keyword rút từ VĂN BẢN THẬT, loại từ quá chung và từ đã bị chiếm', () => {
        // Mười cảnh: Khonsu xuất hiện ở ba (30%, chưa "quá chung"); "người" ở khắp nơi.
        const canh = [
            'Khonsu bước vào Đại Điện, và người ở đó im lặng.',
            'Khonsu nhận ngôi đầu. Người ta gọi đó là đêm mặt trăng lên ngôi.',
            'Ở Đại Điện, người bàn về Khonsu suốt đêm.',
            'Người gánh nước qua cầu.',
            'Người bán cá về sớm.',
            'Người trong làng đóng cửa.',
            'Một người khóc bên sông.',
            'Người thợ rèn tắt lò.',
            'Người canh đêm ngủ gật.',
            'Người lạ đi qua, không ai hỏi.',
        ];
        const uv = thuHoachDanhTu({ canhDaKe: canh, cumUuTien: ['đại điện'], daBiChiem: new Set(['kemet']) });
        const dung = goiYKeys(uv);
        expect(dung.map((u) => u.tu)).toContain('khonsu');
        // "người" xuất hiện ở 100% số cảnh — quá chung, và nằm trong danh sách đen.
        expect(uv.find((u) => u.tu === 'người')?.lyDoLoai).toContain('danh sách đen');
        expect(dung.map((u) => u.tu)).not.toContain('người');
        // Từ đã bị entry khác chiếm cũng bị loại.
        const uv2 = thuHoachDanhTu({ canhDaKe: canh, daBiChiem: new Set(['khonsu']) });
        expect(goiYKeys(uv2).map((u) => u.tu)).not.toContain('khonsu');
    });
    it('[BB] 53.3 — vượt trần thì đòi TÁCH, không cắt cụt; quá 2 chủ đề thì trượt', () => {
        const dai = entry({ id: 'x', ten: 'X', order: 1, noiDung: 'a'.repeat(4000), keys: ['k'] });
        const l = kiemEntry(dai, { tyLeToken: 3.2 });
        expect(l.map((x) => x.ma)).toContain('VUOT_TRAN_TOKEN');
        expect(l[0]?.thongDiep).toContain('TÁCH');
        const nhieuChuDe = entry({ id: 'y', ten: 'Y', order: 1, keys: ['k'], chuDe: ['a', 'b', 'c'] });
        expect(kiemEntry(nhieuChuDe).map((x) => x.ma)).toContain('QUA_NHIEU_CHU_DE');
    });
    it('53.5 — brief sinh entry KHÔNG có câu hỏi mở nào', () => {
        const b = briefSinhEntry({
            chuDe: ['e.khonsu'],
            daCo: [{ id: 'lb.k03', ten: 'Thần điện Kemet', ghiChu: 'nói về cấp bậc, KHÔNG nói về ngôi đầu' }],
            ungVien: thuHoachDanhTu({ canhDaKe: ['Khonsu lên ngôi đầu ở Đại Điện.'] }),
            suKien: [{ id: 'ev.44812', moTa: 'năm 1180 · Ra bị thu hồi' }],
            lop: 'loi',
        });
        expect(b).toContain('NHIỆM VỤ');
        expect(b).toContain('SỰ KIỆN CHỐNG LƯNG (bắt buộc trích dẫn ít nhất 2)');
        expect(b).toContain('TRẢ VỀ: đúng schema LorebookEntry');
        expect(b).not.toMatch(/\?\s*$/m);
    });
});
describe('35.4, 35.5 [BB] — lorebook là lực hấp dẫn, và Dị Bản khi thế giới đi lối khác', () => {
    function lorebookAiCap(lucHapDan = 100) {
        const kq = nhapLorebook({
            goc: {
                entries: [
                    { uid: 'e1', comment: 'Ra', key: ['Ra'], content: 'Có một vị thần mặt trời cai trị thần điện.' },
                    {
                        uid: 'e2',
                        comment: 'Apep',
                        key: ['Apep'],
                        content: 'Thần mặt trời có một kẻ thù vĩnh cửu hình rắn.',
                    },
                ],
            },
            id: 'lb.aicap',
            ten: 'Ai Cập',
            nguon: 'nguoi_dung',
        });
        const lb = { ...kq.lorebook, lucHapDan, bat: true };
        return lb;
    }
    it('trích được kỳ vọng có điều kiện KHAI BÁO, không phải chuỗi eval', () => {
        const kv = trichKyVong(lorebookAiCap(), 'br_goc');
        expect(kv.length).toBeGreaterThanOrEqual(2);
        expect(kv[0]?.dieuKien.kieu).toBe('ton_tai_kind');
        expect(typeof kv[0]?.dieuKien).toBe('object');
    });
    it('[BB] 35.4 — lucHapDan = 0 thì kỳ vọng vẫn hiện nhưng KHÔNG kéo thế giới', () => {
        const kv0 = trichKyVong(lorebookAiCap(0), 'br_goc');
        expect(kv0.length).toBeGreaterThan(0);
        expect(kv0[0]?.doUuTien).toBe(0);
        expect(trichKyVong(lorebookAiCap(100), 'br_goc')[0]?.doUuTien).toBe(100);
    });
    it('[BB] 35.5 — thu hồi thần mặt trời sinh Dị Bản đủ bốn thứ bắt buộc + một gap', () => {
        const { state } = theGioi('diban');
        const ra = EntitySchema.parse({
            id: 'e.ra',
            branchId: 'br_goc',
            kind: 'deity',
            ten: 'Ra',
            tickSinh: 0,
            tags: ['mat_troi'],
            aspects: { than_vi: { domainStrength: 90 } },
        });
        state.entities.set(ra.id, ra);
        const kv = trichKyVong(lorebookAiCap(), 'br_goc');
        const b1 = capNhatKyVong({
            kyVong: kv,
            state,
            theoDoi: { thoaBoi: new Map() },
            tick: 100,
            lucHapDan: 100,
        });
        expect(b1.kyVong[0]?.trangThai).toBe('da_thoa');
        expect(aiThoa(kv[0]?.dieuKien, state)).toBe('e.ra');
        // Người chơi THU Ra.
        state.entities.set('e.ra', { ...ra, tickDiet: 1180 });
        const b2 = capNhatKyVong({
            kyVong: b1.kyVong,
            state,
            theoDoi: { thoaBoi: b1.thoaBoi },
            tick: 1180,
            lucHapDan: 100,
            nguyenNhan: { chuTheId: 'e.nguoi_choi', eventIds: ['ev.thu'], moTa: 'Sáng Thế Thần thu hồi Ra' },
        });
        expect(b2.kyVong[0]?.trangThai).toBe('bat_kha');
        expect(b2.diBanMoi).toHaveLength(1);
        const db = b2.diBanMoi[0];
        expect(db.kyVongGoc).toContain('thần');
        expect(db.thucTe).toContain('1180');
        expect(db.nguyenNhan.eventIds).toEqual(['ev.thu']);
        expect(db.dongBienNien).toContain('Ra');
        expect(b2.gapMoi).toHaveLength(1);
        expect(b2.gapMoi[0]?.uuTien).toBeGreaterThan(0);
    });
    it('lucHapDan thấp thì gap sinh ra cũng ưu tiên thấp — điểm hút yếu', () => {
        const { state } = theGioi('hapdan');
        const ra = EntitySchema.parse({
            id: 'e.ra',
            branchId: 'br_goc',
            kind: 'deity',
            ten: 'Ra',
            tickSinh: 0,
            tags: ['mat_troi'],
            aspects: { than_vi: { domainStrength: 90 } },
        });
        state.entities.set(ra.id, ra);
        const kv = trichKyVong(lorebookAiCap(20), 'br_goc');
        const b1 = capNhatKyVong({ kyVong: kv, state, theoDoi: { thoaBoi: new Map() }, tick: 1, lucHapDan: 20 });
        state.entities.set('e.ra', { ...ra, tickDiet: 2 });
        const b2 = capNhatKyVong({
            kyVong: b1.kyVong,
            state,
            theoDoi: { thoaBoi: b1.thoaBoi },
            tick: 2,
            lucHapDan: 20,
        });
        expect(b2.gapMoi[0]?.uuTien).toBeLessThan(20);
    });
    it('[BB] 51.1 kiểu F — kỳ vọng thành bất khả thì entry gốc PHẢI bị che cùng lúc', () => {
        const lb = lorebookAiCap();
        const kv = trichKyVong(lb, 'br_goc').map((k) => ({
            ...k,
            trangThai: 'bat_kha',
            lyDoLech: 'Ra bị thu hồi',
        }));
        const can = entryCanChe(kv, lb.entries);
        expect(can.length).toBeGreaterThan(0);
        expect(can[0]?.lyDo).toContain('Ra');
    });
    it('35.6 — Bản Đồ Dị Biệt là hồ sơ, không phải bảng lỗi', () => {
        const { state } = theGioi('bando');
        const kv = trichKyVong(lorebookAiCap(), 'br_goc');
        const bd = banDoDiBiet(kv, [], state);
        expect(bd.dong.length).toBe(kv.length);
        expect(bd.daThoa + bd.dangCho + bd.daLech + bd.batKha).toBe(kv.length);
        expect(JSON.stringify(bd)).not.toContain('lỗi');
    });
});
// ═══════════════════════════════════════════ KHỐI N — WORKFLOW
describe('50.4 [BB] — lịch thời gian truyện là chế độ quan trọng nhất', () => {
    const tacVuTuan = WorkflowTaskSchema.parse({
        id: 'thoi_cuc',
        ten: 'Thời cục',
        lich: { cheDo: 'theo_thoi_gian_truyen', thoiGianTruyen: { giaTri: 1, donVi: 'nam' } },
    });
    it('hai mươi lượt kể một buổi tối → kinh tế KHÔNG nhúc nhích', () => {
        let tt = trangThaiLichMoi();
        let soLanChay = 0;
        for (let luot = 0; luot < 20; luot++) {
            const qd = quyetDinhChay(tacVuTuan, tt, { luot, tick: 0, suKien: [] }, 5);
            if (qd.chay)
                soLanChay += qd.soLan;
            tt = qd.trangThaiSau;
        }
        // Chạy đúng MỘT lần (lần đầu), rồi đứng yên vì thời gian truyện không trôi.
        expect(soLanChay).toBe(1);
    });
    it('tua một thế kỷ trong MỘT lượt → chạy rất nhiều lần', () => {
        let tt = trangThaiLichMoi();
        const dau = quyetDinhChay(tacVuTuan, tt, { luot: 0, tick: 0, suKien: [] }, 5);
        tt = dau.trangThaiSau;
        const qd = quyetDinhChay(tacVuTuan, tt, { luot: 1, tick: 400, suKien: [] }, 5);
        expect(qd.chay).toBe(true);
        expect(qd.soLan).toBe(100); // 400 tick / 4 tick mỗi năm
        expect(TICK_MOI_DON_VI.nam).toBe(4);
    });
    it('[BB] không đọc được thời gian thì BỎ LƯỢT, không chạy bừa', () => {
        const tv = WorkflowTaskSchema.parse({
            id: 't',
            ten: 'T',
            lich: {
                cheDo: 'theo_thoi_gian_truyen',
                thoiGianTruyen: {
                    giaTri: 1,
                    donVi: 'tuan',
                    nguonThoiGian: { loai: 'the_trong_van_ban', tenThe: ['tp'] },
                },
            },
        });
        const qd = quyetDinhChay(tv, trangThaiLichMoi(), { luot: 0, tick: 10, suKien: [], vanBan: 'không có thẻ nào' }, 5);
        expect(qd.chay).toBe(false);
        expect(qd.trangThaiSau.soLanParseLoiLienTiep).toBe(1);
    });
    it('parse lỗi liên tiếp quá ngưỡng thì báo đúng chẩn đoán 33', () => {
        const tv = WorkflowTaskSchema.parse({
            id: 't',
            ten: 'T',
            lich: {
                cheDo: 'theo_thoi_gian_truyen',
                thoiGianTruyen: { nguonThoiGian: { loai: 'the_trong_van_ban', tenThe: ['tp'] } },
            },
        });
        let tt = trangThaiLichMoi();
        let cuoi = quyetDinhChay(tv, tt, { luot: 0, tick: 0, suKien: [], vanBan: '' }, 3);
        for (let i = 1; i < 5; i++) {
            tt = cuoi.trangThaiSau;
            cuoi = quyetDinhChay(tv, tt, { luot: i, tick: 0, suKien: [], vanBan: '' }, 3);
        }
        expect(cuoi.lyDo).toContain('chẩn đoán 33');
    });
    it('đọc được thẻ thời gian trong văn bản khi nhập workflow từ hệ khác', () => {
        expect(docTickTuVanBan('<tp>42</tp>', ['tp'])).toBe(42);
        expect(docTickTuVanBan('<time>7</time>', [])).toBe(7);
        expect(docTickTuVanBan('chả có gì', ['tp'])).toBeNull();
    });
    it('bốn chế độ lịch đều chạy đúng', () => {
        const moiLuot = WorkflowTaskSchema.parse({ id: 'a', ten: 'A', lich: { cheDo: 'moi_luot' } });
        expect(quyetDinhChay(moiLuot, trangThaiLichMoi(), { luot: 5, tick: 5, suKien: [] }, 5).chay).toBe(true);
        const theoLuot = WorkflowTaskSchema.parse({ id: 'b', ten: 'B', lich: { cheDo: 'theo_luot', soLuot: 3 } });
        const tt = { luotChayCuoi: 4, tickChayCuoi: 4, soLanParseLoiLienTiep: 0 };
        expect(quyetDinhChay(theoLuot, tt, { luot: 5, tick: 5, suKien: [] }, 5).chay).toBe(false);
        expect(quyetDinhChay(theoLuot, tt, { luot: 7, tick: 7, suKien: [] }, 5).chay).toBe(true);
        const theoSk = WorkflowTaskSchema.parse({
            id: 'c',
            ten: 'C',
            lich: { cheDo: 'theo_su_kien', suKien: ['het_ky_nguyen'] },
        });
        expect(quyetDinhChay(theoSk, trangThaiLichMoi(), { luot: 1, tick: 1, suKien: [] }, 5).chay).toBe(false);
        expect(quyetDinhChay(theoSk, trangThaiLichMoi(), { luot: 1, tick: 1, suKien: ['het_ky_nguyen'] }, 5).chay).toBe(true);
    });
});
describe('50.3 [BB] — ba mươi nhân vật thì ba mươi call', () => {
    const goiThanh = (log) => async (yc) => {
        log.push(yc);
        return { ok: true, text: `xong ${yc.mucId ?? 'chung'}` };
    };
    it('30 mục → 30 call, chạy theo lô 5, và một cái hỏng không kéo sập 29 cái kia', async () => {
        const goiLog = [];
        const preset = WorkflowPresetSchema.parse({
            ten: 'thử',
            tasks: [
                WorkflowTaskSchema.parse({
                    id: 'npc',
                    ten: 'NPC',
                    soLuongSongSong: 5,
                    soLanThuLai: 0,
                    hoBanSao: { bat: true, nguonLietKe: 'npc_t2', bienThayThe: 'MUC', gioiHan: 30 },
                }),
            ],
        });
        const ds = Array.from({ length: 30 }, (_, i) => `e.npc${i}`);
        const kq = await chayDuongOng({
            preset,
            goi: async (yc) => {
                goiLog.push(yc);
                // Một mục hỏng.
                if (yc.mucId === 'e.npc7')
                    return { ok: false, maLoi: 'HTTP_500', thongDiep: 'proxy lỗi' };
                return { ok: true, text: `hành động của ${yc.mucId}` };
            },
            lietKe: () => ds,
            lich: { luot: 0, tick: 0, suKien: [] },
            trangThaiLich: new Map(),
            tuning: TUNING,
            dungPrompt: (t, mucId) => [{ role: 'system', content: `${t.id}:${mucId ?? ''}` }],
        });
        const r = kq[0]?.ketQua[0];
        expect(goiLog).toHaveLength(30);
        expect(r?.soCall).toBe(30);
        expect(r?.thatBai).toHaveLength(1);
        expect(r?.thatBai[0]?.mucId).toBe('e.npc7');
        // 29 cái kia vẫn có kết quả.
        expect((r?.output ?? '').split('\n\n')).toHaveLength(29);
    });
    it('chuỗi dự phòng chạy khi preset chính lỗi — không mất lượt', async () => {
        const preset = WorkflowPresetSchema.parse({
            ten: 'thử',
            tasks: [
                WorkflowTaskSchema.parse({
                    id: 'x',
                    ten: 'X',
                    apiPresetName: 'chinh',
                    apiPresetDuPhong: ['du_phong'],
                    soLanThuLai: 0,
                }),
            ],
        });
        const kq = await chayDuongOng({
            preset,
            goi: async (yc) => yc.apiPreset === 'chinh'
                ? { ok: false, maLoi: 'QUA_TAI', thongDiep: '429' }
                : { ok: true, text: 'dự phòng trả lời' },
            lietKe: () => [],
            lich: { luot: 0, tick: 0, suKien: [] },
            trangThaiLich: new Map(),
            tuning: TUNING,
            dungPrompt: () => [{ role: 'system', content: 'x' }],
        });
        const r = kq[0]?.ketQua[0];
        expect(r?.output).toBe('dự phòng trả lời');
        expect(r?.bacDuPhong).toBe(1);
        expect(r?.thatBai).toHaveLength(0);
    });
    it('giai đoạn sau CHỜ giai đoạn trước và thấy output của nó', async () => {
        const thay = [];
        const preset = WorkflowPresetSchema.parse({
            ten: 'thử',
            tasks: [
                WorkflowTaskSchema.parse({ id: 'a', ten: 'A', giaiDoan: 1 }),
                WorkflowTaskSchema.parse({ id: 'b', ten: 'B', giaiDoan: 1 }),
                WorkflowTaskSchema.parse({ id: 'c', ten: 'C', giaiDoan: 2 }),
            ],
        });
        const kq = await chayDuongOng({
            preset,
            goi: goiThanh([]),
            lietKe: () => [],
            lich: { luot: 0, tick: 0, suKien: [] },
            trangThaiLich: new Map(),
            tuning: TUNING,
            dungPrompt: (t, _m, nguCanhTruoc) => {
                if (t.id === 'c')
                    thay.push(nguCanhTruoc);
                return [{ role: 'system', content: t.id }];
            },
        });
        expect(kq.map((g) => g.giaiDoan)).toEqual([1, 2]);
        expect(kq[0]?.ketQua).toHaveLength(2);
        expect(thay[0]).toContain('[a]');
        expect(thay[0]).toContain('[b]');
    });
    it('output ngắn hơn doDaiToiThieu coi là TRƯỢT và thử lại', async () => {
        let lan = 0;
        const preset = WorkflowPresetSchema.parse({
            ten: 'thử',
            tasks: [WorkflowTaskSchema.parse({ id: 'x', ten: 'X', doDaiToiThieu: 10, soLanThuLai: 2 })],
        });
        const kq = await chayDuongOng({
            preset,
            goi: async () => ({ ok: true, text: lan++ === 0 ? 'ngắn' : 'đủ dài để được nhận' }),
            lietKe: () => [],
            lich: { luot: 0, tick: 0, suKien: [] },
            trangThaiLich: new Map(),
            tuning: TUNING,
            dungPrompt: () => [{ role: 'system', content: 'x' }],
        });
        expect(kq[0]?.ketQua[0]?.soThuLai).toBe(1);
        expect(kq[0]?.ketQua[0]?.output).toBe('đủ dài để được nhận');
    });
    it('50.11 — "Chạy thử tác vụ này" hiện prompt cuối mà KHÔNG gọi model', async () => {
        let daGoi = false;
        const preset = WorkflowPresetSchema.parse({
            ten: 'thử',
            tasks: [WorkflowTaskSchema.parse({ id: 'x', ten: 'X' })],
        });
        const kq = await chayDuongOng({
            preset,
            goi: async () => {
                daGoi = true;
                return { ok: true, text: '' };
            },
            lietKe: () => [],
            lich: { luot: 0, tick: 0, suKien: [] },
            trangThaiLich: new Map(),
            tuning: TUNING,
            dungPrompt: () => [{ role: 'system', content: 'prompt cuối cùng' }],
            chayThu: true,
        });
        expect(daGoi).toBe(false);
        expect(kq[0]?.ketQua[0]?.output).toContain('prompt cuối cùng');
    });
    it('ba cách gộp cho ba kết quả khác nhau', () => {
        expect(gop(['a', 'b'], 'noi')).toBe('a\n\nb');
        expect(gop(['a', 'b'], 'ghi_de')).toBe('b');
        expect(gop(['{"x":[1]}', '{"x":[2],"y":3}'], 'gop_json')).toBe('{"x":[1,2],"y":3}');
    });
});
describe('50.6, 50.7, 50.10 [BB] — đích ghi và lằn ranh lorebook người dùng', () => {
    it('[BB] workflow KHÔNG BAO GIỜ ghi vào lorebook người dùng — và đó là lỗi FATAL', () => {
        const kq = ghiLorebook({
            target: {
                loai: 'ghi_lorebook',
                mauChen: '',
                lorebookNguon: 'the_gioi',
                lorebookId: 'lb.user',
                tenEntry: 'X',
                loaiEntry: 'constant',
                keys: '',
                viTri: { position: 'x', depth: 1, order: 1 },
                chongDeQuy: true,
                tachTheoThuocTinh: false,
            },
            noiDung: 'bản tin',
            tick: 10,
            nguonDich: 'nguoi_dung',
            lorebookId: 'lb.user',
            taskId: 'thoi_cuc',
        });
        expect(kq.ok).toBe(false);
        if (kq.ok)
            return;
        expect(kq.loi[0]?.code).toBe('WORKFLOW_GHI_LOREBOOK_NGUOI_DUNG');
        expect(kq.loi[0]?.severity).toBe('fatal');
    });
    it('[BB] 50.7 — thiếu chống đệ quy thì TỪ CHỐI ghi', () => {
        const t = {
            loai: 'ghi_lorebook',
            mauChen: '',
            lorebookNguon: 'the_gioi',
            lorebookId: 'lb.su',
            tenEntry: 'X',
            loaiEntry: 'constant',
            keys: '',
            viTri: { position: 'x', depth: 1, order: 1 },
            chongDeQuy: false,
            tachTheoThuocTinh: false,
        };
        const kq = ghiLorebook({
            target: t,
            noiDung: 'x',
            tick: 1,
            nguonDich: 'tu_sinh',
            lorebookId: 'lb.su',
            taskId: 't',
        });
        expect(kq.ok).toBe(false);
        if (!kq.ok)
            expect(kq.loi[0]?.code).toBe('THIEU_CHONG_DE_QUY');
    });
    it('entry workflow ghi vào DẢI RIÊNG và có deQuy = false', () => {
        const kq = ghiLorebook({
            target: {
                loai: 'ghi_lorebook',
                mauChen: '',
                lorebookNguon: 'the_gioi',
                lorebookId: 'lb.su',
                tenEntry: 'Thời cục',
                loaiEntry: 'constant',
                keys: '',
                viTri: { position: 'x', depth: 1, order: 5 },
                chongDeQuy: true,
                tachTheoThuocTinh: false,
            },
            noiDung: 'Mùa này ba lưu vực mất mùa.',
            tick: 40,
            nguonDich: 'tu_sinh',
            lorebookId: 'lb.su',
            taskId: 'thoi_cuc',
        });
        expect(kq.ok).toBe(true);
        if (!kq.ok)
            return;
        expect(kq.entry.order).toBeGreaterThanOrEqual(DAI_ORDER.workflow.tu);
        expect(kq.entry.order).toBeLessThanOrEqual(DAI_ORDER.workflow.den);
        expect(kq.entry.deQuy).toBe(false);
        expect(kq.entry.lichSu[0]?.boiAi).toBe('workflow');
    });
    it('chẩn đoán 35 — bắt được entry tự kích hoạt chính nó', () => {
        const tu = entry({
            id: 'x',
            ten: 'X',
            order: 30_000,
            lop: 'sau',
            keys: ['Kemet'],
            noiDung: 'Ở Kemet mùa này mất mùa.',
        });
        expect(tuKichHoatChinhNo(tu)).toBe(true);
        expect(tuKichHoatChinhNo({ ...tu, lop: 'loi' })).toBe(false);
        expect(tuKichHoatChinhNo({ ...tu, keys: ['Thebes'] })).toBe(false);
    });
    it('[BB] 50.6 — op `delta` ánh xạ sang `add` và cộng dồn qua nhiều tác vụ', () => {
        expect(opEngineCua('delta')).toBe('add');
        expect(opEngineCua('replace')).toBe('set');
        const kq = docJsonPatch('```json\n[{"op":"delta","path":"a.b","value":3},{"op":"delta","path":"a.b","value":4}]\n```');
        expect(kq.muc).toHaveLength(2);
        expect(gopDelta(kq.muc).get('a.b')).toBe(7);
    });
    it('JSON hỏng thì bỏ cả khối; mục sai thì chỉ bỏ mục đó', () => {
        expect(docJsonPatch('không phải json').muc).toEqual([]);
        const r = docJsonPatch('[{"op":"delta","path":"a","value":1},{"op":"khong_co","path":"b"}]');
        expect(r.muc).toHaveLength(1);
        expect(r.boQua).toHaveLength(1);
    });
});
describe('50.8, 50.9, 50.12 — bảy tác vụ dựng sẵn, năm preset, sáu chẩn đoán', () => {
    it('bảy tác vụ dựng sẵn, đủ bảy giai đoạn', () => {
        expect(TAC_VU_DUNG_SAN).toHaveLength(7);
        expect(TAC_VU_DUNG_SAN.map((t) => t.giaiDoan)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
    it('[BB] stage 2 bật họ bản sao, stage 4 dùng lịch thời gian truyện, stage 7 chạy hiếm nhất', () => {
        const npc = TAC_VU_DUNG_SAN.find((t) => t.id === 'hanh_dong_npc');
        expect(npc?.hoBanSao.bat).toBe(true);
        const thoiCuc = TAC_VU_DUNG_SAN.find((t) => t.id === 'thoi_cuc_the_gioi');
        expect(thoiCuc?.lich?.cheDo).toBe('theo_thoi_gian_truyen');
        const ketTinh = TAC_VU_DUNG_SAN.find((t) => t.id === 'ket_tinh_thanh_tra');
        expect(ketTinh?.lich?.cheDo).toBe('theo_su_kien');
        expect(ketTinh?.modelDeXuat).toBe('tốt nhất');
    });
    it('[BB] 50.2 — nhomPrompt là MẢNG có tên và vai trò, không phải một chuỗi lớn', () => {
        for (const t of TAC_VU_DUNG_SAN) {
            expect(Array.isArray(t.nhomPrompt)).toBe(true);
            expect(t.nhomPrompt.length).toBeGreaterThan(0);
            for (const n of t.nhomPrompt)
                expect(n.ten.trim()).not.toBe('');
        }
    });
    it('năm preset dựng sẵn, và preset chuẩn qua được kiểm lằn ranh', () => {
        expect(Object.keys(PRESET_WORKFLOW).sort()).toEqual([
            'chi_npc',
            'chi_the_gioi',
            'engine_hau_truong',
            'nen_ky_nguyen',
            'trong',
        ]);
        expect(kiemLanRanh(PRESET_WORKFLOW.engine_hau_truong).dat).toBe(true);
    });
    it('preset vi phạm lằn ranh bị CHẶN khi nạp, không đợi tới lúc chạy', () => {
        const xau = WorkflowPresetSchema.parse({
            ten: 'xấu',
            tasks: [
                WorkflowTaskSchema.parse({
                    id: 'x',
                    ten: 'X',
                    dichGhi: [{ loai: 'patch_world', mauChen: 'substrateLaws.thoi_gian' }],
                }),
            ],
        });
        const kq = kiemLanRanh(xau);
        expect(kq.dat).toBe(false);
        expect(kq.loi.some((l) => l.code === 'CHAM_DUONG_DAN_CAM')).toBe(true);
    });
    it('sáu chẩn đoán 31–36; mục 36 là HỎNG NẶNG', () => {
        const ds = chanDoanWorkflow({
            taskId: 't',
            soLuotTruotLienTiep: 3,
            tyLeLoiPresetChinh: 0.5,
            soLanParseLoiLienTiep: 6,
            tyLeLechHoBanSao: 0.5,
            coEntryTuKichHoat: true,
            daGhiLorebookNguoiDung: true,
        }, { loiPresetChinh: 0.3, parseLoiLienTiep: 5, lechHoBanSao: 0.2 });
        expect(ds.map((d) => d.so)).toEqual([31, 32, 33, 34, 35, 36]);
        expect(ds.find((d) => d.so === 36)?.muc).toBe('hong_nang');
    });
    it('[BB] 50.8 — xuất một file JSON, nhập lại ở save khác, chạy y hệt', () => {
        const goc = PRESET_WORKFLOW.chi_npc;
        const kq = nhapPresetWorkflow(xuatPreset(goc));
        expect(kq.ok).toBe(true);
        if (!kq.ok)
            return;
        expect(kq.preset).toEqual(goc);
        expect(nhapPresetWorkflow('{"khong":"phai"}').ok).toBe(false);
    });
});
// ═══════════════════════════════════════════ HỢP NHÁNH
describe('26.3 — merge CÓ conflict report', () => {
    function haiNhanh() {
        const a = theGioi('nhanhA').state;
        const b = theGioi('nhanhA').state;
        b.world = { ...b.world, branchId: 'br_b' };
        const chung = EntitySchema.parse({
            id: 'e.chung',
            branchId: 'br_goc',
            kind: 'mortal',
            ten: 'Người Chung',
            tickSinh: 0,
            aspects: {},
        });
        a.entities.set('e.chung', chung);
        b.entities.set('e.chung', { ...chung, tickDiet: 40, ten: 'Người Chung' });
        a.entities.set('e.chi_a', EntitySchema.parse({
            id: 'e.chi_a',
            branchId: 'br_goc',
            kind: 'mortal',
            ten: 'Chỉ ở A',
            tickSinh: 0,
            aspects: {},
        }));
        b.entities.set('e.chi_b', EntitySchema.parse({
            id: 'e.chi_b',
            branchId: 'br_b',
            kind: 'mortal',
            ten: 'Chỉ ở B',
            tickSinh: 0,
            aspects: {},
        }));
        return { a, b };
    }
    it('báo cáo liệt kê tranh chấp, chỉ-có-A, chỉ-có-B và cái giá thực tại', () => {
        const { a, b } = haiNhanh();
        const bc = soSanhNhanh(a, b, TUNING);
        expect(bc.chiCoA).toContain('e.chi_a');
        expect(bc.chiCoB).toContain('e.chi_b');
        const tc = bc.tranhChap.find((t) => t.id === 'e.chung');
        expect(tc?.truongKhac).toContain('tickDiet');
        expect(tc?.lyDo).toContain('Chọn một');
        expect(bc.giaThucTai).toBe(TUNING.thucTai.hopNhanh);
        expect(bc.tomTat).toContain('realityIntegrity');
    });
    it('[BB] thiếu một quyết định thì KHÔNG hợp — không dùng đề xuất thay người chơi', () => {
        const { a, b } = haiNhanh();
        const bc = soSanhNhanh(a, b, TUNING);
        const kq = gopNhanh({
            a,
            b,
            baoCao: bc,
            quyetDinh: {},
            nhanhDich: 'br_hop',
            eventId: 'ev.hop',
            tuning: TUNING,
        });
        expect(kq.ok).toBe(false);
        if (!kq.ok)
            expect(kq.chuaQuyetDinh).toContain('e.chung');
    });
    it('hợp xong thì realityIntegrity tụt đúng −35 và NPC nhớ HAI phiên bản quá khứ', () => {
        const { a, b } = haiNhanh();
        const bc = soSanhNhanh(a, b, TUNING);
        const kq = gopNhanh({
            a,
            b,
            baoCao: bc,
            quyetDinh: { 'e.chung': 'ca_hai' },
            nhanhDich: 'br_hop',
            eventId: 'ev.hop',
            tuning: TUNING,
        });
        expect(kq.ok).toBe(true);
        if (!kq.ok)
            return;
        expect(kq.kyUcHaiBan).toHaveLength(1);
        expect(kq.kyUcHaiBan[0]?.banA).not.toBe(kq.kyUcHaiBan[0]?.banB);
        const metric = kq.patches.find((p) => p.target.table === 'metrics');
        expect(metric?.op).toBe('add');
        expect(metric?.value).toBe(-35);
    });
    it('patch hợp nhánh áp được thật vào một state đích', () => {
        const { a, b } = haiNhanh();
        const bc = soSanhNhanh(a, b, TUNING);
        const kq = gopNhanh({
            a,
            b,
            baoCao: bc,
            quyetDinh: { 'e.chung': 'a' },
            nhanhDich: 'br_hop',
            eventId: 'ev.hop',
            tuning: TUNING,
        });
        expect(kq.ok).toBe(true);
        if (!kq.ok)
            return;
        const dich = theGioi('dich').state;
        dich.entities.clear();
        dich.links.clear();
        const r = apPatch(dich, kq.patches);
        expect(r.ok, r.ok ? '' : JSON.stringify(r.errors.slice(0, 3))).toBe(true);
        expect(dich.entities.get('e.chung')?.tickDiet).toBeNull();
        expect(dich.metrics.realityIntegrity).toBe(65);
    });
});
// ═══════════════════════════════════════════ DIỄN HÓA
describe('47 [BB] — Diễn Hóa: lằn ranh cứng và điểm dừng thông minh', () => {
    const cauHinh = CauHinhDienHoaSchema.parse({});
    it('[BB] 47.4 — mặc định KHÔNG được giết nhân vật người chơi', () => {
        expect(cauHinh.phamViChoPhep.duocGietNhanVatNguoiChoi).toBe(false);
    });
    it('[BB] 47.4 — không sửa Luật Nền, không tạo nhánh, không ghi lorebook', () => {
        expect([...BANG_CAM_DIEN_HOA].sort()).toEqual(['branches', 'lorebooks', 'substrateLaws']);
        const { state } = theGioi('dienhoa');
        const p = (table, path = '') => ({
            op: 'set',
            target: { table, id: 'x', path },
            value: 1,
            sourceEventId: 'ev',
        });
        const kq = locPatchTheoLanRanh([p('substrateLaws'), p('lorebooks'), p('entities', 'ten')], cauHinh, state);
        expect(kq.giu).toHaveLength(1);
        expect(kq.bo).toHaveLength(2);
        expect(kq.loi.some((l) => l.code === 'DIEN_HOA_BANG_CAM')).toBe(true);
    });
    it('[BB] 47.4 — chỉ được tickDiet, KHÔNG được xóa cứng entity', () => {
        const { state } = theGioi('dienhoa2');
        const xoaCung = {
            op: 'unlink',
            target: { table: 'entities', id: 'e.x', path: '' },
            sourceEventId: 'ev',
        };
        const kq = locPatchTheoLanRanh([xoaCung], cauHinh, state);
        expect(kq.giu).toHaveLength(0);
        expect(kq.bo[0]?.lyDo).toContain('tickDiet');
    });
    it('không trả lời lời cầu thay người chơi', () => {
        const { state } = theGioi('dienhoa3');
        const p = {
            op: 'set',
            target: { table: 'prayers', id: 'p1', path: 'daTraLoi' },
            value: true,
            sourceEventId: 'ev',
        };
        expect(locPatchTheoLanRanh([p], cauHinh, state).giu).toHaveLength(0);
    });
    it('giết nhân vật người chơi bị chặn khi công tắc tắt, cho qua khi bật', () => {
        const { state } = theGioi('dienhoa4');
        state.world = { ...state.world, playerState: { ...state.world.playerState, chuTheId: 'e.toi' } };
        const p = {
            op: 'set',
            target: { table: 'entities', id: 'e.toi', path: 'tickDiet' },
            value: 5,
            sourceEventId: 'ev',
        };
        expect(locPatchTheoLanRanh([p], cauHinh, state).giu).toHaveLength(0);
        const batKhac = CauHinhDienHoaSchema.parse({ phamViChoPhep: { duocGietNhanVatNguoiChoi: true } });
        expect(locPatchTheoLanRanh([p], batKhac, state).giu).toHaveLength(1);
    });
    it('[BB] 47.3 — dừng khi CÓ CHUYỆN ĐÁNG XEM, không phải khi hết lượt', () => {
        const { state } = theGioi('dung');
        const nc = { state, cauHinh, luotDaChay: 1, soCall: 1, tokenDaDung: 1, realityTruoc: 100 };
        // Không có gì đáng xem → chạy tiếp.
        expect(kiemDieuKienDung(nc)).toBeNull();
        // Cơ chế mới xuất hiện → dừng, và báo cáo mở thẳng vào đó.
        const coChe = kiemDieuKienDung({ ...nc, coCheVuaBat: ['than_bi'] });
        expect(coChe?.loai).toBe('co_che_moi_xuat_hien');
        expect(coChe?.moTa).toContain('than_bi');
        // Trục nền được đặt tên → dừng.
        expect(kiemDieuKienDung({ ...nc, trucVuaDatTen: ['thoi_gian'] })?.loai).toBe('luat_nen_duoc_dat_ten');
        // Kỳ vọng lorebook lệch → dừng.
        expect(kiemDieuKienDung({ ...nc, kyVongVuaLech: ['kv.1'] })?.loai).toBe('ky_vong_lorebook_bi_lech');
        // Thực tại rách nhanh → dừng.
        expect(kiemDieuKienDung({
            ...nc,
            realityTruoc: 100,
            state: { ...state, metrics: { ...state.metrics, realityIntegrity: 70 } },
        })?.loai).toBe('reality_tut_qua_20');
    });
    it('hết lượt xếp CUỐI danh sách ưu tiên — dừng vì hết chỉ tiêu là kết cục nhàm nhất', () => {
        const { state } = theGioi('dung2');
        const nc = { state, cauHinh, luotDaChay: 999, soCall: 0, tokenDaDung: 0, realityTruoc: 100 };
        expect(kiemDieuKienDung(nc)?.loai).toBe('het_luot');
        // Có chuyện đáng xem thì nó thắng "hết lượt".
        expect(kiemDieuKienDung({ ...nc, coCheVuaBat: ['than_bi'] })?.loai).toBe('co_che_moi_xuat_hien');
    });
    it('47.6 — báo cáo viết bằng giọng biên niên, có nút xem từng khoảnh khắc', () => {
        const log = EvolutionLogSchema.parse({
            id: 'dh.1',
            branchId: 'br_goc',
            tickBatDau: 4820,
            tickKetThuc: 4931,
            soLuotChay: 34,
            soCall: 34,
            tokenDaDung: 1_200_000,
            lyDoDung: 'Mạch Ly Giáo Sông Đen vừa lên cao trào.',
            suKienLon: [{ tick: 4834, moTa: 'Nghi lễ Tẩy Tro lan tới ba lưu vực.', loai: 'khai_niem' }],
            anhChup: 'snap.1',
        });
        const bc = baoCaoDienHoa(log, { reality: 96, songDong: 71 }, { reality: 88, songDong: 78 });
        expect(bc.tieuDe).toContain('DIỄN HÓA');
        expect(bc.lyDoDung).toContain('cao trào');
        expect(bc.muc[0]?.xemDuoc).toBe(true);
        expect(bc.chiSo.join(' ')).toContain('96 → 88');
    });
});
// ═══════════════════════════════════════════ WORLD PACK
describe('cổng — imported registry KHÔNG chứa code', () => {
    const packSach = {
        _format: 'thien_dien_world_pack_v1',
        pack: {
            id: 'pack.thu',
            ten: 'Pack thử',
            version: 1,
            entries: [
                {
                    registry: 'kind',
                    id: 'linh_thu',
                    version: 1,
                    ten: 'Linh Thú',
                    handlerId: '',
                    schemaRef: '',
                    config: {},
                },
            ],
        },
    };
    it('pack sạch nhập được, và mục không có handler vào ở `can_adapter`', () => {
        const kq = nhapWorldPack(packSach);
        expect(kq.ok).toBe(true);
        expect(kq.thongKe.hoatDong).toBe(1);
        const coHandlerLa = {
            ...packSach,
            pack: {
                ...packSach.pack,
                entries: [{ ...packSach.pack.entries[0], handlerId: 'khong_he_co.handler' }],
            },
        };
        const kq2 = nhapWorldPack(coHandlerLa);
        expect(kq2.thongKe.canAdapter).toBe(1);
        expect(kq2.muc[0]?.trangThai).toBe('can_adapter');
        // Không bị từ chối cả pack.
        expect(kq2.ok).toBe(true);
    });
    it.each([
        ['eval', '{"moTa":"eval(x)"}'],
        ['new Function', '{"moTa":"new Function(1)"}'],
        ['script tag', '{"moTa":"<script>alert(1)</script>"}'],
        ['javascript: url', '{"moTa":"javascript:alert(1)"}'],
        // `__proto__` phải đi qua JSON.parse: viết trong object literal thì nó đặt
        // prototype chứ không tạo khóa own, và bộ quét sẽ không thấy gì cả.
        ['__proto__', '{"config":{"__proto__":{"x":1}}}'],
    ])('pack chứa %s bị TỪ CHỐI', (_ten, banJson) => {
        const ban = JSON.parse(banJson);
        const xau = {
            ...packSach,
            pack: {
                ...packSach.pack,
                entries: [Object.assign(JSON.parse(JSON.stringify(packSach.pack.entries[0])), ban)],
            },
        };
        const kq = nhapWorldPack(xau);
        expect(kq.ok).toBe(false);
        expect(kq.issues.some((i) => i.code === 'PACK_CO_DAU_VET_CODE' || i.code === 'PACK_SAI_SCHEMA')).toBe(true);
    });
    it('pack thiếu _format bị từ chối — không đoán loại từ hình dạng', () => {
        const kq = nhapWorldPack({ pack: packSach.pack });
        expect(kq.ok).toBe(false);
        expect(kq.issues[0]?.code).toBe('PACK_SAI_FORMAT');
    });
    it('tuning kèm pack đi qua schema, không Object.assign', () => {
        const kq = nhapWorldPack({
            ...packSach,
            tuning: TuningSchema.parse({ khaiNiem: { nguongKetTinhMacDinh: 500 } }),
        });
        expect(kq.ok).toBe(true);
        expect(kq.tuning?.khaiNiem.nguongKetTinhMacDinh).toBe(500);
        const sai = nhapWorldPack({
            ...packSach,
            tuning: { khaiNiem: { nguongKetTinhMacDinh: 'không phải số' } },
        });
        expect(sai.ok).toBe(false);
    });
    it('xuất rồi nhập lại cho cùng pack', () => {
        const kq = nhapWorldPack(JSON.parse(xuatWorldPack(nhapWorldPack(packSach).pack)));
        expect(kq.ok).toBe(true);
        expect(kq.pack?.id).toBe('pack.thu');
    });
});
// ═══════════════════════════════════════════ BENCHMARK RERANK
describe('cổng — rerank tăng hoặc giữ nDCG, KHÔNG đánh đổi forbidden recall = 0', () => {
    const boDe = [
        RetrievalEvalCaseSchema.parse({
            id: 'c1',
            mode: 'pham_nhan',
            chuTheId: 'e.x',
            task: 'narrate_scene',
            query: 'q',
            relevantChunkIds: ['a', 'b'],
            forbiddenChunkIds: ['cam'],
        }),
        RetrievalEvalCaseSchema.parse({
            id: 'c2',
            mode: 'than',
            chuTheId: 'e.y',
            task: 'answer_prayer',
            query: 'q2',
            relevantChunkIds: ['c'],
            forbiddenChunkIds: ['cam2'],
        }),
    ];
    const chay = (ketQua) => async (ca, mode) => ({
        kq: {
            caseId: ca.id,
            orderedChunkIds: ketQua[mode][ca.id] ?? [],
            nguonIds: (ketQua[mode][ca.id] ?? []).map((x) => `n.${x}`),
            latencyMs: mode === 'heuristic' ? 20 : 90,
            daFallback: false,
            tokenSauRerank: 500,
            modeUsed: mode === 'heuristic' ? 'heuristic' : 'proxy_cross_encoder',
        },
        latencyMs: mode === 'heuristic' ? 20 : 90,
    });
    it('[BB] baseline heuristic LUÔN được đo trước, trong cùng một lời gọi', async () => {
        const thuTu = [];
        const kq = await chayBenchmark({
            boDe,
            tickDo: 10,
            chay: async (ca, mode) => {
                thuTu.push(mode);
                return await chay({
                    heuristic: { c1: ['a', 'b'], c2: ['c'] },
                    semantic: { c1: ['a', 'b'], c2: ['c'] },
                    fusion: {},
                })(ca, mode);
            },
        });
        expect(thuTu.slice(0, 2)).toEqual(['heuristic', 'heuristic']);
        expect(kq.baseline.mode).toBe('heuristic');
    });
    it('semantic tốt hơn thì kết luận `tot_hon`', async () => {
        const kq = await chayBenchmark({
            boDe,
            tickDo: 10,
            chay: chay({
                heuristic: { c1: ['x', 'y', 'a', 'b'], c2: ['z', 'c'] },
                semantic: { c1: ['a', 'b'], c2: ['c'] },
                fusion: {},
            }),
        });
        expect(kq.ketLuan.ket).toBe('tot_hon');
        expect(kq.ketLuan.deltaNdcg).toBeGreaterThan(0);
    });
    it('[BB] rò chunk cấm → `khong_dung_duoc`, DÙ nDCG cao hơn', async () => {
        const kq = await chayBenchmark({
            boDe,
            tickDo: 10,
            chay: chay({
                heuristic: { c1: ['x', 'a', 'b'], c2: ['z', 'c'] },
                // Xếp hoàn hảo NHƯNG có chunk cấm lọt vào.
                semantic: { c1: ['a', 'b', 'cam'], c2: ['c'] },
                fusion: {},
            }),
        });
        expect(kq.doiChung[0]?.tongKet.ndcgAt10).toBeGreaterThan(kq.baseline.tongKet.ndcgAt10);
        expect(kq.ketLuan.ket).toBe('khong_dung_duoc');
        expect(kq.ketLuan.thongDiep).toContain('Không đánh đổi');
    });
    it('dưới nDCG mục tiêu ghi trong DECISIONS.md thì `te_hon`', async () => {
        const kq = await chayBenchmark({
            boDe,
            tickDo: 10,
            ndcgMucTieu: 0.99,
            chay: chay({ heuristic: { c1: ['a'], c2: ['c'] }, semantic: { c1: ['a'], c2: ['c'] }, fusion: {} }),
        });
        expect(kq.ketLuan.ket).toBe('te_hon');
        expect(kq.ketLuan.thongDiep).toContain('DECISIONS.md');
    });
    it('ngang bằng thì nói rõ latency — semantic không sai nhưng chưa đáng tiền', () => {
        const base = {
            mode: 'heuristic',
            tongKet: { ndcgAt10: 0.5, recallAt20: 0.6, forbiddenRecall: 0, p95LatencyMs: 20 },
            cong: [],
        };
        const moi = {
            mode: 'semantic',
            tongKet: { ndcgAt10: 0.5, recallAt20: 0.6, forbiddenRecall: 0, p95LatencyMs: 200 },
            cong: [],
        };
        const k = ketLuan(base, moi, 0);
        expect(k.ket).toBe('ngang_bang');
        expect(k.thongDiep).toContain('200 ms');
    });
    it('lịch sử chỉ số so được giữa hai phiên — và từ chối so khi khác cấu hình', async () => {
        const kq = await chayBenchmark({
            boDe,
            tickDo: 10,
            chay: chay({
                heuristic: { c1: ['a', 'b'], c2: ['c'] },
                semantic: { c1: ['a', 'b'], c2: ['c'] },
                fusion: {},
            }),
        });
        const cu = dongLichSu({ branchId: 'br', configHash: 'cfg1', kq: kq.baseline, tickDo: 10 });
        const moi = dongLichSu({ branchId: 'br', configHash: 'cfg1', kq: kq.baseline, tickDo: 20 });
        expect(soSanhPhien(cu, moi).dat).toBe(true);
        const khacCfg = { ...moi, configHash: 'cfg2' };
        expect(soSanhPhien(cu, khacCfg).dat).toBe(false);
        expect(soSanhPhien(cu, khacCfg).thongDiep).toContain('không so được');
    });
});
// ═══════════════════════════════════════════ CỔNG CUỐI
describe('cổng — tắt feature KHÔNG làm core hỏng', () => {
    beforeEach(() => {
        datLaiInvariant();
        napBatBienTheGioiSong();
        napBatBienPhase10();
    });
    it('không lorebook, không luật nền có tên, không cơ chế: 100 tick vẫn chạy sạch', () => {
        const { state, log } = theGioi('tat-het');
        expect(state.lorebooks.size).toBe(0);
        expect(state.substrateLaws.size).toBe(0);
        expect(state.coChe.size).toBe(0);
        chayTick(state, log, 100);
        expect(state.world.tick).toBe(100);
        expect(chayInvariantToanBo(state).viPhamNang).toEqual([]);
    });
    it('bật đủ luật nền + cơ chế + lorebook rồi TẮT lại cho đúng hash như chưa từng bật', () => {
        const a = theGioi('bat-tat');
        chayTick(a.state, a.log, 20);
        const truoc = hashState(a.state);
        // Bật: ghi luật nền, cơ chế và lorebook vào state.
        for (const ln of luatNenMacDinh('br_goc'))
            a.state.substrateLaws.set(ln.id, ln);
        a.state.coChe.set('than_bi', {
            id: 'than_bi',
            branchId: 'br_goc',
            bat: false,
            tickBat: null,
            tickTat: null,
            conThieu: [],
        });
        const lb = nhapLorebook({
            goc: { entries: [{ uid: 'a', content: 'x' }] },
            id: 'lb.x',
            ten: 'X',
            nguon: 'nguoi_dung',
        }).lorebook;
        if (lb)
            a.state.lorebooks.set(lb.id, lb);
        expect(hashState(a.state)).not.toBe(truoc);
        // Tắt: gỡ hết ra.
        a.state.substrateLaws.clear();
        a.state.coChe.clear();
        a.state.lorebooks.clear();
        expect(hashState(a.state)).toBe(truoc);
    });
    it('determinism không vỡ: cùng seed cho cùng hash sau 100 tick với đủ bảng mới', () => {
        const a = theGioi('det-p10');
        const b = theGioi('det-p10');
        for (const ln of luatNenMacDinh('br_goc')) {
            a.state.substrateLaws.set(ln.id, ln);
            b.state.substrateLaws.set(ln.id, ln);
        }
        chayTick(a.state, a.log, 100);
        chayTick(b.state, b.log, 100);
        expect(hashState(a.state)).toBe(hashState(b.state));
    });
    it('năm bảng mới của Phase 10 đều patch được qua transaction, không có đường ghi tắt', () => {
        const { state } = theGioi('bang-moi');
        const ln = luatNenMacDinh('br_goc')[0];
        const r = apPatch(state, [
            { op: 'link', target: { table: 'substrateLaws', id: ln.id, path: '' }, value: ln, sourceEventId: 'ev' },
            {
                op: 'link',
                target: { table: 'coChe', id: 'than_bi', path: '' },
                value: { id: 'than_bi', branchId: 'br_goc', bat: false, tickBat: null, tickTat: null, conThieu: [] },
                sourceEventId: 'ev',
            },
        ]);
        expect(r.ok, r.ok ? '' : JSON.stringify(r.errors)).toBe(true);
        expect(state.substrateLaws.size).toBe(1);
        expect(state.coChe.size).toBe(1);
        // Patch sai hình dạng vẫn bị từ chối như mọi bảng khác.
        const xau = apPatch(state, [
            {
                op: 'link',
                target: { table: 'substrateLaws', id: 'ln.la', path: '' },
                value: { truc: 'khong_co_truc_nay' },
                sourceEventId: 'ev',
            },
        ]);
        expect(xau.ok).toBe(false);
    });
});
// ═══════════════════════════════════════════ BẤT BIẾN PHASE 10
describe('bất biến Phase 10 — bắt lỗi ở lượt thứ bốn trăm, không chỉ ở lượt đầu', () => {
    beforeEach(() => {
        datLaiInvariant();
        napBatBienTheGioiSong();
        napBatBienPhase10();
    });
    function voiLorebook(nguon, e) {
        const { state } = theGioi('batbien');
        state.lorebooks.set('lb.x', {
            id: 'lb.x',
            branchId: 'br_goc',
            ten: 'X',
            thanHe: '',
            moTa: '',
            bat: true,
            uuTien: 100,
            lucHapDan: 60,
            version: '1.0',
            nguon,
            conflictPolicy: 'song_song',
            entries: [e],
        });
        return state;
    }
    it('[BB] 52.2 — máy sửa entry người dùng là vi phạm NẶNG', () => {
        const s = voiLorebook('nguoi_dung', entry({
            id: 'u1',
            ten: 'Của người dùng',
            order: 1,
            lichSu: [{ tick: 400, boiAi: 'ai', op: 'sua', truoc: 'a', sau: 'b', lyDo: '' }],
        }));
        const kq = chayInvariantToanBo(s);
        expect(kq.dat).toBe(false);
        expect(kq.viPhamNang.some((v) => v.code === 'LOREBOOK_NGUOI_DUNG_BAT_KHA_XAM')).toBe(true);
    });
    it('op `che` trên entry người dùng KHÔNG vi phạm — đó là op duy nhất được phép', () => {
        const s = voiLorebook('nguoi_dung', entry({
            id: 'u1',
            ten: 'Của người dùng',
            order: 1,
            trangThai: 'bi_che',
            biCheBoiId: 's1',
            lyDoChe: 'Ra bị thu hồi',
            tickChe: 1180,
            lichSu: [{ tick: 1180, boiAi: 'doi_soat', op: 'che', truoc: 'hoat_dong', sau: 'bi_che', lyDo: 'x' }],
        }));
        expect(chayInvariantToanBo(s).dat).toBe(true);
    });
    it('[BB] 51.4 — entry khóa canon mà đang bị che là vi phạm NẶNG', () => {
        const s = voiLorebook('nguoi_dung', entry({
            id: 'u1',
            ten: 'Canon',
            order: 1,
            khoaCanon: true,
            trangThai: 'bi_che',
            biCheBoiId: 's1',
            lyDoChe: 'x',
            tickChe: 1,
        }));
        expect(chayInvariantToanBo(s).viPhamNang.some((v) => v.code === 'KHOA_CANON_KHONG_BI_CHE')).toBe(true);
    });
    it('che mà không có lý do thì cảnh báo — entry biến mất không lời giải thích là bug', () => {
        const s = voiLorebook('tu_sinh', entry({ id: 's1', ten: 'X', order: 10_001, trangThai: 'bi_che' }));
        const kq = chayInvariantToanBo(s);
        expect(kq.canhBao.some((v) => v.code === 'CHE_PHAI_CO_LY_DO')).toBe(true);
    });
    it('[BB] 51.6 — doTinCay cao mà không có sự kiện chống lưng thì cảnh báo', () => {
        const s = voiLorebook('tu_sinh', entry({ id: 's1', ten: 'X', order: 10_001, doTinCay: 90, suKienChongLung: [] }));
        expect(chayInvariantToanBo(s).canhBao.some((v) => v.code === 'ENTRY_KHONG_CHONG_LUNG_KHONG_NAP')).toBe(true);
    });
    it('[BB] 43.5 — trục có tên khi trục phụ thuộc còn vô danh là vi phạm NẶNG', () => {
        const { state } = theGioi('batbien2');
        for (const ln of luatNenMacDinh('br_goc')) {
            state.substrateLaws.set(ln.id, ln.truc === 'van_menh' ? { ...ln, trangThai: 'co_ten', khaiNiemNenId: 'kn.tat_yeu' } : ln);
        }
        const kq = chayInvariantToanBo(state);
        expect(kq.viPhamNang.some((v) => v.code === 'LUAT_NEN_DUNG_THU_TU')).toBe(true);
    });
    it('[BB] 43.2 — trục vô danh mà đã có kẽ hở là vi phạm NẶNG', () => {
        const { state } = theGioi('batbien3');
        for (const ln of luatNenMacDinh('br_goc')) {
            state.substrateLaws.set(ln.id, ln.truc === 'thoi_gian' ? { ...ln, keHo: [{ moTa: 'lách được', daBiKhaiThac: false }] } : ln);
        }
        expect(chayInvariantToanBo(state).viPhamNang.some((v) => v.code === 'KE_HO_CHI_CO_KHI_CO_TEN')).toBe(true);
    });
    it('bảy trục vô danh mặc định thì sạch bất biến', () => {
        const { state } = theGioi('batbien4');
        for (const ln of luatNenMacDinh('br_goc'))
            state.substrateLaws.set(ln.id, ln);
        expect(chayInvariantToanBo(state).dat).toBe(true);
    });
});
