/**
 * Đường ống tác vụ — Phần 50.2, 50.4, 50.5, 50.7, 50.8 [BB].
 *
 * ── Vì sao có khối này ──
 *
 * 47.2 gộp mọi việc vào một call. Sai ở ba điểm: mỗi việc cần một **model** khác
 * nhau, một **nhịp** khác nhau, và một **ngữ cảnh** khác nhau. Gộp tất cả vào một
 * call là chọn model tệ nhất cho việc khó nhất.
 *
 * ── [BB] `nhomPrompt` là MẢNG CÓ TÊN VÀ VAI TRÒ ──
 *
 * Không phải một chuỗi lớn. "Người dùng cần bật tắt từng nhóm để gỡ lỗi — đây là
 * điểm khác biệt lớn giữa một workflow dùng được và một workflow không gỡ được."
 */
import { z } from 'zod';

// ─────────────────────────────────────────── lịch (50.4)

export const CHE_DO_LICH = ['moi_luot', 'theo_luot', 'theo_thoi_gian_truyen', 'theo_su_kien'] as const;
export type CheDoLich = (typeof CHE_DO_LICH)[number];

export const DON_VI_THOI_GIAN = ['gio', 'ngay', 'tuan', 'thang', 'nam', 'the_dai'] as const;
export type DonViThoiGian = (typeof DON_VI_THOI_GIAN)[number];

export const WorkflowScheduleSchema = z
  .object({
    cheDo: z.enum(CHE_DO_LICH),
    soLuot: z.number().min(1).prefault(3),
    thoiGianTruyen: z
      .object({
        giaTri: z.number().prefault(1),
        donVi: z.enum(DON_VI_THOI_GIAN).prefault('tuan'),
        nguonThoiGian: z
          .object({
            /**
             * [BB] 50.4 — với Thiên Diễn mặc định là `tick_engine`: engine đã có
             * đồng hồ chuẩn, không cần parse văn bản. `the_trong_van_ban` chỉ
             * dùng khi nhập workflow từ hệ khác.
             */
            loai: z.enum(['tick_engine', 'the_trong_van_ban']).prefault('tick_engine'),
            tenThe: z.array(z.string()).prefault([]),
            pham_vi: z.enum(['ai_hien_tai', 'toan_bo']).prefault('ai_hien_tai'),
          })
          .prefault({}),
        /** [BB] `bo_qua` là mặc định an toàn: không đọc được thời gian thì bỏ lượt, KHÔNG chạy bừa. */
        khiParseLoi: z.enum(['bo_qua', 'chay_luon', 'dung']).prefault('bo_qua'),
      })
      .prefault({}),
    suKien: z.array(z.string()).prefault([]),
  })
  .strict();

export type WorkflowSchedule = z.infer<typeof WorkflowScheduleSchema>;

// ─────────────────────────────────────────── ngữ cảnh riêng (50.5)

export const TaskContextSchema = z
  .object({
    soLuotLichSu: z.number().prefault(5),
    /** CHỈ lấy phần giữa hai mốc — công cụ tiết kiệm token mạnh nhất ở đây. */
    quyTacTrich: z.array(z.object({ batDau: z.string(), ketThuc: z.string() }).strict()).prefault([]),
    quyTacLoaiTru: z.array(z.object({ batDau: z.string(), ketThuc: z.string() }).strict()).prefault([]),
    /** Tầng nào của Phần 33 được nạp. Bỏ tầng 1–3 cũng là bỏ prefix cache. */
    tangAssembler: z.array(z.number()).prefault([1, 2, 3, 4, 5, 6]),
    soKyUcGoiLai: z.number().prefault(10),
    lorebookRieng: z
      .object({
        cheDo: z.enum(['ke_thua', 'tu_chon', 'tat']).prefault('ke_thua'),
        lorebookIds: z.array(z.string()).prefault([]),
      })
      .prefault({}),
  })
  .prefault({});

export type TaskContext = z.infer<typeof TaskContextSchema>;

// ─────────────────────────────────────────── đích ghi (50.7)

export const LOAI_DICH_GHI = ['chen_vao_canh', 'bien_theo_luot', 'ghi_lorebook', 'patch_world'] as const;
export type LoaiDichGhi = (typeof LOAI_DICH_GHI)[number];

export const WriteTargetSchema = z
  .object({
    loai: z.enum(LOAI_DICH_GHI),
    mauChen: z.string().prefault(''),
    lorebookNguon: z.enum(['nhan_vat', 'the_gioi', 'chi_dinh']).prefault('the_gioi'),
    lorebookId: z.string().prefault(''),
    tenEntry: z.string().prefault(''),
    loaiEntry: z.enum(['constant', 'keyword']).prefault('constant'),
    keys: z.string().prefault(''),
    viTri: z
      .object({
        position: z.string().prefault('after_character_definition'),
        depth: z.number().prefault(1),
        order: z.number().prefault(99_999),
      })
      .prefault({}),
    /** [BB] 50.7 — BẮT BUỘC cho mọi entry do workflow ghi. Không có nó thì vòng lặp nổ. */
    chongDeQuy: z.boolean().prefault(true),
    tachTheoThuocTinh: z.boolean().prefault(false),
  })
  .strict();

export type WriteTarget = z.infer<typeof WriteTargetSchema>;

// ─────────────────────────────────────────── tác vụ (50.2)

export const WorkflowTaskSchema = z
  .object({
    id: z.string(),
    ten: z.string(),
    bat: z.boolean().prefault(true),
    /** Tác vụ cùng `giaiDoan` chạy song song; giai đoạn sau chờ giai đoạn trước. */
    giaiDoan: z.number().min(1).prefault(1),

    nhomPrompt: z
      .array(
        z
          .object({
            ten: z.string(),
            vaiTro: z.enum(['system', 'user', 'assistant']),
            /** CHỨA EJS. */
            noiDung: z.string(),
            bat: z.boolean().prefault(true),
          })
          .strict(),
      )
      .prefault([]),

    apiPresetName: z.string().prefault(''),
    apiPresetDuPhong: z.array(z.string()).prefault([]),
    modelDeXuat: z.string().prefault(''),
    soLuongSongSong: z.number().min(1).max(16).prefault(4),

    soLanThuLai: z.number().min(0).max(6).prefault(3),
    doDaiToiThieu: z.number().prefault(0),
    cachGop: z.enum(['noi', 'ghi_de', 'gop_json']).prefault('noi'),

    lich: WorkflowScheduleSchema.nullable().prefault(null),

    cheDoNguCanh: z.enum(['ke_thua', 'rieng']).prefault('ke_thua'),
    nguCanhRieng: TaskContextSchema.prefault({}),

    theTrichXuat: z.array(z.string()).prefault([]),
    cheDoCoNhau: z.enum(['tat', 'json_patch', 'json_schema']).prefault('tat'),
    quyTacCoNhau: z.record(z.string(), z.string()).prefault({}),

    /** Liệt kê rồi xử lý song song — 50.3. */
    hoBanSao: z
      .object({
        bat: z.boolean().prefault(false),
        /** Id nguồn liệt kê; engine tra bảng `NGUON_LIET_KE`, KHÔNG eval chuỗi. */
        nguonLietKe: z.string().prefault(''),
        bienThayThe: z.string().prefault('MUC'),
        gioiHan: z.number().int().min(1).max(200).prefault(30),
      })
      .prefault({}),

    dichGhi: z.array(WriteTargetSchema).prefault([]),
  })
  .strict();

export type WorkflowTask = z.infer<typeof WorkflowTaskSchema>;

// ─────────────────────────────────────────── preset workflow (50.8)

export const WorkflowPresetSchema = z
  .object({
    ten: z.string(),
    moTa: z.string().prefault(''),
    tasks: z.array(WorkflowTaskSchema).prefault([]),
    mauChenCuoi: z.string().prefault(''),
    mauBienThe: z.string().prefault(''),
    nguCanhChung: TaskContextSchema.prefault({}),
    quyTacGhiLorebook: z.array(WriteTargetSchema).prefault([]),
  })
  .strict();

export type WorkflowPreset = z.infer<typeof WorkflowPresetSchema>;

// ─────────────────────────────────────────── json_patch (50.6)

/**
 * Op mở rộng của RFC 6902 — 50.6.
 *
 * [BB] `delta` là op quan trọng nhất và **không có trong RFC gốc**. Không có nó
 * thì model phải tự tính giá trị tuyệt đối, và nó sẽ tính sai. `delta` ánh xạ
 * thẳng sang `{_op:'add'}` của 31.7.
 */
export const JSON_PATCH_OPS = ['replace', 'delta', 'insert', 'remove', 'move'] as const;
export type JsonPatchOp = (typeof JSON_PATCH_OPS)[number];

export const JsonPatchEntrySchema = z
  .object({
    op: z.enum(JSON_PATCH_OPS),
    path: z.string(),
    value: z.unknown().optional(),
    from: z.string().optional(),
    index: z.number().int().optional(),
  })
  .strict();

export type JsonPatchEntry = z.infer<typeof JsonPatchEntrySchema>;
