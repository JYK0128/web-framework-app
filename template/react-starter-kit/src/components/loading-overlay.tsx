import { useI18n } from '@pkg/shared/web';
import { LoaderCircle } from 'lucide-react';

type LoadingOverlayProps = {
  open: boolean
  message?: string
};

export function LoadingOverlay({ open, message }: LoadingOverlayProps) {
  const { t } = useI18n();
  const displayMessage = message ?? t('processing');

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center bg-background/70
        backdrop-blur-sm
      "
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
    >
      <div className="
        flex min-w-44 flex-col items-center gap-3 rounded-xl border
        bg-background px-6 py-5 shadow-lg
      "
      >
        <LoaderCircle className="size-6 animate-spin text-primary" />
        <span className="text-sm font-medium">{displayMessage}</span>
      </div>
    </div>
  );
}
