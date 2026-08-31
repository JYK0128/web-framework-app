import { useI18n } from '@pkg/shared/web';
import { LoaderCircle } from 'lucide-react';
import { useSyncExternalStore } from 'react';

type LoadingOptions = {
  message?: string
};

type LoadingRequest = {
  id: symbol
  message?: string
};

class LoadingObserver {
  private readonly activeRequests = new Map<symbol, LoadingRequest>();
  private snapshot: LoadingRequest | null = null;
  private readonly subscribers = new Set<() => void>();

  subscribe = (callback: () => void) => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  getSnapshot = () => this.snapshot;

  start = (options: LoadingOptions) => {
    const request: LoadingRequest = {
      id: Symbol('loading'),
      message: options.message,
    };

    this.activeRequests.set(request.id, request);
    this.snapshot = request;
    this.publish();

    return request.id;
  };

  stop = (id: symbol) => {
    this.activeRequests.delete(id);
    this.snapshot = this.activeRequests.values().next().value ?? null;
    this.publish();
  };

  private publish() {
    this.subscribers.forEach((subscriber) => subscriber());
  }
}

const loadingState = new LoadingObserver();

function waitForPaint() {
  if (typeof window === 'undefined') return Promise.resolve();

  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export async function loading<T>(callback: () => T | Promise<T>, options: LoadingOptions = {}): Promise<T> {
  const id = loadingState.start(options);

  try {
    await waitForPaint();
    return await callback();
  }
  finally {
    loadingState.stop(id);
  }
}

export function SystemLoading() {
  const request = useSyncExternalStore(
    loadingState.subscribe,
    loadingState.getSnapshot,
    loadingState.getSnapshot,
  );
  const { t } = useI18n();

  if (!request) return null;

  const displayMessage = request.message ?? t('common.processing');

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center bg-background/70
        backdrop-blur-sm
      "
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
    >
      <div className="
        flex min-w-44 flex-col items-center gap-3 rounded-xl border
        bg-background px-6 py-5 shadow-lg
      "
      >
        <LoaderCircle className="size-6 animate-spin text-primary" />
        <span className="text-sm font-medium">{displayMessage}</span>
      </div>
    </div>
  );
}
