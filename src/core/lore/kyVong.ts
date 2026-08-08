/**
 * Lorebook như LỰC HẤP DẪN, và Dị Bản — Phần 35.4, 35.5 [BB].
 *
 * ── Câu trung tâm ──
 *
 * [BB] 35.4 mục 3: "Kỳ vọng **không phải kịch bản**. Nó là **điểm hút**. Thế giới
 * hướng về đó, không bị ép tới đó."
 *
 * Vì vậy `kyVongThanhGap()` chỉ sinh một `gap` với `uuTien` nhân theo `lucHapDan`
 * — và gap thì đi qua bộ giải ràng buộc (15.2), nơi nó **vẫn phải tuân mọi ràng
 * buộc khác đang đúng**. Không có hàm nào ở đây ghi thẳng một entity vào thế giới.
 *
 * ── Và câu quan trọng hơn ──
 *
 * [BB] 35.5: khi hành động của người chơi làm một kỳ vọng không còn khả thi,
 * engine **không** ép nó xảy ra và **không** im lặng bỏ qua. Nó ghi lại thành
 * **Dị Bản** — bốn thứ bắt buộc: kỳ vọng gốc, thực tế, nguyên nhân truy được, và
 * một dòng biên niên bằng giọng kể chuyện.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity, Gap } from '../schema/entity.js';
import { GapSchema } from '../schema/entity.js';
import type { Conceptual } from '../schema/aspect/conceptual.js';
import type { Lawful } from '../schema/aspect/lawful.js';
import { DiBanSchema, LoreExpectationSchema } from './schema.js';
import type { DiBan, Lorebook, LoreExpectation, LorebookEntry, TrangThaiKyVong } from './schema.js';
import { docNeoLore } from './hienThuc.js';

// ─────────────────────────────────────────── trích kỳ vọng

type MauTrich = {
  readonly re: RegExp;
  readonly loai: LoreExpectation['loai'];
  readonly dung: (m: RegExpExecArray) => LoreExpectation['dieuKien'];
  readonly moTa: (m: RegExpExecArray) => string;
};

const rong = (): LoreExpectation['dieuKien'] => ({
  kieu: 'ton_tai_tag',
  kind: '',
  ten: '',
  tag: '',
  quanHe: '',
  nguong: 0,
  duongDan: '',
});

/**
 * Mẫu trích kỳ vọng từ văn bản entry.
 *
 * Cố ý ít và cụ thể. Một bộ trích tham lam sẽ biến mỗi câu thành một kỳ vọng, và
 * Bản Đồ Dị Biệt sẽ đầy những dòng "đang chờ" mà không bao giờ thỏa được — đúng
 * cái làm người chơi thôi tin vào màn hình ấy.
 */
const MAU: readonly MauTrich[] = [
  {
    re: /có một (?:vị )?thần\s+([\p{L}\s]{2,24}?)\s+(?:cai trị|đứng đầu|thống trị)/iu,
    loai: 'ton_tai',
    dung: (m) => ({
      ...rong(),
      kieu: 'ton_tai_kind',
      kind: 'deity',
      tag: chuanTag(m[1] as string),
      nguong: 70,
      duongDan: 'than_vi.domainStrength',
    }),
    moTa: (m) => `Có một vị thần ${(m[1] as string).trim()} đứng đầu thần điện`,
  },
  {
    re: /kẻ thù (?:vĩnh cửu|truyền kiếp)/iu,
    loai: 'quan_he',
    dung: () => ({ ...rong(), kieu: 'ton_tai_link', quanHe: 'doi_nghich' }),
    moTa: () => 'Tồn tại một cặp đối nghịch vĩnh cửu',
  },
  {
    re: /(?:người chết|linh hồn) được\s+([\p{L}\s]{2,24}?)\s+để phán xét/iu,
    loai: 'quy_luat',
    dung: (m) => ({ ...rong(), kieu: 'luat_co_the_tag', tag: chuanTag(m[1] as string) }),
    moTa: (m) => `Có luật về việc ${(m[1] as string).trim()} để phán xét người chết`,
  },
  {
    re: /khái niệm\s+([\p{L}\s]{2,24}?)\s+(?:kết tinh|thành hình)/iu,
    loai: 'quy_luat',
    dung: (m) => ({ ...rong(), kieu: 'khai_niem_ket_tinh', tag: chuanTag(m[1] as string) }),
    moTa: (m) => `Khái niệm ${(m[1] as string).trim()} kết tinh`,
  },
];

function chuanTag(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Trích kỳ vọng từ một lorebook khi nó được BẬT — 35.4.
 *
 * `doUuTien` nhân theo `lucHapDan`: thanh trượt 0 nghĩa là lorebook chỉ làm ngữ
 * cảnh, và ở đó hàm này trả về kỳ vọng có ưu tiên 0 — tồn tại để hiện trên Bản Đồ
 * Dị Biệt, nhưng không kéo thế giới đi đâu cả.
 */
export function trichKyVong(lorebook: Lorebook, branchId: string): LoreExpectation[] {
  if (!lorebook.bat) return [];
  const ra: LoreExpectation[] = [];
  for (const e of lorebook.entries) {
    if (e.trangThai !== 'hoat_dong') continue;
    for (const khai of e.kyVongKhaiBao) {
      ra.push(
        LoreExpectationSchema.parse({
          id: `kv.${lorebook.id}.${e.id}.khai.${khai.id}`,
          branchId,
          lorebookId: lorebook.id,
          entryId: e.id,
          loai: khai.loai,
          moTa: khai.moTa,
          dieuKien: khai.dieuKien,
          trangThai: 'cho',
          doUuTien: Math.round((khai.doUuTien * lorebook.lucHapDan) / 100),
        }),
      );
    }
    if (e.triHoanHienThuc) continue;
    let i = 0;
    const truocEntry = ra.length;
    for (const mau of MAU) {
      const m = mau.re.exec(e.noiDung);
      if (m === null) continue;
      ra.push(
        LoreExpectationSchema.parse({
          id: `kv.${lorebook.id}.${e.id}.${i++}`,
          branchId,
          lorebookId: lorebook.id,
          entryId: e.id,
          loai: mau.loai,
          moTa: mau.moTa(m),
          dieuKien: mau.dung(m),
          trangThai: 'cho',
          doUuTien: Math.round((lorebook.lucHapDan / 100) * 100),
        }),
      );
    }
    // Chỉ bổ sung neo tên khi các mẫu khai báo chuyên biệt chưa nhận ra entry;
    // một vị thần đã có kỳ vọng `ton_tai_kind` không cần thêm bản sao theo tên.
    const neo = docNeoLore(e);
    if (neo !== null && ra.length === truocEntry) {
      ra.push(
        LoreExpectationSchema.parse({
          id: `kv.${lorebook.id}.${e.id}.neo`,
          branchId,
          lorebookId: lorebook.id,
          entryId: e.id,
          loai: 'ton_tai',
          moTa: `${neo.ten} tồn tại trong thế giới`,
          dieuKien: { ...rong(), kieu: 'ton_tai_ten', ten: neo.ten },
          trangThai: 'cho',
          doUuTien: Math.round(lorebook.lucHapDan),
        }),
      );
    }
  }
  return ra;
}

/**
 * Một kỳ vọng đang chờ trở thành lỗ hổng thật để Bồi Đắp/Narrator nhìn thấy.
 * Nó không tạo entity; bộ giải và lượt kể vẫn phải tìm một con đường hợp lệ.
 */
export function gapChoKyVong(kv: LoreExpectation, tick: number): Gap {
  return GapSchema.parse({
    id: `gap.lore.${kv.id}`,
    branchId: kv.branchId,
    loai: 'diem_hut_than_thoai',
    chuTheId: null,
    moTa: `Điểm hút thần thoại đang chờ: ${kv.moTa}`,
    uuTien: kv.doUuTien,
    tickPhatHien: tick,
  });
}

// ─────────────────────────────────────────── đánh giá

export type SoTheoDoi = {
  /** Entity từng thỏa kỳ vọng — cần để phân biệt `da_lech` với `bat_kha`. */
  readonly thoaBoi: ReadonlyMap<string, string>;
};

export type KetQuaDanhGia = {
  readonly kyVong: readonly LoreExpectation[];
  readonly diBanMoi: readonly DiBan[];
  readonly gapMoi: readonly Gap[];
  readonly thoaBoi: ReadonlyMap<string, string>;
};

function docAspect<T>(e: Entity | undefined, ten: string): T | undefined {
  return e?.aspects[ten] as T | undefined;
}

/** Entity nào đang thỏa điều kiện; `null` nghĩa là chưa ai. */
export function aiThoa(dk: LoreExpectation['dieuKien'], s: WorldState): string | null {
  const song = [...s.entities.values()].filter((e) => e.tickDiet === null);
  const sapId = (ds: Entity[]): Entity[] => [...ds].sort((a, b) => (a.id < b.id ? -1 : 1));

  switch (dk.kieu) {
    case 'ton_tai_kind': {
      for (const e of sapId(song.filter((e) => e.kind === dk.kind))) {
        if (dk.tag !== '' && !e.tags.includes(dk.tag)) continue;
        if (dk.nguong > 0 && dk.duongDan !== '') {
          const [aspect, truong] = dk.duongDan.split('.');
          const a = docAspect<Record<string, unknown>>(e, aspect ?? '');
          const v = Number(a?.[truong ?? ''] ?? 0);
          if (!(v > dk.nguong)) continue;
        }
        return e.id;
      }
      return null;
    }
    case 'ton_tai_ten': {
      const ten = dk.ten.trim().toLocaleLowerCase();
      if (ten === '') return null;
      const e = sapId(
        song.filter(
          (x) => x.ten.toLocaleLowerCase() === ten || x.aliases.some((a) => a.toLocaleLowerCase() === ten),
        ),
      )[0];
      return e?.id ?? null;
    }
    case 'ton_tai_tag': {
      const e = sapId(song.filter((x) => x.tags.includes(dk.tag)))[0];
      return e?.id ?? null;
    }
    case 'ton_tai_link': {
      for (const l of [...s.links.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
        if (l.quanHe !== dk.quanHe || l.tickDut !== null) continue;
        const a = s.entities.get(l.tuId);
        const b = s.entities.get(l.denId);
        if (a?.tickDiet === null && b?.tickDiet === null) return l.id;
      }
      return null;
    }
    case 'luat_co_the_tag': {
      for (const e of sapId(song)) {
        const law = docAspect<Lawful>(e, 'lawful');
        if (law === undefined) continue;
        if (law.theTag.includes(dk.tag)) return e.id;
      }
      return null;
    }
    case 'khai_niem_ket_tinh': {
      for (const e of sapId(song)) {
        const kn = docAspect<Conceptual>(e, 'conceptual');
        if (kn === undefined || kn.giaiDoan !== 'ket_tinh') continue;
        if (dk.tag !== '' && !e.tags.includes(dk.tag)) continue;
        return e.id;
      }
      return null;
    }
  }
}

/**
 * Cập nhật trạng thái mọi kỳ vọng và sinh Dị Bản cho những cái vừa thành bất khả.
 *
 * Ba chuyển trạng thái, và chỉ ba:
 * - `cho`/`da_lech` → `da_thoa` khi có kẻ thỏa;
 * - `da_thoa` → `da_lech` khi không còn ai thỏa nhưng kẻ cũ vẫn còn sống;
 * - bất kỳ → `bat_kha` khi kẻ từng thỏa đã **chết hoặc bị thu hồi**.
 *
 * Phân biệt hai cái cuối là toàn bộ giá trị của 35.5: "đã lệch" là thế giới đi
 * chệch và còn quay lại được; "bất khả" là cánh cửa đã đóng, và engine phải sinh
 * một gap để ai đó khác lấp chỗ trống.
 */
export function capNhatKyVong(input: {
  readonly kyVong: readonly LoreExpectation[];
  readonly state: WorldState;
  readonly theoDoi: SoTheoDoi;
  readonly tick: number;
  readonly lucHapDan: number;
  /** Ai vừa làm gì — để `nguyenNhan` của Dị Bản truy được. */
  readonly nguyenNhan?: {
    readonly chuTheId: string | null;
    readonly eventIds: readonly string[];
    readonly moTa: string;
  };
}): KetQuaDanhGia {
  const ra: LoreExpectation[] = [];
  const diBan: DiBan[] = [];
  const gaps: Gap[] = [];
  const thoaBoi = new Map(input.theoDoi.thoaBoi);

  for (const kv of input.kyVong) {
    const ai = aiThoa(kv.dieuKien, input.state);
    if (ai !== null) {
      thoaBoi.set(kv.id, ai);
      ra.push({ ...kv, trangThai: 'da_thoa', lyDoLech: '', tickLech: null, thoaBoiId: ai });
      continue;
    }

    const cu = kv.thoaBoiId ?? thoaBoi.get(kv.id);
    const keCu = cu === undefined ? undefined : input.state.entities.get(cu);
    const daMat = cu !== undefined && (keCu === undefined || keCu.tickDiet !== null);

    const moi: TrangThaiKyVong = daMat ? 'bat_kha' : kv.trangThai === 'da_thoa' ? 'da_lech' : kv.trangThai;
    if (moi === kv.trangThai && moi !== 'bat_kha') {
      ra.push(kv);
      continue;
    }

    const lyDo =
      daMat && keCu !== undefined
        ? `${keCu.ten} bị thu hồi ở nhịp ${keCu.tickDiet ?? input.tick}. Vị trí bỏ trống.`
        : daMat
          ? 'Kẻ từng thỏa kỳ vọng này không còn trong thế giới.'
          : 'Không còn ai thỏa điều kiện.';

    const kvMoi: LoreExpectation = { ...kv, trangThai: moi, lyDoLech: lyDo, tickLech: input.tick };
    ra.push(kvMoi);

    if (moi !== 'bat_kha' || kv.trangThai === 'bat_kha') continue;

    // ── Dị Bản: bốn thứ bắt buộc của 35.5 ──
    const gap = GapSchema.parse({
      id: `gap.diban.${kv.id}`,
      branchId: kv.branchId,
      loai: 'nhan_qua',
      chuTheId: null,
      moTa: `Chỗ trống do "${kv.moTa}" không còn khả thi. Ai lấp?`,
      // 35.4 mục 1 — ưu tiên nhân theo lực hấp dẫn của lorebook.
      uuTien: Math.max(0, Math.min(100, Math.round((kv.doUuTien * input.lucHapDan) / 100))),
      tickPhatHien: input.tick,
    });
    gaps.push(gap);

    diBan.push(
      DiBanSchema.parse({
        id: `db.${kv.id}`,
        branchId: kv.branchId,
        kyVongId: kv.id,
        kyVongGoc: kv.moTa,
        thucTe: lyDo,
        nguyenNhan: {
          tick: input.tick,
          chuTheId: input.nguyenNhan?.chuTheId ?? cu ?? null,
          eventIds: [...(input.nguyenNhan?.eventIds ?? [])],
          moTa: input.nguyenNhan?.moTa ?? lyDo,
        },
        gapId: gap.id,
        dongBienNien: dongBienNien(kv, keCu),
        tickGhi: input.tick,
      }),
    );
  }

  return { kyVong: ra, diBanMoi: diBan, gapMoi: gaps, thoaBoi };
}

/** Dòng biên niên cho một Dị Bản — 35.5 mục 3: giọng kể chuyện, không giọng log. */
function dongBienNien(kv: LoreExpectation, keCu: Entity | undefined): string {
  if (keCu === undefined) {
    return `Điều lẽ ra phải xảy ra — ${kv.moTa.toLowerCase()} — đã không xảy ra. Thế giới này đi lối khác.`;
  }
  return (
    `${keCu.ten} không còn ở chỗ ấy nữa. Điều lẽ ra phải đúng — ${kv.moTa.toLowerCase()} — ` +
    'từ nay chỉ còn là một câu trong sách cũ. Chỗ trống thì vẫn trống, và sẽ có kẻ tới đứng vào.'
  );
}

// ─────────────────────────────────────────── Bản Đồ Dị Biệt (35.6)

export type DongBanDo = {
  readonly kyVong: string;
  readonly theGioiCuaBan: string;
  readonly trangThai: TrangThaiKyVong;
};

export type BanDoDiBiet = {
  readonly dong: readonly DongBanDo[];
  readonly daThoa: number;
  readonly dangCho: number;
  readonly daLech: number;
  readonly batKha: number;
};

/**
 * [BB] 35.6 — "Đây không phải bảng lỗi. Nó là hồ sơ về việc thế giới của người
 * chơi đã trở thành cái gì." Nên không có cột nào tên là `loi`, và giọng của
 * `theGioiCuaBan` là giọng thuật lại, không phải giọng báo hỏng.
 */
export function banDoDiBiet(
  kyVong: readonly LoreExpectation[],
  diBan: readonly DiBan[],
  state: WorldState,
): BanDoDiBiet {
  const theoKv = new Map(diBan.map((d) => [d.kyVongId, d]));
  const dong = kyVong.map((kv) => {
    const db = theoKv.get(kv.id);
    if (kv.trangThai === 'da_thoa') {
      const ai = aiThoa(kv.dieuKien, state);
      const ten = ai === null ? '' : (state.entities.get(ai)?.ten ?? '');
      return {
        kyVong: kv.moTa,
        theGioiCuaBan: ten === '' ? kv.moTa : `${kv.moTa} — ${ten}`,
        trangThai: kv.trangThai,
      };
    }
    return {
      kyVong: kv.moTa,
      theGioiCuaBan: db?.thucTe ?? (kv.lyDoLech === '' ? 'chưa xảy ra' : kv.lyDoLech),
      trangThai: kv.trangThai,
    };
  });
  const dem = (t: TrangThaiKyVong): number => kyVong.filter((k) => k.trangThai === t).length;
  return {
    dong,
    daThoa: dem('da_thoa'),
    dangCho: dem('cho'),
    daLech: dem('da_lech'),
    batKha: dem('bat_kha'),
  };
}

// ─────────────────────────────────────────── nạp entry theo Sử Thắng Nguồn

/**
 * Kiểu F của 51.1 — kỳ vọng đã chết mà văn bản gốc vẫn được nạp.
 *
 * Khi một kỳ vọng chuyển `bat_kha`, entry sinh ra nó phải bị che **cùng lúc**.
 * Không làm điều này thì Ra vẫn được nhắc như đương kim chủ tể suốt bốn trăm năm
 * sau khi bị thu hồi.
 */
export function entryCanChe(
  kyVong: readonly LoreExpectation[],
  entries: readonly LorebookEntry[],
): { readonly entryId: string; readonly kyVongId: string; readonly lyDo: string }[] {
  const ra: { entryId: string; kyVongId: string; lyDo: string }[] = [];
  const theoEntry = new Map(entries.map((e) => [e.id, e]));
  for (const kv of kyVong) {
    if (kv.trangThai !== 'bat_kha') continue;
    const e = theoEntry.get(kv.entryId);
    if (e === undefined || e.trangThai !== 'hoat_dong') continue;
    ra.push({ entryId: e.id, kyVongId: kv.id, lyDo: kv.lyDoLech });
  }
  return ra;
}
