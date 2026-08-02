import { BAN_TINH_TRUC } from '../schema/aspect/soul.js';
import { DivineIdentitySchema, khoangCachBanTinh, hinhHienTai, EVENT_DUOC_SUA_CORESELF, } from '../schema/aspect/thanVi.js';
/** Nhãn tiếng Việt của từng trục, dùng cho mô tả tình huống và cho UI. */
export const NHAN_TRUC = Object.freeze({
    tuBi_tanNhan: ['từ bi', 'tàn nhẫn'],
    kieuNgao_khiemNhuong: ['kiêu ngạo', 'khiêm nhường'],
    trungThanh_phanTrac: ['trung thành', 'phản trắc'],
    ducVong_tietChe: ['dục vọng', 'tiết chế'],
    tratTu_phongTung: ['trật tự', 'phóng túng'],
    canDam_khiepNhuoc: ['can đảm', 'khiếp nhược'],
});
/** Tên của một cực trên trục, theo dấu của giá trị. */
export function tenCuc(truc, giaTri) {
    const [am, duong] = NHAN_TRUC[truc];
    return giaTri >= 0 ? duong : am;
}
/** Dựng bản ngã ban đầu từ `soul` và `venerable` đã có — dùng khi gieo và khi migrate. */
export function banNgaTu(banTinh, ven) {
    const anh = ven?.banTinhTinDoTin ?? banTinh;
    return DivineIdentitySchema.parse({
        coreSelf: { ...banTinh },
        followerImage: { ...anh },
        currentManifestation: hinhHienTai(banTinh, anh, ven?.hienThanh ?? 20),
        officialDoctrine: [],
    });
}
/**
 * Đo khoảng cách giữa lõi và hình ảnh tín đồ.
 *
 * `suppressed` là nét vị thần CÓ mà tín đồ không cho phép; `demanded` là nét tín
 * đồ ĐÒI mà vị thần không có. Hai danh sách này là thứ UI hiện ra ở hai dòng
 * cuối của Bảng Lãnh Địa (56.4), và là thứ làm người chơi thấy mình đang bị nặn.
 */
export function doApLuc(bn, nguong = 12) {
    const suppressed = [];
    const demanded = [];
    let trucNang = null;
    let lechNang = 0;
    for (const truc of BAN_TINH_TRUC) {
        const loi = bn.coreSelf[truc] ?? 0;
        const anh = bn.followerImage[truc] ?? 0;
        const d = anh - loi;
        if (Math.abs(d) < nguong)
            continue;
        // Tín đồ kéo về phía nào thì phía đó là "đòi hỏi"; phía ngược lại bị đè.
        if (Math.abs(d) > Math.abs(lechNang)) {
            lechNang = d;
            trucNang = truc;
        }
        demanded.push(truc);
        if (Math.abs(loi) >= nguong)
            suppressed.push(truc);
    }
    return {
        distortion: khoangCachBanTinh(bn.coreSelf, bn.followerImage),
        suppressedTraits: suppressed,
        demandedTraits: demanded,
        trucNang,
        lech: lechNang,
    };
}
/**
 * Hình ảnh tín đồ trôi theo những gì họ ĐƯỢC QUY KẾT là do vị thần làm.
 *
 * Không trôi theo hành động thật của vị thần — trôi theo hành động mà người ta
 * *tin* là của vị thần. Đó là lý do một vị thần không làm gì cả vẫn có thể bị
 * biến thành thần chiến tranh.
 */
export function troiHinhAnh(anhHienTai, sacThaiSuKien, toc) {
    const ra = { ...anhHienTai };
    for (const truc of BAN_TINH_TRUC) {
        const dich = sacThaiSuKien[truc];
        if (typeof dich !== 'number')
            continue;
        ra[truc] = Math.round(Math.max(-100, Math.min(100, (ra[truc] ?? 0) + (dich - (ra[truc] ?? 0)) * toc)));
    }
    return ra;
}
/** Mô tả một tình huống Dị Hóa bằng tiếng Việt kể được. */
export function moTaTinhHuong(tenThan, truc, lech) {
    const hoDoi = tenCuc(truc, lech);
    const nguoiThat = tenCuc(truc, -lech);
    return (`Tín đồ của ${tenThan} càng ngày càng kể về một vị thần ${hoDoi}. ` +
        `${tenThan} vốn ${nguoiThat} — và không ai hỏi ${tenThan} nghĩ gì về chuyện đó.`);
}
/**
 * Áp một cách đáp lên vị thần.
 *
 * [BB] Đây là hàm DUY NHẤT trong toàn bộ Phase 6 được phép sinh patch chạm
 * `ban_nga.coreSelf`, và nó luôn ghi kèm một dòng vào `lichSuLoi` có `eventId`.
 * Bất biến `coreself_co_giai_thich` kiểm rằng hai thứ đó luôn đi cùng nhau.
 */
export function dapDiHoa(than, bn, truc, cach, ctx) {
    const id = than.id;
    const loi = bn.coreSelf[truc] ?? 0;
    const anh = bn.followerImage[truc] ?? 0;
    const set = (path, value) => ({
        op: 'set',
        target: { table: 'entities', id, path },
        value,
        sourceEventId: ctx.eventId,
    });
    const ghiLichSu = (den, lyDo) => ({
        op: 'push',
        target: { table: 'entities', id, path: 'aspects.ban_nga.lichSuLoi' },
        value: { tick: ctx.tick, truc, tu: loi, den, eventId: ctx.eventId, lyDo },
        sourceEventId: ctx.eventId,
    });
    if (cach === 'chap_nhan') {
        // Lõi dịch về phía hình ảnh — nhưng vì NGƯỜI CHƠI đồng ý, không vì tick.
        const toc = ctx.tuning.than.tocDoDiHoa;
        const den = Math.round(loi + (anh - loi) * Math.min(1, toc * 4));
        return {
            patches: [
                set(`aspects.ban_nga.coreSelf.${truc}`, den),
                set(`aspects.soul.banTinh.${truc}`, den),
                ghiLichSu(den, 'chấp nhận điều tín đồ tin'),
            ],
            loaiEvent: 'than_chap_nhan_di_hoa',
            loiKe: `${than.ten} thôi cãi lại. Từ hôm nay ${than.ten} ${tenCuc(truc, den)} thật.`,
            heQua: { lyGiao: false, matQuyKet: 0, sinhPhanThan: false },
        };
    }
    if (cach === 'chong_lai') {
        // Lõi không đổi. Cái đổi là hình ảnh — và cái giá là giáo phái vỡ.
        const anhMoi = Math.round(anh + (loi - anh) * 0.35);
        return {
            patches: [
                set(`aspects.ban_nga.followerImage.${truc}`, anhMoi),
                set('aspects.venerable.doLechDiHoa', Math.max(0, Math.round(bn.pressure.distortion * 0.6))),
            ],
            loaiEvent: 'than_chong_lai_di_hoa',
            loiKe: `${than.ten} phủ nhận điều người ta kể. Một nửa số đền nghe theo; ` +
                `nửa còn lại bắt đầu thờ một vị thần mà họ vẫn gọi bằng tên cũ.`,
            heQua: { lyGiao: true, matQuyKet: 12, sinhPhanThan: false },
        };
    }
    if (cach === 'mac_ca') {
        // Đổi giáo lý: hình ảnh dịch một nửa, lõi giữ nguyên, giáo lý mang vết.
        const anhMoi = Math.round(anh + (loi - anh) * 0.5);
        const dieu = `Về ${NHAN_TRUC[truc][0]} và ${NHAN_TRUC[truc][1]}: điều người ta thấy không phải điều ta là.`;
        return {
            patches: [
                set(`aspects.ban_nga.followerImage.${truc}`, anhMoi),
                {
                    op: 'push',
                    target: { table: 'entities', id, path: 'aspects.ban_nga.officialDoctrine' },
                    value: dieu,
                    sourceEventId: ctx.eventId,
                },
            ],
            loaiEvent: 'than_mac_ca_giao_ly',
            loiKe: `${than.ten} viết thêm một điều vào giáo lý. Điều đó sẽ bị hiểu sai, nhưng chậm hơn.`,
            heQua: { lyGiao: false, matQuyKet: 4, sinhPhanThan: false },
        };
    }
    // phan_than — một bản thể nhận hình ảnh, bản thể kia giữ lõi (69.1).
    return {
        patches: [set('aspects.divisible.doPhanKy', Math.min(100, Math.round(bn.pressure.distortion)))],
        loaiEvent: 'than_phan_than',
        loiKe: `${than.ten} tách làm hai. Một bản thể mang đúng khuôn mặt tín đồ đã dựng; ` +
            `bản thể kia giữ lấy phần không ai muốn nhìn.`,
        heQua: { lyGiao: false, matQuyKet: 0, sinhPhanThan: true },
    };
}
/**
 * Utility AI của thần NPC chọn cách đáp.
 *
 * [BB] 23.2 quy tắc 2 — không chọn điểm cao nhất, mà softmax. Thần luôn tối ưu
 * là thần chết. Thần thỉnh thoảng làm điều dại là thần sống.
 */
export function chonCachDap(bn, rng, nhietDo) {
    const kiemDinh = bn.coreSelf.tratTu_phongTung ?? 0;
    const kieuNgao = bn.coreSelf.kieuNgao_khiemNhuong ?? 0;
    const ap = bn.pressure.distortion;
    const diem = [
        // chấp nhận: dễ với thần khiêm nhường, khó với thần kiêu ngạo
        30 + kieuNgao * 0.3 - ap * 0.2,
        // chống lại: thần kiêu ngạo và có trật tự thì cãi
        20 - kieuNgao * 0.35 + kiemDinh * 0.2,
        // mặc cả: lựa chọn của thần biết điều
        35 + Math.abs(kiemDinh) * 0.1,
        // phân thân: chỉ khi áp lực đã rất lớn
        ap > 55 ? 25 + (ap - 55) * 0.5 : -20,
    ];
    const i = rng.softmax(diem, nhietDo);
    return ['chap_nhan', 'chong_lai', 'mac_ca', 'phan_than'][i] ?? 'mac_ca';
}
