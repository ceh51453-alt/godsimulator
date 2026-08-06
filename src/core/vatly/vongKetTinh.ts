/**
 * Vòng kết tinh — chỗ thế giới tự phát hiện ra vật lý của chính nó.
 *
 * ── Vì sao file này tồn tại ──
 *
 * Phần 8, 42, 43 và 44 mô tả **một dòng chảy khép kín**:
 *
 * ```text
 * sự kiện thật  →  khái niệm nặng thêm
 *               →  khái niệm kết tinh
 *               →  kết tinh thành một điều luật
 *               →  điều luật tiếp địa vào khái niệm ấy  ─┐
 *               →  trục Luật Nền tự có tên               │ và vòng lại
 *               →  trục có tên sinh kẽ hở + mở cơ chế   ─┘
 * ```
 *
 * Mọi mắt xích của dòng ấy đã có mã và đã có test: `tinhHieuLuc()` (42.4),
 * `kiemTiepDia()` (42.6), `khaiNiemHuDanh()` (42.3), `quetTuKetTinh()` (43.7),
 * `datTenTruc()` (43.2), `quetCoChe()` (44.4). Cái thiếu là **không ai gọi
 * chúng trong lúc chơi** — cả sáu hàm chỉ được test gọi.
 *
 * Hệ quả đo được: một ván chạy nghìn nhịp có `trongSo` đứng yên, không khái niệm
 * nào lên bậc, `hieuLuc` của mọi điều luật vĩnh viễn bằng con số ai đó khai lần
 * đầu, và bảy trục Luật Nền vô danh mãi mãi trừ khi model tự tay viết ra một
 * khái niệm đúng tag. Tức là Phần 42–44 tồn tại trên giấy.
 *
 * File này là mắt xích nối. Nó THUẦN: đọc `WorldState`, trả patch. Không áp gì,
 * không RNG, không LLM, không thời gian máy — nên `motTick` gọi nó mà replay vẫn
 * cho cùng một hash.
 *
 * ── Vì sao engine chỉ đẻ ra LUẬT, không đẻ ra THẦN ──
 *
 * Kết tinh thành luật là một phép suy: một khái niệm đủ nặng thì thế giới bắt
 * đầu cư xử như thể có một quy tắc về nó, và quy tắc ấy tiếp địa vào đúng khái
 * niệm sinh ra nó. Engine viết được câu đó mà không cần bịa gì.
 *
 * Kết tinh thành thần thì không. Một vị thần cần tên, cần bản tính, cần một câu
 * chuyện — và [BB] 71.5 nói engine giữ sổ chứ không kể chuyện. Nên nhánh `than`
 * mở một `gap` loại `ket_tinh_than`: một câu hỏi chưa có lời đáp, đúng nguyên
 * tắc 4, và người trả lời là lời kể ở lượt sau qua đường `<CapNhat>` đã được
 * `bocTach()` canh sẵn.
 *
 * ── Vì sao không ai lợi dụng được vòng này ──
 *
 * Bốn trường quyết định toàn bộ dòng chảy — `conceptual.trongSo`,
 * `conceptual.giaiDoan`, `conceptual.nguongKetTinh`, `lawful.hieuLuc` — nằm
 * trong `DUONG_DAN_CAM` của `ai/bocTach.ts` và `DUONG_DAN_CAM_DIEN_HOA` của
 * `world/dienHoa.ts`. Bản ghi mới bị `chuanHoaBanGhiMoi()` kẹp bậc khai sinh
 * xuống `thanh_hinh`. Nghĩa là không cửa nào của AI viết thẳng vào đây được;
 * thứ duy nhất leo được thang là số vật mang, số điều luật và số vị thần **có
 * thật trong sổ**.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Conceptual } from '../schema/aspect/conceptual.js';
import { bacKhaiNiem, ConceptualSchema } from '../schema/aspect/conceptual.js';
import type { Lawful } from '../schema/aspect/lawful.js';
import { LawfulSchema } from '../schema/aspect/lawful.js';
import { nguonGoc } from '../schema/aspect/provenance.js';
import { EntitySchema, LinkSchema, GapSchema } from '../schema/entity.js';
import { patchGhiBanGhi } from '../engine/patch.js';
import type { Tuning } from '../tuning/schema.js';
import { khaiNiemHuDanh, suyKhaiNiemSanCo, tinhHieuLuc } from './tiepDia.js';
import { datTenTruc, quetTuKetTinh } from './luatNen.js';
import { quetCoChe } from './coChe.js';
import type { SubstrateLaw } from './schema.js';

// ─────────────────────────────────────────── kiểu

/** Một chuyện đáng ghi vào biên niên sử — cùng hình dạng với sự kiện tiến trình nền. */
export type SuKienKetTinh = {
  readonly loai: string;
  readonly mucDo: 'thuong' | 'lon' | 'trong_dai';
  readonly moTa: string;
  readonly chuTheIds: readonly string[];
  readonly payload: Readonly<Record<string, unknown>>;
};

export type KetQuaVongKetTinh = {
  readonly patches: readonly PatchOp[];
  readonly suKien: readonly SuKienKetTinh[];
};

type NgocCanh = {
  readonly state: WorldState;
  readonly tick: number;
  readonly eventId: string;
  readonly tuning: Tuning;
  /**
   * Bao nhiêu vòng quét dồn vào lần gọi này.
   *
   * Bằng 1 ở nhịp thường. Ở Diễn Hóa, một bước engine gộp tới bốn trăm tick, nên
   * con số này nói cho vòng biết nó đang thay mặt bao nhiêu năm. Thiếu nó thì tua
   * nhanh khiến thế giới lớn CHẬM hơn chơi thường — vì cùng một áp lực bị trải
   * ra trên một quãng thời gian dài gấp trăm lần.
   */
  readonly soVong?: number;
};

const RONG: KetQuaVongKetTinh = Object.freeze({ patches: Object.freeze([]), suKien: Object.freeze([]) });

// ─────────────────────────────────────────── tiện ích

function docConcept(e: Entity | undefined): Conceptual | undefined {
  const a = e?.aspects['conceptual'];
  return a === null || typeof a !== 'object' ? undefined : (a as Conceptual);
}

function docLawful(e: Entity | undefined): Lawful | undefined {
  const a = e?.aspects['lawful'];
  return a === null || typeof a !== 'object' ? undefined : (a as Lawful);
}

/** Duyệt entity còn sống theo id đã sắp — luật bất biến #7. */
function moiEntitySong(s: WorldState): Entity[] {
  return [...s.entities.values()]
    .filter((e) => e.tickDiet === null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

const set = (id: string, path: string, value: unknown, evId: string): PatchOp => ({
  op: 'set',
  target: { table: 'entities', id, path },
  value,
  sourceEventId: evId,
});

/** Làm tròn về 4 chữ số — chặn sai số dấu phẩy động làm hash lệch giữa hai lần chạy. */
function lam(x: number): number {
  return Math.round(x * 10_000) / 10_000;
}

// ─────────────────────────────────────────── 1. áp lực

export type ApLucKhaiNiem = { readonly yChi: number; readonly lapLai: number };

/**
 * Khái niệm lấy trọng số từ đâu — ba nguồn, cả ba đếm được trong sổ.
 *
 * Trước đây chỉ có MỘT nguồn: áp lực diễn giải lệch, qua link `sinh_ra_tu` (bước
 * 7 của tick). Nguồn ấy đúng nhưng gần như không bao giờ chạy, vì `sinh_ra_tu`
 * chỉ tồn tại ở thế giới mẫu và không tiến trình nào tạo thêm. Ba nguồn dưới đây
 * đọc những thứ thế giới THẬT SỰ sinh ra trong lúc chơi:
 *
 *   - **vật mang** (`hien_than_cua`, `thuoc_khai_niem`) → `lapLai`:
 *     cứ thế xảy ra, không ai chọn;
 *   - **luật tiếp địa vào nó** → `yChi`: có người đã viết ra một quy tắc về nó;
 *   - **thần kết tinh từ nó** (`ket_tinh_tu`) → `yChi`: có kẻ đã nhân cách hóa nó.
 *
 * Đây chính là chỗ dòng chảy quay đầu: một điều luật do vòng này đẻ ra sẽ tiếp
 * địa ngược vào khái niệm mẹ, và từ nhịp sau nó tự nuôi mẹ mình.
 */
export function apLucKhaiNiem(s: WorldState, tuning: Tuning): ReadonlyMap<string, ApLucKhaiNiem> {
  const t = tuning.khaiNiem;
  const ra = new Map<string, { yChi: number; lapLai: number }>();
  const cong = (id: string, yChi: number, lapLai: number): void => {
    const cu = ra.get(id) ?? { yChi: 0, lapLai: 0 };
    ra.set(id, { yChi: cu.yChi + yChi, lapLai: cu.lapLai + lapLai });
  };

  for (const lk of [...s.links.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (lk.tickDut !== null) continue;
    if (lk.quanHe === 'hien_than_cua' || lk.quanHe === 'thuoc_khai_niem') {
      cong(lk.denId, 0, t.apLucMoiVatMang);
      continue;
    }
    if (lk.quanHe === 'ket_tinh_tu') cong(lk.denId, t.apLucMoiThanNeo, 0);
  }

  /*
   * Căng thẳng với khái niệm đối lập — [BB] 8.3, và là nguồn duy nhất nuôi một
   * phản nghĩa vừa sinh ra.
   *
   * Ô Uế nặng thì Thanh Sạch nặng theo: chỗ trống chỉ rõ ra khi thứ lấp vào nó đã
   * rõ. Áp lực này về `lapLai` chứ không về `yChi` — không ai ngồi xuống quyết
   * định rằng cần có Thanh Sạch, nó chỉ là mặt kia của một điều đang xảy ra.
   */
  for (const e of moiEntitySong(s)) {
    const c = e.aspects['conceptual'];
    if (c === null || typeof c !== 'object') continue;
    const ct = (c as Conceptual).cangThang;
    if (!Array.isArray(ct)) continue;
    for (const x of ct) {
      const doi = s.entities.get(x.khaiNiemId);
      const dc = doi === undefined ? undefined : docConcept(doi);
      if (dc === undefined || doi?.tickDiet !== null) continue;
      const ty = dc.nguongKetTinh > 0 ? Math.min(1, dc.trongSo / dc.nguongKetTinh) : 0;
      cong(e.id, 0, lam((x.doCang / 100) * ty * t.heSoLanToaCangThang));
    }
  }

  for (const e of moiEntitySong(s)) {
    const l = docLawful(e);
    if (l === undefined) continue;
    // Chỉ luật đang có hiệu lực mới đè lên thế giới. Một bản nháp trong ngăn kéo
    // không làm ai tin thêm điều gì.
    if (l.trangThai !== 'hieu_luc') continue;
    for (const td of l.tiepDia) cong(td.khaiNiemId, t.apLucMoiLuatTiepDia, 0);

    // Áp lực diễn giải lệch — nguồn gốc của bước 7, giữ nguyên ngữ nghĩa.
    let lech = 0;
    for (const dg of l.dienGiai) lech += (dg.doLech ?? 0) / 100;
    if (lech <= 0) continue;
    for (const lk of [...s.links.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
      if (lk.tickDut !== null || lk.quanHe !== 'sinh_ra_tu' || lk.denId !== e.id) continue;
      cong(lk.tuId, 0, lech);
    }
  }

  return ra;
}

// ─────────────────────────────────────────── 2. leo thang

/** Bậc suy từ tỷ lệ trọng số / ngưỡng. Bậc cuối do `ketTinh()` quyết, không do đây. */
function bacTheoTyLe(ty: number): 'hu_danh' | 'manh_nha' | 'thanh_hinh' {
  if (ty >= 0.5) return 'thanh_hinh';
  if (ty >= 0.15) return 'manh_nha';
  return 'hu_danh';
}

/**
 * Kết tinh thành gì — 8.2.
 *
 * `null` nghĩa là **lưỡng lự**: đủ nặng nhưng nguồn không nghiêng hẳn về bên nào,
 * nên khái niệm chưa biết nó sẽ thành một vị thần hay một điều luật. Bậc ấy có
 * thật trong schema (`tickVaoLuongLu`) và có cột riêng trong Bảng Thiên Diễn.
 */
function ketTinhThanh(ng: ApLucKhaiNiem, tuning: Tuning): 'than' | 'luat' | null {
  const tong = ng.yChi + ng.lapLai;
  if (tong <= 0) return null;
  if (ng.yChi / tong >= tuning.khaiNiem.nguongYChi) return 'than';
  if (ng.lapLai / tong >= tuning.khaiNiem.nguongLapLai) return 'luat';
  return null;
}

// ─────────────────────────────────────────── 3. luật do khái niệm đẻ ra

/**
 * Điều luật sinh ra từ một khái niệm vừa kết tinh — 43.1 "kết tinh luật".
 *
 * Văn bản viết bằng đúng cái tên khái niệm, và `tiepDia` trỏ về chính nó. Nhờ
 * vậy `tinhHieuLuc()` cho luật này một con số có nghĩa ngay từ nhịp sau: nó
 * mạnh đúng bằng độ thật của thứ nó nói về.
 *
 * `bien` (luật này KHÔNG làm gì) là trường bắt buộc của kiểm tra 5 — nên nó
 * được viết ra chứ không bỏ trống.
 */
function luatTuKhaiNiem(kn: Entity, c: Conceptual, branchId: string, tick: number): Entity {
  const ten = kn.ten.trim() === '' ? kn.id : kn.ten.trim();
  return EntitySchema.parse({
    id: `law_kt_${kn.id}`,
    branchId,
    kind: 'law',
    ten: `Luật ${ten}`,
    aliases: [],
    moTa: `Điều luật kết tinh từ khái niệm ${ten} khi nó đã đủ nặng để thế giới cư xử theo nó.`,
    tickSinh: tick,
    tickDiet: null,
    tags: ['tu_ket_tinh', ...kn.tags],
    aspects: {
      provenance: nguonGoc('ket_tinh', tick),
      lawful: LawfulSchema.parse({
        vanBan: `Ở đâu có ${ten}, ở đó ${ten} có hiệu lực.`,
        phamVi: { loai: 'vu_tru', mucTieu: [] },
        bien: `Luật này không nói ai gây ra ${ten}, cũng không nói nó nên hay không nên có. Nó chỉ nói rằng ${ten} là một điều thật.`,
        uuTien: Math.min(1000, Math.round(c.trongSo / 10)),
        theTag: [...kn.tags],
        tiepDia: [{ khaiNiemId: kn.id, vaiTro: 'pham_tru', batBuoc: true }],
        cheDoTiepDia: 'tu_tiep_dia',
        trangThai: 'hieu_luc',
      }),
    },
  });
}

// ─────────────────────────────────────────── 4. luật đẻ ra khái niệm (miasma)

/**
 * Khái niệm phái sinh — chỗ một điều luật đẻ ra điều luật khác.
 *
 * ── Cơ chế này lấy từ đâu ──
 *
 * Từ cách các hệ thần thoại thật sự dày lên. Trong tôn giáo Hy Lạp cổ, *miasma*
 * không phải một điều luật ai ban hành: nó là **thứ người ta bắt đầu tin vì đã
 * có một cấm kỵ**. Cấm giết người có trước; ý niệm "ô uế" mọc lên quanh nó; rồi
 * ô uế đủ nặng để đẻ ra cả một bộ luật thứ hai — luật tẩy uế (*katharsis*) — với
 * nghi thức, người hành lễ và ngoại lệ riêng.
 *
 * Nghĩa là dòng chảy thật không phải `khái niệm → luật` một chiều, mà:
 *
 * ```text
 * luật  →  khái niệm nó hàm ý  →  luật thứ hai nói về khái niệm ấy
 * ```
 *
 * Và mắt xích giữa đã có sẵn trong máy này từ đầu: link `sinh_ra_tu` mà bước 7
 * đọc để tính áp lực. Chưa từng có ai TẠO một sợi `sinh_ra_tu` nào — nó chỉ tồn
 * tại trong thế giới mẫu. Hàm này là chỗ tạo.
 *
 * ── Vì sao phải chờ diễn giải lệch ──
 *
 * [BB] 10.1 — tầng 2 BẮT BUỘC SAI. Khái niệm phái sinh không mọc từ văn bản gốc
 * của luật; nó mọc từ **chỗ người ta hiểu sai nó**. Một điều luật ai cũng hiểu
 * đúng thì không đẻ ra gì cả: nó chỉ là một câu lệnh. Chính khoảng lệch giữa
 * điều luật nói và điều người ta tin mới là chỗ có đủ mơ hồ để một ý niệm mới
 * chen vào — nên `nguongDeKhaiNiemPhaiSinh` đo đúng độ lệch ấy.
 */
function patchKhaiNiemPhaiSinh(ng: NgocCanh, luat: Entity, l: Lawful): PatchOp[] {
  if (l.trangThai !== 'hieu_luc' || l.dienGiai.length === 0) return [];

  const lechTb = l.dienGiai.reduce((t, d) => t + (d.doLech ?? 0), 0) / l.dienGiai.length;
  if (lechTb < ng.tuning.luat.nguongDeKhaiNiemPhaiSinh) return [];

  const knId = `concept_ps_${luat.id}`;
  if (ng.state.entities.has(knId)) return [];

  const ten = luat.ten.trim() === '' ? luat.id : luat.ten.trim();
  const kn = EntitySchema.parse({
    id: knId,
    branchId: ng.state.world.branchId,
    kind: 'concept',
    ten: `Bóng của ${ten}`,
    moTa:
      `Thứ người ta tin vì đã có "${ten}", chứ không vì ai dạy. ` +
      'Nó mọc lên trong khoảng cách giữa điều luật nói và điều người ta nghe.',
    tickSinh: ng.tick,
    tags: ['phai_sinh', ...l.theTag],
    aspects: {
      provenance: nguonGoc('ket_tinh', ng.tick),
      // `ConceptualSchema.parse` chứ không phải object literal: `EntitySchema`
      // khai `aspects` là `record(unknown)` nên nó KHÔNG điền `.prefault()` cho
      // mặt bên trong, và một `conceptual` thiếu `nguon` sẽ nổ `TypeError` ở
      // vòng sau. Đúng cái bẫy mà `ai/chuanHoaBanGhi.ts` tồn tại để kể lại.
      conceptual: ConceptualSchema.parse({
        // Sinh ra ở `manh_nha`, không phải `hu_danh`: nó đã có người tin rồi —
        // đó chính là độ lệch vừa đo được.
        giaiDoan: 'manh_nha',
        trongSo: 0,
        nguongKetTinh: ng.tuning.khaiNiem.nguongKetTinhMacDinh,
      }),
    },
  });

  const linkId = `lk_ps_${luat.id}`;
  return [
    { op: 'link', target: { table: 'entities', id: knId, path: '' }, value: kn, sourceEventId: ng.eventId },
    {
      op: 'link',
      target: { table: 'links', id: linkId, path: '' },
      value: LinkSchema.parse({
        id: linkId,
        branchId: ng.state.world.branchId,
        tuId: knId,
        denId: luat.id,
        quanHe: 'sinh_ra_tu',
        trongSo: Math.round(lechTb),
        tickTao: ng.tick,
      }),
      sourceEventId: ng.eventId,
    },
  ];
}

// ─────────────────────────────────────────── 5. phản nghĩa (katharsis)

/**
 * Phản nghĩa tự sinh — [BB] 8.3.
 *
 * ── Cơ chế này cũng lấy từ thần thoại ──
 *
 * Không hệ thống nào để một khái niệm đứng một mình. Ô Uế sinh ra Thanh Sạch;
 * *miasma* sinh ra *katharsis*; và phép tẩy uế Hy Lạp chạy theo đúng nguyên tắc
 * "**cái giống trừ cái giống**" — kẻ giết người được rửa tay bằng máu con vật.
 * Cặp đối lập không phải hai thứ rời nhau; nó là **một thứ nhìn từ hai phía**, và
 * căng thẳng giữa hai phía là thứ nuôi cả hai.
 *
 * Thế giới mẫu đã gieo sẵn đúng một cặp như vậy (`concept_o_ue` ↔
 * `concept_thanh_sach`, `doCang` 88) — nhưng không mã nào tạo cặp thứ hai. Trường
 * `phanNghiaId`, mảng `cangThang` và cả tham số `heSoLanToaCangThang` nằm đó
 * không ai đọc. Hàm này là chỗ đọc.
 *
 * Phản nghĩa sinh ra ở `hu_danh` trọng số 0: nó CHƯA thật. Nó nặng dần bằng chính
 * căng thẳng với khái niệm mẹ — nên một thế giới có Ô Uế rất nặng sẽ tự đẩy Thanh
 * Sạch lên tới ngưỡng, và luật tẩy uế ra đời mà không ai viết nó.
 */
function patchPhanNghia(ng: NgocCanh, kn: Entity, c: Conceptual): PatchOp[] {
  if (c.phanNghiaId !== null) return [];
  const doiId = `concept_doi_${kn.id}`;
  if (ng.state.entities.has(doiId)) return [];

  const ten = kn.ten.trim() === '' ? kn.id : kn.ten.trim();
  const doCang = Math.max(1, Math.min(100, Math.round((c.trongSo / Math.max(1, c.nguongKetTinh)) * 60)));

  const doi = EntitySchema.parse({
    id: doiId,
    branchId: ng.state.world.branchId,
    kind: 'concept',
    ten: `Vắng ${ten}`,
    moTa:
      `Phía bên kia của ${ten}. Nó chưa thật; nó chỉ là chỗ trống mà ${ten} để lại, ` +
      'và chỗ trống ấy càng rõ khi thứ kia càng nặng.',
    tickSinh: ng.tick,
    tags: ['phan_nghia', ...kn.tags],
    aspects: {
      provenance: nguonGoc('ket_tinh', ng.tick),
      conceptual: ConceptualSchema.parse({
        giaiDoan: 'hu_danh',
        trongSo: 0,
        nguongKetTinh: c.nguongKetTinh,
        phanNghiaId: kn.id,
        cangThang: [{ khaiNiemId: kn.id, doCang }],
      }),
    },
  });

  return [
    { op: 'link', target: { table: 'entities', id: doiId, path: '' }, value: doi, sourceEventId: ng.eventId },
    set(kn.id, 'aspects.conceptual.phanNghiaId', doiId, ng.eventId),
    set(kn.id, 'aspects.conceptual.cangThang', [{ khaiNiemId: doiId, doCang }], ng.eventId),
  ];
}

// ─────────────────────────────────────────── vòng chính

/**
 * Một lượt của vòng kết tinh.
 *
 * Thứ tự bốn phần dưới đây có nghĩa và làm ngược thì hỏng: trọng số phải cộng
 * trước khi xét bậc, bậc phải xong trước khi xét kết tinh, và luật nền chỉ tự
 * kết tinh được sau khi có khái niệm ở bậc cuối để bám vào.
 *
 * Toàn bộ patch trả về được áp trong MỘT lô, nên trong cùng một nhịp chúng đọc
 * cùng một ảnh chụp. Con số tính ở đây đã tính sẵn phần cộng của chính nhịp này
 * để bậc không bị chậm một nhịp so với trọng số.
 */
export function vongKetTinh(ng: NgocCanh): KetQuaVongKetTinh {
  const patches: PatchOp[] = [];
  const suKien: SuKienKetTinh[] = [];
  const t = ng.tuning.khaiNiem;
  const apLucGoc = apLucKhaiNiem(ng.state, ng.tuning);
  const soVong = Math.max(1, Math.floor(ng.soVong ?? 1));

  /** Trọng số sau khi cộng phần của nhịp này — dùng cho mọi phép so bên dưới. */
  const trongSoMoi = new Map<string, number>();
  // Một bước dài trăm năm được kết tinh nhiều hơn một bước dài một năm, nhưng
  // KHÔNG tuyến tính: một thế kỷ không đẻ ra một trăm điều luật. Căn bậc hai giữ
  // cho Diễn Hóa dày hơn mà vẫn đọc được từng dòng biên niên sử.
  let conKetTinh = Math.max(t.soKetTinhMoiNhip, Math.round(t.soKetTinhMoiNhip * Math.sqrt(soVong)));

  // ── 1. trọng số và bậc ──
  for (const e of moiEntitySong(ng.state)) {
    const c = docConcept(e);
    if (c === undefined) continue;

    const goc = apLucGoc.get(e.id) ?? { yChi: 0, lapLai: 0 };
    const ap = { yChi: goc.yChi * soVong, lapLai: goc.lapLai * soVong };
    const nguong = c.nguongKetTinh > 0 ? c.nguongKetTinh : t.nguongKetTinhMacDinh;
    const tran = nguong * t.boiTranTrongSo;
    const them = lam(Math.min(ap.yChi + ap.lapLai, Math.max(0, tran - c.trongSo)));
    const moi = lam(c.trongSo + them);
    trongSoMoi.set(e.id, moi);

    if (them > 0) {
      patches.push(set(e.id, 'aspects.conceptual.trongSo', moi, ng.eventId));
      if (ap.yChi > 0) {
        patches.push(set(e.id, 'aspects.conceptual.nguon.yChi', lam(c.nguon.yChi + ap.yChi), ng.eventId));
      }
      if (ap.lapLai > 0) {
        patches.push(
          set(e.id, 'aspects.conceptual.nguon.lapLai', lam(c.nguon.lapLai + ap.lapLai), ng.eventId),
        );
      }
    }

    // Bậc chỉ đi LÊN. Một khái niệm đã thành hình rồi thì thế giới đã biết nó;
    // trọng số tụt làm luật yếu đi (42.5), nó không làm cả một từ vựng biến mất.
    if (moi < nguong) {
      const bacMoi = bacTheoTyLe(moi / nguong);
      if (bacKhaiNiem(bacMoi) > bacKhaiNiem(c.giaiDoan)) {
        patches.push(set(e.id, 'aspects.conceptual.giaiDoan', bacMoi, ng.eventId));
      }
      continue;
    }

    // ── 2. kết tinh ──
    if (c.giaiDoan === 'ket_tinh' || conKetTinh <= 0) continue;

    const apTong: ApLucKhaiNiem = {
      yChi: c.nguon.yChi + ap.yChi,
      lapLai: c.nguon.lapLai + ap.lapLai,
    };
    let thanh = ketTinhThanh(apTong, ng.tuning);

    if (thanh === null) {
      // Lưỡng lự: chờ, nhưng không chờ mãi. Quá hạn thì nó thành CẢ HAI — 8.2.
      const vao = c.tickVaoLuongLu;
      if (vao === null) {
        patches.push(set(e.id, 'aspects.conceptual.giaiDoan', 'luong_lu', ng.eventId));
        patches.push(set(e.id, 'aspects.conceptual.tickVaoLuongLu', ng.tick, ng.eventId));
        suKien.push({
          loai: 'khai_niem_luong_lu',
          mucDo: 'lon',
          moTa:
            `Nhịp ${ng.tick}: "${e.ten}" đã đủ nặng để thành một điều thật, ` +
            'nhưng thế giới chưa biết nên thờ nó hay nên viết nó thành luật.',
          chuTheIds: [e.id],
          payload: { khaiNiemId: e.id, trongSo: moi },
        });
        continue;
      }
      if (ng.tick - vao < t.tickLuongLuToiDa) continue;
      thanh = 'luat';
      patches.push(set(e.id, 'aspects.conceptual.ketTinhThanh', 'ca_hai', ng.eventId));
    } else {
      patches.push(set(e.id, 'aspects.conceptual.ketTinhThanh', thanh, ng.eventId));
    }

    conKetTinh--;
    patches.push(set(e.id, 'aspects.conceptual.giaiDoan', 'ket_tinh', ng.eventId));
    // [BB] 8.3 — không khái niệm nào kết tinh mà không đẻ ra phía bên kia của nó.
    patches.push(...patchPhanNghia(ng, e, { ...c, trongSo: moi }));

    if (thanh === 'luat') {
      patches.push(...patchLuatMoi(ng, e, c, moi));
      suKien.push({
        loai: 'khai_niem_ket_tinh_thanh_luat',
        mucDo: 'trong_dai',
        moTa:
          `Nhịp ${ng.tick}: "${e.ten}" thôi là một cảm giác chung và thành một điều luật. ` +
          'Không ai ban hành nó cả — nó chỉ đơn giản đã đúng đủ lâu để không ai cãi được nữa.',
        chuTheIds: [e.id],
        payload: { khaiNiemId: e.id, luatId: `law_kt_${e.id}`, trongSo: moi },
      });
      continue;
    }

    patches.push(...patchGapThan(ng, e));
    suKien.push({
      loai: 'khai_niem_ket_tinh_thanh_than',
      mucDo: 'trong_dai',
      moTa:
        `Nhịp ${ng.tick}: "${e.ten}" đã nặng tới mức người ta bắt đầu nói về nó như nói về một ai đó. ` +
        'Vị ấy chưa có tên.',
      chuTheIds: [e.id],
      payload: { khaiNiemId: e.id, trongSo: moi },
    });
  }

  // ── 3. tiếp địa và hiệu lực ──
  patches.push(...patchTiepDia(ng, trongSoMoi));

  /*
   * ── 3b. luật đẻ ra khái niệm ──
   *
   * Chạy SAU tiếp địa, vì `hieuLuc` vừa được tính lại và một điều luật chưa có
   * răng thì chưa lệch được — chưa ai hiểu sai một thứ chưa ai hiểu.
   *
   * Trần một khái niệm phái sinh mỗi nhịp: mỗi lần một điều luật đẻ ra cái bóng
   * của nó là một chuyện đáng kể, và mười cái cùng lúc thì không cái nào đáng kể.
   */
  for (const e of moiEntitySong(ng.state)) {
    const l = docLawful(e);
    if (l === undefined) continue;
    const ps = patchKhaiNiemPhaiSinh(ng, e, l);
    if (ps.length === 0) continue;
    patches.push(...ps);
    suKien.push({
      loai: 'luat_sinh_khai_niem',
      mucDo: 'lon',
      moTa:
        `Nhịp ${ng.tick}: quanh "${e.ten}" đã mọc lên một thứ không ai viết ra. ` +
        'Người ta bắt đầu tin nó vì điều luật ấy có mặt, chứ không vì ai dạy họ.',
      chuTheIds: [e.id],
      payload: { luatId: e.id, khaiNiemId: `concept_ps_${e.id}` },
    });
    break;
  }

  // ── 4. vật lý thế giới ──
  const vl = patchVatLy(ng);
  patches.push(...vl.patches);
  suKien.push(...vl.suKien);

  return patches.length === 0 && suKien.length === 0
    ? RONG
    : Object.freeze({ patches: Object.freeze(patches), suKien: Object.freeze(suKien) });
}

/** Bản ghi luật mới + sợi dây `sinh_ra_tu` nối nó về khái niệm mẹ. */
function patchLuatMoi(ng: NgocCanh, kn: Entity, c: Conceptual, trongSo: number): PatchOp[] {
  const luatId = `law_kt_${kn.id}`;
  if (ng.state.entities.has(luatId)) return [];

  const luat = luatTuKhaiNiem(kn, { ...c, trongSo }, ng.state.world.branchId, ng.tick);
  const linkId = `lk_kt_${kn.id}`;
  const ra: PatchOp[] = [
    {
      op: 'link',
      target: { table: 'entities', id: luatId, path: '' },
      value: luat,
      sourceEventId: ng.eventId,
    },
    set(kn.id, 'aspects.conceptual.thucTheIds', [...new Set([...c.thucTheIds, luatId])], ng.eventId),
  ];
  if (!ng.state.links.has(linkId)) {
    ra.push({
      op: 'link',
      target: { table: 'links', id: linkId, path: '' },
      value: LinkSchema.parse({
        id: linkId,
        branchId: ng.state.world.branchId,
        tuId: kn.id,
        denId: luatId,
        quanHe: 'sinh_ra_tu',
        trongSo: 90,
        tickTao: ng.tick,
      }),
      sourceEventId: ng.eventId,
    });
  }
  return ra;
}

/**
 * Khái niệm đòi một vị thần — và engine không đặt tên thần.
 *
 * [BB] 71.5 giữ nguyên ở đây: engine ghi rằng chỗ ấy đang trống, chứ không tự
 * lấp. `gap` là hình dạng chuẩn của "một câu hỏi chưa có lời đáp" trong máy này,
 * và `world/process` đã có sẵn đường đưa gap lên lời kể.
 */
function patchGapThan(ng: NgocCanh, kn: Entity): PatchOp[] {
  const gapId = `gap_ket_tinh_than_${kn.id}`;
  if (ng.state.gaps.has(gapId)) return [];
  return [
    {
      op: 'link',
      target: { table: 'gaps', id: gapId, path: '' },
      value: GapSchema.parse({
        id: gapId,
        branchId: ng.state.world.branchId,
        loai: 'ket_tinh_than',
        chuTheId: kn.id,
        moTa:
          `Khái niệm "${kn.ten}" đã kết tinh về phía ý chí: người ta nói về nó như nói về một ai đó. ` +
          'Vị ấy chưa có tên, chưa có mặt, và chưa ai kể vị ấy muốn gì.',
        uuTien: 70,
        lanThu: 0,
        trangThai: 'mo',
        tickPhatHien: ng.tick,
      }),
      sourceEventId: ng.eventId,
    },
  ];
}

/**
 * Tiếp địa và hiệu lực — 42.3, 42.4, 42.6.
 *
 * Hai việc, một vòng duyệt:
 *
 * 1. **Tự tiếp địa.** Luật trỏ tới một khái niệm không có thật thì ở chế độ
 *    `tu_tiep_dia` engine tạo nó ở `hu_danh` trọng số 0 (luật tồn tại nhưng gần
 *    như trơ), còn ở `tu_suy` thì tìm khái niệm SẴN CÓ cùng nghĩa trước — hai
 *    khái niệm cùng nghĩa chia đôi trọng số và cả hai cùng yếu.
 * 2. **Tính lại hiệu lực.** Chỉ phát patch khi con số ĐỔI: `hieuLuc` gần như
 *    đứng yên giữa hai nhịp, và một patch mỗi luật mỗi nhịp sẽ làm event log nở
 *    tuyến tính theo thời gian mà không nói thêm điều gì.
 */
function patchTiepDia(ng: NgocCanh, trongSoMoi: ReadonlyMap<string, number>): PatchOp[] {
  const ra: PatchOp[] = [];
  const daTao = new Set<string>();

  // Ảnh chụp có phần cộng của nhịp này, để hiệu lực không chậm một nhịp so với
  // trọng số vừa ghi ở trên.
  const anh: WorldState = {
    ...ng.state,
    entities: new Map(ng.state.entities),
  };
  for (const [id, trongSo] of [...trongSoMoi].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const e = anh.entities.get(id);
    const c = docConcept(e);
    if (e === undefined || c === undefined) continue;
    anh.entities.set(id, { ...e, aspects: { ...e.aspects, conceptual: { ...c, trongSo } } });
  }

  for (const e of moiEntitySong(ng.state)) {
    const l = docLawful(e);
    if (l === undefined) continue;

    // ── 1. tiếp địa ──
    if (l.cheDoTiepDia !== 'chat_che' && l.tiepDia.length > 0) {
      let doi = false;
      const tiepDiaMoi = l.tiepDia.map((td) => {
        const kn = anh.entities.get(td.khaiNiemId);
        if (kn !== undefined && docConcept(kn) !== undefined) return td;

        if (l.cheDoTiepDia === 'tu_suy') {
          const thay = suyKhaiNiemSanCo(td.khaiNiemId, anh);
          if (thay !== null) {
            doi = true;
            return { ...td, khaiNiemId: thay };
          }
        }
        if (!daTao.has(td.khaiNiemId) && !anh.entities.has(td.khaiNiemId)) {
          daTao.add(td.khaiNiemId);
          const moi = khaiNiemHuDanh(
            td.khaiNiemId,
            ng.state.world.branchId,
            ng.tick,
            ng.tuning.khaiNiem.nguongKetTinhMacDinh,
          );
          anh.entities.set(moi.id, moi);
          ra.push({
            op: 'link',
            target: { table: 'entities', id: moi.id, path: '' },
            value: moi,
            sourceEventId: ng.eventId,
          });
        }
        return td;
      });
      if (doi) ra.push(set(e.id, 'aspects.lawful.tiepDia', tiepDiaMoi, ng.eventId));
    }

    // ── 2. hiệu lực ──
    const hieuLuc = tinhHieuLuc(e, anh, ng.tuning).hieuLuc;
    if (hieuLuc !== l.hieuLuc) ra.push(set(e.id, 'aspects.lawful.hieuLuc', hieuLuc, ng.eventId));
  }

  return ra;
}

/**
 * Luật Nền tự kết tinh và cơ chế tự bật — 43.7, 44.4.
 *
 * [BB] 43.7: "Thế giới tự phát hiện ra vật lý của chính nó. Đây là ứng dụng đẹp
 * nhất của cơ chế kết tinh, và nó không cần thêm code — chỉ cần một bảng ánh xạ
 * `khái niệm → trục nền` trong Registry."
 *
 * Bảng ấy có sẵn (`KHAI_NIEM_NEN_CUA_TRUC`) và `quetTuKetTinh()` có sẵn. Cái
 * thiếu là mấy dòng dưới đây.
 *
 * `nguoiDatTenId: null` là có chủ đích — `bienNienDatTen()` viết "một người không
 * ai nhớ tên", và đó đúng là cách một trục vật lý được đặt tên trong lịch sử
 * thật: không ai biết ai đã nói câu ấy trước.
 */
function patchVatLy(ng: NgocCanh): { patches: PatchOp[]; suKien: SuKienKetTinh[] } {
  const patches: PatchOp[] = [];
  const suKien: SuKienKetTinh[] = [];
  if (ng.state.substrateLaws.size === 0) return { patches, suKien };

  // Danh sách luật nền được cập nhật tại chỗ để `datTenTruc()` thấy trục vừa đặt
  // tên ở vòng trước — 43.5 đòi thứ tự phụ thuộc, nên đặt hai trục trong cùng
  // một nhịp phải nhìn thấy nhau.
  let ds: SubstrateLaw[] = [...ng.state.substrateLaws.values()].sort((a, b) => (a.id < b.id ? -1 : 1));

  for (const ung of quetTuKetTinh(ng.state, ds)) {
    const r = datTenTruc({
      ds,
      truc: ung.truc,
      khaiNiemNenId: ung.khaiNiemId,
      nguoiDatTenId: null,
      tick: ng.tick,
      state: ng.state,
    });
    if (!r.ok) continue;
    ds = ds.map((x) => (x.truc === ung.truc ? r.luatNen : x));
    patches.push(...patchGhiBanGhi(ng.state, 'substrateLaws', r.luatNen.id, r.luatNen, ng.eventId));
    suKien.push({
      loai: 'luat_nen_tu_ket_tinh',
      mucDo: 'trong_dai',
      moTa: r.dongBienNien,
      chuTheIds: [ung.khaiNiemId],
      payload: { truc: ung.truc, khaiNiemId: ung.khaiNiemId, soKeHo: r.keHo.length },
    });
  }

  for (const c of quetCoChe({
    state: ng.state,
    luatNen: ds,
    hienTai: [...ng.state.coChe.values()],
    branchId: ng.state.world.branchId,
    tick: ng.tick,
  })) {
    const cu = ng.state.coChe.get(c.row.id);
    // Chỉ ghi khi có gì đổi thật: `conThieu` là một mảng chuỗi, so bằng JSON là
    // phép so rẻ và đủ chính xác cho một bản ghi bốn trường.
    if (cu !== undefined && JSON.stringify(cu) === JSON.stringify(c.row)) continue;
    patches.push(...patchGhiBanGhi(ng.state, 'coChe', c.row.id, c.row, ng.eventId));
    if (!c.vuaBat && !c.vuaTat) continue;
    suKien.push({
      loai: c.vuaBat ? 'co_che_bat' : 'co_che_tat',
      mucDo: 'trong_dai',
      moTa: c.congBo,
      chuTheIds: [],
      payload: { coCheId: c.row.id },
    });
  }

  return { patches, suKien };
}
