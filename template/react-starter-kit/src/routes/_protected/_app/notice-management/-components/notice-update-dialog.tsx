import { useI18n } from '@pkg/shared/web';
import { useState } from 'react';

import type { NoticeItemDto } from '#/.generated/api/model';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';

import { NoticeEditorForm } from './notice-editor-form';

type NoticeUpdateDialogProps = {
  notice: NoticeItemDto
};

export function NoticeUpdateDialog({ notice }: NoticeUpdateDialogProps) {
  const [open, setOpen] = useState(Boolean(notice));
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('notices.editTitle')}</DialogTitle>
        </DialogHeader>
        <NoticeEditorForm
          key={notice.id}
          notice={notice}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
