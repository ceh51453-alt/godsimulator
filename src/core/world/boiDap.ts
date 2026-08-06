/**
 * Bồi Đắp — thế giới tự hoàn thiện dần, Phần 47 nối 71.2 và 15.
 *
 * ── Vì sao module này tồn tại ──
 *
 * Mười hai tiến trình nền của 71.2 làm thế giới **chuyển động**: dân số lên
 * xuống, kho vơi đầy, mạch truyện đi nhịp. Nhưng chúng không làm thế giới
 * **dày lên**. Sau một trăm năm tua, số nơi chốn vẫn đúng bằng số nơi chốn lúc
 * đầu, không ai được gọi tên, và những vùng chưa có mô tả thì vĩnh viễn chỉ là
 * một cái id.
 *
 * Bồi Đắp là phần còn thiếu ấy: mỗi lượt, engine nhìn thế giới, tìm đúng chỗ nó
 * còn dở dang, rồi lấp một chỗ. Không nhiều — mỗi thợ có hạn mức, và hạn mức
 * nhỏ có chủ đích: một thế giới đầy lên trong ba lượt là một thế giới không ai
 * kịp nhớ.
 *
 * ── Ba luật của mọi thợ ở đây ──
 *
 * 1. **Không bịa của cải.** Cùng luật với `gieoNen`. Người mới không rơi từ
 *    trời xuống — họ được rút khỏi cohort của chính vùng ấy, và tổng dân số
 *    không đổi. Làng mới không mọc từ hư không — dân của nó là dân đã đi khỏi
 *    làng cũ, và `soCai.nhapCu`/`xuatCu` khớp nhau để `di_cu_bao_toan` vẫn đúng.
 *
 * 2. **Deterministic.** RNG lấy từ `rngCuaTick(seed, tick, kênh)`, mọi vòng lặp
 *    duyệt id đã sắp xếp. Cùng seed + cùng state ⇒ cùng kết quả — luật bất
 *    biến #7, và là điều kiện để replay còn nghĩa.
 *
 * 3. **Không LLM.** Cùng lẽ với 28.5: hai mươi bốn mạch truyện chạy song song
 *    mà tốn 0 đồng. Bồi Đắp chạy mỗi cuối lượt, nên nó phải rẻ như engine.
 *
 * ── Lằn ranh ──
 *
 * Module này chỉ TRẢ patch. Nó không áp gì. Người gọi cho patch đi qua
 * `locPatchTheoLanRanh()` rồi mới `apDungEvent()` — nghĩa là 47.4 vẫn cưỡng chế
 * trên từng patch, kể cả patch do chính engine sinh.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Rng } from '../engine/rng.js';
import { rngCuaTick } from '../engine/rng.js';
import type { Entity } from '../schema/entity.js';
import { EntitySchema, LinkSchema } from '../schema/entity.js';
import { SpatialSchema } from '../schema/aspect/living.js';
import { DuongSchema } from '../schema/aspect/substrate.js';
import type { DanCu, KinhTe, SinhThai, YTe } from '../schema/aspect/substrate.js';
import { nguonGoc } from '../schema/aspect/provenance.js';
import { aspectNen } from './gieoNen.js';
import { vatChatHoa } from './process/phanGiai.js';
import { chuanHoa, docKho, hocTuTheGioi, ketNapTu, TRAN_TU_VUNG } from './tuVung.js';
import type { TuVung, VaiTu } from './tuVung.js';

// ─────────────────────────────────────────── kiểu

export const THO_BOI_DAP = [
  'hoc_tu_moi',
  'khac_hoa_dia_danh',
  'goi_ten_nhan_vat',
  'mo_duong',
  'lap_lang_moi',
  'noi_lien_mo_coi',
] as const;
export type ThoBoiDap = (typeof THO_BOI_DAP)[number];

/** Nhãn người đọc được cho từng thợ — giao diện và báo cáo dùng chung bảng này. */
export const NHAN_THO: Readonly<Record<ThoBoiDap, string>> = Object.freeze({
  hoc_tu_moi: 'Học chữ mới',
  khac_hoa_dia_danh: 'Khắc họa địa danh',
  goi_ten_nhan_vat: 'Gọi tên nhân vật',
  mo_duong: 'Mở đường',
  lap_lang_moi: 'Lập làng mới',
  noi_lien_mo_coi: 'Nối kẻ mồ côi vào thế giới',
});

/** Mô tả một dòng cho từng thợ — giao diện hiện thẳng, không bắt người đọc đoán. */
export const MO_TA_THO: Readonly<Record<ThoBoiDap, string>> = Object.freeze({
  hoc_tu_moi: 'Nhặt chữ ra khỏi tên mà thế giới vừa đẻ, rồi cất vào Kho Từ.',
  khac_hoa_dia_danh: 'Đặt tên và viết mô tả cho nơi chốn chưa có hình hài.',
  goi_ten_nhan_vat: 'Rút một người khỏi đám đông và cho họ một cái tên.',
  mo_duong: 'Nối hai vùng chưa có tuyến — không đường thì tin tức không đi được.',
  lap_lang_moi: 'Vùng quá đông tách một nhóm đi dựng chỗ ở mới.',
  noi_lien_mo_coi: 'Nối thực thể chưa dính vào đâu vào thế giới, và đóng lỗ hổng ấy.',
});

export type ViecBoiDap = {
  readonly tho: ThoBoiDap;
  /** Một câu biên niên sử, không phải một dòng log. */
  readonly moTa: string;
  readonly entityIds: readonly string[];
};

export type KetQuaBoiDap = {
  readonly patches: readonly PatchOp[];
  readonly viec: readonly ViecBoiDap[];
  /** Tên vừa đặt trong lượt này — điều phối viên gộp lại rồi đưa cho thợ sau. */
  readonly tenDat?: ReadonlyMap<string, string>;
  /** Kho Từ sau lượt này, nếu thợ nào đó đã đổi nó. */
  readonly khoMoi?: readonly TuVung[];
  /** Chữ vừa học được — vào báo cáo, để người chơi thấy thế giới đang dày lên. */
  readonly tuMoi?: readonly TuVung[];
};

export type NgocCanhBoiDap = {
  readonly state: WorldState;
  readonly eventId: string;
  readonly tick: number;
  /** Thợ được phép chạy lượt này. Bỏ trống nghĩa là cả sáu. */
  readonly tho?: readonly ThoBoiDap[];
  /** Số việc tối đa cho CẢ lượt — trần cứng, không phải gợi ý. */
  readonly hanMuc?: number;
  /**
   * Tên vừa được đặt trong chính lượt này, chưa có trong `state`.
   *
   * Điều phối viên dựng bảng này và truyền xuống; thợ đọc nó qua `tenCua()`.
   * Xem chú thích của `tenCua()` để biết vì sao không thể đọc thẳng `state`.
   */
  readonly tenMoi?: ReadonlyMap<string, string>;
  /**
   * Kho Từ đang hiệu lực trong lượt này.
   *
   * Cùng lý do với `tenMoi`: cả lượt là một Event, nên chữ mà `hoc_tu_moi` vừa
   * nhận chưa có trong `state.world.tuVung` khi thợ đặt tên chạy. Điều phối viên
   * giữ bản đang hiệu lực và truyền xuống.
   */
  readonly kho?: readonly TuVung[];
  /** Trần Kho Từ. Bỏ trống thì dùng `TRAN_TU_VUNG`. */
  readonly tranTu?: number;
};

/**
 * Mặc định ba việc một lượt.
 *
 * Con số này là một quyết định về nhịp kể, không phải về hiệu năng: người chơi
 * đọc được ba dòng biên niên sử mới sau một lượt, và vẫn nhớ được cả ba. Mười
 * lăm dòng thì họ bỏ qua hết.
 */
export const HAN_MUC_MAC_DINH = 3;

// ─────────────────────────────────────────── đặt tên bằng Kho Từ

/**
 * Chọn một từ theo vai, ƯU TIÊN chữ thế giới ÍT DÙNG nhất.
 *
 * Không rút ngẫu nhiên đều: `soLanDung` kéo những chữ đã mòn xuống cuối, nên một
 * thế giới vừa học được "Ngưỡng" sẽ đem nó ra dùng trước khi quay lại "Gò" lần
 * thứ chín. Ngẫu nhiên chỉ quyết trong nhóm ít dùng nhất — đủ để hai vùng cùng
 * nhịp không trùng tên, không đủ để phá tính deterministic.
 *
 * Trả `null` khi kho chưa có chữ nào vai ấy; người gọi phải chịu được điều đó.
 */
function rutTu(kho: readonly TuVung[], vai: VaiTu, rng: Rng, tru: ReadonlySet<string>): TuVung | null {
  const ungVien = kho
    .filter((x) => x.vai === vai && !tru.has(chuanHoa(x.tu)))
    .sort((a, b) => (a.soLanDung !== b.soLanDung ? a.soLanDung - b.soLanDung : a.tu < b.tu ? -1 : 1));
  if (ungVien.length === 0) return null;
  // Lấy trong một phần ba đầu — chỗ những chữ còn mới.
  const cua = Math.max(1, Math.ceil(ungVien.length / 3));
  return ungVien[rng.nguyen(cua)] ?? null;
}

/**
 * Địa thế của một vùng nghiêng về chữ nào.
 *
 * Kho Từ không phân loại đầu địa danh theo địa thế — nó chỉ biết "đây là chữ
 * đứng đầu tên một nơi". Nhưng tên vẫn phải nói được vùng ấy có gì, nên khi
 * trong kho có sẵn một chữ hợp địa thế thì ưu tiên nó; không có thì rút bình
 * thường. Đây là chỗ duy nhất còn giữ một bảng cứng, và nó là bảng **gợi ý**,
 * không phải bảng nguồn: chữ không có trong kho thì không dùng được.
 */
const GOI_Y_THEO_THE: Readonly<Record<string, readonly string[]>> = Object.freeze({
  rung: ['Ngàn', 'Thung', 'Đèo'],
  ca: ['Bến', 'Đầm', 'Suối'],
  dat: ['Đồng', 'Bãi'],
  can: ['Gò', 'Truông', 'Vực', 'Đáy'],
});

/** Đầu địa danh: ưu tiên chữ hợp địa thế nếu thế giới đã biết chữ ấy. */
function rutDauDia(kho: readonly TuVung[], the: string, rng: Rng, tru: ReadonlySet<string>): TuVung | null {
  const goiY = (GOI_Y_THEO_THE[the] ?? []).map(chuanHoa);
  const hop = kho.filter(
    (x) => x.vai === 'dau_dia' && goiY.includes(chuanHoa(x.tu)) && !tru.has(chuanHoa(x.tu)),
  );
  if (hop.length > 0) {
    const sap = [...hop].sort((a, b) =>
      a.soLanDung !== b.soLanDung ? a.soLanDung - b.soLanDung : a.tu < b.tu ? -1 : 1,
    );
    return sap[rng.nguyen(Math.max(1, Math.ceil(sap.length / 2)))] ?? null;
  }
  return rutTu(kho, 'dau_dia', rng, tru);
}

function docAspect<T>(e: Entity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a === undefined || a === null || typeof a !== 'object' ? undefined : (a as T);
}

function tongCohort(c: { child: number; youth: number; adult: number; elder: number }): number {
  return c.child + c.youth + c.adult + c.elder;
}

/** Thế mạnh của một vùng, suy từ trữ lượng thật. `can` nghĩa là chẳng còn gì. */
function theCuaVung(st: SinhThai | undefined): string {
  if (!st) return 'can';
  const { rung, ca, dat } = st.taiNguyen;
  const lon = Math.max(rung, ca, dat);
  if (lon < 40) return 'can';
  if (lon === ca) return 'ca';
  if (lon === rung) return 'rung';
  return 'dat';
}

/** Id đã sắp xếp theo codepoint — luật bất biến #7, không dùng so sánh theo locale. */
function idSapXep(s: WorldState): string[] {
  return [...s.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Một entity còn đang "vô hình hài" — tên của nó chỉ là cái id, hoặc rỗng.
 *
 * Đây là trạng thái có thật và rất phổ biến: `bocTach()` cho phép model tạo
 * entity với tên tối thiểu, và `vatChatHoa()` đặt tên máy cho người mới. Chúng
 * chạy được, chỉ là chưa ai nhìn thấy chúng.
 */
function chuaCoTen(e: Entity): boolean {
  const t = e.ten.trim();
  if (t === '') return true;
  if (t === e.id) return true;
  // `noi_3`, `place-2`, `nguoi_x_12_0` — tên máy, không phải tên người đặt.
  return /^[a-z][a-z0-9]*([_-][a-z0-9]+)+$/.test(t);
}

function dat(eventId: string, table: string, id: string, path: string, value: unknown): PatchOp {
  return { op: 'set', target: { table, id, path }, value, sourceEventId: eventId };
}

function noi(eventId: string, table: string, id: string, value: unknown): PatchOp {
  return { op: 'link', target: { table, id, path: '' }, value, sourceEventId: eventId };
}

/**
 * Tên của một thực thể, KỂ CẢ tên vừa được đặt trong chính lượt này.
 *
 * Cần thiết vì cả lượt Bồi Đắp là **một** Event: patch của thợ đứng trước chưa
 * chạm state khi thợ đứng sau chạy. Không có bảng này thì thợ khắc họa vừa gọi
 * một vùng là "Đồng Gãy", và ngay dòng dưới thợ mở đường viết "một lối mòn nối
 * với Trách Tịch" — bỏ trống đúng chỗ tên vùng.
 */
function tenCua(nc: NgocCanhBoiDap, id: string): string {
  const moi = nc.tenMoi?.get(id);
  if (moi !== undefined && moi.trim() !== '') return moi;
  const e = nc.state.entities.get(id);
  const t = e?.ten.trim() ?? '';
  return t === '' ? id : t;
}

/** Mọi tên đang dùng, kể cả tên vừa đặt trong lượt này — dùng để tránh trùng. */
function tenDaDung(nc: NgocCanhBoiDap): Set<string> {
  const ra = new Set([...nc.state.entities.values()].map((e) => e.ten.trim().toLowerCase()));
  for (const t of nc.tenMoi?.values() ?? []) ra.add(t.trim().toLowerCase());
  return ra;
}

/** Kho Từ đang hiệu lực trong lượt này — bản của điều phối viên, hoặc của state. */
function khoCua(nc: NgocCanhBoiDap): readonly TuVung[] {
  return nc.kho ?? docKho(nc.state.world.tuVung);
}

/**
 * Ghép một cái tên hai phần từ Kho Từ, tránh mọi tên đang dùng.
 *
 * Trả `null` khi kho không đủ chữ để ghép được một tên chưa ai mang. Người gọi
 * phải chịu được điều đó thay vì bịa: một thế giới hết chữ thì để nguyên chỗ
 * chưa có tên còn hơn dán vào đó một chuỗi vô nghĩa — chỗ trống ấy sẽ được lấp
 * ngay khi `hoc_tu_moi` học được chữ tiếp theo.
 */
function ghepTen(
  kho: readonly TuVung[],
  vaiDau: VaiTu,
  vaiDuoi: VaiTu,
  rng: Rng,
  daDung: ReadonlySet<string>,
  the?: string,
): { ten: string; dung: readonly TuVung[] } | null {
  for (let i = 0; i < 12; i++) {
    const dau = the === undefined ? rutTu(kho, vaiDau, rng, new Set()) : rutDauDia(kho, the, rng, new Set());
    const duoi = rutTu(kho, vaiDuoi, rng, new Set());
    if (!dau) return null;
    const ten = duoi ? `${dau.tu} ${duoi.tu}` : dau.tu;
    if (!daDung.has(chuanHoa(ten))) return { ten, dung: duoi ? [dau, duoi] : [dau] };
  }
  return null;
}

/** Patch cộng một lần dùng cho những chữ vừa đem ra đặt tên. */
function patchDaDung(kho: readonly TuVung[], dung: readonly TuVung[]): readonly TuVung[] {
  if (dung.length === 0) return kho;
  const can = new Set(dung.map((x) => chuanHoa(x.tu)));
  return kho.map((x) => (can.has(chuanHoa(x.tu)) ? { ...x, soLanDung: x.soLanDung + 1 } : x));
}

// ─────────────────────────────────────────── thợ 0 · học chữ mới

/**
 * Nhặt chữ ra khỏi tên mà thế giới vừa đẻ, rồi cất vào Kho Từ.
 *
 * [BB] Đây là thợ khiến năm thợ còn lại không bao giờ cạn ý. Narrator đặt tên
 * một thành trì là "Bích Lạc Đài" thì ba trăm năm sau engine có thể tự đặt tên
 * một nơi khác là "Đài Vô Chung" — thế giới đã học được chữ "Đài", và nó học
 * được vì có ai đó đã dùng chữ ấy TRONG thế giới này.
 *
 * Ba luật kết nạp nằm ở `ketNapTu()`, không ở đây: thợ này chỉ đi nhặt.
 */
function hocTuMoi(nc: NgocCanhBoiDap, hanMuc: number): KetQuaBoiDap {
  if (hanMuc <= 0) return { patches: [], viec: [] };

  const kho = khoCua(nc);
  const tran = nc.tranTu ?? TRAN_TU_VUNG;
  if (kho.length >= tran) return { patches: [], viec: [] };

  /*
   * Số chữ học mỗi lượt tỉ lệ với hạn mức, nhưng có trần riêng.
   *
   * Học nhiều quá thì Kho Từ đầy trước khi thế giới kịp dùng hết, và trần 4096
   * biến thành một cái đồng hồ đếm ngược. Sáu chữ một việc là đủ để vốn từ lớn
   * nhanh hơn tốc độ đặt tên mà không nuốt trần trong vài trăm nhịp.
   */
  const kq = ketNapTu(kho, hocTuTheGioi(nc.state, hanMuc * 6), tran);
  if (kq.daNhan.length === 0) return { patches: [], viec: [] };

  return {
    patches: [dat(nc.eventId, 'worlds', 'worlds', 'tuVung', kq.kho)],
    viec: [
      {
        tho: 'hoc_tu_moi',
        moTa:
          kq.daNhan.length === 1
            ? `Thế giới học được một chữ mới: "${kq.daNhan[0]?.tu}".`
            : `Thế giới học được ${kq.daNhan.length} chữ mới: ${kq.daNhan
                .slice(0, 5)
                .map((x) => `"${x.tu}"`)
                .join(', ')}.`,
        entityIds: [],
      },
    ],
    khoMoi: kq.kho,
    tuMoi: kq.daNhan,
  };
}

// ─────────────────────────────────────────── thợ 1 · khắc họa địa danh

/**
 * Đặt tên và mô tả cho nơi chốn chưa có hình hài.
 *
 * Mô tả dựng từ **số liệu đang chạy của chính vùng ấy**, không từ một mẫu câu:
 * bao nhiêu người, sống bằng gì, đói hay no, có dịch hay không. Một dòng mô tả
 * sai sự thật còn tệ hơn không có dòng nào, vì nó sẽ đi thẳng vào prompt và
 * model sẽ kể theo nó.
 */
function khacHoaDiaDanh(nc: NgocCanhBoiDap, hanMuc: number): KetQuaBoiDap {
  const s = nc.state;
  const patches: PatchOp[] = [];
  const viec: ViecBoiDap[] = [];
  const tenDat = new Map<string, string>();
  let kho = khoCua(nc);
  let khoDoi = false;

  const daDungTen = tenDaDung(nc);

  for (const id of idSapXep(s)) {
    if (viec.length >= hanMuc) break;
    const e = s.entities.get(id);
    if (!e || e.tickDiet !== null) continue;
    if (e.kind !== 'place' && e.kind !== 'realm') continue;

    const thieuTen = chuaCoTen(e);
    const thieuMoTa = e.moTa.trim() === '';
    if (!thieuTen && !thieuMoTa) continue;

    const rng = rngCuaTick(s.world.seed, nc.tick, `boi_dap:dia_danh:${id}`);
    const st = docAspect<SinhThai>(e, 'sinh_thai');
    const dc = docAspect<DanCu>(e, 'dan_cu');
    const kt = docAspect<KinhTe>(e, 'kinh_te');
    const yt = docAspect<YTe>(e, 'y_te');
    const the = theCuaVung(st);

    let tenMoi = e.ten;
    if (thieuTen) {
      const g = ghepTen(kho, 'dau_dia', 'duoi_dia', rng, daDungTen, the);
      /*
       * Kho hết chữ ghép được tên chưa ai mang → BỎ QUA vùng này, không bịa.
       *
       * Lần Bồi Đắp sau `hoc_tu_moi` sẽ đem về chữ mới và vùng này được đặt tên
       * lúc ấy. Một chỗ trống chờ vài lượt là chuyện của thế giới đang lớn; một
       * cái tên vô nghĩa thì ở lại mãi mãi trong biên niên sử.
       */
      if (g === null) continue;
      tenMoi = g.ten;
      kho = patchDaDung(kho, g.dung);
      khoDoi = true;
      daDungTen.add(chuanHoa(tenMoi));
      tenDat.set(id, tenMoi);
      patches.push(dat(nc.eventId, 'entities', id, 'ten', tenMoi));
    }

    if (thieuMoTa) {
      const dan = dc ? Math.round(tongCohort(dc.cohort)) : 0;
      const nghe =
        the === 'ca'
          ? 'sống bằng nước'
          : the === 'rung'
            ? 'sống bằng rừng'
            : the === 'dat'
              ? 'sống bằng ruộng'
              : 'sống bằng những gì còn sót lại';
      const doi = (kt?.thieuHut ?? 0) > 0.35 ? ' Kho đã cạn hơn miệng ăn.' : '';
      const benh = (yt?.tyLeMac ?? 0) > 0.15 ? ' Trong vùng đang có người nằm.' : '';
      const vang = dan === 0 ? ' Không còn ai ở đây.' : '';
      const moTa =
        dan === 0
          ? `${tenMoi} — nhà cửa còn nguyên, người thì không.${doi}`
          : `${tenMoi} — ${dan} người, ${nghe}.${doi}${benh}${vang}`;
      patches.push(dat(nc.eventId, 'entities', id, 'moTa', moTa));
    }

    viec.push({
      tho: 'khac_hoa_dia_danh',
      moTa: thieuTen
        ? `Vùng đất chưa ai gọi tên từ nay được gọi là ${tenMoi}.`
        : `${tenMoi} có hình hài rõ hơn trong trí nhớ của thế giới.`,
      entityIds: [id],
    });
  }

  if (khoDoi) patches.push(dat(nc.eventId, 'worlds', 'worlds', 'tuVung', kho));
  return { patches, viec, tenDat, ...(khoDoi ? { khoMoi: kho } : {}) };
}

// ─────────────────────────────────────────── thợ 2 · gọi tên nhân vật

/** Số dân trên mỗi người **được đặt tên** mà một vùng nên có. */
const DAN_TREN_MOT_NGUOI_CO_TEN = 60;

/**
 * Rút một người có tên khỏi đám đông — [BB] 71.3 `vatChatHoa`.
 *
 * Chọn vùng theo tỷ lệ "dân trên mỗi người được đặt tên": vùng đông mà chưa ai
 * có tên được ưu tiên, vì đó chính là chỗ thế giới đang mỏng nhất. Tổng dân số
 * KHÔNG đổi — cohort giảm đúng bằng số entity sinh ra.
 */
function goiTenNhanVat(nc: NgocCanhBoiDap, hanMuc: number): KetQuaBoiDap {
  const s = nc.state;
  const patches: PatchOp[] = [];
  const viec: ViecBoiDap[] = [];
  if (hanMuc <= 0) return { patches, viec };
  let kho = khoCua(nc);
  let khoDoi = false;
  const daDungTen = tenDaDung(nc);

  // Đếm người đã có tên theo nơi cư trú.
  const coTenTheoNoi = new Map<string, number>();
  for (const lk of [...s.links.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (lk.tickDut !== null || lk.quanHe !== 'cu_tru_tai') continue;
    const nguoi = s.entities.get(lk.tuId);
    if (!nguoi || nguoi.tickDiet !== null || nguoi.kind !== 'mortal') continue;
    coTenTheoNoi.set(lk.denId, (coTenTheoNoi.get(lk.denId) ?? 0) + 1);
  }

  type UngVien = { id: string; dan: number; thieu: number };
  const ungVien: UngVien[] = [];
  for (const id of idSapXep(s)) {
    const e = s.entities.get(id);
    if (!e || e.tickDiet !== null || e.kind !== 'place') continue;
    const dc = docAspect<DanCu>(e, 'dan_cu');
    if (!dc) continue;
    const dan = tongCohort(dc.cohort);
    if (dan < DAN_TREN_MOT_NGUOI_CO_TEN) continue;
    const nen = Math.floor(dan / DAN_TREN_MOT_NGUOI_CO_TEN);
    const thieu = nen - (coTenTheoNoi.get(id) ?? 0);
    if (thieu > 0) ungVien.push({ id, dan, thieu });
  }

  // Vùng thiếu nhiều nhất trước; hòa thì theo id để mọi lần chạy như nhau.
  ungVien.sort((a, b) => (b.thieu !== a.thieu ? b.thieu - a.thieu : a.id < b.id ? -1 : 1));

  for (const uv of ungVien.slice(0, hanMuc)) {
    /*
     * `vatChatHoa()` dựng id từ (tiền tố, nơi, nhịp, số thứ tự) — nên hai lượt
     * Bồi Đắp trong CÙNG một nhịp sẽ sinh trùng id và cả lô bị transaction từ
     * chối. Đẩy tiền tố lên tới khi id còn trống là phép tránh va chạm rẻ nhất
     * mà vẫn deterministic: nó chỉ đọc `state`, không đọc bộ đếm nào của phiên.
     */
    let lan = 0;
    while (lan < 64 && s.entities.has(`dan${lan}_${uv.id}_${s.world.tick}_0`)) lan++;

    const r = vatChatHoa(s, {
      noiId: uv.id,
      soNguoi: 1,
      eventId: nc.eventId,
      band: 'adult',
      tienTo: `dan${lan}`,
    });
    if (r.lyDoTuChoi !== null || r.entityIds.length === 0) continue;

    patches.push(...r.patches);
    const nguoiId = r.entityIds[0] as string;

    /*
     * `vatChatHoa()` đặt tên máy hai âm tiết từ bảng riêng của nó. Ở đây ta thay
     * hẳn bằng một cái tên rút từ Kho Từ: họ cộng hiệu, đúng vốn từ mà THẾ GIỚI
     * NÀY đã tích được. Một người tên "Mạc Kẻ Giữ Ngưỡng" nói cho người chơi
     * biết thế giới của họ đã học được chữ "Ngưỡng" từ lúc nào đó.
     */
    const rng = rngCuaTick(s.world.seed, nc.tick, `boi_dap:nhan_vat:${nguoiId}`);
    const g = ghepTen(kho, 'ho_nguoi', 'hieu_nguoi', rng, daDungTen);
    if (g === null) continue;

    kho = patchDaDung(kho, g.dung);
    khoDoi = true;
    daDungTen.add(chuanHoa(g.ten));
    patches.push(dat(nc.eventId, 'entities', nguoiId, 'ten', g.ten));

    viec.push({
      tho: 'goi_ten_nhan_vat',
      moTa: `${g.ten} bước ra khỏi đám đông ở ${tenCua(nc, uv.id)} và có một cái tên.`,
      entityIds: [nguoiId, uv.id],
    });
  }

  if (khoDoi) patches.push(dat(nc.eventId, 'worlds', 'worlds', 'tuVung', kho));
  return { patches, viec, ...(khoDoi ? { khoMoi: kho } : {}) };
}

// ─────────────────────────────────────────── thợ 3 · mở đường

/** Hai vùng cách nhau bao xa thì một con đường còn có nghĩa. */
const TAM_MO_DUONG = 40;

/** Id mọi nơi chốn đang có ít nhất một tuyến đường chạm vào. */
function vungDaCoDuong(s: WorldState): Set<string> {
  const ra = new Set<string>();
  for (const e of s.entities.values()) {
    if (e.kind !== 'route' || e.tickDiet !== null) continue;
    const d = docAspect<{ tuId: string; denId: string }>(e, 'duong');
    if (!d) continue;
    ra.add(d.tuId);
    ra.add(d.denId);
  }
  return ra;
}

/**
 * Nối hai vùng chưa có đường.
 *
 * Đường không phải trang trí: `khong_tri_thuc_teleport` đòi có tuyến thì tin
 * mới đi được, và `banTinCho()` tính độ trễ theo `doDai`. Một thế giới không
 * đường là một thế giới mà không vùng nào biết vùng nào tồn tại — nó chạy được,
 * nhưng nó không bao giờ trở thành một thế giới.
 */
function moDuong(nc: NgocCanhBoiDap, hanMuc: number): KetQuaBoiDap {
  const s = nc.state;
  const patches: PatchOp[] = [];
  const viec: ViecBoiDap[] = [];
  if (hanMuc <= 0) return { patches, viec };

  const noiChon: { id: string; e: Entity; x: number; y: number }[] = [];
  for (const id of idSapXep(s)) {
    const e = s.entities.get(id);
    if (!e || e.tickDiet !== null || e.kind !== 'place') continue;
    const sp = docAspect<{ toaDo?: { x: number; y: number } }>(e, 'spatial');
    noiChon.push({ id, e, x: sp?.toaDo?.x ?? 0, y: sp?.toaDo?.y ?? 0 });
  }
  if (noiChon.length < 2) return { patches, viec };

  // Cặp đã có đường — kể cả đường đang tắc, vì tắc là chuyện của thế giới chứ
  // không phải chỗ trống để engine lấp thêm một con đường thứ hai.
  const daNoi = new Set<string>();
  const capCua = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);
  for (const e of s.entities.values()) {
    if (e.kind !== 'route' || e.tickDiet !== null) continue;
    const d = docAspect<{ tuId: string; denId: string }>(e, 'duong');
    if (d) daNoi.add(capCua(d.tuId, d.denId));
  }

  /*
   * Vùng CÔ LẬP được nối bất kể xa — và đó là ngoại lệ duy nhất của `TAM_MO_DUONG`.
   *
   * Tầm 40 là một phát biểu về địa lý: quá xa thì một con đường không còn là
   * chuyện người ta đi lại, nó là chuyện của một đế chế. Nhưng phát biểu ấy giả
   * định vùng kia đã dính vào thế giới bằng đường nào đó. Một vùng KHÔNG có
   * tuyến nào thì không: `khong_tri_thuc_teleport` khiến nó không bao giờ nghe
   * được tin gì, sáu tiến trình vùng chạy trên nó mà không ai biết, và nó nằm
   * lại mãi trong "chưa nối vào thế giới" vì `mo_duong` từ chối bước tới.
   *
   * Nên: cô lập thì nối tới láng giềng gần nhất, dù xa. Một con đường dài là một
   * sự thật khó chịu của thế giới ấy; không có đường nào là một lỗ thủng.
   */
  const coDuong = vungDaCoDuong(s);

  type Cap = { a: string; b: string; d: number; batBuoc: boolean };
  const cap: Cap[] = [];
  for (let i = 0; i < noiChon.length; i++) {
    for (let j = i + 1; j < noiChon.length; j++) {
      const p = noiChon[i] as (typeof noiChon)[number];
      const q = noiChon[j] as (typeof noiChon)[number];
      if (daNoi.has(capCua(p.id, q.id))) continue;
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      const batBuoc = !coDuong.has(p.id) || !coDuong.has(q.id);
      if (d > TAM_MO_DUONG && !batBuoc) continue;
      cap.push({ a: p.id, b: q.id, d, batBuoc });
    }
  }
  // Vùng cô lập trước, rồi gần nhất trước: con đường đầu tiên của một thế giới
  // luôn là con đường ngắn nhất trong số những con đường thật sự còn thiếu.
  cap.sort((u, v) =>
    u.batBuoc !== v.batBuoc
      ? u.batBuoc
        ? -1
        : 1
      : u.d !== v.d
        ? u.d - v.d
        : u.a < v.a
          ? -1
          : u.a > v.a
            ? 1
            : u.b < v.b
              ? -1
              : 1,
  );

  for (const c of cap.slice(0, hanMuc)) {
    if (!s.entities.has(c.a) || !s.entities.has(c.b)) continue;
    const tenA = tenCua(nc, c.a);
    const tenB = tenCua(nc, c.b);

    const duongId = `duong_${c.a}__${c.b}`;
    if (s.entities.has(duongId)) continue;

    const doDai = Math.max(1, Math.round(c.d / 4) || 1);
    patches.push(
      noi(
        nc.eventId,
        'entities',
        duongId,
        EntitySchema.parse({
          id: duongId,
          branchId: s.world.branchId,
          kind: 'route',
          ten: `Lối ${tenA} – ${tenB}`,
          moTa: `Vết chân người đi lại giữa ${tenA} và ${tenB} đã thành một con đường.`,
          tickSinh: nc.tick,
          aspects: {
            duong: DuongSchema.parse({ tuId: c.a, denId: c.b, doDai, chatLuong: 25, thongSuot: true }),
            // Cha của con đường là hai đầu nó nối — suy từ `state`, không từ id
            // Event (vốn mang bộ đếm của phiên). Xem chú thích ở `lapLangMoi`.
            provenance: nguonGoc('the_gioi_tu_sinh', nc.tick, { parentIds: [c.a, c.b] }),
          },
          tags: ['boi_dap'],
        }),
      ),
    );

    for (const [i, dau] of [c.a, c.b].entries()) {
      const linkId = `lk_noi_lien_${duongId}_${i}`;
      patches.push(
        noi(
          nc.eventId,
          'links',
          linkId,
          LinkSchema.parse({
            id: linkId,
            branchId: s.world.branchId,
            tuId: duongId,
            denId: dau,
            quanHe: 'noi_lien',
            trongSo: 50,
            tickTao: nc.tick,
            nguon: 'engine',
          }),
        ),
      );
    }

    viec.push({
      tho: 'mo_duong',
      moTa: `Một lối mòn nối ${tenA} với ${tenB}. Từ nay tin tức đi được giữa hai nơi.`,
      entityIds: [duongId, c.a, c.b],
    });
  }

  return { patches, viec };
}

// ─────────────────────────────────────────── thợ 4 · lập làng mới

/** Vùng phải đông tới mức nào thì một nhóm mới tách ra đi lập làng. */
const NGUONG_TACH_LANG = 400;
/** Phần dân đi theo. Nhỏ thôi — một cuộc di dân không phải một cuộc bỏ xứ. */
const PHAN_DI = 0.18;

/**
 * Một vùng quá đông sinh ra một vùng mới bên cạnh.
 *
 * [BB] Người của làng mới là người ĐÃ ĐI KHỎI làng cũ, không phải người mới
 * sinh: cohort bên kia giảm đúng bằng cohort bên này, `soCai.xuatCu` và
 * `soCai.nhapCu` khớp nhau nên `di_cu_bao_toan` vẫn đúng, và `spatial.danSo` hai
 * bên khớp tổng cohort nên `dan_so_khop_cohort` cũng vậy.
 *
 * Đây là chỗ duy nhất trong module sinh ra một `place` — và nó chỉ sinh khi có
 * đủ người thật để đi.
 */
function lapLangMoi(nc: NgocCanhBoiDap, hanMuc: number): KetQuaBoiDap {
  const s = nc.state;
  const patches: PatchOp[] = [];
  const viec: ViecBoiDap[] = [];
  if (hanMuc <= 0) return { patches, viec };

  const ungVien: { id: string; e: Entity; dan: number }[] = [];
  for (const id of idSapXep(s)) {
    const e = s.entities.get(id);
    if (!e || e.tickDiet !== null || e.kind !== 'place') continue;
    const dc = docAspect<DanCu>(e, 'dan_cu');
    const kt = docAspect<KinhTe>(e, 'kinh_te');
    if (!dc || !kt) continue;
    const dan = tongCohort(dc.cohort);
    if (dan < NGUONG_TACH_LANG) continue;
    // Đói thì người ta chết hoặc bỏ đi lẻ, không ai đủ sức lập làng.
    if (kt.thieuHut > 0.3) continue;
    ungVien.push({ id, e, dan });
  }
  ungVien.sort((a, b) => (b.dan !== a.dan ? b.dan - a.dan : a.id < b.id ? -1 : 1));

  const daDungTen = tenDaDung(nc);
  const tenDat = new Map<string, string>();
  let kho = khoCua(nc);
  let khoDoi = false;

  for (const uv of ungVien.slice(0, hanMuc)) {
    const dc = docAspect<DanCu>(uv.e, 'dan_cu');
    const st = docAspect<SinhThai>(uv.e, 'sinh_thai');
    const sp = docAspect<{ toaDo?: { x: number; y: number }; chaId?: string | null }>(uv.e, 'spatial');
    if (!dc) continue;

    const diTong = Math.floor(uv.dan * PHAN_DI);
    if (diTong < 20) continue;

    const langId = `noi_${uv.id}_tach_${nc.tick}`;
    if (s.entities.has(langId)) continue;

    const rng = rngCuaTick(s.world.seed, nc.tick, `boi_dap:lang:${langId}`);
    const the = theCuaVung(st);
    const g = ghepTen(kho, 'dau_dia', 'duoi_dia', rng, daDungTen, the);
    // Hết chữ thì đợi lượt sau — cùng lẽ với `khacHoaDiaDanh`, không bịa tên.
    if (g === null) continue;
    const ten = g.ten;
    kho = patchDaDung(kho, g.dung);
    khoDoi = true;
    daDungTen.add(chuanHoa(ten));
    tenDat.set(langId, ten);

    /*
     * Chia người theo ĐÚNG tháp tuổi của làng cũ rồi bù phần dư, để tổng đi
     * bằng đúng `diTong`: một phép chia không bù dư sẽ nuốt vài người mỗi lần,
     * và sau ba mươi lần tách thì thế giới thiếu một làng.
     */
    const con = { ...dc.cohort };
    const di = { child: 0, youth: 0, adult: 0, elder: 0 } as Record<string, number>;
    const bands = ['child', 'youth', 'adult', 'elder'] as const;
    let daChia = 0;
    for (const b of bands) {
      const n = Math.min(Math.floor((diTong * con[b]) / uv.dan), Math.floor(con[b]));
      di[b] = n;
      daChia += n;
    }
    for (const b of bands) {
      if (daChia >= diTong) break;
      const them = Math.min(diTong - daChia, Math.floor(con[b]) - (di[b] as number));
      di[b] = (di[b] as number) + them;
      daChia += them;
    }
    if (daChia < 20) continue;

    const nen = aspectNen(daChia, rng);
    // `aspectNen` dựng tháp tuổi lý tưởng; ghi đè bằng tháp tuổi THẬT của nhóm đi.
    const dcMoi = {
      ...(nen['dan_cu'] as Record<string, unknown>),
      cohort: { child: di['child'], youth: di['youth'], adult: di['adult'], elder: di['elder'] },
      soHo: Math.max(1, Math.round(daChia / Math.max(1, dc.nguoiMoiHo))),
      nguoiMoiHo: dc.nguoiMoiHo,
      soCai: {
        sinh: 0,
        tuTuNhien: 0,
        tuDoDoi: 0,
        tuDoBenh: 0,
        tuDoXungDot: 0,
        nhapCu: daChia,
        xuatCu: 0,
        vatChatHoa: 0,
      },
      tickCapNhat: nc.tick,
    };

    const goc = sp?.toaDo ?? { x: 0, y: 0 };
    patches.push(
      noi(
        nc.eventId,
        'entities',
        langId,
        EntitySchema.parse({
          id: langId,
          branchId: s.world.branchId,
          kind: 'place',
          ten,
          moTa: `${ten} — ${daChia} người rời ${tenCua(nc, uv.id)} dựng lại cuộc sống ở đây.`,
          tickSinh: nc.tick,
          aspects: {
            ...nen,
            dan_cu: dcMoi,
            spatial: SpatialSchema.parse({
              chaId: sp?.chaId ?? null,
              toaDo: { x: goc.x + rng.khoang(-9, 9), y: goc.y + rng.khoang(-9, 9) },
              banKinh: 1,
              danSo: daChia,
            }),
            /*
             * `parentIds` chứ không phải `eventId` — và khác biệt ấy có nghĩa.
             *
             * `eventId` của lô Bồi Đắp mang một bộ đếm của PHIÊN, nên hai máy
             * chạy cùng một ván sẽ ghi hai chuỗi khác nhau vào đây — mà
             * `provenance` nằm trong `aspects`, tức nằm trong `stateHash`. Cha
             * của làng này là làng nó tách ra, và đó là thứ suy được từ chính
             * `state`: deterministic, và còn trả lời đúng câu người đọc muốn hỏi.
             */
            provenance: nguonGoc('the_gioi_tu_sinh', nc.tick, { parentIds: [uv.id] }),
          },
          tags: ['boi_dap', 'lang_tach'],
        }),
      ),
    );

    // Làng cũ mất đúng số người ấy — cả cohort, cả `spatial.danSo`, cả sổ cái.
    for (const b of bands) {
      if ((di[b] as number) > 0) {
        patches.push(
          dat(nc.eventId, 'entities', uv.id, `aspects.dan_cu.cohort.${b}`, con[b] - (di[b] as number)),
        );
      }
    }
    patches.push(dat(nc.eventId, 'entities', uv.id, 'aspects.spatial.danSo', uv.dan - daChia));
    patches.push(dat(nc.eventId, 'entities', uv.id, 'aspects.dan_cu.soCai.xuatCu', daChia));

    // Một con đường về quê cũ. Không có nó, làng mới là một hòn đảo.
    const duongId = `duong_${uv.id}__${langId}`;
    patches.push(
      noi(
        nc.eventId,
        'entities',
        duongId,
        EntitySchema.parse({
          id: duongId,
          branchId: s.world.branchId,
          kind: 'route',
          ten: `Lối ${tenCua(nc, uv.id)} – ${ten}`,
          moTa: 'Con đường những người đi đã đi, và những người ở lại vẫn còn nhớ.',
          tickSinh: nc.tick,
          aspects: {
            duong: DuongSchema.parse({ tuId: uv.id, denId: langId, doDai: 1, chatLuong: 35 }),
            provenance: nguonGoc('the_gioi_tu_sinh', nc.tick, { parentIds: [uv.id, langId] }),
          },
          tags: ['boi_dap'],
        }),
      ),
    );
    for (const [i, dau] of [uv.id, langId].entries()) {
      const linkId = `lk_noi_lien_${duongId}_${i}`;
      patches.push(
        noi(
          nc.eventId,
          'links',
          linkId,
          LinkSchema.parse({
            id: linkId,
            branchId: s.world.branchId,
            tuId: duongId,
            denId: dau,
            quanHe: 'noi_lien',
            trongSo: 55,
            tickTao: nc.tick,
            nguon: 'engine',
          }),
        ),
      );
    }

    viec.push({
      tho: 'lap_lang_moi',
      moTa: `${daChia} người rời ${tenCua(nc, uv.id)} và dựng nên ${ten}.`,
      entityIds: [langId, uv.id],
    });
  }

  if (khoDoi) patches.push(dat(nc.eventId, 'worlds', 'worlds', 'tuVung', kho));
  return { patches, viec, tenDat, ...(khoDoi ? { khoMoi: kho } : {}) };
}

// ─────────────────────────────────────────── thợ 5 · nối kẻ mồ côi

/**
 * Lấp lỗ hổng `mo_coi` — Phần 6.3 quy tắc 3, Phần 15.
 *
 * `buoc11` của tick phát hiện thực thể chưa nối vào đâu và ghi một `gap`. Trước
 * module này, không có gì đóng những `gap` ấy lại: chúng chồng lên nhau cho tới
 * khi bảng lỗ hổng dài hơn cả thế giới.
 *
 * Quan hệ được chọn theo `kind`, và luôn là quan hệ RẺ NHẤT còn đúng: một người
 * thì cư trú ở đâu đó; một khái niệm thì được một nơi nhớ tới. Không ai được
 * gán một mối quan hệ nặng chỉ để cho hết mồ côi.
 */
function noiLienMoCoi(nc: NgocCanhBoiDap, hanMuc: number): KetQuaBoiDap {
  const s = nc.state;
  const patches: PatchOp[] = [];
  const viec: ViecBoiDap[] = [];
  if (hanMuc <= 0) return { patches, viec };

  const bac = new Map<string, number>();
  for (const id of s.entities.keys()) bac.set(id, 0);
  for (const lk of s.links.values()) {
    if (lk.tickDut !== null) continue;
    bac.set(lk.tuId, (bac.get(lk.tuId) ?? 0) + 1);
    bac.set(lk.denId, (bac.get(lk.denId) ?? 0) + 1);
  }

  // Neo: nơi chốn đông dân nhất còn sống. Không có nơi nào thì không nối được gì.
  const noiChon = idSapXep(s)
    .map((id) => s.entities.get(id))
    .filter((e): e is Entity => e !== undefined && e.tickDiet === null && e.kind === 'place');
  if (noiChon.length === 0) return { patches, viec };

  const neoChinh = noiChon.reduce((a, b) => {
    const da = docAspect<DanCu>(a, 'dan_cu');
    const db = docAspect<DanCu>(b, 'dan_cu');
    const na = da ? tongCohort(da.cohort) : 0;
    const nb = db ? tongCohort(db.cohort) : 0;
    return nb > na ? b : a;
  });

  for (const id of idSapXep(s)) {
    if (viec.length >= hanMuc) break;
    const e = s.entities.get(id);
    if (!e || e.tickDiet !== null) continue;
    if ((bac.get(id) ?? 0) > 0) continue;
    if (id === neoChinh.id) continue;

    const quanHe =
      e.kind === 'mortal' || e.kind === 'household'
        ? 'cu_tru_tai'
        : e.kind === 'concept' || e.kind === 'law'
          ? 'duoc_nho_boi'
          : e.kind === 'deity'
            ? 'duoc_tho_boi'
            : 'nhac_den';

    const linkId = `lk_boi_dap_${id}_${neoChinh.id}`;
    if (s.links.has(linkId)) continue;

    patches.push(
      noi(
        nc.eventId,
        'links',
        linkId,
        LinkSchema.parse({
          id: linkId,
          branchId: s.world.branchId,
          tuId: id,
          denId: neoChinh.id,
          quanHe,
          trongSo: 35,
          tickTao: nc.tick,
          nguon: 'giai_lo_hong',
        }),
      ),
    );

    // Lỗ hổng tương ứng đóng lại — nếu không nó sẽ được báo lại mãi mãi.
    const gapId = `gap_mo_coi_${id}`;
    if (s.gaps.has(gapId)) {
      patches.push(dat(nc.eventId, 'gaps', gapId, 'trangThai', 'da_giai'));
    }

    viec.push({
      tho: 'noi_lien_mo_coi',
      moTa: `${tenCua(nc, id)} không còn đứng ngoài thế giới: nay đã có chỗ ở ${tenCua(nc, neoChinh.id)}.`,
      entityIds: [id, neoChinh.id],
    });
  }

  return { patches, viec };
}

// ─────────────────────────────────────────── điều phối

const THU_TU: readonly { tho: ThoBoiDap; chay: (nc: NgocCanhBoiDap, han: number) => KetQuaBoiDap }[] =
  Object.freeze([
    /*
     * Học chữ TRƯỚC mọi thứ.
     *
     * Bốn thợ dưới đây rút chữ khỏi Kho Từ, và chữ vừa học chỉ nằm trong bản kho
     * mà điều phối viên đang giữ chứ chưa vào `state`. Chạy `hoc_tu_moi` sau
     * chúng nghĩa là chữ mới phải đợi hết một lượt Bồi Đắp mới được đem ra dùng
     * — và ở nhịp `vinh_kiep` thì "một lượt" là một thế kỷ.
     */
    { tho: 'hoc_tu_moi', chay: hocTuMoi },
    // Nối mồ côi tiếp: một thế giới liền mạch là điều kiện để mọi thợ sau đọc
    // đúng, và nó là thợ rẻ nhất trong sáu.
    { tho: 'noi_lien_mo_coi', chay: noiLienMoCoi },
    { tho: 'khac_hoa_dia_danh', chay: khacHoaDiaDanh },
    { tho: 'goi_ten_nhan_vat', chay: goiTenNhanVat },
    { tho: 'mo_duong', chay: moDuong },
    // Lập làng cuối: nó đắt nhất và nó đổi dân số, nên để nó chạy trên thế giới
    // mà năm thợ kia đã đọc xong.
    { tho: 'lap_lang_moi', chay: lapLangMoi },
  ]);

/**
 * Chạy một lượt Bồi Đắp.
 *
 * Hạn mức chia theo thứ tự thợ chứ không chia đều: thợ đứng trước lấy phần nó
 * cần rồi mới tới thợ sau. Nhờ vậy một thế giới đang có mười kẻ mồ côi sẽ dành
 * cả ba việc của lượt để nối chúng lại, thay vì nối một đứa rồi đi mở đường.
 */
export function boiDapMotLuot(nc: NgocCanhBoiDap): KetQuaBoiDap {
  const bat = new Set<ThoBoiDap>(nc.tho ?? THO_BOI_DAP);
  const tran = Math.max(0, nc.hanMuc ?? HAN_MUC_MAC_DINH);

  const patches: PatchOp[] = [];
  const viec: ViecBoiDap[] = [];
  const tuMoi: TuVung[] = [];
  /*
   * Tên tích lũy giữa các thợ trong CÙNG một lượt.
   *
   * Cả lượt là một Event, nên `state` chưa thấy cái tên mà thợ trước vừa đặt.
   * Không truyền bảng này xuống thì thợ mở đường sẽ viết "một lối mòn nối  với
   * Trách Tịch" — bỏ trống đúng chỗ vùng vừa được đặt tên ba dòng trên.
   */
  const tenMoi = new Map<string, string>(nc.tenMoi ?? []);
  /*
   * Kho Từ cũng vậy, và còn quan trọng hơn: hai thợ cùng rút một chữ trong một
   * lượt sẽ đặt ra hai cái tên giống hệt nhau nếu `soLanDung` không được cộng
   * dồn giữa chừng.
   */
  let kho = nc.kho ?? docKho(nc.state.world.tuVung);

  for (const t of THU_TU) {
    if (viec.length >= tran) break;
    if (!bat.has(t.tho)) continue;
    const kq = t.chay({ ...nc, tenMoi, kho }, tran - viec.length);
    /*
     * Patch ghi `worlds.tuVung` bị BỎ ở đây và ghi lại đúng MỘT lần ở cuối.
     *
     * Nếu giữ nguyên, hai thợ cùng đổi kho sẽ đẩy hai patch `set` lên cùng một
     * đường dẫn trong cùng một Event; patch sau đè patch trước, và chữ mà thợ
     * đầu vừa học biến mất không dấu vết.
     */
    patches.push(...kq.patches.filter((p) => !(p.target.table === 'worlds' && p.target.path === 'tuVung')));
    viec.push(...kq.viec);
    for (const [id, ten] of kq.tenDat ?? []) tenMoi.set(id, ten);
    if (kq.khoMoi) kho = kq.khoMoi;
    if (kq.tuMoi) tuMoi.push(...kq.tuMoi);
  }

  const khoCu = nc.kho ?? docKho(nc.state.world.tuVung);
  if (kho !== khoCu) patches.push(dat(nc.eventId, 'worlds', 'worlds', 'tuVung', kho));

  return { patches, viec: viec.slice(0, tran), tenDat: tenMoi, khoMoi: kho, tuMoi };
}

/**
 * Bao nhiêu chữ tự học thì một thế giới thôi nói bằng vốn từ đi mượn.
 *
 * Hai mươi bốn, chứ không phải mười hai của bản đầu. Con số cũ được đặt khi
 * chưa có thợ nào biết đẻ chữ mới, nên nó phải nhỏ để cái thước còn dùng được;
 * `boiDapAi.ts` đã bỏ ràng buộc ấy, và một cái thước dừng ở mười hai chữ thì
 * không còn đo được đoạn đường mà thế giới đi sau đó.
 */
export const TU_TU_HOC_DU_DAY = 24;

/**
 * Thế giới còn dở dang tới mức nào — 0 là xong, 100 là chưa có gì.
 *
 * Không phải một điểm số để đua: nó là thứ giao diện hiện lên để người chơi biết
 * Bồi Đắp còn việc để làm hay đã hết, và để `chayDienHoa` biết có đáng chạy
 * thêm một lượt bồi đắp nào nữa không.
 *
 * ── Vì sao TÁM chiều chứ không phải năm ──
 *
 * Mỗi chiều dưới đây phải có một người đóng được nó, nếu không cái thước đứng
 * lại ở một con số và người chơi học được rằng nó không nói gì. Bản đầu vi phạm
 * đúng điều đó ở hai chỗ: "chưa có con đường nào" chỉ phạt khi thế giới có ĐÚNG
 * không đường nào — nên một vùng cô lập giữa hai chục vùng đã nối không được
 * đếm; và "chữ tự học" thì không thợ nào đẻ ra được chữ mới, nên nó phạt vĩnh
 * viễn. Cả hai đã có người đóng: `mo_duong` nay bước tới vùng cô lập bất kể xa,
 * và `boiDapAi` đẻ chữ.
 *
 * Tổng phạt tối đa lớn hơn 100 và được kẹp lại — có chủ đích. Một thế giới
 * thiếu cùng lúc tám thứ thì "dở dang 100%" là câu đúng; chia đều 100 điểm cho
 * tám chiều sẽ làm mỗi chiều nhẹ tới mức lấp xong một chiều không thấy thanh đo
 * nhúc nhích.
 */
export function doDoDang(s: WorldState): { diem: number; thieu: readonly string[] } {
  const thieu: string[] = [];
  let phat = 0;

  const song = [...s.entities.values()].filter((e) => e.tickDiet === null);
  const noiChon = song.filter((e) => e.kind === 'place');
  const nguoi = song.filter((e) => e.kind === 'mortal');

  if (noiChon.length === 0) {
    thieu.push('chưa có một nơi chốn nào');
    phat += 40;
  } else {
    const voDanh = noiChon.filter((e) => chuaCoTen(e)).length;
    if (voDanh > 0) {
      thieu.push(`${voDanh} nơi chốn chưa được gọi tên`);
      phat += Math.min(16, (voDanh / noiChon.length) * 16);
    }

    // Tên và mô tả tách làm hai chiều: một vùng có tên mà không có một dòng nào
    // về nó vẫn là một cái id đẹp, và người chơi cần thấy đúng chỗ còn trống ấy.
    const khongMoTa = noiChon.filter((e) => e.moTa.trim() === '').length;
    if (khongMoTa > 0) {
      thieu.push(`${khongMoTa} nơi chốn chưa có một dòng mô tả`);
      phat += Math.min(12, (khongMoTa / noiChon.length) * 12);
    }

    if (noiChon.length > 1) {
      const coDuong = vungDaCoDuong(s);
      const coLap = noiChon.filter((e) => !coDuong.has(e.id)).length;
      if (coLap > 0) {
        thieu.push(`${coLap} vùng chưa có đường nào dẫn tới`);
        phat += Math.min(14, (coLap / noiChon.length) * 14);
      }
    }
  }

  const dan = noiChon.reduce((t, e) => {
    const dc = docAspect<DanCu>(e, 'dan_cu');
    return t + (dc ? tongCohort(dc.cohort) : 0);
  }, 0);
  const nenCo = Math.floor(dan / DAN_TREN_MOT_NGUOI_CO_TEN);
  if (nenCo > nguoi.length) {
    thieu.push(`${nenCo - nguoi.length} người đáng có tên còn nằm trong đám đông`);
    phat += Math.min(18, (nenCo - nguoi.length) * 2);
  }

  const moCoi = [...s.gaps.values()].filter((g) => g.loai === 'mo_coi' && g.trangThai === 'mo').length;
  if (moCoi > 0) {
    thieu.push(`${moCoi} thực thể chưa nối vào thế giới`);
    phat += Math.min(16, moCoi * 3);
  }

  const machSong = [...s.storylines.values()].filter(
    (m) => m.giaiDoan !== 'du_am' && m.giaiDoan !== 'chet_yeu',
  ).length;
  if (machSong === 0) {
    thieu.push('chưa có mạch truyện nào đang chạy');
    phat += 8;
  }

  /*
   * Vốn từ mỏng cũng là một kiểu dở dang — và là kiểu tệ nhất, vì nó chặn mọi
   * thợ khác: hết chữ thì không nơi nào được đặt tên nữa. Đo bằng chữ thế giới
   * TỰ HỌC, không tính vốn gốc: một thế giới mới sinh chưa học chữ nào thì đúng
   * là chưa có gì để kể.
   */
  const kho = docKho(s.world.tuVung);
  const tuHoc = kho.filter((x) => x.nguon !== 'goc').length;
  if (tuHoc < TU_TU_HOC_DU_DAY) {
    thieu.push(`thế giới mới học được ${tuHoc} chữ của riêng nó`);
    phat += Math.min(16, ((TU_TU_HOC_DU_DAY - tuHoc) / TU_TU_HOC_DU_DAY) * 16);
  }

  return { diem: Math.round(Math.min(100, phat)), thieu };
}
