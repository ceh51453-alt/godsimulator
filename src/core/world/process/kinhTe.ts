/**
 * `production_consumption`, `exchange_debt`, `settlement_infrastructure` — Phần 71.2.
 *
 * Ba tiến trình này tồn tại để trả lời một câu hỏi rất cụ thể khi người chơi quay
 * lại bàn nói chuyện: *vì sao bây giờ giá bình gốm lại đắt thế?* Con số ở đây
 * không phải để người chơi đọc — nó để lời kể có chỗ bám.
 *
 * [BB] Vật chất không tự sinh (44.3 `bao_toan_vat_chat`). Gỗ vào kho phải rời rừng;
 * hàng vào vùng này phải rời vùng kia. Scheduler cưỡng chế bằng khai báo `baoToan`.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { KetQuaTienTrinh, NgocCanhTienTrinh, UngVienSuKien } from './types.js';
import {
  cong,
  dat,
  docAspect,
  kep,
  laoDong,
  lam,
  langGieng,
  moiNoiChon,
  taoBanGhi,
  tongCohort,
  PHAN_KHO,
} from './tienIch.js';
import { gopTyLe } from './moiTruong.js';
import { KHAU_PHAN } from './danSo.js';
import { HE_SO_MUA } from '../../schema/aspect/substrate.js';
import type { DanCu, KinhTe, SinhThai, Duong } from '../../schema/aspect/substrate.js';
import { DebtRowSchema } from '../../schema/soSach.js';

/** Một người làm ruộng một mùa ra chừng này lương thực khi đất còn tốt. */
const NANG_SUAT = 2.2;
/** Mỗi đơn vị `dat` nuôi được chừng này lương thực mỗi mùa — trần Malthus. */
const TRAN_THEO_DAT = 0.08;
/** Thóc để lâu thì hỏng. Đây là lý do không ai tích trữ vô hạn. */
const TY_LE_HAO = 0.05;

// ─────────────────────────────────────────── production_consumption

export function chaySanXuat(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];

  for (const { id, e } of moiNoiChon(nc.state)) {
    const dc = docAspect<DanCu>(e, 'dan_cu');
    const kt = docAspect<KinhTe>(e, 'kinh_te');
    const st = docAspect<SinhThai>(e, 'sinh_thai');
    if (!dc || !kt || !st) continue;

    const dan = tongCohort(dc.cohort);
    const lao = laoDong(dc.cohort);
    const n = nc.soBuocGop;

    if (dan <= 0) {
      // Không còn ai thì không còn gì được làm; kho vẫn mục theo thời gian.
      const hao = lam(kt.kho.luongThuc * gopTyLe(TY_LE_HAO, n));
      if (hao > 0) {
        patches.push(cong(nc, id, 'aspects.kinh_te.kho.luongThuc', -hao));
        patches.push(
          dat(nc, id, 'aspects.kinh_te.soCai', { sanXuat: 0, tieuThu: 0, nhap: 0, xuat: 0, hao, thue: 0 }),
        );
      }
      continue;
    }

    // ── trồng trọt: bị chặn bởi CẢ lao động LẪN đất ──
    const tuLao = lao * NANG_SUAT * HE_SO_MUA[nc.mua] * (1 + kt.kyThuat / 100) * n;
    const tuDat = st.taiNguyen.dat * TRAN_THEO_DAT * n;
    const trongTrot = Math.max(0, Math.min(tuLao, tuDat));

    // ── săn và đánh cá: RÚT thẳng khỏi sinh thái ──
    const muonThu = lao * 0.12 * n;
    const layThu = Math.min(Math.max(0, st.taiNguyen.thu), muonThu);
    const muonCa = lao * 0.12 * n;
    const layCa = Math.min(Math.max(0, st.taiNguyen.ca), muonCa);

    const sanXuat = lam(trongTrot + layThu + layCa);

    // ── gỗ: mỗi đơn vị vào kho phải rời rừng đúng một đơn vị (khai `baoToan`) ──
    const muonGo = lao * 0.2 * n;
    const layGo = lam(Math.min(Math.max(0, st.taiNguyen.rung), muonGo));

    // ── ăn ──
    // [BB] Không ăn hết kho trong một mùa: `PHAN_KHO.an` chừa lại thóc giống,
    // và chừa chỗ cho trao đổi với thuế cùng rút từ ảnh chụp này.
    const can = dan * KHAU_PHAN * n;
    const co = kt.kho.luongThuc + sanXuat;
    const duocDung = sanXuat + Math.max(0, kt.kho.luongThuc) * PHAN_KHO.an;
    const an = lam(Math.min(duocDung, can));
    const hao = lam(Math.max(0, co - an) * gopTyLe(TY_LE_HAO, n));

    const dKho = lam(sanXuat - an - hao);
    if (dKho !== 0) patches.push(cong(nc, id, 'aspects.kinh_te.kho.luongThuc', dKho));
    if (layGo > 0) {
      patches.push(cong(nc, id, 'aspects.kinh_te.kho.vatLieu', layGo));
      patches.push(cong(nc, id, 'aspects.sinh_thai.taiNguyen.rung', -layGo));
    }
    if (layThu > 0) patches.push(cong(nc, id, 'aspects.sinh_thai.taiNguyen.thu', -lam(layThu)));
    if (layCa > 0) patches.push(cong(nc, id, 'aspects.sinh_thai.taiNguyen.ca', -lam(layCa)));

    // Cày quá tay thì đất bạc màu — vòng phản hồi khiến tăng trưởng không vô hạn.
    if (tuLao > tuDat && tuDat > 0) {
      const ep = kep((tuLao - tuDat) / Math.max(1, tuDat), 0, 1);
      patches.push(cong(nc, id, 'aspects.sinh_thai.suyThoai', lam(ep * 0.01 * n)));
    }

    const thieuHut = can > 0 ? kep(1 - an / can, 0, 1) : 0;
    patches.push(dat(nc, id, 'aspects.kinh_te.thieuHut', lam(thieuHut)));
    patches.push(dat(nc, id, 'aspects.kinh_te.sanLuong', { luongThuc: sanXuat, vatLieu: layGo }));
    patches.push(dat(nc, id, 'aspects.kinh_te.tieuThu', { luongThuc: an, vatLieu: 0 }));
    patches.push(
      dat(nc, id, 'aspects.kinh_te.soCai', {
        sanXuat,
        tieuThu: an,
        nhap: 0,
        xuat: 0,
        hao,
        thue: 0,
      }),
    );

    if (thieuHut >= 0.4 && kep(kt.thieuHut, 0, 1) < 0.4) {
      suKien.push({
        loai: 'nan_doi',
        mucDo: thieuHut >= 0.7 ? 'trong_dai' : 'lon',
        moTa: `${e.ten} không đủ ăn: thiếu ${Math.round(thieuHut * 100)}% khẩu phần mùa này.`,
        tienTrinhId: 'production_consumption',
        chuTheIds: [id],
        locationId: id,
        payload: { thieuHut: lam(thieuHut), dan },
      });
    }
  }

  return { patches, suKien };
}

// ─────────────────────────────────────────── exchange_debt

/** Chênh lệch kho dưới ngưỡng này thì không bõ công chở đi. */
const NGUONG_CHO = 20;

export function chayTraoDoi(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];

  /** Tổng thay đổi kho theo vùng — phát một patch mỗi vùng để tổng luôn khớp 0. */
  const dLuongThuc = new Map<string, number>();
  const dVatLieu = new Map<string, number>();
  const themVao = (m: Map<string, number>, id: string, x: number): void => {
    m.set(id, (m.get(id) ?? 0) + x);
  };

  const daXet = new Set<string>();
  /** Chuyến hàng đã đi qua từng tuyến — thương đoàn cũng là người đi đường. */
  const luuLuong = new Map<string, number>();

  for (const { id, e } of moiNoiChon(nc.state)) {
    const ktA = docAspect<KinhTe>(e, 'kinh_te');
    if (!ktA) continue;

    for (const lg of langGieng(nc.state, id)) {
      const khoaCap = id < lg.noiId ? `${id}|${lg.noiId}` : `${lg.noiId}|${id}`;
      if (daXet.has(khoaCap)) continue;
      daXet.add(khoaCap);

      const eB = nc.state.entities.get(lg.noiId);
      const ktB = docAspect<KinhTe>(eB, 'kinh_te');
      const duong = docAspect<Duong>(nc.state.entities.get(lg.duongId), 'duong');
      if (!ktB || !eB || !duong) continue;

      // Sức chở của tuyến: đường xấu chở ít, đường xa chở ít.
      const sucCho = (5 + duong.chatLuong * 0.4) / lg.doTre;

      for (const [hang, ban] of [
        ['luongThuc', dLuongThuc],
        ['vatLieu', dVatLieu],
      ] as const) {
        const a = ktA.kho[hang] + (ban.get(id) ?? 0);
        const b = ktB.kho[hang] + (ban.get(lg.noiId) ?? 0);
        const chenh = a - b;
        if (Math.abs(chenh) < NGUONG_CHO) continue;

        const tuId = chenh > 0 ? id : lg.noiId;
        const denId = chenh > 0 ? lg.noiId : id;
        const co = Math.max(0, chenh > 0 ? a : b);
        // Không chở quá số đang có, không chở tới mức đảo chiều, và không vét kho.
        const luong = lam(Math.min(sucCho * nc.soBuocGop, Math.abs(chenh) * 0.35, co * PHAN_KHO.traoDoi));
        if (luong <= 0) continue;

        themVao(ban, tuId, -luong);
        themVao(ban, denId, luong);
        luuLuong.set(lg.duongId, (luuLuong.get(lg.duongId) ?? 0) + 1);

        // ── trả bằng gì? Không đủ vật liệu đối ứng thì thành nợ (71.2) ──
        const ktDen = denId === id ? ktA : ktB;
        const traDuoc = Math.max(0, ktDen.kho.vatLieu + (dVatLieu.get(denId) ?? 0));
        if (hang === 'luongThuc' && traDuoc < luong * 0.5) {
          const thieu = lam(luong * 0.5 - traDuoc);
          const noId = `no_${nc.tick}_${tuId}_${denId}`;
          if (!nc.state.debts.has(noId)) {
            patches.push(
              taoBanGhi(
                nc,
                'debts',
                noId,
                DebtRowSchema.parse({
                  branchId: nc.state.world.branchId,
                  id: noId,
                  creditorId: tuId,
                  debtorId: denId,
                  commodityId: 'vat_lieu',
                  amount: thieu,
                  dueTick: nc.tick + 8,
                  terms: 'Trả bằng vật liệu trong hai năm.',
                  status: 'open',
                  tickTao: nc.tick,
                  nguonEventId: nc.eventId,
                }),
              ),
            );
          }
        }
      }
    }
  }

  // ── nợ tới hạn ──
  for (const noId of [...nc.state.debts.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const no = nc.state.debts.get(noId);
    if (!no || no.status !== 'open') continue;
    if (no.dueTick === null || nc.tick < no.dueTick) continue;

    const eNo = nc.state.entities.get(no.debtorId);
    const ktNo = docAspect<KinhTe>(eNo, 'kinh_te');
    const coTra = Math.max(0, (ktNo?.kho.vatLieu ?? 0) + (dVatLieu.get(no.debtorId) ?? 0)) * PHAN_KHO.traoDoi;

    if (coTra >= no.amount && nc.state.entities.has(no.creditorId)) {
      themVao(dVatLieu, no.debtorId, -no.amount);
      themVao(dVatLieu, no.creditorId, no.amount);
      patches.push({
        op: 'set',
        target: { table: 'debts', id: noId, path: 'status' },
        value: 'paid',
        sourceEventId: nc.eventId,
      });
    } else {
      patches.push({
        op: 'set',
        target: { table: 'debts', id: noId, path: 'status' },
        value: 'defaulted',
        sourceEventId: nc.eventId,
      });
      // Quỵt nợ không phải chuyện sổ sách — nó là mầm của xung đột.
      patches.push(cong(nc, no.creditorId, 'aspects.an_ninh.deDoa', 8));
      suKien.push({
        loai: 'vo_no',
        mucDo: 'lon',
        moTa: `${nc.state.entities.get(no.debtorId)?.ten ?? no.debtorId} không trả nổi món nợ với ${
          nc.state.entities.get(no.creditorId)?.ten ?? no.creditorId
        }.`,
        tienTrinhId: 'exchange_debt',
        chuTheIds: [no.creditorId, no.debtorId],
        locationId: no.debtorId,
        payload: { noId, amount: no.amount },
      });
    }
  }

  // ── phát patch: một `add` mỗi vùng mỗi mặt hàng, tổng đúng 0 ──
  for (const [ban, path] of [
    [dLuongThuc, 'aspects.kinh_te.kho.luongThuc'],
    [dVatLieu, 'aspects.kinh_te.kho.vatLieu'],
  ] as const) {
    for (const id of [...ban.keys()].sort((a, b) => (a < b ? -1 : 1))) {
      const x = lam(ban.get(id) ?? 0);
      if (x === 0) continue;
      patches.push(cong(nc, id, path, x));
    }
  }

  for (const duongId of [...luuLuong.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    patches.push(cong(nc, duongId, 'aspects.duong.luuLuong', luuLuong.get(duongId) ?? 0));
  }

  // ── giá: khan hiếm đẩy lên, thừa mứa kéo xuống ──
  for (const { id, e } of moiNoiChon(nc.state)) {
    const kt = docAspect<KinhTe>(e, 'kinh_te');
    if (!kt) continue;
    const giaMoi = lam(kep(0.5 + kt.thieuHut * 3, 0.2, 5));
    if (giaMoi !== lam(kt.gia.luongThuc)) {
      patches.push(dat(nc, id, 'aspects.kinh_te.gia.luongThuc', giaMoi));
    }
  }

  return { patches, suKien };
}

// ─────────────────────────────────────────── settlement_infrastructure

export function chayDinhCu(nc: NgocCanhTienTrinh): KetQuaTienTrinh {
  const patches: PatchOp[] = [];
  const suKien: UngVienSuKien[] = [];
  const n = nc.soBuocGop;

  for (const { id, e } of moiNoiChon(nc.state)) {
    const dc = docAspect<DanCu>(e, 'dan_cu');
    const kt = docAspect<KinhTe>(e, 'kinh_te');
    if (!dc || !kt) continue;

    const dan = tongCohort(dc.cohort);
    const canNha = Math.ceil(dan / Math.max(1, dc.nguoiMoiHo));

    // ── xây: chỉ khi có dư vật liệu THẬT trong kho ──
    let dungVatLieu = 0;
    if (kt.haTang.nha < canNha) {
      const thieu = canNha - kt.haTang.nha;
      const duocXay = Math.min(thieu, Math.floor(kt.kho.vatLieu / 6), Math.ceil(dan / 40) * n);
      if (duocXay > 0) {
        dungVatLieu += duocXay * 6;
        patches.push(cong(nc, id, 'aspects.kinh_te.haTang.nha', duocXay));
      }
    }

    // ── hỏng: không sửa thì mục ──
    const mucNha = lam(kt.haTang.nha * gopTyLe(0.01, n));
    if (mucNha > 0) patches.push(cong(nc, id, 'aspects.kinh_te.haTang.nha', -mucNha));

    if (dungVatLieu > 0) {
      // Vật liệu bị TIÊU vào công trình — đây là hủy có nguồn, ghi ở sổ cái.
      patches.push(cong(nc, id, 'aspects.kinh_te.kho.vatLieu', -lam(dungVatLieu)));
    }

    if (dan === 0 && kt.haTang.nha > 0) {
      suKien.push({
        loai: 'lang_bo_hoang',
        mucDo: 'lon',
        moTa: `Nhà ở ${e.ten} vẫn còn nguyên, chỉ là không còn ai bước ra cửa.`,
        tienTrinhId: 'settlement_infrastructure',
        chuTheIds: [id],
        locationId: id,
        payload: { nha: lam(kt.haTang.nha) },
      });
    }
  }

  // ── đường: có người đi thì tốt lên, bỏ hoang thì lấp ──
  for (const id of [...nc.state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
    const e = nc.state.entities.get(id);
    if (!e || e.kind !== 'route' || e.tickDiet !== null) continue;
    const d = docAspect<Duong>(e, 'duong');
    if (!d) continue;

    const dungNhieu = d.luuLuong > 0;
    const dChat = dungNhieu ? 0.6 * n : -0.9 * n;
    const moi = kep(d.chatLuong + dChat, 0, 100);
    if (lam(moi) !== lam(d.chatLuong)) patches.push(dat(nc, id, 'aspects.duong.chatLuong', lam(moi)));

    if (moi <= 0 && d.thongSuot) {
      patches.push(dat(nc, id, 'aspects.duong.thongSuot', false));
      patches.push(dat(nc, id, 'aspects.duong.lyDoChan', 'Cỏ đã mọc kín; không còn ai nhớ lối.'));
      suKien.push({
        loai: 'duong_mat_dau',
        mucDo: 'lon',
        moTa: `Con đường ${e.ten} không còn đi được. Hai đầu của nó từ nay là hai thế giới.`,
        tienTrinhId: 'settlement_infrastructure',
        chuTheIds: [id, d.tuId, d.denId],
        locationId: d.tuId,
        payload: { duongId: id },
      });
    }
    // Lưu lượng nguội dần thay vì bị đặt lại về 0.
    // [BB] Phải là `add`: `set` ở đây sẽ đè lên `add` của người đưa tin và của
    // thương đoàn trong cùng giai đoạn, và con đường đông đúc nhất thế giới sẽ
    // vĩnh viễn hiện ra là không ai đi.
    if (d.luuLuong > 0) patches.push(cong(nc, id, 'aspects.duong.luuLuong', -lam(d.luuLuong * 0.5)));
  }

  return { patches, suKien };
}
