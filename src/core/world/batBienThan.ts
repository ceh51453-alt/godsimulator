/**
 * Bất biến tầng Thần — cổng Phase 6.
 *
 * Bốn dòng của cổng, và chỗ cưỡng chế tương ứng:
 *
 * | Cổng Phase 6 | Ở đây |
 * |---|---|
 * | CoreSelf không bị tick âm thầm sửa | `coreself_co_giai_thich` |
 * | Không mana / cooldown giả | `khong_tai_nguyen_meta` |
 * | Thần NPC tiếp tục sống khi vắng | (đo bằng test, không phải bất biến) |
 * | Hoàn thành ba mục tiêu ngoài tranh domain | (đo bằng test) |
 *
 * Cộng thêm ba bất biến mà Phần 69 và 22 đòi.
 */
import { dangKyInvariant, dangKyBoNapInvariant } from '../engine/invariant.js';
import type { WorldState } from '../engine/state.js';
import type { PhamViKiem } from '../engine/invariant.js';
import type { Entity } from '../schema/entity.js';
import type { DivineIdentity } from '../schema/aspect/thanVi.js';
import { trangThaiSuyRa, khoangCachBanTinh } from '../schema/aspect/thanVi.js';
import type { Domain } from '../schema/aspect/divine.js';
import { giaoUocCanBang } from '../schema/than.js';
import type { GiaoUoc } from '../schema/than.js';
import { BAN_TINH_TRUC } from '../schema/aspect/soul.js';

function doc<T>(e: Entity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a === undefined || a === null || typeof a !== 'object' ? undefined : (a as T);
}

function laToanBo(p: PhamViKiem): p is 'tat_ca' {
  return p === 'tat_ca';
}

function idCanKiem(s: WorldState, phamVi: PhamViKiem): string[] {
  const ids = laToanBo(phamVi) ? [...s.entities.keys()] : [...phamVi.entities];
  return ids.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * [BB] Phần 1.3 — "Không có tài nguyên".
 *
 * Danh sách này là những cái tên mà một hệ mana giả sẽ mang. Nếu ai đó thêm một
 * trường như thế vào aspect của thần, bất biến đỏ ngay ở tick đầu tiên. Đây là
 * loại luật dễ bị bào mòn nhất qua các phase, nên nó phải được canh bằng máy.
 */
const TEN_TAI_NGUYEN_META = [
  'mana',
  'thanLuc',
  'than_luc',
  'energy',
  'nangLuong',
  'cooldown',
  'hoiChieu',
  'hoi_chieu',
  'stamina',
  'ap',
  'mp',
  'charge',
  'diemThan',
];

let daNap = false;

export function napBatBienTangThan(): void {
  if (daNap) return;
  daNap = true;
  dangKyBoNapInvariant(dangKyTatCa);
}

function dangKyTatCa(): void {
  /**
   * [BB] 69.1 — "Không tick nào tự sửa tính cách lõi mà không có Event giải thích."
   *
   * Cách kiểm: mỗi lần `coreSelf` khác `soul.banTinh`, phải có một dòng
   * `lichSuLoi` gần nhất giải thích. Và mọi dòng `lichSuLoi` phải có `eventId`.
   * Một tick lén sửa lõi sẽ để lại đúng dấu vết này: lệch mà không có dòng nào.
   */
  dangKyInvariant({
    id: 'coreself_co_giai_thich',
    ten: 'Lõi bản ngã chỉ đổi khi có Event giải thích',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      const xau: string[] = [];
      for (const id of idCanKiem(s, phamVi)) {
        const e = s.entities.get(id);
        const bn = doc<DivineIdentity>(e, 'ban_nga');
        if (!bn) continue;

        for (const d of bn.lichSuLoi) {
          if (d.eventId === '') xau.push(`'${id}': một lần đổi lõi không ghi eventId`);
        }

        const soul = doc<{ banTinh?: Record<string, number> }>(e, 'soul');
        if (!soul?.banTinh) continue;
        // Lõi và `soul.banTinh` là cùng một sự thật ở hai chỗ. Lệch nghĩa là có
        // đường ghi nào đó chỉ chạm một bên — đúng cái bug 69.1 muốn chặn.
        for (const truc of BAN_TINH_TRUC) {
          const a = bn.coreSelf[truc] ?? 0;
          const b = soul.banTinh[truc] ?? 0;
          if (Math.abs(a - b) > 1) {
            xau.push(`'${id}': coreSelf.${truc} = ${a} nhưng soul.banTinh.${truc} = ${b}`);
          }
        }
      }
      return xau;
    },
  });

  /** Hình ảnh tín đồ trôi thoải mái — nhưng `pressure.distortion` phải khớp nó. */
  dangKyInvariant({
    id: 'di_hoa_khong_sua_loi',
    ten: 'Áp lực Dị Hóa phải khớp khoảng cách thật',
    mucDo: 'warning',
    kiem: (s, phamVi) => {
      const xau: string[] = [];
      for (const id of idCanKiem(s, phamVi)) {
        const bn = doc<DivineIdentity>(s.entities.get(id), 'ban_nga');
        if (!bn) continue;
        const that = khoangCachBanTinh(bn.coreSelf, bn.followerImage);
        if (Math.abs(that - bn.pressure.distortion) > 2) {
          xau.push(`'${id}': distortion ghi ${bn.pressure.distortion} nhưng khoảng cách thật là ${that}`);
        }
      }
      return xau;
    },
  });

  /**
   * [BB] 1.3 + 69.2 — không mana, không cooldown.
   * Cái ngăn lạm dụng kênh can thiệp là **hậu quả**, không phải bộ đếm.
   */
  dangKyInvariant({
    id: 'khong_tai_nguyen_meta',
    ten: 'Không tài nguyên meta trên thực thể',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      const xau: string[] = [];
      for (const id of idCanKiem(s, phamVi)) {
        const e = s.entities.get(id);
        if (!e) continue;
        for (const [tenAspect, duLieu] of Object.entries(e.aspects)) {
          if (duLieu === null || typeof duLieu !== 'object') continue;
          for (const khoa of Object.keys(duLieu as Record<string, unknown>)) {
            if (TEN_TAI_NGUYEN_META.includes(khoa)) {
              xau.push(`'${id}': aspect '${tenAspect}' có trường '${khoa}' — đó là tài nguyên meta`);
            }
          }
        }
      }
      return xau;
    },
  });

  /**
   * [BB] 69.4 — mất vĩnh viễn chỉ khi MỌI neo đều đứt.
   * `suc = 0` mà còn neo thì phải là `reclaimable`, không được là `lost`.
   */
  dangKyInvariant({
    id: 'domain_mat_phai_het_neo',
    ten: 'Domain chỉ mất hẳn khi không còn neo nào',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      const xau: string[] = [];
      for (const id of idCanKiem(s, phamVi)) {
        const dom = doc<Domain>(s.entities.get(id), 'domain');
        if (!dom) continue;
        for (const d of dom.domains) {
          if (d.trangThai === 'lost' && d.neoTaiChiem.length > 0) {
            xau.push(`'${id}': domain '${d.ten}' ghi 'lost' nhưng còn ${d.neoTaiChiem.length} neo`);
          }
          const suyRa = trangThaiSuyRa(d);
          if (d.trangThai === 'held' && suyRa === 'lost') {
            xau.push(`'${id}': domain '${d.ten}' ghi 'held' nhưng suc = 0 và không còn neo`);
          }
        }
      }
      return xau;
    },
  });

  /**
   * [BB] 22.2 — "mọi lời cầu đều truy được về một bế tắc thật".
   * Lời cầu không có `ducVongThieu` là lời cầu bịa.
   */
  dangKyInvariant({
    id: 'loi_cau_co_goc_that',
    ten: 'Lời cầu phải có gốc là một bế tắc thật',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      const ids = laToanBo(phamVi) ? [...s.prayers.keys()] : [...phamVi.prayers];
      const xau: string[] = [];
      for (const id of ids.sort((a, b) => (a < b ? -1 : 1))) {
        const p = s.prayers.get(id);
        if (!p) continue;
        if (p.goc.ducVongThieu === '') xau.push(`lời cầu '${id}' không nêu dục vọng nào bị chặn`);
        if (!s.entities.has(p.nguoiCauId))
          xau.push(`lời cầu '${id}' có người cầu '${p.nguoiCauId}' không tồn tại`);
        if (p.thanNhanId !== null && !s.entities.has(p.thanNhanId)) {
          xau.push(`lời cầu '${id}' gọi tên '${p.thanNhanId}' không tồn tại`);
        }
        // [BB] 22.3 — trả lời rồi thì phải ghi CÁCH trả lời, kể cả làm ngơ.
        if (p.daTraLoi && p.cachTraLoi === 'chua') {
          xau.push(`lời cầu '${id}' đánh dấu đã trả lời nhưng không ghi cách`);
        }
      }
      return xau;
    },
  });

  /**
   * [BB] 69.2 — "thần cũng bị ràng buộc".
   * Một giao ước chỉ trói bên dưới thì không phải giao ước.
   */
  dangKyInvariant({
    id: 'giao_uoc_rang_buoc_hai_ben',
    ten: 'Giao ước phải ràng buộc cả hai bên',
    mucDo: 'fatal',
    kiem: (s, phamVi) => {
      const xau: string[] = [];
      for (const id of idCanKiem(s, phamVi)) {
        const e = s.entities.get(id);
        if (!e || e.kind !== 'covenant') continue;
        const g = doc<GiaoUoc>(e, 'giao_uoc');
        if (!g) {
          xau.push(`'${id}' là giao ước nhưng thiếu aspect 'giao_uoc'`);
          continue;
        }
        if (!s.entities.has(g.benAId)) xau.push(`giao ước '${id}' có bên A '${g.benAId}' không tồn tại`);
        if (!s.entities.has(g.benBId)) xau.push(`giao ước '${id}' có bên B '${g.benBId}' không tồn tại`);
        if (!giaoUocCanBang(g)) {
          xau.push(`giao ước '${id}' chỉ ràng buộc một bên — đó là mệnh lệnh, không phải giao ước`);
        }
      }
      return xau;
    },
  });
}
