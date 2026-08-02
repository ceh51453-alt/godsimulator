/**
 * Bảng Thông Tin Thiên Địa — Phần 58, lớp phủ mở bằng `I`.
 *
 * [BB] 58.3 — màn mặc định phải chứa TÊN THẬT của ít nhất một luật, một tạo vật,
 * một thần hệ và một mạch truyện nếu chúng tồn tại. Đó là lý do tab Tổng quan
 * dưới đây không phải một bảng số: nó liệt kê tên.
 *
 * [BB] 58.4 — dải định vị năm trường KHÔNG BAO GIỜ cuộn khỏi màn hình.
 *
 * [BB] 58.13 — không "Không có dữ liệu". Mỗi tab có câu rỗng của thế giới, lấy
 * từ `CAU_RONG` để câu chữ và logic không bao giờ lệch nhau.
 */
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { BangThongTin as DuLieu, TabThongTin } from '../../core/bang/thongTin.js';
import { TAB_THONG_TIN, nhanTab, CAU_RONG, timTrongBang } from '../../core/bang/thongTin.js';

const nhan: CSSProperties = {
  color: 'var(--mo)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};
const so: CSSProperties = { fontSize: 13, color: 'var(--tro)' };
const phu: CSSProperties = { fontSize: 11, color: 'var(--mo)' };

function nutTab(bat: boolean): CSSProperties {
  return {
    background: 'transparent',
    color: bat ? 'var(--dong)' : 'var(--tro)',
    border: `1px solid ${bat ? 'var(--dong)' : 'var(--kinh-vien)'}`,
    borderRadius: 999,
    padding: '5px 13px',
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
  };
}

function Rong({ tab }: { tab: TabThongTin }): JSX.Element {
  return <p style={{ ...phu, fontStyle: 'italic', maxWidth: 520 }}>{CAU_RONG[tab]}</p>;
}

/** Bảng rộng tự cuộn ngang trong hộp của nó — thân trang không bao giờ cuộn ngang. */
function Bang({ cot, hang }: { cot: readonly string[]; hang: readonly (readonly string[])[] }): JSX.Element {
  return (
    <div className="cuon-ngang">
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560 }}>
        <thead>
          <tr>
            {cot.map((c) => (
              <th key={c} style={{ ...nhan, textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 400 }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hang.map((h, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--kinh-vien)' }}>
              {h.map((o, j) => (
                <td key={j} style={{ ...so, padding: '7px 12px 7px 0', verticalAlign: 'top' }}>
                  {o}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BangThongTin({
  du,
  tab,
  tim,
  theoDoiMachIds,
  onDoiTab,
  onTim,
  onGhimMach,
  onDong,
}: {
  du: DuLieu;
  tab: TabThongTin;
  tim: string;
  theoDoiMachIds: readonly string[];
  onDoiTab: (t: TabThongTin) => void;
  onTim: (q: string) => void;
  onGhimMach: (machId: string) => void;
  onDong: () => void;
}): JSX.Element {
  const ketQuaTim = useMemo(() => timTrongBang(du, tim), [du, tim]);

  return (
    <section
      className="lop-phu"
      role="region"
      aria-label="Bảng Thông Tin Thiên Địa"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onDong();
      }}
    >
      {/* ── dải định vị (58.4) — dính khi cuộn ── */}
      <div
        style={{
          position: 'sticky',
          top: -18,
          zIndex: 1,
          background: 'rgba(10, 12, 17, 0.94)',
          margin: '-18px -22px 14px',
          padding: '16px 22px 12px',
          borderBottom: '1px solid var(--kinh-vien)',
        }}
      >
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <h2 className="chu-hien" style={{ margin: 0, fontSize: 20 }}>
            {du.daiDinhVi.theGioi}
          </h2>
          <span style={so}>{du.daiDinhVi.thoiDiem}</span>
          <span style={phu}>nhánh {du.daiDinhVi.nhanh}</span>
          <span style={phu}>{du.daiDinhVi.tangChoi}</span>
          <span style={phu}>ống kính: {du.daiDinhVi.ongKinh}</span>
          <button
            type="button"
            onClick={onDong}
            style={{ ...nutTab(false), marginLeft: 'auto' }}
            aria-label="Đóng Bảng Thông Tin"
          >
            Đóng
          </button>
        </div>

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
          {TAB_THONG_TIN.map((t) => (
            <button
              key={t}
              type="button"
              style={nutTab(t === tab)}
              aria-current={t === tab ? 'true' : undefined}
              onClick={() => onDoiTab(t)}
            >
              {nhanTab(t, du.mode)}
              {du.dem[t] > 0 ? ` ${du.dem[t]}` : ''}
            </button>
          ))}
          <label htmlFor="oTim" style={{ position: 'absolute', left: -9999 }}>
            Tìm trong bảng
          </label>
          <input
            id="oTim"
            value={tim}
            onChange={(e) => onTim(e.target.value)}
            placeholder="Tìm tên luật, tạo vật, thần hệ, mạch…"
            className="kinh--cap2"
            style={{
              marginLeft: 'auto',
              minWidth: 220,
              color: 'var(--sang)',
              border: '1px solid var(--kinh-vien)',
              borderRadius: 'var(--r-sm)',
              padding: '6px 11px',
              font: 'inherit',
              fontSize: 13,
              background: 'var(--kinh-nen-2)',
            }}
          />
        </div>
      </div>

      {/* ── kết quả tìm, nhóm theo tab (58.11) ── */}
      {tim.trim() !== '' && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ ...nhan, margin: '0 0 8px' }}>{ketQuaTim.length} kết quả</h3>
          {ketQuaTim.length === 0 ? (
            <p style={phu}>Không có gì trong tầm nhìn của ngươi mang cái tên đó.</p>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {ketQuaTim.map((k) => (
                <button
                  key={`${k.tab}:${k.id}`}
                  type="button"
                  onClick={() => onDoiTab(k.tab)}
                  style={{
                    display: 'flex',
                    gap: 10,
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--kinh-vien)',
                    padding: '5px 0',
                    font: 'inherit',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ ...phu, minWidth: 92 }}>{nhanTab(k.tab, du.mode)}</span>
                  <span style={{ ...so, flex: 1, minWidth: 0 }}>{k.ten}</span>
                  <span style={phu}>{k.vi}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── tab Tổng quan (58.5) ── */}
      {tab === 'tong_quan' && (
        <div className="luoi-doi">
          <div>
            <h3 style={{ ...nhan, margin: '0 0 10px' }}>Quy luật đang định hình thế giới</h3>
            {du.quyLuat.length === 0 ? (
              <Rong tab="quy_luat" />
            ) : (
              du.quyLuat.slice(0, 4).map((l) => (
                <div key={l.id} style={{ marginBottom: 9 }}>
                  <div className="ten-rieng" style={so}>
                    {l.ten}
                  </div>
                  <div style={phu}>
                    {l.trangThai}
                    {l.hieuLuc === null ? '' : ` · hiệu lực ${l.hieuLuc}`} · {l.phamVi}
                    {l.soVanDe > 0 ? ` · ${l.soVanDe} vấn đề` : ''}
                  </div>
                  {l.cau === '' ? null : <div style={{ ...phu, fontStyle: 'italic' }}>“{l.cau}”</div>}
                </div>
              ))
            )}

            <h3 style={{ ...nhan, margin: '18px 0 10px' }}>Mạch đang theo dõi</h3>
            {du.machTruyen.length === 0 ? (
              <Rong tab="mach_truyen" />
            ) : (
              du.machTruyen.slice(0, 4).map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ ...so, flex: 1, minWidth: 0 }}>{m.ten}</span>
                  <span style={phu}>{m.giaiDoan}</span>
                  {m.dangXem ? <span style={{ ...phu, color: 'var(--dong)' }}>đang xem</span> : null}
                </div>
              ))
            )}
          </div>

          <div>
            <h3 style={{ ...nhan, margin: '0 0 10px' }}>{nhanTab('ta', du.mode)}</h3>
            <div style={so}>{du.ta.danhXung}</div>
            <div style={phu}>
              {du.ta.banThe} · {du.ta.trangThai}
            </div>
            <div style={{ ...phu, marginTop: 6 }}>{du.ta.theGianGoi.join(' · ')}</div>

            <h3 style={{ ...nhan, margin: '18px 0 10px' }}>Tạo vật và thần hệ</h3>
            {du.taoVat.length === 0 ? (
              <Rong tab="tao_vat" />
            ) : (
              du.taoVat.slice(0, 5).map((t) => (
                <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span className="ten-rieng" style={{ ...so, flex: 1, minWidth: 0 }}>
                    {t.ten}
                  </span>
                  <span style={phu}>
                    {t.loai} · {t.nguonSinh}
                  </span>
                </div>
              ))
            )}
            {du.thanHe.length === 0 ? (
              <p style={{ ...phu, fontStyle: 'italic', marginTop: 8 }}>{CAU_RONG.than_he}</p>
            ) : (
              du.thanHe.slice(0, 3).map((p) => (
                <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginTop: 6 }}>
                  <span className="ten-rieng" style={{ ...so, flex: 1, minWidth: 0 }}>
                    {p.ten}
                  </span>
                  <span style={phu}>
                    {p.soThanhVien} thần · ngôi đầu {p.ngoiDau}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── tab Quy luật (58.6) ── */}
      {tab === 'quy_luat' &&
        (du.quyLuat.length === 0 ? (
          <Rong tab="quy_luat" />
        ) : (
          <Bang
            cot={['Quy luật', 'Tầng', 'Trạng thái', 'Hiệu lực', 'Phạm vi', 'Nguồn', 'Vấn đề']}
            hang={du.quyLuat.map((l) => [
              l.cau === '' ? l.ten : `${l.ten} — ${l.cau}`,
              l.tang,
              l.trangThai,
              l.hieuLuc === null ? 'chưa tính' : String(l.hieuLuc),
              l.phamVi,
              l.nguon,
              l.soVanDe === 0 ? 'không' : `${l.soVanDe}`,
            ])}
          />
        ))}

      {/* ── tab Tạo vật (58.7) ── */}
      {tab === 'tao_vat' && (
        <>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
            {du.chipLoai.map((c) => (
              <span
                key={c.kindId}
                style={{
                  ...phu,
                  border: '1px solid var(--kinh-vien)',
                  borderRadius: 999,
                  padding: '3px 10px',
                }}
              >
                {c.nhan} {c.so}
              </span>
            ))}
          </div>
          {du.taoVat.length === 0 ? (
            <Rong tab="tao_vat" />
          ) : (
            <Bang
              cot={['Tên', 'Loại', 'Nguồn sinh', 'Trạng thái', 'Ảnh hưởng', 'Nơi hiện diện', 'Liên kết lớn']}
              hang={du.taoVat
                .slice(0, 200)
                .map((t) => [
                  t.ten,
                  t.loai,
                  t.nguonSinh,
                  t.trangThai,
                  t.anhHuong.join(', ') || '—',
                  t.noiHienDien,
                  t.lienKetLon.join('; ') || '—',
                ])}
            />
          )}
        </>
      )}

      {/* ── tab Thần hệ (58.8) ── */}
      {tab === 'than_he' &&
        (du.thanHe.length === 0 ? (
          <Rong tab="than_he" />
        ) : (
          <Bang
            cot={['Thần hệ', 'Mô hình', 'Ngôi đầu', 'Thành viên', 'Domain trội', 'Phạm vi']}
            hang={du.thanHe.map((p) => [
              p.ten,
              p.moHinh,
              p.ngoiDau,
              String(p.soThanhVien),
              p.domainTroi.join(', ') || '—',
              p.phamVi,
            ])}
          />
        ))}

      {/* ── tab Mạch truyện (58.9) ── */}
      {tab === 'mach_truyen' &&
        (du.machTruyen.length === 0 ? (
          <Rong tab="mach_truyen" />
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {du.machTruyen.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'baseline',
                  borderBottom: '1px solid var(--kinh-vien)',
                  paddingBottom: 6,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => onGhimMach(m.id)}
                  style={{ ...nutTab(theoDoiMachIds.includes(m.id)), fontSize: 12, padding: '3px 10px' }}
                >
                  {theoDoiMachIds.includes(m.id) ? 'Bỏ theo dõi' : 'Theo dõi'}
                </button>
                <span style={{ ...so, flex: 1, minWidth: 140 }}>{m.ten}</span>
                <span style={phu}>{m.loai}</span>
                <span style={phu}>{m.giaiDoan}</span>
                <span className="chu-so" style={phu}>
                  căng thẳng {m.cangThang}
                </span>
                <span style={phu}>{m.soNutChuaGo} nút chưa gỡ</span>
                <span style={phu}>{m.nhanVatChinh.join(', ') || 'chưa ai vào cuộc'}</span>
                {m.dangXem ? <span style={{ ...phu, color: 'var(--dong)' }}>đang xem</span> : null}
              </div>
            ))}
          </div>
        ))}

      {/* ── tab Ta (58.10) ── */}
      {tab === 'ta' && (
        <div className="luoi-doi">
          <div>
            <h3 style={{ ...nhan, margin: '0 0 8px' }}>Ta đang là ai</h3>
            <div style={so}>{du.ta.danhXung}</div>
            <div style={phu}>
              {du.ta.banThe} · {du.ta.trangThai}
            </div>

            <h3 style={{ ...nhan, margin: '18px 0 8px' }}>Thế giới nghĩ ta là ai</h3>
            {du.ta.theGianGoi.map((t) => (
              <div key={t} style={phu}>
                {t}
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ ...nhan, margin: '0 0 8px' }}>Ta đã để lại gì</h3>
            {du.ta.dauAn.length === 0 ? (
              <Rong tab="ta" />
            ) : (
              du.ta.dauAn.map((d) => (
                <div key={`${d.ten}:${d.tick}`} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span className="ten-rieng" style={{ ...so, flex: 1, minWidth: 0 }}>
                    {d.ten}
                  </span>
                  <span style={phu}>{d.loai}</span>
                </div>
              ))
            )}

            <h3 style={{ ...nhan, margin: '18px 0 8px' }}>Hành động của ta đã đi tới đâu</h3>
            {du.ta.heQua.length === 0 ? (
              <p style={phu}>Chưa có chuỗi hệ quả nào truy được về một hành động của ngươi.</p>
            ) : (
              du.ta.heQua.map((h) => (
                <div key={h.moc} style={{ marginBottom: 10 }}>
                  <div style={so}>{h.moc}</div>
                  {h.cacBuoc.map((b, i) => (
                    <div key={i} style={{ ...phu, paddingLeft: 12 * (i + 1) }}>
                      → {b}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
