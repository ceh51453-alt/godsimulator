/**
 * Ống Kính — Phần 29 [BB].
 *
 * ── Câu quyết định cả file ──
 *
 * 29.1: "Cột tường thuật ở giữa màn hình KHÔNG PHẢI cuộc chat của bạn. Nó là
 * biên niên sử đang được kể, và ống kính có thể chĩa vào bất kỳ mạch truyện nào."
 *
 * Hệ quả kỹ thuật, và nó không nhỏ: chọn chỗ chiếu là một hàm THUẦN của thế giới
 * và của seed, không phải một hàm của việc người chơi vừa gõ gì. Nếu nó phụ
 * thuộc người chơi thì 28.6 không bao giờ đạt, và toàn bộ Phần 29 thành trang trí.
 *
 * [BB] 29.1 — chuyển ống kính KHÔNG tốn lượt, KHÔNG tốn thời gian trong game.
 * Vì vậy hàm ở đây không sinh Event và không đụng `world.tick`.
 *
 * [BB] 29.3 — nhân vật người chơi có `vaiTro` trong `Storyline` GIỐNG MỌI ENTITY
 * KHÁC. Không có trường đặc biệt, không có trọng số ưu ái. Ở đây điều đó được
 * cưỡng chế bằng việc `chonMucTieu()` không hề nhận `nguoiChoiId`.
 */
import type { WorldState } from '../engine/state.js';
import type { Rng } from '../engine/rng.js';
import type { Lens, MucTieuOngKinh, Storyline } from '../schema/truyen.js';
import { LensSchema, machDaDong } from '../schema/truyen.js';

export type TrangThaiOngKinh = {
  readonly lens: Lens;
  /** Tick mà mục tiêu hiện tại được chọn — dùng cho `giuToiThieuTick`. */
  readonly tickDoiCuoi: number;
  /** Mục tiêu đang thật sự chiếu, sau khi `tu_dong` đã được giải. */
  readonly dangChieu: MucTieuOngKinh;
};

export function ongKinhMoi(tick = 0): TrangThaiOngKinh {
  return {
    lens: LensSchema.parse({}),
    tickDoiCuoi: tick,
    dangChieu: { loai: 'tu_dong' },
  };
}

export type ChonOngKinh = {
  readonly mucTieu: MucTieuOngKinh;
  readonly machId: string | null;
  readonly vi: string;
  readonly daDoi: boolean;
};

/**
 * Chế độ `tu_dong`: engine chọn mạch có `cangThang` cao nhất TRONG SỐ MẠCH NGƯỜI
 * CHƠI BIẾT, trộn ngẫu nhiên seeded để không đơn điệu (29.1).
 *
 * `uuTienMachId` đến từ hai nguồn và cả hai đều là cơ chế cứng:
 *   - phục bút quá hạn (30.2) — mạch đang treo nợ tự sự được cộng ưu tiên;
 *   - hạn ngạch vắng mặt trượt (28.6) — kỷ nguyên sau phải ưu tiên mạch xa.
 */
export function chonMucTieu(
  s: WorldState,
  tt: TrangThaiOngKinh,
  nc: {
    tick: number;
    rng: Rng;
    uuTienMachId?: readonly string[];
    /** 28.6 trượt → ưu tiên mạch KHÔNG có mặt entity này. */
    tranhEntityId?: string | null;
  },
): ChonOngKinh {
  // Mục tiêu do người chơi đặt tay được tôn trọng tuyệt đối.
  if (tt.lens.mucTieu.loai !== 'tu_dong') {
    return {
      mucTieu: tt.lens.mucTieu,
      machId: tt.lens.mucTieu.loai === 'mach' ? tt.lens.mucTieu.machId : null,
      vi: 'Người chơi đang giữ ống kính ở một chỗ.',
      daDoi: false,
    };
  }

  // Giữ tối thiểu: đảo ống kính mỗi nhịp làm câu chuyện vụn thành thông báo.
  const daGiu = nc.tick - tt.tickDoiCuoi;
  if (tt.lens.tuDongChuyen && daGiu < tt.lens.giuToiThieuTick && tt.dangChieu.loai !== 'tu_dong') {
    return {
      mucTieu: tt.dangChieu,
      machId: tt.dangChieu.loai === 'mach' ? tt.dangChieu.machId : null,
      vi: `Còn giữ ${tt.lens.giuToiThieuTick - daGiu} nhịp ở chỗ hiện tại.`,
      daDoi: false,
    };
  }

  const uuTien = new Set(nc.uuTienMachId ?? []);

  /**
   * "Trong số mạch NGƯỜI CHƠI BIẾT" (29.1) — và ở tầng Sáng Thế thì họ biết hết.
   *
   * 18.1 gọi tầng ấy là góc nhìn từ trên xuống; bắt nó chờ `nguoiChoiBiet` lật
   * lên sẽ khóa ống kính vào một chỗ duy nhất trong khi cả thế giới đang chạy
   * ngay dưới mắt. Ở hai tầng dưới thì luật 28.2 giữ nguyên: chưa nghe tới thì
   * chưa chiếu tới được.
   */
  const thayHet = s.world.playerState.mode === 'sang_the';
  const ungVien = [...s.storylines.values()]
    .filter((m) => (thayHet || m.nguoiChoiBiet) && !machDaDong(m.giaiDoan) && m.tickKet === null)
    .sort((a, b) => (a.id < b.id ? -1 : 1));

  if (ungVien.length === 0) {
    return {
      mucTieu: { loai: 'nguoi_choi' },
      machId: null,
      vi: 'Chưa có mạch truyện nào người chơi biết tới.',
      daDoi: tt.dangChieu.loai !== 'nguoi_choi',
    };
  }

  const diem = (m: Storyline): number => {
    let d = m.cangThang;
    if (uuTien.has(m.id)) d += 25;
    if (nc.tranhEntityId != null && m.nhanVat.some((n) => n.entityId === nc.tranhEntityId)) d -= 20;
    // Trộn seeded: đủ để không đơn điệu, không đủ để lật thứ hạng thật sự lệch.
    return d + nc.rng.nhanh(`ok:${m.id}`).khoang(0, 8);
  };

  let tot = ungVien[0] as Storyline;
  let diemTot = diem(tot);
  for (const m of ungVien.slice(1)) {
    const d = diem(m);
    if (d > diemTot || (d === diemTot && m.id < tot.id)) {
      tot = m;
      diemTot = d;
    }
  }

  const mucTieu: MucTieuOngKinh = { loai: 'mach', machId: tot.id };
  const daDoi = tt.dangChieu.loai !== 'mach' || tt.dangChieu.machId !== tot.id;
  return {
    mucTieu,
    machId: tot.id,
    vi: uuTien.has(tot.id)
      ? `"${tot.ten}" đang treo một phục bút chưa trả.`
      : `"${tot.ten}" là mạch căng nhất trong số người chơi biết (${Math.round(tot.cangThang)}).`,
    daDoi,
  };
}

/** Áp một lựa chọn vào trạng thái ống kính. Không sinh Event — 29.1. */
export function apOngKinh(tt: TrangThaiOngKinh, chon: ChonOngKinh, tick: number): TrangThaiOngKinh {
  return {
    lens: tt.lens,
    dangChieu: chon.mucTieu,
    tickDoiCuoi: chon.daDoi ? tick : tt.tickDoiCuoi,
  };
}

/** Người chơi đặt tay ống kính. Cũng không tốn lượt. */
export function datOngKinh(tt: TrangThaiOngKinh, mucTieu: MucTieuOngKinh, tick: number): TrangThaiOngKinh {
  return {
    lens: LensSchema.parse({ ...tt.lens, mucTieu }),
    dangChieu: mucTieu,
    tickDoiCuoi: tick,
  };
}

/**
 * Entity đang ở trong tiêu điểm của ống kính — đầu vào cho `moRong()` và cho
 * truy vấn Q1 của 54.6.
 */
export function tieuDiem(s: WorldState, mucTieu: MucTieuOngKinh, chuTheId: string | null): readonly string[] {
  switch (mucTieu.loai) {
    case 'mach': {
      const m = s.storylines.get(mucTieu.machId);
      return m ? m.nhanVat.map((n) => n.entityId) : [];
    }
    case 'nhan_vat':
      return [mucTieu.entityId];
    case 'vung':
      return [mucTieu.vungId];
    case 'nguoi_choi':
      return chuTheId === null ? [] : [chuTheId];
    case 'tu_dong':
      return chuTheId === null ? [] : [chuTheId];
  }
}

/**
 * [BB] 29.2 quy tắc 5 — khi ống kính KHÔNG ở chỗ người chơi thì prompt không
 * được nhắc tới người chơi, kể cả gián tiếp.
 *
 * Hàm này là chỗ duy nhất quyết định điều đó, để `bienSoan` không phải đoán.
 */
export function ongKinhOChoNguoiChoi(
  s: WorldState,
  mucTieu: MucTieuOngKinh,
  chuTheId: string | null,
): boolean {
  /**
   * [BB] 29.2 quy tắc 7 — ở tầng Sáng Thế Thần, người chơi KHÔNG CÓ MẶT trong
   * cảnh. Không thân xác thì không đứng ở đâu được, nên mọi cảnh đều là cảnh
   * vắng mặt họ. Đặt phép kiểm này TRƯỚC nhánh `nguoi_choi` là cố ý: chĩa ống
   * kính "về phía người chơi" khi họ không có thân xác vẫn là nhìn thế giới.
   */
  if (chuTheId === null) return false;
  if (mucTieu.loai === 'nguoi_choi') return true;
  return tieuDiem(s, mucTieu, chuTheId).includes(chuTheId);
}
