/**
 * Hóa thân — Phần 19.4 [BB].
 *
 * ── Điều khiến hóa thân đáng giá ──
 *
 * Một vị thần đi lại giữa loài người mà vẫn thấy hết, biết hết, làm được hết thì
 * không phải hóa thân — đó là du lịch. Cái giá thật là **quên**: `mucQuen` cao
 * nghĩa là phần thần ngủ sâu, và trong lúc đó `chieu()` hạ xuống mức phàm nhân
 * (xem `project/chieu.ts`). Vị thần ấy không đọc được luật, không thấy lãnh địa,
 * và phải sống bằng đúng thứ người trong thân xác ấy biết.
 *
 * Đó cũng là lý do `dieuKienThucTinh` là một CHUỖI chứ không phải một cờ: nó là
 * một điều kiện của thế giới — "khi thấy máu trên bậc đền" — và ai đó phải làm
 * cho nó xảy ra.
 */
import type { WorldState } from '../engine/state.js';
import type { PatchOp } from '../contracts/core.js';
import type { Entity } from '../schema/entity.js';
import { AvatarSchema } from '../schema/aspect/divine.js';
import type { Avatar } from '../schema/aspect/divine.js';
import { EntitySchema, LinkSchema } from '../schema/entity.js';
import { MortalSchema } from '../schema/aspect/living.js';
import { SoulSchema } from '../schema/aspect/soul.js';
import { BlockReasonSchema } from '../contracts/primitives.js';
import type { BlockReason } from '../contracts/primitives.js';
import { dat, hong, loi } from '../contracts/errors.js';
import type { KetQua } from '../contracts/errors.js';

export type YeuCauHoaThan = {
  readonly thanId: string;
  /** Thân xác có sẵn để nhập; `null` thì engine dựng một người mới ở `vungId`. */
  readonly thanTheId: string | null;
  readonly vungId: string | null;
  readonly ten: string;
  /** 0 = nhớ hết (nguy hiểm cho thế giới), 100 = quên sạch (nguy hiểm cho mình). */
  readonly mucQuen: number;
  readonly dieuKienThucTinh: string;
  readonly neuChet: Avatar['neuChet'];
};

export type KetQuaHoaThan = {
  readonly patches: readonly PatchOp[];
  readonly thanTheId: string;
  readonly loiKe: string;
};

const chan = (code: string, message: string): BlockReason => BlockReasonSchema.parse({ code, message });

function docAspect<T>(e: Entity, ten: string): T | undefined {
  const a = e.aspects[ten];
  return a === undefined || a === null ? undefined : (a as T);
}

/**
 * Vì sao chưa hạ phàm được.
 *
 * [BB] 19.4 — quyền năng còn lại phải NHỎ. Một vị thần giữ 90% sức mạnh trong
 * thân xác người không phải là hóa thân, đó là một con quái vật đội lốt, và nó
 * làm hỏng mọi tình huống mà cơ chế này sinh ra để tạo.
 */
export function kiemHoaThan(state: WorldState, yc: YeuCauHoaThan): BlockReason[] {
  const ra: BlockReason[] = [];
  const than = state.entities.get(yc.thanId);

  if (!than || than.kind !== 'deity') {
    ra.push(chan('KHONG_PHAI_THAN', 'Chỉ một vị thần mới hóa thân được.'));
    return ra;
  }
  if (docAspect<Avatar>(than, 'avatar')) {
    ra.push(
      chan('DANG_HOA_THAN', `${than.ten} đang ở trong một thân xác khác. Phải về trước khi hạ phàm lần nữa.`),
    );
  }
  if (yc.thanTheId !== null) {
    const tt = state.entities.get(yc.thanTheId);
    if (!tt) ra.push(chan('THAN_THE_LA', 'Không tìm thấy thân xác đó.'));
    else if (tt.kind !== 'mortal')
      ra.push(chan('THAN_THE_KHONG_PHAI_NGUOI', 'Chỉ nhập được vào một con người.'));
    else if (tt.tickDiet !== null) ra.push(chan('THAN_THE_DA_CHET', 'Thân xác đó đã chết.'));
  } else if (yc.vungId === null || !state.entities.has(yc.vungId)) {
    ra.push(chan('CHUA_CHON_NOI', 'Phải chọn một nơi để hạ phàm.'));
  }
  if (yc.mucQuen < 20) {
    ra.push(
      chan(
        'QUEN_QUA_IT',
        'Nhớ mình là thần thì không phải hóa thân. Mức quên phải từ 20 trở lên — đó là cái giá của việc đi giữa loài người.',
      ),
    );
  }
  return ra;
}

/**
 * Quyền năng còn lại suy từ mức quên, không do người chơi khai.
 * Quên càng sâu thì càng ít phép — và đó là toàn bộ điểm của cơ chế.
 */
function quyenNangConLai(mucQuen: number): number {
  return Math.max(0, Math.round((100 - mucQuen) * 0.12));
}

export function hoaThan(
  state: WorldState,
  yc: YeuCauHoaThan,
  nc: { eventId: string; tick: number },
): KetQua<KetQuaHoaThan> {
  const chanLai = kiemHoaThan(state, yc);
  if (chanLai.length > 0) {
    return hong(chanLai.map((c) => loi('intent', c.code, c.message, { recoverable: true })));
  }

  const than = state.entities.get(yc.thanId);
  if (!than) return hong([loi('intent', 'KHONG_PHAI_THAN', 'Không tìm thấy vị thần.')]);

  const patches: PatchOp[] = [];
  const b = state.world.branchId;
  let thanTheId = yc.thanTheId ?? '';

  // ── dựng thân xác nếu chưa có ──
  if (yc.thanTheId === null) {
    thanTheId = `mortal_hoathan_${yc.thanId}_${nc.tick}`;
    const nguoi = EntitySchema.parse({
      id: thanTheId,
      branchId: b,
      kind: 'mortal',
      ten: yc.ten.trim() === '' ? 'Người Lạ' : yc.ten.trim(),
      moTa: 'Một người không ai nhớ đã tới từ đâu.',
      tickSinh: nc.tick,
      aspects: {
        soul: SoulSchema.parse({ tang: 't2' }),
        mortal: MortalSchema.parse({ ageBand: 'adult' }),
      },
    });
    patches.push({
      op: 'link',
      target: { table: 'entities', id: thanTheId, path: '' },
      value: nguoi,
      sourceEventId: nc.eventId,
    });
    if (yc.vungId) {
      for (const [id, tuId, denId, qh] of [
        [`lk_${thanTheId}_cu_tru`, thanTheId, yc.vungId, 'cu_tru_tai'],
        [`lk_${thanTheId}_cu_tru_r`, yc.vungId, thanTheId, 'la_noi_cu_tru_cua'],
      ] as const) {
        patches.push({
          op: 'link',
          target: { table: 'links', id, path: '' },
          value: LinkSchema.parse({
            id,
            branchId: b,
            tuId,
            denId,
            quanHe: qh,
            trongSo: 90,
            tickTao: nc.tick,
          }),
          sourceEventId: nc.eventId,
        });
      }
    }
  }

  const av = AvatarSchema.parse({
    thanId: yc.thanId,
    thanTheId,
    mucQuen: yc.mucQuen,
    dieuKienThucTinh: yc.dieuKienThucTinh,
    daThucTinh: false,
    quyenNangConLai: quyenNangConLai(yc.mucQuen),
    neuChet: yc.neuChet,
    tickHaPham: nc.tick,
  });

  patches.push({
    op: 'set',
    target: { table: 'entities', id: yc.thanId, path: 'aspects.avatar' },
    value: av,
    sourceEventId: nc.eventId,
  });

  // Quan hệ hai chiều: cần nó để `chieu()` và bất biến tra được cả hai đầu.
  const lkId = `lk_hoathan_${yc.thanId}_${thanTheId}`;
  patches.push({
    op: 'link',
    target: { table: 'links', id: lkId, path: '' },
    value: LinkSchema.parse({
      id: lkId,
      branchId: b,
      tuId: yc.thanId,
      denId: thanTheId,
      quanHe: 'co_hoa_than',
      trongSo: 100,
      tickTao: nc.tick,
    }),
    sourceEventId: nc.eventId,
  });

  return dat({
    patches,
    thanTheId,
    loiKe:
      `${than.ten} bỏ lại phần lớn thứ mình là, và bước xuống trong một thân xác không ai để ý. ` +
      `Chỉ còn ${av.quyenNangConLai} phần trăm cái cũ, và ngay cả điều đó cũng sắp quên.`,
  });
}

/**
 * Thức tỉnh — điều kiện đã xảy ra, phần thần mở mắt.
 *
 * Đây là chỗ tầm nhìn quay lại: `daThucTinh = true` làm `chieu()` thôi hạ xuống
 * mức phàm nhân. Trạng thái ở giữa (đang trong thân xác nhưng đã nhớ ra) là trạng
 * thái thú vị nhất của cả cơ chế, nên nó có thật chứ không phải một bước chuyển tiếp.
 */
export function thucTinh(
  state: WorldState,
  thanId: string,
  nc: { eventId: string; tick: number; lyDo: string },
): KetQua<{ patches: readonly PatchOp[]; loiKe: string }> {
  const than = state.entities.get(thanId);
  const av = than ? docAspect<Avatar>(than, 'avatar') : undefined;
  if (!than || !av) {
    return hong([loi('intent', 'KHONG_HOA_THAN', 'Vị thần này không đang hóa thân.', { recoverable: true })]);
  }
  if (av.daThucTinh) {
    return hong([loi('intent', 'DA_THUC_TINH', 'Phần thần đã thức từ trước.', { recoverable: true })]);
  }

  return dat({
    patches: [
      {
        op: 'set',
        target: { table: 'entities', id: thanId, path: 'aspects.avatar.daThucTinh' },
        value: true,
        sourceEventId: nc.eventId,
      },
      {
        op: 'set',
        target: { table: 'entities', id: thanId, path: 'aspects.avatar.mucQuen' },
        value: 0,
        sourceEventId: nc.eventId,
      },
    ],
    loiKe: `${nc.lyDo} — và trong thân xác ấy, có thứ gì đó nhớ ra mình từng là ai.`,
  });
}

/** Về trời: bỏ hóa thân, giữ lại thân xác như một con người bình thường. */
export function veThan(
  state: WorldState,
  thanId: string,
  nc: { eventId: string; tick: number },
): KetQua<{ patches: readonly PatchOp[]; loiKe: string }> {
  const than = state.entities.get(thanId);
  const av = than ? docAspect<Avatar>(than, 'avatar') : undefined;
  if (!than || !av) {
    return hong([loi('intent', 'KHONG_HOA_THAN', 'Vị thần này không đang hóa thân.', { recoverable: true })]);
  }

  const patches: PatchOp[] = [
    // `remove` trên một object là xóa khóa — xem `engine/patch.ts`.
    {
      op: 'remove',
      target: { table: 'entities', id: thanId, path: 'aspects.avatar' },
      sourceEventId: nc.eventId,
    },
    {
      op: 'set',
      target: { table: 'links', id: `lk_hoathan_${thanId}_${av.thanTheId}`, path: 'tickDut' },
      value: nc.tick,
      sourceEventId: nc.eventId,
    },
  ];

  return dat({
    patches,
    loiKe:
      `${than.ten} rời khỏi thân xác ấy. Người ở lại vẫn thở, vẫn có tên, ` +
      'và sẽ không bao giờ giải thích được vài tháng vừa rồi.',
  });
}
