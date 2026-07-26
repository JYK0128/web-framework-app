import { useI18n } from '@pkg/shared/web';
import { CheckCircle2, CircleAlert, Info, type LucideIcon, TriangleAlert } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogTitle } from '#.generated/shadcn/components/ui';

type DialogTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

type AlertOptions = {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
  onConfirm?: () => void | Promise<void>
  onClose?: () => void | Promise<void>
};

type ConfirmOptions = AlertOptions & {
  onCancel?: () => void | Promise<void>
};

type AlertRequest = AlertOptions & {
  type: 'alert'
  resolve: () => void
};

type ConfirmRequest = ConfirmOptions & {
  type: 'confirm'
  resolve: (result: boolean) => void
};

type DialogRequest = AlertRequest | ConfirmRequest;

const toneStyles: Record<DialogTone, { icon: LucideIcon, iconClass: string, buttonVariant: 'default' | 'secondary' | 'destructive' }> = {
  default: { icon: Info, iconClass: 'bg-muted text-foreground', buttonVariant: 'default' },
  info: { icon: Info, iconClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', buttonVariant: 'default' },
  success: { icon: CheckCircle2, iconClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', buttonVariant: 'default' },
  warning: { icon: TriangleAlert, iconClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', buttonVariant: 'default' },
  danger: { icon: CircleAlert, iconClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400', buttonVariant: 'destructive' },
};

class DialogObserver {
  private readonly dialogs: DialogRequest[] = [];
  private activeDialog: DialogRequest | null = null;
  private readonly subscribers = new Set<() => void>();

  subscribe = (callback: () => void) => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  getSnapshot = () => this.activeDialog;

  addDialog = (request: DialogRequest) => {
    this.dialogs.push(request);
    if (!this.activeDialog) {
      requestAnimationFrame(() => {
        if (!this.activeDialog) {
          this.activeDialog = this.dialogs.shift() ?? null;
          this.publish();
        }
      });
    }
  };

  dismiss = () => {
    this.activeDialog = this.dialogs.shift() ?? null;
    this.publish();
  };

  private publish() {
    this.subscribers.forEach((subscriber) => subscriber());
  }
}

const dialogState = new DialogObserver();

function normalizeOptions(options: string | AlertOptions | ConfirmOptions) {
  return typeof options === 'string'
    ? { description: options }
    : options;
}

export function alert(options: string | AlertOptions): Promise<void> {
  return new Promise((resolve) => {
    const normalizedOptions = normalizeOptions(options);
    dialogState.addDialog({
      ...normalizedOptions,
      type: 'alert',
      resolve: () => resolve(),
    });
  });
}

export function confirm(options: string | ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const normalizedOptions = normalizeOptions(options) as ConfirmOptions;
    dialogState.addDialog({
      ...normalizedOptions,
      type: 'confirm',
      resolve,
    });
  });
}

export function SystemDialog() {
  const dialog = useSyncExternalStore(dialogState.subscribe, dialogState.getSnapshot, dialogState.getSnapshot);
  const { t } = useI18n();

  if (!dialog) return null;

  const {
    icon: ToneIcon,
    iconClass,
    buttonVariant,
  } = toneStyles[dialog.tone ?? 'default'];

  const title = dialog.title ?? (dialog.type === 'alert' ? t('dialog_alert') : t('dialog_confirm_needed'));
  const confirmLabel = dialog.confirmLabel ?? t('dialog_confirm');
  const cancelLabel = dialog.cancelLabel ?? t('dialog_cancel');

  const close = async (result: boolean) => {
    switch (dialog.type) {
      case 'confirm': {
        const handler = result ? dialog.onConfirm : dialog.onCancel;
        await handler?.();
        dialog.resolve(result);
        break;
      }
      case 'alert': {
        await dialog.onConfirm?.();
        dialog.resolve();
        break;
      }
    }

    await dialog.onClose?.();
    dialogState.dismiss();
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogOverlay className="bg-black/50! backdrop-blur-sm!" />
      <AlertDialogContent className="
        fixed! top-1/2! left-1/2! translate-[-50%]! z-50! max-w-md!
        w-[calc(100%-2rem)]! p-6! shadow-2xl rounded-2xl
      "
      >
        <AlertDialogHeader className="
          grid-rows-none! flex flex-col items-start gap-4
          sm:flex-row sm:items-start
          text-left
        "
        >
          <AlertDialogMedia className={`
            mb-0! size-11 shrink-0 rounded-full flex items-center justify-center
            ${iconClass}
          `}
          >
            <ToneIcon className="size-5" aria-hidden="true" />
          </AlertDialogMedia>
          <div className="flex-1 space-y-1.5 text-left">
            <AlertDialogTitle className="text-base font-semibold">{title}</AlertDialogTitle>
            {dialog.description && (
              <AlertDialogDescription className="
                text-sm/relaxed text-muted-foreground
              "
              >
                {dialog.description}
              </AlertDialogDescription>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="
          mx-0! mb-0! p-0! bg-transparent! border-t-0! mt-6 flex flex-row!
          justify-end gap-2.5
        "
        >
          {dialog.type === 'confirm' && (
            <AlertDialogCancel className="min-w-24 px-5 font-medium" onClick={() => { void close(false); }}>
              {cancelLabel}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            variant={buttonVariant}
            className="min-w-24 px-5 font-medium"
            onClick={() => { void close(true); }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
