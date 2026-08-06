/**
 * Bảng Thần Điện — thay Bảng Lãnh Địa (56.4).
 *
 * Bảng cũ dựng dữ liệu ngay trong component nên không kiểm được nếu không dựng
 * React. Bảng mới tính ở `core/than/thanDien.ts`, và đây là chỗ cưỡng chế ba
 * điều dễ trôi nhất:
 *
 *   1. thần hệ đọc được qua CẢ HAI đường — `domain.thanHeId` và link `thuoc_than_he`;
 *   2. thần khác KHÔNG bao giờ lộ con số thẩm quyền ([BB] 19.1);
 *   3. thần đứng ngoài mọi thần hệ vẫn có bảng, không phải màn hình trống.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog } from '../engine/state.js';
import type { WorldState, EventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { datLaiInvariant } from '../engine/invariant.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { napBatBienTangThan } from '../world/batBienThan.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { HoiDongSchema } from '../schema/aspect/hoiDong.js';
import { EntitySchema, LinkSchema } from '../schema/entity.js';
import { SoulSchema } from '../schema/aspect/soul.js';
import { DomainSchema, VenerableSchema } from '../schema/aspect/divine.js';
import { nguonGoc } from '../schema/aspect/provenance.js';
import type { Event, PatchOp } from '../contracts/core.js';

import { tinhBangThanDien, thanHeCua, thanhVienThanHe } from './thanDien.js';

const HE = 'pantheon_test';

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
  napBatBienTangThan();
});

function theGioi(seed = 'than_dien'): { state: WorldState; log: EventLog } {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  expect(apDungChuoi(state, events, log).ok).toBe(true);
  expect(apDungEvent(state, eventGieoNen(state) as Event, log).ok).toBe(true);
  return { state, log };
}

/** Áp một lô patch qua đúng cửa Event — không test nào sửa state trực tiếp. */
function ap(state: WorldState, log: EventLog, id: string, patches: readonly PatchOp[]): void {
  if (patches.length === 0) return;
  const ev = taoEvent({
    id,
    branchId: state.world.branchId,
    tick: state.world.tick,
    loai: 'test',
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches: [...patches],
    visibility: 'cong_khai',
    source: 'player',
    payload: {},
  });
  const ok = apDungEvent(state, ev, log);
  expect(ok.ok, ok.ok ? '' : JSON.stringify(ok.errors)).toBe(true);
}

function themThan(
  state: WorldState,
  log: EventLog,
  id: string,
  ten: string,
  tuy: { tinDo?: number; sucDomain?: number; thanHeId?: string | null } = {},
): void {
  const e = EntitySchema.parse({
    id,
    branchId: state.world.branchId,
    kind: 'deity',
    ten,
    moTa: '',
    tickSinh: state.world.tick,
    aspects: {
      provenance: nguonGoc('nguoi_choi', state.world.tick, { actorId: id }),
      soul: SoulSchema.parse({ tang: 't3' }),
      domain: DomainSchema.parse({
        domains: [{ ten: `quyền của ${ten}`, suc: tuy.sucDomain ?? 40 }],
        thanHeId: tuy.thanHeId ?? null,
      }),
      venerable: VenerableSchema.parse({ soTinDoUocLuong: tuy.tinDo ?? 0, hienThanh: 10 }),
    },
  });
  ap(state, log, `ev_than_${id}`, [
    { op: 'link', target: { table: 'entities', id, path: '' }, value: e, sourceEventId: `ev_than_${id}` },
  ]);
}

function themThanHe(state: WorldState, log: EventLog, ghe: readonly { id: string; vai: string }[]): void {
  const e = EntitySchema.parse({
    id: HE,
    branchId: state.world.branchId,
    kind: 'pantheon',
    ten: 'Thần Điện Thử',
    moTa: '',
    tickSinh: state.world.tick,
    aspects: {
      hoi_dong: HoiDongSchema.parse({
        ten: 'Hội đồng thử',
        ghe: ghe.map((g) => ({ thanId: g.id, vai: g.vai, tickNhanGhe: 0, uyTin: 50 })),
        luatKeVi: 'bau_phieu',
        nguongThongQua: 0.6,
      }),
    },
  });
  ap(state, log, 'ev_than_he', [
    { op: 'link', target: { table: 'entities', id: HE, path: '' }, value: e, sourceEventId: 'ev_than_he' },
  ]);
}

function noiVaoThanHe(state: WorldState, log: EventLog, thanId: string): void {
  const lkId = `lk_${thanId}_he`;
  ap(state, log, `ev_lk_${thanId}`, [
    {
      op: 'link',
      target: { table: 'links', id: lkId, path: '' },
      value: LinkSchema.parse({
        id: lkId,
        branchId: state.world.branchId,
        tuId: thanId,
        denId: HE,
        quanHe: 'thuoc_than_he',
        trongSo: 50,
        tickTao: state.world.tick,
      }),
      sourceEventId: `ev_lk_${thanId}`,
    },
  ]);
}

describe('Bảng Thần Điện — vị trí, quy luật, sức mạnh', () => {
  it('vị thần ngồi ghế đầu thấy đúng ghế, đúng hạng và đúng luật kế vị', () => {
    const { state, log } = theGioi();
    themThan(state, log, 'd_a', 'Vị Thứ Nhất', { tinDo: 180, sucDomain: 80, thanHeId: HE });
    themThan(state, log, 'd_b', 'Vị Thứ Hai', { tinDo: 20, sucDomain: 30, thanHeId: HE });
    themThanHe(state, log, [
      { id: 'd_a', vai: 'chu_tich' },
      { id: 'd_b', vai: 'thanh_vien' },
    ]);

    const du = tinhBangThanDien(state, 'd_a');
    expect(du).not.toBeNull();
    if (!du) return;

    expect(du.viTri.tenThanHe).toBe('Thần Điện Thử');
    expect(du.viTri.vai).toBe('chu_tich');
    expect(du.viTri.nhanVai).toBe('ngồi ghế đầu');
    expect(du.viTri.hang).toBe(1);
    expect(du.viTri.tongThanhVien).toBe(2);
    expect(du.quyLuat.keVi).toBe('hội đồng bầu');
    expect(du.quyLuat.nguongThongQua).toBe(0.6);
    expect(du.quyLuat.gheDauTrong).toBe(false);
    expect(du.sucManh.thamQuyen).toBeGreaterThan(0);
    expect(du.sucManh.domains.map((d) => d.ten)).toContain('quyền của Vị Thứ Nhất');
  });

  it('[BB] 19.1 — thần khác chỉ có chữ so sánh, tuyệt đối không có số thẩm quyền', () => {
    const { state, log } = theGioi();
    themThan(state, log, 'd_a', 'Kẻ Yếu', { tinDo: 0, sucDomain: 10, thanHeId: HE });
    themThan(state, log, 'd_b', 'Kẻ Mạnh', { tinDo: 200, sucDomain: 95, thanHeId: HE });
    themThanHe(state, log, [
      { id: 'd_a', vai: 'thanh_vien' },
      { id: 'd_b', vai: 'chu_tich' },
    ]);

    const du = tinhBangThanDien(state, 'd_a');
    expect(du).not.toBeNull();
    if (!du) return;

    const khac = du.thanhVien.find((t) => !t.laNguoiChoi);
    expect(khac?.ten).toBe('Kẻ Mạnh');
    expect(khac?.soSanh).toBe('nang_hon');
    // Kiểu đã chặn số ở tầng dữ liệu; nếu ai thêm trường số cho thần khác thì
    // dòng này đỏ trước khi nó kịp lên màn hình.
    expect(Object.keys(khac ?? {}).sort()).toEqual(['id', 'laNguoiChoi', 'nhanVai', 'soSanh', 'ten']);
    expect(du.viTri.hang).toBe(2);
  });

  it('thần hệ nhận ra được qua link thuoc_than_he dù domain.thanHeId bỏ trống', () => {
    const { state, log } = theGioi();
    themThan(state, log, 'd_a', 'Không Khai Thần Hệ', { thanHeId: null });
    themThanHe(state, log, []);
    noiVaoThanHe(state, log, 'd_a');

    expect(thanHeCua(state, 'd_a')?.id).toBe(HE);
    expect(thanhVienThanHe(state, HE)).toEqual(['d_a']);

    const du = tinhBangThanDien(state, 'd_a');
    expect(du?.viTri.thanHeId).toBe(HE);
    // Có tên trong thần hệ nhưng chưa ai chia ghế — phải nói ra, không im lặng.
    expect(du?.viTri.vai).toBeNull();
    expect(du?.viTri.nhanVai).toBe('có tên trong thần hệ, chưa có ghế');
  });

  it('ghế đầu trống thì bảng nói ra, kèm số vị có cửa', () => {
    const { state, log } = theGioi();
    themThan(state, log, 'd_a', 'Ứng Viên A', { thanHeId: HE });
    themThan(state, log, 'd_b', 'Ứng Viên B', { thanHeId: HE });
    themThanHe(state, log, [
      { id: 'd_a', vai: 'thanh_vien' },
      { id: 'd_b', vai: 'thanh_vien' },
    ]);

    const du = tinhBangThanDien(state, 'd_a');
    expect(du?.quyLuat.gheDauTrong).toBe(true);
    expect(du?.quyLuat.soUngVienKeVi).toBe(2);
  });

  it('thần đứng ngoài mọi thần hệ vẫn có bảng, và bảng nói thẳng điều đó', () => {
    const { state, log } = theGioi();
    themThan(state, log, 'd_a', 'Kẻ Không Nhà', { thanHeId: null });

    const du = tinhBangThanDien(state, 'd_a');
    expect(du).not.toBeNull();
    if (!du) return;

    expect(du.viTri.thanHeId).toBeNull();
    expect(du.viTri.tongThanhVien).toBe(0);
    expect(du.thanhVien).toHaveLength(0);
    expect(du.quyLuat.keVi).toBe('không thần hệ nào ràng ngươi');
    // Vẫn phải có sức mạnh: không thuộc thần hệ không có nghĩa là không có quyền.
    expect(du.sucManh.domains).toHaveLength(1);
  });

  it('thần ngoài thần điện tới bằng tin đồn, không bằng số', () => {
    const { state, log } = theGioi();
    themThan(state, log, 'd_a', 'Trong Điện', { thanHeId: HE });
    themThan(state, log, 'd_ngoai', 'Ngoài Điện', { tinDo: 500, sucDomain: 100, thanHeId: null });
    themThanHe(state, log, [{ id: 'd_a', vai: 'chu_tich' }]);

    const du = tinhBangThanDien(state, 'd_a');
    expect(du).not.toBeNull();
    if (!du) return;

    // Thế giới gieo nền có thể đã có sẵn thần khác; điều kiểm được là kẻ ngoài
    // điện phải có mặt trong tin đồn, và không ai trong đó nằm trong thần hệ.
    const ten = du.ngoaiThanDien.map((t) => t.noiDung);
    expect(ten.some((s) => s.includes('Ngoài Điện'))).toBe(true);
    expect(ten.some((s) => s.includes('Trong Điện'))).toBe(false);
    for (const t of du.ngoaiThanDien) {
      expect(t.daXacNhan).toBe(false);
      // Con số của kẻ ngoài điện không được lọt ra dưới bất kỳ dạng nào.
      expect(t.noiDung).not.toMatch(/\d/);
    }
  });

  it('gọi trên thứ không phải thần thì trả null chứ không dựng bảng rỗng', () => {
    const { state, log } = theGioi();
    themThanHe(state, log, []);
    expect(tinhBangThanDien(state, HE)).toBeNull();
    expect(tinhBangThanDien(state, 'khong_ton_tai')).toBeNull();
  });

  it('cùng một state cho cùng một bảng — không có nguồn ngẫu nhiên nào lọt vào', () => {
    const { state, log } = theGioi();
    themThan(state, log, 'd_a', 'Vị A', { tinDo: 100, thanHeId: HE });
    themThan(state, log, 'd_b', 'Vị B', { tinDo: 100, thanHeId: HE });
    themThanHe(state, log, [
      { id: 'd_a', vai: 'chu_tich' },
      { id: 'd_b', vai: 'thanh_vien' },
    ]);

    expect(JSON.stringify(tinhBangThanDien(state, 'd_a'))).toBe(
      JSON.stringify(tinhBangThanDien(state, 'd_a')),
    );
  });
});
