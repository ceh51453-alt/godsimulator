/**
 * Invariant runner — Phase 1.
 *
 * Bất biến là điều PHẢI đúng sau mỗi transaction. Vi phạm không được lặng lẽ
 * trôi qua: transaction bị rollback và lỗi hiện ở bảng tự chẩn đoán (Phần 39).
 *
 * Hiệu năng: mỗi transaction chỉ kiểm những bản ghi **đã bị chạm**, nhờ `PhamViThayDoi`
 * do `apPatch` trả về. Kiểm toàn bộ thế giới là việc của `chayInvariantToanBo()` —
 * chạy khi nạp save, khi kết thúc replay và trong bảng chẩn đoán.
 */
import type { WorldState } from './state.js';
import type { PhamViThayDoi } from './patch.js';
import { loi } from '../contracts/errors.js';
import type { StructuredError } from '../contracts/errors.js';

/** Phạm vi kiểm: một tập bản ghi cụ thể, hoặc toàn bộ thế giới. */
export type PhamViKiem = PhamViThayDoi | 'tat_ca';

export const TOAN_BO: PhamViKiem = 'tat_ca';

export type Invariant = {
  readonly id: string;
  readonly ten: string;
  /** Trả danh sách vi phạm; rỗng là đạt. */
  readonly kiem: (s: WorldState, phamVi: PhamViKiem) => readonly string[];
  /** `fatal` thì rollback; `warning` thì cho qua nhưng ghi lại. */
  readonly mucDo: 'fatal' | 'warning';
  /**
   * true nếu bất biến chỉ có nghĩa khi nhìn toàn cục (ví dụ: đếm bậc đồ thị).
   * Những bất biến này bị bỏ qua khi kiểm theo phạm vi hẹp.
   */
  readonly canToanCuc?: boolean;
};

const dsInvariant: Invariant[] = [];

/**
 * Bộ nạp của các tầng trên (world process, tầng Thần, tầng Phàm…).
 *
 * `engine/` không được import `world/` — đó là luật phân tầng của 3.2. Nhưng
 * `datLaiInvariant()` trong test phải dựng lại ĐẦY ĐỦ danh sách, nếu không một
 * bài test gọi nó sẽ âm thầm tắt mọi bất biến của Phase 5 và mọi bài sau đó
 * chạy trong một thế giới không có luật. Nên tầng trên tự đăng ký bộ nạp vào đây.
 */
const boNap: (() => void)[] = [];

export function dangKyInvariant(inv: Invariant): void {
  dsInvariant.push(inv);
}

/** Đăng ký một bộ nạp bất biến của tầng trên và chạy nó ngay. Idempotent-safe. */
export function dangKyBoNapInvariant(fn: () => void): void {
  boNap.push(fn);
  fn();
}

export function danhSachInvariant(): readonly Invariant[] {
  return dsInvariant;
}

export function datLaiInvariant(): void {
  dsInvariant.length = 0;
  napInvariantLoi();
  for (const f of boNap) f();
}

export type KetQuaInvariant = {
  dat: boolean;
  viPhamNang: readonly StructuredError[];
  canhBao: readonly StructuredError[];
};

export function chayInvariant(s: WorldState, phamVi: PhamViKiem = TOAN_BO): KetQuaInvariant {
  const nang: StructuredError[] = [];
  const nhe: StructuredError[] = [];

  for (const inv of dsInvariant) {
    if (inv.canToanCuc && phamVi !== TOAN_BO) continue;
    for (const vp of inv.kiem(s, phamVi)) {
      const e = loi('invariant', inv.id.toUpperCase(), `${inv.ten}: ${vp}`, {
        severity: inv.mucDo === 'fatal' ? 'fatal' : 'warning',
        path: inv.id,
        recoverable: inv.mucDo !== 'fatal',
      });
      if (inv.mucDo === 'fatal') nang.push(e);
      else nhe.push(e);
    }
  }

  return { dat: nang.length === 0, viPhamNang: nang, canhBao: nhe };
}

/** Kiểm toàn bộ thế giới — dùng khi nạp save, cuối replay, và ở bảng chẩn đoán. */
export function chayInvariantToanBo(s: WorldState): KetQuaInvariant {
  return chayInvariant(s, TOAN_BO);
}

// ─────────────────────────────────────────── tiện ích

/** Sắp xếp deterministic để thông điệp lỗi ổn định giữa các lần chạy. */
function sapId(ids: Iterable<string>): string[] {
  return [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function laToanBo(p: PhamViKiem): p is 'tat_ca' {
  return p === TOAN_BO;
}

/** Id entity cần kiểm theo phạm vi. */
function entityCanKiem(s: WorldState, phamVi: PhamViKiem): string[] {
  return sapId(laToanBo(phamVi) ? s.entities.keys() : phamVi.entities);
}

function linkCanKiem(s: WorldState, phamVi: PhamViKiem): string[] {
  return sapId(laToanBo(phamVi) ? s.links.keys() : phamVi.links);
}

// ─────────────────────────────────────────── bất biến lõi

function napInvariantLoi(): void {
  dangKyInvariant({
    id: 'tick_khong_lui',
    ten: 'Tick không được lùi',
    mucDo: 'fatal',
    kiem: (s) => (s.world.tick < 0 ? [`tick = ${s.world.tick}`] : []),
  });

  dangKyInvariant({
    id: 'entity_dung_nhanh',
    ten: 'Entity phải thuộc đúng nhánh',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      const xau: string[] = [];
      for (const id of entityCanKiem(s, phamVi)) {
        const e = s.entities.get(id);
        if (e && e.branchId !== s.world.branchId) {
          xau.push(`'${id}' thuộc nhánh '${e.branchId}' nhưng nằm trong state của '${s.world.branchId}'`);
        }
      }
      return xau;
    },
  });

  dangKyInvariant({
    id: 'entity_id_khop_khoa',
    ten: 'Khóa bảng phải khớp id bản ghi',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      const xau: string[] = [];
      for (const khoa of entityCanKiem(s, phamVi)) {
        const e = s.entities.get(khoa);
        if (e && e.id !== khoa) xau.push(`khóa '${khoa}' chứa entity id '${e.id}'`);
      }
      return xau;
    },
  });

  dangKyInvariant({
    id: 'link_khong_treo',
    ten: 'Link không được trỏ vào hư không',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      const xau: string[] = [];
      for (const id of linkCanKiem(s, phamVi)) {
        const lk = s.links.get(id);
        if (!lk) continue;
        if (!s.entities.has(lk.tuId)) xau.push(`link '${id}' có tuId '${lk.tuId}' không tồn tại`);
        if (!s.entities.has(lk.denId)) xau.push(`link '${id}' có denId '${lk.denId}' không tồn tại`);
      }
      return xau;
    },
  });

  dangKyInvariant({
    id: 'entity_khong_chet_truoc_khi_sinh',
    ten: 'Không ai chết trước khi sinh',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      const xau: string[] = [];
      for (const id of entityCanKiem(s, phamVi)) {
        const e = s.entities.get(id);
        if (e && e.tickDiet !== null && e.tickDiet < e.tickSinh) {
          xau.push(`'${id}' có tickDiet ${e.tickDiet} < tickSinh ${e.tickSinh}`);
        }
      }
      return xau;
    },
  });

  dangKyInvariant({
    id: 'chi_so_trong_khoang',
    ten: 'Chỉ số thế giới nằm trong khoảng cho phép',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      if (!laToanBo(phamVi) && !phamVi.chamMetrics) return [];
      const xau: string[] = [];
      const m = s.metrics as unknown as Record<string, number>;
      for (const k of sapId(Object.keys(m))) {
        if (k === 'tickTinh' || k === 'matDoLienKet') continue;
        const v = m[k];
        if (typeof v === 'number' && (v < 0 || v > 100)) xau.push(`${k} = ${v} ngoài [0, 100]`);
      }
      return xau;
    },
  });

  /**
   * [BB] Phần 6.3 quy tắc 3 — không thực thể mồ côi.
   *
   * Mức `warning`: mồ côi là LỖ HỔNG được thế giới tự lấp (Phần 15), không phải lý do
   * rollback. Nó phải trở thành nội dung, không thành lỗi ném vào mặt người chơi.
   *
   * `canToanCuc`: bậc đồ thị chỉ tính đúng khi nhìn toàn bộ bảng link, nên bất biến này
   * chỉ chạy ở `chayInvariantToanBo()`.
   */
  dangKyInvariant({
    id: 'khong_thuc_the_mo_coi',
    ten: 'Không thực thể mồ côi',
    mucDo: 'warning',
    canToanCuc: true,
    kiem: (s) => {
      if (s.entities.size <= 1) return [];
      const bac = new Map<string, number>();
      for (const id of s.entities.keys()) bac.set(id, 0);
      for (const lk of s.links.values()) {
        if (lk.tickDut !== null) continue;
        bac.set(lk.tuId, (bac.get(lk.tuId) ?? 0) + 1);
        bac.set(lk.denId, (bac.get(lk.denId) ?? 0) + 1);
      }
      return sapId([...bac.entries()].filter(([, n]) => n === 0).map(([id]) => id)).map(
        (id) => `'${id}' chưa có liên kết nào`,
      );
    },
  });
}

napInvariantLoi();
