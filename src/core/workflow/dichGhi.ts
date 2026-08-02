/**
 * Ba đích ghi và output có cấu trúc — Phần 50.6, 50.7, 50.10 [BB].
 *
 * ── Lằn ranh mới của Khối N ──
 *
 * [BB] 50.10: "**không tác vụ nào được ghi vào lorebook do người dùng nhập tay.**
 * Chỉ được ghi vào lorebook `nguon = 'tu_sinh'`. Người chơi soạn lorebook của
 * mình và không bao giờ phải lo bị workflow viết đè lên."
 *
 * Chẩn đoán 36 của 50.12 gọi vi phạm này là **hỏng nặng** — nên `ghiLorebook()`
 * trả về `severity: 'fatal'` chứ không phải một cảnh báo, và nó chặn TRƯỚC khi
 * dựng entry, không phải sau.
 *
 * ── Chống đệ quy ──
 *
 * [BB] 50.7: `chongDeQuy = true` bắt buộc cho mọi entry do workflow ghi. "Không
 * có nó, entry tự sinh sẽ kích hoạt keyword của chính nó và vòng lặp sẽ nổ."
 */
import type { StructuredError } from '../contracts/errors.js';
import { loi } from '../contracts/errors.js';
import { LorebookEntrySchema, DAI_ORDER } from '../lore/schema.js';
import type { LorebookEntry, NguonLorebook } from '../lore/schema.js';
import { JsonPatchEntrySchema } from './schema.js';
import type { JsonPatchEntry, WriteTarget } from './schema.js';

// ─────────────────────────────────────────── json_patch (50.6)

export type KetQuaDocPatch = {
  readonly muc: readonly JsonPatchEntry[];
  readonly boQua: readonly StructuredError[];
};

/**
 * Đọc một khối JSON Patch mở rộng từ output model.
 *
 * [BB] 50.6 — prompt phải nói rõ "chỉ xuất một JSON hợp lệ, không rào markdown".
 * Nhưng model vẫn sẽ rào, nên hàm này gỡ rào trước rồi mới parse. Mục sai bị bỏ
 * riêng lẻ; cùng chính sách với patch ở 31.7.
 */
export function docJsonPatch(raw: string): KetQuaDocPatch {
  const boQua: StructuredError[] = [];
  const than = goRaoMarkdown(raw);
  let cay: unknown;
  try {
    cay = JSON.parse(than);
  } catch {
    return {
      muc: [],
      boQua: [loi('ai', 'JSON_PATCH_HONG', 'Khối JSON Patch không parse được. Bỏ toàn bộ khối.')],
    };
  }
  const ds = Array.isArray(cay) ? cay : [cay];
  const muc: JsonPatchEntry[] = [];
  ds.forEach((x, i) => {
    const r = JsonPatchEntrySchema.safeParse(x);
    if (r.success) muc.push(r.data);
    else {
      boQua.push(
        loi(
          'ai',
          'JSON_PATCH_MUC_SAI',
          `Mục ${i} không hợp lệ: ${r.error.issues[0]?.message ?? 'sai hình dạng'}.`,
          {
            path: `[${i}]`,
          },
        ),
      );
    }
  });
  return { muc, boQua };
}

function goRaoMarkdown(s: string): string {
  const m = /```(?:json)?\s*([\s\S]*?)```/i.exec(s);
  return (m?.[1] ?? s).trim();
}

/**
 * Ánh xạ `delta` sang phép `add` của 31.7 — 50.6 [BB].
 *
 * Đây là chỗ op quan trọng nhất của khối trở thành thứ engine hiểu. Bốn op còn
 * lại ánh xạ thẳng; `delta` là op duy nhất cần dịch.
 */
export function opEngineCua(op: JsonPatchEntry['op']): 'set' | 'add' | 'push' | 'remove' {
  switch (op) {
    case 'replace':
      return 'set';
    case 'delta':
      return 'add';
    case 'insert':
      return 'push';
    case 'remove':
    case 'move':
      return 'remove';
  }
}

/** Cộng dồn nhiều `delta` trên cùng đường dẫn — trọng số khái niệm đi qua nhiều tác vụ. */
export function gopDelta(muc: readonly JsonPatchEntry[]): Map<string, number> {
  const ra = new Map<string, number>();
  for (const m of muc) {
    if (m.op !== 'delta') continue;
    const v = Number(m.value);
    if (!Number.isFinite(v)) continue;
    ra.set(m.path, (ra.get(m.path) ?? 0) + v);
  }
  return ra;
}

// ─────────────────────────────────────────── ghi lorebook (50.7)

export type KetQuaGhiLorebook =
  | { readonly ok: true; readonly entry: LorebookEntry; readonly lorebookId: string }
  | { readonly ok: false; readonly loi: readonly StructuredError[] };

export type NgocCanhGhi = {
  readonly target: WriteTarget;
  readonly noiDung: string;
  readonly tick: number;
  /** Nguồn của lorebook đích. [BB] Phải là `tu_sinh`. */
  readonly nguonDich: NguonLorebook;
  readonly lorebookId: string;
  readonly taskId: string;
  readonly suKienChongLung?: readonly string[];
};

/**
 * Đích `ghi_lorebook` — "thế giới tự viết lorebook cho chính nó", chạy liên tục
 * thay vì mỗi kỷ nguyên một lần (50.7).
 */
export function ghiLorebook(nc: NgocCanhGhi): KetQuaGhiLorebook {
  const l: StructuredError[] = [];

  if (nc.nguonDich !== 'tu_sinh') {
    // [BB] 50.12 chẩn đoán 36 — hỏng NẶNG.
    l.push(
      loi(
        'schema',
        'WORKFLOW_GHI_LOREBOOK_NGUOI_DUNG',
        `Tác vụ "${nc.taskId}" định ghi vào lorebook nguồn "${nc.nguonDich}". ` +
          'Chỉ được ghi vào lorebook tự sinh (50.10).',
        { severity: 'fatal', path: nc.lorebookId, recoverable: false },
      ),
    );
    return { ok: false, loi: l };
  }

  if (!nc.target.chongDeQuy) {
    // [BB] 50.7 — bắt buộc, không phải khuyến nghị.
    l.push(
      loi(
        'schema',
        'THIEU_CHONG_DE_QUY',
        'Entry do workflow ghi phải bật `chongDeQuy`. Không có nó, entry sẽ kích hoạt keyword của chính nó.',
        { path: nc.target.tenEntry },
      ),
    );
    return { ok: false, loi: l };
  }

  const keys = nc.target.keys
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k !== '');
  if (nc.target.loaiEntry === 'keyword' && keys.length === 0) {
    l.push(loi('schema', 'KEYS_RONG', 'Entry loại keyword phải có ít nhất một khóa.'));
    return { ok: false, loi: l };
  }

  const dai = DAI_ORDER.workflow;
  const order = Math.min(dai.den, Math.max(dai.tu, dai.tu + (nc.target.viTri.order % 10_000)));

  const entry = LorebookEntrySchema.parse({
    id: `lb.wf.${nc.taskId}.${nc.target.tenEntry
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 24)}`,
    ten: nc.target.tenEntry,
    keys,
    noiDung: nc.noiDung,
    lop: nc.target.loaiEntry === 'constant' ? 'loi' : 'sau',
    order,
    doSau: nc.target.viTri.depth,
    // [BB] `deQuy = false` là chống đệ quy: entry KHÔNG tự quét lại chính nó.
    deQuy: false,
    suKienChongLung: [...(nc.suKienChongLung ?? [])],
    lichSu: [
      {
        tick: nc.tick,
        boiAi: 'workflow',
        op: 'them',
        truoc: '',
        sau: nc.target.tenEntry,
        lyDo: `tác vụ ${nc.taskId}`,
      },
    ],
  });

  return { ok: true, entry, lorebookId: nc.lorebookId };
}

/**
 * Entry do workflow ghi có tự kích hoạt chính nó không — chẩn đoán 35 của 50.12.
 *
 * Kiểm bằng cách quét NỘI DUNG của entry tìm chính keyword của nó. Đây là dạng
 * đệ quy phổ biến nhất và cũng là dạng khó thấy nhất khi đọc bằng mắt.
 */
export function tuKichHoatChinhNo(entry: LorebookEntry): boolean {
  if (entry.lop === 'loi') return false;
  const noi = entry.noiDung.toLowerCase();
  return entry.keys.some((k) => k.trim() !== '' && noi.includes(k.trim().toLowerCase()));
}

// ─────────────────────────────────────────── hai đích còn lại

export type MucChen = { readonly mau: string; readonly noiDung: string };

/** Đích `chen_vao_canh` — trả về mục cần chèn, KHÔNG tự chèn. */
export function chenVaoCanh(target: WriteTarget, noiDung: string): MucChen {
  return { mau: target.mauChen, noiDung };
}

/**
 * Đích `bien_theo_luot` — biến sống một lượt, nằm trong namespace tác vụ.
 *
 * Cùng nguyên tắc với biến macro preset (63.5): không chạm World. Một workflow
 * ghi thẳng vào state qua đường này là mở một cửa hậu bên cạnh `apPatch`.
 */
export function bienTheoLuot(taskId: string, ten: string): string {
  return `workflow.${taskId}.${ten}`;
}
