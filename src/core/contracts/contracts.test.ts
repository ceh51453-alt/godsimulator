/**
 * Cổng Phase 0 — bốn hợp đồng lõi + Zod 4.
 * Phần 61.1 #1, #5; 61.3 [BB].
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { PatchOpSchema, EventSchema, SceneSchema, WorldSchema, PlayerStateSchema } from './core.js';
import {
  ExprNodeSchema,
  PatchTemplateSchema,
  EntityRefSchema,
  BlockReasonSchema,
  ImportIssueSchema,
  scopeKeyOf,
} from './primitives.js';
import { loi, parseAnToan, dat, hong, StructuredErrorSchema } from './errors.js';
import { WORLD_FIXTURE, ENTITIES_FIXTURE, LINKS_FIXTURE } from '../../test/fixtures/world.js';
import { EntitySchema, LinkSchema } from '../schema/entity.js';

describe('[BB] Zod 4 — prefault khác default (cổng 61.1 #1)', () => {
  it('prefault chạy lại validation trên giá trị dự phòng; default thì không', () => {
    const p = z.string().trim().prefault('  x  ');
    const d = z.string().trim().default('  x  ');
    expect(p.parse(undefined)).toBe('x');
    expect(d.parse(undefined)).toBe('  x  ');
  });

  it('prefault có mặt trên bản Zod đang dùng', () => {
    expect(typeof z.string().prefault).toBe('function');
  });
});

describe('bốn hợp đồng lõi — Phần 61.3', () => {
  it('World fixture parse được và giữ nguyên qua JSON round-trip', () => {
    const lai = WorldSchema.parse(JSON.parse(JSON.stringify(WORLD_FIXTURE)));
    expect(lai).toEqual(WORLD_FIXTURE);
  });

  it('PlayerState mặc định là Sáng Thế, chưa setup, không trỏ hồ sơ nào', () => {
    const ps = PlayerStateSchema.parse(undefined);
    expect(ps.mode).toBe('sang_the');
    expect(ps.chuTheId).toBeNull();
    expect(ps.playerProfileId).toBeNull();
    expect(ps.setupCompleted).toBe(false);
    expect(ps.setupVersion).toBe(0);
  });

  it('[BB] PlayerState chỉ giữ CON TRỎ hồ sơ, không giữ nội dung', () => {
    const keys = Object.keys(PlayerStateSchema.parse(undefined));
    expect(keys).toContain('playerProfileId');
    expect(keys).not.toContain('displayName');
    expect(keys).not.toContain('privateNotes');
    expect(keys).not.toContain('pronouns');
  });

  it('Event bắt buộc có source và hash; strict từ chối trường lạ', () => {
    const ok = EventSchema.safeParse({
      id: 'ev1',
      branchId: 'br',
      tick: 0,
      loai: 'khoi_tao',
      source: 'engine',
      hash: 'h',
    });
    expect(ok.success).toBe(true);
    expect(EventSchema.safeParse({ id: 'ev1', branchId: 'br', tick: 0, loai: 'x', hash: 'h' }).success).toBe(
      false,
    );
    expect(
      EventSchema.safeParse({
        id: 'ev1',
        branchId: 'br',
        tick: 0,
        loai: 'x',
        source: 'engine',
        hash: 'h',
        truongLa: 1,
      }).success,
    ).toBe(false);
  });

  it('Event tick không được âm', () => {
    expect(
      EventSchema.safeParse({ id: 'e', branchId: 'b', tick: -1, loai: 'x', source: 'engine', hash: 'h' })
        .success,
    ).toBe(false);
  });

  it("source 'ai_validated' là giá trị hợp lệ nhưng phải đi kèm quy trình duyệt", () => {
    const e = EventSchema.parse({
      id: 'e',
      branchId: 'b',
      tick: 1,
      loai: 'x',
      source: 'ai_validated',
      hash: 'h',
    });
    expect(e.source).toBe('ai_validated');
  });

  it('PatchOp mang sourceEventId — mọi thay đổi truy được về một Event', () => {
    const r = PatchOpSchema.safeParse({
      op: 'set',
      target: { table: 'entities', id: 'x', path: 'ten' },
      value: 'y',
    });
    expect(r.success).toBe(false);
    expect(
      PatchOpSchema.safeParse({
        op: 'set',
        target: { table: 'entities', id: 'x', path: 'ten' },
        value: 'y',
        sourceEventId: 'ev1',
      }).success,
    ).toBe(true);
  });

  it('Scene parse được với giá trị tối thiểu', () => {
    const s = SceneSchema.parse({
      id: 'sc',
      branchId: 'br',
      startedAtTick: 0,
      currentTick: 0,
      locationId: null,
      participantIds: [],
      lensId: 'toan_canh',
    });
    expect(s.status).toBe('open');
    expect(s.eventIds).toEqual([]);
  });
});

describe('ExprNode — AST giới hạn, không eval', () => {
  it('parse được biểu thức lồng nhau', () => {
    const e = ExprNodeSchema.parse({
      op: 'and',
      args: [
        {
          op: 'gt',
          args: [
            { op: 'read', path: 'a.b' },
            { op: 'literal', value: 3 },
          ],
        },
        {
          op: 'not',
          args: [
            {
              op: 'eq',
              args: [
                { op: 'read', path: 'c' },
                { op: 'literal', value: null },
              ],
            },
          ],
        },
      ],
    });
    expect(e.op).toBe('and');
    expect(e.args).toHaveLength(2);
  });

  it('từ chối op lạ — không có cửa cho code tùy ý', () => {
    expect(ExprNodeSchema.safeParse({ op: 'exec', args: [] }).success).toBe(false);
    expect(ExprNodeSchema.safeParse({ op: 'call', path: 'eval', args: [] }).success).toBe(false);
  });

  it('JSON round-trip giữ nguyên nghĩa', () => {
    const e = { op: 'or' as const, args: [{ op: 'literal' as const, value: 1, args: [] }] };
    const p = ExprNodeSchema.parse(e);
    expect(ExprNodeSchema.parse(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });

  it('PatchTemplate dùng ExprNode cho id và value', () => {
    const t = PatchTemplateSchema.parse({
      op: 'add',
      table: 'entities',
      idExpr: { op: 'read', path: 'ctx.actorId' },
      path: 'aspects.soul.agency',
      valueExpr: { op: 'literal', value: -5 },
    });
    expect(t.op).toBe('add');
    expect(PatchTemplateSchema.parse(JSON.parse(JSON.stringify(t)))).toEqual(t);
  });
});

describe('error contract', () => {
  it('loi() trả StructuredError hợp lệ', () => {
    const e = loi('patch', 'PATH_MISSING', 'Đường dẫn không tồn tại.', { path: 'a.b' });
    expect(StructuredErrorSchema.safeParse(e).success).toBe(true);
    expect(e.severity).toBe('error');
    expect(e.recoverable).toBe(true);
  });

  it('parseAnToan không throw với dữ liệu rác', () => {
    const r = parseAnToan(EventSchema, { rac: true }, 'event', 'EVENT_INVALID');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.length).toBeGreaterThan(0);
      expect(r.errors[0]?.domain).toBe('event');
    }
  });

  it('parseAnToan trả giá trị đã parse khi hợp lệ', () => {
    const r = parseAnToan(EntityRefSchema, { id: 'x' }, 'schema', 'REF');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.id).toBe('x');
  });

  it('dat/hong tạo KetQua đúng hình dạng', () => {
    expect(dat(1).ok).toBe(true);
    expect(hong([loi('schema', 'X', 'y')]).ok).toBe(false);
  });

  it('BlockReason bắt buộc có code cụ thể, lawId có thể null', () => {
    const b = BlockReasonSchema.parse({
      code: 'LUAT_CAM',
      message: 'Luật Máu cấm điều này.',
      lawId: 'law_mau',
    });
    expect(b.lawId).toBe('law_mau');
    expect(b.recoverable).toBe(true);
  });

  it('ImportIssue có mức quarantine cho preset không tin cậy', () => {
    const i = ImportIssueSchema.parse({ code: 'SCRIPT', severity: 'quarantine', message: 'Có script.' });
    expect(i.severity).toBe('quarantine');
  });
});

describe('scopeKey — Phần 61.5', () => {
  it('không dùng null bên trong compound primary key', () => {
    expect(scopeKeyOf('sang_the', null)).toBe('sang_the:root');
    expect(scopeKeyOf('pham_nhan', 'mortal_ly')).toBe('pham_nhan:mortal_ly');
  });
});

describe('fixture world nhỏ', () => {
  it('mọi entity parse được', () => {
    for (const e of ENTITIES_FIXTURE) {
      expect(EntitySchema.safeParse(e).success, `entity ${e.id}`).toBe(true);
    }
  });

  it('mọi link parse được và trỏ tới entity có thật', () => {
    const ids = new Set(ENTITIES_FIXTURE.map((e) => e.id));
    for (const lk of LINKS_FIXTURE) {
      expect(LinkSchema.safeParse(lk).success, `link ${lk.id}`).toBe(true);
      expect(ids.has(lk.tuId), `link ${lk.id} tuId lạ`).toBe(true);
      expect(ids.has(lk.denId), `link ${lk.id} denId lạ`).toBe(true);
    }
  });

  it('[BB] không thực thể mồ côi — mọi entity có ít nhất một cạnh', () => {
    const bac = new Map(ENTITIES_FIXTURE.map((e) => [e.id, 0]));
    for (const lk of LINKS_FIXTURE) {
      bac.set(lk.tuId, (bac.get(lk.tuId) ?? 0) + 1);
      bac.set(lk.denId, (bac.get(lk.denId) ?? 0) + 1);
    }
    for (const [id, n] of bac) {
      expect(n, `entity '${id}' mồ côi (_degree = 0)`).toBeGreaterThan(0);
    }
  });

  it('[BB] mọi quan hệ trong fixture đều đã khai trong R.relation', async () => {
    const { R, napDungSan } = await import('../registry/index.js');
    napDungSan();
    for (const lk of LINKS_FIXTURE) {
      expect(R.relation.co(lk.quanHe), `quan hệ lạ '${lk.quanHe}'`).toBe(true);
    }
  });

  it('[BB] mọi kind trong fixture đều đã khai trong R.kind', async () => {
    const { R, napDungSan } = await import('../registry/index.js');
    napDungSan();
    for (const e of ENTITIES_FIXTURE) {
      expect(R.kind.co(e.kind), `kind lạ '${e.kind}'`).toBe(true);
    }
  });
});
