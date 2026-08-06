/**
 * Cổng Phase 4 — Intent, tri thức và Project.
 *
 * Cổng (Phần 75 Phase 4 + Prompt IDE):
 *   - KHÔNG input nào trả "không hiểu" chung chung;
 *   - Impossible có BlockReason từ world;
 *   - Intent KHÔNG dùng tri thức mù;
 *   - mục tiêu dài hạn thành Project;
 *   - việc đời thường lặp KHÔNG tự thành luật vũ trụ;
 *   - khởi tạo Thần/Phàm không tự cấp tài nguyên/kỹ năng/quyền lực vô hạn.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { parseIntent, suaIntent, timMucTieu, boDau, laDauHieuProject } from './parser.js';
import { thuHoachAffordance, goiYChoCanh } from './affordance.js';
import { lapKeHoach, giaiQuyet, nenThanhProject, taoProject } from './resolve.js';
import type { NgocCanhGiai } from './resolve.js';
import { IntentSchema, ProjectSchema, KnowledgeRecordSchema, ActionOutcomeSchema } from './schema.js';
import { chieu } from '../project/chieu.js';
import type { WorldView } from '../contracts/view.js';
import type { WorldState } from '../engine/state.js';
import { taoState, taoEventLog, hashState } from '../engine/state.js';
import { apDungChuoi, apDungEvent } from '../engine/transaction.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventChuyenTang } from '../world/hienDien.js';
import { TUNING_MAC_DINH } from '../tuning/schema.js';
import { napDungSan } from '../registry/index.js';
import { INPUT_SANG_THE, INPUT_THAN, INPUT_PHAM_NHAN } from '../../test/fixtures/inputs.js';
import type { ViewMode } from '../contracts/primitives.js';

const CT = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed: 'phase4-seed', worldId: 'w1', branchId: 'br' });

let state: WorldState;
let log: ReturnType<typeof taoEventLog>;

function dungTheGioi(): WorldState {
  napDungSan();
  const { world, events } = moThuGioi(CT);
  const s = taoState(world);
  log = taoEventLog();
  const r = apDungChuoi(s, events, log);
  if (!r.ok) throw new Error('gieo lỗi');
  return s;
}

beforeEach(() => {
  state = dungTheGioi();
});

function ngocCanh(mode: ViewMode, chuTheId: string | null, cau: string, i = 0): NgocCanhGiai {
  const view: WorldView = chieu(state, mode, chuTheId);
  const intent = parseIntent(cau, {
    id: `it_${mode}_${i}`,
    branchId: state.world.branchId,
    sceneId: null,
    actorId: chuTheId ?? 'sang_the',
    mode,
    view,
  });
  return {
    view,
    intent,
    triThuc: [],
    tuning: TUNING_MAC_DINH,
    seed: state.world.seed,
    tick: state.world.tick,
  };
}

// ─────────────────────────────────────────── parser

describe('rule parser — đường offline chuẩn', () => {
  it('boDau khớp được cách gõ có dấu và không dấu', () => {
    expect(boDau('Cầu Nguyện')).toBe('cau nguyen');
    expect(boDau('ĐI ĐẾN')).toBe('di den');
  });

  it('[BB] rawText BẤT BIẾN qua mọi lần sửa', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Ta đi làm như mọi ngày.');
    const sua = suaIntent(nc.intent, { goal: 'Đi làm ở bến sông' });
    expect(sua.rawText).toBe(nc.intent.rawText);
    expect(sua.goal).toBe('Đi làm ở bến sông');
    expect(sua.parsedBy).toBe('user_corrected');
    expect(sua.confidence).toBe(1);
  });

  it('nhận ra hành động từ câu tiếng Việt thường', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Cầu nguyện xin cho mùa màng tốt.');
    expect(nc.intent.confidence).toBeGreaterThan(0.5);
    const plan = lapKeHoach(nc);
    expect(plan.steps[0]?.actionRef).toBe('cau_nguyen');
  });

  it('nhận ra tầm nhìn dài và thái độ', () => {
    const a = ngocCanh('pham_nhan', 'mortal_1', 'Ta thề sẽ trả thù cho cha, suốt đời.');
    expect(a.intent.horizon).toBe('era');
    const b = ngocCanh('pham_nhan', 'mortal_1', 'Ta bí mật thờ một vị thần khác.');
    expect(b.intent.stance.secrecy).toBe('secret');
    const c = ngocCanh('pham_nhan', 'mortal_1', 'Bằng mọi giá phá cái đền đó.');
    expect(c.intent.stance.harm).toBe('allow');
    expect(c.intent.stance.risk).toBe('embrace');
  });

  it('[BB] timMucTieu CHỈ khớp trên view — không bao giờ trên World thật', () => {
    const vSangThe = chieu(state, 'sang_the', null);
    const tenBiMat = vSangThe.entities.get('concept_thanh_sach')?.ten ?? '';
    expect(tenBiMat.length).toBeGreaterThan(0);

    // Phàm nhân không biết khái niệm hu_danh này tồn tại.
    const vPham = chieu(state, 'pham_nhan', 'mortal_1');
    expect(timMucTieu(`Ta nghĩ về ${tenBiMat}`, vPham)).toEqual([]);
    // Sáng Thế thì khớp được.
    expect(timMucTieu(`Ta nghĩ về ${tenBiMat}`, vSangThe).length).toBeGreaterThan(0);
  });

  it('câu rỗng cho confidence 0 nhưng vẫn ra Intent hợp lệ', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', '   ');
    expect(IntentSchema.safeParse(nc.intent).success).toBe(true);
    expect(nc.intent.confidence).toBe(0);
  });

  it('nhận ra dấu hiệu Project', () => {
    expect(laDauHieuProject('Mở lò gốm bên bến sông')).toBe(true);
    expect(laDauHieuProject('Ta ngủ')).toBe(false);
  });
});

// ─────────────────────────────────────────── [BB] không "không hiểu"

describe('[BB] 17.2 — không input nào trả "không hiểu" chung chung', () => {
  const boTest = [
    ['sang_the', null, INPUT_SANG_THE],
    ['than', 'deity_1', INPUT_THAN],
    ['pham_nhan', 'mortal_1', INPUT_PHAM_NHAN],
  ] as const;

  it('mỗi tầng có đúng 50 input fixture', () => {
    for (const [, , ds] of boTest) expect(ds).toHaveLength(50);
  });

  it.each(boTest.map(([m]) => m))('tầng %s: mọi input đều ra kết quả có nội dung', (mode) => {
    const bo = boTest.find(([m]) => m === mode);
    if (!bo) return;
    const [, chuThe, ds] = bo;

    ds.forEach((ca, i) => {
      const s2 = dungTheGioi();
      state = s2;
      const nc = ngocCanh(mode, chuThe, ca.cau, i);
      const r = giaiQuyet(nc);

      // Outcome luôn hợp lệ.
      expect(ActionOutcomeSchema.safeParse(r.outcome).success, ca.cau).toBe(true);

      // [BB] Luôn có lời kể; không bao giờ rỗng.
      expect(r.outcome.loiKe.length, `input "${ca.cau}" không có lời kể`).toBeGreaterThan(0);

      // [BB] Không bao giờ chứa "không hiểu".
      const chuoi = boDau(r.outcome.loiKe);
      expect(chuoi, `input "${ca.cau}" trả lời "không hiểu"`).not.toContain('khong hieu');
      expect(chuoi).not.toContain('khong nhan ra');
      expect(chuoi).not.toContain('loi he thong');

      // [BB] Thất bại phải có lý do TRONG THẾ GIỚI, không phải lỗi parser.
      if (r.outcome.result === 'failure') {
        expect(r.plan.blockedBy.length, `"${ca.cau}" failure mà không có BlockReason`).toBeGreaterThan(0);
        for (const b of r.plan.blockedBy) {
          expect(b.code.length).toBeGreaterThan(0);
          expect(b.message.length).toBeGreaterThan(0);
        }
      }
    });
  });

  it('input được đánh dấu `project` thật sự mở Project', () => {
    for (const [mode, chuThe, ds] of boTest) {
      for (const ca of ds.filter((c) => c.mong === 'project')) {
        state = dungTheGioi();
        const nc = ngocCanh(mode, chuThe, ca.cau);
        const r = giaiQuyet(nc);
        expect(r.outcome.result, `"${ca.cau}" đáng lẽ mở Project`).toBe('project_started');
        expect(r.project, ca.cau).not.toBeNull();
      }
    }
  });

  it('input được đánh dấu `chan_co_ly_do` bị chặn KÈM lý do cụ thể', () => {
    for (const [mode, chuThe, ds] of boTest) {
      for (const ca of ds.filter((c) => c.mong === 'chan_co_ly_do')) {
        state = dungTheGioi();
        const nc = ngocCanh(mode, chuThe, ca.cau);
        const plan = lapKeHoach(nc);
        const r = giaiQuyet(nc);
        const coLyDo =
          plan.blockedBy.length > 0 || plan.unknowns.length > 0 || r.outcome.result !== 'success';
        expect(coLyDo, `"${ca.cau}" đáng lẽ phải nêu được giới hạn`).toBe(true);
      }
    }
  });
});

// ─────────────────────────────────────────── [BB] tri thức

describe('[BB] 67.3 — Intent không dùng tri thức mù', () => {
  it('mục tiêu chủ thể chưa từng nghe bị chặn có lý do', () => {
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    const intent = IntentSchema.parse({
      id: 'it_mu',
      branchId: 'br',
      sceneId: null,
      actorId: 'mortal_1',
      mode: 'pham_nhan',
      rawText: 'Ta đi tìm thứ đó.',
      goal: 'Ta đi tìm thứ đó.',
      // Ép một target mà view KHÔNG chứa.
      targetRefs: [{ id: 'concept_thanh_sach', label: 'Thanh Sạch' }],
      parsedBy: 'rule',
      confidence: 0.8,
    });
    const plan = lapKeHoach({ view, intent, triThuc: [], tuning: TUNING_MAC_DINH, seed: 's', tick: 0 });
    expect(plan.blockedBy.some((b) => b.code === 'KHONG_BIET_MUC_TIEU')).toBe(true);
    expect(plan.blockedBy[0]?.message).toContain('chưa từng nghe');
  });

  it('mục tiêu chỉ nghe qua tin đồn thì làm được nhưng kế hoạch có ẩn số', () => {
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    const tinDon = view.suongMu.tinDon[0];
    if (!tinDon) return;
    const intent = IntentSchema.parse({
      id: 'it_td',
      branchId: 'br',
      sceneId: null,
      actorId: 'mortal_1',
      mode: 'pham_nhan',
      rawText: 'Ta đi tới đó.',
      goal: 'x',
      targetRefs: [{ id: tinDon }],
      parsedBy: 'rule',
      confidence: 0.8,
    });
    const plan = lapKeHoach({ view, intent, triThuc: [], tuning: TUNING_MAC_DINH, seed: 's', tick: 0 });
    expect(plan.blockedBy.some((b) => b.code === 'KHONG_BIET_MUC_TIEU')).toBe(false);
    expect(plan.unknowns.some((u) => u.includes('nghe kể lại'))).toBe(true);
  });

  it('KnowledgeRecord ghi được nguồn và số chặng', () => {
    const k = KnowledgeRecordSchema.parse({
      factId: 'f1',
      knowerId: 'mortal_1',
      proposition: 'Nước rằm rửa được dấu máu.',
      source: { type: 'rumor', sourceId: 'mortal_2', hops: 3 },
      confidence: 0.4,
      learnedAtTick: 5,
      lastConfirmedAtTick: null,
    });
    expect(k.source.hops).toBe(3);
    expect(k.contradictedBy).toEqual([]);
  });
});

// ─────────────────────────────────────────── [BB] quyền theo tầng

describe('[BB] 67.1 — sáu động từ là phép của Sáng Thế', () => {
  it('phàm nhân gõ câu Sáng Thế bị chặn KÈM đề xuất thay thế', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Ta tạo ra một vị thần mới.');
    const plan = lapKeHoach(nc);
    expect(plan.blockedBy.some((b) => b.code === 'DONG_TU_SANG_THE')).toBe(true);
    expect(plan.alternatives.length).toBeGreaterThan(0);
  });

  it('Sáng Thế gõ cùng câu thì KHÔNG bị chặn vì tầng', () => {
    const nc = ngocCanh('sang_the', null, 'Ta tạo ra một vị thần mới.');
    const plan = lapKeHoach(nc);
    expect(plan.blockedBy.some((b) => b.code === 'DONG_TU_SANG_THE')).toBe(false);
  });

  it('[BB] 5.3 — luật cấm trả về ID LUẬT cụ thể, không phải chuỗi chung chung', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Bằng mọi giá phá cái đền đó.');
    const plan = lapKeHoach(nc);
    const luat = plan.blockedBy.find((b) => b.code === 'LUAT_CAM');
    if (luat) {
      expect(luat.lawId).toBeTruthy();
      expect(luat.lawId).toMatch(/^law_/);
    }
  });
});

// ─────────────────────────────────────────── Project

describe('[BB] Phần 68 — việc lớn thành Project', () => {
  it('mục tiêu dài hạn mở Project, không hoàn thành ngay', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Mở lò gốm bên bến sông.');
    expect(nenThanhProject(nc.intent)).toBe(true);
    const r = giaiQuyet(nc);
    expect(r.outcome.result).toBe('project_started');
    expect(r.project).not.toBeNull();
    expect(ProjectSchema.safeParse(r.project).success).toBe(true);
  });

  it('[BB] 68.3 — milestone khởi đầu progress = 0, không ai được đặt sẵn = 1', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Học nghề đan lưới cho giỏi hơn.');
    const r = giaiQuyet(nc);
    expect(r.project).not.toBeNull();
    for (const m of r.project?.milestones ?? []) {
      expect(m.progress).toBe(0);
      expect(m.completedAtTick).toBeNull();
    }
  });

  it('Project bị vướng thì status = blocked kèm requirement giải được', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Ta muốn xây một ngôi đền, bằng mọi giá.');
    const plan = lapKeHoach(nc);
    const p = taoProject(nc, plan);
    if (plan.blockedBy.length > 0) {
      expect(p.status).toBe('blocked');
      expect(p.requirements.length).toBeGreaterThan(0);
    }
  });

  it('phạm vi Project theo tầng: cosmic / divine / personal', () => {
    const a = ngocCanh('sang_the', null, 'Ta muốn tạo cõi cho mọi giấc mơ thất lạc.');
    expect(taoProject(a, lapKeHoach(a)).scope).toBe('cosmic');
    const b = ngocCanh('than', 'deity_1', 'Lập một giáo phái mới.');
    expect(taoProject(b, lapKeHoach(b)).scope).toBe('divine');
    const c = ngocCanh('pham_nhan', 'mortal_1', 'Mở lò gốm bên bến sông.');
    expect(taoProject(c, lapKeHoach(c)).scope).toBe('personal');
  });

  it('Project luôn có ít nhất một requirement — không có việc lớn nào miễn phí', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Trồng lại vườn đã cháy.');
    const p = taoProject(nc, lapKeHoach(nc));
    expect(p.requirements.length).toBeGreaterThan(0);
    expect(p.requirements.every((r) => r.satisfied === false)).toBe(true);
  });

  it('[BB] 68.4 — không Project nào cần thanh mana', () => {
    const nc = ngocCanh('than', 'deity_1', 'Ta muốn giành lấy domain bão tố.');
    const p = taoProject(nc, lapKeHoach(nc));
    const chuoi = JSON.stringify(p);
    expect(chuoi).not.toContain('mana');
    expect(chuoi).not.toContain('cooldown');
    expect(p.requirements.every((r) => r.kind !== 'material' || r.description.length > 0)).toBe(true);
  });
});

// ─────────────────────────────────────────── [BB] không tự thành luật

describe('[BB] 67.6 — việc đời thường lặp KHÔNG tự thành luật vũ trụ', () => {
  it('lặp một hành động cá nhân 200 lần không đổi luật nào', () => {
    const luatTruoc = JSON.stringify(
      [...state.entities.values()].filter((e) => e.kind === 'law').map((e) => e.aspects['lawful']),
    );
    const soLuatTruoc = [...state.entities.values()].filter((e) => e.kind === 'law').length;

    for (let i = 0; i < 200; i++) {
      const nc = ngocCanh('pham_nhan', 'mortal_1', 'Ta pha trà.', i);
      const r = giaiQuyet(nc);
      for (const ev of r.events) apDungEvent(state, ev, log);
    }

    const soLuatSau = [...state.entities.values()].filter((e) => e.kind === 'law').length;
    expect(soLuatSau).toBe(soLuatTruoc);

    // Không luật nào bị sửa văn bản.
    const luatSau = JSON.stringify(
      [...state.entities.values()].filter((e) => e.kind === 'law').map((e) => e.aspects['lawful']),
    );
    expect(luatSau).toBe(luatTruoc);
  }, 30_000);

  it('giaiQuyet KHÔNG sửa state — chỉ sinh Event', () => {
    const truoc = hashState(state);
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Ta đi làm.');
    giaiQuyet(nc);
    expect(hashState(state)).toBe(truoc);
  });
});

// ─────────────────────────────────────────── xác nhận hành động không hoàn tác

describe('[BB] hành động không thể hoàn tác phải xác nhận trước', () => {
  it('THU (xóa thực thể) đòi xác nhận', () => {
    const nc = ngocCanh('sang_the', null, 'Thu vị thần đó về.');
    expect(lapKeHoach(nc).requiresConfirmation).toBe(true);
  });

  it('PHAN (tách bản thể) đòi xác nhận', () => {
    const nc = ngocCanh('sang_the', null, 'Tách bản thể ta làm ba.');
    expect(lapKeHoach(nc).requiresConfirmation).toBe(true);
  });

  it('ý định cho phép gây hại đòi xác nhận', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Bằng mọi giá phá cái đền đó.');
    expect(lapKeHoach(nc).requiresConfirmation).toBe(true);
  });

  it('việc thường thì không đòi xác nhận', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Ta đi làm như mọi ngày.');
    expect(lapKeHoach(nc).requiresConfirmation).toBe(false);
  });
});

// ─────────────────────────────────────────── affordance

describe('affordance — Phần 67.7', () => {
  it('[BB] chỉ thu từ view; entity mù không bao giờ xuất hiện', () => {
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    const ds = thuHoachAffordance(view, 'mortal_1');
    const chuoi = JSON.stringify(ds);
    for (const id of view.suongMu.mu) {
      expect(chuoi, `affordance lộ entity mù '${id}'`).not.toContain(id);
    }
  });

  it('Sáng Thế có sáu động từ trong affordance; phàm nhân thì không', () => {
    const st = thuHoachAffordance(chieu(state, 'sang_the', null), null);
    expect(st.filter((a) => a.nguon === 'verb')).toHaveLength(6);
    const pn = thuHoachAffordance(chieu(state, 'pham_nhan', 'mortal_1'), 'mortal_1');
    expect(pn.filter((a) => a.nguon === 'verb')).toHaveLength(0);
  });

  it('gợi ý 3–5 mục và đa dạng nguồn', () => {
    const g = goiYChoCanh(chieu(state, 'pham_nhan', 'mortal_1'), 'mortal_1', 5);
    expect(g.length).toBeGreaterThanOrEqual(3);
    expect(g.length).toBeLessThanOrEqual(5);
    expect(new Set(g.map((a) => a.nguon)).size).toBeGreaterThan(1);
  });

  it('affordance deterministic', () => {
    const view = chieu(state, 'pham_nhan', 'mortal_1');
    expect(thuHoachAffordance(view, 'mortal_1')).toEqual(thuHoachAffordance(view, 'mortal_1'));
  });
});

// ─────────────────────────────────────────── tích hợp ba tầng

describe('kịch bản tích hợp — cùng pipeline cho ba tầng', () => {
  it('một câu ở mỗi tầng đều đi hết vòng Intent → Plan → Outcome → Event', () => {
    for (const [mode, chuThe, cau] of [
      ['sang_the', null, 'Ta ban một luật: kẻ nói dối sẽ mất giọng.'],
      ['than', 'deity_1', 'Ta gửi một điềm báo tới ngôi làng bên sông.'],
      ['pham_nhan', 'mortal_1', 'Ta đi làm như mọi ngày.'],
    ] as const) {
      state = dungTheGioi();
      if (mode !== 'sang_the') {
        apDungEvent(state, eventChuyenTang(state, mode, chuThe, 'test', log), log);
      }
      const nc = ngocCanh(mode, chuThe, cau);
      const r = giaiQuyet(nc);
      expect(r.outcome.loiKe.length).toBeGreaterThan(0);
      for (const ev of r.events) {
        expect(apDungEvent(state, ev, log).ok, `${mode}: ${cau}`).toBe(true);
      }
    }
  });

  it('ý định bí mật sinh Event visibility = bi_mat', () => {
    const nc = ngocCanh('pham_nhan', 'mortal_1', 'Ta bí mật thờ một vị thần khác.');
    const r = giaiQuyet(nc);
    expect(r.events[0]?.visibility).toBe('bi_mat');
  });

  it('cùng seed + cùng câu cho cùng kết quả', () => {
    const a = giaiQuyet(ngocCanh('pham_nhan', 'mortal_1', 'Ta đi làm.'));
    state = dungTheGioi();
    const b = giaiQuyet(ngocCanh('pham_nhan', 'mortal_1', 'Ta đi làm.'));
    expect(a.outcome).toEqual(b.outcome);
    expect(a.events[0]?.hash).toBe(b.events[0]?.hash);
  });
});
