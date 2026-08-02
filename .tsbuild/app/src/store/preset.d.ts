import type { TrangThaiWizard, ManWizard, BaoCaoNhap } from '../core/preset/wizard.js';
import type { PresetPackRow, PresetActivation, TransformDef } from '../core/preset/schema.js';
import type { PackDangBat } from '../core/preset/hopNhat.js';
import type { BienPackDoi } from '../core/ai/mvu.js';
import type { ImportIssue } from '../core/contracts/primitives.js';
export type TrangThaiPreset = {
    /** Mọi bản đã nhập, mới nhất trước. */
    thuVien: readonly PresetPackRow[];
    /** Activation đang chạy trên nhánh hiện tại, khóa theo `packId`. */
    dangBat: Readonly<Record<string, PresetActivation>>;
    /** Biến của từng pack trên nhánh hiện tại. */
    bien: Readonly<Record<string, Record<string, unknown>>>;
    wizard: TrangThaiWizard;
    /**
     * Lựa chọn xung đột theo PACK, không theo phiên wizard.
     *
     * [BB] 65.2 — pack chưa giải xung đột thì không kích hoạt. Nếu lựa chọn chỉ
     * sống trong wizard thì mở lại app là mất, và một pack đã nằm trong thư viện
     * sẽ vĩnh viễn không bật được vì không còn màn nào để giải. Đây là lỗi thật đã
     * gặp khi nhập fixture A: hai module cùng khai `history.wrapper`.
     */
    xungDot: Readonly<Record<string, Record<string, unknown>>>;
    /** Báo cáo sau nhập (66.2) của lần nhập gần nhất. */
    baoCao: BaoCaoNhap | null;
    /** Lỗi lint của lần bấm "Bật" gần nhất — hiện tại chỗ, không nuốt. */
    loiBat: readonly ImportIssue[];
    branchId: string;
    daNap: boolean;
    napTuDia(branchId: string): Promise<void>;
    doiNhanh(branchId: string): Promise<void>;
    /** Chạy pipeline mười hai bước trên nội dung file. KHÔNG ghi đĩa. */
    doThu(ten: string, noiDung: string, tick: number): void;
    diManWizard(man: ManWizard): void;
    chonModule(ids: readonly string[]): void;
    /** Giải một nhóm xung đột cho một pack cụ thể — sống lâu hơn phiên wizard. */
    giaiXungDot(packId: string, khoa: string, chon: unknown): void;
    /** Ghi kết quả wizard vào thư viện. Vẫn CHƯA bật. */
    nhapVaoThuVien(): Promise<void>;
    dongWizard(): void;
    bat(packId: string, saveId: string, tick: number): Promise<boolean>;
    tat(packId: string): Promise<void>;
    /** Hoàn tác về activation trước — 65.4, chỉ đổi con trỏ. */
    luiMotBuoc(packId: string): Promise<void>;
    xoaKhoiThuVien(packId: string): Promise<void>;
    /** Pack đang bật, dạng `bienSoanLuot()` nhận. */
    packChoLuot(): readonly PackDangBat[];
    /** Transform hiển thị của các pack đang bật — 64.3, chạy trên BẢN SAO. */
    transformDangBat(): readonly TransformDef[];
    /** Áp transform lên một dòng văn để hiển thị. Không đụng dữ liệu gốc. */
    hienThi(vanBan: string): string;
    /** Ghi thay đổi biến do khối `<UpdateVariable>` đề nghị — 66.6. */
    apBienPack(thayDoi: readonly BienPackDoi[], tick: number): Promise<void>;
};
export declare const usePreset: import("zustand").UseBoundStore<import("zustand").StoreApi<TrangThaiPreset>>;
/** Đọc pack đang bật ngoài React — `useGame` dùng cái này, không dùng hook. */
export declare function packDangBat(): readonly PackDangBat[];
