import { createEventFlow } from './event-flow';

// ─────────────────────────────────────────────────────────────────────
// Config & Selectors
// ─────────────────────────────────────────────────────────────────────

const config = {
  openThreshold: 80,
  closeThreshold: 16,
  closeDelay: 100,
  inputTargetRatio: 1 / 10,
} as const;

const selector = {
  headerClass: '.app-header',
  contentClass: '.app-content',
  footerClass: '.app-footer',
} as const;

const cssVar = {
  appHeight: '--spacing-app-height',
  vh: '--vh',
} as const;

const dataAttr = {
  keyboardState: 'keyboardState',
  contentInput: 'contentInput',
} as const;

const editableInputTypes = new Set([
  'text', 'search', 'email', 'url', 'tel', 'password', 'number',
]);

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

type InputRegion = 'content' | 'footer' | 'none';

type Viewport = VisualViewport & { bottom: number };

/** Element 표준 프로퍼티(scrollTop, scrollHeight, clientHeight) 기반 스크롤 측정 */
type ContentView = Pick<HTMLElement, 'scrollTop' | 'scrollHeight' | 'clientHeight'> & {
  maxScrollTop: number
  bottomDistance: number
};

type ActiveInput = {
  activeElement: Document['activeElement']
  region: InputRegion
  editable: boolean
};

type KeyboardEvent
  = | { tag: 'focus', nextRegion: InputRegion, prevRegion: InputRegion }
    | { tag: 'viewport-resize' }
    | { tag: 'window-scroll' }
    | { tag: 'close-check' }
    | { tag: 'deferred-align' }
    | { tag: 'deferred-reveal' };

/** 4가지 스크롤 동작의 도메인 상태 */
type ScrollIntent
  = | { action: 'idle' }
    | { action: 'align-content' }                               // ① 본문: 1/10 정렬
    | { action: 'snap-bottom' }                                  // ② 본문: 최하단 밀착
    | { action: 'preserve-footer', bottomDistance: number }      // ③ 푸터: 포커스 시 높이 유지
    | { action: 'restore-footer', bottomDistance: number };      // ④ 푸터: 포커스 해제 시 위치 복귀

type State = {
  /** 키보드 생애주기 상태 machine: closed -> opening -> open -> closing -> closed */
  keyboard: 'closed' | 'opening' | 'open' | 'closing'

  /** 닫힘 상태 스냅샷 & 렌더 캐시 */
  snapshot: {
    viewport: Viewport
    contentView: { clientHeight: number }
    appHeight: string
    vh: string
  }

  /** 대기 중인 스크롤 동작 */
  scroll: ScrollIntent
};

// ─────────────────────────────────────────────────────────────────────
// Element & Region Queries
// ─────────────────────────────────────────────────────────────────────

function isEditable(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;

  const isInput
    = element instanceof HTMLInputElement && editableInputTypes.has(element.type);
  const isTextarea = element instanceof HTMLTextAreaElement;

  return (
    (isInput || isTextarea || element.isContentEditable)
    && !element.hasAttribute('disabled')
    && !element.hasAttribute('readonly')
  );
}

function getContentView(): HTMLElement | null {
  const element = document.querySelector(selector.contentClass);
  return element instanceof HTMLElement ? element : null;
}

function getRegion(element: Element | null, editable: boolean): InputRegion {
  if (editable) {
    const contentView = getContentView();
    if (contentView?.contains(element)) return 'content';
  }

  if (element instanceof Element && element.closest(selector.footerClass)) {
    return 'footer';
  }

  return 'none';
}

function readActiveInput(): ActiveInput {
  const activeElement = document.activeElement;
  const editable = isEditable(activeElement);
  return {
    activeElement,
    region: getRegion(activeElement, editable),
    editable,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Layout Measurements & Math
// ─────────────────────────────────────────────────────────────────────

function measureViewport(vv: VisualViewport | null): Viewport {
  const {
    height = window.innerHeight,
    width = window.innerWidth,
    offsetTop = 0,
    offsetLeft = 0,
    pageTop = 0,
    pageLeft = 0,
    scale = 1,
  } = vv ?? {};

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

function measureView(contentView: HTMLElement): ContentView {
  const { scrollTop = 0, scrollHeight = 0, clientHeight = 0 } = contentView;
  const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
  const clampedScrollTop = Math.min(maxScrollTop, Math.max(0, scrollTop));
  const rawBottomDistance = maxScrollTop - clampedScrollTop;

  // 35px~40px 이내의 레이아웃 오차/여백은 최하단(0)으로 보정
  const bottomDistance = rawBottomDistance <= 40 ? 0 : rawBottomDistance;

  return {
    scrollTop: clampedScrollTop,
    scrollHeight,
    clientHeight,
    maxScrollTop,
    bottomDistance,
  };
}

function getKeyboardHeight(baseline: Viewport, current: Viewport): number {
  return Math.max(0, baseline.bottom - current.bottom);
}

function getAlignScrollTop(
  contentView: HTMLElement,
  input: HTMLElement,
  viewportHeight: number,
): number {
  const inputRect = input.getBoundingClientRect();
  const screenTarget = viewportHeight * config.inputTargetRatio;
  return contentView.scrollTop + inputRect.top - screenTarget;
}

function toPx(value: number): string {
  return `${Math.round(Math.max(0, value) * 100) / 100}px`;
}

function setScrollTop(contentView: HTMLElement, targetTop: number): void {
  const { maxScrollTop } = measureView(contentView);
  const clamped = Math.min(maxScrollTop, Math.max(0, targetTop));

  if (Math.abs(clamped - contentView.scrollTop) <= 1) return;
  contentView.scrollTo({ top: clamped, behavior: 'auto' });
}

// ─────────────────────────────────────────────────────────────────────
// Main Virtual Keyboard Controller
// ─────────────────────────────────────────────────────────────────────

export function initVirtualKeyboard(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const root = document.documentElement;
  const visualViewport = window.visualViewport;
  const initialViewport = measureViewport(visualViewport);
  const initialContentView = getContentView();

  const state: State = {
    keyboard: 'closed',
    snapshot: {
      viewport: initialViewport,
      contentView: { clientHeight: initialContentView?.clientHeight ?? 0 },
      appHeight: '',
      vh: '',
    },
    scroll: { action: 'idle' },
  };

  let closeTimerId: number | null = null;
  let deferredFrameId: number | null = null;

  // ── Timers ───────────────────────────────────────────────────────

  function stopCloseTimer(): void {
    if (closeTimerId === null) return;
    window.clearTimeout(closeTimerId);
    closeTimerId = null;
  }

  function startCloseTimer(): void {
    if (closeTimerId !== null) return;
    closeTimerId = window.setTimeout(() => {
      closeTimerId = null;
      flow.dispatch({ tag: 'close-check' });
    }, config.closeDelay);
  }

  function stopDeferredFrame(): void {
    if (deferredFrameId === null) return;
    window.cancelAnimationFrame(deferredFrameId);
    deferredFrameId = null;
  }

  function startDeferredFrame(
    event: Extract<KeyboardEvent, { tag: 'deferred-align' | 'deferred-reveal' }>,
  ): void {
    if (deferredFrameId !== null) return;
    deferredFrameId = window.requestAnimationFrame(() => {
      deferredFrameId = null;
      flow.dispatch(event);
    });
  }

  // ── State Updates ────────────────────────────────────────────────

  function syncSnapshot(contentView: HTMLElement | null, activeInput: ActiveInput): void {
    if (state.keyboard !== 'closed') return;

    if (!activeInput.editable) {
      state.snapshot.viewport = measureViewport(visualViewport);
    }
    if (contentView) {
      state.snapshot.contentView.clientHeight = contentView.clientHeight;
    }
  }

  function updateKeyboardPhase(
    activeInput: ActiveInput,
    keyboardHeight: number,
    closeCheckFired: boolean,
  ): void {
    if (
      (state.keyboard === 'closed' || state.keyboard === 'opening' || state.keyboard === 'closing')
      && activeInput.editable
      && keyboardHeight >= config.openThreshold
    ) {
      state.keyboard = 'open';
      return;
    }

    if (
      closeCheckFired
      && state.keyboard !== 'closed'
      && !activeInput.editable
      && keyboardHeight < config.closeThreshold
    ) {
      state.keyboard = 'closed';
      if (activeInput.region !== 'content') {
        state.scroll = { action: 'idle' };
      }
    }
  }

  function watchKeyboardClose(
    activeInput: ActiveInput,
    keyboardHeight: number,
  ): void {
    if (activeInput.editable) {
      stopCloseTimer();
      return;
    }

    if (state.keyboard !== 'closed' && keyboardHeight >= config.openThreshold) {
      stopCloseTimer();
      return;
    }

    if (state.keyboard === 'open') {
      startCloseTimer();
      return;
    }

    if (state.keyboard === 'closing') {
      if (keyboardHeight < config.closeThreshold) {
        startDeferredFrame({ tag: 'deferred-reveal' });
      }
      else {
        startCloseTimer();
      }
    }
  }

  function getFooterBottomDistance(contentView: HTMLElement | null): number | null {
    if (!contentView) return null;
    return state.scroll.action === 'preserve-footer' || state.scroll.action === 'restore-footer'
      ? state.scroll.bottomDistance
      : measureView(contentView).bottomDistance;
  }

  function planScrollIntent(
    nextRegion: InputRegion,
    prevRegion: InputRegion,
    contentView: HTMLElement | null,
  ): void {
    stopDeferredFrame();

    if (nextRegion === 'content') {
      if (state.keyboard !== 'open') state.keyboard = 'opening';
      state.scroll = { action: 'align-content' };
      return;
    }

    if (nextRegion === 'footer') {
      if (state.keyboard !== 'open') state.keyboard = 'opening';
      const bottomDistance = getFooterBottomDistance(contentView);
      state.scroll = bottomDistance !== null ? { action: 'preserve-footer', bottomDistance } : { action: 'idle' };
      return;
    }

    if (prevRegion === 'content') {
      state.keyboard = 'closing';
      state.scroll = { action: 'idle' };
      return;
    }

    if (prevRegion === 'footer') {
      state.keyboard = 'closing';
      const bottomDistance = getFooterBottomDistance(contentView);
      state.scroll = bottomDistance !== null ? { action: 'restore-footer', bottomDistance } : { action: 'idle' };
      return;
    }

    state.scroll = { action: 'idle' };
  }

  function renderToDOM(viewport: Viewport, activeInput: ActiveInput): void {
    const isFooterInputFocused = activeInput.region === 'footer';
    const isFullHeightState
      = !isFooterInputFocused || state.keyboard === 'closed' || state.keyboard === 'closing';

    const targetHeight = isFullHeightState
      ? (state.snapshot.viewport.height || window.innerHeight)
      : viewport.height;

    // --vh 트릭: 1vh = targetHeight * 0.01
    const vhPx = `${targetHeight * 0.01}px`;
    const appHeightStyle = `calc(var(${cssVar.vh}, 1dvh) * 100)`;

    if (vhPx !== state.snapshot.vh) {
      root.style.setProperty(cssVar.vh, vhPx);
      root.style.setProperty(cssVar.appHeight, appHeightStyle);
      state.snapshot.vh = vhPx;
      state.snapshot.appHeight = appHeightStyle;
    }

    root.dataset[dataAttr.keyboardState] = state.keyboard;

    const hideFooter = activeInput.region === 'content';

    if (hideFooter) {
      root.dataset[dataAttr.contentInput] = 'focused';
    }
    else {
      delete root.dataset[dataAttr.contentInput];
    }
  }

  function handleAlignContent(
    contentView: HTMLElement | null,
    activeInput: ActiveInput,
    keyboardHeight: number,
    viewportResized: boolean,
    alignReady: boolean,
  ): void {
    if (activeInput.region !== 'content' || !activeInput.editable) return;
    if (keyboardHeight < config.openThreshold && visualViewport) return;

    if (alignReady && !viewportResized && contentView && activeInput.activeElement instanceof HTMLElement) {
      const targetTop = getAlignScrollTop(
        contentView,
        activeInput.activeElement,
        state.snapshot.viewport.height,
      );
      setScrollTop(contentView, targetTop);
      state.scroll = { action: 'idle' };
    }
    else {
      startDeferredFrame({ tag: 'deferred-align' });
    }
  }

  function handleFooterScroll(
    contentView: HTMLElement | null,
    activeInput: ActiveInput,
    bottomDistance: number,
    isRestore: boolean,
  ): void {
    if (activeInput.region === 'content') return;
    if (contentView) {
      const { maxScrollTop } = measureView(contentView);
      setScrollTop(contentView, maxScrollTop - bottomDistance);
    }
    if (isRestore && state.keyboard === 'closed') {
      state.scroll = { action: 'idle' };
    }
  }

  function executeScrollIntent(
    contentView: HTMLElement | null,
    activeInput: ActiveInput,
    keyboardHeight: number,
    viewportResized: boolean,
    alignReady: boolean,
  ): void {
    const intent = state.scroll;

    if (intent.action === 'align-content') {
      handleAlignContent(contentView, activeInput, keyboardHeight, viewportResized, alignReady);
    }
    else if (intent.action === 'preserve-footer') {
      handleFooterScroll(contentView, activeInput, intent.bottomDistance, false);
    }
    else if (intent.action === 'restore-footer') {
      handleFooterScroll(contentView, activeInput, intent.bottomDistance, true);
    }
    else if (intent.action === 'snap-bottom') {
      if (activeInput.region !== 'content' && state.keyboard === 'closed' && contentView) {
        setScrollTop(contentView, measureView(contentView).maxScrollTop);
      }
      state.scroll = { action: 'idle' };
    }
  }

  // ── Single Frame Reconcile Pipeline ─────────────────────────────

  function reconcile(events: KeyboardEvent[] = []): void {
    const has = {
      viewportResize: events.some((e) => e.tag === 'viewport-resize'),
      closeCheck: events.some((e) => e.tag === 'close-check'),
      alignReady: events.some((e) => e.tag === 'deferred-align'),
      windowScroll: events.some((e) => e.tag === 'window-scroll'),
    };

    const contentView = getContentView();
    const activeInput = readActiveInput();

    // 1. Snapshot capture
    syncSnapshot(contentView, activeInput);

    // 2. Focus transitions & deferred reveals
    for (const event of events) {
      if (event.tag === 'focus') {
        planScrollIntent(event.nextRegion, event.prevRegion, contentView);
      }

      if (
        event.tag === 'deferred-reveal'
        && state.keyboard === 'closing'
        && activeInput.region !== 'content'
      ) {
        state.keyboard = 'closed';
      }
    }

    // 3. Window scroll lock
    if (has.windowScroll && (window.scrollX !== 0 || window.scrollY !== 0)) {
      window.scrollTo(0, 0);
    }

    // 4. Viewport resize trigger
    if (has.viewportResize && activeInput.region === 'content') {
      state.scroll = { action: 'align-content' };
      stopDeferredFrame();
    }

    // 5. Keyboard phase updates
    const viewport = measureViewport(visualViewport);
    const keyboardHeight = getKeyboardHeight(state.snapshot.viewport, viewport);
    updateKeyboardPhase(activeInput, keyboardHeight, has.closeCheck);
    watchKeyboardClose(activeInput, keyboardHeight);

    // 6. DOM rendering
    renderToDOM(viewport, activeInput);

    // 7. Scroll intent execution
    executeScrollIntent(contentView, activeInput, keyboardHeight, has.viewportResize, has.alignReady);
  }

  // ── Event Flow & DOM Listeners ─────────────────────────────────

  const flow = createEventFlow<KeyboardEvent>(reconcile);

  function onFocusIn(event: FocusEvent): void {
    const target = event.target instanceof Element ? event.target : null;
    const editable = isEditable(target);
    const region = getRegion(target, editable);

    flow.dispatch({ tag: 'focus', nextRegion: region, prevRegion: region });
  }

  function onFocusOut(event: FocusEvent): void {
    const prevTarget = event.target instanceof Element ? event.target : null;
    const nextTarget = event.relatedTarget instanceof Element ? event.relatedTarget : null;

    const prevEditable = isEditable(prevTarget);
    const nextEditable = isEditable(nextTarget);

    flow.dispatch({
      tag: 'focus',
      nextRegion: getRegion(nextTarget, nextEditable),
      prevRegion: getRegion(prevTarget, prevEditable),
    });
  }

  function onPointerDown(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!isEditable(target)) return;

    const contentView = getContentView();
    if (!contentView?.contains(target)) return;

    target.focus({ preventScroll: true });
  }

  function onViewportChange(): void {
    flow.dispatch({ tag: 'viewport-resize' }, true);
  }

  function onWindowScroll(): void {
    if (window.scrollX === 0 && window.scrollY === 0) return;
    flow.dispatch({ tag: 'window-scroll' });
  }

  // ── Bootstrap ────────────────────────────────────────────────────

  reconcile();

  visualViewport?.addEventListener('resize', onViewportChange, { passive: true });
  visualViewport?.addEventListener('scroll', onViewportChange, { passive: true });
  window.addEventListener('resize', onViewportChange, { passive: true });
  window.addEventListener('scroll', onWindowScroll, { passive: true });
  window.addEventListener('orientationchange', onViewportChange, { passive: true });
  window.addEventListener('pageshow', onViewportChange, { passive: true });
  document.addEventListener('focusin', onFocusIn, { passive: true });
  document.addEventListener('focusout', onFocusOut, { passive: true });
  document.addEventListener('pointerdown', onPointerDown);

  // ── Cleanup ──────────────────────────────────────────────────────

  return () => {
    flow.dispose();
    stopCloseTimer();
    stopDeferredFrame();

    visualViewport?.removeEventListener('resize', onViewportChange);
    visualViewport?.removeEventListener('scroll', onViewportChange);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onWindowScroll);
    window.removeEventListener('orientationchange', onViewportChange);
    window.removeEventListener('pageshow', onViewportChange);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    document.removeEventListener('pointerdown', onPointerDown);

    root.style.removeProperty(cssVar.appHeight);
    delete root.dataset[dataAttr.keyboardState];
    delete root.dataset[dataAttr.contentInput];
  };
}
