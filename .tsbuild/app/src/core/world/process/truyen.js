import { quetMachTruyen, nhipMachTruyen } from '../../truyen/machTruyen.js';
import { raSoatPhucBut, gieoPhucBut } from '../../truyen/phucBut.js';
import { nenCuoiKyNguyen, laMocKyNguyen, kyNguyenCua } from '../../truyen/kyUc.js';
/** Bốn tick là một năm — ADR-0019. */
const CHU_KY_QUET_TIEN_DE = 4;
export function chayMachTruyen(nc) {
    const kq = { patches: [], suKien: [] };
    const s = nc.state;
    const nguoiChoiId = s.world.playerState.chuTheId;
    const nct = {
        tick: nc.tick,
        eventId: nc.eventId,
        tuning: nc.tuning,
        rng: nc.rng,
        nguoiChoiId,
    };
    // ── 1. nhịp của mạch đang chạy ──
    const nhip = nhipMachTruyen(s, nct);
    kq.patches.push(...nhip.patches);
    for (const n of nhip.daChay) {
        const m = s.storylines.get(n.machId);
        if (!m)
            continue;
        /**
         * Nhịp truyện thành ứng viên sự kiện. `banTinCho()` (72.2) lọc lại theo điều
         * chủ thể biết được, nên một nhịp ở vùng xa KHÔNG tự chen vào bản tin của
         * người chơi — nó chỉ tới nếu có đường tin thật.
         */
        kq.suKien.push({
            loai: `mach_${m.loai}`,
            mucDo: n.giaiDoan === 'cao_trao' ? 'trong_dai' : n.beat.cangThangDelta >= 10 ? 'lon' : 'thuong',
            moTa: n.beat.moTa,
            tienTrinhId: 'storyline_beat',
            chuTheIds: [...n.beat.nhanVatLienQuan],
            locationId: null,
            payload: {
                machId: m.id,
                giaiDoan: n.giaiDoan,
                soNhip: m.soNhip + 1,
                coNguoiChoi: n.nguoiChoiCoMat,
            },
        });
        // Phục bút do nhịp gieo — 30.2 nói Updater cũng gieo được, nhưng engine gieo
        // trước và gieo chắc chắn: một lời tiên tri không được phép phụ thuộc việc
        // model có nhớ trả về đúng khối hay không.
        if (n.beat.phucButMoi) {
            const g = gieoPhucBut(s, {
                noiDung: n.beat.phucButMoi.noiDung,
                loai: n.beat.phucButMoi.loai,
                machId: m.id,
                hanTraToiDa: n.beat.phucButMoi.hanTraToiDa,
                doNang: n.beat.phucButMoi.doNang,
            }, { tick: nc.tick, eventId: nc.eventId });
            kq.patches.push(...g.patches);
        }
    }
    /**
     * ── 2. sinh mạch mới ──
     *
     * Chỉ quét mỗi NĂM (bốn tick — ADR-0019), không quét mỗi mùa.
     *
     * Lý do là chi phí và nó đo được: mười bốn bộ dò tiền đề duyệt gần như toàn bộ
     * aspect của mọi entity, và chạy chúng mỗi tick làm bài test một trăm năm chậm
     * đi năm lần. Lý do thứ hai quan trọng hơn: một mạch truyện THÀNH HÌNH là việc
     * chậm. Dò bốn lần một năm không sinh thêm mạch nào mà lần dò cuối năm không
     * bắt được — hai người ghét nhau ở mùa xuân thì mùa đông vẫn còn ghét nhau.
     */
    const quet = nc.tick % CHU_KY_QUET_TIEN_DE === 0 ? quetMachTruyen(s, nct) : { patches: [], machMoi: [], soBiTran: 0 };
    kq.patches.push(...quet.patches);
    for (const m of quet.machMoi) {
        kq.suKien.push({
            loai: `mach_moi_${m.loai}`,
            mucDo: 'thuong',
            moTa: `${m.ten}: ${m.kyUcMach}`,
            tienTrinhId: 'storyline_beat',
            chuTheIds: m.nhanVat.map((n) => n.entityId),
            locationId: null,
            payload: { machId: m.id, loai: m.loai },
        });
    }
    /**
     * ── 3. mốc kỷ nguyên: nén ký ức mạch (30.3) ──
     *
     * Đây là chỗ DUY NHẤT phép nén được kích hoạt. Trước Phase 8 thì mốc kỷ nguyên
     * không tồn tại trong engine — `world.eraId` được đặt một lần lúc khai thiên
     * rồi đứng yên mãi mãi. Giờ nó nhích, và cái nhích ấy có một việc thật để làm.
     */
    if (laMocKyNguyen(nc.tick, nc.tuning.truyen.tickMoiKyNguyen)) {
        kq.patches.push(...nenCuoiKyNguyen(s, { eventId: nc.eventId }));
        const ky = kyNguyenCua(nc.tick, nc.tuning.truyen.tickMoiKyNguyen);
        kq.patches.push({
            op: 'set',
            target: { table: 'worlds', id: 'worlds', path: 'eraId' },
            value: `era_${ky}`,
            sourceEventId: nc.eventId,
        });
        kq.suKien.push({
            loai: 'sang_ky_nguyen',
            mucDo: 'trong_dai',
            moTa: `Một kỷ nguyên khép lại. Chuyện của nó co lại thành vài dòng, và những gì chưa trả thì vẫn chưa trả.`,
            tienTrinhId: 'storyline_beat',
            chuTheIds: [],
            locationId: null,
            payload: { kyNguyen: ky, soMach: s.storylines.size },
        });
    }
    // ── 4. rà soát Sổ Phục Bút ──
    const ra = raSoatPhucBut(s, { tick: nc.tick, eventId: nc.eventId });
    kq.patches.push(...ra.patches);
    for (const f of ra.chuaTraQuaHan.slice(0, 3)) {
        kq.suKien.push({
            loai: 'phuc_but_qua_han',
            mucDo: 'thuong',
            moTa: `Chưa trả: ${f.noiDung}`,
            tienTrinhId: 'storyline_beat',
            chuTheIds: [],
            locationId: null,
            payload: { phucButId: f.id, machId: f.machId, doNang: f.doNang },
        });
    }
    return kq;
}
