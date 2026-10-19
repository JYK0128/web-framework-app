import { detectWebEnvironment } from '@pkg/shared/web/browser-environment';

export function initEnvironment(): void {
  if (typeof document === 'undefined') return;
  const environment = detectWebEnvironment();

  document.documentElement.dataset.environment = environment.type;
  document.documentElement.dataset.os = environment.os.toLowerCase();
  document.documentElement.dataset.browser = environment.browser.toLowerCase();
  document.documentElement.dataset.isPwa = environment.isPWA ? 'true' : 'false';
  document.documentElement.dataset.isWebview = environment.isWebView ? 'true' : 'false';
}
