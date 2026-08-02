/**
 * Canonical state hash — cổng Phase 1 [BB].
 *
 * "Cùng seed + state đầu + accepted event log phải cho cùng state hash."
 *
 * Yêu cầu:
 *   - độc lập thứ tự khóa của object;
 *   - độc lập thứ tự bảng;
 *   - phân biệt được `undefined` với khóa vắng mặt;
 *   - không dùng `JSON.stringify` trần (thứ tự khóa phụ thuộc thứ tự chèn);
 *   - không dùng locale, không dùng thời gian máy;
 *   - chạy được trong Node và trình duyệt, đồng bộ, không cần WebCrypto.
 */

/**
 * FNV-1a 32-bit chuẩn. `Math.imul` giữ đúng ngữ nghĩa nhân 32-bit có tràn,
 * nên kết quả giống nhau trên mọi engine JavaScript.
 */
function fnv1a32(s: string, hatGiong: number): number {
  let h = hatGiong >>> 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    // Nạp từng byte của code unit để chuỗi UTF-16 nào cũng cho kết quả ổn định.
    h = Math.imul(h ^ (c & 0xff), 0x01000193) >>> 0;
    h = Math.imul(h ^ ((c >>> 8) & 0xff), 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const HAT_GIONG_A = 0x811c9dc5;
const HAT_GIONG_B = 0x9e3779b1;

/**
 * Băm một chuỗi thành 16 ký tự hex.
 * Hai FNV-1a độc lập với hai hạt giống khác nhau, ghép lại — xác suất trùng
 * đủ thấp để phát hiện lệch replay, và toàn bộ phép tính là số nguyên 32-bit.
 */
export function bam(s: string): string {
  const a = fnv1a32(s, HAT_GIONG_A);
  // Trộn thêm độ dài vào nhánh thứ hai để chống đụng độ do đệm.
  const b = fnv1a32(s, (HAT_GIONG_B ^ s.length) >>> 0);
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

/**
 * Tuần tự hóa chính tắc: khóa object luôn sắp xếp theo codepoint, kiểu được
 * gắn thẻ để `1` và `'1'` không băm ra cùng chuỗi.
 */
export function chuanHoa(v: unknown): string {
  return viet(v, new WeakSet<object>());
}

function viet(v: unknown, daThay: WeakSet<object>): string {
  if (v === null) return 'n';
  if (v === undefined) return 'u';

  const t = typeof v;
  if (t === 'boolean') return v === true ? 'b1' : 'b0';
  if (t === 'number') {
    const n = v as number;
    if (Number.isNaN(n)) return 'dNaN';
    if (n === Infinity) return 'd+Inf';
    if (n === -Infinity) return 'd-Inf';
    // -0 và 0 phải băm giống nhau; số nguyên và số thực viết cùng cách.
    return `d${Object.is(n, -0) ? 0 : n}`;
  }
  if (t === 'string') return `s${(v as string).length}:${v as string}`;
  if (t === 'bigint') return `g${(v as bigint).toString()}`;
  if (t === 'function' || t === 'symbol') {
    // [BB] Hàm không được nằm trong state. Băm thành giá trị cố định để lỗi
    // hiện ra ở invariant chứ không ẩn đi thành hash ngẫu nhiên.
    return 'F!';
  }

  const o = v as object;
  if (daThay.has(o)) return 'C!'; // vòng lặp tham chiếu
  daThay.add(o);

  if (Array.isArray(v)) {
    const phan = v.map((x) => viet(x, daThay));
    daThay.delete(o);
    return `a${phan.length}:[${phan.join(',')}]`;
  }

  if (v instanceof Map) {
    const cap = [...v.entries()]
      .map(([k, val]) => [viet(k, daThay), viet(val, daThay)] as const)
      .sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0));
    daThay.delete(o);
    return `m${cap.length}:{${cap.map(([k, val]) => `${k}=${val}`).join(',')}}`;
  }

  if (v instanceof Set) {
    const phan = [...v.values()].map((x) => viet(x, daThay)).sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    daThay.delete(o);
    return `e${phan.length}:{${phan.join(',')}}`;
  }

  // [BB] Sắp xếp khóa theo CODEPOINT, không dùng localeCompare.
  const khoa = Object.keys(v as Record<string, unknown>).sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  const phan = khoa.map((k) => `${viet(k, daThay)}=${viet((v as Record<string, unknown>)[k], daThay)}`);
  daThay.delete(o);
  return `o${phan.length}:{${phan.join(',')}}`;
}

/** Hash chính tắc của một giá trị bất kỳ. */
export function hashCua(v: unknown): string {
  return bam(chuanHoa(v));
}

/**
 * Hash của một tập bản ghi, ĐỘC LẬP thứ tự duyệt.
 * Băm từng bản ghi rồi sắp xếp hash — nên thứ tự lặp của Map/mảng không ảnh hưởng.
 */
export function hashTap(banGhi: Iterable<unknown>): string {
  const hs: string[] = [];
  for (const b of banGhi) hs.push(hashCua(b));
  hs.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return bam(`${hs.length}|${hs.join('|')}`);
}

/** Gộp nhiều hash con thành một hash tổng, có gắn nhãn để không lẫn bảng. */
export function hashGop(phan: Readonly<Record<string, string>>): string {
  const khoa = Object.keys(phan).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return bam(khoa.map((k) => `${k}:${phan[k]}`).join('|'));
}
