import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { getTermsControllerGetAdminTermGroupsQueryKey, useTermsControllerCreateTermGroup, useTermsControllerUpdateTermGroup } from '#/.generated/api/endpoints/terms/terms';
import type { TermGroupItemDto } from '#/.generated/api/model';
import { Button, DialogFooter } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

type TermGroupFormState = { code: string, title: string, isRequired: boolean, sortOrder: number };

function emptyForm(): TermGroupFormState {
  return { code: '', title: '', isRequired: true, sortOrder: 0 };
}

function formFromGroup(group: TermGroupItemDto): TermGroupFormState {
  return { code: group.code, title: group.title, isRequired: group.isRequired, sortOrder: group.sortOrder };
}

export function TermGroupEditorForm({
  group = null,
  onSuccess,
  onSaved,
}: {
  group?: TermGroupItemDto | null
  onSuccess: () => void
  onSaved?: (id: string) => void
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const createMutation = useTermsControllerCreateTermGroup();
  const updateMutation = useTermsControllerUpdateTermGroup();
  const [isSaving, setIsSaving] = useState(false);

  const form = useAppForm({
    defaultValues: group ? formFromGroup(group) : emptyForm(),
    onSubmit: async ({ value }) => {
      const payload = { code: value.code.trim(), title: value.title.trim(), isRequired: value.isRequired, sortOrder: Math.max(0, Math.trunc(Number(value.sortOrder) || 0)) };
      setIsSaving(true);
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
        onSaved?.(id);
        await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermGroupsQueryKey() });
        toast.success(group ? t('terms.editGroupSuccess') : t('terms.createGroupSuccess'));
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
    <form.AppForm>
      <FormLayout onSubmit={() => void form.handleSubmit()} className="grid">
        <div className="
          flex justify-end
          *:data-[slot=field]:w-fit
        "
        >
          <form.AppField name="isRequired">
            {(field) => <field.Switch label={t('terms.fields.isRequired')} orientation="horizontal" showError={false} />}
          </form.AppField>
        </div>
        <form.AppField name="title">
          {(field) => <field.Input label={t('terms.fields.groupTitle')} placeholder={t('terms.placeholders.groupTitle')} required />}
        </form.AppField>
        <div className="grid grid-cols-1 gap-1">
          <form.AppField name="code">
            {(field) => <field.Input label={t('terms.fields.groupCode')} placeholder={t('terms.placeholders.groupCode')} required />}
          </form.AppField>
          <form.AppField name="sortOrder">
            {(field) => <field.Input type="number" label={t('terms.fields.sortOrder')} />}
          </form.AppField>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? t('common.processing') : t('common.save')}</Button>
        </DialogFooter>
      </FormLayout>
    </form.AppForm>
  );
}
