/**
 * Bất biến của Thế Giới Sống — Phần 71.4 [BB].
 *
 * Danh sách tối thiểu của đặc tả và chỗ cưỡng chế tương ứng:
 *
 * | 71.4 đòi | Ở đây |
 * |---|---|
 * | dân số, vật chất, item count không âm | `dan_so_khong_am`, `kho_khong_am`, `tai_nguyen_khong_am` |
 * | entity chết không tự hành động | `nguoi_chet_khong_giu_chuc` |
 * | vị trí có tuyến đường hợp lệ | `tuyen_duong_hop_le` |
 * | không sở hữu cùng item độc quyền ở hai nơi | `khong_hai_chu_cung_mot_vat` |
 * | event cause không trỏ tương lai | `kiemNhanQua()` của Phase 1 |
 * | tri thức không xuất hiện nếu thiếu đường truyền | `khong_tri_thuc_teleport` |
 * | tổng thay đổi có giải thích qua event | `dan_so_khop_cohort`, `di_cu_bao_toan`, khai báo `baoToan` |
 *
 * Mức độ được chọn có chủ đích:
 *   - `fatal` cho thứ khiến thế giới trở nên **vô nghĩa** nếu bỏ qua (dân số âm,
 *     tri thức từ hư không). Vi phạm là rollback.
 *   - `warning` cho thứ **xấu nhưng còn kể được** (đường cụt, chức vụ do người
 *     chết giữ). Ném cả thế giới đi vì một con đường hỏng là phản ứng sai.
 */
import { dangKyInvariant, dangKyBoNapInvariant } from '../engine/invariant.js';
function docAspect(e, ten) {
    const a = e?.aspects[ten];
    return a === undefined || a === null || typeof a !== 'object' ? undefined : a;
}
function laToanBo(p) {
    return p === 'tat_ca';
}
function idCanKiem(s, phamVi) {
    const ids = laToanBo(phamVi) ? [...s.entities.keys()] : [...phamVi.entities];
    return ids.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
const lam4 = (x) => Math.round(x * 10_000) / 10_000;
/**
 * Nơi mà một chủ thể "đang ở", để so hai bên của một dòng tri thức.
 *
 * Một `place` thì ở chính nó. Một người thì ở nơi họ cư trú. Trả `null` nghĩa là
 * không xác định được — và lúc ấy phép so bên dưới không kết luận gì.
 */
function noiCua(s, id) {
    const e = s.entities.get(id);
    if (!e)
        return null;
    if (e.kind === 'place' || e.kind === 'realm')
        return id;
    for (const lk of s.links.values()) {
        if (lk.tickDut !== null || lk.quanHe !== 'cu_tru_tai' || lk.tuId !== id)
            continue;
        return lk.denId;
    }
    return null;
}
let daNap = false;
/**
 * Idempotent — gọi được nhiều lần từ nhiều điểm vào.
 * Tự đăng ký làm bộ nạp, nên `datLaiInvariant()` của test dựng lại đủ danh sách.
 */
export function napBatBienTheGioiSong() {
    if (daNap)
        return;
    daNap = true;
    dangKyBoNapInvariant(dangKyTatCa);
}
function dangKyTatCa() {
    // ── dân số ──
    dangKyInvariant({
        id: 'dan_so_khong_am',
        ten: 'Dân số không âm',
        mucDo: 'fatal',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const e = s.entities.get(id);
                const dc = docAspect(e, 'dan_cu');
                if (!dc)
                    continue;
                for (const band of ['child', 'youth', 'adult', 'elder']) {
                    const v = dc.cohort[band];
                    if (v < 0)
                        xau.push(`'${id}' có ${band} = ${v}`);
                }
                if (dc.soHo < 0)
                    xau.push(`'${id}' có soHo = ${dc.soHo}`);
            }
            return xau;
        },
    });
    /**
     * [BB] Hai con số cùng nói về một thứ thì phải bằng nhau.
     *
     * `spatial.danSo` là con số mà phép chiếu và UI đọc; `dan_cu.cohort` là con số
     * mà mô phỏng dùng. Cho phép chúng trôi khỏi nhau là cách nhanh nhất để có một
     * thế giới nói dối chính nó.
     */
    dangKyInvariant({
        id: 'dan_so_khop_cohort',
        ten: 'danSo phải khớp tổng cohort',
        mucDo: 'fatal',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const e = s.entities.get(id);
                const dc = docAspect(e, 'dan_cu');
                const sp = docAspect(e, 'spatial');
                if (!dc || !sp || typeof sp.danSo !== 'number')
                    continue;
                const tong = dc.cohort.child + dc.cohort.youth + dc.cohort.adult + dc.cohort.elder;
                if (Math.abs(tong - sp.danSo) > 0.5) {
                    xau.push(`'${id}': spatial.danSo = ${sp.danSo} nhưng tổng cohort = ${tong}`);
                }
            }
            return xau;
        },
    });
    /**
     * Di cư chỉ CHUYỂN người. Tổng nhập trừ tổng xuất trên toàn thế giới phải bằng 0.
     * Chỉ có nghĩa khi nhìn toàn cục, nên `canToanCuc`.
     */
    dangKyInvariant({
        id: 'di_cu_bao_toan',
        ten: 'Di cư không sinh và không nuốt người',
        mucDo: 'fatal',
        canToanCuc: true,
        kiem: (s) => {
            let net = 0;
            for (const e of s.entities.values()) {
                const dc = docAspect(e, 'dan_cu');
                if (!dc)
                    continue;
                net += dc.soCai.nhapCu - dc.soCai.xuatCu;
            }
            return Math.abs(net) > 0.5
                ? [`tổng nhập cư trừ xuất cư của cả thế giới = ${lam4(net)}, phải là 0`]
                : [];
        },
    });
    // ── vật chất ──
    dangKyInvariant({
        id: 'kho_khong_am',
        ten: 'Kho không âm',
        mucDo: 'fatal',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const kt = docAspect(s.entities.get(id), 'kinh_te');
                if (!kt)
                    continue;
                if (kt.kho.luongThuc < -1e-6)
                    xau.push(`'${id}' có luongThuc = ${lam4(kt.kho.luongThuc)}`);
                if (kt.kho.vatLieu < -1e-6)
                    xau.push(`'${id}' có vatLieu = ${lam4(kt.kho.vatLieu)}`);
            }
            return xau;
        },
    });
    dangKyInvariant({
        id: 'tai_nguyen_khong_am',
        ten: 'Trữ lượng không âm và không vượt sức chứa',
        mucDo: 'fatal',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const st = docAspect(s.entities.get(id), 'sinh_thai');
                if (!st)
                    continue;
                for (const loai of ['rung', 'thu', 'ca', 'dat']) {
                    const v = st.taiNguyen[loai];
                    const K = st.sucChua[loai];
                    if (v < -1e-6)
                        xau.push(`'${id}' có ${loai} = ${lam4(v)}`);
                    // Vượt sức chứa nghĩa là có ai đó đang cộng vào từ hư không.
                    else if (K > 0 && v > K + 1e-3)
                        xau.push(`'${id}' có ${loai} = ${lam4(v)} > sức chứa ${lam4(K)}`);
                }
            }
            return xau;
        },
    });
    // ── tri thức ──
    /**
     * [BB] "Tri thức không xuất hiện ở chủ thể nếu thiếu đường truyền."
     *
     * Một dòng có `hops > 0` phải chứng minh được cả ba điều:
     *   1. có nguồn thật — chủ thể được khai ở `source.sourceId` cũng biết điều đó;
     *   2. nguồn biết TRƯỚC;
     *   3. có tuyến đường nối hai bên, và tin đã đi đủ số tick của tuyến.
     *
     * Đây là bất biến đắt nhất trong danh sách, nên nó chỉ chạy toàn cục.
     */
    dangKyInvariant({
        id: 'khong_tri_thuc_teleport',
        ten: 'Tri thức phải có đường truyền',
        mucDo: 'fatal',
        canToanCuc: true,
        kiem: (s) => {
            const xau = [];
            const theoCap = new Map();
            for (const r of s.knowledge.values())
                theoCap.set(`${r.knowerId}|${r.factId}`, r);
            // Bảng tra tuyến: `a|b` → độ dài tuyến ngắn nhất giữa hai nơi.
            const tuyen = new Map();
            for (const e of s.entities.values()) {
                if (e.kind !== 'route')
                    continue;
                const d = docAspect(e, 'duong');
                if (!d)
                    continue;
                for (const k of [`${d.tuId}|${d.denId}`, `${d.denId}|${d.tuId}`]) {
                    const cu = tuyen.get(k);
                    if (cu === undefined || d.doDai < cu)
                        tuyen.set(k, d.doDai);
                }
            }
            const ids = [...s.knowledge.keys()].sort((a, b) => (a < b ? -1 : 1));
            for (const id of ids) {
                const r = s.knowledge.get(id);
                if (!r || r.source.hops === 0)
                    continue;
                const nguonId = r.source.sourceId;
                if (nguonId === null) {
                    xau.push(`'${id}' khai ${r.source.hops} chặng nhưng không có nguồn`);
                    continue;
                }
                const nguon = theoCap.get(`${nguonId}|${r.factId}`);
                if (!nguon) {
                    xau.push(`'${id}' học từ '${nguonId}', nhưng '${nguonId}' không hề biết '${r.factId}'`);
                    continue;
                }
                if (nguon.learnedAtTick > r.learnedAtTick) {
                    xau.push(`'${id}' học lúc tick ${r.learnedAtTick}, sớm hơn cả nguồn (${nguon.learnedAtTick})`);
                    continue;
                }
                /*
                 * Hai người ĐỨNG CÙNG MỘT CHỖ thì không cần tuyến đường.
                 *
                 * Bất biến này viết ở Phase 5, khi `knowerId` luôn là một vùng và tin
                 * chỉ đi giữa các vùng. Phase 7 thêm đối thoại mặt đối mặt (70.4), và
                 * lúc ấy nguồn với người biết là hai con người trong cùng một làng —
                 * giữa họ không có "tuyến đường" nào, và cũng không cần có.
                 *
                 * Luật thật sự là "tin không teleport", không phải "tin phải đi trên
                 * đường". Người nói chuyện với nhau trong cùng một nơi không teleport.
                 */
                if (noiCua(s, nguonId) !== null && noiCua(s, nguonId) === noiCua(s, r.knowerId))
                    continue;
                const doDai = tuyen.get(`${nguonId}|${r.knowerId}`);
                if (doDai === undefined) {
                    xau.push(`'${id}': không có tuyến đường nào giữa '${nguonId}' và '${r.knowerId}'`);
                    continue;
                }
                if (r.learnedAtTick - nguon.learnedAtTick < doDai) {
                    xau.push(`'${id}': tin đi từ '${nguonId}' cần ${doDai} tick, nhưng tới sau ` +
                        `${r.learnedAtTick - nguon.learnedAtTick} tick`);
                }
            }
            return xau;
        },
    });
    // ── địa lý ──
    dangKyInvariant({
        id: 'tuyen_duong_hop_le',
        ten: 'Tuyến đường phải nối hai nơi có thật',
        mucDo: 'warning',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const e = s.entities.get(id);
                if (!e || e.kind !== 'route')
                    continue;
                const d = docAspect(e, 'duong');
                if (!d) {
                    xau.push(`'${id}' là tuyến đường nhưng thiếu aspect 'duong'`);
                    continue;
                }
                if (!s.entities.has(d.tuId))
                    xau.push(`tuyến '${id}' bắt đầu ở '${d.tuId}' không tồn tại`);
                if (!s.entities.has(d.denId))
                    xau.push(`tuyến '${id}' kết thúc ở '${d.denId}' không tồn tại`);
                if (d.tuId === d.denId)
                    xau.push(`tuyến '${id}' nối một nơi với chính nó`);
            }
            return xau;
        },
    });
    // ── quyền sở hữu và chức vụ ──
    /**
     * "Không sở hữu cùng item độc quyền ở hai nơi."
     * Thần khí (`artifact`) là vật độc quyền: `carrier.chuSoHuuId` phải là một người,
     * và không hai thực thể nào cùng khai `so_huu` một thần khí.
     */
    dangKyInvariant({
        id: 'khong_hai_chu_cung_mot_vat',
        ten: 'Vật độc quyền chỉ có một chủ',
        mucDo: 'fatal',
        canToanCuc: true,
        kiem: (s) => {
            const chu = new Map();
            for (const lk of s.links.values()) {
                if (lk.tickDut !== null || lk.quanHe !== 'so_huu')
                    continue;
                const vat = s.entities.get(lk.denId);
                if (!vat || vat.kind !== 'artifact')
                    continue;
                const ds = chu.get(lk.denId) ?? [];
                ds.push(lk.tuId);
                chu.set(lk.denId, ds);
            }
            const xau = [];
            for (const vatId of [...chu.keys()].sort((a, b) => (a < b ? -1 : 1))) {
                const ds = (chu.get(vatId) ?? []).sort((a, b) => (a < b ? -1 : 1));
                if (ds.length > 1)
                    xau.push(`'${vatId}' đang có ${ds.length} chủ: ${ds.join(', ')}`);
            }
            return xau;
        },
    });
    /**
     * "Entity chết không tự hành động nếu chưa có aspect cho phép."
     * Ở Phase 5, hành động duy nhất mà một người chết còn có thể *giữ* là chức vụ.
     * Thực thể có `divisible` hoặc `adversarial` được miễn — chết với chúng không
     * phải là kết thúc (Phần 12.5 điều khoản bất tử).
     */
    dangKyInvariant({
        id: 'nguoi_chet_khong_giu_chuc',
        ten: 'Người chết không giữ chức',
        mucDo: 'warning',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const ins = docAspect(s.entities.get(id), 'institutional');
                if (!ins)
                    continue;
                for (const c of ins.chucVu) {
                    if (c.nguoiGiuId === null)
                        continue;
                    const nguoi = s.entities.get(c.nguoiGiuId);
                    if (!nguoi || nguoi.tickDiet === null)
                        continue;
                    if (nguoi.aspects['divisible'] !== undefined || nguoi.aspects['adversarial'] !== undefined)
                        continue;
                    xau.push(`'${id}': chức '${c.ten}' vẫn ghi tên '${c.nguoiGiuId}' đã chết ở tick ${nguoi.tickDiet}`);
                }
            }
            return xau;
        },
    });
    // ── nợ ──
    dangKyInvariant({
        id: 'no_co_hai_dau_that',
        ten: 'Nợ phải có chủ nợ và con nợ có thật',
        mucDo: 'fatal',
        kiem: (s, phamVi) => {
            const ids = laToanBo(phamVi) ? [...s.debts.keys()] : [...phamVi.debts];
            const xau = [];
            for (const id of ids.sort((a, b) => (a < b ? -1 : 1))) {
                const no = s.debts.get(id);
                if (!no)
                    continue;
                if (no.amount < 0)
                    xau.push(`nợ '${id}' có amount = ${no.amount}`);
                if (!s.entities.has(no.creditorId))
                    xau.push(`nợ '${id}' có chủ nợ '${no.creditorId}' không tồn tại`);
                if (!s.entities.has(no.debtorId))
                    xau.push(`nợ '${id}' có con nợ '${no.debtorId}' không tồn tại`);
                if (no.creditorId === no.debtorId)
                    xau.push(`nợ '${id}' tự nợ chính mình`);
            }
            return xau;
        },
    });
    // ── an ninh ──
    dangKyInvariant({
        id: 'thuong_vong_tru_dan_so',
        ten: 'Thương vong không vượt dân số',
        mucDo: 'fatal',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const e = s.entities.get(id);
                const an = docAspect(e, 'an_ninh');
                const dc = docAspect(e, 'dan_cu');
                if (!an || !dc)
                    continue;
                const tong = dc.cohort.child + dc.cohort.youth + dc.cohort.adult + dc.cohort.elder;
                if (an.thuongVongKy < 0)
                    xau.push(`'${id}' có thương vong âm`);
                if (tong < 0)
                    xau.push(`'${id}' còn ${tong} người sau thương vong`);
            }
            return xau;
        },
    });
    // ── thời gian ──
    dangKyInvariant({
        id: 'nam_khop_tick',
        ten: 'Năm phải suy được từ tick',
        mucDo: 'warning',
        kiem: (s) => {
            const dung = Math.floor(s.world.tick / 4);
            return s.world.year !== dung && s.world.year !== dung - 1
                ? [`world.year = ${s.world.year} nhưng tick ${s.world.tick} tương ứng năm ${dung}`]
                : [];
        },
    });
}
