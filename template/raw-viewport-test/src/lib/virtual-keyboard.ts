import { RafEventQueue } from './raf-event-queue';
import { BufferedValue } from './buffered-value';
import { Timer } from './timer';

// Config

const config = {
  openThreshold: 80,
  closeThreshold: 16,
  closeDelay: 100,
  contentEndThreshold: 40,
  inputTargetTop: 65,
} as const;

const selector = {
  contentClass: '.app-content',
  footerClass: '.app-footer',
} as const;

const cssVar = {
  appHeight: '--spacing-app-height',
  footerHeight: '--footer-height',
  viewportTop: '--visual-viewport-top',
  vh: '--vh',
} as const;

const dataAttr = {
  keyboardState: 'keyboardState',
  contentInput: 'contentInput',
} as const;

const inputTypes = new Set([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number',
]);

// Types

type InputRegion = 'content' | 'footer' | 'other';

type Viewport = VisualViewport & { bottom: number };

type ContentView = {
  element: HTMLElement | null;
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
  readonly maxScrollTop: number;
  readonly bottom: number;
};

type Focus = {
  element: Element | null;
  region: InputRegion;
  editable: boolean;
};

type KeyboardState = 'open' | 'close';

type State = {
  viewport: Viewport;
  contentView: ContentView;
  focus: Focus;
};

type Origin = {
  viewport: Viewport;
};

type KeyboardSignal =
  | { tag: 'focus-changed'; payload: null }
  | { tag: 'viewport-changed'; payload: null }
  | { tag: 'window-scroll-detected'; payload: null }
  | { tag: 'close-check-triggered'; payload: null }
  | { tag: 'content-align-deferred'; payload: null }
  | { tag: 'open-complete'; payload: null }
  | { tag: 'close-complete'; payload: null };

type ScrollIntent =
  | { action: 'idle'; payload: null }
  | { action: 'align-content'; payload: null }
  | { action: 'preserve-footer'; payload: { bottom: number } }
  | { action: 'restore-footer'; payload: { bottom: number } }
  | { action: 'snap-content'; payload: null };

// Signal Queries

function hasSignal(
  events: KeyboardSignal[],
  tag: KeyboardSignal['tag'],
): boolean {
  return events.some((event) => event.tag === tag);
}

// Element Queries

function isEditable(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;

  const isInput =
    element instanceof HTMLInputElement && inputTypes.has(element.type);
  const isTextarea = element instanceof HTMLTextAreaElement;

  return (
    (isInput || isTextarea || element.isContentEditable) &&
    !element.hasAttribute('disabled') &&
    !element.hasAttribute('readonly')
  );
}

function getContent(): HTMLElement | null {
  const element = document.querySelector(selector.contentClass);
  return element instanceof HTMLElement ? element : null;
}

// Viewport Measurement

function measureViewport(): Viewport {
  const {
    height = window.innerHeight,
    width = window.innerWidth,
    offsetTop = 0,
    offsetLeft = 0,
    pageTop = 0,
    pageLeft = 0,
    scale = 1,
  } = visualViewport ?? {};

  const safeHeight = Math.max(height, 1);
  const safeOffsetTop = Math.max(offsetTop, 0);

  return {
    height: safeHeight,
    width: Math.max(width, 1),
    offsetTop: safeOffsetTop,
    offsetLeft: Math.max(offsetLeft, 0),
    pageTop,
    pageLeft,
    scale,
    bottom: safeOffsetTop + safeHeight,
  } as Viewport;
}

// Content Measurement

function measureContentView(): ContentView {
  const element = getContent();
  const {
    scrollTop = 0,
    scrollHeight = 0,
    clientHeight = 0,
  } = element ?? {};
  const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
  const clampedScrollTop = Math.min(maxScrollTop, Math.max(0, scrollTop));

  return {
    element,
    scrollTop: clampedScrollTop,
    scrollHeight,
    clientHeight,
    get maxScrollTop() {
      return Math.max(0, this.scrollHeight - this.clientHeight);
    },
    get bottom() {
      const rawBottom = this.maxScrollTop - this.scrollTop;

      // 35px~40px 이내의 레이아웃 오차/여백은 최하단(0)으로 보정
      return rawBottom <= 40 ? 0 : rawBottom;
    },
  };
}

// Focus Transition Rules

function isNearContentEnd(
  focus: Focus,
  contentView: ContentView,
): boolean {
  const content = contentView.element;
  if (focus.region !== 'content' || !(focus.element instanceof HTMLElement)) {
    return false;
  }

  if (content === null || !content.contains(focus.element)) return false;

  const contentRect = content.getBoundingClientRect();
  const inputRect = focus.element.getBoundingClientRect();
  const inputBottom =
    contentView.scrollTop + inputRect.bottom - contentRect.top;

  return contentView.scrollHeight - inputBottom <= config.contentEndThreshold;
}

// State Composition

function getState(): State {
  const contentView = measureContentView();
  const element = document.activeElement;
  const editable = isEditable(element);
  const inContent = editable && contentView.element?.contains(element);
  const inFooter =
    element instanceof Element && element.closest(selector.footerClass);
  const region = inContent ? 'content' : inFooter ? 'footer' : 'other';

  return {
    viewport: measureViewport(),
    contentView,
    focus: { element, region, editable },
  };
}

// Keyboard State

function getKeyboardState(
  current: State,
  originViewport: Viewport,
): KeyboardState {
  const keyboardHeight = Math.max(
    0,
    originViewport.bottom - current.viewport.bottom,
  );

  if (!current.focus.editable) {
    return keyboardHeight < config.closeThreshold ? 'close' : 'open';
  }

  return keyboardHeight >= config.openThreshold ? 'open' : 'close';
}

// ─────────────────────────────────────────────────────────────────────
// Main Virtual Keyboard Controller
// ─────────────────────────────────────────────────────────────────────

export function initVirtualKeyboard(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const state = new BufferedValue(getState());
  const context = {
    root: document.documentElement,
    visualViewport: window.visualViewport,
    origin: { viewport: state.current.viewport } as Origin,
    scroll: { action: 'idle', payload: null } as ScrollIntent,

    get isContentFocused() {
      return state.current.focus.editable && state.current.focus.region === 'content';
    },
    get isFooterFocused() {
      return state.current.focus.editable && state.current.focus.region === 'footer';
    },
    get keyboard() {
      return getKeyboardState(state.current, this.origin.viewport);
    },
    get isOpen() {
      return this.keyboard === 'open';
    },
    get isClosing() {
      return !state.current.focus.editable && !this.isClose;
    },
    get isClose() {
      return this.keyboard === 'close';
    },
    get targetHeight() {
      if (this.isClose || this.isClosing) {
        return this.origin.viewport.height || window.innerHeight;
      }

      return state.current.viewport.height;
    },
  };

  function scroll(top: number): void {
    const view = state.current.contentView;
    const element = view.element;
    if (!element) return;

    const next = Math.min(view.maxScrollTop, Math.max(0, top));
    if (Math.abs(next - element.scrollTop) <= 1) return;

    element.scrollTo({ top: next, behavior: 'auto' });
  }

  function onBeforeOpening(): void {
    eventQueue.remove('close-complete');
    closeTimer.stop();
  }

  function onOpening(): void {
    if (!context.isContentFocused) return;

    context.scroll = { action: 'align-content', payload: null };
    eventQueue.remove('content-align-deferred');
  }

  function onBeforeOpened(): void {
    if (context.isContentFocused) {
      context.scroll = { action: 'align-content', payload: null };
      eventQueue.remove('content-align-deferred');
    }
    eventQueue.add({ tag: 'open-complete', payload: null }, true);
  }

  function onBeforeClosing(): void {
    eventQueue.remove('open-complete');
    eventQueue.remove('content-align-deferred');
    closeTimer.stop();
  }

  function onClosing(): void {
    closeTimer.start();
  }

  function onBeforeClosed(): void {
    closeTimer.stop();
    eventQueue.add({ tag: 'close-complete', payload: null }, true);
  }

  /**
   * 프로세스 사이클
   */
  function onOpened(): void {
    if (context.isOpen) closeTimer.stop();
  }

  function onClosed(): void {
    closeTimer.stop();
  }

  function runLifecycle(): void {
    const previousKeyboard = getKeyboardState(
      state.previous,
      context.origin.viewport,
    );
    const currentKeyboard = getKeyboardState(
      state.current,
      context.origin.viewport,
    );

    if (!state.previous.focus.editable && state.current.focus.editable) {
      onBeforeOpening();
      onOpening();
    }
    if (previousKeyboard !== 'open' && currentKeyboard === 'open') {
      onBeforeOpened();
    }
    if (state.previous.focus.editable && !state.current.focus.editable) {
      onBeforeClosing();
      onClosing();
    }
    if (previousKeyboard !== 'close' && currentKeyboard === 'close') {
      onBeforeClosed();
    }
  }

  function syncOriginViewport(): void {
    if (context.isClose && !state.current.focus.editable) {
      context.origin.viewport = state.current.viewport;
    }
  }

  function setFocusScroll(): void {
    const from = state.previous.focus;
    const to = state.current.focus;

    eventQueue.remove('content-align-deferred');
    closeTimer.stop();

    if (to.region === 'content') {
      context.scroll = { action: 'align-content', payload: null };
      return;
    }
    if (to.region === 'footer') {
      context.scroll = state.current.contentView.element
        ? {
            action: 'preserve-footer',
            payload: { bottom: state.current.contentView.bottom },
          }
        : { action: 'idle', payload: null };
      return;
    }
    if (from.region === 'content') {
      context.scroll =
        isNearContentEnd(from, state.current.contentView)
          ? { action: 'snap-content', payload: null }
          : { action: 'idle', payload: null };
      return;
    }
    if (from.region === 'footer') {
      if (
        !state.current.contentView.element ||
        (context.scroll.action !== 'preserve-footer' &&
          context.scroll.action !== 'restore-footer')
      ) {
        context.scroll = { action: 'idle', payload: null };
        return;
      }

      context.scroll = {
        action: 'restore-footer',
        payload: context.scroll.payload,
      };
      return;
    }

    context.scroll = { action: 'idle', payload: null };
  }

  function resetWindowScroll(): void {
    if (window.scrollX === 0 && window.scrollY === 0) return;

    window.scrollTo(0, 0);
  }

  function requestContentAlign(): void {
    if (!context.isContentFocused) return;

    context.scroll = { action: 'align-content', payload: null };
    eventQueue.remove('content-align-deferred');
  }

  // 생애주기와 이벤트 처리에서 변경된 타이머를 현재 상태에 맞춰 최종 정리한다.
  // - 입력 중: 키보드 닫힘 타이머 중지
  // - 포커스 해제 후 키보드가 아직 열림: 닫힘 확인 타이머 유지
  // - 키보드가 이미 닫힘: 타이머 중지
  // 따라서 lifecycle/signal 처리 이후에 호출해야 한다.
  function syncCloseTimer(): void {
    if (state.current.focus.editable) {
      closeTimer.stop();
    } else if (context.isClosing) {
      closeTimer.start();
    } else {
      closeTimer.stop();
    }
  }

  function renderFrame(): void {
    const footer = document.querySelector<HTMLElement>(selector.footerClass);
    if (footer) {
      context.root.style.setProperty(
        cssVar.footerHeight,
        `${footer.scrollHeight}px`,
      );
    }

    context.root.style.setProperty(
      cssVar.viewportTop,
      `${state.current.viewport.offsetTop}px`,
    );
    context.root.style.setProperty(
      cssVar.vh,
      `${context.targetHeight * 0.01}px`,
    );
    context.root.style.setProperty(
      cssVar.appHeight,
      `calc(var(${cssVar.vh}, 1dvh) * 100)`,
    );
    context.root.dataset[dataAttr.keyboardState] = context.keyboard;

    if (context.isContentFocused) {
      context.root.dataset[dataAttr.contentInput] = 'focused';
    } else {
      delete context.root.dataset[dataAttr.contentInput];
    }

    // VisualViewport 높이와 콘텐츠 그리드 변경을 먼저 반영한 뒤 스크롤 치수를 읽는다.
    state.current.contentView.element?.getBoundingClientRect();
  }

  function executeScroll(events: KeyboardSignal[]): void {
    switch (context.scroll.action) {
      case 'align-content': {
        if (!context.isContentFocused) break;
        if (!context.isOpen && context.visualViewport) break;
        if (
          !hasSignal(events, 'content-align-deferred') ||
          hasSignal(events, 'viewport-changed')
        ) {
          eventQueue.add({ tag: 'content-align-deferred', payload: null }, true);
          break;
        }

        const input = state.current.focus.element;
        const content = state.current.contentView.element;
        if (!(input instanceof HTMLElement) || !content?.contains(input)) break;

        const inputRect = input.getBoundingClientRect();
        const targetTop = config.inputTargetTop;
        const targetScrollTop = isNearContentEnd(
          state.current.focus,
          state.current.contentView,
        )
          ? state.current.contentView.maxScrollTop
          : content.scrollTop + inputRect.top - targetTop;

        scroll(targetScrollTop);
        context.scroll = { action: 'idle', payload: null };
        break;
      }

      case 'preserve-footer':
        if (!context.isContentFocused) {
          scroll(state.current.contentView.maxScrollTop - context.scroll.payload.bottom);
        }
        break;

      case 'restore-footer':
        if (!context.isContentFocused) {
          scroll(state.current.contentView.maxScrollTop - context.scroll.payload.bottom);
        }
        if (context.isClose) context.scroll = { action: 'idle', payload: null };
        break;

      case 'snap-content':
        if (context.isContentFocused || !context.isClose) break;

        scroll(state.current.contentView.maxScrollTop);
        context.scroll = { action: 'idle', payload: null };
        break;

      case 'idle':
        break;
    }
  }

  function processFrame(events: KeyboardSignal[]): void {
    // 1. 기존 origin을 기준으로 previous/current 생애주기를 비교한다.
    //    origin을 먼저 갱신하면 닫히는 중인 프레임의 기준이 사라진다.
    runLifecycle();

    // 2. 닫힘 상태가 확인된 뒤 다음 프레임의 origin을 갱신한다.
    syncOriginViewport();

    // 3. 이번 RAF에서 수집된 이벤트를 종류별로 반영한다.
    if (hasSignal(events, 'open-complete')) {
      onOpened();
    }
    if (hasSignal(events, 'close-complete')) {
      onClosed();
    }
    if (hasSignal(events, 'focus-changed')) {
      setFocusScroll();
    }
    if (hasSignal(events, 'window-scroll-detected')) {
      resetWindowScroll();
    }
    if (hasSignal(events, 'viewport-changed')) {
      requestContentAlign();
    }

    // 4. 이벤트 처리 결과에 따라 닫힘 타이머 상태를 맞춘다.
    syncCloseTimer();

    // 5. 레이아웃을 반영하고, 변경된 콘텐츠 크기를 다시 측정한다.
    renderFrame();
    state.set({ ...state.current, contentView: measureContentView() });

    // 6. 위 단계에서 결정된 스크롤 의도를 실행한다.
    executeScroll(events);
  }

  function sync(events: KeyboardSignal[] = []): void {
    // RAF 진입점: 먼저 previous/current를 갱신한 뒤 프레임을 처리한다.
    state.commit(getState());
    processFrame(events);
  }

  const eventQueue = new RafEventQueue<KeyboardSignal>(sync);
  eventQueue.schedule();

  const closeTimer = new Timer(
    () => eventQueue.add({ tag: 'close-check-triggered', payload: null }),
    config.closeDelay,
  );

  function onFocusChanged(): void {
    eventQueue.add({ tag: 'focus-changed', payload: null }, true);
  }

  function onViewportChange(): void {
    eventQueue.add({ tag: 'viewport-changed', payload: null }, true);
  }

  function onWindowScroll(): void {
    if (window.scrollX === 0 && window.scrollY === 0) return;
    eventQueue.add({ tag: 'window-scroll-detected', payload: null });
  }

  context.visualViewport?.addEventListener('resize', onViewportChange, { passive: true });
  context.visualViewport?.addEventListener('scroll', onViewportChange, { passive: true });
  window.addEventListener('resize', onViewportChange, { passive: true });
  window.addEventListener('scroll', onWindowScroll, { passive: true });
  window.addEventListener('orientationchange', onViewportChange, { passive: true });
  window.addEventListener('pageshow', onViewportChange, { passive: true });
  document.addEventListener('focusin', onFocusChanged, { passive: true });
  document.addEventListener('focusout', onFocusChanged, { passive: true });

  return () => {
    eventQueue.close();
    closeTimer.close();

    context.visualViewport?.removeEventListener('resize', onViewportChange);
    context.visualViewport?.removeEventListener('scroll', onViewportChange);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onWindowScroll);
    window.removeEventListener('orientationchange', onViewportChange);
    window.removeEventListener('pageshow', onViewportChange);
    document.removeEventListener('focusin', onFocusChanged);
    document.removeEventListener('focusout', onFocusChanged);

    context.root.style.removeProperty(cssVar.appHeight);
    context.root.style.removeProperty(cssVar.footerHeight);
    context.root.style.removeProperty(cssVar.viewportTop);
    delete context.root.dataset[dataAttr.keyboardState];
    delete context.root.dataset[dataAttr.contentInput];
  };
}
