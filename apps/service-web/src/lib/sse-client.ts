import { tokenStorage } from '#/store/token';

export interface ServerSentEvent<T = unknown> {
  type: string
  data: T
  id?: string
}

export class SSEClient {
  private controller?: AbortController;

  async connect<T>(url: string, onEvent: (event: ServerSentEvent<T>) => void): Promise<void> {
    this.disconnect();
    const controller = new AbortController();
    this.controller = controller;
    const token = tokenStorage.getAccessToken();
    const headers = new Headers({ Accept: 'text/event-stream' });
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(url, {
      headers,
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
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const chunk of events) {
        const event = this.parseEvent<T>(chunk);
        if (event) onEvent(event);
      }
    }
  }

  disconnect(): void {
    this.controller?.abort();
    this.controller = undefined;
  }

  private parseEvent<T>(chunk: string): ServerSentEvent<T> | undefined {
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
}
