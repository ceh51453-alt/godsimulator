/**
 * Kho Từ — vốn từ thế giới tự tích lũy trong lúc chơi.
 *
 * ── Vì sao không phải một bảng cứng ──
 *
 * Bản đầu của Bồi Đắp đặt tên từ ba mảng đóng băng trong mã nguồn. Nó chạy, và
 * nó sai ở chỗ quan trọng nhất: sau hai trăm năm, thế giới vẫn gọi tên bằng đúng
 * bấy nhiêu chữ mà lập trình viên đã nghĩ ra trước khi thế giới tồn tại. Một
 * thần thoại thì không như thế. Nó **học chữ của chính nó**: một nơi được đặt
 * tên "Vực Vô Thủy" làm cho "Vực" và "Vô Thủy" trở thành từ mà thế giới ấy biết
 * dùng, và ba trăm năm sau có một "Ngưỡng Vô Thủy" ở nơi khác.
 *
 * Vì vậy Kho Từ nằm trong `World` — dữ liệu theo NHÁNH, vào `stateHash`, xuống
 * đĩa cùng ván, phân nhánh cùng nhánh. Hai nhánh tách từ một gốc sẽ dần nói hai
 * thứ tiếng khác nhau, và đó là điều đúng.
 *
 * ── Ba luật kết nạp ──
 *
 * 1. **Có trần.** `TRAN_TU_VUNG` từ. Không trần thì mỗi lượt kể lại nhét thêm
 *    vài chữ, và sau một vạn nhịp `stateHash` phải băm một cuốn từ điển.
 *
 * 2. **Không nhận từ đã có.** So trên dạng thường hóa CÓ DẤU, nên "Vực" và
 *    "vực" và "VỰC" là một từ.
 *
 * 3. **Không nhận từ gần giống.** Bỏ dấu, rồi khoảng cách sửa ≤ 1 là bị từ chối.
 *    Không có luật này thì "Vô Thủy" sẽ sinh ra "Vô Thúy", "Vô Thủ", "Vô Thuy" —
 *    thế giới trông như một danh sách lỗi chính tả chứ không như một thần thoại.
 *
 * ── Vì sao luật 3 chỉ áp cho từ đủ DÀI ──
 *
 * Tiếng Việt là ngôn ngữ đơn âm, và ở đơn âm thì lệch một chữ cái là **một từ
 * khác**, không phải một lỗi gõ: Sa và Xa, Gò và Bờ, Cạn và Mặn, Bạch và Mạch.
 * Áp máy móc khoảng cách sửa lên chúng sẽ nuốt mất phần lớn vốn từ đơn âm — bản
 * đầu của file này làm đúng như thế và loại 17 chữ ngay trong vốn gốc.
 *
 * Vì vậy luật 3 chỉ chạy khi CẢ HAI từ dài từ `DAI_XET_GAN_GIONG` ký tự trở lên
 * (sau khi bỏ dấu) — tức là khi chúng đã đủ dài để một chữ lệch có thể là lỗi
 * gõ chứ không phải một từ khác. Dưới ngưỡng ấy, phép bỏ dấu ở luật 2 vẫn bắt
 * được cặp thật sự nguy hiểm, còn hai đơn âm khác nghĩa thì được sống.
 */
import { z } from 'zod';
import type { WorldState } from '../engine/state.js';

// ─────────────────────────────────────────── kiểu

/**
 * Bốn vai của một từ.
 *
 * Tách vai vì một cái tên không phải một chuỗi ngẫu nhiên: nó là **đầu** (thứ
 * nói đây là loại nơi/loại người gì) cộng **đuôi** (thứ phân biệt cái này với
 * cái kia). Trộn hai vai lại sẽ đẻ ra "Hỗn Mang Vực" và "Vực Vực".
 */
export const VAI_TU = ['dau_dia', 'duoi_dia', 'ho_nguoi', 'hieu_nguoi'] as const;
export type VaiTu = (typeof VAI_TU)[number];

export const NHAN_VAI_TU: Readonly<Record<VaiTu, string>> = Object.freeze({
  dau_dia: 'Đầu địa danh',
  duoi_dia: 'Đuôi địa danh',
  ho_nguoi: 'Họ',
  hieu_nguoi: 'Hiệu',
});

export const NGUON_TU = ['goc', 'the_gioi', 'lorebook', 'nguoi_choi'] as const;
export type NguonTu = (typeof NGUON_TU)[number];

export const TuVungSchema = z
  .object({
    tu: z.string().min(1).max(24),
    vai: z.enum(VAI_TU),
    /** Nhịp thế giới học được từ này. `0` là từ có sẵn lúc khai thiên. */
    tickThem: z.number().int().min(0).prefault(0),
    nguon: z.enum(NGUON_TU).prefault('the_gioi'),
    /** Số lần từ này đã được dùng để đặt tên — dùng để không lặp một chữ mãi. */
    soLanDung: z.number().int().min(0).prefault(0),
  })
  .strict();

export type TuVung = z.infer<typeof TuVungSchema>;

/**
 * Trần Kho Từ.
 *
 * Mười sáu nghìn ba trăm tám mươi tư — bằng vốn từ chủ động của một người
 * trưởng thành, và là chỗ trần này nên nằm: nó tồn tại để chặn `stateHash` phải
 * băm một cuốn từ điển đang nở, KHÔNG phải để tuyên bố một thần thoại chỉ được
 * biết ngần này chữ.
 *
 * Bản đầu đặt 4096 với lý lẽ "rất lớn hơn nghìn". Lý lẽ ấy hỏng ở một chỗ:
 * `hocTuTheGioi()` nhặt chữ từ MỌI cái tên mà lời kể đặt ra, nên một ván chơi
 * dài cùng một thợ Bồi Đắp biết đẻ chữ mới sẽ chạm trần thật — và chạm trần
 * nghĩa là thế giới ngừng học, tức là đúng thứ cả file này tồn tại để chống.
 *
 * Giá phải trả là tuyến tính và nhỏ: mỗi từ là một bản ghi năm trường, chuỗi
 * dài tối đa `DAI_TOI_DA` ký tự. Phần đắt duy nhất là luật 3 — và nó đã được
 * chỉ mục theo độ dài ở `ketNapTu()`, nên nâng trần không làm nó chậm đi.
 */
export const TRAN_TU_VUNG = 16_384;

/** Độ dài cho phép của một từ, tính bằng ký tự. */
export const DAI_TOI_DA = 24;
export const DAI_TOI_THIEU = 2;

/**
 * Từ ngắn hơn ngần này (sau khi bỏ dấu) KHÔNG bị luật gần giống soi.
 *
 * Năm ký tự là ngưỡng đơn âm tiếng Việt: "nguong", "bich lac", "vo thuy" nằm
 * trên; "sa", "xa", "go", "bo", "bach", "mach" nằm dưới. Xem chú thích đầu file
 * để biết vì sao ngưỡng này tồn tại.
 */
export const DAI_XET_GAN_GIONG = 5;

// ─────────────────────────────────────────── chuẩn hóa và so sánh

const DAU_TO_HOP = /[̀-ͯ]/g;

/**
 * Dạng khóa để so TRÙNG — thường hóa và gộp khoảng trắng, GIỮ NGUYÊN DẤU.
 *
 * Giữ dấu vì trong tiếng Việt dấu là một phần của chữ, không phải trang trí:
 * "Cấm" và "Câm" là hai từ, và một Kho Từ gộp chúng làm một sẽ mất đúng những
 * chữ dùng để gọi tên luật lệ.
 */
export function chuanHoa(tu: string): string {
  return tu.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Dạng bỏ dấu để so GẦN GIỐNG.
 *
 * `NFD` tách dấu thành ký tự tổ hợp rồi ta cắt chúng; `đ` phải xử riêng vì nó là
 * một chữ cái độc lập trong Unicode chứ không phải `d` cộng dấu.
 */
export function boDau(tu: string): string {
  return tu
    .normalize('NFD')
    .replace(DAU_TO_HOP, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Khóa chính tả — chữ cái cộng TẬP dấu, bỏ qua chỗ đặt dấu.
 *
 * [BB] Đây là luật 2 thật sự, và nó có mặt vì một lỗi quan sát được: thế giới
 * học vào cả "Hòe" lẫn "Hoè". Hai chuỗi ấy khác nhau từng byte, nhưng chúng là
 * **một từ tiếng Việt** viết theo hai quy ước đặt dấu (cũ và mới). So chuỗi thô
 * cho chúng qua; bỏ hết dấu thì lại gộp nhầm "Cấm" với "Câm".
 *
 * Cách đúng nằm ở giữa: giữ chữ cái, giữ *tập* dấu, bỏ *vị trí* dấu.
 *
 *   - "Hòe" và "Hoè" → chữ `hoe`, dấu {huyền} → MỘT từ, đúng.
 *   - "Cấm" và "Câm" → dấu {sắc, mũ} và {mũ} → HAI từ, đúng.
 *   - "Đàm" và "Đầm" → dấu {huyền} và {huyền, mũ} → HAI từ, đúng.
 */
export function khoaChinhTa(tu: string): string {
  const nfd = tu.toLowerCase().replace(/\s+/g, ' ').trim().normalize('NFD');
  const chu = nfd.replace(DAU_TO_HOP, '').replace(/đ/g, 'd');
  const dau = [...nfd.matchAll(DAU_TO_HOP)].map((m) => m[0]).sort();
  return `${chu}|${dau.join('')}`;
}

/**
 * Hai từ có gần giống nhau tới mức một trong hai là thừa không.
 *
 * Trả `false` cho mọi cặp mà một trong hai ngắn hơn `DAI_XET_GAN_GIONG` — xem
 * chú thích đầu file: ở đơn âm tiếng Việt, lệch một chữ là một từ khác.
 */
export function ganGiong(a: string, b: string): boolean {
  return ganGiongDaBoDau(boDau(a), boDau(b));
}

/**
 * Cùng phép so, nhưng nhận dạng ĐÃ bỏ dấu.
 *
 * `boDau()` gọi `normalize('NFD')` và chạy ba biểu thức chính quy — rẻ khi gọi
 * một lần, không rẻ khi gọi hai lần cho mỗi cặp trong một kho mười sáu nghìn từ.
 * `ketNapTu()` bỏ dấu cả kho đúng một lần rồi dùng cửa này.
 */
function ganGiongDaBoDau(x: string, y: string): boolean {
  if (x.length < DAI_XET_GAN_GIONG || y.length < DAI_XET_GAN_GIONG) return false;
  return khoangCachSua(x, y, 1) <= 1;
}

/**
 * Khoảng cách sửa, nhưng DỪNG SỚM khi đã vượt `tran`.
 *
 * Phép Levenshtein đầy đủ là O(mn) và ở đây nó chạy trên tới bốn nghìn từ mỗi
 * lần kết nạp. Ta chỉ cần biết "≤ 1 hay không", nên hai phép cắt dưới đây làm
 * phần lớn công việc: lệch độ dài quá `tran` là đủ kết luận, và một vòng quét
 * tuyến tính đủ cho `tran = 1`.
 */
export function khoangCachSua(a: string, b: string, tran = 1): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > tran) return tran + 1;

  if (la === lb) {
    let khac = 0;
    for (let i = 0; i < la; i++) {
      if (a[i] !== b[i] && ++khac > tran) return tran + 1;
    }
    return khac;
  }

  // Lệch đúng một ký tự: chuỗi ngắn phải là chuỗi dài bỏ đi một chỗ.
  const [ngan, dai] = la < lb ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let boQua = 0;
  while (i < ngan.length && j < dai.length) {
    if (ngan[i] === dai[j]) {
      i++;
      j++;
      continue;
    }
    if (++boQua > tran) return tran + 1;
    j++;
  }
  return boQua + (dai.length - j) + (ngan.length - i);
}

/** Ký tự hợp lệ: chữ cái tiếng Việt, dấu cách, gạch nối. Không số, không dấu câu. */
const KY_TU_HOP_LE = /^[\p{L}][\p{L} -]*$/u;

export type LyDoTuChoi =
  'rong' | 'qua_ngan' | 'qua_dai' | 'ky_tu_la' | 'qua_nhieu_tieng' | 'da_co' | 'gan_giong' | 'day_kho';

export const NHAN_TU_CHOI: Readonly<Record<LyDoTuChoi, string>> = Object.freeze({
  rong: 'từ rỗng',
  qua_ngan: `ngắn hơn ${DAI_TOI_THIEU} ký tự`,
  qua_dai: `dài quá ${DAI_TOI_DA} ký tự`,
  ky_tu_la: 'có ký tự không phải chữ',
  qua_nhieu_tieng: 'quá ba tiếng',
  da_co: 'thế giới đã có từ này',
  gan_giong: 'gần giống một từ đã có',
  day_kho: 'Kho Từ đã đầy',
});

// ─────────────────────────────────────────── kết nạp

export type KetQuaKetNap = {
  /** Kho sau khi kết nạp — mảng MỚI, không sửa mảng vào. */
  readonly kho: readonly TuVung[];
  readonly daNhan: readonly TuVung[];
  readonly biTuChoi: readonly { readonly tu: string; readonly lyDo: LyDoTuChoi }[];
};

/** Viết hoa chữ đầu mỗi tiếng — dạng HIỂN THỊ, khác hẳn `chuanHoa()`. */
export function hoaDauTieng(tu: string): string {
  return tu
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((t) => (t.length === 0 ? t : t[0]?.toUpperCase() + t.slice(1)))
    .join(' ');
}

/**
 * Kết nạp một loạt từ ứng viên vào kho, theo ba luật ở đầu file.
 *
 * Hàm THUẦN: nó không chạm `WorldState`, không sinh patch. Người gọi lấy
 * `kho` trả về rồi tự quyết ghi bằng Event nào — cùng lẽ với `boiDap.ts`.
 *
 * Ứng viên được duyệt theo đúng thứ tự đưa vào, và mỗi từ vừa nhận lập tức trở
 * thành hàng rào cho những từ sau nó trong CÙNG lô. Không có bước ấy thì
 * "Vô Thủy" và "Vô Thúy" nằm cạnh nhau trong một lô sẽ vào được cả hai.
 */
export function ketNapTu(
  khoCu: readonly TuVung[],
  ungVien: readonly { tu: string; vai: VaiTu; tick: number; nguon?: NguonTu }[],
  tran = TRAN_TU_VUNG,
): KetQuaKetNap {
  const kho = [...khoCu];
  const daNhan: TuVung[] = [];
  const biTuChoi: { tu: string; lyDo: LyDoTuChoi }[] = [];

  /*
   * Hai chỉ mục, dựng một lần rồi bồi thêm — không quét lại mảng.
   *
   * `daCo` cho luật 2 (trùng); `theoDoDai` giữ dạng ĐÃ BỎ DẤU, gom theo độ dài,
   * để luật 3 so gần giống. Tách hai vì chúng trả lời hai câu hỏi khác nhau, và
   * gộp lại thì một trong hai luật sẽ chạy trên khóa sai.
   *
   * Gom theo độ dài vì `khoangCachSua(_, _, 1)` trả về "quá xa" ngay khi hai
   * chuỗi lệch nhau hơn một ký tự. Nghĩa là chỉ ba rổ `L-1`, `L`, `L+1` có thể
   * chứa một từ gần giống, và quét cả kho là quét thừa. Ở trần 16.384 từ, khác
   * biệt ấy là khác biệt giữa một lượt Bồi Đắp và một tab đứng hình.
   */
  const daCo = new Set(kho.map((x) => khoaChinhTa(x.tu)));
  const theoDoDai = new Map<number, string[]>();
  const ghiChiMuc = (tu: string): void => {
    const k = boDau(tu);
    const ro = theoDoDai.get(k.length);
    if (ro === undefined) theoDoDai.set(k.length, [k]);
    else ro.push(k);
  };
  for (const x of kho) ghiChiMuc(x.tu);

  for (const uv of ungVien) {
    const tu = hoaDauTieng(uv.tu);
    const ch = chuanHoa(tu);
    const khoa = khoaChinhTa(tu);

    const tuChoi = (lyDo: LyDoTuChoi): void => {
      biTuChoi.push({ tu, lyDo });
    };

    if (ch === '') {
      tuChoi('rong');
      continue;
    }
    if (ch.replace(/[ -]/g, '').length < DAI_TOI_THIEU) {
      tuChoi('qua_ngan');
      continue;
    }
    if (tu.length > DAI_TOI_DA) {
      tuChoi('qua_dai');
      continue;
    }
    if (!KY_TU_HOP_LE.test(tu)) {
      tuChoi('ky_tu_la');
      continue;
    }
    if (ch.split(' ').length > 3) {
      tuChoi('qua_nhieu_tieng');
      continue;
    }
    if (daCo.has(khoa)) {
      tuChoi('da_co');
      continue;
    }
    if (kho.length >= tran) {
      tuChoi('day_kho');
      continue;
    }
    /*
     * Luật đắt nhất, để CUỐI có chủ đích: năm phép kiểm trên đều là O(1) và
     * loại phần lớn ứng viên xấu, nên vòng quét này chỉ chạy cho những từ đã
     * sạch về hình thức. Từ ngắn còn được cắt sớm hơn nữa — dưới
     * `DAI_XET_GAN_GIONG` thì luật 3 không áp, và ta bỏ luôn cả vòng quét.
     */
    const khongDau = boDau(tu);
    let gan = false;
    if (khongDau.length >= DAI_XET_GAN_GIONG) {
      for (let d = khongDau.length - 1; d <= khongDau.length + 1 && !gan; d++) {
        for (const co of theoDoDai.get(d) ?? []) {
          if (ganGiongDaBoDau(khongDau, co)) {
            gan = true;
            break;
          }
        }
      }
    }
    if (gan) {
      tuChoi('gan_giong');
      continue;
    }

    const moi = TuVungSchema.parse({
      tu,
      vai: uv.vai,
      tickThem: Math.max(0, Math.floor(uv.tick)),
      nguon: uv.nguon ?? 'the_gioi',
    });
    kho.push(moi);
    daCo.add(khoa);
    ghiChiMuc(tu);
    daNhan.push(moi);
  }

  return { kho, daNhan, biTuChoi };
}

// ─────────────────────────────────────────── kho gốc

/**
 * Vốn từ khai thiên — [BB] đây là thứ thế giới biết TRƯỚC khi có ai kể gì.
 *
 * Ba tầng nghĩa, và cả ba đều cố ý:
 *
 *   - **Cấu trúc vũ trụ**: Cõi, Tầng, Trục, Vực, Ngưỡng, Rốn, Vòm, Đáy. Đây là
 *     thứ một thần thoại có mà một bản đồ không có: thế giới có TRÊN và DƯỚI,
 *     có tâm và có bờ, và những chữ ấy phải sẵn sàng từ nhịp 0.
 *   - **Quy luật**: Luật, Giới, Cấm, Ước, Lệ, Nghiệp, Kiếp, Đạo, Mệnh. Bảy trục
 *     Luật Nền được gieo ở trạng thái `vo_danh`; khi có kẻ đặt tên được một
 *     trục, họ cần chữ để gọi nó.
 *   - **Địa thế**: Ngàn, Đầm, Bến, Đèo, Thung, Gò, Truông. Phần duy nhất còn
 *     giữ từ bản cũ, vì tên vùng vẫn phải nói được vùng ấy có gì.
 *
 * Sau nhịp 0, kho này chỉ còn là hạt giống: `hocTuTheGioi()` bồi thêm bằng chính
 * chữ mà thế giới đẻ ra.
 */
const GOC: readonly { tu: string; vai: VaiTu }[] = Object.freeze([
  // ── cấu trúc vũ trụ ──
  { tu: 'Cõi', vai: 'dau_dia' },
  { tu: 'Tầng', vai: 'dau_dia' },
  { tu: 'Trục', vai: 'dau_dia' },
  { tu: 'Vực', vai: 'dau_dia' },
  { tu: 'Ngưỡng', vai: 'dau_dia' },
  { tu: 'Rốn', vai: 'dau_dia' },
  { tu: 'Vòm', vai: 'dau_dia' },
  { tu: 'Đáy', vai: 'dau_dia' },
  { tu: 'Mạch', vai: 'dau_dia' },
  { tu: 'Động', vai: 'dau_dia' },
  { tu: 'Bờ', vai: 'dau_dia' },
  { tu: 'Khe', vai: 'dau_dia' },
  // ── địa thế: tên vùng vẫn phải nói vùng ấy có gì ──
  { tu: 'Ngàn', vai: 'dau_dia' },
  { tu: 'Đầm', vai: 'dau_dia' },
  { tu: 'Bến', vai: 'dau_dia' },
  { tu: 'Đèo', vai: 'dau_dia' },
  { tu: 'Thung', vai: 'dau_dia' },
  { tu: 'Gò', vai: 'dau_dia' },
  { tu: 'Truông', vai: 'dau_dia' },
  { tu: 'Đồng', vai: 'dau_dia' },
  { tu: 'Bãi', vai: 'dau_dia' },
  { tu: 'Suối', vai: 'dau_dia' },

  // ── đuôi: trạng thái của một nơi trong thần thoại ──
  { tu: 'Hỗn Mang', vai: 'duoi_dia' },
  { tu: 'Vô Thủy', vai: 'duoi_dia' },
  { tu: 'Vô Chung', vai: 'duoi_dia' },
  { tu: 'Tịch Diệt', vai: 'duoi_dia' },
  { tu: 'Chưa Tên', vai: 'duoi_dia' },
  { tu: 'Bị Quên', vai: 'duoi_dia' },
  { tu: 'Không Bóng', vai: 'duoi_dia' },
  { tu: 'Nghịch', vai: 'duoi_dia' },
  { tu: 'Khuyết', vai: 'duoi_dia' },
  { tu: 'Câm', vai: 'duoi_dia' },
  { tu: 'Úp', vai: 'duoi_dia' },
  { tu: 'Chìm', vai: 'duoi_dia' },
  { tu: 'Cháy', vai: 'duoi_dia' },
  { tu: 'Gãy', vai: 'duoi_dia' },
  { tu: 'Khuất', vai: 'duoi_dia' },
  { tu: 'Lặng', vai: 'duoi_dia' },
  { tu: 'Mặn', vai: 'duoi_dia' },
  { tu: 'Sâu', vai: 'duoi_dia' },
  { tu: 'Cạn', vai: 'duoi_dia' },
  { tu: 'Xa', vai: 'duoi_dia' },

  // ── quy luật: chữ để gọi một trục Luật Nền khi có kẻ đặt tên được nó ──
  { tu: 'Luật', vai: 'hieu_nguoi' },
  { tu: 'Giới', vai: 'hieu_nguoi' },
  { tu: 'Cấm', vai: 'hieu_nguoi' },
  { tu: 'Ước', vai: 'hieu_nguoi' },
  { tu: 'Nghiệp', vai: 'hieu_nguoi' },
  { tu: 'Kiếp', vai: 'hieu_nguoi' },
  { tu: 'Đạo', vai: 'hieu_nguoi' },
  { tu: 'Mệnh', vai: 'hieu_nguoi' },
  { tu: 'Kẻ Gọi Tên', vai: 'hieu_nguoi' },
  { tu: 'Kẻ Giữ Ngưỡng', vai: 'hieu_nguoi' },
  { tu: 'Kẻ Đếm Nhịp', vai: 'hieu_nguoi' },
  { tu: 'Người Đi Trước', vai: 'hieu_nguoi' },

  // ── họ: âm tiết cổ, không phải họ Việt hiện đại ──
  { tu: 'Lư', vai: 'ho_nguoi' },
  { tu: 'Đàm', vai: 'ho_nguoi' },
  { tu: 'Sa', vai: 'ho_nguoi' },
  { tu: 'Hòe', vai: 'ho_nguoi' },
  { tu: 'Vân', vai: 'ho_nguoi' },
  { tu: 'Bạch', vai: 'ho_nguoi' },
  { tu: 'Khoa', vai: 'ho_nguoi' },
  { tu: 'Trù', vai: 'ho_nguoi' },
  { tu: 'Mạc', vai: 'ho_nguoi' },
  { tu: 'Cẩn', vai: 'ho_nguoi' },
  { tu: 'Huyền', vai: 'ho_nguoi' },
  { tu: 'Tà', vai: 'ho_nguoi' },
  { tu: 'Diêu', vai: 'ho_nguoi' },
  { tu: 'Uyên', vai: 'ho_nguoi' },
]);

/** Kho Từ lúc khai thiên. Mảng mới mỗi lần gọi — không ai được sửa hằng số gốc. */
export function khoGoc(): readonly TuVung[] {
  return GOC.map((g) => TuVungSchema.parse({ tu: g.tu, vai: g.vai, tickThem: 0, nguon: 'goc' }));
}

/**
 * Đọc Kho Từ ra khỏi `World`, và ĐÂY là chỗ hình dạng thật được kiểm.
 *
 * `WorldSchema.tuVung` khai `unknown[]` vì tầng `contracts/` không được biết tới
 * tầng `world/` — nhập ngược chiều ấy sẽ thành vòng. Đổi lại, mọi đường đọc đều
 * phải đi qua hàm này, và hàng hỏng bị BỎ chứ không làm sập lượt: một dòng từ
 * vựng sai định dạng trong file save của người khác không đáng để mất cả ván.
 *
 * Kho rỗng trả về vốn gốc: ván lưu trước bản này mở lại vẫn có chữ để đặt tên.
 */
export function docKho(tuVungThuong: readonly unknown[]): readonly TuVung[] {
  const ra: TuVung[] = [];
  for (const x of tuVungThuong) {
    const p = TuVungSchema.safeParse(x);
    if (p.success) ra.push(p.data);
  }
  return ra.length === 0 ? khoGoc() : ra;
}

// ─────────────────────────────────────────── học từ thế giới

/** Tách một cái tên thành đầu và đuôi. `"Vực Vô Thủy"` → `["Vực", "Vô Thủy"]`. */
export function tachTen(ten: string): { dau: string; duoi: string } {
  const t = ten.trim().replace(/\s+/g, ' ');
  const i = t.indexOf(' ');
  return i < 0 ? { dau: t, duoi: '' } : { dau: t.slice(0, i), duoi: t.slice(i + 1) };
}

/**
 * Nhặt ứng viên từ mới ra khỏi chính thế giới.
 *
 * Đây là chỗ "thế giới học chữ của nó" thành mã. Mọi cái tên do Narrator viết
 * ra, do lorebook mang vào, do người chơi đặt — đều đi qua đây và để lại vốn từ.
 * Không có bước này thì Kho Từ là một bảng cứng có thêm một lớp sơn.
 *
 * Trả ỨNG VIÊN, không trả kết quả: `ketNapTu()` mới là chỗ ba luật kết nạp chạy.
 */
export function hocTuTheGioi(
  s: WorldState,
  gioiHan = 24,
): readonly { tu: string; vai: VaiTu; tick: number; nguon: NguonTu }[] {
  const ra: { tu: string; vai: VaiTu; tick: number; nguon: NguonTu }[] = [];
  const tick = s.world.tick;
  const them = (tu: string, vai: VaiTu, nguon: NguonTu): void => {
    if (ra.length < gioiHan * 4 && tu.trim() !== '') ra.push({ tu, vai, tick, nguon });
  };

  // Duyệt theo id đã sắp — luật bất biến #7.
  for (const id of [...s.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (ra.length >= gioiHan * 4) break;
    const e = s.entities.get(id);
    if (!e || e.ten.trim() === '') continue;
    const { dau, duoi } = tachTen(e.ten);

    if (e.kind === 'place' || e.kind === 'realm') {
      them(dau, 'dau_dia', 'the_gioi');
      them(duoi, 'duoi_dia', 'the_gioi');
    } else if (e.kind === 'mortal' || e.kind === 'deity') {
      them(dau, 'ho_nguoi', 'the_gioi');
      them(duoi, 'hieu_nguoi', 'the_gioi');
    } else if (e.kind === 'concept' || e.kind === 'law') {
      /*
       * Khái niệm và luật cho ĐUÔI, không cho đầu.
       *
       * "Ô Uế" là thứ một nơi chốn có thể MANG ("Vực Ô Uế"), không phải thứ một
       * nơi chốn LÀ. Bỏ phân biệt này thì thế giới đầy những chỗ tên "Ô Uế Sâu".
       */
      them(e.ten, 'duoi_dia', 'the_gioi');
    }
  }

  for (const m of [...s.storylines.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (ra.length >= gioiHan * 4) break;
    them(tachTen(m.ten).duoi, 'duoi_dia', 'the_gioi');
  }

  // Lorebook mang thần thoại nguồn vào; tên neo của nó là vốn từ quý nhất.
  for (const kv of [...s.loreExpectations.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (ra.length >= gioiHan * 4) break;
    them(tachTen(kv.moTa).dau, 'duoi_dia', 'lorebook');
  }

  return ra.slice(0, gioiHan * 4);
}

// ─────────────────────────────────────────── tra cứu

/** Từ theo vai, đã sắp xếp ổn định. Rỗng nghĩa là kho chưa có chữ nào vai ấy. */
export function tuTheoVai(kho: readonly TuVung[], vai: VaiTu): readonly TuVung[] {
  return kho.filter((x) => x.vai === vai).sort((a, b) => (a.tu < b.tu ? -1 : a.tu > b.tu ? 1 : 0));
}

export type ThongKeKho = {
  readonly tong: number;
  readonly tran: number;
  readonly tuGoc: number;
  readonly tuTheGioi: number;
  readonly theoVai: Readonly<Record<VaiTu, number>>;
};

export function thongKeKho(kho: readonly TuVung[], tran = TRAN_TU_VUNG): ThongKeKho {
  const theoVai = { dau_dia: 0, duoi_dia: 0, ho_nguoi: 0, hieu_nguoi: 0 };
  let tuGoc = 0;
  for (const x of kho) {
    theoVai[x.vai]++;
    if (x.nguon === 'goc') tuGoc++;
  }
  return { tong: kho.length, tran, tuGoc, tuTheGioi: kho.length - tuGoc, theoVai };
}
