import { type ComponentType, createElement, useSyncExternalStore } from 'react';

export type DialogComponentProps<TResult = void> = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  close?: (result?: TResult) => void
};

/**
 * 컴포넌트의 close 콜백 파라미터 타입에서 결과값 TResult를 자동으로 추론합니다.
 */
export type InferDialogResult<TComponent> = TComponent extends ComponentType<infer P>
  ? P extends { close?: (result?: infer R) => void }
    ? R
    : void
  : void;

export type OpenDialogOptions = {
  dialogId?: string
};

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
    props?: Omit<P, keyof DialogComponentProps<R>>,
    options?: OpenDialogOptions,
  ): Promise<R> => {
    return new Promise((resolve) => {
      const id = options?.dialogId ?? `overlay-${++this.idCounter}`;

      const existingIndex = this.overlays.findIndex((item) => item.id === id);
      const newOverlay: ActiveOverlayItem = {
        id,
        Component: Component as ComponentType<Record<string, unknown>>,
        props: (props ?? {}),
        isOpen: true,
        resolve: resolve as (result: unknown) => void,
      };

      if (existingIndex >= 0) {
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

  close = (id: string, result?: unknown) => {
    const target = this.overlays.find((item) => item.id === id);
    if (!target) return;

    // 애니메이션을 위해 먼저 isOpen: false 처리
    this.overlays = this.overlays.map((item) =>
      item.id === id ? { ...item, isOpen: false } : item,
    );
    this.publish();

    target.resolve(result);

    // radix dialog 애니메이션 종료 후 완전 unmount
    setTimeout(() => {
      this.overlays = this.overlays.filter((item) => item.id !== id);
      this.publish();
    }, 300);
  };

  private publish() {
    this.subscribers.forEach((subscriber) => subscriber());
  }
}

const overlayState = new OverlayObserver();

/**
 * 프로미스 기반으로 커스텀 다이얼로그/모달을 함수 호출로 띄웁니다.
 *
 * - 컴포넌트의 props를 자동으로 검증합니다 (`open`, `onOpenChange`, `close`는 제외).
 * - 컴포넌트의 `close(result)` 인자 타입으로부터 Promise 반환값(R)을 자동으로 추론합니다.
 *
 * @example
 * // props 타입 완벽 추론, 반환 타입 완벽 추론
 * const result = await openDialog(UserManagementDialog, { userId: '123' });
 */
export function openDialog<
  TProps extends object,
  TResult = TProps extends { close?: (result?: infer R) => void } ? R : void,
>(
  Component: ComponentType<TProps>,
  ...[props, options]: [Omit<TProps, keyof DialogComponentProps<TResult>>] extends [Record<string, never>]
    ? [props?: Omit<TProps, keyof DialogComponentProps<TResult>>, options?: OpenDialogOptions]
    : keyof Omit<TProps, keyof DialogComponentProps<TResult>> extends never
      ? [props?: Omit<TProps, keyof DialogComponentProps<TResult>>, options?: OpenDialogOptions]
      : [props: Omit<TProps, keyof DialogComponentProps<TResult>>, options?: OpenDialogOptions]
): Promise<TResult> {
  return overlayState.open<TProps, TResult>(Component, props, options);
}

/**
 * 전역에 마운트되는 Overlay 컨테이너 컴포넌트입니다.
 * (RootComponent 등에 배치)
 */
export function OverlayContainer() {
  const overlays = useSyncExternalStore(
    overlayState.subscribe,
    overlayState.getSnapshot,
    overlayState.getSnapshot,
  );

  return (
    <>
      {overlays.map(({ id, Component, props, isOpen }) => {
        return createElement(Component, {
          key: id,
          ...props,
          open: isOpen,
          onOpenChange: (openState: boolean) => {
            if (!openState) {
              overlayState.close(id);
            }
          },
          close: (result?: unknown) => {
            overlayState.close(id, result);
          },
        });
      })}
    </>
  );
}
