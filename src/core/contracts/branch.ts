/**
 * Nhánh và save — Phần 26.1, 38, 61.5, 79.1.
 *
 * [BB] Chuyển tầng KHÔNG đổi branchId. Nhánh là thứ khác hẳn: nó là một dòng
 * thời gian song song, tạo ra bởi `phan_nhanh` khi sửa luật hoặc bởi người chơi.
 *
 * [BB] Copy-on-write (ADR-0014):
 *   Đọc  — nhánh hiện tại → lần lên `gocId` → tới gốc.
 *   Ghi  — LUÔN vào nhánh hiện tại; tạo bản sao nếu bản ghi thuộc nhánh cha.
 */
import { z } from 'zod';

export const BranchSchema = z
  .object({
    id: z.string(),
    worldId: z.string(),
    /** null = nhánh gốc. */
    gocId: z.string().nullable().prefault(null),
    tickTao: z.number(),
    ten: z.string().prefault(''),
    lyDoTach: z.string().prefault(''),
    dangChay: z.boolean().prefault(true),
  })
  .strict();

export type Branch = z.infer<typeof BranchSchema>;

/**
 * Bia mộ — đánh dấu bản ghi bị xóa Ở NHÁNH NÀY dù nhánh cha vẫn còn.
 * Thiếu nó thì phép đọc lần lên cha sẽ "hồi sinh" thứ đã xóa.
 */
export const TombstoneSchema = z
  .object({
    branchId: z.string(),
    bang: z.string(),
    id: z.string(),
    tickXoa: z.number().int(),
  })
  .strict();

export type Tombstone = z.infer<typeof TombstoneSchema>;

/**
 * Phiên bản schema của ứng dụng hiện tại. Save mới hơn con số này bị từ chối.
 * v4 = Thế Giới Sống (Phase 5): thêm bảng `knowledge` và `debts`.
 * v5 = Tầng Thần (Phase 6): thêm bảng `prayers`.
 * v6 = Mạch Truyện (Phase 8): thêm `storylines`, `foreshadows`, `chunks`.
 *
 * Ba bảng của v6 sinh ra RỖNG nên không có migration dữ liệu: save cũ mở ra với
 * ba Map rỗng và chơi tiếp bình thường — mạch truyện sẽ được `quetMachTruyen()`
 * sinh lại từ chính trạng thái thế giới ở nhịp kế tiếp. Đó là điểm mạnh của việc
 * tiền đề mạch truyện được DÒ từ world state chứ không được lưu sẵn (28.3).
 *
 * v7 = Phase 12: gói export nhận thêm **mười bảng** mà Phase 5–10 đã thêm vào
 * `WorldState` nhưng chưa bao giờ được ghi ra file. Xem ghi chú ở
 * `SaveExportSchema`.
 */
export const PHIEN_BAN_SCHEMA = 7;

/**
 * Gói export. [BB] Phần 38 — `proxyPassword` KHÔNG BAO GIỜ ghi vào file xuất.
 * [BB] Phần 78.2 — hồ sơ riêng tư chỉ có mặt khi người dùng CHỦ ĐỘNG chọn.
 *
 * ── Mười bảng bị bỏ quên (sửa ở Phase 12) ──
 *
 * Định dạng này viết ở Phase 2, khi `WorldState` mới có bốn Map. Phase 5 thêm
 * `knowledge` và `debts`, Phase 6 thêm `prayers`, Phase 8 thêm `storylines` và
 * `foreshadows`, Phase 9–10 thêm năm bảng nữa — và **không phase nào mở rộng
 * gói export**. Test round-trip vẫn xanh suốt bốn phase vì fixture của chúng để
 * mười bảng ấy rỗng.
 *
 * Hậu quả với người chơi: xuất một ván ra file rồi nhập lại làm mất Luật Nền,
 * lorebook, mạch truyện, sổ phục bút, tri thức, nợ và lời cầu — im lặng, và chỉ
 * lộ ra khi thế giới bắt đầu cư xử khác. E2E ba tầng bắt được nó ở lần chạy đầu
 * tiên.
 *
 * Save v6 vẫn nhập được: mười trường mới đều `.prefault([])`, nên một file cũ
 * mở ra với mười Map rỗng — đúng trạng thái nó vốn mô tả.
 */
export const SaveExportSchema = z
  .object({
    /** Nhãn nhận diện định dạng, chống nhập nhầm file. */
    dinhDang: z.literal('thien-dien-save'),
    schemaVersion: z.number().int().min(1),
    /** Phiên bản app đã tạo file, chỉ để hiển thị. */
    appVersion: z.string().prefault(''),
    /** Tick lúc xuất — KHÔNG dùng thời gian máy. */
    tickXuat: z.number().int().min(0),

    world: z.unknown(),
    branches: z.array(z.unknown()).prefault([]),
    entities: z.array(z.unknown()).prefault([]),
    links: z.array(z.unknown()).prefault([]),
    gaps: z.array(z.unknown()).prefault([]),
    metrics: z.unknown(),
    events: z.array(z.unknown()).prefault([]),

    // ── v7: mười bảng theo nhánh của Phase 5 – 10 ──
    knowledge: z.array(z.unknown()).prefault([]),
    debts: z.array(z.unknown()).prefault([]),
    prayers: z.array(z.unknown()).prefault([]),
    storylines: z.array(z.unknown()).prefault([]),
    foreshadows: z.array(z.unknown()).prefault([]),
    substrateLaws: z.array(z.unknown()).prefault([]),
    coChe: z.array(z.unknown()).prefault([]),
    lorebooks: z.array(z.unknown()).prefault([]),
    loreExpectations: z.array(z.unknown()).prefault([]),
    diBan: z.array(z.unknown()).prefault([]),

    /** Chỉ có mặt khi người dùng chọn "Kèm hồ sơ riêng tư". */
    hoSoRiengTu: z.unknown().optional(),
    danhTinhSangThe: z.unknown().optional(),

    /** Hash state lúc xuất — dùng để kiểm round-trip. */
    stateHash: z.string(),
  })
  .strict();

export type SaveExport = z.infer<typeof SaveExportSchema>;

/**
 * Khóa mà secret stripping phải xóa khỏi MỌI thứ đi ra ngoài.
 * [BB] Danh sách này là nguồn chân lý; `stripSecret()` và test dùng chung.
 */
export const KHOA_SECRET: readonly string[] = [
  'proxyPassword',
  'password',
  'apiKey',
  'api_key',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'authorization',
  'bearer',
];

/**
 * Xóa mọi trường secret khỏi một cấu trúc dữ liệu, trả bản sao mới.
 * Không sửa đầu vào. Khớp tên khóa không phân biệt hoa thường.
 */
export function stripSecret<T>(v: T): T {
  const camThuong = new Set(KHOA_SECRET.map((k) => k.toLowerCase()));

  const di = (x: unknown, daThay: WeakSet<object>): unknown => {
    if (x === null || typeof x !== 'object') return x;
    if (daThay.has(x)) return undefined;
    daThay.add(x);
    if (Array.isArray(x)) return x.map((i) => di(i, daThay));
    const ra: Record<string, unknown> = {};
    for (const k of Object.keys(x as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (camThuong.has(k.toLowerCase())) continue;
      ra[k] = di((x as Record<string, unknown>)[k], daThay);
    }
    return ra;
  };

  return di(v, new WeakSet<object>()) as T;
}
