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
import type { Entity } from '../schema/entity.js';
import { DomainSchema, VenerableSchema } from '../schema/aspect/divine.js';
import { DivineIdentitySchema } from '../schema/aspect/thanVi.js';
import type { CanCuoc } from '../schema/aspect/pham.js';
import type { Soul } from '../schema/aspect/soul.js';
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

export const DUONG_SAU_CHET = ['ke_thua', 'chung_kien', 'anh_linh'] as const;
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

  return Object.freeze(ra);
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
