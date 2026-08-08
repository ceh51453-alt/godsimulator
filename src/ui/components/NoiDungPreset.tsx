import { useEffect, useRef } from 'react';

/**
 * Hiển thị HTML do preset sinh ra — **trong DOM thật của trang**.
 *
 * ── Vì sao không còn iframe ──
 *
 * Bản trước nhét khối HTML này vào một `<iframe sandbox="">`. Nó an toàn, và nó
 * cũng làm hỏng đúng thứ preset dựng ra khối HTML để làm: script của chính preset
 * không với tới được nội dung bên trong iframe (khác document, không cùng cây),
 * nên mọi thẻ `<choice>`, mọi bảng trạng thái, mọi khối suy luận đều nằm chết ở
 * đó. Người dùng thấy "regex chạy rồi mà script không làm gì".
 *
 * Giờ nó là DOM thật, nằm trong `.mes_text` giống hệt SillyTavern, và script
 * preset bám vào được. Đây là đánh đổi đã chọn có ý thức: preset là mã của chính
 * người chơi, không phải nội dung của người lạ.
 *
 * `<script>` trong `innerHTML` **vẫn không chạy** — đó là luật của trình duyệt,
 * không phải một hàng rào ta dựng. Script của preset chạy qua host Tavern Helper,
 * nơi có vòng đời và có nút tắt.
 */
export function NoiDungPreset({ html }: { html: string }): JSX.Element {
  const o = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = o.current;
    if (el === null) return;
    el.innerHTML = html;
  }, [html]);

  return <div ref={o} className="noi-dung-preset" />;
}
