import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/design/tokens.css';
import { App } from './App.js';

const goc = document.getElementById('root');
if (!goc) throw new Error('Không tìm thấy #root.');

createRoot(goc).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
