/**
 * Phân thân — Phần 12.3, 69.1.
 *
 * ── Điều còn thiếu sau Phase 6 ──
 *
 * `dapDiHoa(..., 'phan_than')` đã ghi `divisible.doPhanKy` và kể một câu rất hay
 * về việc "tách làm hai". Nhưng không có ai tách cả: thế giới vẫn đúng một entity.
 * Nghĩa là lựa chọn tốn kém nhất trong bốn cách đáp Dị Hóa lại là lựa chọn không
 * để lại dấu vết nào — và người chơi phát hiện ra điều đó ngay lần thứ hai.
 *
 * File này làm cho nó thật:
 *
 *   bản thể gốc   giữ `coreSelf` — con người thật, và cái giá là mất tín đồ
 *   bản thể mới   nhận `followerImage` làm lõi của chính nó — được thờ, và
 *                 không bao giờ hết là một bản sao của điều người ta tưởng
 *
 * [BB] Bản thể mới là một entity `deity` đầy đủ. Nó có bản ngã riêng, nên nó
 * **trôi tiếp** theo hướng riêng của nó: hai trăm năm sau, hai bản thể có thể
 * không còn nhận ra nhau. `doPhanKy` đo đúng khoảng cách ấy.
 */
import type { WorldState } from '../engine/state.js';
import type { PatchOp } from '../contracts/core.js';
import type { Entity } from '../schema/entity.js';
import { EntitySchema, LinkSchema } from '../schema/entity.js';
import { SoulSchema } from '../schema/aspect/soul.js';
import { DomainSchema, VenerableSchema, DivisibleSchema } from '../schema/aspect/divine.js';
import type { Divisible, Venerable, Domain } from '../schema/aspect/divine.js';
import { DivineIdentitySchema, khoangCachBanTinh, hinhHienTai } from '../schema/aspect/thanVi.js';
import type { DivineIdentity } from '../schema/aspect/thanVi.js';
import { dat, hong, loi } from '../contracts/errors.js';
import type { KetQua } from '../contracts/errors.js';

function docAspect<T>(e: Entity, ten: string): T | undefined {
  const a = e.aspects[ten];
  return a === undefined || a === null ? undefined : (a as T);
}

const set = (id: string, path: string, value: unknown, evId: string): PatchOp => ({
  op: 'set',
  target: { table: 'entities', id, path },
  value,
  sourceEventId: evId,
});

export type KetQuaPhanThan = {
  readonly patches: readonly PatchOp[];
  readonly phanThanId: string;
  readonly loiKe: string;
};

/**
 * Tách một vị thần làm hai.
 *
 * Tín đồ đi theo **hình ảnh**, không theo sự thật — nên phần lớn tín đồ và toàn
 * bộ mật độ đền chuyển sang bản thể mới. Đó là cái giá thật của việc giữ lấy
 * chính mình, và nó phải đau thì lựa chọn mới có nghĩa.
 */
export function tachPhanThan(
  state: WorldState,
  thanId: string,
  nc: { eventId: string; tick: number; tenPhanThan?: string },
): KetQua<KetQuaPhanThan> {
  const than = state.entities.get(thanId);
  if (!than || than.kind !== 'deity' || than.tickDiet !== null) {
    return hong([loi('intent', 'KHONG_PHAI_THAN', 'Chỉ một vị thần đang tồn tại mới phân thân được.')]);
  }
  const bn = docAspect<DivineIdentity>(than, 'ban_nga');
  if (!bn) {
    return hong([
      loi('intent', 'CHUA_CO_BAN_NGA', 'Vị thần này chưa có bản ngã bốn lớp, nên chưa có gì để tách.'),
    ]);
  }

  const chia = docAspect<Divisible>(than, 'divisible');
  if ((chia?.phanThanIds.length ?? 0) >= 3) {
    return hong([
      loi('intent', 'QUA_NHIEU_PHAN_THAN', 'Ba phân thân là hết. Chia thêm nữa thì không còn ai là gốc.', {
        recoverable: true,
      }),
    ]);
  }

  const ven = docAspect<Venerable>(than, 'venerable');
  const dom = docAspect<Domain>(than, 'domain');
  const b = state.world.branchId;
  /*
   * Số thứ tự, không chỉ tick.
   *
   * Tách hai lần trong CÙNG một nhịp là chuyện bình thường — thần nghĩ theo nhịp
   * `nien`, và một cuộc khủng hoảng danh tính không xếp hàng theo mùa. Đặt id
   * bằng `${thanId}_${tick}` thì lần thứ hai va vào lần thứ nhất và cả lô patch
   * bị `LINK_TRUNG` từ chối — nghĩa là lựa chọn tốn kém nhất của tầng Thần lại
   * im lặng không làm gì. Tìm ra khi viết test cho chính nó.
   */
  const soCu = chia?.phanThanIds.length ?? 0;
  const ptId = `deity_pt_${thanId}_${nc.tick}_${soCu + 1}`;
  const ten = nc.tenPhanThan?.trim() || `${than.ten} (theo lời người ta kể)`;

  // Bản ngã của bản thể mới: hình ảnh tín đồ TRỞ THÀNH lõi của nó. Đây là toàn
  // bộ bi kịch của phân thân, viết bằng một phép gán.
  const bnMoi = DivineIdentitySchema.parse({
    coreSelf: { ...bn.followerImage },
    followerImage: { ...bn.followerImage },
    officialDoctrine: [...bn.officialDoctrine],
    currentManifestation: { ...bn.followerImage },
    pressure: { distortion: 0, suppressedTraits: [], demandedTraits: [], tinhHuongMo: [] },
    lichSuLoi: [],
  });

  // Tín đồ theo hình ảnh: bản thể mới lấy phần lớn, gốc giữ lại số ít trung thành.
  const tinDoTong = ven?.soTinDoUocLuong ?? 0;
  const tinDoMoi = Math.round(tinDoTong * 0.8);
  const tinDoGoc = tinDoTong - tinDoMoi;

  const phanThan = EntitySchema.parse({
    id: ptId,
    branchId: b,
    kind: 'deity',
    ten,
    moTa: `Bản thể sinh ra từ điều tín đồ tin về ${than.ten}.`,
    tickSinh: nc.tick,
    aspects: {
      soul: SoulSchema.parse({ tang: 't3', banTinh: { ...bn.followerImage } }),
      ban_nga: bnMoi,
      // Domain đi theo người được thờ, nhưng yếu hơn: quy kết vừa bị chia đôi.
      domain: DomainSchema.parse({
        domains: (dom?.domains ?? []).map((d) => ({ ...d, suc: Math.round(d.suc * 0.5) })),
        khaiNiemGocId: dom?.khaiNiemGocId ?? null,
        laKhoiNguyen: false,
        thanHeId: dom?.thanHeId ?? null,
      }),
      venerable: VenerableSchema.parse({
        soTinDoUocLuong: tinDoMoi,
        matDoDen: { ...(ven?.matDoDen ?? {}) },
        hienThanh: ven?.hienThanh ?? 20,
        banTinhTinDoTin: { ...bn.followerImage },
        doLechDiHoa: 0,
      }),
      divisible: DivisibleSchema.parse({
        banTheGocId: thanId,
        phanThanIds: [],
        doPhanKy: 0,
        nguongHopNhat: chia?.nguongHopNhat ?? 60,
        thamQuyenDuocChia: [...(chia?.thamQuyenDuocChia ?? [])],
      }),
    },
  });

  const patches: PatchOp[] = [
    {
      op: 'link',
      target: { table: 'entities', id: ptId, path: '' },
      value: phanThan,
      sourceEventId: nc.eventId,
    },
  ];

  for (const [id, tuId, denId, qh] of [
    [`lk_pt_${ptId}_goc`, ptId, thanId, 'phan_than_cua'],
    [`lk_pt_goc_${ptId}`, thanId, ptId, 'co_phan_than'],
  ] as const) {
    patches.push({
      op: 'link',
      target: { table: 'links', id, path: '' },
      value: LinkSchema.parse({ id, branchId: b, tuId, denId, quanHe: qh, trongSo: 100, tickTao: nc.tick }),
      sourceEventId: nc.eventId,
    });
  }

  // ── bản thể gốc: giữ lõi, mất người ──
  /*
   * Ghi CẢ aspect `divisible`, không ghi từng trường.
   *
   * Vị thần hạt giống chưa chắc đã có aspect này; `set` vào
   * `aspects.divisible.phanThanIds` khi đó tạo ra một object chỉ có đúng một
   * khóa, thiếu `nguongHopNhat`. Hệ quả: `hopNhatDuoc()` so `khoảng cách < undefined`
   * → luôn `false`, tức hai bản thể **không bao giờ hợp lại được** dù đứng sát
   * nhau. Sai âm thầm, và chỉ lộ ra khi có người viết test cho đúng nó.
   */
  patches.push(
    set(
      thanId,
      'aspects.divisible',
      DivisibleSchema.parse({
        banTheGocId: chia?.banTheGocId ?? null,
        phanThanIds: [...(chia?.phanThanIds ?? []), ptId],
        doPhanKy: 0,
        nguongHopNhat: chia?.nguongHopNhat ?? 60,
        thamQuyenDuocChia: [...(chia?.thamQuyenDuocChia ?? [])],
      }),
      nc.eventId,
    ),
    set(thanId, 'aspects.venerable.soTinDoUocLuong', tinDoGoc, nc.eventId),
    // Đền theo hình ảnh, nên gốc mất hết mật độ đền. Không ai xây đền cho sự thật.
    set(thanId, 'aspects.venerable.matDoDen', {}, nc.eventId),
    // Áp lực Dị Hóa tan: hình ảnh đã có chỗ khác để ở.
    set(thanId, 'aspects.ban_nga.followerImage', { ...bn.coreSelf }, nc.eventId),
    set(
      thanId,
      'aspects.ban_nga.currentManifestation',
      hinhHienTai(bn.coreSelf, bn.coreSelf, ven?.hienThanh ?? 20),
      nc.eventId,
    ),
    set(thanId, 'aspects.ban_nga.pressure.distortion', 0, nc.eventId),
    set(thanId, 'aspects.ban_nga.pressure.suppressedTraits', [], nc.eventId),
    set(thanId, 'aspects.ban_nga.pressure.demandedTraits', [], nc.eventId),
  );

  return dat({
    patches,
    phanThanId: ptId,
    loiKe:
      `${than.ten} tách làm hai. "${ten}" bước ra mang đúng khuôn mặt mà ${tinDoMoi} người đã dựng nên, ` +
      `và người ta đi theo bản ấy. ${than.ten} còn lại ${tinDoGoc} người, một cái tên, và sự thật.`,
  });
}

/**
 * Phân kỳ — bước 9 của tick (24.1).
 *
 * Hai bản thể sống hai đời khác nhau thì lõi trôi xa nhau. `doPhanKy` là khoảng
 * cách đo được, không phải một bộ đếm tăng theo thời gian: hai bản thể sống giống
 * nhau thì không phân kỳ, dù đã tách từ nghìn năm trước.
 */
export function doPhanKy(state: WorldState, thanId: string, evId: string): PatchOp[] {
  const goc = state.entities.get(thanId);
  const chia = goc ? docAspect<Divisible>(goc, 'divisible') : undefined;
  const bnGoc = goc ? docAspect<DivineIdentity>(goc, 'ban_nga') : undefined;
  if (!goc || !chia || !bnGoc || chia.phanThanIds.length === 0) return [];

  const ra: PatchOp[] = [];
  let xaNhat = 0;
  for (const ptId of [...chia.phanThanIds].sort()) {
    const pt = state.entities.get(ptId);
    const bnPt = pt ? docAspect<DivineIdentity>(pt, 'ban_nga') : undefined;
    if (!pt || !bnPt || pt.tickDiet !== null) continue;
    const d = khoangCachBanTinh(bnGoc.coreSelf, bnPt.coreSelf);
    if (d > xaNhat) xaNhat = d;
    ra.push(set(ptId, 'aspects.divisible.doPhanKy', Math.round(d), evId));
  }
  if (ra.length > 0) ra.push(set(thanId, 'aspects.divisible.doPhanKy', Math.round(xaNhat), evId));
  return ra;
}

/** Hai bản thể còn gần nhau đủ để hợp lại không — 12.3. */
export function hopNhatDuoc(state: WorldState, gocId: string, ptId: string): boolean {
  const goc = state.entities.get(gocId);
  const pt = state.entities.get(ptId);
  const chia = goc ? docAspect<Divisible>(goc, 'divisible') : undefined;
  const bnGoc = goc ? docAspect<DivineIdentity>(goc, 'ban_nga') : undefined;
  const bnPt = pt ? docAspect<DivineIdentity>(pt, 'ban_nga') : undefined;
  if (!goc || !pt || !chia || !bnGoc || !bnPt) return false;
  return khoangCachBanTinh(bnGoc.coreSelf, bnPt.coreSelf) < chia.nguongHopNhat;
}
