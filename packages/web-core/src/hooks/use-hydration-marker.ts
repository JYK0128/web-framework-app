import { useEffect } from 'react';

export function useHydrationMarker(): void {
  useEffect(() => {
    document.documentElement.setAttribute('data-hydrated', 'true');
  }, []);
}
