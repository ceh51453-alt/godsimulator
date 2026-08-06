import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/design/tokens.css';
import { App } from './App.js';
import { RanhLoi } from './ui/RanhLoi.js';

const goc = document.getElementById('root');
if (!goc) throw new Error('Không tìm thấy #root.');

/*
 * Rãnh lỗi bọc NGOÀI `App`, không nằm trong nó.
 *
 * `App` tự nó là một component có thể ném: nó đọc bốn store, gọi `cong()` và
 * chọn màn. Một rãnh lỗi đặt bên trong `App` sẽ không bắt được chính `App`, và
 * lúc ấy ta lại có đúng trang trắng mà rãnh lỗi tồn tại để chống.
 */
createRoot(goc).render(
  <StrictMode>
    <RanhLoi>
      <App />
    </RanhLoi>
  </StrictMode>,
);
