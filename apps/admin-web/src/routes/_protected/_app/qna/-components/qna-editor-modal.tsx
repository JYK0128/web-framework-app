import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { getQnaControllerListV1QueryKey, useQnaControllerUpdateV1 } from '#/.generated/api/endpoints/qna/qna';
import type { QnaItem } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type QnaEditorModalProps = ModalComponentProps<boolean> & { qna: QnaItem };

function answerText(answer: QnaItem['answer']): string {
  if (answer === null || answer === undefined) return '';
  return typeof answer === 'string' ? answer : JSON.stringify(answer);
}

export function QnaEditorModal({ qna, open, onOpenChange, close }: QnaEditorModalProps) {
  const queryClient = useQueryClient();
  const update = useQnaControllerUpdateV1();
  const form = useAppForm({
    defaultValues: {
      status: qna.status,
      priority: qna.priority,
      answer: answerText(qna.answer),
    },
    validators: {
      onSubmit: z.object({
        status: z.enum(['open', 'in_progress', 'answered', 'closed']),
        priority: z.enum(['low', 'normal', 'high', 'urgent']),
        answer: z.string(),
      }),
    },
    onSubmit: async ({ value }) => {
      const { answer, ...fields } = value;
      await update.mutateAsync({
        id: qna.id,
        data: { ...fields, ...(answer.trim() || (qna.answer !== null && qna.answer !== undefined) ? { answer } : {}) },
      });
      await queryClient.invalidateQueries({ queryKey: getQnaControllerListV1QueryKey() });
      close?.(true);
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !update.isPending) close?.(false);
      }}
    >
      <Modal.Content
        size="xl"
        className="
          max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]
          sm:max-w-3xl
        "
      >
        <Modal.Header>
          <Modal.Title>Q&A 답변</Modal.Title>
          <Modal.Description>문의 내용을 확인하고 답변을 작성합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <div className="grid gap-5 py-2 pr-1">
              <section className="grid gap-4 rounded-lg border bg-muted/20 p-4">
                <div className="
                  flex flex-wrap items-center justify-between gap-2 border-b
                  pb-3
                "
                >
                  <h3 className="text-sm font-semibold">문의 내역</h3>
                  <span className="text-xs text-muted-foreground">{qna.userEmailMasked || qna.userId}</span>
                </div>
                <div className="grid gap-3">
                  <h4 className="
                    text-base font-semibold wrap-break-word text-foreground
                  "
                  >
                    {qna.title}
                  </h4>
                  <p className="
                    text-sm/6 whitespace-pre-wrap wrap-break-word
                    text-foreground
                  "
                  >
                    {qna.content}
                  </p>
                </div>
              </section>
              <FormLayout
                id="qna-editor-form"
                onSubmit={() => void form.handleSubmit()}
                className="grid gap-4"
              >
                <div className="
                  grid grid-cols-1 gap-4
                  sm:grid-cols-2
                "
                >
                  <form.AppField name="status">{(field) => <field.Select label="상태" placeholder="상태를 선택해 주세요" options={[{ label: '접수', value: 'open' }, { label: '처리 중', value: 'in_progress' }, { label: '답변 완료', value: 'answered' }, { label: '종료', value: 'closed' }]} />}</form.AppField>
                  <form.AppField name="priority">{(field) => <field.Select label="우선순위" placeholder="우선순위를 선택해 주세요" options={[{ label: '낮음', value: 'low' }, { label: '보통', value: 'normal' }, { label: '높음', value: 'high' }, { label: '긴급', value: 'urgent' }]} />}</form.AppField>
                </div>
                <form.AppField name="answer">{(field) => <field.Textarea label="답변" rows={8} placeholder="고객에게 전달할 답변을 입력해 주세요." />}</form.AppField>
              </FormLayout>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" disabled={update.isPending} onClick={() => close?.(false)}>취소</Button>
            <form.Submit form="qna-editor-form" disabled={update.isPending}>{update.isPending ? '저장 중...' : '저장'}</form.Submit>
          </Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
