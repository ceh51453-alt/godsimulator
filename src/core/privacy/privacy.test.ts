/**
 * Cổng Phase 0 — ranh giới riêng tư.
 * Phần 78.1, 78.2, 78.11 [BB]; Prompt IDE luật bất biến #17, #18.
 *
 * "trường riêng tư phải có test chứng minh không lọt qua từng biên"
 */
import { describe, it, expect } from 'vitest';
import {
  PlayerProfileSchema,
  CreatorIdentitySchema,
  ProjectedPlayerPersonaSchema,
  StartingPresenceDraftSchema,
  hoSoToiThieu,
  danhTinhTrong,
} from '../schema/player.js';
import { chieuPersona, phanCongBo, diffCongBo } from './project.js';
import { BIEN, MA_TRAN, MA_TRAN_PROFILE, MA_TRAN_CREATOR, quetRoRi, duocPhep, mucMaTran } from './matrix.js';
import type { Bien } from './matrix.js';

const HO_SO_DAY_DU = PlayerProfileSchema.parse({
  id: 'pf_1',
  displayName: 'Mực',
  pronouns: { self: 'ta', subject: 'ngươi', object: 'ngươi', possessive: 'của ngươi' },
  addressPreference: 'Gọi ta là Mực',
  accessibility: { reducedMotion: true, highContrast: true, textScale: 1.4, screenReaderHints: false },
  narrativePreferences: { pov: 'thu_ba', proseDensity: 'day', dialogueAmount: 'nhieu' },
  contentPreferences: {
    sensitiveTopicsHidden: ['BI-MAT-TUYET-DOI-A'],
    fadeToBlackTopics: ['BI-MAT-TUYET-DOI-B'],
    adultContentOptIn: true,
  },
  privateNotes: 'BI-MAT-TUYET-DOI-C: ghi chú riêng của người chơi.',
  createdAt: 0,
  updatedAt: 0,
});

const CHUOI_BI_MAT = ['BI-MAT-TUYET-DOI-A', 'BI-MAT-TUYET-DOI-B', 'BI-MAT-TUYET-DOI-C'];

const DANH_TINH_KIN = CreatorIdentitySchema.parse({
  id: 'ci_1',
  saveId: 'save_1',
  title: 'Kẻ Gieo Tro',
  aliases: ['Người Không Ngủ'],
  selfDescription: 'CHUA-CONG-BO-selfDescription',
  manifestationDescription: 'CHUA-CONG-BO-manifestation',
  sigilDescription: 'CHUA-CONG-BO-sigil',
  voiceDescription: 'CHUA-CONG-BO-voice',
  values: ['CHUA-CONG-BO-value'],
  vows: ['CHUA-CONG-BO-vow'],
  taboos: ['CHUA-CONG-BO-taboo'],
  // Chưa công bố gì cả.
  worldDisclosure: { revealTitle: false, revealForm: false, revealValues: false },
});

describe('ma trận riêng tư phủ hết schema', () => {
  it('mọi trường cấp một của PlayerProfile đều được khai trong ma trận', () => {
    const truong = Object.keys(PlayerProfileSchema.shape);
    const daKhai = new Set(MA_TRAN_PROFILE.map((m) => m.duongDan.replace(/^profile\./, '')));
    for (const t of truong) {
      expect(daKhai.has(t), `PlayerProfile.${t} chưa khai trong ma trận riêng tư`).toBe(true);
    }
    expect(daKhai.size).toBe(truong.length);
  });

  it('mọi trường cấp một của CreatorIdentity đều được khai trong ma trận', () => {
    const truong = Object.keys(CreatorIdentitySchema.shape);
    const daKhai = new Set(MA_TRAN_CREATOR.map((m) => m.duongDan.replace(/^creator\./, '')));
    for (const t of truong) {
      expect(daKhai.has(t), `CreatorIdentity.${t} chưa khai trong ma trận riêng tư`).toBe(true);
    }
    expect(daKhai.size).toBe(truong.length);
  });

  it('[BB] không trường nào được phép đi vào world, lorebook, rag, export hay log', () => {
    const camTuyetDoi: Bien[] = ['world', 'lorebook', 'rag', 'export_mac_dinh', 'log'];
    for (const m of MA_TRAN) {
      for (const b of camTuyetDoi) {
        expect(m.choPhep.includes(b), `${m.duongDan} không được phép qua biên '${b}'`).toBe(false);
      }
    }
  });

  it('privateNotes và contentPreferences bị cấm ở MỌI biên', () => {
    for (const duongDan of ['profile.privateNotes', 'profile.contentPreferences']) {
      expect(mucMaTran(duongDan)?.phanLoai).toBe('rieng_tu');
      for (const b of BIEN) {
        expect(duocPhep(duongDan, b), `${duongDan} lọt qua '${b}'`).toBe(false);
      }
    }
  });

  it('trường chưa khai mặc định là CẤM, không phải cho phép', () => {
    for (const b of BIEN) {
      expect(duocPhep('profile.truongMoiChuaKhai', b)).toBe(false);
    }
  });
});

describe('[BB] ProjectedPlayerPersona là cửa duy nhất ra prompt/preset', () => {
  const persona = chieuPersona({
    profile: HO_SO_DAY_DU,
    creator: DANH_TINH_KIN,
    mode: 'sang_the',
    currentEntityId: null,
  });

  it('persona chỉ có đúng năm trường của Phần 78.11', () => {
    expect(Object.keys(persona).sort()).toEqual([
      'currentEntityId',
      'currentMode',
      'displayName',
      'pronouns',
      'publicDescription',
    ]);
  });

  it('không chuỗi bí mật nào xuất hiện trong persona', () => {
    const s = JSON.stringify(persona);
    for (const bimat of CHUOI_BI_MAT) {
      expect(s).not.toContain(bimat);
    }
  });

  it('không trường CHƯA CÔNG BỐ nào của danh tính lọt vào persona', () => {
    expect(JSON.stringify(persona)).not.toContain('CHUA-CONG-BO');
    expect(persona.publicDescription).toBe('');
  });

  it('quetRoRi không tìm thấy vi phạm ở mọi biên', () => {
    for (const b of BIEN) {
      expect(quetRoRi(persona, b), `persona rò ở biên '${b}'`).toEqual([]);
    }
  });

  it('[BB] display name KHÔNG tự thành danh xưng Sáng Thế', () => {
    expect(persona.displayName).toBe('Mực');
    expect(phanCongBo(DANH_TINH_KIN).title).toBeNull();
  });

  it('chieuPersona dùng danh sách trắng: trường mới thêm vào Profile không tự lọt ra', () => {
    const hoSoCoTruongLa = {
      ...HO_SO_DAY_DU,
      truongTuongLaiRatNhayCam: 'RO-RI-NEU-DUNG-SPREAD',
    } as never;
    const p = chieuPersona({
      profile: hoSoCoTruongLa,
      creator: null,
      mode: 'sang_the',
      currentEntityId: null,
    });
    expect(JSON.stringify(p)).not.toContain('RO-RI-NEU-DUNG-SPREAD');
  });

  it('quetRoRi BẮT được rò rỉ khi ai đó lỡ nhét cả hồ sơ vào payload', () => {
    const xau = { persona, debug: HO_SO_DAY_DU };
    const viPham = quetRoRi(xau, 'prompt');
    expect(viPham.length).toBeGreaterThan(0);
    expect(viPham.map((v) => v.khoa)).toContain('privateNotes');
  });
});

describe('công bố có kiểm soát — Phần 78.3', () => {
  it('bật revealTitle mới đưa danh xưng ra thế giới', () => {
    const daCongBo = CreatorIdentitySchema.parse({
      ...DANH_TINH_KIN,
      worldDisclosure: { revealTitle: true, revealForm: false, revealValues: false, knownRegionIds: [] },
    });
    expect(phanCongBo(daCongBo).title).toBe('Kẻ Gieo Tro');
    expect(phanCongBo(daCongBo).manifestation).toBeNull();
    const p = chieuPersona({
      profile: HO_SO_DAY_DU,
      creator: daCongBo,
      mode: 'sang_the',
      currentEntityId: null,
    });
    expect(p.publicDescription).toContain('Kẻ Gieo Tro');
    expect(p.publicDescription).not.toContain('CHUA-CONG-BO');
  });

  it('danh tính trống cho "Kẻ Không Tên" và thế giới chưa biết gì', () => {
    const trong = danhTinhTrong('ci_0', 'save_0');
    expect(trong.title).toBe('Kẻ Không Tên');
    expect(phanCongBo(trong).title).toBeNull();
  });

  it('diff cuối chia đúng ba cột: riêng tư | gửi Narrator | thành canon', () => {
    const d = diffCongBo({
      profile: HO_SO_DAY_DU,
      creator: DANH_TINH_KIN,
      mode: 'sang_the',
      currentEntityId: null,
    });
    expect(d.riengTu).toContain('Ghi chú riêng');
    expect(d.riengTu).toContain('Tùy chọn nội dung');
    expect(d.thanhCanon).toEqual([]);
    expect(d.guiNarrator.join(' ')).toContain('Mực');
    // Diff không được lộ NỘI DUNG riêng tư, chỉ nói có tồn tại.
    for (const bimat of CHUOI_BI_MAT) {
      expect(JSON.stringify(d)).not.toContain(bimat);
    }
  });
});

describe('không thu thập dữ liệu nhận diện — Phần 78.2 [BB]', () => {
  it.each(['email', 'birthday', 'dateOfBirth', 'gender', 'age', 'realName', 'phone'])(
    'PlayerProfile không có trường %s',
    (truong) => {
      expect(Object.keys(PlayerProfileSchema.shape)).not.toContain(truong);
    },
  );

  it('schema strict từ chối trường lạ, nên không thể lỡ tay lưu dữ liệu thật', () => {
    const r = PlayerProfileSchema.safeParse({
      id: 'x',
      createdAt: 0,
      updatedAt: 0,
      email: 'a@b.c',
    });
    expect(r.success).toBe(false);
  });
});

describe('Bỏ qua vẫn vào game được — Phần 78.5', () => {
  it('hồ sơ tối thiểu hợp lệ và không có gì riêng tư', () => {
    const p = hoSoToiThieu('pf_min', 0);
    expect(PlayerProfileSchema.safeParse(p).success).toBe(true);
    expect(p.privateNotes).toBe('');
    expect(p.displayName).toBe('Người Chơi');
    const persona = chieuPersona({ profile: p, creator: null, mode: 'sang_the', currentEntityId: null });
    expect(ProjectedPlayerPersonaSchema.safeParse(persona).success).toBe(true);
  });

  it('không có hồ sơ nào vẫn chiếu được persona hợp lệ', () => {
    const persona = chieuPersona({ profile: null, creator: null, mode: 'sang_the', currentEntityId: null });
    expect(persona.displayName).toBe('Người Chơi');
    expect(ProjectedPlayerPersonaSchema.safeParse(persona).success).toBe(true);
  });
});

describe('[BB] 78.7/78.8 — wizard không tự cấp quyền lực', () => {
  it('StartingPresenceDraft KHÔNG có trường domainStrength hay suc', () => {
    const deity = StartingPresenceDraftSchema.shape.deity;
    const keys = Object.keys(deity.def.innerType.shape);
    expect(keys).not.toContain('domainStrength');
    expect(keys).not.toContain('suc');
    expect(keys.sort()).toEqual(['domainConceptIds', 'pantheonId', 'primordial']);
  });

  it('tối đa ba domain concept', () => {
    const r = StartingPresenceDraftSchema.safeParse({
      mode: 'than',
      deity: { domainConceptIds: ['a', 'b', 'c', 'd'] },
    });
    expect(r.success).toBe(false);
  });

  it('draft mặc định là Sáng Thế và không có entity nhập vai', () => {
    const d = StartingPresenceDraftSchema.parse({});
    expect(d.mode).toBe('sang_the');
    expect(d.useExistingEntityId).toBeNull();
  });
});

describe('persona theo tầng — thế giới gọi bằng tên nhân vật, không tên tài khoản', () => {
  it('ở tầng Phàm Nhân, displayName là tên entity đang nhập', () => {
    const p = chieuPersona({
      profile: HO_SO_DAY_DU,
      creator: DANH_TINH_KIN,
      mode: 'pham_nhan',
      currentEntityId: 'mortal_ly',
      entityLabel: 'Lý Thất',
    });
    expect(p.displayName).toBe('Lý Thất');
    expect(p.currentEntityId).toBe('mortal_ly');
    expect(p.currentMode).toBe('pham_nhan');
  });
});
