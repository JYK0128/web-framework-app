import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getInquiriesControllerGetInquiriesQueryKey, useInquiriesControllerCreateInquiry } from '#/.generated/api/endpoints/inquiries/inquiries';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';

interface InquiryCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InquiryCreateDialog({ open, onOpenChange }: InquiryCreateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('inquiries.newInquiry')}</DialogTitle>
          <DialogDescription>{t('inquiries.pageDescription')}</DialogDescription>
        </DialogHeader>
        {open && <InquiryCreateForm key={String(open)} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function InquiryCreateForm({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const mutation = useInquiriesControllerCreateInquiry();
  const categoryOptions = useMemo(() => [
    { label: t('inquiries.categories.service'), value: t('inquiries.categories.service') },
    { label: t('inquiries.categories.account'), value: t('inquiries.categories.account') },
    { label: t('inquiries.categories.payment'), value: t('inquiries.categories.payment') },
    { label: t('inquiries.categories.technical'), value: t('inquiries.categories.technical') },
    { label: t('inquiries.categories.etc'), value: t('inquiries.categories.etc') },
  ], [t]);

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
      onClose();
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
              label={t('inquiries.category')}
              options={categoryOptions}
              placeholder={t('inquiries.categoryPlaceholder')}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="title">
          {(field) => (
            <field.Input
              label={t('inquiries.title')}
              placeholder={t('inquiries.titlePlaceholder')}
              maxLength={255}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="content">
          {(field) => (
            <field.Textarea
              label={t('inquiries.content')}
              placeholder={t('inquiries.contentPlaceholder')}
              rows={8}
              maxLength={10000}
              required
            />
          )}
        </form.AppField>
        <DialogFooter className="
          gap-2 pt-2
          sm:gap-0
        "
        >
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {t('inquiries.cancel')}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('inquiries.saving') : t('inquiries.submit')}
          </Button>
        </DialogFooter>
      </FormLayout>
    </form.AppForm>
  );
}
