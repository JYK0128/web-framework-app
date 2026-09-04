import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil } from 'lucide-react';
import { useState } from 'react';

import { getRolesControllerGetRolesQueryKey, useRolesControllerUpdateRolePermissions } from '#/.generated/api/endpoints/roles/roles';
import type { RoleDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/app';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

export function RoleEditDialog({ open, onOpenChange, close, role }: DialogComponentProps<string> & { role: RoleDto }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateRoleMutation = useRolesControllerUpdateRolePermissions({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getRolesControllerGetRolesQueryKey() });
        close?.(role.id);
      },
    },
  });

  const form = useAppForm({
    defaultValues: { label: role.label ?? '', description: role.description ?? '' },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      try {
        await updateRoleMutation.mutateAsync({
          id: role.id,
          data: { label: value.label.trim(), description: value.description.trim() || undefined },
        });
      }
      catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : '역할 수정에 실패했습니다.');
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="size-5 text-foreground" />역할 수정</DialogTitle>
          <DialogDescription>{role.key} 역할의 이름과 설명을 수정합니다.</DialogDescription>
        </DialogHeader>
        {errorMessage && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{errorMessage}</div>}
        <form.AppForm>
          <FormLayout onSubmit={() => void form.handleSubmit()} className="grid gap-3.5 py-1">
            <form.AppField name="label">{(field) => <field.Input label="역할 이름" required />}</form.AppField>
            <form.AppField name="description">{(field) => <field.Textarea label="역할 설명 (선택)" rows={2} />}</form.AppField>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => close?.('')} disabled={updateRoleMutation.isPending}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={updateRoleMutation.isPending}>{updateRoleMutation.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}저장</Button>
            </DialogFooter>
          </FormLayout>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
