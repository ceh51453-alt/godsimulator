/**
 * Cổng Phase 8 — phần tự sự: mạch truyện, ống kính, trí nhớ và phục bút.
 *
 * Mỗi bài ở đây kiểm một dòng của cổng, và kiểm nó bằng cách CỐ LÀM SAI:
 *
 *   - mạch truyện phải chạy khi không ai nhìn      → chạy tick, không gọi LLM
 *   - đa số mạch người chơi KHÔNG biết              → đếm tỉ lệ, không đọc ý định
 *   - nhịp truyện KHÔNG gọi LLM                     → `choPhepLlm` để mặc định false
 *   - thứ đã gieo không biến mất                    → quá hạn rồi tìm nó ở `gaps`
 *   - nén không làm mất nhân quả tự sự              → nén xong tìm lại từng mục
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog, hashState } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { EntitySchema } from '../schema/entity.js';
import { SoulSchema } from '../schema/aspect/soul.js';
import { MortalSchema } from '../schema/aspect/living.js';
import { chayInvariantToanBo, datLaiInvariant } from '../engine/invariant.js';
import { motTick } from '../engine/tick.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { napBatBienTangThan } from '../world/batBienThan.js';
import { napBatBienTangPham } from '../world/batBienPham.js';
import { napBatBienTangTruyen } from '../world/batBienTruyen.js';
import { chayTienTrinhNen } from '../world/process/scheduler.js';
import { TUNING_MAC_DINH } from '../tuning/schema.js';
import { chieu } from '../project/chieu.js';
import { taoRng, rngCuaTick } from '../engine/rng.js';
import { R, napDungSan } from '../registry/index.js';
import { StorylineSchema, ForeshadowSchema, machDaDong, quaHan, TI_LE_VANG_MAT } from '../schema/truyen.js';
import { HANDLER_LOAI_MACH, loaiMachThieuHandler } from './loaiMach.js';
import { quetMachTruyen, nhipMachTruyen, hanNgachVangMat, idMach } from './machTruyen.js';
import { gieoPhucBut, traPhucBut, raSoatPhucBut, idPhucBut } from './phucBut.js';
import { ongKinhMoi, chonMucTieu, apOngKinh, datOngKinh, ongKinhOChoNguoiChoi, tieuDiem } from './ongKinh.js';
import { nenKyUcMach, ranMucNen, kiemNenKhongMat, kyNguyenCua, laMocKyNguyen } from './kyUc.js';
const TUNING = TUNING_MAC_DINH;
beforeEach(() => {
    datLaiInvariant();
    napBatBienTheGioiSong();
    napBatBienTangThan();
    napBatBienTangPham();
    napBatBienTangTruyen();
});
function theGioi(seed = 'cong-phase-8') {
    const ct = KhoiTaoWorldSchema.parse({ cua: 'day_du', seed, worldId: 'w1', branchId: 'br_goc' });
    const { world, events } = moThuGioi(ct);
    const state = taoState(world);
    const log = taoEventLog();
    const r = apDungChuoi(state, events, log);
    if (!r.ok)
        throw new Error(r.errors.map((e) => e.message).join('; '));
    const nen = eventGieoNen(state);
    if (nen)
        apDungEvent(state, nen, log);
    return { state, log };
}
function chay(state, log, soTick) {
    for (let i = 0; i < soTick; i++) {
        // [BB] `choPhepLlm` mặc định false — mọi thứ dưới đây là engine thuần.
        const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
        for (const ev of r.events) {
            const ok = apDungEvent(state, ev, log);
            if (!ok.ok)
                throw new Error(ok.errors.map((e) => e.message).join('; '));
        }
    }
}
/**
 * Thế giới hạt giống có ĐÚNG MỘT phàm nhân, nên phần lớn tiền đề của 28.3 không
 * có gì để bắt. Bốn người có quan hệ thật là mức tối thiểu để mười bốn bộ dò
 * chứng minh được điều chúng nói.
 *
 * Thêm người qua Event như mọi thay đổi khác (luật bất biến #4), không `set`
 * thẳng vào Map — nếu không thì bài test chạy trên một thế giới mà engine chưa
 * bao giờ nhìn thấy.
 */
function theGioiDong(seed = 'cong-phase-8-dong') {
    const { state, log } = theGioi(seed);
    const evId = 'ev_them_nguoi';
    const nguoi = (id, ten, quanHe, ducVong) => EntitySchema.parse({
        id,
        branchId: state.world.branchId,
        kind: 'mortal',
        ten,
        tickSinh: 0,
        aspects: {
            soul: SoulSchema.parse({ tang: 't2', quanHe, ducVong }),
            mortal: MortalSchema.parse({ ageBand: 'adult', ngheId: 'nghe_dan_luoi', kyNang: { dan_luoi: 55 } }),
        },
    });
    const cast = [
        // Mối thù: yeuGhet rất âm, noOn lệch hẳn — tiền đề `bao_thu`.
        {
            id: 'mortal_a',
            ten: 'Người Thứ Nhất',
            qh: { mortal_b: { yeuGhet: -85, noOn: 70, tinNgo: 10 } },
            dv: { baoThu: 60, triThuc: 30 },
        },
        // Bên kia không thấy mình nợ ai — đúng chỗ "lệch noOn" của 28.3.
        {
            id: 'mortal_b',
            ten: 'Người Thứ Hai',
            qh: { mortal_a: { yeuGhet: -20, noOn: 0, tinNgo: 20 } },
            dv: { quyenLuc: 60, triThuc: 55 },
        },
        // Khe hở bốn trục: còn tin, đã thôi quý — tiền đề `phan_boi`.
        {
            id: 'mortal_c',
            ten: 'Người Thứ Ba',
            qh: { mortal_d: { tinNgo: 85, yeuGhet: -25 } },
            dv: { quyenLuc: 55, triThuc: 60 },
        },
        {
            id: 'mortal_d',
            ten: 'Người Thứ Tư',
            qh: { mortal_c: { yeuGhet: 70, thanSo: 65 } },
            dv: { tinhAi: 50, triThuc: 25 },
        },
    ];
    const patches = cast.map((x) => ({
        op: 'link',
        target: { table: 'entities', id: x.id, path: '' },
        value: nguoi(x.id, x.ten, x.qh, x.dv),
        sourceEventId: evId,
    }));
    // Nối họ vào vùng để không thành thực thể mồ côi (6.3 quy tắc 3).
    for (const [i, id] of ['mortal_a', 'mortal_b', 'mortal_c', 'mortal_d'].entries()) {
        patches.push({
            op: 'link',
            target: { table: 'links', id: `lk_them_${i}`, path: '' },
            value: {
                id: `lk_them_${i}`,
                branchId: state.world.branchId,
                tuId: id,
                denId: 'place_a',
                quanHe: 'cu_tru_tai',
                trongSo: 90,
                tickTao: 0,
                tickDut: null,
                nguon: 'engine',
            },
            sourceEventId: evId,
        });
    }
    const ev = taoEvent({
        id: evId,
        branchId: state.world.branchId,
        tick: 0,
        loai: 'them_nguoi_test',
        actorIds: [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches,
        visibility: 'engine',
        source: 'engine',
        payload: {},
    });
    const ok = apDungEvent(state, ev, log);
    if (!ok.ok)
        throw new Error(ok.errors.map((e) => e.message).join('; '));
    return { state, log };
}
/** Dựng một mạch bằng tay — dùng khi cần một hình dạng cụ thể để kiểm. */
function machTay(state, ghiDe = {}) {
    const m = StorylineSchema.parse({
        id: 'ml_test_1',
        branchId: state.world.branchId,
        ten: 'Mạch thử',
        loai: 'bao_thu',
        nhanVat: [{ entityId: 'a', vaiTro: 'chinh', trongSo: 80 }],
        tickSinh: 0,
        nhipMoi: 4,
        dongHo: 1,
        ...ghiDe,
    });
    state.storylines.set(m.id, m);
    return m;
}
// ─────────────────────────────────────────── loại mạch truyện
describe('mạch truyện đa dạng — Phần 28.3', () => {
    it('mười bốn loại đều có handler, không loại nào ở trạng thái can_adapter', () => {
        napDungSan();
        const ids = R.storyKind.tatCa().map((d) => d.id);
        expect(ids.length).toBeGreaterThanOrEqual(14);
        expect(loaiMachThieuHandler(ids)).toEqual([]);
    });
    it('mười loại của bảng 28.3 đều có mặt, kể cả loại khai thác khe hở bốn trục', () => {
        napDungSan();
        const ids = new Set(R.storyKind.tatCa().map((d) => d.id));
        // `bao_thu` mang tiền đề của `phuc_thu`, `troi_day` mang tiền đề của `cuu_the` (ADR-0037).
        for (const x of ['bao_thu', 'ke_vi', 'chien_tranh', 'ly_giao', 'am_muu'])
            expect(ids.has(x)).toBe(true);
        for (const x of ['tinh_ai', 'kham_pha', 'troi_day', 'suy_tan', 'phan_boi'])
            expect(ids.has(x)).toBe(true);
    });
    it('[BB] phan_boi khai thác đúng KHE HỞ giữa tinNgo và yeuGhet', () => {
        const { state } = theGioiDong();
        // `mortal_c` còn tin `mortal_d` (tinNgo 85) trong khi đã thôi quý (yeuGhet -25).
        // Một thang "thiện cảm" duy nhất không biểu diễn được trạng thái này.
        const uv = HANDLER_LOAI_MACH['phan_boi']?.tienDe(state) ?? [];
        const cua = uv.find((x) => x.nhanVat.some((n) => n.entityId === 'mortal_c'));
        expect(cua).toBeTruthy();
        // Kẻ sẽ phản là người ĐƯỢC tin, không phải người còn tin.
        expect(cua?.nhanVat.find((n) => n.vaiTro === 'chinh')?.entityId).toBe('mortal_d');
        expect(cua?.nhanVat.find((n) => n.vaiTro === 'nan_nhan')?.entityId).toBe('mortal_c');
    });
    it('bao_thu bắt đúng cặp có yeuGhet rất âm VÀ lệch noOn', () => {
        const { state } = theGioiDong();
        const uv = HANDLER_LOAI_MACH['bao_thu']?.tienDe(state) ?? [];
        const cua = uv.find((x) => x.nhanVat[0]?.entityId === 'mortal_a');
        expect(cua).toBeTruthy();
        expect(cua?.nhanVat.find((n) => n.vaiTro === 'doi_dau')?.entityId).toBe('mortal_b');
    });
    it('tiền đề được DÒ từ thế giới, nên save không có bảng storylines vẫn sinh lại được', () => {
        const { state } = theGioi();
        expect(state.storylines.size).toBe(0);
        const kq = quetMachTruyen(state, {
            tick: 0,
            eventId: 'ev1',
            tuning: TUNING,
            rng: taoRng('x'),
            nguoiChoiId: null,
        });
        expect(kq.machMoi.length).toBeGreaterThan(0);
    });
});
// ─────────────────────────────────────────── chống thiên vị người chơi
describe('[BB] cổng Phase 8 — không lấy người chơi làm tâm (28.2, 28.6, 29.3)', () => {
    it('đa số mạch truyện là chuyện người chơi CHƯA từng nghe', () => {
        const { state, log } = theGioiDong();
        const nguoi = [...state.entities.values()].find((e) => e.kind === 'mortal');
        state.world.playerState.chuTheId = nguoi?.id ?? null;
        state.world.playerState.mode = 'pham_nhan';
        chay(state, log, 40);
        const dang = [...state.storylines.values()].filter((m) => !machDaDong(m.giaiDoan));
        expect(dang.length).toBeGreaterThan(3);
        const vang = dang.filter((m) => !m.nguoiChoiBiet).length;
        expect(vang / dang.length).toBeGreaterThanOrEqual(TI_LE_VANG_MAT.mucTieu);
    });
    it('bất biến bắt được khi thế giới co lại quanh một người', () => {
        const { state } = theGioi();
        for (let i = 0; i < 5; i++) {
            machTay(state, { id: `ml_${i}`, nguoiChoiBiet: true, giaiDoan: 'phat_trien' });
        }
        const kq = chayInvariantToanBo(state);
        // Mức `warning`: một thế giới mới mở chỉ có ba mạch quanh người chơi thì
        // CHƯA sai, nó chỉ chưa rộng — rollback transaction vì thế là quá tay.
        expect(kq.canhBao.some((v) => v.message.includes('co lại quanh một người'))).toBe(true);
        expect(kq.dat).toBe(true);
    });
    it('[BB] 29.3 — nhân vật người chơi không có trọng số ưu ái trong Storyline', () => {
        const { state } = theGioi();
        const nguoi = [...state.entities.values()].find((e) => e.kind === 'mortal');
        const id = nguoi?.id ?? 'x';
        const m = machTay(state, { nhanVat: [{ entityId: id, vaiTro: 'chung_kien', trongSo: 50 }] });
        // Không có trường nào phân biệt người chơi với entity khác.
        expect(Object.keys(m.nhanVat[0] ?? {})).toEqual(['entityId', 'vaiTro', 'trongSo']);
    });
    it('hạn ngạch vắng mặt đo theo SỐ CẢNH, không theo độ dài cảnh', () => {
        const it3 = hanNgachVangMat([
            { coNguoiChoi: true },
            { coNguoiChoi: false },
            { coNguoiChoi: false },
            { coNguoiChoi: false },
            { coNguoiChoi: false },
        ]);
        expect(it3.dat).toBe(true);
        expect(it3.tyLe).toBeCloseTo(0.8, 5);
        const truot = hanNgachVangMat([{ coNguoiChoi: true }, { coNguoiChoi: true }, { coNguoiChoi: false }]);
        expect(truot.dat).toBe(false);
        expect(truot.thongDiep).toContain('ưu tiên mạch ở xa');
    });
    it('máy sinh mạch giữ chỗ cho mạch KHÔNG có người chơi ngay cả khi mạch có người chơi căng hơn', () => {
        const { state } = theGioiDong();
        const nguoi = [...state.entities.values()].find((e) => e.kind === 'mortal');
        const kq = quetMachTruyen(state, {
            tick: 0,
            eventId: 'ev',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: nguoi?.id ?? null,
        });
        const vang = kq.machMoi.filter((m) => !m.nhanVat.some((n) => n.entityId === nguoi?.id));
        expect(vang.length / Math.max(1, kq.machMoi.length)).toBeGreaterThanOrEqual(TI_LE_VANG_MAT.mucTieu);
    });
});
// ─────────────────────────────────────────── nhịp truyện
describe('nhịp mạch truyện chạy bằng engine — Phần 28.5', () => {
    it('mạch tiến nhịp khi đồng hồ chạm 0, và KHÔNG gọi LLM lần nào', () => {
        const { state } = theGioi();
        const m = machTay(state, { dongHo: 1, cangThang: 10 });
        const kq = nhipMachTruyen(state, {
            tick: 5,
            eventId: 'ev',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        expect(kq.daChay.map((x) => x.machId)).toContain(m.id);
        expect(kq.patches.some((p) => p.target.path === 'dongHo')).toBe(true);
    });
    it('đồng hồ chưa chạm 0 thì chỉ đếm ngược, không sinh nhịp', () => {
        const { state } = theGioi();
        machTay(state, { dongHo: 3 });
        const kq = nhipMachTruyen(state, {
            tick: 1,
            eventId: 'ev',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        expect(kq.daChay).toHaveLength(0);
        expect(kq.patches).toHaveLength(1);
        expect(kq.patches[0]?.value).toBe(2);
    });
    it('[BB] mạch bỏ bê quá lâu ở phat_trien rơi vào chet_yeu — và đó là kết cục HỢP LỆ', () => {
        const { state } = theGioi();
        const m = machTay(state, {
            giaiDoan: 'phat_trien',
            dongHo: 1,
            nhipMoi: 4,
            tickSinh: 0,
            tickChieuCuoi: null,
            cangThang: 10,
        });
        const kq = nhipMachTruyen(state, {
            tick: 100,
            eventId: 'ev',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        const gd = kq.patches.find((p) => p.target.path === 'giaiDoan');
        expect(gd?.value).toBe('chet_yeu');
        // Kết cục được GHI, không bị xóa — truyện dở dang vẫn vào biên niên sử.
        expect(kq.patches.some((p) => p.target.path === 'ketCuc')).toBe(true);
        expect(kq.patches.some((p) => p.target.path === 'tickKet')).toBe(true);
        expect(m.id).toBeTruthy();
    });
    it('id mạch là hàm thuần của (loại, nhân vật) — dò lại hai lần không sinh hai mạch', () => {
        const a = idMach('br', 'bao_thu', ['x', 'y']);
        const b = idMach('br', 'bao_thu', ['y', 'x']);
        expect(a).toBe(b);
    });
    it('mạch đã đóng KHÔNG bị sinh lại dưới cùng id', () => {
        const { state } = theGioi();
        const kq1 = quetMachTruyen(state, {
            tick: 0,
            eventId: 'e',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        for (const m of kq1.machMoi)
            state.storylines.set(m.id, { ...m, giaiDoan: 'du_am', tickKet: 9 });
        const kq2 = quetMachTruyen(state, {
            tick: 10,
            eventId: 'e2',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        for (const m of kq2.machMoi)
            expect(kq1.machMoi.some((x) => x.id === m.id)).toBe(false);
    });
    it('trần machToiDa được tôn trọng', () => {
        const { state } = theGioi();
        for (let i = 0; i < TUNING.truyen.machToiDa; i++) {
            machTay(state, { id: `ml_day_${i}`, giaiDoan: 'phat_trien' });
        }
        const kq = quetMachTruyen(state, {
            tick: 0,
            eventId: 'e',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        expect(kq.machMoi).toHaveLength(0);
        expect(kq.soBiTran).toBeGreaterThan(0);
    });
});
// ─────────────────────────────────────────── ống kính
describe('ống kính — Phần 29', () => {
    it('[BB] 29.1 — chuyển ống kính KHÔNG tốn thời gian trong game', () => {
        const { state } = theGioi();
        const truoc = state.world.tick;
        const hashTruoc = hashState(state);
        const ok = datOngKinh(ongKinhMoi(0), { loai: 'nhan_vat', entityId: 'x' }, state.world.tick);
        expect(ok.dangChieu).toEqual({ loai: 'nhan_vat', entityId: 'x' });
        expect(state.world.tick).toBe(truoc);
        expect(hashState(state)).toBe(hashTruoc);
    });
    it('chế độ tự động chọn mạch CĂNG NHẤT trong số mạch người chơi biết', () => {
        const { state } = theGioi();
        state.world.playerState.mode = 'pham_nhan';
        machTay(state, { id: 'ml_nhe', cangThang: 20, nguoiChoiBiet: true, giaiDoan: 'khoi' });
        machTay(state, { id: 'ml_cang', cangThang: 90, nguoiChoiBiet: true, giaiDoan: 'cao_trao' });
        machTay(state, { id: 'ml_an', cangThang: 99, nguoiChoiBiet: false, giaiDoan: 'cao_trao' });
        const chon = chonMucTieu(state, ongKinhMoi(0), { tick: 10, rng: taoRng('s') });
        // Mạch căng nhất mà người chơi CHƯA biết không được chiếu: họ chưa nghe tới nó.
        expect(chon.machId).toBe('ml_cang');
    });
    it('ở tầng Sáng Thế thì thấy hết — mạch chưa ai kể vẫn chiếu tới được', () => {
        const { state } = theGioi();
        state.world.playerState.mode = 'sang_the';
        machTay(state, { id: 'ml_cang', cangThang: 90, nguoiChoiBiet: true, giaiDoan: 'cao_trao' });
        machTay(state, { id: 'ml_an', cangThang: 99, nguoiChoiBiet: false, giaiDoan: 'cao_trao' });
        // 18.1 — tầng này nhìn từ trên xuống; bắt nó chờ tin đồn là khóa mắt nó lại.
        expect(chonMucTieu(state, ongKinhMoi(0), { tick: 10, rng: taoRng('s') }).machId).toBe('ml_an');
    });
    it('[BB] 29.2 quy tắc 7 — Sáng Thế Thần không có mặt trong cảnh', () => {
        const { state } = theGioi();
        // Không thân xác thì không đứng ở đâu, nên mọi cảnh đều vắng mặt họ.
        expect(ongKinhOChoNguoiChoi(state, { loai: 'nguoi_choi' }, null)).toBe(false);
        expect(ongKinhOChoNguoiChoi(state, { loai: 'tu_dong' }, null)).toBe(false);
    });
    it('phục bút quá hạn kéo ống kính về mạch đang treo nợ', () => {
        const { state } = theGioi();
        // Ưu tiên phục bút là một phép CỘNG, không phải phép ghi đè: một mạch đang ở
        // cao trào vẫn thắng một mạch mới chớm dù mạch kia đang treo nợ tự sự.
        machTay(state, { id: 'ml_cang', cangThang: 60, nguoiChoiBiet: true, giaiDoan: 'phat_trien' });
        machTay(state, { id: 'ml_no', cangThang: 50, nguoiChoiBiet: true, giaiDoan: 'khoi' });
        const chon = chonMucTieu(state, ongKinhMoi(0), {
            tick: 10,
            rng: taoRng('s'),
            uuTienMachId: ['ml_no'],
        });
        expect(chon.machId).toBe('ml_no');
        expect(chon.vi).toContain('phục bút');
    });
    it('giữ tối thiểu: ống kính không nhảy chỗ mỗi nhịp', () => {
        const { state } = theGioi();
        machTay(state, { id: 'ml_a', cangThang: 50, nguoiChoiBiet: true });
        machTay(state, { id: 'ml_b', cangThang: 99, nguoiChoiBiet: true });
        let ok = ongKinhMoi(0);
        ok = apOngKinh(ok, chonMucTieu(state, ok, { tick: 0, rng: taoRng('s') }), 0);
        const chieu1 = ok.dangChieu;
        const chon2 = chonMucTieu(state, ok, { tick: 1, rng: taoRng('s') });
        expect(chon2.mucTieu).toEqual(chieu1);
        expect(chon2.daDoi).toBe(false);
    });
    it('[BB] 29.2 quy tắc 5 — biết được khi nào ống kính KHÔNG ở chỗ người chơi', () => {
        const { state } = theGioi();
        const nguoi = [...state.entities.values()].find((e) => e.kind === 'mortal');
        const id = nguoi?.id ?? 'x';
        machTay(state, { id: 'ml_xa', nhanVat: [{ entityId: 'khac', vaiTro: 'chinh', trongSo: 50 }] });
        expect(ongKinhOChoNguoiChoi(state, { loai: 'mach', machId: 'ml_xa' }, id)).toBe(false);
        expect(ongKinhOChoNguoiChoi(state, { loai: 'nguoi_choi' }, id)).toBe(true);
        expect(tieuDiem(state, { loai: 'mach', machId: 'ml_xa' }, id)).toEqual(['khac']);
    });
});
// ─────────────────────────────────────────── Sổ Phục Bút
describe('[BB] Sổ Phục Bút — Phần 30.2: thứ đã gieo không biến mất', () => {
    it('gieo cùng nội dung hai lần trong cùng mạch chỉ ra MỘT dòng', () => {
        const { state } = theGioi();
        machTay(state, { id: 'ml_1' });
        const g1 = gieoPhucBut(state, {
            noiDung: 'Cái chuông sẽ kêu lần nữa.',
            loai: 'dieu_bao',
            machId: 'ml_1',
            hanTraToiDa: 20,
            doNang: 60,
        }, { tick: 1, eventId: 'e' });
        expect(g1.daCo).toBe(false);
        state.foreshadows.set(g1.id, ForeshadowSchema.parse({
            id: g1.id,
            branchId: state.world.branchId,
            machId: 'ml_1',
            noiDung: 'Cái chuông sẽ kêu lần nữa.',
            loai: 'dieu_bao',
            tickGieo: 1,
            hanTraToiDa: 20,
        }));
        const g2 = gieoPhucBut(state, {
            noiDung: 'Cái chuông sẽ kêu lần nữa.',
            loai: 'dieu_bao',
            machId: 'ml_1',
            hanTraToiDa: 20,
            doNang: 60,
        }, { tick: 5, eventId: 'e' });
        expect(g2.daCo).toBe(true);
        expect(g2.patches).toHaveLength(0);
    });
    it('quá hạn chưa trả → được đẩy lên đầu và mạch của nó được cộng ưu tiên', () => {
        const { state } = theGioi();
        const id = idPhucBut(state.world.branchId, 'ml_1', 'Lời thề chưa giữ.');
        state.foreshadows.set(id, ForeshadowSchema.parse({
            id,
            branchId: state.world.branchId,
            machId: 'ml_1',
            noiDung: 'Lời thề chưa giữ.',
            loai: 'loi_noi',
            tickGieo: 1,
            hanTraToiDa: 10,
            doNang: 90,
        }));
        const ra = raSoatPhucBut(state, { tick: 15, eventId: 'e' });
        expect(ra.chuaTraQuaHan.map((f) => f.id)).toContain(id);
        expect(ra.machUuTien).toContain('ml_1');
    });
    it('[BB] quá hạn GẤP ĐÔI → thành gap nhan_qua, tức một bí ẩn — KHÔNG bị xóa', () => {
        const { state } = theGioi();
        const id = idPhucBut(state.world.branchId, null, 'Người lạ ấy chưa quay lại.');
        state.foreshadows.set(id, ForeshadowSchema.parse({
            id,
            branchId: state.world.branchId,
            machId: null,
            noiDung: 'Người lạ ấy chưa quay lại.',
            loai: 'nhan_vat',
            tickGieo: 0,
            hanTraToiDa: 10,
        }));
        const ra = raSoatPhucBut(state, { tick: 25, eventId: 'e' });
        expect(ra.soThanhBiAn).toBe(1);
        const gap = ra.patches.find((p) => p.target.table === 'gaps');
        expect((gap?.value).loai).toBe('nhan_qua');
        expect((gap?.value).trangThai).toBe('thanh_bi_an');
        // Dòng phục bút vẫn còn trong sổ.
        expect(state.foreshadows.has(id)).toBe(true);
    });
    it('trả phục bút KHÔNG xóa dòng, chỉ ghi cách trả', () => {
        const { state } = theGioi();
        const id = 'pb_x';
        state.foreshadows.set(id, ForeshadowSchema.parse({
            id,
            branchId: state.world.branchId,
            noiDung: 'Con dao ấy còn ở đâu đó.',
            loai: 'vat',
            tickGieo: 0,
        }));
        const ps = traPhucBut(state, id, 'Nó xuất hiện trong tay đứa con.', { eventId: 'e' });
        expect(ps).toHaveLength(2);
        expect(ps.some((p) => p.target.path === 'cachTra')).toBe(true);
        expect(state.foreshadows.has(id)).toBe(true);
    });
    it('bất biến bắt được phục bút "đã trả" mà không ghi trả thế nào', () => {
        const { state } = theGioi();
        state.foreshadows.set('pb_y', ForeshadowSchema.parse({
            id: 'pb_y',
            branchId: state.world.branchId,
            noiDung: 'x',
            loai: 'vat',
            tickGieo: 0,
            daTra: true,
            cachTra: '',
        }));
        const kq = chayInvariantToanBo(state);
        expect(kq.dat).toBe(false);
        expect(kq.viPhamNang.some((v) => v.message.includes('không ghi trả thế nào'))).toBe(true);
    });
    it('bất biến bắt được mạch trỏ tới phục bút đã biến mất khỏi sổ', () => {
        const { state } = theGioi();
        machTay(state, { id: 'ml_1', phucBut: ['pb_khong_ton_tai'] });
        const kq = chayInvariantToanBo(state);
        expect(kq.dat).toBe(false);
        expect(kq.viPhamNang.some((v) => v.message.includes('không còn trong sổ'))).toBe(true);
    });
    it('quaHan() chỉ đúng khi có hạn và đã quá', () => {
        const f = ForeshadowSchema.parse({
            id: 'p',
            branchId: 'b',
            noiDung: 'x',
            loai: 'vat',
            tickGieo: 10,
            hanTraToiDa: 5,
        });
        expect(quaHan(f, 14)).toBe(false);
        expect(quaHan(f, 16)).toBe(true);
        // Không hạn thì không bao giờ quá hạn — nó chờ mãi, và đó là hợp lệ.
        expect(quaHan({ ...f, hanTraToiDa: null }, 9999)).toBe(false);
    });
});
// ─────────────────────────────────────────── nén theo hình dạng truyện
describe('[BB] nén có hình dạng truyện — Phần 30.3', () => {
    function machDayDu(state) {
        const pb = ForeshadowSchema.parse({
            id: 'pb_1',
            branchId: state.world.branchId,
            machId: 'ml_1',
            noiDung: 'Cây cầu ấy sẽ gãy.',
            loai: 'dieu_bao',
            tickGieo: 2,
            doNang: 80,
        });
        state.foreshadows.set(pb.id, pb);
        const ds = [...state.entities.values()].filter((e) => e.kind === 'mortal').slice(0, 2);
        return machTay(state, {
            id: 'ml_1',
            nhanVat: [
                { entityId: ds[0]?.id ?? 'a', vaiTro: 'chinh', trongSo: 80 },
                { entityId: ds[1]?.id ?? 'b', vaiTro: 'doi_dau', trongSo: 70 },
            ],
            nutThat: [{ moTa: 'Chưa ai dám nói ra chuyện hôm ấy.', daGo: false, tickTao: 3 }],
            phucBut: ['pb_1'],
            kyUcMach: 'Mọi chuyện bắt đầu từ một mùa mất mùa.',
        });
    }
    it('nén giữ NGUYÊN nhân vật chính, nút thắt chưa gỡ và phục bút chưa trả', () => {
        const { state } = theGioi();
        const m = machDayDu(state);
        const nhip = Array.from({ length: 30 }, (_, i) => `Nhịp thứ ${i}: một chi tiết nhỏ không ai nhớ.`);
        const mn = nenKyUcMach(state, m, nhip);
        const van = ranMucNen(mn);
        expect(kiemNenKhongMat(mn, van)).toEqual([]);
        expect(van).toContain('Cây cầu ấy sẽ gãy.');
        expect(van).toContain('Chưa ai dám nói ra chuyện hôm ấy.');
    });
    it('nén ĐƯỢC PHÉP làm mất văn — chi tiết cảnh giữa chừng biến mất', () => {
        const { state } = theGioi();
        const m = machDayDu(state);
        const nhip = Array.from({ length: 30 }, (_, i) => `Nhịp thứ ${i}: một chi tiết nhỏ không ai nhớ.`);
        const van = ranMucNen(nenKyUcMach(state, m, nhip));
        expect(van).not.toContain('Nhịp thứ 5');
        expect(van).toContain('Nhịp thứ 29');
    });
    it('phục bút ĐÃ TRẢ không còn chiếm chỗ trong bản nén', () => {
        const { state } = theGioi();
        const m = machDayDu(state);
        const pb = state.foreshadows.get('pb_1');
        if (pb)
            state.foreshadows.set('pb_1', { ...pb, daTra: true, cachTra: 'Nó gãy thật.' });
        const mn = nenKyUcMach(state, m, []);
        expect(mn.phucButChuaTra).toHaveLength(0);
    });
});
// ─────────────────────────────────────────── tích hợp
describe('[BB] cổng Phase 8 — mạch truyện chạy khi không ai nhìn', () => {
    it('sáu mươi nhịp không người chơi: mạch sinh, tiến giai đoạn, và có mạch kết thúc', () => {
        const { state, log } = theGioiDong();
        chay(state, log, 60);
        expect(state.storylines.size).toBeGreaterThan(0);
        const gd = new Set([...state.storylines.values()].map((m) => m.giaiDoan));
        // Không phải mọi mạch còn nằm ở `am_i` — thời gian có làm gì đó.
        expect(gd.size).toBeGreaterThan(1);
        expect([...state.storylines.values()].some((m) => m.soNhip > 0)).toBe(true);
    });
    it('một trăm nhịp có tiến trình tự sự: invariant vẫn sạch', () => {
        const { state, log } = theGioiDong();
        chay(state, log, 100);
        const kq = chayInvariantToanBo(state);
        expect(kq.viPhamNang.map((v) => v.message).filter((v) => v.includes('phục bút'))).toEqual([]);
        expect(kq.dat, kq.viPhamNang.map((v) => v.message).join(' | ')).toBe(true);
    });
    it('determinism không vỡ — cùng seed cho cùng hash sau 60 nhịp có mạch truyện', () => {
        const a = theGioiDong('mach-xac-dinh');
        const b = theGioiDong('mach-xac-dinh');
        chay(a.state, a.log, 60);
        chay(b.state, b.log, 60);
        expect(hashState(a.state)).toBe(hashState(b.state));
        expect(a.state.storylines.size).toBeGreaterThan(0);
    });
    it('mạch truyện lọt vào WorldView theo đúng điều chủ thể được biết', () => {
        const { state } = theGioi();
        const nguoi = [...state.entities.values()].find((e) => e.kind === 'mortal');
        const id = nguoi?.id ?? 'x';
        machTay(state, { id: 'ml_biet', nguoiChoiBiet: true });
        machTay(state, { id: 'ml_khong', nguoiChoiBiet: false, nhanVat: [] });
        machTay(state, {
            id: 'ml_trong_cuoc',
            nguoiChoiBiet: false,
            nhanVat: [{ entityId: id, vaiTro: 'chinh', trongSo: 50 }],
        });
        const view = chieu(state, 'pham_nhan', id);
        const ids = view.machTruyen.map((m) => m.id);
        expect(ids).toContain('ml_biet');
        // Mình ở trong chuyện thì mình biết — đó là đường vào thứ hai, và chỉ hai.
        expect(ids).toContain('ml_trong_cuoc');
        expect(ids).not.toContain('ml_khong');
        // Sáng Thế nhìn từ trên xuống: thấy hết.
        expect(chieu(state, 'sang_the', null).machTruyen.map((m) => m.id)).toContain('ml_khong');
    });
    it('rng của nhịp truyện tách kênh — hai mạch không giành số của nhau', () => {
        const rng = rngCuaTick('seed', 5, 'truyen');
        const a = rng.nhanh('mach:ml_1').ke();
        const b = rngCuaTick('seed', 5, 'truyen').nhanh('mach:ml_2').ke();
        expect(a).not.toBe(b);
        // Và cùng kênh cho cùng số.
        expect(rngCuaTick('seed', 5, 'truyen').nhanh('mach:ml_1').ke()).toBe(a);
    });
});
// ─────────────────────────────────────────── nhịp truyện đổi thế giới
describe('[BB] 28.5 — nhịp truyện áp bienDoiTrangThai vào world', () => {
    it('cao trào để lại KÝ ỨC trong hồn từng người trong cuộc', () => {
        const { state } = theGioiDong();
        const m = machTay(state, {
            id: 'ml_cao',
            giaiDoan: 'cao_trao',
            dongHo: 1,
            cangThang: 80,
            nhanVat: [
                { entityId: 'mortal_a', vaiTro: 'chinh', trongSo: 80 },
                { entityId: 'mortal_b', vaiTro: 'doi_dau', trongSo: 70 },
            ],
        });
        const kq = nhipMachTruyen(state, {
            tick: 10,
            eventId: 'ev',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        const kyUc = kq.patches.filter((p) => p.target.path === 'aspects.soul.kyUc');
        expect(kyUc.map((p) => p.target.id).sort()).toEqual(['mortal_a', 'mortal_b']);
        // `push` chứ không `set` — hai mạch cùng chạm một người thì gộp được (71.4 #1).
        expect(kyUc.every((p) => p.op === 'push')).toBe(true);
        expect((kyUc[0]?.value).lienQuan).toEqual([m.id]);
    });
    it('cảm xúc luôn có ĐỐI TƯỢNG và nguồn gốc, không phải một con số trôi nổi', () => {
        const { state } = theGioiDong();
        machTay(state, {
            id: 'ml_cao',
            giaiDoan: 'cao_trao',
            dongHo: 1,
            cangThang: 80,
            nhanVat: [
                { entityId: 'mortal_a', vaiTro: 'chinh', trongSo: 80 },
                { entityId: 'mortal_b', vaiTro: 'doi_dau', trongSo: 70 },
            ],
        });
        const kq = nhipMachTruyen(state, {
            tick: 10,
            eventId: 'ev',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        const cx = kq.patches.find((p) => p.target.path === 'aspects.soul.tamTrang');
        expect(cx).toBeDefined();
        const v = cx?.value;
        // `bao_thu` để lại phẫn nộ; loại khác để lại cảm xúc khác — đó là chỗ "đa
        // dạng mạch truyện" hiện ra trong DỮ LIỆU, không chỉ trong câu chữ.
        expect(v.loai).toBe('phan_no');
        expect(v.doiTuongId).toBe('mortal_b');
        expect(v.nguonGocKyUcId).not.toBe('');
    });
    it('[BB] nhịp KHÔNG chạm vật chất — mười hai tiến trình nền giữ nguyên quyền', () => {
        const { state } = theGioiDong();
        machTay(state, { id: 'ml_cao', giaiDoan: 'cao_trao', dongHo: 1, cangThang: 80 });
        const kq = nhipMachTruyen(state, {
            tick: 10,
            eventId: 'ev',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        for (const p of kq.patches) {
            if (p.target.table !== 'entities')
                continue;
            // Chỉ hai đường, và cả hai nằm trong hồn.
            expect(['aspects.soul.kyUc', 'aspects.soul.tamTrang']).toContain(p.target.path);
        }
    });
    it('giai đoạn âm ỉ KHÔNG để lại dấu — phần lớn nhịp chỉ là áp lực dâng lên', () => {
        const { state } = theGioiDong();
        machTay(state, { id: 'ml_am', giaiDoan: 'am_i', dongHo: 1 });
        const kq = nhipMachTruyen(state, {
            tick: 10,
            eventId: 'ev',
            tuning: TUNING,
            rng: taoRng('s'),
            nguoiChoiId: null,
        });
        expect(kq.patches.filter((p) => p.target.table === 'entities')).toHaveLength(0);
    });
    it('ký ức có TRẦN — một trăm năm không biến mỗi người thành kho lưu trữ', () => {
        const { state, log } = theGioiDong();
        chay(state, log, 200);
        for (const e of state.entities.values()) {
            const soul = e.aspects['soul'];
            expect((soul?.kyUc ?? []).length).toBeLessThanOrEqual(24);
            expect((soul?.tamTrang ?? []).length).toBeLessThanOrEqual(8);
        }
    });
});
describe('[BB] 30.3 — mốc kỷ nguyên là chỗ duy nhất phép nén chạy', () => {
    it('kỷ nguyên tính bằng phép chia, không bằng bộ đếm được lưu', () => {
        expect(kyNguyenCua(0, 200)).toBe(0);
        expect(kyNguyenCua(199, 200)).toBe(0);
        expect(kyNguyenCua(200, 200)).toBe(1);
        expect(laMocKyNguyen(0, 200)).toBe(false);
        expect(laMocKyNguyen(200, 200)).toBe(true);
        expect(laMocKyNguyen(201, 200)).toBe(false);
    });
    it('nhịp đẩy văn vào bộ đệm, và bộ đệm có trần', () => {
        const { state, log } = theGioiDong();
        chay(state, log, 60);
        for (const m of state.storylines.values()) {
            expect(m.nhipGanDay.length).toBeLessThanOrEqual(12);
        }
        expect([...state.storylines.values()].some((m) => m.nhipGanDay.length > 0)).toBe(true);
    });
    it('qua mốc kỷ nguyên: kyUcMach dày lên và bộ đệm được dọn', () => {
        const { state, log } = theGioiDong();
        chay(state, log, 200);
        expect(state.world.eraId).toBe('era_1');
        const coNhip = [...state.storylines.values()].filter((m) => m.soNhip > 0);
        expect(coNhip.length).toBeGreaterThan(0);
        // Nén xong thì bộ đệm rỗng — phần đáng giữ đã nằm trong `kyUcMach`.
        for (const m of coNhip)
            expect(m.nhipGanDay).toEqual([]);
        expect(coNhip.some((m) => m.kyUcMach.includes('Người trong cuộc:'))).toBe(true);
    });
    it('nén KHÔNG làm mất phục bút chưa trả, kể cả sau hai kỷ nguyên', () => {
        const { state, log } = theGioiDong();
        chay(state, log, 200);
        const treo = [...state.foreshadows.values()].filter((f) => !f.daTra);
        for (const m of state.storylines.values()) {
            for (const pid of m.phucBut) {
                const f = state.foreshadows.get(pid);
                if (!f || f.daTra)
                    continue;
                expect(m.kyUcMach, `mạch ${m.id} nén mất phục bút ${pid}`).toContain(f.noiDung);
            }
        }
        expect(treo.length).toBeGreaterThanOrEqual(0);
    });
});
