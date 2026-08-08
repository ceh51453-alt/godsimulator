/**
 * Tuỳ chỉnh cách đọc lời kể do AI trả về.
 *
 * Đây là sở thích của người đọc, không phải trạng thái thế giới và cũng không
 * thuộc riêng một save. Vì vậy nó được lưu toàn cục trên thiết bị thay vì đi vào
 * WorldState hoặc bảng uiState theo nhánh.
 */
import { create } from 'zustand';

export const PHONG_CHU_AI = ['mac_dinh', 'khong_chan', 'co_chan', 'don_cach'] as const;
export type PhongChuAi = (typeof PHONG_CHU_AI)[number];

export type CaiDatVanBanAi = {
  coChu: number;
  gianDong: number;
  gianChu: number;
  phongChu: PhongChuAi;
};

export const CAI_DAT_VAN_BAN_AI_MAC_DINH: Readonly<CaiDatVanBanAi> = Object.freeze({
  coChu: 14,
  gianDong: 1.65,
  gianChu: 0,
  phongChu: 'mac_dinh',
});

export const GIA_TRI_FONT_AI: Readonly<Record<PhongChuAi, string>> = Object.freeze({
  mac_dinh: 'var(--chu-than)',
  khong_chan: "system-ui, 'Segoe UI', Roboto, sans-serif",
  co_chan: "var(--chu-ke), Georgia, 'Times New Roman', serif",
  don_cach: "var(--chu-so), ui-monospace, 'Cascadia Mono', Consolas, monospace",
});

const KHOA_LUU = 'thien-dien:cai-dat-van-ban-ai:v1';

function kep(x: number, thap: number, cao: number): number {
  return Math.min(cao, Math.max(thap, x));
}

/** Chặn dữ liệu cũ hoặc bị sửa tay làm vỡ bố cục. */
export function chuanHoaCaiDatVanBanAi(tho: unknown): CaiDatVanBanAi {
  if (typeof tho !== 'object' || tho === null) return { ...CAI_DAT_VAN_BAN_AI_MAC_DINH };
  const x = tho as Partial<Record<keyof CaiDatVanBanAi, unknown>>;
  return {
    coChu:
      typeof x.coChu === 'number' && Number.isFinite(x.coChu)
        ? kep(x.coChu, 12, 24)
        : CAI_DAT_VAN_BAN_AI_MAC_DINH.coChu,
    gianDong:
      typeof x.gianDong === 'number' && Number.isFinite(x.gianDong)
        ? kep(x.gianDong, 1.2, 2.2)
        : CAI_DAT_VAN_BAN_AI_MAC_DINH.gianDong,
    gianChu:
      typeof x.gianChu === 'number' && Number.isFinite(x.gianChu)
        ? kep(x.gianChu, -0.03, 0.12)
        : CAI_DAT_VAN_BAN_AI_MAC_DINH.gianChu,
    phongChu:
      typeof x.phongChu === 'string' && PHONG_CHU_AI.includes(x.phongChu as PhongChuAi)
        ? (x.phongChu as PhongChuAi)
        : CAI_DAT_VAN_BAN_AI_MAC_DINH.phongChu,
  };
}

function docTuMay(): CaiDatVanBanAi {
  if (typeof window === 'undefined') return { ...CAI_DAT_VAN_BAN_AI_MAC_DINH };
  try {
    const raw = window.localStorage.getItem(KHOA_LUU);
    return raw === null ? { ...CAI_DAT_VAN_BAN_AI_MAC_DINH } : chuanHoaCaiDatVanBanAi(JSON.parse(raw));
  } catch {
    return { ...CAI_DAT_VAN_BAN_AI_MAC_DINH };
  }
}

function ghiVaoMay(caiDat: CaiDatVanBanAi): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KHOA_LUU, JSON.stringify(caiDat));
  } catch {
    // Trình duyệt chặn bộ nhớ cục bộ chỉ làm mất khả năng nhớ, không được chặn chơi.
  }
}

type TrangThaiVanBanAi = {
  caiDat: CaiDatVanBanAi;
  thayDoi(banVa: Partial<CaiDatVanBanAi>): void;
  khoiPhucMacDinh(): void;
};

export const useVanBanAi = create<TrangThaiVanBanAi>((set, get) => ({
  caiDat: docTuMay(),
  thayDoi(banVa) {
    const caiDat = chuanHoaCaiDatVanBanAi({ ...get().caiDat, ...banVa });
    set({ caiDat });
    ghiVaoMay(caiDat);
  },
  khoiPhucMacDinh() {
    const caiDat = { ...CAI_DAT_VAN_BAN_AI_MAC_DINH };
    set({ caiDat });
    ghiVaoMay(caiDat);
  },
}));
