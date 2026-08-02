/** Aspect `conceptual` — Khái Niệm. Phần 8.1. */
import { z } from 'zod';

export const GIAI_DOAN_KHAI_NIEM = ['hu_danh', 'manh_nha', 'thanh_hinh', 'ket_tinh'] as const;

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
