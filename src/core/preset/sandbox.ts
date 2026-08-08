/**
 * Bộ chạy regex của preset — bám ngữ nghĩa SillyTavern, KHÔNG cách ly.
 *
 * ── Điều đã đổi, và vì sao ──
 *
 * Bản trước dựng ba lớp rào quanh mỗi regex: chặn trước pattern có hình dạng quay
 * lui, cắt đầu vào ở 200.000 ký tự, và tự tắt vĩnh viễn một transform chạy quá
 * `maxRegexMs`. Ba lớp ấy có nghĩa khi preset là **dữ liệu của người lạ**. Với một
 * preset do chính người chơi viết thì cả ba chỉ làm một việc: khiến regex của họ
 * im lặng không chạy, và bắt họ đi tìm lý do trong một app không nói ra.
 *
 * Giờ regex chạy đúng như ở SillyTavern:
 *
 * - Mọi pattern `RegExp` biên được đều chạy. Không có danh sách hình dạng bị cấm.
 * - Không có trần độ dài văn bản.
 * - Thời gian chạy vẫn được ĐO, nhưng chỉ để báo cáo. Kết quả không bị vứt, và
 *   không transform nào bị tắt sau lưng người dùng.
 *
 * Thứ còn giữ lại là phần **ngữ nghĩa**: cách một pattern trần khác `/…/cờ`, cách
 * `$n` ứng với nhóm, `trimStrings`, `placement`, `minDepth`/`maxDepth`,
 * `markdownOnly`/`promptOnly` và `substituteRegex`. Đó mới là chỗ một khác biệt
 * nhỏ cho ra văn bản khác mà không ai thấy.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { TransformDef } from './schema.js';

/**
 * Trần ký tự CŨ, giữ lại làm hằng số tham chiếu cho chẩn đoán.
 *
 * Không còn nhánh nào trong file này dùng nó để từ chối chạy. `adapterMerge` vẫn
 * đọc nó để cảnh báo khi một message dài bất thường — cảnh báo, không phải chặn.
 */
export const MAX_KY_TU = 200_000;

export type RegexDaBien = {
  readonly re: RegExp;
  readonly toanBo: boolean;
};

/**
 * Biên một pattern nguồn thành `RegExp`, theo `regexFromString` của SillyTavern.
 *
 * Trả `null` chỉ khi chuỗi rỗng hoặc engine `RegExp` thật sự từ chối cú pháp.
 * Không throw: một throw ở đây sẽ nổ giữa đường render.
 *
 * ── Vì sao chuỗi trần KHÔNG được thêm cờ `g` ──
 *
 * `regexFromString` biên `"pattern"` thành `new RegExp(pattern)` **không cờ**; chỉ
 * dạng `/pattern/flags` mới mang cờ. Preset thật dùng mẫu neo kiểu `^([\s\S]*)$`
 * viết trần, và một cờ `g` ngầm đổi cả ngữ nghĩa: thay mọi lần khớp thay vì lần
 * đầu. Đó là loại sai không ai thấy — output vẫn ra, chỉ khác bản chạy ở ST.
 */
export function bienRegex(pattern: string): RegexDaBien | null {
  const s = pattern.trim();
  if (s === '') return null;
  const than = /^\/(.*)\/([gimsuy]*)$/s.exec(s);
  if (than) {
    try {
      const co = than[2] ?? '';
      return { re: new RegExp(than[1] as string, co), toanBo: co.includes('g') };
    } catch {
      // Tách theo /.../ hỏng thì thử coi cả chuỗi là pattern — đúng đường lùi của ST.
    }
  }
  try {
    return { re: new RegExp(s), toanBo: false };
  } catch {
    return null;
  }
}

/** Escape mọi ký tự có nghĩa trong regex — dùng cho `substituteRegex = 2`. */
export function thoatRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────── sanitizer (tùy chọn)

const THE_CAM = /<\s*\/?\s*(script|iframe|object|embed|form|link|meta|base|style)\b[^>]*>/gi;
const HANDLER = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const URL_CAM =
  /\b(?:href|src|action|formaction|xlink:href)\s*=\s*(?:"|')?\s*(?:javascript|data|vbscript):[^"'\s>]*/gi;
const STYLE_REMOTE = /\bstyle\s*=\s*(?:"[^"]*url\s*\([^)]*\)[^"]*"|'[^']*url\s*\([^)]*\)[^']*')/gi;

export type KetQuaLamSach = {
  readonly html: string;
  readonly daBo: readonly string[];
};

/**
 * Làm sạch HTML — giữ lại cho nơi nào CHỦ ĐỘNG cần bản đã khử.
 *
 * Đường hiển thị mặc định không còn gọi hàm này: HTML do preset sinh ra được
 * render thẳng, vì script của chính preset cần bám vào DOM ấy để trang trí.
 */
export function lamSachHtml(html: string): KetQuaLamSach {
  const daBo: string[] = [];
  let ra = html;

  const bo = (re: RegExp, nhan: string): void => {
    const truoc = ra;
    ra = ra.replace(re, '');
    if (ra !== truoc) daBo.push(nhan);
  };

  bo(THE_CAM, 'thẻ nguy hiểm (script/iframe/form/style/link/meta/base)');
  bo(HANDLER, 'thuộc tính bắt sự kiện (on*)');
  bo(URL_CAM, 'URL javascript:/data:/vbscript:');
  bo(STYLE_REMOTE, 'style có url() ngoài');

  return { html: ra, daBo };
}

// ─────────────────────────────────────────── chạy transform

export type KetQuaTransform = {
  /** Văn bản sau khi áp. Bằng đầu vào khi không transform nào khớp. */
  readonly text: string;
  readonly daApDung: readonly string[];
  readonly daBoQua: readonly { readonly id: string; readonly lyDo: string }[];
  readonly issues: readonly ImportIssue[];
  /**
   * Transform chạy lâu hơn `maxRegexMs` — **chỉ để báo**.
   *
   * Kết quả của chúng vẫn được giữ và chúng vẫn chạy ở lượt sau. Trường này tồn
   * tại để Xưởng Preset chỉ đúng regex nào đang làm chậm lượt kể, không phải để
   * một tầng nào đó tự tắt nó đi.
   */
  readonly cham: readonly { readonly id: string; readonly ms: number }[];
};

/**
 * Áp một chuỗi transform lên một khối văn bản.
 *
 * `dongHo` được tiêm vào thay vì gọi `performance.now()` trực tiếp: `core/` không
 * được đọc đồng hồ máy (luật bất biến #7), và test cần đo được đường "chạy lâu"
 * mà không phải chờ thật.
 */
export function apTransform(input: {
  readonly text: string;
  readonly transforms: readonly TransformDef[];
  readonly maxRegexMs: number;
  readonly dongHo?: () => number;
  /** 1 = user input, 2 = AI output, 5 = world info… — theo `placement` của ST. */
  readonly placement?: number;
  readonly destination?: 'display' | 'prompt';
  /** 0 là tin mới nhất; số lớn hơn là tin cũ hơn trong lịch sử. */
  readonly depth?: number;
  /**
   * Tập id transform mà NGƯỜI DÙNG đang bật, nếu tầng trên đã quyết.
   *
   * Có trường này thì nó là nguồn chân lý duy nhất về bật/tắt và `batONguon` bị
   * bỏ qua. Vắng nó thì `batONguon` là mặc định — đường mà pipeline nhập và bản
   * xem trước dùng, nơi chưa có cấu hình nhánh nào để hỏi.
   */
  readonly daBat?: ReadonlySet<string>;
  /** Macro SillyTavern trong replacement, do tầng store cấp ngữ cảnh. */
  readonly thayMacro?: (text: string, transform: TransformDef) => string;
}): KetQuaTransform {
  const { text, transforms, maxRegexMs } = input;
  const daBat = input.daBat;
  const dongHo = input.dongHo ?? (() => 0);
  const placement = input.placement ?? 2;
  const destination = input.destination ?? 'display';
  const depth = input.depth ?? 0;

  const daApDung: string[] = [];
  const daBoQua: { id: string; lyDo: string }[] = [];
  const issues: ImportIssue[] = [];
  const cham: { id: string; ms: number }[] = [];
  let ra = text;

  for (const t of transforms) {
    const bat = daBat === undefined ? t.batONguon : daBat.has(t.id);
    if (!bat) {
      daBoQua.push({
        id: t.id,
        lyDo: daBat === undefined ? 'đã tắt trong preset nguồn' : 'đang tắt trong cấu hình pack',
      });
      continue;
    }
    if (!t.placement.includes(placement)) {
      daBoQua.push({ id: t.id, lyDo: `không áp ở placement ${placement}` });
      continue;
    }
    /*
     * Chặn dưới `minDepth >= -1` và `maxDepth >= 0` là của ST (`getRegexedString`):
     * giá trị ngoài khoảng đó nghĩa là "không đặt guard", không phải "chặn tất".
     * Thiếu chặn dưới thì một preset khai `maxDepth: -1` sẽ tắt im lặng chính
     * regex của nó ở mọi tin nhắn.
     */
    if (t.minDepth !== null && t.minDepth >= -1 && depth < t.minDepth) {
      daBoQua.push({ id: t.id, lyDo: `depth ${depth} nhỏ hơn minDepth ${t.minDepth}` });
      continue;
    }
    if (t.maxDepth !== null && t.maxDepth >= 0 && depth > t.maxDepth) {
      daBoQua.push({ id: t.id, lyDo: `depth ${depth} lớn hơn maxDepth ${t.maxDepth}` });
      continue;
    }
    if (destination === 'display' && t.promptOnlyNguon && !t.markdownOnlyNguon) {
      daBoQua.push({ id: t.id, lyDo: 'chỉ áp vào prompt' });
      continue;
    }
    if (destination === 'prompt' && t.markdownOnlyNguon && !t.promptOnlyNguon) {
      daBoQua.push({ id: t.id, lyDo: 'chỉ áp khi hiển thị' });
      continue;
    }

    /*
     * `substituteRegex` của ST: 0 = giữ nguyên, 1 = thay macro vào `findRegex`,
     * 2 = thay macro rồi escape kết quả để nó thành chuỗi khớp nguyên văn.
     *
     * Bản trước chỉ ghi một cảnh báo rồi dùng pattern thô, nên một regex khai
     * `substituteRegex: 1` với thân `{{user}}` sẽ đi tìm sáu ký tự "{{user}}"
     * trong output và không bao giờ khớp.
     */
    const patternHieuLuc =
      t.substituteRegex === 0 || input.thayMacro === undefined
        ? t.pattern
        : t.substituteRegex === 2
          ? thoatRegex(input.thayMacro(t.pattern, t))
          : input.thayMacro(t.pattern, t);

    const bien = bienRegex(patternHieuLuc);
    if (bien === null) {
      daBoQua.push({ id: t.id, lyDo: 'pattern không biên được bằng RegExp' });
      issues.push({
        code: 'REGEX_TU_CHOI',
        severity: 'warning',
        path: t.id,
        message: `Regex "${t.ten}" không biên được: engine RegExp từ chối cú pháp này. Giữ nguyên văn bản.`,
        details: { pattern: patternHieuLuc.slice(0, 120) },
      });
      continue;
    }

    const batDau = dongHo();
    let sau: string;
    try {
      sau = ra.replace(bien.re, (...args: unknown[]) => {
        /*
         * Callback của `String.replace` là `(match, p1..pn, offset, string[, groups])`.
         * `groups` CHỈ có mặt khi pattern dùng named group, nên phải cắt từ cuối:
         * đếm từ đầu thì `$3` của một regex hai nhóm bốc phải `offset` hoặc cả chuỗi
         * đầu vào rồi chèn nó vào output.
         */
        const cuoi = args.at(-1);
        const coNhomTen = typeof cuoi === 'object' && cuoi !== null;
        const nhomTen = coNhomTen ? (cuoi as Record<string, unknown>) : undefined;
        /** `[toàn bộ khớp, p1, …, pn]`. */
        const nhomSo = args.slice(0, args.length - (coNhomTen ? 3 : 2));

        const daChenNhom = t.thayThe.replace(
          /\{\{match\}\}|\$&|\$(\d{1,2})|\$<([^>]+)>/gi,
          (raw: string, so: string | undefined, tenNhom: string | undefined): string => {
            const gt =
              so !== undefined ? nhomSo[Number(so)] : tenNhom !== undefined ? nhomTen?.[tenNhom] : nhomSo[0]; // `{{match}}` và `$&` — toàn bộ phần khớp.
            /*
             * Nhóm không tham gia lần khớp này (`undefined`) thì giữ nguyên `$n`,
             * đúng như SillyTavern. Trả '' ở đây là nuốt nội dung mà không ai thấy.
             * Nhóm khớp CHUỖI RỖNG vẫn là chuỗi — nó được chèn bình thường.
             */
            if (typeof gt !== 'string') return raw;
            let loc = gt;
            for (const trim of t.trimStrings) loc = loc.split(trim).join('');
            return loc;
          },
        );
        return input.thayMacro?.(daChenNhom, t) ?? daChenNhom;
      });
    } catch (e) {
      daBoQua.push({ id: t.id, lyDo: 'lỗi khi thay thế' });
      issues.push({
        code: 'REGEX_LOI_THAY_THE',
        severity: 'warning',
        path: t.id,
        message: `Regex "${t.ten}" lỗi khi thay thế: ${e instanceof Error ? e.message : String(e)}`,
        details: {},
      });
      continue;
    }
    const troi = dongHo() - batDau;

    /*
     * Chạy lâu thì NÓI, không tự tắt.
     *
     * Bản trước vứt kết quả và tắt transform cho các lượt sau. Với preset tự
     * viết thì đó là hành vi tệ nhất có thể: một regex nặng nhưng đúng sẽ biến
     * mất sau lần chạy đầu, và người dùng chỉ thấy "lần đầu đúng, từ lần hai thì
     * không". Giữ kết quả, ghi một dòng chẩn đoán, để người dùng tự quyết.
     */
    if (troi > maxRegexMs) {
      cham.push({ id: t.id, ms: troi });
      issues.push({
        code: 'REGEX_CHAY_LAU',
        severity: 'info',
        path: t.id,
        message:
          `Regex "${t.ten}" chạy ${troi} ms (ngưỡng chẩn đoán ${maxRegexMs} ms). ` +
          'Kết quả vẫn được dùng; đây chỉ là cảnh báo hiệu năng.',
        details: { ms: troi, nguong: maxRegexMs },
      });
    }

    ra = sau;
    daApDung.push(t.id);
  }

  return { text: ra, daApDung, daBoQua, issues, cham };
}

/**
 * Áp transform lên **chuỗi prompt** trước khi gửi AI.
 *
 * Cùng bộ luật, chỉ khác `destination`, nên regex khai `promptOnly` chạy ở đây và
 * regex khai `markdownOnly` thì không.
 */
export function apPromptTransform(input: {
  readonly text: string;
  readonly transforms: readonly TransformDef[];
  readonly maxRegexMs: number;
  readonly dongHo?: () => number;
  readonly placement?: number;
  readonly depth?: number;
  readonly daBat?: ReadonlySet<string>;
  readonly thayMacro?: (text: string, transform: TransformDef) => string;
}): KetQuaTransform {
  if (input.transforms.length === 0) {
    return { text: input.text, daApDung: [], daBoQua: [], issues: [], cham: [] };
  }
  return apTransform({ ...input, destination: 'prompt' });
}
