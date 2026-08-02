/**
 * Ba cửa vào và khởi tạo thế giới — Phần 17.4, 78.4, 78.5.
 *
 * [BB] Luật bất biến #19: việc chọn bắt đầu là Sáng Thế, Thần hay Phàm phải đi qua
 * Intent → validator → Event/Patch. Wizard KHÔNG ghi World trực tiếp.
 *
 * Module này chỉ SINH RA Event; nó không chạm `WorldState`. Người gọi phải đưa
 * Event qua `apDungEvent` để chúng thành sự thật.
 *
 * ── ADR-0055: đường chơi mở ra HƯ VÔ, không mở ra một thế giới dựng sẵn ──
 *
 * Trước Phase 12, `moThuGioi()` phát tám entity ngay ở nhịp 0: hai Luật, một Khái
 * Niệm và phản nghĩa của nó, một Thần, một Phàm Nhân, hai vùng đất. Người chơi
 * chưa gõ chữ nào đã có sẵn một thần thoại của người khác — và tệ hơn, "Máu Không
 * Rửa Được" xuất hiện ở mọi ván, nên nó thôi là luật của thế giới này và thành đồ
 * trang trí của phần mềm.
 *
 * Vì vậy hai đường tách hẳn nhau:
 *
 *   `moTheGioiTrong()`  — ĐƯỜNG CHƠI. Không entity nào. Luật, khái niệm, thần và
 *                         người chỉ có mặt khi một Event trong lúc chơi tạo ra
 *                         chúng, và Event ấy luôn truy được về một lượt cụ thể.
 *   `moThuGioi()`       — FIXTURE cho test và benchmark. Nó cần một thế giới có
 *                         sẵn hình dạng để đo phép chiếu, ba tầng và một trăm năm
 *                         mô phỏng; nó KHÔNG được đứng trong `src/store` hay
 *                         `src/ui` (có cổng ở `source-guards.test.ts`).
 */
import { z } from 'zod';
import type { Event, PatchOp, World } from '../contracts/core.js';
import { WorldSchema } from '../contracts/core.js';
import { taoEvent } from '../engine/transaction.js';
import { EntitySchema, LinkSchema } from '../schema/entity.js';
import type { Entity } from '../schema/entity.js';
import { SoulSchema } from '../schema/aspect/soul.js';
import { LawfulSchema } from '../schema/aspect/lawful.js';
import { ConceptualSchema } from '../schema/aspect/conceptual.js';
import { DomainSchema, VenerableSchema } from '../schema/aspect/divine.js';
import { MortalSchema, SpatialSchema } from '../schema/aspect/living.js';
import { nguonGoc } from '../schema/aspect/provenance.js';
import { taoRng } from '../engine/rng.js';
import type { Rng } from '../engine/rng.js';

export const CUA_VAO = ['hu_vo', 'mot_cau', 'day_du'] as const;
export type CuaVao = (typeof CUA_VAO)[number];

export const NguyenMauSangThe = [
  'phan_tach_hon_don',
  'vu_tru_noan',
  'hien_te_nguyen_thuy',
  'ngon_tu',
  'tho_lan_dat',
  'giao_phoi_troi_dat',
] as const;

export const KhoiTaoWorldSchema = z
  .object({
    cua: z.enum(CUA_VAO).prefault('hu_vo'),
    seed: z.string().min(1),
    worldId: z.string(),
    branchId: z.string(),
    /** Câu người chơi viết ở cửa `mot_cau`; rỗng ở cửa `hu_vo`. */
    motCau: z.string().max(2_000).prefault(''),
    nguyenMau: z.enum(NguyenMauSangThe).prefault('phan_tach_hon_don'),
    tuningProfileId: z.string().prefault('co_dien'),
  })
  .strict();

export type KhoiTaoWorld = z.infer<typeof KhoiTaoWorldSchema>;

/** World rỗng — chưa có gì trong đó, tick 0. */
export function worldRong(ct: KhoiTaoWorld): World {
  return WorldSchema.parse({
    id: ct.worldId,
    branchId: ct.branchId,
    seed: ct.seed,
    tick: 0,
    eraId: 'era_khoi_nguyen',
    year: 0,
    tuningProfileId: ct.tuningProfileId,
    playerState: { mode: 'sang_the', chuTheId: null, setupCompleted: false, setupVersion: 1 },
    version: 0,
  });
}

// ─────────────────────────────────────────── hạt giống thế giới

/** Tên do engine sinh, deterministic theo seed. Không gọi AI. */
const AM_TIET = [
  'A',
  'Ka',
  'Thu',
  'Nga',
  'Vô',
  'Lam',
  'Huyền',
  'Tịch',
  'Mộc',
  'Diêu',
  'Hàn',
  'Sơ',
  'Uyên',
  'Tà',
  'Minh',
  'Cẩn',
  'Loan',
  'Trách',
  'Vũ',
  'Ẩn',
] as const;

function tenSinh(rng: Rng, so = 2): string {
  const phan: string[] = [];
  for (let i = 0; i < so; i++) phan.push(AM_TIET[rng.nguyen(AM_TIET.length)] as string);
  return phan.join(' ');
}

/**
 * [BB] 59.1 — mọi entity mới phải mang nguồn gốc bất biến.
 *
 * Thứ sinh ra trong lúc khai thiên là do THẾ GIỚI tự sinh, kể cả khi người chơi
 * vừa gõ một câu để mở nó: câu ấy mở ra một thế giới, nó không tự tay nặn từng
 * hòn đá trong đó. Cái người chơi trực tiếp tạo được ghi `nguoi_choi` ở nơi khác
 * — và đó chính là ranh giới làm cho bộ lọc "Do ta trực tiếp tạo" (58.7) có nghĩa.
 */
const e = (
  id: string,
  branchId: string,
  kind: string,
  ten: string,
  aspects: Record<string, unknown>,
  moTa = '',
): Entity =>
  EntitySchema.parse({
    id,
    branchId,
    kind,
    ten,
    moTa,
    tickSinh: 0,
    aspects: { provenance: nguonGoc('the_gioi_tu_sinh', 0), ...aspects },
  });

const patchTao = (bang: string, id: string, banGhi: unknown, eventId: string): PatchOp => ({
  op: 'link',
  target: { table: bang, id, path: '' },
  value: banGhi,
  sourceEventId: eventId,
});

/**
 * Hạt giống tối thiểu của Phase 3: một Luật Nền, một luật thường, một khái niệm
 * (kèm phản nghĩa tự sinh), một thần, một phàm nhân, hai nơi.
 *
 * [BB] Phần 8.3 — mỗi Khái Niệm mới tự động sinh phản nghĩa ở `hu_danh`.
 * [BB] Phần 6.3 — không thực thể mồ côi: mọi entity đều có ít nhất một link.
 */
export function eventGieoTheGioi(ct: KhoiTaoWorld): Event {
  const rng = taoRng(`${ct.seed}#gieo`);
  const b = ct.branchId;
  const evId = 'ev_khai_thien';

  const tenVungA = tenSinh(rng);
  const tenVungB = tenSinh(rng);
  const tenThan = tenSinh(rng);
  const tenNguoi = tenSinh(rng);

  const vungA = e(
    'place_a',
    b,
    'place',
    tenVungA,
    {
      spatial: SpatialSchema.parse({
        toaDo: { x: rng.khoang(-40, -5), y: rng.khoang(-20, 20) },
        banKinh: rng.khoang(4, 9),
        danSo: rng.khoang(400, 2_400),
      }),
    },
    'Một vùng đất mở ra sau khi trời đất tách.',
  );

  const vungB = e(
    'place_b',
    b,
    'place',
    tenVungB,
    {
      spatial: SpatialSchema.parse({
        toaDo: { x: rng.khoang(5, 40), y: rng.khoang(-20, 20) },
        banKinh: rng.khoang(4, 9),
        danSo: rng.khoang(400, 2_400),
      }),
    },
    'Vùng đất thứ hai, đủ xa để hiểu mọi thứ theo cách khác.',
  );

  // ── Luật Nền: có hiệu lực, và hai vùng đã diễn giải LỆCH nhau ──
  const luatNen = e(
    'law_nen',
    b,
    'law',
    'Luật Nền: Nhân Quả Không Mất',
    {
      lawful: LawfulSchema.parse({
        vanBan: 'Điều đã xảy ra thì không thể chưa từng xảy ra.',
        phamVi: { loai: 'vu_tru', mucTieu: [] },
        kichHoat: { suKien: 'moi_su_kien', dieuKien: { op: 'literal', value: true, args: [] } },
        hieuUng: [],
        ngoaiLe: [],
        bien: 'Luật này không quyết định ai nhớ, chỉ quyết định điều gì đã thật sự xảy ra.',
        uuTien: 1000,
        theTag: ['nhan_qua', 'thoi_gian'],
        dienGiai: [
          {
            theHe: 1,
            vungId: 'place_a',
            noiDung: 'Mọi việc làm đều để lại dấu, và dấu ấy đòi được trả.',
            doLech: 22,
          },
          {
            theHe: 1,
            vungId: 'place_b',
            noiDung: 'Thời gian là vòng tròn; điều đã làm sẽ quay lại tìm ta.',
            doLech: 47,
          },
        ],
        trangThai: 'hieu_luc',
      }),
    },
    'Luật Nền của thế giới này.',
  );

  // ── Luật thường ──
  const luatThuong = e('law_thuong', b, 'law', 'Máu Không Rửa Được', {
    lawful: LawfulSchema.parse({
      vanBan: 'Máu đã đổ thì không rửa được.',
      phamVi: { loai: 'vu_tru', mucTieu: [] },
      kichHoat: { suKien: 'gay_chay_mau', dieuKien: { op: 'literal', value: true, args: [] } },
      hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'add', giaTri: 25 }],
      ngoaiLe: [],
      bien: 'Luật này không phán xét động cơ và không phân biệt tự vệ với sát nhân.',
      uuTien: 900,
      theTag: ['giet_nguoi', 'o_ue'],
      keHo: [{ moTa: 'Bóp cổ không gây chảy máu nên không kích hoạt luật.', daBiKhaiThac: false, boiAi: '' }],
      dienGiai: [
        {
          theHe: 3,
          vungId: 'place_a',
          noiDung: 'Kẻ mang dấu máu làm ô uế người đứng gần. Phải sống ngoài làng.',
          doLech: 34,
        },
        {
          theHe: 3,
          vungId: 'place_b',
          noiDung: 'Dấu máu rửa được bằng nước sông vào ngày rằm, nếu thành tâm.',
          doLech: 61,
        },
      ],
      trangThai: 'hieu_luc',
    }),
  });

  // ── Khái niệm + phản nghĩa tự sinh (8.3) ──
  const khaiNiem = e('concept_o_ue', b, 'concept', 'Ô Uế', {
    conceptual: ConceptualSchema.parse({
      giaiDoan: 'thanh_hinh',
      trongSo: rng.khoang(300, 700),
      nguon: { yChi: rng.khoang(20, 60), lapLai: rng.khoang(300, 600) },
      sacThai: { so_hai: 0.6, ghe_tom: 0.5 },
      phanNghiaId: 'concept_thanh_sach',
      cangThang: [{ khaiNiemId: 'concept_thanh_sach', doCang: 88 }],
    }),
  });

  const phanNghia = e('concept_thanh_sach', b, 'concept', 'Thanh Sạch', {
    conceptual: ConceptualSchema.parse({
      giaiDoan: 'hu_danh',
      trongSo: 0,
      phanNghiaId: 'concept_o_ue',
      cangThang: [{ khaiNiemId: 'concept_o_ue', doCang: 88 }],
    }),
  });

  // ── Thần: bản tính THẬT khác bản tính TÍN ĐỒ TIN ──
  const than = e(
    'deity_1',
    b,
    'deity',
    tenThan,
    {
      soul: SoulSchema.parse({
        tang: 't3',
        banTinh: { tuBi_tanNhan: rng.khoang(-70, -20), kieuNgao_khiemNhuong: rng.khoang(-50, 0) },
        kyUcSuyGiam: false,
      }),
      domain: DomainSchema.parse({
        domains: [{ ten: 'tay_ue', suc: rng.khoang(40, 70) }],
        khaiNiemGocId: 'concept_thanh_sach',
      }),
      venerable: VenerableSchema.parse({
        soTinDoUocLuong: rng.khoang(200, 3_000),
        matDoDen: { place_b: 0.55, place_a: 0.05 },
        hienThanh: rng.khoang(20, 60),
        banTinhTinDoTin: { tuBi_tanNhan: rng.khoang(20, 70), kieuNgao_khiemNhuong: rng.khoang(10, 50) },
        doLechDiHoa: rng.khoang(40, 80),
      }),
    },
    'Một vị thần đã bị tín đồ hiểu khác hẳn con người thật của mình.',
  );

  // ── Phàm nhân ──
  const phamNhan = e(
    'mortal_1',
    b,
    'mortal',
    tenNguoi,
    {
      soul: SoulSchema.parse({
        tang: 't2',
        banTinh: { canDam_khiepNhuoc: rng.khoang(-40, 40), tratTu_phongTung: rng.khoang(-40, 40) },
      }),
      mortal: MortalSchema.parse({
        tuoiTho: rng.khoang(55, 78),
        ageBand: 'adult',
        ngheId: 'nghe_dan_luoi',
        kyNang: { dan_luoi: rng.khoang(30, 70) },
        mucTieuDoiNguoi: ['Sống qua mùa đông này'],
      }),
    },
    'Một người sống ở vùng thứ nhất.',
  );

  const patches: PatchOp[] = [
    patchTao('entities', vungA.id, vungA, evId),
    patchTao('entities', vungB.id, vungB, evId),
    patchTao('entities', luatNen.id, luatNen, evId),
    patchTao('entities', luatThuong.id, luatThuong, evId),
    patchTao('entities', khaiNiem.id, khaiNiem, evId),
    patchTao('entities', phanNghia.id, phanNghia, evId),
    patchTao('entities', than.id, than, evId),
    patchTao('entities', phamNhan.id, phamNhan, evId),
  ];

  const lk = (id: string, tuId: string, denId: string, quanHe: string, trongSo: number): PatchOp =>
    patchTao(
      'links',
      id,
      LinkSchema.parse({ id, branchId: b, tuId, denId, quanHe, trongSo, tickTao: 0 }),
      evId,
    );

  patches.push(
    lk('lk_1', 'concept_o_ue', 'concept_thanh_sach', 'doi_nghich', 100),
    lk('lk_2', 'concept_thanh_sach', 'concept_o_ue', 'doi_nghich', 100),
    lk('lk_3', 'concept_o_ue', 'law_thuong', 'sinh_ra_tu', 85),
    lk('lk_4', 'law_thuong', 'concept_o_ue', 'sinh_ra', 85),
    lk('lk_5', 'place_a', 'law_nen', 'chiu_luat', 80),
    lk('lk_6', 'place_b', 'law_nen', 'chiu_luat', 80),
    lk('lk_7', 'place_a', 'law_thuong', 'dien_giai_sai', 34),
    lk('lk_8', 'place_b', 'law_thuong', 'dien_giai_sai', 61),
    lk('lk_9', 'deity_1', 'concept_thanh_sach', 'ket_tinh_tu', 78),
    lk('lk_10', 'mortal_1', 'place_a', 'cu_tru_tai', 95),
    lk('lk_11', 'place_a', 'mortal_1', 'la_noi_cu_tru_cua', 95),
    lk('lk_12', 'deity_1', 'place_b', 'cu_tru_tai', 60),
    lk('lk_13', 'place_b', 'deity_1', 'la_noi_cu_tru_cua', 60),
  );

  return taoEvent({
    id: evId,
    branchId: b,
    tick: 0,
    loai: 'khai_thien',
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches,
    visibility: 'engine',
    source: 'engine',
    payload: { cua: ct.cua, nguyenMau: ct.nguyenMau, motCau: ct.motCau },
  });
}

/**
 * FIXTURE. Cửa `hu_vo` và `mot_cau` cùng dùng một hạt giống; khác nhau ở chỗ
 * `mot_cau` ghi lại câu người chơi viết vào payload.
 *
 * [BB] ADR-0055 — hàm này KHÔNG còn nằm trên đường chơi. Nó tồn tại để test có
 * một thế giới đủ hình dạng mà đo; đường chơi dùng `moTheGioiTrong()`.
 */
export function moThuGioi(ct: KhoiTaoWorld): { world: World; events: readonly Event[] } {
  const w = worldRong(ct);
  return { world: w, events: [eventGieoTheGioi(ct)] };
}

// ─────────────────────────────────────────── hư vô (đường chơi)

/**
 * Event khai thiên của một thế giới RỖNG — [BB] ADR-0055.
 *
 * Không patch nào, và đó là toàn bộ ý nghĩa của nó: nó ghi vào log rằng thế giới
 * đã mở ra, cửa nào đã dùng, và người chơi đã nói câu gì — nhưng nó không đặt một
 * hòn đá nào. Nhịp 0 của một ván mới có đúng 0 entity, 0 luật, 0 khái niệm.
 *
 * Event vẫn tồn tại chứ không bị bỏ hẳn, vì `motCau` là thứ tầng 6 của prompt đọc
 * ở lượt đầu tiên, và một câu không có Event nào giữ là một câu sẽ mất khi replay.
 */
export function eventKhaiThienHuVo(ct: KhoiTaoWorld): Event {
  return taoEvent({
    id: 'ev_khai_thien',
    branchId: ct.branchId,
    tick: 0,
    loai: 'khai_thien_hu_vo',
    actorIds: [],
    targetIds: [],
    causeEventIds: [],
    locationId: null,
    patches: [],
    visibility: 'engine',
    source: 'engine',
    payload: { cua: ct.cua, nguyenMau: ct.nguyenMau, motCau: ct.motCau },
  });
}

/**
 * Mở một thế giới cho ĐƯỜNG CHƠI: hư vô, và chỉ hư vô.
 *
 * Ba cửa của 17.4 vẫn khác nhau, nhưng chúng khác nhau ở chỗ người chơi NÓI gì
 * chứ không ở chỗ engine phát sẵn bao nhiêu đồ:
 *
 *   `hu_vo`    — không nói gì; lượt kể đầu tiên diễn ra trong cái chưa có tên
 *   `mot_cau`  — một câu, và câu ấy là toàn bộ tiền đề
 *   `day_du`   — thêm nguyên mẫu sáng thế, vẫn chỉ là tiền đề
 */
export function moTheGioiTrong(ct: KhoiTaoWorld): { world: World; events: readonly Event[] } {
  return { world: worldRong(ct), events: [eventKhaiThienHuVo(ct)] };
}
