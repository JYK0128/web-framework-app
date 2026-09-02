import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { getInquiriesControllerGetInquiriesQueryKey, useInquiriesControllerCreateInquiry } from '#/.generated/api/endpoints/inquiries/inquiries';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';
import { getInquiryCategoryOptions } from '#/routes/_protected/_app/inquiry/-configs/inquiry.config';

export function InquiryCreateDialog() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={(
        <Button className="gap-2 self-start shadow-xs">
          <Plus className="size-4" />
          {t('inquiries.newInquiry')}
        </Button>
      )}
      />
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>{t('inquiries.newInquiry')}</DialogTitle>
          <DialogDescription>{t('inquiries.pageDescription')}</DialogDescription>
        </DialogHeader>
        <InquiryCreateForm onSuccess={() => setOpen(false)} />
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
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.processing') : t('common.save')}
          </Button>
        </DialogFooter>

      </FormLayout>
    </form.AppForm>
  );
}
