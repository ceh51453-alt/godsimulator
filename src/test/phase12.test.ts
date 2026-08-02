/**
 * Cổng Phase 12 — hardening và phát hành.
 *
 * ── Nguyên tắc của file này ──
 *
 * Mọi bài ở đây đều **fuzz hoặc quét mã nguồn**, không có bài nào kiểm một hành
 * vi hạnh phúc. Lý do: mười một phase trước đã kiểm rất kỹ chuyện gì xảy ra khi
 * mọi thứ đúng. Thứ chưa ai kiểm là chuyện gì xảy ra khi đầu vào là rác — và
 * đầu vào ở dự án này *luôn* có thể là rác, vì nó nhận file preset của người
 * lạ, phản hồi model không kiểm soát được, và save từ máy khác.
 *
 * Fuzz ở đây **deterministic**: `taoRng` với seed cố định. Một bài fuzz đổi kết
 * quả mỗi lần chạy là một bài không ai sửa được khi nó đỏ.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { taoRng } from '../core/engine/rng.js';
import type { Rng } from '../core/engine/rng.js';
import { veSinh, veSinhNhanh, coVet, moTaVet, TRAN_HIEN_THI } from '../core/anToan/veSinh.js';
import { bocTach } from '../core/ai/bocTach.js';
import { nhapSave } from '../db/save.js';
import { nhapLorebook, doDinhDangLore } from '../core/lore/nhap.js';
import { quetAnToan, locKhoaNguyHiem } from '../core/preset/anToan.js';
import { doCauHinhRerank } from '../core/schema/rerank.js';
import { AiConfigSchema, cheMatKhau, congCoMo } from '../core/ai/cauHinh.js';
import { danhGiaCong, MACH_MOI, machSauKhiHong } from '../core/ai/cong.js';
import { quetRoRi, KHOA_CAM_RA_NGOAI } from '../core/privacy/matrix.js';
import { stripSecret, KHOA_SECRET, SaveExportSchema } from '../core/contracts/branch.js';
import { chuanHoaBanGhiMoi } from '../core/ai/chuanHoaBanGhi.js';
import { moTheGioiTrong, KhoiTaoWorldSchema } from '../core/world/khoiTao.js';
import { taoState, taoEventLog, hashState } from '../core/engine/state.js';
import { apDungChuoi, apDungEvent } from '../core/engine/transaction.js';
import { motTick } from '../core/engine/tick.js';
import { chayTienTrinhNen } from '../core/world/process/scheduler.js';
import { TUNING_MAC_DINH } from '../core/tuning/schema.js';
import { chieu } from '../core/project/chieu.js';
import { bienSoanPromptKe } from '../core/ai/bienSoan.js';
import { chayInvariantToanBo } from '../core/engine/invariant.js';
import { napBatBienTheGioiSong } from '../core/world/batBien.js';
import { napBatBienTangThan } from '../core/world/batBienThan.js';
import { napBatBienTangPham } from '../core/world/batBienPham.js';
import { napBatBienTangTruyen } from '../core/world/batBienTruyen.js';
import { napBatBienPhase10 } from '../core/world/batBienP10.js';

napBatBienTheGioiSong();
napBatBienTangThan();
napBatBienTangPham();
napBatBienTangTruyen();
napBatBienPhase10();

// ─────────────────────────────────────────── bộ sinh rác deterministic

const CHU = 'aáàâeéèiíìoóòôuúùyýAÁ0123456789 \t\n{}[]<>"\\\'/:;,.=+-_*&^%$#@!?|~`()';
/**
 * Ký tự độc: đảo chiều văn bản, vô hình, điều khiển, thay thế, và một cặp
 * surrogate lẻ. Cái cuối là thứ hay làm `JSON.stringify` hoặc `TextEncoder` nổ
 * ở đúng chỗ không ai ngờ.
 */
const CHU_DOC = [
  '\u202E', // RLO — đảo chiều hiển thị
  '\u200B', // zero-width space
  '\u0000', // NUL
  '\u001B', // ESC
  '\uFFFD', // ký tự thay thế
  '\uD800', // surrogate lẻ
  '\u00AD', // soft hyphen
  '\u2066', // LRI
];

/**
 * Hai mẫu KHẲNG ĐỊNH, viết lại độc lập với `veSinh.ts` có chủ ý.
 *
 * Một bài test dùng lại chính hằng số của module đang kiểm thì nó chỉ chứng
 * minh module nhất quán với chính nó — một lỗi đánh máy trong dải ký tự sẽ đi
 * qua cả hai chỗ mà không ai thấy. Đây là bản đối chứng.
 */
const KY_TU_CAM = new RegExp('[\\u202A-\\u202E\\u2066-\\u2069\\u200B-\\u200D\\uFEFF]');
// eslint-disable-next-line no-control-regex -- đây CHÍNH LÀ thứ cần khớp
const DIEU_KHIEN_CAM = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]');

function chuoiRac(rng: Rng, dai: number): string {
  let s = '';
  for (let i = 0; i < dai; i++) {
    if (rng.d100() <= 12) {
      s += CHU_DOC[rng.nguyen(CHU_DOC.length)] as string;
      continue;
    }
    s += CHU[rng.nguyen(CHU.length)] as string;
  }
  return s;
}

/** Một giá trị JSON bất kỳ, sâu tối đa `sau` tầng. */
function giaTriRac(rng: Rng, sau = 3): unknown {
  const loai = rng.nguyen(sau <= 0 ? 6 : 8);
  switch (loai) {
    case 0:
      return null;
    case 1:
      return rng.co(0.5);
    case 2:
      return rng.khoang(-1e9, 1e9);
    case 3:
      return chuoiRac(rng, rng.nguyen(40));
    case 4:
      return rng.nguyen(2) === 0 ? Number.NaN : Number.POSITIVE_INFINITY;
    case 5:
      return '';
    case 6: {
      const n = rng.nguyen(4);
      const ra: unknown[] = [];
      for (let i = 0; i < n; i++) ra.push(giaTriRac(rng, sau - 1));
      return ra;
    }
    default: {
      const n = rng.nguyen(5);
      const ra: Record<string, unknown> = {};
      for (let i = 0; i < n; i++) {
        // Cố ý rải cả khóa nguy hiểm — 64.4 bắt phải TỪ CHỐI node, không "làm sạch".
        const khoa =
          rng.d100() <= 15
            ? (['__proto__', 'constructor', 'prototype'][rng.nguyen(3)] as string)
            : chuoiRac(rng, 1 + rng.nguyen(8));
        ra[khoa] = giaTriRac(rng, sau - 1);
      }
      return ra;
    }
  }
}

// ─────────────────────────────────────────── 1. sanitizer

describe('[BB] Phase 12 — bộ vệ sinh văn bản', () => {
  it('xóa ký tự đảo chiều văn bản (Trojan Source) và đếm được số đã xóa', () => {
    const kq = veSinh('Người ta gọi hắn là ‮Kẻ Không Tên‬.');
    expect(kq.text).not.toMatch(/[‪-‮]/);
    expect(kq.vet.soBiDoiChieu).toBe(2);
    expect(coVet(kq.vet)).toBe(true);
    expect(moTaVet(kq.vet)).toContain('đảo chiều');
  });

  it('xóa ký tự vô hình — hai chuỗi trông giống nhau thì bằng nhau sau khi lọc', () => {
    const a = veSinhNhanh('deity​_1');
    const b = veSinhNhanh('deity_1');
    expect(a).toBe(b);
  });

  it('giữ nguyên tab và xuống dòng — chúng là nội dung, không phải rác', () => {
    expect(veSinhNhanh('một\tdòng\nhai dòng')).toBe('một\tdòng\nhai dòng');
  });

  it('chuẩn hóa CRLF về LF', () => {
    expect(veSinhNhanh('a\r\nb\rc')).toBe('a\nb\nc');
  });

  it('cắt chuỗi vượt trần và NÓI là đã cắt', () => {
    const kq = veSinh('x'.repeat(TRAN_HIEN_THI + 500));
    expect(kq.vet.daCat).toBe(true);
    expect(kq.text.length).toBeLessThan(TRAN_HIEN_THI + 80);
    expect(kq.text).toContain('đã cắt');
  });

  it('fuzz 2.000 chuỗi rác: không throw, và không sót ký tự cấm nào', () => {
    const rng = taoRng('fuzz#vesinh');
    for (let i = 0; i < 2_000; i++) {
      const kq = veSinh(chuoiRac(rng, rng.nguyen(120)));
      expect(kq.text).not.toMatch(KY_TU_CAM);
      expect(kq.text).not.toMatch(DIEU_KHIEN_CAM);
    }
  });

  it('nhận cả đầu vào không phải chuỗi mà không nổ', () => {
    for (const x of [null, undefined, 0, [], {}, Number.NaN]) {
      expect(() => veSinh(x)).not.toThrow();
    }
  });
});

// ─────────────────────────────────────────── 2. fuzz các cửa nhận dữ liệu lạ

describe('[BB] Phase 12 — file độc hại không có side effect', () => {
  it('fuzz 800 phản hồi model: bocTach không throw và không bao giờ vượt trần patch', () => {
    const rng = taoRng('fuzz#boctach');
    const idHopLe = new Set(['deity_1', 'mortal_1', 'place_a']);
    for (let i = 0; i < 800; i++) {
      const than = rng.co(0.5) ? JSON.stringify(giaTriRac(rng)) : chuoiRac(rng, rng.nguyen(200));
      const raw = `Một đoạn văn.\n<CapNhat>${than}</CapNhat>`;
      const kq = bocTach(raw, { eventId: 'ev_fuzz', idHopLe });
      expect(kq.patches.length).toBeLessThanOrEqual(12);
      for (const p of kq.patches) {
        expect(['entities', 'links', 'gaps', 'prayers']).toContain(p.target.table);
        expect(p.sourceEventId).toBe('ev_fuzz');
      }
    }
  });

  it('fuzz 500 gói save: nhapSave luôn trả kết quả có cấu trúc, không throw', () => {
    const rng = taoRng('fuzz#save');
    for (let i = 0; i < 500; i++) {
      const r = nhapSave(giaTriRac(rng, 4));
      expect(typeof r.ok).toBe('boolean');
      if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
    }
  });

  it('fuzz 500 lorebook: nhapLorebook luôn trả issue thay vì nổ', () => {
    const rng = taoRng('fuzz#lore');
    for (let i = 0; i < 500; i++) {
      const goc = giaTriRac(rng, 4);
      expect(() => doDinhDangLore(goc)).not.toThrow();
      const kq = nhapLorebook({ goc, id: `lb_${i}`, ten: 'thử', nguon: 'nguoi_dung' });
      if (!kq.ok) expect(kq.issues.length).toBeGreaterThan(0);
      else expect(kq.lorebook).not.toBeNull();
    }
  });

  it('fuzz 400 gói preset: quét an toàn không throw, khóa nguy hiểm bị loại', () => {
    const rng = taoRng('fuzz#preset');
    for (let i = 0; i < 400; i++) {
      const goc = giaTriRac(rng, 4);
      expect(() => quetAnToan(goc)).not.toThrow();
      const sach = locKhoaNguyHiem(goc);
      const chuoi = JSON.stringify(sach) ?? '';
      expect(chuoi).not.toContain('"__proto__"');
      expect(chuoi).not.toContain('"constructor"');
      expect(chuoi).not.toContain('"prototype"');
    }
  });

  it('[BB] 64.4 — khóa nguy hiểm KHÔNG làm bẩn Object.prototype', () => {
    const doc = JSON.parse('{"__proto__":{"biNhiem":true},"a":1}') as unknown;
    locKhoaNguyHiem(doc);
    quetAnToan(doc);
    expect(({} as Record<string, unknown>)['biNhiem']).toBeUndefined();
  });

  it('fuzz 400 cấu hình rerank: luôn về heuristic an toàn, không throw', () => {
    const rng = taoRng('fuzz#rerank');
    for (let i = 0; i < 400; i++) {
      const kq = doCauHinhRerank(giaTriRac(rng, 3) as never);
      expect(typeof kq.config.bat).toBe('boolean');
      expect(kq.config.timeoutMs).toBeGreaterThan(0);
    }
  });

  it('fuzz 400 cấu hình AI: parse hỏng thì cổng ĐÓNG, không bao giờ mở nhầm', () => {
    const rng = taoRng('fuzz#aicfg');
    for (let i = 0; i < 400; i++) {
      const r = AiConfigSchema.safeParse(giaTriRac(rng, 3));
      if (!r.success) continue;
      // Một cấu hình rác parse được thì nó phải THIẾU thứ gì đó để chơi.
      const mo = congCoMo(r.data);
      if (mo) {
        expect(r.data.narrator.proxyUrl).toMatch(/^https?:\/\//i);
        expect(r.data.narrator.modelId.trim()).not.toBe('');
        expect(r.data.narrator.probe.thong).toBe(true);
      }
    }
  });
});

// ─────────────────────────────────────────── 2b. model không làm treo được engine

describe('[BB] Phase 12 — bản ghi model tạo phải ĐỦ trước khi vào thế giới', () => {
  /**
   * Bài này canh một lỗi thật, tìm được ở E2E: một aspect thiếu trường làm bất
   * biến nổ `TypeError` thay vì trả về vi phạm có cấu trúc — tức là **Narrator
   * làm treo được engine**.
   */
  it('aspect thiếu trường được điền theo `.prefault()`, không được để undefined', () => {
    const r = chuanHoaBanGhiMoi(
      'entities',
      {
        id: 'mortal_x',
        kind: 'mortal',
        ten: 'Người Thiếu',
        tickSinh: 0,
        aspects: { mortal: { tuoiTho: 60 }, soul: { tang: 't2' } },
      },
      'br_test',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const e = r.value as { branchId: string; aspects: Record<string, Record<string, unknown>> };
    expect(e.branchId).toBe('br_test');
    // `thanThe` là trường mà `batBienPham` chạm vào — nó phải có thật.
    expect(e.aspects['mortal']?.['thanThe']).toBeDefined();
  });

  it('domain thiếu `doiThuIds`/`neoTaiChiem` cũng được điền — bất biến tầng Thần chạm vào chúng', () => {
    const r = chuanHoaBanGhiMoi(
      'entities',
      {
        id: 'deity_x',
        kind: 'deity',
        ten: 'Thần Thiếu',
        tickSinh: 0,
        aspects: { domain: { domains: [{ ten: 'tay_ue', suc: 40 }] } },
      },
      'br_test',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // `trangThaiSuyRa()` đọc `doiThuIds` và `neoTaiChiem` trên TỪNG domain,
    // không trên aspect — và đó chính là chỗ nó nổ khi thiếu.
    const d = (r.value as { aspects: Record<string, { domains: Record<string, unknown>[] }> }).aspects[
      'domain'
    ];
    expect(Array.isArray(d?.domains[0]?.['doiThuIds'])).toBe(true);
    expect(Array.isArray(d?.domains[0]?.['neoTaiChiem'])).toBe(true);
  });

  it('aspect engine không biết tên bị BỎ kèm lý do, không giữ làm dữ liệu tự do', () => {
    const r = chuanHoaBanGhiMoi(
      'entities',
      { id: 'x', kind: 'concept', ten: 'X', tickSinh: 0, aspects: { mat_troi_bi_an: { x: 1 } } },
      'br_test',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.value as { aspects: Record<string, unknown> }).aspects['mat_troi_bi_an']).toBeUndefined();
    expect(r.canhBao.join(' ')).toContain('mat_troi_bi_an');
  });

  it('fuzz 600 bản ghi rác: hoặc từ chối có lý do, hoặc trả bản ghi ĐỦ', () => {
    const rng = taoRng('fuzz#chuanhoa');
    for (let i = 0; i < 600; i++) {
      for (const bang of ['entities', 'links', 'gaps', 'prayers']) {
        const r = chuanHoaBanGhiMoi(bang, giaTriRac(rng, 3), 'br_test');
        if (r.ok) {
          expect(r.value).not.toBeNull();
          expect((r.value as { branchId: string }).branchId).toBe('br_test');
        } else {
          expect(r.vi.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('`bocTach` ép nhánh: model không tự chọn được dòng thời gian', () => {
    const raw = `Văn.
<CapNhat>{"patches":[{"op":"link","target":{"table":"entities","id":"e1","path":""},"value":{
  "id":"e1","branchId":"br_cua_ke_khac","kind":"concept","ten":"Lạ","tickSinh":0,"aspects":{}}}]}</CapNhat>`;
    const kq = bocTach(raw, { eventId: 'ev', idHopLe: new Set(), branchId: 'br_that' });
    expect(kq.patches.length).toBe(1);
    expect((kq.patches[0]?.value as { branchId: string }).branchId).toBe('br_that');
  });
});

// ─────────────────────────────────────────── 2c. gói export phải đủ bảng

describe('[BB] Phase 12 — gói save không được bỏ sót bảng nào của WorldState', () => {
  /**
   * Cổng cấu trúc, không phải cổng ví dụ.
   *
   * Lỗi thật đã xảy ra đúng theo kịch bản này: Phase 5 – 10 thêm mười Map vào
   * `WorldState` và không phase nào mở rộng `SaveExportSchema`. Round-trip vẫn
   * xanh bốn phase liền vì fixture để mười Map ấy rỗng. So DANH SÁCH KHÓA thì
   * lần thêm Map thứ mười một sẽ đỏ ngay, kể cả khi chưa ai viết fixture cho nó.
   */
  it('mọi Map trong WorldState đều có một trường tương ứng trong gói export', () => {
    const s = taoState(
      moTheGioiTrong(KhoiTaoWorldSchema.parse({ seed: 'x', worldId: 'w', branchId: 'b' })).world,
    );
    const mapTrongState = Object.entries(s)
      .filter(([, v]) => v instanceof Map)
      .map(([k]) => k)
      .sort();

    const truongExport = new Set(Object.keys(SaveExportSchema.shape));
    const thieu = mapTrongState.filter((k) => !truongExport.has(k));
    expect(thieu).toEqual([]);
  });
});

// ─────────────────────────────────────────── 3. riêng tư

describe('[BB] Phase 12 — audit riêng tư', () => {
  it('mật khẩu proxy không bao giờ ra khỏi máy: strip theo TÊN KHÓA, mọi độ sâu', () => {
    const rng = taoRng('fuzz#secret');
    for (let i = 0; i < 300; i++) {
      const goc = giaTriRac(rng, 4) as Record<string, unknown>;
      const boc = { a: { b: { proxyPassword: 'bimat', apiKey: 'k', sau: goc } } };
      const sach = JSON.stringify(stripSecret(boc)) ?? '';
      expect(sach).not.toContain('bimat');
      for (const k of KHOA_SECRET) expect(sach.toLowerCase()).not.toContain(`"${k.toLowerCase()}"`);
    }
  });

  it('cheMatKhau che cả bốn điểm cuối, kể cả endpoint rerank', () => {
    const cfg = AiConfigSchema.parse({
      narrator: { proxyPassword: 'a1' },
      updater: { proxyPassword: 'b2' },
      workflow: { proxyPassword: 'c3' },
      rerank: { endpoint: { proxyPassword: 'd4' } },
    });
    const che = JSON.stringify(cheMatKhau(cfg));
    for (const m of ['a1', 'b2', 'c3', 'd4']) expect(che).not.toContain(m);
  });

  it('prompt gửi model không chứa trường riêng tư nào', () => {
    const ct = KhoiTaoWorldSchema.parse({ seed: 'p12', worldId: 'w', branchId: 'b' });
    const { world, events } = moTheGioiTrong(ct);
    const s = taoState(world);
    apDungChuoi(s, events, taoEventLog());
    const view = chieu(s, 'sang_the', null);
    const p = bienSoanPromptKe({
      view,
      banTin: null,
      loiCau: [],
      canhGanDay: [],
      cauNguoiChoi: '',
      ketQuaEngine: [],
      tenNguoiChoi: 'Người Chơi',
      tyLeToken: 3.2,
    });
    const toanBo = `${p.heThong}\n${p.nguoiDung}`;
    for (const k of KHOA_CAM_RA_NGOAI) expect(toanBo).not.toContain(k);
    expect(quetRoRi({ prompt: toanBo }, 'prompt')).toEqual([]);
  });
});

// ─────────────────────────────────────────── 4. ngắt mạch và cổng AI

describe('[BB] Phase 12 — soak ngắt mạch', () => {
  it('ba lần hỏng liên tiếp đóng cổng chơi, và một cấu hình đủ vẫn không cứu được', () => {
    const cfg = AiConfigSchema.parse({
      narrator: {
        proxyUrl: 'https://x.example/v1',
        modelId: 'm',
        probe: { daDo: true, thong: true, modelDaTraLoi: 'm', soKyTuTraVe: 5 },
      },
    });
    expect(danhGiaCong({ cfg, dangDo: false, mach: MACH_MOI }).choPhepChoi).toBe(true);

    let mach = MACH_MOI;
    for (let i = 0; i < 3; i++) mach = machSauKhiHong(mach, 'TIMEOUT', 'quá hạn');
    expect(danhGiaCong({ cfg, dangDo: false, mach }).choPhepChoi).toBe(false);
  });

  it('soak 200 lần hỏng: trạng thái mạch không tràn số và không tự mở lại', () => {
    let mach = MACH_MOI;
    for (let i = 0; i < 200; i++) mach = machSauKhiHong(mach, 'HTTP_500', 'proxy chết');
    expect(Number.isFinite(mach.hongLienTiep)).toBe(true);
    expect(mach.hongLienTiep).toBe(200);
    expect(mach.tongHong).toBe(200);
    expect(mach.moMach).toBe(true);
  });

  it('[BB] ADR-0056 — không còn chế độ chạy bằng engine khi model tắt', () => {
    const cfg = AiConfigSchema.parse({ updater: { cheDoKhiTat: 'chi_engine' } });
    // Giá trị cũ vẫn ĐỌC được (save cũ không hỏng), nhưng nó bị kéo về giá trị
    // duy nhất còn lại — không có đường nào chọn lại "chỉ engine".
    expect(cfg.updater.cheDoKhiTat).toBe('gop_vao_narrator');
  });
});

// ─────────────────────────────────────────── 5. thế giới rỗng (ADR-0055)

describe('[BB] ADR-0055 — đường chơi mở ra hư vô', () => {
  const ct = KhoiTaoWorldSchema.parse({ seed: 'p12#huvo', worldId: 'w', branchId: 'b' });

  it('nhịp 0 có đúng 0 entity, 0 luật, 0 khái niệm', () => {
    const { world, events } = moTheGioiTrong(ct);
    const s = taoState(world);
    const r = apDungChuoi(s, events, taoEventLog());
    expect(r.ok).toBe(true);
    expect(s.entities.size).toBe(0);
    expect(s.links.size).toBe(0);
    const view = chieu(s, 'sang_the', null);
    expect(view.laws.length).toBe(0);
    expect(view.concepts.length).toBe(0);
  });

  it('câu người chơi được GIỮ trong log, nên nó sống qua replay', () => {
    const cta = KhoiTaoWorldSchema.parse({ ...ct, cua: 'mot_cau', motCau: 'Máu đã đổ thì không rửa được.' });
    const { events } = moTheGioiTrong(cta);
    expect(events[0]?.payload['motCau']).toBe('Máu đã đổ thì không rửa được.');
  });

  it('prompt nói thẳng thế giới đang là hư vô, thay vì đưa model một trang trống', () => {
    const { world, events } = moTheGioiTrong(ct);
    const s = taoState(world);
    apDungChuoi(s, events, taoEventLog());
    const p = bienSoanPromptKe({
      view: chieu(s, 'sang_the', null),
      banTin: null,
      loiCau: [],
      canhGanDay: [],
      cauNguoiChoi: '',
      ketQuaEngine: [],
      tenNguoiChoi: 'Người Chơi',
      tyLeToken: 3.2,
    });
    expect(p.heThong).toContain('HƯ VÔ');
    expect(p.heThong).toContain('<CapNhat>');
  });

  it('thế giới rỗng chạy 200 nhịp không crash và invariant vẫn sạch', () => {
    const { world, events } = moTheGioiTrong(ct);
    const s = taoState(world);
    const log = taoEventLog();
    apDungChuoi(s, events, log);
    for (let i = 0; i < 200; i++) {
      const r = motTick(s, { tuning: TUNING_MAC_DINH, tienTrinhNen: chayTienTrinhNen });
      for (const ev of r.events) expect(apDungEvent(s, ev, log).ok).toBe(true);
    }
    expect(chayInvariantToanBo(s).dat).toBe(true);
  });

  it('hư vô vẫn deterministic: cùng seed cho cùng hash sau 200 nhịp', () => {
    const chay = (): string => {
      const { world, events } = moTheGioiTrong(ct);
      const s = taoState(world);
      const log = taoEventLog();
      apDungChuoi(s, events, log);
      for (let i = 0; i < 200; i++) {
        const r = motTick(s, { tuning: TUNING_MAC_DINH, tienTrinhNen: chayTienTrinhNen });
        for (const ev of r.events) apDungEvent(s, ev, log);
      }
      return hashState(s);
    };
    expect(chay()).toBe(chay());
  });
});

// ─────────────────────────────────────────── 6. quét mã nguồn

const GOC = join(process.cwd(), 'src');

function liet(thuMuc: string, loc: (p: string) => boolean): string[] {
  const out: string[] = [];
  const di = (d: string): void => {
    for (const ten of readdirSync(d)) {
      const p = join(d, ten);
      if (statSync(p).isDirectory()) {
        di(p);
        continue;
      }
      if (loc(p)) out.push(p);
    }
  };
  di(thuMuc);
  return out;
}

const laNguon = (p: string): boolean =>
  (p.endsWith('.ts') || p.endsWith('.tsx')) && !p.endsWith('.test.ts') && !p.endsWith('.test.tsx');

const ten = (p: string): string => relative(process.cwd(), p).split(sep).join('/');
const TAT_CA_NGUON = liet(GOC, laNguon);

describe('[BB] Phase 12 — cổng quét mã nguồn', () => {
  /**
   * Khớp dạng DÙNG (`prop={...}` hoặc `prop: ...`), không khớp chữ trần: nhắc
   * tên nó trong một chú thích giải thích vì sao không dùng nó là điều tốt, và
   * một cổng bắt cả chú thích sẽ dạy người ta bỏ chú thích thay vì bỏ thói quen.
   */
  it('không chỗ nào DÙNG dangerouslySetInnerHTML', () => {
    const pham = TAT_CA_NGUON.filter((p) => /dangerouslySetInnerHTML\s*[=:]/.test(readFileSync(p, 'utf8')));
    expect(pham.map(ten)).toEqual([]);
  });

  it('không TODO / FIXME / HACK nào trong đường chơi chính', () => {
    const DUONG_CHOI = TAT_CA_NGUON.filter((p) => {
      const t = ten(p);
      return t.startsWith('src/core/') || t.startsWith('src/store/') || t.startsWith('src/ui/');
    });
    const pham = DUONG_CHOI.filter((p) => /\b(TODO|FIXME|HACK|XXX)\b/.test(readFileSync(p, 'utf8')));
    expect(pham.map(ten)).toEqual([]);
  });

  it('[BB] ADR-0055 — store và ui KHÔNG được nhập hạt giống fixture', () => {
    const pham: string[] = [];
    for (const p of TAT_CA_NGUON) {
      const t = ten(p);
      if (!t.startsWith('src/store/') && !t.startsWith('src/ui/')) continue;
      const src = readFileSync(p, 'utf8');
      if (/\b(moThuGioi|eventGieoTheGioi)\b/.test(src)) pham.push(t);
    }
    expect(pham).toEqual([]);
  });

  it('CSP có mặt trong index.html và cấm script ngoài', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain("default-src 'self'");
    expect(html).toContain("object-src 'none'");
    expect(html).not.toContain('unsafe-eval');
  });

  it('không file nào ghi log mật khẩu bằng console', () => {
    const pham = TAT_CA_NGUON.filter((p) =>
      /console\.\w+\([^)]*(proxyPassword|apiKey|password)/i.test(readFileSync(p, 'utf8')),
    );
    expect(pham.map(ten)).toEqual([]);
  });
});
