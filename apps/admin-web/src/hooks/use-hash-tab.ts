import { useLocation, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

export function useHashTab<T extends string>(
  validTabs: readonly T[],
  defaultTab: T,
): [T, (tab: T) => void] {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const normalizedHash = decodeURIComponent(hash).toLowerCase();
  const activeTab = validTabs.find((tab) => tab.toLowerCase() === normalizedHash) ?? defaultTab;

  const setActiveTab = useCallback((tab: T) => {
    void navigate({ hash: tab, replace: true });
  }, [navigate]);

  return [activeTab, setActiveTab];
}
