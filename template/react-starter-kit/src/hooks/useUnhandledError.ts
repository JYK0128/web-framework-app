import { ApplicationError } from '@pkg/shared/common';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';

function isAxiosOrApiError(error: unknown): boolean {
  if (isAxiosError(error) || error instanceof ApplicationError) return true;
  if (error && typeof error === 'object' && ('isAxiosError' in error || 'response' in error)) return true;
  return false;
}

/**
 * 🛡️ Axios(서버 API)를 제외한 비동기 시스템 장애 포착 훅
 *
 * Vite 청크 로드 실패, 모듈 파싱 오류, 미처리 비동기 펑크를 감지하여
 * 시스템 장애 화면으로 전환할 수 있도록 에러 객체를 반환합니다.
 */
export function useUnhandledError(): unknown {
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Axios나 서버 API 통신 에러는 정상적인 비즈니스 흐름이므로 무시 (토스트/폼 처리)
      if (isAxiosOrApiError(event.reason)) {
        return;
      }

      // Axios가 아닌 모든 비동기 에러(청크 로드 실패, 모듈 파싱 에러 등)는 시스템 장애로 포착
      event.preventDefault();
      setError(event.reason ?? new Error('Unhandled Asynchronous System Error'));
    };

    const handleVitePreloadError = (event: Event) => {
      event.preventDefault();
      setError(new Error('Vite Module Preload Failure'));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('vite:preloadError', handleVitePreloadError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('vite:preloadError', handleVitePreloadError);
    };
  }, []);

  return error;
}
