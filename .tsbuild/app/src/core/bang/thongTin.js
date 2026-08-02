import { R } from '../registry/index.js';
import { docNguonGoc, NHAN_NGUON_SINH, NHOM_NGUON } from '../schema/aspect/provenance.js';
import { nhanGiaiDoan } from './thienDien.js';
// ─────────────────────────────────────────── tab
export const TAB_THONG_TIN = ['tong_quan', 'quy_luat', 'tao_vat', 'than_he', 'mach_truyen', 'ta'];
/**
 * Nhãn tab đổi theo tầng — [BB] 58.12 hàng cuối.
 *
 * Tab "Ta" của Sáng Thế Thần là hồ sơ về dấu ấn; ở tầng Thần nó là "Thần Vị Của
 * Ta"; ở tầng Phàm Nhân nó là "Đời Ta". Cùng một tab, ba câu hỏi khác nhau, nên
 * cái tên phải khác nhau — dùng chung một nhãn là hứa sai với người chơi.
 */
export function nhanTab(tab, mode) {
    if (tab === 'ta') {
        return mode === 'sang_the' ? 'Ta' : mode === 'than' ? 'Thần Vị Của Ta' : 'Đời Ta';
    }
    const bang = {
        tong_quan: 'Tổng quan',
        quy_luat: 'Quy luật',
        tao_vat: 'Tạo vật',
        than_he: 'Thần hệ',
        mach_truyen: 'Mạch truyện',
    };
    return bang[tab];
}
/** [BB] 58.13 — không dùng "Không có dữ liệu". Mỗi tab có câu rỗng của thế giới. */
export const CAU_RONG = Object.freeze({
    tong_quan: 'Thế giới vừa mở ra. Chưa có gì để tổng kết.',
    quy_luat: 'Chưa có lời nào được nâng thành luật. Thế giới đang sống bằng những nền vô danh.',
    tao_vat: 'Chưa có tạo vật nào mang tên. Những khả thể vẫn nằm trong Tinh Đồ.',
    than_he: 'Các thần chưa kết thành trật tự chung.',
    mach_truyen: 'Chưa có mạch nào được ghim. Thế giới vẫn đang tự kể ở ngoài tầm nhìn.',
    ta: 'Thế giới chưa để lại một tên gọi nào cho bạn.',
});
// ─────────────────────────────────────────── tiện ích
function tenKind(kindId) {
    return R.kind.lay(kindId)?.ten ?? kindId;
}
const NHAN_TANG = Object.freeze({
    sang_the: 'Sáng Thế Thần',
    than: 'Thần',
    pham_nhan: 'Phàm Nhân',
});
/**
 * Phạm vi luật, viết bằng chữ — [BB] 58.13.
 *
 * *"Không hiện raw id, key schema hay tên enum cho người chơi."* Bản đầu của
 * Phase 11 in thẳng `phamVi` ra bảng và người chơi thấy `vu_tru` giữa hai cột
 * tiếng Việt; lỗi ấy bị bắt khi chạy thật trong trình duyệt chứ không phải khi
 * đọc code, nên bảng này tồn tại để không có đường nào lặp lại nó.
 */
const NHAN_PHAM_VI = Object.freeze({
    vu_tru: 'toàn vũ trụ',
    coi: 'một cõi',
    vung: 'một vùng',
    chung_loai: 'một giống loài',
    huyet_mach: 'một huyết mạch',
    ca_the: 'một cá thể',
});
function nhanPhamVi(pv) {
    return NHAN_PHAM_VI[pv] ?? pv.replace(/_/g, ' ');
}
function dongDau(s) {
    const t = s.trim();
    if (t === '')
        return '';
    const cat = t.indexOf('\n');
    return cat < 0 ? t : t.slice(0, cat);
}
function nhomCua(nguon) {
    for (const [nhom, ds] of Object.entries(NHOM_NGUON)) {
        if (ds.includes(nguon))
            return nhom;
    }
    return 'tu_sinh';
}
// ─────────────────────────────────────────── quy luật
/**
 * Tab Quy luật — 58.6 [BB] "phải hiện luật cụ thể".
 *
 * Thứ tự mặc định của 58.6, năm bậc: đang xung đột hoặc vừa yếu đi → mới ban →
 * đang hiệu lực → treo → đã huỷ. Luật đã huỷ **vẫn hiện**, vì vết sẹo của nó có
 * thể còn — xóa nó khỏi bảng là nói dối về chuyện đã rồi.
 */
function dungQuyLuat(view) {
    const ra = [];
    for (const l of view.laws) {
        const e = view.entities.get(l.id);
        const aspect = e?.aspects['lawful'];
        const hieuLuc = typeof aspect?.hieuLuc === 'number' ? aspect.hieuLuc : null;
        const soVanDe = (Array.isArray(aspect?.xungDot) ? aspect.xungDot.length : 0) +
            (Array.isArray(aspect?.ngoaiLe) ? aspect.ngoaiLe.length : 0);
        const trangThai = hieuLuc === null ? 'chưa rõ' : hieuLuc >= 50 ? 'hiệu lực' : hieuLuc > 0 ? 'yếu' : 'treo';
        const ng = e === undefined ? null : docNguonGoc(e.aspects);
        ra.push(Object.freeze({
            id: l.id,
            ten: l.ten,
            // [BB] 18.2 — `vanBan` là null ở tầng phàm nhân; ở đó câu luật là bản
            // diễn giải của vùng, tức bản đã sai, và bảng phải hiện đúng bản ấy.
            cau: dongDau(l.vanBan ?? l.dienGiai),
            tang: l.phamVi === 'vu_tru' ? 'luật vũ trụ' : `luật ${nhanPhamVi(l.phamVi)}`,
            trangThai,
            hieuLuc,
            phamVi: nhanPhamVi(l.phamVi),
            nguon: ng === null ? 'không còn dấu vết nguồn' : NHAN_NGUON_SINH[ng.nguon],
            soVanDe,
            doLech: Math.round(l.doLech),
        }));
    }
    const bac = (h) => {
        if (h.soVanDe > 0)
            return 0;
        if (h.trangThai === 'hiệu lực')
            return 2;
        if (h.trangThai === 'yếu')
            return 1;
        if (h.trangThai === 'treo')
            return 3;
        return 4;
    };
    ra.sort((a, b) => bac(a) !== bac(b) ? bac(a) - bac(b) : (b.hieuLuc ?? 0) - (a.hieuLuc ?? 0) || (a.id < b.id ? -1 : 1));
    return Object.freeze(ra);
}
// ─────────────────────────────────────────── tạo vật
/** Kind KHÔNG phải "tạo vật": luật và khái niệm có tab riêng, người thường thì quá đông. */
const KHONG_LA_TAO_VAT = new Set(['law', 'concept']);
function dungTaoVat(view) {
    const bac = new Map();
    for (const l of view.links) {
        if (l.daDut)
            continue;
        const ds = bac.get(l.tuId) ?? [];
        ds.push({ den: l.denId, quanHe: l.quanHe, trongSo: l.trongSo });
        bac.set(l.tuId, ds);
    }
    const ra = [];
    for (const e of view.entities.values()) {
        if (KHONG_LA_TAO_VAT.has(e.kind))
            continue;
        const ng = docNguonGoc(e.aspects);
        const lk = (bac.get(e.id) ?? [])
            .sort((a, b) => b.trongSo - a.trongSo)
            .slice(0, 2)
            .map((x) => `${x.quanHe} → ${view.entities.get(x.den)?.ten ?? 'ai đó'}`);
        const dom = e.aspects['domain'];
        const car = e.aspects['carrier'];
        const anhHuong = [
            ...(dom?.domains ?? []).map((d) => d.ten ?? '').filter((s) => s !== ''),
            ...(car?.khaiNiemIds ?? []).map((id) => view.entities.get(id)?.ten ?? '').filter((s) => s !== ''),
        ].slice(0, 3);
        const sp = e.aspects['spatial'];
        const noi = sp?.viTriId === undefined ? '' : (view.entities.get(sp.viTriId)?.ten ?? '');
        ra.push(Object.freeze({
            id: e.id,
            ten: e.ten,
            kindId: e.kind,
            loai: tenKind(e.kind),
            nguonSinh: NHAN_NGUON_SINH[ng.nguon],
            nhomNguon: nhomCua(ng.nguon),
            // [BB] 58.7 — entity đã bị THU không biến mất, nó chuyển sang "đã mất".
            trangThai: e.daBopMeo ? 'chỉ nghe kể' : e.mucRo === 'ro' ? 'tồn tại' : 'thấy mờ',
            anhHuong: Object.freeze(anhHuong),
            noiHienDien: noi === '' ? 'không định xứ' : noi,
            lienKetLon: Object.freeze(lk),
        }));
    }
    ra.sort((a, b) => (a.ten < b.ten ? -1 : a.ten > b.ten ? 1 : a.id < b.id ? -1 : 1));
    return Object.freeze(ra);
}
// ─────────────────────────────────────────── thần hệ
function dungThanHe(view) {
    const ra = [];
    for (const e of view.entities.values()) {
        if (e.kind !== 'pantheon')
            continue;
        const inst = e.aspects['institutional'];
        const thanhVien = inst?.thanhVienIds ?? [];
        const domain = new Map();
        for (const id of thanhVien) {
            const tv = view.entities.get(id);
            const dom = tv?.aspects['domain'];
            for (const d of dom?.domains ?? []) {
                if (d.ten === undefined)
                    continue;
                domain.set(d.ten, (domain.get(d.ten) ?? 0) + (d.domainStrength ?? 0));
            }
        }
        const dau = inst?.nguoiDungDauId;
        ra.push(Object.freeze({
            id: e.id,
            ten: e.ten,
            moHinh: inst?.moHinhCaiTri ?? 'chưa thành hình',
            // 58.8 — tranh chấp thì ghi "tranh ngôi", không để trống.
            ngoiDau: dau === undefined || dau === null || dau === ''
                ? 'khuyết'
                : (view.entities.get(dau)?.ten ?? 'tranh ngôi'),
            soThanhVien: thanhVien.length,
            domainTroi: Object.freeze([...domain.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([ten]) => ten)),
            phamVi: e.moTa === '' ? 'chưa rõ phạm vi' : e.moTa,
        }));
    }
    ra.sort((a, b) => (a.ten < b.ten ? -1 : 1));
    return Object.freeze(ra);
}
// ─────────────────────────────────────────── mạch truyện
function dungMach(view, tc) {
    const ghim = new Set(tc.theoDoiMachIds ?? []);
    const ra = view.machTruyen.map((m) => Object.freeze({
        id: m.id,
        ten: m.ten,
        loai: m.loai,
        giaiDoan: nhanGiaiDoan(m.giaiDoan),
        cangThang: Math.round(m.cangThang),
        nhanVatChinh: Object.freeze(m.nhanVat.slice(0, 3).map((n) => n.ten)),
        soNutChuaGo: m.nutThatChuaGo.length,
        daBiet: m.nguoiChoiBiet,
        dangTheoDoi: ghim.has(m.id),
        dangXem: (tc.machDangChieuId ?? null) === m.id,
    }));
    // 58.9 — ba nhóm: đang theo dõi, đang cao trào, còn lại.
    const bac = (h) => (h.dangTheoDoi ? 0 : h.giaiDoan === 'cao_trao' ? 1 : 2);
    return Object.freeze([...ra].sort((a, b) => bac(a) !== bac(b) ? bac(a) - bac(b) : b.cangThang - a.cangThang || (a.id < b.id ? -1 : 1)));
}
// ─────────────────────────────────────────── tab Ta
/**
 * Tab Ta — 58.10.
 *
 * [BB] "Cột Sáng Thế Thần không có cấp độ, kinh nghiệm, HP, mana hay 'điểm quyền
 * năng'. Đây là hồ sơ về **bản thể, dấu ấn và hệ quả**." Nên không có một con số
 * năng lực nào trong kiểu `TabTa` — không phải vì component quên in nó ra, mà vì
 * không có trường nào để in.
 *
 * [BB] "Chuỗi này phải lấy từ link và event có thật." Chuỗi hệ quả dưới đây đi
 * theo cạnh đồ thị đã chiếu, dừng ở năm bước, và không có nhánh nào sinh ra một
 * mắt xích không có trong `view.links`.
 */
function dungTa(view) {
    const chuThe = view.chuTheId === null ? undefined : view.entities.get(view.chuTheId);
    const dauAn = [];
    for (const e of view.entities.values()) {
        const ng = docNguonGoc(e.aspects);
        const laCuaTa = ng.nguon === 'nguoi_choi' || (view.chuTheId !== null && ng.actorId === view.chuTheId);
        if (!laCuaTa)
            continue;
        if (e.id === view.chuTheId)
            continue;
        dauAn.push({ ten: e.ten, loai: tenKind(e.kind), tick: ng.tick });
    }
    dauAn.sort((a, b) => (b.tick !== a.tick ? b.tick - a.tick : a.ten < b.ten ? -1 : 1));
    const ven = chuThe?.aspects['venerable'];
    const heQua = [];
    if (view.chuTheId !== null) {
        const toi = new Map();
        for (const l of view.links) {
            if (l.daDut)
                continue;
            const ds = toi.get(l.tuId) ?? [];
            ds.push({ den: l.denId, quanHe: l.quanHe });
            toi.set(l.tuId, ds);
        }
        for (const goc of dauAn.slice(0, 3)) {
            const batDau = [...view.entities.values()].find((e) => e.ten === goc.ten);
            if (batDau === undefined)
                continue;
            const buoc = [];
            const daQua = new Set([batDau.id]);
            let hienTai = batDau.id;
            // Năm hệ quả là trần của 58.10; đi sâu hơn thì chuỗi thành cây phả hệ.
            for (let i = 0; i < 5; i++) {
                const canh = (toi.get(hienTai) ?? []).find((c) => !daQua.has(c.den));
                if (canh === undefined)
                    break;
                const den = view.entities.get(canh.den);
                if (den === undefined)
                    break;
                buoc.push(`${canh.quanHe} → ${den.ten}`);
                daQua.add(canh.den);
                hienTai = canh.den;
            }
            if (buoc.length > 0)
                heQua.push(Object.freeze({ moc: goc.ten, cacBuoc: Object.freeze(buoc) }));
        }
    }
    return Object.freeze({
        // 58.5 — chưa đặt danh xưng thì hiện "Kẻ Không Tên", không để trống.
        danhXung: chuThe?.ten ?? 'Kẻ Không Tên',
        banThe: chuThe === undefined ? 'không nhập thể' : tenKind(chuThe.kind),
        trangThai: view.dangHoaThan ? 'đang hóa thân' : chuThe === undefined ? 'đang quan sát' : 'đang nhập thể',
        dauAn: Object.freeze(dauAn.slice(0, 30)),
        theGianGoi: Object.freeze(ven?.danhXungKhac !== undefined && ven.danhXungKhac.length > 0
            ? [...ven.danhXungKhac]
            : ['Chưa có ai trong thế giới gọi tên bạn']),
        heQua: Object.freeze(heQua),
    });
}
// ─────────────────────────────────────────── cửa chính
/** [BB] 58.12 — tham số thế giới duy nhất là `WorldView`. */
export function tinhBangThongTin(view, tc = {}) {
    const quyLuat = dungQuyLuat(view);
    const taoVat = dungTaoVat(view);
    const thanHe = dungThanHe(view);
    const machTruyen = dungMach(view, tc);
    const ta = dungTa(view);
    const demChip = new Map();
    for (const t of taoVat)
        demChip.set(t.kindId, (demChip.get(t.kindId) ?? 0) + 1);
    return Object.freeze({
        mode: view.mode,
        daiDinhVi: Object.freeze({
            theGioi: tc.tenTheGioi ?? 'Thiên Diễn',
            thoiDiem: view.thoiCuoc.moTaThoiDiem,
            nhanh: tc.tenNhanh ?? view.branchId,
            tangChoi: view.chuTheId === null
                ? NHAN_TANG[view.mode]
                : `${NHAN_TANG[view.mode]} · ${view.entities.get(view.chuTheId)?.ten ?? ''}`,
            ongKinh: tc.machDangChieuId == null
                ? 'chưa chiếu mạch nào'
                : (view.machTruyen.find((m) => m.id === tc.machDangChieuId)?.ten ?? 'một mạch chưa biết tên'),
        }),
        dem: Object.freeze({
            tong_quan: 0,
            quy_luat: quyLuat.length,
            tao_vat: taoVat.length,
            than_he: thanHe.length,
            mach_truyen: machTruyen.length,
            ta: ta.dauAn.length,
        }),
        quyLuat,
        taoVat,
        thanHe,
        machTruyen,
        ta,
        chipLoai: Object.freeze([...demChip.entries()]
            .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0] < b[0] ? -1 : 1))
            // [BB] 58.7 — chip dựng từ `R.kind`, nên kind do mod thêm tự có chip mà
            // không ai phải sửa component.
            .map(([kindId, so]) => Object.freeze({ kindId, nhan: tenKind(kindId), so }))),
    });
}
/**
 * Ô tìm chung — 58.11.
 *
 * "Nhập 'đêm' có thể trả về luật về đêm, thần giữ domain đêm, thần khí liên quan
 * và mạch đang tranh domain đó." Nên nó tìm trên nhiều trường, và [BB] 58.12 bắt
 * nó chạy **sau chiếu**: nguồn duy nhất là `bang`, thứ đã đi qua `WorldView`.
 */
export function timTrongBang(bang, q) {
    const tu = q.trim().toLowerCase();
    if (tu === '')
        return Object.freeze([]);
    const ra = [];
    const co = (...ds) => ds.some((s) => typeof s === 'string' && s.toLowerCase().includes(tu));
    for (const l of bang.quyLuat) {
        if (co(l.ten, l.cau))
            ra.push({ tab: 'quy_luat', id: l.id, ten: l.ten, vi: l.trangThai });
    }
    for (const t of bang.taoVat) {
        if (co(t.ten, t.loai, ...t.anhHuong)) {
            ra.push({ tab: 'tao_vat', id: t.id, ten: t.ten, vi: `${t.loai} · ${t.nguonSinh}` });
        }
    }
    for (const p of bang.thanHe) {
        if (co(p.ten, p.moHinh, ...p.domainTroi)) {
            ra.push({ tab: 'than_he', id: p.id, ten: p.ten, vi: `${p.soThanhVien} thành viên` });
        }
    }
    for (const m of bang.machTruyen) {
        if (co(m.ten, m.loai, ...m.nhanVatChinh)) {
            ra.push({ tab: 'mach_truyen', id: m.id, ten: m.ten, vi: m.giaiDoan });
        }
    }
    ra.sort((a, b) => (a.ten < b.ten ? -1 : a.ten > b.ten ? 1 : a.id < b.id ? -1 : 1));
    return Object.freeze(ra.slice(0, 40));
}
