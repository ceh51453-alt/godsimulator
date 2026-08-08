/**
 * Tiến trình thần thoại và chu kỳ vũ trụ — suy hoàn toàn từ WorldState.
 *
 * Lorebook được phép GỢI hướng đi, nhưng bậc sáng thế chỉ lên khi thế giới có
 * bằng chứng thật. Cùng hàm này được prompt, tick và UI đọc nên không có ba
 * chiếc đồng hồ "kết tinh" chạy lệch nhau.
 */
import type { PatchOp } from '../contracts/core.js';
import type { GiaiDoanSangThe } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import { bacKhaiNiem } from '../schema/aspect/conceptual.js';

export type BangChungThanThoai = Readonly<{
  giaiDoan: GiaiDoanSangThe;
  /** 0 tiếng vọng · 1 danh xưng · 2 luật · 3 cõi · 4 sử thi. */
  bacLore: number;
  ids: readonly string[];
  lyDo: readonly string[];
}>;

function conSong(e: { tickDiet: number | null }): boolean {
  return e.tickDiet === null;
}

/** Bằng chứng hiện có, chưa tính trần thời gian của từng lorebook. */
export function bangChungThanThoai(s: WorldState): BangChungThanThoai {
  if (s.world.sangThe.ketCucHienTai !== null) {
    return {
      giaiDoan: 'tan_the',
      bacLore: 4,
      ids: [...s.world.sangThe.bangChungIds],
      lyDo: [`Kết cục ${s.world.sangThe.ketCucHienTai} đã xảy ra.`],
    };
  }

  const dauChuKy = s.world.sangThe.tickBatDauChuKy;
  const song = [...s.entities.values()].filter((e) => conSong(e) && e.tickSinh >= dauChuKy);
  if (song.length === 0) return { giaiDoan: 'hu_vo', bacLore: 0, ids: [], lyDo: ['Chưa có thực thể nào.'] };

  let bac = 0;
  const ids: string[] = [song[0]?.id ?? ''];
  const lyDo: string[] = ['Thế giới đã có dấu hiệu đầu tiên.'];

  const coDanhXung = song.find((e) => {
    const c = e.aspects['conceptual'] as { giaiDoan?: string } | undefined;
    const vh = e.aspects['van_hoa'] as { thanThoai?: unknown[]; tapTuc?: unknown[] } | undefined;
    return (
      e.kind === 'deity' ||
      e.kind === 'pantheon' ||
      bacKhaiNiem(c?.giaiDoan) >= bacKhaiNiem('manh_nha') ||
      (vh?.thanThoai?.length ?? 0) > 0 ||
      (vh?.tapTuc?.length ?? 0) > 0
    );
  });
  if (coDanhXung) {
    bac = 1;
    ids.push(coDanhXung.id);
    lyDo.push(`Danh xưng đã bám vào ${coDanhXung.ten}.`);
  }

  const coLuat = song.find((e) => {
    const l = e.aspects['lawful'] as
      { hieuLuc?: number; trangThai?: string; tiepDia?: unknown[] } | undefined;
    return (
      l !== undefined && ((l.hieuLuc ?? 0) > 0 || l.trangThai === 'hieu_luc') && (l.tiepDia?.length ?? 0) > 0
    );
  });
  const luatNenCoTen = [...s.substrateLaws.values()].find(
    (l) => l.trangThai === 'co_ten' && (l.tickDatTen ?? -1) >= dauChuKy,
  );
  if (bac >= 1 && (coLuat || luatNenCoTen)) {
    bac = 2;
    ids.push(coLuat?.id ?? luatNenCoTen?.id ?? '');
    lyDo.push('Ít nhất một luật đã có hiệu lực và có nền để bám.');
  }

  const coCoi = song.find((e) => e.kind === 'realm');
  const noiThieng = song.find((e) => {
    const sp = e.aspects['spatial'] as { thieng?: { mucDo?: number } } | undefined;
    return e.kind === 'place' && (sp?.thieng?.mucDo ?? 0) >= 50;
  });
  const coThanDien =
    song.some((e) => e.kind === 'pantheon') || song.filter((e) => e.kind === 'deity').length >= 2;
  if (bac >= 2 && (coCoi || (noiThieng && coThanDien))) {
    bac = 3;
    ids.push(coCoi?.id ?? noiThieng?.id ?? '');
    lyDo.push('Địa lý thiêng đã có nơi đứng và có trật tự thần linh giữ nó.');
  }

  const machSuThi = [...s.storylines.values()].find(
    (m) =>
      m.tickSinh >= dauChuKy && m.giaiDoan !== 'du_am' && m.giaiDoan !== 'chet_yeu' && m.nhanVat.length >= 2,
  );
  if (bac >= 3 && machSuThi) {
    bac = 4;
    ids.push(machSuThi.id);
    lyDo.push(`Mạch “${machSuThi.ten}” đã biến trật tự ấy thành lịch sử.`);
  }

  const giaiDoan =
    (['dau_hieu', 'danh_xung', 'luat_thanh', 'coi_gioi', 'su_thi'] as const)[bac] ?? 'dau_hieu';
  return { giaiDoan, bacLore: bac, ids: [...new Set(ids.filter(Boolean))].slice(0, 24), lyDo };
}

/** Trạng thái tiến trình và kết cục được ghi lại để save/UI đọc, không chỉ suy thoáng qua. */
export function patchTienTrinhVuTru(s: WorldState, eventId: string, tick: number): PatchOp[] {
  const bc = bangChungThanThoai(s);
  const patches: PatchOp[] = [];
  if (s.world.sangThe.giaiDoan !== bc.giaiDoan) {
    patches.push({
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.giaiDoan' },
      value: bc.giaiDoan,
      sourceEventId: eventId,
    });
  }
  if (JSON.stringify(s.world.sangThe.bangChungIds) !== JSON.stringify(bc.ids)) {
    patches.push({
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.bangChungIds' },
      value: [...bc.ids],
      sourceEventId: eventId,
    });
  }

  if (s.world.sangThe.ketCucHienTai !== null) return patches;
  const ketCuc = phatHienKetCuc(s);
  if (ketCuc === null) return patches;
  patches.push(
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.ketCucHienTai' },
      value: ketCuc,
      sourceEventId: eventId,
    },
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.tickKetCuc' },
      value: tick,
      sourceEventId: eventId,
    },
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.giaiDoan' },
      value: 'tan_the',
      sourceEventId: eventId,
    },
  );
  return patches;
}

export function phatHienKetCuc(s: WorldState): string | null {
  if (s.metrics.realityIntegrity <= 0) return 'nghich_ly_toan_phan';
  if (s.metrics.doPhuThuocTB >= 95 && s.world.tick >= 120) return 'the_gioi_dung_yen';

  const than = [...s.entities.values()].filter((e) => e.kind === 'deity' && e.tickDiet === null);
  const daTungCoThan = [...s.entities.values()].some((e) => e.kind === 'deity');
  if (
    daTungCoThan &&
    s.world.tick >= 120 &&
    than.every(
      (e) =>
        ((e.aspects['venerable'] as { soTinDoUocLuong?: number } | undefined)?.soTinDoUocLuong ?? 0) <= 0,
    )
  ) {
    return 'than_rut_lui';
  }

  const keThu = [...s.entities.values()].filter((e) => e.kind === 'nemesis' && e.tickDiet === null);
  if (keThu.length > 0 && s.metrics.realityIntegrity <= 15) return 'ke_thu_thang';
  if (s.world.tick >= 2_000 && s.metrics.tuSinhSuKien >= 98 && s.metrics.agencyTrungBinh >= 75) {
    return 'tu_van_hanh';
  }
  return null;
}

/** Mở chu kỳ kế tiếp trên cùng lịch sử; tàn tích cũ là di sản, không bị xóa gian. */
export function patchesTaiTaoChuKy(s: WorldState, eventId: string): PatchOp[] {
  const ket = s.world.sangThe.ketCucHienTai;
  if (ket === null) return [];
  const dong = `Chu kỳ ${s.world.sangThe.chuKy} khép ở nhịp ${s.world.sangThe.tickKetCuc ?? s.world.tick}: ${ket}.`;
  return [
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.chuKy' },
      value: s.world.sangThe.chuKy + 1,
      sourceEventId: eventId,
    },
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.tickBatDauChuKy' },
      value: s.world.tick,
      sourceEventId: eventId,
    },
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.ketCucHienTai' },
      value: null,
      sourceEventId: eventId,
    },
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.tickKetCuc' },
      value: null,
      sourceEventId: eventId,
    },
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.giaiDoan' },
      value: 'tai_tao',
      sourceEventId: eventId,
    },
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.bangChungIds' },
      value: [],
      sourceEventId: eventId,
    },
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'sangThe.diSanChuKy' },
      value: [...s.world.sangThe.diSanChuKy, dong].slice(-12),
      sourceEventId: eventId,
    },
    {
      op: 'set',
      target: { table: 'worlds', id: 'worlds', path: 'eraId' },
      value: `era_chu_ky_${s.world.sangThe.chuKy + 1}`,
      sourceEventId: eventId,
    },
  ];
}
