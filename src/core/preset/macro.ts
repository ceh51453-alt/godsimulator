/**
 * Macro compatibility — Phần 63.5 [BB].
 *
 * ── Vì sao là AST chứ không phải `String.replace` ──
 *
 * Đặc tả nói thẳng: "Macro được parse thành AST, không dùng replace chuỗi tùy
 * tiện." Lý do rất cụ thể. `{{setvar::x::{{getvar::y}}}}` có macro lồng trong đối
 * số; một chuỗi `replace` chạy từ trái sang phải sẽ cắt sai dấu `::` bên trong và
 * đặt biến `x` bằng một chuỗi rác — âm thầm, không báo lỗi, và sai suốt ván chơi.
 *
 * ── Ba luật của file này ──
 *
 * 1. Macro không biết thì **giữ nguyên raw** và ghi cảnh báo. Không làm tắt cả module.
 * 2. Biến nằm trong namespace `preset.<packId>` — [BB] không chạm World.
 * 3. `{{random::…}}` seeded theo `sceneId + moduleId + turn`, không `Math.random`.
 */
import { taoRng } from '../engine/rng.js';
import type { ImportIssue } from '../contracts/primitives.js';

// ─────────────────────────────────────────── AST

export type NutMacro =
  | { readonly loai: 'van'; readonly text: string }
  | {
      readonly loai: 'macro';
      readonly ten: string;
      /** Mỗi đối số lại là một cây con — macro lồng nhau là chuyện thường. */
      readonly doiSo: readonly (readonly NutMacro[])[];
      readonly raw: string;
    };

/** Macro có ánh xạ native — 63.5. Mọi thứ ngoài danh sách này là `needs_adapter`. */
export const MACRO_BIET = [
  'char',
  'user',
  'persona',
  'description',
  'lastusermessage',
  'trim',
  'newline',
  'random',
  'pick',
  'reverse',
  'setvar',
  'getvar',
  'addvar',
  'incvar',
  'decvar',
  'setglobalvar',
  'getglobalvar',
  'addglobalvar',
  'incglobalvar',
  'decglobalvar',
  'noop',
  'roll',
  'macro',
] as const;

const BIET = new Set<string>(MACRO_BIET);

/** Macro global bị chuyển vào namespace pack — 63.5, kèm cảnh báo đổi semantics. */
const GLOBAL_SANG_PACK: Readonly<Record<string, string>> = Object.freeze({
  setglobalvar: 'setvar',
  getglobalvar: 'getvar',
  addglobalvar: 'addvar',
  incglobalvar: 'incvar',
  decglobalvar: 'decvar',
});

/**
 * Macro mà SillyTavern cho viết `{{tên:đối}}` hoặc `{{tên đối}}`, không chỉ `{{tên::đối}}`.
 *
 * Nguồn: `macros.js` dùng `/{{random\s?::?([^}]+)}}/`, `/{{pick\s?::?([^}]+)}}/`,
 * `/{{roll[ : ]([^}]+)}}/`, `/{{reverse:(.+?)}}/`. Dạng một dấu hai chấm là dạng
 * viết phổ biến nhất trong preset thật, nên không nhận nó nghĩa là cả macro rơi
 * xuống nhánh "chưa hỗ trợ" và ở lại nguyên văn trong prompt.
 */
const MACRO_DINH_DOI_SO: ReadonlySet<string> = new Set(['roll', 'random', 'pick', 'reverse']);

/**
 * Tách một chuỗi thành cây macro.
 *
 * Bộ quét đếm ngoặc thật sự thay vì tìm `}}` gần nhất, nên `{{a::{{b}}}}` cho ra
 * một macro `a` với một đối số là macro `b`, chứ không phải hai mảnh vỡ.
 */
export function docMacro(text: string): NutMacro[] {
  const ra: NutMacro[] = [];
  let i = 0;
  let dem = '';

  const xaVan = (): void => {
    if (dem !== '') {
      ra.push({ loai: 'van', text: dem });
      dem = '';
    }
  };

  while (i < text.length) {
    if (text.startsWith('{{', i)) {
      const ket = timDongNgoac(text, i);
      if (ket < 0) {
        // Ngoặc không đóng — đây là văn bản, không phải macro hỏng.
        dem += text.slice(i);
        break;
      }
      const raw = text.slice(i, ket + 2);
      const than = text.slice(i + 2, ket);
      xaVan();
      ra.push(dungNutMacro(than, raw));
      i = ket + 2;
      continue;
    }
    dem += text[i];
    i++;
  }
  xaVan();
  return ra;
}

/** Trả về chỉ số của `}}` khớp với `{{` ở `batDau`, hoặc -1. */
function timDongNgoac(text: string, batDau: number): number {
  let sau = 0;
  let i = batDau;
  while (i < text.length - 1) {
    if (text.startsWith('{{', i)) {
      sau++;
      i += 2;
      continue;
    }
    if (text.startsWith('}}', i)) {
      sau--;
      if (sau === 0) return i;
      i += 2;
      continue;
    }
    i++;
  }
  return -1;
}

function dungNutMacro(than: string, raw: string): NutMacro {
  // Comment `{{//...}}` — 63.5: bỏ khi compile, giữ trong raw source.
  if (than.startsWith('//')) {
    return { loai: 'macro', ten: 'noop', doiSo: [], raw };
  }
  const phan = tachTheoHaiHaiCham(than);
  const dau = (phan[0] ?? '').trim();
  let ten = dau.toLowerCase();
  /*
   * Tách `{{roll:d100}}` · `{{roll 1d9}}` · `{{random:a,b}}` thành tên + đối số.
   *
   * Cắt từ `dau` (chuỗi GỐC) chứ không từ `ten`: cắt từ bản đã viết thường sẽ
   * biến `{{random:Nguyệt,Tướng}}` thành hai lựa chọn `nguyệt` và `tướng`.
   */
  const dinh = /^([a-z_][a-z0-9_]*)[\s:]([\s\S]+)$/i.exec(dau);
  if (dinh !== null && MACRO_DINH_DOI_SO.has((dinh[1] as string).toLowerCase())) {
    ten = (dinh[1] as string).toLowerCase();
    phan.splice(1, 0, dinh[2] as string);
  }
  const doiSo = phan.slice(1).map((p) => docMacro(p));
  return { loai: 'macro', ten, doiSo, raw };
}

/** Mảng JSON (hoặc mảng thật) — `addvar` của ST push vào nó thay vì cộng. */
function laMang(v: unknown): unknown[] | null {
  if (Array.isArray(v)) return v;
  if (typeof v !== 'string') return null;
  try {
    const p: unknown = JSON.parse(v);
    return Array.isArray(p) ? p : null;
  } catch {
    return null;
  }
}

/**
 * Cộng dồn biến theo đúng `addLocalVariable` của SillyTavern: mảng JSON thì push,
 * hai vế đều đọc được thành số thì cộng số, **còn lại thì nối chuỗi**.
 *
 * Ép số vô điều kiện là chỗ từng làm hỏng preset thật mà không ai thấy. Fixture A
 * gọi `{{addvar::…}}` 64 lần và **62 lần giá trị là văn bản** — kiểu
 * `{{addvar::output_language::Tiếng Việt}}` hay cả một khối luật nhiều dòng. Ép số
 * biến từng khối ấy thành `0`, rồi `{{getvar}}` in ra "0": preset vẫn chạy, prompt
 * vẫn gửi đi, và toàn bộ nội dung tác giả gom vào biến đã bốc hơi.
 */
function congBien(cu: unknown, them: string): unknown {
  const mang = laMang(cu);
  if (mang !== null) return [...mang, them];
  const soThem = Number(them);
  const soCu = Number(cu ?? 0);
  if (Number.isNaN(soThem) || Number.isNaN(soCu))
    return `${cu === undefined || cu === null ? '' : String(cu)}${them}`;
  return soCu + soThem;
}

/** Biến in ra prompt: chuỗi giữ nguyên, thứ khác về JSON — dùng chung getvar/incvar. */
function inBien(gt: unknown): string {
  if (gt === undefined || gt === null) return '';
  return typeof gt === 'string' ? gt : JSON.stringify(gt);
}

/** Tách theo `::` ở mức ngoài cùng — không cắt vào `::` nằm trong macro lồng. */
function tachTheoHaiHaiCham(s: string): string[] {
  const ra: string[] = [];
  let sau = 0;
  let dem = '';
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('{{', i)) {
      sau++;
      dem += '{{';
      i += 2;
      continue;
    }
    if (s.startsWith('}}', i)) {
      sau = Math.max(0, sau - 1);
      dem += '}}';
      i += 2;
      continue;
    }
    if (sau === 0 && s.startsWith('::', i)) {
      ra.push(dem);
      dem = '';
      i += 2;
      continue;
    }
    dem += s[i];
    i++;
  }
  ra.push(dem);
  return ra;
}

/** Tên mọi macro xuất hiện trong một chuỗi, kể cả lồng nhau. Đã khử trùng, đã sắp. */
export function macroTrongChuoi(text: string): string[] {
  const ra = new Set<string>();
  const di = (ds: readonly NutMacro[]): void => {
    for (const n of ds) {
      if (n.loai !== 'macro') continue;
      ra.add(n.ten);
      for (const d of n.doiSo) di(d);
    }
  };
  di(docMacro(text));
  return [...ra].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** Macro nào trong chuỗi chưa có ánh xạ native. */
export function macroChuaHoTro(text: string): string[] {
  return macroTrongChuoi(text).filter((m) => !BIET.has(m));
}

// ─────────────────────────────────────────── giải

export type NguCanhMacro = {
  /** Tên chủ thể đang được kể — lấy từ `WorldView` đã chiếu, không từ World thô. */
  readonly char: string;
  /**
   * [BB] Phần 78.11 — `{{user}}` chỉ nhận `ProjectedPlayerPersona`.
   * Không có đường nào từ đây tới `PlayerProfile`.
   */
  readonly user: string;
  readonly persona: string;
  readonly description: string;
  readonly lastUserMessage: string;
  readonly sceneId: string;
  readonly moduleId: string;
  readonly turn: number;
  readonly maxDepth: number;
  /** Biến của pack. Khóa KHÔNG mang tiền tố; namespace nằm ở tầng lưu. */
  readonly bien: Readonly<Record<string, unknown>>;
};

export type KetQuaGiai = {
  readonly text: string;
  /** Macro không biết, giữ nguyên raw trong `text`. */
  readonly chuaGiai: readonly string[];
  readonly bienSau: Readonly<Record<string, unknown>>;
  readonly issues: readonly ImportIssue[];
  /** Directive `{{trim}}` đã gặp — compiler dùng để cắt whitespace hai đầu. */
  readonly canTrim: boolean;
};

/** Namespace biến của một pack — 63.5 [BB]. */
export function khoaBienPack(packId: string, ten: string): string {
  return `preset.${packId}.${ten}`;
}

/**
 * Giải macro trên một chuỗi.
 *
 * `maxDepth` đến từ `tuning.preset.maxMacroDepth`. Vượt giới hạn không throw —
 * nó trả về raw kèm một issue, đúng nguyên tắc 4 (mâu thuẫn thành nội dung).
 */
export function giaiMacro(text: string, ctx: NguCanhMacro): KetQuaGiai {
  const chuaGiai = new Set<string>();
  const issues: ImportIssue[] = [];
  const bien: Record<string, unknown> = { ...ctx.bien };
  let canTrim = false;
  let demRandom = 0;

  const giaiDs = (ds: readonly NutMacro[], sau: number, dangGiai: readonly string[]): string => {
    let ra = '';
    for (const n of ds) {
      ra += n.loai === 'van' ? n.text : giaiMot(n, sau, dangGiai);
    }
    return ra;
  };

  const doiSoThanhChuoi = (
    n: Extract<NutMacro, { loai: 'macro' }>,
    vi: number,
    sau: number,
    dangGiai: readonly string[],
  ): string => giaiDs(n.doiSo[vi] ?? [], sau, dangGiai);

  const giaiMot = (
    n: Extract<NutMacro, { loai: 'macro' }>,
    sau: number,
    dangGiai: readonly string[],
  ): string => {
    if (sau > ctx.maxDepth) {
      issues.push({
        code: 'MACRO_QUA_SAU',
        severity: 'warning',
        path: n.raw,
        message: `Macro lồng quá ${ctx.maxDepth} tầng (tuning.preset.maxMacroDepth). Giữ nguyên văn bản gốc.`,
        details: { ten: n.ten, sau },
      });
      return n.raw;
    }

    const ten = GLOBAL_SANG_PACK[n.ten] ?? n.ten;
    if (ten !== n.ten) {
      issues.push({
        code: 'GLOBAL_VAR_DOI_PHAM_VI',
        severity: 'warning',
        path: n.raw,
        message:
          `"${n.ten}" là biến toàn cục ở hệ nguồn. Nó đã được chuyển vào namespace của pack — ` +
          'ngữ nghĩa đã đổi: biến này không còn xuyên save.',
        details: { tuMacro: n.ten, thanhMacro: ten },
      });
    }

    switch (ten) {
      case 'noop':
        return '';
      case 'char':
        return ctx.char;
      case 'user':
      case 'persona':
        return ctx.user === '' ? ctx.persona : ctx.user;
      case 'description':
        return ctx.description;
      case 'lastusermessage':
        return ctx.lastUserMessage;
      case 'trim':
        canTrim = true;
        return '';
      case 'newline':
        return '\n';

      case 'reverse':
        return [...doiSoThanhChuoi(n, 0, sau + 1, dangGiai)].reverse().join('');

      case 'random':
      case 'pick': {
        let lua = n.doiSo.map((_, i) => doiSoThanhChuoi(n, i, sau + 1, dangGiai));
        // ST: một đối số duy nhất có dấu phẩy thì tách theo phẩy và cắt khoảng
        // trắng hai đầu; `\,` là dấu phẩy thật, không phải dấu tách.
        if (lua.length === 1 && (lua[0] as string).includes(',')) {
          lua = (lua[0] as string).split(/(?<!\\),/).map((s) => s.trim().replace(/\\,/g, ','));
        }
        if (lua.length === 0) return '';
        // [BB] Seeded theo scene + module + turn + số thứ tự lần rút trong module.
        const rng = taoRng(`${ctx.sceneId}#${ctx.moduleId}#${ctx.turn}#${demRandom++}`);
        return lua[rng.nguyen(lua.length)] ?? '';
      }

      case 'roll': {
        const raw = doiSoThanhChuoi(n, 0, sau + 1, dangGiai)
          .trim()
          .toLowerCase();
        const xucXac = /^(?:(\d+)d)?(\d+)(?:\s*([+-])\s*(\d+))?$/.exec(raw.replace(/^d/, '1d'));
        if (xucXac === null) return n.raw;
        const soVien = Math.max(1, Math.min(100, Number(xucXac[1] ?? 1)));
        const soMat = Math.max(1, Math.min(1_000_000, Number(xucXac[2] ?? 1)));
        const bu = Number(xucXac[4] ?? 0) * (xucXac[3] === '-' ? -1 : 1);
        const rng = taoRng(`${ctx.sceneId}#${ctx.moduleId}#${ctx.turn}#roll#${demRandom++}`);
        let tong = bu;
        for (let i = 0; i < soVien; i++) tong += rng.nguyen(soMat) + 1;
        return String(tong);
      }

      case 'macro': {
        // {{macro::summon_writer::Tên}} là macro mở rộng dùng trong Ako. Runtime
        // không triệu hồi agent/script; nội dung phong cách vẫn được giữ trong prompt.
        const loai = doiSoThanhChuoi(n, 0, sau + 1, dangGiai)
          .trim()
          .toLowerCase();
        if (loai === 'summon_writer') return doiSoThanhChuoi(n, 1, sau + 1, dangGiai);
        return n.raw;
      }

      case 'setvar': {
        const khoa = doiSoThanhChuoi(n, 0, sau + 1, dangGiai).trim();
        const gt = doiSoThanhChuoi(n, 1, sau + 1, dangGiai);
        if (khoa !== '') bien[khoa] = gt;
        return '';
      }
      case 'addvar': {
        const khoa = doiSoThanhChuoi(n, 0, sau + 1, dangGiai).trim();
        if (khoa === '') return '';
        bien[khoa] = congBien(bien[khoa], doiSoThanhChuoi(n, 1, sau + 1, dangGiai));
        return ''; // ST ghi im lặng: `{{addvar}}` không in gì ra prompt.
      }
      case 'incvar':
      case 'decvar': {
        const khoa = doiSoThanhChuoi(n, 0, sau + 1, dangGiai).trim();
        if (khoa === '') return '';
        bien[khoa] = congBien(bien[khoa], ten === 'incvar' ? '1' : '-1');
        // Khác `addvar`: ST **in ra** giá trị mới (`incrementLocalVariable` trả về nó).
        return inBien(bien[khoa]);
      }
      case 'getvar': {
        const khoa = doiSoThanhChuoi(n, 0, sau + 1, dangGiai).trim();
        if (dangGiai.includes(khoa)) {
          // [BB] 63.5 — cycle biến thì compile fail CÓ ĐƯỜNG DẪN cycle.
          issues.push({
            code: 'MACRO_CYCLE',
            severity: 'error',
            path: n.raw,
            message: `Biến preset tạo vòng lặp: ${[...dangGiai, khoa].join(' → ')}. Pack chưa gỡ vòng thì chưa biên dịch được.`,
            details: { cycle: [...dangGiai, khoa] },
          });
          return '';
        }
        const s = inBien(bien[khoa]);
        if (s === '') return '';
        // Giá trị biến có thể chứa macro — giải tiếp, có chống vòng.
        return s.includes('{{') ? giaiDs(docMacro(s), sau + 1, [...dangGiai, khoa]) : s;
      }

      default:
        // Comment macro — {{//text}} → xóa âm thầm, không lãng phí token.
        // Preset SillyTavern dùng {{//...}} như chú thích cho người viết preset.
        if (n.ten.startsWith('//')) return '';

        chuaGiai.add(n.ten);
        issues.push({
          code: 'MACRO_CAN_ADAPTER',
          severity: 'warning',
          path: n.raw,
          message: `Macro "${n.ten}" chưa có ánh xạ native. Giữ nguyên văn bản gốc; không đoán bằng regex (63.5).`,
          details: { ten: n.ten },
        });
        return n.raw;
    }
  };

  const out = giaiDs(docMacro(text), 0, []);
  return {
    text: canTrim ? out.trim() : out,
    chuaGiai: [...chuaGiai].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    bienSau: bien,
    issues,
    canTrim,
  };
}
