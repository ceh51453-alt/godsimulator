/**
 * Áp luật — bước 2 của tick, [BB] Phần 9, 42.4.
 *
 * ── Vì sao bước này từng trống ──
 *
 * `LawfulSchema` khai bảy trường logic hoàn chỉnh: `phamVi`, `kichHoat`,
 * `hieuUng`, `ngoaiLe`, `uuTien`, `xungDot`, `khaNghich`. Người chơi viết chúng,
 * thế giới mẫu gieo chúng, panel hiện chúng — và **không nơi nào đọc `hieuUng`**.
 * Một điều luật là một dòng văn có số hiệu; nó không làm gì với thế giới cả.
 *
 * Nghĩa là câu "thế giới vận hành theo luật của nó" đúng theo nghĩa văn học và
 * sai theo nghĩa cơ học. File này làm nó đúng theo cả hai.
 *
 * ── Ba hàng rào, và vì sao cần cả ba ──
 *
 * Một điều luật là **dữ liệu người dùng viết**: preset khai được, lorebook khai
 * được, và (qua op `link`) lời kể khai được. Cho nó ghi tự do vào `WorldState` là
 * mở lại đúng cánh cửa mà `bocTach()` vừa đóng — chỉ là đi vòng qua một cái tên
 * khác. Nên:
 *
 *   1. **Bảng trắng đường dẫn.** Mặc định TỪ CHỐI. Luật chạm được thân thể, cảm
 *      xúc, sinh kế, căn cước — những thứ một quy tắc trong thế giới thật sự
 *      chi phối. Nó KHÔNG chạm được sổ sách của engine (`dan_cu`, `kinh_te`,
 *      `sinh_thai`), vì những bảng ấy có bất biến bảo toàn và một điều luật
 *      không được phép đẻ ra người hay lương thực từ hư không.
 *   2. **Chỉ luật nhịp mới tự chạy.** `kichHoat.suKien` trỏ tới một loại sự kiện
 *      cụ thể ("gay_chay_mau") thì luật ấy chờ sự kiện ấy, không nổ mỗi nhịp.
 *      Thiếu hàng rào này thì luật "máu đổ thì +25 độ đói" cộng 25 cho mọi người
 *      trong thế giới, mỗi nhịp, mãi mãi.
 *   3. **Hiệu lực nhân vào.** 42.4 nói sức của luật là độ thật của khái niệm nền.
 *      Một luật 30% hiệu lực chỉ đẩy được 30% giá trị nó khai — nên luật đầu tiên
 *      của một thế giới gần như trơ, và nó mạnh dần khi thế giới hiểu nó.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Lawful } from '../schema/aspect/lawful.js';
import { dieuKienDung } from '../engine/expr.js';
import type { Tuning } from '../tuning/schema.js';

/**
 * Tiền tố đường dẫn mà `hieuUng` được phép ghi.
 *
 * Danh sách này là lằn ranh, không phải một tiện ích — thêm một dòng vào đây là
 * cấp thêm quyền cho mọi điều luật mà bất kỳ preset nào cũng viết được.
 *
 * `dan_cu`, `kinh_te`, `sinh_thai`, `y_te`, `an_ninh` vắng mặt có chủ đích: năm
 * mặt ấy là sổ sách của mười tám tiến trình nền, và chúng có bất biến bảo toàn
 * (`dan_so_khop_cohort`, `di_cu_bao_toan`, `kho_khong_am`). Một patch của luật
 * chen vào giữa sẽ làm cả lô bị từ chối — tức là luật ấy không những vô hiệu mà
 * còn kéo theo mọi việc khác của nhịp đó.
 */
export const TIEN_TO_HIEU_UNG: readonly string[] = Object.freeze([
  'aspects.mortal.',
  'aspects.can_cuoc.',
  'aspects.sinh_ke.',
  'aspects.carrier.',
  'aspects.venerable.',
  'aspects.soul.camXuc.',
  'aspects.soul.ducVong.',
]);

/**
 * Đường dẫn bị cấm dù đã khớp tiền tố trên.
 *
 * `soul.banTinh` là bản tính — 69.1 nói nó chỉ đổi qua Event có giải thích, và
 * một điều luật chạy nền mỗi nhịp thì không phải một lời giải thích.
 */
const CAM_TRONG_HIEU_UNG: readonly string[] = Object.freeze([
  'aspects.soul.banTinh',
  'aspects.mortal.canCuoc',
]);

/** Loại `kichHoat.suKien` được coi là "chạy theo nhịp", không chờ sự kiện nào. */
const SU_KIEN_THEO_NHIP = new Set(['', 'moi_su_kien', 'moi_nhip', 'lien_tuc']);

export type ViecApLuat = {
  readonly luatId: string;
  readonly ten: string;
  readonly hieuLuc: number;
  readonly soThucThe: number;
};

export type KetQuaApLuat = {
  readonly patches: readonly PatchOp[];
  readonly viec: readonly ViecApLuat[];
  /** Hiệu ứng bị bỏ và vì sao — vào bảng Tự Chẩn Đoán, không vào World. */
  readonly boQua: readonly { readonly luatId: string; readonly vi: string }[];
};

function docLawful(e: Entity): Lawful | undefined {
  const a = e.aspects['lawful'];
  return a === null || typeof a !== 'object' ? undefined : (a as Lawful);
}

function duocGhi(duong: string): boolean {
  if (!TIEN_TO_HIEU_UNG.some((t) => duong.startsWith(t))) return false;
  return !CAM_TRONG_HIEU_UNG.some((c) => duong === c || duong.startsWith(`${c}.`));
}

/**
 * Thực thể này có cái mặt mà điều luật muốn chạm không.
 *
 * ── Vì sao không bỏ qua được bước này ──
 *
 * Một điều luật `vu_tru` nói về thân thể sẽ quét cả nơi chốn, cả khái niệm, cả
 * chính những điều luật khác. Patch `add` lên `aspects.mortal.thanThe.doDoi` của
 * một `place` không im lặng trượt: `apPatch` trả `PATH_XAU`, và vì lô là
 * tất-cả-hoặc-không, **một patch vô nghĩa làm hỏng cả nhịp** — kể cả phần dân số
 * và mùa màng chẳng liên quan gì.
 *
 * Nên phép lọc ở đây không phải tối ưu; nó là điều kiện để bước áp luật không
 * kéo cả thế giới đứng hình.
 */
function coMatNay(e: Entity, duong: string, phep: Lawful['hieuUng'][number]['phep']): boolean {
  const phan = duong.split('.');
  if (phan[0] !== 'aspects' || phan.length < 3) return false;
  const mat = e.aspects[phan[1] as string];
  if (mat === null || typeof mat !== 'object') return false;

  // `add`/`mul` cần một con số ĐANG CÓ; `apPatch` từ chối cộng lên `undefined`.
  if (phep !== 'add' && phep !== 'mul') return true;
  let cur: unknown = mat;
  for (const k of phan.slice(2)) {
    if (cur === null || typeof cur !== 'object') return false;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === 'number';
}

/** Thực thể nào chịu một điều luật — 9.1 `phamVi`. */
function thucTheChiuLuat(l: Lawful, s: WorldState, song: readonly Entity[]): Entity[] {
  const muc = new Set(l.phamVi.mucTieu);

  if (l.phamVi.loai === 'vu_tru') return [...song];
  if (l.phamVi.loai === 'chung_loai') return song.filter((e) => muc.has(e.kind));
  if (l.phamVi.loai === 'ca_the') return song.filter((e) => muc.has(e.id));

  if (l.phamVi.loai === 'vung' || l.phamVi.loai === 'coi') {
    // Ở trong vùng nghĩa là có một sợi dây cư trú tới nó — không phải là trùng id.
    const oTrong = new Set<string>();
    for (const lk of [...s.links.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
      if (lk.tickDut !== null || lk.quanHe !== 'cu_tru_tai') continue;
      if (muc.has(lk.denId)) oTrong.add(lk.tuId);
    }
    return song.filter((e) => muc.has(e.id) || oTrong.has(e.id));
  }

  // `huyet_mach` và mọi loại pack ngoài thêm: chỉ id khai tường minh.
  return song.filter((e) => muc.has(e.id));
}

/**
 * Giá trị sau khi nhân hiệu lực.
 *
 * `add` co tuyến tính. `mul` nội suy về 1 — một hệ số 2.0 ở hiệu lực 50% là 1.5,
 * chứ không phải 1.0, vì "nhân đôi một nửa" phải là "nhân rưỡi".
 *
 * `set` và `flag` không co được: đặt một nửa của `true` là vô nghĩa. Chúng chỉ
 * chạy khi luật đã đủ răng — `nguongApTuyetDoi`.
 */
function giaTriTheoHieuLuc(
  phep: Lawful['hieuUng'][number]['phep'],
  giaTri: unknown,
  hieuLuc: number,
  nguongTuyetDoi: number,
): { ok: true; giaTri: unknown } | { ok: false; vi: string } {
  const ty = hieuLuc / 100;
  if (phep === 'add') {
    if (typeof giaTri !== 'number' || !Number.isFinite(giaTri)) {
      return { ok: false, vi: 'Phép "add" cần một số hữu hạn.' };
    }
    const v = Math.round(giaTri * ty * 10_000) / 10_000;
    return v === 0
      ? { ok: false, vi: 'Hiệu lực quá thấp, thay đổi làm tròn về 0.' }
      : { ok: true, giaTri: v };
  }
  if (phep === 'mul') {
    if (typeof giaTri !== 'number' || !Number.isFinite(giaTri)) {
      return { ok: false, vi: 'Phép "mul" cần một số hữu hạn.' };
    }
    const v = Math.round((1 + (giaTri - 1) * ty) * 10_000) / 10_000;
    return v === 1 ? { ok: false, vi: 'Hiệu lực quá thấp, hệ số làm tròn về 1.' } : { ok: true, giaTri: v };
  }
  if (hieuLuc < nguongTuyetDoi) {
    return {
      ok: false,
      vi: `Phép "${phep}" là thay đổi tuyệt đối; luật phải đạt hiệu lực ${nguongTuyetDoi} mới áp được.`,
    };
  }
  return { ok: true, giaTri };
}

/**
 * Áp mọi điều luật đang có hiệu lực lên thế giới.
 *
 * Hàm THUẦN: chỉ đọc `s`, trả patch. Người gọi gói vào Event và cho qua
 * transaction như mọi thay đổi khác — luật bất biến #4 không có ngoại lệ cho
 * chính luật.
 *
 * Xung đột giải theo `uuTien`: luật cao hơn ghi trước và giữ chỗ, luật thấp hơn
 * chạm cùng một (thực thể, đường dẫn) thì bị bỏ. Đó là `cachGiai` mặc định
 * `uu_tien_cao_thang` của 9.1, áp cho mọi cặp chứ không chỉ cặp khai tường minh.
 */
export function apLuat(s: WorldState, nc: { tick: number; eventId: string; tuning: Tuning }): KetQuaApLuat {
  const patches: PatchOp[] = [];
  const viec: ViecApLuat[] = [];
  const boQua: { luatId: string; vi: string }[] = [];
  const daGhi = new Set<string>();

  const t = nc.tuning.luat;
  const song = [...s.entities.values()]
    .filter((e) => e.tickDiet === null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const luatDs = song
    .map((e) => ({ e, l: docLawful(e) }))
    .filter((x): x is { e: Entity; l: Lawful } => x.l !== undefined)
    .filter((x) => x.l.trangThai === 'hieu_luc' && x.l.hieuUng.length > 0)
    // Ưu tiên cao chạy trước; hòa thì theo id để hai lần chạy cho cùng kết quả.
    .sort((a, b) => (b.l.uuTien !== a.l.uuTien ? b.l.uuTien - a.l.uuTien : a.e.id < b.e.id ? -1 : 1));

  for (const { e: luat, l } of luatDs) {
    if (!SU_KIEN_THEO_NHIP.has(l.kichHoat.suKien)) {
      // Không phải lỗi: luật ấy chờ một loại sự kiện, và nhịp nền không phải nó.
      continue;
    }
    if (l.hieuLuc <= 0) {
      boQua.push({ luatId: luat.id, vi: 'Hiệu lực bằng 0 — thế giới chưa cảm thấy điều luật này (42.4).' });
      continue;
    }

    let soThucThe = 0;
    for (const e of thucTheChiuLuat(l, s, song)) {
      if (e.id === luat.id) continue;
      if (soThucThe >= t.soThucTheMoiLuat) break;

      const nguon = { e, tick: nc.tick, luat: { id: luat.id, hieuLuc: l.hieuLuc } };
      if (!dieuKienDung(l.kichHoat.dieuKien, nguon)) continue;
      // [BB] 9.1 kiểm tra 4 — ngoại lệ phải khai tường minh, và nó thắng.
      if (l.ngoaiLe.some((x) => dieuKienDung(x.dieuKien, nguon))) continue;

      let chamDuoc = false;
      for (const hu of l.hieuUng) {
        if (!duocGhi(hu.duongDan)) {
          boQua.push({
            luatId: luat.id,
            vi: `Luật không được ghi vào "${hu.duongDan}". Chỉ những mặt mà một quy tắc thật sự chi phối mới mở.`,
          });
          continue;
        }
        // Không có mặt ấy thì luật không nói về kẻ này. Im lặng bỏ qua, không ghi
        // chẩn đoán: một điều luật vũ trụ đi ngang một nơi chốn là chuyện thường,
        // không phải một lỗi khai báo.
        if (!coMatNay(e, hu.duongDan, hu.phep)) continue;
        const khoa = `${e.id} ${hu.duongDan}`;
        if (daGhi.has(khoa)) continue;

        const gt = giaTriTheoHieuLuc(hu.phep, hu.giaTri, l.hieuLuc, t.nguongApTuyetDoi);
        if (!gt.ok) {
          boQua.push({ luatId: luat.id, vi: gt.vi });
          continue;
        }

        daGhi.add(khoa);
        chamDuoc = true;
        patches.push({
          op: hu.phep,
          target: { table: 'entities', id: e.id, path: hu.duongDan },
          value: gt.giaTri,
          sourceEventId: nc.eventId,
        });
      }
      if (chamDuoc) soThucThe++;
    }

    if (soThucThe > 0) {
      viec.push({ luatId: luat.id, ten: luat.ten, hieuLuc: l.hieuLuc, soThucThe });
    }
  }

  return {
    patches: Object.freeze(patches),
    viec: Object.freeze(viec),
    // Cùng một lý do lặp lại trên mọi thực thể là một dòng chẩn đoán, không phải
    // một nghìn. Gộp trước khi trả để bảng đọc được.
    boQua: Object.freeze(
      [...new Map(boQua.map((b) => [`${b.luatId} ${b.vi}`, b])).values()].sort((a, b) =>
        a.luatId < b.luatId ? -1 : 1,
      ),
    ),
  };
}
