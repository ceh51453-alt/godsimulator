/**
 * Rule parser cho input tự do — Phần 67.2, 67.4; cổng Phase 4.
 *
 * [BB] "Rule parser trước, model parser adapter sau." Đây là đường OFFLINE chuẩn:
 * nó phải hiểu được câu tiếng Việt thường mà KHÔNG cần LLM.
 *
 * [BB] 17.2 — Không bao giờ trả "không hiểu yêu cầu". Parser luôn trả về một Intent;
 * nếu không chắc thì `confidence` thấp và UI hỏi lại, chứ không dựng tường.
 */
import { IntentSchema } from './schema.js';
import type { Intent, Horizon } from './schema.js';
import type { WorldView } from '../contracts/view.js';
import type { ViewMode, EntityRef } from '../contracts/primitives.js';

/** Bỏ dấu tiếng Việt để khớp từ khóa mà không phụ thuộc cách gõ. */
export function boDau(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

type LuatDongTu = {
  /** Từ khóa (đã bỏ dấu) gợi ý động từ/hành động này. */
  tuKhoa: readonly string[];
  /** `R.action` id hoặc `R.verb` id. */
  ref: string;
  nguon: 'action' | 'verb';
  horizon?: Horizon;
};

/**
 * Bảng mồi. [BB] 67.1 — đây là MỒI, không phải allowlist: câu không khớp bảng này
 * vẫn tạo được Intent (đường ứng biến 17.2).
 */
const BANG_MOI: readonly LuatDongTu[] = [
  // ── sáu động từ Sáng Thế ──
  { tuKhoa: ['tach', 'tach * lam', 'phan chia', 'chia doi', 'phan ra'], ref: 'phan', nguon: 'verb' },
  { tuKhoa: ['hop nhat', 'gop', 'nhap lai', 'hoa lam mot'], ref: 'hop', nguon: 'verb' },
  { tuKhoa: ['tao ra', 'sinh ra', 'tao nen', 'khai sinh', 'dung nen', 'hien'], ref: 'hien', nguon: 'verb' },
  {
    tuKhoa: ['xoa', 'xoa so', 'thu ve', 'thu * ve', 'thu hoi', 'thu lai', 'huy diet', 'diet'],
    ref: 'thu',
    nguon: 'verb',
  },
  {
    tuKhoa: ['ban luat', 'dinh doat', 'troi buoc', 'ap dat', 'ra luat', 'nguyen rua', 'chuc phuc'],
    ref: 'dinh',
    nguon: 'verb',
  },
  { tuKhoa: ['buong', 'tha ra', 'go bo', 'giai phong'], ref: 'buong', nguon: 'verb' },

  // ── R.action ──
  { tuKhoa: ['lam viec', 'lao dong', 'di lam', 'kiem song'], ref: 'lam_viec', nguon: 'action' },
  { tuKhoa: ['cau nguyen', 'khan', 'cau xin', 'van xin'], ref: 'cau_nguyen', nguon: 'action' },
  {
    tuKhoa: ['di den', 'di toi', 'roi khoi', 'len duong', 'di doc', 'di ra', 'tro ve'],
    ref: 'di_chuyen',
    nguon: 'action',
  },
  {
    tuKhoa: ['noi chuyen', 'hoi', 'ke cho', 'thuyet phuc', 'ban bac', 'thuong luong'],
    ref: 'noi_chuyen',
    nguon: 'action',
  },
  { tuKhoa: ['hoc', 'tim hieu', 'nghien cuu', 'tap'], ref: 'hoc', nguon: 'action' },
  { tuKhoa: ['doi', 'mua', 'ban', 'trao doi', 'buon'], ref: 'trao_doi', nguon: 'action' },
  { tuKhoa: ['lam le', 'cung', 'te', 'nghi le'], ref: 'lam_nghi_le', nguon: 'action' },
  {
    tuKhoa: ['chong lai', 'phan khang', 'noi day', 'khang cu', 'tu choi'],
    ref: 'phan_khang',
    nguon: 'action',
  },
];

/** Dấu hiệu tầm nhìn dài — quyết định Intent thành Project hay hành động tức thời. */
const DAU_HIEU_DAI: readonly { tuKhoa: readonly string[]; horizon: Horizon }[] = [
  { tuKhoa: ['ca doi', 'suot doi', 'muon doi', 'vinh vien', 'mai mai'], horizon: 'era' },
  { tuKhoa: ['nhieu nam', 'hang nam', 'moi nam', 'nam sau'], horizon: 'year' },
  { tuKhoa: ['mua sau', 'mua toi', 'qua mua'], horizon: 'season' },
  { tuKhoa: ['ngay mai', 'hom sau', 'moi ngay'], horizon: 'day' },
];

/**
 * Việc lớn không thể xong trong một câu — Phần 68.1.
 * Những từ này báo hiệu một TIẾN TRÌNH, không phải một thao tác.
 */
const DAU_HIEU_PROJECT: readonly string[] = [
  'xay',
  'dung len',
  'mo lo',
  'mo quan',
  'mo tiem',
  'lap',
  'thanh lap',
  'hoc nghe',
  'tim nguon',
  'hoa giai',
  'thong nhat',
  'khien hai',
  'viet bo',
  'bo luat',
  'mot bo',
  'tao coi',
  'gay dung',
  'chinh phuc',
  'cai tao',
  // Tranh đoạt domain là chiến dịch nhiều đời, không phải một nước đi (Phần 19.2).
  'gianh lay',
  'tranh doat',
  'doat lay',
  'doi lai',
  'tra thu',
  // Giao ước, hòa giải, đòi lại: đều là thương lượng nhiều bước (Phần 68.4).
  'ky giao uoc',
  'giao uoc',
  'lien minh',
  'nhan nuoi',
  // Cải cách giáo lý, viết lại sử: thương lượng nhiều bên, nhiều bước (Phần 68.4).
  'giao ly',
  'viet lai',
  // Truyền nghề, học một lối sống: tiến trình theo thời gian truyện.
  'day * lam',
  'hoc cach',
  // Đời người: cưới, gom góp, xin vào phường hội, gây lại vườn, tìm người thất lạc.
  'cuoi',
  'gom gop',
  'xin vao',
  'trong lai',
  'tim em',
  'tim nguoi',
];

const DAU_HIEU_BI_MAT: readonly string[] = ['bi mat', 'len len', 'giau', 'khong ai biet', 'am tham'];
const DAU_HIEU_TRANH_HAI: readonly string[] = ['khong lam hai', 'khong giet', 'nhe nhang', 'tranh do mau'];
const DAU_HIEU_CHAP_HAI: readonly string[] = ['bang moi gia', 'du phai', 'giet', 'pha huy', 'thieu rui'];

/**
 * Tách câu thành từ. Khớp theo TỪ, không theo chuỗi con — bỏ dấu xong thì
 * "thứ" và "thu", "khởi" và "hoi" trùng nhau, nên khớp chuỗi con báo nhầm liên tục.
 */
function tach(s: string): string[] {
  return s.split(/[^a-z0-9]+/).filter((x) => x.length > 0);
}

/**
 * Khớp một mẫu từ khóa lên danh sách từ.
 * Mẫu là dãy từ cách nhau bởi khoảng trắng; `*` nghĩa là "cách vài từ cũng được",
 * cho phép bắt "thu vị thần đó VỀ" bằng mẫu `thu * ve`.
 */
function khopMau(tu: readonly string[], mau: string): boolean {
  const phan = mau.split(' ').filter((x) => x.length > 0);
  if (phan.length === 0) return false;

  for (let batDau = 0; batDau < tu.length; batDau++) {
    let i = batDau;
    let ok = true;
    let choPhepNhay = false;

    for (const p of phan) {
      if (p === '*') {
        choPhepNhay = true;
        continue;
      }
      if (choPhepNhay) {
        // Tìm `p` trong vài từ kế tiếp (giới hạn 6 từ để không bắt bừa cả câu).
        let thay = -1;
        for (let j = i; j < Math.min(tu.length, i + 6); j++) {
          if (tu[j] === p) {
            thay = j;
            break;
          }
        }
        if (thay < 0) {
          ok = false;
          break;
        }
        i = thay + 1;
        choPhepNhay = false;
        continue;
      }
      if (tu[i] !== p) {
        ok = false;
        break;
      }
      i++;
    }
    if (ok) return true;
  }
  return false;
}

function chua(s: string, tuKhoa: readonly string[]): boolean {
  const tu = tach(s);
  return tuKhoa.some((t) => khopMau(tu, t));
}

/**
 * Tìm entity được nhắc tới trong câu.
 * [BB] Chỉ khớp trên `view.entities` — thứ chủ thể ĐƯỢC PHÉP BIẾT.
 * Không bao giờ khớp trên World thật, nếu không đây thành đường rò rỉ.
 */
export function timMucTieu(cau: string, view: WorldView): EntityRef[] {
  const s = boDau(cau);
  const ra: EntityRef[] = [];
  const daCo = new Set<string>();

  // Ưu tiên tên dài trước, để "Bờ Sông Mê" không bị "Sông" nuốt mất.
  const ds = [...view.entities.values()].sort((a, b) => b.ten.length - a.ten.length);

  for (const e of ds) {
    if (e.ten.length < 2) continue;
    const ten = boDau(e.ten);
    const khop = s.includes(ten) || e.aliases.some((a) => a.length >= 2 && s.includes(boDau(a)));
    if (!khop || daCo.has(e.id)) continue;
    daCo.add(e.id);
    ra.push({ id: e.id, kind: e.kind, label: e.ten });
    if (ra.length >= 5) break;
  }
  return ra;
}

export type ThamSoParse = {
  id: string;
  branchId: string;
  sceneId: string | null;
  actorId: string;
  mode: ViewMode;
  view: WorldView;
};

/**
 * Parse một câu tự do thành Intent.
 *
 * [BB] LUÔN trả về một Intent. `confidence` thấp là tín hiệu để UI hỏi lại,
 * KHÔNG phải lý do từ chối.
 */
export function parseIntent(rawText: string, ts: ThamSoParse): Intent {
  const cau = rawText.trim();
  const s = boDau(cau);

  // ── động từ ──
  const doan = refDoanDuoc(cau);
  const ref = doan.ref;

  // ── tầm nhìn ──
  let horizon: Horizon = 'scene';
  for (const d of DAU_HIEU_DAI) {
    if (chua(s, d.tuKhoa)) {
      horizon = d.horizon;
      break;
    }
  }
  const laProject = chua(s, DAU_HIEU_PROJECT);
  if (laProject && horizon === 'scene') horizon = 'season';

  // ── thái độ ──
  const secrecy = chua(s, DAU_HIEU_BI_MAT) ? 'secret' : 'open';
  const harm = chua(s, DAU_HIEU_TRANH_HAI) ? 'avoid' : chua(s, DAU_HIEU_CHAP_HAI) ? 'allow' : 'minimize';
  const risk = chua(s, DAU_HIEU_CHAP_HAI) ? 'embrace' : 'accept';

  const targetRefs = timMucTieu(cau, ts.view);

  /**
   * Độ tin cậy phản ánh mức parser NẮM ĐƯỢC câu, không phản ánh mức khả thi.
   * Câu rỗng thì 0; có động từ và mục tiêu rõ thì cao.
   */
  let confidence = 0.25;
  if (cau.length === 0) confidence = 0;
  else {
    if (ref !== '') confidence += 0.35;
    if (targetRefs.length > 0) confidence += 0.25;
    if (cau.length > 12) confidence += 0.1;
    confidence = Math.min(1, Math.round(confidence * 100) / 100);
  }

  // `method` giữ phần câu sau từ "bằng"/"qua" nếu có — người chơi thường nêu cách ở đó.
  const mMethod = /(?:\bbằng cách\b|\bbằng\b|\bqua\b|\bthông qua\b)\s+(.{3,120})/i.exec(cau);
  const method = mMethod?.[1]?.trim() ?? '';

  return IntentSchema.parse({
    id: ts.id,
    branchId: ts.branchId,
    sceneId: ts.sceneId,
    actorId: ts.actorId,
    mode: ts.mode,
    rawText: cau,
    goal: cau,
    targetRefs,
    method,
    constraints: [],
    horizon,
    stance: { secrecy, risk, harm },
    parsedBy: 'rule',
    confidence,
  });
}

/** Người chơi sửa lại Intent trong UI — đánh dấu `user_corrected`. */
export function suaIntent(
  goc: Intent,
  sua: Partial<Pick<Intent, 'goal' | 'targetRefs' | 'method' | 'horizon'>>,
): Intent {
  return IntentSchema.parse({
    ...goc,
    ...sua,
    // [BB] rawText BẤT BIẾN — người chơi sửa cách hiểu, không sửa điều đã nói.
    rawText: goc.rawText,
    parsedBy: 'user_corrected',
    confidence: 1,
  });
}

/** Động từ/hành động parser đoán được, để affordance collector dùng lại. */
export function refDoanDuoc(rawText: string): { ref: string; nguon: 'action' | 'verb' | '' } {
  const tu = tach(boDau(rawText));
  let ref = '';
  let nguon: 'action' | 'verb' | '' = '';
  let dai = 0;
  for (const luat of BANG_MOI) {
    for (const t of luat.tuKhoa) {
      // Mẫu nhiều từ thắng mẫu một từ: câu càng khớp cụ thể thì càng đáng tin.
      const soTu = t.split(' ').filter((x) => x !== '*').length;
      if (soTu > dai && khopMau(tu, t)) {
        dai = soTu;
        ref = luat.ref;
        nguon = luat.nguon;
      }
    }
  }
  return { ref, nguon };
}

export function laDauHieuProject(rawText: string): boolean {
  return chua(boDau(rawText), DAU_HIEU_PROJECT);
}
