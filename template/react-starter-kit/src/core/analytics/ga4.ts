declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const FIREBASE_MEASUREMENT_ID: string = (typeof import.meta !== 'undefined' && typeof import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID === 'string')
  ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  : '';

/**
 * Send page_view event to GA4
 */
export function trackPageView(url: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag || !FIREBASE_MEASUREMENT_ID) return;

  window.gtag('event', 'page_view', {
    page_location: url,
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
  });
}

/**
 * Send custom event to GA4
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.gtag || !FIREBASE_MEASUREMENT_ID) return;

  window.gtag('event', eventName, params);
}

/**
 * Set user ID for cross-device tracking
 */
export function setUserId(userId: string | null): void {
  if (typeof window === 'undefined' || !window.gtag || !FIREBASE_MEASUREMENT_ID) return;

  window.gtag('config', FIREBASE_MEASUREMENT_ID, {
    user_id: userId,
  });
}
