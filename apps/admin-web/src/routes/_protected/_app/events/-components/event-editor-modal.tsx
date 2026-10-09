import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';
import { createEvent, type EventInput, type EventItem, eventKeys, updateEvent } from '#/features/events/events.api';

export type EventEditorModalProps = ModalComponentProps<boolean> & { event?: EventItem, readOnly?: boolean };
const statusOptions = [{ label: '임시저장', value: 'draft' }, { label: '게시', value: 'published' }] as const;
const asLocal = (date?: string) => {
  if (!date) return '';
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
};

export function EventEditorModal({ event, readOnly = false, open, onOpenChange, close }: EventEditorModalProps) {
  const queryClient = useQueryClient();
  const form = useAppForm({
    defaultValues: { title: event?.title ?? '', content: event?.content ?? '', startsAt: asLocal(event?.startsAt), endsAt: asLocal(event?.endsAt), imageUrl: event?.imageUrl ?? '', linkUrl: event?.linkUrl ?? '', status: event?.status ?? 'draft' as const },
    validators: { onSubmit: z.object({ title: z.string().trim().min(1, '제목을 입력해 주세요.').max(255), content: z.string().trim().min(1, '내용을 입력해 주세요.'), startsAt: z.string().min(1, '시작일을 입력해 주세요.'), endsAt: z.string().min(1, '종료일을 입력해 주세요.'), imageUrl: z.string(), linkUrl: z.string(), status: z.enum(['draft', 'published']) }).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), { path: ['endsAt'], message: '종료일은 시작일 이후여야 합니다.' }) },
    onSubmit: async ({ value }) => {
      const data: EventInput = { title: value.title.trim(), content: value.content.trim(), startsAt: new Date(value.startsAt).toISOString(), endsAt: new Date(value.endsAt).toISOString(), imageUrl: value.imageUrl.trim() || null, linkUrl: value.linkUrl.trim() || null, status: value.status };
      if (event) await updateEvent(event.id, data);
      else await createEvent(data);
      await queryClient.invalidateQueries({ queryKey: eventKeys.all });
      close?.(true);
    },
  });
  const title = getEditorTitle(readOnly, Boolean(event));
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange?.(next);
        if (!next) close?.(false);
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
          <Modal.Title>{title}</Modal.Title>
          <Modal.Description>이벤트 일정과 서비스에 표시할 이미지를 설정합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <FormLayout
              id="event-editor-form"
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-5 py-2 pr-1"
            >
              <form.AppField name="title">{(field) => <field.Input label="제목" placeholder="이벤트 제목" disabled={readOnly} required />}</form.AppField>
              <form.AppField name="content">{(field) => <field.Textarea label="내용" rows={8} placeholder="이벤트 내용을 입력해 주세요." disabled={readOnly} required />}</form.AppField>
              <div className="
                grid gap-4
                sm:grid-cols-2
              "
              >
                <form.AppField name="startsAt">{(field) => <field.Input type="datetime-local" label="시작일" disabled={readOnly} required />}</form.AppField>
                <form.AppField name="endsAt">{(field) => <field.Input type="datetime-local" label="종료일" disabled={readOnly} required />}</form.AppField>
              </div>
              <form.AppField name="imageUrl">{(field) => <field.Input label="이미지 URL" placeholder="https://..." disabled={readOnly} />}</form.AppField>
              <form.AppField name="linkUrl">{(field) => <field.Input label="연결 링크" placeholder="https://..." disabled={readOnly} />}</form.AppField>
              <form.AppField name="status">{(field) => <field.Select label="게시 상태" options={statusOptions} disabled={readOnly} required />}</form.AppField>
            </FormLayout>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={() => close?.(false)}>{readOnly ? '닫기' : '취소'}</Button>
            {!readOnly && <form.Submit form="event-editor-form">저장</form.Submit>}
          </Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}

function getEditorTitle(readOnly: boolean, hasEvent: boolean): string {
  if (readOnly) return '이벤트 상세';
  if (hasEvent) return '이벤트 수정';
  return '이벤트 등록';
}
