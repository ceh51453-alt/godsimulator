/**
 * Diễn Hóa tự động — Phần 47 [BB].
 *
 * > Người chơi bấm một nút, thế giới tự chạy nhiều lượt, rồi báo cáo lại.
 *
 * ── Chỗ quyết định tính năng này hữu ích hay vô dụng ──
 *
 * [BB] 47.3: "Diễn Hóa không nên dừng khi hết số lượt. Nó nên dừng khi **có
 * chuyện đáng xem**." Và:
 *
 * > Bạn không xem một trăm năm, bạn xem đúng ba khoảnh khắc đáng xem trong một
 * > trăm năm đó.
 *
 * Vì vậy `kiemDieuKienDung()` là hàm dài nhất file này, và mỗi điều kiện trả về
 * một `moTa` đủ để báo cáo **mở thẳng vào chỗ đó**.
 *
 * ── Lằn ranh cứng ──
 *
 * [BB] 47.4 — Diễn Hóa KHÔNG BAO GIỜ được, bất kể cấu hình: sửa Luật Nền · dùng
 * Vũ Khí Khái Niệm · kích hoạt kết cục · hợp nhánh hoặc tạo nhánh · sửa `tuning`,
 * `R.*` hay cấu hình · xóa cứng entity · trả lời lời cầu thay người chơi.
 *
 * `locPatchTheoLanRanh()` cưỡng chế danh sách ấy trên TỪNG patch, và nó chạy
 * trước khi patch chạm transaction.
 */
import { z } from 'zod';
import type { PatchOp } from '../contracts/core.js';
import type { WorldState } from '../engine/state.js';
import type { StructuredError } from '../contracts/errors.js';
import { loi } from '../contracts/errors.js';
import type { Storyline } from '../schema/truyen.js';

// ─────────────────────────────────────────── cấu hình

export const NHIP_DIEN_HOA = ['nien', 'the_dai', 'vinh_kiep'] as const;
export type NhipDienHoa = (typeof NHIP_DIEN_HOA)[number];

export const DIEU_KIEN_DUNG_DIEN_HOA = [
  'het_luot',
  'can_ngan_sach',
  'reality_tut_qua_20',
  'mach_dat_cao_trao',
  'nhan_vat_nguoi_choi_lam_nguy',
  'ke_thu_troi_day',
  'ky_vong_lorebook_bi_lech',
  'co_che_moi_xuat_hien',
  'luat_nen_duoc_dat_ten',
  'than_mat_domain',
  'phuc_but_qua_han',
] as const;
export type DieuKienDungDienHoa = (typeof DIEU_KIEN_DUNG_DIEN_HOA)[number];

export const CauHinhDienHoaSchema = z
  .object({
    soLuot: z.number().min(1).max(500).prefault(20),
    nhipMoiLuot: z.enum(NHIP_DIEN_HOA).prefault('nien'),
    chayNen: z.boolean().prefault(true),
    nganSach: z
      .object({
        callToiDa: z.number().prefault(60),
        tokenToiDa: z.number().prefault(4_000_000),
        dungKhiCan: z.boolean().prefault(true),
      })
      .prefault({}),
    phamViChoPhep: z
      .object({
        dongTu: z.array(z.string()).prefault(['HIEN', 'DINH', 'HOP', 'PHAN']),
        duocGiaiLoHong: z.boolean().prefault(true),
        duocKetTinhLuat: z.boolean().prefault(true),
        duocSinhMachTruyen: z.boolean().prefault(true),
        duocSinhThanMoi: z.boolean().prefault(true),
        duocGietNhanVatT2: z.boolean().prefault(true),
        /** [BB] 47.4 — công tắc riêng, mặc định TẮT. Bật là chọn chế độ khắc nghiệt. */
        duocGietNhanVatNguoiChoi: z.boolean().prefault(false),
      })
      .prefault({}),
    dieuKienDung: z.array(z.enum(DIEU_KIEN_DUNG_DIEN_HOA)).prefault([...DIEU_KIEN_DUNG_DIEN_HOA]),
    bacBaoCao: z.enum(['tom_tat', 'bien_nien', 'day_du']).prefault('bien_nien'),
  })
  .prefault({});

export type CauHinhDienHoa = z.infer<typeof CauHinhDienHoaSchema>;

export const EvolutionLogSchema = z
  .object({
    id: z.string(),
    branchId: z.string(),
    tickBatDau: z.number(),
    tickKetThuc: z.number(),
    soLuotChay: z.number(),
    soCall: z.number(),
    tokenDaDung: z.number(),
    lyDoDung: z.string(),
    suKienLon: z
      .array(
        z
          .object({
            tick: z.number(),
            moTa: z.string(),
            loai: z.string(),
            entityIds: z.array(z.string()).prefault([]),
            daXemChiTiet: z.boolean().prefault(false),
          })
          .strict(),
      )
      .prefault([]),
    /** [BB] 47.5 — ảnh chụp TRƯỚC khi chạy. Không có nút lùi thì tính năng này đáng sợ hơn đáng dùng. */
    anhChup: z.string(),
  })
  .strict();

export type EvolutionLog = z.infer<typeof EvolutionLogSchema>;

// ─────────────────────────────────────────── lằn ranh 47.4

/** Bảng mà Diễn Hóa KHÔNG BAO GIỜ được ghi — 47.4. */
export const BANG_CAM_DIEN_HOA: readonly string[] = Object.freeze(['substrateLaws', 'branches', 'lorebooks']);

/** Đường dẫn cấm ngay cả trên bảng được phép. */
export const DUONG_DAN_CAM_DIEN_HOA: readonly string[] = Object.freeze([
  'aspects.conceptual.nguongKetTinh',
  'playerState',
  'seed',
  'tuningProfileId',
]);

export type KetQuaLocPatch = {
  readonly giu: readonly PatchOp[];
  readonly bo: readonly { readonly patch: PatchOp; readonly lyDo: string }[];
  readonly loi: readonly StructuredError[];
};

/**
 * Lọc patch theo lằn ranh cứng — 47.4.
 *
 * Bỏ TỪNG patch vi phạm chứ không hủy cả lô: cùng chính sách với 31.7, và vì
 * Diễn Hóa chạy hàng trăm lượt nên hủy cả lô vì một patch xấu là mất cả một thế kỷ.
 */
export function locPatchTheoLanRanh(
  patches: readonly PatchOp[],
  cauHinh: CauHinhDienHoa,
  state: WorldState,
): KetQuaLocPatch {
  const giu: PatchOp[] = [];
  const bo: { patch: PatchOp; lyDo: string }[] = [];
  const l: StructuredError[] = [];

  const chuTheNguoiChoi = state.world.playerState.chuTheId;

  for (const p of patches) {
    const t = p.target.table;

    if (BANG_CAM_DIEN_HOA.includes(t)) {
      bo.push({ patch: p, lyDo: `Diễn Hóa không được ghi bảng "${t}" (47.4).` });
      l.push(
        loi('patch', 'DIEN_HOA_BANG_CAM', `Bảng "${t}" nằm ngoài quyền của Diễn Hóa.`, { path: p.target.id }),
      );
      continue;
    }
    if (DUONG_DAN_CAM_DIEN_HOA.some((d) => p.target.path.startsWith(d))) {
      bo.push({ patch: p, lyDo: `Đường dẫn "${p.target.path}" là cấu hình, không phải trạng thái.` });
      continue;
    }
    // [BB] 47.4 — chỉ được `tickDiet`, KHÔNG được xóa record.
    if (p.op === 'unlink' && t === 'entities') {
      bo.push({ patch: p, lyDo: 'Diễn Hóa chỉ được đặt tickDiet, không được xóa cứng entity.' });
      continue;
    }
    // Giết nhân vật người chơi phải là công tắc riêng, mặc định tắt.
    if (
      chuTheNguoiChoi !== null &&
      p.target.id === chuTheNguoiChoi &&
      p.target.path === 'tickDiet' &&
      !cauHinh.phamViChoPhep.duocGietNhanVatNguoiChoi
    ) {
      bo.push({ patch: p, lyDo: 'Công tắc "được giết nhân vật người chơi" đang tắt.' });
      continue;
    }
    // Trả lời lời cầu thay người chơi.
    if (t === 'prayers' && p.target.path.startsWith('daTraLoi')) {
      bo.push({ patch: p, lyDo: 'Diễn Hóa không trả lời lời cầu thay người chơi (47.4).' });
      continue;
    }
    giu.push(p);
  }

  return { giu, bo, loi: l };
}

// ─────────────────────────────────────────── điều kiện dừng 47.3

export type SuKienDangXem = {
  readonly loai: DieuKienDungDienHoa;
  readonly moTa: string;
  readonly entityIds: readonly string[];
};

export type NgocCanhDung = {
  readonly state: WorldState;
  readonly cauHinh: CauHinhDienHoa;
  readonly luotDaChay: number;
  readonly soCall: number;
  readonly tokenDaDung: number;
  /** Cơ chế vừa bật ở lượt này — từ `quetCoChe()`. */
  readonly coCheVuaBat?: readonly string[];
  /** Trục luật nền vừa được đặt tên. */
  readonly trucVuaDatTen?: readonly string[];
  /** Kỳ vọng lorebook vừa lệch — từ `capNhatKyVong()`. */
  readonly kyVongVuaLech?: readonly string[];
  readonly realityTruoc: number;
};

/**
 * Kiểm mọi điều kiện dừng — 47.3.
 *
 * Trả về điều kiện ĐẦU TIÊN khớp theo thứ tự ưu tiên "đáng xem" chứ không theo
 * thứ tự khai báo: hết lượt và cạn ngân sách xếp cuối, vì dừng vì hết chỉ tiêu
 * là kết cục nhàm nhất trong danh sách.
 */
export function kiemDieuKienDung(nc: NgocCanhDung): SuKienDangXem | null {
  const bat = new Set(nc.cauHinh.dieuKienDung);
  const s = nc.state;

  const co = (dk: DieuKienDungDienHoa): boolean => bat.has(dk);

  if (co('mach_dat_cao_trao')) {
    const m = [...s.storylines.values()]
      .filter((x: Storyline) => x.giaiDoan === 'cao_trao' && x.ketCuc === null)
      .sort((a, b) => (a.id < b.id ? -1 : 1))[0];
    if (m !== undefined) {
      return {
        loai: 'mach_dat_cao_trao',
        moTa: `Mạch "${m.ten}" vừa lên cao trào — đây chính là lúc bạn muốn có mặt.`,
        entityIds: m.nhanVat.map((n) => n.entityId),
      };
    }
  }

  if (co('nhan_vat_nguoi_choi_lam_nguy')) {
    const id = s.world.playerState.chuTheId;
    const e = id === null ? undefined : s.entities.get(id);
    if (e !== undefined && e.tickDiet !== null) {
      return { loai: 'nhan_vat_nguoi_choi_lam_nguy', moTa: `${e.ten} đã chết.`, entityIds: [e.id] };
    }
    const than = e?.aspects['than_the'] as { sinhLuc?: number } | undefined;
    if (than !== undefined && (than.sinhLuc ?? 100) < 25) {
      return {
        loai: 'nhan_vat_nguoi_choi_lam_nguy',
        moTa: `${e?.ten ?? 'Nhân vật của bạn'} đang nguy tới tính mạng.`,
        entityIds: e === undefined ? [] : [e.id],
      };
    }
  }

  if (co('co_che_moi_xuat_hien') && (nc.coCheVuaBat ?? []).length > 0) {
    return {
      loai: 'co_che_moi_xuat_hien',
      moTa: `Một Cơ Chế Phái Sinh vừa đủ điều kiện tồn tại: ${(nc.coCheVuaBat as string[]).join(', ')}.`,
      entityIds: [],
    };
  }

  if (co('luat_nen_duoc_dat_ten') && (nc.trucVuaDatTen ?? []).length > 0) {
    return {
      loai: 'luat_nen_duoc_dat_ten',
      moTa: `Có kẻ vừa khái niệm hóa được trục ${(nc.trucVuaDatTen as string[]).join(', ')}.`,
      entityIds: [],
    };
  }

  if (co('ky_vong_lorebook_bi_lech') && (nc.kyVongVuaLech ?? []).length > 0) {
    return {
      loai: 'ky_vong_lorebook_bi_lech',
      moTa: 'Thế giới vừa rẽ khỏi thần thoại nguồn — có một Dị Bản mới.',
      entityIds: [],
    };
  }

  if (co('ke_thu_troi_day')) {
    const ke = [...s.entities.values()]
      .filter((e) => e.tickDiet === null && e.aspects['adversarial'] !== undefined)
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .find((e) => {
        const a = e.aspects['adversarial'] as { lanCuoiTroiDay?: number } | undefined;
        return (a?.lanCuoiTroiDay ?? -1) === s.world.tick;
      });
    if (ke !== undefined) {
      return { loai: 'ke_thu_troi_day', moTa: `${ke.ten} tới nhịp.`, entityIds: [ke.id] };
    }
  }

  if (co('than_mat_domain')) {
    for (const e of [...s.entities.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
      if (e.kind !== 'deity') continue;
      const d = e.aspects['domain'] as { domains?: { ten: string; trangThai?: string }[] } | undefined;
      const mat = (d?.domains ?? []).find((x) => x.trangThai === 'lost');
      if (mat !== undefined) {
        return {
          loai: 'than_mat_domain',
          moTa: `${e.ten} vừa mất vĩnh viễn domain "${mat.ten}".`,
          entityIds: [e.id],
        };
      }
    }
  }

  if (co('phuc_but_qua_han')) {
    const pb = [...s.foreshadows.values()]
      .filter((f) => !f.daTra && f.hanTraToiDa !== null && s.world.tick > f.tickGieo + f.hanTraToiDa)
      .sort((a, b) => (a.id < b.id ? -1 : 1))[0];
    if (pb !== undefined) {
      return {
        loai: 'phuc_but_qua_han',
        moTa: `Một điều đã gieo quá hạn chưa trả: ${pb.noiDung}`,
        entityIds: [],
      };
    }
  }

  if (co('reality_tut_qua_20') && nc.realityTruoc - s.metrics.realityIntegrity > 20) {
    return {
      loai: 'reality_tut_qua_20',
      moTa: `Thực tại đang rách nhanh: ${nc.realityTruoc} → ${Math.round(s.metrics.realityIntegrity)}.`,
      entityIds: [],
    };
  }

  if (
    co('can_ngan_sach') &&
    nc.cauHinh.nganSach.dungKhiCan &&
    (nc.soCall >= nc.cauHinh.nganSach.callToiDa || nc.tokenDaDung >= nc.cauHinh.nganSach.tokenToiDa)
  ) {
    return { loai: 'can_ngan_sach', moTa: 'Hết ngân sách call hoặc token.', entityIds: [] };
  }

  if (nc.luotDaChay >= nc.cauHinh.soLuot) {
    return { loai: 'het_luot', moTa: `Đã chạy đủ ${nc.cauHinh.soLuot} lượt.`, entityIds: [] };
  }

  return null;
}

// ─────────────────────────────────────────── báo cáo 47.6

export type BaoCaoDienHoa = {
  readonly tieuDe: string;
  readonly lyDoDung: string;
  readonly muc: readonly { readonly tick: number; readonly moTa: string; readonly xemDuoc: boolean }[];
  readonly chiSo: readonly string[];
  readonly dong: readonly string[];
};

/** Báo Cáo Diễn Hóa — 47.6, viết bằng GIỌNG BIÊN NIÊN SỬ, không phải giọng log. */
export function baoCaoDienHoa(
  log: EvolutionLog,
  truoc: { reality: number; songDong: number },
  sau: { reality: number; songDong: number },
): BaoCaoDienHoa {
  const soNam = Math.max(0, log.tickKetThuc - log.tickBatDau);
  const tieuDe =
    `DIỄN HÓA · nhịp ${log.tickBatDau} – ${log.tickKetThuc} · ${soNam} nhịp · ` +
    `${log.soLuotChay} lượt · ${log.soCall} call · ${Math.round(log.tokenDaDung / 1000)}k token`;

  const muc = log.suKienLon.map((s) => ({ tick: s.tick, moTa: s.moTa, xemDuoc: true }));
  const chiSo = [
    `Thực tại: ${Math.round(truoc.reality)} → ${Math.round(sau.reality)}`,
    `Sống động: ${Math.round(truoc.songDong)} → ${Math.round(sau.songDong)}`,
  ];

  const dong: string[] = [tieuDe, '', `Dừng vì: ${log.lyDoDung}`, ''];
  if (muc.length > 0) {
    dong.push(`Trong khoảng ấy, ${muc.length} điều đáng ghi:`);
    dong.push('');
    for (const m of muc) dong.push(`  ${m.tick}  ${m.moTa}`);
    dong.push('');
  }
  dong.push(chiSo.join('        '));
  return { tieuDe, lyDoDung: log.lyDoDung, muc, chiSo, dong };
}
