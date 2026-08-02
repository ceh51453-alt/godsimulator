/**
 * Affordance collector — Phần 67.4, 67.7.
 *
 * "Thu hoạch affordance từ aspect, quan hệ, vật sở hữu, địa điểm, luật và R.action."
 *
 * [BB] 67.7 — gợi ý lấy từ `WorldView`, KHÔNG lộ target mù. Gợi ý không làm những
 * hành động khác bất khả thi; ô nhập tự do luôn hiện.
 */
import type { WorldView, ProjectedEntity } from '../contracts/view.js';
import { AffordanceSchema } from './schema.js';
import type { Affordance } from './schema.js';
import { R, napDungSan } from '../registry/index.js';

function tang(e: ProjectedEntity): string {
  const s = e.aspects['soul'] as { tang?: string } | undefined;
  return s?.tang ?? 't1';
}

/**
 * Thu hoạch affordance cho một chủ thể.
 *
 * [BB] Chỉ duyệt `view.entities` — thứ đã qua quyền nhìn. Entity trong `suongMu.mu`
 * không bao giờ xuất hiện ở đây, kể cả để bị loại sau.
 */
export function thuHoachAffordance(view: WorldView, chuTheId: string | null): readonly Affordance[] {
  napDungSan();
  const ra: Affordance[] = [];
  const them = (a: Omit<Affordance, 'moTa'> & { moTa?: string }): void => {
    ra.push(AffordanceSchema.parse({ moTa: '', ...a }));
  };

  const chuThe = chuTheId ? view.entities.get(chuTheId) : undefined;

  // ── 1. Động từ Sáng Thế (chỉ tầng sang_the — xem chieu()) ──
  for (const v of view.dongTuKhaDung) {
    them({
      id: `verb:${v.id}`,
      nguon: 'verb',
      ref: v.id,
      nhan: v.ten,
      moTa: v.moTa,
      targetRefs: [],
    });
  }

  // ── 2. R.action theo tầng của chủ thể ──
  if (chuThe) {
    const t = tang(chuThe);
    for (const a of R.action.tatCa()) {
      if (!a.tangApDung.includes(t as 't0' | 't1' | 't2' | 't3')) continue;
      them({
        id: `action:${a.id}`,
        nguon: 'action',
        ref: a.id,
        nhan: a.ten,
        moTa: a.moTa ?? '',
        targetRefs: [],
      });
    }
  }

  // ── 3. Quan hệ: mỗi entity chủ thể thấy RÕ là một đối tượng hành động ──
  if (chuTheId) {
    for (const id of view.suongMu.ro) {
      if (id === chuTheId) continue;
      const e = view.entities.get(id);
      if (!e) continue;
      if (e.kind === 'mortal' || e.kind === 'deity') {
        them({
          id: `relation:noi_chuyen:${id}`,
          nguon: 'relation',
          ref: 'noi_chuyen',
          nhan: `Nói chuyện với ${e.ten}`,
          targetRefs: [{ id: e.id, kind: e.kind, label: e.ten }],
        });
      }
    }
  }

  // ── 4. Địa điểm: nơi nào thấy được thì đi được ──
  for (const id of [...view.suongMu.ro, ...view.suongMu.mo]) {
    const e = view.entities.get(id);
    if (!e || (e.kind !== 'place' && e.kind !== 'realm')) continue;
    them({
      id: `location:di_chuyen:${id}`,
      nguon: 'location',
      ref: 'di_chuyen',
      nhan: `Đi tới ${e.ten}`,
      targetRefs: [{ id: e.id, kind: e.kind, label: e.ten }],
    });
  }

  // ── 5. Vật sở hữu ──
  if (chuThe) {
    const m = chuThe.aspects['mortal'] as { soHuu?: { id: string; targetId: string }[] } | undefined;
    for (const c of m?.soHuu ?? []) {
      them({
        id: `possession:${c.id}`,
        nguon: 'possession',
        ref: 'trao_doi',
        nhan: 'Đem đi trao đổi',
        targetRefs: [{ id: c.targetId }],
      });
    }
  }

  // ── 6. Luật: luật nào thấy được thì khai thác hoặc phản kháng được ──
  for (const l of view.laws) {
    if (l.mucRo === 'tin_don') continue;
    them({
      id: `law:${l.id}`,
      nguon: 'law',
      ref: 'phan_khang',
      nhan: `Thử lách "${l.ten}"`,
      moTa: l.dienGiai,
      targetRefs: [{ id: l.id, kind: 'law', label: l.ten }],
    });
  }

  // Sắp xếp deterministic theo id.
  return ra.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * Chọn 3–5 gợi ý cho UI — Phần 67.7.
 * [BB] Đây là GỢI Ý. Người chơi được kết hợp, sửa, hoặc bỏ hoàn toàn.
 */
export function goiYChoCanh(view: WorldView, chuTheId: string | null, toiDa = 5): readonly Affordance[] {
  const tatCa = thuHoachAffordance(view, chuTheId);
  // Ưu tiên đa dạng nguồn để gợi ý không toàn một loại.
  const theoNguon = new Map<string, Affordance[]>();
  for (const a of tatCa) {
    const ds = theoNguon.get(a.nguon) ?? [];
    ds.push(a);
    theoNguon.set(a.nguon, ds);
  }
  const ra: Affordance[] = [];
  const nguonSap = [...theoNguon.keys()].sort();
  let vong = 0;
  while (ra.length < toiDa && vong < 10) {
    let themDuoc = false;
    for (const n of nguonSap) {
      const ds = theoNguon.get(n);
      const a = ds?.[vong];
      if (a && ra.length < toiDa) {
        ra.push(a);
        themDuoc = true;
      }
    }
    if (!themDuoc) break;
    vong++;
  }
  return ra;
}
