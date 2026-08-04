/**
 * Store AI — cổng vào của cả trò chơi (ADR-0028).
 *
 * [BB] Không có AI thì không chơi. `useGame` hỏi `congCuaAi().choPhepChoi` trước
 * mọi hành động; store này là nơi duy nhất trả lời câu hỏi đó.
 *
 * Trạng thái ngắt mạch nằm ở đây chứ không nằm trong `WorldState`: sự cố mạng
 * không phải là một sự kiện của thế giới, và nhét nó vào state sẽ làm hash thay
 * đổi theo chất lượng wifi — thế là hỏng determinism (cổng Phase 1).
 */
import { create } from 'zustand';
import type { AiConfig, AiEndpoint, ThieuSot } from '../core/ai/cauHinh.js';
import { AiConfigSchema, CAU_HINH_AI_RONG, ProbeResultSchema, saoCauHinh } from '../core/ai/cauHinh.js';
import type { HoSoCong, TrangThaiMach } from '../core/ai/cong.js';
import {
  MACH_MOI,
  danhGiaCong,
  dongMach,
  machSauKhiHong,
  machSauKhiThanhCong,
  tyLeHong,
} from '../core/ai/cong.js';
import type { PromptGoi } from '../core/ai/bienSoan.js';
import type { RerankConfig } from '../core/schema/rerank.js';
import { RerankConfigSchema, doCauHinhRerank } from '../core/schema/rerank.js';
import type { AdapterSemantic } from '../core/retrieval/rerank.js';
import { MACH_RERANK_MOI } from '../core/retrieval/truyHoi.js';
import type { MachRerank } from '../core/retrieval/truyHoi.js';
import { chonAdapter } from '../ai/rerankClient.js';
import { goiKe, goiCapNhat, quetModel, thuDuong } from '../ai/client.js';
import type { KetQuaGoi } from '../ai/client.js';
import { updaterChayRieng } from '../core/ai/capNhat.js';
import { calibMoi, tuHieuChinh } from '../core/ai/nganSach.js';
import type { Calib, LoaiCall } from '../core/ai/nganSach.js';
import { docCauHinhAi, luuCauHinhAi } from '../db/aiConfig.js';
import { coIndexedDb, layDb } from '../db/instance.js';

/** Ba điểm cuối của 46.1. */
export type TenEndpoint = 'narrator' | 'updater' | 'workflow';

export const NHAN_ENDPOINT: Readonly<Record<TenEndpoint, string>> = Object.freeze({
  narrator: 'Tường Thuật',
  updater: 'Cập Nhật Biến',
  workflow: 'Diễn Hóa',
});

export type BanGhiGoi = {
  readonly loai: 'ke' | 'thu' | 'quet';
  readonly ok: boolean;
  readonly ma: string;
  readonly thongDiep: string;
  readonly soKyTuVao: number;
  readonly soKyTuRa: number;
};

export type TrangThaiAi = {
  cfg: AiConfig;
  mach: TrangThaiMach;
  /** Đang chạy một lượt thử đường hoặc quét. */
  dangDo: boolean;
  /** Đang chờ model kể xong — UI khóa ô nhập trong lúc này. */
  dangKe: boolean;
  /** Đã đọc xong cấu hình từ đĩa chưa. Trước lúc đó không được kết luận gì. */
  daNap: boolean;
  nhatKy: readonly BanGhiGoi[];
  /** Kết quả quét/thử gần nhất, để UI báo ngay dưới nút. */
  tinNhan: string;
  /**
   * Bộ hiệu chỉnh token theo loại call — [BB] 34.3.
   *
   * Ở store chứ không ở `WorldState`: tỉ lệ ký tự trên token là tính chất của
   * MODEL, không phải của thế giới. Nhét nó vào state sẽ làm `stateHash` đổi theo
   * việc người chơi dùng model nào — cùng lý do trạng thái ngắt mạch nằm ngoài.
   */
  calib: Record<string, Calib>;
  /** Cảnh báo tự hiệu chỉnh gần nhất — vào bảng Tự Chẩn Đoán, không im lặng. */
  canhBaoNganSach: readonly string[];

  /**
   * Ngắt mạch RIÊNG cho reranker — [BB] 77.9.
   *
   * Tách khỏi `mach` của Narrator có chủ ý: reranker chết KHÔNG được đóng cổng
   * chơi. Gộp hai trạng thái sẽ biến một sự cố xếp hạng thành một lần mất lượt,
   * đúng thứ 77.9 cấm.
   */
  machRerank: MachRerank;
  /** Thống kê tab Truy hồi (77.11) — cộng dồn trong phiên, không vào save. */
  thongKeTruyHoi: {
    soLan: number;
    soFallback: number;
    soCacheHit: number;
    tongLatencyMs: number;
    tongForbidden: number;
  };

  cong(): HoSoCong;
  tyLeHong(): number;
  /** Adapter semantic theo cấu hình hiện tại; `null` nghĩa là dùng heuristic. */
  adapterRerank(): AdapterSemantic | null;
  suaRerank(thayDoi: Partial<RerankConfig>): void;
  datMachRerank(m: MachRerank): void;
  ghiNhanTruyHoi(r: {
    latencyMs: number;
    cacheHit: boolean;
    fallbackReason: string;
    forbiddenCount: number;
  }): void;
  /**
   * Gọi Cập Nhật Biến — 46.1. Trả `null` khi endpoint chưa bật, trừ khi thao
   * tác thủ công cho phép dùng cấu hình Tường Thuật làm đường dự phòng.
   */
  capNhatBien(
    prompt: { heThong: string; nguoiDung: string },
    dungTuongThuatKhiTat?: boolean,
  ): Promise<KetQuaGoi | null>;

  napTuDia(): Promise<void>;
  suaEndpoint(ten: TenEndpoint, thayDoi: Partial<AiEndpoint>): void;
  sao(tu: TenEndpoint, den: TenEndpoint): void;
  datLai(): void;
  quet(ten: TenEndpoint): Promise<void>;
  thu(ten: TenEndpoint): Promise<void>;
  moLaiMach(): void;

  /**
   * Gọi Tường Thuật. Đây là hàm `useGame` dùng; nó tự cập nhật ngắt mạch, nên
   * ba lần hỏng liên tiếp sẽ tự đóng cổng mà không ai phải nhớ gọi thêm gì.
   */
  ke(prompt: PromptGoi): Promise<KetQuaGoi>;
};

const GIU_NHAT_KY = 20;

async function ghiDia(cfg: AiConfig): Promise<void> {
  if (!coIndexedDb()) return;
  try {
    await luuCauHinhAi(layDb(), cfg);
  } catch {
    // Không ghi được cấu hình là chuyện phiền, không phải chuyện chết. Người chơi
    // vẫn chơi được phiên này; lần sau họ điền lại. Ném lỗi ở đây sẽ giết cả app.
  }
}

/**
 * Nhớ kết quả `danhGiaCong` theo ĐÚNG ba đầu vào của nó.
 *
 * `danhGiaCong` là hàm thuần trả về object mới mỗi lần gọi. Zustand đọc store
 * qua `useSyncExternalStore`, và React so sánh ảnh chụp bằng `Object.is`: một
 * selector trả object mới mỗi lần render là vòng lặp vô tận, không phải chậm.
 * Bắt gặp trong trình duyệt ở lần mở đầu tiên — màn hình trắng, console báo
 * "getSnapshot should be cached".
 *
 * Nhớ ở tầng store chứ không ở component, để mọi chỗ gọi `cong()` — kể cả
 * `congCuaAi()` ngoài React — cùng thấy một tham chiếu.
 */
function taoBoNhoCong(): (v: { cfg: AiConfig; dangDo: boolean; mach: TrangThaiMach }) => HoSoCong {
  let khoaCfg: AiConfig | null = null;
  let khoaDangDo: boolean | null = null;
  let khoaMach: TrangThaiMach | null = null;
  let ketQua: HoSoCong | null = null;

  return (v) => {
    if (ketQua !== null && v.cfg === khoaCfg && v.dangDo === khoaDangDo && v.mach === khoaMach) {
      return ketQua;
    }
    khoaCfg = v.cfg;
    khoaDangDo = v.dangDo;
    khoaMach = v.mach;
    ketQua = danhGiaCong(v);
    return ketQua;
  };
}

export const useAi = create<TrangThaiAi>((set, get) => {
  const nhoCong = taoBoNhoCong();

  const themNhatKy = (bg: BanGhiGoi): void => {
    set({ nhatKy: [...get().nhatKy, bg].slice(-GIU_NHAT_KY) });
  };

  /**
   * Áp một mẫu đo vào bộ hiệu chỉnh của loại call.
   *
   * `promptTokens === null` nghĩa là proxy không khai `usage` — lúc ấy KHÔNG
   * chỉnh gì. Chỉnh `tyLeToken` theo một con số đoán còn tệ hơn để nguyên, vì
   * sai số sẽ tích lũy mà không có gì bắt được.
   */
  const hieuChinh = (
    loai: LoaiCall,
    uoc: number,
    thucTe: number | null,
    finishReason: string | null,
    soKyTu: number,
  ): void => {
    const cu = get().calib[loai] ?? calibMoi(loai);
    if (thucTe === null && finishReason !== 'length') return;
    const r = tuHieuChinh(cu, uoc, thucTe ?? 0, finishReason, soKyTu);
    set({
      calib: { ...get().calib, [loai]: r.calib },
      canhBaoNganSach: r.canhBao.length > 0 ? r.canhBao : get().canhBaoNganSach,
    });
  };

  const capNhat = (ten: TenEndpoint, thayDoi: Partial<AiEndpoint>): AiConfig => {
    const cu = get().cfg;
    const moi = AiConfigSchema.parse({ ...cu, [ten]: { ...cu[ten], ...thayDoi } });
    set({ cfg: moi });
    return moi;
  };

  return {
    cfg: CAU_HINH_AI_RONG,
    mach: MACH_MOI,
    calib: {},
    canhBaoNganSach: [],
    machRerank: MACH_RERANK_MOI,
    thongKeTruyHoi: { soLan: 0, soFallback: 0, soCacheHit: 0, tongLatencyMs: 0, tongForbidden: 0 },
    dangDo: false,
    dangKe: false,
    daNap: false,
    nhatKy: [],
    tinNhan: '',

    cong() {
      return nhoCong({ cfg: get().cfg, dangDo: get().dangDo, mach: get().mach });
    },

    tyLeHong() {
      return tyLeHong(get().mach);
    },

    adapterRerank() {
      const kq = doCauHinhRerank(get().cfg.rerank);
      if (!kq.config.bat) return null;
      return chonAdapter(kq.config.endpoint, { timeoutMs: kq.config.timeoutMs });
    },

    suaRerank(thayDoi) {
      const cu = get().cfg;
      const cfg = AiConfigSchema.parse({
        ...cu,
        rerank: RerankConfigSchema.parse({ ...cu.rerank, ...thayDoi }),
      });
      // Đổi model hoặc cấu hình là một `configHash` mới, nên cache cũ tự vô hiệu
      // (77.8) — và ngắt mạch cũ cũng thôi có nghĩa với endpoint mới.
      set({ cfg, machRerank: MACH_RERANK_MOI });
      void ghiDia(cfg);
    },

    datMachRerank(m) {
      set({ machRerank: m });
    },

    ghiNhanTruyHoi(r) {
      const t = get().thongKeTruyHoi;
      set({
        thongKeTruyHoi: {
          soLan: t.soLan + 1,
          soFallback: t.soFallback + (r.fallbackReason !== '' ? 1 : 0),
          soCacheHit: t.soCacheHit + (r.cacheHit ? 1 : 0),
          tongLatencyMs: t.tongLatencyMs + r.latencyMs,
          tongForbidden: t.tongForbidden + r.forbiddenCount,
        },
      });
    },

    /**
     * [BB] 46.2 — Updater tắt được, Narrator thì không.
     *
     * Trả `null` khi chưa bật riêng: người gọi hiểu là "chế độ gộp vào Narrator",
     * tức hành vi Phase 6b. Updater HỎNG cũng chỉ mất phần cập nhật, không mất
     * lời kể — vì thế nó KHÔNG đụng tới `mach` của cổng chơi.
     */
    async capNhatBien(prompt, dungTuongThuatKhiTat = false) {
      const up = get().cfg.updater;
      const chayRieng = updaterChayRieng(up);
      if (!chayRieng && !dungTuongThuatKhiTat) return null;
      // Nút rà soát phải dùng được ngay cả khi người chơi chọn chế độ gộp cập
      // nhật vào Narrator. Nó vẫn gọi model như một Updater (không yêu cầu kể),
      // chỉ mượn địa chỉ/model đã được cấu hình và kiểm tra của Tường Thuật.
      const endpoint = chayRieng ? up : get().cfg.narrator;
      const r = await goiCapNhat(endpoint, prompt);
      if (r.ok) {
        const soKyTu = prompt.heThong.length + prompt.nguoiDung.length;
        hieuChinh('tick_t2', Math.ceil(soKyTu / 3.2), r.promptTokens, r.finishReason, soKyTu);
      }
      themNhatKy({
        loai: 'ke',
        ok: r.ok,
        ma: r.ok ? '' : r.ma,
        thongDiep: r.ok ? '' : `Cập Nhật Biến: ${r.thongDiep}`,
        soKyTuVao: prompt.heThong.length + prompt.nguoiDung.length,
        soKyTuRa: r.ok ? r.soKyTu : 0,
      });
      return r;
    },

    async napTuDia() {
      if (!coIndexedDb()) {
        set({ daNap: true });
        return;
      }
      try {
        const cfg = await docCauHinhAi(layDb());
        set({ cfg, daNap: true });
      } catch {
        set({ cfg: CAU_HINH_AI_RONG, daNap: true });
      }
    },

    suaEndpoint(ten, thayDoi) {
      // Sửa địa chỉ, model hay phương ngữ làm mọi bằng chứng cũ hết giá trị:
      // "đã thử thông" của model trước không nói gì về model vừa chọn.
      const lamMoiProbe =
        thayDoi.proxyUrl !== undefined ||
        thayDoi.modelId !== undefined ||
        thayDoi.dialect !== undefined ||
        thayDoi.proxyPassword !== undefined;
      const cfg = capNhat(ten, lamMoiProbe ? { ...thayDoi, probe: ProbeResultSchema.parse({}) } : thayDoi);
      void ghiDia(cfg);
    },

    sao(tu, den) {
      const cu = get().cfg;
      const cfg = AiConfigSchema.parse({ ...cu, [den]: { ...cu[den], ...saoCauHinh(cu[tu], cu[den]) } });
      set({ cfg, tinNhan: `Đã sao cấu hình ${NHAN_ENDPOINT[tu]} sang ${NHAN_ENDPOINT[den]}.` });
      void ghiDia(cfg);
    },

    datLai() {
      set({ cfg: CAU_HINH_AI_RONG, mach: MACH_MOI, tinNhan: 'Đã khôi phục mặc định.' });
      void ghiDia(CAU_HINH_AI_RONG);
    },

    async quet(ten) {
      set({ dangDo: true, tinNhan: 'Đang quét danh sách model…' });
      const r = await quetModel(get().cfg[ten]);
      if (r.ok) {
        const cfg = capNhat(ten, { availableModels: [...r.models] });
        set({ dangDo: false, tinNhan: `Tìm được ${r.models.length} model.` });
        themNhatKy({ loai: 'quet', ok: true, ma: '', thongDiep: '', soKyTuVao: 0, soKyTuRa: 0 });
        void ghiDia(cfg);
        return;
      }
      set({ dangDo: false, tinNhan: `Quét không được: ${r.thongDiep}` });
      themNhatKy({ loai: 'quet', ok: false, ma: r.ma, thongDiep: r.thongDiep, soKyTuVao: 0, soKyTuRa: 0 });
    },

    async thu(ten) {
      set({ dangDo: true, tinNhan: 'Đang kiểm tra kết nối…' });
      const r = await thuDuong(get().cfg[ten]);
      const cfg = capNhat(ten, {
        probe: ProbeResultSchema.parse({
          daDo: true,
          thong: r.thong,
          maLoi: r.maLoi,
          thongDiep: r.thongDiep,
          modelDaTraLoi: r.modelDaTraLoi,
          soKyTuTraVe: r.soKyTuTraVe,
          xuatCoCauTruc: r.xuatCoCauTruc,
        }),
      });
      set({
        dangDo: false,
        // Thử đường thành công đóng luôn ngắt mạch: người chơi vừa chứng minh
        // đường đã thông, bắt họ bấm thêm một nút nữa là vô nghĩa.
        mach: r.thong ? dongMach(get().mach) : get().mach,
        tinNhan: r.thong ? `Kết nối thành công. ${NHAN_ENDPOINT[ten]} đã sẵn sàng.` : r.thongDiep,
      });
      themNhatKy({
        loai: 'thu',
        ok: r.thong,
        ma: r.maLoi,
        thongDiep: r.thongDiep,
        soKyTuVao: 0,
        soKyTuRa: r.soKyTuTraVe,
      });
      void ghiDia(cfg);
    },

    moLaiMach() {
      set({ mach: dongMach(get().mach), tinNhan: '' });
    },

    async ke(prompt) {
      set({ dangKe: true });
      const r = await goiKe(get().cfg.narrator, prompt);
      set({
        dangKe: false,
        mach: r.ok ? machSauKhiThanhCong(get().mach) : machSauKhiHong(get().mach, r.ma, r.thongDiep),
      });
      // [BB] 34.3 — so ước lượng với số THẬT, và nói to khi lệch hoặc bị cắt cụt.
      if (r.ok) hieuChinh('ke_canh', prompt.uocToken, r.promptTokens, r.finishReason, prompt.soKyTu);
      themNhatKy({
        loai: 'ke',
        ok: r.ok,
        ma: r.ok ? '' : r.ma,
        thongDiep: r.ok ? '' : r.thongDiep,
        soKyTuVao: prompt.soKyTu,
        soKyTuRa: r.ok ? r.soKyTu : 0,
      });
      return r;
    },
  };
});

/** Đọc cổng ngoài React — `useGame` dùng cái này, không dùng hook. */
export function congCuaAi(): HoSoCong {
  return useAi.getState().cong();
}

export type { ThieuSot };
