export type EnvironmentOS = 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Other';

export type EnvironmentBrowser
  = | 'InAppBrowser'
    | 'Edge'
    | 'Chrome'
    | 'Safari'
    | 'Firefox'
    | 'Unknown';

export type EnvironmentType = 'ios-safari' | 'pwa' | 'webview' | 'browser' | 'native-app';

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
  isNativeApp: boolean
}

export function parseIOSVersion(ua: string, isIOS: boolean): IOSVersion | null {
  if (!isIOS || typeof ua !== 'string' || !ua) return null;

  const match = /OS\s(\d+)[._](\d+)(?:[._](\d+))?/i.exec(ua);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0),
  };
}

export function detectOS(ua: string): { os: EnvironmentOS, isIOS: boolean } {
  const safeUa = typeof ua === 'string' ? ua : '';
  const isTouchMac = typeof navigator !== 'undefined'
    && ((navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 1
    && safeUa.includes('Macintosh');
  const isIOS = /iPhone|iPad|iPod/i.test(safeUa) || isTouchMac;

  if (isIOS) return { os: 'iOS', isIOS: true };
  if (/Android/i.test(safeUa)) return { os: 'Android', isIOS: false };
  if (/Macintosh/i.test(safeUa)) return { os: 'macOS', isIOS: false };
  if (/Windows/i.test(safeUa)) return { os: 'Windows', isIOS: false };
  return { os: 'Other', isIOS: false };
}

export function detectBrowserType(ua: string, isInApp: boolean, isIOSAlt: boolean, isAndroid: boolean): EnvironmentBrowser {
  const safeUa = typeof ua === 'string' ? ua : '';
  if (isInApp) return 'InAppBrowser';
  if (/Edg/i.test(safeUa)) return 'Edge';
  if (/Chrome|CriOS/i.test(safeUa)) return 'Chrome';
  if (/Safari/i.test(safeUa) && !isIOSAlt && !isAndroid) return 'Safari';
  if (/Firefox/i.test(safeUa)) return 'Firefox';
  return 'Unknown';
}

export function detectEnvironment(userAgent?: string, isPWA = false): DetectedEnvironment {
  const ua = (typeof userAgent === 'string' ? userAgent : '').trim();
  const { os, isIOS } = detectOS(ua);
  const iosVersion = parseIOSVersion(ua, isIOS);

  const isIOSAlt = /CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua);
  const isAndroidWebView = /wv/i.test(ua) || /Android.*Version\/[0-9.]+/i.test(ua);
  const isInAppBrowser = /KAKAOTALK|Instagram|FBAN|FBAV|Line|NAVER|Daum|Whale|Toss|Trill|Twitter|Snapchat/i.test(ua);
  const isIOSWebView = (isIOS && !/Safari/i.test(ua) && !isIOSAlt) || (isIOS && /Mobile\/[0-9A-Z]+/i.test(ua) && !/Safari\/[0-9.]+/i.test(ua));
  const isWebView = isAndroidWebView || isIOSWebView || isInAppBrowser;

  const isMozilla = /Mozilla/i.test(ua);
  const isWebBrowser = isMozilla && !isPWA && !isWebView;
  const isNativeApp = !isMozilla && !isWebView;

  const browser = detectBrowserType(ua, isInAppBrowser, isIOSAlt, os === 'Android');

  const isIOSSafari
    = os === 'iOS'
      && browser === 'Safari'
      && (iosVersion?.major ?? 0) >= 15
      && !isPWA
      && !isWebView;

  let type: EnvironmentType = 'browser';
  if (isNativeApp) type = 'native-app';
  else if (isIOSSafari) type = 'ios-safari';
  else if (isPWA) type = 'pwa';
  else if (isWebView) type = 'webview';

  return {
    type,
    os,
    browser,
    iosVersion,
    isPWA,
    isWebView,
    isWebBrowser,
    isNativeApp,
  };
}
