/**
 * Bảng Thần Điện — chỗ đứng của một vị thần trong thần hệ của mình.
 *
 * Bảng này thay Bảng Lãnh Địa cũ (56.4). Bảng cũ trả lời "bao nhiêu người thờ
 * ngươi"; bảng này trả lời ba câu khác:
 *
 *   VỊ TRÍ    ngươi ngồi ghế nào trong thần điện, và đứng thứ mấy
 *   QUY LUẬT  luật nào đang ràng ngươi — luật của hội đồng, lời ngươi đã thề,
 *             và luật nền mà kể cả thần cũng không cãi được
 *   SỨC MẠNH  thẩm quyền thế giới đang quy cho ngươi, chia theo từng domain
 *
 * ── Vì sao thần khác chỉ có chữ, không có số ──
 *
 * [BB] 56.4 + 19.1: "chỉ số TRONG domain, mọi thứ ngoài lãnh địa hiện dưới dạng
 * tin đồn". Ghế và vai trong hội đồng là chuyện công khai của thiết chế nên in
 * thẳng được. Nhưng `tiengNoiCua` suy từ tín đồ, đền và sức domain của người
 * khác — đó là thứ NGOÀI lãnh địa người chơi. In con số ấy ra là rò rỉ, dù con
 * số ấy đúng. Nên thần khác chỉ nhận một chữ so sánh: nặng hơn, ngang, nhẹ hơn.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Domain } from '../schema/aspect/divine.js';
import type { DomainState } from '../schema/aspect/thanVi.js';
import type { HoiDong, VaiHoiDong } from '../schema/aspect/hoiDong.js';
import { NHAN_VAI_HOI_DONG } from '../schema/aspect/hoiDong.js';
import type { Institutional } from '../schema/aspect/living.js';
import type { GiaoUoc } from '../schema/than.js';
import { NHAN_TRUC_NEN } from '../vatly/luatNen.js';
import { tiengNoiCua, ungVienKeVi } from './hoiDong.js';

function docAspect<T>(e: Entity, ten: string): T | undefined {
  const a = e.aspects[ten];
  return a === undefined || a === null ? undefined : (a as T);
}

/** Luật kế vị của hội đồng — 69.3. Nhãn viết cho người đọc, không lộ enum. */
const NHAN_LUAT_KE_VI: Readonly<Record<string, string>> = Object.freeze({
  bau_phieu: 'hội đồng bầu',
  huyet_thong: 'truyền theo huyết thống',
  manh_nhat: 'ai được quy cho nhiều thẩm quyền nhất thì ngồi',
  chi_dinh: 'người ngồi ghế đầu chỉ định',
  khong_co: 'không có luật kế vị — ghế đầu trống thì trống mãi',
});

/** Kế vị của thiết chế (`institutional.keVi`) khi thần hệ chưa lập hội đồng. */
const NHAN_KE_VI_THIET_CHE: Readonly<Record<string, string>> = Object.freeze({
  huyet_thong: 'truyền theo huyết thống',
  bau_cu: 'bầu cử',
  chi_dinh: 'người đứng đầu chỉ định',
  thu_thach: 'ai qua được thử thách thì ngồi',
  khong_co: 'chưa có luật kế vị',
});

const NHAN_MO_HINH: Readonly<Record<string, string>> = Object.freeze({
  hoi_dong: 'hội đồng',
  quan_chu: 'quân chủ',
  than_quyen: 'thần quyền',
  bo_lac: 'bộ lạc',
  vo_chinh_phu: 'không ai cai trị',
  quan_lieu: 'quan liêu',
});

const NHAN_AI_NGHICH_DUOC: Readonly<Record<string, string>> = Object.freeze({
  khong_ai: 'không ai cãi được',
  sang_the_than: 'chỉ Sáng Thế Thần cãi được',
  than_toi_cao: 'chỉ thần tối cao cãi được',
});

/** Sức nặng tiếng nói của một vị thần khác, nói bằng chữ chứ không bằng số. */
export type SoSanhTiengNoi = 'nang_hon' | 'ngang' | 'nhe_hon';

export const NHAN_SO_SANH: Readonly<Record<SoSanhTiengNoi, string>> = Object.freeze({
  nang_hon: 'tiếng nói nặng hơn ngươi',
  ngang: 'tiếng nói ngang ngươi',
  nhe_hon: 'tiếng nói nhẹ hơn ngươi',
});

export type ThanhVienThanDien = {
  readonly id: string;
  readonly ten: string;
  /** Vai công khai trong hội đồng, hoặc chức vụ trong thiết chế. */
  readonly nhanVai: string;
  readonly laNguoiChoi: boolean;
  readonly soSanh: SoSanhTiengNoi;
};

export type ViTriThanDien = {
  readonly thanHeId: string | null;
  readonly tenThanHe: string;
  readonly moHinh: string;
  /** `null` khi vị thần thuộc thần hệ nhưng chưa được cho ghế nào. */
  readonly vai: VaiHoiDong | null;
  readonly nhanVai: string;
  /** Hạng theo thẩm quyền trong chính thần hệ này; 0 khi không xếp được. */
  readonly hang: number;
  readonly tongThanhVien: number;
  readonly tickNhanGhe: number | null;
};

export type QuyLuatThanDien = {
  /** Luật kế vị, viết thành câu. */
  readonly keVi: string;
  /** Tỉ lệ phiếu thuận cần để nghị quyết đi qua; `null` khi chưa có hội đồng. */
  readonly nguongThongQua: number | null;
  /** Ghế đầu đang trống — kế vị đang mở. */
  readonly gheDauTrong: boolean;
  readonly soUngVienKeVi: number;
  /** Điều khoản CHÍNH vị thần này phải giữ — [BB] 69.2 thần cũng bị ràng buộc. */
  readonly loiDaThe: readonly string[];
  /** Luật nền đã có tên: thứ kể cả thần cũng phải theo — 43.3. */
  readonly luatNen: readonly { readonly ten: string; readonly aiNghichDuoc: string }[];
};

export type SucManhThanDien = {
  /** Thẩm quyền thế giới quy cho vị thần này — số của CHÍNH mình nên in được. */
  readonly thamQuyen: number;
  /** Thẩm quyền lớn nhất trong thần hệ, để vẽ thanh so sánh. Bằng 0 nếu đứng một mình. */
  readonly thamQuyenCaoNhat: number;
  readonly domains: readonly DomainState[];
};

export type TinDonNgoai = {
  readonly noiDung: string;
  readonly soNguon: number;
  readonly daXacNhan: boolean;
};

export type DuLieuThanDien = {
  readonly tenThan: string;
  readonly viTri: ViTriThanDien;
  readonly quyLuat: QuyLuatThanDien;
  readonly sucManh: SucManhThanDien;
  readonly thanhVien: readonly ThanhVienThanDien[];
  readonly ngoaiThanDien: readonly TinDonNgoai[];
};

/**
 * Thần hệ mà một vị thần thuộc về.
 *
 * Đọc hai đường vì hai đường đều được dùng thật: `domain.thanHeId` do wizard
 * hiện diện ghi (78.4), còn link `thuoc_than_he` là quan hệ chính tắc. Save cũ
 * có thể chỉ có một trong hai.
 */
export function thanHeCua(state: WorldState, thanId: string): Entity | null {
  const e = state.entities.get(thanId);
  if (!e) return null;

  const dom = docAspect<Domain>(e, 'domain');
  if (dom?.thanHeId != null) {
    const the = state.entities.get(dom.thanHeId);
    if (the && the.tickDiet === null) return the;
  }

  for (const id of [...state.links.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const lk = state.links.get(id);
    if (!lk || lk.tickDut !== null) continue;
    if (lk.tuId !== thanId || lk.quanHe !== 'thuoc_than_he') continue;
    const the = state.entities.get(lk.denId);
    if (the && the.tickDiet === null) return the;
  }
  return null;
}

/**
 * Mọi vị thần thuộc một thần hệ.
 *
 * Gộp ba nguồn vì thần hệ có thể mới chỉ có một trong ba: ghế hội đồng, danh
 * sách thành viên của thiết chế, và link `thuoc_than_he`. Sắp theo id để danh
 * sách không đổi giữa hai lần chạy.
 */
export function thanhVienThanHe(state: WorldState, thanHeId: string): readonly string[] {
  const the = state.entities.get(thanHeId);
  if (!the) return [];

  const gom = new Set<string>();
  for (const g of docAspect<HoiDong>(the, 'hoi_dong')?.ghe ?? []) gom.add(g.thanId);
  for (const id of docAspect<Institutional>(the, 'institutional')?.thanhVienIds ?? []) gom.add(id);
  for (const lk of state.links.values()) {
    if (lk.tickDut === null && lk.quanHe === 'thuoc_than_he' && lk.denId === thanHeId) gom.add(lk.tuId);
  }

  return Object.freeze(
    [...gom]
      .filter((id) => {
        const e = state.entities.get(id);
        return e !== undefined && e.kind === 'deity' && e.tickDiet === null;
      })
      .sort((a, b) => (a < b ? -1 : 1)),
  );
}

/** Vai của một vị thần: ghế hội đồng trước, chức vụ thiết chế sau, rồi mới tới "chưa có ghế". */
function vaiCua(
  the: Entity | null,
  thanId: string,
): { vai: VaiHoiDong | null; nhan: string; tickNhanGhe: number | null } {
  if (!the) return { vai: null, nhan: 'không thuộc thần hệ nào', tickNhanGhe: null };

  const ghe = docAspect<HoiDong>(the, 'hoi_dong')?.ghe.find((g) => g.thanId === thanId);
  if (ghe) return { vai: ghe.vai, nhan: NHAN_VAI_HOI_DONG[ghe.vai], tickNhanGhe: ghe.tickNhanGhe };

  const chuc = docAspect<Institutional>(the, 'institutional')?.chucVu.find((c) => c.nguoiGiuId === thanId);
  if (chuc) return { vai: null, nhan: `giữ chức ${chuc.ten}`, tickNhanGhe: chuc.tickNhamChuc };

  return { vai: null, nhan: 'có tên trong thần hệ, chưa có ghế', tickNhanGhe: null };
}

/** Lời thề chính vị thần này phải giữ — đọc từ entity `covenant` còn hiệu lực. */
function loiDaThe(state: WorldState, thanId: string): readonly string[] {
  const ra: string[] = [];
  for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const e = state.entities.get(id);
    if (!e || e.tickDiet !== null) continue;
    const gu = docAspect<GiaoUoc>(e, 'giao_uoc');
    if (!gu || gu.trangThai !== 'hieu_luc') continue;
    if (gu.benAId !== thanId && gu.benBId !== thanId) continue;
    for (const dk of gu.dieuKhoan) {
      if (dk.benGiu !== thanId || dk.daViPham) continue;
      ra.push(dk.noiDung === '' ? 'một điều khoản chưa ai chép lại thành lời' : dk.noiDung);
    }
  }
  return Object.freeze(ra.slice(0, 6));
}

/** Luật nền đã có tên trong nhánh này — thứ ràng cả thần, 43.3. */
function luatNenCoTen(state: WorldState): readonly { ten: string; aiNghichDuoc: string }[] {
  const ra: { ten: string; aiNghichDuoc: string }[] = [];
  for (const id of [...state.substrateLaws.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const ln = state.substrateLaws.get(id);
    if (!ln || ln.branchId !== state.world.branchId || ln.trangThai !== 'co_ten') continue;
    ra.push({
      ten: NHAN_TRUC_NEN[ln.truc],
      aiNghichDuoc: ln.khaNghich.duocKhong
        ? (NHAN_AI_NGHICH_DUOC[ln.khaNghich.boiAi] ?? 'chưa rõ ai cãi được')
        : 'không ai cãi được',
    });
  }
  return Object.freeze(ra.slice(0, 4));
}

/**
 * Dựng toàn bộ dữ liệu Bảng Thần Điện cho một vị thần.
 *
 * Trả `null` khi id không phải một vị thần còn sống — gọi ở tầng khác thì bảng
 * này không có nghĩa gì, và trả về một bảng rỗng sẽ nói dối điều đó.
 */
export function tinhBangThanDien(state: WorldState, thanId: string): DuLieuThanDien | null {
  const e = state.entities.get(thanId);
  if (!e || e.kind !== 'deity' || e.tickDiet !== null) return null;

  const the = thanHeCua(state, thanId);
  const hd = the ? docAspect<HoiDong>(the, 'hoi_dong') : undefined;
  const inst = the ? docAspect<Institutional>(the, 'institutional') : undefined;

  // ── vị trí ──
  const dsId = the ? thanhVienThanHe(state, the.id) : [];
  const thamQuyen = tiengNoiCua(state, thanId);
  const xepHang = dsId
    .map((id) => ({ id, diem: tiengNoiCua(state, id) }))
    .sort((a, b) => (b.diem !== a.diem ? b.diem - a.diem : a.id < b.id ? -1 : 1));
  const hang = xepHang.findIndex((x) => x.id === thanId) + 1;
  const cuaMinh = vaiCua(the, thanId);

  const viTri: ViTriThanDien = {
    thanHeId: the?.id ?? null,
    tenThanHe: the?.ten ?? '',
    moHinh: the ? (NHAN_MO_HINH[inst?.moHinhCaiTri ?? 'hoi_dong'] ?? 'chưa thành hình') : '',
    vai: cuaMinh.vai,
    nhanVai: cuaMinh.nhan,
    hang,
    tongThanhVien: dsId.length,
    tickNhanGhe: cuaMinh.tickNhanGhe,
  };

  // ── quy luật ──
  const gheDauTrong =
    hd !== undefined && (hd.tickGheDauTrong !== null || !hd.ghe.some((g) => g.vai === 'chu_tich'));
  const quyLuat: QuyLuatThanDien = {
    keVi: hd
      ? (NHAN_LUAT_KE_VI[hd.luatKeVi] ?? 'chưa rõ')
      : the
        ? (NHAN_KE_VI_THIET_CHE[inst?.keVi ?? 'khong_co'] ?? 'chưa có luật kế vị')
        : 'không thần hệ nào ràng ngươi',
    nguongThongQua: hd ? hd.nguongThongQua : null,
    gheDauTrong,
    soUngVienKeVi: the && hd && gheDauTrong ? ungVienKeVi(state, the.id).length : 0,
    loiDaThe: loiDaThe(state, thanId),
    luatNen: luatNenCoTen(state),
  };

  // ── sức mạnh ──
  const dom = docAspect<Domain>(e, 'domain');
  const sucManh: SucManhThanDien = {
    thamQuyen,
    thamQuyenCaoNhat: xepHang[0]?.diem ?? 0,
    domains: dom?.domains ?? [],
  };

  // ── thành viên khác ──
  const thanhVien: ThanhVienThanDien[] = xepHang.map((x) => {
    const tv = state.entities.get(x.id);
    const v = vaiCua(the, x.id);
    // Chênh dưới 10% thì coi là ngang — con số thô của người khác không đáng
    // tin tới từng đơn vị, và giả vờ ngược lại là in một độ chính xác không có.
    const nguong = Math.max(5, thamQuyen * 0.1);
    return {
      id: x.id,
      ten: tv?.ten ?? x.id,
      nhanVai: v.nhan,
      laNguoiChoi: x.id === thanId,
      soSanh: Math.abs(x.diem - thamQuyen) <= nguong ? 'ngang' : x.diem > thamQuyen ? 'nang_hon' : 'nhe_hon',
    };
  });

  // ── ngoài thần điện: [BB] 19.1 chỉ tin đồn, không số ──
  const ngoai: TinDonNgoai[] = [];
  for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    if (ngoai.length >= 3) break;
    const x = state.entities.get(id);
    if (!x || x.kind !== 'deity' || x.id === thanId || x.tickDiet !== null) continue;
    if (dsId.includes(x.id)) continue;
    ngoai.push({
      noiDung: `Nghe nói ${x.ten} đang được nhắc tới nhiều hơn trước, ở một thần điện không phải của ngươi.`,
      soNguon: 1,
      daXacNhan: false,
    });
  }

  return {
    tenThan: e.ten,
    viTri,
    quyLuat,
    sucManh,
    thanhVien: Object.freeze(thanhVien),
    ngoaiThanDien: Object.freeze(ngoai),
  };
}
