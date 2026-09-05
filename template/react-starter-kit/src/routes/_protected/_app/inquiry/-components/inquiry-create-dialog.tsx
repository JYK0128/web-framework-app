import { useQueryClient } from '@tanstack/react-query';
import { Clock } from 'lucide-react';

import { getInquiriesControllerGetInquiriesQueryKey, useInquiriesControllerCreateInquiry } from '#/.generated/api/endpoints/inquiries/inquiries';
import { useSystemConfigControllerGetSystemConfig } from '#/.generated/api/endpoints/system-config/system-config';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';
import { getInquiryCategoryOptions } from '#/routes/_protected/_app/inquiry/-configs/inquiry.config';

type InquiryCreateDialogProps = DialogComponentProps<boolean>;

export function InquiryCreateDialog({
  open,
  onOpenChange,
  close,
}: InquiryCreateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>{t('inquiry.newInquiry')}</DialogTitle>
          <DialogDescription>{t('inquiry.pageDescription')}</DialogDescription>
        </DialogHeader>
        <InquiryCreateForm onSuccess={() => close?.(true)} />
      </DialogContent>
    </Dialog>
  );
}

type InquiryCreateFormProps = { onSuccess: () => void };

function InquiryCreateForm({ onSuccess }: InquiryCreateFormProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const mutation = useInquiriesControllerCreateInquiry();
  const configQuery = useSystemConfigControllerGetSystemConfig();
  const operatingStatus = configQuery.data?.operatingStatus;
  const isClosed = operatingStatus && !operatingStatus.isOpen;
  const categoryOptions = getInquiryCategoryOptions(t);

  const form = useAppForm({
    defaultValues: {
      category: categoryOptions[0]?.value ?? '',
      title: '',
      content: '',
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        data: {
          category: value.category.trim(),
          title: value.title.trim(),
          content: value.content.trim(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiriesQueryKey() });
      onSuccess();
    },
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="flex flex-col gap-4"
      >
        {isClosed && operatingStatus?.message && (
          <div className="
            flex items-start gap-2.5 rounded-lg border border-amber-500/20
            bg-amber-500/10 p-3 text-xs text-amber-800
            dark:text-amber-300
          "
          >
            <Clock className="
              size-4 shrink-0 mt-0.5 text-amber-600
              dark:text-amber-400
            "
            />
            <p className="leading-relaxed whitespace-pre-line">{operatingStatus.message}</p>
          </div>
        )}
        <form.AppField name="category">
          {(field) => (
            <field.Select
              label={t('inquiry.category')}
              options={categoryOptions}
              placeholder={t('inquiry.categoryPlaceholder')}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="title">
          {(field) => (
            <field.Input
              label={t('inquiry.title')}
              placeholder={t('inquiry.titlePlaceholder')}
              maxLength={255}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="content">
          {(field) => (
            <field.Textarea
              label={t('inquiry.content')}
              placeholder={t('inquiry.contentPlaceholder')}
              rows={8}
              maxLength={10000}
              required
            />
          )}
        </form.AppField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={mutation.isPending}>
            {t('app.dialog.cancel')}
          </Button>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('inquiry.processing') : t('inquiry.save')}
          </Button>
        </DialogFooter>

      </FormLayout>
    </form.AppForm>
  );
}
