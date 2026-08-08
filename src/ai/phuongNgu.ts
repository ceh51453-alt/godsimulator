/**
 * Bốn phương ngữ API — Phần 31.1, 62.4.
 *
 * ── Vì sao là bảng dữ liệu chứ không phải bốn hàm rải rác ──
 *
 * [BB] 31.2: "Không hardcode tham số của bất kỳ model nào trong code." Khác biệt
 * giữa bốn nhà cung cấp gói gọn trong bốn thứ: **đường dẫn**, **header xác thực**,
 * **hình dạng body** và **chỗ chứa câu trả lời**. Viết chúng thành một bảng thì
 * thêm nhà thứ năm là thêm một dòng, không phải sửa bốn nhánh `if`.
 *
 * [BB] 62.4 — giữ raw, chỉ gửi phần model hỗ trợ: hàm dựng body dưới đây bỏ qua
 * mọi tham số phương ngữ ấy không hiểu, thay vì gửi đi rồi nhận 400.
 */
import type { Dialect, GenParams } from '../core/schema/ai.js';

export type YeuCauGoi = {
  readonly heThong: string;
  readonly nguoiDung: string;
  readonly modelId: string;
  readonly params: GenParams;
  /**
   * Mồi câu trả lời — tầng 6 của 63.6.
   *
   * Preset SillyTavern gọi nó là assistant prefill và dùng nó để ép định dạng
   * đầu ra. Nó chỉ được gửi khi profile khai model nhận prefill; model không
   * nhận thì `bienDichPromptPreset()` đã bỏ module ấy kèm issue, và trường này
   * tới đây rỗng. Rỗng thì không có message nào được thêm — không gửi một lượt
   * assistant trống, vì vài proxy coi đó là lỗi.
   */
  readonly moiTraLoi?: string;
};

export type DacTaGoi = {
  readonly url: string;
  readonly header: Readonly<Record<string, string>>;
  readonly body: unknown;
};

const catDuoi = (s: string): string => s.replace(/\/+$/, '');

/**
 * Ghép đường dẫn mà không nhân đôi đoạn đã có.
 *
 * Người chơi dán proxy theo đủ kiểu: `https://x.y`, `https://x.y/v1`,
 * `https://x.y/v1/chat/completions`. Cả ba đều là ý muốn hợp lệ, và bắt họ nhớ
 * đúng hậu tố là bắt họ đọc tài liệu của ta thay vì chơi.
 */
export function ghepDuong(goc: string, duoi: string): string {
  const g = catDuoi(goc.trim());
  const d = duoi.replace(/^\/+/, '');
  if (g.toLowerCase().endsWith(`/${d.toLowerCase()}`)) return g;
  // `/v1` đã có sẵn thì không thêm `/v1` lần nữa.
  const doan = d.split('/');
  const daCo = doan.findIndex((x) => g.toLowerCase().endsWith(`/${x.toLowerCase()}`));
  if (daCo >= 0) return `${g}/${doan.slice(daCo + 1).join('/')}`.replace(/\/+$/, '');
  return `${g}/${d}`;
}

/**
 * Tham số phương ngữ nào chấp nhận. Thiếu tên ở đây thì không gửi đi.
 *
 * `tu_do` nhận thêm bốn bộ lấy mẫu mở rộng (`top_k`, `min_p`, `top_a`,
 * `repetition_penalty`). Đó không phải chuyện thẩm mỹ: preset SillyTavern khai
 * đúng bốn trường ấy, và `tu_do` là đường đi tới OpenRouter · vLLM · SGLang ·
 * one-api — nơi chúng thật sự có tác dụng. Bỏ chúng khỏi bảng này là cách mà
 * `top_k: 500` của một preset biến mất mà không ai báo.
 *
 * `openai` cố ý KHÔNG có chúng: API chính thức từ chối cả lời gọi khi gặp khóa
 * lạ, nên gửi thừa ở đó là mất lượt chứ không phải mất tham số.
 */
const THAM_SO_HO_TRO: Readonly<Record<Dialect, readonly string[]>> = Object.freeze({
  tu_do: [
    'temperature',
    'top_p',
    'top_k',
    'min_p',
    'top_a',
    'repetition_penalty',
    'max_tokens',
    'presence_penalty',
    'frequency_penalty',
    'stop',
    'seed',
  ],
  openai: ['temperature', 'top_p', 'max_tokens', 'presence_penalty', 'frequency_penalty', 'stop', 'seed'],
  anthropic: ['temperature', 'top_p', 'top_k', 'max_tokens', 'stop_sequences'],
  gemini: ['temperature', 'topP', 'topK', 'maxOutputTokens', 'stopSequences', 'candidateCount'],
});

function locTheoHoTro(dialect: Dialect, ung: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const cho = new Set(THAM_SO_HO_TRO[dialect]);
  const ra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ung)) {
    if (!cho.has(k)) continue;
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    ra[k] = v;
  }
  return ra;
}

/** Dựng đúng một lời gọi cho phương ngữ đang chọn. */
export function dacTaGoi(dialect: Dialect, proxyUrl: string, matKhau: string, yc: YeuCauGoi): DacTaGoi {
  const p = yc.params;
  const moi = (yc.moiTraLoi ?? '').trim();

  if (dialect === 'anthropic') {
    return {
      url: ghepDuong(proxyUrl, 'v1/messages'),
      header: {
        'content-type': 'application/json',
        'x-api-key': matKhau,
        'anthropic-version': '2023-06-01',
        // Proxy chạy trong trình duyệt cần header này, nếu không Anthropic từ chối origin.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: {
        model: yc.modelId,
        ...(p.streaming ? { stream: true } : {}),
        system: yc.heThong,
        messages:
          moi === ''
            ? [{ role: 'user', content: yc.nguoiDung }]
            : [
                { role: 'user', content: yc.nguoiDung },
                { role: 'assistant', content: moi },
              ],
        ...locTheoHoTro(dialect, {
          temperature: p.temperature,
          top_p: p.topP,
          top_k: p.topK > 0 ? p.topK : undefined,
          max_tokens: p.maxOutputTokens,
          stop_sequences: p.stopSequences,
        }),
      },
    };
  }

  if (dialect === 'gemini') {
    const tacVu = p.streaming ? 'streamGenerateContent' : 'generateContent';
    const co = ghepDuong(proxyUrl, `v1beta/models/${yc.modelId}:${tacVu}`);
    const truyVan = new URLSearchParams();
    if (matKhau !== '') truyVan.set('key', matKhau);
    if (p.streaming) truyVan.set('alt', 'sse');
    const hauTo = truyVan.size > 0 ? `?${truyVan.toString()}` : '';
    return {
      url: `${co}${hauTo}`,
      header: { 'content-type': 'application/json' },
      body: {
        systemInstruction: { parts: [{ text: yc.heThong }] },
        contents:
          moi === ''
            ? [{ role: 'user', parts: [{ text: yc.nguoiDung }] }]
            : [
                { role: 'user', parts: [{ text: yc.nguoiDung }] },
                // Gemini gọi lượt của model là `model`, không phải `assistant`.
                { role: 'model', parts: [{ text: moi }] },
              ],
        generationConfig: locTheoHoTro(dialect, {
          temperature: p.temperature,
          topP: p.topP,
          topK: p.topK > 0 ? p.topK : undefined,
          maxOutputTokens: p.maxOutputTokens,
          stopSequences: p.stopSequences,
          candidateCount: p.candidateCount,
        }),
      },
    };
  }

  // `tu_do` và `openai` cùng hình dạng — khác nhau ở chỗ `tu_do` không giả định
  // gì về đường dẫn ngoài `/chat/completions`.
  return {
    url: ghepDuong(proxyUrl, 'chat/completions'),
    header: {
      'content-type': 'application/json',
      ...(matKhau === '' ? {} : { authorization: `Bearer ${matKhau}` }),
    },
    body: {
      model: yc.modelId,
      ...(p.streaming
        ? { stream: true, ...(dialect === 'openai' ? { stream_options: { include_usage: true } } : {}) }
        : {}),
      messages: [
        { role: 'system', content: yc.heThong },
        { role: 'user', content: yc.nguoiDung },
        ...(moi === '' ? [] : [{ role: 'assistant', content: moi }]),
      ],
      ...locTheoHoTro(dialect, {
        temperature: p.temperature,
        top_p: p.topP,
        max_tokens: p.maxOutputTokens,
        presence_penalty: p.presencePenalty,
        frequency_penalty: p.frequencyPenalty,
        stop: p.stopSequences,
        seed: p.seed,
        /*
         * Chỉ lên dây khi khác giá trị trung tính.
         *
         * `GenParamsSchema` luôn có bốn trường này với mặc định 0/0/0/1, nên gửi
         * vô điều kiện sẽ đính chúng vào MỌI lời gọi — kể cả tới proxy không
         * hiểu chúng, và ở đó một khóa lạ đủ để trả 400. Gửi khi người dùng
         * hoặc preset thật sự đặt một giá trị là đúng cả hai phía.
         */
        top_k: p.topK > 0 ? p.topK : undefined,
        min_p: p.minP > 0 ? p.minP : undefined,
        top_a: p.topA > 0 ? p.topA : undefined,
        repetition_penalty: p.repetitionPenalty !== 1 ? p.repetitionPenalty : undefined,
      }),
    },
  };
}

/** Rút văn bản ra khỏi phản hồi. Trả rỗng nghĩa là model im lặng — tức là hỏng. */
export function rutVanBan(dialect: Dialect, json: unknown): string {
  const o = json as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return '';

  if (dialect === 'anthropic') {
    const noiDung = o['content'];
    if (!Array.isArray(noiDung)) return '';
    return noiDung
      .map((k) => (typeof k === 'object' && k !== null ? String((k as { text?: unknown }).text ?? '') : ''))
      .join('')
      .trim();
  }

  if (dialect === 'gemini') {
    const ds = o['candidates'];
    if (!Array.isArray(ds) || ds.length === 0) return '';
    const parts = (ds[0] as { content?: { parts?: unknown } })?.content?.parts;
    if (!Array.isArray(parts)) return '';
    return parts
      .map((k) => (typeof k === 'object' && k !== null ? String((k as { text?: unknown }).text ?? '') : ''))
      .join('')
      .trim();
  }

  const ds = o['choices'];
  if (!Array.isArray(ds) || ds.length === 0) return '';
  const m = (ds[0] as { message?: { content?: unknown }; text?: unknown })?.message?.content;
  if (typeof m === 'string') return m.trim();
  const t = (ds[0] as { text?: unknown })?.text;
  return typeof t === 'string' ? t.trim() : '';
}

export type MauStream = {
  readonly vanBanMoi: string;
  readonly promptTokens: number | null;
  readonly finishReason: string | null;
};

/** Rút một mẩu SSE của bốn phương ngữ về cùng một hình dạng. */
export function rutMauStream(dialect: Dialect, json: unknown): MauStream {
  const o = json as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return { vanBanMoi: '', promptTokens: null, finishReason: null };

  if (dialect === 'anthropic') {
    const delta = o['delta'] as Record<string, unknown> | undefined;
    const khoi = o['content_block'] as Record<string, unknown> | undefined;
    const message = o['message'] as Record<string, unknown> | undefined;
    const usage = (o['usage'] ?? message?.['usage']) as Record<string, unknown> | undefined;
    const vanBanMoi =
      typeof delta?.['text'] === 'string'
        ? delta['text']
        : typeof khoi?.['text'] === 'string'
          ? khoi['text']
          : '';
    const stop = delta?.['stop_reason'] ?? o['stop_reason'];
    return {
      vanBanMoi,
      promptTokens: typeof usage?.['input_tokens'] === 'number' ? usage['input_tokens'] : null,
      finishReason:
        typeof stop === 'string'
          ? stop.toLowerCase() === 'max_tokens'
            ? 'length'
            : stop.toLowerCase()
          : null,
    };
  }

  if (dialect === 'gemini') {
    const ds = o['candidates'];
    const parts = Array.isArray(ds)
      ? (ds[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts
      : undefined;
    const vanBanMoi = Array.isArray(parts)
      ? parts
          .map((k) =>
            typeof k === 'object' && k !== null ? String((k as { text?: unknown }).text ?? '') : '',
          )
          .join('')
      : '';
    const dung = rutSoDung('gemini', o);
    return { vanBanMoi, ...dung };
  }

  const ds = o['choices'];
  const chon = Array.isArray(ds) ? (ds[0] as Record<string, unknown> | undefined) : undefined;
  const delta = chon?.['delta'] as Record<string, unknown> | undefined;
  const message = chon?.['message'] as Record<string, unknown> | undefined;
  const usage = o['usage'] as Record<string, unknown> | undefined;
  const noiDung = delta?.['content'] ?? message?.['content'];
  const stop = chon?.['finish_reason'];
  return {
    vanBanMoi: typeof noiDung === 'string' ? noiDung : '',
    promptTokens: typeof usage?.['prompt_tokens'] === 'number' ? usage['prompt_tokens'] : null,
    finishReason: typeof stop === 'string' ? stop.toLowerCase() : null,
  };
}

/** Đường liệt kê model — dùng cho nút "Quét danh sách". */
export function dacTaQuetModel(
  dialect: Dialect,
  proxyUrl: string,
  matKhau: string,
): { url: string; header: Record<string, string> } {
  if (dialect === 'anthropic') {
    return {
      url: ghepDuong(proxyUrl, 'v1/models'),
      header: {
        'x-api-key': matKhau,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    };
  }
  if (dialect === 'gemini') {
    const co = ghepDuong(proxyUrl, 'v1beta/models');
    return { url: matKhau === '' ? co : `${co}?key=${encodeURIComponent(matKhau)}`, header: {} };
  }
  return {
    url: ghepDuong(proxyUrl, 'models'),
    header: matKhau === '' ? {} : { authorization: `Bearer ${matKhau}` },
  };
}

/** Chuẩn hóa danh sách model của bốn phương ngữ về một hình dạng. */
export function rutDanhSachModel(
  dialect: Dialect,
  json: unknown,
): { id: string; ten: string; nhomNhaCungCap: string; contextMax: number | null }[] {
  const o = json as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return [];

  const tho = (dialect === 'gemini' ? o['models'] : o['data']) ?? o['models'] ?? o['data'];
  if (!Array.isArray(tho)) return [];

  const ra: { id: string; ten: string; nhomNhaCungCap: string; contextMax: number | null }[] = [];
  for (const m of tho) {
    if (typeof m !== 'object' || m === null) continue;
    const r = m as Record<string, unknown>;
    // Gemini trả `name: "models/gemini-..."`; cắt tiền tố để dùng lại được ở URL.
    const idTho = String(r['id'] ?? r['name'] ?? '');
    const id = idTho.replace(/^models\//, '');
    if (id === '') continue;
    const ctx = r['context_length'] ?? r['inputTokenLimit'] ?? r['max_context_length'];
    ra.push({
      id,
      ten: String(r['display_name'] ?? r['displayName'] ?? r['name'] ?? id).replace(/^models\//, ''),
      nhomNhaCungCap: String(r['owned_by'] ?? r['owned_by_organization'] ?? ''),
      contextMax: typeof ctx === 'number' ? ctx : null,
    });
  }
  ra.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return ra;
}

/**
 * Số token thật và lý do dừng — [BB] 34.3.
 *
 * Bốn phương ngữ khai ba kiểu khác nhau, và sai lệch giữa chúng không nhỏ:
 * OpenAI nói `usage.prompt_tokens`, Anthropic nói `usage.input_tokens`, Gemini
 * nói `usageMetadata.promptTokenCount`. Đọc nhầm một cái là tự hiệu chỉnh chỉnh
 * theo một con số không tồn tại, và `tyLeToken` trôi đi mà không ai biết.
 *
 * `finishReason === 'length'` là tín hiệu quan trọng nhất trong hàm này: nó nghĩa
 * là prompt vừa bị cắt cụt, và 33.1 đặt Sổ Nhân Quả với Sổ Phục Bút ở CUỐI —
 * tức đúng chỗ bị cắt đầu tiên.
 */
export function rutSoDung(
  dialect: Dialect,
  json: unknown,
): { promptTokens: number | null; finishReason: string | null } {
  const o = json as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return { promptTokens: null, finishReason: null };

  const so = (v: unknown): number | null => (typeof v === 'number' && v > 0 ? v : null);
  const chu = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v.toLowerCase() : null);

  if (dialect === 'gemini') {
    const um = o['usageMetadata'] as Record<string, unknown> | undefined;
    const ds = o['candidates'];
    const lyDo = Array.isArray(ds) ? chu((ds[0] as { finishReason?: unknown })?.finishReason) : null;
    // Gemini nói `MAX_TOKENS`; ta chuẩn hóa về `length` của OpenAI.
    return {
      promptTokens: so(um?.['promptTokenCount']),
      finishReason: lyDo === 'max_tokens' ? 'length' : lyDo,
    };
  }

  const usage = o['usage'] as Record<string, unknown> | undefined;
  if (dialect === 'anthropic') {
    const lyDo = chu(o['stop_reason']);
    return {
      promptTokens: so(usage?.['input_tokens']),
      finishReason: lyDo === 'max_tokens' ? 'length' : lyDo,
    };
  }

  const ds = o['choices'];
  return {
    promptTokens: so(usage?.['prompt_tokens']),
    finishReason: Array.isArray(ds) ? chu((ds[0] as { finish_reason?: unknown })?.finish_reason) : null,
  };
}
