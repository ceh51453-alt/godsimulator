/**
 * Bảng Thần Điện — thay Bảng Lãnh Địa của 56.4.
 *
 * Bảng cũ đếm tín đồ, đền và hiển thánh: nó trả lời "bao nhiêu người tin ngươi".
 * Bảng này trả lời ba câu khác, và ba câu ấy là ba khối trên màn hình:
 *
 *   VỊ TRÍ    ngươi ngồi ghế nào trong thần điện, đứng thứ mấy, từ nhịp nào
 *   QUY LUẬT  luật kế vị, lời ngươi đã thề, và luật nền không ai cãi được
 *   SỨC MẠNH  thẩm quyền thế giới quy cho ngươi, chia theo từng domain
 *
 * [BB] 36.1 — không emoji; mọi ký hiệu là SVG vẽ tay.
 * [BB] Luật bất biến #9 — không dấu hiệu nào chỉ dựa vào màu; mỗi màu có chữ đi kèm.
 * [BB] 19.1 — thần khác chỉ có chữ so sánh, không có số. Xem `core/than/thanDien.ts`.
 */
import type { CSSProperties } from 'react';
import { Icon } from '../design/Icon.js';
import { NHAN_TRANG_THAI_DOMAIN } from '../../core/schema/aspect/thanVi.js';
import type { TrangThaiDomain } from '../../core/schema/aspect/thanVi.js';
import { NHAN_SO_SANH } from '../../core/than/thanDien.js';
import type { DuLieuThanDien } from '../../core/than/thanDien.js';

const nhan: CSSProperties = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
const so: CSSProperties = { fontFamily: 'var(--chu-so)', fontVariantNumeric: 'tabular-nums' };
const vien: CSSProperties = { border: 0, borderTop: '1px solid var(--kinh-vien)', margin: 0 };

const MAU_TRANG_THAI: Readonly<Record<TrangThaiDomain, string>> = {
  held: 'var(--ngoc)',
  contested: 'var(--dong)',
  dormant: 'var(--mo)',
  fragmented: 'var(--van)',
  transformed: 'var(--van)',
  merged: 'var(--lam)',
  lost: 'var(--hoi)',
  reclaimable: 'var(--lam)',
};

function Khoi({
  ten,
  icon,
  con,
}: {
  ten: string;
  icon: 'vuong_mien' | 'dinh_luat' | 'than' | 'nguoi';
  con: JSX.Element;
}): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={{ ...nhan, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon ten={icon} co={13} />
        {ten}
      </span>
      {con}
    </div>
  );
}

function Dong({ k, v, dam = false }: { k: string; v: string; dam?: boolean }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span style={{ color: 'var(--tro)', flexShrink: 0 }}>{k}</span>
      <span
        style={{
          textAlign: 'right',
          color: dam ? 'var(--sang)' : 'var(--tro)',
          fontFamily: dam ? 'var(--chu-hien)' : undefined,
        }}
      >
        {v}
      </span>
    </div>
  );
}

export function BangThanDien({ du }: { du: DuLieuThanDien }): JSX.Element {
  const { viTri, quyLuat, sucManh } = du;
  const coThanHe = viTri.thanHeId !== null;
  // Thanh so sánh chỉ có nghĩa khi có người để so — một mình thì luôn đầy vạch.
  const tiLe = sucManh.thamQuyenCaoNhat > 0 ? Math.min(1, sucManh.thamQuyen / sucManh.thamQuyenCaoNhat) : 0;

  return (
    <section className="kinh hien-panel" style={{ padding: 16, display: 'grid', gap: 14 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon ten="vuong_mien" co={16} style={{ color: 'var(--dong)' }} />
        <h2 style={{ ...nhan, margin: 0, textTransform: 'uppercase' }}>Bảng Thần Điện</h2>
      </header>

      {/* ── vị trí ── */}
      <Khoi
        ten="VỊ TRÍ"
        icon="vuong_mien"
        con={
          coThanHe ? (
            <div style={{ display: 'grid', gap: 4 }}>
              <span className="ten-rieng" style={{ fontSize: 15 }}>
                {viTri.tenThanHe}
              </span>
              <Dong k="Ngươi là" v={viTri.nhanVai} dam />
              <Dong
                k="Đứng thứ"
                v={
                  viTri.hang > 0
                    ? `${viTri.hang} trên ${viTri.tongThanhVien} vị`
                    : `chưa xếp được — ${viTri.tongThanhVien} vị trong thần hệ`
                }
              />
              <Dong k="Lối cai trị" v={viTri.moHinh} />
              {viTri.tickNhanGhe !== null && <Dong k="Ngồi từ nhịp" v={String(viTri.tickNhanGhe)} />}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--mo)', lineHeight: 1.5 }}>
              Ngươi đứng ngoài mọi thần hệ. Không ai chia ghế cho ngươi, và cũng không ai bỏ phiếu được về
              ngươi.
            </p>
          )
        }
      />

      <hr style={vien} />

      {/* ── quy luật ── */}
      <Khoi
        ten="QUY LUẬT"
        icon="dinh_luat"
        con={
          <div style={{ display: 'grid', gap: 4 }}>
            <Dong k="Kế vị" v={quyLuat.keVi} />
            {quyLuat.nguongThongQua !== null && (
              <Dong k="Nghị quyết qua khi" v={`${Math.round(quyLuat.nguongThongQua * 100)}% phiếu thuận`} />
            )}
            {quyLuat.gheDauTrong && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: 'var(--dong)',
                  lineHeight: 1.5,
                }}
              >
                Ghế đầu đang trống.{' '}
                {quyLuat.soUngVienKeVi === 0
                  ? 'Không ai đủ tư cách ngồi vào.'
                  : `${quyLuat.soUngVienKeVi} vị có cửa — ngươi có thể là một trong số đó.`}
              </p>
            )}

            {quyLuat.loiDaThe.length > 0 && (
              <div style={{ display: 'grid', gap: 3, marginTop: 6 }}>
                <span style={{ ...nhan, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon ten="giao_uoc" co={12} />
                  LỜI NGƯƠI ĐÃ THỀ
                </span>
                {quyLuat.loiDaThe.map((l, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--tro)', lineHeight: 1.5 }}>
                    — {l}
                  </div>
                ))}
              </div>
            )}

            {quyLuat.luatNen.length > 0 && (
              <div style={{ display: 'grid', gap: 3, marginTop: 6 }}>
                <span style={nhan}>LUẬT NỀN ĐÃ CÓ TÊN</span>
                {quyLuat.luatNen.map((l) => (
                  <div key={l.ten} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--tro)' }}>{l.ten}</span>
                    <span style={{ color: 'var(--mo)' }}>{l.aiNghichDuoc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      />

      <hr style={vien} />

      {/* ── sức mạnh: số của CHÍNH mình nên in thẳng được ── */}
      <Khoi
        ten="SỨC MẠNH"
        icon="than"
        con={
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: 'var(--tro)', fontSize: 13 }}>Thẩm quyền được quy cho</span>
              <span style={{ ...so, fontSize: 18, color: 'var(--sang)' }}>{sucManh.thamQuyen}</span>
            </div>
            {coThanHe && sucManh.thamQuyenCaoNhat > 0 && (
              <div style={{ display: 'grid', gap: 3 }}>
                <div style={{ height: 3, background: 'var(--kinh-vien)' }}>
                  <div
                    style={{ height: 3, width: `${Math.round(tiLe * 100)}%`, background: 'var(--dong)' }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--mo)' }}>
                  {tiLe >= 1
                    ? 'nặng nhất thần hệ'
                    : `bằng ${Math.round(tiLe * 100)}% tiếng nói của vị nặng nhất`}
                </span>
              </div>
            )}

            {sucManh.domains.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--mo)', fontSize: 13 }}>
                Chưa ai quy cho ngươi điều gì. Ngươi chưa cầm một quyền nào.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {sucManh.domains.map((d) => (
                  <div
                    key={d.ten}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span className="ten-rieng" style={{ fontSize: 14 }}>
                      {d.ten}
                    </span>
                    <span style={{ ...so, fontSize: 14, color: 'var(--sang)' }}>{Math.round(d.suc)}</span>
                    {/* Nhãn CHỮ đi kèm màu — [BB] không thao tác nào chỉ dựa vào màu. */}
                    <span style={{ fontSize: 11, color: MAU_TRANG_THAI[d.trangThai] }}>
                      {NHAN_TRANG_THAI_DOMAIN[d.trangThai]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* ── các vị cùng thần điện ── */}
      {coThanHe && du.thanhVien.length > 0 && (
        <>
          <hr style={vien} />
          <Khoi
            ten="CÁC VỊ CÙNG THẦN ĐIỆN"
            icon="nguoi"
            con={
              <div style={{ display: 'grid', gap: 5 }}>
                {du.thanhVien.map((tv, i) => (
                  <div key={tv.id} style={{ display: 'grid', gap: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                      <span
                        className="ten-rieng"
                        style={{ color: tv.laNguoiChoi ? 'var(--dong)' : undefined }}
                      >
                        {i + 1}. {tv.ten}
                        {tv.laNguoiChoi ? ' — ngươi' : ''}
                      </span>
                      <span style={{ color: 'var(--mo)', fontSize: 11, textAlign: 'right' }}>
                        {tv.nhanVai}
                      </span>
                    </div>
                    {/*
                     * [BB] 19.1 — thẩm quyền của thần khác suy từ tín đồ và đền
                     * của họ, tức là thứ NGOÀI lãnh địa ngươi. Chỉ chữ, không số.
                     */}
                    {!tv.laNguoiChoi && (
                      <span style={{ fontSize: 11, color: 'var(--tro)' }}>{NHAN_SO_SANH[tv.soSanh]}</span>
                    )}
                  </div>
                ))}
              </div>
            }
          />
        </>
      )}

      {/* ── ngoài thần điện: KHÔNG có số — [BB] 56.4 + 19.1 ── */}
      <hr style={vien} />
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={nhan}>NGOÀI THẦN ĐIỆN — NGHE KỂ LẠI</span>
        {du.ngoaiThanDien.length === 0 && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)' }}>Chưa có tin nào từ xa tới.</p>
        )}
        {du.ngoaiThanDien.map((t, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--tro)', lineHeight: 1.5 }}>
            {t.noiDung}
            <div style={{ color: 'var(--mo)', fontSize: 11 }}>
              {t.soNguon === 1 ? '— chỉ một nguồn' : `— ${t.soNguon} nguồn, số liệu vênh nhau`}
              {t.daXacNhan ? '' : ', chưa xác nhận'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
