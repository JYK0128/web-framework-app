import { env } from '#/env';

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const GA_MEASUREMENT_ID = env.VITE_GA_MEASUREMENT_ID;

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
