/**
 * Ba độ phân giải và phép vật chất hóa macro → micro — Phần 71.3 [BB].
 *
 * | Vị trí | Cách chạy |
 * |---|---|
 * | Trên sân khấu | micro: entity và vật cụ thể |
 * | Gần ống kính | meso: household, nơi chốn, nhóm |
 * | Xa ống kính | macro: cohort và flow bảo toàn |
 *
 * [BB] Chuyển macro → micro phải bảo toàn: dân số, vật chất chính, quyền sở hữu,
 * event lớn, phân bố nghề/tuổi/sức khỏe, lịch sử đã biết.
 *
 * > "Không materialize một gia đình giàu trong vùng đói mà không có nguồn."
 *
 * Đây là điều khiến người chơi tin vào NPC vừa bước vào cảnh: người đó không
 * được sinh ra lúc bạn nhìn, mà được **rút ra** từ một quần thể đã sống sẵn —
 * kèm theo đúng cái nghèo, đúng cái bệnh và đúng những điều mà vùng đó biết.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { WorldState } from '../../engine/state.js';
import type { Rng } from '../../engine/rng.js';
import { rngCuaTick } from '../../engine/rng.js';
import { EntitySchema, LinkSchema } from '../../schema/entity.js';
import { MortalSchema } from '../../schema/aspect/living.js';
import { SoulSchema } from '../../schema/aspect/soul.js';
import { nguonGoc } from '../../schema/aspect/provenance.js';
import { KnowledgeRowSchema, khoaTriThuc } from '../../schema/soSach.js';
import type { DanCu, KinhTe, YTe } from '../../schema/aspect/substrate.js';
import type { PhanGiaiChay } from './types.js';
import { docAspect, kep, lam, tongCohort } from './tienIch.js';
import type { Cohort } from './tienIch.js';

/**
 * Độ phân giải theo khoảng cách tới ống kính.
 *
 * `nearbyResolutionRadius` của tuning là bán kính "gần ống kính" tính bằng số
 * chặng đường, không phải bằng khoảng cách hình học: một vùng cách hai ngọn núi
 * nhưng không có đường tới thì xa, dù trên bản đồ nó nằm sát bên.
 */
export function phanGiaiTheoOngKinh(soChang: number | null, banKinhGan: number): PhanGiaiChay {
  if (soChang === null) return 'macro';
  if (soChang === 0) return 'micro';
  return soChang <= banKinhGan ? 'meso' : 'macro';
}

export type YeuCauVatChatHoa = {
  readonly noiId: string;
  readonly soNguoi: number;
  readonly eventId: string;
  /** Nhóm tuổi muốn lấy; bỏ trống thì rút theo đúng tháp tuổi của vùng. */
  readonly band?: keyof Cohort;
  readonly tienTo?: string;
};

export type KetQuaVatChatHoa = {
  readonly patches: readonly PatchOp[];
  readonly entityIds: readonly string[];
  readonly lyDoTuChoi: string | null;
};

const BAND: readonly (keyof Cohort)[] = ['child', 'youth', 'adult', 'elder'];

/** Rút `n` người khỏi tháp tuổi theo đúng tỷ trọng, không lệch về nhóm nào. */
function rutTheoThapTuoi(c: Cohort, n: number, band?: keyof Cohort): Record<keyof Cohort, number> {
  const ra: Record<keyof Cohort, number> = { child: 0, youth: 0, adult: 0, elder: 0 };
  if (band) {
    ra[band] = Math.min(n, Math.floor(c[band]));
    return ra;
  }
  const tong = tongCohort(c);
  if (tong <= 0) return ra;
  let daChia = 0;
  for (const b of BAND) {
    ra[b] = Math.min(Math.floor((n * c[b]) / tong), Math.floor(c[b]));
    daChia += ra[b];
  }
  // Phần dư về nhóm đông nhất còn chỗ — deterministic, không random.
  for (const b of BAND) {
    if (daChia >= n) break;
    const them = Math.min(n - daChia, Math.floor(c[b]) - ra[b]);
    ra[b] += them;
    daChia += them;
  }
  return ra;
}

const AM_TIET = ['Ma', 'Lư', 'Đàn', 'Sa', 'Hoè', 'Tí', 'Vân', 'Bạch', 'Khoa', 'Trù'] as const;

function tenNguoi(rng: Rng): string {
  const a = AM_TIET[rng.nguyen(AM_TIET.length)] as string;
  const b = AM_TIET[rng.nguyen(AM_TIET.length)] as string;
  return `${a} ${b}`;
}

const NGHE = ['nghe_dan_luoi', 'nghe_lam_ruong', 'nghe_gom', 'nghe_moc', 'nghe_san'] as const;

/**
 * Rút `soNguoi` người thật khỏi cohort của một vùng.
 *
 * [BB] Tổng dân số KHÔNG đổi: cohort giảm đúng bằng số entity được tạo, và
 * `spatial.danSo` giữ nguyên vì người được đặt tên vẫn là người của vùng đó.
 *
 * Tài sản và sức khỏe của họ **lấy từ vùng**, không phát sinh:
 *   - kỹ năng theo `kinh_te.kyThuat` của vùng;
 *   - có bệnh hay không theo `y_te.tyLeMac`;
 *   - thể lực theo `kinh_te.thieuHut`;
 *   - điều họ biết là **đúng tập tri thức mà vùng đang giữ**, không hơn một điều.
 */
export function vatChatHoa(state: WorldState, yc: YeuCauVatChatHoa): KetQuaVatChatHoa {
  const e = state.entities.get(yc.noiId);
  const dc = docAspect<DanCu>(e, 'dan_cu');
  if (!e || !dc) {
    return { patches: [], entityIds: [], lyDoTuChoi: `'${yc.noiId}' không phải nơi chốn có dân cư.` };
  }

  const con = tongCohort(dc.cohort);
  const muon = Math.max(0, Math.floor(yc.soNguoi));
  if (muon === 0) return { patches: [], entityIds: [], lyDoTuChoi: null };
  if (muon > con) {
    // [BB] Không bịa người. Vùng có bao nhiêu thì rút được bấy nhiêu.
    return {
      patches: [],
      entityIds: [],
      lyDoTuChoi: `'${yc.noiId}' chỉ còn ${con} người, không thể vật chất hóa ${muon}.`,
    };
  }

  const kt = docAspect<KinhTe>(e, 'kinh_te');
  const yt = docAspect<YTe>(e, 'y_te');
  const thieuHut = kep(kt?.thieuHut ?? 0, 0, 1);
  const tyLeMac = kep(yt?.tyLeMac ?? 0, 0, 1);
  const kyThuat = kep(kt?.kyThuat ?? 0, 0, 100);

  const rut = rutTheoThapTuoi(dc.cohort, muon, yc.band);
  const thatSu = BAND.reduce((t, b) => t + rut[b], 0);
  if (thatSu === 0) {
    return { patches: [], entityIds: [], lyDoTuChoi: `'${yc.noiId}' không còn ai thuộc nhóm tuổi yêu cầu.` };
  }

  const rng = rngCuaTick(state.world.seed, state.world.tick, `vat_chat_hoa:${yc.noiId}:${yc.eventId}`);
  const patches: PatchOp[] = [];
  const entityIds: string[] = [];
  const tienTo = yc.tienTo ?? 'nguoi';

  // Tri thức của vùng, sắp xếp deterministic — người mới biết đúng phần này.
  const triThucVung = [...state.knowledge.values()]
    .filter((r) => r.knowerId === yc.noiId)
    .sort((a, b) => (a.id < b.id ? -1 : 1));

  let chiSo = 0;
  for (const band of BAND) {
    for (let i = 0; i < rut[band]; i++) {
      const id = `${tienTo}_${yc.noiId}_${state.world.tick}_${chiSo}`;
      chiSo++;

      // Sức khỏe rút từ tình trạng THẬT của vùng.
      const om = rng.co(tyLeMac);
      const theLuc = lam(kep(100 - thieuHut * 45 - (om ? 25 : 0) - (band === 'elder' ? 20 : 0), 5, 100));
      const sinhLuc = lam(kep(100 - (om ? 30 : 0) - thieuHut * 20, 10, 100));
      // Kỹ năng không vượt trình độ vùng — không có thợ rèn bậc thầy ở làng chài.
      const mucNghe = Math.round(kep(kyThuat * 0.8 + rng.khoang(-8, 12), 0, 100));

      const nguoi = EntitySchema.parse({
        id,
        branchId: state.world.branchId,
        kind: 'mortal',
        ten: tenNguoi(rng),
        moTa: `Một người của ${e.ten}, vừa bước ra khỏi đám đông.`,
        tickSinh: state.world.tick,
        tags: ['vat_chat_hoa'],
        aspects: {
          // [BB] 59.1 — người này bước ra khỏi đám đông vì thế giới cần họ, không
          // vì ai gọi tên họ. `parentIds` giữ lại cái đám đông ấy.
          provenance: nguonGoc('the_gioi_tu_sinh', state.world.tick, { parentIds: [e.id] }),
          soul: SoulSchema.parse({
            tang: 't1',
            banTinh: {
              canDam_khiepNhuoc: rng.khoang(-40, 40),
              tratTu_phongTung: rng.khoang(-40, 40),
            },
          }),
          mortal: MortalSchema.parse({
            ageBand: band,
            tuoiTho: rng.khoang(52, 76),
            tickSinh: state.world.tick,
            ngheId: NGHE[rng.nguyen(NGHE.length)] as string,
            kyNang: { nghe_chinh: mucNghe },
            thanThe: { sinhLuc, theLuc, doDoi: 0, conditions: [] },
            // [BB] Không tặng tài sản. Nếu vùng đói, người này cũng đói.
            soHuu: [],
          }),
        },
      });

      patches.push({
        op: 'link',
        target: { table: 'entities', id, path: '' },
        value: nguoi,
        sourceEventId: yc.eventId,
      });

      for (const [lid, tuId, denId, qh] of [
        [`lk_${id}_o`, id, yc.noiId, 'cu_tru_tai'],
        [`lk_${id}_co`, yc.noiId, id, 'la_noi_cu_tru_cua'],
      ] as const) {
        patches.push({
          op: 'link',
          target: { table: 'links', id: lid, path: '' },
          value: LinkSchema.parse({
            id: lid,
            branchId: state.world.branchId,
            tuId,
            denId,
            quanHe: qh,
            trongSo: 90,
            tickTao: state.world.tick,
          }),
          sourceEventId: yc.eventId,
        });
      }

      /*
       * ── lịch sử đã biết: chép từ vùng, và NGUỒN là chính cái vùng ấy ──
       *
       * [BB] Bản trước giữ nguyên `source.sourceId` của dòng gốc, và nó SAI một
       * cách chỉ lộ ra ở `chayInvariantToanBo()`: một người ở làng V mang dòng
       * "học từ P" trong khi họ chưa từng đặt chân tới P. `khong_tri_thuc_teleport`
       * tra tuyến giữa P và **con người ấy** — mà không tuyến đường nào kết thúc
       * ở một con người — nên mọi dòng như thế là một vi phạm nằm im cho tới lúc
       * ai đó xuất rồi nhập lại ván.
       *
       * Sự thật là: người này biết điều ấy VÌ LÀNG CỦA HỌ biết. Chuỗi lai lịch
       * không đứt — làng vẫn giữ dòng "học từ P" của nó, và dòng ấy vẫn phải có
       * tuyến đường và đủ thời gian. Ta chỉ trỏ lui đúng một mắt xích, thay vì
       * khai một mắt xích chưa từng tồn tại.
       *
       * `hops` cộng thêm một vì đây là một chặng thật: từ vùng tới người trong
       * vùng. `learnedAtTick` giữ nguyên — họ ở đó khi tin tới, không đợi thêm.
       */
      for (const r of triThucVung.slice(0, 6)) {
        const khoa = khoaTriThuc(id, r.factId);
        patches.push({
          op: 'link',
          target: { table: 'knowledge', id: khoa, path: '' },
          value: KnowledgeRowSchema.parse({
            ...r,
            id: khoa,
            knowerId: id,
            source: { ...r.source, sourceId: yc.noiId, hops: r.source.hops + 1 },
            learnedAtTick: r.learnedAtTick,
          }),
          sourceEventId: yc.eventId,
        });
      }

      entityIds.push(id);
    }
    if (rut[band] > 0) {
      // Cohort giảm đúng bằng số người vừa có tên. Dân số tổng KHÔNG đổi.
      patches.push({
        op: 'add',
        target: { table: 'entities', id: yc.noiId, path: `aspects.dan_cu.cohort.${band}` },
        value: -rut[band],
        sourceEventId: yc.eventId,
      });
    }
  }

  // `spatial.danSo` cũng giảm, vì người đã có tên không còn nằm trong cohort.
  patches.push({
    op: 'add',
    target: { table: 'entities', id: yc.noiId, path: 'aspects.spatial.danSo' },
    value: -thatSu,
    sourceEventId: yc.eventId,
  });
  patches.push({
    op: 'add',
    target: { table: 'entities', id: yc.noiId, path: 'aspects.dan_cu.soCai.vatChatHoa' },
    value: thatSu,
    sourceEventId: yc.eventId,
  });

  return { patches, entityIds, lyDoTuChoi: null };
}
