import { Pencil } from 'lucide-react';
import { useState } from 'react';

import type { TermGroupItemDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

import { TermGroupEditorForm } from './term-group-editor-form';

export function TermGroupUpdateDialog({ group, onSaved }: { group: TermGroupItemDto, onSaved?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={(
        <Button variant="ghost" size="sm">
          <Pencil className="size-4" />
          {t('terms.editGroup')}
        </Button>
      )}
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('terms.editGroupTitle')}</DialogTitle>
          <DialogDescription>{t('terms.groupEditorDescription')}</DialogDescription>
        </DialogHeader>
        <TermGroupEditorForm key={group.id} group={group} onSuccess={() => setOpen(false)} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}
