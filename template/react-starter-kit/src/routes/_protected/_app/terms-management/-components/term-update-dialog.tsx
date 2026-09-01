import { useI18n } from '@pkg/shared/web';
import { useState } from 'react';

import type { AdminTermDto } from '#/.generated/api/model';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';

import { TermEditorForm } from './term-editor-form';

export function TermUpdateDialog({ term }: { term: AdminTermDto }) {
  const [open, setOpen] = useState(Boolean(term));
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('terms.editTitle')}</DialogTitle>
          <DialogDescription>{t('terms.editorDescription')}</DialogDescription>
        </DialogHeader>
        <TermEditorForm key={term.id} term={term} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
