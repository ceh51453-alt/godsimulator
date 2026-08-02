import { StorylineSchema, machDaDong } from '../schema/truyen.js';
import { TI_LE_VANG_MAT } from '../schema/truyen.js';
import { HANDLER_LOAI_MACH } from './loaiMach.js';
import { hashCua } from '../engine/hash.js';
/** Thứ tự giai đoạn khi mạch tiến — `chet_yeu` KHÔNG nằm trên đường này. */
const DUONG_DI = ['am_i', 'khoi', 'phat_trien', 'cao_trao', 'ha_man', 'du_am'];
function giaiDoanKe(gd) {
    const i = DUONG_DI.indexOf(gd);
    if (i < 0 || i === DUONG_DI.length - 1)
        return gd;
    return DUONG_DI[i + 1] ?? gd;
}
/**
 * Id mạch: hàm thuần của (loại, bộ nhân vật chính).
 *
 * Cố ý KHÔNG có tick trong id. Nhờ vậy phép chống trùng ở bước 2 của 28.4 chỉ là
 * một phép tra Map, và một mạch đã kết thúc không bị sinh lại dưới id khác chỉ
 * vì thời gian đã trôi. Đây đúng là bài học của lỗi #2 Phase 6b, đọc ngược lại:
 * ở đó id cần thêm số thứ tự vì hai lần tách là hai việc khác nhau; ở đây hai
 * lần dò ra cùng một mối thù là CÙNG một câu chuyện.
 */
export function idMach(branchId, loai, nhanVatIds) {
    const khoa = hashCua([loai, [...nhanVatIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))]);
    return `ml_${branchId}_${loai}_${khoa.slice(0, 10)}`;
}
/** Nhân vật đóng vai chính — dùng cho phép chống trùng của 28.4 bước 2. */
function nhanVatChinh(uv) {
    const chinh = uv.nhanVat.filter((n) => n.vaiTro === 'chinh' || n.vaiTro === 'doi_dau');
    return (chinh.length > 0 ? chinh : uv.nhanVat).map((n) => n.entityId);
}
/**
 * Bước 11 của tick — quét mạch truyện, ngay trước quét lỗ hổng.
 *
 * Bốn việc của 28.4, đúng thứ tự:
 *   1. mỗi `tienDe(w)` trả danh sách ứng viên;
 *   2. lọc trùng theo (loại, bộ nhân vật chính) với mạch ĐANG hoạt động;
 *   3. giới hạn tổng mạch đang chạy = `tuning.truyen.machToiDa`;
 *   4. ưu tiên mạch có nhân vật spotlight cao, nhưng KHÔNG loại bỏ hoàn toàn
 *      mạch ở vùng xa — giữ hạn ngạch tối thiểu (28.6).
 */
export function quetMachTruyen(s, nc) {
    const dangChay = [...s.storylines.values()].filter((m) => !machDaDong(m.giaiDoan));
    const conCho = Math.max(0, nc.tuning.truyen.machToiDa - dangChay.length);
    // ── 1. dò tiền đề, theo thứ tự loại đã sắp để mọi lần chạy như nhau ──
    const ungVien = [];
    for (const loai of Object.keys(HANDLER_LOAI_MACH).sort((a, b) => (a < b ? -1 : 1))) {
        const h = HANDLER_LOAI_MACH[loai];
        if (!h)
            continue;
        ungVien.push(...h.tienDe(s));
    }
    /**
     * ── 2. lọc trùng ──
     *
     * Id là hàm thuần của (loại, bộ nhân vật chính), nên "đã có id ấy" đã bao hàm
     * "cùng loại, cùng bộ nhân vật". Mạch ĐÃ ĐÓNG cũng chặn: sinh lại dưới cùng id
     * sẽ ghi đè `ketCuc` và `tickKet` của nó, tức xóa một mẩu biên niên sử — và
     * biên niên sử là thứ 28.5 vừa nói phải giữ cả với truyện chết yểu.
     */
    const chuaCo = ungVien.filter((uv) => !s.storylines.has(idMach(s.world.branchId, uv.loai, nhanVatChinh(uv))));
    if (conCho === 0) {
        return { patches: [], machMoi: [], soBiTran: chuaCo.length };
    }
    // ── 3+4. xếp ưu tiên, nhưng giữ chỗ cho mạch KHÔNG có người chơi ──
    const coNguoiChoi = (uv) => nc.nguoiChoiId !== null && uv.nhanVat.some((n) => n.entityId === nc.nguoiChoiId);
    const diem = (uv) => uv.cangThangDau + (coNguoiChoi(uv) ? 10 : 0);
    const sapXep = (a, b) => {
        const d = diem(b) - diem(a);
        if (d !== 0)
            return d;
        // Tie-break bằng id, không bằng thứ tự Map (luật bất biến #7).
        const ia = idMach(s.world.branchId, a.loai, nhanVatChinh(a));
        const ib = idMach(s.world.branchId, b.loai, nhanVatChinh(b));
        return ia < ib ? -1 : ia > ib ? 1 : 0;
    };
    const vang = chuaCo.filter((uv) => !coNguoiChoi(uv)).sort(sapXep);
    const co = chuaCo.filter(coNguoiChoi).sort(sapXep);
    /**
     * [BB] 28.6 — hạn ngạch vắng mặt là cơ chế CỨNG. Ở đây nó là: ít nhất
     * `mucTieu` phần chỗ trống dành cho mạch không có người chơi, và chỉ nhường
     * lại nếu không đủ ứng viên như thế. Không có bước này thì mọi mạch mới sinh
     * ra đều xoay quanh người chơi, vì họ luôn ở giữa những căng thẳng cao nhất.
     */
    const chatVang = Math.max(0, Math.ceil(conCho * TI_LE_VANG_MAT.mucTieu));
    const chon = [];
    chon.push(...vang.slice(0, Math.max(chatVang, 0)));
    for (const uv of co) {
        if (chon.length >= conCho)
            break;
        chon.push(uv);
    }
    for (const uv of vang.slice(chatVang)) {
        if (chon.length >= conCho)
            break;
        chon.push(uv);
    }
    // ── dựng mạch ──
    const patches = [];
    const machMoi = [];
    for (const uv of chon.slice(0, conCho)) {
        const id = idMach(s.world.branchId, uv.loai, nhanVatChinh(uv));
        if (s.storylines.has(id) || machMoi.some((m) => m.id === id))
            continue;
        const nhipMoi = HANDLER_LOAI_MACH[uv.loai]
            ? Math.max(nc.tuning.truyen.tickNguToiThieu, nhipMacDinhCua(uv.loai))
            : nc.tuning.truyen.tickNguToiThieu;
        const m = StorylineSchema.parse({
            id,
            branchId: s.world.branchId,
            ten: uv.ten,
            loai: uv.loai,
            nhanVat: [...uv.nhanVat],
            giaiDoan: 'am_i',
            cangThang: Math.max(0, Math.min(100, uv.cangThangDau)),
            dongHo: nhipMoi,
            nhipMoi,
            // [BB] 28.2 — mặc định người chơi KHÔNG biết. Đây là chỗ đa số được giữ.
            nguoiChoiBiet: false,
            nguoiChoiThamGia: false,
            kyUcMach: uv.vi,
            tickSinh: nc.tick,
        });
        machMoi.push(m);
        patches.push({
            op: 'link',
            target: { table: 'storylines', id, path: '' },
            value: m,
            sourceEventId: nc.eventId,
        });
    }
    return { patches, machMoi, soBiTran: Math.max(0, chuaCo.length - machMoi.length) };
}
/** Nhịp mặc định của một loại — lấy từ handler nếu có, nếu không thì 12. */
function nhipMacDinhCua(loai) {
    return NHIP_MAC_DINH[loai] ?? 12;
}
/**
 * Nhịp mặc định theo loại. Trùng `config.nhipMacDinh` của manifest, nhưng đọc ở
 * đây để `core/truyen` không phải nạp registry chỉ để lấy một con số.
 */
const NHIP_MAC_DINH = Object.freeze({
    bao_thu: 50,
    ke_vi: 40,
    chien_tranh: 20,
    ly_giao: 60,
    am_muu: 35,
    tinh_ai: 25,
    kham_pha: 45,
    troi_day: 120,
    suy_tan: 90,
    phan_boi: 30,
    di_cu: 30,
    phat_kien: 80,
    tranh_domain: 45,
    doi_thuong: 12,
});
/**
 * Mỗi tick: `dongHo -= 1`. Chạm 0 → mạch tiến một nhịp.
 *
 * [BB] 28.5 — "mạch không được chăm sóc quá lâu ở `phat_trien` sẽ rơi vào
 * `chet_yeu`, và ĐÓ CŨNG LÀ MỘT KẾT CỤC HỢP LỆ, được ghi vào biên niên sử."
 * Vì vậy `chet_yeu` đi qua đúng đường như mọi kết cục khác: nó ghi `ketCuc`,
 * ghi `tickKet`, và không xóa gì.
 */
export function nhipMachTruyen(s, nc) {
    const patches = [];
    const daChay = [];
    const ids = [...s.storylines.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const id of ids) {
        const m = s.storylines.get(id);
        if (!m || m.tickKet !== null)
            continue;
        const set = (path, value) => {
            patches.push({
                op: 'set',
                target: { table: 'storylines', id, path },
                value,
                sourceEventId: nc.eventId,
            });
        };
        if (m.dongHo > 1) {
            set('dongHo', m.dongHo - 1);
            continue;
        }
        const h = HANDLER_LOAI_MACH[m.loai];
        if (!h) {
            // Loại lạ (pack ngoài chưa có adapter) — đứng yên, KHÔNG chết âm thầm.
            set('dongHo', m.nhipMoi);
            continue;
        }
        const rng = nc.rng.nhanh(`mach:${id}`);
        const beat = h.sinhNhip(m, s, rng);
        const soNhip = m.soNhip + 1;
        const cangThang = Math.max(0, Math.min(100, m.cangThang + beat.cangThangDelta));
        /**
         * Ba đường ra khỏi một nhịp:
         *   - handler tự tuyên giai đoạn mới;
         *   - căng thẳng vượt ngưỡng của giai đoạn hiện tại → tiến một bước;
         *   - ngồi lì quá lâu ở `phat_trien` mà không ai chiếu tới → chết yểu.
         */
        let gdMoi = beat.giaiDoanMoi ?? m.giaiDoan;
        if (beat.giaiDoanMoi === undefined) {
            if (cangThang >= NGUONG_TIEN[m.giaiDoan])
                gdMoi = giaiDoanKe(m.giaiDoan);
            const boBe = nc.tick - (m.tickChieuCuoi ?? m.tickSinh);
            if (m.giaiDoan === 'phat_trien' && boBe > m.nhipMoi * NGUONG_CHET_YEU)
                gdMoi = 'chet_yeu';
        }
        set('soNhip', soNhip);
        set('cangThang', cangThang);
        set('dongHo', m.nhipMoi);
        if (gdMoi !== m.giaiDoan)
            set('giaiDoan', gdMoi);
        /**
         * Bộ đệm nhịp: `push` chứ không `set`, và cắt đầu khi đầy.
         *
         * `set` cả mảng sẽ ghi đè kết quả của một nhịp khác trong cùng lô patch nếu
         * hai mạch cùng chạm — `push` là phép giao hoán mà 71.4 quy tắc 1 gộp được.
         */
        if (m.nhipGanDay.length >= TRAN_NHIP_DEM) {
            set('nhipGanDay', [...m.nhipGanDay.slice(-(TRAN_NHIP_DEM - 1)), beat.moTa]);
        }
        else {
            patches.push({
                op: 'push',
                target: { table: 'storylines', id, path: 'nhipGanDay' },
                value: beat.moTa.slice(0, 400),
                sourceEventId: nc.eventId,
            });
        }
        // [BB] 28.5 — engine áp `bienDoiTrangThai` vào world rồi mới sinh Event.
        patches.push(...apBienDoiTuSu(s, beat.bienDoiTrangThai ?? [], id, nc));
        if (beat.nutThatMoi !== undefined) {
            patches.push({
                op: 'push',
                target: { table: 'storylines', id, path: 'nutThat' },
                value: { moTa: beat.nutThatMoi, daGo: false, tickTao: nc.tick },
                sourceEventId: nc.eventId,
            });
        }
        if (machDaDong(gdMoi) && m.ketCuc === null) {
            set('ketCuc', beat.ketCuc ?? beat.moTa);
            set('tickKet', nc.tick);
        }
        daChay.push({
            machId: id,
            beat,
            giaiDoan: gdMoi,
            nguoiChoiCoMat: nc.nguoiChoiId !== null && m.nhanVat.some((n) => n.entityId === nc.nguoiChoiId),
        });
    }
    return { patches, daChay };
}
/** Trần bộ đệm nhịp chưa nén — khớp `nhipGanDay.max(12)` của schema. */
const TRAN_NHIP_DEM = 12;
/**
 * Trần ký ức một người mang theo.
 *
 * Không có trần thì sau một trăm năm mỗi người vài trăm mảnh, và mỗi mảnh là một
 * chunk trong chỉ mục truy hồi — MMR sẽ phải làm việc của một bộ lọc rác. Người
 * thật cũng không nhớ mọi thứ; họ nhớ những lần nặng nhất.
 */
const TRAN_KY_UC_MOI_NGUOI = 24;
/** Trần cảm xúc đang mang. `SoulSchema` cho phép nhiều hơn, đời sống thì không. */
const TRAN_CAM_XUC = 8;
/**
 * Biến `bienDoiTrangThai` thành patch.
 *
 * [BB] Chỉ dùng `push` và chỉ chạm `soul.kyUc` / `soul.tamTrang` — hai đường mà
 * không tiến trình nền nào khai `ghi`. Xem `BienDoiTuSu` để biết vì sao tầng tự
 * sự cố ý KHÔNG chạm vật chất.
 */
function apBienDoiTuSu(s, ds, machId, nc) {
    const ra = [];
    for (const [i, b] of ds.entries()) {
        const e = s.entities.get(b.entityId);
        // Nhân vật đã chết hoặc chưa từng tồn tại thì không nhớ thêm được gì.
        if (!e || e.tickDiet !== null)
            continue;
        const soul = e.aspects['soul'];
        if (!soul)
            continue;
        if (b.loai === 'ky_uc') {
            if ((soul.kyUc ?? []).length >= TRAN_KY_UC_MOI_NGUOI)
                continue;
            ra.push({
                op: 'push',
                target: { table: 'entities', id: b.entityId, path: 'aspects.soul.kyUc' },
                value: {
                    // Id thuần theo (mạch, nhịp, chỗ) — gieo lại cùng nhịp không nhân đôi.
                    id: `ku_${machId}_${nc.tick}_${i}`,
                    tomTat: b.tomTat.slice(0, 300),
                    tick: nc.tick,
                    dienTich: Math.max(0, Math.min(100, Math.round(b.dienTich))),
                    lienQuan: [machId],
                },
                sourceEventId: nc.eventId,
            });
            continue;
        }
        if ((soul.tamTrang ?? []).length >= TRAN_CAM_XUC)
            continue;
        ra.push({
            op: 'push',
            target: { table: 'entities', id: b.entityId, path: 'aspects.soul.tamTrang' },
            value: {
                loai: b.camXuc,
                // [BB] Cảm xúc PHẢI có đối tượng và nguyên nhân, nếu không nó vô dụng.
                doiTuongId: b.doiTuongId,
                cuongDo: Math.max(0, Math.min(100, Math.round(b.cuongDo))),
                suyGiam: 0.94,
                nguonGocKyUcId: `ku_${machId}_${nc.tick}_${i}`,
            },
            sourceEventId: nc.eventId,
        });
    }
    return ra;
}
/** Căng thẳng phải chạm ngần này thì mạch mới tiến sang giai đoạn kế. */
const NGUONG_TIEN = Object.freeze({
    am_i: 20,
    khoi: 40,
    phat_trien: 65,
    cao_trao: 85,
    ha_man: 101, // `ha_man → du_am` chỉ đi xuống, nên ngưỡng lên không bao giờ chạm
    du_am: 101,
    chet_yeu: 101,
});
/** Bỏ bê quá ngần này lần chu kỳ nhịp thì mạch ở `phat_trien` chết yểu. */
const NGUONG_CHET_YEU = 4;
/**
 * [BB] 28.6 — đo theo SỐ CẢNH, không theo token.
 *
 * Một cảnh dài về người chơi không được phép mua chuộc chỉ số bằng độ dài; đó
 * chính là lý do `doTren` của bảng là `so_canh`.
 */
export function hanNgachVangMat(canh) {
    const soCanh = canh.length;
    const vang = canh.filter((c) => !c.coNguoiChoi).length;
    const tyLe = soCanh === 0 ? 1 : vang / soCanh;
    const duTyLe = tyLe >= TI_LE_VANG_MAT.mucTieu;
    const duSoLuong = vang >= TI_LE_VANG_MAT.batBuocToiThieu;
    const dat = soCanh === 0 || (duTyLe && duSoLuong);
    /**
     * Hai điều kiện, hai câu khác nhau.
     *
     * Gộp chúng thành một câu "dưới ngưỡng 40%" là nói sai sự thật ở đúng trường
     * hợp hay gặp nhất: hai cảnh đầu tiên của một ván mới đều vắng người chơi
     * (tỉ lệ 100%) mà vẫn chưa đủ ba cảnh. Người đọc thấy "100% < 40%" sẽ đi tìm
     * một lỗi không tồn tại.
     */
    const thongDiep = dat
        ? `${vang}/${soCanh} cảnh không có mặt nhân vật người chơi.`
        : !duTyLe
            ? `Chỉ ${vang}/${soCanh} cảnh không có người chơi — dưới ngưỡng ${Math.round(TI_LE_VANG_MAT.mucTieu * 100)}%. Ống kính kỷ nguyên sau sẽ ưu tiên mạch ở xa.`
            : `Mới ${vang}/${soCanh} cảnh vắng người chơi; kỷ nguyên này cần ít nhất ` +
                `${TI_LE_VANG_MAT.batBuocToiThieu} cảnh như thế.`;
    return { soCanh, soCanhVangNguoiChoi: vang, tyLe, dat, thongDiep };
}
/** Mạch mà chủ thể ĐƯỢC BIẾT tới — dùng cho ống kính và cho assembler. */
export function machNguoiChoiBiet(s) {
    return [...s.storylines.values()]
        .filter((m) => m.nguoiChoiBiet && m.tickKet === null)
        .sort((a, b) => (a.id < b.id ? -1 : 1));
}
