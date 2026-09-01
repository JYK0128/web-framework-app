import { useI18n } from '@pkg/shared/web';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/.generated/shadcn/components/ui';

import { TemplateEditorForm } from './template-editor-form';

export function TemplateCreateDialog() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={(
        <Button className="gap-2 shrink-0">
          <Plus className="size-4" />
          {t('templates.create')}
        </Button>
      )}
      />
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('templates.createTitle')}</DialogTitle>
          <DialogDescription>{t('templates.createDescription')}</DialogDescription>
        </DialogHeader>
        <TemplateEditorForm template={null} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
