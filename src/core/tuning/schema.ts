/**
 * Tuning — Phần 7.1 + 61.4 [BB].
 *
 * [BB] Không một con số cân bằng nào được xuất hiện trực tiếp trong code engine.
 * Mọi chỗ đọc đều qua `tuning.<nhóm>.<khóa>`.
 *
 * [BB] Phần 61.4: TuningSchema v3 là phép GỘP CÓ SCHEMA, không phải Object.assign tùy tiện.
 */
import { z } from 'zod';

/** Nhóm gốc — Phần 7.1. */
const TuningV2Object = z
  .object({
    khaiNiem: z
      .object({
        nguongKetTinhMacDinh: z.number().prefault(1000),
        nguongYChi: z.number().prefault(0.6),
        nguongLapLai: z.number().prefault(0.4),
        /** Quá hạn → phân đôi thành cả thần lẫn luật. */
        tickLuongLuToiDa: z.number().prefault(300),
        heSoLanToaCangThang: z.number().prefault(0.25),

        /*
         * ── Vòng kết tinh (`vatly/vongKetTinh.ts`) ──
         *
         * Ba nguồn áp lực dưới đây là chỗ khái niệm lấy trọng số từ thế giới
         * THẬT, thay vì chờ ai đó khai một con số. Chúng nhỏ có chủ đích: một
         * khái niệm phải mất hàng trăm nhịp mới leo hết thang, vì "thế giới tự
         * phát hiện ra vật lý của chính nó" là một quá trình, không phải một cú
         * bấm nút.
         */
        /** Mỗi vật đang mang khái niệm cộng ngần này mỗi nhịp vào `nguon.lapLai`. */
        apLucMoiVatMang: z.number().prefault(0.35),
        /** Mỗi điều luật tiếp địa vào khái niệm cộng ngần này vào `nguon.yChi`. */
        apLucMoiLuatTiepDia: z.number().prefault(0.5),
        /** Mỗi vị thần kết tinh từ khái niệm cộng ngần này vào `nguon.yChi`. */
        apLucMoiThanNeo: z.number().prefault(0.8),
        /** Trọng số trần, tính theo bội của ngưỡng — chặn vòng phản hồi chạy loạn. */
        boiTranTrongSo: z.number().prefault(2),
        /** Bao nhiêu khái niệm được kết tinh trong một nhịp. Một, để mỗi lần là một biến cố. */
        soKetTinhMoiNhip: z.number().int().min(0).prefault(1),
        /** Nhịp giữa hai lần quét vòng kết tinh. Bốn tick là một năm. */
        nhipQuetKetTinh: z.number().int().min(1).prefault(4),
      })
      .prefault({}),

    luat: z
      .object({
        nguongApLucKetTinh: z.number().prefault(240),
        coCumToiThieu: z.number().prefault(3),
        tagChungToiThieu: z.number().prefault(2),
        /** [BB] Tầng 2 bắt buộc sai; diễn giải đúng 100% ngay là BUG. */
        doLechDienGiaiMoiTheHe: z.number().prefault(7),
        lanThuHinhThucHoa: z.number().prefault(3),

        /*
         * ── Áp luật (`vatly/apLuat.ts`) ──
         */
        /** Trần thực thể một điều luật chạm được trong một nhịp. Chặn luật `vu_tru` quét cả thế giới. */
        soThucTheMoiLuat: z.number().int().min(1).prefault(40),
        /** Nhịp giữa hai lần áp luật. Bốn tick là một năm. */
        nhipApLuat: z.number().int().min(1).prefault(4),
        /** Hiệu lực tối thiểu để phép `set`/`flag` chạy — thay đổi tuyệt đối không co được. */
        nguongApTuyetDoi: z.number().min(0).max(100).prefault(60),
        /** Độ lệch diễn giải trung bình đủ để một điều luật đẻ ra khái niệm phái sinh. */
        nguongDeKhaiNiemPhaiSinh: z.number().min(0).max(100).prefault(45),
      })
      .prefault({}),

    npc: z
      .object({
        nhietDoSoftmax: z.number().prefault(0.35),
        nguongThangT2: z.number().prefault(62),
        nguongThangT3: z.number().prefault(85),
        soT2ToiDa: z.number().prefault(30),
        suyGiamCamXucMacDinh: z.number().prefault(0.94),
      })
      .prefault({}),

    loHong: z
      .object({
        callToiDaMoiTick: z.number().prefault(1),
        gomToiDaMotCall: z.number().prefault(8),
        nguongUuTien: z.number().prefault(35),
        lanThuToiDa: z.number().prefault(3),
        /** Quy tắc ba lần. */
        nguongThucThe: z.number().prefault(3),
      })
      .prefault({}),

    thucTai: z
      .object({
        hoiToSuaLuat: z.number().prefault(-15),
        hopNhanh: z.number().prefault(-35),
        nhanLuatNghichLy: z.number().prefault(-8),
        moiMauThuanPhatHien: z.number().prefault(-2),
        phucHoiMoiKyNguyen: z.number().prefault(0.5),
      })
      .prefault({}),

    than: z
      .object({
        quyKetMatDoDen: z.number().prefault(0.3),
        quyKetDomainStrength: z.number().prefault(0.25),
        quyKetDoKhopTinhCach: z.number().prefault(0.25),
        quyKetCuongDoTuyen: z.number().prefault(0.2),
        nguongDiHoa: z.number().prefault(40),
        tocDoDiHoa: z.number().prefault(0.08),
      })
      .prefault({}),
  })
  .strict();

export const TuningV2Schema = TuningV2Object.prefault({});

/** Bổ sung v3 — Phần 61.4. */
const TuningV3ExtensionObject = z
  .object({
    truyen: z
      .object({
        machToiDa: z.number().int().min(1).prefault(24),
        vangMatToiThieu: z.number().min(0).max(1).prefault(0.4),
        tickNguToiThieu: z.number().int().min(1).prefault(12),
        /**
         * Độ dài một kỷ nguyên, tính bằng tick.
         *
         * Đây là mốc duy nhất mà phép nén của 30.3 được kích hoạt, nên nó là một
         * con số cân bằng thật: quá ngắn thì `kyUcMach` bị nén trước khi mạch kịp
         * có gì để nén; quá dài thì bộ đệm nhịp tràn và văn cũ rơi mất trước khi
         * bộ nén nhìn thấy. 200 tick là 50 năm (ADR-0019), khớp với chu kỳ
         * `moi_ky_nguyen` của kẻ thù vĩnh cửu.
         */
        tickMoiKyNguyen: z.number().int().min(4).prefault(200),
      })
      .prefault({}),
    intent: z
      .object({
        maxPlanSteps: z.number().int().min(1).max(20).prefault(8),
        maxAlternatives: z.number().int().min(0).max(8).prefault(3),
        partialSuccessFloor: z.number().min(0).max(1).prefault(0.2),
      })
      .prefault({}),
    worldProcess: z
      .object({
        maxEventsPerTick: z.number().int().min(1).prefault(500),
        maxCatchUpSteps: z.number().int().min(1).prefault(1000),
        nearbyResolutionRadius: z.number().min(0).prefault(2),
      })
      .prefault({}),
    preset: z
      .object({
        maxJsonBytes: z.number().int().prefault(10_000_000),
        maxPromptBlocks: z.number().int().prefault(1000),
        maxBlockChars: z.number().int().prefault(200_000),
        maxMacroDepth: z.number().int().min(0).max(8).prefault(3),
        maxRegexMs: z.number().int().min(1).max(100).prefault(20),
      })
      .prefault({}),
  })
  .strict();

/**
 * Bổ sung Phase 10 — Khối L (Tiếp Địa, Cơ Chế Phái Sinh) và Khối O (Lorebook).
 *
 * [BB] Phần 7 — "không một con số cân bằng nào được xuất hiện trực tiếp trong code
 * engine". Mọi hằng số của 42.4, 44.3 và 53.3 nằm ở đây, không nằm trong hàm.
 */
const TuningPhase10Object = z
  .object({
    vatLy: z
      .object({
        /**
         * Hệ số vai trò trong `tinhHieuLuc` (42.4).
         *
         * Phạm trù nhẹ hơn tác động vì một câu luật vẫn có nghĩa khi phạm trù còn
         * mờ, nhưng mất hẳn nghĩa khi động từ trung tâm chưa tồn tại.
         */
        heSoVaiTro: z
          .object({
            chu_the: z.number().min(0).max(1).prefault(1),
            doi_tuong: z.number().min(0).max(1).prefault(1),
            tac_dong: z.number().min(0).max(1).prefault(1),
            trang_thai: z.number().min(0).max(1).prefault(0.9),
            pham_tru: z.number().min(0).max(1).prefault(0.8),
          })
          .prefault({}),
        thanBi: z
          .object({
            /** `0.97 ^ soLanBiNghienCuu` — 44.3. */
            suyGiamMoiLanNghienCuu: z.number().min(0).max(1).prefault(0.97),
            /** Tuổi bao nhiêu tick thì thần bí gốc đạt trần. */
            tuoiDatTran: z.number().int().min(1).prefault(4_000),
          })
          .prefault({}),
        nguyenDiem: z
          .object({
            nhanKhiThuanBanChat: z.number().min(1).prefault(2.2),
            keoBanTinhMoiKyNguyen: z.number().min(0).max(1).prefault(0.05),
            /** Bản tính sụp về một trục quá mức này thì engine đề xuất đổi kind. */
            nguongSupVeMotTruc: z.number().min(0).max(100).prefault(92),
          })
          .prefault({}),
        coHuuKetGioi: z
          .object({
            giaThucTaiMoiTick: z.number().min(0).prefault(3),
            banKinhMacDinh: z.number().min(0).prefault(2),
            tickToiDa: z.number().int().min(1).prefault(6),
          })
          .prefault({}),
        vuKhiKhaiNiem: z
          .object({
            /** realityIntegrity trừ = trọng số khái niệm × hệ số này. */
            heSoPhatThucTai: z.number().min(0).prefault(0.01),
            /** Phản nghĩa mất đối trọng thì tăng vọt theo tỷ lệ này. */
            heSoPhanNghiaTangVot: z.number().min(1).prefault(1.6),
          })
          .prefault({}),
      })
      .prefault({}),
    lore: z
      .object({
        /** [MR] 53.3. */
        tranTokenEntry: z.number().int().min(50).prefault(400),
        soChuDeToiDa: z.number().int().min(1).prefault(2),
        /** 53.4 — dưới ngưỡng thì lưu nhưng KHÔNG nạp. */
        nguongTinCayNap: z.number().min(0).max(100).prefault(20),
        /** 53.2 — từ xuất hiện ở hơn tỷ lệ này số cảnh là quá chung. */
        tyLeQuaChung: z.number().min(0).max(1).prefault(0.3),
        /** 52.3 — thùng rác giữ mấy kỷ nguyên. */
        kyNguyenGiuThungRac: z.number().int().min(1).prefault(3),
      })
      .prefault({}),
    workflow: z
      .object({
        soLuongSongSongMacDinh: z.number().int().min(1).max(16).prefault(4),
        soLanThuLaiMacDinh: z.number().int().min(0).max(6).prefault(3),
        /** 50.12 mục 33 — parse lỗi liên tiếp quá số này thì nguồn thời gian sai. */
        nguongParseLoiLienTiep: z.number().int().min(1).prefault(5),
        /** 50.12 mục 34 — số call lệch quá tỷ lệ này so với số mục liệt kê. */
        nguongLechHoBanSao: z.number().min(0).max(1).prefault(0.2),
        /** 50.12 mục 32 — preset chính lỗi quá tỷ lệ này thì chuỗi dự phòng có vấn đề. */
        nguongLoiPresetChinh: z.number().min(0).max(1).prefault(0.3),
      })
      .prefault({}),
  })
  .strict();

export const TuningPhase10Schema = TuningPhase10Object.prefault({});

export const TuningV3ExtensionSchema = TuningV3ExtensionObject.prefault({});

/**
 * Bổ sung Khối U — trọng số heuristic rerank theo task (Phần 77.4).
 * "Task khác nhau dùng profile trọng số khác nhau từ tuning."
 */
export const TuningRerankSchema = z
  .object({
    halfLifeTheoNhip: z
      .object({
        nhat: z.number().min(1).prefault(30),
        nien: z.number().min(1).prefault(200),
        the_dai: z.number().min(1).prefault(2_000),
        vinh_kiep: z.number().min(1).prefault(20_000),
      })
      .prefault({}),
    /** Nhân vào heuristic khi chunk thuộc storyline đang mở. */
    storylineBoost: z.number().min(0).prefault(1.35),
    graphBoostToiDa: z.number().min(1).prefault(1.6),
    /** Trọng số theo task; thiếu task nào thì rơi về `macDinh`. */
    hoSoTask: z
      .record(
        z.string(),
        z
          .object({
            initialRank: z.number().min(0).prefault(1),
            semanticRank: z.number().min(0).prefault(1.5),
            graph: z.number().min(0).prefault(0.4),
            trust: z.number().min(0).prefault(0.3),
            recency: z.number().min(0).prefault(0.2),
          })
          .strict(),
      )
      .prefault({
        macDinh: { initialRank: 1, semanticRank: 1.5, graph: 0.4, trust: 0.3, recency: 0.2 },
        answer_prayer: { initialRank: 1, semanticRank: 1.4, graph: 0.9, trust: 0.5, recency: 0.5 },
        world_report: { initialRank: 1.2, semanticRank: 1.2, graph: 0.3, trust: 0.6, recency: 0.7 },
        narrate_scene: { initialRank: 1, semanticRank: 1.6, graph: 0.5, trust: 0.3, recency: 0.35 },
      }),
    /** Top-10 có hơn ngần này chunk cùng nguonId thì Chẩn Đoán báo hỏng (77.11). */
    nguongTrungNguon: z.number().int().min(1).prefault(6),
    /** Một lorebook không được chiếm quá tỷ lệ này của top-K (77.7 quy tắc 3). */
    tranTyLeMotNguon: z.number().min(0).max(1).prefault(0.5),
  })
  .prefault({});

/** [BB] Gộp CÓ SCHEMA, không Object.assign. */
export const TuningSchema = z
  .object({
    ...TuningV2Object.shape,
    ...TuningV3ExtensionObject.shape,
    ...TuningPhase10Object.shape,
    rerank: TuningRerankSchema,
  })
  .prefault({});

export type Tuning = z.infer<typeof TuningSchema>;

export const TUNING_MAC_DINH: Tuning = TuningSchema.parse({});

/**
 * Ba hồ sơ cân bằng dựng sẵn — Phần 7.2.
 * Người dùng tạo thêm được; đổi giá trị có hiệu lực từ tick sau, KHÔNG hồi tố.
 */
export const HO_SO_CAN_BANG = {
  co_dien: {
    id: 'co_dien',
    ten: 'Cổ Điển',
    moTa: 'Cân bằng. Thế giới đổi chậm, luật ổn định.',
    patch: {},
  },
  hon_loan: {
    id: 'hon_loan',
    ten: 'Hỗn Loạn',
    moTa: 'Ngưỡng kết tinh thấp, phân kỳ nhanh, nhiều nghịch lý.',
    patch: {
      khaiNiem: { nguongKetTinhMacDinh: 550, tickLuongLuToiDa: 150 },
      luat: { nguongApLucKetTinh: 140, coCumToiThieu: 2 },
      than: { tocDoDiHoa: 0.14, nguongDiHoa: 28 },
    },
  },
  chiem_nghiem: {
    id: 'chiem_nghiem',
    ten: 'Chiêm Nghiệm',
    moTa: 'Tự hoàn thiện mạnh, nhiều lỗ hổng được lấp, thế giới dày đặc chi tiết.',
    patch: {
      loHong: { callToiDaMoiTick: 2, nguongUuTien: 20, gomToiDaMotCall: 12 },
      luat: { doLechDienGiaiMoiTheHe: 5 },
    },
  },
} as const;

export type HoSoCanBangId = keyof typeof HO_SO_CAN_BANG;

/** Áp hồ sơ lên tuning mặc định. Trả bản đã parse; không sửa tại chỗ. */
export function tuningTheoHoSo(id: HoSoCanBangId): Tuning {
  const hs = HO_SO_CAN_BANG[id];
  return TuningSchema.parse(gopSau(TUNING_MAC_DINH as unknown as Ban, hs.patch as unknown as Ban));
}

type Ban = Record<string, unknown>;

/** Gộp sâu, chỉ trường có mặt mới bị thay — cùng ngữ nghĩa với ghi đè registry (5.2). */
function gopSau(goc: Ban, patch: Ban): Ban {
  const out: Ban = { ...goc };
  for (const k of Object.keys(patch)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    const a = out[k];
    const b = patch[k];
    out[k] =
      a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)
        ? gopSau(a as Ban, b as Ban)
        : b;
  }
  return out;
}

/** Mọi đường dẫn tuning hợp lệ — cổng "không còn đường dẫn tuning ngoài schema". */
export function moiDuongDanTuning(): readonly string[] {
  const out: string[] = [];
  const di = (o: unknown, tien: string): void => {
    if (o === null || typeof o !== 'object' || Array.isArray(o)) {
      out.push(tien);
      return;
    }
    for (const k of Object.keys(o as Ban)) {
      di((o as Ban)[k], tien ? `${tien}.${k}` : k);
    }
  };
  di(TUNING_MAC_DINH, '');
  return out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
