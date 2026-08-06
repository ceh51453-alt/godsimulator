/**
 * Ba tiến trình tầng Thần — Phần 69, 22, 12.2.
 *
 * Cổng Phase 6 đòi "thần NPC tiếp tục sống khi vắng". Cách rẻ nhất để làm sai
 * điều đó là viết một hàm `capNhatThanNpc()` gọi từ UI. Cách đúng là cho thần
 * NPC đi chung một đường với mùa màng và dịch bệnh: **tiến trình nền**.
 *
 * Nhờ vậy thần NPC sống kể cả khi người chơi đang ở tầng Phàm Nhân, kể cả khi
 * tua một trăm năm, và mọi thứ họ làm đều nằm trong cùng một event log.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { KetQuaTienTrinh, NgocCanhTienTrinh, UngVienSuKien } from './types.js';
import { docAspect, kep, lam, moiNoiChon } from './tienIch.js';
import { gopTyLe } from './moiTruong.js';
import type { Entity } from '../../schema/entity.js';
import type { Venerable } from '../../schema/aspect/divine.js';
import type { BanTinh } from '../../schema/aspect/soul.js';
import type { DivineIdentity } from '../../schema/aspect/thanVi.js';
import { hinhHienTai, TRAN_TINH_HUONG_MO } from '../../schema/aspect/thanVi.js';
import { doApLuc, moTaTinhHuong, troiHinhAnh, banNgaTu } from '../../than/diHoa.js';
import { raSoatDomain } from '../../than/quyKet.js';
import { quetBeTac, sinhLoiCau, loiCauQuaHan, loiCauCho } from '../../than/cauNguyen.js';
import { HAU_QUA_TRA_LOI } from '../../schema/than.js';
import type { AnNinh, KinhTe, YTe } from '../../schema/aspect/substrate.js';
import type { DuAnAspect } from '../../schema/aspect/duAn.js';
import { moDuAnThan, raSoatDuAnThan, ungVienDuAn } from '../../than/duAn.js';

/** Mọi vị thần còn tồn tại, đã sắp xếp deterministic. */
function moiThan(nc: NgocCanhTienTrinh): { id: string; e: Entity }[] {
  const ra: { id: string; e: Entity }[] = [];
  for (const id of [...nc.state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const e = nc.state.entities.get(id);
    if (!e || e.kind !== 'deity' || e.tickDiet !== null) continue;
    ra.push({ id, e });
  }
  return ra;
}

const dat = (nc: NgocCanhTienTrinh, id: string, path: string, value: unknown): PatchOp => ({
  op: 'set',
  target: { table: 'entities', id, path },
  value,
  sourceEventId: nc.eventId,
});

// ─────────────────────────────────────────── divine_alienation

/**
 * Dị Hóa — [BB] 69.1.
 *
 * Tiến trình này **KHÔNG** chạm `coreSelf`. Nó chỉ:
 *   1. đẩy `followerImage` theo những gì tín đồ đang trải qua;
 *   2. đo khoảng cách và ghi vào `pressure`;
 *   3. mở một *tình huống* khi khoảng cách vượt `tuning.than.nguongDiHoa`.
 *
 * Ai đó — người chơi hoặc `divine_agency` — phải **chọn** thì lõi mới đổi.
 */
export function chayDiHoa(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];
  const n = nc.soBuocGop;

  for (const { id, e } of moiThan(nc)) {
    const ven = docAspect<Venerable>(e, 'venerable');
    let bn = docAspect<DivineIdentity>(e, 'ban_nga');

    if (!bn) {
      // Thần của save cũ chưa có bản ngã — dựng từ dữ liệu đã có, không bịa.
      const soul = docAspect<{ banTinh: Record<string, number> }>(e, 'soul');
      if (!soul) continue;
      bn = banNgaTu(soul.banTinh as never, ven);
      patches.push(dat(nc, id, 'aspects.ban_nga', bn));
      continue;
    }

    // ── 1. hình ảnh trôi theo đời sống của tín đồ ──
    // Vùng đói và có chiến sự thì tín đồ dựng ra một vị thần khắc nghiệt hơn,
    // dù vị thần ấy chẳng làm gì cả. Đây là chỗ Dị Hóa có nguồn thật.
    let khoKhan = 0;
    let soVung = 0;
    for (const [vungId, mat] of Object.entries(ven?.matDoDen ?? {})) {
      if (mat <= 0) continue;
      const v = nc.state.entities.get(vungId);
      const kt = docAspect<KinhTe>(v, 'kinh_te');
      const an = docAspect<AnNinh>(v, 'an_ninh');
      const yt = docAspect<YTe>(v, 'y_te');
      khoKhan +=
        kep(kt?.thieuHut ?? 0, 0, 1) * 0.5 +
        kep((an?.deDoa ?? 0) / 100, 0, 1) * 0.3 +
        kep(yt?.tyLeMac ?? 0, 0, 1) * 0.2;
      soVung++;
    }
    const apLucSong = soVung > 0 ? khoKhan / soVung : 0;

    /*
     * Khổ ĐẨY hình ảnh, không kéo nó về một điểm cố định.
     *
     * Bản đầu dùng `troiHinhAnh(anh, { tuBi_tanNhan: apLucSong * 70 }, ...)`, tức
     * coi khổ như một *mốc* để hình ảnh tiệm cận. Hệ quả: một vị thần đã bị tin
     * là tàn nhẫn ở mức 52 gặp nạn đói (mốc 35) thì hình ảnh **dịu đi**. Sai hẳn
     * về nghĩa, và nó giữ độ lệch mãi dưới ngưỡng nên Dị Hóa không bao giờ nổ ra.
     *
     * Đúng phải là tích lũy: chịu khổ càng lâu, người ta càng kể về một vị thần
     * khắc nghiệt hơn — và khi yên trở lại, hình ảnh nguội dần về phía con người
     * thật của vị thần, vì không ai còn lý do để dựng chuyện.
     */
    const buoc = n;
    const anhMoi = { ...bn.followerImage } as Record<string, number>;
    if (apLucSong >= 0.2) {
      const day = apLucSong * 1.2 * buoc;
      anhMoi['tuBi_tanNhan'] = kep((anhMoi['tuBi_tanNhan'] ?? 0) + day, -100, 100);
      anhMoi['tratTu_phongTung'] = kep((anhMoi['tratTu_phongTung'] ?? 0) + day * 0.6, -100, 100);
    } else {
      // Thời yên: ký ức tập thể nguội về phía sự thật, rất chậm.
      const ve = troiHinhAnh(bn.followerImage, bn.coreSelf, gopTyLe(0.01, buoc));
      for (const k of Object.keys(ve)) anhMoi[k] = (ve as Record<string, number>)[k] as number;
    }

    const ap = doApLuc({ ...bn, followerImage: anhMoi as BanTinh });
    const hinh = hinhHienTai(bn.coreSelf, anhMoi, ven?.hienThanh ?? 20);

    patches.push(dat(nc, id, 'aspects.ban_nga.followerImage', anhMoi));
    patches.push(dat(nc, id, 'aspects.ban_nga.currentManifestation', hinh));
    patches.push(dat(nc, id, 'aspects.ban_nga.pressure.distortion', lam(ap.distortion)));
    patches.push(dat(nc, id, 'aspects.ban_nga.pressure.suppressedTraits', [...ap.suppressedTraits]));
    patches.push(dat(nc, id, 'aspects.ban_nga.pressure.demandedTraits', [...ap.demandedTraits]));
    // `doLechDiHoa` của `venerable` là cùng con số, để Bảng Lãnh Địa đọc một chỗ.
    patches.push(dat(nc, id, 'aspects.venerable.doLechDiHoa', Math.round(ap.distortion)));

    // ── 2. mở tình huống khi áp lực vượt ngưỡng ──
    const dangMo = bn.pressure.tinhHuongMo.filter((t) => t.daChon === null);
    if (ap.distortion <= nc.tuning.than.nguongDiHoa || ap.trucNang === null || dangMo.length > 0) continue;

    const thId = `dh_${nc.tick}_${id}`;
    const tinhHuongMoi = {
      id: thId,
      truc: ap.trucNang,
      moTa: moTaTinhHuong(e.ten, ap.trucNang, ap.lech),
      tickSinh: nc.tick,
      daChon: null,
    };
    /*
     * `set` chứ không `push`, vì sổ này có trần.
     *
     * `tinhHuongMo` khai `.max(8)`, nhưng tình huống ĐÃ CHỌN thì không ai dọn:
     * mỗi lần áp lực vượt ngưỡng lại thêm một mục, và sau vài trăm nhịp mảng ấy
     * dài chín mươi ba phần tử. Trần trong schema chỉ là một câu nói suông cho
     * tới khi có ai đó cắt.
     *
     * Cắt theo `tickSinh` — giữ những gì mới nhất. Tình huống đã chọn là lịch sử
     * đã có hệ quả trong `lichSuLoi`; nó không mất nghĩa khi rời khỏi sổ chờ.
     */
    const conCho = [...bn.pressure.tinhHuongMo, tinhHuongMoi]
      .sort((a, b) => (a.tickSinh === b.tickSinh ? (a.id < b.id ? -1 : 1) : a.tickSinh - b.tickSinh))
      .slice(-TRAN_TINH_HUONG_MO);
    patches.push(dat(nc, id, 'aspects.ban_nga.pressure.tinhHuongMo', conCho));

    suKien.push({
      loai: 'di_hoa_ap_luc',
      mucDo: 'trong_dai',
      moTa: moTaTinhHuong(e.ten, ap.trucNang, ap.lech),
      tienTrinhId: 'divine_alienation',
      chuTheIds: [id],
      locationId: null,
      payload: { thanId: id, tinhHuongId: thId, truc: ap.trucNang, lech: lam(ap.distortion) },
    });
  }

  return { patches, suKien };
}

// ─────────────────────────────────────────── prayer_flow

/**
 * Lời cầu dâng lên và tắt đi.
 *
 * [BB] 22.2 — mỗi lời cầu sinh từ một bế tắc đo được. [BB] 22.3 — im lặng quá
 * hạn tính đúng như làm ngơ, kèm đủ hậu quả. Không có "lời cầu trang trí".
 */
export function chayCauNguyen(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];

  // ── sinh ──
  let daSinh = 0;
  const tran = Math.max(1, Math.floor(nc.tuning.worldProcess.maxEventsPerTick / 20));

  for (const { id } of moiNoiChon(nc.state)) {
    if (daSinh >= tran) break;
    for (const bt of quetBeTac(nc.state, id)) {
      if (daSinh >= tran) break;
      const r = sinhLoiCau(nc.state, bt, {
        tick: nc.tick,
        eventId: nc.eventId,
        rng: nc.rng.nhanh(`cau:${id}:${bt.ducVongThieu}`),
      });
      if (!r) continue;
      patches.push(r.patch);
      daSinh++;

      if (r.prayer.soNguoi >= 40) {
        suKien.push({
          loai: 'lan_song_cau_nguyen',
          mucDo: 'lon',
          moTa: `${r.prayer.soNguoi} người ở ${nc.state.entities.get(id)?.ten ?? id} cùng cầu một điều.`,
          tienTrinhId: 'prayer_flow',
          chuTheIds: r.prayer.thanNhanId ? [id, r.prayer.thanNhanId] : [id],
          locationId: id,
          payload: { prayerId: r.prayer.id, soNguoi: r.prayer.soNguoi },
        });
      }
    }
  }

  // ── quá hạn: im lặng cũng có giá ──
  for (const p of loiCauQuaHan(nc.state, nc.tick)) {
    const hq = HAU_QUA_TRA_LOI.lam_ngo;
    patches.push({
      op: 'set',
      target: { table: 'prayers', id: p.id, path: 'daTraLoi' },
      value: true,
      sourceEventId: nc.eventId,
    });
    patches.push({
      op: 'set',
      target: { table: 'prayers', id: p.id, path: 'cachTraLoi' },
      value: 'lam_ngo',
      sourceEventId: nc.eventId,
    });
    patches.push({
      op: 'set',
      target: { table: 'prayers', id: p.id, path: 'tickTraLoi' },
      value: nc.tick,
      sourceEventId: nc.eventId,
    });

    // Thất vọng đọng lại ở vùng, không ở một bộ đếm toàn cục.
    if (nc.state.entities.has(p.nguoiCauId)) {
      patches.push({
        op: 'add',
        target: { table: 'entities', id: p.nguoiCauId, path: 'aspects.van_hoa.giaoLyLech' },
        value: lam(hq.thatVong * 0.15),
        sourceEventId: nc.eventId,
      });
    }

    // Bỏ mặc đủ lâu thì tín đồ rời đi — đây là cái giá thật của `lam_ngo`.
    if (p.thanNhanId && nc.state.entities.has(p.thanNhanId) && p.soNguoi >= 20) {
      patches.push({
        op: 'add',
        target: { table: 'entities', id: p.thanNhanId, path: 'aspects.venerable.soTinDoUocLuong' },
        value: -Math.round(p.soNguoi * 0.25),
        sourceEventId: nc.eventId,
      });
      suKien.push({
        loai: 'tin_do_that_vong',
        mucDo: 'lon',
        moTa:
          `${p.soNguoi} người ở ${nc.state.entities.get(p.nguoiCauId)?.ten ?? p.nguoiCauId} ` +
          `chờ hết hạn mà không thấy trả lời. Một số thôi không cầu nữa.`,
        tienTrinhId: 'prayer_flow',
        chuTheIds: [p.thanNhanId, p.nguoiCauId],
        locationId: p.nguoiCauId,
        payload: { prayerId: p.id, soNguoi: p.soNguoi },
      });
    }
  }

  return { patches, suKien };
}

// ─────────────────────────────────────────── divine_agency

/**
 * Thần NPC sống khi người chơi vắng — cổng Phase 6.
 *
 * Ba việc, đúng thứ tự ưu tiên của một vị thần thật:
 *   1. đáp lại áp lực Dị Hóa đang treo (đây là chuyện của chính mình);
 *   2. trả lời lời cầu của tín đồ mình (đây là chuyện của người khác);
 *   3. rà lại vòng đời domain (đây là chuyện của cái mình sắp mất).
 *
 * [BB] 23.2 quy tắc 2 — mọi lựa chọn qua softmax, không lấy max.
 */
export function chayThanNpc(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];
  const nguoiChoi = nc.state.world.playerState.chuTheId;

  for (const { id, e } of moiThan(nc)) {
    // Thần người chơi đang nhập KHÔNG bị AI thay mặt quyết định.
    if (id === nguoiChoi) continue;

    const bn = docAspect<DivineIdentity>(e, 'ban_nga');
    const ven = docAspect<Venerable>(e, 'venerable');

    // ── 1. tình huống Dị Hóa đang treo ──
    const treo = bn?.pressure.tinhHuongMo.find((t) => t.daChon === null);
    if (treo && bn) {
      const rng = nc.rng.nhanh(`dap:${id}:${treo.id}`);
      // Thần NPC quyết định, và quyết định đó đi qua đúng cửa Event như người chơi.
      const idx = bn.pressure.tinhHuongMo.findIndex((t) => t.id === treo.id);
      const cach = chonCachDapNpc(bn, rng, nc.tuning.npc.nhietDoSoftmax);
      patches.push(dat(nc, id, `aspects.ban_nga.pressure.tinhHuongMo.${idx}.daChon`, cach));

      suKien.push({
        loai: `than_dap_di_hoa_${cach}`,
        mucDo: 'lon',
        moTa: `${e.ten} đã chọn cách sống với điều tín đồ tin về mình.`,
        tienTrinhId: 'divine_agency',
        chuTheIds: [id],
        locationId: null,
        payload: { thanId: id, tinhHuongId: treo.id, cach },
      });
      continue;
    }

    // ── 2. lời cầu ──
    const dsCau = loiCauCho(nc.state, id, nc.tick).slice(0, 3);
    if (dsCau.length > 0) {
      const cau = dsCau[0];
      if (cau) {
        const rng = nc.rng.nhanh(`traloi:${id}:${cau.id}`);
        const tuBi = bn?.currentManifestation.tuBi_tanNhan ?? 0;
        // Thần từ bi ban phước; thần tàn nhẫn trừng phạt; thần bận thì cho dấu hiệu.
        const diem = [40 - tuBi * 0.4, 25, 10 + tuBi * 0.35, 45, 20 + Math.abs(tuBi) * 0.1];
        const cach = (['ban_phuoc', 'lam_ngo', 'trung_phat', 'dau_hieu', 'tra_gia'] as const)[
          rng.softmax(diem, nc.tuning.npc.nhietDoSoftmax * 100)
        ];
        if (cach) {
          patches.push({
            op: 'set',
            target: { table: 'prayers', id: cau.id, path: 'daTraLoi' },
            value: true,
            sourceEventId: nc.eventId,
          });
          patches.push({
            op: 'set',
            target: { table: 'prayers', id: cau.id, path: 'cachTraLoi' },
            value: cach,
            sourceEventId: nc.eventId,
          });
          patches.push({
            op: 'set',
            target: { table: 'prayers', id: cau.id, path: 'tickTraLoi' },
            value: nc.tick,
            sourceEventId: nc.eventId,
          });
          if (cach === 'ban_phuoc' && nc.state.entities.has(cau.nguoiCauId)) {
            patches.push({
              op: 'set',
              target: { table: 'entities', id: cau.nguoiCauId, path: 'aspects.kinh_te.thieuHut' },
              value: 0,
              sourceEventId: nc.eventId,
            });
          }
          suKien.push({
            loai: `than_tra_loi_${cach}`,
            mucDo: cach === 'lam_ngo' ? 'thuong' : 'lon',
            moTa: `${e.ten} ${HAU_QUA_TRA_LOI[cach].nhan.toLowerCase()} lời cầu từ ${
              nc.state.entities.get(cau.nguoiCauId)?.ten ?? cau.nguoiCauId
            }.`,
            tienTrinhId: 'divine_agency',
            chuTheIds: [id, cau.nguoiCauId],
            locationId: cau.nguoiCauId,
            payload: { prayerId: cau.id, cach },
          });
        }
      }
    }

    // ── 3. việc dài hơi ──
    // [BB] 69.3 — "Utility AI của thần cũng dùng Intent/Project nên thần NPC tự
    // làm các việc này khi người chơi vắng mặt." Không có bước này thì thần NPC
    // phản ứng rất tốt và không bao giờ MUỐN gì quá một tick.
    patches.push(...duAnCuaThan(nc, id, e, suKien));

    // ── 4. vòng đời domain ──
    const rs = raSoatDomain(nc.state, id, { eventId: nc.eventId, tick: nc.tick });
    patches.push(...rs.patches);
    for (const d of rs.doi) {
      if (d.den !== 'lost' && d.den !== 'reclaimable' && d.den !== 'dormant') continue;
      suKien.push({
        loai: `domain_${d.den}`,
        mucDo: d.den === 'lost' ? 'trong_dai' : 'lon',
        moTa:
          d.den === 'lost'
            ? `${e.ten} mất hẳn domain "${d.domain}". Không còn ai, không còn vật, không còn dấu.`
            : `Domain "${d.domain}" của ${e.ten} đã nguội — nhưng vẫn còn đường quay lại.`,
        tienTrinhId: 'divine_agency',
        chuTheIds: [id],
        locationId: null,
        payload: { thanId: id, domain: d.domain, tu: d.tu, den: d.den },
      });
    }

    // Tín đồ ước lượng theo mật độ đền — không phải một con số tự tăng.
    if (ven) {
      const mat = Object.values(ven.matDoDen).reduce((t, x) => t + x, 0);
      if (mat <= 0 && ven.soTinDoUocLuong > 0) {
        patches.push(dat(nc, id, 'aspects.venerable.soTinDoUocLuong', 0));
      }
    }
  }

  return { patches, suKien };
}

/**
 * Mở, rà và đóng việc dài hơi của một vị thần NPC.
 *
 * Ba quy tắc giữ cho nó không phình thành một hệ thống riêng:
 *
 *   1. Nhiều nhất **hai** việc cùng lúc. Ba việc trở lên thì không có việc nào
 *      là việc chính, và bản tin sẽ đọc như một cái danh sách.
 *   2. Mở việc mới qua **softmax**, không lấy max (23.2 quy tắc 2) — nên hai vị
 *      thần cùng hoàn cảnh vẫn chọn khác nhau.
 *   3. Tiến độ đo TỪ THẾ GIỚI mỗi lần rà, không ai khai (68.3).
 */
function duAnCuaThan(nc: NgocCanhTienTrinh, id: string, e: Entity, suKien: UngVienSuKien[]): PatchOp[] {
  const patches: PatchOp[] = [];
  const hienCo = docAspect<DuAnAspect>(e, 'du_an')?.danhSach ?? [];

  // ── rà những việc tới hạn ──
  let daDoi = false;
  const sau = hienCo.map((p) => {
    if (p.nextTick > nc.tick || (p.status !== 'active' && p.status !== 'blocked')) return p;
    const moi = raSoatDuAnThan(nc.state, p, nc.tick);
    if (moi.status !== p.status || moi.nextTick !== p.nextTick) daDoi = true;
    if (moi.status === 'completed') {
      suKien.push({
        loai: 'than_xong_viec',
        mucDo: 'trong_dai',
        moTa: `${e.ten} làm xong điều đã theo đuổi bấy lâu: ${p.goal.toLowerCase()}.`,
        tienTrinhId: 'divine_agency',
        chuTheIds: [id, ...p.stakeholderIds],
        locationId: p.locationIds[0] ?? null,
        payload: { thanId: id, projectId: p.id },
      });
    }
    return moi;
  });

  // ── mở việc mới khi còn chỗ ──
  const conChay = sau.filter((p) => p.status === 'active' || p.status === 'blocked');
  if (conChay.length < 2) {
    const ung = ungVienDuAn(nc.state, id).filter(
      (u) => !sau.some((p) => p.status !== 'completed' && p.goal === u.goal),
    );
    if (ung.length > 0) {
      const rng = nc.rng.nhanh(`duan:${id}:${nc.tick}`);
      const chon =
        ung[
          rng.softmax(
            ung.map((u) => u.diem),
            nc.tuning.npc.nhietDoSoftmax * 100,
          )
        ];
      if (chon) {
        const pj = moDuAnThan(nc.state, id, chon, nc.tick);
        sau.push(pj);
        daDoi = true;
        suKien.push({
          loai: 'than_bat_dau_viec',
          mucDo: 'lon',
          moTa: `${e.ten} bắt đầu một việc dài: ${chon.goal.toLowerCase()}.`,
          tienTrinhId: 'divine_agency',
          chuTheIds: [id, ...chon.stakeholderIds],
          locationId: chon.locationIds[0] ?? null,
          payload: { thanId: id, projectId: pj.id, loai: chon.loai },
        });
      }
    }
  }

  // Giữ sáu việc gần nhất: việc đã xong vẫn là lịch sử, nhưng không giữ mãi.
  if (daDoi || sau.length !== hienCo.length) {
    patches.push(dat(nc, id, 'aspects.du_an.danhSach', sau.slice(-6)));
  }
  return patches;
}

/** Tách riêng để test được mà không cần dựng cả `NgocCanhTienTrinh`. */
function chonCachDapNpc(
  bn: DivineIdentity,
  rng: { softmax(d: readonly number[], t: number): number },
  nhietDo: number,
): 'chap_nhan' | 'chong_lai' | 'mac_ca' | 'phan_than' {
  const kieuNgao = bn.coreSelf.kieuNgao_khiemNhuong ?? 0;
  const tratTu = bn.coreSelf.tratTu_phongTung ?? 0;
  const ap = bn.pressure.distortion;
  const diem = [
    30 + kieuNgao * 0.3 - ap * 0.2,
    20 - kieuNgao * 0.35 + tratTu * 0.2,
    35 + Math.abs(tratTu) * 0.1,
    ap > 55 ? 25 + (ap - 55) * 0.5 : -20,
  ];
  const i = rng.softmax(diem, nhietDo * 100);
  return (['chap_nhan', 'chong_lai', 'mac_ca', 'phan_than'] as const)[i] ?? 'mac_ca';
}
