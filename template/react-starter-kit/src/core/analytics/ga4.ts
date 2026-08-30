import { toBoolean } from '@pkg/shared/common';
import { getCookie, setCookie, subscribeCookie } from '@pkg/shared/web';

import { env } from '#/env';

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const GA_MEASUREMENT_ID = env.VITE_GA_MEASUREMENT_ID;
export const ANALYTICS_CONSENT_COOKIE = 'analytics_consent';

export { getCookie, setCookie };

export function getAnalyticsConsentState(): boolean | null {
  return toBoolean(getCookie(ANALYTICS_CONSENT_COOKIE));
}

export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsentState() === true;
}

export function disableGoogleAnalytics(disable = true): void {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = disable;
}

export function subscribeToConsent(onStoreChange: () => void): () => void {
  return subscribeCookie(ANALYTICS_CONSENT_COOKIE, onStoreChange);
}

export function setAnalyticsConsent(granted: boolean, nonce?: string): void {
  if (typeof window === 'undefined') return;

  setCookie(ANALYTICS_CONSENT_COOKIE, granted ? '1' : '0');
  disableGoogleAnalytics(!granted);

  if (granted) {
    loadGoogleAnalytics(nonce);
    window.dispatchEvent(new Event('analytics-consent-granted'));
  }
}

export function loadGoogleAnalytics(nonce?: string): void {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;

  if (hasAnalyticsConsent()) {
    disableGoogleAnalytics(false);
  }

  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  if (document.querySelector(`script[data-ga4="${GA_MEASUREMENT_ID}"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.dataset.ga4 = GA_MEASUREMENT_ID;
  if (nonce) script.nonce = nonce;
  document.head.appendChild(script);
}

/**
 * Send page_view event to GA4
 */
export function trackPageView(url: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_location: url,
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
  });
}

/**
 * Send custom event to GA4
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, params);
}
