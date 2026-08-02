/**
 * Lập lịch tác vụ — Phần 50.4 [BB].
 *
 * ── Chế độ quan trọng nhất ──
 *
 * `theo_thoi_gian_truyen`. Đặc tả gọi nó là "chế độ quan trọng nhất và là thứ
 * mình đã bỏ sót ở Phần 47", và lý do rất cụ thể:
 *
 * > Bản tin kinh tế thế giới nên chạy **một lần mỗi tuần trong truyện** — không
 * > phải mỗi ba lượt chat. Nếu người chơi dành hai mươi lượt để kể một buổi tối,
 * > kinh tế thế giới không được nhúc nhích. Nếu người chơi tua một thế kỷ trong
 * > một lượt, nó phải chạy rất nhiều lần.
 *
 * Hai vế của câu ấy là hai bài test khác nhau, và cả hai đều ở `workflow.test.ts`.
 */
import { TICK_MOI_NAM } from '../schema/aspect/substrate.js';
/**
 * Số tick của một đơn vị thời gian truyện.
 *
 * Neo vào `TICK_MOI_NAM = 4` (một tick là một mùa). Giờ và ngày nhỏ hơn một tick
 * nên quy về 1: engine không có độ phân giải dưới mùa, và giả vờ có là nói dối.
 */
export const TICK_MOI_DON_VI = Object.freeze({
    gio: 1,
    ngay: 1,
    tuan: 1,
    thang: 1,
    nam: TICK_MOI_NAM,
    the_dai: TICK_MOI_NAM * 100,
});
export function trangThaiLichMoi() {
    return { luotChayCuoi: -1, tickChayCuoi: -1, soLanParseLoiLienTiep: 0 };
}
/**
 * Tác vụ có chạy lượt này không, và chạy mấy lần.
 *
 * `lich = null` nghĩa là **mỗi lượt** — đúng như 50.2 khai. Hàm thuần: cùng đầu
 * vào cho cùng quyết định, không đọc đồng hồ máy.
 */
export function quyetDinhChay(task, tt, nc, nguongParseLoiLienTiep) {
    if (!task.bat) {
        return { chay: false, soLan: 0, lyDo: 'tác vụ đang tắt', trangThaiSau: tt };
    }
    const lich = task.lich;
    if (lich === null || lich.cheDo === 'moi_luot') {
        return {
            chay: true,
            soLan: 1,
            lyDo: 'mỗi lượt',
            trangThaiSau: { ...tt, luotChayCuoi: nc.luot, tickChayCuoi: nc.tick, soLanParseLoiLienTiep: 0 },
        };
    }
    if (lich.cheDo === 'theo_luot') {
        const daQua = nc.luot - tt.luotChayCuoi;
        if (tt.luotChayCuoi >= 0 && daQua < lich.soLuot) {
            return { chay: false, soLan: 0, lyDo: `mới ${daQua}/${lich.soLuot} lượt`, trangThaiSau: tt };
        }
        return {
            chay: true,
            soLan: 1,
            lyDo: `đủ ${lich.soLuot} lượt`,
            trangThaiSau: { ...tt, luotChayCuoi: nc.luot, tickChayCuoi: nc.tick, soLanParseLoiLienTiep: 0 },
        };
    }
    if (lich.cheDo === 'theo_su_kien') {
        const khop = lich.suKien.filter((s) => nc.suKien.includes(s));
        if (khop.length === 0) {
            return { chay: false, soLan: 0, lyDo: 'chưa có sự kiện kích hoạt', trangThaiSau: tt };
        }
        return {
            chay: true,
            soLan: 1,
            lyDo: `sự kiện ${khop.join(', ')}`,
            trangThaiSau: { ...tt, luotChayCuoi: nc.luot, tickChayCuoi: nc.tick, soLanParseLoiLienTiep: 0 },
        };
    }
    // ── theo_thoi_gian_truyen ──
    const tg = lich.thoiGianTruyen;
    const buoc = Math.max(1, Math.round(tg.giaTri * TICK_MOI_DON_VI[tg.donVi]));
    const tickHienTai = tg.nguonThoiGian.loai === 'tick_engine'
        ? nc.tick
        : docTickTuVanBan(nc.vanBan ?? '', tg.nguonThoiGian.tenThe);
    if (tickHienTai === null) {
        const soLoi = tt.soLanParseLoiLienTiep + 1;
        const ttSau = { ...tt, soLanParseLoiLienTiep: soLoi };
        if (tg.khiParseLoi === 'chay_luon') {
            return {
                chay: true,
                soLan: 1,
                lyDo: 'không đọc được thời gian, cấu hình cho chạy luôn',
                trangThaiSau: { ...ttSau, luotChayCuoi: nc.luot, tickChayCuoi: nc.tick },
            };
        }
        if (tg.khiParseLoi === 'dung') {
            return {
                chay: false,
                soLan: 0,
                lyDo: 'không đọc được thời gian — cấu hình cho DỪNG',
                trangThaiSau: ttSau,
            };
        }
        // [BB] mặc định an toàn: bỏ lượt này, KHÔNG chạy bừa.
        return {
            chay: false,
            soLan: 0,
            lyDo: soLoi >= nguongParseLoiLienTiep
                ? `không đọc được thời gian ${soLoi} lần liên tiếp — nguồn thời gian có thể sai (chẩn đoán 33)`
                : 'không đọc được thời gian, bỏ lượt này',
            trangThaiSau: ttSau,
        };
    }
    if (tt.tickChayCuoi < 0) {
        return {
            chay: true,
            soLan: 1,
            lyDo: 'lần đầu',
            trangThaiSau: { luotChayCuoi: nc.luot, tickChayCuoi: tickHienTai, soLanParseLoiLienTiep: 0 },
        };
    }
    const troi = tickHienTai - tt.tickChayCuoi;
    if (troi < buoc) {
        return {
            chay: false,
            soLan: 0,
            // Hai mươi lượt kể một buổi tối: `troi` bằng 0, và tác vụ đứng yên.
            lyDo: `thời gian truyện mới trôi ${troi}/${buoc} nhịp`,
            trangThaiSau: { ...tt, luotChayCuoi: nc.luot, soLanParseLoiLienTiep: 0 },
        };
    }
    // Tua một thế kỷ trong một lượt: chạy nhiều lần, không chạy một lần.
    const soLan = Math.floor(troi / buoc);
    return {
        chay: true,
        soLan,
        lyDo: `thời gian truyện trôi ${troi} nhịp = ${soLan} lần ${tg.giaTri} ${tg.donVi}`,
        trangThaiSau: {
            luotChayCuoi: nc.luot,
            tickChayCuoi: tt.tickChayCuoi + soLan * buoc,
            soLanParseLoiLienTiep: 0,
        },
    };
}
/**
 * Đọc tick từ thẻ trong văn bản — chỉ dùng khi nhập workflow từ hệ khác (50.4).
 *
 * Trả `null` khi không đọc được, và `null` **khác** 0: đó là toàn bộ lý do
 * `khiParseLoi` tồn tại. Một hàm trả 0 khi thất bại sẽ làm tác vụ chạy mỗi lượt
 * mà không ai biết vì sao.
 */
export function docTickTuVanBan(vanBan, tenThe) {
    for (const the of tenThe.length > 0 ? tenThe : ['tp', 'time']) {
        const re = new RegExp(`<\\s*${the}\\s*>\\s*(-?\\d+)\\s*<\\s*/\\s*${the}\\s*>`, 'i');
        const m = re.exec(vanBan);
        if (m !== null) {
            const n = Number(m[1]);
            if (Number.isFinite(n))
                return n;
        }
    }
    return null;
}
/** Chín điều kiện dừng của 47.3 dùng chung cho chế độ `theo_su_kien`. */
export const SU_KIEN_KICH_HOAT = [
    'het_ky_nguyen',
    'mach_dat_cao_trao',
    'ke_thu_troi_day',
    'ky_vong_lorebook_bi_lech',
    'co_che_moi_xuat_hien',
    'luat_nen_duoc_dat_ten',
    'reality_tut_qua_20',
    'than_mat_domain',
    'phuc_but_qua_han',
];
