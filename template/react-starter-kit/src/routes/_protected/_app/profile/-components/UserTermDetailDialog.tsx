import { useI18n } from '@pkg/shared/web';

import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';

export type UserTermDetailItem = {
  title: string
  version: string
  code: string
  content: string
  isRequired?: boolean
  isAgreed?: boolean
  publishedAt?: string | null
  createdAt?: string | null
};

type UserTermDetailDialogProps = {
  open: boolean
  term: UserTermDetailItem | null
  onOpenChange: (open: boolean) => void
};

export function UserTermDetailDialog({ open, term, onOpenChange }: UserTermDetailDialogProps) {
  const { language, t } = useI18n();
  if (!term) return null;

  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

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
                {t('terms.publishedAt')}
                {': '}
                {new Date(term.publishedAt).toLocaleString(dateLocale)}
              </span>
            )}
            {term.createdAt && (
              <span className="text-muted-foreground">
                {t('profile.agreementChangedAt')}
                {': '}
                {new Date(term.createdAt).toLocaleString(dateLocale)}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">{t('terms.content')}</h3>
            <div className="
              max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md border
              bg-muted/20 p-4 text-sm/6
            "
            >
              {term.content}
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
