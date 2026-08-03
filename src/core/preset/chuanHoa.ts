/**
 * Bước 7 — chuẩn hóa prompt, order, marker, macro, tham số. Phần 63.3, 63.4, 62.4.
 *
 * ── Quy tắc làm nên cả file ──
 *
 * [BB] 63.3: `prompt_order[].order` là nguồn chân lý về THỨ TỰ; `order[].enabled`
 * là nguồn chân lý về BẬT/TẮT. `prompts[].enabled` chỉ là đường lùi khi **toàn
 * file** không có `prompt_order`.
 *
 * Đây không phải chuyện thẩm mỹ. Fixture A có **21 mục** mà hai cờ nói ngược
 * nhau. Đọc nhầm nguồn thì 21 prompt bật/tắt sai — và không có gì trong giao diện
 * cho biết điều đó đã xảy ra. Nên hàm ở đây vừa chọn đúng nguồn, vừa **đếm và
 * báo** từng mismatch.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import { phanLoaiNoiDung } from './anToan.js';
import { macroChuaHoTro, macroTrongChuoi } from './macro.js';
import { dungScriptAdapters } from './scriptAdapter.js';
import { suyConflictKeys, suyPhuThuoc } from './xungDot.js';
import type {
  ActivationState,
  GenerationCandidate,
  ImportEnvelope,
  ModuleKind,
  ModuleLane,
  NormalizedPresetPack,
  PromptModule,
  QuarantinedScript,
  ScriptAdapterDef,
  ThamSoDaChuan,
  TransformDef,
} from './schema.js';
import { GenerationCandidateSchema } from './schema.js';
import type { ModelProfile } from '../schema/ai.js';
import { NormalizedGenParamsSchema } from '../schema/ai.js';
import type { NormalizedGenParams } from '../schema/ai.js';
import { bam } from '../engine/hash.js';

// ─────────────────────────────────────────── marker → lane (63.4)

export const MARKER_SANG_LANE: Readonly<Record<string, ModuleLane>> = Object.freeze({
  worldinfobefore: 'world_before',
  chardescription: 'character',
  charpersonality: 'character',
  scenario: 'scenario',
  worldinfoafter: 'world_after',
  dialogueexamples: 'style',
  chathistory: 'history',
  personadescription: 'character',
});

/** Nguồn native lắp vào từng slot sau `chieu()` — 63.4 cột ba. */
export const NGUON_NATIVE_CUA_SLOT: Readonly<Record<string, string>> = Object.freeze({
  worldinfobefore: 'RAG/lorebook đã chiếu',
  chardescription: 'hồ sơ chủ thể đã chiếu',
  charpersonality: 'soul đã chiếu',
  scenario: 'Scene + ống kính',
  worldinfoafter: 'RAG/lorebook đã chiếu',
  dialogueexamples: 'ví dụ đã duyệt',
  chathistory: 'lịch sử scene đã lọc',
  // [BB] 78.11 — persona CHIẾU, không bao giờ là `PlayerProfile`.
  personadescription: 'ProjectedPlayerPersona',
});

type PromptTho = {
  identifier?: unknown;
  name?: unknown;
  enabled?: unknown;
  role?: unknown;
  content?: unknown;
  marker?: unknown;
  system_prompt?: unknown;
  injection_position?: unknown;
  injection_depth?: unknown;
  injection_order?: unknown;
  forbid_overrides?: unknown;
};

type OrderTho = { character_id?: unknown; order?: unknown };

const chuoi = (v: unknown, macDinh = ''): string => (typeof v === 'string' ? v : macDinh);
const soNguyen = (v: unknown, macDinh = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : macDinh;

// ─────────────────────────────────────────── kết quả

export type KetQuaChuanHoa = {
  readonly pack: NormalizedPresetPack;
  readonly transformDefs: readonly TransformDef[];
  readonly quarantined: readonly QuarantinedScript[];
  readonly scriptAdapters: readonly ScriptAdapterDef[];
  readonly thongKe: ThongKeChuanHoa;
};

export type ThongKeChuanHoa = {
  readonly soPrompt: number;
  readonly soOrderEntry: number;
  /** Số order entry có `enabled === true` — nguồn chân lý về bật/tắt. */
  readonly soHieuLucBat: number;
  /** Số mục mà `prompts[].enabled` mâu thuẫn với `order[].enabled`. */
  readonly soMismatch: number;
  readonly soNgoaiOrder: number;
  readonly soOrderMoCoi: number;
  readonly soMarker: number;
  readonly soRegex: number;
  readonly soRegexBatONguon: number;
  readonly soHelper: number;
  readonly soHelperBatONguon: number;
  readonly theoTrangThai: Readonly<Record<ActivationState, number>>;
};

// ─────────────────────────────────────────── phân loại

function phanLoaiKind(
  identifier: string,
  role: string,
  content: string,
  laMarker: boolean,
  nhan: readonly string[],
): ModuleKind {
  if (laMarker) return 'slot';
  if (role === 'assistant') return 'assistant_prefill';
  if (nhan.includes('reasoning_request')) return 'reasoning_request';
  if (nhan.includes('jailbreak_like')) return 'jailbreak_like';
  if (nhan.includes('output_contract_conflict')) return 'output_contract';
  const id = identifier.toLowerCase();
  if (id.includes('persona') || id.includes('char')) return 'character';
  if (id.includes('world') || id.includes('lore')) return 'world';
  if (id.includes('memory') || id.includes('summar')) return 'memory';
  if (/văn phong|prose|style|giọng/i.test(content) || id.includes('style')) return 'style';
  if (content.trim() === '') return 'unknown';
  return 'instruction';
}

function phanLoaiLane(identifier: string, kind: ModuleKind, viTriChen: number): ModuleLane {
  const marker = MARKER_SANG_LANE[identifier.toLowerCase()];
  if (marker !== undefined) return marker;
  if (kind === 'assistant_prefill') return 'prefill';
  if (kind === 'output_contract') return 'output_contract';
  if (kind === 'style') return 'style';
  if (kind === 'character') return 'character';
  if (kind === 'world') return 'world_after';
  if (kind === 'memory') return 'history_before';
  // ST `injection_position = 1` là chèn vào giữa lịch sử theo độ sâu.
  if (viTriChen === 1) return 'history_after';
  return 'task_instruction';
}

/**
 * Trạng thái kích hoạt — 64.1 + 64.5.
 *
 * Prompt chỉ được biên vào tầng pack ngoài, không nhận tool hay quyền ghi state.
 * Vì vậy classifier ghi nhãn chẩn đoán nhưng không tự làm mất mục tác giả đã bật.
 */
function chonActivation(
  _nhan: readonly string[],
  _macroLa: readonly string[],
  laMarker: boolean,
): ActivationState {
  // Prompt nhập chỉ là nội dung ở tầng quyền thấp hơn lõi engine. Nhãn rủi ro
  // vẫn được ghi vào sourceMeta và báo cáo, nhưng không làm mất module mà tác
  // giả đã bật. Những khả năng nguy hiểm (ghi state, gọi tool, chạy script) vốn
  // không tồn tại trong compiler này; lõi an toàn/tính đúng vẫn nằm phía trên.
  // Macro lạ cũng được giữ nguyên raw thay vì làm tắt cả module.
  return laMarker ? 'native' : 'adapted';
}

// ─────────────────────────────────────────── chuẩn hóa chính

/**
 * Chuẩn hóa một preset SillyTavern đã parse thành `NormalizedPresetPack`.
 *
 * Không đọc file, không gọi mạng, không chạy gì trong `extensions`. Cùng đầu vào
 * luôn cho cùng đầu ra, kể cả thứ tự issue.
 */
export function chuanHoaSillyTavern(input: {
  readonly goc: Record<string, unknown>;
  readonly envelope: ImportEnvelope;
  readonly packId: string;
  readonly version: number;
}): KetQuaChuanHoa {
  const { goc, envelope, packId, version } = input;
  const issues: ImportIssue[] = [];

  const promptsTho = Array.isArray(goc['prompts']) ? (goc['prompts'] as PromptTho[]) : [];
  const orderKhoi = Array.isArray(goc['prompt_order']) ? (goc['prompt_order'] as OrderTho[]) : [];

  /**
   * 63.3 quy tắc 1 — chọn khối order.
   *
   * Đặc tả nói "character_id phù hợp". Ngoài ngữ cảnh SillyTavern không có nhân
   * vật nào đang mở, nên tiêu chí thực dụng là khối DÀI NHẤT: nó là khối người
   * dùng thật sự sắp xếp. Chọn khối đầu tiên sẽ bốc phải khối mặc định rỗng.
   */
  const khoiChon = orderKhoi.reduce<{ order: unknown[]; charId: unknown }>(
    (a, b) => {
      const ds = Array.isArray(b.order) ? b.order : [];
      return ds.length > a.order.length ? { order: ds, charId: b.character_id } : a;
    },
    { order: [], charId: null },
  );
  const orderEntries = khoiChon.order as { identifier?: unknown; enabled?: unknown }[];
  const coOrder = orderKhoi.length > 0 && orderEntries.length > 0;

  if (orderKhoi.length > 1) {
    issues.push({
      code: 'NHIEU_KHOI_ORDER',
      severity: 'info',
      path: 'prompt_order',
      message:
        `File có ${orderKhoi.length} khối prompt_order. Đã chọn khối dài nhất ` +
        `(${orderEntries.length} mục) làm nguồn thứ tự; các khối kia vẫn nằm trong raw source.`,
      details: { soKhoi: orderKhoi.length, charId: khoiChon.charId },
    });
  }

  // 63.3 quy tắc 6 — identifier trùng KHÔNG tự gộp.
  const demTrung = new Map<string, number>();
  const theoId = new Map<string, PromptTho>();
  const idNamespace = new Map<string, string>();
  for (const p of promptsTho) {
    const src = chuoi(p.identifier);
    const lan = (demTrung.get(src) ?? 0) + 1;
    demTrung.set(src, lan);
    const ns = lan === 1 ? `${packId}/${src}` : `${packId}/${src}#${lan}`;
    idNamespace.set(ns, src);
    if (lan === 1) theoId.set(src, p);
    else {
      issues.push({
        code: 'IDENTIFIER_TRUNG',
        severity: 'warning',
        path: `prompts[${src}]`,
        message: `Identifier "${src}" xuất hiện ${lan} lần. Không gộp; bản thứ ${lan} nhận id "${ns}".`,
        details: { identifier: src, lan },
      });
    }
  }

  // ── thứ tự và bật/tắt ──
  const viTriTrongOrder = new Map<string, number>();
  const batTheoOrder = new Map<string, boolean>();
  let soOrderMoCoi = 0;
  orderEntries.forEach((o, i) => {
    const id = chuoi(o.identifier);
    if (id === '') return;
    if (!theoId.has(id)) {
      // 63.3 quy tắc 4 — KHÔNG tạo prompt rỗng cho order mồ côi.
      soOrderMoCoi++;
      issues.push({
        code: 'ORDER_DANGLING',
        severity: 'error',
        path: `prompt_order.order[${i}]`,
        message: `Order trỏ tới "${id}" nhưng không có prompt nào mang identifier đó. Không tạo prompt rỗng thay thế.`,
        details: { identifier: id, viTri: i },
      });
      return;
    }
    viTriTrongOrder.set(id, i);
    batTheoOrder.set(id, o.enabled === true);
  });

  let soMismatch = 0;
  const modules: PromptModule[] = [];
  const demTheoTrangThai: Record<ActivationState, number> = {
    native: 0,
    adapted: 0,
    sandboxed: 0,
    needs_adapter: 0,
    quarantined: 0,
    disabled: 0,
  };
  let soMarker = 0;
  let soNgoaiOrder = 0;

  const demLai = new Map<string, number>();
  promptsTho.forEach((p, viTriGoc) => {
    const src = chuoi(p.identifier);
    const lan = (demLai.get(src) ?? 0) + 1;
    demLai.set(src, lan);
    const id = lan === 1 ? `${packId}/${src}` : `${packId}/${src}#${lan}`;

    const laMarker = p.marker === true;
    if (laMarker) soMarker++;
    const content = chuoi(p.content);
    const role = ((): 'system' | 'user' | 'assistant' => {
      const r = chuoi(p.role, 'system').toLowerCase();
      return r === 'user' || r === 'assistant' ? r : 'system';
    })();

    const trongOrder = lan === 1 && viTriTrongOrder.has(src);
    const batNguon = p.enabled === undefined ? true : p.enabled === true;
    const batHieuLuc = coOrder ? (trongOrder ? (batTheoOrder.get(src) as boolean) : false) : batNguon;

    if (coOrder && trongOrder && batNguon !== batHieuLuc) {
      soMismatch++;
      issues.push({
        code: 'ENABLED_MISMATCH',
        severity: 'warning',
        path: `prompts[${src}].enabled`,
        message:
          `prompts[].enabled = ${batNguon} nhưng order[].enabled = ${batHieuLuc}. ` +
          'Order thắng (63.3 quy tắc 2). Mục này đang ở trạng thái của order.',
        details: { identifier: src, nguon: batNguon, order: batHieuLuc },
      });
    }
    if (coOrder && !trongOrder) {
      // 63.3 quy tắc 5 — giữ lại, đặt cuối lane, mặc định TẮT.
      soNgoaiOrder++;
      issues.push({
        code: 'UNORDERED_PROMPT',
        severity: 'warning',
        path: `prompts[${src}]`,
        message:
          `"${src}" không nằm trong prompt_order. Được giữ nguyên nhưng mặc định TẮT; ` +
          'bật được sau khi duyệt.',
        details: { identifier: src },
      });
    }

    const nhanRuiRo = phanLoaiNoiDung(content).map((n) => n.nhan);
    const macroLa = macroChuaHoTro(content);
    const kind = phanLoaiKind(src, role, content, laMarker, nhanRuiRo);
    const lane = phanLoaiLane(src, kind, soNguyen(p.injection_position));
    const activation = chonActivation(nhanRuiRo, macroLa, laMarker);
    demTheoTrangThai[activation]++;

    const phuThuoc = suyPhuThuoc({ content, kind, lane });
    const order = trongOrder ? (viTriTrongOrder.get(src) as number) * 10 : 900_000 + viTriGoc; // 63.3 quy tắc 5 — cuối lane, giữ thứ tự tương đối.

    modules.push({
      id,
      packId,
      sourceIdentifier: src,
      name: chuoi(p.name, src),
      role,
      kind,
      enabled: batHieuLuc && activation !== 'quarantined' && activation !== 'disabled',
      lane,
      order,
      depth: Math.max(0, soNguyen(p.injection_depth)),
      content,
      macroRefs: macroTrongChuoi(content),
      provides: phuThuoc.provides,
      requires: phuThuoc.requires,
      conflictKeys: suyConflictKeys({ content, kind, lane }),
      activation,
      // [BB] 62.3 — mặc định CHỈ narrator. Không có nhánh nào ở đây thêm updater.
      targetPipelines: ['narrator'],
      sourceMeta: {
        marker: laMarker,
        system_prompt: p.system_prompt === true,
        injection_position: soNguyen(p.injection_position),
        injection_order: soNguyen(p.injection_order),
        forbid_overrides: p.forbid_overrides === true,
        enabledONguon: batNguon,
        enabledHieuLucNguon: batHieuLuc,
        trongOrder,
        nhanRuiRo,
        macroCanAdapter: macroLa,
        nguonNativeCuaSlot: laMarker ? (NGUON_NATIVE_CUA_SLOT[src.toLowerCase()] ?? '') : '',
      },
    });
  });

  // ── extensions ──
  const ext = (goc['extensions'] ?? {}) as Record<string, unknown>;
  const regexTho = Array.isArray(ext['regex_scripts'])
    ? (ext['regex_scripts'] as Record<string, unknown>[])
    : [];
  const helperTho = ((): Record<string, unknown>[] => {
    const th = ext['tavern_helper'];
    if (th === null || typeof th !== 'object') return [];
    const s = (th as Record<string, unknown>)['scripts'];
    return Array.isArray(s) ? (s as Record<string, unknown>[]) : [];
  })();

  const transformDefs: TransformDef[] = regexTho.map((r, i) => {
    const pattern = chuoi(r['findRegex']);
    const hopLe = kiemPatternHopLe(pattern);
    return {
      id: `${packId}/rx${i}`,
      packId,
      ten: chuoi(r['scriptName'], `regex ${i + 1}`),
      pattern,
      co: '',
      thayThe: chuoi(r['replaceString']),
      placement: Array.isArray(r['placement'])
        ? (r['placement'] as unknown[]).filter(
            (v): v is number => typeof v === 'number' && Number.isInteger(v),
          )
        : [2],
      runOnEdit: r['runOnEdit'] === true,
      trimStrings: Array.isArray(r['trimStrings'])
        ? (r['trimStrings'] as unknown[]).filter((v): v is string => typeof v === 'string')
        : [],
      substituteRegex: soNguyen(r['substituteRegex']),
      minDepth:
        typeof r['minDepth'] === 'number' && Number.isFinite(r['minDepth'])
          ? Math.trunc(r['minDepth'])
          : null,
      maxDepth:
        typeof r['maxDepth'] === 'number' && Number.isFinite(r['maxDepth'])
          ? Math.trunc(r['maxDepth'])
          : null,
      markdownOnlyNguon: r['markdownOnly'] === true,
      promptOnlyNguon: r['promptOnly'] === true,
      batONguon: r['disabled'] !== true,
      thuTuNguon: i,
      // [BB] 64.3 — pattern engine không đỡ được thì `needs_adapter`, không thử chạy.
      activation: r['disabled'] === true ? 'disabled' : hopLe ? 'sandboxed' : 'needs_adapter',
      lyDo: hopLe
        ? 'Chạy trên bản sao output hiển thị, có timeout; không chạm system prompt, user input, patch hay event.'
        : 'Cú pháp regex không chạy được bằng engine của trình duyệt.',
    };
  });
  const soRegexBatONguon = regexTho.filter((r) => r['disabled'] !== true).length;

  const quarantined: QuarantinedScript[] = helperTho.map((s, i) => {
    const noiDung = chuoi(s['content'] ?? s['code'] ?? s['script']);
    return {
      id: `${packId}/th${i}`,
      packId,
      ten: chuoi(s['name'], `script ${i + 1}`),
      hash: bam(noiDung),
      soKyTu: noiDung.length,
      batONguon: s['enabled'] !== false,
      // [BB] 64.2 — luôn cách ly, kể cả `enabled = true` trong file nguồn.
      lyDo: 'Script Tavern Helper luôn vào ở trạng thái cách ly. Chỉ chạy được qua adapter viết tay (64.2).',
    };
  });
  const scriptAdapters = dungScriptAdapters({ goc, packId, helperScripts: helperTho });

  if (quarantined.length > 0) {
    issues.push({
      code: 'SCRIPT_CACH_LY',
      severity: 'quarantine',
      path: 'extensions.tavern_helper.scripts',
      message:
        `${quarantined.length} script trợ giúp đã được lưu nguyên vẹn nhưng không chạy trực tiếp. ` +
        `${scriptAdapters.filter((a) => a.batONguon).length} chức năng đang bật đã có adapter native an toàn.`,
      details: { so: quarantined.length, soAdapter: scriptAdapters.length },
    });
  }
  for (const t of transformDefs.filter((t) => t.activation === 'needs_adapter')) {
    issues.push({
      code: 'REGEX_CAN_ADAPTER',
      severity: 'warning',
      path: t.id,
      message: `Regex "${t.ten}" dùng cú pháp engine không hỗ trợ. Giữ nguyên, chưa chạy được.`,
      details: { pattern: t.pattern.slice(0, 120) },
    });
  }

  // ── tham số sinh ──
  const generation = docThamSoNguon(goc);
  const scriptVariables: Record<string, unknown> = {};
  for (const s of helperTho) {
    if (s['enabled'] === false) continue;
    const data = s['data'];
    if (data === null || typeof data !== 'object' || Array.isArray(data)) continue;
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype') scriptVariables[k] = v;
    }
  }

  const pack: NormalizedPresetPack = {
    envelope,
    version,
    modules,
    generation,
    variables: scriptVariables,
    transforms: transformDefs.map((t) => t.id),
    extensionRefs: quarantined.map((q) => q.id),
    issues,
  };

  return {
    pack,
    transformDefs,
    quarantined,
    scriptAdapters,
    thongKe: {
      soPrompt: promptsTho.length,
      soOrderEntry: orderEntries.length,
      soHieuLucBat: orderEntries.filter((o) => o.enabled === true).length,
      soMismatch,
      soNgoaiOrder,
      soOrderMoCoi,
      soMarker,
      soRegex: regexTho.length,
      soRegexBatONguon,
      soHelper: helperTho.length,
      soHelperBatONguon: quarantined.filter((q) => q.batONguon).length,
      theoTrangThai: demTheoTrangThai,
    },
  };
}

/** Regex nguồn có chạy được bằng `RegExp` của trình duyệt không — chỉ KIỂM, không chạy. */
export function kiemPatternHopLe(pattern: string): boolean {
  if (pattern.trim() === '') return false;
  const than = /^\/(.*)\/([gimsuy]*)$/s.exec(pattern);
  try {
    if (than) new RegExp(than[1] as string, than[2] as string);
    else new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────── tham số

const ANH_XA_THAM_SO: readonly (readonly [string, string])[] = [
  ['temperature', 'temperature'],
  ['top_p', 'topP'],
  ['top_k', 'topK'],
  ['top_a', 'topA'],
  ['min_p', 'minP'],
  ['repetition_penalty', 'repetitionPenalty'],
  ['presence_penalty', 'presencePenalty'],
  ['frequency_penalty', 'frequencyPenalty'],
  ['openai_max_context', 'maxContext'],
  ['openai_max_tokens', 'maxOutputTokens'],
  ['reasoning_effort', 'reasoningEffort'],
  ['verbosity', 'verbosity'],
  ['seed', 'seed'],
  ['continue_prefill', 'continuePrefill'],
];

/** Đọc tham số sinh từ file nguồn, GIỮ NGUYÊN giá trị — 62.4. */
export function docThamSoNguon(goc: Record<string, unknown>): GenerationCandidate {
  const ra: Record<string, unknown> = {};
  const la: Record<string, unknown> = {};
  const daDung = new Set<string>();
  for (const [nguon, dich] of ANH_XA_THAM_SO) {
    if (!Object.hasOwn(goc, nguon)) continue;
    daDung.add(nguon);
    ra[dich] = goc[nguon];
  }
  /**
   * Mọi khóa scalar còn lại ở mức ngoài cùng vào `unknown`.
   *
   * [BB] 62.4 — trường API không hỗ trợ **không được gửi lên endpoint**. Giữ
   * chúng ở một chỗ có tên là cách duy nhất vừa không mất dữ liệu vừa không lỡ tay gửi.
   */
  for (const k of Object.keys(goc)) {
    if (daDung.has(k)) continue;
    if (k === 'prompts' || k === 'prompt_order' || k === 'extensions') continue;
    const v = goc[k];
    if (v === null || typeof v === 'object') continue;
    la[k] = v;
  }
  const r = GenerationCandidateSchema.safeParse({ ...ra, unknown: la });
  return r.success ? r.data : GenerationCandidateSchema.parse({ unknown: la });
}

/**
 * Áp `ModelProfile` lên tham số raw — 62.4.
 *
 * Trả về CẢ hai: giá trị dùng được và bảng diff. Bảng diff là thứ người dùng cần
 * thấy ở màn 6; "đã tự động điều chỉnh" mà không nói chỉnh gì là cách nhanh nhất
 * để một preset chạy sai suốt ván mà không ai biết.
 */
export function chuanHoaThamSo(
  gen: GenerationCandidate | undefined,
  profile: ModelProfile,
): { params: NormalizedGenParams; bang: ThamSoDaChuan[] } {
  const bang: ThamSoDaChuan[] = [];
  const ra: Record<string, unknown> = {};

  const giu = (truong: string, raw: unknown, dung: unknown, hetCo: boolean, lyDo = ''): void => {
    if (raw === undefined) return;
    ra[truong] = dung;
    bang.push({
      truong,
      raw,
      dung,
      trangThai: hetCo ? 'giu_nguyen' : 'bi_gioi_han',
      lyDo,
    });
  };
  const khongHoTro = (truong: string, raw: unknown, lyDo: string): void => {
    if (raw === undefined) return;
    bang.push({ truong, raw, dung: null, trangThai: 'khong_ho_tro', lyDo });
  };

  const g: Partial<GenerationCandidate> = gen ?? {};
  const kep = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

  if (g.temperature !== undefined) {
    const d = kep(g.temperature, 0, profile.gioiHan.temperatureMax);
    giu(
      'temperature',
      g.temperature,
      d,
      d === g.temperature,
      `trần của profile: ${profile.gioiHan.temperatureMax}`,
    );
  }
  if (g.topP !== undefined) {
    const d = kep(g.topP, 0, 1);
    giu('topP', g.topP, d, d === g.topP, 'topP nằm trong [0, 1]');
  }
  if (g.topK !== undefined) {
    // Fixture A khai `top_k = 500`. Giữ raw ở pack, clamp ở đây, hiện cả hai.
    const d = kep(g.topK, 0, profile.gioiHan.topKMax);
    giu('topK', g.topK, d, d === g.topK, `model này nhận tối đa topK = ${profile.gioiHan.topKMax}`);
  }
  if (g.topA !== undefined) {
    if (profile.hoTro.topA) giu('topA', g.topA, kep(g.topA, 0, 1), true);
    else khongHoTro('topA', g.topA, 'model không nhận topA — trường này sẽ KHÔNG được gửi');
  }
  if (g.minP !== undefined) {
    if (profile.hoTro.minP) giu('minP', g.minP, kep(g.minP, 0, 1), true);
    else khongHoTro('minP', g.minP, 'model không nhận minP — trường này sẽ KHÔNG được gửi');
  }
  if (g.repetitionPenalty !== undefined) {
    if (profile.hoTro.repetitionPenalty) {
      giu('repetitionPenalty', g.repetitionPenalty, Math.max(0, g.repetitionPenalty), true);
    } else {
      khongHoTro('repetitionPenalty', g.repetitionPenalty, 'model không nhận repetitionPenalty');
    }
  }
  if (g.presencePenalty !== undefined) {
    const d = kep(g.presencePenalty, -2, 2);
    giu('presencePenalty', g.presencePenalty, d, d === g.presencePenalty, 'API nhận [-2, 2]');
  }
  if (g.frequencyPenalty !== undefined) {
    const d = kep(g.frequencyPenalty, -2, 2);
    giu('frequencyPenalty', g.frequencyPenalty, d, d === g.frequencyPenalty, 'API nhận [-2, 2]');
  }
  if (g.maxContext !== undefined) {
    /**
     * [BB] 62.4 — context 2.000.000 chỉ dùng được nếu probe xác nhận. Fixture A
     * khai đúng con số đó; nếu ta tin nó thì mọi lượt kể sẽ nhét quá trần thật và
     * hỏng ở tầng HTTP, nơi thông báo lỗi không nói gì về nguyên nhân.
     */
    const d = kep(g.maxContext, 1024, profile.gioiHan.contextMax);
    giu(
      'contextLimit',
      g.maxContext,
      d,
      d === g.maxContext,
      `context thật của model: ${profile.gioiHan.contextMax}`,
    );
  }
  if (g.maxOutputTokens !== undefined) {
    const d = kep(g.maxOutputTokens, 1, profile.gioiHan.outputMax);
    giu(
      'maxOutputTokens',
      g.maxOutputTokens,
      d,
      d === g.maxOutputTokens,
      `output tối đa của model: ${profile.gioiHan.outputMax}`,
    );
  }
  if (g.seed !== undefined) {
    if (profile.hoTro.seed) giu('seed', g.seed, g.seed, true);
    else khongHoTro('seed', g.seed, 'model không nhận seed');
  }
  if (g.reasoningEffort !== undefined) {
    const hopLe = ['low', 'medium', 'high', 'max'];
    if (profile.hoTro.reasoningEffort && hopLe.includes(g.reasoningEffort)) {
      giu('reasoningEffort', g.reasoningEffort, g.reasoningEffort, true);
    } else {
      khongHoTro('reasoningEffort', g.reasoningEffort, 'model không nhận reasoningEffort');
    }
  }
  if (g.verbosity !== undefined) {
    const hopLe = ['low', 'medium', 'high'];
    if (profile.hoTro.verbosity && hopLe.includes(g.verbosity)) {
      giu('verbosity', g.verbosity, g.verbosity, true);
    } else {
      khongHoTro('verbosity', g.verbosity, 'model không nhận verbosity');
    }
  }
  if (g.continuePrefill !== undefined) {
    if (profile.hoTro.continuePrefill) giu('continuePrefill', g.continuePrefill, g.continuePrefill, true);
    else khongHoTro('continuePrefill', g.continuePrefill, 'model không nhận assistant prefill');
  }
  if (g.stopSequences !== undefined) {
    const toiDa = profile.hoTro.stopSequences;
    const d = g.stopSequences.slice(0, toiDa);
    giu(
      'stopSequences',
      g.stopSequences,
      d,
      d.length === g.stopSequences.length,
      `model nhận tối đa ${toiDa} chuỗi dừng`,
    );
  }

  for (const k of Object.keys(g.unknown ?? {})) {
    khongHoTro(
      k,
      (g.unknown as Record<string, unknown>)[k],
      'trường không thuộc API — giữ trong pack, không gửi đi',
    );
  }

  return { params: NormalizedGenParamsSchema.parse(ra), bang };
}
