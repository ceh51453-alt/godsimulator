import { useMemo } from 'react';
import { taiLieuHtmlCachLy } from '../../core/preset/sandbox.js';

/** Hiển thị HTML do regex preset tạo trong một iframe không có quyền chạy mã. */
export function NoiDungPreset({ html }: { html: string }): JSX.Element {
  const doc = useMemo(() => taiLieuHtmlCachLy(html).html, [html]);
  return (
    <iframe
      title="Nội dung do preset định dạng"
      sandbox=""
      referrerPolicy="no-referrer"
      srcDoc={doc}
      style={{ width: '100%', minHeight: 360, border: 0, background: 'transparent', display: 'block' }}
    />
  );
}
