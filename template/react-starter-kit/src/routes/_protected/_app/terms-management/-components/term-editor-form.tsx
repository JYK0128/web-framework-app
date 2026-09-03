import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { getTermsControllerGetAdminTermsQueryKey, useTermsControllerCreateTerm, useTermsControllerUpdateTerm } from '#/.generated/api/endpoints/terms/terms';
import type { AdminTermDto } from '#/.generated/api/model';
import { Button, DialogFooter } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';
import { when } from '@pkg/shared/common';
type TermFormState = { version: string, content: string, publishedAt: Date | undefined };

function emptyForm(): TermFormState {
  return { version: '', content: '', publishedAt: undefined };
}

function formFromTerm(term: AdminTermDto): TermFormState {
  return { version: term.version, content: term.content, publishedAt: when((value): value is string => Boolean(value), (publishedAt) => new Date(publishedAt))(term.publishedAt) };
}

export function TermEditorForm({
  term,
  termGroupId,
  onSuccess,
}: {
  term: AdminTermDto | null
  termGroupId?: string
  onSuccess: () => void
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const createMutation = useTermsControllerCreateTerm();
  const updateMutation = useTermsControllerUpdateTerm();
  const [isSaving, setIsSaving] = useState(false);

  const termForm = useAppForm({
    defaultValues: term ? formFromTerm(term) : emptyForm(),
    onSubmit: async ({ value }) => {
      const data = {
        version: value.version.trim(),
        content: value.content.trim(),
        publishedAt: value.publishedAt?.toISOString() ?? null,
      };

      setIsSaving(true);
      try {
        if (term) await updateMutation.mutateAsync({ id: term.id, data });
        else if (termGroupId) await createMutation.mutateAsync({ data: { termGroupId, ...data } });
        else return;
        await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsQueryKey() });
        toast.success(term ? t('terms.editSuccess') : t('terms.createSuccess'));
        onSuccess();
      }
      catch {
        toast.error(t('common.error'));
      }
      finally {
        setIsSaving(false);
      }
    },
  });

  return (
    <termForm.AppForm>
      <FormLayout onSubmit={() => void termForm.handleSubmit()} className="grid">
        <div className="grid grid-cols-1 gap-1">
          <termForm.AppField name="version">
            {(field) => <field.Input label={t('terms.fields.version')} placeholder={t('terms.placeholders.version')} required />}
          </termForm.AppField>
          <termForm.AppField name="publishedAt">
            {(field) => <field.DateTimePicker label={t('terms.fields.publishedAt')} placeholder={t('terms.placeholders.publishedAt')} />}
          </termForm.AppField>
        </div>
        <termForm.AppField name="content">
          {(field) => <field.Textarea label={t('terms.fields.content')} placeholder={t('terms.placeholders.content')} rows={8} required />}
        </termForm.AppField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? t('common.processing') : t('common.save')}</Button>
        </DialogFooter>
      </FormLayout>
    </termForm.AppForm>
  );
}
