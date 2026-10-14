import { z } from '@pkg/shared/common';
import { hasEditorContent, toEditorHtml } from '@pkg/shared/editor';
import { useQueryClient } from '@tanstack/react-query';

import { eventsControllerCreateV1, eventsControllerUpdateV1, getEventsControllerListV1QueryKey } from '#/.generated/api/endpoints/events/events';
import type { CreateEventRequestDto, EventItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { EditorViewer } from '#/components/editor';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type EventEditorModalProps = ModalComponentProps<boolean> & { event?: EventItemDto, readOnly?: boolean };

export function EventEditorModal({ event, readOnly = false, open, onOpenChange, close }: EventEditorModalProps) {
  const queryClient = useQueryClient();
  const form = useAppForm({
    defaultValues: { title: event?.title ?? '', content: toEditorHtml(event?.content ?? ''), startsAt: event?.startsAt ?? '', endsAt: event?.endsAt ?? '', publishedAt: event?.publishedAt ?? '' },
    validators: { onSubmit: z.object({ title: z.string().trim().min(1, '제목을 입력해 주세요.').max(255), content: z.string().refine(hasEditorContent, '내용을 입력해 주세요.'), startsAt: z.string().min(1, '시작일을 입력해 주세요.'), endsAt: z.string().min(1, '종료일을 입력해 주세요.'), publishedAt: z.string().refine((value) => value === '' || !Number.isNaN(Date.parse(value)), '게시 일시를 확인해 주세요.') }).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), { path: ['endsAt'], message: '종료일은 시작일 이후여야 합니다.' }) },
    onSubmit: async ({ value }) => {
      const data: CreateEventRequestDto = { title: value.title.trim(), content: value.content.trim(), startsAt: new Date(value.startsAt).toISOString(), endsAt: new Date(value.endsAt).toISOString(), publishedAt: value.publishedAt ? new Date(value.publishedAt).toISOString() : null };
      if (event) await eventsControllerUpdateV1(event.id, data);
      else await eventsControllerCreateV1(data);
      await queryClient.invalidateQueries({ queryKey: getEventsControllerListV1QueryKey() });
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
          <Modal.Description>이벤트 일정과 본문을 작성합니다. 이미지와 링크는 본문에 넣을 수 있습니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <FormLayout
              id="event-editor-form"
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-5 py-2 pr-1"
            >
              <form.AppField name="title">{(field) => <field.Input label="제목" placeholder="이벤트 제목" disabled={readOnly} required />}</form.AppField>
              <div className="
                relative grid gap-4
                sm:grid-cols-2
              "
              >
                <form.AppField name="startsAt">{(field) => <field.DatetimePicker label="시작일" placeholder="시작 일시 선택" disabled={readOnly} required />}</form.AppField>
                <form.AppField name="endsAt">{(field) => <field.DatetimePicker label="종료일" placeholder="종료 일시 선택" disabled={readOnly} required />}</form.AppField>

              </div>
              <form.AppField name="publishedAt">{(field) => <field.DatetimePicker label="게시 일시" placeholder="비워두면 임시저장" description="미래 일시를 선택하면 해당 시각부터 공개됩니다." disabled={readOnly} />}</form.AppField>
              {!readOnly && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => form.setFieldValue('publishedAt', new Date().toISOString())}>지금 게시</Button>
                  <Button type="button" variant="outline" onClick={() => form.setFieldValue('publishedAt', '')}>임시저장</Button>
                </div>
              )}
              <form.AppField name="content">{(field) => readOnly ? <EditorViewer content={field.state.value} /> : <field.Editor label="내용" required />}</form.AppField>
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
