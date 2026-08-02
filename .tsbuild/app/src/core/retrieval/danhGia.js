import { RetrievalEvalMetricsSchema } from '../schema/rerank.js';
function recallAtK(ra, dung, k) {
    if (dung.length === 0)
        return 1;
    const top = new Set(ra.slice(0, k));
    return dung.filter((id) => top.has(id)).length / dung.length;
}
/** MRR — nghịch đảo hạng của kết quả ĐÚNG ĐẦU TIÊN. */
function mrr(ra, dung) {
    const tap = new Set(dung);
    for (const [i, id] of ra.entries())
        if (tap.has(id))
            return 1 / (i + 1);
    return 0;
}
/** nDCG@k với gain nhị phân — đủ vì gold set ở đây là "đúng / không đúng". */
function ndcgAtK(ra, dung, k) {
    const tap = new Set(dung);
    let dcg = 0;
    for (let i = 0; i < Math.min(k, ra.length); i++) {
        if (tap.has(ra[i]))
            dcg += 1 / Math.log2(i + 2);
    }
    let idcg = 0;
    for (let i = 0; i < Math.min(k, dung.length); i++)
        idcg += 1 / Math.log2(i + 2);
    return idcg === 0 ? 1 : dcg / idcg;
}
/** Đa dạng nguồn = số `nguonId` khác nhau / số chunk trả về. */
function diversity(nguonIds) {
    if (nguonIds.length === 0)
        return 1;
    return new Set(nguonIds).size / nguonIds.length;
}
/**
 * Tỷ lệ trùng nguồn — 54.11 mục 40: hỏng khi **top-10 có hơn 6 chunk cùng nguồn**.
 *
 * Mẫu số là 10, KHÔNG phải số chunk thật sự trả về. Chia cho số trả về là một
 * lỗi tinh vi: một truy vấn hẹp trả đúng 3 chunk, trong đó 2 cùng nguồn, sẽ ra
 * 67% và đỏ cổng — trong khi 54.11 nói hai chunk cùng nguồn hoàn toàn bình
 * thường. Đơn vị của quy tắc là CHỖ TRONG TOP-10, nên mẫu số phải là top-10.
 */
const CUA_SO_DA_DANG = 10;
function tyLeTrungNguon(nguonIds) {
    const top = nguonIds.slice(0, CUA_SO_DA_DANG);
    if (top.length === 0)
        return 0;
    const dem = new Map();
    for (const n of top)
        dem.set(n, (dem.get(n) ?? 0) + 1);
    return Math.max(...dem.values()) / CUA_SO_DA_DANG;
}
function phanVi(ds, p) {
    if (ds.length === 0)
        return 0;
    const sap = [...ds].sort((a, b) => a - b);
    const i = Math.min(sap.length - 1, Math.max(0, Math.ceil((p / 100) * sap.length) - 1));
    return sap[i];
}
/** Chấm một case. `forbiddenRecall` phải ra 0; khác 0 là bằng chứng lọc thủng. */
export function chamMotCase(kq, ca) {
    return RetrievalEvalMetricsSchema.parse({
        caseId: ca.id,
        recallAt20: recallAtK(kq.orderedChunkIds, ca.relevantChunkIds, 20),
        mrr: mrr(kq.orderedChunkIds, ca.relevantChunkIds),
        ndcgAt10: ndcgAtK(kq.orderedChunkIds, ca.relevantChunkIds, 10),
        diversity: diversity(kq.nguonIds),
        tyLeTrungNguon: tyLeTrungNguon(kq.nguonIds),
        forbiddenRecall: recallAtKCam(kq.orderedChunkIds, ca.forbiddenChunkIds),
        p50LatencyMs: kq.latencyMs,
        p95LatencyMs: kq.latencyMs,
        fallbackRate: kq.daFallback ? 1 : 0,
        tokenSauRerank: kq.tokenSauRerank,
        modeUsed: kq.modeUsed,
    });
}
/**
 * Forbidden recall tính trên TOÀN BỘ kết quả, không chỉ top-20.
 *
 * Cố ý khác `recallAt20`: một chunk cấm ở hạng 47 vẫn là một chunk cấm đã lọt
 * qua bộ lọc. "Nó nằm ngoài top-K nên không sao" là đúng về hiệu ứng và sai về
 * bản chất — 77.1 nói reranker không được THẤY nó, chứ không nói không được
 * xếp nó cao.
 */
function recallAtKCam(ra, cam) {
    if (cam.length === 0)
        return 0;
    const tap = new Set(ra);
    return cam.filter((id) => tap.has(id)).length / cam.length;
}
export function tongKet(ds, latency) {
    const n = Math.max(1, ds.length);
    const tb = (f) => ds.reduce((t, m) => t + f(m), 0) / n;
    return {
        soCase: ds.length,
        recallAt20: tb((m) => m.recallAt20),
        mrr: tb((m) => m.mrr),
        ndcgAt10: tb((m) => m.ndcgAt10),
        diversity: tb((m) => m.diversity),
        tyLeTrungNguon: tb((m) => m.tyLeTrungNguon),
        forbiddenRecall: tb((m) => m.forbiddenRecall),
        p50LatencyMs: phanVi(latency, 50),
        p95LatencyMs: phanVi(latency, 95),
        fallbackRate: tb((m) => m.fallbackRate),
        tokenTrungBinh: tb((m) => m.tokenSauRerank),
        chiTiet: ds,
    };
}
/**
 * Gate đề nghị của 77.10, cài thành hàm kiểm được.
 *
 * `baseline` là kết quả của mode heuristic. Truyền `null` khi đang đo chính
 * baseline — lúc ấy chỉ ba cổng tuyệt đối được kiểm.
 */
export function congEval(hienTai, baseline) {
    const ra = [
        {
            ten: 'forbidden recall = 0 ở mọi mode',
            dat: hienTai.forbiddenRecall === 0,
            chiTiet: `forbiddenRecall = ${hienTai.forbiddenRecall}`,
        },
        {
            ten: 'top-10 không quá 6 chunk cùng nguonId',
            dat: hienTai.tyLeTrungNguon <= 0.6 + 1e-9,
            chiTiet: `nguồn dày nhất chiếm ${Math.round(hienTai.tyLeTrungNguon * CUA_SO_DA_DANG)}/` +
                `${CUA_SO_DA_DANG} chỗ của top-10`,
        },
        {
            ten: 'fallback rate không quá 30%',
            dat: hienTai.fallbackRate <= 0.3,
            chiTiet: `fallbackRate = ${(hienTai.fallbackRate * 100).toFixed(0)}%`,
        },
    ];
    if (baseline) {
        ra.push({
            ten: 'nDCG@10 không thấp hơn baseline heuristic',
            dat: hienTai.ndcgAt10 >= baseline.ndcgAt10 - 1e-9,
            chiTiet: `${hienTai.ndcgAt10.toFixed(4)} so với baseline ${baseline.ndcgAt10.toFixed(4)}`,
        }, {
            ten: 'Recall@20 không giảm quá 2%',
            dat: hienTai.recallAt20 >= baseline.recallAt20 * 0.98 - 1e-9,
            chiTiet: `${hienTai.recallAt20.toFixed(4)} so với baseline ${baseline.recallAt20.toFixed(4)}`,
        }, {
            ten: 'semantic đáng bật mặc định (nDCG hoặc MRR +5% tương đối)',
            dat: hienTai.ndcgAt10 >= baseline.ndcgAt10 * 1.05 || hienTai.mrr >= baseline.mrr * 1.05,
            chiTiet: `nDCG ${((hienTai.ndcgAt10 / Math.max(1e-9, baseline.ndcgAt10) - 1) * 100).toFixed(1)}% · ` +
                `MRR ${((hienTai.mrr / Math.max(1e-9, baseline.mrr) - 1) * 100).toFixed(1)}%`,
        });
    }
    return ra;
}
