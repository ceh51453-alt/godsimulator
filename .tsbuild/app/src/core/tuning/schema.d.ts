/**
 * Tuning — Phần 7.1 + 61.4 [BB].
 *
 * [BB] Không một con số cân bằng nào được xuất hiện trực tiếp trong code engine.
 * Mọi chỗ đọc đều qua `tuning.<nhóm>.<khóa>`.
 *
 * [BB] Phần 61.4: TuningSchema v3 là phép GỘP CÓ SCHEMA, không phải Object.assign tùy tiện.
 */
import { z } from 'zod';
export declare const TuningV2Schema: z.ZodPrefault<z.ZodObject<{
    khaiNiem: z.ZodPrefault<z.ZodObject<{
        nguongKetTinhMacDinh: z.ZodPrefault<z.ZodNumber>;
        nguongYChi: z.ZodPrefault<z.ZodNumber>;
        nguongLapLai: z.ZodPrefault<z.ZodNumber>;
        tickLuongLuToiDa: z.ZodPrefault<z.ZodNumber>;
        heSoLanToaCangThang: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    luat: z.ZodPrefault<z.ZodObject<{
        nguongApLucKetTinh: z.ZodPrefault<z.ZodNumber>;
        coCumToiThieu: z.ZodPrefault<z.ZodNumber>;
        tagChungToiThieu: z.ZodPrefault<z.ZodNumber>;
        doLechDienGiaiMoiTheHe: z.ZodPrefault<z.ZodNumber>;
        lanThuHinhThucHoa: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    npc: z.ZodPrefault<z.ZodObject<{
        nhietDoSoftmax: z.ZodPrefault<z.ZodNumber>;
        nguongThangT2: z.ZodPrefault<z.ZodNumber>;
        nguongThangT3: z.ZodPrefault<z.ZodNumber>;
        soT2ToiDa: z.ZodPrefault<z.ZodNumber>;
        suyGiamCamXucMacDinh: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    loHong: z.ZodPrefault<z.ZodObject<{
        callToiDaMoiTick: z.ZodPrefault<z.ZodNumber>;
        gomToiDaMotCall: z.ZodPrefault<z.ZodNumber>;
        nguongUuTien: z.ZodPrefault<z.ZodNumber>;
        lanThuToiDa: z.ZodPrefault<z.ZodNumber>;
        nguongThucThe: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    thucTai: z.ZodPrefault<z.ZodObject<{
        hoiToSuaLuat: z.ZodPrefault<z.ZodNumber>;
        hopNhanh: z.ZodPrefault<z.ZodNumber>;
        nhanLuatNghichLy: z.ZodPrefault<z.ZodNumber>;
        moiMauThuanPhatHien: z.ZodPrefault<z.ZodNumber>;
        phucHoiMoiKyNguyen: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    than: z.ZodPrefault<z.ZodObject<{
        quyKetMatDoDen: z.ZodPrefault<z.ZodNumber>;
        quyKetDomainStrength: z.ZodPrefault<z.ZodNumber>;
        quyKetDoKhopTinhCach: z.ZodPrefault<z.ZodNumber>;
        quyKetCuongDoTuyen: z.ZodPrefault<z.ZodNumber>;
        nguongDiHoa: z.ZodPrefault<z.ZodNumber>;
        tocDoDiHoa: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strict>>;
export declare const TuningPhase10Schema: z.ZodPrefault<z.ZodObject<{
    vatLy: z.ZodPrefault<z.ZodObject<{
        heSoVaiTro: z.ZodPrefault<z.ZodObject<{
            chu_the: z.ZodPrefault<z.ZodNumber>;
            doi_tuong: z.ZodPrefault<z.ZodNumber>;
            tac_dong: z.ZodPrefault<z.ZodNumber>;
            trang_thai: z.ZodPrefault<z.ZodNumber>;
            pham_tru: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        thanBi: z.ZodPrefault<z.ZodObject<{
            suyGiamMoiLanNghienCuu: z.ZodPrefault<z.ZodNumber>;
            tuoiDatTran: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        nguyenDiem: z.ZodPrefault<z.ZodObject<{
            nhanKhiThuanBanChat: z.ZodPrefault<z.ZodNumber>;
            keoBanTinhMoiKyNguyen: z.ZodPrefault<z.ZodNumber>;
            nguongSupVeMotTruc: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        coHuuKetGioi: z.ZodPrefault<z.ZodObject<{
            giaThucTaiMoiTick: z.ZodPrefault<z.ZodNumber>;
            banKinhMacDinh: z.ZodPrefault<z.ZodNumber>;
            tickToiDa: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        vuKhiKhaiNiem: z.ZodPrefault<z.ZodObject<{
            heSoPhatThucTai: z.ZodPrefault<z.ZodNumber>;
            heSoPhanNghiaTangVot: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    lore: z.ZodPrefault<z.ZodObject<{
        tranTokenEntry: z.ZodPrefault<z.ZodNumber>;
        soChuDeToiDa: z.ZodPrefault<z.ZodNumber>;
        nguongTinCayNap: z.ZodPrefault<z.ZodNumber>;
        tyLeQuaChung: z.ZodPrefault<z.ZodNumber>;
        kyNguyenGiuThungRac: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    workflow: z.ZodPrefault<z.ZodObject<{
        soLuongSongSongMacDinh: z.ZodPrefault<z.ZodNumber>;
        soLanThuLaiMacDinh: z.ZodPrefault<z.ZodNumber>;
        nguongParseLoiLienTiep: z.ZodPrefault<z.ZodNumber>;
        nguongLechHoBanSao: z.ZodPrefault<z.ZodNumber>;
        nguongLoiPresetChinh: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strict>>;
export declare const TuningV3ExtensionSchema: z.ZodPrefault<z.ZodObject<{
    truyen: z.ZodPrefault<z.ZodObject<{
        machToiDa: z.ZodPrefault<z.ZodNumber>;
        vangMatToiThieu: z.ZodPrefault<z.ZodNumber>;
        tickNguToiThieu: z.ZodPrefault<z.ZodNumber>;
        tickMoiKyNguyen: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    intent: z.ZodPrefault<z.ZodObject<{
        maxPlanSteps: z.ZodPrefault<z.ZodNumber>;
        maxAlternatives: z.ZodPrefault<z.ZodNumber>;
        partialSuccessFloor: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    worldProcess: z.ZodPrefault<z.ZodObject<{
        maxEventsPerTick: z.ZodPrefault<z.ZodNumber>;
        maxCatchUpSteps: z.ZodPrefault<z.ZodNumber>;
        nearbyResolutionRadius: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    preset: z.ZodPrefault<z.ZodObject<{
        maxJsonBytes: z.ZodPrefault<z.ZodNumber>;
        maxPromptBlocks: z.ZodPrefault<z.ZodNumber>;
        maxBlockChars: z.ZodPrefault<z.ZodNumber>;
        maxMacroDepth: z.ZodPrefault<z.ZodNumber>;
        maxRegexMs: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strict>>;
/**
 * Bổ sung Khối U — trọng số heuristic rerank theo task (Phần 77.4).
 * "Task khác nhau dùng profile trọng số khác nhau từ tuning."
 */
export declare const TuningRerankSchema: z.ZodPrefault<z.ZodObject<{
    halfLifeTheoNhip: z.ZodPrefault<z.ZodObject<{
        nhat: z.ZodPrefault<z.ZodNumber>;
        nien: z.ZodPrefault<z.ZodNumber>;
        the_dai: z.ZodPrefault<z.ZodNumber>;
        vinh_kiep: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    storylineBoost: z.ZodPrefault<z.ZodNumber>;
    graphBoostToiDa: z.ZodPrefault<z.ZodNumber>;
    hoSoTask: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        initialRank: z.ZodPrefault<z.ZodNumber>;
        semanticRank: z.ZodPrefault<z.ZodNumber>;
        graph: z.ZodPrefault<z.ZodNumber>;
        trust: z.ZodPrefault<z.ZodNumber>;
        recency: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strict>>>;
    nguongTrungNguon: z.ZodPrefault<z.ZodNumber>;
    tranTyLeMotNguon: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strip>>;
/** [BB] Gộp CÓ SCHEMA, không Object.assign. */
export declare const TuningSchema: z.ZodPrefault<z.ZodObject<{
    rerank: z.ZodPrefault<z.ZodObject<{
        halfLifeTheoNhip: z.ZodPrefault<z.ZodObject<{
            nhat: z.ZodPrefault<z.ZodNumber>;
            nien: z.ZodPrefault<z.ZodNumber>;
            the_dai: z.ZodPrefault<z.ZodNumber>;
            vinh_kiep: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        storylineBoost: z.ZodPrefault<z.ZodNumber>;
        graphBoostToiDa: z.ZodPrefault<z.ZodNumber>;
        hoSoTask: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            initialRank: z.ZodPrefault<z.ZodNumber>;
            semanticRank: z.ZodPrefault<z.ZodNumber>;
            graph: z.ZodPrefault<z.ZodNumber>;
            trust: z.ZodPrefault<z.ZodNumber>;
            recency: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strict>>>;
        nguongTrungNguon: z.ZodPrefault<z.ZodNumber>;
        tranTyLeMotNguon: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    vatLy: z.ZodPrefault<z.ZodObject<{
        heSoVaiTro: z.ZodPrefault<z.ZodObject<{
            chu_the: z.ZodPrefault<z.ZodNumber>;
            doi_tuong: z.ZodPrefault<z.ZodNumber>;
            tac_dong: z.ZodPrefault<z.ZodNumber>;
            trang_thai: z.ZodPrefault<z.ZodNumber>;
            pham_tru: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        thanBi: z.ZodPrefault<z.ZodObject<{
            suyGiamMoiLanNghienCuu: z.ZodPrefault<z.ZodNumber>;
            tuoiDatTran: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        nguyenDiem: z.ZodPrefault<z.ZodObject<{
            nhanKhiThuanBanChat: z.ZodPrefault<z.ZodNumber>;
            keoBanTinhMoiKyNguyen: z.ZodPrefault<z.ZodNumber>;
            nguongSupVeMotTruc: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        coHuuKetGioi: z.ZodPrefault<z.ZodObject<{
            giaThucTaiMoiTick: z.ZodPrefault<z.ZodNumber>;
            banKinhMacDinh: z.ZodPrefault<z.ZodNumber>;
            tickToiDa: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        vuKhiKhaiNiem: z.ZodPrefault<z.ZodObject<{
            heSoPhatThucTai: z.ZodPrefault<z.ZodNumber>;
            heSoPhanNghiaTangVot: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    lore: z.ZodPrefault<z.ZodObject<{
        tranTokenEntry: z.ZodPrefault<z.ZodNumber>;
        soChuDeToiDa: z.ZodPrefault<z.ZodNumber>;
        nguongTinCayNap: z.ZodPrefault<z.ZodNumber>;
        tyLeQuaChung: z.ZodPrefault<z.ZodNumber>;
        kyNguyenGiuThungRac: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    workflow: z.ZodPrefault<z.ZodObject<{
        soLuongSongSongMacDinh: z.ZodPrefault<z.ZodNumber>;
        soLanThuLaiMacDinh: z.ZodPrefault<z.ZodNumber>;
        nguongParseLoiLienTiep: z.ZodPrefault<z.ZodNumber>;
        nguongLechHoBanSao: z.ZodPrefault<z.ZodNumber>;
        nguongLoiPresetChinh: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    truyen: z.ZodPrefault<z.ZodObject<{
        machToiDa: z.ZodPrefault<z.ZodNumber>;
        vangMatToiThieu: z.ZodPrefault<z.ZodNumber>;
        tickNguToiThieu: z.ZodPrefault<z.ZodNumber>;
        tickMoiKyNguyen: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    intent: z.ZodPrefault<z.ZodObject<{
        maxPlanSteps: z.ZodPrefault<z.ZodNumber>;
        maxAlternatives: z.ZodPrefault<z.ZodNumber>;
        partialSuccessFloor: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    worldProcess: z.ZodPrefault<z.ZodObject<{
        maxEventsPerTick: z.ZodPrefault<z.ZodNumber>;
        maxCatchUpSteps: z.ZodPrefault<z.ZodNumber>;
        nearbyResolutionRadius: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    preset: z.ZodPrefault<z.ZodObject<{
        maxJsonBytes: z.ZodPrefault<z.ZodNumber>;
        maxPromptBlocks: z.ZodPrefault<z.ZodNumber>;
        maxBlockChars: z.ZodPrefault<z.ZodNumber>;
        maxMacroDepth: z.ZodPrefault<z.ZodNumber>;
        maxRegexMs: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    khaiNiem: z.ZodPrefault<z.ZodObject<{
        nguongKetTinhMacDinh: z.ZodPrefault<z.ZodNumber>;
        nguongYChi: z.ZodPrefault<z.ZodNumber>;
        nguongLapLai: z.ZodPrefault<z.ZodNumber>;
        tickLuongLuToiDa: z.ZodPrefault<z.ZodNumber>;
        heSoLanToaCangThang: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    luat: z.ZodPrefault<z.ZodObject<{
        nguongApLucKetTinh: z.ZodPrefault<z.ZodNumber>;
        coCumToiThieu: z.ZodPrefault<z.ZodNumber>;
        tagChungToiThieu: z.ZodPrefault<z.ZodNumber>;
        doLechDienGiaiMoiTheHe: z.ZodPrefault<z.ZodNumber>;
        lanThuHinhThucHoa: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    npc: z.ZodPrefault<z.ZodObject<{
        nhietDoSoftmax: z.ZodPrefault<z.ZodNumber>;
        nguongThangT2: z.ZodPrefault<z.ZodNumber>;
        nguongThangT3: z.ZodPrefault<z.ZodNumber>;
        soT2ToiDa: z.ZodPrefault<z.ZodNumber>;
        suyGiamCamXucMacDinh: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    loHong: z.ZodPrefault<z.ZodObject<{
        callToiDaMoiTick: z.ZodPrefault<z.ZodNumber>;
        gomToiDaMotCall: z.ZodPrefault<z.ZodNumber>;
        nguongUuTien: z.ZodPrefault<z.ZodNumber>;
        lanThuToiDa: z.ZodPrefault<z.ZodNumber>;
        nguongThucThe: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    thucTai: z.ZodPrefault<z.ZodObject<{
        hoiToSuaLuat: z.ZodPrefault<z.ZodNumber>;
        hopNhanh: z.ZodPrefault<z.ZodNumber>;
        nhanLuatNghichLy: z.ZodPrefault<z.ZodNumber>;
        moiMauThuanPhatHien: z.ZodPrefault<z.ZodNumber>;
        phucHoiMoiKyNguyen: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    than: z.ZodPrefault<z.ZodObject<{
        quyKetMatDoDen: z.ZodPrefault<z.ZodNumber>;
        quyKetDomainStrength: z.ZodPrefault<z.ZodNumber>;
        quyKetDoKhopTinhCach: z.ZodPrefault<z.ZodNumber>;
        quyKetCuongDoTuyen: z.ZodPrefault<z.ZodNumber>;
        nguongDiHoa: z.ZodPrefault<z.ZodNumber>;
        tocDoDiHoa: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>>;
export type Tuning = z.infer<typeof TuningSchema>;
export declare const TUNING_MAC_DINH: Tuning;
/**
 * Ba hồ sơ cân bằng dựng sẵn — Phần 7.2.
 * Người dùng tạo thêm được; đổi giá trị có hiệu lực từ tick sau, KHÔNG hồi tố.
 */
export declare const HO_SO_CAN_BANG: {
    readonly co_dien: {
        readonly id: "co_dien";
        readonly ten: "Cổ Điển";
        readonly moTa: "Cân bằng. Thế giới đổi chậm, luật ổn định.";
        readonly patch: {};
    };
    readonly hon_loan: {
        readonly id: "hon_loan";
        readonly ten: "Hỗn Loạn";
        readonly moTa: "Ngưỡng kết tinh thấp, phân kỳ nhanh, nhiều nghịch lý.";
        readonly patch: {
            readonly khaiNiem: {
                readonly nguongKetTinhMacDinh: 550;
                readonly tickLuongLuToiDa: 150;
            };
            readonly luat: {
                readonly nguongApLucKetTinh: 140;
                readonly coCumToiThieu: 2;
            };
            readonly than: {
                readonly tocDoDiHoa: 0.14;
                readonly nguongDiHoa: 28;
            };
        };
    };
    readonly chiem_nghiem: {
        readonly id: "chiem_nghiem";
        readonly ten: "Chiêm Nghiệm";
        readonly moTa: "Tự hoàn thiện mạnh, nhiều lỗ hổng được lấp, thế giới dày đặc chi tiết.";
        readonly patch: {
            readonly loHong: {
                readonly callToiDaMoiTick: 2;
                readonly nguongUuTien: 20;
                readonly gomToiDaMotCall: 12;
            };
            readonly luat: {
                readonly doLechDienGiaiMoiTheHe: 5;
            };
        };
    };
};
export type HoSoCanBangId = keyof typeof HO_SO_CAN_BANG;
/** Áp hồ sơ lên tuning mặc định. Trả bản đã parse; không sửa tại chỗ. */
export declare function tuningTheoHoSo(id: HoSoCanBangId): Tuning;
/** Mọi đường dẫn tuning hợp lệ — cổng "không còn đường dẫn tuning ngoài schema". */
export declare function moiDuongDanTuning(): readonly string[];
