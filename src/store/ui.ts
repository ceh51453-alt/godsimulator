/**
 * Store giao diện — Phần 58.2, 59.2, Phase 11.
 *
 * ── Vì sao trạng thái này KHÔNG nằm trong `WorldState` ──
 *
 * Cùng lý do với ngắt mạch AI và bộ hiệu chỉnh token: thu gọn một vùng của Bảng
 * không phải một sự kiện của thế giới. Nhét nó vào state sẽ làm `stateHash` đổi
 * theo thao tác giao diện, và cổng determinism của Phase 1 sập ngay.
 *
 * Nhưng nó cũng không được là state tạm của một component: [BB] 58.2 nói *"trạng
 * thái tab, bộ lọc và các mục ghim lưu theo save. Đổi nhánh dùng trạng thái riêng
 * của nhánh đó."* Nên nó ở đây, và nó xuống đĩa ở bảng `uiState` khóa theo
 * `[saveId+branchId]`.
 *
 * ── Một lớp phủ tại một thời điểm ──
 *
 * [BB] 58.1: *"`Tab` và `I` không được mở hai lớp phủ chồng nhau."* Trạng thái
 * `lopPhu` là một giá trị đơn chứ không phải hai cờ boolean — hai cờ thì sớm
 * muộn cũng có lúc cùng bật, và đó là lỗi không cách nào sửa ở tầng render.
 */
import { create } from 'zustand';
import { BangSnapshotSchema } from '../core/bang/schema.js';
import type { BangSnapshot } from '../core/bang/schema.js';
import { chupBang, danhDauDaXem } from '../core/bang/thienDien.js';
import type { WorldView } from '../core/contracts/view.js';
import type { TabThongTin } from '../core/bang/thongTin.js';
import { coIndexedDb, layDb } from '../db/instance.js';
import { docUiState, ghiUiState } from '../db/preset.js';

/** Màn hình toàn trang. `sanh` là nhà; mọi thứ khác đều quay về được. */
export const MAN_HINH = [
  'sanh',
  /**
   * Cửa gộp của Phase 12 — bốn tab: proxy AI, preset, lorebook, workflow.
   *
   * `cai_dat_ai`, `xuong_preset`, `xuong_workflow` và `lorebook` vẫn còn trong
   * danh sách vì mục "Cần chú ý" của Bảng Thiên Diễn trỏ thẳng tới từng cái
   * (58.9: mỗi mục phải mở đúng CHỖ XỬ LÝ, không phải một trang mục lục). App
   * dựng chúng bằng cùng một component `CaiDat` với tab mở sẵn khác nhau.
   */
  'cai_dat',
  'cai_dat_ai',
  'xuong_preset',
  'xuong_workflow',
  'xuong_registry',
  'lorebook',
  'ban_do_nhanh',
  'chan_doan',
  'vat_ly',
] as const;
export type ManHinh = (typeof MAN_HINH)[number];

export const TEN_MAN_HINH: Readonly<Record<ManHinh, string>> = Object.freeze({
  sanh: 'Sảnh Thiên Diễn',
  cai_dat: 'Cài Đặt',
  cai_dat_ai: 'Cài Đặt · Proxy AI',
  xuong_preset: 'Cài Đặt · Xưởng Preset',
  xuong_workflow: 'Cài Đặt · Xưởng Workflow',
  xuong_registry: 'Xưởng Registry',
  lorebook: 'Cài Đặt · Lorebook và Đối Soát',
  ban_do_nhanh: 'Bản Đồ Nhánh',
  chan_doan: 'Tự Chẩn Đoán',
  vat_ly: 'Vật Lý Thế Giới',
});

/** Lớp phủ đọc — [BB] 55.1: không chặn tương tác, không dừng thời gian. */
export const LOP_PHU = ['khong', 'bang_thien_dien', 'thong_tin'] as const;
export type LopPhu = (typeof LOP_PHU)[number];

/** Trần mục ghim của 58.11 — vượt thì yêu cầu bỏ một mục, không tự bỏ mục cũ. */
export const TRAN_GHIM = 12;

export type TrangThaiUi = {
  man: ManHinh;
  lopPhu: LopPhu;
  tab: TabThongTin;
  tim: string;
  theoDoiMachIds: readonly string[];
  ghimTongQuan: readonly string[];
  anhBang: BangSnapshot | null;
  /** Ghim quá trần thì báo, không âm thầm bỏ mục cũ. */
  loiGhim: string;
  saveId: string;
  branchId: string;
  daNap: boolean;

  /**
   * Nạp trạng thái của một save/nhánh.
   *
   * KHÔNG nhận `WorldView`: `view` đổi mỗi lượt, và một hàm nạp-từ-đĩa nhận nó
   * sẽ bị `useEffect` gọi lại mỗi lượt, ghi đè ảnh chụp đang có bằng bản trên
   * đĩa. Ảnh chụp đầu tiên do `chupTheoTick()` dựng — nó vốn xử lý được `null`.
   */
  napTuDia(saveId: string, branchId: string): Promise<void>;
  doiMan(man: ManHinh): void;
  /** `Tab` — mở/đóng Bảng Thiên Diễn. Đang ở Thông Tin thì chuyển sang. */
  batBangThienDien(view: WorldView | null): void;
  /** `I` — mở/đóng Bảng Thông Tin. Đang ở Bảng Thiên Diễn thì chuyển sang. */
  batThongTin(view: WorldView | null): void;
  dongLopPhu(view: WorldView | null): void;
  doiTab(tab: TabThongTin): void;
  datTim(q: string): void;
  ghimMach(machId: string): void;
  ghimMuc(id: string): void;
  boGhim(id: string): void;
  /**
   * Ghim một chỉ số lên Thanh Thiên Tượng — 55.2 [MR], 58.11.
   *
   * Khác `ghimMuc()`: mục ghim của Thanh nằm trong `anhBang.ghim` chứ không nằm
   * trong `ghimTongQuan`. Hai danh sách, hai chỗ, hai trần — và trộn chúng lại
   * sẽ làm một mục ghim ở Bảng Tổng Quan tự nhảy lên thanh trên cùng.
   *
   * `anhBang === null` (chưa chụp lần nào) thì thao tác bị bỏ qua, không tạo ảnh
   * chụp rỗng: ảnh chụp đầu tiên là việc của `chupTheoTick()`, và dựng một ảnh
   * nửa vời ở đây sẽ làm vùng "Từ lần trước" so với một mốc không có thật.
   */
  ghimThienTuong(khoa: string): void;
  boGhimThienTuong(khoa: string): void;
  /** Vật chất hoá ảnh chụp ở RANH GIỚI TICK — [BB] 55.8. */
  chupTheoTick(view: WorldView): void;
};

function luu(s: {
  saveId: string;
  branchId: string;
  anhBang: BangSnapshot | null;
  tab: TabThongTin;
  theoDoiMachIds: readonly string[];
  ghimTongQuan: readonly string[];
}): void {
  if (!coIndexedDb() || s.saveId === '') return;
  void ghiUiState(layDb(), {
    saveId: s.saveId,
    branchId: s.branchId,
    anhBang: s.anhBang,
    tabThongTin: s.tab,
    theoDoiMachIds: [...s.theoDoiMachIds],
    ghimTongQuan: [...s.ghimTongQuan],
  }).catch(() => {
    // Không ghi được trạng thái giao diện là chuyện phiền, không phải chuyện chết.
  });
}

export const useUi = create<TrangThaiUi>((set, get) => ({
  man: 'sanh',
  lopPhu: 'khong',
  tab: 'tong_quan',
  tim: '',
  theoDoiMachIds: [],
  ghimTongQuan: [],
  anhBang: null,
  loiGhim: '',
  saveId: '',
  branchId: '',
  daNap: false,

  async napTuDia(saveId, branchId) {
    if (!coIndexedDb()) {
      set({ saveId, branchId, anhBang: null, daNap: true });
      return;
    }
    try {
      const hang = await docUiState(layDb(), saveId, branchId);
      const anh = hang?.anhBang === undefined ? null : BangSnapshotSchema.safeParse(hang.anhBang);
      set({
        saveId,
        branchId,
        // [BB] 55.8 — ảnh của tầng khác không được tái dùng. `chupBang()` tự vứt
        // nó ở lần chụp đầu tiên; ở đây chỉ cần không cố sửa nó cho khớp.
        anhBang: anh !== null && anh.success ? anh.data : null,
        tab: (hang?.tabThongTin as TabThongTin) ?? 'tong_quan',
        theoDoiMachIds: hang?.theoDoiMachIds ?? [],
        ghimTongQuan: hang?.ghimTongQuan ?? [],
        daNap: true,
      });
    } catch {
      set({ saveId, branchId, anhBang: null, daNap: true });
    }
  },

  doiMan(man) {
    // Mở một màn toàn trang thì đóng lớp phủ: hai thứ chồng nhau là đúng cái
    // 58.1 cấm, chỉ khác trục.
    set({ man, lopPhu: 'khong' });
  },

  batBangThienDien(view) {
    const hienTai = get().lopPhu;
    if (hienTai === 'bang_thien_dien') {
      get().dongLopPhu(view);
      return;
    }
    set({ lopPhu: 'bang_thien_dien' });
  },

  batThongTin(view) {
    const hienTai = get().lopPhu;
    if (hienTai === 'thong_tin') {
      get().dongLopPhu(view);
      return;
    }
    set({ lopPhu: 'thong_tin' });
  },

  /**
   * Đóng lớp phủ và ghi mốc "đã xem".
   *
   * [BB] 55.4 — mốc của vùng "Từ lần trước" là *lần cuối người chơi mở Bảng*, và
   * nó được ghi khi ĐÓNG chứ không khi mở: ghi lúc mở thì diff tự xoá chính nó
   * trước khi người chơi kịp đọc dòng đầu tiên.
   */
  dongLopPhu(view) {
    const s = get();
    if (s.lopPhu === 'bang_thien_dien' && view !== null && s.anhBang !== null) {
      const anh = danhDauDaXem(s.anhBang, view);
      set({ lopPhu: 'khong', anhBang: anh });
      luu({ ...s, anhBang: anh });
      return;
    }
    set({ lopPhu: 'khong' });
  },

  doiTab(tab) {
    set({ tab, tim: '' });
    luu({ ...get(), tab });
  },

  datTim(q) {
    set({ tim: q });
  },

  ghimMach(machId) {
    const ds = get().theoDoiMachIds;
    const moi = ds.includes(machId) ? ds.filter((x) => x !== machId) : [...ds, machId];
    set({ theoDoiMachIds: moi });
    luu({ ...get(), theoDoiMachIds: moi });
  },

  ghimMuc(id) {
    const ds = get().ghimTongQuan;
    if (ds.includes(id)) return;
    if (ds.length >= TRAN_GHIM) {
      // [BB] 58.11 — vượt trần thì YÊU CẦU bỏ một mục, không tự bỏ mục cũ nhất.
      set({ loiGhim: `Tổng quan chỉ giữ ${TRAN_GHIM} mục ghim. Hãy bỏ một mục trước khi ghim thêm.` });
      return;
    }
    const moi = [...ds, id];
    set({ ghimTongQuan: moi, loiGhim: '' });
    luu({ ...get(), ghimTongQuan: moi });
  },

  boGhim(id) {
    const moi = get().ghimTongQuan.filter((x) => x !== id);
    set({ ghimTongQuan: moi, loiGhim: '' });
    luu({ ...get(), ghimTongQuan: moi });
  },

  ghimThienTuong(khoa) {
    const anh = get().anhBang;
    if (anh === null || anh.ghim.includes(khoa)) return;
    if (anh.ghim.length >= TRAN_GHIM) {
      // [BB] 58.11 — yêu cầu bỏ một mục, không tự bỏ mục cũ nhất.
      set({ loiGhim: `Thanh Thiên Tượng chỉ giữ ${TRAN_GHIM} mục ghim. Hãy bỏ một mục trước.` });
      return;
    }
    const moi = { ...anh, ghim: [...anh.ghim, khoa] };
    set({ anhBang: moi, loiGhim: '' });
    luu({ ...get(), anhBang: moi });
  },

  boGhimThienTuong(khoa) {
    const anh = get().anhBang;
    if (anh === null) return;
    const moi = { ...anh, ghim: anh.ghim.filter((x) => x !== khoa) };
    set({ anhBang: moi, loiGhim: '' });
    luu({ ...get(), anhBang: moi });
  },

  chupTheoTick(view) {
    const cu = get().anhBang;
    if (cu !== null && cu.tickTinh === view.tick && cu.mode === view.mode && cu.branchId === view.branchId) {
      return;
    }
    const anh = chupBang(view, cu);
    set({ anhBang: anh });
    luu({ ...get(), anhBang: anh });
  },
}));
