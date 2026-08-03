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
export declare const VAI_TRO_MACH: readonly ["chinh", "doi_dau", "xuc_tac", "chung_kien", "nan_nhan", "ke_thua"];
export type VaiTroMach = (typeof VAI_TRO_MACH)[number];
/**
 * Bảy giai đoạn. `chet_yeu` là kết cục HỢP LỆ, không phải lỗi: 28.5 — "truyện dở
 * dang là chuyện có thật trong lịch sử".
 */
export declare const GIAI_DOAN_MACH: readonly ["am_i", "khoi", "phat_trien", "cao_trao", "ha_man", "du_am", "chet_yeu"];
export type GiaiDoanMach = (typeof GIAI_DOAN_MACH)[number];
/** Giai đoạn nào là đã đóng — mạch đóng không còn ăn hạn ngạch `machToiDa`. */
export declare function machDaDong(gd: GiaiDoanMach): boolean;
export declare const NutThatSchema: z.ZodObject<{
    moTa: z.ZodString;
    daGo: z.ZodPrefault<z.ZodBoolean>;
    tickTao: z.ZodNumber;
}, z.core.$strict>;
export declare const NhanVatMachSchema: z.ZodObject<{
    entityId: z.ZodString;
    vaiTro: z.ZodEnum<{
        chinh: "chinh";
        doi_dau: "doi_dau";
        xuc_tac: "xuc_tac";
        chung_kien: "chung_kien";
        nan_nhan: "nan_nhan";
        ke_thua: "ke_thua";
    }>;
    trongSo: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
export declare const StorylineSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    ten: z.ZodString;
    loai: z.ZodString;
    nhanVat: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        entityId: z.ZodString;
        vaiTro: z.ZodEnum<{
            chinh: "chinh";
            doi_dau: "doi_dau";
            xuc_tac: "xuc_tac";
            chung_kien: "chung_kien";
            nan_nhan: "nan_nhan";
            ke_thua: "ke_thua";
        }>;
        trongSo: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>>;
    giaiDoan: z.ZodPrefault<z.ZodEnum<{
        am_i: "am_i";
        khoi: "khoi";
        phat_trien: "phat_trien";
        cao_trao: "cao_trao";
        ha_man: "ha_man";
        du_am: "du_am";
        chet_yeu: "chet_yeu";
    }>>;
    cangThang: z.ZodPrefault<z.ZodNumber>;
    dongHo: z.ZodPrefault<z.ZodNumber>;
    nhipMoi: z.ZodPrefault<z.ZodNumber>;
    nutThat: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        moTa: z.ZodString;
        daGo: z.ZodPrefault<z.ZodBoolean>;
        tickTao: z.ZodNumber;
    }, z.core.$strict>>>;
    phucBut: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    nguoiChoiBiet: z.ZodPrefault<z.ZodBoolean>;
    nguoiChoiThamGia: z.ZodPrefault<z.ZodBoolean>;
    kyUcMach: z.ZodPrefault<z.ZodString>;
    nhipGanDay: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    ketCuc: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    soNhip: z.ZodPrefault<z.ZodNumber>;
    tickChieuCuoi: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    tickSinh: z.ZodNumber;
    tickKet: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strict>;
export type NutThat = z.infer<typeof NutThatSchema>;
export type NhanVatMach = z.infer<typeof NhanVatMachSchema>;
export type Storyline = z.infer<typeof StorylineSchema>;
export declare const LOAI_PHUC_BUT: readonly ["vat", "loi_noi", "nhan_vat", "dieu_bao", "bi_mat", "mon_no"];
export type LoaiPhucBut = (typeof LOAI_PHUC_BUT)[number];
/**
 * [BB] 30.2 — "AI không nhớ; engine ép nó nhớ."
 *
 * Phục bút không bao giờ tự biến mất. Nó hoặc được trả, hoặc quá hạn rồi trở
 * thành `gap` loại `nhan_qua` — tức một bí ẩn của thế giới, tức là nội dung.
 */
export declare const ForeshadowSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    machId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    noiDung: z.ZodString;
    loai: z.ZodEnum<{
        bi_mat: "bi_mat";
        vat: "vat";
        loi_noi: "loi_noi";
        nhan_vat: "nhan_vat";
        dieu_bao: "dieu_bao";
        mon_no: "mon_no";
    }>;
    tickGieo: z.ZodNumber;
    hanTraToiDa: z.ZodPrefault<z.ZodNullable<z.ZodNumber>>;
    daTra: z.ZodPrefault<z.ZodBoolean>;
    cachTra: z.ZodPrefault<z.ZodString>;
    doNang: z.ZodPrefault<z.ZodNumber>;
    daThanhBiAn: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export type Foreshadow = z.infer<typeof ForeshadowSchema>;
/** Phục bút quá hạn mà chưa trả — 30.2 đẩy nó lên ĐẦU context kèm ghi chú. */
export declare function quaHan(f: Foreshadow, tick: number): boolean;
export declare const MucTieuOngKinhSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    loai: z.ZodLiteral<"mach">;
    machId: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    loai: z.ZodLiteral<"nhan_vat">;
    entityId: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    loai: z.ZodLiteral<"vung">;
    vungId: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    loai: z.ZodLiteral<"nguoi_choi">;
}, z.core.$strict>, z.ZodObject<{
    loai: z.ZodLiteral<"tu_dong">;
}, z.core.$strict>], "loai">;
export declare const LensSchema: z.ZodObject<{
    mucTieu: z.ZodPrefault<z.ZodDiscriminatedUnion<[z.ZodObject<{
        loai: z.ZodLiteral<"mach">;
        machId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        loai: z.ZodLiteral<"nhan_vat">;
        entityId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        loai: z.ZodLiteral<"vung">;
        vungId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        loai: z.ZodLiteral<"nguoi_choi">;
    }, z.core.$strict>, z.ZodObject<{
        loai: z.ZodLiteral<"tu_dong">;
    }, z.core.$strict>], "loai">>;
    tuDongChuyen: z.ZodPrefault<z.ZodBoolean>;
    giuToiThieuTick: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
export type MucTieuOngKinh = z.infer<typeof MucTieuOngKinhSchema>;
export type Lens = z.infer<typeof LensSchema>;
export declare const ONG_KINH_MAC_DINH: Lens;
/**
 * [BB] 28.6 — hạn ngạch vắng mặt. Cơ chế CỨNG chống bệnh lấy người chơi làm tâm.
 *
 * Đo theo SỐ CẢNH, không theo token: một cảnh dài về người chơi không được phép
 * mua chuộc chỉ số bằng độ dài.
 */
export declare const TI_LE_VANG_MAT: Readonly<{
    mucTieu: 0.4;
    doTren: "so_canh";
    batBuocToiThieu: 3;
}>;
