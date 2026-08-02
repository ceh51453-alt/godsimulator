import { R } from '../registry/index.js';
import { SO_DIEM_SPARKLINE, TRAN_TEN_NHO, BangSnapshotSchema } from './schema.js';
// ─────────────────────────────────────────── kiểu
/**
 * Tám vùng, thứ tự CỐ ĐỊNH — [BB] 55.3.
 *
 * "Người dùng thu gọn từng vùng nhưng không đổi thứ tự — thứ tự này là thứ tự
 * câu hỏi tự nhiên." Mảng này là nguồn chân lý của thứ tự ấy, nên không có chỗ
 * nào khác được phép sắp lại.
 */
export const VUNG_BANG = [
    'khi_nao',
    'the_gioi_la_gi',
    'co_gi_ton_tai',
    'dang_the_nao',
    'da_lech',
    'dang_xay_ra',
    'ai_dang_chu_y',
    'tu_lan_truoc',
];
export const NHAN_VUNG = Object.freeze({
    khi_nao: 'Khi nào',
    the_gioi_la_gi: 'Thế giới là gì',
    co_gi_ton_tai: 'Có gì tồn tại',
    dang_the_nao: 'Thế giới đang thế nào',
    da_lech: 'Đã lệch bao xa',
    dang_xay_ra: 'Đang xảy ra chuyện gì',
    ai_dang_chu_y: 'Ai đáng chú ý',
    tu_lan_truoc: 'Từ lần trước',
});
/** Nơi một mục "Cần chú ý" mở tới — 55.4 [BB]. */
export const DICH_XU_LY = [
    'phuc_but',
    'loi_cau',
    'lo_hong',
    'mach_truyen',
    'doi_soat',
    'chi_so',
    'luat_nen',
];
// ─────────────────────────────────────────── đếm
const NHAN_NHIP = Object.freeze({
    nhat: 'Nhật — một ngày mỗi nhịp',
    nien: 'Niên — một mùa mỗi nhịp',
    the_dai: 'Thế Đại — một thế hệ mỗi nhịp',
    vinh_kiep: 'Vĩnh Kiếp — một kỷ nguyên mỗi nhịp',
});
/**
 * Giai đoạn mạch, viết bằng chữ — [BB] 58.13, cùng lẽ với `NHAN_PHAM_VI`.
 *
 * Xuất từ đây để Bảng Thông Tin dùng chung: hai bảng gọi cùng một giai đoạn bằng
 * hai cái tên khác nhau là một cách rất rẻ để làm người chơi tưởng có hai thứ.
 */
export const NHAN_GIAI_DOAN = Object.freeze({
    am_i: 'âm ỉ',
    khoi: 'vừa khởi',
    phat_trien: 'đang phát triển',
    cao_trao: 'cao trào',
    ha_man: 'hạ màn',
    du_am: 'dư âm',
    chet_yeu: 'chết yểu',
});
export function nhanGiaiDoan(gd) {
    return NHAN_GIAI_DOAN[gd] ?? gd.replace(/_/g, ' ');
}
/**
 * Kind nào đáng có một dòng riêng trong vùng "Có gì tồn tại".
 *
 * `Set` chứ không phải mảng: vòng lặp đếm chạy trên năm mươi nghìn entity, và
 * một `Array.includes` trong đó biến O(n) thành O(n·m). Cổng "<16 ms" của Phase
 * 11 đo đúng vòng lặp này.
 */
const KIND_DANG_DEM = new Set([
    'law',
    'concept',
    'deity',
    'realm',
    'artifact',
    'monster',
    'pantheon',
    'nation',
    'place',
    'mortal',
]);
function tenKind(kindId) {
    return R.kind.lay(kindId)?.ten ?? kindId;
}
function demTheoKind(view) {
    const dem = new Map();
    for (const e of view.entities.values())
        dem.set(e.kind, (dem.get(e.kind) ?? 0) + 1);
    return dem;
}
/**
 * Một lượt duyệt cho cả hai việc: đếm theo kind và gom nhóm để dựng dòng phụ.
 *
 * Duyệt hai lần trên năm mươi nghìn entity là hai lần tra `Map` và hai lần đi
 * qua iterator — đủ để một khung hình 16 ms trở nên chật ở máy chậm. Gom lại
 * một lượt là tối ưu duy nhất cần thiết ở đây; phần còn lại đã là O(n).
 */
function duyetMotLuot(view, gomNhom) {
    const dem = new Map();
    const theoKind = new Map();
    for (const e of view.entities.values()) {
        dem.set(e.kind, (dem.get(e.kind) ?? 0) + 1);
        if (!gomNhom || !KIND_DANG_DEM.has(e.kind))
            continue;
        const ds = theoKind.get(e.kind);
        if (ds === undefined)
            theoKind.set(e.kind, [e]);
        else
            ds.push(e);
    }
    return { dem, theoKind };
}
/**
 * Dòng phụ của từng loại — 55.3 in "hiệu lực 26 · treo 3 · huỷ 2" dưới số tổng.
 *
 * Đọc aspect ĐÃ CHIẾU. Ở tầng Thần nhiều trường đã bị `chieu()` xóa, nên dòng phụ
 * tự ngắn lại mà không cần một nhánh `if (mode === ...)` nào ở đây — đó là điểm
 * của việc cắt ở chiếu thay vì cắt ở render.
 */
function dongPhu(kindId, ds) {
    if (kindId === 'law') {
        let manh = 0;
        let yeu = 0;
        let treo = 0;
        let xungDot = 0;
        for (const e of ds) {
            const l = e.aspects['lawful'];
            if (l === undefined)
                continue;
            const h = typeof l.hieuLuc === 'number' ? l.hieuLuc : 0;
            if (h >= 50)
                manh++;
            else if (h > 0)
                yeu++;
            else
                treo++;
            if (Array.isArray(l.xungDot) && l.xungDot.length > 0)
                xungDot++;
        }
        const phan = [`hiệu lực ${manh}`, `yếu ${yeu}`, `treo ${treo}`];
        if (xungDot > 0)
            phan.push(`xung đột ${xungDot}`);
        return phan.join(' · ');
    }
    if (kindId === 'concept') {
        let ketTinh = 0;
        let luongLu = 0;
        for (const e of ds) {
            const c = e.aspects['conceptual'];
            if (c?.giaiDoan === 'ket_tinh')
                ketTinh++;
            else if (c?.giaiDoan === 'luong_lu')
                luongLu++;
        }
        if (ketTinh === 0 && luongLu === 0)
            return '';
        return `kết tinh ${ketTinh} · lưỡng lự ${luongLu}`;
    }
    if (kindId === 'deity') {
        let phanThan = 0;
        for (const e of ds) {
            const d = e.aspects['divisible'];
            if (Array.isArray(d?.phanThanIds) && d.phanThanIds.length > 0)
                phanThan++;
        }
        return phanThan === 0 ? '' : `có phân thân ${phanThan}`;
    }
    return '';
}
// ─────────────────────────────────────────── chỉ số
const CHI_SO = Object.freeze([
    { khoa: 'thucTai', nhan: 'Thực tại', tangLaTot: true },
    { khoa: 'songDong', nhan: 'Sống động', tangLaTot: true },
    { khoa: 'tuQuyet', nhan: 'Tự quyết', tangLaTot: true },
    { khoa: 'tuSinh', nhan: 'Tự sinh sự kiện', tangLaTot: true },
    // [BB] 69.6 — phụ thuộc TĂNG là chuyện xấu. Đây chính là lý do `tangLaTot` tồn
    // tại thay vì một quy ước ngầm "xanh là tăng".
    { khoa: 'phuThuoc', nhan: 'Phụ thuộc', tangLaTot: false },
]);
function dongChiSo(view, anh) {
    if (view.chiSo === null) {
        // Tầng Thần: không có năm chỉ số thế giới, nhưng CÓ sức domain của chính mình.
        if (view.mode !== 'than' || view.chuTheId === null)
            return null;
        const chuThe = view.entities.get(view.chuTheId);
        const dom = chuThe?.aspects['domain'];
        const ds = dom?.domains ?? [];
        if (ds.length === 0)
            return null;
        return Object.freeze(ds.map((d) => Object.freeze({
            khoa: `domain.${d.ten ?? ''}`,
            nhan: d.ten ?? 'domain chưa đặt tên',
            gia: Math.round(d.domainStrength ?? 0),
            delta: null,
            tangLaTot: true,
            chuoi: Object.freeze([]),
        })));
    }
    const gia = view.chiSo;
    return Object.freeze(CHI_SO.map((c) => {
        const chuoi = anh?.chuoiChiSo[c.khoa] ?? [];
        const truoc = anh?.lucXem.dem[`chiSo.${c.khoa}`];
        return Object.freeze({
            khoa: c.khoa,
            nhan: c.nhan,
            gia: Math.round(gia[c.khoa] ?? 0),
            delta: truoc === undefined ? null : Math.round((gia[c.khoa] ?? 0) - truoc),
            tangLaTot: c.tangLaTot,
            chuoi: Object.freeze(chuoi.slice(-SO_DIEM_SPARKLINE)),
        });
    }));
}
// ─────────────────────────────────────────── ai đáng chú ý
/**
 * Spotlight — 25.1.
 *
 * Xếp bằng ba dấu hiệu QUAN SÁT ĐƯỢC trong view: có vai trong một mạch đang chạy,
 * có nhiều liên kết còn hiệu lực, và đang được thấy rõ. Không đọc `spotlight` thô
 * của engine, vì điểm spotlight là sổ nội bộ chứ không phải thứ nhân vật biết.
 *
 * [BB] 29.3 — người chơi cũng chỉ là một dòng ở đây, và họ không được ưu tiên.
 */
function aiDangChuY(view) {
    const vaiTro = new Map();
    for (const m of view.machTruyen) {
        for (const n of m.nhanVat)
            if (!vaiTro.has(n.entityId))
                vaiTro.set(n.entityId, n.vaiTro);
    }
    const bac = new Map();
    for (const l of view.links) {
        if (l.daDut)
            continue;
        bac.set(l.tuId, (bac.get(l.tuId) ?? 0) + 1);
        bac.set(l.denId, (bac.get(l.denId) ?? 0) + 1);
    }
    const ung = [];
    for (const e of view.entities.values()) {
        if (e.kind !== 'deity' && e.kind !== 'mortal')
            continue;
        if (e.mucRo === 'tin_don')
            continue;
        const vai = vaiTro.get(e.id);
        const so = bac.get(e.id) ?? 0;
        const diem = (vai === undefined ? 0 : 40) + Math.min(so, 20) + (e.mucRo === 'ro' ? 10 : 0);
        if (diem === 0)
            continue;
        const vi = vai !== undefined
            ? `${tenKind(e.kind)} · ${vai}`
            : so > 0
                ? `${tenKind(e.kind)} · ${so} mối ràng buộc`
                : tenKind(e.kind);
        ung.push({ e, diem, vi });
    }
    ung.sort((a, b) => (b.diem !== a.diem ? b.diem - a.diem : a.e.id < b.e.id ? -1 : 1));
    return Object.freeze(ung.slice(0, 8).map((u) => Object.freeze({ id: u.e.id, ten: u.e.ten, vi: u.vi })));
}
// ─────────────────────────────────────────── cần chú ý
/**
 * Vùng "Cần chú ý" — 55.4 [BB].
 *
 * Tám nguồn của bảng 55.4, dựng từ dữ liệu đã có, không cơ chế mới. Mục nào không
 * mở được tới chỗ xử lý thì không được vào đây — [BB] "Không có mục nào chỉ để
 * đọc", và 58.11 nói tiếp: không xử lý được thì gọi nó là "Xem".
 */
function canChuY(view) {
    const ra = [];
    for (const f of view.phucBut) {
        if (!f.quaHan)
            continue;
        ra.push({
            id: `pb.${f.id}`,
            nhan: 'Phục bút quá hạn',
            vi: f.noiDung,
            dich: 'phuc_but',
            doiTuongId: f.id,
        });
    }
    for (const p of view.loiCau) {
        if (!p.sapHetHan)
            continue;
        ra.push({
            id: `lc.${p.id}`,
            nhan: 'Lời cầu sắp hết hạn',
            vi: p.soNguoi > 1 ? `${p.noiDung} (${p.soNguoi} người cùng cầu)` : p.noiDung,
            dich: 'loi_cau',
            doiTuongId: p.id,
        });
    }
    for (const g of view.loHong) {
        // 55.4 — ưu tiên > 70 và tồn quá hai kỷ nguyên. Một kỷ nguyên đo bằng nhịp
        // thì phụ thuộc nhịp thời gian, nên dùng chính nhịp đang chạy làm đơn vị.
        const nguong = view.nhipThoiGian === 'vinh_kiep' ? 2 : view.nhipThoiGian === 'the_dai' ? 20 : 200;
        if (g.uuTien <= 70 || g.tonBaoLau < nguong)
            continue;
        ra.push({
            id: `lh.${g.id}`,
            nhan: 'Lỗ hổng tồn lâu',
            vi: g.moTa,
            dich: 'lo_hong',
            doiTuongId: g.id,
        });
    }
    for (const m of view.machTruyen) {
        if (m.giaiDoan !== 'cao_trao')
            continue;
        ra.push({
            id: `mt.${m.id}`,
            nhan: 'Mạch đang cao trào',
            vi: m.ten,
            dich: 'mach_truyen',
            doiTuongId: m.id,
        });
    }
    for (const d of view.diBiet) {
        if (d.lech + d.batKha === 0)
            continue;
        ra.push({
            id: `db.${d.nguon}`,
            nhan: 'Thần thoại nguồn đã lệch',
            vi: `${d.nguon}: ${d.lech} lệch, ${d.batKha} bất khả`,
            dich: 'doi_soat',
            doiTuongId: null,
        });
    }
    if (view.chiSo !== null) {
        if (view.chiSo.tuQuyet < 40) {
            ra.push({
                id: 'cs.tuQuyet',
                nhan: 'Thế giới đang mất tự quyết',
                vi: `Tự quyết trung bình ${Math.round(view.chiSo.tuQuyet)} — nhân vật đang bị đẩy đi thay vì tự đi.`,
                dich: 'chi_so',
                doiTuongId: null,
            });
        }
        for (const t of view.luatNen) {
            if (t.soKeHo === 0 || t.soKeHoDaKhaiThac > 0)
                continue;
            ra.push({
                id: `ln.${t.truc}`,
                nhan: 'Kẽ hở chưa ai khai thác',
                vi: `${t.ten} có ${t.soKeHo} kẽ hở còn nguyên.`,
                dich: 'luat_nen',
                doiTuongId: t.truc,
            });
        }
    }
    ra.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return Object.freeze(ra);
}
// ─────────────────────────────────────────── từ lần trước
function tenTheoKind(view, kindId) {
    const ra = [];
    for (const e of view.entities.values()) {
        if (e.kind !== kindId)
            continue;
        ra.push(e.id);
        if (ra.length >= TRAN_TEN_NHO)
            break;
    }
    return ra.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
/**
 * Diff kể từ lần cuối mở Bảng — 55.4 [BB].
 *
 * So TẬP TÊN chứ không so con số: "184 → 185 khái niệm" không nói được cái gì
 * vừa sinh ra, còn "Ô Uế vừa kết tinh" thì nói được. Mất tên cũng là tin — một
 * vị thần biến khỏi tầm nhìn là chuyện đáng biết, dù lý do có thể chỉ là sương mù.
 */
function tuLanTruoc(view, anh) {
    if (anh === null || anh.tickXemCuoi === null)
        return Object.freeze([]);
    const ra = [];
    const ten = (id) => view.entities.get(id)?.ten ?? id;
    const so = (kindId, cu, nhanMoi, nhanMat) => {
        const truoc = new Set(cu);
        const nay = new Set(tenTheoKind(view, kindId));
        for (const id of nay)
            if (!truoc.has(id))
                ra.push(`${nhanMoi} ${ten(id)}`);
        for (const id of truoc)
            if (!nay.has(id))
                ra.push(`${nhanMat} ${ten(id)}`);
    };
    so('law', anh.lucXem.luat, 'Luật mới:', 'Luật không còn trong tầm mắt:');
    so('concept', anh.lucXem.khaiNiem, 'Khái niệm mới:', 'Khái niệm không còn trong tầm mắt:');
    so('deity', anh.lucXem.than, 'Thần mới:', 'Thần không còn trong tầm mắt:');
    for (const m of view.machTruyen) {
        const cu = anh.lucXem.machGiaiDoan[m.id];
        if (cu === undefined)
            ra.push(`Mạch mới: ${m.ten}`);
        else if (cu !== m.giaiDoan)
            ra.push(`${m.ten}: ${nhanGiaiDoan(cu)} → ${nhanGiaiDoan(m.giaiDoan)}`);
    }
    ra.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return Object.freeze(ra.slice(0, 24));
}
// ─────────────────────────────────────────── cửa chính
/**
 * [BB] 55.5 — chữ ký này là hợp đồng. Tham số thế giới duy nhất là `WorldView`.
 *
 * `anh` chỉ mang thứ một hàm thuần trên view không tự biết: chuỗi bảy kỷ nguyên
 * và ảnh của lần mở bảng trước. Nó KHÔNG mang dữ liệu thế giới nào chưa qua chiếu
 * — `chupBang()` bên dưới cũng chỉ đọc `view`, nên không có cửa sau nào ở đây.
 */
export function tinhBangThienDien(view, anh = null) {
    const phamNhan = view.mode === 'pham_nhan';
    const { dem, theoKind } = duyetMotLuot(view, !phamNhan);
    const coGiTonTai = phamNhan
        ? null
        : [...dem.entries()]
            .filter(([k]) => KIND_DANG_DEM.has(k))
            .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0] < b[0] ? -1 : 1))
            .map(([kindId, so]) => Object.freeze({
            nhan: tenKind(kindId),
            kindId,
            so,
            phu: dongPhu(kindId, theoKind.get(kindId) ?? []),
        }));
    const theGioiLaGi = phamNhan
        ? null
        : Object.freeze({
            luatNen: Object.freeze(view.luatNen.map((t) => Object.freeze({
                ten: t.ten,
                trangThai: t.trangThai === 'co_ten' ? 'có tên' : 'vô danh',
                ghiChu: t.trangThai === 'co_ten'
                    ? [
                        t.tenKhaiNiemNen === '' ? '' : `nền: ${t.tenKhaiNiemNen}`,
                        t.soKeHo === 0 ? '' : `${t.soKeHo} kẽ hở, ${t.soKeHoDaKhaiThac} đã bị khai thác`,
                    ]
                        .filter((s) => s !== '')
                        .join(' · ')
                    : 'đang đúng, nhưng chưa ai gọi tên nó',
            }))),
            coChe: Object.freeze(view.coChe.map((c) => Object.freeze({
                ten: c.ten,
                trangThai: c.bat ? 'có' : 'không',
                // [BB] 44.5 — mục "không" phải nói rõ còn thiếu gì.
                ghiChu: c.bat ? '' : c.conThieu.join('; '),
            }))),
        });
    const mach = view.machTruyen
        .map((m) => Object.freeze({
        id: m.id,
        ten: m.ten,
        loai: m.loai,
        giaiDoan: nhanGiaiDoan(m.giaiDoan),
        cangThang: Math.round(m.cangThang),
        soNutChuaGo: m.nutThatChuaGo.length,
        daBiet: m.nguoiChoiBiet,
    }))
        .sort((a, b) => (b.cangThang !== a.cangThang ? b.cangThang - a.cangThang : a.id < b.id ? -1 : 1));
    return Object.freeze({
        mode: view.mode,
        branchId: view.branchId,
        khiNao: Object.freeze({
            moTaThoiDiem: view.thoiCuoc.moTaThoiDiem,
            tenKyNguyen: view.thoiCuoc.tenKyNguyen,
            nhip: NHAN_NHIP[view.thoiCuoc.nhip] ?? view.thoiCuoc.nhip,
            // [BB] 58.4 — ước lượng được thì nói, không thì nói thẳng là chưa có dấu hiệu.
            chuyenKy: 'chưa có dấu hiệu chuyển kỷ',
        }),
        theGioiLaGi,
        coGiTonTai: coGiTonTai === null ? null : Object.freeze(coGiTonTai),
        dangTheNao: dongChiSo(view, anh),
        daLech: Object.freeze(view.diBiet.map((d) => Object.freeze({
            nguon: d.nguon,
            tomTat: `${d.thoa} thoả · ${d.cho} chờ · ${d.lech} lệch · ${d.batKha} bất khả`,
        }))),
        dangXayRa: Object.freeze(mach),
        aiDangChuY: aiDangChuY(view),
        tuLanTruoc: tuLanTruoc(view, anh),
        canChuY: canChuY(view),
    });
}
// ─────────────────────────────────────────── ảnh chụp
/**
 * Vật chất hoá ảnh chụp ở RANH GIỚI TICK — [BB] 55.8.
 *
 * Gọi hàm này mỗi tick, không gọi mỗi lần render. Nó cũng là chỗ chuỗi bảy kỷ
 * nguyên dài ra, nên gọi thiếu thì sparkline cụt chứ không sai.
 *
 * [BB] 55.8 — ảnh lưu theo `mode`. Đưa vào một ảnh của tầng khác thì hàm này
 * VỨT nó và dựng ảnh mới, chứ không trộn hai tầng vào một chuỗi.
 */
export function chupBang(view, cu) {
    const hopLe = cu !== null && cu.mode === view.mode && cu.branchId === view.branchId;
    const goc = hopLe ? cu : null;
    const dem = {};
    for (const [k, v] of demTheoKind(view))
        dem[k] = v;
    const chuoi = {};
    if (view.chiSo !== null) {
        const gia = view.chiSo;
        for (const c of CHI_SO) {
            const truoc = goc?.chuoiChiSo[c.khoa] ?? [];
            // Cùng một tick chụp hai lần không được đẻ ra hai điểm.
            const dayLai = goc !== null && goc.tickTinh === view.tick && truoc.length > 0;
            const them = [...(dayLai ? truoc.slice(0, -1) : truoc), Math.round(gia[c.khoa] ?? 0)];
            chuoi[c.khoa] = them.slice(-SO_DIEM_SPARKLINE);
        }
    }
    return BangSnapshotSchema.parse({
        branchId: view.branchId,
        tickTinh: view.tick,
        mode: view.mode,
        dem,
        chuoiChiSo: chuoi,
        tickXemCuoi: goc?.tickXemCuoi ?? null,
        lucXem: goc?.lucXem ?? undefined,
        ghim: goc?.ghim ?? undefined,
        thuGon: goc?.thuGon ?? undefined,
    });
}
/**
 * Ghi mốc "đã xem" — nguồn của vùng "Từ lần trước" ở lần mở SAU.
 *
 * [BB] 55.4 — mốc là *lần cuối người chơi mở Bảng*. Nên hàm này được gọi khi
 * bảng ĐÓNG, không phải khi nó mở: gọi lúc mở thì diff tự xoá chính nó trước khi
 * người chơi kịp đọc.
 */
export function danhDauDaXem(anh, view) {
    const machGiaiDoan = {};
    for (const m of view.machTruyen)
        machGiaiDoan[m.id] = m.giaiDoan;
    const demChiSo = {};
    if (view.chiSo !== null) {
        const gia = view.chiSo;
        for (const c of CHI_SO)
            demChiSo[`chiSo.${c.khoa}`] = Math.round(gia[c.khoa] ?? 0);
    }
    return BangSnapshotSchema.parse({
        ...anh,
        tickXemCuoi: view.tick,
        lucXem: {
            luat: tenTheoKind(view, 'law'),
            khaiNiem: tenTheoKind(view, 'concept'),
            than: tenTheoKind(view, 'deity'),
            machGiaiDoan,
            dem: demChiSo,
        },
    });
}
/**
 * Thanh Thiên Tượng — 55.2.
 *
 * Bốn cụm mặc định của đặc tả, và [MR] cho phép người chơi ghim thêm. Ghim đọc
 * từ ảnh chụp nên nó sống qua lần đóng tab, đúng "trạng thái lưu theo save" (58.2).
 */
export function thanhThienTuong(bang, ghim = []) {
    const ra = [
        { id: 'khi_nao', nhan: 'Thời điểm', gia: bang.khiNao.moTaThoiDiem, delta: null, tangLaTot: true },
    ];
    for (const c of bang.dangTheNao ?? []) {
        if (c.khoa !== 'thucTai' && c.khoa !== 'songDong' && !ghim.includes(c.khoa))
            continue;
        ra.push({
            id: c.khoa,
            nhan: c.nhan,
            gia: String(c.gia),
            delta: c.delta,
            tangLaTot: c.tangLaTot,
        });
    }
    const caoTrao = bang.dangXayRa.filter((m) => m.giaiDoan === 'cao_trao').length;
    if (bang.dangXayRa.length > 0) {
        ra.push({
            id: 'mach',
            nhan: 'Mạch truyện',
            gia: caoTrao > 0 ? `${bang.dangXayRa.length}, ${caoTrao} đang cao trào` : String(bang.dangXayRa.length),
            delta: null,
            tangLaTot: true,
        });
    }
    if (bang.canChuY.length > 0) {
        ra.push({
            id: 'can_chu_y',
            nhan: 'Cần chú ý',
            gia: String(bang.canChuY.length),
            delta: null,
            // Nhiều việc đang chờ hơn KHÔNG phải chuyện tốt.
            tangLaTot: false,
        });
    }
    return Object.freeze(ra);
}
