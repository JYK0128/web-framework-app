export type EnvironmentOS = 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Other';

export type EnvironmentBrowser
  = | 'InAppBrowser'
    | 'Edge'
    | 'Chrome'
    | 'Safari'
    | 'Firefox'
    | 'Unknown';

export type EnvironmentType = 'ios-safari' | 'pwa' | 'webview' | 'browser';

export interface IOSVersion {
  major: number
  minor: number
  patch: number
}

export interface DetectedEnvironment {
  type: EnvironmentType
  os: EnvironmentOS
  browser: EnvironmentBrowser
  iosVersion: IOSVersion | null
  isPWA: boolean
  isWebView: boolean
  isWebBrowser: boolean
}

interface StandaloneNavigator extends Navigator {
  standalone?: boolean
}

function parseIOSVersion(ua: string, isIOS: boolean): IOSVersion | null {
  if (!isIOS || typeof ua !== 'string' || !ua) return null;

  const match = /OS\s(\d+)[._](\d+)(?:[._](\d+))?/i.exec(ua);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0),
  };
}

function detectOS(ua: string): { os: EnvironmentOS, isIOS: boolean } {
  const safeUa = typeof ua === 'string' ? ua : '';
  const isTouchMac = typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 1;
  const isIOS = /iPhone|iPad|iPod/i.test(safeUa) || (safeUa.includes('Macintosh') && isTouchMac);

  if (isIOS) return { os: 'iOS', isIOS: true };
  if (/Android/i.test(safeUa)) return { os: 'Android', isIOS: false };
  if (/Macintosh/i.test(safeUa)) return { os: 'macOS', isIOS: false };
  if (/Windows/i.test(safeUa)) return { os: 'Windows', isIOS: false };
  return { os: 'Other', isIOS: false };
}

function detectBrowserType(ua: string, isInApp: boolean, isIOSAlt: boolean, isAndroid: boolean): EnvironmentBrowser {
  const safeUa = typeof ua === 'string' ? ua : '';
  if (isInApp) return 'InAppBrowser';
  if (/Edg/i.test(safeUa)) return 'Edge';
  if (/Chrome|CriOS/i.test(safeUa)) return 'Chrome';
  if (/Safari/i.test(safeUa) && !isIOSAlt && !isAndroid) return 'Safari';
  if (/Firefox/i.test(safeUa)) return 'Firefox';
  return 'Unknown';
}

function detectIsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const navStandalone = (window.navigator as StandaloneNavigator).standalone === true;
  const isRefApp = typeof document !== 'undefined' && Boolean(document.referrer && document.referrer.includes('android-app://'));
  return isStandalone || navStandalone || isRefApp;
}

export function detectEnvironment(): DetectedEnvironment {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
  const { os, isIOS } = detectOS(ua);
  const iosVersion = parseIOSVersion(ua, isIOS);

  const isIOSAlt = /CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua);
  const isAndroidWebView = /wv/i.test(ua) || /Android.*Version\/[0-9.]+/i.test(ua);
  const isIOSWebView = isIOS && !/Safari/i.test(ua) && !isIOSAlt;
  const isInAppBrowser = /KAKAOTALK|Instagram|FBAN|FBAV|Line|NAVER|Trill/i.test(ua);
  const isWebView = isAndroidWebView || isIOSWebView || isInAppBrowser;

  const isPWA = detectIsPWA();
  const browser = detectBrowserType(ua, isInAppBrowser, isIOSAlt, os === 'Android');

  const isIOSSafari
    = os === 'iOS'
      && browser === 'Safari'
      && (iosVersion?.major ?? 0) >= 15
      && !isPWA
      && !isWebView;

  let type: EnvironmentType = 'browser';
  if (isIOSSafari) type = 'ios-safari';
  else if (isPWA) type = 'pwa';
  else if (isWebView) type = 'webview';

  return {
    type,
    os,
    browser,
    iosVersion,
    isPWA,
    isWebView,
    isWebBrowser: !isPWA && !isWebView,
  };
}

export function initEnvironment(): void {
  if (typeof document === 'undefined') return;
  const environment = detectEnvironment();

  document.documentElement.dataset.environment = environment.type;
  document.documentElement.dataset.os = environment.os.toLowerCase();
  document.documentElement.dataset.browser = environment.browser.toLowerCase();
  document.documentElement.dataset.isPwa = environment.isPWA ? 'true' : 'false';
  document.documentElement.dataset.isWebview = environment.isWebView ? 'true' : 'false';
}
