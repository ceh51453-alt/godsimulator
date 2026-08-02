/**
 * Bộ đánh giá dựng TỪ CHÍNH THẾ GIỚI — Phần 77.10.
 *
 * ── Vấn đề của một gold set viết tay ──
 *
 * 77.10 đòi `relevantChunkIds` và `forbiddenChunkIds`, tức đòi nhãn. Nhãn viết
 * tay thì mục nào cũng đúng cho đúng một thế giới, và mọi ván chơi khác đều
 * không đo được. Fixture `src/test/fixtures/retrievalEval.ts` là gold set như
 * thế: nó tốt cho test, vô dụng khi người chơi bấm "Chạy bộ đánh giá".
 *
 * ── Cách ra khỏi vấn đề ──
 *
 * Thế giới đã tự khai nhãn rồi, chỉ là ở chỗ khác. [BB] 18.2 nói ba điều tuyệt
 * đối, và cả ba đều dịch thẳng thành một cặp (đúng, cấm):
 *
 *   văn bản luật gốc     cấm với phàm nhân · diễn giải của vùng họ thì đúng
 *   bản tính thật của thần cấm với phàm nhân · `banTinhTinDoTin` thì đúng
 *   kẽ hở chưa ai khai thác cấm với mọi tầng dưới Sáng Thế
 *
 * Nên bộ đánh giá không cần ai gán nhãn: nó đọc luật chống rò rỉ và biến mỗi
 * luật thành một bài thi. Thế giới nào cũng đo được, kể cả thế giới người chơi
 * vừa tạo ra năm phút trước.
 */
import type { WorldState } from '../engine/state.js';
import type { RetrievalEvalCase, RetrievalEvalMetrics, RerankConfig } from '../schema/rerank.js';
import { RetrievalEvalCaseSchema } from '../schema/rerank.js';
import type { Tuning } from '../tuning/schema.js';
import type { ViewMode } from '../contracts/primitives.js';
import { chieu } from '../project/chieu.js';
import { dungChiMuc } from './chiMuc.js';
import { truyHoi } from './truyHoi.js';
import type { AdapterSemantic } from './rerank.js';
import { chamMotCase, tongKet, congEval } from './danhGia.js';
import type { TongKetEval, CongEval } from './danhGia.js';

/** Một bài thi kèm chủ thể sẽ chạy nó. */
export type BaiThi = {
  readonly ca: RetrievalEvalCase;
  readonly mode: ViewMode;
  readonly chuTheId: string | null;
};

function doc<T>(s: WorldState, id: string, ten: string): T | undefined {
  const a = s.entities.get(id)?.aspects[ten];
  return a === undefined || a === null ? undefined : (a as T);
}

/**
 * Dựng bộ đề từ thế giới.
 *
 * Trả rỗng khi thế giới chưa có luật nào có diễn giải và chưa có thần nào —
 * lúc ấy không có gì để đo, và nói "không có gì để đo" đúng hơn là bịa ra một
 * bài thi mà mọi kết quả đều đạt.
 */
export function boDeTuTheGioi(s: WorldState): readonly BaiThi[] {
  const ds = dungChiMuc(s);
  const idCua = (tienTo: string): readonly string[] =>
    ds.filter((c) => c.id.startsWith(tienTo)).map((c) => c.id);

  // Một phàm nhân bất kỳ, ổn định theo id — bài thi phải lặp lại được.
  const phamNhan = [...s.entities.keys()]
    .sort((a, b) => (a < b ? -1 : 1))
    .find((id) => s.entities.get(id)?.kind === 'mortal' && s.entities.get(id)?.tickDiet === null);

  const ra: BaiThi[] = [];

  for (const id of [...s.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const e = s.entities.get(id);
    if (!e) continue;

    // ── Luật: diễn giải là câu trả lời đúng, văn bản gốc và kẽ hở là câu cấm ──
    const l = doc<{ dienGiai?: { noiDung?: string }[]; vanBan?: string }>(s, id, 'lawful');
    if (l && (l.dienGiai ?? []).length > 0 && phamNhan !== undefined) {
      const dung = idCua(`ck_dg_${id}_`);
      const cam = [...idCua(`ck_luat_${id}`), ...idCua(`ck_keho_${id}_`)];
      if (dung.length > 0 && cam.length > 0) {
        ra.push({
          mode: 'pham_nhan',
          chuTheId: phamNhan,
          ca: RetrievalEvalCaseSchema.parse({
            id: `tg_luat_${id}`,
            mode: 'pham_nhan',
            chuTheId: phamNhan,
            task: 'narrate_scene',
            // Hỏi bằng TÊN luật, tức bằng thứ người trong thế giới gọi nó.
            query: `${e.ten} nghĩa là gì với người ở đây?`,
            relevantChunkIds: dung,
            forbiddenChunkIds: cam,
            diversityGroups: {},
          }),
        });
      }
    }

    // ── Thần: điều tín đồ tin là đúng, bản tính thật là cấm ──
    if (e.kind === 'deity' && phamNhan !== undefined) {
      const dung = idCua(`ck_bt_tin_${id}`);
      const cam = idCua(`ck_bt_that_${id}`);
      if (dung.length > 0 && cam.length > 0) {
        ra.push({
          mode: 'pham_nhan',
          chuTheId: phamNhan,
          ca: RetrievalEvalCaseSchema.parse({
            id: `tg_than_${id}`,
            mode: 'pham_nhan',
            chuTheId: phamNhan,
            task: 'narrate_scene',
            query: `${e.ten} là vị thần thế nào?`,
            relevantChunkIds: dung,
            forbiddenChunkIds: cam,
            diversityGroups: {},
          }),
        });
      }
    }
  }

  /**
   * Một bài thi cho tầng Thần: kẽ hở engine đã biết mà chưa ai khai thác vẫn
   * phải cấm với thần. 18.2 cho thần đọc văn bản luật TRONG domain, không cho
   * đọc chỗ luật hở.
   */
  const than = [...s.entities.keys()]
    .sort((a, b) => (a < b ? -1 : 1))
    .find((id) => s.entities.get(id)?.kind === 'deity');
  const keHo = ds.filter((c) => c.id.startsWith('ck_keho_')).map((c) => c.id);
  if (than !== undefined && keHo.length > 0) {
    const dung = ds.filter((c) => c.nguon === 'dinh_luat' && c.id.startsWith('ck_luat_')).map((c) => c.id);
    if (dung.length > 0) {
      ra.push({
        mode: 'than',
        chuTheId: than,
        ca: RetrievalEvalCaseSchema.parse({
          id: `tg_than_ke_ho`,
          mode: 'than',
          chuTheId: than,
          task: 'answer_prayer',
          query: 'Luật nào đang chi phối chỗ này, và nó có chỗ nào hở?',
          relevantChunkIds: dung,
          forbiddenChunkIds: keHo,
          diversityGroups: {},
        }),
      });
    }
  }

  return Object.freeze(ra);
}

export type KetQuaBoDanhGia = {
  readonly soBai: number;
  readonly tongKet: TongKetEval;
  readonly cong: readonly CongEval[];
  /** Đạt khi MỌI cổng đạt. `forbiddenRecall != 0` là hỏng nặng, không phải hồi quy. */
  readonly dat: boolean;
  readonly moTa: string;
};

/**
 * Chạy bộ đề qua ĐÚNG đường ống của lượt chơi thật.
 *
 * Không có đường tắt: cùng `truyHoi()`, cùng lọc tầm nhìn, cùng rerank, cùng
 * packer. Một bộ đánh giá chạy trên đường ống riêng chỉ đo được chính nó.
 */
export async function chayBoDanhGia(
  s: WorldState,
  nc: {
    config: RerankConfig;
    tuning: Tuning;
    nganSachToken: number;
    tyLeToken: number;
    adapter?: AdapterSemantic | null;
    baseline?: TongKetEval | null;
    dongHo?: () => number;
  },
): Promise<KetQuaBoDanhGia> {
  const de = boDeTuTheGioi(s);
  const chunks = dungChiMuc(s);
  const metrics: RetrievalEvalMetrics[] = [];
  const latency: number[] = [];

  for (const bt of de) {
    const view = chieu(s, bt.mode, bt.chuTheId);
    const kq = await truyHoi(
      {
        view,
        chunks,
        task: bt.ca.task,
        truyVan: {
          focusText: bt.ca.query,
          intentText: bt.ca.query,
          precedentText: 'Chuyện tương tự đã từng xảy ra trong thế giới này chưa?',
        },
        tieuDiemIds: [],
        machDangChieuId: null,
        config: nc.config,
        tuning: nc.tuning,
        nganSachToken: nc.nganSachToken,
        tyLeToken: nc.tyLeToken,
        seed: s.world.seed,
        triThuc: 50,
        // Bộ đánh giá KHÔNG nới lỏng bộ lọc: vùng và domain lấy đúng như lượt chơi.
        vungIds: new Set(vungCua(s, bt.chuTheId)),
        domainIds: new Set(domainCua(s, bt.chuTheId)),
        ...(nc.adapter ? { adapter: nc.adapter } : {}),
        ...(nc.dongHo ? { dongHo: nc.dongHo } : {}),
      },
      new Set(bt.ca.forbiddenChunkIds),
    );

    latency.push(kq.run.latencyMs);
    metrics.push(
      chamMotCase(
        {
          caseId: bt.ca.id,
          orderedChunkIds: kq.ketQua.orderedChunkIds,
          nguonIds: kq.daChon.map((c) => c.nguonId),
          latencyMs: kq.run.latencyMs,
          daFallback: kq.run.fallbackReason !== '',
          tokenSauRerank: kq.tongToken,
          modeUsed: kq.run.modeUsed,
        },
        bt.ca,
      ),
    );
  }

  const tk = tongKet(metrics, latency);
  const cong = congEval(tk, nc.baseline ?? null);
  const dat = de.length > 0 && cong.every((c) => c.dat);

  return {
    soBai: de.length,
    tongKet: tk,
    cong,
    dat,
    moTa:
      de.length === 0
        ? 'Thế giới chưa có luật có diễn giải hay thần nào để dựng bài thi. Chưa đo được gì.'
        : `${de.length} bài · Recall@20 ${(tk.recallAt20 * 100).toFixed(0)}% · ` +
          `nDCG@10 ${tk.ndcgAt10.toFixed(3)} · dữ liệu vượt quyền lọt ra: ${tk.forbiddenRecall}`,
  };
}

function vungCua(s: WorldState, chuTheId: string | null): readonly string[] {
  if (chuTheId === null) return [];
  const ra: string[] = [];
  for (const lk of s.links.values()) {
    if (lk.tickDut !== null || lk.quanHe !== 'cu_tru_tai' || lk.tuId !== chuTheId) continue;
    ra.push(lk.denId);
  }
  return ra;
}

function domainCua(s: WorldState, chuTheId: string | null): readonly string[] {
  if (chuTheId === null) return [];
  const d = doc<{ domains?: { ten: string }[] }>(s, chuTheId, 'domain');
  return (d?.domains ?? []).map((x) => x.ten);
}
