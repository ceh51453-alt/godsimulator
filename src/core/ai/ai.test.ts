/**
 * Cổng AI — ADR-0028 [BB].
 *
 * Dòng cổng: **không có AI thì không chơi.** Bốn thứ phải đúng để câu đó có
 * nghĩa chứ không chỉ là một câu trong tài liệu:
 *
 *   1. cổng đóng khi cấu hình thiếu, và nói rõ thiếu cái gì;
 *   2. cổng đóng khi đường đứt, và giữ nguyên thế giới;
 *   3. prompt không rò rỉ thứ tầng đang chơi không được biết (18.3, 33.3);
 *   4. patch AI đề nghị mà sai thẩm quyền thì bị từ chối, không vào world (71.5).
 *
 * Test ở đây KHÔNG chạm mạng: `client.ts` nhận `fetchImpl` qua tham số, nên
 * "mock pass trước network" của cổng Phase 8 kiểm được ở đây.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog } from '../engine/state.js';
import type { WorldState, EventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent, taoEvent } from '../engine/transaction.js';
import { datLaiInvariant } from '../engine/invariant.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { napBatBienTangThan } from '../world/batBienThan.js';
import { chieu } from '../project/chieu.js';
import type { Event } from '../contracts/core.js';

import { AiConfigSchema, congCoMo, thieuGiDeChoi, cheMatKhau, saoCauHinh } from './cauHinh.js';
import type { AiConfig } from './cauHinh.js';
import {
  MACH_MOI,
  NGUONG_MO_MACH,
  danhGiaCong,
  dongMach,
  machSauKhiHong,
  machSauKhiThanhCong,
  tyLeHong,
} from './cong.js';
import { BAY_QUY_TAC_NARRATOR, bienSoanPromptKe, thuDuongDatKhong } from './bienSoan.js';
import { bocTach, tyLeTruot } from './bocTach.js';
import { dacTaGoi, ghepDuong, rutDanhSachModel, rutVanBan } from '../../ai/phuongNgu.js';
import { goiKe, quetModel, thuDuong } from '../../ai/client.js';

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
  napBatBienTangThan();
});

function theGioi(seed = 'cong-ai'): { state: WorldState; log: EventLog } {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed, worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  expect(apDungChuoi(state, events, log).ok).toBe(true);
  const ev = eventGieoNen(state);
  expect(apDungEvent(state, ev as Event, log).ok).toBe(true);
  return { state, log };
}

/** Cấu hình đủ để chơi — dùng làm mốc, rồi bớt từng thứ để xem cổng phản ứng. */
function cauHinhDu(): AiConfig {
  return AiConfigSchema.parse({
    narrator: {
      proxyUrl: 'https://proxy.example/v1',
      proxyPassword: 'mat-khau-that',
      dialect: 'openai',
      modelId: 'model-x',
      probe: { daDo: true, thong: true, modelDaTraLoi: 'model-x', soKyTuTraVe: 5, xuatCoCauTruc: true },
    },
  });
}

// ─────────────────────────────────────────── 1. cổng

describe('[BB] ADR-0028 — không có AI thì không chơi', () => {
  it('cấu hình rỗng: cổng đóng và nói rõ thiếu gì', () => {
    const cong = danhGiaCong({ cfg: AiConfigSchema.parse({}), dangDo: false, mach: MACH_MOI });
    expect(cong.choPhepChoi).toBe(false);
    expect(cong.trangThai).toBe('chua_cau_hinh');
    // Không được là "cấu hình sai" chung chung — phải chỉ ra từng ô.
    expect(cong.viecCanLam.map((t) => t.truong).sort()).toEqual(['modelId', 'probe', 'proxyUrl']);
    for (const t of cong.viecCanLam) expect(t.thongDiep.length).toBeGreaterThan(10);
  });

  it('cấu hình đủ và đã thử đường: cổng mở', () => {
    expect(congCoMo(cauHinhDu())).toBe(true);
    expect(danhGiaCong({ cfg: cauHinhDu(), dangDo: false, mach: MACH_MOI }).choPhepChoi).toBe(true);
  });

  it.each([
    ['proxyUrl', { proxyUrl: '' }],
    ['proxyUrl không phải http', { proxyUrl: 'proxy.example' }],
    ['modelId', { modelId: '' }],
    ['chưa thử đường', { probe: { daDo: false } }],
    ['thử đường không thông', { probe: { daDo: true, thong: false, thongDiep: 'hết hạn mức' } }],
  ])('thiếu %s thì cổng đóng', (_nhan, thayDoi) => {
    const cfg = AiConfigSchema.parse({ ...cauHinhDu(), narrator: { ...cauHinhDu().narrator, ...thayDoi } });
    expect(congCoMo(cfg)).toBe(false);
    expect(thieuGiDeChoi(cfg).length).toBeGreaterThan(0);
  });

  it('chỉ Tường Thuật quyết định cổng — hai điểm cuối kia tắt được', () => {
    const cfg = AiConfigSchema.parse({
      ...cauHinhDu(),
      updater: { batRieng: false },
      workflow: { batRieng: false },
    });
    expect(congCoMo(cfg)).toBe(true);
  });

  it('đang thử đường thì chưa cho chơi, nhưng KHÔNG báo là hỏng', () => {
    const cong = danhGiaCong({ cfg: cauHinhDu(), dangDo: true, mach: MACH_MOI });
    expect(cong.choPhepChoi).toBe(false);
    expect(cong.trangThai).toBe('dang_do');
  });
});

describe('ngắt mạch — đếm lần, không đếm giây', () => {
  it(`mở mạch sau ${NGUONG_MO_MACH} lần hỏng liên tiếp`, () => {
    let m = MACH_MOI;
    for (let i = 1; i < NGUONG_MO_MACH; i++) {
      m = machSauKhiHong(m, 'QUA_HAN', 'model không trả lời kịp');
      expect(m.moMach).toBe(false);
    }
    m = machSauKhiHong(m, 'QUA_HAN', 'model không trả lời kịp');
    expect(m.moMach).toBe(true);

    const cong = danhGiaCong({ cfg: cauHinhDu(), dangDo: false, mach: m });
    expect(cong.choPhepChoi).toBe(false);
    expect(cong.trangThai).toBe('dut_duong');
    // [BB] Phải nói rõ là thế giới còn nguyên, nếu không người chơi tưởng mất save.
    expect(cong.lyDo.join(' ')).toContain('vẫn còn nguyên');
  });

  it('một lần thành công xóa sạch chuỗi hỏng', () => {
    let m = MACH_MOI;
    m = machSauKhiHong(m, 'A', 'x');
    m = machSauKhiHong(m, 'A', 'x');
    m = machSauKhiThanhCong(m);
    expect(m.hongLienTiep).toBe(0);
    expect(m.moMach).toBe(false);
    // Nhưng thống kê tích lũy KHÔNG bị xóa — bảng Tự Chẩn Đoán cần nó.
    expect(m.tongGoi).toBe(3);
    expect(m.tongHong).toBe(2);
    expect(tyLeHong(m)).toBeCloseTo(2 / 3, 5);
  });

  it('mạch không tự đóng theo thời gian — chỉ người chơi đóng được', () => {
    let m = MACH_MOI;
    for (let i = 0; i < 10; i++) m = machSauKhiHong(m, 'A', 'x');
    expect(m.moMach).toBe(true);
    expect(dongMach(m).moMach).toBe(false);
  });
});

describe('mật khẩu proxy không đi đâu cả', () => {
  it('`cheMatKhau` che mọi điểm cuối', () => {
    const che = cheMatKhau(cauHinhDu());
    expect(JSON.stringify(che)).not.toContain('mat-khau-that');
    expect(che.narrator.proxyPassword).toBe('••••••');
  });

  it('sao cấu hình KHÔNG sao kết quả thử đường', () => {
    const den = saoCauHinh(cauHinhDu().narrator, AiConfigSchema.parse({}).updater);
    expect(den.modelId).toBe('model-x');
    // Đường của người khác không chứng minh đường của mình.
    expect(den.probe.daDo).toBe(false);
    expect(den.probe.thong).toBe(false);
  });
});

// ─────────────────────────────────────────── 2. prompt không rò rỉ

describe('[BB] 33.3 — assembler nhận WorldView, không nhận World', () => {
  const nguLieu = (view: ReturnType<typeof chieu>) => ({
    view,
    banTin: null,
    loiCau: [],
    canhGanDay: [],
    cauNguoiChoi: '',
    ketQuaEngine: [],
    tenNguoiChoi: 'Người Chơi',
    tyLeToken: 3.2,
  });

  it('bảy quy tắc Narrator có mặt đủ trong tầng lõi', () => {
    const { state } = theGioi();
    const p = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null)));
    expect(BAY_QUY_TAC_NARRATOR).toHaveLength(7);
    for (const q of BAY_QUY_TAC_NARRATOR) expect(p.heThong).toContain(q);
  });

  it('Narrator tua rộng ở tầng Sáng Thế nhưng giữ thời gian chậm khi nhập vai trong thế giới', () => {
    const { state } = theGioi();
    const sangThe = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null)));
    expect(sangThe.nguoiDung).toMatch(/hậu Sáng Thế|Thế giới đang định hình|Thế giới đã trưởng thành/);

    const nguoi = [...state.entities.values()].find((e) => e.kind === 'mortal');
    const trongTruyen = bienSoanPromptKe(nguLieu(chieu(state, 'pham_nhan', nguoi?.id ?? null)));
    expect(trongTruyen.nguoiDung).toContain('giữ thời gian gần nhân vật');
    expect(trongTruyen.nguoiDung).toContain('Không nén mất cả thế hệ');
  });

  it('tầng phàm nhân: văn bản luật gốc KHÔNG lọt vào prompt', () => {
    const { state } = theGioi();
    // Lấy văn bản luật thật từ World thô để so — đây là thứ không được xuất hiện.
    const vanBanThat: string[] = [];
    for (const e of state.entities.values()) {
      const l = e.aspects['lawful'] as { vanBan?: string } | undefined;
      if (l?.vanBan && l.vanBan.length > 12) vanBanThat.push(l.vanBan);
    }
    expect(vanBanThat.length).toBeGreaterThan(0);

    const nguoi = [...state.entities.values()].find((e) => e.kind === 'mortal');
    expect(nguoi).toBeDefined();
    const p = bienSoanPromptKe(nguLieu(chieu(state, 'pham_nhan', nguoi?.id ?? null)));
    const ca = `${p.heThong}\n${p.nguoiDung}`;
    for (const vb of vanBanThat) expect(ca).not.toContain(vb);
  });

  it('tầng phàm nhân: không con số engine nào lọt ra (56.2)', () => {
    const { state } = theGioi();
    const nguoi = [...state.entities.values()].find((e) => e.kind === 'mortal');
    const view = chieu(state, 'pham_nhan', nguoi?.id ?? null);
    expect([...view.entities.values()].every((e) => e.tickSinh === null)).toBe(true);
    const p = bienSoanPromptKe(nguLieu(view));
    const ca = `${p.heThong}\n${p.nguoiDung}`;
    for (const khoa of ['thieuHut', 'tyLeMac', 'cohort', 'suyThoai', 'deDoa']) {
      expect(ca, `rò rỉ khóa engine "${khoa}"`).not.toContain(khoa);
    }
  });

  /**
   * Sổ Hậu Trường phải TỚI ĐƯỢC model, và tới kèm hướng dẫn dệt.
   *
   * Danh sách suông là thứ biến một cảnh thành bản tin: model nhận ba dòng
   * "NPC X làm Y" sẽ viết ra đúng ba câu tường thuật ba dòng ấy. Ba câu hướng
   * dẫn ở cuối khối mới là phần làm nên khác biệt, nên bài này canh cả hai.
   */
  it('chuyện hậu trường chưa kể vào tầng 5, kèm lệnh dệt chứ không liệt kê', () => {
    const { state } = theGioi();
    const p = bienSoanPromptKe({
      ...nguLieu(chieu(state, 'sang_the', null)),
      hauTruongChuaKe: [
        {
          loai: 'hanh_dong',
          nhan: 'ai đó vừa làm gì',
          noiDung: 'Lư Mệnh rời làng trước khi trời sáng.',
          tick: 12,
        },
        { loai: 'quy_luat', nhan: 'quy luật vừa hiện ra', noiDung: 'Máu đổ trên đá thì đá nhớ.', tick: 12 },
      ],
    });
    const tang5 = p.tang.find((t) => t.so === 5)?.noiDung ?? '';
    expect(tang5).toContain('Lư Mệnh rời làng trước khi trời sáng.');
    expect(tang5).toContain('Máu đổ trên đá thì đá nhớ.');
    expect(tang5).toContain('Dệt MỘT hoặc HAI điều');
    expect(tang5).toContain('Không liệt kê');
    // Tầng 5 là tầng BIẾN ĐỘNG — nó không được ăn prefix cache cùng tầng 1–3.
    expect(p.tang.find((t) => t.so === 5)?.onDinh).toBe(false);
    expect(p.nguoiDung).toContain('Lư Mệnh rời làng trước khi trời sáng.');
  });

  it('sổ rỗng thì không có khối hậu trường nào — im lặng, không phải một khối trống', () => {
    const { state } = theGioi();
    const p = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null)));
    expect(`${p.heThong}\n${p.nguoiDung}`).not.toContain('THẾ GIỚI ĐÃ TỰ CHẠY');
  });

  it('sáu tầng đúng thứ tự, ổn định lên đầu', () => {
    const { state } = theGioi();
    const p = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null)));
    expect(p.tang.map((t) => t.so)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(p.tang.filter((t) => t.onDinh).map((t) => t.so)).toEqual([1, 2, 3]);
  });

  it('lời cầu đang treo nằm ở tầng CUỐI, không nằm giữa', () => {
    const { state } = theGioi();
    const view = chieu(state, 'than', null);
    const cau = {
      id: 'p1',
      branchId: 'br_goc',
      nguoiCauId: 'x',
      thanNhanId: null,
      loai: 'xin_cuu' as const,
      noiDung: 'MOT_LOI_CAU_RAT_DE_TIM',
      cuongDo: 50,
      goc: { ducVongThieu: 'an', canTroId: null, diemMongMuon: 1, khaThi: 0 },
      tickCau: 0,
      hanChot: null,
      daTraLoi: false,
      cachTraLoi: 'chua' as const,
      tickTraLoi: null,
      eventTraLoiId: null,
      soNguoi: 3,
    };
    const p = bienSoanPromptKe({ ...nguLieu(view), loiCau: [cau] });
    // Đúng tầng 6 và KHÔNG tầng nào khác — đây mới là điều 33.1 đòi, và nó không
    // phụ thuộc vào việc thế giới hiện có bao nhiêu entity.
    for (const t of p.tang) {
      const co = t.noiDung.includes('MOT_LOI_CAU_RAT_DE_TIM');
      expect(co, `lời cầu lọt vào tầng ${t.so}`).toBe(t.so === 6);
    }
    expect(p.heThong).not.toContain('MOT_LOI_CAU_RAT_DE_TIM');
    expect(p.nguoiDung).toContain('MOT_LOI_CAU_RAT_DE_TIM');
  });

  it('ước lượng token theo tỉ lệ của profile, không hardcode', () => {
    const { state } = theGioi();
    const a = bienSoanPromptKe({ ...nguLieu(chieu(state, 'sang_the', null)), tyLeToken: 3.2 });
    const b = bienSoanPromptKe({ ...nguLieu(chieu(state, 'sang_the', null)), tyLeToken: 1.6 });
    expect(b.uocToken).toBeGreaterThan(a.uocToken);
  });
});

// ─────────────────────────────────────────── 3. bóc tách phản hồi

describe('[BB] 71.5 — LLM không giữ sổ', () => {
  const nc = { eventId: 'ev_ke_1', idHopLe: new Set(['deity_1', 'place_1']) };

  it('không có khối <CapNhat> thì chỉ có văn xuôi', () => {
    const r = bocTach('Trời tối dần trên mái đền.', nc);
    expect(r.loiKe).toBe('Trời tối dần trên mái đền.');
    expect(r.patches).toEqual([]);
    expect(r.coKhoiCapNhat).toBe(false);
  });

  it('khối <CapNhat> bị cắt khỏi lời kể', () => {
    const r = bocTach(
      'Mưa xuống.\n<CapNhat>{"patches":[{"op":"add","target":{"table":"entities","id":"place_1","path":"aspects.spatial.danSo"},"value":2}]}</CapNhat>',
      nc,
    );
    expect(r.loiKe).toBe('Mưa xuống.');
    expect(r.patches).toHaveLength(1);
    expect(r.patches[0]?.sourceEventId).toBe('ev_ke_1');
  });

  it('JSON hỏng bị từ chối, lời kể vẫn giữ', () => {
    const r = bocTach('Có gì đó đổ vỡ.\n<CapNhat>{patches: nope}</CapNhat>', nc);
    expect(r.loiKe).toBe('Có gì đó đổ vỡ.');
    expect(r.patches).toEqual([]);
    expect(r.biTuChoi[0]?.ma).toBe('JSON_HONG');
  });

  it.each([
    [
      'bảng worlds — đá người chơi sang tầng khác',
      { op: 'set', target: { table: 'worlds', id: 'worlds', path: 'playerState.mode' }, value: 'sang_the' },
      'BANG_CAM',
    ],
    [
      'coreSelf — sửa tính cách không có Event giải thích',
      {
        op: 'set',
        target: { table: 'entities', id: 'deity_1', path: 'aspects.ban_nga.coreSelf.tuBi_tanNhan' },
        value: 90,
      },
      'DUONG_DAN_CAM',
    ],
    [
      'sức domain — 78.7 nói engine quyết',
      { op: 'set', target: { table: 'entities', id: 'deity_1', path: 'aspects.domain.domains' }, value: [] },
      'DUONG_DAN_CAM',
    ],
    [
      'văn bản luật gốc',
      {
        op: 'set',
        target: { table: 'entities', id: 'deity_1', path: 'aspects.lawful.vanBan' },
        value: 'luật mới',
      },
      'DUONG_DAN_CAM',
    ],
    [
      'entity không tồn tại',
      { op: 'set', target: { table: 'entities', id: 'khong_co_that', path: 'ten' }, value: 'X' },
      'ENTITY_LA',
    ],
  ])('từ chối patch chạm %s', (_nhan, patch, ma) => {
    const r = bocTach(`Văn.\n<CapNhat>${JSON.stringify({ patches: [patch] })}</CapNhat>`, nc);
    expect(r.patches).toEqual([]);
    expect(r.biTuChoi[0]?.ma).toBe(ma);
    expect(tyLeTruot(r)).toBe(1);
  });

  it('model không tự khai được nguồn Event của patch', () => {
    const r = bocTach(
      `x\n<CapNhat>${JSON.stringify({
        patches: [
          {
            op: 'set',
            target: { table: 'entities', id: 'deity_1', path: 'moTa' },
            value: 'y',
            sourceEventId: 'ev_cua_nguoi_khac',
          },
        ],
      })}</CapNhat>`,
      nc,
    );
    expect(r.patches[0]?.sourceEventId).toBe('ev_ke_1');
  });

  it('có trần patch mỗi lượt — model không viết lại cả thế giới', () => {
    const nhieu = Array.from({ length: 40 }, () => ({
      op: 'set',
      target: { table: 'entities', id: 'deity_1', path: 'moTa' },
      value: 'x',
    }));
    const r = bocTach(`x\n<CapNhat>${JSON.stringify({ patches: nhieu })}</CapNhat>`, nc);
    expect(r.patches.length).toBeLessThanOrEqual(12);
    expect(r.biTuChoi.some((b) => b.ma === 'QUA_NHIEU')).toBe(true);
  });

  it('patch hợp lệ áp được vào thế giới thật qua Event `ai_validated`', () => {
    const { state, log } = theGioi();
    const noi = [...state.entities.values()].find((e) => e.kind === 'place');
    expect(noi).toBeDefined();
    const truoc = noi?.moTa ?? '';

    const r = bocTach(
      `Kể.\n<CapNhat>${JSON.stringify({
        patches: [{ op: 'set', target: { table: 'entities', id: noi?.id, path: 'moTa' }, value: 'Đã đổi.' }],
      })}</CapNhat>`,
      { eventId: 'ev_ai_1', idHopLe: new Set(state.entities.keys()) },
    );
    expect(r.patches).toHaveLength(1);

    const ev = taoEvent({
      id: 'ev_ai_1',
      branchId: state.world.branchId,
      tick: state.world.tick,
      loai: 'narrator_cap_nhat',
      actorIds: [],
      targetIds: [],
      causeEventIds: [],
      locationId: null,
      patches: [...r.patches],
      visibility: 'cong_khai',
      source: 'ai_validated',
      payload: {},
    });
    expect(apDungEvent(state, ev, log).ok).toBe(true);
    expect(state.entities.get(noi?.id ?? '')?.moTa).toBe('Đã đổi.');
    expect(truoc).not.toBe('Đã đổi.');
  });
});

// ─────────────────────────────────────────── 4. phương ngữ và client

describe('bốn phương ngữ', () => {
  it('ghép đường không nhân đôi đoạn đã có', () => {
    expect(ghepDuong('https://x.y', 'chat/completions')).toBe('https://x.y/chat/completions');
    expect(ghepDuong('https://x.y/v1', 'chat/completions')).toBe('https://x.y/v1/chat/completions');
    expect(ghepDuong('https://x.y/v1/chat/completions', 'chat/completions')).toBe(
      'https://x.y/v1/chat/completions',
    );
    expect(ghepDuong('https://x.y/', 'chat/completions')).toBe('https://x.y/chat/completions');
  });

  it('mỗi phương ngữ dựng đúng đường và đúng header xác thực', () => {
    const yc = {
      heThong: 'S',
      nguoiDung: 'U',
      modelId: 'm1',
      params: AiConfigSchema.parse({}).narrator.params,
    };
    const o = dacTaGoi('openai', 'https://x.y/v1', 'k', yc);
    expect(o.url).toContain('/chat/completions');
    expect(o.header['authorization']).toBe('Bearer k');

    const a = dacTaGoi('anthropic', 'https://x.y', 'k', yc);
    expect(a.url).toContain('/v1/messages');
    expect(a.header['x-api-key']).toBe('k');
    expect((a.body as { system: string }).system).toBe('S');

    const g = dacTaGoi('gemini', 'https://x.y', 'k', yc);
    expect(g.url).toContain(':generateContent');
    expect(g.url).toContain('key=k');
  });

  it('[BB] 62.4 — chỉ gửi tham số phương ngữ hỗ trợ', () => {
    const yc = {
      heThong: 'S',
      nguoiDung: 'U',
      modelId: 'm1',
      params: AiConfigSchema.parse({}).narrator.params,
    };
    const a = dacTaGoi('anthropic', 'https://x.y', 'k', yc).body as Record<string, unknown>;
    // Anthropic không có `frequency_penalty`; gửi đi là ăn 400.
    expect(a['frequency_penalty']).toBeUndefined();
    expect(a['presence_penalty']).toBeUndefined();
    expect(a['max_tokens']).toBeDefined();
  });

  /*
   * Bốn bộ lấy mẫu mà preset SillyTavern khai và `tu_do` là đường duy nhất chở
   * được chúng. Trước đây chúng bị `THAM_SO_HO_TRO` cắt im lặng, nên `top_k: 500`
   * của một preset không bao giờ tới proxy dù hồ sơ model đã cho phép.
   */
  it('tu_do chở top_k · min_p · top_a · repetition_penalty khi có giá trị thật', () => {
    const nen = AiConfigSchema.parse({}).narrator.params;
    const params = { ...nen, topK: 64, minP: 0.05, topA: 0.1, repetitionPenalty: 1.15 };
    const b = dacTaGoi('tu_do', 'https://x.y/v1', 'k', {
      heThong: 'S',
      nguoiDung: 'U',
      modelId: 'm1',
      params,
    }).body as Record<string, unknown>;

    expect(b['top_k']).toBe(64);
    expect(b['min_p']).toBe(0.05);
    expect(b['top_a']).toBe(0.1);
    expect(b['repetition_penalty']).toBe(1.15);
  });

  it('giá trị trung tính KHÔNG được đính vào thân — khóa lạ với proxy là 400', () => {
    const params = AiConfigSchema.parse({}).narrator.params;
    const b = dacTaGoi('tu_do', 'https://x.y/v1', 'k', {
      heThong: 'S',
      nguoiDung: 'U',
      modelId: 'm1',
      params: { ...params, topK: 0, minP: 0, topA: 0, repetitionPenalty: 1 },
    }).body as Record<string, unknown>;

    for (const k of ['top_k', 'min_p', 'top_a', 'repetition_penalty']) {
      expect(b[k], k).toBeUndefined();
    }
  });

  it('OpenAI chính thức vẫn không nhận bốn trường ấy', () => {
    const params = AiConfigSchema.parse({}).narrator.params;
    const b = dacTaGoi('openai', 'https://x.y/v1', 'k', {
      heThong: 'S',
      nguoiDung: 'U',
      modelId: 'm1',
      params: { ...params, topK: 64, minP: 0.05, topA: 0.1, repetitionPenalty: 1.15 },
    }).body as Record<string, unknown>;

    for (const k of ['top_k', 'min_p', 'top_a', 'repetition_penalty']) {
      expect(b[k], k).toBeUndefined();
    }
  });

  it('streaming đổi đúng thân OpenAI và đường Gemini', () => {
    const params = { ...AiConfigSchema.parse({}).narrator.params, streaming: true };
    const o = dacTaGoi('openai', 'https://x.y/v1', 'k', {
      heThong: 'S',
      nguoiDung: 'U',
      modelId: 'm1',
      params,
    });
    expect((o.body as Record<string, unknown>)['stream']).toBe(true);

    const g = dacTaGoi('gemini', 'https://x.y', 'k', {
      heThong: 'S',
      nguoiDung: 'U',
      modelId: 'm1',
      params,
    });
    expect(g.url).toContain(':streamGenerateContent');
    expect(g.url).toContain('alt=sse');
  });

  it('rút văn bản từ ba hình dạng phản hồi khác nhau', () => {
    expect(rutVanBan('openai', { choices: [{ message: { content: ' A ' } }] })).toBe('A');
    expect(rutVanBan('anthropic', { content: [{ text: 'B' }] })).toBe('B');
    expect(rutVanBan('gemini', { candidates: [{ content: { parts: [{ text: 'C' }] } }] })).toBe('C');
    expect(rutVanBan('openai', { loi: 'gì đó' })).toBe('');
  });

  it('danh sách model của Gemini bỏ tiền tố `models/`', () => {
    const ds = rutDanhSachModel('gemini', { models: [{ name: 'models/gemini-3.1-pro' }] });
    expect(ds[0]?.id).toBe('gemini-3.1-pro');
  });
});

describe('client — mock pass trước network', () => {
  const ep = cauHinhDu().narrator;
  const traVe = (body: unknown, status = 200): typeof fetch =>
    (async () =>
      ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(body),
      }) as Response) as unknown as typeof fetch;

  it('gọi kể thành công trả về văn bản', async () => {
    const r = await goiKe(
      ep,
      { heThong: 'S', nguoiDung: 'U', tang: [], soKyTu: 2, uocToken: 1, vetCat: [], chunkBiCat: [] },
      { fetchImpl: traVe({ choices: [{ message: { content: 'Một cảnh.' } }] }) },
    );
    expect(r.ok).toBe(true);
    expect(r.ok && r.vanBan).toBe('Một cảnh.');
  });

  it('stream OpenAI ghép từng mẩu và báo tiến độ', async () => {
    const sse = [
      'data: {"choices":[{"delta":{"content":"Một "},"finish_reason":null}]}',
      '',
      'data: {"choices":[{"delta":{"content":"cảnh."},"finish_reason":"stop"}],"usage":{"prompt_tokens":7}}',
      '',
      'data: [DONE]',
      '',
    ].join('\n');
    const fetchImpl = (async () =>
      new Response(sse, { status: 200, headers: { 'content-type': 'text/event-stream' } })) as typeof fetch;
    const daNhan: string[] = [];
    const r = await goiKe(
      { ...ep, params: { ...ep.params, streaming: true } },
      { heThong: 'S', nguoiDung: 'U', tang: [], soKyTu: 2, uocToken: 1, vetCat: [], chunkBiCat: [] },
      { fetchImpl, onChunk: (toanBo) => daNhan.push(toanBo) },
    );
    expect(r.ok).toBe(true);
    expect(r.ok && r.vanBan).toBe('Một cảnh.');
    expect(r.ok && r.promptTokens).toBe(7);
    expect(r.ok && r.finishReason).toBe('stop');
    expect(daNhan).toEqual(['Một ', 'Một cảnh.']);
  });

  it('model trả rỗng bị tính là HỎNG, không phải "kể xong"', async () => {
    const r = await goiKe(
      ep,
      { heThong: 'S', nguoiDung: 'U', tang: [], soKyTu: 2, uocToken: 1, vetCat: [], chunkBiCat: [] },
      { fetchImpl: traVe({ choices: [{ message: { content: '' } }] }) },
    );
    expect(r.ok).toBe(false);
    expect(!r.ok && r.ma).toBe('IM_LANG');
  });

  it('proxy trả HTML thì thông điệp nói rõ là sai địa chỉ', async () => {
    const html = (async () =>
      ({
        ok: false,
        status: 404,
        text: async () => '<html>Not Found</html>',
      }) as Response) as unknown as typeof fetch;
    const r = await goiKe(
      ep,
      { heThong: '', nguoiDung: '', tang: [], soKyTu: 0, uocToken: 0, vetCat: [], chunkBiCat: [] },
      { fetchImpl: html },
    );
    expect(r.ok).toBe(false);
    expect(!r.ok && r.thongDiep).toContain('địa chỉ proxy sai');
  });

  it('thử đường: model trả lời nhưng không nghe lệnh thì KHÔNG tính là thông', async () => {
    const r = await thuDuong(ep, {
      fetchImpl: traVe({ choices: [{ message: { content: 'Xin chào! Tôi có thể giúp gì?' } }] }),
    });
    expect(r.thong).toBe(false);
    expect(r.maLoi).toBe('KHONG_NGHE_LENH');
    expect(thuDuongDatKhong('THONG')).toBe(true);
  });

  it('thử đường: trả đúng từ khóa thì thông', async () => {
    const r = await thuDuong(ep, { fetchImpl: traVe({ choices: [{ message: { content: 'THONG' } }] }) });
    expect(r.thong).toBe(true);
    expect(r.xuatCoCauTruc).toBe(true);
  });

  it('quét model rỗng không phải lỗi chết — vẫn gõ tay được', async () => {
    const r = await quetModel(ep, { fetchImpl: traVe({ data: [] }) });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.thongDiep).toContain('gõ tay');
  });
});
