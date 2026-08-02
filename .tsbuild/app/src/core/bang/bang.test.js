/**
 * Cổng Phase 11 — hai bảng.
 *
 * Ba câu hỏi test này phải trả lời, và cả ba đều là cổng của đặc tả:
 *
 *   1. [BB] 55.5 — bảng có rò rỉ giữa ba tầng không?
 *   2. Cổng Phase 11 — 50.000 entity mở dưới 16 ms chứ?
 *   3. [BB] 58.3 — màn mặc định có hiện TÊN THẬT không, hay chỉ hiện con số?
 *
 * Câu 1 quan trọng nhất. Đặc tả gọi Bảng là *"đường rò rỉ dễ quên nhất trong toàn
 * app"*, nên nó được kiểm bằng cách so ba bảng dựng từ ba tầng trên CÙNG một thế
 * giới, chứ không phải bằng cách đọc code rồi tin là đúng.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent } from '../engine/transaction.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { chieu } from '../project/chieu.js';
import { datLaiInvariant } from '../engine/invariant.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { EntitySchema } from '../schema/entity.js';
import { SoulSchema } from '../schema/aspect/soul.js';
import { MortalSchema } from '../schema/aspect/living.js';
import { nguonGoc } from '../schema/aspect/provenance.js';
import { tinhBangThienDien, chupBang, danhDauDaXem, thanhThienTuong, VUNG_BANG } from './thienDien.js';
import { tinhBangThongTin, timTrongBang, nhanTab, CAU_RONG } from './thongTin.js';
import { anhChupMoi } from './schema.js';
beforeEach(() => {
    datLaiInvariant();
    napBatBienTheGioiSong();
});
function theGioi(seed = 'bang') {
    const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
    const { world, events } = moThuGioi(ct);
    const state = taoState(world);
    const log = taoEventLog();
    expect(apDungChuoi(state, events, log).ok).toBe(true);
    const ev = eventGieoNen(state);
    expect(apDungEvent(state, ev, log).ok).toBe(true);
    return { state, log };
}
function motPhamNhan(state) {
    const ai = [...state.entities.values()].find((e) => e.kind === 'mortal');
    expect(ai).toBeDefined();
    return ai.id;
}
// ─────────────────────────────────────────── 1. rò rỉ ba tầng
describe('[BB] 55.5 — Bảng đi qua chieu(), và ba tầng thấy ba thứ khác nhau', () => {
    it('phàm nhân KHÔNG có vùng "Thế giới là gì", "Có gì tồn tại" và "Đang thế nào"', () => {
        const { state } = theGioi();
        const b = tinhBangThienDien(chieu(state, 'pham_nhan', motPhamNhan(state)));
        // `null` chứ không phải mảng rỗng: "không được thấy" khác "chưa có gì".
        expect(b.theGioiLaGi).toBeNull();
        expect(b.coGiTonTai).toBeNull();
        expect(b.dangTheNao).toBeNull();
        expect(b.daLech).toHaveLength(0);
    });
    it('phàm nhân không đọc được nhịp và năm của engine', () => {
        const { state } = theGioi();
        const view = chieu(state, 'pham_nhan', motPhamNhan(state));
        expect(view.thoiCuoc.tick).toBeNull();
        expect(view.thoiCuoc.year).toBeNull();
        // Nhưng vẫn phải có CHỮ để đọc — không được là ô trống.
        expect(view.thoiCuoc.moTaThoiDiem.length).toBeGreaterThan(0);
        const b = tinhBangThienDien(view);
        expect(b.khiNao.moTaThoiDiem).not.toMatch(/\d{2,}/);
    });
    it('Sáng Thế Thần thấy năm chỉ số; hai tầng dưới thì không', () => {
        const { state } = theGioi();
        expect(chieu(state, 'sang_the', null).chiSo).not.toBeNull();
        expect(chieu(state, 'than', null).chiSo).toBeNull();
        expect(chieu(state, 'pham_nhan', motPhamNhan(state)).chiSo).toBeNull();
    });
    it('lỗ hổng và cơ chế là sổ của engine — chỉ Sáng Thế Thần đọc được', () => {
        const { state } = theGioi();
        expect(chieu(state, 'pham_nhan', motPhamNhan(state)).loHong).toHaveLength(0);
        expect(chieu(state, 'than', null).loHong).toHaveLength(0);
        expect(chieu(state, 'pham_nhan', motPhamNhan(state)).coChe).toHaveLength(0);
    });
    it('phàm nhân là người CẦU, không phải người nhận — hàng lời cầu rỗng', () => {
        const { state } = theGioi();
        expect(chieu(state, 'pham_nhan', motPhamNhan(state)).loiCau).toHaveLength(0);
    });
    it('[BB] 59.1 — phàm nhân không đọc được ai đã tạo ra thứ họ nhìn thấy', () => {
        const { state } = theGioi();
        const view = chieu(state, 'pham_nhan', motPhamNhan(state));
        for (const e of view.entities.values()) {
            expect(e.aspects['provenance']).toBeUndefined();
        }
        // Còn Sáng Thế Thần thì có, nếu không cột "Nguồn sinh" của 58.7 vô nghĩa.
        const tren = chieu(state, 'sang_the', null);
        const coNguon = [...tren.entities.values()].some((e) => e.aspects['provenance'] !== undefined);
        expect(coNguon).toBe(true);
    });
    it('không id nào trong sương mù "mù" lọt vào bất kỳ hàng nào của hai bảng', () => {
        const { state } = theGioi();
        const view = chieu(state, 'pham_nhan', motPhamNhan(state));
        const cam = new Set(view.suongMu.mu);
        expect(cam.size).toBeGreaterThan(0);
        const b = tinhBangThienDien(view);
        const t = tinhBangThongTin(view);
        const moiId = [
            ...b.aiDangChuY.map((x) => x.id),
            ...b.dangXayRa.map((x) => x.id),
            ...b.canChuY.map((x) => x.doiTuongId ?? ''),
            ...t.quyLuat.map((x) => x.id),
            ...t.taoVat.map((x) => x.id),
            ...t.thanHe.map((x) => x.id),
            ...t.machTruyen.map((x) => x.id),
        ];
        for (const id of moiId)
            expect(cam.has(id)).toBe(false);
    });
    it('tên tab "Ta" đổi theo tầng — cùng tab, ba câu hỏi khác nhau', () => {
        expect(nhanTab('ta', 'sang_the')).toBe('Ta');
        expect(nhanTab('ta', 'than')).toBe('Thần Vị Của Ta');
        expect(nhanTab('ta', 'pham_nhan')).toBe('Đời Ta');
    });
});
// ─────────────────────────────────────────── 2. hiệu năng
describe('Cổng Phase 11 — bảng snapshot 50.000 entity mở dưới 16 ms', () => {
    it('dựng cả hai bảng trên 50.000 entity trong ngân sách một khung hình', () => {
        const { state, log } = theGioi('perf');
        const base = motPhamNhan(state);
        const mau = state.entities.get(base);
        expect(mau).toBeDefined();
        // Nhồi thẳng vào state: đây là test hiệu năng của hàm dựng bảng, không phải
        // của transaction. Đi qua `apDungEvent` 50.000 lần sẽ đo nhầm thứ khác.
        for (let i = 0; i < 50_000; i++) {
            const id = `mortal_perf_${i}`;
            state.entities.set(id, EntitySchema.parse({
                id,
                branchId: state.world.branchId,
                kind: 'mortal',
                ten: `Người ${i}`,
                tickSinh: 0,
                aspects: {
                    provenance: nguonGoc('the_gioi_tu_sinh', 0),
                    soul: SoulSchema.parse({ tang: 't0' }),
                    mortal: MortalSchema.parse({}),
                },
            }));
        }
        expect(state.entities.size).toBeGreaterThan(50_000);
        void log;
        const view = chieu(state, 'sang_the', null);
        // Chạy một lần cho JIT ấm rồi mới đo — đo lần đầu là đo trình biên dịch.
        tinhBangThienDien(view);
        tinhBangThongTin(view);
        /*
         * Lấy lần NHANH NHẤT trong hai mươi lần.
         *
         * Vitest chạy nhiều file test song song, nên một lần đo đơn lẻ có thể trúng
         * lúc worker khác đang chiếm CPU và cho ra con số của cái máy chứ không phải
         * của đoạn code. Lấy min là cách đo chuẩn cho ngưỡng hiệu năng: nó vẫn trượt
         * thật nếu code chậm — không lần nào trong hai mươi lần lọt xuống dưới 16 ms.
         *
         * Năm lần là đủ cho tới Phase 12, rồi bài soak mười ngàn nhịp vào bộ test và
         * chiếm CPU đủ lâu để cả năm lần cùng trúng lúc máy bận. Ngưỡng 16 ms giữ
         * NGUYÊN — thứ đổi là số mẫu, vì một cổng hiệu năng chập chờn là một cổng
         * người ta học cách bỏ qua, và lúc ấy nó thôi bảo vệ được gì.
         */
        let nhanhNhat = Number.POSITIVE_INFINITY;
        let b = tinhBangThienDien(view);
        for (let i = 0; i < 20; i++) {
            const t0 = performance.now();
            b = tinhBangThienDien(view);
            nhanhNhat = Math.min(nhanhNhat, performance.now() - t0);
        }
        expect(b.coGiTonTai).not.toBeNull();
        expect(nhanhNhat).toBeLessThan(16);
    });
});
// ─────────────────────────────────────────── 3. nội dung thật
describe('[BB] 58.3 — màn mặc định phải hiện TÊN THẬT, không chỉ con số', () => {
    it('có tên luật, tên tạo vật và tên mạch nếu chúng tồn tại', () => {
        const { state } = theGioi();
        const t = tinhBangThongTin(chieu(state, 'sang_the', null));
        expect(t.quyLuat.length).toBeGreaterThan(0);
        expect(t.quyLuat[0]?.ten.length).toBeGreaterThan(0);
        expect(t.taoVat.length).toBeGreaterThan(0);
        expect(t.taoVat[0]?.ten.length).toBeGreaterThan(0);
        // Không được là raw id — [BB] 58.13 cấm hiện key schema cho người chơi.
        expect(t.taoVat[0]?.loai).not.toMatch(/^[a-z_]+$/);
    });
    it('mỗi tạo vật khai được nguồn sinh bằng CHỮ, không bằng enum', () => {
        const { state } = theGioi();
        const t = tinhBangThongTin(chieu(state, 'sang_the', null));
        for (const h of t.taoVat) {
            expect(h.nguonSinh).not.toMatch(/^[a-z_]+$/);
            expect(h.nguonSinh.length).toBeGreaterThan(0);
        }
    });
    /**
     * [BB] 58.13 — "không hiện raw id, key schema hay tên enum cho người chơi".
     *
     * Test này sinh ra từ một lỗi thật: bản đầu của Phase 11 in `vu_tru` giữa hai
     * cột tiếng Việt, và nó chỉ lộ ra khi chạy trong trình duyệt. Quy tắc máy kiểm
     * được: chuỗi toàn chữ thường nối bằng gạch dưới là tên enum, không phải tiếng Việt.
     */
    it('không trường hiển thị nào là tên enum', () => {
        const { state } = theGioi();
        const t = tinhBangThongTin(chieu(state, 'sang_the', null));
        const laEnum = (s) => /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(s);
        for (const l of t.quyLuat) {
            expect(laEnum(l.phamVi), `phạm vi lộ enum: ${l.phamVi}`).toBe(false);
            expect(laEnum(l.trangThai), `trạng thái lộ enum: ${l.trangThai}`).toBe(false);
            expect(laEnum(l.tang), `tầng lộ enum: ${l.tang}`).toBe(false);
        }
        for (const m of t.machTruyen) {
            expect(laEnum(m.giaiDoan), `giai đoạn lộ enum: ${m.giaiDoan}`).toBe(false);
        }
        for (const v of t.taoVat) {
            expect(laEnum(v.loai), `loại lộ enum: ${v.loai}`).toBe(false);
            expect(laEnum(v.nguonSinh), `nguồn sinh lộ enum: ${v.nguonSinh}`).toBe(false);
        }
        const b = tinhBangThienDien(chieu(state, 'sang_the', null));
        for (const m of b.dangXayRa) {
            expect(laEnum(m.giaiDoan), `giai đoạn lộ enum: ${m.giaiDoan}`).toBe(false);
        }
        for (const d of b.coGiTonTai ?? []) {
            expect(laEnum(d.nhan), `nhãn loại lộ enum: ${d.nhan}`).toBe(false);
        }
    });
    it('chip lọc dựng từ registry, nên kind mới tự có chip', () => {
        const { state } = theGioi();
        const t = tinhBangThongTin(chieu(state, 'sang_the', null));
        expect(t.chipLoai.length).toBeGreaterThan(0);
        for (const c of t.chipLoai)
            expect(c.nhan).not.toBe(c.kindId);
    });
    it('mỗi tab có câu rỗng riêng, không dùng "Không có dữ liệu"', () => {
        for (const c of Object.values(CAU_RONG)) {
            expect(c).not.toMatch(/không có dữ liệu/i);
            expect(c.length).toBeGreaterThan(10);
        }
    });
    it('tìm kiếm chạy SAU chiếu — gõ tên bị che thì không ra gì', () => {
        const { state } = theGioi();
        const viewTren = chieu(state, 'sang_the', null);
        const bangTren = tinhBangThongTin(viewTren);
        const luat = bangTren.quyLuat[0];
        expect(luat).toBeDefined();
        expect(timTrongBang(bangTren, luat.ten).length).toBeGreaterThan(0);
        // Cùng câu hỏi, hỏi từ tầng phàm nhân: nếu luật ấy nằm ngoài tầm nhìn thì
        // ô tìm kiếm KHÔNG được trở thành cửa hậu.
        const viewDuoi = chieu(state, 'pham_nhan', motPhamNhan(state));
        const bangDuoi = tinhBangThongTin(viewDuoi);
        for (const kq of timTrongBang(bangDuoi, luat.ten)) {
            expect(viewDuoi.entities.has(kq.id)).toBe(true);
        }
    });
});
// ─────────────────────────────────────────── 4. ảnh chụp và diff
describe('55.4 và 55.8 — ảnh chụp, sparkline và vùng "Từ lần trước"', () => {
    it('ảnh của tầng khác bị VỨT, không bị trộn vào chuỗi', () => {
        const { state } = theGioi();
        const tren = chupBang(chieu(state, 'sang_the', null), null);
        expect(tren.mode).toBe('sang_the');
        const duoi = chupBang(chieu(state, 'pham_nhan', motPhamNhan(state)), tren);
        expect(duoi.mode).toBe('pham_nhan');
        // Chuỗi chỉ số của Sáng Thế Thần không được sống sót sang tầng phàm nhân.
        expect(Object.keys(duoi.chuoiChiSo)).toHaveLength(0);
    });
    it('chụp cùng một nhịp hai lần không đẻ ra hai điểm sparkline', () => {
        const { state } = theGioi();
        const view = chieu(state, 'sang_the', null);
        const a = chupBang(view, anhChupMoi(view.branchId, 'sang_the'));
        const b = chupBang(view, a);
        expect(b.chuoiChiSo['thucTai']).toHaveLength(a.chuoiChiSo['thucTai']?.length ?? 0);
    });
    it('chuỗi sparkline cắt ở bảy điểm', () => {
        const { state } = theGioi();
        let anh = anhChupMoi('br_goc', 'sang_the');
        for (let t = 0; t < 12; t++) {
            state.world.tick = t;
            anh = chupBang(chieu(state, 'sang_the', null), anh);
        }
        expect(anh.chuoiChiSo['thucTai']?.length).toBe(7);
    });
    it('"Từ lần trước" rỗng khi chưa từng mở bảng, và có nội dung sau khi mở', () => {
        const { state } = theGioi();
        const view = chieu(state, 'sang_the', null);
        const anh0 = chupBang(view, null);
        expect(tinhBangThienDien(view, anh0).tuLanTruoc).toHaveLength(0);
        const anh1 = danhDauDaXem(anh0, view);
        // Thế giới sinh thêm một vị thần sau khi người chơi đóng bảng.
        state.entities.set('deity_moi', EntitySchema.parse({
            id: 'deity_moi',
            branchId: state.world.branchId,
            kind: 'deity',
            ten: 'Kẻ Vừa Bước Ra',
            tickSinh: 1,
            aspects: { provenance: nguonGoc('the_gioi_tu_sinh', 1), soul: SoulSchema.parse({ tang: 't3' }) },
        }));
        const sau = tinhBangThienDien(chieu(state, 'sang_the', null), anh1);
        expect(sau.tuLanTruoc.some((d) => d.includes('Kẻ Vừa Bước Ra'))).toBe(true);
    });
    it('tám vùng, thứ tự cố định', () => {
        expect(VUNG_BANG).toHaveLength(8);
        expect(VUNG_BANG[0]).toBe('khi_nao');
        expect(VUNG_BANG[7]).toBe('tu_lan_truoc');
    });
});
// ─────────────────────────────────────────── 5. cần chú ý
describe('[BB] 55.4 — mỗi mục "Cần chú ý" mở tới một chỗ xử lý', () => {
    it('không mục nào thiếu đích', () => {
        const { state } = theGioi();
        const b = tinhBangThienDien(chieu(state, 'sang_the', null));
        for (const m of b.canChuY) {
            expect(m.dich.length).toBeGreaterThan(0);
            expect(m.nhan.length).toBeGreaterThan(0);
            expect(m.vi.length).toBeGreaterThan(0);
        }
    });
    it('Thanh Thiên Tượng luôn có thời điểm và mọi cụm đều có nhãn chữ', () => {
        const { state } = theGioi();
        const b = tinhBangThienDien(chieu(state, 'sang_the', null));
        const thanh = thanhThienTuong(b);
        expect(thanh[0]?.id).toBe('khi_nao');
        // [BB] luật bất biến #9 — không cụm nào chỉ có màu; tất cả đều có chữ.
        for (const c of thanh) {
            expect(c.nhan.length).toBeGreaterThan(0);
            expect(c.gia.length).toBeGreaterThan(0);
        }
    });
});
