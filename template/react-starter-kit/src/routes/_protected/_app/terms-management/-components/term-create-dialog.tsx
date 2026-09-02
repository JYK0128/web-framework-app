import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

import { TermEditorForm } from './term-editor-form';

export function TermCreateDialog({ termGroupId }: { termGroupId: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={(
        <Button className="gap-2 shadow-xs">
          <Plus className="size-4" />
          {t('terms.create')}
        </Button>
      )}
      />
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('terms.createTitle')}</DialogTitle>
          <DialogDescription>{t('terms.editorDescription')}</DialogDescription>
        </DialogHeader>
        <TermEditorForm term={null} termGroupId={termGroupId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
