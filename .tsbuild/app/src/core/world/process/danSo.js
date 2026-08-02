import { cong, dat, docAspect, kep, lam, langGieng, moiNoiChon, tongCohort } from './tienIch.js';
import { gopTyLe } from './moiTruong.js';
/** Trần an toàn: một tiến trình lấy tối đa ngần này của một nhóm mỗi lần chạy. */
export const TRAN_LAY_MOT_LAN = 0.5;
/** Nhịp: đứa trẻ mất 60 tick để thành thanh niên (15 năm × 4 tick). */
const TICK_QUA_BAND = { child: 60, youth: 40, adult: 140 };
/** Tử suất nền mỗi tick theo nhóm tuổi, thế giới tiền công nghiệp. */
const TU_SUAT_NEN = { child: 0.006, youth: 0.002, adult: 0.0025, elder: 0.02 };
const TY_SINH_CO_BAN = 0.022;
/** Một người ăn ngần này lương thực mỗi mùa. */
export const KHAU_PHAN = 0.55;
/** Tách phần nguyên khỏi bộ đệm; trả về số nguyên và phần dư còn lại. */
function tachNguyen(tichLuy) {
    const n = Math.floor(tichLuy);
    return { n, du: lam(tichLuy - n, 6) };
}
// ─────────────────────────────────────────── population_household
export function chayDanSo(nc) {
    const patches = [];
    const suKien = [];
    const noiChon = moiNoiChon(nc.state);
    /** Delta cohort gộp của từng vùng, để cuối cùng phát ra một bộ patch nhất quán. */
    const delta = new Map();
    const soCai = new Map();
    const duMoi = new Map();
    const danHienTai = new Map();
    const themDelta = (id, band, n) => {
        const d = delta.get(id);
        if (d)
            d[band] += n;
    };
    for (const { id, e } of noiChon) {
        const dc = docAspect(e, 'dan_cu');
        if (!dc)
            continue;
        delta.set(id, { child: 0, youth: 0, adult: 0, elder: 0 });
        danHienTai.set(id, { ...dc.cohort });
        soCai.set(id, { sinh: 0, tuTuNhien: 0, tuDoDoi: 0, tuDoBenh: 0, nhapCu: 0, xuatCu: 0 });
        duMoi.set(id, { ...dc.du });
    }
    // ── 1. sinh, già đi, chết ──
    for (const { id, e } of noiChon) {
        const dc = docAspect(e, 'dan_cu');
        const kt = docAspect(e, 'kinh_te');
        const yt = docAspect(e, 'y_te');
        const d = delta.get(id);
        const sc = soCai.get(id);
        const du = duMoi.get(id);
        if (!dc || !d || !sc || !du)
            continue;
        const c = dc.cohort;
        const tong = tongCohort(c);
        if (tong <= 0)
            continue;
        const thieuHut = kep(kt?.thieuHut ?? 0, 0, 1);
        const tyLeMac = kep(yt?.tyLeMac ?? 0, 0, 1);
        const n = nc.soBuocGop;
        // ── sinh ──
        // Đói và bệnh làm người ta đẻ ít đi trước khi làm người ta chết.
        const sinhSan = c.adult + c.youth * 0.5;
        const heSo = (1 - thieuHut) * (1 - 0.5 * tyLeMac);
        const tichSinh = du.sinh + sinhSan * TY_SINH_CO_BAN * heSo * n;
        const { n: soSinh, du: duSinh } = tachNguyen(tichSinh);
        if (soSinh > 0) {
            themDelta(id, 'child', soSinh);
            sc.sinh += soSinh;
        }
        du.sinh = duSinh;
        // ── già đi ──
        const chuyen = [
            ['child', 'youth', 'lenYouth', TICK_QUA_BAND.child],
            ['youth', 'adult', 'lenAdult', TICK_QUA_BAND.youth],
            ['adult', 'elder', 'lenElder', TICK_QUA_BAND.adult],
        ];
        for (const [tu, den, khoaDu, soTick] of chuyen) {
            const tich = du[khoaDu] + (c[tu] * n) / soTick;
            const { n: soLen, du: duLen } = tachNguyen(tich);
            const thatSu = Math.min(soLen, Math.floor(c[tu] * TRAN_LAY_MOT_LAN));
            if (thatSu > 0) {
                themDelta(id, tu, -thatSu);
                themDelta(id, den, thatSu);
            }
            du[khoaDu] = duLen;
        }
        // ── chết ──
        // Ba nguyên nhân tách riêng vì Sổ Nhân Quả và Narrator cần biết vì sao.
        // Kỳ vọng tính bằng số thực trên từng nhóm, rồi làm tròn MỘT LẦN trên tổng:
        // làm tròn từng nhóm sẽ đánh rơi vài người mỗi tick, và 400 tick sau thì
        // sai số đó lớn hơn cả một cái làng.
        const doDoi = gopTyLe(thieuHut * 0.06, n);
        const doBenh = gopTyLe(tyLeMac * 0.05, n);
        const kyVong = { child: 0, youth: 0, adult: 0, elder: 0 };
        const nguyenNhan = { tuNhien: 0, doi: 0, benh: 0 };
        for (const band of ['child', 'youth', 'adult', 'elder']) {
            const dan = c[band];
            if (dan <= 0)
                continue;
            // Trẻ và già chết vì đói và dịch trước.
            const yeu = band === 'child' || band === 'elder' ? 1.8 : 1;
            const a = dan * gopTyLe(TU_SUAT_NEN[band], n);
            const b = dan * doDoi * yeu;
            const d2 = dan * doBenh * yeu;
            kyVong[band] = Math.min(a + b + d2, dan * TRAN_LAY_MOT_LAN);
            nguyenNhan.tuNhien += a;
            nguyenNhan.doi += b;
            nguyenNhan.benh += d2;
        }
        const tongKyVong = kyVong.child + kyVong.youth + kyVong.adult + kyVong.elder;
        const { n: soChet, du: duChet } = tachNguyen(du.tu + tongKyVong);
        du.tu = duChet;
        if (soChet > 0 && tongKyVong > 0) {
            // Chia theo tỷ trọng, phần dư về nhóm có kỳ vọng lớn nhất — deterministic.
            const chia = { child: 0, youth: 0, adult: 0, elder: 0 };
            let daChia = 0;
            let bandLon = 'adult';
            for (const band of ['child', 'youth', 'adult', 'elder']) {
                chia[band] = Math.floor((soChet * kyVong[band]) / tongKyVong);
                daChia += chia[band];
                if (kyVong[band] > kyVong[bandLon])
                    bandLon = band;
            }
            chia[bandLon] += soChet - daChia;
            for (const band of ['child', 'youth', 'adult', 'elder']) {
                const thatSu = Math.min(chia[band], Math.floor(c[band] * TRAN_LAY_MOT_LAN));
                if (thatSu > 0)
                    themDelta(id, band, -thatSu);
                chia[band] = thatSu;
            }
            const chetThat = chia.child + chia.youth + chia.adult + chia.elder;
            const tongNn = nguyenNhan.tuNhien + nguyenNhan.doi + nguyenNhan.benh;
            if (tongNn > 0) {
                const nTuNhien = Math.floor((chetThat * nguyenNhan.tuNhien) / tongNn);
                const nDoi = Math.floor((chetThat * nguyenNhan.doi) / tongNn);
                sc.tuTuNhien += nTuNhien;
                sc.tuDoDoi += nDoi;
                sc.tuDoBenh += chetThat - nTuNhien - nDoi;
            }
            else {
                sc.tuTuNhien += chetThat;
            }
        }
    }
    // ── 2. di cư — [BB] tổng nhập trừ tổng xuất phải bằng 0 trên toàn thế giới ──
    for (const { id, e } of noiChon) {
        const kt = docAspect(e, 'kinh_te');
        const thieuHut = kep(kt?.thieuHut ?? 0, 0, 1);
        if (thieuHut < 0.35)
            continue;
        const c = danHienTai.get(id);
        if (!c)
            continue;
        const tong = tongCohort(c);
        if (tong < 20)
            continue;
        // Chỉ đi khi CÓ nơi để đi, và chỉ đi tới nơi đỡ đói hơn hẳn.
        const dich = langGieng(nc.state, id)
            .map((lg) => {
            const eb = nc.state.entities.get(lg.noiId);
            const ktb = docAspect(eb, 'kinh_te');
            return { ...lg, thieuHut: kep(ktb?.thieuHut ?? 1, 0, 1) };
        })
            .filter((lg) => lg.thieuHut < thieuHut - 0.2 && delta.has(lg.noiId))
            .sort((a, b) => (a.thieuHut !== b.thieuHut ? a.thieuHut - b.thieuHut : a.noiId < b.noiId ? -1 : 1));
        const den = dich[0];
        if (!den)
            continue;
        // Người đi là người còn đi nổi: thanh niên và người lớn.
        const muon = Math.floor((c.youth + c.adult) * 0.05 * thieuHut * nc.soBuocGop);
        const soDi = Math.min(muon, Math.floor(c.youth * 0.3) + Math.floor(c.adult * 0.3));
        if (soDi <= 0)
            continue;
        const diYouth = Math.min(Math.floor(c.youth * 0.3), Math.ceil(soDi / 2));
        const diAdult = Math.min(Math.floor(c.adult * 0.3), soDi - diYouth);
        const thatSu = diYouth + diAdult;
        if (thatSu <= 0)
            continue;
        themDelta(id, 'youth', -diYouth);
        themDelta(id, 'adult', -diAdult);
        themDelta(den.noiId, 'youth', diYouth);
        themDelta(den.noiId, 'adult', diAdult);
        const scTu = soCai.get(id);
        const scDen = soCai.get(den.noiId);
        if (scTu)
            scTu.xuatCu += thatSu;
        if (scDen)
            scDen.nhapCu += thatSu;
        suKien.push({
            loai: 'di_cu',
            mucDo: thatSu > 50 ? 'lon' : 'thuong',
            moTa: `${thatSu} người rời ${e.ten} vì đói, đi về phía ${nc.state.entities.get(den.noiId)?.ten ?? den.noiId}.`,
            tienTrinhId: 'population_household',
            chuTheIds: [id, den.noiId],
            locationId: id,
            payload: { soNguoi: thatSu, den: den.noiId },
        });
    }
    // ── 3. phát patch ──
    for (const { id, e } of noiChon) {
        const dc = docAspect(e, 'dan_cu');
        const d = delta.get(id);
        const sc = soCai.get(id);
        const du = duMoi.get(id);
        if (!dc || !d || !sc || !du)
            continue;
        let dTong = 0;
        for (const band of ['child', 'youth', 'adult', 'elder']) {
            if (d[band] === 0)
                continue;
            patches.push(cong(nc, id, `aspects.dan_cu.cohort.${band}`, d[band]));
            dTong += d[band];
        }
        if (dTong !== 0) {
            // Cùng một delta trên hai chỗ — bất biến `dan_so_khop_cohort` canh việc này.
            patches.push(cong(nc, id, 'aspects.spatial.danSo', dTong));
        }
        patches.push(dat(nc, id, 'aspects.dan_cu.du', du));
        patches.push(dat(nc, id, 'aspects.dan_cu.soCai', {
            ...sc,
            tuDoXungDot: 0,
            vatChatHoa: 0,
        }));
        patches.push(dat(nc, id, 'aspects.dan_cu.tickCapNhat', nc.tick));
        const tongCu = tongCohort(dc.cohort);
        const tongMoi = tongCu + dTong;
        const soHo = Math.max(0, Math.round(tongMoi / Math.max(1, dc.nguoiMoiHo)));
        if (soHo !== dc.soHo)
            patches.push(dat(nc, id, 'aspects.dan_cu.soHo', soHo));
        if (tongCu > 0 && tongMoi <= 0) {
            suKien.push({
                loai: 'vung_tuyet_tu',
                mucDo: 'trong_dai',
                moTa: `${e.ten} không còn một ai. Nhà cửa vẫn đứng đó.`,
                tienTrinhId: 'population_household',
                chuTheIds: [id],
                locationId: id,
                payload: { danSoCu: tongCu },
            });
        }
        else if (tongCu >= 50 && dTong < 0 && Math.abs(dTong) / tongCu >= 0.2) {
            suKien.push({
                loai: 'sup_do_dan_so',
                mucDo: 'trong_dai',
                moTa: `${e.ten} mất ${Math.abs(dTong)} người trong một mùa.`,
                tienTrinhId: 'population_household',
                chuTheIds: [id],
                locationId: id,
                payload: { mat: Math.abs(dTong), con: tongMoi },
            });
        }
    }
    return { patches, suKien };
}
// ─────────────────────────────────────────── health_disease
/** Hệ số lây và hệ số khỏi của mô hình SIR rút gọn. */
const BETA = 0.38;
const GAMMA = 0.22;
export function chaySucKhoe(nc) {
    const patches = [];
    const suKien = [];
    /**
     * Lây sang hàng xóm được gom lại rồi mới phát patch.
     *
     * Nếu ghi thẳng trong vòng lặp, một vùng vừa tự bùng dịch vừa bị hàng xóm lây
     * sẽ nhận hai `set` lên cùng `y_te.dichId` trong cùng một lô — cái sau đè cái
     * trước theo thứ tự duyệt, tức là kết quả phụ thuộc thứ tự id. Đó đúng là loại
     * lệ thuộc mà 71.4 bắt phải xử lý tường minh.
     */
    const layMoi = new Map();
    const tuBung = new Set();
    for (const { id, e } of moiNoiChon(nc.state)) {
        const yt = docAspect(e, 'y_te');
        const kt = docAspect(e, 'kinh_te');
        const dc = docAspect(e, 'dan_cu');
        if (!yt || !dc)
            continue;
        const dan = tongCohort(dc.cohort);
        if (dan <= 0) {
            if (yt.dichId !== null)
                patches.push(dat(nc, id, 'aspects.y_te.dichId', null));
            if (yt.tyLeMac > 0)
                patches.push(dat(nc, id, 'aspects.y_te.tyLeMac', 0));
            continue;
        }
        const thieuHut = kep(kt?.thieuHut ?? 0, 0, 1);
        const n = nc.soBuocGop;
        if (yt.dichId === null) {
            // ── chưa có dịch: nguy cơ bùng phát ──
            // Đông người + đói + đất kiệt = điều kiện đủ. Không cần ai "thả bệnh".
            const dongDuc = kep(dan / 4_000, 0, 1);
            const p = 0.004 * (1 + thieuHut * 3) * (0.3 + dongDuc);
            const rng = nc.rng.nhanh(`dich:${id}`);
            if (rng.co(gopTyLe(p, n))) {
                const dichId = `dich_${nc.tick}_${id}`;
                tuBung.add(id);
                patches.push(dat(nc, id, 'aspects.y_te.dichId', dichId));
                patches.push(dat(nc, id, 'aspects.y_te.tickBungPhat', nc.tick));
                patches.push(dat(nc, id, 'aspects.y_te.tyLeMac', 0.02));
                suKien.push({
                    loai: 'dich_bung_phat',
                    mucDo: 'lon',
                    moTa: `Một thứ bệnh lạ bắt đầu ở ${e.ten}.`,
                    tienTrinhId: 'health_disease',
                    chuTheIds: [id],
                    locationId: id,
                    payload: { dichId },
                });
            }
            else if (yt.mienDich > 0) {
                // Miễn dịch nhạt dần khi thế hệ biết bệnh chết đi.
                const moi = kep(yt.mienDich * (1 - gopTyLe(0.01, n)), 0, 1);
                if (lam(moi) !== lam(yt.mienDich))
                    patches.push(dat(nc, id, 'aspects.y_te.mienDich', lam(moi)));
            }
            continue;
        }
        // ── đang có dịch: SIR rút gọn ──
        const S = kep(1 - yt.mienDich - yt.tyLeMac, 0, 1);
        // Thầy thuốc và hiểu biết y học làm giảm lây, không làm biến mất bệnh.
        const giamLay = kep(yt.hieuBietYHoc / 200 + kep(yt.sucChuaChuaTri / Math.max(1, dan), 0, 0.3), 0, 0.6);
        const lay = gopTyLe(BETA * (1 - giamLay), n) * yt.tyLeMac * S;
        const khoi = gopTyLe(GAMMA, n) * yt.tyLeMac;
        const macMoi = kep(yt.tyLeMac + lay - khoi, 0, 1);
        const mienMoi = kep(yt.mienDich + khoi * 0.8, 0, 1);
        patches.push(dat(nc, id, 'aspects.y_te.tyLeMac', lam(macMoi)));
        patches.push(dat(nc, id, 'aspects.y_te.mienDich', lam(mienMoi)));
        if (macMoi < 0.005) {
            patches.push(dat(nc, id, 'aspects.y_te.dichId', null));
            patches.push(dat(nc, id, 'aspects.y_te.tyLeMac', 0));
            suKien.push({
                loai: 'dich_tan',
                mucDo: 'lon',
                moTa: `Bệnh ở ${e.ten} đã lui. Người ta bắt đầu quên nó tên gì.`,
                tienTrinhId: 'health_disease',
                chuTheIds: [id],
                locationId: id,
                payload: { dichId: yt.dichId },
            });
        }
        else if (macMoi > 0.3 && yt.tyLeMac <= 0.3) {
            suKien.push({
                loai: 'dich_lan_rong',
                mucDo: 'trong_dai',
                moTa: `Hơn một phần ba người ở ${e.ten} đã nằm xuống vì bệnh.`,
                tienTrinhId: 'health_disease',
                chuTheIds: [id],
                locationId: id,
                payload: { dichId: yt.dichId, tyLeMac: lam(macMoi) },
            });
        }
        // ── lây sang hàng xóm: CHỈ qua tuyến đường thông suốt (71.4) ──
        if (macMoi > 0.08) {
            for (const lg of langGieng(nc.state, id)) {
                const ytb = docAspect(nc.state.entities.get(lg.noiId), 'y_te');
                if (!ytb || ytb.dichId !== null)
                    continue;
                if (layMoi.has(lg.noiId))
                    continue;
                // Đường xa thì bệnh tới chậm — đây là cùng một độ trễ mà tin tức chịu.
                const pLay = (macMoi * 0.25) / lg.doTre;
                const rng = nc.rng.nhanh(`lay:${id}:${lg.noiId}`);
                if (!rng.co(gopTyLe(pLay, n)))
                    continue;
                layMoi.set(lg.noiId, { dichId: yt.dichId, tuId: id, duongId: lg.duongId });
            }
        }
    }
    // ── phát patch lây lan, sau khi đã biết vùng nào tự bùng dịch ──
    for (const [noiId, lay] of [...layMoi.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
        if (tuBung.has(noiId))
            continue;
        patches.push(dat(nc, noiId, 'aspects.y_te.dichId', lay.dichId));
        patches.push(dat(nc, noiId, 'aspects.y_te.tickBungPhat', nc.tick));
        patches.push(dat(nc, noiId, 'aspects.y_te.tyLeMac', 0.015));
        suKien.push({
            loai: 'dich_lay_lan',
            mucDo: 'lon',
            moTa: `Bệnh theo đường từ ${nc.state.entities.get(lay.tuId)?.ten ?? lay.tuId} sang ${nc.state.entities.get(noiId)?.ten ?? noiId}.`,
            tienTrinhId: 'health_disease',
            chuTheIds: [lay.tuId, noiId],
            locationId: noiId,
            payload: { dichId: lay.dichId, duongId: lay.duongId },
        });
    }
    return { patches, suKien };
}
