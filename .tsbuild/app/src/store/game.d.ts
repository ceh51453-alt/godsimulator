import type { WorldState, EventLog } from '../core/engine/state.js';
import type { WorldView } from '../core/contracts/view.js';
import type { ViewMode } from '../core/contracts/primitives.js';
import type { CuaVao } from '../core/world/khoiTao.js';
import type { CanonDiff } from '../core/world/hienDien.js';
import type { StartingPresenceDraft, PlayerProfile, CreatorIdentity } from '../core/schema/player.js';
import type { ProjectedPlayerPersona } from '../core/schema/player.js';
import type { BanTin } from '../core/world/banTin.js';
import type { Affordance, ActionPlan, Project } from '../core/intent/schema.js';
import type { StructuredError } from '../core/contracts/errors.js';
import type { Prayer } from '../core/schema/than.js';
import type { CachDapDiHoa } from '../core/schema/aspect/thanVi.js';
import type { CachDuoc } from '../ui/panels/TheCauNguyen.js';
import type { UngVienChuThe } from '../core/than/chuThe.js';
import type { SoTay } from '../core/pham/soTay.js';
import type { PhatNgon } from '../core/pham/doiThoai.js';
import type { LuaChonTiepTuc } from '../core/pham/caiChet.js';
import type { PatchBiTuChoi } from '../core/ai/bocTach.js';
import type { TrangThaiOngKinh } from '../core/truyen/ongKinh.js';
import type { MucTieuOngKinh } from '../core/schema/truyen.js';
import type { DoVangMat } from '../core/truyen/machTruyen.js';
import type { KetQuaBoDanhGia } from '../core/retrieval/boDanhGia.js';
import type { KetQuaTruyHoi } from '../core/retrieval/truyHoi.js';
import type { MucSave } from '../db/quanLySave.js';
import type { TrucNen } from '../core/vatly/schema.js';
import type { BaoCaoDienHoa, CauHinhDienHoa } from '../core/world/dienHoa.js';
export type DongScene = {
    id: string;
    tick: number;
    loai: 'he_thong' | 'nguoi_choi' | 'ket_qua';
    noiDung: string;
    /** Văn bản trước regex hiển thị, dùng khi dựng lịch sử cho lượt sau. */
    noiDungGoc?: string;
    dinhDang?: 'text' | 'html';
};
export type TrangThaiGame = {
    state: WorldState | null;
    log: EventLog | null;
    view: WorldView | null;
    hoSo: PlayerProfile | null;
    persona: ProjectedPlayerPersona | null;
    scene: DongScene[];
    goiY: readonly Affordance[];
    projects: Project[];
    loi: StructuredError[];
    /** Kế hoạch đang chờ người chơi xác nhận (hành động không hoàn tác). */
    choXacNhan: {
        plan: ActionPlan;
        cau: string;
    } | null;
    stateHash: string;
    /**
     * Chuyện thế giới vừa làm trong lúc người chơi đang nói — đã lọc theo điều
     * chủ thể biết được (72.2). Đây là thứ Narrator kể ở lượt sau.
     */
    banTin: BanTin | null;
    /** Patch mà AI đề nghị và engine từ chối — vào bảng Tự Chẩn Đoán, không vào world. */
    patchBiTuChoi: readonly PatchBiTuChoi[];
    /**
     * Những gì bộ vệ sinh văn bản đã phải lọc — Phase 12.
     *
     * Rỗng là trạng thái bình thường. Khác rỗng nghĩa là có ký tự đảo chiều, ký tự
     * vô hình hoặc chuỗi quá dài đi vào từ model hoặc từ một preset, và người dùng
     * có quyền biết điều đó thay vì chỉ được đưa cho một chuỗi đã sạch.
     */
    vetVeSinh: readonly string[];
    /** Lựa chọn hành động từ `<choice>` block trong output AI. Rỗng = không có. */
    luaChon: readonly string[];
    /** Đang chờ Narrator viết xong. UI khóa ô nhập trong lúc này. */
    dangKe: boolean;
    /** Đang gọi AI rà soát trạng thái theo yêu cầu của người chơi. */
    dangCapNhatBien: boolean;
    /**
     * Lượt đã xảy ra trong engine nhưng CHƯA ai kể — [BB] ADR-0028 + ADR-0056.
     *
     * `null` là trạng thái bình thường. Khác `null` nghĩa là thế giới đã đi tiếp
     * một nhịp mà người chơi không được đọc nhịp ấy, và đó là hỏng chứ không phải
     * một chế độ chơi: `doiCong()` chặn mọi hành động tiếp theo cho tới khi
     * `keLai()` thành công. Không có đường nào "cứ chơi tiếp không cần lời kể".
     */
    luotChuaKe: {
        cau: string;
        ketQuaEngine: readonly string[];
    } | null;
    /** Kể lại lượt đang treo. Cổng phải mở trước, nếu không nó không thử. */
    keLai(): Promise<void>;
    /** Danh sách ván trên máy này — màn chính đọc nó. Rỗng trước khi nạp. */
    danhSachVan: readonly MucSave[];
    dangLuu: boolean;
    /** Nhịp lúc lưu lần cuối; `null` = ván này chưa từng xuống đĩa. */
    tickDaLuu: number | null;
    napDanhSachVan(): Promise<void>;
    /** Ghi ván hiện tại xuống đĩa. Không có IndexedDB thì im lặng bỏ qua. */
    luuVan(ten?: string): Promise<void>;
    /** Mở lại một ván đã lưu. Trả `false` nếu không nạp được. */
    tiepTucVan(branchId: string): Promise<boolean>;
    xoaVanTheoId(branchId: string): Promise<void>;
    doiTenVanTheoId(branchId: string, ten: string): Promise<void>;
    /** Nội dung file `.json` để tải về; `null` khi chưa có ván nào đang mở. */
    xuatVanRaChuoi(kemHoSoRiengTu: boolean): Promise<string | null>;
    /**
     * Xuất một ván ĐANG NẰM TRÊN ĐĨA mà không mở nó.
     *
     * Cần thiết vì màn chính phải xuất được file khi chưa vào ván nào — và vì "mở
     * ván rồi xuất rồi quay ra" sẽ ghi đè ván đang chơi dở bằng ván vừa xem.
     */
    xuatVanTheoIdRaChuoi(branchId: string, kemHoSoRiengTu: boolean): Promise<string | null>;
    /** Nạp một file save. Trả `false` kèm `loi` khi file hỏng. */
    nhapVanTuChuoi(noiDung: string): Promise<boolean>;
    /** Rời ván về màn chính. Lưu trước khi rời — không hỏi, không mất. */
    roiVan(): Promise<void>;
    /**
     * Nhập một lorebook từ nội dung file.
     *
     * [BB] `nguon = 'nguoi_dung'` luôn luôn, và không có tham số để đổi: 50.10 cấm
     * workflow ghi vào lorebook người dùng, và phân biệt ấy chỉ có nghĩa khi không
     * có đường nào để một file tự khai mình là `tu_sinh`.
     */
    nhapLorebookTuChuoi(noiDung: string, ten: string): Promise<boolean>;
    /** Bật/tắt một lorebook. Đi qua Event như mọi thay đổi state khác. */
    batLorebook(id: string, bat: boolean): void;
    /** Xóa sách khỏi nhánh hiện tại; lịch sử đã hiện thực hóa vẫn được giữ. */
    xoaLorebook(id: string): Promise<void>;
    /**
     * Đặt tên một trục Luật Nền — [BB] 43.2, 43.3, 43.5.
     *
     * Trả về danh sách lý do bị chặn; rỗng nghĩa là đã đặt được. Ba điều kiện của
     * `datTenTruc()` đều chặn thật, và câu từ chối là câu người đọc được chứ không
     * phải mã lỗi.
     */
    datTenTrucNen(truc: TrucNen, khaiNiemNenId: string): readonly string[];
    /** Quét lại bốn cơ chế phái sinh — 44.4. Trả về các câu công bố vừa sinh. */
    quetCoCheNgay(): readonly string[];
    /**
     * Tách một nhánh mới từ ván đang chơi — copy-on-write, KHÔNG sao chép dữ liệu.
     *
     * Ba bước, và thứ tự có nghĩa: lưu nhánh cha xuống đĩa trước (nếu không, nhánh
     * con sẽ lần lên một nhánh cha chưa tồn tại), rồi ghi bản ghi nhánh, rồi NẠP
     * LẠI từ đĩa. Nạp lại thay vì sửa state trong bộ nhớ vì `napState()` là chỗ
     * duy nhất biết cách đóng dấu `branchId` cho bản ghi kế thừa — làm tay thì
     * bất biến `entity_dung_nhanh` sẽ báo sai ở transaction kế tiếp.
     */
    tachNhanh(ten: string, lyDo: string): Promise<boolean>;
    /** Báo cáo lần Diễn Hóa gần nhất; `null` nghĩa là chưa ai chạy. */
    baoCaoDienHoa: BaoCaoDienHoa | null;
    dangDienHoa: boolean;
    /**
     * Tua thế giới nhiều nhịp liền, dừng ở điều đáng xem — [BB] 47.3.
     *
     * Chỉ MỘT lượt kể ở cuối, không phải mỗi nhịp một lượt: đó là điểm khác nhau
     * giữa tua nhanh và chơi chậm. Cổng AI vẫn phải mở — [BB] ADR-0028 không có
     * ngoại lệ cho chế độ tua.
     *
     * `presetId` chọn đường ống workflow chạy sau mỗi lượt tua. Bỏ trống hoặc chọn
     * `trong` thì chỉ có engine chạy — hợp lệ, và là mặc định khi điểm cuối Diễn
     * Hóa chưa bật.
     */
    chayDienHoa(cauHinh: Partial<CauHinhDienHoa> & {
        presetId?: string;
    }): Promise<void>;
    /** Kết quả từng giai đoạn của đường ống ở lần chạy gần nhất — Xưởng Workflow đọc. */
    vetDuongOng: readonly {
        giaiDoan: number;
        taskId: string;
        chay: boolean;
        lyDo: string;
        soCall: number;
        soKyTuRa: number;
        thatBai: number;
    }[];
    /** [BB] 29.1 — ống kính là chuyện XEM, không phải chuyện chơi: đổi không tốn lượt. */
    ongKinh: TrangThaiOngKinh;
    /** Lý do engine chọn chỗ chiếu — hiện thẳng lên UI, không giấu. */
    viChieu: string;
    /** [BB] 28.6 — đo theo SỐ CẢNH. Dưới ngưỡng thì ống kính tự ưu tiên mạch xa. */
    vangMat: DoVangMat;
    /** Trace của lượt truy hồi gần nhất — tab Truy hồi (77.11). */
    truyHoiCuoi: KetQuaTruyHoi | null;
    /** Vết cắt ngân sách token của prompt gần nhất — cổng "budget có trace". */
    vetCatToken: readonly {
        tang: number;
        ten: string;
        vi: string;
    }[];
    /**
     * Preset đã góp gì vào prompt vừa gửi — Xưởng Preset và bảng chẩn đoán đọc nó.
     *
     * Không có trace này thì "pack đang bật" là một lời hứa không kiểm được: người
     * dùng thấy nút bật màu sáng mà không có cách nào biết module nào thật sự tới
     * được model, module nào bị ngân sách cắt, macro nào chưa ai ánh xạ.
     */
    presetTrace: {
        packDaDung: readonly string[];
        moduleBiBo: readonly string[];
        macroChuaGiai: readonly string[];
        issues: readonly string[];
    };
    /**
     * Danh tính Sáng Thế — [BB] 78.1 lớp thứ hai, tách hẳn khỏi `hoSo`.
     *
     * `null` là trạng thái hợp lệ và là mặc định: người chơi bỏ qua wizard thì thế
     * giới gọi họ là "Kẻ Không Tên". Nó KHÔNG bao giờ đi thẳng vào prompt —
     * `chieuPersona()` chỉ lấy phần đã được **công bố**.
     */
    danhTinh: CreatorIdentity | null;
    /** Cửa đầy đủ của wizard 78.5 — bốn chế độ đều gọi vào đây. */
    batDau(input: {
        hoSo: PlayerProfile;
        danhTinh: CreatorIdentity | null;
        cua: CuaVao;
        motCau: string;
    }): Promise<void>;
    batDauNhanh(displayName: string, cua: CuaVao, motCau: string): Promise<void>;
    batDauBoQua(): Promise<void>;
    /**
     * Sửa hồ sơ SAU khi đã bắt đầu — [BB] cổng Phase 11.
     *
     * "Chỉnh hồ sơ sau khi bắt đầu không làm World đổi âm thầm": hàm này KHÔNG
     * sinh Event và KHÔNG chạm `WorldState`. Nó chỉ đổi persona chiếu ra, tức là
     * đổi cách thế giới GỌI người chơi, không đổi thế giới.
     */
    suaHoSo(hoSo: PlayerProfile, danhTinh: CreatorIdentity | null): void;
    chonHienDien(draft: StartingPresenceDraft): Promise<CanonDiff | null>;
    chuyenTang(mode: ViewMode, chuTheId: string | null): Promise<void>;
    /**
     * Rà lại diễn biến gần đây bằng AI, áp các patch hợp lệ rồi nối khái niệm nền
     * đủ điều kiện với bảy trục Luật Nền. Không làm thời gian trôi.
     */
    capNhatBienNgay(): Promise<void>;
    gui(cau: string): Promise<void>;
    xacNhan(dongY: boolean): Promise<void>;
    tick(soLan?: number): Promise<void>;
    lamMoi(): void;
    /** Chĩa ống kính. [BB] 29.1 — KHÔNG tốn lượt, KHÔNG tốn thời gian trong game. */
    chiaOngKinh(mucTieu: MucTieuOngKinh): void;
    /**
     * Chạy bộ đánh giá truy hồi trên chính thế giới này — 77.10, nút của 77.11.
     *
     * Không tốn lượt và không đổi state: nó chỉ đọc, đúng như ống kính.
     */
    chayDanhGiaTruyHoi(): Promise<void>;
    /** Kết quả lần chạy gần nhất; `null` nghĩa là chưa ai bấm. */
    danhGiaTruyHoi: KetQuaBoDanhGia | null;
    dangDanhGia: boolean;
    /** Chủ thể chọn được ở một tầng — Phần 21.3; sửa lỗi "bấm Thần ra Phàm Nhân". */
    ungVienChuThe(mode: ViewMode): readonly UngVienChuThe[];
    /** Lời cầu đang chờ vị thần người chơi đang nhập — Phần 22.4. */
    loiCauDangCho(): readonly Prayer[];
    /** [BB] 22.3 — cả bốn cách đều sinh Event và đều có hậu quả. */
    traLoi(cau: Prayer, cach: CachDuoc): Promise<void>;
    /** [BB] 69.1 — cửa DUY NHẤT để `coreSelf` đổi. */
    dapApLuc(tinhHuongId: string, cach: CachDapDiHoa): Promise<void>;
    /** [BB] 56.1 — Sổ Tay thay hẳn Bảng Thiên Diễn ở tầng phàm nhân. */
    soTay(): SoTay | null;
    /** [BB] 70.4 — nói một câu CÓ HẬU QUẢ: sinh Event, tri thức và quan hệ. */
    noiVoi(pn: Omit<PhatNgon, 'nguoiNoiId'>): Promise<void>;
    /** Xin học một người. Thầy có quyền từ chối — 70.2. */
    xinHocNghe(thayId: string): Promise<void>;
    /** Lập một hộ ở nơi mình đang ở. */
    lapNhaMoi(ten: string): Promise<void>;
    /**
     * Ba đường sau khi chết — [BB] 20.3. Rỗng nghĩa là chưa chết, hoặc thế giới
     * không còn ai; cả hai đều KHÔNG phải Game Over.
     */
    duongTiepTuc(): readonly LuaChonTiepTuc[];
    /** Chọn một trong ba đường. Anh Linh Hóa Thần đưa lên tầng Thần. */
    diTiep(chon: LuaChonTiepTuc): Promise<void>;
};
export declare const useGame: import("zustand").UseBoundStore<import("zustand").StoreApi<TrangThaiGame>>;
