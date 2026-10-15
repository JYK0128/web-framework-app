import { type DetectedEnvironment, detectEnvironment } from '#common/environment';

interface StandaloneNavigator extends Navigator {
  standalone?: boolean
}

export function detectIsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const navStandalone = (window.navigator as StandaloneNavigator).standalone === true;
  const isRefApp = typeof document !== 'undefined' && Boolean(document.referrer && document.referrer.includes('android-app://'));
  return isStandalone || navStandalone || isRefApp;
}

export function detectWebEnvironment(): DetectedEnvironment {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
  return detectEnvironment(ua, detectIsPWA());
}
