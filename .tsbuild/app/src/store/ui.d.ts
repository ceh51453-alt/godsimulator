import type { BangSnapshot } from '../core/bang/schema.js';
import type { WorldView } from '../core/contracts/view.js';
import type { TabThongTin } from '../core/bang/thongTin.js';
/** Màn hình toàn trang. `sanh` là nhà; mọi thứ khác đều quay về được. */
export declare const MAN_HINH: readonly ["sanh", "cai_dat", "cai_dat_ai", "xuong_preset", "xuong_workflow", "xuong_registry", "lorebook", "ban_do_nhanh", "chan_doan", "vat_ly"];
export type ManHinh = (typeof MAN_HINH)[number];
export declare const TEN_MAN_HINH: Readonly<Record<ManHinh, string>>;
/** Lớp phủ đọc — [BB] 55.1: không chặn tương tác, không dừng thời gian. */
export declare const LOP_PHU: readonly ["khong", "bang_thien_dien", "thong_tin"];
export type LopPhu = (typeof LOP_PHU)[number];
/** Trần mục ghim của 58.11 — vượt thì yêu cầu bỏ một mục, không tự bỏ mục cũ. */
export declare const TRAN_GHIM = 12;
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
export declare const useUi: import("zustand").UseBoundStore<import("zustand").StoreApi<TrangThaiUi>>;
