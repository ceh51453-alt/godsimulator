/**
 * Khung Sảnh — bố cục ba cột. Phần 37.3.
 *
 * Rail ký hiệu · khung kể · bảng trạng thái. Đây là bố cục mà mọi game nhập vai
 * có bảng bên phải đều hội tụ về, và nó đúng vì ba việc người chơi làm liên tục
 * là **đọc chuyện**, **nhìn mình đang ở đâu**, và **gõ câu tiếp theo**.
 *
 * [BB] 36.1 — không emoji ở bất kỳ đâu, kể cả placeholder. Mọi ký hiệu là SVG
 * vẽ tay trong `design/Icon.tsx`.
 * [BB] 36.4 — kính không lồng quá hai cấp: khung này là cấp 0 (nền), panel là
 * `.kinh` (cấp 1), thẻ bên trong panel là `.kinh--cap2`. Hết.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../design/Icon.js';
import type { TenIcon } from '../design/Icon.js';

export type MucRail = {
  readonly id: string;
  readonly icon: TenIcon;
  readonly nhan: string;
  readonly bat?: boolean;
  readonly onChon?: () => void;
};

const nhanNho: CSSProperties = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };

function nutRail(bat: boolean): CSSProperties {
  return {
    width: 40,
    height: 40,
    display: 'grid',
    placeItems: 'center',
    background: bat ? 'var(--kinh-nen-2)' : 'transparent',
    color: bat ? 'var(--dong)' : 'var(--mo)',
    border: `1px solid ${bat ? 'var(--kinh-vien)' : 'transparent'}`,
    borderRadius: 'var(--r-md)',
    cursor: 'pointer',
    padding: 0,
    transition: `color var(--thoi-luong) var(--duong-cong)`,
  };
}

export function KhungSanh({
  tieuDe,
  phuDe,
  rail,
  dauTrang,
  thanhTren,
  giua,
  phai,
  lopPhu,
}: {
  tieuDe: string;
  phuDe: string;
  rail: readonly MucRail[];
  dauTrang?: ReactNode;
  /** Thanh Thiên Tượng — 55.2, luôn hiện, ngay dưới tiêu đề. */
  thanhTren?: ReactNode;
  giua: ReactNode;
  phai: ReactNode;
  /**
   * Lớp phủ đọc — [BB] 55.1.
   *
   * Nó phủ lên vùng giữa và phải; rail bên trái vẫn còn (58.2). Vì thế nó nằm
   * TRONG khung chứ không nằm ngoài `<div>` gốc: một lớp phủ toàn màn hình sẽ
   * là một modal, và modal thì dừng trò chơi lại.
   */
  lopPhu?: ReactNode;
}): JSX.Element {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 22px',
          borderBottom: '1px solid var(--kinh-vien)',
          flexWrap: 'wrap',
        }}
      >
        <Icon ten="tinh_do" co={22} style={{ color: 'var(--dong)', flex: '0 0 auto' }} />
        <div style={{ minWidth: 0 }}>
          <h1 className="chu-hien" style={{ margin: 0, fontSize: 24, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {tieuDe}
          </h1>
          <p style={{ ...nhanNho, margin: 0 }}>{phuDe}</p>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {dauTrang}
        </div>
      </header>

      {thanhTren}

      <div className="khung-sanh">
        {/* ── rail ký hiệu ── */}
        <nav aria-label="Khu vực" className="khung-sanh__rail">
          {rail.map((m) => (
            <button
              key={m.id}
              type="button"
              // [BB] Không thao tác nào chỉ dựa vào màu — mỗi nút có nhãn chữ
              // cho trình đọc màn hình và tooltip cho chuột.
              aria-label={m.nhan}
              aria-pressed={m.bat === true}
              title={m.nhan}
              style={nutRail(m.bat === true)}
              onClick={m.onChon}
            >
              <Icon ten={m.icon} co={19} />
            </button>
          ))}
        </nav>

        {/* ── khung kể ── */}
        <main
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {giua}
          {lopPhu}
        </main>

        {/* ── bảng trạng thái ── */}
        <aside aria-label="Trạng thái" className="khung-sanh__phai">
          {phai}
        </aside>
      </div>
    </div>
  );
}

/** Chip hành động gợi ý — [BB] 67.7: gợi ý, KHÔNG phải biên giới. */
export function ChipHanhDong({
  nhan,
  icon,
  onChon,
}: {
  nhan: string;
  icon: TenIcon;
  onChon: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onChon}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: 'transparent',
        color: 'var(--tro)',
        border: '1px solid var(--kinh-vien)',
        borderRadius: 999,
        padding: '7px 14px',
        font: 'inherit',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      <Icon ten={icon} co={14} />
      {nhan}
    </button>
  );
}
