/**
 * Xưởng Workflow và Diễn Hóa — Phần 50.8, 50.10, 50.12, 47.
 *
 * ── Một trong bốn màn còn nợ từ Phase 11 ──
 *
 * Hai thứ nằm chung một màn vì chúng là hai đầu của cùng một câu hỏi: *thế giới
 * tự chạy tiếp thế nào khi người chơi không gõ gì.* Workflow quyết **việc gì**
 * được làm; Diễn Hóa quyết **chạy bao xa rồi dừng ở đâu**.
 *
 * ── [BB] 50.10 — lằn ranh không phải một lời dặn ──
 *
 * `kiemLanRanh()` chạy TRƯỚC khi một preset được coi là dùng được, và kết quả
 * của nó hiện thẳng ở đây. Sáu bảng trong `DUONG_DAN_CAM_WORKFLOW` không tác vụ
 * nào chạm được, kể cả tác vụ cuối chuỗi: Luật Nền, tuning, nhánh, cấu hình AI
 * và hồ sơ người chơi.
 *
 * ── [BB] 47.5 — có ảnh chụp trước khi tua ──
 *
 * Diễn Hóa ghi `anhChup` (hash state) vào `EvolutionLog` trước khi chạy. Không
 * có nút lùi thì một tính năng tua trăm năm đáng sợ hơn đáng dùng.
 */
import { useMemo, useState } from 'react';
import { useGame } from '../../store/game.js';
import { useAi } from '../../store/ai.js';
import { PRESET_WORKFLOW, DUONG_DAN_CAM_WORKFLOW, kiemLanRanh } from '../../core/workflow/dungSan.js';
import { NHIP_DIEN_HOA, DIEU_KIEN_DUNG_DIEN_HOA, BANG_CAM_DIEN_HOA } from '../../core/world/dienHoa.js';
import type { NhipDienHoa, DieuKienDungDienHoa } from '../../core/world/dienHoa.js';
import { nut, nhanNho, the, oNhap } from '../design/kieu.js';

const NHAN_NHIP: Readonly<Record<NhipDienHoa, string>> = Object.freeze({
  nien: 'Niên — mỗi lượt một năm',
  the_dai: 'Thế đại — mỗi lượt ba mươi năm',
  vinh_kiep: 'Vĩnh kiếp — mỗi lượt một thế kỷ',
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

function Khoi({ ten, phu, children }: { ten: string; phu?: string; children: React.ReactNode }): JSX.Element {
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <header>
        <h2 style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }}>{ten}</h2>
        {phu !== undefined && <p style={{ margin: '2px 0 0', color: 'var(--mo)', fontSize: 13 }}>{phu}</p>}
      </header>
      {children}
    </section>
  );
}

export function XuongWorkflow(): JSX.Element {
  const state = useGame((s) => s.state);
  const chay = useGame((s) => s.chayDienHoa);
  const dangChay = useGame((s) => s.dangDienHoa);
  const baoCao = useGame((s) => s.baoCaoDienHoa);
  const vet = useGame((s) => s.vetDuongOng);
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

  const preset = PRESET_WORKFLOW[presetId] ?? PRESET_WORKFLOW['trong'];
  const lanRanh = useMemo(() => (preset ? kiemLanRanh(preset) : null), [preset]);

  const batDieuKien = (dk: DieuKienDungDienHoa, bat: boolean): void => {
    setDieuKien(bat ? [...dieuKien, dk] : dieuKien.filter((x) => x !== dk));
  };

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 28 }}>
      <header>
        <p style={nhanNho}>KHỐI N · PHẦN 50 · PHẦN 47</p>
        <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }}>
          Xưởng Workflow
        </h1>
        <p style={{ color: 'var(--tro)', margin: 0, fontSize: 14 }}>
          Đây là thứ chạy khi bạn không gõ gì. Workflow quyết việc gì được làm; Diễn Hóa quyết chạy bao xa rồi
          dừng ở đâu.
        </p>
      </header>

      <Khoi
        ten="Đường ống tác vụ"
        phu="Mỗi tác vụ có model, lượt và ngữ cảnh riêng — gộp hết vào một call là chọn model tệ nhất cho việc khó nhất."
      >
        <label style={{ display: 'grid', gap: 5, maxWidth: 360 }}>
          <span style={nhanNho}>PRESET</span>
          <select style={oNhap} value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {Object.entries(PRESET_WORKFLOW).map(([id, p]) => (
              <option key={id} value={id}>
                {p.ten} — {p.moTa}
              </option>
            ))}
          </select>
        </label>

        {preset && (
          <div style={{ ...the, display: 'grid', gap: 8 }}>
            {preset.tasks.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--mo)', fontSize: 13 }}>
                Preset rỗng. Thế giới vẫn chạy bằng mười hai tiến trình nền của engine — workflow chỉ thêm
                phần cần model.
              </p>
            ) : (
              <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 13 }}>
                {preset.tasks.map((t) => (
                  <li key={t.id} style={{ color: 'var(--tro)' }}>
                    <b style={{ color: 'var(--sang)' }}>{t.ten}</b>{' '}
                    <span style={{ color: 'var(--mo)' }}>
                      · giai đoạn {t.giaiDoan} · {t.nhomPrompt.length} nhóm prompt · thử lại {t.soLanThuLai}{' '}
                      lần · {t.dichGhi.length} đích ghi {t.bat ? '· đang bật' : '· đang tắt'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        <div style={{ ...the, display: 'grid', gap: 6 }}>
          <span style={nhanNho}>LẰN RANH CỨNG · 50.10</span>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--tro)' }}>
            {lanRanh === null || lanRanh.dat
              ? 'Preset này không chạm bảng cấm nào.'
              : `Preset này vi phạm ${lanRanh.loi.length} lằn ranh và sẽ không được nạp.`}
          </p>
          {lanRanh !== null && !lanRanh.dat && (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--tro)' }}>
              {lanRanh.loi.slice(0, 8).map((l, i) => (
                <li key={`${l.code}-${i}`}>
                  <span style={{ fontFamily: 'var(--chu-so)' }}>{l.code}</span> — {l.message}
                </li>
              ))}
            </ul>
          )}
          <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)' }}>
            Không tác vụ nào ghi được vào: {DUONG_DAN_CAM_WORKFLOW.join(' · ')}.
          </p>
        </div>
      </Khoi>

      <Khoi
        ten="Diễn Hóa"
        phu="Tua thế giới nhiều lượt liền, và dừng khi có chuyện đáng xem chứ không khi hết lượt."
      >
        {state === null ? (
          <p style={{ color: 'var(--mo)', fontSize: 13, margin: 0 }}>
            Chưa mở ván nào. Diễn Hóa chạy trên một thế giới cụ thể.
          </p>
        ) : (
          <>
            <div
              style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}
            >
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={nhanNho}>TICK MỖI LƯỢT</span>
                <select style={oNhap} value={nhip} onChange={(e) => setNhip(e.target.value as NhipDienHoa)}>
                  {NHIP_DIEN_HOA.map((n) => (
                    <option key={n} value={n}>
                      {NHAN_NHIP[n]}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={nhanNho}>SỐ LƯỢT TỐI ĐA</span>
                <input
                  style={oNhap}
                  type="number"
                  min={1}
                  max={500}
                  value={soLuot}
                  onChange={(e) => setSoLuot(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                />
              </label>
            </div>

            <fieldset style={{ ...the, border: '1px solid var(--kinh-vien)', display: 'grid', gap: 6 }}>
              <legend style={nhanNho}>DỪNG KHI</legend>
              {DIEU_KIEN_DUNG_DIEN_HOA.map((dk) => (
                <label key={dk} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={dieuKien.includes(dk)}
                    onChange={(e) => batDieuKien(dk, e.target.checked)}
                  />
                  <span style={{ color: 'var(--tro)' }}>{NHAN_DUNG[dk]}</span>
                </label>
              ))}
            </fieldset>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={nut(true, dangChay || !cong.choPhepChoi)}
                disabled={dangChay || !cong.choPhepChoi}
                onClick={() =>
                  void chay({ soLuot, nhipMoiLuot: nhip, dieuKienDung: [...dieuKien], presetId })
                }
              >
                {dangChay ? 'Đang diễn hóa…' : 'Chạy Diễn Hóa'}
              </button>
              <span style={{ ...nhanNho, textTransform: 'none' }}>
                {!cong.choPhepChoi
                  ? 'Cổng AI chưa mở — Diễn Hóa cần model AI để kể chuyện.'
                  : !workflowBat
                    ? `Từ lượt ${state.world.tick}. Endpoint Diễn Hóa chưa bật — lượt tua sẽ chạy bằng engine mặc định, không gọi model.`
                    : `Từ lượt ${state.world.tick}, chạy đường ống "${preset?.ten ?? ''}" sau mỗi lượt.`}
              </span>
            </div>

            {vet.length > 0 && (
              <div style={{ ...the, display: 'grid', gap: 6 }}>
                <span style={nhanNho}>ĐƯỜNG ỐNG Ở LẦN CHẠY GẦN NHẤT</span>
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
                        <td style={{ padding: '4px 8px 4px 0', fontFamily: 'var(--chu-so)' }}>
                          {v.giaiDoan}
                        </td>
                        <td style={{ padding: '4px 8px 4px 0', color: 'var(--sang)' }}>{v.taskId}</td>
                        <td style={{ padding: '4px 8px 4px 0', color: 'var(--tro)' }}>
                          {v.chay
                            ? v.thatBai > 0
                              ? `chạy, ${v.thatBai} call hỏng`
                              : 'chạy xong'
                            : `bỏ lượt — ${v.lyDo}`}
                        </td>
                        <td style={{ padding: '4px 8px 4px 0', fontFamily: 'var(--chu-so)' }}>{v.soCall}</td>
                        <td style={{ padding: '4px 0', fontFamily: 'var(--chu-so)' }}>{v.soKyTuRa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)' }}>
              Diễn Hóa không bao giờ ghi vào: {BANG_CAM_DIEN_HOA.join(' · ')}.
            </p>
          </>
        )}
      </Khoi>

      {baoCao !== null && (
        <Khoi ten="Báo Cáo Diễn Hóa" phu="Viết bằng giọng biên niên sử, không phải giọng log.">
          <pre
            style={{
              ...the,
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--chu-so)',
              fontSize: 12,
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
