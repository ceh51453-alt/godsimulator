/**
 * Sổ Hậu Trường — chỗ thế giới cất những gì nó đã làm khi không ai nhìn.
 *
 * ── Lỗ hổng file này bịt ──
 *
 * Đường ống Workflow của 50.9 mô phỏng bảy thứ mỗi lần chạy: ai đang có mặt, NPC
 * làm gì, mạch truyện đi nhịp nào, thời cục ra sao, lỗ hổng nào vừa được giải,
 * sổ sách đổi bao nhiêu, luật nào vừa kết tinh. Nó chạy, nó tốn tiền, và rồi
 * **output của nó đi vào ngữ cảnh của giai đoạn sau rồi biến mất**. Người chơi
 * không bao giờ đọc được một dòng nào trong đó.
 *
 * Đó là vi phạm thẳng ADR-0028: *thế giới không được phép đi tiếp mà người chơi
 * không đọc được*. Và nó là vi phạm tệ nhất trong các kiểu, vì nó tốn tiền để
 * tạo ra đúng thứ rồi vứt đi.
 *
 * Sổ này là chỗ chứa. Mỗi thứ đường ống mô phỏng ra thành một **ghi chú chưa
 * kể**; chúng nằm đó cho tới khi Narrator dệt được chúng vào chính văn, rồi mới
 * đóng dấu `daKe`.
 *
 * ── Vì sao là hàng đợi chứ không phải một khối văn ──
 *
 * Vì nhịp kể. Một lần mô phỏng đẻ ra hai chục điều; nhét cả hai chục vào lượt kể
 * kế tiếp cho ra một bản tin, không phải một cảnh. Hàng đợi cho phép mỗi lượt
 * lấy hai ba điều — người chơi biết thế giới đang động đậy, và biết dần dần,
 * đúng cách người ta biết về một nơi mình đang sống.
 *
 * ── Vì sao nằm trong `World` ──
 *
 * Cùng lẽ với `tuVung`: một danh sách đơn nhất theo NHÁNH. Nó vào `stateHash`,
 * xuống đĩa cùng ván, phân nhánh cùng nhánh. Hai nhánh tách từ một gốc sẽ có hai
 * quá khứ hậu trường khác nhau, và đó là điều đúng.
 */
import { z } from 'zod';
import { veSinhNhanh } from '../anToan/veSinh.js';

// ─────────────────────────────────────────── kiểu

/**
 * Năm loại chuyện hậu trường.
 *
 * Chia loại không phải để phân loại cho đẹp: Narrator dệt một quy luật mới vào
 * cảnh theo cách khác hẳn cách nó dệt một hành động của NPC, và nhãn là thứ nói
 * cho nó biết đang cầm cái gì.
 */
export const LOAI_HAU_TRUONG = ['quy_luat', 'nhan_vat', 'hanh_dong', 'mach_truyen', 'the_gioi'] as const;
export type LoaiHauTruong = (typeof LOAI_HAU_TRUONG)[number];

export const NHAN_LOAI_HAU_TRUONG: Readonly<Record<LoaiHauTruong, string>> = Object.freeze({
  quy_luat: 'quy luật vừa hiện ra',
  nhan_vat: 'người vừa có mặt',
  hanh_dong: 'ai đó vừa làm gì',
  mach_truyen: 'mạch truyện đi một nhịp',
  the_gioi: 'thế giới chuyển mình',
});

export const GhiChuHauTruongSchema = z
  .object({
    id: z.string().min(1),
    /** Nhịp thế giới lúc chuyện này xảy ra — Narrator cần biết nó cũ tới đâu. */
    tick: z.number().int().min(0),
    loai: z.enum(LOAI_HAU_TRUONG),
    /** Một câu kể được, không phải một dòng log. */
    noiDung: z.string().min(1).max(400),
    /** Thực thể liên quan — để Narrator gọi đúng tên thay vì gọi bằng id. */
    entityIds: z.array(z.string()).prefault([]),
    /** Tác vụ nào của đường ống sinh ra nó. Vào chẩn đoán, không vào prompt. */
    nguon: z.string().prefault(''),
    /** Đã được dệt vào chính văn chưa. `false` là hàng đang xếp hàng chờ kể. */
    daKe: z.boolean().prefault(false),
  })
  .strict();

export type GhiChuHauTruong = z.infer<typeof GhiChuHauTruongSchema>;

/**
 * Trần sổ.
 *
 * Nhỏ hơn trần Kho Từ rất nhiều, và cố ý: từ vựng là vốn liếng lâu dài, còn ghi
 * chú hậu trường là tin tức. Một chuyện chưa kể từ ba trăm nhịp trước không còn
 * đáng kể — nó chỉ làm hàng đợi dài ra và đẩy chuyện vừa xảy ra xuống dưới.
 */
export const TRAN_SO_HAU_TRUONG = 240;

/** Bao nhiêu ghi chú được dệt vào MỘT lượt kể. Xem chú thích đầu file. */
export const GHI_CHU_MOI_LUOT = 3;

// ─────────────────────────────────────────── đọc và ghi

/**
 * Đọc sổ ra khỏi `World`, và ĐÂY là chỗ hình dạng thật được kiểm.
 *
 * Cùng hợp đồng với `docKho()`: `WorldSchema.hauTruong` khai `unknown[]` vì tầng
 * `contracts/` không được biết tới tầng `world/`. Hàng hỏng bị BỎ chứ không làm
 * sập lượt — một dòng sai định dạng trong file save của người khác không đáng để
 * mất cả ván.
 */
export function docSo(hauTruongThuong: readonly unknown[]): readonly GhiChuHauTruong[] {
  const ra: GhiChuHauTruong[] = [];
  for (const x of hauTruongThuong) {
    const p = GhiChuHauTruongSchema.safeParse(x);
    if (p.success) ra.push(p.data);
  }
  return ra;
}

/** Khóa so trùng — thường hóa và gộp khoảng trắng, để một câu không vào sổ hai lần. */
function khoa(noiDung: string): string {
  return noiDung.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Thêm ghi chú vào sổ, giữ trần.
 *
 * Khi đầy, thứ bị bỏ là **ghi chú ĐÃ KỂ cũ nhất** — không phải ghi chú cũ nhất.
 * Khác biệt ấy là toàn bộ điểm của hàng đợi: một chuyện đã lên chính văn thì đã
 * xong việc của nó, còn một chuyện chưa kể mà bị đẩy ra khỏi sổ là một chuyện
 * thế giới đã làm và không ai từng biết.
 *
 * Chỉ khi sổ đầy toàn hàng chưa kể thì mới bỏ cái cũ nhất — và lúc ấy nó đúng là
 * tin cũ.
 */
export function themGhiChu(
  so: readonly GhiChuHauTruong[],
  moi: readonly GhiChuHauTruong[],
  tran = TRAN_SO_HAU_TRUONG,
): readonly GhiChuHauTruong[] {
  if (moi.length === 0) return so;

  const daCo = new Set(so.map((x) => khoa(x.noiDung)));
  const daCoId = new Set(so.map((x) => x.id));
  const ra = [...so];
  for (const g of moi) {
    const k = khoa(g.noiDung);
    if (k === '' || daCo.has(k) || daCoId.has(g.id)) continue;
    daCo.add(k);
    daCoId.add(g.id);
    ra.push(g);
  }

  if (ra.length <= tran) return ra;
  const thua = ra.length - tran;
  const boDi = new Set<string>();
  for (const g of ra) {
    if (boDi.size >= thua) break;
    if (g.daKe) boDi.add(g.id);
  }
  for (const g of ra) {
    if (boDi.size >= thua) break;
    boDi.add(g.id);
  }
  return ra.filter((g) => !boDi.has(g.id));
}

/**
 * Vài ghi chú tiếp theo đáng kể, cũ trước mới sau.
 *
 * Cũ trước vì hàng đợi này là một dòng thời gian: kể chuyện tuần trước sau
 * chuyện hôm nay thì người đọc mất mốc. Trong cùng một nhịp thì theo id, để hai
 * máy cùng state đưa cho model cùng một danh sách (luật bất biến #7).
 */
export function chuaKe(
  so: readonly GhiChuHauTruong[],
  soLuong = GHI_CHU_MOI_LUOT,
): readonly GhiChuHauTruong[] {
  return so
    .filter((g) => !g.daKe)
    .sort((a, b) => (a.tick !== b.tick ? a.tick - b.tick : a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, Math.max(0, soLuong));
}

/** Đóng dấu đã kể. Trả mảng MỚI — không sửa mảng vào, cùng lẽ với `ketNapTu()`. */
export function danhDauDaKe(
  so: readonly GhiChuHauTruong[],
  ids: readonly string[],
): readonly GhiChuHauTruong[] {
  if (ids.length === 0) return so;
  const can = new Set(ids);
  return so.map((g) => (can.has(g.id) && !g.daKe ? { ...g, daKe: true } : g));
}

export type ThongKeSo = {
  readonly tong: number;
  readonly chuaKe: number;
  readonly tran: number;
  readonly theoLoai: Readonly<Record<LoaiHauTruong, number>>;
};

export function thongKeSo(so: readonly GhiChuHauTruong[], tran = TRAN_SO_HAU_TRUONG): ThongKeSo {
  const theoLoai = { quy_luat: 0, nhan_vat: 0, hanh_dong: 0, mach_truyen: 0, the_gioi: 0 };
  let chua = 0;
  for (const g of so) {
    theoLoai[g.loai]++;
    if (!g.daKe) chua++;
  }
  return { tong: so.length, chuaKe: chua, tran, theoLoai };
}

// ─────────────────────────────────────────── bóc output tác vụ

/**
 * Tác vụ nào nói về chuyện gì.
 *
 * Bảng này ánh xạ bảy tác vụ của 50.9 sang năm loại ghi chú. Id lạ — tác vụ do
 * người dùng tự dựng — rơi về `the_gioi`: một câu chuyện về thế giới là mặc định
 * an toàn nhất, vì nó không hứa với Narrator điều gì cụ thể.
 */
const LOAI_THEO_TAC_VU: Readonly<Record<string, LoaiHauTruong>> = Object.freeze({
  sang_loc_hien_dien: 'nhan_vat',
  hanh_dong_npc: 'hanh_dong',
  nhip_mach_truyen: 'mach_truyen',
  thoi_cuc_the_gioi: 'the_gioi',
  giai_lo_hong: 'the_gioi',
  so_sach_chi_so: 'the_gioi',
  ket_tinh_thanh_tra: 'quy_luat',
});

export function loaiCuaTacVu(taskId: string): LoaiHauTruong {
  return LOAI_THEO_TAC_VU[taskId] ?? 'the_gioi';
}

/** Trường nào trong một object JSON là phần KỂ ĐƯỢC, theo thứ tự ưu tiên. */
const TRUONG_KE_DUOC = ['hanhDong', 'noiDung', 'moTa', 'tomTat', 'bienNien', 'tin', 'text', 'lyDo'] as const;

/** Trường nào trỏ tới một thực thể. */
const TRUONG_ID = ['id', 'entityId', 'mucId', 'gapId', 'chuTheId'] as const;

function laObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Cắt lấy phần JSON nếu có; trả `undefined` khi output là văn xuôi thuần.
 *
 * ── Vì sao thứ tự thử là theo VỊ TRÍ, không theo loại ngoặc ──
 *
 * Bản đầu thử `[…]` trước rồi mới `{…}`, và nó đọc sai đúng hình dạng mà tác vụ
 * "Hành động NPC" trả về: `{"id":"nv","hanhDong":"…","patch":[]}`. Chuỗi ấy có
 * một cặp ngoặc vuông bên trong, nên phép cắt `[` đầu tới `]` cuối cho ra `[]` —
 * một mảng rỗng **parse thành công**. Hàm trả về một giá trị hợp lệ, người gọi
 * tin nó, và ba mươi call mỗi lượt quét đẻ ra đúng không câu nào.
 *
 * Ngoặc nào MỞ TRƯỚC thì ngoặc ấy là ngoặc ngoài cùng. Thử nó trước, và chỉ rơi
 * sang ngoặc kia khi nó không parse được.
 */
function thuDocJson(tho: string): unknown {
  const s = tho.replace(/```[a-z]*/gi, '').trim();
  const cap = [
    ['[', ']'],
    ['{', '}'],
  ] as const;
  const ungVien = cap
    .map(([mo, dong]) => ({ dau: s.indexOf(mo), cuoi: s.lastIndexOf(dong) }))
    .filter((x) => x.dau >= 0 && x.cuoi > x.dau)
    .sort((a, b) => a.dau - b.dau);

  for (const x of ungVien) {
    try {
      return JSON.parse(s.slice(x.dau, x.cuoi + 1));
    } catch {
      continue;
    }
  }
  return undefined;
}

/** Một object JSON thành một câu, cộng những id nó nhắc tới. */
function tuObj(o: Record<string, unknown>): { cau: string; ids: string[] } | null {
  for (const truong of TRUONG_KE_DUOC) {
    const v = o[truong];
    if (typeof v !== 'string' || v.trim() === '') continue;
    const ids: string[] = [];
    for (const t of TRUONG_ID) {
      const x = o[t];
      if (typeof x === 'string' && x.trim() !== '') ids.push(x.trim());
    }
    return { cau: v.trim(), ids };
  }
  return null;
}

/**
 * Bóc output một tác vụ thành ghi chú kể được.
 *
 * ── Vì sao rộng lượng tới mức này ──
 *
 * Bảy tác vụ dựng sẵn trả về ba hình dạng khác nhau (mảng JSON, object JSON, văn
 * xuôi), và một preset do người dùng tự dựng có thể trả về bất cứ hình dạng nào
 * khác nữa. Từ chối những gì không đúng khuôn nghĩa là người chơi trả tiền cho
 * một call rồi không nhận được gì — trong khi thứ họ cần chỉ là **một câu tiếng
 * Việt kể được**, và câu ấy nằm ngay trong output dù nó gói thế nào.
 *
 * Hàm KHÔNG throw. Không đọc ra gì thì trả mảng rỗng, và người gọi ghi nhận đó
 * là một tác vụ không nói được gì — đúng thứ bảng chẩn đoán 50.12 muốn đếm.
 */
export function bocGhiChu(
  taskId: string,
  output: string,
  tick: number,
  gioiHan = 6,
): readonly GhiChuHauTruong[] {
  const sach = veSinhNhanh(output, 20_000).trim();
  if (sach === '') return [];

  const loai = loaiCuaTacVu(taskId);
  const cau: { cau: string; ids: string[] }[] = [];

  const nhat = (json: unknown): void => {
    if (Array.isArray(json)) {
      for (const x of json) {
        if (!laObj(x)) continue;
        const c = tuObj(x);
        if (c !== null) cau.push(c);
      }
      return;
    }
    if (!laObj(json)) return;
    const c = tuObj(json);
    if (c !== null) cau.push(c);
    // Một object bọc quanh một mảng — `{"muc":[...]}`, `{"hanhDong":[...]}`.
    for (const v of Object.values(json)) {
      if (!Array.isArray(v)) continue;
      for (const x of v) {
        if (!laObj(x)) continue;
        const cc = tuObj(x);
        if (cc !== null) cau.push(cc);
      }
    }
  };

  /*
   * Thử TỪNG KHỐI trước, cả output sau.
   *
   * `cachGop: 'noi'` nối kết quả của họ bản sao bằng một dòng trắng, nên output
   * của "Hành động NPC" là ba mươi object JSON dán liền nhau — một chuỗi mà
   * `JSON.parse` từ chối, và mà bộ đọc văn xuôi cũng từ chối vì mỗi dòng mở
   * bằng `{`. Kết quả: tác vụ quan trọng nhất của 50.9 chạy ba mươi call rồi
   * không rút ra được một câu nào. Đọc theo khối bịt đúng chỗ đó.
   *
   * Cả-output vẫn được thử sau, vì một mảng JSON in đẹp có dòng trắng bên trong
   * sẽ không khối nào parse được — lúc ấy phép đọc toàn khối mới đúng.
   */
  for (const khoi of sach.split(/\n{2,}/)) {
    const j = thuDocJson(khoi);
    if (j !== undefined) nhat(j);
  }
  if (cau.length === 0) nhat(thuDocJson(sach));

  /*
   * Không đọc được JSON thì đọc như văn xuôi.
   *
   * Tách theo DÒNG chứ không theo dấu chấm: tác vụ thời cục viết một bản tin
   * nhiều đoạn, và cắt nó ở mỗi dấu chấm sẽ cho ra hai chục mẩu cụt không mẩu
   * nào kể được. Dòng quá ngắn bị bỏ vì chúng thường là tiêu đề hoặc rác rào.
   */
  if (cau.length === 0) {
    for (const dong of sach.split(/\n+/)) {
      const d = dong.replace(/^[-*\d.)\s]+/, '').trim();
      if (d.length < 12) continue;
      if (/^[[{}\]]/.test(d)) continue;
      cau.push({ cau: d, ids: [] });
    }
  }

  const ra: GhiChuHauTruong[] = [];
  const daCo = new Set<string>();
  for (const c of cau) {
    if (ra.length >= gioiHan) break;
    const noiDung = c.cau.replace(/\s+/g, ' ').trim().slice(0, 400);
    const k = khoa(noiDung);
    if (noiDung === '' || daCo.has(k)) continue;
    daCo.add(k);
    /*
     * Id dựng từ (nhịp, tác vụ, số thứ tự) — deterministic, và không đụng id nào
     * đã có vì `nhịp` luôn tăng. Không dùng đồng hồ máy: luật bất biến #7 cấm,
     * và một id mang giờ máy sẽ làm hai lần replay cho hai `stateHash` khác nhau.
     */
    ra.push(
      GhiChuHauTruongSchema.parse({
        id: `ht_${tick}_${taskId}_${ra.length}`,
        tick: Math.max(0, Math.floor(tick)),
        loai,
        noiDung,
        entityIds: c.ids.slice(0, 6),
        nguon: taskId,
      }),
    );
  }
  return ra;
}
