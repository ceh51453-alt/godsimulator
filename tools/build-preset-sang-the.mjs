/**
 * Sinh `presets/thien-dien-sang-the-v1.json` — preset "Thiên Diễn · Sáng Thế Thần v1".
 *
 * ── Vì sao có bộ sinh thay vì sửa JSON bằng tay ──
 *
 * `prompts[].enabled` và `prompt_order[].order[].enabled` là HAI chỗ nói về cùng
 * một sự thật, và Thiên Diễn coi `order[]` là nguồn chân lý (63.3). Ba preset
 * tham khảo lệch nhau ở 2 / 4 / 0 mục — không phải vì tác giả bất cẩn, mà vì
 * không có gì trong định dạng ép hai chỗ ấy khớp nhau.
 *
 * Ở đây cờ `bat` được khai đúng MỘT lần trong `noiDung.mjs` rồi ghi ra cả hai
 * chỗ. Mismatch không phải thứ được kỷ luật giữ; nó không có đường tồn tại.
 *
 * Bộ sinh từ chối build (exit 1) khi vi phạm bất kỳ điều nào trong `KIEM` bên
 * dưới. Chạy:
 *
 *     node tools/build-preset-sang-the.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { MODULES } from './preset-sang-the/noiDung.mjs';
import { REGEX_SCRIPTS, TAVERN_HELPER } from './preset-sang-the/regexScripts.mjs';

const RA = 'presets/thien-dien-sang-the-v1.json';

// ─────────────────────────────────────────── tham số sinh

/**
 * Mười một khóa mức ngoài cùng, không hơn.
 *
 * Ba preset tham khảo mang 43–46 khóa; hơn ba mươi trong số đó rơi vào
 * `generation.unknown` của Thiên Diễn và không bao giờ được gửi lên endpoint —
 * chúng chỉ làm bảng tham số ở màn 6 dài ra và khó đọc.
 *
 * `openai_max_context` = 2.000.000 và `openai_max_tokens` = 65.000 là yêu cầu
 * của người dùng. Hai điều cần biết về chúng:
 *
 * · Ngân sách biên dịch một lượt kể trong app KHÔNG lấy từ con số này. Nó lấy từ
 *   `NGAN_SACH_MAC_DINH.ke_canh.inputMax` = 150.000 token (`core/ai/nganSach.ts`),
 *   nên khai 2M không làm module bị cắt và cũng không nới trần thật.
 * · `openai_max_tokens` bị kẹp theo `ModelProfile.gioiHan.outputMax`: Gemini
 *   nhận đủ 65.000, Claude kẹp về 64.000, GPT không kẹp. Bảng diff ở màn 6 hiện
 *   cả hai giá trị nên chỗ kẹp không im lặng.
 *
 * `max_context_unlocked` không thuộc API — nó là công tắc của SillyTavern để
 * cho phép khai context trên 1M. Giữ lại để file còn dùng được ở ST; Thiên Diễn
 * xếp nó vào "không hỗ trợ, không gửi đi" và đó là đúng.
 */
const THAM_SO = {
  temperature: 0.9,
  frequency_penalty: 0,
  presence_penalty: 0,
  top_p: 0.95,
  top_k: 64,
  max_context_unlocked: true,
  openai_max_context: 2_000_000,
  openai_max_tokens: 65_000,
  reasoning_effort: 'high',
  continue_prefill: true,
  assistant_prefill: '',
};

// ─────────────────────────────────────────── kiểm tra

const loi = [];
const canhBao = [];
const bao = (ds, m) => ds.push(m);

/** Sáu khóa `exclusive_one`/`user_choice` của 65.1 — chúng chặn ở bước duyệt. */
const KHOA_CHAN = [
  ['language.output', /\b(respond|reply|write|answer)\s+in\s+\w+|viết bằng tiếng|trả lời bằng tiếng/i],
  ['pov.camera', /\b(first|second|third)[- ]person\b|ngôi (thứ )?(nhất|hai|ba)/i],
  ['history.wrapper', /\bchat\s+history\b|<\s*\/?\s*(history|chat_history)\s*>/i],
  ['prose.style', /\b(prose|writing)\s+style|purple\s+prose|văn phong|lối viết|tránh (văn )?mẫu/i],
  ['dialogue.ratio', /\bdialogue\s*(ratio|percentage|%)|tỉ lệ (thoại|đối thoại)/i],
  ['content.maturity', /\b(nsfw|sfw|explicit|mature\s+content)\b|nội dung (người lớn|18\+)/i],
];

/** Nhãn rủi ro của `core/preset/anToan.ts` — chỉ để báo cáo, không chặn. */
const NHAN_RUI_RO = [
  [
    'jailbreak_like',
    /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)\b|bỏ qua (mọi|tất cả|các) (chỉ dẫn|hướng dẫn|quy tắc)/i,
  ],
  [
    'jailbreak_like',
    /\b(no\s+restrictions?|without\s+(any\s+)?(limits?|restrictions?|censorship)|unfiltered|no\s+refusals?)\b|không (có )?(giới hạn|kiểm duyệt|từ chối)/i,
  ],
  [
    'reasoning_request',
    /\b(show|reveal|print|output|display)\s+(your\s+)?(chain[- ]of[- ]thought|reasoning|thinking|thought\s+process)\b|show_thoughts|hiện (chuỗi )?suy luận/i,
  ],
  ['reasoning_request', /<\s*(thinking|thought|reasoning|cot)\s*>/i],
  [
    'tool_request',
    /\b(function[_ ]call(ing)?|tool[_ ]call(ing)?|use\s+the\s+(browser|search|terminal|api)\s+tool)\b/i,
  ],
  [
    'state_write_claim',
    /\b(update|write|modify|set)\s+(the\s+)?(world\s+state|game\s+state|database|variables?)\b|(ghi|sửa|cập nhật) (thẳng )?(trạng thái|state|cơ sở dữ liệu)/i,
  ],
  [
    'visibility_override',
    /\b(ignore|bypass|override)\s+(the\s+)?(visibility|fog|permission|privacy)\b|(bỏ qua|vượt|ghi đè) (tầm nhìn|sương mù|quyền riêng tư)/i,
  ],
  [
    'visibility_override',
    /\byou\s+(know|can\s+see)\s+everything\b|bạn (biết|thấy) (được )?(tất cả|mọi thứ)/i,
  ],
  ['output_contract_conflict', /```json|\breturn\s+(only\s+)?(valid\s+)?json\b|chỉ (trả về|xuất) json/i],
  ['sensitive_content', /\b(nsfw|explicit\s+content|erotic|smut|gore)\b|nội dung (người lớn|18\+)/i],
];

/** Macro có ánh xạ native — `core/preset/macro.ts` MACRO_BIET. */
const MACRO_BIET = new Set([
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
]);
const MACRO_DINH_DOI_SO = new Set(['roll', 'random', 'pick', 'reverse']);

/** Bản sao logic `bienRegex()` — chặn trước hình dạng quay lui hàm mũ. */
const MAU_NGUY_HIEM = [/\([^)]*[+*]\)\s*[+*]/, /\{\d{4,},?\d*\}/];
const NHOM_LAP = /\(([^()]*\|[^()]*)\)\s*[+*]/g;

function coNhanhTrungBiLap(s) {
  for (const g of s.matchAll(NHOM_LAP)) {
    const nhanh = (g[1] ?? '').split('|').map((x) => x.trim());
    if (new Set(nhanh).size !== nhanh.length) return true;
  }
  return false;
}

function bienDuoc(pattern) {
  const s = pattern.trim();
  if (s === '') return false;
  for (const nguy of MAU_NGUY_HIEM) if (nguy.test(s)) return false;
  if (coNhanhTrungBiLap(s)) return false;
  const than = /^\/(.*)\/([gimsuy]*)$/s.exec(s);
  try {
    if (than) new RegExp(than[1], than[2] ?? '');
    else new RegExp(s);
    return true;
  } catch {
    return false;
  }
}

/** Tên macro trong một chuỗi, đếm ngoặc thật như `docMacro()`. */
function macroTrongChuoi(text) {
  const ra = new Set();
  let i = 0;
  while (i < text.length) {
    if (!text.startsWith('{{', i)) {
      i++;
      continue;
    }
    let sau = 0;
    let j = i;
    let ket = -1;
    while (j < text.length - 1) {
      if (text.startsWith('{{', j)) {
        sau++;
        j += 2;
        continue;
      }
      if (text.startsWith('}}', j)) {
        sau--;
        if (sau === 0) {
          ket = j;
          break;
        }
        j += 2;
        continue;
      }
      j++;
    }
    if (ket < 0) break;
    const than = text.slice(i + 2, ket);
    if (!than.startsWith('//')) {
      const dau = (than.split('::')[0] ?? '').trim();
      let ten = dau.toLowerCase();
      const dinh = /^([a-z_][a-z0-9_]*)[\s:]([\s\S]+)$/i.exec(dau);
      if (dinh !== null && MACRO_DINH_DOI_SO.has(dinh[1].toLowerCase())) ten = dinh[1].toLowerCase();
      ra.add(ten);
    }
    // Quét cả phần thân để bắt macro lồng.
    for (const m of macroTrongChuoi(than)) ra.add(m);
    i = ket + 2;
  }
  return ra;
}

const MAU_SETVAR = /\{\{\s*(?:set|add|inc)(?:global)?var\s*::\s*([^:}]+)/gi;
const MAU_GETVAR = /\{\{\s*get(?:global)?var\s*::\s*([^:}]+)/gi;

// ─────────────────────────────────────────── dựng prompts[] và order[]

const prompts = [];
const order = [];

MODULES.forEach((m) => {
  const laMarker = m.marker === true;
  const p = {
    identifier: m.identifier,
    name: m.name,
    // Cờ này được ghi ra cả hai chỗ từ MỘT nguồn — mismatch không có đường tồn tại.
    enabled: m.bat,
    role: m.role ?? 'system',
    system_prompt: laMarker,
    injection_position: m.injection_position ?? 0,
    injection_depth: m.injection_depth ?? 4,
    // Thiên Diễn KHÔNG đọc `injection_order` để quyết vị trí (bienDich.ts): module
    // ngoài luôn ở tầng 4. Giữ trường ở giá trị trung tính để file còn đúng ở ST.
    injection_order: 100,
    forbid_overrides: false,
  };
  if (laMarker) p.marker = true;
  else p.content = m.content;
  prompts.push(p);
  order.push({ identifier: m.identifier, enabled: m.bat });
});

// ─────────────────────────────────────────── KIỂM

const KIEM = () => {
  // 1. identifier duy nhất
  const dem = new Map();
  for (const p of prompts) dem.set(p.identifier, (dem.get(p.identifier) ?? 0) + 1);
  for (const [id, n] of dem) if (n > 1) bao(loi, `identifier trùng ${n} lần: "${id}"`);

  // 2. order phủ hết prompts, không mục mồ côi
  const idPrompt = new Set(prompts.map((p) => p.identifier));
  const idOrder = new Set(order.map((o) => o.identifier));
  for (const id of idPrompt) if (!idOrder.has(id)) bao(loi, `prompt ngoài order: "${id}"`);
  for (const id of idOrder) if (!idPrompt.has(id)) bao(loi, `order mồ côi: "${id}"`);

  // 3. hai cờ enabled khớp nhau
  const batOrder = new Map(order.map((o) => [o.identifier, o.enabled === true]));
  for (const p of prompts) {
    if (batOrder.get(p.identifier) !== (p.enabled === true)) {
      bao(loi, `enabled mismatch ở "${p.identifier}"`);
    }
  }

  // 4. module rỗng nhưng đang bật (Thiên Diễn bỏ nó với lý do `rong`)
  for (const m of MODULES) {
    if (m.marker === true) continue;
    if (m.bat && m.content.trim() === '') bao(loi, `module bật nhưng rỗng: "${m.identifier}"`);
  }

  // 5. trần ký tự mỗi khối (tuning.preset.maxBlockChars)
  for (const m of MODULES) {
    if ((m.content ?? '').length > 200_000) bao(loi, `khối quá 200.000 ký tự: "${m.identifier}"`);
  }

  // 6. macro: chỉ dùng macro có ánh xạ native
  for (const m of MODULES) {
    for (const ten of macroTrongChuoi(m.content ?? '')) {
      if (!MACRO_BIET.has(ten)) bao(loi, `macro chưa có ánh xạ "{{${ten}}}" ở "${m.identifier}"`);
    }
  }

  // 7. mọi getvar phải có provider ở module có order NHỎ HƠN
  const capTaiViTri = new Map();
  MODULES.forEach((m, i) => {
    for (const g of (m.content ?? '').matchAll(MAU_SETVAR)) {
      const k = g[1].trim();
      if (!capTaiViTri.has(k)) capTaiViTri.set(k, i);
    }
  });
  MODULES.forEach((m, i) => {
    for (const g of (m.content ?? '').matchAll(MAU_GETVAR)) {
      const k = g[1].trim();
      const vi = capTaiViTri.get(k);
      if (vi === undefined) bao(loi, `getvar "${k}" ở "${m.identifier}" không có setvar/addvar nào cấp`);
      else if (vi > i) bao(loi, `getvar "${k}" ở "${m.identifier}" đứng TRƯỚC nơi cấp nó`);
    }
  });

  // 8. sáu khóa chặn: mỗi khóa tối đa một module đang bật
  for (const [khoa, re] of KHOA_CHAN) {
    const trung = MODULES.filter((m) => m.bat && re.test(m.content ?? '')).map((m) => m.identifier);
    // Marker chatHistory nhận `history.wrapper` từ LANE, không từ nội dung.
    if (khoa === 'history.wrapper') trung.push('chatHistory (theo lane)');
    if (trung.length > 1) {
      bao(loi, `nhóm xung đột "${khoa}" có ${trung.length} module đang bật: ${trung.join(', ')}`);
    }
  }

  // 9. nhãn rủi ro — báo cáo, không chặn
  for (const m of MODULES) {
    for (const [nhan, re] of NHAN_RUI_RO) {
      if (re.test(m.content ?? '')) bao(canhBao, `nhãn ${nhan} ở "${m.identifier}"`);
    }
  }

  // 10. regex: biên được, placement hợp lệ, guard depth hợp lệ, substituteRegex = 0
  for (const r of REGEX_SCRIPTS) {
    if (!bienDuoc(r.findRegex))
      bao(loi, `regex không biên được hoặc có hình dạng quay lui: "${r.scriptName}"`);
    for (const p of r.placement)
      if (p !== 1 && p !== 2) bao(loi, `placement ${p} chưa hỗ trợ: "${r.scriptName}"`);
    if (r.placement.length === 0) bao(loi, `placement rỗng — regex không chạy ở đâu: "${r.scriptName}"`);
    if (r.minDepth !== null && r.minDepth < -1)
      bao(canhBao, `minDepth < -1 bị coi như không đặt: "${r.scriptName}"`);
    if (r.maxDepth !== null && r.maxDepth < 0)
      bao(loi, `maxDepth < 0 tự tắt chính regex này: "${r.scriptName}"`);
    if (!r.markdownOnly && !r.promptOnly) {
      bao(canhBao, `không khai markdownOnly lẫn promptOnly — chạy ở cả hai đích: "${r.scriptName}"`);
    }
  }

  // 11. ngân sách: nội dung ĐANG BẬT so với 150.000 token của `ke_canh`
  const kyTuBat = MODULES.filter((m) => m.bat).reduce((a, m) => a + (m.content ?? '').length, 0);
  const token26 = Math.ceil(kyTuBat / 2.6);
  if (token26 > 100_000)
    bao(loi, `nội dung bật ${token26} token, quá chật so với trần 150.000 của một lượt kể`);
  else if (token26 > 60_000) bao(canhBao, `nội dung bật ${token26} token — còn ít chỗ cho dữ liệu thế giới`);
  return { kyTuBat, token26 };
};

const { kyTuBat, token26 } = KIEM();

// ─────────────────────────────────────────── ghi file

const preset = {
  ...THAM_SO,
  prompts,
  prompt_order: [{ character_id: 100001, order }],
  extensions: {
    regex_scripts: REGEX_SCRIPTS.map((r) => ({
      id: r.id,
      scriptName: r.scriptName,
      findRegex: r.findRegex,
      replaceString: r.replaceString,
      trimStrings: r.trimStrings ?? [],
      placement: r.placement,
      disabled: r.disabled,
      markdownOnly: r.markdownOnly,
      promptOnly: r.promptOnly,
      runOnEdit: false,
      substituteRegex: 0,
      minDepth: r.minDepth,
      maxDepth: r.maxDepth,
    })),
    tavern_helper: TAVERN_HELPER,
  },
};

const json = JSON.stringify(preset, null, 2) + '\n';

if (loi.length > 0) {
  console.error('\n✗ KHÔNG BUILD — vi phạm ràng buộc tương thích:\n');
  for (const l of loi) console.error('  · ' + l);
  console.error('');
  process.exit(1);
}

mkdirSync('presets', { recursive: true });
writeFileSync(RA, json, 'utf8');

const sha = createHash('sha256').update(json, 'utf8').digest('hex').toUpperCase();
const soBat = MODULES.filter((m) => m.bat).length;

console.log(`\n✓ ${RA}`);
console.log(`  SHA-256          ${sha.slice(0, 32)}…`);
console.log(`  byte             ${Buffer.byteLength(json, 'utf8').toLocaleString('vi-VN')}`);
console.log(`  prompts          ${prompts.length}  (bật ${soBat}, tắt ${prompts.length - soBat})`);
console.log(`  order entry      ${order.length}  · ngoài order 0 · mồ côi 0 · mismatch 0`);
console.log(
  `  marker           ${MODULES.filter((m) => m.marker).length}  (bật ${MODULES.filter((m) => m.marker && m.bat).length})`,
);
console.log(
  `  regex script     ${REGEX_SCRIPTS.length}  (bật ${REGEX_SCRIPTS.filter((r) => !r.disabled).length})`,
);
console.log(`  helper script    ${TAVERN_HELPER.scripts.length}  → 1 adapter cot_cleanup, 1 mục quarantined`);
console.log(`  khóa mức gốc     ${Object.keys(THAM_SO).length}`);
console.log(
  `  ký tự đang bật   ${kyTuBat.toLocaleString('vi-VN')}  ≈ ${token26.toLocaleString('vi-VN')} token @2.6`,
);

if (canhBao.length > 0) {
  console.log('\n  Cảnh báo đã biết và đã chấp nhận:');
  for (const c of canhBao) console.log('    · ' + c);
}
console.log('');
