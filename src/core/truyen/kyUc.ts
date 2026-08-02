/**
 * Nén có hình dạng truyện — Phần 30.3 [BB].
 *
 * ── Vì sao không dùng phép nén thông thường ──
 *
 * Nén biên niên sử theo cách quen thuộc (giữ N sự kiện gần nhất, bỏ phần cũ) làm
 * mất mạch tự sự: nút thắt gieo ở nhịp thứ mười biến mất trước khi được gỡ ở
 * nhịp thứ hai trăm. Nén THEO MẠCH thì không, vì đơn vị nén là một sợi chỉ tự
 * sự chứ không phải một cửa sổ thời gian.
 *
 * [BB] Danh sách "giữ nguyên" của 30.3 là BẤT KHẢ XÂM PHẠM:
 *   nhân vật chính · nút thắt chưa gỡ · phục bút chưa trả · lời hứa · mối thù.
 * Nén được phép làm mất VĂN, không được phép làm mất NHÂN QUẢ TỰ SỰ.
 *
 * Vì vậy hàm dưới đây không phải một bộ tóm tắt: nó là một bộ ĐÓNG GÓI có
 * trường bắt buộc. Phần "cho phép mất" (chi tiết cảnh, hội thoại phụ, mô tả) là
 * phần duy nhất bị cắt, và nó bị cắt bằng cách đơn giản là không được đưa vào.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Foreshadow, Storyline } from '../schema/truyen.js';

export type MucNen = {
  /** Bốn khối bắt buộc giữ. Rỗng là hợp lệ; THIẾU KHỐI thì không. */
  readonly nhanVatChinh: readonly string[];
  readonly nutThatChuaGo: readonly string[];
  readonly phucButChuaTra: readonly string[];
  readonly loiHuaVaMoiThu: readonly string[];
  /** Văn nén — phần được phép mất chi tiết. */
  readonly tomTat: string;
};

/** Trần ký tự của `kyUcMach`. Vượt trần thì cắt VĂN, không cắt bốn khối trên. */
export const TRAN_KY_UC_MACH = 900;

function ten(s: WorldState, id: string): string {
  return s.entities.get(id)?.ten ?? id;
}

/**
 * Lời hứa và mối thù của các nhân vật trong mạch.
 *
 * Lời hứa là `Obligation` trong `mortal.boiVu` và là dòng `debts`; mối thù là
 * `soul.quanHe[x].yeuGhet` rất âm. Cả hai đều là DỮ LIỆU ENGINE — đó là điều
 * làm chúng khác một câu văn mà model tự nhớ được hay không.
 */
function loiHuaVaMoiThu(s: WorldState, m: Storyline): readonly string[] {
  const ra: string[] = [];
  const trong = new Set(m.nhanVat.map((n) => n.entityId));

  for (const id of [...trong].sort((a, b) => (a < b ? -1 : 1))) {
    const e = s.entities.get(id);
    if (!e) continue;

    const mortal = e.aspects['mortal'] as { boiVu?: { description?: string; status?: string }[] } | undefined;
    for (const bv of mortal?.boiVu ?? []) {
      if (bv.status !== undefined && bv.status !== 'active') continue;
      if (typeof bv.description === 'string' && bv.description.trim() !== '') {
        ra.push(`${e.ten} còn nợ: ${bv.description}`);
      }
    }

    const soul = e.aspects['soul'] as { quanHe?: Record<string, { yeuGhet?: number }> } | undefined;
    for (const doiId of Object.keys(soul?.quanHe ?? {}).sort((a, b) => (a < b ? -1 : 1))) {
      const q = soul?.quanHe?.[doiId];
      if ((q?.yeuGhet ?? 0) > -50) continue;
      ra.push(`${e.ten} chưa tha thứ cho ${ten(s, doiId)}.`);
    }
  }

  for (const d of [...s.debts.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (d.status !== 'open') continue;
    if (!trong.has(d.creditorId) && !trong.has(d.debtorId)) continue;
    ra.push(`${ten(s, d.debtorId)} còn nợ ${ten(s, d.creditorId)}.`);
  }

  return ra.slice(0, 12);
}

/**
 * Nén ký ức của MỘT mạch. Chạy cuối mỗi kỷ nguyên (30.3).
 *
 * `nhipGanDay` là văn của những nhịp vừa qua — thứ duy nhất được phép mất.
 */
export function nenKyUcMach(s: WorldState, m: Storyline, nhipGanDay: readonly string[]): MucNen {
  const nhanVatChinh = m.nhanVat
    .filter((n) => n.vaiTro === 'chinh' || n.vaiTro === 'doi_dau')
    .map((n) => `${ten(s, n.entityId)} (${n.vaiTro})`);

  const nutThatChuaGo = m.nutThat.filter((n) => !n.daGo).map((n) => n.moTa);

  const phucButChuaTra = m.phucBut
    .map((id) => s.foreshadows.get(id))
    .filter((f): f is Foreshadow => f !== undefined && !f.daTra)
    .sort((a, b) => b.doNang - a.doNang || (a.id < b.id ? -1 : 1))
    .map((f) => f.noiDung);

  /**
   * Văn: giữ dòng đầu (vì sao mạch thành hình) và vài nhịp gần nhất. Ở giữa là
   * phần "cho phép mất" của 30.3 — nó không được đưa vào, chứ không phải bị cắt
   * giữa chừng, vì cắt giữa chừng để lại một nửa câu và một nửa câu thì sai
   * nghĩa hơn là không có câu nào.
   */
  const dongDau = m.kyUcMach.split('\n')[0] ?? '';
  const duoi = nhipGanDay.slice(-4);
  const tomTat = [dongDau, ...duoi]
    .filter((x) => x.trim() !== '')
    .join(' ')
    .slice(0, TRAN_KY_UC_MACH);

  return { nhanVatChinh, nutThatChuaGo, phucButChuaTra, loiHuaVaMoiThu: loiHuaVaMoiThu(s, m), tomTat };
}

/**
 * Kết xuất `MucNen` thành `kyUcMach`.
 *
 * Bốn khối bắt buộc luôn đứng TRƯỚC văn: nếu có gì bị cắt vì trần ký tự thì thứ
 * bị cắt phải là văn, đúng theo 30.3.
 */
export function ranMucNen(mn: MucNen): string {
  const khoi: string[] = [];
  if (mn.nhanVatChinh.length > 0) khoi.push(`Người trong cuộc: ${mn.nhanVatChinh.join(', ')}.`);
  if (mn.nutThatChuaGo.length > 0) khoi.push(`Chưa gỡ: ${mn.nutThatChuaGo.join(' | ')}`);
  if (mn.phucButChuaTra.length > 0) khoi.push(`Đã gieo, chưa trả: ${mn.phucButChuaTra.join(' | ')}`);
  if (mn.loiHuaVaMoiThu.length > 0) khoi.push(`Còn treo: ${mn.loiHuaVaMoiThu.join(' | ')}`);
  const dau = khoi.join('\n');
  const conLai = Math.max(0, TRAN_KY_UC_MACH - dau.length - 1);
  return conLai === 0 ? dau : `${dau}\n${mn.tomTat.slice(0, conLai)}`.trim();
}

/**
 * Kỷ nguyên thứ mấy, tính từ tick.
 *
 * Hàm thuần của `tick`, không phải một bộ đếm được lưu: một bộ đếm sẽ lệch sau
 * mỗi lần fork nhánh hoặc replay, còn phép chia thì không.
 */
export function kyNguyenCua(tick: number, tickMoiKyNguyen: number): number {
  return Math.floor(tick / Math.max(1, tickMoiKyNguyen));
}

/** Tick này có phải mốc chuyển kỷ nguyên không. Tick 0 KHÔNG phải. */
export function laMocKyNguyen(tick: number, tickMoiKyNguyen: number): boolean {
  return tick > 0 && tick % Math.max(1, tickMoiKyNguyen) === 0;
}

/**
 * Nén toàn bộ mạch đang mở — chạy ở mốc kỷ nguyên (30.3).
 *
 * Trả patch: nén cũng đi qua Event như mọi thay đổi khác (luật bất biến #4).
 * Nguyên liệu là `Storyline.nhipGanDay` — bộ đệm mà mỗi nhịp đã đẩy vào; nén
 * xong thì bộ đệm được dọn, vì phần văn đáng giữ đã nằm trong `kyUcMach` còn
 * phần còn lại là thứ 30.3 cho phép mất.
 */
export function nenCuoiKyNguyen(s: WorldState, nc: { eventId: string }): readonly PatchOp[] {
  const ra: PatchOp[] = [];
  for (const id of [...s.storylines.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const m = s.storylines.get(id);
    if (!m) continue;
    // Không có nhịp mới thì không có gì để nén — đừng ghi patch rỗng mỗi kỷ nguyên.
    if (m.nhipGanDay.length === 0) continue;

    const nen = ranMucNen(nenKyUcMach(s, m, m.nhipGanDay));
    if (nen !== m.kyUcMach) {
      ra.push({
        op: 'set',
        target: { table: 'storylines', id, path: 'kyUcMach' },
        value: nen,
        sourceEventId: nc.eventId,
      });
    }
    ra.push({
      op: 'set',
      target: { table: 'storylines', id, path: 'nhipGanDay' },
      value: [],
      sourceEventId: nc.eventId,
    });
  }
  return ra;
}

/**
 * Cổng của 30.3, dạng hàm kiểm được: nén KHÔNG được làm mất nhân quả tự sự.
 *
 * Trả danh sách thứ bị mất. Rỗng nghĩa là đạt.
 */
export function kiemNenKhongMat(truoc: MucNen, sau: string): readonly string[] {
  const mat: string[] = [];
  for (const x of truoc.nutThatChuaGo) if (!sau.includes(x)) mat.push(`nút thắt: ${x}`);
  for (const x of truoc.phucButChuaTra) if (!sau.includes(x)) mat.push(`phục bút: ${x}`);
  for (const x of truoc.loiHuaVaMoiThu) if (!sau.includes(x)) mat.push(`treo: ${x}`);
  for (const x of truoc.nhanVatChinh) if (!sau.includes(x)) mat.push(`nhân vật: ${x}`);
  return mat;
}
