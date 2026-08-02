/**
 * Aspect nền của Thế Giới Sống — Phần 71.2 và ma trận 72.4 (Phase 5).
 *
 * Phần 72.4 đòi mỗi hệ nền có đủ bốn móc: **State**, Process, Affordance, quan sát.
 * File này là móc *State*. Mười hai tiến trình của 71.2 đọc/ghi đúng những trường
 * dưới đây và không có state ẩn ở nơi khác.
 *
 * [BB] Số ở đây là số của ENGINE. Phần 56.2 cấm đưa chúng thẳng ra tầng phàm nhân;
 * `chieu()` chuyển chúng thành mô tả định tính.
 *
 * Quy ước chung:
 *   - `soCai` là **sổ cái của tick gần nhất**. Nó tồn tại để bất biến
 *     "tổng thay đổi có giải thích qua event" (71.4) kiểm được: mọi delta phải
 *     bằng tổng các khoản trong sổ, không được có khoản "từ đâu ra".
 *   - `du` giữ **phần lẻ** chưa đủ một đơn vị. Không có nó thì làm tròn mỗi tick
 *     sẽ âm thầm sinh hoặc hủy dân số.
 */
import { z } from 'zod';
import { ConditionRecordSchema } from '../../contracts/primitives.js';
/** Bốn nhóm tuổi — cùng thang với `mortal.ageBand`. */
export const BAND_TUOI = ['child', 'youth', 'adult', 'elder'];
const so = (macDinh = 0) => z.number().min(0).prefault(macDinh);
const thang = (macDinh = 0) => z.number().min(0).max(100).prefault(macDinh);
const tyLe = (macDinh = 0) => z.number().min(0).max(1).prefault(macDinh);
// ─────────────────────────────────────────── dan_cu (population_household)
export const DanCuSchema = z
    .object({
    /** Quần thể T0 theo nhóm tuổi. Tổng bốn nhóm PHẢI khớp `spatial.danSo`. */
    cohort: z.object({ child: so(), youth: so(), adult: so(), elder: so() }).strict().prefault({}),
    soHo: so(),
    /** Người trên mỗi hộ — dùng khi materialize một hộ cụ thể (71.3). */
    nguoiMoiHo: z.number().min(1).prefault(4),
    /** Phần lẻ chưa đủ một người. Không có nó, làm tròn sẽ bịa hoặc nuốt dân. */
    du: z
        .object({
        sinh: z.number().prefault(0),
        tu: z.number().prefault(0),
        lenYouth: z.number().prefault(0),
        lenAdult: z.number().prefault(0),
        lenElder: z.number().prefault(0),
    })
        .strict()
        .prefault({}),
    /** Sổ cái tick gần nhất — nguồn giải thích cho mọi thay đổi dân số. */
    soCai: z
        .object({
        sinh: z.number().prefault(0),
        tuTuNhien: z.number().prefault(0),
        tuDoDoi: z.number().prefault(0),
        tuDoBenh: z.number().prefault(0),
        tuDoXungDot: z.number().prefault(0),
        nhapCu: z.number().prefault(0),
        xuatCu: z.number().prefault(0),
        vatChatHoa: z.number().prefault(0),
    })
        .strict()
        .prefault({}),
    tickCapNhat: z.number().int().prefault(0),
})
    .prefault({});
// ─────────────────────────────────────────── y_te (health_disease)
export const YTeSchema = z
    .object({
    /** Tỷ lệ dân đang mắc. Không phải thanh máu — nó là dịch tễ (70.5). */
    tyLeMac: tyLe(),
    mienDich: tyLe(),
    /** Bệnh đang lưu hành; null nghĩa là vùng đang sạch. */
    dichId: z.string().nullable().prefault(null),
    tickBungPhat: z.number().int().nullable().prefault(null),
    /** Số ca một người chăm được — thiếu thầy thuốc thì tử vong tăng. */
    sucChuaChuaTri: so(),
    /** Hiểu biết y học của vùng: quyết định vùng chữa được hay chỉ cúng. */
    hieuBietYHoc: thang(10),
    /** Ca nặng đang theo dõi ở độ phân giải micro. */
    caNang: z.array(ConditionRecordSchema).prefault([]),
})
    .prefault({});
// ─────────────────────────────────────────── sinh_thai (ecology)
export const SinhThaiSchema = z
    .object({
    /** Trữ lượng còn lại. Sản xuất RÚT từ đây — vật chất không tự sinh. */
    taiNguyen: z.object({ rung: so(), thu: so(), ca: so(), dat: so() }).strict().prefault({}),
    /** Sức chứa: trần logistic của từng loại tài nguyên. */
    sucChua: z
        .object({ rung: so(1), thu: so(1), ca: so(1), dat: so(1) })
        .strict()
        .prefault({}),
    /** Tốc độ phục hồi mỗi tick, theo tỷ lệ logistic. */
    tocDoPhucHoi: tyLe(0.06),
    suyThoai: tyLe(),
    /** Rút trong tick gần nhất — đối chiếu với sản lượng của `kinh_te`. */
    soCai: z
        .object({ khaiThac: z.number().prefault(0), phucHoi: z.number().prefault(0) })
        .strict()
        .prefault({}),
})
    .prefault({});
// ─────────────────────────────────────────── kinh_te (production/exchange/settlement)
export const KinhTeSchema = z
    .object({
    /** Kho thật. Không âm, không tự đầy. */
    kho: z.object({ luongThuc: so(), vatLieu: so() }).strict().prefault({}),
    sanLuong: z
        .object({ luongThuc: z.number().prefault(0), vatLieu: z.number().prefault(0) })
        .strict()
        .prefault({}),
    tieuThu: z
        .object({ luongThuc: z.number().prefault(0), vatLieu: z.number().prefault(0) })
        .strict()
        .prefault({}),
    /** Trình độ kỹ thuật — nhân vào sản lượng. Mất dân thì mất luôn kỹ thuật. */
    kyThuat: thang(5),
    haTang: z.object({ nha: so(), duong: so(), kho: so() }).strict().prefault({}),
    /** Giá tương đối, chuẩn hóa quanh 1. Khan hiếm đẩy giá lên. */
    gia: z
        .object({ luongThuc: z.number().min(0).prefault(1), vatLieu: z.number().min(0).prefault(1) })
        .strict()
        .prefault({}),
    /** 0 = đủ ăn, 1 = đói hoàn toàn. */
    thieuHut: tyLe(),
    /** Sổ cái tick gần nhất, theo từng mặt hàng. */
    soCai: z
        .object({
        sanXuat: z.number().prefault(0),
        tieuThu: z.number().prefault(0),
        nhap: z.number().prefault(0),
        xuat: z.number().prefault(0),
        hao: z.number().prefault(0),
        thue: z.number().prefault(0),
    })
        .strict()
        .prefault({}),
})
    .prefault({});
// ─────────────────────────────────────────── van_hoa (culture/language/religion)
export const TapTucSchema = z
    .object({
    id: z.string(),
    ten: z.string(),
    /** Bám vào vùng đến mức nào; dưới ngưỡng thì mai một. */
    doBenVung: thang(20),
    /** Mẫu hành vi đã lặp bao nhiêu lần trước khi được đóng băng (67.6). */
    soLanLap: z.number().int().min(0).prefault(0),
    tickSinh: z.number().int().prefault(0),
    nguonEventIds: z.array(z.string()).prefault([]),
})
    .strict();
export const VanHoaSchema = z
    .object({
    ngonNguId: z.string().prefault('ngon_ngu_goc'),
    /** Ngôn ngữ trôi theo thế hệ; đủ xa thì hai vùng không hiểu nhau. */
    doLechNgonNgu: tyLe(),
    tapTuc: z.array(TapTucSchema).prefault([]),
    nghiLeIds: z.array(z.string()).prefault([]),
    /** Giáo lý lệch khỏi bản gốc — cùng thang với `lawful.dienGiai[].doLech`. */
    giaoLyLech: thang(),
    /** Tín ngưỡng theo thần: id thần → tỷ lệ dân theo. */
    theoThan: z.record(z.string(), tyLe()).prefault({}),
})
    .prefault({});
// ─────────────────────────────────────────── an_ninh (conflict/security)
export const XungDotSchema = z
    .object({
    id: z.string(),
    doiThuId: z.string(),
    cuongDo: thang(),
    nguyenNhan: z.string().prefault(''),
    tickBatDau: z.number().int(),
    tickKetThuc: z.number().int().nullable().prefault(null),
})
    .strict();
export const HoaUocSchema = z
    .object({
    id: z.string(),
    voiId: z.string(),
    tickKy: z.number().int(),
    tickHetHan: z.number().int().nullable().prefault(null),
    dieuKhoan: z.string().prefault(''),
})
    .strict();
export const AnNinhSchema = z
    .object({
    deDoa: thang(),
    phongVe: thang(10),
    xungDot: z.array(XungDotSchema).prefault([]),
    hoaUoc: z.array(HoaUocSchema).prefault([]),
    /** Thương vong tick gần nhất — PHẢI đã bị trừ khỏi cohort (71.4). */
    thuongVongKy: z.number().min(0).prefault(0),
})
    .prefault({});
// ─────────────────────────────────────────── duong (geography/route)
/**
 * Tuyến đường là THỰC THỂ, không phải cạnh đồ thị.
 *
 * Lý do: một con đường có độ dài, chất lượng, lưu lượng và có thể bị chặn —
 * `Link.trongSo` (0–100) không chở nổi ngần ấy nghĩa, và bất biến
 * "vị trí có tuyến đường hợp lệ" cần một bản ghi tra được.
 *
 * ADR-0002: KHÔNG `.prefault({})` — `tuId`/`denId` là bắt buộc. Một con đường
 * không biết nó nối đâu với đâu thì không phải con đường.
 */
export const DuongSchema = z
    .object({
    tuId: z.string(),
    denId: z.string(),
    /** Số tick di chuyển khi đường tốt. Quyết định độ trễ tin tức (72.2). */
    doDai: z.number().min(1).prefault(1),
    chatLuong: thang(50),
    thongSuot: z.boolean().prefault(true),
    luuLuong: so(),
    hiemNguy: thang(),
    /** Lý do bị chặn — thiên tai, chiến sự, cấm lệnh. */
    lyDoChan: z.string().prefault(''),
})
    .strict();
// ─────────────────────────────────────────── môi trường theo mùa
export const MUA = ['xuan', 'ha', 'thu', 'dong'];
/** Bốn tick là một năm — xem ADR-0019. */
export const TICK_MOI_NAM = 4;
export function muaCuaTick(tick) {
    const i = ((tick % TICK_MOI_NAM) + TICK_MOI_NAM) % TICK_MOI_NAM;
    return MUA[i];
}
export function namCuaTick(tick) {
    return Math.floor(tick / TICK_MOI_NAM);
}
/** Hệ số sản lượng lương thực theo mùa. Đông không trồng được. */
export const HE_SO_MUA = Object.freeze({
    xuan: 0.9,
    ha: 1.3,
    thu: 1.4,
    dong: 0.2,
});
