/**
 * Aspect `lawful` — Định Luật. Phần 9.1.
 *
 * [BB] Phần 18.2: `lawful.vanBan` KHÔNG BAO GIỜ đến được tầng phàm nhân.
 * Phàm nhân chỉ thấy `dienGiai` của vùng mình — tức bản đã sai.
 */
import { z } from 'zod';
import { ExprNodeSchema } from '../../contracts/primitives.js';

export const PHAM_VI_LUAT = ['vu_tru', 'coi', 'vung', 'chung_loai', 'huyet_mach', 'ca_the'] as const;

export const LawfulSchema = z
  .object({
    /** Câu người chơi viết, nguyên văn. [BB] Bí mật với tầng phàm nhân. */
    vanBan: z.string().prefault(''),

    // ── BẢY TRƯỜNG LOGIC HOÀN CHỈNH ──
    phamVi: z
      .object({
        loai: z.enum(PHAM_VI_LUAT).prefault('vu_tru'),
        mucTieu: z.array(z.string()).prefault([]),
      })
      .prefault({}),

    kichHoat: z
      .object({
        suKien: z.string().prefault(''),
        /** AST giới hạn, không phải chuỗi eval. */
        dieuKien: ExprNodeSchema.prefault({ op: 'literal', value: true, args: [] }),
      })
      .prefault({}),

    hieuUng: z
      .array(
        z
          .object({
            duongDan: z.string(),
            phep: z.enum(['set', 'add', 'mul', 'push', 'remove', 'flag']),
            giaTri: z.unknown(),
          })
          .strict(),
      )
      .prefault([]),

    /** Rỗng = luật tuyệt đối, nhưng PHẢI khai tường minh (kiểm tra 4). */
    ngoaiLe: z
      .array(
        z
          .object({
            dieuKien: ExprNodeSchema,
            moTa: z.string().prefault(''),
          })
          .strict(),
      )
      .prefault([]),

    /** Luật này KHÔNG làm gì. Kiểm tra 5 trượt nếu bỏ trống. */
    bien: z.string().prefault(''),
    uuTien: z.number().min(0).max(1000).prefault(100),
    xungDot: z
      .array(
        z
          .object({
            luatId: z.string(),
            cachGiai: z
              .enum(['uu_tien_cao_thang', 'pham_vi_hep_thang', 'sinh_nghich_ly'])
              .prefault('uu_tien_cao_thang'),
          })
          .strict(),
      )
      .prefault([]),
    khaNghich: z
      .object({
        duocKhong: z.boolean().prefault(false),
        boiAi: z
          .enum(['khong_ai', 'sang_the_than', 'than_cung_domain', 'pham_nhan_dac_biet'])
          .prefault('khong_ai'),
        gia: z.string().prefault(''),
      })
      .prefault({}),
    // ── HẾT BẢY TRƯỜNG ──

    /**
     * TIẾP ĐỊA — Phần 42.2 [BB], thêm ở Phase 10.
     *
     * "Khái niệm là từ vựng của thực tại. Định luật là câu viết bằng từ vựng đó.
     * Không thể viết một câu bằng những từ chưa tồn tại."
     *
     * Ba trường dưới đây `.prefault()` nên save trước Phase 10 parse nguyên vẹn:
     * luật cũ vào với `tiepDia = []`, và `tinhHieuLuc()` trả 0 cho chúng — đúng
     * ngữ nghĩa "chưa ai khai nền cho câu này".
     */
    tiepDia: z
      .array(
        z
          .object({
            khaiNiemId: z.string(),
            vaiTro: z.enum(['chu_the', 'doi_tuong', 'tac_dong', 'trang_thai', 'pham_tru']),
            batBuoc: z.boolean().prefault(true),
          })
          .strict(),
      )
      .prefault([]),

    /** [BB] 42.2 — engine tính, KHÔNG ai khai. */
    hieuLuc: z.number().min(0).max(100).prefault(0),
    cheDoTiepDia: z.enum(['chat_che', 'tu_tiep_dia', 'tu_suy']).prefault('tu_tiep_dia'),

    /** "Tinh thần" của luật — dùng tính kẽ hở (9.5). */
    theTag: z.array(z.string()).prefault([]),
    /** EJS, mặt mềm. */
    chiThiAi: z.string().prefault(''),

    /** [BB] Tầng 2 bắt buộc sai. doLech tăng mỗi thế hệ. */
    dienGiai: z
      .array(
        z
          .object({
            theHe: z.number(),
            vungId: z.string().prefault(''),
            noiDung: z.string(),
            doLech: z.number().min(0).max(100).prefault(0),
          })
          .strict(),
      )
      .prefault([]),

    keHo: z
      .array(
        z
          .object({
            moTa: z.string(),
            daBiKhaiThac: z.boolean().prefault(false),
            boiAi: z.string().prefault(''),
          })
          .strict(),
      )
      .prefault([]),

    truongDaXacNhan: z.array(z.string()).prefault([]),
    lichSuSua: z
      .array(
        z
          .object({
            tick: z.number(),
            cheDo: z.enum(['tiem_tien', 'hoi_to', 'phan_nhanh']),
            truoc: z.string(),
            sau: z.string(),
          })
          .strict(),
      )
      .prefault([]),

    trangThai: z.enum(['nhap', 'hieu_luc', 'treo', 'da_huy']).prefault('nhap'),
  })
  .prefault({});

export type Lawful = z.infer<typeof LawfulSchema>;
