import { thieuGiDeChoi } from './cauHinh.js';
export const TRANG_THAI_CONG = ['chua_cau_hinh', 'dang_do', 'san_sang', 'dut_duong'];
export const NHAN_TRANG_THAI_CONG = Object.freeze({
    chua_cau_hinh: 'chưa nối AI',
    dang_do: 'đang thử đường',
    san_sang: 'đã nối',
    dut_duong: 'đứt đường',
});
export const MACH_MOI = Object.freeze({
    hongLienTiep: 0,
    moMach: false,
    maLoiCuoi: '',
    thongDiepCuoi: '',
    tongGoi: 0,
    tongHong: 0,
});
/** Ba lần hỏng liên tiếp là hỏng thật, không phải xui. */
export const NGUONG_MO_MACH = 3;
export function machSauKhiThanhCong(m) {
    return {
        hongLienTiep: 0,
        moMach: false,
        maLoiCuoi: '',
        thongDiepCuoi: '',
        tongGoi: m.tongGoi + 1,
        tongHong: m.tongHong,
    };
}
export function machSauKhiHong(m, maLoi, thongDiep) {
    const n = m.hongLienTiep + 1;
    return {
        hongLienTiep: n,
        moMach: n >= NGUONG_MO_MACH,
        maLoiCuoi: maLoi,
        thongDiepCuoi: thongDiep,
        tongGoi: m.tongGoi + 1,
        tongHong: m.tongHong + 1,
    };
}
export function dongMach(m) {
    return { ...m, hongLienTiep: 0, moMach: false };
}
/** Tỉ lệ hỏng — mục 27 của bảng Tự Chẩn Đoán (46.2). */
export function tyLeHong(m) {
    return m.tongGoi === 0 ? 0 : m.tongHong / m.tongGoi;
}
/**
 * Quyết định cổng. Hàm thuần, không đọc đồng hồ, không chạm mạng.
 *
 * Thứ tự kiểm quan trọng: **thiếu cấu hình** phải được báo trước **đứt đường**,
 * vì người chưa điền gì mà thấy "mất kết nối" sẽ đi kiểm tra wifi.
 */
export function danhGiaCong(v) {
    const thieu = thieuGiDeChoi(v.cfg);
    if (thieu.length > 0) {
        return Object.freeze({
            trangThai: 'chua_cau_hinh',
            choPhepChoi: false,
            lyDo: Object.freeze([
                'Thiên Điện chạy bằng AI. Chưa nối được model thì chưa có ai kể chuyện, nên chưa vào chơi được.',
            ]),
            viecCanLam: Object.freeze([...thieu]),
        });
    }
    if (v.dangDo) {
        return Object.freeze({
            trangThai: 'dang_do',
            choPhepChoi: false,
            lyDo: Object.freeze(['Đang thử đường tới model.']),
            viecCanLam: Object.freeze([]),
        });
    }
    if (v.mach.moMach) {
        const chiTiet = v.mach.thongDiepCuoi.trim() === ''
            ? `Model không trả lời ${v.mach.hongLienTiep} lượt liên tiếp.`
            : `Model không trả lời ${v.mach.hongLienTiep} lượt liên tiếp: ${v.mach.thongDiepCuoi}`;
        return Object.freeze({
            trangThai: 'dut_duong',
            choPhepChoi: false,
            lyDo: Object.freeze([
                chiTiet,
                'Thế giới của bạn vẫn còn nguyên. Nối lại được là chơi tiếp từ đúng chỗ đang dở.',
            ]),
            viecCanLam: Object.freeze([
                { truong: 'probe', thongDiep: 'Bấm "Thử lại đường" hoặc đổi sang model khác.' },
            ]),
        });
    }
    return Object.freeze({
        trangThai: 'san_sang',
        choPhepChoi: true,
        lyDo: Object.freeze([]),
        viecCanLam: Object.freeze([]),
    });
}
