import { bacTheoKyNang, NHAN_BAC_NGHE, NGUONG_BAC } from '../schema/aspect/pham.js';
import { phamThan, viecKhongLamDuoc } from './thanThe.js';
import { dat, hong, loi } from '../contracts/errors.js';
export function sinhKeCua(e) {
    const a = e?.aspects['sinh_ke'];
    return a && typeof a === 'object' ? a : undefined;
}
function docAspect(e, ten) {
    const a = e?.aspects[ten];
    return a && typeof a === 'object' ? a : undefined;
}
const set = (id, path, value, evId) => ({
    op: 'set',
    target: { table: 'entities', id, path },
    value,
    sourceEventId: evId,
});
/**
 * Kỹ năng của ĐÚNG nghề đang làm, và khóa để ghi lại vào.
 *
 * `mortal.kyNang` là một record tự do, và thế giới đang có hai quy ước: fixture
 * đặt tên theo nghề (`dan_luoi: 62`), còn `vatChatHoa()` của Phase 5 đặt
 * `nghe_chinh`. Đọc cứng một khóa thì một nửa dân số có tay nghề bằng 0 trong
 * khi bậc của họ là "thợ cả" — và không ai thấy, vì cả hai con số đều tồn tại.
 *
 * Nên: đọc theo tên nghề trước, rồi `nghe_chinh`, rồi lấy kỹ năng cao nhất đang
 * có. Ghi thì luôn ghi vào khóa đã đọc, để không sinh thêm một quy ước thứ ba.
 */
export function kyNangCuaNghe(m, ngheId) {
    const bang = m?.kyNang ?? {};
    const theoNghe = ngheId === null ? undefined : ngheId.replace(/^nghe_/, '');
    if (theoNghe !== undefined && typeof bang[theoNghe] === 'number') {
        return { khoa: theoNghe, giaTri: bang[theoNghe] };
    }
    if (ngheId !== null && typeof bang[ngheId] === 'number') {
        return { khoa: ngheId, giaTri: bang[ngheId] };
    }
    if (typeof bang['nghe_chinh'] === 'number')
        return { khoa: 'nghe_chinh', giaTri: bang['nghe_chinh'] };
    const cap = Object.entries(bang).sort((a, b) => b[1] - a[1])[0];
    return cap ? { khoa: cap[0], giaTri: cap[1] } : { khoa: theoNghe ?? 'nghe_chinh', giaTri: 0 };
}
/** Việc mà nghề này đòi thân thể phải làm được. */
const VIEC_CUA_NGHE = Object.freeze({
    nghe_lam_ruong: ['lam_viec_nang'],
    nghe_dan_luoi: ['mang_vac'],
    nghe_gom: ['che_tac'],
    nghe_moc: ['che_tac', 'mang_vac'],
    nghe_san: ['di_xa', 'chay'],
    nghe_buon: ['di_xa'],
    nghe_chua: ['gan_nguoi_khac'],
});
/**
 * Hôm nay có làm được nghề này không, và nếu không thì vì sao.
 *
 * Trả câu tiếng Việt chứ không trả boolean: chỗ gọi nó là Sổ Tay và bộ thu
 * affordance, cả hai đều cần **lý do**, không cần một chữ `false`.
 */
export function canTroLamNghe(e, ngheId) {
    const m = phamThan(e);
    const cam = new Set(viecKhongLamDuoc(m));
    const doi = VIEC_CUA_NGHE[ngheId] ?? [];
    for (const v of doi) {
        if (!cam.has(v))
            continue;
        if (v === 'che_tac')
            return 'Tay chưa làm được việc tinh.';
        if (v === 'mang_vac')
            return 'Chưa mang vác được.';
        if (v === 'di_xa' || v === 'chay')
            return 'Chân chưa đi xa được.';
        if (v === 'lam_viec_nang')
            return 'Không còn sức làm việc nặng.';
        if (v === 'gan_nguoi_khac')
            return 'Còn đang lây, không nên gần người.';
        return 'Thân thể chưa cho phép.';
    }
    const sk = sinhKeCua(e);
    if (sk?.biCamBoiId)
        return 'Đang bị cấm hành nghề.';
    return null;
}
/**
 * Làm một nhịp. Trả patch cho người làm; kho hộ do `ho.ts` cộng vào.
 *
 * Sản lượng phụ thuộc **kỹ năng của người** và **kỹ thuật của vùng**, không phụ
 * thuộc một hằng số. Một thợ giỏi ở vùng lạc hậu vẫn làm ra ít hơn thợ trung
 * bình ở vùng có nghề — đó là điều đúng, và nó làm việc di cư có nghĩa.
 */
export function lamMotNhip(state, e, nc, soBuocGop = 1) {
    const sk = sinhKeCua(e);
    const m = phamThan(e);
    if (!sk || !m || sk.ngheId === null) {
        return { patches: [], sanLuong: 0, lyDoNghi: 'Chưa có nghề nào để làm.', lenBac: null };
    }
    const can = canTroLamNghe(e, sk.ngheId);
    if (can !== null)
        return { patches: [], sanLuong: 0, lyDoNghi: can, lenBac: null };
    const noi = sk.noiLamId ? state.entities.get(sk.noiLamId) : undefined;
    const kt = docAspect(noi, 'kinh_te');
    const kyThuatVung = Math.max(5, Math.min(100, kt?.kyThuat ?? 20));
    const kn = kyNangCuaNghe(m, sk.ngheId);
    const kyNang = Math.max(0, Math.min(100, kn.giaTri));
    // Trần vùng có thật: không ai làm ra thứ mà cả vùng chưa biết làm.
    const hieuQua = (kyNang * 0.6 + kyThuatVung * 0.4) / 100;
    const sanLuong = Math.round(hieuQua * 10 * soBuocGop * 100) / 100;
    const patches = [
        set(e.id, 'aspects.sinh_ke.soNhipDaLam', sk.soNhipDaLam + soBuocGop, nc.eventId),
        set(e.id, 'aspects.sinh_ke.thuNhapGanNhat', sanLuong, nc.eventId),
        // Làm việc thì mệt. Đây là chỗ thân thể và sinh kế nối vào nhau.
        set(e.id, 'aspects.mortal.thanThe.theLuc', Math.max(0, Math.round(m.thanThe.theLuc - 4 * soBuocGop)), nc.eventId),
    ];
    // ── tiến bộ ──
    // Có thầy thì nhanh hơn hẳn; càng giỏi càng khó lên. Cả hai đều đúng với đời thật.
    const coThay = sk.thayId !== null && state.entities.has(sk.thayId);
    const kho = 1 + kyNang / 45;
    const tang = ((coThay ? 1.8 : 1) * soBuocGop) / kho;
    const kyNangMoi = Math.min(100, Math.round((kyNang + tang) * 100) / 100);
    patches.push(set(e.id, `aspects.mortal.kyNang.${kn.khoa}`, kyNangMoi, nc.eventId));
    // ── công nhận bậc ──
    // Bậc đi SAU kỹ năng, và chỉ lên khi đã làm đủ lâu để người ta thấy.
    let lenBac = null;
    const bacDu = bacTheoKyNang(kyNangMoi);
    if (bacDu !== sk.bac && NGUONG_BAC[bacDu] > NGUONG_BAC[sk.bac] && sk.soNhipDaLam >= 8) {
        patches.push(set(e.id, 'aspects.sinh_ke.bac', bacDu, nc.eventId));
        lenBac = `${e.ten} được gọi là ${NHAN_BAC_NGHE[bacDu]}.`;
    }
    return { patches, sanLuong, lyDoNghi: null, lenBac };
}
// ─────────────────────────────────────────── học, dạy, đổi nghề
/**
 * Xin học một người.
 *
 * [BB] Học nghề là một QUAN HỆ hai chiều: thầy phải nhận, và thầy có lý do để
 * từ chối. Một hàm `hocNghe(id)` luôn thành công sẽ biến phường nghề thành một
 * cái menu.
 */
export function xinHoc(state, troId, thayId, nc) {
    const tro = state.entities.get(troId);
    const thay = state.entities.get(thayId);
    if (!tro || !thay)
        return hong([loi('intent', 'KHONG_THAY_NGUOI', 'Không tìm thấy người đó.')]);
    const skThay = sinhKeCua(thay);
    const skTro = sinhKeCua(tro);
    if (!skThay || skThay.ngheId === null) {
        return hong([loi('intent', 'THAY_KHONG_CO_NGHE', `${thay.ten} không có nghề gì để dạy.`)]);
    }
    if (NGUONG_BAC[skThay.bac] < NGUONG_BAC.tho_ca) {
        return hong([
            loi('intent', 'THAY_CHUA_DU_BAC', `${thay.ten} còn chưa được gọi là thợ cả; chưa ai học của họ.`, {
                recoverable: true,
            }),
        ]);
    }
    if (skThay.hocTroIds.length >= 6) {
        return hong([loi('intent', 'THAY_DU_TRO', `${thay.ten} đã nhận đủ học trò.`, { recoverable: true })]);
    }
    if (skTro?.thayId === thayId) {
        return hong([loi('intent', 'DA_LA_TRO', 'Đã là học trò của người này rồi.', { recoverable: true })]);
    }
    return dat({
        patches: [
            set(troId, 'aspects.sinh_ke.thayId', thayId, nc.eventId),
            set(troId, 'aspects.sinh_ke.ngheId', skThay.ngheId, nc.eventId),
            set(troId, 'aspects.sinh_ke.noiLamId', skThay.noiLamId, nc.eventId),
            set(troId, 'aspects.sinh_ke.bac', 'hoc_viec', nc.eventId),
            {
                op: 'push',
                target: { table: 'entities', id: thayId, path: 'aspects.sinh_ke.hocTroIds' },
                value: troId,
                sourceEventId: nc.eventId,
            },
        ],
        loiKe: `${thay.ten} nhận ${tro.ten} làm học trò.`,
    });
}
/**
 * Đổi nghề. Kỹ năng cũ KHÔNG mất, nhưng nó không dùng được cho nghề mới.
 *
 * Đây là lý do `ngheDaTung` tồn tại: quay lại nghề cũ sau mười năm phải nhanh hơn
 * học từ đầu, và người ta phải nhớ rằng bạn từng làm nghề ấy.
 */
export function doiNghe(state, nguoiId, ngheMoi, noiLamId, nc) {
    const e = state.entities.get(nguoiId);
    const sk = sinhKeCua(e);
    const m = phamThan(e);
    if (!e || !sk || !m)
        return hong([loi('intent', 'KHONG_PHAI_NGUOI', 'Chỉ con người mới có nghề.')]);
    if (sk.ngheId === ngheMoi) {
        return hong([loi('intent', 'CUNG_MOT_NGHE', 'Đang làm chính nghề đó rồi.', { recoverable: true })]);
    }
    const daTung = sk.ngheDaTung.includes(ngheMoi);
    // Nghề cũ quay lại: giữ một phần tay nghề CỦA CHÍNH NGHỀ ẤY. Nghề mới hẳn:
    // về gần vạch xuất phát — tay nghề cũ không mất, nó chỉ không dùng được ở đây.
    const knCu = kyNangCuaNghe(m, ngheMoi);
    const knMoi = kyNangCuaNghe(m, ngheMoi);
    const kyNangMoi = daTung ? Math.max(5, Math.round(knCu.giaTri * 0.55)) : 5;
    const luu = sk.ngheId === null ? sk.ngheDaTung : [...new Set([...sk.ngheDaTung, sk.ngheId])].slice(-8);
    return dat({
        patches: [
            set(nguoiId, 'aspects.sinh_ke.ngheDaTung', luu, nc.eventId),
            set(nguoiId, 'aspects.sinh_ke.ngheId', ngheMoi, nc.eventId),
            set(nguoiId, 'aspects.sinh_ke.noiLamId', noiLamId, nc.eventId),
            set(nguoiId, 'aspects.sinh_ke.bac', daTung ? sk.bac : 'hoc_viec', nc.eventId),
            set(nguoiId, 'aspects.sinh_ke.soNhipDaLam', 0, nc.eventId),
            set(nguoiId, 'aspects.sinh_ke.thayId', null, nc.eventId),
            set(nguoiId, `aspects.mortal.kyNang.${knMoi.khoa}`, kyNangMoi, nc.eventId),
            set(nguoiId, 'aspects.mortal.ngheId', ngheMoi, nc.eventId),
        ],
        loiKe: daTung
            ? `${e.ten} quay lại nghề cũ. Tay vẫn còn nhớ ít nhiều.`
            : `${e.ten} bỏ nghề, bắt đầu lại từ đầu.`,
    });
}
/**
 * Truyền nghề — [BB] 70.2, và là một trong hai cách rõ nhất để "một đời bình
 * thường vẫn để lại di sản" (cổng Phase 7).
 *
 * Không phải phép cộng kỹ năng: nó **kết thúc** quan hệ thầy trò và ghi vào
 * tiếng tăm của cả hai. Học trò tự đi tiếp bằng `soNhipDaLam` của chính mình.
 */
export function truyenNghe(state, thayId, troId, nc) {
    const thay = state.entities.get(thayId);
    const tro = state.entities.get(troId);
    const skThay = sinhKeCua(thay);
    const skTro = sinhKeCua(tro);
    if (!thay || !tro || !skThay || !skTro) {
        return hong([loi('intent', 'KHONG_THAY_NGUOI', 'Không tìm thấy người đó.')]);
    }
    if (skTro.thayId !== thayId) {
        return hong([loi('intent', 'KHONG_PHAI_TRO', `${tro.ten} không phải học trò của ${thay.ten}.`)]);
    }
    const kyNangTro = kyNangCuaNghe(phamThan(tro), skTro.ngheId).giaTri;
    if (kyNangTro < NGUONG_BAC.tho_ban) {
        return hong([
            loi('intent', 'TRO_CHUA_DU', `${tro.ten} chưa đủ tay nghề để ra nghề.`, { recoverable: true }),
        ]);
    }
    return dat({
        patches: [
            set(troId, 'aspects.sinh_ke.thayId', null, nc.eventId),
            set(troId, 'aspects.sinh_ke.bac', bacTheoKyNang(kyNangTro), nc.eventId),
            set(thayId, 'aspects.sinh_ke.hocTroIds', skThay.hocTroIds.filter((x) => x !== troId), nc.eventId),
            {
                op: 'push',
                target: { table: 'entities', id: thayId, path: 'aspects.can_cuoc.tiengTam' },
                value: `Đã truyền nghề cho ${tro.ten}.`,
                sourceEventId: nc.eventId,
            },
            {
                op: 'add',
                target: { table: 'entities', id: thayId, path: 'aspects.can_cuoc.duocNhoBoi' },
                value: 4,
                sourceEventId: nc.eventId,
            },
            {
                op: 'push',
                target: { table: 'entities', id: troId, path: 'aspects.can_cuoc.tiengTam' },
                value: `Học nghề của ${thay.ten}.`,
                sourceEventId: nc.eventId,
            },
        ],
        loiKe: `${tro.ten} ra nghề. ${thay.ten} không còn gì để dạy nữa.`,
    });
}
