/**
 * Aspect `mortal`, `genealogical`, `spatial`, `carrier` — Khối C + Khối S.
 * Thế giới có vật chất thật; chỉ meta-currency của NGƯỜI CHƠI bị cấm (Phần 61.1 #7).
 */
import { z } from 'zod';
export declare const MortalSchema: z.ZodPrefault<z.ZodObject<{
    tuoiTho: z.ZodPrefault<z.ZodNumber>;
    tickSinh: z.ZodPrefault<z.ZodNumber>;
    tickTu: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    ageBand: z.ZodPrefault<z.ZodEnum<{
        child: "child";
        youth: "youth";
        adult: "adult";
        elder: "elder";
    }>>;
    mucTieuDoiNguoi: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    thanThe: z.ZodPrefault<z.ZodObject<{
        sinhLuc: z.ZodPrefault<z.ZodNumber>;
        theLuc: z.ZodPrefault<z.ZodNumber>;
        doDoi: z.ZodPrefault<z.ZodNumber>;
        dau: z.ZodPrefault<z.ZodNumber>;
        daMac: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        conditions: z.ZodPrefault<z.ZodArray<z.ZodObject<{
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
        thuongTich: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            loai: z.ZodEnum<{
                gay: "gay";
                rach: "rach";
                bong: "bong";
                benh: "benh";
                kiet_suc: "kiet_suc";
                nhiem_doc: "nhiem_doc";
                tuoi_gia: "tuoi_gia";
            }>;
            viTri: z.ZodPrefault<z.ZodEnum<{
                than: "than";
                dau: "dau";
                tay_trai: "tay_trai";
                tay_phai: "tay_phai";
                chan_trai: "chan_trai";
                chan_phai: "chan_phai";
                trong: "trong";
            }>>;
            nang: z.ZodPrefault<z.ZodNumber>;
            tickBatDau: z.ZodNumber;
            nguyenNhanEventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
            nguoiChamId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
            trangThai: z.ZodPrefault<z.ZodEnum<{
                moi: "moi";
                dang_lanh: "dang_lanh";
                da_lanh: "da_lanh";
                bien_chung: "bien_chung";
                di_chung: "di_chung";
            }>>;
            diChung: z.ZodPrefault<z.ZodString>;
        }, z.core.$strict>>>;
    }, z.core.$strip>>;
    nguyenNhanChet: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    lich: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        startOffset: z.ZodNumber;
        duration: z.ZodNumber;
        activity: z.ZodString;
        locationId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        flexible: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
    ngheId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    hoId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    kyNang: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    soHuu: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        targetId: z.ZodString;
        kind: z.ZodString;
        share: z.ZodPrefault<z.ZodNumber>;
        basis: z.ZodString;
        status: z.ZodPrefault<z.ZodEnum<{
            asserted: "asserted";
            recognized: "recognized";
            disputed: "disputed";
            lost: "lost";
        }>>;
    }, z.core.$strict>>>;
    boiVu: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        toId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        description: z.ZodString;
        cadence: z.ZodPrefault<z.ZodString>;
        priority: z.ZodPrefault<z.ZodNumber>;
        status: z.ZodPrefault<z.ZodEnum<{
            active: "active";
            fulfilled: "fulfilled";
            broken: "broken";
            released: "released";
        }>>;
    }, z.core.$strict>>>;
}, z.core.$strip>>;
export declare const GenealogicalSchema: z.ZodPrefault<z.ZodObject<{
    chaMeIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    conIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    theHe: z.ZodPrefault<z.ZodNumber>;
    huyetMachId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>>;
export declare const SpatialSchema: z.ZodPrefault<z.ZodObject<{
    chaId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    toaDo: z.ZodPrefault<z.ZodObject<{
        x: z.ZodPrefault<z.ZodNumber>;
        y: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    banKinh: z.ZodPrefault<z.ZodNumber>;
    luatCucBoIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    vanHoaId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    danSo: z.ZodPrefault<z.ZodNumber>;
    doPhuThuoc: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
export declare const CarrierSchema: z.ZodPrefault<z.ZodObject<{
    khaiNiemMangIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    chuSoHuuId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    lichSuDiQua: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        tick: z.ZodNumber;
        chuId: z.ZodString;
        suKienId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>>>;
    nhiemBanChat: z.ZodPrefault<z.ZodString>;
}, z.core.$strip>>;
/** Kẻ Thù Vĩnh Cửu — Phần 12.5. Bước 6 của vòng lặp tick. */
export declare const AdversarialSchema: z.ZodPrefault<z.ZodObject<{
    phuDinh: z.ZodPrefault<z.ZodObject<{
        loai: z.ZodPrefault<z.ZodEnum<{
            ton_tai: "ton_tai";
            mot_luat: "mot_luat";
            trat_tu: "trat_tu";
            mot_than: "mot_than";
        }>>;
        mucTieuId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    dieuKhoanBatTu: z.ZodPrefault<z.ZodObject<{
        loai: z.ZodPrefault<z.ZodEnum<{
            tai_sinh_tu_thu_no_chong: "tai_sinh_tu_thu_no_chong";
            song_lai_khi_bi_quen: "song_lai_khi_bi_quen";
            moi_chu_ky_mot_lan: "moi_chu_ky_mot_lan";
            khong_the_giet: "khong_the_giet";
        }>>;
        moTa: z.ZodPrefault<z.ZodString>;
    }, z.core.$strip>>;
    nhip: z.ZodPrefault<z.ZodEnum<{
        hang_dem: "hang_dem";
        theo_mua: "theo_mua";
        moi_ky_nguyen: "moi_ky_nguyen";
        chi_o_tan_the: "chi_o_tan_the";
    }>>;
    lanCuoiTroiDay: z.ZodPrefault<z.ZodNumber>;
    soLanBiDayLui: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
/**
 * Thiết chế. Bốn trường cuối vào từ Phase 5 (`institution_governance`, Phần 71.2):
 * thiết chế phải THU được thuế, GIỮ được kho và KẾ VỊ được, nếu không nó chỉ là
 * một cái nhãn dán lên bản đồ.
 */
export declare const InstitutionalSchema: z.ZodPrefault<z.ZodObject<{
    moHinhCaiTri: z.ZodPrefault<z.ZodEnum<{
        hoi_dong: "hoi_dong";
        quan_chu: "quan_chu";
        than_quyen: "than_quyen";
        bo_lac: "bo_lac";
        vo_chinh_phu: "vo_chinh_phu";
        quan_lieu: "quan_lieu";
    }>>;
    keVi: z.ZodPrefault<z.ZodEnum<{
        huyet_thong: "huyet_thong";
        bau_cu: "bau_cu";
        chi_dinh: "chi_dinh";
        thu_thach: "thu_thach";
        khong_co: "khong_co";
    }>>;
    thanhVienIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    giaoLyIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    thanhLapTick: z.ZodPrefault<z.ZodNumber>;
    vungCaiTriIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    thueSuat: z.ZodPrefault<z.ZodNumber>;
    khoCong: z.ZodPrefault<z.ZodObject<{
        luongThuc: z.ZodPrefault<z.ZodNumber>;
        vatLieu: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>;
    chucVu: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        ten: z.ZodString;
        nguoiGiuId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        tickNhamChuc: z.ZodPrefault<z.ZodNumber>;
        tickHetNhiemKy: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>>;
    onDinh: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
export type Mortal = z.infer<typeof MortalSchema>;
export type Genealogical = z.infer<typeof GenealogicalSchema>;
export type Spatial = z.infer<typeof SpatialSchema>;
export type Carrier = z.infer<typeof CarrierSchema>;
export type Adversarial = z.infer<typeof AdversarialSchema>;
export type Institutional = z.infer<typeof InstitutionalSchema>;
