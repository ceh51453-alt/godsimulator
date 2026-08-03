/**
 * Thư viện Lorebook của máy.
 *
 * Lorebook trong `WorldState` vẫn thuộc riêng từng ván/nhánh. Thư viện này chỉ
 * giữ các file nguồn và lựa chọn “dùng cho ván mới”, nhờ vậy người chơi có thể
 * chuẩn bị sách trước khi thế giới tồn tại mà không làm rò trạng thái giữa các
 * ván đang chơi.
 */
import { create } from 'zustand';
import { z } from 'zod';
import { nhapLorebook } from '../core/lore/nhap.js';
import { hashCua } from '../core/engine/hash.js';
import { coIndexedDb, layDb } from '../db/instance.js';
const KHOA_THU_VIEN = 'lorebook.library.v1';
const TY_LE_TOKEN = 3.2;
export const MucThuVienLorebookSchema = z
    .object({
    id: z.string(),
    ten: z.string(),
    moTa: z.string().prefault(''),
    noiDung: z.string(),
    soEntry: z.number().int().nonnegative(),
    dinhDang: z.string(),
    chonChoVanMoi: z.boolean().prefault(false),
    dungSan: z.boolean().prefault(false),
})
    .strict();
const ThuVienSchema = z.array(MucThuVienLorebookSchema);
async function ghi(ds) {
    if (!coIndexedDb())
        return;
    await layDb().settings.put({ key: KHOA_THU_VIEN, value: [...ds] });
}
export const useThuVienLorebook = create((set, get) => ({
    muc: [],
    daNap: false,
    dangXuLy: false,
    loi: '',
    async napTuDia() {
        if (get().daNap)
            return;
        if (!coIndexedDb()) {
            set({ daNap: true });
            return;
        }
        try {
            const row = await layDb().settings.get(KHOA_THU_VIEN);
            const parsed = ThuVienSchema.safeParse(row?.value ?? []);
            set({
                muc: parsed.success ? parsed.data : [],
                daNap: true,
                loi: parsed.success ? '' : 'Thư viện Lorebook cũ bị hỏng nên không thể nạp.',
            });
        }
        catch (error) {
            set({ daNap: true, loi: `Không đọc được thư viện Lorebook: ${String(error)}` });
        }
    },
    async themTuChuoi(noiDung, ten, tuyChon = {}) {
        set({ dangXuLy: true, loi: '' });
        try {
            let goc;
            try {
                goc = JSON.parse(noiDung);
            }
            catch {
                set({ loi: 'File Lorebook không phải JSON đọc được.' });
                return false;
            }
            const id = `thu_vien_${hashCua(goc).slice(0, 20)}`;
            const tenSach = ten.trim() === '' ? id : ten.trim();
            const kq = nhapLorebook({
                goc,
                id,
                ten: tenSach,
                nguon: 'nguoi_dung',
                branchId: '__thu_vien__',
                tyLeToken: TY_LE_TOKEN,
            });
            if (!kq.ok || kq.lorebook === null) {
                set({ loi: kq.issues.find((x) => x.severity === 'error')?.message ?? 'Lorebook không hợp lệ.' });
                return false;
            }
            const cu = get().muc.find((x) => x.id === id);
            const moi = MucThuVienLorebookSchema.parse({
                id,
                ten: tenSach,
                moTa: kq.lorebook.moTa,
                noiDung,
                soEntry: kq.lorebook.entries.length,
                dinhDang: kq.dinhDang,
                chonChoVanMoi: tuyChon.chonChoVanMoi ?? cu?.chonChoVanMoi ?? false,
                dungSan: tuyChon.dungSan ?? cu?.dungSan ?? false,
            });
            const ds = [...get().muc.filter((x) => x.id !== id), moi].sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
            set({ muc: ds });
            await ghi(ds);
            return true;
        }
        catch (error) {
            set({ loi: `Không lưu được Lorebook: ${String(error)}` });
            return false;
        }
        finally {
            set({ dangXuLy: false });
        }
    },
    async datChonChoVanMoi(id, chon) {
        const ds = get().muc.map((x) => (x.id === id ? { ...x, chonChoVanMoi: chon } : x));
        set({ muc: ds, loi: '' });
        try {
            await ghi(ds);
        }
        catch (error) {
            set({ loi: `Không lưu được lựa chọn Lorebook: ${String(error)}` });
        }
    },
    async xoaKhoiThuVien(id) {
        const ds = get().muc.filter((x) => x.id !== id);
        set({ muc: ds, loi: '' });
        try {
            await ghi(ds);
        }
        catch (error) {
            set({ loi: `Không xóa được Lorebook khỏi thư viện: ${String(error)}` });
        }
    },
}));
