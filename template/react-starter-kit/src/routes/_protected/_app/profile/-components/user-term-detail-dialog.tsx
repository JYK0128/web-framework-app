import { formatDateTime } from '@pkg/shared/common';

import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

export type UserTermDetailItem = {
  id: string
  title: string
  version: string
  code: string
  content: string
  isRequired?: boolean
  isAgreed?: boolean
  publishedAt?: string | null
  createdAt?: string | null
};

type UserTermDetailDialogProps = DialogComponentProps<void> & {
  term: UserTermDetailItem
};

export function UserTermDetailDialog({
  term,
  open,
  onOpenChange,
}: UserTermDetailDialogProps) {
  const { t } = useI18n();

  if (!term) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{term.title}</span>
            <Badge variant="outline" className="font-mono text-xs font-normal">
              {term.version}
            </Badge>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">{term.code}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {typeof term.isRequired === 'boolean' && (
              <Badge variant={term.isRequired ? 'default' : 'secondary'}>
                {term.isRequired ? t('onboarding.required') : t('onboarding.optional')}
              </Badge>
            )}
            {typeof term.isAgreed === 'boolean' && (
              <Badge variant={term.isAgreed ? 'default' : 'outline'}>
                {term.isAgreed ? t('profile.agreementComplete') : t('profile.notAgreed')}
              </Badge>
            )}
            {term.publishedAt && (
              <span className="text-muted-foreground">
                {t('profile.termsPublishedAt')}
                {': '}
                {formatDateTime(term.publishedAt)}
              </span>
            )}
            {term.createdAt && (
              <span className="text-muted-foreground">
                {t('profile.agreementChangedAt')}
                {': '}
                {formatDateTime(term.createdAt)}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">{t('profile.termsContent')}</h3>
            <div className="
              max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md border
              bg-muted/20 text-sm/6
            "
            >
              {term.content}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            {t('app.dialog.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
