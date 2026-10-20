import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

export function useSessionExpiration(enabled: boolean): void {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    let invalidating = false;
    const expireSession = () => {
      if (invalidating) return;
      invalidating = true;
      queryClient.clear();
      void router.invalidate();
    };

    window.addEventListener('auth-session-expired', expireSession);
    return () => window.removeEventListener('auth-session-expired', expireSession);
  }, [enabled, queryClient, router]);
}
