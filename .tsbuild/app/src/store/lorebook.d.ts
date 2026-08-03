import { z } from 'zod';
export declare const MucThuVienLorebookSchema: z.ZodObject<{
    id: z.ZodString;
    ten: z.ZodString;
    moTa: z.ZodPrefault<z.ZodString>;
    noiDung: z.ZodString;
    soEntry: z.ZodNumber;
    dinhDang: z.ZodString;
    chonChoVanMoi: z.ZodPrefault<z.ZodBoolean>;
    dungSan: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export type MucThuVienLorebook = z.infer<typeof MucThuVienLorebookSchema>;
export type TrangThaiThuVienLorebook = {
    muc: readonly MucThuVienLorebook[];
    daNap: boolean;
    dangXuLy: boolean;
    loi: string;
    napTuDia(): Promise<void>;
    themTuChuoi(noiDung: string, ten: string, tuyChon?: {
        dungSan?: boolean;
        chonChoVanMoi?: boolean;
    }): Promise<boolean>;
    datChonChoVanMoi(id: string, chon: boolean): Promise<void>;
    xoaKhoiThuVien(id: string): Promise<void>;
};
export declare const useThuVienLorebook: import("zustand").UseBoundStore<import("zustand").StoreApi<TrangThaiThuVienLorebook>>;
