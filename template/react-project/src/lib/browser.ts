export type EnvironmentOS = 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Other';

export type EnvironmentBrowser =
  | 'InAppBrowser'
  | 'Edge'
  | 'Chrome'
  | 'Safari'
  | 'Firefox'
  | 'Unknown';

export type EnvironmentType = 'ios-safari' | 'pwa' | 'webview' | 'browser';

export interface IOSVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface DetectedEnvironment {
  type: EnvironmentType;
  os: EnvironmentOS;
  browser: EnvironmentBrowser;
  iosVersion: IOSVersion | null;
  isPWA: boolean;
  isWebView: boolean;
  isWebBrowser: boolean;
}

interface StandaloneNavigator extends Navigator {
  standalone?: boolean;
}

function parseIOSVersion(ua: string, isIOS: boolean): IOSVersion | null {
  if (!isIOS) return null;

  const match = ua.match(/OS\s(\d+)[._](\d+)(?:[._](\d+))?/i);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0),
  };
}

export function detectEnvironment(): DetectedEnvironment {
  const ua = navigator.userAgent || '';

  // 1. OS 판별
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const iosVersion = parseIOSVersion(ua, isIOS);
  const isAndroid = /Android/i.test(ua);
  const isMacOS = /Macintosh/i.test(ua) && !isIOS;
  const isWindows = /Windows/i.test(ua);
  const isIOSAlternativeBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua);

  // 2. WebView / 인앱 브라우저 판별
  const isAndroidWebView = /wv/i.test(ua) || /Android.*Version\/[0-9.]+/i.test(ua);
  const isIOSWebView = isIOS && !/Safari/i.test(ua) && !isIOSAlternativeBrowser;
  const isInAppBrowser = /KAKAOTALK|Instagram|FBAN|FBAV|Line|NAVER|Trill/i.test(ua);
  const isWebView = isAndroidWebView || isIOSWebView || isInAppBrowser;

  // 3. PWA (Standalone 실행 상태)
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as StandaloneNavigator).standalone === true ||
    document.referrer.includes('android-app://');
  const isSafari = /Safari/i.test(ua) && !isIOSAlternativeBrowser;

  // 4. 브라우저 종류 (일반 브라우저 기준)
  let browser: EnvironmentBrowser = 'Unknown';
  if (isInAppBrowser) browser = 'InAppBrowser';
  else if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (isSafari && !isAndroid) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  const os: EnvironmentOS = isIOS
    ? 'iOS'
    : isAndroid
      ? 'Android'
      : isMacOS
        ? 'macOS'
        : isWindows
          ? 'Windows'
        : 'Other';

  const isIOSSafari =
    os === 'iOS' &&
    browser === 'Safari' &&
    (iosVersion?.major ?? 0) >= 15 &&
    !isPWA &&
    !isWebView;

  const type: EnvironmentType = isIOSSafari
    ? 'ios-safari'
    : isPWA
      ? 'pwa'
      : isWebView
        ? 'webview'
        : 'browser';

  return {
    type,
    os,
    browser,
    iosVersion,
    isPWA,
    isWebView,
    // PWA도 아니고 WebView도 아닌 전형적인 브라우저 탭
    isWebBrowser: !isPWA && !isWebView
  };
}

export function initEnvironment(): void {
  const environment = detectEnvironment();

  document.documentElement.dataset.environment = environment.type;
}
