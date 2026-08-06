/**
 * Cổng Kho Từ — vốn từ thế giới tự tích lũy.
 *
 * Bốn điều phải đúng, và cả bốn đều là điều người dùng đã yêu cầu thành lời:
 *
 *   1. vốn từ KHÔNG phải một bảng cứng — nó lớn lên bằng chính chữ thế giới đẻ ra;
 *   2. có TRẦN, và trần lớn hơn nghìn;
 *   3. không nhận từ đã có;
 *   4. không nhận từ GẦN GIỐNG — luật khó nhất, và là luật giữ cho thế giới
 *      không biến thành một danh sách lỗi chính tả.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog } from '../engine/state.js';
import type { WorldState, EventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { datLaiInvariant } from '../engine/invariant.js';
import { napBatBienTheGioiSong } from './batBien.js';
import { moThuGioi, KhoiTaoWorldSchema } from './khoiTao.js';
import { eventGieoNen } from './gieoNen.js';
import { boiDapMotLuot } from './boiDap.js';
import {
  boDau,
  chuanHoa,
  ganGiong,
  khoaChinhTa,
  khoangCachSua,
  ketNapTu,
  khoGoc,
  docKho,
  hocTuTheGioi,
  tachTen,
  thongKeKho,
  hoaDauTieng,
  TRAN_TU_VUNG,
  VAI_TU,
} from './tuVung.js';
import type { PatchOp } from '../contracts/core.js';

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
});

function theGioi(seed = 'tuvung'): { state: WorldState; log: EventLog } {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  expect(apDungChuoi(state, events, log).ok).toBe(true);
  const evNen = eventGieoNen(state);
  if (evNen) expect(apDungEvent(state, evNen, log).ok).toBe(true);
  return { state, log };
}

// ═══════════════════════════════════════════ chuẩn hóa và khoảng cách

describe('chuẩn hóa — hai cách viết một chữ là MỘT chữ', () => {
  it('khóa so trùng GIỮ dấu: "Cấm" và "Câm" là hai chữ, không phải một', () => {
    expect(chuanHoa('Vô Thủy')).toBe('vô thủy');
    expect(chuanHoa('  VÔ   THỦY ')).toBe('vô thủy');
    expect(chuanHoa('Cấm')).not.toBe(chuanHoa('Câm'));
    expect(chuanHoa('Đàm')).not.toBe(chuanHoa('Đầm'));
  });

  it('dạng bỏ dấu chỉ dùng để so gần giống; `đ` là chữ cái riêng', () => {
    expect(boDau('Vô Thủy')).toBe('vo thuy');
    expect(boDau('Đáy')).toBe('day');
    expect(boDau('Đầm')).toBe('dam');
    expect(boDau('Ngưỡng')).not.toBe(boDau('Ngàn'));
  });

  it('[BB] khóa chính tả gộp biến thể ĐẶT DẤU, không gộp hai từ khác nhau', () => {
    // Lỗi quan sát được: thế giới học vào cả "Hòe" lẫn "Hoè" — một từ, hai lối
    // đặt dấu. Khóa chính tả phải coi chúng là một.
    expect(khoaChinhTa('Hòe')).toBe(khoaChinhTa('Hoè'));
    expect(khoaChinhTa('Thuý')).toBe(khoaChinhTa('Thúy'));
    // Nhưng khác dấu là khác từ, và phải giữ được cả hai.
    expect(khoaChinhTa('Cấm')).not.toBe(khoaChinhTa('Câm'));
    expect(khoaChinhTa('Đàm')).not.toBe(khoaChinhTa('Đầm'));
    expect(khoaChinhTa('Cẩn')).not.toBe(khoaChinhTa('Cạn'));
  });

  it('kết nạp chặn biến thể đặt dấu, nhưng vẫn nhận từ khác dấu', () => {
    const kho = ketNapTu([], [{ tu: 'Hòe', vai: 'ho_nguoi', tick: 0 }]).kho;
    const kq = ketNapTu(kho, [
      { tu: 'Hoè', vai: 'ho_nguoi', tick: 1 },
      { tu: 'Câm', vai: 'duoi_dia', tick: 1 },
      { tu: 'Cấm', vai: 'hieu_nguoi', tick: 1 },
    ]);
    expect(kq.biTuChoi.map((x) => x.lyDo)).toEqual(['da_co']);
    expect(kq.daNhan.map((x) => x.tu)).toEqual(['Câm', 'Cấm']);
  });

  it('[BB] đơn âm KHÔNG bị luật gần giống soi — "Sa" và "Xa" là hai từ', () => {
    for (const [a, b] of [
      ['Sa', 'Xa'],
      ['Gò', 'Bờ'],
      ['Cạn', 'Mặn'],
      ['Bạch', 'Mạch'],
      ['Trù', 'Trục'],
    ]) {
      expect(ganGiong(a as string, b as string)).toBe(false);
    }
    // Còn từ đủ dài thì vẫn bị soi.
    expect(ganGiong('Vô Thủy', 'Vô Thuc')).toBe(true);
    expect(ganGiong('Khuyết', 'Huyệt')).toBe(true);
  });

  it('khoảng cách sửa dừng sớm và đúng ở ngưỡng 1', () => {
    expect(khoangCachSua('vo thuy', 'vo thuy')).toBe(0);
    expect(khoangCachSua('vo thuy', 'vo thuc')).toBe(1);
    expect(khoangCachSua('vuc', 'vu')).toBe(1);
    expect(khoangCachSua('vuc', 'vucs')).toBe(1);
    // Lệch từ hai trở lên chỉ cần biết là "> 1".
    expect(khoangCachSua('vuc', 'ngan')).toBeGreaterThan(1);
    expect(khoangCachSua('coi', 'tang')).toBeGreaterThan(1);
  });

  it('hoaDauTieng cho dạng hiển thị, khác hẳn dạng so sánh', () => {
    expect(hoaDauTieng('  vô   thủy ')).toBe('Vô Thủy');
    expect(hoaDauTieng('VỰC')).toBe('VỰC');
  });
});

// ═══════════════════════════════════════════ ba luật kết nạp

describe('kết nạp — có trần, không trùng, không gần giống', () => {
  it('[yêu cầu] trần lớn hơn một nghìn', () => {
    expect(TRAN_TU_VUNG).toBeGreaterThan(1000);
  });

  /**
   * Trần nâng lên thì luật 3 phải vẫn đúng VÀ vẫn rẻ.
   *
   * Hai vế, và vế thứ hai là vế dễ mất: bản đầu quét cả kho cho mỗi ứng viên,
   * nên nâng trần bốn lần là làm phép kết nạp chậm bốn lần. Chỉ mục theo độ dài
   * ở `ketNapTu()` giữ nó tuyến tính theo rổ, không theo kho — bài này kết nạp
   * mười nghìn chữ để chứng minh cả hai vế trên cùng một lần chạy.
   */
  it('trần mới vẫn giữ đúng ba luật, và kết nạp mười nghìn chữ không đứng hình', () => {
    const ungVien = Array.from({ length: 10_000 }, (_, i) => ({
      tu: `Trầm ${String(i).padStart(5, '0')}`.replace(/\d/g, (d) => 'abcdefghij'[Number(d)] as string),
      vai: 'duoi_dia' as const,
      tick: 1,
    }));
    const kq = ketNapTu(khoGoc(), ungVien, TRAN_TU_VUNG);

    // Mỗi chữ nhận vào phải khác MỌI chữ đã nhận trước nó, cả về khóa chính tả
    // lẫn về luật gần giống. Đây là hợp đồng, và nó không được lỏng đi vì kho to.
    const khoa = new Set<string>();
    for (const x of kq.kho) {
      expect(khoa.has(khoaChinhTa(x.tu))).toBe(false);
      khoa.add(khoaChinhTa(x.tu));
    }
    expect(kq.kho.length).toBeLessThanOrEqual(TRAN_TU_VUNG);
    expect(kq.daNhan.length).toBeGreaterThan(100);
    // Lấy mẫu chéo: không cặp nào trong kho cuối vi phạm luật gần giống.
    const mau = kq.kho.slice(-200);
    for (let i = 0; i < mau.length; i++) {
      for (let j = i + 1; j < mau.length; j++) {
        expect(ganGiong(mau[i]?.tu ?? '', mau[j]?.tu ?? '')).toBe(false);
      }
    }
  });

  it('trần là trần CỨNG: đầy thì từ chối, không nở thêm một chữ nào', () => {
    const kho = khoGoc();
    const kq = ketNapTu(
      kho,
      Array.from({ length: 20 }, (_, i) => ({
        tu: `Chữ${'x'.repeat(i + 1)}`,
        vai: 'duoi_dia' as const,
        tick: 1,
      })),
      kho.length, // trần đúng bằng kho hiện tại → không nhận thêm được gì
    );
    expect(kq.daNhan).toHaveLength(0);
    expect(kq.kho).toHaveLength(kho.length);
    expect(kq.biTuChoi.every((x) => x.lyDo === 'day_kho' || x.lyDo === 'ky_tu_la')).toBe(true);
  });

  it('[BB] không nhận từ ĐÃ CÓ — kể cả khi viết hoa khác đi', () => {
    const kho = khoGoc();
    const kq = ketNapTu(kho, [
      { tu: 'Vực', vai: 'dau_dia', tick: 1 },
      { tu: 'vực', vai: 'dau_dia', tick: 1 },
      { tu: 'VỰC', vai: 'ho_nguoi', tick: 1 },
    ]);
    expect(kq.daNhan).toHaveLength(0);
    expect(kq.biTuChoi.map((x) => x.lyDo)).toEqual(['da_co', 'da_co', 'da_co']);
  });

  it('[BB] không nhận từ GẦN GIỐNG — lệch một chữ ở từ đủ dài là bị chặn', () => {
    const kho = ketNapTu([], [{ tu: 'Vô Thủy', vai: 'duoi_dia', tick: 0 }]).kho;
    const kq = ketNapTu(kho, [
      // Chỉ khác dấu: khóa trùng giữ dấu nên nó lọt luật 2, và luật 3 bắt —
      // đúng vai trò của luật 3 với những từ đủ dài.
      { tu: 'Vô Thúy', vai: 'duoi_dia', tick: 1 },
      // Khác một chữ cái thật.
      { tu: 'Vô Thúc', vai: 'duoi_dia', tick: 1 },
      { tu: 'Vô Thuyt', vai: 'duoi_dia', tick: 1 },
      // Đủ khác thì vào được — luật này không được chặn cả những chữ thật.
      { tu: 'Vô Chung', vai: 'duoi_dia', tick: 1 },
    ]);
    expect(kq.daNhan.map((x) => x.tu)).toEqual(['Vô Chung']);
    expect(kq.biTuChoi.map((x) => x.lyDo)).toEqual(['gan_giong', 'gan_giong', 'gan_giong']);
  });

  it('từ vừa nhận CHẶN NGAY từ gần giống nó trong cùng một lô', () => {
    const kq = ketNapTu(
      [],
      [
        { tu: 'Bích Lạc', vai: 'duoi_dia', tick: 1 },
        { tu: 'Bích Lộc', vai: 'duoi_dia', tick: 1 },
      ],
    );
    expect(kq.daNhan).toHaveLength(1);
    expect(kq.biTuChoi[0]?.lyDo).toBe('gan_giong');
  });

  it('lọc hình thức: rỗng, quá ngắn, quá dài, có số, quá ba tiếng', () => {
    const kq = ketNapTu(
      [],
      [
        { tu: '   ', vai: 'duoi_dia', tick: 0 },
        { tu: 'X', vai: 'duoi_dia', tick: 0 },
        { tu: 'Một Cái Tên Dài Quá Mức Cho Phép', vai: 'duoi_dia', tick: 0 },
        { tu: 'Vực 7', vai: 'duoi_dia', tick: 0 },
        { tu: 'Một Hai Ba Bốn', vai: 'duoi_dia', tick: 0 },
      ],
    );
    expect(kq.daNhan).toHaveLength(0);
    expect(kq.biTuChoi.map((x) => x.lyDo)).toEqual([
      'rong',
      'qua_ngan',
      'qua_dai',
      'ky_tu_la',
      'qua_nhieu_tieng',
    ]);
  });

  it('kho cũ KHÔNG bị sửa tại chỗ — hàm thuần', () => {
    const kho = khoGoc();
    const truoc = kho.length;
    ketNapTu(kho, [{ tu: 'Bích Lạc', vai: 'duoi_dia', tick: 1 }]);
    expect(kho).toHaveLength(truoc);
  });
});

// ═══════════════════════════════════════════ vốn gốc mang màu thần thoại

describe('vốn gốc — cấu trúc vũ trụ và quy luật, không phải làng quê', () => {
  it('có chữ về cấu trúc vũ trụ và về quy luật', () => {
    const tu = khoGoc().map((x) => x.tu);
    for (const vuTru of ['Cõi', 'Tầng', 'Trục', 'Vực', 'Ngưỡng', 'Vòm']) {
      expect(tu).toContain(vuTru);
    }
    for (const luat of ['Luật', 'Giới', 'Cấm', 'Nghiệp', 'Kiếp', 'Đạo', 'Mệnh']) {
      expect(tu).toContain(luat);
    }
    for (const thanThoai of ['Hỗn Mang', 'Vô Thủy', 'Vô Chung', 'Tịch Diệt']) {
      expect(tu).toContain(thanThoai);
    }
  });

  it('vốn gốc tự nó đã sạch: không chữ nào trùng hay gần giống chữ nào', () => {
    const goc = khoGoc();
    // Kết nạp lại chính nó vào một kho rỗng — phải nhận đủ, không loại chữ nào.
    const kq = ketNapTu(
      [],
      goc.map((x) => ({ tu: x.tu, vai: x.vai, tick: 0, nguon: 'goc' as const })),
    );
    expect(kq.biTuChoi).toEqual([]);
    expect(kq.daNhan).toHaveLength(goc.length);
  });

  it('mỗi vai đều có chữ — không vai nào rỗng ngay từ nhịp 0', () => {
    const tk = thongKeKho(khoGoc());
    for (const v of VAI_TU) expect(tk.theoVai[v]).toBeGreaterThan(0);
    expect(tk.tuGoc).toBe(tk.tong);
    expect(tk.tuTheGioi).toBe(0);
  });

  it('docKho() trả vốn gốc cho ván lưu trước bản này, và bỏ hàng hỏng', () => {
    expect(docKho([]).length).toBe(khoGoc().length);
    expect(docKho([{ khong: 'phai tu vung' }]).length).toBe(khoGoc().length);
    const that = docKho([{ tu: 'Bích Lạc', vai: 'duoi_dia', tickThem: 4, nguon: 'the_gioi', soLanDung: 0 }]);
    expect(that).toHaveLength(1);
    expect(that[0]?.tu).toBe('Bích Lạc');
  });
});

// ═══════════════════════════════════════════ học từ thế giới

describe('[BB] không phải bảng cứng — thế giới học chữ của chính nó', () => {
  it('tách tên thành đầu và đuôi', () => {
    expect(tachTen('Vực Vô Thủy')).toEqual({ dau: 'Vực', duoi: 'Vô Thủy' });
    expect(tachTen('Ngưỡng')).toEqual({ dau: 'Ngưỡng', duoi: '' });
  });

  it('tên do lời kể đặt ra trở thành vốn từ, đúng vai của nó', () => {
    const { state, log } = theGioi('hoc');
    const evId = 'ev_ke_gia';
    const patches: PatchOp[] = [
      {
        op: 'link',
        target: { table: 'entities', id: 'place_thanh', path: '' },
        value: {
          id: 'place_thanh',
          branchId: 'br_goc',
          kind: 'place',
          ten: 'Đài Bích Lạc',
          moTa: '',
          aliases: [],
          tickSinh: 0,
          tickDiet: null,
          tags: [],
          aspects: { spatial: { chaId: null, toaDo: { x: 3, y: 3 }, banKinh: 1, danSo: 0 } },
          _degree: 0,
          _hash: '',
          _version: 0,
        },
        sourceEventId: evId,
      },
    ];
    expect(
      apDungEvent(
        state,
        taoEvent({
          id: evId,
          branchId: 'br_goc',
          tick: state.world.tick,
          loai: 'narrator_cap_nhat',
          actorIds: [],
          targetIds: [],
          causeEventIds: [],
          locationId: null,
          patches,
          visibility: 'cong_khai',
          source: 'ai_validated',
          payload: {},
        }),
        log,
      ).ok,
    ).toBe(true);

    const ung = hocTuTheGioi(state, 40);
    // "Đài" là chữ THẾ GIỚI NÀY vừa đẻ ra — vốn gốc không có nó.
    expect(khoGoc().some((x) => x.tu === 'Đài')).toBe(false);
    expect(ung.some((u) => u.tu === 'Đài' && u.vai === 'dau_dia')).toBe(true);
    expect(ung.some((u) => u.tu === 'Bích Lạc' && u.vai === 'duoi_dia')).toBe(true);
  });

  it('khái niệm cho ĐUÔI, không cho đầu — "Vực Ô Uế" chứ không "Ô Uế Sâu"', () => {
    const { state } = theGioi('vai');
    const ung = hocTuTheGioi(state, 60);
    for (const u of ung) {
      const e = [...state.entities.values()].find((x) => x.ten === u.tu);
      if (e && (e.kind === 'concept' || e.kind === 'law')) expect(u.vai).toBe('duoi_dia');
    }
  });

  it('thợ `hoc_tu_moi` đưa chữ mới vào `worlds.tuVung` bằng patch', () => {
    const { state } = theGioi('tho');
    const kq = boiDapMotLuot({
      state,
      eventId: 'ev_hoc',
      tick: state.world.tick,
      tho: ['hoc_tu_moi'],
      hanMuc: 3,
    });
    const p = kq.patches.find((x) => x.target.table === 'worlds' && x.target.path === 'tuVung');
    expect(p).toBeDefined();
    expect(Array.isArray(p?.value)).toBe(true);
    expect((kq.tuMoi ?? []).length).toBeGreaterThan(0);
    // Và chữ mới đó KHÔNG có trong vốn gốc — nó tới từ thế giới.
    const goc = new Set(khoGoc().map((x) => chuanHoa(x.tu)));
    expect((kq.tuMoi ?? []).every((x) => !goc.has(chuanHoa(x.tu)))).toBe(true);
  });

  it('chạy nhiều lượt thì kho LỚN LÊN rồi dừng lại khi hết chữ để học', () => {
    const { state, log } = theGioi('lon');
    let truoc = docKho(state.world.tuVung).length;
    let daLon = false;

    for (let i = 0; i < 5; i++) {
      const kq = boiDapMotLuot({ state, eventId: `ev_l${i}`, tick: state.world.tick, hanMuc: 4 });
      if (kq.patches.length === 0) break;
      const ok = apDungEvent(
        state,
        taoEvent({
          id: `ev_l${i}`,
          branchId: state.world.branchId,
          tick: state.world.tick,
          loai: 'boi_dap',
          actorIds: [],
          targetIds: [],
          causeEventIds: [],
          locationId: null,
          patches: [...kq.patches],
          visibility: 'engine',
          source: 'engine',
          payload: {},
        }),
        log,
      );
      expect(ok.ok, ok.ok ? '' : JSON.stringify(ok.errors)).toBe(true);
      const sau = docKho(state.world.tuVung).length;
      if (sau > truoc) daLon = true;
      truoc = sau;
    }

    expect(daLon).toBe(true);
    // Và nó không bao giờ vượt trần.
    expect(docKho(state.world.tuVung).length).toBeLessThanOrEqual(TRAN_TU_VUNG);
  });

  it('tên do Bồi Đắp đặt ra chỉ dùng chữ CÓ TRONG kho', () => {
    const { state, log } = theGioi('dung-kho');
    const kq = boiDapMotLuot({ state, eventId: 'ev_dat', tick: state.world.tick, hanMuc: 6 });
    const ok = apDungEvent(
      state,
      taoEvent({
        id: 'ev_dat',
        branchId: state.world.branchId,
        tick: state.world.tick,
        loai: 'boi_dap',
        actorIds: [],
        targetIds: [],
        causeEventIds: [],
        locationId: null,
        patches: [...kq.patches],
        visibility: 'engine',
        source: 'engine',
        payload: {},
      }),
      log,
    );
    expect(ok.ok).toBe(true);

    const kho = new Set(docKho(state.world.tuVung).map((x) => chuanHoa(x.tu)));
    for (const e of state.entities.values()) {
      if (!e.tags.includes('boi_dap') && !e.tags.includes('lang_tach')) continue;
      if (e.kind === 'route') continue; // tên đường ghép từ tên hai đầu, không từ kho
      const { dau, duoi } = tachTen(e.ten);
      expect(kho.has(chuanHoa(dau))).toBe(true);
      if (duoi !== '') expect(kho.has(chuanHoa(duoi))).toBe(true);
    }
  });
});
