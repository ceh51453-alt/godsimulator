/**
 * Xưởng Preset — máy trạng thái bảy màn và báo cáo sau nhập. Phần 66.1, 66.2.
 *
 * ── Vì sao máy trạng thái nằm ở `core/` chứ không ở component ──
 *
 * [BB] 66.1: "Mỗi màn quay lại được mà không parse lại raw source." Một wizard
 * viết bằng `useState` sẽ parse lại mỗi lần render, và với file 700 kB thì người
 * dùng bấm "Quay lại" là màn hình đứng hình nửa giây. Nên toàn bộ kết quả nhập
 * được tính **một lần** và giữ trong một giá trị bất biến; bảy màn chỉ là bảy
 * cách đọc giá trị ấy.
 *
 * [BB] 66.1: màn 1 **không có nút "Nhập và bật"**. Nhập và kích hoạt là hai việc,
 * cách nhau đúng bảy màn, và kiểu dữ liệu ở đây phản ánh điều đó: `TrangThaiWizard`
 * không có trường nào tên là `activation`.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { KetQuaNhap } from './nhap.js';
import type { ActivationState } from './schema.js';

export const MAN_WIZARD = [
  'chon_file',
  'nhan_dien',
  'an_toan',
  'anh_xa',
  'xung_dot',
  'xem_truoc',
  'nhap_thu_vien',
] as const;
export type ManWizard = (typeof MAN_WIZARD)[number];

export const TEN_MAN: Readonly<Record<ManWizard, string>> = Object.freeze({
  chon_file: 'Chọn file',
  nhan_dien: 'Nhận diện',
  an_toan: 'An toàn',
  anh_xa: 'Ánh xạ',
  xung_dot: 'Xung đột',
  xem_truoc: 'Xem trước',
  nhap_thu_vien: 'Nhập thư viện',
});

export type TrangThaiWizard = {
  readonly man: ManWizard;
  /** `null` ở màn 1. Từ màn 2 trở đi luôn có, và KHÔNG bao giờ được tính lại. */
  readonly ketQua: KetQuaNhap | null;
  /** Module người dùng chọn bật. Rỗng nghĩa là chưa chọn gì — không phải "chọn tất". */
  readonly chonModuleIds: readonly string[];
  readonly giaiXungDot: Readonly<Record<string, unknown>>;
  /** Đã bấm "Nhập thư viện" chưa. Kích hoạt là bước SAU, không thuộc wizard. */
  readonly daNhapThuVien: boolean;
};

export function wizardMoi(): TrangThaiWizard {
  return {
    man: 'chon_file',
    ketQua: null,
    chonModuleIds: [],
    giaiXungDot: {},
    daNhapThuVien: false,
  };
}

/**
 * Nạp kết quả pipeline vào wizard và nhảy tới màn phù hợp.
 *
 * Pipeline dừng sớm thì wizard dừng ở màn tương ứng: hỏng ở bước 2–4 thì dừng ở
 * "Nhận diện", hỏng ở bước 5–8 thì dừng ở "An toàn". Người dùng thấy đúng chỗ
 * hỏng thay vì bị đẩy tới màn cuối rồi báo lỗi chung chung.
 */
export function napKetQua(tt: TrangThaiWizard, kq: KetQuaNhap): TrangThaiWizard {
  const man: ManWizard =
    kq.dungOBuoc <= 4 ? 'nhan_dien' : kq.dungOBuoc <= 8 ? 'an_toan' : kq.ok ? 'xem_truoc' : 'xung_dot';
  /**
   * Mặc định chọn đúng những module vừa `enabled` vừa chạy được.
   *
   * Không chọn cả pack: 63.3 quy tắc 5 đã cố ý tắt các prompt ngoài order, và
   * "chọn tất" sẽ hoàn tác đúng quyết định đó ngay lập tức.
   */
  const chon = (kq.row?.pack.modules ?? [])
    .filter((m) => m.enabled && (m.activation === 'native' || m.activation === 'adapted'))
    .map((m) => m.id);
  return { ...tt, man, ketQua: kq, chonModuleIds: chon };
}

/** Màn nào đi được từ màn hiện tại — dùng để vẽ nút và để test đường đi. */
export function manKeTiep(tt: TrangThaiWizard): ManWizard | null {
  if (tt.ketQua === null) return null;
  const i = MAN_WIZARD.indexOf(tt.man);
  if (i < 0 || i >= MAN_WIZARD.length - 1) return null;
  if (!tt.ketQua.ok && tt.man !== 'chon_file') return null;
  return MAN_WIZARD[i + 1] as ManWizard;
}

export function manTruocDo(tt: TrangThaiWizard): ManWizard | null {
  const i = MAN_WIZARD.indexOf(tt.man);
  return i <= 0 ? null : (MAN_WIZARD[i - 1] as ManWizard);
}

/** Đi tới một màn. [BB] Không đụng `ketQua` — quay lại KHÔNG parse lại raw source. */
export function diToi(tt: TrangThaiWizard, man: ManWizard): TrangThaiWizard {
  return { ...tt, man };
}

export function datChon(tt: TrangThaiWizard, ids: readonly string[]): TrangThaiWizard {
  return { ...tt, chonModuleIds: [...ids] };
}

export function giaiMotXungDot(tt: TrangThaiWizard, khoa: string, chon: unknown): TrangThaiWizard {
  return { ...tt, giaiXungDot: { ...tt.giaiXungDot, [khoa]: chon } };
}

// ─────────────────────────────────────────── báo cáo 66.2

export type BaoCaoNhap = {
  readonly daDoc: string;
  readonly hoatDong: string;
  readonly canChon: string;
  readonly canAdapter: string;
  /** Script Tavern Helper của pack: có bao nhiêu, bao nhiêu bật sẵn ở nguồn. */
  readonly script: string;
  readonly thamSo: string;
  readonly kichHoat: string;
  /** Mọi dòng, theo đúng thứ tự 66.2 — dùng cho UI và cho test. */
  readonly dong: readonly (readonly [string, string])[];
};

/**
 * Báo cáo sau nhập — 66.2.
 *
 * [BB] "Không dùng một dấu check xanh duy nhất cho cả file." Nên báo cáo là **sáu
 * dòng số**, mỗi dòng nói về một chuyện khác nhau, và dòng cuối luôn là
 * "Kích hoạt: Chưa" cho tới khi có `PresetActivation` thật.
 */
export function baoCaoNhap(kq: KetQuaNhap, daKichHoat = false): BaoCaoNhap {
  const tk = kq.thongKe;
  const row = kq.row;
  const dem = (tt: ActivationState): number =>
    row?.pack.modules.filter((m) => m.activation === tt).length ?? 0;

  const soMacroCanAdapter = new Set<string>();
  for (const m of row?.pack.modules ?? []) {
    for (const x of (m.sourceMeta['macroCanAdapter'] as string[] | undefined) ?? []) soMacroCanAdapter.add(x);
  }
  const soTransformCanAdapter =
    row?.transformDefs.filter((t) => t.activation === 'needs_adapter').length ?? 0;

  const thamSoTheo = (tt: 'giu_nguyen' | 'bi_gioi_han' | 'khong_ho_tro'): number =>
    kq.thamSo.filter((t) => t.trangThai === tt).length;

  const daDoc =
    tk === null ? '—' : `${tk.soPrompt} prompt · ${tk.soRegex} regex · ${tk.soHelper} helper script`;
  const hoatDong = `${dem('native')} native · ${dem('adapted')} adapted`;
  const canChon = `${kq.nhom.filter((n) => n.canNguoiChon).length} nhóm xung đột`;
  const canAdapter = `${soMacroCanAdapter.size} macro · ${soTransformCanAdapter} transform`;
  const soScript = row?.scripts.length ?? 0;
  const soScriptBat = row?.scripts.filter((s) => s.batONguon).length ?? 0;
  const script = `${soScript} script · ${soScriptBat} bật sẵn ở nguồn`;
  const thamSo =
    `${thamSoTheo('giu_nguyen')} giữ nguyên · ${thamSoTheo('bi_gioi_han')} bị giới hạn bởi model · ` +
    `${thamSoTheo('khong_ho_tro')} không hỗ trợ`;
  const kichHoat = daKichHoat ? 'Rồi' : 'Chưa';

  return {
    daDoc,
    hoatDong,
    canChon,
    canAdapter,
    script,
    thamSo,
    kichHoat,
    dong: Object.freeze([
      ['Đã đọc', daDoc],
      ['Hoạt động', hoatDong],
      ['Cần chọn', canChon],
      ['Cần adapter', canAdapter],
      ['Script', script],
      ['Tham số', thamSo],
      ['Kích hoạt', kichHoat],
    ] as const),
  };
}

/** Issue của một màn — wizard hiện đúng thứ liên quan tới màn đang mở. */
export function issueCuaMan(kq: KetQuaNhap, man: ManWizard): ImportIssue[] {
  const theoMa = (ma: readonly string[]): ImportIssue[] => kq.issues.filter((i) => ma.includes(i.code));
  switch (man) {
    case 'nhan_dien':
      return theoMa([
        'KHONG_NHAN_RA_DINH_DANG',
        'GOC_KHONG_PHAI_OBJECT',
        'FILE_QUA_LON',
        'JSON_HONG',
        'JSON_QUA_SAU',
        'UTF8_HONG',
        'DA_NHAP_TRUOC_DO',
        'THIEU_PROMPT_ORDER',
        'DINH_DANG_CHUA_CO_DUONG_NHAP',
      ]);
    case 'an_toan':
      return theoMa([
        'KHOA_NGUY_HIEM',
        'CO_HINH_DANG_SECRET',
        'CO_URL_NGOAI',
        'SCRIPT_TAI_TU_XA',
        'REGEX_CAN_ADAPTER',
        'MODULE_NGOAI_LOT_VAO_PIPELINE_CAM',
      ]);
    case 'anh_xa':
      return theoMa([
        'ENABLED_MISMATCH',
        'UNORDERED_PROMPT',
        'ORDER_DANGLING',
        'IDENTIFIER_TRUNG',
        'NHIEU_KHOI_ORDER',
        'BLOCK_QUA_DAI',
        'MACRO_CAN_ADAPTER',
        'GLOBAL_VAR_DOI_PHAM_VI',
      ]);
    case 'xung_dot':
      return theoMa(['DEPENDENCY_CYCLE', 'PHU_THUOC_THIEU', 'XUNG_DOT_CHUA_GIAI', 'MACRO_CYCLE']);
    case 'xem_truoc':
      return theoMa(['CAT_VI_NGAN_SACH', 'PREFILL_KHONG_HO_TRO', 'PACK_NGOAI_KHONG_VAO_PIPELINE_NAY']);
    default:
      return [];
  }
}
