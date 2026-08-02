/**
 * Bước 9 — đồ thị dependency và nhóm xung đột. Phần 65.1, 65.2, 65.3 [BB].
 *
 * ── Điều dễ làm sai nhất ở đây ──
 *
 * Cám dỗ là tự giải xung đột: hai module cùng đòi ngôi kể thì chọn cái `order`
 * nhỏ hơn rồi đi tiếp. 65.1 cấm đúng điều đó — "kết quả phải hiện cho người dùng
 * duyệt". Nên `nhomXungDot()` trả về **nhóm cần chọn**, không trả về lựa chọn; và
 * `giaiTuDong()` chỉ giải những chiến lược mà đặc tả nói là giải được máy móc
 * (`min`, `native_wins`, `merge_ordered`), để lại `exclusive_one` và `user_choice`
 * cho con người.
 *
 * Tương tự với cycle: [BB] 65.2 — "không tự bẻ bằng id". Một importer tự cắt
 * cạnh theo thứ tự chữ cái sẽ cho ra một pack chạy được mà sai, và không ai biết
 * nó đã cắt gì.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { ModuleKind, ModuleLane, PromptModule } from './schema.js';

// ─────────────────────────────────────────── conflict key

/** Mười lăm khóa của 65.1, giữ nguyên thứ tự đặc tả. */
export const CONFLICT_KEYS = [
  'language.output',
  'length.words',
  'pov.camera',
  'dialogue.ratio',
  'prose.style',
  'character.autonomy',
  'character.knowledge',
  'history.wrapper',
  'memory.summary',
  'output.format',
  'output.status_panel',
  'reasoning.visibility',
  'content.maturity',
  'generation.temperature',
  'generation.context',
] as const;
export type ConflictKey = (typeof CONFLICT_KEYS)[number];

export const CHIEN_LUOC = [
  'exclusive_one',
  'merge_ordered',
  'min',
  'max_with_profile_cap',
  'native_wins',
  'user_choice',
] as const;
export type ChienLuoc = (typeof CHIEN_LUOC)[number];

/** Chiến lược giải cho từng khóa — 65.1 bảng thứ hai. */
export const CHIEN_LUOC_CUA: Readonly<Record<ConflictKey, ChienLuoc>> = Object.freeze({
  'language.output': 'exclusive_one',
  'length.words': 'min',
  'pov.camera': 'exclusive_one',
  'dialogue.ratio': 'user_choice',
  'prose.style': 'user_choice',
  'character.autonomy': 'merge_ordered',
  'character.knowledge': 'native_wins',
  'history.wrapper': 'exclusive_one',
  'memory.summary': 'merge_ordered',
  'output.format': 'native_wins',
  'output.status_panel': 'native_wins',
  'reasoning.visibility': 'native_wins',
  'content.maturity': 'user_choice',
  'generation.temperature': 'min',
  'generation.context': 'max_with_profile_cap',
});

const MAU_KHOA: readonly (readonly [ConflictKey, RegExp])[] = [
  ['language.output', /\b(respond|reply|write|answer)\s+in\s+\w+|viết bằng tiếng|trả lời bằng tiếng/i],
  ['length.words', /\b\d{2,5}\s*(words?|tokens?)\b|\b(\d+)\s*(từ|chữ)\b|độ dài[:：]/i],
  ['pov.camera', /\b(first|second|third)[- ]person\b|ngôi (thứ )?(nhất|hai|ba)/i],
  ['dialogue.ratio', /\bdialogue\s*(ratio|percentage|%)|tỉ lệ (thoại|đối thoại)/i],
  ['prose.style', /\b(prose|writing)\s+style|purple\s+prose|văn phong|lối viết|tránh (văn )?mẫu/i],
  [
    'character.autonomy',
    /\bcharacters?\s+(should\s+)?(act|have)\s+(their\s+own|autonom)|nhân vật (tự|có mục tiêu riêng)/i,
  ],
  ['character.knowledge', /\bcharacters?\s+(do\s+not|don't|shouldn't)\s+know\b|nhân vật không (được )?biết/i],
  ['history.wrapper', /\bchat\s+history\b|<\s*\/?\s*(history|chat_history)\s*>/i],
  ['memory.summary', /\b(summar(y|ize)|recap|compress)\b|tóm tắt|nén (ký ức|lịch sử)/i],
  ['output.format', /```json|\bjson\s+(schema|format)\b|xuất (đúng )?json|<\s*content\s*>/i],
  ['output.status_panel', /\b(status\s+(panel|bar|block)|stat\s+block)\b|bảng trạng thái/i],
  ['reasoning.visibility', /<\s*(thinking|reasoning|cot)\s*>|show[_ ]thoughts|chuỗi suy luận/i],
  ['content.maturity', /\b(nsfw|sfw|explicit|mature\s+content)\b|nội dung (người lớn|18\+)/i],
];

/** Suy ra conflict key từ nội dung + vai trò module. Gợi ý, không phải phán quyết. */
export function suyConflictKeys(m: {
  readonly content: string;
  readonly kind: ModuleKind;
  readonly lane: ModuleLane;
}): ConflictKey[] {
  const ra = new Set<ConflictKey>();
  for (const [k, re] of MAU_KHOA) if (re.test(m.content)) ra.add(k);
  if (m.kind === 'output_contract' || m.lane === 'output_contract') ra.add('output.format');
  if (m.kind === 'reasoning_request') ra.add('reasoning.visibility');
  if (m.lane === 'history' || m.lane === 'history_before' || m.lane === 'history_after') {
    ra.add('history.wrapper');
  }
  return [...ra].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

// ─────────────────────────────────────────── provides / requires

const MAU_TAG_MO = /<\s*([a-z][\w:-]{0,40})\s*>/gi;
const MAU_TAG_DONG = /<\s*\/\s*([a-z][\w:-]{0,40})\s*>/gi;
const MAU_SETVAR = /\{\{\s*(?:set|add|inc)(?:global)?var\s*::\s*([^:}]+)/gi;
const MAU_GETVAR = /\{\{\s*get(?:global)?var\s*::\s*([^:}]+)/gi;

/**
 * Suy `provides` / `requires` từ nội dung — 65.2.
 *
 * Nguồn suy: biến macro set/get, cặp tag mở/đóng, marker, prefill. Đây là đúng
 * danh sách đặc tả liệt kê; thêm nguồn đoán mò vào đây sẽ tạo cạnh giả và cycle giả.
 */
export function suyPhuThuoc(m: {
  readonly content: string;
  readonly kind: ModuleKind;
  readonly lane: ModuleLane;
}): { provides: string[]; requires: string[] } {
  const provides = new Set<string>();
  const requires = new Set<string>();

  for (const g of m.content.matchAll(MAU_SETVAR)) provides.add(`var:${(g[1] ?? '').trim()}`);
  for (const g of m.content.matchAll(MAU_GETVAR)) requires.add(`var:${(g[1] ?? '').trim()}`);

  const mo = new Set<string>();
  for (const g of m.content.matchAll(MAU_TAG_MO)) mo.add((g[1] ?? '').toLowerCase());
  const dong = new Set<string>();
  for (const g of m.content.matchAll(MAU_TAG_DONG)) dong.add((g[1] ?? '').toLowerCase());
  for (const t of mo) if (!dong.has(t)) provides.add(`tag:${t}`);
  for (const t of dong) if (!mo.has(t)) requires.add(`tag:${t}`);

  if (m.kind === 'slot') provides.add(`slot:${m.lane}`);
  if (m.kind === 'assistant_prefill') requires.add('slot:output_contract');

  // Biến vừa set vừa get trong cùng module không phải phụ thuộc ngoài.
  for (const p of provides) requires.delete(p);

  const sap = (s: Set<string>): string[] => [...s].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return { provides: sap(provides), requires: sap(requires) };
}

// ─────────────────────────────────────────── đồ thị

export type Canh = { readonly tu: string; readonly den: string; readonly khoa: string };

export type DoThiPhuThuoc = {
  readonly thuTu: readonly string[];
  readonly canh: readonly Canh[];
  /** Rỗng nghĩa là không có vòng — không phải "chưa kiểm". */
  readonly cycles: readonly (readonly string[])[];
  /** `requires` không ai `provides`. */
  readonly thieu: readonly { readonly moduleId: string; readonly khoa: string }[];
  readonly issues: readonly ImportIssue[];
};

/**
 * Topological sort trên đồ thị provides→requires.
 *
 * Ổn định: khi nhiều nút cùng sẵn sàng, chọn theo `order` rồi tới `id`. Nhờ vậy
 * cùng một pack luôn cho cùng một thứ tự, và diff giữa hai lần nhập đọc được.
 */
export function dungDoThi(modules: readonly PromptModule[]): DoThiPhuThuoc {
  const issues: ImportIssue[] = [];
  const nguoiCap = new Map<string, string[]>();
  for (const m of modules) {
    for (const p of m.provides) {
      const ds = nguoiCap.get(p) ?? [];
      ds.push(m.id);
      nguoiCap.set(p, ds);
    }
  }

  const canh: Canh[] = [];
  const thieu: { moduleId: string; khoa: string }[] = [];
  for (const m of modules) {
    for (const r of m.requires) {
      const caps = nguoiCap.get(r);
      if (caps === undefined || caps.length === 0) {
        thieu.push({ moduleId: m.id, khoa: r });
        continue;
      }
      for (const c of caps) {
        if (c !== m.id) canh.push({ tu: c, den: m.id, khoa: r });
      }
    }
  }

  const idSet = new Set(modules.map((m) => m.id));
  const vaoDo = new Map<string, number>([...idSet].map((id) => [id, 0]));
  const ke = new Map<string, string[]>();
  for (const c of canh) {
    ke.set(c.tu, [...(ke.get(c.tu) ?? []), c.den]);
    vaoDo.set(c.den, (vaoDo.get(c.den) ?? 0) + 1);
  }

  const uuTien = new Map(modules.map((m) => [m.id, m.order]));
  const sanSang = [...idSet].filter((id) => (vaoDo.get(id) ?? 0) === 0);
  const sapXep = (ds: string[]): string[] =>
    ds.sort((a, b) => {
      const oa = uuTien.get(a) ?? 0;
      const ob = uuTien.get(b) ?? 0;
      return oa !== ob ? oa - ob : a < b ? -1 : a > b ? 1 : 0;
    });

  const thuTu: string[] = [];
  const hangDoi = sapXep(sanSang);
  while (hangDoi.length > 0) {
    const id = hangDoi.shift() as string;
    thuTu.push(id);
    for (const n of ke.get(id) ?? []) {
      const con = (vaoDo.get(n) ?? 0) - 1;
      vaoDo.set(n, con);
      if (con === 0) {
        hangDoi.push(n);
        sapXep(hangDoi);
      }
    }
  }

  const conLai = [...idSet].filter((id) => !thuTu.includes(id));
  const cycles = conLai.length === 0 ? [] : timCycle(conLai, ke);

  for (const c of cycles) {
    issues.push({
      code: 'DEPENDENCY_CYCLE',
      severity: 'error',
      path: c.join(' → '),
      message:
        `Vòng phụ thuộc: ${c.join(' → ')}. Engine KHÔNG tự bẻ vòng bằng id (65.2) — ` +
        'hãy tắt một module trong vòng hoặc đổi module cấp nguồn.',
      details: { cycle: c },
    });
  }
  for (const t of thieu) {
    issues.push({
      code: 'PHU_THUOC_THIEU',
      severity: 'warning',
      path: t.moduleId,
      message: `Module cần "${t.khoa}" nhưng không module nào trong pack cung cấp nó.`,
      details: { khoa: t.khoa },
    });
  }

  return { thuTu, canh, cycles, thieu, issues };
}

/** Tìm các vòng cụ thể để hiện cho người dùng, thay vì báo "có vòng". */
function timCycle(conLai: readonly string[], ke: ReadonlyMap<string, string[]>): string[][] {
  const trongTap = new Set(conLai);
  const ra: string[][] = [];
  const mau = new Map<string, 0 | 1 | 2>();
  const ngan: string[] = [];

  const di = (id: string): void => {
    mau.set(id, 1);
    ngan.push(id);
    for (const n of ke.get(id) ?? []) {
      if (!trongTap.has(n)) continue;
      const m = mau.get(n) ?? 0;
      if (m === 0) {
        di(n);
      } else if (m === 1) {
        const vi = ngan.indexOf(n);
        if (vi >= 0) ra.push([...ngan.slice(vi), n]);
      }
    }
    ngan.pop();
    mau.set(id, 2);
  };

  for (const id of [...conLai].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    if ((mau.get(id) ?? 0) === 0) di(id);
  }
  return ra;
}

// ─────────────────────────────────────────── nhóm xung đột

export type NhomXungDot = {
  readonly khoa: ConflictKey;
  readonly chienLuoc: ChienLuoc;
  readonly moduleIds: readonly string[];
  /** `true` khi không có cách nào giải máy móc — người dùng phải chọn. */
  readonly canNguoiChon: boolean;
  readonly moTa: string;
};

const MO_TA: Readonly<Record<ChienLuoc, string>> = Object.freeze({
  exclusive_one: 'Chỉ một trong số này được bật. Chọn một.',
  merge_ordered: 'Ghép theo thứ tự, khử trùng lặp. Engine giải được.',
  min: 'Lấy giá trị chặt hơn. Engine giải được.',
  max_with_profile_cap: 'Lấy đề nghị cao hơn rồi clamp theo model thật. Engine giải được.',
  native_wins: 'Hợp đồng native luôn thắng. Module ngoài bị hạ xuống mức gợi ý.',
  user_choice: 'Hai bản khác nhau về văn phong. Xem trước rồi chọn.',
});

/** Gom module theo conflict key. Chỉ tính module đang bật — tắt thì không xung đột với ai. */
export function nhomXungDot(modules: readonly PromptModule[]): NhomXungDot[] {
  const theoKhoa = new Map<ConflictKey, string[]>();
  for (const m of modules) {
    if (!m.enabled) continue;
    for (const k of m.conflictKeys) {
      if (!(CONFLICT_KEYS as readonly string[]).includes(k)) continue;
      const key = k as ConflictKey;
      theoKhoa.set(key, [...(theoKhoa.get(key) ?? []), m.id]);
    }
  }

  const ra: NhomXungDot[] = [];
  for (const k of CONFLICT_KEYS) {
    const ids = theoKhoa.get(k);
    if (ids === undefined || ids.length < 2) continue;
    const cl = CHIEN_LUOC_CUA[k];
    ra.push({
      khoa: k,
      chienLuoc: cl,
      moduleIds: [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
      canNguoiChon: cl === 'exclusive_one' || cl === 'user_choice',
      moTa: MO_TA[cl],
    });
  }
  return ra;
}

/**
 * Giải trước những nhóm mà đặc tả nói giải được máy móc.
 *
 * Trả về bản đồ `khoa → moduleId[]` được giữ. Nhóm cần người chọn **không** nằm
 * trong kết quả: bỏ sót chúng ở đây là cố ý, để bước kích hoạt thấy còn thiếu.
 */
export function giaiTuDong(
  nhom: readonly NhomXungDot[],
  modules: readonly PromptModule[],
): Record<string, string[]> {
  const theoId = new Map(modules.map((m) => [m.id, m]));
  const ra: Record<string, string[]> = {};
  for (const n of nhom) {
    if (n.canNguoiChon) continue;
    if (n.chienLuoc === 'native_wins') {
      // Native thắng nghĩa là KHÔNG module ngoài nào được giữ cho khóa này.
      ra[n.khoa] = [];
      continue;
    }
    const ds = [...n.moduleIds].sort((a, b) => {
      const oa = theoId.get(a)?.order ?? 0;
      const ob = theoId.get(b)?.order ?? 0;
      return oa !== ob ? oa - ob : a < b ? -1 : 1;
    });
    ra[n.khoa] = n.chienLuoc === 'min' ? [ds[0] as string] : ds;
  }
  return ra;
}
