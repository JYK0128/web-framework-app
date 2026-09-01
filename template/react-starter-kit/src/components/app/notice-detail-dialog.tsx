import { formatDateTime } from '@pkg/shared/common';
import { useI18n } from '@pkg/shared/web';
import { useState } from 'react';

import { type NoticeFeedItemDto, NoticePriority } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';

type NoticeDetailDialogProps = {
  notice: NoticeFeedItemDto | null
};

export function NoticeDetailDialog({ notice }: NoticeDetailDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(() => Boolean(notice));

  if (!open || !notice) return null;

  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{notice.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {t('notices.publishedAt')}
              :
              {' '}
              {formatDateTime(notice.publishedAt)}
            </span>
            <span>
              {t('notices.expiresAtField')}
              :
              {' '}
              {formatDateTime(notice.expiresAt)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-1">
            {notice.priority === NoticePriority.HIGH && <Badge variant="destructive">{t('notices.urgent')}</Badge>}
            {notice.priority === NoticePriority.NORMAL && <Badge variant="outline">{t('notices.important')}</Badge>}
          </div>
          <div className="
            whitespace-pre-wrap rounded-md border bg-muted/20 p-4 text-sm/6
          "
          >
            {notice.content}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
