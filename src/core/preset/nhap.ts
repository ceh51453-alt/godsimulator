/**
 * Pipeline nhập mười hai bước — Phần 63.1 [BB].
 *
 * ```text
 *  1. Đọc bytes trong Worker
 *  2. Kiểm kích thước, UTF-8 và JSON depth
 *  3. Tính SHA-256; phát hiện file đã nhập
 *  4. Dò format bằng shape, không bằng tên file
 *  5. Parse bằng schema giới hạn và chặn key nguy hiểm
 *  6. Lưu raw source bất biến
 *  7. Chuẩn hóa prompt, order, marker, macro, tham số
 *  8. Quét script, URL, secret, jailbreak, reasoning request và nội dung nhạy cảm
 *  9. Dựng đồ thị dependency + conflict group
 * 10. Compile thử cho từng pipeline/mode với WorldView giả
 * 11. Hiện diff, token budget, mục bị clamp/cách ly/cần adapter
 * 12. Nhập vào Thư viện — CHƯA kích hoạt
 * ```
 *
 * [BB] Không bước nào trong 1–12 được: gọi model · chạy regex nguồn · chạy script ·
 * tải URL · sửa save · đổi endpoint · ghi vào lorebook · bật function calling.
 *
 * Cách file này bảo đảm điều đó không phải bằng kỷ luật mà bằng **danh sách
 * import**: nó không import `src/ai/*`, không import `src/db/*`, không import
 * `sandbox.apTransform`, và không có tham số nào nhận endpoint. Thứ không được
 * import thì không có cách nào gọi.
 *
 * Bước 1 nằm ngoài `core/` (đọc file là việc của UI/Worker). Hàm ở đây nhận
 * **văn bản đã đọc xong** — đó là biên đúng giữa hai tầng.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { WorldView } from '../contracts/view.js';
import type { Scene } from '../contracts/core.js';
import type { Tuning } from '../tuning/schema.js';
import type { ModelProfile } from '../schema/ai.js';
import { sha256, soByteUtf8 } from './sha256.js';
import { doDinhDang } from './doDinhDang.js';
import type { KetQuaDo } from './doDinhDang.js';
import { locKhoaNguyHiem, quetAnToan } from './anToan.js';
import type { KetQuaQuet } from './anToan.js';
import { chuanHoaSillyTavern, chuanHoaThamSo } from './chuanHoa.js';
import type { ThongKeChuanHoa } from './chuanHoa.js';
import { dungDoThi, nhomXungDot } from './xungDot.js';
import type { DoThiPhuThuoc, NhomXungDot } from './xungDot.js';
import { bienDichPromptPreset } from './bienDich.js';
import { ImportEnvelopeSchema, PresetPackRowSchema } from './schema.js';
import type {
  CompiledPrompt,
  ImportEnvelope,
  PresetPackRow,
  RawSourceRow,
  TargetPipeline,
  ThamSoDaChuan,
} from './schema.js';

export const SCHEMA_VERSION_PRESET = 1;

export type DauVaoNhap = {
  readonly tenNguon: string;
  /** Văn bản UTF-8 nguyên vẹn. Bước 1 (đọc bytes) đã xong ở tầng trên. */
  readonly noiDung: string;
  /** Nhịp thế giới lúc nhập — [BB] `core/` không đọc đồng hồ máy. */
  readonly tick: number;
  readonly tuning: Tuning;
  /** Hash các file đã có trong thư viện — bước 3. */
  readonly daNhap?: ReadonlyMap<string, { packId: string; version: number }>;
  readonly profile: ModelProfile;
  /** WorldView giả cho bước 10. */
  readonly viewGia: WorldView;
  readonly sceneGia: Scene;
};

export type KetQuaNhap = {
  /** `false` nghĩa là pipeline dừng — `dungOBuoc` cho biết dừng ở đâu và vì sao. */
  readonly ok: boolean;
  readonly dungOBuoc: number;
  readonly envelope: ImportEnvelope | null;
  readonly rawSource: RawSourceRow | null;
  readonly row: PresetPackRow | null;
  readonly thongKe: ThongKeChuanHoa | null;
  readonly quet: KetQuaQuet | null;
  readonly doThi: DoThiPhuThuoc | null;
  readonly nhom: readonly NhomXungDot[];
  readonly thamSo: readonly ThamSoDaChuan[];
  /** Bước 10 — biên dịch thử cho từng pipeline. */
  readonly thuBienDich: Readonly<Record<TargetPipeline, CompiledPrompt | null>>;
  readonly issues: readonly ImportIssue[];
  /** Cùng `sourceHash` → không tạo bản trùng (65.5). */
  readonly daCoSan: { readonly packId: string; readonly version: number } | null;
  readonly doDinhDang: KetQuaDo | null;
};

const rong = (dungOBuoc: number, issues: ImportIssue[]): KetQuaNhap => ({
  ok: false,
  dungOBuoc,
  envelope: null,
  rawSource: null,
  row: null,
  thongKe: null,
  quet: null,
  doThi: null,
  nhom: [],
  thamSo: [],
  thuBienDich: { narrator: null, updater: null, evolution: null, workflow_task: null },
  issues,
  daCoSan: null,
  doDinhDang: null,
});

/** Độ sâu tối đa của cây JSON. Sâu hơn là dấu hiệu file dựng để làm tràn stack. */
export const MAX_DO_SAU_JSON = 64;

function doSau(v: unknown, tran: number, hienTai = 0): number {
  if (hienTai > tran) return hienTai;
  if (v === null || typeof v !== 'object') return hienTai;
  let max = hienTai;
  const ds = Array.isArray(v) ? v : Object.values(v as Record<string, unknown>);
  for (const x of ds) {
    const d = doSau(x, tran, hienTai + 1);
    if (d > max) max = d;
    if (max > tran) return max;
  }
  return max;
}

/**
 * Chạy toàn bộ pipeline nhập.
 *
 * Trả về `KetQuaNhap` cho MỌI đường đi, kể cả đường hỏng — không throw. Người gọi
 * (wizard) đọc `dungOBuoc` để biết dừng ở màn nào và `issues` để biết nói gì.
 */
export function nhapPreset(dv: DauVaoNhap): KetQuaNhap {
  const issues: ImportIssue[] = [];
  const gioiHan = dv.tuning.preset;

  // ── bước 2: kích thước, UTF-8, độ sâu ──
  const soByte = soByteUtf8(dv.noiDung);
  if (soByte > gioiHan.maxJsonBytes) {
    issues.push({
      code: 'FILE_QUA_LON',
      severity: 'error',
      path: '',
      message: `File ${soByte} byte, vượt trần tuning.preset.maxJsonBytes = ${gioiHan.maxJsonBytes}.`,
      details: { soByte, tran: gioiHan.maxJsonBytes },
    });
    return rong(2, issues);
  }
  if (dv.noiDung.includes('�')) {
    issues.push({
      code: 'UTF8_HONG',
      severity: 'warning',
      path: '',
      message: 'Văn bản chứa ký tự thay thế U+FFFD — file gốc có thể không phải UTF-8 hợp lệ.',
      details: {},
    });
  }

  // ── bước 3: SHA-256, phát hiện đã nhập ──
  const hash = sha256(dv.noiDung);
  const daCoSan = dv.daNhap?.get(hash) ?? null;
  if (daCoSan !== null) {
    // [BB] 65.5 — cùng sourceHash thì KHÔNG tạo bản trùng.
    issues.push({
      code: 'DA_NHAP_TRUOC_DO',
      severity: 'info',
      path: '',
      message:
        `File này đã có trong thư viện (pack "${daCoSan.packId}" bản ${daCoSan.version}). ` +
        'Không tạo bản trùng.',
      details: { ...daCoSan, hash },
    });
    return { ...rong(3, issues), daCoSan };
  }

  // ── bước 2 (tiếp): parse JSON ──
  let goc: unknown;
  try {
    goc = JSON.parse(dv.noiDung);
  } catch (e) {
    issues.push({
      code: 'JSON_HONG',
      severity: 'error',
      path: '',
      message: `Không parse được JSON: ${e instanceof Error ? e.message : 'lỗi không rõ'}.`,
      details: {},
    });
    return rong(2, issues);
  }
  const sau = doSau(goc, MAX_DO_SAU_JSON);
  if (sau > MAX_DO_SAU_JSON) {
    issues.push({
      code: 'JSON_QUA_SAU',
      severity: 'error',
      path: '',
      message: `Cây JSON sâu hơn ${MAX_DO_SAU_JSON} tầng. Từ chối để không làm tràn ngăn xếp khi duyệt.`,
      details: { sau },
    });
    return rong(2, issues);
  }

  // ── bước 4: dò format ──
  const kqDo = doDinhDang(goc, dv.tenNguon);
  issues.push(...kqDo.ghiChu);
  if (kqDo.format === 'unknown_json') {
    return { ...rong(4, issues), doDinhDang: kqDo };
  }
  if (kqDo.format !== 'sillytavern_openai_preset') {
    issues.push({
      code: 'DINH_DANG_CHUA_CO_DUONG_NHAP',
      severity: 'error',
      path: '',
      message:
        `Nhận ra định dạng "${kqDo.format}" nhưng đường nhập của nó không nằm ở Xưởng Preset. ` +
        'Lorebook đi qua trình nhập Lorebook; registry pack đi qua trình nhập Pack.',
      details: { format: kqDo.format },
    });
    return { ...rong(4, issues), doDinhDang: kqDo };
  }

  // ── bước 5: chặn key nguy hiểm ──
  const quet = quetAnToan(goc);
  const sach = locKhoaNguyHiem(goc) as Record<string, unknown>;

  const soBlock = Array.isArray(sach['prompts']) ? (sach['prompts'] as unknown[]).length : 0;
  if (soBlock > gioiHan.maxPromptBlocks) {
    issues.push({
      code: 'QUA_NHIEU_PROMPT',
      severity: 'error',
      path: 'prompts',
      message: `File có ${soBlock} prompt, vượt trần tuning.preset.maxPromptBlocks = ${gioiHan.maxPromptBlocks}.`,
      details: { soBlock },
    });
    return { ...rong(5, issues), quet, doDinhDang: kqDo };
  }

  // ── bước 6: raw source BẤT BIẾN ──
  const rawSourceRef = `sha256:${hash}`;
  const rawSource: RawSourceRow = {
    ref: rawSourceRef,
    sourceName: dv.tenNguon,
    bytes: soByte,
    noiDung: dv.noiDung,
  };

  const packId = tenPackTuNguon(dv.tenNguon, hash);
  const envelope = ImportEnvelopeSchema.parse({
    id: `imp.${hash.slice(0, 16).toLowerCase()}`,
    schemaVersion: SCHEMA_VERSION_PRESET,
    format: kqDo.format,
    sourceName: dv.tenNguon,
    sourceHash: hash,
    sourceBytes: soByte,
    importedAt: dv.tick,
    namespace: packId,
    trust: 'untrusted',
    rawSourceRef,
    detectedParts: [...kqDo.parts],
    warnings: [...kqDo.ghiChu],
  });

  // ── bước 7: chuẩn hóa ──
  const ch = chuanHoaSillyTavern({ goc: sach, envelope, packId, version: 1 });
  issues.push(...ch.pack.issues);

  const quaDai = ch.pack.modules.filter((m) => m.content.length > gioiHan.maxBlockChars);
  for (const m of quaDai) {
    issues.push({
      code: 'BLOCK_QUA_DAI',
      severity: 'warning',
      path: m.id,
      message: `Module "${m.name}" dài ${m.content.length} ký tự, vượt tuning.preset.maxBlockChars = ${gioiHan.maxBlockChars}.`,
      details: { soKyTu: m.content.length },
    });
  }

  // ── bước 8: quét an toàn ──
  issues.push(...quet.issues);

  // ── bước 9: đồ thị và nhóm xung đột ──
  const doThi = dungDoThi(ch.pack.modules);
  issues.push(...doThi.issues);
  const nhom = nhomXungDot(ch.pack.modules);

  // ── bước 10: compile thử với WorldView GIẢ ──
  const thamSo = chuanHoaThamSo(ch.pack.generation, dv.profile);
  const thu: Record<TargetPipeline, CompiledPrompt | null> = {
    narrator: null,
    updater: null,
    evolution: null,
    workflow_task: null,
  };
  for (const pl of ['narrator', 'updater', 'evolution', 'workflow_task'] as const) {
    thu[pl] = bienDichPromptPreset({
      pack: ch.pack,
      pipeline: pl,
      view: dv.viewGia,
      scene: dv.sceneGia,
      budget: { total: thamSo.params.contextLimit, used: 0, remaining: thamSo.params.contextLimit },
      params: thamSo.params,
      tyLeToken: dv.profile.tyLeToken,
      maxMacroDepth: gioiHan.maxMacroDepth,
      hoTroPrefill: dv.profile.hoTro.continuePrefill,
    });
  }

  /**
   * [BB] Cổng 66.5 — "Không module nào vào Updater mặc định."
   *
   * Kiểm ngay tại đây thay vì để test bắt: nếu một thay đổi tương lai mở đường
   * cho module ngoài vào `updater`, pipeline nhập sẽ tự báo, ở đúng file mà người
   * sửa đang đọc.
   */
  for (const pl of ['updater', 'evolution', 'workflow_task'] as const) {
    const co = (thu[pl]?.messages ?? []).filter((m) => !m.moduleId.startsWith('td:'));
    if (co.length > 0) {
      issues.push({
        code: 'MODULE_NGOAI_LOT_VAO_PIPELINE_CAM',
        severity: 'error',
        path: pl,
        message: `Có ${co.length} module ngoài lọt vào pipeline "${pl}". Đây là vi phạm 62.3 [BB].`,
        details: { pipeline: pl, moduleIds: co.map((m) => m.moduleId) },
      });
    }
  }

  // ── bước 11 + 12: dựng hàng thư viện. CHƯA kích hoạt. ──
  const row = PresetPackRowSchema.parse({
    packId,
    version: 1,
    pack: { ...ch.pack, issues },
    transformDefs: ch.transformDefs,
    quarantined: ch.quarantined,
    scriptAdapters: ch.scriptAdapters,
    thamSo: thamSo.bang,
  });

  const coLoi = issues.some((i) => i.severity === 'error');
  return {
    ok: !coLoi,
    dungOBuoc: 12,
    envelope,
    rawSource,
    row,
    thongKe: ch.thongKe,
    quet,
    doThi,
    nhom,
    thamSo: thamSo.bang,
    thuBienDich: thu,
    issues,
    daCoSan: null,
    doDinhDang: kqDo,
  };
}

/**
 * Id pack suy từ tên file + hash.
 *
 * Giữ chữ và số của tên gốc để người dùng nhận ra nó trong thư viện, nhưng luôn
 * kèm tám ký tự hash: hai file cùng tên "preset.json" là chuyện thường, và hai
 * pack cùng id là chuyện không được xảy ra.
 */
export function tenPackTuNguon(ten: string, hash: string): string {
  const goc = ten
    .replace(/\.json$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return `${goc === '' ? 'preset' : goc}-${hash.slice(0, 8).toLowerCase()}`;
}
