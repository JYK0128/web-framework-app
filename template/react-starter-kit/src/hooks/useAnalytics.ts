import { useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';

import { trackEvent, trackPageView } from '#/core/analytics/ga4';

export function useAnalytics(): void {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });

  // 1. Automatic SPA Pageview Tracking
  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;

    const queryString = search ? `?${search}` : '';
    const fullUrl = `${window.location.origin}${pathname}${queryString}`;
    trackPageView(fullUrl);
  }, [pathname, search]);

  // 2. Global Data-Attribute Click Auto-Tracking (data-ga-click / data-ga-event)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;

    const handleGlobalClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest?.(
        '[data-ga-click], [data-ga-event]',
      ) as HTMLElement | null;

      if (!target) return;

      const clickAction = target.getAttribute('data-ga-click');
      const customEvent = target.getAttribute('data-ga-event');
      const category = target.getAttribute('data-ga-category') || undefined;
      const label = target.getAttribute('data-ga-label') || undefined;

      if (customEvent) {
        trackEvent(customEvent, {
          event_category: category,
          event_label: label,
          element_text: target.textContent?.trim().slice(0, 50),
          page_path: window.location.pathname,
        });
      }
      else if (clickAction) {
        trackEvent('click', {
          element_id: clickAction,
          event_category: category,
          event_label: label,
          element_text: target.textContent?.trim().slice(0, 50),
          page_path: window.location.pathname,
        });
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);
}
