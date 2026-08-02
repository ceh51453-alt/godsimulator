/**
 * Aspect dựng sẵn.
 *
 * - `ASPECT_IDS_42` — đúng mười hai aspect của bảng Phần 4.2 [MR]. Danh sách này
 *   ĐÓNG: thêm hay bớt một dòng là lệch đặc tả.
 * - `ASPECT_IDS_NEN` — aspect nền của Thế Giới Sống, thêm ở Phase 5 theo Phần 71.2
 *   và ma trận 72.4 (ADR-0021). Phần 4.2 là danh sách khởi đầu, không phải trần.
 */
import type { AspectDef } from './types.js';
import { manifestCua } from './define.js';
import { SoulSchema } from '../schema/aspect/soul.js';
import { ConceptualSchema } from '../schema/aspect/conceptual.js';
import { LawfulSchema } from '../schema/aspect/lawful.js';
import { DomainSchema, VenerableSchema, DivisibleSchema, AvatarSchema } from '../schema/aspect/divine.js';
import {
  MortalSchema,
  GenealogicalSchema,
  SpatialSchema,
  CarrierSchema,
  AdversarialSchema,
  InstitutionalSchema,
} from '../schema/aspect/living.js';
import {
  DanCuSchema,
  YTeSchema,
  SinhThaiSchema,
  KinhTeSchema,
  VanHoaSchema,
  AnNinhSchema,
  DuongSchema,
} from '../schema/aspect/substrate.js';
import { DivineIdentitySchema } from '../schema/aspect/thanVi.js';
import { GiaoUocSchema } from '../schema/than.js';
import { HoiDongSchema } from '../schema/aspect/hoiDong.js';
import { DuAnSchema } from '../schema/aspect/duAn.js';
import { SinhKeSchema, HoSchema, CanCuocSchema } from '../schema/aspect/pham.js';
import { ProvenanceSchema } from '../schema/aspect/provenance.js';

type Nhap = {
  id: string;
  ten: string;
  moTa: string;
  schema: AspectDef['schema'];
  schemaRef: string;
  phuThuoc?: string[];
  buocTick?: number;
};

/** Mười hai aspect của bảng Phần 4.2. Danh sách này ĐÓNG. */
const nguon42: readonly Nhap[] = [
  {
    id: 'soul',
    ten: 'Hồn Phổ',
    moTa: 'Bản tính, dục vọng, tâm trạng, ký ức. Dùng chung cho thần, phàm nhân và quái vật có trí.',
    schema: SoulSchema,
    schemaRef: 'aspect.soul',
    buocTick: 3,
  },
  {
    id: 'conceptual',
    ten: 'Khái Niệm',
    moTa: 'Trọng số, sắc thái, nguồn, phản nghĩa.',
    schema: ConceptualSchema,
    schemaRef: 'aspect.conceptual',
    buocTick: 7,
  },
  {
    id: 'lawful',
    ten: 'Định Luật',
    moTa: 'Bảy trường logic, diễn giải theo vùng, kẽ hở.',
    schema: LawfulSchema,
    schemaRef: 'aspect.lawful',
    buocTick: 2,
  },
  {
    id: 'domain',
    ten: 'Thần Vực',
    moTa: 'Danh sách domain và sức của từng domain.',
    schema: DomainSchema,
    schemaRef: 'aspect.domain',
  },
  {
    id: 'genealogical',
    ten: 'Huyết Thống',
    moTa: 'Cha mẹ, con, thế hệ, dòng họ.',
    schema: GenealogicalSchema,
    schemaRef: 'aspect.genealogical',
  },
  {
    id: 'divisible',
    ten: 'Khả Phân',
    moTa: 'Phân thân, độ phân kỳ, ngưỡng hợp nhất.',
    schema: DivisibleSchema,
    schemaRef: 'aspect.divisible',
    buocTick: 9,
  },
  {
    id: 'venerable',
    ten: 'Thọ Phụng',
    moTa: 'Tín đồ, đền, hiển thánh, và bản tính mà tín đồ TIN — khác bản tính thật.',
    schema: VenerableSchema,
    schemaRef: 'aspect.venerable',
    phuThuoc: ['soul'],
  },
  {
    id: 'carrier',
    ten: 'Vật Mang',
    moTa: 'Khái niệm mang theo, lịch sử những bàn tay đã cầm.',
    schema: CarrierSchema,
    schemaRef: 'aspect.carrier',
  },
  {
    id: 'spatial',
    ten: 'Không Gian',
    moTa: 'Vị trí, ranh giới, luật cục bộ.',
    schema: SpatialSchema,
    schemaRef: 'aspect.spatial',
    buocTick: 1,
  },
  {
    id: 'mortal',
    ten: 'Phàm Thân',
    moTa: 'Thân thể, tuổi thọ, nghề, hộ, sở hữu, lịch.',
    schema: MortalSchema,
    schemaRef: 'aspect.mortal',
    phuThuoc: ['soul'],
    buocTick: 1,
  },
  {
    id: 'adversarial',
    ten: 'Kẻ Thù Vĩnh Cửu',
    moTa: 'Phủ định gì, điều khoản bất tử, nhịp trỗi dậy.',
    schema: AdversarialSchema,
    schemaRef: 'aspect.adversarial',
    buocTick: 6,
  },
  {
    id: 'institutional',
    ten: 'Thiết Chế',
    moTa: 'Mô hình cai trị, kế vị, thành viên. Dùng cho thần hệ, giáo phái, quốc gia.',
    schema: InstitutionalSchema,
    schemaRef: 'aspect.institutional',
  },
];

/**
 * Aspect nền — Phase 5. Mỗi dòng là móc *State* của đúng một hàng trong ma trận
 * "thế giới hoàn chỉnh" (72.4) và của đúng một tiến trình trong 71.2.
 */
const nguonNen: readonly Nhap[] = [
  {
    id: 'dan_cu',
    ten: 'Dân Cư',
    moTa: 'Quần thể theo nhóm tuổi, hộ, sổ cái sinh tử di cư.',
    schema: DanCuSchema,
    schemaRef: 'aspect.dan_cu',
    buocTick: 1,
  },
  {
    id: 'y_te',
    ten: 'Y Tế',
    moTa: 'Dịch tễ: tỷ lệ mắc, miễn dịch, sức chữa, hiểu biết y học của vùng.',
    schema: YTeSchema,
    schemaRef: 'aspect.y_te',
    buocTick: 1,
  },
  {
    id: 'sinh_thai',
    ten: 'Sinh Thái',
    moTa: 'Trữ lượng, sức chứa, phục hồi. Sản xuất RÚT từ đây.',
    schema: SinhThaiSchema,
    schemaRef: 'aspect.sinh_thai',
    buocTick: 1,
  },
  {
    id: 'kinh_te',
    ten: 'Kinh Tế',
    moTa: 'Kho, sản lượng, tiêu thụ, giá, kỹ thuật, hạ tầng, sổ cái vật chất.',
    schema: KinhTeSchema,
    schemaRef: 'aspect.kinh_te',
    buocTick: 1,
  },
  {
    id: 'van_hoa',
    ten: 'Văn Hóa',
    moTa: 'Tập tục, ngôn ngữ trôi theo thế hệ, nghi lễ, giáo lý lệch.',
    schema: VanHoaSchema,
    schemaRef: 'aspect.van_hoa',
    buocTick: 10,
  },
  {
    id: 'an_ninh',
    ten: 'An Ninh',
    moTa: 'Đe dọa, phòng vệ, xung đột đang mở, hòa ước, thương vong.',
    schema: AnNinhSchema,
    schemaRef: 'aspect.an_ninh',
    buocTick: 1,
  },
  {
    id: 'duong',
    ten: 'Tuyến Đường',
    moTa: 'Hai đầu, độ dài, chất lượng, thông suốt. Tin tức đi theo nó chứ không teleport.',
    schema: DuongSchema,
    schemaRef: 'aspect.duong',
    buocTick: 14,
  },
];

/**
 * Aspect tầng Thần — Phase 6 (Phần 69). Cùng lý do với `nguonNen`: đặc tả thêm
 * aspect theo phase, và bảng 4.2 là danh sách khởi đầu chứ không phải trần
 * (ADR-0021).
 */
const nguonThan: readonly Nhap[] = [
  {
    id: 'ban_nga',
    ten: 'Bản Ngã Thần',
    moTa: 'Bốn lớp: lõi tự nhận, hình ảnh tín đồ, giáo lý chính thức, hình hiện tại — cùng áp lực giữa chúng.',
    schema: DivineIdentitySchema,
    schemaRef: 'aspect.ban_nga',
    phuThuoc: ['soul'],
    buocTick: 10,
  },
  {
    id: 'giao_uoc',
    ten: 'Giao Ước',
    moTa: 'Ràng buộc hai chiều giữa hai bên. Thần cũng phải giữ phần của mình.',
    schema: GiaoUocSchema,
    schemaRef: 'aspect.giao_uoc',
    buocTick: 5,
  },
  {
    id: 'avatar',
    ten: 'Hóa Thân',
    moTa: 'Thân xác phàm mà một vị thần đang mượn. Chừng nào chưa thức tỉnh, chieu() hạ xuống mức phàm nhân.',
    schema: AvatarSchema,
    schemaRef: 'aspect.avatar',
    phuThuoc: ['domain'],
    buocTick: 9,
  },
  {
    id: 'hoi_dong',
    ten: 'Hội Đồng Thần',
    moTa: 'Thần hệ có ghế, có phiếu và có kế vị. Không có nó thì thần điện chỉ là một danh sách.',
    schema: HoiDongSchema,
    schemaRef: 'aspect.hoi_dong',
    buocTick: 6,
  },
  {
    id: 'du_an',
    ten: 'Việc Đang Theo Đuổi',
    moTa: 'Project dài hơi của chủ thể. Đây là thứ làm thần NPC theo đuổi chứ không chỉ phản ứng (69.3).',
    schema: DuAnSchema,
    schemaRef: 'aspect.du_an',
    buocTick: 3,
  },
];

/**
 * Aspect tầng Phàm Nhân — Phase 7 (Phần 70.2). Cùng lẽ với `nguonNen` và
 * `nguonThan`: bảng 4.2 là danh sách khởi đầu, không phải trần (ADR-0021).
 *
 * Ba cái này là ba chỗ duy nhất một đời bình thường để lại dấu: nghề truyền cho
 * ai, nhà chia cho ai, và tên mình còn nằm trong sổ nào.
 */
const nguonPham: readonly Nhap[] = [
  {
    id: 'sinh_ke',
    ten: 'Sinh Kế',
    moTa: 'Nghề, bậc, nơi làm, thầy và học trò. Kỹ năng lên từ việc đã làm, không từ nút bấm.',
    schema: SinhKeSchema,
    schemaRef: 'aspect.sinh_ke',
    phuThuoc: ['mortal'],
    buocTick: 1,
  },
  {
    id: 'ho',
    ten: 'Hộ Gia Đình',
    moTa: 'Người ở chung, kho chung, nghĩa vụ chung. Ăn chung nghĩa là đói chung.',
    schema: HoSchema,
    schemaRef: 'aspect.ho',
    buocTick: 1,
  },
  {
    id: 'can_cuoc',
    ten: 'Căn Cước',
    moTa: 'Hội đoàn, trạng thái pháp lý, án đã chịu, và việc khiến người ta nhớ tới mình.',
    schema: CanCuocSchema,
    schemaRef: 'aspect.can_cuoc',
    phuThuoc: ['mortal'],
    buocTick: 5,
  },
];

/**
 * Aspect của Phase 11 — Phần 59.1 [BB].
 *
 * `provenance` áp được lên MỌI kind, nên nó không thuộc nhóm nào ở trên. Nó tồn
 * tại vì Bảng Tạo Vật (58.7) có một cột tên là "Nguồn sinh", và cột ấy chỉ trung
 * thực khi nguồn được GHI lúc sinh chứ không được đoán lúc đọc.
 */
const nguonBang: readonly Nhap[] = [
  {
    id: 'provenance',
    ten: 'Nguồn Gốc',
    moTa: 'Ai hoặc điều gì đã sinh ra thứ này, ở nhịp nào, và nó từng là cái gì trước đó.',
    schema: ProvenanceSchema,
    schemaRef: 'aspect.provenance',
  },
];

const nguon: readonly Nhap[] = [...nguon42, ...nguonNen, ...nguonThan, ...nguonPham, ...nguonBang];

export const ASPECTS_DUNG_SAN: readonly AspectDef[] = nguon.map((n) => {
  const def: AspectDef = {
    id: n.id,
    ten: n.ten,
    moTa: n.moTa,
    schema: n.schema,
    manifest: manifestCua('aspect', {
      id: n.id,
      ten: n.ten,
      moTa: n.moTa,
      schemaRef: n.schemaRef,
      config: n.buocTick === undefined ? {} : { buocTick: n.buocTick },
    }),
    ...(n.phuThuoc ? { phuThuoc: n.phuThuoc } : {}),
    ...(n.buocTick === undefined ? {} : { buocTick: n.buocTick }),
  };
  return def;
});

export const ASPECT_IDS = ASPECTS_DUNG_SAN.map((a) => a.id);
/** Mười hai aspect của Phần 4.2 — cổng Phase 0 kiểm đúng danh sách này. */
export const ASPECT_IDS_42 = nguon42.map((a) => a.id);
/** Aspect nền của Phần 71.2 — cổng Phase 5 kiểm đúng danh sách này. */
export const ASPECT_IDS_NEN = nguonNen.map((a) => a.id);
/** Aspect tầng Thần của Phần 69 — cổng Phase 6 kiểm đúng danh sách này. */
export const ASPECT_IDS_THAN = nguonThan.map((a) => a.id);
/** Aspect tầng Phàm Nhân của Phần 70 — cổng Phase 7 kiểm đúng danh sách này. */
export const ASPECT_IDS_PHAM = nguonPham.map((a) => a.id);
/** Aspect của hai bảng Phase 11 — Phần 59.1. */
export const ASPECT_IDS_BANG = nguonBang.map((a) => a.id);
