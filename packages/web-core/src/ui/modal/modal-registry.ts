import type { ComponentType } from 'react';

type ActiveOverlayItem = {
  id: string
  Component: ComponentType<Record<string, unknown>>
  props: Record<string, unknown>
  isOpen: boolean
  resolve: (result: unknown) => void
};

class OverlayObserver {
  private overlays: ActiveOverlayItem[] = [];
  private readonly subscribers = new Set<() => void>();
  private idCounter = 0;

  subscribe = (callback: () => void) => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  getSnapshot = () => this.overlays;

  open = <P extends object, R = void>(
    Component: ComponentType<P>,
    props: object | undefined,
    modalId?: string,
  ): Promise<R> => {
    return new Promise((resolve) => {
      const id = modalId ?? `modal-${++this.idCounter}`;
      const existingIndex = this.overlays.findIndex((item) => item.id === id);
      const newOverlay: ActiveOverlayItem = {
        id,
        Component: Component as ComponentType<Record<string, unknown>>,
        props: (props ?? {}) as Record<string, unknown>,
        isOpen: true,
        resolve: resolve as (result: unknown) => void,
      };

      if (existingIndex >= 0) {
        this.overlays[existingIndex]?.resolve(undefined);
        this.overlays = [
          ...this.overlays.slice(0, existingIndex),
          newOverlay,
          ...this.overlays.slice(existingIndex + 1),
        ];
      }
      else {
        this.overlays = [...this.overlays, newOverlay];
      }

      this.publish();
    });
  };

  close = (id: string, result: unknown = false) => {
    const target = this.overlays.find((item) => item.id === id);
    if (!target) return;

    this.overlays = this.overlays.map((item) =>
      item.id === id ? { ...item, isOpen: false } : item,
    );
    this.publish();

    target.resolve(result);

    setTimeout(() => {
      this.overlays = this.overlays.filter((item) => item.id !== id || item.resolve !== target.resolve);
      this.publish();
    }, 300);
  };

  closeTopFromHistory = () => {
    const topOverlay = [...this.overlays].reverse().find((item) => item.isOpen);
    if (topOverlay) this.close(topOverlay.id);
  };

  hasOpenOverlay = () => this.overlays.some((item) => item.isOpen);

  private publish() {
    this.subscribers.forEach((subscriber) => subscriber());
  }
}

const overlayState = new OverlayObserver();

export const subscribeToOverlays = overlayState.subscribe;
export const getOverlaysSnapshot = overlayState.getSnapshot;

export function openOverlay<P extends object, R = void>(
  Component: ComponentType<P>,
  props: object | undefined,
  modalId?: string,
): Promise<R> {
  return overlayState.open<P, R>(Component, props, modalId);
}

export function closeOverlay(id: string, result?: unknown) {
  overlayState.close(id, result);
}

export function closeTopOverlayFromHistory() {
  overlayState.closeTopFromHistory();
}

export function hasOpenOverlay() {
  return overlayState.hasOpenOverlay();
}
