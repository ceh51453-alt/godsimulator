/**
 * Store runtime — Zustand. Phần 3.1.
 *
 * [BB] Luật bất biến #5: UI, Narrator và preset KHÔNG ghi thẳng World.
 * Store này chỉ gọi `apDungEvent`; nó không bao giờ sửa `WorldState` trực tiếp.
 *
 * [BB] ADR-0028 — **không có AI thì không chơi.** Mọi hành động chơi đi qua
 * `doiCong()` trước. Đây không phải một lớp kiểm tra cho vui: engine vẫn chạy
 * được không AI (và test vẫn chứng minh điều đó ở tầng `core/`), nhưng *trò chơi*
 * thì không — vì không có ai kể, và một mô phỏng không lời kể là bảng tính.
 *
 * ── Ai nói câu nào ──
 *
 *   engine  quyết điều gì xảy ra, và giữ mọi con số
 *   AI      kể lại điều đã xảy ra, và chỉ được đổi thế giới qua khối <CapNhat>
 *           đã bị `bocTach()` duyệt
 *
 * Nói cách khác: AI là bắt buộc, nhưng AI không cầm sổ (71.5).
 */
import { create } from 'zustand';
import { useThuVienLorebook } from './lorebook.js';
import type { WorldState, EventLog } from '../core/engine/state.js';
import { SceneSchema } from '../core/contracts/core.js';
import type { Scene } from '../core/contracts/core.js';
import { bienSoanLuot } from '../core/preset/hopNhat.js';
import type { OmitReason } from '../core/preset/schema.js';
import { parseChoice } from '../core/ai/choice.js';
import { packDangBat, usePreset } from './preset.js';
import { TAVERN_EVENTS } from '../runtime/tavern/suKien.js';
import { taoState, taoEventLog, hashState, saoChepNong } from '../core/engine/state.js';
import { apDungChuoi, apDungEvent } from '../core/engine/transaction.js';
import { chieu } from '../core/project/chieu.js';
import type { WorldView } from '../core/contracts/view.js';
import type { PatchOp, Event as SuKien } from '../core/contracts/core.js';
import { VIEW_MODES } from '../core/contracts/primitives.js';
import type { ViewMode } from '../core/contracts/primitives.js';
import { moTheGioiTrong, KhoiTaoWorldSchema } from '../core/world/khoiTao.js';
import type { CuaVao } from '../core/world/khoiTao.js';
import { eventHienDien, eventChuyenTang } from '../core/world/hienDien.js';
import type { CanonDiff } from '../core/world/hienDien.js';
import { StartingPresenceDraftSchema } from '../core/schema/player.js';
import type { StartingPresenceDraft, PlayerProfile, CreatorIdentity } from '../core/schema/player.js';
import { hoSoToiThieu } from '../core/schema/player.js';
import { chieuPersona } from '../core/privacy/project.js';
import type { ProjectedPlayerPersona } from '../core/schema/player.js';
import { motTick } from '../core/engine/tick.js';
import { chayTienTrinhNen } from '../core/world/process/scheduler.js';
import { eventGieoNen } from '../core/world/gieoNen.js';
import { napBatBienTheGioiSong } from '../core/world/batBien.js';
import { napBatBienTangThan } from '../core/world/batBienThan.js';
import { napBatBienTangPham } from '../core/world/batBienPham.js';
import { banTinCho } from '../core/world/banTin.js';
import type { BanTin } from '../core/world/banTin.js';
import type { UngVienSuKienTick } from '../core/engine/tick.js';
import { TUNING_MAC_DINH } from '../core/tuning/schema.js';
import { parseIntent } from '../core/intent/parser.js';
import { giaiQuyet } from '../core/intent/resolve.js';
import { goiYChoCanh } from '../core/intent/affordance.js';
import type { Affordance, ActionPlan, Project } from '../core/intent/schema.js';
import type { StructuredError } from '../core/contracts/errors.js';
import { loi } from '../core/contracts/errors.js';
import { taoEvent } from '../core/engine/transaction.js';
import { traLoiCau, loiCauCho } from '../core/than/cauNguyen.js';
import { dapDiHoa } from '../core/than/diHoa.js';
import type { TrucBanTinh } from '../core/than/diHoa.js';
import type { Prayer } from '../core/schema/than.js';
import type { CachDapDiHoa, DivineIdentity } from '../core/schema/aspect/thanVi.js';
import type { CachDuoc } from '../ui/panels/TheCauNguyen.js';
import { rngCuaTick } from '../core/engine/rng.js';
import { patchGhiBanGhi } from '../core/engine/patch.js';
import { chonChuThe, chuTheMacDinhCho } from '../core/than/chuThe.js';
import type { UngVienChuThe } from '../core/than/chuThe.js';
import { dungSoTay } from '../core/pham/soTay.js';
import type { SoTay } from '../core/pham/soTay.js';
import { dangODau } from '../core/pham/lich.js';
import { noi as noiMotCau } from '../core/pham/doiThoai.js';
import type { PhatNgon } from '../core/pham/doiThoai.js';
import { xinHoc } from '../core/pham/sinhKe.js';
import { lapHo } from '../core/pham/ho.js';
import { anhLinhHoaThan, duongDiTiep } from '../core/pham/caiChet.js';
import type { LuaChonTiepTuc } from '../core/pham/caiChet.js';
import { noiOCua } from '../core/pham/lich.js';
import { bocTach, hopNhatCapNhat } from '../core/ai/bocTach.js';
import type { PatchBiTuChoi } from '../core/ai/bocTach.js';
import { catSuyLuanNoiBo } from '../core/ai/suyLuan.js';
import { bienSoanPromptCapNhat } from '../core/ai/capNhat.js';
import { nganSachInput, uocLuong } from '../core/ai/nganSach.js';
import { napBatBienTangTruyen } from '../core/world/batBienTruyen.js';
import { napBatBienPhase10 } from '../core/world/batBienP10.js';
import {
  ongKinhMoi,
  chonMucTieu,
  apOngKinh,
  datOngKinh,
  tieuDiem,
  ongKinhOChoNguoiChoi,
} from '../core/truyen/ongKinh.js';
import type { TrangThaiOngKinh } from '../core/truyen/ongKinh.js';
import type { MucTieuOngKinh } from '../core/schema/truyen.js';
import { hanNgachVangMat } from '../core/truyen/machTruyen.js';
import type { DoVangMat } from '../core/truyen/machTruyen.js';
import { raSoatPhucBut, phucButDangTreo, gieoPhucBut } from '../core/truyen/phucBut.js';
import { quaHan } from '../core/schema/truyen.js';
import { dungChiMuc } from '../core/retrieval/chiMuc.js';
import { chayBoDanhGia } from '../core/retrieval/boDanhGia.js';
import type { KetQuaBoDanhGia } from '../core/retrieval/boDanhGia.js';
import { CAU_HINH_HEURISTIC } from '../core/schema/rerank.js';
import { truyHoi, dungBaTruyVan } from '../core/retrieval/truyHoi.js';
import type { KetQuaTruyHoi } from '../core/retrieval/truyHoi.js';
import type { RetrievalRun, RerankResult } from '../core/schema/rerank.js';
import type { KhoaTruyHoi } from '../core/retrieval/truyHoi.js';
import { KhoRerankCache } from '../db/rerankCache.js';
import { coIndexedDb, layDb } from '../db/instance.js';
import { KhoDexie, KhoNhanh, napState } from '../db/repo.js';
import { danhSachSave, ghiVan, ghiVanNhe, xoaVan, doiTenVan, nhanMacDinh } from '../db/quanLySave.js';
import type { MucSave } from '../db/quanLySave.js';
import { xuatSave, nhapSave } from '../db/save.js';
import { capNhatUiState, docUiState } from '../db/preset.js';
import { veSinh, coVet, moTaVet } from '../core/anToan/veSinh.js';
import { datTenTruc, luatNenMacDinh } from '../core/vatly/luatNen.js';
import { daThanhHinh } from '../core/schema/aspect/conceptual.js';
import { quetCoChe } from '../core/vatly/coChe.js';
import { KHAI_NIEM_NEN_CUA_TRUC, TRUC_NEN } from '../core/vatly/schema.js';
import type { TrucNen } from '../core/vatly/schema.js';
import { BranchSchema } from '../core/contracts/branch.js';
import { chayDuongOng } from '../core/workflow/chay.js';
import { bienSoanTacVu } from '../core/workflow/bienSoanTacVu.js';
import { PRESET_WORKFLOW, kiemLanRanh } from '../core/workflow/dungSan.js';
import { ghiLorebook } from '../core/workflow/dichGhi.js';
import type { WorkflowPreset } from '../core/workflow/schema.js';
import type { TrangThaiLich } from '../core/workflow/lich.js';
import { goiTacVuWorkflow } from '../ai/client.js';
import type { AiEndpoint } from '../core/ai/cauHinh.js';
import { kiemEjs, nhapLorebook } from '../core/lore/nhap.js';
import { capNhatKyVong, trichKyVong } from '../core/lore/kyVong.js';
import { vatChatHoaLorebook } from '../core/lore/hienThuc.js';
import { giaiDoanLore } from '../core/lore/ejs.js';
import { boChe } from '../core/lore/doiSoat.js';
import { daiCuaNguon, DAI_ORDER, LorebookEntrySchema } from '../core/lore/schema.js';
import type { Lorebook, LorebookEntry } from '../core/lore/schema.js';
import { tinhDoTinCay } from '../core/lore/tinCay.js';
import {
  hopNhatEntryTuSinh,
  ID_LOREBOOK_SU_THE_GIOI,
  khoaNoiDungLore,
  taoLorebookSuTheGioi,
} from '../core/lore/quanLy.js';
import {
  CauHinhDienHoaSchema,
  CauHinhTuDienHoaSchema,
  EvolutionLogSchema,
  TICK_MOI_LUOT,
  baoCaoDienHoa,
  kiemDieuKienDung,
  locPatchTheoLanRanh,
  tinhNhipNenHieuLuc,
  uocLuongDienHoa,
} from '../core/world/dienHoa.js';
import type { BaoCaoDienHoa, CauHinhDienHoa, CauHinhTuDienHoa, NhipDienHoa } from '../core/world/dienHoa.js';
import { boiDapMotLuot, doDoDang } from '../core/world/boiDap.js';
import type { ThoBoiDap, ViecBoiDap } from '../core/world/boiDap.js';
import { docBoiDapAi, dungPromptBoiDap } from '../core/world/boiDapAi.js';
import { docKho, thongKeKho, TRAN_TU_VUNG } from '../core/world/tuVung.js';
import type { ThongKeKho, TuVung } from '../core/world/tuVung.js';
import {
  bocGhiChu,
  chuaKe,
  danhDauDaKe,
  docSo,
  NHAN_LOAI_HAU_TRUONG,
  themGhiChu,
  thongKeSo,
} from '../core/world/hauTruong.js';
import type { GhiChuHauTruong, ThongKeSo } from '../core/world/hauTruong.js';
import { tuaThoiGian } from '../core/world/process/catchUp.js';
import { useAi } from './ai.js';

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
  choXacNhan: { plan: ActionPlan; cau: string } | null;
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
  /** Bản xem trước đang nhận qua streaming; không ghi vào lịch sử cho tới khi lượt hoàn tất. */
  loiKeDangStream: string;
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
  luotChuaKe: { cau: string; ketQuaEngine: readonly string[]; nhipNen: boolean } | null;
  /** Kể lại lượt đang treo. Cổng phải mở trước, nếu không nó không thử. */
  keLai(): Promise<void>;

  /**
   * Lượt vừa rồi có kể lại được không — nút Reroll.
   *
   * `true` chỉ sau một lượt kể TRỌN VẸN, và chỉ tới lượt kế tiếp: ảnh chụp để
   * lùi lại chỉ có một bản, nên đi tiếp một lượt là mất đường về lượt trước.
   */
  rerollDuoc: boolean;
  /** Bỏ lời kể vừa rồi, lùi thế giới về trước nó, rồi kể lại đúng lượt ấy. */
  reroll(): Promise<void>;

  /**
   * Câu người chơi đã gõ ở lượt vừa rồi — để họ sửa lại trước khi kể lại.
   *
   * `null` nghĩa là lượt vừa rồi không sinh ra từ một câu gõ tay (trôi nhịp,
   * trả lời lời cầu, đáp áp lực Dị Hóa…), nên không có gì để sửa. Reroll thường
   * vẫn dùng được ở những lượt ấy.
   */
  cauLuotTruoc: string | null;
  /**
   * Sửa câu của lượt vừa rồi rồi kể lại từ đó — lùi xa hơn `reroll()` một bước.
   *
   * Câu khác thì engine phải phán lại, nên đường này lùi về TRƯỚC lúc engine
   * nghe câu cũ chứ không chỉ trước lời kể.
   */
  rerollVoiCau(cauMoi: string): Promise<void>;

  // ── ván chơi: lưu, tiếp tục, file (Phase 12) ──

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

  // ── lorebook (Phase 10, nối vào giao diện ở Phase 12) ──

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
  /** Người chơi sửa một entry trên nhánh hiện tại; máy không dùng đường này. */
  suaLorebookEntry(
    lorebookId: string,
    entryId: string,
    banSua: {
      readonly ten: string;
      readonly keys: readonly string[];
      readonly noiDung: string;
      readonly lop: 'loi' | 'sau';
      readonly order: number;
    },
  ): boolean;
  /** Bỏ lớp che do đối soát tạo; giữ nguyên lịch sử vì sao entry từng bị che. */
  boCheLorebookEntry(lorebookId: string, entryId: string): void;
  /** Xóa sách khỏi nhánh hiện tại; lịch sử đã hiện thực hóa vẫn được giữ. */
  xoaLorebook(id: string): Promise<void>;

  // ── vật lý thế giới (Khối L, nối vào giao diện ở Phase 12) ──

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

  // ── nhánh (Phần 26) ──

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

  // ── Diễn Hóa (Phần 47) — món nợ mang từ Phase 10 sang ──

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
  chayDienHoa(cauHinh: Partial<CauHinhDienHoa> & { presetId?: string }): Promise<void>;
  /**
   * Ngắt một lần Diễn Hóa đang chạy.
   *
   * Không "hủy": mọi lượt đã tua vẫn ở trong log và trong thế giới, vì Event đã
   * commit thì không có đường lùi ngoài nhánh. Nó chỉ nói với vòng lặp là đừng
   * chạy lượt tiếp theo, rồi báo cáo được viết ra như một lần dừng bình thường.
   */
  dungDienHoa(): void;
  /**
   * Tiến độ lần chạy đang diễn ra; `null` khi không có gì đang chạy.
   *
   * Có nó thì nút "Đang diễn hóa…" mới nói được điều gì. Không có nó, một lượt
   * tua trăm năm và một lượt tua bị treo trông giống hệt nhau.
   */
  tienDoDienHoa: { luot: number; tongLuot: number; tick: number; viecDaLam: number } | null;
  /** Cấu hình Diễn Hóa tự động cuối mỗi lượt kể. */
  tuDienHoa: CauHinhTuDienHoa;
  /**
   * Vá cấu hình nhịp nền.
   *
   * Khối `workflow` nhận bản vá NÔNG: đưa `{ bat: false }` là đủ, ba trường còn
   * lại giữ nguyên. Bắt người gọi dựng lại cả khối chỉ để tắt một công tắc là
   * cách chắc chắn nhất để một chỗ nào đó vô tình đặt lại `presetId` về mặc định.
   */
  datTuDienHoa(
    banVa: Partial<Omit<CauHinhTuDienHoa, 'workflow'>> & {
      workflow?: Partial<CauHinhTuDienHoa['workflow']>;
    },
  ): void;
  /**
   * Còn bao nhiêu lượt kể nữa thì nhịp nền chạy. `0` nghĩa là lượt tới.
   *
   * Giao diện cần con số này để câu "mỗi 5 lượt" không phải một lời hứa suông:
   * người chơi phải đếm được cùng engine.
   */
  conLuotToiNhipNen(): number;
  /** Thế giới còn dở dang tới đâu — Xưởng Workflow và bảng chẩn đoán đọc. */
  doDoDangTheGioi(): { diem: number; thieu: readonly string[] };
  /** Kho Từ của nhánh: thống kê cộng những chữ học gần đây nhất. */
  khoTuHienTai(): { thongKe: ThongKeKho; moiNhat: readonly TuVung[] };
  /**
   * Đang chạy đường ống mô phỏng hậu trường sau lưng lượt kể.
   *
   * Giao diện phải hiện nó, và lý do không phải thẩm mỹ: mô phỏng gọi model bảy
   * lần và tốn tiền. Một tính năng tiêu tiền mà chạy im lặng là một tính năng
   * người dùng sẽ phát hiện ra qua hóa đơn.
   */
  dangMoPhongHauTruong: boolean;
  /** Sổ Hậu Trường của nhánh: thống kê cộng vài chuyện đang xếp hàng chờ kể. */
  soHauTruongHienTai(): { thongKe: ThongKeSo; sapKe: readonly GhiChuHauTruong[] };
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

  // ── Phase 8: tự sự và truy hồi ──

  /** [BB] 29.1 — ống kính là chuyện XEM, không phải chuyện chơi: đổi không tốn lượt. */
  ongKinh: TrangThaiOngKinh;
  /** Lý do engine chọn chỗ chiếu — hiện thẳng lên UI, không giấu. */
  viChieu: string;
  /** [BB] 28.6 — đo theo SỐ CẢNH. Dưới ngưỡng thì ống kính tự ưu tiên mạch xa. */
  vangMat: DoVangMat;
  /** Trace của lượt truy hồi gần nhất — tab Truy hồi (77.11). */
  truyHoiCuoi: KetQuaTruyHoi | null;
  /** Vết cắt ngân sách token của prompt gần nhất — cổng "budget có trace". */
  vetCatToken: readonly { tang: number; ten: string; vi: string }[];
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
    /** `moduleId → lý do` — chẩn đoán phải nói ĐÚNG nguyên nhân, không gộp rổ. */
    lyDoBiBo: Readonly<Record<string, OmitReason>>;
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
  /** Đổi văn bản hiển thị của một dòng khung kể — script preset dùng cửa này. */
  datNoiDungDong(chiSo: number, noiDung: string): void;

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

  // ── tầng Phàm Nhân (Phase 7) ──

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

let demIntent = 0;
let demKe = 0;
let demQuetCoChe = 0;
let demLore = 0;
let demCapNhatThuCong = 0;

/**
 * Hàng đợi ghi đĩa — mọi lần `luuVan()` nối đuôi nhau, không chồng nhau.
 *
 * Ở tầng module chứ không trong store: nó là một khóa tuần tự cho **tài nguyên
 * đĩa**, không phải một trạng thái của trò chơi. Nhét nó vào store sẽ làm mọi
 * component render lại mỗi lần một lượt ghi bắt đầu hoặc kết thúc.
 */
let hangDoiLuu: Promise<void> = Promise.resolve();

/**
 * Ghi scene (lịch sử chat) xuống bảng `uiState`.
 *
 * Scene không phải dữ liệu thế giới nên KHÔNG vào `WorldState`/`stateHash`.
 * Nó nằm cùng bảng với tab, mục ghim, ảnh chụp Bảng: cùng khóa
 * `[saveId+branchId]`, cùng ranh giới "trạng thái giao diện theo save".
 */
async function luuScene(saveId: string, branchId: string, scene: readonly DongScene[]): Promise<void> {
  if (!coIndexedDb() || saveId === '') return;
  await capNhatUiState(layDb(), saveId, branchId, { scene: [...scene] });
}

const SEED_MAC_DINH = 'thien-dien-0001';

/** Chỉ để ghi vào file xuất cho người đọc; không dùng để quyết định gì. */
const PHIEN_BAN_APP = '3.1.0';

/**
 * Cờ ngắt Diễn Hóa — ở tầng module, không trong store.
 *
 * Cùng lẽ với `hangDoiLuu`: nó là một tín hiệu cho một vòng lặp đang chạy, chứ
 * không phải một trạng thái của trò chơi. Để nó trong store thì mỗi lần đặt cờ
 * sẽ làm cả cây component render lại giữa lúc vòng lặp đang nóng nhất.
 */
let yeuCauDungDienHoa = false;

/**
 * Đang ở trong một nhịp nền — chốt chống đệ quy.
 *
 * `keLuot()` kết thúc bằng việc gọi nhịp nền, và nhịp nền có thể ghi dòng vào
 * khung kể. Không có chốt này thì một ngày nào đó ai đó nối nhịp nền vào một
 * đường có `keLuot()` ở cuối, và trò chơi tự gọi mình cho tới hết bộ nhớ.
 */
let dangTrongNhipNen = false;

/**
 * Đang mô phỏng hậu trường — chốt chống chồng lượt.
 *
 * Khác `dangTrongNhipNen` ở chỗ nó canh một thứ khác: mô phỏng là bất đồng bộ và
 * kéo dài nhiều giây, nên người chơi gõ tiếp trong lúc nó chạy là chuyện thường,
 * không phải chuyện lạ. Không có chốt này thì hai lượt mô phỏng chồng nhau sẽ
 * cùng đọc một sổ, cùng ghi đè lên nó, và lô ghi chú của lượt đầu biến mất.
 */
let dangMoPhong = false;

/**
 * Số lượt kể đã trôi qua kể từ lần nhịp nền gần nhất.
 *
 * Ở tầng module chứ không trong store: đổi nó mỗi lượt sẽ làm cả cây component
 * render lại chỉ để đếm. Giao diện đọc nó qua `conBaoNhieuLuot()`.
 *
 * Reset khi mở ván khác — và đó là hành vi ĐÚNG chứ không phải thiếu sót: mở
 * lại một ván cũ thì nhịp nền chạy ngay lượt đầu, và người chơi thấy thế giới
 * động đậy ở đúng lúc họ quay lại nó.
 */
let demLuotTuNhipNen = 0;

/**
 * Nhường luồng cho trình duyệt vẽ lại, nhưng chỉ khi đã giữ luồng quá lâu.
 *
 * [BB] Đây là chỗ lỗi "Diễn Hóa treo game" được đóng ở tầng vòng lặp. Ngay cả
 * sau khi đã gộp tick, một lần tua vẫn có thể tốn vài nghìn bước engine; giữ
 * luồng suốt chừng ấy thì trình duyệt không vẽ được khung nào, nút Dừng không
 * bấm được, và tab bị hệ điều hành coi là đã chết.
 *
 * 12ms là dưới một khung hình 60Hz: nhường sớm hơn thì phí, muộn hơn thì giật.
 */
const NGUONG_NHUONG_MS = 12;

function taoBoNhuong(): () => Promise<void> {
  let moc = Date.now();
  return async () => {
    if (Date.now() - moc < NGUONG_NHUONG_MS) return;
    await new Promise<void>((r) => {
      setTimeout(r, 0);
    });
    moc = Date.now();
  };
}

export type KetQuaTuaLuot = {
  readonly ok: boolean;
  readonly suKienLon: readonly { tick: number; moTa: string; loai: string; entityIds: string[] }[];
  readonly loi: readonly StructuredError[];
};

/**
 * Tua ĐÚNG MỘT lượt Diễn Hóa — [BB] 71.6 thay cho vòng lặp `motTick` cũ.
 *
 * ── Đây là chỗ lỗi treo được sửa ──
 *
 * Bản cũ gọi `motTick()` từng tick truyện một: `vinh_kiep` là 400 lần gọi
 * scheduler cho MỘT lượt, và 500 lượt là hai trăm nghìn lần trong một vòng lặp
 * đồng bộ. Không có yield nào ở giữa, nên trình duyệt không vẽ được khung nào
 * và tab bị coi là đã chết.
 *
 * `tuaThoiGian()` gộp `TICK_MOI_BUOC[nhịp]` tick vào một lần gọi bằng công thức
 * macro của 71.6. Cùng một trăm năm ấy giờ tốn **một** bước. Nó vốn đã nằm sẵn
 * trong `catchUp.ts` từ Phase 5 — Diễn Hóa chỉ chưa bao giờ gọi tới.
 *
 * `smartStop` TẮT ở đây có chủ đích: điểm dừng thông minh của 47.3 do vòng lặp
 * ngoài quyết định sau mỗi lượt trọn vẹn. Để `tuaThoiGian` tự dừng giữa lượt sẽ
 * cắt một lượt làm đôi, và "một lượt" mất luôn nghĩa.
 *
 * ── Vì sao tiền tố Event không cần bộ đếm ──
 *
 * `tuaThoiGian()` dựng id là `${tiềnTố}_${nhánh}_${nhịpMới}`, và `nhịpMới` luôn
 * LỚN HƠN `world.tick`. Mọi Event đã vào log đều có `tick <= world.tick` —
 * `EVENT_LUI_TICK` cưỡng chế điều đó. Nên một id mang nhịp lớn hơn không thể
 * đụng id nào đã có, kể cả sau khi nạp lại save. Một bộ đếm ở đây chỉ nhét
 * trạng thái của phiên vào id Event mà không mua thêm được gì.
 */
function tuaMotLuot(s: WorldState, log: EventLog, nhip: NhipDienHoa, hauTo: string): KetQuaTuaLuot {
  const r = tuaThoiGian(s, log, {
    soTick: TICK_MOI_LUOT[nhip],
    nhip,
    smartStop: false,
    tuning: TUNING_MAC_DINH,
    tienToEvent: `ev_dh_${hauTo}`,
  });

  if (!r.ok) return { ok: false, suKienLon: [], loi: r.errors };

  const suKienLon = r.value.suKien
    .filter((sk) => sk.mucDo === 'trong_dai')
    .map((sk) => ({
      tick: r.value.tickCuoi,
      moTa: sk.moTa,
      loai: sk.loai,
      entityIds: [...sk.chuTheIds],
    }));

  return { ok: true, suKienLon, loi: [] };
}

export type TuyChonBoiDap = {
  readonly hanMuc: number;
  readonly tho: readonly ThoBoiDap[];
  readonly cauHinh: CauHinhDienHoa;
  readonly hauTo: string;
};

/**
 * Id Event chưa ai dùng, tìm bằng cách hỏi chính log.
 *
 * Bộ đếm module thôi thì chưa đủ: nó reset về 0 mỗi lần mở lại ván, còn log thì
 * mang theo mọi id đã cấp. Hai thứ cộng lại từng làm `EVENT_TRUNG_ID` nổ ở đúng
 * lượt đầu tiên sau khi nạp save. Hỏi log là phép tránh va chạm duy nhất còn
 * đúng sau khi tải lại trang — và nó cũng deterministic, vì nó chỉ đọc log.
 */
function idEventTrong(log: EventLog, goc: string): string {
  if (log.theoId(goc) === undefined) return goc;
  for (let i = 2; i < 1000; i++) {
    const thu = `${goc}_${i}`;
    if (log.theoId(thu) === undefined) return thu;
  }
  return `${goc}_${Date.now()}`;
}

/**
 * Chạy một lượt Bồi Đắp và áp nó qua đúng cửa duy nhất — luật bất biến #4.
 *
 * [BB] 47.4 vẫn cưỡng chế ở đây, dù patch do chính engine sinh: `locPatchTheoLanRanh`
 * chạy trước transaction. Và nếu nó bỏ dù chỉ một patch thì CẢ lô bị hủy chứ
 * không áp phần còn lại — vì một lô Bồi Đắp là một đơn vị có nghĩa. Lập làng mới
 * mà mất đúng cái patch trừ dân của làng cũ thì thế giới vừa nhân đôi dân số.
 */
function chayBoiDap(
  s: WorldState,
  log: EventLog,
  o: TuyChonBoiDap,
): { viec: readonly ViecBoiDap[]; loi: readonly StructuredError[] } {
  const evId = idEventTrong(log, `ev_boi_dap_${s.world.branchId}_${s.world.tick}_${o.hauTo}`);

  const kq = boiDapMotLuot({
    state: s,
    eventId: evId,
    tick: s.world.tick,
    tho: o.tho,
    hanMuc: o.hanMuc,
  });
  if (kq.patches.length === 0) return { viec: [], loi: [] };

  const loc = locPatchTheoLanRanh(kq.patches, o.cauHinh, s);
  if (loc.bo.length > 0) {
    return {
      viec: [],
      loi: [
        ...loc.loi,
        loi(
          'patch',
          'BOI_DAP_CHAM_LAN_RANH',
          `Bồi Đắp bị hủy cả lô vì ${loc.bo.length} patch chạm lằn ranh 47.4: ${loc.bo[0]?.lyDo ?? ''}`,
          { recoverable: true },
        ),
      ],
    };
  }

  const ev = taoEvent({
    id: evId,
    branchId: s.world.branchId,
    tick: s.world.tick,
    loai: 'boi_dap',
    actorIds: [],
    targetIds: kq.viec.flatMap((v) => [...v.entityIds]).slice(0, 24),
    causeEventIds: [],
    locationId: null,
    patches: [...loc.giu],
    visibility: 'engine',
    source: 'engine',
    payload: { soViec: kq.viec.length, tho: kq.viec.map((v) => v.tho) },
  });

  const ok = apDungEvent(s, ev, log);
  return ok.ok ? { viec: kq.viec, loi: [] } : { viec: [], loi: ok.errors };
}

/**
 * Điểm cuối dùng cho thợ Bồi Đắp AI — Diễn Hóa nếu có, không thì Tường Thuật.
 *
 * [BB] 46.1 cho phép tắt riêng điểm cuối Diễn Hóa, và phần lớn người chơi để nó
 * tắt vì đường ống bảy tác vụ là một quyết định lớn. Nhưng thợ thứ bảy chỉ tốn
 * một hai call cho cả một lần tua, nên bắt nó nằm im chỉ vì người chơi chưa cấu
 * hình một điểm cuối THỨ HAI là chọn hộ họ sai: Tường Thuật đã được kiểm tra
 * kết nối rồi, và đây vẫn là "một model viết một đoạn văn ngắn".
 *
 * Trả `null` khi không có đường nào — lúc ấy người gọi bỏ qua thợ này và nói ra,
 * chứ không im lặng đốt một lượt.
 */
function duongChoBoiDapAi(): AiEndpoint | null {
  const cfg = useAi.getState().cfg;
  const wf = cfg.workflow;
  if (wf.batRieng && wf.proxyUrl.trim() !== '' && wf.modelId.trim() !== '') return wf;
  const nr = cfg.narrator;
  if (nr.proxyUrl.trim() !== '' && nr.modelId.trim() !== '') return nr;
  return null;
}

/**
 * Ghi Sổ Hậu Trường qua đúng cửa duy nhất — luật bất biến #4.
 *
 * Một patch `set` lên `worlds.worlds.hauTruong`, không nhiều hơn. Sổ nằm trong
 * `World` nên nó vào `stateHash`, và mọi thay đổi của nó phải có một Event giải
 * thích — kể cả khi thay đổi ấy chỉ là đóng dấu "đã kể".
 */
function apSoHauTruong(
  s: WorldState,
  log: EventLog,
  soMoi: readonly GhiChuHauTruong[],
  o: { goc: string; loai: string; payload: Record<string, unknown> },
): readonly StructuredError[] {
  const evId = idEventTrong(log, o.goc);
  const ev = taoEvent({
    id: evId,
    branchId: s.world.branchId,
    tick: s.world.tick,
    loai: o.loai,
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches: [
      {
        op: 'set',
        target: { table: 'worlds', id: 'worlds', path: 'hauTruong' },
        value: [...soMoi],
        sourceEventId: evId,
      },
    ],
    visibility: 'engine',
    source: 'engine',
    payload: o.payload,
  });
  const r = apDungEvent(s, ev, log);
  return r.ok ? [] : r.errors;
}

export type KetQuaBoiDapAiChay = {
  readonly viec: readonly ViecBoiDap[];
  readonly soCall: number;
  readonly loi: readonly StructuredError[];
};

/**
 * Chạy thợ Bồi Đắp thứ bảy — người duy nhất trong xưởng có gọi model.
 *
 * Chạy ĐÚNG `soCall` lần cho cả một lần Diễn Hóa, không phải mỗi lượt một lần:
 * xem chú thích của `boiDap.soCallAi` ở `dienHoa.ts` để biết vì sao con số ấy
 * đếm theo lần chạy.
 *
 * Dừng sớm ở ba chỗ, và cả ba đều là "đừng tiêu tiền cho một việc đã xong hoặc
 * đã hỏng": thế giới không còn chỗ trống nào để hỏi, đường tới model đứt, hoặc
 * model trả về một câu trả lời không dùng được gì. Thử lại lần thứ hai với đúng
 * một câu hỏi ấy chỉ đổi tiền lấy cùng một kết quả.
 */
async function chayBoiDapAi(
  s: WorldState,
  log: EventLog,
  o: { cauHinh: CauHinhDienHoa; soCall: number; hauTo: string },
): Promise<KetQuaBoiDapAiChay> {
  const viec: ViecBoiDap[] = [];
  const loiGom: StructuredError[] = [];
  let soCall = 0;
  if (o.soCall <= 0) return { viec, soCall, loi: loiGom };

  const ep = duongChoBoiDapAi();
  if (ep === null) {
    loiGom.push(
      loi(
        'ai',
        'BOI_DAP_AI_CHUA_CO_DUONG',
        'Bồi Đắp bằng model cần một điểm cuối có địa chỉ và model — Diễn Hóa hoặc Tường Thuật.',
        { recoverable: true },
      ),
    );
    return { viec, soCall, loi: loiGom };
  }

  for (let lan = 0; lan < o.soCall; lan++) {
    const p = dungPromptBoiDap({ state: s });
    // Không còn chỗ trống nào: đây là kết quả TỐT, và im lặng dừng là đúng.
    if (p === null) break;

    soCall++;
    const r = await goiTacVuWorkflow(ep, [
      { role: 'system', content: p.heThong },
      { role: 'user', content: p.nguoiDung },
    ]);
    if (!r.ok) {
      loiGom.push(loi('ai', r.ma, `Bồi Đắp bằng model: ${r.thongDiep}`, { recoverable: true }));
      break;
    }

    const evId = idEventTrong(log, `ev_boi_dap_ai_${s.world.branchId}_${s.world.tick}_${o.hauTo}_${lan}`);
    const kq = docBoiDapAi(r.vanBan, {
      state: s,
      eventId: evId,
      tick: s.world.tick,
      idChoPhep: p.idChoPhep,
    });
    for (const b of kq.biBo.slice(0, 6)) {
      loiGom.push(loi('ai', 'BOI_DAP_AI_BO_MUC', b, { recoverable: true, severity: 'warning' }));
    }
    if (kq.patches.length === 0) break;

    // [BB] 47.4 vẫn cưỡng chế, dù patch chỉ chạm tên, mô tả và Kho Từ. Cùng
    // chính sách với `chayBoiDap`: chạm lằn ranh thì hủy CẢ lô.
    const loc = locPatchTheoLanRanh(kq.patches, o.cauHinh, s);
    if (loc.bo.length > 0) {
      loiGom.push(...loc.loi);
      loiGom.push(
        loi(
          'patch',
          'BOI_DAP_AI_CHAM_LAN_RANH',
          `Bồi Đắp bằng model bị hủy cả lô: ${loc.bo[0]?.lyDo ?? ''}`,
          { recoverable: true },
        ),
      );
      break;
    }

    const ev = taoEvent({
      id: evId,
      branchId: s.world.branchId,
      tick: s.world.tick,
      loai: 'boi_dap_ai',
      actorIds: [],
      targetIds: kq.viec.flatMap((v) => [...v.entityIds]).slice(0, 24),
      causeEventIds: [],
      locationId: null,
      patches: [...loc.giu],
      visibility: 'engine',
      // Model đề nghị, `docBoiDapAi()` duyệt — đúng nghĩa của `ai_validated`.
      source: 'ai_validated',
      payload: { soViec: kq.viec.length, soTuMoi: kq.tuMoi.length },
    });

    const ok = apDungEvent(s, ev, log);
    if (!ok.ok) {
      loiGom.push(...ok.errors);
      break;
    }
    for (const v of kq.viec) viec.push({ tho: v.tho as ThoBoiDap, moTa: v.moTa, entityIds: v.entityIds });
  }

  return { viec, soCall, loi: loiGom };
}

/**
 * Ghi cấu hình Diễn Hóa tự động xuống `uiState`.
 *
 * Cùng bảng với scene và tab đang mở, vì nó cùng loại: một tùy chọn của **ván
 * này trên máy này**, không phải dữ liệu thế giới. Nhét nó vào `WorldState` sẽ
 * làm `stateHash` đổi theo một cái công tắc giao diện — đúng loại lỗi mà
 * ADR-0028 đã tránh cho trạng thái ngắt mạch.
 */
async function ghiTuDienHoaXuongDia(cfg: CauHinhTuDienHoa): Promise<void> {
  if (!coIndexedDb()) return;
  const s = useGame.getState().state;
  if (!s) return;
  try {
    await capNhatUiState(layDb(), s.world.id, s.world.branchId, { tuDienHoa: cfg });
  } catch {
    // Không ghi được một tùy chọn là chuyện phiền, không phải chuyện chết.
  }
}

/**
 * Ký tự trên một token cho tiếng Việt có dấu — [BB] 34.2.
 *
 * Đây là ước lượng ban đầu; `tuHieuChinh()` chỉnh nó theo `usage.prompt_tokens`
 * thật sau năm lượt lệch quá 12%. Con số 4 của tiếng Anh sai ở đây hàng chục
 * phần trăm, và sai theo hướng nào cũng tệ.
 */
const TY_LE_TOKEN = 3.2;

/**
 * Hạn trả mặc định cho phục bút do Narrator gieo, tính bằng tick.
 *
 * Engine đặt, không phải model. [BB] 30.2 dùng hạn này để quyết khi nào đẩy phục
 * bút lên đầu context và khi nào biến nó thành bí ẩn — cả hai đều là quyết định
 * gameplay, nên chúng không được để model tự khai.
 */
const HAN_TRA_MAC_DINH = 60;

/**
 * Cảnh đã kể trong phiên, chỉ để đo hạn ngạch vắng mặt (28.6).
 *
 * KHÔNG nằm trong `WorldState`: nó đo cách trò chơi được KỂ, không đo thế giới.
 * Nhét nó vào state sẽ làm `stateHash` đổi theo việc người chơi đã xem gì —
 * đúng loại lỗi mà ADR-0028 đã tránh cho trạng thái ngắt mạch.
 */
const canhDaKe: { coNguoiChoi: boolean }[] = [];

/**
 * Mốc để lùi thế giới về — phần chung của hai ảnh chụp dưới đây.
 *
 * Năm trường, và cả năm đều cần: `state` là thế giới, `soEvent` cắt log
 * append-only về đúng chỗ, `scene` là khung kể, còn hai bộ đếm cuối nằm NGOÀI
 * `WorldState` nên không lùi theo nó. Bỏ quên hai bộ đếm ấy thì mỗi lần reroll
 * lại đẩy hạn ngạch vắng mặt và nhịp nền đi thêm một bước mà không ai thấy.
 */
type MocLui = {
  state: WorldState;
  soEvent: number;
  scene: readonly DongScene[];
  soCanhDaKe: number;
  demLuotNhipNen: number;
};

/**
 * Ảnh chụp ngay TRƯỚC lời kể — nguyên liệu của nút Reroll thường.
 *
 * ── Vì sao chụp ở ranh giới ấy chứ không ở đầu lượt ──
 *
 * Phần engine của một lượt là **tất định**: cùng `seed`, cùng `tick`, cùng ý đồ
 * thì `giaiQuyet()` ra đúng một kết quả. Chạy lại nó chỉ tốn thời gian mà không
 * đổi được gì. Thứ thật sự đổi giữa hai lần là lời kể, nên chỗ để lùi về là
 * ngay trước khi Narrator mở miệng: engine giữ nguyên phán quyết của nó, còn
 * người chơi được đọc một câu chữ khác về cùng phán quyết ấy.
 *
 * Chụp trong `keLuot()` nên MỌI đường có lời kể đều reroll được — gõ một câu,
 * trôi nhịp, trả lời một lời cầu — mà không đường nào phải tự nhớ chụp.
 *
 * Chỉ giữ MỘT bản. Reroll là "kể lại câu vừa rồi", không phải một cây lịch sử;
 * và một ngăn xếp ảnh chụp trên thế giới năm mươi nghìn thực thể là một cách rất
 * chắc chắn để ăn hết bộ nhớ tab.
 */
type AnhChupTruocKe = MocLui & {
  cau: string;
  ketQuaEngine: readonly string[];
  nhipNen: boolean;
};
let anhChupTruocKe: AnhChupTruocKe | null = null;

/**
 * Ảnh chụp trước cả khi ENGINE nghe câu người chơi — cho đường "sửa câu rồi kể lại".
 *
 * ── Vì sao phải có ảnh chụp thứ hai ──
 *
 * Ảnh trên lùi được lời kể, nhưng lùi tới đó là quá muộn cho việc sửa câu: lúc
 * ấy `parseIntent()` đã đọc câu cũ, `giaiQuyet()` đã phán theo câu cũ, và Event
 * của phán quyết ấy đã nằm trong log. Đổi câu mà giữ nguyên phán quyết cũ thì
 * lời kể mới sẽ kể về một việc người chơi không còn làm nữa.
 *
 * Nên đổi câu phải lùi xa hơn một bước — về trước lúc engine nghe — rồi chạy
 * lại TRỌN vẹn `gui()` với câu mới. Đắt hơn reroll thường đúng một lần chạy
 * engine, và đó là cái giá đúng: câu khác thì phán quyết cũng phải được hỏi lại.
 *
 * `null` nghĩa là lượt vừa rồi không sinh ra từ một câu gõ tay (trôi nhịp, trả
 * lời lời cầu, đáp áp lực Dị Hóa…) — không có câu nào để sửa.
 */
type AnhChupTruocLuot = MocLui & {
  cau: string;
  /**
   * Bộ đếm ý đồ lúc chụp — và nó BẮT BUỘC phải lùi theo.
   *
   * `resolve.ts` gieo RNG bằng `intent#${intent.id}`, mà `intent.id` là
   * `it_${demIntent}`. Không lùi bộ đếm thì cùng một câu, trên cùng một thế
   * giới, ở cùng một nhịp lại cho hai phán quyết khác nhau chỉ vì người chơi đã
   * sửa câu hai lần — engine hết tất định, và đó là thứ cả Phần 5 dựng lên để
   * giữ. Sửa câu là để đổi câu, không phải để quay lại xúc xắc.
   */
  demIntent: number;
};
let anhChupTruocLuot: AnhChupTruocLuot | null = null;

/**
 * Lượt sắp kể có phải do một câu gõ tay sinh ra không.
 *
 * Cờ này là thứ duy nhất nối `gui()` với `keLuot()` — `keLuot()` không biết ai
 * gọi mình, và mười hai đường gọi nó thì mười đường không có câu nào để sửa.
 * `gui()` bật cờ, `keLuot()` đọc rồi hạ ngay: một lượt trôi nhịp chen vào giữa
 * phải xoá được ảnh chụp câu cũ, nếu không nút "sửa rồi kể lại" sẽ lùi nhịp ấy
 * đi mất trong im lặng.
 */
let luotNayTuCauGoTay = false;

/**
 * Vứt cả hai ảnh chụp — gọi ở mọi chỗ đổi ván.
 *
 * Ảnh chụp trỏ vào một nhánh cụ thể. Giữ nó qua một lần "Rời ván" rồi mở ván
 * khác thì nút reroll sẽ lùi thế giới của ván MỚI về thế giới của ván CŨ, và
 * `apDungEvent` sẽ từ chối mọi Event sau đó vì sai `branchId` — một cách rất
 * lòng vòng để mất một ván chơi.
 */
function boAnhChupTruocKe(): void {
  anhChupTruocKe = null;
  anhChupTruocLuot = null;
  luotNayTuCauGoTay = false;
}

/**
 * Đọc cache rerank. Mất IndexedDB thì coi như trượt cache — không phải lỗi.
 *
 * [BB] 77.8 — cache CHỈ chứa id/rank/score. Nó không giữ text, không giữ mật
 * khẩu, và `configHash` đã cắt secret trước khi băm.
 */
async function docCacheRerank(k: KhoaTruyHoi, tick: number): Promise<RerankResult | undefined> {
  if (!coIndexedDb()) return undefined;
  try {
    return await new KhoRerankCache(layDb()).doc(k, tick);
  } catch {
    return undefined;
  }
}

async function ghiCacheRerank(
  k: KhoaTruyHoi,
  kq: RerankResult,
  tick: number,
  ttlTicks: number,
): Promise<void> {
  if (!coIndexedDb()) return;
  try {
    await new KhoRerankCache(layDb()).ghi(k, kq, tick, ttlTicks);
  } catch {
    // Không ghi được cache là chuyện chậm, không phải chuyện sai.
  }
}

/**
 * Ghi một lượt truy hồi xuống `retrievalRuns` — 77.8.
 *
 * Nuốt mọi lỗi có chủ ý: trình duyệt riêng tư không có IndexedDB, và mất một
 * dòng thống kê không đáng để mất một lượt kể.
 */
async function ghiRunXuongDia(run: RetrievalRun): Promise<void> {
  if (!coIndexedDb()) return;
  try {
    await new KhoRerankCache(layDb()).ghiRun(run);
  } catch {
    // Không ghi được thống kê là chuyện phiền, không phải chuyện chết.
  }
}

/** Vùng chủ thể đang cư trú — đầu vào `vungHanChe` của lọc tầm nhìn (54.3). */
function vungCuaChuThe(s: WorldState): readonly string[] {
  const id = s.world.playerState.chuTheId;
  if (id === null) return [...s.entities.keys()].filter((k) => s.entities.get(k)?.kind === 'place');
  const noi = noiOCua(s, id);
  return noi === null ? [] : [noi];
}

/** Domain thần đang giữ — đầu vào `domainHanChe` của lọc tầm nhìn (54.3). */
function domainCuaChuThe(s: WorldState): readonly string[] {
  const id = s.world.playerState.chuTheId;
  if (id === null) return [];
  const d = s.entities.get(id)?.aspects['domain'] as { domains?: { ten: string }[] } | undefined;
  return (d?.domains ?? []).map((x) => x.ten);
}

// Bất biến của Thế Giới Sống và tầng Thần phải có mặt TRƯỚC transaction đầu tiên.
napBatBienTheGioiSong();
napBatBienTangThan();
napBatBienTangPham();
napBatBienTangTruyen();
napBatBienPhase10();

export const useGame = create<TrangThaiGame>((set, get) => {
  const dongBo = (): void => {
    const s = get().state;
    if (!s) return;
    const view = chieu(s, s.world.playerState.mode, s.world.playerState.chuTheId);
    set({
      // `apDungEvent()` sửa state tại chỗ. Tạo vỏ mới để selector React nhận ra
      // thay đổi; nếu giữ nguyên tham chiếu, checkbox Lorebook đã đổi dữ liệu
      // nhưng màn hình không render lại nên trông như không thể tick.
      state: { ...s },
      view,
      stateHash: hashState(s),
      goiY: goiYChoCanh(view, s.world.playerState.chuTheId, 5),
      persona: chieuPersona({
        profile: get().hoSo,
        creator: get().danhTinh,
        mode: s.world.playerState.mode,
        currentEntityId: s.world.playerState.chuTheId,
        entityLabel: s.world.playerState.chuTheId
          ? (view.entities.get(s.world.playerState.chuTheId)?.ten ?? null)
          : null,
      }),
    });
  };

  /**
   * `Scene` tối thiểu cho bộ biên dịch preset.
   *
   * Store giữ cảnh dưới dạng danh sách dòng để hiển thị; `Scene` của 61.3 là một
   * bản ghi khác, và bộ biên dịch cần nó cho macro `{{sceneId}}` và cho danh sách
   * người có mặt. Dựng tại chỗ thay vì giữ song song hai bản: một `Scene` lưu
   * riêng sẽ lệch khỏi thế giới ngay lần chuyển tầng đầu tiên.
   */
  const sceneHienTai = (s: WorldState): Scene =>
    SceneSchema.parse({
      id: `scene.${s.world.branchId}.${s.world.tick}`,
      branchId: s.world.branchId,
      startedAtTick: s.world.tick,
      currentTick: s.world.tick,
      locationId: '',
      lensId: '',
      participantIds: s.world.playerState.chuTheId === null ? [] : [s.world.playerState.chuTheId],
    });

  /**
   * Cửa DUY NHẤT để một dòng chữ lên khung kể — và vì thế là chỗ vệ sinh.
   *
   * [BB] Phase 12 — mọi thứ đi qua đây đều là văn bản không tin cậy: model viết
   * nó, hoặc một regex của preset vừa biến đổi nó, hoặc chính người chơi vừa dán
   * nó vào. Đặt bộ lọc ở đây thay vì ở từng nơi gọi là cùng lẽ với `bocTach()`:
   * một hàng rào có ba cửa thì sớm muộn sẽ có người đi qua cửa thứ tư.
   *
   * Vết lọc KHÔNG bị nuốt — nó vào `vetVeSinh` để bảng Tự Chẩn Đoán đếm được.
   * Một ký tự đảo chiều văn bản bị xóa lặng lẽ là một cuộc tấn công không ai
   * biết đã xảy ra.
   */
  const themDong = (
    loai: DongScene['loai'],
    noiDung: string,
    meta: Pick<DongScene, 'noiDungGoc' | 'dinhDang'> = {},
  ): void => {
    const noiDungAnToan = loai === 'ket_qua' ? catSuyLuanNoiBo(noiDung) : noiDung;
    const metaAnToan =
      loai === 'ket_qua' && typeof meta.noiDungGoc === 'string'
        ? { ...meta, noiDungGoc: catSuyLuanNoiBo(meta.noiDungGoc) }
        : meta;
    const sach = veSinh(noiDungAnToan, metaAnToan.dinhDang === 'html' ? 200_000 : undefined);
    if (sach.text.trim() === '') return;
    if (coVet(sach.vet)) {
      set({ vetVeSinh: [...get().vetVeSinh, moTaVet(sach.vet)].slice(-20) });
    }
    const s = get().state;
    const scene = [...get().scene];
    scene.push({
      id: `d${scene.length}`,
      tick: s?.world.tick ?? 0,
      loai,
      noiDung: sach.text,
      ...metaAnToan,
    });
    set({ scene: scene.slice(-200) });
  };

  /**
   * Cửa duy nhất vào mọi hành động chơi.
   *
   * Trả `false` nghĩa là cổng đóng — người gọi phải dừng lại, không được "cứ chạy
   * engine rồi tính sau". Chạy engine khi không ai kể được sẽ đẩy thế giới đi mà
   * người chơi không thấy gì, và khi nối lại họ mất trắng đoạn đó.
   */
  const doiCong = (): boolean => {
    /*
     * [BB] ADR-0056 — một lượt chưa được kể chặn mọi lượt sau.
     *
     * Không có nó thì "không có AI thì không chơi" chỉ đúng ở cửa vào: người chơi
     * mất mạng giữa ván vẫn bấm tick được, engine vẫn chạy, và khi nối lại họ đã
     * mất mười nhịp mà không ai kể cho nghe. Chặn ở đây biến sự cố thành một chỗ
     * dừng có thể sửa được.
     */
    if (get().luotChuaKe !== null) {
      set({
        loi: [
          ...get().loi,
          loi(
            'ai',
            'LUOT_CHUA_DUOC_KE',
            'Nhịp vừa rồi chưa ai kể. Nối lại đường tới model rồi bấm "Kể lại nhịp này" trước khi đi tiếp.',
            { recoverable: true },
          ),
        ],
      });
      return false;
    }
    const cong = useAi.getState().cong();
    if (cong.choPhepChoi) return true;
    set({
      loi: [
        ...get().loi,
        loi('ai', `CONG_AI_${cong.trangThai.toUpperCase()}`, cong.lyDo.join(' '), { recoverable: true }),
      ],
    });
    return false;
  };

  /**
   * Cổng chung của hai đường reroll.
   *
   * Không đi qua `doiCong()`, và đó là chủ ý: `doiCong()` chặn đúng trạng thái
   * `luotChuaKe`, mà `luotChuaKe` khác `null` thì `rerollDuoc` đã là `false` rồi
   * — cửa ra của tình huống ấy là `keLai()`. Ở đây chỉ cần hỏi thẳng cổng AI.
   *
   * `dangMoPhongHauTruong` nằm trong danh sách vì mô phỏng chạy vài giây SAU khi
   * lời kể đã hiện ra: đúng lúc trông như rảnh nhất thì thế giới vẫn đang bị ghi.
   */
  const sanSangReroll = (): boolean => {
    const g = get();
    if (
      !g.rerollDuoc ||
      g.log === null ||
      g.dangKe ||
      g.dangCapNhatBien ||
      g.dangMoPhongHauTruong ||
      g.dangDienHoa
    ) {
      return false;
    }
    const cong = useAi.getState().cong();
    if (cong.choPhepChoi) return true;
    set({
      loi: [
        ...get().loi,
        loi('ai', `CONG_AI_${cong.trangThai.toUpperCase()}`, cong.lyDo.join(' '), { recoverable: true }),
      ],
    });
    return false;
  };

  /**
   * Lùi thế giới về một mốc đã chụp. Sau lời gọi này store sẵn sàng chạy lại lượt.
   *
   * Chép lại ảnh chụp thay vì trao thẳng nó cho store: lượt chạy lại sẽ sửa
   * `state` tại chỗ, và nếu đó chính là ảnh chụp thì lần reroll thứ hai sẽ lùi
   * về một thế giới đã bị lần reroll thứ nhất viết đè lên.
   */
  const luiVe = (moc: MocLui): void => {
    const log = get().log;
    if (log === null) return;
    set({
      state: saoChepNong(moc.state),
      log: taoEventLog(log.tatCa().slice(0, moc.soEvent)),
      scene: [...moc.scene],
      luaChon: [],
      patchBiTuChoi: [],
      choXacNhan: null,
      rerollDuoc: false,
      cauLuotTruoc: null,
    });
    canhDaKe.length = moc.soCanhDaKe;
    demLuotTuNhipNen = moc.demLuotNhipNen;
    dongBo();
  };

  /**
   * Kể một lượt: dựng prompt từ `WorldView`, gọi Narrator, duyệt patch, ghi Event.
   *
   * `ketQuaEngine` là sự thật engine vừa quyết. Narrator kể lại nó; nó không được
   * phán lại. Nếu Narrator im lặng thì lượt này KHÔNG có lời kể — và cổng tự đóng
   * sau ba lần như vậy, thay vì lặng lẽ đưa ra một câu engine sinh và giả vờ rằng
   * AI vẫn đang chạy.
   */
  /**
   * Chọn chỗ chiếu cho lượt này — Phần 29.1.
   *
   * [BB] Hàm này KHÔNG sinh Event và KHÔNG đụng `world.tick`: chuyển ống kính là
   * hành động xem, không phải hành động chơi. Nó chỉ đọc thế giới và trả về một
   * quyết định.
   */
  const chieuOngKinh = (s: WorldState): { machId: string | null; oChoNguoiChoi: boolean } => {
    const ra = raSoatPhucBut(s, { tick: s.world.tick, eventId: 'ok' });
    const chon = chonMucTieu(s, get().ongKinh, {
      tick: s.world.tick,
      rng: rngCuaTick(s.world.seed, s.world.tick, 'ong_kinh'),
      uuTienMachId: ra.machUuTien,
      // [BB] 28.6 — hạn ngạch trượt thì kỷ nguyên sau ưu tiên mạch KHÔNG có người chơi.
      tranhEntityId: get().vangMat.dat ? null : s.world.playerState.chuTheId,
    });
    set({
      ongKinh: apOngKinh(get().ongKinh, chon, s.world.tick),
      viChieu: chon.vi,
    });
    return {
      machId: chon.machId,
      oChoNguoiChoi: ongKinhOChoNguoiChoi(s, chon.mucTieu, s.world.playerState.chuTheId),
    };
  };

  /** Luân phiên một nhóm neo Lorebook vào truy vấn để sách không chỉ bắn khi người chơi gọi đúng từ khóa. */
  const goiYLoreChoTruyHoi = (s: WorldState): string => {
    const muc: string[] = [];
    const lorebooks = [...s.lorebooks.values()]
      .filter((lb) => lb.bat)
      .sort((a, b) => b.uuTien - a.uuTien || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    for (const lb of lorebooks) {
      const phase = giaiDoanLore(lb, s.world.tick);
      const entries = [...lb.entries]
        .filter(
          (e) => e.trangThai === 'hoat_dong' && e.doTinCay > 0 && e.lop !== 'loi' && e.giaiDoanMo <= phase,
        )
        .sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      if (entries.length === 0) continue;
      const batDau = s.world.tick % entries.length;
      const xoay = [...entries.slice(batDau), ...entries.slice(0, batDau)].slice(0, lb.soDiemHutMoiLuot);
      muc.push(...xoay.map((e) => [e.ten, ...e.keys.slice(0, 3)].filter(Boolean).join(' · ')));
    }
    if (muc.length === 0) return '';
    return `Các điểm hút của thần thoại nguồn đang tới lượt được phát triển: ${muc.join('; ')}.`;
  };

  /**
   * Đánh giá kỳ vọng của mọi sách đang bật và ghi kết quả qua Event.
   * Trả id vừa lệch/bất khả để Smart Stop có dữ liệu thật thay vì một cổng chết.
   */
  const capNhatLoreTrongState = (s: WorldState, log: EventLog, nhan: string): readonly string[] => {
    const dangBat = new Set([...s.lorebooks.values()].filter((lb) => lb.bat).map((lb) => lb.id));
    const hienTai = [...s.loreExpectations.values()].filter((kv) => dangBat.has(kv.lorebookId));
    if (hienTai.length === 0) return [];
    const kq = capNhatKyVong({
      kyVong: hienTai,
      state: s,
      theoDoi: { thoaBoi: new Map(hienTai.flatMap((kv) => (kv.thoaBoiId ? [[kv.id, kv.thoaBoiId]] : []))) },
      tick: s.world.tick,
      // `doUuTien` đã mang lực hấp dẫn riêng của sách; không nhân lần thứ hai.
      lucHapDan: 100,
      nguyenNhan: { chuTheId: s.world.playerState.chuTheId, eventIds: [], moTa: nhan },
    });
    const vuaLech: string[] = [];
    demLore++;
    const evId = `ev_lore_cap_nhat_${s.world.branchId}_${s.world.tick}_${demLore}`;
    const patches: PatchOp[] = [];
    for (const moi of kq.kyVong) {
      const cu = s.loreExpectations.get(moi.id);
      if (!cu) continue;
      if ((moi.trangThai === 'da_lech' || moi.trangThai === 'bat_kha') && moi.trangThai !== cu.trangThai) {
        vuaLech.push(moi.id);
      }
      const truong = ['trangThai', 'lyDoLech', 'tickLech', 'thoaBoiId'] as const;
      for (const path of truong) {
        if (cu[path] === moi[path]) continue;
        patches.push({
          op: 'set',
          target: { table: 'loreExpectations', id: moi.id, path },
          value: moi[path],
          sourceEventId: evId,
        });
      }
    }
    for (const db of kq.diBanMoi) {
      if (s.diBan.has(db.id)) continue;
      patches.push({
        op: 'link',
        target: { table: 'diBan', id: db.id, path: '' },
        value: db,
        sourceEventId: evId,
      });
    }
    for (const gap of kq.gapMoi) {
      if (s.gaps.has(gap.id)) continue;
      patches.push({
        op: 'link',
        target: { table: 'gaps', id: gap.id, path: '' },
        value: gap,
        sourceEventId: evId,
      });
    }
    if (patches.length === 0) return vuaLech;
    const ev = taoEvent({
      id: evId,
      branchId: s.world.branchId,
      tick: s.world.tick,
      loai: 'cap_nhat_ky_vong_lorebook',
      actorIds: [],
      targetIds: [],
      causeEventIds: [],
      locationId: null,
      patches,
      visibility: 'engine',
      source: 'engine',
      payload: { soKyVong: kq.kyVong.length, vuaLech },
    });
    const ok = apDungEvent(s, ev, log);
    if (!ok.ok) set({ loi: [...get().loi, ...ok.errors] });
    return ok.ok ? vuaLech : [];
  };

  /**
   * Chạy chuỗi 54.9 cho lượt này.
   *
   * Trả `null` khi không có gì để truy hồi — thế giới hạt giống chưa có chunk
   * nào, và đó là trạng thái hợp lệ, không phải lỗi.
   */
  const chayTruyHoi = async (
    s: WorldState,
    view: WorldView,
    machId: string | null,
    cauNguoiChoi: string,
  ): Promise<KetQuaTruyHoi | null> => {
    const ai = useAi.getState();
    const td = tieuDiem(s, get().ongKinh.dangChieu, s.world.playerState.chuTheId);
    const tvGoc = dungBaTruyVan(view, {
      tieuDiemIds: td,
      loiNguoiChoi: cauNguoiChoi,
      machDangChieuId: machId,
    });
    const goiYLore = goiYLoreChoTruyHoi(s);
    const tv = goiYLore === '' ? tvGoc : { ...tvGoc, precedentText: `${tvGoc.precedentText} ${goiYLore}` };
    const chunks = dungChiMuc(s, `${cauNguoiChoi} ${tv.focusText} ${tv.intentText} ${tv.precedentText}`);
    if (chunks.length === 0) return null;

    const kq = await truyHoi({
      view,
      chunks,
      task: cauNguoiChoi.trim() === '' ? 'narrate_scene' : 'resolve_intent',
      truyVan: tv,
      tieuDiemIds: td,
      machDangChieuId: machId,
      config: ai.cfg.rerank,
      tuning: TUNING_MAC_DINH,
      // Tầng 4–6 dùng chung ngân sách; 33.1 cho chúng khoảng 40% tổng prompt.
      nganSachToken: Math.round(nganSachInput('ke_canh', null) * 0.4),
      tyLeToken: TY_LE_TOKEN,
      seed: s.world.seed,
      triThuc: 50,
      vungIds: new Set(vungCuaChuThe(s)),
      domainIds: new Set(domainCuaChuThe(s)),
      adapter: ai.adapterRerank(),
      mach: ai.machRerank,
      /**
       * [BB] 77.8 — cache khóa bảy phần, không bao giờ đọc chéo nhánh, chéo chủ
       * thể, chéo tầm nhìn hay chéo model. `KhoRerankCache` đã cưỡng chế điều đó
       * bằng chính hình dạng compound key; ở đây chỉ việc truyền khóa xuống.
       */
      cacheDoc: (k) => docCacheRerank(k, s.world.tick),
      cacheGhi: (k, r) => ghiCacheRerank(k, r, s.world.tick, ai.cfg.rerank.cacheTtlTicks),
      /**
       * Đồng hồ bơm từ ngoài — `core/` không được đọc đồng hồ máy (luật bất
       * biến #7), nhưng độ trễ retrieval là số liệu vận hành, không phải dữ liệu
       * game: nó không vào state và không vào hash.
       */
      dongHo: () => performance.now(),
    });

    ai.datMachRerank(kq.machMoi);
    ai.ghiNhanTruyHoi(kq.run);
    set({ truyHoiCuoi: kq });

    /**
     * [BB] Cổng Phase 8 — "metric retrieval-eval ĐƯỢC LƯU, có baseline trước khi
     * tối ưu semantic."
     *
     * Ghi xuống đĩa chứ không chỉ đếm trong bộ nhớ: baseline chỉ có nghĩa khi nó
     * sống qua lần đóng tab. `forbiddenCount` là số đáng lưu nhất trong hàng —
     * nó phải luôn bằng 0, và một lần khác 0 mà không ai ghi lại thì không ai
     * biết nó đã từng xảy ra.
     *
     * Không chặn lượt chơi: đĩa hỏng là chuyện của đĩa, không phải của lượt kể.
     */
    void ghiRunXuongDia(kq.run);
    return kq;
  };

  /**
   * Nối khái niệm nền AI vừa ghi nhận với bảy trục vật lý.
   *
   * AI chỉ khai bằng chứng (concept + giai đoạn + tag). Engine vẫn gọi đúng
   * validator `datTenTruc` theo thứ tự phụ thuộc, nên một câu văn không thể tự
   * vượt qua luật Nhân Quả/Vận Mệnh.
   */
  const datTenCacTrucDaDuNen = (s: WorldState): number => {
    let soTruc = 0;
    for (const truc of TRUC_NEN) {
      if ([...s.substrateLaws.values()].some((ln) => ln.truc === truc && ln.trangThai === 'co_ten')) continue;
      const hopLe = KHAI_NIEM_NEN_CUA_TRUC[truc];
      const ungVien = [...s.entities.values()]
        .filter((e) => {
          if (e.kind !== 'concept' || e.tickDiet !== null) return false;
          const c = e.aspects['conceptual'] as { giaiDoan?: string } | undefined;
          if (!daThanhHinh(c?.giaiDoan)) return false;
          return hopLe.some((h) => e.id.includes(h) || e.tags.includes(h));
        })
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
      if (ungVien && get().datTenTrucNen(truc, ungVien.id).length === 0) soTruc++;
    }
    return soTruc;
  };

  /**
   * Tùy chọn của một lượt kể.
   *
   * `nhipNen` mặc định BẬT, và bốn đường tắt nó có cùng một lý do: lượt ấy **đã
   * là** một lượt thời gian trôi (`tick`, `chayDienHoa`) hoặc **chưa phải** một
   * lượt chơi (`khoiTao`, chọn hiện diện). Cho nhịp nền chạy ở đó sẽ khiến
   * `tick(3)` đẩy thế giới đi bảy nhịp — một hợp đồng bị phá trong im lặng.
   */
  type TuyChonKeLuot = { nhipNen?: boolean };

  const keLuot = async (
    cauNguoiChoi: string,
    ketQuaEngine: readonly string[],
    tuyChon: TuyChonKeLuot = {},
  ): Promise<void> => {
    const s = get().state;
    const log = get().log;
    const view = get().view;
    if (!s || !log || !view) return;

    /*
     * Chụp TRƯỚC mọi thứ lượt kể này sắp làm — xem `AnhChupTruocKe`.
     *
     * `rerollDuoc` tắt ngay tại đây: từ giây này tới lúc lượt kể xong, ảnh chụp
     * đang trỏ về một thế giới không còn là thế giới hiện tại, và bấm reroll
     * giữa chừng sẽ lùi mất chính lượt đang chạy.
     */
    anhChupTruocKe = {
      state: saoChepNong(s),
      soEvent: log.tatCa().length,
      scene: get().scene,
      soCanhDaKe: canhDaKe.length,
      demLuotNhipNen: demLuotTuNhipNen,
      cau: cauNguoiChoi,
      ketQuaEngine: [...ketQuaEngine],
      nhipNen: tuyChon.nhipNen !== false,
    };
    /*
     * Ảnh chụp thứ hai không do đây tạo ra — `gui()` tạo. Việc của chỗ này chỉ
     * là canh nó đừng sống lâu hơn lượt của nó: xem chú thích `luotNayTuCauGoTay`.
     */
    if (!luotNayTuCauGoTay) anhChupTruocLuot = null;
    luotNayTuCauGoTay = false;
    set({ rerollDuoc: false, cauLuotTruoc: null });

    const ok = chieuOngKinh(s);
    const th = await chayTruyHoi(s, view, ok.machId, cauNguoiChoi);
    const treo = phucButDangTreo(s, null).slice(0, 8);
    // Regex placement=1 chỉ được chạm đúng lời người chơi, không được chạy trên
    // khối hợp đồng `<CapNhat>` sau khi prompt đã phẳng hóa.
    const cauNguoiChoiChoPrompt = usePreset.getState().transformPrompt(cauNguoiChoi, 1, 0);

    /*
     * [BB] ADR-0049 — MỘT đường prompt.
     *
     * `bienSoanLuot()` gọi `bienSoanPromptKe()` bên trong, nên sáu tầng của 33.1
     * vẫn là nguồn duy nhất của nội dung. Preset đang bật chỉ đổi cách sáu tầng
     * ấy được xếp; không pack nào bật thì hàm trả thẳng prompt native.
     *
     * Trước Phase 11 chỗ này gọi `bienSoanPromptKe()` trực tiếp, và đó chính là
     * lý do preset nhập vào rồi nằm im: pipeline nhập chạy đúng, còn kết quả của
     * nó không có đường nào tới model.
     */
    /**
     * Tóm tắt phiên — dựng từ scene history dài hơn `canhGanDay`.
     *
     * Khi không có mạch truyện đang chiếu, đây là nguồn duy nhất giúp model
     * nối mạch tự sự. Nối 20 dòng gần nhất thành một đoạn có nhãn vai trò;
     * `bienSoan` chỉ dùng nó khi tầng 4 không có mạch nào.
     */
    const sceneGanDay = get().scene.slice(-20);
    const tomTatPhien =
      sceneGanDay.length > 3
        ? sceneGanDay
            .filter((d) => d.loai !== 'he_thong')
            .map((d) =>
              d.loai === 'nguoi_choi' ? `[Ngươi] ${d.noiDung.slice(0, 150)}` : d.noiDung.slice(0, 200),
            )
            .join('\n')
            .slice(0, 1800)
        : undefined;

    /**
     * Vài chuyện hậu trường chưa ai kể — Sổ Hậu Trường, `world/hauTruong.ts`.
     *
     * Lấy ở đây, đóng dấu "đã kể" ở dưới, và giữa hai chỗ ấy là một lời gọi
     * model có thể hỏng. Thứ tự đó có chủ đích: đóng dấu TRƯỚC khi model trả lời
     * nghĩa là một lượt kể hỏng sẽ nuốt mất mấy chuyện ấy vĩnh viễn.
     */
    const seKeHauTruong = chuaKe(docSo(s.world.hauTruong), get().tuDienHoa.soGhiChuMoiLuotKe);

    const nguLieu = {
      view,
      banTin: get().banTin,
      hauTruongChuaKe: seKeHauTruong.map((g) => ({
        loai: g.loai,
        nhan: NHAN_LOAI_HAU_TRUONG[g.loai],
        noiDung: g.noiDung,
        tick: g.tick,
      })),
      loiCau: loiCauCho(s, s.world.playerState.chuTheId, s.world.tick),
      canhGanDay: get()
        .scene.slice(-12)
        .map((d) => ({ loai: d.loai, noiDung: d.noiDung })),
      tomTatPhien,
      cauNguoiChoi: cauNguoiChoiChoPrompt,
      ketQuaEngine,
      tenNguoiChoi: get().persona?.displayName ?? 'Người Chơi',
      tyLeToken: TY_LE_TOKEN,
      machDangChieu: ok.machId === null ? null : (view.machTruyen.find((m) => m.id === ok.machId) ?? null),
      ongKinhOChoNguoiChoi: ok.oChoNguoiChoi,
      phucButChuaTra: treo.map((f) => ({ noiDung: f.noiDung, quaHan: quaHan(f, s.world.tick) })),
      chunkTruyHoi: (th?.daChon ?? []).map((c) => ({
        nguon: c.nguon,
        text: c.projectedText,
        daBopMeo: c.daBopMeo,
      })),
      chunkBiCat: th?.biCat ?? [],
    };

    const paramsHieuLuc = usePreset.getState().thamSoHieuLuc(useAi.getState().cfg.narrator.params);
    const hopNhat = bienSoanLuot({
      nguLieu,
      scene: sceneHienTai(s),
      packs: packDangBat(),
      params: paramsHieuLuc,
      nganSachToken: nganSachInput('ke_canh', null),
      tenPersona: get().persona?.displayName ?? 'Người Chơi',
      // [BB] 78.11 — persona ĐÃ CHIẾU. `PlayerProfile` không có đường tới đây.
      moTaPersona: get().persona?.publicDescription ?? '',
      hoTroPrefill: useAi.getState().cfg.narrator.probe.xuatCoCauTruc,
      lichSuDaDinhDang: usePreset
        .getState()
        .lichSuChoPrompt(get().scene.map((d) => ({ loai: d.loai, noiDung: d.noiDungGoc ?? d.noiDung }))),
    });

    /*
     * Adapter merge chạy trên cấu trúc message, không chạy trên chuỗi đã phẳng.
     * Module `td:*` là lõi/hợp đồng engine và được giữ byte-for-byte; regex nội
     * tuyến chỉ có quyền sửa module nhập và các slot mà preset sở hữu.
     */
    let prompt: typeof hopNhat.prompt = hopNhat.prompt;
    if (hopNhat.compiled !== null) {
      const messages = usePreset.getState().apAdapterMessages(hopNhat.compiled.messages);
      const noi = (role: 'system' | 'user' | 'assistant'): string =>
        messages
          .filter((m) => m.role === role)
          .map((m) => m.content)
          .filter((x) => x.trim() !== '')
          .join(role === 'assistant' ? '\n' : '\n\n')
          .trim();
      const heThong = noi('system');
      const nguoiDung = noi('user');
      prompt = Object.freeze({
        ...hopNhat.prompt,
        heThong,
        nguoiDung,
        moiTraLoi: noi('assistant'),
        soKyTu: heThong.length + nguoiDung.length,
        uocToken: uocLuong(`${heThong}${nguoiDung}`, TY_LE_TOKEN),
      });
    }

    set({
      vetCatToken: prompt.vetCat.map((v) => ({ tang: v.tang, ten: v.ten, vi: v.vi })),
      presetTrace: {
        packDaDung: hopNhat.packDaDung,
        moduleBiBo: hopNhat.moduleBiBo,
        lyDoBiBo: hopNhat.lyDoBiBo,
        macroChuaGiai: hopNhat.macroChuaGiai,
        issues: hopNhat.issues.map((i) => `${i.code}: ${i.message}`),
      },
    });

    /*
     * ── Script preset được nói vào prompt ở đây ──
     *
     * `GENERATE_AFTER_COMBINE_PROMPTS` là chỗ SillyTavern để extension sửa prompt
     * cuối cùng, và preset thật dùng đúng chỗ ấy (kemini gộp vai, script nén lịch
     * sử ghi lại phần đầu). Ta phát cùng tên sự kiện với một object có thể sửa,
     * rồi đọc lại — không có bước đọc lại thì handler chạy xong mà chẳng đổi gì.
     *
     * `td:*` không nằm trong hai chuỗi này: chúng đã được ghép thành `heThong` /
     * `nguoiDung`, nên script sửa được lớp văn bản chứ không sửa được cấu trúc
     * message của engine.
     */
    const hopPrompt = { prompt: prompt.nguoiDung, dryRun: false, system: prompt.heThong };
    await usePreset.getState().phatSuKien(TAVERN_EVENTS.GENERATE_AFTER_COMBINE_PROMPTS, hopPrompt);
    if (typeof hopPrompt.prompt === 'string' && typeof hopPrompt.system === 'string') {
      const doi = hopPrompt.prompt !== prompt.nguoiDung || hopPrompt.system !== prompt.heThong;
      if (doi) {
        prompt = Object.freeze({
          ...prompt,
          heThong: hopPrompt.system,
          nguoiDung: hopPrompt.prompt,
          soKyTu: hopPrompt.system.length + hopPrompt.prompt.length,
          uocToken: uocLuong(`${hopPrompt.system}${hopPrompt.prompt}`, TY_LE_TOKEN),
        });
      }
    }

    set({ dangKe: true, loiKeDangStream: '' });
    await usePreset.getState().phatSuKien(TAVERN_EVENTS.GENERATION_STARTED, 'normal', false);
    const r = await useAi.getState().ke(prompt, paramsHieuLuc, (toanBo, moi) => {
      set({ loiKeDangStream: catSuyLuanNoiBo(toanBo) });
      void usePreset.getState().phatSuKien(TAVERN_EVENTS.STREAM_TOKEN_RECEIVED, moi, toanBo);
    });
    set({ dangKe: false });
    await usePreset.getState().phatSuKien(TAVERN_EVENTS.GENERATION_ENDED, get().scene.length);

    if (!r.ok) {
      /*
       * [BB] ADR-0056 — nói đúng chuyện đang xảy ra.
       *
       * Câu cũ ở đây là "thế giới vẫn giữ nguyên chỗ đang dở", và nó SAI: Event
       * của lượt này đã vào log trước khi ta gọi model. Thế giới đã đi tiếp; thứ
       * thiếu là lời kể. Ghi lại nguyên liệu để `keLai()` thử lại đúng nhịp ấy,
       * và khoá đường chơi cho tới lúc đó.
       */
      themDong(
        'he_thong',
        `Nhịp này chưa ai kể được: ${r.thongDiep} — thế giới đã đi tiếp, nhưng bạn chưa được đọc nó. ` +
          'Nối lại đường tới model rồi kể lại nhịp này.',
      );
      set({
        loiKeDangStream: '',
        // Giữ luôn `nhipNen`: kể lại một lượt `tick` không được biến nó thành
        // một lượt chơi và đẩy thêm một năm vào thế giới.
        luotChuaKe: {
          cau: cauNguoiChoi,
          ketQuaEngine: [...ketQuaEngine],
          nhipNen: tuyChon.nhipNen !== false,
        },
        loi: [...get().loi, loi('ai', r.ma, r.thongDiep, { recoverable: true })],
      });
      return;
    }
    set({ luotChuaKe: null });

    demKe++;
    const evId = `ev_ke_${s.world.branchId}_${s.world.tick}_${demKe}`;
    // Patch phục bút phải khai NGUỒN của chính nó, không mượn `evId`: `evId` có
    // thể không bao giờ tồn tại nếu lượt kể này không đổi gì trong thế giới.
    const evPbId = `${evId}_pb`;
    // Script adapter đọc chỉ thị trên output NGUYÊN BẢN trước khi các marker bị
    // dọn; sau đó bộ xử lý native mới cắt CoT/stop marker để bóc dữ liệu.
    usePreset.getState().captureOutput(r.vanBan, s.world.tick);
    const vanBanPreset = usePreset.getState().xuLyOutput(r.vanBan);
    let kq = bocTach(vanBanPreset, {
      eventId: evId,
      idHopLe: new Set(s.entities.keys()),
      branchId: s.world.branchId,
    });

    /**
     * Điểm cuối Cập Nhật Biến — 46.1, món nợ Phase 6b.
     *
     * Chạy SAU Narrator và trên chính văn Narrator vừa viết. Nó hỏng thì lượt
     * vẫn xong: ta giữ nguyên phần `<CapNhat>` mà Narrator tự khai (chế độ
     * `gop_vao_narrator`), chứ không mất lời kể.
     */
    const capNhat = await useAi.getState().capNhatBien(
      bienSoanPromptCapNhat({
        view,
        loiKe: kq.loiKe,
        ketQuaEngine,
        idHopLe: [...s.entities.keys()],
        tyLeToken: TY_LE_TOKEN,
      }),
    );
    if (capNhat?.ok) {
      const rieng = bocTach(capNhat.vanBan, {
        eventId: evId,
        idHopLe: new Set(s.entities.keys()),
        branchId: s.world.branchId,
      });
      // Văn của Updater bị bỏ hẳn: nó không phải người kể chuyện (46.2).
      // Patch của nó được hợp nhất, không thay thế: một khối rỗng không còn làm
      // mất vị thần/khái niệm mà Narrator vừa tạo đúng hợp đồng.
      kq = hopNhatCapNhat(kq, rieng);
    }

    /*
     * [BB] 64.3 — transform hiển thị chạy trên BẢN SAO.
     *
     * `hienThi()` trả một chuỗi mới; `kq.loiKe` gốc không đổi, và không transform
     * nào chạm được vào Event, Patch hay `WorldState`. Đây là toàn bộ chỗ regex
     * của preset được phép có mặt trong đường chơi.
     */
    /*
     * Parse `<choice>` block trước khi hiển thị.
     *
     * Block `<choice>` bị xóa khỏi lời kể; các lựa chọn đi vào state `luaChon`
     * để UI render thành buttons. Khi user chọn hoặc gõ input mới, `luaChon`
     * được xóa sạch ở `keLuot()` đầu lượt sau.
     */
    const { loiKe: loiKeSach, luaChon: dsLuaChon } = parseChoice(kq.loiKe);
    const loiKeHienThi = usePreset.getState().hienThi(loiKeSach, {
      user: get().persona?.displayName ?? 'Người Chơi',
      sceneId: `scene.${s.world.branchId}.${s.world.tick}`,
      turn: s.world.tick,
    });
    const laHtml = /<(?:style|div|section|article|details|table|h[1-6]|p|span)\b/i.test(loiKeHienThi);
    themDong('ket_qua', loiKeHienThi, {
      noiDungGoc: loiKeSach,
      dinhDang: laHtml ? 'html' : 'text',
    });
    set({ patchBiTuChoi: kq.biTuChoi, luaChon: dsLuaChon, loiKeDangStream: '' });

    /*
     * Hai sự kiện, hai nghĩa khác nhau — script preset phân biệt chúng.
     *
     * `MESSAGE_RECEIVED` là "đã có tin nhắn mới trong dữ liệu"; script đọc và sửa
     * nội dung ở đây. `CHARACTER_MESSAGE_RENDERED` là "DOM đã có"; script giao
     * diện bám vào đây. Phát nhầm thứ tự thì script DOM query một node chưa tồn
     * tại và im lặng không làm gì.
     */
    const idTin = get().scene.length - 1;
    await usePreset.getState().phatSuKien(TAVERN_EVENTS.MESSAGE_RECEIVED, idTin);
    // Chờ một khung hình để React kịp vẽ dòng vừa thêm trước khi script bám DOM.
    await new Promise<void>((xong) => {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => xong());
      else setTimeout(xong, 0);
    });
    await usePreset.getState().phatSuKien(TAVERN_EVENTS.CHARACTER_MESSAGE_RENDERED, idTin);

    /*
     * Biến pack — 66.6, tương thích thẻ bài MVU.
     *
     * Chúng đi vào kho biến của pack, KHÔNG đi vào `apDungEvent`. Một thẻ bài MVU
     * đổi được bảng trạng thái của chính nó và không đổi được một dòng nào trong
     * thế giới, và ranh giới ấy nằm ở đúng hai dòng dưới đây.
     */
    if (kq.bienPack.length > 0) {
      // `void` nhưng KHÔNG im lặng: phần bị bỏ đi vào bảng Tự Chẩn Đoán ngay
      // cạnh patch bị từ chối, vì với người chơi đó là cùng một triệu chứng —
      // "tôi thấy model khai con số ấy mà bảng không đổi".
      void usePreset
        .getState()
        .apBienPack(kq.bienPack, s.world.tick)
        .then((bc) => {
          if (bc.soBiBo === 0) return;
          set({
            patchBiTuChoi: [
              ...get().patchBiTuChoi,
              { ma: 'SAI_SCHEMA', thongDiep: bc.vi, nguyenVan: kq.bienPack[0]?.duong ?? '' },
            ],
          });
        });
    }

    // [BB] 28.6 — đếm cảnh để đo hạn ngạch vắng mặt, theo CẢNH chứ không theo token.
    canhDaKe.push({ coNguoiChoi: ok.oChoNguoiChoi });
    set({ vangMat: hanNgachVangMat(canhDaKe.slice(-40)) });

    /**
     * [BB] 30.2 — engine ghi Sổ Phục Bút, model chỉ khai đã gieo cái gì.
     *
     * Hạn trả do engine đặt, không do model: hạn là thứ quyết định khi nào ống
     * kính bị kéo về mạch ấy, tức là một quyết định gameplay chứ không phải một
     * chi tiết văn chương.
     */
    const patchPhucBut: PatchOp[] = [];
    for (const f of kq.phucBut) {
      const g = gieoPhucBut(
        s,
        {
          noiDung: f.noiDung,
          loai: f.loai,
          machId: ok.machId,
          hanTraToiDa: HAN_TRA_MAC_DINH,
          doNang: 55,
        },
        { tick: s.world.tick, eventId: evPbId },
      );
      patchPhucBut.push(...g.patches);
    }

    /**
     * [BB] 54.10 — khẳng định quá khứ không đối chiếu được KHÔNG bị xóa.
     * Nó thành `gap` loại `nhan_qua`: một câu hỏi chưa có lời đáp, tức nội dung.
     */
    for (const [i, u] of kq.chuaChungThuc.entries()) {
      const gapId = `gap_nhan_qua_ke_${s.world.tick}_${demKe}_${i}`;
      if (s.gaps.has(gapId)) continue;
      patchPhucBut.push({
        op: 'link',
        target: { table: 'gaps', id: gapId, path: '' },
        value: {
          id: gapId,
          branchId: s.world.branchId,
          loai: 'nhan_qua',
          chuTheId: null,
          moTa: `Chưa đối chiếu được: ${u}`,
          uuTien: 40,
          lanThu: 0,
          trangThai: 'thanh_bi_an',
          tickPhatHien: s.world.tick,
        },
        sourceEventId: evPbId,
      });
    }

    /**
     * Thứ tự hai Event dưới đây có nghĩa, và làm ngược thì hỏng.
     *
     * Event phục bút khai `causeEventIds = [evId]`, mà `evId` CHỈ vào log khi
     * lượt kể có patch. Áp phục bút trước sẽ trỏ nhân quả tới một Event chưa
     * tồn tại — và transaction bắt đúng điều đó ("trỏ nguyên nhân không có trong
     * log"). Nên: kể trước, phục bút sau, và chỉ khai nhân quả khi có thật.
     */
    let daCoEventKe = false;
    if (kq.patches.length > 0) {
      // [BB] `source = 'ai_validated'` chỉ dùng SAU khi output đã qua schema và
      // bảng trắng thẩm quyền — đó chính là thứ `bocTach()` vừa làm.
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'narrator_cap_nhat',
        actorIds: s.world.playerState.chuTheId ? [s.world.playerState.chuTheId] : [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches: [...kq.patches],
        visibility: 'cong_khai',
        source: 'ai_validated',
        payload: { soPatch: kq.patches.length, soTuChoi: kq.biTuChoi.length },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        // Invariant từ chối là kết quả ĐÚNG, không phải sự cố: lời kể vẫn còn,
        // chỉ thế giới là không đổi. Người chơi thấy văn, engine giữ sổ.
        set({ loi: [...get().loi, ...ok.errors] });
      }
      daCoEventKe = ok.ok;
    }

    if (patchPhucBut.length > 0) {
      const evPb = taoEvent({
        id: evPbId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'gieo_phuc_but',
        actorIds: [],
        targetIds: [],
        causeEventIds: daCoEventKe ? [evId] : [],
        locationId: null,
        patches: patchPhucBut,
        visibility: 'engine',
        source: 'ai_validated',
        payload: { soPhucBut: kq.phucBut.length, soChuaChungThuc: kq.chuaChungThuc.length },
      });
      const okPb = apDungEvent(s, evPb, log);
      if (!okPb.ok) set({ loi: [...get().loi, ...okPb.errors] });
    }

    /**
     * Gieo nền cho thứ vừa được kể ra đời — [BB] ADR-0055 nối tiếp 71.2.
     *
     * Trên một thế giới hư vô, `place` đầu tiên xuất hiện giữa một lượt kể chứ
     * không ở nhịp 0. Một vùng không có `dan_cu`/`kinh_te`/`sinh_thai` bị mười
     * hai tiến trình **bỏ qua trong im lặng** — không lỗi, không cảnh báo, chỉ là
     * một vùng đứng hình mãi mãi. Nên phép gieo phải chạy lại sau mỗi lượt có
     * patch, chứ không chỉ một lần lúc khởi tạo.
     *
     * `patchGieoNen()` đã idempotent: thế giới đã gieo đủ thì nó trả patch rỗng
     * và `eventGieoNen()` trả `null`, nên gọi mỗi lượt không tốn gì.
     */
    const evNen = eventGieoNen(s, `:ke${demKe}`);
    if (evNen) {
      const okNen = apDungEvent(s, evNen, log);
      if (!okNen.ok) set({ loi: [...get().loi, ...okNen.errors] });
    }

    /*
     * Đóng dấu "đã kể" cho những chuyện hậu trường vừa đi vào prompt.
     *
     * Đóng dấu theo việc **đã đưa cho Narrator**, không theo việc nó có dùng
     * hay không — và đó là lựa chọn có ý thức. Model được bảo "dệt một hai
     * điều, phần còn lại để đó", nên đo xem nó dùng cái nào là đo một thứ không
     * đo được. Giữ lại thì tệ hơn nhiều: cùng ba dòng ấy sẽ vào prompt mỗi lượt
     * cho tới khi model chịu nhắc đủ cả ba, và hàng đợi tắc ở đầu.
     */
    if (seKeHauTruong.length > 0) {
      const l = apSoHauTruong(
        s,
        log,
        danhDauDaKe(
          docSo(s.world.hauTruong),
          seKeHauTruong.map((g) => g.id),
        ),
        {
          goc: `ev_hau_truong_ke_${s.world.branchId}_${s.world.tick}_${demKe}`,
          loai: 'hau_truong_da_ke',
          payload: { soGhiChu: seKeHauTruong.length },
        },
      );
      if (l.length > 0) set({ loi: [...get().loi, ...l].slice(-200) });
    }

    // Khái niệm Thời Gian/Không Gian vừa được tạo không còn nằm mãi ở sổ Tạo
    // Vật trong khi trục tương ứng vẫn "vô danh". Validator engine quyết việc
    // đặt tên ngay trong cùng lượt kể.
    datTenCacTrucDaDuNen(s);

    capNhatLoreTrongState(s, log, 'Kỳ vọng được đối chiếu sau lượt kể.');

    // [BB] 47 — thế giới đi tiếp một nhịp của riêng nó sau mỗi lượt kể.
    const daChayNhipNen = tuyChon.nhipNen !== false && nhipNenSauLuot(ok.machId !== null);

    dongBo();

    /*
     * Lượt đã kể trọn vẹn, nên ảnh chụp ở đầu hàm giờ mới thật sự dùng được:
     * nó là ranh giới giữa "lượt này" và "trước lượt này". Bật cờ ở ĐÂY chứ
     * không ở chỗ Narrator trả lời — giữa hai chỗ ấy còn patch, phục bút, gieo
     * nền và nhịp nền, và lùi về giữa chừng sẽ để lại một nửa lượt.
     */
    set({ rerollDuoc: true, cauLuotTruoc: anhChupTruocLuot?.cau ?? null });

    /**
     * Tự lưu sau MỖI lượt được kể trọn vẹn — món nợ mở từ Phase 3.
     *
     * Đặt ở đây chứ không ở từng hành động: mọi đường chơi đều kết thúc bằng một
     * lượt kể, nên một chỗ này phủ hết. Không `await`: người chơi không phải chờ
     * đĩa để đọc câu vừa hiện ra, và `luuVan()` đã tự nuốt lỗi ghi.
     */
    void get().luuVan();

    /*
     * Mô phỏng hậu trường chạy CUỐI CÙNG, sau khi lời kể đã hiện ra và ván đã
     * xuống đĩa.
     *
     * Thứ tự ấy là hợp đồng: người chơi đọc xong cảnh của mình rồi thế giới mới
     * bắt đầu nghĩ về phần nó làm sau lưng họ. Đảo lại — mô phỏng trước, kể sau
     * — sẽ bắt họ chờ bảy lời gọi model trước khi được đọc một chữ nào.
     *
     * `await` chứ không `void`: người gọi `keLuot()` cần biết lượt đã xong hẳn,
     * và `moPhongHauTruong()` đã tự bọc mọi lỗi của chính nó.
     */
    if (daChayNhipNen) await moPhongHauTruong();
  };

  /**
   * Nhịp nền cuối lượt — Diễn Hóa tự động, [BB] 47 gặp ADR-0028.
   *
   * ── Vì sao nó tồn tại ──
   *
   * Trước đây thế giới chỉ nhúc nhích khi người chơi bấm "tick" hoặc mở Xưởng
   * Workflow bấm "Chạy Diễn Hóa". Nghĩa là giữa hai câu người chơi gõ, mười hai
   * tiến trình nền không chạy một bước nào, và mọi mạch truyện đứng im chờ.
   * Thế giới chỉ tồn tại khi có người nhìn — đúng thứ mà cả Phần 71 tồn tại để
   * chống.
   *
   * ── Vì sao nó ĐỒNG BỘ và NGẮN ──
   *
   * Đồng bộ: nó chạy trong `keLuot()`, ngay trước `dongBo()`, nên người chơi
   * đọc lời kể và đọc biên niên sử của nhịp nền trong cùng một lần vẽ. Một nhịp
   * nền chạy bất đồng bộ sau lưng sẽ đổi thế giới sau khi lời kể đã hiện ra, và
   * lời kể ấy lập tức nói sai về thế giới.
   *
   * Ngắn: mặc định MỘT lượt nhịp `nien`, tức bốn tick, tức một bước engine.
   * ADR-0028 nói thế giới không được đi tiếp mà người chơi không đọc được — nên
   * mỗi việc nhịp nền làm đều phải ghi ra một dòng, và một nhịp ba mươi năm thì
   * không dòng nào kể nổi.
   *
   * KHÔNG gọi LLM, KHÔNG gọi `keLuot()`. Chốt `dangTrongNhipNen` canh điều thứ hai.
   *
   * Phần CÓ gọi model nằm ở `moPhongHauTruong()`, chạy sau và bất đồng bộ — xem
   * chú thích ở đó để biết vì sao hai phần phải tách làm hai.
   *
   * Trả `true` khi nhịp nền thật sự đã chạy: người gọi dùng nó để quyết có chạy
   * tiếp phần mô phỏng hay không, vì hai phần dùng CHUNG một bộ đếm lượt.
   */
  const nhipNenSauLuot = (dangKeTruyen: boolean): boolean => {
    const cfg = get().tuDienHoa;
    if (!cfg.bat || dangTrongNhipNen || get().dangDienHoa) return false;
    const s = get().state;
    const log = get().log;
    if (!s || !log) return false;

    /*
     * Đếm lượt kể, và chỉ chạy khi đủ nhịp.
     *
     * Tăng bộ đếm TRƯỚC khi so: đặt `moiBaoNhieuLuot = 1` phải chạy ở mọi lượt,
     * và so trước khi tăng sẽ bỏ mất lượt đầu tiên.
     */
    const hieuLuc = tinhNhipNenHieuLuc(s, cfg, dangKeTruyen);
    demLuotTuNhipNen++;
    if (demLuotTuNhipNen < hieuLuc.moiBaoNhieuLuot) return false;
    demLuotTuNhipNen = 0;

    dangTrongNhipNen = true;
    try {
      const cauHinh = CauHinhDienHoaSchema.parse({
        soLuot: hieuLuc.soLuot,
        nhipMoiLuot: hieuLuc.nhip,
        boiDap: { bat: cfg.hanMucBoiDap > 0, hanMucMoiLuot: cfg.hanMucBoiDap },
      });
      const tickDau = s.world.tick;
      const dongBienNien: string[] = [];
      const loiGom: StructuredError[] = [];

      for (let i = 0; i < hieuLuc.soLuot; i++) {
        const r = tuaMotLuot(s, log, hieuLuc.nhip, `nen${i}`);
        loiGom.push(...r.loi);
        if (!r.ok) break;
        for (const sk of r.suKienLon.slice(0, 3)) dongBienNien.push(sk.moTa);

        if (cfg.hanMucBoiDap > 0) {
          const bd = chayBoiDap(s, log, {
            hanMuc: cfg.hanMucBoiDap,
            tho: cauHinh.boiDap.tho,
            cauHinh,
            hauTo: `nen${i}`,
          });
          loiGom.push(...bd.loi);
          for (const v of bd.viec) dongBienNien.push(v.moTa);
        }
      }

      /*
       * Gieo nền lại SAU nhịp nền: Bồi Đắp có thể vừa lập một làng mới, và một
       * vùng thiếu aspect nền sẽ bị mười hai tiến trình bỏ qua trong im lặng.
       * `eventGieoNen()` idempotent nên gọi thừa không tốn gì.
       */
      const evNenSau = eventGieoNen(s, `:nhipnen${s.world.tick}`);
      if (evNenSau) {
        const okNen = apDungEvent(s, evNenSau, log);
        if (!okNen.ok) loiGom.push(...okNen.errors);
      }
      capNhatLoreTrongState(s, log, 'Kỳ vọng được đối chiếu sau nhịp nền.');

      if (loiGom.length > 0) set({ loi: [...get().loi, ...loiGom].slice(-200) });

      /*
       * Một dòng duy nhất, kể cả khi không có gì xảy ra.
       *
       * "Không có gì đáng ghi" cũng là thông tin: nó nói với người chơi rằng
       * thời gian ĐÃ trôi, và đó chính là điều ADR-0028 đòi hỏi.
       */
      const soNam = Math.max(0, Math.round((s.world.tick - tickDau) / 4));
      const dauDong =
        soNam > 0
          ? `${soNam} năm trôi qua — ${hieuLuc.nhan}.`
          : `Thời gian nhích một nhịp — ${hieuLuc.nhan}.`;
      themDong(
        'he_thong',
        dongBienNien.length === 0
          ? `${dauDong} Không có gì đáng ghi vào biên niên sử.`
          : `${dauDong} ${dongBienNien.slice(0, 4).join(' ')}`,
      );
    } finally {
      dangTrongNhipNen = false;
    }
    return true;
  };

  /**
   * Mô phỏng hậu trường — đường ống Workflow chạy sau lưng lượt kể.
   *
   * ── Vì sao nó tách khỏi `nhipNenSauLuot()` ──
   *
   * Vì hai phần trả lời hai câu khác nhau và có hai ràng buộc trái ngược.
   *
   * Nhịp nền phải ĐỒNG BỘ: nó đổi dân số, mùa màng, mạch truyện, và lời kể vừa
   * hiện ra phải nói đúng về thế giới sau khi nó chạy. Mô phỏng hậu trường thì
   * KHÔNG được đồng bộ: nó gọi model bảy lần, và bắt người chơi nhìn màn hình
   * đứng im mười giây sau mỗi câu họ gõ là cách chắc chắn nhất để họ tắt tính
   * năng này đi.
   *
   * Cái làm phép tách ấy an toàn là Sổ Hậu Trường: mô phỏng không đổi thế giới,
   * nó chỉ **ghi lại những gì thế giới vừa nghĩ ra** vào một hàng đợi. Lời kể
   * vừa hiện ra không thể nói sai về một thứ chưa có hiệu lực, và ADR-0028 vẫn
   * được giữ vì mọi ghi chú trong hàng đợi rồi sẽ lên chính văn — chỉ là ở nhịp
   * sau, chứ không phải nhịp này.
   */
  const moPhongHauTruong = async (): Promise<void> => {
    const cfg = get().tuDienHoa;
    if (!cfg.bat || !cfg.workflow.bat || dangMoPhong || get().dangDienHoa) return;
    const s = get().state;
    const log = get().log;
    if (!s || !log) return;

    const duongOng = chuanBiDuongOng(cfg.workflow.presetId, cfg.workflow.epChayHet);
    if (duongOng === null) return;

    dangMoPhong = true;
    set({ dangMoPhongHauTruong: true });
    try {
      const kq = await duongOng.chay(s, demKe);
      set({ vetDuongOng: [...kq.vet] });

      const ghi: GhiChuHauTruong[] = [];
      for (const o of kq.output) {
        ghi.push(...bocGhiChu(o.taskId, o.text, s.world.tick, cfg.workflow.soGhiChuMoiTacVu));
      }
      if (ghi.length === 0) {
        /*
         * Bảy call mà không đọc ra được câu nào là một sự cố, không phải một
         * lượt yên ắng — và người chơi vừa trả tiền cho nó. Nói ra.
         */
        if (kq.soCall > 0) {
          themDong(
            'he_thong',
            `Thế giới vừa tự chạy ${kq.soCall} lượt mô phỏng nhưng không rút ra được chuyện nào kể được. ` +
              `${kq.soEntryLorebook > 0 ? `Đã cập nhật ${kq.soEntryLorebook} entry trong Sử của thế giới. ` : ''}` +
              'Xem Tự Chẩn Đoán để biết tác vụ nào im lặng.',
          );
        }
        if (kq.soEntryLorebook > 0) {
          dongBo();
          void get().luuVan();
        }
        return;
      }

      const soMoi = themGhiChu(docSo(s.world.hauTruong), ghi);
      const l = apSoHauTruong(s, log, soMoi, {
        goc: `ev_hau_truong_${s.world.branchId}_${s.world.tick}`,
        loai: 'mo_phong_hau_truong',
        payload: { soGhiChu: ghi.length, soCall: kq.soCall },
      });
      if (l.length > 0) {
        set({ loi: [...get().loi, ...l].slice(-200) });
        return;
      }

      /*
       * Một dòng nói RÕ đây là hàng đợi, không phải nội dung.
       *
       * Người chơi cần biết ba điều: thế giới đã chạy, nó tốn bao nhiêu, và
       * chuyện sẽ tới dần chứ không tới ngay. Thiếu vế thứ ba thì lượt kể tiếp
       * theo trông như đã bỏ qua tất cả những gì vừa mô phỏng.
       */
      themDong(
        'he_thong',
        `Thế giới vừa tự chạy sau lưng bạn: ${kq.soCall} lượt gọi, ${ghi.length} chuyện mới. ` +
          `${kq.soEntryLorebook > 0 ? `${kq.soEntryLorebook} entry Sử đã được cập nhật. ` : ''}` +
          'Chúng sẽ được kể dần ở những nhịp tới.',
      );
      dongBo();
      void get().luuVan();
    } catch (e) {
      set({
        loi: [
          ...get().loi,
          loi('ai', 'MO_PHONG_HAU_TRUONG_HONG', `Mô phỏng hậu trường dừng giữa chừng: ${String(e)}`, {
            recoverable: true,
          }),
        ].slice(-200),
      });
    } finally {
      dangMoPhong = false;
      set({ dangMoPhongHauTruong: false });
    }
  };

  /**
   * Gieo bảy bản ghi Luật Nền cho một nhánh chưa có — [BB] 43.2.
   *
   * "Thế giới **luôn** vận hành theo một cấu hình nào đó; engine cần giá trị để
   * chạy." Bảy trục sinh ra ở trạng thái `vo_danh` với tham số phàm tục: thời
   * gian vẫn trôi một chiều, nhưng chưa ai lợi dụng được điều đó vì lợi dụng đòi
   * hỏi phải biết luật. Không gieo thì màn Vật Lý không có gì để hiện và
   * `datTenTruc()` từ chối mọi trục vì "chưa có bản ghi".
   *
   * Idempotent: nhánh đã có đủ bảy trục thì trả `null`.
   */
  const eventGieoLuatNen = (s: WorldState): SuKien | null => {
    if (s.substrateLaws.size >= 7) return null;
    const evId = `ev_gieo_luat_nen_${s.world.branchId}_${s.world.tick}`;
    const patches = luatNenMacDinh(s.world.branchId)
      .filter((ln) => !s.substrateLaws.has(ln.id))
      .map((ln): PatchOp => ({
        op: 'link',
        target: { table: 'substrateLaws', id: ln.id, path: '' },
        value: ln,
        sourceEventId: evId,
      }));
    if (patches.length === 0) return null;
    return taoEvent({
      id: evId,
      branchId: s.world.branchId,
      tick: s.world.tick,
      loai: 'gieo_luat_nen',
      actorIds: [],
      targetIds: [],
      causeEventIds: [],
      locationId: null,
      patches,
      visibility: 'engine',
      source: 'engine',
      payload: { soTruc: patches.length },
    });
  };

  /**
   * Bảo đảm nhánh có một lorebook `tu_sinh` làm đích ghi an toàn cho workflow.
   * Ván cũ được nâng cấp lười ở lần mở/chạy đầu tiên; ván mới có sách ngay từ
   * lúc khai thiên để người chơi nhìn thấy tính năng đang hoạt động.
   */
  const damBaoLorebookSuTheGioi = (s: WorldState, log: EventLog): Lorebook | null => {
    const daCo = s.lorebooks.get(ID_LOREBOOK_SU_THE_GIOI);
    if (daCo !== undefined) return daCo.nguon === 'tu_sinh' ? daCo : null;

    demLore++;
    const evId = `ev_tao_lore_su_${s.world.branchId}_${s.world.tick}_${demLore}`;
    const lorebook = { ...taoLorebookSuTheGioi(s.world.branchId), tickBat: s.world.tick };
    const ev = taoEvent({
      id: evId,
      branchId: s.world.branchId,
      tick: s.world.tick,
      loai: 'tao_lorebook_tu_sinh',
      actorIds: [],
      targetIds: [],
      causeEventIds: [],
      locationId: null,
      patches: [
        {
          op: 'link',
          target: { table: 'lorebooks', id: lorebook.id, path: '' },
          value: lorebook,
          sourceEventId: evId,
        },
      ],
      visibility: 'engine',
      source: 'engine',
      payload: { lorebookId: lorebook.id },
    });
    const ok = apDungEvent(s, ev, log);
    if (!ok.ok) {
      set({ loi: [...get().loi, ...ok.errors].slice(-200) });
      return null;
    }
    return s.lorebooks.get(lorebook.id) ?? null;
  };

  type KetQuaGhiDichLorebook = Readonly<{
    soEntry: number;
    loi: readonly StructuredError[];
  }>;

  /** Áp riêng các đích `ghi_lorebook`; mọi đích khác vẫn giữ lằn ranh cũ. */
  const apDichGhiLorebook = (
    s: WorldState,
    log: EventLog,
    preset: WorkflowPreset,
    output: readonly { taskId: string; text: string }[],
  ): KetQuaGhiDichLorebook => {
    if (output.length === 0) return { soEntry: 0, loi: [] };

    // Chụp nguồn TRƯỚC khi tạo sách đích để sự kiện "tạo cái sổ" không tự làm
    // bằng chứng cho nội dung được viết vào sổ ấy.
    const suKienChongLung = log
      .tatCa()
      .filter(
        (e) =>
          e.patches.length > 0 &&
          e.loai !== 'tao_lorebook_tu_sinh' &&
          !e.loai.includes('lorebook') &&
          !e.loai.includes('lore_'),
      )
      .slice(-3)
      .map((e) => e.id);

    const sachSu = damBaoLorebookSuTheGioi(s, log);
    if (sachSu === null) return { soEntry: 0, loi: [] };

    const loiGom: StructuredError[] = [];
    const sachMoi = new Map<string, Lorebook>();
    let soEntry = 0;
    const taskTheoId = new Map(preset.tasks.map((t) => [t.id, t]));
    const eventMap = new Map(log.tatCa().map((e) => [e.id, e]));

    for (const o of output) {
      const task = taskTheoId.get(o.taskId);
      if (task === undefined || o.text.trim() === '') continue;
      const dich = [...task.dichGhi, ...preset.quyTacGhiLorebook].filter((d) => d.loai === 'ghi_lorebook');

      for (const target of dich) {
        const lorebookId =
          target.lorebookNguon === 'chi_dinh' && target.lorebookId.trim() !== ''
            ? target.lorebookId.trim()
            : ID_LOREBOOK_SU_THE_GIOI;
        const lb = sachMoi.get(lorebookId) ?? s.lorebooks.get(lorebookId);
        if (lb === undefined) {
          loiGom.push(
            loi('schema', 'LOREBOOK_DICH_KHONG_TON_TAI', `Không có lorebook đích "${lorebookId}".`, {
              path: o.taskId,
              recoverable: true,
            }),
          );
          continue;
        }

        const kq = ghiLorebook({
          target,
          noiDung: o.text.trim(),
          tick: s.world.tick,
          nguonDich: lb.nguon,
          lorebookId: lb.id,
          taskId: task.id,
          suKienChongLung,
        });
        if (!kq.ok) {
          loiGom.push(...kq.loi);
          continue;
        }

        const entry: LorebookEntry = {
          ...kq.entry,
          doTinCay: tinhDoTinCay(kq.entry, eventMap),
        };
        const hop = hopNhatEntryTuSinh(lb, entry);
        if (!hop.thayDoi) continue;
        sachMoi.set(lb.id, hop.lorebook);
        soEntry++;
      }
    }

    if (sachMoi.size === 0) return { soEntry, loi: loiGom };
    demLore++;
    const evId = `ev_ghi_lore_tu_sinh_${s.world.branchId}_${s.world.tick}_${demLore}`;
    const ev = taoEvent({
      id: evId,
      branchId: s.world.branchId,
      tick: s.world.tick,
      loai: 'ghi_lorebook_tu_sinh',
      actorIds: [],
      targetIds: [],
      causeEventIds: suKienChongLung,
      locationId: null,
      patches: [...sachMoi.values()].map((lb) => ({
        op: 'set' as const,
        target: { table: 'lorebooks', id: lb.id, path: 'entries' },
        value: lb.entries,
        sourceEventId: evId,
      })),
      visibility: 'engine',
      source: 'ai_validated',
      payload: { soEntry, taskIds: [...new Set(output.map((o) => o.taskId))] },
    });
    const ok = apDungEvent(s, ev, log);
    if (!ok.ok) return { soEntry: 0, loi: [...loiGom, ...ok.errors] };
    return { soEntry, loi: loiGom };
  };

  /**
   * Dựng bộ chạy đường ống workflow — [BB] 50.2 – 50.10.
   *
   * Trả `null` khi không có gì để chạy, và ba lý do đều hợp lệ: preset trống,
   * preset vi phạm lằn ranh, hoặc không có đường nào tới model.
   *
   * ── Điểm cuối: Diễn Hóa nếu có, không thì Tường Thuật ──
   *
   * Bản đầu trả `null` khi `workflow.batRieng` tắt, và đó là một cái bẫy im
   * lặng: phần lớn người chơi không cấu hình điểm cuối THỨ HAI, nên họ chọn
   * preset "Engine hậu trường", thấy bảy tác vụ liệt kê ra, bấm chạy — và không
   * một tác vụ nào chạy, không một dòng nào giải thích. 46.1 cho phép tắt riêng
   * điểm cuối Diễn Hóa; nó không nói rằng thiếu điểm cuối ấy thì cả đường ống
   * phải nằm im. Tường Thuật đã được kiểm tra kết nối, và đây vẫn là "một model
   * đọc một prompt rồi trả về văn bản".
   *
   * Đích `ghi_lorebook` được định tuyến riêng vào sách `tu_sinh`; mọi lần ghi
   * đều qua `ghiLorebook()` để chặn ghi đè sách người dùng và chặn đệ quy.
   */
  const chuanBiDuongOng = (
    presetId: string,
    epChayHet = false,
  ): {
    chay: (
      s: WorldState,
      luot: number,
    ) => Promise<{
      soCall: number;
      vet: TrangThaiGame['vetDuongOng'][number][];
      /** Output từng tác vụ — nguyên liệu của Sổ Hậu Trường. */
      output: { taskId: string; text: string }[];
      /** Số entry tự sinh vừa thêm/cập nhật sau khi chống trùng. */
      soEntryLorebook: number;
    }>;
  } | null => {
    const preset = PRESET_WORKFLOW[presetId];
    if (preset === undefined || preset.tasks.length === 0) return null;

    // [BB] 50.10 — kiểm TRƯỚC khi chạy, không phải lúc đang chạy dở.
    const ranh = kiemLanRanh(preset);
    if (!ranh.dat) {
      set({ loi: [...get().loi, ...ranh.loi] });
      return null;
    }

    const ep = duongChoBoiDapAi();
    if (ep === null) return null;

    const lich = new Map<string, TrangThaiLich>();

    return {
      chay: async (s, luot) => {
        const view = chieu(s, s.world.playerState.mode, s.world.playerState.chuTheId);
        const bang: Record<string, string> = {
          nhip: String(s.world.tick),
          nam: String(s.world.year),
          kyNguyen: s.world.eraId,
          soThucThe: String(s.entities.size),
          soMachTruyen: String(s.storylines.size),
          tang: view.mode,
          nguoiChoi: get().persona?.displayName ?? 'Người Chơi',
        };

        const macroChuaGiai = new Set<string>();
        let soCall = 0;

        const kq = await chayDuongOng({
          preset,
          tuning: TUNING_MAC_DINH,
          trangThaiLich: lich,
          epChayHet,
          lich: { luot, tick: s.world.tick, suKien: [] },
          /**
           * Nguồn liệt kê cho họ bản sao — [BB] 50.3: tra BẢNG, không eval chuỗi.
           *
           * ── Vì sao id lạ KHÔNG còn trả mảng rỗng ──
           *
           * Bảng đầu chỉ biết ba tên, còn tác vụ dựng sẵn quan trọng nhất của
           * 50.9 — "Hành động NPC", stage 2 — khai `npc_t2_theo_spotlight`. Ba
           * cái tên kia không có nó, nên `muc` là mảng rỗng, nên vòng lặp lô
           * chạy không lần nào, nên tác vụ ấy **báo là đã chạy mà không gọi
           * model một lần**. Nó là tác vụ duy nhất bắt buộc bật họ bản sao, và
           * nó là tác vụ duy nhất chưa bao giờ chạy.
           *
           * Nay: tên lạ rơi về danh sách nhân vật sống — mặc định đúng cho một
           * tác vụ khai họ bản sao, vì "một bản sao cho mỗi X" gần như luôn
           * nghĩa là mỗi nhân vật.
           */
          lietKe: (nguon, gioiHan) => {
            const song = [...s.entities.values()].filter((e) => e.tickDiet === null);
            const nhanVat = song.filter((e) => e.kind === 'mortal' || e.kind === 'deity');
            const ds =
              nguon === 'noi_chon'
                ? song.filter((e) => e.kind === 'place')
                : nguon === 'mach_truyen'
                  ? [...s.storylines.values()]
                  : nhanVat;
            return ds
              .map((x) => x.id)
              .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
              .slice(0, gioiHan);
          },
          dungPrompt: (task, mucId, nguCanhTruoc) => {
            const b = bienSoanTacVu({ task, bang, nguCanhTruoc, mucId });
            for (const m of b.macroChuaGiai) macroChuaGiai.add(m);
            return b.messages;
          },
          goi: async (yc) => {
            soCall++;
            const r = await goiTacVuWorkflow(ep, yc.messages);
            return r.ok ? { ok: true, text: r.vanBan } : { ok: false, maLoi: r.ma, thongDiep: r.thongDiep };
          },
        });

        for (const gd of kq) {
          for (const t of gd.ketQua) lich.set(t.taskId, t.trangThaiLich);
        }

        if (macroChuaGiai.size > 0) {
          set({
            presetTrace: {
              ...get().presetTrace,
              macroChuaGiai: [...new Set([...get().presetTrace.macroChuaGiai, ...macroChuaGiai])],
            },
          });
        }

        const output = kq.flatMap((gd) =>
          gd.ketQua
            .filter((t) => t.chay && t.output.trim() !== '')
            .map((t) => ({ taskId: t.taskId, text: t.output })),
        );
        const logHienTai = get().log;
        const vanHienTai = get().state;
        const ghiLore =
          logHienTai === null || vanHienTai?.world.branchId !== s.world.branchId
            ? { soEntry: 0, loi: [] }
            : apDichGhiLorebook(s, logHienTai, preset, output);
        if (ghiLore.loi.length > 0) set({ loi: [...get().loi, ...ghiLore.loi].slice(-200) });

        return {
          soCall,
          vet: kq.flatMap((gd) =>
            gd.ketQua.map((t) => ({
              giaiDoan: gd.giaiDoan,
              taskId: t.taskId,
              chay: t.chay,
              lyDo: t.lyDoKhongChay,
              soCall: t.soCall,
              soKyTuRa: t.output.length,
              thatBai: t.thatBai.length,
            })),
          ),
          output,
          soEntryLorebook: ghiLore.soEntry,
        };
      },
    };
  };

  const khoiTao = async (
    hoSo: PlayerProfile,
    danhTinh: CreatorIdentity | null,
    cua: CuaVao,
    motCau: string,
  ): Promise<void> => {
    if (!doiCong()) return;

    /*
     * Lưu ván đang chơi TRƯỚC khi ghi đè — sửa lỗi "bắt đầu ván mới = mất ván cũ".
     *
     * `khoiTao()` sắp thay thế `state` và `log` bằng thế giới hư vô mới. Nếu
     * ván hiện tại chưa từng xuống đĩa hoặc có thay đổi từ lần lưu cuối, nó sẽ
     * mất vĩnh viễn. `await` ở đây là cố ý: ván cũ phải xuống đĩa TRƯỚC khi
     * state bị ghi đè — fire-and-forget sẽ tạo race với `set({ state })` bên
     * dưới và người chơi sẽ mất ván y hệt khi `luuVan()` đọc state mới thay
     * vì state cũ.
     */
    if (get().state && coIndexedDb()) {
      await get().luuVan();
    }

    const ct = KhoiTaoWorldSchema.parse({
      cua,
      seed: SEED_MAC_DINH,
      worldId: 'w1',
      branchId: 'br_goc',
      motCau,
    });
    /**
     * [BB] ADR-0055 — mở ra HƯ VÔ.
     *
     * Không luật, không khái niệm, không thần, không người, không nơi. Tất cả
     * những thứ ấy chỉ tồn tại sau khi một lượt chơi tạo ra chúng, và lúc đó
     * chúng truy được về đúng lượt đã sinh ra chúng (`provenance`, 59.1).
     */
    const { world, events } = moTheGioiTrong(ct);
    const state = taoState(world);
    const log = taoEventLog();
    const r = apDungChuoi(state, events, log);
    if (!r.ok) {
      set({ loi: [...r.errors] });
      return;
    }

    const evLuat = eventGieoLuatNen(state);
    if (evLuat) apDungEvent(state, evLuat, log);

    boAnhChupTruocKe();
    set({
      state,
      log,
      hoSo,
      danhTinh,
      scene: [],
      loiKeDangStream: '',
      loi: [],
      projects: [],
      choXacNhan: null,
      banTin: null,
      patchBiTuChoi: [],
      rerollDuoc: false,
      cauLuotTruoc: null,
    });
    damBaoLorebookSuTheGioi(state, log);
    dongBo();

    // Lorebook được chọn ở Sảnh phải có mặt và được bật trước lời kể đầu tiên.
    // Chúng vẫn được nhập qua đúng Event như thao tác trong ván, không ghi thẳng
    // vào WorldState và không làm các ván cũ chịu ảnh hưởng.
    await useThuVienLorebook.getState().napTuDia();
    for (const muc of useThuVienLorebook.getState().muc.filter((x) => x.chonChoVanMoi)) {
      const ok = await get().nhapLorebookTuChuoi(muc.noiDung, muc.ten);
      if (!ok) continue;
      const lb = [...(get().state?.lorebooks.values() ?? [])].find((x) => x.ten === muc.ten && !x.bat);
      if (lb) get().batLorebook(lb.id, true);
    }

    // Preset được chọn ở Sảnh phải tác động ngay lời kể đầu tiên của ván mới.
    // Chỉ activation được tạo theo nhánh; thư viện và lựa chọn vẫn thuộc máy.
    await usePreset.getState().napTuDia(state.world.branchId);
    await usePreset.getState().datTangHienTai(state.world.playerState.mode);
    const chonPreset = usePreset.getState().chonChoVanMoi;
    const packIds = new Set(Object.values(chonPreset).flat());
    for (const packId of packIds) {
      const viewModes = VIEW_MODES.filter((tang) => chonPreset[tang].includes(packId));
      await usePreset.getState().bat(packId, state.world.id, state.world.tick, viewModes);
    }

    // Không nhịp nền ở lượt khai thiên: thế giới chưa có gì để một năm trôi qua.
    await keLuot(
      motCau.trim(),
      motCau.trim() === ''
        ? ['Chưa có gì tồn tại. Không đất, không luật, không tên gọi nào.']
        : [
            'Chưa có gì tồn tại ngoài điều người chơi vừa nói ra.',
            `Tiền đề người chơi đặt: ${motCau.trim()}`,
          ],
      { nhipNen: false },
    );
  };

  return {
    state: null,
    log: null,
    view: null,
    hoSo: null,
    danhTinh: null,
    persona: null,
    scene: [],
    goiY: [],
    projects: [],
    loi: [],
    choXacNhan: null,
    stateHash: '',
    banTin: null,
    patchBiTuChoi: [],
    vetVeSinh: [],
    dangKe: false,
    loiKeDangStream: '',
    dangCapNhatBien: false,
    luaChon: [],
    luotChuaKe: null,
    rerollDuoc: false,
    cauLuotTruoc: null,
    danhSachVan: [],
    dangLuu: false,
    tickDaLuu: null,
    baoCaoDienHoa: null,
    dangDienHoa: false,
    dangMoPhongHauTruong: false,
    tienDoDienHoa: null,
    tuDienHoa: CauHinhTuDienHoaSchema.parse({}),
    vetDuongOng: [],
    ongKinh: ongKinhMoi(0),
    viChieu: '',
    vangMat: hanNgachVangMat([]),
    truyHoiCuoi: null,
    vetCatToken: [],
    presetTrace: { packDaDung: [], moduleBiBo: [], lyDoBiBo: {}, macroChuaGiai: [], issues: [] },
    danhGiaTruyHoi: null,
    dangDanhGia: false,

    async batDau({ hoSo, danhTinh, cua, motCau }) {
      await khoiTao(hoSo, danhTinh, cua, motCau);
    },

    async batDauNhanh(displayName, cua, motCau) {
      const hs = { ...hoSoToiThieu('pf_local', 0), displayName: displayName.trim() || 'Người Chơi' };
      await khoiTao(hs, null, cua, motCau);
    },

    // [BB] 78.5 — `Bỏ qua` tạo hồ sơ tối thiểu HỢP LỆ và không chặn chơi.
    // Nó vẫn phải qua cổng AI: bỏ qua phần khai báo không bỏ qua được người kể.
    async batDauBoQua() {
      await khoiTao(hoSoToiThieu('pf_local', 0), null, 'hu_vo', '');
    },

    suaHoSo(hoSo, danhTinh) {
      set({ hoSo, danhTinh });
      // Chỉ dựng lại persona chiếu. `dongBo()` không sinh Event và không chạm
      // `stateHash` — đó chính là điều cổng "chỉnh hồ sơ không làm World đổi âm
      // thầm" đang đòi.
      dongBo();
    },

    async chonHienDien(draft) {
      if (!doiCong()) return null;
      const s = get().state;
      const log = get().log;
      const view = get().view;
      if (!s || !log || !view) return null;

      const r = eventHienDien(StartingPresenceDraftSchema.parse(draft), view, s);
      if (!r.ok) {
        set({ loi: [...r.errors] });
        return null;
      }
      for (const ev of r.value.events) {
        const ok = apDungEvent(s, ev, log);
        if (!ok.ok) {
          set({ loi: [...ok.errors] });
          return null;
        }
      }
      dongBo();
      await keLuot(
        '',
        [
          r.value.chuTheId
            ? 'Người chơi vừa hiện diện trong thế giới với thân phận mới.'
            : 'Người chơi hiện diện như Sáng Thế Thần: không thân xác, không vị trí.',
          ...r.value.diff.engineQuyet,
          // Chọn hiện diện là bước dựng nhân vật, chưa phải một lượt chơi.
        ],
        { nhipNen: false },
      );
      return r.value.diff;
    },

    async chuyenTang(mode, chuTheId) {
      /*
       * Chuyển tầng là hành động XEM, không phải hành động chơi — nó không làm
       * thời gian trôi và không cần AI kể lại. Vì vậy:
       *
       * 1. Sang `sang_the` KHÔNG qua `doiCong()`: người chơi luôn có quyền lùi
       *    về góc nhìn toàn năng, kể cả khi AI chết hay có lượt chưa kể.
       * 2. Sang `than`/`pham_nhan` vẫn cần thế giới hợp lệ nhưng KHÔNG gọi
       *    `keLuot()`: chuyển tầng không phải một lượt, và nếu `keLuot` hỏng
       *    thì `luotChuaKe` sẽ khoá người chơi lại — một cái bẫy không lối
       *    thoát vì chính hành động sửa chữa (chuyển tầng) cũng bị chặn.
       *
       * Thay vào đó, dùng `themDong` để ghi một dòng hệ thống — không cần AI.
       */
      const s = get().state;
      const log = get().log;
      if (!s || !log) return;

      // Sang tầng khác sang_the vẫn cần thế giới hợp lệ nhưng không chặn bằng
      // doiCong(): doiCong() chặn khi luotChuaKe, mà chuyển tầng không sinh
      // lượt mới nên không nên bị chặn bởi luotChuaKe.

      // [BB] Giới hạn Phase 6 đã đóng: chủ thể do bộ chọn quyết, không còn là
      // "entity `deity` đầu tiên trong view". Bấm "Thần" mà rơi vào Phàm Nhân là
      // lỗi cũ của chỗ này.
      const chon = chuTheId ?? chuTheMacDinhCho(s, mode);
      if (mode !== 'sang_the' && chon === null) {
        set({
          loi: [
            ...get().loi,
            loi(
              'intent',
              'KHONG_CO_CHU_THE',
              mode === 'than'
                ? 'Chưa có vị thần nào bạn nhập được. Hãy tạo một vị thần trước khi đổi sang tầng Thần.'
                : 'Chưa có con người nào bạn nhập được ở tầng Phàm Nhân.',
              { recoverable: true },
            ),
          ],
        });
        return;
      }

      const ev = eventChuyenTang(s, mode, chon, 'người chơi đổi góc nhìn', log);
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...ok.errors] });
        return;
      }
      dongBo();
      await usePreset.getState().datTangHienTai(mode);
      const ten = chon ? (get().view?.entities.get(chon)?.ten ?? chon) : null;
      // Ghi dòng hệ thống thay vì gọi keLuot — chuyển tầng không phải một lượt.
      themDong(
        'he_thong',
        ten === null
          ? 'Góc nhìn vừa đổi lên tầng Sáng Thế: cùng một thế giới, khác thứ nhìn thấy được.'
          : `Góc nhìn vừa đổi sang ${ten}.`,
      );
    },

    async capNhatBienNgay() {
      if (get().dangCapNhatBien || get().dangKe) return;
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      const view = get().view;
      if (!s || !log || !view) return;

      const dienBien = get()
        .scene.filter((d) => d.loai === 'nguoi_choi' || d.loai === 'ket_qua')
        .slice(-30)
        .map((d) => `${d.loai === 'nguoi_choi' ? '[Người chơi]' : '[Lời kể]'} ${d.noiDungGoc ?? d.noiDung}`)
        .join('\n');
      if (dienBien.trim() === '') {
        themDong('he_thong', 'Chưa có diễn biến nào để AI rà soát và cập nhật.');
        return;
      }

      set({ dangCapNhatBien: true });
      try {
        const truocThan = [...s.entities.values()].filter(
          (e) => e.kind === 'deity' && e.tickDiet === null,
        ).length;
        const prompt = bienSoanPromptCapNhat({
          view,
          loiKe: dienBien,
          ketQuaEngine: [
            'Đây là lần rà soát thủ công; không có hành động mới và thời gian không trôi.',
            'Chỉ đồng bộ những gì diễn biến gần đây đã xác lập rõ nhưng trạng thái hiện tại còn thiếu.',
          ],
          idHopLe: [...s.entities.keys()],
          tyLeToken: TY_LE_TOKEN,
          thuCong: true,
        });
        // Khi Updater riêng đang tắt, nút vẫn dùng model Tường Thuật đã nối làm
        // đường dự phòng. Output vẫn bị bóc tách và kiểm transaction như thường.
        const goi = await useAi.getState().capNhatBien(prompt, true);
        if (goi === null || !goi.ok) {
          const thongDiep = goi === null ? 'Chưa có model nào dùng được để cập nhật.' : goi.thongDiep;
          set({
            loi: [
              ...get().loi,
              loi('ai', goi === null ? 'CAP_NHAT_CHUA_CAU_HINH' : goi.ma, `Cập nhật biến: ${thongDiep}`, {
                recoverable: true,
              }),
            ],
          });
          themDong('he_thong', `Cập nhật biến chưa hoàn tất: ${thongDiep}`);
          return;
        }

        demCapNhatThuCong++;
        const evId = `ev_cap_nhat_thu_cong_${s.world.branchId}_${s.world.tick}_${demCapNhatThuCong}`;
        const kq = bocTach(goi.vanBan, {
          eventId: evId,
          idHopLe: new Set(s.entities.keys()),
          branchId: s.world.branchId,
        });
        set({ patchBiTuChoi: kq.biTuChoi });

        if (!kq.coKhoiCapNhat) {
          set({
            loi: [
              ...get().loi,
              loi(
                'ai',
                'CAP_NHAT_THIEU_KHOI',
                'AI không trả về khối <CapNhat>; trạng thái chưa bị thay đổi.',
                { recoverable: true },
              ),
            ],
          });
          themDong('he_thong', 'AI đã trả lời nhưng không có khối cập nhật hợp lệ. Hãy bấm cập nhật lại.');
          return;
        }

        let soPatchDaAp = 0;
        if (kq.patches.length > 0) {
          const ev = taoEvent({
            id: evId,
            branchId: s.world.branchId,
            tick: s.world.tick,
            loai: 'cap_nhat_bien_thu_cong',
            actorIds: s.world.playerState.chuTheId ? [s.world.playerState.chuTheId] : [],
            targetIds: [],
            causeEventIds: [],
            locationId: null,
            patches: [...kq.patches],
            visibility: 'engine',
            source: 'ai_validated',
            payload: { soPatch: kq.patches.length, soTuChoi: kq.biTuChoi.length },
          });
          const ap = apDungEvent(s, ev, log);
          if (!ap.ok) {
            set({ loi: [...get().loi, ...ap.errors] });
          } else {
            soPatchDaAp = kq.patches.length;
          }
        }
        if (kq.bienPack.length > 0) {
          const bc = await usePreset.getState().apBienPack(kq.bienPack, s.world.tick);
          if (bc.soBiBo > 0) themDong('he_thong', bc.vi);
        }

        // Entity mới cũng phải được gieo các mặt nền giống entity sinh ở một
        // lượt kể bình thường; nếu không một nơi mới có thể đứng hình mãi mãi.
        if (soPatchDaAp > 0) {
          const evNen = eventGieoNen(s, `:capnhat${demCapNhatThuCong}`);
          if (evNen) {
            const apNen = apDungEvent(s, evNen, log);
            if (!apNen.ok) set({ loi: [...get().loi, ...apNen.errors] });
          }
        }

        dongBo();

        const soTrucDatTen = datTenCacTrucDaDuNen(s);

        const sauThan = [...s.entities.values()].filter(
          (e) => e.kind === 'deity' && e.tickDiet === null,
        ).length;
        const phanThan = sauThan > truocThan ? ` · thêm ${sauThan - truocThan} vị thần có thể nhập` : '';
        const phanTruc = soTrucDatTen > 0 ? ` · đặt tên ${soTrucDatTen} trục Luật Nền` : '';
        const phanTuChoi = kq.biTuChoi.length > 0 ? ` · bỏ ${kq.biTuChoi.length} đề nghị không hợp lệ` : '';
        themDong(
          'he_thong',
          soPatchDaAp === 0 && soTrucDatTen === 0
            ? `AI đã rà soát: không thấy thay đổi trạng thái hợp lệ nào còn thiếu${phanTuChoi}.`
            : `Đã cập nhật ${soPatchDaAp} thay đổi${phanTruc}${phanThan}${phanTuChoi}.`,
        );
        capNhatLoreTrongState(s, log, 'Kỳ vọng được đối chiếu sau lần cập nhật biến thủ công.');
        dongBo();
        await get().luuVan();
      } finally {
        set({ dangCapNhatBien: false });
      }
    },

    async gui(cau) {
      if (cau.trim() === '') return;
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      const view = get().view;
      if (!s || !log || !view) return;

      /*
       * Mốc lùi cho đường "sửa câu rồi kể lại" — xem `AnhChupTruocLuot`.
       *
       * Chụp ở đây, TRƯỚC `themDong` và trước `parseIntent`: đây là khoảnh khắc
       * cuối cùng mà thế giới còn chưa nghe thấy câu này. Chậm một dòng thôi là
       * dòng của người chơi đã vào khung kể, và sửa câu sẽ để lại câu cũ nằm đó.
       */
      anhChupTruocLuot = {
        state: saoChepNong(s),
        soEvent: log.tatCa().length,
        scene: get().scene,
        soCanhDaKe: canhDaKe.length,
        demLuotNhipNen: demLuotTuNhipNen,
        cau,
        demIntent,
      };
      luotNayTuCauGoTay = true;

      // Xóa lựa chọn cũ — lượt mới, choices cũ không còn ý nghĩa.
      set({ luaChon: [] });
      themDong('nguoi_choi', cau);
      void usePreset.getState().phatSuKien(TAVERN_EVENTS.MESSAGE_SENT, get().scene.length - 1);
      void usePreset.getState().phatSuKien(TAVERN_EVENTS.USER_MESSAGE_RENDERED, get().scene.length - 1);
      demIntent++;
      const intent = parseIntent(cau, {
        id: `it_${demIntent}`,
        branchId: s.world.branchId,
        sceneId: null,
        actorId: s.world.playerState.chuTheId ?? 'sang_the',
        mode: s.world.playerState.mode,
        view,
      });

      const r = giaiQuyet({
        view,
        intent,
        triThuc: [],
        tuning: TUNING_MAC_DINH,
        seed: s.world.seed,
        tick: s.world.tick,
      });

      // [BB] Hành động không thể hoàn tác phải hỏi TRƯỚC khi áp Event.
      if (r.plan.requiresConfirmation && r.events.length > 0) {
        set({ choXacNhan: { plan: r.plan, cau } });
        themDong('he_thong', 'Việc này không thể hoàn tác. Bạn chắc chứ?');
        return;
      }

      for (const ev of r.events) {
        const ok = apDungEvent(s, ev, log);
        if (!ok.ok) set({ loi: [...ok.errors] });
      }
      if (r.project) set({ projects: [...get().projects, r.project] });
      dongBo();
      await keLuot(cau, [r.outcome.loiKe]);
    },

    async xacNhan(dongY) {
      const cho = get().choXacNhan;
      set({ choXacNhan: null });
      if (!cho) return;
      if (!dongY) {
        /*
         * Người chơi rút lời: lượt không xảy ra, nên ảnh chụp `gui()` vừa lấy
         * phải chết theo. Giữ nó lại thì một lượt trôi nhịp sau đó sẽ thừa kế
         * mốc lùi của một câu chưa bao giờ được thực hiện, và "sửa rồi kể lại"
         * sẽ nuốt mất nhịp ấy.
         */
        anhChupTruocLuot = null;
        luotNayTuCauGoTay = false;
        themDong('he_thong', 'Bạn dừng lại.');
        return;
      }
      if (!doiCong()) return;
      // Lượt này vẫn là lượt của câu ấy — hộp xác nhận chỉ chen vào giữa.
      luotNayTuCauGoTay = anhChupTruocLuot !== null;
      const s = get().state;
      const log = get().log;
      const view = get().view;
      if (!s || !log || !view) return;

      demIntent++;
      const intent = parseIntent(cho.cau, {
        id: `it_${demIntent}`,
        branchId: s.world.branchId,
        sceneId: null,
        actorId: s.world.playerState.chuTheId ?? 'sang_the',
        mode: s.world.playerState.mode,
        view,
      });
      const r = giaiQuyet({
        view,
        intent,
        triThuc: [],
        tuning: TUNING_MAC_DINH,
        seed: s.world.seed,
        tick: s.world.tick,
      });
      for (const ev of r.events) apDungEvent(s, ev, log);
      if (r.project) set({ projects: [...get().projects, r.project] });
      dongBo();
      await keLuot(cho.cau, [r.outcome.loiKe]);
    },

    async tick(soLan = 1) {
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      if (!s || !log) return;

      const tickDau = s.world.tick;
      const suKien: UngVienSuKienTick[] = [];

      for (let i = 0; i < soLan; i++) {
        // Mười hai tiến trình nền của 71.2 chạy ở đây — đây là lý do NPC không
        // đứng yên giữa hai lượt nói. Chúng KHÔNG gọi LLM: engine giữ sổ (71.5).
        const r = motTick(s, { tuning: TUNING_MAC_DINH, tienTrinhNen: chayTienTrinhNen });
        for (const ev of r.events) {
          const ok = apDungEvent(s, ev, log);
          if (!ok.ok) {
            set({ loi: [...ok.errors] });
            return;
          }
        }
        suKien.push(...r.suKien);
      }

      // Bản tin chỉ chứa thứ CHỦ THỂ NÀY biết được — event xa không tự chen vào.
      const bt = banTinCho(
        s,
        suKien,
        s.world.playerState.mode,
        s.world.playerState.chuTheId,
        tickDau,
        s.world.tick,
      );
      set({ banTin: bt });
      dongBo();

      /*
       * `tick(n)` đẩy thế giới ĐÚNG n nhịp. Không nhịp nền chồng lên: người chơi
       * gọi hàm này chính là để tự quyết thời gian trôi bao nhiêu, và cộng lén
       * thêm một năm vào đó là phá hợp đồng của chính nút họ vừa bấm.
       */
      await keLuot(
        '',
        [`Thời gian trôi tới nhịp ${s.world.tick}.`, ...bt.muc.slice(0, 6).map((m) => m.loiKe)],
        { nhipNen: false },
      );
    },

    lamMoi() {
      dongBo();
    },

    /**
     * Sửa văn bản HIỂN THỊ của một dòng trong khung kể.
     *
     * Đây là cửa duy nhất mà script preset (`setChatMessages` của Tavern Helper)
     * chạm được tới khung kể. Nó đổi thứ người chơi ĐỌC, không đổi `noiDungGoc` —
     * bản gốc mới là thứ đi vào lịch sử prompt của lượt sau, nên một script định
     * dạng lại lời kể không âm thầm viết lại trí nhớ của thế giới.
     */
    datNoiDungDong(chiSo, noiDung) {
      const scene = get().scene;
      if (chiSo < 0 || chiSo >= scene.length) return;
      const cu = scene[chiSo] as DongScene;
      if (cu.noiDung === noiDung) return;
      const moi = [...scene];
      moi[chiSo] = {
        ...cu,
        noiDung,
        noiDungGoc: cu.noiDungGoc ?? cu.noiDung,
        dinhDang: /<[a-z][\s\S]*>/i.test(noiDung) ? 'html' : cu.dinhDang,
      };
      set({ scene: moi });
    },

    /**
     * Kể lại nhịp đang treo — cửa DUY NHẤT thoát khỏi trạng thái `luotChuaKe`.
     *
     * Không đi qua `doiCong()` vì `doiCong()` chặn chính trạng thái này; nó hỏi
     * thẳng cổng AI. Thất bại thì `luotChuaKe` giữ nguyên và người chơi thử lại
     * lần nữa — engine không chạy thêm nhịp nào trong lúc chờ.
     */
    async keLai() {
      const treo = get().luotChuaKe;
      if (treo === null || get().dangKe) return;
      const cong = useAi.getState().cong();
      if (!cong.choPhepChoi) {
        set({
          loi: [
            ...get().loi,
            loi('ai', `CONG_AI_${cong.trangThai.toUpperCase()}`, cong.lyDo.join(' '), { recoverable: true }),
          ],
        });
        return;
      }
      // Kể lại một nhịp treo không đổi câu — đường sửa câu phải sống sót qua nó.
      luotNayTuCauGoTay = anhChupTruocLuot !== null;
      await keLuot(treo.cau, treo.ketQuaEngine, { nhipNen: treo.nhipNen });
    },

    /**
     * Reroll — kể lại lượt vừa rồi bằng một câu chữ khác.
     *
     * ── Nó lùi những gì ──
     *
     * `WorldState` về bản chụp trước lời kể; `log` cắt về đúng số Event lúc ấy
     * (log append-only nên cắt đuôi là phép lùi duy nhất đúng); khung kể bỏ lại
     * lời kể cũ nhưng GIỮ dòng của người chơi, vì câu họ gõ không phải thứ đang
     * bị kể lại. Hai bộ đếm ngoài state — cảnh đã kể (28.6) và nhịp tới lượt
     * nhịp nền — cũng lùi, nếu không thì mỗi lần reroll lại đẩy thế giới thêm
     * một bước mà không ai thấy.
     *
     * ── Nó KHÔNG lùi được gì ──
     *
     * Thống kê cổng AI, cache rerank, và biến của preset đã ghi ở lượt cũ. Ba
     * thứ ấy nằm ngoài `WorldState` và không có phép hoàn tác; chúng cũng không
     * quyết định điều gì xảy ra trong thế giới, nên để chúng cộng dồn là cái giá
     * đúng để trả. Nói ra ở đây thay vì để người sau tự phát hiện.
     *
     * Không đi qua `doiCong()`: `luotChuaKe` khác `null` nghĩa là lượt trước
     * KHÔNG kể xong, và lúc ấy `rerollDuoc` đã là `false` rồi — cửa ra của tình
     * huống đó là `keLai()`, không phải chỗ này.
     */
    async reroll() {
      if (anhChupTruocKe === null || !sanSangReroll()) return;
      const anh = anhChupTruocKe;

      luiVe(anh);
      /*
       * Kể lại KHÔNG đổi câu, nên ảnh chụp "trước lượt" vẫn đúng cho lượt mới —
       * và phải nói ra điều đó, vì `keLuot()` mặc định coi mọi lượt là lượt
       * không có câu gõ tay. Thiếu dòng này thì reroll một lần là mất luôn
       * đường sửa câu, đúng lúc người chơi hay cần nó nhất.
       */
      luotNayTuCauGoTay = anhChupTruocLuot !== null;
      await keLuot(anh.cau, anh.ketQuaEngine, { nhipNen: anh.nhipNen });
    },

    /**
     * Sửa câu rồi kể lại — biến thể "xa hơn một bước" của `reroll()`.
     *
     * Lùi về `anhChupTruocLuot` (trước lúc engine nghe câu cũ) rồi gọi thẳng
     * `gui()` với câu mới. Gọi `gui()` chứ không dựng lại đường riêng: mọi thứ
     * một câu người chơi phải đi qua — `doiCong()`, `parseIntent`, `giaiQuyet`,
     * hộp xác nhận hành động không hoàn tác — đều nằm trong đó, và một đường
     * song song sẽ bỏ sót đúng những chỗ ấy.
     *
     * Hệ quả cố ý: câu mới có thể dẫn tới một hành động cần xác nhận, và lúc
     * ấy hộp xác nhận hiện lên đúng như khi gõ câu ấy lần đầu.
     */
    async rerollVoiCau(cauMoi) {
      const anh = anhChupTruocLuot;
      if (anh === null || cauMoi.trim() === '' || !sanSangReroll()) return;

      luiVe(anh);
      /*
       * Lùi bộ đếm ý đồ — xem `AnhChupTruocLuot.demIntent`. Chỉ đường này lùi
       * nó: reroll thường không chạy lại engine nên không tiêu một id nào, và
       * lùi bộ đếm ở đó sẽ cho lượt sau mượn lại một id vừa dùng.
       *
       * Id `it_${demIntent}` cũ không đụng ai: Event mang nó đã bị `luiVe()`
       * cắt khỏi log rồi.
       */
      demIntent = anh.demIntent;
      await get().gui(cauMoi);
    },

    // ── ván chơi ──

    async napDanhSachVan() {
      if (!coIndexedDb()) {
        set({ danhSachVan: [] });
        return;
      }
      try {
        set({ danhSachVan: await danhSachSave(layDb()) });
      } catch {
        // Đọc danh sách hỏng thì hiện danh sách rỗng — màn chính vẫn cho "Bắt đầu".
        set({ danhSachVan: [] });
      }
    },

    /**
     * Ghi ván xuống đĩa.
     *
     * Nuốt lỗi có chủ ý: trình duyệt riêng tư không có IndexedDB, và một lần ghi
     * hỏng không được phép giết lượt kể đang chạy. Thứ KHÔNG nuốt là hậu quả —
     * `tickDaLuu` chỉ nhích khi ghi thật sự xong, nên màn chính không bao giờ nói
     * "đã lưu" về một thứ chưa xuống đĩa.
     */
    async luuVan(ten) {
      if (!coIndexedDb()) return;
      /*
       * XẾP HÀNG, không bỏ lượt — sửa một lỗi race thật tìm được ở E2E.
       *
       * Bản cũ trả về ngay khi `dangLuu === true`, tưởng là "đã có người ghi
       * rồi". Nhưng người ấy ghi ảnh chụp của một nhịp CŨ HƠN, và lần ghi bị bỏ
       * là lần duy nhất biết về nhịp mới. Hậu quả: `roiVan()` await xong, tưởng
       * đã lưu, rồi mở lại ra một thế giới lùi một nhịp — và hash không khớp.
       *
       * Nối vào cuối hàng đợi thì lần ghi cuối cùng luôn là lần ghi mới nhất, và
       * `await luuVan()` thật sự có nghĩa là "đã xuống đĩa".
       */
      hangDoiLuu = hangDoiLuu.then(async () => {
        const s = get().state;
        const log = get().log;
        if (!s || !log) return;
        set({ dangLuu: true });
        try {
          const db = layDb();
          await ghiVan(
            db,
            new KhoDexie(db),
            s,
            [...log.tatCa()],
            ten ?? nhanMacDinh(s.world.tick, s.world.playerState.mode),
          );
          // Scene phải hoàn tất trước khi `luuVan()` trả về. Nếu chỉ khởi chạy rồi
          // bỏ đó, `roiVan()` có thể xóa bộ nhớ và mở lại ván trước khi IndexedDB
          // kịp ghi lịch sử chat.
          await luuScene(s.world.id, s.world.branchId, get().scene);
          set({ tickDaLuu: s.world.tick });
        } catch (e) {
          set({
            loi: [
              ...get().loi,
              loi('persistence', 'LUU_HONG', `Không ghi được ván xuống đĩa: ${String(e)}`, {
                recoverable: true,
              }),
            ],
          });
        } finally {
          set({ dangLuu: false });
        }
      });
      await hangDoiLuu;
    },

    /**
     * Mở lại một ván đã lưu.
     *
     * [BB] Nạp là một RANH GIỚI, nên `napState()` chạy invariant toàn bộ và
     * `eventGieoNen()` chạy lại để vùng nào thiếu nền được bù. Không kể một lượt
     * ở đây: mở save không phải một sự kiện của thế giới, và bắt model viết một
     * đoạn văn mỗi lần người chơi mở lại ván là cách nhanh nhất để "tiếp tục"
     * thành "bắt đầu lại".
     */
    async tiepTucVan(branchId) {
      if (!coIndexedDb()) return false;

      /*
       * Lưu ván đang chơi TRƯỚC khi nạp ván khác — cùng lẽ với `khoiTao()`.
       *
       * Kịch bản: đang chơi ván A, mở Bản Đồ Nhánh, bấm "Tiếp tục" ván B.
       * Không lưu ở đây thì mọi thay đổi từ lần autosave cuối bị mất.
       */
      if (get().state) await get().luuVan();

      const db = layDb();
      const kho = new KhoDexie(db);
      const r = await napState(kho, branchId);
      if (!r.ok) {
        set({ loi: [...get().loi, ...r.errors] });
        return false;
      }
      const state = r.value;
      const log = taoEventLog([...(await kho.docEvents(branchId))]);
      // Ván khác thì đếm lại từ đầu — xem chú thích của `demLuotTuNhipNen`.
      demLuotTuNhipNen = 0;

      const evNen = eventGieoNen(state, ':nap');
      if (evNen) apDungEvent(state, evNen, log);
      const evLuat = eventGieoLuatNen(state);
      if (evLuat) apDungEvent(state, evLuat, log);

      // ── Phục hồi scene (lịch sử chat) từ đĩa ──
      let sceneCu: DongScene[] = [];
      // Hàng cũ không có trường này; `parse({})` cho lại mặc định, không phải lỗi.
      let tuDienHoaCu: CauHinhTuDienHoa = CauHinhTuDienHoaSchema.parse({});
      try {
        const ui = await docUiState(db, state.world.id, state.world.branchId);
        const tdh = CauHinhTuDienHoaSchema.safeParse(ui?.tuDienHoa ?? {});
        if (tdh.success) tuDienHoaCu = tdh.data;
        if (ui?.scene && Array.isArray(ui.scene)) {
          sceneCu = (ui.scene as DongScene[])
            .filter((d) => d && typeof d.noiDung === 'string' && typeof d.loai === 'string')
            .map((d) =>
              d.loai === 'ket_qua'
                ? {
                    ...d,
                    noiDung: catSuyLuanNoiBo(d.noiDung),
                    noiDungGoc:
                      typeof d.noiDungGoc === 'string' ? catSuyLuanNoiBo(d.noiDungGoc) : d.noiDungGoc,
                  }
                : d,
            )
            .filter((d) => d.noiDung.trim() !== '');
        }
      } catch {
        // Không đọc được scene cũ thì bắt đầu trắng — phiền, không chết.
      }

      boAnhChupTruocKe();
      set({
        state,
        log,
        hoSo: get().hoSo ?? hoSoToiThieu('pf_local', 0),
        scene: sceneCu,
        tuDienHoa: tuDienHoaCu,
        loi: [],
        projects: [],
        choXacNhan: null,
        banTin: null,
        patchBiTuChoi: [],
        luotChuaKe: null,
        rerollDuoc: false,
        cauLuotTruoc: null,
        tickDaLuu: state.world.tick,
      });
      damBaoLorebookSuTheGioi(state, log);
      dongBo();
      return true;
    },

    async xoaVanTheoId(branchId) {
      if (!coIndexedDb()) return;
      const r = await xoaVan(layDb(), branchId);
      if (!r.ok) {
        set({ loi: [...get().loi, ...r.errors] });
        return;
      }
      await get().napDanhSachVan();
    },

    async doiTenVanTheoId(branchId, ten) {
      if (!coIndexedDb()) return;
      await doiTenVan(layDb(), branchId, ten);
      await get().napDanhSachVan();
    },

    /**
     * Xuất ván ra chuỗi JSON.
     *
     * [BB] 38 — `xuatSave()` cắt secret và chặn hồ sơ riêng tư khi chưa opt-in.
     * Ở đây không có phép kiểm nào thêm, và cũng không được có: thêm một đường
     * xuất thứ hai là thêm một chỗ để quên mất hàng rào ấy.
     */
    async xuatVanRaChuoi(kemHoSoRiengTu) {
      const s = get().state;
      const log = get().log;
      if (!s || !log || !coIndexedDb()) return null;
      const r = await xuatSave(layDb(), s, [...log.tatCa()], {
        kemHoSoRiengTu,
        appVersion: PHIEN_BAN_APP,
      });
      if (!r.ok) {
        set({ loi: [...get().loi, ...r.errors] });
        return null;
      }
      return JSON.stringify(r.value, null, 2);
    },

    async xuatVanTheoIdRaChuoi(branchId, kemHoSoRiengTu) {
      if (!coIndexedDb()) return null;
      const db = layDb();
      const kho = new KhoDexie(db);
      const r = await napState(kho, branchId);
      if (!r.ok) {
        set({ loi: [...get().loi, ...r.errors] });
        return null;
      }
      const ev = await kho.docEvents(branchId);
      const x = await xuatSave(db, r.value, ev, { kemHoSoRiengTu, appVersion: PHIEN_BAN_APP });
      if (!x.ok) {
        set({ loi: [...get().loi, ...x.errors] });
        return null;
      }
      return JSON.stringify(x.value, null, 2);
    },

    async nhapVanTuChuoi(noiDung) {
      /*
       * Lưu ván đang chơi TRƯỚC khi nhập file — cùng lẽ với `khoiTao()`.
       *
       * Kịch bản: đang chơi ván A, nhập file save từ máy khác. Không lưu ở
       * đây thì ván A mất thay đổi chưa lưu, và lỗi ấy đặc biệt khó phát hiện
       * vì nhập file không đi qua `roiVan()` — người chơi thấy ván mới hiện ra
       * và không nghĩ rằng ván cũ vừa bị xóa khỏi bộ nhớ.
       */
      if (get().state && coIndexedDb()) await get().luuVan();

      let tho: unknown;
      try {
        tho = JSON.parse(noiDung);
      } catch {
        set({
          loi: [
            ...get().loi,
            loi('persistence', 'FILE_KHONG_PHAI_JSON', 'File này không phải JSON đọc được.', {
              recoverable: false,
            }),
          ],
        });
        return false;
      }

      const r = nhapSave(tho);
      if (!r.ok) {
        set({ loi: [...get().loi, ...r.errors] });
        return false;
      }

      const { state, events, canhBao } = r.value;
      const log = taoEventLog([...events]);

      const evNen = eventGieoNen(state, ':nhap');
      if (evNen) apDungEvent(state, evNen, log);
      const evLuat = eventGieoLuatNen(state);
      if (evLuat) apDungEvent(state, evLuat, log);

      boAnhChupTruocKe();
      set({
        state,
        log,
        hoSo: get().hoSo ?? hoSoToiThieu('pf_local', 0),
        scene: [],
        loi: [...canhBao],
        projects: [],
        choXacNhan: null,
        banTin: null,
        patchBiTuChoi: [],
        luotChuaKe: null,
        rerollDuoc: false,
        cauLuotTruoc: null,
        tickDaLuu: null,
      });
      damBaoLorebookSuTheGioi(state, log);
      dongBo();
      // Nhập từ file rồi mới ghi xuống đĩa: trước lúc ấy nó chưa phải một ván
      // trên máy này, và nó không được xuất hiện trong danh sách "Tiếp tục".
      await get().luuVan();
      await get().napDanhSachVan();
      return true;
    },

    // ── lorebook ──

    async nhapLorebookTuChuoi(noiDung, ten) {
      const s = get().state;
      const log = get().log;
      if (!s || !log) return false;

      let tho: unknown;
      try {
        tho = JSON.parse(noiDung);
      } catch {
        set({
          loi: [
            ...get().loi,
            loi('preset', 'LORE_KHONG_PHAI_JSON', 'File lorebook không phải JSON đọc được.', {
              recoverable: false,
            }),
          ],
        });
        return false;
      }

      // Không tái dùng id của sách đã xóa: bia mộ copy-on-write của id cũ sẽ
      // che bản nhập mới sau khi mở lại ván. Event log là append-only nên là
      // nguồn đáng tin để biết id nào từng tồn tại, kể cả sách không còn trong Map.
      let soThuTu = s.lorebooks.size + 1;
      let id = `lore_${s.world.tick}_${soThuTu}`;
      while (s.lorebooks.has(id) || log.theoId(`ev_nhap_lore_${id}`) !== undefined) {
        soThuTu++;
        id = `lore_${s.world.tick}_${soThuTu}`;
      }
      const kq = nhapLorebook({
        goc: tho,
        id,
        ten: ten.trim() === '' ? id : ten.trim(),
        nguon: 'nguoi_dung',
        branchId: s.world.branchId,
        tyLeToken: TY_LE_TOKEN,
      });

      const nang = kq.issues.filter((i) => i.severity === 'error');
      if (!kq.ok || kq.lorebook === null) {
        set({
          loi: [...get().loi, ...nang.map((i) => loi('preset', i.code, i.message, { recoverable: false }))],
        });
        return false;
      }

      const evId = `ev_nhap_lore_${id}`;
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'nhap_lorebook',
        actorIds: [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches: [
          {
            op: 'link',
            target: { table: 'lorebooks', id, path: '' },
            value: { ...kq.lorebook, branchId: s.world.branchId },
            sourceEventId: evId,
          },
          // Sách nhập vào mặc định TẮT. Kỳ vọng chỉ được tạo ở `batLorebook()`;
          // nếu tạo tại đây thì công tắc tắt chỉ đổi nhãn mà nguồn vẫn tác động.
        ],
        visibility: 'engine',
        source: 'player',
        payload: { id, dinhDang: kq.dinhDang, soEntry: kq.lorebook.entries.length },
      });

      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...get().loi, ...ok.errors] });
        return false;
      }
      // Cảnh báo mức thấp vẫn phải hiện — nhập được không có nghĩa là nhập sạch.
      set({
        loi: [
          ...get().loi,
          ...kq.issues
            .filter((i) => i.severity !== 'error')
            .map((i) => loi('preset', i.code, i.message, { severity: 'warning', recoverable: true })),
        ],
      });
      dongBo();
      void get().luuVan();
      return true;
    },

    batLorebook(id, bat) {
      const s = get().state;
      const log = get().log;
      const lb = s?.lorebooks.get(id);
      if (!s || !log || !lb || lb.bat === bat) return;
      demLore++;
      const evId = `ev_lore_bat_${id}_${s.world.tick}_${bat ? 1 : 0}_${demLore}`;
      const lbMoi = { ...lb, bat, tickBat: bat ? s.world.tick : null };
      const patches: PatchOp[] = [
        {
          op: 'flag',
          target: { table: 'lorebooks', id, path: 'bat' },
          value: bat,
          sourceEventId: evId,
        },
        {
          op: 'set',
          target: { table: 'lorebooks', id, path: 'tickBat' },
          value: lbMoi.tickBat,
          sourceEventId: evId,
        },
      ];

      if (bat) {
        for (const kv of trichKyVong(lbMoi, s.world.branchId)) {
          if (s.loreExpectations.has(kv.id)) continue;
          patches.push({
            op: 'link',
            target: { table: 'loreExpectations', id: kv.id, path: '' },
            value: kv,
            sourceEventId: evId,
          });
        }
        for (const entity of vatChatHoaLorebook(lbMoi, s, evId)) {
          if (s.entities.has(entity.id)) continue;
          patches.push({
            op: 'link',
            target: { table: 'entities', id: entity.id, path: '' },
            value: entity,
            sourceEventId: evId,
          });
        }
      } else {
        // Tắt là ngừng lực hút: bỏ các kỳ vọng đang theo dõi. Entity đã xuất hiện
        // là Sử nên được giữ lại, không xóa ngược lịch sử của thế giới.
        for (const kv of s.loreExpectations.values()) {
          if (kv.lorebookId !== id) continue;
          patches.push({
            op: 'unlink',
            target: { table: 'loreExpectations', id: kv.id, path: '' },
            sourceEventId: evId,
          });
        }
      }
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: bat ? 'bat_lorebook' : 'tat_lorebook',
        actorIds: [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches,
        visibility: 'engine',
        source: 'player',
        payload: { id, bat },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...get().loi, ...ok.errors] });
        return;
      }
      if (bat) capNhatLoreTrongState(s, log, 'Lorebook vừa được bật và các neo đã được hiện thực hóa.');
      dongBo();
      void get().luuVan();
    },

    suaLorebookEntry(lorebookId, entryId, banSua) {
      const s = get().state;
      const log = get().log;
      const lb = s?.lorebooks.get(lorebookId);
      const viTri = lb?.entries.findIndex((e) => e.id === entryId) ?? -1;
      const cu = viTri >= 0 ? lb?.entries[viTri] : undefined;
      if (!s || !log || !lb || !cu) return false;

      const ten = banSua.ten.trim();
      const noiDung = banSua.noiDung.trim();
      const keys = [...new Set(banSua.keys.map((k) => k.trim()).filter((k) => k !== ''))];
      if (ten === '' || noiDung === '') {
        set({
          loi: [
            ...get().loi,
            loi('schema', 'ENTRY_RONG', 'Tên và nội dung entry không được để trống.', { recoverable: true }),
          ].slice(-200),
        });
        return false;
      }
      if (banSua.lop === 'sau' && keys.length === 0) {
        set({
          loi: [
            ...get().loi,
            loi('schema', 'KEYS_RONG', 'Entry theo từ khóa phải có ít nhất một từ khóa.', {
              recoverable: true,
            }),
          ].slice(-200),
        });
        return false;
      }
      const loiEjs = kiemEjs(noiDung);
      if (loiEjs !== null) {
        set({
          loi: [
            ...get().loi,
            loi('schema', 'EJS_HONG', `${loiEjs.thongDiep} ở dòng ${loiEjs.dong}.`, { recoverable: true }),
          ].slice(-200),
        });
        return false;
      }

      const khoaMoi = khoaNoiDungLore(noiDung);
      const trung = [...s.lorebooks.values()].flatMap((sach) =>
        sach.entries
          .filter(
            (e) =>
              !(sach.id === lorebookId && e.id === entryId) &&
              e.trangThai !== 'da_xoa' &&
              khoaMoi !== '' &&
              khoaNoiDungLore(e.noiDung) === khoaMoi,
          )
          .map((e) => ({ sach, entry: e })),
      )[0];
      if (trung !== undefined) {
        set({
          loi: [
            ...get().loi,
            loi(
              'schema',
              'TRUNG_NOI_DUNG_LOREBOOK',
              `Nội dung đã có ở entry "${trung.entry.ten}" của "${trung.sach.ten}"; không tạo thêm một bản trùng.`,
              { recoverable: true },
            ),
          ].slice(-200),
        });
        return false;
      }

      const dai = DAI_ORDER[daiCuaNguon(lb.nguon)];
      const orderTho = Number.isFinite(banSua.order) ? Math.round(banSua.order) : cu.order;
      const order = Math.max(dai.tu, Math.min(dai.den, orderTho));
      const moi = LorebookEntrySchema.safeParse({
        ...cu,
        ten,
        keys,
        noiDung,
        lop: banSua.lop,
        order,
        uocLuongToken: uocLuong(noiDung, TY_LE_TOKEN),
        lichSu: [
          ...cu.lichSu.slice(-19),
          {
            tick: s.world.tick,
            boiAi: 'nguoi_choi',
            op: 'sua',
            truoc: cu.noiDung,
            sau: noiDung,
            lyDo: 'người chơi sửa trong trình soạn Lorebook',
          },
        ],
      });
      if (!moi.success) {
        set({
          loi: [
            ...get().loi,
            loi('schema', 'ENTRY_KHONG_HOP_LE', moi.error.issues[0]?.message ?? 'Entry không hợp lệ.', {
              recoverable: true,
            }),
          ].slice(-200),
        });
        return false;
      }

      const entries = [...lb.entries];
      entries[viTri] = moi.data;
      demLore++;
      const evId = `ev_sua_lore_entry_${lorebookId}_${s.world.tick}_${demLore}`;
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'sua_lorebook_entry',
        actorIds: [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches: [
          {
            op: 'set',
            target: { table: 'lorebooks', id: lorebookId, path: 'entries' },
            value: entries,
            sourceEventId: evId,
          },
        ],
        visibility: 'engine',
        source: 'player',
        payload: { lorebookId, entryId },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...get().loi, ...ok.errors].slice(-200) });
        return false;
      }
      dongBo();
      void get().luuVan();
      return true;
    },

    boCheLorebookEntry(lorebookId, entryId) {
      const s = get().state;
      const log = get().log;
      const lb = s?.lorebooks.get(lorebookId);
      const viTri = lb?.entries.findIndex((e) => e.id === entryId) ?? -1;
      const cu = viTri >= 0 ? lb?.entries[viTri] : undefined;
      if (!s || !log || !lb || !cu || cu.trangThai !== 'bi_che') return;
      const entries = [...lb.entries];
      entries[viTri] = boChe(cu, s.world.tick);
      demLore++;
      const evId = `ev_bo_che_lore_${lorebookId}_${s.world.tick}_${demLore}`;
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'bo_che_lorebook_entry',
        actorIds: [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches: [
          {
            op: 'set',
            target: { table: 'lorebooks', id: lorebookId, path: 'entries' },
            value: entries,
            sourceEventId: evId,
          },
        ],
        visibility: 'engine',
        source: 'player',
        payload: { lorebookId, entryId },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...get().loi, ...ok.errors].slice(-200) });
        return;
      }
      dongBo();
      void get().luuVan();
    },

    async xoaLorebook(id) {
      const s = get().state;
      const log = get().log;
      const lb = s?.lorebooks.get(id);
      if (!s || !log || !lb) return;
      if (lb.nguon === 'tu_sinh') {
        set({
          loi: [
            ...get().loi,
            loi(
              'schema',
              'KHONG_XOA_SO_THE_GIOI',
              'Sử tự sinh là sổ theo nhánh nên không xóa; bạn có thể tắt sách để nó không đi vào lời kể.',
              { recoverable: true },
            ),
          ].slice(-200),
        });
        return;
      }
      demLore++;
      const evId = `ev_lore_xoa_${id}_${s.world.tick}_${demLore}`;
      const patches: PatchOp[] = [];
      const kyVongIds: string[] = [];

      // Kỳ vọng chưa thành không được tiếp tục tác động sau khi xóa sách. Các
      // entity đã xuất hiện là lịch sử của thế giới nên được giữ nguyên.
      for (const kv of s.loreExpectations.values()) {
        if (kv.lorebookId !== id) continue;
        kyVongIds.push(kv.id);
        patches.push({
          op: 'unlink',
          target: { table: 'loreExpectations', id: kv.id, path: '' },
          sourceEventId: evId,
        });
      }
      patches.push({
        op: 'unlink',
        target: { table: 'lorebooks', id, path: '' },
        sourceEventId: evId,
      });

      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'xoa_lorebook',
        actorIds: [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches,
        visibility: 'engine',
        source: 'player',
        payload: { id, ten: lb.ten },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...get().loi, ...ok.errors] });
        return;
      }
      dongBo();

      // `ghiState()` chỉ upsert các dòng còn tồn tại, nên tự nó không thể xóa
      // bản ghi cũ khỏi IndexedDB. Ghi bia mộ copy-on-write để sách không sống
      // lại khi mở ván hoặc khi nhánh con từng kế thừa sách từ nhánh cha.
      if (coIndexedDb()) {
        try {
          // Một lần lưu khởi chạy ngay sau thao tác nhập/bật có thể vẫn đang giữ
          // ảnh cũ chứa sách. Đợi nó xong trước khi xóa thật để ảnh cũ không ghi
          // sách sống lại sau transaction xóa.
          await hangDoiLuu;
          const db = layDb();
          const kho = new KhoNhanh(db);
          await db.transaction('rw', db.lorebooks, db.loreExpectations, db.tombstones, async () => {
            for (const kyVongId of kyVongIds) {
              await kho.xoa('loreExpectations', s.world.branchId, kyVongId, s.world.tick);
            }
            await kho.xoa('lorebooks', s.world.branchId, id, s.world.tick);
          });
        } catch (error) {
          set({
            loi: [
              ...get().loi,
              loi(
                'persistence',
                'XOA_LOREBOOK_KHONG_LUU_DUOC',
                `Đã xóa trong phiên nhưng chưa ghi được xuống đĩa: ${String(error)}`,
                {
                  recoverable: true,
                },
              ),
            ],
          });
          return;
        }
      }
      await get().luuVan();
    },

    // ── vật lý thế giới ──

    datTenTrucNen(truc, khaiNiemNenId) {
      const s = get().state;
      const log = get().log;
      if (!s || !log) return ['Chưa mở ván nào.'];

      const ds = [...s.substrateLaws.values()];
      const r = datTenTruc({
        ds,
        truc,
        khaiNiemNenId,
        nguoiDatTenId: s.world.playerState.chuTheId,
        tick: s.world.tick,
        state: s,
      });
      if (!r.ok) return r.loi;

      const evId = `ev_dat_ten_truc_${truc}_${s.world.tick}`;
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'dat_ten_luat_nen',
        actorIds: s.world.playerState.chuTheId ? [s.world.playerState.chuTheId] : [],
        targetIds: [khaiNiemNenId],
        causeEventIds: [],
        locationId: null,
        // `patchGhiBanGhi` chứ không `link` trần: bảy dòng luật nền được gieo
        // ngay khi mở ván, nên một `link` lên id đã có bị `apPatch` từ chối với
        // `LINK_TRUNG` — và đặt tên trục im lặng không làm gì.
        patches: patchGhiBanGhi(s, 'substrateLaws', r.luatNen.id, r.luatNen, evId),
        visibility: 'engine',
        source: 'player',
        payload: { truc, khaiNiemNenId, soKeHo: r.keHo.length },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...get().loi, ...ok.errors] });
        return ok.errors.map((e) => e.message);
      }
      // [BB] 44.4 — dòng biên niên sử vào khung kể, không vào một cái log riêng.
      themDong('he_thong', r.dongBienNien);
      dongBo();
      void get().luuVan();
      return [];
    },

    quetCoCheNgay() {
      const s = get().state;
      const log = get().log;
      if (!s || !log) return [];

      const chuyen = quetCoChe({
        state: s,
        luatNen: [...s.substrateLaws.values()],
        hienTai: [...s.coChe.values()],
        branchId: s.world.branchId,
        tick: s.world.tick,
      });
      const doi = chuyen.filter((c) => c.vuaBat || c.vuaTat);

      demQuetCoChe++;
      const evId = `ev_quet_co_che_${s.world.tick}_${demQuetCoChe}`;
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'quet_co_che',
        actorIds: [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        // Cùng lẽ với `datTenTrucNen`: lần quét thứ hai trở đi gặp bản ghi đã có.
        patches: chuyen.flatMap((c) => patchGhiBanGhi(s, 'coChe', c.row.id, c.row, evId)),
        visibility: 'engine',
        source: 'engine',
        payload: { soDoi: doi.length },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...get().loi, ...ok.errors] });
        return [];
      }
      for (const c of doi) themDong('he_thong', c.congBo);
      dongBo();
      void get().luuVan();
      return doi.map((c) => c.congBo);
    },

    // ── nhánh ──

    async tachNhanh(ten, lyDo) {
      const s = get().state;
      if (!s || !coIndexedDb()) return false;

      // Nhánh cha phải xuống đĩa TRƯỚC: nhánh con đọc bằng cách lần lên cha, và
      // lần lên một nhánh chưa tồn tại thì ra thế giới rỗng.
      await get().luuVan();

      const db = layDb();
      const kho = new KhoDexie(db);
      /*
       * Id nhánh dựng từ NHỊP và số nhánh đã có, không từ đồng hồ máy.
       *
       * Cùng lẽ với luật bất biến #7: id đi vào `branchId` của mọi bản ghi, nên
       * một id có giờ trong đó sẽ làm hai lần tách cùng một ván trên hai máy cho
       * hai cây nhánh không so được với nhau.
       */
      const idMoi = `br_${s.world.branchId}_t${s.world.tick}_${(await db.branches.count()) + 1}`;
      try {
        await kho.kho.fork(
          BranchSchema.parse({
            id: idMoi,
            worldId: s.world.id,
            gocId: s.world.branchId,
            tickTao: s.world.tick,
            ten: ten.trim(),
            lyDoTach: lyDo.trim(),
            dangChay: true,
          }),
        );
      } catch (e) {
        set({
          loi: [
            ...get().loi,
            loi('persistence', 'TACH_NHANH_HONG', `Không tách được nhánh: ${String(e)}`, {
              recoverable: true,
            }),
          ],
        });
        return false;
      }

      const ok = await get().tiepTucVan(idMoi);
      if (!ok) return false;

      /*
       * Ghi NHẸ ngay sau khi nhảy sang.
       *
       * `danhSachSave()` liệt kê từ bảng `worlds`; nhánh con chưa có hàng world
       * thì nó tách xong rồi biến mất khỏi cả Bản Đồ Nhánh lẫn Sảnh Vào. Ghi
       * nhẹ chứ không `luuVan()`: fork không được sao chép entity — đó là toàn
       * bộ điểm của copy-on-write.
       */
      const s2 = get().state;
      if (s2) await ghiVanNhe(db, s2, ten);
      await get().napDanhSachVan();
      return true;
    },

    // ── Diễn Hóa ──

    dungDienHoa() {
      if (!get().dangDienHoa) return;
      yeuCauDungDienHoa = true;
    },

    doDoDangTheGioi() {
      const s = get().state;
      return s ? doDoDang(s) : { diem: 100, thieu: ['chưa mở ván nào'] };
    },

    conLuotToiNhipNen() {
      const cfg = get().tuDienHoa;
      const s = get().state;
      const dangKeTruyen = get().ongKinh.dangChieu.loai === 'mach';
      const moiBaoNhieuLuot = s
        ? tinhNhipNenHieuLuc(s, cfg, dangKeTruyen).moiBaoNhieuLuot
        : cfg.moiBaoNhieuLuot;
      return Math.max(0, moiBaoNhieuLuot - demLuotTuNhipNen);
    },

    khoTuHienTai() {
      const s = get().state;
      const kho = s ? docKho(s.world.tuVung) : [];
      return {
        thongKe: thongKeKho(kho, TRAN_TU_VUNG),
        // Chữ học sau cùng đứng đầu — người chơi muốn biết thế giới VỪA học gì.
        moiNhat: [...kho]
          .filter((x) => x.nguon !== 'goc')
          .sort((a, b) => (b.tickThem !== a.tickThem ? b.tickThem - a.tickThem : a.tu < b.tu ? -1 : 1))
          .slice(0, 12),
      };
    },

    soHauTruongHienTai() {
      const s = get().state;
      const so = s ? docSo(s.world.hauTruong) : [];
      return { thongKe: thongKeSo(so), sapKe: chuaKe(so, 8) };
    },

    datTuDienHoa(banVa) {
      const cu = get().tuDienHoa;
      const moi = CauHinhTuDienHoaSchema.parse({
        ...cu,
        ...banVa,
        workflow: { ...cu.workflow, ...(banVa.workflow ?? {}) },
      });
      set({ tuDienHoa: moi });
      void ghiTuDienHoaXuongDia(moi);
    },

    async chayDienHoa(thayDoi) {
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      if (!s || !log || get().dangDienHoa) return;

      const { presetId, ...phanCauHinh } = thayDoi;
      const cauHinh = CauHinhDienHoaSchema.parse({ ...phanCauHinh });

      /**
       * Từ chối TRƯỚC khi chạy, không treo giữa chừng — [BB] 71.6.
       *
       * Đây là nửa còn lại của phép sửa lỗi treo: gộp tick làm một trăm năm rẻ
       * đi bốn trăm lần, còn trần này chặn đúng cấu hình mà ngay cả sau khi gộp
       * vẫn quá sức một tab trình duyệt. Câu từ chối nói rõ phải đổi gì.
       */
      const uoc = uocLuongDienHoa(cauHinh);
      if (uoc.quaTran) {
        set({
          loi: [
            ...get().loi,
            loi('invariant', 'DIEN_HOA_VUOT_NGAN_SACH', uoc.loiTuChoi, { recoverable: true }),
          ],
        });
        themDong('he_thong', uoc.loiTuChoi);
        return;
      }

      const tickDau = s.world.tick;
      const truoc = { reality: s.metrics.realityIntegrity, songDong: s.metrics.doSongDong };
      const anhChup = hashState(s);
      const suKienLon: { tick: number; moTa: string; loai: string; entityIds: string[] }[] = [];
      const viecBoiDap: { tick: number; tho: string; moTa: string }[] = [];
      /**
       * Việc của thợ thứ bảy, giữ RIÊNG khỏi `viecBoiDap`.
       *
       * Không phải để phân loại: để chúng không bị cắt. Báo cáo giữ tối đa bốn
       * mươi mục (47.6), và hai mươi lượt × ba việc engine đã lấp kín bốn mươi
       * chỗ ấy trước khi thợ AI kịp nói một câu — nghĩa là đúng phần người chơi
       * vừa trả tiền để có sẽ là phần duy nhất họ không được đọc.
       */
      const viecBoiDapAi: { tick: number; tho: string; moTa: string }[] = [];
      /**
       * Lỗi gom lại, ghi MỘT lần ở cuối.
       *
       * Bản cũ `set({ loi: [...get().loi, ...] })` ngay trong vòng lặp tick. Với
       * một lô patch hỏng lặp lại, mảng lỗi bị sao chép lại mỗi tick và store
       * phát tín hiệu render mỗi tick — hai thứ cộng lại đủ để một lượt tua
       * "chậm" biến thành một tab chết.
       */
      const loiGom: StructuredError[] = [];

      /**
       * Đường ống workflow — [BB] 50.9, món nợ Phase 12 ghi ra.
       *
       * `null` nghĩa là lượt tua này chỉ có engine chạy, và đó là trạng thái HỢP
       * LỆ chứ không phải thiếu sót: điểm cuối Diễn Hóa tắt được (46.1), và
       * preset `trong` là một lựa chọn thật.
       */
      const duongOng = chuanBiDuongOng(presetId ?? '');
      const vet: TrangThaiGame['vetDuongOng'][number][] = [];
      let soCallWorkflow = 0;

      yeuCauDungDienHoa = false;
      const nhuong = taoBoNhuong();
      set({
        dangDienHoa: true,
        vetDuongOng: [],
        tienDoDienHoa: { luot: 0, tongLuot: cauHinh.soLuot, tick: tickDau, viecDaLam: 0 },
      });

      let luot = 0;
      let soCallBoiDapAi = 0;
      let lyDoDung = `đã chạy đủ ${cauHinh.soLuot} lượt`;
      try {
        for (; luot < cauHinh.soLuot; luot++) {
          if (yeuCauDungDienHoa) {
            lyDoDung = 'bạn đã bấm dừng.';
            break;
          }

          const r = tuaMotLuot(s, log, cauHinh.nhipMoiLuot, `dh${luot}`);
          suKienLon.push(...r.suKienLon);
          loiGom.push(...r.loi);
          if (!r.ok) {
            /*
             * KHÔNG `luot++` ở đây, khác với nhánh dừng-thông-minh bên dưới.
             * `tuaThoiGian` thất bại nghĩa là cả lượt đã bị hoàn tác, nên lượt
             * này chưa từng xảy ra — đếm nó vào `soLuotChay` sẽ làm báo cáo khai
             * một năm mà thế giới không hề sống qua.
             */
            lyDoDung = 'engine từ chối một thay đổi — xem Tự Chẩn Đoán.';
            break;
          }

          if (cauHinh.boiDap.bat && cauHinh.boiDap.hanMucMoiLuot > 0) {
            const bd = chayBoiDap(s, log, {
              hanMuc: cauHinh.boiDap.hanMucMoiLuot,
              tho: cauHinh.boiDap.tho,
              cauHinh,
              hauTo: `dh${luot}`,
            });
            loiGom.push(...bd.loi);
            for (const v of bd.viec) viecBoiDap.push({ tick: s.world.tick, tho: v.tho, moTa: v.moTa });
          }

          const kyVongVuaLech = capNhatLoreTrongState(
            s,
            log,
            'Kỳ vọng được đối chiếu sau một lượt Diễn Hóa.',
          );

          /*
           * Đường ống chạy SAU khi engine đã tua xong lượt này.
           *
           * Thứ tự ấy là [BB] 71.5 viết thành mã: engine quyết điều gì xảy ra và
           * giữ mọi con số; workflow đọc kết quả rồi viết thêm phần chỉ model làm
           * được. Chạy ngược lại sẽ để model quyết trước và engine phải chiều theo.
           */
          if (duongOng !== null) {
            const kq = await duongOng.chay(s, luot + 1);
            soCallWorkflow += kq.soCall;
            vet.push(...kq.vet);
            set({ vetDuongOng: [...vet] });

            /*
             * Output đường ống vào Sổ Hậu Trường, y như ở nhịp nền.
             *
             * Trước đây nó chỉ đi vào ngữ cảnh của giai đoạn sau rồi biến mất —
             * người chơi trả tiền cho bảy tác vụ mỗi lượt tua và không đọc được
             * một dòng nào trong đó. Sổ là chỗ chúng chờ tới lượt được kể.
             */
            const ghi: GhiChuHauTruong[] = [];
            for (const o of kq.output) ghi.push(...bocGhiChu(o.taskId, o.text, s.world.tick, 4));
            if (ghi.length > 0) {
              loiGom.push(
                ...apSoHauTruong(s, log, themGhiChu(docSo(s.world.hauTruong), ghi), {
                  goc: `ev_hau_truong_dh_${s.world.branchId}_${s.world.tick}`,
                  loai: 'mo_phong_hau_truong',
                  payload: { soGhiChu: ghi.length, soCall: kq.soCall },
                }),
              );
            }
          }

          set({
            tienDoDienHoa: {
              luot: luot + 1,
              tongLuot: cauHinh.soLuot,
              tick: s.world.tick,
              viecDaLam: viecBoiDap.length,
            },
          });

          /**
           * [BB] 47.3 — Smart Stop. Dừng vì có chuyện đáng xem, không vì hết lượt.
           *
           * Kiểm SAU mỗi lượt chứ không sau mỗi tick: một cao trào kéo dài cả
           * mùa, và dừng ngay tick đầu tiên nó chớm lên sẽ đưa người chơi vào
           * giữa một cảnh chưa có gì để nhìn.
           */
          const dung = kiemDieuKienDung({
            state: s,
            cauHinh,
            luotDaChay: luot + 1,
            soCall: soCallWorkflow,
            tokenDaDung: 0,
            kyVongVuaLech,
            realityTruoc: truoc.reality,
          });
          if (dung !== null) {
            lyDoDung = dung.moTa;
            suKienLon.push({
              tick: s.world.tick,
              moTa: dung.moTa,
              loai: dung.loai,
              entityIds: [...dung.entityIds],
            });
            luot++;
            break;
          }

          // Trả luồng lại cho trình duyệt trước khi vào lượt kế.
          await nhuong();
        }

        /*
         * Thợ thứ bảy chạy SAU khi engine đã tua xong — [BB] `boiDapAi.ts`.
         *
         * Sau, chứ không phải xen giữa, vì nó nhìn thế giới ĐÃ đi hết quãng
         * đường này rồi mới quyết lấp chỗ nào: một trăm năm tua có thể tự sinh
         * ra mười vùng mới, và hỏi model về chỗ trống ở lượt thứ ba là hỏi về
         * một thế giới không còn tồn tại lúc câu trả lời về tới.
         *
         * Vẫn nằm trong `try`: một endpoint hỏng ở đây không được phép cướp mất
         * báo cáo của cả trăm năm vừa tua.
         */
        if (cauHinh.boiDap.bat && cauHinh.boiDap.soCallAi > 0 && !yeuCauDungDienHoa) {
          const ai = await chayBoiDapAi(s, log, {
            cauHinh,
            soCall: cauHinh.boiDap.soCallAi,
            hauTo: `dh${tickDau}`,
          });
          soCallBoiDapAi = ai.soCall;
          loiGom.push(...ai.loi);
          for (const v of ai.viec) {
            viecBoiDapAi.push({ tick: s.world.tick, tho: v.tho, moTa: v.moTa });
          }
        }
      } catch (e) {
        /*
         * Bắt ở đây chứ không để nó bay ra ngoài: người gọi là `void chay(...)`
         * của một `onClick`, nên một ngoại lệ thoát khỏi đây sẽ thành unhandled
         * rejection — cờ `dangDienHoa` gỡ được nhờ `finally`, nhưng người chơi
         * chỉ thấy nút sáng lại mà không ai nói gì đã xảy ra.
         */
        lyDoDung = `Diễn Hóa dừng vì một lỗi không lường trước: ${String(e)}`;
        loiGom.push(loi('transaction', 'DIEN_HOA_NGOAI_LE', lyDoDung, { recoverable: true }));
      } finally {
        yeuCauDungDienHoa = false;
        set({ dangDienHoa: false, tienDoDienHoa: null });
      }

      if (loiGom.length > 0) set({ loi: [...get().loi, ...loiGom].slice(-200) });

      /*
       * Đuôi hàm cũng phải nằm trong một cái lưới — [BB] đây là chỗ "văng game".
       *
       * `try` ở trên chỉ bọc vòng lặp tua, nên bốn việc dưới đây chạy trần: dựng
       * `EvolutionLog`, viết báo cáo, đồng bộ, và gọi Narrator kể lại. Người gọi
       * là `void chay(...)` của một `onClick`, nên một ngoại lệ ở đây thành
       * unhandled rejection — và người chơi mất cả báo cáo lẫn lời kể của một
       * trăm năm mà không ai nói vì sao. Chú thích của `catch` bên trên đã hứa
       * "không để nó bay ra ngoài"; lời hứa ấy dừng đúng ở dấu ngoặc `finally`.
       *
       * Bọc từng phần thay vì bọc cả khối: báo cáo hỏng thì lượt kể vẫn phải
       * chạy, vì thế giới ĐÃ đi tiếp và ADR-0028 nói người chơi phải được đọc
       * nó. Gộp làm một sẽ đánh đổi lời kể lấy một lỗi ở khâu trình bày.
       */
      try {
        const evLog = EvolutionLogSchema.parse({
          id: `dh_${s.world.branchId}_${tickDau}`,
          branchId: s.world.branchId,
          tickBatDau: tickDau,
          tickKetThuc: s.world.tick,
          soLuotChay: luot,
          // Một call cho lượt kể cuối, cộng đường ống và thợ Bồi Đắp AI.
          soCall: 1 + soCallWorkflow + soCallBoiDapAi,
          tokenDaDung: 0,
          lyDoDung,
          // [BB] 47.6 giữ tối đa số mục đáng xem; báo cáo dài quá thì không ai đọc.
          suKienLon: suKienLon.slice(0, 40),
          // Chừa chỗ cứng cho thợ AI: xem chú thích của `viecBoiDapAi`.
          viecBoiDap: [...viecBoiDap.slice(0, 30), ...viecBoiDapAi.slice(0, 10)],
          anhChup,
        });
        set({
          baoCaoDienHoa: baoCaoDienHoa(evLog, truoc, {
            reality: s.metrics.realityIntegrity,
            songDong: s.metrics.doSongDong,
          }),
        });
      } catch (e) {
        set({
          loi: [
            ...get().loi,
            loi('invariant', 'DIEN_HOA_BAO_CAO_HONG', `Không dựng được Báo Cáo Diễn Hóa: ${String(e)}`, {
              recoverable: true,
            }),
          ].slice(-200),
        });
      }

      try {
        dongBo();
        // Không nhịp nền: lượt này VỪA LÀ nhịp nền, chỉ dài hơn rất nhiều.
        await keLuot(
          '',
          [
            `Thời gian trôi từ nhịp ${tickDau} tới nhịp ${s.world.tick}.`,
            `Diễn Hóa dừng vì: ${lyDoDung}`,
            ...suKienLon.slice(0, 6).map((x) => x.moTa),
            ...viecBoiDap.slice(0, 3).map((x) => x.moTa),
            ...viecBoiDapAi.slice(0, 3).map((x) => x.moTa),
          ],
          { nhipNen: false },
        );
      } catch (e) {
        /*
         * Lượt kể hỏng KHÔNG được nuốt trong im lặng: thế giới đã đi tiếp, nên
         * đây đúng là tình huống ADR-0056 dựng `luotChuaKe` để bắt. `keLuot()`
         * tự đặt cờ ấy khi model từ chối; nó ném ra thì cờ chưa kịp đặt, và ta
         * đặt hộ — nếu không, người chơi bấm chơi tiếp và mất trắng đoạn này.
         */
        set({
          luotChuaKe: {
            cau: '',
            ketQuaEngine: [
              `Thời gian trôi từ nhịp ${tickDau} tới nhịp ${s.world.tick}.`,
              `Diễn Hóa dừng vì: ${lyDoDung}`,
            ],
            nhipNen: false,
          },
          loi: [
            ...get().loi,
            loi('ai', 'DIEN_HOA_KE_HONG', `Không kể lại được đoạn vừa tua: ${String(e)}`, {
              recoverable: true,
            }),
          ].slice(-200),
        });
        themDong(
          'he_thong',
          'Thế giới đã tua xong nhưng chưa ai kể lại được. Bấm "Kể lại nhịp này" sau khi nối lại đường tới model.',
        );
      }
    },

    async roiVan() {
      await get().luuVan();
      await get().napDanhSachVan();
      boAnhChupTruocKe();
      set({
        state: null,
        log: null,
        view: null,
        scene: [],
        loi: [],
        projects: [],
        choXacNhan: null,
        banTin: null,
        patchBiTuChoi: [],
        luotChuaKe: null,
        rerollDuoc: false,
        cauLuotTruoc: null,
      });
    },

    /**
     * [BB] 29.1 — chuyển ống kính KHÔNG tốn lượt và KHÔNG tốn thời gian trong
     * game. Không `apDungEvent`, không `motTick`, không `keLuot`: nó chỉ đổi chỗ
     * ta đang nhìn, và lượt kể sau sẽ dùng chỗ mới.
     */
    /**
     * [BB] 77.10 — "metric được lưu, có baseline TRƯỚC khi tối ưu semantic".
     *
     * Vì vậy nút này luôn chạy HAI lượt khi có adapter: một lượt heuristic thuần
     * để lấy baseline, rồi một lượt ở chế độ đang bật. So một mode với chính nó
     * là cách một reranker tệ đi mà vẫn báo "đạt".
     */
    async chayDanhGiaTruyHoi() {
      const s = get().state;
      if (!s || get().dangDanhGia) return;
      set({ dangDanhGia: true });
      try {
        const ai = useAi.getState();
        const chung = {
          tuning: TUNING_MAC_DINH,
          nganSachToken: Math.round(nganSachInput('ke_canh', null) * 0.4),
          tyLeToken: TY_LE_TOKEN,
          dongHo: () => performance.now(),
        };

        const base = await chayBoDanhGia(s, {
          ...chung,
          config: CAU_HINH_HEURISTIC,
          adapter: null,
        });
        const adapter = ai.adapterRerank();
        const kq =
          adapter === null
            ? base
            : await chayBoDanhGia(s, {
                ...chung,
                config: ai.cfg.rerank,
                adapter,
                baseline: base.tongKet,
              });
        set({ danhGiaTruyHoi: kq });
      } finally {
        set({ dangDanhGia: false });
      }
    },

    chiaOngKinh(mucTieu) {
      const s = get().state;
      set({
        ongKinh: datOngKinh(get().ongKinh, mucTieu, s?.world.tick ?? 0),
        viChieu: 'Người chơi tự chĩa ống kính.',
      });
    },

    ungVienChuThe(mode) {
      const s = get().state;
      if (!s) return [];
      return chonChuThe(s, mode);
    },

    // ── tầng Phàm Nhân ──

    soTay() {
      const s = get().state;
      const view = get().view;
      const chuTheId = s?.world.playerState.chuTheId ?? null;
      if (!s || !view || chuTheId === null) return null;

      // [BB] 33.3 / 56.2 — `dungSoTay` chỉ nhận `WorldView`. Tri thức lọc sẵn về
      // đúng người này, nên nó theo định nghĩa là thứ họ biết.
      return dungSoTay({
        view,
        triThuc: [...s.knowledge.values()].filter((r) => r.knowerId === chuTheId),
        viecDangLam: dangODau(s, chuTheId).viec,
        nghiThucVoIch: [],
      });
    },

    async noiVoi(pn) {
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      const toi = s?.world.playerState.chuTheId ?? null;
      if (!s || !log || toi === null) return;

      const evId = `ev_noi_${s.world.tick}_${toi}_${pn.nguoiNgheId}`;
      const r = noiMotCau(
        s,
        { ...pn, nguoiNoiId: toi },
        { eventId: evId, tick: s.world.tick, rng: rngCuaTick(s.world.seed, s.world.tick, `noi:${evId}`) },
      );
      if (!r.ok) {
        set({ loi: [...get().loi, ...r.errors] });
        return;
      }

      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: `doi_thoai_${pn.loai}`,
        actorIds: [toi],
        targetIds: [pn.nguoiNgheId],
        causeEventIds: [],
        locationId: pn.noiId,
        patches: [...r.value.patches],
        // Nói dối và nghe lỏm không phải chuyện công khai.
        visibility: r.value.laNoiDoi || r.value.nguoiNgheLon.length > 0 ? 'gioi_han' : 'cong_khai',
        source: 'player',
        payload: { loai: pn.loai, mucHieu: r.value.mucHieu, factId: r.value.factId },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...ok.errors] });
        return;
      }
      dongBo();
      await keLuot(pn.noiDung, [r.value.loiKe]);
    },

    async xinHocNghe(thayId) {
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      const toi = s?.world.playerState.chuTheId ?? null;
      if (!s || !log || toi === null) return;

      const evId = `ev_xin_hoc_${s.world.tick}_${toi}`;
      const r = xinHoc(s, toi, thayId, {
        eventId: evId,
        tick: s.world.tick,
        rng: rngCuaTick(s.world.seed, s.world.tick, evId),
      });
      if (!r.ok) {
        set({ loi: [...get().loi, ...r.errors] });
        return;
      }
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'nhan_hoc_tro',
        actorIds: [thayId],
        targetIds: [toi],
        causeEventIds: [],
        locationId: null,
        patches: [...r.value.patches],
        visibility: 'cong_khai',
        source: 'player',
        payload: { thayId, troId: toi },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...ok.errors] });
        return;
      }
      dongBo();
      await keLuot('', [r.value.loiKe]);
    },

    async lapNhaMoi(ten) {
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      const toi = s?.world.playerState.chuTheId ?? null;
      if (!s || !log || toi === null) return;

      const noiO = noiOCua(s, toi);
      if (noiO === null) {
        set({
          loi: [
            ...get().loi,
            loi('intent', 'KHONG_CO_NOI_O', 'Ngươi chưa ở đâu cả, nên chưa dựng nhà ở đâu được.', {
              recoverable: true,
            }),
          ],
        });
        return;
      }

      const evId = `ev_lap_ho_${s.world.tick}_${toi}`;
      const r = lapHo(
        s,
        { chuHoId: toi, thanhVien: [], noiOId: noiO, ten },
        { eventId: evId, tick: s.world.tick },
      );
      if (!r.ok) {
        set({ loi: [...get().loi, ...r.errors] });
        return;
      }
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: 'lap_ho',
        actorIds: [toi],
        targetIds: [],
        causeEventIds: [],
        locationId: noiO,
        patches: [...r.value.patches],
        visibility: 'cong_khai',
        source: 'player',
        payload: { hoId: r.value.hoId },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...ok.errors] });
        return;
      }
      dongBo();
      await keLuot('', [r.value.loiKe]);
    },

    duongTiepTuc() {
      const s = get().state;
      const toi = s?.world.playerState.chuTheId ?? null;
      if (!s || toi === null) return [];
      const e = s.entities.get(toi);
      // Chưa chết thì không có gì để chọn — và đó là câu trả lời đúng.
      if (!e || e.tickDiet === null) return [];
      return duongDiTiep(s, toi);
    },

    async diTiep(chon) {
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      if (!s || !log) return;

      const evId = `ev_di_tiep_${s.world.tick}_${chon.duong}`;
      const patches: PatchOp[] = [];
      let loiKe = '';

      if (chon.duong === 'anh_linh') {
        const r = anhLinhHoaThan(s, chon.chuTheMoiId, { eventId: evId, tick: s.world.tick });
        if (!r.ok) {
          set({ loi: [...get().loi, ...r.errors] });
          return;
        }
        patches.push(...r.value.patches);
        loiKe = r.value.loiKe;
      } else {
        loiKe =
          chon.duong === 'ke_thua'
            ? `Đời tiếp tục bằng ${chon.ten} — ${chon.vi}.`
            : `Thế giới đi tiếp, và lần này ta nhìn nó qua mắt ${chon.ten}.`;
      }

      // Đổi chủ thể qua đúng cửa của 21.3 — hóa thần thì lên tầng Thần.
      const modeMoi: ViewMode = chon.duong === 'anh_linh' ? 'than' : 'pham_nhan';
      patches.push(
        {
          op: 'set',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' },
          value: modeMoi,
          sourceEventId: evId,
        },
        {
          op: 'set',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.chuTheId' },
          value: chon.chuTheMoiId,
          sourceEventId: evId,
        },
        {
          op: 'push',
          target: { table: 'worlds', id: 'worlds', path: 'playerState.lichSuChuyenTang' },
          value: {
            tick: s.world.tick,
            tu: s.world.playerState.mode,
            den: modeMoi,
            lyDo: `sau khi chết — đường ${chon.duong}`,
          },
          sourceEventId: evId,
        },
      );

      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: `di_tiep_${chon.duong}`,
        actorIds: [chon.chuTheMoiId],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches,
        visibility: 'cong_khai',
        source: 'player',
        payload: { duong: chon.duong },
      });
      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...ok.errors] });
        return;
      }
      dongBo();
      await keLuot('', [loiKe]);
    },

    loiCauDangCho() {
      const s = get().state;
      if (!s) return [];
      return loiCauCho(s, s.world.playerState.chuTheId, s.world.tick);
    },

    async traLoi(cau, cach) {
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      if (!s || !log) return;

      const evId = `ev_traloi_${s.world.tick}_${cau.id}`;
      const r = traLoiCau(s, cau, cach, { tick: s.world.tick, eventId: evId });
      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: `tra_loi_cau_${cach}`,
        actorIds: s.world.playerState.chuTheId ? [s.world.playerState.chuTheId] : [],
        targetIds: [cau.nguoiCauId],
        causeEventIds: [],
        locationId: cau.nguoiCauId,
        patches: [...r.patches],
        visibility: 'cong_khai',
        source: 'player',
        payload: { prayerId: cau.id, cach },
      });

      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...ok.errors] });
        return;
      }
      dongBo();
      await keLuot('', [`Lời cầu: "${cau.noiDung}".`, r.loiKe]);
    },

    async dapApLuc(tinhHuongId, cach) {
      if (!doiCong()) return;
      const s = get().state;
      const log = get().log;
      const thanId = s?.world.playerState.chuTheId ?? null;
      if (!s || !log || !thanId) return;

      const than = s.entities.get(thanId);
      const bn = than?.aspects['ban_nga'] as DivineIdentity | undefined;
      if (!than || !bn) return;
      const th = bn.pressure.tinhHuongMo.find((x) => x.id === tinhHuongId);
      const idx = bn.pressure.tinhHuongMo.findIndex((x) => x.id === tinhHuongId);
      if (!th || idx < 0) return;

      const evId = `ev_diHoa_${s.world.tick}_${tinhHuongId}`;
      const r = dapDiHoa(than, bn, th.truc as TrucBanTinh, cach, {
        eventId: evId,
        tick: s.world.tick,
        tuning: TUNING_MAC_DINH,
        rng: rngCuaTick(s.world.seed, s.world.tick, `dap:${tinhHuongId}`),
      });

      const ev = taoEvent({
        id: evId,
        branchId: s.world.branchId,
        tick: s.world.tick,
        loai: r.loaiEvent,
        actorIds: [thanId],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches: [
          ...r.patches,
          {
            op: 'set',
            target: {
              table: 'entities',
              id: thanId,
              path: `aspects.ban_nga.pressure.tinhHuongMo.${idx}.daChon`,
            },
            value: cach,
            sourceEventId: evId,
          },
        ],
        visibility: 'cong_khai',
        source: 'player',
        payload: { tinhHuongId, cach, truc: th.truc },
      });

      const ok = apDungEvent(s, ev, log);
      if (!ok.ok) {
        set({ loi: [...ok.errors] });
        return;
      }
      dongBo();
      await keLuot('', [th.moTa, r.loiKe]);
    },
  };
});
