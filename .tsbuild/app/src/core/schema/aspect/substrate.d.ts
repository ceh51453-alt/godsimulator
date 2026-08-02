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
/** Bốn nhóm tuổi — cùng thang với `mortal.ageBand`. */
export declare const BAND_TUOI: readonly ["child", "youth", "adult", "elder"];
export type BandTuoi = (typeof BAND_TUOI)[number];
export declare const DanCuSchema: z.ZodPrefault<z.ZodObject<{
    cohort: z.ZodPrefault<z.ZodObject<{
        child: z.ZodPrefault<z.ZodNumber>;
        youth: z.ZodPrefault<z.ZodNumber>;
        adult: z.ZodPrefault<z.ZodNumber>;
        elder: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    soHo: z.ZodPrefault<z.ZodNumber>;
    nguoiMoiHo: z.ZodPrefault<z.ZodNumber>;
    du: z.ZodPrefault<z.ZodObject<{
        sinh: z.ZodPrefault<z.ZodNumber>;
        tu: z.ZodPrefault<z.ZodNumber>;
        lenYouth: z.ZodPrefault<z.ZodNumber>;
        lenAdult: z.ZodPrefault<z.ZodNumber>;
        lenElder: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    soCai: z.ZodPrefault<z.ZodObject<{
        sinh: z.ZodPrefault<z.ZodNumber>;
        tuTuNhien: z.ZodPrefault<z.ZodNumber>;
        tuDoDoi: z.ZodPrefault<z.ZodNumber>;
        tuDoBenh: z.ZodPrefault<z.ZodNumber>;
        tuDoXungDot: z.ZodPrefault<z.ZodNumber>;
        nhapCu: z.ZodPrefault<z.ZodNumber>;
        xuatCu: z.ZodPrefault<z.ZodNumber>;
        vatChatHoa: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    tickCapNhat: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
export declare const YTeSchema: z.ZodPrefault<z.ZodObject<{
    tyLeMac: z.ZodPrefault<z.ZodNumber>;
    mienDich: z.ZodPrefault<z.ZodNumber>;
    dichId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    tickBungPhat: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    sucChuaChuaTri: z.ZodPrefault<z.ZodNumber>;
    hieuBietYHoc: z.ZodPrefault<z.ZodNumber>;
    caNang: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodString;
        severity: z.ZodNumber;
        startedAtTick: z.ZodNumber;
        causeEventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        treatmentProjectId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        status: z.ZodPrefault<z.ZodEnum<{
            active: "active";
            recovering: "recovering";
            resolved: "resolved";
            chronic: "chronic";
        }>>;
    }, z.core.$strict>>>;
}, z.core.$strip>>;
export declare const SinhThaiSchema: z.ZodPrefault<z.ZodObject<{
    taiNguyen: z.ZodPrefault<z.ZodObject<{
        rung: z.ZodPrefault<z.ZodNumber>;
        thu: z.ZodPrefault<z.ZodNumber>;
        ca: z.ZodPrefault<z.ZodNumber>;
        dat: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    sucChua: z.ZodPrefault<z.ZodObject<{
        rung: z.ZodPrefault<z.ZodNumber>;
        thu: z.ZodPrefault<z.ZodNumber>;
        ca: z.ZodPrefault<z.ZodNumber>;
        dat: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    tocDoPhucHoi: z.ZodPrefault<z.ZodNumber>;
    suyThoai: z.ZodPrefault<z.ZodNumber>;
    soCai: z.ZodPrefault<z.ZodObject<{
        khaiThac: z.ZodPrefault<z.ZodNumber>;
        phucHoi: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
}, z.core.$strip>>;
export declare const KinhTeSchema: z.ZodPrefault<z.ZodObject<{
    kho: z.ZodPrefault<z.ZodObject<{
        luongThuc: z.ZodPrefault<z.ZodNumber>;
        vatLieu: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    sanLuong: z.ZodPrefault<z.ZodObject<{
        luongThuc: z.ZodPrefault<z.ZodNumber>;
        vatLieu: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    tieuThu: z.ZodPrefault<z.ZodObject<{
        luongThuc: z.ZodPrefault<z.ZodNumber>;
        vatLieu: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    kyThuat: z.ZodPrefault<z.ZodNumber>;
    haTang: z.ZodPrefault<z.ZodObject<{
        nha: z.ZodPrefault<z.ZodNumber>;
        duong: z.ZodPrefault<z.ZodNumber>;
        kho: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    gia: z.ZodPrefault<z.ZodObject<{
        luongThuc: z.ZodPrefault<z.ZodNumber>;
        vatLieu: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    thieuHut: z.ZodPrefault<z.ZodNumber>;
    soCai: z.ZodPrefault<z.ZodObject<{
        sanXuat: z.ZodPrefault<z.ZodNumber>;
        tieuThu: z.ZodPrefault<z.ZodNumber>;
        nhap: z.ZodPrefault<z.ZodNumber>;
        xuat: z.ZodPrefault<z.ZodNumber>;
        hao: z.ZodPrefault<z.ZodNumber>;
        thue: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
}, z.core.$strip>>;
export declare const TapTucSchema: z.ZodObject<{
    id: z.ZodString;
    ten: z.ZodString;
    doBenVung: z.ZodPrefault<z.ZodNumber>;
    soLanLap: z.ZodPrefault<z.ZodNumber>;
    tickSinh: z.ZodPrefault<z.ZodNumber>;
    nguonEventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export declare const VanHoaSchema: z.ZodPrefault<z.ZodObject<{
    ngonNguId: z.ZodPrefault<z.ZodString>;
    doLechNgonNgu: z.ZodPrefault<z.ZodNumber>;
    tapTuc: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        ten: z.ZodString;
        doBenVung: z.ZodPrefault<z.ZodNumber>;
        soLanLap: z.ZodPrefault<z.ZodNumber>;
        tickSinh: z.ZodPrefault<z.ZodNumber>;
        nguonEventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>>;
    nghiLeIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    giaoLyLech: z.ZodPrefault<z.ZodNumber>;
    theoThan: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodPrefault<z.ZodNumber>>>;
}, z.core.$strip>>;
export declare const XungDotSchema: z.ZodObject<{
    id: z.ZodString;
    doiThuId: z.ZodString;
    cuongDo: z.ZodPrefault<z.ZodNumber>;
    nguyenNhan: z.ZodPrefault<z.ZodString>;
    tickBatDau: z.ZodNumber;
    tickKetThuc: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strict>;
export declare const HoaUocSchema: z.ZodObject<{
    id: z.ZodString;
    voiId: z.ZodString;
    tickKy: z.ZodNumber;
    tickHetHan: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    dieuKhoan: z.ZodPrefault<z.ZodString>;
}, z.core.$strict>;
export declare const AnNinhSchema: z.ZodPrefault<z.ZodObject<{
    deDoa: z.ZodPrefault<z.ZodNumber>;
    phongVe: z.ZodPrefault<z.ZodNumber>;
    xungDot: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        doiThuId: z.ZodString;
        cuongDo: z.ZodPrefault<z.ZodNumber>;
        nguyenNhan: z.ZodPrefault<z.ZodString>;
        tickBatDau: z.ZodNumber;
        tickKetThuc: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>>;
    hoaUoc: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        voiId: z.ZodString;
        tickKy: z.ZodNumber;
        tickHetHan: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
        dieuKhoan: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>>>;
    thuongVongKy: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
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
export declare const DuongSchema: z.ZodObject<{
    tuId: z.ZodString;
    denId: z.ZodString;
    doDai: z.ZodPrefault<z.ZodNumber>;
    chatLuong: z.ZodPrefault<z.ZodNumber>;
    thongSuot: z.ZodPrefault<z.ZodBoolean>;
    luuLuong: z.ZodPrefault<z.ZodNumber>;
    hiemNguy: z.ZodPrefault<z.ZodNumber>;
    lyDoChan: z.ZodPrefault<z.ZodString>;
}, z.core.$strict>;
export declare const MUA: readonly ["xuan", "ha", "thu", "dong"];
export type Mua = (typeof MUA)[number];
/** Bốn tick là một năm — xem ADR-0019. */
export declare const TICK_MOI_NAM = 4;
export declare function muaCuaTick(tick: number): Mua;
export declare function namCuaTick(tick: number): number;
/** Hệ số sản lượng lương thực theo mùa. Đông không trồng được. */
export declare const HE_SO_MUA: Readonly<Record<Mua, number>>;
export type DanCu = z.infer<typeof DanCuSchema>;
export type YTe = z.infer<typeof YTeSchema>;
export type SinhThai = z.infer<typeof SinhThaiSchema>;
export type KinhTe = z.infer<typeof KinhTeSchema>;
export type VanHoa = z.infer<typeof VanHoaSchema>;
export type TapTuc = z.infer<typeof TapTucSchema>;
export type AnNinh = z.infer<typeof AnNinhSchema>;
export type XungDot = z.infer<typeof XungDotSchema>;
export type HoaUoc = z.infer<typeof HoaUocSchema>;
export type Duong = z.infer<typeof DuongSchema>;
