/**
 * Xưởng Workflow và Diễn Hóa — Phần 50.8, 50.10, 50.12, 47.
 *
 * ── Ba thứ nằm chung một màn ──
 *
 * Cả ba trả lời cùng một câu hỏi: *thế giới tự chạy tiếp thế nào khi người chơi
 * không gõ gì.* **Nhịp nền** quyết bao lâu nó tự đi một bước; **Diễn Hóa** quyết
 * một lần tua chạy bao xa rồi dừng ở đâu; **Đường ống tác vụ** quyết phần nào
 * trong đó cần tới model.
 *
 * ── Vì sao màn này KHÔNG dùng chữ Hiển ──
 *
 * `--chu-hien` là chữ của **lời kể**: một serif hẹp, nét mảnh, dựng cho những
 * đoạn văn dài đọc chậm. Màn này không có đoạn văn nào — nó toàn nhãn ngắn, số,
 * ô nhập và công tắc, và ở cỡ 12–14px thì serif ấy nhòe đúng chỗ dấu tiếng Việt
 * (`ữ`, `ằ`, `ợ`) trên màn hình không HiDPI. Nên tiêu đề ở đây dùng `--chu-than`
 * với giãn chữ âm nhẹ, còn `--chu-so` giữ nguyên vai của nó: mọi con số.
 *
 * ── [BB] 50.10 · 47.4 — lằn ranh không phải một lời dặn ──
 *
 * `kiemLanRanh()` chạy TRƯỚC khi một preset được coi là dùng được, và kết quả
 * của nó hiện thẳng ở đây. Diễn Hóa và Bồi Đắp cũng vậy: bảng cấm hiện ở cuối
 * mỗi khối, không giấu trong tài liệu.
 */
import { useMemo, useState } from 'react';
import { useGame } from '../../store/game.js';
import { useAi } from '../../store/ai.js';
import { PRESET_WORKFLOW, DUONG_DAN_CAM_WORKFLOW, kiemLanRanh } from '../../core/workflow/dungSan.js';
import {
  NHIP_DIEN_HOA,
  DIEU_KIEN_DUNG_DIEN_HOA,
  BANG_CAM_DIEN_HOA,
  CauHinhDienHoaSchema,
  tinhNhipNenHieuLuc,
  uocLuongDienHoa,
} from '../../core/world/dienHoa.js';
import type { NhipDienHoa, DieuKienDungDienHoa } from '../../core/world/dienHoa.js';
import { THO_BOI_DAP, NHAN_THO, MO_TA_THO } from '../../core/world/boiDap.js';
import type { ThoBoiDap } from '../../core/world/boiDap.js';
import { NHAN_VAI_TU, VAI_TU } from '../../core/world/tuVung.js';
import { LOAI_HAU_TRUONG, NHAN_LOAI_HAU_TRUONG } from '../../core/world/hauTruong.js';
import { nut, nhanNho, the, oNhap } from '../design/kieu.js';

const NHAN_NHIP: Readonly<Record<NhipDienHoa, string>> = Object.freeze({
  nien: 'Niên — một năm',
  the_dai: 'Thế đại — ba mươi năm',
  vinh_kiep: 'Vĩnh kiếp — một thế kỷ',
});

/**
 * Mười một điều kiện dừng của 47.3, viết lại thành câu người đọc được.
 *
 * Bảng đầy đủ chứ không có nhánh `?? dk`: một id lọt lên giao diện là đúng thứ
 * cổng "không raw id/enum" của Phase 11 bắt được, và `Record` đầy đủ làm
 * TypeScript bắt hộ ngay lúc ai đó thêm điều kiện thứ mười hai.
 */
const NHAN_DUNG: Readonly<Record<DieuKienDungDienHoa, string>> = Object.freeze({
  het_luot: 'Hết số lượt đã đặt',
  can_ngan_sach: 'Cạn ngân sách call hoặc token',
  reality_tut_qua_20: 'Thực tại tụt quá 20 điểm',
  mach_dat_cao_trao: 'Một mạch truyện lên cao trào',
  nhan_vat_nguoi_choi_lam_nguy: 'Nhân vật của bạn lâm nguy',
  ke_thu_troi_day: 'Một kẻ thù trỗi dậy',
  ky_vong_lorebook_bi_lech: 'Một kỳ vọng lorebook bị lệch',
  co_che_moi_xuat_hien: 'Một cơ chế mới xuất hiện',
  luat_nen_duoc_dat_ten: 'Một trục Luật Nền được đặt tên',
  than_mat_domain: 'Một vị thần mất domain',
  phuc_but_qua_han: 'Một phục bút đã quá hạn',
});

// ─────────────────────────────────────────── mảnh dựng chung

const tieuDeKhoi: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--chu-than)',
  fontSize: 17,
  fontWeight: 500,
  letterSpacing: '-0.01em',
  color: 'var(--sang)',
};

const soLieu: React.CSSProperties = { fontFamily: 'var(--chu-so)', fontVariantNumeric: 'tabular-nums' };

function Khoi({
  ten,
  phu,
  ghiChu,
  children,
}: {
  ten: string;
  phu?: string;
  /** Dòng nhỏ ở đáy khối — thường là lằn ranh cứng. */
  ghiChu?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section style={{ ...the, display: 'grid', gap: 14, padding: '18px 18px 16px' }}>
      <header style={{ display: 'grid', gap: 3 }}>
        <h2 style={tieuDeKhoi}>{ten}</h2>
        {phu !== undefined && (
          <p style={{ margin: 0, color: 'var(--mo)', fontSize: 12.5, lineHeight: 1.5 }}>{phu}</p>
        )}
      </header>
      {children}
      {ghiChu !== undefined && (
        <p
          style={{
            margin: 0,
            paddingTop: 10,
            borderTop: '1px solid var(--kinh-vien)',
            fontSize: 11.5,
            color: 'var(--mo)',
          }}
        >
          {ghiChu}
        </p>
      )}
    </section>
  );
}

/** Ô nhập số có nhãn, dùng ở cả ba khối — bốn bản chép tay thành một. */
function O({
  nhan,
  giaTri,
  min,
  max,
  tat,
  doi,
  phu,
}: {
  nhan: string;
  giaTri: number;
  min: number;
  max: number;
  tat?: boolean;
  doi: (v: number) => void;
  phu?: string;
}): JSX.Element {
  return (
    <label style={{ display: 'grid', gap: 4, alignContent: 'start' }}>
      <span style={nhanNho}>{nhan}</span>
      <input
        style={{ ...oNhap, ...soLieu, opacity: tat === true ? 0.45 : 1 }}
        type="number"
        min={min}
        max={max}
        value={giaTri}
        disabled={tat === true}
        onChange={(e) => doi(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
      />
      {phu !== undefined && <span style={{ fontSize: 11, color: 'var(--mo)' }}>{phu}</span>}
    </label>
  );
}

function ChonNhip({
  nhan,
  giaTri,
  tat,
  doi,
}: {
  nhan: string;
  giaTri: NhipDienHoa;
  tat?: boolean;
  doi: (v: NhipDienHoa) => void;
}): JSX.Element {
  return (
    <label style={{ display: 'grid', gap: 4, alignContent: 'start' }}>
      <span style={nhanNho}>{nhan}</span>
      <select
        style={{ ...oNhap, opacity: tat === true ? 0.45 : 1 }}
        value={giaTri}
        disabled={tat === true}
        onChange={(e) => doi(e.target.value as NhipDienHoa)}
      >
        {NHIP_DIEN_HOA.map((n) => (
          <option key={n} value={n}>
            {NHAN_NHIP[n]}
          </option>
        ))}
      </select>
    </label>
  );
}

const luoi = (rong = 190): React.CSSProperties => ({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: `repeat(auto-fit,minmax(${rong}px,1fr))`,
});

/**
 * Thanh đo có CHỮ đi kèm — [BB] luật bất biến #9 cấm dấu hiệu chỉ bằng hình.
 * Thanh là phần đọc nhanh; con số bên cạnh mới là phần đọc đúng.
 */
function Thanh({ phanTram, nhan }: { phanTram: number; nhan: string }): JSX.Element {
  const p = Math.max(0, Math.min(100, phanTram));
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--tro)' }}>{nhan}</span>
        <span style={{ ...soLieu, color: 'var(--mo)' }}>{Math.round(p)}%</span>
      </div>
      <div
        aria-hidden
        style={{ height: 3, background: 'var(--kinh-vien)', borderRadius: 2, overflow: 'hidden' }}
      >
        <div style={{ width: `${p}%`, height: '100%', background: 'var(--dong)' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── màn

export function XuongWorkflow(): JSX.Element {
  const state = useGame((s) => s.state);
  const chay = useGame((s) => s.chayDienHoa);
  const dung = useGame((s) => s.dungDienHoa);
  const dangChay = useGame((s) => s.dangDienHoa);
  const tienDo = useGame((s) => s.tienDoDienHoa);
  const baoCao = useGame((s) => s.baoCaoDienHoa);
  const vet = useGame((s) => s.vetDuongOng);
  const tuDienHoa = useGame((s) => s.tuDienHoa);
  const ongKinh = useGame((s) => s.ongKinh);
  const datTuDienHoa = useGame((s) => s.datTuDienHoa);
  const doDoDang = useGame((s) => s.doDoDangTheGioi);
  const khoTu = useGame((s) => s.khoTuHienTai);
  const soHauTruong = useGame((s) => s.soHauTruongHienTai);
  const dangMoPhong = useGame((s) => s.dangMoPhongHauTruong);
  const conLuot = useGame((s) => s.conLuotToiNhipNen);
  const cong = useAi((s) => s.cong());
  /**
   * Điểm cuối Diễn Hóa có bật riêng và có đủ địa chỉ + model không.
   *
   * Kiểm ở đây để nói TRƯỚC, không để người chơi bấm "Chạy Diễn Hóa" rồi tự hỏi
   * vì sao bảy tác vụ không chạy cái nào — [BB] 44.5 cùng tinh thần: phải nói rõ
   * còn thiếu gì.
   */
  const workflowBat = useAi(
    (s) =>
      s.cfg.workflow.batRieng &&
      s.cfg.workflow.proxyUrl.trim() !== '' &&
      s.cfg.workflow.modelId.trim() !== '',
  );

  const [presetId, setPresetId] = useState('engine_hau_truong');
  const [nhip, setNhip] = useState<NhipDienHoa>('nien');
  const [soLuot, setSoLuot] = useState(20);
  const [dieuKien, setDieuKien] = useState<readonly DieuKienDungDienHoa[]>([...DIEU_KIEN_DUNG_DIEN_HOA]);
  const [tho, setTho] = useState<readonly ThoBoiDap[]>([...THO_BOI_DAP]);
  const [hanMucBoiDap, setHanMucBoiDap] = useState(3);
  /**
   * Số lần hỏi model của thợ Bồi Đắp thứ bảy — cho CẢ lần chạy, không mỗi lượt.
   *
   * State cục bộ như mọi tùy chọn khác của khối này: nó là một quyết định cho
   * lần bấm sắp tới, không phải một cấu hình của ván. Nhịp nền có `datTuDienHoa`
   * vì nó chạy sau lưng người chơi; cái này chỉ chạy khi họ bấm.
   */
  const [soCallAi, setSoCallAi] = useState(1);

  const preset = PRESET_WORKFLOW[presetId] ?? PRESET_WORKFLOW['trong'];
  const lanRanh = useMemo(() => (preset ? kiemLanRanh(preset) : null), [preset]);

  /**
   * Một lần quét đường ống tốn bao nhiêu call — [BB] 71.6, nói TRƯỚC khi bấm.
   *
   * Con số này không nhỏ và không được phép gây bất ngờ: tác vụ "Hành động NPC"
   * bật họ bản sao với `gioiHan` ba mươi, nên riêng nó đã là ba mươi call. Một
   * người bật mô phỏng hậu trường mà không biết điều đó sẽ biết qua hóa đơn.
   *
   * Ước lượng theo SỐ NHÂN VẬT ĐANG SỐNG chứ không theo `gioiHan` suông: một
   * thế giới có bốn người thì tác vụ ấy tốn bốn call, và nói ba mươi là dọa.
   */
  const uocCallQuet = (id: string): number => {
    const p = PRESET_WORKFLOW[id];
    if (p === undefined || state === null) return 0;
    const soNhanVat = [...state.entities.values()].filter(
      (e) => e.tickDiet === null && (e.kind === 'mortal' || e.kind === 'deity'),
    ).length;
    return p.tasks
      .filter((t) => t.bat)
      .reduce((t, x) => t + (x.hoBanSao.bat ? Math.max(1, Math.min(x.hoBanSao.gioiHan, soNhanVat)) : 1), 0);
  };

  /**
   * Chi phí hiện TRƯỚC khi bấm — [BB] 71.6.
   *
   * Cấu hình quá sức phải nói ra ở đây, chứ không để người chơi bấm rồi ngồi
   * nhìn tab đứng hình. Đây là nửa giao diện của phép sửa lỗi "Diễn Hóa treo".
   */
  const uoc = useMemo(
    () => uocLuongDienHoa(CauHinhDienHoaSchema.parse({ soLuot, nhipMoiLuot: nhip })),
    [soLuot, nhip],
  );

  // Đọc mỗi lần render: cả ba chỉ duyệt state đang có, và state đổi mỗi lượt.
  const doDang = state === null ? null : doDoDang();
  const kho = state === null ? null : khoTu();
  const so = state === null ? null : soHauTruong();
  const nhipNenHieuLuc =
    state === null ? null : tinhNhipNenHieuLuc(state, tuDienHoa, ongKinh.dangChieu.loai === 'mach');

  const batDieuKien = (dk: DieuKienDungDienHoa, bat: boolean): void => {
    setDieuKien(bat ? [...dieuKien, dk] : dieuKien.filter((x) => x !== dk));
  };
  const batTho = (t: ThoBoiDap, bat: boolean): void => {
    setTho(bat ? [...tho, t] : tho.filter((x) => x !== t));
  };

  const chuaMoVan = (
    <p style={{ margin: 0, color: 'var(--mo)', fontSize: 13 }}>
      Chưa mở ván nào. Cả ba thứ ở màn này chạy trên một thế giới cụ thể.
    </p>
  );

  return (
    <main
      style={{
        maxWidth: 940,
        margin: '0 auto',
        padding: '28px 22px 80px',
        display: 'grid',
        gap: 18,
        // Màn công cụ: chữ Thân từ trên xuống, không mượn chữ của lời kể.
        fontFamily: 'var(--chu-than)',
      }}
    >
      <header style={{ display: 'grid', gap: 5 }}>
        <p style={nhanNho}>KHỐI N · PHẦN 50 · PHẦN 47</p>
        <h1
          style={{
            fontFamily: 'var(--chu-than)',
            fontSize: 26,
            margin: 0,
            fontWeight: 500,
            letterSpacing: '-0.02em',
          }}
        >
          Xưởng Workflow
        </h1>
        <p style={{ color: 'var(--tro)', margin: 0, fontSize: 13, lineHeight: 1.55, maxWidth: 640 }}>
          Đây là thứ chạy khi bạn không gõ gì. Nhịp nền quyết bao lâu thế giới tự đi một bước; Diễn Hóa quyết
          một lần tua chạy bao xa; Đường ống quyết phần nào trong đó cần tới model.
        </p>
      </header>

      {/* ── 1. nhịp nền ── */}
      <Khoi
        ten="Nhịp nền"
        phu="Thế giới đi tiếp một nhịp của riêng nó sau lượt bạn kể, không cần bấm gì. Phần engine miễn phí; phần mô phỏng hậu trường có gọi model."
        ghiChu="Mỗi việc nhịp nền làm đều ghi một dòng vào khung kể — thế giới không được phép đi tiếp mà bạn không đọc được."
      >
        {state === null ? (
          chuaMoVan
        ) : (
          <>
            <label
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                fontSize: 13.5,
                padding: '10px 12px',
                background: 'var(--kinh-nen-2)',
                border: '1px solid var(--kinh-vien)',
                borderRadius: 'var(--r-sm)',
              }}
            >
              <input
                type="checkbox"
                checked={tuDienHoa.bat}
                onChange={(e) => datTuDienHoa({ bat: e.target.checked })}
              />
              <span style={{ color: 'var(--sang)' }}>
                {tuDienHoa.bat
                  ? nhipNenHieuLuc?.moiBaoNhieuLuot === 1
                    ? 'Đang chạy sau mỗi lượt kể'
                    : `Đang chạy mỗi ${nhipNenHieuLuc?.moiBaoNhieuLuot ?? tuDienHoa.moiBaoNhieuLuot} lượt — còn ${conLuot()} lượt nữa`
                  : 'Đang tắt — thế giới chỉ đi khi bạn bảo'}
              </span>
            </label>

            <label
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                fontSize: 13.5,
                padding: '10px 12px',
                background: 'var(--kinh-nen-2)',
                border: '1px solid var(--kinh-vien)',
                borderRadius: 'var(--r-sm)',
              }}
            >
              <input
                type="checkbox"
                checked={tuDienHoa.thichUng}
                disabled={!tuDienHoa.bat}
                onChange={(e) => datTuDienHoa({ thichUng: e.target.checked })}
              />
              <span style={{ color: 'var(--sang)' }}>
                {tuDienHoa.thichUng
                  ? `Tự điều tốc: ${nhipNenHieuLuc?.nhan ?? 'đang đọc tuổi thế giới'}`
                  : 'Dùng nhịp cố định do bạn đặt'}
              </span>
            </label>

            <div style={luoi(180)}>
              <O
                nhan="CỨ BAO NHIÊU LƯỢT"
                giaTri={tuDienHoa.moiBaoNhieuLuot}
                min={1}
                max={50}
                tat={!tuDienHoa.bat || tuDienHoa.thichUng}
                doi={(v) => datTuDienHoa({ moiBaoNhieuLuot: v })}
                phu={tuDienHoa.thichUng ? 'tự điều tốc đang quyết định' : '1 = mỗi lượt kể'}
              />
              <ChonNhip
                nhan="NHỊP"
                giaTri={tuDienHoa.nhip}
                tat={!tuDienHoa.bat || tuDienHoa.thichUng}
                doi={(v) => datTuDienHoa({ nhip: v })}
              />
              <O
                nhan="SỐ LƯỢT MỖI LẦN"
                giaTri={tuDienHoa.soLuot}
                min={1}
                max={12}
                tat={!tuDienHoa.bat || tuDienHoa.thichUng}
                doi={(v) => datTuDienHoa({ soLuot: v })}
                phu={tuDienHoa.thichUng ? 'tự giảm dần theo tuổi thế giới' : 'thế giới đi bao xa mỗi lần'}
              />
              <O
                nhan="VIỆC BỒI ĐẮP"
                giaTri={tuDienHoa.hanMucBoiDap}
                min={0}
                max={10}
                tat={!tuDienHoa.bat}
                doi={(v) => datTuDienHoa({ hanMucBoiDap: v })}
                phu="0 = chỉ chạy engine"
              />
            </div>

            {/* ── mô phỏng hậu trường: phần duy nhất của nhịp nền có tốn tiền ── */}
            <label
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                fontSize: 13.5,
                padding: '10px 12px',
                background: 'var(--kinh-nen-2)',
                border: '1px solid var(--kinh-vien)',
                borderRadius: 'var(--r-sm)',
              }}
            >
              <input
                type="checkbox"
                checked={tuDienHoa.workflow.bat}
                disabled={!tuDienHoa.bat}
                onChange={(e) => datTuDienHoa({ workflow: { ...tuDienHoa.workflow, bat: e.target.checked } })}
              />
              <span style={{ color: 'var(--sang)' }}>
                {tuDienHoa.workflow.bat
                  ? dangMoPhong
                    ? 'Đang mô phỏng hậu trường…'
                    : 'Mô phỏng hậu trường bằng model sau mỗi nhịp nền'
                  : 'Mô phỏng hậu trường đang tắt — nhịp nền chỉ chạy engine'}
              </span>
            </label>

            <div style={luoi(180)}>
              <label style={{ display: 'grid', gap: 4, alignContent: 'start' }}>
                <span style={nhanNho}>ĐƯỜNG ỐNG CHẠY NGẦM</span>
                <select
                  style={{ ...oNhap, opacity: tuDienHoa.bat && tuDienHoa.workflow.bat ? 1 : 0.45 }}
                  value={tuDienHoa.workflow.presetId}
                  disabled={!tuDienHoa.bat || !tuDienHoa.workflow.bat}
                  onChange={(e) =>
                    datTuDienHoa({ workflow: { ...tuDienHoa.workflow, presetId: e.target.value } })
                  }
                >
                  {Object.entries(PRESET_WORKFLOW).map(([id, p]) => (
                    <option key={id} value={id}>
                      {p.ten}
                    </option>
                  ))}
                </select>
              </label>
              <O
                nhan="GHI CHÚ MỖI TÁC VỤ"
                giaTri={tuDienHoa.workflow.soGhiChuMoiTacVu}
                min={1}
                max={12}
                tat={!tuDienHoa.bat || !tuDienHoa.workflow.bat}
                doi={(v) => datTuDienHoa({ workflow: { ...tuDienHoa.workflow, soGhiChuMoiTacVu: v } })}
                phu="trần rút ra từ một output"
              />
              <O
                nhan="DỆT MỖI LƯỢT KỂ"
                giaTri={tuDienHoa.soGhiChuMoiLuotKe}
                min={0}
                max={8}
                tat={!tuDienHoa.bat}
                doi={(v) => datTuDienHoa({ soGhiChuMoiLuotKe: v })}
                phu="0 = giữ sổ, không dệt"
              />
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.6,
                color: tuDienHoa.workflow.bat ? 'var(--tro)' : 'var(--mo)',
              }}
            >
              Một lần quét tốn khoảng <span style={soLieu}>{uocCallQuet(tuDienHoa.workflow.presetId)}</span>{' '}
              lượt gọi model — tác vụ &quot;Hành động NPC&quot; chạy một call cho mỗi nhân vật, nên con số lớn
              dần theo thế giới. Ở nhịp <span style={soLieu}>{tuDienHoa.moiBaoNhieuLuot}</span> lượt, đó là
              khoảng{' '}
              <span style={soLieu}>
                {(uocCallQuet(tuDienHoa.workflow.presetId) / Math.max(1, tuDienHoa.moiBaoNhieuLuot)).toFixed(
                  1,
                )}
              </span>{' '}
              call cho mỗi lượt bạn kể.
            </p>

            <label style={{ display: 'flex', gap: 9, alignItems: 'start', fontSize: 12.5 }}>
              <input
                type="checkbox"
                style={{ marginTop: 3 }}
                checked={tuDienHoa.workflow.epChayHet}
                disabled={!tuDienHoa.bat || !tuDienHoa.workflow.bat}
                onChange={(e) =>
                  datTuDienHoa({ workflow: { ...tuDienHoa.workflow, epChayHet: e.target.checked } })
                }
              />
              <span>
                <b style={{ color: 'var(--sang)', fontWeight: 500 }}>Ép mọi tác vụ chạy</b>
                <span style={{ color: 'var(--mo)' }}>
                  {' '}
                  — bỏ qua lịch riêng của từng tác vụ. Tắt nó thì tác vụ chạy cuối kỷ nguyên gần như không bao
                  giờ chạy, vì bản thân nhịp nền đã thưa.
                </span>
              </span>
            </label>
          </>
        )}
      </Khoi>

      {/* ── 1b. Sổ Hậu Trường ── */}
      {state !== null && so !== null && (
        <Khoi
          ten="Sổ Hậu Trường"
          phu="Những gì đường ống đã mô phỏng mà chính văn chưa kể. Chúng xếp hàng ở đây và được dệt dần vào cảnh, vài điều một lượt."
          ghiChu={`Sổ giữ tối đa ${so.thongKe.tran} ghi chú. Khi đầy, thứ bị bỏ là ghi chú ĐÃ kể cũ nhất — một chuyện chưa ai nghe thì chưa xong việc của nó.`}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            <Thanh
              phanTram={
                so.thongKe.tong === 0 ? 0 : ((so.thongKe.tong - so.thongKe.chuaKe) / so.thongKe.tong) * 100
              }
              nhan={`Đã lên chính văn · ${so.thongKe.tong - so.thongKe.chuaKe}/${so.thongKe.tong} chuyện`}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11.5 }}>
              {LOAI_HAU_TRUONG.map((l) => (
                <span
                  key={l}
                  style={{
                    padding: '2px 8px',
                    border: '1px solid var(--kinh-vien)',
                    borderRadius: 999,
                    color: 'var(--mo)',
                  }}
                >
                  {NHAN_LOAI_HAU_TRUONG[l]} <span style={soLieu}>{so.thongKe.theoLoai[l]}</span>
                </span>
              ))}
            </div>

            {so.sapKe.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mo)', lineHeight: 1.6 }}>
                Chưa có chuyện nào đang chờ. Sổ đầy lên mỗi lần nhịp nền chạy mô phỏng hậu trường, hoặc mỗi
                lần Diễn Hóa chạy đường ống.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 5 }}>
                <span style={nhanNho}>ĐANG XẾP HÀNG CHỜ ĐƯỢC KỂ</span>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4, fontSize: 12.5 }}>
                  {so.sapKe.map((g) => (
                    <li key={g.id} style={{ color: 'var(--tro)' }}>
                      <span style={{ ...soLieu, color: 'var(--mo)' }}>nhịp {g.tick}</span>{' '}
                      <span style={{ color: 'var(--mo)' }}>· {NHAN_LOAI_HAU_TRUONG[g.loai]} ·</span>{' '}
                      {g.noiDung}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Khoi>
      )}

      {/* ── 2. thế giới dày lên: độ dở dang + Kho Từ ── */}
      {state !== null && doDang !== null && kho !== null && (
        <Khoi
          ten="Thế giới đang dày lên"
          phu="Bồi Đắp lấp những chỗ thế giới còn dở dang, và nó đặt tên bằng vốn từ mà chính thế giới này đã học được."
          ghiChu={`Kho Từ có trần ${kho.thongKe.tran} chữ. Chữ đã có, hoặc gần giống một chữ đã có, đều bị từ chối — nếu không thì "Vô Thủy" sẽ đẻ ra "Vô Thúy", "Vô Thủ", "Vô Thuy".`}
        >
          <div
            style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}
          >
            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <Thanh phanTram={100 - doDang.diem} nhan="Đã hoàn thiện" />
              {doDang.thieu.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--tro)' }}>
                  Không còn chỗ nào Bồi Đắp lấp được. Phần còn lại là việc của bạn và của model.
                </p>
              ) : (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 16,
                    fontSize: 12.5,
                    color: 'var(--tro)',
                    display: 'grid',
                    gap: 3,
                  }}
                >
                  {doDang.thieu.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <Thanh
                phanTram={(kho.thongKe.tong / kho.thongKe.tran) * 100}
                nhan={`Kho Từ · ${kho.thongKe.tong}/${kho.thongKe.tran} chữ`}
              />
              <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)' }}>
                <span style={soLieu}>{kho.thongKe.tuGoc}</span> chữ có từ lúc khai thiên ·{' '}
                <span style={{ ...soLieu, color: 'var(--dong)' }}>{kho.thongKe.tuTheGioi}</span> chữ thế giới
                tự học
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11.5 }}>
                {VAI_TU.map((v) => (
                  <span
                    key={v}
                    style={{
                      padding: '2px 8px',
                      border: '1px solid var(--kinh-vien)',
                      borderRadius: 999,
                      color: 'var(--mo)',
                    }}
                  >
                    {NHAN_VAI_TU[v]} <span style={soLieu}>{kho.thongKe.theoVai[v]}</span>
                  </span>
                ))}
              </div>
              {kho.moiNhat.length > 0 && (
                <div style={{ display: 'grid', gap: 4 }}>
                  <span style={nhanNho}>CHỮ HỌC GẦN ĐÂY</span>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--tro)', lineHeight: 1.7 }}>
                    {kho.moiNhat.map((x) => x.tu).join(' · ')}
                  </p>
                </div>
              )}
              {kho.moiNhat.length === 0 && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)', lineHeight: 1.6 }}>
                  Thế giới chưa học chữ nào của riêng nó. Nó học từ hai chỗ: những cái tên mà lời kể đặt ra,
                  và thợ Bồi Đắp thứ bảy ở khối Diễn Hóa bên dưới — người duy nhất trong xưởng có hỏi model.
                </p>
              )}
            </div>
          </div>
        </Khoi>
      )}

      {/* ── 3. Diễn Hóa thủ công ── */}
      <Khoi
        ten="Diễn Hóa"
        phu="Tua thế giới nhiều nhịp liền, và dừng khi có chuyện đáng xem chứ không khi hết lượt."
        ghiChu={`Diễn Hóa không bao giờ ghi vào: ${BANG_CAM_DIEN_HOA.join(' · ')}.`}
      >
        {state === null ? (
          chuaMoVan
        ) : (
          <>
            <div style={luoi(180)}>
              <ChonNhip nhan="NHỊP MỖI LƯỢT" giaTri={nhip} doi={setNhip} />
              <O nhan="SỐ LƯỢT TỐI ĐA" giaTri={soLuot} min={1} max={500} doi={setSoLuot} />
              <O
                nhan="VIỆC BỒI ĐẮP MỖI LƯỢT"
                giaTri={hanMucBoiDap}
                min={0}
                max={20}
                doi={setHanMucBoiDap}
                phu="0 = tắt Bồi Đắp"
              />
              <O
                nhan="CALL AI CHO BỒI ĐẮP"
                giaTri={soCallAi}
                min={0}
                max={5}
                tat={hanMucBoiDap === 0}
                doi={setSoCallAi}
                phu="cho cả lần chạy · 0 = không tốn đồng nào"
              />
            </div>

            <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)', lineHeight: 1.6 }}>
              Sáu thợ đầu chạy bằng engine và miễn phí, nhưng chúng chỉ ghép lại vốn từ đã có — thế giới không
              học thêm được chữ nào từ chính nó. Thợ thứ bảy hỏi model, và đó là chỗ duy nhất chữ mới đi vào
              Kho Từ. Nó chạy một lần cho cả lần tua, không phải mỗi lượt một lần.
            </p>

            <details style={{ fontSize: 13 }}>
              <summary style={{ cursor: 'pointer', color: 'var(--tro)' }}>
                Sáu thợ Bồi Đắp — <span style={soLieu}>{tho.length}</span>/{THO_BOI_DAP.length} đang bật
              </summary>
              <div style={{ display: 'grid', gap: 8, paddingTop: 10 }}>
                {THO_BOI_DAP.map((t) => (
                  <label key={t} style={{ display: 'flex', gap: 9, alignItems: 'start', fontSize: 12.5 }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 3 }}
                      checked={tho.includes(t)}
                      onChange={(e) => batTho(t, e.target.checked)}
                    />
                    <span>
                      <b style={{ color: 'var(--sang)', fontWeight: 500 }}>{NHAN_THO[t]}</b>
                      <span style={{ color: 'var(--mo)' }}> — {MO_TA_THO[t]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </details>

            <details style={{ fontSize: 13 }}>
              <summary style={{ cursor: 'pointer', color: 'var(--tro)' }}>
                Điều kiện dừng — <span style={soLieu}>{dieuKien.length}</span>/
                {DIEU_KIEN_DUNG_DIEN_HOA.length} đang bật
              </summary>
              <div
                style={{
                  display: 'grid',
                  gap: 5,
                  paddingTop: 10,
                  gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
                }}
              >
                {DIEU_KIEN_DUNG_DIEN_HOA.map((dk) => (
                  <label key={dk} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
                    <input
                      type="checkbox"
                      checked={dieuKien.includes(dk)}
                      onChange={(e) => batDieuKien(dk, e.target.checked)}
                    />
                    <span style={{ color: 'var(--tro)' }}>{NHAN_DUNG[dk]}</span>
                  </label>
                ))}
              </div>
            </details>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={nut(true, dangChay || !cong.choPhepChoi || uoc.quaTran)}
                disabled={dangChay || !cong.choPhepChoi || uoc.quaTran}
                onClick={() =>
                  void chay({
                    soLuot,
                    nhipMoiLuot: nhip,
                    dieuKienDung: [...dieuKien],
                    boiDap: {
                      bat: hanMucBoiDap > 0,
                      hanMucMoiLuot: hanMucBoiDap,
                      tho: [...tho],
                      soCallAi,
                    },
                    presetId,
                  })
                }
              >
                {dangChay ? 'Đang diễn hóa…' : 'Chạy Diễn Hóa'}
              </button>
              {/* Nút dừng chỉ có nghĩa khi có gì để dừng — và nó có CHỮ, không chỉ có màu. */}
              {dangChay && (
                <button type="button" style={nut(false)} onClick={() => dung()}>
                  Dừng lại
                </button>
              )}
            </div>

            {dangChay && tienDo !== null ? (
              <div style={{ display: 'grid', gap: 6 }}>
                <Thanh
                  phanTram={(tienDo.luot / Math.max(1, tienDo.tongLuot)) * 100}
                  nhan={`Lượt ${tienDo.luot}/${tienDo.tongLuot}`}
                />
                <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)' }}>
                  Đang ở nhịp <span style={soLieu}>{tienDo.tick}</span> · đã bồi đắp{' '}
                  <span style={soLieu}>{tienDo.viecDaLam}</span> chỗ.
                </p>
              </div>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: uoc.quaTran ? 'var(--hoi)' : 'var(--mo)',
                  lineHeight: 1.55,
                }}
              >
                {uoc.quaTran
                  ? uoc.loiTuChoi
                  : !cong.choPhepChoi
                    ? 'Cổng AI chưa mở — Diễn Hóa cần model để kể lại đoạn vừa tua.'
                    : `Từ nhịp ${state.world.tick} · ${uoc.soTick} nhịp · ${uoc.soBuoc} bước engine · ` +
                      /*
                       * Số call nói TRƯỚC khi bấm, và nói đủ cả ba nguồn — [BB] 71.6.
                       * Một lượt kể cuối là bắt buộc, thợ Bồi Đắp AI là tùy chọn, và
                       * đường ống là thứ đắt nhất vì nó nhân với số lượt.
                       */
                      `ít nhất ${1 + (hanMucBoiDap > 0 ? soCallAi : 0)} call · ` +
                      (workflowBat
                        ? `cộng đường ống "${preset?.ten ?? ''}" chạy sau mỗi lượt.`
                        : 'endpoint Diễn Hóa chưa bật, lượt tua chạy bằng engine.')}
              </p>
            )}
          </>
        )}
      </Khoi>

      {/* ── 4. đường ống tác vụ ── */}
      <Khoi
        ten="Đường ống tác vụ"
        phu="Phần duy nhất ở màn này có gọi model. Mỗi tác vụ có model, nhịp và ngữ cảnh riêng — gộp hết vào một call là chọn model tệ nhất cho việc khó nhất."
        ghiChu={`Không tác vụ nào ghi được vào: ${DUONG_DAN_CAM_WORKFLOW.join(' · ')}.`}
      >
        <label style={{ display: 'grid', gap: 4, maxWidth: 420 }}>
          <span style={nhanNho}>PRESET</span>
          <select style={oNhap} value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {Object.entries(PRESET_WORKFLOW).map(([id, p]) => (
              <option key={id} value={id}>
                {p.ten} — {p.moTa}
              </option>
            ))}
          </select>
        </label>

        {preset && preset.tasks.length === 0 && (
          <p style={{ margin: 0, color: 'var(--mo)', fontSize: 12.5 }}>
            Preset rỗng. Thế giới vẫn chạy bằng mười tám tiến trình nền của engine — workflow chỉ thêm phần
            cần model.
          </p>
        )}

        {preset && preset.tasks.length > 0 && (
          <details style={{ fontSize: 13 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--tro)' }}>
              <span style={soLieu}>{preset.tasks.length}</span> tác vụ trong đường ống
            </summary>
            <ol style={{ margin: '10px 0 0', paddingLeft: 20, display: 'grid', gap: 5, fontSize: 12.5 }}>
              {preset.tasks.map((t) => (
                <li key={t.id} style={{ color: 'var(--tro)' }}>
                  <b style={{ color: 'var(--sang)', fontWeight: 500 }}>{t.ten}</b>
                  <span style={{ color: 'var(--mo)' }}>
                    {' '}
                    · giai đoạn {t.giaiDoan} · {t.nhomPrompt.length} nhóm prompt · thử lại {t.soLanThuLai} lần
                    · {t.dichGhi.length} đích ghi {t.bat ? '· đang bật' : '· đang tắt'}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        )}

        {lanRanh !== null && !lanRanh.dat && (
          <div style={{ display: 'grid', gap: 5 }}>
            <span style={nhanNho}>LẰN RANH CỨNG · 50.10</span>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--hoi)' }}>
              Preset này vi phạm {lanRanh.loi.length} lằn ranh và sẽ không được nạp.
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--tro)' }}>
              {lanRanh.loi.slice(0, 8).map((l, i) => (
                <li key={`${l.code}-${i}`}>
                  <span style={soLieu}>{l.code}</span> — {l.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {vet.length > 0 && (
          <div style={{ display: 'grid', gap: 6 }}>
            <span style={nhanNho}>ĐƯỜNG ỐNG Ở LẦN CHẠY GẦN NHẤT</span>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--mo)' }}>
                    <th style={{ padding: '3px 8px 3px 0', fontWeight: 400 }}>Giai đoạn</th>
                    <th style={{ padding: '3px 8px 3px 0', fontWeight: 400 }}>Tác vụ</th>
                    <th style={{ padding: '3px 8px 3px 0', fontWeight: 400 }}>Trạng thái</th>
                    <th style={{ padding: '3px 8px 3px 0', fontWeight: 400 }}>Call</th>
                    <th style={{ padding: '3px 0', fontWeight: 400 }}>Ký tự ra</th>
                  </tr>
                </thead>
                <tbody>
                  {vet.slice(-30).map((v, i) => (
                    <tr key={`${v.taskId}-${i}`} style={{ borderTop: '1px solid var(--kinh-vien)' }}>
                      <td style={{ padding: '4px 8px 4px 0', ...soLieu }}>{v.giaiDoan}</td>
                      <td style={{ padding: '4px 8px 4px 0', color: 'var(--sang)' }}>{v.taskId}</td>
                      <td style={{ padding: '4px 8px 4px 0', color: 'var(--tro)' }}>
                        {v.chay
                          ? v.thatBai > 0
                            ? `chạy, ${v.thatBai} call hỏng`
                            : 'chạy xong'
                          : `bỏ lượt — ${v.lyDo}`}
                      </td>
                      <td style={{ padding: '4px 8px 4px 0', ...soLieu }}>{v.soCall}</td>
                      <td style={{ padding: '4px 0', ...soLieu }}>{v.soKyTuRa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Khoi>

      {/* ── 5. báo cáo ── */}
      {baoCao !== null && baoCao.boiDap.length > 0 && (
        <Khoi
          ten="Thế giới dày thêm"
          phu="Những chỗ Bồi Đắp đã lấp trong lần chạy gần nhất — chữ mới, địa danh, nhân vật, đường sá, mối nối."
        >
          <ol style={{ margin: 0, paddingLeft: 30, display: 'grid', gap: 5, fontSize: 12.5 }}>
            {baoCao.boiDap.map((b, i) => (
              <li key={`${b.tick}-${i}`} style={{ color: 'var(--tro)' }}>
                <span style={{ ...soLieu, color: 'var(--mo)' }}>nhịp {b.tick}</span> — {b.moTa}
              </li>
            ))}
          </ol>
        </Khoi>
      )}

      {baoCao !== null && (
        <Khoi ten="Báo Cáo Diễn Hóa" phu="Viết bằng giọng biên niên sử, không phải giọng log.">
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--chu-so)',
              fontSize: 11.5,
              lineHeight: 1.7,
              color: 'var(--tro)',
              overflowX: 'auto',
            }}
          >
            {baoCao.dong.join('\n')}
          </pre>
        </Khoi>
      )}
    </main>
  );
}
