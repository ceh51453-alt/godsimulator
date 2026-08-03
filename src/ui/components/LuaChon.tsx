/**
 * `<LuaChon>` — Render danh sách lựa chọn từ `<choice>` block.
 *
 * Preset SillyTavern ("Tide Choice") tạo `<choice>` block trong output AI.
 * Component này parse chúng thành buttons tương tác. Click → gửi ngay hoặc
 * điền vào ô input.
 *
 * [BB] 36.1 — không emoji trong nút. Sử dụng số thứ tự thay thế.
 * [BB] luật bất biến #9 — không dấu hiệu nào chỉ bằng màu.
 */
import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';

type Props = {
  /** Danh sách text lựa chọn. */
  readonly luaChon: readonly string[];
  /** Gọi khi user chọn một lựa chọn. */
  readonly onChon: (text: string) => void;
  /** Đang gửi — khóa buttons. */
  readonly dangKe: boolean;
};

const CONTAINER: CSSProperties = {
  background: 'var(--kinh-nen)',
  border: '1px solid var(--kinh-vien)',
  borderRadius: 'var(--r-md)',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingBottom: 8,
  borderBottom: '1px solid var(--kinh-vien)',
  marginBottom: 4,
};

const HEADER_TITLE: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--mo)',
  flex: 1,
};

const TOGGLE_LABEL: CSSProperties = {
  fontSize: 11,
  color: 'var(--mo)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

function nutChon(tat: boolean): CSSProperties {
  return {
    background: 'transparent',
    color: tat ? 'var(--mo)' : 'var(--tro)',
    border: '1px solid var(--kinh-vien)',
    borderRadius: 'var(--r-sm)',
    padding: '10px 14px',
    font: 'inherit',
    fontSize: 13,
    cursor: tat ? 'not-allowed' : 'pointer',
    opacity: tat ? 0.5 : 1,
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    transition: 'border-color 0.15s, color 0.15s',
  };
}

const INDEX_BADGE: CSSProperties = {
  fontSize: 11,
  background: 'var(--kinh-nen-2)',
  padding: '2px 8px',
  borderRadius: 'var(--r-sm)',
  minWidth: 28,
  textAlign: 'center',
  color: 'var(--mo)',
  fontFamily: 'monospace',
};

export default function LuaChon({ luaChon, onChon, dangKe }: Props): JSX.Element | null {
  const [guiTrucTiep, setGuiTrucTiep] = useState(true);

  const xuLyChon = useCallback(
    (text: string) => {
      if (dangKe) return;
      onChon(text);
    },
    [dangKe, onChon],
  );

  if (luaChon.length === 0) return null;

  return (
    <div style={CONTAINER}>
      <div style={HEADER}>
        <span style={HEADER_TITLE}>Lua chon hanh dong</span>
        <label style={TOGGLE_LABEL}>
          <input type="checkbox" checked={guiTrucTiep} onChange={(e) => setGuiTrucTiep(e.target.checked)} />
          Gui truc tiep
        </label>
      </div>
      {luaChon.map((lc, i) => (
        <button key={i} style={nutChon(dangKe)} disabled={dangKe} onClick={() => xuLyChon(lc)} type="button">
          <span style={INDEX_BADGE}>{String(i + 1).padStart(2, '0')}</span>
          <span>{lc}</span>
        </button>
      ))}
    </div>
  );
}
