/**
 * Bóc tách phản hồi model — Phần 61.3, 71.5 [BB]; cổng Phase 8 "patch sai bị từ chối".
 *
 * ── Ranh giới ──
 *
 * Model được phép viết văn tùy ý. Model KHÔNG được phép đổi thế giới tùy ý.
 * Mọi thứ nó đề nghị đi qua ba lớp trước khi thành `PatchOp`:
 *
 *   1. cú pháp   — khối `<CapNhat>` phải là JSON hợp lệ
 *   2. hình dạng — từng phần tử phải qua `PatchOpSchema`
 *   3. thẩm quyền — bảng và đường dẫn phải nằm trong bảng trắng dưới đây
 *
 * Lớp 3 là lớp quan trọng nhất và là lớp dễ quên nhất. Một patch đúng schema
 * hoàn hảo mà ghi vào `worlds.playerState.mode` sẽ **đá người chơi sang tầng
 * khác giữa câu văn**. Một patch ghi `aspects.ban_nga.coreSelf` sẽ sửa tính cách
 * nhân vật mà không có Event nào giải thích — đúng thứ 69.1 tồn tại để cấm.
 *
 * Vì vậy: mặc định là TỪ CHỐI. Chỉ đường dẫn được kể tên mới lọt.
 */
import { PatchOpSchema } from '../contracts/core.js';
import type { PatchOp } from '../contracts/core.js';
import { EVENT_DUOC_SUA_CORESELF } from '../schema/aspect/thanVi.js';
import { chuanHoaBanGhiMoi } from './chuanHoaBanGhi.js';
import { bieuThucKhoi, bieuThucCatKhoi, docKhoiCapNhat } from './mvu.js';
import type { BienPackDoi } from './mvu.js';

export type PatchBiTuChoi = {
  readonly ma:
    'JSON_HONG' | 'KHONG_PHAI_MANG' | 'SAI_SCHEMA' | 'BANG_CAM' | 'DUONG_DAN_CAM' | 'ENTITY_LA' | 'QUA_NHIEU';
  readonly thongDiep: string;
  /** Nguyên văn thứ bị từ chối — vào bảng Tự Chẩn Đoán, không vào world. */
  readonly nguyenVan: string;
};

/** Một phục bút model khai đã gieo — [BB] 30.2, engine mới là nơi giữ sổ. */
export type PhucButKhai = {
  readonly noiDung: string;
  readonly loai: string;
};

export type KetQuaBocTach = {
  /** Văn xuôi đã cắt hết khối dữ liệu — thứ duy nhất hiện lên khung kể. */
  readonly loiKe: string;
  /** Patch đã qua cả ba lớp. Người gọi vẫn phải đưa chúng qua `apDungEvent`. */
  readonly patches: readonly PatchOp[];
  readonly biTuChoi: readonly PatchBiTuChoi[];
  /** Model có gửi khối `<CapNhat>` không — phân biệt "không đổi gì" với "xuất hỏng". */
  readonly coKhoiCapNhat: boolean;
  /**
   * [BB] 30.2 — thứ Narrator vừa gieo. Engine ghi vào Sổ Phục Bút và tự đặt hạn;
   * model KHÔNG được tự khai hạn, vì hạn là thứ quyết định khi nào ống kính bị
   * kéo về đây, tức là một quyết định gameplay.
   */
  readonly phucBut: readonly PhucButKhai[];
  /**
   * [BB] 54.10 — khẳng định về quá khứ không đối chiếu được.
   *
   * Chúng KHÔNG bị xóa. Chúng thành ứng viên Term (Phần 14) và ứng viên gap
   * `nhan_qua`. "Thế giới không phạt AI vì bịa. Nó biến chỗ bịa thành một câu
   * hỏi chưa có lời đáp" — đúng nguyên tắc 4.
   */
  readonly chuaChungThuc: readonly string[];
  /**
   * Thay đổi thuộc namespace `preset.<packId>` — 66.6, tương thích thẻ bài MVU.
   *
   * [BB] Chúng KHÔNG phải patch. Người gọi ghi chúng vào kho biến của pack, và
   * không có đường nào từ danh sách này tới `WorldState`. Đó là điều làm một thẻ
   * bài MVU chạy được ở đây mà vẫn không tự viết lại thế giới.
   */
  readonly bienPack: readonly BienPackDoi[];
};

/**
 * Bảng trắng: bảng nào model được chạm.
 *
 * `worlds` vắng mặt có chủ ý — tầng chơi, chủ thể và `setupCompleted` là chuyện
 * của người chơi, không của người kể chuyện.
 */
const BANG_CHO_PHEP = new Set(['entities', 'links', 'gaps', 'prayers']);

/**
 * Đường dẫn model KHÔNG được chạm, dù ở bảng cho phép.
 *
 * Khớp theo tiền tố sau khi chuẩn hóa, nên chặn được cả `...coreSelf.tuBi_tanNhan`
 * lẫn `...coreSelf`.
 */
const DUONG_DAN_CAM: readonly { mau: string; vi: string }[] = Object.freeze([
  {
    mau: 'aspects.ban_nga.coreSelf',
    vi: `Lõi bản ngã chỉ đổi qua Event thuộc ${EVENT_DUOC_SUA_CORESELF.join(', ')} — 69.1.`,
  },
  { mau: 'aspects.ban_nga.lichSuLoi', vi: 'Lịch sử đổi lõi là bằng chứng, không phải chỗ ghi thêm.' },
  { mau: 'aspects.domain.domains', vi: 'Sức domain do quy kết của engine quyết, không do lời kể — 78.7.' },
  { mau: 'goc', vi: 'Gốc bế tắc của lời cầu do utility AI sinh, không được viết lại — 22.2.' },
  { mau: 'version', vi: 'Số phiên bản bản ghi là của transaction.' },
  { mau: 'branchId', vi: 'Nhánh không đổi bằng lời kể.' },
  { mau: 'id', vi: 'Định danh không đổi bằng lời kể.' },
  { mau: 'tickSinh', vi: 'Thời điểm sinh là lịch sử.' },
  { mau: 'aspects.lawful.vanBan', vi: 'Văn bản luật gốc chỉ đổi qua kết tinh luật — 43.1.' },
]);

/** Nhiều hơn ngần này trong một lượt là model đang tự viết lại thế giới. */
const TRAN_PATCH_MOT_LUOT = 12;

const KHOI = bieuThucKhoi();
const KHOI_PHUC_BUT = /<Foreshadow>([\s\S]*?)<\/Foreshadow>/i;
const KHOI_CHUA_CHUNG = /<Unverified>([\s\S]*?)<\/Unverified>/i;

/**
 * Cắt MỌI khối dữ liệu khỏi văn xuôi.
 *
 * Ba khối, và cả ba đều phải cắt cả dạng chưa đóng thẻ: model bị cắt cụt giữa
 * khối sẽ để lại một thẻ mở, và một thẻ mở lọt lên khung kể trông đúng như một
 * lỗi hiển thị — trong khi nó là bằng chứng `finish_reason = 'length'` mà 34.3
 * đang muốn ta nhìn thấy ở chỗ khác.
 */
function catKhoi(raw: string): string {
  return (
    raw
      .replace(bieuThucCatKhoi(), '')
      .replace(/<Foreshadow>[\s\S]*?<\/Foreshadow>/gi, '')
      .replace(/<Unverified>[\s\S]*?<\/Unverified>/gi, '')
      .replace(/<(?:CapNhat|UpdateVariable|Foreshadow|Unverified)>[\s\S]*$/i, '')
      // [BB] 63.6 + luật bất biến — chuỗi suy luận không hiển thị và không lưu.
      .replace(/<(thinking|think|reasoning)>[\s\S]*?<\/\1>/gi, '')
      .replace(/```[a-z]*\n?/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function thanKhoi(raw: string, re: RegExp): string | null {
  const k = re.exec(raw);
  if (!k || k[1] === undefined) return null;
  return k[1]
    .trim()
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/```$/i, '')
    .trim();
}

/** Bóc `<Foreshadow>`. Hỏng cú pháp là chuyện thường — trả rỗng, không throw. */
function bocPhucBut(raw: string): readonly PhucButKhai[] {
  const than = thanKhoi(raw, KHOI_PHUC_BUT);
  if (than === null) return [];
  try {
    const doc = JSON.parse(than) as { muc?: unknown };
    if (!Array.isArray(doc.muc)) return [];
    const ra: PhucButKhai[] = [];
    for (const m of doc.muc.slice(0, TRAN_PHUC_BUT_MOT_LUOT)) {
      const o = m as { noiDung?: unknown; loai?: unknown };
      if (typeof o.noiDung !== 'string' || o.noiDung.trim() === '') continue;
      ra.push({
        noiDung: o.noiDung.trim().slice(0, 300),
        loai: typeof o.loai === 'string' ? o.loai : 'dieu_bao',
      });
    }
    return Object.freeze(ra);
  } catch {
    return [];
  }
}

/** Bóc `<Unverified>`. Cùng lẽ: hỏng thì coi như model không khai gì. */
function bocChuaChungThuc(raw: string): readonly string[] {
  const than = thanKhoi(raw, KHOI_CHUA_CHUNG);
  if (than === null) return [];
  try {
    const doc = JSON.parse(than) as { muc?: unknown };
    if (!Array.isArray(doc.muc)) return [];
    return Object.freeze(
      doc.muc
        .filter((x): x is string => typeof x === 'string' && x.trim() !== '')
        .slice(0, TRAN_PHUC_BUT_MOT_LUOT)
        .map((x) => x.trim().slice(0, 300)),
    );
  } catch {
    return [];
  }
}

/** Nhiều hơn ngần này là model đang rải lời hứa thay vì kể chuyện. */
const TRAN_PHUC_BUT_MOT_LUOT = 6;

function duongDanCam(path: string): string | null {
  const p = path.trim();
  if (p === '') return null;
  for (const { mau, vi } of DUONG_DAN_CAM) {
    if (p === mau || p.startsWith(`${mau}.`) || p.endsWith(`.${mau}`)) return vi;
  }
  return null;
}

export type NgocCanhBocTach = {
  readonly eventId: string;
  /** Id entity đang tồn tại — patch trỏ ra ngoài tập này bị từ chối. */
  readonly idHopLe: ReadonlySet<string>;
  /**
   * Nhánh đang chơi. Bản ghi mới bị ÉP về nhánh này.
   *
   * Model không được chọn nhánh — cùng lẽ với `sourceEventId`: để nó tự khai là
   * mở cửa cho nó ghi sang một dòng thời gian khác. Bỏ trống thì bản ghi nhận
   * `branchId` rỗng và bất biến `entity_dung_nhanh` bắt được ngay.
   */
  readonly branchId?: string;
};

/**
 * Bóc một phản hồi thô thành lời kể + patch đã được duyệt.
 *
 * Hàm này KHÔNG throw. Model hỏng là chuyện thường ngày, không phải sự cố lập
 * trình; mọi thứ hỏng đi vào `biTuChoi` để bảng Tự Chẩn Đoán đếm được.
 */
export function bocTach(raw: string, nc: NgocCanhBocTach): KetQuaBocTach {
  const loiKe = catKhoi(raw);
  const phucBut = bocPhucBut(raw);
  const chuaChungThuc = bocChuaChungThuc(raw);
  const khop = KHOI.exec(raw);
  if (!khop || khop[1] === undefined) {
    return Object.freeze({
      loiKe,
      patches: Object.freeze([]),
      biTuChoi: Object.freeze([]),
      coKhoiCapNhat: false,
      phucBut,
      chuaChungThuc,
      bienPack: Object.freeze([]),
    });
  }

  const than = khop[1]
    .trim()
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/```$/i, '')
    .trim();
  const biTuChoi: PatchBiTuChoi[] = [];

  /*
   * Ba dạng khối, một đường ra — xem `mvu.ts`.
   *
   * `docKhoiCapNhat()` chỉ CHUẨN HÓA cú pháp. Nó không cấp thẩm quyền cho ai:
   * mọi ứng viên nó trả về vẫn phải đi hết ba lớp bên dưới, và thứ không trỏ
   * tới thực thể có thật thì thành biến pack chứ không thành patch.
   */
  const kqDoc = docKhoiCapNhat(than, nc.idHopLe);
  if (kqDoc === null) {
    return Object.freeze({
      loiKe,
      patches: Object.freeze([]),
      biTuChoi: Object.freeze([
        {
          ma: 'JSON_HONG' as const,
          thongDiep: 'Khối cập nhật không phải JSON hợp lệ và cũng không có câu lệnh nào đọc được.',
          nguyenVan: than.slice(0, 400),
        },
      ]),
      coKhoiCapNhat: true,
      phucBut,
      chuaChungThuc,
      bienPack: Object.freeze([]),
    });
  }

  const tho = kqDoc.tho;
  for (const b of kqDoc.boQua) {
    biTuChoi.push({ ma: 'SAI_SCHEMA', thongDiep: b.vi, nguyenVan: b.nguyenVan });
  }

  const ra: PatchOp[] = [];
  for (const [i, item] of tho.entries()) {
    const nguyenVan = JSON.stringify(item).slice(0, 300);

    if (ra.length >= TRAN_PATCH_MOT_LUOT) {
      biTuChoi.push({
        ma: 'QUA_NHIEU',
        thongDiep: `Một lượt kể chỉ được đổi tối đa ${TRAN_PATCH_MOT_LUOT} chỗ; phần từ #${i + 1} trở đi bị bỏ.`,
        nguyenVan,
      });
      break;
    }

    // Lớp 2 — hình dạng. `sourceEventId` do ta gán, không nhận từ model:
    // để model tự khai nguồn là mở cửa cho nó gắn thay đổi vào Event của người khác.
    const ung = { ...(item as Record<string, unknown>), sourceEventId: nc.eventId };
    delete (ung as { expectedVersion?: unknown }).expectedVersion;

    const kq = PatchOpSchema.safeParse(ung);
    if (!kq.success) {
      biTuChoi.push({
        ma: 'SAI_SCHEMA',
        thongDiep: kq.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; '),
        nguyenVan,
      });
      continue;
    }
    const p = kq.data;

    // Lớp 3 — thẩm quyền.
    if (!BANG_CHO_PHEP.has(p.target.table)) {
      biTuChoi.push({
        ma: 'BANG_CAM',
        thongDiep: `Lời kể không được ghi vào bảng "${p.target.table}".`,
        nguyenVan,
      });
      continue;
    }
    const vi = duongDanCam(p.target.path);
    if (vi !== null) {
      biTuChoi.push({ ma: 'DUONG_DAN_CAM', thongDiep: vi, nguyenVan });
      continue;
    }
    // Tạo bản ghi mới thì id chưa tồn tại là đúng; sửa bản ghi thì id phải có thật.
    if (p.op !== 'link' && !nc.idHopLe.has(p.target.id)) {
      biTuChoi.push({
        ma: 'ENTITY_LA',
        thongDiep: `"${p.target.id}" không có trong thế giới người chơi đang thấy.`,
        nguyenVan,
      });
      continue;
    }

    /*
     * Lớp 2b — CHUẨN HÓA bản ghi mới. Xem `chuanHoaBanGhi.ts`.
     *
     * `PatchOpSchema` khai `value` là `unknown`, nên tới đây một bản ghi mới vẫn
     * chưa được ai kiểm. Bỏ bước này thì `"mortal": {"tuoiTho": 60}` — một câu
     * hoàn toàn hợp lý với người đọc — đi thẳng vào `WorldState` với `thanThe`
     * là `undefined`, và bất biến tầng Phàm Nhân nổ `TypeError` ở lượt sau.
     *
     * Model **làm treo được engine** cho tới khi bước này có mặt.
     */
    if (p.op === 'link') {
      const ch = chuanHoaBanGhiMoi(p.target.table, p.value, nc.branchId ?? '');
      if (!ch.ok) {
        biTuChoi.push({ ma: 'SAI_SCHEMA', thongDiep: ch.vi, nguyenVan });
        continue;
      }
      for (const c of ch.canhBao) {
        biTuChoi.push({ ma: 'SAI_SCHEMA', thongDiep: c, nguyenVan });
      }
      ra.push({ ...p, value: ch.value });
      continue;
    }

    ra.push(p);
  }

  return Object.freeze({
    loiKe,
    patches: Object.freeze(ra),
    biTuChoi: Object.freeze(biTuChoi),
    coKhoiCapNhat: true,
    phucBut,
    chuaChungThuc,
    bienPack: Object.freeze([...kqDoc.bienPack]),
  });
}

/** Tỉ lệ patch trượt — mục 27 bảng Tự Chẩn Đoán (46.2), hỏng khi > 15%. */
export function tyLeTruot(kq: KetQuaBocTach): number {
  const tong = kq.patches.length + kq.biTuChoi.length;
  return tong === 0 ? 0 : kq.biTuChoi.length / tong;
}
