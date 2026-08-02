/**
 * Luật Nền — Phần 43 [BB].
 *
 * ── Hai tầng luật ──
 *
 * | Tầng            | Chi phối             | Cấu trúc                          |
 * |-----------------|----------------------|-----------------------------------|
 * | Luật Nội Tại    | sự kiện trong thế giới | bảy trường + tiếp địa (9, 42)   |
 * | **Luật Nền**    | chính bộ máy mô phỏng | KHÔNG có `hieuUng`; có tham số  |
 *
 * 43.1 nói rõ vì sao tách: "Thời Gian không tác động lên field nào — nó quy định
 * **cách bản thân engine chạy**. Nhét chung một schema là sai kiến trúc."
 *
 * ── Vô danh và có tên ──
 *
 * [BB] 43.2 — một trục `vo_danh` vẫn được engine dùng, nhưng **không ai trong thế
 * giới biết**, nên **không khai thác được** và **không có kẽ hở**. Khoảnh khắc
 * một kẻ trong thế giới khái niệm hóa được nó phải sinh một sự kiện lớn và một
 * mạch truyện loại `dat_ten`.
 *
 * > "Hiểu biết tạo ra vật lý, và vật lý tạo ra kẽ hở."
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Conceptual } from '../schema/aspect/conceptual.js';
import {
  KHAI_NIEM_NEN_CUA_TRUC,
  PHU_THUOC_TRUC,
  SubstrateLawSchema,
  THAM_SO_MAC_DINH,
  TRUC_NEN,
} from './schema.js';
import type { SubstrateLaw, TrucNen } from './schema.js';

/** Bộ bảy trục mặc định PHÀM TỤC cho một nhánh mới — 43.7. */
export function luatNenMacDinh(branchId: string): SubstrateLaw[] {
  return TRUC_NEN.map((truc) =>
    SubstrateLawSchema.parse({
      id: `ln.${truc}`,
      branchId,
      truc,
      trangThai: 'vo_danh',
      thamSo: { ...THAM_SO_MAC_DINH[truc] },
    }),
  );
}

/** Tham số đang có hiệu lực của một trục — vô danh thì dùng bộ mặc định. */
export function thamSoCua(ds: readonly SubstrateLaw[], truc: TrucNen): Readonly<Record<string, unknown>> {
  const ln = ds.find((x) => x.truc === truc);
  if (ln === undefined) return THAM_SO_MAC_DINH[truc];
  return { ...THAM_SO_MAC_DINH[truc], ...ln.thamSo };
}

export function daCoTen(ds: readonly SubstrateLaw[], truc: TrucNen): boolean {
  return ds.find((x) => x.truc === truc)?.trangThai === 'co_ten';
}

// ─────────────────────────────────────────── đặt tên

export type KetQuaDatTen =
  | {
      readonly ok: true;
      readonly luatNen: SubstrateLaw;
      readonly keHo: readonly string[];
      /** Câu ghi vào biên niên sử — 44.4 [BB] giọng biên niên. */
      readonly dongBienNien: string;
    }
  | { readonly ok: false; readonly loi: readonly string[] };

/**
 * Đặt tên cho một trục — 43.2, 43.3, 43.5.
 *
 * Ba điều kiện, và cả ba đều chặn:
 * 1. Trục chưa `co_ten` (đặt tên hai lần là vô nghĩa).
 * 2. `khaiNiemNenId` trỏ tới một khái niệm **có thật, đã ít nhất `thanh_hinh`**,
 *    và khớp danh sách khái niệm nền của trục ([BB] 43.3 — luật nền cũng phải
 *    tiếp địa: không thể đặt tên cho Thời Gian nếu khái niệm Trước-Sau chưa thành hình).
 * 3. Mọi trục phụ thuộc đã `co_ten` ([BB] 43.5).
 */
export function datTenTruc(input: {
  readonly ds: readonly SubstrateLaw[];
  readonly truc: TrucNen;
  readonly khaiNiemNenId: string;
  readonly nguoiDatTenId: string | null;
  readonly tick: number;
  readonly state: WorldState;
}): KetQuaDatTen {
  const loi: string[] = [];
  const ln = input.ds.find((x) => x.truc === input.truc);
  if (ln === undefined) {
    return { ok: false, loi: [`Nhánh này chưa có bản ghi luật nền cho trục "${input.truc}".`] };
  }
  if (ln.trangThai === 'co_ten') {
    return { ok: false, loi: [`Trục "${input.truc}" đã có tên từ nhịp ${ln.tickDatTen ?? 0}.`] };
  }

  const kn = input.state.entities.get(input.khaiNiemNenId);
  const c = kn?.aspects['conceptual'] as Conceptual | undefined;
  if (kn === undefined || c === undefined) {
    loi.push(`Khái niệm nền "${input.khaiNiemNenId}" không tồn tại.`);
  } else {
    if (c.giaiDoan === 'hu_danh' || c.giaiDoan === 'manh_nha') {
      loi.push(
        `Khái niệm "${kn.ten}" mới ở giai đoạn "${c.giaiDoan}". Chưa ai hiểu nó đủ để đặt tên cho một trục nền.`,
      );
    }
    const hopLe = KHAI_NIEM_NEN_CUA_TRUC[input.truc];
    const khop = hopLe.some((h) => input.khaiNiemNenId.includes(h) || kn.tags.includes(h));
    if (!khop) {
      loi.push(
        `Khái niệm "${kn.ten}" không phải nền của trục "${input.truc}". ` +
          `Trục này cần một trong: ${hopLe.join(', ')}.`,
      );
    }
  }

  // [BB] 43.5 — thứ tự phụ thuộc.
  for (const truoc of PHU_THUOC_TRUC[input.truc]) {
    if (!daCoTen(input.ds, truoc)) {
      loi.push(
        `Không đặt tên được "${input.truc}" khi "${truoc}" còn vô danh (43.5). ` +
          'Thứ tự phụ thuộc không phải quy ước — nó là điều kiện để câu ấy có nghĩa.',
      );
    }
  }

  if (loi.length > 0) return { ok: false, loi };

  const thamSo = thamSoCua(input.ds, input.truc);
  const keHo = keHoCuaTruc(input.truc, thamSo);
  const moi = SubstrateLawSchema.parse({
    ...ln,
    trangThai: 'co_ten',
    khaiNiemNenId: input.khaiNiemNenId,
    nguoiDatTenId: input.nguoiDatTenId,
    tickDatTen: input.tick,
    thamSo: { ...thamSo },
    // [BB] 43.3 — kẽ hở CHỈ sinh khi `co_ten`.
    keHo: keHo.map((moTa) => ({ moTa, daBiKhaiThac: false })),
  });

  const nguoi = input.nguoiDatTenId === null ? null : input.state.entities.get(input.nguoiDatTenId);
  return { ok: true, luatNen: moi, keHo, dongBienNien: bienNienDatTen(input.truc, nguoi, input.tick) };
}

/**
 * Kẽ hở của một trục — chỉ có khi trục đã `co_ten`.
 *
 * Nội dung kẽ hở suy từ **chính tham số**: một thế giới có `quaKhu = 'sua_duoc'`
 * mở ra loại khai thác mà `co_dinh` không có. Đây là chỗ câu "hiểu biết tạo ra
 * vật lý, và vật lý tạo ra kẽ hở" trở thành dữ liệu.
 */
export function keHoCuaTruc(truc: TrucNen, thamSo: Readonly<Record<string, unknown>>): string[] {
  const ra: string[] = [];
  switch (truc) {
    case 'khong_gian':
      if (thamSo['coTheGap'] === true)
        ra.push('Gấp không gian: hai chỗ xa nhau thành liền kề trong một nhịp.');
      if (thamSo['khoangCach'] === 'y_nghia') {
        ra.push('Hai đền thờ cùng một vị thần là liền kề, bất kể cách nhau bao xa.');
      }
      if (thamSo['ghiDeCucBo'] === true) ra.push('Có thể áp một bộ luật riêng lên một vùng nhỏ.');
      break;
    case 'thoi_gian':
      if (thamSo['quaKhu'] === 'sua_duoc') ra.push('Sửa một việc đã xảy ra mà không cần phân nhánh.');
      if (thamSo['tuongLai'] === 'da_ton_tai') ra.push('Đọc trước kết cục rồi đi vòng qua nó.');
      if (thamSo['huong'] === 'vong_lap') ra.push('Lặp lại một quãng thời gian tới khi ra kết quả muốn có.');
      break;
    case 'nhan_qua':
      if (thamSo['chamTruuTuong'] === true) ra.push('Chạm thẳng vào một khái niệm thay vì vào vật mang nó.');
      if (thamSo['thuTu'] === 'long_leo') ra.push('Đặt hậu quả trước nguyên nhân trong một khoảng ngắn.');
      if (thamSo['baoToan'] === false)
        ra.push('Hành động không nhất thiết sinh hậu quả — có thể làm rồi chối.');
      break;
    case 'danh_tinh':
      if (thamSo['banChat'] === 'mot_tu')
        ra.push('Ép một kẻ về đúng một từ để đoán trước mọi lựa chọn của họ.');
      if (thamSo['saoChep'] === 'hai_nguoi') ra.push('Bản sao là người khác — trách nhiệm không đi theo.');
      if (thamSo['lienTuc'] === 'theo_ten_goi') ra.push('Đổi tên là đổi người.');
      break;
    case 'sinh_tu':
      if (thamSo['hoiSinh'] !== 'khong_the')
        ra.push('Cái chết trở thành một khoản chi phí, không phải một kết thúc.');
      if (thamSo['ranhGioi'] === 'mo') ra.push('Có kẻ nửa sống nửa chết, và luật không biết xếp họ vào đâu.');
      break;
    case 'nhan_thuc':
      if (thamSo['hieuBietLamSuyYeu'] === true) ra.push('Giết một vị thần bằng cách giải thích ngài.');
      if (thamSo['tenGoiCoQuyenNang'] === true)
        ra.push('Biết tên thật là khống chế được — tên thành tài sản chiến lược.');
      if (thamSo['quanSatLamDinhHinh'] === true) ra.push('Thứ chưa ai nhìn thì còn đổi hình được.');
      break;
    case 'van_menh':
      if (thamSo['tonTai'] === true)
        ra.push('Biết trước kết cục để chuẩn bị, hoặc để chạy — và chạy có giá riêng.');
      if (thamSo['phanKhang'] === 'chinh_viec_chong_khien_no_xay_ra') {
        ra.push('Chống lại vận mệnh là cách chắc nhất để nó thành sự thật.');
      }
      break;
  }
  return ra;
}

function bienNienDatTen(truc: TrucNen, nguoi: Entity | undefined | null, tick: number): string {
  const ten = nguoi?.ten ?? 'một người không ai nhớ tên';
  const nhan: Record<TrucNen, string> = {
    khong_gian: 'rằng khoảng cách là một thứ đo được',
    thoi_gian: 'rằng mọi thứ đều đi từ trước tới sau, và không quay lại',
    nhan_qua: 'rằng mỗi việc xảy ra đều do một việc khác',
    danh_tinh: 'rằng có một thứ khiến một người vẫn là chính họ',
    sinh_tu: 'rằng có một ranh giới mà qua rồi thì không về',
    nhan_thuc: 'rằng biết một điều là làm một điều gì đó với nó',
    van_menh: 'rằng có những việc dù làm gì cũng sẽ xảy ra',
  };
  return (
    `Nhịp ${tick}, ${ten} viết ra câu đầu tiên ${nhan[truc]}. ` +
    'Người ấy không biết mình vừa làm gì. Từ mùa đó, mọi thứ có thêm một chỗ để bám vào — và một chỗ để lách.'
  );
}

// ─────────────────────────────────────────── 43.7 tự kết tinh

export type UngVienTuKetTinh = {
  readonly truc: TrucNen;
  readonly khaiNiemId: string;
  readonly ten: string;
};

/**
 * Luật nền TỰ kết tinh — 43.7 [BB].
 *
 * "Thế giới tự phát hiện ra vật lý của chính nó. Đây là ứng dụng đẹp nhất của cơ
 * chế kết tinh, và nó không cần thêm code — chỉ cần một bảng ánh xạ
 * `khái niệm → trục nền` trong Registry."
 *
 * Bảng ấy là `KHAI_NIEM_NEN_CUA_TRUC`. Hàm này quét khái niệm đã `ket_tinh`, so
 * với bảng, và trả về ứng viên. Tham số thì **khóa đúng theo hành vi thế giới vốn
 * đã có** — tức là giữ nguyên `thamSo` hiện hành, không đặt lại.
 */
export function quetTuKetTinh(s: WorldState, ds: readonly SubstrateLaw[]): UngVienTuKetTinh[] {
  const ra: UngVienTuKetTinh[] = [];
  const daCo = new Set(ds.filter((x) => x.trangThai === 'co_ten').map((x) => x.truc));

  const khaiNiem = [...s.entities.values()]
    .filter(
      (e) =>
        e.tickDiet === null && (e.aspects['conceptual'] as Conceptual | undefined)?.giaiDoan === 'ket_tinh',
    )
    .sort((a, b) => (a.id < b.id ? -1 : 1));

  for (const truc of TRUC_NEN) {
    if (daCo.has(truc)) continue;
    // 43.5 — chưa đủ điều kiện phụ thuộc thì chưa tự kết tinh được.
    if (PHU_THUOC_TRUC[truc].some((t) => !daCo.has(t))) continue;
    for (const kn of khaiNiem) {
      const khop = KHAI_NIEM_NEN_CUA_TRUC[truc].some((h) => kn.id.includes(h) || kn.tags.includes(h));
      if (!khop) continue;
      ra.push({ truc, khaiNiemId: kn.id, ten: kn.ten });
      break;
    }
  }
  return ra;
}

// ─────────────────────────────────────────── 43.6 sửa luật nền

export type YeuCauSuaLuatNen = {
  readonly truc: TrucNen;
  readonly thamSoMoi: Readonly<Record<string, unknown>>;
  readonly boiAi: 'khong_ai' | 'sang_the_than' | 'than_toi_cao';
};

export type KetQuaSuaLuatNen =
  | { readonly ok: true; readonly batBuocPhanNhanh: true; readonly luatNenSau: SubstrateLaw }
  | { readonly ok: false; readonly loi: readonly string[] };

/**
 * Sửa Luật Nền — 43.6 [BB].
 *
 * > Đổi "máu đã đổ thì không rửa được" là đổi chính sách.
 * > Đổi "thời gian chảy một chiều" là **tai họa vũ trụ viết lại toàn bộ lịch sử**.
 *
 * Hàm này KHÔNG sửa tại chỗ và KHÔNG trả về một state mới. Nó trả về bản ghi sẽ
 * nằm trong **nhánh mới**, kèm cờ `batBuocPhanNhanh: true` — người gọi bắt buộc
 * fork trước khi ghi. Không có đường nào ở đây cho phép sửa nhánh đang chạy.
 */
export function suaLuatNen(ds: readonly SubstrateLaw[], yc: YeuCauSuaLuatNen): KetQuaSuaLuatNen {
  const ln = ds.find((x) => x.truc === yc.truc);
  if (ln === undefined) return { ok: false, loi: [`Không có bản ghi luật nền cho trục "${yc.truc}".`] };
  if (!ln.khaNghich.duocKhong) {
    return {
      ok: false,
      loi: [`Trục "${yc.truc}" khai bất khả nghịch. Không ai sửa được, kể cả Sáng Thế Thần.`],
    };
  }
  if (ln.khaNghich.boiAi === 'khong_ai' || ln.khaNghich.boiAi !== yc.boiAi) {
    return {
      ok: false,
      loi: [`Trục "${yc.truc}" chỉ ${ln.khaNghich.boiAi} sửa được; yêu cầu này đến từ ${yc.boiAi}.`],
    };
  }
  return {
    ok: true,
    batBuocPhanNhanh: true,
    luatNenSau: SubstrateLawSchema.parse({ ...ln, thamSo: { ...ln.thamSo, ...yc.thamSoMoi } }),
  };
}

// ─────────────────────────────────────────── 43.4 khoảngCách = 'y_nghia'

/**
 * [BB] 43.4 — tham số có ảnh hưởng kỹ thuật sâu nhất trong cả spec.
 *
 * `khoangCach = 'y_nghia'` **đổi định nghĩa lân cận của `moRong()`**, tức đổi cả
 * cách assembler chọn ngữ cảnh: hai ngôi đền thờ cùng một vị thần là liền kề, bất
 * kể cách nhau bao xa. Địa lý thần thoại thật vận hành theo ý nghĩa chứ không
 * theo mét — âm phủ ở "dưới" nhưng tới được bằng một con sông.
 */
export function laKhoangCachYNghia(ds: readonly SubstrateLaw[]): boolean {
  return thamSoCua(ds, 'khong_gian')['khoangCach'] === 'y_nghia';
}

/**
 * Cạnh "liền kề theo ý nghĩa" — dùng để nối thêm vào đồ thị của `moRong()`.
 *
 * Chỉ chạy khi trục Không Gian ở `y_nghia`. Trả về cặp id, đã sắp, không trùng.
 */
export function canhLienKeYNghia(s: WorldState, ds: readonly SubstrateLaw[]): [string, string][] {
  if (!laKhoangCachYNghia(ds)) return [];

  // Nhóm theo vị thần được thờ: mọi cặp trong một nhóm là liền kề.
  const theoThan = new Map<string, string[]>();
  for (const l of [...s.links.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (l.tickDut !== null) continue;
    if (l.quanHe !== 'tho_phung' && l.quanHe !== 'thuoc_ve_than') continue;
    const ds2 = theoThan.get(l.denId) ?? [];
    ds2.push(l.tuId);
    theoThan.set(l.denId, ds2);
  }

  const ra: [string, string][] = [];
  for (const nhom of [...theoThan.values()]) {
    const sap = [...new Set(nhom)].sort((a, b) => (a < b ? -1 : 1));
    for (let i = 0; i < sap.length; i++) {
      for (let j = i + 1; j < sap.length; j++) ra.push([sap[i] as string, sap[j] as string]);
    }
  }
  return ra;
}

// ─────────────────────────────────────────── panel 44.5

/**
 * Tên đọc được của bảy trục — [BB] 58.13 "không hiện raw id, key schema hay tên
 * enum cho người chơi". Chỗ nào in tên trục ra màn hình cũng đọc bảng này, nên
 * không có đường nào để `van_menh` lọt lên UI.
 */
export const NHAN_TRUC_NEN: Readonly<Record<TrucNen, string>> = Object.freeze({
  khong_gian: 'Không Gian',
  thoi_gian: 'Thời Gian',
  nhan_qua: 'Nhân Quả',
  danh_tinh: 'Danh Tính',
  sinh_tu: 'Sinh Tử',
  nhan_thuc: 'Nhận Thức',
  van_menh: 'Vận Mệnh',
});

/** Ba dòng trạng thái cho Panel Vật Lý Thế Giới — 44.5. */
export function bangLuatNen(ds: readonly SubstrateLaw[], s: WorldState): string {
  const nhan = NHAN_TRUC_NEN;
  const dong = ['LUẬT NỀN'];
  for (const truc of TRUC_NEN) {
    const ln = ds.find((x) => x.truc === truc);
    const ts = thamSoCua(ds, truc);
    const gt = Object.values(ts).map(String).join(' · ');
    if (ln?.trangThai === 'co_ten') {
      const nguoi = ln.nguoiDatTenId === null ? null : s.entities.get(ln.nguoiDatTenId);
      dong.push(`  ${nhan[truc].padEnd(14)}có tên   ${gt}`);
      if (nguoi)
        dong.push(`  ${' '.repeat(14)}         đặt tên bởi ${nguoi.ten}, nhịp ${ln.tickDatTen ?? 0}`);
    } else {
      // [BB] 44.5 — mục vô danh hiện tham số TRONG NGOẶC: đang đúng, nhưng chưa ai biết.
      dong.push(`  ${nhan[truc].padEnd(14)}vô danh  (${gt})`);
    }
  }
  return dong.join('\n');
}
