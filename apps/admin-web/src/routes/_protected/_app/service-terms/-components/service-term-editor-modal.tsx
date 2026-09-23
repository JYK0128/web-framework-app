import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { getServiceTermsControllerListV1QueryKey, useServiceTermsControllerCreateV1, useServiceTermsControllerUpdateV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { AdminServiceTermGroupItemDto, AdminServiceTermItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type ServiceTermEditorModalProps = ModalComponentProps<boolean> & { term?: AdminServiceTermItemDto; group: AdminServiceTermGroupItemDto };

export function ServiceTermEditorModal({ term, group, open, onOpenChange, close }: ServiceTermEditorModalProps) {
  const queryClient = useQueryClient(); const create = useServiceTermsControllerCreateV1(); const update = useServiceTermsControllerUpdateV1(); const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: { version: term?.version ?? '', content: term?.content ?? '' },
    validators: { onSubmit: z.object({ version: z.string().trim().min(1, '버전을 입력해 주세요.'), content: z.string().trim().min(1, '약관 내용을 입력해 주세요.') }) },
    onSubmit: async ({ value }) => { const data = { code: group.code, title: group.title, version: value.version.trim(), content: value.content.trim(), isRequired: group.isRequired, sortOrder: group.sortOrder }; if (term) await update.mutateAsync({ id: term.id, data }); else await create.mutateAsync({ data }); await queryClient.invalidateQueries({ queryKey: getServiceTermsControllerListV1QueryKey() }); close?.(true); },
  });
  return (
    <Modal open={open} onOpenChange={(nextOpen) => { onOpenChange?.(nextOpen); if (!nextOpen && !pending) close?.(false); }}>
      <Modal.Content size="xl" className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-3xl">
        <Modal.Header>
          <Modal.Title>{term ? '약관 버전 수정' : '약관 버전 추가'}</Modal.Title>
          <Modal.Description>{group.title} 그룹의 약관 버전을 작성합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <FormLayout id="service-term-editor-form" onSubmit={() => void form.handleSubmit()} className="grid gap-4 py-2 pr-1">
              <form.AppField name="version">{(field) => <field.Input label="버전" placeholder="예: 1.1" required />}</form.AppField>
              <form.AppField name="content">{(field) => <field.Textarea label="약관 내용" rows={12} required />}</form.AppField>
            </FormLayout>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" disabled={pending} onClick={() => close?.(false)}>취소</Button>
            <form.Submit form="service-term-editor-form" disabled={pending}>{pending ? '저장 중...' : '저장'}</form.Submit>
          </Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
