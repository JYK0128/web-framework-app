import { useQueryClient } from '@tanstack/react-query';

import { getTermsControllerGetAdminTermsQueryKey, useTermsControllerCreateTerm, useTermsControllerUpdateTerm } from '#/.generated/api/endpoints/terms/terms';
import type { AdminTermDto, CreateTermRequestDto, UpdateTermRequestDto } from '#/.generated/api/model';
import { Button, DialogFooter } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

export function TermEditorForm({
  term,
  termGroupId,
  onSuccess,
  onCancel,
}: {
  term: AdminTermDto | null
  termGroupId?: string
  onSuccess: () => void
  onCancel?: () => void
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const createMutation = useTermsControllerCreateTerm();
  const updateMutation = useTermsControllerUpdateTerm();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const termForm = useAppForm({
    defaultValues: {
      version: term?.version ?? '',
      content: term?.content ?? '',
      publishedAt: term?.publishedAt ?? (null as string | null),
    },
    onSubmit: async ({ value }) => {
      const data = {
        version: value.version.trim(),
        content: value.content.trim(),
        publishedAt: value.publishedAt ?? null,
      };

      if (term) {
        const updatePayload: UpdateTermRequestDto = data;
        await updateMutation.mutateAsync({ id: term.id, data: updatePayload });
      }
      else if (termGroupId) {
        const createPayload: CreateTermRequestDto = { termGroupId, ...data };
        await createMutation.mutateAsync({ data: createPayload });
      }
      else {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsQueryKey() });
      onSuccess();
    },
  });

  const handleCancel = onCancel ?? onSuccess;

  return (
    <termForm.AppForm>
      <FormLayout
        onSubmit={() => void termForm.handleSubmit()}
        className="grid gap-4"
      >
        <div className="
          grid grid-cols-1
          sm:grid-cols-2
          gap-4
        "
        >
          <termForm.AppField name="version">
            {(field) => (
              <field.Input
                label={t('termsManagement.fields.version')}
                placeholder={t('termsManagement.placeholders.version')}
                required
              />
            )}
          </termForm.AppField>
          <termForm.AppField name="publishedAt">
            {(field) => (
              <field.DatetimePicker
                label={t('termsManagement.fields.publishedAt')}
                placeholder={t('termsManagement.placeholders.publishedAt')}
              />
            )}
          </termForm.AppField>
        </div>

        <termForm.AppField name="content">
          {(field) => (
            <field.Textarea
              label={t('termsManagement.fields.content')}
              placeholder={t('termsManagement.placeholders.content')}
              rows={8}
              required
            />
          )}
        </termForm.AppField>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
            {t('app.dialog.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? t('termsManagement.processing') : t('termsManagement.save')}
          </Button>
        </DialogFooter>
      </FormLayout>
    </termForm.AppForm>
  );
}
