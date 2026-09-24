import { type ComponentType, createElement, type ReactNode, useSyncExternalStore } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';

export type ModalComponentProps<TResult = void> = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  close?: (result?: TResult) => void
};

function ModalComponent({ children, open }: ModalComponentProps & { children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="
      fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4
    "
    >
      {children}
    </div>
  );
}

function ModalContent({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(`
        grid w-full max-w-lg gap-4 rounded-xl bg-popover p-4
        text-popover-foreground shadow-lg
      `, className)}
    >
      {children}
    </div>
  );
}

function ModalHeader({ children }: { children: ReactNode }) {
  return <div className="grid gap-1.5">{children}</div>;
}
function ModalTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-medium">{children}</h2>;
}
function ModalDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
function ModalBody({ children, className }: { children: ReactNode, className?: string }) {
  return <div className={className}>{children}</div>;
}
function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="
      flex flex-col-reverse gap-2 border-t pt-4
      sm:flex-row sm:justify-end
    "
    >
      {children}
    </div>
  );
}

export const Modal = Object.assign(ModalComponent, {
  Content: ModalContent,
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
});

/**
 * 컴포넌트의 close 콜백 파라미터 타입에서 결과값 TResult를 자동으로 추론합니다.
 */
export type InferModalResult<TComponent> = TComponent extends ComponentType<infer P>
  ? P extends { close?: (result?: infer R) => void }
    ? R
    : void
  : void;

export type OpenModalOptions = {
  modalId?: string
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
    props?: Omit<P, keyof ModalComponentProps<R>>,
    options?: OpenModalOptions,
  ): Promise<R> => {
    return new Promise((resolve) => {
      const id = options?.modalId ?? `modal-${++this.idCounter}`;

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
 * const result = await openModal(UserManagementModal, { userId: '123' });
 */
export function openModal<
  TProps extends object,
  TResult = TProps extends { close?: (result?: infer R) => void } ? R : void,
>(
  Component: ComponentType<TProps>,
  ...[props, options]: [Omit<TProps, keyof ModalComponentProps<TResult>>] extends [Record<string, never>]
    ? [props?: Omit<TProps, keyof ModalComponentProps<TResult>>, options?: OpenModalOptions]
    : keyof Omit<TProps, keyof ModalComponentProps<TResult>> extends never
      ? [props?: Omit<TProps, keyof ModalComponentProps<TResult>>, options?: OpenModalOptions]
      : [props: Omit<TProps, keyof ModalComponentProps<TResult>>, options?: OpenModalOptions]
): Promise<TResult> {
  return overlayState.open<TProps, TResult>(Component, props, options);
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
