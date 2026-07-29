/**
 * 브라우저 이벤트를 모아 한 프레임 단위로 처리하는 흐름 관리자.
 *
 * - dispatch: 다음 프레임에 이벤트 추가. once가 true면 같은 tag의 중복 추가 방지
 * - dispose: 대기 중인 프레임과 이벤트 정리
 */

export type FlowEvent = {
  tag: string
};

type EventFlow<T extends FlowEvent> = {
  dispatch: (event: T, once?: boolean) => void
  dispose: () => void
};

export function createEventFlow<T extends FlowEvent>(
  onFlush: (events: T[]) => void,
): EventFlow<T> {
  const queue: T[] = [];
  const dedupTags = new Set<string>();
  let frameId: number | null = null;

  function requestFlush(): void {
    if (frameId !== null) return;

    frameId = window.requestAnimationFrame(() => {
      frameId = null;
      if (queue.length === 0) return;

      const batch = queue.splice(0);
      dedupTags.clear();
      onFlush(batch);
    });
  }

  function dispatch(event: T, once = false): void {
    if (once) {
      if (dedupTags.has(event.tag)) return;
      dedupTags.add(event.tag);
    }

    queue.push(event);
    requestFlush();
  }

  function dispose(): void {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    queue.length = 0;
    dedupTags.clear();
  }

  return { dispatch, dispose };
}
