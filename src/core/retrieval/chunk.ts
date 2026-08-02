/**
 * Chunk và nhãn tầm nhìn — Phần 54.2, 54.3 [BB].
 *
 * ── Mục quan trọng nhất của cả Khối O ──
 *
 * 54.3 mở đầu bằng: "RAG là một đường rò rỉ mới. Đây là mục quan trọng nhất của
 * cả Phần 54." Và ngay sau đó:
 *
 *   [BB] Lọc tầm nhìn chạy TRƯỚC khi xếp hạng, không phải sau.
 *
 * Lý do được nói rõ và nó là lý do kỹ thuật, không phải khẩu hiệu: lọc sau khi
 * xếp hạng nghĩa là top-K đã bị chunk cấm chiếm chỗ, nên kết quả trả về ít hơn
 * dự kiến — tức là chunk cấm vẫn gây hại kể cả khi cuối cùng bị vứt đi.
 *
 * 77.1 siết thêm một nấc: "Semantic reranker không được thấy một chunk mà chủ
 * thể không được biết, KỂ CẢ ĐỂ TRẢ ĐIỂM RỒI LOẠI SAU."
 *
 * Vì vậy file này có hai kiểu tách bạch:
 *   `Chunk`          — bản gốc trong chỉ mục, có `noiDung` thật
 *   `ChunkDaChieu`   — bản đã lọc + đã chiếu, KHÔNG còn `noiDung` gốc
 *
 * Mọi thứ sau bước lọc chỉ nhìn thấy kiểu thứ hai. Đó là cách biến một quy tắc
 * quy trình thành một ràng buộc kiểu dữ liệu.
 */
import { z } from 'zod';
import type { ViewMode } from '../contracts/primitives.js';

/** Nguồn chunk — bảng 54.2. Mỗi nguồn có đơn vị chunk tự nhiên riêng. */
export const NGUON_CHUNK = [
  'lorebook',
  'bien_nien',
  'ky_uc_thuc_the',
  'ky_uc_mach',
  'dinh_luat',
  'dien_giai_luat',
  'khai_niem',
  'canh_da_ke',
  'so_nhan_qua',
  'so_phuc_but',
] as const;
export type NguonChunk = (typeof NGUON_CHUNK)[number];

export const TamNhinSchema = z
  .object({
    tangToiThieu: z.enum(['pham_nhan', 'than', 'sang_the']).prefault('pham_nhan'),
    /** Rỗng = mọi vùng. */
    vungHanChe: z.array(z.string()).prefault([]),
    /** Cho tầng Thần: chỉ thần giữ domain này mới thấy. */
    domainHanChe: z.array(z.string()).prefault([]),
    /** [BB] Phải qua `bopMeo()` trước khi vào ngữ cảnh — 54.3. */
    laTinDon: z.boolean().prefault(false),
  })
  .strict();

export const ChunkSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    nguon: z.string(),
    nguonId: z.string(),
    noiDung: z.string(),
    /**
     * int8 lượng tử hóa (54.4). `null` là trạng thái HỢP LỆ ở mọi nơi: chunk
     * chưa nhúng vẫn tìm được bằng kênh từ vựng và kênh đồ thị (54.8).
     */
    vector: z.instanceof(Uint8Array).nullable().prefault(null),
    meta: z.record(z.string(), z.unknown()).prefault({}),
    tamNhin: TamNhinSchema.prefault({}),
    /** Entity mà chunk nói về — dùng cho tiền lọc và cho kênh đồ thị. */
    entityIds: z.array(z.string()).prefault([]),
    storylineId: z.string().nullable().prefault(null),
    /** 0–1. Entry chưa có sự kiện chống lưng bị dìm, không bị xóa (54.12 mục 63). */
    trust: z.number().min(0).max(1).prefault(0.7),
    tick: z.number().int(),
    _dim: z.number().prefault(0),
  })
  .strict();

export type TamNhinChunk = z.infer<typeof TamNhinSchema>;
export type Chunk = z.infer<typeof ChunkSchema>;

/**
 * Chunk đã qua lọc tầm nhìn VÀ đã chiếu.
 *
 * Không có trường `noiDung`. Đó là cố ý: 77.3 nói "không truyền `Chunk.noiDung`
 * gốc rồi yêu cầu reranker đừng dùng". Ở đây thì không có gì để yêu cầu — bản
 * gốc đơn giản là không đi qua được biên này.
 */
export type ChunkDaChieu = Readonly<{
  id: string;
  nguon: string;
  nguonId: string;
  /** Đã qua `chieu()` và `bopMeo()` nếu là tin đồn — 77.3. */
  projectedText: string;
  entityIds: readonly string[];
  storylineId: string | null;
  trust: number;
  tick: number;
  daBopMeo: boolean;
  vector: Uint8Array | null;
}>;

const THU_TU_TANG: Readonly<Record<string, number>> = Object.freeze({
  pham_nhan: 0,
  than: 1,
  sang_the: 2,
});

/**
 * Chủ thể ở `mucChieu` có được thấy chunk này không.
 *
 * Ba phép kiểm, mỗi phép đóng một đường rò riêng:
 *   1. tầng   — văn bản luật gốc không bao giờ xuống tầng phàm nhân (18.2);
 *   2. vùng   — diễn giải của vùng A không được trả về khi kể ở vùng B (54.2);
 *   3. domain — thần chỉ thấy phần trong domain mình giữ (18.2).
 */
export function chunkDuocThay(
  c: Chunk,
  nc: { mucChieu: ViewMode; vungIds: ReadonlySet<string>; domainIds: ReadonlySet<string> },
): boolean {
  const canh = THU_TU_TANG[c.tamNhin.tangToiThieu] ?? 0;
  const co = THU_TU_TANG[nc.mucChieu] ?? 0;
  if (co < canh) return false;

  if (c.tamNhin.vungHanChe.length > 0 && !c.tamNhin.vungHanChe.some((v) => nc.vungIds.has(v))) {
    return false;
  }
  if (c.tamNhin.domainHanChe.length > 0 && !c.tamNhin.domainHanChe.some((d) => nc.domainIds.has(d))) {
    return false;
  }
  return true;
}

/**
 * Cửa sổ trượt cho cảnh đã kể — 54.2: ~300 token, chồng lấn 15%.
 *
 * [BB] "Không chia theo kích thước cố định khi nội dung đã có đơn vị tự nhiên."
 * Chỉ nguồn `canh_da_ke` đi qua hàm này; mọi nguồn khác chunk theo đơn vị của nó.
 */
export function cuaSoTruot(
  text: string,
  tokenMoiCua = 300,
  chongLan = 0.15,
  tyLeToken = 3.2,
): readonly string[] {
  const kyTuMoiCua = Math.max(50, Math.round(tokenMoiCua * tyLeToken));
  const buoc = Math.max(1, Math.round(kyTuMoiCua * (1 - chongLan)));
  if (text.length <= kyTuMoiCua) return text.trim() === '' ? [] : [text];

  const ra: string[] = [];
  for (let i = 0; i < text.length; i += buoc) {
    const lat = text.slice(i, i + kyTuMoiCua).trim();
    if (lat !== '') ra.push(lat);
    if (i + kyTuMoiCua >= text.length) break;
  }
  return ra;
}

/** Lượng tử hóa float32 → int8 (54.4). Giảm bốn lần dung lượng. */
export function luongTuHoa(v: readonly number[]): Uint8Array {
  const ra = new Uint8Array(v.length);
  for (let i = 0; i < v.length; i++) {
    const x = Math.max(-1, Math.min(1, v[i] ?? 0));
    ra[i] = Math.round((x + 1) * 127.5);
  }
  return ra;
}

/** Giải nén int8 → float32 tại chỗ (54.5 bước 2). */
export function giaiLuongTu(v: Uint8Array): Float32Array {
  const ra = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) ra[i] = (v[i] as number) / 127.5 - 1;
  return ra;
}

export function cosine(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length);
  let tich = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] as number;
    const y = b[i] as number;
    tich += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return tich / (Math.sqrt(na) * Math.sqrt(nb));
}
