/**
 * Bước 8 của pipeline nhập — quét an toàn. Phần 64.4, 64.5.
 *
 * ── Hai câu quyết định file này ──
 *
 * [BB] 64.5: **classifier chỉ gắn nhãn, không tự xóa.** Một importer tự xóa thứ
 * nó không thích là một importer làm mất dữ liệu của người dùng mà không hỏi.
 * Nên mọi hàm ở đây trả về *nhãn* và *lý do*; quyết định bật/tắt nằm ở bảng quy
 * tắc kích hoạt bên dưới, và quyết định cuối cùng nằm ở người dùng.
 *
 * [BB] 64.4: khóa `__proto__`, `prototype`, `constructor` ở object nhập → **từ
 * chối node đó**. Không phải "làm sạch rồi nhận" — từ chối, và nói đã từ chối cái gì.
 */
import type { ImportIssue } from '../contracts/primitives.js';

// ─────────────────────────────────────────── nhãn rủi ro

export const NHAN_RUI_RO = [
  'jailbreak_like',
  'reasoning_request',
  'tool_request',
  'state_write_claim',
  'visibility_override',
  'output_contract_conflict',
  'sensitive_content',
] as const;
export type NhanRuiRo = (typeof NHAN_RUI_RO)[number];

/**
 * Quy tắc kích hoạt theo nhãn — 64.5.
 *
 * Ba nhãn đầu là **vượt quyền**: một prompt ngoài đòi ghi state, đòi gọi tool,
 * hay đòi đổi tầm nhìn thì nó đang đòi thứ mà kể cả role `system` của API cũng
 * không cho (65.3). Cách ly, không thương lượng.
 */
export const XU_LY_THEO_NHAN: Readonly<Record<NhanRuiRo, 'quarantine' | 'disable' | 'nhan_thoi'>> =
  Object.freeze({
    visibility_override: 'quarantine',
    state_write_claim: 'quarantine',
    tool_request: 'quarantine',
    reasoning_request: 'disable',
    jailbreak_like: 'nhan_thoi',
    output_contract_conflict: 'nhan_thoi',
    sensitive_content: 'nhan_thoi',
  });

type Mau = readonly [NhanRuiRo, RegExp, string];

/**
 * Mẫu nhận nhãn.
 *
 * Cố ý viết cả tiếng Việt lẫn tiếng Anh: hai fixture thật trộn ba thứ tiếng
 * trong cùng một file, và một classifier chỉ đọc tiếng Anh sẽ bỏ sót đúng những
 * module người Việt viết cho người Việt.
 */
const MAU_NHAN: readonly Mau[] = [
  [
    'jailbreak_like',
    /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)\b|bỏ qua (mọi|tất cả|các) (chỉ dẫn|hướng dẫn|quy tắc)/i,
    'yêu cầu bỏ qua chỉ dẫn trước đó',
  ],
  [
    'jailbreak_like',
    /\b(no\s+restrictions?|without\s+(any\s+)?(limits?|restrictions?|censorship)|unfiltered|no\s+refusals?)\b|không (có )?(giới hạn|kiểm duyệt|từ chối)/i,
    'tuyên bố gỡ giới hạn',
  ],
  [
    'reasoning_request',
    /\b(show|reveal|print|output|display)\s+(your\s+)?(chain[- ]of[- ]thought|reasoning|thinking|thought\s+process)\b|show_thoughts|hiện (chuỗi )?suy luận/i,
    'đòi in chuỗi suy luận',
  ],
  ['reasoning_request', /<\s*(thinking|thought|reasoning|cot)\s*>/i, 'dùng thẻ suy luận trong khuôn output'],
  [
    'tool_request',
    /\b(function[_ ]call(ing)?|tool[_ ]call(ing)?|use\s+the\s+(browser|search|terminal|api)\s+tool)\b/i,
    'đòi gọi tool/function',
  ],
  [
    'state_write_claim',
    /\b(update|write|modify|set)\s+(the\s+)?(world\s+state|game\s+state|database|variables?)\b|(ghi|sửa|cập nhật) (thẳng )?(trạng thái|state|cơ sở dữ liệu)/i,
    'tự nhận quyền ghi trạng thái',
  ],
  [
    'visibility_override',
    /\b(ignore|bypass|override)\s+(the\s+)?(visibility|fog|permission|privacy)\b|(bỏ qua|vượt|ghi đè) (tầm nhìn|sương mù|quyền riêng tư)/i,
    'đòi vượt lọc tầm nhìn',
  ],
  [
    'visibility_override',
    /\byou\s+(know|can\s+see)\s+everything\b|bạn (biết|thấy) (được )?(tất cả|mọi thứ)/i,
    'tuyên bố toàn tri',
  ],
  [
    'output_contract_conflict',
    /```json|\breturn\s+(only\s+)?(valid\s+)?json\b|chỉ (trả về|xuất) json/i,
    'áp khuôn output riêng',
  ],
  [
    'sensitive_content',
    /\b(nsfw|explicit\s+content|erotic|smut|gore)\b|nội dung (người lớn|18\+)/i,
    'nội dung cần cổng cài đặt riêng',
  ],
];

export type NhanDaGan = { readonly nhan: NhanRuiRo; readonly lyDo: string };

/**
 * Gắn nhãn một khối văn bản. Trả về nhãn duy nhất theo thứ tự xuất hiện.
 *
 * Không dùng cho quyết định cuối cùng: đây là gợi ý cho người duyệt, và 65.1 nói
 * rõ "tên chứa … chỉ là gợi ý classifier. Kết quả phải hiện cho người dùng duyệt".
 */
export function phanLoaiNoiDung(text: string): NhanDaGan[] {
  const ra: NhanDaGan[] = [];
  const daCo = new Set<string>();
  for (const [nhan, re, lyDo] of MAU_NHAN) {
    if (!re.test(text)) continue;
    const khoa = `${nhan}|${lyDo}`;
    if (daCo.has(khoa)) continue;
    daCo.add(khoa);
    ra.push({ nhan, lyDo });
  }
  return ra;
}

// ─────────────────────────────────────────── secret

/**
 * Chuỗi có hình dạng token/password/webhook — 64.4.
 *
 * Mẫu cố ý hẹp. Một mẫu rộng ("chuỗi dài không có khoảng trắng") sẽ che nửa nội
 * dung prompt và làm người dùng mất niềm tin vào bảng an toàn.
 */
const MAU_SECRET: readonly (readonly [string, RegExp])[] = [
  ['openai_key', /\bsk-[A-Za-z0-9_-]{16,}\b/],
  ['anthropic_key', /\bsk-ant-[A-Za-z0-9_-]{16,}\b/],
  ['google_key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['bearer', /\bBearer\s+[A-Za-z0-9._-]{16,}\b/i],
  ['discord_webhook', /https?:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/\S+/i],
  ['slack_webhook', /https?:\/\/hooks\.slack\.com\/services\/\S+/i],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}\b/],
  [
    'gan_password',
    /["']?(?:password|passwd|proxy_?password|api_?key|secret)["']?\s*[:=]\s*["'][^"']{6,}["']/i,
  ],
];

export type VetSecret = { readonly loai: string; readonly path: string };

/** Che một chuỗi có secret. Giữ 4 ký tự đầu để người dùng còn nhận ra nó là cái gì. */
export function cheSecret(s: string): string {
  let ra = s;
  for (const [, re] of MAU_SECRET) {
    ra = ra.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`), (m) =>
      m.length <= 6 ? '••••••' : `${m.slice(0, 4)}${'•'.repeat(Math.min(12, m.length - 4))}`,
    );
  }
  return ra;
}

// ─────────────────────────────────────────── URL

export type VetUrl = { readonly url: string; readonly host: string; readonly path: string };

const MAU_URL = /https?:\/\/[^\s"'<>)\]]+/gi;

function hostCua(url: string): string {
  const m = /^https?:\/\/([^/?#:]+)/i.exec(url);
  return m ? (m[1] as string).toLowerCase() : '';
}

// ─────────────────────────────────────────── quét cây

export type KetQuaQuet = {
  readonly issues: readonly ImportIssue[];
  readonly secrets: readonly VetSecret[];
  readonly urls: readonly VetUrl[];
  /** Host duy nhất, đã sắp — dùng cho màn "An toàn" của wizard. */
  readonly hosts: readonly string[];
  /** Đường dẫn các node bị từ chối vì khóa nguy hiểm. */
  readonly nodeBiTuChoi: readonly string[];
};

const KHOA_CAM = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Quét toàn cây JSON nguồn.
 *
 * [BB] Hàm này KHÔNG chạy regex nguồn, KHÔNG chạy script, KHÔNG tải URL. Nó chỉ
 * đọc chuỗi. Đó là toàn bộ những gì bước 8 được phép làm (63.1).
 */
export function quetAnToan(goc: unknown): KetQuaQuet {
  const issues: ImportIssue[] = [];
  const secrets: VetSecret[] = [];
  const urls: VetUrl[] = [];
  const nodeBiTuChoi: string[] = [];
  const hostSet = new Set<string>();
  const daThay = new WeakSet<object>();

  const di = (v: unknown, path: string): void => {
    if (typeof v === 'string') {
      for (const [loai, re] of MAU_SECRET) {
        if (re.test(v)) secrets.push({ loai, path });
      }
      const found = v.match(MAU_URL);
      if (found) {
        for (const u of found) {
          const host = hostCua(u);
          urls.push({ url: u, host, path });
          if (host !== '') hostSet.add(host);
        }
      }
      return;
    }
    if (v === null || typeof v !== 'object') return;
    if (daThay.has(v)) return;
    daThay.add(v);

    if (Array.isArray(v)) {
      v.forEach((x, i) => di(x, `${path}[${i}]`));
      return;
    }
    for (const k of Object.keys(v)) {
      if (KHOA_CAM.has(k)) {
        const p = path === '' ? k : `${path}.${k}`;
        nodeBiTuChoi.push(p);
        issues.push({
          code: 'KHOA_NGUY_HIEM',
          severity: 'error',
          path: p,
          message: `Node bị từ chối: khóa "${k}" có thể làm ô nhiễm prototype (64.4). Node này không được nạp.`,
          details: { khoa: k },
        });
        continue;
      }
      di((v as Record<string, unknown>)[k], path === '' ? k : `${path}.${k}`);
    }
  };

  di(goc, '');

  for (const s of secrets) {
    issues.push({
      code: 'CO_HINH_DANG_SECRET',
      severity: 'warning',
      path: s.path,
      message:
        `Chuỗi ở đây có hình dạng ${s.loai}. Nó sẽ bị che trong giao diện và ` +
        'không đi vào bản export chia sẻ (64.4).',
      details: { loai: s.loai },
    });
  }

  const hosts = [...hostSet].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  if (hosts.length > 0) {
    issues.push({
      code: 'CO_URL_NGOAI',
      severity: 'info',
      path: '',
      message:
        `File nhắc tới ${hosts.length} host ngoài. Không host nào được gọi khi nhập ` +
        'hoặc khi xem trước; muốn tải asset phải cho phép từng cái (64.4).',
      details: { hosts },
    });
  }

  return { issues, secrets, urls, hosts, nodeBiTuChoi };
}

/**
 * Bản sao đã bỏ mọi node có khóa nguy hiểm — dùng cho MỌI bước sau bước 8.
 *
 * Cây gốc không bị sửa; blob raw vẫn giữ nguyên bytes (62.2). Đây là hai bản
 * khác nhau có chủ đích: một bản để round-trip, một bản để chạy.
 */
export function locKhoaNguyHiem<T>(goc: T): T {
  const di = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(di);
    if (v === null || typeof v !== 'object') return v;
    const ra: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>)) {
      if (KHOA_CAM.has(k)) continue;
      ra[k] = di((v as Record<string, unknown>)[k]);
    }
    return ra;
  };
  return di(goc) as T;
}
