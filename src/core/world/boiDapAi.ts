/**
 * Thợ Bồi Đắp thứ bảy — người duy nhất trong xưởng có gọi model.
 *
 * ── Vì sao sáu thợ kia không đủ ──
 *
 * `boiDap.ts` mở đầu bằng ba luật, và luật thứ ba là **không LLM**. Luật ấy
 * đúng cho việc nó làm: sáu thợ kia chạy mỗi cuối lượt, hàng trăm lần một ván,
 * nên chúng phải rẻ như engine.
 *
 * Nhưng nó có một cái giá mà chỉ nhìn thấy sau vài trăm nhịp: **vốn từ của thế
 * giới không lớn lên**. `hoc_tu_moi` nhặt chữ ra khỏi những cái tên đang có, và
 * những cái tên đang có do chính `khac_hoa_dia_danh` ghép từ Kho Từ — nên nó chỉ
 * nhặt về đúng những chữ nó vừa đem đi. Vòng ấy khép kín: một thế giới chạy
 * nghìn nhịp vẫn dừng ở 68 chữ khai thiên, và bản đồ đầy những "Bãi Không Bóng",
 * "Đồng Không Bóng", "Bãi Hỗn Mang", "Đồng Hỗn Mang" — tổ hợp của một vốn từ
 * chưa từng dày thêm một chữ.
 *
 * Chỉ có một thứ phá được vòng ấy: một người **biết chữ mà thế giới chưa biết**.
 * Đó là model, và đó là toàn bộ lý do file này tồn tại.
 *
 * ── Vì sao nó KHÔNG chạy mỗi lượt ──
 *
 * Vì tiền. Sáu thợ kia chạy mỗi lượt vì chúng miễn phí; người này chạy **một
 * đến vài lần cho cả một lần Diễn Hóa**, và số ấy do người chơi đặt. Một trăm
 * năm tua tốn hai call là một cái giá đọc được trước khi bấm; tốn hai trăm call
 * thì không ai bấm lần thứ hai.
 *
 * ── Lằn ranh ──
 *
 * Y hệt sáu thợ kia: file này chỉ **trả patch**, không áp gì, và không chạm
 * mạng (luật bất biến #3 — `core/` thuần). Người gọi cầm prompt đi hỏi model,
 * mang câu trả lời về đây, rồi cho patch đi qua `locPatchTheoLanRanh()` trước
 * `apDungEvent()`.
 *
 * Và nó chỉ được viết vào đúng ba chỗ: `entities.<id>.ten`, `entities.<id>.moTa`,
 * `worlds.worlds.tuVung`. Không dân số, không tài nguyên, không quan hệ — model
 * đặt tên và viết mô tả, engine vẫn giữ mọi con số (71.5).
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import type { DanCu, KinhTe, SinhThai } from '../schema/aspect/substrate.js';
import { veSinhNhanh } from '../anToan/veSinh.js';
import { chuanHoa, docKho, hoaDauTieng, ketNapTu, TRAN_TU_VUNG, VAI_TU } from './tuVung.js';
import type { TuVung, VaiTu } from './tuVung.js';

// ─────────────────────────────────────────── chỗ trống

/** Một nơi chốn đang thiếu tên, thiếu mô tả, hoặc thiếu cả hai. */
export type ChoTrong = {
  readonly id: string;
  /** Tên đang có; rỗng nghĩa là chưa ai gọi nó. */
  readonly ten: string;
  readonly thieuTen: boolean;
  readonly thieuMoTa: boolean;
  /** Một dòng số liệu THẬT của vùng — model viết mô tả theo nó, không tự bịa. */
  readonly soLieu: string;
};

export type NgocCanhHoi = {
  readonly state: WorldState;
  /** Bao nhiêu nơi chốn đưa vào một lần hỏi. Prompt dài quá thì model bỏ đuôi. */
  readonly soNoi?: number;
  /** Bao nhiêu chữ mới xin mỗi lần hỏi. */
  readonly soTu?: number;
};

/** Mặc định cho một lần hỏi — đủ để thấy tiến bộ, chưa đủ để tràn ngân sách. */
export const SO_NOI_MOI_LAN = 8;
export const SO_TU_MOI_LAN = 12;

/** Trần cứng cho một lần đọc, kể cả khi model trả về một nghìn mục. */
const TRAN_TU_MOT_LAN = 40;
const TRAN_NOI_MOT_LAN = 24;

/** Độ dài tối đa của một dòng mô tả do model viết. */
const DAI_MO_TA = 240;

function docAspect<T>(e: Entity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a === undefined || a === null || typeof a !== 'object' ? undefined : (a as T);
}

/**
 * Tên máy hay tên người — cùng phép nhận dạng với `boiDap.ts`.
 *
 * Không tái dùng hàm ở đó vì nó không xuất ra ngoài, và chép bốn dòng còn rẻ
 * hơn nới lỏng lằn ranh của module kia chỉ để dùng chung một biểu thức.
 */
function chuaCoTen(e: Entity): boolean {
  const t = e.ten.trim();
  if (t === '') return true;
  if (t === e.id) return true;
  return /^[a-z][a-z0-9]*([_-][a-z0-9]+)+$/.test(t);
}

function tongCohort(c: { child: number; youth: number; adult: number; elder: number }): number {
  return c.child + c.youth + c.adult + c.elder;
}

/**
 * Một dòng số liệu thật của vùng, viết cho model đọc.
 *
 * [BB] Đây là chỗ "model không cầm sổ" thành mã: model KHÔNG được hỏi "vùng này
 * có bao nhiêu người", nó được **cho biết**. Nhờ vậy dòng mô tả nó viết ra nói
 * đúng thứ engine đang giữ, và lượt kể sau không mâu thuẫn với chính mô tả ấy.
 */
function soLieuCuaVung(e: Entity): string {
  const st = docAspect<SinhThai>(e, 'sinh_thai');
  const dc = docAspect<DanCu>(e, 'dan_cu');
  const kt = docAspect<KinhTe>(e, 'kinh_te');

  const dan = dc ? Math.round(tongCohort(dc.cohort)) : 0;
  const phan: string[] = [`${dan} người`];

  if (st) {
    const { rung, ca, dat } = st.taiNguyen;
    const lon = Math.max(rung, ca, dat);
    phan.push(
      lon < 40
        ? 'đất đã cạn tài nguyên'
        : lon === ca
          ? 'sống bằng nước'
          : lon === rung
            ? 'sống bằng rừng'
            : 'sống bằng ruộng',
    );
  }
  if ((kt?.thieuHut ?? 0) > 0.35) phan.push('kho lương thiếu hụt');
  return phan.join(', ');
}

/**
 * Những chỗ thế giới còn dở dang mà model lấp được.
 *
 * Duyệt theo id đã sắp xếp (luật bất biến #7): hai máy cùng state phải dựng cùng
 * một câu hỏi, nếu không thì "cùng seed cho cùng hash" chỉ còn đúng tới lần gọi
 * model đầu tiên.
 */
export function choTrongCuaTheGioi(s: WorldState, gioiHan = SO_NOI_MOI_LAN): readonly ChoTrong[] {
  const ra: ChoTrong[] = [];
  for (const id of [...s.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (ra.length >= gioiHan) break;
    const e = s.entities.get(id);
    if (!e || e.tickDiet !== null) continue;
    if (e.kind !== 'place' && e.kind !== 'realm') continue;

    const thieuTen = chuaCoTen(e);
    const thieuMoTa = e.moTa.trim() === '';
    if (!thieuTen && !thieuMoTa) continue;

    ra.push({
      id,
      ten: thieuTen ? '' : e.ten.trim(),
      thieuTen,
      thieuMoTa,
      soLieu: soLieuCuaVung(e),
    });
  }
  return ra;
}

// ─────────────────────────────────────────── dựng câu hỏi

export type PromptBoiDap = {
  readonly heThong: string;
  readonly nguoiDung: string;
  /** Id được phép trả lời. Người đọc kết quả từ chối mọi id ngoài tập này. */
  readonly idChoPhep: readonly string[];
  readonly soTuXin: number;
};

const NHAN_VAI: Readonly<Record<VaiTu, string>> = Object.freeze({
  dau_dia: 'đứng ĐẦU tên một nơi chốn (loại nơi: vực, ngưỡng, đầm, bến…)',
  duoi_dia: 'đứng SAU tên một nơi chốn (trạng thái của nơi ấy: hỗn mang, chìm, câm…)',
  ho_nguoi: 'dùng làm HỌ của một người',
  hieu_nguoi: 'dùng làm HIỆU của một người (kẻ giữ ngưỡng, mệnh, đạo…)',
});

/**
 * Dựng câu hỏi cho một lần Bồi Đắp bằng model.
 *
 * Trả `null` khi không có gì để hỏi — và đó là kết quả TỐT, không phải lỗi: một
 * thế giới đã đủ tên, đủ mô tả và đủ chữ thì không đáng tiêu một call.
 *
 * Prompt cho model biết những chữ nó KHÔNG được đề nghị lại. Không phải để tiết
 * kiệm — `ketNapTu()` vẫn từ chối chúng — mà vì một model được cho xem hàng rào
 * sẽ nhảy qua nó, còn một model bị từ chối trong im lặng sẽ đề nghị lại đúng
 * mười hai chữ ấy ở lần hỏi sau.
 */
export function dungPromptBoiDap(nc: NgocCanhHoi): PromptBoiDap | null {
  const s = nc.state;
  const soNoi = Math.max(0, Math.floor(nc.soNoi ?? SO_NOI_MOI_LAN));
  const soTuXin = Math.max(0, Math.floor(nc.soTu ?? SO_TU_MOI_LAN));

  const kho = docKho(s.world.tuVung);
  const conCho = Math.max(0, TRAN_TU_VUNG - kho.length);
  const xinTu = Math.min(soTuXin, conCho);

  const cho = soNoi === 0 ? [] : choTrongCuaTheGioi(s, soNoi);
  if (cho.length === 0 && xinTu === 0) return null;

  const heThong = [
    'Bạn là người đặt tên cho một thần thoại đang tự lớn lên.',
    'Thế giới này giữ một Kho Từ của riêng nó, và bạn đang dạy nó những chữ nó chưa biết.',
    '',
    'Ba điều bắt buộc:',
    '1. Viết bằng tiếng Việt, giọng thần thoại cổ. Không dùng chữ Hán phiên âm lạ, không dùng tiếng Anh.',
    '2. Mỗi chữ mới chỉ gồm chữ cái tiếng Việt và dấu cách, tối đa ba tiếng.',
    '3. Mô tả phải dựa ĐÚNG vào số liệu được cho. Không thêm người, không thêm của cải, không thêm sự kiện.',
    '',
    'Trả lời bằng ĐÚNG một khối JSON, không viết gì ngoài nó.',
  ].join('\n');

  const phan: string[] = [];

  if (xinTu > 0) {
    // Chỉ đưa chữ CÙNG VAI làm mẫu, và chỉ vài chục chữ: cả kho vào prompt là
    // vài nghìn token cho một việc mà mười lăm ví dụ đã nói đủ.
    phan.push(`Hãy nghĩ ra ${xinTu} chữ MỚI cho Kho Từ, chia theo bốn vai:`);
    for (const v of VAI_TU) {
      const mau = kho
        .filter((x) => x.vai === v)
        .slice(-15)
        .map((x) => x.tu);
      phan.push(`  · "${v}" — ${NHAN_VAI[v]}. Thế giới đã có: ${mau.join(', ') || '(chưa có chữ nào)'}`);
    }
    phan.push('Chữ đã có, hoặc chỉ khác một chữ cái so với chữ đã có, sẽ bị từ chối.');
    phan.push('');
  }

  if (cho.length > 0) {
    phan.push('Và lấp những chỗ còn dở dang sau đây:');
    for (const c of cho) {
      const can = [c.thieuTen ? 'cần TÊN' : `tên đang là "${c.ten}"`, c.thieuMoTa ? 'cần MÔ TẢ' : ''].filter(
        (x) => x !== '',
      );
      phan.push(`  · ${c.id} — ${c.soLieu} — ${can.join(', ')}`);
    }
    phan.push('');
  }

  phan.push('Khuôn trả lời:');
  phan.push(
    JSON.stringify({
      tuMoi: [{ tu: 'Ngưỡng', vai: 'dau_dia' }],
      datTen: [{ id: 'noi_x', ten: 'Vực Chìm', moTa: 'Một câu về nơi ấy, dựa trên số liệu đã cho.' }],
    }),
  );

  return {
    heThong,
    nguoiDung: phan.join('\n'),
    idChoPhep: cho.map((c) => c.id),
    soTuXin: xinTu,
  };
}

// ─────────────────────────────────────────── đọc câu trả lời

export type KetQuaBoiDapAi = {
  readonly patches: readonly PatchOp[];
  /** Một câu biên niên sử cho mỗi việc — cùng hình dạng với `ViecBoiDap`. */
  readonly viec: readonly { readonly tho: string; readonly moTa: string; readonly entityIds: string[] }[];
  readonly khoMoi: readonly TuVung[];
  readonly tuMoi: readonly TuVung[];
  /** Thứ model đề nghị mà bị từ chối, kèm lý do — vào Tự Chẩn Đoán, không vào world. */
  readonly biBo: readonly string[];
};

const RONG: KetQuaBoiDapAi = Object.freeze({
  patches: Object.freeze([]),
  viec: Object.freeze([]),
  khoMoi: Object.freeze([]),
  tuMoi: Object.freeze([]),
  biBo: Object.freeze([]),
});

/** Ký tự hợp lệ trong một cái tên: chữ cái, dấu cách, gạch nối. */
const TEN_HOP_LE = /^[\p{L}][\p{L} -]*$/u;

/**
 * Cắt lấy khối JSON trong một câu trả lời có thể kèm rào ```json và lời dẫn.
 *
 * Model nào cũng hứa "chỉ trả JSON" và model nào cũng thỉnh thoảng viết thêm
 * một câu trước nó. Cắt từ dấu `{` đầu tới `}` cuối là phép đọc rộng lượng nhất
 * còn an toàn: `JSON.parse` vẫn là người quyết định cuối cùng.
 */
function bocJson(tho: string): unknown {
  const s = tho.replace(/```[a-z]*/gi, '').trim();
  const dau = s.indexOf('{');
  const cuoi = s.lastIndexOf('}');
  if (dau < 0 || cuoi <= dau) return undefined;
  try {
    return JSON.parse(s.slice(dau, cuoi + 1));
  } catch {
    return undefined;
  }
}

export type NgocCanhDoc = {
  readonly state: WorldState;
  readonly eventId: string;
  readonly tick: number;
  /** Id model được phép chạm — từ chính `PromptBoiDap` đã gửi đi. */
  readonly idChoPhep: readonly string[];
  /** Kho Từ đang hiệu lực; bỏ trống thì đọc từ `state`. */
  readonly kho?: readonly TuVung[];
  readonly tranTu?: number;
};

function dat(eventId: string, id: string, path: string, value: unknown): PatchOp {
  return { op: 'set', target: { table: 'entities', id, path }, value, sourceEventId: eventId };
}

/**
 * Đọc câu trả lời của model thành patch.
 *
 * KHÔNG throw, bao giờ cũng trả một kết quả có cấu trúc — cùng chính sách với
 * `bocTach()`: model hỏng là chuyện thường ngày, không phải sự cố lập trình.
 *
 * Ba hàng rào, và cả ba đều cần:
 *
 *   1. **Chữ** đi qua `ketNapTu()` — đúng ba luật kết nạp, đúng cái trần. Model
 *      không có đặc quyền nào so với `hoc_tu_moi`.
 *   2. **Id** phải nằm trong tập vừa hỏi. Không có hàng rào này thì một model
 *      lười sẽ trả về id nó nhớ từ lượt trước và ghi đè một cái tên đang dùng.
 *   3. **Ô đang có chữ thì không ghi đè.** Model được lấp chỗ trống, không được
 *      viết lại thế giới — một vùng đã có tên thì tên ấy đã vào biên niên sử,
 *      vào lời kể, vào trí nhớ người chơi.
 */
export function docBoiDapAi(vanBan: string, nc: NgocCanhDoc): KetQuaBoiDapAi {
  const doc = bocJson(veSinhNhanh(vanBan, 40_000));
  if (doc === undefined || doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    return { ...RONG, biBo: ['Model không trả về một khối JSON đọc được.'] };
  }
  const o = doc as Record<string, unknown>;
  const cho = new Set(nc.idChoPhep);
  const biBo: string[] = [];
  const patches: PatchOp[] = [];
  const viec: { tho: string; moTa: string; entityIds: string[] }[] = [];

  // ── 1. chữ mới ──
  const khoCu = nc.kho ?? docKho(nc.state.world.tuVung);
  const vaiHopLe = new Set<string>(VAI_TU);
  const ungVien: { tu: string; vai: VaiTu; tick: number; nguon: 'the_gioi' }[] = [];
  if (Array.isArray(o['tuMoi'])) {
    for (const x of (o['tuMoi'] as unknown[]).slice(0, TRAN_TU_MOT_LAN)) {
      if (x === null || typeof x !== 'object') continue;
      const m = x as Record<string, unknown>;
      const tu = typeof m['tu'] === 'string' ? veSinhNhanh(m['tu'], 64).trim() : '';
      const vai = typeof m['vai'] === 'string' ? m['vai'] : '';
      if (tu === '') continue;
      if (!vaiHopLe.has(vai)) {
        biBo.push(`Bỏ chữ "${tu}": vai "${vai}" không có thật.`);
        continue;
      }
      ungVien.push({ tu, vai: vai as VaiTu, tick: nc.tick, nguon: 'the_gioi' });
    }
  }

  const kq = ketNapTu(khoCu, ungVien, nc.tranTu ?? TRAN_TU_VUNG);
  for (const t of kq.biTuChoi.slice(0, 8)) biBo.push(`Bỏ chữ "${t.tu}": ${t.lyDo}.`);

  if (kq.daNhan.length > 0) {
    patches.push({
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'tuVung' },
      value: kq.kho,
      sourceEventId: nc.eventId,
    });
    viec.push({
      tho: 'hoc_tu_moi',
      moTa:
        kq.daNhan.length === 1
          ? `Thế giới học được một chữ chưa ai ở đây từng dùng: "${kq.daNhan[0]?.tu}".`
          : `Thế giới học được ${kq.daNhan.length} chữ chưa ai ở đây từng dùng: ${kq.daNhan
              .slice(0, 5)
              .map((x) => `"${x.tu}"`)
              .join(', ')}.`,
      entityIds: [],
    });
  }

  // ── 2. tên và mô tả ──
  const daDungTen = new Set(
    [...nc.state.entities.values()].map((e) => chuanHoa(e.ten)).filter((t) => t !== ''),
  );

  if (Array.isArray(o['datTen'])) {
    for (const x of (o['datTen'] as unknown[]).slice(0, TRAN_NOI_MOT_LAN)) {
      if (x === null || typeof x !== 'object') continue;
      const m = x as Record<string, unknown>;
      const id = typeof m['id'] === 'string' ? m['id'].trim() : '';
      if (!cho.has(id)) {
        if (id !== '') biBo.push(`Bỏ "${id}": không nằm trong những chỗ vừa hỏi.`);
        continue;
      }
      const e = nc.state.entities.get(id);
      if (!e || e.tickDiet !== null) continue;

      let tenMoi = e.ten;
      let daLam = false;
      if (chuaCoTen(e) && typeof m['ten'] === 'string') {
        const ten = hoaDauTieng(veSinhNhanh(m['ten'], 64));
        if (ten === '' || !TEN_HOP_LE.test(ten)) {
          biBo.push(`Bỏ tên "${ten}" cho ${id}: có ký tự không phải chữ.`);
        } else if (daDungTen.has(chuanHoa(ten))) {
          biBo.push(`Bỏ tên "${ten}" cho ${id}: đã có ai đó mang tên ấy.`);
        } else {
          tenMoi = ten;
          daLam = true;
          daDungTen.add(chuanHoa(ten));
          patches.push(dat(nc.eventId, id, 'ten', ten));
        }
      }

      if (e.moTa.trim() === '' && typeof m['moTa'] === 'string') {
        const moTa = veSinhNhanh(m['moTa'], DAI_MO_TA).trim();
        if (moTa !== '') {
          daLam = true;
          patches.push(dat(nc.eventId, id, 'moTa', moTa));
        }
      }

      if (daLam) {
        viec.push({
          tho: 'khac_hoa_dia_danh',
          moTa:
            tenMoi === e.ten
              ? `${tenMoi} có hình hài rõ hơn trong trí nhớ của thế giới.`
              : `Vùng đất chưa ai gọi tên từ nay được gọi là ${tenMoi}.`,
          entityIds: [id],
        });
      }
    }
  }

  return {
    patches,
    viec,
    khoMoi: kq.kho,
    tuMoi: kq.daNhan,
    biBo,
  };
}
