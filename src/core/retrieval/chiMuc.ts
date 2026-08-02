/**
 * Bộ chỉ mục — Phần 54.2, 54.3, 54.8.
 *
 * ── Nhãn tầm nhìn gán LÚC INDEX, không gán lúc truy vấn ──
 *
 * 54.3: "Mọi chunk mang một nhãn tầm nhìn, gán lúc index." Đây là chi tiết dễ
 * làm ngược nhất và tốn kém nhất khi làm ngược: nếu nhãn được suy ra lúc truy
 * vấn thì mỗi lần thêm một loại nội dung mới, người viết phải nhớ suy nhãn cho
 * nó — và một lần quên là một đường rò vĩnh viễn. Gán lúc index nghĩa là chunk
 * KHÔNG CÓ NHÃN thì mặc định là `sang_the`, tức không ai dưới Sáng Thế thấy nó.
 * Quên đi kèm hậu quả "mất thông tin", không phải "rò thông tin".
 *
 * [BB] 54.2 — mỗi diễn giải của một luật là MỘT CHUNK RIÊNG, gắn `vungId`. Kể
 * chuyện ở vùng A phải nhận diễn giải của vùng A, không nhận của vùng B và
 * không nhận văn bản gốc.
 */
import type { WorldState } from '../engine/state.js';
import type { Entity } from '../schema/entity.js';
import { ChunkSchema, cuaSoTruot } from './chunk.js';
import type { Chunk } from './chunk.js';

function doc<T>(e: Entity, ten: string): T | undefined {
  const a = e.aspects[ten];
  return a === undefined || a === null ? undefined : (a as T);
}

function moiEntity(s: WorldState): readonly Entity[] {
  return [...s.entities.keys()]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((id) => s.entities.get(id))
    .filter((e): e is Entity => e !== undefined);
}

/**
 * Sáu trục bản tính, mỗi trục hai đầu — Phần 11.1.
 *
 * Trục chạy từ -100 tới 100 quanh 0. Chỉ nét đủ mạnh (|giá trị| ≥ 35) mới thành
 * lời: một vị thần "hơi nghiêm khắc một chút" không sinh ra truyền thuyết nào.
 */
const HAI_DAU_TRUC: Readonly<Record<string, readonly [string, string]>> = Object.freeze({
  tuBi_tanNhan: ['nhân từ', 'tàn nhẫn'],
  kieuNgao_khiemNhuong: ['kiêu ngạo', 'khiêm nhường'],
  trungThanh_phanTrac: ['thủy chung', 'tráo trở'],
  ducVong_tietChe: ['đầy dục vọng', 'tiết chế'],
  tratTu_phongTung: ['ưa trật tự', 'phóng túng'],
  canDam_khiepNhuoc: ['can đảm', 'nhát gan'],
});

const NGUONG_THANH_LOI = 35;

/** Dịch bản tính thành CHỮ. Rỗng nghĩa là chưa có nét nào đủ rõ để kể. */
function tinhCachThanhLoi(bt: Record<string, number>): string {
  const net: string[] = [];
  for (const truc of Object.keys(HAI_DAU_TRUC).sort((a, b) => (a < b ? -1 : 1))) {
    const v = bt[truc];
    if (typeof v !== 'number' || Math.abs(v) < NGUONG_THANH_LOI) continue;
    const hai = HAI_DAU_TRUC[truc];
    if (!hai) continue;
    net.push(v > 0 ? hai[0] : hai[1]);
  }
  return net.length === 0 ? '' : `là kẻ ${net.slice(0, 3).join(', ')}`;
}

type Nhap = {
  id: string;
  nguon: string;
  nguonId: string;
  noiDung: string;
  tick: number;
  entityIds?: readonly string[];
  storylineId?: string | null;
  trust?: number;
  tamNhin?: Partial<Chunk['tamNhin']>;
  meta?: Record<string, unknown>;
};

/**
 * Dựng chỉ mục cho một nhánh.
 *
 * Hàm thuần: cùng state cho cùng danh sách chunk, cùng thứ tự. Đó là điều kiện
 * để `candidateSetHash` của cache rerank (77.8) có nghĩa.
 */
export function dungChiMuc(s: WorldState): readonly Chunk[] {
  const nhap: Nhap[] = [];
  const branchId = s.world.branchId;

  for (const e of moiEntity(s)) {
    // ── Định luật: văn bản gốc + MỖI DIỄN GIẢI MỘT CHUNK RIÊNG (54.2) ──
    const l = doc<{
      vanBan?: string;
      dienGiai?: { vungId?: string; noiDung?: string; doLech?: number; theHe?: number }[];
      keHo?: { moTa?: string; daBiKhaiThac?: boolean }[];
    }>(e, 'lawful');
    if (l) {
      if ((l.vanBan ?? '').trim() !== '') {
        nhap.push({
          id: `ck_luat_${e.id}`,
          nguon: 'dinh_luat',
          nguonId: e.id,
          noiDung: `${e.ten}: ${l.vanBan}`,
          tick: e.tickSinh,
          entityIds: [e.id],
          trust: 1,
          // [BB] 18.2 — văn bản luật gốc KHÔNG BAO GIỜ xuống tầng phàm nhân.
          tamNhin: { tangToiThieu: 'than' },
          meta: { lawId: e.id },
        });
      }
      for (const [i, dg] of (l.dienGiai ?? []).entries()) {
        if ((dg.noiDung ?? '').trim() === '') continue;
        nhap.push({
          id: `ck_dg_${e.id}_${i}`,
          nguon: 'dien_giai_luat',
          nguonId: `dg_${e.id}_${dg.vungId ?? 'chung'}`,
          noiDung: dg.noiDung as string,
          tick: e.tickSinh,
          entityIds: [e.id, ...(dg.vungId ? [dg.vungId] : [])],
          // Diễn giải càng lệch càng ít đáng tin — nhưng KHÔNG bị loại (54.7).
          trust: Math.max(0, 1 - (dg.doLech ?? 0) / 100),
          tamNhin: {
            tangToiThieu: 'pham_nhan',
            vungHanChe: dg.vungId ? [dg.vungId] : [],
          },
          meta: { lawId: e.id, vungId: dg.vungId ?? '', theHe: dg.theHe ?? 0, doLech: dg.doLech ?? 0 },
        });
      }
      for (const [i, kh] of (l.keHo ?? []).entries()) {
        if ((kh.moTa ?? '').trim() === '') continue;
        nhap.push({
          id: `ck_keho_${e.id}_${i}`,
          nguon: 'dinh_luat',
          nguonId: `keho_${e.id}`,
          noiDung: `Kẽ hở của ${e.ten}: ${kh.moTa}`,
          tick: e.tickSinh,
          entityIds: [e.id],
          trust: 1,
          // Kẽ hở engine đã biết mà chưa ai trong thế giới khám phá ra: chỉ
          // Sáng Thế được thấy. Đây đúng là chunk cấm của fixture eval.
          tamNhin: { tangToiThieu: kh.daBiKhaiThac === true ? 'than' : 'sang_the' },
        });
      }
    }

    // ── Khái niệm ──
    const c = doc<{ giaiDoan?: string; sacThai?: Record<string, number> }>(e, 'conceptual');
    if (c) {
      nhap.push({
        id: `ck_kn_${e.id}`,
        nguon: 'khai_niem',
        nguonId: e.id,
        noiDung: `${e.ten}${e.moTa ? ` — ${e.moTa}` : ''}`,
        tick: e.tickSinh,
        entityIds: [e.id],
        // Khái niệm chưa có tên trong văn hóa thì phàm nhân không biết nó tồn tại.
        tamNhin: { tangToiThieu: c.giaiDoan === 'hu_danh' ? 'sang_the' : 'pham_nhan' },
        meta: { conceptId: e.id, giaiDoan: c.giaiDoan ?? '' },
      });
    }

    // ── Ký ức thực thể: MỘT MẢNH KÝ ỨC LÀ MỘT CHUNK (54.2) ──
    const soul = doc<{
      kyUc?: { id: string; tomTat: string; tick: number; dienTich?: number; lienQuan?: string[] }[];
      banTinh?: Record<string, number>;
    }>(e, 'soul');
    for (const k of soul?.kyUc ?? []) {
      if (k.tomTat.trim() === '') continue;
      nhap.push({
        id: `ck_ku_${e.id}_${k.id}`,
        nguon: 'ky_uc_thuc_the',
        nguonId: `ku_${e.id}`,
        noiDung: k.tomTat,
        tick: k.tick,
        entityIds: [e.id, ...(k.lienQuan ?? [])],
        trust: 0.8,
        // Ký ức riêng của một người: chỉ chính họ (và tầng trên) được đọc.
        tamNhin: { tangToiThieu: e.kind === 'deity' ? 'than' : 'pham_nhan' },
        meta: { entityId: e.id, dienTich: k.dienTich ?? 50, tick: k.tick },
      });
    }

    /**
     * [BB] 18.2 quy tắc 2 — bản tính THẬT của thần không bao giờ tới tầng phàm
     * nhân; phàm nhân chỉ được thấy `banTinhTinDoTin`.
     */
    if (e.kind === 'deity' && soul?.banTinh) {
      const van = Object.entries(soul.banTinh)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([k, v]) => `${k}=${Math.round(v)}`)
        .join(', ');
      nhap.push({
        id: `ck_bt_that_${e.id}`,
        nguon: 'ky_uc_thuc_the',
        nguonId: `hon_pho_${e.id}`,
        noiDung: `Bản tính thật của ${e.ten}: ${van}`,
        tick: e.tickSinh,
        entityIds: [e.id],
        trust: 1,
        tamNhin: { tangToiThieu: 'sang_the' },
      });
    }

    const ven = doc<{ banTinhTinDoTin?: Record<string, number> }>(e, 'venerable');
    if (ven?.banTinhTinDoTin) {
      /**
       * [BB] 56.2 quy tắc 1 — tầng phàm nhân KHÔNG có con số hệ thống.
       *
       * Đây là chunk DUY NHẤT về thần mà phàm nhân được đọc, nên nó là chỗ dễ
       * rò nhất: in `kieuNgao_khiemNhuong=44` ra là đưa thẳng thang đo của engine
       * vào miệng dân làng. Người ta không nói về thần bằng số; họ nói "ngài
       * nghiêm khắc". Vì vậy trục được dịch thành CHỮ, và trục ở giữa thang thì
       * không được nhắc tới — người ta chỉ kể những nét đủ mạnh để thành lời đồn.
       */
      const van = tinhCachThanhLoi(ven.banTinhTinDoTin);
      if (van !== '') {
        nhap.push({
          id: `ck_bt_tin_${e.id}`,
          nguon: 'lorebook',
          nguonId: `tin_do_tin_${e.id}`,
          noiDung: `Người ta tin ${e.ten} ${van}.`,
          tick: e.tickSinh,
          entityIds: [e.id],
          trust: 0.5,
          tamNhin: { tangToiThieu: 'pham_nhan' },
        });
      }
    }
  }

  // ── Ký ức mạch: MỘT NHỊP LÀ MỘT CHUNK (54.2) ──
  for (const id of [...s.storylines.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const m = s.storylines.get(id);
    if (!m || m.kyUcMach.trim() === '') continue;
    for (const [i, lat] of cuaSoTruot(m.kyUcMach).entries()) {
      nhap.push({
        id: `ck_mach_${m.id}_${i}`,
        nguon: 'ky_uc_mach',
        nguonId: m.id,
        noiDung: lat,
        tick: m.tickSinh,
        entityIds: m.nhanVat.map((n) => n.entityId),
        storylineId: m.id,
        trust: 0.9,
        // Mạch người chơi chưa biết KHÔNG được truy hồi về prompt của họ.
        tamNhin: { tangToiThieu: m.nguoiChoiBiet ? 'pham_nhan' : 'sang_the' },
        meta: { machId: m.id, giaiDoan: m.giaiDoan },
      });
    }
  }

  // ── Sổ Phục Bút: MỘT MỤC LÀ MỘT CHUNK (54.2) ──
  for (const id of [...s.foreshadows.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const f = s.foreshadows.get(id);
    if (!f) continue;
    nhap.push({
      id: `ck_pb_${f.id}`,
      nguon: 'so_phuc_but',
      nguonId: f.machId ?? f.id,
      noiDung: f.daTra ? `${f.noiDung} (đã trả: ${f.cachTra})` : `${f.noiDung} (CHƯA TRẢ)`,
      tick: f.tickGieo,
      storylineId: f.machId,
      trust: 1,
      tamNhin: { tangToiThieu: f.loai === 'bi_mat' ? 'sang_the' : 'pham_nhan' },
      meta: { loai: f.loai, tickGieo: f.tickGieo, hanTra: f.hanTraToiDa },
    });
  }

  // ── Sổ Nhân Quả: một món nợ là một mục ──
  for (const id of [...s.debts.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const d = s.debts.get(id);
    if (!d) continue;
    const chu = s.entities.get(d.creditorId)?.ten ?? d.creditorId;
    const con = s.entities.get(d.debtorId)?.ten ?? d.debtorId;
    nhap.push({
      id: `ck_no_${d.id}`,
      nguon: 'so_nhan_qua',
      nguonId: `no_${d.creditorId}`,
      noiDung: `${con} nợ ${chu}${d.terms ? `: ${d.terms}` : ''} (${d.status}).`,
      tick: d.tickTao,
      entityIds: [d.creditorId, d.debtorId],
      trust: 1,
      tamNhin: { tangToiThieu: 'pham_nhan' },
      meta: { loai: 'no', status: d.status, dueTick: d.dueTick },
    });
  }

  /**
   * ── Tri thức: nguồn duy nhất sinh chunk `laTinDon` ──
   *
   * `duongIds.length > 0` nghĩa là tin đã đi qua người khác. 54.3 bắt chunk như
   * vậy phải qua `bopMeo()` trước khi vào ngữ cảnh, kể cả khi nó được truy hồi
   * đúng — vì "đúng" ở đây chỉ có nghĩa là đúng người kể, không phải đúng sự thật.
   */
  for (const id of [...s.knowledge.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const k = s.knowledge.get(id);
    if (!k) continue;
    if (k.proposition.trim() === '') continue;
    // `hops > 0` nghĩa là tin đã đi qua miệng người khác — đó là định nghĩa của
    // tin đồn ở 71.4, và nó khác "chưa chắc chắn".
    const chang = k.source.hops;
    nhap.push({
      id: `ck_tt_${k.id}`,
      nguon: 'bien_nien',
      nguonId: k.factId,
      noiDung: k.proposition,
      tick: k.learnedAtTick,
      entityIds: [k.knowerId, ...k.objectRefs.map((r) => r.id)],
      trust: Math.max(0, Math.min(1, k.confidence)),
      tamNhin: { tangToiThieu: 'pham_nhan', laTinDon: chang > 0 },
      meta: { knowerId: k.knowerId, chang },
    });
  }

  return Object.freeze(
    nhap
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map((n) =>
        ChunkSchema.parse({
          id: n.id,
          branchId,
          nguon: n.nguon,
          nguonId: n.nguonId,
          noiDung: n.noiDung,
          vector: null,
          meta: n.meta ?? {},
          tamNhin: n.tamNhin ?? {},
          entityIds: [...new Set(n.entityIds ?? [])].sort((a, b) => (a < b ? -1 : 1)),
          storylineId: n.storylineId ?? null,
          trust: n.trust ?? 0.7,
          tick: n.tick,
        }),
      ),
  );
}
