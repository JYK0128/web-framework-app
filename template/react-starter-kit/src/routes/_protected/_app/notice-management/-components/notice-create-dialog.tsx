import { useI18n } from '@pkg/shared/web';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '#/.generated/shadcn/components/ui';

import { NoticeEditorForm } from './notice-editor-form';

export function NoticeCreateDialog() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(
          <Button className="gap-2 self-start shadow-xs">
            <Plus className="size-4" />
            {t('notices.create')}
          </Button>
        )}
      />
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('notices.createTitle')}</DialogTitle>
        </DialogHeader>
        <NoticeEditorForm
          notice={null}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
