/**
 * Kho preset và trạng thái giao diện — Phase 11.
 *
 * Tầng này chỉ đọc/ghi. Mọi quyết định (nhập được không, bật được không, xung
 * đột giải thế nào) nằm ở `core/preset/`, và đó là ranh giới cũ của cả repo:
 * `core/` không biết Dexie tồn tại, `db/` không biết luật.
 *
 * [BB] 66.6 — biến pack khóa theo `[packId+branchId]`. Hàm dưới đây không có
 * biến thể nào đọc theo mình `packId`, nên không có đường nào để biến của nhánh
 * này chảy sang nhánh khác.
 */
import type { ThienDienDb } from './schema.js';
import type { HangBienPack, HangUiState } from './schema.js';
import { PresetPackRowSchema } from '../core/preset/schema.js';
import type { PresetPackRow, RawSourceRow, PresetActivation } from '../core/preset/schema.js';
import { chuanHoaSillyTavern } from '../core/preset/chuanHoa.js';
import { locKhoaNguyHiem } from '../core/preset/anToan.js';

// ─────────────────────────────────────────── thư viện pack

export async function ghiPack(db: ThienDienDb, row: PresetPackRow, raw: RawSourceRow): Promise<void> {
  await db.transaction('rw', db.presetPacks, db.presetRaw, async () => {
    await db.presetRaw.put(raw);
    await db.presetPacks.put(row);
  });
}

/** Dựng bù các trường tương thích mới cho hàng được lưu bởi bản app cũ. */
async function nangCapRowCu(db: ThienDienDb, row: PresetPackRow): Promise<PresetPackRow | null> {
  const daMoi =
    Object.hasOwn(row, 'scriptAdapters') &&
    Array.isArray(row.transformDefs) &&
    row.transformDefs.every((t) => Object.hasOwn(t, 'placement'));
  if (daMoi) {
    const kq = PresetPackRowSchema.safeParse(row);
    return kq.success ? kq.data : null;
  }

  try {
    const raw = await db.presetRaw.get(row.pack.envelope.rawSourceRef);
    if (raw === undefined) throw new Error('Không còn raw source');
    const parsed = JSON.parse(raw.noiDung) as unknown;
    const sach = locKhoaNguyHiem(parsed);
    if (sach === null || typeof sach !== 'object' || Array.isArray(sach))
      throw new Error('Raw source sai dạng');
    const ch = chuanHoaSillyTavern({
      goc: sach as Record<string, unknown>,
      envelope: row.pack.envelope,
      packId: row.packId,
      version: row.version,
    });
    return PresetPackRowSchema.parse({
      ...row,
      pack: {
        ...ch.pack,
        issues: row.pack.issues,
        variables: { ...ch.pack.variables, ...row.pack.variables },
      },
      transformDefs: ch.transformDefs,
      quarantined: ch.quarantined,
      scriptAdapters: ch.scriptAdapters,
    });
  } catch {
    const kq = PresetPackRowSchema.safeParse(row);
    return kq.success ? kq.data : null;
  }
}

export async function docThuVien(db: ThienDienDb): Promise<PresetPackRow[]> {
  const ds = await db.presetPacks.toArray();
  const nangCap = await Promise.all(ds.map((row) => nangCapRowCu(db, row)));
  return nangCap
    .filter((row): row is PresetPackRow => row !== null)
    .sort((a, b) => (a.packId !== b.packId ? (a.packId < b.packId ? -1 : 1) : b.version - a.version));
}

export async function docBanMoiNhat(db: ThienDienDb, packId: string): Promise<PresetPackRow | undefined> {
  const ds = await db.presetPacks.where('packId').equals(packId).toArray();
  const nangCap = await Promise.all(ds.map((row) => nangCapRowCu(db, row)));
  return nangCap.filter((row): row is PresetPackRow => row !== null).sort((a, b) => b.version - a.version)[0];
}

/**
 * Xóa một pack khỏi thư viện.
 *
 * KHÔNG xóa `presetRaw`: blob nguồn khóa theo hash, và một hash có thể được nhiều
 * version trỏ tới. Xóa nó ở đây sẽ làm bản version khác mất đường round-trip —
 * đúng thứ 62.2 dựng vỏ nhập bất biến để tránh.
 */
export async function xoaPack(db: ThienDienDb, packId: string): Promise<void> {
  await db.transaction('rw', db.presetPacks, db.presetActivations, db.presetVars, async () => {
    await db.presetPacks.where('packId').equals(packId).delete();
    await db.presetActivations.where('packId').equals(packId).delete();
    await db.presetVars.where('packId').equals(packId).delete();
  });
}

// ─────────────────────────────────────────── kích hoạt

export async function ghiKichHoat(db: ThienDienDb, act: PresetActivation): Promise<void> {
  await db.presetActivations.put(act);
}

/**
 * Activation đang có hiệu lực trên một nhánh.
 *
 * Mỗi pack chỉ giữ bản mới nhất: 65.4 nói hoàn tác là "đổi con trỏ về
 * `previousActivationId`", nên lịch sử vẫn còn nguyên trong bảng, chỉ có bản
 * đứng đầu chuỗi là đang chạy.
 */
export async function docKichHoatDangChay(db: ThienDienDb, branchId: string): Promise<PresetActivation[]> {
  const ds = await db.presetActivations.where('branchId').equals(branchId).toArray();
  const moiNhat = new Map<string, PresetActivation>();
  for (const a of ds) {
    const cu = moiNhat.get(a.packId);
    if (cu === undefined || a.activatedAt > cu.activatedAt) moiNhat.set(a.packId, a);
  }
  return [...moiNhat.values()].sort((a, b) => (a.packId < b.packId ? -1 : 1));
}

export async function goKichHoat(db: ThienDienDb, packId: string, branchId: string): Promise<void> {
  await db.presetActivations.where({ packId, branchId }).delete();
}

// ─────────────────────────────────────────── biến pack

export async function docBienPack(
  db: ThienDienDb,
  packId: string,
  branchId: string,
): Promise<Record<string, unknown>> {
  const hang = await db.presetVars.get([packId, branchId]);
  return hang?.bien ?? {};
}

export async function ghiBienPack(
  db: ThienDienDb,
  packId: string,
  branchId: string,
  bien: Record<string, unknown>,
  tickGhi: number,
): Promise<void> {
  const hang: HangBienPack = { packId, branchId, bien, tickGhi };
  await db.presetVars.put(hang);
}

// ─────────────────────────────────────────── trạng thái giao diện

export async function docUiState(
  db: ThienDienDb,
  saveId: string,
  branchId: string,
): Promise<HangUiState | undefined> {
  return db.uiState.get([saveId, branchId]);
}

export type BanVaUiState = Partial<Omit<HangUiState, 'saveId' | 'branchId'>>;

/**
 * Cập nhật một phần trạng thái giao diện mà không làm mất các phần được ghi bởi
 * store khác (đặc biệt là `scene`).
 *
 * Đọc-và-ghi phải nằm trong cùng một transaction. Nếu hai store tự `get()` rồi
 * `put()` ở ngoài transaction, lần hoàn tất sau có thể mang theo ảnh chụp cũ và
 * ghi đè lịch sử chat vừa được lưu.
 */
export async function capNhatUiState(
  db: ThienDienDb,
  saveId: string,
  branchId: string,
  banVa: BanVaUiState,
): Promise<void> {
  await db.transaction('rw', db.uiState, async () => {
    const cu = await db.uiState.get([saveId, branchId]);
    const hang: HangUiState = {
      anhBang: null,
      tabThongTin: 'tong_quan',
      theoDoiMachIds: [],
      ghimTongQuan: [],
      ...cu,
      ...banVa,
      // Khóa do đối số quyết định; dữ liệu cũ không được phép đổi đích ghi.
      saveId,
      branchId,
    };
    await db.uiState.put(hang);
  });
}

export async function ghiUiState(db: ThienDienDb, hang: HangUiState): Promise<void> {
  const { saveId, branchId, ...banVa } = hang;
  await capNhatUiState(db, saveId, branchId, banVa);
}
