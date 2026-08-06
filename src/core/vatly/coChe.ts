/**
 * Cơ Chế Phái Sinh — Phần 44 [BB].
 *
 * ── Nguyên tắc ──
 *
 * > **Không cơ chế nào được cài cứng vào engine. Mọi cơ chế chỉ tồn tại nếu thế
 * > giới có đủ điều kiện cho nó tồn tại.**
 *
 * Bốn cơ chế dưới đây **không phải tính năng của app**. Chúng là **hệ quả** của
 * những luật mà người chơi có thể viết hoặc không. "Nếu người chơi không bao giờ
 * đặt tên trục Nhận Thức, thì trong thế giới đó hiểu biết không làm suy yếu bất
 * cứ thứ gì — và Thần Bí đơn giản là **không có mặt trong vũ trụ này**."
 *
 * ── `moTaKhiKhong` là trường bắt buộc ──
 *
 * [BB] 44.2: "Nó ép người thiết kế cơ chế phải trả lời: *thế giới không có thứ này
 * thì khác gì?* Nếu không trả lời được thì cơ chế đó không đáng tồn tại." Nên nó
 * là trường bắt buộc trong `DinhNghiaCoChe`, và test cổng kiểm nó khác rỗng.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { Conceptual } from '../schema/aspect/conceptual.js';
import { bacKhaiNiem } from '../schema/aspect/conceptual.js';
import type { Lawful } from '../schema/aspect/lawful.js';
import type { Tuning } from '../tuning/schema.js';
import { CoCheRowSchema } from './schema.js';
import type { CoCheId, CoCheRow, SubstrateLaw } from './schema.js';
import { daCoTen, thamSoCua } from './luatNen.js';

export type DieuKienTonTai = {
  readonly lucNen?: readonly {
    readonly truc: SubstrateLaw['truc'];
    readonly thamSo: Readonly<Record<string, unknown>>;
  }[];
  readonly khaiNiem?: readonly { readonly tag: string; readonly giaiDoanToiThieu: Conceptual['giaiDoan'] }[];
  readonly luatNoiTai?: readonly { readonly theTag: readonly string[] }[];
};

export type DinhNghiaCoChe = {
  readonly id: CoCheId;
  readonly ten: string;
  readonly dieuKienTonTai: DieuKienTonTai;
  /** [BB] BẮT BUỘC, không được rỗng. */
  readonly moTaKhiKhong: string;
  readonly moTaKhiCo: string;
};

// Thang bậc đọc từ `conceptual.ts` — chép tay ở đây từng làm `luong_lu` rơi ra
// ngoài mọi phép so sánh khi bậc ấy được nối vào enum.

/** Bốn cơ chế dựng sẵn — 44.3. Người dùng thêm được qua `R.mechanism` [MR]. */
export const CO_CHE: Readonly<Record<CoCheId, DinhNghiaCoChe>> = Object.freeze({
  than_bi: {
    id: 'than_bi',
    ten: 'Thần Bí',
    dieuKienTonTai: { lucNen: [{ truc: 'nhan_thuc', thamSo: { hieuBietLamSuyYeu: true } }] },
    moTaKhiKhong:
      'Kiến thức không ảnh hưởng sức mạnh. Thần cổ không mạnh hơn thần mới. Một cây gậy phép hoạt động y hệt ' +
      'dù cả thế giới hiểu nguyên lý của nó hay không ai hiểu.',
    moTaKhiCo:
      'Thứ càng cổ càng mạnh, và càng bị nghiên cứu càng yếu. Một nền văn minh trở nên khoa học sẽ giết ' +
      'chết thần của chính nó.',
  },
  nguyen_diem: {
    id: 'nguyen_diem',
    ten: 'Nguyên Điểm',
    dieuKienTonTai: { lucNen: [{ truc: 'danh_tinh', thamSo: { banChat: 'mot_tu' } }] },
    moTaKhiKhong:
      'Sinh linh là tổng hợp các đặc điểm, không có bản chất cốt lõi. Không ai mạnh bất thường khi hành động ' +
      'thuận bản chất, và cũng không ai bị bản chất nuốt.',
    moTaKhiCo:
      'Mỗi sinh linh có một từ định nghĩa toàn bộ tồn tại của họ. Thuận theo nó thì mạnh gấp bội, và mỗi kỷ ' +
      'nguyên nó lại kéo họ về phía nó một chút.',
  },
  co_huu_ket_gioi: {
    id: 'co_huu_ket_gioi',
    ten: 'Cố Hữu Kết Giới',
    dieuKienTonTai: {
      lucNen: [{ truc: 'khong_gian', thamSo: { ghiDeCucBo: true } }],
      khaiNiem: [{ tag: 'noi_gioi', giaiDoanToiThieu: 'thanh_hinh' }],
    },
    moTaKhiKhong:
      'Không ai áp đặt được luật riêng lên không gian. Nội tâm là chuyện riêng, không phải một địa hình.',
    moTaKhiCo:
      'Kẻ có Nguyên Điểm đủ mạnh mở được một cõi tạm thời ghi đè luật bên trong — và mỗi lần mở đều làm ' +
      'thực tại chỗ đó rách thêm một ít.',
  },
  vu_khi_khai_niem: {
    id: 'vu_khi_khai_niem',
    ten: 'Vũ Khí Khái Niệm',
    dieuKienTonTai: { lucNen: [{ truc: 'nhan_qua', thamSo: { chamTruuTuong: true } }] },
    moTaKhiKhong:
      'Chỉ chạm được vào thực thể, không chạm được vào ý niệm. Giết hết rồng thì rồng vẫn có thể sinh ra lần ' +
      'nữa, vì khái niệm Rồng vẫn còn đó.',
    moTaKhiCo:
      'Động từ THU và ĐỊNH áp được thẳng lên khái niệm, và hiệu ứng lan tới mọi vật mang nó. Đây là cơ chế ' +
      'nguy hiểm nhất trong toàn game.',
  },
});

// ─────────────────────────────────────────── phát hiện

export type KetQuaQuetCoChe = {
  readonly id: CoCheId;
  readonly duDieuKien: boolean;
  readonly conThieu: readonly string[];
};

function docConcept(e: Entity): Conceptual | undefined {
  return e.aspects['conceptual'] as Conceptual | undefined;
}

/** Điều kiện tồn tại của một cơ chế có thỏa không, và còn thiếu gì. */
export function quetMotCoChe(
  dn: DinhNghiaCoChe,
  s: WorldState,
  luatNen: readonly SubstrateLaw[],
): KetQuaQuetCoChe {
  const conThieu: string[] = [];

  for (const yc of dn.dieuKienTonTai.lucNen ?? []) {
    if (!daCoTen(luatNen, yc.truc)) {
      conThieu.push(`trục ${yc.truc} còn vô danh`);
      continue;
    }
    const ts = thamSoCua(luatNen, yc.truc);
    for (const [k, v] of Object.entries(yc.thamSo)) {
      if (ts[k] !== v) conThieu.push(`${yc.truc}.${k} phải là ${String(v)}, đang là ${String(ts[k])}`);
    }
  }

  for (const yc of dn.dieuKienTonTai.khaiNiem ?? []) {
    const dat = [...s.entities.values()].some((e) => {
      if (e.tickDiet !== null || !e.tags.includes(yc.tag)) return false;
      const c = docConcept(e);
      if (c === undefined) return false;
      return bacKhaiNiem(c.giaiDoan) >= bacKhaiNiem(yc.giaiDoanToiThieu);
    });
    if (!dat) conThieu.push(`thiếu khái niệm mang tag "${yc.tag}" đã đạt ${yc.giaiDoanToiThieu}`);
  }

  for (const yc of dn.dieuKienTonTai.luatNoiTai ?? []) {
    const dat = [...s.entities.values()].some((e) => {
      const l = e.aspects['lawful'] as Lawful | undefined;
      return l !== undefined && yc.theTag.every((t) => l.theTag.includes(t));
    });
    if (!dat) conThieu.push(`thiếu luật nội tại mang tag ${yc.theTag.join(', ')}`);
  }

  return { id: dn.id, duDieuKien: conThieu.length === 0, conThieu };
}

export type ChuyenTrangThaiCoChe = {
  readonly row: CoCheRow;
  readonly vuaBat: boolean;
  readonly vuaTat: boolean;
  /** Câu công bố — 44.4 [BB] giọng biên niên sử, không giọng log. */
  readonly congBo: string;
  /** Mạch truyện loại `dat_ten` sinh ra khi cơ chế vừa bật. */
  readonly sinhMachDatTen: boolean;
};

/**
 * Quét toàn bộ `R.mechanism` cuối mỗi kỷ nguyên — 44.4 [BB].
 *
 * Điều kiện vỡ thì `khiTat()` chạy và **mọi thứ đang phụ thuộc cơ chế đó phải
 * được xử lý tử tế**, không xóa cứng: Cố Hữu Kết Giới đang mở thì sập; entity có
 * Nguyên Điểm thì giữ link nhưng mất hệ số. Hàm này trả về *quyết định*; việc dọn
 * dẹp nằm ở `hauQuaKhiTat()`.
 */
export function quetCoChe(input: {
  readonly state: WorldState;
  readonly luatNen: readonly SubstrateLaw[];
  readonly hienTai: readonly CoCheRow[];
  readonly branchId: string;
  readonly tick: number;
}): ChuyenTrangThaiCoChe[] {
  const theoId = new Map(input.hienTai.map((r) => [r.id, r]));
  const ra: ChuyenTrangThaiCoChe[] = [];

  for (const id of Object.keys(CO_CHE).sort() as CoCheId[]) {
    const dn = CO_CHE[id];
    const q = quetMotCoChe(dn, input.state, input.luatNen);
    const cu =
      theoId.get(id) ??
      CoCheRowSchema.parse({ id, branchId: input.branchId, bat: false, conThieu: q.conThieu });

    const vuaBat = q.duDieuKien && !cu.bat;
    const vuaTat = !q.duDieuKien && cu.bat;

    ra.push({
      row: CoCheRowSchema.parse({
        ...cu,
        bat: q.duDieuKien,
        tickBat: vuaBat ? input.tick : cu.tickBat,
        tickTat: vuaTat ? input.tick : cu.tickTat,
        conThieu: q.conThieu,
      }),
      vuaBat,
      vuaTat,
      congBo: vuaBat
        ? `Nhịp ${input.tick}: ${dn.ten} bắt đầu có mặt trong thế giới này. ${dn.moTaKhiCo}`
        : vuaTat
          ? `Nhịp ${input.tick}: ${dn.ten} thôi tồn tại. ${dn.moTaKhiKhong}`
          : '',
      sinhMachDatTen: vuaBat,
    });
  }
  return ra;
}

export type HauQuaTat = {
  readonly ketGioiPhaiSap: readonly string[];
  readonly matHeSoNguyenDiem: readonly string[];
  readonly ghiChu: string;
};

/**
 * Dọn dẹp khi một cơ chế tắt — 44.4 [BB] "xử lý tử tế, không xóa cứng".
 *
 * Trả về *danh sách* thứ bị ảnh hưởng chứ không tự xóa: link Nguyên Điểm được
 * GIỮ, chỉ hệ số biến mất. Một cơ chế tắt rồi bật lại sau ba kỷ nguyên phải tìm
 * lại được đúng những sợi dây cũ.
 */
export function hauQuaKhiTat(id: CoCheId, s: WorldState): HauQuaTat {
  if (id === 'co_huu_ket_gioi') {
    const ds = [...s.entities.values()]
      .filter((e) => e.aspects['reality_marble'] !== undefined)
      .map((e) => e.id)
      .sort();
    return {
      ketGioiPhaiSap: ds,
      matHeSoNguyenDiem: [],
      ghiChu: 'Mọi Cố Hữu Kết Giới đang mở sập ngay. Vùng bên trong trả về luật chung.',
    };
  }
  if (id === 'nguyen_diem') {
    const ds = [...s.links.values()]
      .filter((l) => l.quanHe === 'nguyen_diem' && l.tickDut === null)
      .map((l) => l.tuId)
      .sort();
    return {
      ketGioiPhaiSap: [],
      matHeSoNguyenDiem: ds,
      ghiChu: 'Link nguyên điểm được GIỮ; chỉ hệ số nhân biến mất. Không ai bị xóa mất bản chất của mình.',
    };
  }
  return { ketGioiPhaiSap: [], matHeSoNguyenDiem: [], ghiChu: '' };
}

// ─────────────────────────────────────────── công thức từng cơ chế

/**
 * Thần Bí — 44.3.
 *
 * ```text
 * thanBi_goc  = f(tuổi entity)
 * thanBi_hien = thanBi_goc × (1 − triThucTrungBinhVung/100) × (0.97 ^ soLanBiNghienCuu)
 * ```
 *
 * [BB] Hai móc nối: Thần Khởi Nguyên già nhất nên `thanBi_goc` cao nhất; và nối
 * vào Dị Hóa — **thần bị hiểu sai thì đổi tính; thần bị hiểu đúng thì tan biến**.
 * Cung thứ hai bi thảm hơn: vị thần không bị lãng quên, mà bị *giải thích*.
 */
export function thanBi(input: {
  readonly tuoi: number;
  readonly triThucTrungBinhVung: number;
  readonly soLanBiNghienCuu: number;
  readonly tuning: Tuning;
}): { readonly goc: number; readonly hien: number } {
  const t = input.tuning.vatLy.thanBi;
  const goc = Math.min(100, (input.tuoi / t.tuoiDatTran) * 100);
  const hien =
    goc *
    Math.max(0, 1 - input.triThucTrungBinhVung / 100) *
    Math.pow(t.suyGiamMoiLanNghienCuu, Math.max(0, input.soLanBiNghienCuu));
  return { goc: Math.round(goc), hien: Math.round(hien) };
}

/** Nhân điểm utility khi hành động thuận Nguyên Điểm — 44.3. */
export function nhanNguyenDiem(thuanTheo: boolean, tuning: Tuning): number {
  return thuanTheo ? tuning.vatLy.nguyenDiem.nhanKhiThuanBanChat : 1;
}

/**
 * Bản tính bị Nguyên Điểm kéo về một trục mỗi kỷ nguyên — 44.3.
 *
 * "Đây đúng là công thức Dị Hóa, ngược chiều. Dị Hóa kéo từ ngoài vào — tín đồ
 * tin gì. Nguyên Điểm kéo từ trong ra. Kết quả giống nhau: **bạn ngừng là một
 * người và trở thành một lực.**"
 */
export function keoBanTinh(
  banTinh: Readonly<Record<string, number>>,
  trucNguyenDiem: string,
  tuning: Tuning,
): { readonly banTinh: Record<string, number>; readonly nenDoiKind: boolean } {
  const heSo = tuning.vatLy.nguyenDiem.keoBanTinhMoiKyNguyen;
  const ra: Record<string, number> = { ...banTinh };
  const dich = 100;
  const cu = ra[trucNguyenDiem] ?? 0;
  ra[trucNguyenDiem] = cu + (dich - cu) * heSo;
  for (const k of Object.keys(ra)) {
    if (k === trucNguyenDiem) continue;
    ra[k] = (ra[k] ?? 0) * (1 - heSo);
  }
  return {
    banTinh: ra,
    // Sụp hoàn toàn về một trục → engine tự đề xuất chuyển kind sang `concept`.
    nenDoiKind: (ra[trucNguyenDiem] ?? 0) >= tuning.vatLy.nguyenDiem.nguongSupVeMotTruc,
  };
}

export type HauQuaVuKhiKhaiNiem = {
  readonly vatMangIds: readonly string[];
  readonly luatMatHieuLucIds: readonly string[];
  readonly phanNghiaId: string | null;
  readonly phatThucTai: number;
  readonly moTaSeo: string;
};

/**
 * Vũ Khí Khái Niệm — 44.3 [BB], cơ chế nguy hiểm nhất trong toàn game.
 *
 * ```text
 * THU(CONCEPT: "Rồng") → mọi con rồng ngừng tồn tại đồng thời
 *                      → mọi luật tiếp địa vào "Rồng" tụt hieuLuc về 0
 *                      → để lại một VẾT SẸO cỡ khái niệm
 * ```
 *
 * Hàm này CHỈ TÍNH hậu quả. Nó không áp gì cả — vì hậu quả phải hiện ra trước
 * mặt người chơi trước khi họ bấm, và "diệt khái niệm Cái Chết nghe như một hành
 * động từ bi; hậu quả thì không".
 */
export function hauQuaVuKhiKhaiNiem(khaiNiemId: string, s: WorldState, tuning: Tuning): HauQuaVuKhiKhaiNiem {
  const kn = s.entities.get(khaiNiemId);
  const c = kn === undefined ? undefined : docConcept(kn);
  const trongSo = c?.trongSo ?? 0;

  const vatMang = [...s.links.values()]
    .filter(
      (l) =>
        l.tickDut === null &&
        l.denId === khaiNiemId &&
        (l.quanHe === 'hien_than_cua' || l.quanHe === 'thuoc_khai_niem'),
    )
    .map((l) => l.tuId)
    .sort();

  const luat = [...s.entities.values()]
    .filter((e) => {
      const l = e.aspects['lawful'] as Lawful | undefined;
      return l !== undefined && l.tiepDia.some((t) => t.khaiNiemId === khaiNiemId);
    })
    .map((e) => e.id)
    .sort();

  return {
    vatMangIds: vatMang,
    luatMatHieuLucIds: luat,
    phanNghiaId: c?.phanNghiaId ?? null,
    phatThucTai: Math.round(trongSo * tuning.vatLy.vuKhiKhaiNiem.heSoPhatThucTai),
    moTaSeo:
      `Một lỗ hổng cỡ khái niệm trong từ vựng của thực tại: chỗ từng là "${kn?.ten ?? khaiNiemId}". ` +
      'Không ai giải được, và nó sẽ không tự lành.',
  };
}

/** Bảng "CƠ CHẾ ĐANG HOẠT ĐỘNG" cho Panel Vật Lý Thế Giới — 44.5. */
export function bangCoChe(rows: readonly CoCheRow[]): string {
  const dong = ['CƠ CHẾ ĐANG HOẠT ĐỘNG'];
  for (const id of Object.keys(CO_CHE).sort() as CoCheId[]) {
    const r = rows.find((x) => x.id === id);
    const dn = CO_CHE[id];
    if (r?.bat === true) {
      dong.push(`  ${dn.ten.padEnd(20)}có     từ nhịp ${r.tickBat ?? 0}`);
    } else {
      // [BB] 44.5 — mục "chưa có" phải nói rõ CÒN THIẾU GÌ; đó là gợi ý chơi.
      const thieu = r?.conThieu ?? ['chưa quét'];
      dong.push(`  ${dn.ten.padEnd(20)}không  ${thieu.join('; ')}`);
    }
  }
  return dong.join('\n');
}
