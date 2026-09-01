import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/.generated/shadcn/components/ui';

import { FaqEditorForm } from './faq-editor-form';

export function FaqCreateDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={(
        <Button className="gap-2 self-start shadow-xs">
          <Plus className="size-4" />
          FAQ 추가
        </Button>
      )}
      />
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>FAQ 추가</DialogTitle>
          <DialogDescription>새 FAQ 정보를 등록합니다.</DialogDescription>
        </DialogHeader>
        <FaqEditorForm faq={null} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
