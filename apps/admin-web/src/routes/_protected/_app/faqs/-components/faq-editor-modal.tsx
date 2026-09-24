import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { getFaqsControllerListFaqsV1QueryKey, useFaqsControllerCreateFaqV1, useFaqsControllerUpdateFaqV1 } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type FaqEditorModalProps = ModalComponentProps<boolean> & { faq?: FaqItemDto };

const categoryOptions = [{ label: '계정', value: '계정' }, { label: '서비스 이용', value: '서비스 이용' }, { label: '검증', value: '검증' }] as const;

export function FaqEditorModal({ faq, open, onOpenChange, close }: FaqEditorModalProps) {
  const queryClient = useQueryClient();
  const create = useFaqsControllerCreateFaqV1();
  const update = useFaqsControllerUpdateFaqV1();
  const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: {
      category: faq?.category ?? '', question: faq?.question ?? '', answer: faq?.answer ?? '', sortOrder: faq?.sortOrder ?? 0, isPublished: faq?.isPublished ?? true,
    },
    validators: { onSubmit: z.object({
      category: z.enum(['계정', '서비스 이용', '검증']), question: z.string().trim().min(1, '질문을 입력해 주세요.'), answer: z.string().trim().min(1, '답변을 입력해 주세요.'), sortOrder: z.number().int().min(0), isPublished: z.boolean(),
    }) },
    onSubmit: async ({ value }) => {
      const data = { category: value.category.trim(), question: value.question.trim(), answer: value.answer.trim(), sortOrder: value.sortOrder, isPublished: value.isPublished };
      if (faq) await update.mutateAsync({ id: faq.id, data });
      else await create.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getFaqsControllerListFaqsV1QueryKey() });
      close?.(true);
    },
  });

  return (
    <Modal open={open} onOpenChange={(nextOpen) => { onOpenChange?.(nextOpen); if (!nextOpen && !pending) close?.(false); }}>
      <Modal.Content size="xl" className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-3xl">
        <Modal.Header><Modal.Title>{faq ? 'FAQ 수정' : 'FAQ 추가'}</Modal.Title><Modal.Description>서비스에 노출할 FAQ의 내용을 관리합니다.</Modal.Description></Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <FormLayout id="faq-editor-form" onSubmit={() => void form.handleSubmit()} className="grid gap-5 py-2 pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <form.AppField name="category">{(field) => <field.Select label="카테고리" options={categoryOptions} placeholder="카테고리를 선택해 주세요" required />}</form.AppField>
                <form.AppField name="sortOrder">{(field) => <field.Input type="number" label="정렬 순서" placeholder="정렬 순서를 입력해 주세요." min={0} />}</form.AppField>
              </div>
              <form.AppField name="question">{(field) => <field.Input label="질문" placeholder="자주 묻는 질문을 입력해 주세요." required />}</form.AppField>
              <form.AppField name="answer">{(field) => <field.Textarea label="답변" rows={8} placeholder="질문에 대한 답변을 입력해 주세요." required />}</form.AppField>
              <div className="rounded-lg border bg-muted/20 p-3">
                <form.AppField name="isPublished">
                  {(field) => <field.Checkbox label="게시 상태" description="게시 상태로 설정하면 사용자에게 FAQ가 노출됩니다." showError={false} />}
                </form.AppField>
              </div>
            </FormLayout>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" disabled={pending} onClick={() => close?.(false)}>취소</Button>
            <form.Submit form="faq-editor-form" disabled={pending}>{pending ? '저장 중...' : '저장'}</form.Submit>
          </Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
