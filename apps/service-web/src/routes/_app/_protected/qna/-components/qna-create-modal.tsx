import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useQnaControllerCreateV1 } from '#/.generated/api/endpoints/qna/qna';
import type { CreateQnaRequestDtoCategory } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

const categoryOptions = [{ label: '계정', value: '계정' }, { label: '서비스 이용', value: '서비스 이용' }, { label: '검증', value: '검증' }] as const;

export type QnaCreateModalProps = ModalComponentProps<boolean>;

export function QnaCreateModal({ open, onOpenChange, close }: QnaCreateModalProps) {
  const queryClient = useQueryClient();
  const create = useQnaControllerCreateV1();
  const form = useAppForm({
    defaultValues: { category: '', title: '', content: '' },
    validators: {
      onSubmit: z.object({
        category: z.enum(['계정', '서비스 이용', '검증']),
        title: z.string().trim().min(1, '제목을 입력해 주세요.'),
        content: z.string().trim().min(1, '문의 내용을 입력해 주세요.'),
      }),
    },
    onSubmit: async ({ value }) => {
      await create.mutateAsync({ data: { category: value.category as CreateQnaRequestDtoCategory, title: value.title.trim(), content: value.content.trim() } });
      await queryClient.invalidateQueries({ queryKey: ['service-qna-list'] });
      close?.(true);
    },
  });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !create.isPending) close?.(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [close, create.isPending, open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>문의 등록</Modal.Title>
          <Modal.Description>궁금한 점이나 도움이 필요한 내용을 남겨 주세요.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y max-h-[calc(100vh-12rem)]">
            <FormLayout
              id="qna-create-form"
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-4 py-2"
            >
              <form.AppField name="category">{(field) => <field.Select label="분류" options={categoryOptions} placeholder="분류를 선택해 주세요" required />}</form.AppField>
              <form.AppField name="title">{(field) => <field.Input label="제목" placeholder="문의 제목을 입력해 주세요." required />}</form.AppField>
              <form.AppField name="content">{(field) => <field.Textarea label="문의 내용" rows={7} placeholder="문의 내용을 자세히 입력해 주세요." required />}</form.AppField>
            </FormLayout>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" disabled={create.isPending} onClick={() => close?.(false)}>취소</Button>
            <form.Submit form="qna-create-form" disabled={create.isPending}>{create.isPending ? '등록 중...' : '문의 등록'}</form.Submit>
          </Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
