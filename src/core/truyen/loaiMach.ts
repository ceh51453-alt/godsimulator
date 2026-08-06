/**
 * Mười bốn loại mạch truyện — Phần 28.3 [MR] + tám loại đã khai ở Phase 0.
 *
 * ── Vì sao file này không nằm trong `registry/misc.ts` ──
 *
 * [BB] 61.2: manifest thuần dữ liệu tách khỏi runtime handler. `tienDe`,
 * `duongCangThang` và `sinhNhip` là hàm, nên chúng ở đây và được tra theo
 * `handlerId` — cùng cách `world/process/index.ts` nối mười hai tiến trình nền.
 *
 * ── Vì sao tiền đề được DÒ chứ không được khai ──
 *
 * [BB] 28.4: mỗi `tienDe(w)` quét thế giới thật tìm ứng viên. Không có bảng
 * "kịch bản có sẵn", không có cây nhánh viết tay. Một mạch báo thù tồn tại vì có
 * hai người thật sự ghét nhau tới mức ấy, chứ không vì ai đó viết nó vào file.
 * Hệ quả trực tiếp: save cũ không có bảng `storylines` vẫn sinh lại được toàn bộ
 * mạch truyện của nó ở nhịp kế tiếp.
 *
 * [BB] 28.5: `sinhNhip()` là ENGINE THUẦN. Không LLM. Đó là lý do 24 mạch chạy
 * song song mà chi phí bằng 0.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Rng } from '../engine/rng.js';
import type { GiaiDoanMach, NhanVatMach, Storyline, VaiTroMach } from '../schema/truyen.js';
import type { LoaiCamXuc } from '../schema/aspect/soul.js';
import { KHAI_NIEM_NEN_CUA_TRUC } from '../vatly/schema.js';
import { daThanhHinh } from '../schema/aspect/conceptual.js';

/** Một ứng viên mạch truyện mà `tienDe()` dò được từ thế giới thật. */
export type UngVienMach = {
  readonly loai: string;
  /** Nhân vật, đã có vai. Phần tử đầu là vai `chinh`. */
  readonly nhanVat: readonly NhanVatMach[];
  readonly ten: string;
  /** Vì sao engine cho rằng mạch này đang thành hình — vào `kyUcMach` dòng đầu. */
  readonly vi: string;
  /** Căng thẳng khởi điểm 0–100. */
  readonly cangThangDau: number;
};

/**
 * Thay đổi trạng thái mà một nhịp truyện áp vào world — `bienDoiTrangThai` của 28.5.
 *
 * ── Vì sao chỉ có KÝ ỨC và CẢM XÚC ──
 *
 * Mười hai tiến trình nền của 71.2 đã sở hữu vật chất: mùa màng, kho, dân số,
 * thương vong. Cho tầng tự sự ghi vào những chỗ ấy là mở một đường thứ hai để
 * của cải xuất hiện, và [BB] 71.4 quy tắc 1 sẽ phải phân xử `set` đụng `set` mỗi
 * tick. Tệ hơn: một mạch truyện "chiến tranh" sẽ trừ dân số **thêm một lần nữa**
 * bên cạnh `conflict_security`, và không ai thấy vì cả hai đều hợp lệ.
 *
 * Thứ tầng tự sự thật sự sở hữu là thứ không tiến trình nào ghi: **người ta nhớ
 * gì, và người ta cảm thấy gì về ai.** Đó cũng đúng là hai thứ khiến nhân vật
 * hành động khác đi ở nhịp sau — utility AI (23) đọc `ducVong` và `tamTrang`,
 * còn `soul.kyUc` thành chunk `ky_uc_thuc_the` cho truy hồi (54.2).
 *
 * Nói cách khác: mạch truyện không đổi thế giới bằng cách dời của cải. Nó đổi
 * thế giới bằng cách để lại dấu trong người.
 */
export type BienDoiTuSu =
  | { readonly loai: 'ky_uc'; readonly entityId: string; readonly tomTat: string; readonly dienTich: number }
  | {
      readonly loai: 'cam_xuc';
      readonly entityId: string;
      readonly camXuc: LoaiCamXuc;
      readonly doiTuongId: string | null;
      readonly cuongDo: number;
    };

/** Một nhịp truyện. Engine áp `bienDoiTrangThai` vào world và sinh Event. */
export type Beat = {
  readonly moTa: string;
  readonly nhanVatLienQuan: readonly string[];
  readonly cangThangDelta: number;
  readonly giaiDoanMoi?: GiaiDoanMach;
  readonly nutThatMoi?: string;
  /** Phục bút mới gieo: engine ghi vào Sổ Phục Bút — 30.2. */
  readonly phucButMoi?: { noiDung: string; loai: string; hanTraToiDa: number | null; doNang: number };
  /** Mạch tự tuyên kết thúc. Đi kèm `giaiDoanMoi = 'du_am' | 'chet_yeu'`. */
  readonly ketCuc?: string;
  /** [BB] 28.5 — engine áp cái này vào world rồi mới sinh Event. */
  readonly bienDoiTrangThai?: readonly BienDoiTuSu[];
};

export type HandlerLoaiMach = {
  readonly tienDe: (s: WorldState) => readonly UngVienMach[];
  readonly duongCangThang: (gd: GiaiDoanMach) => number;
  readonly sinhNhip: (m: Storyline, s: WorldState, rng: Rng) => Beat;
};

// ─────────────────────────────────────────── tiện ích đọc thế giới

function aspect<T>(e: Entity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a === undefined || a === null ? undefined : (a as T);
}

function ten(s: WorldState, id: string): string {
  return s.entities.get(id)?.ten ?? id;
}

/** Duyệt entity theo id đã sắp — luật bất biến #7 cấm thứ tự phụ thuộc Map. */
function moiEntity(s: WorldState): readonly Entity[] {
  return [...s.entities.keys()]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((id) => s.entities.get(id))
    .filter((e): e is Entity => e !== undefined);
}

const vai = (entityId: string, vaiTro: VaiTroMach, trongSo = 50): NhanVatMach => ({
  entityId,
  vaiTro,
  trongSo,
});

/**
 * Quan hệ một chiều nằm trong hồn của CHÍNH chủ thể (ADR-0033), nên đọc
 * `soul.quanHe[đối tượng]` chứ không đi tìm một bảng quan hệ chung.
 */
type TrucQuanHe = { yeuGhet?: number; tinNgo?: number; thanSo?: number; noOn?: number };

function quanHeCua(e: Entity | undefined, doiTuongId: string): TrucQuanHe | undefined {
  const soul = aspect<{ quanHe?: Record<string, TrucQuanHe> }>(e, 'soul');
  return soul?.quanHe?.[doiTuongId];
}

function moiQuanHe(e: Entity | undefined): readonly [string, TrucQuanHe][] {
  const soul = aspect<{ quanHe?: Record<string, TrucQuanHe> }>(e, 'soul');
  const q = soul?.quanHe ?? {};
  return Object.keys(q)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((k) => [k, q[k] as TrucQuanHe]);
}

function ducVong(e: Entity | undefined): Record<string, number> {
  return aspect<{ ducVong?: Record<string, number> }>(e, 'soul')?.ducVong ?? {};
}

/**
 * Chu kỳ trỗi dậy theo `adversarial.nhip`, tính bằng TICK.
 *
 * ADR-0019: một tick là một MÙA, bốn tick là một năm. `null` nghĩa là không có
 * nhịp — kẻ thù ấy chỉ tới ở hồi kết, nên nó không sinh mạch truyện định kỳ.
 */
const CHU_KY_TROI_DAY: Readonly<Record<string, number | null>> = Object.freeze({
  hang_dem: 4,
  theo_mua: 1,
  moi_ky_nguyen: 200,
  chi_o_tan_the: null,
});

// ─────────────────────────────────────────── đường căng thẳng chung

/**
 * Đường căng thẳng mặc định của 28.5: `am_i → khoi → phat_trien → cao_trao →
 * ha_man → du_am`. Delta dương ở nửa đầu, âm ở nửa sau.
 */
const DUONG_MAC_DINH: Readonly<Record<GiaiDoanMach, number>> = Object.freeze({
  am_i: 4,
  khoi: 8,
  phat_trien: 11,
  cao_trao: 16,
  ha_man: -14,
  du_am: -9,
  chet_yeu: -20,
});

const duongChuan = (gd: GiaiDoanMach): number => DUONG_MAC_DINH[gd];

/** Đường của mạch chậm: mọi delta co lại, nên nó ngồi lâu ở mỗi giai đoạn. */
const duongCham = (gd: GiaiDoanMach): number => Math.round(DUONG_MAC_DINH[gd] * 0.6);

/** Đường của mạch bùng: cao trào tới nhanh và tới mạnh. */
const duongBung = (gd: GiaiDoanMach): number =>
  gd === 'cao_trao' ? 26 : Math.round(DUONG_MAC_DINH[gd] * 1.3);

// ─────────────────────────────────────────── bộ dựng nhịp dùng chung

/**
 * Nhịp mặc định: mô tả theo giai đoạn + nhân vật, không chạm state.
 *
 * [BB] Một nhịp KHÔNG bắt buộc phải đổi thế giới. Rất nhiều nhịp chỉ là "áp lực
 * dâng thêm một nấc" — và đó vẫn là dữ liệu thật, vì `cangThang` là thứ ống kính
 * dùng để chọn chỗ chiếu tới.
 */
function nhipTheoMau(
  m: Storyline,
  s: WorldState,
  rng: Rng,
  mau: Readonly<Partial<Record<GiaiDoanMach, readonly string[]>>>,
  duong: (gd: GiaiDoanMach) => number,
  /** Cảm xúc mà nhịp cao trào của loại này để lại. `null` = không để lại gì. */
  camXucCua: LoaiCamXuc | null = null,
): Beat {
  const chinh = m.nhanVat.find((n) => n.vaiTro === 'chinh');
  const doi = m.nhanVat.find((n) => n.vaiTro === 'doi_dau');
  const tenChinh = chinh ? ten(s, chinh.entityId) : 'một kẻ không tên';
  const tenDoi = doi ? ten(s, doi.entityId) : 'phía bên kia';

  const ds = mau[m.giaiDoan] ?? ['Sự việc đi thêm một bước mà không ai gọi tên được.'];
  const cau = (ds[rng.nguyen(ds.length)] ?? ds[0] ?? '')
    .replace(/\{chinh\}/g, tenChinh)
    .replace(/\{doi\}/g, tenDoi);

  return {
    moTa: cau,
    nhanVatLienQuan: m.nhanVat.map((n) => n.entityId),
    cangThangDelta: duong(m.giaiDoan),
    bienDoiTrangThai: dauDeLai(m, cau, camXucCua),
  };
}

/**
 * Nhịp nào để lại dấu, và dấu gì.
 *
 * [BB] 28.5 — "rất nhiều nhịp chỉ là áp lực dâng thêm một nấc". Nếu MỌI nhịp đều
 * ghi một mảnh ký ức thì sau một trăm năm mỗi người mang vài trăm mảnh, chỉ mục
 * truy hồi phình lên, và MMR phải làm việc của một bộ lọc rác. Nên chỉ hai giai
 * đoạn để lại dấu:
 *
 *   `cao_trao` — cái ngày mà về sau người ta hay kể lại;
 *   `ha_man`   — lúc người ta hiểu ra chuyện vừa xảy ra là chuyện gì.
 *
 * Cảm xúc thì luôn có đối tượng và nguyên nhân — [BB] `SoulSchema` nói cảm xúc
 * không có đối tượng là cảm xúc vô dụng.
 */
function dauDeLai(m: Storyline, moTa: string, camXuc: LoaiCamXuc | null): readonly BienDoiTuSu[] | undefined {
  if (m.giaiDoan !== 'cao_trao' && m.giaiDoan !== 'ha_man') return undefined;

  const ra: BienDoiTuSu[] = [];
  const doi = m.nhanVat.find((n) => n.vaiTro === 'doi_dau');

  for (const n of m.nhanVat) {
    // Vai chứng kiến và vai xúc tác không mang ký ức nặng — họ đứng ngoài.
    if (n.vaiTro === 'chung_kien' || n.vaiTro === 'xuc_tac') continue;
    ra.push({
      loai: 'ky_uc',
      entityId: n.entityId,
      tomTat: moTa,
      // Cao trào in sâu hơn hạ màn, và vai chính in sâu hơn vai phụ.
      dienTich: Math.min(100, (m.giaiDoan === 'cao_trao' ? 55 : 35) + n.trongSo / 4),
    });

    if (camXuc !== null && doi !== undefined && doi.entityId !== n.entityId) {
      ra.push({
        loai: 'cam_xuc',
        entityId: n.entityId,
        camXuc,
        doiTuongId: doi.entityId,
        cuongDo: Math.min(100, 40 + m.cangThang / 3),
      });
    }
  }
  return ra.length === 0 ? undefined : ra;
}

// ─────────────────────────────────────────── mười bốn loại

/**
 * `phuc_thu` (28.3) — hai entity `yeuGhet < -60`, lệch `noOn`, một bên
 * `ducVong.baoThu` cao. Registry Phase 0 đã đăng ký id `bao_thu` cho cùng ý
 * niệm; ADR-0037 giữ id cũ và dùng ĐÚNG tiền đề của 28.3.
 */
const baoThu: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      const dv = ducVong(e);
      for (const [doiId, q] of moiQuanHe(e)) {
        if ((q.yeuGhet ?? 0) >= -60) continue;
        if (!s.entities.has(doiId)) continue;
        const nguoc = quanHeCua(s.entities.get(doiId), e.id);
        // "Lệch noOn": một bên thấy mình bị nợ, bên kia không thấy mình nợ ai.
        const lech = Math.abs((q.noOn ?? 0) - (nguoc?.noOn ?? 0));
        if (lech < 20 && (dv['baoThu'] ?? 0) < 50) continue;
        ra.push({
          loai: 'bao_thu',
          ten: `Món nợ giữa ${e.ten} và ${ten(s, doiId)}`,
          nhanVat: [vai(e.id, 'chinh', 80), vai(doiId, 'doi_dau', 70)],
          vi: `${e.ten} nhớ một việc mà ${ten(s, doiId)} đã quên.`,
          cangThangDau: Math.min(60, 20 + lech / 2),
        });
      }
    }
    return ra;
  },
  duongCangThang: duongBung,
  sinhNhip(m, s, rng) {
    const b = nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['{chinh} vẫn chưa nói ra điều đó với ai.', 'Có người thấy {chinh} đứng rất lâu ở chỗ cũ.'],
        khoi: ['{chinh} bắt đầu hỏi thăm về {doi}.', '{chinh} tìm tới người từng có mặt hôm ấy.'],
        phat_trien: [
          '{chinh} thu xếp được thứ mình còn thiếu.',
          'Một người quen của {doi} kể lại nhiều hơn mức nên kể.',
        ],
        cao_trao: ['{chinh} và {doi} đứng đối diện nhau.', 'Việc phải xảy ra thì đã xảy ra.'],
        ha_man: ['Người ta bắt đầu kể lại chuyện theo cách của họ.'],
        du_am: ['Món nợ đã trả, nhưng nó để lại một chỗ trống không ai lấp.'],
        chet_yeu: ['{chinh} già đi, và việc ấy thành một chuyện cũ không ai nhắc.'],
      },
      duongBung,
      'phan_no',
    );
    if (m.giaiDoan === 'khoi') {
      return {
        ...b,
        nutThatMoi: `${ten(s, m.nhanVat[0]?.entityId ?? '')} chưa có cách tới gần đối phương.`,
        phucButMoi: {
          noiDung: b.moTa,
          loai: 'mon_no',
          hanTraToiDa: m.nhipMoi * 5,
          doNang: 70,
        },
      };
    }
    return b;
  },
};

/** `ke_vi` (28.3) — người cầm quyền không có người kế + ≥2 ứng viên quyền lực cao. */
const keVi: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      const tc = aspect<{
        keVi?: string;
        chucVu?: { id: string; ten: string; nguoiGiuId?: string | null }[];
      }>(e, 'institutional');
      if (!tc) continue;
      // `khong_co` nghĩa là thiết chế CHƯA có luật kế vị — đúng tiền đề 28.3.
      if (tc.keVi !== 'khong_co') continue;
      for (const cv of tc.chucVu ?? []) {
        if (!cv.nguoiGiuId || !s.entities.has(cv.nguoiGiuId)) continue;
        const ungVien = moiEntity(s)
          .filter((x) => x.id !== cv.nguoiGiuId && (ducVong(x)['quyenLuc'] ?? 0) >= 20)
          .slice(0, 3);
        if (ungVien.length < 2) continue;
        const a = ungVien[0];
        const b = ungVien[1];
        if (!a || !b) continue;
        ra.push({
          loai: 'ke_vi',
          ten: `Ghế ${cv.ten} sau ${ten(s, cv.nguoiGiuId)}`,
          nhanVat: [vai(cv.nguoiGiuId, 'chinh', 70), vai(a.id, 'doi_dau', 60), vai(b.id, 'xuc_tac', 50)],
          vi: `${ten(s, cv.nguoiGiuId)} chưa chỉ ai nối ghế, và đã có người đếm ngày.`,
          cangThangDau: 30,
        });
      }
    }
    return ra;
  },
  duongCangThang: duongChuan,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['Chưa ai dám hỏi {chinh} về chuyện sau này.'],
        khoi: ['{doi} bắt đầu đi lại nhiều hơn với những người có tiếng nói.'],
        phat_trien: ['Hai phía đã đếm được số người đứng về phía mình.'],
        cao_trao: ['Ghế đổi chủ, và không phải ai cũng chấp nhận cách nó đổi.'],
        ha_man: ['Người thua giữ lại một danh sách trong đầu.'],
        du_am: ['Ai nắm ghế cũng phải sống với cách mình đã nắm nó.'],
        chet_yeu: ['{chinh} vẫn ngồi đó, và câu hỏi kia lùi lại một thế hệ.'],
      },
      duongChuan,
      'ghen_ti',
    );
  },
};

/** `chien_tranh` (28.3) — hai phe tranh tài nguyên/lãnh địa, `tinNgo` giữa họ rất thấp. */
const chienTranh: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      const an = aspect<{
        deDoa?: number;
        xungDot?: { doiThuId: string; cuongDo?: number; tickKetThuc?: number | null }[];
      }>(e, 'an_ninh');
      const kt = aspect<{ thieuHut?: number }>(e, 'kinh_te');
      const thieu = (kt?.thieuHut ?? 0) > 0.2;
      const dangDanh = (an?.xungDot ?? []).filter(
        (x) => x.tickKetThuc === null || x.tickKetThuc === undefined,
      );
      for (const xd of dangDanh) {
        if (!s.entities.has(xd.doiThuId)) continue;
        if ((an?.deDoa ?? 0) < 30 && (xd.cuongDo ?? 0) < 30 && !thieu) continue;
        ra.push({
          loai: 'chien_tranh',
          ten: `${e.ten} và ${ten(s, xd.doiThuId)}`,
          nhanVat: [vai(e.id, 'chinh', 70), vai(xd.doiThuId, 'doi_dau', 70)],
          vi: thieu ? 'Hai bên cùng thiếu một thứ mà chỉ một bên giữ được.' : 'Hai bên đã thôi tin nhau.',
          cangThangDau: 35,
        });
      }
    }
    return ra;
  },
  duongCangThang: duongBung,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['Người hai bên thôi đi lại qua chỗ cũ.'],
        khoi: ['Một chuyến hàng của {chinh} không tới được nơi cần tới.'],
        phat_trien: ['{doi} dựng thêm người canh ở ranh giới.'],
        cao_trao: ['Máu đổ ở ranh giới, và cả hai bên đều nói mình bị đánh trước.'],
        ha_man: ['Người ta đếm lại xem còn ai.'],
        du_am: ['Ranh giới đổi chỗ, và cái tên cũ vẫn còn trong miệng người già.'],
        chet_yeu: ['Cả hai bên đều đói quá để đánh nhau.'],
      },
      duongBung,
      'so_hai',
    );
  },
};

/** `ly_giao` (28.3) — một luật có `dienGiai` lệch > 50 giữa hai vùng. */
const lyGiao: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      if (e.kind !== 'law') continue;
      const l = aspect<{ dienGiai?: { vungId?: string; doLech?: number }[] }>(e, 'lawful');
      const ds = [...(l?.dienGiai ?? [])].sort((a, b) => (a.doLech ?? 0) - (b.doLech ?? 0));
      const thap = ds[0];
      const cao = ds[ds.length - 1];
      if (!thap || !cao || (cao.doLech ?? 0) - (thap.doLech ?? 0) <= 50) continue;
      ra.push({
        loai: 'ly_giao',
        ten: `Hai cách hiểu ${e.ten}`,
        nhanVat: [
          vai(cao.vungId ?? e.id, 'chinh', 60),
          vai(thap.vungId ?? e.id, 'doi_dau', 60),
          vai(e.id, 'xuc_tac', 40),
        ],
        vi: `Cùng một luật, hai vùng hiểu lệch nhau ${Math.round((cao.doLech ?? 0) - (thap.doLech ?? 0))} phần.`,
        cangThangDau: 25,
      });
    }
    return ra;
  },
  duongCangThang: duongCham,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['Hai nơi làm cùng một nghi thức theo hai cách, và chưa ai đối chiếu.'],
        khoi: ['Một người đi từ {chinh} sang {doi} và thấy họ làm sai.'],
        phat_trien: ['Mỗi bên bắt đầu nói bên kia đã bỏ mất cái gốc.'],
        cao_trao: ['Hai bên thôi coi nhau là cùng một đạo.'],
        ha_man: ['Có người đứng giữa và bị cả hai bên nghi.'],
        du_am: ['Từ nay có hai cái tên cho cùng một điều.'],
        chet_yeu: ['Người còn nhớ cách cũ đã chết, nên chẳng còn gì để cãi.'],
      },
      duongCham,
      'khinh_bi',
    );
  },
};

/** `am_muu` (28.3) — `tratTu_phongTung < -40`, `triThuc` cao, gần một kẽ hở chưa khai thác. */
const amMuu: HandlerLoaiMach = {
  tienDe(s) {
    // Kẽ hở là chuyện của LUẬT (`lawful.keHo`), không phải một dòng trong `gaps`.
    const luatCoKeHo = moiEntity(s).find((x) => {
      const l = aspect<{ keHo?: { daBiKhaiThac?: boolean }[] }>(x, 'lawful');
      return (l?.keHo ?? []).some((k) => k.daBiKhaiThac !== true);
    });
    if (!luatCoKeHo) return [];
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      const cs = aspect<{ coreSelf?: Record<string, number> }>(e, 'ban_nga')?.coreSelf ?? {};
      const tt = ducVong(e)['triThuc'] ?? 0;
      if ((cs['tratTu_phongTung'] ?? 0) >= -40 || tt < 20) continue;
      ra.push({
        loai: 'am_muu',
        ten: `Điều ${e.ten} định làm`,
        nhanVat: [vai(e.id, 'chinh', 80), vai(luatCoKeHo.id, 'xuc_tac', 40)],
        vi: `${e.ten} nhìn ra một chỗ mà ${luatCoKeHo.ten} không với tới.`,
        cangThangDau: 20,
      });
    }
    return ra;
  },
  duongCangThang: duongCham,
  sinhNhip(m, s, rng) {
    const b = nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['{chinh} hỏi một câu vô hại với đúng người biết trả lời.'],
        khoi: ['{chinh} thử một lần nhỏ, và không ai để ý.'],
        phat_trien: ['{chinh} đã có đủ người, và mỗi người chỉ biết phần của mình.'],
        cao_trao: ['Việc xảy ra, và nó không giống điều ai đó đã dự tính.'],
        ha_man: ['Người ta đi tìm kẻ chủ mưu, và tìm nhầm.'],
        du_am: ['Cái kẽ hở ấy từ nay có tên.'],
        chet_yeu: ['{chinh} đổi ý, hoặc chết trước khi kịp làm.'],
      },
      duongCham,
      'so_hai',
    );
    return m.giaiDoan === 'am_i'
      ? {
          ...b,
          phucButMoi: { noiDung: b.moTa, loai: 'bi_mat', hanTraToiDa: m.nhipMoi * 6, doNang: 60 },
        }
      : b;
  },
};

/** `tinh_ai` (28.3) — `yeuGhet` cao + `thanSo` cao nhưng bị một luật hoặc phe cản. */
const tinhAi: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    // "Bị một luật cản" — luật có hiệu ứng thật, tức đã kết tinh xong (43.1).
    // Hoisted ra ngoài hai vòng lặp: nó không phụ thuộc cặp đang xét, và để nó
    // bên trong biến bộ dò này thành O(n³) trên một thế giới vài trăm entity.
    const canTro = moiEntity(s).find(
      (x) => x.kind === 'law' && (aspect<{ hieuUng?: unknown[] }>(x, 'lawful')?.hieuUng ?? []).length > 0,
    );
    if (!canTro) return ra;

    for (const e of moiEntity(s)) {
      for (const [doiId, q] of moiQuanHe(e)) {
        if ((q.yeuGhet ?? 0) < 55 || (q.thanSo ?? 0) < 50) continue;
        if (!s.entities.has(doiId)) continue;
        ra.push({
          loai: 'tinh_ai',
          ten: `${e.ten} và ${ten(s, doiId)}`,
          nhanVat: [vai(e.id, 'chinh', 70), vai(doiId, 'chinh', 70), vai(canTro.id, 'doi_dau', 50)],
          vi: `Có một điều giữa hai người mà ${canTro.ten} không cho phép.`,
          cangThangDau: 25,
        });
      }
    }
    return ra;
  },
  duongCangThang: duongChuan,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['Hai người tìm ra lý do để đi cùng đường.'],
        khoi: ['Có người thấy, và có người nói lại.'],
        phat_trien: ['Cái giá đã rõ, và cả hai đều biết nó là bao nhiêu.'],
        cao_trao: ['Họ chọn, và lựa chọn ấy không hoàn tác được.'],
        ha_man: ['Người xung quanh xếp lại chỗ đứng của mình.'],
        du_am: ['Chuyện của họ được kể lại sai đi một chút mỗi lần.'],
        chet_yeu: ['Một trong hai người thôi tìm cách, và thế là hết.'],
      },
      duongChuan,
      'yeu_thuong',
    );
  },
};

/** `kham_pha` (28.3) — tồn tại một `gap` bí ẩn và một NPC `ducVong.triThuc` cao ở gần. */
const khamPha: HandlerLoaiMach = {
  tienDe(s) {
    const biAn = [...s.gaps.values()]
      .filter((g) => g.trangThai === 'mo' || g.trangThai === 'thanh_bi_an')
      .sort((a, b) => (a.id < b.id ? -1 : 1))[0];
    if (!biAn) return [];
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      if ((ducVong(e)['triThuc'] ?? 0) < 20) continue;
      ra.push({
        loai: 'kham_pha',
        ten: `Điều ${e.ten} muốn biết`,
        nhanVat: [vai(e.id, 'chinh', 75), vai(biAn.chuTheId ?? biAn.id, 'xuc_tac', 40)],
        vi: biAn.moTa,
        cangThangDau: 15,
      });
    }
    return ra;
  },
  duongCangThang: duongCham,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['{chinh} ghi lại một điều mình không giải thích được.'],
        khoi: ['{chinh} đi hỏi những người lẽ ra phải biết.'],
        phat_trien: ['Câu trả lời đầu tiên hóa ra là sai.'],
        cao_trao: ['{chinh} thấy điều mình tìm, và nó không phải thứ mình mong.'],
        ha_man: ['{chinh} kể lại, và phần lớn người nghe không tin.'],
        du_am: ['Một cái tên mới được thêm vào những thứ người ta biết.'],
        chet_yeu: ['{chinh} bỏ dở, và ghi chép của họ thất lạc.'],
      },
      duongCham,
      'hy_vong',
    );
  },
};

/** `cuu_the` (28.3) — kẻ thù vĩnh cửu sắp trỗi dậy + một tiên tri chưa ứng. */
const troiDay: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      const kt = aspect<{ nhip?: string; lanCuoiTroiDay?: number }>(e, 'adversarial');
      if (!kt) continue;
      const chuKy = CHU_KY_TROI_DAY[kt.nhip ?? 'moi_ky_nguyen'];
      // `chi_o_tan_the` không có nhịp: nó chỉ tới khi thế giới tới hồi kết.
      if (chuKy === null || chuKy === undefined) continue;
      const daCho = s.world.tick - (kt.lanCuoiTroiDay ?? 0);
      if (daCho < chuKy * 0.8) continue;
      const tienTri = moiEntity(s).find((x) => (ducVong(x)['triThuc'] ?? 0) >= 20);
      ra.push({
        loai: 'troi_day',
        ten: `${e.ten} đến hạn`,
        nhanVat: [vai(e.id, 'doi_dau', 90), ...(tienTri ? [vai(tienTri.id, 'chinh', 60)] : [])],
        vi: `Nhịp của ${e.ten} đã gần: ${daCho} nhịp kể từ lần trước.`,
        cangThangDau: 40,
      });
    }
    return ra;
  },
  duongCangThang: duongBung,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['Có những dấu nhỏ mà chỉ người biết mới đọc được.'],
        khoi: ['{chinh} nói ra, và bị coi là kẻ dọa người.'],
        phat_trien: ['Dấu hiệu đủ nhiều để người thường cũng thấy.'],
        cao_trao: ['{doi} trỗi dậy đúng nhịp của nó.'],
        ha_man: ['Thứ còn lại phải được dựng lại từ đầu.'],
        du_am: ['Người ta ghi lại nhịp ấy, để lần sau đỡ bất ngờ.'],
        chet_yeu: ['Nhịp trôi qua và không có gì xảy ra — lần này.'],
      },
      duongBung,
      'tuyet_vong',
    );
  },
};

/** `suy_tan` (28.3) — một thần `domainStrength` giảm liên tục ba kỷ nguyên. */
const suyTan: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      if (e.kind !== 'deity') continue;
      const d = aspect<{ domains?: { ten: string; suc?: number; trangThai?: string }[] }>(e, 'domain');
      for (const dom of d?.domains ?? []) {
        // ADR-0038: `DomainState` không lưu lịch sử theo kỷ nguyên, nên tiền đề
        // đọc TRẠNG THÁI CUỐI của cùng đường suy — yếu, và đã thôi được giữ.
        const yeu = (dom.suc ?? 50) <= 25;
        const buong =
          dom.trangThai !== undefined && dom.trangThai !== 'held' && dom.trangThai !== 'contested';
        if (!yeu && !buong) continue;
        ra.push({
          loai: 'suy_tan',
          ten: `${e.ten} nhạt dần`,
          nhanVat: [vai(e.id, 'chinh', 80)],
          vi: `Domain "${dom.ten}" của ${e.ten} chỉ còn ${Math.round(dom.suc ?? 0)} phần sức.`,
          cangThangDau: 20,
        });
      }
    }
    return ra;
  },
  duongCangThang: duongCham,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['Ít người tới đền của {chinh} hơn mùa trước.'],
        khoi: ['Một nghi thức bị bỏ vì không ai còn nhớ đủ.'],
        phat_trien: ['Người ta gọi tên khác cho cùng một việc {chinh} từng làm.'],
        cao_trao: ['Đền cuối cùng đóng cửa.'],
        ha_man: ['Tên {chinh} còn trong một bài hát mà không ai hiểu.'],
        du_am: ['{chinh} vẫn còn, và đó là phần khó nhất.'],
        chet_yeu: ['Không ai kịp nhận ra lúc nào là lần cuối.'],
      },
      duongCham,
      'buon_ba',
    );
  },
};

/**
 * `phan_boi` (28.3) — `tinNgo` cao nhưng `yeuGhet` đang giảm nhanh.
 *
 * [BB] 28.3 gọi đây là bằng chứng thiết kế quan hệ bốn trục có giá trị thật:
 * nó khai thác đúng KHE HỞ giữa hai trục, thứ mà một thang "thiện cảm" duy nhất
 * không thể biểu diễn.
 */
const phanBoi: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      for (const [doiId, q] of moiQuanHe(e)) {
        if (!s.entities.has(doiId)) continue;
        const tin = q.tinNgo ?? 0;
        const yeu = q.yeuGhet ?? 0;
        // Tin cậy còn cao trong khi tình cảm đã tụt xuống dưới 0 — đúng khe hở.
        if (tin < 60 || yeu > 0) continue;
        ra.push({
          loai: 'phan_boi',
          ten: `Khe hở giữa ${e.ten} và ${ten(s, doiId)}`,
          nhanVat: [vai(doiId, 'chinh', 70), vai(e.id, 'nan_nhan', 60)],
          vi: `${e.ten} vẫn giao việc cho ${ten(s, doiId)} trong khi đã thôi quý người ấy.`,
          cangThangDau: 30,
        });
      }
    }
    return ra;
  },
  duongCangThang: duongChuan,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['{chinh} vẫn được giao đúng những việc như trước.'],
        khoi: ['{chinh} giữ lại một chi tiết khi kể lại.'],
        phat_trien: ['{chinh} đã có chỗ để đi, nếu cần đi.'],
        cao_trao: ['{chinh} chọn phía kia, và {doi} biết muộn hơn mọi người.'],
        ha_man: ['{doi} rà lại từng việc cũ và thấy nhiều thứ khác đi.'],
        du_am: ['Từ đó {doi} không giao trọn việc gì cho ai nữa.'],
        chet_yeu: ['{chinh} ở lại, và không ai biết chuyện suýt xảy ra.'],
      },
      duongChuan,
      'phan_no',
    );
  },
};

/** `di_cu` — cộng đồng phải rời đi vì điều kiện sống đổi (loại của Phase 0). */
const diCu: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      const kt = aspect<{ thieuHut?: number }>(e, 'kinh_te');
      const thieu = kt?.thieuHut ?? 0;
      if (thieu <= 0.35) continue;
      ra.push({
        loai: 'di_cu',
        ten: `${e.ten} không nuôi đủ người của nó`,
        nhanVat: [vai(e.id, 'chinh', 60)],
        vi: `Thiếu ăn tới mức ${Math.round(thieu * 100)} phần trăm — phải tính đường khác.`,
        cangThangDau: 25,
      });
    }
    return ra;
  },
  duongCangThang: duongChuan,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['Vài nhà ở {chinh} bắt đầu tính lại số miệng ăn.'],
        khoi: ['Một người đi trước để xem đường.'],
        phat_trien: ['Nửa làng đã gói đồ, nửa còn lại thì không.'],
        cao_trao: ['Người đi và người ở lại chia tay nhau ở đầu đường.'],
        ha_man: ['Chỗ mới không giống điều người ta hình dung.'],
        du_am: ['Hai nơi cùng mang một cái tên trong hai thế hệ.'],
        chet_yeu: ['Mùa sau khá hơn, và không ai đi nữa.'],
      },
      duongChuan,
      'buon_ba',
    );
  },
};

/** `phat_kien` — ai đó tìm ra kẽ hở của một luật (loại của Phase 0). */
const phatKien: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    const luat = moiEntity(s).find((x) => {
      const l = aspect<{ keHo?: { daBiKhaiThac?: boolean }[] }>(x, 'lawful');
      return (l?.keHo ?? []).some((k) => k.daBiKhaiThac !== true);
    });
    if (!luat) return ra;
    for (const e of moiEntity(s)) {
      const ky = aspect<{ kyNang?: Record<string, number> }>(e, 'mortal')?.kyNang ?? {};
      if (Math.max(0, ...Object.values(ky)) < 40) continue;
      ra.push({
        loai: 'phat_kien',
        ten: `Cách làm mới của ${e.ten}`,
        nhanVat: [vai(e.id, 'chinh', 70), vai(luat.id, 'xuc_tac', 35)],
        vi: `Có một chỗ trong ${luat.ten} mà chưa ai đi qua.`,
        cangThangDau: 15,
      });
    }
    return ra;
  },
  duongCangThang: duongCham,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['{chinh} làm hỏng một mẻ theo một kiểu mới.'],
        khoi: ['Lần thứ hai thì nó không hỏng.'],
        phat_trien: ['Có người trả tiền để {chinh} làm lại cách ấy.'],
        cao_trao: ['Cách cũ thôi được dùng ở đây.'],
        ha_man: ['Người sống bằng cách cũ phải học lại từ đầu.'],
        du_am: ['Không ai còn nhớ trước đó người ta làm thế nào.'],
        chet_yeu: ['{chinh} không dạy ai, và cách ấy chết theo họ.'],
      },
      duongCham,
      'hy_vong',
    );
  },
};

/** `tranh_domain` — hai thần cùng tuyên một sự kiện lớn (loại của Phase 0). */
const tranhDomain: HandlerLoaiMach = {
  tienDe(s) {
    const than = moiEntity(s).filter((e) => e.kind === 'deity');
    const ra: UngVienMach[] = [];
    for (let i = 0; i < than.length; i++) {
      for (let j = i + 1; j < than.length; j++) {
        const a = than[i];
        const b = than[j];
        if (!a || !b) continue;
        const da = aspect<{ domains?: { ten: string }[] }>(a, 'domain')?.domains ?? [];
        const db = aspect<{ domains?: { ten: string }[] }>(b, 'domain')?.domains ?? [];
        const chung = da.find((x) => db.some((y) => y.ten === x.ten));
        if (!chung) continue;
        ra.push({
          loai: 'tranh_domain',
          ten: `${a.ten} và ${b.ten} cùng nhận ${chung.ten}`,
          nhanVat: [vai(a.id, 'chinh', 70), vai(b.id, 'doi_dau', 70)],
          vi: `Hai vị cùng đứng tên một domain.`,
          cangThangDau: 30,
        });
      }
    }
    return ra;
  },
  duongCangThang: duongChuan,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['Hai đền cùng nhận công một việc.'],
        khoi: ['Tín đồ bắt đầu hỏi ai mới là người làm.'],
        phat_trien: ['Mỗi bên kể một phiên bản, và cả hai đều có nhân chứng.'],
        cao_trao: ['Một bên mất phần lớn người thờ trong một mùa.'],
        ha_man: ['Bên thắng phải nhận cả những việc mình không làm.'],
        du_am: ['Domain ấy từ nay gắn với một cái tên duy nhất.'],
        chet_yeu: ['Người ta thờ cả hai và thôi phân biệt.'],
      },
      duongChuan,
      'ghen_ti',
    );
  },
};

/**
 * `doi_thuong` — một mùa gặt, một đám cưới, một cái chết không ai ghi lại.
 *
 * [BB] Loại này quan trọng hơn vẻ ngoài của nó: nó là nguồn cung mạch truyện
 * KHÔNG có người chơi, tức là thứ nuôi hạn ngạch vắng mặt 28.6. Bỏ nó đi thì
 * mọi mạch truyện đều phải xoay quanh một xung đột lớn, và thế giới lập tức
 * biến thành một sân khấu.
 */
const doiThuong: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      const m = aspect<{ nghe?: string }>(e, 'mortal');
      if (!m) continue;
      ra.push({
        loai: 'doi_thuong',
        ten: `Một quãng đời của ${e.ten}`,
        nhanVat: [vai(e.id, 'chinh', 50)],
        vi: `${e.ten} sống tiếp, và không ai ghi lại điều đó.`,
        cangThangDau: 8,
      });
    }
    return ra;
  },
  duongCangThang: duongCham,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['{chinh} làm việc của mình, như mọi ngày.'],
        khoi: ['{chinh} nhận thêm một việc mà mình chưa làm bao giờ.'],
        phat_trien: ['{chinh} khá lên một chút, và điều đó tốn của họ cái gì đó.'],
        cao_trao: ['Có một ngày trong đời {chinh} mà về sau họ hay kể lại.'],
        ha_man: ['Mọi thứ trở về nhịp cũ, chỉ khác đi một ít.'],
        du_am: ['Người quanh {chinh} nhớ họ theo một chi tiết nhỏ.'],
        chet_yeu: ['Không có gì đặc biệt xảy ra, và đó cũng là một đời.'],
      },
      duongCham,
    );
  },
};

// ─────────────────────────────────────────── Phase 10 (43.2, 42.5)

/**
 * ĐẶT TÊN — [BB] 43.2.
 *
 * "Khoảnh khắc đó phải sinh một sự kiện lớn và một mạch truyện loại `dat_ten`.
 * Ngày một phàm nhân đầu tiên nghĩ ra khái niệm Thời Gian là một trong những
 * ngày quan trọng nhất trong lịch sử thế giới đó — và từ hôm ấy, thời gian có
 * thể bị bẻ."
 *
 * Tiền đề DÒ chứ không khai: một trục còn vô danh, khái niệm nền của nó đã ít
 * nhất thành hình, và có kẻ đủ tri thức để nói ra câu ấy.
 */
const datTen: HandlerLoaiMach = {
  tienDe(s) {
    const voDanh = [...s.substrateLaws.values()]
      .filter((l) => l.trangThai === 'vo_danh')
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    if (voDanh.length === 0) return [];

    const nen = moiEntity(s).filter((e) =>
      daThanhHinh(aspect<{ giaiDoan?: string }>(e, 'conceptual')?.giaiDoan),
    );
    if (nen.length === 0) return [];

    const ra: UngVienMach[] = [];
    for (const ln of voDanh) {
      const kn = nen.find((k) =>
        KHAI_NIEM_NEN_CUA_TRUC[ln.truc].some((h) => k.id.includes(h) || k.tags.includes(h)),
      );
      if (!kn) continue;
      // Người sẽ nói ra câu ấy: kẻ có tri thức cao nhất, tie-break theo id.
      const nguoi = moiEntity(s)
        .filter((e) => e.tickDiet === null && (ducVong(e)['triThuc'] ?? 0) >= 30)
        .sort((a, b) => (ducVong(b)['triThuc'] ?? 0) - (ducVong(a)['triThuc'] ?? 0))[0];
      if (!nguoi) continue;
      ra.push({
        loai: 'dat_ten',
        ten: `Câu đầu tiên về ${kn.ten}`,
        nhanVat: [vai(nguoi.id, 'chinh', 75), vai(kn.id, 'xuc_tac', 50)],
        vi: `${nguoi.ten} sắp gọi tên một thứ mà cả thế giới vẫn luôn sống trong đó mà không biết.`,
        cangThangDau: 12,
      });
    }
    return ra;
  },
  duongCangThang: duongCham,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['{chinh} thấy một điều lặp lại mãi mà chưa ai gọi nó là gì.'],
        khoi: ['{chinh} bắt đầu ghi lại những lần điều ấy xảy ra.'],
        phat_trien: ['Người ta cười {chinh}. Ghi chép vẫn dài thêm.'],
        cao_trao: ['{chinh} viết ra câu đầu tiên. Ông không biết mình vừa làm gì.'],
        ha_man: ['Vài người chép lại câu ấy. Rồi vài người nữa.'],
        du_am: ['Từ mùa đó, các thầy tế bắt đầu mơ những giấc mơ có thứ tự.'],
        chet_yeu: ['{chinh} chết trước khi kịp viết xong. Giấy tờ thất lạc.'],
      },
      duongCham,
    );
  },
};

/**
 * PHỤC HƯNG — [BB] 42.5 đường ngược lại.
 *
 * "Engine phải hỗ trợ đường ngược lại: **hồi sinh một luật đã chết** bằng cách
 * nuôi lại khái niệm nền. Một tà giáo phục dựng nghi lễ cổ có thể làm sống lại
 * một định luật bị lãng quên hàng nghìn năm."
 *
 * Tiền đề: có luật `hieuLuc = 0` mà mắt xích yếu nhất VẪN CÒN TỒN TẠI — tức là
 * nuôi lại được. Luật có khái niệm nền đã chết hẳn thì không vào đây.
 */
const phucHung: HandlerLoaiMach = {
  tienDe(s) {
    const ra: UngVienMach[] = [];
    for (const e of moiEntity(s)) {
      const l = aspect<{ hieuLuc?: number; tiepDia?: { khaiNiemId: string; batBuoc?: boolean }[] }>(
        e,
        'lawful',
      );
      if (!l || (l.hieuLuc ?? 0) > 0) continue;
      const nen = (l.tiepDia ?? []).filter((t) => t.batBuoc !== false);
      if (nen.length === 0) continue;
      const conSong = nen.find((t) => s.entities.get(t.khaiNiemId)?.tickDiet === null);
      if (!conSong) continue;
      const kn = s.entities.get(conSong.khaiNiemId);
      const nguoi = moiEntity(s).find((x) => x.tickDiet === null && (ducVong(x)['tinNguong'] ?? 0) >= 20);
      if (!kn || !nguoi) continue;
      ra.push({
        loai: 'phuc_hung',
        ten: `Ai đó nhớ lại ${e.ten}`,
        nhanVat: [vai(nguoi.id, 'chinh', 65), vai(e.id, 'xuc_tac', 40), vai(kn.id, 'xuc_tac', 35)],
        vi: `${e.ten} nằm trong sổ mà không ai còn cảm thấy. Khái niệm "${kn.ten}" thì vẫn còn đó.`,
        cangThangDau: 14,
      });
    }
    return ra;
  },
  duongCangThang: duongCham,
  sinhNhip(m, s, rng) {
    return nhipTheoMau(
      m,
      s,
      rng,
      {
        am_i: ['Có người vẫn làm một nghi thức mà chính họ không hiểu để làm gì.'],
        khoi: ['{chinh} tìm ra một bản chép cũ và đọc được một phần.'],
        phat_trien: ['Nghi thức được làm lại, sai vài chỗ, nhưng làm lại.'],
        cao_trao: ['Điều luật cũ có răng trở lại, và lần này nó cắn đúng chỗ nó từng cắn.'],
        ha_man: ['Người ta bắt đầu sợ một điều mà cha họ đã thôi sợ.'],
        du_am: ['Một câu chữ nằm im hàng nghìn năm lại có nghĩa.'],
        chet_yeu: ['Bản chép mục nát trước khi ai kịp đọc hết. Luật ngủ tiếp.'],
      },
      duongCham,
    );
  },
};

/**
 * Bảng handler. Khóa phải khớp id trong `R.storyKind`.
 *
 * `bao_thu` mang tiền đề của `phuc_thu` (28.3) và `troi_day` mang tiền đề của
 * `cuu_the` — ADR-0037. `dat_ten` và `phuc_hung` vào ở Phase 10 (43.2, 42.5).
 */
export const HANDLER_LOAI_MACH: Readonly<Record<string, HandlerLoaiMach>> = Object.freeze({
  dat_ten: datTen,
  phuc_hung: phucHung,
  bao_thu: baoThu,
  ke_vi: keVi,
  chien_tranh: chienTranh,
  ly_giao: lyGiao,
  am_muu: amMuu,
  tinh_ai: tinhAi,
  kham_pha: khamPha,
  troi_day: troiDay,
  suy_tan: suyTan,
  phan_boi: phanBoi,
  di_cu: diCu,
  phat_kien: phatKien,
  tranh_domain: tranhDomain,
  doi_thuong: doiThuong,
});

/** Loại mạch đã khai trong registry mà chưa có handler — cổng Phase 8 đòi rỗng. */
export function loaiMachThieuHandler(ids: readonly string[]): readonly string[] {
  return ids.filter((id) => HANDLER_LOAI_MACH[id] === undefined).sort((a, b) => (a < b ? -1 : 1));
}
