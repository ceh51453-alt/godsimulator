/**
 * Quản lý Lorebook tự sinh: tạo Sử của thế giới, hợp nhất entry lặp và cung cấp
 * khóa nội dung ổn định cho lớp truy hồi.
 *
 * File này chỉ làm biến đổi thuần. Việc ghi vào WorldState vẫn phải đi qua
 * Event/Patch ở store, giống mọi thay đổi thế giới khác.
 */
import { LorebookSchema } from './schema.js';
import type { Lorebook, LorebookEntry } from './schema.js';

export const ID_LOREBOOK_SU_THE_GIOI = 'lore.su.the_gioi';

/** Sách đích duy nhất cho những điều workflow xác nhận là đã xảy ra. */
export function taoLorebookSuTheGioi(branchId: string): Lorebook {
  return LorebookSchema.parse({
    id: ID_LOREBOOK_SU_THE_GIOI,
    branchId,
    ten: 'Sử của thế giới',
    thanHe: 'Thế giới hiện tại',
    moTa: 'Tự cập nhật từ các sự kiện và tác vụ hậu trường; không ghi đè lorebook bạn nhập.',
    bat: true,
    uuTien: 1_000,
    lucHapDan: 100,
    version: '1.0',
    nguon: 'tu_sinh',
    conflictPolicy: 'dung_hop',
    nhipMoGiaiDoan: 1,
    soDiemHutMoiLuot: 3,
    tickBat: 0,
    entries: [],
  });
}

/** Chuẩn hóa đủ mạnh để bắt bản sao do khác hoa/thường, dấu câu hoặc khoảng trắng. */
export function chuanHoaNoiDungLore(noiDung: string): string {
  return noiDung
    .normalize('NFKC')
    .toLocaleLowerCase('vi')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Khóa nội dung dùng để không đưa hai bản giống hệt nhau vào RAG. */
export function khoaNoiDungLore(noiDung: string): string {
  return chuanHoaNoiDungLore(noiDung);
}

export type KetQuaHopNhatEntry = Readonly<{
  lorebook: Lorebook;
  entryId: string;
  thayDoi: boolean;
  kieu: 'them' | 'cap_nhat' | 'trung_khop';
}>;

/**
 * Upsert một entry tự sinh.
 *
 * ID do workflow tạo là ổn định theo tác vụ + tên entry. Nếu một workflow đổi
 * tên nhưng vẫn trả lại đúng cùng nội dung, khóa nội dung sẽ bắt nó và giữ entry
 * cũ. Nhờ vậy một lượt chạy lặp không làm lorebook phình vô hạn.
 */
export function hopNhatEntryTuSinh(lorebook: Lorebook, moi: LorebookEntry): KetQuaHopNhatEntry {
  const khoaMoi = khoaNoiDungLore(moi.noiDung);
  const viTriId = lorebook.entries.findIndex((e) => e.id === moi.id);
  const viTriNoiDung =
    khoaMoi === ''
      ? -1
      : lorebook.entries.findIndex((e) => e.trangThai !== 'da_xoa' && khoaNoiDungLore(e.noiDung) === khoaMoi);
  const viTri = viTriId >= 0 ? viTriId : viTriNoiDung;

  if (viTri < 0) {
    return {
      lorebook: { ...lorebook, entries: [...lorebook.entries, moi] },
      entryId: moi.id,
      thayDoi: true,
      kieu: 'them',
    };
  }

  const cu = lorebook.entries[viTri] as LorebookEntry;
  const suKienChongLung = [...new Set([...cu.suKienChongLung, ...moi.suKienChongLung])];
  const cungNoiDung = khoaNoiDungLore(cu.noiDung) === khoaMoi;
  const khongCoNguonMoi = suKienChongLung.length === cu.suKienChongLung.length;
  if (cungNoiDung && khongCoNguonMoi) {
    return { lorebook, entryId: cu.id, thayDoi: false, kieu: 'trung_khop' };
  }

  const capNhat: LorebookEntry = {
    ...cu,
    ten: moi.ten,
    keys: [...new Set([...cu.keys, ...moi.keys])],
    secondaryKeys: [...new Set([...cu.secondaryKeys, ...moi.secondaryKeys])],
    noiDung: cungNoiDung ? cu.noiDung : moi.noiDung,
    lop: moi.lop,
    order: moi.order,
    doSau: moi.doSau,
    uocLuongToken: cungNoiDung ? cu.uocLuongToken : moi.uocLuongToken,
    doTinCay: Math.max(cu.doTinCay, moi.doTinCay),
    suKienChongLung,
    // Một entry đã bị người chơi che không được workflow lén bật lại.
    trangThai: cu.trangThai,
    biCheBoiId: cu.biCheBoiId,
    lyDoChe: cu.lyDoChe,
    tickChe: cu.tickChe,
    lichSu: [
      ...cu.lichSu.slice(-19),
      ...(cungNoiDung
        ? []
        : [
            {
              tick: moi.lichSu.at(-1)?.tick ?? 0,
              boiAi: 'workflow' as const,
              op: 'cap_nhat',
              truoc: cu.noiDung,
              sau: moi.noiDung,
              lyDo: 'tác vụ cập nhật entry tự sinh',
            },
          ]),
    ].slice(-20),
  };
  const entries = [...lorebook.entries];
  entries[viTri] = capNhat;
  return {
    lorebook: { ...lorebook, entries },
    entryId: cu.id,
    thayDoi: true,
    kieu: cungNoiDung ? 'trung_khop' : 'cap_nhat',
  };
}
