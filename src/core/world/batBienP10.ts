/**
 * Bất biến Phase 10 — Khối L (Luật Nền, Tiếp Địa) và Khối I/O (Lorebook).
 *
 * ── Vì sao những điều này là BẤT BIẾN chứ không phải test ──
 *
 * Bốn lằn ranh nặng nhất của Phase 10 đều có cùng hình dạng: chúng **không sai ở
 * lượt đầu**. Một lorebook người dùng nguyên vẹn ở lượt một; nó bị máy sửa ở lượt
 * thứ bốn trăm, sau khi một workflow chạy hai mươi lần và một model trả về một op
 * mà validator vừa đủ cho qua. Chỗ bắt loại lỗi ấy phải là chỗ chạy sau MỌI
 * transaction, không phải một bài test chạy một lần.
 *
 * | Lằn ranh                                   | Bất biến ở đây                       |
 * |--------------------------------------------|--------------------------------------|
 * | 52.2 — AI không sửa entry người dùng       | `lorebook_nguoi_dung_bat_kha_xam`   |
 * | 51.4 — entry khóa canon không bao giờ bị che | `khoa_canon_khong_bi_che`          |
 * | 51.3 — che phải có lý do truy được          | `che_phai_co_ly_do`                 |
 * | 43.5 — thứ tự phụ thuộc bảy trục            | `luat_nen_dung_thu_tu`              |
 * | 51.6 — entry không có gì chống lưng không nạp | `entry_khong_chong_lung_khong_nap` |
 */
import { dangKyInvariant, dangKyBoNapInvariant } from '../engine/invariant.js';
import type { WorldState } from '../engine/state.js';
import { PHU_THUOC_TRUC } from '../vatly/schema.js';
import { NGUONG_TIN_CAY_NAP } from '../lore/schema.js';
import type { LorebookEntry } from '../lore/schema.js';

let daNap = false;

export function napBatBienPhase10(): void {
  if (daNap) return;
  daNap = true;
  dangKyBoNapInvariant(dangKyTatCa);
}

/** Duyệt mọi entry kèm lorebook chứa nó, theo thứ tự id — deterministic. */
function moiEntry(s: WorldState): { lbId: string; nguon: string; e: LorebookEntry }[] {
  const ra: { lbId: string; nguon: string; e: LorebookEntry }[] = [];
  for (const id of [...s.lorebooks.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const lb = s.lorebooks.get(id);
    if (lb === undefined) continue;
    for (const e of lb.entries) ra.push({ lbId: lb.id, nguon: lb.nguon, e });
  }
  return ra;
}

function dangKyTatCa(): void {
  /**
   * [BB] 52.2 — "Người chơi soạn lorebook của mình và phải chắc chắn rằng chữ họ
   * viết không bao giờ bị máy sửa sau lưng."
   *
   * Mức `fatal`: một transaction làm điều này phải bị rollback. Đây là lằn ranh
   * mà đặc tả gọi là "không được vượt", và một cảnh báo sẽ chỉ ghi lại việc nó
   * đã bị vượt rồi.
   */
  dangKyInvariant({
    id: 'lorebook_nguoi_dung_bat_kha_xam',
    ten: 'Máy không bao giờ sửa hay xóa entry người dùng — chỉ được che',
    mucDo: 'fatal',
    canToanCuc: true,
    kiem: (s) => {
      const vp: string[] = [];
      for (const { lbId, nguon, e } of moiEntry(s)) {
        if (nguon !== 'nguoi_dung') continue;
        for (const h of e.lichSu) {
          if (h.boiAi === 'nguoi_choi') continue;
          if (h.op === 'che' || h.op === 'bo_che') continue;
          vp.push(
            `Entry "${e.ten}" (${lbId}) bị ${h.boiAi} thực hiện op "${h.op}" ở nhịp ${h.tick}. ` +
              'Entry người dùng chỉ được CHE.',
          );
        }
        if (e.trangThai === 'da_xoa') {
          vp.push(`Entry "${e.ten}" (${lbId}) thuộc lorebook người dùng mà đang ở trạng thái đã xóa.`);
        }
      }
      return vp;
    },
  });

  /** [BB] 51.4 — `khoaCanon = true` thì không bao giờ bị che, bất kể thế giới đi hướng nào. */
  dangKyInvariant({
    id: 'khoa_canon_khong_bi_che',
    ten: 'Entry khóa canon không bao giờ bị che',
    mucDo: 'fatal',
    canToanCuc: true,
    kiem: (s) =>
      moiEntry(s)
        .filter(({ e }) => e.khoaCanon && e.trangThai === 'bi_che')
        .map(
          ({ lbId, e }) =>
            `Entry "${e.ten}" (${lbId}) đã khóa canon nhưng đang bị che bởi ${e.biCheBoiId ?? '?'}.`,
        ),
  });

  /**
   * [BB] 51.3 — "Mỗi lần che phải sinh một mục Dị Bản với chuỗi nhân quả truy được."
   *
   * Ở mức bất biến, điều truy được tối thiểu là: có kẻ che, và có lý do. Một entry
   * biến mất khỏi ngữ cảnh mà không nói vì sao là đúng loại lỗi người chơi không
   * bao giờ báo được — họ chỉ thấy AI thôi nhắc tới một chuyện.
   */
  dangKyInvariant({
    id: 'che_phai_co_ly_do',
    ten: 'Entry bị che phải khai ai che và vì sao',
    mucDo: 'warning',
    canToanCuc: true,
    kiem: (s) => {
      const vp: string[] = [];
      for (const { lbId, e } of moiEntry(s)) {
        if (e.trangThai !== 'bi_che') continue;
        if (e.biCheBoiId === null) vp.push(`Entry "${e.ten}" (${lbId}) bị che mà không khai bị che bởi ai.`);
        if (e.lyDoChe.trim() === '') vp.push(`Entry "${e.ten}" (${lbId}) bị che mà không có lý do.`);
        if (e.tickChe === null) vp.push(`Entry "${e.ten}" (${lbId}) bị che mà không ghi nhịp che.`);
      }
      return vp;
    },
  });

  /**
   * [BB] 51.6 — entry không có sự kiện engine chống lưng thì `doTinCay = 0` và
   * KHÔNG được nạp. Bất biến này bắt trường hợp ngược: `doTinCay` cao mà danh
   * sách chống lưng rỗng — tức là có ai đó đã cộng điểm cho một văn bản bằng văn bản.
   */
  dangKyInvariant({
    id: 'entry_khong_chong_lung_khong_nap',
    ten: 'Độ tin cậy chỉ đến từ sự kiện engine',
    mucDo: 'warning',
    canToanCuc: true,
    kiem: (s) =>
      moiEntry(s)
        .filter(
          ({ nguon, e }) =>
            nguon !== 'nguoi_dung' && e.doTinCay >= NGUONG_TIN_CAY_NAP && e.suKienChongLung.length === 0,
        )
        .map(
          ({ lbId, e }) =>
            `Entry "${e.ten}" (${lbId}) có doTinCay ${e.doTinCay} nhưng không trích dẫn sự kiện nào. ` +
            'Văn bản không tự chứng minh được chính nó (51.6).',
        ),
  });

  /** [BB] 43.5 — không thể đặt tên một trục khi trục nó phụ thuộc còn vô danh. */
  dangKyInvariant({
    id: 'luat_nen_dung_thu_tu',
    ten: 'Bảy trục luật nền phải có tên đúng thứ tự phụ thuộc',
    mucDo: 'fatal',
    canToanCuc: true,
    kiem: (s) => {
      const coTen = new Set(
        [...s.substrateLaws.values()].filter((x) => x.trangThai === 'co_ten').map((x) => x.truc),
      );
      const vp: string[] = [];
      for (const truc of [...coTen].sort()) {
        for (const truoc of PHU_THUOC_TRUC[truc]) {
          if (!coTen.has(truoc)) {
            vp.push(`Trục "${truc}" đã có tên trong khi "${truoc}" còn vô danh (43.5).`);
          }
        }
      }
      return vp;
    },
  });

  /**
   * [BB] 43.3 — `khaiNiemNenId` bắt buộc để chuyển sang `co_ten`, và kẽ hở CHỈ
   * sinh khi `co_ten`. Trục vô danh có kẽ hở nghĩa là ai đó đã bỏ qua đúng cơ chế
   * mà 43.2 dựng lên: khai thác đòi hỏi phải biết luật.
   */
  dangKyInvariant({
    id: 'ke_ho_chi_co_khi_co_ten',
    ten: 'Trục vô danh không có kẽ hở, và trục có tên phải tiếp địa',
    mucDo: 'fatal',
    canToanCuc: true,
    kiem: (s) => {
      const vp: string[] = [];
      for (const id of [...s.substrateLaws.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const ln = s.substrateLaws.get(id);
        if (ln === undefined) continue;
        if (ln.trangThai === 'vo_danh' && ln.keHo.length > 0) {
          vp.push(
            `Trục "${ln.truc}" còn vô danh mà đã có ${ln.keHo.length} kẽ hở. Chưa ai biết thì chưa ai lách được.`,
          );
        }
        if (ln.trangThai === 'co_ten' && ln.khaiNiemNenId === null) {
          vp.push(
            `Trục "${ln.truc}" đã có tên mà không khai khái niệm nền. Luật nền cũng phải tiếp địa (43.3).`,
          );
        }
      }
      return vp;
    },
  });

  /** [BB] 42.2 — `hieuLuc` do ENGINE tính. Ngoài [0, 100] nghĩa là có ai đó khai tay. */
  dangKyInvariant({
    id: 'hieu_luc_trong_khoang',
    ten: 'Hiệu lực luật nằm trong [0, 100] và do engine tính',
    mucDo: 'warning',
    canToanCuc: true,
    kiem: (s) => {
      const vp: string[] = [];
      for (const id of [...s.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const l = s.entities.get(id)?.aspects['lawful'] as { hieuLuc?: number } | undefined;
        if (l === undefined || l.hieuLuc === undefined) continue;
        if (l.hieuLuc < 0 || l.hieuLuc > 100 || !Number.isFinite(l.hieuLuc)) {
          vp.push(`Luật "${id}" có hieuLuc = ${l.hieuLuc}, ngoài khoảng hợp lệ.`);
        }
      }
      return vp;
    },
  });
}
