import { useQueryClient } from '@tanstack/react-query';
import { Copy, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';

import { getRolesControllerGetRolesQueryKey, useRolesControllerCreateRole } from '#/.generated/api/endpoints/roles/roles';
import type { RoleDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/app';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

type RoleCreateDialogProps = DialogComponentProps<string> & {
  existingRoles: RoleDto[]
  copyFromRole?: RoleDto | null
};

export function RoleCreateDialog({
  open,
  onOpenChange,
  close,
  existingRoles,
  copyFromRole,
}: RoleCreateDialogProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createRoleMutation = useRolesControllerCreateRole({
    mutation: {
      onSuccess: (res) => {
        void queryClient.invalidateQueries({
          queryKey: getRolesControllerGetRolesQueryKey(),
        });
        if (res?.id) {
          close?.(res.id);
        }
        else {
          close?.('');
        }
      },
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: copyFromRole ? `${copyFromRole.name}-copy` : '',
      label: copyFromRole ? `${copyFromRole.label || copyFromRole.name} (복사본)` : '',
      description: copyFromRole ? copyFromRole.description || '' : '',
      copyFromRoleId: copyFromRole?.id || '',
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      try {
        await createRoleMutation.mutateAsync({
          data: {
            name: value.name.trim().toLowerCase(),
            label: value.label.trim(),
            description: value.description?.trim() || undefined,
            copyFromRoleId: value.copyFromRoleId || undefined,
          },
        });
      }
      catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '역할 생성에 실패했습니다.';
        setErrorMessage(msg);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {copyFromRole
              ? (
                <>
                  <Copy className="size-5 text-primary" />
                  <span>역할 복제하기</span>
                </>
              )
              : (
                <>
                  <Plus className="size-5 text-primary" />
                  <span>새 역할 만들기</span>
                </>
              )}
          </DialogTitle>
          <DialogDescription>
            시스템 리소스 권한을 부여할 새로운 직무/역할을 정의합니다.
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
            <form.AppField name="name">
              {(field) => (
                <field.Input
                  label="역할 식별 코드 (Slug)"
                  required
                  placeholder="예: manager, editor, auditor"
                  description="영문 소문자, 숫자, 하이픈(-)만 사용 가능"
                />
              )}
            </form.AppField>

            <form.AppField name="label">
              {(field) => (
                <field.Input
                  label="역할 이름 (Label)"
                  required
                  placeholder="예: 운영 매니저, 콘텐츠 에디터"
                  description="화면에 표시될 직관적인 역할 이름"
                />
              )}
            </form.AppField>

            <form.AppField name="description">
              {(field) => (
                <field.Textarea
                  label="역할 설명 (선택)"
                  rows={2}
                  placeholder="해당 역할의 업무 범위 및 목적 설명"
                />
              )}
            </form.AppField>

            <form.AppField name="copyFromRoleId">
              {(field) => (
                <field.Select
                  label="초기 권한 복제 대상 (선택)"
                  placeholder="기존 역할 권한 복제 안 함 (빈 상태로 시작)"
                  options={[
                    { label: '권한 복제 안 함 (직접 설정)', value: '' },
                    ...existingRoles.map((r) => ({
                      label: `${r.label || r.name} (${r.name})`,
                      value: r.id,
                    })),
                  ]}
                />
              )}
            </form.AppField>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => close?.('')}
                disabled={createRoleMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createRoleMutation.isPending}>
                {createRoleMutation.isPending && (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                )}
                {copyFromRole ? '복제하여 생성' : '역할 생성'}
              </Button>
            </DialogFooter>
          </FormLayout>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
