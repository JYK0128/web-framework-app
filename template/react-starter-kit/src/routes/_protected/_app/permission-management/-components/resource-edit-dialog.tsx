import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil } from 'lucide-react';
import { useState } from 'react';

import { getResourcesControllerGetResourcesQueryKey, useResourcesControllerUpdateResource } from '#/.generated/api/endpoints/resources/resources';
import type { ResourceDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

export function ResourceEditDialog({ open, onOpenChange, close, resource }: DialogComponentProps<string> & { resource: ResourceDto }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateResourceMutation = useResourcesControllerUpdateResource({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getResourcesControllerGetResourcesQueryKey() });
        close?.(resource.id);
      },
    },
  });

  const form = useAppForm({
    defaultValues: {
      label: resource.label,
      description: resource.description ?? '',
      actions: resource.actions ?? [],
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      try {
        await updateResourceMutation.mutateAsync({
          id: resource.id,
          data: { label: value.label.trim(), description: value.description.trim() || undefined, actions: value.actions },
        });
      }
      catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : '리소스 수정에 실패했습니다.');
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-foreground" />
            리소스 수정
          </DialogTitle>
          <DialogDescription>
            {resource.key}
            {' '}
            리소스의 표시 정보와 허용 작업을 수정합니다.
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <div className="
            rounded-md border border-destructive/30 bg-destructive/10 p-3
            text-xs text-destructive
          "
          >
            {errorMessage}
          </div>
        )}
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-3.5 py-1"
          >
            <form.AppField name="label">{(field) => <field.Input label="리소스 이름" required />}</form.AppField>
            <form.AppField name="description">{(field) => <field.Textarea label="설명 (선택)" rows={2} />}</form.AppField>
            <form.AppField name="actions">
              {(field) => (
                <field.Combobox
                  label="허용 작업"
                  multiple
                  allowCustomValues
                  required
                  options={[...new Set(['create', 'read', 'update', 'delete', 'manage', 'approve', 'publish', 'export', 'import', 'archive', ...(resource.actions ?? [])])].map((action) => ({ label: action, value: action }))}
                />
              )}
            </form.AppField>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => close?.('')} disabled={updateResourceMutation.isPending}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={updateResourceMutation.isPending}>
                {updateResourceMutation.isPending && (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                )}
                저장
              </Button>
            </DialogFooter>
          </FormLayout>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
