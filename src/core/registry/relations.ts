/**
 * Hai mươi hai quan hệ dựng sẵn — Phần 6.2 [MR].
 *
 * [BB] Mọi reference giữa hai entity phải có Link. `heSoTruyenBa` (0–1) là trọng số
 * dùng khi moRong() đi qua cạnh này.
 */
import type { RelationDef } from './types.js';
import { manifestCua } from './define.js';

type Nhap = {
  id: string;
  ten: string;
  doiXung: boolean;
  nghichDao?: string;
  heSoTruyenBa: number;
  tuKind?: string[];
  denKind?: string[];
};

const nguon: readonly Nhap[] = [
  { id: 'ket_tinh_tu', ten: 'kết tinh từ', doiXung: false, nghichDao: 'ket_tinh_thanh', heSoTruyenBa: 0.9 },
  {
    id: 'ket_tinh_thanh',
    ten: 'kết tinh thành',
    doiXung: false,
    nghichDao: 'ket_tinh_tu',
    heSoTruyenBa: 0.9,
  },
  { id: 'sinh_ra_tu', ten: 'sinh ra từ', doiXung: false, nghichDao: 'sinh_ra', heSoTruyenBa: 0.85 },
  { id: 'sinh_ra', ten: 'sinh ra', doiXung: false, nghichDao: 'sinh_ra_tu', heSoTruyenBa: 0.85 },
  {
    id: 'hien_than_cua',
    ten: 'hiện thân của',
    doiXung: false,
    nghichDao: 'co_hien_than',
    heSoTruyenBa: 0.95,
  },
  { id: 'co_hien_than', ten: 'có hiện thân', doiXung: false, nghichDao: 'hien_than_cua', heSoTruyenBa: 0.95 },
  { id: 'cha_me_cua', ten: 'cha mẹ của', doiXung: false, nghichDao: 'con_cua', heSoTruyenBa: 0.8 },
  { id: 'con_cua', ten: 'con của', doiXung: false, nghichDao: 'cha_me_cua', heSoTruyenBa: 0.8 },
  { id: 'phan_than_cua', ten: 'phân thân của', doiXung: false, nghichDao: 'co_phan_than', heSoTruyenBa: 0.9 },
  { id: 'co_phan_than', ten: 'có phân thân', doiXung: false, nghichDao: 'phan_than_cua', heSoTruyenBa: 0.9 },
  {
    id: 'thuoc_than_he',
    ten: 'thuộc thần hệ',
    doiXung: false,
    nghichDao: 'co_thanh_vien',
    heSoTruyenBa: 0.7,
    denKind: ['pantheon'],
  },
  {
    id: 'co_thanh_vien',
    ten: 'có thành viên',
    doiXung: false,
    nghichDao: 'thuoc_than_he',
    heSoTruyenBa: 0.7,
  },
  {
    id: 'chiu_luat',
    ten: 'chịu luật',
    doiXung: false,
    nghichDao: 'ap_len',
    heSoTruyenBa: 0.6,
    denKind: ['law'],
  },
  { id: 'ap_len', ten: 'áp lên', doiXung: false, nghichDao: 'chiu_luat', heSoTruyenBa: 0.6 },
  {
    id: 'vi_pham_luat',
    ten: 'vi phạm luật',
    doiXung: false,
    nghichDao: 'bi_vi_pham_boi',
    heSoTruyenBa: 0.75,
    denKind: ['law'],
  },
  {
    id: 'bi_vi_pham_boi',
    ten: 'bị vi phạm bởi',
    doiXung: false,
    nghichDao: 'vi_pham_luat',
    heSoTruyenBa: 0.75,
  },
  {
    id: 'khai_thac_ke_ho',
    ten: 'khai thác kẽ hở',
    doiXung: false,
    nghichDao: 'ke_ho_bi_khai_thac',
    heSoTruyenBa: 0.8,
    denKind: ['law'],
  },
  {
    id: 'ke_ho_bi_khai_thac',
    ten: 'có kẽ hở bị khai thác',
    doiXung: false,
    nghichDao: 'khai_thac_ke_ho',
    heSoTruyenBa: 0.8,
  },
  {
    id: 'tho_phung',
    ten: 'thờ phụng',
    doiXung: false,
    nghichDao: 'duoc_tho_boi',
    heSoTruyenBa: 0.85,
    denKind: ['deity'],
  },
  { id: 'duoc_tho_boi', ten: 'được thờ bởi', doiXung: false, nghichDao: 'tho_phung', heSoTruyenBa: 0.85 },
  { id: 'so_huu', ten: 'sở hữu', doiXung: false, nghichDao: 'thuoc_so_huu_cua', heSoTruyenBa: 0.7 },
  { id: 'thuoc_so_huu_cua', ten: 'thuộc sở hữu của', doiXung: false, nghichDao: 'so_huu', heSoTruyenBa: 0.7 },
  {
    id: 'cu_tru_tai',
    ten: 'cư trú tại',
    doiXung: false,
    nghichDao: 'la_noi_cu_tru_cua',
    heSoTruyenBa: 0.65,
    denKind: ['place', 'realm'],
  },
  {
    id: 'la_noi_cu_tru_cua',
    ten: 'là nơi cư trú của',
    doiXung: false,
    nghichDao: 'cu_tru_tai',
    heSoTruyenBa: 0.65,
  },
  { id: 'nho_ve', ten: 'nhớ về', doiXung: false, nghichDao: 'duoc_nho_boi', heSoTruyenBa: 0.5 },
  { id: 'duoc_nho_boi', ten: 'được nhớ bởi', doiXung: false, nghichDao: 'nho_ve', heSoTruyenBa: 0.5 },
  { id: 'nhac_den', ten: 'nhắc đến', doiXung: false, nghichDao: 'duoc_nhac_den_boi', heSoTruyenBa: 0.4 },
  {
    id: 'duoc_nhac_den_boi',
    ten: 'được nhắc đến bởi',
    doiXung: false,
    nghichDao: 'nhac_den',
    heSoTruyenBa: 0.4,
  },
  { id: 'gay_ra', ten: 'gây ra', doiXung: false, nghichDao: 'gay_ra_boi', heSoTruyenBa: 0.9 },
  { id: 'gay_ra_boi', ten: 'gây ra bởi', doiXung: false, nghichDao: 'gay_ra', heSoTruyenBa: 0.9 },
  { id: 'rang_buoc_boi', ten: 'ràng buộc bởi', doiXung: false, nghichDao: 'rang_buoc', heSoTruyenBa: 0.8 },
  { id: 'rang_buoc', ten: 'ràng buộc', doiXung: false, nghichDao: 'rang_buoc_boi', heSoTruyenBa: 0.8 },
  { id: 'doi_nghich', ten: 'đối nghịch', doiXung: true, heSoTruyenBa: 0.95 },
  {
    id: 'dien_giai_sai',
    ten: 'diễn giải sai',
    doiXung: false,
    nghichDao: 'bi_dien_giai_sai_boi',
    heSoTruyenBa: 0.7,
    denKind: ['law'],
  },
  {
    id: 'bi_dien_giai_sai_boi',
    ten: 'bị diễn giải sai bởi',
    doiXung: false,
    nghichDao: 'dien_giai_sai',
    heSoTruyenBa: 0.7,
  },
  {
    id: 'lap_lo_hong',
    ten: 'lấp lỗ hổng',
    doiXung: false,
    nghichDao: 'lo_hong_duoc_lap_boi',
    heSoTruyenBa: 0.6,
  },
  {
    id: 'lo_hong_duoc_lap_boi',
    ten: 'lỗ hổng được lấp bởi',
    doiXung: false,
    nghichDao: 'lap_lo_hong',
    heSoTruyenBa: 0.6,
  },
  { id: 'hoa_than_cua', ten: 'hóa thân của', doiXung: false, nghichDao: 'co_hoa_than', heSoTruyenBa: 0.95 },
  { id: 'co_hoa_than', ten: 'có hóa thân', doiXung: false, nghichDao: 'hoa_than_cua', heSoTruyenBa: 0.95 },
  { id: 'ke_thua_tu', ten: 'kế thừa từ', doiXung: false, nghichDao: 'duoc_ke_thua_boi', heSoTruyenBa: 0.75 },
  {
    id: 'duoc_ke_thua_boi',
    ten: 'được kế thừa bởi',
    doiXung: false,
    nghichDao: 'ke_thua_tu',
    heSoTruyenBa: 0.75,
  },
  {
    id: 'quy_ket_cho',
    ten: 'quy kết cho',
    doiXung: false,
    nghichDao: 'duoc_quy_ket',
    heSoTruyenBa: 0.85,
    denKind: ['deity'],
  },
  { id: 'duoc_quy_ket', ten: 'được quy kết', doiXung: false, nghichDao: 'quy_ket_cho', heSoTruyenBa: 0.85 },

  // ── Phase 5: địa lý và hộ (Phần 71.2, 72.4) ──
  {
    id: 'noi_lien',
    ten: 'nối liền',
    doiXung: true,
    heSoTruyenBa: 0.7,
    tuKind: ['route'],
    denKind: ['place', 'realm'],
  },
  {
    id: 'thuoc_ho',
    ten: 'thuộc hộ',
    doiXung: false,
    nghichDao: 'co_thanh_vien_ho',
    heSoTruyenBa: 0.9,
    denKind: ['household'],
  },
  {
    id: 'co_thanh_vien_ho',
    ten: 'có thành viên hộ',
    doiXung: false,
    nghichDao: 'thuoc_ho',
    heSoTruyenBa: 0.9,
    tuKind: ['household'],
  },
];

export const RELATIONS_DUNG_SAN: readonly RelationDef[] = nguon.map((n) => ({
  id: n.id,
  ten: n.ten,
  doiXung: n.doiXung,
  heSoTruyenBa: n.heSoTruyenBa,
  ...(n.nghichDao ? { nghichDao: n.nghichDao } : {}),
  ...(n.tuKind ? { tuKind: n.tuKind } : {}),
  ...(n.denKind ? { denKind: n.denKind } : {}),
  manifest: manifestCua('relation', {
    id: n.id,
    ten: n.ten,
    config: {
      doiXung: n.doiXung,
      heSoTruyenBa: n.heSoTruyenBa,
      ...(n.nghichDao ? { nghichDao: n.nghichDao } : {}),
      ...(n.tuKind ? { tuKind: n.tuKind } : {}),
      ...(n.denKind ? { denKind: n.denKind } : {}),
    },
  }),
}));

export const RELATION_IDS = RELATIONS_DUNG_SAN.map((r) => r.id);
