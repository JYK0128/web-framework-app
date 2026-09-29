import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { getCustomersControllerGetCustomerV1QueryKey, getCustomersControllerListCustomersV1QueryKey, useCustomersControllerUpdateCustomerRoleV1 } from '#/.generated/api/endpoints/customers/customers';
import { useMembershipsControllerListV1 } from '#/.generated/api/endpoints/memberships/memberships';
import type { AdminCustomerItem } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

type CustomerRoleModalProps = ModalComponentProps<boolean> & {
  customer: AdminCustomerItem
  onChanged?: () => void
};

export function CustomerRoleModal({ customer, open, onOpenChange, close, onChanged }: CustomerRoleModalProps) {
  const queryClient = useQueryClient();
  const mutation = useCustomersControllerUpdateCustomerRoleV1();
  const membershipsQuery = useMembershipsControllerListV1();
  const form = useAppForm({
    defaultValues: { role: customer.roleCode ?? '' },
    validators: { onSubmit: z.object({ role: z.string().trim().min(1, '멤버십 역할을 입력해 주세요.') }) },
    onSubmit: async ({ value }) => {
      if (value.role === customer.roleCode) {
        close?.(false);
        return;
      }
      await mutation.mutateAsync({ id: customer.id, data: { role: value.role } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCustomersControllerGetCustomerV1QueryKey(customer.id) }),
        queryClient.invalidateQueries({ queryKey: getCustomersControllerListCustomersV1QueryKey() }),
      ]);
      onChanged?.();
      close?.(true);
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !mutation.isPending) close?.(false);
      }}
    >
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>멤버십 변경</Modal.Title>
          <Modal.Description>
            {customer.name}
            {' '}
            고객에게 적용할 멤버십을 선택합니다.
          </Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-4 py-2"
          >
            <form.AppField name="role">
              {(field) => (
                <field.Select
                  label="멤버십"
                  placeholder="멤버십을 선택하세요"
                  options={(membershipsQuery.data?.data.items ?? []).map((membership) => ({ label: `${membership.label || membership.code} (${membership.code})`, value: membership.code }))}
                  disabled={membershipsQuery.isLoading || membershipsQuery.isError || mutation.isPending}
                  required
                />
              )}
            </form.AppField>
            {membershipsQuery.isError && <p className="text-sm text-destructive">멤버십 목록을 불러오지 못했습니다.</p>}
            <Modal.Footer>
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => close?.(false)}>취소</Button>
              <form.Submit disabled={membershipsQuery.isLoading || membershipsQuery.isError || mutation.isPending}>{mutation.isPending ? '저장 중...' : '저장'}</form.Submit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
