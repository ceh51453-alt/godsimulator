/**
 * Bảng Thiên Diễn — Phần 55.3, lớp phủ mở bằng `Tab`.
 *
 * ── Sáu quy tắc trình bày của 55.6, và chỗ từng cái được giữ ──
 *
 * 1. Số dùng `--chu-so` cỡ 13 `--tro`; nhãn cỡ 11 `--mo` giãn 0.08em → `nhan`/`so`.
 * 2. Không viên trạng thái nhiều màu → không component nào ở đây vẽ pill.
 * 3. Không lồng kính → lớp phủ là MỘT lớp; vùng phân tách bằng hairline (`.vung-bang`).
 * 4. Sparkline là đường SVG một nét, không tô, không trục, không lưới → `Sparkline`.
 * 5. Delta bằng dấu và số, màu theo hướng TỐT/XẤU chứ không theo dấu → `Delta`.
 * 6. Không thanh tiến trình tô đầy → tỉ lệ vẽ bằng khối `█▁` trong `--chu-so`.
 *
 * [BB] 55.3 — tám vùng, thứ tự CỐ ĐỊNH. Thứ tự ấy do `VUNG_BANG` giữ, và file
 * này render theo đúng mảng đó chứ không tự xếp lại.
 */
import type { CSSProperties } from 'react';
import type { BangThienDien as DuLieuBang, MucCanChuY, DichXuLy } from '../../core/bang/thienDien.js';
import { NHAN_VUNG } from '../../core/bang/thienDien.js';
import { Icon } from '../design/Icon.js';

const nhan: CSSProperties = {
  color: 'var(--mo)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};
const so: CSSProperties = { fontSize: 13, color: 'var(--tro)' };
const phu: CSSProperties = { fontSize: 11, color: 'var(--mo)' };

function TieuDeVung({ ten }: { ten: string }): JSX.Element {
  return <h3 style={{ ...nhan, margin: '0 0 10px' }}>{ten}</h3>;
}

/** [BB] 55.6 quy tắc 4 — một nét mảnh, bảy điểm, không tô, không trục, không nhãn. */
function Sparkline({ diem }: { diem: readonly number[] }): JSX.Element | null {
  if (diem.length < 2) return null;
  const min = Math.min(...diem);
  const max = Math.max(...diem);
  const bien = max - min || 1;
  const w = 54;
  const h = 14;
  const d = diem
    .map((v, i) => {
      const x = (i / (diem.length - 1)) * w;
      const y = h - ((v - min) / bien) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      style={{ flex: '0 0 auto', overflow: 'visible' }}
    >
      <path d={d} fill="none" stroke="var(--mo)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function Delta({ delta, tangLaTot }: { delta: number | null; tangLaTot: boolean }): JSX.Element | null {
  if (delta === null || delta === 0) return null;
  const tot = delta > 0 === tangLaTot;
  return (
    <span className="chu-so" style={{ fontSize: 12, color: tot ? 'var(--ngoc)' : 'var(--hoi)' }}>
      {delta > 0 ? '+' : '−'}
      {Math.abs(delta)}
    </span>
  );
}

/** [BB] 55.6 quy tắc 6 — không thanh tô đầy. Khối `█▁` trong font số. */
function Khoi({ tyLe }: { tyLe: number }): JSX.Element {
  const day = Math.max(0, Math.min(5, Math.round(tyLe * 5)));
  return (
    <span className="chu-so" style={{ ...phu, letterSpacing: '0.05em' }} aria-hidden="true">
      {'█'.repeat(day)}
      {'▁'.repeat(5 - day)}
    </span>
  );
}

const NHAN_DICH: Readonly<Record<DichXuLy, string>> = Object.freeze({
  phuc_but: 'Sổ Phục Bút',
  loi_cau: 'Hàng lời cầu',
  lo_hong: 'Bảng lỗ hổng',
  mach_truyen: 'Mạch truyện',
  doi_soat: 'Bảng Đối Soát',
  chi_so: 'Chỉ số thế giới',
  luat_nen: 'Luật Nền',
});

export function BangThienDien({
  bang,
  onDong,
  onXuLy,
}: {
  bang: DuLieuBang;
  onDong: () => void;
  /** [BB] 55.4 — mỗi mục mở THẲNG tới chỗ xử lý; không mục nào chỉ để đọc. */
  onXuLy: (muc: MucCanChuY) => void;
}): JSX.Element {
  return (
    <section
      className="lop-phu"
      role="region"
      aria-label="Bảng Thiên Diễn"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onDong();
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
        <h2 className="chu-hien" style={{ margin: 0, fontSize: 22 }}>
          Bảng Thiên Diễn
        </h2>
        <span style={phu}>Tab hoặc Esc để đóng</span>
        <button
          type="button"
          onClick={onDong}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            color: 'var(--tro)',
            border: '1px solid var(--kinh-vien)',
            borderRadius: 'var(--r-sm)',
            padding: '5px 12px',
            font: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Đóng
        </button>
      </div>

      {/* ── 1 · khi nào ── 2 · thế giới là gì ── */}
      <div className="vung-bang luoi-doi">
        <div>
          <TieuDeVung ten={NHAN_VUNG.khi_nao} />
          <div style={so}>{bang.khiNao.moTaThoiDiem}</div>
          <div style={phu}>{bang.khiNao.nhip}</div>
          <div style={phu}>{bang.khiNao.chuyenKy}</div>
        </div>

        <div>
          <TieuDeVung ten={NHAN_VUNG.the_gioi_la_gi} />
          {bang.theGioiLaGi === null ? (
            <p style={phu}>
              Ngươi sống bên trong thế giới này. Cấu trúc của nó không phải thứ nhìn từ trong ra mà thấy được.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {bang.theGioiLaGi.luatNen.map((t) => (
                <div key={t.ten} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ ...so, minWidth: 96 }}>{t.ten}</span>
                  <span style={phu}>{t.trangThai}</span>
                  <span style={{ ...phu, flex: 1, minWidth: 0 }}>{t.ghiChu}</span>
                </div>
              ))}
              {bang.theGioiLaGi.coChe.map((c) => (
                <div key={c.ten} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ ...so, minWidth: 96, color: 'var(--van)' }}>{c.ten}</span>
                  <span style={phu}>{c.trangThai}</span>
                  <span style={{ ...phu, flex: 1, minWidth: 0 }}>{c.ghiChu}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 3 · có gì tồn tại ── 4 · đang thế nào ── */}
      <div className="vung-bang luoi-doi">
        <div>
          <TieuDeVung ten={NHAN_VUNG.co_gi_ton_tai} />
          {bang.coGiTonTai === null ? (
            <p style={phu}>
              Không ai đếm được thế giới từ bên trong nó. Thứ ngươi biết nằm trong Sổ Tay của chính ngươi.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 5 }}>
              {bang.coGiTonTai.map((d) => (
                <div key={d.kindId}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span style={{ ...so, flex: 1, minWidth: 0 }}>{d.nhan}</span>
                    <span className="chu-so" style={so}>
                      {d.so}
                    </span>
                  </div>
                  {d.phu === '' ? null : <div style={phu}>{d.phu}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <TieuDeVung ten={NHAN_VUNG.dang_the_nao} />
          {bang.dangTheNao === null ? (
            <p style={phu}>Thế giới không tự báo cáo sức khỏe của nó cho ai đang sống trong nó.</p>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {bang.dangTheNao.map((c) => (
                <div key={c.khoa} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ ...so, flex: 1, minWidth: 0 }}>{c.nhan}</span>
                  <span className="chu-so" style={so}>
                    {c.gia}
                  </span>
                  <Sparkline diem={c.chuoi} />
                  <Delta delta={c.delta} tangLaTot={c.tangLaTot} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 5 · đã lệch bao xa ── 6 · đang xảy ra chuyện gì ── */}
      <div className="vung-bang luoi-doi">
        <div>
          <TieuDeVung ten={NHAN_VUNG.da_lech} />
          {bang.daLech.length === 0 ? (
            <p style={phu}>Chưa có thần thoại nguồn nào được nhập để mà đối chiếu.</p>
          ) : (
            bang.daLech.map((d) => (
              <div key={d.nguon} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ ...so, minWidth: 110 }}>{d.nguon}</span>
                <span style={phu}>{d.tomTat}</span>
              </div>
            ))
          )}
        </div>

        <div>
          <TieuDeVung ten={NHAN_VUNG.dang_xay_ra} />
          {bang.dangXayRa.length === 0 ? (
            <p style={phu}>Thế giới vẫn đang tự kể ở ngoài tầm nhìn.</p>
          ) : (
            <div style={{ display: 'grid', gap: 5 }}>
              {bang.dangXayRa.slice(0, 8).map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  {/* [BB] 55.3 — `●`/`○` được thay bằng CHỮ, không bằng ký hiệu. */}
                  <span style={{ ...phu, minWidth: 62 }}>{m.daBiet ? 'đã biết' : 'chưa nghe'}</span>
                  <span style={{ ...so, flex: 1, minWidth: 0 }}>{m.ten}</span>
                  <span style={phu}>{m.giaiDoan}</span>
                  <Khoi tyLe={m.cangThang / 100} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 7 · ai đáng chú ý ── 8 · từ lần trước + cần chú ý ── */}
      <div className="vung-bang luoi-doi">
        <div>
          <TieuDeVung ten={NHAN_VUNG.ai_dang_chu_y} />
          {bang.aiDangChuY.length === 0 ? (
            <p style={phu}>Chưa ai bước ra khỏi đám đông.</p>
          ) : (
            bang.aiDangChuY.map((n) => (
              <div key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span className="ten-rieng" style={{ ...so, flex: 1, minWidth: 0 }}>
                  {n.ten}
                </span>
                <span style={phu}>{n.vi}</span>
              </div>
            ))
          )}
        </div>

        <div>
          <TieuDeVung ten={NHAN_VUNG.tu_lan_truoc} />
          {bang.tuLanTruoc.length === 0 ? (
            <p style={phu}>Chưa có gì đổi kể từ lần ngươi mở bảng này.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 16, ...so }}>
              {bang.tuLanTruoc.slice(0, 8).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}

          <h3 style={{ ...nhan, margin: '16px 0 8px' }}>Cần chú ý</h3>
          {bang.canChuY.length === 0 ? (
            <p style={phu}>Không có việc nào đang chờ ngươi.</p>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {bang.canChuY.slice(0, 10).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onXuLy(m)}
                  title={`Mở ${NHAN_DICH[m.dich]}`}
                  style={{
                    display: 'flex',
                    gap: 9,
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    background: 'transparent',
                    border: '1px solid var(--kinh-vien)',
                    borderRadius: 'var(--r-sm)',
                    padding: '7px 10px',
                    font: 'inherit',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <Icon ten="canh_bao" co={13} style={{ color: 'var(--dong)', marginTop: 3 }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={so}>{m.nhan}</span>
                    <span style={{ ...phu, display: 'block' }}>{m.vi}</span>
                    <span style={{ ...phu, display: 'block', color: 'var(--lam)' }}>
                      mở {NHAN_DICH[m.dich]}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
