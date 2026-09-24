import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { getServiceTermsControllerListV1QueryKey, useServiceTermsControllerCreateV1, useServiceTermsControllerUpdateV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { AdminServiceTermGroupItemDto, AdminServiceTermItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';
import { publishScheduleSchema, toPublishedAt } from '#/components/terms/publish-schedule';

export type ServiceTermEditorModalProps = ModalComponentProps<boolean> & { term?: AdminServiceTermItemDto, group: AdminServiceTermGroupItemDto };

export function ServiceTermEditorModal({ term, group, open, onOpenChange, close }: ServiceTermEditorModalProps) {
  const queryClient = useQueryClient();
  const create = useServiceTermsControllerCreateV1();
  const update = useServiceTermsControllerUpdateV1();
  const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: { version: term?.version ?? '', publishedAt: term?.publishedAt ?? '', isNoticeRequired: term?.isNoticeRequired ?? false, reason: term?.reason ?? '', summary: term?.summary ?? '', content: term?.content ?? '' },
    validators: { onSubmit: z.object({ version: z.string().trim().min(1, '버전을 입력해 주세요.'), publishedAt: publishScheduleSchema, isNoticeRequired: z.boolean(), reason: z.string().trim().min(1, '등록 사유를 입력해 주세요.'), summary: z.string().trim().min(1, '변경 요약을 입력해 주세요.'), content: z.string().trim().min(1, '약관 내용을 입력해 주세요.') }) },
    onSubmit: async ({ value }) => {
      const data = { groupId: group.id, version: value.version.trim(), publishedAt: toPublishedAt(value.publishedAt), isNoticeRequired: value.isNoticeRequired, reason: value.reason.trim(), summary: value.summary.trim(), content: value.content.trim() };
      if (term) {
        await update.mutateAsync({ id: term.id, data });
      }
      else {
        await create.mutateAsync({ data });
      }
      await queryClient.invalidateQueries({ queryKey: getServiceTermsControllerListV1QueryKey() });
      close?.(true);
    },
  });
  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !pending) close?.(false);
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
          <Modal.Title>{term ? '약관 버전 수정' : '약관 버전 추가'}</Modal.Title>
          <Modal.Description>
            {group.title}
            {' '}
            그룹의 약관 버전을 작성합니다.
          </Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <FormLayout
              id="service-term-editor-form"
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-4 py-2 pr-1"
            >
              <div className="
                grid gap-4
                sm:grid-cols-2
              "
              >
                <form.AppField name="version">
                  {(field) => <field.Input label="버전" placeholder="예: 1.1" required />}
                </form.AppField>
                <form.AppField name="publishedAt">
                  {(field) => <field.DatetimePicker label="게시 예정일" placeholder="게시 예정일을 선택해 주세요" emptyValue="" />}
                </form.AppField>
              </div>
              <section className="grid gap-4 border-t pt-4">
                <h3 className="text-sm font-semibold">변경 내용</h3>
                <form.AppField name="reason">
                  {(field) => <field.Input label="등록 사유" placeholder="등록 사유를 입력해 주세요." required />}
                </form.AppField>
                <form.AppField name="summary">
                  {(field) => <field.Textarea label="변경 요약" placeholder="변경 내용을 요약해 주세요." rows={3} required />}
                </form.AppField>
                <form.AppField name="content">
                  {(field) => <field.Textarea label="본문" rows={12} placeholder="약관 내용을 입력해 주세요." required />}
                </form.AppField>
              </section>
              <div className="rounded-lg border bg-muted/20 p-4">
                <form.AppField name="isNoticeRequired">
                  {(field) => <field.Checkbox label="약관 고지" description="이 버전을 고지 대상으로 표시합니다." showError={false} />}
                </form.AppField>
              </div>
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
