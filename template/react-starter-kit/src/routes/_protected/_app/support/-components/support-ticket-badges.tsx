import type { SupportTicketPriority, SupportTicketStatus } from '#/.generated/api/model';
import { Badge } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

export function SupportTicketStatusBadge({
  status,
  className,
}: {
  status: SupportTicketStatus
  className?: string
}) {
  const { t } = useI18n();
  const label = t(`support.statuses.${status}`);

  if (status === 'closed') {
    return (
      <Badge
        variant="outline"
        className={`
          font-medium text-muted-foreground
          ${className ?? ''}
        `}
      >
        {label}
      </Badge>
    );
  }

  if (status === 'resolved') {
    return (
      <Badge className={`
        border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-700
        dark:text-emerald-400
        ${className ?? ''}
      `}
      >
        {label}
      </Badge>
    );
  }

  if (status === 'in_progress') {
    return (
      <Badge className={`
        border-sky-500/30 bg-sky-500/10 font-medium text-sky-700
        dark:text-sky-400
        ${className ?? ''}
      `}
      >
        {label}
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`
        border-amber-500/30 bg-amber-500/15 font-medium text-amber-700
        dark:text-amber-400
        ${className ?? ''}
      `}
    >
      {label}
    </Badge>
  );
}

export function SupportTicketPriorityBadge({
  priority,
  className,
}: {
  priority: SupportTicketPriority
  className?: string
}) {
  const { t } = useI18n();
  const label = t(`support.priorities.${priority}`);

  if (priority === 'urgent') {
    return (
      <Badge className={`
        border-red-500/30 bg-red-500/10 font-medium text-red-700
        dark:text-red-400
        ${className ?? ''}
      `}
      >
        {label}
      </Badge>
    );
  }

  if (priority === 'high') {
    return (
      <Badge className={`
        border-orange-500/30 bg-orange-500/10 font-medium text-orange-700
        dark:text-orange-400
        ${className ?? ''}
      `}
      >
        {label}
      </Badge>
    );
  }

  if (priority === 'low') {
    return (
      <Badge
        variant="outline"
        className={`
          font-medium text-muted-foreground
          ${className ?? ''}
        `}
      >
        {label}
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`
        font-medium
        ${className ?? ''}
      `}
    >
      {label}
    </Badge>
  );
}
