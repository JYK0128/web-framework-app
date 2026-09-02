import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

import { TermGroupEditorForm } from './term-group-editor-form';

export function TermGroupCreateDialog({ onSaved }: { onSaved?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={(
        <Button className="gap-2 shadow-xs">
          <Plus className="size-4" />
          {t('terms.newGroup')}
        </Button>
      )}
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('terms.createGroupTitle')}</DialogTitle>
          <DialogDescription>{t('terms.groupEditorDescription')}</DialogDescription>
        </DialogHeader>
        <TermGroupEditorForm onSuccess={() => setOpen(false)} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}
