/**
 * Hợp nhánh — Phần 26.3.
 *
 * ── Đây là đồ chơi cuối game, không phải tính năng tiện ích ──
 *
 * Đặc tả nói đúng câu ấy, và cái giá được liệt kê tường minh:
 *
 * ```text
 * realityIntegrity += tuning.thucTai.hopNhanh   (−35)
 * entity tồn tại ở cả hai nhánh với trạng thái khác nhau → vùng Nghịch Lý
 * NPC nhớ hai phiên bản quá khứ
 * thanh tra mạch lạc sinh hàng loạt tranh chấp sử liệu
 * ```
 *
 * Vì vậy hàm ở đây **không** hợp nhất im lặng. Nó trả về `BaoCaoGopNhanh` với
 * từng tranh chấp, và người gọi phải quyết định từng cái trước khi có patch nào
 * được sinh ra. Một `merge()` tự chọn bên thắng là một `merge()` xóa mất một nửa
 * lịch sử mà không ai biết.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity, Link } from '../schema/entity.js';
import type { Tuning } from '../tuning/schema.js';
import type { PatchOp } from '../contracts/core.js';
import { bam, chuanHoa } from '../engine/hash.js';

export const BEN = ['a', 'b', 'ca_hai'] as const;
export type Ben = (typeof BEN)[number];

export type TranhChap = {
  readonly bang: 'entities' | 'links';
  readonly id: string;
  readonly ten: string;
  /** Đường dẫn khác nhau giữa hai bản — rỗng nghĩa là chỉ một bên có. */
  readonly truongKhac: readonly string[];
  readonly chiCoO: Ben | null;
  /** Người chơi phải chọn; engine KHÔNG tự chọn. */
  readonly deXuat: Ben;
  readonly lyDo: string;
};

export type BaoCaoGopNhanh = {
  readonly nhanhA: string;
  readonly nhanhB: string;
  readonly chungId: readonly string[];
  readonly tranhChap: readonly TranhChap[];
  readonly chiCoA: readonly string[];
  readonly chiCoB: readonly string[];
  /** Vùng sẽ thành Nghịch Lý nếu hợp — 26.3. */
  readonly vungNghichLy: readonly string[];
  /** realityIntegrity sẽ tụt bao nhiêu. */
  readonly giaThucTai: number;
  readonly tomTat: string;
};

function duongDanKhac(a: unknown, b: unknown, tien = ''): string[] {
  if (chuanHoa(a) === chuanHoa(b)) return [];
  const laObj = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!laObj(a) || !laObj(b)) return [tien === '' ? '.' : tien];
  const khoa = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const ra: string[] = [];
  for (const k of khoa) {
    if (k.startsWith('_')) continue; // trường cache, không phải sự thật
    ra.push(...duongDanKhac(a[k], b[k], tien === '' ? k : `${tien}.${k}`));
  }
  return ra;
}

/**
 * So hai nhánh và dựng báo cáo tranh chấp — 26.2 "diff ba cột".
 *
 * Không sửa gì. Hàm thuần trên hai `WorldState` đã nạp.
 */
export function soSanhNhanh(a: WorldState, b: WorldState, tuning: Tuning): BaoCaoGopNhanh {
  const idA = new Set(a.entities.keys());
  const idB = new Set(b.entities.keys());
  const chung = [...idA].filter((id) => idB.has(id)).sort();
  const chiCoA = [...idA].filter((id) => !idB.has(id)).sort();
  const chiCoB = [...idB].filter((id) => !idA.has(id)).sort();

  const tranhChap: TranhChap[] = [];
  const vungNghichLy = new Set<string>();

  for (const id of chung) {
    const ea = a.entities.get(id) as Entity;
    const eb = b.entities.get(id) as Entity;
    const khac = duongDanKhac(ea, eb);
    if (khac.length === 0) continue;

    /**
     * Đề xuất mặc định: bên nào có `tickDiet` thì bên ấy KHÔNG được đề xuất.
     *
     * Một thực thể chết ở nhánh này và sống ở nhánh kia là tranh chấp nặng nhất —
     * gộp bừa sẽ hồi sinh hoặc giết một nhân vật mà không có một dòng văn nào
     * giải thích. Đề xuất giữ bản còn sống, và bắt buộc người chơi xác nhận.
     */
    const songA = ea.tickDiet === null;
    const songB = eb.tickDiet === null;
    const deXuat: Ben = songA && !songB ? 'a' : songB && !songA ? 'b' : 'ca_hai';
    const lyDo =
      songA !== songB
        ? 'Một nhánh giữ thực thể này còn sống, nhánh kia đã chôn nó. Chọn một; không có bản trung dung.'
        : `Khác ${khac.length} trường: ${khac.slice(0, 5).join(', ')}.`;

    tranhChap.push({ bang: 'entities', id, ten: ea.ten, truongKhac: khac, chiCoO: null, deXuat, lyDo });

    // Thực thể có mặt ở cả hai với trạng thái khác nhau → vùng Nghịch Lý.
    for (const l of a.links.values()) {
      if (l.tuId === id && l.quanHe === 'o_tai') vungNghichLy.add(l.denId);
    }
  }

  for (const id of chiCoA) {
    tranhChap.push({
      bang: 'entities',
      id,
      ten: a.entities.get(id)?.ten ?? id,
      truongKhac: [],
      chiCoO: 'a',
      deXuat: 'a',
      lyDo: 'Chỉ tồn tại ở nhánh A.',
    });
  }
  for (const id of chiCoB) {
    tranhChap.push({
      bang: 'entities',
      id,
      ten: b.entities.get(id)?.ten ?? id,
      truongKhac: [],
      chiCoO: 'b',
      deXuat: 'b',
      lyDo: 'Chỉ tồn tại ở nhánh B.',
    });
  }

  const giaThucTai = tuning.thucTai.hopNhanh;
  return {
    nhanhA: a.world.branchId,
    nhanhB: b.world.branchId,
    chungId: chung,
    tranhChap,
    chiCoA,
    chiCoB,
    vungNghichLy: [...vungNghichLy].sort(),
    giaThucTai,
    tomTat:
      `Hợp ${a.world.branchId} với ${b.world.branchId}: ` +
      `${chung.length} thực thể có ở cả hai · ${chiCoA.length} chỉ ở A · ${chiCoB.length} chỉ ở B · ` +
      `${tranhChap.filter((t) => t.chiCoO === null).length} tranh chấp thật · ` +
      `realityIntegrity ${giaThucTai} · ${vungNghichLy.size} vùng thành Nghịch Lý`,
  };
}

export type QuyetDinhGop = Readonly<Record<string, Ben>>;

export type KetQuaGopNhanh =
  | { readonly ok: true; readonly patches: readonly PatchOp[]; readonly kyUcHaiBan: readonly KyUcHaiBan[] }
  | { readonly ok: false; readonly chuaQuyetDinh: readonly string[] };

/** NPC nhớ hai phiên bản quá khứ — 26.3. */
export type KyUcHaiBan = {
  readonly entityId: string;
  readonly banA: string;
  readonly banB: string;
};

/**
 * Sinh patch hợp nhánh sau khi người chơi đã quyết định từng tranh chấp.
 *
 * [BB] Mọi tranh chấp THẬT phải có quyết định. Thiếu một cái là dừng — trả về
 * danh sách còn thiếu chứ không dùng `deXuat` thay người chơi.
 */
export function gopNhanh(input: {
  readonly a: WorldState;
  readonly b: WorldState;
  readonly baoCao: BaoCaoGopNhanh;
  readonly quyetDinh: QuyetDinhGop;
  readonly nhanhDich: string;
  readonly eventId: string;
  readonly tuning: Tuning;
}): KetQuaGopNhanh {
  const thatSu = input.baoCao.tranhChap.filter((t) => t.chiCoO === null);
  const thieu = thatSu.filter((t) => input.quyetDinh[t.id] === undefined).map((t) => t.id);
  if (thieu.length > 0) return { ok: false, chuaQuyetDinh: thieu };

  const patches: PatchOp[] = [];
  const kyUc: KyUcHaiBan[] = [];

  const them = (op: PatchOp['op'], table: string, id: string, value?: unknown, path = ''): void => {
    patches.push({ op, target: { table, id, path }, value, sourceEventId: input.eventId });
  };

  for (const t of input.baoCao.tranhChap) {
    const chon = t.chiCoO ?? (input.quyetDinh[t.id] as Ben);
    const ea = input.a.entities.get(t.id);
    const eb = input.b.entities.get(t.id);

    /**
     * Mọi bản ghi vào nhánh đích bằng `link`, không bằng `set`.
     *
     * Hợp nhánh tạo ra một nhánh MỚI: ở đó chưa có bản ghi nào để mà sửa. Dùng
     * `set` sẽ trả `BAN_GHI_THIEU` cho từng thực thể, và lỗi ấy chỉ lộ ra khi
     * người chơi thật sự bấm hợp — tức là ở đúng chỗ tệ nhất.
     */
    if (chon === 'a' && ea !== undefined) {
      them('link', 'entities', t.id, { ...ea, branchId: input.nhanhDich });
      continue;
    }
    if (chon === 'b' && eb !== undefined) {
      them('link', 'entities', t.id, { ...eb, branchId: input.nhanhDich });
      continue;
    }
    if (chon === 'ca_hai' && ea !== undefined && eb !== undefined) {
      /**
       * Giữ bản A làm bản chính và **ghi nhớ bản B** thay vì trộn trường.
       *
       * Trộn hai bản khác nhau ở tám trường cho ra một thực thể chưa từng tồn tại
       * ở nhánh nào — thứ mà thanh tra mạch lạc sẽ không truy được về đâu cả.
       */
      them('link', 'entities', t.id, { ...ea, branchId: input.nhanhDich });
      kyUc.push({
        entityId: t.id,
        banA: bam(chuanHoa(ea)),
        banB: bam(chuanHoa(eb)),
      });
    }
  }

  // Link: giữ mọi cạnh của cả hai bên; cạnh trùng id thì giữ bản của A.
  const daCo = new Set<string>();
  for (const l of [...input.a.links.values()].sort((x, y) => (x.id < y.id ? -1 : 1))) {
    daCo.add(l.id);
    them('link', 'links', l.id, { ...l, branchId: input.nhanhDich } satisfies Link);
  }
  for (const l of [...input.b.links.values()].sort((x, y) => (x.id < y.id ? -1 : 1))) {
    if (daCo.has(l.id)) continue;
    them('link', 'links', l.id, { ...l, branchId: input.nhanhDich } satisfies Link);
  }

  // Cái giá: realityIntegrity tụt, và nó tụt NGAY, không tụt dần.
  them('add', 'metrics', 'metrics', input.tuning.thucTai.hopNhanh, 'realityIntegrity');

  return { ok: true, patches, kyUcHaiBan: kyUc };
}
