/**
 * Cổng Phase 11 — một đường prompt, và thẻ bài MVU chạy được mà không đoạt quyền.
 *
 * Hai câu hỏi ở đây là hai câu người dùng đã hỏi bằng lời khác:
 *
 *   "app đang chệch hướng" → preset nhập vào có thật sự tới được model không?
 *   "phải dùng được hết mà không xung đột" → bật pack lên có mất gì không?
 *
 * Nên test không kiểm "hàm có chạy không". Nó kiểm: nội dung native có còn
 * nguyên không, thứ tự quyền có giữ không, và cú pháp lạ có mở được cửa nào không.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog } from '../engine/state.js';
import type { WorldState } from '../engine/state.js';
import { apDungChuoi, apDungEvent } from '../engine/transaction.js';
import type { Event } from '../contracts/core.js';
import { SceneSchema } from '../contracts/core.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { chieu } from '../project/chieu.js';
import { datLaiInvariant } from '../engine/invariant.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { NormalizedGenParamsSchema } from '../schema/ai.js';
import type { NguLieuKe } from '../ai/bienSoan.js';
import { bocTach } from '../ai/bocTach.js';
import { phanGiaiDuongDan, docKhoiCapNhat } from '../ai/mvu.js';
import { bienSoanLuot, DUONG_PORT_TINH_NANG } from './hopNhat.js';
import type { PackDangBat } from './hopNhat.js';
import { PromptModuleSchema, NormalizedPresetPackSchema, PresetPackRowSchema } from './schema.js';
import { PresetActivationSchema } from './schema.js';

beforeEach(() => {
  datLaiInvariant();
  napBatBienTheGioiSong();
});

function theGioi(): WorldState {
  const ct = KhoiTaoWorldSchema.parse({ cua: 'hu_vo', seed: 'hop-nhat', worldId: 'w1', branchId: 'br_goc' });
  const { world, events } = moThuGioi(ct);
  const state = taoState(world);
  const log = taoEventLog();
  expect(apDungChuoi(state, events, log).ok).toBe(true);
  expect(apDungEvent(state, eventGieoNen(state) as Event, log).ok).toBe(true);
  return state;
}

function nguLieu(state: WorldState, cau = 'Ta ban một điều luật.'): NguLieuKe {
  return {
    view: chieu(state, 'sang_the', null),
    banTin: null,
    loiCau: [],
    canhGanDay: [
      { loai: 'ket_qua', noiDung: 'Trước đó, sương phủ kín thung lũng.' },
      { loai: 'nguoi_choi', noiDung: 'Ta nhìn xuống.' },
    ],
    cauNguoiChoi: cau,
    ketQuaEngine: ['Một luật mới được ghi nhận.'],
    tenNguoiChoi: 'Kẻ Đứng Ngoài',
    tyLeToken: 3.2,
  };
}

const scene = SceneSchema.parse({
  id: 'scene.1',
  branchId: 'br_goc',
  currentTick: 0,
  startedAtTick: 0,
  locationId: '',
  lensId: '',
  participantIds: [],
});

/** Một pack tối thiểu nhưng thật: có marker, có module thường, có prefill. */
function packThu(coMarkerLichSu: boolean): PackDangBat {
  const mo = (
    id: string,
    kind: 'slot' | 'instruction' | 'assistant_prefill',
    lane: string,
    content: string,
    sourceIdentifier = id,
  ) =>
    PromptModuleSchema.parse({
      id: `pk.thu/${id}`,
      packId: 'pk.thu',
      sourceIdentifier,
      name: id,
      role: kind === 'assistant_prefill' ? 'assistant' : 'system',
      kind,
      enabled: true,
      lane,
      order: 10,
      depth: 0,
      content,
      activation: 'native',
    });

  const modules = [
    mo('phong_cach', 'instruction', 'style', 'Viết bằng giọng biên niên sử, câu ngắn.'),
    mo('boi_canh', 'slot', 'scenario', '', 'scenario'),
    ...(coMarkerLichSu ? [mo('lich_su', 'slot', 'history', '', 'chatHistory')] : []),
    mo('moi', 'assistant_prefill', 'prefill', 'Biên niên chép rằng:'),
  ];

  const pack = NormalizedPresetPackSchema.parse({
    envelope: {
      id: 'env.thu',
      schemaVersion: 1,
      format: 'sillytavern_openai_preset',
      sourceName: 'thu.json',
      sourceHash: 'sha256:AB',
      sourceBytes: 10,
      importedAt: 0,
      namespace: 'pk.thu',
      rawSourceRef: 'sha256:AB',
    },
    version: 1,
    modules,
    variables: { do_thien_cam: 10 },
  });

  const row = PresetPackRowSchema.parse({ packId: 'pk.thu', version: 1, pack });
  const activation = PresetActivationSchema.parse({
    id: 'act.1',
    packId: 'pk.thu',
    packVersion: 1,
    saveId: 'save.1',
    branchId: 'br_goc',
    targets: ['narrator'],
    selectedModuleIds: modules.map((m) => m.id),
    conflictResolutions: {},
    previousActivationId: null,
    activatedAt: 0,
  });

  return { row, activation };
}

function goi(state: WorldState, packs: readonly PackDangBat[], hoTroPrefill = true) {
  return bienSoanLuot({
    nguLieu: nguLieu(state),
    scene,
    packs,
    params: NormalizedGenParamsSchema.parse({}),
    nganSachToken: 8000,
    tenPersona: 'Kẻ Đứng Ngoài',
    moTaPersona: 'Một kẻ quan sát, không thân xác.',
    hoTroPrefill,
  });
}

// ─────────────────────────────────────────── 1. tắt pack = prompt native

describe('[BB] 65.4 — tắt pack trả về prompt native, đúng nghĩa đen', () => {
  it('không pack nào bật thì không có bước biên dịch nào chạy', () => {
    const kq = goi(theGioi(), []);
    expect(kq.compiled).toBeNull();
    expect(kq.packDaDung).toHaveLength(0);
    // Bảy quy tắc Narrator vẫn còn nguyên trong prompt.
    expect(kq.prompt.heThong).toContain('BẢY QUY TẮC');
  });
});

// ─────────────────────────────────────────── 2. bật pack không mất gì

describe('Bật pack không được đánh rơi nội dung native', () => {
  it('module của pack THẬT SỰ tới được model', () => {
    const kq = goi(theGioi(), [packThu(true)]);
    expect(kq.compiled).not.toBeNull();
    expect(kq.prompt.heThong).toContain('giọng biên niên sử');
    expect(kq.packDaDung).toEqual(['pk.thu']);
  });

  it('marker rỗng được lắp bằng nội dung native đã chiếu, không gửi ô trống', () => {
    const kq = goi(theGioi(), [packThu(true)]);
    const boiCanh = kq.compiled?.messages.find((m) => m.moduleId === 'pk.thu/boi_canh');
    expect(boiCanh).toBeDefined();
    expect((boiCanh as { content: string }).content.trim().length).toBeGreaterThan(0);

    const lichSu = kq.compiled?.messages.find((m) => m.moduleId === 'pk.thu/lich_su');
    expect((lichSu as { content: string }).content).toContain('sương phủ kín thung lũng');
  });

  it('pack THIẾU marker lịch sử thì lịch sử vẫn tới model, chỉ đổi chỗ', () => {
    const co = goi(theGioi(), [packThu(true)]);
    const khong = goi(theGioi(), [packThu(false)]);

    expect(co.prompt.heThong + co.prompt.nguoiDung).toContain('sương phủ kín thung lũng');
    // [BB] Đây là câu "dùng được hết mà không xung đột": thiếu ô thì mất bố cục,
    // không mất trí nhớ.
    expect(khong.prompt.heThong + khong.prompt.nguoiDung).toContain('sương phủ kín thung lũng');
  });

  it('hợp đồng khối cập nhật của engine nằm SAU mọi module ngoài', () => {
    const kq = goi(theGioi(), [packThu(true)]);
    const ds = kq.compiled?.messages ?? [];
    const viLoi = ds.findIndex((m) => m.moduleId === 'pk.thu/phong_cach');
    const viLuot = ds.findIndex((m) => m.moduleId === 'td:tang5');
    expect(viLoi).toBeGreaterThanOrEqual(0);
    expect(viLuot).toBeGreaterThan(viLoi);
    expect(ds[viLuot]?.content).toContain('<CapNhat>');
  });

  it('[BB] 63.6 — lõi an toàn và hợp đồng engine luôn đứng đầu', () => {
    const kq = goi(theGioi(), [packThu(true)]);
    const ds = kq.compiled?.messages ?? [];
    expect(ds[0]?.moduleId).toBe('td:tang0');
    expect(ds[1]?.moduleId).toBe('td:tang1');
    expect(ds[2]?.moduleId).toBe('td:tang2');
    expect(ds[3]?.moduleId).toBe('td:tang3');
  });

  it('prefill thành mồi trả lời riêng, không bị nhét vào lượt người dùng', () => {
    const kq = goi(theGioi(), [packThu(true)], true);
    expect(kq.prompt.moiTraLoi).toBe('Biên niên chép rằng:');
    expect(kq.prompt.nguoiDung).not.toContain('Biên niên chép rằng:');
  });

  it('model không nhận prefill thì module ấy bị bỏ kèm lý do, không gửi lén', () => {
    const kq = goi(theGioi(), [packThu(true)], false);
    expect(kq.prompt.moiTraLoi ?? '').toBe('');
    expect(kq.issues.some((i) => i.code === 'PREFILL_KHONG_HO_TRO')).toBe(true);
  });
});

// ─────────────────────────────────────────── 3. MVU

describe('Tương thích thẻ bài MVU — nhận cú pháp, KHÔNG nhận thẩm quyền', () => {
  it('thẻ <UpdateVariable> được đọc y như <CapNhat>', () => {
    const kq = bocTach('Cảnh vẫn tiếp.\n<UpdateVariable>{"patches":[]}</UpdateVariable>', {
      eventId: 'ev1',
      idHopLe: new Set(),
    });
    expect(kq.coKhoiCapNhat).toBe(true);
    expect(kq.loiKe).toBe('Cảnh vẫn tiếp.');
  });

  it('câu lệnh _.set trỏ ra ngoài thế giới thành BIẾN PACK, không thành patch', () => {
    const kq = bocTach(
      "Nàng cau mày.\n<UpdateVariable>\n_.set('stat_data.hao_cam', 10, 25); // vì ngươi đã giúp nàng\n</UpdateVariable>",
      { eventId: 'ev1', idHopLe: new Set(['mortal_ly']) },
    );
    expect(kq.patches).toHaveLength(0);
    expect(kq.bienPack).toHaveLength(1);
    expect(kq.bienPack[0]?.duong).toBe('stat_data.hao_cam');
    expect(kq.bienPack[0]?.giaTri).toBe(25);
    expect(kq.bienPack[0]?.lyDo).toBe('vì ngươi đã giúp nàng');
  });

  it('câu lệnh trỏ vào thực thể THẬT vẫn phải qua bảng trắng như mọi patch khác', () => {
    // `worlds` không nằm trong bảng trắng — cú pháp MVU không mở được cửa đó.
    const kq = bocTach(
      "<UpdateVariable>_.set('worlds.w1.playerState.mode', 'pham_nhan', 'sang_the');</UpdateVariable>",
      { eventId: 'ev1', idHopLe: new Set(['w1']) },
    );
    expect(kq.patches).toHaveLength(0);
  });

  it('[BB] 69.1 — cú pháp MVU không sửa được lõi bản ngã', () => {
    const kq = bocTach(
      "<UpdateVariable>_.set('deity_x.aspects.ban_nga.coreSelf.tuBi', 0, 100);</UpdateVariable>",
      { eventId: 'ev1', idHopLe: new Set(['deity_x']) },
    );
    expect(kq.patches).toHaveLength(0);
    expect(kq.biTuChoi.some((b) => b.ma === 'DUONG_DAN_CAM')).toBe(true);
  });

  it('bản đồ đường dẫn của 31.7 với {_op:add} thành patch cộng dồn', () => {
    const kq = bocTach(
      '<UpdateVariable>{"concept_x.aspects.conceptual.trongSo": {"_op":"add","_v":45}}</UpdateVariable>',
      { eventId: 'ev1', idHopLe: new Set(['concept_x']) },
    );
    expect(kq.patches).toHaveLength(1);
    expect(kq.patches[0]?.op).toBe('add');
    expect(kq.patches[0]?.value).toBe(45);
    expect(kq.patches[0]?.target.table).toBe('entities');
    expect(kq.patches[0]?.target.path).toBe('aspects.conceptual.trongSo');
  });

  it('[BB] 31.7 — khóa bắt đầu bằng gạch dưới bị từ chối', () => {
    const kq = bocTach('<UpdateVariable>{"_internal": 1}</UpdateVariable>', {
      eventId: 'ev1',
      idHopLe: new Set(),
    });
    expect(kq.patches).toHaveLength(0);
    expect(kq.bienPack).toHaveLength(0);
    expect(kq.biTuChoi).toHaveLength(1);
  });

  it('id chứa dấu chấm vẫn khớp đúng — cắt ở chấm đầu tiên là sai', () => {
    const dich = phanGiaiDuongDan('e.chu_the.aspects.soul.tang', new Set(['e.chu_the']));
    expect(dich?.id).toBe('e.chu_the');
    expect(dich?.path).toBe('aspects.soul.tang');
  });

  it('khối không JSON và không câu lệnh là khối hỏng thật', () => {
    expect(docKhoiCapNhat('nàng mỉm cười', new Set())).toBeNull();
  });

  it('chuỗi suy luận không lọt lên khung kể', () => {
    const kq = bocTach('<thinking>ta nên viết gì đây</thinking>Nàng bước vào.', {
      eventId: 'ev1',
      idHopLe: new Set(),
    });
    expect(kq.loiKe).toBe('Nàng bước vào.');
  });
});

// ─────────────────────────────────────────── 4. bảng port 66.6

describe('66.6 — bảng đường port là dữ liệu, để Xưởng Preset in ra được', () => {
  it('đủ mười bốn ý đồ, mỗi ý đồ có đích native và điều cấm', () => {
    expect(DUONG_PORT_TINH_NANG).toHaveLength(14);
    for (const d of DUONG_PORT_TINH_NANG) {
      expect(d.yDo.length).toBeGreaterThan(0);
      expect(d.dichNative.length).toBeGreaterThan(0);
      expect(d.khongDuocLam.length).toBeGreaterThan(0);
    }
  });
});
