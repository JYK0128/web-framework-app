import { CircleAlert, Info } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '#/.generated/shadcn/components/ui';

type DialogOptions = {
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
};

type DialogRequest = DialogOptions & {
  type: 'alert' | 'confirm'
  resolve: (result: boolean) => void
};

class DialogObserver {
  private request: DialogRequest | null = null;
  private readonly subscribers = new Set<() => void>();

  subscribe = (subscriber: () => void) => {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  };

  getSnapshot = () => this.request;

  open(request: DialogRequest) {
    this.request = request;
    this.publish();
  }

  close(result: boolean) {
    this.request?.resolve(result);
    this.request = null;
    this.publish();
  }

  private publish() {
    this.subscribers.forEach((subscriber) => subscriber());
  }
}

const dialogState = new DialogObserver();

export function alert(options: string | DialogOptions): Promise<void> {
  const normalized = typeof options === 'string' ? { description: options } : options;
  return new Promise((resolve) => dialogState.open({
    ...normalized,
    type: 'alert',
    resolve: () => resolve(),
  }));
}

export function confirm(options: string | DialogOptions): Promise<boolean> {
  const normalized = typeof options === 'string' ? { description: options } : options;
  return new Promise((resolve) => dialogState.open({ ...normalized, type: 'confirm', resolve }));
}

export function SystemDialog() {
  const dialog = useSyncExternalStore(dialogState.subscribe, dialogState.getSnapshot, dialogState.getSnapshot);
  if (!dialog) return null;

  const Icon = dialog.tone === 'danger' ? CircleAlert : Info;

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className={dialog.tone === 'danger'
            ? `bg-destructive/10 text-destructive`
            : undefined}
          >
            <Icon className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>{dialog.title ?? (dialog.type === 'confirm' ? '확인' : '알림')}</AlertDialogTitle>
          <AlertDialogDescription>{dialog.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {dialog.type === 'confirm' && (
            <AlertDialogCancel onClick={() => dialogState.close(false)}>
              {dialog.cancelLabel ?? '취소'}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            variant={dialog.tone === 'danger' ? 'destructive' : 'default'}
            onClick={() => dialogState.close(true)}
          >
            {dialog.confirmLabel ?? '확인'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
