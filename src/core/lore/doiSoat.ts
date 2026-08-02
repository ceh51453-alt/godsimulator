/**
 * Đối soát entry — Phần 51.2, 51.3, 51.4, 51.6 [BB].
 *
 * ── Nguyên tắc Sử Thắng Nguồn ──
 *
 * ```text
 * 1. Sự thật engine (world state)   — tuyệt đối
 * 2. SỬ      (nguon = 'tu_sinh')    — điều đã xảy ra
 * 3. DI SẢN  (nguon = 'di_san')     — điều đã xảy ra ở vòng trước, đã bóp méo
 * 4. NGUỒN   (nguon = 'nguoi_dung') — điều lẽ ra phải xảy ra
 * ```
 *
 * [BB] Đây **không** phải hạ thấp lorebook người dùng. Nguồn vẫn là lực hấp dẫn
 * ở 35.4. Nhưng khi thế giới đã đi hướng khác, không được nói dối về chuyện đã rồi.
 *
 * ── Che không phải xóa ──
 *
 * [BB] 51.3 — entry bị che **không** được nạp vào ngữ cảnh, nhưng **vẫn** hiện
 * trong trình soạn kèm lý do, **vẫn** hiện trên Bản Đồ Dị Biệt, và **có thể** được
 * người chơi bỏ che bất cứ lúc nào. Vì vậy `che()` dưới đây trả về một entry MỚI
 * có `trangThai = 'bi_che'`, không bao giờ trả về `undefined`.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import { giaoKeys } from './nhap.js';
import type { LorebookEntry, NguonLorebook } from './schema.js';

/** Thứ tự ưu tiên nạp — 51.2. Số nhỏ hơn = thắng. */
export const UU_TIEN_NGUON: Readonly<Record<NguonLorebook, number>> = Object.freeze({
  tu_sinh: 1,
  di_san: 2,
  nguoi_dung: 3,
});

export const QUAN_HE_DOI_SOAT = ['bo_sung', 'lam_ro', 'trung_lap', 'mau_thuan'] as const;
export type QuanHeDoiSoat = (typeof QUAN_HE_DOI_SOAT)[number];

export type DoiSoat = {
  readonly moiId: string;
  readonly cuId: string;
  readonly quanHe: QuanHeDoiSoat;
  readonly lyDo: string;
  /** Việc phải làm — dịch thẳng từ bảng 51.3. */
  readonly xuLy: 'giu_ca_hai' | 'giu_ca_hai_ha_uu_tien' | 'gop' | 'che';
  /** Khi `xuLy = 'che'`: bên nào bị che. Rỗng nghĩa là không che được (khóa canon). */
  readonly cheId: string;
  readonly giuId: string;
};

export type EntryCoNguon = {
  readonly entry: LorebookEntry;
  readonly lorebookId: string;
  readonly nguon: NguonLorebook;
};

const TACH = /[^\p{L}\p{N}]+/u;

function tapTu(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(TACH)
      .filter((t) => t.length >= 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let giao = 0;
  for (const x of a) if (b.has(x)) giao++;
  const hop = a.size + b.size - giao;
  return hop === 0 ? 0 : giao / hop;
}

/**
 * Vị ngữ độc quyền — hai entry cùng khẳng định một vai trò chỉ một kẻ giữ được.
 *
 * Đây là chỗ kiểu A (mâu thuẫn nội dung) hiện ra một cách máy móc: "Ra cai trị
 * thần điện" và "Khonsu cai trị thần điện" cùng vị ngữ `cai trị`, khác chủ ngữ.
 */
/**
 * Cố ý KHÔNG dùng `\b` ở cuối: trong JavaScript, `\b` chỉ nhận biên giữa `\w` và
 * không-`\w`, mà `\w` là ASCII. "trị" kết thúc bằng `ị` — một ký tự không thuộc
 * `\w` — nên `/\bcai trị\b/` không bao giờ khớp tiếng Việt có dấu. Đây là lỗi im
 * lặng cổ điển: regex trông đúng, chạy không lỗi, và không bắt được gì.
 */
const VI_NGU_DOC_QUYEN: readonly RegExp[] = [
  /cai trị/i,
  /đứng đầu/i,
  /ngôi đầu/i,
  /chủ tể/i,
  /thống trị/i,
  /là (?:vị )?duy nhất/i,
  /nắm giữ/i,
];

function viNguDocQuyen(s: string): string[] {
  return VI_NGU_DOC_QUYEN.filter((re) => re.test(s)).map((re) => re.source);
}

/**
 * Phân loại quan hệ giữa hai entry — 51.3 bảng.
 *
 * Deterministic: cùng cặp entry luôn cho cùng quan hệ, không phụ thuộc thứ tự gọi.
 */
export function phanLoaiQuanHe(
  moi: LorebookEntry,
  cu: LorebookEntry,
): { quanHe: QuanHeDoiSoat; lyDo: string } {
  const ta = tapTu(moi.noiDung);
  const tb = tapTu(cu.noiDung);
  const giong = jaccard(ta, tb);

  if (giong >= 0.8) {
    return { quanHe: 'trung_lap', lyDo: `nội dung trùng ${Math.round(giong * 100)}%` };
  }

  const dqA = viNguDocQuyen(moi.noiDung);
  const dqB = viNguDocQuyen(cu.noiDung);
  const chung = dqA.filter((x) => dqB.includes(x));
  const chuDeKhac =
    moi.chuDe.length > 0 && cu.chuDe.length > 0 && !moi.chuDe.some((c) => cu.chuDe.includes(c));
  if (chung.length > 0 && chuDeKhac) {
    return {
      quanHe: 'mau_thuan',
      lyDo: `cùng khẳng định một vai trò độc quyền cho hai chủ thể khác nhau (${moi.chuDe[0]} vs ${cu.chuDe[0]})`,
    };
  }

  // Cái mới cụ thể hơn: bao trùm keyword của cái cũ và dài hơn rõ rệt.
  const keyCu = new Set(cu.keys.map((k) => k.toLowerCase()));
  const baoTrum = keyCu.size > 0 && [...keyCu].every((k) => moi.keys.some((x) => x.toLowerCase() === k));
  if (baoTrum && moi.noiDung.length > cu.noiDung.length * 1.3) {
    return { quanHe: 'lam_ro', lyDo: 'entry mới bao trùm keyword của entry cũ và cụ thể hơn' };
  }

  return { quanHe: 'bo_sung', lyDo: 'nói về mặt khác của cùng chủ đề' };
}

/**
 * Đối soát một entry mới với toàn bộ entry đang có — 51.3.
 *
 * Ứng viên va chạm: giao `keys`/`secondaryKeys`, **hoặc** cùng nói về một entity
 * qua bảng `chuDe` (53.4).
 */
export function doiSoatEntry(moi: EntryCoNguon, daCo: readonly EntryCoNguon[]): DoiSoat[] {
  const ra: DoiSoat[] = [];

  for (const cu of daCo) {
    if (cu.entry.id === moi.entry.id) continue;
    if (cu.entry.trangThai === 'da_xoa') continue;

    const chungKey = giaoKeys(moi.entry, cu.entry).length > 0;
    const chungChuDe = moi.entry.chuDe.some((c) => cu.entry.chuDe.includes(c));
    if (!chungKey && !chungChuDe) continue;

    const pl = phanLoaiQuanHe(moi.entry, cu.entry);

    if (pl.quanHe === 'bo_sung') {
      ra.push({ ...chung(moi, cu, pl), xuLy: 'giu_ca_hai', cheId: '', giuId: '' });
      continue;
    }
    if (pl.quanHe === 'lam_ro') {
      ra.push({ ...chung(moi, cu, pl), xuLy: 'giu_ca_hai_ha_uu_tien', cheId: '', giuId: moi.entry.id });
      continue;
    }
    if (pl.quanHe === 'trung_lap') {
      const giu = thang(moi, cu);
      ra.push({ ...chung(moi, cu, pl), xuLy: 'gop', cheId: '', giuId: giu.entry.id });
      continue;
    }

    // mâu thuẫn → che bản ưu tiên THẤP hơn
    const giu = thang(moi, cu);
    const thua = giu.entry.id === moi.entry.id ? cu : moi;
    const cheDuoc = !thua.entry.khoaCanon;
    ra.push({
      ...chung(moi, cu, pl),
      xuLy: 'che',
      // [BB] 51.4 — entry khóa canon KHÔNG BAO GIỜ bị che.
      cheId: cheDuoc ? thua.entry.id : '',
      giuId: giu.entry.id,
    });
  }

  ra.sort((a, b) => (a.cuId < b.cuId ? -1 : a.cuId > b.cuId ? 1 : 0));
  return ra;
}

function chung(moi: EntryCoNguon, cu: EntryCoNguon, pl: { quanHe: QuanHeDoiSoat; lyDo: string }) {
  return { moiId: moi.entry.id, cuId: cu.entry.id, quanHe: pl.quanHe, lyDo: pl.lyDo };
}

/** Bên nào thắng theo 51.2 — nguồn trước, rồi tới `uuTien` khai báo, rồi tới id. */
function thang(a: EntryCoNguon, b: EntryCoNguon): EntryCoNguon {
  const ua = UU_TIEN_NGUON[a.nguon];
  const ub = UU_TIEN_NGUON[b.nguon];
  if (ua !== ub) return ua < ub ? a : b;
  if (a.entry.doTinCay !== b.entry.doTinCay) return a.entry.doTinCay > b.entry.doTinCay ? a : b;
  return a.entry.id < b.entry.id ? a : b;
}

// ─────────────────────────────────────────── che / bỏ che

export type KetQuaChe = {
  readonly entry: LorebookEntry;
  /** Câu ghi vào biên niên sử, giọng kể — 51.3 [BB]. */
  readonly dongBienNien: string;
};

/**
 * Che một entry. [BB] Che KHÔNG phải xóa.
 *
 * Trả về bản sao có `trangThai = 'bi_che'`; entry gốc không bị sửa tại chỗ. Nếu
 * entry khóa canon thì hàm trả về nguyên bản kèm dòng biên niên nói rõ vì sao
 * không che — im lặng bỏ qua là cách nhanh nhất để người chơi tưởng nút hỏng.
 */
export function che(
  entry: LorebookEntry,
  boiId: string,
  lyDo: string,
  tick: number,
  boiAi: LorebookEntry['lichSu'][number]['boiAi'] = 'doi_soat',
): KetQuaChe {
  if (entry.khoaCanon) {
    return {
      entry,
      dongBienNien:
        `Có kẻ muốn thôi chép câu về "${entry.ten}", nhưng nó đã được khóa lại như một chân lý. ` +
        'Thế giới sẽ phải tự xoay xở với một điều nó biết là không còn đúng.',
    };
  }
  return {
    entry: {
      ...entry,
      trangThai: 'bi_che',
      biCheBoiId: boiId,
      lyDoChe: lyDo,
      tickChe: tick,
      lichSu: [
        ...entry.lichSu.slice(-19),
        { tick, boiAi, op: 'che', truoc: 'hoat_dong', sau: 'bi_che', lyDo },
      ],
    },
    dongBienNien:
      `Từ đời này, các bản chép không còn mở đầu bằng câu về "${entry.ten}" nữa. ` +
      'Không ai ra lệnh sửa; người ta chỉ ngừng chép nó.',
  };
}

/** Bỏ che — người chơi làm được bất cứ lúc nào (51.3). */
export function boChe(entry: LorebookEntry, tick: number): LorebookEntry {
  if (entry.trangThai !== 'bi_che') return entry;
  return {
    ...entry,
    trangThai: 'hoat_dong',
    biCheBoiId: null,
    lyDoChe: '',
    tickChe: null,
    lichSu: [
      ...entry.lichSu.slice(-19),
      {
        tick,
        boiAi: 'nguoi_choi',
        op: 'bo_che',
        truoc: 'bi_che',
        sau: 'hoat_dong',
        lyDo: 'người chơi bỏ che',
      },
    ],
  };
}

// ─────────────────────────────────────────── chống ô nhiễm (51.6 kiểu D)

export type NguonSinhSu = {
  readonly eventIds: readonly string[];
  readonly chronicleIds: readonly string[];
  /** Entry lorebook được dùng làm nguồn — [BB] chỗ này PHẢI rỗng. */
  readonly entryIds: readonly string[];
};

/**
 * [BB] 51.6 — sử kỷ nguyên N **chỉ** được sinh từ `events` và `chronicle` của kỷ
 * nguyên N. Sinh từ sử cũ thì sai lệch tự nhân lên theo cấp số.
 *
 * Hàm trả về issue thay vì boolean: người gọi cần biết ID nào phạm để bỏ đúng cái đó.
 */
export function kiemNguonSinhSu(nguon: NguonSinhSu): ImportIssue[] {
  const ra: ImportIssue[] = [];
  if (nguon.entryIds.length > 0) {
    ra.push({
      code: 'O_NHIEM_NGUON_SU',
      severity: 'error',
      path: '',
      message:
        `Sử kỷ nguyên này đang lấy ${nguon.entryIds.length} entry lorebook làm nguồn. ` +
        'Chỉ được sinh từ events và chronicle của chính kỷ nguyên đó (51.6) — nếu không, độ lệch tăng theo cấp số.',
      details: { entryIds: [...nguon.entryIds] },
    });
  }
  if (nguon.eventIds.length === 0 && nguon.chronicleIds.length === 0) {
    ra.push({
      code: 'SU_KHONG_CO_NGUON',
      severity: 'error',
      path: '',
      message: 'Không có event hay chronicle nào chống lưng. Sử không có nguồn thì không phải sử.',
      details: {},
    });
  }
  return ra;
}

// ─────────────────────────────────────────── bảng đối soát (51.7)

export type BangDoiSoat = {
  readonly mauThuan: readonly DoiSoat[];
  readonly trungLap: readonly DoiSoat[];
  readonly boSung: readonly DoiSoat[];
  readonly lamRo: readonly DoiSoat[];
  readonly tomTat: string;
};

/** Gom kết quả đối soát thành bảng của 51.7. */
export function bangDoiSoat(ds: readonly DoiSoat[], kyNguyen: number, soEntryMoi: number): BangDoiSoat {
  const theo = (q: QuanHeDoiSoat): DoiSoat[] => ds.filter((d) => d.quanHe === q);
  const mauThuan = theo('mau_thuan');
  const trungLap = theo('trung_lap');
  const boSung = theo('bo_sung');
  const lamRo = theo('lam_ro');
  return {
    mauThuan,
    trungLap,
    boSung,
    lamRo,
    tomTat:
      `ĐỐI SOÁT · kỷ nguyên ${kyNguyen} · ${soEntryMoi} entry mới\n` +
      `  mâu thuẫn ${mauThuan.length}\n` +
      `  trùng lặp ${trungLap.length}\n` +
      `  bổ sung ${boSung.length}\n` +
      `  làm rõ ${lamRo.length}`,
  };
}
