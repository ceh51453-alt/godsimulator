/**
 * Bảng Lãnh Địa — Phần 56.4 [BB].
 *
 * > "Giữa hai cực. Có số, nhưng chỉ số TRONG domain, và mọi thứ ngoài lãnh địa
 * >  hiện dưới dạng tin đồn đã bóp méo."
 *
 * [BB] Hai dòng cuối — "Tín đồ tin ta" và "Ta thật sự là" — là chỗ Dị Hóa (12.2)
 * hiện ra cho người chơi thấy. Khi `doLechDiHoa` vượt ngưỡng, dòng dưới bắt đầu
 * **trôi về phía** dòng trên, và người chơi được nhìn chính mình bị nặn lại.
 *
 * Đó là lý do panel này tồn tại. Nó không phải bảng chỉ số; nó là cái gương.
 */
import type { CSSProperties } from 'react';
import { Icon } from '../design/Icon.js';
import { NHAN_TRANG_THAI_DOMAIN } from '../../core/schema/aspect/thanVi.js';
import type { DomainState, TrangThaiDomain } from '../../core/schema/aspect/thanVi.js';
import { BAN_TINH_TRUC } from '../../core/schema/aspect/soul.js';
import { NHAN_TRUC } from '../../core/than/diHoa.js';

export type TinDonNgoai = {
  readonly noiDung: string;
  readonly soNguon: number;
  readonly daXacNhan: boolean;
};

export type DuLieuLanhDia = {
  readonly tenThan: string;
  readonly domains: readonly DomainState[];
  readonly soTinDo: number;
  readonly soDen: number;
  readonly hienThanh: number;
  readonly doLech: number;
  readonly coreSelf: Readonly<Record<string, number>>;
  readonly followerImage: Readonly<Record<string, number>>;
  readonly ngoaiLanhDia: readonly TinDonNgoai[];
};

const nhan: CSSProperties = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
const so: CSSProperties = { fontFamily: 'var(--chu-so)', fontVariantNumeric: 'tabular-nums' };

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

/**
 * Ba tính từ mô tả một vector bản tính.
 *
 * [BB] 56.4 in ra CHỮ, không in ra số: "nghiêm khắc, công bằng, xa cách".
 * Người chơi phải so được hai dòng bằng mắt mà không phải trừ hai con số.
 */
function batTinhTu(v: Readonly<Record<string, number>>): string {
  const manh = BAN_TINH_TRUC.map((truc) => ({ truc, giaTri: v[truc] ?? 0 }))
    .filter((x) => Math.abs(x.giaTri) >= 12)
    .sort((a, b) => Math.abs(b.giaTri) - Math.abs(a.giaTri))
    .slice(0, 3)
    .map((x) => (x.giaTri >= 0 ? NHAN_TRUC[x.truc][1] : NHAN_TRUC[x.truc][0]));
  return manh.length > 0 ? manh.join(', ') : 'chưa rõ hình';
}

/** Trục mà hai dòng lệch nhau nhiều nhất — chỗ đáng nhìn nhất. */
function trucLechNhat(
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
): string | null {
  let ten: string | null = null;
  let max = 12;
  for (const truc of BAN_TINH_TRUC) {
    const d = Math.abs((a[truc] ?? 0) - (b[truc] ?? 0));
    if (d > max) {
      max = d;
      ten = truc;
    }
  }
  return ten;
}

export function BangLanhDia({ du }: { du: DuLieuLanhDia }): JSX.Element {
  const lech = trucLechNhat(du.coreSelf, du.followerImage);
  const nang = du.doLech >= 40;

  return (
    <section className="kinh hien-panel" style={{ padding: 16, display: 'grid', gap: 14 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon ten="vuong_mien" co={16} style={{ color: 'var(--dong)' }} />
        <h2 style={{ ...nhan, margin: 0, textTransform: 'uppercase' }}>Bảng Lãnh Địa</h2>
      </header>

      {/* ── domain: có số, vì đây là TRONG lãnh địa ── */}
      <div style={{ display: 'grid', gap: 6 }}>
        {du.domains.length === 0 && (
          <p style={{ margin: 0, color: 'var(--mo)', fontSize: 13 }}>
            Chưa ai quy cho ngươi điều gì. Lãnh địa còn trống.
          </p>
        )}
        {du.domains.map((d) => (
          <div
            key={d.ten}
            style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 10 }}
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

      <hr style={{ border: 0, borderTop: '1px solid var(--kinh-vien)', margin: 0 }} />

      <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        {[
          ['Tín đồ', `~${du.soTinDo.toLocaleString('vi-VN')}`],
          ['Đền', String(du.soDen)],
          ['Hiển thánh', String(Math.round(du.hienThanh))],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--tro)' }}>{k}</span>
            <span style={so}>{v}</span>
          </div>
        ))}
      </div>

      {/*
       * ── [BB] hai dòng của Dị Hóa ──
       * Đây là toàn bộ lý do panel này tồn tại. Hai dòng cùng cấu trúc, cùng
       * font, chỉ khác nội dung — để mắt người tự bắt được chỗ chúng rời nhau.
       */}
      <div
        className="kinh--cap2"
        style={{
          padding: 12,
          display: 'grid',
          gap: 8,
          borderLeft: `2px solid ${nang ? 'var(--hoi)' : 'var(--kinh-vien)'}`,
        }}
      >
        <div style={{ display: 'grid', gap: 2 }}>
          <span style={nhan}>TÍN ĐỒ TIN TA</span>
          <span style={{ fontFamily: 'var(--chu-hien)', fontSize: 17 }}>{batTinhTu(du.followerImage)}</span>
        </div>
        <div style={{ display: 'grid', gap: 2 }}>
          <span style={nhan}>TA THẬT SỰ LÀ</span>
          <span
            style={{
              fontFamily: 'var(--chu-hien)',
              fontSize: 17,
              color: nang ? 'var(--hoi)' : 'var(--sang)',
            }}
          >
            {batTinhTu(du.coreSelf)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...nhan, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon ten="di_hoa" co={13} />
            lệch
          </span>
          <span style={{ ...so, fontSize: 14, color: nang ? 'var(--hoi)' : 'var(--tro)' }}>
            {Math.round(du.doLech)}
          </span>
        </div>
        {nang && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--tro)', lineHeight: 1.5 }}>
            {lech
              ? `Người ta đang kể về một vị thần ${
                  (du.followerImage[lech] ?? 0) >= 0
                    ? NHAN_TRUC[lech as keyof typeof NHAN_TRUC][1]
                    : NHAN_TRUC[lech as keyof typeof NHAN_TRUC][0]
                } hơn ngươi.`
              : 'Hình ngươi trong miệng người khác đang rời khỏi ngươi.'}
          </p>
        )}
      </div>

      {/*
       * ── ngoài lãnh địa: KHÔNG có số ──
       * [BB] 56.4 + 19.1 — thứ ngoài lãnh địa tới bằng tin đồn đã bóp méo. Hiện
       * một con số ở đây là rò rỉ, dù con số ấy đúng.
       */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={nhan}>NGOÀI LÃNH ĐỊA — NGHE KỂ LẠI</span>
        {du.ngoaiLanhDia.length === 0 && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)' }}>Chưa có tin nào từ xa tới.</p>
        )}
        {du.ngoaiLanhDia.map((t, i) => (
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
