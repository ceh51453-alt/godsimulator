/**
 * Mười kênh can thiệp của thần — Phần 69.2.
 *
 * > "Kênh là registry/affordance, không phải menu đóng."
 *
 * Cột **giá tự nhiên** của bảng 69.2 là điều làm cho tầng Thần không thành một
 * bảng nút bấm. Mỗi kênh có một cái giá **nằm trong thế giới**, không phải một
 * thanh mana bị trừ:
 *
 *   - dấu hiệu thì rẻ, nhưng người ta hiểu sai;
 *   - hiển thánh thì hiệu quả, nhưng lộ ý định và bị phản công;
 *   - giao ước thì bền, nhưng **thần cũng bị trói**.
 *
 * [BB] Phần 1.3 — KHÔNG có tài nguyên meta. Không mana, không cooldown, không
 * "điểm thần lực". Cái ngăn người chơi lạm dụng là hậu quả, không phải bộ đếm.
 * Bất biến `khong_tai_nguyen_meta` canh điều này ở mức schema.
 */
import { z } from 'zod';

export const KENH_IDS = [
  'dau_hieu',
  'su_gia',
  'giao_uoc',
  'ban_phat',
  'hien_thanh',
  'than_khi',
  'giao_ly',
  'coi',
  'mac_khai',
  'ngoai_giao_than',
] as const;
export type KenhId = (typeof KENH_IDS)[number];

/**
 * Một cái giá phải trả. Đây là **hậu quả trong thế giới**, không phải chi phí
 * trừ vào một bộ đếm.
 */
export const GiaTuNhienSchema = z
  .object({
    /** Khả năng người nhận hiểu SAI ý định. 0–1. */
    deHieuSai: z.number().min(0).max(1).prefault(0),
    /** Mức lộ mình cho thần khác thấy — đẩy `hienThanh` lên. */
    loDienThan: z.number().min(0).max(100).prefault(0),
    /** Làm tín đồ ỷ lại — đẩy `doPhuThuoc` vùng lên. */
    tangPhuThuoc: z.number().min(0).max(100).prefault(0),
    /** Ràng buộc ngược lên chính vị thần. Chỉ `giao_uoc` và `ngoai_giao_than` có. */
    tuRangBuoc: z.boolean().prefault(false),
    /** Trung gian có ý chí riêng: sứ giả, thần khí, thể chế đều có thể phản. */
    trungGianCoYChi: z.boolean().prefault(false),
    /** Cần Luật Nền cho phép mới dùng được (Phần 43). */
    canLuatNen: z.array(z.string()).prefault([]),
  })
  .strict();

export type GiaTuNhien = z.infer<typeof GiaTuNhienSchema>;

export type KenhCanThiep = {
  readonly id: KenhId;
  readonly ten: string;
  readonly moTa: string;
  /** Ví dụ trong bảng 69.2 — dùng làm gợi ý cho người chơi, không phải allowlist. */
  readonly viDu: readonly string[];
  readonly gia: GiaTuNhien;
  /** Câu engine kể khi kênh này được dùng mà chưa có Narrator. */
  readonly loiKeMau: string;
};

const g = (x: Partial<GiaTuNhien>): GiaTuNhien => GiaTuNhienSchema.parse(x);

/**
 * Mười kênh dựng sẵn. [MR] — người dùng thêm kênh mới bằng dữ liệu, và thần
 * "được khám phá kênh mới từ aspect, luật và cơ chế của thế giới" (69.2).
 */
export const KENH_DUNG_SAN: readonly KenhCanThiep[] = [
  {
    id: 'dau_hieu',
    ten: 'Dấu hiệu',
    moTa: 'Mộng, điềm, đồng hiện, linh cảm. Rẻ nhất và mơ hồ nhất.',
    viDu: ['một giấc mộng lặp lại ba đêm', 'chim bay ngược hướng gió', 'nước giếng đổi vị'],
    // Cái giá đúng của dấu hiệu: bạn không kiểm soát được người ta hiểu ra sao.
    gia: g({ deHieuSai: 0.75, loDienThan: 4 }),
    loiKeMau: 'Một dấu hiệu hiện ra. Không ai chắc nó nói gì.',
  },
  {
    id: 'su_gia',
    ten: 'Sứ giả',
    moTa: 'Tiên tri, thú linh, phân thân. Nói thay ngươi — và có thể nói sai.',
    viDu: ['một người đàn bà mù bỗng nói tên ngươi', 'con quạ trắng đậu ba ngày trên nóc đền'],
    gia: g({ deHieuSai: 0.4, loDienThan: 20, trungGianCoYChi: true }),
    loiKeMau: 'Một người mang lời của ngươi đi. Từ lúc đó lời ấy là của họ.',
  },
  {
    id: 'giao_uoc',
    ten: 'Giao ước',
    moTa: 'Lời thề, bảo hộ, cấm kỵ. Bền nhất — và trói cả ngươi.',
    viDu: ['ta che chở dòng họ này, đổi lại họ không đổ máu trong đền'],
    // [BB] Đây là kênh DUY NHẤT mà vị thần cũng phải giữ phần mình.
    gia: g({ deHieuSai: 0.1, loDienThan: 35, tuRangBuoc: true }),
    loiKeMau: 'Lời đã thề. Từ nay ngươi cũng bị buộc.',
  },
  {
    id: 'ban_phat',
    ten: 'Ban và phạt',
    moTa: 'Đổi cơ hội, thân thể, huyết mạch. Tạo phụ thuộc, thù hận và luật mới.',
    viDu: ['mùa màng bội thu ở một làng', 'một dòng họ sinh ra đã mù'],
    gia: g({ deHieuSai: 0.2, loDienThan: 45, tangPhuThuoc: 18 }),
    loiKeMau: 'Ngươi đưa tay ra. Thế giới nghiêng theo — và nhớ rằng nó đã nghiêng.',
  },
  {
    id: 'hien_thanh',
    ten: 'Hiển thánh',
    moTa: 'Xuất hiện trực tiếp. Không ai hiểu sai, và cũng không ai quên.',
    viDu: ['đứng giữa quảng trường vào giờ ngọ'],
    gia: g({ deHieuSai: 0.05, loDienThan: 80, tangPhuThuoc: 25 }),
    loiKeMau: 'Ngươi hiện ra. Mọi vị thần khác đều vừa thấy ngươi ở đâu.',
  },
  {
    id: 'than_khi',
    ten: 'Thần khí',
    moTa: 'Gửi quyền năng vào vật. Vật có lịch sử, và vật đổi chủ được.',
    viDu: ['một thanh gươm không gỉ', 'chiếc bát luôn đầy nước'],
    gia: g({ deHieuSai: 0.3, loDienThan: 25, trungGianCoYChi: true }),
    loiKeMau: 'Quyền năng vào vật. Vật thì đi xa hơn ý ngươi.',
  },
  {
    id: 'giao_ly',
    ten: 'Giáo lý',
    moTa: 'Nói qua thể chế. Bị sửa, bị dịch và bị lợi dụng.',
    viDu: ['một điều răn mới được đọc trong lễ'],
    gia: g({ deHieuSai: 0.55, loDienThan: 15, tangPhuThuoc: 10, trungGianCoYChi: true }),
    loiKeMau: 'Lời vào giáo lý. Ba đời sau nó sẽ không còn là lời ngươi nói.',
  },
  {
    id: 'coi',
    ten: 'Cõi',
    moTa: 'Dựng, mở, đóng, nối không gian. Cần Luật Nền cho phép.',
    viDu: ['một thung lũng không ai tìm được lối vào hai lần'],
    gia: g({ deHieuSai: 0.25, loDienThan: 55, canLuatNen: ['khong_gian'] }),
    loiKeMau: 'Một chỗ trong thế giới vừa thôi tuân theo bản đồ.',
  },
  {
    id: 'mac_khai',
    ten: 'Mặc khải',
    moTa: 'Trao một tri thức thật hoặc nửa thật. Tri thức lan ngoài kiểm soát.',
    viDu: ['cách luyện một thứ kim loại chưa ai biết'],
    gia: g({ deHieuSai: 0.35, loDienThan: 30, trungGianCoYChi: true }),
    loiKeMau: 'Ngươi cho họ biết một điều. Điều đó bây giờ tự đi.',
  },
  {
    id: 'ngoai_giao_than',
    ten: 'Ngoại giao thần',
    moTa: 'Thề, cưới, nhận con, lập hội đồng, phân xử. Uy tín bị ràng buộc.',
    viDu: ['ký một hòa ước với vị thần phía nam'],
    gia: g({ deHieuSai: 0.15, loDienThan: 60, tuRangBuoc: true }),
    loiKeMau: 'Hai vị thần vừa cùng chịu một điều.',
  },
];

export function kenhTheoId(id: string): KenhCanThiep | undefined {
  return KENH_DUNG_SAN.find((k) => k.id === id);
}

/**
 * Kênh dùng được với một vị thần trong một hoàn cảnh.
 *
 * [BB] 67.7 — đây là **gợi ý**, không phải biên giới. Người chơi vẫn gõ tự do và
 * Intent parser vẫn phải hiểu; danh sách này chỉ để màn hình có gì đó để mời.
 * Vì vậy hàm lọc theo *điều kiện thế giới*, không theo "cấp độ mở khóa".
 */
export function kenhKhaDung(dieuKien: {
  coTinDo: boolean;
  coDen: boolean;
  coTheChe: boolean;
  coThanKhac: boolean;
  luatNenCoSan: readonly string[];
}): readonly KenhCanThiep[] {
  return KENH_DUNG_SAN.filter((k) => {
    if (k.gia.canLuatNen.some((l) => !dieuKien.luatNenCoSan.includes(l))) return false;
    // Không có ai thờ thì nói với ai? Dấu hiệu vẫn gửi được — thế giới vẫn ở đó.
    if (!dieuKien.coTinDo && (k.id === 'giao_ly' || k.id === 'su_gia')) return false;
    if (!dieuKien.coTheChe && k.id === 'giao_ly') return false;
    if (!dieuKien.coThanKhac && k.id === 'ngoai_giao_than') return false;
    return true;
  });
}
