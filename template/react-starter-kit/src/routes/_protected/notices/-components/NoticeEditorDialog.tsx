import { useI18n } from '@pkg/shared/web';

import type { CreateNoticeRequestDto, NoticeItemDto, UpdateNoticeRequestDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';

type NoticeEditorDialogProps = {
  open: boolean
  notice: NoticeItemDto | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreateNoticeRequestDto | UpdateNoticeRequestDto) => Promise<void>
};

type NoticeFormState = {
  title: string
  content: string
  priority: string
  publishedAt: string
  expiresAt: string
};

function toDateTimeLocal(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function emptyForm(): NoticeFormState {
  return { title: '', content: '', priority: '0', publishedAt: '', expiresAt: '' };
}

function formFromNotice(notice: NoticeItemDto): NoticeFormState {
  return {
    title: notice.title,
    content: notice.content,
    priority: String(notice.priority),
    publishedAt: toDateTimeLocal(notice.publishedAt),
    expiresAt: toDateTimeLocal(notice.expiresAt),
  };
}

export function NoticeEditorDialog({ open, notice, isSaving, onOpenChange, onSave }: NoticeEditorDialogProps) {
  const { t } = useI18n();
  const noticeForm = useAppForm({
    defaultValues: notice ? formFromNotice(notice) : emptyForm(),
    onSubmit: async ({ value }) => {
      await onSave({
        title: value.title.trim(),
        content: value.content.trim(),
        priority: Number(value.priority) as 0 | 1 | 2,
        publishedAt: value.publishedAt ? new Date(value.publishedAt).toISOString() : null,
        expiresAt: value.expiresAt ? new Date(value.expiresAt).toISOString() : null,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{notice ? t('notices.editTitle') : t('notices.createTitle')}</DialogTitle>
        </DialogHeader>
        <noticeForm.AppForm>
          <FormLayout
            onSubmit={() => void noticeForm.handleSubmit()}
            className="grid gap-2"
          >
            <noticeForm.AppField name="title">
              {(field) => <field.Input label={t('notices.titleField')} showError={false} required />}
            </noticeForm.AppField>
            <noticeForm.AppField name="content">
              {(field) => (
                <field.Textarea
                  label={t('notices.content')}
                  showError={false}
                  className="min-h-56"
                  required
                />
              )}
            </noticeForm.AppField>
            <noticeForm.AppField name="priority">
              {(field) => (
                <field.Select
                  label={t('notices.priority')}
                  showError={false}
                  options={[
                    { label: t('notices.priorityNormal'), value: '0' },
                    { label: t('notices.priorityImportant'), value: '1' },
                    { label: t('notices.priorityUrgent'), value: '2' },
                  ]}
                />
              )}
            </noticeForm.AppField>
            <noticeForm.AppField name="publishedAt">
              {(field) => (
                <field.DateTimePicker
                  label={t('notices.publishedAt')}
                  showError={false}
                  placeholder={t('notices.publishedAt')}
                />
              )}
            </noticeForm.AppField>
            <noticeForm.AppField name="expiresAt">
              {(field) => (
                <field.DateTimePicker
                  label={t('notices.expiresAtField')}
                  showError={false}
                  placeholder={t('notices.expiresAtField')}
                />
              )}
            </noticeForm.AppField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? t('common.processing') : t('common.save')}</Button>
            </DialogFooter>
          </FormLayout>
        </noticeForm.AppForm>
      </DialogContent>
    </Dialog>
  );
}
