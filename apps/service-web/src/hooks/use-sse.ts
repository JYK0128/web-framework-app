import { useEffect, useRef } from 'react';

import { type ServerSentEvent, SSEClient } from '#/lib/sse-client';

export type UseSSEOptions<T> = {
  url: string | null
  enabled?: boolean
  onEvent: (event: ServerSentEvent<T>) => void
  onError?: (error: unknown) => void
};

export function useSSE<T>({ url, enabled = true, onEvent, onError }: UseSSEOptions<T>): void {
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);
  onEventRef.current = onEvent;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled || !url) return;
    const client = new SSEClient();
    void client.connect<T>(url, (event) => onEventRef.current(event)).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onErrorRef.current?.(error);
    });
    return () => client.disconnect();
  }, [enabled, url]);
}
