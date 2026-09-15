import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, UserRound } from 'lucide-react';

import { getSupportControllerGetSupportTicketQueryKey, getSupportControllerGetSupportTicketsQueryKey, useSupportControllerUpdateSupportTicket } from '#/.generated/api/endpoints/support/support';
import type { SupportTicketItemDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Separator } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

import { SupportTicketPriorityBadge, SupportTicketStatusBadge } from './support-ticket-badges';

type SupportTicketDetailDialogProps = DialogComponentProps<boolean> & {
  ticket: SupportTicketItemDto
};

export function SupportTicketDetailDialog({ ticket, open, onOpenChange, close }: SupportTicketDetailDialogProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const updateMutation = useSupportControllerUpdateSupportTicket();
  const canClose = ticket.status !== 'closed';

  const handleCloseTicket = async () => {
    await updateMutation.mutateAsync({ id: ticket.id, data: { status: 'closed' } });
    await queryClient.invalidateQueries({ queryKey: getSupportControllerGetSupportTicketsQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getSupportControllerGetSupportTicketQueryKey(ticket.id) });
    close?.(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket.title}</DialogTitle>
          <DialogDescription>{t('support.detailDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <SupportTicketStatusBadge status={ticket.status} />
            <SupportTicketPriorityBadge priority={ticket.priority} />
            <span className="text-xs text-muted-foreground">{ticket.category}</span>
          </div>
          <div className="grid gap-2 rounded-lg border bg-muted/20 p-4">
            <div className="whitespace-pre-wrap text-sm/6">{ticket.content}</div>
          </div>
          <div className="
            grid gap-2 text-xs text-muted-foreground
            sm:grid-cols-2
          "
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="size-3.5" />
              {t('support.createdAt')}
              :
              {new Date(ticket.createdAt).toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <UserRound className="size-3.5" />
              {t('support.assignee')}
              :
              {ticket.assigneeName ?? t('support.unassigned')}
            </div>
          </div>
          <Separator />
          <div className="grid gap-2">
            <div className="text-sm font-medium">{t('support.resolution')}</div>
            <div className="whitespace-pre-wrap text-sm/6 text-muted-foreground">
              {ticket.resolution ?? t('support.noResolution')}
            </div>
          </div>
        </div>
        <DialogFooter>
          {canClose && (
            <Button type="button" variant="outline" onClick={() => void handleCloseTicket()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('support.processing') : t('support.closeTicket')}
            </Button>
          )}
          <Button type="button" onClick={() => close?.(false)}>{t('app.dialog.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
