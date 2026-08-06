/**
 * Patch validator và bộ áp patch — Phase 1 [BB].
 *
 * [BB] Luật bất biến #4: mọi thay đổi state đi theo đúng một đường
 *   Command → Intent → ActionPlan/Project → validated Event + Patch
 *          → transaction → WorldState → WorldView → Narrator/UI
 *
 * [BB] Cổng Phase 1: "patch lỗi không để state nửa vời."
 * Vì vậy áp patch LUÔN theo hai pha: validate hết trước, chỉ ghi khi cả lô hợp lệ.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState, TenBang } from './state.js';
import { laTenBang } from './state.js';
import { loi } from '../contracts/errors.js';
import type { KetQua, StructuredError } from '../contracts/errors.js';
import { dat, hong } from '../contracts/errors.js';
import { EntitySchema, LinkSchema, GapSchema, WorldMetricsSchema } from '../schema/entity.js';
import { SCHEMA_ASPECT } from '../schema/aspect/bangSchema.js';
import { KnowledgeRowSchema, DebtRowSchema } from '../schema/soSach.js';
import { PrayerSchema } from '../schema/than.js';
import { StorylineSchema, ForeshadowSchema } from '../schema/truyen.js';
import { SubstrateLawSchema, CoCheRowSchema } from '../vatly/schema.js';
import { LorebookSchema, LoreExpectationSchema, DiBanSchema } from '../lore/schema.js';
import { WorldSchema } from '../contracts/core.js';

const KHOA_CAM = new Set(['__proto__', 'constructor', 'prototype']);

/** Bản ghi mà một patch có thể trỏ tới. */
type BanGhi = Record<string, unknown>;

function layBang(s: WorldState, bang: TenBang): Map<string, BanGhi> | null {
  switch (bang) {
    case 'entities':
      return s.entities as unknown as Map<string, BanGhi>;
    case 'links':
      return s.links as unknown as Map<string, BanGhi>;
    case 'gaps':
      return s.gaps as unknown as Map<string, BanGhi>;
    case 'knowledge':
      return s.knowledge as unknown as Map<string, BanGhi>;
    case 'debts':
      return s.debts as unknown as Map<string, BanGhi>;
    case 'prayers':
      return s.prayers as unknown as Map<string, BanGhi>;
    case 'storylines':
      return s.storylines as unknown as Map<string, BanGhi>;
    case 'foreshadows':
      return s.foreshadows as unknown as Map<string, BanGhi>;
    case 'substrateLaws':
      return s.substrateLaws as unknown as Map<string, BanGhi>;
    case 'coChe':
      return s.coChe as unknown as Map<string, BanGhi>;
    case 'lorebooks':
      return s.lorebooks as unknown as Map<string, BanGhi>;
    case 'loreExpectations':
      return s.loreExpectations as unknown as Map<string, BanGhi>;
    case 'diBan':
      return s.diBan as unknown as Map<string, BanGhi>;
    // 'worlds' và 'metrics' là bản ghi đơn, xử lý riêng.
    default:
      return null;
  }
}

function layBanGhiDon(s: WorldState, bang: TenBang): BanGhi | null {
  if (bang === 'worlds') return s.world as unknown as BanGhi;
  if (bang === 'metrics') return s.metrics as unknown as BanGhi;
  return null;
}

/** Đi tới object cha của `path`, tạo thêm tầng nếu cần. Trả null nếu đường dẫn xấu. */
function toiCha(goc: BanGhi, duongDan: string, taoThieu: boolean): { cha: BanGhi; khoa: string } | null {
  const phan = duongDan.split('.');
  const cuoi = phan.pop();
  if (cuoi === undefined || cuoi === '' || KHOA_CAM.has(cuoi)) return null;

  let hienTai: BanGhi = goc;
  for (const p of phan) {
    if (p === '' || KHOA_CAM.has(p)) return null;
    let ke = hienTai[p];
    if (ke === undefined || ke === null) {
      if (!taoThieu) return null;
      ke = {};
      hienTai[p] = ke;
    }
    if (typeof ke !== 'object') return null;
    hienTai = ke as BanGhi;
  }
  return { cha: hienTai, khoa: cuoi };
}

function docTai(goc: BanGhi, duongDan: string): unknown {
  if (duongDan === '') return goc;
  const t = toiCha(goc, duongDan, false);
  if (!t) return undefined;
  return t.cha[t.khoa];
}

/** Schema xác thực lại bản ghi sau khi sửa — bắt patch làm hỏng hình dạng. */
function schemaCua(bang: TenBang) {
  switch (bang) {
    case 'entities':
      return EntitySchema;
    case 'links':
      return LinkSchema;
    case 'gaps':
      return GapSchema;
    case 'knowledge':
      return KnowledgeRowSchema;
    case 'debts':
      return DebtRowSchema;
    case 'prayers':
      return PrayerSchema;
    case 'storylines':
      return StorylineSchema;
    case 'foreshadows':
      return ForeshadowSchema;
    case 'substrateLaws':
      return SubstrateLawSchema;
    case 'coChe':
      return CoCheRowSchema;
    case 'lorebooks':
      return LorebookSchema;
    case 'loreExpectations':
      return LoreExpectationSchema;
    case 'diBan':
      return DiBanSchema;
    case 'worlds':
      return WorldSchema;
    case 'metrics':
      return WorldMetricsSchema;
  }
}

/**
 * Kiểm từng mặt của thực thể sau khi vá — lỗ hổng `op: 'set'`.
 *
 * `EntitySchema` khai `aspects` là `z.record(z.string(), z.unknown())` vì aspect
 * là tập mở (4.1). Hệ quả: một bản ghi vẫn "hợp lệ" sau khi ai đó đặt
 * `aspects.lawful.tiepDia = "abc"`, và cái sai chỉ nổ ra vài nhịp sau, ở một
 * hàm gọi `.map()` lên một chuỗi — cách xa chỗ gây ra nó đến mức không truy được.
 *
 * Đường `op: 'link'` đã được `chuanHoaBanGhiMoi()` canh từ Phase 12. Đây là
 * đường còn lại.
 *
 * ── Vì sao chỉ CẢNH BÁO bằng lỗi, không tự sửa ──
 *
 * `safeParse` của Zod strip key lạ và điền `.prefault()`, nên ghi `r.data` trở
 * lại sẽ **âm thầm đổi dữ liệu** của một patch do chính engine sinh. Ở đây chỉ
 * đọc kết quả: hợp lệ thì thôi, không hợp lệ thì cả lô bị từ chối và bản ghi cũ
 * còn nguyên — đúng cổng Phase 1 "patch lỗi không để state nửa vời".
 *
 * Aspect không có schema (một mặt do pack ngoài khai, `reality_marble`…) đi qua
 * không bị chạm: engine không biết mặt ấy thì cũng không có tư cách phán nó sai.
 */
function loiAspect(id: string, banGhi: BanGhi): StructuredError[] {
  const aspects = banGhi['aspects'];
  if (aspects === null || typeof aspects !== 'object' || Array.isArray(aspects)) return [];

  const ra: StructuredError[] = [];
  for (const ten of Object.keys(aspects as Record<string, unknown>).sort()) {
    const schema = SCHEMA_ASPECT.get(ten);
    if (schema === undefined) continue;
    const r = schema.safeParse((aspects as Record<string, unknown>)[ten]);
    if (r.success) continue;
    const issues = r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`);
    ra.push(
      loi(
        'patch',
        'ASPECT_HONG_SAU_PATCH',
        // Nêu luôn chỗ sai trong `message`: chẩn đoán của scheduler chỉ mang theo
        // `thongDiep`, nên một message không nói gì sẽ biến lỗi này thành một
        // tiến trình "bị bỏ" không ai truy được nguyên nhân.
        `Mặt "${ten}" của '${id}' không còn hợp lệ sau khi áp patch — ${issues.slice(0, 3).join('; ')}.`,
        { path: `entities/${id}/aspects.${ten}`, details: { issues } },
      ),
    );
  }
  return ra;
}

/**
 * Thông tin hoàn tác chính xác cho MỘT lô patch.
 *
 * Giữ bản gốc của đúng những bản ghi bị chạm, thay vì snapshot cả state.
 * Nhờ vậy rollback là O(số bản ghi bị chạm), không phải O(kích thước thế giới) —
 * điều kiện bắt buộc để chạy 10.000 bước replay trong thời gian hợp lý.
 */
export type ThongTinHoanTac = {
  /** `${bang}|${id}` → bản ghi gốc, hoặc `null` nếu trước đó chưa tồn tại. */
  readonly truoc: ReadonlyMap<string, BanGhi | null>;
};

export type PhamViThayDoi = {
  readonly entities: ReadonlySet<string>;
  readonly links: ReadonlySet<string>;
  readonly gaps: ReadonlySet<string>;
  readonly knowledge: ReadonlySet<string>;
  readonly debts: ReadonlySet<string>;
  readonly prayers: ReadonlySet<string>;
  readonly storylines: ReadonlySet<string>;
  readonly foreshadows: ReadonlySet<string>;
  readonly chamWorld: boolean;
  readonly chamMetrics: boolean;
};

/**
 * Phạm vi rỗng, kèm phần ghi đè.
 *
 * Dựng object này bằng tay ở nơi gọi nghĩa là mỗi lần thêm một bảng thì mọi chỗ
 * gọi đều vỡ — đã xảy ra hai lần (Phase 5 thêm `knowledge`/`debts`, Phase 6 thêm
 * `prayers`). Helper này giữ hình dạng ở đúng một chỗ.
 */
export function phamVi(ghiDe: Partial<PhamViThayDoi> = {}): PhamViThayDoi {
  return {
    entities: new Set(),
    links: new Set(),
    gaps: new Set(),
    knowledge: new Set(),
    debts: new Set(),
    prayers: new Set(),
    storylines: new Set(),
    foreshadows: new Set(),
    chamWorld: false,
    chamMetrics: false,
    ...ghiDe,
  };
}

export type KetQuaApPatch = {
  /** Số bản ghi bị chạm. */
  soBanGhiDoi: number;
  hoanTac: ThongTinHoanTac;
  phamVi: PhamViThayDoi;
  canhBao: readonly StructuredError[];
};

/** Hoàn tác chính xác một lô patch đã áp. */
export function hoanTacPatch(s: WorldState, ht: ThongTinHoanTac): void {
  for (const [khoa, banGhi] of ht.truoc) {
    const [bang, id] = khoa.split('|') as [TenBang, string];
    if (bang === 'worlds') {
      if (banGhi) s.world = banGhi as unknown as WorldState['world'];
      continue;
    }
    if (bang === 'metrics') {
      if (banGhi) s.metrics = banGhi as unknown as WorldState['metrics'];
      continue;
    }
    const bangMap = layBang(s, bang);
    if (!bangMap) continue;
    if (banGhi === null) bangMap.delete(id);
    else bangMap.set(id, banGhi);
  }
}

/**
 * Áp một lô patch theo kiểu tất-cả-hoặc-không.
 *
 * Pha 1 — dựng bản nháp của từng bản ghi bị chạm và áp lên nháp;
 * Pha 2 — validate lại từng bản nháp bằng schema;
 * Pha 3 — chỉ khi mọi thứ sạch mới ghi đè vào state thật.
 *
 * Nhờ vậy patch thứ năm hỏng thì bốn patch trước KHÔNG lưu lại dấu vết.
 */
export function apPatch(s: WorldState, ops: readonly PatchOp[]): KetQua<KetQuaApPatch> {
  const errs: StructuredError[] = [];
  const canhBao: StructuredError[] = [];

  // khóa nháp: `${bang}|${id}`
  const nhap = new Map<string, { bang: TenBang; id: string; banGhi: BanGhi; laDon: boolean }>();
  const xoa = new Set<string>();

  const layNhap = (bang: TenBang, id: string): BanGhi | null => {
    const khoa = `${bang}|${id}`;
    const daCo = nhap.get(khoa);
    if (daCo) return daCo.banGhi;

    const don = layBanGhiDon(s, bang);
    if (don) {
      const ban = structuredClone(don);
      nhap.set(khoa, { bang, id, banGhi: ban, laDon: true });
      return ban;
    }

    const bangMap = layBang(s, bang);
    if (!bangMap) return null;
    const goc = bangMap.get(id);
    if (!goc) return null;
    const ban = structuredClone(goc);
    nhap.set(khoa, { bang, id, banGhi: ban, laDon: false });
    return ban;
  };

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i] as PatchOp;
    const viTri = `patch[${i}]`;

    if (!laTenBang(op.target.table)) {
      errs.push(
        loi('patch', 'BANG_LA', `Bảng không hợp lệ: '${op.target.table}'.`, {
          path: viTri,
          recoverable: false,
        }),
      );
      continue;
    }
    const bang: TenBang = op.target.table;
    const laDon = bang === 'worlds' || bang === 'metrics';
    const id = laDon ? bang : op.target.id;
    const khoaNhap = `${bang}|${id}`;

    // ── 'link' và 'unlink' tạo/gỡ bản ghi, không sửa trường ──
    if (op.op === 'link') {
      const bangMap = layBang(s, bang);
      if (!bangMap) {
        errs.push(loi('patch', 'LINK_BANG_DON', `Không thể 'link' vào bảng đơn '${bang}'.`, { path: viTri }));
        continue;
      }
      if (bangMap.has(id) || nhap.has(khoaNhap)) {
        errs.push(loi('patch', 'LINK_TRUNG', `Bản ghi '${bang}/${id}' đã tồn tại.`, { path: viTri }));
        continue;
      }
      const r = schemaCua(bang).safeParse(op.value);
      if (!r.success) {
        errs.push(
          loi('patch', 'LINK_KHONG_HOP_LE', `Bản ghi mới '${bang}/${id}' không hợp lệ.`, {
            path: viTri,
            details: { issues: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`) },
          }),
        );
        continue;
      }
      nhap.set(khoaNhap, { bang, id, banGhi: r.data as BanGhi, laDon: false });
      xoa.delete(khoaNhap);
      continue;
    }

    if (op.op === 'unlink') {
      const bangMap = layBang(s, bang);
      if (!bangMap) {
        errs.push(loi('patch', 'UNLINK_BANG_DON', `Không thể 'unlink' bảng đơn '${bang}'.`, { path: viTri }));
        continue;
      }
      if (!bangMap.has(id) && !nhap.has(khoaNhap)) {
        errs.push(loi('patch', 'UNLINK_THIEU', `Không có bản ghi '${bang}/${id}' để gỡ.`, { path: viTri }));
        continue;
      }
      nhap.delete(khoaNhap);
      xoa.add(khoaNhap);
      continue;
    }

    // ── các op còn lại sửa trường của một bản ghi đang có ──
    if (xoa.has(khoaNhap)) {
      errs.push(
        loi('patch', 'SUA_BAN_GHI_DA_GO', `Bản ghi '${bang}/${id}' đã bị gỡ trong lô này.`, { path: viTri }),
      );
      continue;
    }

    const banGhi = layNhap(bang, id);
    if (!banGhi) {
      errs.push(loi('patch', 'BAN_GHI_THIEU', `Không tìm thấy '${bang}/${id}'.`, { path: viTri }));
      continue;
    }

    // Optimistic concurrency — Phần 61.3.
    if (op.expectedVersion !== undefined) {
      const hienTai = typeof banGhi['_version'] === 'number' ? (banGhi['_version'] as number) : 0;
      if (hienTai !== op.expectedVersion) {
        errs.push(
          loi(
            'transaction',
            'VERSION_LECH',
            `'${bang}/${id}' đang ở version ${hienTai}, patch mong đợi ${op.expectedVersion}.`,
            { path: viTri },
          ),
        );
        continue;
      }
    }

    if (op.target.path === '') {
      errs.push(loi('patch', 'PATH_RONG', `Op '${op.op}' cần đường dẫn trường.`, { path: viTri }));
      continue;
    }

    const t = toiCha(banGhi, op.target.path, op.op === 'set' || op.op === 'flag' || op.op === 'push');
    if (!t) {
      errs.push(
        loi('patch', 'PATH_XAU', `Đường dẫn không tới đâu hoặc bị cấm: '${op.target.path}'.`, {
          path: viTri,
        }),
      );
      continue;
    }

    const truoc = t.cha[t.khoa];

    switch (op.op) {
      case 'set':
        t.cha[t.khoa] = op.value;
        break;

      case 'flag':
        t.cha[t.khoa] = op.value === undefined ? true : op.value === true;
        break;

      case 'add':
      case 'mul': {
        if (typeof op.value !== 'number' || !Number.isFinite(op.value)) {
          errs.push(
            loi('patch', 'GIA_TRI_KHONG_PHAI_SO', `Op '${op.op}' cần giá trị số hữu hạn.`, { path: viTri }),
          );
          continue;
        }
        if (typeof truoc !== 'number') {
          // Phần 9.2 kiểm tra 3: `mul` lên string là trượt.
          errs.push(
            loi('patch', 'KIEU_KHONG_HOP', `Không thể '${op.op}' lên '${op.target.path}' (không phải số).`, {
              path: viTri,
            }),
          );
          continue;
        }
        t.cha[t.khoa] = op.op === 'add' ? truoc + op.value : truoc * op.value;
        break;
      }

      case 'push': {
        if (truoc === undefined) {
          t.cha[t.khoa] = [op.value];
          break;
        }
        if (!Array.isArray(truoc)) {
          errs.push(
            loi('patch', 'KIEU_KHONG_HOP', `Không thể 'push' vào '${op.target.path}' (không phải mảng).`, {
              path: viTri,
            }),
          );
          continue;
        }
        t.cha[t.khoa] = [...truoc, op.value];
        break;
      }

      case 'remove': {
        if (Array.isArray(truoc)) {
          t.cha[t.khoa] = truoc.filter((x) => x !== op.value);
          break;
        }
        if (truoc === undefined) {
          canhBao.push(
            loi('patch', 'REMOVE_KHONG_CO_GI', `'${op.target.path}' vốn đã trống.`, {
              path: viTri,
              severity: 'warning',
            }),
          );
          break;
        }
        delete t.cha[t.khoa];
        break;
      }
    }

    // Tăng version cho bản ghi có theo dõi version.
    if (typeof banGhi['_version'] === 'number' && op.target.path !== '_version') {
      banGhi['_version'] = (banGhi['_version'] as number) + 1;
    }
  }

  if (errs.length > 0) return hong(errs, canhBao);

  // ── Pha 2: validate lại mọi bản nháp ──
  for (const { bang, id, banGhi } of nhap.values()) {
    const r = schemaCua(bang).safeParse(banGhi);
    if (!r.success) {
      errs.push(
        loi('patch', 'BAN_GHI_HONG_SAU_PATCH', `'${bang}/${id}' không còn hợp lệ sau khi áp patch.`, {
          path: `${bang}/${id}`,
          details: { issues: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`) },
        }),
      );
      continue;
    }
    if (bang === 'entities') errs.push(...loiAspect(id, banGhi));
  }
  if (errs.length > 0) return hong(errs, canhBao);

  // ── Pha 3: ghi thật, đồng thời ghi lại thông tin hoàn tác ──
  const truoc = new Map<string, BanGhi | null>();
  const entities = new Set<string>();
  const links = new Set<string>();
  const gaps = new Set<string>();
  const knowledge = new Set<string>();
  const debts = new Set<string>();
  const prayers = new Set<string>();
  const storylines = new Set<string>();
  const foreshadows = new Set<string>();
  let chamWorld = false;
  let chamMetrics = false;

  const ghiPhamVi = (bang: TenBang, id: string): void => {
    if (bang === 'entities') entities.add(id);
    else if (bang === 'links') links.add(id);
    else if (bang === 'gaps') gaps.add(id);
    else if (bang === 'knowledge') knowledge.add(id);
    else if (bang === 'debts') debts.add(id);
    else if (bang === 'prayers') prayers.add(id);
    else if (bang === 'storylines') storylines.add(id);
    else if (bang === 'foreshadows') foreshadows.add(id);
    else if (bang === 'worlds') chamWorld = true;
    else chamMetrics = true;
  };

  for (const khoa of xoa) {
    const [bang, id] = khoa.split('|') as [TenBang, string];
    const bangMap = layBang(s, bang);
    const cu = bangMap?.get(id);
    truoc.set(khoa, cu ?? null);
    ghiPhamVi(bang, id);
    bangMap?.delete(id);
  }

  for (const [khoa, { bang, id, banGhi, laDon }] of nhap) {
    ghiPhamVi(bang, id);
    if (laDon) {
      if (bang === 'worlds') {
        truoc.set(khoa, s.world as unknown as BanGhi);
        s.world = banGhi as unknown as WorldState['world'];
      } else {
        truoc.set(khoa, s.metrics as unknown as BanGhi);
        s.metrics = banGhi as unknown as WorldState['metrics'];
      }
      continue;
    }
    const bangMap = layBang(s, bang);
    truoc.set(khoa, bangMap?.get(id) ?? null);
    bangMap?.set(id, banGhi);
  }

  return dat(
    {
      soBanGhiDoi: nhap.size + xoa.size,
      hoanTac: { truoc },
      phamVi: {
        entities,
        links,
        gaps,
        knowledge,
        debts,
        prayers,
        storylines,
        foreshadows,
        chamWorld,
        chamMetrics,
      },
      canhBao,
    },
    canhBao,
  );
}

/**
 * Ghi TRỌN một bản ghi, dù nó đã có hay chưa.
 *
 * ── Vì sao cần helper này ──
 *
 * `op: 'link'` là phép TẠO, và nó cố tình từ chối id đã tồn tại (`LINK_TRUNG`) —
 * hàng rào ấy đúng, vì nó chặn model tạo bản sao của một thực thể đã có.
 *
 * Nhưng vài chỗ trong engine cầm sẵn cả bản ghi mới và chỉ muốn thay bản cũ:
 * `datTenTruc()` trả về `SubstrateLaw` sau khi đặt tên, `quetCoChe()` trả về
 * `CoCheRow` sau khi quét. Cả hai đang phát `link` lên bảy dòng luật nền và bốn
 * dòng cơ chế **đã được gieo từ lúc mở ván** — nên `LINK_TRUNG` từ chối cả lô,
 * và hai tính năng ấy im lặng không làm gì kể từ lần chạy thứ hai.
 *
 * Ở đây: chưa có thì `link`, đã có thì `set` từng trường. Duyệt khóa đã sắp để
 * cùng một bản ghi luôn cho cùng một chuỗi patch (luật bất biến #7).
 *
 * `id` và `branchId` bị bỏ qua: chúng là danh tính của bản ghi, không phải trạng
 * thái của nó. Muốn đổi danh tính thì đó là một bản ghi khác.
 */
export function patchGhiBanGhi(
  s: WorldState,
  bang: TenBang,
  id: string,
  giaTri: Readonly<Record<string, unknown>>,
  sourceEventId: string,
): PatchOp[] {
  const bangMap = layBang(s, bang);
  if (bangMap === null || !bangMap.has(id)) {
    return [{ op: 'link', target: { table: bang, id, path: '' }, value: giaTri, sourceEventId }];
  }
  return Object.keys(giaTri)
    .filter((k) => k !== 'id' && k !== 'branchId')
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((k): PatchOp => ({
      op: 'set',
      target: { table: bang, id, path: k },
      value: giaTri[k],
      sourceEventId,
    }));
}

/** Đọc một giá trị theo `PatchOp.target` — dùng cho invariant và test. */
export function docTheoTarget(s: WorldState, bang: TenBang, id: string, duongDan: string): unknown {
  const don = layBanGhiDon(s, bang);
  if (don) return docTai(don, duongDan);
  const banGhi = layBang(s, bang)?.get(id);
  if (!banGhi) return undefined;
  return docTai(banGhi, duongDan);
}
