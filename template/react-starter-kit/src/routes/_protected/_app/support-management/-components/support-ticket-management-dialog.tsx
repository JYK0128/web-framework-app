import { useQueryClient } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';

import { getSupportControllerGetAdminSupportTicketQueryKey, getSupportControllerGetAdminSupportTicketsQueryKey, useSupportControllerUpdateAdminSupportTicket } from '#/.generated/api/endpoints/support/support';
import { type SupportTicketItemDto, SupportTicketPriority, SupportTicketStatus, type UpdateAdminSupportTicketRequestDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Separator } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { type ModalComponentProps } from '#/components/modal';
import { useI18n } from '#/hooks';
import { SupportTicketPriorityBadge, SupportTicketStatusBadge } from '#/routes/_protected/_app/support/-components/support-ticket-badges';

type SupportTicketManagementDialogProps = ModalComponentProps<boolean> & {
  ticket: SupportTicketItemDto
};

export function SupportTicketManagementDialog({ ticket, open, onOpenChange, close }: SupportTicketManagementDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('supportManagement.detailTitle')}</DialogTitle>
          <DialogDescription>{t('supportManagement.detailDescription')}</DialogDescription>
        </DialogHeader>
        <SupportTicketManagementForm key={ticket.id} ticket={ticket} onSuccess={() => close?.(true)} />
      </DialogContent>
    </Dialog>
  );
}

function SupportTicketManagementForm({ ticket, onSuccess }: { ticket: SupportTicketItemDto, onSuccess: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const mutation = useSupportControllerUpdateAdminSupportTicket();

  const form = useAppForm({
    defaultValues: {
      status: ticket.status,
      priority: ticket.priority,
      resolution: ticket.resolution ?? '',
    },
    onSubmit: async ({ value }) => {
      const payload: UpdateAdminSupportTicketRequestDto = {
        status: value.status,
        priority: value.priority,
        resolution: value.resolution.trim() || null,
      };
      await mutation.mutateAsync({ id: ticket.id, data: payload });
      await queryClient.invalidateQueries({ queryKey: getSupportControllerGetAdminSupportTicketsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getSupportControllerGetAdminSupportTicketQueryKey(ticket.id) });
      onSuccess();
    },
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-2 rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <SupportTicketStatusBadge status={ticket.status} />
            <SupportTicketPriorityBadge priority={ticket.priority} />
            <span className="text-xs text-muted-foreground">{ticket.category}</span>
          </div>
          <div className="text-base font-semibold">{ticket.title}</div>
          <div className="whitespace-pre-wrap text-sm/6 text-muted-foreground">
            {ticket.content}
          </div>
          <Separator className="my-1" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserRound className="size-3.5" />
            {t('supportManagement.user')}
            :
            {ticket.userName}
            <span className="ml-2">
              {t('supportManagement.assignee')}
              :
              {' '}
              {ticket.assigneeName ?? t('supportManagement.unassigned')}
            </span>
          </div>
        </div>
        <div className="
          grid gap-4
          sm:grid-cols-2
        "
        >
          <form.AppField name="status">
            {(field) => (
              <field.Select
                label={t('supportManagement.status')}
                options={[
                  { value: SupportTicketStatus.open, label: t('support.statuses.open') },
                  { value: SupportTicketStatus.in_progress, label: t('support.statuses.in_progress') },
                  { value: SupportTicketStatus.resolved, label: t('support.statuses.resolved') },
                  { value: SupportTicketStatus.closed, label: t('support.statuses.closed') },
                ]}
              />
            )}
          </form.AppField>
          <form.AppField name="priority">
            {(field) => (
              <field.Select
                label={t('supportManagement.priority')}
                options={[
                  { value: SupportTicketPriority.low, label: t('support.priorities.low') },
                  { value: SupportTicketPriority.normal, label: t('support.priorities.normal') },
                  { value: SupportTicketPriority.high, label: t('support.priorities.high') },
                  { value: SupportTicketPriority.urgent, label: t('support.priorities.urgent') },
                ]}
              />
            )}
          </form.AppField>
        </div>
        <form.AppField name="resolution">
          {(field) => <field.Textarea label={t('supportManagement.resolution')} placeholder={t('supportManagement.resolutionPlaceholder')} rows={7} />}
        </form.AppField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={mutation.isPending}>{t('app.dialog.cancel')}</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? t('supportManagement.processing') : t('supportManagement.save')}</Button>
        </DialogFooter>
      </FormLayout>
    </form.AppForm>
  );
}
