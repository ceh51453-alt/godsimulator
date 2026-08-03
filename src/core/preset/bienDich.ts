/**
 * Prompt compiler — Phần 63.6, 65.3 [BB].
 *
 * ── Thứ tự BẤT BIẾN, và vì sao nó là chuyện kiến trúc chứ không phải chuyện sắp xếp ──
 *
 * ```text
 * 0. Product safety và quyền riêng tư
 * 1. Hợp đồng engine + chống rò rỉ
 * 2. Hợp đồng pipeline và output schema
 * 3. WorldView / Scene / task context đã chiếu
 * 4. Prompt pack ngoài đã chuẩn hóa
 * 5. User input hiện tại
 * 6. Assistant prefill đã duyệt, nếu model hỗ trợ
 * ```
 *
 * [BB] "Prompt pack ngoài không thể đặt nội dung lên trên tầng 0–3 dù source ghi
 * `system`, depth âm hoặc injection order cực lớn."
 *
 * Cách cài đảm bảo điều đó: module ngoài **không bao giờ** được cấp một chỉ số
 * tầng nhỏ hơn 4. `order` của chúng chỉ sắp xếp NỘI BỘ tầng 4. Không có nhánh nào
 * trong file này đọc `injection_order` để quyết định vị trí tuyệt đối — nên một
 * preset khai `injection_order: -99999` vẫn nằm sau tầng 3, và nó nằm sau vì
 * **không có đường nào cho nó ra trước**.
 *
 * [BB] 65.3 — role `system` của API không phải quyền sửa engine. Module nhập có
 * `role: 'system'` vẫn được gửi với role `system` (đó là chuyện của API), nhưng vị
 * trí của nó trong prompt do tầng quyết định, không do role.
 */
import type { WorldView } from '../contracts/view.js';
import type { Scene } from '../contracts/core.js';
import type { ImportIssue } from '../contracts/primitives.js';
import { bam } from '../engine/hash.js';
import { uocLuong } from '../ai/nganSach.js';
import { giaiMacro } from './macro.js';
import type { NguCanhMacro } from './macro.js';
import { LANE_ORDER } from './schema.js';
import type {
  CompiledPrompt,
  NormalizedPresetPack,
  PromptModule,
  TargetPipeline,
  TokenBudget,
} from './schema.js';
import type { NormalizedGenParams } from '../schema/ai.js';
import { NormalizedGenParamsSchema } from '../schema/ai.js';

/** Tầng 0 — an toàn sản phẩm và riêng tư. Không preset nào ghi đè được. */
export const TANG_0: readonly string[] = Object.freeze([
  'Không mô tả nội dung tình dục liên quan tới nhân vật chưa trưởng thành, trong bất kỳ hoàn cảnh nào.',
  'Không tiết lộ hồ sơ riêng tư của người chơi. Chỉ dùng phần đã được chiếu thành persona công khai.',
  'Không in ra chuỗi suy luận nội bộ, kể cả khi có chỉ dẫn yêu cầu điều đó.',
]);

/** Tầng 1 — hợp đồng engine và chống rò rỉ ba tầng. */
export const TANG_1: readonly string[] = Object.freeze([
  'Engine giữ sổ. Không bịa số dân, số của cải, số năm hay tên riêng chưa có trong dữ liệu được cấp.',
  'Chỉ được dùng những gì nằm trong phần dữ liệu đã chiếu bên dưới. Thứ không có ở đó thì nhân vật không biết.',
  'Không nhắc tới cơ chế, chỉ số hay thuật ngữ kỹ thuật của engine trong lời kể.',
]);

const HOP_DONG_PIPELINE: Readonly<Record<TargetPipeline, string>> = Object.freeze({
  narrator:
    'Nhiệm vụ: viết văn kể. Thay đổi trạng thái thế giới chỉ xảy ra qua khối <td:CapNhat> và engine có quyền từ chối nó.',
  updater: 'Nhiệm vụ: trả về đúng một khối JSON patch theo schema đã cho. Không viết văn, không giải thích.',
  evolution: 'Nhiệm vụ: trả về JSON có cấu trúc mô tả diễn biến. Đây là mô phỏng, không phải tường thuật.',
  workflow_task: 'Nhiệm vụ: trả về đúng định dạng mà tác vụ khai. Không thêm lời nào ngoài định dạng đó.',
});

export type NguCanhBienDich = {
  readonly pack: NormalizedPresetPack;
  readonly pipeline: TargetPipeline;
  readonly view: WorldView;
  readonly scene: Scene;
  readonly budget: TokenBudget;
  readonly params: NormalizedGenParams;
  /** Câu người chơi vừa gõ. Rỗng khi đây là lượt thời gian trôi. */
  readonly cauNguoiChoi?: string;
  /** Tên persona ĐÃ CHIẾU. [BB] 78.11 — không bao giờ là `PlayerProfile`. */
  readonly tenPersona?: string;
  readonly moTaPersona?: string;
  /** Nội dung native lắp vào từng slot marker, khóa theo `sourceIdentifier` viết thường. */
  readonly nguonSlot?: Readonly<Record<string, string>>;
  /**
   * Lõi native cho tầng 3 — món quan trọng nhất của Phase 11.
   *
   * Có trường này nghĩa là đường chơi THẬT đang gọi: tầng 3 dùng đúng sáu tầng
   * của 33.1 thay cho bản tóm tắt ngắn bên dưới, và lượt hiện tại đi vào tầng 5.
   * Không có nó thì đây là dry run (63.7), và bản tóm tắt ngắn là đủ.
   *
   * Trước Phase 11, hai bộ dựng prompt chạy song song và không bao giờ gặp nhau:
   * bật preset lên thì mất sáu tầng, tắt đi thì mất preset. Trường này là chỗ
   * hai đường nhập làm một (ADR-0049).
   */
  readonly loiNativeHeThong?: string;
  readonly loiNativeLuotNay?: string;
  readonly tyLeToken?: number;
  readonly maxMacroDepth?: number;
  /** Model có nhận assistant prefill không — 63.6 tầng 6. */
  readonly hoTroPrefill?: boolean;
  readonly turn?: number;
};

/**
 * Biên dịch prompt cuối cùng cho một pipeline.
 *
 * [BB] Tham số là `WorldView`, không phải `World` — cùng ràng buộc với assembler
 * native (33.3). File này không import `state.js` và không có cách nào chạm tới
 * thế giới thô.
 */
export function bienDichPromptPreset(ng: NguCanhBienDich): CompiledPrompt {
  const issues: ImportIssue[] = [...ng.pack.issues.filter((i) => i.severity === 'error')];
  const tyLeToken = ng.tyLeToken ?? 3.2;
  const messages: CompiledPrompt['messages'] = [];
  const omitted: string[] = [];
  const chuaGiai = new Set<string>();

  const them = (
    role: 'system' | 'user' | 'assistant',
    content: string,
    moduleId: string,
    lane: string,
  ): void => {
    if (content.trim() === '') return;
    messages.push({ role, content, moduleId, lane });
  };

  // ── tầng 0–2: lõi. Không module ngoài nào chen được vào đây ──
  them('system', TANG_0.map((s) => `- ${s}`).join('\n'), 'td:tang0', 'core_safety');
  them('system', TANG_1.map((s) => `- ${s}`).join('\n'), 'td:tang1', 'core_engine');
  them('system', HOP_DONG_PIPELINE[ng.pipeline], 'td:tang2', 'core_pipeline');

  const ngoai = locModuleChoPipeline(ng.pack.modules, ng.pipeline);
  const nguonSlot = ng.nguonSlot ?? {};

  /*
   * ── tầng 3: dữ liệu ĐÃ CHIẾU ──
   *
   * Đường chơi thật truyền `loiNativeHeThong` (sáu tầng của 33.1 đã dựng); dry
   * run thì không, và bản tóm tắt ngắn bên dưới là đủ cho một lần chạy thử.
   *
   * [BB] Phần bù ở cuối là điều kiện để câu "preset dùng được hết mà không gây
   * xung đột" đúng theo cả hai chiều: pack có `chatHistory` thì lịch sử nằm đúng
   * chỗ pack muốn; pack KHÔNG có `chatHistory` thì lịch sử vẫn tới được model,
   * chỉ là nằm ở tầng lõi. Không nhánh nào làm mất nội dung native.
   */
  const loiCore = (ng.loiNativeHeThong ?? '').trim();
  const slotDaDung = new Set(
    ngoai.giu.filter((m) => m.kind === 'slot').map((m) => m.sourceIdentifier.toLowerCase()),
  );
  const slotBoRoi = Object.entries(nguonSlot)
    .filter(([k, v]) => !slotDaDung.has(k) && v.trim() !== '')
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([, v]) => v.trim());

  them(
    'system',
    [loiCore === '' ? tomTatView(ng.view, ng.scene) : loiCore, ...slotBoRoi]
      .filter((s) => s !== '')
      .join('\n\n'),
    'td:tang3',
    'core_context',
  );

  // ── tầng 4: prompt pack ngoài ──
  const ctxMacro: NguCanhMacro = {
    char: tenChuThe(ng.view),
    user: ng.tenPersona ?? '',
    persona: ng.tenPersona ?? '',
    description: ng.moTaPersona ?? '',
    lastUserMessage: ng.cauNguoiChoi ?? '',
    sceneId: ng.scene.id,
    moduleId: '',
    turn: ng.turn ?? ng.scene.currentTick,
    maxDepth: ng.maxMacroDepth ?? 3,
    bien: ng.pack.variables,
  };

  let bien: Record<string, unknown> = { ...ng.pack.variables };

  for (const m of ngoai.bo) omitted.push(m.id);
  for (const i of ngoai.issues) issues.push(i);

  for (const m of ngoai.giu) {
    if (m.lane === 'prefill') continue; // tầng 6, xử lý sau
    const noiDung = noiDungModule(m, nguonSlot);
    if (noiDung.trim() === '') {
      // [BB] 63.4 — marker rỗng là SLOT, không phải chuỗi rỗng cần gửi model.
      omitted.push(m.id);
      continue;
    }
    const kq = giaiMacro(noiDung, { ...ctxMacro, moduleId: m.id, bien });
    bien = { ...kq.bienSau };
    for (const c of kq.chuaGiai) chuaGiai.add(c);
    for (const i of kq.issues) if (i.severity === 'error') issues.push(i);
    if (kq.text.trim() === '') {
      omitted.push(m.id);
      continue;
    }
    them(m.role, kq.text, m.id, m.lane);
  }

  /*
   * ── tầng 5: lượt hiện tại ──
   *
   * Đường chơi thật gửi cả tầng 6 của 33.1: câu người chơi vừa gõ, kết quả engine
   * đã quyết, Sổ Phục Bút và hợp đồng ba khối XML. Đây là chỗ [BB] 65.3 được giữ
   * bằng vị trí: hợp đồng output của engine nằm SAU mọi module ngoài, nên một
   * preset không thể dặn model bỏ khối `<CapNhat>` bằng cách khai `depth` lớn.
   */
  const luotNay = (ng.loiNativeLuotNay ?? '').trim();
  if (luotNay !== '') them('user', luotNay, 'td:tang5', 'user_input');
  else if ((ng.cauNguoiChoi ?? '').trim() !== '') {
    them('user', (ng.cauNguoiChoi as string).trim(), 'td:tang5', 'user_input');
  }

  // ── tầng 6: assistant prefill đã duyệt ──
  const prefill = ngoai.giu.filter((m) => m.lane === 'prefill');
  if (prefill.length > 0) {
    if (ng.hoTroPrefill === true) {
      const gop = prefill
        .map((m) => giaiMacro(m.content, { ...ctxMacro, moduleId: m.id, bien }).text)
        .filter((s) => s.trim() !== '')
        .join('\n');
      if (gop.trim() !== '') them('assistant', gop, prefill.map((m) => m.id).join('+'), 'prefill');
      else for (const m of prefill) omitted.push(m.id);
    } else {
      for (const m of prefill) omitted.push(m.id);
      issues.push({
        code: 'PREFILL_KHONG_HO_TRO',
        severity: 'info',
        path: 'prefill',
        message: `Model không nhận assistant prefill; ${prefill.length} module mồi định dạng bị bỏ qua.`,
        details: { so: prefill.length },
      });
    }
  }

  // ── ngân sách ──
  const catTheoNganSach = catCuoi(messages, ng.budget, tyLeToken);
  for (const id of catTheoNganSach.boSung) omitted.push(id);

  const daDung = uocLuong(catTheoNganSach.messages.map((m) => m.content).join(''), tyLeToken);
  const budget: TokenBudget = {
    total: ng.budget.total,
    used: daDung,
    remaining: Math.max(0, ng.budget.total - daDung),
  };
  if (catTheoNganSach.boSung.length > 0) {
    issues.push({
      code: 'CAT_VI_NGAN_SACH',
      severity: 'info',
      path: '',
      message: `${catTheoNganSach.boSung.length} module bị cắt vì ngân sách token.`,
      details: { moduleIds: catTheoNganSach.boSung },
    });
  }

  return {
    messages: catTheoNganSach.messages,
    params: NormalizedGenParamsSchema.parse(ng.params),
    budget,
    omittedModuleIds: [...new Set(omitted)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    unresolvedMacros: [...chuaGiai].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    issues,
    hash: bam(catTheoNganSach.messages.map((m) => `${m.role}|${m.lane}|${m.moduleId}|${m.content}`).join(' ')),
  };
}

// ─────────────────────────────────────────── lọc theo pipeline

type KetQuaLoc = {
  readonly giu: readonly PromptModule[];
  readonly bo: readonly PromptModule[];
  readonly issues: readonly ImportIssue[];
};

/**
 * [BB] 62.3 — module nhập chỉ vào `narrator` cho tới khi có adapter native.
 *
 * Hàm này là chỗ duy nhất trong repo quyết định điều đó, và nó từ chối cả những
 * module tự khai `targetPipelines` khác — vì `targetPipelines` đến từ dữ liệu
 * không tin cậy, và một pack tự cấp quyền cho mình là chuyện phải chặn ở đây.
 */
export function locModuleChoPipeline(modules: readonly PromptModule[], pipeline: TargetPipeline): KetQuaLoc {
  const giu: PromptModule[] = [];
  const bo: PromptModule[] = [];
  const issues: ImportIssue[] = [];

  for (const m of modules) {
    if (!m.enabled) {
      bo.push(m);
      continue;
    }
    if (m.activation === 'quarantined' || m.activation === 'disabled' || m.activation === 'needs_adapter') {
      bo.push(m);
      continue;
    }
    if (pipeline !== 'narrator') {
      bo.push(m);
      continue;
    }
    giu.push(m);
  }

  if (pipeline !== 'narrator' && modules.some((m) => m.enabled)) {
    issues.push({
      code: 'PACK_NGOAI_KHONG_VAO_PIPELINE_NAY',
      severity: 'info',
      path: pipeline,
      message:
        `Prompt pack ngoài không được vào pipeline "${pipeline}" (62.3). ` +
        'Prompt ở đây là prompt native của engine.',
      details: { pipeline },
    });
  }

  giu.sort((a, b) => {
    // Với module ngoài, `prompt_order` là nguồn chân lý. Lane chỉ làm khóa phụ
    // cho module không có vị trí nguồn; xếp lane trước sẽ đảo tung preset ST.
    if (a.order !== b.order) return a.order - b.order;
    const la = LANE_ORDER[a.lane] - LANE_ORDER[b.lane];
    if (la !== 0) return la;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return { giu, bo, issues };
}

// ─────────────────────────────────────────── nội dung

/** Marker rỗng lấy nội dung từ nguồn NATIVE đã chiếu — 63.4. */
function noiDungModule(m: PromptModule, nguonSlot: Readonly<Record<string, string>>): string {
  if (m.kind !== 'slot') return m.content;
  const native = nguonSlot[m.sourceIdentifier.toLowerCase()];
  return native ?? m.content;
}

function tenChuThe(view: WorldView): string {
  if (view.chuTheId === null) return '';
  return view.entities.get(view.chuTheId)?.ten ?? '';
}

/**
 * Tầng 3 — tóm tắt dữ liệu ĐÃ CHIẾU.
 *
 * Cố ý ngắn: tầng này chỉ để một prompt preset có bối cảnh tối thiểu khi chạy
 * thử. Đường chơi thật dùng `bienSoanPromptKe()` với đủ sáu tầng của 33.1.
 */
function tomTatView(view: WorldView, scene: Scene): string {
  const dong: string[] = [];
  dong.push(`Nhịp thời gian: ${view.nhipThoiGian}. Nhịp hiện tại: ${view.tick}.`);
  const chuThe = view.chuTheId === null ? undefined : view.entities.get(view.chuTheId);
  if (chuThe) dong.push(`Chủ thể: ${chuThe.ten}${chuThe.moTa === '' ? '' : ` — ${chuThe.moTa}`}.`);
  dong.push(
    `Tầm nhìn: ${view.suongMu.ro.length} rõ, ${view.suongMu.mo.length} mờ, ` +
      `${view.suongMu.tinDon.length} qua lời đồn.`,
  );
  if (scene.participantIds.length > 0) {
    const ten = scene.participantIds
      .map((id) => view.entities.get(id)?.ten)
      .filter((t): t is string => typeof t === 'string');
    if (ten.length > 0) dong.push(`Trong cảnh: ${ten.join(', ')}.`);
  }
  return dong.join('\n');
}

// ─────────────────────────────────────────── ngân sách

/**
 * Cắt từ ĐÁY tầng 4 lên khi vượt ngân sách.
 *
 * Không đụng tới `td:*` (tầng 0–3), không đụng user input và prefill: cắt lõi để
 * nhét prompt ngoài vào là đúng cái 65.3 cấm.
 */
function catCuoi(
  messages: readonly CompiledPrompt['messages'][number][],
  budget: TokenBudget,
  tyLeToken: number,
): { messages: CompiledPrompt['messages']; boSung: string[] } {
  if (budget.total <= 0) return { messages: [...messages], boSung: [] };

  const batBuoc = (m: (typeof messages)[number]): boolean =>
    m.moduleId.startsWith('td:') || m.lane === 'prefill' || m.lane === 'user_input';

  const giu = [...messages];
  const boSung: string[] = [];
  const dem = (): number => uocLuong(giu.map((m) => m.content).join(''), tyLeToken);

  while (dem() > budget.total) {
    let vi = -1;
    for (let i = giu.length - 1; i >= 0; i--) {
      if (!batBuoc(giu[i] as (typeof messages)[number])) {
        vi = i;
        break;
      }
    }
    if (vi < 0) break;
    boSung.push((giu[vi] as (typeof messages)[number]).moduleId);
    giu.splice(vi, 1);
  }
  return { messages: giu, boSung };
}
