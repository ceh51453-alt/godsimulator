import { nguonGoc } from '../schema/aspect/provenance.js';
function docLawful(e) {
    return e?.aspects['lawful'];
}
function docConcept(e) {
    return e?.aspects['conceptual'];
}
/**
 * Hiệu Lực — sức mạnh của luật là **độ thật của khái niệm nền** (42.4).
 *
 * Trả về cả bảng mắt xích chứ không chỉ con số: panel diff của 42.7 phải hiện
 * từng khái niệm với trọng số và giai đoạn, vì đó là thứ dạy người chơi toàn bộ
 * cơ chế mà không cần đọc hướng dẫn.
 */
export function tinhHieuLuc(luat, s, tuning) {
    const law = docLawful(luat);
    const heSo = tuning.vatLy.heSoVaiTro;
    const manhNoi = (law?.tiepDia ?? []).map((t) => {
        const kn = s.entities.get(t.khaiNiemId);
        const c = docConcept(kn);
        const trongSo = c?.trongSo ?? 0;
        const nguong = c?.nguongKetTinh ?? tuning.khaiNiem.nguongKetTinhMacDinh;
        const chuanHoa = nguong <= 0 ? 0 : Math.min(1, trongSo / nguong);
        return {
            khaiNiemId: t.khaiNiemId,
            ten: kn?.ten ?? t.khaiNiemId,
            vaiTro: t.vaiTro,
            batBuoc: t.batBuoc,
            trongSo,
            nguongKetTinh: nguong,
            giaiDoan: c?.giaiDoan ?? 'chua_ton_tai',
            diem: chuanHoa * heSo[t.vaiTro],
            tonTai: kn !== undefined && kn.tickDiet === null,
        };
    });
    const nen = manhNoi.filter((m) => m.batBuoc);
    if (nen.length === 0) {
        return {
            hieuLuc: 0,
            matXichYeuNhat: null,
            manhNoi,
            loiGiaiThich: 'Luật này chưa khai khái niệm nền nào. Nó sẽ được ghi vào sổ, nhưng thế giới chưa cảm thấy nó.',
        };
    }
    // [BB] MIN, không phải trung bình.
    let yeuNhat = nen[0];
    for (const m of nen)
        if (m.diem < yeuNhat.diem)
            yeuNhat = m;
    const hieuLuc = Math.round(Math.max(0, Math.min(1, yeuNhat.diem)) * 100);
    const loiGiaiThich = hieuLuc === 0
        ? `Luật này sẽ được ghi vào sổ, nhưng thế giới chưa cảm thấy nó. ` +
            `Nó sẽ mạnh dần khi "${yeuNhat.ten}" trở thành một điều có thật ở đây.`
        : hieuLuc < 40
            ? `Luật đang yếu vì "${yeuNhat.ten}" mới manh nha. Kẽ hở của nó sẽ rộng cho tới khi khái niệm ấy nặng hơn.`
            : `Luật đã có răng. Mắt xích yếu nhất hiện là "${yeuNhat.ten}".`;
    return { hieuLuc, matXichYeuNhat: yeuNhat, manhNoi, loiGiaiThich };
}
/**
 * Kiểm tra thứ tám `TIEP_DIA` — 42.6.
 *
 * [BB] "Ở hai chế độ còn lại, kiểm tra 8 **không bao giờ trượt** — nó chỉ tạo
 * khái niệm thiếu và trả về cảnh báo mức `luu_y`. Đúng nguyên tắc 5: không dựng
 * tường trước mặt người chơi."
 */
export function kiemTiepDia(luat, s) {
    const law = docLawful(luat);
    const cheDo = law?.cheDoTiepDia ?? 'tu_tiep_dia';
    const thieu = [];
    const loi = [];
    const canhBao = [];
    for (const t of law?.tiepDia ?? []) {
        const kn = s.entities.get(t.khaiNiemId);
        if (kn === undefined || docConcept(kn) === undefined) {
            thieu.push(t.khaiNiemId);
            continue;
        }
        if (kn.tickDiet !== null) {
            canhBao.push(`Khái niệm nền "${kn.ten}" đã chết. Luật này đang mất chỗ đứng.`);
        }
    }
    if (thieu.length === 0)
        return { dat: true, thieu: [], canTao: [], canhBao, loi: [] };
    if (cheDo === 'chat_che') {
        loi.push(`Chế độ chặt chẽ: luật bị từ chối vì thiếu ${thieu.length} khái niệm nền — ${thieu.join(', ')}. ` +
            'Hãy gieo chúng trước, hoặc đổi sang chế độ tự tiếp địa.');
        return { dat: false, thieu, canTao: [], canhBao, loi };
    }
    canhBao.push(`Thiếu ${thieu.length} khái niệm nền. Engine sẽ tạo chúng ở giai đoạn "hư danh", trọng số 0 — ` +
        'luật tồn tại nhưng hiệu lực gần bằng 0.');
    return { dat: true, thieu, canTao: thieu, canhBao, loi: [] };
}
/**
 * Khái niệm cần tạo ở `hu_danh`, trọng số 0 — 42.3 chế độ `tu_tiep_dia`.
 *
 * Trả về **dữ liệu entity**, không trả về patch: chỗ gọi quyết định gói nó vào
 * Event nào, và mọi thay đổi thế giới vẫn đi qua đúng một đường (transaction).
 */
export function khaiNiemHuDanh(khaiNiemId, branchId, tick, nguong) {
    return {
        id: khaiNiemId,
        branchId,
        kind: 'concept',
        ten: khaiNiemId.replace(/_/g, ' '),
        aliases: [],
        moTa: 'Vừa được đặt tên vì một điều luật cần tới nó. Chưa có nghĩa.',
        tickSinh: tick,
        tickDiet: null,
        aspects: {
            // [BB] 59.1 — hư danh sinh ra vì một điều luật cần tới nó, không do ai nặn.
            provenance: nguonGoc('ket_tinh', tick),
            conceptual: {
                giaiDoan: 'hu_danh',
                trongSo: 0,
                nguongKetTinh: nguong,
                nguon: { yChi: 0, lapLai: 0 },
                sacThai: {},
                phanNghiaId: null,
                cangThang: [],
                ketTinhThanh: 'chua',
                thucTheIds: [],
                tickVaoLuongLu: null,
            },
        },
        tags: ['tu_tiep_dia'],
        _degree: 0,
        _hash: '',
        _version: 0,
    };
}
/**
 * Chế độ `tu_suy` — tìm khái niệm SẴN CÓ trước, chỉ tạo mới khi thật sự không có.
 *
 * Khớp theo tên đã chuẩn hóa và theo alias. Một thế giới đã có "Ô Uế" thì luật về
 * tẩy uế nên bám vào nó chứ không nên đẻ ra một khái niệm song song — hai khái
 * niệm cùng nghĩa chia đôi trọng số, và cả hai cùng yếu.
 */
export function suyKhaiNiemSanCo(canId, s) {
    const chuan = (x) => x
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    const muc = chuan(canId);
    const ungVien = [...s.entities.values()]
        .filter((e) => e.tickDiet === null && docConcept(e) !== undefined)
        .sort((a, b) => (a.id < b.id ? -1 : 1));
    for (const e of ungVien) {
        if (chuan(e.id) === muc || chuan(e.ten) === muc)
            return e.id;
        if (e.aliases.some((a) => chuan(a) === muc))
            return e.id;
    }
    return null;
}
/**
 * Luật nào tụt hiệu lực nếu một khái niệm chết hoặc bị chia đôi — 42.5.
 *
 * "Đây là cách các tôn giáo cổ thật sự chết: không ai bãi bỏ chúng cả — người ta
 * chỉ ngừng hiểu chúng nói gì."
 *
 * Hàm thuần: nó KHÔNG sửa `s`. Nó mô phỏng trọng số mới rồi tính lại, để panel
 * hiện hậu quả trước khi người chơi bấm.
 */
export function anhHuongKhiKhaiNiemYeuDi(s, khaiNiemId, trongSoMoi, tuning) {
    const ra = [];
    const goc = s.entities.get(khaiNiemId);
    if (goc === undefined)
        return ra;
    const c = docConcept(goc);
    if (c === undefined)
        return ra;
    const gia = {
        ...s,
        entities: new Map(s.entities).set(khaiNiemId, {
            ...goc,
            aspects: { ...goc.aspects, conceptual: { ...c, trongSo: trongSoMoi } },
        }),
    };
    for (const e of [...s.entities.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
        const law = docLawful(e);
        if (law === undefined)
            continue;
        if (!law.tiepDia.some((t) => t.khaiNiemId === khaiNiemId))
            continue;
        const truoc = tinhHieuLuc(e, s, tuning).hieuLuc;
        const sau = tinhHieuLuc(e, gia, tuning).hieuLuc;
        if (truoc !== sau)
            ra.push({ luatId: e.id, ten: e.ten, hieuLucTruoc: truoc, hieuLucSau: sau });
    }
    return ra;
}
/**
 * Luật đã chết có sống lại được không — 42.5 [BB] đường ngược lại.
 *
 * Một tà giáo phục dựng nghi lễ cổ làm sống lại một định luật bị lãng quên hàng
 * nghìn năm. Đây là tiền đề của mạch truyện loại `phuc_hung`.
 */
export function coTheHoiSinh(luat, s, tuning) {
    const kq = tinhHieuLuc(luat, s, tuning);
    if (kq.hieuLuc > 0)
        return false;
    const yeu = kq.matXichYeuNhat;
    // Hồi sinh được nếu mắt xích yếu nhất vẫn TỒN TẠI — nuôi lại được thì luật sống lại.
    return yeu !== null && yeu.tonTai;
}
// ─────────────────────────────────────────── panel 42.7
/** Bảng Tiếp Địa cho panel diff — 42.7. */
export function bangTiepDia(kq) {
    const thanh = (m) => {
        const ty = m.nguongKetTinh <= 0 ? 0 : Math.min(1, m.trongSo / m.nguongKetTinh);
        const day = Math.round(ty * 10);
        return '█'.repeat(day) + '░'.repeat(10 - day);
    };
    const nhan = (m) => !m.tonTai
        ? 'vừa được tạo, chưa có nghĩa'
        : m.giaiDoan === 'ket_tinh'
            ? 'đã kết tinh'
            : m.giaiDoan === 'thanh_hinh'
                ? 'đã thành hình'
                : m.giaiDoan === 'manh_nha'
                    ? 'manh nha'
                    : 'chưa có nghĩa';
    const dong = ['TIẾP ĐỊA'];
    for (const m of kq.manhNoi) {
        dong.push(`  ${m.ten.padEnd(16)}${thanh(m)}  trọng số ${m.trongSo} / ${m.nguongKetTinh}   ${nhan(m)}`);
    }
    dong.push('');
    dong.push(`HIỆU LỰC: ${kq.hieuLuc}%` +
        (kq.matXichYeuNhat === null ? '' : `     ← quyết định bởi mắt xích yếu nhất: ${kq.matXichYeuNhat.ten}`));
    dong.push('');
    dong.push(kq.loiGiaiThich);
    return dong.join('\n');
}
