/**
 * Sổ Tay — Phần 56.1, 56.2 [BB].
 *
 * > "Ở `pham_nhan`, Bảng Thiên Diễn **không phải là bản rút gọn**. Nó bị thay
 * > bằng một màn hình khác về bản chất: trang giấy của chính nhân vật."
 *
 * ── Bốn quy tắc, và chỗ mỗi quy tắc được cưỡng chế ──
 *
 * 1. **Không con số hệ thống.** Tuổi, số nợ, số lần làm lễ thì được — một người
 *    thật đếm được chúng. `trongSo`, `yeuGhet` bằng số, `dienTich` ký ức thì
 *    không. Cưỡng chế: file này **chỉ nhận `WorldView`**, và `chieu()` đã xóa
 *    những trường ấy khỏi đối tượng. Cộng thêm `quetSoRo()` để test soi lại.
 * 2. **Luật hiện dưới dạng `dienGiai` của vùng mình, kèm chỗ nó sai.**
 * 3. **Tin đồn ghi kèm độ tin** — lấy thẳng từ số chặng của `bopMeo()`.
 * 4. **Quan hệ ghi bằng `anTuong`**, không bằng bốn trục.
 *
 * ── Vì sao đây là màn hình quan trọng nhất của cả trò chơi ──
 *
 * Cùng một database, cùng một tick: ở tầng Sáng Thế "Ô Uế" là một định luật có
 * hiệu lực 94%; ở đây nó là *"đao phủ phải ở ngoài thành, và ta đã làm lễ ấy chín
 * lần, chưa lần nào thấy khác đi"*. Toàn bộ luận điểm của trò chơi nằm gọn trên
 * một trang giấy.
 */
import type { WorldView, ProjectedEntity } from '../contracts/view.js';
import type { KnowledgeRow } from '../schema/soSach.js';
import type { Mortal } from '../schema/aspect/living.js';
import type { SinhKe, CanCuoc } from '../schema/aspect/pham.js';
import { NHAN_BAC_NGHE, nhanNghe } from '../schema/aspect/pham.js';
import type { QuanHeMotChieu, Soul } from '../schema/aspect/soul.js';
import { thanTheKeLai } from './thanThe.js';
import { nhanViec } from './lich.js';

export type DongQuen = {
  readonly ten: string;
  readonly xungHo: string;
  /** [BB] 56.2 quy tắc 4 — câu chữ, không phải bốn trục. */
  readonly anTuong: string;
  readonly laHuyenThoai: boolean;
};

export type DongTin = {
  readonly noiDung: string;
  /** "nghe qua ba miệng", "không rõ từ đâu" — quy tắc 3. */
  readonly doTin: string;
};

export type DongMuon = {
  readonly noiDung: string;
  readonly xong: boolean;
};

export type SoTay = {
  /** "Ta là Ankhtu, con thứ của thợ nhuộm Sanu, ở Thebes." */
  readonly moDau: readonly string[];
  readonly than: readonly string[];
  readonly quen: readonly DongQuen[];
  readonly tin: readonly string[];
  readonly nghe: readonly DongTin[];
  readonly muon: readonly DongMuon[];
  /** Việc đang làm lúc này — từ lịch, không từ một trường trạng thái. */
  readonly dangLam: string;
};

const SO_TAY_RONG: SoTay = Object.freeze({
  moDau: Object.freeze(['Trang này còn trắng.']),
  than: Object.freeze([]),
  quen: Object.freeze([]),
  tin: Object.freeze([]),
  nghe: Object.freeze([]),
  muon: Object.freeze([]),
  dangLam: '',
});

function doc<T>(e: ProjectedEntity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a && typeof a === 'object' ? (a as T) : undefined;
}

/** Số chặng → câu người ta thật sự nói. Quy tắc 3 của 56.2. */
export function doTinTheoChang(hops: number, nguon: string): string {
  if (hops <= 0) return 'ta thấy tận mắt';
  if (hops === 1) return `${nguon === '' ? 'có người' : nguon} kể lại`;
  if (hops === 2) return 'nghe qua hai miệng';
  if (hops === 3) return 'nghe qua ba miệng';
  return 'không rõ từ đâu';
}

export type NguLieuSoTay = {
  readonly view: WorldView;
  /** Đã lọc sẵn về đúng `knowerId === view.chuTheId`. */
  readonly triThuc: readonly KnowledgeRow[];
  /** Việc đang làm lúc này, lấy từ `lich.dangODau()`. */
  readonly viecDangLam: string;
  /** Số lần đã làm một nghi thức mà không thấy khác đi — 56.2 quy tắc 2. */
  readonly nghiThucVoIch: readonly { ten: string; soLan: number }[];
};

/**
 * Dựng Sổ Tay.
 *
 * [BB] Tham số là `WorldView`. Không có đường nào từ đây tới `World` thô, nên
 * "không lộ số engine" là chuyện KIỂU DỮ LIỆU, không phải chuyện cẩn thận.
 */
export function dungSoTay(ng: NguLieuSoTay): SoTay {
  const { view } = ng;
  const toi = view.chuTheId ? view.entities.get(view.chuTheId) : undefined;
  if (!toi) return SO_TAY_RONG;

  const m = doc<Mortal>(toi, 'mortal');
  const sk = doc<SinhKe>(toi, 'sinh_ke');
  const cc = doc<CanCuoc>(toi, 'can_cuoc');
  const soul = doc<Soul>(toi, 'soul');

  // ── mở đầu ──
  const moDau: string[] = [];
  const nghe = sk?.ngheId ? `${NHAN_BAC_NGHE[sk.bac]} nghề ${nhanNghe(sk.ngheId)}` : null;
  moDau.push(`Ta là ${toi.ten}${nghe ? `, ${nghe}` : ''}.`);
  if (m) {
    // Tuổi là thứ một người thật đếm được — quy tắc 1 cho phép.
    const band =
      m.ageBand === 'child'
        ? 'Ta còn nhỏ.'
        : m.ageBand === 'youth'
          ? 'Ta còn trẻ.'
          : m.ageBand === 'elder'
            ? 'Ta đã già.'
            : 'Ta đang tuổi làm lụng.';
    moDau.push(band);
  }
  if (cc && cc.phapLy !== 'tu_do') {
    moDau.push(
      cc.phapLy === 'dang_bi_truy'
        ? 'Có người đang tìm ta.'
        : cc.phapLy === 'dang_chiu_an'
          ? 'Ta đang chịu án.'
          : cc.phapLy === 'bi_luu_day'
            ? 'Ta không được về nhà nữa.'
            : 'Ta không hoàn toàn là người tự do.',
    );
  }

  // ── thân ──
  const than = [...thanTheKeLai(m)];
  // Số đấu nợ là thứ đếm được, nên nó ở lại — quy tắc 1.
  const noChua = (m?.boiVu ?? []).filter((b) => b.status === 'active');
  if (noChua.length === 1) than.push(`Còn một điều chưa làm xong: ${noChua[0]?.description}`);
  else if (noChua.length > 1) than.push(`Còn ${noChua.length} điều đã hứa mà chưa làm.`);

  // ── người ta quen ──
  // [BB] quy tắc 4: `anTuong` là câu, không phải bốn trục. Trục không đi ra đây.
  const quen: DongQuen[] = [];
  for (const [id, qhTho] of Object.entries(soul?.quanHe ?? {})) {
    if (id.startsWith('__')) continue;
    const qh = qhTho as QuanHeMotChieu;
    const kia = view.entities.get(id);
    if (!kia) continue; // không thấy được thì không nhớ được
    quen.push({
      ten: kia.ten,
      xungHo: qh.xungHo,
      anTuong: qh.anTuong,
      laHuyenThoai: qh.laHuyenThoai,
    });
  }
  quen.sort((a, b) => (a.ten < b.ten ? -1 : 1));

  // ── điều ta tin ──
  // [BB] quy tắc 2: bản DIỄN GIẢI của vùng mình, kèm chỗ nó sai.
  const tin: string[] = [];
  for (const l of view.laws.slice(0, 6)) {
    if (l.dienGiai.trim() === '') continue;
    tin.push(l.dienGiai);
  }
  for (const nt of ng.nghiThucVoIch) {
    if (nt.soLan <= 0) continue;
    tin.push(
      `Ta đã làm ${nt.ten} ${nt.soLan} lần. ${nt.soLan >= 3 ? 'Chưa lần nào thấy khác đi.' : 'Chưa rõ có ăn thua không.'}`,
    );
  }

  // ── điều ta nghe được ──
  const dsNghe: DongTin[] = [];
  for (const r of [...ng.triThuc].sort((a, b) => b.learnedAtTick - a.learnedAtTick).slice(0, 8)) {
    const nguon = r.source.sourceId ? (view.entities.get(r.source.sourceId)?.ten ?? '') : '';
    dsNghe.push({ noiDung: r.proposition, doTin: doTinTheoChang(r.source.hops, nguon) });
  }

  // ── điều ta muốn ──
  const muon: DongMuon[] = (m?.mucTieuDoiNguoi ?? []).map((g) => ({ noiDung: g, xong: false }));
  if (sk?.thayId) {
    const thay = view.entities.get(sk.thayId);
    muon.push({ noiDung: `Học cho xong nghề của ${thay?.ten ?? 'thầy'}.`, xong: false });
  }

  return Object.freeze({
    moDau: Object.freeze(moDau),
    than: Object.freeze(than),
    quen: Object.freeze(quen),
    tin: Object.freeze(tin),
    nghe: Object.freeze(dsNghe),
    muon: Object.freeze(muon),
    dangLam: nhanViec(ng.viecDangLam),
  });
}

/**
 * Khóa engine mà Sổ Tay KHÔNG được chứa — [BB] 56.2 quy tắc 1.
 *
 * Danh sách này là nguồn chân lý cho cả test lẫn người đọc. Nó cố tình gồm cả
 * những khóa mà `chieu()` đã lọc: nếu một ngày ai đó nới lỏng `chieu()`, cổng
 * này vẫn bắt được trước khi con số lên màn hình.
 */
export const KHOA_ENGINE_CAM: readonly string[] = Object.freeze([
  'trongSo',
  'thieuHut',
  'tyLeMac',
  'cohort',
  'suyThoai',
  'deDoa',
  'domainStrength',
  'suc',
  'hienThanh',
  'doLechDiHoa',
  'dienTich',
  'yeuGhet',
  'thanSo',
  'tinNgo',
  'agency',
  'sinhLuc',
  'theLuc',
  'doDoi',
  'kyThuat',
  'duocNhoBoi',
]);

/**
 * Soi một Sổ Tay đã dựng, trả về những khóa engine bị rò.
 *
 * Rỗng nghĩa là sạch. Dùng trong test của cổng Phase 7 ("UI không lộ số engine")
 * và dùng được cả trong bảng Tự Chẩn Đoán.
 */
export function quetSoRo(s: SoTay): readonly string[] {
  const van = [
    ...s.moDau,
    ...s.than,
    ...s.tin,
    ...s.muon.map((x) => x.noiDung),
    ...s.nghe.map((x) => `${x.noiDung} ${x.doTin}`),
    ...s.quen.map((x) => `${x.ten} ${x.xungHo} ${x.anTuong}`),
    s.dangLam,
  ].join('\n');

  const ro: string[] = [];
  for (const k of KHOA_ENGINE_CAM) {
    if (van.includes(k)) ro.push(k);
  }
  return Object.freeze(ro);
}
