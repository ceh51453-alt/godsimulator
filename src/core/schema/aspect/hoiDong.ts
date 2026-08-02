/**
 * Hội đồng thần và kế vị — Phần 69.3 [BB].
 *
 * ── Vì sao thần điện cần một cái ghế ──
 *
 * Phase 6 đóng lại khi tầng Thần đã có bản ngã, lời cầu, giao ước và domain —
 * nhưng thần điện vẫn chỉ là một tập hợp: các vị thần cùng tồn tại và không có
 * quan hệ thể chế nào. Nghĩa là "kết giao, tranh kế vị, lập liên minh" của 69.3
 * không có chỗ để xảy ra, và một vị thần chết đi không để lại lỗ trống nào.
 *
 * Aspect này gắn vào entity `pantheon`. Nó cố tình mỏng: **ghế, phiếu, nghị
 * quyết, và một chỗ trống khi ghế đầu bỏ không.** Chính trị thật nảy ra từ việc
 * bốn thứ đó va vào nhau, không từ việc thêm trường.
 *
 * [BB] Không có "điểm ảnh hưởng" tự sinh. Trọng số phiếu suy từ thứ vị thần ấy
 * thật sự có — tín đồ, đền, domain — nên không ai mua được ghế bằng một con số.
 */
import { z } from 'zod';

/** Ghế trong hội đồng. `chuTich` là ghế đầu; bỏ trống thì bắt đầu tranh kế vị. */
export const VAI_HOI_DONG = ['chu_tich', 'thanh_vien', 'khach', 'bi_truc_xuat'] as const;
export type VaiHoiDong = (typeof VAI_HOI_DONG)[number];

export const NHAN_VAI_HOI_DONG: Readonly<Record<VaiHoiDong, string>> = Object.freeze({
  chu_tich: 'ngồi ghế đầu',
  thanh_vien: 'có ghế',
  khach: 'được mời, không có phiếu',
  bi_truc_xuat: 'bị đuổi khỏi hội đồng',
});

export const GheSchema = z
  .object({
    thanId: z.string(),
    vai: z.enum(VAI_HOI_DONG).prefault('thanh_vien'),
    tickNhanGhe: z.number().int().prefault(0),
    /** Uy tín trong hội đồng — mất khi phá giao ước, không phải khi thua phiếu. */
    uyTin: z.number().min(0).max(100).prefault(50),
  })
  .strict();

/** Việc hội đồng quyết được. Danh sách này ĐÓNG — thêm loại là thêm luật chơi. */
export const LOAI_NGHI_QUYET = [
  'phan_xu_tranh_domain',
  'ket_nap',
  'truc_xuat',
  'cong_nhan_ke_vi',
  'tuyen_chien',
  'lap_giao_uoc_chung',
] as const;
export type LoaiNghiQuyet = (typeof LOAI_NGHI_QUYET)[number];

export const NghiQuyetSchema = z
  .object({
    id: z.string(),
    loai: z.enum(LOAI_NGHI_QUYET),
    noiDung: z.string().max(300),
    /** Ai bị/được nghị quyết này chạm tới. */
    veThanIds: z.array(z.string()).prefault([]),
    tickMo: z.number().int(),
    tickDong: z.number().int().nullable().prefault(null),
    /** thanId → thuận. Vắng mặt KHÁC với bỏ phiếu trắng và cả hai đều được ghi. */
    phieu: z.record(z.string(), z.enum(['thuan', 'chong', 'trang'])).prefault({}),
    ketQua: z.enum(['dang_ban', 'thong_qua', 'bac_bo', 'khong_du_phieu']).prefault('dang_ban'),
  })
  .strict();

/**
 * Luật kế vị. Đây là chỗ một cái chết thành một cuộc khủng hoảng.
 *
 * `manh_nhat` không phải "sức mạnh" theo nghĩa đánh nhau — engine đọc quy kết
 * domain, tức là ai đang được thế giới coi là có thẩm quyền.
 */
export const LUAT_KE_VI = ['bau_phieu', 'huyet_thong', 'manh_nhat', 'chi_dinh', 'khong_co'] as const;
export type LuatKeVi = (typeof LUAT_KE_VI)[number];

export const HoiDongSchema = z
  .object({
    ten: z.string().prefault(''),
    ghe: z.array(GheSchema).prefault([]),
    nghiQuyet: z.array(NghiQuyetSchema).max(32).prefault([]),
    luatKeVi: z.enum(LUAT_KE_VI).prefault('bau_phieu'),
    /** Người ngồi ghế đầu chỉ định; chỉ có nghĩa khi `luatKeVi = 'chi_dinh'`. */
    keThuaChiDinhId: z.string().nullable().prefault(null),
    /** Ghế đầu đang trống từ nhịp nào. `null` nghĩa là có người ngồi. */
    tickGheDauTrong: z.number().int().nullable().prefault(null),
    /** Tỉ lệ phiếu thuận cần để một nghị quyết đi qua. */
    nguongThongQua: z.number().min(0.5).max(1).prefault(0.6),
  })
  .prefault({});

export type Ghe = z.infer<typeof GheSchema>;
export type NghiQuyet = z.infer<typeof NghiQuyetSchema>;
export type HoiDong = z.infer<typeof HoiDongSchema>;

/** Ai đang có phiếu. Khách và kẻ bị trục xuất thì không. */
export function coPhieu(g: Ghe): boolean {
  return g.vai === 'chu_tich' || g.vai === 'thanh_vien';
}

/**
 * Đếm phiếu. Trả `khong_du_phieu` khi quá nửa số ghế không tới — vắng mặt tập
 * thể là một câu trả lời chính trị, và gộp nó vào "bác bỏ" sẽ làm mất câu ấy.
 */
export function demPhieu(hd: HoiDong, nq: NghiQuyet): NghiQuyet['ketQua'] {
  const cuTri = hd.ghe.filter(coPhieu);
  if (cuTri.length === 0) return 'khong_du_phieu';

  let thuan = 0;
  let chong = 0;
  let daBo = 0;
  for (const g of cuTri) {
    const p = nq.phieu[g.thanId];
    if (p === undefined) continue;
    daBo++;
    if (p === 'thuan') thuan++;
    else if (p === 'chong') chong++;
  }
  if (daBo * 2 <= cuTri.length) return 'khong_du_phieu';
  const hopLe = thuan + chong;
  if (hopLe === 0) return 'khong_du_phieu';
  return thuan / hopLe >= hd.nguongThongQua ? 'thong_qua' : 'bac_bo';
}
