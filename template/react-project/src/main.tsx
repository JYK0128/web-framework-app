import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

let cleanupServiceWorker = () => {};

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const registerServiceWorker = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
      console.error('PWA service worker registration failed:', error);
    });
  };

  window.addEventListener('load', registerServiceWorker, { once: true });
  cleanupServiceWorker = () => {
    window.removeEventListener('load', registerServiceWorker);
  };
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupServiceWorker();
    root.unmount();
  });
}
