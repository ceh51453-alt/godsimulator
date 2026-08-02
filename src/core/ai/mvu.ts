/**
 * Tương thích khối cập nhật kiểu MVU — Phần 31.7, 50.6, 66.6 [BB].
 *
 * ── Vì sao file này tồn tại ──
 *
 * Dòng thẻ bài MVU của SillyTavern chơi bằng một vòng lặp rất cụ thể: thẻ bài
 * khai một bộ biến trạng thái, model xuất một khối `<UpdateVariable>` mỗi lượt,
 * extension áp khối ấy rồi vẽ lại bảng trạng thái. Người chơi quen lối ấy mong
 * đợi đúng ba thứ: **một khối cập nhật mỗi lượt**, **một bảng đọc được ngay**,
 * và **con số thay đổi có lý do**.
 *
 * Thiên Diễn đã có cả ba, chỉ khác tên: khối `<CapNhat>` của 31.7, Bảng Thiên
 * Diễn của Phần 55, và Event/Patch làm lý do. Cái thiếu là **cú pháp**: một thẻ
 * bài MVU viết `<UpdateVariable>` chứ không viết `<CapNhat>`, và viết
 * `_.set('đường.dẫn', cũ, mới)` chứ không viết một mảng `patches`.
 *
 * ── Ranh giới KHÔNG được nhòe ──
 *
 * Nhận cú pháp của họ **không** phải là nhận thẩm quyền của họ.
 *
 * Mọi thứ file này dựng ra vẫn đi qua đúng ba lớp của `bocTach()`: schema, bảng
 * trắng, đường dẫn cấm. Cú pháp MVU không mở thêm một cánh cửa nào.
 *
 * Và quan trọng hơn: trong MVU, biến của thẻ bài **là** trạng thái trò chơi. Ở
 * đây thì không — [BB] 66.6 xếp "Macro biến" về namespace `preset.<packId>`, và
 * [BB] luật bất biến #5 nói preset không ghi thẳng World. Nên đường dẫn nào
 * không trỏ tới một thực thể có thật sẽ thành **biến của pack**: nó hiện lên
 * bảng, nó sống qua save, nó vào được prompt lượt sau — và nó không đổi một
 * dòng nào trong `WorldState`.
 *
 * Đó là lý do một thẻ bài MVU chạy được ở đây mà vẫn không tự viết lại thế giới.
 */

/** Thẻ nào được coi là khối cập nhật — 31.7 dùng tên thứ hai. */
export const THE_KHOI_CAP_NHAT = ['CapNhat', 'UpdateVariable'] as const;

export type BienPackDoi = Readonly<{
  duong: string;
  giaTri: unknown;
  /** Toán tử: `set` là mặc định, `add` cộng dồn — op quan trọng nhất của 50.6. */
  phep: 'set' | 'add' | 'push';
  /** Ghi chú model viết sau `//`. Vào chẩn đoán, không vào World. */
  lyDo: string;
}>;

export type KetQuaDocKhoi = Readonly<{
  /** Ứng viên patch, dạng thô — người gọi vẫn phải cho qua schema và bảng trắng. */
  tho: readonly unknown[];
  /** Thay đổi thuộc về namespace pack, KHÔNG thuộc về World. */
  bienPack: readonly BienPackDoi[];
  /** Cú pháp nhận ra được nhưng không dùng được, kèm lý do đọc được. */
  boQua: readonly { readonly nguyenVan: string; readonly vi: string }[];
}>;

/** Bắt cả hai thẻ, cả dạng chưa đóng — model bị cắt cụt để lại một thẻ mở. */
export function bieuThucKhoi(): RegExp {
  return new RegExp(
    `<(?:${THE_KHOI_CAP_NHAT.join('|')})>([\\s\\S]*?)</(?:${THE_KHOI_CAP_NHAT.join('|')})>`,
    'i',
  );
}

export function bieuThucCatKhoi(): RegExp {
  return new RegExp(
    `<(?:${THE_KHOI_CAP_NHAT.join('|')})>[\\s\\S]*?</(?:${THE_KHOI_CAP_NHAT.join('|')})>`,
    'gi',
  );
}

// ─────────────────────────────────────────── đường dẫn

/**
 * Tách một đường dẫn thành đích ghi của engine.
 *
 * Trả `null` nghĩa là đường dẫn KHÔNG trỏ tới thứ gì trong thế giới — và đó là
 * trường hợp thường gặp nhất với thẻ bài MVU, vì `stat_data.主角.好感度` là biến
 * của thẻ bài chứ không phải một thực thể.
 *
 * Khớp id theo tiền tố DÀI NHẤT: id trong Thiên Diễn có thể chứa dấu chấm
 * (`e.chu_the`), nên cắt ở dấu chấm đầu tiên sẽ hỏng. Thử từ dài xuống ngắn cho
 * kết quả đúng ở cả hai kiểu id mà không cần một quy ước đặt tên nào.
 */
export function phanGiaiDuongDan(
  duong: string,
  idHopLe: ReadonlySet<string>,
): { table: string; id: string; path: string } | null {
  const sach = duong.trim().replace(/^\$\./, '');
  if (sach === '') return null;

  const BANG_KHAI_TRUOC = ['entities', 'links', 'gaps', 'prayers', 'storylines'];
  for (const bang of BANG_KHAI_TRUOC) {
    if (!sach.startsWith(`${bang}.`)) continue;
    const con = sach.slice(bang.length + 1);
    const khop = khopId(con, idHopLe);
    if (khop !== null) return { table: bang, id: khop.id, path: khop.path };
    // Khai rõ bảng nhưng id lạ: vẫn trả về để lớp thẩm quyền từ chối CÓ LÝ DO,
    // thay vì để nó trôi thành một biến pack im lặng.
    const cat = con.indexOf('.');
    return cat < 0
      ? { table: bang, id: con, path: '' }
      : { table: bang, id: con.slice(0, cat), path: con.slice(cat + 1) };
  }

  // `e.<id>.<path>` của 31.7, và dạng trần `<id>.<path>`.
  const khongTienTo = sach.startsWith('e.') ? sach.slice(2) : sach;
  for (const ung of [sach, khongTienTo]) {
    const khop = khopId(ung, idHopLe);
    if (khop !== null && khop.path !== '') return { table: 'entities', id: khop.id, path: khop.path };
  }
  return null;
}

function khopId(s: string, idHopLe: ReadonlySet<string>): { id: string; path: string } | null {
  const phan = s.split('.');
  for (let k = phan.length; k >= 1; k--) {
    const ung = phan.slice(0, k).join('.');
    if (idHopLe.has(ung)) return { id: ung, path: phan.slice(k).join('.') };
  }
  return null;
}

// ─────────────────────────────────────────── giá trị

type OpVaGiaTri = { op: string; value: unknown };

/** `{_op, _v}` của 31.7; mọi thứ khác là một phép `set` thẳng. */
function docGiaTri(v: unknown): OpVaGiaTri {
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if (typeof o['_op'] === 'string') return { op: o['_op'], value: o['_v'] };
  }
  return { op: 'set', value: v };
}

const PHEP_PACK = new Set(['set', 'add', 'push']);

// ─────────────────────────────────────────── đọc khối

/**
 * Đọc thân khối cập nhật ở cả ba dạng.
 *
 * ```text
 * 1. {"patches":[ … ]}                     native
 * 2. {"e.than.soul.x": {"_op":"add",…}}    bản đồ đường dẫn của 31.7
 * 3. _.set('path', cũ, mới); // lý do      câu lệnh kiểu MVU
 * ```
 *
 * Dạng 3 được đọc bằng biểu thức chính quy trên VĂN BẢN. Không `eval`, không
 * `new Function`, không dựng hàm — đó là luật bất biến #10, và một thẻ bài là
 * dữ liệu không tin cậy dù nó trông giống JavaScript đến đâu.
 */
export function docKhoiCapNhat(than: string, idHopLe: ReadonlySet<string>): KetQuaDocKhoi | null {
  const sach = than
    .trim()
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/```$/i, '')
    .trim();
  if (sach === '') return { tho: [], bienPack: [], boQua: [] };

  let doc: unknown = undefined;
  try {
    doc = JSON.parse(sach);
  } catch {
    doc = undefined;
  }

  if (doc !== undefined) return tuJson(doc, idHopLe);
  const cauLenh = tuCauLenh(sach, idHopLe);
  // Không phải JSON và cũng không có câu lệnh nào đọc được: đây là khối hỏng
  // thật, và người gọi cần biết để đếm vào tỉ lệ patch trượt (46.2).
  return cauLenh === null ? null : cauLenh;
}

function tuJson(doc: unknown, idHopLe: ReadonlySet<string>): KetQuaDocKhoi {
  if (Array.isArray(doc)) return { tho: doc, bienPack: [], boQua: [] };

  if (doc !== null && typeof doc === 'object') {
    const o = doc as Record<string, unknown>;
    if (Array.isArray(o['patches'])) return { tho: o['patches'], bienPack: [], boQua: [] };

    const tho: unknown[] = [];
    const bienPack: BienPackDoi[] = [];
    const boQua: { nguyenVan: string; vi: string }[] = [];

    for (const [duong, raw] of Object.entries(o)) {
      // [BB] 31.7 — field bắt đầu bằng `_` (trừ `_op`, `_v`) là engine-only.
      if (duong.startsWith('_')) {
        boQua.push({ nguyenVan: duong, vi: 'Tên bắt đầu bằng dấu gạch dưới là trường riêng của engine.' });
        continue;
      }
      const { op, value } = docGiaTri(raw);
      const dich = phanGiaiDuongDan(duong, idHopLe);
      if (dich === null) {
        bienPack.push({
          duong,
          giaTri: value,
          phep: PHEP_PACK.has(op) ? (op as BienPackDoi['phep']) : 'set',
          lyDo: '',
        });
        continue;
      }
      tho.push({ op, target: dich, value });
    }
    return { tho, bienPack, boQua };
  }

  return {
    tho: [],
    bienPack: [],
    boQua: [{ nguyenVan: String(doc), vi: 'Khối cập nhật không phải đối tượng.' }],
  };
}

/** `_.set('a.b', cũ, mới);` · `_.set('a.b', mới)` · `_.add('a.b', 5)` */
const CAU_LENH = /_\.(set|add|push|insert)\s*\(([\s\S]*?)\)\s*;?/g;

function tuCauLenh(s: string, idHopLe: ReadonlySet<string>): KetQuaDocKhoi | null {
  const tho: unknown[] = [];
  const bienPack: BienPackDoi[] = [];
  const boQua: { nguyenVan: string; vi: string }[] = [];
  let coCauLenh = false;

  CAU_LENH.lastIndex = 0;
  for (const khop of s.matchAll(CAU_LENH)) {
    coCauLenh = true;
    const nguyenVan = khop[0].slice(0, 200);
    const ham = khop[1] ?? 'set';
    const doiSo = tachDoiSo(khop[2] ?? '');
    if (doiSo.length < 2) {
      boQua.push({ nguyenVan, vi: 'Câu lệnh thiếu đối số đường dẫn hoặc giá trị.' });
      continue;
    }

    const duong = docChuoi(doiSo[0] as string);
    if (duong === null) {
      boQua.push({ nguyenVan, vi: 'Đối số đầu tiên phải là một đường dẫn dạng chuỗi.' });
      continue;
    }

    /*
     * MVU viết `_.set(đường, cũ, mới)`. Giá trị THẬT là đối số cuối; đối số giữa
     * là giá trị model tin rằng đang có. Ta không dùng nó để so: engine mới là
     * nơi giữ sổ (71.5), và tin vào "giá trị cũ" do model khai là tự nguyện tin
     * một nguồn không có thẩm quyền.
     */
    const cuoi = doiSo[doiSo.length - 1] as string;
    const giaTri = docGiaTriVan(cuoi);
    const op = ham === 'add' ? 'add' : ham === 'push' || ham === 'insert' ? 'push' : 'set';
    const lyDo = docLyDo(s, khop.index ?? 0, khop[0].length);

    const dich = phanGiaiDuongDan(duong, idHopLe);
    if (dich === null) {
      bienPack.push({ duong, giaTri, phep: op as BienPackDoi['phep'], lyDo });
      continue;
    }
    tho.push({ op, target: dich, value: giaTri });
  }

  return coCauLenh ? { tho, bienPack, boQua } : null;
}

/** Cắt theo dấu phẩy CẤP NGOÀI CÙNG, tôn trọng ngoặc và chuỗi. */
function tachDoiSo(s: string): string[] {
  const ra: string[] = [];
  let sau = 0;
  let dem = '';
  let nhay: string | null = null;

  for (let i = 0; i < s.length; i++) {
    const c = s[i] as string;
    if (nhay !== null) {
      dem += c;
      if (c === '\\') {
        const kt = s[i + 1];
        if (kt !== undefined) {
          dem += kt;
          i++;
        }
        continue;
      }
      if (c === nhay) nhay = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      nhay = c;
      dem += c;
      continue;
    }
    if (c === '[' || c === '{' || c === '(') sau++;
    if (c === ']' || c === '}' || c === ')') sau--;
    if (c === ',' && sau === 0) {
      ra.push(dem.trim());
      dem = '';
      continue;
    }
    dem += c;
  }
  if (dem.trim() !== '') ra.push(dem.trim());
  return ra;
}

function docChuoi(s: string): string | null {
  const t = s.trim();
  if (t.length < 2) return null;
  const dau = t[0];
  if ((dau === '"' || dau === "'" || dau === '`') && t[t.length - 1] === dau) {
    return t.slice(1, -1).replace(/\\(['"`\\])/g, '$1');
  }
  return null;
}

/** Đọc một giá trị viết bằng cú pháp JS đơn giản. Không đọc được thì giữ NGUYÊN VĂN. */
function docGiaTriVan(s: string): unknown {
  const t = s.trim();
  const chuoi = docChuoi(t);
  if (chuoi !== null) return chuoi;
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null' || t === 'undefined') return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  try {
    // JSON hợp lệ (mảng, đối tượng) thì dùng luôn; nháy đơn thì đổi sang nháy kép.
    return JSON.parse(t.replace(/'/g, '"')) as unknown;
  } catch {
    return t;
  }
}

/** Ghi chú `// …` ngay sau câu lệnh — MVU dùng nó để giải thích thay đổi. */
function docLyDo(s: string, batDau: number, dai: number): string {
  const sau = s.slice(batDau + dai);
  const khop = /^[ \t]*\/\/[ \t]*(.*)/.exec(sau);
  return khop?.[1]?.trim().slice(0, 200) ?? '';
}
