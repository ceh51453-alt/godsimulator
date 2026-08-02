/**
 * `institution_governance`, `culture_language_religion`, `conflict_security` — Phần 71.2.
 *
 * Ba tiến trình này sinh ra phần lớn thứ đáng nói trong một lượt chat: ai vừa lên
 * ngôi, tập tục nào vừa thành hình, làng nào vừa động binh.
 *
 * [BB] 67.6 — kết tinh đi từ dưới lên và DỪNG ở `culture`. Không mẫu hành vi đời
 * thường nào ở đây được leo lên thành định luật vũ trụ; đó là việc của Phần 10 và
 * phải có người quyết.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { KetQuaTienTrinh, NgocCanhTienTrinh, UngVienSuKien } from './types.js';
import { cong, dat, docAspect, kep, lam, langGieng, moiNoiChon, tongCohort, PHAN_KHO } from './tienIch.js';
import { TRAN_LAY_MOT_LAN } from './danSo.js';
import type { AnNinh, DanCu, KinhTe, TapTuc, VanHoa } from '../../schema/aspect/substrate.js';
import type { Institutional } from '../../schema/aspect/living.js';

// ─────────────────────────────────────────── institution_governance

/** Thiết chế còn sống, đã sắp xếp deterministic. */
function moiThietChe(nc: NgocCanhTienTrinh): { id: string; ins: Institutional; ten: string }[] {
  const ra: { id: string; ins: Institutional; ten: string }[] = [];
  for (const id of [...nc.state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const e = nc.state.entities.get(id);
    if (!e || e.tickDiet !== null) continue;
    const ins = docAspect<Institutional>(e, 'institutional');
    if (!ins) continue;
    ra.push({ id, ins, ten: e.ten });
  }
  return ra;
}

export function chayThietChe(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];

  for (const { id, ins, ten } of moiThietChe(nc)) {
    // ── thu thuế: CHUYỂN lương thực, không tạo ra nó ──
    let thu = 0;
    for (const vungId of [...ins.vungCaiTriIds].sort((a, b) => (a < b ? -1 : 1))) {
      const eV = nc.state.entities.get(vungId);
      const kt = docAspect<KinhTe>(eV, 'kinh_te');
      if (!kt || kt.kho.luongThuc <= 0) continue;
      // Không vét kho của dân đang đói — thiết chế nào làm thế cũng sập.
      // Trần 40%: thuế có thể rơi vào cùng giai đoạn với trao đổi, và hai bên
      // cùng tính phần mình từ một ảnh chụp thì tổng phải còn dưới 100%.
      const co = kt.kho.luongThuc * (1 - kep(kt.thieuHut, 0, 1));
      const lay = lam(
        Math.max(0, Math.min(co * ins.thueSuat * nc.soBuocGop, kt.kho.luongThuc * PHAN_KHO.thue)),
      );
      if (lay <= 0) continue;
      patches.push(cong(nc, vungId, 'aspects.kinh_te.kho.luongThuc', -lay));
      thu += lay;
    }
    if (thu > 0) patches.push(cong(nc, id, 'aspects.institutional.khoCong.luongThuc', lam(thu)));

    // ── ổn định: đói và thuế nặng kéo xuống, kho công đầy kéo lên ──
    let apLuc = 0;
    let soVung = 0;
    for (const vungId of ins.vungCaiTriIds) {
      const kt = docAspect<KinhTe>(nc.state.entities.get(vungId), 'kinh_te');
      if (!kt) continue;
      apLuc += kep(kt.thieuHut, 0, 1);
      soVung++;
    }
    const doiTb = soVung > 0 ? apLuc / soVung : 0;
    const dOn = (-doiTb * 6 - ins.thueSuat * 10 + (thu > 0 ? 1 : -0.5)) * nc.soBuocGop;
    const onMoi = kep(ins.onDinh + dOn, 0, 100);
    if (lam(onMoi) !== lam(ins.onDinh)) patches.push(dat(nc, id, 'aspects.institutional.onDinh', lam(onMoi)));

    if (onMoi < 20 && ins.onDinh >= 20) {
      suKien.push({
        loai: 'bien_loan',
        mucDo: 'trong_dai',
        moTa: `${ten} không còn giữ nổi trật tự. Người ta bắt đầu không nghe nữa.`,
        tienTrinhId: 'institution_governance',
        chuTheIds: [id, ...ins.vungCaiTriIds],
        locationId: ins.vungCaiTriIds[0] ?? null,
        payload: { onDinh: lam(onMoi) },
      });
    }

    // ── kế vị: chức trống hoặc hết nhiệm kỳ ──
    if (ins.keVi === 'khong_co' || ins.chucVu.length === 0) continue;
    const chucMoi = ins.chucVu.map((c) => ({ ...c }));
    let doiNguoi = false;

    for (const c of chucMoi) {
      const nguoi = c.nguoiGiuId ? nc.state.entities.get(c.nguoiGiuId) : undefined;
      const trong = c.nguoiGiuId === null || nguoi === undefined || nguoi.tickDiet !== null;
      const hetHan = c.tickHetNhiemKy !== null && nc.tick >= c.tickHetNhiemKy;
      if (!trong && !hetHan) continue;

      // [BB] Kế vị theo QUY TẮC đã khai, không theo ý muốn của engine.
      const ungVien = ins.thanhVienIds
        .filter((mid) => {
          const m = nc.state.entities.get(mid);
          return m !== undefined && m.tickDiet === null && mid !== c.nguoiGiuId;
        })
        .sort((a, b) => (a < b ? -1 : 1));

      const chon =
        ins.keVi === 'bau_cu'
          ? ungVien[nc.rng.nhanh(`bau:${id}:${c.id}`).nguyen(Math.max(1, ungVien.length))]
          : ungVien[0];

      c.nguoiGiuId = chon ?? null;
      c.tickNhamChuc = nc.tick;
      c.tickHetNhiemKy = ins.keVi === 'bau_cu' ? nc.tick + 40 : null;
      doiNguoi = true;

      suKien.push({
        loai: chon ? 'ke_vi' : 'chuc_trong',
        mucDo: 'lon',
        moTa: chon
          ? `${nc.state.entities.get(chon)?.ten ?? chon} nhận chức ${c.ten} của ${ten}.`
          : `Chức ${c.ten} của ${ten} bỏ trống — không còn ai đủ tư cách.`,
        tienTrinhId: 'institution_governance',
        chuTheIds: [id, ...(chon ? [chon] : [])],
        locationId: ins.vungCaiTriIds[0] ?? null,
        payload: { chucVuId: c.id, keVi: ins.keVi },
      });
    }
    if (doiNguoi) patches.push(dat(nc, id, 'aspects.institutional.chucVu', chucMoi));
  }

  return { patches, suKien };
}

// ─────────────────────────────────────────── culture_language_religion

/** Mẫu hành vi đủ điều kiện đóng băng thành tập tục. */
const MAU_TAP_TUC: readonly { id: string; ten: string; dieuKien: (kt: KinhTe, an: AnNinh) => boolean }[] = [
  { id: 'le_mua_gat', ten: 'Lễ mùa gặt', dieuKien: (kt) => kt.thieuHut <= 0.02 && kt.kho.luongThuc > 40 },
  { id: 'tuc_chia_kho', ten: 'Tục chia kho', dieuKien: (kt) => kt.thieuHut > 0.3 && kt.kho.luongThuc > 0 },
  { id: 'le_canh_dem', ten: 'Lệ canh đêm', dieuKien: (_kt, an) => an.deDoa >= 40 },
];

export function chayVanHoa(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];
  const n = nc.soBuocGop;

  for (const { id, e } of moiNoiChon(nc.state)) {
    const vh = docAspect<VanHoa>(e, 'van_hoa');
    const kt = docAspect<KinhTe>(e, 'kinh_te');
    const an = docAspect<AnNinh>(e, 'an_ninh');
    const dc = docAspect<DanCu>(e, 'dan_cu');
    if (!vh || !kt || !an || !dc) continue;
    if (tongCohort(dc.cohort) <= 0) continue;

    // ── ngôn ngữ trôi: [BB] 10.1 tầng 2 BẮT BUỘC sai ──
    const troi = kep(vh.doLechNgonNgu + 0.008 * n, 0, 1);
    if (lam(troi) !== lam(vh.doLechNgonNgu)) {
      patches.push(dat(nc, id, 'aspects.van_hoa.doLechNgonNgu', lam(troi)));
    }

    const lech = kep(vh.giaoLyLech + nc.tuning.luat.doLechDienGiaiMoiTheHe * 0.25 * n, 0, 100);
    if (lam(lech) !== lam(vh.giaoLyLech)) {
      patches.push(dat(nc, id, 'aspects.van_hoa.giaoLyLech', lam(lech)));
    }

    // ── kết tinh tập tục: đếm số lần lặp, KHÔNG nhảy cấp ──
    const tapTuc: TapTuc[] = vh.tapTuc.map((t) => ({ ...t }));
    let doi = false;
    const nguong = nc.tuning.luat.lanThuHinhThucHoa;

    for (const mau of MAU_TAP_TUC) {
      const dat_ = mau.dieuKien(kt, an);
      const co = tapTuc.find((t) => t.id === mau.id);

      if (dat_ && !co) {
        tapTuc.push({
          id: mau.id,
          ten: mau.ten,
          doBenVung: 0,
          soLanLap: 1,
          tickSinh: nc.tick,
          nguonEventIds: [nc.eventId],
        });
        doi = true;
        continue;
      }
      if (!co) continue;

      if (dat_) {
        co.soLanLap += 1;
        // [BB] 67.6 — chỉ khi lặp đủ `lanThuHinhThucHoa` mới thành thật.
        if (co.soLanLap >= nguong && co.doBenVung < 30) {
          co.doBenVung = 30;
          suKien.push({
            loai: 'tap_tuc_thanh_hinh',
            mucDo: 'lon',
            moTa: `Ở ${e.ten}, "${co.ten}" đã lặp ${co.soLanLap} lần và thành lệ. Không ai nhớ ai bắt đầu.`,
            tienTrinhId: 'culture_language_religion',
            chuTheIds: [id],
            locationId: id,
            payload: { tapTucId: co.id, soLanLap: co.soLanLap },
          });
        } else {
          co.doBenVung = kep(co.doBenVung + 2 * n, 0, 100);
        }
      } else {
        co.doBenVung = kep(co.doBenVung - 1.5 * n, 0, 100);
      }
      doi = true;
    }

    const conLai = tapTuc.filter((t) => t.doBenVung > 0 || t.soLanLap < nguong);
    for (const mat of tapTuc.filter((t) => !conLai.includes(t))) {
      suKien.push({
        loai: 'tap_tuc_mai_mot',
        mucDo: 'lon',
        moTa: `Ở ${e.ten}, "${mat.ten}" không còn ai giữ.`,
        tienTrinhId: 'culture_language_religion',
        chuTheIds: [id],
        locationId: id,
        payload: { tapTucId: mat.id },
      });
      doi = true;
    }

    if (doi) patches.push(dat(nc, id, 'aspects.van_hoa.tapTuc', conLai));
  }

  return { patches, suKien };
}

// ─────────────────────────────────────────── conflict_security

/** Trần thương vong một lần chạy — cùng lý do với `TRAN_LAY_MOT_LAN` ở dân số. */
const TRAN_THUONG_VONG = 0.15;

export function chayXungDot(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];
  const n = nc.soBuocGop;

  for (const { id, e } of moiNoiChon(nc.state)) {
    const an = docAspect<AnNinh>(e, 'an_ninh');
    const kt = docAspect<KinhTe>(e, 'kinh_te');
    const dc = docAspect<DanCu>(e, 'dan_cu');
    if (!an || !kt || !dc) continue;

    const dan = tongCohort(dc.cohort);
    const dangDanh = an.xungDot.filter((x) => x.tickKetThuc === null);

    // ── đe dọa: đói ở đây và đói ở hàng xóm đều đẩy nó lên ──
    let doiQuanh = 0;
    const hangXom = langGieng(nc.state, id);
    for (const lg of hangXom) {
      const ktb = docAspect<KinhTe>(nc.state.entities.get(lg.noiId), 'kinh_te');
      doiQuanh = Math.max(doiQuanh, kep(ktb?.thieuHut ?? 0, 0, 1));
    }
    const coHoaUoc = an.hoaUoc.some((h) => h.tickHetHan === null || h.tickHetHan > nc.tick);
    const dDe = (doiQuanh * 4 + kep(kt.thieuHut, 0, 1) * 3 - (coHoaUoc ? 4 : 0) - 1.5) * n;
    const deMoi = kep(an.deDoa + dDe, 0, 100);
    if (lam(deMoi) !== lam(an.deDoa)) patches.push(dat(nc, id, 'aspects.an_ninh.deDoa', lam(deMoi)));

    // ── nổ ra ──
    if (deMoi >= 60 && dangDanh.length === 0 && !coHoaUoc && dan > 30) {
      const dich = hangXom
        .map((lg) => {
          const ktb = docAspect<KinhTe>(nc.state.entities.get(lg.noiId), 'kinh_te');
          const dcb = docAspect<DanCu>(nc.state.entities.get(lg.noiId), 'dan_cu');
          return { ...lg, kho: ktb?.kho.luongThuc ?? 0, dan: tongCohort(dcb?.cohort) };
        })
        .filter((lg) => lg.dan > 0)
        .sort((a, b) => (a.kho !== b.kho ? b.kho - a.kho : a.noiId < b.noiId ? -1 : 1));

      const muc = dich[0];
      if (muc) {
        const xId = `xd_${nc.tick}_${id}`;
        patches.push({
          op: 'push',
          target: { table: 'entities', id, path: 'aspects.an_ninh.xungDot' },
          value: {
            id: xId,
            doiThuId: muc.noiId,
            cuongDo: 40,
            nguyenNhan: 'Kho bên kia còn thóc, bên này thì không.',
            tickBatDau: nc.tick,
            tickKetThuc: null,
          },
          sourceEventId: nc.eventId,
        });
        suKien.push({
          loai: 'xung_dot_bung_no',
          mucDo: 'trong_dai',
          moTa: `${e.ten} kéo sang ${nc.state.entities.get(muc.noiId)?.ten ?? muc.noiId}. Lý do người ta nói ra là đất; lý do thật là kho thóc.`,
          tienTrinhId: 'conflict_security',
          chuTheIds: [id, muc.noiId],
          locationId: id,
          payload: { xungDotId: xId, doiThuId: muc.noiId },
        });
      }
      continue;
    }

    // ── đang đánh: thương vong TRỪ THẲNG vào dân, không phải vào một thanh máu ──
    if (dangDanh.length === 0) continue;

    const xungDotMoi = an.xungDot.map((x) => ({ ...x }));
    let thuongVong = 0;

    for (const x of xungDotMoi) {
      if (x.tickKetThuc !== null) continue;
      const mat = Math.min(
        Math.floor((dan * x.cuongDo * 0.0015 + 1) * n),
        Math.floor(dan * TRAN_THUONG_VONG),
      );
      thuongVong += Math.max(0, mat);

      // Đánh lâu thì mệt; không có bên nào đánh mãi.
      x.cuongDo = kep(x.cuongDo - 6 * n, 0, 100);
      if (x.cuongDo <= 0 || dan <= 10) {
        x.tickKetThuc = nc.tick;
        patches.push({
          op: 'push',
          target: { table: 'entities', id, path: 'aspects.an_ninh.hoaUoc' },
          value: {
            id: `hu_${nc.tick}_${id}`,
            voiId: x.doiThuId,
            tickKy: nc.tick,
            tickHetHan: nc.tick + 60,
            dieuKhoan: 'Hai bên không ai còn người để đưa ra đồng.',
          },
          sourceEventId: nc.eventId,
        });
        suKien.push({
          loai: 'hoa_uoc',
          mucDo: 'trong_dai',
          moTa: `${e.ten} và ${nc.state.entities.get(x.doiThuId)?.ten ?? x.doiThuId} ngừng đánh nhau.`,
          tienTrinhId: 'conflict_security',
          chuTheIds: [id, x.doiThuId],
          locationId: id,
          payload: { xungDotId: x.id },
        });
      }
    }

    patches.push(dat(nc, id, 'aspects.an_ninh.xungDot', xungDotMoi));

    if (thuongVong > 0) {
      // Người chết trong chiến trận chủ yếu là thanh niên và người lớn.
      const c = dc.cohort;
      const tuAdult = Math.min(Math.floor(c.adult * TRAN_LAY_MOT_LAN), Math.ceil(thuongVong * 0.6));
      const tuYouth = Math.min(Math.floor(c.youth * TRAN_LAY_MOT_LAN), thuongVong - tuAdult);
      const that = tuAdult + tuYouth;
      if (that > 0) {
        if (tuAdult > 0) patches.push(cong(nc, id, 'aspects.dan_cu.cohort.adult', -tuAdult));
        if (tuYouth > 0) patches.push(cong(nc, id, 'aspects.dan_cu.cohort.youth', -tuYouth));
        // [BB] Cùng một delta trên `spatial.danSo`, nếu không hai con số sẽ trôi.
        patches.push(cong(nc, id, 'aspects.spatial.danSo', -that));
        patches.push(dat(nc, id, 'aspects.an_ninh.thuongVongKy', that));
      }
    } else if (an.thuongVongKy !== 0) {
      patches.push(dat(nc, id, 'aspects.an_ninh.thuongVongKy', 0));
    }
  }

  return { patches, suKien };
}
