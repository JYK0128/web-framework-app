import { useI18n } from '@pkg/shared/web';

import type { CreateTermGroupRequestDto, TermGroupItemDto, UpdateTermGroupRequestDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';

type TermGroupEditorDialogProps = {
  open: boolean
  group: TermGroupItemDto | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreateTermGroupRequestDto | UpdateTermGroupRequestDto) => Promise<void>
};

type TermGroupFormState = {
  code: string
  title: string
  isRequired: boolean
  sortOrder: number
};

function emptyForm(): TermGroupFormState {
  return { code: '', title: '', isRequired: true, sortOrder: 0 };
}

function formFromGroup(group: TermGroupItemDto): TermGroupFormState {
  return {
    code: group.code,
    title: group.title,
    isRequired: group.isRequired,
    sortOrder: group.sortOrder,
  };
}

export function TermGroupEditorDialog({ open, group, isSaving, onOpenChange, onSave }: TermGroupEditorDialogProps) {
  const { t } = useI18n();
  const termGroupForm = useAppForm({
    defaultValues: group ? formFromGroup(group) : emptyForm(),
    onSubmit: async ({ value }) => {
      await onSave({
        code: value.code.trim(),
        title: value.title.trim(),
        isRequired: value.isRequired,
        sortOrder: Math.max(0, Math.trunc(Number(value.sortOrder) || 0)),
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{group ? t('terms.editGroupTitle') : t('terms.createGroupTitle')}</DialogTitle>
          <DialogDescription>{t('terms.groupEditorDescription')}</DialogDescription>
        </DialogHeader>
        <termGroupForm.AppForm>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void termGroupForm.handleSubmit();
            }}
            className="grid gap-0"
          >
            <termGroupForm.AppField name="code">
              {(field) => <field.Input label={t('terms.groupCode')} required disabled={Boolean(group)} />}
            </termGroupForm.AppField>
            <termGroupForm.AppField name="title">
              {(field) => <field.Input label={t('terms.groupName')} required />}
            </termGroupForm.AppField>
            <div className="flex justify-end">
              <div className="w-fit">
                <termGroupForm.AppField name="isRequired">
                  {(field) => (
                    <field.Checkbox
                      label={t('terms.required')}
                      orientation="horizontal"
                      showError={false}
                      className="mt-0.5"
                    />
                  )}
                </termGroupForm.AppField>
              </div>
            </div>
            <termGroupForm.AppField name="sortOrder">
              {(field) => <field.Input label={t('terms.sortOrder')} type="number" min={0} />}
            </termGroupForm.AppField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? t('common.processing') : t('common.save')}</Button>
            </DialogFooter>
          </form>
        </termGroupForm.AppForm>
      </DialogContent>
    </Dialog>
  );
}
