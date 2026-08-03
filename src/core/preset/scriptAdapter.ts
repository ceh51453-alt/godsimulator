/**
 * Port khai báo cho các Tavern Helper script phổ biến trong preset SillyTavern.
 *
 * JavaScript nguồn là dữ liệu không tin cậy và phụ thuộc DOM/API riêng của
 * SillyTavern. Thay vì `eval`, importer nhận diện ý đồ rồi dựng adapter native với
 * cấu hình hữu hạn. Runtime chỉ được đổi chuỗi prompt, dữ liệu pack và lựa chọn UI.
 */
import type { ScriptAdapterDef } from './schema.js';

type ScriptTho = Readonly<Record<string, unknown>>;

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '');
const laObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

function tenPrompt(goc: Record<string, unknown>): ReadonlyMap<string, string> {
  const ra = new Map<string, string>();
  const prompts = Array.isArray(goc['prompts']) ? goc['prompts'] : [];
  for (const p of prompts) {
    if (!laObj(p)) continue;
    const ten = chuoi(p['name']);
    const id = chuoi(p['identifier']);
    if (ten !== '' && id !== '') ra.set(ten, id);
  }
  return ra;
}

/** Lấy ánh xạ `sceneKey -> prompt identifier` từ object tĩnh trong script. */
function docSceneMap(code: string, prompts: ReadonlyMap<string, string>): Record<string, string> {
  const ra: Record<string, string> = {};
  const re = /([A-Za-z][A-Za-z0-9_]*)\s*:\s*(['"])(.*?)\2/g;
  for (const m of code.matchAll(re)) {
    const khoa = m[1] ?? '';
    const ten = (m[3] ?? '').replace(/\\(['"\\])/g, '$1');
    const id = prompts.get(ten);
    if (khoa !== '' && id !== undefined) ra[khoa] = id;
  }
  return ra;
}

function them(
  ra: ScriptAdapterDef[],
  packId: string,
  scriptId: string,
  ten: string,
  kind: ScriptAdapterDef['kind'],
  batONguon: boolean,
  config: Record<string, unknown>,
  lyDo: string,
): void {
  if (ra.some((a) => a.sourceScriptId === scriptId && a.kind === kind)) return;
  ra.push({
    id: `${packId}/adapter/${scriptId}/${kind}`,
    packId,
    sourceScriptId: scriptId,
    ten,
    kind,
    batONguon,
    config,
    lyDo,
  });
}

export function dungScriptAdapters(input: {
  readonly goc: Record<string, unknown>;
  readonly packId: string;
  readonly helperScripts: readonly ScriptTho[];
}): ScriptAdapterDef[] {
  const { goc, packId, helperScripts } = input;
  const prompts = tenPrompt(goc);
  const ra: ScriptAdapterDef[] = [];

  helperScripts.forEach((s, i) => {
    const scriptId = chuoi(s['id']) || `th${i}`;
    const ten = chuoi(s['name']) || `script ${i + 1}`;
    const code = chuoi(s['content'] ?? s['code'] ?? s['script']);
    const data = laObj(s['data']) ? s['data'] : {};
    const bat = s['enabled'] !== false;
    const lower = `${ten}\n${code}`.toLowerCase();

    if (/extractreasoningandclean|applyreasoningtomessage|<\/thinking>/.test(lower)) {
      them(
        ra,
        packId,
        scriptId,
        ten,
        'cot_cleanup',
        bat,
        {},
        'Dọn thẻ suy luận bằng bộ bóc tách native; không sửa DOM chat.',
      );
    }

    if (/kemini_noass|hyperpmtprocess|hypermerge/.test(lower) || laObj(data['chat_history'])) {
      them(
        ra,
        packId,
        scriptId,
        ten,
        'prompt_merge',
        bat,
        data,
        'Gộp lịch sử và prefix vai trò trong assembler native.',
      );
    }

    if (/updatepresetwith/.test(lower) && /<!--\\s\*scene|scene\(\?:/.test(lower)) {
      const sceneMap = docSceneMap(code, prompts);
      if (Object.keys(sceneMap).length > 0) {
        them(
          ra,
          packId,
          scriptId,
          ten,
          'scene_switch',
          bat,
          { sceneMap },
          'Đọc chỉ thị `<!-- scene … -->` và bật/tắt module trong đúng pack.',
        );
      }
    }

    if (/parsechoices|tide[_ -]?choice|<choice>/.test(lower)) {
      them(
        ra,
        packId,
        scriptId,
        ten,
        'choice_ui',
        bat,
        {},
        'Đưa `<choice>`/`<choices>` vào bộ nút lựa chọn native.',
      );
    }

    // Launcher từ xa không được tải mạng. Port các bundle đã biết sang cùng adapter
    // hữu hạn dựa trên URL được khai ngay trong script.
    if (/kemini_noass\.js/i.test(code)) {
      them(
        ra,
        packId,
        scriptId,
        `${ten} · Kemini`,
        'prompt_merge',
        bat,
        data,
        'Bản port native của bundle Kemini được launcher yêu cầu.',
      );
    }
    if (/cot-heart|silver-moon/i.test(code)) {
      them(
        ra,
        packId,
        scriptId,
        `${ten} · CoT`,
        'cot_cleanup',
        bat,
        {},
        'Bản port native của bundle hiển thị/dọn thẻ suy luận.',
      );
    }
    if (/choice|thủy triều|tide/i.test(lower)) {
      them(
        ra,
        packId,
        scriptId,
        `${ten} · lựa chọn`,
        'choice_ui',
        bat,
        {},
        'Bản port native của giao diện lựa chọn.',
      );
    }
  });

  return ra;
}

export function docChiThiScene(output: string): Readonly<Record<string, boolean>> {
  const matches = [...output.matchAll(/<!--\s*scene(?:\s+([^\r\n<>]*?))?\s*-->/gi)];
  const cuoi = matches.at(-1)?.[1] ?? '';
  const ra: Record<string, boolean> = {};
  for (const m of cuoi.matchAll(/([a-z][a-z0-9_]*)\s*:\s*([^\s]+)/gi)) {
    const khoa = m[1] ?? '';
    const raw = (m[2] ?? '').toLowerCase();
    if (khoa === '') continue;
    if (['true', 'on', '1', 'yes'].includes(raw)) ra[khoa] = true;
    else if (['false', 'off', '0', 'no'].includes(raw)) ra[khoa] = false;
  }
  return ra;
}
