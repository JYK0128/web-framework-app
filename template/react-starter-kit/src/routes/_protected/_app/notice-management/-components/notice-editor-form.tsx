import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { getNoticesControllerGetAdminNoticesQueryKey, useNoticesControllerCreateNotice, useNoticesControllerUpdateNotice } from '#/.generated/api/endpoints/notices/notices';
import { type CreateNoticeRequestDto, type NoticeItemDto, NoticePriority } from '#/.generated/api/model';
import { Button, DialogFooter } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';
import { when } from '@pkg/shared/common';

export function NoticeEditorForm({
  notice,
  onSuccess,
}: {
  notice: NoticeItemDto | null
  onSuccess: () => void
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const createMutation = useNoticesControllerCreateNotice();
  const updateMutation = useNoticesControllerUpdateNotice();
  const [isSaving, setIsSaving] = useState(false);

  const noticeForm = useAppForm({
    defaultValues: {
      title: notice?.title ?? '',
      content: notice?.content ?? '',
      priority: notice?.priority ?? NoticePriority.LOW,
      publishedAt: when((value): value is string => Boolean(value), (publishedAt) => new Date(publishedAt))(notice?.publishedAt),
      expiresAt: when((value): value is string => Boolean(value), (expiresAt) => new Date(expiresAt))(notice?.expiresAt),
    },
    onSubmit: async ({ value }) => {
      const payload: CreateNoticeRequestDto = {
        title: value.title.trim(),
        content: value.content.trim(),
        priority: value.priority,
        publishedAt: value.publishedAt?.toISOString() ?? null,
        expiresAt: value.expiresAt?.toISOString() ?? null,
      };

      setIsSaving(true);
      try {
        if (notice) await updateMutation.mutateAsync({ id: notice.id, data: payload });
        else await createMutation.mutateAsync({ data: payload });
        await queryClient.invalidateQueries({ queryKey: getNoticesControllerGetAdminNoticesQueryKey() });
        toast.success(notice ? t('notices.editSuccess') : t('notices.createSuccess'));
        onSuccess();
      }
      catch {
        toast.error(t('common.error'));
      }
      finally {
        setIsSaving(false);
      }
    },
  });

  return (
    <noticeForm.AppForm>
      <FormLayout
        onSubmit={() => void noticeForm.handleSubmit()}
        className="grid gap-1"
      >
        <noticeForm.AppField name="title">
          {(field) => <field.Input label={t('notices.fields.title')} placeholder={t('notices.placeholders.title')} required />}
        </noticeForm.AppField>
        <noticeForm.AppField name="content">
          {(field) => <field.Textarea label={t('notices.fields.content')} placeholder={t('notices.placeholders.content')} rows={6} required />}
        </noticeForm.AppField>
        <div className="grid gap-1">
          <noticeForm.AppField name="priority">
            {(field) => <field.Select label={t('notices.fields.priority')} options={[{ value: NoticePriority.LOW, label: t('notices.priority.normal') }, { value: NoticePriority.NORMAL, label: t('notices.priority.important') }, { value: NoticePriority.HIGH, label: t('notices.priority.urgent') }]} />}
          </noticeForm.AppField>
          <div className="grid grid-cols-1 gap-1">
            <noticeForm.AppField name="publishedAt">
              {(field) => <field.DateTimePicker label={t('notices.fields.publishedAt')} />}
            </noticeForm.AppField>
            <noticeForm.AppField name="expiresAt">
              {(field) => <field.DateTimePicker label={t('notices.fields.expiresAt')} />}
            </noticeForm.AppField>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? t('common.processing') : t('common.save')}</Button>
        </DialogFooter>
      </FormLayout>
    </noticeForm.AppForm>
  );
}
