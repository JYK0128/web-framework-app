import { z } from '@pkg/shared/common';
import { useEffect } from 'react';

import { useCustomersControllerGetCustomerV1, useCustomersControllerUpdateCustomerMemoV1 } from '#/.generated/api/endpoints/customers/customers';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

type CustomerMemoModalProps = ModalComponentProps<void> & { customerId: string, canUpdate: boolean };

export function CustomerMemoModal({ customerId, canUpdate, open, onOpenChange, close }: CustomerMemoModalProps) {
  const detailQuery = useCustomersControllerGetCustomerV1(customerId, { query: { enabled: open } });
  const mutation = useCustomersControllerUpdateCustomerMemoV1();
  const form = useAppForm({
    defaultValues: { memo: '' },
    validators: { onSubmit: z.object({ memo: z.string().max(5000) }) },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: customerId, data: { memo: value.memo } });
      close?.();
    },
  });

  useEffect(() => {
    form.reset({ memo: detailQuery.data?.data.memo ?? '' });
  }, [detailQuery.data?.data.memo, form]);

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !mutation.isPending) close?.();
      }}
    >
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>운영 메모</Modal.Title>
          <Modal.Description>고객에게 공개되지 않는 내부 메모를 관리합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-4 py-2"
          >
            <form.AppField name="memo">
              {(field) => (
                <field.Textarea
                  label="메모"
                  placeholder="운영 메모를 입력하세요."
                  className="h-40 overflow-y-auto"
                  disabled={!canUpdate || detailQuery.isLoading || mutation.isPending}
                />
              )}
            </form.AppField>
            <Modal.Footer>
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => close?.()}>취소</Button>
              <form.Submit disabled={!canUpdate || detailQuery.isLoading || mutation.isPending}>{mutation.isPending ? '저장 중...' : '저장'}</form.Submit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
