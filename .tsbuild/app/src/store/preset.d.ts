import type { TrangThaiWizard, ManWizard, BaoCaoNhap } from '../core/preset/wizard.js';
import type { PresetPackRow, PresetActivation, TransformDef } from '../core/preset/schema.js';
import type { PackDangBat } from '../core/preset/hopNhat.js';
import type { BienPackDoi } from '../core/ai/mvu.js';
import type { CapturedData, PromptMessageLike } from '../core/preset/adapterMerge.js';
import type { ImportIssue } from '../core/contracts/primitives.js';
export type TrangThaiPreset = {
    /** Mọi bản đã nhập, mới nhất trước. */
    thuVien: readonly PresetPackRow[];
    /** Activation đang chạy trên nhánh hiện tại, khóa theo `packId`. */
    dangBat: Readonly<Record<string, PresetActivation>>;
    /** Thứ tự chồng pack, cũ trước mới sau. */
    thuTuBat: readonly string[];
    /** Biến của từng pack trên nhánh hiện tại. */
    bien: Readonly<Record<string, Record<string, unknown>>>;
    wizard: TrangThaiWizard;
    /** Báo cáo sau nhập (66.2) của lần nhập gần nhất. */
    baoCao: BaoCaoNhap | null;
    /** Lỗi lint của lần bấm "Bật" gần nhất — hiện tại chỗ, không nuốt. */
    loiBat: readonly ImportIssue[];
    /** Dữ liệu đã capture từ output AI bởi adapter kemini_noass. */
    capturedData: CapturedData;
    /** Regex nguồn đã vượt trần trong phiên; không chạy lại cho tới khi nạp lại. */
    regexDaTat: readonly string[];
    /** Preset sẽ tự bật trước lời kể đầu tiên của một ván mới. */
    chonChoVanMoi: readonly string[];
    branchId: string;
    daNap: boolean;
    napTuDia(branchId: string): Promise<void>;
    doiNhanh(branchId: string): Promise<void>;
    /** Chạy pipeline mười hai bước trên nội dung file. KHÔNG ghi đĩa. */
    doThu(ten: string, noiDung: string, tick: number): void;
    diManWizard(man: ManWizard): void;
    chonModule(ids: readonly string[]): void;
    /** Ghi kết quả wizard vào thư viện. Vẫn CHƯA bật. */
    nhapVaoThuVien(): Promise<void>;
    dongWizard(): void;
    bat(packId: string, saveId: string, tick: number): Promise<boolean>;
    tat(packId: string): Promise<void>;
    /** Hoàn tác về activation trước — 65.4, chỉ đổi con trỏ. */
    luiMotBuoc(packId: string): Promise<void>;
    xoaKhoiThuVien(packId: string): Promise<void>;
    datChonChoVanMoi(packId: string, chon: boolean): Promise<void>;
    /** Bật/tắt module, regex hoặc adapter script trong cấu hình của đúng pack/nhánh. */
    datTinhNang(packId: string, loai: 'module' | 'regex' | 'script', id: string, bat: boolean, tick: number): Promise<void>;
    /** Pack đang bật, dạng `bienSoanLuot()` nhận. */
    packChoLuot(): readonly PackDangBat[];
    /** Transform hiển thị của các pack đang bật — 64.3, chạy trên BẢN SAO. */
    transformDangBat(): readonly TransformDef[];
    /** Áp transform lên một dòng văn để hiển thị. Không đụng dữ liệu gốc. */
    hienThi(vanBan: string, ctx?: {
        user?: string;
        sceneId?: string;
        turn?: number;
    }): string;
    /** Áp regex promptOnly lên chuỗi prompt trước khi gửi AI. */
    transformPrompt(vanBan: string, placement?: 1 | 2, depth?: number): string;
    /** Dựng slot chatHistory theo adapter merge của preset đang bật. */
    lichSuChoPrompt(canh: readonly {
        loai: string;
        noiDung: string;
    }[]): string;
    /** Port phần dọn output/stop marker của helper script đang bật. */
    xuLyOutput(vanBan: string): string;
    /** Áp adapter merge: in-prompt regex + tag replace. */
    apAdapter(vanBan: string): string;
    /** Áp adapter lên module nhập, giữ nguyên mọi message `td:*` của engine. */
    apAdapterMessages(messages: readonly PromptMessageLike[]): readonly PromptMessageLike[];
    /** Bắt dữ liệu từ output AI theo capture rules của preset. */
    captureOutput(output: string, tick?: number): void;
    /** Ghi thay đổi biến do khối `<UpdateVariable>` đề nghị — 66.6. */
    apBienPack(thayDoi: readonly BienPackDoi[], tick: number): Promise<void>;
};
declare const KHOA_TINH_NANG: Readonly<{
    readonly module: "__module_enabled";
    readonly regex: "__transform_enabled";
    readonly script: "__adapter_enabled";
}>;
/** Trạng thái cấu hình theo nhánh; vắng override thì giữ đúng cờ của file nguồn. */
export declare function tinhNangPresetDangBat(bienPack: Readonly<Record<string, unknown>> | undefined, loai: keyof typeof KHOA_TINH_NANG, id: string, macDinh: boolean): boolean;
export declare const usePreset: import("zustand").UseBoundStore<import("zustand").StoreApi<TrangThaiPreset>>;
/** Đọc pack đang bật ngoài React — `useGame` dùng cái này, không dùng hook. */
export declare function packDangBat(): readonly PackDangBat[];
export {};
