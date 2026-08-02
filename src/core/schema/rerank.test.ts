/**
 * Cổng Phase 0 — hợp đồng rerank.
 * Phần 77 [BB]; Prompt IDE: "config rerank sai vẫn parse về cấu hình heuristic
 * an toàn hoặc báo lỗi có cấu trúc".
 */
import { describe, it, expect } from 'vitest';
import {
  RerankConfigSchema,
  RerankQuerySchema,
  RerankCandidateSchema,
  RerankResultSchema,
  RerankCacheEntrySchema,
  RetrievalRunSchema,
  RetrievalEvalCaseSchema,
  doCauHinhRerank,
  CAU_HINH_HEURISTIC,
  RERANK_MODES,
  RERANK_TASKS,
} from './rerank.js';
import { EVAL_CASES, CHUNKS_EVAL, CHUNK_CAM, duocNhin } from '../../test/fixtures/retrievalEval.js';

describe('cấu hình rerank an toàn theo mặc định', () => {
  it('mặc định bật, degradeToHeuristic bật, timeout hữu hạn', () => {
    const c = RerankConfigSchema.parse({});
    expect(c.bat).toBe(true);
    expect(c.degradeToHeuristic).toBe(true);
    expect(c.timeoutMs).toBe(3_000);
    expect(c.endpoint.mode).toBe('auto');
    expect(c.candidateK).toBe(120);
    expect(c.outputK).toBe(20);
  });

  it('[BB] config rác KHÔNG throw — rơi về heuristic có cảnh báo có cấu trúc', () => {
    for (const rac of [
      { candidateK: 'nhieu' },
      { timeoutMs: -5 },
      { mmrLambda: 9 },
      { outputK: 0 },
      { endpoint: { mode: 'khong_ton_tai' } },
      42,
      'chuoi',
      [],
    ]) {
      const r = doCauHinhRerank(rac);
      expect(r.daRoiVeHeuristic, JSON.stringify(rac)).toBe(true);
      expect(r.config.endpoint.mode).toBe('heuristic');
      expect(r.canhBao.length).toBeGreaterThan(0);
      expect(RerankConfigSchema.safeParse(r.config).success).toBe(true);
    }
  });

  it('null/undefined cho cấu hình mặc định, không rơi heuristic', () => {
    expect(doCauHinhRerank(undefined).daRoiVeHeuristic).toBe(false);
    expect(doCauHinhRerank({}).daRoiVeHeuristic).toBe(false);
  });

  it('mode proxy nhưng thiếu proxyUrl thì tạm dùng heuristic, vẫn chơi được', () => {
    const r = doCauHinhRerank({ endpoint: { mode: 'proxy_cross_encoder', proxyUrl: '' } });
    expect(r.daRoiVeHeuristic).toBe(true);
    expect(r.config.endpoint.mode).toBe('heuristic');
    expect(r.canhBao[0]).toContain('proxyUrl');
  });

  it('mode proxy có proxyUrl thì giữ nguyên', () => {
    const r = doCauHinhRerank({
      endpoint: { mode: 'proxy_cross_encoder', proxyUrl: 'https://x.invalid/rerank' },
    });
    expect(r.daRoiVeHeuristic).toBe(false);
    expect(r.config.endpoint.mode).toBe('proxy_cross_encoder');
  });

  it('CAU_HINH_HEURISTIC là đích rơi hợp lệ và không cần mạng', () => {
    expect(CAU_HINH_HEURISTIC.endpoint.mode).toBe('heuristic');
    expect(CAU_HINH_HEURISTIC.endpoint.proxyUrl).toBe('');
    expect(CAU_HINH_HEURISTIC.degradeToHeuristic).toBe(true);
  });

  it('năm mode của Phần 77.2 đều khai', () => {
    expect([...RERANK_MODES]).toEqual([
      'heuristic',
      'local_cross_encoder',
      'proxy_cross_encoder',
      'llm_listwise',
      'auto',
    ]);
  });

  it('bảy task của Phần 77.3 đều khai', () => {
    expect(RERANK_TASKS).toHaveLength(7);
    expect([...RERANK_TASKS]).toContain('answer_prayer');
    expect([...RERANK_TASKS]).toContain('world_report');
  });
});

describe('[BB] 77.8 — cache key và trace không được chứa secret', () => {
  const ket = RerankCacheEntrySchema.parse({
    branchId: 'br',
    scopeKey: 'pham_nhan:mortal_ly',
    queryHash: 'qh',
    candidateSetHash: 'ch',
    visibilityHash: 'vh',
    modelKey: 'mk',
    configHash: 'cfgh',
    result: RerankResultSchema.parse({
      queryHash: 'qh',
      modelKey: 'mk',
      orderedChunkIds: ['a', 'b'],
      modeUsed: 'heuristic',
      latencyMs: 4,
      createdAtTick: 10,
    }),
    createdAtTick: 10,
    expiresAtTick: 110,
  });

  it('cache entry có đủ bảy thành phần khóa của 77.8', () => {
    for (const k of [
      'branchId',
      'scopeKey',
      'queryHash',
      'candidateSetHash',
      'visibilityHash',
      'modelKey',
      'configHash',
    ]) {
      expect(Object.keys(ket)).toContain(k);
    }
  });

  it('cache chỉ chứa id/rank/score — không có text, không có password, không có request body', () => {
    const keys = Object.keys(RerankCacheEntrySchema.shape);
    expect(keys).not.toContain('proxyPassword');
    expect(keys).not.toContain('requestBody');
    expect(keys).not.toContain('projectedText');
    const resultKeys = Object.keys(RerankResultSchema.shape);
    expect(resultKeys).not.toContain('texts');
    expect(resultKeys).not.toContain('chunks');
  });

  it('strict chặn nhét thêm password vào cache entry', () => {
    expect(RerankCacheEntrySchema.safeParse({ ...ket, proxyPassword: 'bimat' }).success).toBe(false);
  });

  it('hạn cache tính theo TICK, không theo thời gian máy', () => {
    expect(ket.expiresAtTick - ket.createdAtTick).toBe(100);
    expect(Object.keys(RerankCacheEntrySchema.shape)).not.toContain('expiresAt');
  });

  it('RetrievalRun theo dõi forbiddenCount và mặc định là 0', () => {
    const run = RetrievalRunSchema.parse({
      branchId: 'br',
      scopeKey: 'sang_the:root',
      queryHash: 'q',
      task: 'world_report',
      candidateCount: 30,
      selectedCount: 12,
      modeUsed: 'heuristic',
      latencyMs: 3,
      cacheHit: false,
      createdAtTick: 5,
    });
    expect(run.forbiddenCount).toBe(0);
  });
});

describe('[BB] 77.3 — candidate mang projectedText, không mang nội dung gốc', () => {
  it('schema candidate không có trường noiDung gốc', () => {
    const keys = Object.keys(RerankCandidateSchema.shape);
    expect(keys).toContain('projectedText');
    expect(keys).toContain('visibilityHash');
    expect(keys).not.toContain('noiDung');
    expect(keys).not.toContain('rawText');
  });

  it('candidate parse được và strict chặn trường lạ', () => {
    const base = {
      chunkId: 'ck1',
      sourceType: 'lorebook',
      projectedText: 'đã chiếu',
      initialRank: 1,
      initialRrf: 0.5,
      graphDistance: 2,
      trust: 0.7,
      tick: 100,
      storylineId: null,
      visibilityHash: 'vh',
    };
    expect(RerankCandidateSchema.safeParse(base).success).toBe(true);
    expect(RerankCandidateSchema.safeParse({ ...base, noiDung: 'gốc' }).success).toBe(false);
  });

  it('initialRank bắt đầu từ 1, không phải 0', () => {
    expect(
      RerankCandidateSchema.safeParse({
        chunkId: 'c',
        sourceType: 's',
        projectedText: '',
        initialRank: 0,
        initialRrf: 0,
        graphDistance: null,
        trust: 0,
        tick: 0,
        storylineId: null,
        visibilityHash: 'v',
      }).success,
    ).toBe(false);
  });

  it('RerankQuery mang scopeKey để cache không dùng chéo chủ thể', () => {
    const q = RerankQuerySchema.parse({
      id: 'q1',
      branchId: 'br',
      scopeKey: 'pham_nhan:mortal_ly',
      task: 'narrate_scene',
      focusText: 'x',
      tick: 1,
      queryHash: 'h',
    });
    expect(q.scopeKey).toContain('pham_nhan');
  });
});

describe('fixture retrieval-eval đủ bốn loại chunk', () => {
  it('có chunk đúng, nhiễu, trùng nguồn và chunk cấm', () => {
    expect(CHUNKS_EVAL.length).toBeGreaterThanOrEqual(8);
    const theoNguon = new Map<string, number>();
    for (const c of CHUNKS_EVAL) theoNguon.set(c.nguonId, (theoNguon.get(c.nguonId) ?? 0) + 1);
    // Ít nhất một nguồn có nhiều hơn một chunk → MMR có cái để phạt.
    expect([...theoNguon.values()].some((n) => n > 1)).toBe(true);
    expect(CHUNK_CAM.length).toBeGreaterThanOrEqual(3);
  });

  it('mọi eval case parse được', () => {
    for (const c of EVAL_CASES) {
      expect(RetrievalEvalCaseSchema.safeParse(c).success, c.id).toBe(true);
    }
  });

  it('[BB] chunk cấm của tầng phàm nhân THẬT SỰ không nhìn được', () => {
    const ca = EVAL_CASES.find((c) => c.mode === 'pham_nhan');
    expect(ca).toBeDefined();
    for (const id of ca!.forbiddenChunkIds) {
      const chunk = CHUNKS_EVAL.find((c) => c.id === id);
      expect(chunk, `thiếu chunk cấm ${id}`).toBeDefined();
      expect(duocNhin(chunk!, ca!.mode, ca!.chuTheId), `chunk cấm ${id} lại nhìn được`).toBe(false);
    }
  });

  it('chunk liên quan của mỗi case đều nhìn được — nếu không thì gold set sai', () => {
    for (const ca of EVAL_CASES) {
      for (const id of ca.relevantChunkIds) {
        const chunk = CHUNKS_EVAL.find((c) => c.id === id);
        expect(chunk, `thiếu chunk ${id}`).toBeDefined();
        expect(duocNhin(chunk!, ca.mode, ca.chuTheId), `chunk đúng ${id} lại bị che`).toBe(true);
      }
    }
  });

  it('không chunk nào vừa liên quan vừa bị cấm trong cùng một case', () => {
    for (const ca of EVAL_CASES) {
      const giao = ca.relevantChunkIds.filter((i) => ca.forbiddenChunkIds.includes(i));
      expect(giao, `case ${ca.id} có chunk vừa đúng vừa cấm`).toEqual([]);
    }
  });

  it('Sáng Thế thấy tất cả — không case nào ở tầng Sáng Thế có chunk cấm', () => {
    const st = EVAL_CASES.find((c) => c.mode === 'sang_the');
    expect(st?.forbiddenChunkIds).toEqual([]);
  });

  it('[BB] văn bản luật gốc là chunk cấm ở tầng phàm nhân — Phần 18.2', () => {
    const luatGoc = CHUNKS_EVAL.find((c) => c.id === 'ck_cam_van_ban_luat');
    expect(duocNhin(luatGoc!, 'pham_nhan', 'mortal_ly')).toBe(false);
    expect(duocNhin(luatGoc!, 'sang_the', null)).toBe(true);
  });

  it('[BB] bản tính thật của thần là chunk cấm ở tầng phàm nhân', () => {
    const banTinh = CHUNKS_EVAL.find((c) => c.id === 'ck_cam_ban_tinh_that');
    expect(duocNhin(banTinh!, 'pham_nhan', 'mortal_ly')).toBe(false);
  });
});
