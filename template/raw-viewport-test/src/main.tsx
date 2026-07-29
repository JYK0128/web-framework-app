import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initVirtualKeyboard } from './lib/virtual-keyboard';
import { initEnvironment } from './lib/browser';

initEnvironment();
initVirtualKeyboard();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
