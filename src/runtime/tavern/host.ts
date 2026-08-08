/**
 * Host chạy script Tavern Helper — **chạy thật, không cách ly**.
 *
 * ── Cách chạy ──
 *
 * Mỗi script được bọc trong một `AsyncFunction` mà tham số chính là bảng toàn cục
 * của Tavern Helper. Ba lý do chọn cách này thay vì iframe:
 *
 * 1. Script khai `const Config = …` ở mức ngoài cùng. Chạy chung một scope thì
 *    script thứ hai nổ ngay dòng đầu vì trùng tên; bọc hàm là đủ để tách.
 * 2. Script DOM cần **document thật** của trò chơi — `#chat`, `.mes`, `.mes_text`.
 *    Trong iframe chúng sẽ query một tài liệu rỗng rồi lặng lẽ không làm gì.
 * 3. `await` ở mức ngoài cùng và `import()` động vẫn chạy được trong hàm async.
 *
 * ── Tắt là tắt thật ──
 *
 * `TheoDoi` giữ mọi timer, observer, listener và handler sự kiện script để lại.
 * Không có nó thì "tắt script" chỉ là ngừng gọi, và bật lại lần nữa sẽ có hai bản
 * cùng chạy.
 */
import type { HelperScript } from '../../core/preset/schema.js';
import { dungApi } from './api.js';
import type { CauNoiTavern } from './cauNoi.js';
import { cauNoiRong } from './cauNoi.js';
import { BusSuKien } from './suKien.js';
import { TheoDoi } from './theoDoi.js';

export type TrangThaiScript = 'dang_chay' | 'loi' | 'da_dung';

export type DongNhatKy = {
  readonly muc: 'log' | 'info' | 'warn' | 'error';
  readonly dong: string;
};

export type BanGhiScript = {
  readonly id: string;
  readonly packId: string;
  readonly ten: string;
  readonly trangThai: TrangThaiScript;
  readonly loi: readonly string[];
  readonly nut: readonly { readonly name: string; readonly visible: boolean }[];
};

type DangChay = {
  readonly def: HelperScript;
  readonly theoDoi: TheoDoi;
  trangThai: TrangThaiScript;
  loi: string[];
};

const AsyncFunction = Object.getPrototypeOf(async function () {
  /* lấy constructor của hàm async */
}).constructor as new (...a: string[]) => (...b: unknown[]) => Promise<unknown>;

export class HostScript {
  readonly bus = new BusSuKien();
  private cau: CauNoiTavern = cauNoiRong();
  private readonly dang = new Map<string, DangChay>();
  /** Người dùng host cài chỗ nhận thay đổi để giao diện vẽ lại. */
  onDoi: (() => void) | null = null;

  constructor() {
    this.bus.onLoi = (chuSo, loi, ten) => {
      this.themLoi(chuSo, `sự kiện ${ten}: ${loi.message}`);
    };
  }

  /** Cài cầu nối tới trò chơi. Gọi lại được — script đang chạy dùng bản mới ngay. */
  datCauNoi(cau: CauNoiTavern): void {
    this.cau = cau;
  }

  cauNoi(): CauNoiTavern {
    return this.cau;
  }

  dangChay(): BanGhiScript[] {
    return [...this.dang.values()].map((d) => ({
      id: d.def.id,
      packId: d.def.packId,
      ten: d.def.ten,
      trangThai: d.trangThai,
      loi: [...d.loi],
      nut: d.def.buttons.map((b) => ({ name: b.name, visible: b.visible })),
    }));
  }

  co(id: string): boolean {
    return this.dang.has(id);
  }

  private themLoi(scriptId: string, dong: string): void {
    const d = this.dang.get(scriptId);
    if (d === undefined) return;
    d.loi = [...d.loi.slice(-9), dong];
    d.trangThai = 'loi';
    this.cau.ghiNhatKy(scriptId, 'error', dong);
    this.onDoi?.();
  }

  /**
   * Nạp và chạy một script.
   *
   * Lỗi biên dịch hay lỗi lúc chạy KHÔNG ném ra ngoài: một preset hỏng không được
   * làm treo màn hình. Nó được ghi vào bản ghi của chính script, và Xưởng Preset
   * in ra ngay cạnh nút bật/tắt.
   */
  async chay(def: HelperScript): Promise<void> {
    if (this.dang.has(def.id)) this.dung(def.id);
    if (def.noiDung.trim() === '') return;

    const theoDoi = new TheoDoi(def.id, this.bus);
    const ban: DangChay = { def, theoDoi, trangThai: 'dang_chay', loi: [] };
    this.dang.set(def.id, ban);
    this.onDoi?.();

    const api = dungApi({ def, cau: this.cau, bus: this.bus });
    const bang: Record<string, unknown> = {
      ...api,
      // Bọc để tắt script là dọn sạch mọi thứ nó cắm vào trang.
      setTimeout: theoDoi.datTimeout,
      clearTimeout: theoDoi.xoaTimeout,
      setInterval: theoDoi.datInterval,
      clearInterval: theoDoi.xoaInterval,
      requestAnimationFrame: theoDoi.datRaf,
      cancelAnimationFrame: theoDoi.xoaRaf,
      MutationObserver: theoDoi.LopObserver,
      /*
       * Không có DOM (test chạy trên Node) thì `document`/`window` là `undefined`
       * chứ không phải một object giả. Script DOM sẽ ném `TypeError` ở dòng đầu
       * và trạng thái của nó thành `loi` — nói đúng chuyện đang xảy ra, thay vì
       * chạy êm trên một DOM rỗng rồi không làm gì.
       */
      document: typeof document === 'undefined' ? undefined : theoDoi.boc(document),
      window: typeof window === 'undefined' ? undefined : theoDoi.boc(window),
      globalThis: typeof window === 'undefined' ? undefined : theoDoi.boc(window),
    };

    const ten = Object.keys(bang);
    const than = `"use strict";\nreturn (async () => {\n${def.noiDung}\n})();`;

    try {
      const fn = new AsyncFunction(...ten, than);
      await fn(...ten.map((k) => bang[k]));
      /*
       * Chạy xong mà không ném thì script coi như đang sống: phần lớn script chỉ
       * đăng ký handler rồi kết thúc thân hàm, và "kết thúc" ở đây không có nghĩa
       * là "đã dừng".
       */
      if (ban.trangThai === 'dang_chay') this.onDoi?.();
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      ban.loi = [...ban.loi, msg];
      ban.trangThai = 'loi';
      this.cau.ghiNhatKy(def.id, 'error', msg);
      this.onDoi?.();
    }
  }

  dung(id: string): void {
    const d = this.dang.get(id);
    if (d === undefined) return;
    try {
      d.theoDoi.don();
    } catch {
      // Dọn lỗi vẫn phải gỡ bản ghi, nếu không script sẽ kẹt ở trạng thái "đang chạy".
    }
    this.dang.delete(id);
    this.onDoi?.();
  }

  dungTatCa(): void {
    for (const id of [...this.dang.keys()]) this.dung(id);
  }

  /** Bấm một nút script tự khai — Tavern Helper phát `${scriptId}_${tênNút}`. */
  async bamNut(scriptId: string, ten: string): Promise<void> {
    await this.bus.phat(`${scriptId}_${ten}`);
  }

  /** Phát một sự kiện Tavern cho mọi script đang chạy. */
  async phat(ten: string, ...tham: unknown[]): Promise<void> {
    await this.bus.phat(ten, ...tham);
  }
}

/** Một host duy nhất cho cả ứng dụng — script là trạng thái toàn cục theo bản chất. */
export const hostScript = new HostScript();
