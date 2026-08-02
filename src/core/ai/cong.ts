/**
 * Cổng AI — máy trạng thái thuần quyết định trò chơi có mở hay không.
 *
 * ADR-0028 [BB]: **không có AI thì không chơi.** Đây là chỗ điều đó được cưỡng
 * chế, và nó là hàm thuần để test được mà không cần mạng, không cần trình duyệt,
 * không cần đồng hồ.
 *
 * ── Vì sao là máy trạng thái chứ không phải một biến boolean ──
 *
 * "Có AI" không phải một trạng thái, nó là bốn:
 *
 *   chua_cau_hinh   người chơi chưa điền gì — cần một cái form, không phải báo lỗi
 *   dang_do         đang thử đường — cần chờ, không được vừa chờ vừa cho gõ
 *   san_sang        đường thông, model đã trả lời thật — cửa mở
 *   dut_duong       từng thông rồi đứt — cần nút thử lại, và phải giữ lại thế giới
 *
 * Gộp bốn thứ này thành `if (!ai) return` cho ra đúng cái màn hình trắng mà không
 * ai biết phải làm gì tiếp.
 */
import type { AiConfig, ThieuSot } from './cauHinh.js';
import { thieuGiDeChoi } from './cauHinh.js';

export const TRANG_THAI_CONG = ['chua_cau_hinh', 'dang_do', 'san_sang', 'dut_duong'] as const;
export type TrangThaiCong = (typeof TRANG_THAI_CONG)[number];

export const NHAN_TRANG_THAI_CONG: Readonly<Record<TrangThaiCong, string>> = Object.freeze({
  chua_cau_hinh: 'chưa nối AI',
  dang_do: 'đang kiểm tra',
  san_sang: 'đã nối',
  dut_duong: 'mất kết nối',
});

/**
 * Ngắt mạch — Phần 46, cổng Phase 8.
 *
 * Đếm **lần**, không đếm giây: `core/` không được đọc đồng hồ máy (luật bất biến
 * #7). Mạch mở rồi thì chỉ người chơi bấm "thử lại" mới đóng — không tự đóng theo
 * thời gian. Điều đó cố ý: một proxy hết hạn mức không tự lành sau ba mươi giây,
 * và tự thử lại ngầm chỉ đốt thêm tiền của người chơi.
 */
export type TrangThaiMach = {
  readonly hongLienTiep: number;
  readonly moMach: boolean;
  readonly maLoiCuoi: string;
  readonly thongDiepCuoi: string;
  /** Tổng số lượt gọi và số lượt hỏng — nuôi bảng Tự Chẩn Đoán (Phần 39). */
  readonly tongGoi: number;
  readonly tongHong: number;
};

export const MACH_MOI: TrangThaiMach = Object.freeze({
  hongLienTiep: 0,
  moMach: false,
  maLoiCuoi: '',
  thongDiepCuoi: '',
  tongGoi: 0,
  tongHong: 0,
});

/** Ba lần hỏng liên tiếp là hỏng thật, không phải xui. */
export const NGUONG_MO_MACH = 3;

export function machSauKhiThanhCong(m: TrangThaiMach): TrangThaiMach {
  return {
    hongLienTiep: 0,
    moMach: false,
    maLoiCuoi: '',
    thongDiepCuoi: '',
    tongGoi: m.tongGoi + 1,
    tongHong: m.tongHong,
  };
}

export function machSauKhiHong(m: TrangThaiMach, maLoi: string, thongDiep: string): TrangThaiMach {
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

export function dongMach(m: TrangThaiMach): TrangThaiMach {
  return { ...m, hongLienTiep: 0, moMach: false };
}

/** Tỉ lệ hỏng — mục 27 của bảng Tự Chẩn Đoán (46.2). */
export function tyLeHong(m: TrangThaiMach): number {
  return m.tongGoi === 0 ? 0 : m.tongHong / m.tongGoi;
}

// ─────────────────────────────────────────── hồ sơ cổng

export type HoSoCong = {
  readonly trangThai: TrangThaiCong;
  /**
   * [BB] Cửa duy nhất. Mọi hành động chơi — nhập câu, tick, trả lời cầu, đáp Dị
   * Hóa — phải hỏi trường này trước.
   */
  readonly choPhepChoi: boolean;
  /** Vì sao đóng. Rỗng khi mở. Câu tiếng Việt, dùng thẳng được trong UI. */
  readonly lyDo: readonly string[];
  /** Việc người chơi làm được ngay bây giờ để mở cổng. */
  readonly viecCanLam: readonly ThieuSot[];
};

export type DauVaoCong = {
  readonly cfg: AiConfig;
  /** Đang có một lượt thử đường chạy dở. */
  readonly dangDo: boolean;
  readonly mach: TrangThaiMach;
};

/**
 * Quyết định cổng. Hàm thuần, không đọc đồng hồ, không chạm mạng.
 *
 * Thứ tự kiểm quan trọng: **thiếu cấu hình** phải được báo trước **đứt đường**,
 * vì người chưa điền gì mà thấy "mất kết nối" sẽ đi kiểm tra wifi.
 */
export function danhGiaCong(v: DauVaoCong): HoSoCong {
  const thieu = thieuGiDeChoi(v.cfg);

  if (thieu.length > 0) {
    return Object.freeze({
      trangThai: 'chua_cau_hinh' as const,
      choPhepChoi: false,
      lyDo: Object.freeze([
        'Thiên Diễn chạy bằng AI. Chưa nối được model thì chưa có ai kể chuyện, nên chưa vào chơi được.',
      ]),
      viecCanLam: Object.freeze([...thieu]),
    });
  }

  if (v.dangDo) {
    return Object.freeze({
      trangThai: 'dang_do' as const,
      choPhepChoi: false,
      lyDo: Object.freeze(['Đang kiểm tra kết nối tới model.']),
      viecCanLam: Object.freeze([]),
    });
  }

  if (v.mach.moMach) {
    const chiTiet =
      v.mach.thongDiepCuoi.trim() === ''
        ? `Model không trả lời ${v.mach.hongLienTiep} lượt liên tiếp.`
        : `Model không trả lời ${v.mach.hongLienTiep} lượt liên tiếp: ${v.mach.thongDiepCuoi}`;
    return Object.freeze({
      trangThai: 'dut_duong' as const,
      choPhepChoi: false,
      lyDo: Object.freeze([
        chiTiet,
        'Thế giới của bạn vẫn còn nguyên. Nối lại được là chơi tiếp từ đúng chỗ đang dở.',
      ]),
      viecCanLam: Object.freeze([
        { truong: 'probe' as const, thongDiep: 'Bấm "Thử kết nối lại" hoặc đổi sang model khác.' },
      ]),
    });
  }

  return Object.freeze({
    trangThai: 'san_sang' as const,
    choPhepChoi: true,
    lyDo: Object.freeze([]),
    viecCanLam: Object.freeze([]),
  });
}
