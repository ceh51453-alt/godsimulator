/**
 * Ngân sách token và tự hiệu chỉnh — Phần 34 [BB].
 *
 * ── Vì sao không dùng `length / 4` ──
 *
 * [BB] 34.2 nói thẳng: "Không dùng công thức `length / 4` của tiếng Anh. Tiếng
 * Việt có dấu tokenize tệ hơn nhiều — dùng nhầm sẽ sai ngân sách hàng chục phần
 * trăm." Sai ngân sách theo hướng nào cũng tệ: ước thấp thì prompt bị model cắt
 * cụt giữa Sổ Phục Bút, ước cao thì ta tự vứt nội dung mình có quyền gửi.
 *
 * ── Vì sao tự hiệu chỉnh phải ồn ào ──
 *
 * [BB] 34.3: `finish_reason === 'length'` → giảm ngân sách INPUT của loại call
 * đó 15% và **ghi cảnh báo, KHÔNG IM LẶNG**. Một prompt bị cắt cụt mà không ai
 * biết là cách êm ái nhất để mất Sổ Nhân Quả — vì 33.1 đặt nó ở CUỐI prompt,
 * tức đúng chỗ bị cắt đầu tiên.
 */
import { z } from 'zod';
export const LOAI_CALL = [
    'ke_canh',
    'tick_t2',
    'sinh_ky_nguyen',
    'nen_ky_nguyen',
    'sinh_lorebook',
    'giai_lo_hong',
    'giai_lo_hong_cuoi_ky',
    'hinh_thuc_hoa_luat',
    'thanh_tra_mach_lac',
    'phan_quyet_luat',
    'ung_bien_hanh_dong',
    'rerank_listwise',
];
/** Bảng 34.1, nguyên văn. Con số là DỮ LIỆU, không phải hằng rải trong code (7.1). */
export const NGAN_SACH_MAC_DINH = Object.freeze({
    ke_canh: { inputMin: 100_000, inputMax: 150_000, output: 6_000 },
    tick_t2: { inputMin: 25_000, inputMax: 50_000, output: 15_000 },
    sinh_ky_nguyen: { inputMin: 80_000, inputMax: 150_000, output: 65_000 },
    nen_ky_nguyen: { inputMin: 300_000, inputMax: 1_000_000, output: 40_000 },
    sinh_lorebook: { inputMin: 150_000, inputMax: 300_000, output: 65_000 },
    giai_lo_hong: { inputMin: 50_000, inputMax: 90_000, output: 25_000 },
    giai_lo_hong_cuoi_ky: { inputMin: 200_000, inputMax: 400_000, output: 65_000 },
    hinh_thuc_hoa_luat: { inputMin: 40_000, inputMax: 80_000, output: 8_000 },
    thanh_tra_mach_lac: { inputMin: 60_000, inputMax: 120_000, output: 20_000 },
    phan_quyet_luat: { inputMin: 40_000, inputMax: 60_000, output: 5_000 },
    ung_bien_hanh_dong: { inputMin: 30_000, inputMax: 60_000, output: 6_000 },
    rerank_listwise: { inputMin: 4_000, inputMax: 12_000, output: 2_000 },
});
export const CalibSchema = z
    .object({
    loai: z.enum(LOAI_CALL),
    /** Ký tự trên một token. Tiếng Việt có dấu thường quanh 2.5–3.5. */
    tyLeToken: z.number().min(0.5).max(12).prefault(3.2),
    /** 20 mẫu gần nhất: [ước lượng, thực tế]. */
    mau: z
        .array(z.tuple([z.number(), z.number()]))
        .max(20)
        .prefault([]),
    /** Số call liên tiếp có sai số > 12%. */
    lechLienTiep: z.number().int().min(0).prefault(0),
    /** Hệ số nhân vào `inputMax` — giảm 15% mỗi lần bị cắt cụt (34.3). */
    heSoInput: z.number().min(0.2).max(1).prefault(1),
})
    .strict();
export function calibMoi(loai, tyLeToken = 3.2) {
    return CalibSchema.parse({ loai, tyLeToken });
}
/**
 * [BB] 34.2 — đếm KÝ TỰ chia tỷ lệ đo được, không chia 4.
 *
 * `probe.tyLeTokenDo` (nếu có) thắng `profile.tyLeToken`: một con số đo trên
 * chính model đang dùng luôn đúng hơn một con số khai trong hồ sơ.
 */
export function uocLuong(s, tyLeToken) {
    return Math.ceil(s.length / Math.max(0.5, tyLeToken));
}
/** Ngân sách INPUT còn dùng được cho một loại call, sau tự hiệu chỉnh. */
export function nganSachInput(loai, calib) {
    const dm = NGAN_SACH_MAC_DINH[loai];
    return Math.round(dm.inputMax * (calib?.heSoInput ?? 1));
}
/**
 * Sau mỗi call: so ước lượng với `usage.prompt_tokens` thật.
 *
 * ```
 * saiSo > 0.12 trong 5 call liên tiếp
 *   → điều chỉnh tyLeToken theo trung bình động 20 mẫu gần nhất
 *   → ghi thông báo vào bảng tự chẩn đoán
 * ```
 */
export function tuHieuChinh(calib, uoc, thucTe, finishReason, soKyTu) {
    const canhBao = [];
    let c = calib;
    if (thucTe > 0) {
        const saiSo = Math.abs(uoc - thucTe) / thucTe;
        const mau = [...c.mau, [uoc, thucTe]].slice(-20);
        const lech = saiSo > 0.12 ? c.lechLienTiep + 1 : 0;
        c = CalibSchema.parse({ ...c, mau, lechLienTiep: lech });
        if (lech >= 5) {
            // Trung bình động: tổng ký tự / tổng token thật của 20 mẫu gần nhất.
            const tongKyTu = mau.reduce((t, [u]) => t + u * c.tyLeToken, 0);
            const tongToken = mau.reduce((t, [, x]) => t + x, 0);
            const moi = tongToken > 0 ? tongKyTu / tongToken : c.tyLeToken;
            c = CalibSchema.parse({
                ...c,
                tyLeToken: Math.max(0.5, Math.min(12, moi)),
                lechLienTiep: 0,
            });
            canhBao.push(`Ước lượng token lệch quá 12% năm lượt liền cho "${c.loai}"; ` +
                `tỷ lệ đã chỉnh ${calib.tyLeToken.toFixed(2)} → ${c.tyLeToken.toFixed(2)} ký tự/token.`);
        }
    }
    if (finishReason === 'length') {
        const moi = Math.max(0.2, c.heSoInput * 0.85);
        c = CalibSchema.parse({ ...c, heSoInput: moi });
        canhBao.push(`Model cắt cụt output ở "${c.loai}" (prompt ${soKyTu} ký tự). ` +
            `Đã giảm ngân sách input 15% (còn ${Math.round(moi * 100)}%). ` +
            'Sổ Nhân Quả và Sổ Phục Bút nằm cuối prompt nên chúng là thứ mất đầu tiên.');
    }
    return { calib: c, canhBao };
}
/**
 * Trần token của sáu tầng, theo bảng 33.1.
 *
 * Tỷ lệ, không phải con số cứng: một model 32k và một model 1M cùng dùng bảng
 * này. Điều KHÔNG đổi theo model là THỨ TỰ và tỷ lệ tương đối — ổn định lên đầu
 * để ăn prefix cache, biến động xuống cuối.
 */
export function phanBoSauTang(nganSach) {
    const p = (x) => Math.max(200, Math.round(nganSach * x));
    return Object.freeze([
        { so: 1, ten: 'Lõi bất biến', onDinh: true, tranToken: p(0.22) },
        { so: 2, ten: 'Mythos pack đang bật', onDinh: true, tranToken: p(0.18) },
        { so: 3, ten: 'Biên niên sử kỷ nguyên', onDinh: true, tranToken: p(0.16) },
        { so: 4, ten: 'Mạch truyện đang chiếu', onDinh: false, tranToken: p(0.14) },
        { so: 5, ten: 'Hồ sơ T2 và phe phái', onDinh: false, tranToken: p(0.17) },
        // Tầng 6 nhỏ nhất về trần nhưng ĐỨNG CUỐI, tức chỗ model nhìn rõ nhất (33.1).
        { so: 6, ten: 'Cảnh, cầu nguyện, Sổ Nhân Quả, Sổ Phục Bút', onDinh: false, tranToken: p(0.13) },
    ]);
}
/**
 * Cắt theo trần từng tầng và GHI LẠI thứ bị cắt.
 *
 * [BB] Cổng Phase 8: "token budget có trace block bị cắt." Cắt im lặng là cách
 * một prompt tự nhiên thiếu mất luật đang chi phối vùng, và không ai biết vì sao
 * Narrator bỗng kể sai.
 */
export function catTheoTran(tang, phanBo, tyLeToken) {
    const vetCat = [];
    const ra = tang.map((t) => {
        const pb = phanBo.find((p) => p.so === t.so);
        if (!pb)
            return t;
        const uoc = uocLuong(t.noiDung, tyLeToken);
        if (uoc <= pb.tranToken)
            return t;
        const tranKyTu = Math.max(0, Math.floor(pb.tranToken * tyLeToken));
        // Cắt ở ranh giới dòng: nửa dòng còn lại sai nghĩa hơn là không có dòng nào.
        const cat = t.noiDung.slice(0, tranKyTu);
        const cuoi = cat.lastIndexOf('\n');
        vetCat.push({
            tang: t.so,
            ten: t.ten,
            uocToken: uoc,
            tranToken: pb.tranToken,
            vi: `vượt trần ${uoc - pb.tranToken} token`,
        });
        return { ...t, noiDung: cuoi > tranKyTu * 0.5 ? cat.slice(0, cuoi) : cat };
    });
    return { tang: ra, vetCat };
}
