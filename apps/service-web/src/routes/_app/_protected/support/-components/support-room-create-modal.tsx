import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { getSupportControllerListRoomsV1QueryKey, useSupportControllerCreateRoomV1 } from '#/.generated/api/endpoints/support/support';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type SupportRoomCreateModalProps = ModalComponentProps<boolean> & { onCreated?: () => void | Promise<void> };

export function SupportRoomCreateModal({ open, onOpenChange, close, onCreated }: SupportRoomCreateModalProps) {
  const queryClient = useQueryClient();
  const create = useSupportControllerCreateRoomV1();
  const form = useAppForm({
    defaultValues: { title: '', content: '' },
    validators: { onSubmit: z.object({ title: z.string().trim().min(1, '상담 제목을 입력해 주세요.'), content: z.string().trim().min(1, '메시지를 입력해 주세요.') }) },
    onSubmit: async ({ value }) => {
      await create.mutateAsync({ data: { title: value.title.trim(), content: value.content.trim() } });
      await queryClient.invalidateQueries({ queryKey: getSupportControllerListRoomsV1QueryKey() });
      await onCreated?.();
      close?.(true);
    },
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content>
        <Modal.Header><Modal.Title>새 상담 시작</Modal.Title><Modal.Description>궁금한 점을 남기면 챗봇 또는 상담원이 도와드립니다.</Modal.Description></Modal.Header>
        <form.AppForm>
          <Modal.Body><FormLayout id="support-room-create-form" onSubmit={() => void form.handleSubmit()} className="grid gap-4 py-2">
            <form.AppField name="title">{(field) => <field.Input label="상담 제목" placeholder="상담 제목을 입력해 주세요." required />}</form.AppField>
            <form.AppField name="content">{(field) => <field.Textarea label="메시지" placeholder="무엇을 도와드릴까요?" rows={7} required />}</form.AppField>
          </FormLayout></Modal.Body>
          <Modal.Footer><Button type="button" variant="outline" disabled={create.isPending} onClick={() => close?.(false)}>취소</Button><form.Submit form="support-room-create-form" disabled={create.isPending}>{create.isPending ? '시작 중...' : '상담 시작'}</form.Submit></Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
