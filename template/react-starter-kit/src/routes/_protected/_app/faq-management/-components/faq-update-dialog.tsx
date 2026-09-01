import { useI18n } from '@pkg/shared/web';
import { useState } from 'react';

import type { FaqItemDto } from '#/.generated/api/model';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';

import { FaqEditorForm } from './faq-editor-form';

interface FaqUpdateDialogProps {
  faq: FaqItemDto
}

export function FaqUpdateDialog({ faq }: FaqUpdateDialogProps) {
  const [open, setOpen] = useState(Boolean(faq));
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>{t('faq.editFaq')}</DialogTitle>
          <DialogDescription>{t('faq.editDescription')}</DialogDescription>
        </DialogHeader>

        <FaqEditorForm
          key={faq.id}
          faq={faq}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
