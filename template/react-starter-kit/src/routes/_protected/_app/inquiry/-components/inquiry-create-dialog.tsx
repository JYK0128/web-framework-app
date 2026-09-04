import { useQueryClient } from '@tanstack/react-query';

import { getInquiriesControllerGetInquiriesQueryKey, useInquiriesControllerCreateInquiry } from '#/.generated/api/endpoints/inquiries/inquiries';
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
