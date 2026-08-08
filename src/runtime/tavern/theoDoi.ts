/**
 * Theo dõi những gì một script để lại, để tắt nó là tắt thật.
 *
 * ── Vấn đề ──
 *
 * Script Tavern Helper không có hàm `unload`. Nó đặt `setInterval`, gắn
 * `MutationObserver` lên `#chat`, nghe `document.addEventListener('click', …)` rồi
 * chạy mãi. Nếu "tắt script" chỉ là ngừng gọi nó thì mọi thứ ấy vẫn sống, và bật
 * lại một lần nữa sẽ có hai bản cùng chạy — triệu chứng là mỗi lượt kể xuất hiện
 * hai thẻ giao diện chồng nhau.
 *
 * Nên mọi thứ có thể sống lâu hơn lần chạy đều đi qua đây: timer, observer, listener
 * DOM, handler sự kiện Tavern. Tắt script là chạy ngược danh sách này.
 *
 * ── Vì sao mọi thứ đều hỏi `typeof` trước ──
 *
 * Runtime này phải nạp được trong môi trường không có DOM (test chạy trên Node).
 * Một `class extends MutationObserver` ở mức khai báo field sẽ ném ngay lúc dựng
 * đối tượng, và cả bộ test của script trở thành "không chạy được" thay vì "chạy
 * và đúng".
 */
import type { BusSuKien } from './suKien.js';

type ListenerDOM = {
  readonly dich: EventTarget;
  readonly kieu: string;
  readonly fn: EventListenerOrEventListenerObject;
  readonly opt: unknown;
};

type CoDisconnect = { disconnect(): void };

export class TheoDoi {
  private readonly timer = new Set<number>();
  private readonly interval = new Set<number>();
  private readonly raf = new Set<number>();
  private readonly observer = new Set<CoDisconnect>();
  private readonly listener: ListenerDOM[] = [];
  private readonly chuSo: string;
  private readonly bus: BusSuKien;

  constructor(chuSo: string, bus: BusSuKien) {
    this.chuSo = chuSo;
    this.bus = bus;
  }

  // ── timer ──

  datTimeout = (fn: TimerHandler, ms?: number, ...a: unknown[]): number => {
    const id = setTimeout(
      (...t: unknown[]) => {
        this.timer.delete(id);
        if (typeof fn === 'function') (fn as (...x: unknown[]) => void)(...t);
      },
      ms,
      ...a,
    ) as unknown as number;
    this.timer.add(id);
    return id;
  };

  xoaTimeout = (id?: number): void => {
    if (id === undefined) return;
    this.timer.delete(id);
    clearTimeout(id);
  };

  datInterval = (fn: TimerHandler, ms?: number, ...a: unknown[]): number => {
    const id = setInterval(fn, ms, ...a) as unknown as number;
    this.interval.add(id);
    return id;
  };

  xoaInterval = (id?: number): void => {
    if (id === undefined) return;
    this.interval.delete(id);
    clearInterval(id);
  };

  datRaf = (fn: FrameRequestCallback): number => {
    if (typeof requestAnimationFrame !== 'function') return this.datTimeout(() => fn(0), 16);
    const id = requestAnimationFrame((t) => {
      this.raf.delete(id);
      fn(t);
    });
    this.raf.add(id);
    return id;
  };

  xoaRaf = (id?: number): void => {
    if (id === undefined) return;
    if (this.raf.delete(id) && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id);
    else this.xoaTimeout(id);
  };

  /**
   * `MutationObserver` con — mọi instance script tạo đều bị ngắt khi tắt script.
   *
   * Dựng LƯỜI để file nạp được ở nơi không có DOM; nơi không có nó thì script
   * nhận một lớp không làm gì, và điều đó đúng: không có DOM thì cũng không có
   * gì để quan sát.
   */
  get LopObserver(): typeof MutationObserver {
    if (typeof MutationObserver === 'undefined') {
      return class {
        observe(): void {}
        disconnect(): void {}
        takeRecords(): MutationRecord[] {
          return [];
        }
      } as unknown as typeof MutationObserver;
    }
    const ghiNhan = (o: CoDisconnect): void => {
      this.observer.add(o);
    };
    return class extends MutationObserver {
      constructor(cb: MutationCallback) {
        super(cb);
        ghiNhan(this);
      }
    };
  }

  ghiListener(dich: EventTarget, kieu: string, fn: EventListenerOrEventListenerObject, opt: unknown): void {
    this.listener.push({ dich, kieu, fn, opt });
  }

  /**
   * Bọc `document` / `window` để bắt `addEventListener`.
   *
   * Proxy phải `bind` mọi hàm về đối tượng gốc: gọi `document.querySelector` qua
   * proxy mà không bind sẽ ném "Illegal invocation" — và script chết ở dòng đầu.
   */
  boc<T extends object>(goc: T): T {
    const ghi = (dich: EventTarget, kieu: string, fn: EventListenerOrEventListenerObject, opt: unknown) =>
      this.ghiListener(dich, kieu, fn, opt);
    return new Proxy(goc, {
      get(t, p, _r) {
        if (p === 'addEventListener') {
          return (kieu: string, fn: EventListenerOrEventListenerObject, opt?: unknown): void => {
            ghi(t as unknown as EventTarget, kieu, fn, opt);
            (t as unknown as EventTarget).addEventListener(kieu, fn, opt as AddEventListenerOptions);
          };
        }
        const v = Reflect.get(t, p, t) as unknown;
        return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(t) : v;
      },
      set(t, p, v) {
        Reflect.set(t, p, v, t);
        return true;
      },
    });
  }

  /** Gỡ sạch. Gọi được nhiều lần; lần sau không làm gì thêm. */
  don(): void {
    for (const id of this.timer) clearTimeout(id);
    for (const id of this.interval) clearInterval(id);
    if (typeof cancelAnimationFrame === 'function') {
      for (const id of this.raf) cancelAnimationFrame(id);
    }
    for (const o of this.observer) o.disconnect();
    for (const l of this.listener) {
      l.dich.removeEventListener(l.kieu, l.fn, l.opt as EventListenerOptions);
    }
    this.timer.clear();
    this.interval.clear();
    this.raf.clear();
    this.observer.clear();
    this.listener.length = 0;
    this.bus.goTheoChuSo(this.chuSo);
    /*
     * Node script tự gắn nhãn thì dọn luôn. Không quét mù cả DOM: xóa nhầm một
     * node của trò chơi còn tệ hơn để lại một thẻ thừa của script.
     */
    if (typeof document === 'undefined') return;
    const khoa = typeof CSS !== 'undefined' ? CSS.escape(this.chuSo) : this.chuSo.replace(/"/g, '\\"');
    for (const el of document.querySelectorAll(`[data-td-script="${khoa}"]`)) el.remove();
  }
}
