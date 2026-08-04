import { StartClient } from '@tanstack/react-start/client';
import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

startTransition(() => {
  hydrateRoot(document, <StartClient />);
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
      console.error('PWA service worker registration failed:', error);
    });
  }, { once: true });
}
