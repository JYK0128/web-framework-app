import { type ComponentType, createElement, type ReactNode, useSyncExternalStore } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

export type ModalComponentProps<TResult = void> = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  close?: (result?: TResult) => void
};

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalRatio = 'auto' | 'square' | 'standard' | 'wide' | 'portrait';

const modalSizeClasses: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  full: 'sm:max-w-[calc(100%-2rem)]',
};

const modalRatioClasses: Record<ModalRatio, string> = {
  auto: '',
  square: 'aspect-square',
  standard: 'aspect-[4/3]',
  wide: 'aspect-video',
  portrait: 'aspect-[3/4]',
};

function ModalComponent({ children, open, onOpenChange }: ModalComponentProps & { children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

function ModalContent({ children, className, size = 'md', ratio = 'auto' }: {
  children: ReactNode
  className?: string
  size?: ModalSize
  ratio?: ModalRatio
}) {
  return <DialogContent className={cn(modalSizeClasses[size], modalRatioClasses[ratio], className)}>{children}</DialogContent>;
}

function ModalBody({ children, className }: { children: ReactNode, className?: string }) {
  return <div className={className}>{children}</div>;
}

export const Modal = Object.assign(ModalComponent, {
  Content: ModalContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: ModalBody,
  Footer: DialogFooter,
});

/**
 * 컴포넌트의 close 콜백 파라미터 타입에서 결과값 TResult를 자동으로 추론합니다.
 */
export type InferModalResult<TComponent> = TComponent extends ComponentType<infer P>
  ? P extends { close?: (result?: infer R) => void }
    ? R
    : void
  : void;

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
    props?: Omit<P, keyof ModalComponentProps<R>>,
  ): Promise<R> => {
    return new Promise((resolve) => {
      const id = `modal-${++this.idCounter}`;
      const newOverlay: ActiveOverlayItem = {
        id,
        Component: Component as ComponentType<Record<string, unknown>>,
        props: (props ?? {}),
        isOpen: true,
        resolve: resolve as (result: unknown) => void,
      };

      this.overlays = [...this.overlays, newOverlay];

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

    // modal 애니메이션 종료 후 완전 unmount
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
 * 프로미스 기반으로 커스텀 모달을 함수 호출로 띄웁니다.
 *
 * - 컴포넌트의 props를 자동으로 검증합니다 (`open`, `onOpenChange`, `close`는 제외).
 * - 컴포넌트의 `close(result)` 인자 타입으로부터 Promise 반환값(R)을 자동으로 추론합니다.
 *
 * @example
 * // props 타입 완벽 추론, 반환 타입 완벽 추론
 * const result = await openModal(ExampleModal, { id: '123' });
 */
export function openModal<
  TProps extends object,
  TResult = TProps extends { close?: (result?: infer R) => void } ? R : void,
>(
  Component: ComponentType<TProps>,
  ...[props]: [Omit<TProps, keyof ModalComponentProps<TResult>>] extends [Record<string, never>]
    ? [props?: Omit<TProps, keyof ModalComponentProps<TResult>>]
    : keyof Omit<TProps, keyof ModalComponentProps<TResult>> extends never
      ? [props?: Omit<TProps, keyof ModalComponentProps<TResult>>]
      : [props: Omit<TProps, keyof ModalComponentProps<TResult>>]
): Promise<TResult> {
  return overlayState.open<TProps, TResult>(Component, props);
}

/**
 * 전역에 마운트되는 Modal 컨테이너 컴포넌트입니다.
 * (RootComponent 등에 배치)
 */
export function ModalContainer() {
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
