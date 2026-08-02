/**
 * Thẻ lời cầu — Phần 22.4.
 *
 * > "Mỗi lời cầu là thẻ kính nhỏ: tên người cầu, một dòng nội dung, thanh cường
 * >  độ mảnh, thời gian còn lại. Sắp theo `cuongDo × độ gần tiêu điểm`."
 *
 * [BB] 22.3 — bốn cách trả lời phải NGANG HÀNG nhau trên màn hình. `Làm ngơ`
 * không được là một nút xám nhỏ ở góc: nó là lựa chọn hạng nhất, và trong rất
 * nhiều ván nó là lựa chọn đúng. Đặt nó thành "hủy" là bóp méo cả trò chơi.
 */
import type { CSSProperties } from 'react';
import { Icon } from '../design/Icon.js';
import type { Prayer, CachTraLoi } from '../../core/schema/than.js';
import { HAU_QUA_TRA_LOI } from '../../core/schema/than.js';

export type CachDuoc = Exclude<CachTraLoi, 'chua'>;

/** Bốn cách của bảng 22.3, cộng `tra_gia`. Thứ tự cố định để cơ bắp nhớ được. */
const CACH: readonly { id: CachDuoc; nhan: string; goiY: string }[] = [
  { id: 'ban_phuoc', nhan: 'Ban phước', goiY: 'Gỡ đúng thứ đang chặn họ. Họ sẽ xin lần nữa.' },
  { id: 'dau_hieu', nhan: 'Cho dấu hiệu', goiY: 'Không giải quyết gì. Họ tự hiểu, và có thể hiểu sai.' },
  { id: 'lam_ngo', nhan: 'Làm ngơ', goiY: 'Im lặng. Thất vọng tích lại và có ngưỡng.' },
  { id: 'trung_phat', nhan: 'Trừng phạt', goiY: 'Họ nhận điều không xin. Từ nay cầu vì sợ.' },
];

const nhan: CSSProperties = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };

function nutTraLoi(chinh: boolean): CSSProperties {
  return {
    flex: '1 1 0',
    minWidth: 0,
    background: 'transparent',
    color: chinh ? 'var(--dong)' : 'var(--tro)',
    border: `1px solid ${chinh ? 'var(--dong)' : 'var(--kinh-vien)'}`,
    borderRadius: 'var(--r-sm)',
    padding: '7px 8px',
    font: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
}

export function TheCauNguyen({
  cau,
  tenNguoiCau,
  tick,
  onTraLoi,
}: {
  cau: Prayer;
  tenNguoiCau: string;
  tick: number;
  onTraLoi: (cach: CachDuoc) => void;
}): JSX.Element {
  const conLai = cau.hanChot === null ? null : cau.hanChot - tick;
  const gap = conLai !== null && conLai <= 3;

  return (
    <article className="kinh--cap2" style={{ padding: 12, display: 'grid', gap: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
        <span className="ten-rieng" style={{ fontSize: 13 }}>
          {tenNguoiCau}
        </span>
        <span style={{ ...nhan, color: gap ? 'var(--hoi)' : 'var(--mo)', whiteSpace: 'nowrap' }}>
          {conLai === null ? 'không hạn' : conLai <= 0 ? 'đã quá hạn' : `còn ${conLai} nhịp`}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{cau.noiDung}</p>

      {/* Nhiều người cùng cầu một điều thì đó là làn sóng, không phải một lời. */}
      {cau.soNguoi > 1 && (
        <span style={{ ...nhan, color: 'var(--tro)' }}>
          {cau.soNguoi.toLocaleString('vi-VN')} người cùng cầu
        </span>
      )}

      {/* Thanh cường độ MẢNH — 22.4 nói mảnh, và mảnh là đúng: nó không phải HP. */}
      <div
        role="img"
        aria-label={`Cường độ ${Math.round(cau.cuongDo)} trên 100`}
        style={{ height: 2, background: 'var(--kinh-vien)', borderRadius: 2 }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(2, Math.min(100, cau.cuongDo))}%`,
            background: 'var(--dong)',
            borderRadius: 2,
          }}
        />
      </div>

      {/*
       * Bốn nút cùng kích thước, cùng hàng, cùng trọng lượng thị giác.
       * [BB] 22.3 — `Làm ngơ` đứng giữa, không bị đẩy ra rìa.
       */}
      <div style={{ display: 'flex', gap: 6 }}>
        {CACH.map((c) => (
          <button
            key={c.id}
            type="button"
            style={nutTraLoi(c.id === 'ban_phuoc')}
            title={`${c.nhan} — ${c.goiY}`}
            onClick={() => onTraLoi(c.id)}
          >
            {c.nhan}
          </button>
        ))}
      </div>
    </article>
  );
}

export function KhungCauNguyen({
  ds,
  tenCua,
  tick,
  onTraLoi,
}: {
  ds: readonly Prayer[];
  tenCua: (id: string) => string;
  tick: number;
  onTraLoi: (cau: Prayer, cach: CachDuoc) => void;
}): JSX.Element {
  return (
    <section className="kinh hien-panel" style={{ padding: 16, display: 'grid', gap: 12 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon ten="cau_nguyen" co={16} style={{ color: 'var(--dong)' }} />
        <h2 style={{ ...nhan, margin: 0, textTransform: 'uppercase' }}>Lời cầu</h2>
        {ds.length > 0 && (
          <span style={{ ...nhan, marginLeft: 'auto', fontFamily: 'var(--chu-so)' }}>{ds.length}</span>
        )}
      </header>

      {ds.length === 0 ? (
        // [BB] 36.7 — màn hình rỗng là lời mời, không phải thông báo lỗi.
        <p style={{ margin: 0, fontSize: 13, color: 'var(--mo)', lineHeight: 1.5 }}>
          Chưa ai gọi tên ngươi. Người ta vẫn tự xoay xở được.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {ds.slice(0, 6).map((c) => (
            <TheCauNguyen
              key={c.id}
              cau={c}
              tenNguoiCau={tenCua(c.nguoiCauId)}
              tick={tick}
              onTraLoi={(cach) => onTraLoi(c, cach)}
            />
          ))}
        </div>
      )}

      {/* Hậu quả nói trước, không giấu sau lưng người chơi. */}
      {ds.length > 0 && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--mo)', lineHeight: 1.5 }}>
          Cả bốn cách đều để lại dấu. {HAU_QUA_TRA_LOI.lam_ngo.nhan} cũng là một câu trả lời.
        </p>
      )}
    </section>
  );
}
