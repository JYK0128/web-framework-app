import { initEnvironment } from '@pkg/shared/web';
import { useEffect } from 'react';

const VIEWPORT_FRAMES = 30;
const FOCUS_FRAMES = 10;
const KEYBOARD_THRESHOLD = 100;
const VIEWPORT_TOLERANCE = 30;

export type KeyboardState = 'closed' | 'opening' | 'open' | 'closing';
type InputLocation = 'footer' | 'content' | 'other';

function isMobileOS() {
  if (typeof document === 'undefined') return false;
  const os = document.documentElement.dataset.os;
  return os === 'ios' || os === 'android';
}

function getKeyboardState(): KeyboardState {
  return (document.documentElement.dataset.keyboardState as KeyboardState) || 'closed';
}

function getViewportHeight() {
  return Math.round(window.visualViewport?.height ?? window.innerHeight);
}

function getInputLocation(element: HTMLElement | null): InputLocation {
  if (element?.closest('.app-footer')) return 'footer';
  if (element?.closest('.app-content')) return 'content';
  return 'other';
}

function isTextInput(element: HTMLElement | null): element is HTMLInputElement | HTMLTextAreaElement {
  return element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA';
}

function setKeyboardState(nextState: KeyboardState, viewportHeight?: number) {
  const currentState = getKeyboardState();
  if (currentState === nextState) return;

  document.documentElement.dataset.keyboardState = nextState;

  if (nextState === 'open') {
    window.dispatchEvent(new CustomEvent('keyboardopen', { detail: { height: viewportHeight } }));
  }
  else if (nextState === 'closed' && (currentState === 'open' || currentState === 'closing')) {
    window.dispatchEvent(new CustomEvent('keyboardclose'));
  }
}

export function useVisualViewport() {
  useEffect(() => {
    initEnvironment();

    const root = document.documentElement;
    const mobileOS = isMobileOS();
    root.dataset.keyboardState ||= 'closed';

    let inputLocation: InputLocation = 'other';
    let baseHeight: number | null = null;
    let viewportFrame: number | null = null;
    let blurTimer: number | null = null;

    function setAppHeight(height: number) {
      root.style.setProperty('--spacing-app-height', `${height}px`);
    }

    function getBaseHeight(currentHeight: number) {
      const layoutHeight = Math.round(window.innerHeight);
      const layoutChanged = baseHeight !== null && Math.abs(layoutHeight - baseHeight) > KEYBOARD_THRESHOLD;

      if (baseHeight === null || (layoutChanged && currentHeight >= layoutHeight - VIEWPORT_TOLERANCE)) {
        baseHeight = Math.max(layoutHeight, currentHeight);
      }
      else {
        baseHeight = Math.max(baseHeight, layoutHeight);
      }

      return baseHeight;
    }

    function restoreBaseHeight() {
      setAppHeight(baseHeight ?? getViewportHeight());
    }

    function resetPageScroll() {
      if (window.scrollX === 0 && window.scrollY === 0) return;

      window.scrollTo(0, 0);
      root.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    function cancelViewport() {
      if (viewportFrame === null) return;
      cancelAnimationFrame(viewportFrame);
      viewportFrame = null;
    }

    function cancelBlur() {
      if (blurTimer === null) return;
      window.clearTimeout(blurTimer);
      blurTimer = null;
    }

    function syncInputLocation() {
      const activeElement = document.activeElement as HTMLElement | null;
      if (isTextInput(activeElement)) {
        inputLocation = getInputLocation(activeElement);
      }
    }

    function updateExternalInput(height: number, isViewportReduced: boolean) {
      if (isViewportReduced) {
        restoreBaseHeight();
        return;
      }

      baseHeight = height;
      setAppHeight(height);
    }

    function updateViewport() {
      syncInputLocation();
      if (inputLocation !== 'other' || getKeyboardState() === 'closing') {
        resetPageScroll();
      }

      const vv = window.visualViewport;
      const height = getViewportHeight();
      const base = getBaseHeight(height);

      if (!vv) {
        if (inputLocation !== 'other' || getKeyboardState() === 'closing') {
          setAppHeight(height);
        }
        else {
          restoreBaseHeight();
        }
        return;
      }

      if (!mobileOS) {
        baseHeight = height;
        setAppHeight(height);
        setKeyboardState('closed');
        return;
      }

      const state = getKeyboardState();
      const isViewportReduced = base - height > KEYBOARD_THRESHOLD;
      const isOtherInput = inputLocation === 'other' && state !== 'closing';

      if (isOtherInput) {
        updateExternalInput(height, isViewportReduced);
        return;
      }

      if (!isViewportReduced && height >= base - VIEWPORT_TOLERANCE) {
        baseHeight = height;
        setAppHeight(height);
        if (state !== 'closed') setKeyboardState('closed', vv.height);
        return;
      }

      setAppHeight(height);
      if (isViewportReduced && (state === 'closed' || state === 'opening')) {
        setKeyboardState('open', vv.height);
      }
    }

    function trackViewport(focusTarget?: HTMLElement) {
      cancelViewport();

      let frames = 0;
      let previousHeight = getViewportHeight();
      let stableFrames = 0;

      function tick() {
        updateViewport();
        frames += 1;

        if (focusTarget) {
          const height = getViewportHeight();
          if (height === previousHeight) {
            stableFrames += 1;
          }
          else {
            previousHeight = height;
            stableFrames = 0;
          }

          if (stableFrames >= FOCUS_FRAMES) {
            scrollToInput(focusTarget);
            focusTarget = undefined;
          }
        }

        if (frames < VIEWPORT_FRAMES) {
          viewportFrame = requestAnimationFrame(tick);
        }
        else {
          viewportFrame = null;
        }
      }

      viewportFrame = requestAnimationFrame(tick);
    }

    function activateInput(location: Exclude<InputLocation, 'other'>, focusTarget?: HTMLElement) {
      cancelBlur();
      inputLocation = location;
      trackViewport(focusTarget);
      if (mobileOS && getKeyboardState() !== 'open') {
        setKeyboardState('opening');
      }
    }

    function resetKeyboard() {
      inputLocation = 'other';
      cancelViewport();
      restoreBaseHeight();
      if (getKeyboardState() !== 'closed') setKeyboardState('closed');
    }

    function scrollToInput(target: HTMLElement) {
      const content = document.querySelector<HTMLElement>('.app-content');
      if (!content || !content.contains(target)) return;

      const contentRect = content.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const top = content.scrollTop + targetRect.top - contentRect.top;
      content.scrollTo({ top: Math.max(0, Math.round(top)), behavior: 'auto' });
    }

    function handleFocusIn(event: FocusEvent) {
      const target = event.target as HTMLElement | null;
      if (!isTextInput(target)) return;

      cancelBlur();
      const location = getInputLocation(target);
      if (location === 'other') {
        resetKeyboard();
        return;
      }

      activateInput(location, location === 'content' ? target : undefined);
    }

    function handleFocusOut() {
      if (!mobileOS) return;

      cancelBlur();
      blurTimer = window.setTimeout(() => {
        blurTimer = null;

        const activeElement = document.activeElement as HTMLElement | null;
        if (isTextInput(activeElement)) {
          const location = getInputLocation(activeElement);
          if (location === 'other') {
            resetKeyboard();
          }
          else {
            inputLocation = location;
            trackViewport();
          }
          return;
        }

        inputLocation = 'other';
        if (getKeyboardState() === 'closed') {
          restoreBaseHeight();
        }
        else {
          trackViewport();
          setKeyboardState('closing');
        }
      }, 0);
    }

    function handleTouchStart(event: TouchEvent) {
      if (!mobileOS) return;

      const target = event.target as HTMLElement | null;
      if (!isTextInput(target)) return;

      const location = getInputLocation(target);
      if (location === 'other' || document.activeElement === target) return;

      activateInput(location, location === 'content' ? target : undefined);
      event.preventDefault();
      target.focus({ preventScroll: true });
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!mobileOS || event.key !== 'Tab') return;

      const target = event.target as HTMLElement | null;
      if (!isTextInput(target)) return;

      event.preventDefault();
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          'input:not([type="hidden"]), textarea',
        ),
      );
      const currentIndex = inputs.findIndex((input) => input === target);
      if (currentIndex === -1) return;

      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + inputs.length) % inputs.length
        : (currentIndex + 1) % inputs.length;
      inputs[nextIndex]?.focus({ preventScroll: true });
    }

    updateViewport();

    const vv = window.visualViewport;
    vv?.addEventListener('resize', updateViewport);
    vv?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    document.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false });
    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });

    return () => {
      cancelViewport();
      cancelBlur();
      vv?.removeEventListener('resize', updateViewport);
      vv?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);
}

export const useViewport = useVisualViewport;
