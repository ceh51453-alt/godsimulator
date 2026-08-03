/**
 * Sinh fixture preset CẤU TRÚC ĐÃ ẨN DANH từ hai file thật.
 * Giữ nguyên: hình dạng, số lượng, thứ tự, cờ enabled, tên khóa, kiểu marker.
 * Thay hết: mọi nội dung văn bản có bản quyền → chuỗi giữ chỗ theo độ dài.
 * Công cụ này KHÔNG được phát hành; chỉ chạy tay để tạo fixture test.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const OUT = 'src/test/fixtures/preset';

// Khóa giữ nguyên giá trị vì chúng là CẤU TRÚC, không phải nội dung.
const GIU_NGUYEN = new Set([
  'identifier',
  'enabled',
  'disabled',
  'marker',
  'role',
  'system_prompt',
  'injection_position',
  'injection_depth',
  'injection_order',
  'forbid_overrides',
  'id',
  'type',
  'placement',
  'minDepth',
  'maxDepth',
  'markdownOnly',
  'promptOnly',
  'runOnEdit',
  'substituteRegex',
  'trimStrings',
  'export_with',
  'button',
]);

// Khóa là văn bản tự do → ẩn danh.
function anon(v, key, path) {
  if (typeof v !== 'string') return v;
  if (GIU_NGUYEN.has(key)) return v;
  if (v.length === 0) return '';
  // Giữ độ dài xấp xỉ để test ngân sách token vẫn có ý nghĩa.
  const h = createHash('sha1')
    .update(path + '|' + v)
    .digest('hex')
    .slice(0, 8);
  const n = Math.min(v.length, 400);
  return `[noi-dung-an-danh:${h}:${v.length}]` + 'x'.repeat(Math.max(0, n - 30));
}

function di(v, key = '', path = '') {
  if (Array.isArray(v)) return v.map((x, i) => di(x, key, `${path}[${i}]`));
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) out[k] = di(v[k], k, path ? `${path}.${k}` : k);
    return out;
  }
  return anon(v, key, path);
}

function build(label, src) {
  const raw = readFileSync(src);
  const sha = createHash('sha256').update(raw).digest('hex').toUpperCase();
  const j = JSON.parse(raw.toString('utf8'));
  const an = di(j);

  const prompts = j.prompts ?? [];
  const order = (j.prompt_order ?? []).reduce(
    (a, b) => ((b.order?.length ?? 0) > a.length ? b.order : a),
    [],
  );
  const byId = new Map(prompts.map((p) => [p.identifier, p]));
  const orderIds = new Set(order.map((o) => o.identifier));
  const th = j.extensions?.tavern_helper?.scripts ?? [];
  const rx = j.extensions?.regex_scripts ?? [];

  const meta = {
    label,
    /** SHA-256 của FILE GỐC — không phải của fixture ẩn danh. Dùng để nhận diện. */
    sourceSha256: sha,
    sourceBytes: raw.length,
    format: 'sillytavern_openai_preset',
    counts: {
      prompts: prompts.length,
      orderBlocks: (j.prompt_order ?? []).length,
      orderEntries: order.length,
      effectiveEnabled: order.filter((o) => o.enabled === true).length,
      enabledMismatch: order.filter((o) => {
        const p = byId.get(o.identifier);
        if (!p) return false;
        return (p.enabled === undefined ? true : !!p.enabled) !== !!o.enabled;
      }).length,
      unordered: prompts.filter((p) => !orderIds.has(p.identifier)).length,
      regexScripts: rx.length,
      regexSourceEnabled: rx.filter((r) => !r.disabled).length,
      helperScripts: th.length,
      helperSourceEnabled: th.filter((s) => s.enabled !== false).length,
      markers: prompts.filter((p) => p.marker === true).length,
    },
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/fixture-${label}.anon.json`, JSON.stringify(an), 'utf8');
  writeFileSync(`${OUT}/fixture-${label}.meta.json`, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  return meta;
}

const args = process.argv.slice(2);
let labels = ['A', 'B'];
let files = args;
if (args[0] === '--labels') {
  labels = (args[1] ?? '').split(',').filter(Boolean);
  files = args.slice(2);
}
if (files.length === 0 || files.length !== labels.length) {
  throw new Error('Dùng: node tools/make-preset-fixture.mjs [--labels C,D,E] <file...>');
}
const metas = files.map((src, i) => build(labels[i], src));
console.log(JSON.stringify(metas, null, 2));
