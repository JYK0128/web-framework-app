import { LoaderCircle } from 'lucide-react';
import { useSyncExternalStore } from 'react';

type LoadingRequest = { id: symbol, message: string };

class LoadingObserver {
  private readonly requests = new Map<symbol, LoadingRequest>();
  private snapshot: LoadingRequest | null = null;
  private readonly subscribers = new Set<() => void>();

  subscribe = (subscriber: () => void) => {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  };

  getSnapshot = () => this.snapshot;

  start(message: string) {
    const request = { id: Symbol('loading'), message };
    this.requests.set(request.id, request);
    this.snapshot = request;
    this.publish();
    return request.id;
  }

  stop(id: symbol) {
    this.requests.delete(id);
    this.snapshot = this.requests.values().next().value ?? null;
    this.publish();
  }

  private publish() {
    this.subscribers.forEach((subscriber) => subscriber());
  }
}

const loadingState = new LoadingObserver();

export async function loading<T>(callback: () => T | Promise<T>, message = '처리 중...'): Promise<T> {
  const id = loadingState.start(message);
  try {
    return await callback();
  }
  finally {
    loadingState.stop(id);
  }
}

export function GlobalLoading() {
  const request = useSyncExternalStore(
    loadingState.subscribe,
    loadingState.getSnapshot,
    loadingState.getSnapshot,
  );

  if (!request) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center bg-background/70
        backdrop-blur-sm
      "
      role="status"
      aria-live="polite"
    >
      <div className="
        flex min-w-44 flex-col items-center gap-3 rounded-xl border
        bg-background px-6 py-5 shadow-lg
      "
      >
        <LoaderCircle className="size-6 animate-spin text-primary" />
        <span className="text-sm font-medium">{request.message}</span>
      </div>
    </div>
  );
}
