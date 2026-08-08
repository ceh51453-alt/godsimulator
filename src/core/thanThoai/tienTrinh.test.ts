import { describe, expect, it } from 'vitest';
import { taoState } from '../engine/state.js';
import { EntitySchema } from '../schema/entity.js';
import { StorylineSchema } from '../schema/truyen.js';
import { KhoiTaoWorldSchema, worldRong } from '../world/khoiTao.js';
import { LorebookSchema } from '../lore/schema.js';
import { giaiDoanLore } from '../lore/ejs.js';
import { bangChungThanThoai, patchTienTrinhVuTru, patchesTaiTaoChuKy } from './tienTrinh.js';

function theGioi() {
  const world = worldRong(
    KhoiTaoWorldSchema.parse({
      cua: 'day_du',
      seed: 'tien-trinh-than-thoai',
      worldId: 'w1',
      branchId: 'br_goc',
      nguyenMau: 'ngon_tu',
    }),
  );
  return taoState(world);
}

function them(
  state: ReturnType<typeof theGioi>,
  id: string,
  kind: string,
  aspects: Record<string, unknown> = {},
) {
  state.entities.set(
    id,
    EntitySchema.parse({ id, branchId: state.world.branchId, kind, ten: id, tickSinh: 0, aspects }),
  );
}

describe('tiến trình thần thoại và chu kỳ vũ trụ', () => {
  it('chỉ mở từng bậc khi WorldState có bằng chứng tương ứng', () => {
    const state = theGioi();
    expect(state.world.sangThe.nguyenMau).toBe('ngon_tu');
    expect(bangChungThanThoai(state).giaiDoan).toBe('hu_vo');

    them(state, 'dau', 'place');
    expect(bangChungThanThoai(state).giaiDoan).toBe('dau_hieu');
    them(state, 'ten', 'concept', { conceptual: { giaiDoan: 'manh_nha' } });
    expect(bangChungThanThoai(state).giaiDoan).toBe('danh_xung');
    them(state, 'luat', 'law', {
      lawful: { hieuLuc: 80, trangThai: 'hieu_luc', tiepDia: [{ khaiNiemId: 'ten' }] },
    });
    expect(bangChungThanThoai(state).giaiDoan).toBe('luat_thanh');
    them(state, 'coi', 'realm');
    expect(bangChungThanThoai(state).giaiDoan).toBe('coi_gioi');
    state.storylines.set(
      'su_thi',
      StorylineSchema.parse({
        id: 'su_thi',
        branchId: state.world.branchId,
        ten: 'Sử thi đầu tiên',
        loai: 'quest',
        nhanVat: [
          { entityId: 'dau', vaiTro: 'chinh' },
          { entityId: 'coi', vaiTro: 'doi_dau' },
        ],
        giaiDoan: 'phat_trien',
        tickSinh: 0,
      }),
    );
    expect(bangChungThanThoai(state).giaiDoan).toBe('su_thi');

    const book = LorebookSchema.parse({
      id: 'lb',
      branchId: 'br_goc',
      ten: 'Nguồn',
      entries: [],
      bat: true,
      tickBat: 0,
    });
    expect(giaiDoanLore(book, 10_000, state)).toBe(4);
    state.world = {
      ...state.world,
      sangThe: { ...state.world.sangThe, chuKy: 2, tickBatDauChuKy: 50, giaiDoan: 'tai_tao' },
    };
    expect(bangChungThanThoai(state).giaiDoan).toBe('hu_vo');
    expect(giaiDoanLore(book, 10_000, state)).toBe(0);
  });

  it('kết cục được ghi thành trạng thái và tái tạo giữ lại di sản chu kỳ cũ', () => {
    const state = theGioi();
    state.metrics.realityIntegrity = 0;
    const ket = patchTienTrinhVuTru(state, 'ev_ket', 12);
    expect(
      ket.some((p) => p.target.path === 'sangThe.ketCucHienTai' && p.value === 'nghich_ly_toan_phan'),
    ).toBe(true);

    state.world = {
      ...state.world,
      tick: 12,
      sangThe: {
        ...state.world.sangThe,
        ketCucHienTai: 'nghich_ly_toan_phan',
        tickKetCuc: 12,
        giaiDoan: 'tan_the',
      },
    };
    const taiTao = patchesTaiTaoChuKy(state, 'ev_tai_tao');
    expect(taiTao.some((p) => p.target.path === 'sangThe.chuKy' && p.value === 2)).toBe(true);
    expect(taiTao.some((p) => p.target.path === 'sangThe.giaiDoan' && p.value === 'tai_tao')).toBe(true);
    const diSan = taiTao.find((p) => p.target.path === 'sangThe.diSanChuKy')?.value as string[];
    expect(diSan.at(-1)).toContain('nghich_ly_toan_phan');
  });
});
