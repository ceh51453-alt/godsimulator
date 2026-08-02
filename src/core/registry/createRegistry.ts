/**
 * createRegistry — Phần 5 [BB].
 *
 * Ba tầng nạp (5.2):
 *   1. Dựng sẵn  — luôn nạp
 *   2. Mod pack  — người dùng bật/tắt từng pack
 *   3. Ghi đè    — người dùng sửa từng trường
 *
 * [BB] Ghi đè phải validate lại bằng schema của registry đó. Ghi đè hỏng →
 * BỎ ghi đè, giữ giá trị tầng dưới, ghi cảnh báo vào bảng tự chẩn đoán. KHÔNG crash.
 */
import type { StructuredError } from '../contracts/errors.js';
import { loi } from '../contracts/errors.js';
import type { RegistryId } from './manifest.js';

export type TangNap = 'dung_san' | 'pack' | 'ghi_de';

export type MucRegistry<T> = {
  readonly id: string;
  readonly gia_tri: T;
  readonly tang: TangNap;
  readonly packId: string | null;
};

export type Registry<T extends { id: string }> = {
  readonly ten: RegistryId;
  /** Đăng ký mục dựng sẵn. Gọi lúc khởi động, trong code. */
  dangKy(def: T): void;
  /** Lấy một mục. undefined nếu chưa khai. */
  lay(id: string): T | undefined;
  /** [BB] Kiểm tính hợp lệ của một chuỗi kind/verb/... */
  co(id: string): boolean;
  /** Danh sách id, sắp xếp deterministic (codepoint, không locale). */
  danhSachId(): readonly string[];
  tatCa(): readonly T[];
  /** Nạp từ pack. Trả cảnh báo, không throw. */
  napPack(packId: string, defs: readonly T[]): StructuredError[];
  /** Ghi đè một phần: chỉ trường có mặt mới bị thay. */
  ghiDe(id: string, patch: Partial<T>): StructuredError[];
  /** Khôi phục mặc định một mục. */
  khoiPhuc(id: string): void;
  /** Xóa toàn bộ tầng pack + ghi đè, giữ dựng sẵn. */
  datLai(): void;
  /** Cảnh báo tích lũy cho bảng tự chẩn đoán (Phần 39). */
  canhBao(): readonly StructuredError[];
};

export type KiemTraDef<T> = (def: unknown) => { ok: true; value: T } | { ok: false; errors: string[] };

export function createRegistry<T extends { id: string }>(
  ten: RegistryId,
  kiemTra?: KiemTraDef<T>,
): Registry<T> {
  const dungSan = new Map<string, T>();
  const pack = new Map<string, { def: T; packId: string }>();
  const ghiDeMap = new Map<string, Partial<T>>();
  const canhBaoList: StructuredError[] = [];

  // Cache kết quả hợp nhất; xóa mỗi lần có thay đổi.
  let cache: Map<string, T> | null = null;
  const xoaCache = (): void => {
    cache = null;
  };

  const hopNhat = (): Map<string, T> => {
    if (cache) return cache;
    const out = new Map<string, T>();
    for (const [id, def] of dungSan) out.set(id, def);
    for (const [id, { def }] of pack) out.set(id, def);
    for (const [id, patch] of ghiDeMap) {
      const duoi = out.get(id);
      if (!duoi) continue;
      out.set(id, { ...duoi, ...patch, id });
    }
    cache = out;
    return out;
  };

  const xacThuc = (def: unknown, nguon: string): T | null => {
    if (!kiemTra) return def as T;
    const r = kiemTra(def);
    if (r.ok) return r.value;
    for (const e of r.errors) {
      canhBaoList.push(
        loi('registry', 'REGISTRY_DEF_INVALID', `Mục registry '${ten}' từ ${nguon} không hợp lệ: ${e}`, {
          severity: 'warning',
          path: `${ten}`,
        }),
      );
    }
    return null;
  };

  return {
    ten,

    dangKy(def: T): void {
      if (dungSan.has(def.id)) {
        canhBaoList.push(
          loi('registry', 'REGISTRY_DUPLICATE', `Mục dựng sẵn '${def.id}' trong '${ten}' bị khai hai lần.`, {
            severity: 'warning',
            path: `${ten}.${def.id}`,
          }),
        );
      }
      dungSan.set(def.id, def);
      xoaCache();
    },

    lay(id: string): T | undefined {
      return hopNhat().get(id);
    },

    co(id: string): boolean {
      return hopNhat().has(id);
    },

    danhSachId(): readonly string[] {
      // [BB] Sắp xếp deterministic theo codepoint, KHÔNG dùng localeCompare.
      return [...hopNhat().keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    },

    tatCa(): readonly T[] {
      const m = hopNhat();
      return this.danhSachId().map((id) => m.get(id) as T);
    },

    napPack(packId: string, defs: readonly T[]): StructuredError[] {
      const loiPack: StructuredError[] = [];
      for (const def of defs) {
        const ok = xacThuc(def, `pack '${packId}'`);
        if (!ok) {
          loiPack.push(
            loi('registry', 'PACK_ENTRY_REJECTED', `Pack '${packId}' có mục '${(def as T).id}' bị từ chối.`, {
              severity: 'warning',
              path: `${ten}.${(def as T).id}`,
            }),
          );
          continue;
        }
        pack.set(ok.id, { def: ok, packId });
      }
      xoaCache();
      canhBaoList.push(...loiPack);
      return loiPack;
    },

    ghiDe(id: string, patch: Partial<T>): StructuredError[] {
      const duoi = hopNhat().get(id);
      if (!duoi) {
        const e = loi(
          'registry',
          'OVERRIDE_TARGET_MISSING',
          `Không có mục '${id}' trong registry '${ten}' để ghi đè.`,
          {
            severity: 'warning',
            path: `${ten}.${id}`,
          },
        );
        canhBaoList.push(e);
        return [e];
      }
      const gop = { ...duoi, ...patch, id } as T;
      const ok = xacThuc(gop, `ghi đè '${id}'`);
      if (!ok) {
        // [BB] Ghi đè hỏng → bỏ ghi đè, giữ tầng dưới, KHÔNG crash.
        const e = loi(
          'registry',
          'OVERRIDE_INVALID',
          `Ghi đè '${id}' trong '${ten}' không hợp lệ; đã bỏ qua.`,
          {
            severity: 'warning',
            path: `${ten}.${id}`,
          },
        );
        canhBaoList.push(e);
        return [e];
      }
      ghiDeMap.set(id, patch);
      xoaCache();
      return [];
    },

    khoiPhuc(id: string): void {
      ghiDeMap.delete(id);
      xoaCache();
    },

    datLai(): void {
      pack.clear();
      ghiDeMap.clear();
      canhBaoList.length = 0;
      xoaCache();
    },

    canhBao(): readonly StructuredError[] {
      return canhBaoList;
    },
  };
}
