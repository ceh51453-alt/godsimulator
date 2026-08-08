/**
 * Diễn Hóa tự động — Phần 47 [BB].
 *
 * > Người chơi bấm một nút, thế giới tự chạy nhiều lượt, rồi báo cáo lại.
 *
 * ── Chỗ quyết định tính năng này hữu ích hay vô dụng ──
 *
 * [BB] 47.3: "Diễn Hóa không nên dừng khi hết số lượt. Nó nên dừng khi **có
 * chuyện đáng xem**." Và:
 *
 * > Bạn không xem một trăm năm, bạn xem đúng ba khoảnh khắc đáng xem trong một
 * > trăm năm đó.
 *
 * Vì vậy `kiemDieuKienDung()` là hàm dài nhất file này, và mỗi điều kiện trả về
 * một `moTa` đủ để báo cáo **mở thẳng vào chỗ đó**.
 *
 * ── Lằn ranh cứng ──
 *
 * [BB] 47.4 — Diễn Hóa KHÔNG BAO GIỜ được, bất kể cấu hình: sửa Luật Nền · dùng
 * Vũ Khí Khái Niệm · kích hoạt kết cục · hợp nhánh hoặc tạo nhánh · sửa `tuning`,
 * `R.*` hay cấu hình · xóa cứng entity · trả lời lời cầu thay người chơi.
 *
 * `locPatchTheoLanRanh()` cưỡng chế danh sách ấy trên TỪNG patch, và nó chạy
 * trước khi patch chạm transaction.
 */
import { z } from 'zod';
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { StructuredError } from '../contracts/errors.js';
import { loi } from '../contracts/errors.js';
import type { Storyline } from '../schema/truyen.js';
import { TICK_MOI_NAM } from '../schema/aspect/substrate.js';
import { THO_BOI_DAP } from './boiDap.js';
import { TICK_MOI_BUOC } from './process/catchUp.js';

// ─────────────────────────────────────────── cấu hình

export const NHIP_DIEN_HOA = ['nien', 'the_dai', 'vinh_kiep'] as const;
export type NhipDienHoa = (typeof NHIP_DIEN_HOA)[number];

/**
 * Số tick truyện mỗi lượt Diễn Hóa — [BB] ADR-0019: 4 tick một năm.
 *
 * `vinh_kiep` cố tình dừng ở một thế kỷ chứ không ở "vô hạn": một lượt tua mà
 * người chơi không đoán được nó dài bao nhiêu là một lượt tua không ai dám bấm.
 */
export const TICK_MOI_LUOT: Readonly<Record<NhipDienHoa, number>> = Object.freeze({
  nien: 4,
  the_dai: 4 * 30,
  vinh_kiep: 4 * 100,
});

export const DIEU_KIEN_DUNG_DIEN_HOA = [
  'het_luot',
  'can_ngan_sach',
  'reality_tut_qua_20',
  'mach_dat_cao_trao',
  'nhan_vat_nguoi_choi_lam_nguy',
  'ke_thu_troi_day',
  'ky_vong_lorebook_bi_lech',
  'co_che_moi_xuat_hien',
  'luat_nen_duoc_dat_ten',
  'than_mat_domain',
  'phuc_but_qua_han',
] as const;
export type DieuKienDungDienHoa = (typeof DIEU_KIEN_DUNG_DIEN_HOA)[number];

export const CauHinhDienHoaSchema = z
  .object({
    soLuot: z.number().min(1).max(500).prefault(20),
    nhipMoiLuot: z.enum(NHIP_DIEN_HOA).prefault('nien'),
    chayNen: z.boolean().prefault(true),
    nganSach: z
      .object({
        callToiDa: z.number().prefault(60),
        tokenToiDa: z.number().prefault(4_000_000),
        dungKhiCan: z.boolean().prefault(true),
      })
      .prefault({}),
    phamViChoPhep: z
      .object({
        dongTu: z.array(z.string()).prefault(['HIEN', 'DINH', 'HOP', 'PHAN']),
        duocGiaiLoHong: z.boolean().prefault(true),
        duocKetTinhLuat: z.boolean().prefault(true),
        duocSinhMachTruyen: z.boolean().prefault(true),
        duocSinhThanMoi: z.boolean().prefault(true),
        duocGietNhanVatT2: z.boolean().prefault(true),
        /** [BB] 47.4 — công tắc riêng, mặc định TẮT. Bật là chọn chế độ khắc nghiệt. */
        duocGietNhanVatNguoiChoi: z.boolean().prefault(false),
      })
      .prefault({}),
    dieuKienDung: z.array(z.enum(DIEU_KIEN_DUNG_DIEN_HOA)).prefault([...DIEU_KIEN_DUNG_DIEN_HOA]),
    bacBaoCao: z.enum(['tom_tat', 'bien_nien', 'day_du']).prefault('bien_nien'),
    /**
     * Bồi Đắp — thế giới tự dày lên trong lúc tua. Mặc định BẬT.
     *
     * Tách khỏi `phamViChoPhep` vì nó không phải một quyền: `phamViChoPhep` nói
     * Diễn Hóa được phép **phá** tới đâu, còn đây nói nó **xây** bao nhiêu.
     */
    boiDap: z
      .object({
        bat: z.boolean().prefault(true),
        /** Số việc mỗi lượt. 0 nghĩa là tắt hẳn mà không phải sửa `bat`. */
        hanMucMoiLuot: z.number().int().min(0).max(20).prefault(3),
        tho: z.array(z.enum(THO_BOI_DAP)).prefault([...THO_BOI_DAP]),
        /**
         * Số lần hỏi model cho CẢ một lần Diễn Hóa — thợ thứ bảy của `boiDapAi.ts`.
         *
         * Đếm theo LẦN CHẠY chứ không theo lượt, và đó là toàn bộ điểm của con
         * số này: sáu thợ engine chạy mỗi lượt vì chúng miễn phí, còn người thứ
         * bảy tốn tiền nên phải nói được trước khi bấm là "lần này tốn mấy call".
         * Nhân nó với `soLuot` sẽ biến một trăm năm tua thành hai trăm call.
         *
         * Mặc định 1: đủ để mỗi lần tua dạy thế giới thêm ít chữ và lấp vài chỗ
         * trống, và là con số mà một người bấm thử lần đầu không thấy tiếc.
         * 0 nghĩa là Diễn Hóa không gọi model một lần nào — hành vi cũ, vẫn giữ.
         */
        soCallAi: z.number().int().min(0).max(5).prefault(1),
      })
      .prefault({}),
  })
  .prefault({});

export type CauHinhDienHoa = z.infer<typeof CauHinhDienHoaSchema>;

/**
 * Diễn Hóa tự động cuối lượt — [BB] 47 gặp ADR-0028.
 *
 * ── Vì sao mặc định BẬT và mặc định NGẮN ──
 *
 * Bật, vì thế giới đứng im giữa hai câu người chơi gõ là thứ làm mọi trò chơi
 * loại này chết: mọi thứ chỉ xảy ra khi có người nhìn. Ngắn (một lượt, tức một
 * năm), vì ADR-0028 nói thế giới KHÔNG được đi tiếp mà người chơi không đọc
 * được — nên mỗi nhịp nền phải viết ra biên niên sử của chính nó, và một nhịp
 * dài ba mươi năm thì dòng biên niên ấy không còn kể nổi.
 */
export const CauHinhTuDienHoaSchema = z
  .object({
    bat: z.boolean().prefault(true),
    /**
     * Nhịp thích ứng theo tuổi thế giới và thứ ống kính đang kể.
     *
     * Hư Vô không được bò từng năm; ngược lại, một cảnh có nhân vật không được
     * nhảy mất cả thế hệ. Tắt công tắc này thì ba ô `nhip` / `soLuot` /
     * `moiBaoNhieuLuot` bên dưới lại là cấu hình có hiệu lực trực tiếp.
     */
    thichUng: z.boolean().prefault(true),
    nhip: z.enum(NHIP_DIEN_HOA).prefault('nien'),
    /** Số lượt tua sau MỖI lần nhịp nền chạy. Trần thấp có chủ đích — xem trên. */
    soLuot: z.number().int().min(1).max(12).prefault(1),
    /**
     * Cứ bao nhiêu lượt KỂ thì nhịp nền chạy một lần. Mặc định 1 — mỗi lượt.
     *
     * Tách khỏi `soLuot` vì hai con số trả lời hai câu khác nhau: `soLuot` là
     * *thế giới đi bao xa mỗi lần*, còn đây là *bao lâu nó đi một lần*. Người
     * muốn một thế giới trầm hơn đặt số này lên 5 và giữ `soLuot` ở 1; người
     * muốn thế giới nhảy vọt làm ngược lại. Gộp chúng thành một sẽ mất một nửa
     * số cách chơi.
     */
    moiBaoNhieuLuot: z.number().int().min(1).max(50).prefault(10),
    hanMucBoiDap: z.number().int().min(0).max(10).prefault(2),
    /**
     * Mô phỏng hậu trường — đường ống Workflow chạy cùng nhịp nền.
     *
     * ── Vì sao nó ở ĐÂY chứ không ở khối Diễn Hóa thủ công ──
     *
     * Vì đây là chỗ nó có nghĩa. Diễn Hóa thủ công là một lần tua có chủ đích:
     * người chơi bấm, rồi ngồi đọc báo cáo. Mô phỏng hậu trường là thứ ngược
     * lại — nó chạy trong lúc người chơi đang kể, và thứ nó đẻ ra không đi vào
     * một báo cáo mà đi vào Sổ Hậu Trường để chính văn kể dần.
     *
     * Mặc định BẬT, và mặc định thưa: `moiBaoNhieuLuot` mười lượt. Đây là chỗ
     * duy nhất nhịp nền tiêu tiền, nên nhịp phải thưa đủ để người chơi kể xong
     * một cảnh trước khi thế giới lại chuyển mình sau lưng họ.
     */
    workflow: z
      .object({
        bat: z.boolean().prefault(true),
        presetId: z.string().prefault('engine_hau_truong'),
        /** Bỏ qua lịch riêng của từng tác vụ — xem `epChayHet` ở `workflow/chay.ts`. */
        epChayHet: z.boolean().prefault(true),
        /** Trần ghi chú lấy từ MỘT tác vụ. Một bản tin dài không được nuốt cả sổ. */
        soGhiChuMoiTacVu: z.number().int().min(1).max(12).prefault(4),
      })
      .prefault({}),
    /**
     * Bao nhiêu chuyện hậu trường được dệt vào MỘT lượt kể.
     *
     * Ba, và con số nhỏ là toàn bộ điểm của hàng đợi: một lần mô phỏng đẻ ra hai
     * chục điều, và nhét cả hai chục vào lượt kế tiếp cho ra một bản tin chứ
     * không ra một cảnh. 0 nghĩa là tắt hẳn phần dệt mà vẫn giữ sổ.
     */
    soGhiChuMoiLuotKe: z.number().int().min(0).max(8).prefault(3),
  })
  .prefault({});

export type CauHinhTuDienHoa = z.infer<typeof CauHinhTuDienHoaSchema>;

export const GIAI_DOAN_NHIP_NEN = [
  'tien_sang_the',
  'hau_sang_the_rat_som',
  'hau_sang_the_som',
  'the_gioi_dang_lon',
  'the_gioi_truong_thanh',
  'dang_ke_truyen',
] as const;
export type GiaiDoanNhipNen = (typeof GIAI_DOAN_NHIP_NEN)[number];

export type NhipNenHieuLuc = Readonly<{
  nhip: NhipDienHoa;
  soLuot: number;
  moiBaoNhieuLuot: number;
  giaiDoan: GiaiDoanNhipNen;
  nhan: string;
}>;

/**
 * Chọn tốc độ nền từ chính lịch sử có thể kiểm chứng của thế giới.
 *
 * `tickSinh` của thực thể hữu hình đầu tiên là mốc Sáng Thế. Khái niệm và luật
 * có thể đã rung động trong Hư Vô nên không được dùng làm mốc ấy. Sau mốc, tốc
 * độ hạ từng bậc thay vì rơi thẳng từ một thiên niên kỷ xuống một năm.
 *
 * Mạch truyện đang được chiếu luôn thắng mọi bậc tuổi. Đây là ranh giữa tua lịch
 * sử và kể một cảnh: lịch sử được phép nuốt thế kỷ, cảnh thì không.
 */
export function tinhNhipNenHieuLuc(
  state: WorldState,
  cauHinh: CauHinhTuDienHoa,
  dangKeTruyen: boolean,
): NhipNenHieuLuc {
  if (!cauHinh.thichUng) {
    return {
      nhip: cauHinh.nhip,
      soLuot: cauHinh.soLuot,
      moiBaoNhieuLuot: cauHinh.moiBaoNhieuLuot,
      giaiDoan: 'the_gioi_truong_thanh',
      nhan: 'nhịp do người chơi đặt',
    };
  }

  if (dangKeTruyen || state.world.playerState.mode !== 'sang_the') {
    return {
      nhip: 'nien',
      soLuot: 1,
      moiBaoNhieuLuot: 6,
      giaiDoan: 'dang_ke_truyen',
      nhan: 'đang kể truyện — thời gian đi chậm',
    };
  }

  const mocSangThe = [...state.entities.values()]
    .filter((e) => e.kind === 'place' || e.kind === 'deity' || e.kind === 'mortal')
    .reduce<number | null>((moc, e) => (moc === null ? e.tickSinh : Math.min(moc, e.tickSinh)), null);

  if (mocSangThe === null) {
    return {
      nhip: 'vinh_kiep',
      soLuot: 12,
      moiBaoNhieuLuot: 1,
      giaiDoan: 'tien_sang_the',
      nhan: 'tiền Sáng Thế — thời gian cuộn cực nhanh',
    };
  }

  const tuoiSauSangThe = Math.max(0, state.world.tick - mocSangThe);
  if (tuoiSauSangThe < TICK_MOI_NAM * 400) {
    return {
      nhip: 'vinh_kiep',
      soLuot: 4,
      moiBaoNhieuLuot: 1,
      giaiDoan: 'hau_sang_the_rat_som',
      nhan: 'hậu Sáng Thế sơ khai — thế kỷ cuộn qua',
    };
  }
  if (tuoiSauSangThe < TICK_MOI_NAM * 1_200) {
    return {
      nhip: 'vinh_kiep',
      soLuot: 2,
      moiBaoNhieuLuot: 1,
      giaiDoan: 'hau_sang_the_som',
      nhan: 'hậu Sáng Thế — thời gian đang giảm tốc',
    };
  }
  if (tuoiSauSangThe < TICK_MOI_NAM * 3_000) {
    return {
      nhip: 'the_dai',
      soLuot: 2,
      moiBaoNhieuLuot: 1,
      giaiDoan: 'the_gioi_dang_lon',
      nhan: 'thế giới đang lớn — mỗi lần vài thế hệ',
    };
  }
  if (tuoiSauSangThe < TICK_MOI_NAM * 10_000) {
    return {
      nhip: 'the_dai',
      soLuot: 1,
      moiBaoNhieuLuot: 2,
      giaiDoan: 'the_gioi_dang_lon',
      nhan: 'thế giới đã định hình — thời gian chậm dần',
    };
  }
  return {
    nhip: 'nien',
    soLuot: 1,
    moiBaoNhieuLuot: 6,
    giaiDoan: 'the_gioi_truong_thanh',
    nhan: 'thế giới trưởng thành — thời gian đi chậm',
  };
}

// ─────────────────────────────────────────── ngân sách bước engine

/**
 * Trần bước engine cho MỘT lần Diễn Hóa.
 *
 * Đây là chỗ lỗi treo trình duyệt được đóng lại. Bản cũ chạy `motTick` từng
 * tick một: `vinh_kiep` × 500 lượt = 200.000 lần gọi scheduler trong một vòng
 * lặp đồng bộ, tức là tab chết trước khi lượt thứ mười chạy xong.
 *
 * Bản này đi qua `tuaThoiGian()`, vốn gộp `TICK_MOI_BUOC[nhịp]` tick vào một
 * lần gọi. Cùng một trăm năm ấy giờ tốn 1 bước ở `vinh_kiep` thay vì 400. Trần
 * dưới đây canh phần còn lại: quá trần thì **từ chối tử tế** kèm câu nói rõ
 * phải đổi gì — cùng chính sách với `TUA_VUOT_NGAN_SACH` của 71.6.
 */
export const TRAN_BUOC_DIEN_HOA = 3000;

/** Số bước engine một lượt tua tốn, theo nhịp. */
export function buocMoiLuot(nhip: NhipDienHoa): number {
  return Math.max(1, Math.ceil(TICK_MOI_LUOT[nhip] / Math.max(1, TICK_MOI_BUOC[nhip])));
}

export type UocLuongDienHoa = {
  readonly soBuoc: number;
  readonly soTick: number;
  readonly quaTran: boolean;
  /** Câu nói với người chơi khi quá trần; rỗng khi chạy được. */
  readonly loiTuChoi: string;
};

/** Ước lượng chi phí TRƯỚC khi chạy — người chơi phải biết trước, không sau. */
export function uocLuongDienHoa(cauHinh: CauHinhDienHoa): UocLuongDienHoa {
  const soBuoc = cauHinh.soLuot * buocMoiLuot(cauHinh.nhipMoiLuot);
  const soTick = cauHinh.soLuot * TICK_MOI_LUOT[cauHinh.nhipMoiLuot];
  if (soBuoc <= TRAN_BUOC_DIEN_HOA) {
    return { soBuoc, soTick, quaTran: false, loiTuChoi: '' };
  }
  const luotToiDa = Math.max(1, Math.floor(TRAN_BUOC_DIEN_HOA / buocMoiLuot(cauHinh.nhipMoiLuot)));
  return {
    soBuoc,
    soTick,
    quaTran: true,
    loiTuChoi:
      `${cauHinh.soLuot} lượt ở nhịp này cần ${soBuoc} bước engine, vượt trần ${TRAN_BUOC_DIEN_HOA}. ` +
      `Hãy chọn nhịp thô hơn, hoặc hạ xuống ${luotToiDa} lượt.`,
  };
}

export const EvolutionLogSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    tickBatDau: z.number(),
    tickKetThuc: z.number(),
    soLuotChay: z.number(),
    soCall: z.number(),
    tokenDaDung: z.number(),
    lyDoDung: z.string(),
    suKienLon: z
      .array(
        z
          .object({
            tick: z.number(),
            moTa: z.string(),
            loai: z.string(),
            entityIds: z.array(z.string()).prefault([]),
            daXemChiTiet: z.boolean().prefault(false),
          })
          .strict(),
      )
      .prefault([]),
    /**
     * Thế giới đã dày thêm những gì — mỗi phần tử là một câu biên niên sử.
     *
     * Tách khỏi `suKienLon` vì hai thứ này trả lời hai câu hỏi khác nhau: kia là
     * "chuyện gì đã xảy ra", đây là "thế giới có thêm cái gì". Trộn chung thì
     * một trăm năm mở ba con đường sẽ đẩy hết những khoảnh khắc đáng xem ra khỏi
     * bốn mươi mục của báo cáo.
     */
    viecBoiDap: z
      .array(z.object({ tick: z.number(), tho: z.string(), moTa: z.string() }).strict())
      .prefault([]),
    /** [BB] 47.5 — ảnh chụp TRƯỚC khi chạy. Không có nút lùi thì tính năng này đáng sợ hơn đáng dùng. */
    anhChup: z.string(),
  })
  .strict();

export type EvolutionLog = z.infer<typeof EvolutionLogSchema>;

// ─────────────────────────────────────────── lằn ranh 47.4

/** Bảng mà Diễn Hóa KHÔNG BAO GIỜ được ghi — 47.4. */
export const BANG_CAM_DIEN_HOA: readonly string[] = Object.freeze(['substrateLaws', 'branches', 'lorebooks']);

/**
 * Đường dẫn cấm ngay cả trên bảng được phép.
 *
 * Bốn dòng cuối là phần đồng bộ với `DUONG_DAN_CAM` của `ai/bocTach.ts`. Hai
 * danh sách từng lệch nhau — Diễn Hóa cấm `nguongKetTinh` còn Narrator thì
 * không, Narrator sắp cấm `giaiDoan` còn Diễn Hóa thì không — và một lằn ranh
 * chỉ canh được một trong hai cửa thì không phải một lằn ranh.
 */
export const DUONG_DAN_CAM_DIEN_HOA: readonly string[] = Object.freeze([
  'playerState',
  'seed',
  'tuningProfileId',
  'aspects.conceptual.nguongKetTinh',
  'aspects.conceptual.trongSo',
  'aspects.conceptual.giaiDoan',
  'aspects.lawful.hieuLuc',
]);

export type KetQuaLocPatch = {
  readonly giu: readonly PatchOp[];
  readonly bo: readonly { readonly patch: PatchOp; readonly lyDo: string }[];
  readonly loi: readonly StructuredError[];
};

/**
 * Lọc patch theo lằn ranh cứng — 47.4.
 *
 * Bỏ TỪNG patch vi phạm chứ không hủy cả lô: cùng chính sách với 31.7, và vì
 * Diễn Hóa chạy hàng trăm lượt nên hủy cả lô vì một patch xấu là mất cả một thế kỷ.
 */
export function locPatchTheoLanRanh(
  patches: readonly PatchOp[],
  cauHinh: CauHinhDienHoa,
  state: WorldState,
): KetQuaLocPatch {
  const giu: PatchOp[] = [];
  const bo: { patch: PatchOp; lyDo: string }[] = [];
  const l: StructuredError[] = [];

  const chuTheNguoiChoi = state.world.playerState.chuTheId;

  for (const p of patches) {
    const t = p.target.table;

    if (BANG_CAM_DIEN_HOA.includes(t)) {
      bo.push({ patch: p, lyDo: `Diễn Hóa không được ghi bảng "${t}" (47.4).` });
      l.push(
        loi('patch', 'DIEN_HOA_BANG_CAM', `Bảng "${t}" nằm ngoài quyền của Diễn Hóa.`, { path: p.target.id }),
      );
      continue;
    }
    if (DUONG_DAN_CAM_DIEN_HOA.some((d) => p.target.path.startsWith(d))) {
      bo.push({ patch: p, lyDo: `Đường dẫn "${p.target.path}" là cấu hình, không phải trạng thái.` });
      continue;
    }
    // [BB] 47.4 — chỉ được `tickDiet`, KHÔNG được xóa record.
    if (p.op === 'unlink' && t === 'entities') {
      bo.push({ patch: p, lyDo: 'Diễn Hóa chỉ được đặt tickDiet, không được xóa cứng entity.' });
      continue;
    }
    // Giết nhân vật người chơi phải là công tắc riêng, mặc định tắt.
    if (
      chuTheNguoiChoi !== null &&
      p.target.id === chuTheNguoiChoi &&
      p.target.path === 'tickDiet' &&
      !cauHinh.phamViChoPhep.duocGietNhanVatNguoiChoi
    ) {
      bo.push({ patch: p, lyDo: 'Công tắc "được giết nhân vật người chơi" đang tắt.' });
      continue;
    }
    // Trả lời lời cầu thay người chơi.
    if (t === 'prayers' && p.target.path.startsWith('daTraLoi')) {
      bo.push({ patch: p, lyDo: 'Diễn Hóa không trả lời lời cầu thay người chơi (47.4).' });
      continue;
    }
    giu.push(p);
  }

  return { giu, bo, loi: l };
}

// ─────────────────────────────────────────── điều kiện dừng 47.3

export type SuKienDangXem = {
  readonly loai: DieuKienDungDienHoa;
  readonly moTa: string;
  readonly entityIds: readonly string[];
};

export type NgocCanhDung = {
  readonly state: WorldState;
  readonly cauHinh: CauHinhDienHoa;
  readonly luotDaChay: number;
  readonly soCall: number;
  readonly tokenDaDung: number;
  /** Cơ chế vừa bật ở lượt này — từ `quetCoChe()`. */
  readonly coCheVuaBat?: readonly string[];
  /** Trục luật nền vừa được đặt tên. */
  readonly trucVuaDatTen?: readonly string[];
  /** Kỳ vọng lorebook vừa lệch — từ `capNhatKyVong()`. */
  readonly kyVongVuaLech?: readonly string[];
  readonly realityTruoc: number;
};

/**
 * Kiểm mọi điều kiện dừng — 47.3.
 *
 * Trả về điều kiện ĐẦU TIÊN khớp theo thứ tự ưu tiên "đáng xem" chứ không theo
 * thứ tự khai báo: hết lượt và cạn ngân sách xếp cuối, vì dừng vì hết chỉ tiêu
 * là kết cục nhàm nhất trong danh sách.
 */
export function kiemDieuKienDung(nc: NgocCanhDung): SuKienDangXem | null {
  const bat = new Set(nc.cauHinh.dieuKienDung);
  const s = nc.state;

  const co = (dk: DieuKienDungDienHoa): boolean => bat.has(dk);

  if (co('mach_dat_cao_trao')) {
    const m = [...s.storylines.values()]
      .filter((x: Storyline) => x.giaiDoan === 'cao_trao' && x.ketCuc === null)
      .sort((a, b) => (a.id < b.id ? -1 : 1))[0];
    if (m !== undefined) {
      return {
        loai: 'mach_dat_cao_trao',
        moTa: `Mạch "${m.ten}" vừa lên cao trào — đây chính là lúc bạn muốn có mặt.`,
        entityIds: m.nhanVat.map((n) => n.entityId),
      };
    }
  }

  if (co('nhan_vat_nguoi_choi_lam_nguy')) {
    const id = s.world.playerState.chuTheId;
    const e = id === null ? undefined : s.entities.get(id);
    if (e !== undefined && e.tickDiet !== null) {
      return { loai: 'nhan_vat_nguoi_choi_lam_nguy', moTa: `${e.ten} đã chết.`, entityIds: [e.id] };
    }
    const than = e?.aspects['than_the'] as { sinhLuc?: number } | undefined;
    if (than !== undefined && (than.sinhLuc ?? 100) < 25) {
      return {
        loai: 'nhan_vat_nguoi_choi_lam_nguy',
        moTa: `${e?.ten ?? 'Nhân vật của bạn'} đang nguy tới tính mạng.`,
        entityIds: e === undefined ? [] : [e.id],
      };
    }
  }

  if (co('co_che_moi_xuat_hien') && (nc.coCheVuaBat ?? []).length > 0) {
    return {
      loai: 'co_che_moi_xuat_hien',
      moTa: `Một Cơ Chế Phái Sinh vừa đủ điều kiện tồn tại: ${(nc.coCheVuaBat as string[]).join(', ')}.`,
      entityIds: [],
    };
  }

  if (co('luat_nen_duoc_dat_ten') && (nc.trucVuaDatTen ?? []).length > 0) {
    return {
      loai: 'luat_nen_duoc_dat_ten',
      moTa: `Có kẻ vừa khái niệm hóa được trục ${(nc.trucVuaDatTen as string[]).join(', ')}.`,
      entityIds: [],
    };
  }

  if (co('ky_vong_lorebook_bi_lech') && (nc.kyVongVuaLech ?? []).length > 0) {
    return {
      loai: 'ky_vong_lorebook_bi_lech',
      moTa: 'Thế giới vừa rẽ khỏi thần thoại nguồn — có một Dị Bản mới.',
      entityIds: [],
    };
  }

  if (co('ke_thu_troi_day')) {
    const ke = [...s.entities.values()]
      .filter((e) => e.tickDiet === null && e.aspects['adversarial'] !== undefined)
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .find((e) => {
        const a = e.aspects['adversarial'] as { lanCuoiTroiDay?: number } | undefined;
        return (a?.lanCuoiTroiDay ?? -1) === s.world.tick;
      });
    if (ke !== undefined) {
      return { loai: 'ke_thu_troi_day', moTa: `${ke.ten} tới nhịp.`, entityIds: [ke.id] };
    }
  }

  if (co('than_mat_domain')) {
    for (const e of [...s.entities.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
      if (e.kind !== 'deity') continue;
      const d = e.aspects['domain'] as { domains?: { ten: string; trangThai?: string }[] } | undefined;
      const mat = (d?.domains ?? []).find((x) => x.trangThai === 'lost');
      if (mat !== undefined) {
        return {
          loai: 'than_mat_domain',
          moTa: `${e.ten} vừa mất vĩnh viễn domain "${mat.ten}".`,
          entityIds: [e.id],
        };
      }
    }
  }

  if (co('phuc_but_qua_han')) {
    const pb = [...s.foreshadows.values()]
      .filter((f) => !f.daTra && f.hanTraToiDa !== null && s.world.tick > f.tickGieo + f.hanTraToiDa)
      .sort((a, b) => (a.id < b.id ? -1 : 1))[0];
    if (pb !== undefined) {
      return {
        loai: 'phuc_but_qua_han',
        moTa: `Một điều đã gieo quá hạn chưa trả: ${pb.noiDung}`,
        entityIds: [],
      };
    }
  }

  if (co('reality_tut_qua_20') && nc.realityTruoc - s.metrics.realityIntegrity > 20) {
    return {
      loai: 'reality_tut_qua_20',
      moTa: `Thực tại đang rách nhanh: ${nc.realityTruoc} → ${Math.round(s.metrics.realityIntegrity)}.`,
      entityIds: [],
    };
  }

  if (
    co('can_ngan_sach') &&
    nc.cauHinh.nganSach.dungKhiCan &&
    (nc.soCall >= nc.cauHinh.nganSach.callToiDa || nc.tokenDaDung >= nc.cauHinh.nganSach.tokenToiDa)
  ) {
    return { loai: 'can_ngan_sach', moTa: 'Hết ngân sách call hoặc token.', entityIds: [] };
  }

  if (nc.luotDaChay >= nc.cauHinh.soLuot) {
    return { loai: 'het_luot', moTa: `Đã chạy đủ ${nc.cauHinh.soLuot} lượt.`, entityIds: [] };
  }

  return null;
}

// ─────────────────────────────────────────── báo cáo 47.6

export type BaoCaoDienHoa = {
  readonly tieuDe: string;
  readonly lyDoDung: string;
  readonly muc: readonly { readonly tick: number; readonly moTa: string; readonly xemDuoc: boolean }[];
  /** Phần "thế giới dày thêm" — song song với `muc`, không trộn vào nó. */
  readonly boiDap: readonly { readonly tick: number; readonly moTa: string }[];
  readonly chiSo: readonly string[];
  readonly dong: readonly string[];
};

/** Báo Cáo Diễn Hóa — 47.6, viết bằng GIỌNG BIÊN NIÊN SỬ, không phải giọng log. */
export function baoCaoDienHoa(
  log: EvolutionLog,
  truoc: { reality: number; songDong: number },
  sau: { reality: number; songDong: number },
): BaoCaoDienHoa {
  const soNam = Math.max(0, log.tickKetThuc - log.tickBatDau);
  const tieuDe =
    `DIỄN HÓA · nhịp ${log.tickBatDau} – ${log.tickKetThuc} · ${soNam} nhịp · ` +
    `${log.soLuotChay} lượt · ${log.soCall} call · ${Math.round(log.tokenDaDung / 1000)}k token`;

  const muc = log.suKienLon.map((s) => ({ tick: s.tick, moTa: s.moTa, xemDuoc: true }));
  const boiDap = log.viecBoiDap.map((v) => ({ tick: v.tick, moTa: v.moTa }));
  const chiSo = [
    `Thực tại: ${Math.round(truoc.reality)} → ${Math.round(sau.reality)}`,
    `Sống động: ${Math.round(truoc.songDong)} → ${Math.round(sau.songDong)}`,
  ];

  const dong: string[] = [tieuDe, '', `Dừng vì: ${log.lyDoDung}`, ''];
  if (muc.length > 0) {
    dong.push(`Trong khoảng ấy, ${muc.length} điều đáng ghi:`);
    dong.push('');
    for (const m of muc) dong.push(`  ${m.tick}  ${m.moTa}`);
    dong.push('');
  }
  if (boiDap.length > 0) {
    dong.push(`Và thế giới dày thêm ${boiDap.length} chỗ:`);
    dong.push('');
    for (const b of boiDap) dong.push(`  ${b.tick}  ${b.moTa}`);
    dong.push('');
  }
  dong.push(chiSo.join('        '));
  return { tieuDe, lyDoDung: log.lyDoDung, muc, boiDap, chiSo, dong };
}
