import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { getServiceTermsControllerGroupsV1QueryKey, useServiceTermsControllerCreateGroupV1, useServiceTermsControllerUpdateGroupV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { ServiceTermGroupItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type ServiceTermGroupEditorModalProps = ModalComponentProps<string> & { group?: ServiceTermGroupItemDto };

export function ServiceTermGroupEditorModal({ group, open, onOpenChange, close }: ServiceTermGroupEditorModalProps) {
  const queryClient = useQueryClient();
  const create = useServiceTermsControllerCreateGroupV1();
  const update = useServiceTermsControllerUpdateGroupV1();
  const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: { title: group?.title ?? '', isRequired: group?.isRequired ?? true, sortOrder: group?.sortOrder ?? 0 },
    validators: { onSubmit: z.object({ title: z.string().trim().min(1, '약관 그룹 이름을 입력해 주세요.'), isRequired: z.boolean(), sortOrder: z.number().int().min(0) }) },
    onSubmit: async ({ value }) => {
      const data = { title: value.title.trim(), isRequired: value.isRequired, sortOrder: value.sortOrder };
      const saved = group ? await update.mutateAsync({ id: group.id, data }) : await create.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getServiceTermsControllerGroupsV1QueryKey() });
      close?.(saved.data.id);
    },
  });
  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !pending) close?.();
      }}
    >
      <Modal.Content
        size="lg"
        className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]"
      >
        <Modal.Header>
          <Modal.Title>{group ? '서비스 약관 그룹 수정' : '서비스 약관 그룹 생성'}</Modal.Title>
          <Modal.Description>서비스 약관의 종류와 필수 동의 여부를 설정합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <FormLayout
              id="service-term-group-form"
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-5 py-2 pr-1"
            >
              <div className="
                grid grid-cols-1 gap-4
                sm:grid-cols-[minmax(0,1fr)_8rem]
              "
              >
                <form.AppField name="title">{(field) => <field.Input label="그룹 이름" placeholder="예: 개인정보 처리방침" required />}</form.AppField>
                <form.AppField name="sortOrder">{(field) => <field.Input type="number" label="정렬 순서" placeholder="정렬 순서를 입력해 주세요." />}</form.AppField>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <form.AppField name="isRequired">
                  {(field) => <field.Checkbox label="필수 동의 약관" description="고객이 서비스 이용 전 반드시 동의해야 하는 약관입니다." showError={false} />}
                </form.AppField>
              </div>
            </FormLayout>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" disabled={pending} onClick={() => close?.()}>취소</Button>
            <form.Submit form="service-term-group-form" disabled={pending}>{pending ? '저장 중...' : '저장'}</form.Submit>
          </Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
