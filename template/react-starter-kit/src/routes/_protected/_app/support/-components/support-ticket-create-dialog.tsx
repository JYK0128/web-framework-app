import { useQueryClient } from '@tanstack/react-query';

import { getSupportControllerGetSupportTicketsQueryKey, useSupportControllerCreateSupportTicket } from '#/.generated/api/endpoints/support/support';
import { type CreateSupportTicketRequestDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type ModalComponentProps } from '#/components/modal';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';
import { getSupportCategoryOptions } from '#/routes/_protected/_app/support/-configs/support.config';

type SupportTicketCreateDialogProps = ModalComponentProps<boolean>;

export function SupportTicketCreateDialog({ open, onOpenChange, close }: SupportTicketCreateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('support.newTicket')}</DialogTitle>
          <DialogDescription>{t('support.createDescription')}</DialogDescription>
        </DialogHeader>
        <SupportTicketCreateForm onSuccess={() => close?.(true)} />
      </DialogContent>
    </Dialog>
  );
}

function SupportTicketCreateForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const mutation = useSupportControllerCreateSupportTicket();
  const categoryOptions = getSupportCategoryOptions(t);

  const form = useAppForm({
    defaultValues: {
      category: categoryOptions[0]?.value ?? '',
      title: '',
      content: '',
    },
    onSubmit: async ({ value }) => {
      const payload: CreateSupportTicketRequestDto = {
        category: value.category.trim(),
        title: value.title.trim(),
        content: value.content.trim(),
      };
      await mutation.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: getSupportControllerGetSupportTicketsQueryKey() });
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
          {(field) => <field.Select label={t('support.category')} options={categoryOptions} placeholder={t('support.categoryPlaceholder')} required />}
        </form.AppField>
        <form.AppField name="title">
          {(field) => <field.Input label={t('support.title')} placeholder={t('support.titlePlaceholder')} maxLength={255} required />}
        </form.AppField>
        <form.AppField name="content">
          {(field) => <field.Textarea label={t('support.content')} placeholder={t('support.contentPlaceholder')} rows={8} required />}
        </form.AppField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={mutation.isPending}>{t('app.dialog.cancel')}</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? t('support.processing') : t('support.save')}</Button>
        </DialogFooter>
      </FormLayout>
    </form.AppForm>
  );
}
