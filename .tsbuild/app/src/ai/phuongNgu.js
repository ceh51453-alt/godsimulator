const catDuoi = (s) => s.replace(/\/+$/, '');
/**
 * Ghép đường dẫn mà không nhân đôi đoạn đã có.
 *
 * Người chơi dán proxy theo đủ kiểu: `https://x.y`, `https://x.y/v1`,
 * `https://x.y/v1/chat/completions`. Cả ba đều là ý muốn hợp lệ, và bắt họ nhớ
 * đúng hậu tố là bắt họ đọc tài liệu của ta thay vì chơi.
 */
export function ghepDuong(goc, duoi) {
    const g = catDuoi(goc.trim());
    const d = duoi.replace(/^\/+/, '');
    if (g.toLowerCase().endsWith(`/${d.toLowerCase()}`))
        return g;
    // `/v1` đã có sẵn thì không thêm `/v1` lần nữa.
    const doan = d.split('/');
    const daCo = doan.findIndex((x) => g.toLowerCase().endsWith(`/${x.toLowerCase()}`));
    if (daCo >= 0)
        return `${g}/${doan.slice(daCo + 1).join('/')}`.replace(/\/+$/, '');
    return `${g}/${d}`;
}
/** Tham số phương ngữ nào chấp nhận. Thiếu tên ở đây thì không gửi đi. */
const THAM_SO_HO_TRO = Object.freeze({
    tu_do: ['temperature', 'top_p', 'max_tokens', 'presence_penalty', 'frequency_penalty', 'stop', 'seed'],
    openai: ['temperature', 'top_p', 'max_tokens', 'presence_penalty', 'frequency_penalty', 'stop', 'seed'],
    anthropic: ['temperature', 'top_p', 'top_k', 'max_tokens', 'stop_sequences'],
    gemini: ['temperature', 'topP', 'topK', 'maxOutputTokens', 'stopSequences', 'candidateCount'],
});
function locTheoHoTro(dialect, ung) {
    const cho = new Set(THAM_SO_HO_TRO[dialect]);
    const ra = {};
    for (const [k, v] of Object.entries(ung)) {
        if (!cho.has(k))
            continue;
        if (v === undefined || v === null)
            continue;
        if (Array.isArray(v) && v.length === 0)
            continue;
        ra[k] = v;
    }
    return ra;
}
/** Dựng đúng một lời gọi cho phương ngữ đang chọn. */
export function dacTaGoi(dialect, proxyUrl, matKhau, yc) {
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
                system: yc.heThong,
                messages: moi === ''
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
        const co = ghepDuong(proxyUrl, `v1beta/models/${yc.modelId}:generateContent`);
        return {
            url: matKhau === '' ? co : `${co}?key=${encodeURIComponent(matKhau)}`,
            header: { 'content-type': 'application/json' },
            body: {
                systemInstruction: { parts: [{ text: yc.heThong }] },
                contents: moi === ''
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
            }),
        },
    };
}
/** Rút văn bản ra khỏi phản hồi. Trả rỗng nghĩa là model im lặng — tức là hỏng. */
export function rutVanBan(dialect, json) {
    const o = json;
    if (!o || typeof o !== 'object')
        return '';
    if (dialect === 'anthropic') {
        const noiDung = o['content'];
        if (!Array.isArray(noiDung))
            return '';
        return noiDung
            .map((k) => (typeof k === 'object' && k !== null ? String(k.text ?? '') : ''))
            .join('')
            .trim();
    }
    if (dialect === 'gemini') {
        const ds = o['candidates'];
        if (!Array.isArray(ds) || ds.length === 0)
            return '';
        const parts = ds[0]?.content?.parts;
        if (!Array.isArray(parts))
            return '';
        return parts
            .map((k) => (typeof k === 'object' && k !== null ? String(k.text ?? '') : ''))
            .join('')
            .trim();
    }
    const ds = o['choices'];
    if (!Array.isArray(ds) || ds.length === 0)
        return '';
    const m = ds[0]?.message?.content;
    if (typeof m === 'string')
        return m.trim();
    const t = ds[0]?.text;
    return typeof t === 'string' ? t.trim() : '';
}
/** Đường liệt kê model — dùng cho nút "Quét danh sách". */
export function dacTaQuetModel(dialect, proxyUrl, matKhau) {
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
export function rutDanhSachModel(dialect, json) {
    const o = json;
    if (!o || typeof o !== 'object')
        return [];
    const tho = (dialect === 'gemini' ? o['models'] : o['data']) ?? o['models'] ?? o['data'];
    if (!Array.isArray(tho))
        return [];
    const ra = [];
    for (const m of tho) {
        if (typeof m !== 'object' || m === null)
            continue;
        const r = m;
        // Gemini trả `name: "models/gemini-..."`; cắt tiền tố để dùng lại được ở URL.
        const idTho = String(r['id'] ?? r['name'] ?? '');
        const id = idTho.replace(/^models\//, '');
        if (id === '')
            continue;
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
export function rutSoDung(dialect, json) {
    const o = json;
    if (!o || typeof o !== 'object')
        return { promptTokens: null, finishReason: null };
    const so = (v) => (typeof v === 'number' && v > 0 ? v : null);
    const chu = (v) => (typeof v === 'string' && v !== '' ? v.toLowerCase() : null);
    if (dialect === 'gemini') {
        const um = o['usageMetadata'];
        const ds = o['candidates'];
        const lyDo = Array.isArray(ds) ? chu(ds[0]?.finishReason) : null;
        // Gemini nói `MAX_TOKENS`; ta chuẩn hóa về `length` của OpenAI.
        return {
            promptTokens: so(um?.['promptTokenCount']),
            finishReason: lyDo === 'max_tokens' ? 'length' : lyDo,
        };
    }
    const usage = o['usage'];
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
        finishReason: Array.isArray(ds) ? chu(ds[0]?.finish_reason) : null,
    };
}
