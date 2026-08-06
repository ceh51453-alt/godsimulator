/**
 * Cổng Phase 3 — hàm chiếu và lát dọc offline.
 *
 * [BB] Phần 18.3: "Nếu nó đọc ra văn bản luật gốc → assembler đang rò rỉ.
 *  DỪNG MỌI VIỆC KHÁC VÀ SỬA. Đây là bug nghiêm trọng nhất trong toàn dự án."
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { chieu } from './chieu.js';
import { bopMeo, mucMeo, meoSo, meoTen, meoMoTa, meoThoiGian } from './distort.js';
import { taoState, taoEventLog, hashState } from '../engine/state.js';
import type { WorldState } from '../engine/state.js';
import { apDungEvent, apDungChuoi } from '../engine/transaction.js';
import { moThuGioi, KhoiTaoWorldSchema, eventGieoTheGioi } from '../world/khoiTao.js';
import { eventHienDien, eventChuyenTang, kiemNhapHienDien } from '../world/hienDien.js';
import { StartingPresenceDraftSchema } from '../schema/player.js';
import { motTick, MUOI_BON_BUOC } from '../engine/tick.js';
import { TUNING_MAC_DINH } from '../tuning/schema.js';
import { napDungSan } from '../registry/index.js';
import { replay } from '../engine/replay.js';

const CT = KhoiTaoWorldSchema.parse({
  cua: 'hu_vo',
  seed: 'phase3-seed',
  worldId: 'w1',
  branchId: 'br',
});

function theGioiDaGieo(): { state: WorldState; log: ReturnType<typeof taoEventLog> } {
  napDungSan();
  const { world, events } = moThuGioi(CT);
  const state = taoState(world);
  const log = taoEventLog();
  const r = apDungChuoi(state, events, log);
  if (!r.ok) throw new Error(`gieo thế giới thất bại: ${r.errors[0]?.message}`);
  return { state, log };
}

let state: WorldState;
let log: ReturnType<typeof taoEventLog>;

beforeEach(() => {
  const t = theGioiDaGieo();
  state = t.state;
  log = t.log;
});

// ─────────────────────────────────────────── khởi tạo thế giới

describe('ba cửa vào — Phần 17.4', () => {
  it('gieo thế giới tạo đủ luật nền, luật thường, khái niệm, thần, phàm nhân, hai nơi', () => {
    const kinds = [...state.entities.values()].map((e) => e.kind).sort();
    expect(kinds.filter((k) => k === 'law')).toHaveLength(2);
    expect(kinds.filter((k) => k === 'concept')).toHaveLength(2);
    expect(kinds.filter((k) => k === 'deity')).toHaveLength(1);
    expect(kinds.filter((k) => k === 'mortal')).toHaveLength(1);
    expect(kinds.filter((k) => k === 'place')).toHaveLength(2);
  });

  it('[BB] 8.3 — khái niệm mới có phản nghĩa tự sinh ở hu_danh', () => {
    const pn = state.entities.get('concept_thanh_sach');
    const c = pn?.aspects['conceptual'] as { giaiDoan?: string; trongSo?: number };
    expect(c.giaiDoan).toBe('hu_danh');
    expect(c.trongSo).toBe(0);
  });

  it('[BB] 6.3 — không thực thể mồ côi sau khi gieo', () => {
    const bac = new Map<string, number>();
    for (const id of state.entities.keys()) bac.set(id, 0);
    for (const lk of state.links.values()) {
      bac.set(lk.tuId, (bac.get(lk.tuId) ?? 0) + 1);
      bac.set(lk.denId, (bac.get(lk.denId) ?? 0) + 1);
    }
    for (const [id, n] of bac) expect(n, `'${id}' mồ côi`).toBeGreaterThan(0);
  });

  it('cùng seed gieo ra cùng thế giới; seed khác cho thế giới khác', () => {
    const a = eventGieoTheGioi(CT);
    const b = eventGieoTheGioi(CT);
    expect(a.hash).toBe(b.hash);
    const c = eventGieoTheGioi(KhoiTaoWorldSchema.parse({ ...CT, seed: 'seed-khac' }));
    expect(a.hash).not.toBe(c.hash);
  });

  it('hai vùng diễn giải cùng một luật LỆCH nhau — nền của Tầng 2 bắt buộc sai', () => {
    const l = state.entities.get('law_thuong')?.aspects['lawful'] as {
      dienGiai?: { vungId?: string; doLech?: number }[];
    };
    const ds = l.dienGiai ?? [];
    expect(ds).toHaveLength(2);
    expect(ds[0]?.doLech).not.toBe(ds[1]?.doLech);
  });
});

// ─────────────────────────────────────────── [BB] rò rỉ ba tầng

describe('[BB] Phần 18.2 — ba quy tắc cứng chống rò rỉ', () => {
  it('Sáng Thế thấy văn bản luật gốc', () => {
    const v = chieu(state, 'sang_the', null);
    const l = v.laws.find((x) => x.id === 'law_thuong');
    expect(l?.vanBan).toBe('Máu đã đổ thì không rửa được.');
  });

  it('[BB] PHÀM NHÂN KHÔNG BAO GIỜ thấy văn bản luật gốc', () => {
    const v = chieu(state, 'pham_nhan', 'mortal_1');
    for (const l of v.laws) {
      expect(l.vanBan, `luật '${l.id}' lộ văn bản gốc ở tầng phàm nhân`).toBeNull();
    }
  });

  it('[BB] phàm nhân chỉ thấy dienGiai của VÙNG MÌNH, và bản đó đã lệch', () => {
    const v = chieu(state, 'pham_nhan', 'mortal_1');
    const l = v.laws.find((x) => x.id === 'law_thuong');
    expect(l).toBeDefined();
    // mortal_1 cư trú ở place_a → phải thấy bản của place_a, không phải place_b.
    expect(l?.dienGiai).toContain('ô uế');
    expect(l?.doLech).toBeGreaterThan(0);
  });

  it('[BB] không chuỗi văn bản luật gốc nào lọt vào BẤT KỲ đâu trong view phàm nhân', () => {
    const v = chieu(state, 'pham_nhan', 'mortal_1');
    const chuoi = JSON.stringify({
      entities: [...v.entities.values()],
      laws: v.laws,
      concepts: v.concepts,
      suongMu: v.suongMu,
    });
    expect(chuoi).not.toContain('Máu đã đổ thì không rửa được');
    expect(chuoi).not.toContain('Điều đã xảy ra thì không thể chưa từng xảy ra');
  });

  it('[BB] kẽ hở engine đã biết KHÔNG lọt xuống tầng dưới', () => {
    for (const mode of ['than', 'pham_nhan'] as const) {
      const v = chieu(state, mode, mode === 'than' ? 'deity_1' : 'mortal_1');
      const chuoi = JSON.stringify([...v.entities.values()]);
      expect(chuoi, `kẽ hở lộ ở tầng ${mode}`).not.toContain('Bóp cổ không gây chảy máu');
    }
  });

  it('[BB] phàm nhân KHÔNG BAO GIỜ thấy banTinh thật của thần', () => {
    const that = state.entities.get('deity_1')?.aspects['soul'] as { banTinh?: Record<string, number> };
    expect(that.banTinh?.tuBi_tanNhan).toBeLessThan(0); // thần THẬT hiền

    const v = chieu(state, 'pham_nhan', 'mortal_1');
    const than = v.entities.get('deity_1');
    expect(than).toBeDefined();
    const soul = than?.aspects['soul'] as Record<string, unknown> | undefined;
    expect(soul?.['banTinh']).toBeUndefined();
    expect(soul?.['ducVong']).toBeUndefined();
    expect(soul?.['kyUc']).toBeUndefined();
  });

  it('[BB] phàm nhân CHỈ thấy banTinhTinDoTin — và bản đó NGƯỢC với sự thật', () => {
    const v = chieu(state, 'pham_nhan', 'mortal_1');
    const ven = v.entities.get('deity_1')?.aspects['venerable'] as {
      banTinhTinDoTin?: Record<string, number>;
    };
    expect(ven?.banTinhTinDoTin).toBeDefined();
    // Tín đồ tin thần TÀN NHẪN, trong khi thần thật thì hiền.
    expect(ven?.banTinhTinDoTin?.['tuBi_tanNhan']).toBeGreaterThan(0);
  });

  it('[BB] phàm nhân KHÔNG thấy trongSo của khái niệm', () => {
    const v = chieu(state, 'pham_nhan', 'mortal_1');
    for (const c of v.concepts) {
      expect(c.trongSo, `khái niệm '${c.id}' lộ trọng số`).toBeNull();
      expect(c.sacThai).toBeNull();
    }
  });

  it('[BB] phàm nhân không biết khái niệm còn ở hu_danh — nó nằm trong sương mù MÙ', () => {
    const v = chieu(state, 'pham_nhan', 'mortal_1');
    expect(v.suongMu.mu).toContain('concept_thanh_sach');
    expect(v.entities.has('concept_thanh_sach')).toBe(false);
  });

  it('[BB] id trong suongMu.mu KHÔNG xuất hiện ở bất kỳ chỗ nào khác của view', () => {
    for (const [mode, chuThe] of [
      ['than', 'deity_1'],
      ['pham_nhan', 'mortal_1'],
    ] as const) {
      const v = chieu(state, mode, chuThe);
      for (const id of v.suongMu.mu) {
        expect(v.entities.has(id), `'${id}' mù nhưng vẫn có trong entities`).toBe(false);
        expect(v.suongMu.ro).not.toContain(id);
        expect(v.suongMu.mo).not.toContain(id);
        expect(v.suongMu.tinDon).not.toContain(id);
      }
    }
  });

  it('Sáng Thế không có gì trong sương mù mù', () => {
    const v = chieu(state, 'sang_the', null);
    expect(v.suongMu.mu).toEqual([]);
    expect(v.entities.size).toBe(state.entities.size);
  });

  it('thần thấy văn bản luật TRONG domain nhưng không thấy kẽ hở', () => {
    const v = chieu(state, 'than', 'deity_1');
    const chuoi = JSON.stringify(v.laws);
    // Có thể thấy hoặc không tùy domain, nhưng kẽ hở thì tuyệt đối không.
    expect(chuoi).not.toContain('Bóp cổ');
  });
});

// ─────────────────────────────────────────── cùng Event, ba góc nhìn

describe('[BB] cùng một Event được chiếu KHÁC NHAU ở ba tầng', () => {
  it('ba view khác nhau về số entity thấy được và về nội dung', () => {
    const st = chieu(state, 'sang_the', null);
    const th = chieu(state, 'than', 'deity_1');
    const pn = chieu(state, 'pham_nhan', 'mortal_1');

    expect(st.entities.size).toBeGreaterThan(pn.entities.size);
    expect(st.visibilityHash).not.toBe(th.visibilityHash);
    expect(th.visibilityHash).not.toBe(pn.visibilityHash);
  });

  it('cùng entity mang tên khác nhau khi qua tin đồn', () => {
    const st = chieu(state, 'sang_the', null);
    const pn = chieu(state, 'pham_nhan', 'mortal_1');
    const tenThat = st.entities.get('place_b')?.ten;
    const tenNghe = pn.entities.get('place_b');
    if (tenNghe && tenNghe.mucRo === 'tin_don') {
      expect(tenNghe.daBopMeo).toBe(true);
      expect(tenNghe.ten).not.toBe(tenThat);
    }
  });

  it('visibilityHash ổn định giữa hai lần chiếu cùng state', () => {
    expect(chieu(state, 'pham_nhan', 'mortal_1').visibilityHash).toBe(
      chieu(state, 'pham_nhan', 'mortal_1').visibilityHash,
    );
  });

  it('chieu() không sửa state', () => {
    const truoc = hashState(state);
    chieu(state, 'sang_the', null);
    chieu(state, 'than', 'deity_1');
    chieu(state, 'pham_nhan', 'mortal_1');
    expect(hashState(state)).toBe(truoc);
  });

  it('[BB] 67.1 — sáu động từ chỉ khả dụng ở tầng Sáng Thế', () => {
    expect(chieu(state, 'sang_the', null).dongTuKhaDung).toHaveLength(6);
    expect(chieu(state, 'than', 'deity_1').dongTuKhaDung).toHaveLength(0);
    expect(chieu(state, 'pham_nhan', 'mortal_1').dongTuKhaDung).toHaveLength(0);
  });

  it('nhịp thời gian khác nhau theo tầng — Phần 1.2', () => {
    expect(chieu(state, 'sang_the', null).nhipThoiGian).toBe('the_dai');
    expect(chieu(state, 'than', 'deity_1').nhipThoiGian).toBe('nien');
    expect(chieu(state, 'pham_nhan', 'mortal_1').nhipThoiGian).toBe('nhat');
  });
});

// ─────────────────────────────────────────── bopMeo

describe('bopMeo — sai CÓ CẤU TRÚC, không phải mơ hồ', () => {
  const ts = { chang: 3, triThuc: 30, thienVi: 'phong_dai' as const, seed: 's' };

  it('deterministic', () => {
    expect(bopMeo('Đấng Tẩy Uế', 'Ngài hiền lành.', ts)).toEqual(
      bopMeo('Đấng Tẩy Uế', 'Ngài hiền lành.', ts),
    );
  });

  it('chặng 0 thì không méo gì cả', () => {
    const t0 = { ...ts, chang: 0 };
    expect(mucMeo(0, 50)).toBe(0);
    expect(meoTen('Tên Gốc', t0)).toBe('Tên Gốc');
    expect(meoMoTa('Một câu.', t0)).toBe('Một câu.');
  });

  it('càng nhiều chặng càng méo; tri thức cao thì méo ít', () => {
    expect(mucMeo(5, 20)).toBeGreaterThan(mucMeo(1, 20));
    expect(mucMeo(3, 90)).toBeLessThan(mucMeo(3, 10));
  });

  it('số bị phóng đại theo hướng có lợi cho phe kể', () => {
    const nhieuLan = Array.from({ length: 40 }, (_, i) =>
      meoSo(1000, { ...ts, seed: `s${i}`, thienVi: 'phong_dai' }),
    );
    const trungBinh = nhieuLan.reduce((a, b) => a + b, 0) / nhieuLan.length;
    expect(trungBinh).toBeGreaterThan(1000);
  });

  it('số truyền miệng bị làm tròn thành số kể được', () => {
    const v = meoSo(1847, { ...ts, chang: 4, triThuc: 10 });
    expect(v % 100).toBe(0);
  });

  it('thời gian bị dồn lại chứ không mất đi', () => {
    expect(meoThoiGian(0, 500, { ...ts, chang: 0 })).toContain('nhịp');
    expect(meoThoiGian(0, 500, { ...ts, chang: 6, triThuc: 5 })).toContain('chưa ai nhớ');
  });

  it('[BB] mô tả bị THAY bằng khẳng định khác, không bị cắt thành dấu chấm lửng', () => {
    const goc = 'Ngài đến lúc rạng đông. Ngài chữa lành cho ba người. Rồi ngài đi.';
    const meo = meoMoTa(goc, { ...ts, chang: 5, triThuc: 10 });
    expect(meo).not.toContain('...');
    expect(meo).not.toContain('…');
    expect(meo.length).toBeGreaterThan(10);
  });
});

// ─────────────────────────────────────────── hiện diện + chuyển tầng

describe('[BB] hiện diện ban đầu đi qua Event, không ghi World trực tiếp', () => {
  it('bắt đầu ở Sáng Thế: không cần entity nhập vai', () => {
    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({ mode: 'sang_the' });
    const r = eventHienDien(draft, v, state);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.chuTheId).toBeNull();
    expect(apDungEvent(state, r.value.events[0]!, log).ok).toBe(true);
    expect(state.world.playerState.mode).toBe('sang_the');
    expect(state.world.playerState.setupCompleted).toBe(true);
  });

  it('bắt đầu làm Thần tạo entity thật và gắn chuTheId', () => {
    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({
      mode: 'than',
      name: 'Kẻ Giữ Bến',
      deity: { domainConceptIds: ['concept_o_ue'] },
    });
    const r = eventHienDien(draft, v, state);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(apDungEvent(state, r.value.events[0]!, log).ok).toBe(true);
    expect(state.world.playerState.mode).toBe('than');
    expect(state.entities.get(r.value.chuTheId!)?.ten).toBe('Kẻ Giữ Bến');
  });

  it('[BB] 78.7 — suc của domain do ENGINE quyết, không do người chơi khai', () => {
    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({
      mode: 'than',
      name: 'Thần Mới',
      deity: { domainConceptIds: ['concept_o_ue'] },
    });
    const r = eventHienDien(draft, v, state);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    apDungEvent(state, r.value.events[0]!, log);
    const d = state.entities.get(r.value.chuTheId!)?.aspects['domain'] as {
      domains?: { suc: number }[];
    };
    // Khái niệm đang `thanh_hinh` → sức khiêm tốn, không phải 100.
    expect(d.domains?.[0]?.suc).toBeGreaterThan(0);
    expect(d.domains?.[0]?.suc).toBeLessThan(30);
    expect(r.value.diff.engineQuyet.join(' ')).toContain('do thế giới quyết');
  });

  it('[BB] 78.7 — thần mới chưa ai thờ; không có "sức mạnh khởi đầu"', () => {
    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({ mode: 'than', name: 'X' });
    const r = eventHienDien(draft, v, state);
    if (!r.ok) return;
    apDungEvent(state, r.value.events[0]!, log);
    const ven = state.entities.get(r.value.chuTheId!)?.aspects['venerable'] as {
      soTinDoUocLuong?: number;
    };
    expect(ven.soTinDoUocLuong).toBe(0);
    expect(r.value.diff.khongCapThang.join(' ')).toContain('sức mạnh khởi đầu');
  });

  it('[BB] 78.7 — primordial bị từ chối nếu world đã có lịch sử', () => {
    // Đẩy tick lên để world "đã có lịch sử".
    const t = motTick(state, { tuning: TUNING_MAC_DINH });
    apDungEvent(state, t.events[0]!, log);
    expect(state.world.tick).toBeGreaterThan(0);

    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({
      mode: 'than',
      name: 'Khởi Nguyên Muộn',
      deity: { primordial: true },
    });
    const chan = kiemNhapHienDien(draft, v, state);
    expect(chan.some((c) => c.code === 'KHOI_NGUYEN_SAU_LICH_SU')).toBe(true);
  });

  it('[BB] 78.8 — kỹ năng vượt ngân sách thành mục tiêu, không được cấp sẵn', () => {
    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({
      mode: 'pham_nhan',
      name: 'Người Mới',
      mortal: { skillIds: ['a', 'b', 'c', 'd', 'e', 'f'] },
    });
    const r = eventHienDien(draft, v, state);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    apDungEvent(state, r.value.events[0]!, log);
    const m = state.entities.get(r.value.chuTheId!)?.aspects['mortal'] as {
      kyNang?: Record<string, number>;
    };
    expect(Object.keys(m.kyNang ?? {})).toHaveLength(3);
    for (const v2 of Object.values(m.kyNang ?? {})) expect(v2).toBeLessThan(40);
    expect(r.value.diff.khongCapThang.join(' ')).toContain('vượt ngân sách');
  });

  it('[BB] 78.8 — vật chưa tồn tại không vào tay ngay', () => {
    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({
      mode: 'pham_nhan',
      name: 'Kẻ Kể Chuyện',
      mortal: { itemIds: ['thanh_kiem_gia_truyen'] },
    });
    const chan = kiemNhapHienDien(draft, v, state);
    expect(chan.some((c) => c.code === 'VAT_CHUA_TON_TAI')).toBe(true);
    const r = eventHienDien(draft, v, state);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.diff.khongCapThang.join(' ')).toContain('phải đi tìm');
  });

  it('canon diff liệt kê đúng thứ sẽ tạo và thứ sẽ nối', () => {
    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({ mode: 'pham_nhan', name: 'A' });
    const r = eventHienDien(draft, v, state);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.diff.seTao).toHaveLength(1);
    expect(r.value.diff.seTao[0]?.kind).toBe('mortal');
    expect(r.value.diff.seNoi.length).toBeGreaterThan(0);
  });

  it('nhập một entity CÓ SẴN giữ nguyên id và lịch sử', () => {
    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({
      mode: 'pham_nhan',
      useExistingEntityId: 'mortal_1',
    });
    const r = eventHienDien(draft, v, state);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.chuTheId).toBe('mortal_1');
    expect(r.value.diff.seTao).toEqual([]);
    apDungEvent(state, r.value.events[0]!, log);
    expect(state.world.playerState.chuTheId).toBe('mortal_1');
  });

  it('nhập sai loại entity bị chặn có lý do', () => {
    const v = chieu(state, 'sang_the', null);
    const draft = StartingPresenceDraftSchema.parse({
      mode: 'than',
      useExistingEntityId: 'mortal_1',
    });
    const chan = kiemNhapHienDien(draft, v, state);
    expect(chan.some((c) => c.code === 'SAI_LOAI_ENTITY')).toBe(true);
  });
});

describe('[BB] 21.3 — chuyển tầng không tạo save mới, không đổi branchId', () => {
  it('kịch bản Sáng Thế → Thần → Phàm → Sáng Thế', () => {
    const branchTruoc = state.world.branchId;
    const worldIdTruoc = state.world.id;

    // Sáng Thế
    expect(state.world.playerState.mode).toBe('sang_the');

    // → Thần
    const e1 = eventChuyenTang(state, 'than', 'deity_1', 'nhập vào một vị thần của mình', log);
    expect(apDungEvent(state, e1, log).ok).toBe(true);
    expect(state.world.playerState.mode).toBe('than');
    expect(state.world.playerState.chuTheId).toBe('deity_1');

    // → Phàm
    const e2 = eventChuyenTang(state, 'pham_nhan', 'mortal_1', 'hạ phàm', log);
    expect(apDungEvent(state, e2, log).ok).toBe(true);
    expect(state.world.playerState.mode).toBe('pham_nhan');

    // → Sáng Thế
    const e3 = eventChuyenTang(state, 'sang_the', null, 'thức tỉnh trở lại', log);
    expect(apDungEvent(state, e3, log).ok).toBe(true);
    expect(state.world.playerState.mode).toBe('sang_the');
    expect(state.world.playerState.chuTheId).toBeNull();

    // [BB] Không đổi branch, không đổi world.
    expect(state.world.branchId).toBe(branchTruoc);
    expect(state.world.id).toBe(worldIdTruoc);
    expect(state.world.playerState.lichSuChuyenTang).toHaveLength(3);
  });

  it('quay lại một mode đã ghé qua trong cùng tick không bị kẹt (id event không trùng)', () => {
    // Cùng một tick, qua lại nhiều lần: sang_the → than → sang_the → than.
    // Mỗi lượt tạo event mới (không tiến tick) nên id chỉ theo (tick, mode) sẽ
    // trùng lần ghé thứ hai — đây chính là lỗi "chuyển tab ko được" người chơi gặp.
    expect(apDungEvent(state, eventChuyenTang(state, 'than', 'deity_1', 'a', log), log).ok).toBe(true);
    expect(apDungEvent(state, eventChuyenTang(state, 'sang_the', null, 'b', log), log).ok).toBe(true);
    const veLaiThan = apDungEvent(state, eventChuyenTang(state, 'than', 'deity_1', 'c', log), log);
    expect(veLaiThan.ok).toBe(true);
    expect(state.world.playerState.mode).toBe('than');
    const veLaiSangThe = apDungEvent(state, eventChuyenTang(state, 'sang_the', null, 'd', log), log);
    expect(veLaiSangThe.ok).toBe(true);
    expect(state.world.playerState.mode).toBe('sang_the');
  });

  it('lịch sử chuyển tầng ghi đúng tu/den', () => {
    apDungEvent(state, eventChuyenTang(state, 'than', 'deity_1', 'thử', log), log);
    const ls = state.world.playerState.lichSuChuyenTang;
    expect(ls[0]?.tu).toBe('sang_the');
    expect(ls[0]?.den).toBe('than');
    expect(ls[0]?.lyDo).toBe('thử');
  });
});

// ─────────────────────────────────────────── tick

describe('tick engine — Phần 24', () => {
  it('khai đủ mười bốn bước, đúng thứ tự', () => {
    expect(MUOI_BON_BUOC).toHaveLength(14);
    expect(MUOI_BON_BUOC.map((b) => b.so)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('[BB] chỉ bước 8, 12, 13 cần LLM', () => {
    expect(MUOI_BON_BUOC.filter((b) => b.canLlm).map((b) => b.so)).toEqual([8, 12, 13]);
  });

  it('không bật LLM thì ba bước đó bị bỏ, phần còn lại vẫn chạy', () => {
    const r = motTick(state, { tuning: TUNING_MAC_DINH });
    expect(r.buocBoQua).toEqual(['ket_tinh_luat', 't2_batch', 'giai_lo_hong']);
    expect(r.events).toHaveLength(1);
  });

  it('tick tiến tick của world và áp được', () => {
    const truoc = state.world.tick;
    const r = motTick(state, { tuning: TUNING_MAC_DINH });
    expect(apDungEvent(state, r.events[0]!, log).ok).toBe(true);
    expect(state.world.tick).toBe(truoc + 1);
  });

  it('[BB] 10.1 — doLech TĂNG theo thế hệ; diễn giải đúng 100% là bug', () => {
    const doLechCua = (): number[] => {
      const l = state.entities.get('law_thuong')?.aspects['lawful'] as {
        dienGiai?: { doLech?: number }[];
      };
      return (l.dienGiai ?? []).map((d) => d.doLech ?? 0);
    };
    const truoc = doLechCua();
    for (let i = 0; i < 30; i++) {
      const r = motTick(state, { tuning: TUNING_MAC_DINH });
      apDungEvent(state, r.events[0]!, log);
    }
    const sau = doLechCua();
    expect(sau[0]).toBeGreaterThan(truoc[0] as number);
    expect(sau[1]).toBeGreaterThan(truoc[1] as number);
  });

  it('trọng số khái niệm tích theo áp lực từ diễn giải lệch', () => {
    const trongSo = (): number => {
      const c = state.entities.get('concept_o_ue')?.aspects['conceptual'] as { trongSo?: number };
      return c.trongSo ?? 0;
    };
    const truoc = trongSo();
    for (let i = 0; i < 5; i++) {
      const r = motTick(state, { tuning: TUNING_MAC_DINH });
      apDungEvent(state, r.events[0]!, log);
    }
    expect(trongSo()).toBeGreaterThan(truoc);
  });

  it('[BB] 24.1 — 200 tick không LLM cho kết quả GIỐNG HỆT với cùng seed', () => {
    const chay = (): string => {
      const t = theGioiDaGieo();
      for (let i = 0; i < 200; i++) {
        const r = motTick(t.state, { tuning: TUNING_MAC_DINH });
        const ok = apDungEvent(t.state, r.events[0]!, t.log);
        expect(ok.ok).toBe(true);
      }
      return hashState(t.state);
    };
    expect(chay()).toBe(chay());
  }, 30_000);

  it('toàn bộ lát dọc replay được từ event log', () => {
    for (let i = 0; i < 20; i++) {
      const r = motTick(state, { tuning: TUNING_MAC_DINH });
      apDungEvent(state, r.events[0]!, log);
    }
    const hashTruoc = hashState(state);
    const lai = replay(taoState(moThuGioi(CT).world).world, [...log.tatCa()]);
    expect(lai.ok).toBe(true);
    if (lai.ok) expect(lai.value.hashCuoi).toBe(hashTruoc);
  });
});
