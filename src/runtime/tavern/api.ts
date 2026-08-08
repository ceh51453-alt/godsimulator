/**
 * Bộ hàm toàn cục mà một script Tavern Helper thấy khi chạy.
 *
 * Đây là bản dựng lại API của Tavern Helper trên nền Thiên Diễn: cùng tên hàm,
 * cùng hình dạng tham số, cùng kiểu trả về. Script viết cho SillyTavern chạy được
 * mà không phải sửa dòng nào — đó là toàn bộ mục đích của file này.
 *
 * Cái KHÔNG có ở đây cũng cố ý: không hàm nào ghi thẳng `WorldState`, không hàm
 * nào gọi model ngoài đường `guiLuot()` mà chính người chơi cũng đi qua. Không
 * phải vì sợ script — người dùng tự viết chúng — mà vì một script ghi thẳng vào
 * thế giới sẽ phá replay xác định, và lúc ấy chẳng còn cách nào tái hiện một ván.
 */
import _ from 'lodash';
import { z } from 'zod';
import $ from 'jquery';
import type { HelperScript } from '../../core/preset/schema.js';
import type { CauNoiTavern, PresetTho, TinNhanTavern } from './cauNoi.js';
import type { BusSuKien, XuLySuKien } from './suKien.js';
import { IFRAME_EVENTS, TAVERN_EVENTS } from './suKien.js';

type Bang = Record<string, unknown>;

const laObj = (v: unknown): v is Bang => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Đọc `range` của `getChatMessages`.
 *
 * ST nhận `0`, `'3'`, `'0-5'`, `-1` (đếm ngược) và `'{{lastMessageId}}'`. Bỏ sót
 * dạng nào thì script chỉ nhận mảng rỗng rồi `return` sớm — hỏng im lặng, đúng
 * kiểu khó truy nhất.
 */
function docPhamVi(range: unknown, soTin: number): [number, number] {
  const cuoi = soTin - 1;
  const mot = (v: string): number => {
    const s = v.trim().replace(/\{\{\s*lastMessageId\s*\}\}/gi, String(cuoi));
    const n = Number(s);
    if (!Number.isFinite(n)) return cuoi;
    return n < 0 ? Math.max(0, soTin + n) : n;
  };
  if (typeof range === 'number') {
    const n = range < 0 ? Math.max(0, soTin + range) : range;
    return [n, n];
  }
  if (typeof range === 'string') {
    const m = /^\s*(-?\d+|\{\{[^}]+\}\})\s*-\s*(-?\d+|\{\{[^}]+\}\})\s*$/.exec(range);
    if (m) return [mot(m[1] as string), mot(m[2] as string)];
    const n = mot(range);
    return [n, n];
  }
  return [cuoi, cuoi];
}

export type ThamSoApi = {
  readonly def: HelperScript;
  readonly cau: CauNoiTavern;
  readonly bus: BusSuKien;
};

/**
 * Dựng bảng toàn cục cho một script.
 *
 * Trả về một object phẳng `tên → giá trị`; `host.ts` biến nó thành danh sách tham
 * số của hàm bọc, nên script thấy chúng đúng như biến toàn cục.
 */
export function dungApi(ts: ThamSoApi): Bang {
  const { def, cau, bus } = ts;
  const scriptId = def.id;

  const ghi = (muc: 'log' | 'info' | 'warn' | 'error', ...phan: unknown[]): void => {
    const dong = phan
      .map((p) => {
        if (typeof p === 'string') return p;
        try {
          return JSON.stringify(p);
        } catch {
          return String(p);
        }
      })
      .join(' ');
    cau.ghiNhatKy(scriptId, muc, dong);
  };

  // ─────────────────────────────────────────── biến

  const phamViCua = (opt: unknown): Parameters<CauNoiTavern['docBien']>[0] => {
    const o = laObj(opt) ? opt : {};
    const type = typeof o['type'] === 'string' ? (o['type'] as string) : 'script';
    return {
      type: type as 'script' | 'chat' | 'global' | 'message' | 'character' | 'preset',
      script_id: typeof o['script_id'] === 'string' ? o['script_id'] : scriptId,
      message_id:
        typeof o['message_id'] === 'number' || typeof o['message_id'] === 'string'
          ? (o['message_id'] as number | string)
          : undefined,
    };
  };

  const getVariables = (opt?: unknown): Bang => _.cloneDeep(cau.docBien(phamViCua(opt)));

  const replaceVariables = (bien: unknown, opt?: unknown): void => {
    cau.ghiBien(phamViCua(opt), laObj(bien) ? _.cloneDeep(bien) : {});
    void bus.phat(IFRAME_EVENTS.VARIABLES_UPDATED, bien);
  };

  /** `insertVariables` của ST chỉ điền khóa CÒN THIẾU — không ghi đè giá trị cũ. */
  const insertVariables = (bien: unknown, opt?: unknown): void => {
    const pham = phamViCua(opt);
    const cu = cau.docBien(pham);
    cau.ghiBien(pham, _.defaultsDeep(_.cloneDeep(cu), laObj(bien) ? bien : {}) as Bang);
  };

  const insertOrAssignVariables = (bien: unknown, opt?: unknown): void => {
    const pham = phamViCua(opt);
    cau.ghiBien(pham, _.merge(_.cloneDeep(cau.docBien(pham)), laObj(bien) ? bien : {}));
  };

  const updateVariablesWith = async (capNhat: unknown, opt?: unknown): Promise<Bang> => {
    if (typeof capNhat !== 'function') return getVariables(opt);
    const pham = phamViCua(opt);
    const truoc = _.cloneDeep(cau.docBien(pham));
    const sau = await (capNhat as (v: Bang) => Bang | Promise<Bang>)(truoc);
    const cuoi = laObj(sau) ? sau : truoc;
    cau.ghiBien(pham, cuoi);
    void bus.phat(IFRAME_EVENTS.VARIABLES_UPDATED, cuoi);
    return cuoi;
  };

  const deleteVariable = (duong: unknown, opt?: unknown): boolean => {
    if (typeof duong !== 'string') return false;
    const pham = phamViCua(opt);
    const bien = _.cloneDeep(cau.docBien(pham));
    const co = _.has(bien, duong);
    _.unset(bien, duong);
    cau.ghiBien(pham, bien);
    return co;
  };

  // ─────────────────────────────────────────── sự kiện

  /*
   * Handler mang theo `scriptId` làm chủ sở hữu, nên `bus.goTheoChuSo()` gỡ được
   * hết khi tắt script. Không cần một sổ theo dõi thứ hai ở `TheoDoi`: hai sổ cho
   * cùng một danh sách là hai sổ sẽ lệch nhau.
   */
  const eventOn = (ten: unknown, fn: unknown): void => {
    if (typeof ten !== 'string' || typeof fn !== 'function') return;
    bus.on(ten, fn as XuLySuKien, scriptId);
  };
  const eventOnce = (ten: unknown, fn: unknown): void => {
    if (typeof ten !== 'string' || typeof fn !== 'function') return;
    bus.on(ten, fn as XuLySuKien, scriptId, true);
  };
  const eventRemoveListener = (ten: unknown, fn: unknown): void => {
    if (typeof ten === 'string' && typeof fn === 'function') bus.off(ten, fn as XuLySuKien);
  };
  const eventEmit = async (ten: unknown, ...tham: unknown[]): Promise<void> => {
    if (typeof ten === 'string') await bus.phat(ten, ...tham);
  };

  // ─────────────────────────────────────────── khung kể

  const getChatMessages = (range?: unknown, _opt?: unknown): TinNhanTavern[] => {
    const ds = cau.docTinNhan();
    if (ds.length === 0) return [];
    const [a, b] = docPhamVi(range ?? ds.length - 1, ds.length);
    const lo = Math.max(0, Math.min(a, b));
    const hi = Math.min(ds.length - 1, Math.max(a, b));
    return ds.slice(lo, hi + 1).map((m) => ({ ...m, data: { ...m.data }, extra: { ...m.extra } }));
  };

  const setChatMessages = (ds: unknown, _opt?: unknown): void => {
    if (!Array.isArray(ds)) return;
    for (const m of ds) {
      if (!laObj(m)) continue;
      const id = typeof m['message_id'] === 'number' ? m['message_id'] : -1;
      const noiDung = typeof m['message'] === 'string' ? m['message'] : null;
      if (id >= 0 && noiDung !== null) cau.ghiTinNhan(id, noiDung);
    }
  };

  // ─────────────────────────────────────────── preset

  const getPreset = (ten?: unknown): PresetTho | null =>
    cau.docPreset(typeof ten === 'string' ? ten : 'in_use');

  const updatePresetWith = async (
    ten: unknown,
    capNhat: unknown,
    _opt?: unknown,
  ): Promise<PresetTho | null> => {
    const key = typeof ten === 'string' ? ten : 'in_use';
    const cu = cau.docPreset(key);
    if (cu === null || typeof capNhat !== 'function') return cu;
    const ban = _.cloneDeep(cu);
    const sau = await (capNhat as (p: PresetTho) => PresetTho | Promise<PresetTho>)(ban);
    const cuoi = sau === undefined || sau === null ? ban : sau;
    cau.ghiPreset(key, cuoi);
    return cuoi;
  };

  const replacePreset = async (ten: unknown, preset: unknown): Promise<void> => {
    if (typeof ten !== 'string' || !laObj(preset)) return;
    cau.ghiPreset(ten, preset as unknown as PresetTho);
  };

  // ─────────────────────────────────────────── văn bản

  const formatAsTavernRegexedString = (
    text: unknown,
    source?: unknown,
    destination?: unknown,
    opt?: unknown,
  ): string => {
    if (typeof text !== 'string') return '';
    const o = laObj(opt) ? opt : {};
    return cau.chayRegex(text, {
      source: source === 'user_input' ? 'user_input' : 'ai_output',
      destination: destination === 'prompt' ? 'prompt' : 'display',
      depth: typeof o['depth'] === 'number' ? o['depth'] : 0,
    });
  };

  // ─────────────────────────────────────────── hành động

  const generate = async (cauHinh?: unknown): Promise<string> => {
    const o = laObj(cauHinh) ? cauHinh : {};
    const text = typeof o['user_input'] === 'string' ? o['user_input'] : '';
    if (text.trim() === '') return '';
    return cau.guiLuot(text);
  };

  /**
   * `triggerSlash` — nhận đúng những lệnh có nghĩa trong Thiên Diễn.
   *
   * Lệnh lạ không bị nuốt: nó ghi một dòng nhật ký mang nguyên văn lệnh, nên khi
   * một script "không làm gì cả" thì Xưởng Preset nói được nó đã đòi cái gì.
   */
  const triggerSlash = async (lenh: unknown): Promise<string> => {
    if (typeof lenh !== 'string') return '';
    const s = lenh.trim();
    const m = /^\/(\w+)\s*([\s\S]*)$/.exec(s);
    if (m === null) return '';
    const ten = (m[1] ?? '').toLowerCase();
    const than = (m[2] ?? '').trim();
    if (ten === 'send' || ten === 'trigger' || ten === 'sendas') return cau.guiLuot(than);
    if (ten === 'echo' || ten === 'toast') {
      cau.bao('info', than);
      return than;
    }
    if (ten === 'setvar') {
      const kv = /^key=(\S+)\s+([\s\S]*)$/.exec(than);
      if (kv) {
        const bien = _.cloneDeep(cau.docBien({ type: 'chat' }));
        _.set(bien, kv[1] as string, kv[2]);
        cau.ghiBien({ type: 'chat' }, bien);
        return kv[2] ?? '';
      }
    }
    if (ten === 'getvar') {
      const v = _.get(cau.docBien({ type: 'chat' }), than);
      return typeof v === 'string' ? v : v === undefined ? '' : JSON.stringify(v);
    }
    ghi('warn', `triggerSlash chưa hỗ trợ lệnh: ${s.slice(0, 120)}`);
    return '';
  };

  const toastr = {
    success: (t: unknown, tieuDe?: unknown) => cau.bao('success', String(t), tieuDe as string | undefined),
    info: (t: unknown, tieuDe?: unknown) => cau.bao('info', String(t), tieuDe as string | undefined),
    warning: (t: unknown, tieuDe?: unknown) => cau.bao('warning', String(t), tieuDe as string | undefined),
    error: (t: unknown, tieuDe?: unknown) => cau.bao('error', String(t), tieuDe as string | undefined),
    clear: () => undefined,
    remove: () => undefined,
  };

  /** `errorCatched` của Tavern Helper: bọc một hàm để lỗi thành toast, không thành crash. */
  const errorCatched = <T extends (...a: never[]) => unknown>(fn: T): T =>
    ((...a: never[]) => {
      try {
        const r = fn(...a);
        if (r instanceof Promise) {
          return r.catch((e: unknown) => {
            ghi('error', e instanceof Error ? e.message : String(e));
            cau.bao('error', `[${def.ten}] ${e instanceof Error ? e.message : String(e)}`);
          });
        }
        return r;
      } catch (e) {
        ghi('error', e instanceof Error ? e.message : String(e));
        cau.bao('error', `[${def.ten}] ${e instanceof Error ? e.message : String(e)}`);
        return undefined;
      }
    }) as T;

  const boiCanhST = (): Bang => {
    const tin = cau.docTinNhan();
    return {
      ...cau.boiCanh(),
      chat: tin.map((m) => ({
        name: m.name,
        is_user: m.is_user,
        is_system: m.is_system,
        mes: m.message,
        extra: m.extra,
      })),
      chatId: cau.boiCanh()['chatId'] ?? '',
      substituteParams: (t: string) => cau.thayMacro(t),
      eventSource: {
        on: (ten: string, fn: XuLySuKien) => eventOn(ten, fn),
        once: (ten: string, fn: XuLySuKien) => eventOnce(ten, fn),
        removeListener: (ten: string, fn: XuLySuKien) => eventRemoveListener(ten, fn),
        emit: (ten: string, ...t: unknown[]) => eventEmit(ten, ...t),
      },
      eventTypes: TAVERN_EVENTS,
      saveSettingsDebounced: () => undefined,
      saveChatDebounced: () => undefined,
    };
  };

  const TavernHelper: Bang = {
    getScriptId: () => scriptId,
    getVariables,
    replaceVariables,
    insertVariables,
    insertOrAssignVariables,
    updateVariablesWith,
    deleteVariable,
    getChatMessages,
    setChatMessages,
    getPreset,
    updatePresetWith,
    replacePreset,
    generate,
    triggerSlash,
    formatAsTavernRegexedString,
    substitudeMacros: (t: unknown) => cau.thayMacro(String(t)),
    errorCatched,
  };

  return {
    // thư viện
    _,
    lodash: _,
    z,
    $,
    jQuery: $,
    toastr,
    SillyTavern: { getContext: boiCanhST, libs: { lodash: _, z } },
    TavernHelper,

    // danh tính script
    getScriptId: () => scriptId,
    getIframeName: () => `script-iframe-${scriptId}`,
    getButtonEvent: (ten: unknown) => `${scriptId}_${String(ten)}`,
    getScriptButtons: () => def.buttons.map((b) => ({ ...b })),

    // biến
    getVariables,
    getAllVariables: getVariables,
    replaceVariables,
    insertVariables,
    insertOrAssignVariables,
    updateVariablesWith,
    deleteVariable,

    // sự kiện
    tavern_events: TAVERN_EVENTS,
    iframe_events: IFRAME_EVENTS,
    eventOn,
    eventOnce,
    eventRemoveListener,
    eventClearEvent: (ten: unknown) => bus.xoaSuKien(String(ten)),
    eventClearListener: (ten: unknown, fn: unknown) => eventRemoveListener(ten, fn),
    eventClearAll: () => bus.goTheoChuSo(scriptId),
    eventEmit,
    eventEmitAndWait: eventEmit,
    eventMakeFirst: (ten: unknown, fn: unknown) => {
      if (typeof ten === 'string' && typeof fn === 'function') bus.datUuTien(ten, fn as XuLySuKien, -1);
    },
    eventMakeLast: (ten: unknown, fn: unknown) => {
      if (typeof ten === 'string' && typeof fn === 'function') bus.datUuTien(ten, fn as XuLySuKien, 1);
    },

    // khung kể
    getChatMessages,
    setChatMessages,
    getLastMessageId: () => Math.max(-1, cau.docTinNhan().length - 1),
    getCurrentMessageId: () => Math.max(-1, cau.docTinNhan().length - 1),

    // preset
    getPreset,
    getPresetNames: () => [...cau.danhSachPreset()],
    getLoadedPresetName: () => cau.tenPresetDangDung(),
    isPresetExist: (ten: unknown) => cau.danhSachPreset().includes(String(ten)),
    updatePresetWith,
    replacePreset,
    setPreset: replacePreset,

    // văn bản
    substitudeMacros: (t: unknown) => cau.thayMacro(String(t)),
    substituteMacros: (t: unknown) => cau.thayMacro(String(t)),
    formatAsTavernRegexedString,
    getTavernRegexes: () => cau.danhSachRegex().map((r) => ({ ...r })),
    isCharacterTavernRegexesEnabled: () => true,
    updateTavernRegexesWith: async (capNhat: unknown) => {
      if (typeof capNhat !== 'function') return;
      const ds = cau.danhSachRegex().map((r) => ({ ...r }));
      const sau = await (capNhat as (d: unknown[]) => unknown[] | Promise<unknown[]>)(ds);
      for (const r of Array.isArray(sau) ? sau : ds) {
        if (laObj(r) && typeof r['id'] === 'string') cau.batTatRegex(r['id'], r['enabled'] === true);
      }
    },

    // hành động
    generate,
    generateRaw: generate,
    triggerSlash,
    stopAllGeneration: () => undefined,
    errorCatched,

    // nhật ký — vẫn ra console thật, nhưng Xưởng Preset đọc được
    console: {
      log: (...a: unknown[]) => {
        ghi('log', ...a);
        console.log(`[${def.ten}]`, ...a);
      },
      info: (...a: unknown[]) => {
        ghi('info', ...a);
        console.info(`[${def.ten}]`, ...a);
      },
      warn: (...a: unknown[]) => {
        ghi('warn', ...a);
        console.warn(`[${def.ten}]`, ...a);
      },
      error: (...a: unknown[]) => {
        ghi('error', ...a);
        console.error(`[${def.ten}]`, ...a);
      },
      debug: (...a: unknown[]) => console.debug(`[${def.ten}]`, ...a),
      table: (...a: unknown[]) => console.table(...(a as [unknown])),
      group: () => undefined,
      groupEnd: () => undefined,
    },
  };
}
