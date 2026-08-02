/**
 * Bước 4 của pipeline nhập — dò định dạng BẰNG HÌNH DẠNG, không bằng tên file.
 * Nguồn: Phần 63.2, 62.1, 35.3.
 *
 * ── Vì sao không dò bằng tên hay bằng một khóa duy nhất ──
 *
 * Người ta đổi tên file. Người ta xuất preset từ một fork có thêm khóa lạ. Một
 * `if (ten.endsWith('.preset.json'))` sẽ đúng cho tới đúng lần đầu tiên nó sai,
 * và lúc ấy nó nhập nhầm loại — mà [BB] 62.1 nói năm loại preset KHÔNG được trộn.
 *
 * Nên phép dò ở đây đếm **dấu hiệu**, trả về điểm, và dưới ngưỡng thì trả
 * `unknown_json` kèm lý do cụ thể. Đoán bừa một loại tệ hơn nhiều so với nói
 * "không nhận ra, đây là những gì tôi thấy".
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { PresetFormat, PresetPart } from './schema.js';

export type KetQuaDo = {
  readonly format: PresetFormat;
  /** 0–1. Dưới `NGUONG_NHAN` thì `format` là `unknown_json`. */
  readonly diem: number;
  readonly dauHieu: readonly string[];
  readonly parts: readonly PresetPart[];
  readonly ghiChu: readonly ImportIssue[];
};

export const NGUONG_NHAN = 0.5;

const laObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const co = (o: Record<string, unknown>, k: string): boolean => Object.hasOwn(o, k);

/** `entries` là object có khóa toàn số — hình dạng world info V2 của SillyTavern. */
function laBanDoKhoaSo(v: unknown): boolean {
  if (!laObj(v)) return false;
  const keys = Object.keys(v);
  if (keys.length === 0) return false;
  return keys.every((k) => /^\d+$/.test(k));
}

/** Dấu hiệu OpenAI completion preset — 63.2. */
function dauHieuSillyTavern(o: Record<string, unknown>): string[] {
  const ra: string[] = [];
  const genKeys = ['temperature', 'top_p', 'openai_max_context', 'openai_max_tokens', 'frequency_penalty'];
  const daCo = genKeys.filter((k) => co(o, k));
  if (daCo.length >= 2) ra.push(`generation_keys:${daCo.length}`);

  const prompts = o['prompts'];
  if (Array.isArray(prompts) && prompts.length > 0) {
    const mau = prompts.filter(laObj).slice(0, 24);
    const hopLe = mau.filter((p) => co(p, 'identifier') && (co(p, 'content') || co(p, 'marker')));
    if (hopLe.length >= Math.max(1, Math.floor(mau.length * 0.6))) ra.push('prompts[]');
  }

  const order = o['prompt_order'];
  if (Array.isArray(order) && order.some((b) => laObj(b) && Array.isArray(b['order']))) {
    ra.push('prompt_order[]');
  }

  const ext = o['extensions'];
  if (laObj(ext)) {
    if (Array.isArray(ext['regex_scripts'])) ra.push('extensions.regex_scripts');
    if (laObj(ext['tavern_helper'])) ra.push('extensions.tavern_helper');
  }
  return ra;
}

/**
 * Dò định dạng của một cây JSON đã parse.
 *
 * [BB] Hàm này thuần: không đọc file, không gọi mạng, không nhớ gì giữa hai lần
 * gọi. Cùng cây JSON luôn cho cùng kết quả.
 */
export function doDinhDang(goc: unknown, tenNguon = ''): KetQuaDo {
  const ghiChu: ImportIssue[] = [];

  if (!laObj(goc)) {
    return {
      format: 'unknown_json',
      diem: 0,
      dauHieu: [],
      parts: [],
      ghiChu: [
        {
          code: 'GOC_KHONG_PHAI_OBJECT',
          severity: 'error',
          path: '',
          message: 'Gốc file không phải một object JSON. Preset phải là một object ở mức ngoài cùng.',
          details: { loai: Array.isArray(goc) ? 'array' : typeof goc },
        },
      ],
    };
  }

  // ── Thiên Diễn bundle: khai tường minh, không cần đoán ──
  if (goc['_format'] === 'thien_dien_bundle_v1' || goc['_format'] === 'thien_dien_lore') {
    const parts: PresetPart[] = [];
    if (Array.isArray(goc['modules'])) parts.push('prompt');
    if (laObj(goc['generation'])) parts.push('generation');
    if (Array.isArray(goc['lorebooks']) || Array.isArray(goc['entries'])) parts.push('lorebook');
    if (Array.isArray(goc['tasks'])) parts.push('workflow');
    if (Array.isArray(goc['entries']) && laObj(goc['registry'])) parts.push('registry');
    return {
      format: 'thien_dien_bundle_v1',
      diem: 1,
      dauHieu: ['_format'],
      parts,
      ghiChu,
    };
  }

  // ── World info / lorebook ──
  const entries = goc['entries'];
  const laWorldInfo =
    goc['spec'] === 'lorebook_v3' ||
    laBanDoKhoaSo(entries) ||
    (Array.isArray(entries) && !co(goc, 'prompts'));
  if (laWorldInfo) {
    return {
      format: 'sillytavern_world_info',
      diem: goc['spec'] === 'lorebook_v3' ? 1 : 0.8,
      dauHieu: goc['spec'] === 'lorebook_v3' ? ['spec'] : ['entries'],
      parts: ['lorebook'],
      ghiChu,
    };
  }

  // ── OpenAI completion preset ──
  const dauHieu = dauHieuSillyTavern(goc);
  const coPrompts = dauHieu.includes('prompts[]');
  const coOrder = dauHieu.includes('prompt_order[]');
  const coGen = dauHieu.some((d) => d.startsWith('generation_keys'));

  /**
   * Trọng số cố ý lệch về `prompts[]`: một file có `prompts[]` đúng hình dạng
   * thì đã là prompt pack, kể cả khi thiếu `prompt_order` (63.3 quy tắc 3 nói rõ
   * trường hợp ấy) và kể cả khi không có khóa generation nào.
   */
  const diem = (coPrompts ? 0.55 : 0) + (coOrder ? 0.25 : 0) + (coGen ? 0.2 : 0);

  if (diem >= NGUONG_NHAN) {
    const parts: PresetPart[] = [];
    if (coGen) parts.push('generation');
    if (coPrompts) parts.push('prompt');
    if (dauHieu.some((d) => d.startsWith('extensions.'))) parts.push('extension');
    if (!coOrder) {
      ghiChu.push({
        code: 'THIEU_PROMPT_ORDER',
        severity: 'warning',
        path: 'prompt_order',
        message:
          'File không có prompt_order. Thứ tự và bật/tắt sẽ đọc từ prompts[].enabled — ' +
          'đây là đường lùi của 63.3 quy tắc 3, không phải nguồn chân lý thường ngày.',
        details: {},
      });
    }
    return { format: 'sillytavern_openai_preset', diem, dauHieu, parts, ghiChu };
  }

  ghiChu.push({
    code: 'KHONG_NHAN_RA_DINH_DANG',
    severity: 'error',
    path: '',
    message:
      'Không nhận ra định dạng. Đây là những khóa ở mức ngoài cùng đã thấy: ' +
      Object.keys(goc).slice(0, 12).join(', ') +
      '. Không đoán bừa một loại vì năm loại preset không được trộn (62.1).',
    details: { tenNguon, diem, dauHieu },
  });

  return { format: 'unknown_json', diem, dauHieu, parts: [], ghiChu };
}
