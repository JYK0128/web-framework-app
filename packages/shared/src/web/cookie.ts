export type CookieOptions = {
  path?: string
  maxAge?: number
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
  domain?: string
};

const DEFAULT_OPTIONS: CookieOptions = {
  path: '/',
  maxAge: 31536000, // 1 year
  sameSite: 'lax',
};

const COOKIE_CHANGE_EVENT = 'app-cookie-change';

type CookieChangeEventDetail = {
  name: string
};

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const match = new RegExp(`(?:^|; )${name}=([^;]*)`).exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, options?: CookieOptions): void {
  if (typeof document === 'undefined') return;

  const merged = { ...DEFAULT_OPTIONS, ...options };
  let cookieString = `${name}=${encodeURIComponent(value)}`;

  if (merged.path) cookieString += `; path=${merged.path}`;
  if (merged.maxAge !== undefined) cookieString += `; max-age=${merged.maxAge}`;
  if (merged.domain) cookieString += `; domain=${merged.domain}`;
  if (merged.sameSite) cookieString += `; SameSite=${merged.sameSite.charAt(0).toUpperCase() + merged.sameSite.slice(1)}`;
  if (merged.secure) cookieString += '; Secure';

  document.cookie = cookieString;
  dispatchCookieChange(name);
}

export function deleteCookie(name: string, options?: Pick<CookieOptions, 'path' | 'domain'>): void {
  setCookie(name, '', { ...options, maxAge: 0 });
}

export function dispatchCookieChange(name: string): void {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent<CookieChangeEventDetail>(COOKIE_CHANGE_EVENT, {
    detail: { name },
  });
  window.dispatchEvent(event);
}

export function subscribeCookie(
  targetName: string | null,
  callback: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<CookieChangeEventDetail>;
    if (!targetName || customEvent.detail?.name === targetName) {
      callback();
    }
  };

  window.addEventListener(COOKIE_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(COOKIE_CHANGE_EVENT, handler);
  };
}
