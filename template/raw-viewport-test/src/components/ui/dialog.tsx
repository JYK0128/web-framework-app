import * as React from 'react';
import { createPortal } from 'react-dom';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, description, children }: DialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Content Box */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-50 w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-border/60 animate-in zoom-in-95 fade-in-0 duration-200"
      >
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>

        <div className="mt-4">{children}</div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all active:scale-95 hover:bg-primary/90 cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
