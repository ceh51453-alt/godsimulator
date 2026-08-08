import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useThuVienLorebook } from './lorebook.js';
import { layDb } from '../db/instance.js';
import { WorldSchema } from '../core/contracts/core.js';
import { hashState, taoEventLog, taoState } from '../core/engine/state.js';
import { useGame } from './game.js';

const RAW = JSON.stringify({
  description: 'Một sách thử để đo luồng chọn trước ván.',
  entries: {
    '0': {
      uid: 'entry.test',
      comment: 'Khởi nguyên thử',
      key: ['khởi nguyên'],
      constant: true,
      content: 'Một quy luật thử được nhắc tới.',
    },
  },
});

describe('thư viện Lorebook và công tắc trong ván', () => {
  beforeEach(async () => {
    await layDb().settings.delete('lorebook.library.v1');
    useThuVienLorebook.setState({ muc: [], daNap: false, dangXuLy: false, loi: '' });
  });

  it('lưu lựa chọn cho ván mới và đọc lại được khi chưa có ván', async () => {
    const thuVien = useThuVienLorebook.getState();
    expect(await thuVien.themTuChuoi(RAW, 'Sách thử', { chonChoVanMoi: true })).toBe(true);
    expect(useThuVienLorebook.getState().muc[0]).toMatchObject({
      ten: 'Sách thử',
      soEntry: 1,
      chonChoVanMoi: true,
    });

    useThuVienLorebook.setState({ muc: [], daNap: false });
    await useThuVienLorebook.getState().napTuDia();
    expect(useThuVienLorebook.getState().muc[0]?.chonChoVanMoi).toBe(true);

    const id = useThuVienLorebook.getState().muc[0]?.id ?? '';
    await useThuVienLorebook.getState().xoaKhoiThuVien(id);
    expect(useThuVienLorebook.getState().muc).toHaveLength(0);
  });

  it('bật/tắt render bằng tham chiếu state mới và xóa sạch sách khỏi ván', async () => {
    const world = WorldSchema.parse({
      id: 'w_lore_ui',
      branchId: 'br_lore_ui',
      seed: 'lore-ui',
      tick: 0,
      eraId: 'era_0',
      year: 0,
      tuningProfileId: 'co_dien',
      playerState: { setupCompleted: true },
      version: 0,
    });
    const state = taoState(world);
    const log = taoEventLog();
    useGame.setState({ state, log, loi: [], stateHash: hashState(state) });

    const truocThem = useGame.getState().state;
    const hashTruocThem = useGame.getState().stateHash;
    expect(await useGame.getState().nhapLorebookTuChuoi(RAW, 'Sách thử')).toBe(true);
    const book = [...(useGame.getState().state?.lorebooks.values() ?? [])][0];
    expect(book).toBeDefined();
    if (book === undefined) return;
    expect(useGame.getState().state).not.toBe(truocThem);
    expect(useGame.getState().stateHash).not.toBe(hashTruocThem);

    const truocBat = useGame.getState().state;
    const hashTruocBat = useGame.getState().stateHash;
    useGame.getState().batLorebook(book.id, true);
    expect(useGame.getState().state).not.toBe(truocBat);
    expect(useGame.getState().stateHash).not.toBe(hashTruocBat);
    expect(useGame.getState().state?.lorebooks.get(book.id)?.bat).toBe(true);

    const truocTat = useGame.getState().state;
    useGame.getState().batLorebook(book.id, false);
    expect(useGame.getState().state).not.toBe(truocTat);
    expect(useGame.getState().state?.lorebooks.get(book.id)?.bat).toBe(false);

    await useGame.getState().xoaLorebook(book.id);
    expect(useGame.getState().state?.lorebooks.has(book.id)).toBe(false);
    expect(await layDb().lorebooks.get([world.branchId, book.id])).toBeUndefined();
    expect(await layDb().tombstones.get([world.branchId, 'lorebooks', book.id])).toBeDefined();
  });

  it('cho người chơi sửa entry, ghi lịch sử và chặn nội dung trùng', async () => {
    const world = WorldSchema.parse({
      id: 'w_lore_edit',
      branchId: 'br_lore_edit',
      seed: 'lore-edit',
      tick: 2,
      eraId: 'era_0',
      year: 0,
      tuningProfileId: 'co_dien',
      playerState: { setupCompleted: true },
      version: 0,
    });
    const state = taoState(world);
    const log = taoEventLog();
    useGame.setState({ state, log, loi: [], stateHash: hashState(state) });
    expect(await useGame.getState().nhapLorebookTuChuoi(RAW, 'Sách sửa')).toBe(true);
    const book = [...(useGame.getState().state?.lorebooks.values() ?? [])][0];
    expect(book).toBeDefined();
    if (!book) return;

    expect(
      useGame.getState().suaLorebookEntry(book.id, 'entry.test', {
        ten: 'Khởi nguyên đã sửa',
        keys: ['khởi nguyên', 'mở đầu'],
        noiDung: 'Một quy luật đã được người chơi viết lại.',
        lop: 'sau',
        order: 4,
      }),
    ).toBe(true);
    const daSua = useGame.getState().state?.lorebooks.get(book.id)?.entries[0];
    expect(daSua?.ten).toBe('Khởi nguyên đã sửa');
    expect(daSua?.lichSu.at(-1)?.boiAi).toBe('nguoi_choi');
    expect(log.tatCa().at(-1)?.loai).toBe('sua_lorebook_entry');

    const rawTrung = JSON.stringify({
      entries: [
        {
          uid: 'entry.trung',
          comment: 'Bản trùng',
          key: ['trùng'],
          content: 'Một quy luật đã được người chơi viết lại.',
        },
      ],
    });
    expect(await useGame.getState().nhapLorebookTuChuoi(rawTrung, 'Sách trùng')).toBe(true);
    const sachTrung = [...(useGame.getState().state?.lorebooks.values() ?? [])].find(
      (x) => x.ten === 'Sách trùng',
    );
    expect(sachTrung).toBeDefined();
    if (!sachTrung) return;
    expect(
      useGame.getState().suaLorebookEntry(sachTrung.id, 'entry.trung', {
        ten: 'Bản trùng vẫn trùng',
        keys: ['trùng'],
        noiDung: 'Một quy luật đã được người chơi viết lại.',
        lop: 'sau',
        order: 5,
      }),
    ).toBe(false);
  });
});
