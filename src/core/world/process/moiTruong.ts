/**
 * `environment_cycle` và `ecology` — hai tiến trình đứng dưới cùng của Phần 71.2.
 *
 * Mọi thứ khác trong thế giới này rút vật chất từ đây. Nếu hai hàm dưới sai,
 * cả nền kinh tế phía trên thành số ma.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { KetQuaTienTrinh, NgocCanhTienTrinh, UngVienSuKien } from './types.js';
import { cong, dat, docAspect, kep, lam, moiNoiChon } from './tienIch.js';
import { HE_SO_MUA, namCuaTick } from '../../schema/aspect/substrate.js';
import type { SinhThai } from '../../schema/aspect/substrate.js';

const LOAI_TAI_NGUYEN = ['rung', 'thu', 'ca', 'dat'] as const;
type LoaiTaiNguyen = (typeof LOAI_TAI_NGUYEN)[number];

/**
 * Gộp một tỷ lệ theo `n` bước.
 *
 * [BB] Phần 71.6 — "gộp bước ổn định bằng công thức macro", không lặp vòng.
 * Với đại lượng phân rã/tiệm cận, `1 - (1-r)^n` là **đúng chính xác**; với
 * logistic nó là cận trên có kẹp trần, nên tua nhanh không bao giờ vượt sức chứa.
 */
export function gopTyLe(r: number, n: number): number {
  const rr = kep(r, 0, 1);
  if (n <= 1) return rr;
  return 1 - Math.pow(1 - rr, n);
}

// ─────────────────────────────────────────── environment_cycle

/**
 * Mùa, năm và thiên tai.
 *
 * Đây là đồng hồ: `world.year` được suy từ tick chứ không đếm riêng, nên không
 * có cách nào để lịch và tick lệch nhau (bất biến `nam_khop_tick`).
 */
export function chayMoiTruong(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];

  const namMoi = namCuaTick(nc.tick);
  if (namMoi !== nc.state.world.year) {
    patches.push({
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'year' },
      value: namMoi,
      sourceEventId: nc.eventId,
    });
  }

  // Đông làm đất bạc màu, xuân hạ trả lại. Thiên tai đánh vào đúng chỗ đó.
  const theoMua = nc.mua === 'dong' ? 0.02 : -0.015;

  for (const { id, e } of moiNoiChon(nc.state)) {
    const st = docAspect<SinhThai>(e, 'sinh_thai');
    if (!st) continue;

    let dSuyThoai = theoMua * nc.soBuocGop;

    // Thiên tai: hiếm, nhưng khi tới thì để lại vết dài.
    const rng = nc.rng.nhanh(`thien_tai:${id}`);
    const pMoiBuoc = nc.mua === 'ha' ? 0.012 : 0.006;
    if (rng.co(gopTyLe(pMoiBuoc, nc.soBuocGop))) {
      const loai = rng.chon(['han_han', 'lu_lut', 'bao', 'sau_benh'] as const) ?? 'han_han';
      const nang = rng.khoang(8, 22) / 100;
      dSuyThoai += nang;
      suKien.push({
        loai: `thien_tai_${loai}`,
        mucDo: 'lon',
        moTa: `${e.ten} chịu một trận ${loai.replace('_', ' ')}; đất và rừng mất ${Math.round(nang * 100)}% sức.`,
        tienTrinhId: 'environment_cycle',
        chuTheIds: [id],
        locationId: id,
        payload: { loai, nang: lam(nang) },
      });
    }

    const moi = kep(st.suyThoai + dSuyThoai, 0, 1);
    if (lam(moi) !== lam(st.suyThoai)) {
      patches.push(dat(nc, id, 'aspects.sinh_thai.suyThoai', lam(moi)));
    }
  }

  return { patches, suKien };
}

// ─────────────────────────────────────────── ecology

/**
 * Phục hồi logistic có trần.
 *
 * [BB] Trữ lượng bằng 0 thì KHÔNG mọc lại. Săn cạn một loài là tuyệt chủng, không
 * phải là "chờ hồi". Đây là điều làm cho quyết định khai thác có sức nặng thật.
 */
export function chaySinhThai(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];

  for (const { id, e } of moiNoiChon(nc.state)) {
    const st = docAspect<SinhThai>(e, 'sinh_thai');
    if (!st) continue;

    // Đông không mọc. Đây là lý do vùng ôn đới phải tích trữ.
    const heSoMua = HE_SO_MUA[nc.mua];
    const r = gopTyLe(st.tocDoPhucHoi * (1 - st.suyThoai) * heSoMua, nc.soBuocGop);
    let tongPhucHoi = 0;

    for (const loai of LOAI_TAI_NGUYEN) {
      const x = st.taiNguyen[loai];
      const K = st.sucChua[loai];
      if (K <= 0) continue;
      if (x <= 0) {
        // Đã tuyệt: chỉ báo một lần, khi vừa mất.
        continue;
      }
      const moc = r * x * (1 - x / K);
      const moi = kep(x + moc, 0, K);
      if (lam(moi) !== lam(x)) {
        patches.push(dat(nc, id, `aspects.sinh_thai.taiNguyen.${loai}`, lam(moi)));
        tongPhucHoi += moi - x;
      }
    }

    patches.push(dat(nc, id, 'aspects.sinh_thai.soCai.phucHoi', lam(tongPhucHoi)));

    // Suy thoái nặng kéo dài là chuyện đáng dừng lại xem.
    if (st.suyThoai >= 0.75) {
      suKien.push({
        loai: 'dat_kiet',
        mucDo: 'lon',
        moTa: `Đất ở ${e.ten} đã kiệt; mọi thứ mọc lên đều còi.`,
        tienTrinhId: 'ecology',
        chuTheIds: [id],
        locationId: id,
        payload: { suyThoai: lam(st.suyThoai) },
      });
    }
  }

  return { patches, suKien };
}

/** Dùng chung: rút tài nguyên và trả về lượng rút thật (không bao giờ quá số có). */
export function rutTaiNguyen(
  nc: NgocCanhTienTrinh,
  noiId: string,
  st: SinhThai,
  loai: LoaiTaiNguyen,
  muon: number,
): { patch: PatchOp | null; lay: number } {
  const co = Math.max(0, st.taiNguyen[loai]);
  const lay = lam(Math.min(co, Math.max(0, muon)));
  if (lay <= 0) return { patch: null, lay: 0 };
  return { patch: cong(nc, noiId, `aspects.sinh_thai.taiNguyen.${loai}`, -lay), lay };
}
