/** requestAnimationFrame 단위로 이벤트를 모아 처리하는 큐. */

export type QueueEvent = {
  tag: string;
};

export class RafEventQueue<T extends QueueEvent> {
  private readonly queue: T[] = [];
  private readonly onceTags = new Set<string>();
  private frameId: number | null = null;
  private readonly flush: (events: T[]) => void;

  constructor(flush: (events: T[]) => void) {
    this.flush = flush;
  }

  schedule(): void {
    if (this.frameId !== null) return;

    this.frameId = window.requestAnimationFrame(() => {
      this.frameId = null;

      const events = this.queue.splice(0);
      this.onceTags.clear();
      this.flush(events);
    });
  }

  add(event: T, once = false): void {
    if (once) {
      if (this.onceTags.has(event.tag)) return;
      this.onceTags.add(event.tag);
    }

    this.queue.push(event);
    this.schedule();
  }

  remove(tag: T['tag']): void {
    const remaining = this.queue.filter((event) => event.tag !== tag);
    this.queue.length = 0;
    this.queue.push(...remaining);
    this.onceTags.delete(tag);

    if (this.queue.length === 0 && this.frameId !== null) {
      window.cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  close(): void {
    if (this.frameId !== null) {
      window.cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    this.queue.length = 0;
    this.onceTags.clear();
  }
}
