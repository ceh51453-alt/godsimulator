/**
 * Xưởng Preset — Phần 66.1 (wizard bảy màn) và 66.2 (báo cáo sau nhập).
 *
 * ── Màn này phải trả lời một câu rất cụ thể ──
 *
 * *"Preset của tôi có đang thật sự chạy không, và phần nào của nó không chạy?"*
 *
 * Trước Phase 11 câu ấy không trả lời được: pack nhập vào rồi biến mất khỏi tầm
 * mắt. Nên màn này có bốn khối, và ba trong số đó tồn tại chỉ để trả lời câu ấy:
 *
 *   Thư viện          pack nào đã nhập, bản nào đang bật
 *   Báo cáo sáu dòng  [BB] 66.2 — KHÔNG dùng một dấu check xanh cho cả file
 *   Đã dùng lượt qua  module nào tới được model, module nào bị cắt
 *   Bị cách ly        script không chạy, VÀ app đã làm thay việc đó bằng gì
 *
 * [BB] 64.2 — khối cuối không có nút bật. Script ngoài không chạy, chấm hết. Thứ
 * nó có là cột "đích native" của 66.6: người dùng cần biết app làm thay việc gì,
 * nếu không họ sẽ đi tìm cách bật script bằng được.
 */
import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { usePreset } from '../../store/preset.js';
import { useGame } from '../../store/game.js';
import { TEN_MAN, issueCuaMan } from '../../core/preset/wizard.js';
import { nhomXungDot } from '../../core/preset/xungDot.js';
import { DUONG_PORT_TINH_NANG } from '../../core/preset/hopNhat.js';
import { Icon } from '../design/Icon.js';

const nhan: CSSProperties = {
  color: 'var(--mo)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};
const so: CSSProperties = { fontSize: 13, color: 'var(--tro)' };
const phu: CSSProperties = { fontSize: 11, color: 'var(--mo)' };

function nut(chinh = false): CSSProperties {
  return {
    background: 'transparent',
    color: chinh ? 'var(--dong)' : 'var(--tro)',
    border: `1px solid ${chinh ? 'var(--dong)' : 'var(--kinh-vien)'}`,
    borderRadius: 'var(--r-sm)',
    padding: '6px 13px',
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
  };
}

export function XuongPreset(): JSX.Element {
  const thuVien = usePreset((s) => s.thuVien);
  const dangBat = usePreset((s) => s.dangBat);
  const bien = usePreset((s) => s.bien);
  const xungDot = usePreset((s) => s.xungDot);
  const wizard = usePreset((s) => s.wizard);
  const baoCao = usePreset((s) => s.baoCao);
  const loiBat = usePreset((s) => s.loiBat);
  const doThu = usePreset((s) => s.doThu);
  const nhapVaoThuVien = usePreset((s) => s.nhapVaoThuVien);
  const dongWizard = usePreset((s) => s.dongWizard);
  const giaiXungDot = usePreset((s) => s.giaiXungDot);
  const bat = usePreset((s) => s.bat);
  const tat = usePreset((s) => s.tat);
  const xoaKhoiThuVien = usePreset((s) => s.xoaKhoiThuVien);

  const state = useGame((s) => s.state);
  const presetTrace = useGame((s) => s.presetTrace);
  const tick = state?.world.tick ?? 0;
  const saveId = state?.world.id ?? 'save';

  const oFile = useRef<HTMLInputElement>(null);
  const [dangDoc, setDangDoc] = useState(false);

  const chonFile = async (f: File | undefined): Promise<void> => {
    if (f === undefined) return;
    setDangDoc(true);
    try {
      // [BB] Luật bất biến #10 — không fetch URL, không chạy helper. Chỉ đọc bytes.
      const noiDung = await f.text();
      doThu(f.name, noiDung, tick);
    } finally {
      setDangDoc(false);
    }
  };

  const kq = wizard.ketQua;

  /*
   * Nhóm xung đột tính từ THƯ VIỆN, không từ wizard.
   *
   * Wizard là một phiên; thư viện thì sống qua lần đóng tab. Đọc từ wizard sẽ
   * làm một pack đã nhập vĩnh viễn không bật được sau khi mở lại app — vì lint
   * vẫn đòi lựa chọn, mà không còn màn nào để chọn.
   */
  const canChon = thuVien
    .filter((r) => dangBat[r.packId] === undefined)
    .flatMap((r) =>
      nhomXungDot(r.pack.modules.filter((m) => m.enabled))
        .filter((n) => n.canNguoiChon)
        .map((n) => ({ row: r, nhom: n })),
    );

  return (
    <main style={{ padding: '22px 24px 60px', maxWidth: 1080, margin: '0 auto' }}>
      <h1 className="chu-hien" style={{ margin: '0 0 4px', fontSize: 26 }}>
        Xưởng Preset
      </h1>
      <p style={{ ...phu, margin: '0 0 22px', maxWidth: 620 }}>
        Nhập không phải là kích hoạt. Lưu được toàn bộ không có nghĩa là được phép chạy toàn bộ.
      </p>

      {/* ── nhập ── */}
      <section className="kinh" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ ...nhan, margin: '0 0 12px' }}>Nhập một file</h2>
        <input
          ref={oFile}
          type="file"
          accept=".json,application/json"
          style={{ position: 'absolute', left: -9999 }}
          id="fileP"
          onChange={(e) => void chonFile(e.target.files?.[0])}
        />
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" style={nut(true)} onClick={() => oFile.current?.click()}>
            {dangDoc ? 'Đang đọc…' : 'Chọn file preset'}
          </button>
          {kq !== null && (
            <>
              <span style={phu}>
                Wizard đang ở màn <strong style={{ color: 'var(--tro)' }}>{TEN_MAN[wizard.man]}</strong>
              </span>
              <button type="button" style={nut()} onClick={dongWizard}>
                Bỏ bản nháp
              </button>
            </>
          )}
        </div>

        {kq !== null && baoCao !== null && (
          <div style={{ marginTop: 16 }}>
            {/* [BB] 66.2 — sáu dòng số, không phải một dấu check. */}
            <div style={{ display: 'grid', gap: 5, maxWidth: 560 }}>
              {baoCao.dong.map(([ten, gia]) => (
                <div key={ten} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                  <span style={{ ...nhan, minWidth: 104 }}>{ten}</span>
                  <span style={so}>{gia}</span>
                </div>
              ))}
            </div>

            {issueCuaMan(kq, wizard.man).length > 0 && (
              <ul style={{ margin: '14px 0 0', paddingLeft: 18, ...phu }}>
                {issueCuaMan(kq, wizard.man)
                  .slice(0, 8)
                  .map((i, n) => (
                    <li key={n} style={{ color: i.severity === 'error' ? 'var(--hoi)' : 'var(--mo)' }}>
                      {i.message}
                    </li>
                  ))}
              </ul>
            )}

            {kq.ok && !wizard.daNhapThuVien && (
              <button
                type="button"
                style={{ ...nut(true), marginTop: 14 }}
                onClick={() => void nhapVaoThuVien()}
              >
                Nhập vào thư viện
              </button>
            )}
            {wizard.daNhapThuVien && (
              <p style={{ ...phu, marginTop: 14 }}>
                Đã vào thư viện. Nó vẫn <strong style={{ color: 'var(--tro)' }}>chưa chạy</strong> — bật ở
                dưới.
              </p>
            )}
          </div>
        )}
      </section>

      {/*
       * ── xung đột (66.1 màn 5) ──
       *
       * [BB] 65.2 — pack chưa giải xung đột thì KHÔNG kích hoạt. Khối này là chỗ
       * người dùng giải nó. Thiếu nó thì `lintTruocKhiBat()` từ chối mãi mãi và
       * pack không bao giờ bật được — lỗi đã bắt gặp khi nhập fixture A thật, nơi
       * hai module cùng khai `history.wrapper`.
       */}
      {canChon.length > 0 && (
        <section className="kinh" style={{ padding: 18, marginBottom: 18 }}>
          <h2 style={{ ...nhan, margin: '0 0 6px' }}>Xung đột cần người chọn</h2>
          <p style={{ ...phu, margin: '0 0 14px', maxWidth: 620 }}>
            Engine giải được phần lớn xung đột. Những nhóm dưới đây thì không: chúng loại trừ nhau, và chọn hộ
            bạn là chọn thay ý đồ của người viết preset.
          </p>
          <div style={{ display: 'grid', gap: 14 }}>
            {canChon.map(({ row, nhom }) => (
              <div key={`${row.packId}:${nhom.khoa}`} className="kinh--cap2" style={{ padding: 12 }}>
                <div style={so}>{nhom.khoa}</div>
                <div style={{ ...phu, marginBottom: 8 }}>{nhom.moTa}</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {nhom.moduleIds.map((id) => {
                    const m = row.pack.modules.find((x) => x.id === id);
                    const dangChon = xungDot[row.packId]?.[nhom.khoa] === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        style={nut(dangChon)}
                        aria-pressed={dangChon}
                        onClick={() => giaiXungDot(row.packId, nhom.khoa, id)}
                      >
                        {m?.name ?? id}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── thư viện ── */}
      <section className="kinh" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ ...nhan, margin: '0 0 12px' }}>Thư viện</h2>
        {thuVien.length === 0 ? (
          <p style={phu}>Chưa có pack nào. Thế giới đang chạy bằng prompt native của engine.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {thuVien.map((r) => {
              const act = dangBat[r.packId];
              const daBat = act !== undefined && act.packVersion === r.version;
              return (
                <div
                  key={`${r.packId}:${r.version}`}
                  className="kinh--cap2"
                  style={{ padding: 12, display: 'grid', gap: 6 }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span className="ten-rieng" style={{ ...so, flex: 1, minWidth: 160 }}>
                      {r.pack.envelope.sourceName}
                    </span>
                    <span style={phu}>bản {r.version}</span>
                    <span style={phu}>{r.pack.modules.length} module</span>
                    <span style={{ ...phu, color: daBat ? 'var(--ngoc)' : 'var(--mo)' }}>
                      {daBat ? 'đang bật' : 'chưa bật'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {daBat ? (
                      <button type="button" style={nut()} onClick={() => void tat(r.packId)}>
                        Tắt — trả về prompt native
                      </button>
                    ) : (
                      <button
                        type="button"
                        style={nut(true)}
                        onClick={() => void bat(r.packId, saveId, tick)}
                      >
                        Bật cho nhánh này
                      </button>
                    )}
                    <button type="button" style={nut()} onClick={() => void xoaKhoiThuVien(r.packId)}>
                      Xóa khỏi thư viện
                    </button>
                  </div>

                  {/* Biến của pack — 66.6, namespace riêng, không chạm World. */}
                  {Object.keys(bien[r.packId] ?? {}).length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={nhan}>Biến của pack trên nhánh này</div>
                      <pre
                        className="chu-so"
                        style={{
                          margin: '4px 0 0',
                          ...phu,
                          whiteSpace: 'pre-wrap',
                          maxHeight: 160,
                          overflow: 'auto',
                        }}
                      >
                        {JSON.stringify(bien[r.packId], null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* [BB] 64.2 — script bị cách ly. Hiện ra, KHÔNG có nút bật. */}
                  {r.quarantined.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ ...nhan, color: 'var(--hoi)' }}>
                        {r.quarantined.length} script bị cách ly — không chạy
                      </div>
                      {r.quarantined.map((q) => (
                        <div key={q.hash} style={phu}>
                          {q.ten} · {q.soKyTu} ký tự{q.batONguon ? ' · nguồn khai là đang bật' : ''}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Thông số sinh từ preset — hiện để người dùng biết trước khi bật. */}
                  {r.pack.generation !== undefined && (
                    <div style={{ marginTop: 4 }}>
                      <div style={nhan}>Thông số sinh trong preset</div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '6px 16px',
                          flexWrap: 'wrap',
                          marginTop: 4,
                        }}
                      >
                        {(
                          [
                            ['Temperature', r.pack.generation.temperature],
                            ['Top P', r.pack.generation.topP],
                            ['Top K', r.pack.generation.topK],
                            ['Max Output', r.pack.generation.maxOutputTokens],
                            ['Context', r.pack.generation.maxContext],
                            ['Presence', r.pack.generation.presencePenalty],
                            ['Frequency', r.pack.generation.frequencyPenalty],
                          ] as [string, unknown][]
                        )
                          .filter(([, v]) => v !== undefined)
                          .map(([ten, v]) => (
                            <span key={ten} style={phu}>
                              {ten}:{' '}
                              <strong style={{ color: 'var(--tro)' }}>
                                {typeof v === 'number'
                                  ? Number.isInteger(v)
                                    ? v.toLocaleString()
                                    : (v as number).toFixed(2)
                                  : String(v)}
                              </strong>
                            </span>
                          ))}
                      </div>
                      {daBat && (
                        <div style={{ ...phu, marginTop: 4, color: 'var(--ngoc)' }}>
                          Đã áp thông số này vào endpoint Tường Thuật.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loiBat.length > 0 && (
          <div role="alert" style={{ marginTop: 12 }}>
            {loiBat.map((i, n) => (
              <div key={n} style={{ ...phu, color: 'var(--hoi)' }}>
                {i.message}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── lượt vừa rồi thật sự dùng gì ── */}
      <section className="kinh" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ ...nhan, margin: '0 0 12px' }}>Lượt kể gần nhất đã dùng gì</h2>
        {presetTrace.packDaDung.length === 0 ? (
          <p style={phu}>Lượt gần nhất chạy bằng prompt native. Không module ngoài nào có mặt trong nó.</p>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={so}>Pack góp mặt: {presetTrace.packDaDung.join(', ')}</div>
            {presetTrace.moduleBiBo.length > 0 && (
              <div style={phu}>
                {presetTrace.moduleBiBo.length} module không vào prompt:{' '}
                {presetTrace.moduleBiBo.slice(0, 12).join(', ')}
              </div>
            )}
            {presetTrace.macroChuaGiai.length > 0 && (
              <div style={{ ...phu, color: 'var(--hoi)' }}>
                Macro chưa có ánh xạ: {presetTrace.macroChuaGiai.join(', ')}
              </div>
            )}
            {presetTrace.issues.map((i, n) => (
              <div key={n} style={phu}>
                {i}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 66.6 — app đã làm thay việc gì ── */}
      <section className="kinh" style={{ padding: 18 }}>
        <h2 style={{ ...nhan, margin: '0 0 6px' }}>Ý đồ preset và đích native tương ứng</h2>
        <p style={{ ...phu, margin: '0 0 12px', maxWidth: 620 }}>
          <Icon ten="canh_bao" co={12} style={{ color: 'var(--dong)', verticalAlign: '-1px' }} /> Script và
          extension không chạy. Bảng này nói app đã làm thay từng việc bằng gì.
        </p>
        <div className="cuon-ngang">
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560 }}>
            <thead>
              <tr>
                {['Ý đồ trong preset', 'Đích native', 'Không được làm'].map((c) => (
                  <th
                    key={c}
                    style={{ ...nhan, textAlign: 'left', padding: '6px 14px 6px 0', fontWeight: 400 }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DUONG_PORT_TINH_NANG.map((d) => (
                <tr key={d.yDo} style={{ borderTop: '1px solid var(--kinh-vien)' }}>
                  <td style={{ ...so, padding: '6px 14px 6px 0' }}>{d.yDo}</td>
                  <td style={{ ...so, padding: '6px 14px 6px 0', color: 'var(--ngoc)' }}>{d.dichNative}</td>
                  <td style={{ ...phu, padding: '6px 14px 6px 0' }}>{d.khongDuocLam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
