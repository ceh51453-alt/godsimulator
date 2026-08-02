/**
 * Project của người — Phần 68.3, 70.2; cổng Phase 7.
 *
 * > "Mở một Project nghề nghiệp và một quan hệ."
 *
 * ── Vì sao hai loại này, và vì sao chỉ hai ──
 *
 * Một đời người có vô số việc dài hơi, nhưng chỉ hai loại **đo được từ thế giới
 * mà không cần ai khai**: nghề (kỹ năng, bậc, học trò) và quan hệ (bốn trục,
 * hộ, giao ước). Mọi loại khác — "trả thù", "tìm sự thật về cha" — cần một cột
 * mốc do người kể đặt ra, và [BB] 68.3 cấm `progress` do ai đó khai.
 *
 * Nên hai loại này là **nền**: chúng chạy được không cần AI. Những Project giàu
 * chữ hơn tới ở Phase 8 cùng Storyline, và chúng sẽ dựa lên đúng cơ chế này.
 *
 * Song sinh với `than/duAn.ts` và cố ý giống nó: cùng một `ProjectSchema`, cùng
 * quy tắc "tiến độ đo từ thế giới". Người chơi và NPC dùng chung một cơ chế —
 * đó là điều 29.3 đòi.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Project } from '../intent/schema.js';
import { ProjectSchema } from '../intent/schema.js';
import type { SinhKe } from '../schema/aspect/pham.js';
import { NGUONG_BAC, NHAN_BAC_NGHE, bacTheoKyNang } from '../schema/aspect/pham.js';
import { phamThan } from './thanThe.js';
import { quanHeCua } from './quanHe.js';
import { hoCuaNguoi } from './ho.js';
import { kyNangCuaNghe } from './sinhKe.js';

function docAspect<T>(e: Entity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a && typeof a === 'object' ? (a as T) : undefined;
}

export const LOAI_DU_AN_NGUOI = ['ra_nghe', 'truyen_nghe', 'gan_lai', 'lap_nha'] as const;
export type LoaiDuAnNguoi = (typeof LOAI_DU_AN_NGUOI)[number];

export type UngVienDuAnNguoi = {
  readonly loai: LoaiDuAnNguoi;
  readonly goal: string;
  readonly diem: number;
  readonly stakeholderIds: readonly string[];
  readonly locationIds: readonly string[];
  readonly milestones: readonly { id: string; description: string }[];
};

/**
 * Việc dài hơi mà người này có lý do để bắt đầu.
 *
 * Điểm suy từ hoàn cảnh, không từ một bảng ưu tiên: người học việc muốn ra nghề;
 * bậc thầy không còn ai để học thì muốn truyền; người vừa cãi nhau với ai đó
 * muốn hàn gắn; người trưởng thành có nghề mà chưa có nhà thì muốn lập nhà.
 */
export function ungVienDuAnNguoi(state: WorldState, nguoiId: string): readonly UngVienDuAnNguoi[] {
  const e = state.entities.get(nguoiId);
  if (!e || e.kind !== 'mortal' || e.tickDiet !== null) return [];

  const m = phamThan(e);
  const sk = docAspect<SinhKe>(e, 'sinh_ke');
  if (!m) return [];

  const kyNang = kyNangCuaNghe(m, sk?.ngheId ?? null).giaTri;
  const ra: UngVienDuAnNguoi[] = [];

  // ── ra nghề ──
  if (sk?.ngheId && NGUONG_BAC[sk.bac] < NGUONG_BAC.tho_ca) {
    const den = bacTheoKyNang(kyNang) === sk.bac ? 'tho_ca' : bacTheoKyNang(kyNang);
    ra.push({
      loai: 'ra_nghe',
      goal: `Được gọi là ${NHAN_BAC_NGHE[den === sk.bac ? 'tho_ca' : den]}`,
      // Càng gần đích càng muốn — người sắp xong không bỏ dở.
      diem: 20 + kyNang * 0.4,
      stakeholderIds: sk.thayId ? [sk.thayId] : [],
      locationIds: sk.noiLamId ? [sk.noiLamId] : [],
      milestones: [
        { id: 'm1', description: 'Làm nghề đủ lâu để người ta quen mặt' },
        { id: 'm2', description: `Tay nghề đủ để được gọi là ${NHAN_BAC_NGHE.tho_ca}` },
      ],
    });
  }

  // ── truyền nghề ──
  // [BB] Cổng Phase 7: "một đời bình thường vẫn để lại di sản". Đây là đường
  // ngắn nhất tới di sản, và nó không cần người chơi làm gì phi thường.
  if (sk?.ngheId && NGUONG_BAC[sk.bac] >= NGUONG_BAC.tho_ca) {
    ra.push({
      loai: 'truyen_nghe',
      goal: 'Truyền nghề cho một người',
      diem: 25 + (m.ageBand === 'elder' ? 25 : 0),
      stakeholderIds: [...sk.hocTroIds],
      locationIds: sk.noiLamId ? [sk.noiLamId] : [],
      milestones: [
        { id: 'm1', description: 'Nhận một học trò' },
        { id: 'm2', description: 'Học trò ra nghề' },
      ],
    });
  }

  // ── gắn lại một quan hệ đã sứt ──
  const soul = docAspect<{
    quanHe?: Record<string, { yeuGhet?: number; tinNgo?: number; anTuong?: string }>;
  }>(e, 'soul');
  let te: { id: string; diem: number } | null = null;
  for (const [id, q] of Object.entries(soul?.quanHe ?? {})) {
    if (id.startsWith('__') || !state.entities.get(id) || state.entities.get(id)?.tickDiet !== null) continue;
    const xau = -(q.tinNgo ?? 0) - (q.yeuGhet ?? 0);
    if (xau > 15 && (!te || xau > te.diem)) te = { id, diem: xau };
  }
  if (te) {
    const ten = state.entities.get(te.id)?.ten ?? te.id;
    ra.push({
      loai: 'gan_lai',
      goal: `Làm lành với ${ten}`,
      diem: 15 + te.diem * 0.3,
      stakeholderIds: [te.id],
      locationIds: [],
      milestones: [
        { id: 'm1', description: `Nói chuyện lại với ${ten}` },
        { id: 'm2', description: `${ten} tin mình trở lại` },
      ],
    });
  }

  // ── lập nhà ──
  if (m.ageBand !== 'child' && hoCuaNguoi(state, nguoiId) === null && sk?.ngheId) {
    ra.push({
      loai: 'lap_nha',
      goal: 'Có một cái nhà của mình',
      diem: 18 + (m.ageBand === 'adult' ? 12 : 0),
      stakeholderIds: [],
      locationIds: [],
      milestones: [
        { id: 'm1', description: 'Kiếm đủ ăn cho hơn một người' },
        { id: 'm2', description: 'Lập hộ' },
      ],
    });
  }

  ra.sort((a, b) => (b.diem !== a.diem ? b.diem - a.diem : a.loai < b.loai ? -1 : 1));
  return Object.freeze(ra);
}

/**
 * Loại của một Project, đọc từ id.
 *
 * KHÔNG tách theo vị trí. `pj_nguoi_<chuTheId>_<loai>_<tick>` có `chuTheId` chứa
 * dấu gạch dưới (`mortal_pc_0`, `nguoi_place_1_4_2`), nên đếm phần tử là sai —
 * và sai **im lặng**: không khớp loại nào thì mọi tiến độ đứng ở 0 mãi mãi, và
 * bài test duy nhất phủ nó lại thoát sớm vì không tìm thấy ứng viên.
 *
 * Khớp theo tên loại có ranh giới `_…_` thì id chứa bao nhiêu gạch dưới cũng đúng.
 */
export function loaiCuaDuAn(id: string): LoaiDuAnNguoi | null {
  return LOAI_DU_AN_NGUOI.find((l) => id.includes(`_${l}_`)) ?? null;
}

export function moDuAnNguoi(
  state: WorldState,
  nguoiId: string,
  ung: UngVienDuAnNguoi,
  tick: number,
): Project {
  return ProjectSchema.parse({
    id: `pj_nguoi_${nguoiId}_${ung.loai}_${tick}`,
    branchId: state.world.branchId,
    ownerIds: [nguoiId],
    goal: ung.goal,
    scope: 'personal',
    status: 'active',
    locationIds: [...ung.locationIds],
    stakeholderIds: [...ung.stakeholderIds],
    milestones: ung.milestones.map((x) => ({
      id: x.id,
      description: x.description,
      conditions: [],
      progress: 0,
      completedAtTick: null,
    })),
    requirements: [],
    risks: [],
    // Người nghĩ theo nhịp `nhat` — rà mỗi hai nhịp, không mỗi năm như thần.
    nextTick: tick + 2,
    eventIds: [],
  });
}

/**
 * Rà tiến độ. [BB] 68.3 — đo TỪ THẾ GIỚI, không ai được khai `progress = 1`.
 *
 * Trả `Project` mới; người gọi ghi lại bằng patch. Hàm không sửa state.
 */
export function raSoatDuAnNguoi(state: WorldState, pj: Project, tick: number): Project {
  const nguoiId = pj.ownerIds[0];
  const e = nguoiId ? state.entities.get(nguoiId) : undefined;
  if (!e || e.tickDiet !== null) return { ...pj, status: 'abandoned', nextTick: tick + 9999 };

  const m = phamThan(e);
  const sk = docAspect<SinhKe>(e, 'sinh_ke');
  const kep = (x: number): number => Math.max(0, Math.min(1, x));

  const loai = loaiCuaDuAn(pj.id);
  let tien: [number, number] = [0, 0];

  if (loai === 'ra_nghe') {
    const kyNang = kyNangCuaNghe(m, sk?.ngheId ?? null).giaTri;
    tien = [kep((sk?.soNhipDaLam ?? 0) / 10), kep(kyNang / NGUONG_BAC.tho_ca)];
  } else if (loai === 'truyen_nghe') {
    const soTro = sk?.hocTroIds.length ?? 0;
    const coTiengTam = (docAspect<{ tiengTam?: string[] }>(e, 'can_cuoc')?.tiengTam ?? []).some((t) =>
      t.startsWith('Đã truyền nghề'),
    );
    tien = [kep(soTro > 0 || coTiengTam ? 1 : 0), kep(coTiengTam ? 1 : 0)];
  } else if (loai === 'gan_lai') {
    const doi = pj.stakeholderIds[0];
    if (doi) {
      const qh = quanHeCua(state, doi, nguoiId as string);
      tien = [kep(qh.anTuong === '' ? 0 : 1), kep((qh.tinNgo + 20) / 40)];
    }
  } else if (loai === 'lap_nha') {
    const ho = hoCuaNguoi(state, nguoiId as string);
    tien = [kep((sk?.thuNhapGanNhat ?? 0) / 2), ho ? 1 : 0];
  }

  const milestones = pj.milestones.map((x, i) => {
    const p = tien[i] ?? 0;
    return { ...x, progress: p, completedAtTick: p >= 1 ? (x.completedAtTick ?? tick) : null };
  });

  const xong = milestones.length > 0 && milestones.every((x) => x.completedAtTick !== null);
  const dungIm = milestones[0] !== undefined && milestones[0].progress <= 0 && tick - pj.nextTick > 12;

  return {
    ...pj,
    milestones,
    status: xong ? 'completed' : dungIm ? 'blocked' : 'active',
    nextTick: tick + 2,
  };
}
