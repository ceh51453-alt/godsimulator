/**
 * Đối thoại — Phần 70.4 [BB]: "Đối thoại cũng là hành động".
 *
 * ── Câu quyết định của cả file ──
 *
 * > "Narrator không được tạo cuộc đối thoại không sinh Event khi lời nói là lời
 * > hứa, đe dọa, thú nhận, giao kèo, tin mới hoặc mệnh lệnh có hậu quả."
 *
 * Nghĩa là đối thoại **không thể** chỉ là văn. Sáu loại phát ngôn ở trên phải để
 * lại dấu trong thế giới, và dấu ấy là `Event` + `KnowledgeRecord` + quan hệ đổi.
 * Nếu không, người chơi hứa xong rồi quên, NPC nghe xong rồi không nhớ, và mọi
 * cuộc nói chuyện đều miễn phí.
 *
 * ── Sáu trường của một phát ngôn ──
 *
 * 70.4 liệt kê tám thứ. Bốn cái quan trọng nhất và dễ bỏ sót nhất:
 *
 *   dieuNguoiNoiTin     điều người nói TIN là thật
 *   dieuMuonNguoiNgheTin điều họ muốn người kia tin
 *   → hai cái này khác nhau chính là **nói dối**, và nói dối phải là dữ liệu
 *     chứ không phải một cái cờ `laNoiDoi: true`.
 *   mucHieu             người nghe hiểu tới đâu (ngôn ngữ, chuyên môn, tuổi)
 *   coTheBiNgheLen      ai đứng gần — bí mật rò ra ở đây, không do Narrator quyết
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import { KnowledgeRowSchema, khoaTriThuc } from '../schema/soSach.js';
import { ObligationSchema } from '../contracts/primitives.js';
import { dat, hong, loi } from '../contracts/errors.js';
import type { KetQua } from '../contracts/errors.js';
import type { Rng } from '../engine/rng.js';
import { datQuanHe } from './quanHe.js';

/**
 * Sáu loại phát ngôn CÓ HẬU QUẢ của 70.4. Danh sách này đóng: mở rộng nó là mở
 * rộng thứ engine phải ghi sổ, và điều đó cần một quyết định, không cần một dòng.
 */
export const LOAI_PHAT_NGON = ['loi_hua', 'de_doa', 'thu_nhan', 'giao_keo', 'tin_moi', 'menh_lenh'] as const;
export type LoaiPhatNgon = (typeof LOAI_PHAT_NGON)[number];

export const NHAN_PHAT_NGON: Readonly<Record<LoaiPhatNgon, string>> = Object.freeze({
  loi_hua: 'lời hứa',
  de_doa: 'lời đe dọa',
  thu_nhan: 'lời thú nhận',
  giao_keo: 'giao kèo',
  tin_moi: 'tin mới',
  menh_lenh: 'mệnh lệnh',
});

export type PhatNgon = {
  readonly nguoiNoiId: string;
  readonly nguoiNgheId: string;
  readonly loai: LoaiPhatNgon;
  readonly noiDung: string;
  /** Điều người nói tin là thật. */
  readonly dieuNguoiNoiTin: string;
  /** Điều họ muốn người nghe tin. Khác dòng trên nghĩa là đang nói dối. */
  readonly dieuMuonNguoiNgheTin: string;
  /** Nơi nói — quyết định ai nghe lỏm được. */
  readonly noiId: string | null;
};

const set = (id: string, path: string, value: unknown, evId: string): PatchOp => ({
  op: 'set',
  target: { table: 'entities', id, path },
  value,
  sourceEventId: evId,
});

export type NgocCanhDoiThoai = {
  readonly eventId: string;
  readonly tick: number;
  readonly rng: Rng;
};

function docAspect<T>(e: Entity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a && typeof a === 'object' ? (a as T) : undefined;
}

/** Vùng cư trú, theo link `cu_tru_tai` còn hiệu lực. */
function vungCua(state: WorldState, id: string): string | null {
  for (const lk of state.links.values()) {
    if (lk.tickDut !== null || lk.quanHe !== 'cu_tru_tai' || lk.tuId !== id) continue;
    return lk.denId;
  }
  return null;
}

/**
 * Người nghe hiểu tới đâu.
 *
 * Ba nguồn: cùng vùng (cùng tiếng nói), tuổi (trẻ con không hiểu giao kèo), và
 * chuyên môn (`kyNang` của nghề liên quan). Không có "mức hiểu" mặc định 100% —
 * đó là cách hiểu lầm biến mất khỏi trò chơi.
 */
export function mucHieu(state: WorldState, phatNgon: PhatNgon): number {
  const nghe = state.entities.get(phatNgon.nguoiNgheId);
  const noi = state.entities.get(phatNgon.nguoiNoiId);
  if (!nghe || !noi) return 0;

  let m = 0.85;
  const vNghe = vungCua(state, phatNgon.nguoiNgheId);
  const vNoi = vungCua(state, phatNgon.nguoiNoiId);
  // Khác vùng thì khác cách nói. Không phải rào ngôn ngữ tuyệt đối, nhưng có thật.
  if (vNghe !== null && vNoi !== null && vNghe !== vNoi) m -= 0.2;

  const mNghe = docAspect<{ ageBand?: string }>(nghe, 'mortal');
  if (mNghe?.ageBand === 'child') m -= 0.35;
  if (mNghe?.ageBand === 'elder') m -= 0.05;

  if (phatNgon.loai === 'giao_keo') {
    const kn = docAspect<{ kyNang?: Record<string, number> }>(nghe, 'mortal')?.kyNang ?? {};
    const gioi = Math.max(0, ...Object.values(kn));
    m += (gioi / 100) * 0.15 - 0.1;
  }
  return Math.max(0, Math.min(1, Math.round(m * 100) / 100));
}

/**
 * Ai nghe lỏm được — [BB] 70.4 "rủi ro bị nghe lén".
 *
 * Suy từ **ai đang ở cùng chỗ**, không từ một tung xúc xắc "bị lộ hay không".
 * Nói bí mật giữa chợ thì lộ, và người chơi biết trước điều đó vì họ chọn chỗ.
 */
export function nguoiNgheLon(state: WorldState, phatNgon: PhatNgon): readonly string[] {
  const noiId = phatNgon.noiId ?? vungCua(state, phatNgon.nguoiNoiId);
  if (noiId === null) return [];

  const ra: string[] = [];
  for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    if (id === phatNgon.nguoiNoiId || id === phatNgon.nguoiNgheId) continue;
    const e = state.entities.get(id);
    if (!e || e.kind !== 'mortal' || e.tickDiet !== null) continue;
    if (vungCua(state, id) === noiId) ra.push(id);
  }
  return Object.freeze(ra);
}

export type KetQuaNoi = {
  readonly patches: readonly PatchOp[];
  readonly factId: string;
  readonly mucHieu: number;
  readonly nguoiNgheLon: readonly string[];
  readonly laNoiDoi: boolean;
  readonly loiKe: string;
};

/**
 * Nói một câu có hậu quả.
 *
 * Ba thứ sinh ra, mỗi thứ đúng một lần:
 *
 *   1. `KnowledgeRow` cho người nghe — với `hops = 1` và nguồn là người nói,
 *      nên bất biến "không tri thức teleport" (71.4) truy được ngược.
 *   2. Quan hệ đổi, ghi bằng `anTuong` (câu chữ) chứ không chỉ bằng bốn trục —
 *      đó là thứ Sổ Tay đọc ra (56.2 quy tắc 4).
 *   3. Với `loi_hua` và `giao_keo`: một `Obligation` trên người hứa. Hứa xong
 *      quên là chuyện của người, không phải chuyện của engine.
 */
export function noi(state: WorldState, pn: PhatNgon, nc: NgocCanhDoiThoai): KetQua<KetQuaNoi> {
  const noiNguoi = state.entities.get(pn.nguoiNoiId);
  const ngheNguoi = state.entities.get(pn.nguoiNgheId);
  if (!noiNguoi || !ngheNguoi) {
    return hong([loi('intent', 'KHONG_THAY_NGUOI', 'Không tìm thấy người đối thoại.')]);
  }
  if (noiNguoi.tickDiet !== null || ngheNguoi.tickDiet !== null) {
    return hong([loi('intent', 'NGUOI_DA_CHET', 'Người chết không nói chuyện được.')]);
  }
  if (pn.nguoiNoiId === pn.nguoiNgheId) {
    return hong([loi('intent', 'TU_NOI_VOI_MINH', 'Nói với chính mình không sinh ra tri thức mới.')]);
  }

  const hieu = mucHieu(state, pn);
  const laNoiDoi = pn.dieuNguoiNoiTin.trim() !== pn.dieuMuonNguoiNgheTin.trim();
  const factId = `fact_${nc.tick}_${pn.nguoiNoiId}_${pn.loai}`;
  const patches: PatchOp[] = [];

  // ── 1a. điều NGƯỜI NÓI tin ──
  //
  // [BB] 71.4 "không tri thức teleport": mỗi dòng phải truy được về một người
  // đã biết trước. Bỏ bước này thì người nghe có một dòng khai nguồn là người
  // nói, trong khi người nói không hề biết mệnh đề ấy — và bất biến bắt được
  // ngay trong bài playtest đầu tiên.
  //
  // Ghi ở đây cũng làm nói dối thành dữ liệu ĐẦY ĐỦ: bên nói giữ `dieuNguoiNoiTin`,
  // bên nghe giữ `dieuMuonNguoiNgheTin`, và hai dòng ấy cùng một `factId`.
  const khoaNoi = khoaTriThuc(pn.nguoiNoiId, factId);
  patches.push({
    op: 'link',
    target: { table: 'knowledge', id: khoaNoi, path: '' },
    value: KnowledgeRowSchema.parse({
      id: khoaNoi,
      branchId: state.world.branchId,
      factId,
      knowerId: pn.nguoiNoiId,
      proposition: pn.dieuNguoiNoiTin,
      objectRefs: [{ id: pn.nguoiNgheId }],
      // Chính mình nghĩ ra thì không có chặng nào cả.
      source: { type: 'witness', sourceId: null, hops: 0 },
      confidence: 0.95,
      distortion: {},
      learnedAtTick: nc.tick,
      lastConfirmedAtTick: nc.tick,
      contradictedBy: [],
      duongIds: [],
    }),
    sourceEventId: nc.eventId,
  });

  // ── 1b. tri thức truyền đi ──
  // Người nghe nhận điều người nói MUỐN họ tin, không phải sự thật. Đây là chỗ
  // nói dối trở thành dữ liệu thay vì một cái cờ.
  const khoa = khoaTriThuc(pn.nguoiNgheId, factId);
  patches.push({
    op: 'link',
    target: { table: 'knowledge', id: khoa, path: '' },
    value: KnowledgeRowSchema.parse({
      id: khoa,
      branchId: state.world.branchId,
      factId,
      knowerId: pn.nguoiNgheId,
      proposition: pn.dieuMuonNguoiNgheTin,
      objectRefs: [{ id: pn.nguoiNoiId }],
      source: { type: 'told', sourceId: pn.nguoiNoiId, hops: 1 },
      confidence: Math.round(hieu * 0.9 * 100) / 100,
      distortion: hieu < 0.6 ? { nghe_khong_ro: true } : {},
      learnedAtTick: nc.tick,
      lastConfirmedAtTick: null,
      contradictedBy: [],
      duongIds: [],
    }),
    sourceEventId: nc.eventId,
  });

  // ── 2. quan hệ đổi ──
  // Chỉ đổi phía NGƯỜI NGHE: điều họ nghĩ về người nói. Người nói nghĩ gì là
  // chuyện của người nói, và [BB] 11.2 cấm đồng bộ hai bên.
  patches.push(
    ...datQuanHe(
      state,
      pn.nguoiNgheId,
      pn.nguoiNoiId,
      {
        anTuong: cauAnTuong(pn.loai, laNoiDoi, hieu),
        cong: {
          tinNgo: pn.loai === 'de_doa' ? -12 : pn.loai === 'thu_nhan' ? 9 : laNoiDoi ? -3 : 4,
          thanSo: pn.loai === 'thu_nhan' ? 6 : pn.loai === 'de_doa' ? -8 : 1,
        },
        themKyUcId: factId,
      },
      nc.eventId,
    ),
  );

  // ── 3. lời hứa để lại nghĩa vụ ──
  if (pn.loai === 'loi_hua' || pn.loai === 'giao_keo') {
    patches.push({
      op: 'push',
      target: { table: 'entities', id: pn.nguoiNoiId, path: 'aspects.mortal.boiVu' },
      value: ObligationSchema.parse({
        id: `bv_${nc.tick}_${pn.nguoiNgheId}`,
        toId: pn.nguoiNgheId,
        description: pn.noiDung.slice(0, 200),
        cadence: '',
        priority: pn.loai === 'giao_keo' ? 60 : 40,
        status: 'active',
      }),
      sourceEventId: nc.eventId,
    });
  }

  // ── 4. nghe lỏm ──
  // Chỉ tin đủ lớn mới lan: không ai đi kể lại một lời chào.
  const lon = pn.loai === 'thu_nhan' || pn.loai === 'giao_keo' || pn.loai === 'de_doa';
  const nghelon = lon ? nguoiNgheLon(state, pn).slice(0, 3) : [];
  for (const id of nghelon) {
    if (!nc.rng.co(0.35)) continue;
    const k2 = khoaTriThuc(id, factId);
    patches.push({
      op: 'link',
      target: { table: 'knowledge', id: k2, path: '' },
      value: KnowledgeRowSchema.parse({
        id: k2,
        branchId: state.world.branchId,
        factId,
        knowerId: id,
        proposition: pn.dieuMuonNguoiNgheTin,
        objectRefs: [{ id: pn.nguoiNoiId }],
        // Nghe lỏm là `rumor` với hai chặng — nó phải khác nghe trực tiếp.
        source: { type: 'rumor', sourceId: pn.nguoiNoiId, hops: 2 },
        confidence: Math.round(hieu * 0.5 * 100) / 100,
        distortion: { nghe_lom: true },
        learnedAtTick: nc.tick,
        lastConfirmedAtTick: null,
        contradictedBy: [],
        duongIds: [],
      }),
      sourceEventId: nc.eventId,
    });
  }

  return dat({
    patches,
    factId,
    mucHieu: hieu,
    nguoiNgheLon: nghelon,
    laNoiDoi,
    loiKe: cauKeDoiThoai(noiNguoi.ten, ngheNguoi.ten, pn.loai, hieu, nghelon.length),
  });
}

function cauAnTuong(loai: LoaiPhatNgon, laNoiDoi: boolean, hieu: number): string {
  if (hieu < 0.5) return 'Ta không rõ người ấy định nói gì.';
  if (loai === 'de_doa') return 'Người ấy đã dọa ta một lần.';
  if (loai === 'thu_nhan') return 'Người ấy kể ta nghe một chuyện họ giấu người khác.';
  if (loai === 'loi_hua') return 'Người ấy hứa với ta một điều.';
  if (loai === 'giao_keo') return 'Ta và người ấy có giao kèo.';
  if (laNoiDoi) return 'Có gì đó trong lời người ấy không khớp.';
  return 'Người ấy có nói với ta một chuyện.';
}

function cauKeDoiThoai(
  tenNoi: string,
  tenNghe: string,
  loai: LoaiPhatNgon,
  hieu: number,
  soNgheLon: number,
): string {
  const goc = `${tenNoi} nói với ${tenNghe} một ${NHAN_PHAT_NGON[loai]}.`;
  const khongRo = hieu < 0.5 ? ` ${tenNghe} không nắm hết được ý.` : '';
  const lom = soNgheLon > 0 ? ` Có ${soNgheLon} người đứng đủ gần để nghe.` : '';
  return `${goc}${khongRo}${lom}`;
}

/**
 * Giữ hay phá một lời hứa.
 *
 * Phá lời hứa KHÔNG xóa nghĩa vụ — nó đổi `status` thành `broken` và để lại đó.
 * Đây là cùng một lẽ với "link không xóa cứng, để lại sẹo" (6.3 quy tắc 4): thứ
 * người ta nhớ về bạn là những lời bạn đã không giữ.
 */
export function xuLyLoiHua(
  state: WorldState,
  nguoiHuaId: string,
  boiVuId: string,
  giu: boolean,
  nc: NgocCanhDoiThoai,
): KetQua<{ patches: readonly PatchOp[]; loiKe: string }> {
  const e = state.entities.get(nguoiHuaId);
  const m = docAspect<{ boiVu?: { id: string; toId: string | null; description: string }[] }>(e, 'mortal');
  const i = (m?.boiVu ?? []).findIndex((b) => b.id === boiVuId);
  const bv = i >= 0 ? m?.boiVu?.[i] : undefined;
  if (!e || !bv || i < 0) {
    return hong([loi('intent', 'KHONG_CO_BOI_VU', 'Không có lời hứa nào như vậy.')]);
  }

  const patches: PatchOp[] = [
    set(nguoiHuaId, `aspects.mortal.boiVu.${i}.status`, giu ? 'fulfilled' : 'broken', nc.eventId),
  ];
  if (bv.toId) {
    patches.push(
      ...datQuanHe(
        state,
        bv.toId,
        nguoiHuaId,
        {
          anTuong: giu ? 'Người ấy giữ lời.' : 'Người ấy hứa rồi không làm.',
          cong: { tinNgo: giu ? 18 : -26, yeuGhet: giu ? 8 : -14 },
        },
        nc.eventId,
      ),
    );
  }
  if (!giu) {
    patches.push({
      op: 'push',
      target: { table: 'entities', id: nguoiHuaId, path: 'aspects.can_cuoc.tiengTam' },
      value: `Đã phá một lời hứa: ${bv.description}`,
      sourceEventId: nc.eventId,
    });
  }

  return dat({
    patches,
    loiKe: giu ? `${e.ten} giữ lời.` : `${e.ten} không giữ lời, và có người nhớ điều đó.`,
  });
}
