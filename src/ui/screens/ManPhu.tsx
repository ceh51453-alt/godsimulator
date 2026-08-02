/**
 * Khung cho màn toàn trang ngoài Sảnh.
 *
 * Một thanh duy nhất, và nó tồn tại vì một luật rất đơn giản: **không màn nào
 * được là ngõ cụt.** Thế giới vẫn đang chạy sau lưng người chơi, nên đường quay
 * lại phải luôn nhìn thấy được và luôn bấm được bằng phím.
 */
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useUi, TEN_MAN_HINH } from '../../store/ui.js';
import { Icon } from '../design/Icon.js';

export function ManPhu({ children }: { children: ReactNode }): JSX.Element {
  const man = useUi((s) => s.man);
  const doiMan = useUi((s) => s.doiMan);

  // `Esc` quay về Sảnh — cùng phím với đóng lớp phủ, cùng nghĩa "về chỗ cũ".
  useEffect(() => {
    const nghe = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') doiMan('sanh');
    };
    window.addEventListener('keydown', nghe);
    return () => window.removeEventListener('keydown', nghe);
  }, [doiMan]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 22px',
          borderBottom: '1px solid var(--kinh-vien)',
        }}
      >
        <button
          type="button"
          onClick={() => doiMan('sanh')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'transparent',
            color: 'var(--tro)',
            border: '1px solid var(--kinh-vien)',
            borderRadius: 'var(--r-sm)',
            padding: '6px 13px',
            font: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Icon ten="tinh_do" co={14} />
          Về Sảnh
        </button>
        <span
          style={{ color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          {TEN_MAN_HINH[man]} · Esc để quay lại
        </span>
      </header>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</div>
    </div>
  );
}
