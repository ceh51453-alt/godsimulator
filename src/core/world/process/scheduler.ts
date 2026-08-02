/**
 * Scheduler tiến trình nền — Phần 71.4 [BB].
 *
 * "Một scheduler dựng đồ thị từ reads/writes:
 *   1. Process write cùng path bằng operation giao hoán (add) → gộp.
 *   2. `set` đụng `set` → cần priority manifest hoặc conflict reducer.
 *   3. Cycle process → chia stage hoặc fixed-point có giới hạn.
 *   4. Sau mỗi stage chạy invariant.
 *   5. Vi phạm → rollback stage, ghi diagnostic với process và patch gây lỗi."
 *
 * ── Vì sao scheduler áp patch rồi hoàn tác ──
 *
 * Handler chỉ đọc state, nên tiến trình ở stage 2 phải thấy kết quả của stage 1;
 * không có cách nào biết trước một lô patch có làm vỡ bất biến hay không ngoài
 * việc áp thử. Nhưng [BB] luật bất biến #4 nói state chỉ được đổi qua Event.
 *
 * Lối thoát: áp thử **trên chính state** để đọc đúng, giữ thông tin hoàn tác
 * chính xác của ADR-0011, rồi **hoàn tác toàn bộ theo thứ tự ngược** trước khi
 * trả về. State ra khỏi hàm này y hệt lúc vào; thứ đi ra là *danh sách patch đã
 * được chứng minh là an toàn*. Tick gói chúng vào Event và đi đường chính thức.
 *
 * Rẻ hơn `saoChepState()` mỗi tick rất nhiều: hoàn tác là O(số bản ghi bị chạm).
 */
import type { PatchOp } from '../../contracts/core.js';
import type { WorldState } from '../../engine/state.js';
import { apPatch, hoanTacPatch } from '../../engine/patch.js';
import type { ThongTinHoanTac } from '../../engine/patch.js';
import { chayInvariant } from '../../engine/invariant.js';
import { rngCuaTick } from '../../engine/rng.js';
import type { Tuning } from '../../tuning/schema.js';
import type { WorldProcessDef, KhaiBaoBaoToan } from '../../registry/types.js';
import type {
  KetQuaTienTrinh,
  NgocCanhTienTrinh,
  PhanGiaiChay,
  TienTrinhNen,
  UngVienSuKien,
} from './types.js';
import { moiTienTrinh } from './index.js';
import { muaCuaTick, namCuaTick } from '../../schema/aspect/substrate.js';
import { lam } from './tienIch.js';

export type MucChanDoan = 'thong_tin' | 'canh_bao' | 'loi';

export type ChanDoanTienTrinh = {
  readonly ma: string;
  readonly muc: MucChanDoan;
  readonly tienTrinhIds: readonly string[];
  readonly thongDiep: string;
  /** Patch cụ thể gây lỗi, khi xác định được (71.4 quy tắc 5). */
  readonly patch?: string;
};

export type KetQuaScheduler = {
  /** Patch đã qua bảo toàn, hợp nhất xung đột và invariant. Áp lại là an toàn. */
  readonly patches: readonly PatchOp[];
  readonly suKien: readonly UngVienSuKien[];
  readonly chanDoan: readonly ChanDoanTienTrinh[];
  /** Số stage đã chạy — dùng cho benchmark và cho test đồ thị. */
  readonly soGiaiDoan: number;
  readonly daChay: readonly string[];
};

export type TuyChonScheduler = {
  readonly tick: number;
  readonly eventId: string;
  readonly tuning: Tuning;
  /** Catch-up: một lần chạy gộp bao nhiêu bước nhịp (71.6). */
  readonly soBuocGop?: number;
  /** Ép độ phân giải; bỏ trống thì mỗi tiến trình dùng khai báo của mình. */
  readonly phanGiai?: PhanGiaiChay;
  /** Bỏ trống thì lấy mười hai tiến trình dựng sẵn. */
  readonly tienTrinh?: readonly TienTrinhNen[];
};

// ─────────────────────────────────────────── đồ thị và giai đoạn

/** Một `write` chạm một `read` khi hai đường dẫn có quan hệ tiền tố. */
function chamNhau(ghi: { table: string; path: string }, doc: { table: string; path: string }): boolean {
  if (ghi.table !== doc.table) return false;
  if (ghi.path === '' || doc.path === '') return true;
  return ghi.path === doc.path || ghi.path.startsWith(`${doc.path}.`) || doc.path.startsWith(`${ghi.path}.`);
}

function phuThuoc(truoc: WorldProcessDef, sau: WorldProcessDef): boolean {
  if (truoc.id === sau.id) return false;
  return truoc.ghi.some((g) => sau.doc.some((d) => chamNhau(g, d)));
}

/**
 * Chia giai đoạn: rút gọn theo thành phần liên thông mạnh, rồi sắp thứ tự.
 *
 * Quy tắc 3 nói "chia stage HOẶC fixed-point có giới hạn". Ở đây là chia stage:
 * chỉ những tiến trình **thật sự nằm trong một vòng** mới dùng chung ảnh chụp;
 * tiến trình chỉ *đứng sau* một vòng vẫn được chạy ở giai đoạn riêng và đọc kết
 * quả đã cập nhật.
 *
 * Vì sao phải chính xác đến thế: hai tiến trình cùng giai đoạn đều tính delta từ
 * cùng một ảnh chụp. Nếu cả hai cùng rút một cái kho, mỗi bên tưởng mình rút từ
 * kho đầy, và cộng lại thì kho âm. Gộp thừa vào một giai đoạn không phải là
 * "thận trọng" — nó tạo ra đúng cái bug mà quy tắc 4 phải đi dọn.
 *
 * Vòng dân số ↔ lương thực ↔ bệnh là vòng THẬT của thế giới, không phải lỗi khai
 * báo, nên nó chỉ sinh chẩn đoán mức `thong_tin`.
 */
export function chiaGiaiDoan(ds: readonly TienTrinhNen[]): {
  giaiDoan: TienTrinhNen[][];
  chuTrinh: string[][];
} {
  const theoId = new Map(ds.map((t) => [t.def.id, t]));
  const nut = ds.map((t) => t.def.id).sort((a, b) => (a < b ? -1 : 1));

  const canh = new Map<string, string[]>(nut.map((id) => [id, []]));
  for (const a of ds) {
    for (const b of ds) {
      if (phuThuoc(a.def, b.def)) canh.get(a.def.id)?.push(b.def.id);
    }
  }
  for (const [, ke] of canh) ke.sort((a, b) => (a < b ? -1 : 1));

  const cum = timSCC(nut, canh);

  // ── đồ thị rút gọn ──
  const cumCua = new Map<string, number>();
  cum.forEach((c, i) => c.forEach((id) => cumCua.set(id, i)));

  const conCum = cum.map(() => 0);
  const canhCum = cum.map(() => new Set<number>());
  for (const a of nut) {
    const ca = cumCua.get(a) as number;
    for (const b of canh.get(a) ?? []) {
      const cb = cumCua.get(b) as number;
      if (ca === cb || canhCum[ca]?.has(cb)) continue;
      canhCum[ca]?.add(cb);
      conCum[cb] = (conCum[cb] ?? 0) + 1;
    }
  }

  const giaiDoan: TienTrinhNen[][] = [];
  const conLai = new Set(cum.map((_, i) => i));
  while (conLai.size > 0) {
    // Tie-break theo id nhỏ nhất của cụm — thứ tự ổn định giữa các lần chạy.
    const san = [...conLai]
      .filter((i) => (conCum[i] ?? 0) === 0)
      .sort((x, y) => {
        const a = (cum[x] as string[])[0] as string;
        const b = (cum[y] as string[])[0] as string;
        return a < b ? -1 : 1;
      });
    if (san.length === 0) break;

    // Mỗi cụm là MỘT giai đoạn riêng. Hai cụm độc lập vẫn tách, vì gộp chúng
    // lại chỉ để tiết kiệm một vòng lặp là đánh đổi sai.
    for (const i of san) {
      giaiDoan.push((cum[i] as string[]).map((id) => theoId.get(id) as TienTrinhNen));
      conLai.delete(i);
      for (const ke of canhCum[i] ?? []) conCum[ke] = (conCum[ke] ?? 1) - 1;
    }
  }

  const chuTrinh = cum.filter((c) => c.length > 1);
  return { giaiDoan, chuTrinh };
}

/**
 * Tarjan, bản lặp — đồ thị chỉ có mười hai nút nhưng đệ quy trong hot path là
 * thói quen xấu, và scheduler này chạy mỗi tick.
 * Trả các cụm theo thứ tự deterministic, phần tử trong cụm đã sắp xếp.
 */
function timSCC(nut: readonly string[], canh: ReadonlyMap<string, string[]>): string[][] {
  const chiSo = new Map<string, number>();
  const thap = new Map<string, number>();
  const tren = new Set<string>();
  const ngan: string[] = [];
  const cum: string[][] = [];
  let dem = 0;

  for (const goc of nut) {
    if (chiSo.has(goc)) continue;
    const stack: { id: string; i: number }[] = [{ id: goc, i: 0 }];
    chiSo.set(goc, dem);
    thap.set(goc, dem);
    dem++;
    ngan.push(goc);
    tren.add(goc);

    while (stack.length > 0) {
      const khung = stack[stack.length - 1] as { id: string; i: number };
      const ke = canh.get(khung.id) ?? [];

      if (khung.i < ke.length) {
        const con = ke[khung.i] as string;
        khung.i++;
        if (!chiSo.has(con)) {
          chiSo.set(con, dem);
          thap.set(con, dem);
          dem++;
          ngan.push(con);
          tren.add(con);
          stack.push({ id: con, i: 0 });
        } else if (tren.has(con)) {
          thap.set(khung.id, Math.min(thap.get(khung.id) as number, chiSo.get(con) as number));
        }
        continue;
      }

      stack.pop();
      const cha = stack[stack.length - 1];
      if (cha) {
        thap.set(cha.id, Math.min(thap.get(cha.id) as number, thap.get(khung.id) as number));
      }
      if (thap.get(khung.id) === chiSo.get(khung.id)) {
        const c: string[] = [];
        for (;;) {
          const x = ngan.pop() as string;
          tren.delete(x);
          c.push(x);
          if (x === khung.id) break;
        }
        cum.push(c.sort((a, b) => (a < b ? -1 : 1)));
      }
    }
  }
  return cum;
}

// ─────────────────────────────────────────── bảo toàn

/** Tổng mọi `add` của một lô patch trên nhóm path đã khai. */
export function tongTheoKhaiBao(patches: readonly PatchOp[], kb: KhaiBaoBaoToan): number {
  let t = 0;
  for (const p of patches) {
    if (p.op !== 'add' || p.target.table !== kb.table) continue;
    if (!kb.paths.includes(p.target.path)) continue;
    if (typeof p.value === 'number') t += p.value;
  }
  return t;
}

function kiemBaoToan(def: WorldProcessDef, patches: readonly PatchOp[]): ChanDoanTienTrinh | null {
  for (const kb of def.baoToan) {
    const tong = tongTheoKhaiBao(patches, kb);
    const saiSo = kb.saiSo ?? 1e-6;
    if (Math.abs(tong - kb.tong) <= saiSo) continue;
    return {
      ma: 'BAO_TOAN_VO',
      muc: 'loi',
      tienTrinhIds: [def.id],
      thongDiep:
        `Tiến trình '${def.id}' khai bảo toàn ${kb.tong} trên [${kb.paths.join(', ')}] ` +
        `nhưng lô patch cộng lại ra ${lam(tong)}. Lô bị bỏ — vật chất không được tự sinh.`,
      patch: kb.paths.join(','),
    };
  }
  return null;
}

// ─────────────────────────────────────────── hợp nhất xung đột ghi

type KhoaPatch = string;

const khoaCua = (p: PatchOp): KhoaPatch => `${p.target.table}|${p.target.id}|${p.target.path}`;

/**
 * Quy tắc 1 và 2 của 71.4.
 *
 * `add` cùng path từ nhiều tiến trình → cộng lại thành một (giao hoán, an toàn).
 * `set` cùng path từ nhiều tiến trình → `uuTien` cao thắng, hòa thì id nhỏ thắng;
 * kèm chẩn đoán để không có xung đột nào đi qua trong im lặng.
 */
export function honNhatXungDot(lo: readonly { def: WorldProcessDef; patches: readonly PatchOp[] }[]): {
  patches: PatchOp[];
  chanDoan: ChanDoanTienTrinh[];
} {
  const chanDoan: ChanDoanTienTrinh[] = [];

  const gopAdd = new Map<KhoaPatch, { mau: PatchOp; tong: number }>();
  const setTheoKhoa = new Map<KhoaPatch, { def: WorldProcessDef; p: PatchOp }[]>();
  const thuTu: { loai: 'add' | 'set' | 'khac'; khoa: KhoaPatch; p?: PatchOp }[] = [];
  const daGhiNhan = new Set<KhoaPatch>();

  for (const { def, patches } of lo) {
    for (const p of patches) {
      const khoa = khoaCua(p);
      if (p.op === 'add' && typeof p.value === 'number') {
        const cu = gopAdd.get(khoa);
        if (cu) cu.tong += p.value;
        else {
          gopAdd.set(khoa, { mau: p, tong: p.value });
          thuTu.push({ loai: 'add', khoa });
        }
        continue;
      }
      if (p.op === 'set') {
        const ds = setTheoKhoa.get(khoa) ?? [];
        ds.push({ def, p });
        setTheoKhoa.set(khoa, ds);
        if (!daGhiNhan.has(khoa)) {
          daGhiNhan.add(khoa);
          thuTu.push({ loai: 'set', khoa });
        }
        continue;
      }
      thuTu.push({ loai: 'khac', khoa, p });
    }
  }

  const patches: PatchOp[] = [];
  for (const muc of thuTu) {
    if (muc.loai === 'add') {
      const g = gopAdd.get(muc.khoa);
      if (!g) continue;
      patches.push({ ...g.mau, value: lam(g.tong) });
      continue;
    }
    if (muc.loai === 'set') {
      const ds = setTheoKhoa.get(muc.khoa);
      if (!ds || ds.length === 0) continue;
      if (ds.length === 1) {
        patches.push((ds[0] as { p: PatchOp }).p);
        continue;
      }
      const thang = [...ds].sort((a, b) =>
        a.def.uuTien !== b.def.uuTien ? b.def.uuTien - a.def.uuTien : a.def.id < b.def.id ? -1 : 1,
      )[0] as { def: WorldProcessDef; p: PatchOp };
      chanDoan.push({
        ma: 'SET_DUNG_SET',
        muc: 'canh_bao',
        tienTrinhIds: ds.map((x) => x.def.id).sort((a, b) => (a < b ? -1 : 1)),
        thongDiep:
          `${ds.length} tiến trình cùng 'set' '${muc.khoa}'. ` +
          `'${thang.def.id}' thắng theo uuTien ${thang.def.uuTien}.`,
        patch: muc.khoa,
      });
      patches.push(thang.p);
      continue;
    }
    if (muc.p) patches.push(muc.p);
  }

  return { patches, chanDoan };
}

// ─────────────────────────────────────────── vòng chạy

function denNhip(def: WorldProcessDef, tick: number): boolean {
  const { unit, every } = def.nhip;
  if (unit === 'event') return false;
  const moi = Math.max(1, Math.floor(every));
  return tick % moi === 0;
}

function phanGiaiCua(def: WorldProcessDef, ep: PhanGiaiChay | undefined): PhanGiaiChay {
  if (ep) return ep;
  return def.phanGiai === 'adaptive' ? 'meso' : def.phanGiai;
}

/**
 * Chạy các tiến trình đến nhịp cho MỘT bước.
 *
 * [BB] Hàm này trả `state` về đúng trạng thái lúc vào. Nó không commit gì.
 */
export function chayTienTrinhNen(state: WorldState, tc: TuyChonScheduler): KetQuaScheduler {
  const ds = (tc.tienTrinh ?? moiTienTrinh()).filter((t) => denNhip(t.def, tc.tick));
  const chanDoan: ChanDoanTienTrinh[] = [];
  const patchCuoi: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];
  const daChay: string[] = [];

  if (ds.length === 0) return { patches: [], suKien: [], chanDoan, soGiaiDoan: 0, daChay };

  const { giaiDoan, chuTrinh } = chiaGiaiDoan(ds);
  for (const cum of chuTrinh) {
    chanDoan.push({
      ma: 'CHU_TRINH_CHUNG_GIAI_DOAN',
      muc: 'thong_tin',
      tienTrinhIds: cum,
      thongDiep:
        `Cụm phụ thuộc vòng [${cum.join(', ')}] chạy chung một giai đoạn trên cùng một ảnh chụp ` +
        `(71.4 quy tắc 3). Đây là vòng phản hồi thật của thế giới, không phải lỗi khai báo.`,
    });
  }

  const soBuocGop = Math.max(1, Math.floor(tc.soBuocGop ?? 1));
  const hoanTac: ThongTinHoanTac[] = [];
  const tranSuKien = tc.tuning.worldProcess.maxEventsPerTick;

  for (const stage of giaiDoan) {
    // ── chạy handler; mọi tiến trình trong stage đọc CÙNG một ảnh chụp ──
    const lo: { def: WorldProcessDef; patches: readonly PatchOp[] }[] = [];

    for (const t of stage) {
      const nc: NgocCanhTienTrinh = {
        state,
        tick: tc.tick,
        nam: namCuaTick(tc.tick),
        mua: muaCuaTick(tc.tick),
        eventId: tc.eventId,
        tuning: tc.tuning,
        // Kênh riêng theo tiến trình: đổi thứ tự chạy KHÔNG đổi số rút được.
        rng: rngCuaTick(state.world.seed, tc.tick, `wp:${t.def.id}`),
        phanGiai: phanGiaiCua(t.def, tc.phanGiai),
        soBuocGop,
      };

      let kq: KetQuaTienTrinh;
      try {
        kq = t.chay(nc);
      } catch (e) {
        // Handler nổ không được kéo cả thế giới theo. Bỏ nó, ghi lại, đi tiếp.
        chanDoan.push({
          ma: 'HANDLER_NEM_LOI',
          muc: 'loi',
          tienTrinhIds: [t.def.id],
          thongDiep: `Tiến trình '${t.def.id}' ném lỗi: ${e instanceof Error ? e.message : String(e)}`,
        });
        continue;
      }

      const viPham = kiemBaoToan(t.def, kq.patches);
      if (viPham) {
        chanDoan.push(viPham);
        continue;
      }

      lo.push({ def: t.def, patches: kq.patches });
      daChay.push(t.def.id);
      for (const sk of kq.suKien) {
        if (suKien.length >= tranSuKien) break;
        suKien.push(sk);
      }
    }

    if (lo.length === 0) continue;

    // ── quy tắc 1 và 2 ──
    const hop = honNhatXungDot(lo);
    chanDoan.push(...hop.chanDoan);
    if (hop.patches.length === 0) continue;

    // ── quy tắc 4 và 5 ──
    const ok = apDungStage(state, hop.patches, hoanTac);
    if (ok.dat) {
      patchCuoi.push(...hop.patches);
      continue;
    }

    // Stage hỏng: tách từng tiến trình để chỉ ra ĐÚNG kẻ gây lỗi (quy tắc 5),
    // và giữ lại phần lành. Một tiến trình sai không được làm đứng cả thế giới.
    chanDoan.push({
      ma: 'STAGE_VI_PHAM_BAT_BIEN',
      muc: 'canh_bao',
      tienTrinhIds: lo.map((x) => x.def.id),
      thongDiep: `Giai đoạn vi phạm bất biến: ${ok.lyDo}. Đang tách từng tiến trình để tìm nguồn.`,
    });

    for (const x of lo) {
      if (x.patches.length === 0) continue;
      const rieng = apDungStage(state, x.patches, hoanTac);
      if (rieng.dat) {
        patchCuoi.push(...x.patches);
        continue;
      }
      chanDoan.push({
        ma: 'TIEN_TRINH_VI_PHAM_BAT_BIEN',
        muc: 'loi',
        tienTrinhIds: [x.def.id],
        thongDiep: `Tiến trình '${x.def.id}' bị bỏ: ${rieng.lyDo}`,
        patch: x.patches[0] ? khoaCua(x.patches[0]) : undefined,
      });
    }
  }

  // ── trả state về nguyên trạng: scheduler KHÔNG commit ──
  for (let i = hoanTac.length - 1; i >= 0; i--) {
    hoanTacPatch(state, hoanTac[i] as ThongTinHoanTac);
  }

  return {
    patches: patchCuoi,
    suKien,
    chanDoan,
    soGiaiDoan: giaiDoan.length,
    daChay: daChay.sort((a, b) => (a < b ? -1 : 1)),
  };
}

/** Áp một lô, kiểm bất biến trên đúng phạm vi bị chạm, hoàn tác nếu hỏng. */
function apDungStage(
  state: WorldState,
  patches: readonly PatchOp[],
  hoanTac: ThongTinHoanTac[],
): { dat: boolean; lyDo: string } {
  const r = apPatch(state, patches);
  if (!r.ok) {
    return { dat: false, lyDo: r.errors.map((e) => e.message).join('; ') };
  }
  const inv = chayInvariant(state, r.value.phamVi);
  if (inv.dat) {
    hoanTac.push(r.value.hoanTac);
    return { dat: true, lyDo: '' };
  }
  hoanTacPatch(state, r.value.hoanTac);
  return { dat: false, lyDo: inv.viPhamNang.map((e) => e.message).join('; ') };
}
