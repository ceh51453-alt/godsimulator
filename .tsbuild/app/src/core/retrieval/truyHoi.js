import { RerankCandidateSchema, RerankQuerySchema } from '../schema/rerank.js';
import { chunkDuocThay } from './chunk.js';
import { bopMeo } from '../project/distort.js';
import { moRong, khoangCachDoThi } from '../project/moRong.js';
import { kenhTuVung, kenhNguNghia, kenhDoThi, rrf, TRONG_SO_KENH } from './kenh.js';
import { xepHangHeuristic, fusion, mmr, dongGoiTheoToken, dungKetQua, locOutputAdapter, catChoAdapter, } from './rerank.js';
import { hashCua } from '../engine/hash.js';
export const MACH_RERANK_MOI = Object.freeze({
    hongLienTiep: 0,
    moMach: false,
    conBoQua: 0,
    lyDoCuoi: '',
});
/** [BB] 77.9 — ba lỗi liên tiếp → mở mạch trong 20 request retrieval. */
export const NGUONG_MO_MACH_RERANK = 3;
export const SO_REQUEST_BO_QUA = 20;
export function machSauHong(m, lyDo) {
    const n = m.hongLienTiep + 1;
    const mo = n >= NGUONG_MO_MACH_RERANK;
    return {
        hongLienTiep: n,
        moMach: mo,
        conBoQua: mo ? SO_REQUEST_BO_QUA : 0,
        lyDoCuoi: lyDo,
    };
}
export function machSauThanhCong() {
    return MACH_RERANK_MOI;
}
/** Một request đi qua trong lúc mạch mở. Về 0 thì probe một batch nhỏ. */
export function machSauBoQua(m) {
    if (!m.moMach)
        return m;
    const con = m.conBoQua - 1;
    // [BB] "sau circuit → probe một batch nhỏ; thành công: đóng circuit."
    return con <= 0 ? { ...m, moMach: false, conBoQua: 0, hongLienTiep: 0 } : { ...m, conBoQua: con };
}
/** Dựng ba truy vấn từ view — [BB] 54.6: "đừng nhúng thẳng tin nhắn người chơi". */
export function dungBaTruyVan(view, nc) {
    const ten = nc.tieuDiemIds
        .map((id) => view.entities.get(id))
        .filter((e) => e !== undefined)
        .map((e) => `${e.ten}${e.moTa ? ` (${e.moTa})` : ''}`)
        .join('; ');
    const mach = nc.machDangChieuId ? view.machTruyen.find((m) => m.id === nc.machDangChieuId) : undefined;
    return {
        focusText: [ten, mach ? `Mạch đang chiếu: ${mach.ten}` : ''].filter((x) => x !== '').join('. '),
        intentText: nc.loiNguoiChoi.trim() !== '' ? nc.loiNguoiChoi : (mach?.kyUcMach ?? ''),
        precedentText: mach
            ? `Chuyện thuộc loại "${mach.loai}" đã từng xảy ra chưa, và lần trước kết thúc thế nào?`
            : 'Chuyện tương tự đã từng xảy ra trong thế giới này chưa?',
    };
}
/**
 * Bước đầu tiên, và nó đổi KIỂU DỮ LIỆU.
 *
 * [BB] 54.3 — chunk `laTinDon = true` phải đi qua `bopMeo()` (19.1) trước khi
 * vào ngữ cảnh, KỂ CẢ khi nó được truy hồi đúng.
 */
export function locTamNhin(ds, nc) {
    const ra = [];
    for (const c of ds) {
        if (c.branchId !== nc.view.branchId)
            continue;
        if (!chunkDuocThay(c, { mucChieu: nc.view.mucChieu, vungIds: nc.vungIds, domainIds: nc.domainIds })) {
            continue;
        }
        // Chunk nói về entity chủ thể chưa biết tới thì cũng không tồn tại ở đây.
        if (c.entityIds.length > 0 && !c.entityIds.some((id) => nc.view.entities.has(id)))
            continue;
        let text = c.noiDung;
        let daBopMeo = false;
        if (c.tamNhin.laTinDon) {
            const chang = typeof c.meta['chang'] === 'number' ? c.meta['chang'] : 1;
            const meo = bopMeo('', text, {
                chang,
                triThuc: nc.triThuc,
                thienVi: 'trung_lap',
                seed: `${nc.seed}|chunk|${c.id}`,
            });
            text = meo.moTa;
            daBopMeo = true;
        }
        ra.push(Object.freeze({
            id: c.id,
            nguon: c.nguon,
            nguonId: c.nguonId,
            projectedText: text,
            entityIds: Object.freeze([...c.entityIds]),
            storylineId: c.storylineId,
            trust: c.trust,
            tick: c.tick,
            daBopMeo,
            vector: c.vector,
        }));
    }
    return Object.freeze(ra.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
}
export function scopeKeyCua(view) {
    return `${view.mucChieu}:${view.chuTheId ?? 'root'}`;
}
/**
 * Chạy toàn bộ đường ống.
 *
 * `chunkCam` chỉ dùng để KIỂM, không dùng để lọc: lọc thật đã xảy ra ở
 * `locTamNhin()`. Nếu một id trong `chunkCam` xuất hiện ở kết quả thì đó là bằng
 * chứng lọc hỏng, và bài test phải đỏ — chứ không phải được vá bằng một phép lọc
 * thứ hai ở cuối.
 */
export async function truyHoi(dv, chunkCam = new Set()) {
    const now = dv.dongHo ?? (() => 0);
    const bat = now();
    const canhBao = [];
    // ── 1. LỌC TẦM NHÌN — trước mọi bước chấm điểm ──
    const daChieu = locTamNhin(dv.chunks, {
        view: dv.view,
        vungIds: dv.vungIds,
        domainIds: dv.domainIds,
        seed: dv.seed,
        triThuc: dv.triThuc,
    });
    const traCuu = new Map(daChieu.map((c) => [c.id, c]));
    // ── 2. ba kênh ──
    const mr = moRong(dv.tieuDiemIds, { soHop: 2, view: dv.view, toiDa: 200 });
    const diemEntity = new Map(mr.map((n) => [n.id, n.diem]));
    for (const id of dv.tieuDiemIds)
        diemEntity.set(id, 1);
    const hop = khoangCachDoThi(mr);
    const qGop = `${dv.truyVan.focusText} ${dv.truyVan.intentText} ${dv.truyVan.precedentText}`;
    const kTuVung = kenhTuVung(daChieu, qGop);
    const kNguNghia = kenhNguNghia(daChieu, qGop, dv.boNhung ?? null);
    const kDoThi = kenhDoThi(daChieu, diemEntity, dv.machDangChieuId);
    if (!kNguNghia.songKhoe) {
        canhBao.push('Kênh ngữ nghĩa không chạy — RAG tiếp tục với hai kênh còn lại.');
    }
    // ── 3. RRF, lấy top candidateK ──
    const hopNhat = rrf([
        { ten: 'tu_vung', kq: kTuVung, trongSo: TRONG_SO_KENH.tuVung },
        { ten: 'ngu_nghia', kq: kNguNghia, trongSo: TRONG_SO_KENH.nguNghia },
        { ten: 'do_thi', kq: kDoThi, trongSo: TRONG_SO_KENH.doThi },
    ]).slice(0, dv.config.candidateK);
    const candidates = hopNhat.map((m, i) => {
        const c = traCuu.get(m.chunkId);
        return RerankCandidateSchema.parse({
            chunkId: m.chunkId,
            sourceType: c?.nguon ?? '',
            projectedText: c?.projectedText ?? '',
            initialRank: i + 1,
            initialRrf: m.diem,
            graphDistance: c ? (hop.get(c.entityIds[0] ?? '') ?? null) : null,
            trust: c?.trust ?? 0,
            tick: c?.tick ?? 0,
            storylineId: c?.storylineId ?? null,
            entityRefs: (c?.entityIds ?? []).map((id) => ({ id })),
            visibilityHash: dv.view.visibilityHash,
            nguonId: c?.nguonId ?? '',
        });
    });
    const query = RerankQuerySchema.parse({
        id: `rq_${dv.view.branchId}_${dv.view.tick}_${dv.task}`,
        branchId: dv.view.branchId,
        scopeKey: scopeKeyCua(dv.view),
        task: dv.task,
        focusText: dv.truyVan.focusText,
        intentText: dv.truyVan.intentText,
        precedentText: dv.truyVan.precedentText,
        entityRefs: dv.tieuDiemIds.map((id) => ({ id })),
        storylineId: dv.machDangChieuId,
        tick: dv.view.tick,
        queryHash: hashCua([dv.truyVan, dv.task, dv.tieuDiemIds, dv.machDangChieuId]),
    });
    const modelKey = dv.config.endpoint.mode === 'heuristic'
        ? 'heuristic'
        : `${dv.config.endpoint.mode}:${dv.config.endpoint.modelId || 'khong_ten'}`;
    const khoa = {
        branchId: query.branchId,
        scopeKey: query.scopeKey,
        queryHash: query.queryHash,
        candidateSetHash: hashCua([...candidates.map((c) => c.chunkId)].sort()),
        visibilityHash: dv.view.visibilityHash,
        modelKey,
        configHash: hashCua({ ...dv.config, endpoint: { ...dv.config.endpoint, proxyPassword: '' } }),
    };
    // ── cache ──
    const daCache = await dv.cacheDoc?.(khoa);
    if (daCache) {
        const goiLai = daCache.orderedChunkIds
            .map((id) => traCuu.get(id))
            .filter((c) => c !== undefined);
        return {
            query,
            candidates,
            ketQua: daCache,
            daChon: goiLai,
            // Cache chỉ chứa id/rank/score (77.8) — lý do chọn không được lưu, và đó
            // là đúng: lưu thêm nghĩa là cache to hơn mà không mua thêm điều gì.
            lyDo: new Map(),
            biCat: [],
            tongToken: goiLai.reduce((t, c) => t + Math.ceil(c.projectedText.length / dv.tyLeToken), 0),
            run: {
                branchId: query.branchId,
                scopeKey: query.scopeKey,
                queryHash: query.queryHash,
                task: dv.task,
                candidateCount: candidates.length,
                selectedCount: goiLai.length,
                modeUsed: daCache.modeUsed,
                latencyMs: 0,
                cacheHit: true,
                fallbackReason: daCache.fallbackReason,
                forbiddenCount: goiLai.filter((c) => chunkCam.has(c.id)).length,
                createdAtTick: dv.view.tick,
            },
            machMoi: dv.mach ?? MACH_RERANK_MOI,
            canhBao,
            chunkCamLotVao: goiLai.filter((c) => chunkCam.has(c.id)).map((c) => c.id),
        };
    }
    // ── 4. heuristic rerank — LUÔN chạy, kể cả khi có semantic ──
    const ncH = {
        tick: dv.view.tick,
        nhip: dv.view.nhipThoiGian,
        tuning: dv.tuning,
        task: dv.task,
        storylineDangChieuId: dv.machDangChieuId,
    };
    const hHeuristic = xepHangHeuristic(candidates, ncH);
    const hangHeuristic = new Map(hHeuristic.map((x, i) => [x.chunkId, i + 1]));
    // ── 5. semantic rerank tùy chọn ──
    let mach = dv.mach ?? MACH_RERANK_MOI;
    let hangSemantic = null;
    let fallbackReason = '';
    let modeUsed = dv.config.endpoint.mode;
    const muonSemantic = dv.config.bat && dv.adapter != null && dv.config.endpoint.mode !== 'heuristic' && candidates.length > 1;
    if (muonSemantic && mach.moMach) {
        mach = machSauBoQua(mach);
        fallbackReason = `ngắt mạch: ${mach.lyDoCuoi}`;
        modeUsed = 'heuristic';
    }
    else if (muonSemantic && dv.adapter) {
        const tuKhoa = [
            ...new Set(`${dv.truyVan.focusText} ${dv.truyVan.intentText}`.toLowerCase().split(/\s+/)),
        ];
        const goi = candidates.map((c) => ({
            chunkId: c.chunkId,
            projectedText: catChoAdapter(c.projectedText, tuKhoa, dv.config.maxChunkTokens, dv.tyLeToken),
        }));
        try {
            const ra = await dv.adapter.xepHang({
                focusText: dv.truyVan.focusText,
                intentText: dv.truyVan.intentText,
                precedentText: dv.truyVan.precedentText,
            }, goi);
            const sach = locOutputAdapter(ra.orderedChunkIds, new Set(candidates.map((c) => c.chunkId)));
            if (sach === null) {
                mach = machSauHong(mach, 'adapter trả id ngoài tập candidate');
                fallbackReason = 'output adapter không hợp lệ';
                modeUsed = 'heuristic';
                canhBao.push('Reranker trả id lạ — đã bỏ toàn bộ kết quả của nó và dùng heuristic.');
            }
            else {
                hangSemantic = new Map(sach.map((id, i) => [id, i + 1]));
                mach = machSauThanhCong();
            }
        }
        catch (e) {
            mach = machSauHong(mach, e instanceof Error ? e.message : 'lỗi không rõ');
            fallbackReason = `adapter lỗi: ${mach.lyDoCuoi}`;
            modeUsed = 'heuristic';
            canhBao.push(`Reranker hỏng (${mach.lyDoCuoi}) — dùng heuristic, lượt chơi không bị chặn.`);
        }
    }
    else {
        modeUsed = 'heuristic';
    }
    // ── 6. fusion theo thứ hạng ──
    const hangDoThi = new Map([...kDoThi.diem.entries()]
        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
        .map(([id], i) => [id, i + 1]));
    const daFusion = fusion({
        candidates,
        hangHeuristic,
        hangSemantic,
        hangDoThi,
        config: dv.config,
        tuning: dv.tuning,
        task: dv.task,
        tick: dv.view.tick,
        nhip: dv.view.nhipThoiGian,
    });
    // ── 7. MMR ──
    const traMmr = new Map(candidates.map((c) => [c.chunkId, { projectedText: c.projectedText, nguonId: c.nguonId }]));
    const daMmr = mmr(daFusion, traMmr, dv.config.mmrLambda, Math.min(dv.config.outputK * 2, daFusion.length));
    // ── 8. đóng gói theo token budget ──
    const traGoi = new Map(candidates.map((c) => [
        c.chunkId,
        {
            projectedText: c.projectedText,
            nguonId: c.nguonId,
            nguon: c.sourceType,
            graphDistance: c.graphDistance,
            laTienLe: c.sourceType === 'bien_nien' || c.sourceType === 'ky_uc_mach',
        },
    ]));
    const goi = dongGoiTheoToken(daMmr, traGoi, {
        nganSachToken: dv.nganSachToken,
        outputK: dv.config.outputK,
        tyLeToken: dv.tyLeToken,
        tranTyLeMotNguon: dv.tuning.rerank.tranTyLeMotNguon,
    });
    canhBao.push(...goi.canhBao);
    const latencyMs = Math.max(0, now() - bat);
    const ketQua = dungKetQua(query, goi, { modelKey, modeUsed, latencyMs, fallbackReason });
    /**
     * [BB] 77.8 — CHỈ cache kết quả không fallback.
     *
     * Cache một kết quả heuristic sinh ra vì endpoint vừa chết sẽ khóa cả nhánh vào
     * kết quả ấy trong `cacheTtlTicks` nhịp, kể cả sau khi endpoint sống lại. Ngắt
     * mạch đã đủ để tránh gọi mạng; cache thì không nên nhớ một tai nạn.
     */
    if (fallbackReason === '')
        await dv.cacheGhi?.(khoa, ketQua);
    const daChon = goi.chon.map((m) => traCuu.get(m.chunkId)).filter((c) => c !== undefined);
    const camLot = daChon.filter((c) => chunkCam.has(c.id)).map((c) => c.id);
    return {
        query,
        candidates,
        ketQua,
        daChon,
        lyDo: new Map(goi.chon.map((m) => [m.chunkId, m.lyDo])),
        biCat: goi.biCat,
        tongToken: goi.tongToken,
        run: {
            branchId: query.branchId,
            scopeKey: query.scopeKey,
            queryHash: query.queryHash,
            task: dv.task,
            candidateCount: candidates.length,
            selectedCount: daChon.length,
            modeUsed,
            latencyMs,
            cacheHit: false,
            fallbackReason,
            forbiddenCount: camLot.length,
            createdAtTick: dv.view.tick,
        },
        machMoi: mach,
        canhBao,
        chunkCamLotVao: camLot,
    };
}
