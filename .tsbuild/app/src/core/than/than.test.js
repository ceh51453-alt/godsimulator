/**
 * Cổng Phase 6 — Tầng Thần.
 *
 * Bốn dòng cổng của Phần 75:
 *   - playtest 30 phút không dùng Sáng Thế;
 *   - hoàn thành ba mục tiêu không liên quan tranh domain;
 *   - thần NPC tiếp tục sống khi vắng;
 *   - không mana/cooldown giả;
 *   - CoreSelf không bị tick âm thầm sửa.
 *
 * "Playtest 30 phút" không kiểm được bằng unit test, nên nó được dịch thành thứ
 * kiểm được: **chơi hết một vòng tầng Thần bằng chính API mà UI gọi**, không
 * chạm Sáng Thế lần nào, và thế giới vẫn hợp lệ ở cuối.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog, hashState } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { chayInvariantToanBo, datLaiInvariant } from '../engine/invariant.js';
import { motTick } from '../engine/tick.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { napBatBienTangThan } from '../world/batBienThan.js';
import { chayTienTrinhNen } from '../world/process/scheduler.js';
import { moiTienTrinh } from '../world/process/index.js';
import { TUNING_MAC_DINH } from '../tuning/schema.js';
import { rngCuaTick } from '../engine/rng.js';
import { doApLuc, dapDiHoa, banNgaTu } from './diHoa.js';
import { giaiQuyKet, doKhopTinhCach, raSoatDomain } from './quyKet.js';
import { quetBeTac, sinhLoiCau, traLoiCau, loiCauCho, NGUONG_KHA_THI } from './cauNguyen.js';
import { KENH_DUNG_SAN, kenhKhaDung, kenhTheoId } from './kenh.js';
import { trangThaiSuyRa, hinhHienTai, khoangCachBanTinh } from '../schema/aspect/thanVi.js';
import { giaoUocCanBang, GiaoUocSchema, HAU_QUA_TRA_LOI } from '../schema/than.js';
import { WORLD_PROCESS_IDS_THAN } from '../registry/misc.js';
const TUNING = TUNING_MAC_DINH;
const THAN = 'deity_1';
beforeEach(() => {
    datLaiInvariant();
    napBatBienTheGioiSong();
    napBatBienTangThan();
});
function theGioi(seed = 'phase6') {
    const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
    const { world, events } = moThuGioi(ct);
    const state = taoState(world);
    const log = taoEventLog();
    expect(apDungChuoi(state, events, log).ok).toBe(true);
    const ev = eventGieoNen(state);
    expect(ev).not.toBeNull();
    expect(apDungEvent(state, ev, log).ok).toBe(true);
    return { state, log };
}
/** Nhập vai vị thần — đúng cách store làm, không sửa state trực tiếp. */
function nhapThan(state, log, thanId = THAN) {
    const ev = taoEvent({
        id: `ev_nhap_${thanId}`,
        branchId: state.world.branchId,
        tick: state.world.tick,
        loai: 'chuyen_tang',
        actorIds: [],
        targetIds: [thanId],
        causeEventIds: [],
        locationId: null,
        patches: [
            {
                op: 'set',
                target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
                value: 'than',
                sourceEventId: `ev_nhap_${thanId}`,
            },
            {
                op: 'set',
                target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
                value: thanId,
                sourceEventId: `ev_nhap_${thanId}`,
            },
        ],
        visibility: 'engine',
        source: 'player',
        payload: {},
    });
    expect(apDungEvent(state, ev, log).ok).toBe(true);
}
function chay(state, log, soTick) {
    const loi = [];
    for (let i = 0; i < soTick; i++) {
        const r = motTick(state, { tuning: TUNING, tienTrinhNen: chayTienTrinhNen });
        for (const ev of r.events) {
            const ok = apDungEvent(state, ev, log);
            expect(ok.ok, ok.ok ? '' : JSON.stringify(ok.errors)).toBe(true);
        }
        for (const c of r.chanDoan)
            if (c.muc === 'loi')
                loi.push(`${c.ma}: ${c.thongDiep}`);
    }
    return loi;
}
/**
 * Ép một vùng vào nạn đói THẬT.
 *
 * Không đủ nếu chỉ gán `thieuHut`: `production_consumption` chạy mỗi tick và
 * tính lại con số ấy từ kho và đất, nên một phép gán sẽ bị xóa ở tick kế tiếp.
 * Muốn đói thì phải làm cho không còn gì để ăn và không còn gì để trồng.
 */
function epDoi(state, ...noiIds) {
    for (const id of noiIds) {
        const e = state.entities.get(id);
        e.aspects['kinh_te'] = {
            ...e.aspects['kinh_te'],
            kho: { luongThuc: 0, vatLieu: 0 },
            thieuHut: 1,
        };
        e.aspects['sinh_thai'] = {
            ...e.aspects['sinh_thai'],
            taiNguyen: { rung: 0, thu: 0, ca: 0, dat: 0 },
        };
    }
}
const banNga = (s, id = THAN) => s.entities.get(id)?.aspects['ban_nga'];
// ─────────────────────────────────────────── bốn lớp bản ngã
describe('bốn lớp bản ngã — Phần 69.1', () => {
    it('thế giới mới gieo đủ bản ngã cho mọi vị thần', () => {
        const { state } = theGioi();
        const bn = banNga(state);
        expect(bn).toBeDefined();
        expect(bn.coreSelf).toBeDefined();
        expect(bn.followerImage).toBeDefined();
        expect(bn.currentManifestation).toBeDefined();
        // Lõi phải khớp `soul.banTinh` — hai chỗ, một sự thật.
        const soul = state.entities.get(THAN)?.aspects['soul'];
        expect(bn.coreSelf.tuBi_tanNhan).toBe(soul.banTinh['tuBi_tanNhan']);
    });
    it('hình hiện tại nghiêng về hình ảnh tín đồ khi thần ít hiển thánh', () => {
        const loi = { tuBi_tanNhan: 80 };
        const anh = { tuBi_tanNhan: -80 };
        const anThan = hinhHienTai(loi, anh, 0);
        const ro = hinhHienTai(loi, anh, 100);
        // Thần không hiện thân thì thế giới chỉ thấy phần tín đồ dựng nên.
        expect(anThan['tuBi_tanNhan']).toBe(-80);
        expect(ro['tuBi_tanNhan']).toBe(80);
    });
    it('đo áp lực chỉ ra trục lệch nặng nhất và nét bị đè', () => {
        const bn = banNgaTu({ tuBi_tanNhan: 60, kieuNgao_khiemNhuong: 0 }, { banTinhTinDoTin: { tuBi_tanNhan: -70 }, hienThanh: 20 });
        const ap = doApLuc(bn);
        expect(ap.trucNang).toBe('tuBi_tanNhan');
        expect(ap.demandedTraits).toContain('tuBi_tanNhan');
        expect(ap.distortion).toBeGreaterThan(0);
    });
    it('[BB] tick KHÔNG bao giờ sửa coreSelf — chỉ mở tình huống', () => {
        const { state, log } = theGioi('di-hoa');
        const truoc = { ...banNga(state).coreSelf };
        // Ép thế giới vào cảnh khổ để tín đồ nặn ra một vị thần khác hẳn.
        epDoi(state, 'place_a', 'place_b');
        chay(state, log, 200);
        const sau = banNga(state);
        // Hình ảnh trôi rất xa...
        expect(khoangCachBanTinh(sau.coreSelf, sau.followerImage)).toBeGreaterThan(0);
        // ...nhưng lõi thì KHÔNG nhúc nhích, vì không ai chọn gì cả.
        expect(sau.coreSelf).toEqual(truoc);
        expect(sau.lichSuLoi).toEqual([]);
    });
    it('[BB] lõi CHỈ đổi qua Event, và mỗi lần đổi đều ghi eventId', () => {
        const { state } = theGioi('chap-nhan');
        const than = state.entities.get(THAN);
        const bn = banNga(state);
        const r = dapDiHoa(than, { ...bn, followerImage: { ...bn.followerImage, tuBi_tanNhan: 90 } }, 'tuBi_tanNhan', 'chap_nhan', {
            eventId: 'ev_test',
            tick: 10,
            tuning: TUNING,
            rng: rngCuaTick('s', 1, 'x'),
        });
        expect(r.loaiEvent).toBe('than_chap_nhan_di_hoa');
        // Sửa `coreSelf` VÀ `soul.banTinh` VÀ ghi lịch sử — ba thứ đi cùng nhau.
        const paths = r.patches.map((p) => p.target.path);
        expect(paths).toContain('aspects.ban_nga.coreSelf.tuBi_tanNhan');
        expect(paths).toContain('aspects.soul.banTinh.tuBi_tanNhan');
        expect(paths).toContain('aspects.ban_nga.lichSuLoi');
        const ls = r.patches.find((p) => p.target.path === 'aspects.ban_nga.lichSuLoi');
        expect((ls?.value).eventId).toBe('ev_test');
    });
    it('chống lại thì lõi giữ nguyên, cái giá là giáo phái vỡ', () => {
        const { state } = theGioi('chong-lai');
        const than = state.entities.get(THAN);
        const r = dapDiHoa(than, banNga(state), 'tuBi_tanNhan', 'chong_lai', {
            eventId: 'ev',
            tick: 1,
            tuning: TUNING,
            rng: rngCuaTick('s', 1, 'x'),
        });
        expect(r.patches.some((p) => p.target.path.includes('coreSelf'))).toBe(false);
        expect(r.heQua.lyGiao).toBe(true);
        expect(r.heQua.matQuyKet).toBeGreaterThan(0);
    });
    it('bất biến BẮT được lõi bị sửa lén', () => {
        const { state } = theGioi('len');
        const e = state.entities.get(THAN);
        const bn = e.aspects['ban_nga'];
        // Sửa thẳng lõi mà không đụng `soul.banTinh` và không ghi lịch sử.
        e.aspects['ban_nga'] = { ...bn, coreSelf: { ...bn.coreSelf, tuBi_tanNhan: 99 } };
        const inv = chayInvariantToanBo(state);
        expect(inv.dat).toBe(false);
        expect(inv.viPhamNang.some((x) => x.code === 'CORESELF_CO_GIAI_THICH')).toBe(true);
    });
});
// ─────────────────────────────────────────── không tài nguyên meta
describe('[BB] cổng Phase 6 — không mana, không cooldown', () => {
    it('không aspect nào của thế giới mới mang tài nguyên meta', () => {
        const { state, log } = theGioi('mana');
        chay(state, log, 60);
        const inv = chayInvariantToanBo(state);
        expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);
    });
    it('bất biến BẮT được ai đó thêm thanh mana', () => {
        const { state } = theGioi('mana2');
        const e = state.entities.get(THAN);
        e.aspects['domain'] = { ...e.aspects['domain'], mana: 100 };
        const inv = chayInvariantToanBo(state);
        expect(inv.dat).toBe(false);
        expect(inv.viPhamNang.some((x) => x.code === 'KHONG_TAI_NGUYEN_META')).toBe(true);
    });
    it('mười kênh can thiệp trả giá bằng HẬU QUẢ, không bằng bộ đếm', () => {
        expect(KENH_DUNG_SAN).toHaveLength(10);
        for (const k of KENH_DUNG_SAN) {
            const co = k.gia.deHieuSai > 0 ||
                k.gia.loDienThan > 0 ||
                k.gia.tangPhuThuoc > 0 ||
                k.gia.tuRangBuoc ||
                k.gia.trungGianCoYChi ||
                k.gia.canLuatNen.length > 0;
            expect(co, `kênh '${k.id}' không có giá tự nhiên nào`).toBe(true);
            // Không kênh nào có trường kiểu "chi phí" — giá là hệ quả, không phải số trừ.
            expect(Object.keys(k.gia)).not.toContain('chiPhi');
        }
        // Giao ước và ngoại giao là hai kênh trói ngược lại chính vị thần.
        expect(kenhTheoId('giao_uoc')?.gia.tuRangBuoc).toBe(true);
        expect(kenhTheoId('ngoai_giao_than')?.gia.tuRangBuoc).toBe(true);
    });
    it('kênh lọc theo điều kiện THẾ GIỚI, không theo cấp độ mở khóa', () => {
        const khong = kenhKhaDung({
            coTinDo: false,
            coDen: false,
            coTheChe: false,
            coThanKhac: false,
            luatNenCoSan: [],
        });
        // Không tín đồ thì không nói qua giáo lý được — nhưng dấu hiệu vẫn gửi được.
        expect(khong.map((k) => k.id)).toContain('dau_hieu');
        expect(khong.map((k) => k.id)).not.toContain('giao_ly');
        // `coi` cần Luật Nền không gian.
        expect(khong.map((k) => k.id)).not.toContain('coi');
    });
});
// ─────────────────────────────────────────── lời cầu
describe('cầu nguyện — Phần 22', () => {
    it('[BB] lời cầu sinh từ bế tắc THẬT, không từ hư không', () => {
        const { state } = theGioi('be-tac');
        const e = state.entities.get('place_a');
        e.aspects['kinh_te'] = { ...e.aspects['kinh_te'], thieuHut: 0.6 };
        const ds = quetBeTac(state, 'place_a');
        expect(ds.length).toBeGreaterThan(0);
        const doi = ds.find((x) => x.ducVongThieu === 'anToan');
        expect(doi).toBeDefined();
        // Đói 60% thì họ KHÔNG tự xoay xở nổi — `khaThi` phải dưới ngưỡng.
        expect(doi?.khaThi).toBeLessThan(NGUONG_KHA_THI);
    });
    it('vùng đói vừa phải thì tự lo, không sinh lời cầu', () => {
        const { state } = theGioi('tu-lo');
        const e = state.entities.get('place_a');
        e.aspects['kinh_te'] = { ...e.aspects['kinh_te'], thieuHut: 0.2 };
        const bt = quetBeTac(state, 'place_a').find((x) => x.ducVongThieu === 'anToan');
        expect(bt).toBeDefined();
        expect(bt?.khaThi).toBeGreaterThanOrEqual(NGUONG_KHA_THI);
        expect(sinhLoiCau(state, bt, { tick: 4, eventId: 'e', rng: rngCuaTick('s', 1, 'x') })).toBeNull();
    });
    it('lời cầu thật sự xuất hiện khi thế giới đói — chạy qua tick', () => {
        const { state, log } = theGioi('co-cau');
        nhapThan(state, log);
        epDoi(state, 'place_a', 'place_b');
        chay(state, log, 12);
        expect(state.prayers.size, 'thế giới đói mà không ai cầu gì').toBeGreaterThan(0);
        // Và chúng tới được tay vị thần người chơi đang nhập.
        const cho = loiCauCho(state, THAN, state.world.tick);
        expect(cho.length).toBeGreaterThan(0);
    });
    it('[BB] bốn cách trả lời đều có hậu quả — làm ngơ KHÔNG phải không có gì', () => {
        for (const [cach, hq] of Object.entries(HAU_QUA_TRA_LOI)) {
            const coHauQua = hq.phuThuoc !== 0 || hq.thatVong !== 0 || hq.soHai !== 0 || hq.yeuGhet !== 0 || hq.tinNguong !== 0;
            expect(coHauQua, `cách '${cach}' không để lại dấu nào`).toBe(true);
        }
        // Làm ngơ tích thất vọng — đó là cái giá của nó.
        expect(HAU_QUA_TRA_LOI.lam_ngo.thatVong).toBeGreaterThan(0);
    });
    it('ban phước GỠ đúng thứ đã sinh ra lời cầu', () => {
        const { state, log } = theGioi('ban-phuoc');
        nhapThan(state, log);
        epDoi(state, 'place_a');
        chay(state, log, 8);
        const cau = [...state.prayers.values()].find((p) => p.nguoiCauId === 'place_a' && !p.daTraLoi);
        expect(cau).toBeDefined();
        const evId = 'ev_ban_phuoc';
        const r = traLoiCau(state, cau, 'ban_phuoc', { tick: state.world.tick, eventId: evId });
        const ev = taoEvent({
            id: evId,
            branchId: state.world.branchId,
            tick: state.world.tick,
            loai: 'tra_loi_cau_ban_phuoc',
            actorIds: [THAN],
            targetIds: ['place_a'],
            causeEventIds: [],
            locationId: 'place_a',
            patches: [...r.patches],
            visibility: 'cong_khai',
            source: 'player',
            payload: {},
        });
        expect(apDungEvent(state, ev, log).ok).toBe(true);
        const kt = state.entities.get('place_a')?.aspects['kinh_te'];
        expect(kt.thieuHut).toBe(0);
        // Và cái giá: vùng lệ thuộc hơn.
        const sp = state.entities.get('place_a')?.aspects['spatial'];
        expect(sp.doPhuThuoc).toBeGreaterThan(0);
    });
    it('bất biến BẮT được lời cầu bịa (không có gốc)', () => {
        const { state } = theGioi('bia');
        state.prayers.set('cau_bia', {
            id: 'cau_bia',
            branchId: state.world.branchId,
            nguoiCauId: 'place_a',
            thanNhanId: null,
            loai: 'xin_cuu',
            noiDung: 'Một lời cầu không từ đâu cả.',
            cuongDo: 50,
            goc: { ducVongThieu: '', canTroId: null, diemMongMuon: 0, khaThi: 0 },
            tickCau: 0,
            hanChot: null,
            daTraLoi: false,
            cachTraLoi: 'chua',
            tickTraLoi: null,
            eventTraLoiId: null,
            soNguoi: 1,
        });
        const inv = chayInvariantToanBo(state);
        expect(inv.dat).toBe(false);
        expect(inv.viPhamNang.some((x) => x.code === 'LOI_CAU_CO_GOC_THAT')).toBe(true);
    });
});
// ─────────────────────────────────────────── quy kết
describe('tranh đoạt domain bằng quy kết — Phần 19.2', () => {
    it('không HP, không sát thương — chỉ có ai được tin', () => {
        const { state } = theGioi('quy-ket');
        const r = giaiQuyKet(state, {
            id: 'sk_bao',
            moTa: 'trận bão nhấn chìm hạm đội',
            locationId: 'place_b',
            domainTags: ['bao', 'bien'],
            sacThai: { tuBi_tanNhan: 70 },
        }, [{ thanId: THAN, domainTen: 'tay_ue', cuongDo: 60 }], { eventId: 'ev', tick: 4, tuning: TUNING, rng: rngCuaTick('s', 4, 'qk') });
        expect(r.thangId).toBe(THAN);
        // Chỉ `suc` đổi và một link quy kết — không có trường sát thương nào.
        expect(r.patches.some((p) => p.target.path.includes('domains'))).toBe(true);
        expect(r.patches.some((p) => p.target.table === 'links')).toBe(true);
    });
    it('[BB] danh tiếng quyết định thắng được cái gì', () => {
        // Sự kiện tàn nhẫn: vị thần bị TIN là tàn nhẫn khớp hơn hẳn.
        const tanNhan = doKhopTinhCach({ tuBi_tanNhan: 80 }, { tuBi_tanNhan: 80 });
        const hienLanh = doKhopTinhCach({ tuBi_tanNhan: 80 }, { tuBi_tanNhan: -80 });
        expect(tanNhan).toBeGreaterThan(hienLanh);
        expect(tanNhan).toBeCloseTo(1, 5);
    });
    it('[BB] 69.4 — suc = 0 mà còn neo thì là "còn lấy lại được", không phải "mất"', () => {
        expect(trangThaiSuyRa({
            ten: 'x',
            suc: 0,
            trangThai: 'held',
            neoTaiChiem: [{ loai: 'vat_mang', refId: 'artifact_1', moTa: '' }],
            doiThuIds: [],
            goc: null,
            tickDoiTrangThai: 0,
        })).toBe('reclaimable');
        expect(trangThaiSuyRa({
            ten: 'x',
            suc: 0,
            trangThai: 'held',
            neoTaiChiem: [],
            doiThuIds: [],
            goc: null,
            tickDoiTrangThai: 0,
        })).toBe('lost');
    });
    it('rà soát domain cắt neo đã chết và đổi trạng thái theo', () => {
        const { state } = theGioi('ra-soat');
        const e = state.entities.get(THAN);
        const dom = e.aspects['domain'];
        dom.domains[0] = {
            ...dom.domains[0],
            suc: 0,
            neoTaiChiem: [{ loai: 'vat_mang', refId: 'khong_ton_tai', moTa: '' }],
        };
        const r = raSoatDomain(state, THAN, { eventId: 'ev', tick: 5 });
        expect(r.doi[0]?.den).toBe('lost');
    });
    it('bất biến BẮT được domain ghi "lost" mà vẫn còn neo', () => {
        const { state } = theGioi('neo');
        const e = state.entities.get(THAN);
        const dom = e.aspects['domain'];
        dom.domains[0] = {
            ...dom.domains[0],
            suc: 0,
            trangThai: 'lost',
            neoTaiChiem: [{ loai: 'ky_uc', refId: 'ky_uc_1', moTa: '' }],
        };
        const inv = chayInvariantToanBo(state);
        expect(inv.dat).toBe(false);
        expect(inv.viPhamNang.some((x) => x.code === 'DOMAIN_MAT_PHAI_HET_NEO')).toBe(true);
    });
});
// ─────────────────────────────────────────── giao ước
describe('giao ước — Phần 69.2', () => {
    it('[BB] thần cũng bị ràng buộc: giao ước một chiều là không hợp lệ', () => {
        const motChieu = GiaoUocSchema.parse({
            benAId: 'deity_1',
            benBId: 'mortal_1',
            tickKy: 0,
            dieuKhoan: [{ id: 'dk1', benGiu: 'mortal_1', loai: 'cong_nap', noiDung: 'nộp lễ mỗi mùa' }],
        });
        expect(giaoUocCanBang(motChieu)).toBe(false);
        const haiChieu = GiaoUocSchema.parse({
            benAId: 'deity_1',
            benBId: 'mortal_1',
            tickKy: 0,
            dieuKhoan: [
                { id: 'dk1', benGiu: 'mortal_1', loai: 'cong_nap', noiDung: 'nộp lễ mỗi mùa' },
                { id: 'dk2', benGiu: 'deity_1', loai: 'bao_ho', noiDung: 'che chở khỏi bệnh dịch' },
            ],
        });
        expect(giaoUocCanBang(haiChieu)).toBe(true);
    });
});
// ─────────────────────────────────────────── thần NPC sống khi vắng
describe('[BB] cổng Phase 6 — thần NPC tiếp tục sống khi vắng', () => {
    it('ba tiến trình tầng Thần có mặt và nối handler', () => {
        const co = new Set(moiTienTrinh().map((t) => t.def.id));
        for (const id of WORLD_PROCESS_IDS_THAN)
            expect(co.has(id), `thiếu '${id}'`).toBe(true);
    });
    it('thần NPC đáp áp lực Dị Hóa khi người chơi ở tầng khác', () => {
        const { state, log } = theGioi('npc-song');
        // Người chơi KHÔNG nhập vị thần này — nó là NPC hoàn toàn.
        epDoi(state, 'place_a', 'place_b');
        chay(state, log, 240);
        const bn = banNga(state);
        // Áp lực đã tới, và NPC đã tự chọn cách đáp — không cần ai bấm nút.
        expect(bn.pressure.distortion).toBeGreaterThan(0);
        const daChon = bn.pressure.tinhHuongMo.filter((t) => t.daChon !== null);
        expect(daChon.length, 'thần NPC không tự quyết định gì trong 60 năm').toBeGreaterThan(0);
    });
    it('thần người chơi đang nhập KHÔNG bị AI quyết thay', () => {
        const { state, log } = theGioi('khong-thay-mat');
        nhapThan(state, log);
        epDoi(state, 'place_a', 'place_b');
        chay(state, log, 240);
        const bn = banNga(state);
        // Tình huống mở ra, nhưng KHÔNG ai chọn thay người chơi.
        const mo = bn.pressure.tinhHuongMo.filter((t) => t.daChon === null);
        expect(mo.length).toBeGreaterThan(0);
        expect(bn.lichSuLoi).toEqual([]);
    });
    it('thần NPC trả lời lời cầu khi người chơi vắng mặt', () => {
        const { state, log } = theGioi('npc-tra-loi');
        epDoi(state, 'place_a', 'place_b');
        chay(state, log, 40);
        const daTraLoi = [...state.prayers.values()].filter((p) => p.daTraLoi && p.cachTraLoi !== 'chua');
        expect(daTraLoi.length, 'không lời cầu nào được ai trả lời').toBeGreaterThan(0);
    });
});
// ─────────────────────────────────────────── vòng chơi Thần
describe('[BB] cổng Phase 6 — ba mục tiêu ngoài tranh domain', () => {
    /**
     * "Playtest 30 phút không dùng Sáng Thế" dịch thành: chơi hết một vòng bằng
     * đúng API mà UI gọi, không lần nào chạm tầng Sáng Thế, và ba việc hoàn thành
     * đều KHÔNG phải tranh domain.
     */
    it('chơi trọn một vòng ở tầng Thần: trả lời cầu, đáp Dị Hóa, lập giao ước', () => {
        const { state, log } = theGioi('ba-muc-tieu');
        nhapThan(state, log);
        expect(state.world.playerState.mode).toBe('than');
        epDoi(state, 'place_a', 'place_b');
        const xong = [];
        // ── mục tiêu 1: trả lời một lời cầu ──
        chay(state, log, 20);
        const cau = loiCauCho(state, THAN, state.world.tick)[0];
        expect(cau).toBeDefined();
        const ev1 = 'ev_muc_tieu_1';
        const r1 = traLoiCau(state, cau, 'dau_hieu', { tick: state.world.tick, eventId: ev1 });
        expect(apDungEvent(state, taoEvent({
            id: ev1,
            branchId: state.world.branchId,
            tick: state.world.tick,
            loai: 'tra_loi_cau_dau_hieu',
            actorIds: [THAN],
            targetIds: [cau.nguoiCauId],
            causeEventIds: [],
            locationId: null,
            patches: [...r1.patches],
            visibility: 'cong_khai',
            source: 'player',
            payload: {},
        }), log).ok).toBe(true);
        xong.push('tra_loi_cau_nguyen');
        // ── mục tiêu 2: đáp một tình huống Dị Hóa ──
        chay(state, log, 200);
        const th = banNga(state).pressure.tinhHuongMo.find((t) => t.daChon === null);
        expect(th, 'không có tình huống Dị Hóa nào mở ra').toBeDefined();
        const idx = banNga(state).pressure.tinhHuongMo.findIndex((t) => t.id === th.id);
        const ev2 = 'ev_muc_tieu_2';
        const r2 = dapDiHoa(state.entities.get(THAN), banNga(state), th.truc, 'mac_ca', { eventId: ev2, tick: state.world.tick, tuning: TUNING, rng: rngCuaTick(state.world.seed, 1, 'd') });
        expect(apDungEvent(state, taoEvent({
            id: ev2,
            branchId: state.world.branchId,
            tick: state.world.tick,
            loai: r2.loaiEvent,
            actorIds: [THAN],
            targetIds: [],
            causeEventIds: [],
            locationId: null,
            patches: [
                ...r2.patches,
                {
                    op: 'set',
                    target: {
                        table: 'entities',
                        id: THAN,
                        path: `aspects.ban_nga.pressure.tinhHuongMo.${idx}.daChon`,
                    },
                    value: 'mac_ca',
                    sourceEventId: ev2,
                },
            ],
            visibility: 'cong_khai',
            source: 'player',
            payload: {},
        }), log).ok).toBe(true);
        xong.push('dap_di_hoa');
        // ── mục tiêu 3: lập một giao ước hai chiều ──
        const gu = GiaoUocSchema.parse({
            benAId: THAN,
            benBId: 'place_a',
            tickKy: state.world.tick,
            dieuKhoan: [
                { id: 'dk1', benGiu: 'place_a', loai: 'cam_ky', noiDung: 'Không đổ máu trong đền.' },
                { id: 'dk2', benGiu: THAN, loai: 'bao_ho', noiDung: 'Che chở vùng này khỏi dịch.' },
            ],
        });
        const ev3 = 'ev_muc_tieu_3';
        expect(apDungEvent(state, taoEvent({
            id: ev3,
            branchId: state.world.branchId,
            tick: state.world.tick,
            loai: 'lap_giao_uoc',
            actorIds: [THAN],
            targetIds: ['place_a'],
            causeEventIds: [],
            locationId: 'place_a',
            patches: [
                {
                    op: 'link',
                    target: { table: 'entities', id: 'covenant_1', path: '' },
                    value: {
                        id: 'covenant_1',
                        branchId: state.world.branchId,
                        kind: 'covenant',
                        ten: 'Ước của đền Sơ Trách',
                        tickSinh: state.world.tick,
                        aspects: { giao_uoc: gu },
                    },
                    sourceEventId: ev3,
                },
            ],
            visibility: 'cong_khai',
            source: 'player',
            payload: {},
        }), log).ok).toBe(true);
        xong.push('lap_giao_uoc');
        // Ba mục tiêu, KHÔNG mục nào là tranh domain.
        expect(xong).toEqual(['tra_loi_cau_nguyen', 'dap_di_hoa', 'lap_giao_uoc']);
        expect(xong).not.toContain('tranh_domain');
        // Và người chơi chưa lần nào quay về Sáng Thế.
        expect(state.world.playerState.mode).toBe('than');
        const inv = chayInvariantToanBo(state);
        expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);
    });
});
// ─────────────────────────────────────────── determinism
describe('tầng Thần không phá determinism của Phase 5', () => {
    it('cùng seed cho cùng hash sau 100 năm với đủ ba tiến trình Thần', () => {
        const a = theGioi('xac-dinh-6');
        chay(a.state, a.log, 400);
        const b = theGioi('xac-dinh-6');
        chay(b.state, b.log, 400);
        expect(hashState(a.state)).toBe(hashState(b.state));
    });
    it('một trăm năm có tầng Thần vẫn sạch chẩn đoán và sạch bất biến', () => {
        const { state, log } = theGioi('sach-6');
        const loi = chay(state, log, 400);
        expect(loi, loi.join('\n')).toEqual([]);
        const inv = chayInvariantToanBo(state);
        expect(inv.dat, inv.viPhamNang.map((e) => e.message).join('\n')).toBe(true);
    });
});
