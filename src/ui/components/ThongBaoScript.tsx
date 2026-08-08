import { usePreset } from '../../store/preset.js';

/**
 * Toast của script preset — `toastr.success/info/warning/error`.
 *
 * Script thật dùng toast để nói những thứ chỉ chúng biết: "đã chuyển bối cảnh",
 * "regex bắt được 3 mục", "thiếu prompt tên X". Nuốt chúng nghĩa là script chạy
 * đúng mà người dùng không có cách nào biết, và một script chạy sai cũng trông y
 * hệt. Nên chúng hiện ngay trên màn chơi, và tự tắt được bằng một cú bấm.
 */
export function ThongBaoScript(): JSX.Element | null {
  const ds = usePreset((s) => s.thongBao);
  const go = usePreset((s) => s.goThongBao);
  if (ds.length === 0) return null;

  const mau = (muc: string): string =>
    muc === 'error' ? 'var(--hoi)' : muc === 'warning' ? 'var(--dong)' : 'var(--ngoc)';

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 60,
        display: 'grid',
        gap: 8,
        maxWidth: 340,
      }}
    >
      {ds.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => go(t.id)}
          className="kinh"
          style={{
            textAlign: 'left',
            padding: '10px 12px',
            font: 'inherit',
            fontSize: 13,
            color: 'var(--tro)',
            borderLeft: `2px solid ${mau(t.muc)}`,
            cursor: 'pointer',
          }}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}
