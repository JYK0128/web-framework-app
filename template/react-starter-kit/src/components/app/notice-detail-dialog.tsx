import { useI18n } from '@pkg/shared/web';

import type { NoticeFeedItemDto } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';

type NoticeDetailDialogProps = {
  open: boolean
  notice: NoticeFeedItemDto | null
  onOpenChange: (open: boolean) => void
};

export function NoticeDetailDialog({ open, notice, onOpenChange }: NoticeDetailDialogProps) {
  const { language, t } = useI18n();

  if (!notice) return null;

  const locale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{notice.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {t('notices.publishedAt')}
              :
              {' '}
              {formatDate(notice.publishedAt, locale)}
            </span>
            <span>
              {t('notices.expiresAtField')}
              :
              {' '}
              {formatDate(notice.expiresAt, locale)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-1">
            {notice.priority >= 2 && <Badge variant="destructive">{t('notices.urgent')}</Badge>}
            {notice.priority === 1 && <Badge variant="outline">{t('notices.important')}</Badge>}
          </div>
          <div className="
            whitespace-pre-wrap rounded-md border bg-muted/20 p-4 text-sm/6
          "
          >
            {notice.content}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(value: string | null, locale: string) {
  return value ? new Date(value).toLocaleString(locale) : '-';
}
