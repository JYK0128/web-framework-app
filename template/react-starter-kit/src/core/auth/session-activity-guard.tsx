import { ApplicationError } from '@pkg/shared/common';
import { useRouter } from '@tanstack/react-router';
import { type PropsWithChildren, useCallback, useEffect, useRef } from 'react';

import { authControllerUserProfile } from '#/.generated/api/endpoints/auth/auth';

const SESSION_ROLLING_THRESHOLD_MS = 10 * 60 * 1000;
const ACTIVITY_REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
const MODIFIER_KEYS = new Set(['Alt', 'Control', 'Meta', 'Shift']);

type SessionActivityGuardProps = PropsWithChildren<{
  expiresAt: string | null
}>;

export function SessionActivityGuard({ children, expiresAt }: SessionActivityGuardProps) {
  const router = useRouter();
  const expiresAtRef = useRef(parseExpiresAt(expiresAt));
  const lastAttemptAtRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    expiresAtRef.current = parseExpiresAt(expiresAt);
  }, [expiresAt]);

  const refreshSessionOnActivity = useCallback(() => {
    const now = Date.now();
    const sessionExpiresAt = expiresAtRef.current;
    if (!sessionExpiresAt || sessionExpiresAt.getTime() - now > SESSION_ROLLING_THRESHOLD_MS) return;
    if (isRefreshingRef.current || now - lastAttemptAtRef.current < ACTIVITY_REFRESH_COOLDOWN_MS) return;

    lastAttemptAtRef.current = now;
    isRefreshingRef.current = true;
    void authControllerUserProfile()
      .then((response) => {
        expiresAtRef.current = parseExpiresAt(response?.expiresAt ?? null);
      })
      .catch((error: unknown) => {
        if (error instanceof ApplicationError && error.status === 401) {
          void router.navigate({ to: '/login' });
        }
      })
      .finally(() => {
        isRefreshingRef.current = false;
      });
  }, [router]);

  useEffect(() => {
    const handlePointerDown = () => refreshSessionOnActivity();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (MODIFIER_KEYS.has(event.key)) return;
      refreshSessionOnActivity();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [refreshSessionOnActivity]);

  return children;
}

function parseExpiresAt(value: string | null): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
