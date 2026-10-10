import { z } from '@pkg/shared/common';
import { hasEditorContent, toEditorHtml } from '@pkg/shared/editor';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '#/.generated/shadcn/components/ui';
import { EditorViewer } from '#/components/editor';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';
import { createNotice, type NoticeInput, type NoticeItem, noticeKeys, updateNotice } from '#/features/notices/notices.api';

export type NoticeEditorModalProps = ModalComponentProps<boolean> & { notice?: NoticeItem, readOnly?: boolean };
const importanceOptions = [{ label: '일반', value: 'normal' }, { label: '중요', value: 'important' }, { label: '긴급', value: 'urgent' }] as const;
const statusOptions = [{ label: '임시저장', value: 'draft' }, { label: '게시', value: 'published' }] as const;

export function NoticeEditorModal({ notice, readOnly = false, open, onOpenChange, close }: NoticeEditorModalProps) {
  const queryClient = useQueryClient();
  const form = useAppForm({
    defaultValues: { title: notice?.title ?? '', content: toEditorHtml(notice?.content ?? ''), importance: notice?.importance ?? 'normal', isPinned: notice?.isPinned ?? false, status: notice?.status ?? 'draft' as const },
    validators: { onSubmit: z.object({ title: z.string().trim().min(1, '제목을 입력해 주세요.').max(255), content: z.string().refine(hasEditorContent, '내용을 입력해 주세요.'), importance: z.enum(['normal', 'important', 'urgent']), isPinned: z.boolean(), status: z.enum(['draft', 'published']) }) },
    onSubmit: async ({ value }) => {
      const data: NoticeInput = { title: value.title.trim(), content: value.content.trim(), importance: value.importance, isPinned: value.isPinned, status: value.status };
      if (notice) await updateNotice(notice.id, data);
      else await createNotice(data);
      await queryClient.invalidateQueries({ queryKey: noticeKeys.all });
      close?.(true);
    },
  });
  const title = getEditorTitle(readOnly, Boolean(notice));
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
          <Modal.Description>긴급도와 상단 고정 여부를 설정할 수 있습니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <FormLayout
              id="notice-editor-form"
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-5 py-2 pr-1"
            >
              <form.AppField name="title">{(field) => <field.Input label="제목" placeholder="제목을 입력해 주세요." disabled={readOnly} required />}</form.AppField>
              <form.AppField name="content">{(field) => readOnly ? <EditorViewer content={field.state.value} /> : <field.Editor label="내용" required />}</form.AppField>
              <div className="
                grid gap-4
                sm:grid-cols-2
              "
              >
                <form.AppField name="importance">{(field) => <field.Select label="중요도" options={importanceOptions} disabled={readOnly} required />}</form.AppField>
                <form.AppField name="status">{(field) => <field.Select label="게시 상태" options={statusOptions} disabled={readOnly} required />}</form.AppField>
              </div>
              <form.AppField name="isPinned">{(field) => <field.Checkbox label="상단 고정" description="공지사항 목록 상단에 고정합니다." disabled={readOnly} showError={false} />}</form.AppField>
            </FormLayout>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={() => close?.(false)}>{readOnly ? '닫기' : '취소'}</Button>
            {!readOnly && <form.Submit form="notice-editor-form">저장</form.Submit>}
          </Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}

function getEditorTitle(readOnly: boolean, hasNotice: boolean): string {
  if (readOnly) return '공지사항 상세';
  if (hasNotice) return '공지사항 수정';
  return '공지사항 등록';
}
