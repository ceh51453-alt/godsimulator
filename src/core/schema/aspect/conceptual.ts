/** Aspect `conceptual` — Khái Niệm. Phần 8.1. */
import { z } from 'zod';

/**
 * Năm bậc, đúng thứ tự leo.
 *
 * `luong_lu` nằm giữa `thanh_hinh` và `ket_tinh`, không phải một nhánh chết bên
 * cạnh: khái niệm đã đủ trọng số nhưng nguồn của nó không nghiêng hẳn về ý chí
 * hay lặp lại thì nó **chưa biết mình sẽ thành thần hay thành luật**. Bậc ấy đã
 * có mặt trong schema từ đầu qua `tickVaoLuongLu` và trong Bảng Thiên Diễn qua
 * cột "lưỡng lự", chỉ là enum thì thiếu — nên cột ấy luôn bằng 0 và không ai
 * nhận ra.
 */
export const GIAI_DOAN_KHAI_NIEM = ['hu_danh', 'manh_nha', 'thanh_hinh', 'luong_lu', 'ket_tinh'] as const;
export type GiaiDoanKhaiNiem = (typeof GIAI_DOAN_KHAI_NIEM)[number];

/**
 * Bậc dưới dạng số, để so sánh "ít nhất đạt tới".
 *
 * Trả `-1` cho chuỗi lạ: một save cũ hoặc một pack ngoài khai bậc engine không
 * biết thì nó nằm DƯỚI mọi yêu cầu, chứ không được vô tình lọt qua một phép so
 * sánh nào.
 */
export function bacKhaiNiem(giaiDoan: string | undefined): number {
  return giaiDoan === undefined ? -1 : GIAI_DOAN_KHAI_NIEM.indexOf(giaiDoan as GiaiDoanKhaiNiem);
}

/** Đã đủ thật để một điều luật hay một trục nền bám vào — 43.3. */
export function daThanhHinh(giaiDoan: string | undefined): boolean {
  return bacKhaiNiem(giaiDoan) >= bacKhaiNiem('thanh_hinh');
}

export const ConceptualSchema = z
  .object({
    giaiDoan: z.enum(GIAI_DOAN_KHAI_NIEM).prefault('hu_danh'),
    trongSo: z.number().min(0).prefault(0),
    nguongKetTinh: z.number().prefault(1000),

    nguon: z
      .object({
        /** Có ai đó CHỌN, MUỐN, QUYẾT ĐỊNH. */
        yChi: z.number().prefault(0),
        /** Cứ thế xảy ra, không ai chọn. */
        lapLai: z.number().prefault(0),
      })
      .prefault({}),

    /** [BB] KHÔNG bao giờ do người chơi khai. Chỉ engine cộng vào từ sự kiện thật. */
    sacThai: z.record(z.string(), z.number()).prefault({}),
    phanNghiaId: z.string().nullable().prefault(null),
    cangThang: z
      .array(
        z
          .object({
            khaiNiemId: z.string(),
            doCang: z.number().min(0).max(100),
          })
          .strict(),
      )
      .prefault([]),

    ketTinhThanh: z.enum(['chua', 'than', 'luat', 'ca_hai']).prefault('chua'),
    thucTheIds: z.array(z.string()).prefault([]),
    tickVaoLuongLu: z.number().nullable().prefault(null),
  })
  .prefault({});

export type Conceptual = z.infer<typeof ConceptualSchema>;
