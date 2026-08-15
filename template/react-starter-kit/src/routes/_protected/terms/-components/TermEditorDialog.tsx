import { useI18n } from '@pkg/shared/web';

import type { AdminTermDto, CreateTermRequestDto, UpdateTermRequestDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';

type TermEditorDialogProps = {
  open: boolean
  term: AdminTermDto | null
  termGroupId: string
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreateTermRequestDto | UpdateTermRequestDto) => Promise<void>
};

type TermFormState = {
  version: string
  content: string
  publishedAt: string
};

function toDateTimeLocal(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function emptyForm(): TermFormState {
  return {
    version: '',
    content: '',
    publishedAt: '',
  };
}

function formFromTerm(term: AdminTermDto): TermFormState {
  return {
    version: term.version,
    content: term.content,
    publishedAt: toDateTimeLocal(term.publishedAt),
  };
}

export function TermEditorDialog({ open, term, termGroupId, isSaving, onOpenChange, onSave }: TermEditorDialogProps) {
  const { t } = useI18n();
  const termForm = useAppForm({
    defaultValues: term ? formFromTerm(term) : emptyForm(),
    onSubmit: async ({ value }) => {
      const data = {
        version: value.version.trim(),
        content: value.content.trim(),
        publishedAt: value.publishedAt ? new Date(value.publishedAt).toISOString() : null,
      };
      await onSave(term ? data : { termGroupId, ...data });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{term ? t('terms.editTitle') : t('terms.createTitle')}</DialogTitle>
          <DialogDescription>{t('terms.editorDescription')}</DialogDescription>
        </DialogHeader>
        <termForm.AppForm>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void termForm.handleSubmit();
            }}
            className="grid gap-4"
          >
            <termForm.AppField name="version">
              {(field) => <field.Input label={t('terms.version')} required />}
            </termForm.AppField>
            <termForm.AppField name="content">
              {(field) => (
                <field.Textarea
                  label={t('terms.content')}
                  className="min-h-52"
                  required
                />
              )}
            </termForm.AppField>
            <termForm.AppField name="publishedAt">
              {(field) => (
                <field.DateTimePicker
                  label={t('terms.publishSchedule')}
                  description={t('terms.publishScheduleHint')}
                  placeholder={t('terms.publishSchedule')}
                />
              )}
            </termForm.AppField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? t('common.processing') : t('common.save')}</Button>
            </DialogFooter>
          </form>
        </termForm.AppForm>
      </DialogContent>
    </Dialog>
  );
}
