/**
 * chieu() — hàm chiếu ba tầng. Phần 18 [BB].
 *
 * "Ba tầng chơi là ba HÀM CHIẾU trên cùng một database. Không phải ba game."
 * "Không viết ba bộ logic. Viết MỘT engine, BA hàm chiếu."
 *
 * [BB] Ba quy tắc cứng của 18.2, đứng TRÊN mọi khai báo `KindDef.phanChieu`:
 *   1. `lawful.vanBan`   — phàm nhân KHÔNG BAO GIỜ; thần chỉ trong domain.
 *   2. `soul.banTinh` của thần — phàm nhân KHÔNG BAO GIỜ; chỉ `banTinhTinDoTin`.
 *   3. `conceptual.trongSo` — phàm nhân KHÔNG; chỉ biết khái niệm đã có TÊN
 *      trong văn hóa vùng mình.
 *
 * [BB] Trường bị che bị XÓA KHỎI ĐỐI TƯỢNG, không ẩn bằng CSS (luật bất biến #9).
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { ViewMode } from '../contracts/primitives.js';
import type {
  WorldView,
  ProjectedEntity,
  ProjectedLaw,
  ProjectedConcept,
  ProjectedLink,
  ProjectedStoryline,
  ProjectedThoiCuoc,
  ProjectedChiSo,
  ProjectedTrucNen,
  ProjectedCoChe,
  ProjectedDiBiet,
  ProjectedPhucBut,
  ProjectedLoiCau,
  ProjectedLoHong,
  MucRoThayDuoc,
  VerbHandle,
  NhipThoiGian,
} from '../contracts/view.js';
import { TRUC_NEN } from '../vatly/schema.js';
import { NHAN_TRUC_NEN } from '../vatly/luatNen.js';
import { CO_CHE } from '../vatly/coChe.js';
import { R, napDungSan } from '../registry/index.js';
import type { PhanChieu } from '../registry/types.js';
import { bopMeo } from './distort.js';
import { hashCua, hashGop } from '../engine/hash.js';

/** Bốn mức sương mù trước khi lọc. */
type MucRo = 'ro' | 'mo' | 'tin_don' | 'mu';

const THU_TU: Record<MucRo, number> = { ro: 3, mo: 2, tin_don: 1, mu: 0 };

function thapHon(a: MucRo, b: MucRo): MucRo {
  return THU_TU[a] <= THU_TU[b] ? a : b;
}

/** `KindDef.phanChieu` → mức sương mù trần cho một kind ở một tầng. */
function tranTheoKind(pc: PhanChieu, mode: ViewMode): MucRo {
  if (mode === 'sang_the') return 'ro';
  const v = mode === 'than' ? pc.than : pc.phamNhan;
  if (v === 'day_du') return 'ro';
  if (v === 'trong_domain') return 'mo';
  if (v === 'qua_van_hoa') return 'mo';
  if (v === 'tin_don') return 'tin_don';
  return 'mu';
}

type NgocCanh = {
  state: WorldState;
  /**
   * Tầng dùng để LỌC. Khác `modeNguoiChoi` đúng một trường hợp: thần đang hóa
   * thân (19.4). Mọi hàm bên dưới đọc trường này, không đọc tầng người chơi.
   */
  mode: ViewMode;
  /** Tầng người chơi đang đứng — chỉ dùng để dựng đầu ra, không dùng để lọc. */
  modeNguoiChoi: ViewMode;
  dangHoaThan: boolean;
  chuTheId: string | null;
  /** Entity của chủ thể, nếu có. */
  chuThe: Entity | undefined;
  /** Vùng chủ thể đang cư trú (id `place`/`realm`), nếu xác định được. */
  vungChuTheId: string | null;
  /** Domain của thần đang nhập, nếu ở tầng thần. */
  domainVungIds: ReadonlySet<string>;
  /** Entity mà chủ thể có liên hệ trực tiếp (một hop link còn hiệu lực). */
  lienHeTrucTiep: ReadonlySet<string>;
  triThuc: number;
  seed: string;
};

function docAspect<T>(e: Entity, ten: string): T | undefined {
  const a = e.aspects[ten];
  return a === undefined || a === null ? undefined : (a as T);
}

// ─────────────────────────────────────────── aspect nền (Phase 5)

/** Aspect do mười hai tiến trình của 71.2 giữ. Chúng KHÔNG đi thẳng ra ngoài. */
const ASPECT_NEN = new Set(['dan_cu', 'y_te', 'sinh_thai', 'kinh_te', 'van_hoa', 'an_ninh', 'duong']);

function mucTheoNguong(x: number, nguong: readonly [number, string][], macDinh: string): string {
  for (const [n, nhan] of nguong) if (x >= n) return nhan;
  return macDinh;
}

/**
 * Đổi số engine thành điều một người sống ở đó **cảm thấy**.
 *
 * Đây không phải là làm mờ dữ liệu cho đẹp: người trong làng thật sự không biết
 * kho còn bao nhiêu tạ thóc. Họ biết bữa cơm mỏng đi. Trả về số ở đây là rò rỉ
 * đúng nghĩa của Phần 18.3, và là loại rò khó thấy nhất.
 */
function dinhTinhHoa(ten: string, o: Record<string, unknown>): Record<string, unknown> {
  const soCua = (k: string, trong?: string): number => {
    const goc = trong ? (o[trong] as Record<string, unknown> | undefined) : o;
    const v = goc?.[k];
    return typeof v === 'number' ? v : 0;
  };

  if (ten === 'kinh_te') {
    return {
      doiSong: mucTheoNguong(
        soCua('thieuHut'),
        [
          [0.6, 'doi_kem'],
          [0.3, 'thieu_an'],
          [0.05, 'vua_du'],
        ],
        'sung_tuc',
      ),
      nghe: mucTheoNguong(
        soCua('kyThuat'),
        [
          [60, 'tinh_xao'],
          [25, 'thanh_thao'],
        ],
        'tho_so',
      ),
    };
  }
  if (ten === 'y_te') {
    return {
      benhTat: mucTheoNguong(
        soCua('tyLeMac'),
        [
          [0.3, 'nha_nao_cung_co_nguoi_nam'],
          [0.08, 'co_nguoi_om'],
          [0.005, 'loi_don_ve_benh'],
        ],
        'yen_lanh',
      ),
    };
  }
  if (ten === 'an_ninh') {
    const dangDanh = Array.isArray(o['xungDot'])
      ? (o['xungDot'] as { tickKetThuc?: number | null }[]).some(
          (x) => x.tickKetThuc === null || x.tickKetThuc === undefined,
        )
      : false;
    return {
      anToan: dangDanh
        ? 'dang_co_chien_su'
        : mucTheoNguong(
            soCua('deDoa'),
            [
              [60, 'ai_cung_thu_the'],
              [30, 'bat_an'],
            ],
            'yen',
          ),
    };
  }
  if (ten === 'sinh_thai') {
    return {
      dat: mucTheoNguong(
        soCua('suyThoai'),
        [
          [0.6, 'kiet'],
          [0.3, 'bac_mau'],
        ],
        'con_tot',
      ),
    };
  }
  if (ten === 'dan_cu') {
    // Số hộ là thứ người trong làng ĐẾM ĐƯỢC — nó không phải bí mật của engine.
    return { soHo: soCua('soHo') };
  }
  if (ten === 'van_hoa') {
    // Tập tục là thứ ai cũng thấy; độ lệch giáo lý thì không.
    const tt = Array.isArray(o['tapTuc']) ? (o['tapTuc'] as { ten?: string }[]) : [];
    const thanThoai = Array.isArray(o['thanThoai'])
      ? (o['thanThoai'] as { noiDung?: string; trangThai?: string }[])
      : [];
    return {
      tapTuc: tt.map((t) => t.ten ?? '').filter((x) => x !== ''),
      loiKe: thanThoai
        .filter((x) => x.trangThai !== 'mai_mot')
        .map((x) => x.noiDung ?? '')
        .filter((x) => x !== '')
        .slice(0, 6),
    };
  }
  if (ten === 'duong') {
    return {
      thongSuot: o['thongSuot'] === true,
      loi: mucTheoNguong(
        soCua('chatLuong'),
        [
          [60, 'de_di'],
          [25, 'di_duoc'],
        ],
        'kho_di',
      ),
    };
  }
  return {};
}

/** Thần nhìn lãnh địa mình từ trên cao: thấy quy mô, không thấy sổ sách. */
function quyMoChoThan(ten: string, o: Record<string, unknown>): Record<string, unknown> {
  if (ten === 'dan_cu') {
    const c = (o['cohort'] ?? {}) as Record<string, number>;
    const tong = (c['child'] ?? 0) + (c['youth'] ?? 0) + (c['adult'] ?? 0) + (c['elder'] ?? 0);
    return { danSo: tong };
  }
  if (ten === 'an_ninh') return { deDoa: o['deDoa'] };
  return {};
}

/** Vùng cư trú của một entity, theo link `cu_tru_tai` còn hiệu lực. */
function vungCua(state: WorldState, entityId: string): string | null {
  for (const lk of state.links.values()) {
    if (lk.tickDut !== null) continue;
    if (lk.tuId === entityId && lk.quanHe === 'cu_tru_tai') return lk.denId;
  }
  // Phàm nhân có thể khai vùng qua aspect spatial của chính mình.
  const e = state.entities.get(entityId);
  const sp = e ? docAspect<{ chaId?: string | null }>(e, 'spatial') : undefined;
  return sp?.chaId ?? null;
}

/**
 * Thần này có đang mượn một thân xác phàm không — Phần 19.4 [BB].
 *
 * Hóa thân chưa thức tỉnh nghĩa là phần thần đang ngủ: vị thần **không nhớ mình
 * là ai**, nên không có lý do gì để họ vẫn đọc được văn bản luật và nhìn thấy cả
 * lãnh địa. Trước đây `chieu()` bỏ qua điều này, và đó là một dòng [BB] còn nợ
 * của Phase 6 — hóa thân có schema, có ràng buộc, nhưng không có hậu quả.
 */
function hoaThanDangNgu(e: Entity | undefined): { thanTheId: string } | null {
  const av = e ? docAspect<{ thanTheId?: string; daThucTinh?: boolean }>(e, 'avatar') : undefined;
  if (!av || av.daThucTinh === true) return null;
  return typeof av.thanTheId === 'string' && av.thanTheId !== '' ? { thanTheId: av.thanTheId } : null;
}

function dungNgocCanh(state: WorldState, modeNguoiChoi: ViewMode, chuTheId: string | null): NgocCanh {
  const chuThe = chuTheId ? state.entities.get(chuTheId) : undefined;

  // [BB] 19.4 — hạ phàm thì tầm nhìn cũng hạ theo. Vị trí lấy theo THÂN XÁC đang
  // mượn, không theo vị thần: một vị thần không có chỗ đứng, một người thì có.
  const hoaThan = modeNguoiChoi === 'than' ? hoaThanDangNgu(chuThe) : null;
  const mode: ViewMode = hoaThan ? 'pham_nhan' : modeNguoiChoi;
  const neoViTri = hoaThan?.thanTheId ?? chuTheId;

  const vungChuTheId = neoViTri ? vungCua(state, neoViTri) : null;

  const lienHe = new Set<string>();
  if (chuTheId) {
    for (const lk of state.links.values()) {
      if (lk.tickDut !== null || lk.trongSo <= 0) continue;
      if (lk.tuId === chuTheId) lienHe.add(lk.denId);
      if (lk.denId === chuTheId) lienHe.add(lk.tuId);
    }
  }
  // Đang trong thân xác nào thì biết những người thân xác ấy biết.
  if (hoaThan) {
    for (const lk of state.links.values()) {
      if (lk.tickDut !== null || lk.trongSo <= 0) continue;
      if (lk.tuId === hoaThan.thanTheId) lienHe.add(lk.denId);
      if (lk.denId === hoaThan.thanTheId) lienHe.add(lk.tuId);
    }
    lienHe.add(hoaThan.thanTheId);
  }

  // Vùng thuộc domain của thần: nơi có mật độ đền > 0.
  // Thần đang hóa thân KHÔNG có tập này — `mode` đã là `pham_nhan`.
  const domainVung = new Set<string>();
  if (mode === 'than' && chuThe) {
    const ven = docAspect<{ matDoDen?: Record<string, number> }>(chuThe, 'venerable');
    for (const [vung, mat] of Object.entries(ven?.matDoDen ?? {})) {
      if (mat > 0) domainVung.add(vung);
    }
  }

  const soul = chuThe ? docAspect<{ kyUc?: unknown[] }>(chuThe, 'soul') : undefined;
  const mortal = chuThe ? docAspect<{ kyNang?: Record<string, number> }>(chuThe, 'mortal') : undefined;
  const kyNang = Object.values(mortal?.kyNang ?? {});
  const triThuc = kyNang.length > 0 ? kyNang.reduce((t, x) => t + x, 0) / kyNang.length : soul ? 40 : 30;

  return {
    state,
    mode,
    modeNguoiChoi,
    dangHoaThan: hoaThan !== null,
    chuTheId,
    chuThe,
    vungChuTheId,
    domainVungIds: domainVung,
    lienHeTrucTiep: lienHe,
    triThuc,
    seed: state.world.seed,
  };
}

/** Sương mù cho một entity, TRƯỚC khi áp trần theo kind. */
function suongMuCua(nc: NgocCanh, e: Entity): MucRo {
  if (nc.mode === 'sang_the') return 'ro';

  if (e.id === nc.chuTheId) return 'ro';

  if (nc.mode === 'than') {
    // Phần 19.1: RÕ nếu thờ phụng thần, hoặc nằm trong lãnh địa.
    if (nc.lienHeTrucTiep.has(e.id)) return 'ro';
    if (nc.domainVungIds.has(e.id)) return 'ro';
    const vung = vungCua(nc.state, e.id);
    if (vung && nc.domainVungIds.has(vung)) return 'mo';
    // Được nhắc bởi tín đồ nhưng ngoài lãnh địa → tin đồn.
    if (nc.domainVungIds.size > 0) return 'tin_don';
    return 'mu';
  }

  // pham_nhan
  if (nc.lienHeTrucTiep.has(e.id)) return 'ro';
  if (nc.vungChuTheId !== null) {
    if (e.id === nc.vungChuTheId) return 'ro';
    const vung = vungCua(nc.state, e.id);
    if (vung !== null && vung === nc.vungChuTheId) return 'ro';
  }
  // Thứ ở xa: nghe kể lại.
  return 'tin_don';
}

/** Lọc aspect theo tầng. Đây là chỗ ba quy tắc cứng của 18.2 được cưỡng chế. */
function locAspect(nc: NgocCanh, e: Entity, muc: MucRoThayDuoc): Readonly<Record<string, unknown>> {
  const ra: Record<string, unknown> = {};

  for (const [ten, duLieu] of Object.entries(e.aspects)) {
    if (duLieu === null || duLieu === undefined) continue;

    // ── lawful ──
    if (ten === 'lawful') {
      const l = duLieu as Record<string, unknown>;
      if (nc.mode === 'sang_the') {
        ra[ten] = l;
        continue;
      }
      // [BB] vanBan bị XÓA với thần ngoài domain và với MỌI phàm nhân.
      const thanTrongDomain = nc.mode === 'than' && muc === 'ro';
      const { vanBan: _vb, keHo: _kh, truongDaXacNhan: _tx, lichSuSua: _ls, ...conLai } = l;
      void _vb;
      void _kh;
      void _tx;
      void _ls;
      ra[ten] = thanTrongDomain ? { ...conLai, vanBan: l['vanBan'] } : conLai;
      continue;
    }

    // ── soul ──
    if (ten === 'soul') {
      const s = duLieu as Record<string, unknown>;
      if (nc.mode === 'sang_the' || e.id === nc.chuTheId) {
        ra[ten] = s;
        continue;
      }
      // [BB] banTinh của thần: phàm nhân KHÔNG BAO GIỜ thấy.
      const laThan = e.aspects['domain'] !== undefined;
      if (nc.mode === 'pham_nhan' && laThan) {
        // Chỉ còn phần quan sát được từ bên ngoài.
        ra[ten] = { tang: s['tang'] };
        continue;
      }
      if (muc === 'ro') {
        ra[ten] = s;
        continue;
      }
      // MỜ: thấy số, không thấy nội tâm.
      ra[ten] = { tang: s['tang'], agency: s['agency'] };
      continue;
    }

    // ── conceptual ──
    if (ten === 'conceptual') {
      const c = duLieu as Record<string, unknown>;
      if (nc.mode === 'sang_the') {
        ra[ten] = c;
        continue;
      }
      if (nc.mode === 'than' && muc === 'ro') {
        ra[ten] = c;
        continue;
      }
      // [BB] trongSo và sacThai bị XÓA với phàm nhân.
      ra[ten] = { giaiDoan: c['giaiDoan'] };
      continue;
    }

    // ── venerable: banTinhTinDoTin là thứ DUY NHẤT phàm nhân được thấy ──
    if (ten === 'venerable') {
      const v = duLieu as Record<string, unknown>;
      if (nc.mode === 'sang_the' || (nc.mode === 'than' && e.id === nc.chuTheId)) {
        ra[ten] = v;
        continue;
      }
      ra[ten] = {
        banTinhTinDoTin: v['banTinhTinDoTin'],
        soTinDoUocLuong: v['soTinDoUocLuong'],
        hienThanh: v['hienThanh'],
      };
      continue;
    }

    /*
     * ── provenance: ai đã sinh ra thứ này — 59.1 ──
     *
     * Đây là tri thức của kẻ đứng ngoài. Một con quái vật KHÔNG mang theo tấm
     * biển ghi "do Sáng Thế Thần tạo, nhịp 118442", nên trường này bị xóa hẳn ở
     * hai tầng dưới — trừ đúng một trường hợp: chính chủ thể là người đã tạo ra
     * nó, và người ta thì nhớ việc mình làm.
     */
    if (ten === 'provenance') {
      if (nc.mode === 'sang_the') {
        ra[ten] = duLieu;
        continue;
      }
      const p = duLieu as Record<string, unknown>;
      if (nc.chuTheId !== null && p['actorId'] === nc.chuTheId) ra[ten] = p;
      continue;
    }

    // ── divisible: doPhanKy chỉ Sáng Thế ──
    if (ten === 'divisible') {
      const d = duLieu as Record<string, unknown>;
      if (nc.mode === 'sang_the') {
        ra[ten] = d;
        continue;
      }
      ra[ten] = { phanThanIds: d['phanThanIds'] };
      continue;
    }

    // ── aspect nền của Thế Giới Sống ──
    // [BB] 56.2 — "Sổ Tay không lộ số". Phàm nhân sống trong những con số này
    // nhưng không đọc được chúng: họ biết mình đói, không biết `thieuHut = 0.42`.
    if (ASPECT_NEN.has(ten)) {
      if (nc.mode === 'sang_the') {
        ra[ten] = duLieu;
        continue;
      }
      const dinhTinh = dinhTinhHoa(ten, duLieu as Record<string, unknown>);
      // Thần nhìn từ trên: thấy quy mô, không thấy sổ sách của từng nhà.
      if (nc.mode === 'than' && muc === 'ro') {
        ra[ten] = { ...dinhTinh, ...quyMoChoThan(ten, duLieu as Record<string, unknown>) };
        continue;
      }
      if (Object.keys(dinhTinh).length > 0) ra[ten] = dinhTinh;
      continue;
    }

    // ── còn lại: rõ thì đủ, mờ/tin đồn thì rút gọn ──
    if (muc === 'ro') {
      ra[ten] = duLieu;
      continue;
    }
    if (typeof duLieu === 'object') {
      // Giữ vài trường quan sát được từ ngoài; bỏ phần nội tâm/chi tiết.
      const o = duLieu as Record<string, unknown>;
      const giu: Record<string, unknown> = {};
      for (const k of ['danSo', 'toaDo', 'banKinh', 'ageBand', 'ngheId', 'moHinhCaiTri', 'nhip']) {
        if (o[k] !== undefined) giu[k] = o[k];
      }
      if (Object.keys(giu).length > 0) ra[ten] = giu;
      continue;
    }
    ra[ten] = duLieu;
  }

  return ra;
}

function chieuEntity(nc: NgocCanh, e: Entity, muc: MucRoThayDuoc): ProjectedEntity {
  const daBopMeo = muc === 'tin_don';
  const chang = muc === 'tin_don' ? 2 : muc === 'mo' ? 1 : 0;
  const meo = daBopMeo
    ? bopMeo(e.ten, e.moTa, { chang, triThuc: nc.triThuc, thienVi: 'phong_dai', seed: nc.seed })
    : { ten: e.ten, moTa: e.moTa, mucMeo: 0 };

  return Object.freeze({
    id: e.id,
    kind: e.kind,
    ten: meo.ten,
    aliases: daBopMeo ? [] : [...e.aliases],
    moTa: meo.moTa,
    tags: muc === 'ro' ? [...e.tags] : [],
    tickSinh: nc.mode === 'sang_the' ? e.tickSinh : null,
    mucRo: muc,
    aspects: locAspect(nc, e, muc),
    daBopMeo,
  });
}

/** Diễn giải luật của vùng chủ thể — bản đã LỆCH. */
function dienGiaiCuaVung(
  lawful: Record<string, unknown>,
  vungId: string | null,
): { noiDung: string; doLech: number } {
  const ds = (lawful['dienGiai'] ?? []) as { vungId?: string; noiDung?: string; doLech?: number }[];
  if (ds.length === 0) return { noiDung: '', doLech: 0 };
  const khop = vungId ? ds.find((d) => d.vungId === vungId) : undefined;
  const chon = khop ?? ds[0];
  return { noiDung: chon?.noiDung ?? '', doLech: chon?.doLech ?? 0 };
}

function chieuLaw(nc: NgocCanh, e: Entity, muc: MucRoThayDuoc): ProjectedLaw {
  const l = (docAspect<Record<string, unknown>>(e, 'lawful') ?? {}) as Record<string, unknown>;
  const dg = dienGiaiCuaVung(l, nc.vungChuTheId);
  const pv = (l['phamVi'] ?? {}) as { loai?: string };

  // [BB] 18.2 — vanBan: Sáng Thế đầy đủ; Thần chỉ trong domain; Phàm nhân KHÔNG BAO GIỜ.
  const vanBan =
    nc.mode === 'sang_the'
      ? ((l['vanBan'] as string) ?? '')
      : nc.mode === 'than' && muc === 'ro'
        ? ((l['vanBan'] as string) ?? '')
        : null;

  return Object.freeze({
    id: e.id,
    ten: e.ten,
    vanBan,
    dienGiai: dg.noiDung,
    doLech: dg.doLech,
    phamVi: pv.loai ?? 'vu_tru',
    mucRo: muc,
  });
}

function chieuConcept(nc: NgocCanh, e: Entity, muc: MucRoThayDuoc): ProjectedConcept {
  const c = (docAspect<Record<string, unknown>>(e, 'conceptual') ?? {}) as Record<string, unknown>;
  const day = nc.mode === 'sang_the' || (nc.mode === 'than' && muc === 'ro');

  return Object.freeze({
    id: e.id,
    ten: e.ten,
    // [BB] Phàm nhân KHÔNG thấy trọng số.
    trongSo: day ? ((c['trongSo'] as number) ?? 0) : null,
    giaiDoan: day ? ((c['giaiDoan'] as string) ?? null) : ((c['giaiDoan'] as string) ?? null),
    sacThai: day ? ((c['sacThai'] as Record<string, number>) ?? {}) : null,
    mucRo: muc,
  });
}

/**
 * [BB] Phần 18.2 — phàm nhân chỉ biết khái niệm đã có TÊN trong văn hóa vùng mình.
 * Khái niệm còn `hu_danh` thì chưa ai đặt tên, nên nó vô hình với phàm nhân.
 */
function phamNhanBietKhaiNiem(e: Entity): boolean {
  const c = docAspect<{ giaiDoan?: string }>(e, 'conceptual');
  return c?.giaiDoan !== 'hu_danh';
}

function dongTuKhaDung(mode: ViewMode): readonly VerbHandle[] {
  napDungSan();
  // [BB] Sáu động từ là phép toán bản thể của SÁNG THẾ (Phần 67.1).
  // Thần và phàm nhân hành động qua Intent/R.action, không qua chúng.
  if (mode !== 'sang_the') return [];
  return R.verb.tatCa().map((v) =>
    Object.freeze({
      id: v.id,
      ten: v.ten,
      moTa: v.moTa ?? '',
      coChatHopLe: [...v.coChatHopLe],
    }),
  );
}

/**
 * Cạnh chỉ lọt vào view khi CẢ HAI đầu đã lọt — Phần 6.4 [BB].
 *
 * Cách này chặt hơn "lọc sau khi mở rộng": một cạnh nối tới entity `mu` không
 * tồn tại trong view, nên `moRong()` không có gì để đi tới, và cũng không có
 * cách nào suy ra sự tồn tại của đầu kia bằng cách đếm số cạnh cụt.
 */
function chieuLinks(state: WorldState, thay: ReadonlySet<string>): readonly ProjectedLink[] {
  const ra: ProjectedLink[] = [];
  const ids = [...state.links.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const id of ids) {
    const lk = state.links.get(id);
    if (!lk) continue;
    if (!thay.has(lk.tuId) || !thay.has(lk.denId)) continue;
    ra.push(
      Object.freeze({
        id: lk.id,
        tuId: lk.tuId,
        denId: lk.denId,
        quanHe: lk.quanHe,
        trongSo: lk.trongSo,
        daDut: lk.tickDut !== null,
      }),
    );
  }
  return Object.freeze(ra);
}

/**
 * Mạch truyện chủ thể được biết — Phần 28.2.
 *
 * Hai đường vào, không có đường thứ ba:
 *   - `nguoiChoiBiet = true` (bản tin đã tới họ, hoặc ống kính đã chiếu);
 *   - chủ thể ĐANG LÀ một nhân vật trong mạch — mình ở trong chuyện thì mình biết.
 *
 * Ở tầng Sáng Thế thì thấy hết: 18.1 nói đó là tầng nhìn từ trên xuống.
 */
function chieuMachTruyen(nc: NgocCanh, thay: ReadonlySet<string>): readonly ProjectedStoryline[] {
  const ra: ProjectedStoryline[] = [];
  const ids = [...nc.state.storylines.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const id of ids) {
    const m = nc.state.storylines.get(id);
    if (!m) continue;
    const trongCuoc = nc.chuTheId !== null && m.nhanVat.some((n) => n.entityId === nc.chuTheId);
    if (nc.mode !== 'sang_the' && !m.nguoiChoiBiet && !trongCuoc) continue;

    ra.push(
      Object.freeze({
        id: m.id,
        ten: m.ten,
        loai: m.loai,
        giaiDoan: m.giaiDoan,
        cangThang: m.cangThang,
        nhanVat: Object.freeze(
          // Nhân vật mà chủ thể chưa biết tới thì không được lộ tên ở đây.
          m.nhanVat
            .filter((n) => thay.has(n.entityId))
            .map((n) =>
              Object.freeze({
                entityId: n.entityId,
                ten: nc.state.entities.get(n.entityId)?.ten ?? n.entityId,
                vaiTro: n.vaiTro,
              }),
            ),
        ),
        kyUcMach: m.kyUcMach,
        nutThatChuaGo: Object.freeze(m.nutThat.filter((n) => !n.daGo).map((n) => n.moTa)),
        phucButChuaTra: Object.freeze(
          m.phucBut
            .map((pid) => nc.state.foreshadows.get(pid))
            .filter((f) => f !== undefined && !f.daTra)
            .map((f) => (f as { noiDung: string }).noiDung),
        ),
        nguoiChoiBiet: m.nguoiChoiBiet,
      }),
    );
  }
  return Object.freeze(ra);
}

function nhipCua(mode: ViewMode): NhipThoiGian {
  // Phần 1.2: Sáng Thế phi tuyến, Thần gần thời gian thực, Phàm nhân tuyến tính.
  if (mode === 'sang_the') return 'the_dai';
  if (mode === 'than') return 'nien';
  return 'nhat';
}

/**
 * Chiếu một World thành WorldView cho (mode, chuTheId).
 *
 * [BB] Đây là cửa DUY NHẤT mà Assembler, retrieval, rerank và UI được đọc thế giới.
 */
// ─────────────────────────────────────────── năm khối cho hai bảng (55.5, 58.12)

/**
 * Vùng "Khi nào" — 55.5 hàng đầu.
 *
 * Ba tầng đọc ba đồng hồ khác nhau, và đó không phải chuyện trình bày: một phàm
 * nhân **không có** khái niệm "nhịp 118442". Họ có "mùa thứ ba đời vua Nefru".
 * Nên tick và year bị XÓA khỏi đối tượng ở tầng dưới, chứ không được để đó rồi
 * dặn UI đừng in ra.
 */
function chieuThoiCuoc(nc: NgocCanh): ProjectedThoiCuoc {
  const w = nc.state.world;
  const nhip = nhipCua(nc.mode);
  const era = nc.state.entities.get(w.eraId);
  const tenKyNguyen = era?.ten ?? '';

  if (nc.mode === 'pham_nhan') {
    /**
     * Mốc đời người — 58.12 hàng "Dải định vị". Tìm người cầm quyền mà chủ thể
     * biết RÕ; không có ai thì đếm mùa, vì mùa thì ai cũng đếm được.
     */
    const mua = ['xuân', 'hạ', 'thu', 'đông'][Math.abs(w.tick) % 4] ?? 'xuân';
    return Object.freeze({
      eraId: w.eraId,
      tenKyNguyen: '',
      tick: null,
      year: null,
      moTaThoiDiem: tenKyNguyen === '' ? `mùa ${mua}` : `mùa ${mua}, thời ${tenKyNguyen}`,
      nhip,
    });
  }

  if (nc.mode === 'than') {
    // [BB] 55.5 — thần thấy năm và mùa, KHÔNG thấy tick.
    return Object.freeze({
      eraId: w.eraId,
      tenKyNguyen,
      tick: null,
      year: w.year,
      moTaThoiDiem: tenKyNguyen === '' ? `năm ${w.year}` : `${tenKyNguyen} · năm ${w.year}`,
      nhip,
    });
  }

  return Object.freeze({
    eraId: w.eraId,
    tenKyNguyen,
    tick: w.tick,
    year: w.year,
    moTaThoiDiem: (tenKyNguyen === '' ? '' : `${tenKyNguyen} · `) + `năm ${w.year} · nhịp ${w.tick}`,
    nhip,
  });
}

/** [BB] 55.5 — năm con số này chỉ Sáng Thế Thần được thấy. */
function chieuChiSo(nc: NgocCanh): ProjectedChiSo | null {
  if (nc.mode !== 'sang_the') return null;
  const m = nc.state.metrics;
  return Object.freeze({
    thucTai: m.realityIntegrity,
    songDong: m.doSongDong,
    tuQuyet: m.agencyTrungBinh,
    tuSinh: m.tuSinhSuKien,
    phuThuoc: m.doPhuThuocTB,
  });
}

/**
 * Bảy trục Luật Nền đã chiếu — 55.5 hàng "Thế giới là gì".
 *
 * Sáng Thế thấy cả bảy, kể cả trục vô danh — vô danh vẫn là một sự thật về thế
 * giới. Thần chỉ thấy trục đã `co_ten` **và** có khái niệm nền nằm trong tầm
 * nhìn của mình: một vị thần biết cái tên vì cái tên đã được nói ra trong thế
 * giới, chứ không phải vì họ là thần. Phàm nhân không có vùng này.
 */
function chieuLuatNen(nc: NgocCanh, thay: ReadonlySet<string>): readonly ProjectedTrucNen[] {
  if (nc.mode === 'pham_nhan') return Object.freeze([]);
  const ds = [...nc.state.substrateLaws.values()];
  const ra: ProjectedTrucNen[] = [];

  for (const truc of TRUC_NEN) {
    const ln = ds.find((x) => x.truc === truc);
    const coTen = ln?.trangThai === 'co_ten';
    const nenId = ln?.khaiNiemNenId ?? null;
    if (nc.mode === 'than' && (!coTen || nenId === null || !thay.has(nenId))) continue;
    ra.push(
      Object.freeze({
        truc,
        ten: NHAN_TRUC_NEN[truc],
        trangThai: coTen ? ('co_ten' as const) : ('vo_danh' as const),
        tenKhaiNiemNen: nenId === null ? '' : (nc.state.entities.get(nenId)?.ten ?? ''),
        soKeHo: ln?.keHo.length ?? 0,
        soKeHoDaKhaiThac: ln?.keHo.filter((k) => k.daBiKhaiThac).length ?? 0,
        khaNghich: ln?.khaNghich.duocKhong ?? false,
      }),
    );
  }
  return Object.freeze(ra);
}

/**
 * Cơ Chế Phái Sinh — 44.4.
 *
 * Chỉ Sáng Thế Thần: cơ chế là **vật lý khả dĩ** của thế giới, và biết vật lý
 * của mình là đặc quyền của kẻ đứng ngoài nó.
 */
function chieuCoChe(nc: NgocCanh): readonly ProjectedCoChe[] {
  if (nc.mode !== 'sang_the') return Object.freeze([]);
  const ids = Object.keys(CO_CHE).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return Object.freeze(
    ids.map((id) => {
      const dn = CO_CHE[id as keyof typeof CO_CHE];
      const r = nc.state.coChe.get(id);
      return Object.freeze({
        id,
        ten: dn.ten,
        bat: r?.bat ?? false,
        // [BB] 44.5 — "chưa có" phải nói rõ còn thiếu gì, nếu không nó chỉ là chữ "không".
        conThieu: Object.freeze([...(r?.conThieu ?? (r === undefined ? ['chưa quét'] : []))]),
      });
    }),
  );
}

/** Vùng "Đã lệch bao xa" — 35.6. [BB] 55.5 cho Sáng Thế Thần và chỉ họ. */
function chieuDiBiet(nc: NgocCanh): readonly ProjectedDiBiet[] {
  if (nc.mode !== 'sang_the') return Object.freeze([]);
  const dem = new Map<string, { thoa: number; cho: number; lech: number; batKha: number }>();

  for (const kv of nc.state.loreExpectations.values()) {
    const lb = nc.state.lorebooks.get(kv.lorebookId);
    const nguon = lb?.thanHe !== undefined && lb.thanHe !== '' ? lb.thanHe : (lb?.ten ?? 'chưa rõ nguồn');
    const o = dem.get(nguon) ?? { thoa: 0, cho: 0, lech: 0, batKha: 0 };
    if (kv.trangThai === 'da_thoa') o.thoa++;
    else if (kv.trangThai === 'da_lech') o.lech++;
    else if (kv.trangThai === 'bat_kha') o.batKha++;
    else o.cho++;
    dem.set(nguon, o);
  }

  return Object.freeze(
    [...dem.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([nguon, o]) => Object.freeze({ nguon, ...o })),
  );
}

/**
 * Phục bút chủ thể có cửa để biết — 30.2.
 *
 * Lọc theo MẠCH: một lời hứa gieo trong mạch mà chủ thể chưa từng nghe tới thì
 * chưa phải việc của họ. Phục bút không gắn mạch nào (`machId = null`) là phục
 * bút của cả thế giới, và chỉ Sáng Thế Thần thấy nó.
 */
function chieuPhucBut(nc: NgocCanh, machBiet: ReadonlySet<string>): readonly ProjectedPhucBut[] {
  const tick = nc.state.world.tick;
  const ra: ProjectedPhucBut[] = [];
  for (const f of nc.state.foreshadows.values()) {
    if (f.daTra) continue;
    if (f.machId === null) {
      if (nc.mode !== 'sang_the') continue;
    } else if (!machBiet.has(f.machId)) continue;
    ra.push(
      Object.freeze({
        id: f.id,
        noiDung: f.noiDung,
        machId: f.machId,
        loai: f.loai,
        doNang: f.doNang,
        quaHan: f.hanTraToiDa !== null && tick > f.tickGieo + f.hanTraToiDa,
      }),
    );
  }
  ra.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return Object.freeze(ra);
}

/**
 * Lời cầu chủ thể nghe được — 22.2.
 *
 * [BB] Phàm nhân KHÔNG có vùng này. Họ là người cầu, không phải người nhận, và
 * cho họ thấy hàng chờ lời cầu là cho họ thấy sổ của thần.
 */
function chieuLoiCau(nc: NgocCanh): readonly ProjectedLoiCau[] {
  if (nc.mode === 'pham_nhan') return Object.freeze([]);
  const tick = nc.state.world.tick;
  const ra: ProjectedLoiCau[] = [];
  for (const p of nc.state.prayers.values()) {
    if (p.daTraLoi) continue;
    // Thần chỉ nghe lời gọi đúng tên mình, hoặc lời cầu chung chưa gọi ai.
    if (nc.mode === 'than' && p.thanNhanId !== null && p.thanNhanId !== nc.chuTheId) continue;
    const con = p.hanChot === null ? null : p.hanChot - tick;
    const tong = p.hanChot === null ? 0 : p.hanChot - p.tickCau;
    ra.push(
      Object.freeze({
        id: p.id,
        noiDung: p.noiDung,
        soNguoi: p.soNguoi,
        cuongDo: p.cuongDo,
        sapHetHan: con !== null && tong > 0 && con <= tong * 0.2,
      }),
    );
  }
  ra.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return Object.freeze(ra);
}

/** Lỗ hổng — 15.1. [BB] sổ của engine, chỉ Sáng Thế Thần đọc được. */
function chieuLoHong(nc: NgocCanh): readonly ProjectedLoHong[] {
  if (nc.mode !== 'sang_the') return Object.freeze([]);
  const tick = nc.state.world.tick;
  const ra: ProjectedLoHong[] = [];
  for (const g of nc.state.gaps.values()) {
    if (g.trangThai === 'da_giai') continue;
    ra.push(
      Object.freeze({
        id: g.id,
        moTa: g.moTa,
        loai: g.loai,
        uuTien: g.uuTien,
        tonBaoLau: Math.max(0, tick - g.tickPhatHien),
      }),
    );
  }
  ra.sort((a, b) => (b.uuTien !== a.uuTien ? b.uuTien - a.uuTien : a.id < b.id ? -1 : 1));
  return Object.freeze(ra);
}

export function chieu(state: WorldState, mode: ViewMode, chuTheId: string | null): WorldView {
  napDungSan();
  const nc = dungNgocCanh(state, mode, chuTheId);

  const entities = new Map<string, ProjectedEntity>();
  const laws: ProjectedLaw[] = [];
  const concepts: ProjectedConcept[] = [];
  const ro: string[] = [];
  const mo: string[] = [];
  const tinDon: string[] = [];
  const mu: string[] = [];

  // Sắp xếp deterministic theo codepoint để view ổn định giữa các lần chạy.
  const ids = [...state.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  for (const id of ids) {
    const e = state.entities.get(id);
    if (!e) continue;

    const kd = R.kind.lay(e.kind);
    // Lọc theo `nc.mode` — tầng HIỆU DỤNG. Dùng `mode` ở đây là cách rò rỉ
    // nguyên vẹn tầm nhìn thần cho một vị thần đang nằm trong thân xác nông dân.
    const tran = kd ? tranTheoKind(kd.phanChieu, nc.mode) : nc.mode === 'sang_the' ? 'ro' : 'tin_don';
    let muc = thapHon(suongMuCua(nc, e), tran);

    // [BB] Khái niệm chưa có tên trong văn hóa thì phàm nhân không biết nó tồn tại.
    if (nc.mode === 'pham_nhan' && e.kind === 'concept' && !phamNhanBietKhaiNiem(e)) muc = 'mu';

    if (muc === 'mu') {
      mu.push(id);
      continue;
    }

    const pe = chieuEntity(nc, e, muc);
    entities.set(id, pe);
    if (muc === 'ro') ro.push(id);
    else if (muc === 'mo') mo.push(id);
    else tinDon.push(id);

    if (e.kind === 'law') laws.push(chieuLaw(nc, e, muc));
    if (e.kind === 'concept') concepts.push(chieuConcept(nc, e, muc));
  }

  /**
   * visibilityHash — Phần 77.8. Đổi tầm nhìn thì cache rerank cũ phải vô hiệu.
   * Băm cả tập id lẫn MỨC của từng id, vì cùng một tập id ở hai mức khác nhau
   * là hai tầm nhìn khác nhau.
   */
  const visibilityHash = hashGop({
    // Băm tầng HIỆU DỤNG: hạ phàm là một tầm nhìn khác, nên cache cũ phải vô hiệu.
    mode: hashCua(nc.mode),
    hoaThan: hashCua(nc.dangHoaThan),
    chuThe: hashCua(chuTheId),
    ro: hashCua(ro),
    mo: hashCua(mo),
    tinDon: hashCua(tinDon),
    mu: hashCua(mu),
  });

  const thay: ReadonlySet<string> = new Set(entities.keys());
  const mach = chieuMachTruyen(nc, thay);
  const machBiet: ReadonlySet<string> = new Set(mach.map((m) => m.id));

  return Object.freeze({
    mode,
    mucChieu: nc.mode,
    dangHoaThan: nc.dangHoaThan,
    chuTheId,
    branchId: state.world.branchId,
    tick: state.world.tick,
    entities,
    links: chieuLinks(state, thay),
    laws: Object.freeze(laws),
    concepts: Object.freeze(concepts),
    machTruyen: mach,
    suongMu: Object.freeze({
      ro: Object.freeze(ro),
      mo: Object.freeze(mo),
      tinDon: Object.freeze(tinDon),
      mu: Object.freeze(mu),
    }),
    dongTuKhaDung: dongTuKhaDung(nc.mode),
    nhipThoiGian: nhipCua(nc.mode),
    thoiCuoc: chieuThoiCuoc(nc),
    chiSo: chieuChiSo(nc),
    luatNen: chieuLuatNen(nc, thay),
    coChe: chieuCoChe(nc),
    diBiet: chieuDiBiet(nc),
    phucBut: chieuPhucBut(nc, machBiet),
    loiCau: chieuLoiCau(nc),
    loHong: chieuLoHong(nc),
    visibilityHash,
  });
}
