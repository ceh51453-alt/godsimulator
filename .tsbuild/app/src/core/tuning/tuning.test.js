/**
 * Cổng Phase 0 — tuning.
 * Phần 7.1, 61.1 #4, 61.4: "Không còn đường dẫn tuning ngoài schema."
 */
import { describe, it, expect } from 'vitest';
import { TuningSchema, TUNING_MAC_DINH, moiDuongDanTuning, tuningTheoHoSo, HO_SO_CAN_BANG, } from './schema.js';
/** Mọi đường dẫn tuning mà đặc tả v3.1 nhắc tới. Thiếu một cái là cổng 61.1 #4 chưa đóng. */
const DUONG_DAN_SPEC = [
    'khaiNiem.nguongKetTinhMacDinh',
    'khaiNiem.nguongYChi',
    'khaiNiem.nguongLapLai',
    'khaiNiem.tickLuongLuToiDa',
    'khaiNiem.heSoLanToaCangThang',
    'luat.nguongApLucKetTinh',
    'luat.coCumToiThieu',
    'luat.tagChungToiThieu',
    'luat.doLechDienGiaiMoiTheHe',
    'luat.lanThuHinhThucHoa',
    'npc.nhietDoSoftmax',
    'npc.nguongThangT2',
    'npc.nguongThangT3',
    'npc.soT2ToiDa',
    'npc.suyGiamCamXucMacDinh',
    'loHong.callToiDaMoiTick',
    'loHong.gomToiDaMotCall',
    'loHong.nguongUuTien',
    'loHong.lanThuToiDa',
    'loHong.nguongThucThe',
    'thucTai.hoiToSuaLuat',
    'thucTai.hopNhanh',
    'thucTai.nhanLuatNghichLy',
    'thucTai.moiMauThuanPhatHien',
    'thucTai.phucHoiMoiKyNguyen',
    'than.quyKetMatDoDen',
    'than.quyKetDomainStrength',
    'than.quyKetDoKhopTinhCach',
    'than.quyKetCuongDoTuyen',
    'than.nguongDiHoa',
    'than.tocDoDiHoa',
    // ── bổ sung v3 (61.4)
    'truyen.machToiDa',
    'truyen.vangMatToiThieu',
    'truyen.tickNguToiThieu',
    'intent.maxPlanSteps',
    'intent.maxAlternatives',
    'intent.partialSuccessFloor',
    'worldProcess.maxEventsPerTick',
    'worldProcess.maxCatchUpSteps',
    'worldProcess.nearbyResolutionRadius',
    'preset.maxJsonBytes',
    'preset.maxPromptBlocks',
    'preset.maxBlockChars',
    'preset.maxMacroDepth',
    'preset.maxRegexMs',
    // ── bổ sung Khối U (77.4)
    'rerank.storylineBoost',
    'rerank.graphBoostToiDa',
    'rerank.nguongTrungNguon',
    'rerank.tranTyLeMotNguon',
    'rerank.halfLifeTheoNhip.nhat',
    'rerank.halfLifeTheoNhip.nien',
    'rerank.halfLifeTheoNhip.the_dai',
    'rerank.halfLifeTheoNhip.vinh_kiep',
];
describe('tuning phủ hết đường dẫn đặc tả dùng', () => {
    const co = new Set(moiDuongDanTuning());
    it.each(DUONG_DAN_SPEC)('có đường dẫn %s', (dd) => {
        expect(co.has(dd), `tuning.${dd} chưa khai trong schema`).toBe(true);
    });
    it('gộp v2 + v3 + Phase 10 + rerank có schema, không Object.assign', () => {
        const nhom = Object.keys(TUNING_MAC_DINH).sort();
        expect(nhom).toEqual([
            'intent',
            'khaiNiem',
            'loHong',
            // Phase 10 — Khối O (53.3) và Khối L (42.4, 44.3), Khối N (50.12).
            'lore',
            'luat',
            'npc',
            'preset',
            'rerank',
            'than',
            'thucTai',
            'truyen',
            'vatLy',
            'workflow',
            'worldProcess',
        ]);
    });
    it('giá trị mặc định khớp đặc tả', () => {
        expect(TUNING_MAC_DINH.khaiNiem.nguongKetTinhMacDinh).toBe(1000);
        expect(TUNING_MAC_DINH.luat.doLechDienGiaiMoiTheHe).toBe(7);
        expect(TUNING_MAC_DINH.thucTai.hoiToSuaLuat).toBe(-15);
        expect(TUNING_MAC_DINH.than.nguongDiHoa).toBe(40);
        expect(TUNING_MAC_DINH.preset.maxRegexMs).toBe(20);
        expect(TUNING_MAC_DINH.truyen.machToiDa).toBe(24);
    });
    it('parse {} cho đúng bộ mặc định — mọi nhóm có prefault', () => {
        expect(TuningSchema.parse({})).toEqual(TUNING_MAC_DINH);
        expect(TuningSchema.parse(undefined)).toEqual(TUNING_MAC_DINH);
    });
});
describe('ba hồ sơ cân bằng — Phần 7.2', () => {
    it('cả ba hồ sơ parse ra tuning hợp lệ', () => {
        for (const id of Object.keys(HO_SO_CAN_BANG)) {
            expect(TuningSchema.safeParse(tuningTheoHoSo(id)).success, id).toBe(true);
        }
    });
    it('co_dien giữ nguyên mặc định', () => {
        expect(tuningTheoHoSo('co_dien')).toEqual(TUNING_MAC_DINH);
    });
    it('hon_loan hạ ngưỡng kết tinh và tăng tốc Dị Hóa', () => {
        const t = tuningTheoHoSo('hon_loan');
        expect(t.khaiNiem.nguongKetTinhMacDinh).toBe(550);
        expect(t.than.tocDoDiHoa).toBeGreaterThan(TUNING_MAC_DINH.than.tocDoDiHoa);
        // Gộp SÂU: trường không nêu trong patch phải giữ nguyên.
        expect(t.khaiNiem.nguongYChi).toBe(TUNING_MAC_DINH.khaiNiem.nguongYChi);
        expect(t.npc).toEqual(TUNING_MAC_DINH.npc);
    });
    it('chiem_nghiem tăng công suất giải lỗ hổng', () => {
        const t = tuningTheoHoSo('chiem_nghiem');
        expect(t.loHong.callToiDaMoiTick).toBe(2);
        expect(t.loHong.nguongUuTien).toBe(20);
        expect(t.luat.doLechDienGiaiMoiTheHe).toBe(5);
    });
    it('gộp hồ sơ không làm ô nhiễm prototype', () => {
        const doc = JSON.parse('{"khaiNiem":{"__proto__":{"bi":1}}}');
        const t = TuningSchema.parse({});
        expect(TuningSchema.safeParse({ ...t, ...doc }).success).toBe(true);
        expect({}['bi']).toBeUndefined();
    });
});
describe('hồ sơ rerank theo task — Phần 77.4', () => {
    it('có profile mặc định và profile riêng cho answer_prayer/world_report', () => {
        const hs = TUNING_MAC_DINH.rerank.hoSoTask;
        expect(hs['macDinh']).toBeDefined();
        expect(hs['answer_prayer']?.graph).toBeGreaterThan(hs['macDinh']?.graph ?? 0);
        expect(hs['world_report']?.recency).toBeGreaterThan(hs['macDinh']?.recency ?? 0);
    });
});
