/**
 * Đa thần thoại — bật nhiều lorebook thì thế giới diễn hóa thành thế giới lai.
 *
 * ── Vì sao đây là một tính năng chứ không phải một hệ quả tự nhiên ──
 *
 * Trước khối `daThan`, bật ba sách nghĩa là ba entry đạo diễn cùng có mặt, mỗi
 * entry tuyên bố "thế giới đang trở thành X". Ba tuyên bố về cùng một bầu trời
 * là một mâu thuẫn, và model xử lý mâu thuẫn theo cách rẻ nhất: chọn đại một
 * bên rồi im lặng bỏ hai bên kia, hoặc sáp nhập ba thần điện làm một cho hết
 * vướng. Cả hai cách đều xóa mất đúng thứ đáng chơi nhất — chỗ các hệ CHẠM nhau.
 *
 * Ba bảo đảm được khóa ở đây:
 *
 *   — trần kết tinh được CHIA, nên tổng phần của mọi hệ không bao giờ nuốt hết
 *     thế giới và sàn của người chơi luôn còn;
 *   — giao ước xuất hiện ĐÚNG MỘT LẦN dù bật bao nhiêu sách;
 *   — bật một sách thì mọi thứ y như trước — tính năng này không được đánh thuế
 *     lên ván chơi một thần thoại.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { taoEventLog, taoState } from '../core/engine/state.js';
import { apDungChuoi } from '../core/engine/transaction.js';
import { KhoiTaoWorldSchema, moThuGioi } from '../core/world/khoiTao.js';
import { nhapLorebook } from '../core/lore/nhap.js';
import { renderEjsLore, taoNguCanhEjsLore, TRAN_DA_THAN } from '../core/lore/ejs.js';
import { dungChiMuc } from '../core/retrieval/chiMuc.js';
import type { Lorebook } from '../core/lore/schema.js';
import type { WorldState } from '../core/engine/state.js';

const SACH = [
  { tep: 'than-thoai-hy-lap.json', id: 'lore.greek', ten: 'Thần thoại Hy Lạp', dp: 'greek' },
  { tep: 'than-thoai-an-do.json', id: 'lore.india', ten: 'Thần thoại Ấn Độ', dp: 'india' },
  { tep: 'than-thoai-nhat-ban.json', id: 'lore.japan', ten: 'Thần thoại Nhật Bản', dp: 'japan' },
] as const;

function theGioi(): WorldState {
  const cauHinh = KhoiTaoWorldSchema.parse({
    cua: 'day_du',
    seed: 'da-than-thoai',
    worldId: 'w.dathan',
    branchId: 'br_goc',
  });
  const { world, events } = moThuGioi(cauHinh);
  const state = taoState(world);
  const result = apDungChuoi(state, events, taoEventLog());
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '));
  return state;
}

function nap(muc: (typeof SACH)[number], branchId: string): Lorebook {
  const goc = JSON.parse(readFileSync(join(process.cwd(), 'public/lorebooks', muc.tep), 'utf8')) as unknown;
  const kq = nhapLorebook({ goc, id: muc.id, ten: muc.ten, nguon: 'nguoi_dung', branchId });
  expect(kq.ok, JSON.stringify(kq.issues.filter((i) => i.severity === 'error'))).toBe(true);
  return kq.lorebook as Lorebook;
}

/** Bật `soSach` sách đầu tiên vào thế giới, trả về danh sách đã bật. */
function batNhieu(state: WorldState, soSach: number): readonly Lorebook[] {
  const ds = SACH.slice(0, soSach).map((muc) => ({
    ...nap(muc, state.world.branchId),
    bat: true,
    tickBat: state.world.tick,
  }));
  for (const lb of ds) state.lorebooks.set(lb.id, lb);
  return ds;
}

const daoDien = (lb: Lorebook, dp: string): (typeof lb.entries)[number] => {
  const e = lb.entries.find((x) => x.id === `${dp}.director`);
  expect(e, `${lb.ten} thiếu entry đạo diễn`).toBeDefined();
  return e!;
};

describe('Đa thần thoại — bật nhiều lorebook', () => {
  it('một sách: trần giữ nguyên, và mục đa thần thoại tự tắt', () => {
    const state = theGioi();
    const [greek] = batNhieu(state, 1);
    const entry = daoDien(greek!, 'greek');
    const nc = taoNguCanhEjsLore(state, greek!, entry);

    expect(nc.daThan.soSach).toBe(1);
    expect(nc.daThan.chuTri).toBe(false);
    expect(nc.daThan.giaoUoc).toBe('');
    expect(nc.daThan.khungCanh).toContain('không áp dụng');
    // Trần và tỷ lệ kết tinh y như trước khi có tính năng này.
    expect(nc.lore.gravity).toBe(greek!.lucHapDan);
    expect(nc.daThan.phanCua).toBe(greek!.lucHapDan);
  });

  /**
   * Đây là bất biến trung tâm: bật thêm sách KHÔNG cho thêm thế giới.
   *
   * Nếu mỗi sách giữ nguyên trần của nó, ba sách cộng lại thành hơn hai trăm
   * phần trăm thế giới — và thứ bị ép ra ngoài trước tiên luôn là phần của người
   * chơi, vì nó là phần duy nhất không có sách nào bênh.
   */
  it('nhiều sách: trần bị chia, tổng không vượt trần chung, và sàn người chơi còn nguyên', () => {
    for (const soSach of [2, 3]) {
      const state = theGioi();
      const ds = batNhieu(state, soSach);
      const phanCua = ds.map((lb) => {
        const dp = SACH.find((m) => m.id === lb.id)!.dp;
        return taoNguCanhEjsLore(state, lb, daoDien(lb, dp)).daThan.phanCua;
      });

      const tong = phanCua.reduce((a, b) => a + b, 0);
      expect(tong, `${soSach} sách`).toBeLessThanOrEqual(TRAN_DA_THAN + 1);
      expect(100 - tong, `${soSach} sách`).toBeGreaterThanOrEqual(100 - TRAN_DA_THAN - 1);

      // Không sách nào bị chia về 0 — một hệ có mặt mà không kết tinh nổi gì thì
      // chỉ còn là nhiễu trong ngữ cảnh.
      for (const p of phanCua) expect(p).toBeGreaterThan(10);

      // Và mỗi sách bị chia THẤP HƠN trần riêng của nó: đó là cái giá của việc
      // đứng chung thế giới với hệ khác.
      for (const lb of ds) {
        const dp = SACH.find((m) => m.id === lb.id)!.dp;
        const nc = taoNguCanhEjsLore(state, lb, daoDien(lb, dp));
        expect(nc.daThan.phanCua, lb.ten).toBeLessThan(lb.lucHapDan);
        expect(nc.lore.gravity, lb.ten).toBe(nc.daThan.phanCua);
      }
    }
  });

  it('chia theo tỷ lệ lực hút tự khai, không chia đều', () => {
    const state = theGioi();
    const ds = batNhieu(state, 3);
    const phan = new Map(
      ds.map((lb) => {
        const dp = SACH.find((m) => m.id === lb.id)!.dp;
        return [lb.ten, taoNguCanhEjsLore(state, lb, daoDien(lb, dp)).daThan.phanCua] as const;
      }),
    );
    // Ấn Độ khai 72, Hy Lạp 68, Nhật 66 — thứ tự ấy phải được giữ sau khi chia.
    expect(phan.get('Thần thoại Ấn Độ')!).toBeGreaterThan(phan.get('Thần thoại Hy Lạp')!);
    expect(phan.get('Thần thoại Hy Lạp')!).toBeGreaterThan(phan.get('Thần thoại Nhật Bản')!);
  });

  /**
   * Giao ước dài. Ba sách cùng in nó là ba lần trả tiền token cho một đoạn — và
   * là đúng loại lặp mà chính giao ước đang cấm.
   */
  it('giao ước đầy đủ xuất hiện đúng MỘT lần, các sách còn lại mang bản rút gọn', () => {
    const state = theGioi();
    const ds = batNhieu(state, 3);

    const nc = ds.map((lb) => {
      const dp = SACH.find((m) => m.id === lb.id)!.dp;
      return taoNguCanhEjsLore(state, lb, daoDien(lb, dp));
    });

    expect(nc.filter((x) => x.daThan.chuTri)).toHaveLength(1);
    const day = nc.filter((x) => x.daThan.giaoUoc.includes('GIAO ƯỚC ĐA THẦN THOẠI'));
    expect(day).toHaveLength(1);
    expect(day[0]!.daThan.chuTri).toBe(true);

    // Sách không chủ trì vẫn phải biết luật — bản rút gọn không được rỗng, vì
    // bản đầy đủ có thể bị cắt khỏi ngữ cảnh khi hết ngân sách.
    for (const x of nc.filter((y) => !y.daThan.chuTri)) {
      expect(x.daThan.giaoUoc).toContain('ĐA THẦN THOẠI');
      expect(x.daThan.giaoUoc).toContain('KHÔNG sáp nhập thần điện');
    }

    // Bốn chỗ chạm là phần không được rơi mất khỏi bản đầy đủ.
    for (const moc of ['TRỜI —', 'CÕI CHẾT —', 'LUẬT —', 'THỜI —', 'DỊCH SAI']) {
      expect(day[0]!.daThan.giaoUoc, moc).toContain(moc);
    }
  });

  it('chủ trì ổn định: không phụ thuộc entry đang render hay thứ tự bật', () => {
    const xuoi = theGioi();
    batNhieu(xuoi, 3);
    const ds = [...xuoi.lorebooks.values()];

    // Cùng một thế giới, đổi entry render: ai chủ trì không được đổi theo.
    for (const lb of ds) {
      const dp = SACH.find((m) => m.id === lb.id)!.dp;
      const daoDienNc = taoNguCanhEjsLore(xuoi, lb, daoDien(lb, dp));
      const entryKhac = lb.entries[40] ?? lb.entries[1]!;
      const khacNc = taoNguCanhEjsLore(xuoi, lb, entryKhac);
      expect(khacNc.daThan.chuTri, lb.ten).toBe(daoDienNc.daThan.chuTri);
      expect(khacNc.daThan.phanCua, lb.ten).toBe(daoDienNc.daThan.phanCua);
    }

    // Bật theo thứ tự ngược cũng ra cùng một sách chủ trì.
    const nguoc = theGioi();
    for (const muc of [...SACH].reverse()) {
      const lb = { ...nap(muc, nguoc.world.branchId), bat: true, tickBat: nguoc.world.tick };
      nguoc.lorebooks.set(lb.id, lb);
    }
    const chuTriCua = (s: WorldState): string => {
      for (const lb of s.lorebooks.values()) {
        const dp = SACH.find((m) => m.id === lb.id)!.dp;
        if (taoNguCanhEjsLore(s, lb, daoDien(lb, dp)).daThan.chuTri) return lb.id;
      }
      return '';
    };
    expect(chuTriCua(nguoc)).toBe(chuTriCua(xuoi));
  });

  it('tắt bớt sách thì các sách còn lại lấy lại phần đã nhường', () => {
    const state = theGioi();
    const ds = batNhieu(state, 3);
    const japan = ds.find((lb) => lb.id === 'lore.japan')!;
    const phanKhiBaSach = taoNguCanhEjsLore(state, japan, daoDien(japan, 'japan')).daThan.phanCua;

    state.lorebooks.set('lore.greek', { ...state.lorebooks.get('lore.greek')!, bat: false });
    state.lorebooks.set('lore.india', { ...state.lorebooks.get('lore.india')!, bat: false });

    const nc = taoNguCanhEjsLore(state, japan, daoDien(japan, 'japan'));
    expect(nc.daThan.soSach).toBe(1);
    expect(nc.daThan.phanCua).toBe(japan.lucHapDan);
    expect(nc.daThan.phanCua).toBeGreaterThan(phanKhiBaSach);
    expect(nc.daThan.giaoUoc).toBe('');
  });

  it('quan hệ lấy từ conflictPolicy của chính các sách; hệ đòi hỏi nhiều nhất thắng', () => {
    const state = theGioi();
    const ds = batNhieu(state, 3);
    const japan = ds.find((lb) => lb.id === 'lore.japan')!;

    // Ba sách dựng sẵn đều khai `song_song`.
    const songSong = taoNguCanhEjsLore(state, japan, daoDien(japan, 'japan'));
    expect(songSong.daThan.quanHe).toBe('song_song');

    state.lorebooks.set('lore.greek', {
      ...state.lorebooks.get('lore.greek')!,
      conflictPolicy: 'tranh_doat',
    });
    const tranhDoat = taoNguCanhEjsLore(state, japan, daoDien(japan, 'japan'));
    expect(tranhDoat.daThan.quanHe).toBe('tranh_doat');

    // Và quan hệ phải đổi được câu mở của giao ước, không chỉ đổi một cái nhãn.
    const chuTri = ds.find(
      (lb) => taoNguCanhEjsLore(state, lb, daoDien(lb, SACH.find((m) => m.id === lb.id)!.dp)).daThan.chuTri,
    )!;
    const giaoUoc = taoNguCanhEjsLore(
      state,
      chuTri,
      daoDien(chuTri, SACH.find((m) => m.id === chuTri.id)!.dp),
    ).daThan.giaoUoc;
    expect(giaoUoc).toContain('TRANH ĐOẠT');
    expect(giaoUoc).not.toContain('SONG SONG —');
  });

  /**
   * Chuỗi do engine dựng KHÔNG được mang thẻ EJS: `renderEjsLore()` thay thẻ
   * bằng giá trị rồi dừng, không quét lại phần vừa thay. Một `<%= user.name %>`
   * nằm trong giao ước sẽ lọt ra nguyên văn trong lời kể — đúng lỗi mà tầng nhập
   * đang bắt với `<user>` của SillyTavern, chỉ khác là nó đến từ phía engine.
   */
  it('ba entry đạo diễn render sạch giao ước, không thẻ EJS nào sót', () => {
    const state = theGioi();
    const ds = batNhieu(state, 3);

    for (const lb of ds) {
      const dp = SACH.find((m) => m.id === lb.id)!.dp;
      const entry = daoDien(lb, dp);
      const kq = renderEjsLore(entry.noiDung, taoNguCanhEjsLore(state, lb, entry));
      expect(kq.errors, lb.ten).toEqual([]);
      expect(kq.text, lb.ten).not.toContain('<%');
      expect(kq.text, lb.ten).not.toContain('%>');
      expect(kq.text, lb.ten).toContain('ĐA THẦN THOẠI');
      expect(kq.text, lb.ten).toContain('Người Chơi');
      // Đạo diễn phải tự hạ giọng: hệ của nó chỉ là MỘT trong các lực hút.
      expect(kq.text, lb.ten).toContain('không phải đích đến duy nhất');
    }

    // Và mọi entry của cả ba sách vẫn render sạch khi ba sách cùng bật.
    const loi: string[] = [];
    for (const lb of ds) {
      for (const entry of lb.entries) {
        const kq = renderEjsLore(entry.noiDung, taoNguCanhEjsLore(state, lb, entry));
        if (kq.errors.length > 0) loi.push(`${lb.id}/${entry.id}: ${kq.errors[0]}`);
        if (kq.text.includes('<%')) loi.push(`${lb.id}/${entry.id}: thẻ EJS sót`);
      }
    }
    expect(loi).toEqual([]);
  });

  it('ba sách cùng vào truy hồi mà không sách nào bị nuốt', () => {
    const state = theGioi();
    const ds = batNhieu(state, 3);
    state.world = { ...state.world, tick: state.world.tick + 40 };

    const chunk = dungChiMuc(state, 'thần linh, cõi chết, lời thề').filter((c) =>
      c.id.startsWith('ck_lore_'),
    );
    const theoSach = new Map<string, number>();
    for (const c of chunk) {
      const id = String(c.meta['lorebookId']);
      theoSach.set(id, (theoSach.get(id) ?? 0) + 1);
    }
    for (const lb of ds) expect(theoSach.get(lb.id) ?? 0, lb.ten).toBeGreaterThan(0);

    // Giao ước đi cùng entry đạo diễn, nên nó có mặt trong chỉ mục đúng một lần.
    const mangGiaoUoc = chunk.filter((c) => c.noiDung.includes('GIAO ƯỚC ĐA THẦN THOẠI'));
    expect(mangGiaoUoc).toHaveLength(1);
  });
});
