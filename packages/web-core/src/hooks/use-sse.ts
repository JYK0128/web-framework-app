import { useEffect, useRef } from 'react';

export interface ServerSentEvent<T = unknown> {
  type: string
  data: T
  id?: string
}

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

    const controller = new AbortController();
    const connect = async () => {
      const response = await fetch(url, {
        headers: { Accept: 'text/event-stream' },
        credentials: 'include',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`SSE connection failed with status ${response.status}`);
      if (!response.body) throw new Error('SSE response body is unavailable.');

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          const event = parseEvent<T>(chunk);
          if (event) onEventRef.current(event);
        }
      }
    };

    void connect().catch((error: unknown) => {
      if (!controller.signal.aborted) onErrorRef.current?.(error);
    });
    return () => controller.abort();
  }, [enabled, url]);
}

function parseEvent<T>(chunk: string): ServerSentEvent<T> | undefined {
  const lines = chunk.split(/\r?\n/);
  let type = 'message';
  let id: string | undefined;
  const data: string[] = [];
  for (const line of lines) {
    if (line.startsWith('event:')) type = line.slice(6).trim();
    else if (line.startsWith('id:')) id = line.slice(3).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  if (data.length === 0) return undefined;
  return { type, id, data: JSON.parse(data.join('\n')) as T };
}
