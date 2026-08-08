/**
 * Sảnh Thiên Diễn — Phần 37.3, bố cục ba cột của `KhungSanh`.
 *
 * Phase 6 nâng màn này từ "UI thô để chứng minh engine chạy" lên **mặt chơi của
 * tầng Thần**: Bảng Lãnh Địa (56.4), thẻ lời cầu (22.4), tình huống Dị Hóa (69.1)
 * và mười kênh can thiệp (69.2) đều thao tác được từ đây.
 *
 * [BB] 36.1 — không emoji, không thư viện icon. Mọi ký hiệu là SVG vẽ tay.
 * [BB] Luật bất biến #9 — không thao tác nào chỉ dựa vào màu: mỗi dấu hiệu màu
 * đều đi kèm chữ.
 * [BB] Luật bất biến #5 — màn này không ghi World; nó chỉ gọi action của store.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useGame } from '../../store/game.js';
import type { ViewMode } from '../../core/contracts/primitives.js';
import type { CanonDiff } from '../../core/world/hienDien.js';
import { StartingPresenceDraftSchema } from '../../core/schema/player.js';
import { KhungSanh, ChipHanhDong } from './KhungSanh.js';
import { useAi } from '../../store/ai.js';
import { NHAN_TRANG_THAI_CONG } from '../../core/ai/cong.js';
import type { MucRail } from './KhungSanh.js';
import { Icon } from '../design/Icon.js';
import { BangThanDien } from '../panels/BangThanDien.js';
import { SoTayPanel } from '../panels/SoTay.js';
import { tinhBangThanDien } from '../../core/than/thanDien.js';
import type { DuLieuThanDien } from '../../core/than/thanDien.js';
import { KhungCauNguyen } from '../panels/TheCauNguyen.js';
import { PanelOngKinh } from '../panels/OngKinh.js';
import { KENH_DUNG_SAN } from '../../core/than/kenh.js';
import { useUi } from '../../store/ui.js';
import { tinhBangThienDien, thanhThienTuong } from '../../core/bang/thienDien.js';
import { tinhBangThongTin } from '../../core/bang/thongTin.js';
import { ThanhThienTuong } from '../panels/ThanhThienTuong.js';
import { BangThienDien } from './BangThienDien.js';
import { BangThongTin } from './BangThongTin.js';
import type { DivineIdentity } from '../../core/schema/aspect/thanVi.js';
import { CACH_DAP_DI_HOA } from '../../core/schema/aspect/thanVi.js';
import LuaChon from '../components/LuaChon.js';
import { NoiDungPreset } from '../components/NoiDungPreset.js';

const TEN_TANG: Record<ViewMode, string> = {
  sang_the: 'Sáng Thế Thần',
  than: 'Thần',
  pham_nhan: 'Phàm Nhân',
};

const NHAN_CACH_DAP: Record<(typeof CACH_DAP_DI_HOA)[number], string> = {
  chap_nhan: 'Chấp nhận',
  chong_lai: 'Chống lại',
  mac_ca: 'Mặc cả',
  phan_than: 'Phân thân',
};

const MAU_MUC_RO: Record<string, string> = {
  ro: 'var(--ngoc)',
  mo: 'var(--lam)',
  tin_don: 'var(--van)',
};
const NHAN_MUC_RO: Record<string, string> = { ro: 'rõ', mo: 'mờ', tin_don: 'tin đồn' };

const nhanNho: CSSProperties = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };

/**
 * Thuộc tính mà script preset đọc trên từng dòng khung kể.
 *
 * `mesid` và `is_user` là tên của SillyTavern, viết thường và không phải thuộc
 * tính chuẩn của HTML — nên chúng đi qua một object thay vì viết thẳng vào JSX,
 * để TypeScript không phải nới lỏng kiểu của mọi `<div>` trong file.
 */
function thuocTinhMes(chiSo: number, loai: string): Record<string, string> {
  return {
    mesid: String(chiSo),
    is_user: loai === 'nguoi_choi' ? 'true' : 'false',
    is_system: loai === 'he_thong' ? 'true' : 'false',
    'data-loai': loai,
  };
}

function nut(chinh = false): CSSProperties {
  return {
    background: 'transparent',
    color: chinh ? 'var(--dong)' : 'var(--tro)',
    border: `1px solid ${chinh ? 'var(--dong)' : 'var(--kinh-vien)'}`,
    borderRadius: 'var(--r-sm)',
    padding: '7px 13px',
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
  };
}

/** Chấm mức rõ — SVG, không dùng ký tự hình học (36.5). */
function ChamMucRo({ muc }: { muc: string }): JSX.Element {
  const mau = MAU_MUC_RO[muc] ?? 'var(--mo)';
  return (
    <svg width={9} height={9} viewBox="0 0 10 10" aria-hidden="true" style={{ flex: '0 0 auto' }}>
      {muc === 'ro' ? (
        <circle cx="5" cy="5" r="3.2" fill={mau} />
      ) : (
        <circle cx="5" cy="5" r="3.2" fill="none" stroke={mau} strokeWidth="1.2" />
      )}
    </svg>
  );
}

export function SanhThienDien(): JSX.Element | null {
  const {
    state,
    view,
    scene,
    goiY,
    projects,
    loi,
    choXacNhan,
    stateHash,
    dangKe,
    loiKeDangStream,
    patchBiTuChoi,
  } = useGame();
  // Phase 8 — ống kính, hạn ngạch vắng mặt và trace truy hồi.
  const viChieu = useGame((s) => s.viChieu);
  const vangMat = useGame((s) => s.vangMat);
  const truyHoiCuoi = useGame((s) => s.truyHoiCuoi);
  const vetCatToken = useGame((s) => s.vetCatToken);
  const ongKinh = useGame((s) => s.ongKinh);
  const chiaOngKinh = useGame((s) => s.chiaOngKinh);
  const danhGiaTruyHoi = useGame((s) => s.danhGiaTruyHoi);
  const dangDanhGia = useGame((s) => s.dangDanhGia);
  const chayDanhGiaTruyHoi = useGame((s) => s.chayDanhGiaTruyHoi);
  const gui = useGame((s) => s.gui);
  const tick = useGame((s) => s.tick);
  const dangCapNhatBien = useGame((s) => s.dangCapNhatBien);
  const capNhatBienNgay = useGame((s) => s.capNhatBienNgay);
  const chuyenTang = useGame((s) => s.chuyenTang);
  const chonHienDien = useGame((s) => s.chonHienDien);
  const xacNhan = useGame((s) => s.xacNhan);
  const traLoi = useGame((s) => s.traLoi);
  const dapApLuc = useGame((s) => s.dapApLuc);
  const loiCauDangCho = useGame((s) => s.loiCauDangCho);
  const ungVienChuThe = useGame((s) => s.ungVienChuThe);
  const soTay = useGame((s) => s.soTay);
  const duongTiepTuc = useGame((s) => s.duongTiepTuc);
  const diTiep = useGame((s) => s.diTiep);
  // Phase 12 — ván chơi và lượt chưa được kể.
  const roiVan = useGame((s) => s.roiVan);
  const luotChuaKe = useGame((s) => s.luotChuaKe);
  const keLai = useGame((s) => s.keLai);
  const luaChon = useGame((s) => s.luaChon);
  const rerollDuoc = useGame((s) => s.rerollDuoc);
  const reroll = useGame((s) => s.reroll);
  const cauLuotTruoc = useGame((s) => s.cauLuotTruoc);
  const rerollVoiCau = useGame((s) => s.rerollVoiCau);
  const dangMoPhongHauTruong = useGame((s) => s.dangMoPhongHauTruong);

  const machDangChieu = useMemo(() => {
    if (ongKinh.dangChieu.loai !== 'mach') return null;
    const id = ongKinh.dangChieu.machId;
    return view?.machTruyen.find((m) => m.id === id) ?? null;
  }, [ongKinh.dangChieu, view]);

  /**
   * Chĩa được vào ai và vào đâu — hai loại mục tiêu còn lại của 29.1.
   * Chỉ lấy thứ chủ thể thấy RÕ: chĩa ống kính vào một tin đồn thì không có gì
   * để chiếu, và danh sách sẽ tự tố cáo những cái tên chưa nên biết.
   */
  const nhanVatChieuDuoc = useMemo(
    () =>
      [...(view?.entities.values() ?? [])]
        // "Nhân vật" nghĩa là người và thần. Một khái niệm hay một điều luật không
        // đứng ở đâu để mà chiếu vào, nên chĩa ống kính theo nó là vô nghĩa.
        .filter(
          (e) => e.mucRo === 'ro' && (e.kind === 'mortal' || e.kind === 'deity') && e.id !== view?.chuTheId,
        )
        .slice(0, 4)
        .map((e) => ({ id: e.id, ten: e.ten })),
    [view],
  );
  const vungChieuDuoc = useMemo(
    () =>
      [...(view?.entities.values() ?? [])]
        .filter((e) => e.kind === 'place' && e.mucRo === 'ro')
        .slice(0, 3)
        .map((e) => ({ id: e.id, ten: e.ten })),
    [view],
  );

  const cong = useAi((s) => s.cong());
  const tyLeHongAi = useAi((s) => s.tyLeHong());

  // ── Phase 11: hai bảng và router ──
  const lopPhu = useUi((s) => s.lopPhu);
  const tab = useUi((s) => s.tab);
  const timBang = useUi((s) => s.tim);
  const theoDoiMachIds = useUi((s) => s.theoDoiMachIds);
  const anhBang = useUi((s) => s.anhBang);
  const batBangThienDien = useUi((s) => s.batBangThienDien);
  const batThongTin = useUi((s) => s.batThongTin);
  const dongLopPhu = useUi((s) => s.dongLopPhu);
  const doiTabBang = useUi((s) => s.doiTab);
  const datTimBang = useUi((s) => s.datTim);
  const ghimMach = useUi((s) => s.ghimMach);
  const loiGhim = useUi((s) => s.loiGhim);
  const ghimThienTuong = useUi((s) => s.ghimThienTuong);
  const boGhimThienTuong = useUi((s) => s.boGhimThienTuong);
  const chupTheoTick = useUi((s) => s.chupTheoTick);
  const doiMan = useUi((s) => s.doiMan);

  const [cau, setCau] = useState('');
  const [debug, setDebug] = useState(false);
  const [khoi, setKhoi] = useState<'canh' | 'than_dien' | 'kenh'>('canh');
  const [diff, setDiff] = useState<CanonDiff | null>(null);
  /** Tầng đang chờ người chơi chọn chủ thể; `null` nghĩa là không có hộp chọn. */
  const [chonTang, setChonTang] = useState<Exclude<ViewMode, 'sang_the'> | null>(null);
  /**
   * Câu đang được sửa trước khi kể lại; `null` nghĩa là hộp sửa đang đóng.
   *
   * Chuỗi rỗng KHÁC `null` — người chơi xoá sạch ô nhập vẫn là đang mở hộp sửa,
   * chỉ là chưa gõ gì. Dùng `''` làm dấu đóng sẽ đóng sập hộp ngay dưới tay họ.
   */
  const [suaCau, setSuaCau] = useState<string | null>(null);
  const cuoiScene = useRef<HTMLDivElement>(null);

  // [BB] ADR-0028 — không có AI thì không gõ được. Khóa ô nhập là cách trung
  // thực nhất để nói điều đó; để người chơi gõ rồi nuốt câu của họ thì không.
  // [BB] ADR-0056 — một nhịp chưa được kể cũng khóa, vì đi tiếp sẽ chôn nó.
  const khoaNhap = dangKe || dangCapNhatBien || !cong.choPhepChoi || luotChuaKe !== null;

  /**
   * Reroll — kể lại lượt vừa rồi.
   *
   * Thêm `dangMoPhongHauTruong` vào điều kiện khóa dù store cũng tự chặn: mô
   * phỏng hậu trường chạy vài giây SAU khi lời kể đã hiện ra, nên đúng lúc nút
   * trông sẵn sàng nhất thì nó lại là lúc bấm vào không có gì xảy ra. Một nút
   * xám có lý do đọc được thì thành thật hơn một nút nuốt cú bấm.
   */
  const khoaReroll = khoaNhap || dangMoPhongHauTruong || !rerollDuoc;
  const viSaoKhoaReroll = !rerollDuoc
    ? 'Chưa có lượt kể nào để kể lại — hoặc lượt trước đó đã bị một lượt mới chôn đi.'
    : dangMoPhongHauTruong
      ? 'Thế giới đang mô phỏng phần hậu trường của lượt này. Chờ nó xong đã.'
      : 'Chưa kể lại được lúc này.';

  /**
   * Sửa được câu hay không.
   *
   * Hẹp hơn reroll thường một bậc, và có lý do: lượt do trôi nhịp, lời cầu hay
   * áp lực Dị Hóa sinh ra thì không có câu nào của người chơi để mà sửa. Ở đó
   * reroll vẫn dùng được — chỉ nút này vắng mặt.
   */
  const suaDuoc = !khoaReroll && cauLuotTruoc !== null;

  useEffect(() => {
    cuoiScene.current?.scrollIntoView({ block: 'end' });
  }, [scene.length]);

  /*
   * Một lượt mới bắt đầu thì hộp sửa đóng lại. `cauLuotTruoc` về `null` ngay ở
   * đầu mỗi lượt kể, nên nó là tín hiệu đúng: hộp đang mở cho câu của lượt cũ,
   * và câu ấy vừa hết hạn để sửa.
   */
  useEffect(() => {
    setSuaCau(null);
  }, [cauLuotTruoc]);

  /**
   * [BB] 55.8 — ảnh chụp vật chất hoá ở RANH GIỚI TICK.
   *
   * Phụ thuộc là `view`, và `view` chỉ đổi khi thế giới đổi. Chụp theo từng thay
   * đổi nhỏ sẽ đếm lại năm mươi nghìn entity mỗi lần người chơi gõ một chữ.
   */
  useEffect(() => {
    if (view !== null) chupTheoTick(view);
  }, [view, chupTheoTick]);

  /**
   * Phím `Tab` và `I` — 58.1.
   *
   * [BB] "Không được mở hai lớp phủ chồng nhau." Store giữ MỘT giá trị `lopPhu`
   * nên điều đó không thể sai; ở đây chỉ cần đừng cướp phím khi người chơi đang
   * gõ, vì `Tab` trong một ô nhập là phím chuyển ô, không phải phím mở bảng.
   */
  useEffect(() => {
    const nghe = (e: KeyboardEvent): void => {
      const dich = e.target as HTMLElement | null;
      const dangGo =
        dich !== null && (dich.tagName === 'INPUT' || dich.tagName === 'TEXTAREA' || dich.isContentEditable);

      if (e.key === 'Escape') {
        dongLopPhu(view);
        return;
      }
      if (dangGo) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        batBangThienDien(view);
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        batThongTin(view);
      }
    };
    window.addEventListener('keydown', nghe);
    return () => window.removeEventListener('keydown', nghe);
  }, [view, batBangThienDien, batThongTin, dongLopPhu]);

  const bang = useMemo(() => (view === null ? null : tinhBangThienDien(view, anhBang)), [view, anhBang]);
  const bangThongTin = useMemo(
    () =>
      view === null
        ? null
        : tinhBangThongTin(view, {
            theoDoiMachIds,
            machDangChieuId: ongKinh.dangChieu.loai === 'mach' ? ongKinh.dangChieu.machId : null,
            tenNhanh: view.branchId,
          }),
    [view, theoDoiMachIds, ongKinh.dangChieu],
  );

  const mode = state?.world.playerState.mode ?? 'sang_the';
  const chuTheId = state?.world.playerState.chuTheId ?? null;

  /**
   * Dữ liệu Bảng Thần Điện — chỉ có nghĩa khi đang nhập một vị thần.
   *
   * Toàn bộ phép tính nằm ở `core/than/thanDien.ts`: màn này chỉ vẽ. Bảng cũ
   * dựng dữ liệu ngay tại chỗ nên không có cách nào kiểm nó mà không dựng React.
   */
  const thanDien: DuLieuThanDien | null = useMemo(() => {
    if (!state || mode !== 'than' || !chuTheId) return null;
    return tinhBangThanDien(state, chuTheId);
  }, [state, mode, chuTheId]);

  const tinhHuong = useMemo(() => {
    if (!state || !chuTheId) return null;
    const bn = state.entities.get(chuTheId)?.aspects['ban_nga'] as DivineIdentity | undefined;
    return bn?.pressure.tinhHuongMo.find((t) => t.daChon === null) ?? null;
  }, [state, chuTheId]);

  const dsCau = useMemo(() => (mode === 'than' ? loiCauDangCho() : []), [mode, loiCauDangCho, state]);

  /**
   * [BB] 56.1 — ở tầng phàm nhân, Bảng Thiên Diễn bị THAY HẲN bằng Sổ Tay.
   * Không phải bản rút gọn: một màn hình khác về bản chất.
   */
  const so = useMemo(() => (mode === 'pham_nhan' ? soTay() : null), [mode, soTay, state]);
  const dsDiTiep = useMemo(() => duongTiepTuc(), [duongTiepTuc, state]);

  if (!state || !view) return null;

  const guiCau = (): void => {
    if (cau.trim() === '' || khoaNhap) return;
    void gui(cau);
    setCau('');
  };

  /**
   * Đổi tầng — Phần 21.3.
   *
   * Bản Phase 6 chọn "entity `deity` đầu tiên trong `view`", và `view` đổi theo
   * tầng đang đứng, nên bấm "Thần" có lần vào tầng Thần, có lần rơi xuống Phàm
   * Nhân. Giờ danh sách do `ungVienChuThe()` dựng trên thế giới THẬT, và khi có
   * nhiều hơn một người thì hỏi thay vì đoán.
   */
  const doiHienDien = (m: ViewMode): void => {
    if (m === 'sang_the') {
      void chuyenTang('sang_the', null);
      setChonTang(null);
      return;
    }
    const ds = ungVienChuThe(m);
    if (ds.length === 0) {
      void chuyenTang(m, null); // store báo lỗi tử tế thay vì im lặng không làm gì
      return;
    }
    if (ds.length === 1) {
      void chuyenTang(m, ds[0]?.id ?? null);
      setChonTang(null);
      return;
    }
    setChonTang(m);
  };

  const rail: MucRail[] = [
    { id: 'canh', icon: 'gui', nhan: 'Cảnh đang diễn', bat: khoi === 'canh', onChon: () => setKhoi('canh') },
    {
      id: 'than_dien',
      icon: 'vuong_mien',
      nhan: 'Thần điện',
      bat: khoi === 'than_dien',
      onChon: () => setKhoi('than_dien'),
    },
    { id: 'kenh', icon: 'than', nhan: 'Kênh can thiệp', bat: khoi === 'kenh', onChon: () => setKhoi('kenh') },
    // ── Phase 11: cửa vào các màn toàn trang. Món nợ từ Phase 8 đã trả. ──
    {
      id: 'thong_tin',
      icon: 'thu_tich',
      nhan: 'Bảng Thông Tin Thiên Địa (phím I)',
      bat: lopPhu === 'thong_tin',
      onChon: () => batThongTin(view),
    },
    // Một cửa cho bốn thứ (Phase 12): proxy AI, preset, lorebook, workflow.
    // Trước đó Xưởng Preset và Cài Đặt AI là hai nút rời, còn Lorebook và
    // Workflow không có nút nào — bấm vào chỉ hiện lại Sảnh.
    {
      id: 'cai_dat',
      icon: 'coi',
      nhan: 'Cài Đặt (preset · lorebook · workflow · proxy)',
      onChon: () => doiMan('cai_dat'),
    },
    // Ba màn cuối cùng của sổ nợ Phase 11 — nay có đường bấm thật.
    {
      id: 'vat_ly',
      icon: 'dinh_luat',
      nhan: 'Vật Lý Thế Giới — bảy trục Luật Nền',
      onChon: () => doiMan('vat_ly'),
    },
    { id: 'ban_do_nhanh', icon: 'ban_do', nhan: 'Bản Đồ Nhánh', onChon: () => doiMan('ban_do_nhanh') },
    { id: 'registry', icon: 'thu_tich', nhan: 'Xưởng Registry', onChon: () => doiMan('xuong_registry') },
    { id: 'chan_doan', icon: 'so_sach', nhan: 'Tự Chẩn Đoán', onChon: () => doiMan('chan_doan') },
    {
      id: 'debug',
      icon: 'khai_niem',
      nhan: 'Bảng gỡ lỗi tại chỗ',
      bat: debug,
      onChon: () => setDebug((d) => !d),
    },
  ];

  const tenCua = (id: string): string => view.entities.get(id)?.ten ?? state.entities.get(id)?.ten ?? id;

  // ── cột giữa ──
  const giua = (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', minHeight: 0 }}>
        {loi.length > 0 && (
          <div
            role="alert"
            className="kinh"
            style={{ padding: 12, marginBottom: 14, display: 'flex', gap: 9, alignItems: 'flex-start' }}
          >
            <Icon ten="canh_bao" co={16} style={{ color: 'var(--hoi)', marginTop: 2 }} />
            <div style={{ color: 'var(--hoi)', fontSize: 13 }}>
              {loi.map((e, i) => (
                <div key={i}>{e.message}</div>
              ))}
            </div>
          </div>
        )}

        {/*
         * ── ba đường sau khi chết ──
         * [BB] 20.3 — "Chết không Game Over." Màn này thay chỗ của một cái màn
         * hình thua: thế giới đi tiếp, và người chơi chọn nhìn nó qua mắt ai.
         */}
        {dsDiTiep.length > 0 && (
          <div
            role="alertdialog"
            aria-label="Đời này đã hết"
            className="kinh"
            style={{ padding: 16, marginBottom: 14, borderLeft: '2px solid var(--dong)' }}
          >
            <strong style={{ fontSize: 15 }}>Đời này đã hết. Thế giới thì chưa.</strong>
            <div style={{ display: 'grid', gap: 7, margin: '12px 0 0' }}>
              {dsDiTiep.map((d) => (
                <button
                  key={`${d.duong}:${d.chuTheMoiId}`}
                  style={{ ...nut(d.duong === 'anh_linh'), textAlign: 'left', display: 'grid', gap: 2 }}
                  onClick={() => void diTiep(d)}
                >
                  <span className="ten-rieng">
                    {d.duong === 'ke_thua'
                      ? `Kế thừa — ${d.ten}`
                      : d.duong === 'chung_kien'
                        ? `Chứng kiến — ${d.ten}`
                        : `Anh Linh Hóa Thần — ${d.ten}`}
                  </span>
                  <span style={nhanNho}>{d.vi}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/*
         * ── hộp chọn chủ thể ──
         * Có nhiều hơn một người nhập được thì HỎI. Chọn hộ người chơi một danh
         * tính là cách cũ, và nó chính là chỗ lỗi "bấm Thần ra Phàm Nhân" ở.
         */}
        {chonTang && (
          <div className="kinh" style={{ padding: 14, marginBottom: 14 }}>
            <strong style={{ fontSize: 14 }}>
              Ngươi bước vào tầng {TEN_TANG[chonTang]} bằng thân phận nào?
            </strong>
            <div style={{ display: 'grid', gap: 7, margin: '10px 0 0' }}>
              {ungVienChuThe(chonTang).map((u) => (
                <button
                  key={u.id}
                  style={{ ...nut(u.daTungNhap), textAlign: 'left', display: 'grid', gap: 2 }}
                  onClick={() => {
                    void chuyenTang(chonTang, u.id);
                    setChonTang(null);
                  }}
                >
                  <span className="ten-rieng">{u.ten}</span>
                  <span style={nhanNho}>{u.vi}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {/*
               * [BB] 78.4 — thân phận MỚI phải đi qua `CanonDiff` và được xác nhận
               * trước Event đầu tiên. Nhập vào người có sẵn thì không, vì lịch sử
               * của họ đã có rồi (79.4).
               */}
              <button
                style={nut()}
                onClick={() => {
                  const m = chonTang;
                  setChonTang(null);
                  void chonHienDien(
                    StartingPresenceDraftSchema.parse({ mode: m, name: '', useExistingEntityId: null }),
                  ).then(setDiff);
                }}
              >
                Dựng một thân phận mới
              </button>
              <button style={nut()} onClick={() => setChonTang(null)}>
                Thôi, ở lại đây
              </button>
            </div>
          </div>
        )}

        {diff && (
          <div className="kinh" style={{ padding: 14, marginBottom: 14 }}>
            <strong style={{ fontSize: 14 }}>Thế giới vừa ghi nhận:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--tro)', fontSize: 13 }}>
              {[...diff.engineQuyet, ...diff.khongCapThang].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <button style={{ ...nut(), marginTop: 10 }} onClick={() => setDiff(null)}>
              Đã rõ
            </button>
          </div>
        )}

        {/*
         * ── tình huống Dị Hóa ──
         * [BB] 69.1 — đây là cửa DUY NHẤT để `coreSelf` đổi. Bốn cách đứng ngang
         * hàng nhau; không cách nào được đánh dấu là "đúng".
         */}
        {tinhHuong && (
          <div className="kinh" style={{ padding: 14, marginBottom: 14, borderLeft: '2px solid var(--hoi)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <Icon ten="di_hoa" co={15} style={{ color: 'var(--hoi)' }} />
              <span style={nhanNho}>ÁP LỰC DỊ HÓA</span>
            </div>
            <p style={{ margin: '0 0 12px', fontFamily: 'var(--chu-hien)', fontSize: 18, lineHeight: 1.45 }}>
              {tinhHuong.moTa}
            </p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {CACH_DAP_DI_HOA.map((c) => (
                <button key={c} style={nut()} onClick={() => void dapApLuc(tinhHuong.id, c)}>
                  {NHAN_CACH_DAP[c]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/*
         * ── Cấu trúc DOM tương thích SillyTavern ──
         *
         * `#chat`, `.mes[mesid]`, `.mes_block`, `.mes_text` không phải trang trí:
         * script preset bám vào đúng những selector này. Một script dựng thẻ lựa
         * chọn tìm `.mes_text choice`, một script dọn suy luận tìm `.mes_block`
         * của tin nhắn cuối. Đổi tên chúng đi thì script chạy, không báo lỗi, và
         * không làm gì cả — dạng hỏng khó truy nhất trong cả đường ống này.
         */}
        {khoi === 'canh' && (
          <div id="chat" className="chat-thien-dien">
            {scene.map((d, i) => (
              <div
                key={d.id}
                className={`mes ${d.loai === 'nguoi_choi' ? 'mes-nguoi-choi' : ''} ${
                  i === scene.length - 1 && loiKeDangStream === '' ? 'last_mes' : ''
                }`}
                {...thuocTinhMes(i, d.loai)}
                style={{
                  margin: '0 0 12px',
                  fontSize: d.loai === 'nguoi_choi' ? 15 : 14,
                  lineHeight: 1.65,
                  color:
                    d.loai === 'nguoi_choi'
                      ? 'var(--sang)'
                      : d.loai === 'he_thong'
                        ? 'var(--mo)'
                        : 'var(--tro)',
                  fontStyle: d.loai === 'he_thong' ? 'italic' : 'normal',
                  borderLeft: d.loai === 'nguoi_choi' ? '2px solid var(--kinh-vien)' : 'none',
                  paddingLeft: d.loai === 'nguoi_choi' ? 12 : 0,
                }}
              >
                <div className="mes_block">
                  <div className="mes_text">
                    {d.dinhDang === 'html' ? <NoiDungPreset html={d.noiDung} /> : d.noiDung}
                  </div>
                </div>
              </div>
            ))}
            {loiKeDangStream !== '' && (
              <div
                className="mes last_mes mes-streaming"
                {...thuocTinhMes(scene.length, 'ket_qua')}
                aria-live="polite"
                aria-label="Lời kể đang được sinh"
                style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.65, color: 'var(--tro)' }}
              >
                <div className="mes_block">
                  <div className="mes_text" style={{ whiteSpace: 'pre-wrap' }}>
                    {loiKeDangStream}
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-block',
                        height: '1em',
                        borderLeft: '2px solid var(--dong)',
                        marginLeft: 3,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {khoi === 'than_dien' &&
          (thanDien ? (
            <div style={{ maxWidth: 460 }}>
              <BangThanDien du={thanDien} />
            </div>
          ) : (
            <p style={{ color: 'var(--mo)', fontSize: 14 }}>
              Thần điện chỉ có nghĩa khi ngươi đang là một vị thần. Hãy chuyển sang tầng Thần.
            </p>
          ))}

        {/*
         * ── mười kênh can thiệp (69.2) ──
         * Mỗi kênh hiện GIÁ TỰ NHIÊN của nó ngay trên thẻ. [BB] 1.3 — không có
         * mana; thứ ngăn lạm dụng là cái giá, nên cái giá phải đọc được.
         */}
        {khoi === 'kenh' && (
          <div style={{ display: 'grid', gap: 10, maxWidth: 560 }}>
            {KENH_DUNG_SAN.map((k) => (
              <button
                key={k.id}
                className="kinh--cap2"
                onClick={() => setCau(`${k.ten}: `)}
                style={{
                  textAlign: 'left',
                  padding: 12,
                  border: '1px solid var(--kinh-vien)',
                  background: 'transparent',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 4,
                }}
              >
                <span className="ten-rieng" style={{ fontSize: 14, color: 'var(--dong)' }}>
                  {k.ten}
                </span>
                <span style={{ fontSize: 13, color: 'var(--tro)' }}>{k.moTa}</span>
                <span style={{ ...nhanNho, color: 'var(--mo)' }}>
                  {[
                    k.gia.deHieuSai >= 0.5 ? 'dễ bị hiểu sai' : null,
                    k.gia.loDienThan >= 50 ? 'lộ mình rất rõ' : null,
                    k.gia.tuRangBuoc ? 'trói cả ngươi' : null,
                    k.gia.trungGianCoYChi ? 'trung gian có ý riêng' : null,
                    k.gia.tangPhuThuoc >= 15 ? 'tạo lệ thuộc' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'giá thấp'}
                </span>
              </button>
            ))}
          </div>
        )}

        <div ref={cuoiScene} />
      </div>

      {/* ── chân: chip gợi ý + ô nhập ── */}
      <div style={{ padding: '12px 22px 18px', borderTop: '1px solid var(--kinh-vien)' }}>
        {/*
         * [BB] ADR-0056 — một lượt chưa được kể chặn mọi lượt sau.
         *
         * Khối này đứng TRƯỚC hộp xác nhận vì nó nói về một chuyện đã rồi: thế
         * giới đã đi tiếp, và lời kể của lượt ấy còn thiếu. Đi tiếp mà không kể
         * lại nghĩa là mất hẳn đoạn đó — nên ở đây không có nút "bỏ qua".
         */}
        {luotChuaKe !== null && (
          <div
            role="alert"
            className="kinh--cap2"
            style={{
              border: '1px solid var(--kinh-vien)',
              borderRadius: 'var(--r-sm)',
              padding: '10px 14px',
              marginBottom: 10,
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--tro)' }}>
              <strong style={{ color: 'var(--hoi)' }}>Lượt này chưa ai kể.</strong> Thế giới đã đi tiếp, nhưng
              bạn chưa được đọc nó. Nối lại đường tới model rồi kể lại — trò chơi dừng ở đây tới lúc đó.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={nut(true)} disabled={dangKe} onClick={() => void keLai()}>
                {dangKe ? 'Đang kể lại…' : 'Kể lại lượt này'}
              </button>
              <button style={nut()} onClick={() => doiMan('cai_dat')}>
                Mở Cài Đặt · Proxy AI
              </button>
            </div>
          </div>
        )}
        {choXacNhan ? (
          <div role="alertdialog" aria-label="Xác nhận hành động không thể hoàn tác">
            <p style={{ margin: '0 0 10px', fontSize: 14 }}>
              <strong>Không thể hoàn tác.</strong> “{choXacNhan.cau}”
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={nut(true)} onClick={() => void xacNhan(true)}>
                Ta chấp nhận hậu quả
              </button>
              <button style={nut()} onClick={() => void xacNhan(false)}>
                Dừng lại
              </button>
            </div>
          </div>
        ) : (
          <>
            {goiY.length > 0 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                {goiY.slice(0, 4).map((a) => (
                  <ChipHanhDong key={a.id} nhan={a.nhan} icon="quy_ket" onChon={() => setCau(a.nhan)} />
                ))}
              </div>
            )}
            {luaChon.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <LuaChon
                  luaChon={luaChon}
                  dangKe={dangKe}
                  onChon={(text) => {
                    setCau(text);
                    void gui(text);
                  }}
                />
              </div>
            )}
            {/*
             * Hộp sửa câu — đường thứ hai của reroll.
             *
             * Nó mở ra ngay TRÊN hàng nút, không thay chỗ ô nhập ở dưới: hai ô
             * nói hai chuyện khác nhau, và gộp lại thì người chơi không phân
             * biệt được mình đang viết lượt tiếp theo hay viết lại lượt vừa rồi.
             */}
            {suaCau !== null && (
              <div
                className="kinh--cap2"
                style={{
                  border: '1px solid var(--kinh-vien)',
                  borderRadius: 'var(--r-sm)',
                  padding: '10px 14px',
                  marginBottom: 10,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <label htmlFor="oSuaCau" style={nhanNho}>
                  VIẾT LẠI CÂU CỦA NGƯƠI — THẾ GIỚI SẼ LÙI VỀ TRƯỚC KHI NGƯƠI NÓI NÓ
                </label>
                <textarea
                  id="oSuaCau"
                  value={suaCau}
                  rows={3}
                  autoFocus
                  onChange={(e) => setSuaCau(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSuaCau(null);
                  }}
                  style={{
                    color: 'var(--sang)',
                    border: '1px solid var(--kinh-vien)',
                    padding: '9px 12px',
                    font: 'inherit',
                    fontSize: 14,
                    lineHeight: 1.5,
                    background: 'var(--kinh-nen-2)',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    style={nut(true)}
                    disabled={khoaReroll || suaCau.trim() === ''}
                    onClick={() => {
                      const moi = suaCau;
                      setSuaCau(null);
                      void rerollVoiCau(moi);
                    }}
                  >
                    Kể lại với câu này
                  </button>
                  <button style={nut()} onClick={() => setSuaCau(null)}>
                    Thôi
                  </button>
                  <span style={{ ...nhanNho, textTransform: 'none' }}>
                    Engine sẽ phán lại từ đầu theo câu mới, không chỉ kể lại bằng lời khác.
                  </span>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
              <button
                style={{ ...nut(true), display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={khoaNhap}
                title="Nhờ AI đối chiếu diễn biến gần đây với trạng thái thật; không làm thời gian trôi."
                onClick={() => void capNhatBienNgay()}
              >
                <Icon ten="khai_niem" co={14} />
                {dangCapNhatBien ? 'Đang cập nhật biến…' : 'Cập nhật biến'}
              </button>
              <button
                style={{ ...nut(), display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={khoaNhap}
                onClick={() => void tick(1)}
              >
                <Icon ten="nhip" co={14} /> Trôi 1 nhịp
              </button>
              <button
                style={{ ...nut(), display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={khoaNhap}
                onClick={() => void tick(30)}
              >
                <Icon ten="ban_do" co={14} /> Trôi 30 nhịp
              </button>
              {/*
               * Hai nút lùi đứng riêng ở mép phải vì chúng đi NGƯỢC chiều ba nút
               * kia: ba nút trên đẩy thế giới tới, hai nút này kéo nó lùi rồi
               * chạy lại. "Sửa câu" đứng trước vì nó lùi xa hơn.
               *
               * Nó chỉ có mặt khi có câu để sửa — ở một lượt trôi nhịp thì một
               * nút xám vĩnh viễn chỉ là nhiễu, còn Reroll bên cạnh vẫn dùng được.
               */}
              {cauLuotTruoc !== null && (
                <button
                  style={{
                    ...nut(),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginLeft: 'auto',
                    opacity: suaDuoc ? 1 : 0.45,
                    cursor: suaDuoc ? 'pointer' : 'not-allowed',
                  }}
                  disabled={!suaDuoc}
                  title={
                    suaDuoc
                      ? `Sửa lại câu "${cauLuotTruoc}" rồi kể lại từ đó. Thế giới lùi về trước lúc engine nghe câu ấy, nên phán quyết cũng được hỏi lại.`
                      : viSaoKhoaReroll
                  }
                  onClick={() => setSuaCau(cauLuotTruoc)}
                >
                  <Icon ten="thu_tich" co={14} /> Sửa câu
                </button>
              )}
              <button
                style={{
                  ...nut(),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginLeft: cauLuotTruoc === null ? 'auto' : undefined,
                  opacity: khoaReroll ? 0.45 : 1,
                  cursor: khoaReroll ? 'not-allowed' : 'pointer',
                }}
                disabled={khoaReroll}
                title={
                  khoaReroll
                    ? viSaoKhoaReroll
                    : 'Reroll — bỏ lời kể vừa rồi, lùi thế giới về ngay trước nó, rồi kể lại đúng lượt ấy. Chỉ lùi được một lượt.'
                }
                onClick={() => void reroll()}
              >
                <Icon ten="ke_lai" co={14} /> Reroll
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <label htmlFor="oNhap" style={{ position: 'absolute', left: -9999 }}>
                Hành động của ngươi
              </label>
              <input
                id="oNhap"
                value={cau}
                disabled={khoaNhap}
                onChange={(e) => setCau(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guiCau();
                }}
                placeholder={
                  dangKe
                    ? 'Đang có người kể…'
                    : cong.choPhepChoi
                      ? 'Hành động của ngươi...'
                      : 'Chưa nối được AI — không ai kể được lượt này.'
                }
                className="kinh--cap2"
                style={{
                  flex: 1,
                  color: khoaNhap ? 'var(--mo)' : 'var(--sang)',
                  border: '1px solid var(--kinh-vien)',
                  padding: '11px 14px',
                  font: 'inherit',
                  fontSize: 14,
                  background: 'var(--kinh-nen-2)',
                  cursor: khoaNhap ? 'not-allowed' : 'text',
                }}
              />
              <button
                style={{
                  ...nut(true),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  opacity: khoaNhap ? 0.45 : 1,
                  cursor: khoaNhap ? 'not-allowed' : 'pointer',
                }}
                disabled={khoaNhap}
                onClick={guiCau}
              >
                <Icon ten="gui" co={15} />
                {dangKe ? 'Đang kể' : 'Gửi'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );

  // ── cột phải ──
  const phai = (
    <>
      {/*
       * [BB] 56.1 — ở tầng phàm nhân KHÔNG có Bảng Thần Điện và KHÔNG có bảng
       * "Ngươi thấy" với bốn con số sương mù. Chỉ có Sổ Tay.
       */}
      {so ? <SoTayPanel so={so} /> : thanDien && khoi !== 'than_dien' && <BangThanDien du={thanDien} />}

      {/*
       * [BB] 29.1 — cột giữa không phải cuộc chat của người chơi. Panel này là
       * chỗ duy nhất nói điều đó ra, và là tab Truy hồi của 77.11.
       */}
      <PanelOngKinh
        viChieu={viChieu}
        machDangChieu={machDangChieu}
        vangMat={vangMat}
        truyHoi={truyHoiCuoi}
        vetCatToken={vetCatToken}
        machKhac={view.machTruyen}
        onChia={(machId) => chiaOngKinh({ loai: 'mach', machId })}
        onTuDong={() => chiaOngKinh({ loai: 'tu_dong' })}
        nhanVatGan={nhanVatChieuDuoc}
        vungGan={vungChieuDuoc}
        onChiaNhanVat={(entityId) => chiaOngKinh({ loai: 'nhan_vat', entityId })}
        onChiaVung={(vungId) => chiaOngKinh({ loai: 'vung', vungId })}
        danhGia={danhGiaTruyHoi}
        dangDanhGia={dangDanhGia}
        onDanhGia={() => void chayDanhGiaTruyHoi()}
      />

      {mode === 'than' && (
        <KhungCauNguyen
          ds={dsCau}
          tenCua={tenCua}
          tick={state.world.tick}
          onTraLoi={(c, cach) => void traLoi(c, cach)}
        />
      )}

      {/*
       * [BB] 56.2 quy tắc 1 — "không con số hệ thống" ở tầng phàm nhân. Bốn con
       * số sương mù (`8 rõ · 3 mờ · …`) là số của engine, nên bảng này chỉ hiện
       * ở hai tầng trên. Ở dưới, Sổ Tay đã nói cùng một điều bằng câu chữ.
       */}
      {mode !== 'pham_nhan' && (
        <section className="kinh hien-panel" style={{ padding: 16, display: 'grid', gap: 10 }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon ten="khai_niem" co={16} style={{ color: 'var(--van)' }} />
            <h2 style={{ ...nhanNho, margin: 0, textTransform: 'uppercase' }}>Ngươi thấy</h2>
          </header>
          <div style={{ display: 'grid', gap: 6 }}>
            {[...view.entities.values()].slice(0, 12).map((e) => (
              <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <ChamMucRo muc={e.mucRo} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.ten}
                </span>
                <span style={{ ...nhanNho, whiteSpace: 'nowrap' }}>
                  {NHAN_MUC_RO[e.mucRo]}
                  {e.daBopMeo ? ' · nghe kể' : ''}
                </span>
              </div>
            ))}
          </div>
          <p style={{ ...nhanNho, margin: 0 }}>
            {view.suongMu.ro.length} rõ · {view.suongMu.mo.length} mờ · {view.suongMu.tinDon.length} tin đồn ·{' '}
            {view.suongMu.mu.length} chưa biết tới
          </p>
        </section>
      )}

      {projects.length > 0 && (
        <section className="kinh hien-panel" style={{ padding: 16, display: 'grid', gap: 8 }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon ten="thu_tich" co={16} style={{ color: 'var(--ngoc)' }} />
            <h2 style={{ ...nhanNho, margin: 0, textTransform: 'uppercase' }}>Việc đang làm</h2>
          </header>
          {projects.map((p) => (
            <div key={p.id} style={{ fontSize: 13 }}>
              {p.goal}
              <span style={{ ...nhanNho, display: 'block' }}>
                {p.status === 'blocked' ? 'đang vướng' : 'đang chạy'} · {p.milestones.length} chặng
              </span>
            </div>
          ))}
        </section>
      )}

      {debug && (
        <section className="kinh hien-panel" style={{ padding: 16 }}>
          <h2 style={{ ...nhanNho, margin: '0 0 8px', textTransform: 'uppercase' }}>Chẩn đoán</h2>
          <pre
            className="chu-so"
            style={{ margin: 0, fontSize: 11, color: 'var(--tro)', whiteSpace: 'pre-wrap' }}
          >
            {`state hash   ${stateHash}
visibility   ${view.visibilityHash}
mức chiếu    ${view.mucChieu}${view.dangHoaThan ? ' (đang hóa thân)' : ''}
nhánh        ${state.world.branchId}
seed         ${state.world.seed}
entity       ${state.entities.size} · thấy ${view.entities.size}
tri thức     ${state.knowledge.size}
lời cầu      ${state.prayers.size}
chủ thể      ${state.world.playerState.chuTheId ?? '(không)'}
cổng AI      ${cong.trangThai}
tỉ lệ hỏng   ${Math.round(tyLeHongAi * 100)}%`}
          </pre>

          {/* Mục 27 của bảng Tự Chẩn Đoán (46.2) — patch AI bị engine từ chối. */}
          {patchBiTuChoi.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...nhanNho, marginBottom: 6 }}>
                {patchBiTuChoi.length} THAY ĐỔI AI ĐỀ NGHỊ BỊ TỪ CHỐI
              </div>
              {patchBiTuChoi.map((p, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--hoi)', marginBottom: 4 }}>
                  {p.ma} — {p.thongDiep}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );

  /**
   * Mục "Cần chú ý" mở thẳng tới chỗ xử lý — [BB] 55.4.
   *
   * Đích nào chưa có màn riêng thì đưa về nơi gần nhất xử lý được, chứ không im
   * lặng: một nút bấm không làm gì còn tệ hơn một nút không có.
   */
  const xuLyCanChuY = (dich: string): void => {
    if (dich === 'doi_soat') {
      doiMan('lorebook');
      return;
    }
    if (dich === 'chi_so' || dich === 'lo_hong') {
      doiMan('chan_doan');
      return;
    }
    if (dich === 'luat_nen') {
      doiMan('vat_ly');
      return;
    }
    // Phục bút, lời cầu và mạch truyện đều xử lý ngay trong Sảnh.
    dongLopPhu(view);
    if (dich === 'loi_cau') setKhoi('canh');
  };

  return (
    <KhungSanh
      tieuDe="Thiên Diễn"
      phuDe={`Đang nhìn bằng mắt của ${TEN_TANG[mode]}`}
      rail={rail}
      thanhTren={
        bang === null ? undefined : (
          <ThanhThienTuong
            cum={thanhThienTuong(bang, anhBang?.ghim ?? [])}
            /*
             * Nguồn ghim là vùng "Đang thế nào" của chính Bảng — không phải một
             * danh sách khai tay. Thêm một chỉ số mới vào Bảng là nó tự có mặt ở
             * đây, và không ai phải nhớ cập nhật chỗ thứ hai.
             */
            ghimDuoc={(bang.dangTheNao ?? []).map((c) => ({ khoa: c.khoa, nhan: c.nhan }))}
            dangGhim={anhBang?.ghim ?? []}
            loiGhim={loiGhim}
            onMoBang={() => batBangThienDien(view)}
            onGhim={ghimThienTuong}
            onBoGhim={boGhimThienTuong}
          />
        )
      }
      lopPhu={
        lopPhu === 'bang_thien_dien' && bang !== null ? (
          <BangThienDien bang={bang} onDong={() => dongLopPhu(view)} onXuLy={(m) => xuLyCanChuY(m.dich)} />
        ) : lopPhu === 'thong_tin' && bangThongTin !== null ? (
          <BangThongTin
            du={bangThongTin}
            tab={tab}
            tim={timBang}
            theoDoiMachIds={theoDoiMachIds}
            onDoiTab={doiTabBang}
            onTim={datTimBang}
            onGhimMach={ghimMach}
            onDong={() => dongLopPhu(view)}
          />
        ) : undefined
      }
      dauTrang={
        <>
          <span className="chu-so" style={{ ...nhanNho, color: 'var(--tro)' }}>
            {state.world.tick === 0
              ? 'Tích Tắc Đầu Tiên'
              : mode === 'pham_nhan'
                ? `năm ${state.world.year}`
                : `nhịp ${state.world.tick} · năm ${state.world.year}`}
          </span>
          {/*
           * Trạng thái AI luôn hiện. [BB] luật bất biến #9 — không chỉ dựa vào
           * màu: cái chấm đi kèm chữ, và chữ mới là thứ đọc được.
           */}
          <span
            title={cong.lyDo.join(' ')}
            style={{
              ...nhanNho,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: cong.choPhepChoi ? 'var(--ngoc)' : 'var(--hoi)',
            }}
          >
            <ChamMucRo muc={cong.choPhepChoi ? 'ro' : 'tin_don'} />
            AI: {dangKe ? 'đang kể' : NHAN_TRANG_THAI_CONG[cong.trangThai]}
          </span>
          {(['sang_the', 'than', 'pham_nhan'] as ViewMode[]).map((m) => (
            <button
              key={m}
              style={nut(m === mode)}
              aria-current={m === mode ? 'true' : undefined}
              onClick={() => doiHienDien(m)}
            >
              {TEN_TANG[m]}
            </button>
          ))}
          {/*
           * Đường ra khỏi ván — Phase 12.
           *
           * `roiVan()` lưu TRƯỚC khi rời và không hỏi lại: hỏi "bạn có muốn lưu
           * không" chỉ có nghĩa khi có lý do để trả lời không, và ở đây không có
           * lý do nào cả. Ván đã tự lưu sau mỗi nhịp rồi.
           */}
          <button style={nut(false)} title="Lưu rồi về Sảnh Vào" onClick={() => void roiVan()}>
            Rời ván
          </button>
        </>
      }
      giua={giua}
      phai={phai}
    />
  );
}
