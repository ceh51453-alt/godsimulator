/**
 * Cổng nghiệm thu của `presets/thien-dien-sang-the-v1.json`.
 *
 * `tools/build-preset-sang-the.mjs` kiểm bằng bản SAO logic của app (regex conflict
 * key, `bienRegex`, whitelist macro). File này kiểm bằng CHÍNH app: nó chạy
 * `nhapPreset()` thật, `kichHoat()` thật và `bienSoanLuot()` thật trên file đã sinh.
 *
 * Hai lớp vì bộ sinh chạy được ngoài repo (node thuần, không TypeScript) nên nó
 * phải mang bản sao; và một bản sao thì luôn có ngày lệch khỏi bản gốc. Test này
 * là chỗ phát hiện ngày ấy.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { nhapPreset } from '../core/preset/nhap.js';
import { viewGia, sceneGia } from '../core/preset/giaLap.js';
import { lintTruocKhiBat, kichHoat, apActivation } from '../core/preset/kichHoat.js';
import { bienSoanLuot } from '../core/preset/hopNhat.js';
import { apTransform } from '../core/preset/sandbox.js';
import { apInPromptRegexMessages } from '../core/preset/adapterMerge.js';
import { catSuyLuanNoiBo } from '../core/ai/suyLuan.js';
import { chuanHoaThamSo } from '../core/preset/chuanHoa.js';
import { TUNING_MAC_DINH } from '../core/tuning/schema.js';
import { ModelProfileSchema } from '../core/schema/ai.js';
import { NormalizedGenParamsSchema } from '../core/schema/ai.js';
import type { NguLieuKe } from '../core/ai/bienSoan.js';

const DUONG = join(process.cwd(), 'presets/thien-dien-sang-the-v1.json');
const VAN_BAN = readFileSync(DUONG, 'utf8');

/** Gemini-class: nhận đủ 65.000 output và có prefill. */
const PROFILE_GEMINI = ModelProfileSchema.parse({
  id: 'p.gemini',
  ten: 'Gemini-class',
  gioiHan: { contextMax: 2_000_000, outputMax: 65_536, topKMax: 64, temperatureMax: 2 },
  hoTro: { continuePrefill: true, seed: true },
});

/** Claude-class: temperature trần 1, output trần 64.000 — chỗ preset bị kẹp. */
const PROFILE_CLAUDE = ModelProfileSchema.parse({
  id: 'p.claude',
  ten: 'Claude-class',
  gioiHan: { contextMax: 2_000_000, outputMax: 64_000, topKMax: 500, temperatureMax: 1 },
  hoTro: { continuePrefill: true },
});

function nhap(profile = PROFILE_GEMINI) {
  return nhapPreset({
    tenNguon: 'thien-dien-sang-the-v1.json',
    noiDung: VAN_BAN,
    tick: 12,
    tuning: TUNING_MAC_DINH,
    profile,
    viewGia: viewGia(),
    sceneGia: sceneGia(),
  });
}

const KQ = nhap();
const ROW = KQ.row;

// ─────────────────────────────────────────── nhận diện và sạch lỗi

describe('nhập — pipeline mười hai bước', () => {
  it('chạy hết mười hai bước và không có issue severity error', () => {
    expect(KQ.dungOBuoc).toBe(12);
    const err = KQ.issues.filter((i) => i.severity === 'error');
    expect(err.map((i) => `${i.code} @ ${i.path}`)).toEqual([]);
    expect(KQ.ok).toBe(true);
  });

  it('được dò là sillytavern_openai_preset với điểm tối đa', () => {
    expect(KQ.doDinhDang?.format).toBe('sillytavern_openai_preset');
    expect(KQ.doDinhDang?.diem).toBeCloseTo(1, 5);
    expect(KQ.doDinhDang?.dauHieu).toContain('prompts[]');
    expect(KQ.doDinhDang?.dauHieu).toContain('prompt_order[]');
  });

  it('không có URL ngoài và không có chuỗi hình dạng secret', () => {
    expect(KQ.quet?.hosts).toEqual([]);
    expect(KQ.quet?.secrets).toEqual([]);
    expect(KQ.quet?.nodeBiTuChoi).toEqual([]);
  });
});

// ─────────────────────────────────────────── ba con số mà ba preset tham khảo đều lệch

describe('nhập — thứ tự và trạng thái (63.3)', () => {
  it('KHÔNG có mismatch giữa prompts[].enabled và order[].enabled', () => {
    expect(KQ.thongKe?.soMismatch).toBe(0);
    expect(KQ.issues.filter((i) => i.code === 'ENABLED_MISMATCH')).toEqual([]);
  });

  it('KHÔNG có prompt nằm ngoài prompt_order', () => {
    expect(KQ.thongKe?.soNgoaiOrder).toBe(0);
    expect(KQ.issues.filter((i) => i.code === 'UNORDERED_PROMPT')).toEqual([]);
  });

  it('KHÔNG có order mồ côi và KHÔNG có identifier trùng', () => {
    expect(KQ.thongKe?.soOrderMoCoi).toBe(0);
    expect(KQ.issues.filter((i) => i.code === 'IDENTIFIER_TRUNG')).toEqual([]);
  });

  it('đúng một khối prompt_order, đủ tám marker, năm marker đang bật', () => {
    expect(KQ.issues.filter((i) => i.code === 'NHIEU_KHOI_ORDER')).toEqual([]);
    expect(KQ.thongKe?.soMarker).toBe(8);
    const markerBat = (ROW?.pack.modules ?? []).filter((m) => m.kind === 'slot' && m.enabled);
    expect(markerBat.map((m) => m.sourceIdentifier).sort()).toEqual([
      'charDescription',
      'chatHistory',
      'personaDescription',
      'scenario',
      'worldInfoBefore',
    ]);
  });

  it('mọi module đều ở trạng thái hoạt động — không needs_adapter, không quarantined', () => {
    const theo = KQ.thongKe?.theoTrangThai;
    expect(theo?.needs_adapter).toBe(0);
    expect(theo?.quarantined).toBe(0);
    expect(theo?.disabled).toBe(0);
    expect((theo?.native ?? 0) + (theo?.adapted ?? 0)).toBe(KQ.thongKe?.soPrompt);
  });
});

// ─────────────────────────────────────────── xung đột và phụ thuộc

describe('nhập — xung đột và đồ thị phụ thuộc (65.1, 65.2)', () => {
  it('KHÔNG có nhóm xung đột nào cần người chọn', () => {
    const canChon = KQ.nhom.filter((n) => n.canNguoiChon);
    expect(canChon.map((n) => `${n.khoa}: ${n.moduleIds.join(', ')}`)).toEqual([]);
  });

  it('KHÔNG có vòng phụ thuộc và KHÔNG có vòng biến macro', () => {
    expect(KQ.doThi?.cycles).toEqual([]);
    expect(KQ.issues.filter((i) => i.code === 'MACRO_CYCLE')).toEqual([]);
    expect(KQ.issues.filter((i) => i.code === 'DEPENDENCY_CYCLE')).toEqual([]);
  });

  it('phụ thuộc thiếu CHỈ là slot:output_contract của module prefill', () => {
    // Mọi module `role: assistant` đều `requires: slot:output_contract`, và không
    // marker nào cấp được slot đó — 63.4 không có marker nào map sang lane này.
    // Đây là cảnh báo đã biết trước, và nó phải là cảnh báo DUY NHẤT.
    expect((KQ.doThi?.thieu ?? []).map((t) => t.khoa)).toEqual(['slot:output_contract']);
  });

  it('mọi getvar đều có module cấp biến — không có var: nào thiếu', () => {
    const thieuVar = (KQ.doThi?.thieu ?? []).filter((t) => t.khoa.startsWith('var:'));
    expect(thieuVar).toEqual([]);
  });
});

// ─────────────────────────────────────────── macro

describe('nhập — macro (63.5)', () => {
  it('KHÔNG macro nào chưa có ánh xạ native', () => {
    expect(KQ.thuBienDich.narrator?.unresolvedMacros).toEqual([]);
    expect(KQ.issues.filter((i) => i.code === 'MACRO_CAN_ADAPTER')).toEqual([]);
  });

  it('KHÔNG dùng biến toàn cục (không có cảnh báo đổi phạm vi)', () => {
    expect(KQ.issues.filter((i) => i.code === 'GLOBAL_VAR_DOI_PHAM_VI')).toEqual([]);
  });

  it('KHÔNG macro nào lồng quá tuning.preset.maxMacroDepth', () => {
    expect(KQ.issues.filter((i) => i.code === 'MACRO_QUA_SAU')).toEqual([]);
  });
});

// ─────────────────────────────────────────── biên dịch narrator

describe('biên dịch thử — narrator', () => {
  const cp = KQ.thuBienDich.narrator;
  const theoId = new Map((ROW?.pack.modules ?? []).map((m) => [m.id, m]));

  /**
   * Hai lý do bỏ được coi là LÀNH:
   *
   * · `tat_trong_preset` — tác giả preset tự tắt. Đúng năm mục, có chủ ý.
   * · `rong` — nhưng CHỈ với module `kind: 'slot'`. Bước 10 của pipeline chạy dry
   *   run và không truyền `nguonSlot`, nên năm marker đang bật đều rỗng ở đây. Đó
   *   là đúng định nghĩa của marker: nó là cái ô, không phải nội dung.
   *
   * Bốn lý do còn lại (`khong_tuong_thich`, `sai_pipeline`, `ngan_sach`,
   * `model_khong_nhan_prefill`) đều là dấu hiệu preset chưa tương thích.
   */
  it('module bị bỏ chỉ vì tác giả tự tắt, hoặc là marker chưa có nguồn ở dry run', () => {
    for (const [id, ly] of Object.entries(cp?.omitReasons ?? {})) {
      expect(['tat_trong_preset', 'rong'], `${id} → ${ly}`).toContain(ly);
      if (ly === 'rong') expect(theoId.get(id)?.kind, id).toBe('slot');
    }
    const tuTat = Object.values(cp?.omitReasons ?? {}).filter((l) => l === 'tat_trong_preset');
    expect(tuTat).toHaveLength(5);
  });

  it('lõi tầng 0–3 nằm trước mọi module ngoài', () => {
    const ids = (cp?.messages ?? []).map((m) => m.moduleId);
    const viTriLoi = ids.findIndex((id) => id === 'td:tang3');
    const viTriNgoai = ids.findIndex((id) => !id.startsWith('td:'));
    expect(viTriLoi).toBeGreaterThanOrEqual(0);
    expect(viTriNgoai).toBeGreaterThan(viTriLoi);
  });

  it('mồi trả lời đi vào lane prefill với role assistant', () => {
    const prefill = (cp?.messages ?? []).filter((m) => m.lane === 'prefill');
    expect(prefill).toHaveLength(1);
    expect(prefill[0]?.role).toBe('assistant');
    expect(prefill[0]?.content).toContain('<thinking>');
  });

  it('KHÔNG module ngoài nào lọt vào updater, evolution hay workflow_task', () => {
    for (const pl of ['updater', 'evolution', 'workflow_task'] as const) {
      const ngoai = (KQ.thuBienDich[pl]?.messages ?? []).filter((m) => !m.moduleId.startsWith('td:'));
      expect(ngoai, `pipeline ${pl}`).toEqual([]);
    }
    expect(KQ.issues.filter((i) => i.code === 'MODULE_NGOAI_LOT_VAO_PIPELINE_CAM')).toEqual([]);
  });

  it('không module nào bị cắt vì ngân sách, và không khối nào quá 200.000 ký tự', () => {
    expect(KQ.issues.filter((i) => i.code === 'CAT_VI_NGAN_SACH')).toEqual([]);
    expect(KQ.issues.filter((i) => i.code === 'BLOCK_QUA_DAI')).toEqual([]);
  });

  it('nội dung đang bật vừa ngân sách một lượt kể (150.000 token)', () => {
    const kyTu = (ROW?.pack.modules ?? []).filter((m) => m.enabled).reduce((a, m) => a + m.content.length, 0);
    // 2,6 ký tự/token là tỷ lệ chặt nhất trong bảng ModelProfile của repo.
    expect(Math.ceil(kyTu / 2.6)).toBeLessThan(60_000);
  });
});

// ─────────────────────────────────────────── regex

describe('regex — chín script đều chạy được trong sandbox', () => {
  it('cả chín ở trạng thái sandboxed, không cái nào cần adapter', () => {
    expect(ROW?.transformDefs).toHaveLength(9);
    expect((ROW?.transformDefs ?? []).filter((t) => t.activation !== 'sandboxed')).toEqual([]);
    expect(KQ.issues.filter((i) => i.code === 'REGEX_CAN_ADAPTER')).toEqual([]);
  });

  it('chỉ dùng placement 1 và 2, substituteRegex = 0, guard depth hợp lệ', () => {
    for (const t of ROW?.transformDefs ?? []) {
      expect(
        t.placement.every((p) => p === 1 || p === 2),
        t.ten,
      ).toBe(true);
      expect(t.placement.length, t.ten).toBeGreaterThan(0);
      expect(t.substituteRegex, t.ten).toBe(0);
      if (t.maxDepth !== null) expect(t.maxDepth, t.ten).toBeGreaterThanOrEqual(0);
      if (t.minDepth !== null) expect(t.minDepth, t.ten).toBeGreaterThanOrEqual(-1);
    }
  });

  it('khối tư duy đóng thẻ bị xóa khỏi bản hiển thị', () => {
    const raw = 'A\n<thinking>\nnháp nội bộ rất dài\n</thinking>\nVăn kể thật.';
    const kq = apTransform({
      text: raw,
      transforms: ROW?.transformDefs ?? [],
      maxRegexMs: TUNING_MAC_DINH.preset.maxRegexMs,
      placement: 2,
      destination: 'display',
      depth: 0,
    });
    expect(kq.text).not.toContain('nháp nội bộ');
    expect(kq.text).toContain('Văn kể thật.');
    expect(kq.quaCham).toEqual([]);
  });

  it('khối tư duy CHƯA đóng thẻ cũng không lọt ra — cả hai đường đều bắt', () => {
    const doDang = 'Mở đầu.\n<thinking>\nnháp bị cắt giữa câu';
    const qua = apTransform({
      text: doDang,
      transforms: ROW?.transformDefs ?? [],
      maxRegexMs: TUNING_MAC_DINH.preset.maxRegexMs,
      placement: 2,
      destination: 'display',
      depth: 0,
    });
    expect(qua.text).not.toContain('nháp bị cắt');
    // Đường chính: adapter cot_cleanup gọi hàm này, và nó cũng bắt thẻ chưa đóng.
    expect(catSuyLuanNoiBo(doDang)).toBe('Mở đầu.');
  });

  it('khối tư duy và sổ biên niên bị xóa khỏi lịch sử gửi lại model', () => {
    const raw =
      '<thinking>x</thinking>Văn.\n<bien_nien>\nMốc: mùa khô\n</bien_nien>\n<choices>1. đi</choices>';
    const kq = apTransform({
      text: raw,
      transforms: ROW?.transformDefs ?? [],
      maxRegexMs: TUNING_MAC_DINH.preset.maxRegexMs,
      placement: 2,
      destination: 'prompt',
      depth: 0,
    });
    expect(kq.text).not.toContain('<thinking>');
    expect(kq.text).not.toContain('bien_nien');
    expect(kq.text).not.toContain('<choices>');
    expect(kq.text).toContain('Văn.');
  });

  it('sổ biên niên được dựng thành bảng gấp gọn khi hiển thị, không có URL mạng', () => {
    const raw = 'Văn.\n<bien_nien>\nMốc: mùa khô thứ ba\nĐã đổi: một cây cầu bị dỡ\n</bien_nien>';
    // `TransformDef.id` được đặt lại thành `packId/rx<i>` lúc chuẩn hóa; `id` khai
    // trong file nguồn KHÔNG đi theo. Lọc theo tên script là đường duy nhất đúng.
    const chiBang = (ROW?.transformDefs ?? []).filter((t) => t.ten.includes('dựng bảng'));
    const kq = apTransform({
      text: raw,
      transforms: chiBang,
      maxRegexMs: TUNING_MAC_DINH.preset.maxRegexMs,
      placement: 2,
      destination: 'display',
      depth: 0,
    });
    expect(kq.daApDung).toHaveLength(1);
    expect(kq.text).toContain('<details');
    expect(kq.text).toContain('mùa khô thứ ba');
    expect(kq.text).not.toMatch(/https?:\/\//);
    expect(kq.text).not.toMatch(/url\s*\(/);
  });

  it('KHÔNG có khối <regex> nội tuyến nào sai dạng trong nội dung module', () => {
    const messages = (KQ.thuBienDich.narrator?.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      moduleId: m.moduleId,
      lane: m.lane,
    }));
    const kq = apInPromptRegexMessages(messages, { maxRegexMs: TUNING_MAC_DINH.preset.maxRegexMs });
    expect(kq.errors).toEqual([]);
  });
});

// ─────────────────────────────────────────── script cách ly

describe('script — đúng một khai báo, cách ly, có adapter native', () => {
  it('một script Tavern Helper, ở trạng thái cách ly, không có nút bật', () => {
    expect(ROW?.quarantined).toHaveLength(1);
    expect(KQ.thongKe?.soHelper).toBe(1);
    const issue = KQ.issues.filter((i) => i.code === 'SCRIPT_CACH_LY');
    expect(issue).toHaveLength(1);
    // `quarantine` KHÔNG phải `error`: nó không chặn nhập, và đó là cái giá đã biết.
    expect(issue[0]?.severity).toBe('quarantine');
  });

  it('dựng đúng adapter cot_cleanup và không dựng adapter nào khác', () => {
    expect((ROW?.scriptAdapters ?? []).map((a) => a.kind)).toEqual(['cot_cleanup']);
    expect(ROW?.scriptAdapters[0]?.batONguon).toBe(true);
  });
});

// ─────────────────────────────────────────── tham số

describe('tham số sinh (62.4)', () => {
  const bang = (
    ds: readonly { truong: string; raw: unknown; dung: unknown; trangThai: string }[],
    t: string,
  ) => ds.find((x) => x.truong === t);

  it('khai đúng 2.000.000 context và 65.000 output ở nguồn', () => {
    expect(ROW?.pack.generation?.maxContext).toBe(2_000_000);
    expect(ROW?.pack.generation?.maxOutputTokens).toBe(65_000);
  });

  it('model 2M/65k giữ nguyên cả hai con số', () => {
    const { params, bang: b } = chuanHoaThamSo(ROW?.pack.generation, PROFILE_GEMINI);
    expect(params.contextLimit).toBe(2_000_000);
    expect(params.maxOutputTokens).toBe(65_000);
    expect(bang(b, 'contextLimit')?.trangThai).toBe('giu_nguyen');
    expect(bang(b, 'maxOutputTokens')?.trangThai).toBe('giu_nguyen');
  });

  it('model trần thấp hơn thì bị kẹp CÓ GHI VÀO BẢNG DIFF, không im lặng', () => {
    const { params, bang: b } = chuanHoaThamSo(ROW?.pack.generation, PROFILE_CLAUDE);
    expect(params.maxOutputTokens).toBe(64_000);
    expect(bang(b, 'maxOutputTokens')?.trangThai).toBe('bi_gioi_han');
    expect(bang(b, 'maxOutputTokens')?.raw).toBe(65_000);
    // temperature 0.9 nằm dưới trần 1 của Claude nên KHÔNG bị kẹp.
    expect(params.temperature).toBe(0.9);
    expect(bang(b, 'temperature')?.trangThai).toBe('giu_nguyen');
  });

  it('không khai seed và không khai verbosity — hai chỗ ba preset tham khảo đều mất giá trị', () => {
    expect(ROW?.pack.generation?.seed).toBeUndefined();
    expect(ROW?.pack.generation?.verbosity).toBeUndefined();
    expect(ROW?.pack.generation?.reasoningEffort).toBe('high');
  });

  it('chỉ một khóa mức gốc không thuộc API', () => {
    expect(Object.keys(ROW?.pack.generation?.unknown ?? {})).toEqual(['max_context_unlocked']);
  });
});

// ─────────────────────────────────────────── kích hoạt

describe('kích hoạt (65.4)', () => {
  const idBat = (ROW?.pack.modules ?? []).filter((m) => m.enabled).map((m) => m.id);

  it('lint trước khi bật PASS, và không cảnh báo xung đột chưa giải', () => {
    const lint = lintTruocKhiBat(ROW!, { selectedModuleIds: idBat, conflictResolutions: {} });
    expect(lint.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(lint.issues.filter((i) => i.code === 'XUNG_DOT_CHUA_GIAI')).toEqual([]);
    expect(lint.dat).toBe(true);
  });

  it('bật được cho một nhánh mà không cần giải xung đột thủ công', () => {
    const kq = kichHoat({
      row: ROW!,
      saveId: 'save.thu',
      branchId: 'nhanh.thu',
      targets: ['narrator'],
      selectedModuleIds: idBat,
      conflictResolutions: {},
      activatedAt: 12,
      previousActivationId: null,
    });
    expect(kq.ok).toBe(true);
  });
});

// ─────────────────────────────────────────── đường chơi thật

describe('đường chơi thật — bienSoanLuot với pack đang bật', () => {
  const idBat = (ROW?.pack.modules ?? []).filter((m) => m.enabled).map((m) => m.id);
  const act = kichHoat({
    row: ROW!,
    saveId: 'save.thu',
    branchId: 'nhanh.thu',
    targets: ['narrator'],
    selectedModuleIds: idBat,
    conflictResolutions: {},
    activatedAt: 12,
    previousActivationId: null,
  });

  const nguLieu: NguLieuKe = {
    view: viewGia(),
    banTin: null,
    loiCau: [],
    canhGanDay: [{ loai: 'ket_qua', noiDung: 'Con nước rút sớm hơn mọi năm.' }],
    cauNguoiChoi: 'Ta gọi mưa về phía đông.',
    ketQuaEngine: ['Mưa đến sau ba ngày, lệch về phía nam.'],
    tenNguoiChoi: 'Người Thử Đường',
    tyLeToken: 2.6,
    // Có chunk truy hồi thì tầng 5 không rỗng, nên marker `worldInfoBefore` nhận
    // được nội dung native — đây chính là điều 63.4 tồn tại để làm.
    chunkTruyHoi: [{ nguon: 'sách cũ', text: 'Khúc cạn từng có một cây cầu.', daBopMeo: false }],
  };

  const hopNhat = bienSoanLuot({
    nguLieu,
    scene: sceneGia(),
    packs: [{ row: ROW!, activation: act.ok ? act.activation : null }],
    params: NormalizedGenParamsSchema.parse({}),
    nganSachToken: 150_000,
    tenPersona: 'Người Thử Đường',
    moTaPersona: 'một kẻ lạ đi ngang',
    hoTroPrefill: true,
  });

  it('pack thật sự góp mặt vào prompt gửi đi', () => {
    expect(hopNhat.packDaDung).toEqual([ROW!.packId]);
    expect(hopNhat.prompt.heThong).toContain('ĐIỀU LỆ SÁNG THẾ');
    expect(hopNhat.prompt.heThong).toContain('[THẦN: DẤU VẾT]');
    expect(hopNhat.prompt.heThong).toContain('[TIẾT CHẾ]');
  });

  it('lõi native và hợp đồng engine vẫn nguyên', () => {
    expect(hopNhat.prompt.heThong).toContain('Engine giữ sổ');
    expect(hopNhat.prompt.nguoiDung).toContain('<CapNhat>');
    expect(hopNhat.prompt.nguoiDung).toContain('Mưa đến sau ba ngày');
  });

  it('mồi trả lời mở sẵn khối tư duy', () => {
    expect(hopNhat.prompt.moiTraLoi).toContain('<thinking>');
  });

  it('macro đã giải hết và không module nào bị bỏ ngoài dự tính', () => {
    expect(hopNhat.macroChuaGiai).toEqual([]);
    const ngoaiDuKien = Object.entries(hopNhat.lyDoBiBo).filter(([, ly]) => ly !== 'tat_trong_preset');
    expect(ngoaiDuKien).toEqual([]);
  });

  it('năm marker đang bật đều nhận nội dung native — không marker nào rỗng', () => {
    expect(Object.values(hopNhat.lyDoBiBo).filter((l) => l === 'rong')).toEqual([]);
    // Chunk truy hồi đi vào đúng ô `worldInfoBefore` mà preset khai.
    expect(hopNhat.prompt.heThong).toContain('Khúc cạn từng có một cây cầu.');
    expect(hopNhat.prompt.heThong).toContain('một kẻ lạ đi ngang');
    expect(hopNhat.prompt.heThong).toContain('Con nước rút sớm hơn mọi năm.');
  });

  it('macro biến đã in ra giá trị thật, không để lại nguyên văn {{getvar}}', () => {
    expect(hopNhat.prompt.heThong).not.toContain('{{getvar');
    expect(hopNhat.prompt.heThong).not.toContain('{{setvar');
    expect(hopNhat.prompt.heThong).toContain('nhếch mép');
    // `addvar` của mục VII nối chuỗi vào bảng từ cấm của mục IV — ngữ nghĩa ST,
    // không ép về số. Cả hai nửa phải có mặt ở chặng lọc.
    expect(hopNhat.prompt.heThong).toContain('chết lặng');
    expect(hopNhat.prompt.heThong).toContain('Tiếng Việt');
    expect(hopNhat.prompt.heThong).toContain('1400–2400 từ');
  });

  it('tắt pack thì prompt native quay lại nguyên vẹn', () => {
    const native = bienSoanLuot({
      nguLieu,
      scene: sceneGia(),
      packs: [],
      params: NormalizedGenParamsSchema.parse({}),
      nganSachToken: 150_000,
    });
    expect(native.compiled).toBeNull();
    expect(native.prompt.heThong).not.toContain('ĐIỀU LỆ SÁNG THẾ');
    expect(native.prompt.heThong).toContain('Engine giữ sổ');
  });

  it('module tắt sẵn KHÔNG vào prompt, và nội dung native của marker tắt không mất', () => {
    const pack = apActivation(ROW!, act.ok ? act.activation : null);
    const tat = pack.modules.filter((m) => !m.enabled).map((m) => m.sourceIdentifier);
    expect(tat.sort()).toEqual([
      'charPersonality',
      'dialogueExamples',
      'td-bien-nien-nen',
      'td-cong-nguoi-lon',
      'worldInfoAfter',
    ]);
    expect(hopNhat.prompt.heThong).not.toContain('[CỔNG NỘI DUNG]');
  });
});
