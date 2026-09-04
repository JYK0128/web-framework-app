import { formatDateTime } from '@pkg/shared/common';

import { type NoticeFeedItemDto, NoticePriority } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

type NoticeDetailDialogProps = DialogComponentProps<void> & {
  notice: NoticeFeedItemDto
};

export function NoticeDetailDialog({
  notice,
  open,
  onOpenChange,
}: NoticeDetailDialogProps) {
  const { t } = useI18n();

  if (!notice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{notice.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {t('notice.publishedAt')}
              :
              {' '}
              {formatDateTime(notice.publishedAt)}
            </span>
            <span>
              {t('notice.expiresAtField')}
              :
              {' '}
              {formatDateTime(notice.expiresAt)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-1">
            {notice.priority === NoticePriority.HIGH && <Badge variant="destructive">{t('notice.priority.urgent')}</Badge>}
            {notice.priority === NoticePriority.NORMAL && <Badge variant="outline">{t('notice.priority.important')}</Badge>}
          </div>
          <div className="
            whitespace-pre-wrap rounded-md border bg-muted/20 p-4 text-sm/6
          "
          >
            {notice.content}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>{t('app.dialog.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
