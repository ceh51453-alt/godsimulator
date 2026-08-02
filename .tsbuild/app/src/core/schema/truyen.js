/**
 * Mạch Truyện, Sổ Phục Bút và Ống Kính — Phần 28, 29, 30 [BB].
 *
 * ── Vì sao mạch truyện là BẢNG chứ không phải aspect ──
 *
 * 28.1 nói thẳng lý do tồn tại: "nếu câu chuyện chỉ tồn tại trong lịch sử chat,
 * thì khi người chơi đi chỗ khác, câu chuyện biến mất". Một mạch truyện có nhiều
 * nhân vật, và nhân vật vào ra giữa chừng; nhét nó vào aspect của một entity là
 * chọn sẵn một nhân vật làm chủ — đúng cái bệnh lấy người chơi làm tâm mà 28.6
 * tồn tại để chống. Vậy nó là bảng, cùng lý do `debts` là bảng (ADR-0020).
 *
 * [BB] 28.2 — `nguoiChoiBiet = false` phải là ĐA SỐ. Thế giới đầy những câu
 * chuyện người chơi chưa từng nghe.
 *
 * [BB] 28.5 — nhịp truyện chạy BẰNG ENGINE, không gọi LLM. Nhờ vậy 24 mạch chạy
 * song song mà chi phí bằng 0.
 */
import { z } from 'zod';
export const VAI_TRO_MACH = ['chinh', 'doi_dau', 'xuc_tac', 'chung_kien', 'nan_nhan', 'ke_thua'];
/**
 * Bảy giai đoạn. `chet_yeu` là kết cục HỢP LỆ, không phải lỗi: 28.5 — "truyện dở
 * dang là chuyện có thật trong lịch sử".
 */
export const GIAI_DOAN_MACH = [
    'am_i',
    'khoi',
    'phat_trien',
    'cao_trao',
    'ha_man',
    'du_am',
    'chet_yeu',
];
/** Giai đoạn nào là đã đóng — mạch đóng không còn ăn hạn ngạch `machToiDa`. */
export function machDaDong(gd) {
    return gd === 'du_am' || gd === 'chet_yeu';
}
export const NutThatSchema = z
    .object({
    moTa: z.string(),
    daGo: z.boolean().prefault(false),
    tickTao: z.number().int(),
})
    .strict();
export const NhanVatMachSchema = z
    .object({
    entityId: z.string(),
    vaiTro: z.enum(VAI_TRO_MACH),
    trongSo: z.number().min(0).max(100).prefault(50),
})
    .strict();
export const StorylineSchema = z
    .object({
    id: z.string(),
    branchId: z.string(),
    ten: z.string(),
    /** Tra `R.storyKind`. */
    loai: z.string(),
    nhanVat: z.array(NhanVatMachSchema).prefault([]),
    giaiDoan: z.enum(GIAI_DOAN_MACH).prefault('am_i'),
    cangThang: z.number().min(0).max(100).prefault(10),
    /** Tick còn lại tới nhịp kế. */
    dongHo: z.number().prefault(0),
    /** Chu kỳ nhịp. */
    nhipMoi: z.number().prefault(12),
    nutThat: z.array(NutThatSchema).prefault([]),
    /** Id trong Sổ Phục Bút. */
    phucBut: z.array(z.string()).prefault([]),
    /**
     * [BB] 28.2 — đa số mạch phải để `false`. `batBienTruyen` cưỡng chế tỉ lệ này.
     */
    nguoiChoiBiet: z.boolean().prefault(false),
    nguoiChoiThamGia: z.boolean().prefault(false),
    /** Sợi chỉ tự sự nén của riêng mạch này — tầng nhớ thứ tư của 30.1. */
    kyUcMach: z.string().prefault(''),
    /**
     * Văn của những nhịp chưa được nén — nguyên liệu cho `nenKyUcMach()` (30.3).
     *
     * Có trần cứng vì nó là bộ đệm, không phải sổ: 30.3 nói nén **được phép làm
     * mất văn**, nên giữ quá mười hai nhịp thô là giữ đúng thứ sắp bị vứt. Biên
     * niên sử thật nằm ở Event log, không nằm ở đây.
     */
    nhipGanDay: z.array(z.string().max(400)).max(12).prefault([]),
    ketCuc: z.string().nullable().prefault(null),
    /** Số nhịp đã đi qua — nuôi `chet_yeu` khi mạch ngồi lì ở `phat_trien`. */
    soNhip: z.number().int().min(0).prefault(0),
    /** Nhịp gần nhất mà ống kính chiếu tới. Không được chăm sóc lâu thì chết yểu. */
    tickChieuCuoi: z.number().int().nullable().prefault(null),
    tickSinh: z.number().int(),
    tickKet: z.number().int().nullable().prefault(null),
})
    .strict();
// ─────────────────────────────────────────── Sổ Phục Bút (30.2)
export const LOAI_PHUC_BUT = ['vat', 'loi_noi', 'nhan_vat', 'dieu_bao', 'bi_mat', 'mon_no'];
/**
 * [BB] 30.2 — "AI không nhớ; engine ép nó nhớ."
 *
 * Phục bút không bao giờ tự biến mất. Nó hoặc được trả, hoặc quá hạn rồi trở
 * thành `gap` loại `nhan_qua` — tức một bí ẩn của thế giới, tức là nội dung.
 */
export const ForeshadowSchema = z
    .object({
    id: z.string(),
    branchId: z.string(),
    machId: z.string().nullable().prefault(null),
    /** Thứ đã được gieo. */
    noiDung: z.string(),
    loai: z.enum(LOAI_PHUC_BUT),
    tickGieo: z.number().int(),
    hanTraToiDa: z.number().int().nullable().prefault(null),
    daTra: z.boolean().prefault(false),
    cachTra: z.string().prefault(''),
    doNang: z.number().min(0).max(100).prefault(50),
    /** Đã chuyển thành `gap` loại `nhan_qua` chưa — chống sinh gap trùng mỗi tick. */
    daThanhBiAn: z.boolean().prefault(false),
})
    .strict();
/** Phục bút quá hạn mà chưa trả — 30.2 đẩy nó lên ĐẦU context kèm ghi chú. */
export function quaHan(f, tick) {
    return !f.daTra && f.hanTraToiDa !== null && tick > f.tickGieo + f.hanTraToiDa;
}
// ─────────────────────────────────────────── Ống Kính (29.1)
export const MucTieuOngKinhSchema = z.discriminatedUnion('loai', [
    z.object({ loai: z.literal('mach'), machId: z.string() }).strict(),
    z.object({ loai: z.literal('nhan_vat'), entityId: z.string() }).strict(),
    z.object({ loai: z.literal('vung'), vungId: z.string() }).strict(),
    z.object({ loai: z.literal('nguoi_choi') }).strict(),
    /** Engine chọn theo căng thẳng — mặc định. */
    z.object({ loai: z.literal('tu_dong') }).strict(),
]);
export const LensSchema = z
    .object({
    mucTieu: MucTieuOngKinhSchema.prefault({ loai: 'tu_dong' }),
    tuDongChuyen: z.boolean().prefault(true),
    giuToiThieuTick: z.number().int().min(0).prefault(3),
})
    .strict();
export const ONG_KINH_MAC_DINH = LensSchema.parse({});
/**
 * [BB] 28.6 — hạn ngạch vắng mặt. Cơ chế CỨNG chống bệnh lấy người chơi làm tâm.
 *
 * Đo theo SỐ CẢNH, không theo token: một cảnh dài về người chơi không được phép
 * mua chuộc chỉ số bằng độ dài.
 */
export const TI_LE_VANG_MAT = Object.freeze({
    mucTieu: 0.4,
    doTren: 'so_canh',
    batBuocToiThieu: 3,
});
