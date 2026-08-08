/**
 * Cái chết và ba đường sau nó — Phần 20.3 [BB].
 *
 * > "Chết không Game Over."
 *
 * | Đường | Điều kiện | Kết quả |
 * |---|---|---|
 * | Kế thừa | có con cháu hoặc đệ tử | chơi tiếp bằng người đó |
 * | Chứng kiến | luôn có | chuyển sang một NPC từng biết người chết |
 * | Anh Linh Hóa Thần | `duocNhoBoi` vượt ngưỡng | **lên tầng Thần** |
 *
 * ── Vì sao đường thứ ba là lý do kiến trúc Entity–Aspect tồn tại ──
 *
 * Hóa thần KHÔNG tạo entity mới. Nó **thêm** aspect `domain` và `venerable` vào
 * đúng cái entity đã sống cả đời làm người, giữ nguyên `soul`, `genealogical`,
 * mọi quan hệ và mọi ký ức. Người bạn thân năm xưa vẫn là người bạn thân năm
 * xưa — chỉ có điều ba đời sau, con cháu họ thờ một huyền thoại mang tên bạn.
 *
 * Nếu kiến trúc là "class Mortal / class Deity" thì đoạn trên là một cuộc di
 * trú dữ liệu. Ở đây nó là hai patch.
 *
 * [BB] `laHuyenThoai` được bật dần theo thế hệ, không bật ngay: người còn sống
 * từng biết bạn thì vẫn nhớ bạn là người.
 */
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import { EntitySchema, LinkSchema, type Entity } from '../schema/entity.js';
import { DomainSchema, VenerableSchema } from '../schema/aspect/divine.js';
import { DivineIdentitySchema } from '../schema/aspect/thanVi.js';
import type { CanCuoc } from '../schema/aspect/pham.js';
import { SoulSchema, type Soul } from '../schema/aspect/soul.js';
import { GenealogicalSchema, MortalSchema, SpatialSchema } from '../schema/aspect/living.js';
import { phamThan, daChet } from './thanThe.js';
import { chuyenThuaKe, giaiTheHo, hoCuaNguoi, roiHo } from './ho.js';
import { datQuanHe, nguoiTaQuen } from './quanHe.js';
import { dat, hong, loi } from '../contracts/errors.js';
import type { KetQua } from '../contracts/errors.js';

function docAspect<T>(e: Entity | undefined, ten: string): T | undefined {
  const a = e?.aspects[ten];
  return a && typeof a === 'object' ? (a as T) : undefined;
}

const set = (id: string, path: string, value: unknown, evId: string): PatchOp => ({
  op: 'set',
  target: { table: 'entities', id, path },
  value,
  sourceEventId: evId,
});

export type NgocCanhChet = { readonly eventId: string; readonly tick: number };

/** Ngưỡng `duocNhoBoi` để cửa Anh Linh mở ra. Cao có chủ ý: nó là phần thưởng. */
export const NGUONG_ANH_LINH = 60;

// ─────────────────────────────────────────── chết

export type KetQuaChet = {
  readonly patches: readonly PatchOp[];
  readonly chuoiNguyenNhan: readonly string[];
  readonly nguoiThuaKe: readonly string[];
  readonly loiKe: string;
};

/**
 * Một người chết.
 *
 * Bốn việc, và không việc nào được bỏ:
 *   1. đánh dấu `tickDiet` và ghi **chuỗi** nguyên nhân (70.5);
 *   2. chuyển thừa kế qua `Claim` (20.3);
 *   3. rời hộ, và giải thể hộ nếu không còn ai;
 *   4. ghi vào ký ức của những người từng quen — đây là chỗ "một đời bình
 *      thường vẫn để lại dấu vết" trở thành dữ liệu chứ không phải một câu.
 */
export function chet(
  state: WorldState,
  nguoiId: string,
  nc: NgocCanhChet,
  themNguyenNhan: readonly string[] = [],
): KetQua<KetQuaChet> {
  const e = state.entities.get(nguoiId);
  const m = phamThan(e);
  if (!e || !m) return hong([loi('intent', 'KHONG_PHAI_NGUOI', 'Chỉ con người mới chết theo đường này.')]);
  if (e.tickDiet !== null) {
    return hong([loi('intent', 'DA_CHET', `${e.ten} đã chết rồi.`, { recoverable: true })]);
  }

  const { chuoiNguyenNhan } = daChet(m);
  const chuoi = [...chuoiNguyenNhan, ...themNguyenNhan];

  const patches: PatchOp[] = [
    set(nguoiId, 'tickDiet', nc.tick, nc.eventId),
    set(nguoiId, 'aspects.mortal.tickTu', nc.tick, nc.eventId),
    set(nguoiId, 'aspects.mortal.nguyenNhanChet', chuoi.slice(0, 8), nc.eventId),
  ];

  // Hậu kiếp được quyết định bởi những cõi, luật và thần phán xét thật đang tồn tại.
  const soul = docAspect<Soul>(e, 'soul');
  if (soul) {
    const coiChet = [...state.entities.values()]
      .filter((x) => x.kind === 'realm' && x.tickDiet === null)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .find((x) => x.tags.some((t) => ['coi_chet', 'minh_phu', 'yomi'].includes(t)));
    const luanHoi = [...state.entities.values()].some((x) => {
      const law = docAspect<{ hieuLuc?: number; trangThai?: string; theTag?: string[] }>(x, 'lawful');
      return x.tickDiet === null && (law?.hieuLuc ?? 0) > 0 && (law?.theTag ?? []).includes('luan_hoi');
    });
    const nguoiPhanXet = [...state.entities.values()]
      .filter((x) => x.kind === 'deity' && x.tickDiet === null)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .find((x) => x.tags.some((t) => ['phan_xet', 'cong_ly_chet', 'dia_nguc'].includes(t)));
    const trangThai = luanHoi
      ? 'cho_luan_hoi'
      : nguoiPhanXet
        ? 'cho_phan_xet'
        : coiChet
          ? 'o_coi_chet'
          : 'luu_lac';
    patches.push(
      set(
        nguoiId,
        'aspects.soul.hauKiep',
        {
          trangThai,
          realmId: coiChet?.id ?? null,
          tickChet: nc.tick,
          phanXetBoiId: nguoiPhanXet?.id ?? null,
          soVong: soul.hauKiep.soVong,
          kyUcMangTheoIds: soul.kyUc.slice(-3).map((x) => x.id),
        },
        nc.eventId,
      ),
    );
  }

  // ── thừa kế ──
  const tk = chuyenThuaKe(state, nguoiId, nc);
  patches.push(...tk.patches);

  // ── hộ ──
  const ho = hoCuaNguoi(state, nguoiId);
  if (ho) {
    patches.push(...roiHo(state, nguoiId, ho.id, nc));
    // Chủ hộ chết thì người thừa kế đầu tiên còn trong nhà lên thay.
    if (ho.ho.chuHoId === nguoiId) {
      const ke = tk.nguoiNhan.find((x) => ho.ho.thanhVien.some((t) => t.id === x.nguoiId));
      patches.push(set(ho.id, 'aspects.ho.chuHoId', ke?.nguoiId ?? null, nc.eventId));
    }
    patches.push(...giaiTheHo(state, ho.id, nc));
  }

  // ── người ta nhớ ──
  // Ai từng quen thì ghi lại. Không ai quen thì không có dòng nào — và đó cũng
  // là một sự thật về cuộc đời ấy, engine không bịa thêm cho đỡ trống.
  for (const { id } of nguoiTaQuen(state, nguoiId).slice(0, 8)) {
    const kia = state.entities.get(id);
    if (!kia || kia.tickDiet !== null) continue;
    patches.push(
      ...datQuanHe(state, id, nguoiId, { anTuong: `${e.ten} đã mất.`, cong: { thanSo: -5 } }, nc.eventId),
    );
  }

  return dat({
    patches,
    chuoiNguyenNhan: chuoi,
    nguoiThuaKe: tk.nguoiNhan.map((x) => x.nguoiId),
    loiKe: `${e.ten} mất.${tk.loiKe === '' ? '' : ` ${tk.loiKe}`}`,
  });
}

// ─────────────────────────────────────────── ba đường

export const DUONG_SAU_CHET = ['ke_thua', 'chung_kien', 'anh_linh', 'tai_sinh'] as const;
export type DuongSauChet = (typeof DUONG_SAU_CHET)[number];

export type LuaChonTiepTuc = {
  readonly duong: DuongSauChet;
  readonly chuTheMoiId: string;
  readonly ten: string;
  /** Câu giải thích, hiện thẳng lên UI. */
  readonly vi: string;
};

/**
 * Ba đường mở ra sau khi người chơi chết.
 *
 * Luôn trả ít nhất một lựa chọn nếu thế giới còn người: **chứng kiến** không có
 * điều kiện. Trả rỗng chỉ khi thế giới thật sự không còn ai — và lúc ấy đó không
 * phải Game Over, đó là kết cục.
 */
export function duongDiTiep(state: WorldState, nguoiChetId: string): readonly LuaChonTiepTuc[] {
  const e = state.entities.get(nguoiChetId);
  if (!e) return [];
  // Chưa chết thì chưa có đường nào để đi — kể cả Anh Linh. Trả danh sách rỗng
  // ở đây là câu trả lời đúng, và nó giữ cho UI không hiện hộp "đời này đã hết"
  // lên giữa lúc nhân vật đang sống.
  if (e.tickDiet === null) return [];
  const ra: LuaChonTiepTuc[] = [];

  const conSong = (id: string): Entity | null => {
    const x = state.entities.get(id);
    return x && x.tickDiet === null && x.kind === 'mortal' ? x : null;
  };

  // ── 1. kế thừa ──
  const gen = docAspect<{ conIds?: string[] }>(e, 'genealogical');
  const sk = docAspect<{ hocTroIds?: string[] }>(e, 'sinh_ke');
  for (const id of [...(gen?.conIds ?? []), ...(sk?.hocTroIds ?? [])].sort()) {
    const x = conSong(id);
    if (!x) continue;
    const laCon = (gen?.conIds ?? []).includes(id);
    ra.push({
      duong: 'ke_thua',
      chuTheMoiId: id,
      ten: x.ten,
      vi: laCon ? `con của ${e.ten}` : `học trò của ${e.ten}`,
    });
    if (ra.length >= 3) break;
  }

  // ── 2. chứng kiến ──
  for (const { id, qh } of nguoiTaQuen(state, nguoiChetId).slice(0, 12)) {
    const x = conSong(id);
    if (!x || ra.some((r) => r.chuTheMoiId === id)) continue;
    ra.push({
      duong: 'chung_kien',
      chuTheMoiId: id,
      ten: x.ten,
      vi: qh.anTuong !== '' ? qh.anTuong : `từng quen ${e.ten}`,
    });
    if (ra.filter((r) => r.duong === 'chung_kien').length >= 3) break;
  }

  // ── 3. anh linh hóa thần ──
  const cc = docAspect<CanCuoc>(e, 'can_cuoc');
  if ((cc?.duocNhoBoi ?? 0) >= NGUONG_ANH_LINH) {
    ra.push({
      duong: 'anh_linh',
      chuTheMoiId: nguoiChetId,
      ten: e.ten,
      vi: `${cc?.tiengTam[0] ?? 'Người ta còn nhắc tên'} — đủ để không ai để cho quên.`,
    });
  }

  // 4. tái sinh — chỉ mở khi một luật luân hồi hữu hiệu đã bắt lấy linh hồn.
  const soul = docAspect<Soul>(e, 'soul');
  if (soul?.hauKiep.trangThai === 'cho_luan_hoi') {
    ra.push({
      duong: 'tai_sinh',
      chuTheMoiId: `tai_sinh_${nguoiChetId}_${state.world.sangThe.chuKy}_${state.world.tick}`,
      ten: `Hậu kiếp của ${e.ten}`,
      vi: soul.hauKiep.realmId
        ? `linh hồn đi qua ${state.entities.get(soul.hauKiep.realmId)?.ten ?? 'cõi chết'} rồi trở lại`
        : 'luật luân hồi của thế giới kéo linh hồn trở lại',
    });
  }

  return Object.freeze(ra);
}

/** Tạo một đời mới nhưng để lại liên kết và vài ký ức đã thực sự được mang qua cửa chết. */
export function taiSinh(
  state: WorldState,
  nguoiChetId: string,
  nc: NgocCanhChet,
): KetQua<{ patches: readonly PatchOp[]; nguoiMoiId: string; loiKe: string }> {
  const cu = state.entities.get(nguoiChetId);
  const soulCu = docAspect<Soul>(cu, 'soul');
  if (!cu || cu.tickDiet === null || !soulCu) {
    return hong([loi('intent', 'CHUA_QUA_CUA_CHET', 'Chỉ một linh hồn đã chết mới có thể tái sinh.')]);
  }
  if (soulCu.hauKiep.trangThai !== 'cho_luan_hoi') {
    return hong([
      loi('intent', 'KHONG_CO_LUAN_HOI', 'Thế giới này chưa có luật luân hồi đang giữ linh hồn ấy.'),
    ]);
  }

  const nguoiMoiId = `tai_sinh_${nguoiChetId}_${state.world.sangThe.chuKy}_${state.world.tick}`;
  if (state.entities.has(nguoiMoiId)) {
    return hong([loi('intent', 'DA_TAI_SINH', 'Đời kế tiếp đã bắt đầu rồi.', { recoverable: true })]);
  }
  const noi = [...state.entities.values()]
    .filter((x) => x.kind === 'place' && x.tickDiet === null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
  const spNoi = docAspect<{ vanHoaId?: string | null }>(noi, 'spatial');
  const mangTheo = new Set(soulCu.hauKiep.kyUcMangTheoIds);
  const kyUc = soulCu.kyUc
    .filter((x) => mangTheo.has(x.id))
    .map((x) => ({ ...x, dienTich: Math.min(x.dienTich, 35), lienQuan: [...x.lienQuan] }));
  const soulMoi = SoulSchema.parse({
    tang: soulCu.tang,
    banTinh: { ...soulCu.banTinh },
    ducVong: { ...soulCu.ducVong },
    tamTrang: [],
    kyUc,
    kyUcSuyGiam: true,
    agency: soulCu.agency,
    quanHe: {},
    hauKiep: {
      trangThai: 'tai_sinh',
      realmId: soulCu.hauKiep.realmId,
      tickChet: soulCu.hauKiep.tickChet,
      phanXetBoiId: soulCu.hauKiep.phanXetBoiId,
      soVong: soulCu.hauKiep.soVong + 1,
      kyUcMangTheoIds: kyUc.map((x) => x.id),
    },
  });
  const moi = EntitySchema.parse({
    id: nguoiMoiId,
    branchId: state.world.branchId,
    kind: 'mortal',
    ten: `Hậu kiếp của ${cu.ten}`,
    aliases: [],
    moTa:
      kyUc.length > 0
        ? 'Một đứa trẻ mang theo những giấc nhớ không thuộc đời này.'
        : 'Một đời mới vừa bắt đầu.',
    tickSinh: nc.tick,
    aspects: {
      soul: soulMoi,
      mortal: MortalSchema.parse({ tuoiTho: 70, tickSinh: nc.tick, ageBand: 'child' }),
      genealogical: GenealogicalSchema.parse({ theHe: 0 }),
      spatial: SpatialSchema.parse({ chaId: noi?.id ?? null, vanHoaId: spNoi?.vanHoaId ?? null }),
    },
    tags: ['tai_sinh'],
  });
  const linkId = `lk_${nguoiMoiId}_ke_thua_${nguoiChetId}`;
  return dat({
    nguoiMoiId,
    patches: [
      {
        op: 'link',
        target: { table: 'entities', id: nguoiMoiId, path: '' },
        value: moi,
        sourceEventId: nc.eventId,
      },
      {
        op: 'link',
        target: { table: 'links', id: linkId, path: '' },
        value: LinkSchema.parse({
          id: linkId,
          branchId: state.world.branchId,
          tuId: nguoiMoiId,
          denId: nguoiChetId,
          quanHe: 'ke_thua_tu',
          trongSo: kyUc.length > 0 ? 70 : 40,
          tickTao: nc.tick,
          nguon: 'engine',
        }),
        sourceEventId: nc.eventId,
      },
      set(nguoiChetId, 'aspects.soul.hauKiep.trangThai', 'tai_sinh', nc.eventId),
    ],
    loiKe:
      kyUc.length > 0
        ? `${cu.ten} trở lại trong một đời mới. Vài ký ức cũ chỉ còn như những giấc mơ khó gọi tên.`
        : `${cu.ten} trở lại trong một đời mới, không còn nhớ được đời trước.`,
  });
}

/**
 * Anh Linh Hóa Thần — [BB] 20.3.
 *
 * **Thêm** aspect vào entity đang có. Không tạo entity mới, không copy gì cả.
 * `tickDiet` được gỡ bỏ: vị thần này không sống lại, nhưng cũng không còn nằm
 * trong danh sách người chết — họ đã đổi hạng tồn tại.
 */
export function anhLinhHoaThan(
  state: WorldState,
  nguoiId: string,
  nc: NgocCanhChet,
): KetQua<{ patches: readonly PatchOp[]; loiKe: string }> {
  const e = state.entities.get(nguoiId);
  const cc = docAspect<CanCuoc>(e, 'can_cuoc');
  const soul = docAspect<Soul>(e, 'soul');
  if (!e || !soul) return hong([loi('intent', 'KHONG_PHAI_NGUOI', 'Không tìm thấy người đó.')]);
  if (e.aspects['domain'] !== undefined) {
    return hong([loi('intent', 'DA_LA_THAN', `${e.ten} đã là thần.`, { recoverable: true })]);
  }
  if ((cc?.duocNhoBoi ?? 0) < NGUONG_ANH_LINH) {
    return hong([
      loi('intent', 'CHUA_DU_NHO', `Chưa đủ người nhớ tới ${e.ten} để một vị thần mọc lên từ cái tên ấy.`, {
        recoverable: true,
      }),
    ]);
  }

  // Domain sinh ra từ chính điều người ta nhớ về họ, không từ một danh sách chọn.
  const domainTen = cc?.tiengTam[0]?.slice(0, 60) ?? 'người được nhớ';

  return dat({
    patches: [
      // [BB] Giữ nguyên `soul`, `genealogical`, quan hệ, ký ức. Chỉ THÊM.
      set(nguoiId, 'kind', 'deity', nc.eventId),
      set(nguoiId, 'tickDiet', null, nc.eventId),
      set(
        nguoiId,
        'aspects.domain',
        DomainSchema.parse({
          domains: [{ ten: domainTen, suc: Math.min(30, Math.round((cc?.duocNhoBoi ?? 0) / 3)) }],
          laKhoiNguyen: false,
        }),
        nc.eventId,
      ),
      set(
        nguoiId,
        'aspects.venerable',
        VenerableSchema.parse({
          soTinDoUocLuong: Math.round((cc?.duocNhoBoi ?? 0) / 2),
          hienThanh: 8,
          banTinhTinDoTin: { ...soul.banTinh },
        }),
        nc.eventId,
      ),
      set(
        nguoiId,
        'aspects.ban_nga',
        DivineIdentitySchema.parse({
          coreSelf: { ...soul.banTinh },
          followerImage: { ...soul.banTinh },
          currentManifestation: { ...soul.banTinh },
          officialDoctrine: [...(cc?.tiengTam ?? [])].slice(0, 3),
        }),
        nc.eventId,
      ),
    ],
    loiKe:
      `${e.ten} không sống lại. Nhưng người ta không thôi nhắc tên, và tới một lúc ` +
      `cái tên ấy đủ nặng để đứng một mình. "${domainTen}" — họ gọi thế.`,
  });
}

/**
 * Một thế hệ trôi qua trên ký ức về người đã khuất — [BB] 20.3.
 *
 * Ai còn sống mà từng quen thì vẫn nhớ đúng người. Ai sinh sau thì chỉ có huyền
 * thoại. Hàm này bật `laHuyenThoai` cho những người **không** từng gặp, nên nó
 * phải chạy theo nhịp thế hệ chứ không mỗi tick.
 */
export function huyenThoaiHoa(state: WorldState, nguoiChetId: string, nc: NgocCanhChet): readonly PatchOp[] {
  const e = state.entities.get(nguoiChetId);
  if (!e) return [];
  const tickChet = e.tickDiet ?? phamThan(e)?.tickTu ?? 0;

  const patches: PatchOp[] = [];
  for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const x = state.entities.get(id);
    if (!x || x.kind !== 'mortal' || x.tickDiet !== null || id === nguoiChetId) continue;
    // Sinh sau khi người ấy mất thì chưa từng gặp — với họ đó là truyện kể.
    if (x.tickSinh < tickChet) continue;
    const s = docAspect<Soul>(x, 'soul');
    if (!s?.quanHe?.[nguoiChetId]) continue;
    patches.push(...datQuanHe(state, id, nguoiChetId, { laHuyenThoai: true }, nc.eventId));
  }
  return patches;
}
