import { type DetectedEnvironment, detectEnvironment } from '#common/environment';

export * from '#common/environment';

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
  const isPWA = detectIsPWA();
  return detectEnvironment(ua, isPWA);
}

export function initEnvironment(): void {
  if (typeof document === 'undefined') return;
  const environment = detectWebEnvironment();

  document.documentElement.dataset.environment = environment.type;
  document.documentElement.dataset.os = environment.os.toLowerCase();
  document.documentElement.dataset.browser = environment.browser.toLowerCase();
  document.documentElement.dataset.isPwa = environment.isPWA ? 'true' : 'false';
  document.documentElement.dataset.isWebview = environment.isWebView ? 'true' : 'false';
}
