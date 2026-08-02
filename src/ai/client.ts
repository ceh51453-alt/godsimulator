/**
 * Client AI — chỗ duy nhất trong dự án gọi `fetch`.
 *
 * [BB] luật bất biến #3: `src/core` không được chạm mạng. Nên toàn bộ phần "nhấc
 * điện thoại lên" gói trong file này, và nó nhận vào **prompt đã biên soạn** chứ
 * không nhận `WorldState`. Nhờ vậy đường rò rỉ ba tầng không đi qua đây được:
 * file này không biết thế giới trông thế nào.
 *
 * Bơm `fetch` vào qua tham số để test chạy được mà không cần mạng thật, và để
 * chứng minh đường ống đúng trước khi tiêu một đồng nào — cổng Phase 8 gọi đó là
 * "mock pass trước network".
 */
import type { AiEndpoint } from '../core/ai/cauHinh.js';
import type { PromptGoi } from '../core/ai/bienSoan.js';
import { PROMPT_THU_DUONG, thuDuongDatKhong } from '../core/ai/bienSoan.js';
import { dacTaGoi, dacTaQuetModel, rutDanhSachModel, rutVanBan, rutSoDung } from './phuongNgu.js';
import type { ModelInfo } from '../core/ai/cauHinh.js';

export type KetQuaGoi =
  | {
      readonly ok: true;
      readonly vanBan: string;
      readonly soKyTu: number;
      /**
       * Số token prompt THẬT mà model đếm được — [BB] 34.3.
       * `null` khi proxy không khai; lúc ấy tự hiệu chỉnh bỏ qua lượt này thay vì
       * chỉnh theo một con số đoán.
       */
      readonly promptTokens: number | null;
      /** `length` nghĩa là bị cắt cụt. Đã chuẩn hóa từ bốn phương ngữ. */
      readonly finishReason: string | null;
    }
  | { readonly ok: false; readonly ma: string; readonly thongDiep: string };

export type TuyChonGoi = {
  /** Bơm vào để test; mặc định là `fetch` của môi trường. */
  readonly fetchImpl?: typeof fetch;
  /** Mili giây. Model treo lâu hơn ngần này thì coi như đứt. */
  readonly hanCho?: number;
  readonly signal?: AbortSignal;
};

const HAN_CHO_MAC_DINH = 90_000;

function layFetch(t: TuyChonGoi): typeof fetch {
  const f = t.fetchImpl ?? (typeof fetch === 'function' ? fetch : undefined);
  if (!f) throw new Error('Môi trường không có fetch.');
  return f;
}

/**
 * Đọc thông điệp lỗi mà proxy trả về.
 *
 * Rất nhiều proxy trả 200 kèm `{"error": ...}`, và rất nhiều proxy trả HTML khi
 * đường dẫn sai. In `[object Object]` cho người chơi ở đây là bỏ rơi họ đúng lúc
 * họ cần biết mình dán sai cái gì.
 */
function docLoi(json: unknown, tho: string): string {
  const o = json as Record<string, unknown> | null;
  const e = o?.['error'];
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') {
    const m = (e as Record<string, unknown>)['message'];
    if (typeof m === 'string' && m.trim() !== '') return m;
  }
  const m = o?.['message'];
  if (typeof m === 'string' && m.trim() !== '') return m;
  const cat = tho.trim().slice(0, 200);
  if (/^\s*</.test(cat)) return 'Máy chủ trả về HTML thay vì JSON — nhiều khả năng địa chỉ proxy sai.';
  return cat === '' ? 'Máy chủ không nói gì.' : cat;
}

async function goiThoi(
  ep: AiEndpoint,
  heThong: string,
  nguoiDung: string,
  t: TuyChonGoi,
  moiTraLoi = '',
): Promise<KetQuaGoi> {
  const dt = dacTaGoi(ep.dialect, ep.proxyUrl, ep.proxyPassword, {
    heThong,
    nguoiDung,
    modelId: ep.modelId,
    params: ep.params,
    moiTraLoi,
  });

  const dieuKhien = new AbortController();
  const hen = setTimeout(() => dieuKhien.abort(), t.hanCho ?? HAN_CHO_MAC_DINH);
  if (t.signal) t.signal.addEventListener('abort', () => dieuKhien.abort(), { once: true });

  try {
    const res = await layFetch(t)(dt.url, {
      method: 'POST',
      headers: dt.header,
      body: JSON.stringify(dt.body),
      signal: dieuKhien.signal,
    });

    const tho = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(tho);
    } catch {
      json = null;
    }

    if (!res.ok) {
      return { ok: false, ma: `HTTP_${res.status}`, thongDiep: docLoi(json, tho) };
    }

    const vanBan = rutVanBan(ep.dialect, json);
    if (vanBan.trim() === '') {
      return {
        ok: false,
        ma: 'IM_LANG',
        thongDiep:
          json === null
            ? 'Trả lời không phải JSON đọc được.'
            : `Model trả lời rỗng. ${docLoi(json, tho)}`.trim(),
      };
    }
    const dung = rutSoDung(ep.dialect, json);
    return {
      ok: true,
      vanBan,
      soKyTu: vanBan.length,
      promptTokens: dung.promptTokens,
      finishReason: dung.finishReason,
    };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    if (err?.name === 'AbortError') {
      return { ok: false, ma: 'QUA_HAN', thongDiep: 'Model không trả lời kịp.' };
    }
    return {
      ok: false,
      ma: 'MANG_HONG',
      thongDiep: err?.message ?? 'Không gọi được tới proxy. Kiểm tra địa chỉ và kết nối.',
    };
  } finally {
    clearTimeout(hen);
  }
}

/** Gọi Tường Thuật cho một lượt kể. */
export function goiKe(ep: AiEndpoint, prompt: PromptGoi, t: TuyChonGoi = {}): Promise<KetQuaGoi> {
  return goiThoi(ep, prompt.heThong, prompt.nguoiDung, t, prompt.moiTraLoi ?? '');
}

/**
 * Gọi Cập Nhật Biến — điểm cuối riêng của 46.1.
 *
 * Nhận hai chuỗi thay vì `PromptGoi` vì Updater không có sáu tầng: nó không kể
 * chuyện, nên nó không có ngân sách tầng để chia (33.1 chỉ nói về prompt kể).
 */
export function goiCapNhat(
  ep: AiEndpoint,
  prompt: { heThong: string; nguoiDung: string },
  t: TuyChonGoi = {},
): Promise<KetQuaGoi> {
  return goiThoi(ep, prompt.heThong, prompt.nguoiDung, t);
}

/**
 * Gọi một tác vụ Diễn Hóa — 50.2.
 *
 * Khác hai hàm trên ở chỗ nó nhận **một mảng message có vai trò**, không nhận
 * cặp hệ-thống/người-dùng. [BB] 50.2: *"`nhomPrompt` là MẢNG CÓ TÊN VÀ VAI TRÒ,
 * không phải một chuỗi lớn — người dùng cần bật tắt từng nhóm để gỡ lỗi."* Gộp
 * chúng lại thành hai chuỗi ở đây sẽ vứt đi đúng thứ làm workflow gỡ được.
 *
 * Bốn phương ngữ hiện chỉ nhận hai vai qua `dacTaGoi`, nên các nhóm cùng vai
 * được nối lại theo đúng thứ tự khai báo — và thứ tự ấy là thứ tự người dùng sắp
 * trong Xưởng Workflow, không phải thứ tự chữ cái.
 */
export function goiTacVuWorkflow(
  ep: AiEndpoint,
  messages: readonly { readonly role: 'system' | 'user' | 'assistant'; readonly content: string }[],
  t: TuyChonGoi = {},
): Promise<KetQuaGoi> {
  const noi = (vai: 'system' | 'user' | 'assistant'): string =>
    messages
      .filter((m) => m.role === vai)
      .map((m) => m.content)
      .filter((c) => c.trim() !== '')
      .join('\n\n');

  const heThong = noi('system');
  // Vai `assistant` là mồi trả lời; phương ngữ nào không nhận prefill thì
  // `dacTaGoi` tự bỏ nó kèm issue — không phải việc của chỗ này.
  return goiThoi(ep, heThong, noi('user'), t, noi('assistant'));
}

export type KetQuaThuDuong = {
  readonly thong: boolean;
  readonly maLoi: string;
  readonly thongDiep: string;
  readonly modelDaTraLoi: string;
  readonly soKyTuTraVe: number;
  readonly xuatCoCauTruc: boolean;
};

/**
 * Thử đường — Phần 31.5.
 *
 * Không chỉ hỏi "có sống không": bắt model trả về đúng một từ. Một endpoint trả
 * 200 kèm trang đăng nhập cũng "sống", và người chơi sẽ tin là đã nối xong cho
 * tới khi vào game và thấy AI kể chuyện đăng nhập.
 */
export async function thuDuong(ep: AiEndpoint, t: TuyChonGoi = {}): Promise<KetQuaThuDuong> {
  const r = await goiThoi(ep, PROMPT_THU_DUONG.heThong, PROMPT_THU_DUONG.nguoiDung, {
    ...t,
    hanCho: t.hanCho ?? 30_000,
  });

  if (!r.ok) {
    return {
      thong: false,
      maLoi: r.ma,
      thongDiep: r.thongDiep,
      modelDaTraLoi: '',
      soKyTuTraVe: 0,
      xuatCoCauTruc: false,
    };
  }

  const dat = thuDuongDatKhong(r.vanBan);
  return {
    thong: dat,
    maLoi: dat ? '' : 'KHONG_NGHE_LENH',
    thongDiep: dat
      ? ''
      : `Model có trả lời nhưng không làm theo lệnh đơn giản nhất (nó nói: "${r.vanBan.slice(0, 80)}"). ` +
        'Nó vẫn kể chuyện được, nhưng patch trạng thái sẽ hay trượt.',
    modelDaTraLoi: ep.modelId,
    soKyTuTraVe: r.soKyTu,
    xuatCoCauTruc: dat,
  };
}

export type KetQuaQuet =
  | { readonly ok: true; readonly models: readonly ModelInfo[] }
  | { readonly ok: false; readonly ma: string; readonly thongDiep: string };

/** Quét danh sách model mà proxy khai — nút "Quét danh sách" ở màn Cổng AI. */
export async function quetModel(ep: AiEndpoint, t: TuyChonGoi = {}): Promise<KetQuaQuet> {
  const dt = dacTaQuetModel(ep.dialect, ep.proxyUrl, ep.proxyPassword);
  const dieuKhien = new AbortController();
  const hen = setTimeout(() => dieuKhien.abort(), t.hanCho ?? 30_000);

  try {
    const res = await layFetch(t)(dt.url, { method: 'GET', headers: dt.header, signal: dieuKhien.signal });
    const tho = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(tho);
    } catch {
      json = null;
    }
    if (!res.ok) return { ok: false, ma: `HTTP_${res.status}`, thongDiep: docLoi(json, tho) };

    const ds = rutDanhSachModel(ep.dialect, json);
    if (ds.length === 0) {
      return {
        ok: false,
        ma: 'DANH_SACH_RONG',
        thongDiep: 'Proxy không khai model nào. Bạn vẫn gõ tay tên model được.',
      };
    }
    return { ok: true, models: ds.map((m) => ({ ...m })) };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    if (err?.name === 'AbortError') return { ok: false, ma: 'QUA_HAN', thongDiep: 'Quét quá lâu.' };
    return { ok: false, ma: 'MANG_HONG', thongDiep: err?.message ?? 'Không gọi được tới proxy.' };
  } finally {
    clearTimeout(hen);
  }
}
