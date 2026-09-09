import { useCallback, useEffect, useState } from 'react';

/**
 * URL Hash(#) 기반으로 탭 상태를 동기화하고 관리하는 훅입니다.
 * 페이지 새로고침이나 브라우저 뒤로가기/앞으로가기 시에도 활성 탭이 유지됩니다.
 *
 * @param validTabs 유효한 탭 식별자 목록
 * @param defaultTab 기본 탭 식별자
 */
export function useHashTab<T extends string>(
  validTabs: readonly T[],
  defaultTab: T,
): [T, (tab: T) => void] {
  const getTabFromHash = useCallback((): T => {
    if (typeof window === 'undefined') return defaultTab;
    try {
      const raw = window.location.hash.replace(/^#/, '');
      const hash = decodeURIComponent(raw).toLowerCase();
      const matched = validTabs.find((tab) => tab.toLowerCase() === hash);
      return matched ?? defaultTab;
    }
    catch {
      return defaultTab;
    }
  }, [validTabs, defaultTab]);

  const [activeTab, setActiveTabState] = useState<T>(getTabFromHash);

  // validTabs가 비동기로 로드되거나 변경되었을 때 현재 hash와 재동기화
  useEffect(() => {
    setActiveTabState(getTabFromHash());
  }, [getTabFromHash]);

  // 브라우저 뒤로가기/앞으로가기 또는 외부 hash 변경 이벤트 감지
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTabState(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [getTabFromHash]);

  // 탭 변경 시 상태 및 URL hash 업데이트
  const setActiveTab = useCallback((tab: T) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      try {
        const raw = window.location.hash.replace(/^#/, '');
        const currentHash = decodeURIComponent(raw).toLowerCase();
        if (currentHash !== tab.toLowerCase()) {
          window.location.hash = tab;
        }
      }
      catch {
        window.location.hash = tab;
      }
    }
  }, []);

  // 초기 마운트 시 URL에 hash가 없거나 유효하지 않은 경우 기본 탭 hash 설정
  useEffect(() => {
    if (typeof window !== 'undefined' && validTabs.length > 0) {
      try {
        const raw = window.location.hash.replace(/^#/, '');
        const currentHash = decodeURIComponent(raw).toLowerCase();
        const isValid = validTabs.some((tab) => tab.toLowerCase() === currentHash);
        if (!currentHash || !isValid) {
          window.history.replaceState(null, '', `#${activeTab}`);
        }
      }
      catch {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    }
  }, [activeTab, validTabs]);

  return [activeTab, setActiveTab];
}
