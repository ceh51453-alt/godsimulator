/**
 * Cổng Phase 1 — lõi deterministic.
 *
 * Cổng (Phần 75 Phase 1 + Prompt IDE):
 *   - 10.000 bước cùng seed cho cùng hash;
 *   - patch lỗi không để state nửa vời;
 *   - Event cause hợp lệ (không cycle, không tương lai);
 *   - core/ không phụ thuộc UI/DB/network (đã có `source-guards.test.ts`).
 */
import { describe, it, expect } from 'vitest';
import { taoRng, tuTrangThai, rngCuaTick } from './rng.js';
import { bam, chuanHoa, hashCua, hashTap, hashGop } from './hash.js';
import { tinhExpr, dieuKienDung, docDuongDan, DO_SAU_TOI_DA } from './expr.js';
import type { ExprNode } from '../contracts/primitives.js';
import { taoState, taoEventLog, hashState, saoChepState, taoKhoBoNho } from './state.js';
import { apPatch, docTheoTarget, phamVi } from './patch.js';
import { apDungEvent, apDungChuoi, taoEvent, hashEvent, kiemNhanQua } from './transaction.js';
import { chayInvariant } from './invariant.js';
import { replay, kiemDeterminism } from './replay.js';
import { WorldSchema } from '../contracts/core.js';
import type { Event, PatchOp, World } from '../contracts/core.js';
import { EntitySchema } from '../schema/entity.js';

// ─────────────────────────────────────────── tiện ích test

const WORLD: World = WorldSchema.parse({
  id: 'w',
  branchId: 'br',
  seed: 'hat-giong-thu-nghiem',
  tick: 0,
  eraId: 'era0',
  year: 0,
  tuningProfileId: 'co_dien',
  playerState: {},
  version: 0,
});

const entity = (id: string, extra: Record<string, unknown> = {}) =>
  EntitySchema.parse({ id, branchId: 'br', kind: 'concept', ten: id, tickSinh: 0, ...extra });

const p = (
  op: PatchOp['op'],
  table: string,
  id: string,
  path: string,
  value: unknown,
  sourceEventId = 'ev1',
): PatchOp => ({ op, target: { table, id, path }, value, sourceEventId }) as PatchOp;

function stateVoi(...ids: string[]) {
  const s = taoState(structuredClone(WORLD));
  for (const id of ids) s.entities.set(id, entity(id));
  return s;
}

// ─────────────────────────────────────────── RNG

describe('RNG seeded — luật bất biến #7', () => {
  it('cùng seed cho cùng chuỗi số', () => {
    const a = taoRng('abc');
    const b = taoRng('abc');
    const da = Array.from({ length: 200 }, () => a.ke());
    const db = Array.from({ length: 200 }, () => b.ke());
    expect(da).toEqual(db);
  });

  it('seed khác cho chuỗi khác', () => {
    const a = Array.from({ length: 50 }, taoRng('abc').ke);
    const b = Array.from({ length: 50 }, taoRng('abd').ke);
    expect(a).not.toEqual(b);
  });

  it('ke() luôn trong [0, 1)', () => {
    const r = taoRng('mien');
    for (let i = 0; i < 5000; i++) {
      const v = r.ke();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('d100 luôn trong [1, 100] và phủ hết hai đầu', () => {
    const r = taoRng('d100');
    let min = 101;
    let max = 0;
    for (let i = 0; i < 20000; i++) {
      const v = r.d100();
      expect(Number.isInteger(v)).toBe(true);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    expect(min).toBe(1);
    expect(max).toBe(100);
  });

  it('nguyen(n) trong [0, n) và chịu được đầu vào xấu', () => {
    const r = taoRng('n');
    for (let i = 0; i < 1000; i++) expect(r.nguyen(7)).toBeLessThan(7);
    expect(r.nguyen(0)).toBe(0);
    expect(r.nguyen(-5)).toBe(0);
    expect(r.nguyen(Number.NaN)).toBe(0);
  });

  it('khoang(a, b) lấy cả hai đầu và không phụ thuộc thứ tự tham số', () => {
    const r = taoRng('k');
    const thay = new Set<number>();
    for (let i = 0; i < 3000; i++) thay.add(r.khoang(5, 8));
    expect([...thay].sort()).toEqual([5, 6, 7, 8]);
    expect(taoRng('x').khoang(8, 5)).toBe(taoRng('x').khoang(5, 8));
  });

  it('co(p) tôn trọng biên 0 và 1 mà không tiêu số ngẫu nhiên', () => {
    const r = taoRng('c');
    expect(r.co(0)).toBe(false);
    expect(r.co(1)).toBe(true);
    expect(r.soLanRut()).toBe(0);
  });

  it('tron() trả mảng mới, không sửa tại chỗ, và deterministic', () => {
    const goc = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = taoRng('t').tron(goc);
    const b = taoRng('t').tron(goc);
    expect(a).toEqual(b);
    expect(goc).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...a].sort((x, y) => x - y)).toEqual(goc);
  });

  it('chon() trên mảng rỗng trả undefined', () => {
    expect(taoRng('e').chon([])).toBeUndefined();
  });

  it('softmax nghiêng về điểm cao và deterministic', () => {
    const diem = [0, 0, 100];
    const r = taoRng('sm');
    let chon2 = 0;
    for (let i = 0; i < 1000; i++) if (r.softmax(diem, 0.35) === 2) chon2++;
    expect(chon2).toBeGreaterThan(950);
    expect(taoRng('q').softmax(diem, 0.35)).toBe(taoRng('q').softmax(diem, 0.35));
  });

  it('softmax với mảng rỗng trả -1 và một phần tử trả 0', () => {
    const r = taoRng('sm2');
    expect(r.softmax([], 1)).toBe(-1);
    expect(r.softmax([5], 1)).toBe(0);
  });

  it('nhánh RNG độc lập và tái lập được', () => {
    const a = taoRng('goc').nhanh('kenh-a');
    const b = taoRng('goc').nhanh('kenh-a');
    const c = taoRng('goc').nhanh('kenh-b');
    expect(a.ke()).toBe(b.ke());
    expect(taoRng('goc').nhanh('kenh-a').ke()).not.toBe(c.ke());
  });

  it('khôi phục từ trạng thái cho đúng chuỗi tiếp theo', () => {
    const r = taoRng('kp');
    for (let i = 0; i < 37; i++) r.ke();
    const tiep = tuTrangThai(r.trangThai(), r.soLanRut());
    expect(tiep.ke()).toBe(taoRng('kp').ke.call(null) === 0 ? tiep.ke() : r.ke());
  });

  it('rngCuaTick tách kênh nên thứ tự chạy giữa các hệ không ảnh hưởng nhau', () => {
    const a1 = rngCuaTick('s', 10, 'dan_so').ke();
    const b1 = rngCuaTick('s', 10, 'thoi_tiet').ke();
    // Đảo thứ tự gọi
    const b2 = rngCuaTick('s', 10, 'thoi_tiet').ke();
    const a2 = rngCuaTick('s', 10, 'dan_so').ke();
    expect(a1).toBe(a2);
    expect(b1).toBe(b2);
    expect(a1).not.toBe(b1);
  });
});

// ─────────────────────────────────────────── hash

describe('canonical hash', () => {
  it('độc lập thứ tự khóa object', () => {
    expect(hashCua({ a: 1, b: 2 })).toBe(hashCua({ b: 2, a: 1 }));
  });

  it('phụ thuộc thứ tự phần tử mảng', () => {
    expect(hashCua([1, 2])).not.toBe(hashCua([2, 1]));
  });

  it('phân biệt kiểu: 1 khác "1" khác true', () => {
    expect(hashCua(1)).not.toBe(hashCua('1'));
    expect(hashCua(1)).not.toBe(hashCua(true));
    expect(hashCua(null)).not.toBe(hashCua(undefined));
  });

  it('phân biệt khóa vắng mặt với giá trị undefined', () => {
    expect(hashCua({ a: 1 })).not.toBe(hashCua({ a: 1, b: undefined }));
  });

  it('phân biệt chuỗi có thể gây nhập nhằng khi nối', () => {
    expect(hashCua(['ab', 'c'])).not.toBe(hashCua(['a', 'bc']));
    expect(chuanHoa('ab')).toContain('2:ab');
  });

  it('0 và -0 băm giống nhau; NaN ổn định', () => {
    expect(hashCua(0)).toBe(hashCua(-0));
    expect(hashCua(Number.NaN)).toBe(hashCua(Number.NaN));
  });

  it('hashTap độc lập thứ tự duyệt', () => {
    expect(hashTap([{ a: 1 }, { b: 2 }])).toBe(hashTap([{ b: 2 }, { a: 1 }]));
  });

  it('hashGop gắn nhãn nên không lẫn bảng', () => {
    expect(hashGop({ x: 'h1', y: 'h2' })).toBe(hashGop({ y: 'h2', x: 'h1' }));
    expect(hashGop({ x: 'h1', y: 'h2' })).not.toBe(hashGop({ x: 'h2', y: 'h1' }));
  });

  it('chịu được tham chiếu vòng mà không tràn stack', () => {
    const a: Record<string, unknown> = { ten: 'a' };
    a['tu'] = a;
    expect(() => hashCua(a)).not.toThrow();
  });

  it('bam ổn định và dài 16 hex', () => {
    expect(bam('xin chào')).toBe(bam('xin chào'));
    expect(bam('a')).toMatch(/^[0-9a-f]{16}$/);
    expect(bam('a')).not.toBe(bam('b'));
  });

  it('không đụng độ trên 20.000 chuỗi gần nhau', () => {
    const thay = new Set<string>();
    for (let i = 0; i < 20000; i++) thay.add(bam(`entity_${i}`));
    expect(thay.size).toBe(20000);
  });
});

// ─────────────────────────────────────────── Expr

describe('ExprNode — thay thế eval (ADR-0003)', () => {
  const nguon = { a: { b: 3 }, ds: [1, 2, 3], s: 'xin chào', t: true };
  const E = (o: unknown): ExprNode => o as ExprNode;

  it('literal và read', () => {
    expect(tinhExpr(E({ op: 'literal', value: 42, args: [] }), nguon)).toMatchObject({ value: 42 });
    expect(tinhExpr(E({ op: 'read', path: 'a.b', args: [] }), nguon)).toMatchObject({ value: 3 });
  });

  it('read đường dẫn không tồn tại trả undefined, không throw', () => {
    expect(tinhExpr(E({ op: 'read', path: 'khong.co.gi', args: [] }), nguon)).toMatchObject({
      value: undefined,
    });
  });

  it('[BB] read chặn __proto__ / constructor / prototype', () => {
    for (const xau of ['__proto__', 'a.constructor', 'a.prototype', '__proto__.polluted']) {
      expect(docDuongDan(nguon, xau)).toBeUndefined();
    }
  });

  it('so sánh số và chuỗi', () => {
    expect(
      dieuKienDung(
        E({
          op: 'gt',
          args: [
            { op: 'literal', value: 5 },
            { op: 'literal', value: 3 },
          ],
        }),
        nguon,
      ),
    ).toBe(true);
    expect(
      dieuKienDung(
        E({
          op: 'lte',
          args: [
            { op: 'literal', value: 3 },
            { op: 'literal', value: 3 },
          ],
        }),
        nguon,
      ),
    ).toBe(true);
    expect(
      dieuKienDung(
        E({
          op: 'lt',
          args: [
            { op: 'literal', value: 'a' },
            { op: 'literal', value: 'b' },
          ],
        }),
        nguon,
      ),
    ).toBe(true);
  });

  it('so sánh kiểu không so được → false kèm cảnh báo, không sập', () => {
    const r = tinhExpr(
      E({
        op: 'gt',
        args: [
          { op: 'literal', value: 'a' },
          { op: 'literal', value: 1 },
        ],
      }),
      nguon,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBe(false);
      expect(r.warnings.length).toBeGreaterThan(0);
    }
  });

  it('and/or ngắn mạch nhưng vẫn deterministic', () => {
    expect(
      dieuKienDung(
        E({
          op: 'and',
          args: [
            { op: 'literal', value: true },
            { op: 'literal', value: false },
          ],
        }),
        nguon,
      ),
    ).toBe(false);
    expect(
      dieuKienDung(
        E({
          op: 'or',
          args: [
            { op: 'literal', value: false },
            { op: 'literal', value: true },
          ],
        }),
        nguon,
      ),
    ).toBe(true);
    expect(dieuKienDung(E({ op: 'and', args: [] }), nguon)).toBe(true);
    expect(dieuKienDung(E({ op: 'or', args: [] }), nguon)).toBe(false);
  });

  it('chỉ đúng boolean true mới là thật — không ép kiểu ngầm', () => {
    expect(dieuKienDung(E({ op: 'literal', value: 1 }), nguon)).toBe(false);
    expect(dieuKienDung(E({ op: 'literal', value: 'yes' }), nguon)).toBe(false);
    expect(dieuKienDung(E({ op: 'literal', value: true }), nguon)).toBe(true);
  });

  it('eq không ép kiểu: 1 khác "1"', () => {
    expect(
      dieuKienDung(
        E({
          op: 'eq',
          args: [
            { op: 'literal', value: 1 },
            { op: 'literal', value: '1' },
          ],
        }),
        nguon,
      ),
    ).toBe(false);
  });

  it('in hoạt động với mảng, Set và chuỗi', () => {
    expect(
      dieuKienDung(
        E({
          op: 'in',
          args: [
            { op: 'literal', value: 2 },
            { op: 'read', path: 'ds' },
          ],
        }),
        nguon,
      ),
    ).toBe(true);
    expect(
      dieuKienDung(
        E({
          op: 'in',
          args: [
            { op: 'literal', value: 9 },
            { op: 'read', path: 'ds' },
          ],
        }),
        nguon,
      ),
    ).toBe(false);
    expect(
      dieuKienDung(
        E({
          op: 'in',
          args: [
            { op: 'literal', value: 'chào' },
            { op: 'read', path: 's' },
          ],
        }),
        nguon,
      ),
    ).toBe(true);
  });

  it('thiếu tham số trả lỗi có cấu trúc, không throw', () => {
    const r = tinhExpr(E({ op: 'eq', args: [{ op: 'literal', value: 1 }] }), nguon);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('EXPR_MISSING_ARG');
  });

  it('cây quá sâu bị chặn, không tràn stack', () => {
    let node: unknown = { op: 'literal', value: true, args: [] };
    for (let i = 0; i < DO_SAU_TOI_DA + 5; i++) node = { op: 'not', args: [node] };
    const r = tinhExpr(E(node), nguon);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('EXPR_TOO_DEEP');
  });

  it('cùng biểu thức + cùng nguồn luôn cho cùng kết quả', () => {
    const e = E({
      op: 'and',
      args: [
        {
          op: 'gt',
          args: [
            { op: 'read', path: 'a.b' },
            { op: 'literal', value: 1 },
          ],
        },
        {
          op: 'in',
          args: [
            { op: 'literal', value: 3 },
            { op: 'read', path: 'ds' },
          ],
        },
      ],
    });
    for (let i = 0; i < 100; i++) expect(dieuKienDung(e, nguon)).toBe(true);
  });
});

// ─────────────────────────────────────────── patch

describe('[BB] patch lỗi không để state nửa vời', () => {
  it('lô patch hợp lệ áp hết', () => {
    const s = stateVoi('e1', 'e2');
    const r = apPatch(s, [p('set', 'entities', 'e1', 'ten', 'Mới'), p('set', 'entities', 'e2', 'moTa', 'x')]);
    expect(r.ok).toBe(true);
    expect(s.entities.get('e1')?.ten).toBe('Mới');
    expect(s.entities.get('e2')?.moTa).toBe('x');
  });

  it('patch thứ hai hỏng thì patch thứ nhất KHÔNG lưu lại dấu vết', () => {
    const s = stateVoi('e1');
    const truoc = hashState(s);
    const r = apPatch(s, [
      p('set', 'entities', 'e1', 'ten', 'Đã đổi'),
      p('set', 'entities', 'khong_ton_tai', 'ten', 'X'),
    ]);
    expect(r.ok).toBe(false);
    expect(s.entities.get('e1')?.ten).toBe('e1');
    expect(hashState(s)).toBe(truoc);
  });

  it('patch làm hỏng schema bị từ chối, state giữ nguyên', () => {
    const s = stateVoi('e1');
    const truoc = hashState(s);
    // `ten` phải là chuỗi.
    const r = apPatch(s, [p('set', 'entities', 'e1', 'ten', { khong: 'phai chuoi' })]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.code === 'BAN_GHI_HONG_SAU_PATCH')).toBe(true);
    expect(hashState(s)).toBe(truoc);
  });

  it('mul lên chuỗi bị từ chối — Phần 9.2 kiểm tra 3', () => {
    const s = stateVoi('e1');
    const r = apPatch(s, [p('mul', 'entities', 'e1', 'ten', 2)]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('KIEU_KHONG_HOP');
  });

  it('add cộng đúng và tăng _version', () => {
    const s = stateVoi('e1');
    const v0 = s.entities.get('e1')?._version ?? -1;
    const r = apPatch(s, [p('add', 'entities', 'e1', '_degree', 3)]);
    expect(r.ok).toBe(true);
    expect(s.entities.get('e1')?._degree).toBe(3);
    expect(s.entities.get('e1')?._version).toBe(v0 + 1);
  });

  it('push tạo mảng nếu chưa có và không sửa mảng cũ tại chỗ', () => {
    const s = stateVoi('e1');
    apPatch(s, [p('push', 'entities', 'e1', 'tags', 'a')]);
    const sauMot = s.entities.get('e1')?.tags;
    apPatch(s, [p('push', 'entities', 'e1', 'tags', 'b')]);
    expect(s.entities.get('e1')?.tags).toEqual(['a', 'b']);
    expect(sauMot).toEqual(['a']);
  });

  it('remove gỡ phần tử khỏi mảng', () => {
    const s = stateVoi('e1');
    apPatch(s, [p('set', 'entities', 'e1', 'tags', ['a', 'b', 'c'])]);
    apPatch(s, [p('remove', 'entities', 'e1', 'tags', 'b')]);
    expect(s.entities.get('e1')?.tags).toEqual(['a', 'c']);
  });

  it('flag đặt boolean', () => {
    const s = stateVoi('e1');
    apPatch(s, [p('flag', 'entities', 'e1', 'aspects.mortal.dauMau', undefined)]);
    expect(docTheoTarget(s, 'entities', 'e1', 'aspects.mortal.dauMau')).toBe(true);
  });

  it('link tạo bản ghi mới, unlink gỡ đi', () => {
    const s = taoState(structuredClone(WORLD));
    const moi = entity('e9');
    const r1 = apPatch(s, [p('link', 'entities', 'e9', '', moi)]);
    expect(r1.ok).toBe(true);
    expect(s.entities.has('e9')).toBe(true);
    const r2 = apPatch(s, [p('unlink', 'entities', 'e9', '', undefined)]);
    expect(r2.ok).toBe(true);
    expect(s.entities.has('e9')).toBe(false);
  });

  it('link trùng id bị từ chối', () => {
    const s = stateVoi('e1');
    const r = apPatch(s, [p('link', 'entities', 'e1', '', entity('e1'))]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('LINK_TRUNG');
  });

  it('link với bản ghi không hợp lệ bị từ chối', () => {
    const s = taoState(structuredClone(WORLD));
    const r = apPatch(s, [p('link', 'entities', 'xx', '', { thieu: 'moi thu' })]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('LINK_KHONG_HOP_LE');
  });

  it('[BB] chặn prototype pollution qua đường dẫn patch', () => {
    const s = stateVoi('e1');
    for (const xau of ['__proto__.bi', 'constructor.bi', 'a.__proto__.bi']) {
      const r = apPatch(s, [p('set', 'entities', 'e1', xau, 'độc')]);
      expect(r.ok, xau).toBe(false);
    }
    expect(({} as Record<string, unknown>)['bi']).toBeUndefined();
  });

  it('bảng lạ bị từ chối', () => {
    const s = stateVoi('e1');
    const r = apPatch(s, [p('set', 'bang_ma', 'e1', 'ten', 'x')]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('BANG_LA');
  });

  it('expectedVersion lệch thì từ chối — optimistic concurrency', () => {
    const s = stateVoi('e1');
    const op = { ...p('set', 'entities', 'e1', 'ten', 'X'), expectedVersion: 7 };
    const r = apPatch(s, [op]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('VERSION_LECH');
  });

  it('expectedVersion khớp thì cho qua', () => {
    const s = stateVoi('e1');
    const op = { ...p('set', 'entities', 'e1', 'ten', 'X'), expectedVersion: 0 };
    expect(apPatch(s, [op]).ok).toBe(true);
    expect(s.entities.get('e1')?.ten).toBe('X');
  });

  it('sửa world và metrics qua bảng đơn', () => {
    const s = stateVoi('e1');
    expect(apPatch(s, [p('set', 'worlds', 'worlds', 'year', 500)]).ok).toBe(true);
    expect(s.world.year).toBe(500);
    expect(apPatch(s, [p('add', 'metrics', 'metrics', 'realityIntegrity', -15)]).ok).toBe(true);
    expect(s.metrics.realityIntegrity).toBe(85);
  });

  it('metrics ra ngoài khoảng bị schema chặn', () => {
    const s = stateVoi('e1');
    const r = apPatch(s, [p('add', 'metrics', 'metrics', 'realityIntegrity', 50)]);
    expect(r.ok).toBe(false);
    expect(s.metrics.realityIntegrity).toBe(100);
  });
});

// ─────────────────────────────────────────── transaction

describe('transaction — cửa duy nhất để state đổi', () => {
  const ev = (over: Partial<Event> = {}): Event =>
    taoEvent({
      id: 'ev1',
      branchId: 'br',
      tick: 1,
      loai: 'thu_nghiem',
      actorIds: [],
      targetIds: [],
      causeEventIds: [],
      locationId: null,
      patches: [],
      visibility: 'cong_khai',
      source: 'engine',
      payload: {},
      ...over,
    });

  it('event hợp lệ được commit và vào log', () => {
    const s = stateVoi('e1');
    const log = taoEventLog();
    const e = ev({ patches: [p('set', 'entities', 'e1', 'ten', 'Đổi')] });
    const r = apDungEvent(s, e, log, { tinhHash: true });
    expect(r.ok).toBe(true);
    expect(log.soLuong()).toBe(1);
    expect(s.entities.get('e1')?.ten).toBe('Đổi');
    if (r.ok) expect(r.value.hashTruoc).not.toBe(r.value.hashSau);
  });

  it('mặc định KHÔNG tính hash — replay phải là O(n), không O(n²)', () => {
    const s = stateVoi('e1');
    const r = apDungEvent(s, ev(), taoEventLog());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.hashTruoc).toBe('');
      expect(r.value.hashSau).toBe('');
    }
  });

  it('[BB] event có patch hỏng thì ROLLBACK và KHÔNG vào log', () => {
    const s = stateVoi('e1');
    const log = taoEventLog();
    const truoc = hashState(s);
    const e = ev({
      patches: [p('set', 'entities', 'e1', 'ten', 'Đổi'), p('mul', 'entities', 'e1', 'ten', 2)],
    });
    const r = apDungEvent(s, e, log);
    expect(r.ok).toBe(false);
    expect(log.soLuong()).toBe(0);
    expect(hashState(s)).toBe(truoc);
    expect(s.world.version).toBe(0);
  });

  it('[BB] vi phạm invariant nặng thì rollback và event không vào log', () => {
    const s = stateVoi('e1');
    const log = taoEventLog();
    const truoc = hashState(s);
    // Link trỏ vào entity không tồn tại → invariant `link_khong_treo` fatal.
    const lkMoi = {
      id: 'lk_x',
      branchId: 'br',
      tuId: 'e1',
      denId: 'khong_co',
      quanHe: 'nhac_den',
      trongSo: 50,
      tickTao: 0,
      tickDut: null,
      nguon: 'engine',
    };
    const e = ev({ patches: [p('link', 'links', 'lk_x', '', lkMoi)] });
    const r = apDungEvent(s, e, log);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.domain).toBe('invariant');
    expect(log.soLuong()).toBe(0);
    expect(hashState(s)).toBe(truoc);
  });

  it('hash event sai bị từ chối — chống sửa log', () => {
    const s = stateVoi('e1');
    const log = taoEventLog();
    const e = { ...ev(), hash: 'gia_mao' } as Event;
    const r = apDungEvent(s, e, log);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('EVENT_HASH_SAI');
  });

  it('hashEvent không tự tham chiếu trường hash', () => {
    const e = ev();
    expect(hashEvent(e)).toBe(e.hash);
    expect(hashEvent({ ...e, hash: 'khac' })).toBe(e.hash);
  });

  it('patch khai sai sourceEventId bị từ chối', () => {
    const s = stateVoi('e1');
    const log = taoEventLog();
    const e = ev({ patches: [p('set', 'entities', 'e1', 'ten', 'X', 'ev_khac')] });
    const r = apDungEvent(s, e, log);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('PATCH_SAI_NGUON');
  });

  it('event sai nhánh bị từ chối', () => {
    const s = stateVoi('e1');
    const r = apDungEvent(s, ev({ branchId: 'nhanh_khac' }), taoEventLog());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('EVENT_SAI_NHANH');
  });

  it('event lùi tick bị từ chối — tick đơn điệu tăng', () => {
    const s = stateVoi('e1');
    const log = taoEventLog();
    expect(apDungEvent(s, ev({ id: 'a', tick: 5 }), log).ok).toBe(true);
    const r = apDungEvent(s, ev({ id: 'b', tick: 3 }), log);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('EVENT_LUI_TICK');
  });

  it('[BB] nguyên nhân không được đến từ tương lai', () => {
    const s = stateVoi('e1');
    const log = taoEventLog();
    apDungEvent(s, ev({ id: 'a', tick: 10 }), log);
    // Không thể tạo event tick 5 sau đó (lùi tick), nên dựng log thủ công để test riêng.
    const log2 = taoEventLog([ev({ id: 'tuong_lai', tick: 99 })]);
    const errs = kiemNhanQua(ev({ id: 'hien_tai', tick: 5, causeEventIds: ['tuong_lai'] }), log2);
    expect(errs.some((e) => e.code === 'CAUSE_TU_TUONG_LAI')).toBe(true);
  });

  it('[BB] event không được tự nhận mình là nguyên nhân', () => {
    const errs = kiemNhanQua(ev({ id: 'x', causeEventIds: ['x'] }), taoEventLog());
    expect(errs.some((e) => e.code === 'CAUSE_TU_THAM_CHIEU')).toBe(true);
  });

  it('nguyên nhân không tồn tại bị từ chối', () => {
    const errs = kiemNhanQua(ev({ causeEventIds: ['khong_co'] }), taoEventLog());
    expect(errs.some((e) => e.code === 'CAUSE_KHONG_TON_TAI')).toBe(true);
  });

  it('[BB] log là append-only — id trùng bị từ chối', () => {
    const s = stateVoi('e1');
    const log = taoEventLog();
    expect(apDungEvent(s, ev({ id: 'same' }), log).ok).toBe(true);
    const r = apDungEvent(s, ev({ id: 'same', tick: 2 }), log);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((x) => x.code === 'EVENT_TRUNG_ID')).toBe(true);
  });

  it('chuỗi event dừng đúng chỗ và báo vị trí', () => {
    const s = stateVoi('e1');
    const log = taoEventLog();
    const r = apDungChuoi(
      s,
      [
        ev({ id: 'a', tick: 1 }),
        ev({ id: 'b', tick: 2, patches: [p('mul', 'entities', 'e1', 'ten', 2, 'b')] }),
        ev({ id: 'c', tick: 3 }),
      ],
      log,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.message).toContain('thứ 2/3');
    expect(log.soLuong()).toBe(1);
  });
});

// ─────────────────────────────────────────── invariant

describe('invariant runner', () => {
  it('state sạch thì đạt', () => {
    expect(chayInvariant(stateVoi('e1')).dat).toBe(true);
  });

  it('bắt link treo ở mức fatal', () => {
    const s = stateVoi('e1');
    s.links.set('lk', {
      id: 'lk',
      branchId: 'br',
      tuId: 'e1',
      denId: 'ma',
      quanHe: 'nhac_den',
      trongSo: 1,
      tickTao: 0,
      tickDut: null,
      nguon: 'engine',
    });
    const r = chayInvariant(s);
    expect(r.dat).toBe(false);
    expect(r.viPhamNang[0]?.severity).toBe('fatal');
  });

  it('bắt entity sai nhánh', () => {
    const s = stateVoi('e1');
    s.entities.set('lac', { ...entity('lac'), branchId: 'nhanh_khac' });
    expect(chayInvariant(s).dat).toBe(false);
  });

  it('bắt chết trước khi sinh', () => {
    const s = stateVoi('e1');
    s.entities.set('e1', { ...entity('e1'), tickSinh: 10, tickDiet: 5 });
    expect(chayInvariant(s).dat).toBe(false);
  });

  it('mồ côi chỉ là CẢNH BÁO — nó thành lỗ hổng, không thành lỗi', () => {
    const s = stateVoi('e1', 'e2');
    const r = chayInvariant(s);
    expect(r.dat).toBe(true);
    expect(r.canhBao.length).toBeGreaterThan(0);
    expect(r.canhBao[0]?.severity).toBe('warning');
  });

  it('kiểm theo phạm vi hẹp bỏ qua bất biến cần toàn cục', () => {
    const s = stateVoi('e1', 'e2');
    expect(chayInvariant(s, phamVi()).canhBao).toEqual([]);
    expect(chayInvariant(s).canhBao.length).toBeGreaterThan(0);
  });

  it('kiểm theo phạm vi vẫn bắt được vi phạm nặng của bản ghi bị chạm', () => {
    const s = stateVoi('e1');
    s.entities.set('e1', { ...entity('e1'), branchId: 'lac' });
    expect(chayInvariant(s, phamVi({ entities: new Set(['e1']) })).dat).toBe(false);
  });

  it('thông điệp vi phạm ổn định giữa các lần chạy', () => {
    const s = stateVoi('z', 'a', 'm');
    const a = chayInvariant(s).canhBao.map((x) => x.message);
    const b = chayInvariant(saoChepState(s)).canhBao.map((x) => x.message);
    expect(a).toEqual(b);
  });
});

// ─────────────────────────────────────────── replay + determinism

describe('[BB] replay deterministic — cổng Phase 1', () => {
  /** Sinh một chuỗi event deterministic từ seed. Chỉ dùng RNG seeded. */
  function sinhChuoi(seed: string, soBuoc: number): { world: World; events: Event[] } {
    const world = WorldSchema.parse({ ...WORLD, seed });
    const rng = taoRng(seed);
    const events: Event[] = [];
    const dsEntity: string[] = [];
    let tick = 0;
    let truocId: string | null = null;

    for (let i = 0; i < soBuoc; i++) {
      tick += rng.nguyen(3);
      const patches: PatchOp[] = [];
      const id = `ev_${i}`;

      const nuocDi = rng.nguyen(10);
      if (nuocDi < 3 || dsEntity.length === 0) {
        const eid = `en_${i}`;
        dsEntity.push(eid);
        patches.push({
          op: 'link',
          target: { table: 'entities', id: eid, path: '' },
          value: EntitySchema.parse({
            id: eid,
            branchId: 'br',
            kind: 'concept',
            ten: `Khái niệm ${i}`,
            tickSinh: tick,
            aspects: { conceptual: { trongSo: 0 } },
          }),
          sourceEventId: id,
        });
      } else if (nuocDi < 7) {
        const eid = rng.chon(dsEntity) as string;
        patches.push({
          op: 'add',
          // Trường THẬT, có mặt trong hash — khác với `_degree` vốn là cache.
          target: { table: 'entities', id: eid, path: 'aspects.conceptual.trongSo' },
          value: rng.khoang(1, 5),
          sourceEventId: id,
        });
      } else {
        const eid = rng.chon(dsEntity) as string;
        patches.push({
          op: 'push',
          target: { table: 'entities', id: eid, path: 'tags' },
          value: `tag_${rng.nguyen(20)}`,
          sourceEventId: id,
        });
      }

      events.push(
        taoEvent({
          id,
          branchId: 'br',
          tick,
          loai: 'sinh_tu_dong',
          actorIds: [],
          targetIds: [],
          causeEventIds: truocId ? [truocId] : [],
          locationId: null,
          patches,
          visibility: 'cong_khai',
          source: 'engine',
          payload: {},
        }),
      );
      truocId = id;
    }
    return { world, events };
  }

  it('replay hai lần cùng đầu vào cho cùng hash', () => {
    const { world, events } = sinhChuoi('seed-a', 300);
    const r = kiemDeterminism(world, events);
    expect(r.ok).toBe(true);
  });

  it('[BB] 10.000 bước cùng seed cho cùng hash', () => {
    const { world, events } = sinhChuoi('cong-phase-1', 10_000);
    expect(events).toHaveLength(10_000);

    const a = replay(world, events);
    const b = replay(world, events);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    expect(a.value.soEventDaApDung).toBe(10_000);
    expect(b.value.soEventDaApDung).toBe(10_000);
    expect(a.value.hashCuoi).toBe(b.value.hashCuoi);
    expect(a.value.hashCuoi).toMatch(/^[0-9a-f]{16}$/);
    expect(a.value.state.world.version).toBe(10_000);
  }, 60_000);

  it('sinh lại chuỗi từ cùng seed cho cùng event log và cùng hash', () => {
    const x = sinhChuoi('lap-lai', 500);
    const y = sinhChuoi('lap-lai', 500);
    expect(x.events.map((e) => e.hash)).toEqual(y.events.map((e) => e.hash));
    const rx = replay(x.world, x.events);
    const ry = replay(y.world, y.events);
    expect(rx.ok && ry.ok).toBe(true);
    if (rx.ok && ry.ok) expect(rx.value.hashCuoi).toBe(ry.value.hashCuoi);
  });

  it('seed khác cho hash khác — hash thật sự phản ánh nội dung', () => {
    const x = sinhChuoi('seed-x', 200);
    const y = sinhChuoi('seed-y', 200);
    const rx = replay(x.world, x.events);
    const ry = replay(y.world, y.events);
    expect(rx.ok && ry.ok).toBe(true);
    if (rx.ok && ry.ok) expect(rx.value.hashCuoi).not.toBe(ry.value.hashCuoi);
  });

  it('đổi một patch làm hash cuối đổi theo', () => {
    const { world, events } = sinhChuoi('nhay-cam', 100);
    const a = replay(world, events);

    // Tìm event đầu tiên có patch `add` lên một trường THẬT rồi tăng giá trị lên 1.
    const viTri = events.findIndex((e) => e.patches.some((pp) => pp.op === 'add'));
    expect(viTri).toBeGreaterThanOrEqual(0);
    const goc = events[viTri] as Event;
    const sua = [...events];
    sua[viTri] = taoEvent({
      ...goc,
      patches: goc.patches.map((pp) => (pp.op === 'add' ? { ...pp, value: (pp.value as number) + 1 } : pp)),
    });

    const b = replay(world, sua);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.value.hashCuoi).not.toBe(b.value.hashCuoi);
  });

  it('[BB] trường cache `_degree` và `_hash` KHÔNG vào hash — chúng là dữ liệu dẫn xuất', () => {
    const s1 = stateVoi('e1');
    const s2 = stateVoi('e1');
    s2.entities.set('e1', { ...entity('e1'), _degree: 7, _hash: 'cache-cu' });
    expect(hashState(s1)).toBe(hashState(s2));
  });

  it('nhưng `_version` CÓ vào hash — nó quyết định patch nào được chấp nhận', () => {
    const s1 = stateVoi('e1');
    const s2 = stateVoi('e1');
    s2.entities.set('e1', { ...entity('e1'), _version: 3 });
    expect(hashState(s1)).not.toBe(hashState(s2));
  });

  it('replay nghiêm ngặt dừng ở event hỏng', () => {
    const { world, events } = sinhChuoi('hong', 20);
    const xau = [...events];
    xau[10] = { ...(xau[10] as Event), hash: 'sai' } as Event;
    const r = replay(world, xau, true);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('REPLAY_DUT');
  });

  it('replay khoan dung bỏ qua event hỏng và ghi lại lý do', () => {
    const { world, events } = sinhChuoi('khoan-dung', 20);
    const xau = [...events];
    xau[10] = { ...(xau[10] as Event), hash: 'sai' } as Event;
    const r = replay(world, xau, false);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.soEventBiTuChoi).toBeGreaterThanOrEqual(1);
      expect(r.value.canhBao.some((c) => c.code === 'REPLAY_BO_QUA_EVENT')).toBe(true);
    }
  });

  it('hash state độc lập trường cache _hash và _degree bị lệch', () => {
    const a = stateVoi('e1');
    const b = stateVoi('e1');
    b.entities.set('e1', { ...entity('e1'), _hash: 'khac', _degree: 99 });
    expect(hashState(a)).toBe(hashState(b));
  });

  it('hash state độc lập thứ tự chèn entity', () => {
    const a = taoState(structuredClone(WORLD));
    a.entities.set('x', entity('x'));
    a.entities.set('y', entity('y'));
    const b = taoState(structuredClone(WORLD));
    b.entities.set('y', entity('y'));
    b.entities.set('x', entity('x'));
    expect(hashState(a)).toBe(hashState(b));
  });
});

// ─────────────────────────────────────────── kho in-memory

describe('kho state trong bộ nhớ', () => {
  it('ghi rồi đọc lại giữ nguyên hash', async () => {
    const kho = taoKhoBoNho();
    const s = stateVoi('e1', 'e2');
    const truoc = hashState(s);
    await kho.ghiState(s);
    const lai = await kho.docState('br');
    expect(lai).toBeDefined();
    expect(hashState(lai!)).toBe(truoc);
  });

  it('đọc trả BẢN SAO — sửa bản đọc không ảnh hưởng kho', async () => {
    const kho = taoKhoBoNho();
    const s = stateVoi('e1');
    await kho.ghiState(s);
    const a = await kho.docState('br');
    a!.entities.get('e1')!.ten = 'Đã sửa ngoài';
    const b = await kho.docState('br');
    expect(b!.entities.get('e1')?.ten).toBe('e1');
  });

  it('nhánh khác nhau lưu độc lập', async () => {
    const kho = taoKhoBoNho();
    const a = stateVoi('e1');
    const b = taoState(WorldSchema.parse({ ...WORLD, branchId: 'br2' }));
    b.entities.set('e1', { ...entity('e1'), branchId: 'br2', ten: 'Bản nhánh hai' });
    await kho.ghiState(a);
    await kho.ghiState(b);
    expect((await kho.docState('br'))!.entities.get('e1')?.ten).toBe('e1');
    expect((await kho.docState('br2'))!.entities.get('e1')?.ten).toBe('Bản nhánh hai');
  });
});
