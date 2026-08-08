import type { WorldState } from '../core/engine/state.js';
import { EntitySchema } from '../core/schema/entity.js';
import { StorylineSchema } from '../core/schema/truyen.js';

/**
 * Các test nhịp mở lorebook kiểm riêng trần thời gian, nên cho chúng một thế giới
 * đã có đủ bằng chứng tới bậc sử thi. Test tiến trình sáng thế kiểm cổng bằng chứng
 * ở một suite riêng.
 */
export function moDuBangChungLore(state: WorldState): void {
  const branchId = state.world.branchId;
  const them = (id: string, kind: string, aspects: Record<string, unknown> = {}) => {
    state.entities.set(
      id,
      EntitySchema.parse({ id, branchId, kind, ten: `Mốc ${id}`, tickSinh: 0, aspects }),
    );
  };
  them('test_danh_xung', 'concept', { conceptual: { giaiDoan: 'manh_nha' } });
  them('test_luat', 'law', {
    lawful: { hieuLuc: 50, trangThai: 'hieu_luc', tiepDia: [{ khaiNiemId: 'test_danh_xung' }] },
  });
  them('test_coi', 'realm');
  them('test_than_a', 'deity');
  them('test_than_b', 'deity');
  state.storylines.set(
    'test_su_thi',
    StorylineSchema.parse({
      id: 'test_su_thi',
      branchId,
      ten: 'Mạch bằng chứng',
      loai: 'quest',
      nhanVat: [
        { entityId: 'test_than_a', vaiTro: 'chinh' },
        { entityId: 'test_than_b', vaiTro: 'doi_dau' },
      ],
      giaiDoan: 'phat_trien',
      tickSinh: 0,
    }),
  );
}
