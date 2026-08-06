/**
 * Áp luật — cổng cho "thế giới vận hành theo luật của chính nó".
 *
 * Trước bước này, `lawful.hieuUng` là dữ liệu không ai đọc: người chơi viết bảy
 * trường logic, panel hiện chúng, và thế giới không đổi một chữ nào. Mỗi bài
 * dưới đây kiểm một trong ba hàng rào, và bài cuối kiểm rằng lằn ranh vẫn đứng
 * khi chính điều luật là thứ do một preset ngoài viết ra.
 */
import { describe, it, expect } from 'vitest';

import { TUNING_MAC_DINH, TuningSchema } from '../tuning/schema.js';
import { taoState } from '../engine/state.js';
import type { WorldState } from '../engine/state.js';
import { apPatch } from '../engine/patch.js';
import { WorldSchema } from '../contracts/core.js';
import { EntitySchema, LinkSchema } from '../schema/entity.js';
import type { Entity } from '../schema/entity.js';
import { MortalSchema } from '../schema/aspect/living.js';
import type { Mortal } from '../schema/aspect/living.js';
import { LawfulSchema } from '../schema/aspect/lawful.js';
import type { Lawful } from '../schema/aspect/lawful.js';
import { apLuat, TIEN_TO_HIEU_UNG } from './apLuat.js';

const TUNING = TUNING_MAC_DINH;

function theGioi(): WorldState {
  return taoState(
    WorldSchema.parse({
      id: 'w1',
      branchId: 'br_goc',
      seed: 'ap-luat',
      tick: 0,
      eraId: 'era_0',
      year: 0,
      tuningProfileId: 'co_dien',
      playerState: { mode: 'sang_the', chuTheId: null, setupCompleted: true, setupVersion: 1 },
      version: 1,
    }),
  );
}

const nguoi = (id: string, over: Partial<Mortal> = {}): Entity =>
  EntitySchema.parse({
    id,
    branchId: 'br_goc',
    kind: 'mortal',
    ten: id,
    tickSinh: 0,
    aspects: { mortal: MortalSchema.parse(over) },
  });

const luat = (id: string, over: Partial<Lawful> = {}): Entity =>
  EntitySchema.parse({
    id,
    branchId: 'br_goc',
    kind: 'law',
    ten: id,
    tickSinh: 0,
    aspects: {
      lawful: LawfulSchema.parse({
        vanBan: id,
        bien: 'không phán xét động cơ',
        trangThai: 'hieu_luc',
        hieuLuc: 100,
        ...over,
      }),
    },
  });

const chay = (s: WorldState) => apLuat(s, { tick: 4, eventId: 'ev1', tuning: TUNING });

const doDoi = (s: WorldState, id: string): number =>
  (s.entities.get(id)?.aspects['mortal'] as Mortal).thanThe.doDoi;

// ─────────────────────────────────────────── áp được

describe('luật đang có hiệu lực thật sự đổi thế giới', () => {
  it('hiệu ứng "add" chạm mọi thực thể trong phạm vi', () => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set('m2', nguoi('m2'));
    s.entities.set(
      'l1',
      luat('l1', { hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 10 }] }),
    );

    const kq = chay(s);
    expect(apPatch(s, kq.patches).ok).toBe(true);
    expect(doDoi(s, 'm1')).toBe(10);
    expect(doDoi(s, 'm2')).toBe(10);
    expect(kq.viec[0]?.soThucThe).toBe(2);
  });

  it('[BB] 42.4 — luật yếu đẩy yếu: hiệu lực nhân thẳng vào giá trị', () => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set(
      'l1',
      luat('l1', {
        hieuLuc: 30,
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 10 }],
      }),
    );
    expect(apPatch(s, chay(s).patches).ok).toBe(true);
    expect(doDoi(s, 'm1')).toBe(3);
  });

  it('luật hiệu lực 0 không chạm gì, và nói rõ vì sao', () => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set(
      'l1',
      luat('l1', {
        hieuLuc: 0,
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 10 }],
      }),
    );
    const kq = chay(s);
    expect(kq.patches).toHaveLength(0);
    expect(kq.boQua[0]?.vi).toContain('42.4');
  });

  it('phép tuyệt đối chờ luật đủ răng — nửa của "true" là vô nghĩa', () => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set(
      'l1',
      luat('l1', {
        hieuLuc: 20,
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'set', giaTri: 90 }],
      }),
    );
    expect(chay(s).patches).toHaveLength(0);

    const l = s.entities.get('l1') as Entity;
    s.entities.set('l1', {
      ...l,
      aspects: { ...l.aspects, lawful: { ...(l.aspects['lawful'] as Lawful), hieuLuc: 80 } },
    });
    expect(apPatch(s, chay(s).patches).ok).toBe(true);
    expect(doDoi(s, 'm1')).toBe(90);
  });
});

// ─────────────────────────────────────────── phạm vi và điều kiện

describe('phạm vi, điều kiện và ngoại lệ đều chặn thật', () => {
  it('phạm vi "chung_loai" chỉ chạm đúng loài đã khai', () => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set(
      'q1',
      EntitySchema.parse({ id: 'q1', branchId: 'br_goc', kind: 'monster', ten: 'q1', tickSinh: 0 }),
    );
    s.entities.set(
      'l1',
      luat('l1', {
        phamVi: { loai: 'chung_loai', mucTieu: ['monster'] },
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 10 }],
      }),
    );
    expect(chay(s).patches.every((p) => p.target.id === 'q1')).toBe(true);
  });

  it('phạm vi "vung" tính theo sợi dây cư trú, không theo trùng id', () => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set('m2', nguoi('m2'));
    s.entities.set(
      'p1',
      EntitySchema.parse({ id: 'p1', branchId: 'br_goc', kind: 'place', ten: 'p1', tickSinh: 0 }),
    );
    s.links.set(
      'lk1',
      LinkSchema.parse({
        id: 'lk1',
        branchId: 'br_goc',
        tuId: 'm1',
        denId: 'p1',
        quanHe: 'cu_tru_tai',
        tickTao: 0,
      }),
    );
    s.entities.set(
      'l1',
      luat('l1', {
        phamVi: { loai: 'vung', mucTieu: ['p1'] },
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 10 }],
      }),
    );
    expect(chay(s).patches.map((p) => p.target.id)).toEqual(['m1']);
  });

  it('[BB] 9.1 kiểm tra 4 — ngoại lệ khai tường minh thì thắng', () => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set(
      'l1',
      luat('l1', {
        ngoaiLe: [
          {
            dieuKien: {
              op: 'eq',
              args: [
                { op: 'read', path: 'e.id', args: [] },
                { op: 'literal', value: 'm1', args: [] },
              ],
            },
            moTa: 'm1 được miễn',
          },
        ],
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 10 }],
      }),
    );
    expect(chay(s).patches).toHaveLength(0);
  });

  it('luật chờ một loại sự kiện thì KHÔNG nổ mỗi nhịp', () => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set(
      'l1',
      luat('l1', {
        kichHoat: { suKien: 'gay_chay_mau', dieuKien: { op: 'literal', value: true, args: [] } },
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 25 }],
      }),
    );
    expect(chay(s).patches).toHaveLength(0);
  });
});

// ─────────────────────────────────────────── lằn ranh

describe('một điều luật là dữ liệu người dùng viết, và lằn ranh biết điều đó', () => {
  it.each([
    'aspects.dan_cu.cohort.adult',
    'aspects.kinh_te.kho.luongThuc',
    'aspects.sinh_thai.taiNguyen.rung',
    'aspects.conceptual.trongSo',
    'aspects.lawful.hieuLuc',
    'aspects.ban_nga.coreSelf.tuBi_tanNhan',
    'aspects.soul.banTinh.tuBi_tanNhan',
    'tickDiet',
    'id',
  ])('luật không ghi được vào %s', (duongDan) => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set('l1', luat('l1', { hieuUng: [{ duongDan, phep: 'add', giaTri: 10 }] }));
    const kq = chay(s);
    expect(kq.patches).toHaveLength(0);
    expect(kq.boQua.length).toBeGreaterThan(0);
  });

  it('sổ sách của tiến trình nền vắng mặt khỏi bảng trắng — bảo toàn không thương lượng', () => {
    for (const cam of ['aspects.dan_cu.', 'aspects.kinh_te.', 'aspects.sinh_thai.', 'aspects.lawful.']) {
      expect(TIEN_TO_HIEU_UNG).not.toContain(cam);
    }
  });

  it('luật ưu tiên cao ghi trước và giữ chỗ — 9.1 uu_tien_cao_thang', () => {
    const s = theGioi();
    s.entities.set('m1', nguoi('m1'));
    s.entities.set(
      'cao',
      luat('cao', {
        uuTien: 900,
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 10 }],
      }),
    );
    s.entities.set(
      'thap',
      luat('thap', {
        uuTien: 100,
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 90 }],
      }),
    );
    expect(apPatch(s, chay(s).patches).ok).toBe(true);
    expect(doDoi(s, 'm1')).toBe(10);
  });

  it('trần thực thể chặn một điều luật vũ trụ quét cả thế giới', () => {
    const tuning = TuningSchema.parse({ luat: { soThucTheMoiLuat: 3 } });
    const s = theGioi();
    for (let i = 0; i < 20; i++) s.entities.set(`m${i}`, nguoi(`m${i}`));
    s.entities.set(
      'l1',
      luat('l1', { hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 5 }] }),
    );
    expect(apLuat(s, { tick: 4, eventId: 'e', tuning }).patches).toHaveLength(3);
  });

  it('cùng state cho cùng chuỗi patch — luật bất biến #7', () => {
    const dung = (): WorldState => {
      const s = theGioi();
      for (let i = 0; i < 6; i++) s.entities.set(`m${i}`, nguoi(`m${i}`));
      s.entities.set(
        'l1',
        luat('l1', { hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 5 }] }),
      );
      return s;
    };
    expect(JSON.stringify(chay(dung()).patches)).toBe(JSON.stringify(chay(dung()).patches));
  });
});
