/**
 * Tám registry còn lại: gap, action, ending, metric, profile, storyKind,
 * mechanism, worldProcess.
 *
 * Phase 0 khai đủ mười hai registry (cổng 61.1 #2) với manifest thuần dữ liệu.
 * Handler runtime nối dần ở Phase 1/3/5 qua HandlerCatalog.
 */
import { z } from 'zod';
import type {
  GapDef,
  ActionDef,
  EndingDef,
  MetricDef,
  ProfileDef,
  StoryKindDef,
  MechanismDef,
  WorldProcessDef,
  PhamViTienTrinh,
  DonViNhip,
  DoPhanGiai,
  KhaiBaoBaoToan,
} from './types.js';
import type { StatePath } from '../contracts/primitives.js';
import { manifestCua } from './define.js';
import { ModelProfileSchema } from '../schema/ai.js';

// ─────────────────────────────────────────── gap (Phần 15)

const gapNguon: readonly { id: string; ten: string; moTa: string; uuTien: number; biAn: boolean }[] = [
  {
    id: 'mo_coi',
    ten: 'Thực thể mồ côi',
    moTa: '_degree === 0 sau khi tạo. Không có thực thể mồ côi.',
    uuTien: 80,
    biAn: false,
  },
  {
    id: 'luat_khong_hieu_luc',
    ten: 'Luật chưa từng kích hoạt',
    moTa: 'Luật có hiệu lực nhưng chưa lần nào chạm sự kiện thật.',
    uuTien: 60,
    biAn: true,
  },
  {
    id: 'khai_niem_khong_nguon',
    ten: 'Khái niệm không nguồn',
    moTa: 'Có trọng số nhưng không truy được về sự kiện nào.',
    uuTien: 55,
    biAn: true,
  },
  {
    id: 'than_khong_tin_do',
    ten: 'Thần không tín đồ',
    moTa: 'Có domain nhưng không ai thờ và không ai nhớ.',
    uuTien: 50,
    biAn: true,
  },
  {
    id: 'noi_khong_dan',
    ten: 'Nơi chốn trống',
    moTa: 'Địa danh có tên nhưng không dân, không sự kiện.',
    uuTien: 40,
    biAn: true,
  },
  {
    id: 'quan_he_mot_chieu',
    ten: 'Quan hệ một chiều',
    moTa: 'Link thiếu cạnh ngược mà RelationDef đòi hỏi.',
    uuTien: 70,
    biAn: false,
  },
  {
    id: 'seo_chua_lanh',
    ten: 'Vết sẹo chưa thành hình',
    moTa: 'Thực thể bị THU nhưng chưa có hệ quả nào trong thế giới.',
    uuTien: 65,
    biAn: true,
  },
];

export const GAPS_DUNG_SAN: readonly GapDef[] = gapNguon.map((g) => ({
  id: g.id,
  ten: g.ten,
  moTa: g.moTa,
  uuTienMacDinh: g.uuTien,
  choPhepThanhBiAn: g.biAn,
  manifest: manifestCua('gap', {
    id: g.id,
    ten: g.ten,
    moTa: g.moTa,
    handlerId: `gap.${g.id}`,
    config: { uuTienMacDinh: g.uuTien, choPhepThanhBiAn: g.biAn },
  }),
}));

// ─────────────────────────────────────────── action (Phần 23)

const actionNguon: readonly {
  id: string;
  ten: string;
  moTa: string;
  tang: readonly ('t0' | 't1' | 't2' | 't3')[];
}[] = [
  { id: 'lam_viec', ten: 'Làm việc', moTa: 'Theo nghề và lịch của mình.', tang: ['t1', 't2', 't3'] },
  {
    id: 'cau_nguyen',
    ten: 'Cầu nguyện',
    moTa: 'Gửi lời cầu tới một vị thần khi bế tắc.',
    tang: ['t1', 't2', 't3'],
  },
  {
    id: 'di_chuyen',
    ten: 'Di chuyển',
    moTa: 'Đi tới một nơi khác theo tuyến đường có thật.',
    tang: ['t1', 't2', 't3'],
  },
  {
    id: 'noi_chuyen',
    ten: 'Nói chuyện',
    moTa: 'Truyền tri thức — và truyền cả bản đã méo.',
    tang: ['t2', 't3'],
  },
  { id: 'hoc', ten: 'Học', moTa: 'Tăng kỹ năng qua thời gian và người dạy có thật.', tang: ['t2', 't3'] },
  { id: 'trao_doi', ten: 'Trao đổi', moTa: 'Đổi vật chất, tạo claim hoặc debt.', tang: ['t1', 't2', 't3'] },
  {
    id: 'lam_nghi_le',
    ten: 'Làm nghi lễ',
    moTa: 'Thực hiện nghi lễ vùng mình, dù nó có tác dụng hay không.',
    tang: ['t1', 't2', 't3'],
  },
  {
    id: 'phan_khang',
    ten: 'Phản kháng',
    moTa: 'Chống lại luật, thiết chế hoặc thần — có hệ quả thật.',
    tang: ['t2', 't3'],
  },
];

export const ACTIONS_DUNG_SAN: readonly ActionDef[] = actionNguon.map((a) => ({
  id: a.id,
  ten: a.ten,
  moTa: a.moTa,
  tangApDung: a.tang,
  thamSo: z.object({ mucTieuId: z.string().nullable().prefault(null) }).strict(),
  manifest: manifestCua('action', {
    id: a.id,
    ten: a.ten,
    moTa: a.moTa,
    handlerId: `action.${a.id}`,
    schemaRef: 'params.empty',
    config: { tangApDung: [...a.tang] },
  }),
}));

// ─────────────────────────────────────────── ending (Phần 27)

const endingNguon: readonly { id: string; ten: string; vanBan: string }[] = [
  {
    id: 'nghich_ly_toan_phan',
    ten: 'Nghịch Lý Toàn Phần',
    vanBan: 'realityIntegrity chạm 0. Thế giới không còn giữ nổi hai phiên bản của chính nó.',
  },
  {
    id: 'the_gioi_dung_yen',
    ten: 'Thế Giới Đứng Yên',
    vanBan: 'doPhuThuocTB vượt ngưỡng ở mọi vùng. Không ai còn tự quyết định gì nữa.',
  },
  {
    id: 'ke_thu_thang',
    ten: 'Kẻ Thù Thắng',
    vanBan: 'Thứ phủ định trật tự đã trỗi dậy lần cuối và không ai đẩy lui được.',
  },
  {
    id: 'than_rut_lui',
    ten: 'Thần Rút Lui',
    vanBan: 'Không thần nào còn tín đồ. Thế giới tiếp tục chạy, chỉ là không còn ai nghe.',
  },
  {
    id: 'tu_van_hanh',
    ten: 'Tự Vận Hành',
    vanBan:
      'tuSinhSuKien gần chạm trần suốt nhiều kỷ nguyên. Thế giới không cần bạn nữa — và đó là kết cục tốt nhất.',
  },
];

export const ENDINGS_DUNG_SAN: readonly EndingDef[] = endingNguon.map((e) => ({
  id: e.id,
  ten: e.ten,
  vanBan: e.vanBan,
  manifest: manifestCua('ending', {
    id: e.id,
    ten: e.ten,
    handlerId: `ending.${e.id}`,
    config: { vanBan: e.vanBan },
  }),
}));

// ─────────────────────────────────────────── metric (Phần 13)

const metricNguon: readonly {
  id: string;
  truong: string;
  ten: string;
  moTa: string;
  min: number;
  max: number;
  macDinh: number;
  cuoiKyNguyen: boolean;
}[] = [
  {
    id: 'reality_integrity',
    truong: 'realityIntegrity',
    ten: 'Toàn Vẹn Thực Tại',
    moTa: 'Dưới 60 sinh vùng Nghịch Lý; bằng 0 là kết cục.',
    min: 0,
    max: 100,
    macDinh: 100,
    cuoiKyNguyen: false,
  },
  {
    id: 'do_song_dong',
    truong: 'doSongDong',
    ten: 'Độ Sống Động',
    moTa: '[BB] Chỉ hiện cuối kỷ nguyên — để phản tỉnh, không để tối ưu.',
    min: 0,
    max: 100,
    macDinh: 50,
    cuoiKyNguyen: true,
  },
  {
    id: 'agency_trung_binh',
    truong: 'agencyTrungBinh',
    ten: 'Tự Quyết Trung Bình',
    moTa: 'Tỷ lệ hành động NPC tự chọn trên cửa sổ trượt 50 tick.',
    min: 0,
    max: 100,
    macDinh: 100,
    cuoiKyNguyen: true,
  },
  {
    id: 'do_phu_thuoc_tb',
    truong: 'doPhuThuocTB',
    ten: 'Phụ Thuộc Trung Bình',
    moTa: 'Vùng trên 70 gần như đứng yên trong utility AI.',
    min: 0,
    max: 100,
    macDinh: 0,
    cuoiKyNguyen: true,
  },
  {
    id: 'tu_sinh_su_kien',
    truong: 'tuSinhSuKien',
    ten: 'Tự Sinh Sự Kiện',
    moTa: '% sự kiện lớn KHÔNG do người chơi gây ra.',
    min: 0,
    max: 100,
    macDinh: 100,
    cuoiKyNguyen: true,
  },
  {
    id: 'mat_do_lien_ket',
    truong: 'matDoLienKet',
    ten: 'Mật Độ Liên Kết',
    moTa: 'Số cạnh trung bình mỗi entity.',
    min: 0,
    max: 1_000,
    macDinh: 0,
    cuoiKyNguyen: true,
  },
  {
    id: 'da_dang_khai_niem',
    truong: 'daDangKhaiNiem',
    ten: 'Đa Dạng Khái Niệm',
    moTa: 'Độ phong phú của không gian khái niệm đang sống.',
    min: 0,
    max: 100,
    macDinh: 0,
    cuoiKyNguyen: true,
  },
];

export const METRICS_DUNG_SAN: readonly MetricDef[] = metricNguon.map((m) => ({
  id: m.id,
  ten: m.ten,
  moTa: m.moTa,
  truongWorldMetrics: m.truong,
  min: m.min,
  max: m.max,
  macDinh: m.macDinh,
  chiHienCuoiKyNguyen: m.cuoiKyNguyen,
  manifest: manifestCua('metric', {
    id: m.id,
    ten: m.ten,
    moTa: m.moTa,
    handlerId: `metric.${m.id}`,
    config: {
      truongWorldMetrics: m.truong,
      min: m.min,
      max: m.max,
      macDinh: m.macDinh,
      chiHienCuoiKyNguyen: m.cuoiKyNguyen,
    },
  }),
}));

// ─────────────────────────────────────────── profile (Phần 31.2)

const profileNguon = [
  ModelProfileSchema.parse({
    id: 'gemini-3.1-pro',
    ten: 'Gemini 3.1 Pro',
    khop: { chua: ['gemini-3.1-pro', 'gemini-3-1-pro'] },
    gioiHan: {
      contextMax: 1_048_576,
      outputMax: 65_536,
      outputMacDinhCuaApi: 8_192,
      temperatureMax: 2,
      topKMax: 64,
      thinkingBudgetMax: 24_576,
    },
    hoTro: {
      thinkingLevel: true,
      thinkingBudget: true,
      mediaResolution: true,
      structuredOutput: true,
      promptCache: true,
      seed: true,
      stopSequences: 5,
    },
    tyLeToken: 2.6,
  }),
  ModelProfileSchema.parse({
    id: 'khong_ro',
    ten: 'Model chưa nhận diện',
    khop: { chua: [] },
    gioiHan: { contextMax: 32_768, outputMax: 4_096, outputMacDinhCuaApi: 4_096 },
    hoTro: {},
    tyLeToken: 3.2,
    nguon: 'dung_san',
  }),
] as const;

export const PROFILES_DUNG_SAN: readonly ProfileDef[] = profileNguon.map((p) => ({
  id: p.id,
  ten: p.ten,
  profile: p,
  manifest: manifestCua('profile', {
    id: p.id,
    ten: p.ten,
    schemaRef: 'modelProfile',
    config: JSON.parse(JSON.stringify(p)) as Record<string, unknown>,
  }),
}));

// ─────────────────────────────────────────── storyKind (Phần 28)

const storyNguon: readonly {
  id: string;
  ten: string;
  moTa: string;
  nhip: number;
  vaiTro: string[];
  canNguoiChoi: boolean;
}[] = [
  {
    id: 'ke_vi',
    ten: 'Kế Vị',
    moTa: 'Ai nối ngôi, và cái giá của việc nối ngôi.',
    nhip: 40,
    vaiTro: ['nguoi_ke_vi', 'ke_tranh_ngoi', 'nguoi_bao_tro'],
    canNguoiChoi: false,
  },
  {
    id: 'ly_giao',
    ten: 'Ly Giáo',
    moTa: 'Giáo lý phân nhánh vì một lần can thiệp bị hiểu sai.',
    nhip: 60,
    vaiTro: ['nguoi_giu_giao_ly', 'nguoi_cai_cach', 'nan_nhan'],
    canNguoiChoi: false,
  },
  {
    id: 'di_cu',
    ten: 'Di Cư',
    moTa: 'Một cộng đồng phải rời đi vì điều kiện sống đổi.',
    nhip: 30,
    vaiTro: ['nguoi_dan_duong', 'nguoi_o_lai', 'chu_dat_moi'],
    canNguoiChoi: false,
  },
  {
    id: 'bao_thu',
    ten: 'Báo Thù',
    moTa: 'Một món nợ máu đi qua nhiều đời.',
    nhip: 50,
    vaiTro: ['nguoi_bao_thu', 'muc_tieu', 'nguoi_can'],
    canNguoiChoi: false,
  },
  {
    id: 'phat_kien',
    ten: 'Phát Kiến',
    moTa: 'Ai đó tìm ra kẽ hở của một luật, và cả nền văn minh đổi theo.',
    nhip: 80,
    vaiTro: ['nguoi_phat_kien', 'nguoi_ngan_can', 'nguoi_huong_loi'],
    canNguoiChoi: false,
  },
  {
    id: 'tranh_domain',
    ten: 'Tranh Domain',
    moTa: 'Hai thần cùng tuyên một sự kiện lớn.',
    nhip: 45,
    vaiTro: ['than_tuyen', 'than_doi', 'vung_quy_ket'],
    canNguoiChoi: false,
  },
  {
    id: 'troi_day',
    ten: 'Trỗi Dậy',
    moTa: 'Kẻ thù vĩnh cửu đến hạn theo nhịp của nó.',
    nhip: 120,
    vaiTro: ['ke_thu', 'lien_minh', 'nguoi_tien_tri'],
    canNguoiChoi: false,
  },
  {
    id: 'doi_thuong',
    ten: 'Đời Thường',
    moTa: 'Một mùa gặt, một đám cưới, một cái chết không ai ghi lại.',
    nhip: 12,
    vaiTro: ['nguoi_trong_cuoc', 'lang_gieng'],
    canNguoiChoi: false,
  },

  // ── Phase 8: sáu loại còn thiếu của bảng 28.3 (ADR-0037) ──

  {
    id: 'chien_tranh',
    ten: 'Chiến Tranh',
    moTa: 'Hai phe tranh tài nguyên hoặc lãnh địa, và đã thôi tin nhau.',
    nhip: 20,
    vaiTro: ['ben_khoi_binh', 'ben_chong_do', 'nguoi_o_giua'],
    canNguoiChoi: false,
  },
  {
    id: 'am_muu',
    ten: 'Âm Mưu',
    moTa: 'Một người thấy chỗ luật không với tới, và không nói cho ai biết đủ.',
    nhip: 35,
    vaiTro: ['ke_bay', 'ke_bi_bay', 'nguoi_biet_mot_phan'],
    canNguoiChoi: false,
  },
  {
    id: 'tinh_ai',
    ten: 'Tình Ái',
    moTa: 'Hai người muốn ở gần nhau, và có một luật hoặc một phe không cho.',
    nhip: 25,
    vaiTro: ['nguoi_yeu', 'nguoi_duoc_yeu', 'thu_can_tro'],
    canNguoiChoi: false,
  },
  {
    id: 'kham_pha',
    ten: 'Khám Phá',
    moTa: 'Có một bí ẩn, và có một người không chịu để yên nó.',
    nhip: 45,
    vaiTro: ['nguoi_di_tim', 'thu_bi_tim', 'nguoi_can'],
    canNguoiChoi: false,
  },
  {
    id: 'suy_tan',
    ten: 'Suy Tàn',
    moTa: 'Một vị thần nhạt dần, và phần khó nhất là ngài vẫn còn đó.',
    nhip: 90,
    vaiTro: ['than_suy', 'tin_do_cuoi', 'ke_thua_cho'],
    canNguoiChoi: false,
  },
  {
    id: 'phan_boi',
    ten: 'Phản Bội',
    moTa: 'Tin cậy còn cao trong khi tình cảm đã tụt — đúng khe hở giữa hai trục.',
    nhip: 30,
    vaiTro: ['ke_se_phan', 'nguoi_con_tin', 'nguoi_thay_truoc'],
    canNguoiChoi: false,
  },

  // ── Phase 10: hai loại mà Khối L đòi tường minh ──

  {
    // [BB] 43.2 — khoảnh khắc một trục nền chuyển từ vô danh sang có tên.
    id: 'dat_ten',
    ten: 'Đặt Tên',
    moTa: 'Có kẻ gọi tên một thứ mà cả thế giới vẫn luôn sống trong đó mà không biết.',
    nhip: 100,
    vaiTro: ['nguoi_dat_ten', 'thu_duoc_dat_ten', 'nguoi_khong_tin'],
    canNguoiChoi: false,
  },
  {
    // [BB] 42.5 — hồi sinh một luật đã chết bằng cách nuôi lại khái niệm nền.
    id: 'phuc_hung',
    ten: 'Phục Hưng',
    moTa: 'Một điều luật bị lãng quên sống lại vì có người dựng lại nghi lễ cũ.',
    nhip: 70,
    vaiTro: ['nguoi_phuc_dung', 'luat_da_chet', 'nguoi_ngan_can'],
    canNguoiChoi: false,
  },
];

export const STORY_KINDS_DUNG_SAN: readonly StoryKindDef[] = storyNguon.map((s) => ({
  id: s.id,
  ten: s.ten,
  moTa: s.moTa,
  nhipMacDinh: s.nhip,
  vaiTro: s.vaiTro,
  canNguoiChoi: s.canNguoiChoi,
  manifest: manifestCua('storyKind', {
    id: s.id,
    ten: s.ten,
    moTa: s.moTa,
    handlerId: `story.${s.id}`,
    config: { nhipMacDinh: s.nhip, vaiTro: s.vaiTro, canNguoiChoi: s.canNguoiChoi },
  }),
}));

// ─────────────────────────────────────────── mechanism (Phần 44)

const mechNguon: readonly { id: string; ten: string; moTa: string; luatNen: string[] }[] = [
  {
    id: 'lan_truyen_o_ue',
    ten: 'Lan truyền ô uế',
    moTa: 'Cơ chế phái sinh khi văn hóa đóng băng một suy luận sai thành thuộc tính vật lý.',
    luatNen: ['nhan_qua'],
  },
  {
    id: 'suy_giam_ky_uc',
    ten: 'Suy giảm ký ức',
    moTa: 'Ký ức mờ theo thời gian, trừ thực thể có kyUcSuyGiam = false.',
    luatNen: ['thoi_gian'],
  },
  {
    id: 'truyen_tin_bop_meo',
    ten: 'Truyền tin bóp méo',
    moTa: 'Mỗi chặng truyền làm tin sai thêm theo hướng có lợi cho phe kể.',
    luatNen: ['thong_tin'],
  },
  {
    id: 'bao_toan_vat_chat',
    ten: 'Bảo toàn vật chất',
    moTa: 'Vật chất không tự sinh; sản xuất phải có nguồn.',
    luatNen: ['vat_chat'],
  },
];

export const MECHANISMS_DUNG_SAN: readonly MechanismDef[] = mechNguon.map((m) => ({
  id: m.id,
  ten: m.ten,
  moTa: m.moTa,
  luatNenIds: m.luatNen,
  thamSo: z.object({ heSo: z.number().prefault(1) }).strict(),
  manifest: manifestCua('mechanism', {
    id: m.id,
    ten: m.ten,
    moTa: m.moTa,
    handlerId: `mechanism.${m.id}`,
    config: { luatNenIds: m.luatNen },
  }),
}));

// ─────────────────────────────────────────── worldProcess (Phần 71)

/**
 * Mười hai tiến trình nền tối thiểu của Phần 71.2, khai theo đúng hợp đồng 71.1.
 *
 * `doc`/`ghi` là **StatePath thật**, không phải tên bảng chung chung: scheduler
 * của 71.4 dựng đồ thị phụ thuộc từ chúng, và một khai báo rộng quá mức
 * (`{table:'entities', path:''}`) sẽ biến mọi tiến trình thành một chuỗi tuần tự.
 *
 * `uuTien` chỉ có nghĩa khi hai tiến trình `set` cùng một path. Thang: hệ nào
 * gần vật lý hơn thì cao hơn — thời gian > sinh thái > dân số > kinh tế > xã hội.
 */
const sp = (table: string, path: string): StatePath => ({ table, path });

const A = 'aspects';

type WpNhap = {
  id: string;
  ten: string;
  moTa: string;
  phamVi: PhamViTienTrinh;
  nhip: { unit: DonViNhip; every: number; eventTypes?: string[] };
  buoc: number;
  doc: StatePath[];
  ghi: StatePath[];
  batBien: string[];
  phanGiai: DoPhanGiai;
  uuTien: number;
  baoToan?: KhaiBaoBaoToan[];
};

const wpNguon: readonly WpNhap[] = [
  {
    id: 'environment_cycle',
    ten: 'Chu kỳ môi trường',
    moTa: 'Mùa, thời tiết, nước, đất, thiên tai. Đồng hồ của mọi tiến trình khác.',
    phamVi: 'world',
    nhip: { unit: 'tick', every: 1 },
    buoc: 1,
    doc: [sp('worlds', 'tick')],
    ghi: [sp('worlds', 'year'), sp('entities', `${A}.sinh_thai.suyThoai`)],
    batBien: ['tick_khong_lui', 'nam_khop_tick'],
    phanGiai: 'macro',
    uuTien: 100,
  },
  {
    id: 'ecology',
    ten: 'Sinh thái',
    moTa: 'Quần thể sinh vật, thức ăn, suy thoái và phục hồi. Nguồn của mọi vật chất.',
    phamVi: 'place',
    nhip: { unit: 'tick', every: 1 },
    buoc: 1,
    doc: [sp('entities', `${A}.sinh_thai.sucChua`), sp('entities', `${A}.sinh_thai.suyThoai`)],
    ghi: [sp('entities', `${A}.sinh_thai.taiNguyen`), sp('entities', `${A}.sinh_thai.soCai`)],
    batBien: ['tai_nguyen_khong_am', 'tai_nguyen_khong_vuot_suc_chua'],
    phanGiai: 'macro',
    uuTien: 90,
  },
  {
    id: 'population_household',
    ten: 'Dân số & hộ',
    moTa: 'Sinh, chết, hộ, chăm sóc, thế hệ.',
    phamVi: 'place',
    nhip: { unit: 'tick', every: 1 },
    buoc: 1,
    doc: [
      sp('entities', `${A}.dan_cu.cohort`),
      sp('entities', `${A}.kinh_te.thieuHut`),
      sp('entities', `${A}.y_te.tyLeMac`),
    ],
    ghi: [
      sp('entities', `${A}.dan_cu.cohort`),
      sp('entities', `${A}.dan_cu.soCai`),
      sp('entities', `${A}.dan_cu.du`),
      sp('entities', `${A}.dan_cu.soHo`),
      sp('entities', `${A}.spatial.danSo`),
    ],
    batBien: ['dan_so_khong_am', 'dan_so_khop_cohort'],
    phanGiai: 'adaptive',
    uuTien: 80,
  },
  {
    id: 'health_disease',
    ten: 'Sức khỏe & bệnh',
    moTa: 'Bệnh, lây, miễn dịch, chữa trị. Có đường lây, không phải thanh máu.',
    phamVi: 'place',
    nhip: { unit: 'tick', every: 1 },
    buoc: 1,
    doc: [sp('entities', `${A}.dan_cu.cohort`), sp('entities', `${A}.kinh_te.thieuHut`)],
    ghi: [sp('entities', `${A}.y_te`)],
    batBien: ['ty_le_mac_trong_khoang', 'benh_lay_theo_tuyen'],
    phanGiai: 'adaptive',
    uuTien: 75,
  },
  {
    id: 'production_consumption',
    ten: 'Sản xuất & tiêu thụ',
    moTa: 'Lương thực, vật liệu, lao động, thiếu và thừa. Rút từ sinh thái, không tự sinh.',
    phamVi: 'place',
    nhip: { unit: 'tick', every: 1 },
    buoc: 1,
    doc: [
      sp('entities', `${A}.dan_cu.cohort`),
      sp('entities', `${A}.sinh_thai.taiNguyen`),
      sp('entities', `${A}.kinh_te.kyThuat`),
    ],
    ghi: [
      sp('entities', `${A}.kinh_te.kho`),
      sp('entities', `${A}.kinh_te.sanLuong`),
      sp('entities', `${A}.kinh_te.tieuThu`),
      sp('entities', `${A}.kinh_te.thieuHut`),
      sp('entities', `${A}.kinh_te.soCai`),
      sp('entities', `${A}.sinh_thai.taiNguyen`),
    ],
    batBien: ['kho_khong_am', 'san_xuat_co_nguon'],
    phanGiai: 'adaptive',
    uuTien: 70,
    // Gỗ rời rừng đúng bằng gỗ vào kho. Lương thực thì KHÔNG khai bảo toàn:
    // trồng trọt thật sự tạo ra thóc, và ăn thật sự hủy nó (ghi ở `soCai`).
    baoToan: [
      {
        table: 'entities',
        paths: [`${A}.kinh_te.kho.vatLieu`, `${A}.sinh_thai.taiNguyen.rung`],
        tong: 0,
        saiSo: 1e-6,
      },
    ],
  },
  {
    id: 'exchange_debt',
    ten: 'Trao đổi & nợ',
    moTa: 'Hàng đi theo đường, giá theo khan hiếm, thiếu tiền thì thành nợ.',
    phamVi: 'region',
    nhip: { unit: 'tick', every: 1 },
    buoc: 1,
    doc: [
      sp('entities', `${A}.kinh_te.kho`),
      sp('entities', `${A}.kinh_te.thieuHut`),
      sp('entities', `${A}.duong`),
      sp('debts', ''),
    ],
    ghi: [
      sp('entities', `${A}.kinh_te.kho`),
      sp('entities', `${A}.kinh_te.gia`),
      // Quỵt nợ đẩy đe dọa lên — khai ở đây, nếu không scheduler thiếu một cạnh
      // và `conflict_security` có thể chạy trước khi biết chuyện.
      sp('entities', `${A}.an_ninh.deDoa`),
      sp('debts', ''),
    ],
    batBien: ['no_co_hai_dau_that', 'kho_khong_am'],
    phanGiai: 'meso',
    uuTien: 60,
    // [BB] Trao đổi KHÔNG tạo và KHÔNG hủy vật chất. Tổng phải bằng 0.
    baoToan: [
      { table: 'entities', paths: [`${A}.kinh_te.kho.luongThuc`], tong: 0, saiSo: 1e-6 },
      { table: 'entities', paths: [`${A}.kinh_te.kho.vatLieu`], tong: 0, saiSo: 1e-6 },
    ],
  },
  {
    id: 'settlement_infrastructure',
    ten: 'Định cư & hạ tầng',
    moTa: 'Nhà, đường, kho, ruộng — và hư hỏng khi không ai sửa.',
    phamVi: 'place',
    nhip: { unit: 'tick', every: 2 },
    buoc: 1,
    // Đọc HẸP đúng thứ handler chạm tới: khai rộng (`kinh_te.kho`) sẽ kéo tiến
    // trình này vào cùng cụm với thuế, và cụm càng to thì càng nhiều tiến trình
    // phải đọc chung một ảnh chụp cũ.
    doc: [
      sp('entities', `${A}.kinh_te.kho.vatLieu`),
      sp('entities', `${A}.kinh_te.haTang`),
      sp('entities', `${A}.dan_cu.cohort`),
      sp('entities', `${A}.duong.luuLuong`),
    ],
    ghi: [
      sp('entities', `${A}.kinh_te.haTang`),
      sp('entities', `${A}.kinh_te.kho.vatLieu`),
      sp('entities', `${A}.duong.chatLuong`),
      sp('entities', `${A}.duong.thongSuot`),
      sp('entities', `${A}.duong.luuLuong`),
    ],
    batBien: ['ha_tang_can_vat_lieu', 'kho_khong_am'],
    phanGiai: 'meso',
    uuTien: 55,
  },
  {
    id: 'travel_communication',
    ten: 'Di chuyển & liên lạc',
    moTa: 'Người, hàng và tin đi trên tuyến đường, mất thời gian, méo dần theo chặng.',
    phamVi: 'region',
    nhip: { unit: 'tick', every: 1 },
    buoc: 14,
    doc: [
      sp('knowledge', ''),
      sp('entities', `${A}.duong.doDai`),
      sp('entities', `${A}.duong.chatLuong`),
      sp('entities', `${A}.duong.thongSuot`),
      sp('entities', `${A}.van_hoa.doLechNgonNgu`),
    ],
    ghi: [sp('knowledge', ''), sp('entities', `${A}.duong.luuLuong`)],
    batBien: ['khong_tri_thuc_teleport'],
    phanGiai: 'meso',
    uuTien: 50,
  },
  {
    id: 'institution_governance',
    ten: 'Thiết chế & cai trị',
    moTa: 'Luật lệ, thuế, chức vụ, kế vị, tranh chấp.',
    phamVi: 'region',
    nhip: { unit: 'tick', every: 4 },
    buoc: 1,
    doc: [
      sp('entities', `${A}.institutional`),
      sp('entities', `${A}.kinh_te.kho.luongThuc`),
      sp('entities', `${A}.kinh_te.thieuHut`),
    ],
    ghi: [
      sp('entities', `${A}.institutional.khoCong`),
      sp('entities', `${A}.institutional.chucVu`),
      sp('entities', `${A}.institutional.onDinh`),
      sp('entities', `${A}.kinh_te.kho.luongThuc`),
    ],
    batBien: ['ke_vi_co_quy_tac', 'thue_khong_tao_vat_chat'],
    phanGiai: 'meso',
    uuTien: 45,
    // Thuế chỉ CHUYỂN lương thực từ kho vùng sang kho công, không đẻ ra thóc.
    baoToan: [
      {
        table: 'entities',
        paths: [`${A}.kinh_te.kho.luongThuc`, `${A}.institutional.khoCong.luongThuc`],
        tong: 0,
        saiSo: 1e-6,
      },
    ],
  },
  {
    id: 'knowledge_technology',
    ten: 'Tri thức & kỹ thuật',
    moTa: 'Học, truyền nghề, nghiên cứu — và mất tri thức khi không còn ai giữ.',
    phamVi: 'place',
    nhip: { unit: 'tick', every: 2 },
    buoc: 1,
    doc: [sp('knowledge', ''), sp('entities', `${A}.dan_cu.cohort`), sp('entities', `${A}.kinh_te.kyThuat`)],
    ghi: [sp('entities', `${A}.kinh_te.kyThuat`), sp('knowledge', '')],
    batBien: ['tri_thuc_co_nguon', 'ky_thuat_trong_khoang'],
    phanGiai: 'macro',
    uuTien: 40,
  },
  {
    id: 'culture_language_religion',
    ten: 'Văn hóa, ngôn ngữ & tôn giáo',
    moTa: 'Tập tục, ngôn ngữ trôi, nghi thức, giáo lý lệch dần theo thế hệ.',
    phamVi: 'place',
    nhip: { unit: 'tick', every: 4 },
    buoc: 10,
    doc: [sp('entities', `${A}.dan_cu.cohort`), sp('entities', `${A}.van_hoa`)],
    ghi: [sp('entities', `${A}.van_hoa`)],
    batBien: ['dien_giai_lech_theo_the_he'],
    phanGiai: 'macro',
    uuTien: 35,
  },
  {
    id: 'conflict_security',
    ten: 'Xung đột & an ninh',
    moTa: 'Bạo lực, phòng vệ, chiến tranh, hòa ước — và thương vong trừ thẳng vào dân.',
    phamVi: 'region',
    nhip: { unit: 'tick', every: 2 },
    buoc: 1,
    doc: [
      sp('entities', `${A}.kinh_te.thieuHut`),
      sp('entities', `${A}.kinh_te.kho.luongThuc`),
      sp('entities', `${A}.an_ninh`),
      sp('entities', `${A}.dan_cu.cohort`),
      sp('entities', `${A}.duong.thongSuot`),
    ],
    ghi: [
      sp('entities', `${A}.an_ninh`),
      sp('entities', `${A}.dan_cu.cohort`),
      sp('entities', `${A}.spatial.danSo`),
    ],
    batBien: ['thuong_vong_tru_dan_so', 'dan_so_khong_am'],
    phanGiai: 'adaptive',
    uuTien: 30,
  },

  // ── Phase 6: tầng Thần (Phần 69, 22) ──
  // Ba tiến trình này là lý do thần NPC sống khi người chơi vắng mặt. Chúng đi
  // chung một đường với mùa màng, nên chúng cũng chạy khi tua một trăm năm.
  {
    id: 'divine_alienation',
    ten: 'Dị Hóa',
    moTa: 'Tín đồ nặn lại vị thần. Sinh ÁP LỰC và tình huống — không tự sửa lõi.',
    phamVi: 'entity',
    nhip: { unit: 'tick', every: 4 },
    buoc: 10,
    doc: [
      sp('entities', `${A}.venerable`),
      sp('entities', `${A}.ban_nga`),
      sp('entities', `${A}.kinh_te.thieuHut`),
      sp('entities', `${A}.an_ninh.deDoa`),
      sp('entities', `${A}.y_te.tyLeMac`),
    ],
    ghi: [
      sp('entities', `${A}.ban_nga.followerImage`),
      sp('entities', `${A}.ban_nga.currentManifestation`),
      sp('entities', `${A}.ban_nga.pressure`),
      sp('entities', `${A}.venerable.doLechDiHoa`),
    ],
    // [BB] `coreSelf` KHÔNG có trong `ghi`. Đó là toàn bộ điểm của 69.1.
    batBien: ['coreself_co_giai_thich', 'di_hoa_khong_sua_loi'],
    phanGiai: 'macro',
    uuTien: 25,
  },
  {
    id: 'prayer_flow',
    ten: 'Dòng cầu nguyện',
    moTa: 'Lời cầu dâng lên từ bế tắc thật; quá hạn không trả lời thì tính như làm ngơ.',
    phamVi: 'region',
    nhip: { unit: 'tick', every: 2 },
    buoc: 4,
    doc: [
      sp('entities', `${A}.kinh_te.thieuHut`),
      sp('entities', `${A}.y_te.tyLeMac`),
      sp('entities', `${A}.an_ninh.xungDot`),
      sp('entities', `${A}.venerable.matDoDen`),
      sp('prayers', ''),
    ],
    ghi: [
      sp('prayers', ''),
      sp('entities', `${A}.van_hoa.giaoLyLech`),
      sp('entities', `${A}.venerable.soTinDoUocLuong`),
    ],
    batBien: ['loi_cau_co_goc_that'],
    phanGiai: 'meso',
    uuTien: 20,
  },
  {
    id: 'divine_agency',
    ten: 'Thần NPC tự sống',
    moTa:
      'Thần không do người chơi nhập vẫn đáp áp lực, trả lời cầu nguyện, theo đuổi việc dài hơi ' +
      'và giữ domain.',
    phamVi: 'entity',
    nhip: { unit: 'tick', every: 2 },
    buoc: 3,
    doc: [
      sp('entities', `${A}.ban_nga`),
      sp('entities', `${A}.domain`),
      sp('entities', `${A}.du_an`),
      // Project của thần đo tiến độ TỪ THẾ GIỚI (68.3), nên nó đọc đúng những
      // đường dẫn ấy. Khai thiếu ở đây là cách scheduler mất cạnh phụ thuộc —
      // đúng lỗi #3 đã sửa ở Phase 5.
      sp('entities', `${A}.venerable.matDoDen`),
      sp('entities', `${A}.kinh_te.thieuHut`),
      sp('entities', `${A}.an_ninh.deDoa`),
      sp('prayers', ''),
    ],
    ghi: [
      sp('entities', `${A}.ban_nga.pressure.tinhHuongMo`),
      sp('entities', `${A}.domain.domains`),
      sp('entities', `${A}.du_an.danhSach`),
      sp('entities', `${A}.venerable.soTinDoUocLuong`),
      sp('entities', `${A}.kinh_te.thieuHut`),
      sp('prayers', ''),
    ],
    batBien: ['coreself_co_giai_thich', 'domain_mat_phai_het_neo'],
    phanGiai: 'meso',
    uuTien: 15,
  },

  // ── Phase 7: tầng Phàm Nhân (Phần 70) ──
  // Hai tiến trình này KHÔNG mô phỏng lịch của từng người: lịch là hàm thuần của
  // hoàn cảnh (`pham/lich.ts`). Chúng chỉ lo thứ thật sự tích lũy.
  {
    id: 'mortal_daily',
    ten: 'Một ngày của người có tên',
    moTa: 'Làm nghề, mệt, lành, đói, và chết theo chuỗi nguyên nhân chứ không theo một con số.',
    phamVi: 'entity',
    nhip: { unit: 'tick', every: 1 },
    buoc: 1,
    doc: [
      sp('entities', `${A}.mortal`),
      sp('entities', `${A}.sinh_ke`),
      sp('entities', `${A}.kinh_te.kyThuat`),
      sp('entities', `${A}.ho.kho`),
    ],
    ghi: [
      sp('entities', `${A}.mortal.thanThe`),
      sp('entities', `${A}.mortal.kyNang`),
      sp('entities', `${A}.mortal.soHuu`),
      sp('entities', `${A}.mortal.nguyenNhanChet`),
      sp('entities', `${A}.sinh_ke`),
      sp('entities', `${A}.ho.kho`),
      sp('entities', `${A}.kinh_te.kho`),
      sp('entities', `${A}.soul.quanHe`),
      sp('entities', 'tickDiet'),
    ],
    batBien: ['than_the_hop_le', 'thua_ke_khong_nhan_doi'],
    phanGiai: 'micro',
    uuTien: 12,
  },
  {
    id: 'household_lifecycle',
    ten: 'Vòng đời hộ',
    moTa: 'Ăn chung, tách hộ khi con lớn có nghề, và tan khi không còn ai. Kho không bốc hơi.',
    phamVi: 'entity',
    nhip: { unit: 'tick', every: 1 },
    buoc: 1,
    doc: [sp('entities', `${A}.ho`), sp('entities', `${A}.mortal.ageBand`), sp('entities', `${A}.sinh_ke`)],
    ghi: [
      sp('entities', `${A}.ho`),
      sp('entities', `${A}.mortal.thanThe.doDoi`),
      sp('entities', `${A}.mortal.hoId`),
      sp('entities', `${A}.kinh_te.kho`),
      sp('links', ''),
    ],
    batBien: ['ho_co_nguoi_that', 'kho_ho_khong_am'],
    phanGiai: 'meso',
    uuTien: 11,
  },

  /**
   * Phase 8 — nhịp mạch truyện.
   *
   * [BB] 28.5: chạy BẰNG ENGINE, không gọi LLM. Nó đọc gần như cả thế giới (tiền
   * đề của mười bốn loại nằm rải khắp aspect) nhưng chỉ ghi vào hai bảng của
   * riêng nó — nhờ vậy scheduler xếp nó xuống stage cuối và nó không bao giờ
   * tranh `set` với tiến trình nào khác.
   */
  {
    id: 'storyline_beat',
    ten: 'Nhịp mạch truyện',
    moTa: 'Dò tiền đề, sinh mạch mới, đếm đồng hồ và chạy nhịp. Không gọi LLM.',
    phamVi: 'world',
    nhip: { unit: 'tick', every: 1 },
    buoc: 1,
    doc: [
      sp('entities', `${A}.soul`),
      sp('entities', `${A}.ban_nga`),
      sp('entities', `${A}.domain`),
      sp('entities', `${A}.lawful`),
      sp('entities', `${A}.institutional`),
      sp('entities', `${A}.adversarial`),
      sp('entities', `${A}.an_ninh`),
      sp('entities', `${A}.kinh_te.thieuHut`),
      sp('entities', `${A}.mortal`),
      sp('gaps', ''),
      sp('debts', ''),
      sp('storylines', ''),
      sp('foreshadows', ''),
    ],
    ghi: [
      sp('storylines', ''),
      sp('foreshadows', ''),
      sp('gaps', ''),
      // [BB] 28.5 — nhịp truyện áp `bienDoiTrangThai` vào world. Hai đường này
      // KHÔNG tiến trình nào khác khai `ghi`, và cả hai chỉ nhận `push` — nên
      // scheduler không bao giờ phải phân xử `set` đụng `set` ở đây (71.4 #1).
      sp('entities', `${A}.soul.kyUc`),
      sp('entities', `${A}.soul.tamTrang`),
      // Mốc kỷ nguyên: chỗ duy nhất `nenKyUcMach()` của 30.3 được kích hoạt.
      sp('worlds', 'eraId'),
    ],
    batBien: ['mach_truyen_khong_lay_nguoi_choi_lam_tam', 'phuc_but_khong_bien_mat'],
    phanGiai: 'macro',
    uuTien: 5,
  },
];

export const WORLD_PROCESSES_DUNG_SAN: readonly WorldProcessDef[] = wpNguon.map((w) => {
  const nhip = { unit: w.nhip.unit, every: w.nhip.every, eventTypes: w.nhip.eventTypes ?? [] };
  const baoToan = w.baoToan ?? [];
  return {
    id: w.id,
    ten: w.ten,
    moTa: w.moTa,
    phamVi: w.phamVi,
    nhip,
    doc: w.doc,
    ghi: w.ghi,
    batBien: w.batBien,
    phanGiai: w.phanGiai,
    uuTien: w.uuTien,
    baoToan,
    buocTick: w.buoc,
    manifest: manifestCua('worldProcess', {
      id: w.id,
      ten: w.ten,
      moTa: w.moTa,
      handlerId: `wp.${w.id}`,
      config: {
        scope: w.phamVi,
        cadence: nhip,
        reads: w.doc.map((p) => ({ ...p })),
        writes: w.ghi.map((p) => ({ ...p })),
        invariants: w.batBien,
        resolution: w.phanGiai,
        uuTien: w.uuTien,
        baoToan: baoToan.map((b) => ({ ...b })),
        buocTick: w.buoc,
      },
    }),
  };
});

/** Mọi tiến trình dựng sẵn, đúng thứ tự khai báo. */
export const WORLD_PROCESS_IDS = WORLD_PROCESSES_DUNG_SAN.map((w) => w.id);

/**
 * Đúng mười hai tiến trình của bảng 71.2. Danh sách này ĐÓNG — phase sau thêm
 * tiến trình thì thêm vào danh sách riêng, không nhét vào đây (cùng lẽ với
 * ADR-0021 cho aspect).
 */
export const WORLD_PROCESS_IDS_712 = [
  'environment_cycle',
  'ecology',
  'population_household',
  'health_disease',
  'production_consumption',
  'exchange_debt',
  'settlement_infrastructure',
  'travel_communication',
  'institution_governance',
  'knowledge_technology',
  'culture_language_religion',
  'conflict_security',
] as const;

/** Tiến trình tầng Thần — Phase 6 (Phần 69, 22). */
export const WORLD_PROCESS_IDS_THAN = ['divine_alienation', 'prayer_flow', 'divine_agency'] as const;

/** Tiến trình tầng Phàm Nhân — Phase 7 (Phần 70). */
export const WORLD_PROCESS_IDS_PHAM = ['mortal_daily', 'household_lifecycle'] as const;

/** Tiến trình tự sự — Phase 8 (Phần 28, 30). */
export const WORLD_PROCESS_IDS_TRUYEN = ['storyline_beat'] as const;
