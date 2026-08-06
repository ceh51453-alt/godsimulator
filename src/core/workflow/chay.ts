/**
 * Bộ chạy đường ống tác vụ — Phần 50.3 [BB].
 *
 * ── Ba mươi nhân vật thì ba mươi call ──
 *
 * [BB] 50.3: "Đây là cách đúng để xử lý 30 nhân vật T2: **không** nhồi cả 30 vào
 * một prompt. Chia 30 call nhỏ, chạy 4–5 cái một lúc, mỗi call chỉ chứa ngữ cảnh
 * của một nhân vật. Rẻ hơn, chính xác hơn, và một cái hỏng không kéo sập 29 cái kia."
 *
 * Câu cuối là ràng buộc thiết kế thật: `chayHoBanSao()` dưới đây bắt lỗi TỪNG
 * bản sao và ghi vào `that Bai`, không để một lỗi ném ra khỏi vòng lặp.
 *
 * ── Vì sao bộ gọi model được TIÊM vào ──
 *
 * `core/` không gọi mạng (luật bất biến #3). Chữ ký `BoGoiModel` là toàn bộ thứ
 * file này biết về AI; test chạy nó bằng một hàm thuần, và đường chơi thật cắm
 * `src/ai/client.ts` vào cùng chỗ.
 */
import type { StructuredError } from '../contracts/errors.js';
import { loi } from '../contracts/errors.js';
import type { Tuning } from '../tuning/schema.js';
import type { WorkflowPreset, WorkflowTask } from './schema.js';
import { quyetDinhChay, trangThaiLichMoi } from './lich.js';
import type { NgocCanhLich, TrangThaiLich } from './lich.js';

export type YeuCauGoi = {
  readonly taskId: string;
  /** Preset API đang dùng; rỗng = preset mặc định của Diễn Hóa. */
  readonly apiPreset: string;
  readonly messages: readonly { readonly role: 'system' | 'user' | 'assistant'; readonly content: string }[];
  /** Bản sao nào trong họ; `null` khi tác vụ không bật họ bản sao. */
  readonly mucId: string | null;
  readonly lanThu: number;
};

export type PhanHoiGoi =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly maLoi: string; readonly thongDiep: string };

export type BoGoiModel = (yc: YeuCauGoi) => Promise<PhanHoiGoi>;

/** Nguồn liệt kê cho họ bản sao — [BB] tra BẢNG, không `eval` chuỗi biểu thức. */
export type BoLietKe = (nguonLietKe: string, gioiHan: number) => readonly string[];

export type KetQuaTacVu = {
  readonly taskId: string;
  readonly chay: boolean;
  readonly lyDoKhongChay: string;
  /** Output đã gộp theo `cachGop`. */
  readonly output: string;
  readonly soCall: number;
  readonly soThuLai: number;
  readonly thatBai: readonly {
    readonly mucId: string | null;
    readonly maLoi: string;
    readonly thongDiep: string;
  }[];
  /** Bậc dự phòng đã dùng: 0 = preset chính. */
  readonly bacDuPhong: number;
  readonly trangThaiLich: TrangThaiLich;
  readonly canhBao: readonly StructuredError[];
};

export type KetQuaGiaiDoan = {
  readonly giaiDoan: number;
  readonly ketQua: readonly KetQuaTacVu[];
};

export type NgocCanhChay = {
  readonly preset: WorkflowPreset;
  readonly goi: BoGoiModel;
  readonly lietKe: BoLietKe;
  readonly lich: NgocCanhLich;
  readonly trangThaiLich: ReadonlyMap<string, TrangThaiLich>;
  readonly tuning: Tuning;
  /** Prompt đã dựng cho từng tác vụ. Assembler nằm ngoài file này. */
  readonly dungPrompt: (
    task: WorkflowTask,
    mucId: string | null,
    nguCanhTruoc: string,
  ) => YeuCauGoi['messages'];
  /** Chỉ dựng prompt và trả về, KHÔNG gọi model — nút "Chạy thử tác vụ này" (50.11). */
  readonly chayThu?: boolean;
  /**
   * Ép MỌI tác vụ chạy lượt này, bỏ qua lịch của chúng.
   *
   * ── Vì sao có cửa này, và vì sao nó không phá 50.9 ──
   *
   * Lịch của 50.4 trả lời câu "tác vụ này nên chạy bao thường xuyên khi đường
   * ống chạy MỖI LƯỢT". Nhưng người chơi có thể chọn cho đường ống chạy mười
   * lượt một lần — và lúc ấy hai cái lịch chồng lên nhau: `theo_luot: 3` bên
   * trong một nhịp mười lượt nghĩa là tác vụ ấy chạy mỗi ba mươi lượt, còn
   * `theo_su_kien: het_ky_nguyen` thì gần như không bao giờ. Kết quả là người
   * chơi bật cả bảy tác vụ, trả tiền cho một lần quét, và nhận về output của hai.
   *
   * Cửa này nói: *lần quét này là một lần quét đầy đủ*. Lịch vẫn nguyên trong
   * khai báo tác vụ — `kiemLanRanh()` vẫn cưỡng chế stage 4 phải dùng lịch thời
   * gian truyện — nên hợp đồng 50.9 không bị sửa; chỉ có người gọi tuyên bố rằng
   * nhịp quét của họ ĐÃ là cái lịch.
   *
   * `trangThaiSau` vẫn được cập nhật như thường, nên tắt cửa này đi thì lịch
   * chạy tiếp từ đúng chỗ nó đang đứng.
   */
  readonly epChayHet?: boolean;
};

/**
 * Chạy toàn bộ đường ống: giai đoạn tăng dần, trong mỗi giai đoạn chạy song song.
 *
 * [BB] 50.3 — "Output giai đoạn trước có mặt trong ngữ cảnh của giai đoạn sau."
 * Vì vậy `nguCanhTruoc` được nối dồn và truyền xuống, và một tác vụ giai đoạn 2
 * không bao giờ chạy trước khi giai đoạn 1 xong.
 */
export async function chayDuongOng(nc: NgocCanhChay): Promise<KetQuaGiaiDoan[]> {
  const theoGiaiDoan = new Map<number, WorkflowTask[]>();
  for (const t of nc.preset.tasks) {
    const ds = theoGiaiDoan.get(t.giaiDoan) ?? [];
    ds.push(t);
    theoGiaiDoan.set(t.giaiDoan, ds);
  }

  const giaiDoanSap = [...theoGiaiDoan.keys()].sort((a, b) => a - b);
  const ra: KetQuaGiaiDoan[] = [];
  let nguCanhTruoc = '';

  for (const gd of giaiDoanSap) {
    const ds = (theoGiaiDoan.get(gd) ?? []).sort((a, b) => (a.id < b.id ? -1 : 1));
    // Song song trong cùng giai đoạn.
    const kq = await Promise.all(ds.map((t) => chayMotTacVu(t, nc, nguCanhTruoc)));
    ra.push({ giaiDoan: gd, ketQua: kq });
    const them = kq
      .filter((k) => k.chay && k.output.trim() !== '')
      .map((k) => `[${k.taskId}]\n${k.output}`)
      .join('\n\n');
    if (them !== '') nguCanhTruoc = nguCanhTruoc === '' ? them : `${nguCanhTruoc}\n\n${them}`;
  }
  return ra;
}

/** Chạy một tác vụ, gồm cả họ bản sao và chuỗi dự phòng. */
export async function chayMotTacVu(
  task: WorkflowTask,
  nc: NgocCanhChay,
  nguCanhTruoc: string,
): Promise<KetQuaTacVu> {
  const tt = nc.trangThaiLich.get(task.id) ?? trangThaiLichMoi();
  const goc = quyetDinhChay(task, tt, nc.lich, nc.tuning.workflow.nguongParseLoiLienTiep);
  /*
   * `bat` vẫn thắng, kể cả khi ép.
   *
   * Ép chạy hết là "bỏ qua LỊCH", không phải "bỏ qua công tắc": một tác vụ người
   * chơi đã tắt tay là một quyết định, còn lịch chỉ là một nhịp mặc định.
   */
  const qd =
    nc.epChayHet === true && task.bat && !goc.chay
      ? {
          chay: true,
          soLan: 1,
          lyDo: `ép chạy (lịch nói: ${goc.lyDo})`,
          trangThaiSau: {
            ...goc.trangThaiSau,
            luotChayCuoi: nc.lich.luot,
            tickChayCuoi: nc.lich.tick,
          },
        }
      : goc;

  if (!qd.chay) {
    return {
      taskId: task.id,
      chay: false,
      lyDoKhongChay: qd.lyDo,
      output: '',
      soCall: 0,
      soThuLai: 0,
      thatBai: [],
      bacDuPhong: 0,
      trangThaiLich: qd.trangThaiSau,
      canhBao: [],
    };
  }

  const canhBao: StructuredError[] = [];
  const muc: (string | null)[] = task.hoBanSao.bat
    ? [...nc.lietKe(task.hoBanSao.nguonLietKe, task.hoBanSao.gioiHan)]
    : [null];

  if (task.hoBanSao.bat) {
    const mongDoi = nc.lietKe(task.hoBanSao.nguonLietKe, task.hoBanSao.gioiHan).length;
    // Chẩn đoán 34 — số call thực tế lệch quá ngưỡng so với số mục liệt kê.
    const lech = mongDoi === 0 ? 0 : Math.abs(muc.length - mongDoi) / mongDoi;
    if (lech > nc.tuning.workflow.nguongLechHoBanSao) {
      canhBao.push(
        loi(
          'ai',
          'HO_BAN_SAO_LECH',
          `Số call (${muc.length}) lệch ${Math.round(lech * 100)}% so với số mục liệt kê (${mongDoi}).`,
          {
            severity: 'warning',
            path: task.id,
          },
        ),
      );
    }
  }

  const chuoiPreset = [task.apiPresetName, ...task.apiPresetDuPhong];
  const ketQua: string[] = [];
  const thatBai: { mucId: string | null; maLoi: string; thongDiep: string }[] = [];
  let soCall = 0;
  let soThuLai = 0;
  let bacDuPhongDaDung = 0;

  // Chạy theo LÔ, mỗi lô `soLuongSongSong` cái.
  for (let i = 0; i < muc.length * qd.soLan; i += task.soLuongSongSong) {
    const lo = [];
    for (let j = i; j < Math.min(i + task.soLuongSongSong, muc.length * qd.soLan); j++) {
      lo.push(muc[j % muc.length] ?? null);
    }
    const kq = await Promise.all(
      lo.map(async (mucId) => {
        const messages = nc.dungPrompt(task, mucId, nguCanhTruoc);
        if (nc.chayThu === true) {
          // [BB] 50.11 — "Chạy thử tác vụ này" hiện prompt cuối cùng và output thô,
          // KHÔNG áp patch. Nên nó cũng không gọi model.
          return { mucId, text: messages.map((m) => `<${m.role}>\n${m.content}`).join('\n\n'), loi: null };
        }
        return goiCoThuLai(task, nc, messages, mucId, chuoiPreset);
      }),
    );
    for (const k of kq) {
      soCall += k.soCall ?? 1;
      soThuLai += k.soThuLai ?? 0;
      bacDuPhongDaDung = Math.max(bacDuPhongDaDung, k.bac ?? 0);
      if (k.loi !== null && k.loi !== undefined) {
        // Một cái hỏng KHÔNG kéo sập những cái còn lại.
        thatBai.push({ mucId: k.mucId, maLoi: k.loi.maLoi, thongDiep: k.loi.thongDiep });
        continue;
      }
      if (typeof k.text === 'string' && k.text !== '') ketQua.push(k.text);
    }
  }

  // Chẩn đoán 32 — preset chính lỗi quá ngưỡng.
  if (soCall > 0 && thatBai.length / soCall > nc.tuning.workflow.nguongLoiPresetChinh) {
    canhBao.push(
      loi(
        'ai',
        'PRESET_CHINH_HONG_NHIEU',
        `Preset chính lỗi ${thatBai.length}/${soCall} call của tác vụ "${task.ten}".`,
        {
          severity: 'warning',
          path: task.id,
        },
      ),
    );
  }

  return {
    taskId: task.id,
    chay: true,
    lyDoKhongChay: '',
    output: gop(ketQua, task.cachGop),
    soCall,
    soThuLai,
    thatBai,
    bacDuPhong: bacDuPhongDaDung,
    trangThaiLich: qd.trangThaiSau,
    canhBao,
  };
}

type KetQuaMotCall = {
  mucId: string | null;
  text?: string;
  loi: { maLoi: string; thongDiep: string } | null;
  soCall?: number;
  soThuLai?: number;
  bac?: number;
};

/**
 * Gọi model với thử lại và chuỗi dự phòng — 50.3 [BB].
 *
 * "Chuỗi dự phòng `apiPresetDuPhong` chạy khi preset chính lỗi hoặc quá tải."
 * Output ngắn hơn `doDaiToiThieu` **được coi là trượt** và thử lại — một model
 * trả về hai chữ là một model đã hỏng, dù HTTP nói 200.
 */
async function goiCoThuLai(
  task: WorkflowTask,
  nc: NgocCanhChay,
  messages: YeuCauGoi['messages'],
  mucId: string | null,
  chuoiPreset: readonly string[],
): Promise<KetQuaMotCall> {
  let soCall = 0;
  let soThuLai = 0;
  let loiCuoi = { maLoi: 'KHONG_RO', thongDiep: 'chưa gọi lần nào' };

  for (let bac = 0; bac < chuoiPreset.length; bac++) {
    for (let lan = 0; lan <= task.soLanThuLai; lan++) {
      soCall++;
      if (lan > 0) soThuLai++;
      const r = await nc.goi({
        taskId: task.id,
        apiPreset: chuoiPreset[bac] ?? '',
        messages,
        mucId,
        lanThu: lan,
      });
      if (!r.ok) {
        loiCuoi = { maLoi: r.maLoi, thongDiep: r.thongDiep };
        continue;
      }
      if (r.text.length < task.doDaiToiThieu) {
        loiCuoi = {
          maLoi: 'QUA_NGAN',
          thongDiep: `Output ${r.text.length} ký tự, dưới doDaiToiThieu = ${task.doDaiToiThieu}.`,
        };
        continue;
      }
      return { mucId, text: r.text, loi: null, soCall, soThuLai, bac };
    }
  }
  return { mucId, loi: loiCuoi, soCall, soThuLai, bac: chuoiPreset.length - 1 };
}

/** Gộp kết quả theo `cachGop` — 50.2. */
export function gop(ds: readonly string[], cach: WorkflowTask['cachGop']): string {
  if (ds.length === 0) return '';
  if (cach === 'ghi_de') return ds[ds.length - 1] as string;
  if (cach === 'noi') return ds.join('\n\n');

  // `gop_json`: gộp nông các object; mảng thì nối.
  const ra: Record<string, unknown> = {};
  for (const s of ds) {
    try {
      const o = JSON.parse(s) as unknown;
      if (o === null || typeof o !== 'object' || Array.isArray(o)) continue;
      for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
        const cu = ra[k];
        ra[k] = Array.isArray(cu) && Array.isArray(v) ? [...cu, ...v] : v;
      }
    } catch {
      // Mảnh không phải JSON thì bỏ qua — cùng chính sách với 31.7.
    }
  }
  return JSON.stringify(ra);
}
