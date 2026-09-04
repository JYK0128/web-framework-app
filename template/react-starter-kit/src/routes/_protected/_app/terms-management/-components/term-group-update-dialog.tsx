import type { TermGroupItemDto } from '#/.generated/api/model';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

import { TermGroupEditorForm } from './term-group-editor-form';

type TermGroupUpdateDialogProps = DialogComponentProps<string> & {
  group: TermGroupItemDto
};

export function TermGroupUpdateDialog({
  group,
  open,
  onOpenChange,
  close,
}: TermGroupUpdateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('termsManagement.editGroupTitle')}</DialogTitle>
          <DialogDescription>{t('termsManagement.groupEditorDescription')}</DialogDescription>
        </DialogHeader>
        <TermGroupEditorForm
          key={group.id}
          group={group}
          onSuccess={(id) => close?.(id)}
          onCancel={() => onOpenChange?.(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
