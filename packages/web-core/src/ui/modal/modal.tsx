import { type ComponentProps, createElement, type ReactNode, useSyncExternalStore } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#ui';
import { cn } from '#utils';

import { closeOverlay, getOverlaysSnapshot, subscribeToOverlays } from './modal-registry';

export type ModalComponentProps<TResult = boolean> = {
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

function ModalContent({ children, className, size = 'md', ratio = 'auto', ...props }: ComponentProps<typeof DialogContent> & {
  size?: ModalSize
  ratio?: ModalRatio
}) {
  return <DialogContent {...props} className={cn(modalSizeClasses[size], modalRatioClasses[ratio], className)}>{children}</DialogContent>;
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

/** 전역에 마운트되는 모달 컨테이너입니다. */
export function ModalContainer() {
  const overlays = useSyncExternalStore(
    subscribeToOverlays,
    getOverlaysSnapshot,
    getOverlaysSnapshot,
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
              closeOverlay(id);
            }
          },
          close: (result: unknown = false) => {
            closeOverlay(id, result);
          },
        });
      })}
    </>
  );
}
