import { CheckCircle2, CircleAlert, Info, type LucideIcon, TriangleAlert } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

type DialogTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

type AlertOptions = {
  title?: string
  description?: string
  confirmLabel?: string
  tone?: DialogTone
  onConfirm?: () => void | Promise<void>
  onClose?: () => void | Promise<void>
};

type ConfirmOptions = AlertOptions & {
  cancelLabel?: string
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
  info: { icon: Info, iconClass: 'bg-blue-100 text-blue-700', buttonVariant: 'default' },
  success: { icon: CheckCircle2, iconClass: 'bg-emerald-100 text-emerald-700', buttonVariant: 'default' },
  warning: { icon: TriangleAlert, iconClass: 'bg-amber-100 text-amber-700', buttonVariant: 'default' },
  danger: { icon: CircleAlert, iconClass: 'bg-rose-100 text-rose-700', buttonVariant: 'destructive' },
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className={iconClass}>
            <ToneIcon className="size-5" aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{dialog.title ?? (dialog.type === 'confirm' ? t('app.dialog.confirmTitle') : t('app.dialog.title'))}</AlertDialogTitle>
          {dialog.description && <AlertDialogDescription>{dialog.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          {dialog.type === 'confirm' && (
            <AlertDialogCancel onClick={() => void close(false)}>
              {dialog.cancelLabel ?? t('app.dialog.cancel')}
            </AlertDialogCancel>
          )}
          <AlertDialogAction variant={buttonVariant} onClick={() => void close(true)}>
            {dialog.confirmLabel ?? t('app.dialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
