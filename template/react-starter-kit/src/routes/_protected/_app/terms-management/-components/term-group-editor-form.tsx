import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getTermsControllerGetAdminTermGroupsQueryKey, useTermsControllerCreateTermGroup, useTermsControllerUpdateTermGroup } from '#/.generated/api/endpoints/terms/terms';
import type { TermGroupItemDto } from '#/.generated/api/model';
import { Button, DialogFooter } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

export function TermGroupEditorForm({
  group = null,
  onSuccess,
  onCancel,
}: {
  group?: TermGroupItemDto | null
  onSuccess: (id: string) => void
  onCancel: () => void
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const createMutation = useTermsControllerCreateTermGroup();
  const updateMutation = useTermsControllerUpdateTermGroup();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useAppForm({
    defaultValues: {
      code: group?.code ?? '',
      title: group?.title ?? '',
      isRequired: group?.isRequired ?? true,
      sortOrder: group?.sortOrder ?? 0,
    },
    onSubmit: async ({ value }) => {
      const payload = {
        code: value.code.trim(),
        title: value.title.trim(),
        isRequired: value.isRequired,
        sortOrder: Math.max(0, Math.trunc(Number(value.sortOrder) || 0)),
      };

      try {
        let id: string;
        if (group) {
          await updateMutation.mutateAsync({ id: group.id, data: payload });
          id = group.id;
        }
        else {
          const result = await createMutation.mutateAsync({ data: payload });
          id = result.id;
        }
        await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermGroupsQueryKey() });
        toast.success(group ? t('termsManagement.editGroupSuccess') : t('termsManagement.createGroupSuccess'));
        onSuccess(id);
      }
      catch {
        toast.error(t('termsManagement.error'));
      }
    },
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="grid gap-4"
      >
        <div className="
          flex justify-end
          *:data-[slot=field]:w-fit
        "
        >
          <form.AppField name="isRequired">
            {(field) => <field.Switch label={t('termsManagement.fields.isRequired')} orientation="horizontal" showError={false} />}
          </form.AppField>
        </div>
        <form.AppField name="title">
          {(field) => <field.Input label={t('termsManagement.fields.groupTitle')} placeholder={t('termsManagement.placeholders.groupTitle')} required />}
        </form.AppField>
        <div className="
          grid grid-cols-1
          sm:grid-cols-2
          gap-4
        "
        >
          <form.AppField name="code">
            {(field) => <field.Input label={t('termsManagement.fields.groupCode')} placeholder={t('termsManagement.placeholders.groupCode')} required />}
          </form.AppField>
          <form.AppField name="sortOrder">
            {(field) => <field.Input type="number" label={t('termsManagement.fields.sortOrder')} />}
          </form.AppField>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>{t('app.dialog.cancel')}</Button>
          <Button type="submit" disabled={isPending}>{isPending ? t('termsManagement.processing') : t('termsManagement.save')}</Button>
        </DialogFooter>
      </FormLayout>
    </form.AppForm>
  );
}
