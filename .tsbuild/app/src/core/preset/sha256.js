/**
 * SHA-256 thuần TypeScript — bước 3 của pipeline nhập (63.1).
 *
 * ── Vì sao không dùng WebCrypto ──
 *
 * `crypto.subtle.digest` là **bất đồng bộ** và không tồn tại trong mọi ngữ cảnh
 * (`file://`, một số WebView, và Node cũ). Bước 3 nằm giữa một chuỗi kiểm tra
 * đồng bộ, và `core/` không được phụ thuộc API trình duyệt (luật bất biến #3).
 * Nên hàm băm ở đây là số học 32-bit thuần: cùng bytes cho cùng hex trên mọi máy,
 * và test đối chiếu được với `node:crypto`.
 *
 * Đây là chỗ duy nhất trong repo cần SHA-256 thật. `bam()` ở `engine/hash.ts` là
 * FNV-1a — nhanh, dùng cho hash trạng thái nội bộ, và **không** dùng để nhận diện
 * file người dùng: đặc tả 66.3/66.4 ghi SHA-256 của hai fixture, và một hàm băm
 * khác sẽ không bao giờ khớp con số ấy.
 */
const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
    0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
    0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
    0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
    0xc67178f2,
];
/** UTF-8 encode không phụ thuộc `TextEncoder` — Node cũ và một số WebView thiếu nó. */
export function utf8Bytes(s) {
    const ra = [];
    for (let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);
        if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
            const d = s.charCodeAt(i + 1);
            if (d >= 0xdc00 && d <= 0xdfff) {
                c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
                i++;
            }
        }
        if (c < 0x80)
            ra.push(c);
        else if (c < 0x800)
            ra.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
        else if (c < 0x10000)
            ra.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
        else {
            ra.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
        }
    }
    return Uint8Array.from(ra);
}
/** Số byte UTF-8 của một chuỗi — dùng cho trần `maxJsonBytes`. */
export function soByteUtf8(s) {
    return utf8Bytes(s).length;
}
const xoay = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;
/** SHA-256 của một mảng byte. Trả hex CHỮ HOA — khớp cách đặc tả 66.3 ghi hash. */
export function sha256Bytes(bytes) {
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const len = bytes.length;
    const bitLen = len * 8;
    // Đệm: 0x80, rồi 0x00 tới khi độ dài ≡ 56 (mod 64), rồi 8 byte độ dài bit big-endian.
    const soKhoi = Math.floor((len + 8) / 64) + 1;
    const dem = new Uint8Array(soKhoi * 64);
    dem.set(bytes);
    dem[len] = 0x80;
    // Độ dài bit vượt 2^32 thì phần cao phải đúng; dùng phép chia thay vì dịch bit.
    const cao = Math.floor(bitLen / 0x100000000);
    const thap = bitLen >>> 0;
    const cuoi = dem.length;
    dem[cuoi - 8] = (cao >>> 24) & 0xff;
    dem[cuoi - 7] = (cao >>> 16) & 0xff;
    dem[cuoi - 6] = (cao >>> 8) & 0xff;
    dem[cuoi - 5] = cao & 0xff;
    dem[cuoi - 4] = (thap >>> 24) & 0xff;
    dem[cuoi - 3] = (thap >>> 16) & 0xff;
    dem[cuoi - 2] = (thap >>> 8) & 0xff;
    dem[cuoi - 1] = thap & 0xff;
    const w = new Uint32Array(64);
    for (let i = 0; i < dem.length; i += 64) {
        for (let t = 0; t < 16; t++) {
            const j = i + t * 4;
            w[t] =
                ((dem[j] << 24) |
                    (dem[j + 1] << 16) |
                    (dem[j + 2] << 8) |
                    dem[j + 3]) >>>
                    0;
        }
        for (let t = 16; t < 64; t++) {
            const a = w[t - 15];
            const b = w[t - 2];
            const s0 = (xoay(a, 7) ^ xoay(a, 18) ^ (a >>> 3)) >>> 0;
            const s1 = (xoay(b, 17) ^ xoay(b, 19) ^ (b >>> 10)) >>> 0;
            w[t] = ((w[t - 16] + s0 + w[t - 7] + s1) >>> 0);
        }
        let a = h[0];
        let b = h[1];
        let c = h[2];
        let d = h[3];
        let e = h[4];
        let f = h[5];
        let g = h[6];
        let hh = h[7];
        for (let t = 0; t < 64; t++) {
            const S1 = (xoay(e, 6) ^ xoay(e, 11) ^ xoay(e, 25)) >>> 0;
            const ch = ((e & f) ^ (~e & g)) >>> 0;
            const t1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
            const S0 = (xoay(a, 2) ^ xoay(a, 13) ^ xoay(a, 22)) >>> 0;
            const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
            const t2 = (S0 + maj) >>> 0;
            hh = g;
            g = f;
            f = e;
            e = (d + t1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) >>> 0;
        }
        h[0] = (h[0] + a) >>> 0;
        h[1] = (h[1] + b) >>> 0;
        h[2] = (h[2] + c) >>> 0;
        h[3] = (h[3] + d) >>> 0;
        h[4] = (h[4] + e) >>> 0;
        h[5] = (h[5] + f) >>> 0;
        h[6] = (h[6] + g) >>> 0;
        h[7] = (h[7] + hh) >>> 0;
    }
    return h
        .map((x) => x.toString(16).padStart(8, '0'))
        .join('')
        .toUpperCase();
}
/** SHA-256 của một chuỗi, encode UTF-8 trước. */
export function sha256(s) {
    return sha256Bytes(utf8Bytes(s));
}
