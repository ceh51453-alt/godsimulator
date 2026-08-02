/**
 * Rerank — Phần 77.4 → 77.7 [BB]. Đây là trái tim của Khối U.
 *
 * ── Thứ tự cố định, không đổi ──
 *
 *   heuristic (deterministic, luôn tồn tại)
 *     → semantic tùy chọn (có timeout, có circuit breaker)
 *     → fusion THEO THỨ HẠNG (không cộng thẳng thang điểm)
 *     → MMR (phạt trùng text VÀ trùng nguồn)
 *     → đóng gói theo token budget
 *
 * ── Ba luật không được vi phạm ──
 *
 * [BB] 77.4 — cùng input cho cùng điểm và cùng thứ tự. Tie-break bằng `chunkId`,
 * KHÔNG bằng thứ tự DB. Một thứ tự phụ thuộc DB làm hỏng cả replay lẫn cache.
 *
 * [BB] 77.5 — adapter chỉ được trả id THUỘC candidate set. Id lạ bị vứt, và một
 * output sai hình dạng làm cả lượt rơi về heuristic thay vì rơi về "gần đúng".
 *
 * [BB] 77.6 — không cộng thẳng cosine, cross-encoder logit và heuristic. Ba thang
 * ấy không so sánh được với nhau; chỉ thứ hạng là so được.
 */
import type { RerankCandidate, RerankConfig, RerankQuery, RerankResult, LyDoChon } from '../schema/rerank.js';
import type { Tuning } from '../tuning/schema.js';
import type { NhipThoiGian } from '../contracts/view.js';
import { tachTu } from './kenh.js';

// ─────────────────────────────────────────── heuristic (77.4)

export type NgocCanhHeuristic = {
  readonly tick: number;
  readonly nhip: NhipThoiGian;
  readonly tuning: Tuning;
  readonly task: string;
  readonly storylineDangChieuId: string | null;
  /** `soul.kyUc[].dienTich` gộp theo chunk, 0–100. */
  readonly dienTich?: ReadonlyMap<string, number>;
  /** Spotlight trung bình của nhân vật trong chunk, 0–100. */
  readonly spotlight?: ReadonlyMap<string, number>;
};

/** `rrfRankScore` — hạng 1 cho 1.0 và giảm êm. Không dùng điểm RRF thô. */
function diemTheoHang(hang: number): number {
  return 1 / Math.log2(hang + 1.5);
}

/** `decayByTime` — bán chu kỳ theo NHỊP, vì một nhịp Vĩnh Kiếp dài hơn rất nhiều. */
function suyGiamThoiGian(deltaTick: number, nhip: NhipThoiGian, tuning: Tuning): number {
  const banChuKy = tuning.rerank.halfLifeTheoNhip[nhip];
  if (deltaTick <= 0) return 1;
  return Math.pow(0.5, deltaTick / Math.max(1, banChuKy));
}

/**
 * Điểm heuristic — công thức 54.7 nâng lên làm fallback deterministic của 77.4.
 *
 * ```
 * heuristic = rrfRankScore × decayByTime × (1 + dienTich/200)
 *           × (1 + spotlight/200) × storylineBoost × trust × graphBoost
 * ```
 *
 * [BB] `trust = 0` KHÔNG đồng nghĩa xóa: tin đồn vẫn hữu ích cho tác vụ kể điều
 * chủ thể TIN. Vì vậy `trust` vào công thức dưới dạng `0.15 + 0.85·trust`, tức
 * chunk hoàn toàn không đáng tin vẫn còn một phần sáu cơ hội.
 */
export function diemHeuristic(c: RerankCandidate, nc: NgocCanhHeuristic): number {
  const t = nc.tuning.rerank;
  const dienTich = nc.dienTich?.get(c.chunkId) ?? 0;
  const spotlight = nc.spotlight?.get(c.chunkId) ?? 0;

  const boostMach =
    nc.storylineDangChieuId !== null && c.storylineId === nc.storylineDangChieuId ? t.storylineBoost : 1;

  // graphDistance = null nghĩa là kênh đồ thị không với tới → không thưởng, không phạt.
  const boostDoThi = c.graphDistance === null ? 1 : Math.max(1, t.graphBoostToiDa - c.graphDistance * 0.3);

  return (
    diemTheoHang(c.initialRank) *
    suyGiamThoiGian(nc.tick - c.tick, nc.nhip, nc.tuning) *
    (1 + dienTich / 200) *
    (1 + spotlight / 200) *
    boostMach *
    (0.15 + 0.85 * c.trust) *
    boostDoThi
  );
}

/** Xếp hạng heuristic. [BB] 77.4 — tie-break bằng `chunkId`. */
export function xepHangHeuristic(
  ds: readonly RerankCandidate[],
  nc: NgocCanhHeuristic,
): readonly { chunkId: string; diem: number }[] {
  return ds
    .map((c) => ({ chunkId: c.chunkId, diem: diemHeuristic(c, nc) }))
    .sort((a, b) => b.diem - a.diem || (a.chunkId < b.chunkId ? -1 : a.chunkId > b.chunkId ? 1 : 0));
}

// ─────────────────────────────────────────── adapter semantic (77.5)

export type KetQuaAdapter = {
  /** Chỉ id thuộc candidate set. Id lạ → cả kết quả bị coi là hỏng. */
  readonly orderedChunkIds: readonly string[];
  readonly latencyMs: number;
};

/**
 * Hợp đồng adapter. Ba bản cài (`local_cross_encoder`, `proxy_cross_encoder`,
 * `llm_listwise`) đều đi qua đúng chữ ký này.
 *
 * Adapter KHÔNG nhận secret, KHÔNG nhận config endpoint, KHÔNG nhận chunk mù.
 * Nó nhận đúng thứ nó cần để xếp hạng: truy vấn và text đã chiếu.
 */
export type AdapterSemantic = {
  readonly ten: string;
  readonly xepHang: (
    query: { focusText: string; intentText: string; precedentText: string },
    ds: readonly { chunkId: string; projectedText: string }[],
  ) => Promise<KetQuaAdapter>;
};

/** Cắt chunk theo `maxChunkTokens`, ưu tiên đầu + câu chứa từ khớp (77.5). */
export function catChoAdapter(
  text: string,
  tuKhoa: readonly string[],
  maxTokens: number,
  tyLeToken = 3.2,
): string {
  const tran = Math.max(32, Math.round(maxTokens * tyLeToken));
  if (text.length <= tran) return text;

  const cau = text.split(/(?<=[.!?…])\s+/).filter((x) => x.trim() !== '');
  const khoa = new Set(tuKhoa.map((t) => t.toLowerCase()));
  const giu: string[] = [];
  let dai = 0;

  // Câu đầu luôn giữ: nó gần như luôn mang chủ ngữ của cả đoạn.
  for (const [i, c] of cau.entries()) {
    const khop = i === 0 || tachTu(c).some((t) => khoa.has(t));
    if (!khop) continue;
    if (dai + c.length > tran) break;
    giu.push(c);
    dai += c.length + 1;
  }
  return giu.length > 0 ? giu.join(' ') : text.slice(0, tran);
}

/**
 * Kiểm output adapter — [BB] 77.5: "chỉ trả id thuộc candidate set".
 *
 * Trả `null` nghĩa là output hỏng và người gọi PHẢI rơi về heuristic. Không có
 * đường "sửa tạm" — một adapter trả id lạ là một adapter ta không hiểu, và xếp
 * hạng theo thứ ta không hiểu là cách rò rỉ tinh vi nhất.
 */
export function locOutputAdapter(
  ra: readonly string[],
  hopLe: ReadonlySet<string>,
): readonly string[] | null {
  const daThay = new Set<string>();
  const sach: string[] = [];
  for (const id of ra) {
    if (!hopLe.has(id)) return null;
    if (daThay.has(id)) continue;
    daThay.add(id);
    sach.push(id);
  }
  return sach.length === 0 ? null : sach;
}

// ─────────────────────────────────────────── fusion theo thứ hạng (77.6)

export type DauVaoFusion = {
  readonly candidates: readonly RerankCandidate[];
  readonly hangHeuristic: ReadonlyMap<string, number>;
  /** Vắng mặt khi semantic không chạy — trọng số còn lại tự chuẩn hóa. */
  readonly hangSemantic: ReadonlyMap<string, number> | null;
  readonly hangDoThi: ReadonlyMap<string, number>;
  readonly config: RerankConfig;
  readonly tuning: Tuning;
  readonly task: string;
  readonly tick: number;
  readonly nhip: NhipThoiGian;
};

export type MucFusion = {
  readonly chunkId: string;
  readonly diem: number;
  readonly lyDo: readonly LyDoChon[];
};

/**
 * ```
 * fused = wInitial/(60+rankInitial) + wSemantic/(60+rankSemantic)
 *       + wGraph/(60+rankGraph) + trustBoost + recencyBoost
 * ```
 *
 * "Nếu semantic rerank không chạy, `rankSemantic` bỏ khỏi công thức và trọng số
 * còn lại được chuẩn hóa." — 77.6, và đó là điều làm tắt endpoint không đổi
 * THANG điểm, chỉ đổi thứ tự.
 */
export function fusion(dv: DauVaoFusion): readonly MucFusion[] {
  const hs = dv.tuning.rerank.hoSoTask[dv.task] ?? dv.tuning.rerank.hoSoTask['macDinh'];
  const w = {
    initialRank: hs?.initialRank ?? dv.config.blend.initialRank,
    semanticRank: hs?.semanticRank ?? dv.config.blend.semanticRank,
    graph: hs?.graph ?? dv.config.blend.graph,
    trust: hs?.trust ?? dv.config.blend.trust,
    recency: hs?.recency ?? dv.config.blend.recency,
  };

  const coSemantic = dv.hangSemantic !== null;
  const tongHang = w.initialRank + (coSemantic ? w.semanticRank : 0) + w.graph;
  const chuan = tongHang === 0 ? 1 : (w.initialRank + w.semanticRank + w.graph) / tongHang;

  const n = Math.max(1, dv.candidates.length);
  const ra: MucFusion[] = [];

  for (const c of dv.candidates) {
    const rH = dv.hangHeuristic.get(c.chunkId) ?? n;
    const rS = dv.hangSemantic?.get(c.chunkId) ?? n;
    const rG = dv.hangDoThi.get(c.chunkId) ?? n;

    let diem = (w.initialRank * chuan) / (60 + rH) + (w.graph * chuan) / (60 + rG);
    if (coSemantic) diem += (w.semanticRank * chuan) / (60 + rS);

    const trustBoost = (w.trust * c.trust) / 100;
    const tuoi = Math.max(0, dv.tick - c.tick);
    const banChuKy = dv.tuning.rerank.halfLifeTheoNhip[dv.nhip];
    const recencyBoost = (w.recency * Math.pow(0.5, tuoi / Math.max(1, banChuKy))) / 100;
    diem += trustBoost + recencyBoost;

    const lyDo: LyDoChon[] = [];
    if (coSemantic && rS <= Math.max(3, Math.ceil(n * 0.1))) lyDo.push('semantic');
    if (c.graphDistance !== null && c.graphDistance <= 1) lyDo.push('graph');
    if (c.trust >= 0.85) lyDo.push('trust');
    if (tuoi <= banChuKy / 4) lyDo.push('recency');

    ra.push({ chunkId: c.chunkId, diem, lyDo: Object.freeze(lyDo) });
  }

  return Object.freeze(
    ra.sort((a, b) => b.diem - a.diem || (a.chunkId < b.chunkId ? -1 : a.chunkId > b.chunkId ? 1 : 0)),
  );
}

// ─────────────────────────────────────────── MMR (77.6)

/** Jaccard trên tập âm tiết — rẻ, deterministic, đủ tốt để bắt biến thể câu chữ. */
export function tuongTuVanBan(a: string, b: string): number {
  const ta = new Set(tachTu(a));
  const tb = new Set(tachTu(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let chung = 0;
  for (const t of ta) if (tb.has(t)) chung++;
  return chung / (ta.size + tb.size - chung);
}

/**
 * `mmr = λ·relevance − (1−λ)·maxSimilarity(candidate, alreadySelected)`
 *
 * [BB] 77.6 — MMR phạt trùng text **và** trùng source event. "Hai chunk diễn đạt
 * khác nhưng cùng `nguonId` vẫn bị coi là TRÙNG MẠNH." Không có vế thứ hai thì
 * top-10 sẽ là mười cách kể lại cùng một sự kiện, và 54.11 mục 40 đỏ.
 */
export function mmr(
  xepHang: readonly MucFusion[],
  tra: ReadonlyMap<string, { projectedText: string; nguonId: string }>,
  lambda: number,
  soLay: number,
): readonly MucFusion[] {
  const conLai = [...xepHang];
  const chon: MucFusion[] = [];
  const maxDiem = Math.max(1e-9, ...xepHang.map((x) => x.diem));

  while (chon.length < soLay && conLai.length > 0) {
    let tot = 0;
    let diemTot = -Infinity;

    for (let i = 0; i < conLai.length; i++) {
      const uv = conLai[i];
      if (!uv) continue;
      const a = tra.get(uv.chunkId);
      let giong = 0;
      for (const d of chon) {
        const b = tra.get(d.chunkId);
        if (!a || !b) continue;
        /**
         * [BB] 77.6 — cùng `nguonId` là "trùng MẠNH", nên độ giống là 1, không
         * phải "khá cao". Đọc nhẹ hơn thế thì hai cách kể lại cùng một sự kiện
         * vẫn vào chung top khi điểm chúng gần nhau — và đó chính là cái 54.11
         * mục 40 gọi là MMR hỏng.
         *
         * MMR là một phép ĐẨY XUỐNG, không phải một phép loại. Trần cứng cho
         * "một nguồn chiếm bao nhiêu chỗ" nằm ở `dongGoiTheoToken()` (77.7 quy
         * tắc 3) — hai cơ chế, hai vai, và cần cả hai.
         */
        const g =
          a.nguonId !== '' && a.nguonId === b.nguonId ? 1 : tuongTuVanBan(a.projectedText, b.projectedText);
        giong = Math.max(giong, g);
      }
      const d = lambda * (uv.diem / maxDiem) - (1 - lambda) * giong;
      if (d > diemTot || (d === diemTot && uv.chunkId < (conLai[tot]?.chunkId ?? ''))) {
        diemTot = d;
        tot = i;
      }
    }

    const lay = conLai.splice(tot, 1)[0];
    if (!lay) break;
    const co = new Set(lay.lyDo);
    if (chon.length > 0) co.add('diversity');
    chon.push({ ...lay, lyDo: Object.freeze([...co]) });
  }

  return Object.freeze(chon);
}

// ─────────────────────────────────────────── đóng gói theo token (77.7)

export type MucDaChon = {
  readonly chunkId: string;
  readonly diem: number;
  readonly lyDo: readonly LyDoChon[];
  readonly uocToken: number;
};

export type KetQuaDongGoi = {
  readonly chon: readonly MucDaChon[];
  readonly tongToken: number;
  /** Chunk bị cắt vì hết budget — [BB] cổng "token budget có trace". */
  readonly biCat: readonly { chunkId: string; vi: string; uocToken: number }[];
  readonly canhBao: readonly string[];
};

export type ThongTinChunk = {
  readonly projectedText: string;
  readonly nguonId: string;
  readonly nguon: string;
  readonly graphDistance: number | null;
  readonly laTienLe: boolean;
};

/**
 * Sáu quy tắc của 77.7, cài đúng thứ tự:
 *
 *   1. giữ ít nhất một chunk từ MỖI NGUỒN QUAN TRỌNG nếu còn budget;
 *   2. giữ candidate có quan hệ nhân quả trực tiếp dù text không giống query;
 *   3. một lorebook không chiếm quá 50% top-K;
 *   4. dành quota cho tiền lệ Q3;
 *   5. chunk quá dài dùng bản tóm tắt đã có, KHÔNG cắt giữa câu luật;
 *   6. hết budget thì DỪNG — không để assembler cắt ngẫu nhiên sau rerank.
 *
 * Quy tắc 6 là quy tắc quan trọng nhất và là quy tắc hay bị bỏ: nếu rerank trả
 * top-K rồi assembler cắt tiếp theo ngân sách của nó, thì thứ bị cắt là thứ
 * rerank vừa xếp cuối — tức là mọi công của MMR bị vứt đi ở bước cuối cùng.
 */
export function dongGoiTheoToken(
  xepHang: readonly MucFusion[],
  tra: ReadonlyMap<string, ThongTinChunk>,
  nc: {
    nganSachToken: number;
    outputK: number;
    tyLeToken: number;
    tranTyLeMotNguon: number;
  },
): KetQuaDongGoi {
  const uoc = (s: string): number => Math.ceil(s.length / Math.max(1, nc.tyLeToken));
  const chon: MucDaChon[] = [];
  const biCat: { chunkId: string; vi: string; uocToken: number }[] = [];
  const canhBao: string[] = [];
  const demNguon = new Map<string, number>();
  const nguonDaCo = new Set<string>();
  let tong = 0;

  const tranMotNguon = Math.max(1, Math.floor(nc.outputK * nc.tranTyLeMotNguon));

  const them = (m: MucFusion, t: ThongTinChunk, boQuaTran: boolean): 'ok' | 'tran' | 'het' => {
    const tk = uoc(t.projectedText);
    if (tong + tk > nc.nganSachToken) return 'het';
    if (!boQuaTran && (demNguon.get(t.nguonId) ?? 0) >= tranMotNguon) return 'tran';
    chon.push({ chunkId: m.chunkId, diem: m.diem, lyDo: m.lyDo, uocToken: tk });
    demNguon.set(t.nguonId, (demNguon.get(t.nguonId) ?? 0) + 1);
    nguonDaCo.add(t.nguon);
    tong += tk;
    return 'ok';
  };

  const daXet = new Set<string>();

  // ── Quy tắc 2 + 4: nhân quả trực tiếp và tiền lệ Q3 vào TRƯỚC ──
  for (const m of xepHang) {
    if (chon.length >= nc.outputK) break;
    const t = tra.get(m.chunkId);
    if (!t) continue;
    const uuTien = (t.graphDistance !== null && t.graphDistance <= 1) || t.laTienLe;
    if (!uuTien) continue;
    daXet.add(m.chunkId);
    const r = them(m, t, true);
    if (r === 'het') {
      biCat.push({ chunkId: m.chunkId, vi: 'hết ngân sách token', uocToken: uoc(t.projectedText) });
    }
  }

  // ── Quy tắc 1: mỗi nguồn ít nhất một chunk ──
  for (const m of xepHang) {
    if (chon.length >= nc.outputK) break;
    if (daXet.has(m.chunkId)) continue;
    const t = tra.get(m.chunkId);
    if (!t || nguonDaCo.has(t.nguon)) continue;
    daXet.add(m.chunkId);
    const r = them(m, t, true);
    if (r === 'het') {
      biCat.push({ chunkId: m.chunkId, vi: 'hết ngân sách token', uocToken: uoc(t.projectedText) });
    }
  }

  // ── Phần còn lại theo thứ hạng, tôn trọng trần một nguồn ──
  for (const m of xepHang) {
    if (chon.length >= nc.outputK) break;
    if (daXet.has(m.chunkId)) continue;
    const t = tra.get(m.chunkId);
    if (!t) continue;
    daXet.add(m.chunkId);
    const r = them(m, t, false);
    if (r === 'tran') {
      biCat.push({
        chunkId: m.chunkId,
        vi: `một nguồn không được quá ${tranMotNguon} chỗ`,
        uocToken: uoc(t.projectedText),
      });
    } else if (r === 'het') {
      biCat.push({ chunkId: m.chunkId, vi: 'hết ngân sách token', uocToken: uoc(t.projectedText) });
    }
  }

  // Thứ chưa từng được xét vì đã đủ `outputK` — vẫn ghi trace, đúng cổng.
  for (const m of xepHang) {
    if (daXet.has(m.chunkId)) continue;
    const t = tra.get(m.chunkId);
    biCat.push({
      chunkId: m.chunkId,
      vi: `ngoài top-${nc.outputK}`,
      uocToken: t ? uoc(t.projectedText) : 0,
    });
  }

  if (biCat.some((b) => b.vi === 'hết ngân sách token')) {
    canhBao.push(
      `Ngân sách ${nc.nganSachToken} token đã đầy ở chunk thứ ${chon.length}; ` +
        `${biCat.filter((b) => b.vi === 'hết ngân sách token').length} chunk bị bỏ.`,
    );
  }

  return { chon: Object.freeze(chon), tongToken: tong, biCat: Object.freeze(biCat), canhBao };
}

/** Dựng `RerankResult` từ kết quả đóng gói — hình dạng của 77.3. */
export function dungKetQua(
  q: RerankQuery,
  goi: KetQuaDongGoi,
  nc: { modelKey: string; modeUsed: RerankResult['modeUsed']; latencyMs: number; fallbackReason: string },
): RerankResult {
  const scores: Record<string, number> = {};
  for (const m of goi.chon) scores[m.chunkId] = m.diem;
  return {
    queryHash: q.queryHash,
    modelKey: nc.modelKey,
    orderedChunkIds: goi.chon.map((m) => m.chunkId),
    scores,
    modeUsed: nc.modeUsed,
    latencyMs: nc.latencyMs,
    fallbackReason: nc.fallbackReason,
    createdAtTick: q.tick,
  };
}
