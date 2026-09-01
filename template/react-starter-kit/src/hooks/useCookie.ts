import { type CookieOptions, deleteCookie, getCookie, setCookie, subscribeCookie } from '@pkg/shared/web';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * A generalized React hook for reading, writing, and reactively subscribing to browser cookies.
 * Uses useSyncExternalStore for flicker-free, SSR-safe hydration.
 *
 * @param name The name of the cookie to manage
 * @param defaultValue Optional fallback value when cookie is not set
 * @returns [cookieValue, setCookieValue] tuple
 */
export function useCookie(
  name: string,
  defaultValue: string | null = null,
): [string | null, (value: string | null, options?: CookieOptions) => void] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeCookie(name, onStoreChange),
    [name],
  );

  const getSnapshot = useCallback(() => getCookie(name) ?? defaultValue, [name, defaultValue]);
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const cookieValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateCookie = useCallback(
    (value: string | null, options?: CookieOptions) => {
      if (value === null) {
        deleteCookie(name, options);
      }
      else {
        setCookie(name, value, options);
      }
    },
    [name],
  );

  return [cookieValue, updateCookie];
}

/**
 * A read-only variant of useCookie for reactive subscription without setter.
 */
export function useCookieValue(name: string, defaultValue: string | null = null): string | null {
  const [value] = useCookie(name, defaultValue);
  return value;
}
