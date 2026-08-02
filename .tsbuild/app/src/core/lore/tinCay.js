import { uocLuong } from '../ai/nganSach.js';
import { NGUONG_TIN_CAY_NAP, SO_CHU_DE_TOI_DA, TRAN_TOKEN_ENTRY } from './schema.js';
/**
 * 53.4 — "Một entry chỉ thật đến mức các sự kiện chống lưng cho nó là thật."
 *
 * Ba yếu tố, đúng như đặc tả nêu: **số sự kiện**, **độ lớn**, và **có được nhiều
 * nguồn độc lập xác nhận không**. Không có sự kiện nào → 0, và 0 nghĩa là không nạp.
 */
export function tinhDoTinCay(entry, events) {
    const ev = entry.suKienChongLung.map((id) => events.get(id)).filter((e) => e !== undefined);
    if (ev.length === 0)
        return 0;
    // Số sự kiện: bão hòa dần, ba sự kiện đã gần hết phần thưởng của trục này.
    const soLuong = Math.min(1, ev.length / 3);
    // Độ lớn: sự kiện có nhiều actor/target và có patch thật thì nặng hơn.
    const doLon = ev.reduce((t, e) => {
        const rong = Math.min(1, (e.actorIds.length + e.targetIds.length) / 4);
        const coPatch = e.patches.length > 0 ? 1 : 0.4;
        const congKhai = e.visibility === 'cong_khai' ? 1 : 0.7;
        return t + rong * 0.4 + coPatch * 0.4 + congKhai * 0.2;
    }, 0) / ev.length;
    /**
     * Nguồn độc lập: đếm số CHUỖI NHÂN QUẢ riêng biệt.
     *
     * Ba sự kiện nối nhau bằng `causeEventIds` là một câu chuyện được kể ba lần,
     * không phải ba nhân chứng. Đây chính là chỗ kiểu D (ô nhiễm nguồn) len vào
     * nếu đếm bừa.
     */
    const goc = new Set(ev.map((e) => (e.causeEventIds.length === 0 ? e.id : e.causeEventIds[0])));
    const docLap = Math.min(1, goc.size / 2);
    const diem = soLuong * 0.4 + doLon * 0.35 + docLap * 0.25;
    return Math.round(Math.max(0, Math.min(1, diem)) * 100);
}
/** 53.4 — dưới ngưỡng thì entry LƯU nhưng KHÔNG nạp vào ngữ cảnh. */
export function duocNap(entry) {
    if (entry.trangThai !== 'hoat_dong')
        return false;
    return entry.doTinCay >= NGUONG_TIN_CAY_NAP;
}
// ─────────────────────────────────────────── thu hoạch danh từ
/** [MR] 53.2 — danh sách đen mặc định. */
export const DANH_SACH_DEN = new Set([
    'người',
    'thần',
    'nơi',
    'chuyện',
    'thời gian',
    'thế giới',
    'nó',
    'họ',
    'ta',
    'ngươi',
    'và',
    'nhưng',
    'thì',
    'là',
    'của',
    'một',
    'hai',
    'ba',
    'bốn',
    'năm',
    'sáu',
    'bảy',
    'tám',
    'chín',
    'mười',
    'tháng',
    'ngày',
    'đêm',
]);
const TACH_TU = /[^\p{L}\p{N}]+/u;
/**
 * Rút ứng viên keyword từ VĂN BẢN THẬT đã kể — 53.2 [BB].
 *
 * "Keyword hay không phải keyword nghe hợp lý — mà là keyword thật sự xuất hiện
 * trong văn bản sẽ được quét." Nên hàm này không nhận mô tả entity hay tên canon:
 * nó nhận **những cảnh đã kể**, và đó là toàn bộ khác biệt giữa một lorebook bắn
 * đúng lúc và một lorebook không bao giờ bắn.
 */
export function thuHoachDanhTu(input) {
    const den = input.danhSachDen ?? DANH_SACH_DEN;
    const chiem = input.daBiChiem ?? new Set();
    const soCanh = Math.max(1, input.canhDaKe.length);
    const dem = new Map();
    const canhCo = new Map();
    const ghi = (tu, iCanh, daThayTrongCanh) => {
        dem.set(tu, (dem.get(tu) ?? 0) + 1);
        const tap = daThayTrongCanh.get(tu) ?? new Set();
        tap.add(iCanh);
        daThayTrongCanh.set(tu, tap);
    };
    const trongCanh = new Map();
    input.canhDaKe.forEach((canh, i) => {
        const thap = canh.toLowerCase();
        for (const cum of input.cumUuTien ?? []) {
            const c = cum.trim().toLowerCase();
            if (c === '')
                continue;
            let vi = thap.indexOf(c);
            while (vi >= 0) {
                ghi(c, i, trongCanh);
                vi = thap.indexOf(c, vi + c.length);
            }
        }
        for (const t of thap.split(TACH_TU)) {
            const tu = t.trim();
            if (tu.length < 2)
                continue;
            ghi(tu, i, trongCanh);
        }
    });
    for (const [tu, tap] of trongCanh)
        canhCo.set(tu, tap.size);
    const ra = [];
    for (const [tu, n] of dem) {
        const tyLe = (canhCo.get(tu) ?? 0) / soCanh;
        const quaChung = tyLe > 0.3;
        const trongDen = den.has(tu);
        const daChiem = chiem.has(tu);
        ra.push({
            tu,
            soLanXuatHien: n,
            tyLeCanh: tyLe,
            biChiem: daChiem,
            lyDoLoai: trongDen
                ? 'nằm trong danh sách đen'
                : quaChung
                    ? `xuất hiện ở ${Math.round(tyLe * 100)}% số cảnh — quá chung`
                    : daChiem
                        ? 'đã bị entry khác cùng lớp chiếm'
                        : '',
        });
    }
    // Sắp theo tần suất giảm dần, tie-break theo từ để kết quả ổn định.
    ra.sort((a, b) => a.soLanXuatHien !== b.soLanXuatHien
        ? b.soLanXuatHien - a.soLanXuatHien
        : a.tu < b.tu
            ? -1
            : a.tu > b.tu
                ? 1
                : 0);
    return ra;
}
/** Ứng viên dùng được — đã loại đen, quá chung và từ bị chiếm. */
export function goiYKeys(ungVien, toiDa = 8) {
    return ungVien.filter((u) => u.lyDoLoai === '').slice(0, toiDa);
}
/**
 * 53.3 [BB] — vượt trần thì **tách**, không cắt cụt.
 *
 * Hàm này chỉ phán; việc tách là op `tach` ở 52.1. Cắt cụt một entry làm hỏng
 * nghĩa và làm AI hiểu sai — cùng lý do với template EJS ở 32.4.
 */
export function kiemEntry(entry, tuyChon = {}) {
    const ra = [];
    const tran = tuyChon.tranToken ?? TRAN_TOKEN_ENTRY;
    const token = uocLuong(entry.noiDung, tuyChon.tyLeToken ?? 3.2);
    if (token > tran) {
        ra.push({
            ma: 'VUOT_TRAN_TOKEN',
            thongDiep: `Entry dài ${token} token, vượt trần ${tran}. Phải TÁCH, không được cắt cụt.`,
        });
    }
    if (entry.chuDe.length > (tuyChon.soChuDeToiDa ?? SO_CHU_DE_TOI_DA)) {
        ra.push({
            ma: 'QUA_NHIEU_CHU_DE',
            thongDiep: `Entry nhắc ${entry.chuDe.length} chủ đề chính; tối đa ${tuyChon.soChuDeToiDa ?? SO_CHU_DE_TOI_DA}. Một entry một chủ đề.`,
        });
    }
    if (entry.keys.length === 0 && entry.lop === 'sau') {
        ra.push({ ma: 'THIEU_KEY', thongDiep: 'Entry lớp `sau` không có keyword thì không bao giờ bắn.' });
    }
    return ra;
}
/** Brief sinh entry — 53.5. Không câu hỏi mở nào. */
export function briefSinhEntry(input) {
    const tran = input.tranToken ?? TRAN_TOKEN_ENTRY;
    const dong = [];
    dong.push(`NHIỆM VỤ: sinh entry lorebook cho chủ đề [${input.chuDe.join(', ')}].`);
    dong.push('');
    dong.push('ĐÃ CÓ (đối soát trước khi viết):');
    for (const d of input.daCo)
        dong.push(`  ${d.id} "${d.ten}" — ${d.ghiChu}`);
    if (input.daCo.length === 0)
        dong.push('  (chưa có entry nào về chủ đề này)');
    dong.push('');
    dong.push('KEYWORD ỨNG VIÊN (từ văn bản thật, kèm tần suất):');
    const dung = goiYKeys(input.ungVien);
    dong.push(`  ${dung.map((u) => `${u.tu} ${u.soLanXuatHien}`).join(' · ')}`);
    const cam = input.ungVien.filter((u) => u.lyDoLoai !== '').slice(0, 6);
    if (cam.length > 0)
        dong.push(`  (cấm: ${cam.map((u) => `"${u.tu}" ${u.lyDoLoai}`).join(' · ')})`);
    dong.push('');
    dong.push('SỰ KIỆN CHỐNG LƯNG (bắt buộc trích dẫn ít nhất 2):');
    for (const s of input.suKien)
        dong.push(`  ${s.id}  ${s.moTa}`);
    dong.push('');
    dong.push(`TRẦN: ${tran} token · tối đa ${SO_CHU_DE_TOI_DA} chủ đề chính · lớp '${input.lop}'`);
    dong.push('THẨM MỸ: giọng biên niên, khô, không tính từ cảm thán');
    dong.push('');
    dong.push('TRẢ VỀ: đúng schema LorebookEntry. Không thêm lời nào.');
    return dong.join('\n');
}
