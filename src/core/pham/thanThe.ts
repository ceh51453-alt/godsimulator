/**
 * Thân thể — Phần 70.5 [BB].
 *
 * > "Sức khỏe không phải thanh máu."
 *
 * ── Cái khác biệt nằm ở đâu ──
 *
 * Một thanh máu trả lời đúng một câu hỏi: *còn sống không*. Thân thể thật trả
 * lời câu khác: *hôm nay làm được gì*. Đó là lý do hàm quan trọng nhất ở đây
 * không phải `troiThuongTich()` mà là `viecKhongLamDuoc()` — nó trả về **tên
 * việc**, và bộ thu affordance đọc thẳng danh sách ấy.
 *
 * Hệ quả trong lúc chơi: gãy chân không làm người chơi mất 30 máu, nó làm biến
 * mất lựa chọn "đi tới làng bên" khỏi màn hình — và đó là điều một người gãy
 * chân thật sự trải qua.
 *
 * [BB] 70.5 — chết tới từ **chuỗi** nguyên nhân. Không có `nguyenNhanChet: string`.
 */
import type { PatchOp } from '../contracts/core.js';
import type { Entity } from '../schema/entity.js';
import type { Mortal } from '../schema/aspect/living.js';
import type { ThuongTich, ViTriThanThe } from '../schema/aspect/pham.js';
import { ThuongTichSchema, viecBiChan, keVeThuongTich } from '../schema/aspect/pham.js';
import type { Rng } from '../engine/rng.js';

export type NgocCanhThanThe = {
  readonly eventId: string;
  readonly tick: number;
  readonly rng: Rng;
};

const dat = (id: string, path: string, value: unknown, evId: string): PatchOp => ({
  op: 'set',
  target: { table: 'entities', id, path },
  value,
  sourceEventId: evId,
});

/** Đọc `mortal` cho gọn; trả `undefined` nếu entity không phải người. */
export function phamThan(e: Entity | undefined): Mortal | undefined {
  const a = e?.aspects['mortal'];
  return a && typeof a === 'object' ? (a as Mortal) : undefined;
}

// ─────────────────────────────────────────── thương tích

export type YeuCauThuongTich = {
  readonly loai: ThuongTich['loai'];
  readonly viTri: ViTriThanThe;
  readonly nang: number;
  readonly nguyenNhanEventIds: readonly string[];
};

/**
 * Gây một thương tích. Trả patch; không hàm nào ở đây sửa state.
 *
 * Id thương tích mang cả tick lẫn vị trí, nên hai vết ở hai chỗ trong cùng một
 * nhịp không đè nhau — cùng loại lỗi đã sửa ở phân thân Phase 6b.
 */
export function gayThuongTich(
  e: Entity,
  yc: YeuCauThuongTich,
  nc: NgocCanhThanThe,
): { patches: readonly PatchOp[]; thuongTich: ThuongTich; loiKe: string } {
  const m = phamThan(e);
  const daCo = m?.thanThe.thuongTich ?? [];
  const tt = ThuongTichSchema.parse({
    id: `tt_${nc.tick}_${yc.viTri}_${daCo.length}`,
    loai: yc.loai,
    viTri: yc.viTri,
    nang: Math.max(0, Math.min(1, yc.nang)),
    tickBatDau: nc.tick,
    nguyenNhanEventIds: [...yc.nguyenNhanEventIds],
    nguoiChamId: null,
    trangThai: 'moi',
    diChung: '',
  });

  const dauMoi = Math.min(100, (m?.thanThe.dau ?? 0) + Math.round(tt.nang * 45));
  return {
    patches: [
      {
        op: 'push',
        target: { table: 'entities', id: e.id, path: 'aspects.mortal.thanThe.thuongTich' },
        value: tt,
        sourceEventId: nc.eventId,
      },
      dat(e.id, 'aspects.mortal.thanThe.dau', dauMoi, nc.eventId),
      dat(
        e.id,
        'aspects.mortal.thanThe.sinhLuc',
        Math.max(0, Math.round((m?.thanThe.sinhLuc ?? 100) - tt.nang * 30)),
        nc.eventId,
      ),
    ],
    thuongTich: tt,
    loiKe: `${e.ten}: ${keVeThuongTich(tt)}`,
  };
}

/**
 * Nhận chăm sóc — [BB] 70.5 "Chăm sóc là hành động xã hội".
 *
 * Người chăm phải có mặt, có thời gian và có hiểu biết. Ở đây ta chỉ ghi **ai**;
 * việc họ có đủ ba thứ kia là chuyện của validator gọi tới hàm này, vì nó cần
 * `WorldView` và thứ này thì không.
 */
export function nhanChamSoc(e: Entity, ttId: string, nguoiChamId: string, nc: NgocCanhThanThe): PatchOp[] {
  const m = phamThan(e);
  const i = (m?.thanThe.thuongTich ?? []).findIndex((t) => t.id === ttId);
  if (i < 0) return [];
  return [dat(e.id, `aspects.mortal.thanThe.thuongTich.${i}.nguoiChamId`, nguoiChamId, nc.eventId)];
}

/**
 * Một nhịp trôi qua trên một thân thể.
 *
 * Bốn chuyện xảy ra, theo đúng thứ tự của đời thật:
 *
 *   1. vết thương lành — nhanh hơn hẳn nếu có người chăm;
 *   2. vết không ai chăm và đủ nặng thì **biến chứng**;
 *   3. lành xong có thể để lại **di chứng** — và di chứng thì ở lại;
 *   4. đau tính lại từ những vết còn mở, không phải một bộ đếm riêng.
 *
 * `soBuocGop` để catch-up (71.6) không phải gọi hàm này một triệu lần.
 */
export function troiThanThe(
  e: Entity,
  nc: NgocCanhThanThe,
  soBuocGop = 1,
): { patches: readonly PatchOp[]; suKien: readonly { loai: string; moTa: string }[] } {
  const m = phamThan(e);
  if (!m) return { patches: [], suKien: [] };

  const patches: PatchOp[] = [];
  const suKien: { loai: string; moTa: string }[] = [];
  const ds = m.thanThe.thuongTich;
  if (ds.length === 0 && m.thanThe.dau === 0) return { patches: [], suKien: [] };

  const moi = ds.map((t) => ({ ...t }));

  for (const t of moi) {
    if (t.trangThai === 'da_lanh' || t.trangThai === 'di_chung') continue;

    const coCham = t.nguoiChamId !== null;
    // Có người chăm thì lành gấp đôi. Đây là chỗ "chăm sóc là hành động xã hội"
    // có giá trị đo được, chứ không chỉ là một câu trong tài liệu.
    const lanh = (coCham ? 0.06 : 0.03) * soBuocGop;

    if (!coCham && t.nang >= 0.5 && t.trangThai === 'moi' && nc.rng.co(0.12 * soBuocGop)) {
      t.trangThai = 'bien_chung';
      t.nang = Math.min(1, t.nang + 0.2);
      suKien.push({
        loai: 'thuong_tich_bien_chung',
        moTa: `Vết thương của ${e.ten} trở nặng vì không ai chăm.`,
      });
      continue;
    }

    t.nang = Math.max(0, t.nang - lanh);
    if (t.trangThai === 'moi') t.trangThai = 'dang_lanh';

    if (t.nang <= 0.02) {
      // Vết nặng, hoặc vết để lâu không chăm, thì lành nhưng không lành hẳn.
      const deLaiDiChung = t.loai === 'gay' || t.loai === 'bong' || (!coCham && t.loai !== 'kiet_suc');
      if (deLaiDiChung && nc.rng.co(0.45)) {
        t.trangThai = 'di_chung';
        t.nang = 0.25;
        t.diChung = cauDiChung(t.viTri, t.loai);
        suKien.push({ loai: 'thuong_tich_di_chung', moTa: `${e.ten}: ${t.diChung}` });
      } else {
        t.trangThai = 'da_lanh';
        t.nang = 0;
        if (t.loai === 'benh' && !m.thanThe.daMac.includes(t.id)) {
          // Khỏi bệnh để lại miễn dịch — lịch sử, không phải một cờ boolean.
          patches.push({
            op: 'push',
            target: { table: 'entities', id: e.id, path: 'aspects.mortal.thanThe.daMac' },
            value: t.loai,
            sourceEventId: nc.eventId,
          });
        }
      }
    }
  }

  // Đau suy TỪ vết còn mở. Không có bộ đếm đau riêng để trôi khỏi sự thật.
  const dau = Math.min(
    100,
    Math.round(moi.filter((t) => t.trangThai !== 'da_lanh').reduce((s, t) => s + t.nang * 45, 0)),
  );

  patches.push(dat(e.id, 'aspects.mortal.thanThe.thuongTich', moi, nc.eventId));
  patches.push(dat(e.id, 'aspects.mortal.thanThe.dau', dau, nc.eventId));
  return { patches, suKien };
}

function cauDiChung(viTri: ViTriThanThe, loai: ThuongTich['loai']): string {
  if (viTri === 'chan_trai' || viTri === 'chan_phai') {
    return `${viTri === 'chan_trai' ? 'Chân trái' : 'Chân phải'} đau khi trở trời.`;
  }
  if (viTri === 'tay_trai' || viTri === 'tay_phai') {
    return `${viTri === 'tay_trai' ? 'Tay trái' : 'Tay phải'} không nắm chặt được như trước.`;
  }
  if (viTri === 'dau') return 'Có những buổi đầu óc không rõ ràng.';
  if (loai === 'bong') return 'Vết sẹo không mất đi.';
  return 'Trong người có chỗ không còn như cũ.';
}

// ─────────────────────────────────────────── ảnh hưởng lên affordance

/**
 * Việc thân thể này KHÔNG làm được lúc này — [BB] 70.5.
 *
 * Gộp cả ba nguồn: thương tích, đói và mệt. Trả tên việc, không trả số, vì chỗ
 * dùng nó là bộ thu affordance và câu hỏi ở đó là "hiện lựa chọn này không".
 */
export function viecKhongLamDuoc(m: Mortal | undefined): readonly string[] {
  if (!m) return [];
  const ra = new Set<string>();
  for (const t of m.thanThe.thuongTich) for (const v of viecBiChan(t)) ra.add(v);

  // Đói và mệt là hai trục riêng: đói làm người ta liều, mệt làm người ta hỏng việc.
  if (m.thanThe.doDoi >= 60) ra.add('lam_viec_nang');
  if (m.thanThe.doDoi >= 85) ra.add('di_xa');
  if (m.thanThe.theLuc <= 25) {
    ra.add('lam_viec_nang');
    ra.add('danh_nhau');
  }
  if (m.thanThe.theLuc <= 10) ra.add('di_xa');
  if (m.thanThe.dau >= 55) ra.add('hoc');
  return Object.freeze([...ra].sort());
}

/**
 * Câu nhân vật TỰ NÓI về thân thể mình — nguyên liệu cho Sổ Tay (56.1).
 * [BB] 56.2 quy tắc 1: không con số hệ thống. "Chân trái đau khi trở trời."
 */
export function thanTheKeLai(m: Mortal | undefined): readonly string[] {
  if (!m) return [];
  const ra: string[] = [];
  for (const t of m.thanThe.thuongTich) {
    if (t.trangThai === 'da_lanh') continue;
    ra.push(keVeThuongTich(t));
  }
  if (m.thanThe.doDoi >= 70) ra.push('Bụng đói suốt.');
  else if (m.thanThe.doDoi >= 40) ra.push('Bữa cơm mỏng đi.');
  if (m.thanThe.theLuc <= 30) ra.push('Làm một lúc là hết hơi.');
  if (m.ageBand === 'elder') ra.push('Tuổi rồi, không nhanh như xưa.');
  return Object.freeze(ra);
}

/**
 * Người này chết chưa, và vì cái gì.
 *
 * [BB] Chuỗi nguyên nhân, không phải một chuỗi ký tự: chết vì đói thì gồm cả cái
 * đói **và** cái vết thương làm không đi làm được **và** cái mùa mất mùa. Sổ Nhân
 * Quả đọc được chuỗi ấy; một chữ "chết đói" thì không.
 */
export function daChet(m: Mortal | undefined): { chet: boolean; chuoiNguyenNhan: readonly string[] } {
  if (!m) return { chet: false, chuoiNguyenNhan: [] };
  const chuoi: string[] = [];

  if (m.thanThe.sinhLuc <= 0) chuoi.push('sinh_luc_can');
  if (m.thanThe.doDoi >= 100) chuoi.push('doi_qua_lau');
  const nangNhat = m.thanThe.thuongTich.find((t) => t.trangThai === 'bien_chung' && t.nang >= 0.9);
  if (nangNhat) chuoi.push(`bien_chung:${nangNhat.id}`);

  for (const t of m.thanThe.thuongTich) {
    if (t.trangThai !== 'da_lanh' && t.nang >= 0.5) chuoi.push(`thuong_tich:${t.id}`);
  }
  const chet = m.thanThe.sinhLuc <= 0 || m.thanThe.doDoi >= 100 || nangNhat !== undefined;
  return { chet, chuoiNguyenNhan: Object.freeze(chuoi) };
}
