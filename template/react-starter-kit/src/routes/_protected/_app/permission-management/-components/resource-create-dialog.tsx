import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';

import { getResourcesControllerGetResourcesQueryKey, useResourcesControllerCreateResource } from '#/.generated/api/endpoints/resources/resources';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

export function ResourceCreateDialog({ open, onOpenChange, close }: DialogComponentProps<string>) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createResourceMutation = useResourcesControllerCreateResource({
    mutation: {
      onSuccess: (resource) => {
        void queryClient.invalidateQueries({ queryKey: getResourcesControllerGetResourcesQueryKey() });
        close?.(resource?.id ?? '');
      },
    },
  });

  const form = useAppForm({
    defaultValues: {
      key: '',
      label: '',
      description: '',
      actions: ['read'],
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      try {
        await createResourceMutation.mutateAsync({
          data: {
            key: value.key.trim().toLowerCase(),
            label: value.label.trim(),
            description: value.description.trim() || undefined,
            actions: value.actions,
          },
        });
      }
      catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : '리소스 생성에 실패했습니다.');
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-foreground" />
            <span>새 리소스 추가</span>
          </DialogTitle>
          <DialogDescription>역할에 부여할 시스템 기능 리소스를 등록합니다.</DialogDescription>
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
            <form.AppField name="key">
              {(field) => <field.Input label="리소스 코드 (Key)" required placeholder="예: reports" description="영문 소문자, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능" />}
            </form.AppField>
            <form.AppField name="label">
              {(field) => <field.Input label="리소스 이름" required placeholder="예: 리포트" />}
            </form.AppField>
            <form.AppField name="description">
              {(field) => <field.Textarea label="설명 (선택)" rows={2} placeholder="리소스의 기능 설명" />}
            </form.AppField>
            <form.AppField name="actions">
              {(field) => (
                <field.Combobox
                  label="허용 작업"
                  multiple
                  allowCustomValues
                  required
                  options={['create', 'read', 'update', 'delete', 'manage', 'approve', 'publish', 'export', 'import', 'archive'].map((action) => ({ label: action, value: action }))}
                />
              )}
            </form.AppField>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => close?.('')} disabled={createResourceMutation.isPending}>{t('app.dialog.cancel')}</Button>
              <Button type="submit" disabled={createResourceMutation.isPending}>
                {createResourceMutation.isPending && (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                )}
                리소스 생성
              </Button>
            </DialogFooter>
          </FormLayout>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
