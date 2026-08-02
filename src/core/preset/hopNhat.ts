/**
 * Một đường prompt duy nhất — ADR-0049, Phase 11.
 *
 * ── Chuyện đã sai trước Phase 11 ──
 *
 * Repo có HAI bộ dựng prompt và chúng không bao giờ gặp nhau:
 *
 *   `bienSoanPromptKe()`      sáu tầng của 33.1, đường chơi thật dùng
 *   `bienDichPromptPreset()`  bảy tầng của 63.6, chỉ test dùng
 *
 * Hệ quả là preset nhập vào rồi nằm im: pipeline mười hai bước chạy đúng, hai
 * fixture khớp từng con số, và **không một dòng nào của pack tới được model**.
 * Nhìn từ phía người chơi thì đó là "app đang đi chệch hướng", và họ đúng.
 *
 * ── Cách file này hợp nhất ──
 *
 * ```text
 * bienSoanPromptKe()  →  sáu tầng native
 *   → dungLoiNative() chia chúng thành: lõi hệ thống · slot · lượt này
 *   → bienDichPromptPreset() lắp slot vào marker của pack, xếp module ở tầng 4
 *   → một CompiledPrompt duy nhất
 *   → phẳng hoá về PromptGoi để `goiKe()` gửi đi
 * ```
 *
 * Không pack nào bật thì bước giữa bị bỏ qua và prompt native đi thẳng — [BB]
 * 65.4: *"tắt pack trả prompt native"*, và ở đây điều đó đúng theo nghĩa đen vì
 * đường tắt là **không gọi hàm biên dịch**, không phải là gọi nó với danh sách rỗng.
 *
 * ── Thứ tự quyền vẫn nguyên vẹn ──
 *
 * [BB] 65.3 — tám bậc quyền không đổi. Module ngoài vẫn nằm ở tầng 4, vẫn sau
 * product safety, hợp đồng engine và dữ liệu đã chiếu, và vẫn **trước** khối
 * lượt-này mang hợp đồng `<CapNhat>`. Một pack khai `injection_order: -99999`
 * vẫn không có đường nào ra trước lõi, vì không có nhánh nào ở đây đọc con số ấy.
 */
import type { Scene } from '../contracts/core.js';
import type { ImportIssue } from '../contracts/primitives.js';
import type { PromptGoi } from '../ai/bienSoan.js';
import { bienSoanPromptKe } from '../ai/bienSoan.js';
import type { NguLieuKe } from '../ai/bienSoan.js';
import { uocLuong } from '../ai/nganSach.js';
import { bienDichPromptPreset } from './bienDich.js';
import { dungLoiNative } from './slotNative.js';
import { apActivation } from './kichHoat.js';
import type { CompiledPrompt, NormalizedPresetPack, PresetActivation, PresetPackRow } from './schema.js';
import type { NormalizedGenParams } from '../schema/ai.js';

/** Một pack đang bật: bản ghi thư viện + activation trỏ tới nó. */
export type PackDangBat = Readonly<{
  row: PresetPackRow;
  activation: PresetActivation | null;
}>;

export type NguCanhHopNhat = Readonly<{
  nguLieu: NguLieuKe;
  scene: Scene;
  /** Rỗng nghĩa là chơi bằng prompt native — đường mặc định, luôn hợp lệ. */
  packs: readonly PackDangBat[];
  params: NormalizedGenParams;
  nganSachToken: number;
  tenPersona?: string;
  /** [BB] 78.11 — mô tả persona ĐÃ CHIẾU, không bao giờ là `PlayerProfile`. */
  moTaPersona?: string;
  hoTroPrefill?: boolean;
}>;

export type KetQuaHopNhat = Readonly<{
  prompt: PromptGoi;
  /** `null` khi không pack nào bật — dấu hiệu rõ ràng rằng đây là đường native. */
  compiled: CompiledPrompt | null;
  /** Id pack thật sự đã góp mặt vào prompt này. */
  packDaDung: readonly string[];
  issues: readonly ImportIssue[];
  /** Module bị bỏ và macro chưa giải — vào tab chẩn đoán, không im lặng. */
  moduleBiBo: readonly string[];
  macroChuaGiai: readonly string[];
}>;

/**
 * Gộp nhiều pack thành một pack biên dịch được.
 *
 * Module giữ nguyên namespace `packId` nên id không đụng nhau; thứ tự trong tầng
 * 4 do `lane` rồi `order` quyết, đúng như khi chỉ có một pack. Biến thì gộp theo
 * thứ tự bật: pack sau ghi đè khóa trùng của pack trước, và đó là hành vi người
 * dùng mong đợi khi họ chồng hai pack lên nhau.
 */
function gopPack(packs: readonly PackDangBat[]): NormalizedPresetPack | null {
  const daAp = packs.map((p) => apActivation(p.row, p.activation)).filter((p) => p.modules.length > 0);
  if (daAp.length === 0) return null;
  const dau = daAp[0] as NormalizedPresetPack;
  if (daAp.length === 1) return dau;

  let bien: Record<string, unknown> = {};
  const modules = [];
  const issues: ImportIssue[] = [];
  const transforms: string[] = [];
  for (const p of daAp) {
    bien = { ...bien, ...p.variables };
    modules.push(...p.modules);
    issues.push(...p.issues);
    transforms.push(...p.transforms);
  }

  return {
    ...dau,
    modules,
    variables: bien,
    transforms: [...new Set(transforms)],
    issues,
  };
}

/**
 * Dựng prompt cho một lượt kể — cửa DUY NHẤT mà store được gọi.
 *
 * `bienSoanPromptKe()` vẫn là nơi sáu tầng được dựng, nên mọi bất biến của
 * Phase 8 (ngân sách theo tầng, vết cắt, chunk bị bỏ) tiếp tục đúng dù có pack
 * hay không: pack chỉ đổi cách sáu tầng ấy được XẾP, không đổi chúng là gì.
 */
export function bienSoanLuot(ng: NguCanhHopNhat): KetQuaHopNhat {
  const native = bienSoanPromptKe({ ...ng.nguLieu, nganSachToken: ng.nganSachToken });
  const pack = gopPack(ng.packs);

  if (pack === null) {
    return Object.freeze({
      prompt: native,
      compiled: null,
      packDaDung: Object.freeze([]),
      issues: Object.freeze([]),
      moduleBiBo: Object.freeze([]),
      macroChuaGiai: Object.freeze([]),
    });
  }

  const loi = dungLoiNative(native, {
    canhGanDay: ng.nguLieu.canhGanDay,
    moTaPersona: ng.moTaPersona,
    tenPersona: ng.tenPersona,
  });

  const compiled = bienDichPromptPreset({
    pack,
    pipeline: 'narrator',
    view: ng.nguLieu.view,
    scene: ng.scene,
    budget: { total: ng.nganSachToken, used: 0, remaining: ng.nganSachToken },
    params: ng.params,
    cauNguoiChoi: ng.nguLieu.cauNguoiChoi,
    tenPersona: ng.tenPersona,
    moTaPersona: ng.moTaPersona,
    nguonSlot: loi.slot,
    loiNativeHeThong: loi.loiCoreHeThong,
    loiNativeLuotNay: loi.loiLuotNay,
    tyLeToken: ng.nguLieu.tyLeToken,
    hoTroPrefill: ng.hoTroPrefill,
    turn: ng.nguLieu.view.tick,
  });

  return Object.freeze({
    prompt: phangHoa(native, compiled, ng.nguLieu.tyLeToken),
    compiled,
    packDaDung: Object.freeze([...new Set(ng.packs.map((p) => p.row.packId))]),
    issues: Object.freeze([...compiled.issues]),
    moduleBiBo: Object.freeze([...compiled.omittedModuleIds]),
    macroChuaGiai: Object.freeze([...compiled.unresolvedMacros]),
  });
}

/**
 * Phẳng hoá `CompiledPrompt` về `PromptGoi`.
 *
 * Tầng mạng hiện gửi một `system` và một `user` cho cả ba phương ngữ, nên nhiều
 * message phải gộp lại theo role. Gộp THEO THỨ TỰ đã biên dịch — đó là thứ giữ
 * cho tầng 4 vẫn nằm giữa lõi và lượt hiện tại sau khi phẳng hoá.
 *
 * Message `assistant` KHÔNG bị gộp vào hai khối kia: nó là mồi trả lời, và nhét
 * mồi vào lượt người dùng thì model sẽ đọc nó như một mệnh lệnh chứ không phải
 * như phần đầu câu trả lời của chính nó.
 *
 * `vetCat` và `chunkBiCat` giữ nguyên từ prompt native: chúng là vết của bộ ngân
 * sách tầng, và pack không tạo ra vết cắt mới ở đó — phần bị pack cắt đã nằm
 * trong `compiled.issues` với mã `CAT_VI_NGAN_SACH`.
 */
function phangHoa(native: PromptGoi, compiled: CompiledPrompt, tyLeToken: number): PromptGoi {
  const noi = (role: 'system' | 'user'): string =>
    compiled.messages
      .filter((m) => m.role === role)
      .map((m) => m.content)
      .join('\n\n')
      .trim();

  const heThong = noi('system');
  const nguoiDung = noi('user');
  const moi = compiled.messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content)
    .join('\n')
    .trim();

  return Object.freeze({
    heThong,
    nguoiDung,
    tang: native.tang,
    soKyTu: heThong.length + nguoiDung.length,
    uocToken: uocLuong(`${heThong}${nguoiDung}`, tyLeToken),
    vetCat: native.vetCat,
    chunkBiCat: native.chunkBiCat,
    moiTraLoi: moi,
  });
}

/**
 * Bản đồ "ý đồ preset → đích native" của 66.6.
 *
 * Bảng này là dữ liệu chứ không phải tài liệu, vì Xưởng Preset phải in được nó
 * ra cạnh từng script bị cách ly: người dùng nhập một pack rồi thấy năm script
 * bị tắt cần biết **cái gì trong app đã làm thay việc đó**, nếu không họ sẽ đi
 * tìm cách bật script bằng được.
 */
export const DUONG_PORT_TINH_NANG: readonly Readonly<{
  yDo: string;
  dichNative: string;
  khongDuocLam: string;
}>[] = Object.freeze([
  {
    yDo: 'Nén/gộp chat',
    dichNative: 'Assembler + Trí nhớ tự sự',
    khongDuocLam: 'Script sửa thẳng mảng message',
  },
  {
    yDo: 'Chuyển loại cảnh',
    dichNative: 'Luật khai báo trên Scene/Storyline',
    khongDuocLam: 'Để model tự bật/tắt prompt',
  },
  {
    yDo: 'Lựa chọn hành động',
    dichNative: 'Gợi ý affordance từ Intent',
    khongDuocLam: 'Khóa người chơi vào <choice>',
  },
  {
    yDo: 'Bảng trạng thái',
    dichNative: 'Bảng Thiên Diễn và Sổ Tay, dựng từ WorldView',
    khongDuocLam: 'Chèn HTML vào khung kể bằng innerHTML',
  },
  {
    yDo: 'Tóm tắt/recap',
    dichNative: 'Tác vụ workflow có output schema',
    khongDuocLam: 'Regex xóa lịch sử gốc',
  },
  {
    yDo: 'Lịch/calendar',
    dichNative: 'Đồng hồ game + Project + WorldProcess',
    khongDuocLam: 'Tin thời gian model viết rồi tự tăng nhịp',
  },
  {
    yDo: 'Sự kiện song song',
    dichNative: 'Mạng mạch truyện + hạn ngạch vắng mặt',
    khongDuocLam: 'Model bịa sự kiện không có Patch',
  },
  {
    yDo: 'Quan hệ/nhân vật sống',
    dichNative: 'Relation + Soul + Knowledge + Intent',
    khongDuocLam: 'Prompt thay engine quan hệ',
  },
  {
    yDo: 'Quốc gia/văn minh',
    dichNative: 'Institution + WorldProcess',
    khongDuocLam: 'Để LLM giữ sổ dân số và kinh tế',
  },
  {
    yDo: 'Giọng văn và từ cấm',
    dichNative: 'Hồ sơ trình bày của Narrator',
    khongDuocLam: 'Áp sang Cập Nhật Biến',
  },
  {
    yDo: 'Regex đổi giao diện',
    dichNative: 'Bộ hiển thị cách ly đã khử độc',
    khongDuocLam: 'Script hoặc font tải từ xa',
  },
  { yDo: 'Macro biến', dichNative: 'Namespace preset.<packId>', khongDuocLam: 'Biến toàn cục xuyên save' },
  {
    yDo: 'Dọn chuỗi suy luận',
    dichNative: 'Bỏ thẻ reasoning ngay ở bộ bóc tách',
    khongDuocLam: 'Hiện hoặc lưu chuỗi suy luận',
  },
  {
    yDo: 'Tự động hóa Tavern Helper',
    dichNative: 'Adapter capability viết tay',
    khongDuocLam: 'Chạy JavaScript nguồn',
  },
]);
