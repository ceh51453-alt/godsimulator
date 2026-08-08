import { describe, expect, it } from 'vitest';
import { WorldSchema } from '../contracts/core.js';
import { taoState } from '../engine/state.js';
import { dungChiMuc } from '../retrieval/chiMuc.js';
import { LorebookEntrySchema, LorebookSchema } from './schema.js';
import { hopNhatEntryTuSinh, taoLorebookSuTheGioi } from './quanLy.js';
import { taoNguCanhEjsLore } from './ejs.js';

const entry = (id: string, noiDung: string, suKienChongLung: string[] = []) =>
  LorebookEntrySchema.parse({
    id,
    ten: 'Thời cục hiện tại',
    keys: ['thời cục'],
    noiDung,
    lop: 'loi',
    order: 30_000,
    doTinCay: 100,
    suKienChongLung,
    lichSu: [{ tick: 1, boiAi: 'workflow', op: 'them', truoc: '', sau: noiDung }],
  });

describe('quản lý Lorebook tự sinh', () => {
  it('upsert theo id và nội dung, không thêm bản sao qua mỗi lần workflow chạy', () => {
    const goc = taoLorebookSuTheGioi('br_test');
    const lan1 = hopNhatEntryTuSinh(goc, entry('lb.wf.thoi_cuc', 'Một thành bang vừa mở cảng.', ['ev_1']));
    expect(lan1.lorebook.entries).toHaveLength(1);

    const lan2 = hopNhatEntryTuSinh(
      lan1.lorebook,
      entry('lb.wf.thoi_cuc', 'Một thành bang vừa mở cảng.', ['ev_2']),
    );
    expect(lan2.lorebook.entries).toHaveLength(1);
    expect(lan2.lorebook.entries[0]?.suKienChongLung).toEqual(['ev_1', 'ev_2']);

    const lan3 = hopNhatEntryTuSinh(
      lan2.lorebook,
      entry('lb.wf.doi_ten', '  MỘT thành bang vừa mở cảng!  ', ['ev_3']),
    );
    expect(lan3.lorebook.entries).toHaveLength(1);
    expect(lan3.entryId).toBe('lb.wf.thoi_cuc');
  });

  it('RAG giữ Sử và bỏ bản Nguồn giống hệt, đồng thời gắn đúng nhãn nguồn', () => {
    const world = WorldSchema.parse({
      id: 'w_lore_dedupe',
      branchId: 'br_lore_dedupe',
      seed: 'lore-dedupe',
      tick: 4,
      eraId: 'era_0',
      year: 1,
      tuningProfileId: 'co_dien',
      playerState: { setupCompleted: true },
      version: 0,
    });
    const state = taoState(world);
    const noiDung = 'Sông Lam đã đổi dòng về phía đông.';
    const su = { ...taoLorebookSuTheGioi(world.branchId), entries: [entry('su.1', noiDung)] };
    const nguon = LorebookSchema.parse({
      id: 'than_thoai',
      branchId: world.branchId,
      ten: 'Thần thoại thử',
      bat: true,
      nguon: 'nguoi_dung',
      entries: [{ ...entry('nguon.1', noiDung), order: 1 }],
    });
    state.lorebooks.set(su.id, su);
    state.lorebooks.set(nguon.id, nguon);

    const chunks = dungChiMuc(state, 'Sông Lam');
    const lore = chunks.filter((c) => c.nguon.startsWith('lorebook'));
    expect(lore).toHaveLength(1);
    expect(lore[0]?.nguon).toBe('lorebook_su');
    expect(lore[0]?.noiDung).toContain('SỬ THẾ GIỚI');
  });

  it('Sử tự sinh không bị tính như một thần thoại và không lấy mất trần kết tinh', () => {
    const world = WorldSchema.parse({
      id: 'w_lore_gravity',
      branchId: 'br_lore_gravity',
      seed: 'lore-gravity',
      tick: 4,
      eraId: 'era_0',
      year: 1,
      tuningProfileId: 'co_dien',
      playerState: { setupCompleted: true },
      version: 0,
    });
    const state = taoState(world);
    const muc = entry('than.1', 'Một dấu hiệu thần thoại.', []);
    const thanThoai = LorebookSchema.parse({
      id: 'than_thoai',
      branchId: world.branchId,
      ten: 'Thần thoại thử',
      bat: true,
      lucHapDan: 68,
      nguon: 'nguoi_dung',
      entries: [muc],
    });
    const su = taoLorebookSuTheGioi(world.branchId);
    state.lorebooks.set(thanThoai.id, thanThoai);
    state.lorebooks.set(su.id, su);

    const context = taoNguCanhEjsLore(state, thanThoai, muc);
    expect(context.daThan.soSach).toBe(1);
    expect(context.lore.gravity).toBe(68);
  });
});
