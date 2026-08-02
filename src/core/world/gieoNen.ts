/**
 * Gieo state nền cho một thế giới mới — Phần 71.2, 72.4.
 *
 * Một `place` không có `dan_cu`/`kinh_te`/`sinh_thai` sẽ bị mười hai tiến trình
 * **bỏ qua trong im lặng**: không lỗi, không cảnh báo, chỉ là một vùng đứng hình
 * mãi mãi. Vì vậy gieo nền là một phần của khởi tạo thế giới, không phải tùy chọn.
 *
 * [BB] Nguyên tắc gieo: **không tặng của cải**. Trữ lượng vừa đủ nuôi số dân đang
 * có, kho vừa đủ ăn vài mùa. Muốn giàu thì phải có ai đó làm ra nó trong lịch sử
 * của chính thế giới này.
 */
import type { Event, PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import { taoEvent } from '../engine/transaction.js';
import { EntitySchema, LinkSchema } from '../schema/entity.js';
import { nguonGoc } from '../schema/aspect/provenance.js';
import {
  DanCuSchema,
  YTeSchema,
  SinhThaiSchema,
  KinhTeSchema,
  VanHoaSchema,
  AnNinhSchema,
  DuongSchema,
} from '../schema/aspect/substrate.js';
import { KHAU_PHAN } from './process/danSo.js';
import { docAspect } from './process/tienIch.js';
import { banNgaTu } from '../than/diHoa.js';
import type { Venerable } from '../schema/aspect/divine.js';
import type { BanTinh } from '../schema/aspect/soul.js';
import type { Rng } from '../engine/rng.js';
import { taoRng } from '../engine/rng.js';
import { SinhKeSchema, CanCuocSchema, bacTheoKyNang } from '../schema/aspect/pham.js';
import { noiOCua } from '../pham/lich.js';

/** Tháp tuổi tiền công nghiệp; tổng đúng bằng `danSo`, không sai một người. */
export function thapTuoi(danSo: number): { child: number; youth: number; adult: number; elder: number } {
  const n = Math.max(0, Math.floor(danSo));
  const child = Math.floor(n * 0.32);
  const youth = Math.floor(n * 0.2);
  const elder = Math.floor(n * 0.08);
  return { child, youth, adult: n - child - youth - elder, elder };
}

/** Bộ aspect nền của một vùng, suy từ dân số đang có. */
export function aspectNen(danSo: number, rng: Rng): Record<string, unknown> {
  const n = Math.max(0, Math.floor(danSo));
  // Sức chứa đủ nuôi vùng ở mức hiện tại và cho phép lớn chừng gấp rưỡi — không hơn.
  const dat = Math.max(200, n * 9);
  const rung = Math.max(150, n * 4);

  return {
    dan_cu: DanCuSchema.parse({
      cohort: thapTuoi(n),
      soHo: Math.max(0, Math.round(n / 4)),
      nguoiMoiHo: 4,
    }),
    y_te: YTeSchema.parse({ hieuBietYHoc: rng.khoang(5, 20) }),
    sinh_thai: SinhThaiSchema.parse({
      taiNguyen: { rung, thu: rung * 0.3, ca: rung * 0.25, dat },
      sucChua: { rung, thu: rung * 0.3, ca: rung * 0.25, dat },
      tocDoPhucHoi: rng.khoang(5, 9) / 100,
    }),
    // Kho đủ ăn chừng bốn mùa. Đói là chuyện của tương lai, không của tick đầu.
    kinh_te: KinhTeSchema.parse({
      kho: { luongThuc: Math.round(n * KHAU_PHAN * 4), vatLieu: Math.round(n * 0.4) },
      kyThuat: rng.khoang(3, 10),
      haTang: { nha: Math.round(n / 4), duong: 0, kho: 1 },
    }),
    van_hoa: VanHoaSchema.parse({ ngonNguId: 'ngon_ngu_goc' }),
    an_ninh: AnNinhSchema.parse({ phongVe: rng.khoang(5, 20) }),
  };
}

/**
 * Patch gieo nền cho mọi `place` chưa có, cộng một tuyến đường nối chúng.
 *
 * Tuyến đường không phải trang trí: thiếu nó thì tin tức, bệnh, hàng hóa và
 * người đều không đi đâu được, và cả sáu tiến trình vùng đứng yên.
 */
export function patchGieoNen(state: WorldState, eventId: string, seed: string): PatchOp[] {
  const rng = taoRng(`${seed}#gieo_nen`);
  const ra: PatchOp[] = [];

  const noiChon = [...state.entities.keys()]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((id) => state.entities.get(id))
    .filter((e): e is NonNullable<typeof e> => e !== undefined && e.kind === 'place' && e.tickDiet === null);

  for (const e of noiChon) {
    if (e.aspects['dan_cu'] !== undefined) continue;
    const sp = docAspect<{ danSo?: number }>(e, 'spatial');
    const danSo = Math.floor(sp?.danSo ?? 0);
    const nen = aspectNen(danSo, rng.nhanh(`nen:${e.id}`));
    for (const [ten, giaTri] of Object.entries(nen)) {
      ra.push({
        op: 'set',
        target: { table: 'entities', id: e.id, path: `aspects.${ten}` },
        value: giaTri,
        sourceEventId: eventId,
      });
    }
    // Tháp tuổi làm tròn có thể lệch `spatial.danSo` vài người — ép khớp ngay,
    // nếu không bất biến `dan_so_khop_cohort` sẽ chặn tick đầu tiên.
    const dc = nen['dan_cu'] as { cohort: Record<string, number> };
    const tong = ['child', 'youth', 'adult', 'elder'].reduce((t, k) => t + (dc.cohort[k] ?? 0), 0);
    if (tong !== sp?.danSo) {
      ra.push({
        op: 'set',
        target: { table: 'entities', id: e.id, path: 'aspects.spatial.danSo' },
        value: tong,
        sourceEventId: eventId,
      });
    }
  }

  // ── bản ngã cho mọi vị thần chưa có (Phase 6, Phần 69.1) ──
  // Dựng TỪ dữ liệu đã có (`soul.banTinh` và `venerable.banTinhTinDoTin`), không
  // bịa: lõi là con người thật, hình ảnh là điều tín đồ đang tin.
  for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const e = state.entities.get(id);
    if (!e || e.kind !== 'deity' || e.tickDiet !== null) continue;
    if (e.aspects['ban_nga'] !== undefined) continue;
    const soul = docAspect<{ banTinh?: BanTinh }>(e, 'soul');
    if (!soul?.banTinh) continue;
    ra.push({
      op: 'set',
      target: { table: 'entities', id, path: 'aspects.ban_nga' },
      value: banNgaTu(soul.banTinh, docAspect<Venerable>(e, 'venerable')),
      sourceEventId: eventId,
    });
  }

  // ── sinh kế, hộ và căn cước cho mọi người chưa có (Phase 7, Phần 70.2) ──
  //
  // Cũng dựng TỪ dữ liệu đã có: nghề lấy từ `mortal.ngheId` nếu đã khai, bậc suy
  // từ kỹ năng thật, nơi làm là nơi họ đang ở. Không bịa nghề, không tặng bậc.
  //
  // Hộ thì KHÔNG gieo tự động: một cái nhà là một quyết định của người, và
  // `household_lifecycle` chỉ nên chạy trên hộ do ai đó lập ra. Người chưa có hộ
  // là người sống một mình — đó là một trạng thái hợp lệ, không phải thiếu dữ liệu.
  for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const e = state.entities.get(id);
    if (!e || e.kind !== 'mortal' || e.tickDiet !== null) continue;

    if (e.aspects['sinh_ke'] === undefined) {
      const m = docAspect<{ ngheId?: string | null; kyNang?: Record<string, number> }>(e, 'mortal');
      const kyNang = Math.max(0, ...Object.values(m?.kyNang ?? { x: 0 }));
      ra.push({
        op: 'set',
        target: { table: 'entities', id, path: 'aspects.sinh_ke' },
        value: SinhKeSchema.parse({
          ngheId: m?.ngheId ?? null,
          bac: bacTheoKyNang(kyNang),
          noiLamId: noiOCua(state, id),
        }),
        sourceEventId: eventId,
      });
    }
    if (e.aspects['can_cuoc'] === undefined) {
      ra.push({
        op: 'set',
        target: { table: 'entities', id, path: 'aspects.can_cuoc' },
        value: CanCuocSchema.parse({}),
        sourceEventId: eventId,
      });
    }
  }

  // ── tuyến đường: nối chuỗi các vùng theo thứ tự id ──
  const daCoDuong = new Set<string>();
  for (const e of state.entities.values()) {
    if (e.kind !== 'route') continue;
    const d = docAspect<{ tuId: string; denId: string }>(e, 'duong');
    if (!d) continue;
    daCoDuong.add(d.tuId < d.denId ? `${d.tuId}|${d.denId}` : `${d.denId}|${d.tuId}`);
  }

  for (let i = 0; i + 1 < noiChon.length; i++) {
    const a = noiChon[i] as NonNullable<(typeof noiChon)[number]>;
    const b = noiChon[i + 1] as NonNullable<(typeof noiChon)[number]>;
    const khoa = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
    if (daCoDuong.has(khoa)) continue;
    daCoDuong.add(khoa);

    const rngD = rng.nhanh(`duong:${khoa}`);
    const duongId = `route_${a.id}_${b.id}`;
    const duong = EntitySchema.parse({
      id: duongId,
      branchId: state.world.branchId,
      kind: 'route',
      ten: `Đường ${a.ten} — ${b.ten}`,
      moTa: 'Một lối mòn đủ rộng cho xe bò, đủ hẹp để mất dấu sau vài mùa không ai đi.',
      tickSinh: state.world.tick,
      aspects: {
        // [BB] 59.1 — đường mòn do người ta đi mà thành, không do ai ra lệnh.
        provenance: nguonGoc('the_gioi_tu_sinh', state.world.tick, { parentIds: [a.id, b.id] }),
        duong: DuongSchema.parse({
          tuId: a.id,
          denId: b.id,
          doDai: rngD.khoang(1, 3),
          chatLuong: rngD.khoang(30, 60),
        }),
      },
    });

    ra.push({
      op: 'link',
      target: { table: 'entities', id: duongId, path: '' },
      value: duong,
      sourceEventId: eventId,
    });

    // [BB] 6.3 — không thực thể mồ côi: tuyến phải có cạnh về cả hai đầu.
    for (const [lid, tuId, denId] of [
      [`lk_${duongId}_a`, duongId, a.id],
      [`lk_${duongId}_b`, duongId, b.id],
    ] as const) {
      ra.push({
        op: 'link',
        target: { table: 'links', id: lid, path: '' },
        value: LinkSchema.parse({
          id: lid,
          branchId: state.world.branchId,
          tuId,
          denId,
          quanHe: 'noi_lien',
          trongSo: 70,
          tickTao: state.world.tick,
        }),
        sourceEventId: eventId,
      });
    }
  }

  return ra;
}

/**
 * Event gieo nền. Người gọi đưa nó qua `apDungEvent` như mọi Event khác —
 * [BB] luật bất biến #4: không có cửa nào khác để state đổi.
 *
 * Chạy lại trên một thế giới đã gieo là **không làm gì** (patch rỗng), nên gọi
 * nó sau mỗi lần nạp save là an toàn và là cách đơn giản nhất để vùng mới do
 * người chơi `HIỆN` ra cũng có đủ nền.
 */
export function eventGieoNen(state: WorldState, hauTo = ''): Event | null {
  const evId = `ev_gieo_nen_${state.world.branchId}_${state.world.tick}${hauTo}`;
  const patches = patchGieoNen(state, evId, state.world.seed);
  if (patches.length === 0) return null;

  return taoEvent({
    id: evId,
    branchId: state.world.branchId,
    tick: state.world.tick,
    loai: 'gieo_nen',
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches,
    visibility: 'engine',
    source: 'engine',
    payload: { soPatch: patches.length },
  });
}
