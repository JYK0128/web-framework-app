import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'warning';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-16 left-0 right-0 z-50 pointer-events-none flex flex-col items-center space-y-2 px-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-center justify-between w-full max-w-xs rounded-xl p-3.5 shadow-lg border text-xs transition-all duration-200 animate-in slide-in-from-bottom-4 fade-in-0',
            toast.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-600'
              : toast.type === 'warning'
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-foreground text-background border-foreground/20'
          )}
        >
          <div className="flex flex-col">
            <span className="font-semibold">{toast.title}</span>
            {toast.description && (
              <span className="text-[11px] opacity-90">{toast.description}</span>
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-3 text-xs opacity-75 hover:opacity-100 font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
