/**
 * RNG seeded — Phần 3.2 `core/engine/rng.ts`; luật bất biến #7 [BB].
 *
 * [BB] Không `Math.random()`, không thời gian máy. Cùng seed + cùng chuỗi gọi
 * phải cho cùng kết quả trên mọi máy, mọi trình duyệt, mọi lần chạy.
 *
 * Dùng SplitMix64 rút gọn về 32-bit (xmur3 để băm seed + sfc32 để sinh số).
 * Cả hai là số học 32-bit thuần, không phụ thuộc IEEE-754 làm tròn.
 */

/** Băm một chuỗi thành bốn hạt 32-bit. Deterministic theo codepoint. */
function xmur3(chuoi: string): () => number {
  let h = 1779033703 ^ chuoi.length;
  for (let i = 0; i < chuoi.length; i++) {
    h = Math.imul(h ^ chuoi.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export type TrangThaiRng = readonly [number, number, number, number];

export type Rng = {
  /** [0, 1) */
  ke(): number;
  /** Số nguyên trong [0, n). n <= 0 trả 0. */
  nguyen(n: number): number;
  /** Số nguyên trong [a, b] — cả hai đầu đều lấy. */
  khoang(a: number, b: number): number;
  /** 1–100, dùng cho kiểm tra tỷ lệ phần trăm. */
  d100(): number;
  /** true với xác suất p (0–1). */
  co(p: number): boolean;
  /** Chọn một phần tử. Mảng rỗng trả undefined. */
  chon<T>(ds: readonly T[]): T | undefined;
  /** Trộn — trả mảng MỚI, không sửa tại chỗ. Fisher–Yates. */
  tron<T>(ds: readonly T[]): T[];
  /**
   * Chọn theo softmax của điểm số, nhiệt độ lấy từ tuning.
   * Nhiệt độ càng thấp càng bám điểm cao nhất.
   */
  softmax(diem: readonly number[], nhietDo: number): number;
  /** Nhánh RNG độc lập theo nhãn — cùng nhãn cho cùng nhánh. */
  nhanh(nhan: string): Rng;
  /** Trạng thái hiện tại, để snapshot và replay. */
  trangThai(): TrangThaiRng;
  /** Số lần đã rút — dùng để chứng minh replay đi đúng số bước. */
  soLanRut(): number;
};

function sfc32(a: number, b: number, c: number, d: number, batDauDem = 0): Rng {
  let s0 = a >>> 0;
  let s1 = b >>> 0;
  let s2 = c >>> 0;
  let s3 = d >>> 0;
  let dem = batDauDem;

  const ke = (): number => {
    dem++;
    s0 >>>= 0;
    s1 >>>= 0;
    s2 >>>= 0;
    s3 >>>= 0;
    let t = (s0 + s1) | 0;
    s0 = s1 ^ (s1 >>> 9);
    s1 = (s2 + (s2 << 3)) | 0;
    s2 = (s2 << 21) | (s2 >>> 11);
    s3 = (s3 + 1) | 0;
    t = (t + s3) | 0;
    s2 = (s2 + t) | 0;
    return (t >>> 0) / 4294967296;
  };

  const rng: Rng = {
    ke,

    nguyen(n) {
      if (!Number.isFinite(n) || n <= 0) return 0;
      return Math.floor(ke() * Math.floor(n));
    },

    khoang(a2, b2) {
      const lo = Math.min(a2, b2);
      const hi = Math.max(a2, b2);
      return lo + rng.nguyen(hi - lo + 1);
    },

    d100() {
      return rng.nguyen(100) + 1;
    },

    co(p) {
      if (p <= 0) return false;
      if (p >= 1) return true;
      return ke() < p;
    },

    chon(ds) {
      if (ds.length === 0) return undefined;
      return ds[rng.nguyen(ds.length)];
    },

    tron(ds) {
      const out = [...ds];
      for (let i = out.length - 1; i > 0; i--) {
        const j = rng.nguyen(i + 1);
        const tam = out[i] as (typeof out)[number];
        out[i] = out[j] as (typeof out)[number];
        out[j] = tam;
      }
      return out;
    },

    softmax(diem, nhietDo) {
      if (diem.length === 0) return -1;
      if (diem.length === 1) return 0;
      // Nhiệt độ 0 → chọn max, tie-break bằng chỉ số nhỏ nhất (deterministic).
      const t = Math.max(nhietDo, 1e-6);
      let max = -Infinity;
      for (const d of diem) if (d > max) max = d;
      const mu: number[] = [];
      let tong = 0;
      for (const d of diem) {
        const e = Math.exp((d - max) / t);
        mu.push(e);
        tong += e;
      }
      if (!Number.isFinite(tong) || tong <= 0) return 0;
      let moc = ke() * tong;
      for (let i = 0; i < mu.length; i++) {
        moc -= mu[i] as number;
        if (moc <= 0) return i;
      }
      return mu.length - 1;
    },

    nhanh(nhan) {
      // Nhánh phải phụ thuộc CẢ trạng thái hiện tại lẫn nhãn, để hai nhánh
      // cùng nhãn ở hai thời điểm khác nhau không trùng chuỗi.
      const h = xmur3(`${s0}|${s1}|${s2}|${s3}|${dem}|${nhan}`);
      return sfc32(h(), h(), h(), h());
    },

    trangThai() {
      return [s0 >>> 0, s1 >>> 0, s2 >>> 0, s3 >>> 0];
    },

    soLanRut() {
      return dem;
    },
  };

  return rng;
}

/** Tạo RNG từ một seed chuỗi. Cùng seed → cùng chuỗi số. */
export function taoRng(seed: string): Rng {
  const h = xmur3(seed);
  return sfc32(h(), h(), h(), h());
}

/** Khôi phục RNG từ trạng thái đã snapshot. */
export function tuTrangThai(tt: TrangThaiRng, soLanRut = 0): Rng {
  return sfc32(tt[0], tt[1], tt[2], tt[3], soLanRut);
}

/**
 * RNG cho một (seed, tick, kênh) cụ thể.
 * Cho phép mỗi hệ con rút số độc lập mà tổng thể vẫn deterministic, kể cả khi
 * thứ tự chạy giữa các hệ thay đổi.
 */
export function rngCuaTick(seed: string, tick: number, kenh: string): Rng {
  return taoRng(`${seed}#${tick}#${kenh}`);
}
