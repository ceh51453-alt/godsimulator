import { RetrievalEvalCaseSchema } from '../schema/rerank.js';
import { chieu } from '../project/chieu.js';
import { dungChiMuc } from './chiMuc.js';
import { truyHoi } from './truyHoi.js';
import { chamMotCase, tongKet, congEval } from './danhGia.js';
function doc(s, id, ten) {
    const a = s.entities.get(id)?.aspects[ten];
    return a === undefined || a === null ? undefined : a;
}
/**
 * Dựng bộ đề từ thế giới.
 *
 * Trả rỗng khi thế giới chưa có luật nào có diễn giải và chưa có thần nào —
 * lúc ấy không có gì để đo, và nói "không có gì để đo" đúng hơn là bịa ra một
 * bài thi mà mọi kết quả đều đạt.
 */
export function boDeTuTheGioi(s) {
    const ds = dungChiMuc(s);
    const idCua = (tienTo) => ds.filter((c) => c.id.startsWith(tienTo)).map((c) => c.id);
    // Một phàm nhân bất kỳ, ổn định theo id — bài thi phải lặp lại được.
    const phamNhan = [...s.entities.keys()]
        .sort((a, b) => (a < b ? -1 : 1))
        .find((id) => s.entities.get(id)?.kind === 'mortal' && s.entities.get(id)?.tickDiet === null);
    const ra = [];
    for (const id of [...s.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const e = s.entities.get(id);
        if (!e)
            continue;
        // ── Luật: diễn giải là câu trả lời đúng, văn bản gốc và kẽ hở là câu cấm ──
        const l = doc(s, id, 'lawful');
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
/**
 * Chạy bộ đề qua ĐÚNG đường ống của lượt chơi thật.
 *
 * Không có đường tắt: cùng `truyHoi()`, cùng lọc tầm nhìn, cùng rerank, cùng
 * packer. Một bộ đánh giá chạy trên đường ống riêng chỉ đo được chính nó.
 */
export async function chayBoDanhGia(s, nc) {
    const de = boDeTuTheGioi(s);
    const chunks = dungChiMuc(s);
    const metrics = [];
    const latency = [];
    for (const bt of de) {
        const view = chieu(s, bt.mode, bt.chuTheId);
        const kq = await truyHoi({
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
        }, new Set(bt.ca.forbiddenChunkIds));
        latency.push(kq.run.latencyMs);
        metrics.push(chamMotCase({
            caseId: bt.ca.id,
            orderedChunkIds: kq.ketQua.orderedChunkIds,
            nguonIds: kq.daChon.map((c) => c.nguonId),
            latencyMs: kq.run.latencyMs,
            daFallback: kq.run.fallbackReason !== '',
            tokenSauRerank: kq.tongToken,
            modeUsed: kq.run.modeUsed,
        }, bt.ca));
    }
    const tk = tongKet(metrics, latency);
    const cong = congEval(tk, nc.baseline ?? null);
    const dat = de.length > 0 && cong.every((c) => c.dat);
    return {
        soBai: de.length,
        tongKet: tk,
        cong,
        dat,
        moTa: de.length === 0
            ? 'Thế giới chưa có luật có diễn giải hay thần nào để dựng bài thi. Chưa đo được gì.'
            : `${de.length} bài · Recall@20 ${(tk.recallAt20 * 100).toFixed(0)}% · ` +
                `nDCG@10 ${tk.ndcgAt10.toFixed(3)} · dữ liệu vượt quyền lọt ra: ${tk.forbiddenRecall}`,
    };
}
function vungCua(s, chuTheId) {
    if (chuTheId === null)
        return [];
    const ra = [];
    for (const lk of s.links.values()) {
        if (lk.tickDut !== null || lk.quanHe !== 'cu_tru_tai' || lk.tuId !== chuTheId)
            continue;
        ra.push(lk.denId);
    }
    return ra;
}
function domainCua(s, chuTheId) {
    if (chuTheId === null)
        return [];
    const d = doc(s, chuTheId, 'domain');
    return (d?.domains ?? []).map((x) => x.ten);
}
