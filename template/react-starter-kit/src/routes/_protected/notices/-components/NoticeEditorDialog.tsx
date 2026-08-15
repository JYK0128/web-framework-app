import { useI18n } from '@pkg/shared/web';

import type { CreateNoticeRequestDto, NoticeItemDto, UpdateNoticeRequestDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';

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
  isPinned: boolean
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
  return { title: '', content: '', isPinned: false, priority: '0', publishedAt: '', expiresAt: '' };
}

function formFromNotice(notice: NoticeItemDto): NoticeFormState {
  return {
    title: notice.title,
    content: notice.content,
    isPinned: notice.isPinned,
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
        isPinned: value.isPinned,
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void noticeForm.handleSubmit();
            }}
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
            <div className="flex justify-end">
              <div className="w-fit">
                <noticeForm.AppField name="isPinned">
                  {(field) => (
                    <field.Checkbox
                      label={t('notices.pinned')}
                      orientation="horizontal"
                      showError={false}
                      className="mt-0.5"
                    />
                  )}
                </noticeForm.AppField>
              </div>
            </div>
            <noticeForm.AppField name="priority">
              {(field) => (
                <field.Select
                  label={t('notices.priorityField')}
                  showError={false}
                  items={[
                    { value: '0', label: t('notices.normal') },
                    { value: '1', label: t('notices.important') },
                    { value: '2', label: t('notices.urgent') },
                  ]}
                />
              )}
            </noticeForm.AppField>
            <noticeForm.AppField name="publishedAt">
              {(field) => (
                <field.DateTimePicker
                  label={t('notices.publishSchedule')}
                  showError={false}
                  placeholder={t('notices.publishSchedule')}
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
          </form>
        </noticeForm.AppForm>
      </DialogContent>
    </Dialog>
  );
}
