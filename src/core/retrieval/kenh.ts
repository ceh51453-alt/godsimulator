/**
 * Ba kênh truy hồi và RRF — Phần 54.1, 54.6 [BB].
 *
 * | Kênh | Mạnh ở |
 * |---|---|
 * | Từ vựng (BM25) | tên riêng, thuật ngữ, trích dẫn chính xác |
 * | Ngữ nghĩa      | diễn đạt khác, "chuyện tương tự đã từng xảy ra chưa" |
 * | Đồ thị         | liên quan nhân quả, quan hệ, cùng mạch truyện |
 *
 * ── Vì sao RRF chứ không phải cộng điểm có chuẩn hóa ──
 *
 * 54.1 giải thích và lý do đó là lý do kỹ thuật: RRF chỉ cần THỨ HẠNG, không cần
 * điểm số so sánh được giữa các kênh. BM25 trả điểm không chặn trên, cosine trả
 * [-1,1], điểm đồ thị trả (0,1]. Chuẩn hóa ba thang ấy về một thang đòi ba hằng
 * số phải tinh chỉnh lại mỗi khi một kênh đổi; RRF không đòi hằng số nào và
 * không hỏng khi một kênh chết.
 *
 * [BB] Trọng số mặc định: từ vựng 1.0 · ngữ nghĩa 1.0 · đồ thị 1.2. Đồ thị nhỉnh
 * hơn vì trong game này liên hệ nhân quả quan trọng hơn liên hệ ngữ nghĩa.
 */
import type { ChunkDaChieu } from './chunk.js';
import { cosine, giaiLuongTu } from './chunk.js';

export const K_RRF = 60;

export const TRONG_SO_KENH = Object.freeze({ tuVung: 1.0, nguNghia: 1.0, doThi: 1.2 });

export type KetQuaKenh = {
  /** Đã sắp theo hạng, phần tử đầu là hạng 1. */
  readonly xepHang: readonly string[];
  readonly diem: ReadonlyMap<string, number>;
  /** Kênh có chạy được không — ngữ nghĩa tắt thì `false`, và RAG vẫn chạy (54.4). */
  readonly songKhoe: boolean;
};

const KENH_TAT: KetQuaKenh = Object.freeze({
  xepHang: Object.freeze([]),
  diem: new Map(),
  songKhoe: false,
});

// ─────────────────────────────────────────── kênh từ vựng (BM25)

/**
 * Tách từ tiếng Việt ở mức âm tiết.
 *
 * Không dùng bộ tách từ ghép: tiếng Việt viết rời âm tiết, và với truy hồi thì
 * âm tiết đã đủ — "Thung Lũng Tro" khớp được cả khi truy vấn viết "thung lũng".
 * Ghép từ sẽ làm ngược lại: "thung lũng" không khớp "thung lũng tro".
 */
export function tachTu(s: string): readonly string[] {
  return s
    .toLowerCase()
    .normalize('NFC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 0);
}

type ThongKeBM25 = {
  readonly df: ReadonlyMap<string, number>;
  readonly doDaiTb: number;
  readonly tf: ReadonlyMap<string, ReadonlyMap<string, number>>;
  readonly doDai: ReadonlyMap<string, number>;
  readonly N: number;
};

export function thongKeBM25(ds: readonly ChunkDaChieu[]): ThongKeBM25 {
  const df = new Map<string, number>();
  const tf = new Map<string, Map<string, number>>();
  const doDai = new Map<string, number>();
  let tong = 0;

  for (const c of ds) {
    const tu = tachTu(c.projectedText);
    const dem = new Map<string, number>();
    for (const t of tu) dem.set(t, (dem.get(t) ?? 0) + 1);
    tf.set(c.id, dem);
    doDai.set(c.id, tu.length);
    tong += tu.length;
    for (const t of dem.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  }

  return { df, tf, doDai, N: ds.length, doDaiTb: ds.length === 0 ? 1 : tong / ds.length };
}

/** BM25 chuẩn, k1 = 1.2, b = 0.75. */
export function kenhTuVung(ds: readonly ChunkDaChieu[], truyVan: string): KetQuaKenh {
  if (ds.length === 0) return KENH_TAT;
  const tk = thongKeBM25(ds);
  const k1 = 1.2;
  const b = 0.75;
  const hoi = tachTu(truyVan);
  const diem = new Map<string, number>();

  for (const c of ds) {
    const tf = tk.tf.get(c.id);
    const dl = tk.doDai.get(c.id) ?? 0;
    let d = 0;
    for (const t of hoi) {
      const f = tf?.get(t) ?? 0;
      if (f === 0) continue;
      const n = tk.df.get(t) ?? 0;
      const idf = Math.log(1 + (tk.N - n + 0.5) / (n + 0.5));
      d += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * dl) / tk.doDaiTb)));
    }
    if (d > 0) diem.set(c.id, d);
  }

  return { xepHang: sapTheoDiem(diem), diem, songKhoe: true };
}

// ─────────────────────────────────────────── kênh ngữ nghĩa

export type BoNhung = {
  /** Trả `null` khi endpoint chết hoặc chưa bật — [BB] 54.4 suy giảm ÊM. */
  readonly nhung: (text: string) => Float32Array | null;
};

/**
 * [BB] 54.4 — nếu `bat = false` hoặc endpoint nhúng chết, RAG VẪN PHẢI CHẠY với
 * hai kênh còn lại. Ứng dụng không bao giờ được hỏng vì thiếu embedding.
 *
 * Vì thế hàm này trả `songKhoe: false` chứ không throw, và người gọi coi kênh
 * vắng mặt là chuyện bình thường (`rrf()` tự chuẩn hóa lại trọng số).
 */
export function kenhNguNghia(ds: readonly ChunkDaChieu[], truyVan: string, bo: BoNhung | null): KetQuaKenh {
  if (!bo || ds.length === 0) return KENH_TAT;
  const q = bo.nhung(truyVan);
  if (!q) return KENH_TAT;

  const diem = new Map<string, number>();
  for (const c of ds) {
    if (!c.vector) continue; // [BB] `vector = null` là hợp lệ, không phải lỗi
    const d = cosine(q, giaiLuongTu(c.vector));
    if (d > 0) diem.set(c.id, d);
  }
  return { xepHang: sapTheoDiem(diem), diem, songKhoe: true };
}

// ─────────────────────────────────────────── kênh đồ thị

/**
 * Kênh đồ thị: điểm của một chunk = điểm cao nhất trong số entity nó nói tới.
 *
 * `diemTheoEntity` đến từ `moRong()` đã chạy trên `WorldView`, nên chunk nói về
 * một entity chủ thể không được biết sẽ có điểm 0 ở kênh này — thêm một lớp
 * ngoài lớp lọc tầm nhìn, và hai lớp là cố ý.
 */
export function kenhDoThi(
  ds: readonly ChunkDaChieu[],
  diemTheoEntity: ReadonlyMap<string, number>,
  machDangChieuId: string | null,
): KetQuaKenh {
  if (ds.length === 0) return KENH_TAT;
  const diem = new Map<string, number>();
  for (const c of ds) {
    let d = 0;
    for (const eid of c.entityIds) d = Math.max(d, diemTheoEntity.get(eid) ?? 0);
    // Cùng mạch đang chiếu là một cạnh nhân quả thật, không phải một phép cộng thêm.
    if (machDangChieuId !== null && c.storylineId === machDangChieuId) d = Math.max(d, 0.6);
    if (d > 0) diem.set(c.id, d);
  }
  return { xepHang: sapTheoDiem(diem), diem, songKhoe: true };
}

// ─────────────────────────────────────────── RRF

function sapTheoDiem(diem: ReadonlyMap<string, number>): readonly string[] {
  return [...diem.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([id]) => id);
}

export type MucRRF = {
  readonly chunkId: string;
  readonly diem: number;
  readonly hang: number;
  /** Kênh nào đã bầu cho chunk này — vào trace của tab Truy hồi (77.11). */
  readonly kenh: readonly string[];
};

/**
 * `diemRRF(chunk) = Σ_kênh w_kênh / (k + hạng_trong_kênh)`, k = 60.
 *
 * Kênh chết bị bỏ khỏi tổng và trọng số còn lại được chuẩn hóa — cùng nguyên tắc
 * mà 77.6 áp cho `rankSemantic`. Không chuẩn hóa thì tắt embedding sẽ làm điểm
 * tổng của MỌI chunk tụt đều, và ngưỡng cắt theo điểm tuyệt đối (nếu có) sẽ sai.
 */
export function rrf(
  kenh: readonly { ten: string; kq: KetQuaKenh; trongSo: number }[],
  k = K_RRF,
): readonly MucRRF[] {
  const song = kenh.filter((x) => x.kq.songKhoe && x.kq.xepHang.length > 0);
  const tongTs = song.reduce((t, x) => t + x.trongSo, 0);
  if (song.length === 0 || tongTs === 0) return [];

  const gop = new Map<string, { diem: number; kenh: string[] }>();
  for (const x of song) {
    const w = (x.trongSo / tongTs) * song.length;
    for (const [i, id] of x.kq.xepHang.entries()) {
      const cu = gop.get(id) ?? { diem: 0, kenh: [] };
      cu.diem += w / (k + i + 1);
      cu.kenh.push(x.ten);
      gop.set(id, cu);
    }
  }

  return Object.freeze(
    [...gop.entries()]
      .sort((a, b) => b[1].diem - a[1].diem || (a[0] < b[0] ? -1 : 1))
      .map(([chunkId, v], i) =>
        Object.freeze({
          chunkId,
          diem: v.diem,
          hang: i + 1,
          kenh: Object.freeze([...v.kenh].sort((p, q) => (p < q ? -1 : 1))),
        }),
      ),
  );
}
