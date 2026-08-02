/**
 * bopMeo — Phần 19.1 [BB].
 *
 * "`bopMeo()` không phải làm mơ hồ. Nó phải SAI CÓ CẤU TRÚC: tên bị đổi, số phóng
 *  đại theo hướng có lợi cho phe kể, động cơ gán nhầm, thời gian dồn lại.
 *  Mức méo tăng theo số chặng truyền, giảm theo `triThuc` người kể."
 *
 * [BB] Deterministic: cùng (nội dung, chặng, triThuc, seed) cho cùng bản méo.
 * Không `Math.random()`, không thời gian máy.
 */
import { taoRng } from '../engine/rng.js';

export type ThamSoMeo = {
  /** Số chặng đã truyền. 0 = chứng kiến trực tiếp. */
  chang: number;
  /** Tri thức của người kể, 0–100. Cao thì méo ít. */
  triThuc: number;
  /** Phe kể có lợi khi phóng đại theo hướng nào. */
  thienVi: 'phong_dai' | 'giam_nhe' | 'trung_lap';
  seed: string;
};

/** Mức méo 0–1. Tăng theo chặng, giảm theo tri thức. */
export function mucMeo(chang: number, triThuc: number): number {
  if (chang <= 0) return 0;
  const theoChang = 1 - Math.pow(0.72, chang);
  const giamBoiTriThuc = 1 - Math.min(100, Math.max(0, triThuc)) / 160;
  return Math.min(1, theoChang * giamBoiTriThuc);
}

/** Biến thể tên: rút gọn, đổi âm, hoặc thay bằng danh hiệu. */
export function meoTen(ten: string, ts: ThamSoMeo): string {
  const m = mucMeo(ts.chang, ts.triThuc);
  if (m < 0.2 || ten.length === 0) return ten;
  const rng = taoRng(`${ts.seed}|ten|${ten}|${ts.chang}|${ts.triThuc}`);

  const phan = ten.split(' ').filter((x) => x.length > 0);
  if (m >= 0.65 && phan.length > 1) {
    // Truyền xa: chỉ còn một mảnh tên, thường là phần cuối.
    return phan[phan.length - 1] as string;
  }
  if (m >= 0.4 && phan.length > 1) {
    // Đảo hoặc bỏ một thành phần.
    const bo = rng.nguyen(phan.length);
    const conLai = phan.filter((_, i) => i !== bo);
    return conLai.join(' ');
  }
  // Méo nhẹ: thêm tiền tố truyền miệng.
  const tienTo = ['Kẻ gọi là ', 'Người ta gọi ', 'Cái tên nghe được là '];
  return `${tienTo[rng.nguyen(tienTo.length)] as string}${ten}`;
}

/** Số bị phóng đại hoặc giảm nhẹ theo hướng có lợi cho phe kể. */
export function meoSo(so: number, ts: ThamSoMeo): number {
  const m = mucMeo(ts.chang, ts.triThuc);
  if (m === 0) return so;
  const rng = taoRng(`${ts.seed}|so|${so}|${ts.chang}`);
  // Biên độ tối đa gấp ba khi méo tối đa.
  const bienDo = 1 + m * 2;
  const huong = ts.thienVi === 'phong_dai' ? 1 : ts.thienVi === 'giam_nhe' ? -1 : rng.co(0.5) ? 1 : -1;
  const heSo = huong > 0 ? 1 + (bienDo - 1) * rng.ke() : 1 / (1 + (bienDo - 1) * rng.ke());
  // Số truyền miệng luôn bị làm tròn thành số "kể được".
  const tho = so * heSo;
  return lamTronKeChuyen(tho, m);
}

/** Người kể chuyện không nói "1.847 người"; họ nói "gần hai nghìn". */
function lamTronKeChuyen(x: number, m: number): number {
  if (m < 0.3) return Math.round(x);
  const doLon = Math.max(1, Math.pow(10, Math.floor(Math.log10(Math.abs(x) || 1))));
  const buoc = m >= 0.6 ? doLon : doLon / 2;
  return Math.round(x / buoc) * buoc;
}

/** Thời gian bị dồn lại: "ba đời trước" thành "thuở xưa". */
export function meoThoiGian(tickCu: number, tickHienTai: number, ts: ThamSoMeo): string {
  const m = mucMeo(ts.chang, ts.triThuc);
  const cach = Math.max(0, tickHienTai - tickCu);
  if (m < 0.25) return `${cach} nhịp trước`;
  if (m < 0.5) return cach > 200 ? 'nhiều đời trước' : 'không lâu trước đây';
  if (m < 0.75) return 'thuở ông bà còn kể lại';
  return 'từ thời chưa ai nhớ nổi';
}

/** Động cơ bị gán nhầm — nguồn kịch tính chính của tầng Thần. */
export function meoDongCo(dongCoThat: string, ts: ThamSoMeo): string {
  const m = mucMeo(ts.chang, ts.triThuc);
  if (m < 0.35) return dongCoThat;
  const rng = taoRng(`${ts.seed}|dongco|${dongCoThat}|${ts.chang}`);
  const gan = [
    'vì giận dữ',
    'vì thương xót',
    'vì muốn thử lòng người',
    'vì một lời hứa cũ',
    'vì bị xúc phạm',
    'không ai biết vì sao',
  ];
  return gan[rng.nguyen(gan.length)] as string;
}

/**
 * Méo một đoạn văn bản mô tả.
 * [BB] Không cắt chữ thành dấu chấm lửng — đó là làm mơ hồ. Phải THAY bằng
 * một khẳng định khác, sai một cách có thể kiểm chứng được.
 */
export function meoMoTa(moTa: string, ts: ThamSoMeo): string {
  const m = mucMeo(ts.chang, ts.triThuc);
  if (m < 0.25 || moTa.length === 0) return moTa;
  const rng = taoRng(`${ts.seed}|mota|${moTa.length}|${ts.chang}`);

  const cau = moTa
    .split(/(?<=[.!?])\s+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (cau.length === 0) return moTa;

  if (m >= 0.7) {
    // Truyền xa: chỉ còn một câu, và nó được gắn thêm một khẳng định sai.
    const giu = cau[rng.nguyen(cau.length)] as string;
    const them = [
      'Người ta nói thêm rằng chuyện đó lặp lại mỗi mùa.',
      'Có kẻ quả quyết chính mắt mình đã thấy.',
      'Nghe đâu chuyện này còn liên quan tới một lời nguyền.',
    ];
    return `${giu} ${them[rng.nguyen(them.length)] as string}`;
  }
  if (m >= 0.45) {
    // Mất một câu, đảo thứ tự phần còn lại.
    const bo = rng.nguyen(cau.length);
    return rng.tron(cau.filter((_, i) => i !== bo)).join(' ');
  }
  return cau.join(' ');
}

/** Bản mô tả đã méo kèm ghi chú cho UI biết đây là tin đồn. */
export type BanMeo = {
  ten: string;
  moTa: string;
  mucMeo: number;
};

export function bopMeo(ten: string, moTa: string, ts: ThamSoMeo): BanMeo {
  return {
    ten: meoTen(ten, ts),
    moTa: meoMoTa(moTa, ts),
    mucMeo: mucMeo(ts.chang, ts.triThuc),
  };
}
